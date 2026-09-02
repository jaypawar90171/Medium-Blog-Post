import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User, Camera, Loader2, Check, AlertCircle } from 'lucide-react'
import { useAtomValue, useSetAtom } from 'jotai'
import { userAtom, updateProfileAtom } from '../store/auth'
import type { User as UserType } from '../store/auth'
import { showToastAtom } from '../store/ui'

interface EditProfileModalProps {
  isOpen: boolean
  onClose: () => void
  onUpdated?: (user: UserType) => void
}

export default function EditProfileModal({
  isOpen,
  onClose,
  onUpdated,
}: EditProfileModalProps) {
  const currentUser = useAtomValue(userAtom)
  const updateProfile = useSetAtom(updateProfileAtom)
  const showToast = useSetAtom(showToastAtom)

  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [avatar, setAvatar] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && currentUser) {
      setName(currentUser.name || '')
      setUsername(currentUser.username || '')
      setBio(currentUser.bio || '')
      setAvatar(currentUser.avatar || '')
      setError(null)
    }
  }, [isOpen, currentUser])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSaving) return

    setIsSaving(true)
    setError(null)

    try {
      const res = await updateProfile({
        name: name.trim() || undefined,
        username: username.trim() || undefined,
        bio: bio.trim() || undefined,
        avatar: avatar.trim() || undefined,
      })

      if (res.ok && res.user) {
        showToast({
          message: 'Profile information updated',
          type: 'success',
        })
        onUpdated?.(res.user)
        onClose()
      } else {
        setError(res.error || 'Failed to update profile')
      }
    } catch (err) {
      setError((err as Error).message || 'Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  const displayName = name || currentUser?.name || currentUser?.username || 'You'
  const initial = (displayName[0] || 'U').toUpperCase()

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-text">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-ink/45 backdrop-blur-sm"
          />

          {/* Modal Box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 15 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="relative w-full max-w-lg bg-paper border border-rule rounded-3xl shadow-2xl overflow-hidden z-10"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-7 py-5 border-b border-rule/70">
              <div className="flex items-center gap-2">
                <User size={19} className="text-red" />
                <h3 className="font-serif text-xl font-bold text-ink">
                  Profile information
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full text-meta hover:text-ink hover:bg-paper-dim transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-7 space-y-6">
              {error && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red/10 border border-red/30 text-red text-xs">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Avatar Preview & URL */}
              <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-paper-dim/40 border border-rule/60">
                <div className="relative group shrink-0">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt={displayName}
                      className="w-20 h-20 rounded-full object-cover border-2 border-rule shadow-sm"
                      onError={() => setAvatar('')}
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-red/15 text-red font-semibold text-2xl flex items-center justify-center border-2 border-rule shadow-sm">
                      {initial}
                    </div>
                  )}
                  <div className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-white">
                    <Camera size={20} />
                  </div>
                </div>

                <div className="flex-1 w-full min-w-0 space-y-1.5">
                  <label className="block text-xs font-semibold text-ink uppercase tracking-wider">
                    Photo URL
                  </label>
                  <input
                    type="url"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    placeholder="https://example.com/photo.jpg"
                    className="w-full px-3.5 py-2 text-xs bg-paper border border-rule rounded-xl outline-none focus:border-ink transition-colors text-ink placeholder:text-meta"
                  />
                  <p className="text-[11px] text-meta">
                    Paste a direct image link for your profile picture.
                  </p>
                </div>
              </div>

              {/* Name & Username Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-ink uppercase tracking-wider">
                    Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-3.5 py-2.5 text-sm bg-paper-dim/40 border border-rule rounded-xl outline-none focus:border-ink transition-colors text-ink placeholder:text-meta"
                  />
                  <p className="text-[11px] text-meta">
                    Appears on your profile page and stories.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-ink uppercase tracking-wider">
                    Username
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-meta">
                      @
                    </span>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      placeholder="username"
                      className="w-full pl-8 pr-3.5 py-2.5 text-sm bg-paper-dim/40 border border-rule rounded-xl outline-none focus:border-ink transition-colors text-ink placeholder:text-meta"
                    />
                  </div>
                  <p className="text-[11px] text-meta">
                    Unique handle for your public profile.
                  </p>
                </div>
              </div>

              {/* Short Bio */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-ink uppercase tracking-wider">
                    Bio
                  </label>
                  <span className="text-[11px] text-meta">
                    {bio.length} / 500
                  </span>
                </div>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value.slice(0, 500))}
                  rows={3}
                  placeholder="Tell readers a bit about who you are and what you write about…"
                  className="w-full px-3.5 py-2.5 text-sm bg-paper-dim/40 border border-rule rounded-xl outline-none focus:border-ink transition-colors text-ink placeholder:text-meta resize-none leading-relaxed"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-rule/60">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-meta hover:text-ink transition-colors rounded-full"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !name.trim()}
                  className="inline-flex items-center gap-1.5 px-6 py-2 text-xs font-medium bg-ink text-paper hover:bg-red rounded-full transition-all shadow-sm disabled:opacity-50 disabled:hover:bg-ink"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Saving…</span>
                    </>
                  ) : (
                    <>
                      <Check size={13} />
                      <span>Save changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
