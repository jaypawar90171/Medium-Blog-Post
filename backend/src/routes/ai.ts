import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { prisma, type Variables } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'
import { AI_PROMPTS } from '../lib/aiPrompts'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

const suggestTitleSchema = z.object({
    content: z.string().min(1, 'Content is required'),
})

const generateSchema = z.object({
    action: z.enum([
        'continue_writing',
        'improve_writing',
        'fix_grammar',
        'make_shorter',
        'make_longer',
        'change_tone',
        'summarize',
        'custom',
    ]),
    selectedText: z.string().optional(),
    contextBefore: z.string().optional(),
    contextAfter: z.string().optional(),
    customPrompt: z.string().optional(),
    tone: z.string().optional(),
})

async function groqChat(messages: { role: string; content: string }[], options?: { temperature?: number; max_tokens?: number; stream?: boolean }) {
    const res = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
            messages,
            temperature: options?.temperature ?? 0.7,
            max_tokens: options?.max_tokens ?? 1024,
            stream: options?.stream ?? false,
        }),
    })

    if (res.status === 429) {
        throw new HttpError(429, 'AI is busy, please try again later')
    }

    if (!res.ok) {
        const errorText = await res.text()
        console.error('Groq API error:', res.status, errorText)
        throw new HttpError(500, 'Failed to connect to AI service')
    }

    return res
}

class HttpError extends Error {
    constructor(public statusCode: number, message: string) {
        super(message)
    }
}

export const aiRouter = new Hono<{ Variables: Variables }>()
aiRouter.use('*', authMiddleware)

aiRouter.post('/generate', zValidator('json', generateSchema), async (c) => {
    const { action, selectedText, contextBefore, contextAfter, customPrompt, tone } = c.req.valid('json')

    let systemPrompt = AI_PROMPTS[action]

    if (action === 'change_tone' && tone) {
        systemPrompt = systemPrompt.replace('{tone}', tone)
    }

    let userMessage = ''
    if (action === 'continue_writing') {
        userMessage = contextBefore ? `Previous text:\n${contextBefore}` : 'Continue writing from here.'
    } else if (action === 'custom') {
        userMessage = `Content:\n${selectedText || contextBefore || ''}\n\nInstruction: ${customPrompt || ''}`
    } else {
        userMessage = selectedText || ''
    }

    let groqRes: Response
    try {
        groqRes = await groqChat(
            [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessage },
            ],
            { stream: true },
        )
    } catch (err) {
        if (err instanceof HttpError) {
            return c.json({ error: err.message }, err.statusCode as any)
        }
        return c.json({ error: 'Failed to connect to AI service' }, 500)
    }

    if (!groqRes.body) {
        return c.json({ error: 'Empty response from AI service' }, 500)
    }

    const reader = groqRes.body.getReader()
    const decoder = new TextDecoder()
    const encoder = new TextEncoder()

    const readable = new ReadableStream({
        async start(controller) {
            try {
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
                        if (data === '[DONE]') {
                            controller.enqueue(encoder.encode('data: [DONE]\n\n'))
                            controller.close()
                            return
                        }
                        try {
                            const parsed = JSON.parse(data)
                            const content = parsed.choices?.[0]?.delta?.content
                            if (content) {
                                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`))
                            }
                        } catch {
                            // skip malformed JSON lines
                        }
                    }
                }
                controller.enqueue(encoder.encode('data: [DONE]\n\n'))
                controller.close()
            } catch (err) {
                console.error('Stream error:', err)
                try {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Stream interrupted' })}\n\n`))
                } catch { /* already closed */ }
                controller.close()
            }
        },
    })

    return new Response(readable, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    })
})

aiRouter.post('/suggest-title', zValidator('json', suggestTitleSchema), async (c) => {
    const { content } = c.req.valid('json')

    const groqRes = await groqChat(
        [
            { role: 'system', content: AI_PROMPTS.suggest_title },
            { role: 'user', content },
        ],
        { max_tokens: 256 },
    )

    const data = await groqRes.json() as { choices: { message: { content: string } }[] }
    const raw = data.choices?.[0]?.message?.content || '[]'

    try {
        const suggestions = JSON.parse(raw)
        if (!Array.isArray(suggestions)) {
            return c.json({ suggestions: [raw] })
        }
        return c.json({ suggestions: suggestions.slice(0, 5) })
    } catch {
        const suggestions = raw
            .split('\n')
            .map((line: string) => line.replace(/^\d+[\.\)]\s*/, '').replace(/^["']|["']$/g, '').trim())
            .filter((line: string) => line.length > 0)
            .slice(0, 5)
        return c.json({ suggestions })
    }
})

aiRouter.post('/suggest-tags', zValidator('json', suggestTitleSchema), async (c) => {
    const { content } = c.req.valid('json')

    const groqRes = await groqChat(
        [
            { role: 'system', content: AI_PROMPTS.suggest_tags },
            { role: 'user', content },
        ],
        { max_tokens: 256 },
    )

    const data = await groqRes.json() as { choices: { message: { content: string } }[] }
    const raw = data.choices?.[0]?.message?.content || '[]'

    try {
        const suggestions = JSON.parse(raw)
        if (!Array.isArray(suggestions)) {
            return c.json({ suggestions: [raw] })
        }
        return c.json({ suggestions: suggestions.slice(0, 5) })
    } catch {
        const suggestions = raw
            .split('\n')
            .map((line: string) => line.replace(/^\d+[\.\)]\s*/, '').replace(/^["']|["']$/g, '').trim())
            .filter((line: string) => line.length > 0)
            .slice(0, 5)
        return c.json({ suggestions })
    }
})
