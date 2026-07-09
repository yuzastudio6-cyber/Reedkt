import { AlertTriangle, ShieldCheck } from 'lucide-react'
import { Badge } from '../../Badge'
import { Button } from '../../Button'
import { Card } from '../../Card'
import { previewReviewMatchesPreview } from '../../../lib/project-edit-evidence-lineage'
import { createProjectSourceVideoProfessionalQA } from '../../../lib/project-source-video-professional-qa'
import type {
  ProjectSourceVideoBackendUploadResult,
  ProjectSourceVideoLocalEditPreviewResult,
  ProjectSourceVideoPreviewReviewResult,
  ProjectSourceVideoProfessionalQAResult,
} from '../../../types/project-source-video'

type ProjectEditBriefProfessionalQACardProps = {
  onQARecorded?: (result: ProjectSourceVideoProfessionalQAResult) => void
  previewResult?: ProjectSourceVideoLocalEditPreviewResult
  previewReviewResult?: ProjectSourceVideoPreviewReviewResult
  professionalQAResult?: ProjectSourceVideoProfessionalQAResult
  sourceVideoUploadResult?: ProjectSourceVideoBackendUploadResult
  workspaceId: string
}

export function ProjectEditBriefProfessionalQACard({
  onQARecorded,
  previewResult,
  previewReviewResult,
  professionalQAResult,
  sourceVideoUploadResult,
  workspaceId,
}: ProjectEditBriefProfessionalQACardProps) {
  const canRun = previewResult?.status === 'preview_ready' &&
    previewReviewResult?.reviewStatus === 'approved' &&
    previewReviewMatchesPreview({ previewResult, previewReviewResult })
  const visibleResult = professionalQAResult

  function runQA() {
    const result = createProjectSourceVideoProfessionalQA({
      previewResult,
      previewReviewResult,
      sourceVideoUploadResult,
      workspaceId,
    })
    onQARecorded?.(result)
  }

  return (
    <Card className="project-edit-brief-professional-qa" data-testid="project-edit-professional-qa-card">
      <div className="project-edit-brief-local-preview-smoke__header">
        <div>
          <span className="section-eyebrow">Review check</span>
          <h3>Professional QA checkpoint</h3>
          <p>
            Confirm the approved preview has the required plan, approval, private artifact, and handoff evidence before
            a private export can be created.
          </p>
        </div>
        <Badge accent={visibleResult?.status === 'passed' ? 'success' : visibleResult?.status === 'blocked' ? 'danger' : 'cyan'}>
          {visibleResult?.status ?? 'waiting'}
        </Badge>
      </div>

      {visibleResult ? (
        <div className="project-edit-brief-professional-qa__checks" data-testid="project-edit-professional-qa-result">
          {visibleResult.checks.map((item) => (
            <span key={item.id} data-state={item.passed ? 'passed' : 'blocked'}>
              <strong>{item.label}</strong>
              {item.passed ? 'Ready' : item.blocker.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      ) : (
        <p className="project-edit-brief-muted">
          {canRun
            ? 'Run this check after approving the preview. It records readiness only; no media or public delivery starts.'
            : 'Approve the preview before running the QA checkpoint.'}
        </p>
      )}

      <Button
        disabled={!canRun}
        icon={visibleResult?.status === 'blocked' ? AlertTriangle : ShieldCheck}
        onClick={runQA}
        type="button"
        variant={visibleResult?.status === 'passed' ? 'secondary' : 'primary'}
      >
        {visibleResult ? 'Run check again' : 'Run QA check'}
      </Button>
    </Card>
  )
}
