import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User as UserIcon,
  Calendar,
  BookOpen,
  Users,
  Edit3,
  Loader2,
  Plus,
  Share2,
  Check,
  Sparkles,
} from 'lucide-react'
import { useAtomValue, useSetAtom } from 'jotai'
import { userAtom, tokenAtom, fetchMeAtom, fetchUserByIdAtom } from '../store/auth'
import type { User } from '../store/auth'
import {
  fetchMyBlogsAtom,
  fetchAuthorBlogsAtom,
  deleteBlogAtom,
} from '../store/blog'
import type { Blog } from '../store/blog'
import {
  followUserAtom,
  unfollowUserAtom,
  fetchFollowStatusAtom,
} from '../store/engagement'
import { showToastAtom } from '../store/ui'
import HomeNavbar from '../components/HomeNavbar'
import LeftSidebar from '../components/LeftSidebar'
import ProfileStoriesTab from '../components/ProfileStoriesTab'
import ProfileListsTab from '../components/ProfileListsTab'
import EditProfileModal from '../components/EditProfileModal'

const TABS = ['Home', 'Lists', 'About']

export default function Profile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const currentUser = useAtomValue(userAtom)
  const token = useAtomValue(tokenAtom)

  const fetchMe = useSetAtom(fetchMeAtom)
  const fetchUserById = useSetAtom(fetchUserByIdAtom)
  const fetchMyBlogs = useSetAtom(fetchMyBlogsAtom)
  const fetchAuthorBlogs = useSetAtom(fetchAuthorBlogsAtom)
  const deleteBlog = useSetAtom(deleteBlogAtom)
  const followUser = useSetAtom(followUserAtom)
  const unfollowUser = useSetAtom(unfollowUserAtom)
  const fetchFollowStatus = useSetAtom(fetchFollowStatusAtom)
  const showToast = useSetAtom(showToastAtom)

  const isOwner = !id || id === currentUser?.id || id === currentUser?.username

  const [profileUser, setProfileUser] = useState<User | null>(null)
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [loading, setLoading] = useState(true)
  const [blogsLoading, setBlogsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('Home')
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // Follow state for visiting other profiles
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    if (isOwner) {
      if (!token) {
        navigate('/signin')
        return
      }
      fetchMe().then((me) => {
        if (cancelled) return
        if (me) setProfileUser(me)
        else setProfileUser(currentUser)
        setLoading(false)
      })

      setBlogsLoading(true)
      fetchMyBlogs()
        .then((data) => {
          if (!cancelled) setBlogs(data)
        })
        .finally(() => {
          if (!cancelled) setBlogsLoading(false)
        })
    } else if (id) {
      fetchUserById(id).then((u) => {
        if (cancelled) return
        if (u) {
          setProfileUser(u)
          // Fetch follow status
          if (token) {
            fetchFollowStatus({ userId: u.id }).then((status) => {
              if (!cancelled) setIsFollowing(status.isFollowing)
            })
          }
          // Fetch author blogs
          setBlogsLoading(true)
          fetchAuthorBlogs(u.id)
            .then((data) => {
              if (!cancelled) setBlogs(data)
            })
            .finally(() => {
              if (!cancelled) setBlogsLoading(false)
            })
        }
        setLoading(false)
      })
    }

    return () => {
      cancelled = true
    }
  }, [id, isOwner, token, fetchMe, fetchUserById, fetchMyBlogs, fetchAuthorBlogs, fetchFollowStatus, navigate])

  const handleFollowToggle = async () => {
    if (!token) {
      navigate('/signin')
      return
    }
    if (!profileUser || followLoading) return

    setFollowLoading(true)
    const nextStatus = !isFollowing
    setIsFollowing(nextStatus)

    try {
      if (nextStatus) {
        await followUser({ userId: profileUser.id })
        showToast({ message: `Following @${profileUser.username || profileUser.name}`, type: 'success' })
        setProfileUser((prev) =>
          prev
            ? {
                ...prev,
                _count: {
                  ...prev._count,
                  posts: prev._count?.posts || 0,
                  following: prev._count?.following || 0,
                  followers: (prev._count?.followers || 0) + 1,
                },
              }
            : prev,
        )
      } else {
        await unfollowUser({ userId: profileUser.id })
        showToast({ message: `Unfollowed @${profileUser.username || profileUser.name}`, type: 'info' })
        setProfileUser((prev) =>
          prev
            ? {
                ...prev,
                _count: {
                  ...prev._count,
                  posts: prev._count?.posts || 0,
                  following: prev._count?.following || 0,
                  followers: Math.max(0, (prev._count?.followers || 0) - 1),
                },
              }
            : prev,
        )
      }
    } catch (err) {
      setIsFollowing(!nextStatus)
      showToast({ message: (err as Error).message || 'Failed to update follow', type: 'error' })
    } finally {
      setFollowLoading(false)
    }
  }

  const handleDeleteBlog = async (blogId: string) => {
    const ok = await deleteBlog(blogId)
    if (ok) {
      setBlogs((prev) => prev.filter((b) => b.id !== blogId))
      showToast({ message: 'Story deleted', type: 'info' })
      setProfileUser((prev) =>
        prev
          ? {
              ...prev,
              _count: {
                ...prev._count,
                followers: prev._count?.followers || 0,
                following: prev._count?.following || 0,
                posts: Math.max(0, (prev._count?.posts || 0) - 1),
              },
            }
          : prev,
      )
    } else {
      showToast({ message: 'Failed to delete story', type: 'error' })
    }
  }

  const handleShareProfile = () => {
    navigator.clipboard.writeText(window.location.href)
    showToast({ message: 'Profile link copied to clipboard', type: 'success' })
  }

  const targetUser = profileUser || (isOwner ? currentUser : null)
  const displayName = targetUser?.name || targetUser?.username || 'Writer'
  const handle = targetUser?.username ? `@${targetUser.username}` : ''
  const initial = (displayName[0] || 'U').toUpperCase()

  const memberSince = targetUser?.createdAt
    ? new Date(targetUser.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      })
    : 'Recently'

  if (loading && !targetUser) {
    return (
      <div className="min-h-screen bg-paper flex flex-col">
        <HomeNavbar />
        <div className="flex-1 flex items-center justify-center pt-32 text-meta">
          <Loader2 size={30} className="animate-spin mb-3 text-ink-soft" />
          <p className="text-sm">Loading profile…</p>
        </div>
      </div>
    )
  }

  if (!targetUser && !loading) {
    return (
      <div className="min-h-screen bg-paper flex flex-col">
        <HomeNavbar />
        <div className="max-w-xl mx-auto px-6 pt-36 text-center">
          <p className="text-red text-base mb-4">User not found</p>
          <button
            onClick={() => navigate('/home')}
            className="px-5 py-2 text-sm bg-ink text-paper rounded-full hover:bg-red transition-colors"
          >
            Back to home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <HomeNavbar />

      <div className="flex-1 flex pt-16">
        {/* Left Sidebar Navigation */}
        <LeftSidebar />

        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 md:px-8 py-8 flex flex-col lg:flex-row gap-12">
            {/* Left/Center Stories & Feed Column */}
            <div className="flex-1 min-w-0 max-w-3xl">
              {/* Header Title on Mobile / Desktop */}
              <div className="flex items-center justify-between gap-4 mb-6 pb-2">
                <div className="flex items-center gap-4">
                  {/* Mobile Avatar icon */}
                  <div className="lg:hidden shrink-0">
                    {targetUser?.avatar ? (
                      <img
                        src={targetUser.avatar}
                        alt={displayName}
                        className="w-14 h-14 rounded-full object-cover border border-rule shadow-sm"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-red/15 text-red font-bold text-xl flex items-center justify-center">
                        {initial}
                      </div>
                    )}
                  </div>
                  <div>
                    <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ink leading-tight">
                      {displayName}
                    </h1>
                    {handle && (
                      <p className="text-xs text-meta mt-0.5">{handle}</p>
                    )}
                  </div>
                </div>

                {/* Top Action (Mobile follow / edit) */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleShareProfile}
                    className="p-2 rounded-full text-meta hover:text-ink hover:bg-paper-dim transition-colors"
                    title="Share profile"
                  >
                    <Share2 size={17} />
                  </button>
                  {isOwner ? (
                    <button
                      onClick={() => setIsEditModalOpen(true)}
                      className="lg:hidden inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-rule text-xs font-medium text-ink hover:border-ink transition-colors"
                    >
                      <Edit3 size={13} />
                      <span>Edit</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleFollowToggle}
                      disabled={followLoading}
                      className={`lg:hidden px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                        isFollowing
                          ? 'border border-rule text-ink-soft hover:border-red hover:text-red'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                      }`}
                    >
                      {isFollowing ? 'Following' : 'Follow'}
                    </button>
                  )}
                </div>
              </div>

              {/* Tab navigation */}
              <div className="flex items-center gap-8 border-b border-rule mb-6">
                {TABS.map((tab) => {
                  const isActive = activeTab === tab
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`relative pb-3 text-sm font-medium transition-colors ${
                        isActive
                          ? 'text-ink font-semibold'
                          : 'text-meta hover:text-ink'
                      }`}
                    >
                      {tab}
                      {isActive && (
                        <motion.div
                          layoutId="activeProfileTab"
                          className="absolute bottom-0 inset-x-0 h-[1.5px] bg-ink"
                          transition={{
                            type: 'spring',
                            stiffness: 500,
                            damping: 35,
                          }}
                        />
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Tab Content */}
              <AnimatePresence mode="wait">
                {activeTab === 'Home' && (
                  <motion.div
                    key="home-tab"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ProfileStoriesTab
                      blogs={blogs}
                      loading={blogsLoading}
                      isOwner={isOwner}
                      onDeleteBlog={handleDeleteBlog}
                    />
                  </motion.div>
                )}

                {activeTab === 'Lists' && (
                  <motion.div
                    key="lists-tab"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ProfileListsTab />
                  </motion.div>
                )}

                {activeTab === 'About' && (
                  <motion.div
                    key="about-tab"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-8 py-4"
                  >
                    {/* Bio Box */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-meta">
                        Bio
                      </h3>
                      <p className="text-[15px] text-ink leading-relaxed whitespace-pre-wrap">
                        {targetUser?.bio ||
                          (isOwner
                            ? 'You have not added a bio yet. Click "Edit profile" to share your story.'
                            : 'No bio provided.')}
                      </p>
                    </div>

                    {/* Stats & Meta Details */}
                    <div className="pt-6 border-t border-rule grid grid-cols-2 sm:grid-cols-3 gap-6">
                      <div>
                        <span className="block text-xs text-meta mb-1">
                          Published stories
                        </span>
                        <span className="text-xl font-bold font-serif text-ink">
                          {targetUser?._count?.posts ?? blogs.length}
                        </span>
                      </div>
                      <div>
                        <span className="block text-xs text-meta mb-1">
                          Followers
                        </span>
                        <span className="text-xl font-bold font-serif text-ink">
                          {targetUser?._count?.followers || 0}
                        </span>
                      </div>
                      <div>
                        <span className="block text-xs text-meta mb-1">
                          Following
                        </span>
                        <span className="text-xl font-bold font-serif text-ink">
                          {targetUser?._count?.following || 0}
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 flex items-center gap-2 text-xs text-meta">
                      <Calendar size={14} />
                      <span>Member since {memberSince}</span>
                    </div>

                    {isOwner && (
                      <div className="pt-2">
                        <button
                          onClick={() => setIsEditModalOpen(true)}
                          className="px-5 py-2 text-xs font-medium border border-ink text-ink rounded-full hover:bg-ink hover:text-paper transition-colors"
                        >
                          Edit profile
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right Sticky Profile Sidebar (Desktop) */}
            <aside className="hidden lg:block w-80 shrink-0 border-l border-rule/70 pl-8">
              <div className="sticky top-28 space-y-6">
                {/* Large Avatar */}
                <div>
                  {targetUser?.avatar ? (
                    <img
                      src={targetUser.avatar}
                      alt={displayName}
                      className="w-24 h-24 rounded-full object-cover border-2 border-rule shadow-md mb-4"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-red/15 text-red font-bold text-3xl flex items-center justify-center border-2 border-rule shadow-md mb-4">
                      {initial}
                    </div>
                  )}

                  <h2 className="font-serif text-xl font-bold text-ink">
                    {displayName}
                  </h2>
                  {handle && (
                    <p className="text-xs text-meta mt-0.5">{handle}</p>
                  )}
                </div>

                {/* Follower Badge & Count */}
                <div className="flex items-center gap-4 text-xs text-meta">
                  <span>
                    <strong className="text-ink font-semibold">
                      {targetUser?._count?.followers || 0}
                    </strong>{' '}
                    Followers
                  </span>
                  <span>·</span>
                  <span>
                    <strong className="text-ink font-semibold">
                      {targetUser?._count?.following || 0}
                    </strong>{' '}
                    Following
                  </span>
                </div>

                {/* Bio */}
                {targetUser?.bio && (
                  <p className="text-[13px] text-ink-soft leading-relaxed line-clamp-4">
                    {targetUser.bio}
                  </p>
                )}

                {/* Actions */}
                <div className="pt-2">
                  {isOwner ? (
                    <button
                      onClick={() => setIsEditModalOpen(true)}
                      className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-full border border-rule hover:border-ink text-xs font-medium text-ink transition-colors"
                    >
                      <Edit3 size={14} />
                      <span>Edit profile</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleFollowToggle}
                      disabled={followLoading}
                      className={`w-full py-2.5 px-4 rounded-full text-xs font-medium transition-all ${
                        isFollowing
                          ? 'border border-rule text-ink-soft hover:border-red hover:text-red'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                      }`}
                    >
                      {isFollowing ? 'Following' : 'Follow'}
                    </button>
                  )}
                </div>
              </div>
            </aside>
          </main>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onUpdated={(updated) => {
          setProfileUser((prev) => (prev ? { ...prev, ...updated } : updated))
        }}
      />
    </div>
  )
}
