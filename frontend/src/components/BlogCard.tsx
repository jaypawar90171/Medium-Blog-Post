import { motion } from 'framer-motion'
import {
  Sparkles,
  MessageSquare,
  Bookmark,
  ThumbsDown,
  MoreHorizontal,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAtomValue, useSetAtom } from 'jotai'
import { tokenAtom } from '../store/auth'
import { clapBlogAtom, bookmarkBlogAtom, removeBookmarkAtom } from '../store/engagement'
import type { Blog } from '../store/blog'
import { useState } from 'react'

export default function BlogCard({ blog, index }: { blog: Blog; index: number }) {
  const navigate = useNavigate()
  const token = useAtomValue(tokenAtom)
  const clap = useSetAtom(clapBlogAtom)
  const bookmark = useSetAtom(bookmarkBlogAtom)
  const removeBookmark = useSetAtom(removeBookmarkAtom)
  const [bookmarked, setBookmarked] = useState(false)
  const [clapping, setClapping] = useState(false)
  const authorName = blog.author.name || blog.author.username || 'Anonymous'
  const tag = blog.tags[0]?.tag.name || 'Programming'

  // Format date
  const dateStr = blog.createdAt
    ? new Date(blog.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : 'Recent'

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45, ease: 'easeOut', delay: (index % 4) * 0.04 }}
      onClick={() => navigate(`/blog/${blog.id}`)}
      className="group py-7 border-b border-rule last:border-b-0 cursor-pointer"
    >
      <div className="flex items-start justify-between gap-6 md:gap-8">
        {/* Left: Text & Meta Content */}
        <div className="flex-1 min-w-0">
          {/* Author / Publication Meta Header */}
          <div className="flex items-center gap-2 mb-2.5 text-[13px] text-meta">
            {blog.author.avatar ? (
              <img
                src={blog.author.avatar}
                alt={authorName}
                className="w-5 h-5 rounded-full object-cover shrink-0"
              />
            ) : (
              <span className="w-5 h-5 rounded-full bg-ink/10 text-ink flex items-center justify-center text-[10px] font-semibold shrink-0">
                {authorName[0]?.toUpperCase()}
              </span>
            )}
            <span className="text-ink-soft">
              In <span className="text-ink font-medium">{tag}</span> by{' '}
              <span className="text-ink-soft">{authorName}</span> · {dateStr}
            </span>
          </div>

          {/* Title */}
          <h2 className="font-serif text-xl md:text-[1.45rem] font-bold leading-snug text-ink group-hover:text-red transition-colors mb-1.5">
            {blog.title}
          </h2>

          {/* Subtitle / Excerpt */}
          <p className="text-ink-soft text-[14px] md:text-[15px] leading-relaxed mb-4 line-clamp-2">
            {blog.summary || blog.content}
          </p>

          {/* Actions & Metrics Row */}
          <div className="flex items-center justify-between text-[13px] text-meta pt-1">
            {/* Left metrics: Star + Claps + Comments + Shares */}
            <div className="flex items-center gap-4">
              <span className="text-amber-500 flex items-center" title="Member-only story">
                <Sparkles size={14} className="fill-amber-500" />
              </span>

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (!token || clapping) return
                  setClapping(true)
                  clap({ postId: blog.id, count: 1 }).finally(() => setClapping(false))
                }}
                className="inline-flex items-center gap-1 hover:text-ink transition-colors"
              >
                <span>👏</span>
                <span className="text-[13px]">
                  {blog._count.claps}
                </span>
              </button>

              <span className="inline-flex items-center gap-1 hover:text-ink transition-colors">
                <MessageSquare size={14} />
                <span className="text-[13px]">
                  {blog._count.comments}
                </span>
              </span>

              <span className="hidden sm:inline-flex items-center gap-1 hover:text-ink transition-colors">
                <Bookmark size={15} />
                <span className="text-[13px]">{blog._count.bookmarks}</span>
              </span>
            </div>

            {/* Right actions: Thumbs down + Bookmark + More */}
            <div
              className="flex items-center gap-3"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                title="Show less like this"
                className="text-meta hover:text-ink transition-colors p-1 rounded hover:bg-paper-dim"
              >
                <ThumbsDown size={15} />
              </button>

              <button
                title={bookmarked ? 'Remove bookmark' : 'Save story'}
                onClick={(e) => {
                  e.stopPropagation()
                  if (!token) return
                  if (bookmarked) {
                    removeBookmark({ postId: blog.id }).then(() => setBookmarked(false))
                  } else {
                    bookmark({ postId: blog.id, name: 'Read Later' }).then(() => setBookmarked(true))
                  }
                }}
                className={`text-meta hover:text-ink transition-colors p-1 rounded hover:bg-paper-dim ${bookmarked ? 'text-ink fill-ink' : ''}`}
              >
                <Bookmark size={15} />
              </button>

              <button
                title="More options"
                className="text-meta hover:text-ink transition-colors p-1 rounded hover:bg-paper-dim"
              >
                <MoreHorizontal size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Cover Thumbnail Image */}
        {blog.coverImage ? (
          <div className="w-28 sm:w-36 md:w-44 h-24 sm:h-28 md:h-28 shrink-0 rounded-lg overflow-hidden bg-paper-dim border border-rule/50">
            <img
              src={blog.coverImage}
              alt={blog.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        ) : (
          <div className="hidden sm:flex w-32 md:w-40 h-24 md:h-28 shrink-0 rounded-lg overflow-hidden bg-paper-dim/80 border border-rule/50 items-center justify-center text-meta/40">
            <div className="text-center p-2">
              <span className="text-2xl font-serif">Aa</span>
            </div>
          </div>
        )}
      </div>
    </motion.article>
  )
}
