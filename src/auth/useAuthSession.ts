import { useContext } from 'react'
import { AuthSessionContext } from './auth-session-context'
import type { AuthSessionContextValue } from './auth-session-types'

export function useAuthSession(): AuthSessionContextValue {
  const value = useContext(AuthSessionContext)
  if (!value) throw new Error('useAuthSession must be used inside AuthSessionProvider.')
  return value
}
