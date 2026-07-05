import { Download, LockKeyhole } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../Button'
import { Card } from '../../Card'
import { runProjectSourceVideoLocalFinalExportSmoke } from '../../../lib/project-source-video-local-final-export-smoke'
import type {
  ProjectSourceVideoBackendUploadResult,
  ProjectSourceVideoLocalEditPreviewResult,
  ProjectSourceVideoLocalFinalExportResult,
  ProjectSourceVideoPreviewReviewResult,
  ProjectSourceVideoProfessionalQAResult,
} from '../../../types/project-source-video'

type ProjectEditBriefFinalExportCardProps = {
  apiBaseUrl?: string
  editPlanId?: string
  finalExportResult?: ProjectSourceVideoLocalFinalExportResult
  onFinalExportReady: (result: ProjectSourceVideoLocalFinalExportResult) => Promise<void> | void
  onStatusMessage?: (message: string) => void
  previewResult?: ProjectSourceVideoLocalEditPreviewResult
  previewReviewResult?: ProjectSourceVideoPreviewReviewResult
  professionalQAResult?: ProjectSourceVideoProfessionalQAResult
  projectId: string
  sourceVideoUploadResult?: ProjectSourceVideoBackendUploadResult
  workspaceId: string
}

function formatBytes(value: number | undefined): string {
  if (!value) return 'Size pending'
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / (1024 * 1024)).toFixed(2)} MB`
}

export function ProjectEditBriefFinalExportCard({
  apiBaseUrl,
  editPlanId,
  finalExportResult,
  onFinalExportReady,
  onStatusMessage,
  previewResult,
  previewReviewResult,
  professionalQAResult,
  projectId,
  sourceVideoUploadResult,
  workspaceId,
}: ProjectEditBriefFinalExportCardProps) {
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const canRun = Boolean(
    apiBaseUrl &&
    editPlanId &&
    sourceVideoUploadResult &&
    previewResult?.status === 'preview_ready' &&
    previewReviewResult?.reviewStatus === 'approved' &&
    professionalQAResult?.status === 'passed',
  )

  async function runFinalExport() {
    if (!apiBaseUrl || !editPlanId || !previewResult || !previewReviewResult || !professionalQAResult || !sourceVideoUploadResult || running) return
    setRunning(true)
    setError(undefined)
    onStatusMessage?.('Creating private final export for internal testing.')
    try {
      const result = await runProjectSourceVideoLocalFinalExportSmoke({
        apiBaseUrl,
        editPlanId,
        previewResult,
        previewReviewResult,
        professionalQAResult,
        projectId,
        sourceVideoUploadResult,
        workspaceId,
      })
      await onFinalExportReady(result)
      onStatusMessage?.('Private final export is ready for internal review.')
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Private final export failed safely.'
      setError(message)
      onStatusMessage?.(message)
    } finally {
      setRunning(false)
    }
  }

  return (
    <Card className="project-edit-brief-final-export" data-testid="project-edit-final-export-card">
      <div className="project-edit-brief-final-export__header">
        <span className="section-eyebrow">Private export</span>
        <LockKeyhole aria-hidden="true" size={18} />
      </div>
      <h3>Internal final export</h3>
      <p>
        Create a private test export only after preview approval. Public delivery, signed links, billing settlement,
        external beta, and production stay blocked.
      </p>

      {finalExportResult ? (
        <div className="project-edit-brief-final-export__result" data-testid="project-edit-final-export-result">
          <strong>Export ready</strong>
          <span>{formatBytes(finalExportResult.sizeBytes)}</span>
          <span>{finalExportResult.professionalQA?.id ?? 'Professional QA checkpoint carried into export'}</span>
          {finalExportResult.editAssembly ? <span>{finalExportResult.editAssembly.planStepCount} approved plan steps carried into the export</span> : null}
          <span>{finalExportResult.outputObjectPath ?? 'Private object path recorded'}</span>
          <span>{finalExportResult.checksumSha256 ? `Checksum ${finalExportResult.checksumSha256.slice(0, 12)}` : 'Checksum pending'}</span>
        </div>
      ) : null}

      {error ? <p className="project-edit-brief-final-export__error" role="alert">{error}</p> : null}

      <Button disabled={!canRun || running} icon={Download} onClick={runFinalExport}>
        {running ? 'Creating export...' : finalExportResult ? 'Create again' : 'Create private export'}
      </Button>

      {!canRun ? (
        <p className="project-edit-brief-final-export__hint">
          Save the brief, approve the plan, run the preview, approve the preview, and pass QA before creating a private export.
        </p>
      ) : null}
    </Card>
  )
}
