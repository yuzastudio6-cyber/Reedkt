import { Buffer } from 'node:buffer'

import { z } from 'zod'

import type { MotionStudioSynchronizedFoleyCandidateRequestV1 } from '../../../src/types/motion-studio'
import { motionStudioSynchronizedFoleyCandidateRequestV1Schema } from '../../../src/lib/motion-studio/contracts'
import { ApiError } from '../../errors/api-error'
import { sha256CanonicalJson } from '../commands/canonical-json'
import {
  assertMotionStudioSynchronizedFoleyRouteReassessment,
  type MotionStudioSynchronizedFoleyRouteReassessmentV1,
  motionStudioSynchronizedFoleyRouteReassessmentV1Schema,
} from '../audio/synchronized-foley-route-reassessment'

export const MOTION_STUDIO_SYNCHRONIZED_FOLEY_D4_PREFLIGHT_SCHEMA_VERSION =
  'motion-studio.synchronized-foley-d4-preflight.v1' as const
export const MOTION_STUDIO_SYNCHRONIZED_FOLEY_D4_REQUEST_TEMPLATE_SCHEMA_VERSION =
  'motion-studio.synchronized-foley-d4-request-template.v1' as const

export const MOTION_STUDIO_SYNCHRONIZED_FOLEY_D4_PREFLIGHT_GATE_CODES = [
  'official_candidate_route_current',
  'historical_d2_immutable',
  'exact_scope_and_capability_binding',
  'immutable_plan_credit_and_reservation_binding',
  'exact_event_source_picture_and_timing_binding',
  'visible_or_environment_event_only',
  'credential_free_unmaterialized_request_template',
  'bounded_duration_and_public_list_cost',
  'one_submission_no_retry_no_fallback_design',
  'immutable_model_revision_not_published',
  'exact_output_audio_codec_sample_rate_and_channels_require_private_probe',
  'enterprise_ready_or_excluded_model_designation_not_published',
  'commercial_rights_conflict_requires_provider_or_legal_attestation',
  'account_access_prepaid_funds_quota_and_rate_card_not_verified',
  'canonical_provider_dispatch_lease_single_use_and_cost_runtime_absent',
  'private_acl_expiration_ingest_and_cleanup_runtime_not_proven',
  'no_retry_no_fallback_and_unknown_outcome_runtime_not_proven',
  'actual_candidate_semantic_rights_and_human_reviews_absent',
] as const

export type MotionStudioSynchronizedFoleyD4PreflightGateCode =
  (typeof MOTION_STUDIO_SYNCHRONIZED_FOLEY_D4_PREFLIGHT_GATE_CODES)[number]

const ROUTE_BLOCKING_GATES = MOTION_STUDIO_SYNCHRONIZED_FOLEY_D4_PREFLIGHT_GATE_CODES.slice(9)
const stableId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => !value.includes('..'))
const digest = z.string().regex(/^[a-f0-9]{64}$/)
const isoDate = z.string().datetime({ offset: true })
const safePrompt = z.string().trim().min(1).max(6_000).refine(
  (value) => !hasUnsafeControlCharacter(value) &&
    !/(?:https?:\/\/|file:\/\/|data:|javascript:)/i.test(value),
  { message: 'Synchronized-Foley request text cannot contain control characters, URLs, paths or executable URI schemes.' },
)
const frameRange = z.object({
  startFrame: z.number().int().nonnegative(),
  endFrame: z.number().int().positive(),
}).strict().refine((value) => value.endFrame > value.startFrame, {
  message: 'Synchronized-Foley frame range must advance.',
})
const gateCodeSchema = z.enum(MOTION_STUDIO_SYNCHRONIZED_FOLEY_D4_PREFLIGHT_GATE_CODES)
const gateSchema = z.object({
  gateCode: gateCodeSchema,
  state: z.enum(['passed_local', 'external_evidence_required']),
  evidenceId: stableId,
  evidenceDigest: digest,
  explanation: z.string().trim().min(1).max(600),
}).strict()

export const motionStudioSynchronizedFoleyD4RequestTemplateV1Schema = z.object({
  schemaVersion: z.literal(MOTION_STUDIO_SYNCHRONIZED_FOLEY_D4_REQUEST_TEMPLATE_SCHEMA_VERSION),
  requestTemplateId: stableId,
  sourceFoleyRequestId: stableId,
  sourceFoleyRequestDigest: digest,
  routeReassessmentId: stableId,
  routeReassessmentDigest: digest,
  capabilitySnapshotId: stableId,
  capabilitySnapshotDigest: digest,
  providerOwnerCode: z.literal('fal_ai'),
  providerServiceCode: z.literal('fal_model_apis'),
  providerRouteId: z.literal('fal_ai_mmaudio_v2'),
  modelId: z.literal('fal-ai/mmaudio-v2'),
  endpoint: z.literal('https://queue.fal.run/fal-ai/mmaudio-v2'),
  method: z.literal('POST'),
  authentication: z.object({
    headerName: z.literal('Authorization'),
    scheme: z.literal('Key'),
    credentialValueIncluded: z.literal(false),
    browserCredentialAllowed: z.literal(false),
  }).strict(),
  platformHeaders: z.object({
    contentType: z.literal('application/json'),
    noRetry: z.object({ name: z.literal('X-Fal-No-Retry'), value: z.literal('1') }).strict(),
    disableFallback: z.object({ name: z.literal('x-app-fal-disable-fallback'), value: z.literal('true') }).strict(),
    storeIo: z.object({ name: z.literal('X-Fal-Store-IO'), value: z.literal('0') }).strict(),
    outputLifecycle: z.object({
      name: z.literal('X-Fal-Object-Lifecycle-Preference'),
      value: z.object({
        expiration_duration_seconds: z.literal(3_600),
        initial_acl: z.object({
          default: z.literal('forbid'),
          rules: z.array(z.never()).length(0).readonly(),
        }).strict(),
      }).strict(),
    }).strict(),
  }).strict(),
  bodyTemplate: z.object({
    video_url: z.object({
      valueIncluded: z.literal(false),
      runtimeBinding: z.literal('exact_owner_only_bounded_source_clip_url'),
      sourceVideoAssetId: stableId,
      sourceVideoAssetVersionId: stableId,
      sourceVideoContentDigest: digest,
      sourceFrameRange: frameRange,
      boundedClipMaterialized: z.literal(false),
      ownerOnlyUploadAclRequired: z.literal(true),
      expirationSeconds: z.literal(3_600),
    }).strict(),
    prompt: safePrompt,
    negative_prompt: safePrompt,
    seed: z.number().int().nonnegative().max(2_147_483_647),
    num_steps: z.literal(25),
    duration: z.number().positive().max(30),
    cfg_strength: z.literal(4.5),
    mask_away_clip: z.literal(false),
  }).strict(),
  bodyTemplateByteLength: z.number().int().positive().max(16_384),
  maximumMaterializedBodyBytes: z.literal(16_384),
  providerRequestBodyMaterialized: z.literal(false),
  sourceBytesIncluded: z.literal(false),
  sourceUrlIncluded: z.literal(false),
  credentialIncluded: z.literal(false),
  externalTransportAllowed: z.literal(false),
  providerSubmissionAllowed: z.literal(false),
  requestTemplateDigest: digest,
  immutable: z.literal(true),
}).strict()

export type MotionStudioSynchronizedFoleyD4RequestTemplateV1 =
  z.infer<typeof motionStudioSynchronizedFoleyD4RequestTemplateV1Schema>

export const motionStudioSynchronizedFoleyD4PreflightV1Schema = z.object({
  schemaVersion: z.literal(MOTION_STUDIO_SYNCHRONIZED_FOLEY_D4_PREFLIGHT_SCHEMA_VERSION),
  preflightId: stableId,
  workspaceId: stableId,
  projectId: stableId,
  editSessionId: stableId,
  productionId: stableId,
  createdAt: isoDate,
  expiresAt: isoDate,
  state: z.literal('local_preflight_complete_nine_external_gates_required'),
  sourceFoleyRequestId: stableId,
  sourceFoleyRequestDigest: digest,
  approvedSnapshotId: stableId,
  approvedSnapshotDigest: digest,
  approvedPlanReviewId: stableId,
  approvedCreditEstimateId: stableId,
  activeNoncommercialTestReservationId: stableId,
  soundEventId: stableId,
  sourceVideoAssetVersionId: stableId,
  sourceVideoContentDigest: digest,
  pictureLockContentDigest: digest,
  timingAuthorityDigest: digest,
  routeReassessmentId: stableId,
  routeReassessmentDigest: digest,
  capabilitySnapshotId: stableId,
  capabilitySnapshotDigest: digest,
  requestTemplate: motionStudioSynchronizedFoleyD4RequestTemplateV1Schema,
  timing: z.object({
    fps: z.union([z.literal(24), z.literal(30)]),
    sourceFrameRange: frameRange,
    timelineFrameRange: frameRange,
    durationFrames: z.number().int().positive().max(900),
    requestedDurationSeconds: z.number().positive().max(30),
  }).strict(),
  transportBudgetProposal: z.object({
    maximumSecretPayloadReads: z.literal(1),
    maximumInputUploadRequests: z.literal(1),
    maximumProviderSubmissions: z.literal(1),
    maximumStatusRequests: z.literal(12),
    maximumResultRequests: z.literal(1),
    maximumBinaryDownloadRequests: z.literal(1),
    maximumCancellationRequests: z.literal(1),
    maximumNetworkRequestsIncludingCancellation: z.literal(17),
    maximumAddressConnectionAttemptsPerRequest: z.literal(1),
    addressFallbackAllowed: z.literal(false),
    proxyOrPacExecutionAllowed: z.literal(false),
    maximumRedirects: z.literal(0),
    maximumRetries: z.literal(0),
    maximumFallbacks: z.literal(0),
    maximumRequestBodyBytes: z.literal(16_384),
    maximumCapturedJsonResponseBytes: z.literal(1_048_576),
    maximumBinaryDownloadBytes: z.literal(67_108_864),
    maximumInputUploadBytes: z.null(),
    maximumElapsedMilliseconds: z.literal(180_000),
    statusPollIntervalMilliseconds: z.literal(10_000),
    inputUploadBudgetRequiresMaterializedClip: z.literal(true),
    unknownOutcomeRequiresReconciliation: z.literal(true),
  }).strict(),
  costBudgetProposal: z.object({
    currency: z.literal('USD'),
    providerBillingUnit: z.literal('successful_output_second'),
    publicListRateMicrosPerSecond: z.literal(1_000),
    requestedDurationListEstimateMicros: z.number().int().positive().max(30_000),
    maximumAuthorizedProviderCostMicros: z.literal(30_000),
    maximumAuthorizedInfrastructureCostMicros: z.null(),
    maximumAuthorizedTotalInternalCostMicros: z.null(),
    immutableExecutionRateCardCreated: z.literal(false),
    providerUsageReconciliationImplemented: z.literal(false),
    failedAttemptCostMustBeRetained: z.literal(true),
    customerPricingIncluded: z.literal(false),
    customerCreditsIncluded: z.literal(false),
    serviceFeeIncluded: z.literal(false),
    customerBillingAllowed: z.literal(false),
  }).strict(),
  dataPolicy: z.object({
    syntheticNoncommercialPreflightOnly: z.literal(true),
    restrictedCustomerDataAllowed: z.literal(false),
    requestPayloadStorageAllowed: z.literal(false),
    publicInputOrOutputMediaAllowed: z.literal(false),
    providerUrlMayBecomeDurableProjectReference: z.literal(false),
    inputAndOutputExpirationSeconds: z.literal(3_600),
    immediatePrivateIngestRequired: z.literal(true),
  }).strict(),
  gates: z.array(gateSchema).length(MOTION_STUDIO_SYNCHRONIZED_FOLEY_D4_PREFLIGHT_GATE_CODES.length).readonly(),
  blockingGateCodes: z.array(gateCodeSchema).length(9).readonly(),
  sideEffects: z.object({
    credentialReadCount: z.literal(0),
    inputUploadCount: z.literal(0),
    externalRequestCount: z.literal(0),
    providerSubmissionCount: z.literal(0),
    statusRequestCount: z.literal(0),
    resultRequestCount: z.literal(0),
    binaryDownloadCount: z.literal(0),
    providerCandidateCreated: z.literal(false),
    mediaBytesCreated: z.literal(0),
    providerCostMicros: z.literal(0),
    infrastructureCostMicros: z.literal(0),
    authorityIssued: z.literal(false),
    selectionPerformed: z.literal(false),
    finalMixMutationPerformed: z.literal(false),
    timelineMutationPerformed: z.literal(false),
    renderPerformed: z.literal(false),
    exportPerformed: z.literal(false),
    remoteMutationPerformed: z.literal(false),
  }).strict(),
  providerExecutionAllowed: z.literal(false),
  singleUseAuthorityIssued: z.literal(false),
  automaticRetryAllowed: z.literal(false),
  automaticFallbackAllowed: z.literal(false),
  automaticSelectionAllowed: z.literal(false),
  finalMixAllowed: z.literal(false),
  productReady: z.literal(false),
  immutable: z.literal(true),
  preflightDigest: digest,
}).strict().superRefine((value, context) => {
  const gateCodes = value.gates.map((gate) => gate.gateCode)
  if (new Set(gateCodes).size !== MOTION_STUDIO_SYNCHRONIZED_FOLEY_D4_PREFLIGHT_GATE_CODES.length ||
      !sameOrdered(gateCodes, MOTION_STUDIO_SYNCHRONIZED_FOLEY_D4_PREFLIGHT_GATE_CODES)) {
    context.addIssue({ code: 'custom', path: ['gates'], message: 'D4 preflight must classify every gate once in canonical order.' })
  }
  const expectedBlockers = value.gates.filter((gate) => gate.state === 'external_evidence_required')
    .map((gate) => gate.gateCode)
  if (!sameOrdered(expectedBlockers, value.blockingGateCodes) ||
      !sameOrdered(value.blockingGateCodes, ROUTE_BLOCKING_GATES)) {
    context.addIssue({ code: 'custom', path: ['blockingGateCodes'], message: 'D4 blockers must exactly preserve the nine route blockers.' })
  }
  if (value.timing.timelineFrameRange.endFrame - value.timing.timelineFrameRange.startFrame !== value.timing.durationFrames ||
      value.timing.sourceFrameRange.endFrame - value.timing.sourceFrameRange.startFrame !== value.timing.durationFrames ||
      value.requestTemplate.bodyTemplate.duration !== value.timing.requestedDurationSeconds) {
    context.addIssue({ code: 'custom', path: ['timing'], message: 'D4 request template must preserve exact approved duration.' })
  }
})

export type MotionStudioSynchronizedFoleyD4PreflightV1 =
  z.infer<typeof motionStudioSynchronizedFoleyD4PreflightV1Schema>

export function createMotionStudioSynchronizedFoleyD4Preflight(input: {
  request: MotionStudioSynchronizedFoleyCandidateRequestV1
  routeReassessment: MotionStudioSynchronizedFoleyRouteReassessmentV1
  fps: 24 | 30
  createdAt: string
}): MotionStudioSynchronizedFoleyD4PreflightV1 {
  const request = motionStudioSynchronizedFoleyCandidateRequestV1Schema.parse(input.request) as
    MotionStudioSynchronizedFoleyCandidateRequestV1
  const route = motionStudioSynchronizedFoleyRouteReassessmentV1Schema.parse(input.routeReassessment)
  assertMotionStudioSynchronizedFoleyRouteReassessment(route)
  const createdAt = exactIso(input.createdAt)
  if (createdAt < route.capturedAt || createdAt >= route.expiresAt) {
    blocked('Fal synchronized-Foley route evidence is not current for this preflight.')
  }
  assertExactScope(request, route)
  assertExactCapabilityBinding(request, route)
  assertProtocolOnlySourceRequest(request)
  assertSoundEventPolicy(request)

  const durationFrames = request.range.endFrame - request.range.startFrame
  if (request.sourceFrameRange.endFrame - request.sourceFrameRange.startFrame !== durationFrames) {
    blocked('Synchronized-Foley source clip and approved timeline event must have the same frame duration.')
  }
  const requestedDurationSeconds = Number((durationFrames / input.fps).toFixed(6))
  if (requestedDurationSeconds < route.behavior.acceptedVideoDurationSeconds[0] ||
      requestedDurationSeconds > route.behavior.acceptedVideoDurationSeconds[1]) {
    blocked('Synchronized-Foley duration is outside the verified Fal MMAudio V2 range.')
  }
  const requestDigest = sha256CanonicalJson(request)
  const prompt = compilePrompt(request)
  const negativePrompt = compileNegativePrompt(request)
  const bodyTemplate = {
    video_url: {
      valueIncluded: false as const,
      runtimeBinding: 'exact_owner_only_bounded_source_clip_url' as const,
      sourceVideoAssetId: request.sourceVideoAssetVersion.assetId,
      sourceVideoAssetVersionId: request.sourceVideoAssetVersion.assetVersionId,
      sourceVideoContentDigest: request.sourceVideoAssetVersion.contentDigest,
      sourceFrameRange: {
        startFrame: request.sourceFrameRange.startFrame,
        endFrame: request.sourceFrameRange.endFrame,
      },
      boundedClipMaterialized: false as const,
      ownerOnlyUploadAclRequired: true as const,
      expirationSeconds: 3_600 as const,
    },
    prompt,
    negative_prompt: negativePrompt,
    seed: Number.parseInt(requestDigest.slice(0, 8), 16) & 0x7fffffff,
    num_steps: 25 as const,
    duration: requestedDurationSeconds,
    cfg_strength: 4.5 as const,
    mask_away_clip: false as const,
  }
  const bodyTemplateByteLength = Buffer.byteLength(JSON.stringify(bodyTemplate), 'utf8')
  if (bodyTemplateByteLength > 16_384) blocked('Fal synchronized-Foley request template exceeds the fixed body ceiling.')
  const templateBase = {
    schemaVersion: MOTION_STUDIO_SYNCHRONIZED_FOLEY_D4_REQUEST_TEMPLATE_SCHEMA_VERSION,
    requestTemplateId: `ms012d4-fal-template-${requestDigest.slice(0, 16)}`,
    sourceFoleyRequestId: request.foleyRequestId,
    sourceFoleyRequestDigest: requestDigest,
    routeReassessmentId: route.reassessmentId,
    routeReassessmentDigest: route.evidenceDigest,
    capabilitySnapshotId: route.capabilitySnapshot.capabilitySnapshotId,
    capabilitySnapshotDigest: route.capabilitySnapshot.evidenceDigest,
    providerOwnerCode: route.candidateRoute.providerOwnerCode,
    providerServiceCode: route.candidateRoute.serviceCode,
    providerRouteId: route.candidateRoute.providerRouteId,
    modelId: route.candidateRoute.modelId,
    endpoint: route.candidateRoute.endpoint,
    method: route.candidateRoute.method,
    authentication: {
      headerName: 'Authorization' as const,
      scheme: 'Key' as const,
      credentialValueIncluded: false as const,
      browserCredentialAllowed: false as const,
    },
    platformHeaders: {
      contentType: 'application/json' as const,
      noRetry: { name: 'X-Fal-No-Retry' as const, value: '1' as const },
      disableFallback: { name: 'x-app-fal-disable-fallback' as const, value: 'true' as const },
      storeIo: { name: 'X-Fal-Store-IO' as const, value: '0' as const },
      outputLifecycle: {
        name: 'X-Fal-Object-Lifecycle-Preference' as const,
        value: {
          expiration_duration_seconds: 3_600 as const,
          initial_acl: { default: 'forbid' as const, rules: [] as const },
        },
      },
    },
    bodyTemplate,
    bodyTemplateByteLength,
    maximumMaterializedBodyBytes: 16_384 as const,
    providerRequestBodyMaterialized: false as const,
    sourceBytesIncluded: false as const,
    sourceUrlIncluded: false as const,
    credentialIncluded: false as const,
    externalTransportAllowed: false as const,
    providerSubmissionAllowed: false as const,
    immutable: true as const,
  }
  const requestTemplate = parseAndFreeze({
    ...templateBase,
    requestTemplateDigest: sha256CanonicalJson(templateBase),
  }, motionStudioSynchronizedFoleyD4RequestTemplateV1Schema)
  const gates = createGates({ request, route, requestTemplate, createdAt })
  const blockers = gates.filter((gate) => gate.state === 'external_evidence_required')
    .map((gate) => gate.gateCode)
  const requestedDurationListEstimateMicros = Math.ceil(
    requestedDurationSeconds * route.pricing.listedProviderCostMicrosPerSecond,
  )
  const base = {
    schemaVersion: MOTION_STUDIO_SYNCHRONIZED_FOLEY_D4_PREFLIGHT_SCHEMA_VERSION,
    preflightId: `ms012d4-fal-preflight-${requestDigest.slice(0, 16)}`,
    workspaceId: request.workspaceId,
    projectId: request.projectId,
    editSessionId: request.editSessionId,
    productionId: request.productionId,
    createdAt,
    expiresAt: route.expiresAt,
    state: 'local_preflight_complete_nine_external_gates_required' as const,
    sourceFoleyRequestId: request.foleyRequestId,
    sourceFoleyRequestDigest: requestDigest,
    approvedSnapshotId: request.approval.approvedSnapshotId,
    approvedSnapshotDigest: request.approval.approvedSnapshotDigest,
    approvedPlanReviewId: request.approval.approvedPlanReviewId,
    approvedCreditEstimateId: request.approval.approvedCreditEstimateId,
    activeNoncommercialTestReservationId: request.approval.activeNoncommercialTestReservationId,
    soundEventId: request.soundEvent.soundEventId,
    sourceVideoAssetVersionId: request.sourceVideoAssetVersion.assetVersionId,
    sourceVideoContentDigest: request.sourceVideoAssetVersion.contentDigest,
    pictureLockContentDigest: request.pictureLockContentDigest,
    timingAuthorityDigest: request.timingAuthorityDigest,
    routeReassessmentId: route.reassessmentId,
    routeReassessmentDigest: route.evidenceDigest,
    capabilitySnapshotId: route.capabilitySnapshot.capabilitySnapshotId,
    capabilitySnapshotDigest: route.capabilitySnapshot.evidenceDigest,
    requestTemplate,
    timing: {
      fps: input.fps,
      sourceFrameRange: {
        startFrame: request.sourceFrameRange.startFrame,
        endFrame: request.sourceFrameRange.endFrame,
      },
      timelineFrameRange: {
        startFrame: request.range.startFrame,
        endFrame: request.range.endFrame,
      },
      durationFrames,
      requestedDurationSeconds,
    },
    transportBudgetProposal: {
      maximumSecretPayloadReads: 1 as const,
      maximumInputUploadRequests: 1 as const,
      maximumProviderSubmissions: 1 as const,
      maximumStatusRequests: 12 as const,
      maximumResultRequests: 1 as const,
      maximumBinaryDownloadRequests: 1 as const,
      maximumCancellationRequests: 1 as const,
      maximumNetworkRequestsIncludingCancellation: 17 as const,
      maximumAddressConnectionAttemptsPerRequest: 1 as const,
      addressFallbackAllowed: false as const,
      proxyOrPacExecutionAllowed: false as const,
      maximumRedirects: 0 as const,
      maximumRetries: 0 as const,
      maximumFallbacks: 0 as const,
      maximumRequestBodyBytes: 16_384 as const,
      maximumCapturedJsonResponseBytes: 1_048_576 as const,
      maximumBinaryDownloadBytes: 67_108_864 as const,
      maximumInputUploadBytes: null,
      maximumElapsedMilliseconds: 180_000 as const,
      statusPollIntervalMilliseconds: 10_000 as const,
      inputUploadBudgetRequiresMaterializedClip: true as const,
      unknownOutcomeRequiresReconciliation: true as const,
    },
    costBudgetProposal: {
      currency: 'USD' as const,
      providerBillingUnit: 'successful_output_second' as const,
      publicListRateMicrosPerSecond: route.pricing.listedProviderCostMicrosPerSecond,
      requestedDurationListEstimateMicros,
      maximumAuthorizedProviderCostMicros: route.pricing.maximumListedProviderCostMicrosForThirtySeconds,
      maximumAuthorizedInfrastructureCostMicros: null,
      maximumAuthorizedTotalInternalCostMicros: null,
      immutableExecutionRateCardCreated: false as const,
      providerUsageReconciliationImplemented: false as const,
      failedAttemptCostMustBeRetained: true as const,
      customerPricingIncluded: false as const,
      customerCreditsIncluded: false as const,
      serviceFeeIncluded: false as const,
      customerBillingAllowed: false as const,
    },
    dataPolicy: {
      syntheticNoncommercialPreflightOnly: true as const,
      restrictedCustomerDataAllowed: false as const,
      requestPayloadStorageAllowed: false as const,
      publicInputOrOutputMediaAllowed: false as const,
      providerUrlMayBecomeDurableProjectReference: false as const,
      inputAndOutputExpirationSeconds: 3_600 as const,
      immediatePrivateIngestRequired: true as const,
    },
    gates,
    blockingGateCodes: blockers,
    sideEffects: {
      credentialReadCount: 0 as const,
      inputUploadCount: 0 as const,
      externalRequestCount: 0 as const,
      providerSubmissionCount: 0 as const,
      statusRequestCount: 0 as const,
      resultRequestCount: 0 as const,
      binaryDownloadCount: 0 as const,
      providerCandidateCreated: false as const,
      mediaBytesCreated: 0 as const,
      providerCostMicros: 0 as const,
      infrastructureCostMicros: 0 as const,
      authorityIssued: false as const,
      selectionPerformed: false as const,
      finalMixMutationPerformed: false as const,
      timelineMutationPerformed: false as const,
      renderPerformed: false as const,
      exportPerformed: false as const,
      remoteMutationPerformed: false as const,
    },
    providerExecutionAllowed: false as const,
    singleUseAuthorityIssued: false as const,
    automaticRetryAllowed: false as const,
    automaticFallbackAllowed: false as const,
    automaticSelectionAllowed: false as const,
    finalMixAllowed: false as const,
    productReady: false as const,
    immutable: true as const,
  }
  return parseAndFreeze({ ...base, preflightDigest: sha256CanonicalJson(base) },
    motionStudioSynchronizedFoleyD4PreflightV1Schema)
}

export function assertMotionStudioSynchronizedFoleyD4Preflight(
  input: MotionStudioSynchronizedFoleyD4PreflightV1,
): void {
  const plan = motionStudioSynchronizedFoleyD4PreflightV1Schema.parse(input)
  const templateBase = { ...plan.requestTemplate } as Record<string, unknown>
  delete templateBase.requestTemplateDigest
  if (sha256CanonicalJson(templateBase) !== plan.requestTemplate.requestTemplateDigest) {
    blocked('D4 Fal request template failed immutable digest verification.')
  }
  const planBase = { ...plan } as Record<string, unknown>
  delete planBase.preflightDigest
  if (sha256CanonicalJson(planBase) !== plan.preflightDigest) {
    blocked('D4 Fal preflight failed immutable digest verification.')
  }
  if (plan.requestTemplate.providerRequestBodyMaterialized ||
      plan.requestTemplate.sourceUrlIncluded || plan.requestTemplate.credentialIncluded ||
      plan.providerExecutionAllowed || plan.singleUseAuthorityIssued ||
      plan.sideEffects.credentialReadCount !== 0 || plan.sideEffects.externalRequestCount !== 0 ||
      plan.sideEffects.providerSubmissionCount !== 0 || plan.sideEffects.mediaBytesCreated !== 0 ||
      plan.sideEffects.providerCostMicros !== 0 || plan.sideEffects.infrastructureCostMicros !== 0) {
    blocked('Local D4 preflight crossed a URL, credential, transport, media, cost or authority gate.')
  }
  if (!sameOrdered(plan.blockingGateCodes, ROUTE_BLOCKING_GATES)) {
    blocked('Local D4 preflight no longer preserves the nine Fal route blockers.')
  }
}

function createGates(input: {
  request: MotionStudioSynchronizedFoleyCandidateRequestV1
  route: MotionStudioSynchronizedFoleyRouteReassessmentV1
  requestTemplate: MotionStudioSynchronizedFoleyD4RequestTemplateV1
  createdAt: string
}): readonly z.infer<typeof gateSchema>[] {
  const passedEvidence = new Map<MotionStudioSynchronizedFoleyD4PreflightGateCode, string>([
    ['official_candidate_route_current', input.route.evidenceDigest],
    ['historical_d2_immutable', input.route.historicalD2.discoveryRecordDigest],
    ['exact_scope_and_capability_binding', input.route.capabilitySnapshot.evidenceDigest],
    ['immutable_plan_credit_and_reservation_binding', input.request.approval.approvedSnapshotDigest],
    ['exact_event_source_picture_and_timing_binding', sha256CanonicalJson({
      event: input.request.soundEvent,
      source: input.request.sourceVideoAssetVersion,
      sourceFrameRange: input.request.sourceFrameRange,
      picture: input.request.pictureLockContentDigest,
      timing: input.request.timingAuthorityDigest,
    })],
    ['visible_or_environment_event_only', sha256CanonicalJson({
      role: input.request.soundEvent.role,
      reasonKind: input.request.soundEvent.reasonKind,
      direction: input.request.direction,
    })],
    ['credential_free_unmaterialized_request_template', input.requestTemplate.requestTemplateDigest],
    ['bounded_duration_and_public_list_cost', sha256CanonicalJson({
      duration: input.requestTemplate.bodyTemplate.duration,
      rate: input.route.pricing.listedProviderCostMicrosPerSecond,
      maximum: input.route.pricing.maximumListedProviderCostMicrosForThirtySeconds,
    })],
    ['one_submission_no_retry_no_fallback_design', sha256CanonicalJson({
      maximumSubmissions: 1,
      noRetry: input.requestTemplate.platformHeaders.noRetry,
      noFallback: input.requestTemplate.platformHeaders.disableFallback,
      requestPayloadStorage: input.requestTemplate.platformHeaders.storeIo,
    })],
  ])
  return deepFreeze(MOTION_STUDIO_SYNCHRONIZED_FOLEY_D4_PREFLIGHT_GATE_CODES.map((gateCode) => {
    const evidence = passedEvidence.get(gateCode)
    const state = evidence ? 'passed_local' as const : 'external_evidence_required' as const
    return gateSchema.parse({
      gateCode,
      state,
      evidenceId: evidence ? `ms012d4-local-${gateCode}` : `ms012d4-pending-${gateCode}`,
      evidenceDigest: evidence ?? sha256CanonicalJson({ gateCode, state, createdAt: input.createdAt }),
      explanation: evidence
        ? localGateExplanation(gateCode)
        : `External or actual-candidate evidence is still required for ${gateCode.replaceAll('_', ' ')}.`,
    })
  }))
}

function compilePrompt(request: MotionStudioSynchronizedFoleyCandidateRequestV1): string {
  return [
    'Create one synchronized Foley or ambience candidate for the exact visible source clip.',
    `Approved event: ${request.soundEvent.reason}`,
    `Expected audible events: ${request.direction.expectedAudibleEvents.join('; ')}.`,
    `Environment: ${request.direction.environment}.`,
    `Texture: ${request.direction.texture}.`,
    `Intensity: ${request.direction.intensity}.`,
    `Speech policy: ${request.direction.speechSafety.replaceAll('_', ' ')}.`,
    'Follow only visible action or approved story-environment evidence in the supplied clip.',
    'Keep the result natural, restrained, editable and free of added claims.',
    `Do not invent: ${request.direction.doNotInvent.join('; ')}.`,
  ].join('\n')
}

function compileNegativePrompt(request: MotionStudioSynchronizedFoleyCandidateRequestV1): string {
  return [
    'dialogue', 'speech', 'narration', 'voices', 'vocals', 'music', 'score',
    'songs', 'exact named sounds', 'unseen actions', 'invented events',
    'factual claims', ...request.direction.doNotInvent,
  ].join(', ')
}

function assertExactScope(
  request: MotionStudioSynchronizedFoleyCandidateRequestV1,
  route: MotionStudioSynchronizedFoleyRouteReassessmentV1,
): void {
  if (request.workspaceId !== route.workspaceId || request.projectId !== route.projectId ||
      request.editSessionId !== route.editSessionId || request.productionId !== route.productionId) {
    blocked('D4 request and Fal route evidence must share exact tenant and production scope.')
  }
}

function assertExactCapabilityBinding(
  request: MotionStudioSynchronizedFoleyCandidateRequestV1,
  route: MotionStudioSynchronizedFoleyRouteReassessmentV1,
): void {
  if (request.capabilitySnapshotId !== route.capabilitySnapshot.capabilitySnapshotId ||
      request.capabilitySnapshotDigest !== route.capabilitySnapshot.evidenceDigest ||
      request.configuredRouteId !== route.capabilitySnapshot.configuredRouteId) {
    blocked('D4 request must bind the exact current Fal capability snapshot.')
  }
}

function assertProtocolOnlySourceRequest(request: MotionStudioSynchronizedFoleyCandidateRequestV1): void {
  const cost = request.cost
  const boundary = request.executionBoundary
  if (cost.maximumAuthorizedProviderCostMicros !== 0 ||
      cost.maximumAuthorizedLocalComputeCostMicros !== 0 ||
      cost.maximumAuthorizedTotalInternalCostMicros !== 0 ||
      !boundary.protocolSimulatorOnly || boundary.externalTransportAllowed ||
      boundary.providerExecutionAllowed || boundary.providerSubmissionMaximum !== 0 ||
      boundary.privateIngestExecutionAllowed || boundary.selectionAllowed ||
      boundary.finalMixAllowed || boundary.timelineMutationAllowed || boundary.renderAllowed ||
      boundary.exportAllowed || boundary.productReady) {
    blocked('D4 local preflight accepts only a zero-authority source request.')
  }
}

function assertSoundEventPolicy(request: MotionStudioSynchronizedFoleyCandidateRequestV1): void {
  if (!request.sourceVideoAssetVersion.privateAsset ||
      request.sourceVideoAssetVersion.browserDirectProviderAccessAllowed ||
      request.soundEvent.role === 'exact_sfx' || request.soundEvent.reasonKind === 'exact_named_sound' ||
      request.direction.dialogueAllowed || request.direction.narrationAllowed ||
      request.direction.musicAllowed || request.direction.exactNamedSoundAllowed ||
      request.direction.unseenActionAllowed || request.direction.factualAdditionAllowed) {
    blocked('D4 preflight accepts only private, visible-action or environment Foley with every forbidden role disabled.')
  }
}

function localGateExplanation(gateCode: MotionStudioSynchronizedFoleyD4PreflightGateCode): string {
  const explanations: Partial<Record<MotionStudioSynchronizedFoleyD4PreflightGateCode, string>> = {
    official_candidate_route_current: 'The official Fal candidate-route evidence is current and digest-valid.',
    historical_d2_immutable: 'The accepted historical MMAudio.net route-closed record remains immutable.',
    exact_scope_and_capability_binding: 'The request binds the exact tenant, production and Fal capability snapshot.',
    immutable_plan_credit_and_reservation_binding: 'The source request preserves the approved plan, estimate and test reservation references.',
    exact_event_source_picture_and_timing_binding: 'The exact sound event, private source version, frame range, picture lock and timing authority are bound.',
    visible_or_environment_event_only: 'The request permits only approved visible-action Foley or story-environment ambience.',
    credential_free_unmaterialized_request_template: 'The provider template contains no credential, source bytes or provider URL.',
    bounded_duration_and_public_list_cost: 'Duration is within 1–30 seconds and public list-cost arithmetic is bounded.',
    one_submission_no_retry_no_fallback_design: 'The template fixes one submission and explicit no-retry, no-fallback and no-payload-storage controls.',
  }
  return explanations[gateCode] ?? 'External evidence remains required.'
}

function hasUnsafeControlCharacter(value: string): boolean {
  return Array.from(value).some((character) => {
    const code = character.charCodeAt(0)
    return (code >= 0 && code <= 8) || code === 11 || code === 12 ||
      (code >= 14 && code <= 31) || code === 127
  })
}

function exactIso(value: string): string {
  const parsed = new Date(value)
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== value) {
    invalid('D4 preflight creation time must be canonical ISO-8601.')
  }
  return value
}

function sameOrdered(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index])
}

function parseAndFreeze<T>(value: unknown, schema: z.ZodType<T>): T {
  return deepFreeze(schema.parse(value))
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child)
    Object.freeze(value)
  }
  return value
}

function invalid(message: string): never {
  throw new ApiError('VALIDATION_FAILED', message, 400)
}

function blocked(message: string): never {
  throw new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', message, 409)
}
