import { createHash } from 'node:crypto'
import { lstat, mkdir, readFile, realpath, writeFile } from 'node:fs/promises'
import { join, sep } from 'node:path'

import { ApiError } from '../../errors/api-error'
import {
  MOTION_STUDIO_SPEECH_ELEVENLABS_SECRET_LOCATOR_ID,
  MOTION_STUDIO_SPEECH_ELEVENLABS_SECRET_VERSION,
  MOTION_STUDIO_SPEECH_GCLOUD_BINARY_BYTE_LENGTH,
  MOTION_STUDIO_SPEECH_GCLOUD_BINARY_PATH,
  MOTION_STUDIO_SPEECH_GCLOUD_BINARY_SHA256,
  MOTION_STUDIO_SPEECH_GCLOUD_SDK_VERSION,
  MOTION_STUDIO_SPEECH_GOOGLE_CLOUD_PROJECT_ID,
  createMotionStudioSpeechFixtureGoogleSecretManagerValueLoader,
  createMotionStudioSpeechGoogleSecretManagerValueLoader,
  createMotionStudioSpeechSecretBinding,
  type MotionStudioSpeechGoogleSecretManagerFixtureLoaderOptions,
} from './live-credential'
import {
  MOTION_STUDIO_SPEECH_VOICE_CATALOG_EXTERNAL_AUTHORIZATION_ID,
  createMotionStudioSpeechVoiceCatalogDiscoveryAuthorizedFixtureTransport,
  createMotionStudioSpeechVoiceCatalogDiscoveryLiveTransport,
  createMotionStudioSpeechVoiceCatalogDiscoveryPlan,
  createMotionStudioSpeechVoiceCatalogExternalAuthority,
} from './voice-catalog-discovery'

const SHA256 = /^[a-f0-9]{64}$/
const STABLE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/
const PACKET_RELATIVE_PATH =
  'tasks/motion-studio/MS-012C/c2-voice-catalog-live-authorization-request.json' as const
const AUTHORIZATION_RECORD_RELATIVE_PATH =
  'tasks/motion-studio/MS-012C/c2-voice-catalog-live-authorization-record.json' as const
const PRIVATE_RUN_ROOT_RELATIVE_PATH =
  '.reeditpro-local-storage-ms012c2-voice-catalog-ext-001' as const
const CONSUMPTION_RECORD_FILENAME = 'authority-consumed.json' as const
const EVIDENCE_FILENAME = 'private-catalog-evidence.json' as const
const FAILURE_FILENAME = 'terminal-failure.json' as const
const MAX_PACKET_BYTES = 128 * 1024
const MAX_AUTHORIZATION_RECORD_BYTES = 32 * 1024
const REQUEST_TIMEOUT_MILLISECONDS = 15_000
const MAXIMUM_CAPTURED_RESPONSE_BYTES = 524_288
const MAXIMUM_INTERNAL_PRODUCTION_COST_MICROS = 100_000
const AUTHORITY_WINDOW_MILLISECONDS = 10 * 60_000
const REVIEWED_RUNTIME_RELATIVE_PATHS = Object.freeze([
  'package.json',
  'server/motion-studio/speech-production/live-credential.ts',
  'server/motion-studio/speech-production/voice-catalog-discovery.ts',
  'server/motion-studio/speech-production/voice-catalog-live-cli.ts',
  'server/motion-studio/speech-production/voice-catalog-live-operator.ts',
] as const)

export const MOTION_STUDIO_SPEECH_VOICE_CATALOG_LIVE_OPERATOR_PATHS = Object.freeze({
  packetRelativePath: PACKET_RELATIVE_PATH,
  authorizationRecordRelativePath: AUTHORIZATION_RECORD_RELATIVE_PATH,
  privateRunRootRelativePath: PRIVATE_RUN_ROOT_RELATIVE_PATH,
  consumptionRecordFilename: CONSUMPTION_RECORD_FILENAME,
  evidenceFilename: EVIDENCE_FILENAME,
  failureFilename: FAILURE_FILENAME,
})

export interface MotionStudioSpeechVoiceCatalogLiveOperatorResultV1 {
  schemaVersion: 'motion-studio.speech-voice-catalog-live-operator-result.v1'
  state: 'private_catalog_evidence_ready'
  evidenceClass: 'authenticated_provider_read_only' | 'private_local_fixture'
  authorizationId: typeof MOTION_STUDIO_SPEECH_VOICE_CATALOG_EXTERNAL_AUTHORIZATION_ID
  authorityPacketDigest: string
  ownerAuthorizationEvidenceId: string
  planDigest: string
  externalAuthorityDigest: string
  catalogEvidenceDigest: string
  candidateCount: number
  credentialPayloadReadCount: 1
  providerRequestCount: 1
  previewDownloadCount: 0
  automaticVoiceSelectionCount: 0
  voiceBindingCreationCount: 0
  accountPreflightCount: 0
  providerGenerationCount: 0
  privateEvidenceRelativePath: typeof EVIDENCE_FILENAME
  completedAt: string
  immutable: true
}

interface OperatorFixtureInput {
  repositoryRoot: string
  now: string
  fixtureLoaderOptions: MotionStudioSpeechGoogleSecretManagerFixtureLoaderOptions
  fixtureFetchImplementation: typeof fetch
}

export async function executeMotionStudioSpeechVoiceCatalogLiveOperator(input: {
  repositoryRoot: string
  now: string
}): Promise<MotionStudioSpeechVoiceCatalogLiveOperatorResultV1> {
  return executeOperator({ mode: 'live', ...input })
}

/**
 * Local protocol proof for the complete operator boundary. The fixture path is
 * permanently fixture-branded and cannot produce authenticated-provider
 * evidence or satisfy later live account preflight.
 */
export async function executeMotionStudioSpeechVoiceCatalogAuthorizedFixtureOperator(
  input: OperatorFixtureInput,
): Promise<MotionStudioSpeechVoiceCatalogLiveOperatorResultV1> {
  return executeOperator({ mode: 'fixture', ...input })
}

async function executeOperator(input: ({
  mode: 'live'
  repositoryRoot: string
  now: string
} | ({ mode: 'fixture' } & OperatorFixtureInput))): Promise<MotionStudioSpeechVoiceCatalogLiveOperatorResultV1> {
  const now = exactIso(input.now, 'voice-catalog operator time')
  const repositoryRoot = await realpath(input.repositoryRoot)
  const packetPath = inside(repositoryRoot, PACKET_RELATIVE_PATH)
  const authorizationRecordPath = inside(repositoryRoot, AUTHORIZATION_RECORD_RELATIVE_PATH)
  const packetBytes = await readRegularBoundedFile(packetPath, MAX_PACKET_BYTES, 'authority packet')
  const packetDigest = sha256Bytes(packetBytes)
  const packet = validatePacket(parseJson(packetBytes, 'authority packet'), packetDigest)
  await verifyReviewedRuntimeFiles(repositoryRoot, packet.reviewedRuntimeFiles)
  const authorizationRecordBytes = await readRegularBoundedFile(
    authorizationRecordPath,
    MAX_AUTHORIZATION_RECORD_BYTES,
    'owner-authorization record',
  )
  const authorizationRecord = validateAuthorizationRecord(
    parseJson(authorizationRecordBytes, 'owner-authorization record'),
    packetDigest,
    now,
  )
  const authorizationRecordDigest = sha256Bytes(authorizationRecordBytes)

  const runRootPath = inside(repositoryRoot, PRIVATE_RUN_ROOT_RELATIVE_PATH)
  await mkdir(runRootPath, { recursive: true, mode: 0o700 })
  const resolvedRunRoot = await realpath(runRootPath)
  if (!resolvedRunRoot.startsWith(`${repositoryRoot}${sep}`)) {
    blocked('Speech voice-catalog private run root escaped the repository boundary.')
  }

  const binding = createMotionStudioSpeechSecretBinding({
    credentialReferenceId: 'gsm-elevenlabs-api-key-v1',
    secretLocatorId: MOTION_STUDIO_SPEECH_ELEVENLABS_SECRET_LOCATOR_ID,
    secretVersionReference: MOTION_STUDIO_SPEECH_ELEVENLABS_SECRET_VERSION,
  })
  if (binding.bindingDigest !== packet.credentialBindingDigest) {
    blocked('Speech voice-catalog packet no longer matches the pinned Secret Manager binding.')
  }
  const expiresAt = new Date(Date.parse(now) + AUTHORITY_WINDOW_MILLISECONDS).toISOString()
  const plan = createMotionStudioSpeechVoiceCatalogDiscoveryPlan({
    planId: `voice-catalog-ext-001-${packetDigest.slice(0, 16)}`,
    credentialBinding: binding,
    issuedAt: now,
    expiresAt,
  })
  const externalAuthority = createMotionStudioSpeechVoiceCatalogExternalAuthority({
    plan,
    authorityPacketDigest: packetDigest,
    ownerAuthorizationEvidenceId: authorizationRecord.ownerAuthorizationEvidenceId,
    issuedAt: now,
    expiresAt,
  })

  const transport = input.mode === 'live'
    ? createMotionStudioSpeechVoiceCatalogDiscoveryLiveTransport({
        externalNetworkEnabled: true,
        credentialPayloadAccessEnabled: true,
        loader: createMotionStudioSpeechGoogleSecretManagerValueLoader({
          projectId: MOTION_STUDIO_SPEECH_GOOGLE_CLOUD_PROJECT_ID,
          timeoutMs: REQUEST_TIMEOUT_MILLISECONDS,
        }),
        plan,
        externalAuthority,
        requestTimeoutMs: REQUEST_TIMEOUT_MILLISECONDS,
      })
    : createMotionStudioSpeechVoiceCatalogDiscoveryAuthorizedFixtureTransport({
        transportEnabled: true,
        credentialPayloadAccessEnabled: true,
        fixtureLoader: createMotionStudioSpeechFixtureGoogleSecretManagerValueLoader(
          input.fixtureLoaderOptions,
        ),
        fixtureFetchImplementation: input.fixtureFetchImplementation,
        plan,
        externalAuthority,
        requestTimeoutMs: REQUEST_TIMEOUT_MILLISECONDS,
      })

  const consumptionPath = join(resolvedRunRoot, CONSUMPTION_RECORD_FILENAME)
  await writePrivateJsonExclusive(consumptionPath, {
    schemaVersion: 'motion-studio.speech-voice-catalog-authority-consumption.v1',
    state: 'single_use_authority_consumed_before_credential_read',
    authorizationId: packet.authorizationId,
    authorityPacketDigest: packetDigest,
    authorizationRecordDigest,
    ownerAuthorizationEvidenceId: authorizationRecord.ownerAuthorizationEvidenceId,
    planDigest: plan.planDigest,
    externalAuthorityDigest: externalAuthority.authorityDigest,
    credentialBindingDigest: binding.bindingDigest,
    credentialPayloadReadCountAtConsumption: 0,
    providerRequestCountAtConsumption: 0,
    consumedAt: now,
    immutable: true,
  }, 'Speech voice-catalog external authority is already consumed.')

  try {
    const evidence = await transport.execute({ plan, now })
    if (
      evidence.externalAuthorityApplied !== true ||
      evidence.externalAuthorityDigest !== externalAuthority.authorityDigest ||
      evidence.authorityPacketDigest !== packetDigest ||
      evidence.ownerAuthorizationEvidenceId !== authorizationRecord.ownerAuthorizationEvidenceId ||
      evidence.credentialBindingDigest !== binding.bindingDigest ||
      evidence.providerRequestCount !== 1 || evidence.credentialValueRead !== true ||
      evidence.previewDownloaded !== false || evidence.automaticVoiceSelectionPerformed !== false ||
      evidence.voiceBindingCreated !== false || evidence.providerGenerationCallMade !== false
    ) blocked('Speech voice-catalog evidence does not match the consumed external authority.')
    await writePrivateJsonExclusive(join(resolvedRunRoot, EVIDENCE_FILENAME), evidence,
      'Speech voice-catalog private evidence already exists.')
    return Object.freeze({
      schemaVersion: 'motion-studio.speech-voice-catalog-live-operator-result.v1' as const,
      state: 'private_catalog_evidence_ready' as const,
      evidenceClass: input.mode === 'live'
        ? 'authenticated_provider_read_only' as const
        : 'private_local_fixture' as const,
      authorizationId: packet.authorizationId,
      authorityPacketDigest: packetDigest,
      ownerAuthorizationEvidenceId: authorizationRecord.ownerAuthorizationEvidenceId,
      planDigest: plan.planDigest,
      externalAuthorityDigest: externalAuthority.authorityDigest,
      catalogEvidenceDigest: evidence.evidenceDigest,
      candidateCount: evidence.candidateCount,
      credentialPayloadReadCount: 1 as const,
      providerRequestCount: 1 as const,
      previewDownloadCount: 0 as const,
      automaticVoiceSelectionCount: 0 as const,
      voiceBindingCreationCount: 0 as const,
      accountPreflightCount: 0 as const,
      providerGenerationCount: 0 as const,
      privateEvidenceRelativePath: EVIDENCE_FILENAME,
      completedAt: now,
      immutable: true as const,
    })
  } catch (error) {
    await writePrivateJsonBestEffort(join(resolvedRunRoot, FAILURE_FILENAME), {
      schemaVersion: 'motion-studio.speech-voice-catalog-terminal-failure.v1',
      state: 'consumed_terminal_no_retry',
      authorizationId: packet.authorizationId,
      authorityPacketDigest: packetDigest,
      ownerAuthorizationEvidenceId: authorizationRecord.ownerAuthorizationEvidenceId,
      planDigest: plan.planDigest,
      externalAuthorityDigest: externalAuthority.authorityDigest,
      failureCode: error instanceof ApiError ? error.code : 'INTERNAL_ERROR',
      credentialAndRequestOutcome: 'not_retried_after_authority_consumption',
      failedAt: now,
      immutable: true,
    })
    throw error
  }
}

function validatePacket(value: unknown, packetDigest: string): {
  authorizationId: typeof MOTION_STUDIO_SPEECH_VOICE_CATALOG_EXTERNAL_AUTHORIZATION_ID
  credentialBindingDigest: string
  reviewedRuntimeFiles: readonly {
    relativePath: string
    byteLength: number
    sha256: string
  }[]
} {
  const packet = object(value, 'authority packet')
  const credential = object(packet.credentialAuthority, 'credential authority')
  const runtime = object(packet.credentialRuntimeIdentity, 'credential runtime')
  const request = object(packet.request, 'provider request')
  const evidence = object(packet.evidencePolicy, 'evidence policy')
  const operator = object(packet.operatorPolicy, 'operator policy')
  const cost = object(packet.costPolicy, 'cost policy')
  const externalAuthority = object(packet.runtimeExternalAuthority, 'runtime external authority')
  const reviewedRuntimeFiles = parseReviewedRuntimeFiles(packet.reviewedRuntimeFiles)
  if (
    packet.schemaVersion !== 'motion-studio.speech-voice-catalog-live-authorization.v1' ||
    packet.authorizationId !== MOTION_STUDIO_SPEECH_VOICE_CATALOG_EXTERNAL_AUTHORIZATION_ID ||
    packet.status !== 'owner_authorization_required_not_executed' || packet.singleUse !== true ||
    credential.provider !== 'google_secret_manager' ||
    credential.projectId !== MOTION_STUDIO_SPEECH_GOOGLE_CLOUD_PROJECT_ID ||
    credential.secretId !== MOTION_STUDIO_SPEECH_ELEVENLABS_SECRET_LOCATOR_ID ||
    credential.numericVersion !== MOTION_STUDIO_SPEECH_ELEVENLABS_SECRET_VERSION ||
    !SHA256.test(String(credential.bindingDigest)) || credential.maximumPayloadReads !== 1 ||
    credential.environmentFallbackAllowed !== false ||
    credential.browserChatOrProjectCredentialAllowed !== false ||
    credential.credentialValueMayBePrintedOrPersisted !== false ||
    credential.alternateSecretOrVersionAllowed !== false ||
    runtime.cloudSdkVersion !== MOTION_STUDIO_SPEECH_GCLOUD_SDK_VERSION ||
    runtime.resolvedExecutablePath !== MOTION_STUDIO_SPEECH_GCLOUD_BINARY_PATH ||
    runtime.executableByteLength !== MOTION_STUDIO_SPEECH_GCLOUD_BINARY_BYTE_LENGTH ||
    runtime.executableSha256 !== MOTION_STUDIO_SPEECH_GCLOUD_BINARY_SHA256 ||
    runtime.callerSelectedExecutableAllowed !== false ||
    runtime.subprocessEnvironmentPolicy !== 'accepted_minimal_frozen_allowlist' ||
    runtime.proxyOrPacAllowed !== false || runtime.runtimeMismatchStopsBeforePayloadRead !== true ||
    request.method !== 'GET' || request.scheme !== 'https' ||
    request.hostname !== 'api.elevenlabs.io' || request.port !== 443 ||
    request.pathAndQuery !== '/v2/voices?category=premade&voice_type=default&page_size=25&sort=name&sort_direction=asc&include_total_count=false' ||
    request.maximumHttpRequests !== 1 || request.maximumResponseBytes !== MAXIMUM_CAPTURED_RESPONSE_BYTES ||
    request.allowedContentType !== 'application/json' ||
    request.timeoutMilliseconds !== REQUEST_TIMEOUT_MILLISECONDS || request.maximumRedirects !== 0 ||
    request.automaticRetryAllowed !== false || request.automaticFallbackAllowed !== false ||
    evidence.privateLocalEvidenceOnly !== true || evidence.rawProviderResponsePersisted !== false ||
    evidence.credentialPersisted !== false || evidence.browserProjectionAllowed !== false ||
    operator.command !== 'npm run internal:motion-studio-speech-voice-catalog-live' ||
    operator.ownerAuthorizationRecordRelativePath !== AUTHORIZATION_RECORD_RELATIVE_PATH ||
    operator.privateRunRootRelativePath !== PRIVATE_RUN_ROOT_RELATIVE_PATH ||
    operator.consumptionRecordFilename !== CONSUMPTION_RECORD_FILENAME ||
    operator.privateEvidenceFilename !== EVIDENCE_FILENAME ||
    operator.terminalFailureFilename !== FAILURE_FILENAME ||
    operator.exclusiveFileCreateMode !== 'wx_0600' || operator.consumeBeforeCredentialRead !== true ||
    operator.runtimeFileIdentityMismatchStopsBeforeAuthorizationRecordUse !== true ||
    operator.missingAuthorizationRecordStopsBeforeCredentialRead !== true ||
    cost.providerFeeExpectedMicros !== 0 ||
    cost.maximumInternalProductionCostMicros !== MAXIMUM_INTERNAL_PRODUCTION_COST_MICROS ||
    cost.currency !== 'USD' || cost.customerPricingAllowed !== false ||
    cost.customerCreditsAllowed !== false || cost.billingAllowed !== false ||
    externalAuthority.schemaVersion !== 'motion-studio.speech-voice-catalog-external-authority.v1' ||
    externalAuthority.exactPlanInstanceRequired !== true ||
    externalAuthority.exactCredentialBindingDigestRequired !== true ||
    externalAuthority.authorityPacketDigestBound !== true ||
    externalAuthority.ownerAuthorizationEvidenceIdBound !== true ||
    externalAuthority.inProcessProvenanceBrandRequired !== true ||
    externalAuthority.singleIssuePerPacketAndOwnerEvidence !== true ||
    externalAuthority.singleUseBeforeCredentialRead !== true ||
    externalAuthority.authorityDigestRecordedInCatalogEvidence !== true ||
    externalAuthority.copiedOrMismatchedAuthorityRejected !== true ||
    !SHA256.test(packetDigest)
  ) blocked('Speech voice-catalog live authority packet failed its exact runtime contract.')
  return {
    authorizationId: MOTION_STUDIO_SPEECH_VOICE_CATALOG_EXTERNAL_AUTHORIZATION_ID,
    credentialBindingDigest: String(credential.bindingDigest),
    reviewedRuntimeFiles,
  }
}

function parseReviewedRuntimeFiles(value: unknown): readonly {
  relativePath: string
  byteLength: number
  sha256: string
}[] {
  if (!Array.isArray(value) || value.length !== REVIEWED_RUNTIME_RELATIVE_PATHS.length) {
    blocked('Speech voice-catalog authority packet has an invalid reviewed-runtime file set.')
  }
  const parsed = value.map((entry, index) => {
    const file = object(entry, `reviewed runtime file ${index + 1}`)
    const relativePath = String(file.relativePath)
    const byteLength = Number(file.byteLength)
    const sha256 = String(file.sha256)
    if (
      relativePath !== REVIEWED_RUNTIME_RELATIVE_PATHS[index] ||
      !Number.isSafeInteger(byteLength) || byteLength < 2 || byteLength > 2 * 1024 * 1024 ||
      !SHA256.test(sha256)
    ) blocked('Speech voice-catalog authority packet reviewed-runtime identity is malformed.')
    return Object.freeze({ relativePath, byteLength, sha256 })
  })
  return Object.freeze(parsed)
}

async function verifyReviewedRuntimeFiles(
  repositoryRoot: string,
  files: readonly { relativePath: string; byteLength: number; sha256: string }[],
): Promise<void> {
  for (const file of files) {
    const bytes = await readRegularBoundedFile(
      inside(repositoryRoot, file.relativePath),
      2 * 1024 * 1024,
      `reviewed runtime file ${file.relativePath}`,
    )
    if (bytes.byteLength !== file.byteLength || sha256Bytes(bytes) !== file.sha256) {
      blocked('Speech voice-catalog reviewed runtime changed after packet review.')
    }
  }
}

function validateAuthorizationRecord(value: unknown, packetDigest: string, now: string): {
  ownerAuthorizationEvidenceId: string
} {
  const record = object(value, 'owner-authorization record')
  if (
    record.schemaVersion !== 'motion-studio.speech-voice-catalog-live-authorization-record.v1' ||
    record.status !== 'owner_authorized_unconsumed' ||
    record.authorizationId !== MOTION_STUDIO_SPEECH_VOICE_CATALOG_EXTERNAL_AUTHORIZATION_ID ||
    record.authorityPacketDigest !== packetDigest || record.singleUse !== true ||
    record.maximumSecretPayloadReads !== 1 || record.maximumHttpRequests !== 1 ||
    record.maximumCapturedResponseBytes !== MAXIMUM_CAPTURED_RESPONSE_BYTES ||
    record.maximumInternalProductionCostMicros !== MAXIMUM_INTERNAL_PRODUCTION_COST_MICROS ||
    record.automaticRetryAllowed !== false || record.automaticFallbackAllowed !== false ||
    record.previewDownloadAllowed !== false || record.voiceSelectionAllowed !== false ||
    record.voiceBindingCreationAllowed !== false || record.accountPreflightAllowed !== false ||
    record.providerGenerationAllowed !== false || record.privateLocalEvidenceOnly !== true ||
    !STABLE_ID.test(String(record.ownerAuthorizationEvidenceId)) ||
    !SHA256.test(String(record.ownerAuthorizationStatementSha256))
  ) blocked('Speech voice-catalog owner-authorization record is missing or does not match the packet.')
  const recordedAt = exactIso(String(record.recordedAt), 'owner-authorization record time')
  if (Date.parse(recordedAt) > Date.parse(now)) {
    blocked('Speech voice-catalog owner-authorization record is from the future.')
  }
  return { ownerAuthorizationEvidenceId: String(record.ownerAuthorizationEvidenceId) }
}

async function readRegularBoundedFile(path: string, maximumBytes: number, label: string): Promise<Buffer> {
  let metadata
  try {
    metadata = await lstat(path)
  } catch {
    blocked(`Speech voice-catalog ${label} is unavailable.`)
  }
  if (!metadata.isFile() || metadata.isSymbolicLink() || metadata.size < 2 || metadata.size > maximumBytes) {
    blocked(`Speech voice-catalog ${label} is not one bounded regular file.`)
  }
  return readFile(path)
}

async function writePrivateJsonExclusive(path: string, value: unknown, existingMessage: string): Promise<void> {
  try {
    await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx', mode: 0o600 })
  } catch {
    blocked(existingMessage)
  }
}

async function writePrivateJsonBestEffort(path: string, value: unknown): Promise<void> {
  try {
    await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx', mode: 0o600 })
  } catch {
    // The exclusive consumption record remains the canonical fail-closed fact.
  }
}

function inside(root: string, relativePath: string): string {
  const path = join(root, relativePath)
  if (!path.startsWith(`${root}${sep}`)) blocked('Speech voice-catalog path escaped the repository boundary.')
  return path
}

function parseJson(bytes: Buffer, label: string): unknown {
  try {
    return JSON.parse(bytes.toString('utf8'))
  } catch {
    blocked(`Speech voice-catalog ${label} is malformed JSON.`)
  }
}

function object(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    blocked(`Speech voice-catalog ${label} is malformed.`)
  }
  return value as Record<string, unknown>
}

function exactIso(value: string, label: string): string {
  if (typeof value !== 'string' || !value.endsWith('Z') || Number.isNaN(Date.parse(value))) {
    invalid(`Speech ${label} is malformed.`)
  }
  const exact = new Date(value).toISOString()
  if (exact !== value) invalid(`Speech ${label} must be an exact ISO timestamp.`)
  return exact
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
