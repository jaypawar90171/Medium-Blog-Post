import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sun,
  Moon,
  Menu,
  LogOut,
  PenSquare,
  User,
  PanelRight,
  PanelRightClose,
  Search,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { userAtom, isAuthenticatedAtom, signOutAtom } from '../store/auth'
import { sidePanelOpenAtom, leftSidebarOpenAtom, mobileLeftSidebarOpenAtom } from '../store/ui'

export default function HomeNavbar() {
  const [scrolled, setScrolled] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const user = useAtomValue(userAtom)
  const isAuthenticated = useAtomValue(isAuthenticatedAtom)
  const signOut = useSetAtom(signOutAtom)
  const [sidePanelOpen, setSidePanelOpen] = useAtom(sidePanelOpenAtom)
  const [, setLeftSidebarOpen] = useAtom(leftSidebarOpenAtom)
  const [, setMobileLeftSidebarOpen] = useAtom(mobileLeftSidebarOpenAtom)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const initial = (user?.name?.[0] || user?.email?.[0] || 'U').toUpperCase()

  const handleToggleLeftSidebar = () => {
    if (window.innerWidth < 768) {
      setMobileLeftSidebarOpen((o) => !o)
    } else {
      setLeftSidebarOpen((o) => !o)
    }
  }

  // navigate to search page after pressing enter
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const term = searchQuery.trim()
    if (!term) return
    navigate(`/search?q=${encodeURIComponent(term)}`)
  }

  const handleLogout = () => {
    setMenuOpen(false)
    signOut()
    navigate('/')
  }

  const goToProfile = () => {
    setMenuOpen(false)
    navigate('/profile')
  }

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 inset-x-0 z-40 transition-colors duration-300 bg-paper/95 backdrop-blur-md border-b ${
        scrolled ? 'border-rule shadow-sm' : 'border-rule'
      }`}
    >
      <nav className="w-full px-4 sm:px-6 md:px-8 h-16 flex items-center justify-between gap-4">
        {/* Leftmost Section: Hamburger Toggle + Logo + Search */}
        <div className="flex items-center gap-3 md:gap-5 min-w-0">
          {/* Hamburger Menu - toggles leftmost navigation sidebar */}
          <motion.button
            onClick={handleToggleLeftSidebar}
            whileTap={{ scale: 0.92 }}
            whileHover={{ scale: 1.05 }}
            aria-label="Toggle navigation sidebar"
            title="Toggle sidebar"
            className="text-ink-soft hover:text-ink transition-colors p-2 rounded-lg hover:bg-paper-dim/60 shrink-0"
          >
            <Menu size={21} className="stroke-[2]" />
          </motion.button>

          {/* Logo */}
          <button
            onClick={() => navigate('/home')}
            className="font-serif text-2xl tracking-tight text-ink font-bold hover:opacity-90 transition-opacity shrink-0"
          >
            The Journal
          </button>

          {/* Medium-style Search bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden sm:flex items-center gap-2 bg-paper-dim/70 hover:bg-paper-dim focus-within:bg-paper focus-within:border-ink/40 border border-transparent px-3.5 py-2 rounded-full transition-all duration-200 w-44 md:w-64"
          >
            <Search size={16} className="text-meta shrink-0" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-[14px] text-ink placeholder:text-meta outline-none w-full"
            />
          </form>
        </div>

        {/* Right Section: Actions + Theme + Profile */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {/* Write story action */}
          <button
            onClick={() => navigate('/write')}
            className="hidden sm:inline-flex items-center gap-2 text-[14px] text-ink-soft hover:text-ink transition-colors px-2.5 py-1.5 rounded-lg hover:bg-paper-dim/50"
          >
            <PenSquare size={17} className="text-meta" />
            <span>Write</span>
          </button>

          {/* Dark / Light mode toggle */}
          <motion.button
            onClick={toggleTheme}
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.1 }}
            aria-label="Toggle dark mode"
            className="text-ink-soft hover:text-ink transition-colors p-2 rounded-lg hover:bg-paper-dim/50"
          >
            <motion.span
              key={theme}
              initial={{ rotate: -60, opacity: 0, scale: 0.5 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="block"
            >
              {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
            </motion.span>
          </motion.button>

          {/* Right SidePanel Toggle */}
          <motion.button
            onClick={() => setSidePanelOpen((o) => !o)}
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.1 }}
            aria-label={sidePanelOpen ? 'Hide recommendations' : 'Show recommendations'}
            title={sidePanelOpen ? 'Hide recommendations' : 'Show recommendations'}
            className="hidden xl:inline-flex text-ink-soft hover:text-ink transition-colors p-2 rounded-lg hover:bg-paper-dim/50"
          >
            {sidePanelOpen ? <PanelRightClose size={19} /> : <PanelRight size={19} />}
          </motion.button>

          {/* User Auth state */}
          {isAuthenticated ? (
            <div className="relative flex items-center gap-2.5">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                title="Profile"
                aria-expanded={menuOpen}
                className="w-9 h-9 rounded-full overflow-hidden border border-rule shadow-sm hover:opacity-90 transition-opacity flex items-center justify-center bg-red text-paper font-serif text-[15px] font-semibold"
              >
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name || 'User'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  initial
                )}
              </button>

              {/* Dropdown menu */}
              <AnimatePresence>
                {menuOpen && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setMenuOpen(false)}
                      className="fixed inset-0 z-40"
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.98 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                      className="absolute right-0 top-12 z-50 w-56 bg-paper border border-rule rounded-xl shadow-xl overflow-hidden"
                    >
                      {/* User info */}
                      <div className="px-4 py-3 border-b border-rule">
                        <p className="text-[14px] font-medium text-ink truncate">
                          {user?.name || user?.username || user?.email}
                        </p>
                        {user?.username && (
                          <p className="text-[12px] text-meta truncate">@{user.username}</p>
                        )}
                      </div>

                      <div className="p-1.5">
                        <button
                          onClick={goToProfile}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-ink-soft hover:text-ink hover:bg-paper-dim transition-colors text-left"
                        >
                          <User size={15} className="text-meta" />
                          <span>Profile</span>
                        </button>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-red hover:bg-red/5 transition-colors text-left"
                        >
                          <LogOut size={15} />
                          <span>Log out</span>
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/signin')}
                className="hidden sm:inline text-[14px] text-ink-soft hover:text-ink transition-colors px-3 py-1.5"
              >
                Sign in
              </button>
              <motion.button
                onClick={() => navigate('/signup')}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="text-[13px] sm:text-[14px] text-paper bg-ink hover:bg-red transition-colors px-4 py-2 rounded-full font-medium"
              >
                Get Started
              </motion.button>
            </div>
          )}
        </div>
      </nav>
    </motion.header>
  )
}
