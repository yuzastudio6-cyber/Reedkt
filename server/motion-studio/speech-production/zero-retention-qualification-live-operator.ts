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
import { parseMotionStudioElevenLabsTimingResponse } from './live-request'
import { loadMotionStudioSpeechVoiceCatalogPrivateAcceptanceEvidence } from './voice-catalog-discovery'

const AUTHORIZATION_ID = 'MS-012C2-ZERO-RETENTION-QUALIFICATION-EXT-008' as const
const PACKET_RELATIVE_PATH =
  'tasks/motion-studio/MS-012C/c2-zero-retention-qualification-live-authorization-request-ext-008.json' as const
const AUTHORIZATION_RECORD_RELATIVE_PATH =
  'tasks/motion-studio/MS-012C/c2-zero-retention-qualification-live-authorization-record-ext-008.json' as const
const DECISION_RELATIVE_PATH =
  'tasks/motion-studio/MS-012C/c2-private-acceptance-voice-selection-decision.json' as const
const PRIVATE_RUN_ROOT_RELATIVE_PATH =
  '.reeditpro-local-storage-ms012c2-zero-retention-qualification-ext-008' as const
const CONSUMPTION_FILENAME = 'authority-consumed.json' as const
const EVIDENCE_FILENAME = 'private-zero-retention-qualification-evidence.json' as const
const FAILURE_FILENAME = 'terminal-failure.json' as const

const PROVIDER_HOSTNAME = 'api.elevenlabs.io' as const
const TTS_PATH_TEMPLATE = '/v1/text-to-speech/{private_provider_voice_id}/with-timestamps' as const
const HISTORY_PATH = '/v1/history' as const
const MODEL_ID = 'eleven_v3' as const
const OUTPUT_FORMAT = 'mp3_44100_128' as const
const HISTORY_PAGE_SIZE = 100
const HISTORY_DATE_AFTER_SAFETY_WINDOW_SECONDS = 60
const REQUEST_TIMEOUT_MILLISECONDS = 60_000
const MAXIMUM_TTS_RESPONSE_BYTES = 16 * 1024 * 1024
const MAXIMUM_HISTORY_RESPONSE_BYTES = 1024 * 1024
const MAXIMUM_CAPTURED_RESPONSE_BYTES =
  MAXIMUM_TTS_RESPONSE_BYTES + MAXIMUM_HISTORY_RESPONSE_BYTES
const MAXIMUM_PACKET_BYTES = 256 * 1024
const MAXIMUM_AUTHORIZATION_RECORD_BYTES = 64 * 1024
const MAXIMUM_REVIEWED_FILE_BYTES = 4 * 1024 * 1024
const MAXIMUM_INTERNAL_PRODUCTION_COST_MICROS = 250_000
const MAXIMUM_PROVIDER_CHARACTER_COST_CREDITS = 2_500
const PUBLIC_RATE_USD_MICROS_PER_1_000_CHARACTERS = 100_000
const PUBLIC_RATE_SOURCE_URL = 'https://elevenlabs.io/pricing/api' as const
const ZERO_RETENTION_SOURCE_URL =
  'https://elevenlabs.io/docs/eleven-api/resources/zero-retention-mode' as const
const TIMING_ENDPOINT_SOURCE_URL =
  'https://elevenlabs.io/docs/api-reference/text-to-speech/convert-with-timestamps' as const
const HISTORY_ENDPOINT_SOURCE_URL =
  'https://elevenlabs.io/docs/api-reference/history/list' as const
const OWNER_STANDING_DIRECTIVE_ID = 'MS-OWNER-STANDING-IMPLEMENTATION-QA-20260718' as const
const OWNER_STANDING_DIRECTIVE_SHA256 =
  'b933153875768280382d9e9aecd1d904c4300518426bbe6ae52496c8ea0fff68' as const
const OWNER_AUTHORIZATION_STATEMENT_SHA256 =
  'cb26b67e69b5dde409462abaeeb34b1838c1561d58751314a8e78df1c39b672b' as const
const SHA256 = /^[a-f0-9]{64}$/

export const MOTION_STUDIO_SPEECH_ZERO_RETENTION_QUALIFICATION_TEXT =
  'Private qualification eight: at first light, a quiet signal crossed the valley. This test contains no personal or customer information.' as const

const QUALIFICATION_TEXT_DIGEST = sha256Text(
  MOTION_STUDIO_SPEECH_ZERO_RETENTION_QUALIFICATION_TEXT,
)
const EXPECTED_PUBLIC_LIST_COST_MICROS =
  MOTION_STUDIO_SPEECH_ZERO_RETENTION_QUALIFICATION_TEXT.length *
  (PUBLIC_RATE_USD_MICROS_PER_1_000_CHARACTERS / 1_000)

export const MOTION_STUDIO_SPEECH_ZERO_RETENTION_QUALIFICATION_REVIEWED_RUNTIME_PATHS =
  Object.freeze([
    'server/motion-studio/speech-production/live-credential.ts',
    'server/motion-studio/speech-production/live-request.ts',
    'server/motion-studio/speech-production/voice-catalog-discovery.ts',
    'server/motion-studio/speech-production/zero-retention-qualification-live-operator.ts',
    'server/motion-studio/speech-production/zero-retention-qualification-live-cli.ts',
  ] as const)

export const MOTION_STUDIO_SPEECH_ZERO_RETENTION_QUALIFICATION_PRESERVED_HISTORY_PATHS =
  Object.freeze([
    'tasks/motion-studio/MS-012C/c2-account-preflight-live-result-ext-001.json',
    'tasks/motion-studio/MS-012C/c2-account-preflight-live-result-ext-002.json',
    'tasks/motion-studio/MS-012C/c2-account-model-capability-live-result-ext-003.json',
    'tasks/motion-studio/MS-012C/c2-secret-version-metadata-live-result-ext-004.json',
    'tasks/motion-studio/MS-012C/c2-account-model-capability-recheck-live-result-ext-005.json',
    'tasks/motion-studio/MS-012C/c2-account-subscription-live-result-ext-006.json',
    'tasks/motion-studio/MS-012C/c2-account-user-live-result-ext-007.json',
    'tasks/motion-studio/MS-012C/c2-synthetic-acceptance-live-result.json',
  ] as const)

export const MOTION_STUDIO_SPEECH_ZERO_RETENTION_QUALIFICATION_LIVE_OPERATOR_PATHS =
  Object.freeze({
    packetRelativePath: PACKET_RELATIVE_PATH,
    authorizationRecordRelativePath: AUTHORIZATION_RECORD_RELATIVE_PATH,
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
  schemaVersion: z.literal('motion-studio.speech-zero-retention-qualification-live-authorization.v1'),
  authorizationId: z.literal(AUTHORIZATION_ID),
  milestone: z.literal('MS-012C2'),
  status: z.literal('standing_directive_authorization_ready_not_executed'),
  singleUse: z.literal(true),
  purpose: z.string().trim().min(1).max(4_096),
  validFrom: z.string().datetime({ offset: true }),
  expiresAt: z.string().datetime({ offset: true }),
  reviewedRuntimeFiles: z.array(reviewedFileSchema).length(
    MOTION_STUDIO_SPEECH_ZERO_RETENTION_QUALIFICATION_REVIEWED_RUNTIME_PATHS.length,
  ),
  preservedTerminalHistory: z.array(reviewedFileSchema).length(
    MOTION_STUDIO_SPEECH_ZERO_RETENTION_QUALIFICATION_PRESERVED_HISTORY_PATHS.length,
  ),
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
    browserExposureAllowed: z.literal(false),
  }).strict(),
  credentialRuntimeIdentity: z.object({
    cloudSdkVersion: z.literal(MOTION_STUDIO_SPEECH_GCLOUD_SDK_VERSION),
    resolvedExecutablePath: z.literal(MOTION_STUDIO_SPEECH_GCLOUD_BINARY_PATH),
    executableByteLength: z.literal(MOTION_STUDIO_SPEECH_GCLOUD_BINARY_BYTE_LENGTH),
    executableSha256: z.literal(MOTION_STUDIO_SPEECH_GCLOUD_BINARY_SHA256),
    callerSelectedExecutableAllowed: z.literal(false),
    proxyOrPacAllowed: z.literal(false),
  }).strict(),
  qualificationInput: z.object({
    textDigest: z.literal(QUALIFICATION_TEXT_DIGEST),
    characterCount: z.literal(MOTION_STUDIO_SPEECH_ZERO_RETENTION_QUALIFICATION_TEXT.length),
    maximumCharacters: z.literal(160),
    syntheticNonPersonal: z.literal(true),
    userContentUsed: z.literal(false),
  }).strict(),
  ttsRequest: z.object({
    method: z.literal('POST'),
    scheme: z.literal('https'),
    hostname: z.literal(PROVIDER_HOSTNAME),
    port: z.literal(443),
    pathTemplate: z.literal(TTS_PATH_TEMPLATE),
    modelId: z.literal(MODEL_ID),
    outputFormat: z.literal(OUTPUT_FORMAT),
    enableLogging: z.literal(false),
    maximumHttpRequests: z.literal(1),
    maximumAddressConnectionAttempts: z.literal(1),
    maximumResponseBytes: z.literal(MAXIMUM_TTS_RESPONSE_BYTES),
    timeoutMilliseconds: z.literal(REQUEST_TIMEOUT_MILLISECONDS),
    maximumRedirects: z.literal(0),
  }).strict(),
  historyVerification: z.object({
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
    maximumResponseBytes: z.literal(MAXIMUM_HISTORY_RESPONSE_BYTES),
    timeoutMilliseconds: z.literal(REQUEST_TIMEOUT_MILLISECONDS),
    maximumRedirects: z.literal(0),
    requireExactRequestIdAbsence: z.literal(true),
    requireExactTextAbsence: z.literal(true),
    requireNoPagination: z.literal(true),
    rawHistoryPersisted: z.literal(false),
  }).strict(),
  totalRequestBudget: z.object({
    maximumHttpRequests: z.literal(2),
    maximumAddressConnectionAttempts: z.literal(2),
    maximumCapturedResponseBytes: z.literal(MAXIMUM_CAPTURED_RESPONSE_BYTES),
    automaticRetryAllowed: z.literal(false),
    automaticFallbackAllowed: z.literal(false),
    addressFallbackAllowed: z.literal(false),
  }).strict(),
  costPolicy: z.object({
    currency: z.literal('USD'),
    publicRateSourceUrl: z.literal(PUBLIC_RATE_SOURCE_URL),
    publicRateUsdMicrosPer1_000Characters: z.literal(
      PUBLIC_RATE_USD_MICROS_PER_1_000_CHARACTERS,
    ),
    expectedPublicListCostMicros: z.literal(EXPECTED_PUBLIC_LIST_COST_MICROS),
    maximumProviderCharacterCostCredits: z.literal(MAXIMUM_PROVIDER_CHARACTER_COST_CREDITS),
    maximumInternalProductionCostMicros: z.literal(MAXIMUM_INTERNAL_PRODUCTION_COST_MICROS),
    purchaseAllowed: z.literal(false),
    customerPricingAllowed: z.literal(false),
    customerCreditsAllowed: z.literal(false),
    serviceFeeAllowed: z.literal(false),
    billingAllowed: z.literal(false),
  }).strict(),
  evidencePolicy: z.object({
    zeroRetentionSourceUrl: z.literal(ZERO_RETENTION_SOURCE_URL),
    timingEndpointSourceUrl: z.literal(TIMING_ENDPOINT_SOURCE_URL),
    historyEndpointSourceUrl: z.literal(HISTORY_ENDPOINT_SOURCE_URL),
    privateLocalEvidenceOnly: z.literal(true),
    rawTtsResponsePersisted: z.literal(false),
    rawAudioPersisted: z.literal(false),
    rawAlignmentPersisted: z.literal(false),
    rawHistoryResponsePersisted: z.literal(false),
    rawHistoryTextPersisted: z.literal(false),
    providerVoiceIdPersisted: z.literal(false),
    credentialPersisted: z.literal(false),
    browserProjectionAllowed: z.literal(false),
    automaticVoiceSelectionAllowed: z.literal(false),
    finalTakeSelectionAllowed: z.literal(false),
    timelineMutationAllowed: z.literal(false),
    productionPromotionAllowed: z.literal(false),
  }).strict(),
  operator: z.object({
    command: z.literal(
      './node_modules/.bin/tsx server/motion-studio/speech-production/zero-retention-qualification-live-cli.ts',
    ),
    privateRunRootRelativePath: z.literal(PRIVATE_RUN_ROOT_RELATIVE_PATH),
    consumeBeforeCredentialRead: z.literal(true),
    createOnlyEvidence: z.literal(true),
  }).strict(),
  explicitlyForbidden: z.array(z.string().trim().min(1).max(1_024)).min(12).max(40),
}).strict()

const authorizationRecordSchema = z.object({
  schemaVersion: z.literal(
    'motion-studio.speech-zero-retention-qualification-live-authorization-record.v1',
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
  maximumHttpRequests: z.literal(2),
  maximumAddressConnectionAttempts: z.literal(2),
  maximumCapturedResponseBytes: z.literal(MAXIMUM_CAPTURED_RESPONSE_BYTES),
  maximumInternalProductionCostMicros: z.literal(MAXIMUM_INTERNAL_PRODUCTION_COST_MICROS),
  automaticRetryAllowed: z.literal(false),
  automaticFallbackAllowed: z.literal(false),
  purchaseAllowed: z.literal(false),
  privateLocalEvidenceOnly: z.literal(true),
}).strict()

type Packet = z.infer<typeof packetSchema>
type EvidenceClass = 'authenticated_provider_zero_retention_qualification' | 'private_local_fixture'

export interface MotionStudioSpeechZeroRetentionQualificationResultV1 {
  schemaVersion: 'motion-studio.speech-zero-retention-qualification-result.v1'
  state:
    | 'private_zero_retention_qualification_evidence_ready_not_production_ready'
    | 'private_zero_retention_qualification_contract_verified_non_promotable'
  evidenceClass: EvidenceClass
  authorizationId: typeof AUTHORIZATION_ID
  authorityPacketDigest: string
  evidenceDigest: string
  zeroRetentionRequestAccepted: true
  zeroRetentionHistoryAbsenceVerified: true
  zeroRetentionEntitlementVerified: boolean
  exactQualificationRequestFundedWithoutPurchase: boolean
  productionQuotaSufficiencyVerified: false
  credentialPayloadReadCount: 1
  providerHttpRequestCount: 2
  addressConnectionAttemptCount: 2
  providerGenerationSubmissionCount: 1
  providerGenerationCompletedCount: 1
  automaticRetryCount: 0
  automaticFallbackCount: 0
  purchaseCount: 0
  accountMutationCount: 0
  publicListProviderCostMicros: number
  maximumInternalProductionCostMicros: typeof MAXIMUM_INTERNAL_PRODUCTION_COST_MICROS
  privateEvidenceRelativePath: typeof PRIVATE_RUN_ROOT_RELATIVE_PATH
  productReady: false
  externalBetaReady: false
  productionReady: false
  finalTakeSelectionAllowed: false
  timelineMutationAllowed: false
  customerBillingPerformed: false
  immutable: true
}

export interface MotionStudioSpeechZeroRetentionQualificationFixtureRequest {
  sequence: 1 | 2
  method: 'POST' | 'GET'
  hostname: typeof PROVIDER_HOSTNAME
  path: string
  bodyDigest: string | null
}

export interface MotionStudioSpeechZeroRetentionQualificationFixtureInput {
  repositoryRoot: string
  now: string
  apiKeyFixture: string
  resolvedIpv4Addresses: readonly string[]
  ttsResponse: ProviderFixtureResponse
  historyResponse: ProviderFixtureResponse
  onFixtureRequest?: (request: MotionStudioSpeechZeroRetentionQualificationFixtureRequest) => void
}

interface ProviderFixtureResponse {
  statusCode: number
  contentType: string
  bytes: Buffer
  requestIdentifier?: string
  characterCost?: string
  location?: string
}

interface ProviderResponse {
  statusCode: number
  contentType: 'application/json'
  bytes: Buffer
  requestIdentifier: string | null
  characterCost: string | null
}

interface SafeProgress {
  lastPhase: string
  credentialPayloadReadCount: 0 | 1
  providerHttpRequestCount: 0 | 1 | 2
  addressConnectionAttemptCount: 0 | 1 | 2
  providerGenerationSubmissionCount: 0 | 1
  providerGenerationCompletedCount: 0 | 1
  ttsStatusCode?: number
  historyStatusCode?: number
  providerRequestIdDigest?: string
  audioDigest?: string
  audioByteLength?: number
}

export interface MotionStudioSpeechZeroRetentionQualificationAuthorityVerificationV1 {
  schemaVersion: 'motion-studio.speech-zero-retention-qualification-authority-verification.v1'
  state: 'single_use_authority_verified_unconsumed'
  authorizationId: typeof AUTHORIZATION_ID
  authorityPacketDigest: string
  authorizationRecordDigest: string
  decisionDigest: string
  catalogEvidenceDigest: string
  voiceIdentityHash: string
  reviewedRuntimeFileCount: number
  preservedTerminalHistoryCount: number
  validFrom: string
  expiresAt: string
  maximumSecretPayloadReads: 1
  maximumHttpRequests: 2
  maximumAddressConnectionAttempts: 2
  maximumCapturedResponseBytes: typeof MAXIMUM_CAPTURED_RESPONSE_BYTES
  maximumInternalProductionCostMicros: typeof MAXIMUM_INTERNAL_PRODUCTION_COST_MICROS
  enableLogging: false
  exactHistoryAbsenceRequired: true
  liveExecutionPerformed: false
  credentialPayloadReadCount: 0
  providerHttpRequestCount: 0
  providerGenerationSubmissionCount: 0
  immutable: true
}

/** Read-only authority review. It performs no credential read, network request, or write. */
export async function verifyMotionStudioSpeechZeroRetentionQualificationAuthority(input: {
  repositoryRoot: string
  now: string
}): Promise<MotionStudioSpeechZeroRetentionQualificationAuthorityVerificationV1> {
  const context = await loadAuthorityContext(input)
  await assertAuthorityUnconsumed(context.repositoryRoot)
  return Object.freeze({
    schemaVersion: 'motion-studio.speech-zero-retention-qualification-authority-verification.v1',
    state: 'single_use_authority_verified_unconsumed',
    authorizationId: AUTHORIZATION_ID,
    authorityPacketDigest: context.authorityPacketDigest,
    authorizationRecordDigest: sha256Bytes(context.authorizationBytes),
    decisionDigest: context.decision.decisionDigest,
    catalogEvidenceDigest: context.catalog.evidenceDigest,
    voiceIdentityHash: context.decision.voiceIdentityHash,
    reviewedRuntimeFileCount: context.packet.reviewedRuntimeFiles.length,
    preservedTerminalHistoryCount: context.packet.preservedTerminalHistory.length,
    validFrom: context.packet.validFrom,
    expiresAt: context.packet.expiresAt,
    maximumSecretPayloadReads: 1,
    maximumHttpRequests: 2,
    maximumAddressConnectionAttempts: 2,
    maximumCapturedResponseBytes: MAXIMUM_CAPTURED_RESPONSE_BYTES,
    maximumInternalProductionCostMicros: MAXIMUM_INTERNAL_PRODUCTION_COST_MICROS,
    enableLogging: false,
    exactHistoryAbsenceRequired: true,
    liveExecutionPerformed: false,
    credentialPayloadReadCount: 0,
    providerHttpRequestCount: 0,
    providerGenerationSubmissionCount: 0,
    immutable: true,
  })
}

export async function executeMotionStudioSpeechZeroRetentionQualificationLiveOperator(input: {
  repositoryRoot: string
  now: string
}): Promise<MotionStudioSpeechZeroRetentionQualificationResultV1> {
  return executeOperator({ ...input, mode: 'live' })
}

/** Networkless proof only. Fixture evidence is always non-promotable. */
export async function executeMotionStudioSpeechZeroRetentionQualificationFixtureOperator(
  input: MotionStudioSpeechZeroRetentionQualificationFixtureInput,
): Promise<MotionStudioSpeechZeroRetentionQualificationResultV1> {
  return executeOperator({ ...input, mode: 'fixture' })
}

async function executeOperator(input: ({
  mode: 'live'
  repositoryRoot: string
  now: string
} | ({ mode: 'fixture' } & MotionStudioSpeechZeroRetentionQualificationFixtureInput))): Promise<
  MotionStudioSpeechZeroRetentionQualificationResultV1
> {
  const {
    repositoryRoot,
    now,
    authorityPacketDigest,
    authorizationBytes,
    authorization,
    decision,
    catalog,
    providerVoiceId,
  } = await loadAuthorityContext(input)

  const runRoot = inside(repositoryRoot, PRIVATE_RUN_ROOT_RELATIVE_PATH)
  await mkdir(runRoot, { recursive: true, mode: 0o700 })
  await assertPrivateDirectory(runRoot, repositoryRoot)
  const consumptionPath = join(runRoot, CONSUMPTION_FILENAME)
  const evidencePath = join(runRoot, EVIDENCE_FILENAME)
  const failurePath = join(runRoot, FAILURE_FILENAME)
  const progress: SafeProgress = {
    lastPhase: 'authority_validated',
    credentialPayloadReadCount: 0,
    providerHttpRequestCount: 0,
    addressConnectionAttemptCount: 0,
    providerGenerationSubmissionCount: 0,
    providerGenerationCompletedCount: 0,
  }

  await writePrivateJsonCreateOnly(consumptionPath, {
    schemaVersion: 'motion-studio.speech-zero-retention-qualification-authority-consumption.v1',
    state: 'single_use_authority_consumed_before_credential_read',
    authorizationId: AUTHORIZATION_ID,
    authorityPacketDigest,
    authorizationRecordDigest: sha256Bytes(authorizationBytes),
    ownerAuthorizationEvidenceId: authorization.ownerAuthorizationEvidenceId,
    decisionDigest: decision.decisionDigest,
    catalogEvidenceDigest: catalog.evidenceDigest,
    voiceIdentityHash: decision.voiceIdentityHash,
    qualificationTextDigest: QUALIFICATION_TEXT_DIGEST,
    enableLogging: false,
    maximumSecretPayloadReads: 1,
    maximumHttpRequests: 2,
    providerGenerationSubmissionCountAtConsumption: 0,
    credentialPayloadReadCountAtConsumption: 0,
    providerHttpRequestCountAtConsumption: 0,
    consumedAt: now,
    immutable: true,
  }, 'Zero-retention qualification authority was already consumed.')

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
    const selectedAddressDigest = sha256Text(selectedAddress)

    const requestBody = Object.freeze({
      text: MOTION_STUDIO_SPEECH_ZERO_RETENTION_QUALIFICATION_TEXT,
      model_id: MODEL_ID,
    })
    const requestBodyText = JSON.stringify(requestBody)
    const ttsPath = `/v1/text-to-speech/${encodeURIComponent(providerVoiceId)}` +
      `/with-timestamps?output_format=${OUTPUT_FORMAT}&enable_logging=false`
    progress.lastPhase = 'tts_request_started'
    progress.providerHttpRequestCount = 1
    progress.addressConnectionAttemptCount = 1
    progress.providerGenerationSubmissionCount = 1
    const ttsResponse = input.mode === 'live'
      ? await requestProviderJson({
        apiKey,
        selectedAddress,
        method: 'POST',
        path: ttsPath,
        body: requestBodyText,
        maximumResponseBytes: MAXIMUM_TTS_RESPONSE_BYTES,
      })
      : fixtureResponse(input.ttsResponse, MAXIMUM_TTS_RESPONSE_BYTES, {
        sequence: 1,
        method: 'POST',
        hostname: PROVIDER_HOSTNAME,
        path: ttsPath,
        bodyDigest: sha256Text(requestBodyText),
      }, input.onFixtureRequest)
    progress.ttsStatusCode = ttsResponse.statusCode
    progress.lastPhase = 'tts_response_received'
    if (ttsResponse.statusCode !== 200) {
      blocked('Zero-retention qualification TTS request was rejected by the provider.')
    }
    const requestIdentifier = validateProviderRequestIdentifier(ttsResponse.requestIdentifier)
    progress.providerRequestIdDigest = sha256Text(requestIdentifier)
    const characterCost = parseCharacterCostHeader(ttsResponse.characterCost)
    if (!characterCost || characterCost.credits <= 0 ||
      characterCost.credits > MAXIMUM_PROVIDER_CHARACTER_COST_CREDITS) {
      blocked('Zero-retention qualification lacks bounded provider character-cost evidence.')
    }
    const publicListProviderCostMicros = calculatePublicListCostMicros(characterCost.microcredits)
    if (publicListProviderCostMicros > MAXIMUM_INTERNAL_PRODUCTION_COST_MICROS) {
      blocked('Zero-retention qualification exceeds its internal-production-cost ceiling.')
    }
    const parsed = parseMotionStudioElevenLabsTimingResponse({
      value: parseJson(ttsResponse.bytes, 'zero-retention timing response'),
      expectedSpokenText: MOTION_STUDIO_SPEECH_ZERO_RETENTION_QUALIFICATION_TEXT,
    })
    progress.providerGenerationCompletedCount = 1
    progress.audioDigest = sha256Bytes(parsed.audioBytes)
    progress.audioByteLength = parsed.audioBytes.byteLength
    progress.lastPhase = 'tts_response_validated'

    const alignmentProjection = Object.freeze({
      sourceAlignmentDigest: sha256CanonicalJson(parsed.alignment),
      normalizedAlignmentDigest: sha256CanonicalJson(parsed.normalizedAlignment),
      sourceCharacterCount: parsed.alignment.characters.length,
      normalizedCharacterCount: parsed.normalizedAlignment.characters.length,
    })
    const dateAfterUnix = Math.floor(Date.parse(now) / 1_000) -
      HISTORY_DATE_AFTER_SAFETY_WINDOW_SECONDS
    const historyQuery = new URLSearchParams({
      page_size: String(HISTORY_PAGE_SIZE),
      voice_id: providerVoiceId,
      model_id: MODEL_ID,
      source: 'TTS',
      date_after_unix: String(dateAfterUnix),
      sort_direction: 'desc',
    })
    const historyPath = `${HISTORY_PATH}?${historyQuery.toString()}`
    progress.lastPhase = 'history_request_started'
    progress.providerHttpRequestCount = 2
    progress.addressConnectionAttemptCount = 2
    const historyResponse = input.mode === 'live'
      ? await requestProviderJson({
        apiKey,
        selectedAddress,
        method: 'GET',
        path: historyPath,
        body: null,
        maximumResponseBytes: MAXIMUM_HISTORY_RESPONSE_BYTES,
      })
      : fixtureResponse(input.historyResponse, MAXIMUM_HISTORY_RESPONSE_BYTES, {
        sequence: 2,
        method: 'GET',
        hostname: PROVIDER_HOSTNAME,
        path: historyPath,
        bodyDigest: null,
      }, input.onFixtureRequest)
    progress.historyStatusCode = historyResponse.statusCode
    progress.lastPhase = 'history_response_received'
    if (historyResponse.statusCode !== 200) {
      blocked('Zero-retention qualification history verification was rejected by the provider.')
    }
    const history = validateHistoryAbsence({
      bytes: historyResponse.bytes,
      requestIdentifier,
      qualificationText: MOTION_STUDIO_SPEECH_ZERO_RETENTION_QUALIFICATION_TEXT,
      providerVoiceId,
      dateAfterUnix,
    })
    progress.lastPhase = 'history_absence_verified'

    const evidenceClass: EvidenceClass = input.mode === 'live'
      ? 'authenticated_provider_zero_retention_qualification'
      : 'private_local_fixture'
    const isPromotableEntitlementEvidence = evidenceClass ===
      'authenticated_provider_zero_retention_qualification'
    const evidenceBase = {
      schemaVersion: 'motion-studio.speech-zero-retention-qualification-private-evidence.v1' as const,
      state: isPromotableEntitlementEvidence
        ? 'private_zero_retention_qualification_evidence_ready_not_production_ready' as const
        : 'private_zero_retention_qualification_contract_verified_non_promotable' as const,
      evidenceClass,
      authorizationId: AUTHORIZATION_ID,
      authorityPacketDigest,
      ownerAuthorizationEvidenceId: authorization.ownerAuthorizationEvidenceId,
      decisionDigest: decision.decisionDigest,
      catalogEvidenceDigest: catalog.evidenceDigest,
      voiceIdentityHash: decision.voiceIdentityHash,
      credentialAuthority: {
        provider: 'google_secret_manager' as const,
        projectId: MOTION_STUDIO_SPEECH_GOOGLE_CLOUD_PROJECT_ID,
        secretLocatorId: MOTION_STUDIO_SPEECH_ELEVENLABS_SECRET_LOCATOR_ID,
        numericVersion: MOTION_STUDIO_SPEECH_ELEVENLABS_SECRET_VERSION,
        credentialPayloadReadCount: 1 as const,
        credentialPersisted: false as const,
      },
      qualificationInput: {
        textDigest: QUALIFICATION_TEXT_DIGEST,
        characterCount: MOTION_STUDIO_SPEECH_ZERO_RETENTION_QUALIFICATION_TEXT.length,
        syntheticNonPersonal: true as const,
        userContentUsed: false as const,
      },
      ttsRequest: {
        method: 'POST' as const,
        hostname: PROVIDER_HOSTNAME,
        pathTemplate: TTS_PATH_TEMPLATE,
        modelId: MODEL_ID,
        outputFormat: OUTPUT_FORMAT,
        enableLogging: false as const,
        requestCount: 1 as const,
        addressConnectionAttemptCount: 1 as const,
        selectedAddressFamily: 'IPv4' as const,
        selectedAddressDigest,
        redirectCount: 0 as const,
        retryCount: 0 as const,
        fallbackCount: 0 as const,
        requestBodyDigest: sha256CanonicalJson(requestBody),
        providerRequestIdDigest: sha256Text(requestIdentifier),
        responseByteLength: ttsResponse.bytes.byteLength,
        responseDigest: sha256Bytes(ttsResponse.bytes),
        rawResponsePersisted: false as const,
      },
      generatedCandidateProjection: {
        audioMimeType: parsed.mimeType,
        audioByteLength: parsed.audioBytes.byteLength,
        audioSha256: sha256Bytes(parsed.audioBytes),
        audioPersisted: false as const,
        alignmentProjection,
        alignmentPersisted: false as const,
        finalTakeSelectionAllowed: false as const,
      },
      historyVerification: {
        method: 'GET' as const,
        hostname: PROVIDER_HOSTNAME,
        pathTemplate: HISTORY_PATH,
        requestCount: 1 as const,
        addressConnectionAttemptCount: 1 as const,
        selectedAddressFamily: 'IPv4' as const,
        selectedAddressDigest,
        dateAfterUnix,
        pageSize: HISTORY_PAGE_SIZE,
        exactVoiceFilterApplied: true as const,
        exactModelFilterApplied: true as const,
        sourceFilter: 'TTS' as const,
        requestIdentifierAbsent: true as const,
        qualificationTextAbsent: true as const,
        paginationAbsent: true as const,
        returnedItemCount: history.itemCount,
        projectionDigest: history.projectionDigest,
        responseByteLength: historyResponse.bytes.byteLength,
        rawResponsePersisted: false as const,
        rawHistoryTextPersisted: false as const,
      },
      qualification: {
        zeroRetentionRequestAccepted: true as const,
        zeroRetentionHistoryAbsenceVerified: true as const,
        zeroRetentionEntitlementVerified: isPromotableEntitlementEvidence,
        entitlementScope: isPromotableEntitlementEvidence
          ? 'exact_authenticated_tts_route_and_api_key_version' as const
          : 'fixture_contract_only_non_promotable' as const,
        exactQualificationRequestFundedWithoutPurchase: isPromotableEntitlementEvidence,
        productionQuotaSufficiencyVerified: false as const,
        accountTierClaimed: false as const,
        accountIdentityPersisted: false as const,
      },
      costEvidence: {
        providerCharacterCostCredits: characterCost.credits,
        providerCharacterCostMicrocredits: characterCost.microcredits,
        method: 'provider_character_cost_header_times_official_public_api_rate' as const,
        publicRateSourceUrl: PUBLIC_RATE_SOURCE_URL,
        publicRateUsdMicrosPer1_000Characters:
          PUBLIC_RATE_USD_MICROS_PER_1_000_CHARACTERS,
        expectedPublicListCostMicros: EXPECTED_PUBLIC_LIST_COST_MICROS,
        publicListProviderCostMicros,
        maximumInternalProductionCostMicros: MAXIMUM_INTERNAL_PRODUCTION_COST_MICROS,
        actualInfrastructureCostMicros: null,
        exactAccountInvoiceCostMicros: null,
        customerPricingIncluded: false as const,
        customerCreditsIncluded: false as const,
        serviceFeeIncluded: false as const,
        customerBillingPerformed: false as const,
      },
      usage: {
        credentialPayloadReadCount: 1 as const,
        providerHttpRequestCount: 2 as const,
        addressConnectionAttemptCount: 2 as const,
        providerGenerationSubmissionCount: 1 as const,
        providerGenerationCompletedCount: 1 as const,
        automaticRetryCount: 0 as const,
        automaticFallbackCount: 0 as const,
        purchaseCount: 0 as const,
        accountMutationCount: 0 as const,
      },
      boundaries: {
        privateLocalEvidenceOnly: true as const,
        browserProjectionAllowed: false as const,
        rawProviderResponsePersisted: false as const,
        providerVoiceIdPersisted: false as const,
        credentialPersisted: false as const,
        finalTakeSelectionAllowed: false as const,
        timelineMutationAllowed: false as const,
        renderAllowed: false as const,
        exportAllowed: false as const,
        deploymentAllowed: false as const,
        publicDeliveryAllowed: false as const,
        productReady: false as const,
        externalBetaReady: false as const,
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
      'Zero-retention qualification evidence already exists.',
    )
    progress.lastPhase = 'private_evidence_persisted'
    return Object.freeze({
      schemaVersion: 'motion-studio.speech-zero-retention-qualification-result.v1',
      state: evidence.state,
      evidenceClass,
      authorizationId: AUTHORIZATION_ID,
      authorityPacketDigest,
      evidenceDigest: evidence.evidenceDigest,
      zeroRetentionRequestAccepted: true,
      zeroRetentionHistoryAbsenceVerified: true,
      zeroRetentionEntitlementVerified: isPromotableEntitlementEvidence,
      exactQualificationRequestFundedWithoutPurchase: isPromotableEntitlementEvidence,
      productionQuotaSufficiencyVerified: false,
      credentialPayloadReadCount: 1,
      providerHttpRequestCount: 2,
      addressConnectionAttemptCount: 2,
      providerGenerationSubmissionCount: 1,
      providerGenerationCompletedCount: 1,
      automaticRetryCount: 0,
      automaticFallbackCount: 0,
      purchaseCount: 0,
      accountMutationCount: 0,
      publicListProviderCostMicros,
      maximumInternalProductionCostMicros: MAXIMUM_INTERNAL_PRODUCTION_COST_MICROS,
      privateEvidenceRelativePath: PRIVATE_RUN_ROOT_RELATIVE_PATH,
      productReady: false,
      externalBetaReady: false,
      productionReady: false,
      finalTakeSelectionAllowed: false,
      timelineMutationAllowed: false,
      customerBillingPerformed: false,
      immutable: true,
    })
  } catch (error) {
    await writePrivateJsonCreateOnly(failurePath, {
      schemaVersion: 'motion-studio.speech-zero-retention-qualification-terminal-failure.v1',
      state: progress.providerGenerationSubmissionCount === 1 && progress.ttsStatusCode === undefined
        ? 'consumed_terminal_outcome_unknown_no_retry'
        : 'consumed_terminal_failure_no_retry',
      authorizationId: AUTHORIZATION_ID,
      authorityPacketDigest,
      ownerAuthorizationEvidenceId: authorization.ownerAuthorizationEvidenceId,
      decisionDigest: decision.decisionDigest,
      catalogEvidenceDigest: catalog.evidenceDigest,
      failureCode: error instanceof ApiError ? error.code : 'MOTION_STUDIO_APPROVAL_BLOCKED',
      safeFailureClass: classifyFailure(progress.lastPhase),
      safeProgress: progress,
      zeroRetentionEntitlementVerified: false,
      zeroRetentionHistoryAbsenceVerified: false,
      rawErrorMessagePersisted: false,
      credentialPersisted: false,
      providerVoiceIdPersisted: false,
      rawTtsResponsePersisted: false,
      rawAudioPersisted: false,
      rawAlignmentPersisted: false,
      rawHistoryResponsePersisted: false,
      rawHistoryTextPersisted: false,
      rawResolvedAddressPersisted: false,
      automaticRetryAllowed: false,
      automaticFallbackAllowed: false,
      finalTakeSelectionAllowed: false,
      timelineMutationAllowed: false,
      customerBillingPerformed: false,
      failedAt: now,
      immutable: true,
    }, 'Zero-retention qualification terminal failure already exists.')
    blocked('Zero-retention qualification ended terminally; retry and fallback are forbidden.')
  }
}

async function loadAuthorityContext(input: { repositoryRoot: string; now: string }) {
  const repositoryRoot = await realpath(input.repositoryRoot)
  const now = exactIso(input.now, 'zero-retention qualification time')
  const packetBytes = await readRegularBoundedFile(
    inside(repositoryRoot, PACKET_RELATIVE_PATH),
    MAXIMUM_PACKET_BYTES,
    'zero-retention qualification authority packet',
  )
  const authorityPacketDigest = sha256Bytes(packetBytes)
  const packet = packetSchema.parse(parseJson(packetBytes, 'zero-retention qualification packet'))
  validateExecutionWindow(packet.validFrom, packet.expiresAt, now, 'authority packet')
  assertExactReviewedPathSet(
    packet.reviewedRuntimeFiles,
    MOTION_STUDIO_SPEECH_ZERO_RETENTION_QUALIFICATION_REVIEWED_RUNTIME_PATHS,
    'reviewed runtime',
  )
  assertExactReviewedPathSet(
    packet.preservedTerminalHistory,
    MOTION_STUDIO_SPEECH_ZERO_RETENTION_QUALIFICATION_PRESERVED_HISTORY_PATHS,
    'preserved history',
  )
  await verifyReviewedFiles(repositoryRoot, packet.reviewedRuntimeFiles)
  await verifyReviewedFiles(repositoryRoot, packet.preservedTerminalHistory)

  const authorizationBytes = await readRegularBoundedFile(
    inside(repositoryRoot, AUTHORIZATION_RECORD_RELATIVE_PATH),
    MAXIMUM_AUTHORIZATION_RECORD_BYTES,
    'zero-retention qualification authorization record',
  )
  const authorization = authorizationRecordSchema.parse(
    parseJson(authorizationBytes, 'zero-retention qualification authorization record'),
  )
  if (authorization.authorityPacketDigest !== authorityPacketDigest) {
    blocked('Zero-retention qualification authorization does not bind the exact packet.')
  }
  validateExecutionWindow(authorization.recordedAt, authorization.expiresAt, now, 'authorization')
  if (
    authorization.recordedAt !== packet.validFrom ||
    authorization.expiresAt !== packet.expiresAt
  ) {
    blocked('Zero-retention qualification authorization window does not match its packet.')
  }

  const decisionBytes = await readRegularBoundedFile(
    inside(repositoryRoot, packet.acceptedVoiceDecision.relativePath),
    32 * 1024,
    'accepted voice decision',
  )
  if (sha256Bytes(decisionBytes) !== packet.acceptedVoiceDecision.fileSha256) {
    blocked('Zero-retention qualification voice decision changed after review.')
  }
  const decision = parseAcceptedVoiceDecision(decisionBytes, packet)
  const catalog = await loadMotionStudioSpeechVoiceCatalogPrivateAcceptanceEvidence({ repositoryRoot })
  if (catalog.evidenceDigest !== packet.acceptedVoiceDecision.catalogEvidenceDigest) {
    blocked('Zero-retention qualification catalog evidence changed after review.')
  }
  const candidates = catalog.candidates.filter((candidate) =>
    candidate.voiceIdentityHash === decision.voiceIdentityHash &&
    candidate.candidateEvidenceDigest === decision.candidateEvidenceDigest)
  if (candidates.length !== 1 || candidates[0]!.category !== 'premade') {
    blocked('Zero-retention qualification requires the one exact reviewed premade voice.')
  }
  return {
    repositoryRoot,
    now,
    packetBytes,
    authorityPacketDigest,
    packet,
    authorizationBytes,
    authorization,
    decisionBytes,
    decision,
    catalog,
    providerVoiceId: candidates[0]!.providerVoiceId,
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
    blocked('Zero-retention qualification credential is malformed.')
  }
  return normalized
}

async function requestProviderJson(input: {
  apiKey: string
  selectedAddress: string
  method: 'POST' | 'GET'
  path: string
  body: string | null
  maximumResponseBytes: number
}): Promise<ProviderResponse> {
  return new Promise((resolveRequest, rejectRequest) => {
    let settled = false
    const finishError = () => {
      if (settled) return
      settled = true
      rejectRequest(new ApiError(
        'MOTION_STUDIO_APPROVAL_BLOCKED',
        'Zero-retention qualification provider request failed.',
        409,
      ))
    }
    const request = httpsRequest({
      protocol: 'https:',
      hostname: PROVIDER_HOSTNAME,
      servername: PROVIDER_HOSTNAME,
      port: 443,
      path: input.path,
      method: input.method,
      agent: false,
      family: 4,
      lookup: (_hostname, _options, callback) => callback(null, input.selectedAddress, 4),
      headers: {
        Accept: 'application/json',
        ...(input.body === null
          ? {}
          : {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(input.body),
          }),
        'User-Agent': 'ReEditPro-MotionStudio-PrivateZeroRetentionQualification/1.0',
        'xi-api-key': input.apiKey,
      },
    }, (response) => {
      const chunks: Buffer[] = []
      let byteLength = 0
      response.on('data', (chunk: Buffer | Uint8Array | string) => {
        const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
        byteLength += bytes.byteLength
        if (byteLength > input.maximumResponseBytes) {
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
        const statusCode = response.statusCode ?? 0
        if (contentType !== 'application/json' || response.headers.location !== undefined) {
          finishError()
          return
        }
        const requestIdentifier = String(
          response.headers['request-id'] ?? response.headers['x-request-id'] ?? '',
        ).trim()
        const characterCost = String(response.headers['character-cost'] ?? '').trim()
        settled = true
        resolveRequest({
          statusCode,
          contentType: 'application/json',
          bytes: Buffer.concat(chunks, byteLength),
          requestIdentifier: requestIdentifier.length > 0 ? requestIdentifier : null,
          characterCost: characterCost.length > 0 ? characterCost : null,
        })
      })
    })
    request.setTimeout(REQUEST_TIMEOUT_MILLISECONDS, () => {
      request.destroy()
      finishError()
    })
    request.on('error', finishError)
    if (input.body === null) request.end()
    else request.end(input.body)
  })
}

function fixtureResponse(
  fixture: ProviderFixtureResponse,
  maximumResponseBytes: number,
  request: MotionStudioSpeechZeroRetentionQualificationFixtureRequest,
  observer: MotionStudioSpeechZeroRetentionQualificationFixtureInput['onFixtureRequest'],
): ProviderResponse {
  observer?.(request)
  const contentType = fixture.contentType.split(';', 1)[0]!.trim().toLowerCase()
  if (
    contentType !== 'application/json' || fixture.location !== undefined ||
    fixture.bytes.byteLength > maximumResponseBytes
  ) blocked('Zero-retention qualification fixture response violates its exact boundary.')
  return {
    statusCode: fixture.statusCode,
    contentType: 'application/json',
    bytes: Buffer.from(fixture.bytes),
    requestIdentifier: fixture.requestIdentifier?.trim() || null,
    characterCost: fixture.characterCost?.trim() || null,
  }
}

function validateProviderRequestIdentifier(value: string | null): string {
  if (!value || value.length > 512 || !/^[\x21-\x7e]+$/.test(value)) {
    blocked('Zero-retention qualification requires one bounded provider request identifier.')
  }
  return value
}

function validateHistoryAbsence(input: {
  bytes: Buffer
  requestIdentifier: string
  qualificationText: string
  providerVoiceId: string
  dateAfterUnix: number
}): { itemCount: number; projectionDigest: string } {
  const value = object(parseJson(input.bytes, 'zero-retention history response'), 'history response')
  if (!Array.isArray(value.history) || typeof value.has_more !== 'boolean') {
    blocked('Zero-retention qualification history response is malformed.')
  }
  if (value.history.length > HISTORY_PAGE_SIZE || value.has_more) {
    blocked('Zero-retention qualification history absence is not conclusive without pagination.')
  }
  const projection = value.history.map((entry, index) => {
    const item = object(entry, `history item ${index}`)
    const requestId = nullableBoundedString(item.request_id, 512, `history request id ${index}`)
    const text = nullableBoundedString(item.text, 100_000, `history text ${index}`)
    const voiceId = nullableBoundedString(item.voice_id, 512, `history voice id ${index}`)
    const modelId = nullableBoundedString(item.model_id, 512, `history model id ${index}`)
    const source = nullableBoundedString(item.source, 64, `history source ${index}`)
    const dateUnix = nonNegativeSafeInteger(item.date_unix, `history date ${index}`)
    if (
      requestId === null || voiceId !== input.providerVoiceId || modelId !== MODEL_ID ||
      source !== 'TTS' || dateUnix < input.dateAfterUnix
    ) {
      blocked('Zero-retention qualification history filters were not honored conclusively.')
    }
    if (requestId === input.requestIdentifier || text === input.qualificationText) {
      blocked('Zero-retention qualification request appeared in provider history.')
    }
    return {
      requestIdentifierDigest: requestId === null ? null : sha256Text(requestId),
      voiceIdentityDigest: voiceId === null ? null : sha256Text(voiceId),
      modelId,
      source,
      dateUnix,
    }
  })
  return {
    itemCount: projection.length,
    projectionDigest: sha256CanonicalJson({
      itemCount: projection.length,
      hasMore: false,
      items: projection,
      exactRequestAbsent: true,
      qualificationTextAbsent: true,
    }),
  }
}

function parseAcceptedVoiceDecision(bytes: Buffer, packet: Packet): {
  decisionDigest: string
  voiceIdentityHash: string
  candidateEvidenceDigest: string
} {
  const value = object(parseJson(bytes, 'accepted voice decision'), 'accepted voice decision')
  if (
    value.schemaVersion !== 'motion-studio.speech-private-acceptance-voice-selection-decision.v1' ||
    value.decisionDigest !== packet.acceptedVoiceDecision.decisionDigest ||
    value.catalogEvidenceDigest !== packet.acceptedVoiceDecision.catalogEvidenceDigest ||
    value.voiceIdentityHash !== packet.acceptedVoiceDecision.voiceIdentityHash ||
    value.candidateEvidenceDigest !== packet.acceptedVoiceDecision.candidateEvidenceDigest ||
    value.providerVoiceIdPersisted !== false || value.productionUserDefault !== false ||
    value.finalVoiceSelectionAllowed !== false || value.immutable !== true
  ) blocked('Zero-retention qualification voice decision lost its private acceptance boundary.')
  return {
    decisionDigest: String(value.decisionDigest),
    voiceIdentityHash: String(value.voiceIdentityHash),
    candidateEvidenceDigest: String(value.candidateEvidenceDigest),
  }
}

function parseCharacterCostHeader(value: string | null): { credits: number; microcredits: number } | null {
  const normalized = value?.trim()
  if (!normalized) return null
  const match = /^(0|[1-9]\d*)(?:\.(\d{1,6}))?$/.exec(normalized)
  if (!match) return null
  const microcredits = Number(match[1]) * 1_000_000 + Number((match[2] ?? '').padEnd(6, '0'))
  if (!Number.isSafeInteger(microcredits) || microcredits < 0) return null
  return { credits: microcredits / 1_000_000, microcredits }
}

function calculatePublicListCostMicros(providerCharacterCostMicrocredits: number): number {
  const numerator = BigInt(providerCharacterCostMicrocredits) *
    BigInt(PUBLIC_RATE_USD_MICROS_PER_1_000_CHARACTERS)
  const denominator = 1_000_000n * 1_000n
  const value = numerator === 0n ? 0n : (numerator + denominator - 1n) / denominator
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
    blocked('Zero-retention qualification cost exceeds safe numeric bounds.')
  }
  return Number(value)
}

function selectOnePublicIpv4(addresses: readonly string[]): string {
  const unique = [...new Set(addresses)].sort()
  if (unique.length === 0 || unique.some((address) => !isPublicIpv4(address))) {
    blocked('Zero-retention qualification DNS results are empty or unsafe.')
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

function validateExecutionWindow(validFrom: string, expiresAt: string, now: string, label: string): void {
  const start = Date.parse(validFrom)
  const end = Date.parse(expiresAt)
  const current = Date.parse(now)
  if (current < start || current >= end || end <= start || end - start > 86_400_000) {
    blocked(`Zero-retention qualification ${label} is outside its exact execution window.`)
  }
}

function assertExactReviewedPathSet(
  files: readonly { relativePath: string }[],
  expected: readonly string[],
  label: string,
): void {
  const actual = files.map((file) => file.relativePath)
  if (new Set(actual).size !== actual.length ||
    JSON.stringify([...actual].sort()) !== JSON.stringify([...expected].sort())) {
    blocked(`Zero-retention qualification ${label} file set changed.`)
  }
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
      blocked(`Zero-retention qualification reviewed file changed: ${file.relativePath}.`)
    }
  }
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

async function assertPrivateDirectory(path: string, repositoryRoot: string): Promise<void> {
  const [resolvedPath, metadata] = await Promise.all([realpath(path), lstat(path)])
  if (
    !resolvedPath.startsWith(`${repositoryRoot}${sep}`) || !metadata.isDirectory() ||
    metadata.isSymbolicLink() || (metadata.mode & 0o777) !== 0o700 ||
    (typeof process.getuid === 'function' && metadata.uid !== process.getuid())
  ) blocked('Zero-retention qualification private root is not owner-private.')
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
  blocked('Zero-retention qualification authority is already consumed.')
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
    blocked('Zero-retention qualification private evidence permissions are unsafe.')
  }
}

function classifyFailure(lastPhase: string): string {
  if (lastPhase === 'authority_validated') return 'credential_read_failed'
  if (lastPhase === 'credential_read_started') return 'credential_read_failed'
  if (lastPhase === 'credential_read_completed') return 'bounded_preflight_failed'
  if (lastPhase === 'tts_request_started') return 'tts_request_failed_outcome_unknown'
  if (lastPhase === 'tts_response_received') return 'tts_response_rejected_or_invalid'
  if (lastPhase === 'tts_response_validated') return 'history_preflight_failed'
  if (lastPhase === 'history_request_started') return 'history_request_failed'
  if (lastPhase === 'history_response_received') return 'history_response_rejected_or_request_retained'
  if (lastPhase === 'history_absence_verified') return 'private_evidence_persistence_failed'
  if (lastPhase === 'private_evidence_write_started') return 'private_evidence_persistence_failed'
  return 'terminal_private_evidence_failure'
}

function nullableBoundedString(value: unknown, maximumLength: number, label: string): string | null {
  if (value === null || value === undefined) return null
  if (typeof value !== 'string' || value.length > maximumLength) {
    blocked(`Zero-retention qualification ${label} is malformed.`)
  }
  return value
}

function nonNegativeSafeInteger(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
    blocked(`Zero-retention qualification ${label} is malformed.`)
  }
  return value
}

function object(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    blocked(`Zero-retention qualification ${label} is malformed.`)
  }
  return value as Record<string, unknown>
}

function parseJson(bytes: Buffer, label: string): unknown {
  try {
    return JSON.parse(bytes.toString('utf8')) as unknown
  } catch {
    blocked(`Zero-retention qualification ${label} is not valid JSON.`)
  }
}

function exactIso(value: string, label: string): string {
  const epoch = Date.parse(value)
  if (!Number.isFinite(epoch) || new Date(epoch).toISOString() !== value) {
    blocked(`Zero-retention qualification ${label} must be an exact ISO timestamp.`)
  }
  return value
}

function inside(root: string, relativePath: string): string {
  const candidate = resolve(root, relativePath)
  if (!candidate.startsWith(`${root}${sep}`)) {
    blocked('Zero-retention qualification path escapes its repository root.')
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
