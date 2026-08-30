import { Hono } from 'hono'
import { userRouter } from './routes/user'
import { blogRouter } from './routes/blog'
import { engagementRouter } from './routes/engagement'
import { authMiddleware } from './middleware/auth'
import type { Variables } from './lib/prisma'

const app = new Hono<{ Variables: Variables }>()

app.get('/health', (c) => {
  return c.json({ status: 'ok' })
})

app.route('/api/v1/user', userRouter)
app.route('/api/v1/blog', blogRouter)
app.route('/api/v1/engagement', engagementRouter)

app.notFound((c) => c.json({ error: 'Not found' }, 404))

app.onError((err, c) => {
  console.error(err)
  return c.json({ error: 'Internal server error' }, 500)
})

export default app
