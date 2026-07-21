import { useCallback, useEffect, useRef, useState } from 'react'
import {
  saveCanonicalPlanningForNamedEdit,
  type CanonicalPlanningPublicationResult,
  type SaveCanonicalPlanningInput,
} from '../lib/canonical-planning-publication-client'
import type { ProjectPersistenceScope } from '../lib/project-persistence-scope'

type SubmissionInput = Pick<
  SaveCanonicalPlanningInput,
  'plan' | 'plannerInput' | 'sourceMediaAssets' | 'revisionJourney' |
  'motionStudioStorytellingStylePlan'
>

export type CanonicalPlanningPublicationHookResult = {
  saving: boolean
  result: CanonicalPlanningPublicationResult | null
  submittedAt: string | null
  submit: (input: SubmissionInput) => Promise<CanonicalPlanningPublicationResult>
  retry: () => Promise<CanonicalPlanningPublicationResult | null>
  reset: () => void
}

export function useCanonicalPlanningPublication({
  editSessionId,
  enabled,
  onSaved,
  projectId,
  scope,
}: {
  editSessionId: string
  enabled: boolean
  onSaved?: () => void
  projectId: string
  scope: ProjectPersistenceScope
}): CanonicalPlanningPublicationHookResult {
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
    result: CanonicalPlanningPublicationResult | null
    submittedAt: string | null
  }>({ identityKey, saving: false, result: null, submittedAt: null })

  useEffect(() => {
    identityRef.current = identityKey
    requestVersionRef.current += 1
    lastInputRef.current = null
  }, [identityKey])

  const submit = useCallback(async (submission: SubmissionInput) => {
    const requestIdentity = identityRef.current
    const requestVersion = ++requestVersionRef.current
    lastInputRef.current = submission
    setState({ identityKey: requestIdentity, saving: true, result: null, submittedAt: null })

    let result: CanonicalPlanningPublicationResult
    if (!enabled) {
      result = {
        status: 'not_configured',
        message: 'Canonical plan saving is available for a signed-in named edit.',
        retryable: false,
        handoffSaved: false,
        candidateSaved: false,
        publicationBlockers: [],
        warnings: [],
      }
    } else {
      try {
        result = await saveCanonicalPlanningForNamedEdit({
          scope,
          projectId,
          editSessionId,
          ...submission,
        })
      } catch {
        result = {
          status: 'unavailable',
          message: 'The private backend could not finish saving this plan. Your approval and credits were not changed.',
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
      if (result.handoffSaved) onSaved?.()
    }
    return result
  }, [editSessionId, enabled, onSaved, projectId, scope])

  const retry = useCallback(() => {
    const lastInput = lastInputRef.current
    return lastInput ? submit(lastInput) : Promise.resolve(null)
  }, [submit])

  const reset = useCallback(() => {
    requestVersionRef.current += 1
    lastInputRef.current = null
    setState({ identityKey, saving: false, result: null, submittedAt: null })
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
