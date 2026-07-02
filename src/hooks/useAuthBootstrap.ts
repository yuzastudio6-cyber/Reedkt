import { useCallback, useEffect, useState } from 'react'
import type {
  AuthBootstrapFlowResult,
  AuthBootstrapMode,
  AuthBootstrapNextStep,
  AuthBootstrapStatus,
  AuthenticatedUserContext,
} from '../types/auth-bootstrap'
import {
  getAuthClientStatus,
  onSupabaseAuthStateChange,
  signOutSupabaseUser,
} from '../backend/auth/auth-client-service'
import { runAuthBootstrapFlow } from '../backend/auth/auth-bootstrap-orchestrator'

export interface UseAuthBootstrapResult {
  loading: boolean
  configured: boolean
  status: AuthBootstrapStatus
  mode: AuthBootstrapMode
  nextStep?: AuthBootstrapNextStep
  userContext?: AuthenticatedUserContext
  warnings: string[]
  bootstrapResult?: AuthBootstrapFlowResult
  refresh: () => Promise<AuthBootstrapFlowResult>
  signOut: () => Promise<void>
}

export function useAuthBootstrap(): UseAuthBootstrapResult {
  const clientStatus = getAuthClientStatus()
  const [loading, setLoading] = useState(true)
  const [configured, setConfigured] = useState(clientStatus.configured)
  const [status, setStatus] = useState<AuthBootstrapStatus>(clientStatus.status)
  const [mode, setMode] = useState<AuthBootstrapMode>(clientStatus.mode)
  const [nextStep, setNextStep] = useState<AuthBootstrapNextStep | undefined>(undefined)
  const [userContext, setUserContext] = useState<AuthenticatedUserContext | undefined>(undefined)
  const [warnings, setWarnings] = useState<string[]>(clientStatus.warnings)
  const [bootstrapResult, setBootstrapResult] = useState<AuthBootstrapFlowResult | undefined>(undefined)

  const refresh = useCallback(async () => {
    setLoading(true)
    const result = await runAuthBootstrapFlow()

    setConfigured(result.status !== 'not_configured')
    setStatus(result.status)
    setMode(result.mode)
    setNextStep(result.nextStep)
    setUserContext(result.userContext)
    setWarnings(result.warnings)
    setBootstrapResult(result)
    setLoading(false)

    return result
  }, [])

  const signOut = useCallback(async () => {
    await signOutSupabaseUser()
    await refresh()
  }, [refresh])

  useEffect(() => {
    let active = true

    const refreshIfActive = async () => {
      const result = await runAuthBootstrapFlow()
      if (!active) return

      setConfigured(result.status !== 'not_configured')
      setStatus(result.status)
      setMode(result.mode)
      setNextStep(result.nextStep)
      setUserContext(result.userContext)
      setWarnings(result.warnings)
      setBootstrapResult(result)
      setLoading(false)
    }

    void refreshIfActive()

    const subscription = onSupabaseAuthStateChange(() => {
      void refreshIfActive()
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  return {
    loading,
    configured,
    status,
    mode,
    nextStep,
    userContext,
    warnings,
    bootstrapResult,
    refresh,
    signOut,
  }
}
