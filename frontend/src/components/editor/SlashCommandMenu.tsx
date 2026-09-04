import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  PenLine,
  Wrench,
  ArrowRightLeft,
  Minimize2,
  Maximize2,
  AlignLeft,
  Heading,
  List,
  ListOrdered,
  Quote,
  Code,
  Minus,
} from 'lucide-react'
import type { AIAction } from '../../lib/aiService'

interface SlashCommandMenuProps {
  isOpen: boolean
  query: string
  onSelect: (action: AIAction) => void
  onBlockSelect: (blockType: string) => void
  onClose: () => void
  onKeyDown: (e: React.KeyboardEvent) => void
}

interface MenuItem {
  label: string
  icon: React.ReactNode
  action?: AIAction
  blockType?: string
  group: 'ai' | 'blocks'
}

const MENU_ITEMS: MenuItem[] = [
  { label: 'Continue Writing', icon: <PenLine size={16} />, action: 'continue_writing', group: 'ai' },
  { label: 'Improve Writing', icon: <Sparkles size={16} />, action: 'improve_writing', group: 'ai' },
  { label: 'Fix Grammar', icon: <Wrench size={16} />, action: 'fix_grammar', group: 'ai' },
  { label: 'Make Shorter', icon: <Minimize2 size={16} />, action: 'make_shorter', group: 'ai' },
  { label: 'Make Longer', icon: <Maximize2 size={16} />, action: 'make_longer', group: 'ai' },
  { label: 'Change Tone', icon: <ArrowRightLeft size={16} />, action: 'change_tone', group: 'ai' },
  { label: 'Summarize', icon: <AlignLeft size={16} />, action: 'summarize', group: 'ai' },
  { label: 'Ask AI', icon: <Sparkles size={16} />, action: 'custom', group: 'ai' },
  { label: 'Heading 1', icon: <Heading size={16} />, blockType: 'heading1', group: 'blocks' },
  { label: 'Heading 2', icon: <Heading size={16} />, blockType: 'heading2', group: 'blocks' },
  { label: 'Heading 3', icon: <Heading size={16} />, blockType: 'heading3', group: 'blocks' },
  { label: 'Bullet List', icon: <List size={16} />, blockType: 'bulletList', group: 'blocks' },
  { label: 'Ordered List', icon: <ListOrdered size={16} />, blockType: 'orderedList', group: 'blocks' },
  { label: 'Blockquote', icon: <Quote size={16} />, blockType: 'blockquote', group: 'blocks' },
  { label: 'Code Block', icon: <Code size={16} />, blockType: 'codeBlock', group: 'blocks' },
  { label: 'Horizontal Rule', icon: <Minus size={16} />, blockType: 'horizontalRule', group: 'blocks' },
]

export default function SlashCommandMenu({
  isOpen,
  query,
  onSelect,
  onBlockSelect,
  onClose,
  onKeyDown,
}: SlashCommandMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  const filtered = MENU_ITEMS.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase()),
  )

  const aiItems = filtered.filter((i) => i.group === 'ai')
  const blockItems = filtered.filter((i) => i.group === 'blocks')
  const hasAI = aiItems.length > 0
  const hasBlocks = blockItems.length > 0

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  useEffect(() => {
    if (!isOpen) return
    const selected = listRef.current?.children[selectedIndex] as HTMLElement | undefined
    selected?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex, isOpen])

  const handleSelect = useCallback(
    (item: MenuItem) => {
      if (item.action) {
        onSelect(item.action)
      } else if (item.blockType) {
        onBlockSelect(item.blockType)
      }
      onClose()
    },
    [onSelect, onBlockSelect, onClose],
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => (i - 1 + filtered.length) % filtered.length)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => (i + 1) % filtered.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered[selectedIndex]) {
        handleSelect(filtered[selectedIndex])
      }
    } else if (e.key === 'Escape') {
      onClose()
    }
    onKeyDown(e)
  }

  if (!isOpen || filtered.length === 0) return null

  let flatIndex = 0

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -4, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -4, scale: 0.98 }}
        transition={{ duration: 0.12 }}
        className="ai-slash-menu absolute z-50 w-72 max-h-80 overflow-y-auto rounded-xl border border-rule bg-paper/95 backdrop-blur-xl shadow-lg"
        ref={listRef}
        onKeyDown={handleKeyDown}
        tabIndex={-1}
      >
        {hasAI && (
          <div className="px-2 pt-2 pb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-meta px-2">
              AI Commands
            </span>
          </div>
        )}
        {aiItems.map((item) => {
          const idx = flatIndex++
          return (
            <button
              key={item.label}
              type="button"
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-[14px] transition-colors ${
                idx === selectedIndex
                  ? 'bg-paper-dim text-ink'
                  : 'text-ink-soft hover:bg-paper-dim/60 hover:text-ink'
              }`}
              onClick={() => handleSelect(item)}
              onMouseEnter={() => setSelectedIndex(idx)}
            >
              <span className="text-red shrink-0">{item.icon}</span>
              <span className="flex-1 truncate">{item.label}</span>
              {item.action === 'custom' && (
                <span className="text-[11px] text-meta">⏎</span>
              )}
            </button>
          )
        })}

        {hasAI && hasBlocks && (
          <div className="mx-3 my-1 border-t border-rule" />
        )}

        {hasBlocks && (
          <div className="px-2 pt-1 pb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-meta px-2">
              Blocks
            </span>
          </div>
        )}
        {blockItems.map((item) => {
          const idx = flatIndex++
          return (
            <button
              key={item.label}
              type="button"
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-[14px] transition-colors ${
                idx === selectedIndex
                  ? 'bg-paper-dim text-ink'
                  : 'text-ink-soft hover:bg-paper-dim/60 hover:text-ink'
              }`}
              onClick={() => handleSelect(item)}
              onMouseEnter={() => setSelectedIndex(idx)}
            >
              <span className="text-meta shrink-0">{item.icon}</span>
              <span className="flex-1 truncate">{item.label}</span>
            </button>
          )
        })}
      </motion.div>
    </AnimatePresence>
  )
}
