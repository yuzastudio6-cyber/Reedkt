import { useEffect, useState } from 'react'
import { Eye, LoaderCircle } from 'lucide-react'
import { Button } from '../../Button'
import {
  loadProjectSourceVideoLocalArtifactForReview,
  revokeProjectSourceVideoLocalArtifactReviewObject,
  type ProjectSourceVideoLocalArtifactReviewObject,
} from '../../../lib/project-source-video-local-artifact-review'

type ProjectEditBriefArtifactReviewPlayerProps = {
  apiBaseUrl?: string
  artifactLabel: string
  disabledMessage: string
  storageObjectRecordId?: string
  workspaceId: string
}

function formatBytes(value: number | undefined): string {
  if (!value) return 'Size pending'
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / (1024 * 1024)).toFixed(2)} MB`
}

export function ProjectEditBriefArtifactReviewPlayer({
  apiBaseUrl,
  artifactLabel,
  disabledMessage,
  storageObjectRecordId,
  workspaceId,
}: ProjectEditBriefArtifactReviewPlayerProps) {
  const [artifact, setArtifact] = useState<ProjectSourceVideoLocalArtifactReviewObject | undefined>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const canLoad = Boolean(apiBaseUrl && storageObjectRecordId)
  const visibleArtifact = artifact?.storageObjectRecordId === storageObjectRecordId ? artifact : undefined

  useEffect(() => () => {
    revokeProjectSourceVideoLocalArtifactReviewObject(artifact)
  }, [artifact])

  async function loadArtifact() {
    if (!apiBaseUrl || !storageObjectRecordId || loading) return
    setLoading(true)
    setError(undefined)
    try {
      const result = await loadProjectSourceVideoLocalArtifactForReview({
        apiBaseUrl,
        storageObjectRecordId,
        workspaceId,
      })
      setArtifact((current) => {
        revokeProjectSourceVideoLocalArtifactReviewObject(current)
        return result
      })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Private review playback failed safely.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="project-edit-brief-artifact-review" data-testid={`project-edit-${artifactLabel.toLowerCase().replace(/\s+/g, '-')}-review-player`}>
      <div className="project-edit-brief-artifact-review__header">
        <div>
          <strong>{artifactLabel}</strong>
          <span>{visibleArtifact ? `${visibleArtifact.mimeType} · ${formatBytes(visibleArtifact.sizeBytes)}` : disabledMessage}</span>
        </div>
        <Button
          disabled={!canLoad || loading}
          icon={loading ? LoaderCircle : Eye}
          onClick={loadArtifact}
          size="sm"
          type="button"
          variant="secondary"
        >
          {visibleArtifact ? 'Reload' : 'Review'}
        </Button>
      </div>
      {visibleArtifact ? (
        <video
          className="project-edit-brief-artifact-review__video"
          controls
          data-testid="project-edit-private-artifact-video"
          playsInline
          preload="metadata"
          src={visibleArtifact.objectUrl}
        />
      ) : null}
      {error ? <p className="project-edit-brief-source-video-picker__error">{error}</p> : null}
      {visibleArtifact ? (
        <p className="project-edit-brief-muted">
          Private local review object only. No signed URL, public delivery, provider call, external beta, or production release was created.
        </p>
      ) : null}
    </div>
  )
}
