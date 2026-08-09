import { z } from 'zod'

import type { AuthorityJsonBlobRef } from '../../../services/private-edit-authority-store'
import { hashSkillValue } from '../../../edit-skills/core/skill-capability-manifest-hash'
import { skillFrameRangeSchema } from '../../../edit-skills/core/skill-assignment-schema'
import {
  skillManifestReferenceSchema,
  skillSha256Schema,
} from '../../../edit-skills/core/skill-capability-manifest-schema'
import type {
  BrollCanonicalWorkGraph,
  BrollPlanArtifact,
  BrollPlanningContext,
  BrollSkillAssignment,
} from '../../../edit-skills/b-roll'
import {
  CANONICAL_BROLL_SKILL_COMPONENT_KEY,
  type CanonicalBrollSkillPlanComponent,
} from '../../../edit-skills/b-roll/b-roll-canonical-plan-component'

export const BROLL_PROVIDER_OPERATION_REGISTRY_V5_VERSION =
  'canonical-provider-operation-registry-v5' as const
export const BROLL_PROVIDER_WORK_AUTHORIZATION_V5_VERSION =
  'canonical-provider-work-authorization-v5' as const
export const BROLL_PROVIDER_REQUEST_PACKAGE_V5_VERSION =
  'gemini-omni-b-roll-request-package-v5' as const
export const BROLL_PROVIDER_OPERATION_ID =
  'provider.google.generate_b_roll_candidate.v1' as const
export const BROLL_PROVIDER_BOUNDARY_PROFILE_ID =
  'google_gemini_omni_flash_b_roll_provider_boundary' as const
export const BROLL_PROVIDER_ROUTE_ID = 'gemini_omni_flash' as const
export const BROLL_PROVIDER_CONFIGURED_MODEL_ALIAS =
  'gemini-omni-flash-preview' as const

const identity = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/-]*$/u)
  .refine((value) => !value.includes('..'))
const timestamp = z.string().datetime({ offset: true })
const blobRefSchema = z.object({
  sha256: skillSha256Schema,
  byteLength: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
}).strict()
const artifactRefSchema = z.object({
  artifactType: identity,
  sha256: skillSha256Schema,
  byteLength: z.number().int().positive().max(256 * 1024 * 1024),
  ownerUserId: identity,
  workspaceId: identity,
  projectId: identity,
}).strict()
const providerSourceInputSchema = artifactRefSchema.extend({
  inputRole: z.enum(['first_frame', 'reference_image', 'uploaded_video']),
}).strict()

const expectedOutputSchema = z.object({
  role: z.literal('provider_b_roll_candidate_video_mp4'),
  artifactType: z.literal('provider_b_roll_candidate_video_mp4'),
  assetRole: z.literal('generated'),
  contentType: z.literal('video/mp4'),
  maximumByteLength: z.literal(67_108_864),
  privateCreateOnlyRequired: z.literal(true),
  checksumReadbackRequired: z.literal(true),
  browserReadable: z.literal(false),
  automaticSelectionAllowed: z.literal(false),
  timelineMutationAllowed: z.literal(false),
}).strict()

const profileCoreSchema = z.object({
  schemaVersion: z.literal(BROLL_PROVIDER_OPERATION_REGISTRY_V5_VERSION),
  operationId: z.literal(BROLL_PROVIDER_OPERATION_ID),
  intent: z.literal('b_roll_candidate'),
  providerBoundaryProfileId: z.literal(BROLL_PROVIDER_BOUNDARY_PROFILE_ID),
  providerRouteId: z.literal(BROLL_PROVIDER_ROUTE_ID),
  configuredModelAlias: z.literal(BROLL_PROVIDER_CONFIGURED_MODEL_ALIAS),
  acceptedRuntimeModel: z.null(),
  immutableProviderRevision: z.null(),
  providerRevisionStatus: z.literal('preview_alias_unpinned'),
  qualificationStatus: z.literal('internal_transport_qualified_live_canary_blocked'),
  expectedWorkItemType: z.literal('custom'),
  expectedWorkerClass: z.literal('provider_worker'),
  expectedOutput: expectedOutputSchema,
  generationBounds: z.object({
    minimumDurationSeconds: z.literal(3),
    maximumDurationSeconds: z.literal(10),
    supportedAspectRatios: z.tuple([z.literal('16:9'), z.literal('9:16')]),
    outputHeight: z.literal(720),
    frameRate: z.literal(24),
  }).strict(),
  taskCapabilities: z.object({
    textToVideo: z.literal('supported'),
    imageToVideoFirstFrame: z.literal('supported_one_image'),
    referenceImagesToVideo: z.literal('supported_one_to_six_images'),
    uploadedVideoEditing: z.literal('supported_region_gated_maximum_ten_seconds'),
    conversationalRefinement: z.literal('supported_one_refinement_with_previous_interaction'),
    videoReference: z.literal('unsupported_provider_processing_unreliable'),
    audioReference: z.literal('unsupported_uploaded_audio'),
    multipleVideoReasoning: z.literal('unsupported'),
    extension: z.literal('unsupported'),
    interpolation: z.literal('unsupported'),
    voiceEditing: z.literal('unsupported'),
  }).strict(),
  requestPolicy: z.object({
    maximumInitialCandidates: z.literal(1),
    maximumRefinements: z.literal(1),
    maximumGenerationSubmissionsPerAttempt: z.literal(1),
    maximumRetries: z.literal(0),
    maximumFallbacks: z.literal(0),
    maximumRedirects: z.literal(0),
    alternateProviderFallbackAllowed: z.literal(false),
    unknownOutcomeRequiresReconciliation: z.literal(true),
    callerModelAllowed: z.literal(false),
    callerEndpointAllowed: z.literal(false),
    callerCredentialAllowed: z.literal(false),
    callerRawBodyAllowed: z.literal(false),
    callerExecutableAllowed: z.literal(false),
  }).strict(),
  liveProviderCallAuthorized: z.literal(false),
  privateOwnerConfirmedCanarySupported: z.literal(true),
  providerTransportActivated: z.literal(false),
  productionReady: z.literal(false),
}).strict()

export const brollProviderOperationProfileV5Schema = profileCoreSchema.extend({
  profileHash: skillSha256Schema,
}).strict().superRefine((profile, context) => {
  const { profileHash, ...core } = profile
  if (hashSkillValue(core) !== profileHash) {
    context.addIssue({ code: 'custom', message: 'B-roll provider V5 profile hash is invalid.' })
  }
})

export type BrollProviderOperationProfileV5 = z.infer<
  typeof brollProviderOperationProfileV5Schema
>

export function createBrollProviderOperationRegistryV5(): readonly [BrollProviderOperationProfileV5] {
  const core = profileCoreSchema.parse({
    schemaVersion: BROLL_PROVIDER_OPERATION_REGISTRY_V5_VERSION,
    operationId: BROLL_PROVIDER_OPERATION_ID,
    intent: 'b_roll_candidate',
    providerBoundaryProfileId: BROLL_PROVIDER_BOUNDARY_PROFILE_ID,
    providerRouteId: BROLL_PROVIDER_ROUTE_ID,
    configuredModelAlias: BROLL_PROVIDER_CONFIGURED_MODEL_ALIAS,
    acceptedRuntimeModel: null,
    immutableProviderRevision: null,
    providerRevisionStatus: 'preview_alias_unpinned',
    qualificationStatus: 'internal_transport_qualified_live_canary_blocked',
    expectedWorkItemType: 'custom',
    expectedWorkerClass: 'provider_worker',
    expectedOutput: {
      role: 'provider_b_roll_candidate_video_mp4',
      artifactType: 'provider_b_roll_candidate_video_mp4',
      assetRole: 'generated',
      contentType: 'video/mp4',
      maximumByteLength: 67_108_864,
      privateCreateOnlyRequired: true,
      checksumReadbackRequired: true,
      browserReadable: false,
      automaticSelectionAllowed: false,
      timelineMutationAllowed: false,
    },
    generationBounds: {
      minimumDurationSeconds: 3,
      maximumDurationSeconds: 10,
      supportedAspectRatios: ['16:9', '9:16'],
      outputHeight: 720,
      frameRate: 24,
    },
    taskCapabilities: {
      textToVideo: 'supported',
      imageToVideoFirstFrame: 'supported_one_image',
      referenceImagesToVideo: 'supported_one_to_six_images',
      uploadedVideoEditing: 'supported_region_gated_maximum_ten_seconds',
      conversationalRefinement: 'supported_one_refinement_with_previous_interaction',
      videoReference: 'unsupported_provider_processing_unreliable',
      audioReference: 'unsupported_uploaded_audio',
      multipleVideoReasoning: 'unsupported',
      extension: 'unsupported',
      interpolation: 'unsupported',
      voiceEditing: 'unsupported',
    },
    requestPolicy: {
      maximumInitialCandidates: 1,
      maximumRefinements: 1,
      maximumGenerationSubmissionsPerAttempt: 1,
      maximumRetries: 0,
      maximumFallbacks: 0,
      maximumRedirects: 0,
      alternateProviderFallbackAllowed: false,
      unknownOutcomeRequiresReconciliation: true,
      callerModelAllowed: false,
      callerEndpointAllowed: false,
      callerCredentialAllowed: false,
      callerRawBodyAllowed: false,
      callerExecutableAllowed: false,
    },
    liveProviderCallAuthorized: false,
    privateOwnerConfirmedCanarySupported: true,
    providerTransportActivated: false,
    productionReady: false,
  })
  return Object.freeze([
    Object.freeze(brollProviderOperationProfileV5Schema.parse({
      ...core,
      profileHash: hashSkillValue(core),
    })),
  ]) as readonly [BrollProviderOperationProfileV5]
}

export function resolveBrollProviderOperationV5(
  operationId: string,
): BrollProviderOperationProfileV5 {
  const profile = createBrollProviderOperationRegistryV5()[0]
  if (operationId !== profile.operationId) {
    throw new Error(`B-roll provider V5 operation ${operationId} is not registered.`)
  }
  return profile
}

export function brollProviderOperationRegistryV5Hash(): string {
  return hashSkillValue(createBrollProviderOperationRegistryV5())
}

export const brollProviderRequestPackageV5Schema = z.object({
  schemaVersion: z.literal(BROLL_PROVIDER_REQUEST_PACKAGE_V5_VERSION),
  operationId: z.literal(BROLL_PROVIDER_OPERATION_ID),
  providerBoundaryProfileId: z.literal(BROLL_PROVIDER_BOUNDARY_PROFILE_ID),
  providerRouteId: z.literal(BROLL_PROVIDER_ROUTE_ID),
  configuredModelAlias: z.literal(BROLL_PROVIDER_CONFIGURED_MODEL_ALIAS),
  taskMode: z.enum([
    'text_to_video',
    'image_to_video',
    'reference_to_video',
    'edit_uploaded_video',
  ]),
  manifestRef: skillManifestReferenceSchema,
  assignmentId: identity,
  assignmentHash: skillSha256Schema,
  planHash: skillSha256Schema,
  authorizedRange: skillFrameRangeSchema,
  candidateOrdinal: z.literal(0),
  previousInteractionId: z.null(),
  providerStateRetention: z.literal('store_for_one_approved_refinement'),
  prompt: z.string().trim().min(1).max(16_000),
  avoidRequirements: z.array(z.string().trim().min(1).max(1_000)).min(1).max(100),
  sourceInputs: z.array(providerSourceInputSchema).max(6),
  output: z.object({
    aspectRatio: z.enum(['16:9', '9:16']),
    resolution: z.literal('720p'),
    frameRate: z.literal(24),
    durationSeconds: z.number().int().min(3).max(10),
    audioIntent: z.literal('silent_visual_candidate'),
    singleContinuousShot: z.literal(true),
    sceneCutsAllowed: z.literal(false),
  }).strict(),
  callerSuppliedModel: z.literal(false),
  callerSuppliedEndpoint: z.literal(false),
  callerSuppliedCredential: z.literal(false),
  callerSuppliedRawBody: z.literal(false),
  callerSuppliedExecutable: z.literal(false),
  requestPackageHash: skillSha256Schema,
}).strict().superRefine((request, context) => {
  const { requestPackageHash, ...core } = request
  if (hashSkillValue(core) !== requestPackageHash) {
    context.addIssue({ code: 'custom', message: 'B-roll provider request package hash is invalid.' })
  }
  const sourceCount = request.sourceInputs.length
  const roles = request.sourceInputs.map((source) => source.inputRole)
  if (
    (request.taskMode === 'text_to_video' && sourceCount !== 0) ||
    (request.taskMode === 'image_to_video' &&
      (sourceCount !== 1 || roles[0] !== 'first_frame')) ||
    (request.taskMode === 'reference_to_video' &&
      (sourceCount < 1 || sourceCount > 6 || roles.some((role) => role !== 'reference_image'))) ||
    (request.taskMode === 'edit_uploaded_video' &&
      (sourceCount !== 1 || roles[0] !== 'uploaded_video')) ||
    new Set(request.sourceInputs.map((source) => source.sha256)).size !== sourceCount
  ) context.addIssue({ code: 'custom', message: 'B-roll provider task/source combination is invalid.' })
})

export type BrollProviderRequestPackageV5 = z.infer<
  typeof brollProviderRequestPackageV5Schema
>

export function buildBrollProviderRequestPackageV5(input: {
  assignment: BrollSkillAssignment
  context: BrollPlanningContext
  plan: BrollPlanArtifact
}): BrollProviderRequestPackageV5 {
  const shot = input.plan.shotSpecification
  if (
    !shot || !input.plan.providerRequestPlanned ||
    ![
      'generate_with_gemini_omni',
      'edit_uploaded_video_with_gemini_omni',
    ].includes(input.plan.decision) ||
    shot.durationSeconds < 3 || shot.durationSeconds > 10 ||
    !Number.isInteger(shot.durationSeconds) ||
    !input.plan.cropSafeProviderAspectRatio
  ) throw new Error('B-roll plan cannot compile an official Gemini Omni request package.')
  const selected = input.plan.sourceCandidateId
    ? input.context.sourceCandidates.find((candidate) =>
        candidate.sourceId === input.plan.sourceCandidateId)
    : undefined
  const taskMode = input.plan.decision === 'edit_uploaded_video_with_gemini_omni'
    ? 'edit_uploaded_video' as const
    : selected?.sourceType === 'reference_image'
      ? selected.providerImageRole === 'reference'
        ? 'reference_to_video' as const
        : 'image_to_video' as const
      : 'text_to_video' as const
  const sourceCandidates = taskMode === 'reference_to_video'
    ? (input.plan.providerSourceArtifactRefs ?? []).map((reference) => {
        const candidate = input.context.sourceCandidates.find((item) =>
          item.sourceType === 'reference_image' && item.providerImageRole === 'reference' &&
          item.artifactRef.sha256 === reference.sha256)
        if (!candidate || !candidate.approvedByUser || !candidate.provenanceVerified ||
          !candidate.rightsApproved || !candidate.privacyApproved || !candidate.proofSafe ||
          hashSkillValue(candidate.artifactRef) !== hashSkillValue(reference)) {
          throw new Error('B-roll reference-to-video source lacks exact approval, rights, privacy, proof, or checksum authority.')
        }
        return candidate
      })
    : selected ? [selected] : []
  const inputRole = taskMode === 'image_to_video'
    ? 'first_frame' as const
    : taskMode === 'reference_to_video'
      ? 'reference_image' as const
      : 'uploaded_video' as const
  const sourceInputs = sourceCandidates.map((candidate) => ({
    ...candidate.artifactRef,
    inputRole,
  }))
  const prompt = [
    `Editorial purpose: ${shot.purpose}`,
    `Subject: ${shot.subject}`,
    `Action: ${shot.action}`,
    `Environment: ${shot.environment}`,
    `Framing: ${shot.framing}`,
    `Camera movement: ${shot.cameraMovement}`,
    `Lens and depth: ${shot.lensDepthIntent}`,
    `Lighting: ${shot.lighting}`,
    `Color mood: ${shot.colorMood}`,
    `Visual style: ${shot.visualStyle}`,
    `Duration: exactly ${shot.durationSeconds} seconds at 24 frames per second.`,
    `Aspect ratio: ${input.plan.cropSafeProviderAspectRatio} with a 720p output.`,
    'Audio: no dialogue, no music, and no added sound effects; final audio ownership remains outside B-roll.',
    `Continuity: ${shot.continuityRequirements.join(' ')}`,
    `Crop-safe subject area: ${shot.cropSafeSubjectArea}`,
    `Transformation class: ${shot.allowedTransformationClass}`,
    `Proof classification: ${shot.proofClassification}`,
    'Create one single unbroken scene. No scene cuts, montage, or shot changes.',
    `Avoid: ${shot.avoid.join('; ')}.`,
  ].join('\n')
  const core = {
    schemaVersion: BROLL_PROVIDER_REQUEST_PACKAGE_V5_VERSION,
    operationId: BROLL_PROVIDER_OPERATION_ID,
    providerBoundaryProfileId: BROLL_PROVIDER_BOUNDARY_PROFILE_ID,
    providerRouteId: BROLL_PROVIDER_ROUTE_ID,
    configuredModelAlias: BROLL_PROVIDER_CONFIGURED_MODEL_ALIAS,
    taskMode,
    manifestRef: input.assignment.manifestRef,
    assignmentId: input.assignment.assignmentId,
    assignmentHash: input.assignment.assignmentHash,
    planHash: input.plan.planHash,
    authorizedRange: input.assignment.writeRangeAuthority.authorizedRange,
    candidateOrdinal: 0 as const,
    previousInteractionId: null,
    providerStateRetention: 'store_for_one_approved_refinement' as const,
    prompt,
    avoidRequirements: [...shot.avoid],
    sourceInputs,
    output: {
      aspectRatio: input.plan.cropSafeProviderAspectRatio,
      resolution: '720p' as const,
      frameRate: 24 as const,
      durationSeconds: shot.durationSeconds,
      audioIntent: shot.audioIntent,
      singleContinuousShot: true as const,
      sceneCutsAllowed: false as const,
    },
    callerSuppliedModel: false as const,
    callerSuppliedEndpoint: false as const,
    callerSuppliedCredential: false as const,
    callerSuppliedRawBody: false as const,
    callerSuppliedExecutable: false as const,
  }
  return brollProviderRequestPackageV5Schema.parse({
    ...core,
    requestPackageHash: hashSkillValue(core),
  })
}

const packageWorkItemSchema = z.object({
  id: identity,
  workItemKey: identity,
  workItemType: z.literal('custom'),
  workerClass: z.literal('provider_worker'),
  expectedOutputs: z.array(z.object({
    outputKey: identity,
    artifactType: z.literal('provider_b_roll_candidate_video_mp4'),
    assetRole: z.literal('generated'),
    contentType: z.literal('video/mp4'),
    required: z.literal(true),
    previewPlaceholderAllowed: z.literal(false),
  }).passthrough()).length(1),
  approvedToolIds: z.tuple([]),
  approvedProviderRoute: z.literal(BROLL_PROVIDER_ROUTE_ID),
  providerExecutionMode: z.literal('primary'),
  maximumCreditBudget: z.number().int().positive().max(10_000_000),
  required: z.literal(true),
}).passthrough()

export const brollProviderExecutionPackageV5Schema = z.object({
  packageRecordId: identity,
  packageHash: skillSha256Schema,
  workspaceId: identity,
  projectId: identity,
  editSessionId: identity,
  approvedPlanSnapshotId: identity,
  snapshotHash: skillSha256Schema,
  reservationId: identity,
  reservationStatus: z.enum(['reserved', 'partially_spent']),
  workGraphHash: skillSha256Schema,
  componentRefs: z.record(z.string(), blobRefSchema),
  approvedMaximumCredits: z.number().int().positive().max(10_000_000),
  remainingReservedCredits: z.number().int().positive().max(10_000_000),
  approvedProviderRoutes: z.array(identity).min(1).max(8),
  approvedWorkItems: z.array(packageWorkItemSchema).min(1).max(256),
  status: z.literal('canonical_authority_packaged_runtime_blocked'),
}).passthrough()

export type BrollProviderExecutionPackageV5 = z.infer<
  typeof brollProviderExecutionPackageV5Schema
>

const rateAuthoritySchema = z.object({
  schemaVersion: z.literal('b_roll_provider_rate_authority_v1'),
  snapshotId: identity,
  snapshotDigest: skillSha256Schema,
  evidenceClass: z.enum([
    'injected_test_rate_unqualified',
    'owner_confirmed_canary_ceiling_unqualified',
  ]),
  currency: z.literal('USD'),
  costMicrosPerGeneratedSecond: z.number().int().nonnegative().max(100_000_000),
  effectiveAt: timestamp,
  expiresAt: timestamp,
  serviceFeeIncluded: z.literal(false),
  productionQualified: z.literal(false),
}).strict()

const authorizationCoreSchema = z.object({
  schemaVersion: z.literal(BROLL_PROVIDER_WORK_AUTHORIZATION_V5_VERSION),
  operationId: z.literal(BROLL_PROVIDER_OPERATION_ID),
  operationProfileHash: skillSha256Schema,
  ownerUserId: identity,
  workspaceId: identity,
  projectId: identity,
  editSessionId: identity,
  approvedPlanSnapshotId: identity,
  approvedPlanSnapshotHash: skillSha256Schema,
  packageRecordId: identity,
  packageHash: skillSha256Schema,
  reservationId: identity,
  approvedWorkItemId: identity,
  approvedWorkItemKey: identity,
  expectedOutputId: identity,
  manifestRef: skillManifestReferenceSchema,
  brollComponentRef: blobRefSchema,
  brollComponentHash: skillSha256Schema,
  assignmentId: identity,
  assignmentHash: skillSha256Schema,
  planHash: skillSha256Schema,
  workGraphHash: skillSha256Schema,
  authorizedRange: skillFrameRangeSchema,
  requestPackageHash: skillSha256Schema,
  providerBoundaryProfileId: z.literal(BROLL_PROVIDER_BOUNDARY_PROFILE_ID),
  providerRouteId: z.literal(BROLL_PROVIDER_ROUTE_ID),
  configuredModelAlias: z.literal(BROLL_PROVIDER_CONFIGURED_MODEL_ALIAS),
  acceptedRuntimeModel: z.null(),
  immutableProviderRevision: z.null(),
  providerRevisionStatus: z.literal('preview_alias_unpinned'),
  providerRateAuthority: rateAuthoritySchema,
  maximumAuthorizedProviderCostMicros: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  maximumAuthorizedInfrastructureCostMicros: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  maximumAuthorizedTotalInternalCostMicros: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  idempotencyKeyHash: skillSha256Schema,
  authorizedAt: timestamp,
  expiresAt: timestamp,
  maximumInitialCandidates: z.literal(1),
  maximumRefinements: z.literal(1),
  maximumSubmissionsThisAttempt: z.literal(1),
  maximumRetries: z.literal(0),
  maximumFallbacks: z.literal(0),
  alternateProviderFallbackAllowed: z.literal(false),
  authorityClass: z.enum([
    'private_injected_nonprovider_test',
    'private_owner_confirmed_canary',
  ]),
  liveProviderCallAuthorized: z.boolean(),
  injectedOutputOnly: z.boolean(),
  privateOutputRequired: z.literal(true),
  productionReady: z.literal(false),
}).strict()

export const brollProviderWorkAuthorizationV5Schema = authorizationCoreSchema.extend({
  authorityHash: skillSha256Schema,
}).strict().superRefine((authorization, context) => {
  const { authorityHash, ...core } = authorization
  if (
    hashSkillValue(core) !== authorityHash ||
    authorization.maximumAuthorizedProviderCostMicros +
      authorization.maximumAuthorizedInfrastructureCostMicros !==
      authorization.maximumAuthorizedTotalInternalCostMicros ||
    Date.parse(authorization.authorizedAt) >= Date.parse(authorization.expiresAt) ||
    Date.parse(authorization.providerRateAuthority.effectiveAt) > Date.parse(authorization.authorizedAt) ||
    Date.parse(authorization.providerRateAuthority.expiresAt) < Date.parse(authorization.expiresAt) ||
    (authorization.authorityClass === 'private_injected_nonprovider_test' &&
      (authorization.liveProviderCallAuthorized || !authorization.injectedOutputOnly ||
        authorization.providerRateAuthority.evidenceClass !== 'injected_test_rate_unqualified')) ||
    (authorization.authorityClass === 'private_owner_confirmed_canary' &&
      (!authorization.liveProviderCallAuthorized || authorization.injectedOutputOnly ||
        authorization.providerRateAuthority.evidenceClass !== 'owner_confirmed_canary_ceiling_unqualified'))
  ) context.addIssue({ code: 'custom', message: 'B-roll provider V5 authorization policy is invalid.' })
})

export type BrollProviderWorkAuthorizationV5 = z.infer<
  typeof brollProviderWorkAuthorizationV5Schema
>

export function createBrollProviderWorkAuthorizationV5(input: {
  ownerUserId: string
  executionPackage: BrollProviderExecutionPackageV5
  component: CanonicalBrollSkillPlanComponent
  componentRef: AuthorityJsonBlobRef
  assignment: BrollSkillAssignment
  context: BrollPlanningContext
  plan: BrollPlanArtifact
  workGraph: BrollCanonicalWorkGraph
  requestPackage: BrollProviderRequestPackageV5
  providerRateAuthority: z.input<typeof rateAuthoritySchema>
  maximumAuthorizedProviderCostMicros: number
  maximumAuthorizedInfrastructureCostMicros: number
  idempotencyKey: string
  authorizedAt: string
  expiresAt: string
  authorityClass?: 'private_injected_nonprovider_test' | 'private_owner_confirmed_canary'
}): BrollProviderWorkAuthorizationV5 {
  const profile = resolveBrollProviderOperationV5(BROLL_PROVIDER_OPERATION_ID)
  const executionPackage = brollProviderExecutionPackageV5Schema.parse(input.executionPackage)
  const requestPackage = brollProviderRequestPackageV5Schema.parse(input.requestPackage)
  const canonicalRequestPackage = buildBrollProviderRequestPackageV5({
    assignment: input.assignment,
    context: input.context,
    plan: input.plan,
  })
  const providerWorkItems = input.workGraph.workItems.filter((item) =>
    item.operationId === BROLL_PROVIDER_OPERATION_ID)
  const packageWorkItems = executionPackage.approvedWorkItems.filter((item) =>
    item.approvedProviderRoute === BROLL_PROVIDER_ROUTE_ID)
  const componentRef = executionPackage.componentRefs[CANONICAL_BROLL_SKILL_COMPONENT_KEY]
  const workItem = packageWorkItems[0]
  if (
    providerWorkItems.length !== 1 || packageWorkItems.length !== 1 || !workItem ||
    !componentRef || componentRef.sha256 !== input.componentRef.sha256 ||
    componentRef.byteLength !== input.componentRef.byteLength ||
    executionPackage.workspaceId !== input.assignment.workspaceId ||
    executionPackage.projectId !== input.assignment.projectId ||
    executionPackage.editSessionId !== input.assignment.editSessionId ||
    executionPackage.workGraphHash !== input.workGraph.workGraphHash ||
    !executionPackage.approvedProviderRoutes.includes(BROLL_PROVIDER_ROUTE_ID) ||
    input.component.componentHash !== hashSkillValue(stripHash(input.component, 'componentHash')) ||
    input.component.assignmentHash !== input.assignment.assignmentHash ||
    input.component.planHash !== input.plan.planHash ||
    input.component.workGraphHash !== input.workGraph.workGraphHash ||
    hashSkillValue(input.component.manifestRef) !== hashSkillValue(input.assignment.manifestRef) ||
    requestPackage.assignmentHash !== input.assignment.assignmentHash ||
    requestPackage.planHash !== input.plan.planHash ||
    hashSkillValue(requestPackage.manifestRef) !== hashSkillValue(input.assignment.manifestRef) ||
    requestPackage.requestPackageHash !== canonicalRequestPackage.requestPackageHash ||
    workItem.workItemKey !== providerWorkItems[0]!.workItemKey ||
    workItem.expectedOutputs[0]!.outputKey.length < 1 ||
    executionPackage.remainingReservedCredits < workItem.maximumCreditBudget
  ) throw new Error('B-roll provider V5 authorization lost exact package or skill lineage.')
  const rate = rateAuthoritySchema.parse(input.providerRateAuthority)
  const maximumAuthorizedTotalInternalCostMicros =
    input.maximumAuthorizedProviderCostMicros + input.maximumAuthorizedInfrastructureCostMicros
  const authorityClass = input.authorityClass ?? 'private_injected_nonprovider_test'
  const core = authorizationCoreSchema.parse({
    schemaVersion: BROLL_PROVIDER_WORK_AUTHORIZATION_V5_VERSION,
    operationId: BROLL_PROVIDER_OPERATION_ID,
    operationProfileHash: profile.profileHash,
    ownerUserId: input.ownerUserId,
    workspaceId: executionPackage.workspaceId,
    projectId: executionPackage.projectId,
    editSessionId: executionPackage.editSessionId,
    approvedPlanSnapshotId: executionPackage.approvedPlanSnapshotId,
    approvedPlanSnapshotHash: executionPackage.snapshotHash,
    packageRecordId: executionPackage.packageRecordId,
    packageHash: executionPackage.packageHash,
    reservationId: executionPackage.reservationId,
    approvedWorkItemId: workItem.id,
    approvedWorkItemKey: workItem.workItemKey,
    expectedOutputId: workItem.expectedOutputs[0]!.outputKey,
    manifestRef: input.assignment.manifestRef,
    brollComponentRef: input.componentRef,
    brollComponentHash: input.component.componentHash,
    assignmentId: input.assignment.assignmentId,
    assignmentHash: input.assignment.assignmentHash,
    planHash: input.plan.planHash,
    workGraphHash: input.workGraph.workGraphHash,
    authorizedRange: input.assignment.writeRangeAuthority.authorizedRange,
    requestPackageHash: requestPackage.requestPackageHash,
    providerBoundaryProfileId: profile.providerBoundaryProfileId,
    providerRouteId: profile.providerRouteId,
    configuredModelAlias: profile.configuredModelAlias,
    acceptedRuntimeModel: null,
    immutableProviderRevision: null,
    providerRevisionStatus: 'preview_alias_unpinned',
    providerRateAuthority: rate,
    maximumAuthorizedProviderCostMicros: input.maximumAuthorizedProviderCostMicros,
    maximumAuthorizedInfrastructureCostMicros: input.maximumAuthorizedInfrastructureCostMicros,
    maximumAuthorizedTotalInternalCostMicros,
    idempotencyKeyHash: hashSkillValue({ idempotencyKey: input.idempotencyKey }),
    authorizedAt: input.authorizedAt,
    expiresAt: input.expiresAt,
    maximumInitialCandidates: 1,
    maximumRefinements: 1,
    maximumSubmissionsThisAttempt: 1,
    maximumRetries: 0,
    maximumFallbacks: 0,
    alternateProviderFallbackAllowed: false,
    authorityClass,
    liveProviderCallAuthorized: authorityClass === 'private_owner_confirmed_canary',
    injectedOutputOnly: authorityClass === 'private_injected_nonprovider_test',
    privateOutputRequired: true,
    productionReady: false,
  })
  return brollProviderWorkAuthorizationV5Schema.parse({
    ...core,
    authorityHash: hashSkillValue(core),
  })
}

export function assertBrollProviderWorkAuthorizationV5(input: {
  value: unknown
  requestPackage: BrollProviderRequestPackageV5
}): BrollProviderWorkAuthorizationV5 {
  const authorization = brollProviderWorkAuthorizationV5Schema.parse(input.value)
  const profile = resolveBrollProviderOperationV5(authorization.operationId)
  const request = brollProviderRequestPackageV5Schema.parse(input.requestPackage)
  if (
    authorization.operationProfileHash !== profile.profileHash ||
    authorization.requestPackageHash !== request.requestPackageHash ||
    authorization.assignmentHash !== request.assignmentHash ||
    authorization.planHash !== request.planHash ||
    hashSkillValue(authorization.manifestRef) !== hashSkillValue(request.manifestRef)
  ) throw new Error('B-roll provider V5 authorization is stale or substituted.')
  return authorization
}

export function brollProviderAuthorizationRequestHashV5(
  authorization: BrollProviderWorkAuthorizationV5,
): string {
  return hashSkillValue({
    domain: 'reeditpro:b-roll-provider-authorization-request:v5',
    authorizationHash: authorization.authorityHash,
    requestPackageHash: authorization.requestPackageHash,
    idempotencyKeyHash: authorization.idempotencyKeyHash,
  })
}

function stripHash<T extends Record<string, unknown>>(
  value: T,
  key: keyof T,
): Record<string, unknown> {
  const core = { ...value }
  delete core[key]
  return core
}
