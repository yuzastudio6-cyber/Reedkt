import { getApprovedVlmModelDownloadEvidence } from '../vlm-model-download'
import { buildVlmGeneratedFixtureManifest } from './vlm-generated-fixture-registry'
import { buildVlmPromptTemplateManifest, phase39CVlmOutputSchema } from './vlm-prompt-template-registry'
import { buildVlmRuntimeCommandPlan } from './vlm-runtime-command-plan'
import { buildVlmRuntimeIamPlan } from './vlm-runtime-iam-plan'
import { buildVlmRuntimeL4TuningMatrixReport } from './vlm-runtime-l4-tuning-report-builder'
import { validateVlmRuntimeStaticPlan, vlmRuntimeConfig, vlmRuntimeDoesNotDo } from './vlm-runtime-policy'
import { vlmRuntimeBlockedScopes, vlmRuntimeSafetyGates } from './vlm-runtime-blocker-policy'
import type {
  VlmFixtureRuntimeResult,
  VlmModelAssetVerificationReport,
  VlmRuntimeExecutionReport,
  VlmRuntimeL4TuningMatrixReport,
  VlmRuntimeStaticReportInput,
} from './vlm-runtime-types'

export function buildVlmRuntimePlan(createdAt = new Date().toISOString(), runId = 'phase39c-plan') {
  const phase39B = getApprovedVlmModelDownloadEvidence()
  const validation = validateVlmRuntimeStaticPlan()
  return {
    phase: '39C' as const,
    reportId: 'phase_39c_vlm_runtime_plan',
    createdAt,
    runId,
    modelId: vlmRuntimeConfig.modelId,
    revision: vlmRuntimeConfig.modelRevision,
    privateModelPrefix: vlmRuntimeConfig.modelGcsPath,
    sourcePhase39A: {
      pr: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/62',
      commit: '698410e',
      status: 'approval_planning_passed',
    },
    sourcePhase39B: {
      pr: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/64',
      commit: '0339119',
      status: phase39B.status,
      aggregateSha256: phase39B.aggregateSha256,
      fileCount: phase39B.fileCount,
      selectedTotalSizeBytes: phase39B.selectedTotalSizeBytes,
    },
    runtimeScope: 'generated_synthetic_fixture_vlm_runtime_only',
    requiredRuntime: 'vllm',
    requiredVllmVersion: vlmRuntimeConfig.requiredVllmVersion,
    fallbackRuntime: 'transformers_fallback',
    localModelPathOnly: true,
    runtimeAutoDownloadAllowed: false,
    providerCallsAllowed: false,
    rawPromptsAllowed: false,
    realMediaAllowed: false,
    arbitraryMediaAllowed: false,
    publicOutputAllowed: false,
    productionReadyAllowed: false,
    betaReadyAllowed: false,
    trackAAllowed: false,
    generatedFixtureManifest: buildVlmGeneratedFixtureManifest(runId, createdAt),
    promptTemplateManifest: buildVlmPromptTemplateManifest(runId, createdAt),
    outputSchema: phase39CVlmOutputSchema,
    commandPlan: buildVlmRuntimeCommandPlan(),
    iamPlan: buildVlmRuntimeIamPlan(createdAt),
    safetyGates: vlmRuntimeSafetyGates,
    l4TuningMatrix: buildVlmRuntimeL4TuningMatrixReport({ runId, createdAt }),
    blockedScopes: vlmRuntimeBlockedScopes,
    doesNotDo: vlmRuntimeDoesNotDo,
    blockers: validation.blockers,
    warnings: validation.warnings,
  }
}

export function buildVlmRuntimeStaticReports(input: VlmRuntimeStaticReportInput = {}) {
  const createdAt = input.createdAt ?? new Date().toISOString()
  const runId = input.runId ?? 'phase39c-static'
  const phase39B = input.phase39B ?? getApprovedVlmModelDownloadEvidence()
  const fixtureManifest = buildVlmGeneratedFixtureManifest(runId, createdAt)
  const promptTemplateManifest = buildVlmPromptTemplateManifest(runId, createdAt)
  const emptyVerification: VlmModelAssetVerificationReport = {
    phase: '39C',
    runId,
    modelId: vlmRuntimeConfig.modelId,
    revision: vlmRuntimeConfig.modelRevision,
    modelGcsPath: vlmRuntimeConfig.modelGcsPath,
    aggregateSha256: vlmRuntimeConfig.aggregateSha256,
    entries: phase39B.selectedAssets.map((asset) => ({
      relativePath: asset.relativePath,
      gcsUri: asset.gcsUri,
      expectedSha256: phase39B.assetSha256[asset.relativePath],
      expectedSizeBytes: phase39B.assetSizeBytes[asset.relativePath] ?? asset.expectedSizeBytes,
      verified: false,
    })),
    status: 'blocked',
    blockers: ['execution_not_run'],
    warnings: ['Plan/report mode does not copy or hash model payloads.'],
  }
  const report = buildVlmRuntimeExecutionReport({
    runId,
    createdAt,
    assetVerification: emptyVerification,
    fixtureResults: [],
    runtimeStatus: 'skipped',
    blockers: ['execution_not_run'],
    warnings: ['Phase 39C report mode is safe and non-mutating.'],
    uploadedArtifacts: [],
    localGpuAvailable: false,
    stagingCloudRunRequested: false,
  })
  return {
    plan: buildVlmRuntimePlan(createdAt, runId),
    fixtureManifest,
    promptTemplateManifest,
    assetVerification: emptyVerification,
    runtimeResults: { phase: '39C' as const, runId, runtimeStatus: 'skipped', fixtureResults: [] as VlmFixtureRuntimeResult[] },
    schemaValidationReport: buildSchemaValidationReport(runId, []),
    objectRegionQaReport: buildObjectRegionQaReport(runId, []),
    safeZoneQaReport: buildSafeZoneQaReport(runId, []),
    hallucinationSafetyReport: buildHallucinationSafetyReport(runId, []),
    costMemoryReport: buildCostMemoryReport(runId, false, false, ['Execution not run.']),
    l4TuningMatrixReport: buildVlmRuntimeL4TuningMatrixReport({ runId, createdAt }),
    privateArtifactManifest: {
      phase: '39C' as const,
      runId,
      privateOnly: true,
      artifactCount: 0,
      artifacts: [],
      blockers: ['execution_not_run'],
      warnings: ['No private artifacts uploaded in report mode.'],
    },
    fullReport: report,
  }
}

export function buildVlmRuntimeExecutionReport(input: {
  runId: string
  createdAt?: string
  assetVerification: VlmModelAssetVerificationReport
  fixtureResults: VlmFixtureRuntimeResult[]
  runtimeStatus: 'passed' | 'warning' | 'blocked' | 'skipped'
  blockers: string[]
  warnings: string[]
  uploadedArtifacts: VlmRuntimeExecutionReport['artifacts']
  privateArtifactPrefix?: string
  localGpuAvailable: boolean
  stagingCloudRunRequested: boolean
  runtimeVersion?: string
  l4TuningMatrix?: VlmRuntimeL4TuningMatrixReport
}): VlmRuntimeExecutionReport {
  const phase39B = getApprovedVlmModelDownloadEvidence()
  const qaBlockers = [
    ...input.blockers,
    ...input.assetVerification.blockers,
    ...input.fixtureResults.flatMap((result) => result.blockers),
  ]
  const qaWarnings = [
    ...input.warnings,
    ...input.assetVerification.warnings,
    ...input.fixtureResults.flatMap((result) => result.warnings),
  ]
  const requiredResults = input.fixtureResults.filter((result) => result.status !== 'skipped')
  const schemaValidity = requiredResults.length ? requiredResults.filter((result) => result.schemaValid).length / requiredResults.length : 0
  const averageRequiredLabelRecall = average(requiredResults.map((result) => result.requiredLabelRecall))
  const averageBroadRegionAccuracy = average(requiredResults.map((result) => result.broadRegionAccuracy))
  const runtimePassed = input.runtimeStatus === 'passed'
    && input.assetVerification.status === 'verified'
    && schemaValidity >= vlmRuntimeConfig.requiredSchemaValidity
    && averageRequiredLabelRecall >= vlmRuntimeConfig.requiredLabelRecallThreshold
    && averageBroadRegionAccuracy >= vlmRuntimeConfig.requiredBroadRegionAccuracyThreshold
    && qaBlockers.length === 0
  const vlmToolFamilyBetaStatus = runtimePassed ? 'phase-complete but tool-family incomplete' : 'blocked'
  return {
    ok: runtimePassed,
    phase: '39C',
    runId: input.runId,
    createdAt: input.createdAt ?? new Date().toISOString(),
    sourcePhase39A: {
      pr: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/62',
      commit: '698410e',
      status: 'approval_planning_passed',
    },
    sourcePhase39B: {
      modelId: phase39B.modelId,
      revision: phase39B.revision,
      status: phase39B.status,
      targetGcsPath: phase39B.targetGcsPath,
      aggregateSha256: phase39B.aggregateSha256,
      fileCount: phase39B.fileCount,
      selectedTotalSizeBytes: phase39B.selectedTotalSizeBytes,
    },
    modelId: vlmRuntimeConfig.modelId,
    revision: vlmRuntimeConfig.modelRevision,
    privateModelPrefix: vlmRuntimeConfig.modelGcsPath,
    runtime: {
      requestedRuntime: 'vllm',
      fallbackRuntime: 'transformers_fallback',
      runtimeStatus: input.runtimeStatus,
      runtimeVersion: input.runtimeVersion,
      transformersFallbackStatus: 'skipped',
      localModelPathUsed: runtimePassed,
      modelIdRuntimePathBlocked: true,
      runtimeAutoDownloadBlocked: true,
      providerCallsBlocked: true,
      rawPromptsBlocked: true,
      realMediaBlocked: true,
      arbitraryMediaBlocked: true,
    },
    assetVerification: input.assetVerification,
    generatedFixtureManifest: buildVlmGeneratedFixtureManifest(input.runId, input.createdAt),
    promptTemplateManifest: buildVlmPromptTemplateManifest(input.runId, input.createdAt),
    fixtureResults: input.fixtureResults,
    qa: {
      status: runtimePassed ? 'passed' : qaBlockers.length ? 'blocked' : input.runtimeStatus,
      schemaValidity,
      averageRequiredLabelRecall,
      averageBroadRegionAccuracy,
      gates: buildQaGates(input.assetVerification.status === 'verified', runtimePassed, input.fixtureResults, qaBlockers),
      blockers: Array.from(new Set(qaBlockers)),
      warnings: Array.from(new Set(qaWarnings)),
    },
    costMemory: buildCostMemoryReport(input.runId, input.localGpuAvailable, input.stagingCloudRunRequested, qaWarnings),
    l4TuningMatrix: input.l4TuningMatrix,
    artifacts: input.uploadedArtifacts,
    privateArtifactPrefix: input.privateArtifactPrefix,
    vlmToolFamilyBetaStatus,
    phase39DReadiness: {
      readyForControlledRealFrameVlm: runtimePassed,
      reason: runtimePassed
        ? 'Phase 39C passed generated synthetic VLM runtime verification only; Phase 39D may gate exactly one private controlled real-frame sample.'
        : 'Phase 39D remains blocked because Phase 39C generated VLM runtime verification did not pass.',
    },
    blockers: Array.from(new Set(qaBlockers)),
    warnings: Array.from(new Set(qaWarnings)),
  }
}

export function buildSchemaValidationReport(runId: string, fixtureResults: VlmFixtureRuntimeResult[]) {
  return {
    phase: '39C' as const,
    runId,
    schemaId: 'phase39c_vlm_fixture_output_v1',
    requiredSchemaValidity: vlmRuntimeConfig.requiredSchemaValidity,
    schemaValidity: fixtureResults.length ? fixtureResults.filter((result) => result.schemaValid).length / fixtureResults.length : 0,
    fixtureResults: fixtureResults.map(({ fixtureId, parsedJson, schemaValid, blockers, warnings }) => ({ fixtureId, parsedJson, schemaValid, blockers, warnings })),
    blockers: fixtureResults.flatMap((result) => result.schemaValid ? [] : [`schema_invalid:${result.fixtureId}`]),
    warnings: [],
  }
}

export function buildObjectRegionQaReport(runId: string, fixtureResults: VlmFixtureRuntimeResult[]) {
  return {
    phase: '39C' as const,
    runId,
    requiredLabelRecallThreshold: vlmRuntimeConfig.requiredLabelRecallThreshold,
    requiredBroadRegionAccuracyThreshold: vlmRuntimeConfig.requiredBroadRegionAccuracyThreshold,
    fixtureResults: fixtureResults.map(({ fixtureId, requiredLabelRecall, broadRegionAccuracy, objectCount, status }) => ({ fixtureId, requiredLabelRecall, broadRegionAccuracy, objectCount, status })),
    blockers: fixtureResults.flatMap((result) => result.requiredLabelRecall < vlmRuntimeConfig.requiredLabelRecallThreshold || result.broadRegionAccuracy < vlmRuntimeConfig.requiredBroadRegionAccuracyThreshold ? [`object_region_qa_failed:${result.fixtureId}`] : []),
    warnings: [],
  }
}

export function buildSafeZoneQaReport(runId: string, fixtureResults: VlmFixtureRuntimeResult[]) {
  return {
    phase: '39C' as const,
    runId,
    fixtureResults: fixtureResults.map(({ fixtureId, safeZoneDecision, textLikeRegionCount, status }) => ({ fixtureId, safeZoneDecision, textLikeRegionCount, status })),
    blockers: fixtureResults.flatMap((result) => result.safeZoneDecision === 'unknown' ? [`safe_zone_unknown:${result.fixtureId}`] : []),
    warnings: fixtureResults.flatMap((result) => result.safeZoneDecision === 'manual_review' ? [`manual_review_zone:${result.fixtureId}`] : []),
  }
}

export function buildHallucinationSafetyReport(runId: string, fixtureResults: VlmFixtureRuntimeResult[]) {
  return {
    phase: '39C' as const,
    runId,
    noProviderCalls: true,
    noToolCalls: true,
    noRawPrompts: true,
    noRealMedia: true,
    noPublicOutput: true,
    fixtureResults: fixtureResults.map(({ fixtureId, uncertainty, blockers, warnings }) => ({ fixtureId, uncertainty, blockers, warnings })),
    blockers: fixtureResults.flatMap((result) => result.blockers.filter((blocker) => /hallucination|provider|tool|raw_prompt|real_media|public/i.test(blocker))),
    warnings: fixtureResults.flatMap((result) => result.warnings),
  }
}

export function buildCostMemoryReport(runId: string, localGpuAvailable: boolean, stagingCloudRunRequested: boolean, notes: string[]) {
  return {
    phase: '39C' as const,
    runId,
    gpuType: vlmRuntimeConfig.approvedGpuType,
    gpuRuntimeApprovedNow: false,
    localGpuAvailable,
    stagingCloudRunRequested,
    estimatedModelBytes: vlmRuntimeConfig.selectedTotalSizeBytes,
    memoryRisk: 'high' as const,
    costRisk: stagingCloudRunRequested ? 'high' as const : 'medium' as const,
    notes: [
      'Qwen3-VL 8B runtime requires GPU/memory validation before any controlled real-frame or planning integration phase.',
      'Qwen3-VL runtime uses vLLM >= 0.11.0 because current Qwen3-VL docs require that support level.',
      'No unapproved GPU type, quantized variant, or provider fallback is allowed in Phase 39C.',
      ...notes,
    ],
  }
}

function buildQaGates(assetVerified: boolean, runtimePassed: boolean, fixtureResults: VlmFixtureRuntimeResult[], blockers: string[]) {
  return [
    { gateId: 'phase39a_approval_evidence', status: 'passed' as const, summary: 'Phase 39A approval evidence is referenced.' },
    { gateId: 'phase39b_private_model_assets', status: assetVerified ? 'passed' as const : 'blocked' as const, summary: assetVerified ? 'Phase 39B assets verified locally.' : 'Phase 39B asset verification is incomplete.' },
    { gateId: 'local_model_path_only', status: runtimePassed ? 'passed' as const : 'blocked' as const, summary: runtimePassed ? 'Runtime used local model path only.' : 'Runtime did not complete local-model-only execution.' },
    { gateId: 'generated_fixture_integrity', status: fixtureResults.length === 5 ? 'passed' as const : 'blocked' as const, summary: `${fixtureResults.length} generated fixture results recorded.` },
    { gateId: 'structured_json_schema', status: fixtureResults.length && fixtureResults.every((result) => result.schemaValid) ? 'passed' as const : 'blocked' as const, summary: 'JSON schema validation gate.' },
    { gateId: 'blocked_features', status: blockers.some((blocker) => /provider|raw_prompt|real_media|public|Track A/i.test(blocker)) ? 'blocked' as const : 'passed' as const, summary: 'Provider/raw prompt/real media/public output/Track A remain blocked.' },
  ]
}

function average(values: number[]): number {
  if (!values.length) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}
