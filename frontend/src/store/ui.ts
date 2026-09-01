import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

export const sidePanelOpenAtom = atomWithStorage<boolean>('journal-sidepanel', true)
export const leftSidebarOpenAtom = atomWithStorage<boolean>('journal-left-sidebar', true)
export const mobileLeftSidebarOpenAtom = atom<boolean>(false)

export type ToastType = 'success' | 'info' | 'error'

export interface ToastMessage {
  id: string
  message: string
  type?: ToastType
  duration?: number
}

export const toastAtom = atom<ToastMessage | null>(null)

export const showToastAtom = atom(
  null,
  (_get, set, toast: { message: string; type?: ToastType; duration?: number }) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast: ToastMessage = {
      id,
      message: toast.message,
      type: toast.type || 'success',
      duration: toast.duration || 3000,
    }
    set(toastAtom, newToast)
  },
)

export const clearToastAtom = atom(null, (_get, set) => {
  set(toastAtom, null)
})
