import { Hono } from 'hono'
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { decode, sign, verify } from 'hono/jwt'
import bcrypt from 'bcryptjs'

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
  const jwt = c.req.header('Authorization');

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
  try {
    const result = await prisma.test.create({
      data: { message: 'Connection verified!' },
    })

    const tests = await prisma.test.findMany()

    return c.json({
      status: 'ok',
      database: 'connected',
      inserted: result,
      count: tests.length,
    })
  } catch (error) {
    return c.json(
      {
        status: 'error',
        database: 'disconnected',
        error: error instanceof Error ? error.message : String(error),
      },
      500
    )
  }
})

app.post('/api/v1/signup', async (c) => {
  const body = await c.req.json();

  const hashedPassword = await bcrypt.hash(body.password, 10);
  
  try {
    const user = prisma.user.create({
      data: {
        email: body.email,
        password: hashedPassword,
      }
    })
	const token = await sign({id: (await user).id}, process.env.JWT_SECRET!)

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

app.post('/api/v1/signin', async (c) => {
  const body = await c.req.json();
  if (!body.email || !body.password) {
    return c.json({
      message: 'Please provide both email and password'
    }, 403)
  }

  const user = await prisma.user.findUnique({
    where: {
      email: body.email,
    }
  })

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
  
  const token = await sign({id: user.id}, process.env.JWT_SECRET!)

  return c.json({
    message: 'User signed in successfully',
    token: token
  })
})

app.get('/api/v1/blog/:id', (c) => {
  const id = c.req.param('id')
  console.log(id);
  return c.text('get blog route')
})

app.post('/api/v1/blog', (c) => {
  return c.text('signin route')
})

app.put('/api/v1/blog', (c) => {
  return c.text('signin route')
})

export default app
