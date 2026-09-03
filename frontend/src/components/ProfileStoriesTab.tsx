import { motion } from 'framer-motion'
import {
  Sparkles,
  MessageSquare,
  Bookmark,
  Trash2,
  Edit3,
  BookOpen,
  Loader2,
  Clock,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { plainExcerpt } from '../lib/text'
import type { Blog } from '../store/blog'

interface ProfileStoriesTabProps {
  blogs: Blog[]
  loading: boolean
  isOwner: boolean
  onDeleteBlog?: (id: string) => void
}

export default function ProfileStoriesTab({
  blogs,
  loading,
  isOwner,
  onDeleteBlog,
}: ProfileStoriesTabProps) {
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-meta">
        <Loader2 size={26} className="animate-spin mb-2.5 text-ink-soft" />
        <p className="text-xs">Loading stories…</p>
      </div>
    )
  }

  if (blogs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center text-meta">
        <div className="w-14 h-14 rounded-full bg-paper-dim flex items-center justify-center mb-3">
          <BookOpen size={24} className="text-meta" />
        </div>
        <h4 className="text-base font-medium text-ink mb-1">
          {isOwner ? 'You have not published any stories yet.' : 'No stories published yet.'}
        </h4>
        <p className="text-xs text-meta max-w-sm mb-5">
          {isOwner
            ? 'Share your thoughts, ideas, and knowledge with readers around the world.'
            : 'Check back later for new stories and articles.'}
        </p>
        {isOwner && (
          <button
            onClick={() => navigate('/home')}
            className="px-5 py-2 text-xs font-medium bg-ink text-paper rounded-full hover:bg-red transition-colors"
          >
            Start writing
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="divide-y divide-rule/70">
      {blogs.map((blog, idx) => {
        const dateStr = blog.createdAt
          ? new Date(blog.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })
          : 'Recent'
        const tag = blog.tags[0]?.tag.name || 'Story'

        return (
          <motion.article
            key={blog.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: idx * 0.04 }}
            className="group py-7 first:pt-4 cursor-pointer"
            onClick={() => navigate(`/blog/${blog.id}`)}
          >
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1 min-w-0">
                {/* Meta header */}
                <div className="flex items-center gap-2 mb-2 text-[12.5px] text-meta">
                  <span className="text-red font-medium uppercase tracking-wide text-[11px]">
                    {tag}
                  </span>
                  <span>·</span>
                  <span>{dateStr}</span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock size={12} />
                    {blog.readingTime} min read
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-serif text-xl font-bold leading-snug text-ink group-hover:text-red transition-colors mb-2">
                  {blog.title}
                </h3>

                {/* Excerpt */}
                <p className="text-ink-soft text-[14px] leading-relaxed mb-4 line-clamp-2">
                  {blog.summary || plainExcerpt(blog.content, 200)}
                </p>

                {/* Actions & Metrics */}
                <div className="flex items-center justify-between text-xs text-meta pt-1">
                  <div className="flex items-center gap-4">
                    <span className="inline-flex items-center gap-1">
                      <span>👏</span>
                      <span>{blog._count?.claps || 0}</span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MessageSquare size={13} />
                      <span>{blog._count?.comments || 0}</span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Bookmark size={13} />
                      <span>{blog._count?.bookmarks || 0}</span>
                    </span>
                  </div>

                  {isOwner && (
                    <div
                      className="flex items-center gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => navigate(`/write/${blog.id}`)}
                        title="Edit story"
                        className="p-1.5 text-meta hover:text-ink hover:bg-paper-dim/60 rounded-lg transition-colors"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => {
                          if (
                            window.confirm(
                              'Are you sure you want to delete this story?',
                            )
                          ) {
                            onDeleteBlog?.(blog.id)
                          }
                        }}
                        title="Delete story"
                        className="p-1.5 text-meta hover:text-red hover:bg-red/10 rounded-lg transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Cover thumbnail */}
              {blog.coverImage && (
                <div className="w-24 sm:w-32 md:w-36 h-20 sm:h-24 shrink-0 rounded-xl overflow-hidden bg-paper-dim border border-rule/50">
                  <img
                    src={blog.coverImage}
                    alt={blog.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              )}
            </div>
          </motion.article>
        )
      })}
    </div>
  )
}
