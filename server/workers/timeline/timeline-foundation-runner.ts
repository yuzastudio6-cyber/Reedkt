import {
  assertWorkerPayloadHasApprovedSnapshot,
  assertWorkerPayloadHasIdempotencyKey,
  assertWorkerPayloadHasNoRawPrompt,
  assertWorkerPayloadHasNoSignedUrls,
} from '../production/production-worker-gates'
import { assertWorkerPayloadHasNoForbiddenFields } from '../production/production-worker-artifact-policy'
import { buildHyperframeTimelineBridge } from './hyperframe-timeline-bridge'
import { buildOpenTimelineIOStyleManifest } from './opentimelineio-manifest-builder'
import { buildRemotionCompositionManifest } from './remotion-composition-manifest-bridge'
import { buildReeditproTimelineManifest } from './reeditpro-timeline-builder'
import { buildTimelineArtifact } from './timeline-artifact-builder'
import { buildTimelineQAResults } from './timeline-qa-builder'
import type { TimelineBuildInput, TimelineBuildResult } from './timeline-worker-types'

export async function runTimelineFoundation(input: TimelineBuildInput): Promise<TimelineBuildResult> {
  validateTimelineFoundationInput(input)

  if (input.mode === 'production_blocked') {
    return {
      mode: input.mode,
      status: 'blocked',
      artifacts: [],
      qualityGateResults: [],
      warnings: ['Milestone 8 refuses production cutting, rendering, and export.'],
      skipReasons: ['production_timeline_render_blocked'],
    }
  }

  const timelineManifest = buildReeditproTimelineManifest(input)
  const mediaReferencePath = input.sourceStorageObjectPath ?? `reeditpro://${input.mediaAssetId}/source`
  const opentimelineioManifest = buildOpenTimelineIOStyleManifest({
    timelineManifest,
    mediaReferencePath,
    fps: input.fps,
  })
  const hyperframeBridge = buildHyperframeTimelineBridge(timelineManifest)
  const remotionManifest = buildRemotionCompositionManifest({
    timelineManifest,
    fps: input.fps,
    canvas: input.canvas,
    captionArtifactIds: input.captionArtifactIds,
  })
  const qualityGateResults = buildTimelineQAResults({
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId,
    toolExecutionPlanId: input.toolExecutionPlanId,
    timelineManifest,
  })
  const artifactMode = input.mode === 'local_dev' ? 'local_dev' : 'dry_run'
  const artifacts = await Promise.all([
    buildTimelineArtifact({
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      mediaAssetId: input.mediaAssetId,
      artifactType: 'timeline_manifest',
      fileName: 'reeditpro-timeline.json',
      payload: timelineManifest,
      outputRoot: input.outputRoot,
      mode: artifactMode,
      sourceOfTruth: true,
    }),
    buildTimelineArtifact({
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      mediaAssetId: input.mediaAssetId,
      artifactType: 'opentimelineio_manifest',
      fileName: 'opentimelineio-style.json',
      payload: opentimelineioManifest,
      outputRoot: input.outputRoot,
      mode: artifactMode,
      sourceOfTruth: true,
    }),
    buildTimelineArtifact({
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      mediaAssetId: input.mediaAssetId,
      artifactType: 'qa_report',
      fileName: 'timeline-qa.json',
      payload: qualityGateResults,
      outputRoot: input.outputRoot,
      mode: artifactMode,
      sourceOfTruth: false,
    }),
  ])

  return {
    mode: input.mode,
    status: input.mode === 'dry_run' ? 'dry_run' : 'partial',
    timelineManifest,
    opentimelineioManifest,
    hyperframeBridge,
    remotionManifest,
    artifacts: artifacts.map((item) => item.artifact),
    qualityGateResults,
    warnings: [
      'Timeline foundation created metadata only; no render, export, or frontend runtime was invoked.',
      ...qualityGateResults.flatMap((gate) => gate.issues.map((issue) => issue.message)),
    ],
    skipReasons: [],
  }
}

function validateTimelineFoundationInput(input: TimelineBuildInput): void {
  if (input.workerPayload) {
    assertWorkerPayloadHasApprovedSnapshot(input.workerPayload)
    assertWorkerPayloadHasIdempotencyKey(input.workerPayload)
    assertWorkerPayloadHasNoRawPrompt(input.workerPayload)
    assertWorkerPayloadHasNoSignedUrls(input.workerPayload)
    assertWorkerPayloadHasNoForbiddenFields(input.workerPayload)
  }
}
