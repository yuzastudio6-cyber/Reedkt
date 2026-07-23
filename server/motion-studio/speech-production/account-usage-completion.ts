import { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'

import { ApiError } from '../../errors/api-error'
import { sha256CanonicalJson } from '../commands/canonical-json'
import {
  getMotionStudioSpeechAccountPreflightEvidenceClass,
  type MotionStudioSpeechAccountPreflightEvidenceClass,
  type MotionStudioSpeechAccountPreflightEvidenceV1,
} from './account-preflight'
import {
  assertMotionStudioSpeechC2ExecutionAuthority,
  assertMotionStudioSpeechC2LiveExecutionAuthorityInstance,
  type MotionStudioSpeechC2ExecutionAuthorityV1,
} from './live-authority'
import {
  assertMotionStudioSpeechFixtureGoogleSecretManagerLoader,
  assertMotionStudioSpeechLiveGoogleSecretManagerBinding,
  assertMotionStudioSpeechLiveGoogleSecretManagerLoader,
  type MotionStudioSpeechSecretBindingV1,
  type MotionStudioSpeechSecretValueLoader,
} from './live-credential'
import type { MotionStudioSpeechC2PostResponseEvidenceV1 } from './post-response'
import type {
  MotionStudioSpeechCapabilitySnapshotV1,
  MotionStudioSpeechSegmentRequestV1,
} from '../../../src/types/motion-studio'

const ELEVENLABS_API_ORIGIN = 'https://api.elevenlabs.io'
const ACCOUNT_USAGE_PATH = '/v1/user/subscription'
const MAX_RESPONSE_BYTES = 512 * 1024
const MAX_PLAN_WINDOW_MS = 15 * 60_000
const MAX_ACTIVE_CONSUMED_PLANS = 512
const SHA256 = /^[a-f0-9]{64}$/
const STABLE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/
const SYSTEM_FETCH = globalThis.fetch.bind(globalThis)
const issuedPlans = new WeakMap<object, string>()
const consumedPlans = new Map<string, number>()
const evidenceClasses = new WeakMap<object, MotionStudioSpeechAccountUsageCompletionEvidenceClass>()

export type MotionStudioSpeechAccountUsageCompletionEvidenceClass =
  | 'private_local_fixture'
  | 'authenticated_provider_read_only'

export interface MotionStudioSpeechAccountUsageCompletionPlanV1 {
  schemaVersion: 'motion-studio.speech-account-usage-completion-plan.v1'
  planId: string
  credentialBinding: MotionStudioSpeechSecretBindingV1
  executionAuthorityDigest: string
  candidateTakeId: string
  postResponseEvidenceDigest: string
  postResponseEvidenceClass: MotionStudioSpeechC2PostResponseEvidenceV1['evidenceClass']
  accountPreflightEvidenceDigest: string
  accountPreflightEvidenceClass: MotionStudioSpeechAccountPreflightEvidenceClass
  accountUsageBaselineEvidenceId: string
  baselineStatus: string
  baselineTier: string
  baselineQuotaConsumed: number
  baselineQuotaLimit: number
  providerCharacterCostMicrocredits: number
  providerCharacterCostEvidenceDigest: string
  apiOrigin: typeof ELEVENLABS_API_ORIGIN
  requestPath: typeof ACCOUNT_USAGE_PATH
  maximumNetworkCalls: 1
  readOnlyRequestOnly: true
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

export interface MotionStudioSpeechAccountUsageCompletionEvidenceV1 {
  schemaVersion: 'motion-studio.speech-account-usage-completion-evidence.v1'
  state: 'exact_provider_usage_reconciled' | 'account_usage_mismatch'
  planDigest: string
  executionAuthorityDigest: string
  candidateTakeId: string
  postResponseEvidenceDigest: string
  credentialBindingDigest: string
  credentialSource: 'google_secret_manager' | 'private_local_fixture'
  credentialValueRead: true
  credentialValuePersisted: false
  providerRequestCount: 1
  providerGenerationCallMade: false
  purchasePerformed: false
  accountMutationPerformed: false
  automaticRetryPerformed: false
  automaticFallbackPerformed: false
  rawProviderResponsePersisted: false
  accountUsageBaselineEvidenceId: string
  accountUsageCompletionEvidenceId: string
  baselineQuotaConsumed: number
  completionQuotaConsumed: number
  accountUsageDeltaMicrocredits: number
  providerCharacterCostMicrocredits: number
  providerCharacterCostEvidenceDigest: string
  exactUsageMatch: boolean
  accountIdentityStable: boolean
  safeProviderRequestIdDigest?: string
  capturedAt: string
  evidenceDigest: string
  immutable: true
}

export interface MotionStudioSpeechAccountUsageCompletionTransport {
  execute(input: {
    plan: MotionStudioSpeechAccountUsageCompletionPlanV1
    now: string
  }): Promise<MotionStudioSpeechAccountUsageCompletionEvidenceV1>
}

export function createMotionStudioSpeechAccountUsageCompletionPlan(input: {
  planId: string
  request: MotionStudioSpeechSegmentRequestV1
  capabilitySnapshot: MotionStudioSpeechCapabilitySnapshotV1
  executionAuthority: MotionStudioSpeechC2ExecutionAuthorityV1
  postResponseEvidence: MotionStudioSpeechC2PostResponseEvidenceV1
  accountPreflightEvidence: MotionStudioSpeechAccountPreflightEvidenceV1
  credentialBinding: MotionStudioSpeechSecretBindingV1
  issuedAt: string
  expiresAt: string
}): MotionStudioSpeechAccountUsageCompletionPlanV1 {
  if (!STABLE_ID.test(input.planId)) invalid('Speech account-usage completion plan ID is malformed.')
  const authority = assertMotionStudioSpeechC2ExecutionAuthority(
    input.executionAuthority,
    input.request,
    input.capabilitySnapshot,
  )
  assertMotionStudioSpeechC2LiveExecutionAuthorityInstance(authority)
  assertMotionStudioSpeechLiveGoogleSecretManagerBinding(input.credentialBinding)
  const post = input.postResponseEvidence
  const preflight = input.accountPreflightEvidence
  const preflightClass = getMotionStudioSpeechAccountPreflightEvidenceClass(preflight)
  assertPostResponseEvidence(post, authority)
  if (
    input.credentialBinding.bindingDigest !== authority.credentialBindingDigest ||
    input.credentialBinding.credentialReferenceId !== authority.credentialReferenceId
  ) blocked('Speech account-usage completion credential does not match the execution authority.')
  if (
    preflight.accountUsageBaselineEvidenceId !== authority.accountUsageBaselineEvidenceId ||
    preflight.state !== 'account_voice_model_evidence_ready' ||
    !preflight.accountFundedWithoutPurchase || !preflight.modelAccessVerified ||
    !preflight.verifiedProviderCatalogVoice
  ) blocked('Speech account-usage completion requires the exact ready account preflight baseline.')
  const issuedAt = exactIso(input.issuedAt, 'account-usage completion issue time')
  const expiresAt = exactIso(input.expiresAt, 'account-usage completion expiry time')
  const windowMs = Date.parse(expiresAt) - Date.parse(issuedAt)
  if (windowMs <= 0 || windowMs > MAX_PLAN_WINDOW_MS) {
    blocked('Speech account-usage completion plan must use one positive window no longer than 15 minutes.')
  }
  if (Date.parse(issuedAt) < Date.parse(post.createdAt)) {
    blocked('Speech account-usage completion cannot begin before post-response evidence exists.')
  }
  const base = {
    schemaVersion: 'motion-studio.speech-account-usage-completion-plan.v1' as const,
    planId: input.planId,
    credentialBinding: Object.freeze({ ...input.credentialBinding }),
    executionAuthorityDigest: authority.authorityDigest,
    candidateTakeId: post.candidateTakeId,
    postResponseEvidenceDigest: post.evidenceDigest,
    postResponseEvidenceClass: post.evidenceClass,
    accountPreflightEvidenceDigest: preflight.evidenceDigest,
    accountPreflightEvidenceClass: preflightClass,
    accountUsageBaselineEvidenceId: preflight.accountUsageBaselineEvidenceId,
    baselineStatus: preflight.subscription.status,
    baselineTier: preflight.subscription.tier,
    baselineQuotaConsumed: preflight.subscription.quotaConsumed,
    baselineQuotaLimit: preflight.subscription.quotaLimit,
    providerCharacterCostMicrocredits: post.providerCharacterCostMicrocredits!,
    providerCharacterCostEvidenceDigest: post.providerCharacterCostEvidenceDigest!,
    apiOrigin: ELEVENLABS_API_ORIGIN as typeof ELEVENLABS_API_ORIGIN,
    requestPath: ACCOUNT_USAGE_PATH as typeof ACCOUNT_USAGE_PATH,
    maximumNetworkCalls: 1 as const,
    readOnlyRequestOnly: true as const,
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
  const plan = Object.freeze({ ...base, planDigest: sha256CanonicalJson(base) })
  issuedPlans.set(plan, plan.planDigest)
  return plan
}

export function createMotionStudioSpeechAccountUsageCompletionLiveTransport(input: {
  externalNetworkEnabled: boolean
  credentialPayloadAccessEnabled: boolean
  loader: MotionStudioSpeechSecretValueLoader
  requestTimeoutMs?: number
}): MotionStudioSpeechAccountUsageCompletionTransport {
  assertMotionStudioSpeechLiveGoogleSecretManagerLoader(input.loader)
  return createTransport({
    transportEnabled: input.externalNetworkEnabled,
    credentialPayloadAccessEnabled: input.credentialPayloadAccessEnabled,
    loader: input.loader,
    fetchImplementation: SYSTEM_FETCH,
    evidenceClass: 'authenticated_provider_read_only',
    requestTimeoutMs: input.requestTimeoutMs,
  })
}

export function createMotionStudioSpeechAccountUsageCompletionFixtureTransport(input: {
  transportEnabled: boolean
  credentialPayloadAccessEnabled: boolean
  fixtureLoader: MotionStudioSpeechSecretValueLoader
  fixtureFetchImplementation: typeof fetch
  requestTimeoutMs?: number
}): MotionStudioSpeechAccountUsageCompletionTransport {
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

export function getMotionStudioSpeechAccountUsageCompletionEvidenceClass(
  evidence: MotionStudioSpeechAccountUsageCompletionEvidenceV1,
): MotionStudioSpeechAccountUsageCompletionEvidenceClass {
  const evidenceClass = evidenceClasses.get(evidence)
  if (!evidenceClass) blocked('Speech account-usage completion evidence has no trusted in-process provenance.')
  return evidenceClass
}

function createTransport(input: {
  transportEnabled: boolean
  credentialPayloadAccessEnabled: boolean
  loader: MotionStudioSpeechSecretValueLoader
  fetchImplementation: typeof fetch
  evidenceClass: MotionStudioSpeechAccountUsageCompletionEvidenceClass
  requestTimeoutMs?: number
}): MotionStudioSpeechAccountUsageCompletionTransport {
  if (typeof input.transportEnabled !== 'boolean' || typeof input.credentialPayloadAccessEnabled !== 'boolean') {
    invalid('Speech account-usage completion activation must be explicit.')
  }
  const timeoutMs = input.requestTimeoutMs ?? 15_000
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1_000 || timeoutMs > 30_000) {
    invalid('Speech account-usage completion timeout must be between one and 30 seconds.')
  }
  return Object.freeze({
    async execute({ plan, now }: {
      plan: MotionStudioSpeechAccountUsageCompletionPlanV1
      now: string
    }): Promise<MotionStudioSpeechAccountUsageCompletionEvidenceV1> {
      if (!input.transportEnabled) disabled('Speech account-usage completion transport is disabled.')
      if (!input.credentialPayloadAccessEnabled) {
        blocked('Speech account-usage completion credential payload access is disabled.')
      }
      const executionTime = assertPlan(plan, now)
      if (input.evidenceClass === 'authenticated_provider_read_only') {
        assertMotionStudioSpeechLiveGoogleSecretManagerLoader(input.loader)
        if (
          plan.accountPreflightEvidenceClass !== 'authenticated_provider_read_only' ||
          plan.postResponseEvidenceClass !== 'provider_single_submission_private_evidence'
        ) blocked('Live account-usage completion requires authenticated baseline and provider response evidence.')
      } else if (
        plan.accountPreflightEvidenceClass !== 'private_local_fixture' ||
        plan.postResponseEvidenceClass !== 'private_local_transport_fixture'
      ) blocked('Fixture account-usage completion cannot impersonate live provider evidence.')
      pruneExpired(consumedPlans, executionTime)
      if (consumedPlans.has(plan.planDigest)) blocked('Speech account-usage completion plan has already been consumed.')
      if (consumedPlans.size >= MAX_ACTIVE_CONSUMED_PLANS) {
        blocked('Speech account-usage completion active-plan guard is full; no credential was read.')
      }
      consumedPlans.set(plan.planDigest, Date.parse(plan.expiresAt))

      let rawSecret: Buffer | Uint8Array | string
      try {
        rawSecret = await input.loader.access({
          secretLocatorId: plan.credentialBinding.secretLocatorId,
          secretVersionReference: plan.credentialBinding.secretVersionReference,
        })
      } catch {
        blocked('The pinned speech account-usage credential could not be accessed.')
      }
      const apiKey = validateSecretValue(rawSecret)
      const response = await requestSubscription({
        fetchImplementation: input.fetchImplementation,
        apiKey,
        timeoutMs,
      })
      const completion = parseSubscription(response.value)
      const accountIdentityStable = completion.status === plan.baselineStatus &&
        completion.tier === plan.baselineTier && completion.quotaLimit === plan.baselineQuotaLimit
      const delta = completion.quotaConsumed - plan.baselineQuotaConsumed
      const accountUsageDeltaMicrocredits = delta >= 0 && Number.isSafeInteger(delta * 1_000_000)
        ? delta * 1_000_000
        : -1
      const exactUsageMatch = accountUsageDeltaMicrocredits === plan.providerCharacterCostMicrocredits
      const completionEvidenceId = sha256CanonicalJson({
        planDigest: plan.planDigest,
        status: completion.status,
        tier: completion.tier,
        quotaConsumed: completion.quotaConsumed,
        quotaLimit: completion.quotaLimit,
        responseBodyDigest: response.bodyDigest,
      })
      const base = {
        schemaVersion: 'motion-studio.speech-account-usage-completion-evidence.v1' as const,
        state: accountIdentityStable && exactUsageMatch
          ? 'exact_provider_usage_reconciled' as const
          : 'account_usage_mismatch' as const,
        planDigest: plan.planDigest,
        executionAuthorityDigest: plan.executionAuthorityDigest,
        candidateTakeId: plan.candidateTakeId,
        postResponseEvidenceDigest: plan.postResponseEvidenceDigest,
        credentialBindingDigest: plan.credentialBinding.bindingDigest,
        credentialSource: input.evidenceClass === 'authenticated_provider_read_only'
          ? 'google_secret_manager' as const
          : 'private_local_fixture' as const,
        credentialValueRead: true as const,
        credentialValuePersisted: false as const,
        providerRequestCount: 1 as const,
        providerGenerationCallMade: false as const,
        purchasePerformed: false as const,
        accountMutationPerformed: false as const,
        automaticRetryPerformed: false as const,
        automaticFallbackPerformed: false as const,
        rawProviderResponsePersisted: false as const,
        accountUsageBaselineEvidenceId: plan.accountUsageBaselineEvidenceId,
        accountUsageCompletionEvidenceId: completionEvidenceId,
        baselineQuotaConsumed: plan.baselineQuotaConsumed,
        completionQuotaConsumed: completion.quotaConsumed,
        accountUsageDeltaMicrocredits,
        providerCharacterCostMicrocredits: plan.providerCharacterCostMicrocredits,
        providerCharacterCostEvidenceDigest: plan.providerCharacterCostEvidenceDigest,
        exactUsageMatch,
        accountIdentityStable,
        ...(response.requestIdDigest ? { safeProviderRequestIdDigest: response.requestIdDigest } : {}),
        capturedAt: exactIso(now, 'account-usage completion capture time'),
        immutable: true as const,
      }
      const evidence = deepFreeze({ ...base, evidenceDigest: sha256CanonicalJson(base) })
      evidenceClasses.set(evidence, input.evidenceClass)
      return evidence
    },
  })
}

async function requestSubscription(input: {
  fetchImplementation: typeof fetch
  apiKey: string
  timeoutMs: number
}): Promise<{ value: unknown; bodyDigest: string; requestIdDigest?: string }> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), input.timeoutMs)
  try {
    const response = await input.fetchImplementation(`${ELEVENLABS_API_ORIGIN}${ACCOUNT_USAGE_PATH}`, {
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
      blocked(`Speech account-usage completion read was rejected with HTTP ${response.status}.`)
    }
    if (response.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() !== 'application/json') {
      blocked('Speech account-usage completion returned an unexpected content type.')
    }
    let value: unknown
    try {
      value = JSON.parse(body.toString('utf8'))
    } catch {
      blocked('Speech account-usage completion returned malformed JSON.')
    }
    return { value, bodyDigest, ...(requestIdDigest ? { requestIdDigest } : {}) }
  } catch (error) {
    if (error instanceof ApiError) throw error
    if (error instanceof DOMException && error.name === 'AbortError') {
      blocked('Speech account-usage completion timed out without retrying.')
    }
    blocked('Speech account-usage completion network read failed without retrying.')
  } finally {
    clearTimeout(timeout)
  }
}

function assertPostResponseEvidence(
  evidence: MotionStudioSpeechC2PostResponseEvidenceV1,
  authority: MotionStudioSpeechC2ExecutionAuthorityV1,
): void {
  const { evidenceDigest, ...base } = evidence
  if (
    !SHA256.test(evidenceDigest) || sha256CanonicalJson(base) !== evidenceDigest ||
    evidence.executionAuthorityDigest !== authority.authorityDigest ||
    evidence.candidateTakeId.length < 1 || evidence.externalProviderCallCount > 1 ||
    evidence.reconciliation.providerCharacterCostHeaderPresent !== true ||
    evidence.providerCharacterCostMicrocredits === undefined ||
    evidence.reconciliation.providerCharacterCostMicrocredits !== evidence.providerCharacterCostMicrocredits ||
    evidence.providerCharacterCostCredits !== evidence.providerCharacterCostMicrocredits / 1_000_000 ||
    !evidence.providerCharacterCostEvidenceDigest ||
    evidence.reconciliation.providerCharacterCostEvidenceDigest !== evidence.providerCharacterCostEvidenceDigest
  ) blocked('Speech account-usage completion requires exact post-response character-cost evidence.')
}

function assertPlan(plan: MotionStudioSpeechAccountUsageCompletionPlanV1, now: string): number {
  if (issuedPlans.get(plan) !== plan.planDigest) {
    blocked('Speech account-usage completion requires the exact frozen in-process plan.')
  }
  const { planDigest, ...base } = plan
  if (!SHA256.test(planDigest) || sha256CanonicalJson(base) !== planDigest) {
    blocked('Speech account-usage completion plan failed its immutable digest.')
  }
  const current = Date.parse(exactIso(now, 'account-usage completion execution time'))
  if (current < Date.parse(plan.issuedAt) || current > Date.parse(plan.expiresAt)) {
    blocked('Speech account-usage completion plan is outside its exact execution window.')
  }
  return current
}

function pruneExpired(values: Map<string, number>, now: number): void {
  for (const [key, expiresAt] of values) if (expiresAt < now) values.delete(key)
}

function parseSubscription(value: unknown): {
  status: string
  tier: string
  quotaConsumed: number
  quotaLimit: number
} {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    blocked('Speech account-usage completion subscription response is malformed.')
  }
  const object = value as Record<string, unknown>
  const status = safeString(object.status, 'subscription status')
  const tier = safeString(object.tier, 'subscription tier')
  const quotaConsumed = safeInteger(object.character_count, 'subscription quota consumed')
  const quotaLimit = safeInteger(object.character_limit, 'subscription quota limit')
  if (quotaConsumed < 0 || quotaLimit < 0) blocked('Speech account-usage completion counters are invalid.')
  return { status, tier, quotaConsumed, quotaLimit }
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
      blocked('Speech account-usage completion response exceeds the private-evidence byte limit.')
    }
    chunks.push(Buffer.from(value))
  }
  return Buffer.concat(chunks, byteLength)
}

function validateSecretValue(raw: Buffer | Uint8Array | string): string {
  const value = (typeof raw === 'string' ? raw : Buffer.from(raw).toString('utf8')).trim()
  if (value.length < 16 || value.length > 4_096 || /\s/.test(value)) {
    blocked('The pinned speech account-usage credential is malformed.')
  }
  return value
}

function safeString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.length < 1 || value.length > 256) {
    blocked(`Speech account-usage completion ${label} is malformed.`)
  }
  return value
}

function safeInteger(value: unknown, label: string): number {
  if (!Number.isSafeInteger(value)) blocked(`Speech account-usage completion ${label} is malformed.`)
  return value as number
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

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value
  if (Array.isArray(value)) value.forEach(deepFreeze)
  else Object.values(value as Record<string, unknown>).forEach(deepFreeze)
  return Object.freeze(value)
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
