import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

interface AuthLayoutProps {
  image: string
  imageAlt?: string
  accentLabel: string
  accentTitle: string
  accentText: string
  children: ReactNode
}

export default function AuthLayout({
  image,
  imageAlt = 'Illustration',
  accentLabel,
  accentTitle,
  accentText,
  children,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex bg-paper">
      {/* Form column — roughly 1/3 */}
      <div className="w-full lg:w-[38%] flex flex-col px-6 sm:px-10 lg:px-12 pt-24 pb-12 overflow-y-auto">
        <div className="max-w-md w-full mx-auto my-auto">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-meta hover:text-ink text-sm mb-8 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to home
          </Link>
          {children}
        </div>
      </div>

      {/* Image column — roughly 2/3, hidden on small screens */}
      <div className="hidden lg:block lg:w-[62%] relative overflow-hidden">
        <img
          src={image}
          alt={imageAlt}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/30 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-end p-12 lg:p-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="max-w-lg"
          >
            <span className="inline-block text-red text-[13px] tracking-[0.18em] uppercase mb-4 font-medium">
              {accentLabel}
            </span>
            <h2 className="font-serif text-3xl lg:text-[2.75rem] leading-tight text-paper mb-4">
              {accentTitle}
            </h2>
            <p className="text-paper/80 text-[15px] leading-relaxed">{accentText}</p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
