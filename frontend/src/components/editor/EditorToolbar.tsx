import { useCallback, useEffect, useRef, useState } from 'react'
import type { Editor } from '@tiptap/react'
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  Code,
  Image,
  Link,
  Unlink,
  Undo2,
  Redo2,
  Highlighter,
  Minus,
  Eraser,
} from 'lucide-react'

interface EditorToolbarProps {
  editor: Editor | null
}

function ToolbarButton({
  active,
  disabled,
  onClick,
  title,
  children,
}: {
  active?: boolean
  disabled?: boolean
  onClick: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`p-2 rounded-lg transition-colors ${active
          ? 'bg-paper-dim text-ink'
          : 'text-meta hover:text-ink hover:bg-paper-dim/60'
        } disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <span className="w-px h-5 bg-rule mx-1 shrink-0" />
}

export default function EditorToolbar({ editor }: EditorToolbarProps) {
  const [, forceUpdate] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!editor) return
    const handleTransaction = () => forceUpdate((n) => n + 1)
    editor.on('transaction', handleTransaction)
    return () => {
      editor.off('transaction', handleTransaction)
    }
  }, [editor])

  const setLink = useCallback(() => {
    if (!editor) return
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('Enter the URL:', previousUrl || 'https://')
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  const addImage = useCallback(
    (src?: string) => {
      if (!editor) return
      let url = src
      if (!url) {
        url = window.prompt('Enter image URL:') || ''
      }
      if (url) {
        editor.chain().focus().setImage({ src: url }).run()
      }
    },
    [editor],
  )

  if (!editor) return null

  return (
    <div className="flex items-center gap-0.5 flex-wrap py-2 border-b border-rule">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) {
            const reader = new FileReader()
            reader.onload = (ev) => {
              const dataUrl = ev.target?.result as string
              addImage(dataUrl)
            }
            reader.readAsDataURL(file)
            e.target.value = ''
          }
        }}
      />
      <ToolbarButton
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
        title="Bold (Ctrl+B)"
      >
        <Bold size={16} />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        title="Italic (Ctrl+I)"
      >
        <Italic size={16} />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive('underline')}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        title="Underline"
      >
        <Underline size={16} />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive('strike')}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        title="Strikethrough"
      >
        <Strikethrough size={16} />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive('highlight')}
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        title="Highlight"
      >
        <Highlighter size={16} />
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        active={editor.isActive('heading', { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        title="Heading 1"
      >
        <Heading1 size={16} />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive('heading', { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        title="Heading 2"
      >
        <Heading2 size={16} />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive('heading', { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        title="Heading 3"
      >
        <Heading3 size={16} />
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title="Bullet list"
      >
        <List size={16} />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        title="Numbered list"
      >
        <ListOrdered size={16} />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive('taskList')}
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        title="Task list"
      >
        <ListChecks size={16} />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive('blockquote')}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        title="Quote"
      >
        <Quote size={16} />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive('codeBlock')}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        title="Code block"
      >
        <Code size={16} />
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        active={editor.isActive('link')}
        onClick={setLink}
        title="Add link (Ctrl+K)"
      >
        <Link size={16} />
      </ToolbarButton>
      <ToolbarButton
        disabled={!editor.isActive('link')}
        onClick={() => editor.chain().focus().unsetLink().run()}
        title="Remove link"
      >
        <Unlink size={16} />
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        onClick={() => fileRef.current?.click()}
        title="Insert image"
      >
        <Image size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() =>
          editor.chain().focus().setHorizontalRule().run()
        }
        title="Horizontal rule"
      >
        <Minus size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
        title="Clear formatting"
      >
        <Eraser size={16} />
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        disabled={!editor.can().chain().focus().undo().run()}
        onClick={() => editor.chain().focus().undo().run()}
        title="Undo"
      >
        <Undo2 size={16} />
      </ToolbarButton>
      <ToolbarButton
        disabled={!editor.can().chain().focus().redo().run()}
        onClick={() => editor.chain().focus().redo().run()}
        title="Redo"
      >
        <Redo2 size={16} />
      </ToolbarButton>
    </div>
  )
}
