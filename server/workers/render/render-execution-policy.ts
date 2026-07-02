import { assertNoPathTraversal, assertNoSignedUrlOrRawUrl } from '../media/media-path-safety'
import { assertWorkerPayloadHasNoForbiddenFields } from '../production/production-worker-artifact-policy'
import {
  assertWorkerPayloadHasApprovedSnapshot,
  assertWorkerPayloadHasIdempotencyKey,
  assertWorkerPayloadHasNoRawPrompt,
  assertWorkerPayloadHasNoSignedUrls,
} from '../production/production-worker-gates'
import type { FinalRenderExecutionInput } from './render-execution-types'

const forbiddenInputKeys = [
  'rawPrompt',
  'promptText',
  'rawUserChat',
  'signedUrl',
  'serviceRoleKey',
  'providerApiKey',
  'secretValue',
] as const

export function validateRenderExecutionPolicy(input: FinalRenderExecutionInput): {
  allowed: boolean
  blockingReasons: string[]
  warnings: string[]
} {
  rejectForbiddenInputFields(input)
  rejectUnsafeReferences(input)

  if (input.workerPayload) {
    assertWorkerPayloadHasApprovedSnapshot(input.workerPayload)
    assertWorkerPayloadHasIdempotencyKey(input.workerPayload)
    assertWorkerPayloadHasNoRawPrompt(input.workerPayload)
    assertWorkerPayloadHasNoSignedUrls(input.workerPayload)
    assertWorkerPayloadHasNoForbiddenFields(input.workerPayload)
  }

  const blockingReasons: string[] = []
  const warnings: string[] = []

  if (input.allowRevideo === true) blockingReasons.push('revideo_blocked_in_m16a')
  if ((input.arbitraryFfmpegArgs?.length ?? 0) > 0) blockingReasons.push('arbitrary_ffmpeg_args_blocked')
  if ((input.arbitraryRemotionArgs?.length ?? 0) > 0) blockingReasons.push('arbitrary_remotion_args_blocked')
  if ((input.arbitraryLibassArgs?.length ?? 0) > 0) blockingReasons.push('arbitrary_libass_args_blocked')
  if (input.mode === 'production_blocked') blockingReasons.push('production_final_render_blocked_in_m16a')

  if (input.renderMode === 'final_export') {
    const failedUpstream = (input.upstreamQaResults ?? []).filter((gate) => gate.blocking || gate.status === 'failed' || gate.status === 'blocked')
    if (failedUpstream.length > 0) blockingReasons.push('blocking_upstream_qa_gates_present')
  }

  if (input.mode === 'production_ready') {
    for (const [fieldName, value] of [
      ['approvedSnapshotId', input.approvedSnapshotId],
      ['toolExecutionPlanId', input.toolExecutionPlanId],
      ['idempotencyKey', input.idempotencyKey],
    ] as const) {
      if (!value) blockingReasons.push(`${fieldName}_required_for_production_ready`)
    }
    const hasPrivateRefs = [
      input.timelineManifestId,
      input.renderManifestId,
      ...(input.sourceVideoArtifactIds ?? []),
      ...(input.proxyVideoArtifactIds ?? []),
      ...(input.captionArtifactIds ?? []),
      ...(input.audioArtifactIds ?? []),
    ].some(Boolean)
    if (!hasPrivateRefs) blockingReasons.push('private_render_input_artifact_required')
    if (input.readinessReport?.overallStatus !== 'passed') blockingReasons.push('render_readiness_report_not_passed')
    if ((input.readinessReport?.blockers?.length ?? 0) > 0 || (input.readinessReport?.blockerSummaries?.length ?? 0) > 0) {
      blockingReasons.push('render_readiness_blockers_present')
    }
  }

  if (input.mode === 'local_dev' && input.enableLocalDevRender !== true) warnings.push('local_dev_ffmpeg_render_disabled')
  if (input.mode === 'local_dev' && input.enableRemotionLocalRender !== true) warnings.push('local_dev_remotion_render_disabled')
  if (input.mode === 'local_dev' && input.enableCaptionBurnIn !== true) warnings.push('local_dev_caption_burnin_disabled')

  return { allowed: blockingReasons.length === 0, blockingReasons, warnings }
}

function rejectForbiddenInputFields(input: FinalRenderExecutionInput): void {
  for (const key of forbiddenInputKeys) {
    if (input[key] !== undefined) {
      throw new Error(`M16A final render execution rejects forbidden field: ${key}.`)
    }
  }
}

function rejectUnsafeReferences(input: FinalRenderExecutionInput): void {
  const pathGroups = [
    ['sourceLocalPath', input.sourceLocalPaths ?? []],
    ['proxyLocalPath', input.proxyLocalPaths ?? []],
    ['captionLocalPath', input.captionLocalPaths ?? []],
    ['audioLocalPath', input.audioLocalPaths ?? []],
    ['outputDirectory', input.outputDirectory ? [input.outputDirectory] : []],
  ] as const
  for (const [label, values] of pathGroups) {
    for (const value of values) {
      assertNoSignedUrlOrRawUrl(value, label)
      assertNoPathTraversal(value, label)
    }
  }
}
