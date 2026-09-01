import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Loader2, BookOpen, X, Sparkles } from 'lucide-react'
import { useAtomValue, useSetAtom } from 'jotai'
import HomeNavbar from '../components/HomeNavbar'
import LeftSidebar from '../components/LeftSidebar'
import BlogCard from '../components/BlogCard'
import SidePanel from '../components/SidePanel'
import { sidePanelOpenAtom } from '../store/ui'
import {
  blogsAtom,
  paginationAtom,
  feedLoadingAtom,
  feedErrorAtom,
  currentPageAtom,
  fetchFeedAtom,
} from '../store/blog'

const TABS = ['For you', 'Featured']

export default function Home() {
  const blogs = useAtomValue(blogsAtom)
  const pagination = useAtomValue(paginationAtom)
  const loading = useAtomValue(feedLoadingAtom)
  const error = useAtomValue(feedErrorAtom)
  const currentPage = useAtomValue(currentPageAtom)
  const fetchFeed = useSetAtom(fetchFeedAtom)
  const sidePanelOpen = useAtomValue(sidePanelOpenAtom)

  const [activeTab, setActiveTab] = useState('For you')
  const [showBanner, setShowBanner] = useState(true)
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetchFeed({ page, pageSize: 8 })
  }, [fetchFeed, page])

  const goToPage = (next: number) => {
    if (next < 1 || next > pagination.totalPages) return
    setPage(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const paginationButtons = Array.from(
    { length: pagination.totalPages },
    (_, i) => i + 1,
  )

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <HomeNavbar />

      <div className="flex-1 flex pt-16">
        {/* Leftmost Sidebar Navigation */}
        <LeftSidebar />

        {/* Center Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* Main Feed Container */}
          <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 md:px-8 py-6 flex gap-10">
            <div className="flex-1 min-w-0 max-w-2xl mx-auto md:mx-0">
              {/* Feed Toggle Tabs (For you / Featured) */}
              <div className="flex items-center gap-8 border-b border-rule mb-6">
                {TABS.map((tab) => {
                  const isActive = activeTab === tab
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`relative pb-3 text-[14px] sm:text-[15px] font-medium transition-colors ${
                        isActive ? 'text-ink font-semibold' : 'text-meta hover:text-ink'
                      }`}
                    >
                      {tab}
                      {isActive && (
                        <motion.div
                          layoutId="activeTabUnderline"
                          className="absolute bottom-0 inset-x-0 h-[1.5px] bg-ink"
                          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                        />
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Feed Content */}
              {error && (
                <div className="rounded-xl border border-red bg-red/5 px-4 py-3 text-[14px] text-red mb-6">
                  {error}
                </div>
              )}

              {loading && blogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-meta">
                  <Loader2 size={28} className="animate-spin mb-3 text-ink-soft" />
                  <p className="text-[15px]">Loading stories…</p>
                </div>
              ) : blogs.length === 0 && !error ? (
                <div className="flex flex-col items-center justify-center py-24 text-meta">
                  <BookOpen size={32} className="mb-3 text-meta" />
                  <p className="text-[15px]">No stories published yet.</p>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-rule">
                    {blogs.map((blog, idx) => (
                      <BlogCard key={blog.id} blog={blog} index={idx} />
                    ))}
                  </div>

                  {blogs.length > 0 && pagination.totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-10 pt-6 border-t border-rule">
                      <p className="text-[13px] text-meta">
                        Page {pagination.page} of {pagination.totalPages} · {pagination.total} stories
                      </p>

                      <div className="flex items-center gap-2">
                        <motion.button
                          onClick={() => goToPage(currentPage - 1)}
                          disabled={currentPage <= 1}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="p-2 rounded-lg border border-rule text-ink-soft hover:text-ink transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          aria-label="Previous page"
                        >
                          <ChevronLeft size={18} />
                        </motion.button>

                        {paginationButtons.map((p) => (
                          <motion.button
                            key={p}
                            onClick={() => goToPage(p)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`w-9 h-9 rounded-lg text-[14px] transition-colors ${
                              p === currentPage
                                ? 'bg-ink text-paper font-semibold'
                                : 'border border-rule text-ink-soft hover:text-ink'
                            }`}
                          >
                            {p}
                          </motion.button>
                        ))}

                        <motion.button
                          onClick={() => goToPage(currentPage + 1)}
                          disabled={currentPage >= pagination.totalPages}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="p-2 rounded-lg border border-rule text-ink-soft hover:text-ink transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          aria-label="Next page"
                        >
                          <ChevronRight size={18} />
                        </motion.button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Right Recommendations Sidebar */}
            <SidePanel open={sidePanelOpen} />
          </main>
        </div>
      </div>
    </div>
  )
}
