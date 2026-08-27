import { Hono } from 'hono'
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { decode, sign, verify } from 'hono/jwt'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient({
    accelerateUrl: process.env.DATABASE_URL,
}).$extends(withAccelerate())

export const userRouter = new Hono<{
    Variables: {
        userId: string
    }
}>()

userRouter.post('/signup', async (c) => {
    const body = await c.req.json();

    const hashedPassword = await bcrypt.hash(body.password, 10);

    try {
        const user = await prisma.user.create({
            data: {
                email: body.email,
                password: hashedPassword,
            }
        })
        const token = await sign({ id: user.id }, process.env.JWT_SECRET!)

        return c.json({
            message: 'User created successfully',
            token: token
        })
    }
    catch (e) {
        console.log(e)
        return c.json({
            message: 'User creation failed',
            e
        })
    }
})

userRouter.post('/signin', async (c) => {
    const body = await c.req.json();
    if (!body.email || !body.password) {
        return c.json({
            message: 'Please provide both email and password'
        }, 403)
    }

    let user: any = null;
    try {
        user = await prisma.user.findUnique({
            where: {
                email: body.email,
            }
        })
    } catch (e) {
        try {
            const fs = await import('node:fs')
            fs.appendFileSync('C:/Users/hp/AppData/Local/Temp/opencode/dberr.log',
                (e instanceof Error ? e.stack || e.message : String(e)) + '\n---\n')
        } catch {}
        return c.json({ error: e instanceof Error ? e.message : String(e), full: String(e) }, 500)
    }

    if (!user) {
        return c.json({
            message: 'User not found. Please signup.'
        }, 403)
    }

    // Compare entered password with hashed password in DB
    const isPasswordValid = await bcrypt.compare(
        body.password,
        user.password
    );

    if (!isPasswordValid) {
        return c.json({
            message: 'Incorrect password.'
        }, 403)
    }

    const token = await sign({ id: user.id }, process.env.JWT_SECRET!)

    return c.json({
        message: 'User signed in successfully',
        token: token
    })
})