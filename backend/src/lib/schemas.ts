import { z } from 'zod'

export const signupInput = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
  username: z.string().min(3).optional(),
  bio: z.string().max(500).optional(),
})

export const signinInput = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export const updateProfileInput = z.object({
  name: z.string().min(1).optional(),
  username: z.string().min(3).optional(),
  bio: z.string().max(500).optional(),
  avatar: z.string().url().optional(),
})

export const createBlogInput = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  summary: z.string().max(500).optional(),
  coverImage: z.string().url().optional(),
  tags: z.array(z.string().min(1)).max(10).optional(),
})

export const updateBlogInput = z.object({
  id: z.string(),
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  summary: z.string().max(500).optional(),
  coverImage: z.string().url().optional(),
  published: z.boolean().optional(),
  tags: z.array(z.string().min(1)).max(10).optional(),
})

export const blogIdParams = z.object({
  id: z.string(),
})

export const createCommentInput = z.object({
  postId: z.string(),
  content: z.string().min(1).max(2000),
  parentId: z.string().optional(),
})

export const updateCommentInput = z.object({
  id: z.string(),
  content: z.string().min(1).max(2000),
})

export const clapInput = z.object({
  postId: z.string(),
  count: z.number().int().min(1).max(50).default(1),
})

export const followInput = z.object({
  userId: z.string(),
})

export const bookmarkInput = z.object({
  postId: z.string(),
  list: z.string().min(1).default('default'),
})
