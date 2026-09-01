import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import { useAtom, useSetAtom } from 'jotai'
import { toastAtom, clearToastAtom } from '../store/ui'

export default function Toast() {
  const [toast] = useAtom(toastAtom)
  const clearToast = useSetAtom(clearToastAtom)

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => {
      clearToast()
    }, toast.duration || 3000)

    return () => clearTimeout(timer)
  }, [toast, clearToast])

  return (
    <div className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-[9999] pointer-events-none flex flex-col items-end gap-2 max-w-sm w-full px-4 sm:px-0">
      <AnimatePresence mode="wait">
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="pointer-events-auto flex items-center gap-3 px-4 py-3 bg-ink text-paper rounded-2xl shadow-2xl border border-rule/20 text-[13.5px] font-medium backdrop-blur-md"
          >
            {toast.type === 'error' ? (
              <AlertCircle size={18} className="text-red shrink-0" />
            ) : toast.type === 'info' ? (
              <Info size={18} className="text-sky-400 shrink-0" />
            ) : (
              <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
            )}

            <span className="flex-1 leading-snug">{toast.message}</span>

            <button
              onClick={() => clearToast()}
              className="p-1 rounded-full text-paper/60 hover:text-paper hover:bg-paper/10 transition-colors ml-1"
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
