import { z } from 'zod'

import { workerConcurrencyPolicy } from '../cost-controls/worker-concurrency-policy'
import type { CanonicalProfessionalLongFormCurrentChildPackageAuthority } from
  '../services/canonical-professional-long-form-child-package-promotion-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
  type AuthorityJsonBlobRef,
} from '../services/private-edit-authority-store'
import { OFFLINE_MEDIA_BINARY_OPERATIONS } from
  '../tool-execution/media-binary-execution/offline-media-binary-protocol'
import { OFFLINE_REMOTION_RENDER_OPERATION } from
  '../tool-execution/remotion-render-execution/offline-remotion-render-execution-protocol'
import {
  CANONICAL_PRIVATE_GLOBAL_MAX_CONCURRENCY,
} from './canonical-private-resource-placement-authority'
import {
  CANONICAL_PRIVATE_PACKAGE_WORK_QUEUE_DEFINITION_VERSION,
  CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_ATTEMPT_POLICY_ID,
  CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_PLACEMENT_PROFILE_ID,
  CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_QUEUE_SOURCE,
  CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_REQUIRED_GATE,
  CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_TOOL_BINDING_POLICY_ID,
  canonicalPrivatePackageWorkQueueDefinitionSchema,
  canonicalPrivatePackageWorkQueueJobDefinitionSchema,
  type CanonicalPrivatePackageWorkQueueDefinition,
} from './canonical-private-package-work-queue-authority'
import {
  professionalLongFormContinuousProgramAudioCompletionSchema,
  professionalLongFormContinuousProgramAudioQaArtifactSchema,
  type ProfessionalLongFormContinuousProgramAudioQaArtifact,
} from './professional-long-form-continuous-program-audio-execution-contract'
import {
  professionalLongFormFirstObjectChunkMediaArtifactRefSchema,
  professionalLongFormFirstObjectChunkQaArtifactSchema,
  professionalLongFormFirstObjectChunkQaCompletionSchema,
  professionalLongFormFirstObjectChunkRenderCompletionSchema,
  type ProfessionalLongFormFirstObjectChunkQaArtifact,
} from './professional-long-form-first-object-chunk-execution-contract'
import {
  PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_WORK_ITEM_ID,
  professionalLongFormMasterAssemblyArtifactRefSchema,
  professionalLongFormMasterAssemblyCompletionSchema,
} from './professional-long-form-master-assembly-execution-contract'
import {
  PROFESSIONAL_LONG_FORM_MAXIMUM_CHUNKS,
  PROFESSIONAL_LONG_FORM_OBJECT_CAPACITY_PROFILE_ID,
} from './professional-long-form-object-execution-plan'
import {
  PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_WORK_ITEM_ID,
  professionalLongFormPrivateMasterQaArtifactSchema,
  professionalLongFormPrivateMasterQaCompletionSchema,
  type ProfessionalLongFormPrivateMasterQaArtifact,
} from './professional-long-form-private-master-qa-execution-contract'

export const CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_PACKAGE_VERSION =
  'canonical-professional-long-form-customer-delivery-package-v1' as const
export const CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_PLACEMENT_VERSION =
  'canonical-professional-long-form-customer-delivery-placement-v1' as const

export const PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_WORK_ITEM_KINDS = [
  'validate_private_review_master_qa',
  'encode_customer_delivery_h264_chunk',
  'qa_customer_delivery_h264_chunk',
  'mux_customer_delivery_h264_aac_master',
  'qa_customer_delivery_decoded_video',
  'qa_customer_delivery_decoded_audio',
  'reconcile_private_customer_delivery_download',
] as const

export type ProfessionalLongFormCustomerDeliveryWorkItemKind =
  (typeof PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_WORK_ITEM_KINDS)[number]

const identity = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const expectedOutputIdentity = z.string().trim().min(1).max(512)
const positiveInteger = z.number().int().positive().max(Number.MAX_SAFE_INTEGER)
const jsonBlobRef = z.object({
  sha256,
  byteLength: positiveInteger.max(4 * 1024 * 1024),
}).strict()

const commercialBoundarySchema = z.object({
  internalProductionCostOnly: z.literal(true),
  customerPriceAuthorityIncluded: z.literal(false),
  customerCreditAuthorityIncluded: z.literal(false),
  serviceFeeAuthorityIncluded: z.literal(false),
  approvedFourKEstimateAndReservationReused: z.literal(true),
  customerDeliveryCoveredByOriginalApprovedEstimate: z.literal(true),
  secondExportEstimateCreated: z.literal(false),
  secondExportChargeCreated: z.literal(false),
  exportTimeEstimatePromptAllowed: z.literal(false),
  exportTimeCreditPromptAllowed: z.literal(false),
  walletMutationAuthorized: z.literal(false),
  settlementAuthorized: z.literal(false),
  billingAuthorized: z.literal(false),
}).strict()

const sourceChunkSchema = z.object({
  chunkId: identity,
  chunkIndex: z.number().int().min(1).max(PROFESSIONAL_LONG_FORM_MAXIMUM_CHUNKS),
  chunkCount: z.number().int().min(2).max(PROFESSIONAL_LONG_FORM_MAXIMUM_CHUNKS),
  globalStartFrame: z.number().int().nonnegative().max(647_999),
  globalEndFrameExclusive: z.number().int().positive().max(648_000),
  durationFrames: z.number().int().min(1_350).max(5_400),
  chunkAuthorityHash: sha256,
  sourceRenderJobId: identity,
  sourceRenderQueueCompletionHash: sha256,
  sourceRenderCanonicalResultHash: sha256,
  sourceRenderAttemptInternalCostEvidenceHash: sha256,
  sourceQaJobId: identity,
  sourceQaQueueCompletionHash: sha256,
  sourceQaCanonicalResultHash: sha256,
  sourceQaAttemptInternalCostEvidenceHash: sha256,
  sourceQaArtifactRef: jsonBlobRef,
  sourceQaArtifactHash: sha256,
  vp9Artifact: professionalLongFormFirstObjectChunkMediaArtifactRefSchema,
}).strict()

const toolPlanSchema = z.object({
  toolId: z.enum(['remotion', 'ffmpeg', 'ffprobe']).nullable(),
  operationId: identity.nullable(),
  runnerClass: identity,
  attemptCostProfileId: identity,
  fixedRecipeProfileId: identity,
  operationBindingStatus: z.literal(
    'blocked_pending_exact_runner_rate_cost_and_qa_authority',
  ),
}).strict().superRefine((plan, context) => {
  if ((plan.toolId === null) !== (plan.operationId === null)) {
    context.addIssue({
      code: 'custom',
      message: 'Customer-delivery tool and operation identity must be jointly present.',
    })
  }
})

export const professionalLongFormCustomerDeliveryWorkItemSchema = z.object({
  canonicalOrder: z.number().int().nonnegative().max(252),
  workItemId: identity,
  jobId: identity,
  kind: z.enum(PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_WORK_ITEM_KINDS),
  sourceChunkId: identity.optional(),
  dependencyJobIds: z.array(identity).max(128),
  satisfiedReviewDependencyJobIds: z.array(identity).max(1),
  expectedOutputIdentity,
  required: z.literal(true),
  executionAuthorized: z.literal(false),
  toolPlan: toolPlanSchema,
  workItemHash: sha256,
}).strict()

export type ProfessionalLongFormCustomerDeliveryWorkItem = z.infer<
  typeof professionalLongFormCustomerDeliveryWorkItemSchema
>

const deliveryWorkGraphSchema = z.object({
  source: z.literal('passed_private_review_master_qa'),
  deliverySeedHash: sha256,
  workItems: z.array(professionalLongFormCustomerDeliveryWorkItemSchema)
    .min(9).max(253),
  summary: z.object({
    chunkCount: z.number().int().min(2).max(PROFESSIONAL_LONG_FORM_MAXIMUM_CHUNKS),
    totalJobCount: z.number().int().min(9).max(253),
    rootJobCount: z.literal(1),
    h264EncodeJobCount: z.number().int().min(2).max(124),
    h264ChunkQaJobCount: z.number().int().min(2).max(124),
    finalMuxJobCount: z.literal(1),
    decodedVideoQaJobCount: z.literal(1),
    decodedAudioQaJobCount: z.literal(1),
    privateDownloadReconciliationJobCount: z.literal(1),
    maximumDependencyCount: z.number().int().min(2).max(124),
    everyJobRequired: z.literal(true),
    everyJobExecutionBlocked: z.literal(true),
  }).strict(),
  workGraphHash: sha256,
}).strict().superRefine((graph, context) => {
  const items = graph.workItems
  const jobIds = new Set(items.map((item) => item.jobId))
  const expectedCount = graph.summary.chunkCount * 2 + 5
  const roots = items.filter((item) =>
    item.satisfiedReviewDependencyJobIds.length === 1)
  const invalidOrderOrHash = items.some((item, index) => {
    const { workItemHash, ...payload } = item
    return item.canonicalOrder !== index ||
      workItemHash !== sha256AuthorityValue(payload)
  })
  const invalidDependency = items.some((item) =>
    item.dependencyJobIds.some((dependencyJobId) =>
      !jobIds.has(dependencyJobId) || dependencyJobId === item.jobId) ||
    item.dependencyJobIds.some((dependencyJobId) => {
      const dependency = items.find((candidate) =>
        candidate.jobId === dependencyJobId)
      return !dependency || dependency.canonicalOrder >= item.canonicalOrder
    }))
  if (
    items.length !== expectedCount ||
    graph.summary.totalJobCount !== expectedCount ||
    graph.summary.h264EncodeJobCount !== graph.summary.chunkCount ||
    graph.summary.h264ChunkQaJobCount !== graph.summary.chunkCount ||
    roots.length !== 1 || roots[0]?.canonicalOrder !== 0 ||
    new Set(items.map((item) => item.workItemId)).size !== items.length ||
    jobIds.size !== items.length || invalidOrderOrHash || invalidDependency ||
    items.some((item) => item.executionAuthorized)
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Professional long-form customer-delivery graph is inconsistent.',
    })
  }
})

export const canonicalProfessionalLongFormCustomerDeliveryPackageSchema =
  z.object({
    schemaVersion: z.literal(
      CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_PACKAGE_VERSION,
    ),
    source: z.literal('canonical_professional_long_form_private_master_qa'),
    purpose: z.literal(
      'prepare_one_private_h264_aac_customer_delivery_package_without_second_charge',
    ),
    status: z.literal(
      'immutable_private_customer_delivery_package_prepared_execution_blocked',
    ),
    identity: z.object({
      ownerUserId: identity,
      workspaceId: identity,
      projectId: identity,
      editSessionId: identity,
      approvedPlanId: identity,
      approvedPlanSnapshotId: identity,
      approvedPlanSnapshotHash: sha256,
      approvedEstimateId: identity,
      creditReservationId: identity,
      sourceReviewPackageRecordId: identity,
      packageRecordId: identity,
    }).strict(),
    approval: z.object({
      approvedByUserId: identity,
      approvalRecordId: identity,
      approvedEstimateHash: sha256,
      reservationStatus: z.literal('reserved'),
      reservedCredits: positiveInteger,
      remainingReservedCredits: positiveInteger,
      reservationExpiresAt: timestamp,
      snapshotApprovedAt: timestamp,
    }).strict(),
    sourceReview: z.object({
      capacityProfileId: z.literal(PROFESSIONAL_LONG_FORM_OBJECT_CAPACITY_PROFILE_ID),
      reviewPackageHash: sha256,
      reviewQueueDefinitionHash: sha256,
      reviewQueueAggregateHash: sha256,
      reviewQueueTotalJobCount: z.number().int().min(11).max(255),
      reviewQueueCompletedJobCount: z.number().int().min(11).max(255),
      chunks: z.array(sourceChunkSchema).min(2).max(124),
      continuousProgramAudio: z.object({
        sourceJobId: identity,
        sourceQueueCompletionHash: sha256,
        sourceCanonicalResultHash: sha256,
        sourceAttemptInternalCostEvidenceHash: sha256,
        sourceQaAttemptInternalCostEvidenceHash: sha256,
        sourceQaArtifactRef: jsonBlobRef,
        sourceQaArtifactHash: sha256,
        artifact: z.object({
          objectIdentity: sha256,
          mediaFormat: z.literal('flac'),
          contentType: z.literal('audio/flac'),
          byteLength: positiveInteger.max(8 * 1024 * 1024 * 1024),
          sha256,
          totalFrames: z.number().int().min(1_350).max(648_000),
          sampleCount: z.number().int().min(2_160_000).max(1_036_800_000),
          sampleRate: z.literal(48_000),
          channels: z.literal(2),
          bitsPerRawSample: z.literal(24),
          objectVersion: z.literal(1),
          assetRole: z.literal('processed'),
          placeholderAllowed: z.literal(false),
          privateLocalCreateOnly: z.literal(true),
          databaseBacked: z.literal(false),
          publicDeliveryAuthorized: z.literal(false),
        }).strict(),
      }).strict(),
      privateReviewMaster: z.object({
        sourceJobId: identity,
        sourceQueueCompletionHash: sha256,
        sourceCanonicalResultHash: sha256,
        sourceAttemptInternalCostEvidenceHash: sha256,
        artifact: professionalLongFormMasterAssemblyArtifactRefSchema,
      }).strict(),
      privateMasterQa: z.object({
        sourceJobId: identity,
        sourceApprovedWorkItemId: identity,
        sourceQueueCompletionHash: sha256,
        sourceCanonicalResultHash: sha256,
        sourceAttemptInternalCostEvidenceHash: sha256,
        validationArtifactRef: jsonBlobRef,
        validationArtifactHash: sha256,
        outcome: z.literal('passed'),
        privateReviewGraphComplete: z.literal(true),
      }).strict(),
      sourceEvidenceHash: sha256,
    }).strict(),
    outputContract: z.object({
      deliveryProfileId: z.literal('uhd_2160'),
      estimateCostBasisProfileId: z.literal('uhd_2160'),
      mediaPolicyId: z.literal('approved_h264_aac_yuv420p_bt709_web_master_v1'),
      width: z.union([z.literal(2_160), z.literal(2_880), z.literal(3_840)]),
      height: z.union([z.literal(2_160), z.literal(2_700), z.literal(3_840)]),
      fps: z.literal(30),
      totalFrames: z.number().int().min(2_700).max(648_000),
      chunkCount: z.number().int().min(2).max(124),
      outputContainer: z.literal('mp4'),
      outputContentType: z.literal('video/mp4'),
      outputVideoCodec: z.literal('h264'),
      outputVideoProfile: z.literal('high'),
      outputPixelFormat: z.literal('yuv420p'),
      outputColorRange: z.literal('tv'),
      outputColorSpace: z.literal('bt709'),
      outputColorTransfer: z.literal('bt709'),
      outputColorPrimaries: z.literal('bt709'),
      outputAudioCodec: z.literal('aac'),
      outputAudioSampleRate: z.literal(48_000),
      outputAudioChannels: z.literal(2),
      fastStartRequired: z.literal(true),
      expectedPrivateMasterObjectIdentity: sha256,
      contractHash: sha256,
    }).strict(),
    graph: deliveryWorkGraphSchema,
    policy: z.object({
      videoChunkTranscodePolicy: z.literal(
        'bounded_vp9_object_chunk_to_h264_high_crf18_medium_v1',
      ),
      h264EncoderBoundary: z.literal(
        'pinned_remotion_bundled_h264_encoder_private_internal_only_v1',
      ),
      h264ChunkIndependentQaRequired: z.literal(true),
      finalVideoAssemblyPolicy: z.literal(
        'ordered_compatible_h264_chunk_stream_copy_v1',
      ),
      finalAudioAssemblyPolicy: z.literal(
        'encode_exact_continuous_flac_program_audio_to_aac_once_v1',
      ),
      fullProgramVideoReencodeAllowed: z.literal(false),
      decodedVideoQaRequired: z.literal(true),
      decodedAudioQualityAndSyncQaRequired: z.literal(true),
      privateDownloadReconciliationRequired: z.literal(true),
      attemptLevelInternalProductionCostEvidenceRequired: z.literal(true),
      placementProfileId: z.literal(
        CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_PLACEMENT_PROFILE_ID,
      ),
      attemptPolicyId: z.literal(
        CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_ATTEMPT_POLICY_ID,
      ),
      toolOperationBindingPolicyId: z.literal(
        CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_TOOL_BINDING_POLICY_ID,
      ),
      placementProfileAuthorityHash: sha256,
      operationBoundaryHash: sha256,
    }).strict(),
    commercialBoundary: commercialBoundarySchema,
    boundaries: z.object({
      immutableApprovedSnapshotRequired: z.literal(true),
      passedPrivateReviewMasterQaRequired: z.literal(true),
      exactOriginalReservationRequired: z.literal(true),
      newEstimateOrReservationAllowed: z.literal(false),
      mediaExecutionAuthorized: z.literal(false),
      leaseAuthorized: z.literal(false),
      dispatchAuthorized: z.literal(false),
      providerCallAuthorized: z.literal(false),
      googleCloudDispatchAuthorized: z.literal(false),
      distributedDatabaseMutationAuthorized: z.literal(false),
      customerBillingAuthorized: z.literal(false),
      walletMutationAuthorized: z.literal(false),
      publicDeliveryAuthorized: z.literal(false),
      productionExecutionAuthorized: z.literal(false),
    }).strict(),
    readiness: z.object({
      passedPrivateReviewMasterQaVerified: z.literal(true),
      immutableDeliveryGraphPrepared: z.literal(true),
      originalFourKEstimateAndReservationReused: z.literal(true),
      exactRunnerAuthorityVerified: z.literal(false),
      exactRateAndAttemptCostAuthorityVerified: z.literal(false),
      deliveryLeaseAndSingleUseDispatchVerified: z.literal(false),
      h264ChunkExecutionVerified: z.literal(false),
      h264ChunkQaVerified: z.literal(false),
      h264AacMasterMuxVerified: z.literal(false),
      decodedVideoQaVerified: z.literal(false),
      decodedAudioQaVerified: z.literal(false),
      privateDownloadVerified: z.literal(false),
      liveGoogleCloudVerified: z.literal(false),
      productReady: z.literal(false),
      productionReady: z.literal(false),
    }).strict(),
    preparedAt: timestamp,
    packageHash: sha256,
  }).strict().superRefine((value, context) => {
    const { packageHash, ...payload } = value
    if (
      packageHash !== sha256AuthorityValue(payload) ||
      value.identity.ownerUserId !== value.approval.approvedByUserId ||
      value.identity.packageRecordId === value.identity.sourceReviewPackageRecordId ||
      value.sourceReview.reviewQueueTotalJobCount !==
        value.sourceReview.reviewQueueCompletedJobCount ||
      value.sourceReview.chunks.length !== value.outputContract.chunkCount ||
      value.graph.summary.chunkCount !== value.outputContract.chunkCount ||
      value.outputContract.expectedPrivateMasterObjectIdentity !==
        value.graph.workItems.find((item) =>
          item.kind === 'mux_customer_delivery_h264_aac_master')
          ?.expectedOutputIdentity
    ) {
      context.addIssue({
        code: 'custom',
        message: 'Professional long-form customer-delivery package hash or lineage is invalid.',
      })
    }
  })

export type CanonicalProfessionalLongFormCustomerDeliveryPackage = z.infer<
  typeof canonicalProfessionalLongFormCustomerDeliveryPackageSchema
>

const placementSchema = z.object({
  canonicalOrder: z.number().int().nonnegative().max(252),
  workItemId: identity,
  jobId: identity,
  kind: z.enum(PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_WORK_ITEM_KINDS),
  dependencyJobIds: z.array(identity).max(128),
  satisfiedReviewDependencyJobIds: z.array(identity).max(1),
  expectedOutputIdentity,
  workerType: z.enum(['api_service', 'render_worker', 'qa_worker']),
  resourceClassId: z.enum([
    'control_plane_cpu_v1',
    'render_cpu_high_memory_v1',
    'qa_cpu_standard_v1',
  ]),
  plannedCloudExecutionTarget: z.enum(['cloud_run_service', 'cloud_run_job']),
  preferredAccelerator: z.literal('none'),
  cpuAllowed: z.literal(true),
  vcpuCount: z.union([z.literal(1), z.literal(2), z.literal(4)]),
  memoryGib: z.union([z.literal(1), z.literal(4), z.literal(8)]),
  workerConcurrencyLimit: z.number().int().positive().max(100),
  globalConcurrencyLimit: z.literal(CANONICAL_PRIVATE_GLOBAL_MAX_CONCURRENCY),
  placementProfileId: z.literal(
    CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_PLACEMENT_PROFILE_ID,
  ),
  attemptPolicyId: z.literal(
    CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_ATTEMPT_POLICY_ID,
  ),
  toolOperationBindingPolicyId: z.literal(
    CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_TOOL_BINDING_POLICY_ID,
  ),
  approvedToolIds: z.array(z.enum(['remotion', 'ffmpeg', 'ffprobe'])).max(1),
  approvedToolOperationIds: z.array(identity).max(1),
  attemptCostProfileId: identity,
  fixedRecipeProfileId: identity,
  providerExecutionMode: z.literal('none'),
  privateExecutionReady: z.literal(false),
  requiredGate: z.literal(
    CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_REQUIRED_GATE,
  ),
  maxAttempts: z.union([z.literal(1), z.literal(2)]),
  attemptTimeoutSeconds: z.number().int().min(300).max(21_600),
  scheduledFor: timestamp,
  placementHash: sha256,
}).strict()

export const canonicalProfessionalLongFormCustomerDeliveryPlacementManifestSchema =
  z.object({
    schemaVersion: z.literal(
      CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_PLACEMENT_VERSION,
    ),
    source: z.literal('immutable_professional_long_form_customer_delivery_package'),
    status: z.literal('every_delivery_job_placed_execution_blocked'),
    identity: z.object({
      workspaceId: identity,
      projectId: identity,
      editSessionId: identity,
      approvedPlanSnapshotId: identity,
      approvedPlanSnapshotHash: sha256,
      packageRecordId: identity,
      packageHash: sha256,
      sourceReviewPackageRecordId: identity,
      sourcePrivateMasterQaJobId: identity,
      sourcePrivateMasterQaQueueCompletionHash: sha256,
      placementProfileAuthorityHash: sha256,
    }).strict(),
    placements: z.array(placementSchema).min(9).max(253),
    summary: z.object({
      totalJobCount: z.number().int().min(9).max(253),
      rootJobCount: z.literal(1),
      controlPlaneJobCount: z.literal(2),
      renderJobCount: z.number().int().min(3).max(125),
      qaJobCount: z.number().int().min(4).max(126),
      privatelyExecutableJobCount: z.literal(0),
      blockedJobCount: z.number().int().min(9).max(253),
      maximumAttemptTimeoutSeconds: z.literal(21_600),
      everyPlacementServerDerived: z.literal(true),
    }).strict(),
    boundaries: z.object({
      sourcePrivateMasterQaDependencySatisfiedOnlyByPackagePromotion:
        z.literal(true),
      exactToolOperationBindingRequiredBeforeClaim: z.literal(true),
      attemptCostBudgetRequiredBeforeClaim: z.literal(true),
      privateArtifactQaReconciliationRequiredBeforeCompletion: z.literal(true),
      cloudDispatchAuthorized: z.literal(false),
      productionExecutionAuthorized: z.literal(false),
    }).strict(),
    manifestHash: sha256,
  }).strict().superRefine((value, context) => {
    const { manifestHash, ...payload } = value
    const roots = value.placements.filter((placement) =>
      placement.satisfiedReviewDependencyJobIds.length === 1)
    if (
      manifestHash !== sha256AuthorityValue(payload) ||
      value.placements.length !== value.summary.totalJobCount ||
      value.placements.length !== value.summary.blockedJobCount ||
      roots.length !== 1 || roots[0]?.canonicalOrder !== 0 ||
      value.placements.some((placement, index) => {
        const { placementHash, ...placementPayload } = placement
        return placement.canonicalOrder !== index ||
          placement.privateExecutionReady ||
          placementHash !== sha256AuthorityValue(placementPayload)
      })
    ) {
      context.addIssue({
        code: 'custom',
        message: 'Professional long-form customer-delivery placement is invalid.',
      })
    }
  })

export type CanonicalProfessionalLongFormCustomerDeliveryPlacementManifest =
  z.infer<
    typeof canonicalProfessionalLongFormCustomerDeliveryPlacementManifestSchema
  >

export interface ProfessionalLongFormCustomerDeliveryReviewedEvidence {
  chunkQa: Array<{
    chunkId: string
    qaArtifactRef: AuthorityJsonBlobRef
    qaArtifact: ProfessionalLongFormFirstObjectChunkQaArtifact
  }>
  programAudioQaArtifactRef: AuthorityJsonBlobRef
  programAudioQaArtifact: ProfessionalLongFormContinuousProgramAudioQaArtifact
  privateMasterQaArtifactRef: AuthorityJsonBlobRef
  privateMasterQaArtifact: ProfessionalLongFormPrivateMasterQaArtifact
}

export interface ProfessionalLongFormCustomerDeliveryGraphInputChunk {
  chunkId: string
  chunkIndex: number
  chunkCount: number
  artifactSha256: string
}

export function buildProfessionalLongFormCustomerDeliveryWorkGraph(input: {
  deliverySeedHash: string
  approvedPlanSnapshotId: string
  sourcePrivateMasterQaJobId: string
  chunks: ProfessionalLongFormCustomerDeliveryGraphInputChunk[]
  continuousProgramAudioSha256: string
}): z.infer<typeof deliveryWorkGraphSchema> {
  const deliverySeedHash = sha256.parse(input.deliverySeedHash)
  const snapshotId = identity.parse(input.approvedPlanSnapshotId)
  const sourceQaJobId = identity.parse(input.sourcePrivateMasterQaJobId)
  const chunks = [...input.chunks].sort((left, right) =>
    left.chunkIndex - right.chunkIndex)
  if (
    chunks.length < 2 || chunks.length > PROFESSIONAL_LONG_FORM_MAXIMUM_CHUNKS ||
    chunks.some((chunk, index) =>
      identity.safeParse(chunk.chunkId).success === false ||
      sha256.safeParse(chunk.artifactSha256).success === false ||
      chunk.chunkIndex !== index + 1 || chunk.chunkCount !== chunks.length)
  ) throw new Error('Customer-delivery graph requires every ordered reviewed chunk.')

  const workItems: Array<Omit<ProfessionalLongFormCustomerDeliveryWorkItem,
    'canonicalOrder' | 'workItemHash'>> = []
  const root = createGraphWorkItem({
    deliverySeedHash,
    discriminator: 'review-root',
    kind: 'validate_private_review_master_qa',
    dependencyJobIds: [],
    satisfiedReviewDependencyJobIds: [sourceQaJobId],
    expectedOutputIdentity: sha256AuthorityValue({
      deliverySeedHash,
      snapshotId,
      sourceQaJobId,
      result: 'review-master-qa-lineage-valid',
    }),
    toolPlan: toolPlanFor('validate_private_review_master_qa'),
  })
  workItems.push(root)

  const chunkQaJobIds: string[] = []
  for (const chunk of chunks) {
    const h264ObjectIdentity = sha256AuthorityValue({
      deliverySeedHash,
      snapshotId,
      chunkId: chunk.chunkId,
      sourceVp9Sha256: chunk.artifactSha256,
      output: 'private-h264-high-crf18-medium-video-only-mp4-v1',
    })
    const encode = createGraphWorkItem({
      deliverySeedHash,
      discriminator: `h264-${chunk.chunkIndex}`,
      kind: 'encode_customer_delivery_h264_chunk',
      sourceChunkId: chunk.chunkId,
      dependencyJobIds: [root.jobId],
      satisfiedReviewDependencyJobIds: [],
      expectedOutputIdentity: h264ObjectIdentity,
      toolPlan: toolPlanFor('encode_customer_delivery_h264_chunk'),
    })
    const qa = createGraphWorkItem({
      deliverySeedHash,
      discriminator: `h264-qa-${chunk.chunkIndex}`,
      kind: 'qa_customer_delivery_h264_chunk',
      sourceChunkId: chunk.chunkId,
      dependencyJobIds: [encode.jobId],
      satisfiedReviewDependencyJobIds: [],
      expectedOutputIdentity: `${h264ObjectIdentity}:qa`,
      toolPlan: toolPlanFor('qa_customer_delivery_h264_chunk'),
    })
    workItems.push(encode, qa)
    chunkQaJobIds.push(qa.jobId)
  }

  const finalMasterObjectIdentity = sha256AuthorityValue({
    deliverySeedHash,
    snapshotId,
    orderedChunkQaJobIds: chunkQaJobIds,
    continuousProgramAudioSha256: sha256.parse(
      input.continuousProgramAudioSha256,
    ),
    output: 'private-h264-aac-faststart-customer-delivery-master-v1',
  })
  const mux = createGraphWorkItem({
    deliverySeedHash,
    discriminator: 'final-mux',
    kind: 'mux_customer_delivery_h264_aac_master',
    dependencyJobIds: chunkQaJobIds,
    satisfiedReviewDependencyJobIds: [],
    expectedOutputIdentity: finalMasterObjectIdentity,
    toolPlan: toolPlanFor('mux_customer_delivery_h264_aac_master'),
  })
  const videoQa = createGraphWorkItem({
    deliverySeedHash,
    discriminator: 'decoded-video-qa',
    kind: 'qa_customer_delivery_decoded_video',
    dependencyJobIds: [mux.jobId],
    satisfiedReviewDependencyJobIds: [],
    expectedOutputIdentity: `${finalMasterObjectIdentity}:decoded-video-qa`,
    toolPlan: toolPlanFor('qa_customer_delivery_decoded_video'),
  })
  const audioQa = createGraphWorkItem({
    deliverySeedHash,
    discriminator: 'decoded-audio-qa',
    kind: 'qa_customer_delivery_decoded_audio',
    dependencyJobIds: [mux.jobId],
    satisfiedReviewDependencyJobIds: [],
    expectedOutputIdentity: `${finalMasterObjectIdentity}:decoded-audio-qa`,
    toolPlan: toolPlanFor('qa_customer_delivery_decoded_audio'),
  })
  const download = createGraphWorkItem({
    deliverySeedHash,
    discriminator: 'private-download',
    kind: 'reconcile_private_customer_delivery_download',
    dependencyJobIds: [videoQa.jobId, audioQa.jobId],
    satisfiedReviewDependencyJobIds: [],
    expectedOutputIdentity: `${finalMasterObjectIdentity}:private-download`,
    toolPlan: toolPlanFor('reconcile_private_customer_delivery_download'),
  })
  workItems.push(mux, videoQa, audioQa, download)

  const hashedItems = workItems.map((item, canonicalOrder) => {
    const payload = { canonicalOrder, ...item }
    return professionalLongFormCustomerDeliveryWorkItemSchema.parse({
      ...payload,
      workItemHash: sha256AuthorityValue(payload),
    })
  })
  const maximumDependencyCount = Math.max(
    ...hashedItems.map((item) => item.dependencyJobIds.length),
  )
  const graphPayload = {
    source: 'passed_private_review_master_qa' as const,
    deliverySeedHash,
    workItems: hashedItems,
    summary: {
      chunkCount: chunks.length,
      totalJobCount: hashedItems.length,
      rootJobCount: 1 as const,
      h264EncodeJobCount: chunks.length,
      h264ChunkQaJobCount: chunks.length,
      finalMuxJobCount: 1 as const,
      decodedVideoQaJobCount: 1 as const,
      decodedAudioQaJobCount: 1 as const,
      privateDownloadReconciliationJobCount: 1 as const,
      maximumDependencyCount,
      everyJobRequired: true as const,
      everyJobExecutionBlocked: true as const,
    },
  }
  return deliveryWorkGraphSchema.parse({
    ...graphPayload,
    workGraphHash: sha256AuthorityValue(graphPayload),
  })
}

export function buildCanonicalProfessionalLongFormCustomerDeliveryPackage(
  input: {
    ownerUserId: string
    current: CanonicalProfessionalLongFormCurrentChildPackageAuthority
    evidence: ProfessionalLongFormCustomerDeliveryReviewedEvidence
  },
): CanonicalProfessionalLongFormCustomerDeliveryPackage {
  const { current } = input
  const ownerUserId = identity.parse(input.ownerUserId)
  const snapshot = current.authority.snapshot
  const reservation = current.authority.reservation
  const plan = current.postApproval.bridge.binding.plan
  const remainingReservedCredits = reservation.reservedCredits -
    reservation.spentCredits - reservation.releasedCredits -
    reservation.refundedCredits
  if (
    snapshot.approvedByUserId !== ownerUserId ||
    current.authority.approval.approvedByUserId !== ownerUserId ||
    reservation.status !== 'reserved' ||
    reservation.id !== snapshot.reservationId ||
    current.authority.estimate.id !== snapshot.estimateId ||
    remainingReservedCredits <= 0 ||
    !plan.request.approvalAndCostBoundary.originalApprovedFourKEstimateReused ||
    !plan.request.approvalAndCostBoundary.originalApprovedReservationReused ||
    plan.request.approvalAndCostBoundary.secondExportEstimateAllowed ||
    plan.request.approvalAndCostBoundary.secondExportChargeAllowed ||
    current.queueAggregate.summary.completedJobCount !==
      current.queueAggregate.summary.totalJobCount
  ) throw new Error(
    'Customer-delivery packaging requires the exact completed funded review authority.',
  )

  const sourceReview = buildSourceReview(input)
  const packageRecordId = `long-form-delivery-package-${sha256AuthorityValue({
    snapshotHash: snapshot.snapshotHash,
    sourceReviewPackageHash: current.package.packageHash,
    sourceEvidenceHash: sourceReview.sourceEvidenceHash,
    outputPolicy: 'approved_h264_aac_yuv420p_bt709_web_master_v1',
  }).slice(0, 40)}`
  const deliverySeedHash = sha256AuthorityValue({
    packageRecordId,
    sourceEvidenceHash: sourceReview.sourceEvidenceHash,
    snapshotHash: snapshot.snapshotHash,
  })
  const graph = buildProfessionalLongFormCustomerDeliveryWorkGraph({
    deliverySeedHash,
    approvedPlanSnapshotId: snapshot.snapshotId,
    sourcePrivateMasterQaJobId: sourceReview.privateMasterQa.sourceJobId,
    chunks: sourceReview.chunks.map((chunk) => ({
      chunkId: chunk.chunkId,
      chunkIndex: chunk.chunkIndex,
      chunkCount: chunk.chunkCount,
      artifactSha256: chunk.vp9Artifact.sha256,
    })),
    continuousProgramAudioSha256:
      sourceReview.continuousProgramAudio.artifact.sha256,
  })
  const finalMaster = graph.workItems.find((item) =>
    item.kind === 'mux_customer_delivery_h264_aac_master')
  if (!finalMaster || !/^[a-f0-9]{64}$/u.test(finalMaster.expectedOutputIdentity)) {
    throw new Error('Customer-delivery graph lacks one exact final master identity.')
  }
  const frame = plan.request.confirmedOutputFrame
  const outputPayload = {
    deliveryProfileId: 'uhd_2160' as const,
    estimateCostBasisProfileId: 'uhd_2160' as const,
    mediaPolicyId: 'approved_h264_aac_yuv420p_bt709_web_master_v1' as const,
    width: frame.width as 2_160 | 2_880 | 3_840,
    height: frame.height as 2_160 | 2_700 | 3_840,
    fps: 30 as const,
    totalFrames: plan.request.totalFrames,
    chunkCount: sourceReview.chunks.length,
    outputContainer: 'mp4' as const,
    outputContentType: 'video/mp4' as const,
    outputVideoCodec: 'h264' as const,
    outputVideoProfile: 'high' as const,
    outputPixelFormat: 'yuv420p' as const,
    outputColorRange: 'tv' as const,
    outputColorSpace: 'bt709' as const,
    outputColorTransfer: 'bt709' as const,
    outputColorPrimaries: 'bt709' as const,
    outputAudioCodec: 'aac' as const,
    outputAudioSampleRate: 48_000 as const,
    outputAudioChannels: 2 as const,
    fastStartRequired: true as const,
    expectedPrivateMasterObjectIdentity: finalMaster.expectedOutputIdentity,
  }
  const outputContract = {
    ...outputPayload,
    contractHash: sha256AuthorityValue(outputPayload),
  }
  const policy = customerDeliveryPolicy()
  const preparedAt = sourceReview.privateMasterQa.completedAt
  if (Date.parse(reservation.expiresAt) <= Date.parse(preparedAt)) {
    throw new Error('Customer-delivery source review completed after reservation expiry.')
  }
  const payload = {
    schemaVersion:
      CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_PACKAGE_VERSION,
    source: 'canonical_professional_long_form_private_master_qa' as const,
    purpose:
      'prepare_one_private_h264_aac_customer_delivery_package_without_second_charge' as const,
    status:
      'immutable_private_customer_delivery_package_prepared_execution_blocked' as const,
    identity: {
      ownerUserId,
      workspaceId: snapshot.workspaceId,
      projectId: snapshot.projectId,
      editSessionId: snapshot.editSessionId,
      approvedPlanId: snapshot.planId,
      approvedPlanSnapshotId: snapshot.snapshotId,
      approvedPlanSnapshotHash: snapshot.snapshotHash,
      approvedEstimateId: snapshot.estimateId,
      creditReservationId: snapshot.reservationId,
      sourceReviewPackageRecordId: current.package.identity.packageRecordId,
      packageRecordId,
    },
    approval: {
      approvedByUserId: snapshot.approvedByUserId,
      approvalRecordId: snapshot.approvalId,
      approvedEstimateHash: snapshot.estimateHash,
      reservationStatus: 'reserved' as const,
      reservedCredits: reservation.reservedCredits,
      remainingReservedCredits,
      reservationExpiresAt: reservation.expiresAt,
      snapshotApprovedAt: snapshot.approvedAt,
    },
    sourceReview: withoutCompletedAt(sourceReview),
    outputContract,
    graph,
    policy,
    commercialBoundary: commercialBoundary(),
    boundaries: {
      immutableApprovedSnapshotRequired: true as const,
      passedPrivateReviewMasterQaRequired: true as const,
      exactOriginalReservationRequired: true as const,
      newEstimateOrReservationAllowed: false as const,
      mediaExecutionAuthorized: false as const,
      leaseAuthorized: false as const,
      dispatchAuthorized: false as const,
      providerCallAuthorized: false as const,
      googleCloudDispatchAuthorized: false as const,
      distributedDatabaseMutationAuthorized: false as const,
      customerBillingAuthorized: false as const,
      walletMutationAuthorized: false as const,
      publicDeliveryAuthorized: false as const,
      productionExecutionAuthorized: false as const,
    },
    readiness: {
      passedPrivateReviewMasterQaVerified: true as const,
      immutableDeliveryGraphPrepared: true as const,
      originalFourKEstimateAndReservationReused: true as const,
      exactRunnerAuthorityVerified: false as const,
      exactRateAndAttemptCostAuthorityVerified: false as const,
      deliveryLeaseAndSingleUseDispatchVerified: false as const,
      h264ChunkExecutionVerified: false as const,
      h264ChunkQaVerified: false as const,
      h264AacMasterMuxVerified: false as const,
      decodedVideoQaVerified: false as const,
      decodedAudioQaVerified: false as const,
      privateDownloadVerified: false as const,
      liveGoogleCloudVerified: false as const,
      productReady: false as const,
      productionReady: false as const,
    },
    preparedAt,
  }
  return canonicalProfessionalLongFormCustomerDeliveryPackageSchema.parse({
    ...payload,
    packageHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalProfessionalLongFormCustomerDeliveryPackage(
  input: {
    value: unknown
    ownerUserId: string
    current: CanonicalProfessionalLongFormCurrentChildPackageAuthority
    evidence: ProfessionalLongFormCustomerDeliveryReviewedEvidence
  },
): CanonicalProfessionalLongFormCustomerDeliveryPackage {
  const parsed = canonicalProfessionalLongFormCustomerDeliveryPackageSchema
    .parse(input.value)
  const expected = buildCanonicalProfessionalLongFormCustomerDeliveryPackage(input)
  if (stableAuthorityStringify(parsed) !== stableAuthorityStringify(expected)) {
    throw new Error('Customer-delivery package failed exact authority replay.')
  }
  return expected
}

export function buildCanonicalProfessionalLongFormCustomerDeliveryPlacementManifest(
  input: { package: CanonicalProfessionalLongFormCustomerDeliveryPackage },
): CanonicalProfessionalLongFormCustomerDeliveryPlacementManifest {
  const deliveryPackage =
    canonicalProfessionalLongFormCustomerDeliveryPackageSchema.parse(
      input.package,
    )
  const policy = customerDeliveryPolicy()
  if (
    deliveryPackage.policy.placementProfileAuthorityHash !==
      policy.placementProfileAuthorityHash ||
    deliveryPackage.policy.operationBoundaryHash !== policy.operationBoundaryHash
  ) throw new Error('Customer-delivery placement policy changed after packaging.')
  const placements = deliveryPackage.graph.workItems.map((workItem) => {
    const profile = placementFor(workItem.kind)
    const withoutHash = {
      canonicalOrder: workItem.canonicalOrder,
      workItemId: workItem.workItemId,
      jobId: workItem.jobId,
      kind: workItem.kind,
      dependencyJobIds: [...workItem.dependencyJobIds],
      satisfiedReviewDependencyJobIds: [
        ...workItem.satisfiedReviewDependencyJobIds,
      ],
      expectedOutputIdentity: workItem.expectedOutputIdentity,
      ...profile,
      placementProfileId:
        CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_PLACEMENT_PROFILE_ID,
      attemptPolicyId:
        CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_ATTEMPT_POLICY_ID,
      toolOperationBindingPolicyId:
        CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_TOOL_BINDING_POLICY_ID,
      approvedToolIds: workItem.toolPlan.toolId
        ? [workItem.toolPlan.toolId] : [],
      approvedToolOperationIds: workItem.toolPlan.operationId
        ? [workItem.toolPlan.operationId] : [],
      attemptCostProfileId: workItem.toolPlan.attemptCostProfileId,
      fixedRecipeProfileId: workItem.toolPlan.fixedRecipeProfileId,
      providerExecutionMode: 'none' as const,
      privateExecutionReady: false as const,
      requiredGate:
        CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_REQUIRED_GATE,
      scheduledFor: deliveryPackage.preparedAt,
    }
    return placementSchema.parse({
      ...withoutHash,
      placementHash: sha256AuthorityValue(withoutHash),
    })
  })
  const payload = {
    schemaVersion:
      CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_PLACEMENT_VERSION,
    source: 'immutable_professional_long_form_customer_delivery_package' as const,
    status: 'every_delivery_job_placed_execution_blocked' as const,
    identity: {
      workspaceId: deliveryPackage.identity.workspaceId,
      projectId: deliveryPackage.identity.projectId,
      editSessionId: deliveryPackage.identity.editSessionId,
      approvedPlanSnapshotId: deliveryPackage.identity.approvedPlanSnapshotId,
      approvedPlanSnapshotHash:
        deliveryPackage.identity.approvedPlanSnapshotHash,
      packageRecordId: deliveryPackage.identity.packageRecordId,
      packageHash: deliveryPackage.packageHash,
      sourceReviewPackageRecordId:
        deliveryPackage.identity.sourceReviewPackageRecordId,
      sourcePrivateMasterQaJobId:
        deliveryPackage.sourceReview.privateMasterQa.sourceJobId,
      sourcePrivateMasterQaQueueCompletionHash:
        deliveryPackage.sourceReview.privateMasterQa
          .sourceQueueCompletionHash,
      placementProfileAuthorityHash:
        deliveryPackage.policy.placementProfileAuthorityHash,
    },
    placements,
    summary: {
      totalJobCount: placements.length,
      rootJobCount: 1 as const,
      controlPlaneJobCount: 2 as const,
      renderJobCount: countWorker(placements, 'render_worker'),
      qaJobCount: countWorker(placements, 'qa_worker'),
      privatelyExecutableJobCount: 0 as const,
      blockedJobCount: placements.length,
      maximumAttemptTimeoutSeconds: 21_600 as const,
      everyPlacementServerDerived: true as const,
    },
    boundaries: {
      sourcePrivateMasterQaDependencySatisfiedOnlyByPackagePromotion:
        true as const,
      exactToolOperationBindingRequiredBeforeClaim: true as const,
      attemptCostBudgetRequiredBeforeClaim: true as const,
      privateArtifactQaReconciliationRequiredBeforeCompletion: true as const,
      cloudDispatchAuthorized: false as const,
      productionExecutionAuthorized: false as const,
    },
  }
  return canonicalProfessionalLongFormCustomerDeliveryPlacementManifestSchema
    .parse({ ...payload, manifestHash: sha256AuthorityValue(payload) })
}

export function assertCanonicalProfessionalLongFormCustomerDeliveryPlacementManifest(
  input: {
    value: unknown
    package: CanonicalProfessionalLongFormCustomerDeliveryPackage
  },
): CanonicalProfessionalLongFormCustomerDeliveryPlacementManifest {
  const parsed =
    canonicalProfessionalLongFormCustomerDeliveryPlacementManifestSchema
      .parse(input.value)
  const expected =
    buildCanonicalProfessionalLongFormCustomerDeliveryPlacementManifest(input)
  if (stableAuthorityStringify(parsed) !== stableAuthorityStringify(expected)) {
    throw new Error('Customer-delivery placement failed exact authority replay.')
  }
  return expected
}

export function buildCanonicalProfessionalLongFormCustomerDeliveryQueueDefinition(
  input: {
    package: CanonicalProfessionalLongFormCustomerDeliveryPackage
    packageRef: AuthorityJsonBlobRef
    placementManifest:
      CanonicalProfessionalLongFormCustomerDeliveryPlacementManifest
    placementManifestRef: AuthorityJsonBlobRef
  },
): CanonicalPrivatePackageWorkQueueDefinition {
  const deliveryPackage =
    canonicalProfessionalLongFormCustomerDeliveryPackageSchema.parse(
      input.package,
    )
  const placement =
    canonicalProfessionalLongFormCustomerDeliveryPlacementManifestSchema.parse(
      input.placementManifest,
    )
  assertBlobRef(input.packageRef, deliveryPackage)
  assertBlobRef(input.placementManifestRef, placement)
  if (
    placement.identity.packageHash !== deliveryPackage.packageHash ||
    placement.identity.packageRecordId !==
      deliveryPackage.identity.packageRecordId
  ) throw new Error('Customer-delivery queue lost persisted package authority.')
  const placements = new Map(placement.placements.map((value) => [
    value.jobId,
    value,
  ]))
  const jobs = deliveryPackage.graph.workItems.map((workItem) => {
    const selected = placements.get(workItem.jobId)
    if (!selected || selected.workItemId !== workItem.workItemId) {
      throw new Error('Customer-delivery queue job lacks exact placement.')
    }
    const withoutHash = {
      canonicalOrder: workItem.canonicalOrder,
      jobId: workItem.jobId,
      approvedWorkItemId: workItem.workItemId,
      workItemKey: workItem.workItemId,
      expectedOutputIdentity: workItem.expectedOutputIdentity,
      required: true,
      dependencyJobIds: [...workItem.dependencyJobIds],
      satisfiedPromotionDependencyJobIds: [
        ...workItem.satisfiedReviewDependencyJobIds,
      ],
      workerType: selected.workerType,
      resourceClassId: selected.resourceClassId,
      plannedCloudExecutionTarget: selected.plannedCloudExecutionTarget,
      preferredAccelerator: selected.preferredAccelerator,
      placementHash: selected.placementHash,
      privateExecutionReady: false as const,
      providerExecutionMode: 'none' as const,
      requiredGate:
        CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_REQUIRED_GATE,
      maxAttempts: selected.maxAttempts,
      attemptTimeoutSeconds: selected.attemptTimeoutSeconds,
      scheduledFor: selected.scheduledFor,
    }
    return canonicalPrivatePackageWorkQueueJobDefinitionSchema.parse({
      ...withoutHash,
      definitionHash: sha256AuthorityValue(withoutHash),
    })
  })
  const payload = {
    schemaVersion: CANONICAL_PRIVATE_PACKAGE_WORK_QUEUE_DEFINITION_VERSION,
    source: CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_QUEUE_SOURCE,
    identity: {
      workspaceId: deliveryPackage.identity.workspaceId,
      projectId: deliveryPackage.identity.projectId,
      editSessionId: deliveryPackage.identity.editSessionId,
      packageRecordId: deliveryPackage.identity.packageRecordId,
      approvedPlanSnapshotId:
        deliveryPackage.identity.approvedPlanSnapshotId,
      packageHash: deliveryPackage.packageHash,
      snapshotHash: deliveryPackage.identity.approvedPlanSnapshotHash,
      workGraphHash: deliveryPackage.graph.workGraphHash,
      placementManifestHash: placement.manifestHash,
      toolExecutionAuthorityHash:
        deliveryPackage.policy.operationBoundaryHash,
      approvedResourcePlacementAuthorityHash:
        deliveryPackage.policy.placementProfileAuthorityHash,
      professionalLongFormCustomerDeliveryAuthority: {
        capacityProfileId: PROFESSIONAL_LONG_FORM_OBJECT_CAPACITY_PROFILE_ID,
        sourceReviewPackageRecordId:
          deliveryPackage.identity.sourceReviewPackageRecordId,
        sourceReviewPackageHash:
          deliveryPackage.sourceReview.reviewPackageHash,
        sourceReviewQueueDefinitionHash:
          deliveryPackage.sourceReview.reviewQueueDefinitionHash,
        sourceReviewQueueAggregateHash:
          deliveryPackage.sourceReview.reviewQueueAggregateHash,
        sourcePrivateMasterQaJobId:
          deliveryPackage.sourceReview.privateMasterQa.sourceJobId,
        sourcePrivateMasterQaApprovedWorkItemId:
          deliveryPackage.sourceReview.privateMasterQa
            .sourceApprovedWorkItemId,
        sourcePrivateMasterQaQueueCompletionHash:
          deliveryPackage.sourceReview.privateMasterQa
            .sourceQueueCompletionHash,
        sourcePrivateMasterQaCanonicalResultHash:
          deliveryPackage.sourceReview.privateMasterQa
            .sourceCanonicalResultHash,
        sourcePrivateMasterQaArtifactHash:
          deliveryPackage.sourceReview.privateMasterQa
            .validationArtifactHash,
        deliveryPackageVersion:
          CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_PACKAGE_VERSION,
        deliveryPackageHash: deliveryPackage.packageHash,
        deliveryPackageRefSha256: input.packageRef.sha256,
        deliveryPlacementManifestHash: placement.manifestHash,
        deliveryPlacementManifestRefSha256:
          input.placementManifestRef.sha256,
        deliveryPackagePlacementProfileId:
          CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_PLACEMENT_PROFILE_ID,
        deliveryAttemptPolicyId:
          CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_ATTEMPT_POLICY_ID,
        deliveryToolOperationBindingPolicyId:
          CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_TOOL_BINDING_POLICY_ID,
        chunkCount: deliveryPackage.outputContract.chunkCount,
        deliveryJobCount: jobs.length,
        rootDeliveryJobCount: 1 as const,
        deliveryExecutionAuthorized: false as const,
      },
    },
    jobs,
    summary: {
      totalJobCount: jobs.length,
      requiredJobCount: jobs.length,
      cpuAnalysisJobCount: 0,
      gpuJobCount: 0,
      renderJobCount: jobs.filter((job) =>
        job.workerType === 'render_worker').length,
      allJobsHaveSnapshotBoundPlacement: true as const,
      callerSelectedJobs: false as const,
      callerSelectedDependencies: false as const,
      callerSelectedPlacement: false as const,
    },
    boundaries: {
      approvedSnapshotRequired: true as const,
      fundedReservationRequired: true as const,
      privateArtifactsQaAndReconciliationRequired: true as const,
      browserClaimAllowed: false as const,
      providerActivationAuthorized: false as const,
      customerBillingAuthorized: false as const,
      walletMutationAuthorized: false as const,
      publicDeliveryAuthorized: false as const,
      googleCloudDispatchAuthorized: false as const,
      productionExecutionAuthorized: false as const,
    },
  }
  return canonicalPrivatePackageWorkQueueDefinitionSchema.parse({
    ...payload,
    definitionHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalProfessionalLongFormCustomerDeliveryQueueDefinition(
  input: {
    value: unknown
    package: CanonicalProfessionalLongFormCustomerDeliveryPackage
    packageRef: AuthorityJsonBlobRef
    placementManifest:
      CanonicalProfessionalLongFormCustomerDeliveryPlacementManifest
    placementManifestRef: AuthorityJsonBlobRef
  },
): CanonicalPrivatePackageWorkQueueDefinition {
  const parsed = canonicalPrivatePackageWorkQueueDefinitionSchema.parse(
    input.value,
  )
  const expected =
    buildCanonicalProfessionalLongFormCustomerDeliveryQueueDefinition(input)
  if (stableAuthorityStringify(parsed) !== stableAuthorityStringify(expected)) {
    throw new Error('Customer-delivery queue failed exact authority replay.')
  }
  return expected
}

function buildSourceReview(input: {
  current: CanonicalProfessionalLongFormCurrentChildPackageAuthority
  evidence: ProfessionalLongFormCustomerDeliveryReviewedEvidence
}) {
  const { current, evidence } = input
  const plan = current.postApproval.bridge.binding.plan
  const evidenceByChunk = new Map(evidence.chunkQa.map((item) => [
    item.chunkId,
    item,
  ]))
  if (
    evidence.chunkQa.length !== plan.chunks.length ||
    evidenceByChunk.size !== plan.chunks.length
  ) throw new Error('Customer-delivery source lacks every unique chunk QA artifact.')
  const chunks = [...plan.chunks]
    .sort((left, right) => left.chunkIndex - right.chunkIndex)
    .map((chunk, index) => {
      const renderEntry = completedEntry(current, `${chunk.chunkId}:render`)
      const qaEntry = completedEntry(current, `${chunk.chunkId}:qa`)
      const renderCompletion =
        professionalLongFormFirstObjectChunkRenderCompletionSchema.parse(
          renderEntry.completion.outcome.professionalLongFormExecution,
        )
      const qaCompletion =
        professionalLongFormFirstObjectChunkQaCompletionSchema.parse(
          qaEntry.completion.outcome.professionalLongFormExecution,
        )
      const provided = evidenceByChunk.get(chunk.chunkId)
      const qaArtifact = professionalLongFormFirstObjectChunkQaArtifactSchema
        .parse(provided?.qaArtifact)
      assertNamedHash(qaArtifact, 'qaHash')
      if (
        !provided || chunk.chunkIndex !== index + 1 ||
        chunk.chunkCount !== plan.chunks.length ||
        provided.qaArtifactRef.sha256 !==
          qaCompletion.validationArtifactRef.sha256 ||
        provided.qaArtifactRef.byteLength !==
          qaCompletion.validationArtifactRef.byteLength ||
        qaArtifact.identity.chunkId !== chunk.chunkId ||
        qaArtifact.identity.jobId !== qaEntry.definition.jobId ||
        qaArtifact.outcome !== 'passed' ||
        qaArtifact.observed.frameCount !== chunk.durationFrames ||
        stableAuthorityStringify(qaArtifact.renderArtifact) !==
          stableAuthorityStringify(renderCompletion.outputArtifact) ||
        renderCompletion.outputArtifact.objectIdentity !==
          chunk.expectedObject.objectIdentity ||
        renderCompletion.outputArtifact.rendererLayerIdentity !==
          chunk.expectedObject.rendererLayerIdentity
      ) throw new Error('Customer-delivery source chunk lost exact QA authority.')
      return sourceChunkSchema.parse({
        chunkId: chunk.chunkId,
        chunkIndex: chunk.chunkIndex,
        chunkCount: chunk.chunkCount,
        globalStartFrame: chunk.globalStartFrame,
        globalEndFrameExclusive: chunk.globalEndFrameExclusive,
        durationFrames: chunk.durationFrames,
        chunkAuthorityHash: chunk.chunkAuthorityHash,
        sourceRenderJobId: renderEntry.definition.jobId,
        sourceRenderQueueCompletionHash: renderEntry.completion.completionHash,
        sourceRenderCanonicalResultHash: renderCompletion.canonicalResultHash,
        sourceRenderAttemptInternalCostEvidenceHash:
          renderCompletion.attemptInternalCostEvidenceHash,
        sourceQaJobId: qaEntry.definition.jobId,
        sourceQaQueueCompletionHash: qaEntry.completion.completionHash,
        sourceQaCanonicalResultHash: qaCompletion.canonicalResultHash,
        sourceQaAttemptInternalCostEvidenceHash:
          qaCompletion.attemptInternalCostEvidenceHash,
        sourceQaArtifactRef: provided.qaArtifactRef,
        sourceQaArtifactHash: qaArtifact.qaHash,
        vp9Artifact: renderCompletion.outputArtifact,
      })
    })

  const audioItem = plan.workGraph.workItems.find((item) =>
    item.kind === 'mix_continuous_program_audio')
  if (!audioItem) throw new Error('Customer-delivery source lacks program audio.')
  const audioEntry = completedEntry(current, audioItem.workItemId)
  const audioCompletion = professionalLongFormContinuousProgramAudioCompletionSchema
    .parse(audioEntry.completion.outcome.professionalLongFormExecution)
  const audioQa = professionalLongFormContinuousProgramAudioQaArtifactSchema
    .parse(evidence.programAudioQaArtifact)
  assertNamedHash(audioQa, 'qaHash')
  if (
    evidence.programAudioQaArtifactRef.sha256 !==
      audioCompletion.qaArtifactRef.sha256 ||
    evidence.programAudioQaArtifactRef.byteLength !==
      audioCompletion.qaArtifactRef.byteLength ||
    audioQa.outcome !== 'passed' ||
    stableAuthorityStringify(audioQa.outputArtifact) !==
      stableAuthorityStringify(audioCompletion.outputArtifact)
  ) throw new Error('Customer-delivery source program-audio QA changed.')

  const masterEntry = completedEntry(
    current,
    PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_WORK_ITEM_ID,
  )
  const masterCompletion = professionalLongFormMasterAssemblyCompletionSchema
    .parse(masterEntry.completion.outcome.professionalLongFormExecution)
  const privateQaEntry = completedEntry(
    current,
    PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_WORK_ITEM_ID,
  )
  const privateQaCompletion = professionalLongFormPrivateMasterQaCompletionSchema
    .parse(privateQaEntry.completion.outcome.professionalLongFormExecution)
  const privateQaArtifact = professionalLongFormPrivateMasterQaArtifactSchema
    .parse(evidence.privateMasterQaArtifact)
  assertNamedHash(privateQaArtifact, 'qaHash')
  if (
    evidence.privateMasterQaArtifactRef.sha256 !==
      privateQaCompletion.validationArtifactRef.sha256 ||
    evidence.privateMasterQaArtifactRef.byteLength !==
      privateQaCompletion.validationArtifactRef.byteLength ||
    privateQaArtifact.outcome !== 'passed' ||
    privateQaArtifact.identity.jobId !== privateQaEntry.definition.jobId ||
    stableAuthorityStringify(privateQaArtifact.masterArtifact) !==
      stableAuthorityStringify(masterCompletion.outputArtifact) ||
    privateQaEntry.completion.outcome.sha256 !==
      privateQaCompletion.validationArtifactRef.sha256
  ) throw new Error('Customer-delivery source private-master QA changed.')

  const sourcePayload = {
    capacityProfileId: PROFESSIONAL_LONG_FORM_OBJECT_CAPACITY_PROFILE_ID,
    reviewPackageHash: current.package.packageHash,
    reviewQueueDefinitionHash: current.queueDefinition.definitionHash,
    reviewQueueAggregateHash: current.queueAggregate.aggregateHash,
    reviewQueueTotalJobCount: current.queueAggregate.summary.totalJobCount,
    reviewQueueCompletedJobCount:
      current.queueAggregate.summary.completedJobCount,
    chunks,
    continuousProgramAudio: {
      sourceJobId: audioEntry.definition.jobId,
      sourceQueueCompletionHash: audioEntry.completion.completionHash,
      sourceCanonicalResultHash: audioCompletion.canonicalResultHash,
      sourceAttemptInternalCostEvidenceHash:
        audioCompletion.attemptInternalCostEvidenceHash,
      sourceQaAttemptInternalCostEvidenceHash:
        audioCompletion.qaAttemptInternalCostEvidenceHash,
      sourceQaArtifactRef: evidence.programAudioQaArtifactRef,
      sourceQaArtifactHash: audioQa.qaHash,
      artifact: audioCompletion.outputArtifact,
    },
    privateReviewMaster: {
      sourceJobId: masterEntry.definition.jobId,
      sourceQueueCompletionHash: masterEntry.completion.completionHash,
      sourceCanonicalResultHash: masterCompletion.canonicalResultHash,
      sourceAttemptInternalCostEvidenceHash:
        masterCompletion.attemptInternalCostEvidenceHash,
      artifact: masterCompletion.outputArtifact,
    },
    privateMasterQa: {
      sourceJobId: privateQaEntry.definition.jobId,
      sourceApprovedWorkItemId: privateQaEntry.definition.approvedWorkItemId,
      sourceQueueCompletionHash: privateQaEntry.completion.completionHash,
      sourceCanonicalResultHash: privateQaCompletion.canonicalResultHash,
      sourceAttemptInternalCostEvidenceHash:
        privateQaCompletion.attemptInternalCostEvidenceHash,
      validationArtifactRef: evidence.privateMasterQaArtifactRef,
      validationArtifactHash: privateQaArtifact.qaHash,
      outcome: 'passed' as const,
      privateReviewGraphComplete: true as const,
      completedAt: privateQaEntry.completion.completedAt,
    },
  }
  const hashPayload = withoutCompletedAt(sourcePayload)
  return {
    ...sourcePayload,
    sourceEvidenceHash: sha256AuthorityValue(hashPayload),
  }
}

function withoutCompletedAt<T extends {
  privateMasterQa: { completedAt?: string }
}>(value: T) {
  const privateMasterQa = { ...value.privateMasterQa }
  delete privateMasterQa.completedAt
  return { ...value, privateMasterQa }
}

function createGraphWorkItem(input: {
  deliverySeedHash: string
  discriminator: string
  kind: ProfessionalLongFormCustomerDeliveryWorkItemKind
  sourceChunkId?: string
  dependencyJobIds: string[]
  satisfiedReviewDependencyJobIds: string[]
  expectedOutputIdentity: string
  toolPlan: z.infer<typeof toolPlanSchema>
}) {
  const identitySeed = sha256AuthorityValue({
    deliverySeedHash: input.deliverySeedHash,
    discriminator: input.discriminator,
    kind: input.kind,
    sourceChunkId: input.sourceChunkId ?? null,
  })
  return {
    workItemId: `long-form-delivery-work-${identitySeed.slice(0, 40)}`,
    jobId: `long-form-delivery-job-${identitySeed.slice(0, 40)}`,
    kind: input.kind,
    ...(input.sourceChunkId ? { sourceChunkId: input.sourceChunkId } : {}),
    dependencyJobIds: input.dependencyJobIds,
    satisfiedReviewDependencyJobIds:
      input.satisfiedReviewDependencyJobIds,
    expectedOutputIdentity: input.expectedOutputIdentity,
    required: true as const,
    executionAuthorized: false as const,
    toolPlan: input.toolPlan,
  }
}

function toolPlanFor(kind: ProfessionalLongFormCustomerDeliveryWorkItemKind) {
  const plans = {
    validate_private_review_master_qa: {
      toolId: null,
      operationId: null,
      runnerClass: 'canonical_long_form_delivery_review_gate_v1',
      attemptCostProfileId: 'long_form_delivery_review_gate_cpu_1vcpu_1gib_v1',
      fixedRecipeProfileId: 'approved_private_review_master_qa_gate_v1',
    },
    encode_customer_delivery_h264_chunk: {
      toolId: 'remotion' as const,
      operationId: OFFLINE_REMOTION_RENDER_OPERATION,
      runnerClass: 'canonical_long_form_delivery_h264_chunk_remotion_v1',
      attemptCostProfileId: 'remotion_4k_h264_video_chunk_cpu_4vcpu_8gib_v1',
      fixedRecipeProfileId: 'approved_long_form_delivery_h264_video_chunk_v1',
    },
    qa_customer_delivery_h264_chunk: {
      toolId: 'ffprobe' as const,
      operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffprobe,
      runnerClass: 'canonical_long_form_delivery_h264_chunk_ffprobe_qa_v1',
      attemptCostProfileId: 'ffprobe_4k_h264_video_chunk_qa_cpu_2vcpu_4gib_v1',
      fixedRecipeProfileId: 'approved_long_form_delivery_h264_chunk_qa_v1',
    },
    mux_customer_delivery_h264_aac_master: {
      toolId: 'ffmpeg' as const,
      operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
      runnerClass: 'canonical_long_form_delivery_h264_aac_mux_v1',
      attemptCostProfileId: 'ffmpeg_4k_h264_aac_master_mux_cpu_4vcpu_8gib_v1',
      fixedRecipeProfileId: 'approved_long_form_delivery_h264_aac_master_v1',
    },
    qa_customer_delivery_decoded_video: {
      toolId: 'ffmpeg' as const,
      operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
      runnerClass: 'offline_media_binary_final_master_video_qa_v1',
      attemptCostProfileId: 'ffmpeg_4k_decoded_video_qa_cpu_2vcpu_4gib_v1',
      fixedRecipeProfileId: 'approved_final_master_decoded_video_integrity_v1',
    },
    qa_customer_delivery_decoded_audio: {
      toolId: 'ffmpeg' as const,
      operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
      runnerClass: 'offline_media_binary_final_master_audio_qa_v1',
      attemptCostProfileId: 'ffmpeg_4k_decoded_audio_qa_cpu_2vcpu_4gib_v1',
      fixedRecipeProfileId: 'approved_final_master_decoded_audio_quality_sync_v1',
    },
    reconcile_private_customer_delivery_download: {
      toolId: null,
      operationId: null,
      runnerClass: 'canonical_private_customer_delivery_download_reconciliation_v1',
      attemptCostProfileId: 'long_form_private_download_reconciliation_cpu_1vcpu_1gib_v1',
      fixedRecipeProfileId: 'approved_private_customer_delivery_download_v1',
    },
  } satisfies Record<
    ProfessionalLongFormCustomerDeliveryWorkItemKind,
    Omit<z.infer<typeof toolPlanSchema>, 'operationBindingStatus'>
  >
  return toolPlanSchema.parse({
    ...plans[kind],
    operationBindingStatus:
      'blocked_pending_exact_runner_rate_cost_and_qa_authority',
  })
}

function customerDeliveryPolicy() {
  const placementProfileAuthorityHash = sha256AuthorityValue({
    placementProfileId:
      CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_PLACEMENT_PROFILE_ID,
    attemptPolicyId:
      CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_ATTEMPT_POLICY_ID,
    kinds: PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_WORK_ITEM_KINDS.map(
      (kind) => ({ kind, ...placementFor(kind) }),
    ),
  })
  const operationBoundaryHash = sha256AuthorityValue({
    toolOperationBindingPolicyId:
      CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_TOOL_BINDING_POLICY_ID,
    requiredGate:
      CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_REQUIRED_GATE,
    operations: PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_WORK_ITEM_KINDS.map(
      (kind) => ({ kind, ...toolPlanFor(kind) }),
    ),
    privateExecutionReady: false,
    customerCommercialAuthorityIncluded: false,
  })
  return {
    videoChunkTranscodePolicy:
      'bounded_vp9_object_chunk_to_h264_high_crf18_medium_v1' as const,
    h264EncoderBoundary:
      'pinned_remotion_bundled_h264_encoder_private_internal_only_v1' as const,
    h264ChunkIndependentQaRequired: true as const,
    finalVideoAssemblyPolicy:
      'ordered_compatible_h264_chunk_stream_copy_v1' as const,
    finalAudioAssemblyPolicy:
      'encode_exact_continuous_flac_program_audio_to_aac_once_v1' as const,
    fullProgramVideoReencodeAllowed: false as const,
    decodedVideoQaRequired: true as const,
    decodedAudioQualityAndSyncQaRequired: true as const,
    privateDownloadReconciliationRequired: true as const,
    attemptLevelInternalProductionCostEvidenceRequired: true as const,
    placementProfileId:
      CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_PLACEMENT_PROFILE_ID,
    attemptPolicyId:
      CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_ATTEMPT_POLICY_ID,
    toolOperationBindingPolicyId:
      CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_TOOL_BINDING_POLICY_ID,
    placementProfileAuthorityHash,
    operationBoundaryHash,
  }
}

function placementFor(kind: ProfessionalLongFormCustomerDeliveryWorkItemKind) {
  const profiles = {
    validate_private_review_master_qa:
      placementProfile('api_service', 1, 1, 1, 300),
    encode_customer_delivery_h264_chunk:
      placementProfile('render_worker', 4, 8, 2, 21_600),
    qa_customer_delivery_h264_chunk:
      placementProfile('qa_worker', 2, 4, 2, 3_600),
    mux_customer_delivery_h264_aac_master:
      placementProfile('render_worker', 4, 8, 2, 21_600),
    qa_customer_delivery_decoded_video:
      placementProfile('qa_worker', 2, 4, 2, 21_600),
    qa_customer_delivery_decoded_audio:
      placementProfile('qa_worker', 2, 4, 2, 21_600),
    reconcile_private_customer_delivery_download:
      placementProfile('api_service', 1, 1, 1, 300),
  } satisfies Record<
    ProfessionalLongFormCustomerDeliveryWorkItemKind,
    ReturnType<typeof placementProfile>
  >
  return profiles[kind]
}

function placementProfile(
  workerType: 'api_service' | 'render_worker' | 'qa_worker',
  vcpuCount: 1 | 2 | 4,
  memoryGib: 1 | 4 | 8,
  maxAttempts: 1 | 2,
  attemptTimeoutSeconds: number,
) {
  const resources = {
    api_service: {
      resourceClassId: 'control_plane_cpu_v1' as const,
      plannedCloudExecutionTarget: 'cloud_run_service' as const,
    },
    render_worker: {
      resourceClassId: 'render_cpu_high_memory_v1' as const,
      plannedCloudExecutionTarget: 'cloud_run_job' as const,
    },
    qa_worker: {
      resourceClassId: 'qa_cpu_standard_v1' as const,
      plannedCloudExecutionTarget: 'cloud_run_job' as const,
    },
  }
  const workerConcurrencyLimit =
    workerConcurrencyPolicy.maxConcurrentJobsByWorkerType[workerType]
  if (!workerConcurrencyLimit) {
    throw new Error(`Customer-delivery placement lacks ${workerType} concurrency.`)
  }
  return {
    workerType,
    ...resources[workerType],
    preferredAccelerator: 'none' as const,
    cpuAllowed: true as const,
    vcpuCount,
    memoryGib,
    workerConcurrencyLimit,
    globalConcurrencyLimit: CANONICAL_PRIVATE_GLOBAL_MAX_CONCURRENCY,
    maxAttempts,
    attemptTimeoutSeconds,
  }
}

function completedEntry(
  current: CanonicalProfessionalLongFormCurrentChildPackageAuthority,
  approvedWorkItemId: string,
) {
  const entry = current.queueAggregate.entries.find((candidate) =>
    candidate.definition.approvedWorkItemId === approvedWorkItemId)
  if (!entry?.completion || entry.state !== 'completed') {
    throw new Error(`Customer-delivery source ${approvedWorkItemId} is incomplete.`)
  }
  return {
    ...entry,
    completion: entry.completion,
  }
}

function commercialBoundary() {
  return {
    internalProductionCostOnly: true as const,
    customerPriceAuthorityIncluded: false as const,
    customerCreditAuthorityIncluded: false as const,
    serviceFeeAuthorityIncluded: false as const,
    approvedFourKEstimateAndReservationReused: true as const,
    customerDeliveryCoveredByOriginalApprovedEstimate: true as const,
    secondExportEstimateCreated: false as const,
    secondExportChargeCreated: false as const,
    exportTimeEstimatePromptAllowed: false as const,
    exportTimeCreditPromptAllowed: false as const,
    walletMutationAuthorized: false as const,
    settlementAuthorized: false as const,
    billingAuthorized: false as const,
  }
}

function countWorker(
  placements: readonly { workerType: string }[],
  workerType: string,
): number {
  return placements.filter((placement) =>
    placement.workerType === workerType).length
}

function assertBlobRef(ref: AuthorityJsonBlobRef, value: unknown): void {
  if (
    ref.sha256 !== sha256AuthorityValue(value) ||
    ref.byteLength !== Buffer.byteLength(stableAuthorityStringify(value), 'utf8')
  ) throw new Error('Customer-delivery authority blob reference is invalid.')
}

function assertNamedHash(value: unknown, key: string): void {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Customer-delivery evidence is malformed.')
  }
  const record = value as Record<string, unknown>
  const actual = record[key]
  const payload = { ...record }
  delete payload[key]
  if (actual !== sha256AuthorityValue(payload)) {
    throw new Error(`Customer-delivery evidence ${key} is invalid.`)
  }
}
