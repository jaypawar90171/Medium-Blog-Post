import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useSetAtom } from 'jotai'
import { signInAtom } from '../store/auth'
import AuthLayout from '../components/auth/AuthLayout'
import { Field, SubmitButton, AuthLink } from '../components/auth/AuthFields'

const fade = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
}

export default function SignIn() {
  const navigate = useNavigate()
  const signIn = useSetAtom(signInAtom)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const next: typeof errors = {}
    if (!email) next.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Enter a valid email'
    if (!password) next.password = 'Password is required'
    else if (password.length < 6) next.password = 'Password must be at least 6 characters'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    if (!validate()) return
    setLoading(true)
    const result = await signIn({ email, password })
    setLoading(false)
    if (result.ok) {
      navigate('/home')
    } else {
      setFormError(result.error || 'Sign in failed')
    }
  }

  return (
    <AuthLayout
      image="/auth-login.svg"
      imageAlt="Welcome back illustration"
      accentLabel="Welcome back"
      accentTitle="Pick up where you left off."
      accentText="Sign in to continue writing, reading, and sharing the stories only you can tell."
    >
      <motion.div
        variants={fade}
        initial="hidden"
        animate="show"
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <h1 className="font-serif text-3xl md:text-4xl text-ink mb-2">Sign in</h1>
        <p className="text-ink-soft mb-8">
          New here? <AuthLink to="/signup">Create an account</AuthLink>
        </p>

        {formError && (
          <div className="mb-5 rounded-xl border border-red bg-red/5 px-4 py-3 text-[14px] text-red">
            {formError}
          </div>
        )}

        <form onSubmit={onSubmit} noValidate>
          <Field
            id="email"
            label="Email address"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            icon={<Mail size={16} />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
          />
          <Field
            id="password"
            label="Password"
            type="password"
            placeholder="Enter your password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
          />
          <div className="flex justify-end mb-6">
            <button
              type="button"
              className="text-[13px] text-meta hover:text-red transition-colors"
            >
              Forgot password?
            </button>
          </div>
          <SubmitButton loading={loading}>Sign in</SubmitButton>
        </form>

        <p className="text-[13px] text-meta text-center mt-8">
          By continuing you agree to The Journal's terms of service.
        </p>
      </motion.div>
    </AuthLayout>
  )
}
