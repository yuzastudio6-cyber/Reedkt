import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { EditBrief } from '../types'
import type {
  CanonicalEditBriefAuthority,
  CanonicalEditBriefFields,
  CanonicalEditBriefMarkerDraft,
} from '../types/edit-brief-authority'
import {
  appendCanonicalEditBriefMarkerMessage,
  changeCanonicalEditBriefMarkerStatus,
  createCanonicalEditBriefMarker,
  readCanonicalEditBriefAuthority,
  saveCanonicalEditBrief,
  updateCanonicalEditBriefMarker,
  type CanonicalEditBriefClientResult,
  type CanonicalEditBriefScope,
} from '../lib/edit-brief-authority-client'
import { getFrontendApiClientStatus } from '../backend/api/frontend-api-client'

export type CanonicalEditBriefSyncStatus =
  | 'idle'
  | 'loading'
  | 'saving'
  | 'saved'
  | 'stale'
  | 'unavailable'
  | 'access_denied'
  | 'invalid'

export interface UseCanonicalEditBriefAuthorityResult {
  authority?: CanonicalEditBriefAuthority
  status: CanonicalEditBriefSyncStatus
  message: string
  retryable: boolean
  planningReady: boolean
  refresh: () => Promise<void>
  saveNow: () => Promise<boolean>
  createMarker: (marker: CanonicalEditBriefMarkerDraft) => Promise<boolean>
  updateMarker: (
    markerId: string,
    patch: Omit<Partial<CanonicalEditBriefMarkerDraft>, 'endSeconds'>
      & { endSeconds?: number | null },
  ) => Promise<boolean>
  changeMarkerStatus: (
    markerId: string,
    action: 'confirm' | 'archive' | 'reopen',
  ) => Promise<boolean>
  appendMarkerMessage: (
    markerId: string,
    content: string,
  ) => Promise<boolean>
}

export function useCanonicalEditBriefAuthority(input: {
  enabled: boolean
  started: boolean
  readOnly: boolean
  scope: CanonicalEditBriefScope
  editBrief: EditBrief | null
}): UseCanonicalEditBriefAuthorityResult {
  const [authority, setAuthority] = useState<CanonicalEditBriefAuthority>()
  const [status, setStatus] = useState<CanonicalEditBriefSyncStatus>('idle')
  const [message, setMessage] = useState(
    'The professional marker timeline will save with this named edit.',
  )
  const [retryable, setRetryable] = useState(false)
  const authorityRef = useRef(authority)
  const editBriefRef = useRef(input.editBrief)
  const mutationQueueRef = useRef<Promise<unknown>>(Promise.resolve())
  const latestDesiredFingerprintRef = useRef('')
  const activeScopeKeyRef = useRef('')

  useEffect(() => {
    authorityRef.current = authority
  }, [authority])

  useEffect(() => {
    editBriefRef.current = input.editBrief
  }, [input.editBrief])

  const scope = useMemo<CanonicalEditBriefScope>(() => ({
    workspaceId: input.scope.workspaceId,
    projectId: input.scope.projectId,
    editSessionId: input.scope.editSessionId,
  }), [
    input.scope.editSessionId,
    input.scope.projectId,
    input.scope.workspaceId,
  ])
  const scopeKey = `${scope.workspaceId}:${scope.projectId}:${scope.editSessionId}`

  useEffect(() => {
    activeScopeKeyRef.current = scopeKey
    mutationQueueRef.current = Promise.resolve()
    latestDesiredFingerprintRef.current = ''
  }, [scopeKey])

  const applyResult = useCallback((
    result: CanonicalEditBriefClientResult<{
      authority?: CanonicalEditBriefAuthority
      aggregateRevision: number
      optionalBriefPresent: boolean
    }>,
    successMessage: string,
    expectedScopeKey: string,
  ): boolean => {
    if (activeScopeKeyRef.current !== expectedScopeKey) return false
    if (result.status === 'ready') {
      setAuthority(result.data.authority)
      authorityRef.current = result.data.authority
      setStatus('saved')
      setMessage(successMessage)
      setRetryable(false)
      return true
    }
    setStatus(result.status)
    setMessage(result.message)
    setRetryable(result.retryable)
    return false
  }, [])

  const refresh = useCallback(async () => {
    if (!input.enabled) return
    setStatus('loading')
    setMessage('Loading the exact Edit Brief timeline…')
    const result = await readCanonicalEditBriefAuthority(scope)
    applyResult(result, result.status === 'ready' && result.data.authority
      ? 'Edit Brief timeline recovered from the exact named edit.'
      : 'No durable marker timeline has been created yet.', scopeKey)
  }, [applyResult, input.enabled, scope, scopeKey])

  useEffect(() => {
    if (!input.enabled) return
    const frame = window.requestAnimationFrame(() => {
      setAuthority(undefined)
      authorityRef.current = undefined
      void refresh()
    })
    return () => window.cancelAnimationFrame(frame)
  }, [input.enabled, refresh, scopeKey])

  const saveNow = useCallback(async (): Promise<boolean> => {
    const editBrief = editBriefRef.current
    if (!input.enabled || !input.started || !editBrief?.goal?.trim()) return false
    if (input.readOnly) {
      setStatus('invalid')
      setMessage('This approved Edit Brief is locked. Request a revision in Chat.')
      return false
    }

    const fields = toCanonicalFields(editBrief)
    setStatus('saving')
    setMessage('Saving the Brief and timeline authority…')
    const perform = async () => {
      let current = authorityRef.current
      let result = await saveCanonicalEditBrief(scope, {
        authorityPresent: Boolean(current?.brief),
        expectedRevision: current?.revision ?? 0,
        fields,
      })
      if (result.status === 'stale') {
        const refreshed = await readCanonicalEditBriefAuthority(scope)
        if (refreshed.status !== 'ready') {
          applyResult(refreshed, '', scopeKey)
          return false
        }
        current = refreshed.data.authority
        authorityRef.current = current
        if (sameCanonicalFields(current?.brief?.fields, fields)) {
          return applyResult(
            refreshed,
            'Edit Brief save was already committed and recovered.',
            scopeKey,
          )
        }
        result = await saveCanonicalEditBrief(scope, {
          authorityPresent: Boolean(current?.brief),
          expectedRevision: current?.revision ?? 0,
          fields,
        })
      }
      return applyResult(result, 'Brief direction and marker authority are saved.', scopeKey)
    }
    const queued = mutationQueueRef.current.then(perform, perform)
    mutationQueueRef.current = queued
    return queued
  }, [
    applyResult,
    input.enabled,
    input.readOnly,
    scope,
    scopeKey,
    input.started,
  ])

  const desiredFields = useMemo(
    () => input.editBrief ? toCanonicalFields(input.editBrief) : undefined,
    [input.editBrief],
  )
  const desiredFingerprint = useMemo(
    () => desiredFields ? JSON.stringify(desiredFields) : '',
    [desiredFields],
  )
  const frontendApiStatus = getFrontendApiClientStatus()
  const planningAuthorityRequired = input.enabled
    && !frontendApiStatus.mockOnly
    && Boolean(frontendApiStatus.apiBaseUrl)
  const planningReady = !planningAuthorityRequired || Boolean(
    input.started
    && desiredFields?.status === 'ready'
    && status === 'saved'
    && sameCanonicalFields(authority?.brief?.fields, desiredFields),
  )

  useEffect(() => {
    if (
      !input.enabled
      || !input.started
      || input.readOnly
      || !desiredFields?.goal.trim()
    ) return
    if (sameCanonicalFields(authority?.brief?.fields, desiredFields)) {
      latestDesiredFingerprintRef.current = desiredFingerprint
      return
    }
    if (latestDesiredFingerprintRef.current === desiredFingerprint && status === 'saving') {
      return
    }
    latestDesiredFingerprintRef.current = desiredFingerprint
    const timeout = window.setTimeout(() => {
      void saveNow()
    }, 700)
    return () => window.clearTimeout(timeout)
  }, [
    authority?.brief?.fields,
    desiredFields,
    desiredFingerprint,
    input.enabled,
    input.readOnly,
    input.started,
    saveNow,
    status,
  ])

  const mutate = useCallback(async (
    action: (
      current: CanonicalEditBriefAuthority,
    ) => Promise<CanonicalEditBriefClientResult<{
      authority?: CanonicalEditBriefAuthority
      aggregateRevision: number
      optionalBriefPresent: boolean
    }>>,
    successMessage: string,
  ): Promise<boolean> => {
    if (input.readOnly) {
      setStatus('invalid')
      setMessage('This approved Edit Brief is locked. Request a revision in Chat.')
      return false
    }
    if (!authorityRef.current?.brief && !(await saveNow())) {
      setMessage('Save a clear Edit Brief goal before adding timeline markers.')
      return false
    }
    setStatus('saving')
    const perform = async () => {
      let current = authorityRef.current
      if (!current) return false
      let result = await action(current)
      if (result.status === 'stale') {
        const refreshed = await readCanonicalEditBriefAuthority(scope)
        if (refreshed.status !== 'ready' || !refreshed.data.authority) {
          applyResult(refreshed, '', scopeKey)
          return false
        }
        current = refreshed.data.authority
        authorityRef.current = current
        result = await action(current)
      }
      return applyResult(result, successMessage, scopeKey)
    }
    const queued = mutationQueueRef.current.then(perform, perform)
    mutationQueueRef.current = queued
    return queued
  }, [applyResult, input.readOnly, saveNow, scope, scopeKey])

  const createMarker = useCallback(
    (marker: CanonicalEditBriefMarkerDraft) => mutate(
      (current) => createCanonicalEditBriefMarker(scope, {
        expectedRevision: current.revision,
        marker,
      }),
      'Timeline marker saved. Confirm it when the instruction is final.',
    ),
    [mutate, scope],
  )

  const updateMarker = useCallback(
    (
      markerId: string,
      patch: Omit<Partial<CanonicalEditBriefMarkerDraft>, 'endSeconds'>
        & { endSeconds?: number | null },
    ) => mutate(
      (current) => updateCanonicalEditBriefMarker(scope, {
        expectedRevision: current.revision,
        markerId,
        patch,
      }),
      'Marker changes saved. Confirmation was reset for review.',
    ),
    [mutate, scope],
  )

  const changeMarkerStatus = useCallback(
    (markerId: string, action: 'confirm' | 'archive' | 'reopen') => mutate(
      (current) => changeCanonicalEditBriefMarkerStatus(scope, {
        expectedRevision: current.revision,
        markerId,
        action,
      }),
      action === 'confirm'
        ? 'Marker confirmed for canonical planning.'
        : action === 'archive'
          ? 'Marker archived without deleting its history.'
          : 'Marker reopened as a draft.',
    ),
    [mutate, scope],
  )

  const appendMarkerMessage = useCallback(
    (markerId: string, content: string) => mutate(
      (current) => appendCanonicalEditBriefMarkerMessage(scope, {
        expectedRevision: current.revision,
        markerId,
        content,
      }),
      'Marker direction saved. Reconfirm the marker after reviewing the change.',
    ),
    [mutate, scope],
  )

  return {
    authority,
    status,
    message,
    retryable,
    planningReady,
    refresh,
    saveNow,
    createMarker,
    updateMarker,
    changeMarkerStatus,
    appendMarkerMessage,
  }
}

function toCanonicalFields(editBrief: EditBrief): CanonicalEditBriefFields {
  return {
    goal: editBrief.goal?.trim() ?? '',
    audience: optional(editBrief.audience),
    deliverable: editBrief.targetPlatforms.length > 0
      ? `Professional edit for ${editBrief.targetPlatforms.join(', ')}`
      : undefined,
    mustIncludeNotes: unique(editBrief.mustIncludeNotes),
    avoidNotes: unique(editBrief.avoidNotes),
    additionalNotes: optional(editBrief.specialInstructions),
    targetPlatforms: [...editBrief.targetPlatforms],
    targetDurationMs: editBrief.targetDurationMs,
    styleKeywords: unique(editBrief.styleKeywords),
    pacingPreference: editBrief.pacingPreference,
    captionPreference: editBrief.captionPreference,
    musicPreference: editBrief.musicPreference,
    bRollPreference: optional(editBrief.bRollPreference),
    mustUseAssetIds: unique(editBrief.mustUseAssetIds),
    avoidAssetIds: unique(editBrief.avoidAssetIds),
    brandNotes: optional(editBrief.brandNotes),
    specialInstructions: optional(editBrief.specialInstructions),
    userProvidedReferenceUrls: unique(editBrief.userProvidedReferenceUrls ?? []),
    status: editBrief.status === 'ready' || editBrief.status === 'used_in_plan'
      ? 'ready'
      : 'draft',
  }
}

function sameCanonicalFields(
  left: CanonicalEditBriefFields | undefined,
  right: CanonicalEditBriefFields,
): boolean {
  if (!left) return false
  return JSON.stringify(normalizeFields(left)) === JSON.stringify(normalizeFields(right))
}

function normalizeFields(fields: CanonicalEditBriefFields): CanonicalEditBriefFields {
  return {
    goal: fields.goal,
    audience: optional(fields.audience),
    deliverable: optional(fields.deliverable),
    mustIncludeNotes: fields.mustIncludeNotes ?? [],
    avoidNotes: fields.avoidNotes ?? [],
    additionalNotes: optional(fields.additionalNotes),
    targetPlatforms: fields.targetPlatforms ?? [],
    targetDurationMs: fields.targetDurationMs,
    styleKeywords: fields.styleKeywords ?? [],
    pacingPreference: fields.pacingPreference,
    captionPreference: fields.captionPreference,
    musicPreference: fields.musicPreference,
    bRollPreference: optional(fields.bRollPreference),
    mustUseAssetIds: fields.mustUseAssetIds ?? [],
    avoidAssetIds: fields.avoidAssetIds ?? [],
    brandNotes: optional(fields.brandNotes),
    specialInstructions: optional(fields.specialInstructions),
    userProvidedReferenceUrls: fields.userProvidedReferenceUrls ?? [],
    status: fields.status,
  }
}

function optional(value: string | undefined): string | undefined {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)))
}
