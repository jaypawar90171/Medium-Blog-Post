import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

export const sidePanelOpenAtom = atomWithStorage<boolean>('journal-sidepanel', true)
export const leftSidebarOpenAtom = atomWithStorage<boolean>('journal-left-sidebar', true)
export const mobileLeftSidebarOpenAtom = atom<boolean>(false)
