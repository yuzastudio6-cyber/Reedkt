import { useCallback, useEffect, useRef, useState } from 'react'
import {
  presentCanonicalSourceLedPlan,
  type CanonicalSourceLedPlanPresentationClientResult,
} from '../lib/canonical-source-led-plan-presentation-client'
import type { ProjectPersistenceScope } from '../lib/project-persistence-scope'
import type { AspectRatio } from '../types/reeditpro'

type SubmissionInput = {
  orderedMediaAssetIds: string[]
  confirmedAspectRatio: AspectRatio
}

export type CanonicalSourceLedPlanPresentationHookResult = {
  saving: boolean
  result: CanonicalSourceLedPlanPresentationClientResult | null
  submittedAt: string | null
  submit: (
    input: SubmissionInput,
  ) => Promise<CanonicalSourceLedPlanPresentationClientResult>
  retry: () =>
    Promise<CanonicalSourceLedPlanPresentationClientResult | null>
  reset: () => void
}

export function useCanonicalSourceLedPlanPresentation({
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
}): CanonicalSourceLedPlanPresentationHookResult {
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
  const lastInputRef = useRef<SubmissionInput | null>(null)
  const [state, setState] = useState<{
    identityKey: string
    saving: boolean
    result: CanonicalSourceLedPlanPresentationClientResult | null
    submittedAt: string | null
  }>({
    identityKey,
    saving: false,
    result: null,
    submittedAt: null,
  })

  useEffect(() => {
    identityRef.current = identityKey
    requestVersionRef.current += 1
    lastInputRef.current = null
  }, [identityKey])

  const submit = useCallback(async (submission: SubmissionInput) => {
    const requestIdentity = identityRef.current
    const requestVersion = ++requestVersionRef.current
    lastInputRef.current = {
      orderedMediaAssetIds: [...submission.orderedMediaAssetIds],
      confirmedAspectRatio: submission.confirmedAspectRatio,
    }
    setState({
      identityKey: requestIdentity,
      saving: true,
      result: null,
      submittedAt: null,
    })

    let result: CanonicalSourceLedPlanPresentationClientResult
    if (!enabled) {
      result = {
        status: 'not_configured',
        message:
          'Server-derived source planning is available for a signed-in named edit.',
        retryable: false,
        handoffSaved: false,
        candidateSaved: false,
        publicationBlockers: [],
        warnings: [],
      }
    } else {
      try {
        result = await presentCanonicalSourceLedPlan({
          scope,
          projectId,
          editSessionId,
          orderedMediaAssetIds: submission.orderedMediaAssetIds,
          confirmedAspectRatio: submission.confirmedAspectRatio,
        })
      } catch {
        result = {
          status: 'unavailable',
          message:
            'The server-derived plan could not be prepared. It is safe to try again.',
          retryable: true,
          handoffSaved: false,
          candidateSaved: false,
          publicationBlockers: [],
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
        saving: false,
        result,
        submittedAt: new Date().toISOString(),
      })
      if (
        result.status === 'plan_published_waiting_for_approval'
      ) {
        onPresented?.()
      }
    }
    return result
  }, [editSessionId, enabled, onPresented, projectId, scope])

  const retry = useCallback(() => {
    const lastInput = lastInputRef.current
    return lastInput ? submit(lastInput) : Promise.resolve(null)
  }, [submit])

  const reset = useCallback(() => {
    requestVersionRef.current += 1
    lastInputRef.current = null
    setState({
      identityKey,
      saving: false,
      result: null,
      submittedAt: null,
    })
  }, [identityKey])

  const current = state.identityKey === identityKey
  return {
    saving: current ? state.saving : false,
    result: current ? state.result : null,
    submittedAt: current ? state.submittedAt : null,
    submit,
    retry,
    reset,
  }
}
