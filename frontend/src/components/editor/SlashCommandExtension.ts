import { Extension } from '@tiptap/core'
import { ReactRenderer } from '@tiptap/react'
import Suggestion from '@tiptap/suggestion'
import tippy, { type Instance as TippyInstance } from 'tippy.js'
import type { SuggestionOptions, SuggestionKeyDownProps } from '@tiptap/suggestion'
import SlashCommandMenu from './SlashCommandMenu'
import type { AIAction } from '../../lib/aiService'

interface SlashCommandExtensionProps {
  onSelectAI: (action: AIAction) => void
}

function createSuggestionConfig({ onSelectAI }: SlashCommandExtensionProps): Omit<SuggestionOptions, 'editor'> {
  let reactRenderer: ReactRenderer | null = null
  let popup: TippyInstance[] | null = null

  return {
    char: '/',
    allowSpaces: true,

    items: ({ query }: { query: string }) => {
      const items = [
        { label: 'Continue Writing', action: 'continue_writing' as AIAction, group: 'ai' },
        { label: 'Improve Writing', action: 'improve_writing' as AIAction, group: 'ai' },
        { label: 'Fix Grammar', action: 'fix_grammar' as AIAction, group: 'ai' },
        { label: 'Make Shorter', action: 'make_shorter' as AIAction, group: 'ai' },
        { label: 'Make Longer', action: 'make_longer' as AIAction, group: 'ai' },
        { label: 'Change Tone', action: 'change_tone' as AIAction, group: 'ai' },
        { label: 'Summarize', action: 'summarize' as AIAction, group: 'ai' },
        { label: 'Ask AI', action: 'custom' as AIAction, group: 'ai' },
        { label: 'Heading 1', blockType: 'heading1', group: 'blocks' },
        { label: 'Heading 2', blockType: 'heading2', group: 'blocks' },
        { label: 'Heading 3', blockType: 'heading3', group: 'blocks' },
        { label: 'Bullet List', blockType: 'bulletList', group: 'blocks' },
        { label: 'Ordered List', blockType: 'orderedList', group: 'blocks' },
        { label: 'Blockquote', blockType: 'blockquote', group: 'blocks' },
        { label: 'Code Block', blockType: 'codeBlock', group: 'blocks' },
        { label: 'Horizontal Rule', blockType: 'horizontalRule', group: 'blocks' },
      ]
      return items.filter((item) =>
        item.label.toLowerCase().includes(query.toLowerCase()),
      )
    },

    render: () => {
      return {
        onStart: (props: any) => {
          reactRenderer = new ReactRenderer(SlashCommandMenu as any, {
            props,
            editor: props.editor,
          })

          if (!props.clientRect) return

          popup = tippy('body', {
            getReferenceClientRect: props.clientRect,
            appendTo: () => document.body,
            content: reactRenderer.element,
            showOnCreate: true,
            interactive: true,
            trigger: 'manual',
            placement: 'bottom-start',
          })
        },

        onUpdate: (props: any) => {
          reactRenderer?.updateProps(props)

          if (!props.clientRect) return

          popup?.[0]?.setProps({
            getReferenceClientRect: props.clientRect,
          })
        },

        onKeyDown: (props: SuggestionKeyDownProps) => {
          if (props.event.key === 'Escape') {
            popup?.[0]?.hide()
            return true
          }

          return (reactRenderer?.ref as any)?.onKeyDown?.(props.event) ?? false
        },

        onExit: () => {
          popup?.[0]?.destroy()
          reactRenderer?.destroy()
        },
      }
    },

    command: ({ editor, range, props }: any) => {
      editor.chain().focus().deleteRange(range).run()

      if (props.action) {
        onSelectAI(props.action)
      } else if (props.blockType) {
        applyBlockType(editor, props.blockType)
      }
    },
  }
}

function applyBlockType(editor: any, blockType: string) {
  switch (blockType) {
    case 'heading1':
      editor.chain().focus().toggleHeading({ level: 1 }).run()
      break
    case 'heading2':
      editor.chain().focus().toggleHeading({ level: 2 }).run()
      break
    case 'heading3':
      editor.chain().focus().toggleHeading({ level: 3 }).run()
      break
    case 'bulletList':
      editor.chain().focus().toggleBulletList().run()
      break
    case 'orderedList':
      editor.chain().focus().toggleOrderedList().run()
      break
    case 'blockquote':
      editor.chain().focus().toggleBlockquote().run()
      break
    case 'codeBlock':
      editor.chain().focus().toggleCodeBlock().run()
      break
    case 'horizontalRule':
      editor.chain().focus().setHorizontalRule().run()
      break
  }
}

export function createSlashCommandExtension(props: SlashCommandExtensionProps) {
  return Extension.create({
    name: 'slashCommand',

    addOptions() {
      return {
        suggestion: createSuggestionConfig(props),
      }
    },

    addProseMirrorPlugins() {
      return [
        Suggestion({
          editor: this.editor,
          ...this.options.suggestion,
        }),
      ]
    },
  })
}
