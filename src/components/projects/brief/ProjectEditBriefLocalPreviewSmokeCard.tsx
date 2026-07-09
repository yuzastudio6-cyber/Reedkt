import { LoaderCircle, Play } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '../../Badge'
import { Button } from '../../Button'
import { Card } from '../../Card'
import { ProjectEditBriefArtifactReviewPlayer } from './ProjectEditBriefArtifactReviewPlayer'
import {
  runProjectSourceVideoLocalEditPreviewSmoke,
} from '../../../lib/project-source-video-local-edit-preview-smoke'
import {
  createProjectEditApprovedEvidenceKey,
  previewResultMatchesApprovedEvidence,
} from '../../../lib/project-edit-evidence-lineage'
import type { ProjectEditPlanApprovedLocalPlan } from '../../../lib/project-edit-plan-approval'
import type {
  ProjectSourceVideoBackendUploadResult,
  ProjectSourceVideoLocalEditPreviewConfig,
  ProjectSourceVideoLocalEditPreviewResult,
  ProjectSourceVideoLocalEditPreviewStatus,
} from '../../../types/project-source-video'

type ProjectEditBriefLocalPreviewSmokeCardProps = {
  approvedLocalPlan?: ProjectEditPlanApprovedLocalPlan
  config: ProjectSourceVideoLocalEditPreviewConfig
  editSessionId: string
  onPreviewReady?: (result: ProjectSourceVideoLocalEditPreviewResult) => void
  planApproved?: boolean
  planApprovalBlockedMessage?: string
  previewResult?: ProjectSourceVideoLocalEditPreviewResult
  projectId: string
  sourceVideoAspectRatio?: string
  sourceVideoDurationSeconds?: number
  sourceVideoUploadResult?: ProjectSourceVideoBackendUploadResult
}

type LocalPreviewRunState = {
  evidenceKey?: string
  status: ProjectSourceVideoLocalEditPreviewStatus
  result?: ProjectSourceVideoLocalEditPreviewResult
  error?: string
}

function statusLabel(status: ProjectSourceVideoLocalEditPreviewStatus): string {
  return status.replace(/_/g, ' ')
}

function formatSeconds(value: number | undefined): string {
  if (!value || value <= 0) return 'pending'
  return `${value.toFixed(2)}s`
}

function formatBytes(value: number | undefined): string {
  if (!value || value <= 0) return 'pending'
  const megabytes = value / (1024 * 1024)
  return `${megabytes.toFixed(megabytes >= 10 ? 1 : 2)} MB`
}

export function ProjectEditBriefLocalPreviewSmokeCard({
  approvedLocalPlan,
  config,
  editSessionId,
  onPreviewReady,
  planApproved = false,
  planApprovalBlockedMessage = 'Approve the local edit plan and credit estimate before running this preview.',
  previewResult,
  projectId,
  sourceVideoAspectRatio,
  sourceVideoDurationSeconds,
  sourceVideoUploadResult,
}: ProjectEditBriefLocalPreviewSmokeCardProps) {
  const [runState, setRunState] = useState<LocalPreviewRunState | undefined>()
  const sourceKey = sourceVideoUploadResult?.storageObjectRecordId
  const evidenceKey = createProjectEditApprovedEvidenceKey({
    approvedLocalPlan,
    sourceStorageObjectRecordId: sourceKey,
  })
  const runStateMatchesEvidence = Boolean(evidenceKey && runState?.evidenceKey === evidenceKey)
  const restoredResultMatchesEvidence = previewResultMatchesApprovedEvidence({
    approvedLocalPlan,
    previewResult,
    sourceStorageObjectRecordId: sourceKey,
  })
  const fallbackStatus: ProjectSourceVideoLocalEditPreviewStatus = !config.available
    ? 'unavailable'
    : sourceVideoUploadResult
      ? planApproved
        ? 'idle'
        : 'blocked'
      : 'waiting_for_upload'
  const restoredResult = restoredResultMatchesEvidence ? previewResult : undefined
  const result: ProjectSourceVideoLocalEditPreviewResult | undefined = runStateMatchesEvidence
    ? runState?.result ?? restoredResult
    : restoredResult
  const status = runStateMatchesEvidence
    ? runState?.status ?? result?.status ?? fallbackStatus
    : result?.status ?? fallbackStatus
  const error = runStateMatchesEvidence ? runState?.error : undefined

  const disabled = !config.available || !sourceVideoUploadResult || !planApproved || status === 'running'

  async function runPreviewSmoke() {
    if (!config.available || !config.apiBaseUrl || !sourceVideoUploadResult || !planApproved || !approvedLocalPlan?.approved || !evidenceKey) return
    setRunState({ evidenceKey, status: 'running' })
    try {
      const previewResult = await runProjectSourceVideoLocalEditPreviewSmoke({
        apiBaseUrl: config.apiBaseUrl,
        editSessionId,
        projectId,
        workspaceId: config.workspaceId,
        approvedLocalPlan,
        sourceVideoUploadResult,
        sourceVideoDurationSeconds,
        sourceVideoAspectRatio,
      })
      setRunState({
        evidenceKey,
        status: 'preview_ready',
        result: previewResult,
      })
      onPreviewReady?.(previewResult)
    } catch (caught) {
      setRunState({
        evidenceKey,
        status: 'failed',
        error: caught instanceof Error ? caught.message : 'Local edit preview failed safely.',
      })
    }
  }

  return (
    <Card className="project-edit-brief-local-preview-smoke" data-testid="project-source-video-local-preview-smoke">
      <div className="project-edit-brief-local-preview-smoke__header">
        <div>
          <span className="section-eyebrow">Local edit preview</span>
          <h3>Render a test preview</h3>
          <p>
            Runs the internal approved-snapshot, credit-reservation, worker, and preview gates after local plan approval.
          </p>
        </div>
        <Badge accent={status === 'preview_ready' ? 'success' : status === 'failed' ? 'danger' : 'cyan'}>
          {statusLabel(status)}
        </Badge>
      </div>
      <Button
        data-testid="project-source-video-local-preview-smoke-button"
        disabled={disabled}
        icon={status === 'running' ? LoaderCircle : Play}
        onClick={runPreviewSmoke}
        size="sm"
        type="button"
        variant="primary"
      >
        {status === 'running' ? 'Creating preview' : planApproved ? 'Run local edit preview' : 'Approve plan first'}
      </Button>
      <div className="project-edit-brief-local-preview-smoke__status" data-testid="project-source-video-local-preview-smoke-status">
        {result ? (
          <>
            <span><strong>Preview object</strong>{result.outputBucketName}/{result.outputObjectPath}</span>
            <span><strong>Approved plan</strong>{result.editPlanId}</span>
            {result.editAssembly ? <span><strong>Edit pass</strong>{result.editAssembly.planStepCount} approved plan steps applied</span> : null}
            {result.editAssembly ? (
              <span>
                <strong>Operations</strong>
                {result.editAssembly.professionalOperationCount ?? approvedLocalPlan?.operationManifest.operations.length ?? 0} professional operations
              </span>
            ) : null}
            <span><strong>Duration</strong>{formatSeconds(result.durationSeconds)}</span>
            <span><strong>Size</strong>{formatBytes(result.sizeBytes)}</span>
            {result.privateReviewPreview ? (
              <>
                <span><strong>Private review</strong>{result.privateReviewPreview.outputBucketName}/{result.privateReviewPreview.outputObjectPath}</span>
                <span><strong>Review duration</strong>{formatSeconds(result.privateReviewPreview.durationSeconds)}</span>
                <span><strong>Review ranges</strong>{result.privateReviewPreview.keepSegmentCount ?? 0} kept, {result.privateReviewPreview.removeSegmentCount ?? 0} held back</span>
              </>
            ) : null}
            <span><strong>Main brain</strong>{result.qwenMainBrainLabel} identity recorded, no live call</span>
          </>
        ) : (
          <span>
            {sourceVideoUploadResult
              ? planApproved
                ? config.message
                : planApprovalBlockedMessage
              : 'Upload the source video to backend-local storage before running this test preview.'}
          </span>
        )}
      </div>
      {result ? (
        <ProjectEditBriefArtifactReviewPlayer
          apiBaseUrl={config.apiBaseUrl}
          artifactLabel="Preview"
          disabledMessage="Preview artifact is ready for private review."
          storageObjectRecordId={result.previewStorageObjectId}
          workspaceId={config.workspaceId}
        />
      ) : null}
      {error ? <p className="project-edit-brief-source-video-picker__error">{error}</p> : null}
      <p className="project-edit-brief-muted">
        Preview-only internal test path. No provider call, live Qwen call, external beta, production export, Supabase write, or GCS write is enabled.
      </p>
    </Card>
  )
}
