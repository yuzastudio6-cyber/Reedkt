import { Buffer } from 'node:buffer'
import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { lookup as dnsLookup } from 'node:dns'
import { readFile } from 'node:fs/promises'
import { request as httpsRequest } from 'node:https'

import { ApiError } from '../../errors/api-error'
import { sha256CanonicalJson } from '../commands/canonical-json'
import {
  assertMotionStudioLyriaD3PreflightPlan,
  type MotionStudioLyriaD3PreflightPlanV1,
} from './lyria-d3-preflight'
import {
  MOTION_STUDIO_LYRIA_D3_GCLOUD_BINARY_BYTE_LENGTH,
  MOTION_STUDIO_LYRIA_D3_GCLOUD_BINARY_PATH,
  MOTION_STUDIO_LYRIA_D3_GCLOUD_BINARY_SHA256,
  MOTION_STUDIO_LYRIA_D3_GOOGLE_CLOUD_PROJECT_ID,
  MOTION_STUDIO_LYRIA_D3_SECRET_LOCATOR_ID,
  MOTION_STUDIO_LYRIA_D3_SECRET_VERSION,
  assertMotionStudioLyriaD3ExternalReadiness,
  type MotionStudioLyriaD3ExternalReadinessV1,
} from './lyria-d3-readiness'
import {
  assertMotionStudioLyriaD3PrivateIngestReadiness,
  type MotionStudioLyriaD3PrivateIngestReadinessV1,
} from './lyria-d3-private-ingest-readiness'

const SHA256 = /^[a-f0-9]{64}$/
const STABLE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/
const GOOGLE_SECRET_ID = /^[A-Za-z][A-Za-z0-9_-]{0,254}$/
const MODEL_RESOURCE_NAME = 'models/lyria-3-pro-preview' as const
const API_HOSTNAME = 'generativelanguage.googleapis.com' as const
const API_PATH = '/v1beta/models/lyria-3-pro-preview' as const
const API_ORIGIN = `https://${API_HOSTNAME}` as const
const MAXIMUM_RESPONSE_BYTES = 65_536
const MAXIMUM_INTERNAL_PRODUCTION_COST_MICROS = 10_000
const MAXIMUM_PLAN_WINDOW_MILLISECONDS = 10 * 60_000
const MAXIMUM_ACTIVE_AUTHORITIES = 256
const DEFAULT_REQUEST_TIMEOUT_MILLISECONDS = 15_000
const issuedPlans = new WeakMap<object, string>()
const issuedAuthorities = new WeakMap<object, string>()
const issuedAuthorityKeys = new Map<string, number>()
const consumedPlans = new Map<string, number>()
const consumedAuthorities = new Map<string, number>()
const secretLoaders = new WeakMap<object, 'google_secret_manager_live' | 'private_local_fixture'>()

export const MOTION_STUDIO_LYRIA_D3_ACCOUNT_ACCESS_AUTHORIZATION_ID =
  'MS-012D3-ACCOUNT-MODEL-ACCESS-EXT-001' as const
export const MOTION_STUDIO_LYRIA_D3_ACCEPTED_PREFLIGHT_DIGEST =
  'c0e774eff59d5d38b6529085447b9b077a11189756bf3dbdf97d582f7a9c1509' as const
export const MOTION_STUDIO_LYRIA_D3_ACCEPTED_EXTERNAL_READINESS_DIGEST =
  '7bbf2b98af5d04c9dee5c79edab3f43a1884773eea3c0f9106984e9eca01f7d9' as const
export const MOTION_STUDIO_LYRIA_D3_ACCOUNT_ACCESS_API_ORIGIN = API_ORIGIN
export const MOTION_STUDIO_LYRIA_D3_ACCOUNT_ACCESS_API_PATH = API_PATH
export const MOTION_STUDIO_LYRIA_D3_ACCOUNT_ACCESS_MAXIMUM_RESPONSE_BYTES =
  MAXIMUM_RESPONSE_BYTES
export const MOTION_STUDIO_LYRIA_D3_ACCOUNT_ACCESS_MAXIMUM_INTERNAL_PRODUCTION_COST_MICROS =
  MAXIMUM_INTERNAL_PRODUCTION_COST_MICROS

const GOOGLE_SECRET_MANAGER_PROCESS_ENVIRONMENT_ALLOWLIST = Object.freeze([
  'PATH',
  'HOME',
  'USER',
  'LOGNAME',
  'TMPDIR',
  'LANG',
  'LC_ALL',
  'LC_CTYPE',
] as const)
const MAXIMUM_PROCESS_ENVIRONMENT_VALUE_LENGTH = 8_192

export interface MotionStudioLyriaD3AccountAccessPlanV1 {
  schemaVersion: 'motion-studio.lyria-d3-account-model-access-plan.v1'
  planId: string
  sourcePreflightPlanId: string
  sourcePreflightDigest: typeof MOTION_STUDIO_LYRIA_D3_ACCEPTED_PREFLIGHT_DIGEST
  sourceExternalReadinessId: string
  sourceExternalReadinessDigest: typeof MOTION_STUDIO_LYRIA_D3_ACCEPTED_EXTERNAL_READINESS_DIGEST
  sourcePrivateIngestEvidenceId: string
  sourcePrivateIngestEvidenceDigest: string
  secretBindingId: string
  secretBindingDigest: string
  modelResourceName: typeof MODEL_RESOURCE_NAME
  apiOrigin: typeof API_ORIGIN
  requestPath: typeof API_PATH
  method: 'GET'
  credentialHeaderName: 'x-goog-api-key'
  requestBodyAllowed: false
  maximumSecretPayloadReads: 1
  maximumNetworkRequests: 1
  maximumDnsLookups: 1
  maximumAddressConnectionAttempts: 1
  ipv4Only: true
  addressFallbackAllowed: false
  maximumRedirects: 0
  maximumRetries: 0
  maximumFallbacks: 0
  maximumCapturedResponseBytes: typeof MAXIMUM_RESPONSE_BYTES
  providerGenerationAllowed: false
  purchaseAllowed: false
  accountMutationAllowed: false
  rawProviderResponsePersistenceAllowed: false
  privateLocalEvidenceOnly: true
  maximumInternalProductionCostMicros: typeof MAXIMUM_INTERNAL_PRODUCTION_COST_MICROS
  issuedAt: string
  expiresAt: string
  planDigest: string
  immutable: true
}

export interface MotionStudioLyriaD3AccountAccessExternalAuthorityV1 {
  schemaVersion: 'motion-studio.lyria-d3-account-model-access-external-authority.v1'
  authorizationId: typeof MOTION_STUDIO_LYRIA_D3_ACCOUNT_ACCESS_AUTHORIZATION_ID
  authorityPacketDigest: string
  ownerAuthorizationEvidenceId: string
  planId: string
  planDigest: string
  sourcePreflightDigest: typeof MOTION_STUDIO_LYRIA_D3_ACCEPTED_PREFLIGHT_DIGEST
  sourceExternalReadinessDigest: typeof MOTION_STUDIO_LYRIA_D3_ACCEPTED_EXTERNAL_READINESS_DIGEST
  sourcePrivateIngestEvidenceDigest: string
  secretBindingDigest: string
  modelResourceName: typeof MODEL_RESOURCE_NAME
  maximumSecretPayloadReads: 1
  maximumNetworkRequests: 1
  maximumDnsLookups: 1
  maximumAddressConnectionAttempts: 1
  maximumRedirects: 0
  maximumCapturedResponseBytes: typeof MAXIMUM_RESPONSE_BYTES
  providerGenerationAllowed: false
  purchaseAllowed: false
  accountMutationAllowed: false
  automaticRetryAllowed: false
  automaticFallbackAllowed: false
  maximumInternalProductionCostMicros: typeof MAXIMUM_INTERNAL_PRODUCTION_COST_MICROS
  privateLocalEvidenceOnly: true
  issuedAt: string
  expiresAt: string
  authorityDigest: string
  immutable: true
}

export interface MotionStudioLyriaD3AccountAccessEvidenceV1 {
  schemaVersion: 'motion-studio.lyria-d3-account-model-access-evidence.v1'
  state: 'provider_model_access_verified_funds_and_quota_unverified'
  evidenceClass: 'authenticated_provider_read_only' | 'private_local_fixture'
  planDigest: string
  externalAuthorityDigest: string
  sourcePreflightDigest: typeof MOTION_STUDIO_LYRIA_D3_ACCEPTED_PREFLIGHT_DIGEST
  sourceExternalReadinessDigest: typeof MOTION_STUDIO_LYRIA_D3_ACCEPTED_EXTERNAL_READINESS_DIGEST
  sourcePrivateIngestEvidenceDigest: string
  secretBindingDigest: string
  credentialSource: 'google_secret_manager' | 'private_local_fixture'
  credentialValueRead: true
  credentialValuePersisted: false
  providerRequestCount: 1
  dnsLookupCount: 1
  addressConnectionAttemptCount: 1
  providerGenerationCallMade: false
  purchasePerformed: false
  accountMutationPerformed: false
  automaticRetryPerformed: false
  automaticFallbackPerformed: false
  rawProviderResponsePersisted: false
  model: {
    name: typeof MODEL_RESOURCE_NAME
    baseModelId: string | null
    version: string | null
    displayName: string | null
    supportedGenerationMethods: readonly string[]
    responseBodyByteLength: number
    responseBodyDigest: string
    safeRequestIdDigest?: string
    modelMetadataDigest: string
  }
  accountCredentialAccepted: true
  exactModelResourceVisible: true
  providerAccountAccessVerified: true
  providerFundsOrQuotaVerified: false
  providerAccountAccessAndFundsGateResolved: false
  providerGenerationEligibilityVerified: false
  internalProductionCostMicros: 0
  customerPriceIncluded: false
  customerCreditsIncluded: false
  serviceFeeIncluded: false
  billingMutationPerformed: false
  capturedAt: string
  evidenceDigest: string
  immutable: true
}

export interface MotionStudioLyriaD3SecretValueLoader {
  access(input: {
    secretLocatorId: string
    secretVersionReference: string
  }): Promise<Buffer | Uint8Array | string>
}

export interface MotionStudioLyriaD3AccountAccessHttpReadResult {
  statusCode: number
  headers: Readonly<Record<string, string>>
  body: Buffer
  dnsLookupCount: 1
  addressConnectionAttemptCount: 1
}

export interface MotionStudioLyriaD3AccountAccessHttpReader {
  read(input: {
    url: typeof API_ORIGIN
    path: typeof API_PATH
    method: 'GET'
    headers: Readonly<{ accept: 'application/json'; 'x-goog-api-key': string }>
    body: undefined
    timeoutMilliseconds: number
  }): Promise<MotionStudioLyriaD3AccountAccessHttpReadResult>
}

export type MotionStudioLyriaD3AccountAccessSafeProgressEventV1 =
  | Readonly<{ phase: 'credential_read_started' }>
  | Readonly<{ phase: 'credential_read_completed' }>
  | Readonly<{ phase: 'provider_request_started' }>
  | Readonly<{ phase: 'provider_request_completed' }>
  | Readonly<{ phase: 'evidence_compiled' }>

export function createMotionStudioLyriaD3AccountAccessPlan(input: {
  preflight: MotionStudioLyriaD3PreflightPlanV1
  externalReadiness: MotionStudioLyriaD3ExternalReadinessV1
  privateIngestReadiness: MotionStudioLyriaD3PrivateIngestReadinessV1
  issuedAt: string
  expiresAt: string
}): MotionStudioLyriaD3AccountAccessPlanV1 {
  assertMotionStudioLyriaD3PreflightPlan(input.preflight)
  assertMotionStudioLyriaD3ExternalReadiness(input.externalReadiness)
  assertMotionStudioLyriaD3PrivateIngestReadiness(input.privateIngestReadiness)
  assertAcceptedLineage(input.preflight, input.externalReadiness, input.privateIngestReadiness)
  return createPlanFromAcceptedLineage({
    preflight: input.preflight,
    externalReadiness: input.externalReadiness,
    privateIngestEvidenceId: input.privateIngestReadiness.evidenceId,
    privateIngestEvidenceDigest: input.privateIngestReadiness.evidenceDigest,
    issuedAt: input.issuedAt,
    expiresAt: input.expiresAt,
  })
}

/**
 * Live-operator path for the already frozen D3 structural proof. The digest is
 * exact accepted evidence; this function does not rerun FFmpeg or create a new
 * private artifact merely to perform a read-only provider metadata check.
 */
export function createMotionStudioLyriaD3AccountAccessPlanFromAcceptedEvidence(input: {
  preflight: MotionStudioLyriaD3PreflightPlanV1
  externalReadiness: MotionStudioLyriaD3ExternalReadinessV1
  privateIngestEvidenceId: string
  privateIngestEvidenceDigest: string
  issuedAt: string
  expiresAt: string
}): MotionStudioLyriaD3AccountAccessPlanV1 {
  assertMotionStudioLyriaD3PreflightPlan(input.preflight)
  assertMotionStudioLyriaD3ExternalReadiness(input.externalReadiness)
  if (!STABLE_ID.test(input.privateIngestEvidenceId) ||
      !SHA256.test(input.privateIngestEvidenceDigest) ||
      input.preflight.preflightDigest !== MOTION_STUDIO_LYRIA_D3_ACCEPTED_PREFLIGHT_DIGEST ||
      input.externalReadiness.readinessDigest !==
        MOTION_STUDIO_LYRIA_D3_ACCEPTED_EXTERNAL_READINESS_DIGEST ||
      input.externalReadiness.sourcePreflightDigest !== input.preflight.preflightDigest ||
      !input.externalReadiness.blockingGateCodes.includes('private_ingest_normalization_and_qa') ||
      input.externalReadiness.providerExecutionAllowed || input.externalReadiness.singleUseAuthorityIssued) {
    blocked('Lyria account-access accepted-evidence plan lost its frozen D3 lineage.')
  }
  return createPlanFromAcceptedLineage(input)
}

function createPlanFromAcceptedLineage(input: {
  preflight: MotionStudioLyriaD3PreflightPlanV1
  externalReadiness: MotionStudioLyriaD3ExternalReadinessV1
  privateIngestEvidenceId: string
  privateIngestEvidenceDigest: string
  issuedAt: string
  expiresAt: string
}): MotionStudioLyriaD3AccountAccessPlanV1 {
  const issuedAt = exactIso(input.issuedAt, 'Lyria account-access plan issue time')
  const expiresAt = exactIso(input.expiresAt, 'Lyria account-access plan expiry time')
  const duration = Date.parse(expiresAt) - Date.parse(issuedAt)
  if (
    duration <= 0 || duration > MAXIMUM_PLAN_WINDOW_MILLISECONDS ||
    issuedAt < input.externalReadiness.createdAt || expiresAt > input.preflight.expiresAt
  ) blocked('Lyria account-access plan must use one current positive window no longer than ten minutes.')
  const binding = input.externalReadiness.secretBinding
  const base = {
    schemaVersion: 'motion-studio.lyria-d3-account-model-access-plan.v1' as const,
    planId: `ms012d3-account-access-${input.preflight.preflightDigest.slice(0, 16)}`,
    sourcePreflightPlanId: input.preflight.preflightPlanId,
    sourcePreflightDigest: MOTION_STUDIO_LYRIA_D3_ACCEPTED_PREFLIGHT_DIGEST,
    sourceExternalReadinessId: input.externalReadiness.readinessId,
    sourceExternalReadinessDigest: MOTION_STUDIO_LYRIA_D3_ACCEPTED_EXTERNAL_READINESS_DIGEST,
    sourcePrivateIngestEvidenceId: input.privateIngestEvidenceId,
    sourcePrivateIngestEvidenceDigest: input.privateIngestEvidenceDigest,
    secretBindingId: binding.bindingId,
    secretBindingDigest: binding.bindingDigest,
    modelResourceName: MODEL_RESOURCE_NAME,
    apiOrigin: API_ORIGIN,
    requestPath: API_PATH,
    method: 'GET' as const,
    credentialHeaderName: 'x-goog-api-key' as const,
    requestBodyAllowed: false as const,
    maximumSecretPayloadReads: 1 as const,
    maximumNetworkRequests: 1 as const,
    maximumDnsLookups: 1 as const,
    maximumAddressConnectionAttempts: 1 as const,
    ipv4Only: true as const,
    addressFallbackAllowed: false as const,
    maximumRedirects: 0 as const,
    maximumRetries: 0 as const,
    maximumFallbacks: 0 as const,
    maximumCapturedResponseBytes: MAXIMUM_RESPONSE_BYTES as typeof MAXIMUM_RESPONSE_BYTES,
    providerGenerationAllowed: false as const,
    purchaseAllowed: false as const,
    accountMutationAllowed: false as const,
    rawProviderResponsePersistenceAllowed: false as const,
    privateLocalEvidenceOnly: true as const,
    maximumInternalProductionCostMicros:
      MAXIMUM_INTERNAL_PRODUCTION_COST_MICROS as typeof MAXIMUM_INTERNAL_PRODUCTION_COST_MICROS,
    issuedAt,
    expiresAt,
    immutable: true as const,
  }
  const plan = Object.freeze({ ...base, planDigest: sha256CanonicalJson(base) })
  issuedPlans.set(plan, plan.planDigest)
  return plan
}

export function createMotionStudioLyriaD3AccountAccessExternalAuthority(input: {
  plan: MotionStudioLyriaD3AccountAccessPlanV1
  authorityPacketDigest: string
  ownerAuthorizationEvidenceId: string
  issuedAt: string
  expiresAt: string
}): MotionStudioLyriaD3AccountAccessExternalAuthorityV1 {
  assertPlan(input.plan, input.issuedAt)
  if (!SHA256.test(input.authorityPacketDigest)) invalid('Lyria account-access packet digest is malformed.')
  if (!STABLE_ID.test(input.ownerAuthorizationEvidenceId)) {
    invalid('Lyria account-access owner authorization evidence ID is malformed.')
  }
  const issuedAt = exactIso(input.issuedAt, 'Lyria account-access authority issue time')
  const expiresAt = exactIso(input.expiresAt, 'Lyria account-access authority expiry time')
  if (
    issuedAt < input.plan.issuedAt || expiresAt > input.plan.expiresAt ||
    Date.parse(expiresAt) <= Date.parse(issuedAt)
  ) blocked('Lyria account-access authority must remain inside its exact plan window.')
  pruneExpired(issuedAuthorityKeys, Date.parse(issuedAt))
  const issueKey = sha256CanonicalJson({
    authorizationId: MOTION_STUDIO_LYRIA_D3_ACCOUNT_ACCESS_AUTHORIZATION_ID,
    authorityPacketDigest: input.authorityPacketDigest,
    ownerAuthorizationEvidenceId: input.ownerAuthorizationEvidenceId,
    planDigest: input.plan.planDigest,
  })
  if (issuedAuthorityKeys.has(issueKey)) blocked('Lyria account-access packet already issued one authority.')
  if (issuedAuthorityKeys.size >= MAXIMUM_ACTIVE_AUTHORITIES) blocked('Lyria account-access authority guard is full.')
  const base = {
    schemaVersion: 'motion-studio.lyria-d3-account-model-access-external-authority.v1' as const,
    authorizationId: MOTION_STUDIO_LYRIA_D3_ACCOUNT_ACCESS_AUTHORIZATION_ID,
    authorityPacketDigest: input.authorityPacketDigest,
    ownerAuthorizationEvidenceId: input.ownerAuthorizationEvidenceId,
    planId: input.plan.planId,
    planDigest: input.plan.planDigest,
    sourcePreflightDigest: MOTION_STUDIO_LYRIA_D3_ACCEPTED_PREFLIGHT_DIGEST,
    sourceExternalReadinessDigest: MOTION_STUDIO_LYRIA_D3_ACCEPTED_EXTERNAL_READINESS_DIGEST,
    sourcePrivateIngestEvidenceDigest: input.plan.sourcePrivateIngestEvidenceDigest,
    secretBindingDigest: input.plan.secretBindingDigest,
    modelResourceName: MODEL_RESOURCE_NAME,
    maximumSecretPayloadReads: 1 as const,
    maximumNetworkRequests: 1 as const,
    maximumDnsLookups: 1 as const,
    maximumAddressConnectionAttempts: 1 as const,
    maximumRedirects: 0 as const,
    maximumCapturedResponseBytes: MAXIMUM_RESPONSE_BYTES as typeof MAXIMUM_RESPONSE_BYTES,
    providerGenerationAllowed: false as const,
    purchaseAllowed: false as const,
    accountMutationAllowed: false as const,
    automaticRetryAllowed: false as const,
    automaticFallbackAllowed: false as const,
    maximumInternalProductionCostMicros:
      MAXIMUM_INTERNAL_PRODUCTION_COST_MICROS as typeof MAXIMUM_INTERNAL_PRODUCTION_COST_MICROS,
    privateLocalEvidenceOnly: true as const,
    issuedAt,
    expiresAt,
    immutable: true as const,
  }
  const authority = Object.freeze({ ...base, authorityDigest: sha256CanonicalJson(base) })
  issuedAuthorities.set(authority, authority.authorityDigest)
  issuedAuthorityKeys.set(issueKey, Date.parse(expiresAt))
  return authority
}

export function createMotionStudioLyriaD3AccountAccessLiveSecretLoader(input: {
  projectId?: typeof MOTION_STUDIO_LYRIA_D3_GOOGLE_CLOUD_PROJECT_ID
  timeoutMilliseconds?: number
} = {}): MotionStudioLyriaD3SecretValueLoader {
  return createSecretLoader({ ...input, evidenceClass: 'google_secret_manager_live' })
}

export function createMotionStudioLyriaD3AccountAccessFixtureSecretLoader(input: {
  projectId?: typeof MOTION_STUDIO_LYRIA_D3_GOOGLE_CLOUD_PROJECT_ID
  timeoutMilliseconds?: number
  commandRunner: (command: string, args: readonly string[]) => Promise<Buffer | Uint8Array | string>
}): MotionStudioLyriaD3SecretValueLoader {
  return createSecretLoader({ ...input, evidenceClass: 'private_local_fixture' })
}

export function createMotionStudioLyriaD3AccountAccessLiveHttpReader():
MotionStudioLyriaD3AccountAccessHttpReader {
  return Object.freeze({ read: readLiveModelMetadata })
}

export function createMotionStudioLyriaD3AccountAccessTransport(input: {
  plan: MotionStudioLyriaD3AccountAccessPlanV1
  externalAuthority: MotionStudioLyriaD3AccountAccessExternalAuthorityV1
  secretLoader: MotionStudioLyriaD3SecretValueLoader
  httpReader: MotionStudioLyriaD3AccountAccessHttpReader
  evidenceClass: 'authenticated_provider_read_only' | 'private_local_fixture'
  requestTimeoutMilliseconds?: number
  onSafeProgress?: (event: MotionStudioLyriaD3AccountAccessSafeProgressEventV1) => void
}): { execute(now: string): Promise<MotionStudioLyriaD3AccountAccessEvidenceV1> } {
  const timeoutMilliseconds = input.requestTimeoutMilliseconds ?? DEFAULT_REQUEST_TIMEOUT_MILLISECONDS
  if (!Number.isSafeInteger(timeoutMilliseconds) || timeoutMilliseconds < 1_000 || timeoutMilliseconds > 30_000) {
    invalid('Lyria account-access request timeout must be between one and 30 seconds.')
  }
  const loaderClass = secretLoaders.get(input.secretLoader)
  if (
    (input.evidenceClass === 'authenticated_provider_read_only' && loaderClass !== 'google_secret_manager_live') ||
    (input.evidenceClass === 'private_local_fixture' && loaderClass !== 'private_local_fixture')
  ) blocked('Lyria account-access transport and Secret Manager loader classes do not match.')
  return Object.freeze({
    async execute(now: string) {
      const executionTime = assertPlan(input.plan, now)
      assertExternalAuthority(input.externalAuthority, input.plan, now)
      pruneExpired(consumedPlans, executionTime)
      pruneExpired(consumedAuthorities, executionTime)
      if (consumedPlans.has(input.plan.planDigest) ||
          consumedAuthorities.has(input.externalAuthority.authorityDigest)) {
        blocked('Lyria account-access plan or authority has already been consumed.')
      }
      if (consumedPlans.size >= MAXIMUM_ACTIVE_AUTHORITIES ||
          consumedAuthorities.size >= MAXIMUM_ACTIVE_AUTHORITIES) {
        blocked('Lyria account-access consumption guard is full.')
      }
      consumedPlans.set(input.plan.planDigest, Date.parse(input.plan.expiresAt))
      consumedAuthorities.set(input.externalAuthority.authorityDigest,
        Date.parse(input.externalAuthority.expiresAt))

      emit(input.onSafeProgress, { phase: 'credential_read_started' })
      let rawSecret: Buffer | Uint8Array | string
      try {
        rawSecret = await input.secretLoader.access({
          secretLocatorId: MOTION_STUDIO_LYRIA_D3_SECRET_LOCATOR_ID,
          secretVersionReference: MOTION_STUDIO_LYRIA_D3_SECRET_VERSION,
        })
      } catch {
        blocked('The pinned Lyria account-access credential could not be accessed.')
      }
      const apiKey = validateSecretValue(rawSecret)
      emit(input.onSafeProgress, { phase: 'credential_read_completed' })
      emit(input.onSafeProgress, { phase: 'provider_request_started' })
      let response: MotionStudioLyriaD3AccountAccessHttpReadResult
      try {
        response = await input.httpReader.read({
          url: API_ORIGIN,
          path: API_PATH,
          method: 'GET',
          headers: Object.freeze({ accept: 'application/json' as const, 'x-goog-api-key': apiKey }),
          body: undefined,
          timeoutMilliseconds,
        })
      } catch (error) {
        if (error instanceof ApiError) throw error
        blocked('Lyria account-access model metadata read failed without retrying.')
      }
      emit(input.onSafeProgress, { phase: 'provider_request_completed' })
      if (response.dnsLookupCount !== 1 || response.addressConnectionAttemptCount !== 1) {
        blocked('Lyria account-access read exceeded its one-address transport boundary.')
      }
      if (response.body.byteLength > MAXIMUM_RESPONSE_BYTES) {
        blocked('Lyria account-access response exceeded its private byte ceiling.')
      }
      if (response.statusCode < 200 || response.statusCode >= 300) {
        blocked(`Lyria account-access read was rejected with HTTP ${response.statusCode}.`)
      }
      const contentType = response.headers['content-type']?.split(';')[0]?.trim().toLowerCase()
      if (contentType !== 'application/json') {
        blocked('Lyria account-access read returned an unexpected content type.')
      }
      const parsed = parseModelResponse(response.body)
      const responseBodyDigest = sha256Bytes(response.body)
      const requestId = response.headers['x-request-id'] ?? response.headers['x-goog-request-id']
      const safeRequestIdDigest = requestId ? sha256Text(requestId) : undefined
      const modelBase = {
        ...parsed,
        responseBodyByteLength: response.body.byteLength,
        responseBodyDigest,
        ...(safeRequestIdDigest ? { safeRequestIdDigest } : {}),
      }
      const model = Object.freeze({
        ...modelBase,
        modelMetadataDigest: sha256CanonicalJson(modelBase),
      })
      const base = {
        schemaVersion: 'motion-studio.lyria-d3-account-model-access-evidence.v1' as const,
        state: 'provider_model_access_verified_funds_and_quota_unverified' as const,
        evidenceClass: input.evidenceClass,
        planDigest: input.plan.planDigest,
        externalAuthorityDigest: input.externalAuthority.authorityDigest,
        sourcePreflightDigest: MOTION_STUDIO_LYRIA_D3_ACCEPTED_PREFLIGHT_DIGEST,
        sourceExternalReadinessDigest: MOTION_STUDIO_LYRIA_D3_ACCEPTED_EXTERNAL_READINESS_DIGEST,
        sourcePrivateIngestEvidenceDigest: input.plan.sourcePrivateIngestEvidenceDigest,
        secretBindingDigest: input.plan.secretBindingDigest,
        credentialSource: input.evidenceClass === 'authenticated_provider_read_only'
          ? 'google_secret_manager' as const
          : 'private_local_fixture' as const,
        credentialValueRead: true as const,
        credentialValuePersisted: false as const,
        providerRequestCount: 1 as const,
        dnsLookupCount: 1 as const,
        addressConnectionAttemptCount: 1 as const,
        providerGenerationCallMade: false as const,
        purchasePerformed: false as const,
        accountMutationPerformed: false as const,
        automaticRetryPerformed: false as const,
        automaticFallbackPerformed: false as const,
        rawProviderResponsePersisted: false as const,
        model,
        accountCredentialAccepted: true as const,
        exactModelResourceVisible: true as const,
        providerAccountAccessVerified: true as const,
        providerFundsOrQuotaVerified: false as const,
        providerAccountAccessAndFundsGateResolved: false as const,
        providerGenerationEligibilityVerified: false as const,
        internalProductionCostMicros: 0 as const,
        customerPriceIncluded: false as const,
        customerCreditsIncluded: false as const,
        serviceFeeIncluded: false as const,
        billingMutationPerformed: false as const,
        capturedAt: exactIso(now, 'Lyria account-access capture time'),
        immutable: true as const,
      }
      const evidence = deepFreeze({ ...base, evidenceDigest: sha256CanonicalJson(base) })
      emit(input.onSafeProgress, { phase: 'evidence_compiled' })
      return evidence
    },
  })
}

function assertAcceptedLineage(
  preflight: MotionStudioLyriaD3PreflightPlanV1,
  readiness: MotionStudioLyriaD3ExternalReadinessV1,
  privateIngest: MotionStudioLyriaD3PrivateIngestReadinessV1,
): void {
  if (
    preflight.preflightDigest !== MOTION_STUDIO_LYRIA_D3_ACCEPTED_PREFLIGHT_DIGEST ||
    readiness.readinessDigest !== MOTION_STUDIO_LYRIA_D3_ACCEPTED_EXTERNAL_READINESS_DIGEST ||
    readiness.sourcePreflightDigest !== preflight.preflightDigest ||
    privateIngest.sourcePreflightDigest !== preflight.preflightDigest ||
    privateIngest.sourceExternalReadinessDigest !== readiness.readinessDigest ||
    !privateIngest.blockingGateCodes.includes('provider_account_access_and_funds') ||
    privateIngest.providerExecutionAllowed || privateIngest.singleUseAuthorityIssued
  ) blocked('Lyria account-access preflight requires the exact accepted still-blocked D3 lineage.')
}

function assertPlan(plan: MotionStudioLyriaD3AccountAccessPlanV1, now: string): number {
  const issuedDigest = issuedPlans.get(plan)
  const { planDigest, ...base } = plan
  if (
    !issuedDigest || issuedDigest !== planDigest || !SHA256.test(planDigest) ||
    sha256CanonicalJson(base) !== planDigest || !Object.isFrozen(plan) || plan.immutable !== true ||
    plan.sourcePreflightDigest !== MOTION_STUDIO_LYRIA_D3_ACCEPTED_PREFLIGHT_DIGEST ||
    plan.sourceExternalReadinessDigest !== MOTION_STUDIO_LYRIA_D3_ACCEPTED_EXTERNAL_READINESS_DIGEST ||
    !SHA256.test(plan.sourcePrivateIngestEvidenceDigest) ||
    plan.modelResourceName !== MODEL_RESOURCE_NAME || plan.apiOrigin !== API_ORIGIN ||
    plan.requestPath !== API_PATH || plan.method !== 'GET' || plan.requestBodyAllowed !== false ||
    plan.maximumSecretPayloadReads !== 1 || plan.maximumNetworkRequests !== 1 ||
    plan.maximumDnsLookups !== 1 || plan.maximumAddressConnectionAttempts !== 1 ||
    plan.ipv4Only !== true || plan.addressFallbackAllowed !== false ||
    plan.maximumRedirects !== 0 || plan.maximumRetries !== 0 || plan.maximumFallbacks !== 0 ||
    plan.maximumCapturedResponseBytes !== MAXIMUM_RESPONSE_BYTES ||
    plan.providerGenerationAllowed !== false || plan.purchaseAllowed !== false ||
    plan.accountMutationAllowed !== false || plan.rawProviderResponsePersistenceAllowed !== false ||
    plan.privateLocalEvidenceOnly !== true ||
    plan.maximumInternalProductionCostMicros !== MAXIMUM_INTERNAL_PRODUCTION_COST_MICROS
  ) blocked('Lyria account-access plan failed its exact immutable read-only contract.')
  const current = Date.parse(exactIso(now, 'Lyria account-access execution time'))
  if (current < Date.parse(plan.issuedAt) || current > Date.parse(plan.expiresAt)) {
    blocked('Lyria account-access plan is outside its exact execution window.')
  }
  return current
}

function assertExternalAuthority(
  authority: MotionStudioLyriaD3AccountAccessExternalAuthorityV1,
  plan: MotionStudioLyriaD3AccountAccessPlanV1,
  now: string,
): void {
  const issuedDigest = issuedAuthorities.get(authority)
  const { authorityDigest, ...base } = authority
  if (
    !issuedDigest || issuedDigest !== authorityDigest || !SHA256.test(authorityDigest) ||
    sha256CanonicalJson(base) !== authorityDigest || !Object.isFrozen(authority) ||
    authority.immutable !== true ||
    authority.authorizationId !== MOTION_STUDIO_LYRIA_D3_ACCOUNT_ACCESS_AUTHORIZATION_ID ||
    authority.planId !== plan.planId || authority.planDigest !== plan.planDigest ||
    authority.secretBindingDigest !== plan.secretBindingDigest ||
    authority.sourcePreflightDigest !== plan.sourcePreflightDigest ||
    authority.sourceExternalReadinessDigest !== plan.sourceExternalReadinessDigest ||
    authority.sourcePrivateIngestEvidenceDigest !== plan.sourcePrivateIngestEvidenceDigest ||
    authority.modelResourceName !== MODEL_RESOURCE_NAME ||
    authority.maximumSecretPayloadReads !== 1 || authority.maximumNetworkRequests !== 1 ||
    authority.maximumDnsLookups !== 1 || authority.maximumAddressConnectionAttempts !== 1 ||
    authority.maximumRedirects !== 0 || authority.maximumCapturedResponseBytes !== MAXIMUM_RESPONSE_BYTES ||
    authority.providerGenerationAllowed !== false || authority.purchaseAllowed !== false ||
    authority.accountMutationAllowed !== false || authority.automaticRetryAllowed !== false ||
    authority.automaticFallbackAllowed !== false || authority.privateLocalEvidenceOnly !== true ||
    authority.maximumInternalProductionCostMicros !== MAXIMUM_INTERNAL_PRODUCTION_COST_MICROS
  ) blocked('Lyria account-access external authority failed its exact read-only contract.')
  const current = Date.parse(exactIso(now, 'Lyria account-access authority execution time'))
  if (current < Date.parse(authority.issuedAt) || current > Date.parse(authority.expiresAt)) {
    blocked('Lyria account-access external authority is outside its exact execution window.')
  }
}

function createSecretLoader(input: {
  projectId?: typeof MOTION_STUDIO_LYRIA_D3_GOOGLE_CLOUD_PROJECT_ID
  timeoutMilliseconds?: number
  evidenceClass: 'google_secret_manager_live' | 'private_local_fixture'
  commandRunner?: (command: string, args: readonly string[]) => Promise<Buffer | Uint8Array | string>
}): MotionStudioLyriaD3SecretValueLoader {
  const projectId = input.projectId ?? MOTION_STUDIO_LYRIA_D3_GOOGLE_CLOUD_PROJECT_ID
  if (projectId !== MOTION_STUDIO_LYRIA_D3_GOOGLE_CLOUD_PROJECT_ID) {
    blocked('Lyria account-access Secret Manager loader targets the wrong project.')
  }
  const timeoutMilliseconds = input.timeoutMilliseconds ?? DEFAULT_REQUEST_TIMEOUT_MILLISECONDS
  if (!Number.isSafeInteger(timeoutMilliseconds) || timeoutMilliseconds < 1_000 ||
      timeoutMilliseconds > 30_000) {
    invalid('Lyria account-access Secret Manager timeout must be between one and 30 seconds.')
  }
  const environment = input.commandRunner ? undefined : createSecretManagerProcessEnvironment()
  const commandRunner = input.commandRunner ?? ((command: string, args: readonly string[]) =>
    executeGcloud(command, args, timeoutMilliseconds, environment!))
  const loader = Object.freeze({
    async access({ secretLocatorId, secretVersionReference }: {
      secretLocatorId: string
      secretVersionReference: string
    }): Promise<Buffer | Uint8Array | string> {
      if (!GOOGLE_SECRET_ID.test(secretLocatorId) ||
          secretLocatorId !== MOTION_STUDIO_LYRIA_D3_SECRET_LOCATOR_ID) {
        blocked('Lyria account-access Secret Manager read requires the pinned secret ID.')
      }
      if (!/^[1-9]\d{0,18}$/.test(secretVersionReference) ||
          secretVersionReference !== MOTION_STUDIO_LYRIA_D3_SECRET_VERSION) {
        blocked('Lyria account-access Secret Manager read requires pinned numeric version 1.')
      }
      try {
        return await commandRunner(MOTION_STUDIO_LYRIA_D3_GCLOUD_BINARY_PATH, [
          'secrets', 'versions', 'access', secretVersionReference,
          `--secret=${secretLocatorId}`,
          `--project=${projectId}`,
          '--quiet',
        ])
      } catch {
        blocked('Google Secret Manager access failed without exposing the Lyria credential.')
      }
    },
  })
  secretLoaders.set(loader, input.evidenceClass)
  return loader
}

function createSecretManagerProcessEnvironment(
  source: Readonly<NodeJS.ProcessEnv> = process.env,
): NodeJS.ProcessEnv {
  const environment = Object.create(null) as NodeJS.ProcessEnv
  environment.CLOUDSDK_CORE_DISABLE_PROMPTS = '1'
  for (const key of GOOGLE_SECRET_MANAGER_PROCESS_ENVIRONMENT_ALLOWLIST) {
    const value = source[key]
    if (value === undefined || value.length === 0) continue
    if (value.length > MAXIMUM_PROCESS_ENVIRONMENT_VALUE_LENGTH || value.includes('\0')) {
      blocked('Lyria account-access Secret Manager environment contains an unsafe value.')
    }
    environment[key] = value
  }
  return Object.freeze(environment) as NodeJS.ProcessEnv
}

async function executeGcloud(
  command: string,
  args: readonly string[],
  timeoutMilliseconds: number,
  environment: NodeJS.ProcessEnv,
): Promise<Buffer> {
  await assertPinnedGcloudIdentity(command)
  return new Promise((resolve, reject) => {
    execFile(command, [...args], {
      encoding: 'buffer',
      maxBuffer: 64 * 1024,
      timeout: timeoutMilliseconds,
      windowsHide: true,
      env: environment,
    }, (error, stdout) => {
      if (error) {
        reject(new Error('Redacted Google Secret Manager command failure.'))
        return
      }
      resolve(Buffer.isBuffer(stdout) ? stdout : Buffer.from(stdout))
    })
  })
}

async function assertPinnedGcloudIdentity(command: string): Promise<void> {
  if (command !== MOTION_STUDIO_LYRIA_D3_GCLOUD_BINARY_PATH) {
    blocked('Lyria account-access Secret Manager execution requires the pinned Cloud SDK path.')
  }
  let bytes: Buffer
  try {
    bytes = await readFile(command)
  } catch {
    blocked('The pinned Lyria Secret Manager Cloud SDK runtime is unavailable.')
  }
  if (
    bytes.byteLength !== MOTION_STUDIO_LYRIA_D3_GCLOUD_BINARY_BYTE_LENGTH ||
    sha256Bytes(bytes) !== MOTION_STUDIO_LYRIA_D3_GCLOUD_BINARY_SHA256
  ) blocked('The pinned Lyria Secret Manager Cloud SDK runtime identity changed.')
}

async function readLiveModelMetadata(input: {
  url: typeof API_ORIGIN
  path: typeof API_PATH
  method: 'GET'
  headers: Readonly<{ accept: 'application/json'; 'x-goog-api-key': string }>
  body: undefined
  timeoutMilliseconds: number
}): Promise<MotionStudioLyriaD3AccountAccessHttpReadResult> {
  if (
    input.url !== API_ORIGIN || input.path !== API_PATH || input.method !== 'GET' ||
    input.body !== undefined || input.headers.accept !== 'application/json' ||
    validateSecretValue(input.headers['x-goog-api-key']) !== input.headers['x-goog-api-key']
  ) blocked('Lyria account-access HTTP reader received an unauthorized request shape.')
  let dnsLookupCount = 0
  let addressConnectionAttemptCount = 0
  return new Promise((resolve, reject) => {
    let settled = false
    const finishError = (message: string) => {
      if (settled) return
      settled = true
      reject(new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', message, 409))
    }
    const request = httpsRequest({
      protocol: 'https:',
      hostname: API_HOSTNAME,
      port: 443,
      path: API_PATH,
      method: 'GET',
      agent: false,
      headers: {
        accept: 'application/json',
        'x-goog-api-key': input.headers['x-goog-api-key'],
      },
      lookup(hostname, _options, callback) {
        dnsLookupCount += 1
        if (dnsLookupCount > 1 || hostname !== API_HOSTNAME) {
          callback(new Error('Lyria account-access DNS boundary exceeded.'), '', 4)
          return
        }
        dnsLookup(hostname, { family: 4, all: false }, (error, address) => {
          if (error || typeof address !== 'string' || address.length < 7) {
            callback(error ?? new Error('Lyria account-access IPv4 lookup failed.'), '', 4)
            return
          }
          callback(null, address, 4)
        })
      },
    }, (response) => {
      const chunks: Buffer[] = []
      let byteLength = 0
      response.on('data', (chunk: Buffer | Uint8Array | string) => {
        const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
        byteLength += bytes.byteLength
        if (byteLength > MAXIMUM_RESPONSE_BYTES) {
          request.destroy()
          response.destroy()
          finishError('Lyria account-access response exceeded its private byte ceiling.')
          return
        }
        chunks.push(bytes)
      })
      response.on('end', () => {
        if (settled) return
        if (dnsLookupCount !== 1 || addressConnectionAttemptCount !== 1) {
          finishError('Lyria account-access read did not preserve one DNS and one connection attempt.')
          return
        }
        settled = true
        const headers: Record<string, string> = {}
        for (const [key, value] of Object.entries(response.headers)) {
          if (typeof value === 'string') headers[key.toLowerCase()] = value
          else if (Array.isArray(value)) headers[key.toLowerCase()] = value.join(', ')
        }
        resolve(Object.freeze({
          statusCode: response.statusCode ?? 0,
          headers: Object.freeze(headers),
          body: Buffer.concat(chunks, byteLength),
          dnsLookupCount: 1 as const,
          addressConnectionAttemptCount: 1 as const,
        }))
      })
      response.on('error', () => finishError('Lyria account-access response failed without retrying.'))
    })
    request.once('socket', (socket) => {
      addressConnectionAttemptCount += 1
      if (addressConnectionAttemptCount > 1) {
        socket.destroy()
        finishError('Lyria account-access attempted more than one address connection.')
      }
    })
    request.setTimeout(input.timeoutMilliseconds, () => {
      request.destroy()
      finishError('Lyria account-access read timed out without retrying.')
    })
    request.once('error', () => finishError('Lyria account-access network read failed without retrying.'))
    request.end()
  })
}

function parseModelResponse(body: Buffer): {
  name: typeof MODEL_RESOURCE_NAME
  baseModelId: string | null
  version: string | null
  displayName: string | null
  supportedGenerationMethods: readonly string[]
} {
  let value: unknown
  try {
    value = JSON.parse(body.toString('utf8'))
  } catch {
    blocked('Lyria account-access response is malformed JSON.')
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    blocked('Lyria account-access model response is malformed.')
  }
  const model = value as Record<string, unknown>
  if (model.name !== MODEL_RESOURCE_NAME) {
    blocked('Lyria account-access response does not identify the exact model resource.')
  }
  const methods = model.supportedGenerationMethods === undefined
    ? []
    : safeStringArray(model.supportedGenerationMethods, 'supported generation methods', 64, 128)
  return {
    name: MODEL_RESOURCE_NAME,
    baseModelId: optionalSafeText(model.baseModelId, 'base model ID', 160),
    version: optionalSafeText(model.version, 'model version', 160),
    displayName: optionalSafeText(model.displayName, 'model display name', 256),
    supportedGenerationMethods: Object.freeze(methods),
  }
}

function validateSecretValue(raw: Buffer | Uint8Array | string): string {
  const value = (typeof raw === 'string' ? raw : Buffer.from(raw).toString('utf8')).trim()
  if (value.length < 16 || value.length > 4_096 || /\s/.test(value)) {
    blocked('The pinned Lyria account-access credential value is malformed.')
  }
  return value
}

function optionalSafeText(value: unknown, label: string, maximumLength: number): string | null {
  if (value === undefined || value === null) return null
  if (typeof value !== 'string' || value.length < 1 || value.length > maximumLength ||
      value.includes('\0')) blocked(`Lyria account-access ${label} is malformed.`)
  return value
}

function safeStringArray(
  value: unknown,
  label: string,
  maximumEntries: number,
  maximumEntryLength: number,
): string[] {
  if (!Array.isArray(value) || value.length > maximumEntries || value.some((entry) =>
    typeof entry !== 'string' || entry.length < 1 || entry.length > maximumEntryLength || entry.includes('\0'))) {
    blocked(`Lyria account-access ${label} is malformed.`)
  }
  return [...value] as string[]
}

function emit(
  observer: ((event: MotionStudioLyriaD3AccountAccessSafeProgressEventV1) => void) | undefined,
  event: MotionStudioLyriaD3AccountAccessSafeProgressEventV1,
): void {
  observer?.(Object.freeze(event))
}

function pruneExpired(values: Map<string, number>, now: number): void {
  for (const [key, expiresAt] of values) if (expiresAt < now) values.delete(key)
}

function exactIso(value: string, label: string): string {
  if (typeof value !== 'string' || !value.endsWith('Z') || Number.isNaN(Date.parse(value)) ||
      new Date(value).toISOString() !== value) invalid(`${label} must be canonical ISO-8601.`)
  return value
}

function sha256Bytes(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function sha256Text(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
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
