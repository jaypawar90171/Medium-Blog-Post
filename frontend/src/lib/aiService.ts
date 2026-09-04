export type AIAction =
  | 'continue_writing'
  | 'improve_writing'
  | 'fix_grammar'
  | 'make_shorter'
  | 'make_longer'
  | 'change_tone'
  | 'summarize'
  | 'custom'

export interface AIRequest {
  action: AIAction
  selectedText?: string
  contextBefore?: string
  contextAfter?: string
  customPrompt?: string
  tone?: string
}

export async function* streamAIResponse(
  params: AIRequest,
  token: string,
): AsyncGenerator<string, void, unknown> {
  const response = await fetch('/api/v1/ai/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error((error as { error?: string }).error || `AI request failed (${response.status})`)
  }

  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || !trimmed.startsWith('data: ')) continue
      const data = trimmed.slice(6)
      if (data === '[DONE]') return
      try {
        const parsed = JSON.parse(data) as { content?: string; error?: string }
        if (parsed.error) throw new Error(parsed.error)
        if (parsed.content) yield parsed.content
      } catch (e) {
        if (e instanceof SyntaxError) continue
        throw e
      }
    }
  }
}

export interface TitleSuggestionsResponse {
  suggestions: string[]
}

export interface TagSuggestionsResponse {
  suggestions: string[]
}

export async function suggestTitles(content: string, token: string): Promise<string[]> {
  const res = await fetch('/api/v1/ai/suggest-title', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ content }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error((err as { error?: string }).error || 'Failed to suggest titles')
  }
  const data: TitleSuggestionsResponse = await res.json()
  return data.suggestions
}

export async function suggestTags(content: string, token: string): Promise<string[]> {
  const res = await fetch('/api/v1/ai/suggest-tags', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ content }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error((err as { error?: string }).error || 'Failed to suggest tags')
  }
  const data: TagSuggestionsResponse = await res.json()
  return data.suggestions
}
