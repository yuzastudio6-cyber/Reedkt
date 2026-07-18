import { z } from 'zod'

import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'

export const PROFESSIONAL_LONG_FORM_OBJECT_EXECUTION_REQUEST_VERSION =
  'professional-long-form-object-execution-request-v1' as const
export const PROFESSIONAL_LONG_FORM_OBJECT_EXECUTION_PLAN_VERSION =
  'professional-long-form-object-execution-plan-v1' as const
export const PROFESSIONAL_LONG_FORM_OBJECT_CAPACITY_PROFILE_ID =
  'canonical_professional_4k_object_chunk_graph_6h_v1' as const

export const PROFESSIONAL_LONG_FORM_MINIMUM_SECONDS = 129
export const PROFESSIONAL_LONG_FORM_MAXIMUM_SECONDS = 6 * 60 * 60
export const PROFESSIONAL_LONG_FORM_TARGET_CHUNK_SECONDS = 120
export const PROFESSIONAL_LONG_FORM_MINIMUM_CHUNK_SECONDS = 45
export const PROFESSIONAL_LONG_FORM_MAXIMUM_CHUNK_SECONDS = 180
export const PROFESSIONAL_LONG_FORM_MAXIMUM_SOURCE_RANGES = 512
export const PROFESSIONAL_LONG_FORM_CANONICAL_WORK_ITEM_CEILING = 256
export const PROFESSIONAL_LONG_FORM_CANONICAL_DEPENDENCY_CEILING = 128
export const PROFESSIONAL_LONG_FORM_GLOBAL_WORK_ITEM_COUNT = 7
export const PROFESSIONAL_LONG_FORM_MAXIMUM_CHUNKS = Math.floor(
  (PROFESSIONAL_LONG_FORM_CANONICAL_WORK_ITEM_CEILING -
    PROFESSIONAL_LONG_FORM_GLOBAL_WORK_ITEM_COUNT) / 2,
)
export const PROFESSIONAL_LONG_FORM_UHD_PIXEL_CEILING = 3_840 * 2_160

export const PROFESSIONAL_LONG_FORM_FRAME_RATE_PROFILE_IDS = [
  'fps_23_976',
  'fps_24',
  'fps_25',
  'fps_29_97',
  'fps_30',
  'fps_50',
  'fps_59_94',
  'fps_60',
] as const

export type ProfessionalLongFormFrameRateProfileId =
  (typeof PROFESSIONAL_LONG_FORM_FRAME_RATE_PROFILE_IDS)[number]

const FRAME_RATE_PROFILES: Record<
  ProfessionalLongFormFrameRateProfileId,
  { numerator: number; denominator: number }
> = {
  fps_23_976: { numerator: 24_000, denominator: 1_001 },
  fps_24: { numerator: 24, denominator: 1 },
  fps_25: { numerator: 25, denominator: 1 },
  fps_29_97: { numerator: 30_000, denominator: 1_001 },
  fps_30: { numerator: 30, denominator: 1 },
  fps_50: { numerator: 50, denominator: 1 },
  fps_59_94: { numerator: 60_000, denominator: 1_001 },
  fps_60: { numerator: 60, denominator: 1 },
}

const identity = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const runtimeRegion = z.enum(['us-east1', 'europe-west1'])
const frameRateProfileId = z.enum(PROFESSIONAL_LONG_FORM_FRAME_RATE_PROFILE_IDS)

const frameRateSchema = z.object({
  profileId: frameRateProfileId,
  numerator: z.number().int().positive().max(60_000),
  denominator: z.number().int().positive().max(1_001),
}).strict()

const sourceRangeSchema = z.object({
  segmentId: identity,
  sourceSequenceItemId: identity,
  mediaAssetId: identity,
  sourceObjectGeneration: z.string().regex(/^[1-9][0-9]{0,30}$/u),
  sourceObjectRegion: runtimeRegion,
  sourceByteLength: z.number().int().positive().max(1024 ** 4),
  sourceSha256: sha256,
  sourceCleanupDecisionId: identity,
  sourceStartFrame: z.number().int().nonnegative(),
  sourceEndFrameExclusive: z.number().int().positive(),
  timelineStartFrame: z.number().int().nonnegative(),
  timelineEndFrameExclusive: z.number().int().positive(),
  editorialBoundaryBefore: z.enum(['timeline_start', 'approved_hard_cut']),
}).strict()

export const professionalLongFormObjectExecutionRequestSchema = z.object({
  schemaVersion: z.literal(PROFESSIONAL_LONG_FORM_OBJECT_EXECUTION_REQUEST_VERSION),
  identity: z.object({
    workspaceId: identity,
    projectId: identity,
    editSessionId: identity,
    planningRequestId: identity,
    approvedPlanId: identity,
    approvedPlanHash: sha256,
    approvedPlanSnapshotId: identity,
    approvedPlanSnapshotHash: sha256,
    approvedEstimateId: identity,
    approvedEstimateHash: sha256,
    approvalRecordId: identity,
    creditReservationId: identity,
    approvedWorkGraphHash: sha256,
    approvedTimingHash: sha256,
  }).strict(),
  runtimeRegion,
  confirmedOutputFrame: z.object({
    frameTemplateId: identity,
    width: z.number().int().min(720).max(3_840),
    height: z.number().int().min(720).max(3_840),
    confirmed: z.literal(true),
    deliveryCeilingProfileId: z.literal('uhd_2160_4k_ceiling_v1'),
    frameRate: frameRateSchema,
  }).strict(),
  totalFrames: z.number().int().positive().max(1_296_000),
  sourceRanges: z.array(sourceRangeSchema)
    .min(1)
    .max(PROFESSIONAL_LONG_FORM_MAXIMUM_SOURCE_RANGES),
  executionPolicy: z.object({
    videoChunkPolicy: z.literal('object_backed_frame_exact_mezzanine_v1'),
    audioPolicy: z.literal('single_continuous_timeline_mix_v1'),
    colorPolicy: z.literal('source_bound_transform_plus_boundary_continuity_v1'),
    transitionPolicy: z.literal('approved_hard_cuts_only_v1'),
    objectResidencyPolicy: z.literal('single_region_no_cross_region_copy_v1'),
    finalizationPolicy: z.literal('compatible_object_mezzanine_concat_or_block_v1'),
    requiredAssetPlaceholderPolicy: z.literal('forbidden_in_final_v1'),
  }).strict(),
  approvalAndCostBoundary: z.object({
    originalApprovedFourKEstimateReused: z.literal(true),
    originalApprovedReservationReused: z.literal(true),
    secondExportEstimateAllowed: z.literal(false),
    secondExportChargeAllowed: z.literal(false),
    attemptLevelInternalProductionCostEvidenceRequired: z.literal(true),
    customerCommercialAuthorityIncluded: z.literal(false),
  }).strict(),
}).strict().superRefine((request, context) => {
  const expectedRate = FRAME_RATE_PROFILES[request.confirmedOutputFrame.frameRate.profileId]
  if (
    request.confirmedOutputFrame.frameRate.numerator !== expectedRate.numerator ||
    request.confirmedOutputFrame.frameRate.denominator !== expectedRate.denominator
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['confirmedOutputFrame', 'frameRate'],
      message: 'Frame-rate identity does not match its exact rational time base.',
    })
  }
  if (
    request.confirmedOutputFrame.width % 2 !== 0 ||
    request.confirmedOutputFrame.height % 2 !== 0 ||
    request.confirmedOutputFrame.width * request.confirmedOutputFrame.height >
      PROFESSIONAL_LONG_FORM_UHD_PIXEL_CEILING
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['confirmedOutputFrame'],
      message: 'Confirmed output frame exceeds the approved even-dimension UHD ceiling.',
    })
  }

  const durationSeconds = request.totalFrames * expectedRate.denominator /
    expectedRate.numerator
  if (
    durationSeconds < PROFESSIONAL_LONG_FORM_MINIMUM_SECONDS ||
    durationSeconds > PROFESSIONAL_LONG_FORM_MAXIMUM_SECONDS
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['totalFrames'],
      message: 'Professional long-form duration must be between 129 seconds and six hours.',
    })
  }

  const segmentIds = new Set<string>()
  let expectedTimelineStart = 0
  request.sourceRanges.forEach((range, index) => {
    const sourceDuration = range.sourceEndFrameExclusive - range.sourceStartFrame
    const timelineDuration = range.timelineEndFrameExclusive - range.timelineStartFrame
    const validBoundary = index === 0
      ? range.editorialBoundaryBefore === 'timeline_start'
      : range.editorialBoundaryBefore === 'approved_hard_cut'
    if (
      segmentIds.has(range.segmentId) ||
      range.sourceObjectRegion !== request.runtimeRegion ||
      range.timelineStartFrame !== expectedTimelineStart ||
      range.timelineEndFrameExclusive <= range.timelineStartFrame ||
      range.sourceEndFrameExclusive <= range.sourceStartFrame ||
      sourceDuration !== timelineDuration ||
      !validBoundary
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['sourceRanges', index],
        message: 'Source range lost unique, regional, contiguous, duration-preserving, or approved-boundary authority.',
      })
    }
    segmentIds.add(range.segmentId)
    expectedTimelineStart = range.timelineEndFrameExclusive
  })
  if (expectedTimelineStart !== request.totalFrames) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['sourceRanges'],
      message: 'Approved source ranges do not cover the complete frame-exact timeline.',
    })
  }
})

export type ProfessionalLongFormObjectExecutionRequest = z.infer<
  typeof professionalLongFormObjectExecutionRequestSchema
>

export const PROFESSIONAL_LONG_FORM_OBJECT_PLAN_SEED_VERSION =
  'professional-long-form-object-plan-seed-v1' as const

export function deriveProfessionalLongFormObjectPlanSeed(
  request: ProfessionalLongFormObjectExecutionRequest,
) {
  return {
    schemaVersion: PROFESSIONAL_LONG_FORM_OBJECT_PLAN_SEED_VERSION,
    identity: {
      workspaceId: request.identity.workspaceId,
      projectId: request.identity.projectId,
      editSessionId: request.identity.editSessionId,
      planningRequestId: request.identity.planningRequestId,
      approvedTimingHash: request.identity.approvedTimingHash,
    },
    runtimeRegion: request.runtimeRegion,
    confirmedOutputFrame: request.confirmedOutputFrame,
    totalFrames: request.totalFrames,
    sourceRanges: request.sourceRanges,
    executionPolicy: request.executionPolicy,
    approvalAndCostBoundary: request.approvalAndCostBoundary,
  }
}

export type ProfessionalLongFormObjectPlanSeed = ReturnType<
  typeof deriveProfessionalLongFormObjectPlanSeed
>

export function verifyProfessionalLongFormObjectPlanSeed(
  input: unknown,
): ProfessionalLongFormObjectPlanSeed {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Professional long-form object-plan seed is malformed.')
  }
  const record = input as Record<string, unknown>
  const seedIdentity = record.identity
  if (!seedIdentity || typeof seedIdentity !== 'object' || Array.isArray(seedIdentity)) {
    throw new Error('Professional long-form object-plan seed identity is malformed.')
  }
  const seedIdentityRecord = seedIdentity as Record<string, unknown>
  const verificationHash = '0'.repeat(64)
  const reconstructedRequest = professionalLongFormObjectExecutionRequestSchema.parse({
    schemaVersion: PROFESSIONAL_LONG_FORM_OBJECT_EXECUTION_REQUEST_VERSION,
    identity: {
      workspaceId: seedIdentityRecord.workspaceId,
      projectId: seedIdentityRecord.projectId,
      editSessionId: seedIdentityRecord.editSessionId,
      planningRequestId: seedIdentityRecord.planningRequestId,
      approvedPlanId: 'long-form-seed-verification-plan',
      approvedPlanHash: verificationHash,
      approvedPlanSnapshotId: 'long-form-seed-verification-snapshot',
      approvedPlanSnapshotHash: verificationHash,
      approvedEstimateId: 'long-form-seed-verification-estimate',
      approvedEstimateHash: verificationHash,
      approvalRecordId: 'long-form-seed-verification-approval',
      creditReservationId: 'long-form-seed-verification-reservation',
      approvedWorkGraphHash: verificationHash,
      approvedTimingHash: seedIdentityRecord.approvedTimingHash,
    },
    runtimeRegion: record.runtimeRegion,
    confirmedOutputFrame: record.confirmedOutputFrame,
    totalFrames: record.totalFrames,
    sourceRanges: record.sourceRanges,
    executionPolicy: record.executionPolicy,
    approvalAndCostBoundary: record.approvalAndCostBoundary,
  })
  const expected = deriveProfessionalLongFormObjectPlanSeed(reconstructedRequest)
  if (stableAuthorityStringify(expected) !== stableAuthorityStringify(input)) {
    throw new Error(
      'Professional long-form object-plan seed failed exact authority verification.',
    )
  }
  return expected
}

export interface ProfessionalLongFormChunkSourceSlice {
  segmentId: string
  sourceSequenceItemId: string
  mediaAssetId: string
  sourceObjectGeneration: string
  sourceSha256: string
  sourceCleanupDecisionId: string
  sourceStartFrame: number
  sourceEndFrameExclusive: number
  globalTimelineStartFrame: number
  globalTimelineEndFrameExclusive: number
  chunkLocalStartFrame: number
  chunkLocalEndFrameExclusive: number
  boundaryBefore: 'timeline_start' | 'approved_hard_cut' | 'continuous_technical_split'
}

export interface ProfessionalLongFormObjectChunk {
  chunkId: string
  chunkIndex: number
  chunkCount: number
  globalStartFrame: number
  globalEndFrameExclusive: number
  durationFrames: number
  sourceSlices: ProfessionalLongFormChunkSourceSlice[]
  expectedObject: {
    objectIdentity: string
    runtimeRegion: 'us-east1' | 'europe-west1'
    bucketPurpose: 'processed-media'
    contentType: 'video/x-matroska'
    ephemeralAccessGrantPersisted: false
    createOnlyRequired: true
  }
  requiredQa: {
    independentProbe: true
    exactFrameCount: true
    exactFrameRate: true
    exactOutputFrame: true
    colorMetadata: true
    sourceAndTimelineLineage: true
  }
  chunkAuthorityHash: string
}

export const PROFESSIONAL_LONG_FORM_WORK_ITEM_KINDS = [
  'validate_approved_snapshot',
  'validate_private_source_authority',
  'render_object_mezzanine_chunk',
  'qa_object_mezzanine_chunk',
  'mix_continuous_program_audio',
  'validate_master_timing',
  'validate_cross_chunk_color_continuity',
  'finalize_private_4k_master',
  'qa_private_4k_master',
] as const

export type ProfessionalLongFormWorkItemKind =
  (typeof PROFESSIONAL_LONG_FORM_WORK_ITEM_KINDS)[number]

export interface ProfessionalLongFormWorkItem {
  workItemId: string
  kind: ProfessionalLongFormWorkItemKind
  dependsOn: string[]
  expectedOutputIdentity: string
  required: true
  executionAuthorized: false
}

export interface ProfessionalLongFormObjectExecutionPlan {
  schemaVersion: typeof PROFESSIONAL_LONG_FORM_OBJECT_EXECUTION_PLAN_VERSION
  source: 'server_owned_professional_long_form_object_execution_planner'
  status: 'planning_contract_ready_execution_not_activated'
  request: ProfessionalLongFormObjectExecutionRequest
  planSeedHash: string
  capacity: {
    profileId: typeof PROFESSIONAL_LONG_FORM_OBJECT_CAPACITY_PROFILE_ID
    minimumSeconds: number
    maximumSeconds: number
    maximumSourceRanges: number
    maximumChunks: number
    canonicalWorkItemCeiling: number
    canonicalDependencyCeiling: number
    targetChunkSeconds: number
    sourceRangeCount: number
    uniqueSourceObjectCount: number
    chunkCount: number
    durationSeconds: number
  }
  chunks: ProfessionalLongFormObjectChunk[]
  workGraph: {
    workItems: ProfessionalLongFormWorkItem[]
    workItemCount: number
    chunkRenderCount: number
    chunkQaCount: number
    finalizationDependsOnEveryChunkQa: true
    noRequiredPlaceholder: true
    workGraphHash: string
  }
  finalization: {
    finalObjectIdentity: string
    runtimeRegion: 'us-east1' | 'europe-west1'
    sourceChunkAuthorityHashes: string[]
    videoPolicy: 'compatible_object_mezzanine_concat_or_block_v1'
    audioPolicy: 'single_continuous_timeline_mix_v1'
    colorPolicy: 'source_bound_transform_plus_boundary_continuity_v1'
    frameContinuityPolicy: 'exact_integer_frame_conservation_v1'
    crossRegionMediaTransferAllowed: false
    ephemeralAccessGrantPersisted: false
    fullProgramVideoReencodeRequired: false
    originalApprovedFourKEstimateReused: true
    secondEstimateOrChargeCreated: false
    finalizationAuthorityHash: string
  }
  costBoundary: {
    attemptLevelInternalProductionCostEvidenceRequired: true
    internalCostSeparateFromCustomerPrice: true
    internalCostSeparateFromCustomerCredits: true
    reeditproServiceFeeIncludedInToolCost: false
    customerCommercialAuthorityIncluded: false
  }
  readiness: {
    frameExactPlanningContractReady: true
    approvedSnapshotWiringVerified: false
    objectStorePersistenceVerified: false
    chunkRunnerExecutionVerified: false
    continuousAudioExecutionVerified: false
    crossChunkColorQaExecutionVerified: false
    finalizerExecutionVerified: false
    distributedDatabaseVerified: false
    liveGoogleCloudVerified: false
    stagingReady: false
    productReady: false
    productionReady: false
  }
  authorityHash: string
}

export function buildProfessionalLongFormObjectExecutionPlan(
  input: unknown,
): ProfessionalLongFormObjectExecutionPlan {
  const request = professionalLongFormObjectExecutionRequestSchema.parse(input)
  const rate = FRAME_RATE_PROFILES[request.confirmedOutputFrame.frameRate.profileId]
  const planSeedHash = sha256AuthorityValue(
    deriveProfessionalLongFormObjectPlanSeed(request),
  )
  const exactFramesPerTargetChunk = Math.max(
    1,
    Math.floor(PROFESSIONAL_LONG_FORM_TARGET_CHUNK_SECONDS * rate.numerator /
      rate.denominator),
  )
  const chunkCount = Math.min(
    Math.ceil(request.totalFrames / exactFramesPerTargetChunk),
    PROFESSIONAL_LONG_FORM_MAXIMUM_CHUNKS,
  )
  if (chunkCount < 2 || chunkCount > PROFESSIONAL_LONG_FORM_MAXIMUM_CHUNKS) {
    throw new Error('Professional long-form plan exceeds the fixed object-chunk ceiling.')
  }
  const baseDuration = Math.floor(request.totalFrames / chunkCount)
  const remainder = request.totalFrames % chunkCount
  const minimumChunkFrames = Math.ceil(
    PROFESSIONAL_LONG_FORM_MINIMUM_CHUNK_SECONDS * rate.numerator / rate.denominator,
  )
  const maximumChunkFrames = Math.floor(
    PROFESSIONAL_LONG_FORM_MAXIMUM_CHUNK_SECONDS * rate.numerator / rate.denominator,
  )
  if (
    baseDuration < minimumChunkFrames ||
    baseDuration + (remainder > 0 ? 1 : 0) > maximumChunkFrames
  ) {
    throw new Error('Professional long-form plan cannot produce balanced chunks inside its fixed duration window.')
  }

  let globalStartFrame = 0
  const chunks = Array.from({ length: chunkCount }, (_unused, offset) => {
    const durationFrames = baseDuration + (offset < remainder ? 1 : 0)
    const globalEndFrameExclusive = globalStartFrame + durationFrames
    const chunkIndex = offset + 1
    const sourceSlices = collectChunkSourceSlices(
      request.sourceRanges,
      globalStartFrame,
      globalEndFrameExclusive,
    )
    const chunkId = `long-form-chunk-${sha256AuthorityValue({
      planSeedHash,
      chunkIndex,
      chunkCount,
      globalStartFrame,
      globalEndFrameExclusive,
      sourceSlices,
    }).slice(0, 40)}`
    const objectIdentity = sha256AuthorityValue({
      planSeedHash,
      chunkId,
      runtimeRegion: request.runtimeRegion,
      objectRole: 'processed-media',
    })
    const withoutHash = {
      chunkId,
      chunkIndex,
      chunkCount,
      globalStartFrame,
      globalEndFrameExclusive,
      durationFrames,
      sourceSlices,
      expectedObject: {
        objectIdentity,
        runtimeRegion: request.runtimeRegion,
        bucketPurpose: 'processed-media' as const,
        contentType: 'video/x-matroska' as const,
        ephemeralAccessGrantPersisted: false as const,
        createOnlyRequired: true as const,
      },
      requiredQa: {
        independentProbe: true as const,
        exactFrameCount: true as const,
        exactFrameRate: true as const,
        exactOutputFrame: true as const,
        colorMetadata: true as const,
        sourceAndTimelineLineage: true as const,
      },
    }
    globalStartFrame = globalEndFrameExclusive
    return {
      ...withoutHash,
      chunkAuthorityHash: sha256AuthorityValue(withoutHash),
    }
  })
  if (globalStartFrame !== request.totalFrames) {
    throw new Error('Professional long-form chunk planning lost exact timeline frames.')
  }

  const workItems = buildWorkGraph(request, chunks)
  if (
    workItems.length > PROFESSIONAL_LONG_FORM_CANONICAL_WORK_ITEM_CEILING ||
    workItems.some((item) =>
      item.dependsOn.length > PROFESSIONAL_LONG_FORM_CANONICAL_DEPENDENCY_CEILING)
  ) {
    throw new Error(
      'Professional long-form work graph exceeds the canonical work-item or dependency ceiling.',
    )
  }
  const chunkQaIds = workItems
    .filter((item) => item.kind === 'qa_object_mezzanine_chunk')
    .map((item) => item.workItemId)
  const finalizationWorkItem = workItems.find(
    (item) => item.kind === 'finalize_private_4k_master',
  )
  if (
    !finalizationWorkItem ||
    chunkQaIds.some((workItemId) => !finalizationWorkItem.dependsOn.includes(workItemId))
  ) {
    throw new Error('Professional long-form finalization lost a required chunk-QA dependency.')
  }
  const finalizationWithoutHash = {
    finalObjectIdentity: sha256AuthorityValue({
      planSeedHash,
      objectRole: 'final-private-4k-master',
      runtimeRegion: request.runtimeRegion,
      chunkHashes: chunks.map((chunk) => chunk.chunkAuthorityHash),
    }),
    runtimeRegion: request.runtimeRegion,
    sourceChunkAuthorityHashes: chunks.map((chunk) => chunk.chunkAuthorityHash),
    videoPolicy: 'compatible_object_mezzanine_concat_or_block_v1' as const,
    audioPolicy: 'single_continuous_timeline_mix_v1' as const,
    colorPolicy: 'source_bound_transform_plus_boundary_continuity_v1' as const,
    frameContinuityPolicy: 'exact_integer_frame_conservation_v1' as const,
    crossRegionMediaTransferAllowed: false as const,
    ephemeralAccessGrantPersisted: false as const,
    fullProgramVideoReencodeRequired: false as const,
    originalApprovedFourKEstimateReused: true as const,
    secondEstimateOrChargeCreated: false as const,
  }
  const uniqueSourceObjectCount = new Set(
    request.sourceRanges.map((range) => `${range.mediaAssetId}:${range.sourceObjectGeneration}`),
  ).size
  const payload = {
    schemaVersion: PROFESSIONAL_LONG_FORM_OBJECT_EXECUTION_PLAN_VERSION,
    source: 'server_owned_professional_long_form_object_execution_planner' as const,
    status: 'planning_contract_ready_execution_not_activated' as const,
    request,
    planSeedHash,
    capacity: {
      profileId: PROFESSIONAL_LONG_FORM_OBJECT_CAPACITY_PROFILE_ID,
      minimumSeconds: PROFESSIONAL_LONG_FORM_MINIMUM_SECONDS,
      maximumSeconds: PROFESSIONAL_LONG_FORM_MAXIMUM_SECONDS,
      maximumSourceRanges: PROFESSIONAL_LONG_FORM_MAXIMUM_SOURCE_RANGES,
      maximumChunks: PROFESSIONAL_LONG_FORM_MAXIMUM_CHUNKS,
      canonicalWorkItemCeiling: PROFESSIONAL_LONG_FORM_CANONICAL_WORK_ITEM_CEILING,
      canonicalDependencyCeiling: PROFESSIONAL_LONG_FORM_CANONICAL_DEPENDENCY_CEILING,
      targetChunkSeconds: PROFESSIONAL_LONG_FORM_TARGET_CHUNK_SECONDS,
      sourceRangeCount: request.sourceRanges.length,
      uniqueSourceObjectCount,
      chunkCount,
      durationSeconds: request.totalFrames * rate.denominator / rate.numerator,
    },
    chunks,
    workGraph: {
      workItems,
      workItemCount: workItems.length,
      chunkRenderCount: chunks.length,
      chunkQaCount: chunks.length,
      finalizationDependsOnEveryChunkQa: true as const,
      noRequiredPlaceholder: true as const,
      workGraphHash: sha256AuthorityValue(workItems),
    },
    finalization: {
      ...finalizationWithoutHash,
      finalizationAuthorityHash: sha256AuthorityValue(finalizationWithoutHash),
    },
    costBoundary: {
      attemptLevelInternalProductionCostEvidenceRequired: true as const,
      internalCostSeparateFromCustomerPrice: true as const,
      internalCostSeparateFromCustomerCredits: true as const,
      reeditproServiceFeeIncludedInToolCost: false as const,
      customerCommercialAuthorityIncluded: false as const,
    },
    readiness: {
      frameExactPlanningContractReady: true as const,
      approvedSnapshotWiringVerified: false as const,
      objectStorePersistenceVerified: false as const,
      chunkRunnerExecutionVerified: false as const,
      continuousAudioExecutionVerified: false as const,
      crossChunkColorQaExecutionVerified: false as const,
      finalizerExecutionVerified: false as const,
      distributedDatabaseVerified: false as const,
      liveGoogleCloudVerified: false as const,
      stagingReady: false as const,
      productReady: false as const,
      productionReady: false as const,
    },
  }
  return {
    ...payload,
    authorityHash: sha256AuthorityValue(payload),
  }
}

export function verifyProfessionalLongFormObjectExecutionPlan(
  input: unknown,
): ProfessionalLongFormObjectExecutionPlan {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Professional long-form execution plan is malformed.')
  }
  const record = input as Record<string, unknown>
  if (
    record.schemaVersion !== PROFESSIONAL_LONG_FORM_OBJECT_EXECUTION_PLAN_VERSION ||
    typeof record.authorityHash !== 'string'
  ) {
    throw new Error('Professional long-form execution plan identity is invalid.')
  }
  const request = professionalLongFormObjectExecutionRequestSchema.parse(record.request)
  const expected = buildProfessionalLongFormObjectExecutionPlan(request)
  if (stableAuthorityStringify(expected) !== stableAuthorityStringify(input)) {
    throw new Error('Professional long-form execution plan failed exact authority verification.')
  }
  return expected
}

export function assertProfessionalLongFormObjectExecutionProductionAuthority(
  input: unknown,
): never {
  verifyProfessionalLongFormObjectExecutionPlan(input)
  throw new Error(
    'Professional long-form object planning does not authorize snapshot wiring, object storage, workers, cloud execution, staging, or production.',
  )
}

function collectChunkSourceSlices(
  sourceRanges: ProfessionalLongFormObjectExecutionRequest['sourceRanges'],
  chunkStart: number,
  chunkEnd: number,
): ProfessionalLongFormChunkSourceSlice[] {
  return sourceRanges.flatMap((range) => {
    const overlapStart = Math.max(chunkStart, range.timelineStartFrame)
    const overlapEnd = Math.min(chunkEnd, range.timelineEndFrameExclusive)
    if (overlapEnd <= overlapStart) return []
    const sourceOffset = overlapStart - range.timelineStartFrame
    return [{
      segmentId: range.segmentId,
      sourceSequenceItemId: range.sourceSequenceItemId,
      mediaAssetId: range.mediaAssetId,
      sourceObjectGeneration: range.sourceObjectGeneration,
      sourceSha256: range.sourceSha256,
      sourceCleanupDecisionId: range.sourceCleanupDecisionId,
      sourceStartFrame: range.sourceStartFrame + sourceOffset,
      sourceEndFrameExclusive: range.sourceStartFrame + sourceOffset +
        (overlapEnd - overlapStart),
      globalTimelineStartFrame: overlapStart,
      globalTimelineEndFrameExclusive: overlapEnd,
      chunkLocalStartFrame: overlapStart - chunkStart,
      chunkLocalEndFrameExclusive: overlapEnd - chunkStart,
      boundaryBefore: overlapStart === range.timelineStartFrame
        ? range.editorialBoundaryBefore
        : 'continuous_technical_split' as const,
    }]
  })
}

function buildWorkGraph(
  request: ProfessionalLongFormObjectExecutionRequest,
  chunks: ProfessionalLongFormObjectChunk[],
): ProfessionalLongFormWorkItem[] {
  const validateSnapshotId = 'long-form-validate-approved-snapshot'
  const validateSourcesId = 'long-form-validate-private-sources'
  const timingQaId = 'long-form-validate-master-timing'
  const audioMixId = 'long-form-mix-continuous-program-audio'
  const chunkWork = chunks.flatMap((chunk) => {
    const renderId = `${chunk.chunkId}:render`
    const qaId = `${chunk.chunkId}:qa`
    return [
      workItem(
        renderId,
        'render_object_mezzanine_chunk',
        [validateSnapshotId, validateSourcesId, timingQaId],
        chunk.expectedObject.objectIdentity,
      ),
      workItem(qaId, 'qa_object_mezzanine_chunk', [renderId], `${chunk.expectedObject.objectIdentity}:qa`),
    ]
  })
  const chunkQaIds = chunkWork
    .filter((item) => item.kind === 'qa_object_mezzanine_chunk')
    .map((item) => item.workItemId)
  const colorQaId = 'long-form-validate-cross-chunk-color-continuity'
  const finalizationId = 'long-form-finalize-private-4k-master'
  return [
    workItem(validateSnapshotId, 'validate_approved_snapshot', [], request.identity.approvedPlanSnapshotHash),
    workItem(validateSourcesId, 'validate_private_source_authority', [validateSnapshotId], sha256AuthorityValue(request.sourceRanges)),
    workItem(
      timingQaId,
      'validate_master_timing',
      [validateSnapshotId],
      request.identity.approvedTimingHash,
    ),
    ...chunkWork,
    workItem(audioMixId, 'mix_continuous_program_audio', [validateSourcesId, timingQaId], `${request.identity.approvedPlanSnapshotId}:continuous-audio`),
    workItem(colorQaId, 'validate_cross_chunk_color_continuity', chunkQaIds, `${request.identity.approvedPlanSnapshotId}:color-continuity`),
    workItem(finalizationId, 'finalize_private_4k_master', [...chunkQaIds, audioMixId, colorQaId, timingQaId], `${request.identity.approvedPlanSnapshotId}:private-4k-master`),
    workItem('long-form-qa-private-4k-master', 'qa_private_4k_master', [finalizationId], `${request.identity.approvedPlanSnapshotId}:private-4k-master-qa`),
  ]
}

function workItem(
  workItemId: string,
  kind: ProfessionalLongFormWorkItemKind,
  dependsOn: string[],
  expectedOutputIdentity: string,
): ProfessionalLongFormWorkItem {
  return {
    workItemId,
    kind,
    dependsOn,
    expectedOutputIdentity,
    required: true,
    executionAuthorized: false,
  }
}
