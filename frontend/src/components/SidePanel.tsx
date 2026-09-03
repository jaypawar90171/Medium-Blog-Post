import { useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Hash, UserPlus, Check } from 'lucide-react'
import { useAtomValue, useSetAtom } from 'jotai'
import { whoToFollowAtom } from '../store/recommend'
import { followUserAtom, unfollowUserAtom } from '../store/engagement'
import { blogsAtom } from '../store/blog'
import { userAtom } from '../store/auth'
import { showToastAtom } from '../store/ui'

const FOOTER_LINKS = ['About', 'Help', 'Terms', 'Privacy', 'Careers', 'Text to speech']

const FALLBACK_TOPICS = [
  'Writing',
  'Self Improvement',
  'Relationships',
  'Artificial Intelligence',
  'Productivity',
  'Programming',
  'Poetry',
  'Design',
]

function deriveTopicsFromBlogs(blogs: any[]): string[] {
  const tagCounts = new Map<string, number>()
  for (const blog of blogs) {
    for (const t of blog.tags || []) {
      const name = t.tag?.name
      if (name) {
        tagCounts.set(name, (tagCounts.get(name) || 0) + 1)
      }
    }
  }
  return Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name]) => name)
}

export default function SidePanel({ open }: { open: boolean }) {
  const whoToFollow = useAtomValue(whoToFollowAtom)
  const blogs = useAtomValue(blogsAtom)
  const currentUser = useAtomValue(userAtom)
  const followUser = useSetAtom(followUserAtom)
  const unfollowUser = useSetAtom(unfollowUserAtom)
  const showToast = useSetAtom(showToastAtom)

  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set())

  const topics = deriveTopicsFromBlogs(blogs)
  const displayTopics = topics.length > 0 ? topics : FALLBACK_TOPICS

  const handleFollow = useCallback(
    async (userId: string, isCurrentlyFollowed: boolean) => {
      try {
        if (isCurrentlyFollowed) {
          await unfollowUser({ userId })
          setFollowedIds((prev) => {
            const next = new Set(prev)
            next.delete(userId)
            return next
          })
          showToast({ message: 'Unfollowed', type: 'info' })
        } else {
          await followUser({ userId })
          setFollowedIds((prev) => new Set(prev).add(userId))
          showToast({ message: 'Following!', type: 'success' })
        }
      } catch {
        showToast({ message: 'Action failed', type: 'error' })
      }
    },
    [followUser, unfollowUser, showToast],
  )

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 24 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="hidden lg:block w-72 shrink-0 pt-32"
        >
          <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-2 scrollbar-none">
            {/* Recommended topics */}
            <div className="mb-8">
              <h3 className="text-[13px] font-medium text-ink mb-3">Recommended topics</h3>
              <div className="flex flex-wrap gap-2">
                {displayTopics.map((topic) => (
                  <button
                    key={topic}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-rule text-[13px] text-ink-soft hover:border-ink hover:text-ink transition-colors"
                  >
                    <Hash size={13} />
                    {topic}
                  </button>
                ))}
              </div>
            </div>

            {/* Who to follow */}
            <div className="mb-8">
              <h3 className="text-[13px] font-medium text-ink mb-3">Who to follow</h3>
              <div className="space-y-4">
                {whoToFollow.length > 0 ? (
                  whoToFollow
                    .filter((person) => person.id !== currentUser?.id)
                    .map((person) => {
                      const isFollowed = followedIds.has(person.id)
                      return (
                        <div key={person.id} className="flex items-center gap-3">
                          {person.avatar ? (
                            <img
                              src={person.avatar}
                              alt={person.name || ''}
                              className="w-9 h-9 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <span className="w-9 h-9 rounded-full bg-red/15 text-red flex items-center justify-center font-medium shrink-0 text-[14px]">
                              {(person.name || person.username || '?')[0].toUpperCase()}
                            </span>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-[14px] text-ink truncate font-medium">
                              {person.name || person.username}
                            </p>
                            <p className="text-[12px] text-meta truncate">
                              {person.mutualCount > 0
                                ? `${person.mutualCount} mutual follower${person.mutualCount > 1 ? 's' : ''}`
                                : person.bio || (person.username ? `@${person.username}` : '')}
                            </p>
                          </div>
                          <motion.button
                            onClick={() => handleFollow(person.id, isFollowed)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`inline-flex items-center gap-1 text-[13px] transition-colors ${
                              isFollowed
                                ? 'text-meta'
                                : 'text-red hover:text-red-dim'
                            }`}
                          >
                            {isFollowed ? (
                              <>
                                <Check size={14} />
                                Following
                              </>
                            ) : (
                              <>
                                <UserPlus size={14} />
                                Follow
                              </>
                            )}
                          </motion.button>
                        </div>
                      )
                    })
                ) : (
                  <p className="text-[13px] text-meta">Follow people to see suggestions here.</p>
                )}
              </div>
            </div>

            {/* Footer links */}
            <div className="pt-6 border-t border-rule">
              <div className="flex flex-wrap gap-x-3 gap-y-2">
                {FOOTER_LINKS.map((link) => (
                  <a
                    key={link}
                    href="#"
                    className="text-[12px] text-meta hover:text-ink transition-colors"
                  >
                    {link}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
