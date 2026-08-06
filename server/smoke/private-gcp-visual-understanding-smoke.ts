import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import {
  calculatePrivateGcpVisualCoverageDigest,
  createPrivateGcpVisualUnderstandingPlan,
  finalizePrivateGcpVisualEvidencePackage,
  verifyPrivateGcpVisualEvidencePackage,
} from '../../src/lib/private-gcp-visual-understanding-contract'
import type {
  PrivateGcpVisualCoverageManifest,
  PrivateGcpVisualServerReadinessEvidence,
  PrivateGcpVisualUnderstandingPlanInput,
} from '../../src/types/private-gcp-visual-understanding'
import {
  aggregatePrivateGcpVisualAttemptCosts,
  calculatePrivateGcpVisualInfrastructureCost,
  createPrivateGcpVisualAttemptCostEvidence,
  type PrivateGcpVisualAttemptCostEvidenceInput,
  type PrivateGcpVisualInfrastructureRateSnapshot,
  type PrivateGcpVisualInfrastructureUsage,
} from '../visual-understanding-cost'

const GIB = 1024 ** 3
const SOURCE_DURATION_FRAMES = 2 * 60 * 60 * 30
const SCENE_DURATION_FRAMES = 30 * 30
const SCENE_COUNT = SOURCE_DURATION_FRAMES / SCENE_DURATION_FRAMES

function digest(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

const sceneSamples: PrivateGcpVisualCoverageManifest['samples'] = Array.from(
  { length: SCENE_COUNT },
  (_, index) => ({
    sampleId: `sample-scene-${String(index + 1).padStart(4, '0')}`,
    sourceFrame: index * SCENE_DURATION_FRAMES,
    reason: 'scene_representative',
    source: 'analysis_proxy_frame',
    proxyFrameChecksumSha256: digest(`proxy-frame-${index + 1}`),
    rawFramePersistenceAllowed: false,
  }),
)

const originalResolutionCrop: PrivateGcpVisualCoverageManifest['samples'][number] = {
  sampleId: 'sample-original-fine-text-0001',
  sourceFrame: 1_200,
  reason: 'fine_text',
  source: 'original_resolution_crop',
  crop: {
    x: 1_200,
    y: 500,
    width: 1_000,
    height: 400,
    cropChecksumSha256: digest('original-fine-text-crop'),
  },
  rawFramePersistenceAllowed: false,
}

const sceneWindows: PrivateGcpVisualCoverageManifest['windows'] = sceneSamples.map(
  (sample, index) => ({
    windowId: `window-scene-${String(index + 1).padStart(4, '0')}`,
    reason: 'scene_representative',
    detectedSceneId: `detected-scene-${String(index + 1).padStart(4, '0')}`,
    startFrame: index * SCENE_DURATION_FRAMES,
    endFrameExclusive: (index + 1) * SCENE_DURATION_FRAMES,
    required: true,
    sampleIds: [sample.sampleId],
  }),
)

const baseCoverageWithoutDigest: Omit<
  PrivateGcpVisualCoverageManifest,
  'coverageDigestSha256'
> = {
  policyVersion: 'private-gcp-qwen25vl-sampling-policy-v1',
  profileId: 'studio_scene_level_visual_coverage_v1',
  editLevel: 'ultra_premium',
  deterministicTechnicalCoverageComplete: true,
  sceneDetectionArtifactId: 'scene-detection-artifact-visual-smoke-v1',
  sceneDetectionArtifactSha256: digest('scene-detection-artifact'),
  detectedSceneCount: SCENE_COUNT,
  visuallyCoveredSceneCount: SCENE_COUNT,
  maximumUnobservedSpanSeconds: 30,
  samplesPerBatchMaximum: 64,
  batchCount: Math.ceil((sceneSamples.length + 1) / 64),
  samples: [...sceneSamples, originalResolutionCrop],
  windows: [
    ...sceneWindows,
    {
      windowId: 'window-original-fine-text-0001',
      reason: 'fine_text',
      detectedSceneId: null,
      startFrame: 900,
      endFrameExclusive: 1_800,
      required: true,
      sampleIds: [originalResolutionCrop.sampleId],
    },
  ],
}

function withCoverageDigest(
  coverage: Omit<PrivateGcpVisualCoverageManifest, 'coverageDigestSha256'>,
): PrivateGcpVisualCoverageManifest {
  return {
    ...coverage,
    coverageDigestSha256: calculatePrivateGcpVisualCoverageDigest(coverage),
  }
}

const coverage = withCoverageDigest(baseCoverageWithoutDigest)

const blockedReadiness: PrivateGcpVisualServerReadinessEvidence = {
  source: 'server_owned_private_gcp_visual_readiness',
  executionEnvironment: 'internal',
  readinessEvidenceId: null,
  readinessEvidenceSha256: null,
  verifiedAt: null,
  cloudRunJobResourceVerified: false,
  workerServiceAccountAndIamVerified: false,
  privateGcsGenerationBoundTransportVerified: false,
  workerImageDigestVerified: false,
  checkpointPresentInApprovedImage: false,
  modelAndLicenseApprovalVerified: false,
  canonicalQueueLeaseAndOneUseDispatchVerified: false,
  cancellationRetryAndLeaseRecoveryVerified: false,
  telemetryAndCostRateSnapshotVerified: false,
  deploymentRegionAndDataPolicyVerified: false,
  environmentGpuExecutionGateVerified: false,
}

const verifiedReadinessFixture: PrivateGcpVisualServerReadinessEvidence = {
  ...blockedReadiness,
  readinessEvidenceId: 'synthetic-private-gcp-visual-readiness-fixture-v1',
  readinessEvidenceSha256: digest('synthetic-private-gcp-visual-readiness-fixture'),
  verifiedAt: '2026-07-18T18:05:00.000Z',
  cloudRunJobResourceVerified: true,
  workerServiceAccountAndIamVerified: true,
  privateGcsGenerationBoundTransportVerified: true,
  workerImageDigestVerified: true,
  checkpointPresentInApprovedImage: true,
  modelAndLicenseApprovalVerified: true,
  canonicalQueueLeaseAndOneUseDispatchVerified: true,
  cancellationRetryAndLeaseRecoveryVerified: true,
  telemetryAndCostRateSnapshotVerified: true,
  deploymentRegionAndDataPolicyVerified: true,
  environmentGpuExecutionGateVerified: true,
}

const baseInput: PrivateGcpVisualUnderstandingPlanInput = {
  analysisRunId: 'analysis-run-private-gcp-visual-smoke',
  attemptId: 'attempt-private-gcp-visual-smoke-1',
  attemptOrdinal: 1,
  workspaceId: 'workspace-private-gcp-visual-smoke',
  projectId: 'project-private-gcp-visual-smoke',
  editSessionId: 'edit-private-gcp-visual-smoke',
  idempotencyKey: 'private-gcp-visual-smoke-attempt-1',
  authority: {
    phase: 'preplan_internal_source_analysis',
    authenticatedUserId: 'user-private-gcp-visual-smoke',
    sourceStudyAuthorizationId: 'source-study-authorization-visual-smoke',
    internalAnalysisBudgetAuthorityId: 'internal-analysis-budget-visual-smoke',
    userAnalysisConsentRecordedAt: '2026-07-18T18:00:00.000Z',
    customerCreditReservationId: null,
    customerChargeAuthorized: false,
  },
  source: {
    sourceAssetId: 'source-asset-private-gcp-visual-smoke',
    storageBucket: 'reeditpro-private-media',
    storageObjectName: 'workspaces/visual-smoke/source/original-4k.mov',
    storageObjectGeneration: '123456789',
    sourceChecksumSha256: digest('immutable-original-source'),
    sourceByteLength: 400 * GIB,
    sourceWidth: 3_840,
    sourceHeight: 2_160,
    durationFrames: SOURCE_DURATION_FRAMES,
    frameRateNumerator: 30,
    frameRateDenominator: 1,
    immutableOriginal: true,
    privateObject: true,
  },
  proxy: {
    proxyAssetId: 'proxy-asset-private-gcp-visual-smoke',
    storageBucket: 'reeditpro-private-media',
    storageObjectName: 'workspaces/visual-smoke/proxy/analysis-1080p.mp4',
    storageObjectGeneration: '123456790',
    proxyChecksumSha256: digest('analysis-proxy'),
    sourceChecksumSha256: digest('immutable-original-source'),
    profileId: 'professional_1080p_analysis_proxy_v2',
    width: 1_920,
    height: 1_080,
    outputColorSpace: 'bt709',
    colorTransformStatus: 'validated_rec709_sdr',
    privateObject: true,
    originalMasterPreserved: true,
  },
  checkpoint: {
    modelId: 'qwen2.5-vl-7b-instruct',
    checkpointSha256: digest('qwen25vl-checkpoint'),
    tokenizerSha256: digest('qwen25vl-tokenizer'),
    processorSha256: digest('qwen25vl-processor'),
    containerImageDigest: `sha256:${digest('visual-worker-image')}`,
    precision: 'bf16',
    modelApprovalRecordId: 'model-approval-qwen25vl-smoke',
    licenseReviewRecordId: 'license-review-qwen25vl-smoke',
  },
  coverage,
  evidenceSchemaVersion: 'private-gcp-qwen25vl-evidence-schema-v1',
  promptPolicyVersion: 'private-gcp-qwen25vl-visual-prompt-policy-v1',
  serverReadiness: blockedReadiness,
}

const blockedPlan = createPrivateGcpVisualUnderstandingPlan(baseInput)
assert.equal(blockedPlan.structurallyValid, true)
assert.equal(blockedPlan.executionReady, false)
assert.equal(blockedPlan.blockers.length, 12)
assert.equal(blockedPlan.blockers.includes('internal_gpu_execution_gate_not_verified'), true)
assert.equal(blockedPlan.worker.executionMode, 'private_self_hosted_gcp_gpu')
assert.equal(blockedPlan.worker.externalProviderApiPrimary, false)
assert.equal(blockedPlan.worker.browserExecutionAllowed, false)
assert.equal(blockedPlan.source.sourceByteLength, 400 * GIB)
assert.equal(blockedPlan.source.sourceWidth, 3_840)
assert.equal(blockedPlan.proxy.width, 1_920)
assert.equal(blockedPlan.proxy.originalMasterPreserved, true)
assert.deepEqual(blockedPlan.boundaries, {
  requestContractOnly: true,
  providerCallMade: false,
  gpuJobCreated: false,
  gcsReadMade: false,
  sourceBytesRead: false,
  rawFramePersisted: false,
  customerPriceCalculated: false,
  customerCreditsCalculated: false,
  customerChargeCreated: false,
  walletMutationMade: false,
  serviceFeeIncluded: false,
  productReady: false,
  productionReady: false,
})

const readyContractFixture = createPrivateGcpVisualUnderstandingPlan({
  ...baseInput,
  serverReadiness: verifiedReadinessFixture,
})
assert.equal(readyContractFixture.structurallyValid, true)
assert.equal(readyContractFixture.executionReady, true)
assert.equal(readyContractFixture.blockers.length, 0)
assert.equal(readyContractFixture.boundaries.gpuJobCreated, false)
assert.equal(readyContractFixture.boundaries.productionReady, false)

const approvedReinspection = createPrivateGcpVisualUnderstandingPlan({
  ...baseInput,
  analysisRunId: 'analysis-run-approved-reinspection-smoke',
  attemptId: 'attempt-approved-reinspection-smoke-1',
  idempotencyKey: 'approved-reinspection-smoke-1',
  authority: {
    phase: 'approved_snapshot_targeted_reinspection',
    approvedPlanSnapshotId: 'snapshot-approved-reinspection-smoke',
    creditReservationId: 'reservation-approved-reinspection-smoke',
    approvedWorkItemId: 'work-item-approved-reinspection-smoke',
    customerChargeAuthorized: false,
  },
  serverReadiness: verifiedReadinessFixture,
})
assert.equal(approvedReinspection.phase, 'approved_snapshot_targeted_reinspection')
assert.equal(approvedReinspection.executionReady, true)

const postrenderQa = createPrivateGcpVisualUnderstandingPlan({
  ...baseInput,
  analysisRunId: 'analysis-run-postrender-qa-smoke',
  attemptId: 'attempt-postrender-qa-smoke-1',
  idempotencyKey: 'postrender-qa-smoke-1',
  authority: {
    phase: 'postrender_private_visual_qa',
    approvedPlanSnapshotId: 'snapshot-postrender-qa-smoke',
    creditReservationId: 'reservation-postrender-qa-smoke',
    approvedWorkItemId: 'work-item-postrender-qa-smoke',
    privateRenderArtifactId: 'private-render-postrender-qa-smoke',
    privateRenderSha256: digest('private-render-postrender-qa-smoke'),
    customerChargeAuthorized: false,
  },
  serverReadiness: verifiedReadinessFixture,
})
assert.equal(postrenderQa.phase, 'postrender_private_visual_qa')
assert.equal(postrenderQa.executionReady, true)

const changedCheckpointPlan = createPrivateGcpVisualUnderstandingPlan({
  ...baseInput,
  checkpoint: {
    ...baseInput.checkpoint,
    checkpointSha256: digest('different-approved-checkpoint'),
  },
  serverReadiness: verifiedReadinessFixture,
})
assert.notEqual(changedCheckpointPlan.cacheKeySha256, readyContractFixture.cacheKeySha256)

const changedCoverage = withCoverageDigest({
  ...baseCoverageWithoutDigest,
  windows: baseCoverageWithoutDigest.windows.map((window, index) => ({
    ...window,
    required: index !== 0,
  })),
})
const changedCoveragePlan = createPrivateGcpVisualUnderstandingPlan({
  ...baseInput,
  coverage: changedCoverage,
  serverReadiness: verifiedReadinessFixture,
})
assert.equal(changedCoveragePlan.structurallyValid, true)
assert.notEqual(changedCoveragePlan.cacheKeySha256, readyContractFixture.cacheKeySha256)

const otherTenantPlan = createPrivateGcpVisualUnderstandingPlan({
  ...baseInput,
  workspaceId: 'workspace-other-private-gcp-visual-smoke',
  serverReadiness: verifiedReadinessFixture,
})
assert.notEqual(otherTenantPlan.cacheKeySha256, readyContractFixture.cacheKeySha256)

const observations = [{
  observationId: 'observation-private-gcp-visual-smoke-1',
  startFrame: 0,
  endFrameExclusive: 1_800,
  evidenceSampleIds: [sceneSamples[0].sampleId, originalResolutionCrop.sampleId],
  category: 'scene' as const,
  summary: 'The opening establishes the speaker and a fine-text product detail without claiming transcript authority.',
  confidenceBasisPoints: 9_200,
  userCorrectionId: null,
}]
const requiredWindowIds = coverage.windows
  .filter((window) => window.required)
  .map((window) => window.windowId)
const evidence = finalizePrivateGcpVisualEvidencePackage({
  plan: readyContractFixture,
  observations,
  coveredRequiredWindowIds: requiredWindowIds,
  unsupportedClaimCount: 0,
  deterministicQaPassed: true,
})
const verifiedEvidence = verifyPrivateGcpVisualEvidencePackage({
  plan: readyContractFixture,
  evidence,
})
assert.equal(verifiedEvidence.ok, true)
assert.equal(verifiedEvidence.blocked, false)
assert.equal(verifiedEvidence.reasoningConsumptionAllowed, true)
assert.equal(verifiedEvidence.providerCallMade, false)
assert.equal(verifiedEvidence.customerChargeCreated, false)

const lowConfidenceEvidence = finalizePrivateGcpVisualEvidencePackage({
  plan: readyContractFixture,
  observations: [{ ...observations[0], confidenceBasisPoints: 5_999 }],
  coveredRequiredWindowIds: requiredWindowIds,
  unsupportedClaimCount: 0,
  deterministicQaPassed: true,
})
const lowConfidenceVerification = verifyPrivateGcpVisualEvidencePackage({
  plan: readyContractFixture,
  evidence: lowConfidenceEvidence,
})
assert.equal(lowConfidenceVerification.ok, true)
assert.equal(lowConfidenceVerification.blocked, true)
assert.equal(lowConfidenceVerification.userReviewRequired, true)
assert.equal(lowConfidenceVerification.reasoningConsumptionAllowed, false)

const missingCoverageEvidence = finalizePrivateGcpVisualEvidencePackage({
  plan: readyContractFixture,
  observations,
  coveredRequiredWindowIds: requiredWindowIds.slice(1),
  unsupportedClaimCount: 0,
  deterministicQaPassed: true,
})
assert.equal(verifyPrivateGcpVisualEvidencePackage({
  plan: readyContractFixture,
  evidence: missingCoverageEvidence,
}).ok, false)
assert.equal(verifyPrivateGcpVisualEvidencePackage({
  plan: readyContractFixture,
  evidence: { ...evidence, evidencePackageHash: digest('tampered-package') },
}).ok, false)

const audioAuthorityClaim = finalizePrivateGcpVisualEvidencePackage({
  plan: readyContractFixture,
  observations,
  coveredRequiredWindowIds: requiredWindowIds,
  unsupportedClaimCount: 0,
  deterministicQaPassed: true,
  audioOrTranscriptAuthorityClaimed: true,
})
assert.equal(verifyPrivateGcpVisualEvidencePackage({
  plan: readyContractFixture,
  evidence: audioAuthorityClaim,
}).ok, false)

const wrongProxyBinding = createPrivateGcpVisualUnderstandingPlan({
  ...baseInput,
  proxy: { ...baseInput.proxy, sourceChecksumSha256: digest('wrong-source') },
  serverReadiness: verifiedReadinessFixture,
})
assert.equal(wrongProxyBinding.structurallyValid, false)

const invalidCropCoverage = withCoverageDigest({
  ...baseCoverageWithoutDigest,
  samples: baseCoverageWithoutDigest.samples.map((sample) =>
    sample.sampleId === originalResolutionCrop.sampleId
      ? { ...sample, crop: { ...sample.crop!, x: 3_500 } }
      : sample),
})
assert.equal(createPrivateGcpVisualUnderstandingPlan({
  ...baseInput,
  coverage: invalidCropCoverage,
  serverReadiness: verifiedReadinessFixture,
}).structurallyValid, false)

const incompleteStudioCoverage = withCoverageDigest({
  ...baseCoverageWithoutDigest,
  visuallyCoveredSceneCount: SCENE_COUNT - 1,
})
assert.equal(createPrivateGcpVisualUnderstandingPlan({
  ...baseInput,
  coverage: incompleteStudioCoverage,
  serverReadiness: verifiedReadinessFixture,
}).structurallyValid, false)

const excessiveGapCoverage = withCoverageDigest({
  ...baseCoverageWithoutDigest,
  maximumUnobservedSpanSeconds: 29,
})
assert.equal(createPrivateGcpVisualUnderstandingPlan({
  ...baseInput,
  coverage: excessiveGapCoverage,
  serverReadiness: verifiedReadinessFixture,
}).structurallyValid, false)

const syntheticRateFixture: PrivateGcpVisualInfrastructureRateSnapshot = {
  schemaVersion: 'private-gcp-visual-infrastructure-rate-snapshot-v1',
  snapshotId: 'synthetic-private-gcp-visual-rate-fixture-v1',
  provider: 'google_cloud',
  currency: 'USD',
  billingRegion: 'us-central1',
  accelerator: 'nvidia_l4',
  pricingEvidenceArtifactId: 'synthetic-private-gcp-pricing-evidence-fixture-v1',
  sourceContentSha256: digest('synthetic-private-gcp-pricing-evidence-fixture'),
  sourceUrl: 'https://example.com/reeditpro-private-gcp-rate-fixture',
  observedAt: '2026-07-18T18:30:00.000Z',
  gpuMicrosPerHour: 3_600_000,
  cpuMicrosPerVcpuHour: 360_000,
  memoryMicrosPerGibHour: 36_000,
  storageMicrosPerGibMonth: 2_592_000,
  storageBillingMonthHours: 720,
  networkEgressMicrosPerGib: 5_000,
  classAOperationMicrosPerThousand: 100_000,
  classBOperationMicrosPerThousand: 10_000,
}

const missUsage: PrivateGcpVisualInfrastructureUsage = {
  gpuAllocatedMilliseconds: 2_000,
  cpuVcpuAllocatedMilliseconds: 4_000,
  memoryGibAllocatedMilliseconds: 16_000,
  retainedArtifactMibMilliseconds: 1_024 * 3_600_000,
  networkEgressBytes: GIB,
  classAOperationCount: 10,
  classBOperationCount: 20,
  cacheDisposition: 'miss_inference_executed',
}
const missCost = calculatePrivateGcpVisualInfrastructureCost({
  usage: missUsage,
  rateSnapshot: syntheticRateFixture,
})
if (!missCost.ok) throw new Error(missCost.error.message)
assert.deepEqual(missCost.data.breakdownUsdMicros, {
  gpu: 2_000,
  cpu: 400,
  memory: 160,
  retainedStorage: 3_600,
  networkEgress: 5_000,
  classAOperations: 1_000,
  classBOperations: 200,
})
assert.equal(missCost.data.totalUsdMicros, 12_360)
assert.equal(missCost.data.providerTokenPriceUsed, false)
assert.equal(missCost.data.customerPriceIncluded, false)
assert.equal(missCost.data.customerCreditsIncluded, false)
assert.equal(missCost.data.serviceFeeIncluded, false)

const commonAttempt: Omit<PrivateGcpVisualAttemptCostEvidenceInput, 'attemptId' | 'attemptOrdinal' | 'outcome' | 'usage' | 'recordedAt' | 'workerExecutionId' | 'cloudRunExecutionResourceName' | 'usageCaptureId'> = {
  analysisRunId: readyContractFixture.analysisRunId,
  planHash: readyContractFixture.planHash,
  sourceChecksumSha256: readyContractFixture.source.sourceChecksumSha256,
  checkpointSha256: readyContractFixture.checkpoint.checkpointSha256,
  coverageDigestSha256: readyContractFixture.coverage.coverageDigestSha256,
  cacheKeySha256: readyContractFixture.cacheKeySha256,
  rateSnapshot: syntheticRateFixture,
}

const failedAttempt = createPrivateGcpVisualAttemptCostEvidence({
  ...commonAttempt,
  attemptId: 'visual-cost-attempt-1',
  attemptOrdinal: 1,
  workerExecutionId: 'visual-worker-execution-1',
  cloudRunExecutionResourceName: 'projects/reeditpro/locations/us-central1/jobs/reeditpro-gpu-ai-worker/executions/reeditpro-gpu-ai-worker-a1',
  usageCaptureId: 'visual-usage-capture-1',
  outcome: 'failed',
  usage: missUsage,
  recordedAt: '2026-07-18T18:31:00.000Z',
})
if (!failedAttempt.ok) throw new Error(failedAttempt.error.message)

const cacheHitUsage: PrivateGcpVisualInfrastructureUsage = {
  gpuAllocatedMilliseconds: 0,
  cpuVcpuAllocatedMilliseconds: 1_000,
  memoryGibAllocatedMilliseconds: 1_000,
  retainedArtifactMibMilliseconds: 0,
  networkEgressBytes: 0,
  classAOperationCount: 0,
  classBOperationCount: 1,
  cacheDisposition: 'validated_private_cache_hit',
}
const completedRetry = createPrivateGcpVisualAttemptCostEvidence({
  ...commonAttempt,
  attemptId: 'visual-cost-attempt-2',
  attemptOrdinal: 2,
  workerExecutionId: 'visual-worker-execution-2',
  cloudRunExecutionResourceName: null,
  usageCaptureId: 'visual-usage-capture-2',
  outcome: 'completed',
  usage: cacheHitUsage,
  recordedAt: '2026-07-18T18:32:00.000Z',
})
if (!completedRetry.ok) throw new Error(completedRetry.error.message)

const aggregate = aggregatePrivateGcpVisualAttemptCosts([
  failedAttempt.data,
  completedRetry.data,
])
if (!aggregate.ok) throw new Error(aggregate.error.message)
assert.equal(aggregate.data.attemptCount, 2)
assert.equal(aggregate.data.failedAttemptCount, 1)
assert.equal(aggregate.data.completedAttemptCount, 1)
assert.equal(aggregate.data.totalUsdMicros, 12_480)
assert.equal(aggregate.data.cacheKeySha256, readyContractFixture.cacheKeySha256)
assert.equal(aggregate.data.customerChargeCreated, false)
assert.equal(aggregate.data.serviceFeeIncluded, false)

assert.equal(calculatePrivateGcpVisualInfrastructureCost({
  usage: { ...cacheHitUsage, gpuAllocatedMilliseconds: 1 },
  rateSnapshot: syntheticRateFixture,
}).ok, false)
assert.equal(createPrivateGcpVisualAttemptCostEvidence({
  ...commonAttempt,
  attemptId: 'visual-cost-missing-cloud-execution',
  attemptOrdinal: 1,
  workerExecutionId: 'visual-worker-execution-missing-cloud',
  cloudRunExecutionResourceName: null,
  usageCaptureId: 'visual-usage-capture-missing-cloud',
  outcome: 'failed',
  usage: missUsage,
  recordedAt: '2026-07-18T18:33:00.000Z',
}).ok, false)
assert.equal(calculatePrivateGcpVisualInfrastructureCost({
  usage: missUsage,
  rateSnapshot: {
    ...syntheticRateFixture,
    sourceUrl: 'https://example.com/rate?secret=must-not-be-captured',
  },
}).ok, false)

const mixedCacheAttempt = createPrivateGcpVisualAttemptCostEvidence({
  ...commonAttempt,
  cacheKeySha256: digest('different-cache-authority'),
  attemptId: 'visual-cost-attempt-2-different-cache',
  attemptOrdinal: 2,
  workerExecutionId: 'visual-worker-execution-2-different-cache',
  cloudRunExecutionResourceName: null,
  usageCaptureId: 'visual-usage-capture-2-different-cache',
  outcome: 'completed',
  usage: cacheHitUsage,
  recordedAt: '2026-07-18T18:34:00.000Z',
})
if (!mixedCacheAttempt.ok) throw new Error(mixedCacheAttempt.error.message)
assert.equal(aggregatePrivateGcpVisualAttemptCosts([
  failedAttempt.data,
  mixedCacheAttempt.data,
]).ok, false)

const completedFirstAttempt = createPrivateGcpVisualAttemptCostEvidence({
  ...commonAttempt,
  attemptId: 'visual-cost-completed-attempt-1',
  attemptOrdinal: 1,
  workerExecutionId: 'visual-worker-completed-execution-1',
  cloudRunExecutionResourceName: 'projects/reeditpro/locations/us-central1/jobs/reeditpro-gpu-ai-worker/executions/reeditpro-gpu-ai-worker-completed-a1',
  usageCaptureId: 'visual-completed-usage-capture-1',
  outcome: 'completed',
  usage: missUsage,
  recordedAt: '2026-07-18T18:35:00.000Z',
})
if (!completedFirstAttempt.ok) throw new Error(completedFirstAttempt.error.message)
assert.equal(aggregatePrivateGcpVisualAttemptCosts([
  completedFirstAttempt.data,
  completedRetry.data,
]).ok, false)
assert.equal(aggregatePrivateGcpVisualAttemptCosts([
  failedAttempt.data,
  { ...completedRetry.data, evidenceHash: digest('tampered-attempt-evidence') },
]).ok, false)

console.log(JSON.stringify({
  ok: true,
  sourceFixture: {
    bytes: baseInput.source.sourceByteLength,
    durationHours: 2,
    resolution: '3840x2160',
    proxyResolution: '1920x1080',
  },
  visualCoverage: {
    detectedScenes: coverage.detectedSceneCount,
    coveredScenes: coverage.visuallyCoveredSceneCount,
    samples: coverage.samples.length,
    batches: coverage.batchCount,
    maximumUnobservedSpanSeconds: coverage.maximumUnobservedSpanSeconds,
  },
  execution: {
    contractOnly: true,
    currentReadinessBlocked: !blockedPlan.executionReady,
    providerCallMade: false,
    gpuJobCreated: false,
    gcsReadMade: false,
  },
  internalCostFixture: {
    classification: failedAttempt.data.evidenceClassification,
    failedAttemptRetained: aggregate.data.failedAttemptCount === 1,
    aggregateUsdMicros: aggregate.data.totalUsdMicros,
    syntheticRateFixture: true,
    customerPriceIncluded: false,
    customerCreditsIncluded: false,
    serviceFeeIncluded: false,
  },
}, null, 2))
