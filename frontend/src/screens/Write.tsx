import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import LinkExtension from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import Underline from '@tiptap/extension-underline'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Typography from '@tiptap/extension-typography'
import {
  ArrowLeft,
  Loader2,
  X,
  Plus,
  Image as ImageIcon,
  Eye,
  EyeOff,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAtomValue, useSetAtom } from 'jotai'
import { tokenAtom } from '../store/auth'
import {
  createBlogAtom,
  updateBlogAtom,
  fetchBlogByIdAtom,
  publishBlogAtom,
  unpublishBlogAtom,
} from '../store/blog'
import { showToastAtom } from '../store/ui'
import EditorToolbar from '../components/editor/EditorToolbar'
import HomeNavbar from '../components/HomeNavbar'

const MAX_TAGS = 10

function isValidImageUrl(url: string): boolean {
  return /^https?:\/\/.+\.(png|jpe?g|gif|webp|svg|avif)(\?.*)?$/i.test(url)
}

export default function Write() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const token = useAtomValue(tokenAtom)
  const createBlog = useSetAtom(createBlogAtom)
  const updateBlog = useSetAtom(updateBlogAtom)
  const publishBlog = useSetAtom(publishBlogAtom)
  const unpublishBlog = useSetAtom(unpublishBlogAtom)
  const fetchBlogById = useSetAtom(fetchBlogByIdAtom)
  const showToast = useSetAtom(showToastAtom)

  const isEdit = Boolean(id)

  const [title, setTitle] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [summary, setSummary] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [loading, setLoading] = useState(isEdit)
  const [publishing, setPublishing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [published, setPublished] = useState(false)
  const [editorInitialized, setEditorInitialized] = useState(!isEdit)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Underline,
      Highlight,
      TextStyle,
      Color,
      Typography,
      LinkExtension.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: 'https',
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),
      Image.configure({
        inline: false,
        allowBase64: true,
      }),
      Placeholder.configure({
        placeholder: 'Tell your story…',
      }),
      CharacterCount.configure({ limit: 100000 }),
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    editorProps: {
      attributes: {
        class: 'tiptap-editor',
      },
    },
  })

  // Load data when editing the blog
  useEffect(() => {
    if (!token) return
    if (!isEdit) return
    if (!id) return
  
    let cancelled = false
    fetchBlogById(id).then((blog) => {
      if (cancelled || !blog) return
      setTitle(blog.title || '')
      setCoverImage(blog.coverImage || '')
      setSummary(blog.summary || '')
      setTags((blog.tags || []).map((t) => t.tag.name))
      setPublished(Boolean(blog.published))
      if (editor && !editorInitialized) {
        editor.commands.setContent(blog.content || '')
      }
      setEditorInitialized(true)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [id, isEdit, token, fetchBlogById, editor, editorInitialized])

  // counts how many words and characters are in the editor/blog
  const contentLength = useMemo(() => {
    if (!editor) return 0
    return editor.storage.characterCount.characters()
  }, [editor])

  // fallback ui if the user is not logged in
  if (!token) {
    return (
      <div className="min-h-screen bg-paper flex flex-col items-center justify-center">
        <HomeNavbar />
        <p className="text-meta mb-4">Please sign in to write a story.</p>
        <Link
          to="/signin"
          className="px-5 py-2 bg-ink text-paper rounded-full text-sm hover:bg-red transition-colors"
        >
          Sign in
        </Link>
      </div>
    )
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      editor?.commands.focus()
    }
  }

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const value = tagInput.trim().replace(/^#/, '')
      if (!value) return
      if (tags.includes(value)) {
        setTagInput('')
        return
      }
      if (tags.length >= MAX_TAGS) {
        showToast({ message: `You can add up to ${MAX_TAGS} tags`, type: 'error' })
        return
      }
      setTags((prev) => [...prev, value])
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag))
  }

  const validateAndBuild = () => {
    if (!title.trim()) {
      showToast({ message: 'Please give your story a title', type: 'error' })
      return null
    }
    if (!editor || editor.isEmpty) {
      showToast({ message: 'Your story needs some content', type: 'error' })
      return null
    }
    if (coverImage && !isValidImageUrl(coverImage)) {
      showToast({ message: 'Please enter a valid image URL (.jpg, .png, etc.)', type: 'error' })
      return null
    }
    return {
      title: title.trim(),
      content: editor.getHTML(),
      summary: summary.trim() || undefined,
      coverImage: coverImage.trim() || undefined,
      tags: tags.length ? tags : undefined,
    }
  }

  const handlePublish = async () => {
    const payload = validateAndBuild()
    if (!payload) return
    setPublishing(true)
    try {
      let blogId = id

      // Create a new post first if this is a new story (starts as draft), else save content
      if (isEdit && blogId) {
        const result = await updateBlog({ ...payload, id: blogId })
        if (!result.ok || !result.blog) {
          showToast({ message: result.error || 'Failed to save story', type: 'error' })
          return
        }
        blogId = result.blog.id
      } else if (!blogId) {
        const result = await createBlog(payload)
        if (!result.ok || !result.blog) {
          showToast({ message: result.error || 'Failed to create story', type: 'error' })
          return
        }
        blogId = result.blog.id
      }

      if (!blogId) {
        showToast({ message: 'Something went wrong', type: 'error' })
        return
      }

      // Publish via the dedicated publish endpoint
      const pub = await publishBlog(blogId)
      if (!pub.ok) {
        showToast({ message: pub.error || 'Failed to publish story', type: 'error' })
        return
      }

      setPublished(true)
      showToast({ message: 'Story published!', type: 'success' })
      navigate(`/blog/${blogId}`)
    } catch (e) {
      showToast({ message: (e as Error).message || 'Something went wrong', type: 'error' })
    } finally {
      setPublishing(false)
    }
  }

  const handleUnpublish = async () => {
    if (!id) return
    setPublishing(true)
    try {
      const result = await unpublishBlog(id)
      if (!result.ok) {
        showToast({ message: result.error || 'Failed to unpublish story', type: 'error' })
        return
      }
      setPublished(false)
      showToast({ message: 'Story unpublished', type: 'info' })
    } catch (e) {
      showToast({ message: (e as Error).message || 'Something went wrong', type: 'error' })
    } finally {
      setPublishing(false)
    }
  }

  const handleSaveDraft = async () => {
    const payload = validateAndBuild()
    if (!payload) return
    setSaving(true)
    try {
      let result
      if (isEdit && id) {
        result = await updateBlog({ ...payload, id })
      } else {
        result = await createBlog(payload)
      }
      if (!result.ok || !result.blog) {
        showToast({ message: result.error || 'Failed to save draft', type: 'error' })
        return
      }
      showToast({ message: 'Draft saved', type: 'success' })
      if (!isEdit) {
        navigate(`/write/${result.blog.id}`, { replace: true })
      }
    } catch (e) {
      showToast({ message: (e as Error).message || 'Something went wrong', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-paper">
      <HomeNavbar />

      {/* Top action bar */}
      <div className="fixed top-16 inset-x-0 z-30 bg-paper/95 backdrop-blur-md border-b border-rule h-16 flex items-center justify-between px-4 sm:px-6 md:px-10">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full text-meta hover:text-ink hover:bg-paper-dim transition-colors shrink-0"
            title="Back"
          >
            <ArrowLeft size={18} />
          </button>
          <span className="text-[13px] text-meta truncate">
            {isEdit ? 'Editing story' : 'New story'}
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {isEdit && published && (
            <span className="hidden sm:flex items-center gap-1 text-[12px] text-sage">
              <Eye size={13} />
              Published
            </span>
          )}
          {coverImage && (
            <span className="hidden lg:flex items-center gap-1 text-[12px] text-sage">
              <ImageIcon size={13} />
              Cover set
            </span>
          )}
          {isEdit && published && (
            <button
              onClick={handleUnpublish}
              disabled={loading || saving || publishing}
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-medium text-red border border-rule hover:border-red transition-colors disabled:opacity-40"
              title="Unpublish this story"
            >
              {publishing ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <EyeOff size={14} />
              )}
              Unpublish
            </button>
          )}
          <button
            onClick={handleSaveDraft}
            disabled={loading || saving || publishing}
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-medium text-ink-soft hover:text-ink border border-rule hover:border-ink transition-colors disabled:opacity-40"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            Save draft
          </button>
          <button
            onClick={handlePublish}
            disabled={loading || saving || publishing}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-[13px] font-medium text-paper bg-ink hover:bg-red transition-colors disabled:opacity-40"
            title={isEdit && published ? 'Save changes and update the published story' : 'Publish this story'}
          >
            {publishing ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              isEdit && published ? 'Update' : 'Publish'
            )}
          </button>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-6 sm:px-8 md:px-10 pt-32 pb-24">
        {loading ? (
          <div className="flex flex-col items-center justify-center pt-24 text-meta">
            <Loader2 size={28} className="animate-spin mb-3" />
            <p className="text-[15px]">Loading story…</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            {/* Cover image preview */}
            <AnimatePresence initial={false}>
              {coverImage && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden rounded-2xl bg-paper-dim mb-6"
                >
                  <img
                    src={coverImage}
                    alt="Cover"
                    className="w-full max-h-[340px] object-cover"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Title input */}
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleTitleKeyDown}
              placeholder="Title"
              className="w-full bg-transparent outline-none font-serif font-bold text-3xl sm:text-5xl text-ink placeholder:text-meta/70 pb-4 leading-tight"
              aria-label="Story title"
            />

            {/* Editor body */}
            <div className="pt-4">
              <EditorToolbar editor={editor} />
              <EditorContent editor={editor} />

              <div className="flex items-center justify-between py-2 mt-1 text-[12px] text-meta">
                <span>
                  {contentLength.toLocaleString()} characters
                </span>
              </div>
            </div>

            {/* Cover image URL */}
            <div className="mt-8 pt-6 border-t border-rule">
              <label className="flex items-center gap-2 text-sm font-medium text-ink mb-2">
                <ImageIcon size={15} className="text-meta" />
                Cover image URL
              </label>
              <input
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="https://images.unsplash.com/…  (optional)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-rule focus:border-ink bg-paper-dim/40 focus:bg-paper outline-none text-[14px] text-ink placeholder:text-meta transition-colors"
                onBlur={() => {
                  if (coverImage && !isValidImageUrl(coverImage)) {
                    showToast({ message: 'Enter a valid image URL', type: 'error' })
                  }
                }}
              />
              <p className="text-[12px] text-meta mt-1.5">
                Paste a link to an image (must end in .jpg, .png, .webp, etc.)
              </p>
            </div>

            {/* Summary */}
            <div className="mt-6">
              <label className="flex items-center gap-2 text-sm font-medium text-ink mb-2">
                Summary
              </label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                maxLength={500}
                placeholder="Short description of your story (optional, shown in feeds)"
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-xl border border-rule focus:border-ink bg-paper-dim/40 focus:bg-paper outline-none text-[14px] text-ink placeholder:text-meta resize-none transition-colors"
              />
              <div className="text-right text-[12px] text-meta mt-1">
                {summary.length}/500
              </div>
            </div>

            {/* Tags */}
            <div className="mt-6 pb-8">
              <label className="flex items-center gap-2 text-sm font-medium text-ink mb-2">
                Tags
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-paper-dim text-[13px] text-ink font-medium"
                  >
                    #{tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="text-meta hover:text-red transition-colors"
                      aria-label={`Remove tag ${tag}`}
                    >
                      <X size={13} />
                    </button>
                  </span>
                ))}
                {tags.length < MAX_TAGS && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-dashed border-meta/50 text-meta hover:border-ink hover:text-ink transition-colors">
                    <Plus size={13} />
                    <input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleAddTag}
                      onBlur={() => {
                        if (tagInput.trim()) {
                          handleAddTag({ key: 'Enter', preventDefault: () => {} } as React.KeyboardEvent)
                        }
                      }}
                      placeholder="add tag"
                      className="bg-transparent outline-none text-[13px] w-20 placeholder:text-meta"
                    />
                  </div>
                )}
              </div>
              <p className="text-[12px] text-meta mt-2">
                Press Enter to add a tag (up to {MAX_TAGS})
              </p>
            </div>

            {/* Mobile draft button */}
            <div className="sm:hidden flex items-center justify-end gap-3 mt-6">
              <button
                onClick={handleSaveDraft}
                disabled={saving || publishing}
                className="px-4 py-2 rounded-full text-[13px] font-medium text-ink-soft border border-rule transition-colors disabled:opacity-40"
              >
                {saving ? 'Saving…' : 'Save draft'}
              </button>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  )
}
