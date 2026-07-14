import { useCallback, useEffect, useRef, useState } from 'react'
import type { CanonicalEditJourney } from '../lib/canonical-edit-journey'
import {
  loadCanonicalPrivateReviewMedia,
  recordCanonicalPrivateReviewDecision,
  type CanonicalPrivateReviewDecisionClientResult,
  type CanonicalPrivateReviewMediaClientResult,
} from '../lib/canonical-private-review-client'
import type { ProjectPersistenceScope } from '../lib/project-persistence-scope'

export type CanonicalPrivateReviewBrowserMedia = {
  objectUrl: string
  fileName: string
  byteSize: number
  mode: 'current' | 'history'
}

export type CanonicalPrivateReviewHookResult = {
  loadingMedia: boolean
  recordingDecision: boolean
  requestedReviewAssemblyId: string | null
  media: CanonicalPrivateReviewBrowserMedia | null
  mediaResult: CanonicalPrivateReviewMediaClientResult | null
  decisionResult: CanonicalPrivateReviewDecisionClientResult | null
  loadMedia: (
    journey: CanonicalEditJourney,
  ) => Promise<CanonicalPrivateReviewMediaClientResult>
  recordDecision: (
    journey: CanonicalEditJourney,
    decision: 'accept_private_internal_review' | 'request_revision',
    revisionSummary?: string,
  ) => Promise<CanonicalPrivateReviewDecisionClientResult>
  reset: () => void
}

export function useCanonicalPrivateReview({
  editSessionId,
  enabled,
  projectId,
  scope,
}: {
  editSessionId: string
  enabled: boolean
  projectId: string
  scope: ProjectPersistenceScope
}): CanonicalPrivateReviewHookResult {
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
  const objectUrlRef = useRef<string | null>(null)
  const [state, setState] = useState<{
    identityKey: string
    loadingMedia: boolean
    recordingDecision: boolean
    requestedReviewAssemblyId: string | null
    media: CanonicalPrivateReviewBrowserMedia | null
    mediaResult: CanonicalPrivateReviewMediaClientResult | null
    decisionResult: CanonicalPrivateReviewDecisionClientResult | null
  }>({
    identityKey,
    loadingMedia: false,
    recordingDecision: false,
    requestedReviewAssemblyId: null,
    media: null,
    mediaResult: null,
    decisionResult: null,
  })

  const revokeObjectUrl = useCallback(() => {
    if (!objectUrlRef.current) return
    URL.revokeObjectURL(objectUrlRef.current)
    objectUrlRef.current = null
  }, [])

  useEffect(() => {
    identityRef.current = identityKey
    requestVersionRef.current += 1
    revokeObjectUrl()
  }, [identityKey, revokeObjectUrl])

  useEffect(() => () => revokeObjectUrl(), [revokeObjectUrl])

  const loadMedia = useCallback(async (journey: CanonicalEditJourney) => {
    const requestIdentity = identityRef.current
    const requestVersion = ++requestVersionRef.current
    const requestedReviewAssemblyId =
      journey.privateReviewMediaAuthority?.reviewAssemblyId ?? null
    setState((current) => ({
      ...current,
      identityKey: requestIdentity,
      loadingMedia: true,
      requestedReviewAssemblyId,
      mediaResult: null,
    }))

    let result: CanonicalPrivateReviewMediaClientResult
    if (!enabled) {
      result = {
        status: 'not_configured',
        message: 'Private review playback is available for a signed-in named edit.',
        retryable: false,
        warnings: [],
      }
    } else {
      try {
        result = await loadCanonicalPrivateReviewMedia({
          scope,
          projectId,
          editSessionId,
          journey,
        })
      } catch {
        result = {
          status: 'unavailable',
          message: 'Private review playback could not be loaded. It is safe to try again.',
          retryable: true,
          warnings: [],
        }
      }
    }

    if (
      identityRef.current === requestIdentity &&
      requestVersionRef.current === requestVersion
    ) {
      let media: CanonicalPrivateReviewBrowserMedia | null = null
      if (result.status === 'ready') {
        revokeObjectUrl()
        const objectUrl = URL.createObjectURL(result.media.blob)
        objectUrlRef.current = objectUrl
        media = {
          objectUrl,
          fileName: result.media.fileName,
          byteSize: result.media.byteSize,
          mode: result.media.mode,
        }
      }
      setState((current) => ({
        ...current,
        identityKey: requestIdentity,
        loadingMedia: false,
        requestedReviewAssemblyId,
        media,
        mediaResult: result,
      }))
    }
    return result
  }, [editSessionId, enabled, projectId, revokeObjectUrl, scope])

  const recordDecision = useCallback(async (
    journey: CanonicalEditJourney,
    decision: 'accept_private_internal_review' | 'request_revision',
    revisionSummary?: string,
  ) => {
    const requestIdentity = identityRef.current
    const requestVersion = ++requestVersionRef.current
    setState((current) => ({
      ...current,
      identityKey: requestIdentity,
      recordingDecision: true,
      decisionResult: null,
    }))

    let result: CanonicalPrivateReviewDecisionClientResult
    if (!enabled) {
      result = {
        status: 'not_configured',
        message: 'Private review decisions are available for a signed-in named edit.',
        retryable: false,
        warnings: [],
      }
    } else {
      try {
        result = await recordCanonicalPrivateReviewDecision({
          scope,
          projectId,
          editSessionId,
          journey,
          decision,
          revisionSummary,
        })
      } catch {
        result = {
          status: 'unavailable',
          message: 'The private review decision could not be confirmed. It is safe to retry.',
          retryable: true,
          warnings: [],
        }
      }
    }

    if (
      identityRef.current === requestIdentity &&
      requestVersionRef.current === requestVersion
    ) {
      setState((current) => ({
        ...current,
        identityKey: requestIdentity,
        recordingDecision: false,
        decisionResult: result,
      }))
    }
    return result
  }, [editSessionId, enabled, projectId, scope])

  const reset = useCallback(() => {
    requestVersionRef.current += 1
    revokeObjectUrl()
    setState({
      identityKey,
      loadingMedia: false,
      recordingDecision: false,
      requestedReviewAssemblyId: null,
      media: null,
      mediaResult: null,
      decisionResult: null,
    })
  }, [identityKey, revokeObjectUrl])

  const current = state.identityKey === identityKey
  return {
    loadingMedia: current ? state.loadingMedia : false,
    recordingDecision: current ? state.recordingDecision : false,
    requestedReviewAssemblyId: current ? state.requestedReviewAssemblyId : null,
    media: current ? state.media : null,
    mediaResult: current ? state.mediaResult : null,
    decisionResult: current ? state.decisionResult : null,
    loadMedia,
    recordDecision,
    reset,
  }
}
