import { useCallback, useEffect, useRef, useState } from 'react'
import {
  presentCanonicalSourceLedCaptionRevision,
  type CanonicalSourceLedCaptionRevisionClientResult,
} from '../lib/canonical-source-led-caption-revision-client'
import { readCanonicalEditJourney } from '../lib/canonical-edit-journey-client'
import type { ProjectPersistenceScope } from '../lib/project-persistence-scope'

export type CanonicalSourceLedCaptionRevisionHookResult = {
  presenting: boolean
  result: CanonicalSourceLedCaptionRevisionClientResult | null
  presentLatest: () => Promise<CanonicalSourceLedCaptionRevisionClientResult>
  reset: () => void
}

export function useCanonicalSourceLedCaptionRevision({
  editSessionId,
  enabled,
  onPresented,
  projectId,
  scope,
}: {
  editSessionId: string
  enabled: boolean
  onPresented?: () => void
  projectId: string
  scope: ProjectPersistenceScope
}): CanonicalSourceLedCaptionRevisionHookResult {
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
    presenting: boolean
    result: CanonicalSourceLedCaptionRevisionClientResult | null
  }>({
    identityKey,
    presenting: false,
    result: null,
  })

  useEffect(() => {
    identityRef.current = identityKey
    requestVersionRef.current += 1
  }, [identityKey])

  const presentLatest = useCallback(async () => {
    const requestIdentity = identityRef.current
    const requestVersion = ++requestVersionRef.current
    setState({
      identityKey: requestIdentity,
      presenting: true,
      result: null,
    })

    let result: CanonicalSourceLedCaptionRevisionClientResult
    if (!enabled) {
      result = {
        status: 'not_configured',
        message:
          'Server-derived revision planning is available for a signed-in named edit.',
        retryable: false,
        warnings: [],
      }
    } else {
      try {
        const journeyResult = await readCanonicalEditJourney(
          scope,
          projectId,
          editSessionId,
        )
        if (journeyResult.status !== 'ready') {
          result = {
            status:
              journeyResult.status === 'access_denied'
                ? 'access_denied'
                : journeyResult.status === 'not_configured'
                  ? 'not_configured'
                  : journeyResult.status === 'invalid_response'
                    ? 'invalid_response'
                    : journeyResult.status === 'unavailable'
                      ? 'unavailable'
                      : 'blocked',
            message:
              journeyResult.status === 'not_found'
                ? 'The saved revision decision could not be found.'
                : journeyResult.message,
            retryable: journeyResult.retryable,
            warnings: journeyResult.warnings,
          }
        } else {
          result = await presentCanonicalSourceLedCaptionRevision({
            scope,
            projectId,
            editSessionId,
            journey: journeyResult.journey,
          })
        }
      } catch {
        result = {
          status: 'unavailable',
          message:
            'The revised plan could not be prepared. It is safe to try again.',
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
        presenting: false,
        result,
      })
      if (result.status === 'ready') onPresented?.()
    }
    return result
  }, [editSessionId, enabled, onPresented, projectId, scope])

  const reset = useCallback(() => {
    requestVersionRef.current += 1
    setState({
      identityKey,
      presenting: false,
      result: null,
    })
  }, [identityKey])

  const current = state.identityKey === identityKey
  return {
    presenting: current ? state.presenting : false,
    result: current ? state.result : null,
    presentLatest,
    reset,
  }
}
