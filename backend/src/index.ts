import { Hono } from 'hono'
import { PrismaClient } from '@prisma/client/edge'

const prisma = new PrismaClient({
  accelerateUrl: process.env.DATABASE_URL,
})

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
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

export default app
