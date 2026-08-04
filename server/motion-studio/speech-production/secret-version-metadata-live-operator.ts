import { Buffer } from 'node:buffer'
import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { lstat, mkdir, readFile, realpath, writeFile } from 'node:fs/promises'
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
  createMotionStudioSpeechGoogleSecretManagerProcessEnvironment,
} from './live-credential'

const AUTHORIZATION_ID = 'MS-012C2-SECRET-VERSION-METADATA-DIAGNOSTIC-EXT-004' as const
const PACKET_RELATIVE_PATH =
  'tasks/motion-studio/MS-012C/c2-secret-version-metadata-live-authorization-request-ext-004.json' as const
const AUTHORIZATION_RECORD_RELATIVE_PATH =
  'tasks/motion-studio/MS-012C/c2-secret-version-metadata-live-authorization-record-ext-004.json' as const
const PRIVATE_RUN_ROOT_RELATIVE_PATH =
  '.reeditpro-local-storage-ms012c2-secret-version-metadata-ext-004' as const
const CONSUMPTION_RECORD_FILENAME = 'authority-consumed.json' as const
const EVIDENCE_FILENAME = 'private-secret-version-metadata-evidence.json' as const
const FAILURE_FILENAME = 'terminal-failure.json' as const
const COMMAND_TIMEOUT_MILLISECONDS = 20_000
const MAXIMUM_STDOUT_BYTES = 32 * 1024
const MAXIMUM_PACKET_BYTES = 160 * 1024
const MAXIMUM_AUTHORIZATION_RECORD_BYTES = 32 * 1024
const MAXIMUM_REVIEWED_FILE_BYTES = 2 * 1024 * 1024
const SHA256 = /^[a-f0-9]{64}$/
const COMMAND_ARGS = Object.freeze([
  'secrets',
  'versions',
  'describe',
  MOTION_STUDIO_SPEECH_ELEVENLABS_SECRET_VERSION,
  `--secret=${MOTION_STUDIO_SPEECH_ELEVENLABS_SECRET_LOCATOR_ID}`,
  `--project=${MOTION_STUDIO_SPEECH_GOOGLE_CLOUD_PROJECT_ID}`,
  '--format=json(state)',
  '--quiet',
] as const)

const digestSchema = z.string().regex(SHA256)
const reviewedFileSchema = z.object({
  relativePath: z.string().trim().min(1).max(512),
  byteLength: z.number().int().positive().safe(),
  sha256: digestSchema,
}).strict()

const packetSchema = z.object({
  schemaVersion: z.literal('motion-studio.speech-secret-version-metadata-live-authorization.v1'),
  authorizationId: z.literal(AUTHORIZATION_ID),
  milestone: z.literal('MS-012C2'),
  status: z.literal('standing_directive_authorization_ready_not_executed'),
  singleUse: z.literal(true),
  purpose: z.string().trim().min(1).max(4_096),
  reviewedRuntimeFiles: z.array(reviewedFileSchema).min(3).max(12),
  preservedTerminalHistory: z.array(reviewedFileSchema).length(9),
  credentialRuntimeIdentity: z.object({
    cloudSdkVersion: z.literal(MOTION_STUDIO_SPEECH_GCLOUD_SDK_VERSION),
    resolvedExecutablePath: z.literal(MOTION_STUDIO_SPEECH_GCLOUD_BINARY_PATH),
    executableByteLength: z.literal(MOTION_STUDIO_SPEECH_GCLOUD_BINARY_BYTE_LENGTH),
    executableSha256: z.literal(MOTION_STUDIO_SPEECH_GCLOUD_BINARY_SHA256),
    callerSelectedExecutableAllowed: z.literal(false),
    proxyOrPacAllowed: z.literal(false),
  }).strict(),
  command: z.object({
    operation: z.literal('google_secret_manager_secret_version_metadata_describe'),
    projectId: z.literal(MOTION_STUDIO_SPEECH_GOOGLE_CLOUD_PROJECT_ID),
    secretId: z.literal(MOTION_STUDIO_SPEECH_ELEVENLABS_SECRET_LOCATOR_ID),
    numericVersion: z.literal(MOTION_STUDIO_SPEECH_ELEVENLABS_SECRET_VERSION),
    exactArguments: z.tuple([
      z.literal('secrets'),
      z.literal('versions'),
      z.literal('describe'),
      z.literal(MOTION_STUDIO_SPEECH_ELEVENLABS_SECRET_VERSION),
      z.literal(`--secret=${MOTION_STUDIO_SPEECH_ELEVENLABS_SECRET_LOCATOR_ID}`),
      z.literal(`--project=${MOTION_STUDIO_SPEECH_GOOGLE_CLOUD_PROJECT_ID}`),
      z.literal('--format=json(state)'),
      z.literal('--quiet'),
    ]),
    maximumCommandInvocations: z.literal(1),
    secretPayloadReadsAllowed: z.literal(0),
    maximumCapturedStdoutBytes: z.literal(MAXIMUM_STDOUT_BYTES),
    timeoutMilliseconds: z.literal(COMMAND_TIMEOUT_MILLISECONDS),
    automaticRetryAllowed: z.literal(false),
    automaticFallbackAllowed: z.literal(false),
  }).strict(),
  costPolicy: z.object({
    maximumInternalProductionCostMicros: z.number().int().min(0).max(100_000).safe(),
    currency: z.literal('USD'),
    actualCostMayBeClaimed: z.literal(false),
    customerPricingAllowed: z.literal(false),
    customerCreditsAllowed: z.literal(false),
    billingAllowed: z.literal(false),
  }).strict(),
  evidencePolicy: z.object({
    privateLocalEvidenceOnly: z.literal(true),
    rawCommandOutputPersisted: z.literal(false),
    rawCommandErrorPersisted: z.literal(false),
    credentialPayloadPersisted: z.literal(false),
    accountIdentifierPersisted: z.literal(false),
    browserProjectionAllowed: z.literal(false),
    secretPayloadAccessMayBeClaimed: z.literal(false),
    providerCapabilityMayBeClaimed: z.literal(false),
  }).strict(),
  explicitlyForbidden: z.array(z.string().trim().min(1).max(1_024)).min(8).max(32),
}).strict()

const authorizationRecordSchema = z.object({
  schemaVersion: z.literal(
    'motion-studio.speech-secret-version-metadata-live-authorization-record.v1',
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
  maximumCommandInvocations: z.literal(1),
  maximumSecretPayloadReads: z.literal(0),
  maximumCapturedStdoutBytes: z.literal(MAXIMUM_STDOUT_BYTES),
  maximumInternalProductionCostMicros: z.number().int().min(0).max(100_000).safe(),
  automaticRetryAllowed: z.literal(false),
  automaticFallbackAllowed: z.literal(false),
  privateLocalEvidenceOnly: z.literal(true),
}).strict()

type SecretVersionState = 'ENABLED' | 'DISABLED' | 'DESTROYED' | 'STATE_UNSPECIFIED'
type EvidenceClass = 'authenticated_google_cloud_read_only' | 'private_local_fixture'

export interface MotionStudioSpeechSecretVersionMetadataLiveOperatorResultV1 {
  schemaVersion: 'motion-studio.speech-secret-version-metadata-live-operator-result.v1'
  state: 'private_secret_version_metadata_evidence_ready'
  evidenceClass: EvidenceClass
  authorizationId: typeof AUTHORIZATION_ID
  authorityPacketDigest: string
  secretVersionState: SecretVersionState
  metadataReadableByConfiguredAccount: true
  secretPayloadReadVerified: false
  providerCapabilityVerified: false
  googleCloudCommandCount: 1
  secretPayloadReadCount: 0
  providerRequestCount: 0
  automaticRetryCount: 0
  automaticFallbackCount: 0
  evidenceDigest: string
  privateEvidenceRelativePath: typeof EVIDENCE_FILENAME
  completedAt: string
  immutable: true
}

export interface MotionStudioSpeechSecretVersionMetadataFixtureInput {
  repositoryRoot: string
  now: string
  commandRunner: (command: string, args: readonly string[]) => Promise<Buffer | string>
}

export const MOTION_STUDIO_SPEECH_SECRET_VERSION_METADATA_LIVE_OPERATOR_PATHS = Object.freeze({
  packetRelativePath: PACKET_RELATIVE_PATH,
  authorizationRecordRelativePath: AUTHORIZATION_RECORD_RELATIVE_PATH,
  privateRunRootRelativePath: PRIVATE_RUN_ROOT_RELATIVE_PATH,
  consumptionRecordFilename: CONSUMPTION_RECORD_FILENAME,
  evidenceFilename: EVIDENCE_FILENAME,
  failureFilename: FAILURE_FILENAME,
})

export async function executeMotionStudioSpeechSecretVersionMetadataLiveOperator(input: {
  repositoryRoot: string
  now: string
}): Promise<MotionStudioSpeechSecretVersionMetadataLiveOperatorResultV1> {
  return executeOperator({ ...input, mode: 'live' })
}

/** Networkless proof; fixture evidence can never satisfy Google Cloud metadata readiness. */
export async function executeMotionStudioSpeechSecretVersionMetadataFixtureOperator(
  input: MotionStudioSpeechSecretVersionMetadataFixtureInput,
): Promise<MotionStudioSpeechSecretVersionMetadataLiveOperatorResultV1> {
  return executeOperator({ ...input, mode: 'fixture' })
}

async function executeOperator(input: ({
  mode: 'live'
  repositoryRoot: string
  now: string
} | ({ mode: 'fixture' } & MotionStudioSpeechSecretVersionMetadataFixtureInput))): Promise<
  MotionStudioSpeechSecretVersionMetadataLiveOperatorResultV1
> {
  const now = exactIso(input.now, 'secret-version metadata operator time')
  const repositoryRoot = await realpath(input.repositoryRoot)
  const packetBytes = await readRegularBoundedFile(
    inside(repositoryRoot, PACKET_RELATIVE_PATH),
    MAXIMUM_PACKET_BYTES,
    'secret-version metadata authority packet',
  )
  const packetDigest = sha256Bytes(packetBytes)
  const packet = packetSchema.parse(parseJson(packetBytes, 'secret-version metadata authority packet'))
  await verifyReviewedFiles(repositoryRoot, packet.reviewedRuntimeFiles)
  await verifyReviewedFiles(repositoryRoot, packet.preservedTerminalHistory)
  if (JSON.stringify(packet.command.exactArguments) !== JSON.stringify(COMMAND_ARGS)) {
    blocked('Speech secret-version metadata command arguments changed after review.')
  }

  const authorizationBytes = await readRegularBoundedFile(
    inside(repositoryRoot, AUTHORIZATION_RECORD_RELATIVE_PATH),
    MAXIMUM_AUTHORIZATION_RECORD_BYTES,
    'secret-version metadata authorization record',
  )
  const authorization = authorizationRecordSchema.parse(
    parseJson(authorizationBytes, 'secret-version metadata authorization record'),
  )
  if (authorization.authorityPacketDigest !== packetDigest) {
    blocked('Speech secret-version metadata authorization does not bind the exact packet.')
  }
  const recordedAt = Date.parse(authorization.recordedAt)
  const expiresAt = Date.parse(authorization.expiresAt)
  const nowMs = Date.parse(now)
  if (nowMs < recordedAt || nowMs >= expiresAt || expiresAt - recordedAt > 86_400_000) {
    blocked('Speech secret-version metadata authority is outside its exact execution window.')
  }
  if (
    authorization.maximumInternalProductionCostMicros !==
      packet.costPolicy.maximumInternalProductionCostMicros
  ) {
    blocked('Speech secret-version metadata cost authority changed after packet review.')
  }

  const runRoot = inside(repositoryRoot, PRIVATE_RUN_ROOT_RELATIVE_PATH)
  await mkdir(runRoot, { recursive: true, mode: 0o700 })
  await assertPrivateDirectory(runRoot, repositoryRoot)
  const consumptionPath = join(runRoot, CONSUMPTION_RECORD_FILENAME)
  const evidencePath = join(runRoot, EVIDENCE_FILENAME)
  const failurePath = join(runRoot, FAILURE_FILENAME)
  const progress = {
    googleCloudCommandCount: 0,
    secretPayloadReadCount: 0,
    providerRequestCount: 0,
    lastPhase: 'authority_validated' as string,
  }

  await writePrivateJsonCreateOnly(consumptionPath, {
    schemaVersion: 'motion-studio.speech-secret-version-metadata-authority-consumption.v1',
    state: 'single_use_authority_consumed_before_metadata_command',
    authorizationId: AUTHORIZATION_ID,
    authorityPacketDigest: packetDigest,
    authorizationRecordDigest: sha256Bytes(authorizationBytes),
    ownerAuthorizationEvidenceId: authorization.ownerAuthorizationEvidenceId,
    googleCloudCommandCountAtConsumption: 0,
    secretPayloadReadCountAtConsumption: 0,
    providerRequestCountAtConsumption: 0,
    consumedAt: now,
    immutable: true,
  }, 'Speech secret-version metadata authority is already consumed.')

  try {
    progress.lastPhase = 'metadata_command_started'
    progress.googleCloudCommandCount = 1
    const stdout = input.mode === 'live'
      ? await runLiveMetadataCommand()
      : await input.commandRunner(MOTION_STUDIO_SPEECH_GCLOUD_BINARY_PATH, COMMAND_ARGS)
    progress.lastPhase = 'metadata_command_completed'
    const secretVersionState = parseMetadataState(stdout)
    const completedAt = now
    const evidenceBase = {
      schemaVersion: 'motion-studio.speech-secret-version-metadata-private-evidence.v1' as const,
      state: 'private_secret_version_metadata_evidence_ready' as const,
      evidenceClass: input.mode === 'live'
        ? 'authenticated_google_cloud_read_only' as const
        : 'private_local_fixture' as const,
      authorizationId: AUTHORIZATION_ID,
      authorityPacketDigest: packetDigest,
      ownerAuthorizationEvidenceId: authorization.ownerAuthorizationEvidenceId,
      operation: 'google_secret_manager_secret_version_metadata_describe' as const,
      projectIdentityDigest: sha256Text(MOTION_STUDIO_SPEECH_GOOGLE_CLOUD_PROJECT_ID),
      secretIdentityDigest: sha256Text(MOTION_STUDIO_SPEECH_ELEVENLABS_SECRET_LOCATOR_ID),
      numericVersionDigest: sha256Text(MOTION_STUDIO_SPEECH_ELEVENLABS_SECRET_VERSION),
      secretVersionState,
      metadataReadableByConfiguredAccount: true as const,
      secretPayloadReadVerified: false as const,
      providerCapabilityVerified: false as const,
      googleCloudCommandCount: 1 as const,
      googleCloudInternalRequestCount: null,
      googleCloudInternalRequestCountStatus: 'opaque_cli_internal_not_claimed' as const,
      secretPayloadReadCount: 0 as const,
      providerRequestCount: 0 as const,
      providerGenerationCount: 0 as const,
      purchaseCount: 0 as const,
      accountMutationCount: 0 as const,
      automaticRetryCount: 0 as const,
      automaticFallbackCount: 0 as const,
      rawCommandOutputPersisted: false as const,
      rawCommandErrorPersisted: false as const,
      accountIdentifierPersisted: false as const,
      maximumInternalProductionCostMicros:
        packet.costPolicy.maximumInternalProductionCostMicros,
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
      'Speech secret-version metadata evidence already exists.',
    )
    progress.lastPhase = 'private_evidence_persisted'
    return Object.freeze({
      schemaVersion: 'motion-studio.speech-secret-version-metadata-live-operator-result.v1',
      state: 'private_secret_version_metadata_evidence_ready',
      evidenceClass: evidence.evidenceClass,
      authorizationId: AUTHORIZATION_ID,
      authorityPacketDigest: packetDigest,
      secretVersionState,
      metadataReadableByConfiguredAccount: true,
      secretPayloadReadVerified: false,
      providerCapabilityVerified: false,
      googleCloudCommandCount: 1,
      secretPayloadReadCount: 0,
      providerRequestCount: 0,
      automaticRetryCount: 0,
      automaticFallbackCount: 0,
      evidenceDigest: evidence.evidenceDigest,
      privateEvidenceRelativePath: EVIDENCE_FILENAME,
      completedAt,
      immutable: true,
    })
  } catch (error) {
    const failureReasonClass = classifyFailure(error, progress.lastPhase)
    await writePrivateJsonCreateOnly(failurePath, {
      schemaVersion: 'motion-studio.speech-secret-version-metadata-terminal-failure.v1',
      state: 'consumed_terminal_no_retry',
      authorizationId: AUTHORIZATION_ID,
      authorityPacketDigest: packetDigest,
      ownerAuthorizationEvidenceId: authorization.ownerAuthorizationEvidenceId,
      failureCode: error instanceof ApiError ? error.code : 'MOTION_STUDIO_APPROVAL_BLOCKED',
      failureReasonClass,
      safeProgress: { ...progress },
      rawCommandOutputPersisted: false,
      rawCommandErrorPersisted: false,
      credentialPayloadPersisted: false,
      accountIdentifierPersisted: false,
      secretPayloadReadCount: 0,
      providerRequestCount: 0,
      providerGenerationCount: 0,
      retryAttempted: false,
      fallbackAttempted: false,
      failedAt: now,
      immutable: true,
    }, 'Speech secret-version metadata terminal failure already exists.')
    blocked('Speech secret-version metadata lane stopped terminally without exposing command material.')
  }
}

async function runLiveMetadataCommand(): Promise<Buffer> {
  await assertPinnedGcloudBinaryIdentity()
  const environment = createMotionStudioSpeechGoogleSecretManagerProcessEnvironment()
  return new Promise((resolveCommand, rejectCommand) => {
    execFile(MOTION_STUDIO_SPEECH_GCLOUD_BINARY_PATH, [...COMMAND_ARGS], {
      encoding: 'buffer',
      maxBuffer: MAXIMUM_STDOUT_BYTES,
      timeout: COMMAND_TIMEOUT_MILLISECONDS,
      windowsHide: true,
      env: environment,
    }, (error, stdout) => {
      if (error) {
        rejectCommand(new ApiError(
          'MOTION_STUDIO_APPROVAL_BLOCKED',
          'Speech secret-version metadata command failed.',
          409,
        ))
        return
      }
      const bytes = Buffer.isBuffer(stdout) ? stdout : Buffer.from(stdout)
      if (bytes.byteLength > MAXIMUM_STDOUT_BYTES) {
        rejectCommand(new ApiError(
          'MOTION_STUDIO_APPROVAL_BLOCKED',
          'Speech secret-version metadata response exceeded its boundary.',
          409,
        ))
        return
      }
      resolveCommand(bytes)
    })
  })
}

async function assertPinnedGcloudBinaryIdentity(): Promise<void> {
  let bytes: Buffer
  try {
    bytes = await readFile(MOTION_STUDIO_SPEECH_GCLOUD_BINARY_PATH)
  } catch {
    blocked('The pinned speech Secret Manager Cloud SDK runtime is unavailable.')
  }
  if (
    bytes.byteLength !== MOTION_STUDIO_SPEECH_GCLOUD_BINARY_BYTE_LENGTH ||
    sha256Bytes(bytes) !== MOTION_STUDIO_SPEECH_GCLOUD_BINARY_SHA256
  ) blocked('The pinned speech Secret Manager Cloud SDK runtime identity changed.')
}

function parseMetadataState(value: Buffer | string): SecretVersionState {
  const bytes = typeof value === 'string' ? Buffer.from(value, 'utf8') : Buffer.from(value)
  if (bytes.byteLength < 2 || bytes.byteLength > MAXIMUM_STDOUT_BYTES) {
    blocked('Speech secret-version metadata response is empty or oversized.')
  }
  const parsed = parseJson(bytes, 'secret-version metadata response')
  const result = z.object({
    state: z.enum(['ENABLED', 'DISABLED', 'DESTROYED', 'STATE_UNSPECIFIED']),
  }).strict().parse(parsed)
  return result.state
}

async function verifyReviewedFiles(repositoryRoot: string, files: readonly {
  relativePath: string
  byteLength: number
  sha256: string
}[]): Promise<void> {
  const seen = new Set<string>()
  for (const file of files) {
    if (seen.has(file.relativePath)) blocked('Speech secret-version metadata packet repeats a reviewed file.')
    seen.add(file.relativePath)
    const bytes = await readRegularBoundedFile(
      inside(repositoryRoot, file.relativePath),
      MAXIMUM_REVIEWED_FILE_BYTES,
      'reviewed secret-version metadata file',
    )
    if (bytes.byteLength !== file.byteLength || sha256Bytes(bytes) !== file.sha256) {
      blocked('Speech secret-version metadata reviewed file identity changed.')
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
  ) blocked('Speech secret-version metadata private run root is not owner-private.')
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
    blocked('Speech secret-version metadata private evidence could not be persisted.')
  }
  const metadata = await lstat(path)
  if (
    !metadata.isFile() || metadata.isSymbolicLink() || (metadata.mode & 0o777) !== 0o600 ||
    (typeof process.getuid === 'function' && metadata.uid !== process.getuid())
  ) blocked('Speech secret-version metadata evidence is not owner-private.')
}

function inside(repositoryRoot: string, relativePath: string): string {
  if (relativePath.startsWith('/') || relativePath.includes('..') || relativePath.includes('\\')) {
    blocked('Speech secret-version metadata path is unsafe.')
  }
  const target = resolve(repositoryRoot, relativePath)
  if (!target.startsWith(`${repositoryRoot}${sep}`)) {
    blocked('Speech secret-version metadata path escaped its repository.')
  }
  return target
}

function parseJson(bytes: Buffer, label: string): unknown {
  try {
    return JSON.parse(bytes.toString('utf8'))
  } catch {
    blocked(`${label} is not valid JSON.`)
  }
}

function exactIso(value: string, label: string): string {
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed) || new Date(parsed).toISOString() !== value) blocked(`${label} is invalid.`)
  return value
}

function classifyFailure(error: unknown, phase: string): string {
  if (phase === 'metadata_command_started') return 'secret_version_metadata_command_failed'
  if (phase === 'metadata_command_completed') return 'secret_version_metadata_response_validation_failed'
  if (phase === 'private_evidence_write_started') return 'evidence_persistence_failed'
  return error instanceof ApiError ? 'bounded_metadata_diagnostic_failed' : 'unclassified_safe_failure'
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
