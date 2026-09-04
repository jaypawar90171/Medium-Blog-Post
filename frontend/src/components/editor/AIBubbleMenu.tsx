import { useCallback, useEffect, useRef, useState } from 'react'
import type { Editor } from '@tiptap/react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Sparkles,
  PenLine,
  Wrench,
  Minimize2,
  Maximize2,
  AlignLeft,
  ArrowRightLeft,
  ChevronRight,
} from 'lucide-react'
import { posToDOMRect } from '@tiptap/react'
import type { AIAction } from '../../lib/aiService'

interface AIBubbleMenuProps {
  editor: Editor
  onAIAction: (action: AIAction, selectedText: string, tone?: string) => void
}

interface BubbleMenuItem {
  label: string
  icon: React.ReactNode
  action: AIAction
}

const BUBBLE_ITEMS: BubbleMenuItem[] = [
  { label: 'Improve Writing', icon: <PenLine size={15} />, action: 'improve_writing' },
  { label: 'Fix Grammar', icon: <Wrench size={15} />, action: 'fix_grammar' },
  { label: 'Make Shorter', icon: <Minimize2 size={15} />, action: 'make_shorter' },
  { label: 'Make Longer', icon: <Maximize2 size={15} />, action: 'make_longer' },
  { label: 'Change Tone', icon: <ArrowRightLeft size={15} />, action: 'change_tone' },
  { label: 'Summarize', icon: <AlignLeft size={15} />, action: 'summarize' },
]

const TONES = ['Professional', 'Casual', 'Academic', 'Creative']

export default function AIBubbleMenu({ editor, onAIAction }: AIBubbleMenuProps) {
  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [expanded, setExpanded] = useState(false)
  const [showTones, setShowTones] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const updatePosition = useCallback(() => {
    const { from, to } = editor.state.selection
    if (from === to) {
      setVisible(false)
      return
    }
    const view = editor.view
    const rect = posToDOMRect(view, from, to)
    const menuWidth = menuRef.current?.offsetWidth || 200

    setPosition({
      top: rect.top - 48 - window.scrollY,
      left: (rect.left + rect.right) / 2 - menuWidth / 2,
    })
    setVisible(true)
  }, [editor])

  useEffect(() => {
    const handleBlur = () => {
      setTimeout(() => {
        setVisible(false)
        setExpanded(false)
        setShowTones(false)
      }, 150)
    }
    editor.on('selectionUpdate', updatePosition)
    editor.on('blur', handleBlur)
    return () => {
      editor.off('selectionUpdate', updatePosition)
      editor.off('blur', handleBlur)
    }
  }, [editor, updatePosition])

  const handleSelect = (item: BubbleMenuItem) => {
    const { from, to } = editor.state.selection
    const selectedText = editor.state.doc.textBetween(from, to, ' ')
    if (item.action === 'change_tone') {
      setShowTones(true)
      return
    }
    onAIAction(item.action, selectedText)
    setExpanded(false)
    setVisible(false)
  }

  const handleToneSelect = (tone: string) => {
    const { from, to } = editor.state.selection
    const selectedText = editor.state.doc.textBetween(from, to, ' ')
    onAIAction('change_tone', selectedText, tone)
    setExpanded(false)
    setShowTones(false)
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      ref={menuRef}
      className="ai-bubble-menu fixed z-50"
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
    >
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.12 }}
          className="flex items-center rounded-xl border border-rule bg-paper/95 backdrop-blur-xl shadow-lg overflow-hidden"
        >
          {!expanded ? (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium text-ink hover:bg-paper-dim transition-colors"
            >
              <Sparkles size={15} className="text-red" />
              Ask AI
              <ChevronRight size={13} className="text-meta" />
            </button>
          ) : !showTones ? (
            <div className="flex items-center gap-0.5 py-1 px-1">
              {BUBBLE_ITEMS.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleSelect(item)}
                  title={item.label}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[13px] text-ink-soft hover:text-ink hover:bg-paper-dim transition-colors whitespace-nowrap"
                >
                  <span className="text-red shrink-0">{item.icon}</span>
                  {item.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => { setExpanded(false); setShowTones(false); setVisible(false) }}
                className="px-2 py-1.5 rounded-lg text-[13px] text-meta hover:text-red transition-colors"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-0.5 py-1 px-1">
              {TONES.map((tone) => (
                <button
                  key={tone}
                  type="button"
                  onClick={() => handleToneSelect(tone)}
                  className="px-2.5 py-1.5 rounded-lg text-[13px] text-ink-soft hover:text-ink hover:bg-paper-dim transition-colors whitespace-nowrap"
                >
                  {tone}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowTones(false)}
                className="px-2 py-1.5 rounded-lg text-[13px] text-meta hover:text-red transition-colors"
              >
                ✕
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
