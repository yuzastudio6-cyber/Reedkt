import { useCallback, useEffect, useRef, useState } from 'react'
import type { CanonicalEditJourney } from '../lib/canonical-edit-journey'
import {
  requestCanonicalExecutionPackageForNamedEdit,
  type CanonicalExecutionPackageRequestClientResult,
} from '../lib/canonical-execution-package-request-client'
import type { ProjectPersistenceScope } from '../lib/project-persistence-scope'

export type CanonicalExecutionPackageRequestHookResult = {
  requesting: boolean
  requestedSnapshotId: string | null
  result: CanonicalExecutionPackageRequestClientResult | null
  submittedAt: string | null
  requestPackage: (
    journey: CanonicalEditJourney,
  ) => Promise<CanonicalExecutionPackageRequestClientResult>
  reset: () => void
}

export function useCanonicalExecutionPackageRequest({
  editSessionId,
  enabled,
  projectId,
  scope,
}: {
  editSessionId: string
  enabled: boolean
  projectId: string
  scope: ProjectPersistenceScope
}): CanonicalExecutionPackageRequestHookResult {
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
    requesting: boolean
    requestedSnapshotId: string | null
    result: CanonicalExecutionPackageRequestClientResult | null
    submittedAt: string | null
  }>({
    identityKey,
    requesting: false,
    requestedSnapshotId: null,
    result: null,
    submittedAt: null,
  })

  useEffect(() => {
    identityRef.current = identityKey
    requestVersionRef.current += 1
  }, [identityKey])

  const requestPackage = useCallback(async (journey: CanonicalEditJourney) => {
    const requestIdentity = identityRef.current
    const requestVersion = ++requestVersionRef.current
    const requestedSnapshotId = journey.executionPackageAuthority?.snapshotId ?? null
    setState({
      identityKey: requestIdentity,
      requesting: true,
      requestedSnapshotId,
      result: null,
      submittedAt: null,
    })

    let result: CanonicalExecutionPackageRequestClientResult
    if (!enabled) {
      result = {
        status: 'not_configured',
        message: 'Private preparation is available for a signed-in named edit.',
        retryable: false,
        packageState: 'unchanged',
        warnings: [],
      }
    } else {
      try {
        result = await requestCanonicalExecutionPackageForNamedEdit({
          scope,
          projectId,
          editSessionId,
          journey,
        })
      } catch {
        result = {
          status: 'unavailable',
          message: 'Private handoff preparation could not be confirmed. Retrying uses the same safe request key.',
          retryable: true,
          packageState: 'unknown',
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
        requesting: false,
        requestedSnapshotId,
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
      requesting: false,
      requestedSnapshotId: null,
      result: null,
      submittedAt: null,
    })
  }, [identityKey])

  const current = state.identityKey === identityKey
  return {
    requesting: current ? state.requesting : false,
    requestedSnapshotId: current ? state.requestedSnapshotId : null,
    result: current ? state.result : null,
    submittedAt: current ? state.submittedAt : null,
    requestPackage,
    reset,
  }
}
