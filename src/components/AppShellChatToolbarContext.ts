import { createContext, useContext } from 'react'

export type AppShellChatToolbarContextValue = {
  sidebarVisible: boolean
  sidebarToggleEnabled: boolean
  toggleSidebar: () => void
}

export const AppShellChatToolbarContext = createContext<AppShellChatToolbarContextValue>({
  sidebarToggleEnabled: false,
  sidebarVisible: true,
  toggleSidebar: () => undefined,
})

export function useAppShellChatToolbar() {
  return useContext(AppShellChatToolbarContext)
}
