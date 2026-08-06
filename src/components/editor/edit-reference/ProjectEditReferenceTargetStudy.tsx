import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  createPreferenceApplicationTargetContext,
  EDIT_REFERENCE_WORKSPACE_ID,
  readTargetVideoUnderstandingForProjectEditSession,
  startTargetVideoUnderstandingForProjectEditSession,
} from '../../../lib/project-edit-session-edit-reference-integration'
import { stableEditReferenceJson } from '../../../lib/edit-reference-deterministic-hash'
import {
  isTargetVideoUnderstandingReadyForUi,
  safeTargetVideoStudyError,
  shouldPollTargetVideoUnderstandingForUi,
  type EditReferenceTargetStudyLifecycle,
} from '../../../lib/edit-reference-target-study-ui'
import type { ProjectEditBriefBackendLocalRecord } from '../../../lib/project-edit-brief-backend-local'
import type { ProjectEditSessionBundleRecord } from '../../../types/project-edit-session-repository'
import type { TargetVideoUnderstandingPackage } from '../../../types/edit-reference-target-video-understanding'
import type { TargetVideoUnderstandingSchedule } from '../../../types/edit-reference-target-video-understanding'
import type { EditReferenceApiClient } from '../../../lib/edit-reference-api-client'
import { EditReferenceTargetStudyStatus } from './EditReferenceTargetStudyStatus'

export type ProjectEditReferenceTargetStudyProps = {
  bundle: ProjectEditSessionBundleRecord
  currentUserInstruction: string
  disabled?: boolean
  editBrief: ProjectEditBriefBackendLocalRecord
  editReferenceClient?: EditReferenceApiClient
  editReferenceId: string
  onPackageChange?: (packageRecord: TargetVideoUnderstandingPackage | undefined) => void
  onReady?: (packageRecord: TargetVideoUnderstandingPackage) => void
  referenceName: string
  workspaceId?: string
}

export function ProjectEditReferenceTargetStudy({
  bundle,
  currentUserInstruction,
  disabled = false,
  editBrief,
  editReferenceClient,
  editReferenceId,
  onPackageChange,
  onReady,
  referenceName,
  workspaceId,
}: ProjectEditReferenceTargetStudyProps) {
  const [lifecycle, setLifecycle] = useState<EditReferenceTargetStudyLifecycle>({ kind: 'checking' })
  const [busy, setBusy] = useState(false)
  const requestEpoch = useRef(0)
  const deliveredReadyDigest = useRef<string | undefined>(undefined)
  const onPackageChangeRef = useRef(onPackageChange)
  const onReadyRef = useRef(onReady)
  const effectiveWorkspaceId = workspaceId ?? bundle.session.workspaceId ?? EDIT_REFERENCE_WORKSPACE_ID

  useEffect(() => {
    onPackageChangeRef.current = onPackageChange
  }, [onPackageChange])

  useEffect(() => {
    onReadyRef.current = onReady
  }, [onReady])

  const clearAcceptedPackage = useCallback(() => {
    deliveredReadyDigest.current = undefined
    onPackageChangeRef.current?.(undefined)
  }, [])

  const authorityKey = useMemo(() => JSON.stringify({
    workspaceId: effectiveWorkspaceId,
    projectId: bundle.session.projectId,
    editSessionId: bundle.session.id,
    editReferenceId,
    sourceStorageObjectRecordId: editBrief.sourceStorageObjectRecordId,
    sourceMediaAssetId: editBrief.sourceMediaAssetId,
    editBriefRevision: editBrief.revisionNumber,
    editBriefDigestSha256: editBrief.contentDigestSha256,
    currentUserInstruction: currentUserInstruction.trim(),
    selectedEditLevel: bundle.session.selectedEditLevel,
    aspectRatio: bundle.session.aspectRatio,
    platformTarget: bundle.session.platformTarget,
    sessionName: bundle.session.name,
    sessionDescription: bundle.session.description,
  }), [
    bundle.session.id,
    bundle.session.aspectRatio,
    bundle.session.description,
    bundle.session.name,
    bundle.session.platformTarget,
    bundle.session.projectId,
    bundle.session.selectedEditLevel,
    currentUserInstruction,
    editBrief.contentDigestSha256,
    editBrief.revisionNumber,
    editBrief.sourceMediaAssetId,
    editBrief.sourceStorageObjectRecordId,
    effectiveWorkspaceId,
    editReferenceId,
  ])

  const acceptPackage = useCallback((
    packageRecord: TargetVideoUnderstandingPackage,
    schedule: TargetVideoUnderstandingSchedule,
  ) => {
    const authorityMismatches = packageAuthorityMismatchLabels({
      packageRecord,
      bundle,
      currentUserInstruction,
      editBrief,
      editReferenceId,
      workspaceId: effectiveWorkspaceId,
    })
    if (authorityMismatches.length > 0) {
      setLifecycle({
        kind: 'error',
        message: `The saved study belongs to an earlier project, Edit Brief, instruction, or output frame (${authorityMismatches.join(', ')} changed). Refresh this edit before studying again.`,
      })
      clearAcceptedPackage()
      return
    }
    setLifecycle({ kind: 'package', package: packageRecord, schedule })
    onPackageChangeRef.current?.(packageRecord)
  }, [
    bundle,
    clearAcceptedPackage,
    currentUserInstruction,
    editBrief,
    effectiveWorkspaceId,
    editReferenceId,
  ])

  const readLatest = useCallback(async (showChecking = false) => {
    const epoch = ++requestEpoch.current
    if (showChecking) setLifecycle({ kind: 'checking' })
    let result
    try {
      result = await readTargetVideoUnderstandingForProjectEditSession({
        bundle,
        editBrief,
        editReferenceClient,
        editReferenceId,
        workspaceId: effectiveWorkspaceId,
      })
    } catch (error) {
      if (epoch !== requestEpoch.current) return
      setLifecycle({ kind: 'error', message: safeTargetVideoStudyError(errorMessage(error)) })
      clearAcceptedPackage()
      return
    }
    if (epoch !== requestEpoch.current) return
    if (!result.ok) {
      if (result.notFound) {
        setLifecycle({ kind: 'not_started' })
        clearAcceptedPackage()
        return
      }
      setLifecycle({ kind: 'error', message: safeTargetVideoStudyError(result.message) })
      clearAcceptedPackage()
      return
    }
    acceptPackage(result.package, result.schedule)
  }, [acceptPackage, bundle, clearAcceptedPackage, editBrief, editReferenceClient, editReferenceId, effectiveWorkspaceId])

  useEffect(() => {
    deliveredReadyDigest.current = undefined
    const timeoutId = window.setTimeout(() => {
      setBusy(false)
      void readLatest(true)
    }, 0)
    return () => {
      requestEpoch.current += 1
      window.clearTimeout(timeoutId)
    }
  }, [authorityKey, readLatest])

  const packageRecord = lifecycle.kind === 'package' ? lifecycle.package : undefined
  const packageSchedule = lifecycle.kind === 'package' ? lifecycle.schedule : undefined
  useEffect(() => {
    if (!packageRecord || !isTargetVideoUnderstandingReadyForUi(packageRecord)) return
    if (deliveredReadyDigest.current === packageRecord.packageDigestSha256) return
    deliveredReadyDigest.current = packageRecord.packageDigestSha256
    onReadyRef.current?.(packageRecord)
  }, [packageRecord])

  useEffect(() => {
    if (
      !packageRecord
      || !packageSchedule
      || !shouldPollTargetVideoUnderstandingForUi(packageRecord, packageSchedule)
    ) return

    const delay = document.visibilityState === 'visible' ? 3_500 : 15_000
    const timeoutId = window.setTimeout(() => void readLatest(false), delay)
    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [packageRecord, packageSchedule, readLatest])

  const startStudy = useCallback(async () => {
    if (busy || disabled) return
    const epoch = ++requestEpoch.current
    setBusy(true)
    setLifecycle({ kind: 'starting' })
    let result
    try {
      result = await startTargetVideoUnderstandingForProjectEditSession({
        bundle,
        currentUserInstruction: currentUserInstruction.trim(),
        editBrief,
        editReferenceClient,
        editReferenceId,
        workspaceId: effectiveWorkspaceId,
      })
    } catch (error) {
      if (epoch !== requestEpoch.current) return
      setBusy(false)
      setLifecycle({ kind: 'error', message: safeTargetVideoStudyError(errorMessage(error)) })
      clearAcceptedPackage()
      return
    }
    if (epoch !== requestEpoch.current) return
    setBusy(false)
    if (!result.ok) {
      setLifecycle({ kind: 'error', message: safeTargetVideoStudyError(result.message) })
      clearAcceptedPackage()
      return
    }
    acceptPackage(result.package, result.schedule)
  }, [
    acceptPackage,
    bundle,
    busy,
    clearAcceptedPackage,
    currentUserInstruction,
    disabled,
    editBrief,
    editReferenceClient,
    editReferenceId,
    effectiveWorkspaceId,
  ])

  return (
    <EditReferenceTargetStudyStatus
      disabled={disabled || busy}
      lifecycle={lifecycle}
      onRetry={() => void readLatest(true)}
      onStart={() => void startStudy()}
      referenceName={referenceName}
    />
  )
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unexpected target-video study error.'
}

function packageAuthorityMismatchLabels(input: {
  bundle: ProjectEditSessionBundleRecord
  currentUserInstruction: string
  editBrief: ProjectEditBriefBackendLocalRecord
  editReferenceId: string
  packageRecord: TargetVideoUnderstandingPackage
  workspaceId: string
}): string[] {
  if (input.bundle.session.aspectRatio === 'custom') return ['output frame']
  const targetContext = createPreferenceApplicationTargetContext({
    bundle: input.bundle,
    currentUserInstruction: input.currentUserInstruction,
    outputFrameConfirmed: true,
  })
  const mismatches: string[] = []
  const record = input.packageRecord
  const declared = record.declaredContext
  if (record.workspaceId !== input.workspaceId) mismatches.push('workspace')
  if (record.projectId !== input.bundle.session.projectId) mismatches.push('project')
  if (record.editSessionId !== input.bundle.session.id) mismatches.push('edit')
  if (record.editReferenceId !== input.editReferenceId) mismatches.push('Edit Reference')
  if (
    record.source.storageObjectRecordId !== input.editBrief.sourceStorageObjectRecordId
    || record.source.mediaAssetId !== input.editBrief.sourceMediaAssetId
  ) mismatches.push('source media')
  if (
    declared.editBriefId !== input.editBrief.id
    || declared.editBriefRevision !== input.editBrief.revisionNumber
    || declared.editBriefDigestSha256 !== input.editBrief.contentDigestSha256
  ) mismatches.push('Edit Brief')
  if (declared.projectName !== targetContext.projectName) mismatches.push('project name')
  if (declared.editName !== targetContext.editName) mismatches.push('edit name')
  if (declared.currentUserInstruction !== targetContext.currentUserInstruction) mismatches.push('instruction')
  if (declared.selectedEditLevel !== targetContext.selectedEditLevel) mismatches.push('edit level')
  if (
    declared.aspectRatio !== targetContext.aspectRatio
    || declared.outputFrameConfirmed !== true
  ) mismatches.push('output frame')
  if (declared.platformTarget !== targetContext.platformTarget) mismatches.push('platform')
  if (declared.contentType !== targetContext.contentType) mismatches.push('content type')
  if (declared.storyRole !== targetContext.storyRole) mismatches.push('story role')
  if (declared.budgetPreference !== targetContext.budgetPreference) mismatches.push('budget')
  if (stableEditReferenceJson(declared.directives) !== stableEditReferenceJson(targetContext.directives)) {
    mismatches.push('directives')
  }
  if (
    stableEditReferenceJson(declared.approvedConstraints)
    !== stableEditReferenceJson(targetContext.approvedConstraints)
  ) mismatches.push('approved constraints')
  return mismatches
}
