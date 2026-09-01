import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Clock,
  MessageSquare,
  Bookmark,
  Eye,
  Loader2,
  Share2,
  Check,
} from 'lucide-react'
import { useAtomValue, useSetAtom } from 'jotai'
import { fetchBlogByIdAtom } from '../store/blog'
import type { BlogDetail } from '../store/blog'
import { tokenAtom } from '../store/auth'
import {
  clapBlogAtom,
  bookmarkBlogAtom,
  removeBookmarkAtom,
} from '../store/engagement'
import HomeNavbar from '../components/HomeNavbar'
import CommentsDrawer from '../components/CommentsDrawer'

export default function BlogDetailScreen() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const token = useAtomValue(tokenAtom)

  const fetchBlog = useSetAtom(fetchBlogByIdAtom)
  const clap = useSetAtom(clapBlogAtom)
  const bookmark = useSetAtom(bookmarkBlogAtom)
  const removeBookmark = useSetAtom(removeBookmarkAtom)

  const [blog, setBlog] = useState<BlogDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Engagement states
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [isClapping, setIsClapping] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

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

  const handleClap = async () => {
    if (!token) {
      navigate('/signin')
      return
    }
    if (!blog || isClapping) return
    setIsClapping(true)
    try {
      const res = await clap({ postId: blog.id, count: 1 })
      setBlog((prev) =>
        prev
          ? {
              ...prev,
              clapsByUser: res.userClaps,
              _count: { ...prev._count, claps: res.totalClaps },
            }
          : prev,
      )
    } catch (err) {
      console.error('Failed to clap:', err)
    } finally {
      setIsClapping(false)
    }
  }

  const handleBookmarkToggle = async () => {
    if (!token) {
      navigate('/signin')
      return
    }
    if (!blog) return
    try {
      if (isBookmarked) {
        await removeBookmark({ postId: blog.id })
        setIsBookmarked(false)
        setBlog((prev) =>
          prev
            ? {
                ...prev,
                _count: {
                  ...prev._count,
                  bookmarks: Math.max(0, prev._count.bookmarks - 1),
                },
              }
            : prev,
        )
      } else {
        await bookmark({ postId: blog.id, name: 'Reading List' })
        setIsBookmarked(true)
        setBlog((prev) =>
          prev
            ? {
                ...prev,
                _count: {
                  ...prev._count,
                  bookmarks: prev._count.bookmarks + 1,
                },
              }
            : prev,
        )
      }
    } catch (err) {
      console.error('Failed to toggle bookmark:', err)
    }
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const handleCommentCountChange = (delta: number) => {
    setBlog((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        _count: {
          ...prev._count,
          comments: Math.max(0, (prev._count?.comments || 0) + delta),
        },
      }
    })
  }

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
          {/* Back button */}
          <button
            onClick={() => navigate('/home')}
            className="inline-flex items-center gap-2 text-meta hover:text-ink text-sm mb-8 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to home
          </button>

          {/* Tag & Title */}
          <div className="mb-6">
            {blog.tags[0] && (
              <span className="text-red text-[13px] tracking-wide uppercase font-medium">
                {blog.tags[0].tag.name}
              </span>
            )}
            <h1 className="font-serif text-3xl md:text-[2.6rem] font-bold leading-tight text-ink mt-3 mb-4">
              {blog.title}
            </h1>

            {/* Author details */}
            <div className="flex items-center gap-3 mb-6">
              {blog.author.avatar ? (
                <img
                  src={blog.author.avatar}
                  alt={authorName}
                  className="w-11 h-11 rounded-full object-cover"
                />
              ) : (
                <span className="w-11 h-11 rounded-full bg-red/15 text-red flex items-center justify-center font-medium text-base">
                  {authorName[0]?.toUpperCase()}
                </span>
              )}
              <div>
                <p className="text-ink font-medium text-[15px]">{authorName}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-meta">
                  <span>
                    {new Date(blog.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
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

            {/* Top Engagement Bar (Medium Style) */}
            <div className="flex items-center justify-between py-3 border-y border-rule text-meta text-[14px] my-6">
              <div className="flex items-center gap-6">
                {/* Claps */}
                <button
                  onClick={handleClap}
                  className={`inline-flex items-center gap-1.5 transition-colors hover:text-ink ${
                    blog.clapsByUser > 0 ? 'text-ink font-medium' : ''
                  }`}
                  title="Clap for this story"
                >
                  <span className="text-base">👏</span>
                  <span>{blog._count.claps}</span>
                </button>

                {/* Comments / Responses Button */}
                <button
                  onClick={() => setCommentsOpen(true)}
                  className="inline-flex items-center gap-1.5 hover:text-ink transition-colors cursor-pointer group"
                  title="View responses"
                >
                  <MessageSquare
                    size={18}
                    className="group-hover:stroke-ink transition-colors"
                  />
                  <span>{blog._count.comments}</span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                {/* Bookmark */}
                <button
                  onClick={handleBookmarkToggle}
                  className={`p-1.5 rounded-full hover:bg-paper-dim hover:text-ink transition-colors ${
                    isBookmarked ? 'text-ink fill-ink' : ''
                  }`}
                  title={isBookmarked ? 'Saved' : 'Save story'}
                >
                  <Bookmark
                    size={17}
                    className={isBookmarked ? 'fill-current' : ''}
                  />
                </button>

                {/* Share Link */}
                <button
                  onClick={handleShare}
                  className="p-1.5 rounded-full hover:bg-paper-dim hover:text-ink transition-colors relative"
                  title="Share story"
                >
                  {copiedLink ? (
                    <Check size={17} className="text-emerald-600" />
                  ) : (
                    <Share2 size={17} />
                  )}
                  {copiedLink && (
                    <span className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-ink text-paper text-[11px] rounded shadow whitespace-nowrap">
                      Link copied!
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Story Cover Image */}
          {blog.coverImage && (
            <div className="mb-8 rounded-2xl overflow-hidden bg-paper-dim">
              <img
                src={blog.coverImage}
                alt={blog.title}
                className="w-full max-h-[440px] object-cover"
              />
            </div>
          )}

          {/* Story Body Content */}
          <div className="prose-invert">
            <p className="text-lg md:text-[1.2rem] leading-relaxed text-ink whitespace-pre-wrap font-serif">
              {blog.content}
            </p>
          </div>

          {/* Bottom Engagement Bar (Medium Style) */}
          <div className="flex items-center justify-between py-4 border-y border-rule text-meta text-[14px] mt-12 mb-8">
            <div className="flex items-center gap-6">
              <button
                onClick={handleClap}
                className={`inline-flex items-center gap-1.5 transition-colors hover:text-ink ${
                  blog.clapsByUser > 0 ? 'text-ink font-medium' : ''
                }`}
                title="Clap for this story"
              >
                <span className="text-base">👏</span>
                <span>
                  {blog._count.claps}
                  {blog.clapsByUser > 0
                    ? ` · you clapped ${blog.clapsByUser}`
                    : ''}
                </span>
              </button>

              <button
                onClick={() => setCommentsOpen(true)}
                className="inline-flex items-center gap-1.5 hover:text-ink transition-colors cursor-pointer group"
                title="View responses"
              >
                <MessageSquare
                  size={18}
                  className="group-hover:stroke-ink transition-colors"
                />
                <span>{blog._count.comments} comments</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleBookmarkToggle}
                className={`p-1.5 rounded-full hover:bg-paper-dim hover:text-ink transition-colors ${
                  isBookmarked ? 'text-ink' : ''
                }`}
                title={isBookmarked ? 'Saved' : 'Save story'}
              >
                <Bookmark
                  size={17}
                  className={isBookmarked ? 'fill-current' : ''}
                />
              </button>

              <button
                onClick={handleShare}
                className="p-1.5 rounded-full hover:bg-paper-dim hover:text-ink transition-colors relative"
                title="Share story"
              >
                {copiedLink ? (
                  <Check size={17} className="text-emerald-600" />
                ) : (
                  <Share2 size={17} />
                )}
                {copiedLink && (
                  <span className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-ink text-paper text-[11px] rounded shadow whitespace-nowrap">
                    Link copied!
                  </span>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Slide-over Comments Drawer Modal */}
      <CommentsDrawer
        isOpen={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        postId={blog.id}
        onCommentCountChange={handleCommentCountChange}
      />
    </div>
  )
}
