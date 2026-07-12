import { useEffect, useMemo, useRef, useState } from 'react'
import { MessageSquareText } from 'lucide-react'
import { Badge } from '../../Badge'
import { Button } from '../../Button'
import { Card } from '../../Card'
import { ProjectEditPlanApprovalCard } from '../ProjectEditPlanApprovalCard'
import { ProjectEditLifecycleStatusCard } from '../ProjectEditLifecycleStatusCard'
import {
  createProjectEditBriefBackendLocalConfig,
  readProjectEditBriefBackendLocal,
  saveProjectEditBriefBackendLocal,
  type ProjectEditBriefBackendLocalRecord,
} from '../../../lib/project-edit-brief-backend-local'
import {
  recordProjectEditSessionLifecycleCheckpointBackendLocal,
  type ProjectEditSessionBackendLocalRecord,
  type ProjectEditSessionLifecycleCheckpointKind,
} from '../../../lib/project-edit-session-backend-local'
import {
  approveProjectEditPlanBackendLocal,
  readProjectEditPlanBackendLocal,
} from '../../../lib/project-edit-plan-backend-local'
import { buildProjectEditPlanApprovalModel } from '../../../lib/project-edit-plan-approval'
import { resolveProjectEditPlanDirection } from '../../../lib/project-edit-skill-aware-plan'
import { buildProjectEditLifecycleModel } from '../../../lib/project-edit-lifecycle'
import {
  finalExportMatchesCurrentEvidence,
  previewResultMatchesApprovedEvidence,
  previewReviewMatchesPreview,
  professionalQAMatchesCurrentEvidence,
} from '../../../lib/project-edit-evidence-lineage'
import {
  createProjectSourceVideoBackendUploadConfig,
  uploadProjectSourceVideoToBackend,
} from '../../../lib/project-source-video-backend-upload'
import {
  loadProjectSourceVideoLocalArtifactForReview,
  revokeProjectSourceVideoLocalArtifactReviewObject,
  type ProjectSourceVideoLocalArtifactReviewObject,
} from '../../../lib/project-source-video-local-artifact-review'
import {
  createProjectSourceVideoLocalEditPreviewConfig,
} from '../../../lib/project-source-video-local-edit-preview-smoke'
import {
  createProjectSourceVideoLocalPreviewFromFile,
  revokeProjectSourceVideoLocalPreview,
} from '../../../lib/project-source-video-local-preview'
import {
  createProjectSourceVideoMetadataSummary,
  formatProjectSourceVideoDuration,
  inferProjectSourceVideoAspectRatio,
} from '../../../lib/project-source-video-metadata-mappers'
import type {
  ProjectEditPlanApprovalModel,
  ProjectEditPlanBackendApprovalResult,
} from '../../../lib/project-edit-plan-approval'
import {
  createBriefSavedCheckpointMetadata,
  createBriefDraftChangedCheckpointMetadata,
  createFinalExportReadyCheckpointMetadata,
  createPlanApprovedCheckpointMetadata,
  createProfessionalQACheckpointMetadata,
  createPreviewReadyCheckpointMetadata,
  createPreviewReviewedCheckpointMetadata,
  createRestoredApprovedLocalPlan,
  createSourceUploadCheckpointMetadata,
  restoreBackendLocalApprovedPlanId,
  restoreBackendUploadResult,
  restoreFinalExportResult,
  restoreProfessionalQAResult,
  restorePreviewResult,
  restorePreviewReviewResult,
} from '../../../lib/project-edit-session-lifecycle-checkpoint-ui-adapter'
import type {
  ProjectSourceVideoBackendUploadResult,
  ProjectSourceVideoBackendUploadStatus,
  ProjectSourceVideoLocalEditPreviewResult,
  ProjectSourceVideoLocalFinalExportResult,
  ProjectSourceVideoLocalPreview,
  ProjectSourceVideoMetadataUpdate,
  ProjectSourceVideoPreviewReviewResult,
  ProjectSourceVideoProfessionalQAResult,
} from '../../../types/project-source-video'
import type { ProjectEditBriefVideoShellModel } from '../../../lib/project-edit-brief-ui-adapter'
import type {
  ProjectEditSessionApprovalStatus,
  ProjectEditSessionStatus,
} from '../../../types/project-edit-session'
import { ProjectEditBriefLocalPreviewSmokeCard } from './ProjectEditBriefLocalPreviewSmokeCard'
import { ProjectEditBriefFinalExportCard } from './ProjectEditBriefFinalExportCard'
import { ProjectEditBriefPreviewReviewCard } from './ProjectEditBriefPreviewReviewCard'
import { ProjectEditBriefProfessionalQACard } from './ProjectEditBriefProfessionalQACard'
import { ProjectEditBriefSourceVideoPicker } from './ProjectEditBriefSourceVideoPicker'
import { ProjectEditBriefSourceVideoSummary } from './ProjectEditBriefSourceVideoSummary'
import { ProjectEditBriefVideoShell } from './ProjectEditBriefVideoShell'

type ProjectEditBriefWorkspaceProps = {
  backendLocalEditSession?: ProjectEditSessionBackendLocalRecord
  editSessionId: string
  editSessionTitle?: string
  projectId: string
}

type EditWorkspaceFlowStep = {
  id: 'source' | 'brief' | 'plan' | 'preview' | 'review' | 'quality' | 'export'
  label: string
  status: 'complete' | 'current' | 'locked' | 'optional'
  summary: string
}

type MainPlaybackMode = 'source' | 'preview' | 'final_export'

function buildEditWorkspaceFlowSteps(input: {
  sourceUploaded: boolean
  briefSaved: boolean
  planApproved: boolean
  previewReady: boolean
  previewReviewed: boolean
  qualityPassed: boolean
  exportReady: boolean
}): EditWorkspaceFlowStep[] {
  const definitions: Array<Omit<EditWorkspaceFlowStep, 'status'> & { blocksNext: boolean; complete: boolean }> = [
    {
      id: 'source',
      label: 'Source',
      blocksNext: true,
      complete: input.sourceUploaded,
      summary: input.sourceUploaded ? 'Video is attached to this edit.' : 'Upload the video for this edit.',
    },
    {
      id: 'brief',
      label: 'Direction',
      blocksNext: false,
      complete: input.briefSaved,
      summary: input.briefSaved ? 'Optional direction is saved.' : 'Optional: add direction, or continue with a clean professional plan.',
    },
    {
      id: 'plan',
      label: 'Plan',
      blocksNext: true,
      complete: input.planApproved,
      summary: input.planApproved ? 'Plan and credits are approved.' : 'Approve the plan before preview creation.',
    },
    {
      id: 'preview',
      label: 'Preview',
      blocksNext: true,
      complete: input.previewReady,
      summary: input.previewReady ? 'A private preview is ready.' : 'Create a private preview for review.',
    },
    {
      id: 'review',
      label: 'Review',
      blocksNext: true,
      complete: input.previewReviewed,
      summary: input.previewReviewed ? 'Preview review is approved.' : 'Approve the preview or request changes.',
    },
    {
      id: 'quality',
      label: 'Quality check',
      blocksNext: true,
      complete: input.qualityPassed,
      summary: input.qualityPassed ? 'Quality gate passed.' : 'Confirm the approved preview is ready to export.',
    },
    {
      id: 'export',
      label: 'Private export',
      blocksNext: true,
      complete: input.exportReady,
      summary: input.exportReady ? 'Private export is ready.' : 'Create the private final test export.',
    },
  ]
  const firstIncompleteIndex = definitions.findIndex((step) => !step.complete && step.blocksNext)

  return definitions.map((step, index) => ({
    id: step.id,
    label: step.label,
    summary: step.summary,
    status: step.complete
      ? 'complete'
      : !step.blocksNext && input.sourceUploaded
        ? 'optional'
        : index === firstIncompleteIndex
          ? 'current'
          : 'locked',
  }))
}

export function ProjectEditBriefWorkspace({
  backendLocalEditSession,
  editSessionId,
  editSessionTitle,
  projectId,
}: ProjectEditBriefWorkspaceProps) {
  const briefConfig = useMemo(() => createProjectEditBriefBackendLocalConfig(import.meta.env), [])
  const backendUploadConfig = useMemo(() => createProjectSourceVideoBackendUploadConfig(import.meta.env), [])
  const localPreviewConfig = useMemo(() => createProjectSourceVideoLocalEditPreviewConfig(import.meta.env), [])
  const [sourceFile, setSourceFile] = useState<File | undefined>()
  const [sourceVideo, setSourceVideo] = useState<ProjectSourceVideoLocalPreview | undefined>()
  const [backendUploadStatus, setBackendUploadStatus] = useState<ProjectSourceVideoBackendUploadStatus>(() => backendUploadConfig.available ? 'idle' : 'unavailable')
  const [backendUploadResult, setBackendUploadResult] = useState<ProjectSourceVideoBackendUploadResult | undefined>()
  const [backendUploadError, setBackendUploadError] = useState<string | undefined>()
  const [localPreviewResult, setLocalPreviewResult] = useState<ProjectSourceVideoLocalEditPreviewResult | undefined>()
  const [localFinalExportResult, setLocalFinalExportResult] = useState<ProjectSourceVideoLocalFinalExportResult | undefined>()
  const [mainPlaybackMode, setMainPlaybackMode] = useState<MainPlaybackMode>('source')
  const [mainReviewArtifact, setMainReviewArtifact] = useState<ProjectSourceVideoLocalArtifactReviewObject | undefined>()
  const [mainReviewArtifactLoading, setMainReviewArtifactLoading] = useState(false)
  const [mainReviewArtifactError, setMainReviewArtifactError] = useState<string | undefined>()
  const [playing, setPlaying] = useState(false)
  const [playheadSeconds, setPlayheadSeconds] = useState(0)
  const [briefText, setBriefText] = useState('')
  const [briefSaved, setBriefSaved] = useState(false)
  const [briefSaveStatus, setBriefSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'failed'>(briefConfig.available ? 'idle' : 'failed')
  const [briefSaveError, setBriefSaveError] = useState<string | undefined>(briefConfig.available ? undefined : briefConfig.message)
  const [backendSavedBrief, setBackendSavedBrief] = useState<ProjectEditBriefBackendLocalRecord | undefined>()
  const [planApproved, setPlanApproved] = useState(false)
  const [planApprovalStatus, setPlanApprovalStatus] = useState<'idle' | 'approving' | 'approved' | 'failed'>('idle')
  const [planApprovalError, setPlanApprovalError] = useState<string | undefined>()
  const [backendApprovedLocalPlan, setBackendApprovedLocalPlan] = useState<ProjectEditPlanBackendApprovalResult | undefined>()
  const [previewReviewResult, setPreviewReviewResult] = useState<ProjectSourceVideoPreviewReviewResult | undefined>()
  const [professionalQAResult, setProfessionalQAResult] = useState<ProjectSourceVideoProfessionalQAResult | undefined>()
  const [statusMessage, setStatusMessage] = useState('Ready for source video and brief notes.')
  const sourceVideoRef = useRef<ProjectSourceVideoLocalPreview | undefined>(undefined)
  const briefDraftResetPersistedRef = useRef(false)

  useEffect(() => {
    sourceVideoRef.current = sourceVideo
  }, [sourceVideo])

  useEffect(() => () => {
    revokeProjectSourceVideoLocalPreview(sourceVideoRef.current)
  }, [])

  useEffect(() => () => {
    revokeProjectSourceVideoLocalArtifactReviewObject(mainReviewArtifact)
  }, [mainReviewArtifact])

  const sourceSummary = useMemo(() => createProjectSourceVideoMetadataSummary(sourceVideo), [sourceVideo])
  const sourceEvidenceAvailable = Boolean(sourceVideo || backendUploadResult)
  const outputFrameConfirmed = backendLocalEditSession?.metadata?.outputFrameConfirmed === true
  const videoShell = useMemo<ProjectEditBriefVideoShellModel>(() => ({
    durationSeconds: sourceVideo?.durationSeconds ?? 60,
    currentTimeSeconds: playheadSeconds,
    currentTimeLabel: formatProjectSourceVideoDuration(playheadSeconds),
    durationLabel: formatProjectSourceVideoDuration(sourceVideo?.durationSeconds),
    aspectLabel: sourceVideo?.inferredAspectRatio ?? 'Metadata pending',
    title: sourceVideo?.fileName ?? backendUploadResult?.fileName ?? 'Source video',
    mockPosterLabel: 'Select a source video',
  }), [backendUploadResult, playheadSeconds, sourceVideo])
  const planApprovalModel = useMemo(() => buildProjectEditPlanApprovalModel({
    approved: planApproved,
    backendUploadResult,
    briefSaved: Boolean(backendSavedBrief?.readbackVerified) && briefSaved,
    briefText: backendSavedBrief?.briefText ?? briefText,
    editSessionId,
    outputAspectRatio: backendLocalEditSession?.aspectRatio,
    outputFrameConfirmed,
    outputFrameConfirmationSource: 'edit_session_metadata',
    outputPlatformTarget: backendLocalEditSession?.platformTarget,
    projectId,
    sourceAspectRatio: sourceVideo?.inferredAspectRatio,
    sourceDurationSeconds: sourceVideo?.durationSeconds,
    sourceFileName: sourceVideo?.fileName ?? backendUploadResult?.fileName,
  }), [backendLocalEditSession, backendSavedBrief, backendUploadResult, briefSaved, briefText, editSessionId, outputFrameConfirmed, planApproved, projectId, sourceVideo])
  const visiblePlanApprovalModel = useMemo<ProjectEditPlanApprovalModel>(() => {
    const approvedLocalPlan = backendApprovedLocalPlan?.localEditPlan.approvedLocalPlan
    if (!approvedLocalPlan || !backendApprovedLocalPlan.localEditPlan.readbackVerified) return planApprovalModel
    return {
      ...planApprovalModel,
      approved: true,
      blockers: [],
      canApprove: true,
      creditEstimate: approvedLocalPlan.creditEstimate,
      directionSource: approvedLocalPlan.directionSource,
      operationManifest: approvedLocalPlan.operationManifest,
      planId: approvedLocalPlan.planId,
      skillPlan: approvedLocalPlan.skillPlan,
      status: 'approved',
      steps: approvedLocalPlan.steps,
      summary: approvedLocalPlan.summary,
      title: approvedLocalPlan.title,
    }
  }, [backendApprovedLocalPlan, planApprovalModel])
  const currentPreviewResult = useMemo(() => previewResultMatchesApprovedEvidence({
    approvedLocalPlan: backendApprovedLocalPlan?.localEditPlan.approvedLocalPlan,
    previewResult: localPreviewResult,
    sourceStorageObjectRecordId: backendUploadResult?.storageObjectRecordId,
  }) ? localPreviewResult : undefined, [backendApprovedLocalPlan, backendUploadResult, localPreviewResult])
  const currentPreviewReviewResult = useMemo(() => previewReviewMatchesPreview({
    previewResult: currentPreviewResult,
    previewReviewResult,
  }) ? previewReviewResult : undefined, [currentPreviewResult, previewReviewResult])
  const currentProfessionalQAResult = useMemo(() => professionalQAMatchesCurrentEvidence({
    previewResult: currentPreviewResult,
    previewReviewResult: currentPreviewReviewResult,
    professionalQAResult,
    sourceStorageObjectRecordId: backendUploadResult?.storageObjectRecordId,
  }) ? professionalQAResult : undefined, [backendUploadResult, currentPreviewResult, currentPreviewReviewResult, professionalQAResult])
  const currentFinalExportResult = useMemo(() => finalExportMatchesCurrentEvidence({
    finalExportResult: localFinalExportResult,
    previewResult: currentPreviewResult,
    previewReviewResult: currentPreviewReviewResult,
    professionalQAResult: currentProfessionalQAResult,
    sourceStorageObjectRecordId: backendUploadResult?.storageObjectRecordId,
  }) ? localFinalExportResult : undefined, [backendUploadResult, currentPreviewResult, currentPreviewReviewResult, currentProfessionalQAResult, localFinalExportResult])
  const selectedMainReviewStorageObjectId = mainPlaybackMode === 'preview'
    ? currentPreviewResult?.previewStorageObjectId
    : mainPlaybackMode === 'final_export'
      ? currentFinalExportResult?.finalExportStorageObjectId
      : undefined
  const selectedMainReviewArtifact = mainReviewArtifact?.storageObjectRecordId === selectedMainReviewStorageObjectId
    ? mainReviewArtifact
    : undefined
  const primaryVideoShell = useMemo<ProjectEditBriefVideoShellModel>(() => {
    if (mainPlaybackMode === 'preview' && currentPreviewResult) {
      return {
        durationSeconds: currentPreviewResult.durationSeconds ?? 0,
        currentTimeSeconds: playheadSeconds,
        currentTimeLabel: formatProjectSourceVideoDuration(playheadSeconds),
        durationLabel: formatProjectSourceVideoDuration(currentPreviewResult.durationSeconds),
        aspectLabel: currentPreviewResult.editAssembly?.outputFrame?.aspectRatio ?? 'Private preview',
        title: 'Private preview',
        mockPosterLabel: mainReviewArtifactLoading ? 'Loading private preview' : 'Private preview is ready to load',
      }
    }
    if (mainPlaybackMode === 'final_export' && currentFinalExportResult) {
      return {
        durationSeconds: currentFinalExportResult.durationSeconds ?? 0,
        currentTimeSeconds: playheadSeconds,
        currentTimeLabel: formatProjectSourceVideoDuration(playheadSeconds),
        durationLabel: formatProjectSourceVideoDuration(currentFinalExportResult.durationSeconds),
        aspectLabel: currentFinalExportResult.editAssembly?.outputFrame?.aspectRatio ?? 'Private export',
        title: 'Private final export',
        mockPosterLabel: mainReviewArtifactLoading ? 'Loading private final export' : 'Private final export is ready to load',
      }
    }
    return videoShell
  }, [currentFinalExportResult, currentPreviewResult, mainPlaybackMode, mainReviewArtifactLoading, playheadSeconds, videoShell])
  const primaryPlaybackNotice = mainPlaybackMode === 'source'
    ? 'Source playback only. No generated output is shown.'
    : mainPlaybackMode === 'preview'
      ? 'Private preview playback. No public delivery or signed URL.'
      : 'Private final export playback. No public delivery or signed URL.'
  const primaryPlaybackLabel = mainPlaybackMode === 'preview'
    ? 'Private preview'
    : mainPlaybackMode === 'final_export'
      ? 'Private final export'
      : undefined
  const lifecycle = useMemo(() => buildProjectEditLifecycleModel({
    backendUploadAvailable: backendUploadConfig.available,
    backendUploadResult,
    backendUploadStatus,
    briefSaved: Boolean(backendSavedBrief?.readbackVerified) && briefSaved,
    editSessionId,
    hasLocalSourceVideo: sourceEvidenceAvailable,
    localFinalExportResult: currentFinalExportResult,
    localPreviewResult: currentPreviewResult,
    planApproved: visiblePlanApprovalModel.approved,
    planReady: visiblePlanApprovalModel.canApprove || visiblePlanApprovalModel.approved,
    previewReviewResult: currentPreviewReviewResult,
    projectId,
    finalExportEvidence: {
      professionalQaPassed: currentProfessionalQAResult?.status === 'passed',
      requiredAssetsReady: currentProfessionalQAResult?.status === 'passed',
      artifactManifestReady: Boolean(currentFinalExportResult),
      finalRenderWorkerReady: Boolean(currentFinalExportResult),
      exportDeliveryPolicyReady: Boolean(currentFinalExportResult),
    },
  }), [backendSavedBrief, backendUploadConfig.available, backendUploadResult, backendUploadStatus, briefSaved, currentFinalExportResult, currentPreviewResult, currentPreviewReviewResult, currentProfessionalQAResult, editSessionId, projectId, sourceEvidenceAvailable, visiblePlanApprovalModel.approved, visiblePlanApprovalModel.canApprove])
  const editFlowSteps = useMemo(() => buildEditWorkspaceFlowSteps({
    sourceUploaded: Boolean(backendUploadResult),
    briefSaved: Boolean(backendSavedBrief?.readbackVerified) && briefSaved,
    planApproved: Boolean(backendApprovedLocalPlan?.localEditPlan.readbackVerified),
    previewReady: Boolean(currentPreviewResult),
    previewReviewed: currentPreviewReviewResult?.reviewStatus === 'approved',
    qualityPassed: currentProfessionalQAResult?.status === 'passed',
    exportReady: Boolean(currentFinalExportResult),
  }), [backendApprovedLocalPlan, backendSavedBrief, backendUploadResult, briefSaved, currentFinalExportResult, currentPreviewResult, currentPreviewReviewResult, currentProfessionalQAResult])
  const currentFlowStep = editFlowSteps.find((step) => step.status === 'current') ?? editFlowSteps[editFlowSteps.length - 1]

  useEffect(() => {
    let cancelled = false
    if (!backendLocalEditSession) return

    Promise.resolve().then(() => {
      if (cancelled) return
      const restoredUpload = restoreBackendUploadResult(backendLocalEditSession)
      const restoredPreview = restorePreviewResult(backendLocalEditSession)
      const restoredReview = restorePreviewReviewResult(backendLocalEditSession)
      const restoredProfessionalQA = restoreProfessionalQAResult(backendLocalEditSession)
      const restoredFinalExport = restoreFinalExportResult(backendLocalEditSession)

      if (restoredUpload) {
        setBackendUploadResult(restoredUpload)
        setBackendUploadStatus('uploaded')
      }
      if (restoredPreview) setLocalPreviewResult(restoredPreview)
      if (restoredReview) setPreviewReviewResult(restoredReview)
      if (restoredProfessionalQA) setProfessionalQAResult(restoredProfessionalQA)
      if (restoredFinalExport) {
        setLocalFinalExportResult(restoredFinalExport)
        setProfessionalQAResult(restoredFinalExport.professionalQA ?? restoredProfessionalQA)
      }
      if (restoredUpload || restoredPreview || restoredReview || restoredProfessionalQA || restoredFinalExport) {
        setStatusMessage('Backend-local edit progress restored from the edit-session lifecycle checkpoints.')
      }
    })

    return () => {
      cancelled = true
    }
  }, [backendLocalEditSession])

  useEffect(() => {
    let cancelled = false
    if (!briefConfig.available || !briefConfig.apiBaseUrl) return

    readProjectEditBriefBackendLocal({
      apiBaseUrl: briefConfig.apiBaseUrl,
      editSessionId,
      projectId,
      workspaceId: briefConfig.workspaceId,
    }).then((result) => {
      if (cancelled) return
      setBackendSavedBrief(result.editBrief)
      setBriefText(result.editBrief.briefText)
      setBriefSaved(true)
      setBriefSaveStatus('saved')
      setBriefSaveError(undefined)
      setStatusMessage('Backend-local brief restored from saved readback.')
    }).catch(() => {
      // A new edit will not have a saved backend-local brief yet.
    })

    return () => {
      cancelled = true
    }
  }, [briefConfig.apiBaseUrl, briefConfig.available, briefConfig.workspaceId, editSessionId, projectId])

  useEffect(() => {
    let cancelled = false
    if (!backendLocalEditSession || !backendUploadResult || backendApprovedLocalPlan) return

    Promise.resolve().then(async () => {
      if (cancelled) return
      const restoredPlanId = restoreBackendLocalApprovedPlanId(backendLocalEditSession)
      if (restoredPlanId && backendUploadConfig.apiBaseUrl) {
        try {
          const restoredApprovedPlan = await readProjectEditPlanBackendLocal({
            apiBaseUrl: backendUploadConfig.apiBaseUrl,
            editPlanId: restoredPlanId,
            workspaceId: backendUploadConfig.workspaceId,
          })
          if (cancelled) return
          if (restoredApprovedPlan.localEditPlan.source.storageObjectRecordId === backendUploadResult.storageObjectRecordId) {
            setBackendApprovedLocalPlan(restoredApprovedPlan)
            setPlanApproved(true)
            setPlanApprovalStatus('approved')
            setPlanApprovalError(undefined)
            setStatusMessage('Backend-local approved plan restored from stored plan readback.')
            return
          }
        } catch {
          // Fall back to checkpoint-only restoration for older local sessions.
        }
      }

      const restoredPlanModel = buildProjectEditPlanApprovalModel({
        approved: true,
        backendUploadResult,
        briefSaved: backendSavedBrief?.readbackVerified === true,
        briefText: backendSavedBrief?.briefText ?? '',
        editSessionId,
        outputAspectRatio: backendLocalEditSession.aspectRatio,
        outputFrameConfirmed: backendLocalEditSession.metadata?.outputFrameConfirmed === true,
        outputFrameConfirmationSource: 'edit_session_metadata',
        outputPlatformTarget: backendLocalEditSession.platformTarget,
        projectId,
        sourceAspectRatio: sourceVideo?.inferredAspectRatio,
        sourceDurationSeconds: sourceVideo?.durationSeconds,
        sourceFileName: sourceVideo?.fileName ?? backendUploadResult.fileName,
      })
      const restoredPlan = createRestoredApprovedLocalPlan({
        approvedPlan: restoredPlanModel,
        sourceVideoUploadResult: backendUploadResult,
        session: backendLocalEditSession,
      })
      if (!restoredPlan) return
      setBackendApprovedLocalPlan(restoredPlan)
      setPlanApproved(true)
      setPlanApprovalStatus('approved')
      setPlanApprovalError(undefined)
      setStatusMessage('Backend-local approved plan restored from the edit-session lifecycle checkpoints.')
    })

    return () => {
      cancelled = true
    }
  }, [backendApprovedLocalPlan, backendLocalEditSession, backendSavedBrief, backendUploadConfig.apiBaseUrl, backendUploadConfig.workspaceId, backendUploadResult, editSessionId, projectId, sourceVideo])

  function resetLocalEditProgress(message: string) {
    briefDraftResetPersistedRef.current = false
    setMainPlaybackMode('source')
    setMainReviewArtifact(undefined)
    setMainReviewArtifactLoading(false)
    setMainReviewArtifactError(undefined)
    setBackendUploadResult(undefined)
    setBackendUploadError(undefined)
    setLocalPreviewResult(undefined)
    setLocalFinalExportResult(undefined)
    setPlanApproved(false)
    setPlanApprovalStatus('idle')
    setPlanApprovalError(undefined)
    setBackendApprovedLocalPlan(undefined)
    setPreviewReviewResult(undefined)
    setProfessionalQAResult(undefined)
    setBackendUploadStatus(backendUploadConfig.available ? 'idle' : 'unavailable')
    setPlayheadSeconds(0)
    setPlaying(false)
    setBriefSaved(false)
    setBackendSavedBrief(undefined)
    setBriefSaveStatus(briefConfig.available ? 'idle' : 'failed')
    setBriefSaveError(briefConfig.available ? undefined : briefConfig.message)
    setStatusMessage(message)
  }

  async function selectMainPlaybackMode(mode: MainPlaybackMode, storageObjectRecordId?: string) {
    setMainPlaybackMode(mode)
    setPlaying(false)
    setPlayheadSeconds(0)
    setMainReviewArtifactError(undefined)

    if (mode === 'source') {
      setMainReviewArtifact(undefined)
      setMainReviewArtifactLoading(false)
      return
    }

    const apiBaseUrl = localPreviewConfig.apiBaseUrl ?? backendUploadConfig.apiBaseUrl ?? briefConfig.apiBaseUrl
    const targetStorageObjectRecordId = storageObjectRecordId ?? (
      mode === 'preview'
        ? currentPreviewResult?.previewStorageObjectId
        : currentFinalExportResult?.finalExportStorageObjectId
    )

    if (!apiBaseUrl || !targetStorageObjectRecordId) {
      setMainReviewArtifact(undefined)
      setMainReviewArtifactLoading(false)
      setMainReviewArtifactError(mode === 'preview'
        ? 'Private preview is not ready for the main player yet.'
        : 'Private final export is not ready for the main player yet.')
      return
    }

    if (mainReviewArtifact?.storageObjectRecordId === targetStorageObjectRecordId) return

    setMainReviewArtifactLoading(true)
    try {
      const artifact = await loadProjectSourceVideoLocalArtifactForReview({
        apiBaseUrl,
        storageObjectRecordId: targetStorageObjectRecordId,
        workspaceId: backendUploadConfig.workspaceId,
      })
      setMainReviewArtifact(artifact)
    } catch (caught) {
      setMainReviewArtifact(undefined)
      setMainReviewArtifactError(caught instanceof Error ? caught.message : 'Private artifact playback failed safely.')
    } finally {
      setMainReviewArtifactLoading(false)
    }
  }

  function persistSetupReset(reason: 'source_selected' | 'source_cleared') {
    void recordLifecycleCheckpoint({
      checkpointKind: 'setup_reset',
      status: 'draft',
      approvalStatus: 'not_requested',
      metadata: {
        resetReason: reason,
        resetAt: new Date().toISOString(),
        noMediaProcessingStarted: true,
        noProviderCallMade: true,
        noRenderStarted: true,
        noCreditReservedOrSpent: true,
        productReady: false,
      },
    }).catch((caught) => {
      setStatusMessage(caught instanceof Error
        ? `Edit reset locally, but backend-local lifecycle reset failed safely: ${caught.message}`
        : 'Edit reset locally, but backend-local lifecycle reset failed safely.')
    })
  }

  function handleVideoSelected(file?: File) {
    if (!file) return
    try {
      const nextPreview = createProjectSourceVideoLocalPreviewFromFile(file)
      revokeProjectSourceVideoLocalPreview(sourceVideo)
      setSourceFile(file)
      setSourceVideo(nextPreview)
      resetLocalEditProgress('Source video selected for this edit. Previous preview, QA, and export evidence were reset.')
      persistSetupReset('source_selected')
    } catch {
      setStatusMessage('Choose a video file for this edit.')
    }
  }

  function clearVideo() {
    revokeProjectSourceVideoLocalPreview(sourceVideo)
    setSourceFile(undefined)
    setSourceVideo(undefined)
    resetLocalEditProgress('Source video cleared from this edit. Previous preview, QA, and export evidence were reset.')
    persistSetupReset('source_cleared')
  }

  function handleMetadataLoaded(metadata: ProjectSourceVideoMetadataUpdate) {
    setSourceVideo((current) => current
      ? {
          ...current,
          ...metadata,
          inferredAspectRatio: inferProjectSourceVideoAspectRatio(metadata),
          metadataLoaded: true,
        }
      : current)
  }

  async function recordLifecycleCheckpoint(input: {
    checkpointKind: ProjectEditSessionLifecycleCheckpointKind
    status: ProjectEditSessionStatus
    approvalStatus?: ProjectEditSessionApprovalStatus
    sourceMediaAssetId?: string
    latestSnapshotId?: string
    latestPreviewId?: string
    latestPreviewUrl?: string
    metadata?: Record<string, unknown>
  }) {
    const apiBaseUrl = backendUploadConfig.apiBaseUrl ?? briefConfig.apiBaseUrl ?? localPreviewConfig.apiBaseUrl
    if (!apiBaseUrl) return undefined

    return recordProjectEditSessionLifecycleCheckpointBackendLocal({
      apiBaseUrl,
      editSessionId,
      workspaceId: backendUploadConfig.workspaceId,
      ...input,
    })
  }

  async function uploadForTesting() {
    if (!sourceFile || !backendUploadConfig.available || !backendUploadConfig.apiBaseUrl) return
    setBackendUploadStatus('uploading')
    setBackendUploadError(undefined)
    setLocalPreviewResult(undefined)
    setLocalFinalExportResult(undefined)
    setPlanApproved(false)
    setPlanApprovalStatus('idle')
    setPlanApprovalError(undefined)
    setBackendApprovedLocalPlan(undefined)
    setPreviewReviewResult(undefined)
    setProfessionalQAResult(undefined)
    setBriefSaved(false)
    setBackendSavedBrief(undefined)
    setBriefSaveStatus(briefConfig.available ? 'idle' : 'failed')
    setBriefSaveError(briefConfig.available ? undefined : briefConfig.message)
    try {
      const result = await uploadProjectSourceVideoToBackend({
        apiBaseUrl: backendUploadConfig.apiBaseUrl,
        editSessionId,
        file: sourceFile,
        projectId,
        workspaceId: backendUploadConfig.workspaceId,
      })
      await recordLifecycleCheckpoint({
        checkpointKind: 'source_uploaded',
        status: 'setup_ready',
        sourceMediaAssetId: result.mediaAssetId,
        metadata: createSourceUploadCheckpointMetadata(result),
      })
      setBackendUploadResult(result)
      setBackendUploadStatus('uploaded')
      setStatusMessage('Source video uploaded to backend-local storage metadata. No media processing, provider call, render, export, or production work started.')
    } catch (caught) {
      setBackendUploadStatus('failed')
      setBackendUploadError(caught instanceof Error ? caught.message : 'Backend-local upload failed safely.')
      setStatusMessage('Backend-local upload failed safely. The browser-local preview remains available.')
    }
  }

  async function saveBrief() {
    if (!briefConfig.available || !briefConfig.apiBaseUrl) {
      setBriefSaveStatus('failed')
      setBriefSaveError(briefConfig.message)
      setBriefSaved(false)
      setStatusMessage('Backend-local brief save is not configured.')
      return
    }

    setBriefSaveStatus('saving')
    setBriefSaveError(undefined)
    try {
      const directionToSave = resolveProjectEditPlanDirection({
        briefSaved: false,
        directionText: briefText,
      }).text
      const result = await saveProjectEditBriefBackendLocal({
        apiBaseUrl: briefConfig.apiBaseUrl,
        briefText: directionToSave,
        editSessionId,
        projectId,
        sourceMediaAssetId: backendUploadResult?.mediaAssetId,
        sourceStorageObjectRecordId: backendUploadResult?.storageObjectRecordId,
        workspaceId: briefConfig.workspaceId,
      })
      await recordLifecycleCheckpoint({
        checkpointKind: 'brief_saved',
        status: 'awaiting_approval',
        sourceMediaAssetId: backendUploadResult?.mediaAssetId,
        metadata: createBriefSavedCheckpointMetadata({
          brief: result.readback,
          sourceVideoUploadResult: backendUploadResult,
        }),
      })
      setBackendSavedBrief(result.readback)
      setBriefText(result.readback.briefText)
      setBriefSaved(true)
      setBriefSaveStatus('saved')
      briefDraftResetPersistedRef.current = false
      setStatusMessage('Optional direction saved and read back from the backend-local brief gate.')
    } catch (caught) {
      setBackendSavedBrief(undefined)
      setBriefSaved(false)
      setBriefSaveStatus('failed')
      setBriefSaveError(caught instanceof Error ? caught.message : 'Backend-local brief save failed safely.')
      setStatusMessage('Backend-local direction save failed safely. You can still approve a plan from the current prompt or default professional direction.')
    }
    setLocalPreviewResult(undefined)
    setLocalFinalExportResult(undefined)
    setPlanApprovalStatus('idle')
    setPlanApprovalError(undefined)
    setBackendApprovedLocalPlan(undefined)
    setPreviewReviewResult(undefined)
    setProfessionalQAResult(undefined)
    setPlanApproved(false)
  }

  function updateBriefText(value: string) {
    const shouldPersistBriefDraftReset = !briefDraftResetPersistedRef.current && Boolean(
      backendSavedBrief ||
      backendApprovedLocalPlan ||
      localPreviewResult ||
      previewReviewResult ||
      professionalQAResult ||
      localFinalExportResult
    )
    const previousBrief = backendSavedBrief
    setBriefText(value)
    setBriefSaved(false)
    setBackendSavedBrief(undefined)
    setBriefSaveStatus(briefConfig.available ? 'idle' : 'failed')
    setBriefSaveError(briefConfig.available ? undefined : briefConfig.message)
    setLocalPreviewResult(undefined)
    setLocalFinalExportResult(undefined)
    setPlanApproved(false)
    setPlanApprovalStatus('idle')
    setPlanApprovalError(undefined)
    setBackendApprovedLocalPlan(undefined)
    setPreviewReviewResult(undefined)
    setProfessionalQAResult(undefined)
    if (shouldPersistBriefDraftReset) {
      briefDraftResetPersistedRef.current = true
      void recordLifecycleCheckpoint({
        checkpointKind: 'brief_draft_changed',
        status: backendUploadResult ? 'setup_ready' : 'draft',
        approvalStatus: 'not_requested',
        sourceMediaAssetId: backendUploadResult?.mediaAssetId,
        metadata: createBriefDraftChangedCheckpointMetadata({
          previousBrief,
          sourceVideoUploadResult: backendUploadResult,
        }),
      }).catch((caught) => {
        setStatusMessage(caught instanceof Error
          ? `Brief changed locally, but backend-local stale evidence reset failed safely: ${caught.message}`
          : 'Brief changed locally, but backend-local stale evidence reset failed safely.')
      })
    }
  }

  async function approveLocalPlan() {
    if (!planApprovalModel.canApprove || !backendUploadResult || !backendUploadConfig.apiBaseUrl) return
    const approvedPlanForBackend: ProjectEditPlanApprovalModel = {
      ...planApprovalModel,
      approved: true,
      blockers: planApprovalModel.blockers.filter((blocker) => blocker !== 'plan_credit_approval_required'),
      status: 'approved',
    }
    setPlanApprovalStatus('approving')
    setPlanApprovalError(undefined)
    setLocalPreviewResult(undefined)
    setLocalFinalExportResult(undefined)
    setPreviewReviewResult(undefined)
    setProfessionalQAResult(undefined)
    try {
      const result = await approveProjectEditPlanBackendLocal({
        apiBaseUrl: backendUploadConfig.apiBaseUrl,
        approvedLocalPlan: approvedPlanForBackend,
        editBrief: backendSavedBrief?.readbackVerified ? backendSavedBrief : undefined,
        editSessionId,
        projectId,
        sourceVideoUploadResult: backendUploadResult,
        workspaceId: backendUploadConfig.workspaceId,
      })
      await recordLifecycleCheckpoint({
        checkpointKind: 'plan_approved',
        status: 'approved',
        approvalStatus: 'approved',
        sourceMediaAssetId: backendUploadResult.mediaAssetId,
        latestSnapshotId: result.localEditPlan.id,
        metadata: createPlanApprovedCheckpointMetadata(result),
      })
      setBackendApprovedLocalPlan(result)
      setPreviewReviewResult(undefined)
      setProfessionalQAResult(undefined)
      setLocalFinalExportResult(undefined)
      setPlanApproved(true)
      setPlanApprovalStatus('approved')
      setStatusMessage('Local edit plan and credit estimate approved and read back from the backend-local plan gate.')
    } catch (caught) {
      setPlanApproved(false)
      setPlanApprovalStatus('failed')
      setBackendApprovedLocalPlan(undefined)
      setPlanApprovalError(caught instanceof Error ? caught.message : 'Backend-local plan approval failed safely.')
      setStatusMessage('Backend-local plan approval failed safely. Preview remains blocked.')
    }
  }

  return (
    <section className="clean-edit-brief" data-testid="project-edit-brief-workspace">
      <Card className="clean-edit-brief__hero">
        <div className="clean-edit-brief__hero-copy">
          <span className="section-eyebrow">Edit setup</span>
          <h2>{editSessionTitle ?? 'Untitled edit'}</h2>
          <p>
            Upload the source video for this edit, add optional direction if useful, then approve a clean private test plan before preview work starts.
          </p>
        </div>
        <div className="clean-edit-brief__hero-actions">
          <Button to={`/projects/${projectId}`} variant="secondary">
            Back to project
          </Button>
          <Button to={`/projects/${projectId}/edits/${editSessionId}/chat`} variant="primary">
            Open Edit Chat
          </Button>
        </div>
      </Card>

      <ProjectEditLifecycleStatusCard model={lifecycle} />

      <Card className="clean-edit-brief__flow-card" data-testid="project-edit-flow-summary">
        <div className="clean-edit-brief__flow-heading">
          <div>
            <span className="section-eyebrow">Edit flow</span>
            <h3>{currentFlowStep?.status === 'complete' ? 'Private edit is ready for review' : `Continue with ${currentFlowStep?.label.toLowerCase()}`}</h3>
            <p>{currentFlowStep?.summary}</p>
          </div>
          <Badge accent={currentFinalExportResult ? 'success' : 'cyan'}>
            {currentFinalExportResult ? 'Export ready' : 'In progress'}
          </Badge>
        </div>
        <ol className="clean-edit-brief__flow-steps">
          {editFlowSteps.map((step) => (
            <li data-state={step.status} key={step.id}>
              <span>{step.label}</span>
              <strong>{step.status === 'complete' ? 'Done' : step.status === 'current' ? 'Now' : step.status === 'optional' ? 'Optional' : 'Locked'}</strong>
            </li>
          ))}
        </ol>
      </Card>

      <div className="clean-edit-brief__layout">
        <main className="clean-edit-brief__main">
          <Card className="clean-edit-brief__upload-card">
            <ProjectEditBriefSourceVideoPicker
              backendUploadConfig={backendUploadConfig}
              backendUploadError={backendUploadError}
              backendUploadResult={backendUploadResult}
              backendUploadStatus={backendUploadStatus}
              localPreview={sourceVideo}
              onClear={clearVideo}
              onSelectFile={handleVideoSelected}
              onUploadToBackend={uploadForTesting}
            />
            <div className="project-edit-brief-playback-selector" data-testid="project-edit-main-playback-selector">
              {[
                { mode: 'source' as const, label: 'Source', disabled: !sourceVideo },
                { mode: 'preview' as const, label: 'Preview', disabled: !currentPreviewResult?.previewStorageObjectId },
                { mode: 'final_export' as const, label: 'Final', disabled: !currentFinalExportResult?.finalExportStorageObjectId },
              ].map((item) => (
                <button
                  aria-pressed={mainPlaybackMode === item.mode}
                  data-active={mainPlaybackMode === item.mode}
                  disabled={item.disabled || mainReviewArtifactLoading}
                  key={item.mode}
                  onClick={() => void selectMainPlaybackMode(item.mode)}
                  type="button"
                >
                  {item.label}
                </button>
              ))}
            </div>
            <ProjectEditBriefVideoShell
              localPreview={mainPlaybackMode === 'source' ? sourceVideo : undefined}
              onMetadataLoaded={handleMetadataLoaded}
              onPlayStateChange={setPlaying}
              onTimeUpdate={setPlayheadSeconds}
              playbackNotice={primaryPlaybackNotice}
              playing={playing}
              reviewArtifact={selectedMainReviewArtifact}
              reviewArtifactLabel={primaryPlaybackLabel}
              video={primaryVideoShell}
            />
            {mainReviewArtifactError ? (
              <p className="project-edit-brief-source-video-picker__error" data-testid="project-edit-main-playback-error">
                {mainReviewArtifactError}
              </p>
            ) : null}
            <ProjectEditBriefSourceVideoSummary localPreview={sourceVideo} summary={sourceSummary} />
          </Card>

          <Card className="clean-edit-brief__brief-card">
            <div className="clean-edit-brief__card-heading">
              <MessageSquareText aria-hidden="true" size={22} />
              <div>
                <h3>Edit brief</h3>
                <p>Optional. Use it when you want stronger direction than the default professional edit plan.</p>
              </div>
            </div>
            <label htmlFor="clean-edit-brief-text">Instructions</label>
            <textarea
              id="clean-edit-brief-text"
              onChange={(event) => updateBriefText(event.currentTarget.value)}
              placeholder="Example: Make this a clean YouTube intro with readable captions, natural voice, and no flashy effects."
              rows={6}
              value={briefText}
            />
            <Button onClick={saveBrief} type="button" variant="primary">
              {briefSaveStatus === 'saving' ? 'Saving direction...' : 'Save optional direction'}
            </Button>
            <p className="project-edit-brief-muted" data-testid="project-edit-brief-save-status">
              {briefSaveStatus === 'saved' && backendSavedBrief
                ? `Backend-local direction saved: ${backendSavedBrief.id}`
                : briefSaveError ?? 'You can approve a plan without saving this. If blank, ReEditPro uses the default clean professional direction.'}
            </p>
          </Card>
        </main>

        <aside className="clean-edit-brief__side">
          <Card className="clean-edit-brief__next-card">
            <span className="section-eyebrow">Next</span>
            <h3>Approve the test plan</h3>
            <p>
              After upload, approve the local edit plan and credit estimate before any preview smoke can run. Optional direction is included when present.
            </p>
            <ul>
              <li>Video stays inside this edit workspace.</li>
              <li>Plan approval is explicit and reversible by changing the direction.</li>
              <li>Editing tools do not run from this UI screen.</li>
            </ul>
          </Card>
          <ProjectEditPlanApprovalCard
            approvalError={planApprovalError}
            approvalStatus={planApprovalStatus}
            backendRecordId={backendApprovedLocalPlan?.localEditPlan.id}
            model={visiblePlanApprovalModel}
            onApprove={approveLocalPlan}
          />
          <Card className="clean-edit-brief__status-card">
            <span className="section-eyebrow">Status</span>
            <p data-testid="project-edit-brief-status">{statusMessage}</p>
          </Card>
          <ProjectEditBriefLocalPreviewSmokeCard
            approvedLocalPlan={backendApprovedLocalPlan?.localEditPlan.approvedLocalPlan}
            config={localPreviewConfig}
            editSessionId={editSessionId}
            onPreviewReady={(result) => {
              setLocalPreviewResult(result)
              setPreviewReviewResult(undefined)
              setProfessionalQAResult(undefined)
              setLocalFinalExportResult(undefined)
              void selectMainPlaybackMode('preview', result.previewStorageObjectId)
              void recordLifecycleCheckpoint({
                checkpointKind: 'preview_ready',
                status: 'preview_ready',
                approvalStatus: 'approved',
                latestSnapshotId: result.approvedPlanSnapshotId,
                latestPreviewId: result.renderId,
                latestPreviewUrl: result.outputObjectPath
                  ? `${result.outputBucketName ?? 'preview'}/${result.outputObjectPath}`
                  : undefined,
                metadata: createPreviewReadyCheckpointMetadata(result),
              }).catch((caught) => {
                setStatusMessage(caught instanceof Error
                  ? `Preview ready, but lifecycle checkpoint failed safely: ${caught.message}`
                  : 'Preview ready, but lifecycle checkpoint failed safely.')
              })
              setStatusMessage('Preview-only internal smoke completed. Final export and real tool execution remain blocked.')
            }}
            planApproved={Boolean(backendApprovedLocalPlan?.localEditPlan.readbackVerified)}
            planApprovalBlockedMessage="Approve and read back the local edit plan and credit estimate before running preview smoke."
            previewResult={currentPreviewResult}
            projectId={projectId}
            sourceVideoAspectRatio={sourceVideo?.inferredAspectRatio}
            sourceVideoDurationSeconds={sourceVideo?.durationSeconds}
            sourceVideoUploadResult={backendUploadResult}
          />
          <ProjectEditBriefPreviewReviewCard
            config={localPreviewConfig}
            onReviewRecorded={(result) => {
              setPreviewReviewResult(result)
              setProfessionalQAResult(undefined)
              setLocalFinalExportResult(undefined)
              void recordLifecycleCheckpoint({
                checkpointKind: 'preview_reviewed',
                status: result.reviewStatus === 'approved' ? 'preview_ready' : 'revision_requested',
                approvalStatus: result.reviewStatus === 'approved' ? 'approved' : 'reset_after_revision',
                latestPreviewId: result.renderId,
                metadata: createPreviewReviewedCheckpointMetadata(result),
              }).catch((caught) => {
                setStatusMessage(caught instanceof Error
                  ? `Preview review recorded, but lifecycle checkpoint failed safely: ${caught.message}`
                  : 'Preview review recorded, but lifecycle checkpoint failed safely.')
              })
              setStatusMessage(result.reviewStatus === 'approved'
                ? 'Preview review approved and recorded. Professional QA and final export remain separate gates.'
                : 'Preview changes requested and recorded. Update the brief or plan before another preview.')
            }}
            previewResult={currentPreviewResult}
            previewReviewResult={currentPreviewReviewResult}
          />
          <ProjectEditBriefProfessionalQACard
            onQARecorded={(result) => {
              setProfessionalQAResult(result)
              setLocalFinalExportResult(undefined)
              void recordLifecycleCheckpoint({
                checkpointKind: 'professional_qa_checked',
                status: 'preview_ready',
                approvalStatus: 'approved',
                latestSnapshotId: result.approvedPlanSnapshotId,
                latestPreviewId: result.renderId,
                metadata: createProfessionalQACheckpointMetadata(result),
              }).catch((caught) => {
                setStatusMessage(caught instanceof Error
                  ? `Professional QA recorded, but lifecycle checkpoint failed safely: ${caught.message}`
                  : 'Professional QA recorded, but lifecycle checkpoint failed safely.')
              })
              setStatusMessage(result.status === 'passed'
                ? 'Professional QA checkpoint passed. Private export is available for internal review.'
                : 'Professional QA checkpoint is blocked. Resolve the listed readiness items before export.')
            }}
            previewResult={currentPreviewResult}
            previewReviewResult={currentPreviewReviewResult}
            professionalQAResult={currentProfessionalQAResult}
            sourceVideoUploadResult={backendUploadResult}
            workspaceId={backendUploadConfig.workspaceId}
          />
          <ProjectEditBriefFinalExportCard
            apiBaseUrl={localPreviewConfig.apiBaseUrl ?? backendUploadConfig.apiBaseUrl ?? briefConfig.apiBaseUrl}
            editPlanId={backendApprovedLocalPlan?.localEditPlan.editPlanId ?? planApprovalModel.planId}
            finalExportResult={currentFinalExportResult}
            onFinalExportReady={(result) => {
              setLocalFinalExportResult(result)
              void selectMainPlaybackMode('final_export', result.finalExportStorageObjectId)
              void recordLifecycleCheckpoint({
                checkpointKind: 'final_export_ready',
                status: 'final_export_ready',
                approvalStatus: 'approved',
                sourceMediaAssetId: backendUploadResult?.mediaAssetId,
                latestSnapshotId: result.approvedPlanSnapshotId,
                latestPreviewId: result.renderId,
                latestPreviewUrl: result.outputObjectPath
                  ? `${result.outputBucketName ?? 'export'}/${result.outputObjectPath}`
                  : undefined,
                metadata: createFinalExportReadyCheckpointMetadata(result),
              }).catch((caught) => {
                setStatusMessage(caught instanceof Error
                  ? `Private export ready, but lifecycle checkpoint failed safely: ${caught.message}`
                  : 'Private export ready, but lifecycle checkpoint failed safely.')
              })
            }}
            onStatusMessage={setStatusMessage}
            previewResult={currentPreviewResult}
            previewReviewResult={currentPreviewReviewResult}
            professionalQAResult={currentProfessionalQAResult}
            projectId={projectId}
            sourceVideoUploadResult={backendUploadResult}
            workspaceId={backendUploadConfig.workspaceId}
          />
          <Card className="clean-edit-brief__status-card">
            <span className="section-eyebrow">Architecture boundary</span>
            <p>
              This edit can prove backend-local upload and preview-only internal smoke when explicitly enabled. Full professional editing still requires real plan generation, user approval, approved snapshot execution, QA, and final export gates.
            </p>
          </Card>
        </aside>
      </div>
    </section>
  )
}
