import { buildHyperframeTimelineBridge } from './hyperframe-timeline-bridge'
import { buildOpenTimelineIOStyleManifest } from './opentimelineio-manifest-builder'
import { buildRemotionCompositionManifest } from './remotion-composition-manifest-bridge'
import { buildTimelineExecutionArtifact } from './timeline-execution-artifact-writer'
import { buildTimelineExecutionManifest } from './timeline-execution-manifest-builder'
import { buildTimelinePreviewCommandPlan } from './timeline-preview-command-builder'
import { buildTimelineExecutionQAResults } from './timeline-execution-qa-builder'
import { validateTimelineExecutionPolicy } from './timeline-execution-policy'
import type { TimelineExecutionInput, TimelineExecutionResult } from './timeline-execution-types'

export async function runTimelineExecution(input: TimelineExecutionInput): Promise<TimelineExecutionResult> {
  const policy = validateTimelineExecutionPolicy(input)
  if (!policy.allowed) {
    return {
      mode: input.mode,
      status: 'blocked',
      artifacts: [],
      qaResults: [],
      warnings: policy.warnings,
      skippedReasons: policy.blockingReasons,
    }
  }

  const timelineManifest = buildTimelineExecutionManifest(input)
  const mediaReferencePath = input.sourceStorageObjectPath ?? `reeditpro://${input.mediaAssetId}/source-or-proxy`
  const otioManifest = buildOpenTimelineIOStyleManifest({
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
  const previewCommandPlan = buildTimelinePreviewCommandPlan({
    mode: input.mode,
    ffmpegCommandPlan: input.ffmpegCommandPlan,
  })
  const qaResults = buildTimelineExecutionQAResults({
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId,
    toolExecutionPlanId: input.toolExecutionPlanId,
    timelineManifest,
  })
  const artifactMode = input.mode === 'local_dev' ? 'local_dev' : input.mode === 'container_ready' ? 'container_ready' : input.mode === 'production_ready' ? 'production_ready' : 'dry_run'
  const artifacts = await Promise.all([
    buildTimelineExecutionArtifact({
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      mediaAssetId: input.mediaAssetId,
      artifactType: 'timeline_manifest',
      fileName: 'm14-timeline-execution.json',
      payload: timelineManifest,
      outputDirectory: input.outputDirectory,
      mode: artifactMode,
      sourceOfTruth: true,
    }),
    buildTimelineExecutionArtifact({
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      mediaAssetId: input.mediaAssetId,
      artifactType: 'opentimelineio_manifest',
      fileName: 'm14-opentimelineio-style.json',
      payload: otioManifest,
      outputDirectory: input.outputDirectory,
      mode: artifactMode,
      sourceOfTruth: true,
    }),
    buildTimelineExecutionArtifact({
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      mediaAssetId: input.mediaAssetId,
      artifactType: 'qa_report',
      fileName: 'm14-timeline-qa.json',
      payload: qaResults,
      outputDirectory: input.outputDirectory,
      mode: artifactMode,
      sourceOfTruth: false,
    }),
  ])

  return {
    mode: input.mode,
    status: input.mode === 'container_ready' ? 'container_ready' : input.mode === 'dry_run' ? 'dry_run' : 'partial',
    timelineManifest,
    otioManifest,
    hyperframeBridge,
    remotionManifest,
    previewCommandPlan,
    artifacts: artifacts.map((item) => item.artifact),
    qaResults,
    warnings: [
      ...policy.warnings,
      'Timeline execution produced metadata only; no full render/export runtime was invoked.',
    ],
    skippedReasons: [],
  }
}
