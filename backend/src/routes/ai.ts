import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { prisma, type Variables } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'
import { AI_PROMPTS } from '../lib/aiPrompts'
import { groq } from '../lib/groq'

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

    const stream = await groq.chat.completions.create({
        model: process.env.GROQ_MODEL!,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
        ],
        stream: true,
        temperature: 0.7,
        max_tokens: 1024,
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
        async start(controller) {
            try {
                for await (const chunk of stream) {
                    const content = chunk.choices[0]?.delta?.content
                    if (content) {
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`))
                    }
                }
                controller.enqueue(encoder.encode('data: [DONE]\n\n'))
                controller.close()
            } catch (err) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Stream interrupted' })}\n\n`))
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

    const groqRes = await groq.chat.completions.create({
        model: process.env.GROQ_MODEL!,
        messages: [
            { role: 'system', content: AI_PROMPTS.suggest_title },
            { role: 'user', content },
        ],
        temperature: 0.7,
        max_tokens: 256,
    })

    const raw = groqRes.choices[0].message.content || "[]";

    try {
        const suggestions = JSON.parse(raw);
        if (!Array.isArray(suggestions)) {
            return c.json({ suggestions: [raw] });
        }
        return c.json({ suggestions: suggestions.slice(0, 5) });
    } catch {
        const suggestions = raw
            .split("\n")
            .map((line: string) => line.replace(/^\d+[\.\)]\s*/, "").replace(/^["']|["']$/g, "").trim())
            .filter((line: string) => line.length > 0)
            .slice(0, 5);

        return c.json({ suggestions });
    }
})

aiRouter.post('/suggest-tags', zValidator('json', suggestTitleSchema), async (c) => {
    const userId = c.get('userId')
    const { content } = c.req.valid('json')

    const groqRes = await groq.chat.completions.create({
        model: process.env.GROQ_MODEL!,
        messages: [
            { role: 'system', content: AI_PROMPTS.suggest_tags },
            { role: 'user', content },
        ],
        temperature: 0.7,
        max_tokens: 256,
    })

    const raw = groqRes.choices[0].message.content || "[]";

    try {
        const suggestions = JSON.parse(raw);
        if (!Array.isArray(suggestions)) {
            return c.json({ suggestions: [raw] });
        }
        return c.json({ suggestions: suggestions.slice(0, 5) });
    } catch {
        const suggestions = raw
            .split("\n")
            .map((line: string) => line.replace(/^\d+[\.\)]\s*/, "").replace(/^["']|["']$/g, "").trim())
            .filter((line: string) => line.length > 0)
            .slice(0, 5);

        return c.json({ suggestions });
    }
})
