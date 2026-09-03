import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  MessageSquare,
  Send,
  Loader2,
  MoreVertical,
  Edit2,
  Trash2,
  Check,
  AlertCircle,
  LogIn,
  CornerDownRight,
  MessageSquareReply,
} from 'lucide-react'
import { useAtomValue, useSetAtom } from 'jotai'
import { useNavigate } from 'react-router-dom'
import {
  commentsAtom,
  commentsLoadingAtom,
  commentsErrorAtom,
  fetchCommentsAtom,
  addCommentAtom,
  updateCommentAtom,
  deleteCommentAtom,
  fetchRepliesAtom,
  repliesByParentIdAtom,
} from '../store/engagement'
import type { Comment } from '../store/engagement'
import { userAtom, tokenAtom } from '../store/auth'
import { showToastAtom } from '../store/ui'

interface CommentsDrawerProps {
  isOpen: boolean
  onClose: () => void
  postId: string
  onCommentCountChange?: (delta: number) => void
}

// Relative time formatting helper
function formatTimeAgo(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) {
      const mins = Math.floor(diffInSeconds / 60)
      return `${mins}m ago`
    }
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `${hours}h ago`
    }
    if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400)
      return `${days}d ago`
    }
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    })
  } catch {
    return 'Recent'
  }
}

export default function CommentsDrawer({
  isOpen,
  onClose,
  postId,
  onCommentCountChange,
}: CommentsDrawerProps) {
  const navigate = useNavigate()
  const comments = useAtomValue(commentsAtom)
  const loading = useAtomValue(commentsLoadingAtom)
  const fetchError = useAtomValue(commentsErrorAtom)

  const fetchComments = useSetAtom(fetchCommentsAtom)
  const addComment = useSetAtom(addCommentAtom)
  const updateComment = useSetAtom(updateCommentAtom)
  const deleteComment = useSetAtom(deleteCommentAtom)
  const fetchReplies = useSetAtom(fetchRepliesAtom)
  const repliesByParent = useAtomValue(repliesByParentIdAtom)
  const showToast = useSetAtom(showToastAtom)

  const user = useAtomValue(userAtom)
  const token = useAtomValue(tokenAtom)

  // Local state
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isFocused, setIsFocused] = useState(false)

  // Reply state
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [replySubmitting, setReplySubmitting] = useState(false)
  const [replyError, setReplyError] = useState<string | null>(null)

  // Loaded replies set (parent ids whose replies have been fetched)
  const [loadedReplies, setLoadedReplies] = useState<Set<string>>(new Set())
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set())

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Fetch comments when drawer opens
  useEffect(() => {
    if (isOpen && postId) {
      fetchComments({ postId }).catch(() => {})
    }
  }, [isOpen, postId, fetchComments])

  // Handle ESC key and body scroll lock
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = originalOverflow
    }
  }, [isOpen, onClose])

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null)
    if (activeMenuId) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [activeMenuId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || isSubmitting) return

    if (!token) {
      setSubmitError('Please sign in to leave a response.')
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      await addComment({ postId, content: content.trim() })
      setContent('')
      setIsFocused(false)
      onCommentCountChange?.(1)
      showToast({ message: 'Response published', type: 'success' })
    } catch (err) {
      setSubmitError((err as Error).message || 'Failed to post comment')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStartEdit = (comment: Comment) => {
    setEditingId(comment.id)
    setEditContent(comment.content)
    setActiveMenuId(null)
  }

  const handleSaveEdit = async (commentId: string) => {
    if (!editContent.trim() || isUpdating) return
    setIsUpdating(true)
    try {
      await updateComment({ id: commentId, content: editContent.trim() })
      setEditingId(null)
      setEditContent('')
      showToast({ message: 'Response updated', type: 'success' })
    } catch (err) {
      showToast({
        message: (err as Error).message || 'Failed to update response',
        type: 'error',
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async (commentId: string) => {
    if (deletingId) return
    if (!window.confirm('Are you sure you want to delete this response?')) return

    setDeletingId(commentId)
    setActiveMenuId(null)
    try {
      await deleteComment({ id: commentId, postId })
      onCommentCountChange?.(-1)
      showToast({ message: 'Response deleted', type: 'info' })
    } catch (err) {
      showToast({
        message: (err as Error).message || 'Failed to delete response',
        type: 'error',
      })
    } finally {
      setDeletingId(null)
    }
  }

  const currentUserName = user?.name || user?.username || 'You'

  // Toggle the replies section of a parent comment, loading them on first open
  const toggleReplies = async (parentId: string) => {
    if (!loadedReplies.has(parentId)) {
      await fetchReplies({ parentId })
      setLoadedReplies((prev) => new Set(prev).add(parentId))
    }
    setExpandedReplies((prev) => {
      const next = new Set(prev)
      if (next.has(parentId)) next.delete(parentId)
      else next.add(parentId)
      return next
    })
  }

  const startReply = (commentId: string) => {
    if (replyingTo === commentId) {
      setReplyingTo(null)
      setReplyContent('')
      setReplyError(null)
    } else {
      setReplyingTo(commentId)
      setReplyContent('')
      setReplyError(null)
    }
  }

  const handleReplySubmit = async (e: React.FormEvent, parentId: string) => {
    e.preventDefault()
    if (!replyContent.trim() || replySubmitting) return

    if (!token) {
      setReplyError('Please sign in to reply.')
      return
    }

    setReplySubmitting(true)
    setReplyError(null)
    try {
      await addComment({ postId, content: replyContent.trim(), parentId })
      // Keep the parent's replies expanded + loaded
      setRepliesLoadedState(parentId)
      setReplyContent('')
      setReplyingTo(null)
      onCommentCountChange?.(1)
      showToast({ message: 'Reply published', type: 'success' })
    } catch (err) {
      setReplyError((err as Error).message || 'Failed to post reply')
    } finally {
      setReplySubmitting(false)
    }
  }

  const setRepliesLoadedState = (parentId: string) => {
    setLoadedReplies((prev) => new Set(prev).add(parentId))
    setExpandedReplies((prev) => new Set(prev).add(parentId))
    // Re-fetch to get server truth
    fetchReplies({ parentId })
  }

  const renderCommentCard = (comment: Comment, _parentId: string | null, isReply = false) => {
    const authorDisplayName =
      comment.author.name || comment.author.username || 'Anonymous'
    const isOwner = user?.id === comment.author.id
    const isEditing = editingId === comment.id
    const isDeleting = deletingId === comment.id
    const replyCount = Number(comment._count?.replies || 0)

    return (
      <div
        key={comment.id}
        className={`py-4 ${isReply ? '' : 'border-b border-rule/60 last:border-b-0'} space-y-2.5 transition-colors`}
      >
        {/* Comment Header: Author & Options */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {comment.author.avatar ? (
              <img
                src={comment.author.avatar}
                alt={authorDisplayName}
                className="w-7 h-7 rounded-full object-cover"
              />
            ) : (
              <span className={`rounded-full bg-ink/10 text-ink text-[11px] font-semibold flex items-center justify-center shrink-0 ${isReply ? 'w-6 h-6' : 'w-7 h-7'}`}>
                {authorDisplayName[0]?.toUpperCase()}
              </span>
            )}
            <div>
              <p className={`font-semibold text-ink leading-none ${isReply ? 'text-[11px]' : 'text-xs'}`}>
                {authorDisplayName}
              </p>
              <p className="text-[11px] text-meta mt-1">
                {formatTimeAgo(comment.createdAt)}
                {comment.updatedAt &&
                  comment.updatedAt !== comment.createdAt && (
                    <span className="ml-1 text-[10px] text-meta italic">
                      (edited)
                    </span>
                  )}
              </p>
            </div>
          </div>

          {/* Owner Actions Dropdown */}
          {isOwner && (
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setActiveMenuId(activeMenuId === comment.id ? null : comment.id)
                }}
                className="p-1 rounded-full text-meta hover:text-ink hover:bg-paper-dim transition-colors"
              >
                <MoreVertical size={15} />
              </button>

              {activeMenuId === comment.id && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 top-full mt-1 w-32 bg-paper border border-rule rounded-xl shadow-lg py-1 z-20"
                >
                  <button
                    onClick={() => handleStartEdit(comment)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-ink hover:bg-paper-dim text-left"
                  >
                    <Edit2 size={13} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(comment.id)}
                    disabled={isDeleting}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red hover:bg-red/10 text-left disabled:opacity-50"
                  >
                    <Trash2 size={13} />
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Comment Content / Edit Mode */}
        {isEditing ? (
          <div className="pt-1">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={3}
              className="w-full bg-paper-dim/60 border border-rule rounded-xl p-2.5 text-xs text-ink placeholder:text-meta resize-none outline-none focus:border-ink"
            />
            <div className="flex items-center justify-end gap-2 mt-2">
              <button
                onClick={() => {
                  setEditingId(null)
                  setEditContent('')
                }}
                className="px-2.5 py-1 text-xs text-meta hover:text-ink rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveEdit(comment.id)}
                disabled={!editContent.trim() || isUpdating}
                className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-ink text-paper rounded-lg hover:bg-red transition-colors disabled:opacity-50"
              >
                {isUpdating ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Check size={12} />
                )}
                Save
              </button>
            </div>
          </div>
        ) : (
          <p
            className={`text-ink-soft leading-relaxed whitespace-pre-wrap ${
              isReply ? 'text-[13px]' : 'text-[13.5px]'
            }`}
          >
            {comment.content}
          </p>
        )}

        {/* Reply action (all comments) + View replies (top-level only) */}
        <div className="flex items-center gap-4 pt-1">
          <button
            onClick={() => startReply(comment.id)}
            className="inline-flex items-center gap-1.5 text-[11px] font-medium text-meta hover:text-ink transition-colors"
          >
            <CornerDownRight size={13} />
            Reply
          </button>
          {!isReply && replyCount > 0 && (
            <button
              onClick={() => toggleReplies(comment.id)}
              className="inline-flex items-center gap-1.5 text-[11px] font-medium text-meta hover:text-ink transition-colors"
            >
              <MessageSquareReply size={13} />
              {expandedReplies.has(comment.id)
                ? 'Hide replies'
                : `View ${replyCount} ${replyCount === 1 ? 'reply' : 'replies'}`}
            </button>
          )}
        </div>

        {/* Nested reply composer */}
        {replyingTo === comment.id && (
          <form
            onSubmit={(e) => handleReplySubmit(e, comment.id)}
            className="mt-2.5 rounded-xl border border-rule/80 bg-paper-dim/40 p-3 space-y-2"
          >
            {token ? (
              <>
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  rows={2}
                  placeholder={`Reply to ${authorDisplayName}…`}
                  autoFocus
                  className="w-full bg-transparent text-[13px] text-ink placeholder:text-meta resize-none outline-none leading-relaxed"
                />
                {replyError && (
                  <div className="flex items-center gap-2 text-red text-xs">
                    <AlertCircle size={14} />
                    <span>{replyError}</span>
                  </div>
                )}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-rule/40">
                  <button
                    type="button"
                    onClick={() => startReply(comment.id)}
                    className="px-3 py-1 text-xs font-medium text-meta hover:text-ink transition-colors rounded-full"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!replyContent.trim() || replySubmitting}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white rounded-full transition-all shadow-sm"
                  >
                    {replySubmitting ? (
                      <>
                        <Loader2 size={12} className="animate-spin" />
                        <span>Posting…</span>
                      </>
                    ) : (
                      <>
                        <Send size={12} />
                        <span>Reply</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div className="py-1 text-center">
                <p className="text-xs text-ink-soft mb-2">Sign in to reply.</p>
                <button
                  type="button"
                  onClick={() => navigate('/signin')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-ink text-paper rounded-full hover:bg-red transition-colors"
                >
                  <LogIn size={13} />
                  Sign in
                </button>
              </div>
            )}
          </form>
        )}

        {/* Nested replies list (top-level only) */}
        {!isReply && expandedReplies.has(comment.id) && (
          <div className="mt-2 space-y-0 pl-4 border-l border-rule/60">
            {repliesByParent[comment.id]?.length ? (
              repliesByParent[comment.id].map((reply) =>
                renderCommentCard(reply, comment.id, true),
              )
            ) : (
              <p className="text-[12px] text-meta py-1">No replies yet.</p>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 bg-ink/40 backdrop-blur-sm"
          />

          {/* Slide-over Drawer Panel */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            className="relative w-full sm:w-[440px] md:w-[480px] h-full bg-paper border-l border-rule shadow-2xl flex flex-col z-10 select-text"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-rule shrink-0 bg-paper">
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-xl font-bold text-ink">
                  Responses
                </h2>
                <span className="text-sm font-sans font-medium text-meta px-2 py-0.5 rounded-full bg-paper-dim">
                  {comments.length}
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full text-meta hover:text-ink hover:bg-paper-dim transition-colors"
                aria-label="Close responses"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Content Container */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 scrollbar-thin">
              {/* Comment Composer */}
              <div className="rounded-2xl border border-rule/80 bg-paper-dim/40 p-4 shadow-sm transition-all focus-within:border-ink/40 focus-within:bg-paper">
                {token ? (
                  <form onSubmit={handleSubmit}>
                    {/* User Profile info */}
                    <div className="flex items-center gap-3 mb-3">
                      <span className="w-8 h-8 rounded-full bg-red/15 text-red font-semibold text-xs flex items-center justify-center shrink-0">
                        {currentUserName[0]?.toUpperCase()}
                      </span>
                      <span className="text-sm font-medium text-ink">
                        {currentUserName}
                      </span>
                    </div>

                    {/* Textarea */}
                    <textarea
                      ref={textareaRef}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      onFocus={() => setIsFocused(true)}
                      placeholder="What are your thoughts?"
                      rows={isFocused || content ? 3 : 2}
                      className="w-full bg-transparent text-[14px] text-ink placeholder:text-meta resize-none outline-none leading-relaxed transition-all"
                    />

                    {submitError && (
                      <div className="flex items-center gap-2 text-red text-xs mt-2">
                        <AlertCircle size={14} />
                        <span>{submitError}</span>
                      </div>
                    )}

                    {/* Composer Action Buttons */}
                    {(isFocused || content.length > 0) && (
                      <div className="flex items-center justify-end gap-2 pt-3 mt-2 border-t border-rule/40">
                        <button
                          type="button"
                          onClick={() => {
                            setContent('')
                            setIsFocused(false)
                            setSubmitError(null)
                          }}
                          className="px-3.5 py-1.5 text-xs font-medium text-meta hover:text-ink transition-colors rounded-full"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={!content.trim() || isSubmitting}
                          className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white rounded-full transition-all shadow-sm"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 size={13} className="animate-spin" />
                              <span>Responding…</span>
                            </>
                          ) : (
                            <>
                              <Send size={12} />
                              <span>Respond</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </form>
                ) : (
                  <div className="py-2 text-center">
                    <p className="text-sm text-ink-soft mb-3">
                      Join the discussion and share your thoughts.
                    </p>
                    <button
                      onClick={() => navigate('/signin')}
                      className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium bg-ink text-paper rounded-full hover:bg-red transition-colors"
                    >
                      <LogIn size={14} />
                      Sign in to respond
                    </button>
                  </div>
                )}
              </div>

              {/* Feed of Comments */}
              <div className="space-y-4 pt-2">
                {loading && comments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-meta">
                    <Loader2 size={24} className="animate-spin mb-2 text-ink-soft" />
                    <p className="text-xs">Loading responses…</p>
                  </div>
                ) : fetchError && comments.length === 0 ? (
                  <div className="py-10 text-center text-red text-xs">
                    {fetchError}
                  </div>
                ) : comments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center text-meta">
                    <div className="w-12 h-12 rounded-full bg-paper-dim flex items-center justify-center mb-3">
                      <MessageSquare size={20} className="text-meta" />
                    </div>
                    <p className="text-sm font-medium text-ink mb-1">
                      No responses yet
                    </p>
                    <p className="text-xs text-meta max-w-[240px]">
                      Be the first to share your thoughts on this story.
                    </p>
                  </div>
                ) : (
                  comments.map((comment) => renderCommentCard(comment, null))
                )}
              </div>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  )
}
