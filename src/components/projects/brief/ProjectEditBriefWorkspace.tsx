import { useEffect, useMemo, useRef, useState } from 'react'
import { MessageSquareText } from 'lucide-react'
import { Button } from '../../Button'
import { Card } from '../../Card'
import { ProjectEditPlanApprovalCard } from '../ProjectEditPlanApprovalCard'
import { ProjectEditLifecycleStatusCard } from '../ProjectEditLifecycleStatusCard'
import {
  createProjectEditBriefBackendLocalConfig,
  saveProjectEditBriefBackendLocal,
  type ProjectEditBriefBackendLocalRecord,
} from '../../../lib/project-edit-brief-backend-local'
import { approveProjectEditPlanBackendLocal } from '../../../lib/project-edit-plan-backend-local'
import { buildProjectEditPlanApprovalModel } from '../../../lib/project-edit-plan-approval'
import { buildProjectEditLifecycleModel } from '../../../lib/project-edit-lifecycle'
import {
  createProjectSourceVideoBackendUploadConfig,
  uploadProjectSourceVideoToBackend,
} from '../../../lib/project-source-video-backend-upload'
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
import type {
  ProjectSourceVideoBackendUploadResult,
  ProjectSourceVideoBackendUploadStatus,
  ProjectSourceVideoLocalEditPreviewResult,
  ProjectSourceVideoLocalPreview,
  ProjectSourceVideoMetadataUpdate,
  ProjectSourceVideoPreviewReviewResult,
} from '../../../types/project-source-video'
import type { ProjectEditBriefVideoShellModel } from '../../../lib/project-edit-brief-ui-adapter'
import { ProjectEditBriefLocalPreviewSmokeCard } from './ProjectEditBriefLocalPreviewSmokeCard'
import { ProjectEditBriefPreviewReviewCard } from './ProjectEditBriefPreviewReviewCard'
import { ProjectEditBriefSourceVideoPicker } from './ProjectEditBriefSourceVideoPicker'
import { ProjectEditBriefSourceVideoSummary } from './ProjectEditBriefSourceVideoSummary'
import { ProjectEditBriefVideoShell } from './ProjectEditBriefVideoShell'

type ProjectEditBriefWorkspaceProps = {
  editSessionId: string
  editSessionTitle?: string
  projectId: string
}

export function ProjectEditBriefWorkspace({ editSessionId, editSessionTitle, projectId }: ProjectEditBriefWorkspaceProps) {
  const briefConfig = useMemo(() => createProjectEditBriefBackendLocalConfig(import.meta.env), [])
  const backendUploadConfig = useMemo(() => createProjectSourceVideoBackendUploadConfig(import.meta.env), [])
  const localPreviewConfig = useMemo(() => createProjectSourceVideoLocalEditPreviewConfig(import.meta.env), [])
  const [sourceFile, setSourceFile] = useState<File | undefined>()
  const [sourceVideo, setSourceVideo] = useState<ProjectSourceVideoLocalPreview | undefined>()
  const [backendUploadStatus, setBackendUploadStatus] = useState<ProjectSourceVideoBackendUploadStatus>(() => backendUploadConfig.available ? 'idle' : 'unavailable')
  const [backendUploadResult, setBackendUploadResult] = useState<ProjectSourceVideoBackendUploadResult | undefined>()
  const [backendUploadError, setBackendUploadError] = useState<string | undefined>()
  const [localPreviewResult, setLocalPreviewResult] = useState<ProjectSourceVideoLocalEditPreviewResult | undefined>()
  const [playing, setPlaying] = useState(false)
  const [playheadSeconds, setPlayheadSeconds] = useState(0)
  const [briefText, setBriefText] = useState('Clean pacing, readable captions, natural sound, and no flashy transitions unless the edit asks for it.')
  const [briefSaved, setBriefSaved] = useState(false)
  const [briefSaveStatus, setBriefSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'failed'>(briefConfig.available ? 'idle' : 'failed')
  const [briefSaveError, setBriefSaveError] = useState<string | undefined>(briefConfig.available ? undefined : briefConfig.message)
  const [backendSavedBrief, setBackendSavedBrief] = useState<ProjectEditBriefBackendLocalRecord | undefined>()
  const [planApproved, setPlanApproved] = useState(false)
  const [planApprovalStatus, setPlanApprovalStatus] = useState<'idle' | 'approving' | 'approved' | 'failed'>('idle')
  const [planApprovalError, setPlanApprovalError] = useState<string | undefined>()
  const [backendApprovedLocalPlan, setBackendApprovedLocalPlan] = useState<ProjectEditPlanBackendApprovalResult | undefined>()
  const [previewReviewResult, setPreviewReviewResult] = useState<ProjectSourceVideoPreviewReviewResult | undefined>()
  const [statusMessage, setStatusMessage] = useState('Ready for source video and brief notes.')
  const sourceVideoRef = useRef<ProjectSourceVideoLocalPreview | undefined>(undefined)

  useEffect(() => {
    sourceVideoRef.current = sourceVideo
  }, [sourceVideo])

  useEffect(() => () => {
    revokeProjectSourceVideoLocalPreview(sourceVideoRef.current)
  }, [])

  const sourceSummary = useMemo(() => createProjectSourceVideoMetadataSummary(sourceVideo), [sourceVideo])
  const videoShell = useMemo<ProjectEditBriefVideoShellModel>(() => ({
    durationSeconds: sourceVideo?.durationSeconds ?? 60,
    currentTimeSeconds: playheadSeconds,
    currentTimeLabel: formatProjectSourceVideoDuration(playheadSeconds),
    durationLabel: formatProjectSourceVideoDuration(sourceVideo?.durationSeconds),
    aspectLabel: sourceVideo?.inferredAspectRatio ?? 'Metadata pending',
    title: sourceVideo?.fileName ?? 'Source video',
    mockPosterLabel: 'Select a source video',
  }), [playheadSeconds, sourceVideo])
  const planApprovalModel = useMemo(() => buildProjectEditPlanApprovalModel({
    approved: planApproved,
    backendUploadResult,
    briefSaved: Boolean(backendSavedBrief?.readbackVerified) && briefSaved,
    briefText: backendSavedBrief?.briefText ?? briefText,
    editSessionId,
    projectId,
    sourceAspectRatio: sourceVideo?.inferredAspectRatio,
    sourceDurationSeconds: sourceVideo?.durationSeconds,
    sourceFileName: sourceVideo?.fileName,
  }), [backendSavedBrief, backendUploadResult, briefSaved, briefText, editSessionId, planApproved, projectId, sourceVideo])
  const lifecycle = useMemo(() => buildProjectEditLifecycleModel({
    backendUploadAvailable: backendUploadConfig.available,
    backendUploadResult,
    backendUploadStatus,
    briefSaved: Boolean(backendSavedBrief?.readbackVerified) && briefSaved,
    editSessionId,
    hasLocalSourceVideo: Boolean(sourceVideo),
    localPreviewResult,
    planApproved: planApprovalModel.approved,
    planReady: planApprovalModel.canApprove || planApprovalModel.approved,
    previewReviewResult,
    projectId,
  }), [backendSavedBrief, backendUploadConfig.available, backendUploadResult, backendUploadStatus, briefSaved, editSessionId, localPreviewResult, planApprovalModel.approved, planApprovalModel.canApprove, previewReviewResult, projectId, sourceVideo])

  function handleVideoSelected(file?: File) {
    if (!file) return
    try {
      const nextPreview = createProjectSourceVideoLocalPreviewFromFile(file)
      revokeProjectSourceVideoLocalPreview(sourceVideo)
      setSourceFile(file)
      setSourceVideo(nextPreview)
      setBackendUploadResult(undefined)
      setBackendUploadError(undefined)
      setLocalPreviewResult(undefined)
      setPlanApproved(false)
      setPlanApprovalStatus('idle')
      setPlanApprovalError(undefined)
      setBackendApprovedLocalPlan(undefined)
      setPreviewReviewResult(undefined)
      setBackendUploadStatus(backendUploadConfig.available ? 'idle' : 'unavailable')
      setPlayheadSeconds(0)
      setPlaying(false)
      setBriefSaved(false)
      setBackendSavedBrief(undefined)
      setBriefSaveStatus(briefConfig.available ? 'idle' : 'failed')
      setBriefSaveError(briefConfig.available ? undefined : briefConfig.message)
      setStatusMessage('Source video selected for this edit. Nothing has been uploaded or processed yet.')
    } catch {
      setStatusMessage('Choose a video file for this edit.')
    }
  }

  function clearVideo() {
    revokeProjectSourceVideoLocalPreview(sourceVideo)
    setSourceFile(undefined)
    setSourceVideo(undefined)
    setBackendUploadResult(undefined)
    setBackendUploadError(undefined)
    setLocalPreviewResult(undefined)
    setPlanApproved(false)
    setPlanApprovalStatus('idle')
    setPlanApprovalError(undefined)
    setBackendApprovedLocalPlan(undefined)
    setPreviewReviewResult(undefined)
    setBackendUploadStatus(backendUploadConfig.available ? 'idle' : 'unavailable')
    setPlayheadSeconds(0)
    setPlaying(false)
    setBriefSaved(false)
    setBackendSavedBrief(undefined)
    setBriefSaveStatus(briefConfig.available ? 'idle' : 'failed')
    setBriefSaveError(briefConfig.available ? undefined : briefConfig.message)
    setStatusMessage('Source video cleared from this edit.')
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

  async function uploadForTesting() {
    if (!sourceFile || !backendUploadConfig.available || !backendUploadConfig.apiBaseUrl) return
    setBackendUploadStatus('uploading')
    setBackendUploadError(undefined)
    setLocalPreviewResult(undefined)
    setPlanApproved(false)
    setPlanApprovalStatus('idle')
    setPlanApprovalError(undefined)
    setBackendApprovedLocalPlan(undefined)
    setPreviewReviewResult(undefined)
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
      const result = await saveProjectEditBriefBackendLocal({
        apiBaseUrl: briefConfig.apiBaseUrl,
        briefText,
        editSessionId,
        projectId,
        sourceMediaAssetId: backendUploadResult?.mediaAssetId,
        sourceStorageObjectRecordId: backendUploadResult?.storageObjectRecordId,
        workspaceId: briefConfig.workspaceId,
      })
      setBackendSavedBrief(result.readback)
      setBriefSaved(true)
      setBriefSaveStatus('saved')
      setStatusMessage('Brief saved and read back from the backend-local brief gate.')
    } catch (caught) {
      setBackendSavedBrief(undefined)
      setBriefSaved(false)
      setBriefSaveStatus('failed')
      setBriefSaveError(caught instanceof Error ? caught.message : 'Backend-local brief save failed safely.')
      setStatusMessage('Backend-local brief save failed safely. Plan approval remains blocked.')
    }
    setLocalPreviewResult(undefined)
    setPlanApprovalStatus('idle')
    setPlanApprovalError(undefined)
    setBackendApprovedLocalPlan(undefined)
    setPreviewReviewResult(undefined)
    setPlanApproved(false)
    setStatusMessage('Brief saved locally for this edit workspace.')
  }

  function updateBriefText(value: string) {
    setBriefText(value)
    setBriefSaved(false)
    setBackendSavedBrief(undefined)
    setBriefSaveStatus(briefConfig.available ? 'idle' : 'failed')
    setBriefSaveError(briefConfig.available ? undefined : briefConfig.message)
    setLocalPreviewResult(undefined)
    setPlanApproved(false)
    setPlanApprovalStatus('idle')
    setPlanApprovalError(undefined)
    setBackendApprovedLocalPlan(undefined)
    setPreviewReviewResult(undefined)
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
    try {
      const result = await approveProjectEditPlanBackendLocal({
        apiBaseUrl: backendUploadConfig.apiBaseUrl,
        approvedLocalPlan: approvedPlanForBackend,
        editSessionId,
        projectId,
        sourceVideoUploadResult: backendUploadResult,
        workspaceId: backendUploadConfig.workspaceId,
      })
      setBackendApprovedLocalPlan(result)
      setPreviewReviewResult(undefined)
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
            Upload the source video for this edit, write the brief, then continue to planning and approval when the backend execution lane is ready.
          </p>
        </div>
        <Button to={`/projects/${projectId}`} variant="secondary">
          Back to project
        </Button>
      </Card>

      <ProjectEditLifecycleStatusCard model={lifecycle} />

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
            <ProjectEditBriefVideoShell
              localPreview={sourceVideo}
              onMetadataLoaded={handleMetadataLoaded}
              onPlayStateChange={setPlaying}
              onTimeUpdate={setPlayheadSeconds}
              playing={playing}
              video={videoShell}
            />
            <ProjectEditBriefSourceVideoSummary localPreview={sourceVideo} summary={sourceSummary} />
          </Card>

          <Card className="clean-edit-brief__brief-card">
            <div className="clean-edit-brief__card-heading">
              <MessageSquareText aria-hidden="true" size={22} />
              <div>
                <h3>Edit brief</h3>
                <p>Tell ReEditPro what this edit should feel like.</p>
              </div>
            </div>
            <label htmlFor="clean-edit-brief-text">Instructions</label>
            <textarea
              id="clean-edit-brief-text"
              onChange={(event) => updateBriefText(event.currentTarget.value)}
              rows={6}
              value={briefText}
            />
            <Button onClick={saveBrief} type="button" variant="primary">
              {briefSaveStatus === 'saving' ? 'Saving brief...' : 'Save brief'}
            </Button>
            <p className="project-edit-brief-muted" data-testid="project-edit-brief-save-status">
              {briefSaveStatus === 'saved' && backendSavedBrief
                ? `Backend-local brief saved: ${backendSavedBrief.id}`
                : briefSaveError ?? 'Saving the brief records the instruction before plan approval.'}
            </p>
          </Card>
        </main>

        <aside className="clean-edit-brief__side">
          <Card className="clean-edit-brief__next-card">
            <span className="section-eyebrow">Next</span>
            <h3>Approve the test plan</h3>
            <p>
              After upload and brief save, approve the local edit plan and credit estimate before any preview smoke can run.
            </p>
            <ul>
              <li>Video stays inside this edit workspace.</li>
              <li>Plan approval is explicit and reversible by changing the brief.</li>
              <li>Editing tools do not run from this UI screen.</li>
            </ul>
          </Card>
          <ProjectEditPlanApprovalCard
            approvalError={planApprovalError}
            approvalStatus={planApprovalStatus}
            backendRecordId={backendApprovedLocalPlan?.localEditPlan.id}
            model={planApprovalModel}
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
              setStatusMessage('Preview-only internal smoke completed. Final export and real tool execution remain blocked.')
            }}
            planApproved={Boolean(backendApprovedLocalPlan?.localEditPlan.readbackVerified)}
            planApprovalBlockedMessage="Approve and read back the local edit plan and credit estimate before running preview smoke."
            projectId={projectId}
            sourceVideoAspectRatio={sourceVideo?.inferredAspectRatio}
            sourceVideoDurationSeconds={sourceVideo?.durationSeconds}
            sourceVideoUploadResult={backendUploadResult}
          />
          <ProjectEditBriefPreviewReviewCard
            config={localPreviewConfig}
            onReviewRecorded={(result) => {
              setPreviewReviewResult(result)
              setStatusMessage(result.reviewStatus === 'approved'
                ? 'Preview review approved and recorded. Professional QA and final export remain separate gates.'
                : 'Preview changes requested and recorded. Update the brief or plan before another preview.')
            }}
            previewResult={localPreviewResult}
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
