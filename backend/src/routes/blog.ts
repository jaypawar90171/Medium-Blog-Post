import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { prisma, type Variables } from '../lib/prisma'
import {
  createBlogInput,
  updateBlogInput,
  blogIdParams,
} from '../lib/schemas'
import { authMiddleware } from '../middleware/auth'

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
  return Math.max(1, Math.ceil(content.trim().split(/\s+/).length / 200))
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

    const blog = await prisma.post.update({
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
