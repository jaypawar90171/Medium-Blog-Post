import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Clock,
  MessageSquare,
  Heart,
  Bookmark,
  Eye,
  Loader2,
} from 'lucide-react'
import { useSetAtom } from 'jotai'
import { fetchBlogByIdAtom } from '../store/blog'
import type { BlogDetail } from '../store/blog'
import HomeNavbar from '../components/HomeNavbar'

export default function BlogDetailScreen() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const fetchBlog = useSetAtom(fetchBlogByIdAtom)

  const [blog, setBlog] = useState<BlogDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    if (!id) return
    setLoading(true)
    setError(null)
    fetchBlog(id).then((result) => {
      if (cancelled) return
      if (result) {
        setBlog(result)
      } else {
        setError('This story could not be found.')
      }
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [id, fetchBlog])

  const authorName = blog?.author.name || blog?.author.username || 'Anonymous'

  if (loading) {
    return (
      <div className="min-h-screen bg-paper">
        <HomeNavbar />
        <div className="flex flex-col items-center justify-center pt-40 text-meta">
          <Loader2 size={28} className="animate-spin mb-3" />
          <p className="text-[15px]">Loading story…</p>
        </div>
      </div>
    )
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen bg-paper">
        <HomeNavbar />
        <div className="max-w-3xl mx-auto px-6 md:px-10 pt-32 text-center">
          <p className="text-red mb-4">{error || 'Story not found.'}</p>
          <button
            onClick={() => navigate('/home')}
            className="text-[15px] text-paper bg-ink hover:bg-red transition-colors px-5 py-2.5 rounded-full"
          >
            Back to home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-paper">
      <HomeNavbar />

      <main className="max-w-3xl mx-auto px-6 md:px-10 pt-28 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <button
            onClick={() => navigate('/home')}
            className="inline-flex items-center gap-2 text-meta hover:text-ink text-sm mb-8 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to home
          </button>

          <div className="mb-6">
            {blog.tags[0] && (
              <span className="text-red text-[13px] tracking-wide uppercase font-medium">
                {blog.tags[0].tag.name}
              </span>
            )}
            <h1 className="font-serif text-3xl md:text-[2.6rem] leading-tight text-ink mt-3 mb-4">
              {blog.title}
            </h1>

            <div className="flex items-center gap-3 mb-6">
              {blog.author.avatar ? (
                <img
                  src={blog.author.avatar}
                  alt={authorName}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <span className="w-10 h-10 rounded-full bg-red/15 text-red flex items-center justify-center font-medium">
                  {authorName[0]?.toUpperCase()}
                </span>
              )}
              <div>
                <p className="text-ink text-[15px]">{authorName}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-meta">
                  <span>{new Date(blog.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock size={13} />
                    {blog.readingTime} min read
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Eye size={13} />
                    {blog.views} views
                  </span>
                </div>
              </div>
            </div>
          </div>

          {blog.coverImage && (
            <div className="mb-8 rounded-2xl overflow-hidden bg-paper-dim">
              <img src={blog.coverImage} alt={blog.title} className="w-full max-h-[420px] object-cover" />
            </div>
          )}

          <div className="prose-invert">
            <p className="text-lg md:text-[1.2rem] leading-relaxed text-ink whitespace-pre-wrap">
              {blog.content}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-12 pt-6 border-t border-rule text-[14px] text-meta">
            <span className="inline-flex items-center gap-2">
              <Heart size={18} />
              {blog._count.claps} claps{blog.clapsByUser > 0 ? ` · you clapped ${blog.clapsByUser}` : ''}
            </span>
            <span className="inline-flex items-center gap-2">
              <MessageSquare size={18} />
              {blog._count.comments} comments
            </span>
            <span className="inline-flex items-center gap-2">
              <Bookmark size={18} />
              {blog._count.bookmarks} bookmarks
            </span>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
