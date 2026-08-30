import { Hono } from 'hono'
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { decode, sign, verify } from 'hono/jwt'
import bcrypt from 'bcryptjs'
import {z} from 'zod'
import {zValidator} from '@hono/zod-validator'

const prisma = new PrismaClient({
    accelerateUrl: process.env.DATABASE_URL,
}).$extends(withAccelerate())

const createBlogInput = z.object({
    title: z.string(),
    content: z.string()
})

const updateBlogInput = z.object({
    id: z.string(),
    title: z.string().optional(),
    content: z.string().optional()
})

export const blogRouter = new Hono<{
    Variables: {
        userId: string
    }
}>()

blogRouter.get('/bulk', async (c) => {
    console.log("Inside bulk")
    try {
        const blogs = await prisma.post.findMany({})
        return c.json({
            message: 'Blogs fetched successfully',
            blogs
        })
    }
    catch (e) {
        return c.json({
            message: 'Blogs fetch failed',
            e
        })
    }
})

blogRouter.get('/:id', async (c) => {
    const id = c.req.param('id')
    try {
        const blog = await prisma.post.findUnique({
            where: {
                id: id,
            }
        })
        return c.json({
            message: 'Blog fetched successfully',
            blog
        })
    }
    catch (e) {
        return c.json({
            message: 'Blog fetch failed',
            e
        })
    }
})

blogRouter.post('/', zValidator('json', createBlogInput), async (c) => {
    const userId = c.get('userId');
    const body = await c.req.json();

    try {
        const blog = await prisma.post.create({
            data: {
                title: body.title,
                content: body.content,
                authorId: userId,
            }
        })
        return c.json({
            message: 'Blog created successfully',
            blog
        })
    }
    catch (e) {
        return c.json({
            message: 'Blog creation failed',
            e
        })
    }
})

blogRouter.put('/', zValidator('json', updateBlogInput), async (c) => {
    const userId = c.get('userId');
    const body = await c.req.json();

    try {
        const blog = await prisma.post.update({
            where: {
                id: body.id,
                authorId: userId,
            },
            data: {
                title: body.title,
                content: body.content,
            }
        })
        return c.json({
            message: 'Blog updated successfully',
            blog
        })
    }
    catch (e) {
        return c.json({
            message: 'Blog update failed',
            e
        })
    }
})