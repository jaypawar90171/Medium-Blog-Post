import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { prisma, type Variables } from '../lib/prisma'
import {
  createCommentInput,
  updateCommentInput,
  clapInput,
  followInput,
  bookmarkInput,
  blogIdParams,
} from '../lib/schemas'
import { authMiddleware } from '../middleware/auth'

export const engagementRouter = new Hono<{ Variables: Variables }>()
engagementRouter.use('*', authMiddleware)

// ---- Comments ----

engagementRouter.post('/comment',
  zValidator('json', createCommentInput),
  async (c) => {
    const userId = c.get('userId')
    const body = c.req.valid('json')

    const post = await prisma.post.findUnique({
      where: { id: body.postId },
      select: { id: true },
    })
    if (!post) {
      return c.json({ error: 'Post not found' }, 404)
    }

    const comment = await prisma.comment.create({
      data: {
        content: body.content,
        postId: body.postId,
        authorId: userId,
        parentId: body.parentId,
      },
      select: commentSelect,
    })

    return c.json({ message: 'Comment added', comment }, 201)
  }
)

engagementRouter.get('/comment/post/:id', zValidator('param', blogIdParams), async (c) => {
  const { id } = c.req.valid('param')
  const comments = await prisma.comment.findMany({
    where: { postId: id, parentId: null },
    orderBy: { createdAt: 'desc' },
    select: commentSelect,
  })
  return c.json({ comments })
})

engagementRouter.put('/comment',
  zValidator('json', updateCommentInput),
  async (c) => {
    const userId = c.get('userId')
    const body = c.req.valid('json')

    const updated = await prisma.comment.updateMany({
      where: { id: body.id, authorId: userId },
      data: { content: body.content },
    })
    if (updated.count === 0) {
      return c.json({ error: 'Comment not found or not yours' }, 404)
    }
    return c.json({ message: 'Comment updated' })
  }
)

engagementRouter.delete('/comment/:id', zValidator('param', blogIdParams), async (c) => {
  const { id } = c.req.valid('param')
  const userId = c.get('userId')

  const deleted = await prisma.comment.deleteMany({
    where: { id, authorId: userId },
  })
  if (deleted.count === 0) {
    return c.json({ error: 'Comment not found or not yours' }, 404)
  }
  return c.json({ message: 'Comment deleted' })
})

// ---- Claps ----

engagementRouter.post('/clap', zValidator('json', clapInput), async (c) => {
  const userId = c.get('userId')
  const body = c.req.valid('json')

  const clap = await prisma.clap.upsert({
    where: { postId_userId: { postId: body.postId, userId } },
    create: { postId: body.postId, userId, count: body.count },
    update: { count: { increment: body.count } },
  })

  return c.json({ message: 'Clapped', clap })
})

engagementRouter.get('/clap/post/:id', zValidator('param', blogIdParams), async (c) => {
  const { id } = c.req.valid('param')
  const userId = c.get('userId')

  const [total, mine] = await Promise.all([
    prisma.clap.aggregate({
      where: { postId: id },
      _sum: { count: true },
    }),
    prisma.clap.findUnique({
      where: { postId_userId: { postId: id, userId } },
      select: { count: true },
    }),
  ])

  return c.json({ totalClaps: total._sum.count ?? 0, userClaps: mine?.count ?? 0 })
})

// ---- Follows ----

engagementRouter.post('/follow', zValidator('json', followInput), async (c) => {
  const userId = c.get('userId')
  const { userId: targetId } = c.req.valid('json')

  if (userId === targetId) {
    return c.json({ error: 'You cannot follow yourself' }, 400)
  }

  const target = await prisma.user.findUnique({ where: { id: targetId } })
  if (!target) {
    return c.json({ error: 'User not found' }, 404)
  }

  await prisma.follow.upsert({
    where: {
      followerId_followingId: { followerId: userId, followingId: targetId },
    },
    create: { followerId: userId, followingId: targetId },
    update: {},
  })

  return c.json({ message: 'Following user' })
})

engagementRouter.delete('/follow/:userId', async (c) => {
  const userId = c.get('userId')
  const targetId = c.req.param('userId')

  await prisma.follow.deleteMany({
    where: { followerId: userId, followingId: targetId },
  })
  return c.json({ message: 'Unfollowed user' })
})

engagementRouter.get('/follow/me', async (c) => {
  const userId = c.get('userId')
  const [following, followers] = await Promise.all([
    prisma.follow.findMany({
      where: { followerId: userId },
      select: { following: { select: { id: true, name: true, username: true, avatar: true } } },
    }),
    prisma.follow.findMany({
      where: { followingId: userId },
      select: { follower: { select: { id: true, name: true, username: true, avatar: true } } },
    }),
  ])
  return c.json({
    following: following.map((f) => f.following),
    followers: followers.map((f) => f.follower),
  })
})

// check if user is following another user (for UI like follow button)
engagementRouter.get('/follow/status/:userId', async (c) => {
  const userId = c.get('userId')
  const targetId = c.req.param('userId')
  const follow = await prisma.follow.findUnique({
    where: {
      followerId_followingId: { followerId: userId, followingId: targetId },
    },
  })
  return c.json({ isFollowing: !!follow })
})

// ---- Bookmarks ----

engagementRouter.post('/bookmark', zValidator('json', bookmarkInput), async (c) => {
  const userId = c.get('userId')
  const body = c.req.valid('json')
  const listName = body.list || 'Reading list'

  const post = await prisma.post.findUnique({ where: { id: body.postId } })
  if (!post) {
    return c.json({ error: 'Post not found' }, 404)
  }

  await prisma.bookmark.upsert({
    where: {
      postId_userId_list: { postId: body.postId, userId, list: listName },
    },
    create: { postId: body.postId, userId, list: listName },
    update: {},
  })

  return c.json({ message: 'Bookmarked', list: listName }, 201)
})

engagementRouter.delete('/bookmark/:id', zValidator('param', blogIdParams), async (c) => {
  const { id } = c.req.valid('param')
  const userId = c.get('userId')
  const list = c.req.query('list')

  if (list) {
    await prisma.bookmark.deleteMany({
      where: { postId: id, userId, list },
    })
  } else {
    await prisma.bookmark.deleteMany({
      where: { postId: id, userId },
    })
  }
  return c.json({ message: 'Bookmark removed' })
})

// Return all distinct bookmark lists for the current user
engagementRouter.get('/bookmark/lists', async (c) => {
  const userId = c.get('userId')
  const userBookmarks = await prisma.bookmark.findMany({
    where: { userId },
    select: { list: true },
    distinct: ['list'],
  })

  const listSet = new Set<string>(['Reading list'])
  userBookmarks.forEach((b) => {
    if (b.list && b.list !== 'default') listSet.add(b.list)
  })

  return c.json({ lists: Array.from(listSet) })
})

// Return bookmark status and lists for a specific post
engagementRouter.get('/bookmark/status/:id', zValidator('param', blogIdParams), async (c) => {
  const { id } = c.req.valid('param')
  const userId = c.get('userId')

  const bookmarks = await prisma.bookmark.findMany({
    where: { postId: id, userId },
    select: { list: true },
  })

  const lists = bookmarks.map((b) => (b.list === 'default' ? 'Reading list' : b.list))

  return c.json({
    isBookmarked: lists.length > 0,
    lists,
  })
})

engagementRouter.get('/bookmark/list', async (c) => {
  const userId = c.get('userId')
  const list = c.req.query('list') || 'Reading list'

  const bookmarks = await prisma.bookmark.findMany({
    where: {
      userId,
      OR: [
        { list },
        ...(list === 'Reading list' ? [{ list: 'default' }] : []),
      ],
    },
    include: {
      post: {
        select: {
          id: true,
          title: true,
          summary: true,
          coverImage: true,
          readingTime: true,
          createdAt: true,
          author: { select: { id: true, name: true, username: true, avatar: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return c.json({ bookmarks })
})

const commentSelect = {
  id: true,
  content: true,
  createdAt: true,
  updatedAt: true,
  parentId: true,
  author: {
    select: { id: true, name: true, username: true, avatar: true },
  },
  _count: { select: { replies: true } },
} as const
