import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bookmark, Lock, BookOpen, Loader2, Clock, ChevronRight } from 'lucide-react'
import { useSetAtom } from 'jotai'
import { useNavigate } from 'react-router-dom'
import {
  fetchBookmarkListsAtom,
  fetchBookmarkListPostsAtom,
} from '../store/engagement'

export default function ProfileListsTab() {
  const navigate = useNavigate()
  const fetchLists = useSetAtom(fetchBookmarkListsAtom)
  const fetchPosts = useSetAtom(fetchBookmarkListPostsAtom)

  const [lists, setLists] = useState<string[]>(['Reading list'])
  const [selectedList, setSelectedList] = useState<string>('Reading list')
  const [bookmarks, setBookmarks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [postsLoading, setPostsLoading] = useState(false)

  // Fetch available lists
  useEffect(() => {
    fetchLists()
      .then((res) => {
        if (res?.lists && res.lists.length > 0) {
          setLists(res.lists)
          if (!res.lists.includes(selectedList)) {
            setSelectedList(res.lists[0])
          }
        }
      })
      .finally(() => setLoading(false))
  }, [fetchLists])

  // Fetch posts for selected list
  useEffect(() => {
    if (!selectedList) return
    setPostsLoading(true)
    fetchPosts({ list: selectedList })
      .then((res) => {
        setBookmarks(res?.bookmarks || [])
      })
      .finally(() => setPostsLoading(false))
  }, [selectedList, fetchPosts])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-meta">
        <Loader2 size={26} className="animate-spin mb-2.5 text-ink-soft" />
        <p className="text-xs">Loading lists…</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 pt-2">
      {/* Lists pills */}
      <div className="flex flex-wrap items-center gap-2 border-b border-rule/60 pb-4">
        {lists.map((listName) => {
          const isActive = selectedList === listName
          return (
            <button
              key={listName}
              onClick={() => setSelectedList(listName)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all ${
                isActive
                  ? 'bg-ink text-paper shadow-sm'
                  : 'bg-paper-dim/60 text-ink-soft hover:bg-paper-dim hover:text-ink'
              }`}
            >
              <Bookmark size={13} className={isActive ? 'fill-current' : ''} />
              <span>{listName}</span>
              {listName === 'Reading list' && (
                <Lock size={10} className="ml-0.5 opacity-70" />
              )}
            </button>
          )
        })}
      </div>

      {/* Stories inside list */}
      {postsLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-meta">
          <Loader2 size={24} className="animate-spin mb-2 text-ink-soft" />
          <p className="text-xs">Loading stories in {selectedList}…</p>
        </div>
      ) : bookmarks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center text-meta">
          <div className="w-12 h-12 rounded-full bg-paper-dim flex items-center justify-center mb-3">
            <Bookmark size={20} className="text-meta" />
          </div>
          <h4 className="text-sm font-medium text-ink mb-1">
            No stories saved in {selectedList} yet.
          </h4>
          <p className="text-xs text-meta max-w-xs">
            Save stories to read them anytime from your library or profile.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-rule/70">
          {bookmarks.map((bm, idx) => {
            const post = bm.post
            if (!post) return null
            const authorName =
              post.author?.name || post.author?.username || 'Anonymous'
            const dateStr = post.createdAt
              ? new Date(post.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })
              : 'Recent'

            return (
              <motion.article
                key={bm.id || post.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.04 }}
                onClick={() => navigate(`/blog/${post.id}`)}
                className="group py-6 first:pt-2 cursor-pointer flex items-start justify-between gap-6"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 text-[12px] text-meta">
                    <span className="text-ink-soft font-medium">
                      {authorName}
                    </span>
                    <span>·</span>
                    <span>{dateStr}</span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock size={11} />
                      {post.readingTime} min read
                    </span>
                  </div>

                  <h3 className="font-serif text-lg font-bold leading-snug text-ink group-hover:text-red transition-colors mb-1.5">
                    {post.title}
                  </h3>

                  <p className="text-ink-soft text-xs leading-relaxed line-clamp-2">
                    {post.summary}
                  </p>
                </div>

                {post.coverImage && (
                  <div className="w-20 sm:w-28 h-16 sm:h-20 shrink-0 rounded-xl overflow-hidden bg-paper-dim border border-rule/50">
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                )}
              </motion.article>
            )
          })}
        </div>
      )}
    </div>
  )
}
