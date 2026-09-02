import { atom } from 'jotai'
import { tokenAtom } from './auth'

export interface BlogAuthor {
  id: string
  name?: string | null
  username?: string | null
  avatar?: string | null
}

export interface BlogTag {
  tag: { id: string; name: string }
}

export interface Blog {
  id: string
  title: string
  content: string
  summary?: string | null
  coverImage?: string | null
  published: boolean
  readingTime: number
  views: number
  createdAt: string
  updatedAt: string
  author: BlogAuthor
  tags: BlogTag[]
  _count: {
    comments: number
    claps: number
    bookmarks: number
  }
}

export interface BlogDetail extends Blog {
  clapsByUser: number
  isBookmarked?: boolean
  bookmarkedLists?: string[]
}

export interface Pagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

interface FeedResult {
  blogs: Blog[]
  pagination: Pagination
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
    throw new Error((data as { message?: string; error?: string }).message || (data as any)?.error || 'Something went wrong')
  }
  return data as T
}

export const blogsAtom = atom<Blog[]>([])
export const paginationAtom = atom<Pagination>({
  page: 1,
  pageSize: 8,
  total: 0,
  totalPages: 0,
})
export const feedLoadingAtom = atom(false)
export const feedErrorAtom = atom<string | null>(null)

export const currentPageAtom = atom(1)

export const fetchFeedAtom = atom(
  null,
  async (get, set, { page, pageSize = 8, tag }: { page: number; pageSize?: number; tag?: string }) => {
    const token = get(tokenAtom)
    set(feedLoadingAtom, true)
    // @ts-ignore
    set(feedErrorAtom, null)
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
      if (tag) params.set('tag', tag)
      const res = await authedFetch(`${API_BASE}/bulk?${params.toString()}`, token)
      const data = await handleResponse<FeedResult>(res)
      set(blogsAtom, data.blogs)
      set(paginationAtom, data.pagination)
      set(currentPageAtom, page)
    } catch (e) {
      // @ts-ignore
      set(feedErrorAtom, (e as Error).message)
    } finally {
      set(feedLoadingAtom, false)
    }
  },
)

export const fetchBlogByIdAtom = atom(
  null,
  async (get, _set, id: string): Promise<BlogDetail | null> => {
    const token = get(tokenAtom)
    try {
      const res = await authedFetch(`${API_BASE}/${id}`, token)
      const data = await handleResponse<{ blog: BlogDetail }>(res)
      return data.blog
    } catch {
      return null
    }
  },
)

export const fetchMyBlogsAtom = atom(
  null,
  async (get): Promise<Blog[]> => {
    const token = get(tokenAtom)
    if (!token) return []
    try {
      const res = await authedFetch(`${API_BASE}/mine`, token)
      const data = await handleResponse<{ blogs: Blog[] }>(res)
      return data.blogs
    } catch {
      return []
    }
  },
)

export const fetchAuthorBlogsAtom = atom(
  null,
  async (get, _set, authorId: string): Promise<Blog[]> => {
    const token = get(tokenAtom)
    try {
      const res = await authedFetch(`${API_BASE}/author/${authorId}`, token)
      const data = await handleResponse<{ blogs: Blog[] }>(res)
      return data.blogs
    } catch {
      return []
    }
  },
)

export const deleteBlogAtom = atom(
  null,
  async (get, set, id: string): Promise<boolean> => {
    const token = get(tokenAtom)
    if (!token) return false
    try {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      await handleResponse<{ message: string }>(res)
      const current = get(blogsAtom)
      set(blogsAtom, current.filter((b) => b.id !== id))
      return true
    } catch {
      return false
    }
  },
)

export interface CreateBlogPayload {
  title: string
  content: string
  summary?: string
  coverImage?: string
  tags?: string[]
}

export const createBlogAtom = atom(
  null,
  async (
    get,
    _set,
    payload: CreateBlogPayload,
  ): Promise<{ ok: boolean; blog?: Blog; error?: string }> => {
    const token = get(tokenAtom)
    if (!token) return { ok: false, error: 'Not authenticated' }
    try {
      const res = await fetch(`${API_BASE}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })
      const data = await handleResponse<{ message: string; blog: Blog }>(res)
      return { ok: true, blog: data.blog }
    } catch (e) {
      return { ok: false, error: (e as Error).message }
    }
  },
)

export const updateBlogAtom = atom(
  null,
  async (
    get,
    _set,
    payload: CreateBlogPayload & { id: string },
  ): Promise<{ ok: boolean; blog?: Blog; error?: string }> => {
    const token = get(tokenAtom)
    if (!token) return { ok: false, error: 'Not authenticated' }
    try {
      const res = await fetch(`${API_BASE}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })
      const data = await handleResponse<{ message: string; blog: Blog }>(res)
      return { ok: true, blog: data.blog }
    } catch (e) {
      return { ok: false, error: (e as Error).message }
    }
  },
)

export const publishBlogAtom = atom(
  null,
  async (get, _set, id: string): Promise<{ ok: boolean; error?: string }> => {
    const token = get(tokenAtom)
    if (!token) return { ok: false, error: 'Not authenticated' }
    try {
      const res = await fetch(`${API_BASE}/${id}/publish`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      })
      await handleResponse<{ message: string }>(res)
      return { ok: true }
    } catch (e) {
      return { ok: false, error: (e as Error).message }
    }
  },
)

export const unpublishBlogAtom = atom(
  null,
  async (get, _set, id: string): Promise<{ ok: boolean; error?: string }> => {
    const token = get(tokenAtom)
    if (!token) return { ok: false, error: 'Not authenticated' }
    try {
      const res = await fetch(`${API_BASE}/${id}/unpublish`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      })
      await handleResponse<{ message: string }>(res)
      return { ok: true }
    } catch (e) {
      return { ok: false, error: (e as Error).message }
    }
  },
)
