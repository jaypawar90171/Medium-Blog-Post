import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { prisma, type Variables } from '../lib/prisma'
import { sql } from '../lib/neon'
import {
  createBlogInput,
  updateBlogInput,
  blogIdParams,
} from '../lib/schemas'
import { authMiddleware } from '../middleware/auth'
import { getRecommendations } from '../lib/recommender'

export const blogRouter = new Hono<{ Variables: Variables }>()
blogRouter.use('*', authMiddleware)

const postPublicSelect = {
  id: true,
  title: true,
  content: true,
  summary: true,
  coverImage: true,
  published: true,
  readingTime: true,
  views: true,
  createdAt: true,
  updatedAt: true,
  author: {
    select: {
      id: true,
      name: true,
      username: true,
      avatar: true,
    },
  },
  tags: {
    select: {
      tag: { select: { id: true, name: true } },
    },
  },
  _count: {
    select: {
      comments: true,
      claps: true,
      bookmarks: true,
    },
  },
}

function readingTime(content: string): number {
  const text = content
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(nbsp|amp|lt|gt|quot);/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return Math.max(1, Math.ceil(text.split(/\s+/).length / 200))
}

function tagWrites(tags: string[] | undefined) {
  return (tags ?? []).map((name) => ({
    tag: {
      connectOrCreate: {
        where: { name },
        create: { name },
      },
    },
  }))
}

blogRouter.get('/search', async (c) => {
  const q = (c.req.query('q') || '').trim()
  const page = Math.max(1, parseInt(c.req.query('page') || '1', 10) || 1)
  const pageSize = Math.min(
    50,
    Math.max(1, parseInt(c.req.query('pageSize') || '10', 10) || 10)
  )

  if (!q) {
    return c.json({ blogs: [], pagination: { page, pageSize, total: 0, totalPages: 0 } })
  }

  const query = websearch(q)
  const offset = (page - 1) * pageSize

  const [rows, totalRows] = await Promise.all([
    sql`  
      SELECT
        p.id, p.title, p.content, p."summary", p."coverImage", p."published",
        p."readingTime", p.views, p."createdAt", p."updatedAt",
        to_jsonb(a) AS author,
        COALESCE(
          jsonb_agg(
            jsonb_build_object('tag', jsonb_build_object('id', t.id, 'name', t.name))
          ) FILTER (WHERE t.id IS NOT NULL),
          '[]'::jsonb
        ) AS tags,
        (SELECT COUNT(*)::int FROM "Comment" cc WHERE cc."postId" = p.id) AS comment_count,
        (SELECT COALESCE(SUM(cl.count), 0)::int FROM "Clap" cl WHERE cl."postId" = p.id) AS clap_count,
        (SELECT COUNT(*)::int FROM "Bookmark" bk WHERE bk."postId" = p.id) AS bookmark_count,
        ts_rank(p."searchVector", websearch_to_tsquery('english', ${query})) AS rank
      FROM "Post" p
      JOIN "User" a ON a.id = p."authorId"
      LEFT JOIN "PostTag" pt ON pt."postId" = p.id
      LEFT JOIN "Tag" t ON t.id = pt."tagId"
      WHERE p."published" = true
        AND p."searchVector" @@ websearch_to_tsquery('english', ${query})
      GROUP BY p.id, a.id
      ORDER BY rank DESC, p."createdAt" DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `,
    sql`
      SELECT COUNT(*)::int AS total
      FROM "Post" p
      WHERE p."published" = true
        AND p."searchVector" @@ websearch_to_tsquery('english', ${query})
    `,
  ])

  const total = totalRows[0]?.total ?? 0

  const blogs = rows.map((r: any) => ({
    id: r.id,
    title: r.title,
    content: r.content,
    summary: r.summary,
    coverImage: r.coverImage,
    published: r.published,
    readingTime: r.readingTime,
    views: r.views,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    author: {
      id: r.author?.id,
      name: r.author?.name,
      username: r.author?.username,
      avatar: r.author?.avatar,
    },
    tags: r.tags || [],
    _count: {
      comments: r.comment_count ?? 0,
      claps: r.clap_count ?? 0,
      bookmarks: r.bookmark_count ?? 0,
    },
  }))

  return c.json({
    blogs,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  })
})

// it's for full text search with ranked results 
function websearch(q: string): string {
  return q.replace(/\s+/g, ' ').replace(/\\/g, ' ').replace(/'/g, "''")
}

blogRouter.get('/bulk', async (c) => {
  const page = Math.max(1, parseInt(c.req.query('page') || '1', 10) || 1)
  const pageSize = Math.min(
    50,
    Math.max(1, parseInt(c.req.query('pageSize') || '10', 10) || 10)
  )
  const tag = c.req.query('tag')
  const authorId = c.req.query('authorId')

  const where: any = { published: true }
  if (tag) {
    where.tags = { some: { tag: { name: tag } } }
  }
  if (authorId) {
    where.authorId = authorId
  }

  const [blogs, total] = await Promise.all([
    prisma.post.findMany({
      where,
      select: postPublicSelect,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.post.count({ where }),
  ])

  return c.json({
    blogs,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  })
})

blogRouter.get('/recommend', async (c) => {
  const userId = c.get('userId')
  const page = Math.max(1, parseInt(c.req.query('page') || '1', 10) || 1)
  const pageSize = Math.min(
    50,
    Math.max(1, parseInt(c.req.query('pageSize') || '10', 10) || 10)
  )

  try {
    const result = await getRecommendations(userId, page, pageSize)
    return c.json(result)
  } catch {
    // Fault-tolerant degradation: fall back to /bulk behavior
    const where: any = { published: true, authorId: { not: userId } }
    const [blogs, total] = await Promise.all([
      prisma.post.findMany({
        where,
        select: postPublicSelect,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.post.count({ where }),
    ])
    return c.json({
      blogs,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
      whoToFollow: [],
    })
  }
})

blogRouter.get('/mine', async (c) => {
  const userId = c.get('userId')
  const blogs = await prisma.post.findMany({
    where: { authorId: userId },
    select: postPublicSelect,
    orderBy: { updatedAt: 'desc' },
  })
  return c.json({ blogs })
})

blogRouter.get('/author/:id', async (c) => {
  const authorId = c.req.param('id')
  const blogs = await prisma.post.findMany({
    where: { authorId, published: true },
    select: postPublicSelect,
    orderBy: { createdAt: 'desc' },
  })
  return c.json({ blogs })
})

blogRouter.get('/tag/:name', async (c) => {
  const name = c.req.param('name')
  const blogs = await prisma.post.findMany({
    where: { published: true, tags: { some: { tag: { name } } } },
    select: postPublicSelect,
    orderBy: { createdAt: 'desc' },
  })
  return c.json({ blogs })
})

blogRouter.get('/:id', zValidator('param', blogIdParams), async (c) => {
  const { id } = c.req.valid('param')
  const userId = c.get('userId')

  const blog = await prisma.post.findUnique({
    where: { id },
    select: postPublicSelect,
  })

  if (!blog) {
    return c.json({ error: 'Blog not found' }, 404)
  }

  const [clapped, userBookmarks] = await Promise.all([
    prisma.clap.findUnique({
      where: { postId_userId: { postId: id, userId } },
      select: { count: true },
    }),
    prisma.bookmark.findMany({
      where: { postId: id, userId },
      select: { list: true },
    }),
  ])

  await prisma.post.update({ where: { id }, data: { views: { increment: 1 } } })

  const bookmarkedLists = userBookmarks.map((b) => (b.list === 'default' ? 'Reading list' : b.list))

  return c.json({
    blog: {
      ...blog,
      clapsByUser: clapped?.count ?? 0,
      isBookmarked: bookmarkedLists.length > 0,
      bookmarkedLists,
    },
  })
})

blogRouter.post('/',
  zValidator('json', createBlogInput),
  async (c) => {
    const userId = c.get('userId')
    const body = c.req.valid('json')

    const blog = await prisma.post.create({
      data: {
        title: body.title,
        content: body.content,
        summary: body.summary,
        coverImage: body.coverImage,
        authorId: userId,
        readingTime: readingTime(body.content),
        tags: { create: tagWrites(body.tags) },
      },
      select: postPublicSelect,
    })

    return c.json({ message: 'Blog created successfully', blog }, 201)
  }
)

blogRouter.put('/',
  zValidator('json', updateBlogInput),
  async (c) => {
    const userId = c.get('userId')
    const body = c.req.valid('json')

    const existing = await prisma.post.findFirst({
      where: { id: body.id, authorId: userId },
      select: { id: true },
    })
    if (!existing) {
      return c.json({ error: 'Blog not found or you are not the author' }, 404)
    }

    const blog = await prisma.$transaction(async (tx) => {
      if (body.tags) {
        await tx.postTag.deleteMany({ where: { postId: body.id } })
      }
      const updated = await tx.post.update({
        where: { id: body.id },
        data: {
          title: body.title,
          content: body.content,
          summary: body.summary,
          coverImage: body.coverImage,
          published: body.published,
          readingTime: body.content
            ? readingTime(body.content)
            : undefined,
          tags: body.tags ? { create: tagWrites(body.tags) } : undefined,
        },
        select: postPublicSelect,
      })
      return updated
    })

    return c.json({ message: 'Blog updated successfully', blog })
  }
)

blogRouter.delete('/:id', zValidator('param', blogIdParams), async (c) => {
  const { id } = c.req.valid('param')
  const userId = c.get('userId')

  const existing = await prisma.post.findFirst({
    where: { id, authorId: userId },
    select: { id: true },
  })
  if (!existing) {
    return c.json({ error: 'Blog not found or you are not the author' }, 404)
  }

  await prisma.post.delete({ where: { id } })
  return c.json({ message: 'Blog deleted successfully' })
})

blogRouter.patch('/:id/publish', zValidator('param', blogIdParams), async (c) => {
  const { id } = c.req.valid('param')
  const userId = c.get('userId')

  const blog = await prisma.post.updateMany({
    where: { id, authorId: userId },
    data: { published: true },
  })
  if (blog.count === 0) {
    return c.json({ error: 'Blog not found or you are not the author' }, 404)
  }
  return c.json({ message: 'Blog published' })
})

blogRouter.patch('/:id/unpublish', zValidator('param', blogIdParams), async (c) => {
  const { id } = c.req.valid('param')
  const userId = c.get('userId')

  const blog = await prisma.post.updateMany({
    where: { id, authorId: userId },
    data: { published: false },
  })
  if (blog.count === 0) {
    return c.json({ error: 'Blog not found or you are not the author' }, 404)
  }
  return c.json({ message: 'Blog unpublished' })
})
