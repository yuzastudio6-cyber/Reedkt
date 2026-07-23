import { z } from 'zod'

import { REEDITPRO_LIVE_GCP_RESOURCE_MAP } from '../../../src/backend/cloud/live-gcp-resource-map'
import { ApiError } from '../../errors/api-error'
import { sha256CanonicalJson } from '../commands/canonical-json'
import {
  assertMotionStudioLyriaD3PreflightPlan,
  MOTION_STUDIO_LYRIA_D3_PREFLIGHT_GATE_CODES,
  type MotionStudioLyriaD3PreflightGateCode,
  type MotionStudioLyriaD3PreflightPlanV1,
} from './lyria-d3-preflight'

export const MOTION_STUDIO_LYRIA_D3_SECRET_BINDING_SCHEMA_VERSION =
  'motion-studio.lyria-d3-secret-binding.v1' as const
export const MOTION_STUDIO_LYRIA_D3_CREDENTIAL_PRESENCE_SCHEMA_VERSION =
  'motion-studio.lyria-d3-credential-presence.v1' as const
export const MOTION_STUDIO_LYRIA_D3_MODEL_DATA_POLICY_SCHEMA_VERSION =
  'motion-studio.lyria-d3-model-data-policy.v1' as const
export const MOTION_STUDIO_LYRIA_D3_TRANSPORT_BUDGET_SCHEMA_VERSION =
  'motion-studio.lyria-d3-transport-budget.v1' as const
export const MOTION_STUDIO_LYRIA_D3_LOCAL_COMPUTE_RATE_CARD_SCHEMA_VERSION =
  'motion-studio.lyria-d3-local-compute-rate-card.v1' as const
export const MOTION_STUDIO_LYRIA_D3_READINESS_SCHEMA_VERSION =
  'motion-studio.lyria-d3-external-readiness.v1' as const

export const MOTION_STUDIO_LYRIA_D3_GOOGLE_CLOUD_PROJECT_ID =
  REEDITPRO_LIVE_GCP_RESOURCE_MAP.projectId
export const MOTION_STUDIO_LYRIA_D3_GOOGLE_CLOUD_PROJECT_NUMBER =
  REEDITPRO_LIVE_GCP_RESOURCE_MAP.projectNumber
export const MOTION_STUDIO_LYRIA_D3_SECRET_LOCATOR_ID =
  REEDITPRO_LIVE_GCP_RESOURCE_MAP.secretNames['reeditpro-prod-lyria-api-key']
export const MOTION_STUDIO_LYRIA_D3_SECRET_VERSION = '1' as const
export const MOTION_STUDIO_LYRIA_D3_GCLOUD_SDK_VERSION = '558.0.0' as const
export const MOTION_STUDIO_LYRIA_D3_GCLOUD_BINARY_PATH =
  '/usr/local/Caskroom/gcloud-cli/558.0.0/google-cloud-sdk/bin/gcloud' as const
export const MOTION_STUDIO_LYRIA_D3_GCLOUD_BINARY_BYTE_LENGTH = 5_837 as const
export const MOTION_STUDIO_LYRIA_D3_GCLOUD_BINARY_SHA256 =
  'd3e6e58223cb8266424f74d964403f5779c3a6b0c44325b96d89749eef717a96' as const
export const MOTION_STUDIO_LYRIA_D3_SECRET_RESOURCE_NAME =
  `projects/${MOTION_STUDIO_LYRIA_D3_GOOGLE_CLOUD_PROJECT_NUMBER}/secrets/${MOTION_STUDIO_LYRIA_D3_SECRET_LOCATOR_ID}/versions/${MOTION_STUDIO_LYRIA_D3_SECRET_VERSION}` as const

const digest = z.string().regex(/^[a-f0-9]{64}$/)
const stableId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => !value.includes('..'))
const isoDate = z.string().datetime({ offset: true })
const gateCodeSchema = z.enum(MOTION_STUDIO_LYRIA_D3_PREFLIGHT_GATE_CODES)

export const motionStudioLyriaD3SecretBindingV1Schema = z.object({
  schemaVersion: z.literal(MOTION_STUDIO_LYRIA_D3_SECRET_BINDING_SCHEMA_VERSION),
  bindingId: stableId,
  sourcePreflightPlanId: stableId,
  sourcePreflightDigest: digest,
  providerOwnerCode: z.literal('google'),
  configuredRouteId: z.literal('lyria_3_pro'),
  credentialHeaderName: z.literal('x-goog-api-key'),
  googleCloudProjectId: z.literal(MOTION_STUDIO_LYRIA_D3_GOOGLE_CLOUD_PROJECT_ID),
  secretLocatorId: z.literal(MOTION_STUDIO_LYRIA_D3_SECRET_LOCATOR_ID),
  secretVersionReference: z.literal(MOTION_STUDIO_LYRIA_D3_SECRET_VERSION),
  channel: z.literal('server_secret_reference'),
  payloadReadOnlyAfterSingleUseAuthority: z.literal(true),
  browserExposureAllowed: z.literal(false),
  persistenceInProjectAllowed: z.literal(false),
  loggingAllowed: z.literal(false),
  environmentFallbackAllowed: z.literal(false),
  callerSelectedSecretAllowed: z.literal(false),
  payloadAccessed: z.literal(false),
  immutable: z.literal(true),
  bindingDigest: digest,
}).strict()

export const motionStudioLyriaD3CredentialPresenceEvidenceV1Schema = z.object({
  schemaVersion: z.literal(MOTION_STUDIO_LYRIA_D3_CREDENTIAL_PRESENCE_SCHEMA_VERSION),
  evidenceId: stableId,
  sourcePreflightPlanId: stableId,
  sourcePreflightDigest: digest,
  secretBindingId: stableId,
  secretBindingDigest: digest,
  evidenceClass: z.literal('google_secret_manager_version_metadata'),
  secretResourceName: z.literal(MOTION_STUDIO_LYRIA_D3_SECRET_RESOURCE_NAME),
  versionState: z.literal('ENABLED'),
  versionCreateTime: isoDate,
  observedAt: isoDate,
  cloudSdkVersion: z.literal(MOTION_STUDIO_LYRIA_D3_GCLOUD_SDK_VERSION),
  resolvedExecutablePath: z.literal(MOTION_STUDIO_LYRIA_D3_GCLOUD_BINARY_PATH),
  executableByteLength: z.literal(MOTION_STUDIO_LYRIA_D3_GCLOUD_BINARY_BYTE_LENGTH),
  executableSha256: z.literal(MOTION_STUDIO_LYRIA_D3_GCLOUD_BINARY_SHA256),
  metadataRequestCount: z.literal(1),
  secretPayloadReadCount: z.literal(0),
  credentialValueCaptured: z.literal(false),
  providerRequestCount: z.literal(0),
  providerSubmissionCount: z.literal(0),
  immutable: z.literal(true),
  evidenceDigest: digest,
}).strict()

export const motionStudioLyriaD3ModelDataPolicyV1Schema = z.object({
  schemaVersion: z.literal(MOTION_STUDIO_LYRIA_D3_MODEL_DATA_POLICY_SCHEMA_VERSION),
  policyId: stableId,
  sourcePreflightPlanId: stableId,
  sourcePreflightDigest: digest,
  workspaceId: stableId,
  projectId: stableId,
  editSessionId: stableId,
  productionId: stableId,
  providerOwnerCode: z.literal('google'),
  providerServiceCode: z.literal('gemini_developer_api'),
  modelId: z.literal('lyria-3-pro-preview'),
  permittedDataClass: z.literal('synthetic_nonconfidential_instrumental_prompt_only'),
  productionUserContentAllowed: z.literal(false),
  personallyIdentifyingDataAllowed: z.literal(false),
  confidentialSourceMaterialAllowed: z.literal(false),
  likenessOrBiometricDataAllowed: z.literal(false),
  uploadedMediaAllowed: z.literal(false),
  promptStorageRequested: z.literal(false),
  interactionsStoreValue: z.literal(false),
  paidTierTrainingUsePolicy: z.literal('not_used_to_improve_google_products'),
  zeroRetentionClaimed: z.literal(false),
  providerOperationalLoggingClaimedAbsent: z.literal(false),
  processingRegion: z.literal('provider_managed_not_user_selected'),
  synthIdWatermarkExpected: z.literal(true),
  privateNoncommercialReviewOnly: z.literal(true),
  approvedAt: isoDate,
  expiresAt: isoDate,
  allowed: z.literal(true),
  immutable: z.literal(true),
  policyDigest: digest,
}).strict()

export const motionStudioLyriaD3TransportBudgetV1Schema = z.object({
  schemaVersion: z.literal(MOTION_STUDIO_LYRIA_D3_TRANSPORT_BUDGET_SCHEMA_VERSION),
  budgetId: stableId,
  sourcePreflightPlanId: stableId,
  sourcePreflightDigest: digest,
  maximumSecretPayloadReads: z.literal(1),
  maximumProviderSubmissions: z.literal(1),
  maximumNetworkRequests: z.literal(1),
  maximumAddressConnectionAttemptsPerRequest: z.literal(1),
  ipv4PreferredSingleAddressSelection: z.literal(true),
  addressFallbackAllowed: z.literal(false),
  proxyOrPacExecutionAllowed: z.literal(false),
  maximumRedirects: z.literal(0),
  maximumRetries: z.literal(0),
  maximumFallbacks: z.literal(0),
  maximumStatusRequests: z.literal(0),
  maximumDownloadRequests: z.literal(0),
  maximumRequestBodyBytes: z.literal(16_384),
  maximumCapturedResponseBytes: z.number().int().min(8_388_608).max(33_554_432),
  maximumConnectMilliseconds: z.literal(10_000),
  maximumElapsedMilliseconds: z.literal(120_000),
  unknownOutcomeRequiresReconciliation: z.literal(true),
  automaticResubmissionAllowed: z.literal(false),
  immutable: z.literal(true),
  budgetDigest: digest,
}).strict()

export const motionStudioLyriaD3LocalComputeRateCardV1Schema = z.object({
  schemaVersion: z.literal(MOTION_STUDIO_LYRIA_D3_LOCAL_COMPUTE_RATE_CARD_SCHEMA_VERSION),
  rateCardSnapshotId: stableId,
  sourcePreflightPlanId: stableId,
  sourcePreflightDigest: digest,
  toolId: z.literal('ffmpeg'),
  proposedOperationId: z.literal('tool.ffmpeg.normalize_storytelling_music_candidate.v1'),
  operationRegistrationState: z.literal('shared_registry_coordination_required'),
  currency: z.literal('USD'),
  unit: z.literal('cpu_second'),
  unitPriceUsdMicrosPerCpuSecond: z.literal(1_000),
  minimumChargeUsdMicros: z.literal(1_000),
  maximumAuthorizedCpuSeconds: z.literal(20),
  maximumAuthorizedLocalComputeCostMicros: z.literal(20_000),
  maximumAuthorizedProviderCostMicros: z.literal(80_000),
  maximumAuthorizedTotalInternalCostMicros: z.literal(100_000),
  roundingRule: z.literal('ceil_cpu_microsecond_usd_micro'),
  sourceEvidenceClass: z.literal('reeditpro_conservative_internal_cost_policy'),
  sourceEvidenceId: stableId,
  sourceEvidenceDigest: digest,
  effectiveFrom: isoDate,
  verifiedAt: isoDate,
  serviceFeeIncluded: z.literal(false),
  customerPricingIncluded: z.literal(false),
  customerCreditsIncluded: z.literal(false),
  customerBillingAllowed: z.literal(false),
  immutable: z.literal(true),
  rateCardDigest: digest,
}).strict()

const readinessGateSchema = z.object({
  gateCode: gateCodeSchema,
  state: z.enum(['passed_local', 'passed_external_read_only', 'external_evidence_required']),
  evidenceId: stableId,
  evidenceDigest: digest,
  explanation: z.string().trim().min(1).max(600),
}).strict()

export const motionStudioLyriaD3ExternalReadinessV1Schema = z.object({
  schemaVersion: z.literal(MOTION_STUDIO_LYRIA_D3_READINESS_SCHEMA_VERSION),
  readinessId: stableId,
  sourcePreflightPlanId: stableId,
  sourcePreflightDigest: digest,
  state: z.literal('external_preflight_partial_complete_execution_blocked'),
  createdAt: isoDate,
  expiresAt: isoDate,
  secretBinding: motionStudioLyriaD3SecretBindingV1Schema,
  credentialPresence: motionStudioLyriaD3CredentialPresenceEvidenceV1Schema,
  modelDataPolicy: motionStudioLyriaD3ModelDataPolicyV1Schema,
  transportBudget: motionStudioLyriaD3TransportBudgetV1Schema,
  localComputeRateCard: motionStudioLyriaD3LocalComputeRateCardV1Schema,
  gates: z.array(readinessGateSchema).length(MOTION_STUDIO_LYRIA_D3_PREFLIGHT_GATE_CODES.length).readonly(),
  blockingGateCodes: z.array(gateCodeSchema).length(4).readonly(),
  sideEffects: z.object({
    googleSecretManagerMetadataRequestCount: z.literal(1),
    googleSecretManagerPayloadReadCount: z.literal(0),
    providerRequestCount: z.literal(0),
    providerSubmissionCount: z.literal(0),
    credentialValueCaptured: z.literal(false),
    providerResponseReceived: z.literal(false),
    mediaBytesCreated: z.literal(0),
    privateArtifactCreated: z.literal(false),
    internalProductionCostMicros: z.literal(0),
    authorityIssued: z.literal(false),
    remoteMutationPerformed: z.literal(false),
  }).strict(),
  providerExecutionAllowed: z.literal(false),
  singleUseAuthorityIssued: z.literal(false),
  privateCandidateCreated: z.literal(false),
  automaticSelectionAllowed: z.literal(false),
  finalMixAllowed: z.literal(false),
  timelineMutationAllowed: z.literal(false),
  productReady: z.literal(false),
  immutable: z.literal(true),
  readinessDigest: digest,
}).strict().superRefine((value, context) => {
  if (new Set(value.gates.map((gate) => gate.gateCode)).size !== MOTION_STUDIO_LYRIA_D3_PREFLIGHT_GATE_CODES.length ||
      MOTION_STUDIO_LYRIA_D3_PREFLIGHT_GATE_CODES.some((gateCode) =>
        !value.gates.some((gate) => gate.gateCode === gateCode))) {
    context.addIssue({ code: 'custom', path: ['gates'], message: 'Lyria D3 readiness must classify every gate exactly once.' })
  }
  const expected = value.gates.filter((gate) => gate.state === 'external_evidence_required')
    .map((gate) => gate.gateCode)
  if (!sameOrderedValues(expected, value.blockingGateCodes)) {
    context.addIssue({ code: 'custom', path: ['blockingGateCodes'], message: 'Lyria D3 readiness blockers must match unresolved gates.' })
  }
})

export type MotionStudioLyriaD3SecretBindingV1 =
  z.infer<typeof motionStudioLyriaD3SecretBindingV1Schema>
export type MotionStudioLyriaD3CredentialPresenceEvidenceV1 =
  z.infer<typeof motionStudioLyriaD3CredentialPresenceEvidenceV1Schema>
export type MotionStudioLyriaD3ModelDataPolicyV1 =
  z.infer<typeof motionStudioLyriaD3ModelDataPolicyV1Schema>
export type MotionStudioLyriaD3TransportBudgetV1 =
  z.infer<typeof motionStudioLyriaD3TransportBudgetV1Schema>
export type MotionStudioLyriaD3LocalComputeRateCardV1 =
  z.infer<typeof motionStudioLyriaD3LocalComputeRateCardV1Schema>
export type MotionStudioLyriaD3ExternalReadinessV1 =
  z.infer<typeof motionStudioLyriaD3ExternalReadinessV1Schema>

export function createMotionStudioLyriaD3SecretBinding(
  preflight: MotionStudioLyriaD3PreflightPlanV1,
): MotionStudioLyriaD3SecretBindingV1 {
  assertMotionStudioLyriaD3PreflightPlan(preflight)
  const base = {
    schemaVersion: MOTION_STUDIO_LYRIA_D3_SECRET_BINDING_SCHEMA_VERSION,
    bindingId: `ms012d3-lyria-secret-${preflight.preflightDigest.slice(0, 16)}`,
    sourcePreflightPlanId: preflight.preflightPlanId,
    sourcePreflightDigest: preflight.preflightDigest,
    providerOwnerCode: 'google' as const,
    configuredRouteId: 'lyria_3_pro' as const,
    credentialHeaderName: 'x-goog-api-key' as const,
    googleCloudProjectId: MOTION_STUDIO_LYRIA_D3_GOOGLE_CLOUD_PROJECT_ID,
    secretLocatorId: MOTION_STUDIO_LYRIA_D3_SECRET_LOCATOR_ID,
    secretVersionReference: MOTION_STUDIO_LYRIA_D3_SECRET_VERSION,
    channel: 'server_secret_reference' as const,
    payloadReadOnlyAfterSingleUseAuthority: true as const,
    browserExposureAllowed: false as const,
    persistenceInProjectAllowed: false as const,
    loggingAllowed: false as const,
    environmentFallbackAllowed: false as const,
    callerSelectedSecretAllowed: false as const,
    payloadAccessed: false as const,
    immutable: true as const,
  }
  return parseAndFreeze({ ...base, bindingDigest: sha256CanonicalJson(base) },
    motionStudioLyriaD3SecretBindingV1Schema)
}

export function createMotionStudioLyriaD3CredentialPresenceEvidence(input: {
  preflight: MotionStudioLyriaD3PreflightPlanV1
  secretBinding: MotionStudioLyriaD3SecretBindingV1
  secretResourceName: string
  versionState: string
  versionCreateTime: string
  observedAt: string
}): MotionStudioLyriaD3CredentialPresenceEvidenceV1 {
  assertMotionStudioLyriaD3PreflightPlan(input.preflight)
  assertSecretBinding(input.secretBinding, input.preflight)
  if (input.secretResourceName !== MOTION_STUDIO_LYRIA_D3_SECRET_RESOURCE_NAME ||
      input.versionState !== 'ENABLED') {
    blocked('Lyria D3 credential presence requires exact enabled Secret Manager version metadata.')
  }
  const versionCreateTime = exactRfc3339(input.versionCreateTime, 'Lyria credential version creation time')
  const observedAt = exactIso(input.observedAt, 'Lyria credential metadata observation time')
  if (observedAt < versionCreateTime || observedAt >= input.preflight.expiresAt) {
    blocked('Lyria credential metadata must be observed after creation and before preflight expiry.')
  }
  const base = {
    schemaVersion: MOTION_STUDIO_LYRIA_D3_CREDENTIAL_PRESENCE_SCHEMA_VERSION,
    evidenceId: `ms012d3-lyria-secret-presence-${input.preflight.preflightDigest.slice(0, 16)}`,
    sourcePreflightPlanId: input.preflight.preflightPlanId,
    sourcePreflightDigest: input.preflight.preflightDigest,
    secretBindingId: input.secretBinding.bindingId,
    secretBindingDigest: input.secretBinding.bindingDigest,
    evidenceClass: 'google_secret_manager_version_metadata' as const,
    secretResourceName: MOTION_STUDIO_LYRIA_D3_SECRET_RESOURCE_NAME,
    versionState: 'ENABLED' as const,
    versionCreateTime,
    observedAt,
    cloudSdkVersion: MOTION_STUDIO_LYRIA_D3_GCLOUD_SDK_VERSION,
    resolvedExecutablePath: MOTION_STUDIO_LYRIA_D3_GCLOUD_BINARY_PATH,
    executableByteLength: MOTION_STUDIO_LYRIA_D3_GCLOUD_BINARY_BYTE_LENGTH,
    executableSha256: MOTION_STUDIO_LYRIA_D3_GCLOUD_BINARY_SHA256,
    metadataRequestCount: 1 as const,
    secretPayloadReadCount: 0 as const,
    credentialValueCaptured: false as const,
    providerRequestCount: 0 as const,
    providerSubmissionCount: 0 as const,
    immutable: true as const,
  }
  return parseAndFreeze({ ...base, evidenceDigest: sha256CanonicalJson(base) },
    motionStudioLyriaD3CredentialPresenceEvidenceV1Schema)
}

export function createMotionStudioLyriaD3ModelDataPolicy(input: {
  preflight: MotionStudioLyriaD3PreflightPlanV1
  approvedAt: string
}): MotionStudioLyriaD3ModelDataPolicyV1 {
  assertMotionStudioLyriaD3PreflightPlan(input.preflight)
  const approvedAt = exactIso(input.approvedAt, 'Lyria model-data policy approval time')
  if (approvedAt < input.preflight.createdAt || approvedAt >= input.preflight.expiresAt) {
    blocked('Lyria model-data policy must be current inside the preflight evidence window.')
  }
  const base = {
    schemaVersion: MOTION_STUDIO_LYRIA_D3_MODEL_DATA_POLICY_SCHEMA_VERSION,
    policyId: `ms012d3-lyria-data-policy-${input.preflight.preflightDigest.slice(0, 16)}`,
    sourcePreflightPlanId: input.preflight.preflightPlanId,
    sourcePreflightDigest: input.preflight.preflightDigest,
    workspaceId: input.preflight.workspaceId,
    projectId: input.preflight.projectId,
    editSessionId: input.preflight.editSessionId,
    productionId: input.preflight.productionId,
    providerOwnerCode: 'google' as const,
    providerServiceCode: 'gemini_developer_api' as const,
    modelId: 'lyria-3-pro-preview' as const,
    permittedDataClass: 'synthetic_nonconfidential_instrumental_prompt_only' as const,
    productionUserContentAllowed: false as const,
    personallyIdentifyingDataAllowed: false as const,
    confidentialSourceMaterialAllowed: false as const,
    likenessOrBiometricDataAllowed: false as const,
    uploadedMediaAllowed: false as const,
    promptStorageRequested: false as const,
    interactionsStoreValue: false as const,
    paidTierTrainingUsePolicy: 'not_used_to_improve_google_products' as const,
    zeroRetentionClaimed: false as const,
    providerOperationalLoggingClaimedAbsent: false as const,
    processingRegion: 'provider_managed_not_user_selected' as const,
    synthIdWatermarkExpected: true as const,
    privateNoncommercialReviewOnly: true as const,
    approvedAt,
    expiresAt: input.preflight.expiresAt,
    allowed: true as const,
    immutable: true as const,
  }
  return parseAndFreeze({ ...base, policyDigest: sha256CanonicalJson(base) },
    motionStudioLyriaD3ModelDataPolicyV1Schema)
}

export function createMotionStudioLyriaD3TransportBudget(
  preflight: MotionStudioLyriaD3PreflightPlanV1,
): MotionStudioLyriaD3TransportBudgetV1 {
  assertMotionStudioLyriaD3PreflightPlan(preflight)
  const base = {
    schemaVersion: MOTION_STUDIO_LYRIA_D3_TRANSPORT_BUDGET_SCHEMA_VERSION,
    budgetId: `ms012d3-lyria-transport-${preflight.preflightDigest.slice(0, 16)}`,
    sourcePreflightPlanId: preflight.preflightPlanId,
    sourcePreflightDigest: preflight.preflightDigest,
    maximumSecretPayloadReads: 1 as const,
    maximumProviderSubmissions: 1 as const,
    maximumNetworkRequests: 1 as const,
    maximumAddressConnectionAttemptsPerRequest: 1 as const,
    ipv4PreferredSingleAddressSelection: true as const,
    addressFallbackAllowed: false as const,
    proxyOrPacExecutionAllowed: false as const,
    maximumRedirects: 0 as const,
    maximumRetries: 0 as const,
    maximumFallbacks: 0 as const,
    maximumStatusRequests: 0 as const,
    maximumDownloadRequests: 0 as const,
    maximumRequestBodyBytes: 16_384 as const,
    maximumCapturedResponseBytes: preflight.transportBudgetProposal.maximumCapturedResponseBytes,
    maximumConnectMilliseconds: 10_000 as const,
    maximumElapsedMilliseconds: 120_000 as const,
    unknownOutcomeRequiresReconciliation: true as const,
    automaticResubmissionAllowed: false as const,
    immutable: true as const,
  }
  return parseAndFreeze({ ...base, budgetDigest: sha256CanonicalJson(base) },
    motionStudioLyriaD3TransportBudgetV1Schema)
}

export function createMotionStudioLyriaD3LocalComputeRateCard(input: {
  preflight: MotionStudioLyriaD3PreflightPlanV1
  verifiedAt: string
}): MotionStudioLyriaD3LocalComputeRateCardV1 {
  assertMotionStudioLyriaD3PreflightPlan(input.preflight)
  const verifiedAt = exactIso(input.verifiedAt, 'Lyria local-compute rate-card verification time')
  if (verifiedAt < input.preflight.createdAt || verifiedAt >= input.preflight.expiresAt) {
    blocked('Lyria local-compute rate card must be current inside the preflight evidence window.')
  }
  const sourceEvidence = {
    policyId: 'motion-studio-lyria-private-audio-normalization-local-cost-policy-v1',
    scope: 'private_noncommercial_single_candidate_normalization_and_probe',
    rateBasis: 'conservative_internal_cpu_second_policy_pending_infrastructure_contract',
    unitPriceUsdMicrosPerCpuSecond: 1_000,
    minimumChargeUsdMicros: 1_000,
    maximumAuthorizedCpuSeconds: 20,
    serviceFeeIncluded: false,
    customerPricingIncluded: false,
    customerCreditsIncluded: false,
  }
  const base = {
    schemaVersion: MOTION_STUDIO_LYRIA_D3_LOCAL_COMPUTE_RATE_CARD_SCHEMA_VERSION,
    rateCardSnapshotId: `ms012d3-lyria-local-rate-${input.preflight.preflightDigest.slice(0, 16)}`,
    sourcePreflightPlanId: input.preflight.preflightPlanId,
    sourcePreflightDigest: input.preflight.preflightDigest,
    toolId: 'ffmpeg' as const,
    proposedOperationId: 'tool.ffmpeg.normalize_storytelling_music_candidate.v1' as const,
    operationRegistrationState: 'shared_registry_coordination_required' as const,
    currency: 'USD' as const,
    unit: 'cpu_second' as const,
    unitPriceUsdMicrosPerCpuSecond: 1_000 as const,
    minimumChargeUsdMicros: 1_000 as const,
    maximumAuthorizedCpuSeconds: 20 as const,
    maximumAuthorizedLocalComputeCostMicros: 20_000 as const,
    maximumAuthorizedProviderCostMicros: 80_000 as const,
    maximumAuthorizedTotalInternalCostMicros: 100_000 as const,
    roundingRule: 'ceil_cpu_microsecond_usd_micro' as const,
    sourceEvidenceClass: 'reeditpro_conservative_internal_cost_policy' as const,
    sourceEvidenceId: sourceEvidence.policyId,
    sourceEvidenceDigest: sha256CanonicalJson(sourceEvidence),
    effectiveFrom: input.preflight.createdAt,
    verifiedAt,
    serviceFeeIncluded: false as const,
    customerPricingIncluded: false as const,
    customerCreditsIncluded: false as const,
    customerBillingAllowed: false as const,
    immutable: true as const,
  }
  return parseAndFreeze({ ...base, rateCardDigest: sha256CanonicalJson(base) },
    motionStudioLyriaD3LocalComputeRateCardV1Schema)
}

export function createMotionStudioLyriaD3ExternalReadiness(input: {
  preflight: MotionStudioLyriaD3PreflightPlanV1
  secretBinding: MotionStudioLyriaD3SecretBindingV1
  credentialPresence: MotionStudioLyriaD3CredentialPresenceEvidenceV1
  modelDataPolicy: MotionStudioLyriaD3ModelDataPolicyV1
  transportBudget: MotionStudioLyriaD3TransportBudgetV1
  localComputeRateCard: MotionStudioLyriaD3LocalComputeRateCardV1
  createdAt: string
}): MotionStudioLyriaD3ExternalReadinessV1 {
  assertMotionStudioLyriaD3PreflightPlan(input.preflight)
  assertSecretBinding(input.secretBinding, input.preflight)
  assertCredentialPresence(input.credentialPresence, input.secretBinding, input.preflight)
  assertModelDataPolicy(input.modelDataPolicy, input.preflight)
  assertTransportBudget(input.transportBudget, input.preflight)
  assertLocalComputeRateCard(input.localComputeRateCard, input.preflight)
  const createdAt = exactIso(input.createdAt, 'Lyria D3 external-readiness creation time')
  if (createdAt < input.credentialPresence.observedAt || createdAt >= input.preflight.expiresAt) {
    blocked('Lyria D3 external readiness must follow credential observation before evidence expiry.')
  }

  const resolvedExternal = new Map<MotionStudioLyriaD3PreflightGateCode, {
    evidenceId: string
    evidenceDigest: string
    explanation: string
  }>([
    ['exact_transport_time_and_connection_budget', {
      evidenceId: input.transportBudget.budgetId,
      evidenceDigest: input.transportBudget.budgetDigest,
      explanation: 'Transport now has exact connection, elapsed-time, request, response, redirect, retry and fallback ceilings.',
    }],
    ['project_model_data_policy', {
      evidenceId: input.modelDataPolicy.policyId,
      evidenceDigest: input.modelDataPolicy.policyDigest,
      explanation: 'The exact synthetic nonconfidential fixture is allowed with store=false and no production user data.',
    }],
    ['server_owned_secret_binding', {
      evidenceId: input.secretBinding.bindingId,
      evidenceDigest: input.secretBinding.bindingDigest,
      explanation: 'The route binds exact Google Secret Manager project, secret and numeric version through a server-only reference.',
    }],
    ['credential_presence', {
      evidenceId: input.credentialPresence.evidenceId,
      evidenceDigest: input.credentialPresence.evidenceDigest,
      explanation: 'Pinned Cloud SDK metadata confirmed the exact secret version is enabled without reading its payload.',
    }],
    ['exact_local_compute_rate_card', {
      evidenceId: input.localComputeRateCard.rateCardSnapshotId,
      evidenceDigest: input.localComputeRateCard.rateCardDigest,
      explanation: 'A conservative immutable CPU-second rate and USD 0.02 local / USD 0.10 total ceiling are frozen.',
    }],
  ])

  const gates = deepFreeze(input.preflight.gates.map((gate) => {
    const resolved = resolvedExternal.get(gate.gateCode)
    return readinessGateSchema.parse(resolved ? {
      gateCode: gate.gateCode,
      state: 'passed_external_read_only',
      ...resolved,
    } : gate)
  }))
  const blockingGateCodes = gates.filter((gate) => gate.state === 'external_evidence_required')
    .map((gate) => gate.gateCode)
  const base = {
    schemaVersion: MOTION_STUDIO_LYRIA_D3_READINESS_SCHEMA_VERSION,
    readinessId: `ms012d3-lyria-readiness-${input.preflight.preflightDigest.slice(0, 16)}`,
    sourcePreflightPlanId: input.preflight.preflightPlanId,
    sourcePreflightDigest: input.preflight.preflightDigest,
    state: 'external_preflight_partial_complete_execution_blocked' as const,
    createdAt,
    expiresAt: input.preflight.expiresAt,
    secretBinding: input.secretBinding,
    credentialPresence: input.credentialPresence,
    modelDataPolicy: input.modelDataPolicy,
    transportBudget: input.transportBudget,
    localComputeRateCard: input.localComputeRateCard,
    gates,
    blockingGateCodes,
    sideEffects: {
      googleSecretManagerMetadataRequestCount: 1 as const,
      googleSecretManagerPayloadReadCount: 0 as const,
      providerRequestCount: 0 as const,
      providerSubmissionCount: 0 as const,
      credentialValueCaptured: false as const,
      providerResponseReceived: false as const,
      mediaBytesCreated: 0 as const,
      privateArtifactCreated: false as const,
      internalProductionCostMicros: 0 as const,
      authorityIssued: false as const,
      remoteMutationPerformed: false as const,
    },
    providerExecutionAllowed: false as const,
    singleUseAuthorityIssued: false as const,
    privateCandidateCreated: false as const,
    automaticSelectionAllowed: false as const,
    finalMixAllowed: false as const,
    timelineMutationAllowed: false as const,
    productReady: false as const,
    immutable: true as const,
  }
  return parseAndFreeze({ ...base, readinessDigest: sha256CanonicalJson(base) },
    motionStudioLyriaD3ExternalReadinessV1Schema)
}

export function assertMotionStudioLyriaD3ExternalReadiness(
  readiness: MotionStudioLyriaD3ExternalReadinessV1,
): void {
  const parsed = motionStudioLyriaD3ExternalReadinessV1Schema.parse(readiness)
  for (const value of [
    parsed.secretBinding.bindingDigest,
    parsed.credentialPresence.evidenceDigest,
    parsed.modelDataPolicy.policyDigest,
    parsed.transportBudget.budgetDigest,
    parsed.localComputeRateCard.rateCardDigest,
    parsed.readinessDigest,
  ]) {
    if (!/^[a-f0-9]{64}$/.test(value)) blocked('Lyria D3 readiness contains a malformed evidence digest.')
  }
  assertOwnDigest(parsed.secretBinding, 'bindingDigest', 'Lyria D3 secret binding')
  assertOwnDigest(parsed.credentialPresence, 'evidenceDigest', 'Lyria D3 credential presence')
  assertOwnDigest(parsed.modelDataPolicy, 'policyDigest', 'Lyria D3 model-data policy')
  assertOwnDigest(parsed.transportBudget, 'budgetDigest', 'Lyria D3 transport budget')
  assertOwnDigest(parsed.localComputeRateCard, 'rateCardDigest', 'Lyria D3 local-compute rate card')
  assertOwnDigest(parsed, 'readinessDigest', 'Lyria D3 readiness')
  if (parsed.blockingGateCodes.length !== 4 || parsed.providerExecutionAllowed ||
      parsed.singleUseAuthorityIssued || parsed.sideEffects.googleSecretManagerPayloadReadCount !== 0 ||
      parsed.sideEffects.providerRequestCount !== 0 || parsed.sideEffects.providerSubmissionCount !== 0 ||
      parsed.sideEffects.mediaBytesCreated !== 0 || parsed.sideEffects.internalProductionCostMicros !== 0) {
    blocked('Lyria D3 partial readiness crossed a payload, transport, media, cost or authority boundary.')
  }
}

function assertSecretBinding(
  binding: MotionStudioLyriaD3SecretBindingV1,
  preflight: MotionStudioLyriaD3PreflightPlanV1,
): void {
  const parsed = motionStudioLyriaD3SecretBindingV1Schema.parse(binding)
  assertOwnDigest(parsed, 'bindingDigest', 'Lyria D3 secret binding')
  if (parsed.sourcePreflightPlanId !== preflight.preflightPlanId ||
      parsed.sourcePreflightDigest !== preflight.preflightDigest || parsed.payloadAccessed) {
    blocked('Lyria D3 secret binding does not match the exact payload-unread preflight.')
  }
}

function assertCredentialPresence(
  evidence: MotionStudioLyriaD3CredentialPresenceEvidenceV1,
  binding: MotionStudioLyriaD3SecretBindingV1,
  preflight: MotionStudioLyriaD3PreflightPlanV1,
): void {
  const parsed = motionStudioLyriaD3CredentialPresenceEvidenceV1Schema.parse(evidence)
  assertOwnDigest(parsed, 'evidenceDigest', 'Lyria D3 credential presence')
  if (parsed.sourcePreflightDigest !== preflight.preflightDigest ||
      parsed.secretBindingDigest !== binding.bindingDigest || parsed.secretPayloadReadCount !== 0 ||
      parsed.credentialValueCaptured || parsed.providerRequestCount !== 0) {
    blocked('Lyria D3 credential presence lost its exact payload-unread binding.')
  }
}

function assertModelDataPolicy(
  policy: MotionStudioLyriaD3ModelDataPolicyV1,
  preflight: MotionStudioLyriaD3PreflightPlanV1,
): void {
  const parsed = motionStudioLyriaD3ModelDataPolicyV1Schema.parse(policy)
  assertOwnDigest(parsed, 'policyDigest', 'Lyria D3 model-data policy')
  if (parsed.sourcePreflightDigest !== preflight.preflightDigest || !parsed.allowed ||
      parsed.productionUserContentAllowed || parsed.interactionsStoreValue) {
    blocked('Lyria D3 model-data policy must allow only the exact synthetic store=false fixture.')
  }
}

function assertTransportBudget(
  budget: MotionStudioLyriaD3TransportBudgetV1,
  preflight: MotionStudioLyriaD3PreflightPlanV1,
): void {
  const parsed = motionStudioLyriaD3TransportBudgetV1Schema.parse(budget)
  assertOwnDigest(parsed, 'budgetDigest', 'Lyria D3 transport budget')
  if (parsed.sourcePreflightDigest !== preflight.preflightDigest ||
      parsed.maximumCapturedResponseBytes !== preflight.transportBudgetProposal.maximumCapturedResponseBytes) {
    blocked('Lyria D3 transport budget does not preserve the exact response ceiling.')
  }
}

function assertLocalComputeRateCard(
  rateCard: MotionStudioLyriaD3LocalComputeRateCardV1,
  preflight: MotionStudioLyriaD3PreflightPlanV1,
): void {
  const parsed = motionStudioLyriaD3LocalComputeRateCardV1Schema.parse(rateCard)
  assertOwnDigest(parsed, 'rateCardDigest', 'Lyria D3 local-compute rate card')
  if (parsed.sourcePreflightDigest !== preflight.preflightDigest ||
      parsed.maximumAuthorizedProviderCostMicros !== preflight.costBudgetProposal.maximumAuthorizedProviderCostMicros ||
      parsed.maximumAuthorizedTotalInternalCostMicros !==
      parsed.maximumAuthorizedProviderCostMicros + parsed.maximumAuthorizedLocalComputeCostMicros) {
    blocked('Lyria D3 local-compute rate card lost the exact provider/local/total cost relationship.')
  }
}

function assertOwnDigest<T extends Record<string, unknown>>(
  input: T,
  digestKey: keyof T,
  label: string,
): void {
  const base = { ...input }
  const value = base[digestKey]
  delete base[digestKey]
  if (typeof value !== 'string' || sha256CanonicalJson(base) !== value) {
    blocked(`${label} failed immutable digest verification.`)
  }
}

function exactIso(value: string, label: string): string {
  const parsed = new Date(value)
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== value) invalid(`${label} must be canonical ISO-8601.`)
  return value
}

function exactRfc3339(value: string, label: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?Z$/.test(value) ||
      !Number.isFinite(Date.parse(value))) {
    invalid(`${label} must be canonical UTC RFC-3339.`)
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

function sameOrderedValues(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index])
}

function invalid(message: string): never {
  throw new ApiError('VALIDATION_FAILED', message, 400)
}

function blocked(message: string): never {
  throw new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', message, 409)
}
