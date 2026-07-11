import { useCallback, useEffect } from 'react'
import { useBeforeUnload, useBlocker } from 'react-router-dom'

type UnsavedNavigationGuardOptions = {
  confirmBlockedNavigation?: boolean
  message: string
  when: boolean
}

/**
 * Protects both Edit Preferences scopes through the data router. Sign-out is
 * intercepted separately because it mutates authentication before routing.
 */
export function useUnsavedNavigationGuard({
  confirmBlockedNavigation = true,
  message,
  when,
}: UnsavedNavigationGuardOptions) {
  const blocker = useBlocker(when)

  useBeforeUnload(useCallback((event) => {
    if (!when) return
    event.preventDefault()
    event.returnValue = ''
  }, [when]))

  useEffect(() => {
    if (!confirmBlockedNavigation || blocker.state !== 'blocked') return
    if (window.confirm(message)) blocker.proceed()
    else blocker.reset()
  }, [blocker, confirmBlockedNavigation, message])

  useEffect(() => {
    if (!when) return
    const handleExplicitNavigation = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return
      const element = event.target instanceof Element ? event.target : null
      if (!element?.closest('[data-unsaved-navigation="true"]')) return
      if (window.confirm(message)) return
      event.preventDefault()
      event.stopImmediatePropagation()
    }
    document.addEventListener('click', handleExplicitNavigation, true)
    return () => document.removeEventListener('click', handleExplicitNavigation, true)
  }, [message, when])

  return blocker
}
