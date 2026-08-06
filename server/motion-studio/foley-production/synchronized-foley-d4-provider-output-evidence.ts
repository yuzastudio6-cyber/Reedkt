import { z } from 'zod'

import type { MotionStudioSynchronizedFoleyCandidateRequestV1 } from '../../../src/types/motion-studio'
import { motionStudioSynchronizedFoleyCandidateRequestV1Schema } from '../../../src/lib/motion-studio/contracts'
import { ApiError } from '../../errors/api-error'
import { sha256CanonicalJson } from '../commands/canonical-json'
import {
  assertMotionStudioSynchronizedFoleyRouteReassessment,
  motionStudioSynchronizedFoleyRouteReassessmentV1Schema,
  type MotionStudioSynchronizedFoleyRouteReassessmentV1,
} from '../audio/synchronized-foley-route-reassessment'
import {
  assertMotionStudioSynchronizedFoleyD4Preflight,
  motionStudioSynchronizedFoleyD4PreflightV1Schema,
  type MotionStudioSynchronizedFoleyD4PreflightV1,
} from './synchronized-foley-d4-preflight'

export const MOTION_STUDIO_SYNCHRONIZED_FOLEY_D4_PROVIDER_OUTPUT_EVIDENCE_SCHEMA_VERSION =
  'motion-studio.synchronized-foley-d4-provider-output-evidence.v1' as const

const stableId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => !value.includes('..'))
const digest = z.string().regex(/^[a-f0-9]{64}$/)
const isoDate = z.string().datetime({ offset: true })

export const motionStudioSynchronizedFoleyD4ProviderOutputEvidenceV1Schema = z.object({
  schemaVersion: z.literal(MOTION_STUDIO_SYNCHRONIZED_FOLEY_D4_PROVIDER_OUTPUT_EVIDENCE_SCHEMA_VERSION),
  evidenceId: stableId,
  workspaceId: stableId,
  projectId: stableId,
  editSessionId: stableId,
  productionId: stableId,
  capturedAt: isoDate,
  sourceFoleyRequestId: stableId,
  sourceFoleyRequestDigest: digest,
  sourcePreflightId: stableId,
  sourcePreflightDigest: digest,
  routeReassessmentId: stableId,
  routeReassessmentDigest: digest,
  capabilitySnapshotId: stableId,
  capabilitySnapshotDigest: digest,
  provider: z.object({
    ownerCode: z.literal('fal_ai'),
    serviceCode: z.literal('fal_model_apis'),
    routeId: z.literal('fal_ai_mmaudio_v2'),
    modelId: z.literal('fal-ai/mmaudio-v2'),
    immutableModelRevision: z.null(),
    immutableRevisionGateResolved: z.literal(false),
  }).strict(),
  officialEvidence: z.object({
    modelPageSourceCode: z.literal('fal_mmaudio_v2_model_page_2026_07_19'),
    modelPageSourceDigest: digest,
    apiSourceCode: z.literal('fal_mmaudio_v2_api_2026_07_19'),
    apiSourceDigest: digest,
    commercialUseDesignation: z.literal('commercial_use_permitted_on_model_page'),
    enterpriseReadinessDesignation: z.literal('not_published_on_model_page'),
    excludedModelDesignation: z.literal('not_published_for_this_route'),
  }).strict(),
  providerOutput: z.object({
    role: z.literal('video_with_synchronized_audio'),
    container: z.literal('mp4'),
    responseContentType: z.literal('application/octet-stream'),
    exactAudioCodec: z.literal('unknown_until_private_probe'),
    exactSampleRateHertz: z.null(),
    exactChannelCount: z.null(),
    mayBeTreatedAsDirectAudioOutput: z.literal(false),
    providerUrlMayBecomeDurableProjectReference: z.literal(false),
  }).strict(),
  canonicalAudioTarget: z.object({
    role: z.literal('extracted_normalized_foley_candidate'),
    container: z.literal('wav'),
    codec: z.literal('pcm_s16le'),
    sampleRateHertz: z.literal(48_000),
    channelCount: z.literal(2),
  }).strict(),
  requiredPrivatePipeline: z.object({
    stages: z.tuple([
      z.literal('immediate_private_provider_mp4_ingest'),
      z.literal('private_mp4_audio_stream_probe'),
      z.literal('deterministic_audio_extraction_and_normalization'),
      z.literal('private_wav_integrity_probe'),
      z.literal('synchronized_foley_objective_qa'),
      z.literal('human_semantic_rights_and_listening_review'),
    ]).readonly(),
    deterministicNormalizationProfileId: z.null(),
    deterministicNormalizationRuntimeProven: z.literal(false),
    providerContainerMayEnterCanonicalAudioQa: z.literal(false),
    exactPrivateOutputProbeRequired: z.literal(true),
  }).strict(),
  rightsBoundary: z.object({
    providerCommercialUseDesignationObserved: z.literal(true),
    providerCommercialUseClaim: z.literal('commercial_use_permitted'),
    upstreamCheckpointLicense: z.literal('cc_by_nc_4_0'),
    upstreamCommercialSuitability: z.literal('not_guaranteed'),
    commercialUseDesignationIsCandidateRightsAttestation: z.literal(false),
    actualCandidateRightsAttestationPresent: z.literal(false),
    commercialRightsGateResolved: z.literal(false),
  }).strict(),
  blockingGateCodes: z.tuple([
    z.literal('immutable_model_revision_not_published'),
    z.literal('exact_output_audio_codec_sample_rate_and_channels_require_private_probe'),
    z.literal('enterprise_ready_or_excluded_model_designation_not_published'),
    z.literal('commercial_rights_conflict_requires_provider_or_legal_attestation'),
    z.literal('account_access_prepaid_funds_quota_and_rate_card_not_verified'),
    z.literal('canonical_provider_dispatch_lease_single_use_and_cost_runtime_absent'),
    z.literal('private_acl_expiration_ingest_and_cleanup_runtime_not_proven'),
    z.literal('no_retry_no_fallback_and_unknown_outcome_runtime_not_proven'),
    z.literal('actual_candidate_semantic_rights_and_human_reviews_absent'),
  ]).readonly(),
  sideEffects: z.object({
    credentialReadCount: z.literal(0),
    externalRequestCount: z.literal(0),
    providerSubmissionCount: z.literal(0),
    binaryDownloadCount: z.literal(0),
    mediaBytesCreated: z.literal(0),
    providerCostMicros: z.literal(0),
    infrastructureCostMicros: z.literal(0),
    selectionPerformed: z.literal(false),
    finalMixMutationPerformed: z.literal(false),
    timelineMutationPerformed: z.literal(false),
    renderPerformed: z.literal(false),
    exportPerformed: z.literal(false),
    remoteMutationPerformed: z.literal(false),
  }).strict(),
  providerExecutionAllowed: z.literal(false),
  privateNormalizationExecutionAllowed: z.literal(false),
  automaticSelectionAllowed: z.literal(false),
  productReady: z.literal(false),
  immutable: z.literal(true),
  evidenceDigest: digest,
}).strict()

export type MotionStudioSynchronizedFoleyD4ProviderOutputEvidenceV1 =
  z.infer<typeof motionStudioSynchronizedFoleyD4ProviderOutputEvidenceV1Schema>

export function createMotionStudioSynchronizedFoleyD4ProviderOutputEvidence(input: {
  request: MotionStudioSynchronizedFoleyCandidateRequestV1
  preflight: MotionStudioSynchronizedFoleyD4PreflightV1
  routeReassessment: MotionStudioSynchronizedFoleyRouteReassessmentV1
  capturedAt: string
}): MotionStudioSynchronizedFoleyD4ProviderOutputEvidenceV1 {
  const request = motionStudioSynchronizedFoleyCandidateRequestV1Schema.parse(input.request)
  const preflight = motionStudioSynchronizedFoleyD4PreflightV1Schema.parse(input.preflight)
  const route = motionStudioSynchronizedFoleyRouteReassessmentV1Schema.parse(input.routeReassessment)
  assertMotionStudioSynchronizedFoleyD4Preflight(preflight)
  assertMotionStudioSynchronizedFoleyRouteReassessment(route)
  const capturedAt = exactIso(input.capturedAt)

  if (capturedAt < route.capturedAt || capturedAt >= route.expiresAt) {
    blocked('Fal synchronized-Foley output evidence is not current.')
  }
  assertExactLineage({ request, preflight, route })
  assertExactOutputBoundary({ request, route })

  const modelPageSource = requireSource(route, 'fal_mmaudio_v2_model_page_2026_07_19')
  const apiSource = requireSource(route, 'fal_mmaudio_v2_api_2026_07_19')
  const base = {
    schemaVersion: MOTION_STUDIO_SYNCHRONIZED_FOLEY_D4_PROVIDER_OUTPUT_EVIDENCE_SCHEMA_VERSION,
    evidenceId: `ms012d4-output-${preflight.preflightDigest.slice(0, 16)}`,
    workspaceId: request.workspaceId,
    projectId: request.projectId,
    editSessionId: request.editSessionId,
    productionId: request.productionId,
    capturedAt,
    sourceFoleyRequestId: request.foleyRequestId,
    sourceFoleyRequestDigest: sha256CanonicalJson(request),
    sourcePreflightId: preflight.preflightId,
    sourcePreflightDigest: preflight.preflightDigest,
    routeReassessmentId: route.reassessmentId,
    routeReassessmentDigest: route.evidenceDigest,
    capabilitySnapshotId: route.capabilitySnapshot.capabilitySnapshotId,
    capabilitySnapshotDigest: route.capabilitySnapshot.evidenceDigest,
    provider: {
      ownerCode: 'fal_ai' as const,
      serviceCode: 'fal_model_apis' as const,
      routeId: 'fal_ai_mmaudio_v2' as const,
      modelId: 'fal-ai/mmaudio-v2' as const,
      immutableModelRevision: null,
      immutableRevisionGateResolved: false as const,
    },
    officialEvidence: {
      modelPageSourceCode: 'fal_mmaudio_v2_model_page_2026_07_19' as const,
      modelPageSourceDigest: modelPageSource.sourceAuthorityDigest,
      apiSourceCode: 'fal_mmaudio_v2_api_2026_07_19' as const,
      apiSourceDigest: apiSource.sourceAuthorityDigest,
      commercialUseDesignation: 'commercial_use_permitted_on_model_page' as const,
      enterpriseReadinessDesignation: 'not_published_on_model_page' as const,
      excludedModelDesignation: 'not_published_for_this_route' as const,
    },
    providerOutput: {
      role: 'video_with_synchronized_audio' as const,
      container: 'mp4' as const,
      responseContentType: route.outputContract.responseContentType,
      exactAudioCodec: 'unknown_until_private_probe' as const,
      exactSampleRateHertz: null,
      exactChannelCount: null,
      mayBeTreatedAsDirectAudioOutput: false as const,
      providerUrlMayBecomeDurableProjectReference: false as const,
    },
    canonicalAudioTarget: {
      role: 'extracted_normalized_foley_candidate' as const,
      container: request.output.container,
      codec: request.output.codec,
      sampleRateHertz: request.output.sampleRateHertz,
      channelCount: request.output.channelCount,
    },
    requiredPrivatePipeline: {
      stages: [
        'immediate_private_provider_mp4_ingest',
        'private_mp4_audio_stream_probe',
        'deterministic_audio_extraction_and_normalization',
        'private_wav_integrity_probe',
        'synchronized_foley_objective_qa',
        'human_semantic_rights_and_listening_review',
      ] as const,
      deterministicNormalizationProfileId: null,
      deterministicNormalizationRuntimeProven: false as const,
      providerContainerMayEnterCanonicalAudioQa: false as const,
      exactPrivateOutputProbeRequired: true as const,
    },
    rightsBoundary: {
      providerCommercialUseDesignationObserved: true as const,
      providerCommercialUseClaim: route.candidateRoute.providerCommercialUseClaim,
      upstreamCheckpointLicense: route.candidateRoute.upstreamCheckpointLicense,
      upstreamCommercialSuitability: route.candidateRoute.upstreamCommercialSuitability,
      commercialUseDesignationIsCandidateRightsAttestation: false as const,
      actualCandidateRightsAttestationPresent: false as const,
      commercialRightsGateResolved: false as const,
    },
    blockingGateCodes: route.blockingGates,
    sideEffects: {
      credentialReadCount: 0 as const,
      externalRequestCount: 0 as const,
      providerSubmissionCount: 0 as const,
      binaryDownloadCount: 0 as const,
      mediaBytesCreated: 0 as const,
      providerCostMicros: 0 as const,
      infrastructureCostMicros: 0 as const,
      selectionPerformed: false as const,
      finalMixMutationPerformed: false as const,
      timelineMutationPerformed: false as const,
      renderPerformed: false as const,
      exportPerformed: false as const,
      remoteMutationPerformed: false as const,
    },
    providerExecutionAllowed: false as const,
    privateNormalizationExecutionAllowed: false as const,
    automaticSelectionAllowed: false as const,
    productReady: false as const,
    immutable: true as const,
  }

  return parseAndFreeze({ ...base, evidenceDigest: sha256CanonicalJson(base) },
    motionStudioSynchronizedFoleyD4ProviderOutputEvidenceV1Schema)
}

export function assertMotionStudioSynchronizedFoleyD4ProviderOutputEvidence(
  input: MotionStudioSynchronizedFoleyD4ProviderOutputEvidenceV1,
): void {
  const evidence = motionStudioSynchronizedFoleyD4ProviderOutputEvidenceV1Schema.parse(input)
  const base = { ...evidence } as Record<string, unknown>
  delete base.evidenceDigest
  if (sha256CanonicalJson(base) !== evidence.evidenceDigest) {
    blocked('D4 provider-output evidence failed immutable digest verification.')
  }
  if (evidence.providerExecutionAllowed || evidence.privateNormalizationExecutionAllowed ||
      evidence.automaticSelectionAllowed || evidence.productReady ||
      evidence.sideEffects.externalRequestCount !== 0 ||
      evidence.sideEffects.mediaBytesCreated !== 0 ||
      evidence.sideEffects.providerCostMicros !== 0 ||
      evidence.sideEffects.infrastructureCostMicros !== 0) {
    blocked('D4 provider-output evidence crossed a transport, media, cost, selection or readiness boundary.')
  }
}

function assertExactLineage(input: {
  request: MotionStudioSynchronizedFoleyCandidateRequestV1
  preflight: MotionStudioSynchronizedFoleyD4PreflightV1
  route: MotionStudioSynchronizedFoleyRouteReassessmentV1
}): void {
  const { request, preflight, route } = input
  if (request.workspaceId !== preflight.workspaceId || request.workspaceId !== route.workspaceId ||
      request.projectId !== preflight.projectId || request.projectId !== route.projectId ||
      request.editSessionId !== preflight.editSessionId || request.editSessionId !== route.editSessionId ||
      request.productionId !== preflight.productionId || request.productionId !== route.productionId) {
    blocked('D4 output evidence must share exact request, preflight and route scope.')
  }
  const requestDigest = sha256CanonicalJson(request)
  if (preflight.sourceFoleyRequestId !== request.foleyRequestId ||
      preflight.sourceFoleyRequestDigest !== requestDigest ||
      preflight.routeReassessmentId !== route.reassessmentId ||
      preflight.routeReassessmentDigest !== route.evidenceDigest ||
      preflight.capabilitySnapshotId !== route.capabilitySnapshot.capabilitySnapshotId ||
      preflight.capabilitySnapshotDigest !== route.capabilitySnapshot.evidenceDigest) {
    blocked('D4 output evidence must bind the exact request, preflight, route and capability lineage.')
  }
}

function assertExactOutputBoundary(input: {
  request: MotionStudioSynchronizedFoleyCandidateRequestV1
  route: MotionStudioSynchronizedFoleyRouteReassessmentV1
}): void {
  const { request, route } = input
  if (route.outputContract.providerOutputKind !== 'mp4_video_with_synchronized_audio' ||
      route.outputContract.responseContentType !== 'application/octet-stream' ||
      route.outputContract.exactAudioCodec !== 'unknown_until_private_probe' ||
      route.outputContract.exactSampleRateHertz !== 'unknown_until_private_probe' ||
      route.outputContract.exactChannelCount !== 'unknown_until_private_probe' ||
      !route.outputContract.privateProbeExtractionAndNormalizationRequired ||
      route.outputContract.providerUrlMayBecomeDurableProjectReference ||
      request.output.container !== 'wav' || request.output.codec !== 'pcm_s16le' ||
      request.output.sampleRateHertz !== 48_000 || request.output.channelCount !== 2) {
    blocked('D4 output evidence must keep the Fal MP4 provider result separate from the canonical normalized WAV candidate.')
  }
}

function requireSource(
  route: MotionStudioSynchronizedFoleyRouteReassessmentV1,
  sourceCode: string,
): MotionStudioSynchronizedFoleyRouteReassessmentV1['sources'][number] {
  const source = route.sources.find((candidate) => candidate.sourceCode === sourceCode)
  if (!source) blocked(`D4 output evidence is missing official source ${sourceCode}.`)
  return source
}

function exactIso(value: string): string {
  const parsed = new Date(value)
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== value) {
    invalid('D4 provider-output capture time must be canonical ISO-8601.')
  }
  return value
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
