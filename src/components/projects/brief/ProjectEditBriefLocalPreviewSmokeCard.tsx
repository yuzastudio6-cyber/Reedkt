import { LoaderCircle, Play } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '../../Badge'
import { Button } from '../../Button'
import { Card } from '../../Card'
import {
  runProjectSourceVideoLocalEditPreviewSmoke,
} from '../../../lib/project-source-video-local-edit-preview-smoke'
import type {
  ProjectSourceVideoBackendUploadResult,
  ProjectSourceVideoLocalEditPreviewConfig,
  ProjectSourceVideoLocalEditPreviewResult,
  ProjectSourceVideoLocalEditPreviewStatus,
} from '../../../types/project-source-video'

type ProjectEditBriefLocalPreviewSmokeCardProps = {
  config: ProjectSourceVideoLocalEditPreviewConfig
  editSessionId: string
  projectId: string
  sourceVideoAspectRatio?: string
  sourceVideoDurationSeconds?: number
  sourceVideoUploadResult?: ProjectSourceVideoBackendUploadResult
}

type LocalPreviewRunState = {
  sourceKey?: string
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
  config,
  editSessionId,
  projectId,
  sourceVideoAspectRatio,
  sourceVideoDurationSeconds,
  sourceVideoUploadResult,
}: ProjectEditBriefLocalPreviewSmokeCardProps) {
  const [runState, setRunState] = useState<LocalPreviewRunState | undefined>()
  const sourceKey = sourceVideoUploadResult?.storageObjectRecordId
  const runStateMatchesSource = Boolean(sourceKey && runState?.sourceKey === sourceKey)
  const fallbackStatus: ProjectSourceVideoLocalEditPreviewStatus = !config.available
    ? 'unavailable'
    : sourceVideoUploadResult
      ? 'idle'
      : 'waiting_for_upload'
  const status = runStateMatchesSource ? runState?.status ?? fallbackStatus : fallbackStatus
  const result: ProjectSourceVideoLocalEditPreviewResult | undefined = runStateMatchesSource ? runState?.result : undefined
  const error = runStateMatchesSource ? runState?.error : undefined

  const disabled = !config.available || !sourceVideoUploadResult || status === 'running'

  async function runPreviewSmoke() {
    if (!config.available || !config.apiBaseUrl || !sourceVideoUploadResult) return
    const currentSourceKey = sourceVideoUploadResult.storageObjectRecordId
    setRunState({ sourceKey: currentSourceKey, status: 'running' })
    try {
      const previewResult = await runProjectSourceVideoLocalEditPreviewSmoke({
        apiBaseUrl: config.apiBaseUrl,
        editSessionId,
        projectId,
        workspaceId: config.workspaceId,
        sourceVideoUploadResult,
        sourceVideoDurationSeconds,
        sourceVideoAspectRatio,
      })
      setRunState({
        sourceKey: currentSourceKey,
        status: 'preview_ready',
        result: previewResult,
      })
    } catch (caught) {
      setRunState({
        sourceKey: currentSourceKey,
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
          <h3>Approve and render a test preview</h3>
          <p>
            Runs the internal approved-snapshot, credit-reservation, worker, and preview gates against the uploaded local source.
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
        {status === 'running' ? 'Creating preview' : 'Run local edit preview'}
      </Button>
      <div className="project-edit-brief-local-preview-smoke__status" data-testid="project-source-video-local-preview-smoke-status">
        {result ? (
          <>
            <span><strong>Preview object</strong>{result.outputBucketName}/{result.outputObjectPath}</span>
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
          <span>{sourceVideoUploadResult ? config.message : 'Upload the source video to backend-local storage before running this test preview.'}</span>
        )}
      </div>
      {error ? <p className="project-edit-brief-source-video-picker__error">{error}</p> : null}
      <p className="project-edit-brief-muted">
        Preview-only internal test path. No provider call, live Qwen call, external beta, production export, Supabase write, or GCS write is enabled.
      </p>
    </Card>
  )
}
