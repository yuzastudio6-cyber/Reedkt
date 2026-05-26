import { buildAudioAnalysisSummary } from './audio-analysis-adapter'
import { buildAudioExecutionPlan } from './audio-execution-plan-builder'
import { validateAudioExecutionPolicy } from './audio-execution-policy'
import { validateAudioExecutionInput, validateAudioExecutionPlan } from './audio-execution-validator'
import { runFFmpegLoudnessExecution } from './ffmpeg-loudness-execution-runner'
import { runFFmpegNormalizationExecution } from './ffmpeg-normalization-execution-runner'
import { runAudioCleanupExecution } from './audio-cleanup-execution-runner'
import { buildMusicDuckingExecutionPlan } from './music-ducking-execution-plan-builder'
import { buildAudioExecutionQAResults } from './audio-execution-qa-builder'
import { buildAudioExecutionArtifact } from './audio-execution-artifact-writer'
import { buildSoundSyncCueArtifact } from './soundsync-artifact-writer'
import { buildSoundSyncCuePlan } from './soundsync-cue-planner'
import { buildAudioExecutionResult } from './audio-execution-result-builder'
import type { AudioFoundationRunnerInput, AudioToolSkipReason } from './audio-foundation-types'
import type { AudioExecutionInput, AudioExecutionResult } from './audio-execution-types'

export async function runAudioExecution(input: AudioExecutionInput): Promise<AudioExecutionResult> {
  const policy = validateAudioExecutionPolicy(input)
  if (!policy.allowed) {
    return buildAudioExecutionResult({
      mode: input.mode,
      status: 'blocked',
      separatedStemArtifacts: [],
      artifacts: [],
      qaResults: [],
      skippedReasons: policy.blockingReasons.map((reason): AudioToolSkipReason => ({ code: reason, message: reason })),
      warnings: policy.warnings,
      blocksPreview: true,
      blocksFinalExport: true,
    })
  }

  const inputValidation = validateAudioExecutionInput(input)
  const executionPlan = buildAudioExecutionPlan(input)
  const planValidation = validateAudioExecutionPlan(executionPlan)
  const combinedValidation = {
    valid: inputValidation.valid && planValidation.valid,
    issues: [...inputValidation.issues, ...planValidation.issues],
  }
  const loudnessResult = await runFFmpegLoudnessExecution(input)
  const normalizationResult = executionPlan.selectedOperations.includes('normalize_loudness')
    ? await runFFmpegNormalizationExecution({ executionInput: input, executionPlan })
    : undefined
  const cleanupResult = await runAudioCleanupExecution({ executionInput: input, executionPlan })
  const audioAnalysis = input.audioAnalysis ?? buildAudioAnalysisSummary(toFoundationInput(input))
  const soundSyncCuePlan = input.soundSyncCuePlan ?? buildSoundSyncCuePlan({ audioAnalysis })
  const artifactMode = input.mode === 'local_dev' ? 'local_dev' : input.mode === 'container_ready' ? 'container_ready' : input.mode === 'production_ready' ? 'production_ready' : 'dry_run'
  const soundSyncArtifactRecord = await buildSoundSyncCueArtifact({
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId,
    soundSyncCuePlan,
    outputDirectory: input.outputDirectory,
    mode: artifactMode,
  })
  const duckingPlan = buildMusicDuckingExecutionPlan({ executionInput: input, executionPlan })
  const qaResults = buildAudioExecutionQAResults({
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId,
    toolExecutionPlanId: input.toolExecutionPlanId,
    executionPlan,
    validation: combinedValidation,
    loudnessResult,
    normalizationResult,
    cleanupResult,
  })
  const qaArtifactRecord = await buildAudioExecutionArtifact({
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId,
    artifactType: 'qa_report',
    fileName: 'm15a-audio-qa.json',
    payload: qaResults,
    outputDirectory: input.outputDirectory,
    mode: artifactMode,
    contentType: 'application/json',
    sourceOfTruth: false,
    metadata: { executionPlanId: executionPlan.executionPlanId },
  })
  const audioAnalysisArtifactRecord = await buildAudioExecutionArtifact({
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId,
    artifactType: 'audio_analysis_json',
    fileName: 'm15a-audio-execution.json',
    payload: { audioAnalysis, executionPlan, duckingPlan, loudnessResult, normalizationResult },
    outputDirectory: input.outputDirectory,
    mode: artifactMode,
    contentType: 'application/json',
    sourceOfTruth: true,
    metadata: { executionPlanId: executionPlan.executionPlanId },
  })
  const plannedCleanedAudioArtifact = executionPlan.expectedArtifacts.includes('cleaned_audio')
    ? (normalizationResult?.cleanedAudioArtifact ?? cleanupResult.cleanedAudioArtifact)
    : undefined
  const artifacts = [
    audioAnalysisArtifactRecord.artifact,
    soundSyncArtifactRecord.artifact,
    qaArtifactRecord.artifact,
    ...(plannedCleanedAudioArtifact ? [plannedCleanedAudioArtifact] : []),
    ...cleanupResult.separatedStemArtifacts,
  ]
  const blockingQa = qaResults.some((gate) => gate.blocking)
  const blocked = !combinedValidation.valid || blockingQa || input.mode === 'production_ready'

  return buildAudioExecutionResult({
    mode: input.mode,
    status: blocked ? 'blocked' : input.mode === 'container_ready' ? 'container_ready' : input.mode === 'dry_run' ? 'dry_run' : 'partial',
    executionPlan,
    loudnessResult,
    normalizationResult,
    cleanedAudioArtifact: plannedCleanedAudioArtifact,
    separatedStemArtifacts: cleanupResult.separatedStemArtifacts,
    soundSyncArtifact: soundSyncArtifactRecord.artifact,
    artifacts,
    qaResults,
    skippedReasons: [
      ...(loudnessResult.skipReason ? [loudnessResult.skipReason] : []),
      ...(normalizationResult?.skipReason ? [normalizationResult.skipReason] : []),
      ...cleanupResult.skipReasons,
    ],
    warnings: [
      ...policy.warnings,
      ...combinedValidation.issues.filter((issue) => issue.severity === 'warning').map((issue) => issue.message),
      ...executionPlan.warnings,
      ...cleanupResult.warnings,
      'Milestone 15A does not final mux/export audio or video.',
      ...(input.mode === 'production_ready' ? ['Production-ready audio execution remains blocked until readiness/model-weight gates pass.'] : []),
    ],
    blocksPreview: combinedValidation.issues.some((issue) => issue.severity === 'blocking') || blockingQa,
    blocksFinalExport: true,
  })
}

function toFoundationInput(input: AudioExecutionInput): AudioFoundationRunnerInput {
  return {
    mode: input.mode === 'local_dev' ? 'local_dev' : input.mode === 'production_blocked' ? 'production_blocked' : 'dry_run',
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId,
    approvedSnapshotId: input.approvedSnapshotId,
    toolExecutionPlanId: input.toolExecutionPlanId,
    idempotencyKey: input.idempotencyKey,
    sourceAudioArtifactId: input.sourceAudioArtifactId,
    sourceAudioStorageObjectPath: input.sourceAudioStorageObjectPath,
    sourceAudioLocalPath: input.sourceAudioLocalPath,
  }
}
