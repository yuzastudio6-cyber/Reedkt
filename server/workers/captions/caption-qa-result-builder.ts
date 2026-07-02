import type { QualityGateResult } from '../../../src/backend/contracts/quality-gate-contracts'
import type { QualityGateType } from '../../../src/backend/contracts/production-tool-runtime-contracts'
import type { CaptionPolicyIssue, CaptionPolicyScore } from './caption-worker-types'

export function buildCaptionQualityGateResult(input: {
  workspaceId: string
  projectId: string
  mediaAssetId: string
  toolExecutionPlanId: string
  recipeId?: string
  gateType: Extract<QualityGateType, 'caption_readability' | 'caption_timing' | 'caption_safe_zone' | 'transcript_alignment'>
  score: CaptionPolicyScore
  inputArtifactIds?: string[]
  outputArtifactIds?: string[]
  blocking?: boolean
}): QualityGateResult {
  const blockingIssues = input.score.issues.filter((issue) => issue.severity === 'blocking')
  return {
    id: `caption-gate-${input.gateType}-${input.mediaAssetId}`,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId,
    toolExecutionPlanId: input.toolExecutionPlanId,
    recipeId: input.recipeId ?? 'caption_recipe',
    gateType: input.gateType,
    status: blockingIssues.length > 0
      ? 'blocked'
      : input.score.score >= input.score.threshold
        ? 'passed'
        : 'warning',
    score: input.score.score,
    threshold: input.score.threshold,
    required: true,
    blocking: input.blocking ?? blockingIssues.length > 0,
    checkedAt: new Date().toISOString(),
    checkedByWorkerType: 'qa_worker',
    inputArtifactIds: input.inputArtifactIds ?? [],
    outputArtifactIds: input.outputArtifactIds ?? [],
    issues: input.score.issues.map((issue) => ({
      code: issue.code,
      message: issue.message,
      severity: issue.severity,
    })),
    recommendations: input.score.recommendations.map((recommendation) => ({
      action: recommendation,
      reason: `Milestone 7 ${input.gateType} deterministic QA.`,
      priority: 'normal',
    })),
    fallbackRequired: blockingIssues.length > 0,
    blocksPreview: blockingIssues.length > 0,
    blocksFinalExport: input.score.score < input.score.threshold || blockingIssues.length > 0,
    humanReviewRequired: input.score.issues.some((issue) => issue.code.includes('safe_zone') || issue.code.includes('ocr')),
  }
}

export function scoreFromIssues(issues: CaptionPolicyIssue[], threshold: number): CaptionPolicyScore {
  return {
    score: Math.max(0, 1 - issues.length * 0.12),
    threshold,
    issues,
    recommendations: issues.length > 0 ? ['Review caption placement and timing before preview/export.'] : ['Gate passed.'],
  }
}
