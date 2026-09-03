import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home,
  Bookmark,
  User,
  BarChart2,
  Users,
  Plus,
} from 'lucide-react'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { leftSidebarOpenAtom, mobileLeftSidebarOpenAtom } from '../store/ui'
import { fetchFollowingAtom, type FollowUser } from '../store/engagement'

const NAV_ITEMS = [
  { label: 'Home', icon: Home, path: '/home' },
  { label: 'Library', icon: Bookmark, path: '/library' },
  { label: 'Profile', icon: User, path: '/profile' },
  { label: 'Stats', icon: BarChart2, path: '/stats' },
]

export default function LeftSidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const isOpen = useAtomValue(leftSidebarOpenAtom)
  const [mobileOpen, setMobileOpen] = useAtom(mobileLeftSidebarOpenAtom)
  const fetchFollowing = useSetAtom(fetchFollowingAtom)

  const [following, setFollowing] = useState<FollowUser[]>([])

  useEffect(() => {
    if (isOpen || mobileOpen) {
      fetchFollowing().then(setFollowing)
    }
  }, [isOpen, mobileOpen, fetchFollowing])

  const onCloseMobile = () => setMobileOpen(false)

  const goToProfile = (id: string) => {
    navigate(`/profile/${id}`)
    onCloseMobile()
  }

  const followingInitials = useMemo(
    () => new Map(following.map((u) => [u.id, (u.name?.[0] || u.username?.[0] || 'U').toUpperCase()])),
    [following],
  )

  const content = (
    <div className="flex flex-col h-full py-6 px-4">
      {/* Primary Navigation Links */}
      <nav className="space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path || (item.path === '/home' && location.pathname === '/')
          const Icon = item.icon
          return (
            <button
              key={item.label}
              onClick={() => {
                navigate(item.path)
                onCloseMobile()
              }}
              className={`w-full flex items-center gap-4 px-3 py-2.5 rounded-xl text-[15px] font-medium transition-colors text-left ${
                isActive
                  ? 'text-ink font-semibold bg-paper-dim/60'
                  : 'text-ink-soft hover:text-ink hover:bg-paper-dim/40'
              }`}
            >
              <Icon
                size={20}
                className={isActive ? 'text-ink stroke-[2.2]' : 'text-meta group-hover:text-ink'}
              />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Divider */}
      <div className="my-6 border-t border-rule" />

      {/* Following Section */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none pr-1">
        <div className="flex items-center gap-3 px-3 py-2 text-[14px] font-medium text-ink mb-1">
          <Users size={18} className="text-meta" />
          <span>Following</span>
        </div>

        <div className="space-y-1 mt-1">
          {following.length === 0 ? (
            <p className="px-3 py-2 text-[13px] text-meta">
              Writers you follow will appear here.
            </p>
          ) : (
            following.map((writer) => (
              <button
                key={writer.id}
                onClick={() => goToProfile(writer.id)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-[14px] text-ink-soft hover:text-ink hover:bg-paper-dim/50 transition-colors group min-w-0"
              >
                {writer.avatar ? (
                  <img
                    src={writer.avatar}
                    alt={writer.name || 'Writer'}
                    className="w-6 h-6 rounded-full object-cover bg-ink/10 shrink-0"
                  />
                ) : (
                  <span className="w-6 h-6 rounded-full bg-ink/10 text-ink text-[11px] font-semibold flex items-center justify-center shrink-0">
                    {followingInitials.get(writer.id)}
                  </span>
                )}
                <span className="truncate">{writer.name || writer.username || 'Writer'}</span>
              </button>
            ))
          )}
        </div>

        {/* Find writers & suggestions */}
        <div className="mt-4 px-3 pt-3 border-t border-rule/60">
          <button
            onClick={() => {
              navigate('/home')
              onCloseMobile()
            }}
            className="flex items-start gap-2.5 text-[13px] text-meta hover:text-ink transition-colors text-left group"
          >
            <Plus size={16} className="shrink-0 mt-0.5 group-hover:text-ink text-meta" />
            <div>
              <p className="leading-snug text-ink-soft group-hover:text-ink">
                Find writers and publications to follow.
              </p>
              <span className="text-[12px] text-ink underline decoration-rule underline-offset-2 hover:text-red transition-colors block mt-1">
                See suggestions
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Leftmost Sidebar */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 240, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="hidden md:block shrink-0 sticky top-16 h-[calc(100vh-4rem)] border-r border-rule bg-paper overflow-hidden select-none z-30"
          >
            <div className="w-[240px] h-full">
              {content}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Mobile Drawer (When open on smaller screens) */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseMobile}
              className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm md:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed top-0 left-0 bottom-0 z-50 w-72 bg-paper border-r border-rule shadow-2xl md:hidden pt-4"
            >
              {content}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
