import { AnimatePresence, motion } from 'framer-motion'
import { Hash, UserPlus } from 'lucide-react'

const TOPICS = [
  'Writing',
  'Self Improvement',
  'Relationships',
  'Artificial Intelligence',
  'Productivity',
  'Programming',
  'Poetry',
  'Design',
]

const SUGGESTED = [
  { name: 'Naomi Ruiz', handle: '@naomir', bio: 'Essays on craft & the writing life' },
  { name: 'Devon Marsh', handle: '@devonm', bio: 'Editor, 400 drafts and counting' },
  { name: 'Priya Anand', handle: '@priyaa', bio: 'Reporting on small, stubborn businesses' },
  { name: 'Sam Whitfield', handle: '@samw', bio: 'On finishing things (finally)' },
]

const FOOTER_LINKS = ['About', 'Help', 'Terms', 'Privacy', 'Careers', 'Text to speech']

export default function SidePanel({ open }: { open: boolean }) {
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
                {TOPICS.map((topic) => (
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
                {SUGGESTED.map((person) => (
                  <div key={person.handle} className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-full bg-red/15 text-red flex items-center justify-center font-medium shrink-0">
                      {person.name[0]}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] text-ink truncate font-medium">{person.name}</p>
                      <p className="text-[12px] text-meta truncate">{person.bio}</p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="inline-flex items-center gap-1 text-[13px] text-red hover:text-red-dim transition-colors"
                    >
                      <UserPlus size={14} />
                      Follow
                    </motion.button>
                  </div>
                ))}
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
