import { z } from 'zod'

import type {
  MotionStudioGeneratedMusicCapabilityField,
  MotionStudioGeneratedMusicCapabilitySnapshotV1,
  MotionStudioSynchronizedFoleyCapabilityField,
  MotionStudioSynchronizedFoleyCapabilitySnapshotV1,
} from '../../../src/types/motion-studio'
import {
  MOTION_STUDIO_GENERATED_MUSIC_CAPABILITY_FIELDS,
  MOTION_STUDIO_SYNCHRONIZED_FOLEY_CAPABILITY_FIELDS,
  motionStudioGeneratedMusicCapabilitySnapshotV1Schema,
  motionStudioSynchronizedFoleyCapabilitySnapshotV1Schema,
} from '../../../src/lib/motion-studio/contracts'
import { ApiError } from '../../errors/api-error'
import { sha256CanonicalJson } from '../commands/canonical-json'

export const MOTION_STUDIO_MUSIC_FOLEY_OFFICIAL_DISCOVERY_SCHEMA_VERSION =
  'motion-studio.music-foley-official-discovery.v1' as const

const CAPTURED_AT = '2026-07-18T18:00:00.000Z'
const EXPIRES_AT = '2026-07-25T18:00:00.000Z'
const stableId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => !value.includes('..'))
const digest = z.string().regex(/^[a-f0-9]{64}$/)
const isoDate = z.string().datetime({ offset: true })

const sourceSchema = z.object({
  sourceCode: stableId,
  ownerCode: stableId,
  authorityClass: z.enum([
    'official_documentation',
    'official_pricing',
    'official_policy',
    'provider_maintained_source',
    'official_unavailable_documentation_path',
  ]),
  url: z.string().url(),
  lastUpdatedOn: z.string().regex(/^\d{4}-\d{2}(?:-\d{2})?$/).optional(),
  capturedAt: isoDate,
  claimCodes: z.array(stableId).min(1).max(32).readonly(),
  sourceAuthorityDigest: digest,
}).strict()

const commonRecord = {
  schemaVersion: z.literal(MOTION_STUDIO_MUSIC_FOLEY_OFFICIAL_DISCOVERY_SCHEMA_VERSION),
  discoveryId: stableId,
  capturedAt: isoDate,
  expiresAt: isoDate,
  sources: z.array(sourceSchema).min(1).max(16).readonly(),
  documentationSourceCount: z.number().int().positive().max(16),
  providerApiRequestCount: z.literal(0),
  credentialReadCount: z.literal(0),
  uploadCount: z.literal(0),
  generationRequestCount: z.literal(0),
  mediaBytesCreated: z.literal(0),
  internalProductionCostMicros: z.literal(0),
  rawProviderPayloadPersisted: z.literal(false),
  externalProviderTransportAuthorized: z.literal(false),
  immutable: z.literal(true),
  evidenceDigest: digest,
} as const

const lyriaDiscoverySchema = z.object({
  ...commonRecord,
  intent: z.literal('generated_music_candidate'),
  configuredRouteId: z.literal('lyria_3_pro'),
  provider: z.object({
    ownerCode: z.literal('google'),
    serviceCode: z.literal('gemini_developer_api'),
    modelId: z.literal('lyria-3-pro-preview'),
    lifecycle: z.literal('preview_available'),
    endpoint: z.literal('https://generativelanguage.googleapis.com/v1beta/interactions'),
    method: z.literal('POST'),
    authentication: z.literal('x_goog_api_key_backend_only'),
  }).strict(),
  behavior: z.object({
    requestLifecycle: z.literal('single_turn_synchronous_inline_audio'),
    inputModalities: z.tuple([z.literal('text'), z.literal('image')]).readonly(),
    maximumImageInputs: z.literal(10),
    outputFormats: z.tuple([z.literal('mp3'), z.literal('wav')]).readonly(),
    durationControl: z.literal('prompt_or_timestamp_influenced_not_exact'),
    sampleRateAuthority: z.literal('conflicting_official_44_1khz_and_48khz_claims'),
    deterministicSeed: z.literal(false),
    multiTurnEditing: z.literal(false),
    synthIdWatermarked: z.literal(true),
  }).strict(),
  pricing: z.object({
    billingUnit: z.literal('request'),
    listedProviderCostMicros: z.literal(80_000),
    currency: z.literal('USD'),
    failedAttemptBilling: z.literal('not_documented'),
    accountSpecificRateRequired: z.literal(false),
  }).strict(),
  dataPolicy: z.object({
    paidTierUsedToImproveProducts: z.literal(false),
    defaultInteractionRetentionDays: z.literal(55),
    statelessStoreFalseSupported: z.literal(true),
    backgroundCompatibleWithStoreFalse: z.literal(false),
  }).strict(),
  executionDisposition: z.literal('eligible_for_bounded_preflight'),
  blockingUnknowns: z.tuple([
    z.literal('failed_attempt_billing_not_documented'),
    z.literal('exact_output_sample_rate_conflicts_across_official_pages'),
    z.literal('model_is_preview_and_requires_expiry_revalidation'),
  ]).readonly(),
  capabilitySnapshot: motionStudioGeneratedMusicCapabilitySnapshotV1Schema,
}).strict()

const mmaudioDiscoverySchema = z.object({
  ...commonRecord,
  intent: z.literal('synchronized_foley_candidate'),
  configuredRouteId: z.literal('mmaudio'),
  provider: z.object({
    ownerCode: z.literal('mmaudio_net'),
    serviceCode: z.literal('video_to_audio_api'),
    modelId: z.null(),
    lifecycle: z.literal('public_route_present_exact_contract_unverified'),
    endpoint: z.literal('https://mmaudio.net/api/video-to-audio'),
    method: z.literal('POST'),
    authentication: z.literal('bearer_api_key_backend_only'),
    publicDocumentationStatus: z.literal('documentation_path_unavailable'),
  }).strict(),
  behavior: z.object({
    requestLifecycle: z.literal('provider_client_awaits_url_response_status_contract_unknown'),
    inputVideoReference: z.literal('private_server_owned_url_required'),
    acceptedVideoDurationSeconds: z.tuple([z.literal(1), z.literal(30)]).readonly(),
    promptControls: z.tuple([
      z.literal('prompt'),
      z.literal('negative_prompt'),
      z.literal('duration'),
      z.literal('num_steps'),
      z.literal('cfg_strength'),
      z.literal('seed'),
    ]).readonly(),
    outputFormat: z.literal('url_with_content_type_filename_and_size_exact_audio_format_unknown'),
    temporaryUrlLifetime: z.literal('limited_time_duration_not_documented'),
  }).strict(),
  pricing: z.object({
    billingUnit: z.literal('provider_credit'),
    creditsPerVideoToAudioRequest: z.literal(1),
    listedProviderCostRangeMicros: z.tuple([z.literal(21_000), z.literal(28_000)]).readonly(),
    currency: z.literal('USD'),
    failedAttemptBilling: z.literal('not_documented'),
    accountSpecificRateRequired: z.literal(true),
  }).strict(),
  dataPolicy: z.object({
    uploadedVideoDeletion: z.literal('after_processing_unless_otherwise_specified'),
    generatedAudioRetention: z.literal('limited_time_duration_not_documented'),
    usageDataRetention: z.literal('retained_for_analytics_duration_not_documented'),
    internationalProcessingPossible: z.literal(true),
    trainingUse: z.literal('not_documented'),
  }).strict(),
  executionDisposition: z.literal('route_closed'),
  blockingUnknowns: z.tuple([
    z.literal('exact_model_and_version_not_documented'),
    z.literal('official_api_documentation_unavailable'),
    z.literal('output_codec_sample_rate_and_channels_unknown'),
    z.literal('temporary_output_url_lifetime_unknown'),
    z.literal('retention_duration_and_training_use_unknown'),
    z.literal('status_cancellation_and_failed_attempt_billing_unknown'),
    z.literal('account_specific_rate_card_not_frozen'),
  ]).readonly(),
  capabilitySnapshot: motionStudioSynchronizedFoleyCapabilitySnapshotV1Schema,
}).strict()

export const motionStudioMusicFoleyOfficialDiscoveryRecordV1Schema = z.discriminatedUnion('intent', [
  lyriaDiscoverySchema,
  mmaudioDiscoverySchema,
])

export type MotionStudioMusicFoleyOfficialDiscoveryRecordV1 =
  z.infer<typeof motionStudioMusicFoleyOfficialDiscoveryRecordV1Schema>
export type MotionStudioLyriaOfficialDiscoveryRecordV1 = z.infer<typeof lyriaDiscoverySchema>
export type MotionStudioMmaudioOfficialDiscoveryRecordV1 = z.infer<typeof mmaudioDiscoverySchema>

interface OfficialDiscoveryScope {
  workspaceId: string
  projectId: string
  editSessionId: string
  productionId: string
}

export function createMotionStudioLyriaOfficialDiscoveryEvidence(
  scope: OfficialDiscoveryScope,
): MotionStudioLyriaOfficialDiscoveryRecordV1 {
  const sources = [
    source({
      sourceCode: 'google_lyria3_music_guide_2026_07_16',
      ownerCode: 'google',
      authorityClass: 'official_documentation',
      url: 'https://ai.google.dev/gemini-api/docs/music-generation?hl=en',
      lastUpdatedOn: '2026-07-16',
      claimCodes: [
        'model_lyria_3_pro_preview', 'interactions_post_endpoint', 'text_and_image_input',
        'wav_output_for_pro', 'instrumental_prompting', 'timestamp_duration_influence',
        'single_turn_only', 'nondeterministic', 'synthid_watermark', 'artist_and_lyrics_safety_filter',
      ],
    }),
    source({
      sourceCode: 'google_gemini_api_pricing_2026_07_18',
      ownerCode: 'google',
      authorityClass: 'official_pricing',
      url: 'https://ai.google.dev/gemini-api/docs/pricing',
      claimCodes: [
        'lyria_3_pro_preview_80000_usd_micros_per_request',
        'paid_tier_not_used_to_improve_products', 'preview_rate_limits_more_restrictive',
      ],
    }),
    source({
      sourceCode: 'google_interactions_overview_2026_07_16',
      ownerCode: 'google',
      authorityClass: 'official_documentation',
      url: 'https://ai.google.dev/gemini-api/docs/interactions-overview',
      lastUpdatedOn: '2026-07-16',
      claimCodes: [
        'lyria_3_pro_supported', 'store_true_default', 'paid_retention_55_days',
        'store_false_supported', 'store_false_incompatible_with_background',
      ],
    }),
    source({
      sourceCode: 'google_lyria3_pro_model_page_2026_06_23',
      ownerCode: 'google',
      authorityClass: 'official_documentation',
      url: 'https://ai.google.dev/gemini-api/docs/models/lyria-3-pro-preview',
      lastUpdatedOn: '2026-06-23',
      claimCodes: [
        'model_page_claims_48khz_stereo', 'music_guide_claims_44_1khz_stereo',
        'sample_rate_conflict_requires_output_probe_and_normalization',
      ],
    }),
  ] as const
  const capabilitySnapshot = officialMusicCapabilitySnapshot(scope, sources)
  const base = {
    schemaVersion: MOTION_STUDIO_MUSIC_FOLEY_OFFICIAL_DISCOVERY_SCHEMA_VERSION,
    discoveryId: `ms012d1-lyria-${capabilitySnapshot.evidenceDigest.slice(0, 16)}`,
    intent: 'generated_music_candidate' as const,
    configuredRouteId: 'lyria_3_pro' as const,
    capturedAt: CAPTURED_AT,
    expiresAt: EXPIRES_AT,
    sources,
    documentationSourceCount: sources.length,
    providerApiRequestCount: 0 as const,
    credentialReadCount: 0 as const,
    uploadCount: 0 as const,
    generationRequestCount: 0 as const,
    mediaBytesCreated: 0 as const,
    internalProductionCostMicros: 0 as const,
    rawProviderPayloadPersisted: false as const,
    externalProviderTransportAuthorized: false as const,
    provider: {
      ownerCode: 'google' as const,
      serviceCode: 'gemini_developer_api' as const,
      modelId: 'lyria-3-pro-preview' as const,
      lifecycle: 'preview_available' as const,
      endpoint: 'https://generativelanguage.googleapis.com/v1beta/interactions' as const,
      method: 'POST' as const,
      authentication: 'x_goog_api_key_backend_only' as const,
    },
    behavior: {
      requestLifecycle: 'single_turn_synchronous_inline_audio' as const,
      inputModalities: ['text', 'image'] as const,
      maximumImageInputs: 10 as const,
      outputFormats: ['mp3', 'wav'] as const,
      durationControl: 'prompt_or_timestamp_influenced_not_exact' as const,
      sampleRateAuthority: 'conflicting_official_44_1khz_and_48khz_claims' as const,
      deterministicSeed: false as const,
      multiTurnEditing: false as const,
      synthIdWatermarked: true as const,
    },
    pricing: {
      billingUnit: 'request' as const,
      listedProviderCostMicros: 80_000 as const,
      currency: 'USD' as const,
      failedAttemptBilling: 'not_documented' as const,
      accountSpecificRateRequired: false as const,
    },
    dataPolicy: {
      paidTierUsedToImproveProducts: false as const,
      defaultInteractionRetentionDays: 55 as const,
      statelessStoreFalseSupported: true as const,
      backgroundCompatibleWithStoreFalse: false as const,
    },
    executionDisposition: 'eligible_for_bounded_preflight' as const,
    blockingUnknowns: [
      'failed_attempt_billing_not_documented',
      'exact_output_sample_rate_conflicts_across_official_pages',
      'model_is_preview_and_requires_expiry_revalidation',
    ] as const,
    capabilitySnapshot,
    immutable: true as const,
  }
  return parseAndFreeze({ ...base, evidenceDigest: sha256CanonicalJson(base) }, lyriaDiscoverySchema)
}

export function createMotionStudioMmaudioOfficialDiscoveryEvidence(
  scope: OfficialDiscoveryScope,
): MotionStudioMmaudioOfficialDiscoveryRecordV1 {
  const sources = [
    source({
      sourceCode: 'mmaudio_provider_site_2026_07_18',
      ownerCode: 'mmaudio_net',
      authorityClass: 'official_documentation',
      url: 'https://mmaudio.net/',
      claimCodes: [
        'video_conditioned_audio_generation', 'prompt_and_negative_prompt_ui',
        'one_credit_video_to_audio', 'default_duration_8_seconds',
      ],
    }),
    source({
      sourceCode: 'mmaudio_provider_mcp_source_main_2026_07_18',
      ownerCode: 'mmaudio_net',
      authorityClass: 'provider_maintained_source',
      url: 'https://github.com/mmaudio/mmaudio-mcp/blob/main/server/index.js',
      claimCodes: [
        'bearer_auth', 'post_api_video_to_audio', 'duration_1_to_30_seconds',
        'prompt_negative_prompt_seed_steps_cfg', 'url_content_type_filename_size_response',
        'synchronous_client_wait', 'http_401_403_429_handling',
      ],
    }),
    source({
      sourceCode: 'mmaudio_pricing_2026_07_18',
      ownerCode: 'mmaudio_net',
      authorityClass: 'official_pricing',
      url: 'https://mmaudio.net/pricing',
      claimCodes: [
        'video_to_audio_one_credit', 'listed_credit_cost_21000_to_28000_usd_micros',
        'api_key_management_requires_paid_plan',
      ],
    }),
    source({
      sourceCode: 'mmaudio_privacy_2024_12',
      ownerCode: 'mmaudio_net',
      authorityClass: 'official_policy',
      url: 'https://mmaudio.net/privacy',
      lastUpdatedOn: '2024-12',
      claimCodes: [
        'uploaded_video_deleted_after_processing_unless_specified',
        'generated_audio_available_limited_time', 'usage_data_retained_for_analytics',
        'international_processing_possible',
      ],
    }),
    source({
      sourceCode: 'mmaudio_docs_unavailable_2026_07_18',
      ownerCode: 'mmaudio_net',
      authorityClass: 'official_unavailable_documentation_path',
      url: 'https://mmaudio.net/docs',
      claimCodes: ['public_api_documentation_path_returned_not_found'],
    }),
  ] as const
  const capabilitySnapshot = officialFoleyCapabilitySnapshot(scope, sources)
  const base = {
    schemaVersion: MOTION_STUDIO_MUSIC_FOLEY_OFFICIAL_DISCOVERY_SCHEMA_VERSION,
    discoveryId: `ms012d2-mmaudio-${capabilitySnapshot.evidenceDigest.slice(0, 16)}`,
    intent: 'synchronized_foley_candidate' as const,
    configuredRouteId: 'mmaudio' as const,
    capturedAt: CAPTURED_AT,
    expiresAt: EXPIRES_AT,
    sources,
    documentationSourceCount: sources.length,
    providerApiRequestCount: 0 as const,
    credentialReadCount: 0 as const,
    uploadCount: 0 as const,
    generationRequestCount: 0 as const,
    mediaBytesCreated: 0 as const,
    internalProductionCostMicros: 0 as const,
    rawProviderPayloadPersisted: false as const,
    externalProviderTransportAuthorized: false as const,
    provider: {
      ownerCode: 'mmaudio_net' as const,
      serviceCode: 'video_to_audio_api' as const,
      modelId: null,
      lifecycle: 'public_route_present_exact_contract_unverified' as const,
      endpoint: 'https://mmaudio.net/api/video-to-audio' as const,
      method: 'POST' as const,
      authentication: 'bearer_api_key_backend_only' as const,
      publicDocumentationStatus: 'documentation_path_unavailable' as const,
    },
    behavior: {
      requestLifecycle: 'provider_client_awaits_url_response_status_contract_unknown' as const,
      inputVideoReference: 'private_server_owned_url_required' as const,
      acceptedVideoDurationSeconds: [1, 30] as const,
      promptControls: ['prompt', 'negative_prompt', 'duration', 'num_steps', 'cfg_strength', 'seed'] as const,
      outputFormat: 'url_with_content_type_filename_and_size_exact_audio_format_unknown' as const,
      temporaryUrlLifetime: 'limited_time_duration_not_documented' as const,
    },
    pricing: {
      billingUnit: 'provider_credit' as const,
      creditsPerVideoToAudioRequest: 1 as const,
      listedProviderCostRangeMicros: [21_000, 28_000] as const,
      currency: 'USD' as const,
      failedAttemptBilling: 'not_documented' as const,
      accountSpecificRateRequired: true as const,
    },
    dataPolicy: {
      uploadedVideoDeletion: 'after_processing_unless_otherwise_specified' as const,
      generatedAudioRetention: 'limited_time_duration_not_documented' as const,
      usageDataRetention: 'retained_for_analytics_duration_not_documented' as const,
      internationalProcessingPossible: true as const,
      trainingUse: 'not_documented' as const,
    },
    executionDisposition: 'route_closed' as const,
    blockingUnknowns: [
      'exact_model_and_version_not_documented',
      'official_api_documentation_unavailable',
      'output_codec_sample_rate_and_channels_unknown',
      'temporary_output_url_lifetime_unknown',
      'retention_duration_and_training_use_unknown',
      'status_cancellation_and_failed_attempt_billing_unknown',
      'account_specific_rate_card_not_frozen',
    ] as const,
    capabilitySnapshot,
    immutable: true as const,
  }
  return parseAndFreeze({ ...base, evidenceDigest: sha256CanonicalJson(base) }, mmaudioDiscoverySchema)
}

export function assertMotionStudioMusicFoleyOfficialDiscoveryEvidence(
  input: MotionStudioMusicFoleyOfficialDiscoveryRecordV1,
): void {
  const record = motionStudioMusicFoleyOfficialDiscoveryRecordV1Schema.parse(input)
  if (record.documentationSourceCount !== record.sources.length ||
      new Set(record.sources.map((sourceRecord) => sourceRecord.sourceCode)).size !== record.sources.length) {
    throw blocked('Official discovery must preserve one unique authority record per documentation source.')
  }
  for (const sourceRecord of record.sources) {
    const base = { ...sourceRecord } as Record<string, unknown>
    delete base.sourceAuthorityDigest
    if (sha256CanonicalJson(base) !== sourceRecord.sourceAuthorityDigest) {
      throw blocked(`Official discovery source authority ${sourceRecord.sourceCode} failed digest verification.`)
    }
  }
  const snapshotBase = { ...record.capabilitySnapshot } as Record<string, unknown>
  delete snapshotBase.evidenceDigest
  if (sha256CanonicalJson(snapshotBase) !== record.capabilitySnapshot.evidenceDigest ||
      !sameSet(record.capabilitySnapshot.discoveryAuthorityDigests, record.sources.map((source) => source.sourceAuthorityDigest)) ||
      !sameSet(record.capabilitySnapshot.evidenceSourceCodes, record.sources.map((source) => source.sourceCode))) {
    throw blocked('Official discovery capability snapshot lost exact source authority lineage.')
  }
  const recordBase = { ...record } as Record<string, unknown>
  delete recordBase.evidenceDigest
  if (sha256CanonicalJson(recordBase) !== record.evidenceDigest) {
    throw blocked('Official discovery record failed immutable digest verification.')
  }
  if (record.providerApiRequestCount !== 0 || record.credentialReadCount !== 0 ||
      record.uploadCount !== 0 || record.generationRequestCount !== 0 ||
      record.mediaBytesCreated !== 0 || record.internalProductionCostMicros !== 0 ||
      record.rawProviderPayloadPersisted || record.externalProviderTransportAuthorized) {
    throw blocked('Read-only capability discovery crossed a provider, credential, media, cost or transport gate.')
  }
  if (record.intent === 'synchronized_foley_candidate' &&
      (record.executionDisposition !== 'route_closed' || record.provider.modelId !== null ||
       record.blockingUnknowns.length < 1)) {
    throw blocked('MMAudio discovery must remain route-closed while its exact contract is unresolved.')
  }
}

function officialMusicCapabilitySnapshot(
  scope: OfficialDiscoveryScope,
  sources: readonly z.infer<typeof sourceSchema>[],
): MotionStudioGeneratedMusicCapabilitySnapshotV1 {
  const support: Record<MotionStudioGeneratedMusicCapabilityField, 'supported' | 'unsupported' | 'unknown'> = {
    text_prompt: 'supported',
    negative_instructions: 'supported',
    instrumental_only: 'supported',
    duration_control: 'supported',
    wav_output: 'supported',
    response_usage: 'unknown',
    seed_control: 'unsupported',
    reference_audio: 'unsupported',
    asynchronous_status: 'unknown',
    temporary_download: 'unsupported',
    cancellation: 'unknown',
    retention_metadata: 'supported',
  }
  const base = {
    ...scope,
    schemaVersion: 'motion-studio.music-foley-capability-snapshot.v1' as const,
    capabilitySnapshotId: `ms012d1-lyria-capability-${sha256CanonicalJson({ scope, sources }).slice(0, 16)}`,
    intent: 'generated_music_candidate' as const,
    configuredRouteId: 'lyria_3_pro' as const,
    discoveryKind: 'official_read_only_discovery' as const,
    providerIdentityStatus: 'officially_verified' as const,
    lifecycleStatus: 'available' as const,
    discoveryAuthorityDigests: sources.map((sourceRecord) => sourceRecord.sourceAuthorityDigest),
    evidenceSourceCodes: sources.map((sourceRecord) => sourceRecord.sourceCode),
    fields: MOTION_STUDIO_GENERATED_MUSIC_CAPABILITY_FIELDS.map((field) => ({
      field,
      support: support[field],
      evidenceCode: `official_lyria_${field}_${support[field]}`,
    })),
    capturedAt: CAPTURED_AT,
    expiresAt: EXPIRES_AT,
    externalDiscoveryPerformed: true,
    externalTransportAllowed: false as const,
    providerExecutionAllowed: false as const,
    immutable: true as const,
  }
  return motionStudioGeneratedMusicCapabilitySnapshotV1Schema.parse({
    ...base,
    evidenceDigest: sha256CanonicalJson(base),
  }) as MotionStudioGeneratedMusicCapabilitySnapshotV1
}

function officialFoleyCapabilitySnapshot(
  scope: OfficialDiscoveryScope,
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
    wav_output: 'unknown',
    response_usage: 'unknown',
    asynchronous_status: 'unknown',
    temporary_download: 'supported',
    cancellation: 'unknown',
    retention_metadata: 'unknown',
  }
  const base = {
    ...scope,
    schemaVersion: 'motion-studio.music-foley-capability-snapshot.v1' as const,
    capabilitySnapshotId: `ms012d2-mmaudio-capability-${sha256CanonicalJson({ scope, sources }).slice(0, 16)}`,
    intent: 'synchronized_foley_candidate' as const,
    configuredRouteId: 'mmaudio' as const,
    discoveryKind: 'official_read_only_discovery' as const,
    providerIdentityStatus: 'officially_verified' as const,
    lifecycleStatus: 'unknown' as const,
    discoveryAuthorityDigests: sources.map((sourceRecord) => sourceRecord.sourceAuthorityDigest),
    evidenceSourceCodes: sources.map((sourceRecord) => sourceRecord.sourceCode),
    fields: MOTION_STUDIO_SYNCHRONIZED_FOLEY_CAPABILITY_FIELDS.map((field) => ({
      field,
      support: support[field],
      evidenceCode: `official_mmaudio_${field}_${support[field]}`,
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
  lastUpdatedOn?: string
  claimCodes: readonly string[]
}): z.infer<typeof sourceSchema> {
  const base = {
    ...input,
    capturedAt: CAPTURED_AT,
  }
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
