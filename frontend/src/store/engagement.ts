import { atom } from 'jotai'
import { tokenAtom } from './auth'
import { blogsAtom } from './blog'

const API_BASE = '/api/v1/engagement'

export type CommentAuthor = {
  id: string
  name: string | null
  username: string | null
  avatar: string | null
}

export type Comment = {
  id: string
  content: string
  createdAt: string
  updatedAt: string
  parentId: string | null
  author: CommentAuthor
  _count?: {
    replies: number
  }
}

export type CommentsResponse = {
  comments: Comment[]
}

export type CreateCommentResponse = {
  message: string
  comment: Comment
}

type BookmarkResponse = {
  bookmarks: Bookmark[];
};

type Bookmark = {
  id: string;
  list: string;
  createdAt: string;
  postId: string;
  userId: string;
  post: Post;
};

type Post = {
  id: string;
  title: string;
  summary: string;
  coverImage: string;
  readingTime: number;
  createdAt: string;
  author: Author;
};

type Author = {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
};

// authedFetch is a helper function that makes authenticated requests to the API, it takes the url and the token as arguments, it returns the response from the API
async function authedFetch(url: string, token: string | null): Promise<Response> {
  return fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
}

// authedPost is a helper function that makes authenticated POST requests to the API, it takes the url and the token as arguments, it returns the response from the API
async function authedPost(url: string, body: unknown, token: string | null): Promise<Response> {
  return await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })
}

// authedPut is a helper function that makes authenticated PUT requests to the API
async function authedPut(url: string, body: unknown, token: string | null): Promise<Response> {
  return await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })
}

async function authedDelete(url: string, token: string | null): Promise<Response> {
  return await fetch(url, {
    method: 'DELETE',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
}

// it handles the response from the API, it takes the response as an argument and returns the data, it throws an error if the response is not ok
async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error((data as { message?: string; error?: string }).message || (data as any)?.error || 'Something went wrong')
  }
  return data as T
}

// ---- Comments State & Atoms ----

export const commentsAtom = atom<Comment[]>([])
export const commentsLoadingAtom = atom<boolean>(false)
export const commentsErrorAtom = atom<string | null>(null)

// fetch comments for a post
export const fetchCommentsAtom = atom(
  null,
  async (get, set, { postId }: { postId: string }) => {
    const token = get(tokenAtom)
    set(commentsLoadingAtom, true)
    // @ts-ignore
    set(commentsErrorAtom, null)
    try {
      const res = await authedFetch(`${API_BASE}/comment/post/${postId}`, token)
      const data = await handleResponse<CommentsResponse>(res)
      set(commentsAtom, data.comments)
      return data.comments
    } catch (err) {
      const msg = (err as Error).message || 'Failed to fetch comments'
      // @ts-ignore
      set(commentsErrorAtom, msg)
      throw err
    } finally {
      set(commentsLoadingAtom, false)
    }
  },
)

// add a comment to a post
export const addCommentAtom = atom(
  null,
  async (
    get,
    set,
    { postId, content, parentId }: { postId: string; content: string; parentId?: string | null },
  ) => {
    const token = get(tokenAtom)
    const res = await authedPost(
      `${API_BASE}/comment`,
      { postId, content, parentId },
      token,
    )
    const data = await handleResponse<CreateCommentResponse>(res)

    // Prepend newly created comment to local state
    const currentComments = get(commentsAtom)
    set(commentsAtom, [data.comment, ...currentComments])

    // Update comment count in blogs list if present
    const blogs = get(blogsAtom)
    set(
      blogsAtom,
      blogs.map((b) =>
        b.id === postId
          ? { ...b, _count: { ...b._count, comments: (b._count?.comments || 0) + 1 } }
          : b,
      ),
    )

    return data
  },
)

// update an existing comment
export const updateCommentAtom = atom(
  null,
  async (get, set, { id, content }: { id: string; content: string }) => {
    const token = get(tokenAtom)
    const res = await authedPut(
      `${API_BASE}/comment`,
      { id, content },
      token,
    )
    const data = await handleResponse<{ message: string }>(res)

    // Update comment in local state
    const currentComments = get(commentsAtom)
    set(
      commentsAtom,
      currentComments.map((c) =>
        c.id === id ? { ...c, content, updatedAt: new Date().toISOString() } : c,
      ),
    )

    return data
  },
)

// delete a comment
export const deleteCommentAtom = atom(
  null,
  async (get, set, { id, postId }: { id: string; postId?: string }) => {
    const token = get(tokenAtom)
    const res = await authedDelete(`${API_BASE}/comment/${id}`, token)
    const data = await handleResponse<{ message: string }>(res)

    // Remove comment from local state
    const currentComments = get(commentsAtom)
    set(
      commentsAtom,
      currentComments.filter((c) => c.id !== id),
    )

    // Decrement comment count in blogs list if postId provided
    if (postId) {
      const blogs = get(blogsAtom)
      set(
        blogsAtom,
        blogs.map((b) =>
          b.id === postId
            ? { ...b, _count: { ...b._count, comments: Math.max(0, (b._count?.comments || 0) - 1) } }
            : b,
        ),
      )
    }

    return data
  },
)

// ---- Claps ----

// add claps to a blog
export const clapBlogAtom = atom(
  null,
  async (get, set, { postId, count = 1 }: { postId: string; count?: number }) => {
    const token = get(tokenAtom)
    const res = await authedPost(
      `${API_BASE}/clap`,
      { postId, count },
      token,
    )
    const data = await handleResponse<{ totalClaps: number; userClaps: number }>(res)
    console.log("clap data:", data)

    // Update the clap count in the blogs list
    const blogs = get(blogsAtom)
    set(
      blogsAtom,
      blogs.map((b) =>
        b.id === postId ? { ...b, _count: { ...b._count, claps: data.totalClaps } } : b,
      ),
    )

    return data
  },
)

// returns total claps for a post
export const fetchUserClapsAtom = atom(
  null,
  async (get, set, { postId }: { postId: string }) => {
    const token = get(tokenAtom)
    const res = await authedFetch(
      `${API_BASE}/clap/post/${postId}`,
      token,
    )
    const data = await handleResponse<{ count: number }>(res)
    console.log("clap count:", data)
    return data
  },
)

// ---- Bookmarks ----

// bookmark a blog in a specific list
export const bookmarkBlogAtom = atom(
  null,
  async (get, set, { postId, list = 'Reading list' }: { postId: string; list?: string }) => {
    const token = get(tokenAtom)
    const res = await authedPost(
      `${API_BASE}/bookmark`,
      { postId, list },
      token,
    )
    const data = await handleResponse<{ message: string; list: string }>(res)

    // Update bookmark count in local feed if present
    const blogs = get(blogsAtom)
    set(
      blogsAtom,
      blogs.map((b) =>
        b.id === postId
          ? { ...b, _count: { ...b._count, bookmarks: (b._count?.bookmarks || 0) + 1 } }
          : b,
      ),
    )

    return data
  },
)

// remove bookmark from a blog (optionally for a specific list)
export const removeBookmarkAtom = atom(
  null,
  async (get, set, { postId, list }: { postId: string; list?: string }) => {
    const token = get(tokenAtom)
    const url = `${API_BASE}/bookmark/${postId}${list ? `?list=${encodeURIComponent(list)}` : ''}`
    const res = await authedDelete(url, token)
    const data = await handleResponse<{ message: string }>(res)

    // Decrement bookmark count in local feed if present
    const blogs = get(blogsAtom)
    set(
      blogsAtom,
      blogs.map((b) =>
        b.id === postId
          ? { ...b, _count: { ...b._count, bookmarks: Math.max(0, (b._count?.bookmarks || 0) - 1) } }
          : b,
      ),
    )

    return data
  },
)

// returns all distinct bookmark list names for the current user
export const fetchBookmarkListsAtom = atom(
  null,
  async (get) => {
    const token = get(tokenAtom)
    if (!token) return { lists: ['Reading list'] }
    const res = await authedFetch(`${API_BASE}/bookmark/lists`, token)
    return await handleResponse<{ lists: string[] }>(res)
  },
)

// returns bookmark status and saved lists for a specific post
export const fetchPostBookmarkStatusAtom = atom(
  null,
  async (get, _set, { postId }: { postId: string }) => {
    const token = get(tokenAtom)
    if (!token) return { isBookmarked: false, lists: [] }
    const res = await authedFetch(`${API_BASE}/bookmark/status/${postId}`, token)
    return await handleResponse<{ isBookmarked: boolean; lists: string[] }>(res)
  },
)

// returns list of bookmarked blogs for a list
export const fetchBookmarkListPostsAtom = atom(
  null,
  async (get, _set, { list = 'Reading list' }: { list?: string } = {}) => {
    const token = get(tokenAtom)
    const res = await authedFetch(
      `${API_BASE}/bookmark/list?list=${encodeURIComponent(list)}`,
      token,
    )
    return await handleResponse<BookmarkResponse>(res)
  },
)