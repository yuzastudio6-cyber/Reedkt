import { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'

import { ApiError } from '../../errors/api-error'
import { sha256CanonicalJson } from '../commands/canonical-json'
import {
  assertMotionStudioSpeechFixtureGoogleSecretManagerLoader,
  assertMotionStudioSpeechLiveGoogleSecretManagerBinding,
  assertMotionStudioSpeechLiveGoogleSecretManagerLoader,
  type MotionStudioSpeechSecretBindingV1,
  type MotionStudioSpeechSecretValueLoader,
} from './live-credential'
import {
  assertMotionStudioSpeechVoiceCatalogBindingResult,
  type MotionStudioSpeechVoiceCatalogBindingResultV1,
} from './voice-catalog-binding'

const ELEVENLABS_API_ORIGIN = 'https://api.elevenlabs.io'
const ELEVENLABS_MODEL_ID = 'eleven_v3'
const MAX_RESPONSE_BYTES = 512 * 1024
const MAX_TOTAL_RESPONSE_BYTES = 3 * MAX_RESPONSE_BYTES
const MAX_PLAN_WINDOW_MS = 15 * 60_000
const MAX_ACTIVE_CONSUMED_PLANS = 512
const MAX_INTERNAL_PRODUCTION_COST_MICROS = 100_000
const SHA256 = /^[a-f0-9]{64}$/
const STABLE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/
const VOICE_ID = /^[A-Za-z0-9_-]{6,128}$/
const SYSTEM_FETCH = globalThis.fetch.bind(globalThis)
const issuedPlans = new WeakMap<object, string>()
const planClasses = new WeakMap<object, MotionStudioSpeechAccountPreflightPlanClass>()
const consumedPlans = new Map<string, number>()
const evidenceClasses = new WeakMap<object, MotionStudioSpeechAccountPreflightEvidenceClass>()
const issuedExternalAuthorities = new WeakMap<object, string>()
const issuedExternalAuthorityKeys = new Map<string, number>()
const consumedExternalAuthorities = new Map<string, number>()

export const MOTION_STUDIO_SPEECH_ACCOUNT_PREFLIGHT_EXTERNAL_AUTHORIZATION_ID_EXT_001 =
  'MS-012C2-ACCOUNT-PREFLIGHT-EXT-001' as const
export const MOTION_STUDIO_SPEECH_ACCOUNT_PREFLIGHT_EXTERNAL_AUTHORIZATION_ID =
  'MS-012C2-ACCOUNT-PREFLIGHT-EXT-002' as const

export type MotionStudioSpeechAccountPreflightEvidenceClass =
  | 'private_local_fixture'
  | 'authenticated_provider_read_only'

type MotionStudioSpeechAccountPreflightPlanClass =
  | 'private_local_fixture'
  | 'explicit_provider_catalog_binding'

type MotionStudioSpeechAccountPreflightVoiceAuthority =
  | {
      authorityClass: 'private_local_fixture'
      fixtureEvidenceId: string
    }
  | {
      authorityClass: 'explicit_provider_catalog_binding'
      voiceBindingId: string
      selectionDigest: string
      catalogEvidenceDigest: string
      credentialBindingDigest: string
      voiceBibleContentDigest: string
      approvalRecordId: string
      approvedSnapshotId: string
      approvedSnapshotDigest: string
    }

export interface MotionStudioSpeechAccountPreflightPlanV1 {
  schemaVersion: 'motion-studio.speech-account-preflight-plan.v1'
  planId: string
  credentialBinding: MotionStudioSpeechSecretBindingV1
  providerVoiceId: string
  voiceIdentityHash: string
  voiceAuthority: MotionStudioSpeechAccountPreflightVoiceAuthority
  modelId: typeof ELEVENLABS_MODEL_ID
  expectedSpokenTextCharacterCount: number
  maximumAuthorizedProviderCostMicros: number
  apiOrigin: typeof ELEVENLABS_API_ORIGIN
  requestPaths: readonly [
    '/v1/user/subscription',
    '/v1/models',
    string,
  ]
  maximumNetworkCalls: 3
  readOnlyRequestsOnly: true
  providerGenerationAllowed: false
  purchaseAllowed: false
  accountMutationAllowed: false
  automaticRetryAllowed: false
  automaticFallbackAllowed: false
  privateLocalEvidenceOnly: true
  issuedAt: string
  expiresAt: string
  planDigest: string
  immutable: true
}

export interface MotionStudioSpeechAccountPreflightEvidenceV1 {
  schemaVersion: 'motion-studio.speech-account-preflight-evidence.v1'
  state: 'account_voice_model_evidence_ready' | 'account_voice_model_not_ready'
  planDigest: string
  credentialBindingDigest: string
  credentialSource: 'google_secret_manager' | 'private_local_fixture'
  credentialValueRead: true
  credentialValuePersisted: false
  providerRequestCount: 3
  providerGenerationCallMade: false
  purchasePerformed: false
  accountMutationPerformed: false
  automaticRetryPerformed: false
  automaticFallbackPerformed: false
  rawProviderResponsesPersisted: false
  subscription: {
    status: string
    tier: string
    quotaConsumed: number
    quotaLimit: number
    quotaRemaining: number
    estimatedRequestQuota: number
    quotaSufficientWithoutPurchase: boolean
    evidenceDigest: string
  }
  model: {
    modelId: typeof ELEVENLABS_MODEL_ID
    availableToAuthenticatedAccount: boolean
    canDoTextToSpeech: boolean
    requiresAlphaAccess: boolean
    maximumTextLengthPerRequest: number
    requestFitsModelTextLimit: boolean
    characterCostMultiplier: number
    costDiscountMultiplier: number
    evidenceDigest: string
  }
  voice: {
    providerVoiceId: string
    voiceIdentityHash: string
    category: string
    providerCatalogCategoryAccepted: boolean
    availableForCurrentTier: boolean
    evidenceDigest: string
  }
  voiceAuthorityClass: MotionStudioSpeechAccountPreflightPlanClass
  voiceAuthorityDigest: string
  accountFundedWithoutPurchase: boolean
  modelAccessVerified: boolean
  verifiedProviderCatalogVoice: boolean
  accountUsageBaselineEvidenceId: string
  providerModelRateEvidenceId: string
  zeroRetentionRequestPolicy: 'enable_logging_false_required'
  zeroRetentionEntitlementStatus: 'independent_enterprise_entitlement_evidence_required'
  exactInternalRateCardStatus: 'provider_model_multiplier_captured_internal_micros_evidence_required'
  safeProviderRequestIdDigests: readonly string[]
  capturedAt: string
  evidenceDigest: string
  immutable: true
}

export interface MotionStudioSpeechAccountPreflightTransport {
  execute(input: {
    plan: MotionStudioSpeechAccountPreflightPlanV1
    now: string
  }): Promise<MotionStudioSpeechAccountPreflightEvidenceV1>
}

export type MotionStudioSpeechAccountPreflightSafeProgressEventV1 =
  | Readonly<{ phase: 'credential_read_started' }>
  | Readonly<{ phase: 'credential_read_completed' }>
  | Readonly<{
      phase: 'provider_request_started' | 'provider_request_completed'
      requestIndex: 1 | 2 | 3
      requestKind: 'subscription' | 'model_catalog' | 'exact_accepted_voice'
    }>
  | Readonly<{ phase: 'evidence_compiled' }>

export interface MotionStudioSpeechAccountPreflightExternalAuthorityV1 {
  schemaVersion: 'motion-studio.speech-account-preflight-external-authority.v1'
  authorizationId: typeof MOTION_STUDIO_SPEECH_ACCOUNT_PREFLIGHT_EXTERNAL_AUTHORIZATION_ID
  authorityPacketDigest: string
  ownerAuthorizationEvidenceId: string
  planId: string
  planDigest: string
  credentialBindingDigest: string
  voiceIdentityHash: string
  selectionDigest: string
  catalogEvidenceDigest: string
  maximumSecretPayloadReads: 1
  maximumNetworkCalls: 3
  maximumCapturedResponseBytes: typeof MAX_TOTAL_RESPONSE_BYTES
  maximumRedirects: 0
  readOnlyAccountRequestsAllowed: true
  providerGenerationAllowed: false
  purchaseAllowed: false
  accountMutationAllowed: false
  automaticRetryAllowed: false
  automaticFallbackAllowed: false
  maximumInternalProductionCostMicros: typeof MAX_INTERNAL_PRODUCTION_COST_MICROS
  privateLocalEvidenceOnly: true
  issuedAt: string
  expiresAt: string
  authorityDigest: string
  immutable: true
}

export function createMotionStudioSpeechAccountPreflightPlan(input: {
  planId: string
  credentialBinding: MotionStudioSpeechSecretBindingV1
  catalogBindingResult: MotionStudioSpeechVoiceCatalogBindingResultV1
  expectedSpokenTextCharacterCount: number
  maximumAuthorizedProviderCostMicros: number
  issuedAt: string
  expiresAt: string
}): MotionStudioSpeechAccountPreflightPlanV1 {
  assertMotionStudioSpeechVoiceCatalogBindingResult(input.catalogBindingResult)
  const result = input.catalogBindingResult
  if (
    result.accountPreflightEligible !== true ||
    result.selection.catalogEvidenceClass !== 'authenticated_provider_read_only' ||
    result.selection.selectionStatus !== 'explicit_provider_catalog_selection' ||
    result.voiceBinding.catalogBindingStatus !== 'verified_provider_catalog' ||
    result.voiceBinding.verifiedProviderCatalogVoice !== true
  ) blocked('Live speech account preflight requires one authenticated provider catalog binding.')
  if (input.credentialBinding.bindingDigest !== result.selection.credentialBindingDigest) {
    blocked('Speech account preflight credential does not match the catalog discovery binding.')
  }
  return createPlan({
    ...input,
    providerVoiceId: result.providerVoiceId,
    voiceIdentityHash: result.voiceIdentityHash,
    voiceAuthority: Object.freeze({
      authorityClass: 'explicit_provider_catalog_binding' as const,
      voiceBindingId: result.selection.voiceBindingId,
      selectionDigest: result.selection.selectionDigest,
      catalogEvidenceDigest: result.selection.catalogEvidenceDigest,
      credentialBindingDigest: result.selection.credentialBindingDigest,
      voiceBibleContentDigest: result.selection.voiceBibleArtifactVersion.contentDigest,
      approvalRecordId: result.selection.approvalRecordId,
      approvedSnapshotId: result.selection.approvedSnapshotId,
      approvedSnapshotDigest: result.selection.approvedSnapshotDigest,
    }),
    planClass: 'explicit_provider_catalog_binding',
  })
}

export function createMotionStudioSpeechAccountPreflightFixturePlan(input: {
  planId: string
  credentialBinding: MotionStudioSpeechSecretBindingV1
  providerVoiceId: string
  voiceIdentityHash: string
  fixtureEvidenceId: string
  expectedSpokenTextCharacterCount: number
  maximumAuthorizedProviderCostMicros: number
  issuedAt: string
  expiresAt: string
}): MotionStudioSpeechAccountPreflightPlanV1 {
  return createPlan({
    ...input,
    voiceAuthority: Object.freeze({
      authorityClass: 'private_local_fixture' as const,
      fixtureEvidenceId: input.fixtureEvidenceId,
    }),
    planClass: 'private_local_fixture',
  })
}

export function createMotionStudioSpeechAccountPreflightExternalAuthority(input: {
  plan: MotionStudioSpeechAccountPreflightPlanV1
  authorityPacketDigest: string
  ownerAuthorizationEvidenceId: string
  issuedAt: string
  expiresAt: string
}): MotionStudioSpeechAccountPreflightExternalAuthorityV1 {
  const issuedAt = exactIso(input.issuedAt, 'account-preflight external-authority issue time')
  const expiresAt = exactIso(input.expiresAt, 'account-preflight external-authority expiry time')
  assertPlan(input.plan, issuedAt)
  if (planClasses.get(input.plan) !== 'explicit_provider_catalog_binding' ||
    input.plan.voiceAuthority.authorityClass !== 'explicit_provider_catalog_binding') {
    blocked('Speech account-preflight external authority requires one exact provider-catalog plan.')
  }
  if (!SHA256.test(input.authorityPacketDigest)) {
    invalid('Speech account-preflight authority packet digest is malformed.')
  }
  if (!STABLE_ID.test(input.ownerAuthorizationEvidenceId)) {
    invalid('Speech account-preflight owner authorization evidence ID is malformed.')
  }
  if (
    Date.parse(issuedAt) < Date.parse(input.plan.issuedAt) ||
    Date.parse(expiresAt) > Date.parse(input.plan.expiresAt) ||
    Date.parse(expiresAt) <= Date.parse(issuedAt)
  ) blocked('Speech account-preflight external authority must remain inside its exact plan window.')
  pruneExpired(issuedExternalAuthorityKeys, Date.parse(issuedAt))
  const issueKey = sha256CanonicalJson({
    authorizationId: MOTION_STUDIO_SPEECH_ACCOUNT_PREFLIGHT_EXTERNAL_AUTHORIZATION_ID,
    authorityPacketDigest: input.authorityPacketDigest,
    ownerAuthorizationEvidenceId: input.ownerAuthorizationEvidenceId,
    planDigest: input.plan.planDigest,
    selectionDigest: input.plan.voiceAuthority.selectionDigest,
  })
  if (issuedExternalAuthorityKeys.has(issueKey)) {
    blocked('Speech account-preflight packet and owner evidence already issued one external authority.')
  }
  if (issuedExternalAuthorityKeys.size >= MAX_ACTIVE_CONSUMED_PLANS) {
    blocked('Speech account-preflight external-authority issuance guard is full.')
  }
  const base = {
    schemaVersion: 'motion-studio.speech-account-preflight-external-authority.v1' as const,
    authorizationId: MOTION_STUDIO_SPEECH_ACCOUNT_PREFLIGHT_EXTERNAL_AUTHORIZATION_ID,
    authorityPacketDigest: input.authorityPacketDigest,
    ownerAuthorizationEvidenceId: input.ownerAuthorizationEvidenceId,
    planId: input.plan.planId,
    planDigest: input.plan.planDigest,
    credentialBindingDigest: input.plan.credentialBinding.bindingDigest,
    voiceIdentityHash: input.plan.voiceIdentityHash,
    selectionDigest: input.plan.voiceAuthority.selectionDigest,
    catalogEvidenceDigest: input.plan.voiceAuthority.catalogEvidenceDigest,
    maximumSecretPayloadReads: 1 as const,
    maximumNetworkCalls: 3 as const,
    maximumCapturedResponseBytes: MAX_TOTAL_RESPONSE_BYTES,
    maximumRedirects: 0 as const,
    readOnlyAccountRequestsAllowed: true as const,
    providerGenerationAllowed: false as const,
    purchaseAllowed: false as const,
    accountMutationAllowed: false as const,
    automaticRetryAllowed: false as const,
    automaticFallbackAllowed: false as const,
    maximumInternalProductionCostMicros:
      MAX_INTERNAL_PRODUCTION_COST_MICROS as typeof MAX_INTERNAL_PRODUCTION_COST_MICROS,
    privateLocalEvidenceOnly: true as const,
    issuedAt,
    expiresAt,
    immutable: true as const,
  }
  const authority = Object.freeze({ ...base, authorityDigest: sha256CanonicalJson(base) })
  issuedExternalAuthorities.set(authority, authority.authorityDigest)
  issuedExternalAuthorityKeys.set(issueKey, Date.parse(expiresAt))
  return authority
}

function createPlan(input: {
  planId: string
  credentialBinding: MotionStudioSpeechSecretBindingV1
  providerVoiceId: string
  voiceIdentityHash: string
  voiceAuthority: MotionStudioSpeechAccountPreflightVoiceAuthority
  planClass: MotionStudioSpeechAccountPreflightPlanClass
  expectedSpokenTextCharacterCount: number
  maximumAuthorizedProviderCostMicros: number
  issuedAt: string
  expiresAt: string
}): MotionStudioSpeechAccountPreflightPlanV1 {
  assertMotionStudioSpeechLiveGoogleSecretManagerBinding(input.credentialBinding)
  if (!STABLE_ID.test(input.planId)) invalid('Speech account preflight plan ID is malformed.')
  assertVoiceAuthority(input.voiceAuthority, input.planClass)
  if (!VOICE_ID.test(input.providerVoiceId)) invalid('Speech account preflight voice ID is malformed.')
  if (!SHA256.test(input.voiceIdentityHash) || sha256Text(input.providerVoiceId) !== input.voiceIdentityHash) {
    blocked('Speech account preflight voice identity does not match the exact provider voice ID.')
  }
  if (
    !Number.isSafeInteger(input.expectedSpokenTextCharacterCount) ||
    input.expectedSpokenTextCharacterCount < 1 || input.expectedSpokenTextCharacterCount > 5_000
  ) invalid('Speech account preflight text length must be between one and 5,000 characters.')
  if (
    !Number.isSafeInteger(input.maximumAuthorizedProviderCostMicros) ||
    input.maximumAuthorizedProviderCostMicros < 1 || input.maximumAuthorizedProviderCostMicros > 250_000
  ) invalid('Speech account preflight cost ceiling must be between one micro-dollar and USD 0.25.')
  const issuedAt = exactIso(input.issuedAt, 'account preflight issue time')
  const expiresAt = exactIso(input.expiresAt, 'account preflight expiry time')
  const windowMs = Date.parse(expiresAt) - Date.parse(issuedAt)
  if (windowMs <= 0 || windowMs > MAX_PLAN_WINDOW_MS) {
    blocked('Speech account preflight plan must use one positive window no longer than 15 minutes.')
  }
  const voicePath = `/v1/voices/${input.providerVoiceId}`
  const base = {
    schemaVersion: 'motion-studio.speech-account-preflight-plan.v1' as const,
    planId: input.planId,
    credentialBinding: Object.freeze({ ...input.credentialBinding }),
    providerVoiceId: input.providerVoiceId,
    voiceIdentityHash: input.voiceIdentityHash,
    voiceAuthority: input.voiceAuthority,
    modelId: ELEVENLABS_MODEL_ID as typeof ELEVENLABS_MODEL_ID,
    expectedSpokenTextCharacterCount: input.expectedSpokenTextCharacterCount,
    maximumAuthorizedProviderCostMicros: input.maximumAuthorizedProviderCostMicros,
    apiOrigin: ELEVENLABS_API_ORIGIN as typeof ELEVENLABS_API_ORIGIN,
    requestPaths: Object.freeze([
      '/v1/user/subscription', '/v1/models', voicePath,
    ]) as MotionStudioSpeechAccountPreflightPlanV1['requestPaths'],
    maximumNetworkCalls: 3 as const,
    readOnlyRequestsOnly: true as const,
    providerGenerationAllowed: false as const,
    purchaseAllowed: false as const,
    accountMutationAllowed: false as const,
    automaticRetryAllowed: false as const,
    automaticFallbackAllowed: false as const,
    privateLocalEvidenceOnly: true as const,
    issuedAt,
    expiresAt,
    immutable: true as const,
  }
  const plan: MotionStudioSpeechAccountPreflightPlanV1 = Object.freeze({
    ...base,
    planDigest: sha256CanonicalJson(base),
  })
  issuedPlans.set(plan, plan.planDigest)
  planClasses.set(plan, input.planClass)
  return plan
}

export function createMotionStudioSpeechAccountPreflightLiveTransport(input: {
  externalNetworkEnabled: boolean
  credentialPayloadAccessEnabled: boolean
  loader: MotionStudioSpeechSecretValueLoader
  plan: MotionStudioSpeechAccountPreflightPlanV1
  externalAuthority: MotionStudioSpeechAccountPreflightExternalAuthorityV1
  onSafeProgress?: (event: MotionStudioSpeechAccountPreflightSafeProgressEventV1) => void
  requestTimeoutMs?: number
}): MotionStudioSpeechAccountPreflightTransport {
  assertMotionStudioSpeechLiveGoogleSecretManagerLoader(input.loader)
  return createTransport({
    transportEnabled: input.externalNetworkEnabled,
    credentialPayloadAccessEnabled: input.credentialPayloadAccessEnabled,
    loader: input.loader,
    fetchImplementation: SYSTEM_FETCH,
    evidenceClass: 'authenticated_provider_read_only',
    boundPlan: input.plan,
    externalAuthority: input.externalAuthority,
    onSafeProgress: input.onSafeProgress,
    requestTimeoutMs: input.requestTimeoutMs,
  })
}

export function createMotionStudioSpeechAccountPreflightFixtureTransport(input: {
  transportEnabled: boolean
  credentialPayloadAccessEnabled: boolean
  fixtureLoader: MotionStudioSpeechSecretValueLoader
  fixtureFetchImplementation: typeof fetch
  requestTimeoutMs?: number
}): MotionStudioSpeechAccountPreflightTransport {
  assertMotionStudioSpeechFixtureGoogleSecretManagerLoader(input.fixtureLoader)
  return createTransport({
    transportEnabled: input.transportEnabled,
    credentialPayloadAccessEnabled: input.credentialPayloadAccessEnabled,
    loader: input.fixtureLoader,
    fetchImplementation: input.fixtureFetchImplementation,
    evidenceClass: 'private_local_fixture',
    requestTimeoutMs: input.requestTimeoutMs,
  })
}

/**
 * Protocol proof for the external-authority lane. The returned evidence stays
 * fixture-branded and cannot satisfy a later live speech-generation gate.
 */
export function createMotionStudioSpeechAccountPreflightAuthorizedFixtureTransport(input: {
  transportEnabled: boolean
  credentialPayloadAccessEnabled: boolean
  fixtureLoader: MotionStudioSpeechSecretValueLoader
  fixtureFetchImplementation: typeof fetch
  plan: MotionStudioSpeechAccountPreflightPlanV1
  externalAuthority: MotionStudioSpeechAccountPreflightExternalAuthorityV1
  onSafeProgress?: (event: MotionStudioSpeechAccountPreflightSafeProgressEventV1) => void
  requestTimeoutMs?: number
}): MotionStudioSpeechAccountPreflightTransport {
  assertMotionStudioSpeechFixtureGoogleSecretManagerLoader(input.fixtureLoader)
  return createTransport({
    transportEnabled: input.transportEnabled,
    credentialPayloadAccessEnabled: input.credentialPayloadAccessEnabled,
    loader: input.fixtureLoader,
    fetchImplementation: input.fixtureFetchImplementation,
    evidenceClass: 'private_local_fixture',
    boundPlan: input.plan,
    externalAuthority: input.externalAuthority,
    onSafeProgress: input.onSafeProgress,
    requestTimeoutMs: input.requestTimeoutMs,
  })
}

export function getMotionStudioSpeechAccountPreflightEvidenceClass(
  evidence: MotionStudioSpeechAccountPreflightEvidenceV1,
): MotionStudioSpeechAccountPreflightEvidenceClass {
  const evidenceClass = evidenceClasses.get(evidence)
  if (!evidenceClass) blocked('Speech account preflight evidence has no trusted in-process provenance.')
  return evidenceClass
}

function createTransport(input: {
  transportEnabled: boolean
  credentialPayloadAccessEnabled: boolean
  loader: MotionStudioSpeechSecretValueLoader
  fetchImplementation: typeof fetch
  evidenceClass: MotionStudioSpeechAccountPreflightEvidenceClass
  boundPlan?: MotionStudioSpeechAccountPreflightPlanV1
  externalAuthority?: MotionStudioSpeechAccountPreflightExternalAuthorityV1
  onSafeProgress?: (event: MotionStudioSpeechAccountPreflightSafeProgressEventV1) => void
  requestTimeoutMs?: number
}): MotionStudioSpeechAccountPreflightTransport {
  const transportEnabled = input.transportEnabled
  const credentialPayloadAccessEnabled = input.credentialPayloadAccessEnabled
  if (typeof transportEnabled !== 'boolean' || typeof credentialPayloadAccessEnabled !== 'boolean') {
    invalid('Speech account preflight activation must be explicit.')
  }
  const loader = input.loader
  const fetchImplementation = input.fetchImplementation
  const evidenceClass = input.evidenceClass
  const timeoutMs = input.requestTimeoutMs ?? 15_000
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1_000 || timeoutMs > 30_000) {
    invalid('Speech account preflight request timeout must be between one and 30 seconds.')
  }
  return Object.freeze({
    async execute({ plan, now }: {
      plan: MotionStudioSpeechAccountPreflightPlanV1
      now: string
    }): Promise<MotionStudioSpeechAccountPreflightEvidenceV1> {
      if (!transportEnabled) disabled('Speech account preflight transport is disabled.')
      if (!credentialPayloadAccessEnabled) blocked('Speech account preflight credential payload access is disabled.')
      const executionTime = assertPlan(plan, now)
      const planClass = planClasses.get(plan)
      if (!planClass) blocked('Speech account preflight plan has no trusted in-process class.')
      if (input.boundPlan || input.externalAuthority) {
        if (!input.boundPlan || !input.externalAuthority || plan !== input.boundPlan) {
          blocked('Speech account-preflight external transport requires its exact bound plan.')
        }
        assertExternalAuthority(input.externalAuthority, plan, now)
      } else if (evidenceClass === 'authenticated_provider_read_only') {
        blocked('Speech live account-preflight transport requires a single-use external authority.')
      }
      if (
        (evidenceClass === 'authenticated_provider_read_only' && planClass !== 'explicit_provider_catalog_binding') ||
        (evidenceClass === 'private_local_fixture' && input.externalAuthority === undefined &&
          planClass !== 'private_local_fixture') ||
        (evidenceClass === 'private_local_fixture' && input.externalAuthority !== undefined &&
          planClass !== 'explicit_provider_catalog_binding')
      ) blocked('Speech account preflight plan does not match the live or fixture transport class.')
      if (evidenceClass === 'authenticated_provider_read_only') {
        assertMotionStudioSpeechLiveGoogleSecretManagerLoader(loader)
      }
      pruneExpired(consumedPlans, executionTime)
      if (consumedPlans.has(plan.planDigest)) blocked('Speech account preflight plan has already been consumed.')
      if (consumedPlans.size >= MAX_ACTIVE_CONSUMED_PLANS) {
        blocked('Speech account preflight active-plan guard is full; no credential was read.')
      }
      if (input.externalAuthority) {
        pruneExpired(consumedExternalAuthorities, executionTime)
        if (consumedExternalAuthorities.has(input.externalAuthority.authorityDigest)) {
          blocked('Speech account-preflight external authority has already been consumed.')
        }
        if (consumedExternalAuthorities.size >= MAX_ACTIVE_CONSUMED_PLANS) {
          blocked('Speech account-preflight external-authority guard is full; no credential was read.')
        }
        consumedExternalAuthorities.set(
          input.externalAuthority.authorityDigest,
          Date.parse(input.externalAuthority.expiresAt),
        )
      }
      consumedPlans.set(plan.planDigest, Date.parse(plan.expiresAt))

      let rawSecret: Buffer | Uint8Array | string
      emitSafeProgress(input.onSafeProgress, { phase: 'credential_read_started' })
      try {
        rawSecret = await loader.access({
          secretLocatorId: plan.credentialBinding.secretLocatorId,
          secretVersionReference: plan.credentialBinding.secretVersionReference,
        })
      } catch {
        blocked('The pinned speech account-preflight credential could not be accessed.')
      }
      const apiKey = validateSecretValue(rawSecret)
      emitSafeProgress(input.onSafeProgress, { phase: 'credential_read_completed' })
      const responses: Array<{ value: unknown; bodyDigest: string; requestIdDigest?: string; byteLength: number }> = []
      for (const [index, path] of plan.requestPaths.entries()) {
        const requestIndex = (index + 1) as 1 | 2 | 3
        const requestKind = requestIndex === 1
          ? 'subscription' as const
          : requestIndex === 2
            ? 'model_catalog' as const
            : 'exact_accepted_voice' as const
        emitSafeProgress(input.onSafeProgress, {
          phase: 'provider_request_started', requestIndex, requestKind,
        })
        responses.push(await requestJson({
          fetchImplementation,
          apiKey,
          path,
          timeoutMs,
        }))
        emitSafeProgress(input.onSafeProgress, {
          phase: 'provider_request_completed', requestIndex, requestKind,
        })
      }
      const totalBytes = responses.reduce((sum, response) => sum + response.byteLength, 0)
      if (totalBytes > MAX_TOTAL_RESPONSE_BYTES) blocked('Speech account preflight responses exceed the total private-evidence limit.')

      const subscription = parseSubscription(responses[0]!.value, plan.expectedSpokenTextCharacterCount)
      const model = parseModel(responses[1]!.value)
      const voice = parseVoice(responses[2]!.value, plan.providerVoiceId, plan.voiceIdentityHash, subscription.tier)
      const estimatedRequestQuota = Math.ceil(
        plan.expectedSpokenTextCharacterCount * model.characterCostMultiplier * model.costDiscountMultiplier,
      )
      const quotaSufficientWithoutPurchase = subscription.quotaRemaining >= estimatedRequestQuota
      const subscriptionEvidence = Object.freeze({
        ...subscription,
        estimatedRequestQuota,
        quotaSufficientWithoutPurchase,
        evidenceDigest: sha256CanonicalJson({
          ...subscription,
          estimatedRequestQuota,
          quotaSufficientWithoutPurchase,
          responseBodyDigest: responses[0]!.bodyDigest,
        }),
      })
      const modelWithRequestFit = {
        ...model,
        requestFitsModelTextLimit:
          model.maximumTextLengthPerRequest >= plan.expectedSpokenTextCharacterCount,
      }
      const modelEvidence = Object.freeze({
        ...modelWithRequestFit,
        evidenceDigest: sha256CanonicalJson({
          ...modelWithRequestFit,
          responseBodyDigest: responses[1]!.bodyDigest,
        }),
      })
      const voiceEvidence = Object.freeze({
        ...voice,
        evidenceDigest: sha256CanonicalJson({ ...voice, responseBodyDigest: responses[2]!.bodyDigest }),
      })
      const accountFundedWithoutPurchase = quotaSufficientWithoutPurchase
      const modelAccessVerified = model.availableToAuthenticatedAccount && model.canDoTextToSpeech &&
        modelWithRequestFit.requestFitsModelTextLimit
      const verifiedProviderCatalogVoice = voice.providerCatalogCategoryAccepted && voice.availableForCurrentTier
      const base = {
        schemaVersion: 'motion-studio.speech-account-preflight-evidence.v1' as const,
        state: accountFundedWithoutPurchase && modelAccessVerified && verifiedProviderCatalogVoice
          ? 'account_voice_model_evidence_ready' as const
          : 'account_voice_model_not_ready' as const,
        planDigest: plan.planDigest,
        credentialBindingDigest: plan.credentialBinding.bindingDigest,
        credentialSource: evidenceClass === 'authenticated_provider_read_only'
          ? 'google_secret_manager' as const
          : 'private_local_fixture' as const,
        credentialValueRead: true as const,
        credentialValuePersisted: false as const,
        providerRequestCount: 3 as const,
        providerGenerationCallMade: false as const,
        purchasePerformed: false as const,
        accountMutationPerformed: false as const,
        automaticRetryPerformed: false as const,
        automaticFallbackPerformed: false as const,
        rawProviderResponsesPersisted: false as const,
        subscription: subscriptionEvidence,
        model: modelEvidence,
        voice: voiceEvidence,
        voiceAuthorityClass: planClass,
        voiceAuthorityDigest: sha256CanonicalJson(plan.voiceAuthority),
        accountFundedWithoutPurchase,
        modelAccessVerified,
        verifiedProviderCatalogVoice,
        accountUsageBaselineEvidenceId: subscriptionEvidence.evidenceDigest,
        providerModelRateEvidenceId: modelEvidence.evidenceDigest,
        zeroRetentionRequestPolicy: 'enable_logging_false_required' as const,
        zeroRetentionEntitlementStatus: 'independent_enterprise_entitlement_evidence_required' as const,
        exactInternalRateCardStatus: 'provider_model_multiplier_captured_internal_micros_evidence_required' as const,
        safeProviderRequestIdDigests: Object.freeze(responses.flatMap((response) =>
          response.requestIdDigest ? [response.requestIdDigest] : [])),
        capturedAt: exactIso(now, 'account preflight capture time'),
        immutable: true as const,
      }
      const evidence = Object.freeze({ ...base, evidenceDigest: sha256CanonicalJson(base) })
      evidenceClasses.set(evidence, evidenceClass)
      emitSafeProgress(input.onSafeProgress, { phase: 'evidence_compiled' })
      return evidence
    },
  })
}

function emitSafeProgress(
  observer: ((event: MotionStudioSpeechAccountPreflightSafeProgressEventV1) => void) | undefined,
  event: MotionStudioSpeechAccountPreflightSafeProgressEventV1,
): void {
  if (!observer) return
  observer(Object.freeze(event))
}

async function requestJson(input: {
  fetchImplementation: typeof fetch
  apiKey: string
  path: string
  timeoutMs: number
}): Promise<{ value: unknown; bodyDigest: string; requestIdDigest?: string; byteLength: number }> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), input.timeoutMs)
  try {
    const response = await input.fetchImplementation(`${ELEVENLABS_API_ORIGIN}${input.path}`, {
      method: 'GET',
      headers: { accept: 'application/json', 'xi-api-key': input.apiKey },
      redirect: 'manual',
      signal: controller.signal,
    })
    const body = await readBoundedBody(response, MAX_RESPONSE_BYTES)
    const bodyDigest = sha256Bytes(body)
    const requestId = response.headers.get('request-id')?.trim()
    const requestIdDigest = requestId ? sha256Text(requestId) : undefined
    if (response.status < 200 || response.status >= 300) {
      blocked(`Speech account preflight read was rejected with HTTP ${response.status}.`)
    }
    const contentType = response.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase()
    if (contentType !== 'application/json') blocked('Speech account preflight returned an unexpected content type.')
    let value: unknown
    try {
      value = JSON.parse(body.toString('utf8'))
    } catch {
      blocked('Speech account preflight returned malformed JSON.')
    }
    return { value, bodyDigest, ...(requestIdDigest ? { requestIdDigest } : {}), byteLength: body.byteLength }
  } catch (error) {
    if (error instanceof ApiError) throw error
    if (error instanceof DOMException && error.name === 'AbortError') {
      blocked('Speech account preflight timed out without retrying.')
    }
    blocked('Speech account preflight network read failed without retrying.')
  } finally {
    clearTimeout(timeout)
  }
}

async function readBoundedBody(response: Response, maximumBytes: number): Promise<Buffer> {
  if (!response.body) return Buffer.alloc(0)
  const reader = response.body.getReader()
  const chunks: Buffer[] = []
  let byteLength = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    byteLength += value.byteLength
    if (byteLength > maximumBytes) {
      await reader.cancel()
      blocked('Speech account preflight response exceeds the private-evidence byte limit.')
    }
    chunks.push(Buffer.from(value))
  }
  return Buffer.concat(chunks, byteLength)
}

function parseSubscription(value: unknown, expectedCharacters: number): {
  status: string
  tier: string
  quotaConsumed: number
  quotaLimit: number
  quotaRemaining: number
} {
  const object = record(value, 'subscription')
  const status = stringValue(object.status, 'subscription status')
  const tier = stringValue(object.tier, 'subscription tier')
  const quotaConsumed = integerValue(object.character_count, 'subscription quota consumed')
  const quotaLimit = integerValue(object.character_limit, 'subscription quota limit')
  if (quotaConsumed < 0 || quotaLimit < 0 || expectedCharacters < 1) {
    blocked('Speech account preflight subscription counters are invalid.')
  }
  return { status, tier, quotaConsumed, quotaLimit, quotaRemaining: Math.max(0, quotaLimit - quotaConsumed) }
}

function parseModel(value: unknown): Omit<
  MotionStudioSpeechAccountPreflightEvidenceV1['model'],
  'evidenceDigest' | 'requestFitsModelTextLimit'
> {
  if (!Array.isArray(value)) blocked('Speech account preflight model catalog is malformed.')
  const model = value.find((entry) => recordOrNull(entry)?.model_id === ELEVENLABS_MODEL_ID)
  if (!model) {
    return {
      modelId: ELEVENLABS_MODEL_ID,
      availableToAuthenticatedAccount: false,
      canDoTextToSpeech: false,
      requiresAlphaAccess: false,
      maximumTextLengthPerRequest: 0,
      characterCostMultiplier: 1,
      costDiscountMultiplier: 1,
    }
  }
  const object = record(model, 'model catalog entry')
  const rates = record(object.model_rates, 'model rates')
  return {
    modelId: ELEVENLABS_MODEL_ID,
    availableToAuthenticatedAccount: true,
    canDoTextToSpeech: booleanValue(object.can_do_text_to_speech, 'model text-to-speech capability'),
    requiresAlphaAccess: booleanValue(object.requires_alpha_access, 'model alpha-access flag'),
    maximumTextLengthPerRequest: integerValue(object.maximum_text_length_per_request, 'model text limit'),
    characterCostMultiplier: finiteNonNegative(rates.character_cost_multiplier, 'model character cost multiplier'),
    costDiscountMultiplier: finiteNonNegative(rates.cost_discount_multiplier, 'model cost discount multiplier'),
  }
}

function parseVoice(
  value: unknown,
  providerVoiceId: string,
  voiceIdentityHash: string,
  currentTier: string,
): Omit<MotionStudioSpeechAccountPreflightEvidenceV1['voice'], 'evidenceDigest'> {
  const object = record(value, 'voice catalog entry')
  if (stringValue(object.voice_id, 'voice ID') !== providerVoiceId) {
    blocked('Speech account preflight voice response does not match the exact requested voice.')
  }
  const category = stringValue(object.category, 'voice category')
  const acceptedCategory = category === 'premade'
  const tiers = object.available_for_tiers === undefined || object.available_for_tiers === null
    ? []
    : stringArray(object.available_for_tiers, 'voice available tiers')
  return {
    providerVoiceId,
    voiceIdentityHash,
    category,
    providerCatalogCategoryAccepted: acceptedCategory,
    availableForCurrentTier: tiers.length === 0 || tiers.includes(currentTier),
  }
}

function assertPlan(plan: MotionStudioSpeechAccountPreflightPlanV1, now: string): number {
  if (issuedPlans.get(plan) !== plan.planDigest) {
    blocked('Speech account preflight requires the exact frozen in-process plan.')
  }
  assertMotionStudioSpeechLiveGoogleSecretManagerBinding(plan.credentialBinding)
  const { planDigest, ...base } = plan
  if (!SHA256.test(planDigest) || sha256CanonicalJson(base) !== planDigest) {
    blocked('Speech account preflight plan failed its immutable digest.')
  }
  const planClass = planClasses.get(plan)
  if (!planClass) blocked('Speech account preflight plan has no trusted in-process class.')
  assertVoiceAuthority(plan.voiceAuthority, planClass)
  const current = Date.parse(exactIso(now, 'account preflight execution time'))
  if (current < Date.parse(plan.issuedAt) || current > Date.parse(plan.expiresAt)) {
    blocked('Speech account preflight plan is outside its exact execution window.')
  }
  return current
}

function assertVoiceAuthority(
  authority: MotionStudioSpeechAccountPreflightVoiceAuthority,
  planClass: MotionStudioSpeechAccountPreflightPlanClass,
): void {
  if (authority.authorityClass !== planClass) {
    blocked('Speech account preflight voice authority does not match its plan class.')
  }
  if (authority.authorityClass === 'private_local_fixture') {
    if (!STABLE_ID.test(authority.fixtureEvidenceId)) {
      invalid('Speech account preflight fixture evidence ID is malformed.')
    }
    return
  }
  for (const value of [
    authority.voiceBindingId,
    authority.approvalRecordId,
    authority.approvedSnapshotId,
  ]) if (!STABLE_ID.test(value)) invalid('Speech account preflight catalog binding identity is malformed.')
  for (const value of [
    authority.selectionDigest,
    authority.catalogEvidenceDigest,
    authority.credentialBindingDigest,
    authority.voiceBibleContentDigest,
    authority.approvedSnapshotDigest,
  ]) if (!SHA256.test(value)) invalid('Speech account preflight catalog binding digest is malformed.')
}

function assertExternalAuthority(
  authority: MotionStudioSpeechAccountPreflightExternalAuthorityV1,
  plan: MotionStudioSpeechAccountPreflightPlanV1,
  now: string,
): void {
  const issuedDigest = issuedExternalAuthorities.get(authority)
  if (!issuedDigest || issuedDigest !== authority.authorityDigest) {
    blocked('Speech account-preflight external execution requires the exact in-process authority.')
  }
  const { authorityDigest, ...base } = authority
  if (
    !SHA256.test(authorityDigest) || sha256CanonicalJson(base) !== authorityDigest ||
    authorityDigest !== issuedDigest || authority.immutable !== true || !Object.isFrozen(authority)
  ) blocked('Speech account-preflight external authority failed its immutable integrity check.')
  if (plan.voiceAuthority.authorityClass !== 'explicit_provider_catalog_binding') {
    blocked('Speech account-preflight external authority lost its provider-catalog binding.')
  }
  if (
    authority.authorizationId !== MOTION_STUDIO_SPEECH_ACCOUNT_PREFLIGHT_EXTERNAL_AUTHORIZATION_ID ||
    !SHA256.test(authority.authorityPacketDigest) ||
    !STABLE_ID.test(authority.ownerAuthorizationEvidenceId) ||
    authority.planId !== plan.planId || authority.planDigest !== plan.planDigest ||
    authority.credentialBindingDigest !== plan.credentialBinding.bindingDigest ||
    authority.voiceIdentityHash !== plan.voiceIdentityHash ||
    authority.selectionDigest !== plan.voiceAuthority.selectionDigest ||
    authority.catalogEvidenceDigest !== plan.voiceAuthority.catalogEvidenceDigest ||
    authority.maximumSecretPayloadReads !== 1 || authority.maximumNetworkCalls !== 3 ||
    authority.maximumCapturedResponseBytes !== MAX_TOTAL_RESPONSE_BYTES || authority.maximumRedirects !== 0 ||
    authority.readOnlyAccountRequestsAllowed !== true || authority.providerGenerationAllowed !== false ||
    authority.purchaseAllowed !== false || authority.accountMutationAllowed !== false ||
    authority.automaticRetryAllowed !== false || authority.automaticFallbackAllowed !== false ||
    authority.maximumInternalProductionCostMicros !== MAX_INTERNAL_PRODUCTION_COST_MICROS ||
    authority.privateLocalEvidenceOnly !== true
  ) blocked('Speech account-preflight external authority violates its exact read-only lane.')
  const current = Date.parse(exactIso(now, 'account-preflight external-authority execution time'))
  if (
    current < Date.parse(authority.issuedAt) || current > Date.parse(authority.expiresAt) ||
    Date.parse(authority.issuedAt) < Date.parse(plan.issuedAt) ||
    Date.parse(authority.expiresAt) > Date.parse(plan.expiresAt)
  ) blocked('Speech account-preflight external authority is outside its exact execution window.')
}

function pruneExpired(values: Map<string, number>, now: number): void {
  for (const [key, expiresAt] of values) if (expiresAt < now) values.delete(key)
}

function validateSecretValue(raw: Buffer | Uint8Array | string): string {
  const value = (typeof raw === 'string' ? raw : Buffer.from(raw).toString('utf8')).trim()
  if (value.length < 16 || value.length > 4_096 || /\s/.test(value)) {
    blocked('The pinned speech account-preflight credential is malformed.')
  }
  return value
}

function record(value: unknown, label: string): Record<string, unknown> {
  const result = recordOrNull(value)
  if (!result) blocked(`Speech account preflight ${label} is malformed.`)
  return result
}

function recordOrNull(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}

function stringValue(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.length < 1 || value.length > 256) {
    blocked(`Speech account preflight ${label} is malformed.`)
  }
  return value
}

function booleanValue(value: unknown, label: string): boolean {
  if (typeof value !== 'boolean') blocked(`Speech account preflight ${label} is malformed.`)
  return value
}

function integerValue(value: unknown, label: string): number {
  if (!Number.isSafeInteger(value)) blocked(`Speech account preflight ${label} is malformed.`)
  return value as number
}

function finiteNonNegative(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    blocked(`Speech account preflight ${label} is malformed.`)
  }
  return value
}

function stringArray(value: unknown, label: string): string[] {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== 'string')) {
    blocked(`Speech account preflight ${label} is malformed.`)
  }
  return [...value] as string[]
}

function exactIso(value: string, label: string): string {
  const timestamp = Date.parse(value)
  if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString() !== value) invalid(`Speech ${label} is invalid.`)
  return value
}

function sha256Text(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}

function sha256Bytes(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function invalid(message: string): never {
  throw new ApiError('VALIDATION_FAILED', message, 400)
}

function blocked(message: string): never {
  throw new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', message, 409)
}

function disabled(message: string): never {
  throw new ApiError('REAL_PROVIDER_CALLS_DISABLED', message, 503)
}
