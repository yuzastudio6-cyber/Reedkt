import { createHash } from 'node:crypto'

import { REEDITPRO_SOURCE_MEDIA_MAX_BYTES } from '../types/large-media'
import {
  PRIVATE_GCP_VISUAL_UNDERSTANDING_ACCELERATOR,
  PRIVATE_GCP_VISUAL_UNDERSTANDING_CONTRACT_VERSION,
  PRIVATE_GCP_VISUAL_UNDERSTANDING_MODEL_ID,
  PRIVATE_GCP_VISUAL_UNDERSTANDING_PROXY_PROFILE,
  PRIVATE_GCP_VISUAL_UNDERSTANDING_WORKER_TARGET,
  type PrivateGcpVisualCoverageManifest,
  type PrivateGcpVisualCoverageProfileId,
  type PrivateGcpVisualEvidencePackage,
  type PrivateGcpVisualEvidenceVerification,
  type PrivateGcpVisualObservation,
  type PrivateGcpVisualUnderstandingPlan,
  type PrivateGcpVisualUnderstandingPlanInput,
} from '../types/private-gcp-visual-understanding'
import type { ReEditProCanonicalEditLevel } from '../types/edit-level'

const SHA256 = /^[a-f0-9]{64}$/u
const IMAGE_DIGEST = /^sha256:[a-f0-9]{64}$/u
const IDENTITY = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const STORAGE_BUCKET = /^[a-z0-9][a-z0-9._-]{1,221}[a-z0-9]$/u
const ALLOWED_ORIGINAL_CROP_REASONS = new Set([
  'fine_text',
  'face_or_identity_detail',
  'product_detail',
  'color_or_lighting_detail',
  'low_confidence_reinspection',
  'postrender_qa',
])
const INSPECTION_REASONS = new Set([
  'whole_source_baseline',
  'scene_representative',
  'marker_window',
  'continuity_boundary',
  'fine_text',
  'face_or_identity_detail',
  'product_detail',
  'color_or_lighting_detail',
  'low_confidence_reinspection',
  'postrender_qa',
])
const OBSERVATION_CATEGORIES = new Set([
  'scene',
  'object',
  'person',
  'action',
  'camera_motion',
  'visible_text',
  'layout',
  'continuity',
  'broll_opportunity',
  'visual_risk',
  'color_or_lighting',
])

export const PRIVATE_GCP_QWEN_VISUAL_RETIREMENT = Object.freeze({
  schemaVersion: 'private-gcp-qwen-visual-retirement-v1' as const,
  status: 'retired_historical_read_only' as const,
  replacementCapability: 'visual_intelligence' as const,
  freshPlanConstructionAllowed: false as const,
  freshEvidenceConstructionAllowed: false as const,
  historicalVerificationAllowed: true as const,
})

interface HistoricalPrivateGcpVisualConstructionOptions {
  readonly historicalReadOnly?: true
}

const COVERAGE_PROFILE_BY_LEVEL: Record<
  ReEditProCanonicalEditLevel,
  PrivateGcpVisualCoverageProfileId
> = {
  normal: 'professional_targeted_visual_coverage_v1',
  premium: 'professional_key_moment_visual_coverage_v1',
  ultra_premium: 'studio_scene_level_visual_coverage_v1',
}

const MAXIMUM_UNOBSERVED_SECONDS: Record<PrivateGcpVisualCoverageProfileId, number> = {
  professional_targeted_visual_coverage_v1: 300,
  professional_key_moment_visual_coverage_v1: 90,
  studio_scene_level_visual_coverage_v1: 30,
}

export function expectedPrivateGcpVisualCoverageProfile(
  level: ReEditProCanonicalEditLevel,
): PrivateGcpVisualCoverageProfileId {
  return COVERAGE_PROFILE_BY_LEVEL[level]
}

export function calculatePrivateGcpVisualCoverageDigest(
  coverage: Omit<PrivateGcpVisualCoverageManifest, 'coverageDigestSha256'>,
): string {
  return sha256(stableStringify(coverage))
}

export function createPrivateGcpVisualUnderstandingPlan(
  input: PrivateGcpVisualUnderstandingPlanInput,
  options: HistoricalPrivateGcpVisualConstructionOptions = {},
): PrivateGcpVisualUnderstandingPlan {
  if (options.historicalReadOnly !== true) {
    throw new Error(
      'private_gcp_qwen_visual_retired_use_visual_intelligence',
    )
  }
  const errors = validateInput(input)
  const blockers = readinessBlockers(input.serverReadiness)
  const cacheKeySha256 = sha256(stableStringify({
    schemaVersion: 'private-gcp-qwen25vl-cache-key-v1',
    workspaceId: input.workspaceId,
    sourceChecksumSha256: input.source.sourceChecksumSha256,
    proxyChecksumSha256: input.proxy.proxyChecksumSha256,
    checkpointSha256: input.checkpoint.checkpointSha256,
    tokenizerSha256: input.checkpoint.tokenizerSha256,
    processorSha256: input.checkpoint.processorSha256,
    coverageDigestSha256: input.coverage.coverageDigestSha256,
    promptPolicyVersion: input.promptPolicyVersion,
    evidenceSchemaVersion: input.evidenceSchemaVersion,
  }))
  const immutablePayload = {
    schemaVersion: PRIVATE_GCP_VISUAL_UNDERSTANDING_CONTRACT_VERSION,
    analysisRunId: input.analysisRunId,
    attemptId: input.attemptId,
    attemptOrdinal: input.attemptOrdinal,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    idempotencyKey: input.idempotencyKey,
    phase: input.authority.phase,
    authority: input.authority,
    source: input.source,
    proxy: input.proxy,
    checkpoint: input.checkpoint,
    coverage: input.coverage,
    evidenceSchemaVersion: input.evidenceSchemaVersion,
    promptPolicyVersion: input.promptPolicyVersion,
    serverReadiness: input.serverReadiness,
    worker: {
      target: PRIVATE_GCP_VISUAL_UNDERSTANDING_WORKER_TARGET,
      accelerator: PRIVATE_GCP_VISUAL_UNDERSTANDING_ACCELERATOR,
      executionMode: 'private_self_hosted_gcp_gpu' as const,
      externalProviderApiPrimary: false as const,
      browserExecutionAllowed: false as const,
    },
    cacheKeySha256,
  }

  return {
    ...immutablePayload,
    planHash: sha256(stableStringify(immutablePayload)),
    structurallyValid: errors.length === 0,
    executionReady: errors.length === 0 && blockers.length === 0,
    blockers: [...errors.map((error) => `invalid_contract:${error}`), ...blockers],
    boundaries: {
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
    },
  }
}

export function finalizePrivateGcpVisualEvidencePackage(input: {
  plan: PrivateGcpVisualUnderstandingPlan
  observations: PrivateGcpVisualObservation[]
  coveredRequiredWindowIds: string[]
  unsupportedClaimCount: number
  deterministicQaPassed: boolean
  audioOrTranscriptAuthorityClaimed?: boolean
}, options: HistoricalPrivateGcpVisualConstructionOptions = {}):
  PrivateGcpVisualEvidencePackage {
  if (options.historicalReadOnly !== true) {
    throw new Error(
      'private_gcp_qwen_visual_retired_use_visual_intelligence',
    )
  }
  const withoutHash = {
    schemaVersion: 'private-gcp-qwen25vl-evidence-package-v1' as const,
    analysisRunId: input.plan.analysisRunId,
    attemptId: input.plan.attemptId,
    planHash: input.plan.planHash,
    sourceChecksumSha256: input.plan.source.sourceChecksumSha256,
    proxyChecksumSha256: input.plan.proxy.proxyChecksumSha256,
    checkpointSha256: input.plan.checkpoint.checkpointSha256,
    coverageDigestSha256: input.plan.coverage.coverageDigestSha256,
    cacheKeySha256: input.plan.cacheKeySha256,
    observations: input.observations.map((observation) => ({
      ...observation,
      evidenceSampleIds: [...observation.evidenceSampleIds],
    })),
    coveredRequiredWindowIds: [...input.coveredRequiredWindowIds],
    unsupportedClaimCount: input.unsupportedClaimCount,
    deterministicQaPassed: input.deterministicQaPassed,
    privateArtifact: true as const,
    rawFramePersisted: false as const,
    audioOrTranscriptAuthorityClaimed: input.audioOrTranscriptAuthorityClaimed === true,
    providerCallMade: false as const,
    customerChargeCreated: false as const,
  }
  return {
    ...withoutHash,
    evidencePackageHash: sha256(stableStringify(withoutHash)),
  }
}

export function verifyPrivateGcpVisualEvidencePackage(input: {
  plan: PrivateGcpVisualUnderstandingPlan
  evidence: PrivateGcpVisualEvidencePackage
}): PrivateGcpVisualEvidenceVerification {
  const { plan, evidence } = input
  const errors: string[] = []
  if (plan.planHash !== calculatePlanHash(plan)) {
    errors.push('Visual understanding plan failed immutable identity verification.')
  }
  if (!plan.executionReady) errors.push('Visual evidence cannot become authoritative from a plan that was not execution-ready.')
  if (evidence.schemaVersion !== 'private-gcp-qwen25vl-evidence-package-v1') {
    errors.push('Visual evidence schema version is not supported.')
  }
  if (evidence.analysisRunId !== plan.analysisRunId || evidence.attemptId !== plan.attemptId) {
    errors.push('Visual evidence does not match the exact analysis run and attempt.')
  }
  if (
    evidence.planHash !== plan.planHash ||
    evidence.sourceChecksumSha256 !== plan.source.sourceChecksumSha256 ||
    evidence.proxyChecksumSha256 !== plan.proxy.proxyChecksumSha256 ||
    evidence.checkpointSha256 !== plan.checkpoint.checkpointSha256 ||
    evidence.coverageDigestSha256 !== plan.coverage.coverageDigestSha256 ||
    evidence.cacheKeySha256 !== plan.cacheKeySha256
  ) {
    errors.push('Visual evidence identity is not bound to the exact plan/source/proxy/checkpoint/coverage/cache authority.')
  }
  if (evidence.evidencePackageHash !== evidencePackageHash(evidence)) {
    errors.push('Visual evidence package failed integrity verification.')
  }
  if (
    !evidence.privateArtifact || evidence.rawFramePersisted ||
    evidence.audioOrTranscriptAuthorityClaimed || evidence.providerCallMade ||
    evidence.customerChargeCreated
  ) {
    errors.push('Visual evidence crossed its private visual-only or commercial boundary.')
  }
  if (!evidence.deterministicQaPassed || evidence.unsupportedClaimCount !== 0) {
    errors.push('Visual evidence deterministic QA or unsupported-claim gate did not pass.')
  }

  const sampleIds = new Set(plan.coverage.samples.map((sample) => sample.sampleId))
  const requiredWindowIds = unique(plan.coverage.windows
    .filter((window) => window.required)
    .map((window) => window.windowId))
  const coveredRequiredWindowIds = unique(evidence.coveredRequiredWindowIds)
  if (coveredRequiredWindowIds.length !== evidence.coveredRequiredWindowIds.length) {
    errors.push('Visual evidence contains duplicate required-window identities.')
  }
  if (!sameStrings(requiredWindowIds, coveredRequiredWindowIds)) {
    errors.push('Visual evidence does not cover every exact required sampling window.')
  }
  if (evidence.observations.length < 1 || evidence.observations.length > 50_000) {
    errors.push('Visual evidence must contain a bounded non-empty observation set.')
  }
  const observationIds = new Set<string>()
  for (const observation of evidence.observations) {
    if (
      !validId(observation.observationId) || observationIds.has(observation.observationId) ||
      !Number.isInteger(observation.startFrame) || observation.startFrame < 0 ||
      !Number.isInteger(observation.endFrameExclusive) ||
      observation.endFrameExclusive <= observation.startFrame ||
      observation.endFrameExclusive > plan.source.durationFrames ||
      observation.summary.trim().length < 1 || observation.summary.length > 2_000 ||
      !OBSERVATION_CATEGORIES.has(observation.category) ||
      !Number.isInteger(observation.confidenceBasisPoints) ||
      observation.confidenceBasisPoints < 0 || observation.confidenceBasisPoints > 10_000 ||
      observation.evidenceSampleIds.length < 1 ||
      unique(observation.evidenceSampleIds).length !== observation.evidenceSampleIds.length ||
      (observation.userCorrectionId !== null && !validId(observation.userCorrectionId)) ||
      observation.evidenceSampleIds.some((sampleId) => !sampleIds.has(sampleId))
    ) {
      errors.push(`Visual observation ${observation.observationId || '<missing>'} is invalid or unsupported by exact samples.`)
    }
    observationIds.add(observation.observationId)
  }

  const userReviewRequired = evidence.observations.some(
    (observation) => observation.confidenceBasisPoints < 6_000,
  )
  return {
    ok: errors.length === 0,
    blocked: errors.length > 0 || userReviewRequired,
    errors,
    reasoningConsumptionAllowed: errors.length === 0 && !userReviewRequired,
    userReviewRequired,
    providerCallMade: false,
    customerChargeCreated: false,
  }
}

function validateInput(input: PrivateGcpVisualUnderstandingPlanInput): string[] {
  const errors: string[] = []
  for (const [field, value] of Object.entries({
    analysisRunId: input.analysisRunId,
    attemptId: input.attemptId,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    idempotencyKey: input.idempotencyKey,
  })) {
    if (!validId(value)) errors.push(`${field}_invalid`)
  }
  if (!Number.isInteger(input.attemptOrdinal) || input.attemptOrdinal < 1 || input.attemptOrdinal > 2) {
    errors.push('attempt_ordinal_invalid')
  }
  if (
    input.evidenceSchemaVersion !== 'private-gcp-qwen25vl-evidence-schema-v1' ||
    input.promptPolicyVersion !== 'private-gcp-qwen25vl-visual-prompt-policy-v1'
  ) errors.push('visual_policy_or_evidence_schema_invalid')
  validateAuthority(input, errors)
  validateSourceAndProxy(input, errors)
  validateCheckpoint(input, errors)
  validateCoverage(input, errors)
  return unique(errors)
}

function validateAuthority(input: PrivateGcpVisualUnderstandingPlanInput, errors: string[]): void {
  const authority = input.authority
  if (authority.phase === 'preplan_internal_source_analysis') {
    if (
      !validId(authority.authenticatedUserId) ||
      !validId(authority.sourceStudyAuthorizationId) ||
      !validId(authority.internalAnalysisBudgetAuthorityId) ||
      !validTimestamp(authority.userAnalysisConsentRecordedAt) ||
      authority.customerCreditReservationId !== null ||
      authority.customerChargeAuthorized !== false
    ) errors.push('preplan_analysis_authority_invalid')
    return
  }
  if (
    !validId(authority.approvedPlanSnapshotId) ||
    !validId(authority.creditReservationId) ||
    !validId(authority.approvedWorkItemId) ||
    authority.customerChargeAuthorized !== false
  ) errors.push('approved_visual_authority_invalid')
  if (
    authority.phase === 'postrender_private_visual_qa' &&
    (!validId(authority.privateRenderArtifactId) || !SHA256.test(authority.privateRenderSha256))
  ) errors.push('postrender_visual_qa_authority_invalid')
}

function validateSourceAndProxy(input: PrivateGcpVisualUnderstandingPlanInput, errors: string[]): void {
  const { source, proxy } = input
  if (
    !validId(source.sourceAssetId) || !validStorage(source.storageBucket, source.storageObjectName) ||
    !validGeneration(source.storageObjectGeneration) || !SHA256.test(source.sourceChecksumSha256) ||
    !Number.isSafeInteger(source.sourceByteLength) || source.sourceByteLength < 1 ||
    source.sourceByteLength > REEDITPRO_SOURCE_MEDIA_MAX_BYTES ||
    !validDimension(source.sourceWidth) || !validDimension(source.sourceHeight) ||
    !validFrameRate(source.frameRateNumerator, source.frameRateDenominator) ||
    !Number.isSafeInteger(source.durationFrames) || source.durationFrames < 1 ||
    durationSeconds(source) > 86_400 || !source.immutableOriginal || !source.privateObject
  ) errors.push('immutable_source_identity_invalid')
  if (
    !validId(proxy.proxyAssetId) || !validStorage(proxy.storageBucket, proxy.storageObjectName) ||
    !validGeneration(proxy.storageObjectGeneration) || !SHA256.test(proxy.proxyChecksumSha256) ||
    proxy.sourceChecksumSha256 !== source.sourceChecksumSha256 ||
    proxy.profileId !== PRIVATE_GCP_VISUAL_UNDERSTANDING_PROXY_PROFILE ||
    proxy.width < 128 || proxy.height < 128 || proxy.width > 1920 || proxy.height > 1080 ||
    proxy.outputColorSpace !== 'bt709' ||
    (proxy.colorTransformStatus !== 'validated_rec709_sdr' &&
      proxy.colorTransformStatus !== 'validated_color_managed_to_rec709') ||
    !proxy.privateObject || !proxy.originalMasterPreserved
  ) errors.push('analysis_proxy_identity_invalid')
}

function validateCheckpoint(input: PrivateGcpVisualUnderstandingPlanInput, errors: string[]): void {
  const checkpoint = input.checkpoint
  if (
    checkpoint.modelId !== PRIVATE_GCP_VISUAL_UNDERSTANDING_MODEL_ID ||
    !SHA256.test(checkpoint.checkpointSha256) ||
    !SHA256.test(checkpoint.tokenizerSha256) ||
    !SHA256.test(checkpoint.processorSha256) ||
    !IMAGE_DIGEST.test(checkpoint.containerImageDigest) ||
    !['bf16', 'fp16', 'int8_reviewed'].includes(checkpoint.precision) ||
    !validId(checkpoint.modelApprovalRecordId) ||
    !validId(checkpoint.licenseReviewRecordId)
  ) errors.push('model_checkpoint_identity_invalid')
}

function validateCoverage(input: PrivateGcpVisualUnderstandingPlanInput, errors: string[]): void {
  const { coverage, source } = input
  if (
    coverage.policyVersion !== 'private-gcp-qwen25vl-sampling-policy-v1' ||
    coverage.profileId !== expectedPrivateGcpVisualCoverageProfile(coverage.editLevel) ||
    !Number.isFinite(coverage.maximumUnobservedSpanSeconds) ||
    coverage.maximumUnobservedSpanSeconds <= 0 ||
    coverage.maximumUnobservedSpanSeconds > MAXIMUM_UNOBSERVED_SECONDS[coverage.profileId] ||
    !coverage.deterministicTechnicalCoverageComplete ||
    !validId(coverage.sceneDetectionArtifactId) ||
    !SHA256.test(coverage.sceneDetectionArtifactSha256) ||
    !Number.isSafeInteger(coverage.detectedSceneCount) || coverage.detectedSceneCount < 1 ||
    coverage.detectedSceneCount > 100_000 ||
    !Number.isSafeInteger(coverage.visuallyCoveredSceneCount) ||
    coverage.visuallyCoveredSceneCount < 0 ||
    coverage.visuallyCoveredSceneCount > coverage.detectedSceneCount ||
    coverage.samples.length < 1 || coverage.samples.length > 20_000 ||
    coverage.windows.length < 1 || coverage.windows.length > 20_000 ||
    coverage.samplesPerBatchMaximum !== 64 ||
    coverage.batchCount !== Math.ceil(coverage.samples.length / 64)
  ) errors.push('coverage_policy_invalid')

  if (
    coverage.profileId === 'professional_key_moment_visual_coverage_v1' &&
    coverage.visuallyCoveredSceneCount < Math.ceil(coverage.detectedSceneCount * 0.9)
  ) errors.push('premium_scene_coverage_insufficient')
  if (
    coverage.profileId === 'studio_scene_level_visual_coverage_v1' &&
    coverage.visuallyCoveredSceneCount !== coverage.detectedSceneCount
  ) errors.push('studio_scene_coverage_incomplete')

  const sampleIds = new Set<string>()
  for (const sample of coverage.samples) {
    if (
      !validId(sample.sampleId) || sampleIds.has(sample.sampleId) ||
      !INSPECTION_REASONS.has(sample.reason) ||
      !Number.isSafeInteger(sample.sourceFrame) || sample.sourceFrame < 0 ||
      sample.sourceFrame >= source.durationFrames || sample.rawFramePersistenceAllowed !== false
    ) {
      errors.push('visual_sample_invalid')
      continue
    }
    sampleIds.add(sample.sampleId)
    if (sample.source === 'analysis_proxy_frame') {
      if (!SHA256.test(sample.proxyFrameChecksumSha256 ?? '') || sample.crop !== undefined) {
        errors.push('proxy_sample_identity_invalid')
      }
    } else if (
      sample.source !== 'original_resolution_crop' ||
      !ALLOWED_ORIGINAL_CROP_REASONS.has(sample.reason) ||
      sample.proxyFrameChecksumSha256 !== undefined ||
      !sample.crop || !validCrop(sample.crop, source.sourceWidth, source.sourceHeight)
    ) {
      errors.push('original_crop_sample_invalid')
    }
  }

  const windowIds = new Set<string>()
  const samplesById = new Map(coverage.samples.map((sample) => [sample.sampleId, sample]))
  const referencedSampleIds = new Set<string>()
  const representedSceneIds = new Set<string>()
  for (const window of coverage.windows) {
    if (
      !validId(window.windowId) || windowIds.has(window.windowId) ||
      !INSPECTION_REASONS.has(window.reason) ||
      (window.detectedSceneId !== null && !validId(window.detectedSceneId)) ||
      (window.reason === 'scene_representative' && window.detectedSceneId === null) ||
      !Number.isSafeInteger(window.startFrame) || window.startFrame < 0 ||
      !Number.isSafeInteger(window.endFrameExclusive) ||
      window.endFrameExclusive <= window.startFrame ||
      window.endFrameExclusive > source.durationFrames ||
      (window.required && window.sampleIds.length < 1) ||
      unique(window.sampleIds).length !== window.sampleIds.length ||
      window.sampleIds.some((sampleId) => !sampleIds.has(sampleId))
    ) {
      errors.push('coverage_window_invalid')
      continue
    }
    if (window.sampleIds.some((sampleId) => {
      const sample = samplesById.get(sampleId)
      return !sample || sample.sourceFrame < window.startFrame || sample.sourceFrame >= window.endFrameExclusive
    })) errors.push('coverage_window_sample_out_of_range')
    for (const sampleId of window.sampleIds) referencedSampleIds.add(sampleId)
    if (window.detectedSceneId !== null) representedSceneIds.add(window.detectedSceneId)
    windowIds.add(window.windowId)
  }
  if (referencedSampleIds.size !== coverage.samples.length) {
    errors.push('coverage_contains_unreferenced_samples')
  }
  if (representedSceneIds.size !== coverage.visuallyCoveredSceneCount) {
    errors.push('scene_coverage_identity_count_mismatch')
  }
  if (calculateMaximumUnobservedSpanSeconds(input) > coverage.maximumUnobservedSpanSeconds) {
    errors.push('maximum_unobserved_span_exceeded')
  }
  const coverageWithoutDigest = { ...coverage }
  Reflect.deleteProperty(coverageWithoutDigest, 'coverageDigestSha256')
  if (coverage.coverageDigestSha256 !== calculatePrivateGcpVisualCoverageDigest(coverageWithoutDigest)) {
    errors.push('coverage_digest_invalid')
  }
}

function readinessBlockers(
  readiness: PrivateGcpVisualUnderstandingPlanInput['serverReadiness'],
): string[] {
  if (
    readiness.source !== 'server_owned_private_gcp_visual_readiness' ||
    readiness.executionEnvironment !== 'internal'
  ) {
    return ['server_owned_private_gcp_visual_readiness_not_verified']
  }
  const blockers: string[] = []
  if (
    readiness.readinessEvidenceId === null || !validId(readiness.readinessEvidenceId) ||
    readiness.readinessEvidenceSha256 === null || !SHA256.test(readiness.readinessEvidenceSha256) ||
    readiness.verifiedAt === null || !validTimestamp(readiness.verifiedAt)
  ) blockers.push('server_readiness_attestation_not_verified')
  const checks: Array<[keyof typeof readiness, string]> = [
    ['cloudRunJobResourceVerified', 'gcp_gpu_job_resource_not_verified'],
    ['workerServiceAccountAndIamVerified', 'gpu_worker_iam_not_verified'],
    ['privateGcsGenerationBoundTransportVerified', 'private_gcs_generation_transport_not_verified'],
    ['workerImageDigestVerified', 'gpu_worker_image_digest_not_verified'],
    ['checkpointPresentInApprovedImage', 'qwen25vl_checkpoint_presence_not_verified'],
    ['modelAndLicenseApprovalVerified', 'qwen25vl_model_or_license_approval_not_verified'],
    ['canonicalQueueLeaseAndOneUseDispatchVerified', 'canonical_queue_lease_and_one_use_dispatch_not_verified'],
    ['cancellationRetryAndLeaseRecoveryVerified', 'gpu_worker_recovery_not_verified'],
    ['telemetryAndCostRateSnapshotVerified', 'gpu_telemetry_or_rate_snapshot_not_verified'],
    ['deploymentRegionAndDataPolicyVerified', 'deployment_region_or_data_policy_not_verified'],
    ['environmentGpuExecutionGateVerified', 'internal_gpu_execution_gate_not_verified'],
  ]
  for (const [field, blocker] of checks) {
    if (readiness[field] !== true) blockers.push(blocker)
  }
  return blockers
}

function calculatePlanHash(plan: PrivateGcpVisualUnderstandingPlan): string {
  return sha256(stableStringify({
    schemaVersion: plan.schemaVersion,
    analysisRunId: plan.analysisRunId,
    attemptId: plan.attemptId,
    attemptOrdinal: plan.attemptOrdinal,
    workspaceId: plan.workspaceId,
    projectId: plan.projectId,
    editSessionId: plan.editSessionId,
    idempotencyKey: plan.idempotencyKey,
    phase: plan.phase,
    authority: plan.authority,
    source: plan.source,
    proxy: plan.proxy,
    checkpoint: plan.checkpoint,
    coverage: plan.coverage,
    evidenceSchemaVersion: plan.evidenceSchemaVersion,
    promptPolicyVersion: plan.promptPolicyVersion,
    serverReadiness: plan.serverReadiness,
    worker: plan.worker,
    cacheKeySha256: plan.cacheKeySha256,
  }))
}

function calculateMaximumUnobservedSpanSeconds(
  input: PrivateGcpVisualUnderstandingPlanInput,
): number {
  const frames = uniqueNumbers([
    0,
    ...input.coverage.samples.map((sample) => sample.sourceFrame),
    input.source.durationFrames - 1,
  ])
  let maximumGapFrames = 0
  for (let index = 1; index < frames.length; index += 1) {
    maximumGapFrames = Math.max(maximumGapFrames, frames[index] - frames[index - 1])
  }
  return maximumGapFrames * input.source.frameRateDenominator / input.source.frameRateNumerator
}

function evidencePackageHash(evidence: PrivateGcpVisualEvidencePackage): string {
  const withoutHash: Partial<PrivateGcpVisualEvidencePackage> = { ...evidence }
  delete withoutHash.evidencePackageHash
  return sha256(stableStringify(withoutHash))
}

function validId(value: string): boolean {
  return IDENTITY.test(value) && !value.includes('..')
}

function validTimestamp(value: string): boolean {
  const parsed = new Date(value)
  return Number.isFinite(parsed.getTime()) && parsed.toISOString() === value
}

function validStorage(bucket: string, objectName: string): boolean {
  return STORAGE_BUCKET.test(bucket) && objectName.length > 0 && objectName.length <= 1024 &&
    !objectName.includes('..') && !/^(?:https?:|gs:|\/)/iu.test(objectName) &&
    !/[\\?#]/u.test(objectName) && !containsControlCharacter(objectName)
}

function containsControlCharacter(value: string): boolean {
  return Array.from(value).some((character) => {
    const code = character.charCodeAt(0)
    return code <= 31 || code === 127
  })
}

function validGeneration(value: string): boolean {
  return /^[1-9][0-9]{0,30}$/u.test(value)
}

function validDimension(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 128 && value <= 16_384
}

function validFrameRate(numerator: number, denominator: number): boolean {
  return Number.isSafeInteger(numerator) && Number.isSafeInteger(denominator) &&
    numerator > 0 && denominator > 0 && numerator / denominator >= 1 && numerator / denominator <= 240
}

function durationSeconds(source: PrivateGcpVisualUnderstandingPlanInput['source']): number {
  return source.durationFrames * source.frameRateDenominator / source.frameRateNumerator
}

function validCrop(
  crop: NonNullable<PrivateGcpVisualUnderstandingPlanInput['coverage']['samples'][number]['crop']>,
  sourceWidth: number,
  sourceHeight: number,
): boolean {
  return Number.isSafeInteger(crop.x) && crop.x >= 0 &&
    Number.isSafeInteger(crop.y) && crop.y >= 0 &&
    Number.isSafeInteger(crop.width) && crop.width >= 32 && crop.width <= 4096 &&
    Number.isSafeInteger(crop.height) && crop.height >= 32 && crop.height <= 4096 &&
    crop.x + crop.width <= sourceWidth && crop.y + crop.height <= sourceHeight &&
    SHA256.test(crop.cropChecksumSha256)
}

function sameStrings(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index])
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values)).sort()
}

function uniqueNumbers(values: number[]): number[] {
  return Array.from(new Set(values)).sort((left, right) => left - right)
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}
