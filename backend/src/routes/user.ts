import { Hono } from 'hono'
import { sign } from 'hono/jwt'
import bcrypt from 'bcryptjs'
import { zValidator } from '@hono/zod-validator'
import { prisma, type Variables } from '../lib/prisma'
import { signupInput, signinInput, updateProfileInput } from '../lib/schemas'
import { authMiddleware } from '../middleware/auth'

export const userRouter = new Hono<{ Variables: Variables }>()

userRouter.post('/signup',
  zValidator('json', signupInput),
  async (c) => {
    const body = c.req.valid('json')
    const hashedPassword = await bcrypt.hash(body.password, 10)

    const user = await prisma.user.create({
      data: {
        email: body.email,
        password: hashedPassword,
        name: body.name,
        username: body.username,
        bio: body.bio,
      },
    })

    const token = await sign({ id: user.id }, process.env.JWT_SECRET!, 'HS256')

    return c.json({
      message: 'User created successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
      },
    }, 201)
  }
)

userRouter.post('/signin',
  zValidator('json', signinInput),
  async (c) => {
    const body = c.req.valid('json')

    const user = await prisma.user.findUnique({ where: { email: body.email } })
    if (!user) {
      return c.json({ message: 'User not found. Please signup.' }, 404)
    }

    const isPasswordValid = await bcrypt.compare(body.password, user.password)
    if (!isPasswordValid) {
      return c.json({ message: 'Incorrect password.' }, 401)
    }

    const token = await sign({ id: user.id }, process.env.JWT_SECRET!, 'HS256')

    return c.json({
      message: 'User signed in successfully',
      token,
    })
  }
)

userRouter.get('/me', authMiddleware, async (c) => {
  const userId = c.get('userId')
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      name: true,
      bio: true,
      avatar: true,
      createdAt: true,
      _count: {
        select: {
          posts: true,
          followers: true,
          following: true,
        },
      },
    },
  })

  if (!user) {
    return c.json({ error: 'User not found' }, 404)
  }

  return c.json({ user })
})

userRouter.put('/me',
  authMiddleware,
  zValidator('json', updateProfileInput),
  async (c) => {
    const userId = c.get('userId')
    const body = c.req.valid('json')

    const user = await prisma.user.update({
      where: { id: userId },
      data: body,
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        bio: true,
        avatar: true,
        updatedAt: true,
      },
    })

    return c.json({ message: 'Profile updated', user })
  }
)

userRouter.get('/:id', async (c) => {
  const id = c.req.param('id')
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      name: true,
      bio: true,
      avatar: true,
      createdAt: true,
      _count: {
        select: {
          posts: true,
          followers: true,
          following: true,
        },
      },
    },
  })

  if (!user) {
    return c.json({ error: 'User not found' }, 404)
  }

  return c.json({ user })
})
