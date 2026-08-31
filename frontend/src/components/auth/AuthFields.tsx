import { useState } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  hint?: string
  error?: string
  icon?: ReactNode
}

export function Field({ label, hint, error, icon, id, type, ...props }: FieldProps) {
  const fieldId = id || label.toLowerCase().replace(/\s+/g, '-')
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'
  const resolvedType = isPassword ? (show ? 'text' : 'password') : type

  return (
    <div className="mb-5">
      <label htmlFor={fieldId} className="block text-[13px] font-medium text-ink-soft mb-2">
        {label}
        {hint && <span className="text-meta font-normal"> ({hint})</span>}
      </label>
      <div className="relative">
        {icon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-meta">{icon}</span>
        )}
        <input
          id={fieldId}
          type={resolvedType}
          className={`w-full rounded-xl border bg-paper-dim px-4 py-3.5 text-[15px] text-ink placeholder:text-meta/70 transition-colors focus:outline-none focus:ring-2 focus:ring-red/40 ${
            icon ? 'pl-11' : ''
          } ${isPassword ? 'pr-11' : ''} ${
            error ? 'border-red' : 'border-rule focus:border-red'
          }`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Hide password' : 'Show password'}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-meta hover:text-ink transition-colors"
          >
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error ? (
        <p className="text-[13px] text-red mt-1.5">{error}</p>
      ) : (
        <p className="text-[12px] text-meta mt-1.5">{hint}</p>
      )}
    </div>
  )
}

interface SubmitButtonProps {
  loading: boolean
  children: ReactNode
}

export function SubmitButton({ loading, children }: SubmitButtonProps) {
  return (
    <motion.button
      type="submit"
      disabled={loading}
      whileHover={loading ? undefined : { scale: 1.02 }}
      whileTap={loading ? undefined : { scale: 0.98 }}
      className="w-full mt-2 bg-red hover:bg-red-dim text-paper font-medium text-[15px] py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {loading && <Loader2 size={18} className="animate-spin" />}
      {children}
    </motion.button>
  )
}

export function AuthLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="text-red hover:text-red-dim font-medium transition-colors"
    >
      {children}
    </Link>
  )
}
