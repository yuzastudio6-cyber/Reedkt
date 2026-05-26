import {
  assertWorkerPayloadHasApprovedSnapshot,
  assertWorkerPayloadHasIdempotencyKey,
  assertWorkerPayloadHasNoRawPrompt,
  assertWorkerPayloadHasNoSignedUrls,
} from '../production/production-worker-gates'
import { assertWorkerPayloadHasNoForbiddenFields } from '../production/production-worker-artifact-policy'
import { buildSmartCutPlan } from './smart-cut-plan-builder'
import { buildSmartCutQAResults } from './smart-cut-qa-builder'
import type { SmartCutFoundationInput, SmartCutFoundationResult } from './smart-cut-worker-types'

export async function runSmartCutFoundation(input: SmartCutFoundationInput): Promise<SmartCutFoundationResult> {
  validateSmartCutFoundationInput(input)

  if (input.mode === 'production_blocked') {
    return {
      mode: input.mode,
      status: 'blocked',
      qualityGateResults: [],
      warnings: ['Milestone 8 refuses production smart cutting until future worker/render deployment milestones.'],
      skipReasons: ['production_cutting_blocked'],
    }
  }

  const plan = buildSmartCutPlan(withMockEvidenceIfDryRun(input))
  const qa = buildSmartCutQAResults({
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId,
    toolExecutionPlanId: input.toolExecutionPlanId,
    plan,
  })

  return {
    mode: input.mode,
    status: input.mode === 'dry_run' ? 'dry_run' : 'partial',
    smartCutPlan: plan,
    qualityGateResults: qa.qualityGateResults,
    cutListPreview: input.mode === 'local_dev' && input.localDevPreview
      ? {
        status: 'metadata_only',
        note: 'Milestone 8 localDevPreview creates cut-list metadata only; no FFmpeg media cutting is invoked.',
        removeSegments: plan.removeSegments,
        keepSegments: plan.keepSegments,
      }
      : undefined,
    warnings: [
      ...plan.warnings,
      ...qa.issues,
      'Milestone 8 produces edit-decision metadata only and does not cut source media.',
    ],
    skipReasons: input.mode === 'local_dev' && input.localDevPreview
      ? ['real_media_cutting_deferred']
      : [],
  }
}

function validateSmartCutFoundationInput(input: SmartCutFoundationInput): void {
  if (input.workerPayload) {
    assertWorkerPayloadHasApprovedSnapshot(input.workerPayload)
    assertWorkerPayloadHasIdempotencyKey(input.workerPayload)
    assertWorkerPayloadHasNoRawPrompt(input.workerPayload)
    assertWorkerPayloadHasNoSignedUrls(input.workerPayload)
    assertWorkerPayloadHasNoForbiddenFields(input.workerPayload)
  }
}

function withMockEvidenceIfDryRun(input: SmartCutFoundationInput): SmartCutFoundationInput {
  if (input.mode !== 'dry_run') return input
  if (input.transcriptSegments?.length || input.mediaAnalysisReport) return input
  return {
    ...input,
    mediaDurationSeconds: input.mediaDurationSeconds ?? 8,
    transcriptSegments: [
      {
        segmentId: 'smart-cut-mock-hook',
        startSeconds: 0,
        endSeconds: 2,
        text: 'Here is the important setup for this story.',
        confidence: 0.9,
        words: words('smart-cut-mock-hook', 0, 2, ['Here', 'is', 'the', 'important', 'setup', 'for', 'this', 'story.']),
      },
      {
        segmentId: 'smart-cut-mock-repeat-a',
        startSeconds: 2.4,
        endSeconds: 4,
        text: 'This take is ready for review.',
        confidence: 0.76,
        words: words('smart-cut-mock-repeat-a', 2.4, 4, ['This', 'take', 'is', 'ready', 'for', 'review.']),
      },
      {
        segmentId: 'smart-cut-mock-repeat-b',
        startSeconds: 4.3,
        endSeconds: 5.9,
        text: 'This take is ready for review.',
        confidence: 0.92,
        words: words('smart-cut-mock-repeat-b', 4.3, 5.9, ['This', 'take', 'is', 'ready', 'for', 'review.']),
      },
    ],
    wordTimestamps: [
      ...words('smart-cut-mock-hook', 0, 2, ['Here', 'is', 'the', 'important', 'setup', 'for', 'this', 'story.']),
      ...words('smart-cut-mock-repeat-a', 2.4, 4, ['This', 'take', 'is', 'ready', 'for', 'review.']),
      ...words('smart-cut-mock-repeat-b', 4.3, 5.9, ['This', 'take', 'is', 'ready', 'for', 'review.']),
    ],
    silenceSegments: [{ startSeconds: 2, endSeconds: 2.4, confidence: 0.8 }],
  }
}

function words(segmentId: string, start: number, end: number, tokens: string[]) {
  const duration = end - start
  return tokens.map((word, index) => ({
    word,
    startSeconds: Number((start + (duration / tokens.length) * index).toFixed(3)),
    endSeconds: Number((start + (duration / tokens.length) * (index + 1)).toFixed(3)),
    confidence: 0.9,
    segmentId,
  }))
}
