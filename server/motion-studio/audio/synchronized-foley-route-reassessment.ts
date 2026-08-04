import { z } from 'zod'

import type {
  MotionStudioSynchronizedFoleyCapabilityField,
  MotionStudioSynchronizedFoleyCapabilitySnapshotV1,
} from '../../../src/types/motion-studio'
import {
  MOTION_STUDIO_SYNCHRONIZED_FOLEY_CAPABILITY_FIELDS,
  motionStudioSynchronizedFoleyCapabilitySnapshotV1Schema,
} from '../../../src/lib/motion-studio/contracts'
import { ApiError } from '../../errors/api-error'
import { sha256CanonicalJson } from '../commands/canonical-json'

export const MOTION_STUDIO_SYNCHRONIZED_FOLEY_ROUTE_REASSESSMENT_SCHEMA_VERSION =
  'motion-studio.synchronized-foley-route-reassessment.v1' as const

const CAPTURED_AT = '2026-07-19T21:30:00.000Z'
const EXPIRES_AT = '2026-07-26T21:30:00.000Z'
const HISTORICAL_D2_DISCOVERY_DIGEST =
  '4118a8f93a65274c64a890ae9f00df2cd227ddf217bf2a786482d401fca2c186'
const HISTORICAL_D2_CAPABILITY_DIGEST =
  'a9060dfd29ab41554215fd043467949a2a6ee203b674b9dc9214142a1286e885'

const stableId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => !value.includes('..'))
const digest = z.string().regex(/^[a-f0-9]{64}$/)
const isoDate = z.string().datetime({ offset: true })

const sourceSchema = z.object({
  sourceCode: stableId,
  ownerCode: stableId,
  authorityClass: z.enum([
    'official_model_api',
    'official_platform_documentation',
    'official_pricing',
    'official_legal_terms',
    'official_upstream_project',
  ]),
  url: z.string().url(),
  capturedAt: isoDate,
  claimCodes: z.array(stableId).min(1).max(40).readonly(),
  sourceAuthorityDigest: digest,
}).strict()

const reassessmentSchema = z.object({
  schemaVersion: z.literal(MOTION_STUDIO_SYNCHRONIZED_FOLEY_ROUTE_REASSESSMENT_SCHEMA_VERSION),
  reassessmentId: stableId,
  workspaceId: stableId,
  projectId: stableId,
  editSessionId: stableId,
  productionId: stableId,
  capturedAt: isoDate,
  expiresAt: isoDate,
  historicalD2: z.object({
    discoveryRecordDigest: z.literal(HISTORICAL_D2_DISCOVERY_DIGEST),
    capabilitySnapshotDigest: z.literal(HISTORICAL_D2_CAPABILITY_DIGEST),
    configuredRouteId: z.literal('mmaudio'),
    providerOwnerCode: z.literal('mmaudio_net'),
    disposition: z.literal('preserved_route_closed'),
    immutableHistoryPreserved: z.literal(true),
    mayExecute: z.literal(false),
    reason: z.literal('upstream_project_disclaims_affiliation_and_exact_provider_contract_remains_unverified'),
  }).strict(),
  candidateRoute: z.object({
    configuredRouteId: z.literal('mmaudio'),
    providerOwnerCode: z.literal('fal_ai'),
    serviceCode: z.literal('fal_model_apis'),
    providerRouteId: z.literal('fal_ai_mmaudio_v2'),
    modelId: z.literal('fal-ai/mmaudio-v2'),
    immutableModelRevision: z.null(),
    lifecycle: z.literal('current_gallery_route_available_version_not_pinned'),
    endpoint: z.literal('https://queue.fal.run/fal-ai/mmaudio-v2'),
    method: z.literal('POST'),
    authentication: z.literal('authorization_key_backend_only'),
    providerCommercialUseClaim: z.literal('commercial_use_permitted'),
    upstreamCheckpointLicense: z.literal('cc_by_nc_4_0'),
    upstreamCommercialSuitability: z.literal('not_guaranteed'),
    commercialRightsStatus: z.literal('conflicting_provider_and_upstream_evidence_requires_review'),
  }).strict(),
  behavior: z.object({
    requestLifecycle: z.literal('asynchronous_queue_submit_status_result'),
    acceptedVideoDurationSeconds: z.tuple([z.literal(1), z.literal(30)]).readonly(),
    inputVideoFormats: z.tuple([
      z.literal('mp4'), z.literal('mov'), z.literal('webm'), z.literal('m4v'), z.literal('gif'),
    ]).readonly(),
    promptControls: z.tuple([
      z.literal('video_url'), z.literal('prompt'), z.literal('negative_prompt'),
      z.literal('seed'), z.literal('num_steps'), z.literal('duration'),
      z.literal('cfg_strength'), z.literal('mask_away_clip'),
    ]).readonly(),
    queueStates: z.tuple([
      z.literal('IN_QUEUE'), z.literal('IN_PROGRESS'), z.literal('COMPLETED'),
    ]).readonly(),
    statusSupported: z.literal(true),
    resultRetrievalSupported: z.literal(true),
    cancellation: z.literal('queued_immediate_in_progress_best_effort_may_complete'),
  }).strict(),
  reliabilityPolicy: z.object({
    providerDefaultRetryMaximum: z.literal(10),
    providerDefaultFallbackEnabled: z.literal(true),
    requiredNoRetryHeader: z.object({
      name: z.literal('X-Fal-No-Retry'),
      value: z.literal('1'),
    }).strict(),
    requiredNoFallbackHeader: z.object({
      name: z.literal('x-app-fal-disable-fallback'),
      value: z.literal('true'),
      runtimeConfirmationRequired: z.literal(true),
    }).strict(),
    automaticRetryAllowedByMotionStudio: z.literal(false),
    automaticFallbackAllowedByMotionStudio: z.literal(false),
    unknownOutcomeRequiresReconciliation: z.literal(true),
  }).strict(),
  outputContract: z.object({
    providerOutputKind: z.literal('mp4_video_with_synchronized_audio'),
    responseContentType: z.literal('application/octet-stream'),
    exactAudioCodec: z.literal('unknown_until_private_probe'),
    exactSampleRateHertz: z.literal('unknown_until_private_probe'),
    exactChannelCount: z.literal('unknown_until_private_probe'),
    canonicalAudioOutputRequired: z.literal('wav_pcm_s16le_48000hz_stereo'),
    privateProbeExtractionAndNormalizationRequired: z.literal(true),
    providerUrlMayBecomeDurableProjectReference: z.literal(false),
  }).strict(),
  dataPolicy: z.object({
    requestPayloadDefaultRetentionDays: z.literal(30),
    requestPayloadStorageOptOutHeader: z.object({
      name: z.literal('X-Fal-Store-IO'),
      value: z.literal('0'),
    }).strict(),
    generatedMediaDefaultAccess: z.literal('public_link_unless_acl_overridden'),
    requiredOutputAcl: z.literal('default_forbid_owner_only'),
    requiredInputUploadAcl: z.literal('default_forbid_owner_only_set_on_upload'),
    requiredObjectExpirationSeconds: z.literal(3600),
    immediatePrivateIngestRequired: z.literal(true),
    apiTermsTrainingRule: z.literal('client_content_not_used_to_train_except_excluded_models'),
    routeEnterpriseReadinessDesignation: z.literal('not_published_on_model_page'),
    restrictedCustomerDataAllowed: z.literal(false),
    syntheticNoncommercialPreflightOnly: z.literal(true),
  }).strict(),
  pricing: z.object({
    billingUnit: z.literal('successful_output_second'),
    listedProviderCostMicrosPerSecond: z.literal(1_000),
    maximumListedProviderCostMicrosForThirtySeconds: z.literal(30_000),
    currency: z.literal('USD'),
    successfulOutputsOnly: z.literal(true),
    queueWaitBilled: z.literal(false),
    serverErrorsBilled: z.literal(false),
    prepaidAccountRequired: z.literal(true),
    accountAccessFundsAndQuotaVerified: z.literal(false),
    immutableExecutionRateCardCreated: z.literal(false),
    customerPriceIncluded: z.literal(false),
    customerCreditsIncluded: z.literal(false),
    serviceFeeIncluded: z.literal(false),
    walletOrBillingMutationAllowed: z.literal(false),
  }).strict(),
  capabilitySnapshot: motionStudioSynchronizedFoleyCapabilitySnapshotV1Schema,
  discoveryDisposition: z.literal('eligible_for_bounded_synthetic_preflight'),
  canonicalExecutionDisposition: z.literal('route_closed'),
  blockingGates: z.tuple([
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
  sources: z.array(sourceSchema).length(8).readonly(),
  documentationSourceCount: z.literal(8),
  providerApiRequestCount: z.literal(0),
  credentialReadCount: z.literal(0),
  uploadCount: z.literal(0),
  generationRequestCount: z.literal(0),
  mediaBytesCreated: z.literal(0),
  internalProductionCostMicros: z.literal(0),
  rawProviderPayloadPersisted: z.literal(false),
  externalProviderTransportAuthorized: z.literal(false),
  providerExecutionAllowed: z.literal(false),
  immutable: z.literal(true),
  evidenceDigest: digest,
}).strict()

export type MotionStudioSynchronizedFoleyRouteReassessmentV1 =
  z.infer<typeof reassessmentSchema>

export const motionStudioSynchronizedFoleyRouteReassessmentV1Schema = reassessmentSchema

export interface MotionStudioSynchronizedFoleyRouteReassessmentScope {
  workspaceId: string
  projectId: string
  editSessionId: string
  productionId: string
}

export function createMotionStudioSynchronizedFoleyRouteReassessment(
  scope: MotionStudioSynchronizedFoleyRouteReassessmentScope,
): MotionStudioSynchronizedFoleyRouteReassessmentV1 {
  const sources = [
    source({
      sourceCode: 'fal_mmaudio_v2_api_2026_07_19',
      ownerCode: 'fal_ai',
      authorityClass: 'official_model_api',
      url: 'https://fal.ai/models/fal-ai/mmaudio-v2/api',
      claimCodes: [
        'model_id_fal_ai_mmaudio_v2', 'video_conditioned_synchronized_audio',
        'queue_status_and_result_contract', 'input_schema_and_duration_1_to_30_seconds',
        'mp4_video_output_with_application_octet_stream', 'backend_api_key_required',
      ],
    }),
    source({
      sourceCode: 'fal_mmaudio_v2_model_page_2026_07_19',
      ownerCode: 'fal_ai',
      authorityClass: 'official_model_api',
      url: 'https://fal.ai/models/fal-ai/mmaudio-v2',
      claimCodes: [
        'commercial_use_claim', 'listed_price_1000_usd_micros_per_second',
        'output_mp4_with_synchronized_audio', 'supported_input_formats',
        'duration_1_to_30_seconds',
      ],
    }),
    source({
      sourceCode: 'fal_async_queue_2026_07_19',
      ownerCode: 'fal_ai',
      authorityClass: 'official_platform_documentation',
      url: 'https://fal.ai/docs/documentation/model-apis/inference/queue',
      claimCodes: [
        'queue_submit_status_result_cancel', 'request_id_and_operation_urls',
        'default_retry_up_to_10', 'x_fal_no_retry_header_value_1',
        'queued_cancel_immediate_in_progress_cancel_best_effort',
      ],
    }),
    source({
      sourceCode: 'fal_reliability_2026_07_19',
      ownerCode: 'fal_ai',
      authorityClass: 'official_platform_documentation',
      url: 'https://fal.ai/docs/documentation/model-apis/inference/reliability',
      claimCodes: [
        'queue_retries_and_model_fallbacks_default_enabled',
        'x_fal_no_retry_available', 'x_app_fal_disable_fallback_available',
        'direct_sync_requests_no_automatic_retry', 'five_xx_failures_not_billed',
      ],
    }),
    source({
      sourceCode: 'fal_data_retention_2026_07_19',
      ownerCode: 'fal_ai',
      authorityClass: 'official_platform_documentation',
      url: 'https://fal.ai/docs/documentation/model-apis/media-expiration',
      claimCodes: [
        'request_payload_default_30_days', 'x_fal_store_io_zero_opt_out',
        'media_expiration_per_request', 'input_and_output_media_share_retention_controls',
        'expired_media_permanently_deleted',
      ],
    }),
    source({
      sourceCode: 'fal_file_access_controls_2026_07_19',
      ownerCode: 'fal_ai',
      authorityClass: 'official_platform_documentation',
      url: 'https://fal.ai/docs/documentation/model-apis/file-access-controls',
      claimCodes: [
        'cdn_default_public', 'output_acl_per_inference_request',
        'input_upload_acl_must_be_set_separately', 'default_forbid_owner_only_pattern',
        'acl_and_expiration_can_be_combined',
      ],
    }),
    source({
      sourceCode: 'fal_api_services_terms_2026_07_19',
      ownerCode: 'fal_ai',
      authorityClass: 'official_legal_terms',
      url: 'https://fal.ai/legal/api-services',
      claimCodes: [
        'client_content_not_used_for_training_except_excluded_models',
        'excluded_model_designation_controls_security_and_dpa_application',
        'third_party_api_models_transfer_client_content',
      ],
    }),
    source({
      sourceCode: 'mmaudio_upstream_repository_2026_07_19',
      ownerCode: 'hkchengrex_mmaudio',
      authorityClass: 'official_upstream_project',
      url: 'https://github.com/hkchengrex/MMAudio',
      claimCodes: [
        'no_affiliation_or_knowledge_of_mmaudio_net',
        'upstream_code_mit', 'checkpoints_cc_by_nc_4_0',
        'commercial_suitability_not_guaranteed', 'known_generation_limitations',
      ],
    }),
  ] as const
  const capabilitySnapshot = officialFalFoleyCapabilitySnapshot(scope, sources)
  const base = {
    schemaVersion: MOTION_STUDIO_SYNCHRONIZED_FOLEY_ROUTE_REASSESSMENT_SCHEMA_VERSION,
    reassessmentId: `ms012d2r-fal-mmaudio-${capabilitySnapshot.evidenceDigest.slice(0, 16)}`,
    ...scope,
    capturedAt: CAPTURED_AT,
    expiresAt: EXPIRES_AT,
    historicalD2: {
      discoveryRecordDigest: HISTORICAL_D2_DISCOVERY_DIGEST,
      capabilitySnapshotDigest: HISTORICAL_D2_CAPABILITY_DIGEST,
      configuredRouteId: 'mmaudio' as const,
      providerOwnerCode: 'mmaudio_net' as const,
      disposition: 'preserved_route_closed' as const,
      immutableHistoryPreserved: true as const,
      mayExecute: false as const,
      reason: 'upstream_project_disclaims_affiliation_and_exact_provider_contract_remains_unverified' as const,
    },
    candidateRoute: {
      configuredRouteId: 'mmaudio' as const,
      providerOwnerCode: 'fal_ai' as const,
      serviceCode: 'fal_model_apis' as const,
      providerRouteId: 'fal_ai_mmaudio_v2' as const,
      modelId: 'fal-ai/mmaudio-v2' as const,
      immutableModelRevision: null,
      lifecycle: 'current_gallery_route_available_version_not_pinned' as const,
      endpoint: 'https://queue.fal.run/fal-ai/mmaudio-v2' as const,
      method: 'POST' as const,
      authentication: 'authorization_key_backend_only' as const,
      providerCommercialUseClaim: 'commercial_use_permitted' as const,
      upstreamCheckpointLicense: 'cc_by_nc_4_0' as const,
      upstreamCommercialSuitability: 'not_guaranteed' as const,
      commercialRightsStatus: 'conflicting_provider_and_upstream_evidence_requires_review' as const,
    },
    behavior: {
      requestLifecycle: 'asynchronous_queue_submit_status_result' as const,
      acceptedVideoDurationSeconds: [1, 30] as const,
      inputVideoFormats: ['mp4', 'mov', 'webm', 'm4v', 'gif'] as const,
      promptControls: [
        'video_url', 'prompt', 'negative_prompt', 'seed', 'num_steps',
        'duration', 'cfg_strength', 'mask_away_clip',
      ] as const,
      queueStates: ['IN_QUEUE', 'IN_PROGRESS', 'COMPLETED'] as const,
      statusSupported: true as const,
      resultRetrievalSupported: true as const,
      cancellation: 'queued_immediate_in_progress_best_effort_may_complete' as const,
    },
    reliabilityPolicy: {
      providerDefaultRetryMaximum: 10 as const,
      providerDefaultFallbackEnabled: true as const,
      requiredNoRetryHeader: { name: 'X-Fal-No-Retry' as const, value: '1' as const },
      requiredNoFallbackHeader: {
        name: 'x-app-fal-disable-fallback' as const,
        value: 'true' as const,
        runtimeConfirmationRequired: true as const,
      },
      automaticRetryAllowedByMotionStudio: false as const,
      automaticFallbackAllowedByMotionStudio: false as const,
      unknownOutcomeRequiresReconciliation: true as const,
    },
    outputContract: {
      providerOutputKind: 'mp4_video_with_synchronized_audio' as const,
      responseContentType: 'application/octet-stream' as const,
      exactAudioCodec: 'unknown_until_private_probe' as const,
      exactSampleRateHertz: 'unknown_until_private_probe' as const,
      exactChannelCount: 'unknown_until_private_probe' as const,
      canonicalAudioOutputRequired: 'wav_pcm_s16le_48000hz_stereo' as const,
      privateProbeExtractionAndNormalizationRequired: true as const,
      providerUrlMayBecomeDurableProjectReference: false as const,
    },
    dataPolicy: {
      requestPayloadDefaultRetentionDays: 30 as const,
      requestPayloadStorageOptOutHeader: { name: 'X-Fal-Store-IO' as const, value: '0' as const },
      generatedMediaDefaultAccess: 'public_link_unless_acl_overridden' as const,
      requiredOutputAcl: 'default_forbid_owner_only' as const,
      requiredInputUploadAcl: 'default_forbid_owner_only_set_on_upload' as const,
      requiredObjectExpirationSeconds: 3600 as const,
      immediatePrivateIngestRequired: true as const,
      apiTermsTrainingRule: 'client_content_not_used_to_train_except_excluded_models' as const,
      routeEnterpriseReadinessDesignation: 'not_published_on_model_page' as const,
      restrictedCustomerDataAllowed: false as const,
      syntheticNoncommercialPreflightOnly: true as const,
    },
    pricing: {
      billingUnit: 'successful_output_second' as const,
      listedProviderCostMicrosPerSecond: 1_000 as const,
      maximumListedProviderCostMicrosForThirtySeconds: 30_000 as const,
      currency: 'USD' as const,
      successfulOutputsOnly: true as const,
      queueWaitBilled: false as const,
      serverErrorsBilled: false as const,
      prepaidAccountRequired: true as const,
      accountAccessFundsAndQuotaVerified: false as const,
      immutableExecutionRateCardCreated: false as const,
      customerPriceIncluded: false as const,
      customerCreditsIncluded: false as const,
      serviceFeeIncluded: false as const,
      walletOrBillingMutationAllowed: false as const,
    },
    capabilitySnapshot,
    discoveryDisposition: 'eligible_for_bounded_synthetic_preflight' as const,
    canonicalExecutionDisposition: 'route_closed' as const,
    blockingGates: [
      'immutable_model_revision_not_published',
      'exact_output_audio_codec_sample_rate_and_channels_require_private_probe',
      'enterprise_ready_or_excluded_model_designation_not_published',
      'commercial_rights_conflict_requires_provider_or_legal_attestation',
      'account_access_prepaid_funds_quota_and_rate_card_not_verified',
      'canonical_provider_dispatch_lease_single_use_and_cost_runtime_absent',
      'private_acl_expiration_ingest_and_cleanup_runtime_not_proven',
      'no_retry_no_fallback_and_unknown_outcome_runtime_not_proven',
      'actual_candidate_semantic_rights_and_human_reviews_absent',
    ] as const,
    sources,
    documentationSourceCount: 8 as const,
    providerApiRequestCount: 0 as const,
    credentialReadCount: 0 as const,
    uploadCount: 0 as const,
    generationRequestCount: 0 as const,
    mediaBytesCreated: 0 as const,
    internalProductionCostMicros: 0 as const,
    rawProviderPayloadPersisted: false as const,
    externalProviderTransportAuthorized: false as const,
    providerExecutionAllowed: false as const,
    immutable: true as const,
  }
  return parseAndFreeze({ ...base, evidenceDigest: sha256CanonicalJson(base) }, reassessmentSchema)
}

export function assertMotionStudioSynchronizedFoleyRouteReassessment(
  input: MotionStudioSynchronizedFoleyRouteReassessmentV1,
): void {
  const record = reassessmentSchema.parse(input)
  if (Date.parse(record.expiresAt) <= Date.parse(record.capturedAt)) {
    throw blocked('Synchronized-Foley route reassessment expiry must follow capture time.')
  }
  if (record.documentationSourceCount !== record.sources.length ||
      new Set(record.sources.map((entry) => entry.sourceCode)).size !== record.sources.length) {
    throw blocked('Synchronized-Foley route reassessment requires unique complete source authority.')
  }
  for (const entry of record.sources) {
    const base = { ...entry } as Record<string, unknown>
    delete base.sourceAuthorityDigest
    if (sha256CanonicalJson(base) !== entry.sourceAuthorityDigest) {
      throw blocked(`Synchronized-Foley source ${entry.sourceCode} failed digest verification.`)
    }
  }
  const snapshotBase = { ...record.capabilitySnapshot } as Record<string, unknown>
  delete snapshotBase.evidenceDigest
  if (sha256CanonicalJson(snapshotBase) !== record.capabilitySnapshot.evidenceDigest ||
      !sameSet(record.capabilitySnapshot.discoveryAuthorityDigests,
        record.sources.map((entry) => entry.sourceAuthorityDigest)) ||
      !sameSet(record.capabilitySnapshot.evidenceSourceCodes,
        record.sources.map((entry) => entry.sourceCode))) {
    throw blocked('Synchronized-Foley route reassessment lost capability-source lineage.')
  }
  const recordBase = { ...record } as Record<string, unknown>
  delete recordBase.evidenceDigest
  if (sha256CanonicalJson(recordBase) !== record.evidenceDigest) {
    throw blocked('Synchronized-Foley route reassessment failed immutable digest verification.')
  }
  if (record.historicalD2.disposition !== 'preserved_route_closed' ||
      record.historicalD2.mayExecute) {
    throw blocked('Historical MMAudio.net evidence may not be rewritten or promoted by reassessment.')
  }
  if (record.discoveryDisposition !== 'eligible_for_bounded_synthetic_preflight' ||
      record.canonicalExecutionDisposition !== 'route_closed' ||
      record.blockingGates.length !== 9 || record.providerExecutionAllowed ||
      record.capabilitySnapshot.providerExecutionAllowed) {
    throw blocked('Fal MMAudio discovery may not become canonical execution authority.')
  }
  if (record.reliabilityPolicy.automaticRetryAllowedByMotionStudio ||
      record.reliabilityPolicy.automaticFallbackAllowedByMotionStudio ||
      record.reliabilityPolicy.requiredNoRetryHeader.value !== '1' ||
      !record.reliabilityPolicy.requiredNoFallbackHeader.runtimeConfirmationRequired) {
    throw blocked('Fal MMAudio candidate route lost no-retry or no-fallback protection.')
  }
  if (record.dataPolicy.restrictedCustomerDataAllowed ||
      !record.dataPolicy.syntheticNoncommercialPreflightOnly ||
      record.outputContract.providerUrlMayBecomeDurableProjectReference) {
    throw blocked('Fal MMAudio reassessment widened private-data or durable-provider-URL authority.')
  }
  if (record.pricing.maximumListedProviderCostMicrosForThirtySeconds !==
      record.pricing.listedProviderCostMicrosPerSecond * record.behavior.acceptedVideoDurationSeconds[1]) {
    throw blocked('Fal MMAudio public price evidence does not reconcile to the maximum supported duration.')
  }
  if (record.providerApiRequestCount !== 0 || record.credentialReadCount !== 0 ||
      record.uploadCount !== 0 || record.generationRequestCount !== 0 ||
      record.mediaBytesCreated !== 0 || record.internalProductionCostMicros !== 0 ||
      record.rawProviderPayloadPersisted || record.externalProviderTransportAuthorized) {
    throw blocked('Read-only synchronized-Foley reassessment crossed an external execution gate.')
  }
}

function officialFalFoleyCapabilitySnapshot(
  scope: MotionStudioSynchronizedFoleyRouteReassessmentScope,
  sources: readonly z.infer<typeof sourceSchema>[],
): MotionStudioSynchronizedFoleyCapabilitySnapshotV1 {
  const support: Record<MotionStudioSynchronizedFoleyCapabilityField, 'supported' | 'unsupported' | 'unknown'> = {
    video_conditioning: 'supported',
    text_prompt: 'supported',
    visible_event_grounding: 'supported',
    dialogue_suppression: 'supported',
    music_suppression: 'supported',
    exact_sound_suppression: 'supported',
    duration_control: 'supported',
    wav_output: 'unsupported',
    response_usage: 'unknown',
    asynchronous_status: 'supported',
    temporary_download: 'supported',
    cancellation: 'supported',
    retention_metadata: 'supported',
  }
  const base = {
    ...scope,
    schemaVersion: 'motion-studio.music-foley-capability-snapshot.v1' as const,
    capabilitySnapshotId: `ms012d2r-fal-mmaudio-capability-${sha256CanonicalJson({ scope, sources }).slice(0, 16)}`,
    intent: 'synchronized_foley_candidate' as const,
    configuredRouteId: 'mmaudio' as const,
    discoveryKind: 'official_read_only_discovery' as const,
    providerIdentityStatus: 'officially_verified' as const,
    lifecycleStatus: 'available' as const,
    discoveryAuthorityDigests: sources.map((entry) => entry.sourceAuthorityDigest),
    evidenceSourceCodes: sources.map((entry) => entry.sourceCode),
    fields: MOTION_STUDIO_SYNCHRONIZED_FOLEY_CAPABILITY_FIELDS.map((field) => ({
      field,
      support: support[field],
      evidenceCode: `official_fal_mmaudio_v2_${field}_${support[field]}`,
    })),
    capturedAt: CAPTURED_AT,
    expiresAt: EXPIRES_AT,
    externalDiscoveryPerformed: true,
    externalTransportAllowed: false as const,
    providerExecutionAllowed: false as const,
    immutable: true as const,
  }
  return motionStudioSynchronizedFoleyCapabilitySnapshotV1Schema.parse({
    ...base,
    evidenceDigest: sha256CanonicalJson(base),
  }) as MotionStudioSynchronizedFoleyCapabilitySnapshotV1
}

function source(input: {
  sourceCode: string
  ownerCode: string
  authorityClass: z.infer<typeof sourceSchema>['authorityClass']
  url: string
  claimCodes: readonly string[]
}): z.infer<typeof sourceSchema> {
  const base = { ...input, capturedAt: CAPTURED_AT }
  return sourceSchema.parse({ ...base, sourceAuthorityDigest: sha256CanonicalJson(base) })
}

function parseAndFreeze<T>(input: unknown, schema: z.ZodType<T>): T {
  const parsed = schema.parse(input)
  return deepFreeze(parsed)
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child)
    Object.freeze(value)
  }
  return value
}

function sameSet(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value) => right.includes(value))
}

function blocked(message: string): ApiError {
  return new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', message, 409)
}
