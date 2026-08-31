import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, User, AtSign, Feather } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useSetAtom } from 'jotai'
import { signUpAtom } from '../store/auth'
import AuthLayout from '../components/auth/AuthLayout'
import { Field, SubmitButton, AuthLink } from '../components/auth/AuthFields'

const fade = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
}

interface Errors {
  name?: string
  username?: string
  email?: string
  password?: string
  bio?: string
}

export default function Signup() {
  const navigate = useNavigate()
  const signUp = useSetAtom(signUpAtom)

  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    bio: '',
  })
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const validate = () => {
    const next: Errors = {}
    if (form.name && form.name.trim().length < 2) next.name = 'Name must be at least 2 characters'
    if (form.username && !/^[a-zA-Z0-9_]{3,}$/.test(form.username))
      next.username = 'Username needs 3+ chars (letters, numbers, underscore)'
    if (!form.email) next.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Enter a valid email'
    if (!form.password) next.password = 'Password is required'
    else if (form.password.length < 6) next.password = 'Password must be at least 6 characters'
    if (form.bio && form.bio.length > 500) next.bio = 'Bio must be under 500 characters'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    if (!validate()) return
    setLoading(true)
    
    const result = await signUp({
      email: form.email,
      password: form.password,
      name: form.name || undefined,
      username: form.username || undefined,
      bio: form.bio || undefined,
    })
    setLoading(false)
    if (result.ok) {
      navigate('/home')
    } else {
      setFormError(result.error || 'Sign up failed')
    }
  }

  return (
    <AuthLayout
      image="/auth-signup.svg"
      imageAlt="Start writing illustration"
      accentLabel="Join The Journal"
      accentTitle="Your words deserve a real home."
      accentText="Create a free account and join a community of independent writers with something to say."
    >
      <motion.div
        variants={fade}
        initial="hidden"
        animate="show"
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <h1 className="font-serif text-3xl md:text-4xl text-ink mb-2">Create your account</h1>
        <p className="text-ink-soft mb-8">
          Already a member? <AuthLink to="/signin">Sign in</AuthLink>
        </p>

        {formError && (
          <div className="mb-5 rounded-xl border border-red bg-red/5 px-4 py-3 text-[14px] text-red">
            {formError}
          </div>
        )}

        <form onSubmit={onSubmit} noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <Field
              label="Name"
              hint="optional"
              placeholder="Jane Doe"
              icon={<User size={16} />}
              autoComplete="name"
              value={form.name}
              onChange={update('name')}
              error={errors.name}
            />
            <Field
              label="Username"
              hint="optional"
              placeholder="jane_doe"
              icon={<AtSign size={16} />}
              autoComplete="username"
              value={form.username}
              onChange={update('username')}
              error={errors.username}
            />
          </div>
          <Field
            label="Email address"
            type="email"
            placeholder="you@example.com"
            icon={<Mail size={16} />}
            autoComplete="email"
            value={form.email}
            onChange={update('email')}
            error={errors.email}
          />
          <Field
            label="Password"
            type="password"
            hint="min 6 characters"
            placeholder="Create a password"
            icon={<Feather size={16} />}
            autoComplete="new-password"
            value={form.password}
            onChange={update('password')}
            error={errors.password}
          />
          <Field
            label="Bio"
            hint={`optional · ${form.bio.length}/500`}
            placeholder="Tell readers who you are"
            icon={<Feather size={16} />}
            value={form.bio}
            onChange={update('bio')}
            error={errors.bio}
          />
          <SubmitButton loading={loading}>Create account</SubmitButton>
        </form>

        <p className="text-[13px] text-meta text-center mt-8">
          By joining you agree to The Journal's terms of service.
        </p>
      </motion.div>
    </AuthLayout>
  )
}
