import { useCallback, useEffect, useRef, useState } from 'react'
import type { CanonicalEditJourney } from '../lib/canonical-edit-journey'
import {
  approveCanonicalPlanForNamedEdit,
  type CanonicalPlanApprovalClientResult,
} from '../lib/canonical-plan-approval-client'
import type { ProjectPersistenceScope } from '../lib/project-persistence-scope'

export type CanonicalPlanApprovalHookResult = {
  approving: boolean
  result: CanonicalPlanApprovalClientResult | null
  submittedAt: string | null
  approve: (journey: CanonicalEditJourney) => Promise<CanonicalPlanApprovalClientResult>
  reset: () => void
}

export function useCanonicalPlanApproval({
  editSessionId,
  enabled,
  projectId,
  scope,
}: {
  editSessionId: string
  enabled: boolean
  projectId: string
  scope: ProjectPersistenceScope
}): CanonicalPlanApprovalHookResult {
  const identityKey = JSON.stringify([
    scope.authMode,
    scope.userId,
    scope.backendUserId ?? '',
    scope.workspaceId,
    projectId,
    editSessionId,
  ])
  const identityRef = useRef(identityKey)
  const requestVersionRef = useRef(0)
  const [state, setState] = useState<{
    identityKey: string
    approving: boolean
    result: CanonicalPlanApprovalClientResult | null
    submittedAt: string | null
  }>({ identityKey, approving: false, result: null, submittedAt: null })

  useEffect(() => {
    identityRef.current = identityKey
    requestVersionRef.current += 1
  }, [identityKey])

  const approve = useCallback(async (journey: CanonicalEditJourney) => {
    const requestIdentity = identityRef.current
    const requestVersion = ++requestVersionRef.current
    setState({ identityKey: requestIdentity, approving: true, result: null, submittedAt: null })

    let result: CanonicalPlanApprovalClientResult
    if (!enabled) {
      result = {
        status: 'not_configured',
        message: 'Canonical approval is available for a signed-in named edit.',
        retryable: false,
        reservationState: 'unchanged',
        warnings: [],
      }
    } else {
      try {
        result = await approveCanonicalPlanForNamedEdit({
          scope,
          projectId,
          editSessionId,
          journey,
        })
      } catch {
        result = {
          status: 'unavailable',
          message: 'Approval could not be confirmed. Refresh the saved workflow before trying again.',
          retryable: false,
          reservationState: 'unknown',
          warnings: [],
        }
      }
    }

    if (
      identityRef.current === requestIdentity &&
      requestVersionRef.current === requestVersion
    ) {
      setState({
        identityKey: requestIdentity,
        approving: false,
        result,
        submittedAt: new Date().toISOString(),
      })
    }
    return result
  }, [editSessionId, enabled, projectId, scope])

  const reset = useCallback(() => {
    requestVersionRef.current += 1
    setState({ identityKey, approving: false, result: null, submittedAt: null })
  }, [identityKey])

  const current = state.identityKey === identityKey
  return {
    approving: current ? state.approving : false,
    result: current ? state.result : null,
    submittedAt: current ? state.submittedAt : null,
    approve,
    reset,
  }
}
