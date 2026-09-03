import { atom } from 'jotai'
import { tokenAtom } from './auth'
import { type Blog, type Pagination } from './blog'

export type WhoToFollowUser = {
  id: string
  name: string | null
  username: string | null
  avatar: string | null
  bio: string | null
  mutualCount: number
}

interface RecommendResult {
  blogs: Blog[]
  pagination: Pagination
  whoToFollow: WhoToFollowUser[]
}

const API_BASE = '/api/v1/blog'

async function authedFetch(url: string, token: string | null): Promise<Response> {
  return fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(
      (data as { message?: string; error?: string }).message ||
        (data as any)?.error ||
        'Something went wrong',
    )
  }
  return data as T
}

// For-you feed state
export const forYouAtom = atom<Blog[]>([])
export const forYouPaginationAtom = atom<Pagination>({
  page: 1,
  pageSize: 8,
  total: 0,
  totalPages: 0,
})
export const forYouLoadingAtom = atom(false)
export const forYouErrorAtom = atom<string | null>(null)
export const forYouPageAtom = atom(1)

// Who to follow (from recommend endpoint)
export const whoToFollowAtom = atom<WhoToFollowUser[]>([])

export const fetchForYouAtom = atom(
  null,
  async (
    get,
    set,
    { page, pageSize = 8 }: { page: number; pageSize?: number },
  ) => {
    const token = get(tokenAtom)
    set(forYouLoadingAtom, true)
    // @ts-ignore
    set(forYouErrorAtom, null)
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      })
      const res = await authedFetch(`${API_BASE}/recommend?${params.toString()}`, token)
      const data = await handleResponse<RecommendResult>(res)
      set(forYouAtom, data.blogs)
      set(forYouPaginationAtom, data.pagination)
      set(forYouPageAtom, page)
      if (data.whoToFollow.length > 0) {
        set(whoToFollowAtom, data.whoToFollow)
      }
    } catch (e) {
      // @ts-ignore
      set(forYouErrorAtom, (e as Error).message)
    } finally {
      set(forYouLoadingAtom, false)
    }
  },
)
