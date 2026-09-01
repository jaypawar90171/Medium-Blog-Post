import { atom } from 'jotai'
import { atomWithStorage, loadable } from 'jotai/utils'

export interface User {
  id: string
  email: string
  name?: string | null
  username?: string | null
  bio?: string | null
}

const API_BASE = '/api/v1/user'

export const tokenAtom = atomWithStorage<string | null>('journal-token', null)
export const userAtom = atomWithStorage<User | null>('journal-user', null)

interface AuthResult {
  ok: boolean
  error?: string
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error((data as { message?: string }).message || 'Something went wrong')
  }
  return data as T
}

export const signInAtom = atom(
  null,
  async (_get, set, { email, password }: { email: string; password: string }): Promise<AuthResult> => {
    try {
      const res = await fetch(`${API_BASE}/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await handleResponse<{ token: string }>(res)
      set(tokenAtom, data.token)
      try {
        const meRes = await fetch(`${API_BASE}/me`, {
          headers: { Authorization: `Bearer ${data.token}` },
        })
        const me = await handleResponse<{ user: User }>(meRes)
        set(userAtom, me.user)
      } catch {
        // non-fatal: token stored even if profile fetch fails
      }
      return { ok: true }
    } catch (e) {
      return { ok: false, error: (e as Error).message }
    }
  },
)

export const signUpAtom = atom(
  null,
  async (
    _get,
    set,
    payload: { email: string; password: string; name?: string; username?: string; bio?: string },
  ): Promise<AuthResult> => {
    try {
      const res = await fetch(`${API_BASE}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, bio: payload.bio || undefined }),
      })
      const data = await handleResponse<{ token: string; user: User }>(res)
      set(tokenAtom, data.token)
      set(userAtom, data.user)
      return { ok: true }
    } catch (e) {
      return { ok: false, error: (e as Error).message }
    }
  },
)

export const signOutAtom = atom(null, (_get, set) => {
  set(tokenAtom, null)
  set(userAtom, null)
})

export const isAuthenticatedAtom = atom((get) => get(tokenAtom) !== null)

export { loadable }
