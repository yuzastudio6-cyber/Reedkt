import { buildHyperframeTimelineBridge } from '../timeline/hyperframe-timeline-bridge'
import { buildOpenTimelineIOStyleManifest } from '../timeline/opentimelineio-manifest-builder'
import { buildRemotionCompositionManifest } from '../timeline/remotion-composition-manifest-bridge'
import { buildTimelineExecutionManifest } from '../timeline/timeline-execution-manifest-builder'
import { buildTimelineExecutionQAResults } from '../timeline/timeline-execution-qa-builder'
import { buildSmartCutPlan } from '../smart-cut/smart-cut-plan-builder'
import { buildSmartCutExecutionArtifact } from '../smart-cut/smart-cut-execution-artifact-writer'
import { buildSmartCutExecutionPlan } from '../smart-cut/smart-cut-execution-plan-builder'
import { buildSmartCutFfmpegCommandPlan } from '../smart-cut/smart-cut-ffmpeg-command-builder'
import { buildSmartCutExecutionQAResults } from '../smart-cut/smart-cut-execution-qa-builder'
import { runSmartCutProxyPreview } from '../smart-cut/smart-cut-preview-runner'
import { validateSmartCutTimelineExecutionPolicy } from '../smart-cut/smart-cut-execution-policy'
import { validateSmartCutExecutionPlan, validateSmartCutPlanForExecution } from '../smart-cut/smart-cut-execution-validator'
import { buildSmartCutTimelineExecutionResult } from './smart-cut-timeline-result-builder'
import type { QualityGateResult } from '../../../src/backend/contracts/quality-gate-contracts'
import type {
  SmartCutTimelineExecutionInput,
  SmartCutTimelineExecutionResult,
} from './smart-cut-timeline-execution-pipeline-types'

export async function runSmartCutTimelineExecutionPipeline(
  input: SmartCutTimelineExecutionInput,
): Promise<SmartCutTimelineExecutionResult> {
  const policy = validateSmartCutTimelineExecutionPolicy(input)
  if (!policy.allowed) {
    return buildSmartCutTimelineExecutionResult({
      executionInput: input,
      status: 'blocked',
      artifacts: [],
      qaResults: [],
      skippedReasons: policy.blockingReasons,
      warnings: policy.warnings,
      blocksPreview: true,
      blocksFinalExport: true,
    })
  }

  const smartCutPlan = input.smartCutPlan ?? buildSmartCutPlan({
    mode: 'dry_run',
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId,
    approvedSnapshotId: input.approvedSnapshotId,
    toolExecutionPlanId: input.toolExecutionPlanId,
    idempotencyKey: input.idempotencyKey,
    mediaDurationSeconds: input.mediaDurationSeconds ?? 8,
  })
  const planValidation = validateSmartCutPlanForExecution({ plan: smartCutPlan, executionInput: input })
  const executionPlan = buildSmartCutExecutionPlan({ smartCutPlan, executionInput: input })
  const executionValidation = validateSmartCutExecutionPlan({ executionPlan, executionInput: input })
  const combinedValidation = {
    valid: planValidation.valid && executionValidation.valid,
    issues: [...planValidation.issues, ...executionValidation.issues],
  }
  const ffmpegCommandPlan = buildSmartCutFfmpegCommandPlan({ executionPlan, executionInput: input })
  const previewResult = await runSmartCutProxyPreview({ executionInput: input, commandPlan: ffmpegCommandPlan })
  const timelineManifest = buildTimelineExecutionManifest({
    ...input,
    executionPlan,
    ffmpegCommandPlan,
  })
  const otioManifest = buildOpenTimelineIOStyleManifest({
    timelineManifest,
    mediaReferencePath: input.sourceStorageObjectPath ?? `reeditpro://${input.mediaAssetId}/source-or-proxy`,
    fps: input.fps,
  })
  const hyperframeBridge = buildHyperframeTimelineBridge(timelineManifest)
  const remotionManifest = buildRemotionCompositionManifest({
    timelineManifest,
    fps: input.fps,
    canvas: input.canvas,
    captionArtifactIds: input.captionArtifactIds,
  })
  const smartCutQa = buildSmartCutExecutionQAResults({
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId,
    toolExecutionPlanId: input.toolExecutionPlanId,
    executionPlan,
    validation: combinedValidation,
    previewResult,
  })
  const timelineQa = buildTimelineExecutionQAResults({
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId,
    toolExecutionPlanId: input.toolExecutionPlanId,
    timelineManifest,
    previewResult,
  })
  const qaResults = dedupeQaResults([...smartCutQa, ...timelineQa])
  const artifactMode = input.mode === 'local_dev' ? 'local_dev' : input.mode === 'container_ready' ? 'container_ready' : input.mode === 'production_ready' ? 'production_ready' : 'dry_run'
  const artifactRecords = await Promise.all([
    buildSmartCutExecutionArtifact({
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      mediaAssetId: input.mediaAssetId,
      artifactType: 'timeline_manifest',
      fileName: 'm14-smart-cut-execution-plan.json',
      payload: { executionPlan, timelineManifest, ffmpegCommandPlan },
      outputDirectory: input.outputDirectory,
      mode: artifactMode,
      sourceOfTruth: true,
    }),
    buildSmartCutExecutionArtifact({
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
    buildSmartCutExecutionArtifact({
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      mediaAssetId: input.mediaAssetId,
      artifactType: 'qa_report',
      fileName: 'm14-smart-cut-timeline-qa.json',
      payload: qaResults,
      outputDirectory: input.outputDirectory,
      mode: artifactMode,
      sourceOfTruth: false,
    }),
  ])
  const artifacts = [
    ...artifactRecords.map((item) => item.artifact),
    ...(previewResult.artifact ? [previewResult.artifact] : []),
  ]
  const blockingQa = qaResults.some((gate) => gate.blocking)
  const blocked = !combinedValidation.valid || blockingQa

  return buildSmartCutTimelineExecutionResult({
    executionInput: input,
    status: blocked ? 'blocked' : input.mode === 'container_ready' ? 'container_ready' : input.mode === 'dry_run' ? 'dry_run' : 'partial',
    executionPlan,
    ffmpegCommandPlan,
    timelineManifest,
    otioManifest,
    hyperframeBridge,
    remotionManifest,
    previewArtifact: previewResult.artifact,
    artifacts,
    qaResults,
    skippedReasons: previewResult.status === 'skipped' && previewResult.skipReason ? [previewResult.skipReason] : [],
    warnings: [
      ...policy.warnings,
      ...combinedValidation.issues.filter((issue) => issue.severity === 'warning').map((issue) => issue.message),
      ...(previewResult.status === 'failed' && previewResult.errorMessage ? [previewResult.errorMessage] : []),
      'Milestone 14 does not perform final export, full Remotion render, evaluation-only video runtime, audio cleanup, color, or mask execution.',
    ],
    blocksPreview: combinedValidation.issues.some((issue) => issue.severity === 'blocking'),
    blocksFinalExport: true,
  })
}

function dedupeQaResults(results: QualityGateResult[]): QualityGateResult[] {
  const seen = new Set<string>()
  return results.filter((result) => {
    const key = result.gateType
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
