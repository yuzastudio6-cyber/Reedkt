import { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'
import { resolve4 } from 'node:dns/promises'
import { lstat, mkdir, readFile, realpath, writeFile } from 'node:fs/promises'
import { request as httpsRequest } from 'node:https'
import { isIP } from 'node:net'
import { join, resolve, sep } from 'node:path'

import { z } from 'zod'

import { ApiError } from '../../errors/api-error'
import { sha256CanonicalJson } from '../commands/canonical-json'
import {
  MOTION_STUDIO_SPEECH_ELEVENLABS_SECRET_LOCATOR_ID,
  MOTION_STUDIO_SPEECH_ELEVENLABS_SECRET_VERSION,
  MOTION_STUDIO_SPEECH_GCLOUD_BINARY_BYTE_LENGTH,
  MOTION_STUDIO_SPEECH_GCLOUD_BINARY_PATH,
  MOTION_STUDIO_SPEECH_GCLOUD_BINARY_SHA256,
  MOTION_STUDIO_SPEECH_GCLOUD_SDK_VERSION,
  MOTION_STUDIO_SPEECH_GOOGLE_CLOUD_PROJECT_ID,
  assertMotionStudioSpeechLiveGoogleSecretManagerLoader,
  createMotionStudioSpeechGoogleSecretManagerValueLoader,
} from './live-credential'
import { loadMotionStudioSpeechVoiceCatalogPrivateAcceptanceEvidence } from './voice-catalog-discovery'

const AUTHORIZATION_ID = 'MS-012C2-ZERO-RETENTION-HISTORY-DIAGNOSTIC-EXT-009' as const
const PACKET_RELATIVE_PATH =
  'tasks/motion-studio/MS-012C/c2-zero-retention-history-diagnostic-live-authorization-request-ext-009.json' as const
const AUTHORIZATION_RECORD_RELATIVE_PATH =
  'tasks/motion-studio/MS-012C/c2-zero-retention-history-diagnostic-live-authorization-record-ext-009.json' as const
const TARGET_PACKET_RELATIVE_PATH =
  'tasks/motion-studio/MS-012C/c2-zero-retention-qualification-live-authorization-request-ext-008.json' as const
const TARGET_AUTHORIZATION_RECORD_RELATIVE_PATH =
  'tasks/motion-studio/MS-012C/c2-zero-retention-qualification-live-authorization-record-ext-008.json' as const
const TARGET_RESULT_RELATIVE_PATH =
  'tasks/motion-studio/MS-012C/c2-zero-retention-qualification-live-result-ext-008.json' as const
const DECISION_RELATIVE_PATH =
  'tasks/motion-studio/MS-012C/c2-private-acceptance-voice-selection-decision.json' as const
const PRIVATE_RUN_ROOT_RELATIVE_PATH =
  '.reeditpro-local-storage-ms012c2-zero-retention-history-diagnostic-ext-009' as const
const CONSUMPTION_FILENAME = 'authority-consumed.json' as const
const EVIDENCE_FILENAME = 'private-history-diagnostic-evidence.json' as const
const FAILURE_FILENAME = 'terminal-failure.json' as const

const PROVIDER_HOSTNAME = 'api.elevenlabs.io' as const
const HISTORY_PATH = '/v1/history' as const
const MODEL_ID = 'eleven_v3' as const
const HISTORY_PAGE_SIZE = 100
const HISTORY_DATE_AFTER_SAFETY_WINDOW_SECONDS = 60
const REQUEST_TIMEOUT_MILLISECONDS = 30_000
const MAXIMUM_RESPONSE_BYTES = 1024 * 1024
const MAXIMUM_PACKET_BYTES = 192 * 1024
const MAXIMUM_AUTHORIZATION_RECORD_BYTES = 64 * 1024
const MAXIMUM_REVIEWED_FILE_BYTES = 4 * 1024 * 1024
const MAXIMUM_INTERNAL_PRODUCTION_COST_MICROS = 100_000
const ZERO_RETENTION_SOURCE_URL =
  'https://elevenlabs.io/docs/eleven-api/resources/zero-retention-mode' as const
const HISTORY_ENDPOINT_SOURCE_URL =
  'https://elevenlabs.io/docs/api-reference/history/list' as const
const OWNER_STANDING_DIRECTIVE_ID = 'MS-OWNER-STANDING-IMPLEMENTATION-QA-20260718' as const
const OWNER_STANDING_DIRECTIVE_SHA256 =
  'b933153875768280382d9e9aecd1d904c4300518426bbe6ae52496c8ea0fff68' as const
const OWNER_AUTHORIZATION_STATEMENT_SHA256 =
  'cb26b67e69b5dde409462abaeeb34b1838c1561d58751314a8e78df1c39b672b' as const
const SHA256 = /^[a-f0-9]{64}$/

export const MOTION_STUDIO_SPEECH_ZERO_RETENTION_HISTORY_DIAGNOSTIC_REVIEWED_RUNTIME_PATHS =
  Object.freeze([
    'server/motion-studio/speech-production/live-credential.ts',
    'server/motion-studio/speech-production/voice-catalog-discovery.ts',
    'server/motion-studio/speech-production/zero-retention-history-diagnostic-live-operator.ts',
    'server/motion-studio/speech-production/zero-retention-history-diagnostic-live-cli.ts',
  ] as const)

export const MOTION_STUDIO_SPEECH_ZERO_RETENTION_HISTORY_DIAGNOSTIC_TARGET_PATHS =
  Object.freeze([
    TARGET_PACKET_RELATIVE_PATH,
    TARGET_AUTHORIZATION_RECORD_RELATIVE_PATH,
    TARGET_RESULT_RELATIVE_PATH,
  ] as const)

export const MOTION_STUDIO_SPEECH_ZERO_RETENTION_HISTORY_DIAGNOSTIC_PATHS = Object.freeze({
  packetRelativePath: PACKET_RELATIVE_PATH,
  authorizationRecordRelativePath: AUTHORIZATION_RECORD_RELATIVE_PATH,
  targetResultRelativePath: TARGET_RESULT_RELATIVE_PATH,
  decisionRelativePath: DECISION_RELATIVE_PATH,
  privateRunRootRelativePath: PRIVATE_RUN_ROOT_RELATIVE_PATH,
  consumptionFilename: CONSUMPTION_FILENAME,
  evidenceFilename: EVIDENCE_FILENAME,
  failureFilename: FAILURE_FILENAME,
})

const digestSchema = z.string().regex(SHA256)
const reviewedFileSchema = z.object({
  relativePath: z.string().trim().min(1).max(512),
  byteLength: z.number().int().positive().safe(),
  sha256: digestSchema,
}).strict()

const packetSchema = z.object({
  schemaVersion: z.literal('motion-studio.speech-zero-retention-history-diagnostic-live-authorization.v1'),
  authorizationId: z.literal(AUTHORIZATION_ID),
  milestone: z.literal('MS-012C2'),
  status: z.literal('standing_directive_authorization_ready_not_executed'),
  singleUse: z.literal(true),
  purpose: z.string().trim().min(1).max(4_096),
  validFrom: z.string().datetime({ offset: true }),
  expiresAt: z.string().datetime({ offset: true }),
  reviewedRuntimeFiles: z.array(reviewedFileSchema).length(
    MOTION_STUDIO_SPEECH_ZERO_RETENTION_HISTORY_DIAGNOSTIC_REVIEWED_RUNTIME_PATHS.length,
  ),
  targetExt008Files: z.array(reviewedFileSchema).length(
    MOTION_STUDIO_SPEECH_ZERO_RETENTION_HISTORY_DIAGNOSTIC_TARGET_PATHS.length,
  ),
  targetExt008: z.object({
    resultRelativePath: z.literal(TARGET_RESULT_RELATIVE_PATH),
    qualificationAuthorizationId: z.literal(
      'MS-012C2-ZERO-RETENTION-QUALIFICATION-EXT-008',
    ),
    qualificationAuthorityPacketDigest: digestSchema,
    qualificationResultFileSha256: digestSchema,
    executedAt: z.string().datetime({ offset: true }),
    providerRequestIdDigest: digestSchema,
    qualificationTextDigest: digestSchema,
    enableLoggingFalseRequestAccepted: z.literal(true),
    ttsStatusCode: z.literal(200),
    historyStatusCode: z.literal(200),
    originalHistoryAbsenceVerified: z.literal(false),
    originalAuthorityRetryAllowed: z.literal(false),
  }).strict(),
  acceptedVoiceDecision: z.object({
    relativePath: z.literal(DECISION_RELATIVE_PATH),
    fileSha256: digestSchema,
    decisionDigest: digestSchema,
    catalogEvidenceDigest: digestSchema,
    candidateEvidenceDigest: digestSchema,
    voiceIdentityHash: digestSchema,
  }).strict(),
  credentialAuthority: z.object({
    provider: z.literal('google_secret_manager'),
    projectId: z.literal(MOTION_STUDIO_SPEECH_GOOGLE_CLOUD_PROJECT_ID),
    secretId: z.literal(MOTION_STUDIO_SPEECH_ELEVENLABS_SECRET_LOCATOR_ID),
    numericVersion: z.literal(MOTION_STUDIO_SPEECH_ELEVENLABS_SECRET_VERSION),
    maximumPayloadReads: z.literal(1),
    environmentFallbackAllowed: z.literal(false),
    credentialPersisted: z.literal(false),
  }).strict(),
  credentialRuntimeIdentity: z.object({
    cloudSdkVersion: z.literal(MOTION_STUDIO_SPEECH_GCLOUD_SDK_VERSION),
    resolvedExecutablePath: z.literal(MOTION_STUDIO_SPEECH_GCLOUD_BINARY_PATH),
    executableByteLength: z.literal(MOTION_STUDIO_SPEECH_GCLOUD_BINARY_BYTE_LENGTH),
    executableSha256: z.literal(MOTION_STUDIO_SPEECH_GCLOUD_BINARY_SHA256),
    callerSelectedExecutableAllowed: z.literal(false),
    proxyOrPacAllowed: z.literal(false),
  }).strict(),
  request: z.object({
    method: z.literal('GET'),
    scheme: z.literal('https'),
    hostname: z.literal(PROVIDER_HOSTNAME),
    port: z.literal(443),
    exactPath: z.literal(HISTORY_PATH),
    pageSize: z.literal(HISTORY_PAGE_SIZE),
    source: z.literal('TTS'),
    modelId: z.literal(MODEL_ID),
    dateAfterSafetyWindowSeconds: z.literal(HISTORY_DATE_AFTER_SAFETY_WINDOW_SECONDS),
    maximumHttpRequests: z.literal(1),
    maximumAddressConnectionAttempts: z.literal(1),
    maximumResponseBytes: z.literal(MAXIMUM_RESPONSE_BYTES),
    timeoutMilliseconds: z.literal(REQUEST_TIMEOUT_MILLISECONDS),
    maximumRedirects: z.literal(0),
    automaticRetryAllowed: z.literal(false),
    automaticFallbackAllowed: z.literal(false),
    addressFallbackAllowed: z.literal(false),
    providerGenerationAllowed: z.literal(false),
  }).strict(),
  classificationPolicy: z.object({
    compareRequestIdByDigest: z.literal(true),
    compareTextByDigest: z.literal(true),
    persistRawRequestId: z.literal(false),
    persistRawText: z.literal(false),
    persistRawHistory: z.literal(false),
    allowedClassifications: z.tuple([
      z.literal('exact_request_retained'),
      z.literal('clean_absence'),
      z.literal('pagination_inconclusive'),
      z.literal('filter_or_schema_mismatch'),
    ]),
  }).strict(),
  costPolicy: z.object({
    currency: z.literal('USD'),
    maximumInternalProductionCostMicros: z.literal(MAXIMUM_INTERNAL_PRODUCTION_COST_MICROS),
    providerNativeRequestCostMicros: z.literal(0),
    purchaseAllowed: z.literal(false),
    customerPricingAllowed: z.literal(false),
    customerCreditsAllowed: z.literal(false),
    serviceFeeAllowed: z.literal(false),
    billingAllowed: z.literal(false),
  }).strict(),
  evidencePolicy: z.object({
    zeroRetentionSourceUrl: z.literal(ZERO_RETENTION_SOURCE_URL),
    historyEndpointSourceUrl: z.literal(HISTORY_ENDPOINT_SOURCE_URL),
    privateLocalEvidenceOnly: z.literal(true),
    rawProviderResponsePersisted: z.literal(false),
    rawHistoryTextPersisted: z.literal(false),
    accountIdentityPersisted: z.literal(false),
    providerVoiceIdPersisted: z.literal(false),
    browserProjectionAllowed: z.literal(false),
    productionPromotionAllowed: z.literal(false),
  }).strict(),
  operator: z.object({
    command: z.literal(
      './node_modules/.bin/tsx server/motion-studio/speech-production/zero-retention-history-diagnostic-live-cli.ts',
    ),
    privateRunRootRelativePath: z.literal(PRIVATE_RUN_ROOT_RELATIVE_PATH),
    consumeBeforeCredentialRead: z.literal(true),
    createOnlyEvidence: z.literal(true),
  }).strict(),
  explicitlyForbidden: z.array(z.string().trim().min(1).max(1_024)).min(12).max(40),
}).strict()

const authorizationRecordSchema = z.object({
  schemaVersion: z.literal(
    'motion-studio.speech-zero-retention-history-diagnostic-live-authorization-record.v1',
  ),
  status: z.literal('standing_directive_authorized_unconsumed'),
  authorizationId: z.literal(AUTHORIZATION_ID),
  authorityPacketDigest: digestSchema,
  ownerAuthorizationEvidenceId: z.literal('owner-standing-storytelling-self-qa-20260718'),
  ownerAuthorizationStatementSha256: z.literal(OWNER_AUTHORIZATION_STATEMENT_SHA256),
  standingDirectiveId: z.literal(OWNER_STANDING_DIRECTIVE_ID),
  standingDirectiveSha256: z.literal(OWNER_STANDING_DIRECTIVE_SHA256),
  recordedAt: z.string().datetime({ offset: true }),
  expiresAt: z.string().datetime({ offset: true }),
  singleUse: z.literal(true),
  maximumSecretPayloadReads: z.literal(1),
  maximumHttpRequests: z.literal(1),
  maximumAddressConnectionAttempts: z.literal(1),
  maximumCapturedResponseBytes: z.literal(MAXIMUM_RESPONSE_BYTES),
  maximumInternalProductionCostMicros: z.literal(MAXIMUM_INTERNAL_PRODUCTION_COST_MICROS),
  providerGenerationAllowed: z.literal(false),
  automaticRetryAllowed: z.literal(false),
  automaticFallbackAllowed: z.literal(false),
  purchaseAllowed: z.literal(false),
  privateLocalEvidenceOnly: z.literal(true),
}).strict()

type Packet = z.infer<typeof packetSchema>
type DiagnosticClassification = Packet['classificationPolicy']['allowedClassifications'][number]
type EvidenceClass = 'authenticated_provider_read_only' | 'private_local_fixture'

export interface MotionStudioSpeechZeroRetentionHistoryDiagnosticResultV1 {
  schemaVersion: 'motion-studio.speech-zero-retention-history-diagnostic-result.v1'
  state: 'private_zero_retention_history_diagnostic_ready'
  evidenceClass: EvidenceClass
  authorizationId: typeof AUTHORIZATION_ID
  authorityPacketDigest: string
  targetExt008ResultSha256: string
  evidenceDigest: string
  classification: DiagnosticClassification
  exactRequestDigestMatchCount: number
  exactTextDigestMatchCount: number
  historyAbsenceVerified: boolean
  zeroRetentionEntitlementVerified: boolean
  credentialPayloadReadCount: 1
  providerHttpRequestCount: 1
  addressConnectionAttemptCount: 1
  providerGenerationCount: 0
  automaticRetryCount: 0
  automaticFallbackCount: 0
  purchaseCount: 0
  privateEvidenceRelativePath: typeof PRIVATE_RUN_ROOT_RELATIVE_PATH
  productReady: false
  productionReady: false
  immutable: true
}

export interface MotionStudioSpeechZeroRetentionHistoryDiagnosticFixtureInput {
  repositoryRoot: string
  now: string
  apiKeyFixture: string
  resolvedIpv4Addresses: readonly string[]
  responseStatus: number
  responseContentType: string
  responseBytes: Buffer
  responseLocation?: string
  onFixtureRequest?: (request: {
    method: 'GET'
    hostname: typeof PROVIDER_HOSTNAME
    path: string
  }) => void
}

interface ProviderResponse {
  statusCode: number
  contentType: 'application/json'
  bytes: Buffer
}

interface TargetExt008Result {
  executedAt: string
  providerRequestIdDigest: string
  qualificationTextDigest: string
  resultFileSha256: string
  authorityPacketDigest: string
}

interface DiagnosticProjection {
  classification: DiagnosticClassification
  itemCount: number
  hasMore: boolean
  exactRequestDigestMatchCount: number
  exactTextDigestMatchCount: number
  missingBothIdentifiersCount: number
  voiceMismatchCount: number
  modelMismatchCount: number
  sourceMismatchCount: number
  dateBeforeFilterCount: number
  projectionDigest: string
}

export async function verifyMotionStudioSpeechZeroRetentionHistoryDiagnosticAuthority(input: {
  repositoryRoot: string
  now: string
}) {
  const context = await loadAuthorityContext(input)
  await assertAuthorityUnconsumed(context.repositoryRoot)
  return Object.freeze({
    schemaVersion: 'motion-studio.speech-zero-retention-history-diagnostic-authority-verification.v1' as const,
    state: 'single_use_read_only_diagnostic_authority_verified_unconsumed' as const,
    authorizationId: AUTHORIZATION_ID,
    authorityPacketDigest: context.authorityPacketDigest,
    authorizationRecordDigest: sha256Bytes(context.authorizationBytes),
    targetExt008ResultSha256: context.target.resultFileSha256,
    targetProviderRequestIdDigest: context.target.providerRequestIdDigest,
    targetQualificationTextDigest: context.target.qualificationTextDigest,
    decisionDigest: context.decision.decisionDigest,
    catalogEvidenceDigest: context.catalog.evidenceDigest,
    voiceIdentityHash: context.decision.voiceIdentityHash,
    maximumSecretPayloadReads: 1 as const,
    maximumHttpRequests: 1 as const,
    maximumAddressConnectionAttempts: 1 as const,
    providerGenerationAllowed: false as const,
    credentialPayloadReadCount: 0 as const,
    providerHttpRequestCount: 0 as const,
    liveExecutionPerformed: false as const,
    immutable: true as const,
  })
}

export async function executeMotionStudioSpeechZeroRetentionHistoryDiagnosticLiveOperator(input: {
  repositoryRoot: string
  now: string
}): Promise<MotionStudioSpeechZeroRetentionHistoryDiagnosticResultV1> {
  return executeOperator({ ...input, mode: 'live' })
}

/** Networkless proof only. Fixture evidence can never prove live entitlement. */
export async function executeMotionStudioSpeechZeroRetentionHistoryDiagnosticFixtureOperator(
  input: MotionStudioSpeechZeroRetentionHistoryDiagnosticFixtureInput,
): Promise<MotionStudioSpeechZeroRetentionHistoryDiagnosticResultV1> {
  return executeOperator({ ...input, mode: 'fixture' })
}

async function executeOperator(input: ({
  mode: 'live'
  repositoryRoot: string
  now: string
} | ({ mode: 'fixture' } & MotionStudioSpeechZeroRetentionHistoryDiagnosticFixtureInput))): Promise<
  MotionStudioSpeechZeroRetentionHistoryDiagnosticResultV1
> {
  const context = await loadAuthorityContext(input)
  const {
    repositoryRoot,
    now,
    authorityPacketDigest,
    authorizationBytes,
    authorization,
    target,
    decision,
    catalog,
    providerVoiceId,
  } = context
  const runRoot = inside(repositoryRoot, PRIVATE_RUN_ROOT_RELATIVE_PATH)
  await mkdir(runRoot, { recursive: true, mode: 0o700 })
  await assertPrivateDirectory(runRoot, repositoryRoot)
  const consumptionPath = join(runRoot, CONSUMPTION_FILENAME)
  const evidencePath = join(runRoot, EVIDENCE_FILENAME)
  const failurePath = join(runRoot, FAILURE_FILENAME)
  const progress = {
    lastPhase: 'authority_validated',
    credentialPayloadReadCount: 0,
    providerHttpRequestCount: 0,
    addressConnectionAttemptCount: 0,
    providerGenerationCount: 0,
    responseStatusCode: null as number | null,
  }
  await writePrivateJsonCreateOnly(consumptionPath, {
    schemaVersion: 'motion-studio.speech-zero-retention-history-diagnostic-consumption.v1',
    state: 'single_use_read_only_authority_consumed_before_credential_read',
    authorizationId: AUTHORIZATION_ID,
    authorityPacketDigest,
    authorizationRecordDigest: sha256Bytes(authorizationBytes),
    ownerAuthorizationEvidenceId: authorization.ownerAuthorizationEvidenceId,
    targetExt008ResultSha256: target.resultFileSha256,
    targetProviderRequestIdDigest: target.providerRequestIdDigest,
    targetQualificationTextDigest: target.qualificationTextDigest,
    decisionDigest: decision.decisionDigest,
    catalogEvidenceDigest: catalog.evidenceDigest,
    voiceIdentityHash: decision.voiceIdentityHash,
    providerGenerationAllowed: false,
    credentialPayloadReadCountAtConsumption: 0,
    providerHttpRequestCountAtConsumption: 0,
    consumedAt: now,
    immutable: true,
  }, 'Zero-retention history diagnostic authority was already consumed.')

  try {
    progress.lastPhase = 'credential_read_started'
    const apiKey = input.mode === 'live'
      ? await readLiveApiKey()
      : validateApiKey(input.apiKeyFixture)
    progress.credentialPayloadReadCount = 1
    progress.lastPhase = 'credential_read_completed'
    const addresses = input.mode === 'live'
      ? await resolve4(PROVIDER_HOSTNAME)
      : [...input.resolvedIpv4Addresses]
    const selectedAddress = selectOnePublicIpv4(addresses)
    const dateAfterUnix = Math.floor(Date.parse(target.executedAt) / 1_000) -
      HISTORY_DATE_AFTER_SAFETY_WINDOW_SECONDS
    const query = new URLSearchParams({
      page_size: String(HISTORY_PAGE_SIZE),
      voice_id: providerVoiceId,
      model_id: MODEL_ID,
      source: 'TTS',
      date_after_unix: String(dateAfterUnix),
      sort_direction: 'desc',
    })
    const requestPath = `${HISTORY_PATH}?${query.toString()}`
    progress.lastPhase = 'history_request_started'
    progress.providerHttpRequestCount = 1
    progress.addressConnectionAttemptCount = 1
    const response = input.mode === 'live'
      ? await requestHistory({ apiKey, selectedAddress, path: requestPath })
      : fixtureResponse(input, requestPath)
    progress.responseStatusCode = response.statusCode
    progress.lastPhase = 'history_response_received'
    if (response.statusCode !== 200) {
      blocked('Zero-retention history diagnostic provider response was not successful.')
    }
    const projection = projectHistoryDiagnostic({
      bytes: response.bytes,
      targetRequestIdDigest: target.providerRequestIdDigest,
      targetTextDigest: target.qualificationTextDigest,
      providerVoiceId,
      dateAfterUnix,
    })
    progress.lastPhase = 'history_classified'
    const evidenceClass: EvidenceClass = input.mode === 'live'
      ? 'authenticated_provider_read_only'
      : 'private_local_fixture'
    const liveCleanAbsence = evidenceClass === 'authenticated_provider_read_only' &&
      projection.classification === 'clean_absence'
    const evidenceBase = {
      schemaVersion: 'motion-studio.speech-zero-retention-history-diagnostic-private-evidence.v1' as const,
      state: 'private_zero_retention_history_diagnostic_ready' as const,
      evidenceClass,
      authorizationId: AUTHORIZATION_ID,
      authorityPacketDigest,
      ownerAuthorizationEvidenceId: authorization.ownerAuthorizationEvidenceId,
      targetExt008: {
        resultFileSha256: target.resultFileSha256,
        authorityPacketDigest: target.authorityPacketDigest,
        executedAt: target.executedAt,
        providerRequestIdDigest: target.providerRequestIdDigest,
        qualificationTextDigest: target.qualificationTextDigest,
        enableLoggingFalseRequestAccepted: true as const,
        ttsStatusCode: 200 as const,
        originalHistoryStatusCode: 200 as const,
        originalHistoryAbsenceVerified: false as const,
      },
      exactRequest: {
        method: 'GET' as const,
        hostname: PROVIDER_HOSTNAME,
        pathTemplate: HISTORY_PATH,
        pageSize: HISTORY_PAGE_SIZE,
        source: 'TTS' as const,
        modelId: MODEL_ID,
        dateAfterUnix,
        exactVoiceFilterApplied: true as const,
        requestCount: 1 as const,
        addressConnectionAttemptCount: 1 as const,
        selectedAddressFamily: 'IPv4' as const,
        selectedAddressDigest: sha256Text(selectedAddress),
        retryCount: 0 as const,
        fallbackCount: 0 as const,
        redirectCount: 0 as const,
        addressFallbackCount: 0 as const,
      },
      response: {
        statusCode: 200 as const,
        contentType: 'application/json' as const,
        byteLength: response.bytes.byteLength,
        contentDigest: sha256Bytes(response.bytes),
        rawResponsePersisted: false as const,
        rawHistoryTextPersisted: false as const,
      },
      projection,
      qualification: {
        historyAbsenceVerified: liveCleanAbsence,
        zeroRetentionEntitlementVerified: liveCleanAbsence,
        exactRequestRetained: projection.classification === 'exact_request_retained',
        resultScope: evidenceClass === 'private_local_fixture'
          ? 'fixture_contract_only_non_promotable' as const
          : 'exact_ext008_request_and_current_api_key_version' as const,
        productionQuotaSufficiencyVerified: false as const,
        productionSpeechPromotionAuthorized: false as const,
      },
      usage: {
        credentialPayloadReadCount: 1 as const,
        providerHttpRequestCount: 1 as const,
        addressConnectionAttemptCount: 1 as const,
        providerGenerationCount: 0 as const,
        automaticRetryCount: 0 as const,
        automaticFallbackCount: 0 as const,
        purchaseCount: 0 as const,
        accountMutationCount: 0 as const,
      },
      cost: {
        maximumInternalProductionCostMicros: MAXIMUM_INTERNAL_PRODUCTION_COST_MICROS,
        providerNativeRequestCostMicros: 0 as const,
        actualInfrastructureCostMicros: null,
        actualInternalProductionCostMicros: null,
        customerPriceIncluded: false as const,
        customerCreditsIncluded: false as const,
        serviceFeeIncluded: false as const,
        customerBillingPerformed: false as const,
      },
      boundaries: {
        privateLocalEvidenceOnly: true as const,
        credentialPersisted: false as const,
        providerVoiceIdPersisted: false as const,
        rawRequestIdPersisted: false as const,
        rawHistoryPersisted: false as const,
        accountIdentityPersisted: false as const,
        browserProjectionAllowed: false as const,
        providerGenerationAllowed: false as const,
        timelineMutationAllowed: false as const,
        renderAllowed: false as const,
        exportAllowed: false as const,
        deploymentAllowed: false as const,
        publicDeliveryAllowed: false as const,
        productReady: false as const,
        productionReady: false as const,
      },
      completedAt: now,
      immutable: true as const,
    }
    const evidence = Object.freeze({
      ...evidenceBase,
      evidenceDigest: sha256CanonicalJson(evidenceBase),
    })
    progress.lastPhase = 'private_evidence_write_started'
    await writePrivateJsonCreateOnly(
      evidencePath,
      evidence,
      'Zero-retention history diagnostic evidence already exists.',
    )
    return Object.freeze({
      schemaVersion: 'motion-studio.speech-zero-retention-history-diagnostic-result.v1',
      state: 'private_zero_retention_history_diagnostic_ready',
      evidenceClass,
      authorizationId: AUTHORIZATION_ID,
      authorityPacketDigest,
      targetExt008ResultSha256: target.resultFileSha256,
      evidenceDigest: evidence.evidenceDigest,
      classification: projection.classification,
      exactRequestDigestMatchCount: projection.exactRequestDigestMatchCount,
      exactTextDigestMatchCount: projection.exactTextDigestMatchCount,
      historyAbsenceVerified: liveCleanAbsence,
      zeroRetentionEntitlementVerified: liveCleanAbsence,
      credentialPayloadReadCount: 1,
      providerHttpRequestCount: 1,
      addressConnectionAttemptCount: 1,
      providerGenerationCount: 0,
      automaticRetryCount: 0,
      automaticFallbackCount: 0,
      purchaseCount: 0,
      privateEvidenceRelativePath: PRIVATE_RUN_ROOT_RELATIVE_PATH,
      productReady: false,
      productionReady: false,
      immutable: true,
    })
  } catch (error) {
    await writePrivateJsonCreateOnly(failurePath, {
      schemaVersion: 'motion-studio.speech-zero-retention-history-diagnostic-terminal-failure.v1',
      state: 'consumed_terminal_failure_no_retry',
      authorizationId: AUTHORIZATION_ID,
      authorityPacketDigest,
      ownerAuthorizationEvidenceId: authorization.ownerAuthorizationEvidenceId,
      targetExt008ResultSha256: target.resultFileSha256,
      safeFailureClass: classifyFailure(progress.lastPhase),
      failureCode: error instanceof ApiError ? error.code : 'MOTION_STUDIO_APPROVAL_BLOCKED',
      safeProgress: progress,
      zeroRetentionEntitlementVerified: false,
      rawErrorMessagePersisted: false,
      credentialPersisted: false,
      providerVoiceIdPersisted: false,
      rawProviderResponsePersisted: false,
      rawHistoryTextPersisted: false,
      rawResolvedAddressPersisted: false,
      providerGenerationAllowed: false,
      automaticRetryAllowed: false,
      automaticFallbackAllowed: false,
      customerBillingPerformed: false,
      failedAt: now,
      immutable: true,
    }, 'Zero-retention history diagnostic terminal failure already exists.')
    blocked('Zero-retention history diagnostic ended terminally; retry and fallback are forbidden.')
  }
}

async function loadAuthorityContext(input: { repositoryRoot: string; now: string }) {
  const repositoryRoot = await realpath(input.repositoryRoot)
  const now = exactIso(input.now, 'zero-retention history diagnostic time')
  const packetBytes = await readRegularBoundedFile(
    inside(repositoryRoot, PACKET_RELATIVE_PATH),
    MAXIMUM_PACKET_BYTES,
    'history diagnostic authority packet',
  )
  const authorityPacketDigest = sha256Bytes(packetBytes)
  const packet = packetSchema.parse(parseJson(packetBytes, 'history diagnostic authority packet'))
  validateExecutionWindow(packet.validFrom, packet.expiresAt, now, 'authority packet')
  assertExactPathSet(
    packet.reviewedRuntimeFiles,
    MOTION_STUDIO_SPEECH_ZERO_RETENTION_HISTORY_DIAGNOSTIC_REVIEWED_RUNTIME_PATHS,
    'reviewed runtime',
  )
  assertExactPathSet(
    packet.targetExt008Files,
    MOTION_STUDIO_SPEECH_ZERO_RETENTION_HISTORY_DIAGNOSTIC_TARGET_PATHS,
    'EXT-008 target',
  )
  await verifyReviewedFiles(repositoryRoot, packet.reviewedRuntimeFiles)
  await verifyReviewedFiles(repositoryRoot, packet.targetExt008Files)
  const authorizationBytes = await readRegularBoundedFile(
    inside(repositoryRoot, AUTHORIZATION_RECORD_RELATIVE_PATH),
    MAXIMUM_AUTHORIZATION_RECORD_BYTES,
    'history diagnostic authorization record',
  )
  const authorization = authorizationRecordSchema.parse(
    parseJson(authorizationBytes, 'history diagnostic authorization record'),
  )
  if (authorization.authorityPacketDigest !== authorityPacketDigest) {
    blocked('Zero-retention history diagnostic authorization does not bind its packet.')
  }
  validateExecutionWindow(authorization.recordedAt, authorization.expiresAt, now, 'authorization')
  if (
    authorization.recordedAt !== packet.validFrom ||
    authorization.expiresAt !== packet.expiresAt
  ) blocked('Zero-retention history diagnostic authorization window changed.')
  const targetBytes = await readRegularBoundedFile(
    inside(repositoryRoot, TARGET_RESULT_RELATIVE_PATH),
    128 * 1024,
    'EXT-008 target result',
  )
  await verifyTargetExt008Authority(repositoryRoot, packet)
  const target = parseTargetExt008(targetBytes, packet)
  const decisionBytes = await readRegularBoundedFile(
    inside(repositoryRoot, DECISION_RELATIVE_PATH),
    32 * 1024,
    'accepted voice decision',
  )
  if (sha256Bytes(decisionBytes) !== packet.acceptedVoiceDecision.fileSha256) {
    blocked('Zero-retention history diagnostic voice decision changed.')
  }
  const decision = parseAcceptedVoiceDecision(decisionBytes, packet)
  const catalog = await loadMotionStudioSpeechVoiceCatalogPrivateAcceptanceEvidence({ repositoryRoot })
  if (catalog.evidenceDigest !== decision.catalogEvidenceDigest) {
    blocked('Zero-retention history diagnostic catalog evidence changed.')
  }
  const candidates = catalog.candidates.filter((candidate) =>
    candidate.voiceIdentityHash === decision.voiceIdentityHash &&
    candidate.candidateEvidenceDigest === decision.candidateEvidenceDigest)
  if (candidates.length !== 1 || candidates[0]!.category !== 'premade') {
    blocked('Zero-retention history diagnostic requires one exact reviewed premade voice.')
  }
  return {
    repositoryRoot,
    now,
    authorityPacketDigest,
    packet,
    authorizationBytes,
    authorization,
    target,
    decision,
    catalog,
    providerVoiceId: candidates[0]!.providerVoiceId,
  }
}

async function verifyTargetExt008Authority(repositoryRoot: string, packet: Packet): Promise<void> {
  const [targetPacketBytes, targetAuthorizationBytes] = await Promise.all([
    readRegularBoundedFile(
      inside(repositoryRoot, TARGET_PACKET_RELATIVE_PATH),
      MAXIMUM_PACKET_BYTES,
      'EXT-008 authority packet',
    ),
    readRegularBoundedFile(
      inside(repositoryRoot, TARGET_AUTHORIZATION_RECORD_RELATIVE_PATH),
      MAXIMUM_AUTHORIZATION_RECORD_BYTES,
      'EXT-008 authorization record',
    ),
  ])
  const targetPacketDigest = sha256Bytes(targetPacketBytes)
  if (targetPacketDigest !== packet.targetExt008.qualificationAuthorityPacketDigest) {
    blocked('Zero-retention history diagnostic target authority packet digest changed.')
  }
  const targetPacket = object(
    parseJson(targetPacketBytes, 'EXT-008 authority packet'),
    'EXT-008 authority packet',
  )
  const qualificationInput = object(
    targetPacket.qualificationInput,
    'EXT-008 qualification input',
  )
  const ttsRequest = object(targetPacket.ttsRequest, 'EXT-008 TTS request')
  const historyVerification = object(
    targetPacket.historyVerification,
    'EXT-008 history verification',
  )
  if (
    targetPacket.schemaVersion !==
      'motion-studio.speech-zero-retention-qualification-live-authorization.v1' ||
    targetPacket.authorizationId !== packet.targetExt008.qualificationAuthorizationId ||
    qualificationInput.textDigest !== packet.targetExt008.qualificationTextDigest ||
    qualificationInput.syntheticNonPersonal !== true || qualificationInput.userContentUsed !== false ||
    ttsRequest.method !== 'POST' || ttsRequest.hostname !== PROVIDER_HOSTNAME ||
    ttsRequest.modelId !== MODEL_ID || ttsRequest.enableLogging !== false ||
    historyVerification.method !== 'GET' || historyVerification.exactPath !== HISTORY_PATH ||
    historyVerification.modelId !== MODEL_ID || historyVerification.source !== 'TTS' ||
    historyVerification.requireExactRequestIdAbsence !== true ||
    historyVerification.requireExactTextAbsence !== true ||
    historyVerification.requireNoPagination !== true ||
    historyVerification.rawHistoryPersisted !== false
  ) blocked('Zero-retention history diagnostic target authority lost its reviewed boundary.')

  const targetAuthorization = object(
    parseJson(targetAuthorizationBytes, 'EXT-008 authorization record'),
    'EXT-008 authorization record',
  )
  if (
    targetAuthorization.schemaVersion !==
      'motion-studio.speech-zero-retention-qualification-live-authorization-record.v1' ||
    targetAuthorization.authorizationId !== packet.targetExt008.qualificationAuthorizationId ||
    targetAuthorization.authorityPacketDigest !== targetPacketDigest ||
    targetAuthorization.singleUse !== true ||
    targetAuthorization.automaticRetryAllowed !== false ||
    targetAuthorization.automaticFallbackAllowed !== false ||
    targetAuthorization.purchaseAllowed !== false ||
    targetAuthorization.privateLocalEvidenceOnly !== true
  ) blocked('Zero-retention history diagnostic target authorization lost its reviewed boundary.')
}

function parseTargetExt008(bytes: Buffer, packet: Packet): TargetExt008Result {
  if (sha256Bytes(bytes) !== packet.targetExt008.qualificationResultFileSha256) {
    blocked('Zero-retention history diagnostic target result changed after review.')
  }
  const value = object(parseJson(bytes, 'EXT-008 target result'), 'EXT-008 target result')
  const outcome = object(value.outcome, 'EXT-008 outcome')
  const progress = object(value.safeProgress, 'EXT-008 safe progress')
  const historyPolicy = object(value.historyPolicy, 'EXT-008 history policy')
  if (
    value.schemaVersion !== 'motion-studio.speech-zero-retention-qualification-live-result.v1' ||
    value.authorizationId !== packet.targetExt008.qualificationAuthorizationId ||
    value.authorityPacketDigest !== packet.targetExt008.qualificationAuthorityPacketDigest ||
    value.executedAt !== packet.targetExt008.executedAt ||
    progress.providerRequestIdDigest !== packet.targetExt008.providerRequestIdDigest ||
    outcome.enableLoggingFalseRequestAccepted !== true || outcome.ttsStatusCode !== 200 ||
    outcome.historyStatusCode !== 200 || outcome.historyAbsenceVerified !== false ||
    historyPolicy.retryUnderSameAuthorityAllowed !== false || historyPolicy.immutable !== true ||
    value.immutable !== true
  ) blocked('Zero-retention history diagnostic target result lost its exact terminal boundary.')
  return {
    executedAt: exactIso(String(value.executedAt), 'EXT-008 execution time'),
    providerRequestIdDigest: String(progress.providerRequestIdDigest),
    qualificationTextDigest: packet.targetExt008.qualificationTextDigest,
    resultFileSha256: sha256Bytes(bytes),
    authorityPacketDigest: String(value.authorityPacketDigest),
  }
}

function parseAcceptedVoiceDecision(bytes: Buffer, packet: Packet) {
  const value = object(parseJson(bytes, 'accepted voice decision'), 'accepted voice decision')
  if (
    value.decisionDigest !== packet.acceptedVoiceDecision.decisionDigest ||
    value.catalogEvidenceDigest !== packet.acceptedVoiceDecision.catalogEvidenceDigest ||
    value.candidateEvidenceDigest !== packet.acceptedVoiceDecision.candidateEvidenceDigest ||
    value.voiceIdentityHash !== packet.acceptedVoiceDecision.voiceIdentityHash ||
    value.providerVoiceIdPersisted !== false || value.finalVoiceSelectionAllowed !== false ||
    value.immutable !== true
  ) blocked('Zero-retention history diagnostic voice decision lost its private boundary.')
  return {
    decisionDigest: String(value.decisionDigest),
    catalogEvidenceDigest: String(value.catalogEvidenceDigest),
    candidateEvidenceDigest: String(value.candidateEvidenceDigest),
    voiceIdentityHash: String(value.voiceIdentityHash),
  }
}

function projectHistoryDiagnostic(input: {
  bytes: Buffer
  targetRequestIdDigest: string
  targetTextDigest: string
  providerVoiceId: string
  dateAfterUnix: number
}): DiagnosticProjection {
  const value = object(parseJson(input.bytes, 'history diagnostic response'), 'history response')
  if (!Array.isArray(value.history) || typeof value.has_more !== 'boolean' ||
    value.history.length > HISTORY_PAGE_SIZE) {
    blocked('Zero-retention history diagnostic response is malformed.')
  }
  let exactRequestDigestMatchCount = 0
  let exactTextDigestMatchCount = 0
  let missingBothIdentifiersCount = 0
  let voiceMismatchCount = 0
  let modelMismatchCount = 0
  let sourceMismatchCount = 0
  let dateBeforeFilterCount = 0
  const items = value.history.map((entry, index) => {
    const item = object(entry, `history item ${index}`)
    const requestId = nullableBoundedString(item.request_id, 512, `history request id ${index}`)
    const text = nullableBoundedString(item.text, 100_000, `history text ${index}`)
    const voiceId = nullableBoundedString(item.voice_id, 512, `history voice id ${index}`)
    const modelId = nullableBoundedString(item.model_id, 512, `history model id ${index}`)
    const source = nullableBoundedString(item.source, 64, `history source ${index}`)
    const dateUnix = nonNegativeSafeInteger(item.date_unix, `history date ${index}`)
    const requestIdDigest = requestId === null ? null : sha256Text(requestId)
    const textDigest = text === null ? null : sha256Text(text)
    if (requestIdDigest === input.targetRequestIdDigest) exactRequestDigestMatchCount += 1
    if (textDigest === input.targetTextDigest) exactTextDigestMatchCount += 1
    if (requestId === null && text === null) missingBothIdentifiersCount += 1
    if (voiceId !== input.providerVoiceId) voiceMismatchCount += 1
    if (modelId !== MODEL_ID) modelMismatchCount += 1
    if (source !== 'TTS') sourceMismatchCount += 1
    if (dateUnix < input.dateAfterUnix) dateBeforeFilterCount += 1
    return {
      requestIdDigest,
      textDigest,
      voiceIdDigest: voiceId === null ? null : sha256Text(voiceId),
      modelId,
      source,
      dateUnix,
    }
  })
  let classification: DiagnosticClassification
  if (exactRequestDigestMatchCount > 0 || exactTextDigestMatchCount > 0) {
    classification = 'exact_request_retained'
  } else if (value.has_more) {
    classification = 'pagination_inconclusive'
  } else if (
    missingBothIdentifiersCount > 0 || voiceMismatchCount > 0 || modelMismatchCount > 0 ||
    sourceMismatchCount > 0 || dateBeforeFilterCount > 0
  ) {
    classification = 'filter_or_schema_mismatch'
  } else {
    classification = 'clean_absence'
  }
  const projectionBase = {
    itemCount: items.length,
    hasMore: value.has_more,
    exactRequestDigestMatchCount,
    exactTextDigestMatchCount,
    missingBothIdentifiersCount,
    voiceMismatchCount,
    modelMismatchCount,
    sourceMismatchCount,
    dateBeforeFilterCount,
    items,
    classification,
  }
  return {
    classification,
    itemCount: items.length,
    hasMore: value.has_more,
    exactRequestDigestMatchCount,
    exactTextDigestMatchCount,
    missingBothIdentifiersCount,
    voiceMismatchCount,
    modelMismatchCount,
    sourceMismatchCount,
    dateBeforeFilterCount,
    projectionDigest: sha256CanonicalJson(projectionBase),
  }
}

async function readLiveApiKey(): Promise<string> {
  const loader = createMotionStudioSpeechGoogleSecretManagerValueLoader()
  assertMotionStudioSpeechLiveGoogleSecretManagerLoader(loader)
  const raw = await loader.access({
    secretLocatorId: MOTION_STUDIO_SPEECH_ELEVENLABS_SECRET_LOCATOR_ID,
    secretVersionReference: MOTION_STUDIO_SPEECH_ELEVENLABS_SECRET_VERSION,
  })
  return validateApiKey(typeof raw === 'string' ? raw : Buffer.from(raw).toString('utf8'))
}

function validateApiKey(value: string): string {
  const normalized = value.trim()
  if (normalized.length < 16 || normalized.length > 4_096 || /\s/.test(normalized)) {
    blocked('Zero-retention history diagnostic credential is malformed.')
  }
  return normalized
}

async function requestHistory(input: {
  apiKey: string
  selectedAddress: string
  path: string
}): Promise<ProviderResponse> {
  return new Promise((resolveRequest, rejectRequest) => {
    let settled = false
    const finishError = () => {
      if (settled) return
      settled = true
      rejectRequest(new ApiError(
        'MOTION_STUDIO_APPROVAL_BLOCKED',
        'Zero-retention history diagnostic provider request failed.',
        409,
      ))
    }
    const request = httpsRequest({
      protocol: 'https:',
      hostname: PROVIDER_HOSTNAME,
      servername: PROVIDER_HOSTNAME,
      port: 443,
      path: input.path,
      method: 'GET',
      agent: false,
      family: 4,
      lookup: (_hostname, _options, callback) => callback(null, input.selectedAddress, 4),
      headers: {
        Accept: 'application/json',
        'User-Agent': 'ReEditPro-MotionStudio-PrivateRetentionDiagnostic/1.0',
        'xi-api-key': input.apiKey,
      },
    }, (response) => {
      const chunks: Buffer[] = []
      let byteLength = 0
      response.on('data', (chunk: Buffer | Uint8Array | string) => {
        const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
        byteLength += bytes.byteLength
        if (byteLength > MAXIMUM_RESPONSE_BYTES) {
          request.destroy()
          finishError()
          return
        }
        chunks.push(bytes)
      })
      response.on('error', finishError)
      response.on('end', () => {
        if (settled) return
        const contentType = String(response.headers['content-type'] ?? '')
          .split(';', 1)[0]!
          .trim()
          .toLowerCase()
        if (contentType !== 'application/json' || response.headers.location !== undefined) {
          finishError()
          return
        }
        settled = true
        resolveRequest({
          statusCode: response.statusCode ?? 0,
          contentType: 'application/json',
          bytes: Buffer.concat(chunks, byteLength),
        })
      })
    })
    request.setTimeout(REQUEST_TIMEOUT_MILLISECONDS, () => {
      request.destroy()
      finishError()
    })
    request.on('error', finishError)
    request.end()
  })
}

function fixtureResponse(
  input: MotionStudioSpeechZeroRetentionHistoryDiagnosticFixtureInput,
  path: string,
): ProviderResponse {
  input.onFixtureRequest?.({ method: 'GET', hostname: PROVIDER_HOSTNAME, path })
  const contentType = input.responseContentType.split(';', 1)[0]!.trim().toLowerCase()
  if (
    contentType !== 'application/json' || input.responseLocation !== undefined ||
    input.responseBytes.byteLength > MAXIMUM_RESPONSE_BYTES
  ) blocked('Zero-retention history diagnostic fixture response violates its boundary.')
  return {
    statusCode: input.responseStatus,
    contentType: 'application/json',
    bytes: Buffer.from(input.responseBytes),
  }
}

function selectOnePublicIpv4(addresses: readonly string[]): string {
  const unique = [...new Set(addresses)].sort()
  if (unique.length === 0 || unique.some((address) => !isPublicIpv4(address))) {
    blocked('Zero-retention history diagnostic DNS results are empty or unsafe.')
  }
  return unique[0]!
}

function isPublicIpv4(address: string): boolean {
  if (isIP(address) !== 4) return false
  const [a, b, c] = address.split('.').map(Number)
  if (
    a === undefined || b === undefined || c === undefined ||
    a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0 && (c === 0 || c === 2)) ||
    (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) ||
    (a === 203 && b === 0 && c === 113)
  ) return false
  return true
}

async function verifyReviewedFiles(repositoryRoot: string, files: readonly {
  relativePath: string
  byteLength: number
  sha256: string
}[]): Promise<void> {
  for (const file of files) {
    const bytes = await readRegularBoundedFile(
      inside(repositoryRoot, file.relativePath),
      MAXIMUM_REVIEWED_FILE_BYTES,
      `reviewed file ${file.relativePath}`,
    )
    if (bytes.byteLength !== file.byteLength || sha256Bytes(bytes) !== file.sha256) {
      blocked(`Zero-retention history diagnostic reviewed file changed: ${file.relativePath}.`)
    }
  }
}

function assertExactPathSet(
  files: readonly { relativePath: string }[],
  expected: readonly string[],
  label: string,
): void {
  const actual = files.map((file) => file.relativePath)
  if (
    new Set(actual).size !== actual.length ||
    JSON.stringify([...actual].sort()) !== JSON.stringify([...expected].sort())
  ) blocked(`Zero-retention history diagnostic ${label} file set changed.`)
}

function validateExecutionWindow(validFrom: string, expiresAt: string, now: string, label: string): void {
  const start = Date.parse(validFrom)
  const end = Date.parse(expiresAt)
  const current = Date.parse(now)
  if (current < start || current >= end || end <= start || end - start > 86_400_000) {
    blocked(`Zero-retention history diagnostic ${label} is outside its execution window.`)
  }
}

async function assertAuthorityUnconsumed(repositoryRoot: string): Promise<void> {
  const consumptionPath = inside(
    repositoryRoot,
    `${PRIVATE_RUN_ROOT_RELATIVE_PATH}/${CONSUMPTION_FILENAME}`,
  )
  try {
    await lstat(consumptionPath)
  } catch (error) {
    if (isNodeError(error) && error.code === 'ENOENT') return
    throw error
  }
  blocked('Zero-retention history diagnostic authority is already consumed.')
}

async function assertPrivateDirectory(path: string, repositoryRoot: string): Promise<void> {
  const [resolvedPath, metadata] = await Promise.all([realpath(path), lstat(path)])
  if (
    !resolvedPath.startsWith(`${repositoryRoot}${sep}`) || !metadata.isDirectory() ||
    metadata.isSymbolicLink() || (metadata.mode & 0o777) !== 0o700 ||
    (typeof process.getuid === 'function' && metadata.uid !== process.getuid())
  ) blocked('Zero-retention history diagnostic private root is unsafe.')
}

async function readRegularBoundedFile(path: string, maximumBytes: number, label: string): Promise<Buffer> {
  let metadata
  try {
    metadata = await lstat(path)
  } catch {
    blocked(`${label} is unavailable.`)
  }
  if (!metadata.isFile() || metadata.isSymbolicLink() || metadata.size > maximumBytes) {
    blocked(`${label} is not a bounded regular file.`)
  }
  const bytes = await readFile(path)
  if (bytes.byteLength !== metadata.size || bytes.byteLength > maximumBytes) {
    blocked(`${label} changed during its bounded read.`)
  }
  return bytes
}

async function writePrivateJsonCreateOnly(path: string, value: unknown, conflict: string): Promise<void> {
  try {
    await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, {
      encoding: 'utf8',
      flag: 'wx',
      mode: 0o600,
    })
  } catch (error) {
    if (isNodeError(error) && error.code === 'EEXIST') blocked(conflict)
    throw error
  }
  const metadata = await lstat(path)
  if (!metadata.isFile() || metadata.isSymbolicLink() || (metadata.mode & 0o777) !== 0o600) {
    blocked('Zero-retention history diagnostic private evidence permissions are unsafe.')
  }
}

function nullableBoundedString(value: unknown, maximumLength: number, label: string): string | null {
  if (value === null || value === undefined) return null
  if (typeof value !== 'string' || value.length > maximumLength) {
    blocked(`Zero-retention history diagnostic ${label} is malformed.`)
  }
  return value
}

function nonNegativeSafeInteger(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
    blocked(`Zero-retention history diagnostic ${label} is malformed.`)
  }
  return value
}

function classifyFailure(lastPhase: string): string {
  if (lastPhase === 'authority_validated' || lastPhase === 'credential_read_started') {
    return 'credential_read_failed'
  }
  if (lastPhase === 'credential_read_completed') return 'bounded_preflight_failed'
  if (lastPhase === 'history_request_started') return 'history_read_failed'
  if (lastPhase === 'history_response_received') return 'history_response_invalid'
  if (lastPhase === 'history_classified') return 'private_evidence_persistence_failed'
  if (lastPhase === 'private_evidence_write_started') return 'private_evidence_persistence_failed'
  return 'terminal_private_evidence_failure'
}

function object(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    blocked(`Zero-retention history diagnostic ${label} is malformed.`)
  }
  return value as Record<string, unknown>
}

function parseJson(bytes: Buffer, label: string): unknown {
  try {
    return JSON.parse(bytes.toString('utf8')) as unknown
  } catch {
    blocked(`Zero-retention history diagnostic ${label} is not valid JSON.`)
  }
}

function exactIso(value: string, label: string): string {
  const epoch = Date.parse(value)
  if (!Number.isFinite(epoch) || new Date(epoch).toISOString() !== value) {
    blocked(`Zero-retention history diagnostic ${label} must be an exact ISO timestamp.`)
  }
  return value
}

function inside(root: string, relativePath: string): string {
  const candidate = resolve(root, relativePath)
  if (!candidate.startsWith(`${root}${sep}`)) {
    blocked('Zero-retention history diagnostic path escapes its repository root.')
  }
  return candidate
}

function sha256Bytes(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function sha256Text(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error
}

function blocked(message: string): never {
  throw new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', message, 409)
}
