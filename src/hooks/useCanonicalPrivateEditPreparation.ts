import { useCallback, useEffect, useRef, useState } from 'react'
import type { CanonicalEditJourney } from '../lib/canonical-edit-journey'
import {
  prepareCanonicalPrivateEditForNamedEdit,
  type CanonicalPrivateEditPreparationClientResult,
} from '../lib/canonical-private-edit-preparation-client'
import type { ProjectPersistenceScope } from '../lib/project-persistence-scope'

export type CanonicalPrivateEditPreparationHookResult = {
  preparing: boolean
  requestedPackageRecordId: string | null
  result: CanonicalPrivateEditPreparationClientResult | null
  submittedAt: string | null
  prepareEdit: (
    journey: CanonicalEditJourney,
  ) => Promise<CanonicalPrivateEditPreparationClientResult>
  reset: () => void
}

export function useCanonicalPrivateEditPreparation({
  editSessionId,
  enabled,
  projectId,
  scope,
}: {
  editSessionId: string
  enabled: boolean
  projectId: string
  scope: ProjectPersistenceScope
}): CanonicalPrivateEditPreparationHookResult {
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
    preparing: boolean
    requestedPackageRecordId: string | null
    result: CanonicalPrivateEditPreparationClientResult | null
    submittedAt: string | null
  }>({
    identityKey,
    preparing: false,
    requestedPackageRecordId: null,
    result: null,
    submittedAt: null,
  })

  useEffect(() => {
    identityRef.current = identityKey
    requestVersionRef.current += 1
  }, [identityKey])

  const prepareEdit = useCallback(async (journey: CanonicalEditJourney) => {
    const requestIdentity = identityRef.current
    const requestVersion = ++requestVersionRef.current
    const requestedPackageRecordId =
      journey.privateEditPreparationAuthority?.packageRecordId ?? null
    setState({
      identityKey: requestIdentity,
      preparing: true,
      requestedPackageRecordId,
      result: null,
      submittedAt: null,
    })

    let result: CanonicalPrivateEditPreparationClientResult
    if (!enabled) {
      result = {
        status: 'not_configured',
        message: 'Private edit preparation is available for a signed-in named edit.',
        retryable: false,
        warnings: [],
      }
    } else {
      try {
        result = await prepareCanonicalPrivateEditForNamedEdit({
          scope,
          projectId,
          editSessionId,
          journey,
        })
      } catch {
        result = {
          status: 'unavailable',
          message: 'Private edit preparation could not be confirmed. The backend can safely recover the exact approved package on retry.',
          retryable: true,
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
        preparing: false,
        requestedPackageRecordId,
        result,
        submittedAt: new Date().toISOString(),
      })
    }
    return result
  }, [editSessionId, enabled, projectId, scope])

  const reset = useCallback(() => {
    requestVersionRef.current += 1
    setState({
      identityKey,
      preparing: false,
      requestedPackageRecordId: null,
      result: null,
      submittedAt: null,
    })
  }, [identityKey])

  const current = state.identityKey === identityKey
  return {
    preparing: current ? state.preparing : false,
    requestedPackageRecordId: current ? state.requestedPackageRecordId : null,
    result: current ? state.result : null,
    submittedAt: current ? state.submittedAt : null,
    prepareEdit,
    reset,
  }
}
