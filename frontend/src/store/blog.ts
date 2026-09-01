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


