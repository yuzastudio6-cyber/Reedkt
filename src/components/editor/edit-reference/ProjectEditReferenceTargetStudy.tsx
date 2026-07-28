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

  const acceptPackage = useCallback((packageRecord: TargetVideoUnderstandingPackage) => {
    if (!packageMatchesCurrentAuthority({
      packageRecord,
      bundle,
      currentUserInstruction,
      editBrief,
      editReferenceId,
      workspaceId: effectiveWorkspaceId,
    })) {
      setLifecycle({
        kind: 'error',
        message: 'The saved study belongs to an earlier project, Edit Brief, instruction, or output frame. Refresh this edit before studying again.',
      })
      clearAcceptedPackage()
      return
    }
    setLifecycle({ kind: 'package', package: packageRecord })
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
    acceptPackage(result.package)
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
  useEffect(() => {
    if (!packageRecord || !isTargetVideoUnderstandingReadyForUi(packageRecord)) return
    if (deliveredReadyDigest.current === packageRecord.packageDigestSha256) return
    deliveredReadyDigest.current = packageRecord.packageDigestSha256
    onReadyRef.current?.(packageRecord)
  }, [packageRecord])

  useEffect(() => {
    if (
      !packageRecord
      || !shouldPollTargetVideoUnderstandingForUi(packageRecord)
    ) return

    const delay = document.visibilityState === 'visible' ? 3_500 : 15_000
    const timeoutId = window.setTimeout(() => void readLatest(false), delay)
    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [packageRecord, readLatest])

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
    acceptPackage(result.package)
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

function packageMatchesCurrentAuthority(input: {
  bundle: ProjectEditSessionBundleRecord
  currentUserInstruction: string
  editBrief: ProjectEditBriefBackendLocalRecord
  editReferenceId: string
  packageRecord: TargetVideoUnderstandingPackage
  workspaceId: string
}): boolean {
  if (input.bundle.session.aspectRatio === 'custom') return false
  const targetContext = createPreferenceApplicationTargetContext({
    bundle: input.bundle,
    currentUserInstruction: input.currentUserInstruction,
    outputFrameConfirmed: true,
  })
  return input.packageRecord.workspaceId === input.workspaceId
    && input.packageRecord.projectId === input.bundle.session.projectId
    && input.packageRecord.editSessionId === input.bundle.session.id
    && input.packageRecord.editReferenceId === input.editReferenceId
    && input.packageRecord.source.storageObjectRecordId === input.editBrief.sourceStorageObjectRecordId
    && input.packageRecord.source.mediaAssetId === input.editBrief.sourceMediaAssetId
    && input.packageRecord.declaredContext.editBriefId === input.editBrief.id
    && input.packageRecord.declaredContext.editBriefRevision === input.editBrief.revisionNumber
    && input.packageRecord.declaredContext.editBriefDigestSha256 === input.editBrief.contentDigestSha256
    && input.packageRecord.declaredContext.projectName === targetContext.projectName
    && input.packageRecord.declaredContext.editName === targetContext.editName
    && input.packageRecord.declaredContext.currentUserInstruction === targetContext.currentUserInstruction
    && input.packageRecord.declaredContext.selectedEditLevel === targetContext.selectedEditLevel
    && input.packageRecord.declaredContext.aspectRatio === targetContext.aspectRatio
    && input.packageRecord.declaredContext.outputFrameConfirmed === true
    && input.packageRecord.declaredContext.platformTarget === targetContext.platformTarget
    && input.packageRecord.declaredContext.contentType === targetContext.contentType
    && input.packageRecord.declaredContext.storyRole === targetContext.storyRole
    && input.packageRecord.declaredContext.budgetPreference === targetContext.budgetPreference
    && stableEditReferenceJson(input.packageRecord.declaredContext.directives) === stableEditReferenceJson(targetContext.directives)
    && stableEditReferenceJson(input.packageRecord.declaredContext.approvedConstraints) === stableEditReferenceJson(targetContext.approvedConstraints)
}
