import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Bookmark,
  Plus,
  Check,
  Loader2,
  Lock,
  BookmarkCheck,
} from 'lucide-react'
import { useAtomValue, useSetAtom } from 'jotai'
import { useNavigate } from 'react-router-dom'
import { tokenAtom } from '../store/auth'
import {
  bookmarkBlogAtom,
  removeBookmarkAtom,
  fetchBookmarkListsAtom,
  fetchPostBookmarkStatusAtom,
} from '../store/engagement'
import { showToastAtom } from '../store/ui'

interface BookmarkModalProps {
  isOpen: boolean
  onClose: () => void
  postId: string
  initialBookmarkedLists?: string[]
  onBookmarkStatusChange?: (
    isBookmarked: boolean,
    savedLists: string[],
    delta: number,
  ) => void
}

export default function BookmarkModal({
  isOpen,
  onClose,
  postId,
  initialBookmarkedLists,
  onBookmarkStatusChange,
}: BookmarkModalProps) {
  const navigate = useNavigate()
  const token = useAtomValue(tokenAtom)

  const bookmarkBlog = useSetAtom(bookmarkBlogAtom)
  const removeBookmark = useSetAtom(removeBookmarkAtom)
  const fetchLists = useSetAtom(fetchBookmarkListsAtom)
  const fetchStatus = useSetAtom(fetchPostBookmarkStatusAtom)
  const showToast = useSetAtom(showToastAtom)

  const [availableLists, setAvailableLists] = useState<string[]>(['Reading list'])
  const [savedLists, setSavedLists] = useState<string[]>(initialBookmarkedLists || [])
  const [loading, setLoading] = useState(false)
  const [togglingList, setTogglingList] = useState<string | null>(null)

  // Create new list mode
  const [isCreating, setIsCreating] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [isCreatingLoading, setIsCreatingLoading] = useState(false)

  // Fetch lists and post status whenever modal opens
  useEffect(() => {
    if (!isOpen || !postId) return

    if (!token) {
      navigate('/signin')
      onClose()
      return
    }

    let cancelled = false
    setLoading(true)

    Promise.all([
      fetchLists(),
      fetchStatus({ postId }),
    ])
      .then(([listsRes, statusRes]) => {
        if (cancelled) return
        if (listsRes?.lists) {
          setAvailableLists(listsRes.lists)
        }
        if (statusRes?.lists) {
          setSavedLists(statusRes.lists)
        }
      })
      .catch((err) => {
        console.error('Failed to load bookmark lists:', err)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [isOpen, postId, token, fetchLists, fetchStatus, navigate, onClose])

  // ESC key listener
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const handleToggleList = async (listName: string) => {
    if (togglingList) return
    setTogglingList(listName)

    const isCurrentlySaved = savedLists.includes(listName)
    const nextSavedLists = isCurrentlySaved
      ? savedLists.filter((l) => l !== listName)
      : [...savedLists, listName]

    // Calculate delta for total bookmark count if status goes 0 -> 1 or 1 -> 0
    const wasBookmarked = savedLists.length > 0
    const willBeBookmarked = nextSavedLists.length > 0
    const countDelta = !wasBookmarked && willBeBookmarked ? 1 : wasBookmarked && !willBeBookmarked ? -1 : 0

    // Immediate optimistic update
    setSavedLists(nextSavedLists)
    onBookmarkStatusChange?.(willBeBookmarked, nextSavedLists, countDelta)

    try {
      if (isCurrentlySaved) {
        await removeBookmark({ postId, list: listName })
        showToast({
          message: `Removed from ${listName}`,
          type: 'info',
        })
      } else {
        await bookmarkBlog({ postId, list: listName })
        showToast({
          message: `Saved to ${listName}`,
          type: 'success',
        })
      }
    } catch (err) {
      // Rollback on error
      setSavedLists(savedLists)
      onBookmarkStatusChange?.(wasBookmarked, savedLists, -countDelta)
      showToast({
        message: (err as Error).message || 'Failed to update bookmark',
        type: 'error',
      })
    } finally {
      setTogglingList(null)
    }
  }

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newListName.trim()
    if (!trimmed || isCreatingLoading) return

    setIsCreatingLoading(true)
    try {
      await bookmarkBlog({ postId, list: trimmed })

      if (!availableLists.includes(trimmed)) {
        setAvailableLists((prev) => [...prev, trimmed])
      }

      const nextSavedLists = [...savedLists, trimmed]
      const wasBookmarked = savedLists.length > 0
      const countDelta = wasBookmarked ? 0 : 1

      setSavedLists(nextSavedLists)
      onBookmarkStatusChange?.(true, nextSavedLists, countDelta)

      showToast({
        message: `Saved to new list "${trimmed}"`,
        type: 'success',
      })

      setNewListName('')
      setIsCreating(false)
    } catch (err) {
      showToast({
        message: (err as Error).message || 'Failed to create list',
        type: 'error',
      })
    } finally {
      setIsCreatingLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-ink/40 backdrop-blur-sm"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 10 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="relative w-full max-w-sm bg-paper border border-rule rounded-2xl shadow-2xl overflow-hidden z-10 select-text"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-rule">
              <div className="flex items-center gap-2">
                <BookmarkCheck size={18} className="text-red" />
                <h3 className="font-serif text-lg font-bold text-ink">
                  Save to list
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full text-meta hover:text-ink hover:bg-paper-dim transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {loading && availableLists.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-meta">
                  <Loader2 size={22} className="animate-spin mr-2" />
                  <span className="text-xs">Loading lists…</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {availableLists.map((listName) => {
                    const isChecked = savedLists.includes(listName)
                    const isToggling = togglingList === listName

                    return (
                      <button
                        key={listName}
                        onClick={() => handleToggleList(listName)}
                        disabled={isToggling}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                          isChecked
                            ? 'border-ink bg-paper-dim/60 text-ink shadow-sm'
                            : 'border-rule/80 hover:border-rule text-ink-soft hover:bg-paper-dim/30'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Bookmark
                            size={16}
                            className={
                              isChecked
                                ? 'fill-red text-red'
                                : 'text-meta'
                            }
                          />
                          <div>
                            <p className="text-[14px] font-medium leading-none">
                              {listName}
                            </p>
                            {listName === 'Reading list' && (
                              <p className="text-[11px] text-meta mt-1 flex items-center gap-1">
                                <Lock size={10} /> Default private list
                              </p>
                            )}
                          </div>
                        </div>

                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                            isChecked
                              ? 'bg-ink border-ink text-paper'
                              : 'border-rule bg-paper'
                          }`}
                        >
                          {isToggling ? (
                            <Loader2 size={12} className="animate-spin text-ink" />
                          ) : isChecked ? (
                            <Check size={13} className="stroke-[2.5]" />
                          ) : null}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Create new list section */}
              <div className="mt-5 pt-4 border-t border-rule/70">
                {isCreating ? (
                  <form onSubmit={handleCreateList} className="space-y-3">
                    <input
                      type="text"
                      autoFocus
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      placeholder="List name (e.g. AI Trends, Design)"
                      className="w-full px-3.5 py-2 text-[13.5px] bg-paper-dim/50 border border-rule rounded-xl outline-none focus:border-ink transition-colors text-ink placeholder:text-meta"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsCreating(false)
                          setNewListName('')
                        }}
                        className="px-3 py-1.5 text-xs text-meta hover:text-ink transition-colors rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={!newListName.trim() || isCreatingLoading}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium bg-ink text-paper rounded-full hover:bg-red transition-colors disabled:opacity-50"
                      >
                        {isCreatingLoading ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Check size={12} />
                        )}
                        Create & save
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    onClick={() => setIsCreating(true)}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 text-[13px] font-medium text-ink-soft hover:text-ink hover:bg-paper-dim rounded-xl border border-dashed border-rule transition-colors"
                  >
                    <Plus size={15} />
                    <span>Create new list</span>
                  </button>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-paper-dim/40 border-t border-rule/60 flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-1.5 text-xs font-medium bg-ink text-paper rounded-full hover:bg-red transition-colors"
              >
                Done
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
