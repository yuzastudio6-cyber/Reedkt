import { runEnhancementExecution } from '../enhancement'
import type { EnhancementExecutionInput } from '../enhancement'
import { runSlowMotionExecution } from '../slow-motion'
import type { SlowMotionExecutionInput } from '../slow-motion'
import { buildEnhancementSlowMotionPipelineResult } from './enhancement-slowmotion-result-builder'
import type { EnhancementSlowMotionPipelineInput, EnhancementSlowMotionPipelineResult } from './enhancement-slowmotion-pipeline-types'

export async function runEnhancementSlowMotionPipeline(input: EnhancementSlowMotionPipelineInput): Promise<EnhancementSlowMotionPipelineResult> {
  const buildEnhancement = input.buildEnhancement !== false
  const buildSlowMotion = input.buildSlowMotion !== false
  const enhancementResult = buildEnhancement
    ? await runEnhancementExecution(buildEnhancementInput(input))
    : undefined
  const slowMotionResult = buildSlowMotion
    ? await runSlowMotionExecution(buildSlowMotionInput(input))
    : undefined
  return buildEnhancementSlowMotionPipelineResult({
    mode: input.mode,
    enhancementResult,
    slowMotionResult,
  })
}

function buildEnhancementInput(input: EnhancementSlowMotionPipelineInput): EnhancementExecutionInput {
  return {
    mode: input.mode,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId,
    approvedSnapshotId: input.approvedSnapshotId,
    toolExecutionPlanId: input.toolExecutionPlanId,
    idempotencyKey: input.idempotencyKey,
    workerPayload: input.workerPayload,
    mediaAnalysisReportId: input.mediaAnalysisReportId,
    sourceImageArtifactId: input.sourceImageArtifactId,
    sourceVideoArtifactId: input.sourceVideoArtifactId,
    proxyVideoArtifactId: input.proxyVideoArtifactId,
    representativeFrameArtifactIds: input.representativeFrameArtifactIds,
    sourceImageLocalPath: input.sourceImageLocalPath,
    sourceVideoLocalPath: input.sourceVideoLocalPath,
    proxyVideoLocalPath: input.proxyVideoLocalPath,
    representativeFrameLocalPaths: input.representativeFrameLocalPaths,
    outputDirectory: input.outputDirectory,
    modelWeightManifestIds: input.modelWeightManifestIds,
    readinessReport: input.readinessReport,
    enhancementIntent: 'improve_low_resolution_clip',
    sourceQualityIssueDetected: true,
    sampleOnly: true,
    ...input.enhancement,
  }
}

function buildSlowMotionInput(input: EnhancementSlowMotionPipelineInput): SlowMotionExecutionInput {
  return {
    mode: input.mode,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId,
    approvedSnapshotId: input.approvedSnapshotId,
    toolExecutionPlanId: input.toolExecutionPlanId,
    idempotencyKey: input.idempotencyKey,
    workerPayload: input.workerPayload,
    mediaAnalysisReportId: input.mediaAnalysisReportId,
    sourceVideoArtifactId: input.sourceVideoArtifactId,
    proxyVideoArtifactId: input.proxyVideoArtifactId,
    sourceVideoLocalPath: input.sourceVideoLocalPath,
    proxyVideoLocalPath: input.proxyVideoLocalPath,
    outputDirectory: input.outputDirectory,
    modelWeightManifestIds: input.modelWeightManifestIds,
    readinessReport: input.readinessReport,
    selectedClipRanges: [{ startSeconds: 0, endSeconds: 2, reason: 'M15D dry-run selected sample clip.' }],
    slowMotionFactor: 2,
    interpolationMode: 'film',
    ...input.slowMotion,
  }
}
