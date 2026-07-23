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

const AUTHORIZATION_ID = 'MS-012C2-ACCOUNT-MODEL-CAPABILITY-EXT-003' as const
const PACKET_RELATIVE_PATH =
  'tasks/motion-studio/MS-012C/c2-account-model-capability-live-authorization-request-ext-003.json' as const
const AUTHORIZATION_RECORD_RELATIVE_PATH =
  'tasks/motion-studio/MS-012C/c2-account-model-capability-live-authorization-record-ext-003.json' as const
const PRIVATE_RUN_ROOT_RELATIVE_PATH =
  '.reeditpro-local-storage-ms012c2-account-model-capability-ext-003' as const
const CONSUMPTION_RECORD_FILENAME = 'authority-consumed.json' as const
const EVIDENCE_FILENAME = 'private-account-model-capability-evidence.json' as const
const FAILURE_FILENAME = 'terminal-failure.json' as const
const MODEL_ID = 'eleven_v3' as const
const PROVIDER_HOSTNAME = 'api.elevenlabs.io' as const
const PROVIDER_PATH = '/v1/models' as const
const MAXIMUM_RESPONSE_BYTES = 524_288
const REQUEST_TIMEOUT_MILLISECONDS = 15_000
const MAXIMUM_PACKET_BYTES = 128 * 1024
const MAXIMUM_AUTHORIZATION_RECORD_BYTES = 32 * 1024
const MAXIMUM_REVIEWED_FILE_BYTES = 2 * 1024 * 1024
const SHA256 = /^[a-f0-9]{64}$/

const digestSchema = z.string().regex(SHA256)
const reviewedFileSchema = z.object({
  relativePath: z.string().trim().min(1).max(512),
  byteLength: z.number().int().positive().safe(),
  sha256: digestSchema,
}).strict()

const packetSchema = z.object({
  schemaVersion: z.literal('motion-studio.speech-account-model-capability-live-authorization.v1'),
  authorizationId: z.literal(AUTHORIZATION_ID),
  milestone: z.literal('MS-012C2'),
  status: z.literal('standing_directive_authorization_ready_not_executed'),
  singleUse: z.literal(true),
  purpose: z.string().trim().min(1).max(4_096),
  reviewedRuntimeFiles: z.array(reviewedFileSchema).min(3).max(12),
  preservedTerminalHistory: z.array(reviewedFileSchema).length(6),
  acceptedVoiceDecision: z.object({
    relativePath: z.literal(
      'tasks/motion-studio/MS-012C/c2-private-acceptance-voice-selection-decision.json',
    ),
    fileSha256: digestSchema,
    decisionDigest: digestSchema,
    catalogEvidenceDigest: digestSchema,
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
    exactPath: z.literal(PROVIDER_PATH),
    exactModelId: z.literal(MODEL_ID),
    maximumHttpRequests: z.literal(1),
    maximumAddressConnectionAttempts: z.literal(1),
    ipv4Only: z.literal(true),
    addressFallbackAllowed: z.literal(false),
    maximumResponseBytes: z.literal(MAXIMUM_RESPONSE_BYTES),
    maximumCapturedResponseBytes: z.literal(MAXIMUM_RESPONSE_BYTES),
    allowedContentType: z.literal('application/json'),
    timeoutMilliseconds: z.literal(REQUEST_TIMEOUT_MILLISECONDS),
    maximumRedirects: z.literal(0),
    automaticRetryAllowed: z.literal(false),
    automaticFallbackAllowed: z.literal(false),
    providerGenerationAllowed: z.literal(false),
  }).strict(),
  costPolicy: z.object({
    maximumInternalProductionCostMicros: z.number().int().min(0).max(100_000).safe(),
    currency: z.literal('USD'),
    customerPricingAllowed: z.literal(false),
    customerCreditsAllowed: z.literal(false),
    billingAllowed: z.literal(false),
  }).strict(),
  evidencePolicy: z.object({
    privateLocalEvidenceOnly: z.literal(true),
    rawProviderResponsePersisted: z.literal(false),
    credentialPersisted: z.literal(false),
    rawResolvedAddressPersisted: z.literal(false),
    browserProjectionAllowed: z.literal(false),
    accountFundsMayBeClaimed: z.literal(false),
    zeroRetentionEntitlementMayBeClaimed: z.literal(false),
    productionSpeechMayBePromoted: z.literal(false),
  }).strict(),
  explicitlyForbidden: z.array(z.string().trim().min(1).max(1_024)).min(8).max(32),
}).strict()

const authorizationRecordSchema = z.object({
  schemaVersion: z.literal(
    'motion-studio.speech-account-model-capability-live-authorization-record.v1',
  ),
  status: z.literal('standing_directive_authorized_unconsumed'),
  authorizationId: z.literal(AUTHORIZATION_ID),
  authorityPacketDigest: digestSchema,
  ownerAuthorizationEvidenceId: z.literal('owner-standing-storytelling-self-qa-20260718'),
  ownerAuthorizationStatementSha256: digestSchema,
  standingDirectiveId: z.literal('MS-OWNER-STANDING-IMPLEMENTATION-QA-20260718'),
  standingDirectiveSha256: digestSchema,
  recordedAt: z.string().datetime({ offset: true }),
  expiresAt: z.string().datetime({ offset: true }),
  singleUse: z.literal(true),
  maximumSecretPayloadReads: z.literal(1),
  maximumHttpRequests: z.literal(1),
  maximumAddressConnectionAttempts: z.literal(1),
  maximumCapturedResponseBytes: z.literal(MAXIMUM_RESPONSE_BYTES),
  maximumInternalProductionCostMicros: z.number().int().min(0).max(100_000).safe(),
  automaticRetryAllowed: z.literal(false),
  automaticFallbackAllowed: z.literal(false),
  providerGenerationAllowed: z.literal(false),
  privateLocalEvidenceOnly: z.literal(true),
}).strict()

type Packet = z.infer<typeof packetSchema>
type EvidenceClass = 'authenticated_provider_read_only' | 'private_local_fixture'

export interface MotionStudioSpeechAccountModelCapabilityLiveOperatorResultV1 {
  schemaVersion: 'motion-studio.speech-account-model-capability-live-operator-result.v1'
  state: 'private_account_model_capability_evidence_ready'
  evidenceClass: EvidenceClass
  authorizationId: typeof AUTHORIZATION_ID
  authorityPacketDigest: string
  decisionDigest: string
  catalogEvidenceDigest: string
  evidenceDigest: string
  modelAccessVerified: true
  textToSpeechCapabilityVerified: true
  accountFundsVerified: false
  zeroRetentionEntitlementVerified: false
  credentialPayloadReadCount: 1
  providerRequestCount: 1
  addressConnectionAttemptCount: 1
  automaticRetryCount: 0
  automaticFallbackCount: 0
  providerGenerationCount: 0
  purchaseCount: 0
  accountMutationCount: 0
  privateEvidenceRelativePath: typeof EVIDENCE_FILENAME
  completedAt: string
  immutable: true
}

export interface MotionStudioSpeechAccountModelCapabilityFixtureInput {
  repositoryRoot: string
  now: string
  apiKeyFixture: string
  resolvedIpv4Addresses: readonly string[]
  responseStatus: number
  responseContentType: string
  responseBytes: Buffer
}

export const MOTION_STUDIO_SPEECH_ACCOUNT_MODEL_CAPABILITY_LIVE_OPERATOR_PATHS =
  Object.freeze({
    packetRelativePath: PACKET_RELATIVE_PATH,
    authorizationRecordRelativePath: AUTHORIZATION_RECORD_RELATIVE_PATH,
    privateRunRootRelativePath: PRIVATE_RUN_ROOT_RELATIVE_PATH,
    consumptionRecordFilename: CONSUMPTION_RECORD_FILENAME,
    evidenceFilename: EVIDENCE_FILENAME,
    failureFilename: FAILURE_FILENAME,
  })

export async function executeMotionStudioSpeechAccountModelCapabilityLiveOperator(input: {
  repositoryRoot: string
  now: string
}): Promise<MotionStudioSpeechAccountModelCapabilityLiveOperatorResultV1> {
  return executeOperator({ ...input, mode: 'live' })
}

/** Networkless proof. Fixture evidence can never satisfy authenticated account capability. */
export async function executeMotionStudioSpeechAccountModelCapabilityFixtureOperator(
  input: MotionStudioSpeechAccountModelCapabilityFixtureInput,
): Promise<MotionStudioSpeechAccountModelCapabilityLiveOperatorResultV1> {
  return executeOperator({ ...input, mode: 'fixture' })
}

async function executeOperator(input: ({
  mode: 'live'
  repositoryRoot: string
  now: string
} | ({ mode: 'fixture' } & MotionStudioSpeechAccountModelCapabilityFixtureInput))): Promise<
  MotionStudioSpeechAccountModelCapabilityLiveOperatorResultV1
> {
  const now = exactIso(input.now, 'account-model-capability operator time')
  const repositoryRoot = await realpath(input.repositoryRoot)
  const packetBytes = await readRegularBoundedFile(
    inside(repositoryRoot, PACKET_RELATIVE_PATH),
    MAXIMUM_PACKET_BYTES,
    'account-model-capability authority packet',
  )
  const packetDigest = sha256Bytes(packetBytes)
  const packet = packetSchema.parse(parseJson(packetBytes, 'account-model-capability authority packet'))
  await verifyReviewedFiles(repositoryRoot, packet.reviewedRuntimeFiles)
  await verifyReviewedFiles(repositoryRoot, packet.preservedTerminalHistory)
  await verifyAcceptedVoiceDecision(repositoryRoot, packet)

  const authorizationBytes = await readRegularBoundedFile(
    inside(repositoryRoot, AUTHORIZATION_RECORD_RELATIVE_PATH),
    MAXIMUM_AUTHORIZATION_RECORD_BYTES,
    'account-model-capability authorization record',
  )
  const authorization = authorizationRecordSchema.parse(
    parseJson(authorizationBytes, 'account-model-capability authorization record'),
  )
  if (authorization.authorityPacketDigest !== packetDigest) {
    blocked('Speech account-model-capability authorization does not bind the exact packet.')
  }
  const recordedAt = Date.parse(authorization.recordedAt)
  const expiresAt = Date.parse(authorization.expiresAt)
  const nowMs = Date.parse(now)
  if (nowMs < recordedAt || nowMs >= expiresAt || expiresAt - recordedAt > 86_400_000) {
    blocked('Speech account-model-capability authority is outside its exact execution window.')
  }
  if (
    authorization.maximumInternalProductionCostMicros !==
      packet.costPolicy.maximumInternalProductionCostMicros
  ) {
    blocked('Speech account-model-capability cost authority changed after packet review.')
  }

  const catalogEvidence =
    await loadMotionStudioSpeechVoiceCatalogPrivateAcceptanceEvidence({ repositoryRoot })
  if (catalogEvidence.evidenceDigest !== packet.acceptedVoiceDecision.catalogEvidenceDigest) {
    blocked('Speech account-model-capability lane lost its accepted catalog binding.')
  }

  const runRoot = inside(repositoryRoot, PRIVATE_RUN_ROOT_RELATIVE_PATH)
  await mkdir(runRoot, { recursive: true, mode: 0o700 })
  await assertPrivateDirectory(runRoot, repositoryRoot)
  const consumptionPath = join(runRoot, CONSUMPTION_RECORD_FILENAME)
  const evidencePath = join(runRoot, EVIDENCE_FILENAME)
  const failurePath = join(runRoot, FAILURE_FILENAME)
  const progress = {
    credentialPayloadReadCount: 0,
    providerRequestCount: 0,
    addressConnectionAttemptCount: 0,
    lastPhase: 'authority_validated' as string,
  }

  await writePrivateJsonCreateOnly(consumptionPath, {
    schemaVersion: 'motion-studio.speech-account-model-capability-authority-consumption.v1',
    state: 'single_use_authority_consumed_before_credential_read',
    authorizationId: AUTHORIZATION_ID,
    authorityPacketDigest: packetDigest,
    authorizationRecordDigest: sha256Bytes(authorizationBytes),
    ownerAuthorizationEvidenceId: authorization.ownerAuthorizationEvidenceId,
    decisionDigest: packet.acceptedVoiceDecision.decisionDigest,
    catalogEvidenceDigest: packet.acceptedVoiceDecision.catalogEvidenceDigest,
    credentialPayloadReadCountAtConsumption: 0,
    providerRequestCountAtConsumption: 0,
    consumedAt: now,
    immutable: true,
  }, 'Speech account-model-capability authority is already consumed.')

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
    progress.lastPhase = 'provider_request_started'
    progress.providerRequestCount = 1
    progress.addressConnectionAttemptCount = 1
    const response = input.mode === 'live'
      ? await requestModelCatalog({ apiKey, selectedAddress })
      : fixtureResponse(input)
    progress.lastPhase = 'provider_response_completed'
    const model = parseExactModel(response)
    const completedAt = now
    const evidenceBase = {
      schemaVersion: 'motion-studio.speech-account-model-capability-private-evidence.v1' as const,
      state: 'private_account_model_capability_evidence_ready' as const,
      evidenceClass: input.mode === 'live'
        ? 'authenticated_provider_read_only' as const
        : 'private_local_fixture' as const,
      authorizationId: AUTHORIZATION_ID,
      authorityPacketDigest: packetDigest,
      ownerAuthorizationEvidenceId: authorization.ownerAuthorizationEvidenceId,
      decisionDigest: packet.acceptedVoiceDecision.decisionDigest,
      catalogEvidenceDigest: packet.acceptedVoiceDecision.catalogEvidenceDigest,
      provider: 'elevenlabs' as const,
      exactRequest: {
        method: 'GET' as const,
        hostname: PROVIDER_HOSTNAME,
        path: PROVIDER_PATH,
        requestCount: 1 as const,
        addressConnectionAttemptCount: 1 as const,
        selectedAddressFamily: 'IPv4' as const,
        selectedAddressDigest: sha256Text(selectedAddress),
        addressFallbackCount: 0 as const,
        redirectCount: 0 as const,
        retryCount: 0 as const,
        fallbackCount: 0 as const,
      },
      response: {
        statusCode: response.statusCode,
        contentType: 'application/json' as const,
        byteLength: response.bytes.byteLength,
        contentDigest: sha256Bytes(response.bytes),
        requestIdentifierDigest: response.requestIdentifierDigest,
        rawResponsePersisted: false as const,
      },
      model,
      accountFundsVerified: false as const,
      zeroRetentionEntitlementVerified: false as const,
      productionSpeechPromotionAuthorized: false as const,
      credentialPayloadReadCount: 1 as const,
      providerGenerationCount: 0 as const,
      purchaseCount: 0 as const,
      accountMutationCount: 0 as const,
      automaticRetryCount: 0 as const,
      automaticFallbackCount: 0 as const,
      maximumInternalProductionCostMicros:
        packet.costPolicy.maximumInternalProductionCostMicros,
      providerNativeRequestCostMicros: 0 as const,
      actualInfrastructureCostMicros: null,
      actualInternalProductionCostMicros: null,
      internalProductionCostStatus: 'maximum_authorized_only_not_reconciled' as const,
      customerPricingIncluded: false as const,
      customerCreditsIncluded: false as const,
      serviceFeeIncluded: false as const,
      billingIncluded: false as const,
      completedAt,
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
      'Speech account-model-capability evidence already exists.',
    )
    progress.lastPhase = 'private_evidence_persisted'
    return Object.freeze({
      schemaVersion: 'motion-studio.speech-account-model-capability-live-operator-result.v1',
      state: 'private_account_model_capability_evidence_ready',
      evidenceClass: evidence.evidenceClass,
      authorizationId: AUTHORIZATION_ID,
      authorityPacketDigest: packetDigest,
      decisionDigest: evidence.decisionDigest,
      catalogEvidenceDigest: evidence.catalogEvidenceDigest,
      evidenceDigest: evidence.evidenceDigest,
      modelAccessVerified: true,
      textToSpeechCapabilityVerified: true,
      accountFundsVerified: false,
      zeroRetentionEntitlementVerified: false,
      credentialPayloadReadCount: 1,
      providerRequestCount: 1,
      addressConnectionAttemptCount: 1,
      automaticRetryCount: 0,
      automaticFallbackCount: 0,
      providerGenerationCount: 0,
      purchaseCount: 0,
      accountMutationCount: 0,
      privateEvidenceRelativePath: EVIDENCE_FILENAME,
      completedAt,
      immutable: true,
    })
  } catch (error) {
    const failureReasonClass = classifyFailure(error, progress.lastPhase)
    await writePrivateJsonCreateOnly(failurePath, {
      schemaVersion: 'motion-studio.speech-account-model-capability-terminal-failure.v1',
      state: 'consumed_terminal_no_retry',
      authorizationId: AUTHORIZATION_ID,
      authorityPacketDigest: packetDigest,
      ownerAuthorizationEvidenceId: authorization.ownerAuthorizationEvidenceId,
      decisionDigest: packet.acceptedVoiceDecision.decisionDigest,
      catalogEvidenceDigest: packet.acceptedVoiceDecision.catalogEvidenceDigest,
      failureCode: error instanceof ApiError ? error.code : 'MOTION_STUDIO_APPROVAL_BLOCKED',
      failureReasonClass,
      safeProgress: { ...progress },
      rawErrorPersisted: false,
      credentialPersisted: false,
      rawProviderResponsePersisted: false,
      rawResolvedAddressPersisted: false,
      retryAttempted: false,
      fallbackAttempted: false,
      providerGenerationCount: 0,
      purchaseCount: 0,
      accountMutationCount: 0,
      failedAt: now,
      immutable: true,
    }, 'Speech account-model-capability terminal failure already exists.')
    blocked('Speech account-model-capability lane stopped terminally without exposing provider material.')
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
    blocked('Speech account-model-capability credential is malformed.')
  }
  return normalized
}

async function requestModelCatalog(input: {
  apiKey: string
  selectedAddress: string
}): Promise<ModelCatalogResponse> {
  return new Promise((resolveRequest, rejectRequest) => {
    let settled = false
    const finishError = () => {
      if (settled) return
      settled = true
      rejectRequest(new ApiError(
        'MOTION_STUDIO_APPROVAL_BLOCKED',
        'Speech account-model-capability provider request failed.',
        409,
      ))
    }
    const request = httpsRequest({
      protocol: 'https:',
      hostname: PROVIDER_HOSTNAME,
      servername: PROVIDER_HOSTNAME,
      port: 443,
      path: PROVIDER_PATH,
      method: 'GET',
      agent: false,
      family: 4,
      lookup: (_hostname, _options, callback) => callback(null, input.selectedAddress, 4),
      headers: {
        Accept: 'application/json',
        'User-Agent': 'ReEditPro-MotionStudio-PrivateCapability/1.0',
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
        const statusCode = response.statusCode ?? 0
        if (
          statusCode !== 200 || contentType !== 'application/json' ||
          response.headers.location !== undefined
        ) {
          finishError()
          return
        }
        const requestIdentifier = String(
          response.headers['request-id'] ?? response.headers['x-request-id'] ?? '',
        ).trim()
        settled = true
        resolveRequest({
          statusCode,
          contentType,
          bytes: Buffer.concat(chunks, byteLength),
          requestIdentifierDigest: requestIdentifier.length > 0
            ? sha256Text(requestIdentifier)
            : null,
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

interface ModelCatalogResponse {
  statusCode: number
  contentType: string
  bytes: Buffer
  requestIdentifierDigest: string | null
}

function fixtureResponse(
  input: MotionStudioSpeechAccountModelCapabilityFixtureInput,
): ModelCatalogResponse {
  if (
    input.responseStatus !== 200 ||
    input.responseContentType.split(';', 1)[0]!.trim().toLowerCase() !== 'application/json' ||
    input.responseBytes.byteLength > MAXIMUM_RESPONSE_BYTES
  ) {
    blocked('Speech account-model-capability fixture response violates the exact response boundary.')
  }
  return {
    statusCode: input.responseStatus,
    contentType: 'application/json',
    bytes: Buffer.from(input.responseBytes),
    requestIdentifierDigest: null,
  }
}

function parseExactModel(response: ModelCatalogResponse): {
  modelId: typeof MODEL_ID
  availableToAuthenticatedAccount: true
  canDoTextToSpeech: true
  requiresAlphaAccess: boolean
  maximumTextLengthPerRequest: number
  characterCostMultiplier: number
  costDiscountMultiplier: number
  modelEvidenceDigest: string
} {
  if (response.statusCode !== 200 || response.contentType !== 'application/json') {
    blocked('Speech account-model-capability response is not an accepted model catalog.')
  }
  const value = parseJson(response.bytes, 'account model catalog')
  if (!Array.isArray(value)) blocked('Speech account-model-capability catalog is malformed.')
  const rawModel = value.find((entry) => isRecord(entry) && entry.model_id === MODEL_ID)
  if (!isRecord(rawModel)) blocked('The authenticated account model catalog does not expose eleven_v3.')
  const rates = rawModel.model_rates
  if (!isRecord(rates)) blocked('The authenticated eleven_v3 model rates are malformed.')
  const canDoTextToSpeech = exactBoolean(
    rawModel.can_do_text_to_speech,
    'eleven_v3 text-to-speech capability',
  )
  if (!canDoTextToSpeech) blocked('The authenticated eleven_v3 model is not text-to-speech capable.')
  const base = {
    modelId: MODEL_ID,
    availableToAuthenticatedAccount: true as const,
    canDoTextToSpeech: true as const,
    requiresAlphaAccess: exactBoolean(
      rawModel.requires_alpha_access,
      'eleven_v3 alpha-access requirement',
    ),
    maximumTextLengthPerRequest: nonNegativeInteger(
      rawModel.maximum_text_length_per_request,
      'eleven_v3 maximum text length',
    ),
    characterCostMultiplier: nonNegativeNumber(
      rates.character_cost_multiplier,
      'eleven_v3 character-cost multiplier',
    ),
    costDiscountMultiplier: nonNegativeNumber(
      rates.cost_discount_multiplier,
      'eleven_v3 cost-discount multiplier',
    ),
  }
  if (base.maximumTextLengthPerRequest < 1) {
    blocked('The authenticated eleven_v3 model text limit is not usable.')
  }
  return { ...base, modelEvidenceDigest: sha256CanonicalJson(base) }
}

function selectOnePublicIpv4(addresses: readonly string[]): string {
  const unique = [...new Set(addresses)].sort()
  if (unique.length === 0 || unique.some((address) => !isPublicIpv4(address))) {
    blocked('Speech account-model-capability DNS results are empty or unsafe.')
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

async function verifyAcceptedVoiceDecision(repositoryRoot: string, packet: Packet): Promise<void> {
  const decisionBytes = await readRegularBoundedFile(
    inside(repositoryRoot, packet.acceptedVoiceDecision.relativePath),
    32 * 1024,
    'accepted voice decision',
  )
  if (sha256Bytes(decisionBytes) !== packet.acceptedVoiceDecision.fileSha256) {
    blocked('Speech account-model-capability accepted voice decision changed after review.')
  }
  const decision = parseJson(decisionBytes, 'accepted voice decision')
  if (
    !isRecord(decision) || decision.decisionDigest !== packet.acceptedVoiceDecision.decisionDigest ||
    decision.catalogEvidenceDigest !== packet.acceptedVoiceDecision.catalogEvidenceDigest
  ) blocked('Speech account-model-capability accepted voice decision lost its exact binding.')
}

async function verifyReviewedFiles(repositoryRoot: string, files: readonly {
  relativePath: string
  byteLength: number
  sha256: string
}[]): Promise<void> {
  const seen = new Set<string>()
  for (const file of files) {
    if (seen.has(file.relativePath)) blocked('Speech account-model-capability packet repeats a reviewed file.')
    seen.add(file.relativePath)
    const bytes = await readRegularBoundedFile(
      inside(repositoryRoot, file.relativePath),
      MAXIMUM_REVIEWED_FILE_BYTES,
      'reviewed account-model-capability file',
    )
    if (bytes.byteLength !== file.byteLength || sha256Bytes(bytes) !== file.sha256) {
      blocked('Speech account-model-capability reviewed file identity changed.')
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
  ) blocked('Speech account-model-capability private run root is not owner-private.')
}

async function writePrivateJsonCreateOnly(path: string, value: unknown, conflict: string): Promise<void> {
  try {
    await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, {
      encoding: 'utf8',
      flag: 'wx',
      mode: 0o600,
    })
  } catch (error) {
    if (isRecord(error) && error.code === 'EEXIST') blocked(conflict)
    blocked('Speech account-model-capability private evidence could not be persisted.')
  }
  const metadata = await lstat(path)
  if (
    !metadata.isFile() || metadata.isSymbolicLink() || (metadata.mode & 0o777) !== 0o600 ||
    (typeof process.getuid === 'function' && metadata.uid !== process.getuid())
  ) blocked('Speech account-model-capability evidence is not owner-private.')
}

function inside(repositoryRoot: string, relativePath: string): string {
  if (relativePath.startsWith('/') || relativePath.includes('..') || relativePath.includes('\\')) {
    blocked('Speech account-model-capability path is unsafe.')
  }
  const target = resolve(repositoryRoot, relativePath)
  if (!target.startsWith(`${repositoryRoot}${sep}`)) blocked('Speech account-model-capability path escaped its repository.')
  return target
}

function parseJson(bytes: Buffer, label: string): unknown {
  try {
    return JSON.parse(bytes.toString('utf8'))
  } catch {
    blocked(`${label} is not valid JSON.`)
  }
}

function exactBoolean(value: unknown, label: string): boolean {
  if (typeof value !== 'boolean') blocked(`${label} is malformed.`)
  return value
}

function nonNegativeInteger(value: unknown, label: string): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) blocked(`${label} is malformed.`)
  return value as number
}

function nonNegativeNumber(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) blocked(`${label} is malformed.`)
  return value
}

function exactIso(value: string, label: string): string {
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed) || new Date(parsed).toISOString() !== value) blocked(`${label} is invalid.`)
  return value
}

function classifyFailure(error: unknown, phase: string): string {
  if (phase === 'credential_read_started') return 'credential_read_failed'
  if (phase === 'provider_request_started') return 'model_catalog_read_failed'
  if (phase === 'provider_response_completed') return 'model_catalog_response_validation_failed'
  if (phase === 'private_evidence_write_started') return 'evidence_persistence_failed'
  return error instanceof ApiError ? 'bounded_preflight_failed' : 'unclassified_safe_failure'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function sha256Bytes(value: Buffer | Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}

function sha256Text(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}

function blocked(message: string): never {
  throw new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', message, 409)
}
