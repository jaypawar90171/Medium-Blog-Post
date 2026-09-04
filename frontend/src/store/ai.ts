import { atom } from 'jotai'
import type { AIAction } from '../lib/aiService'

export const aiLoadingAtom = atom<boolean>(false)
export const aiResponseAtom = atom<string>('')
export const aiErrorAtom = atom<string | null>(null)
export const aiPanelVisibleAtom = atom<boolean>(false)
export const aiActionAtom = atom<AIAction | null>(null)

export const resetAiAtom = atom(null, (_get, set) => {
  set(aiLoadingAtom, false)
  set(aiResponseAtom, '')
  set(aiErrorAtom, null as string | null)
  set(aiPanelVisibleAtom, false)
  set(aiActionAtom, null as AIAction | null)
})
