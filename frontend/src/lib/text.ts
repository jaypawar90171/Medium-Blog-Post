export function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return doc.body.textContent || ''
}

export function plainExcerpt(content: string, maxLength = 200): string {
  const text = stripHtml(content).replace(/\s+/g, ' ').trim()
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength).trimEnd()}…`
}
