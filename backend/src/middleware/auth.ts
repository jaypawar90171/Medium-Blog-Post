import { verify } from 'hono/jwt'
import type { Context, Next } from 'hono'

type AuthContext = Context<{
  Variables: { userId: string }
}>

export async function authMiddleware(c: AuthContext, next: Next) {
  const jwt = c.req.header('Authorization') || ''

  if (!jwt) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const token = jwt.startsWith('Bearer ') ? jwt.slice(7) : jwt.split(' ')[1]

  try {
    const payload = await verify(token, process.env.JWT_SECRET!, 'HS256')
    if (!payload || !payload.id) {
      return c.json({ error: 'Invalid token' }, 401)
    }
    c.set('userId', String(payload.id))
    await next()
  } catch {
    return c.json({ error: 'Invalid token' }, 401)
  }
}
