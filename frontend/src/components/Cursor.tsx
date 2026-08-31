import { useEffect, useRef, useState } from 'react'

export default function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const [enabled, setEnabled] = useState(false)
  const [hovering, setHovering] = useState(false)
  const [down, setDown] = useState(false)

  useEffect(() => {
    const fine = window.matchMedia?.('(pointer: fine)').matches
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (!fine || reduced) return
    setEnabled(true)
    document.documentElement.classList.add('has-cursor')
  }, [])

  useEffect(() => {
    if (!enabled) return

    let mouseX = window.innerWidth / 2
    let mouseY = window.innerHeight / 2
    let ringX = mouseX
    let ringY = mouseY
    let raf = 0

    const dot = dotRef.current
    const ring = ringRef.current

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY
      if (dot) {
        dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`
      }
    }

    const loop = () => {
      ringX += (mouseX - ringX) * 0.18
      ringY += (mouseY - ringY) * 0.18
      if (ring) {
        ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`
      }
      raf = requestAnimationFrame(loop)
    }

    const onOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const interactive = target.closest(
        'a, button, [role="button"], input, textarea, select, label, [data-cursor="hover"]',
      )
      if (interactive) setHovering(true)
      else setHovering(false)
    }

    const onDown = () => setDown(true)
    const onUp = () => setDown(false)

    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('mouseover', onOver, { passive: true })
    window.addEventListener('mousedown', onDown)
    window.addEventListener('mouseup', onUp)
    raf = requestAnimationFrame(loop)

    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseover', onOver)
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('mouseup', onUp)
      cancelAnimationFrame(raf)
    }
  }, [enabled])

  if (!enabled) return null

  return (
    <>
      <div ref={dotRef} className="cursor-dot" aria-hidden="true" />
      <div
        ref={ringRef}
        className={`cursor-ring ${hovering ? 'cursor-ring--hover' : ''} ${down ? 'cursor-ring--down' : ''}`}
        aria-hidden="true"
      />
    </>
  )
}
