import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  BookOpen,
  Search as SearchIcon,
} from 'lucide-react'
import { useAtomValue, useSetAtom } from 'jotai'
import { useSearchParams } from 'react-router-dom'
import HomeNavbar from '../components/HomeNavbar'
import LeftSidebar from '../components/LeftSidebar'
import BlogCard from '../components/BlogCard'
import SidePanel from '../components/SidePanel'
import { sidePanelOpenAtom } from '../store/ui'
import {
  searchResultAtom,
  searchPaginationAtom,
  searchLoadingAtom,
  searchErrorAtom,
  searchQueryAtom,
  fetchSearchAtom,
} from '../store/blog'

function SearchResults({ q }: { q: string }) {
  const results = useAtomValue(searchResultAtom)
  const pagination = useAtomValue(searchPaginationAtom)
  const loading = useAtomValue(searchLoadingAtom)
  const error = useAtomValue(searchErrorAtom)
  const activeQuery = useAtomValue(searchQueryAtom)
  const fetchSearch = useSetAtom(fetchSearchAtom)

  const [page, setPage] = useState(1)

  useEffect(() => {
    fetchSearch({ q, page, pageSize: 10 })
  }, [fetchSearch, q, page])

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
    <div className="flex-1 min-w-0 max-w-2xl mx-auto md:mx-0">
      <div className="flex items-center gap-2 border-b border-rule pb-3 mb-6">
        <SearchIcon size={16} className="text-meta shrink-0" />
        <h1 className="font-serif text-xl text-ink">
          Results for <span className="font-bold">“{activeQuery || q}”</span>
        </h1>
      </div>

      {activeQuery && (
        <p className="text-[13px] text-meta -mt-3 mb-6">
          {pagination.total} {pagination.total === 1 ? 'story' : 'stories'} found
        </p>
      )}

      {error && (
        <div className="rounded-xl border border-red bg-red/5 px-4 py-3 text-[14px] text-red mb-6">
          {error}
        </div>
      )}

      {loading && results.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-meta">
          <Loader2 size={28} className="animate-spin mb-3 text-ink-soft" />
          <p className="text-[15px]">Searching…</p>
        </div>
      ) : results.length === 0 && !loading && !error && q ? (
        <div className="flex flex-col items-center justify-center py-24 text-meta">
          <BookOpen size={32} className="mb-3 text-meta" />
          <p className="text-[15px]">No stories found for “{q}”.</p>
        </div>
      ) : (
        <>
          <div className="divide-y divide-rule">
            {results.map((blog, idx) => (
              <BlogCard key={blog.id} blog={blog} index={idx} />
            ))}
          </div>

          {results.length > 0 && pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-10 pt-6 border-t border-rule">
              <p className="text-[13px] text-meta">
                Page {pagination.page} of {pagination.totalPages} · {pagination.total} stories
              </p>

              <div className="flex items-center gap-2">
                <motion.button
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1}
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
                      p === page
                        ? 'bg-ink text-paper font-semibold'
                        : 'border border-rule text-ink-soft hover:text-ink'
                    }`}
                  >
                    {p}
                  </motion.button>
                ))}

                <motion.button
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= pagination.totalPages}
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
  )
}

export default function Search() {
  const [searchParams] = useSearchParams()
  const q = searchParams.get('q') || ''
  const sidePanelOpen = useAtomValue(sidePanelOpenAtom)

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <HomeNavbar />

      <div className="flex-1 flex pt-16">
        <LeftSidebar />

        <div className="flex-1 flex flex-col min-w-0">
          <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 md:px-8 py-6 flex gap-10">
            <SearchResults key={q} q={q} />

            <SidePanel open={sidePanelOpen} />
          </main>
        </div>
      </div>
    </div>
  )
}
