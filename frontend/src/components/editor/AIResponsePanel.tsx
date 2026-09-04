import { useAtomValue, useSetAtom } from 'jotai'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, RefreshCw, X } from 'lucide-react'
import type { Editor } from '@tiptap/react'
import {
  aiPanelVisibleAtom,
  aiLoadingAtom,
  aiResponseAtom,
  aiErrorAtom,
  aiActionAtom,
  resetAiAtom,
} from '../../store/ai'

interface AIResponsePanelProps {
  editor: Editor | null
  onRegenerate: () => void
}

export default function AIResponsePanel({ editor, onRegenerate }: AIResponsePanelProps) {
  const visible = useAtomValue(aiPanelVisibleAtom)
  const loading = useAtomValue(aiLoadingAtom)
  const response = useAtomValue(aiResponseAtom)
  const error = useAtomValue(aiErrorAtom)
  const action = useAtomValue(aiActionAtom)
  const resetAi = useSetAtom(resetAiAtom)

  const handleAccept = () => {
    if (!editor || !response) return
    if (action === 'continue_writing') {
      editor.chain().focus().insertContent(response).run()
    } else {
      const { from, to } = editor.state.selection
      if (from !== to) {
        editor.chain().focus().deleteRange({ from, to }).insertContent(response).run()
      } else {
        editor.chain().focus().insertContent(response).run()
      }
    }
    resetAi()
  }

  const handleDiscard = () => {
    resetAi()
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 8, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: 8, height: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="overflow-hidden"
        >
          <div className="ai-response-panel mt-3 rounded-xl border border-rule bg-paper-dim/80 backdrop-blur-md p-4">
            {/* Loading state */}
            {loading && !response && (
              <div className="flex items-center gap-2 py-2">
                <div className="ai-sparkle flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-red animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-red animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-[13px] text-meta">AI is thinking…</span>
              </div>
            )}

            {/* Response content */}
            {response && (
              <div className="text-[15px] text-ink leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto">
                {response}
                {loading && <span className="inline-block w-0.5 h-4 bg-red ml-0.5 animate-pulse" />}
              </div>
            )}

            {/* Error state */}
            {error && (
              <div className="text-[13px] text-red py-1">
                {error}
              </div>
            )}

            {/* Action buttons */}
            {(response || error) && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-rule">
                {response && (
                  <button
                    onClick={handleAccept}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-ink text-paper text-[13px] font-medium hover:bg-red transition-colors"
                  >
                    <Check size={14} />
                    Accept
                  </button>
                )}
                <button
                  onClick={onRegenerate}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-rule text-[13px] font-medium text-ink-soft hover:text-ink hover:border-ink transition-colors disabled:opacity-40"
                >
                  <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                  Regenerate
                </button>
                <button
                  onClick={handleDiscard}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-rule text-[13px] font-medium text-meta hover:text-red hover:border-red transition-colors"
                >
                  <X size={14} />
                  Discard
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
