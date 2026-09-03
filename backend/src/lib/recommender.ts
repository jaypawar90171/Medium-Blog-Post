import { sql } from './neon'

// Tunable weights
const ALPHA = 0.4   // topic affinity
const BETA = 0.25   // social affinity
const GAMMA = 0.2   // popularity
const DELTA = 0.15  // recency decay

// Per-signal weights for tag interest
const CLAP_WEIGHT = 1
const COMMENT_WEIGHT = 3
const BOOKMARK_WEIGHT = 2.5

// Recency decay half-life in days
const LAMBDA = 0.03

// Explore pool ratio (20% of feed)
const EXPLORE_RATIO = 0.2

// How many candidate posts to fetch for scoring
const CANDIDATE_LIMIT = 500

type WhoToFollowUser = {
  id: string
  name: string | null
  username: string | null
  avatar: string | null
  bio: string | null
  mutualCount: number
}

type RecommendResult = {
  blogs: any[]
  pagination: { page: number; pageSize: number; total: number; totalPages: number }
  whoToFollow: WhoToFollowUser[]
}

// based on the user's interactions, compute the topic affinity
// use recency decay to weight the interactions (newer interactions are weighted more)
// use the base weights to weight the interactions (comment > bookmark > clap)
// return the tags that the user has interacted with along with the weight of the interaction
export async function buildTagInterest(userId: string): Promise<Map<string, number>> {
  const rows = await sql`
    SELECT
      pt."tagId",
      t.name AS "tagName",
      c."source",
      c."createdAt" AS "signalDate"
    FROM (
      SELECT cl."postId", 'clap' AS source, cl."createdAt"
      FROM "Clap" cl WHERE cl."userId" = ${userId}
      UNION ALL
      SELECT cm."postId", 'comment' AS source, cm."createdAt"
      FROM "Comment" cm WHERE cm."authorId" = ${userId}
      UNION ALL
      SELECT bk."postId", 'bookmark' AS source, bk."createdAt"
      FROM "Bookmark" bk WHERE bk."userId" = ${userId}
    ) c
    JOIN "PostTag" pt ON pt."postId" = c."postId"
    JOIN "Tag" t ON t.id = pt."tagId"
  `

  const tagWeights = new Map<string, { weight: number; name: string }>()
  const now = Date.now()

  for (const row of rows) {
    const tagId = row.tagId as string
    const source = row.source as string
    const signalDate = new Date(row.signalDate as string).getTime()
    const ageDays = Math.max((now - signalDate) / (1000 * 60 * 60 * 24), 0.1)

    const baseWeight =
      source === 'clap' ? CLAP_WEIGHT :
      source === 'comment' ? COMMENT_WEIGHT :
      source === 'bookmark' ? BOOKMARK_WEIGHT : 0

    const decayedWeight = baseWeight * Math.exp(-LAMBDA * ageDays)

    const existing = tagWeights.get(tagId)
    if (existing) {
      existing.weight += decayedWeight
    } else {
      tagWeights.set(tagId, { weight: decayedWeight, name: row.tagName as string })
    }
  }

  const interest = new Map<string, number>()
  for (const [tagId, { weight }] of tagWeights) {
    interest.set(tagId, weight)
  }
  return interest
}

// return the users that the user follows along with the weight of the interaction used for social affinity
// social affinity is based on the user's follows and 2-hop followers-of-followers
// use recency decay to weight the interactions (newer interactions are weighted more)
export async function getWhoToFollow(userId: string, limit = 5): Promise<WhoToFollowUser[]> {
  const rows = await sql`
    SELECT
      u.id,
      u.name,
      u.username,
      u.avatar,
      u.bio,
      COUNT(DISTINCT f2."followerId")::int AS "mutualCount"
    FROM "Follow" f1
    JOIN "Follow" f2 ON f2."followerId" = f1."followingId"
    JOIN "User" u ON u.id = f2."followingId"
    WHERE f1."followerId" = ${userId}
      AND u.id != ${userId}
      AND NOT EXISTS (
        SELECT 1 FROM "Follow" my
        WHERE my."followerId" = ${userId} AND my."followingId" = u.id
      )
    GROUP BY u.id, u.name, u.username, u.avatar, u.bio
    ORDER BY "mutualCount" DESC, u.name ASC
    LIMIT ${limit}
  `

  return rows.map((r: any) => ({
    id: r.id,
    name: r.name,
    username: r.username,
    avatar: r.avatar,
    bio: r.bio,
    mutualCount: r.mutualCount,
  }))
}

export async function getRecommendedPosts(
  userId: string,
  page: number,
  pageSize: number,
): Promise<RecommendResult> {
  const tagInterest = await buildTagInterest(userId)
  const whoToFollow = await getWhoToFollow(userId)

  // Fetch followed user IDs for social affinity
  const followedRows = await sql`SELECT "followingId" FROM "Follow" WHERE "followerId" = ${userId}`
  const followedIds = new Set<string>(followedRows.map((r: any) => r.followingId as string))

  // Fetch 2-hop followings for social term
  const twoHopRows = await sql`
    SELECT DISTINCT f2."followingId"
    FROM "Follow" f1
    JOIN "Follow" f2 ON f2."followerId" = f1."followingId"
    WHERE f1."followerId" = ${userId}
  `
  const twoHopIds = new Set<string>(twoHopRows.map((r: any) => r.followingId as string))

  const userTagIds = new Set(tagInterest.keys())

  // Fetch candidate posts (recent, bounded)
  const candidates = await sql`
    SELECT
      p.id,
      p.title,
      p.content,
      p."summary",
      p."coverImage",
      p."published",
      p."readingTime",
      p.views,
      p."createdAt",
      p."updatedAt",
      p."authorId",
      au.id AS "authorId_col",
      au.name AS "authorName",
      au.username AS "authorUsername",
      au.avatar AS "authorAvatar",
      COALESCE(
        jsonb_agg(
          jsonb_build_object('tag', jsonb_build_object('id', tg.id, 'name', tg.name))
        ) FILTER (WHERE tg.id IS NOT NULL),
        '[]'::jsonb
      ) AS tags,
      (SELECT COUNT(*)::int FROM "Comment" cc WHERE cc."postId" = p.id) AS "commentCount",
      (SELECT COALESCE(SUM(cl.count), 0)::int FROM "Clap" cl WHERE cl."postId" = p.id) AS "clapCount",
      (SELECT COUNT(*)::int FROM "Bookmark" bk WHERE bk."postId" = p.id) AS "bookmarkCount",
      EXTRACT(EPOCH FROM (NOW() - p."createdAt")) / 86400.0 AS "ageDays"
    FROM "Post" p
    JOIN "User" au ON au.id = p."authorId"
    LEFT JOIN "PostTag" pt ON pt."postId" = p.id
    LEFT JOIN "Tag" tg ON tg.id = pt."tagId"
    WHERE p."published" = true
      AND p."authorId" != ${userId}
    GROUP BY p.id, au.id, au.name, au.username, au.avatar
    ORDER BY p."createdAt" DESC
    LIMIT ${CANDIDATE_LIMIT}
  `

  if (candidates.length === 0) {
    return {
      blogs: [],
      pagination: { page, pageSize, total: 0, totalPages: 0 },
      whoToFollow,
    }
  }

  // Score each candidate in JS
  const scored = candidates.map((post: any) => {
    const postTags: Array<{ tag: { id: string; name: string } }> = post.tags || []

    // Topic affinity: average of user's tag weights for this post's tags
    let topicScore = 0
    if (postTags.length > 0 && userTagIds.size > 0) {
      let sum = 0
      for (const pt of postTags) {
        sum += tagInterest.get(pt.tag.id) || 0
      }
      topicScore = sum / postTags.length
    }

    // Social affinity: direct follow = 1.0, 2-hop = 0.5
    let socialScore = 0
    if (followedIds.has(post.authorId)) {
      socialScore = 1.0
    } else if (twoHopIds.has(post.authorId)) {
      socialScore = 0.5
    }

    // Popularity: engagement velocity
    const ageDays = Math.max(Number(post.ageDays) || 1, 1)
    const totalEngagement =
      (Number(post.clapCount) || 0) +
      (Number(post.commentCount) || 0) +
      (Number(post.bookmarkCount) || 0) +
      (Number(post.views) || 0) * 0.1
    const popularityScore = Math.min(1, totalEngagement / (ageDays * 5 + 10))

    // Recency decay
    const recencyScore = ageDays / 365

    const score =
      ALPHA * topicScore +
      BETA * socialScore +
      GAMMA * popularityScore -
      DELTA * recencyScore

    return { post, score, topicScore }
  })

  // Split into relevance pool and explore pool
  const exploreThreshold = 0.01
  const relevancePool = scored.filter((s) => s.topicScore >= exploreThreshold)
  const explorePool = scored.filter((s) => s.topicScore < exploreThreshold)

  relevancePool.sort((a, b) => b.score - a.score)
  explorePool.sort((a, b) => b.score - a.score)

  // Interleave: ~80% relevance, ~20% explore
  const relevanceCount = Math.ceil(pageSize * (1 - EXPLORE_RATIO))
  const exploreCount = pageSize - relevanceCount

  const merged = [
    ...relevancePool.slice(0, relevanceCount),
    ...explorePool.slice(0, exploreCount),
  ].sort((a, b) => b.score - a.score)

  const totalCount = scored.length
  const totalPages = Math.ceil(totalCount / pageSize)

  const offset = (page - 1) * pageSize
  const paged = merged.slice(offset, offset + pageSize)

  const blogs = paged.map(({ post }: any) => ({
    id: post.id,
    title: post.title,
    content: post.content,
    summary: post.summary,
    coverImage: post.coverImage,
    published: post.published,
    readingTime: post.readingTime,
    views: post.views,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    author: {
      id: post.authorId_col,
      name: post.authorName,
      username: post.authorUsername,
      avatar: post.authorAvatar,
    },
    tags: post.tags || [],
    _count: {
      comments: post.commentCount ?? 0,
      claps: post.clapCount ?? 0,
      bookmarks: post.bookmarkCount ?? 0,
    },
  }))

  return {
    blogs,
    pagination: { page, pageSize, total: totalCount, totalPages },
    whoToFollow,
  }
}

export async function getRecommendations(
  userId: string,
  page: number,
  pageSize: number,
): Promise<RecommendResult> {
  try {
    return await getRecommendedPosts(userId, page, pageSize)
  } catch (err) {
    console.error('Recommendation engine error:', err)
    throw err
  }
}
