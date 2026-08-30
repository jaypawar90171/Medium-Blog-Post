import { Hono } from 'hono'
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { decode, sign, verify } from 'hono/jwt'
import bcrypt from 'bcryptjs'
import { userRouter } from './routes/user'
import { blogRouter } from './routes/blog'

const prisma = new PrismaClient({
  accelerateUrl: process.env.DATABASE_URL,
}).$extends(withAccelerate())

const app = new Hono<{
  Variables: {
    userId: string
  }
}>()

// auth middleware
app.use('/api/v1/blog/*', async(c, next) => {
  const jwt = c.req.header('Authorization') || "";

  if (!jwt) {
    c.status(401)
    return c.json({
      error: 'Unauthorized'
    })
  }

  const token = jwt.split(' ')[1];
  try {
    const payload = await verify(token, process.env.JWT_SECRET!, "HS256" );
    if (!payload) {
      return c.json({
        message: 'Invalid token'
      })
    }
    c.set('userId', String(payload.id));
    await next();
  }
  catch (e) {
    console.log(e);
    return c.json({
      message: 'Invalid token'
    })
  }
})

app.get('/health', async (c) => {
  return c.json({
	status: 'ok'
  })
})

app.route('/api/v1/user', userRouter);

app.route('/api/v1/blog', blogRouter)

export default app
