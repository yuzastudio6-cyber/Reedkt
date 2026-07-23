import { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'
import { lstat, readFile, realpath } from 'node:fs/promises'
import { join, resolve, sep } from 'node:path'

import { ApiError } from '../../errors/api-error'
import { sha256CanonicalJson } from '../commands/canonical-json'
import {
  assertMotionStudioSpeechFixtureGoogleSecretManagerLoader,
  assertMotionStudioSpeechLiveGoogleSecretManagerBinding,
  assertMotionStudioSpeechLiveGoogleSecretManagerLoader,
  type MotionStudioSpeechSecretBindingV1,
  type MotionStudioSpeechSecretValueLoader,
} from './live-credential'

const ELEVENLABS_API_ORIGIN = 'https://api.elevenlabs.io'
const VOICE_CATALOG_PATH =
  '/v2/voices?category=premade&voice_type=default&page_size=25&sort=name&sort_direction=asc&include_total_count=false' as const
const MAX_RESPONSE_BYTES = 512 * 1024
const MAX_VOICE_CANDIDATES = 100
const MAX_PLAN_WINDOW_MS = 15 * 60_000
const MAX_ACTIVE_CONSUMED_PLANS = 512
const MAX_INTERNAL_PRODUCTION_COST_MICROS = 100_000
const PRIVATE_ACCEPTANCE_RESULT_RELATIVE_PATH =
  'tasks/motion-studio/MS-012C/c2-voice-catalog-live-result.json' as const
const PRIVATE_ACCEPTANCE_PACKET_RELATIVE_PATH =
  'tasks/motion-studio/MS-012C/c2-voice-catalog-live-authorization-request.json' as const
const PRIVATE_ACCEPTANCE_AUTHORIZATION_RECORD_RELATIVE_PATH =
  'tasks/motion-studio/MS-012C/c2-voice-catalog-live-authorization-record.json' as const
const PRIVATE_ACCEPTANCE_ROOT_RELATIVE_PATH =
  '.reeditpro-local-storage-ms012c2-voice-catalog-ext-001' as const
const PRIVATE_ACCEPTANCE_CATALOG_FILENAME = 'private-catalog-evidence.json' as const
const PRIVATE_ACCEPTANCE_CONSUMPTION_FILENAME = 'authority-consumed.json' as const
const MAX_PRIVATE_ACCEPTANCE_CONTROL_BYTES = 64 * 1024
const PRIVATE_ACCEPTANCE_RESULT_SHA256 =
  '68e0385bf37601ac86ed7a874bb0f24adbe21fa3ddaaf51f03133cd27d5c436e' as const
const PRIVATE_ACCEPTANCE_PACKET_SHA256 =
  'ebffc36945e7f938af9fade50b1b2d15c75be3c4b2111adc8d4ede79f8ca33cc' as const
const PRIVATE_ACCEPTANCE_AUTHORIZATION_RECORD_SHA256 =
  '0b59a62f231ea757a038d1ccf7ee18acfc69f20cb4d24348b1c70c2e0cbb3ffb' as const
const PRIVATE_ACCEPTANCE_CATALOG_SHA256 =
  'fb4915ef2d4447e46327c061ee284b3b839ba56725062da59c24003b1ccbaa1d' as const
const PRIVATE_ACCEPTANCE_CONSUMPTION_SHA256 =
  '884b67b10868b33bd830e2558ee64772a154301409ec139b97ec2a094e8f76cb' as const
const SHA256 = /^[a-f0-9]{64}$/
const STABLE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/
const VOICE_ID = /^[A-Za-z0-9_-]{6,128}$/
const LABEL_KEY = /^[A-Za-z0-9][A-Za-z0-9_. -]{0,63}$/
const SYSTEM_FETCH = globalThis.fetch.bind(globalThis)
const issuedPlans = new WeakMap<object, string>()
const consumedPlans = new Map<string, number>()
const issuedExternalAuthorities = new WeakMap<object, string>()
const issuedExternalAuthorityKeys = new Map<string, number>()
const consumedExternalAuthorities = new Map<string, number>()
const evidenceClasses = new WeakMap<object, MotionStudioSpeechVoiceCatalogEvidenceClass>()

export const MOTION_STUDIO_SPEECH_VOICE_CATALOG_EXTERNAL_AUTHORIZATION_ID =
  'MS-012C2-VOICE-CATALOG-EXT-001' as const

export type MotionStudioSpeechVoiceCatalogEvidenceClass =
  | 'private_local_fixture'
  | 'authenticated_provider_read_only'

export interface MotionStudioSpeechVoiceCatalogDiscoveryPlanV1 {
  schemaVersion: 'motion-studio.speech-voice-catalog-discovery-plan.v1'
  planId: string
  credentialBinding: MotionStudioSpeechSecretBindingV1
  provider: 'elevenlabs'
  apiOrigin: typeof ELEVENLABS_API_ORIGIN
  requestPath: typeof VOICE_CATALOG_PATH
  category: 'premade'
  voiceType: 'default'
  pageSize: 25
  maximumNetworkCalls: 1
  maximumCapturedResponseBytes: typeof MAX_RESPONSE_BYTES
  readOnlyRequestOnly: true
  providerGenerationAllowed: false
  previewDownloadAllowed: false
  automaticVoiceSelectionAllowed: false
  voiceBindingCreationAllowed: false
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

export interface MotionStudioSpeechPremadeVoiceCandidateV1 {
  schemaVersion: 'motion-studio.speech-premade-voice-candidate.v1'
  providerVoiceId: string
  voiceIdentityHash: string
  displayName: string
  category: 'premade'
  labels: Readonly<Record<string, string>>
  description: string | null
  availableForTiers: readonly string[]
  previewAvailable: boolean
  previewReferenceDigest?: string
  candidateEvidenceDigest: string
  immutable: true
}

export interface MotionStudioSpeechVoiceCatalogDiscoveryEvidenceV1 {
  schemaVersion: 'motion-studio.speech-voice-catalog-discovery-evidence.v1'
  state: 'premade_voice_candidates_ready' | 'no_premade_voice_candidates'
  planDigest: string
  credentialBindingDigest: string
  credentialSource: 'google_secret_manager' | 'private_local_fixture'
  credentialValueRead: true
  credentialValuePersisted: false
  externalAuthorityApplied: boolean
  externalAuthorityDigest?: string
  authorityPacketDigest?: string
  ownerAuthorizationEvidenceId?: string
  providerRequestCount: 1
  providerGenerationCallMade: false
  previewDownloaded: false
  automaticVoiceSelectionPerformed: false
  voiceBindingCreated: false
  purchasePerformed: false
  accountMutationPerformed: false
  automaticRetryPerformed: false
  automaticFallbackPerformed: false
  rawProviderResponsePersisted: false
  catalogQuery: {
    category: 'premade'
    voiceType: 'default'
    pageSize: 25
  }
  catalogCompleteness: 'complete_exact_query' | 'partial_first_page'
  hasMore: boolean
  nextPageTokenDigest?: string
  candidates: readonly MotionStudioSpeechPremadeVoiceCandidateV1[]
  candidateCount: number
  responseBodyDigest: string
  safeProviderRequestIdDigest?: string
  capturedAt: string
  evidenceDigest: string
  immutable: true
}

export interface MotionStudioSpeechVoiceCatalogExternalAuthorityV1 {
  schemaVersion: 'motion-studio.speech-voice-catalog-external-authority.v1'
  authorizationId: typeof MOTION_STUDIO_SPEECH_VOICE_CATALOG_EXTERNAL_AUTHORIZATION_ID
  authorityPacketDigest: string
  ownerAuthorizationEvidenceId: string
  planId: string
  planDigest: string
  credentialBindingDigest: string
  maximumSecretPayloadReads: 1
  maximumNetworkCalls: 1
  maximumCapturedResponseBytes: typeof MAX_RESPONSE_BYTES
  maximumRedirects: 0
  automaticRetryAllowed: false
  automaticFallbackAllowed: false
  previewDownloadAllowed: false
  voiceSelectionAllowed: false
  voiceBindingCreationAllowed: false
  accountPreflightAllowed: false
  providerGenerationAllowed: false
  maximumInternalProductionCostMicros: typeof MAX_INTERNAL_PRODUCTION_COST_MICROS
  privateLocalResearchReviewOnly: true
  issuedAt: string
  expiresAt: string
  authorityDigest: string
  immutable: true
}

export interface MotionStudioSpeechVoiceCatalogDiscoveryTransport {
  execute(input: {
    plan: MotionStudioSpeechVoiceCatalogDiscoveryPlanV1
    now: string
  }): Promise<MotionStudioSpeechVoiceCatalogDiscoveryEvidenceV1>
}

export function createMotionStudioSpeechVoiceCatalogDiscoveryPlan(input: {
  planId: string
  credentialBinding: MotionStudioSpeechSecretBindingV1
  issuedAt: string
  expiresAt: string
}): MotionStudioSpeechVoiceCatalogDiscoveryPlanV1 {
  assertMotionStudioSpeechLiveGoogleSecretManagerBinding(input.credentialBinding)
  if (!STABLE_ID.test(input.planId)) invalid('Speech voice-catalog discovery plan ID is malformed.')
  const issuedAt = exactIso(input.issuedAt, 'voice-catalog discovery issue time')
  const expiresAt = exactIso(input.expiresAt, 'voice-catalog discovery expiry time')
  const windowMs = Date.parse(expiresAt) - Date.parse(issuedAt)
  if (windowMs <= 0 || windowMs > MAX_PLAN_WINDOW_MS) {
    blocked('Speech voice-catalog discovery plan must use one positive window no longer than 15 minutes.')
  }
  const base = {
    schemaVersion: 'motion-studio.speech-voice-catalog-discovery-plan.v1' as const,
    planId: input.planId,
    credentialBinding: Object.freeze({ ...input.credentialBinding }),
    provider: 'elevenlabs' as const,
    apiOrigin: ELEVENLABS_API_ORIGIN as typeof ELEVENLABS_API_ORIGIN,
    requestPath: VOICE_CATALOG_PATH,
    category: 'premade' as const,
    voiceType: 'default' as const,
    pageSize: 25 as const,
    maximumNetworkCalls: 1 as const,
    maximumCapturedResponseBytes: MAX_RESPONSE_BYTES,
    readOnlyRequestOnly: true as const,
    providerGenerationAllowed: false as const,
    previewDownloadAllowed: false as const,
    automaticVoiceSelectionAllowed: false as const,
    voiceBindingCreationAllowed: false as const,
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

export function createMotionStudioSpeechVoiceCatalogExternalAuthority(input: {
  plan: MotionStudioSpeechVoiceCatalogDiscoveryPlanV1
  authorityPacketDigest: string
  ownerAuthorizationEvidenceId: string
  issuedAt: string
  expiresAt: string
}): MotionStudioSpeechVoiceCatalogExternalAuthorityV1 {
  const issuedAt = exactIso(input.issuedAt, 'voice-catalog external-authority issue time')
  const expiresAt = exactIso(input.expiresAt, 'voice-catalog external-authority expiry time')
  assertPlan(input.plan, issuedAt)
  if (!SHA256.test(input.authorityPacketDigest)) {
    invalid('Speech voice-catalog authority packet digest is malformed.')
  }
  if (!STABLE_ID.test(input.ownerAuthorizationEvidenceId)) {
    invalid('Speech voice-catalog owner-authorization evidence ID is malformed.')
  }
  const windowMs = Date.parse(expiresAt) - Date.parse(issuedAt)
  if (
    windowMs <= 0 || windowMs > MAX_PLAN_WINDOW_MS ||
    Date.parse(expiresAt) > Date.parse(input.plan.expiresAt)
  ) {
    blocked('Speech voice-catalog external authority must stay inside the exact plan window.')
  }
  const base = {
    schemaVersion: 'motion-studio.speech-voice-catalog-external-authority.v1' as const,
    authorizationId: MOTION_STUDIO_SPEECH_VOICE_CATALOG_EXTERNAL_AUTHORIZATION_ID,
    authorityPacketDigest: input.authorityPacketDigest,
    ownerAuthorizationEvidenceId: input.ownerAuthorizationEvidenceId,
    planId: input.plan.planId,
    planDigest: input.plan.planDigest,
    credentialBindingDigest: input.plan.credentialBinding.bindingDigest,
    maximumSecretPayloadReads: 1 as const,
    maximumNetworkCalls: 1 as const,
    maximumCapturedResponseBytes: MAX_RESPONSE_BYTES,
    maximumRedirects: 0 as const,
    automaticRetryAllowed: false as const,
    automaticFallbackAllowed: false as const,
    previewDownloadAllowed: false as const,
    voiceSelectionAllowed: false as const,
    voiceBindingCreationAllowed: false as const,
    accountPreflightAllowed: false as const,
    providerGenerationAllowed: false as const,
    maximumInternalProductionCostMicros: MAX_INTERNAL_PRODUCTION_COST_MICROS as
      typeof MAX_INTERNAL_PRODUCTION_COST_MICROS,
    privateLocalResearchReviewOnly: true as const,
    issuedAt,
    expiresAt,
    immutable: true as const,
  }
  const authorityKey = `${input.authorityPacketDigest}:${input.ownerAuthorizationEvidenceId}`
  pruneExpired(issuedExternalAuthorityKeys, Date.parse(issuedAt))
  if (issuedExternalAuthorityKeys.has(authorityKey)) {
    blocked('Speech voice-catalog owner authorization already issued one external authority.')
  }
  if (issuedExternalAuthorityKeys.size >= MAX_ACTIVE_CONSUMED_PLANS) {
    blocked('Speech voice-catalog external-authority issuance guard is full.')
  }
  const authority = Object.freeze({ ...base, authorityDigest: sha256CanonicalJson(base) })
  issuedExternalAuthorityKeys.set(authorityKey, Date.parse(expiresAt))
  issuedExternalAuthorities.set(authority, authority.authorityDigest)
  return authority
}

export function createMotionStudioSpeechVoiceCatalogDiscoveryLiveTransport(input: {
  externalNetworkEnabled: boolean
  credentialPayloadAccessEnabled: boolean
  loader: MotionStudioSpeechSecretValueLoader
  plan: MotionStudioSpeechVoiceCatalogDiscoveryPlanV1
  externalAuthority: MotionStudioSpeechVoiceCatalogExternalAuthorityV1
  requestTimeoutMs?: number
}): MotionStudioSpeechVoiceCatalogDiscoveryTransport {
  assertMotionStudioSpeechLiveGoogleSecretManagerLoader(input.loader)
  if (!input.plan || !input.externalAuthority) {
    blocked('Speech live voice-catalog transport requires an exact plan and external authority.')
  }
  assertExternalAuthority(input.externalAuthority, input.plan, input.externalAuthority.issuedAt)
  return createTransport({
    transportEnabled: input.externalNetworkEnabled,
    credentialPayloadAccessEnabled: input.credentialPayloadAccessEnabled,
    loader: input.loader,
    fetchImplementation: SYSTEM_FETCH,
    evidenceClass: 'authenticated_provider_read_only',
    externalAuthority: input.externalAuthority,
    boundPlan: input.plan,
    requestTimeoutMs: input.requestTimeoutMs,
  })
}

export function createMotionStudioSpeechVoiceCatalogDiscoveryAuthorizedFixtureTransport(input: {
  transportEnabled: boolean
  credentialPayloadAccessEnabled: boolean
  fixtureLoader: MotionStudioSpeechSecretValueLoader
  fixtureFetchImplementation: typeof fetch
  plan: MotionStudioSpeechVoiceCatalogDiscoveryPlanV1
  externalAuthority: MotionStudioSpeechVoiceCatalogExternalAuthorityV1
  requestTimeoutMs?: number
}): MotionStudioSpeechVoiceCatalogDiscoveryTransport {
  assertMotionStudioSpeechFixtureGoogleSecretManagerLoader(input.fixtureLoader)
  if (!input.plan || !input.externalAuthority) {
    blocked('Speech authorized fixture transport requires an exact plan and external authority.')
  }
  assertExternalAuthority(input.externalAuthority, input.plan, input.externalAuthority.issuedAt)
  return createTransport({
    transportEnabled: input.transportEnabled,
    credentialPayloadAccessEnabled: input.credentialPayloadAccessEnabled,
    loader: input.fixtureLoader,
    fetchImplementation: input.fixtureFetchImplementation,
    evidenceClass: 'private_local_fixture',
    externalAuthority: input.externalAuthority,
    boundPlan: input.plan,
    requestTimeoutMs: input.requestTimeoutMs,
  })
}

export function createMotionStudioSpeechVoiceCatalogDiscoveryFixtureTransport(input: {
  transportEnabled: boolean
  credentialPayloadAccessEnabled: boolean
  fixtureLoader: MotionStudioSpeechSecretValueLoader
  fixtureFetchImplementation: typeof fetch
  requestTimeoutMs?: number
}): MotionStudioSpeechVoiceCatalogDiscoveryTransport {
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

export function getMotionStudioSpeechVoiceCatalogDiscoveryEvidenceClass(
  evidence: MotionStudioSpeechVoiceCatalogDiscoveryEvidenceV1,
): MotionStudioSpeechVoiceCatalogEvidenceClass {
  const evidenceClass = evidenceClasses.get(evidence)
  if (!evidenceClass) blocked('Speech voice-catalog evidence has no trusted in-process provenance.')
  return evidenceClass
}

/**
 * Owner-machine private acceptance loader for the one consumed catalog lane.
 *
 * The live transport intentionally brands evidence only in-process. This
 * loader is the durable restart seam: it accepts no caller-selected files or
 * evidence class, verifies the tracked result plus packet/authorization and
 * both ignored 0600 private artifacts, reconstructs every immutable candidate,
 * and only then restores authenticated-provider provenance in this process.
 * It performs no credential read or network request.
 */
export async function loadMotionStudioSpeechVoiceCatalogPrivateAcceptanceEvidence(input: {
  repositoryRoot: string
}): Promise<MotionStudioSpeechVoiceCatalogDiscoveryEvidenceV1> {
  const repositoryRoot = await realpath(input.repositoryRoot)
  const [trackedResultBytes, packetBytes, authorizationRecordBytes] = await Promise.all([
    readBoundedRegularFile(
      inside(repositoryRoot, PRIVATE_ACCEPTANCE_RESULT_RELATIVE_PATH),
      MAX_PRIVATE_ACCEPTANCE_CONTROL_BYTES,
      'tracked live result',
    ),
    readBoundedRegularFile(
      inside(repositoryRoot, PRIVATE_ACCEPTANCE_PACKET_RELATIVE_PATH),
      MAX_PRIVATE_ACCEPTANCE_CONTROL_BYTES,
      'authority packet',
    ),
    readBoundedRegularFile(
      inside(repositoryRoot, PRIVATE_ACCEPTANCE_AUTHORIZATION_RECORD_RELATIVE_PATH),
      MAX_PRIVATE_ACCEPTANCE_CONTROL_BYTES,
      'authorization record',
    ),
  ])
  if (
    sha256Bytes(trackedResultBytes) !== PRIVATE_ACCEPTANCE_RESULT_SHA256 ||
    sha256Bytes(packetBytes) !== PRIVATE_ACCEPTANCE_PACKET_SHA256 ||
    sha256Bytes(authorizationRecordBytes) !== PRIVATE_ACCEPTANCE_AUTHORIZATION_RECORD_SHA256
  ) blocked('Speech private voice-catalog tracked acceptance files no longer match the frozen lane.')
  const trackedResult = record(parseJson(trackedResultBytes, 'tracked live result'), 'tracked live result')
  const privateDescriptor = record(trackedResult.privateEvidence, 'tracked private evidence descriptor')
  if (
    trackedResult.schemaVersion !== 'motion-studio.speech-voice-catalog-live-result.v1' ||
    trackedResult.status !== 'completed_private_catalog_evidence_ready' ||
    trackedResult.authorizationId !== MOTION_STUDIO_SPEECH_VOICE_CATALOG_EXTERNAL_AUTHORIZATION_ID ||
    trackedResult.candidateCategory !== 'premade' || trackedResult.catalogCompleteness !== 'complete_exact_query' ||
    trackedResult.hasMore !== false || trackedResult.immutable !== true ||
    privateDescriptor.rootRelativePath !== PRIVATE_ACCEPTANCE_ROOT_RELATIVE_PATH ||
    privateDescriptor.catalogFilename !== PRIVATE_ACCEPTANCE_CATALOG_FILENAME ||
    privateDescriptor.consumptionFilename !== PRIVATE_ACCEPTANCE_CONSUMPTION_FILENAME ||
    privateDescriptor.catalogFileMode !== '0600' || privateDescriptor.consumptionFileMode !== '0600' ||
    privateDescriptor.rawProviderResponsePersisted !== false ||
    privateDescriptor.credentialPersisted !== false || privateDescriptor.browserProjectionAllowed !== false
  ) blocked('Speech private voice-catalog result violates its fixed acceptance contract.')
  const authorityPacketDigest = stringValue(trackedResult.authorityPacketDigest, 'authority packet digest', 64)
  if (!SHA256.test(authorityPacketDigest) || sha256Bytes(packetBytes) !== authorityPacketDigest) {
    blocked('Speech private voice-catalog authority packet no longer matches the accepted result.')
  }

  const privateRoot = inside(repositoryRoot, PRIVATE_ACCEPTANCE_ROOT_RELATIVE_PATH)
  await assertPrivateEvidenceDirectory(privateRoot)
  const [catalogFile, consumptionFile] = await Promise.all([
    readPrivateEvidenceFile(
      join(privateRoot, PRIVATE_ACCEPTANCE_CATALOG_FILENAME),
      MAX_RESPONSE_BYTES,
      'catalog evidence',
    ),
    readPrivateEvidenceFile(
      join(privateRoot, PRIVATE_ACCEPTANCE_CONSUMPTION_FILENAME),
      MAX_PRIVATE_ACCEPTANCE_CONTROL_BYTES,
      'authority consumption',
    ),
  ])
  assertTrackedPrivateFile(
    catalogFile,
    privateDescriptor.catalogFileByteLength,
    privateDescriptor.catalogFileSha256,
    'catalog evidence',
  )
  assertTrackedPrivateFile(
    consumptionFile,
    privateDescriptor.consumptionFileByteLength,
    privateDescriptor.consumptionFileSha256,
    'authority consumption',
  )
  if (
    catalogFile.sha256 !== PRIVATE_ACCEPTANCE_CATALOG_SHA256 ||
    consumptionFile.sha256 !== PRIVATE_ACCEPTANCE_CONSUMPTION_SHA256
  ) blocked('Speech private voice-catalog artifacts no longer match the frozen accepted run.')

  const evidence = restorePrivateCatalogEvidence(parseJson(catalogFile.bytes, 'private catalog evidence'))
  const consumption = record(parseJson(consumptionFile.bytes, 'private authority consumption'),
    'private authority consumption')
  if (
    consumption.schemaVersion !== 'motion-studio.speech-voice-catalog-authority-consumption.v1' ||
    consumption.state !== 'single_use_authority_consumed_before_credential_read' ||
    consumption.authorizationId !== MOTION_STUDIO_SPEECH_VOICE_CATALOG_EXTERNAL_AUTHORIZATION_ID ||
    consumption.authorityPacketDigest !== authorityPacketDigest ||
    consumption.authorizationRecordDigest !== sha256Bytes(authorizationRecordBytes) ||
    consumption.ownerAuthorizationEvidenceId !== evidence.ownerAuthorizationEvidenceId ||
    consumption.planDigest !== evidence.planDigest ||
    consumption.externalAuthorityDigest !== evidence.externalAuthorityDigest ||
    consumption.credentialBindingDigest !== evidence.credentialBindingDigest ||
    consumption.credentialPayloadReadCountAtConsumption !== 0 ||
    consumption.providerRequestCountAtConsumption !== 0 || consumption.immutable !== true
  ) blocked('Speech private voice-catalog consumption evidence is inconsistent.')

  if (
    trackedResult.catalogEvidenceDigest !== evidence.evidenceDigest ||
    trackedResult.responseBodyDigest !== evidence.responseBodyDigest ||
    trackedResult.externalAuthorityDigest !== evidence.externalAuthorityDigest ||
    trackedResult.planDigest !== evidence.planDigest ||
    trackedResult.credentialBindingDigest !== evidence.credentialBindingDigest ||
    trackedResult.ownerAuthorizationEvidenceId !== evidence.ownerAuthorizationEvidenceId ||
    trackedResult.candidateCount !== evidence.candidateCount ||
    evidence.authorityPacketDigest !== authorityPacketDigest
  ) blocked('Speech private voice-catalog evidence does not match its tracked safe result.')

  evidenceClasses.set(evidence, 'authenticated_provider_read_only')
  return evidence
}

interface PrivateEvidenceFile {
  bytes: Buffer
  byteLength: number
  sha256: string
  mode: number
}

function inside(root: string, relativePath: string): string {
  if (
    relativePath.length < 1 || relativePath.includes('\0') ||
    relativePath.startsWith('/') || relativePath.split(/[\\/]/u).includes('..')
  ) blocked('Speech private voice-catalog path is unsafe.')
  const candidate = resolve(root, relativePath)
  if (!candidate.startsWith(`${root}${sep}`)) {
    blocked('Speech private voice-catalog path escapes the repository root.')
  }
  return candidate
}

async function assertPrivateEvidenceDirectory(path: string): Promise<void> {
  let metadata
  let canonicalPath
  try {
    ;[metadata, canonicalPath] = await Promise.all([lstat(path), realpath(path)])
  } catch {
    blocked('Speech private voice-catalog evidence directory is unavailable.')
  }
  if (
    !metadata.isDirectory() || metadata.isSymbolicLink() || canonicalPath !== path ||
    (metadata.mode & 0o777) !== 0o700 ||
    (typeof process.getuid === 'function' && metadata.uid !== process.getuid())
  ) blocked('Speech private voice-catalog evidence directory is not owner-private.')
}

async function readBoundedRegularFile(path: string, maximumBytes: number, label: string): Promise<Buffer> {
  let metadata
  let canonicalPath
  try {
    ;[metadata, canonicalPath] = await Promise.all([lstat(path), realpath(path)])
  } catch {
    blocked(`Speech voice-catalog ${label} is unavailable.`)
  }
  if (
    !metadata.isFile() || metadata.isSymbolicLink() || canonicalPath !== path ||
    metadata.size < 1 || metadata.size > maximumBytes
  ) blocked(`Speech voice-catalog ${label} violates its bounded regular-file contract.`)
  let bytes: Buffer
  try {
    bytes = await readFile(path)
  } catch {
    blocked(`Speech voice-catalog ${label} could not be read.`)
  }
  if (bytes.byteLength !== metadata.size || bytes.byteLength > maximumBytes) {
    blocked(`Speech voice-catalog ${label} changed during its bounded read.`)
  }
  return bytes
}

async function readPrivateEvidenceFile(
  path: string,
  maximumBytes: number,
  label: string,
): Promise<PrivateEvidenceFile> {
  let metadata
  let canonicalPath
  try {
    ;[metadata, canonicalPath] = await Promise.all([lstat(path), realpath(path)])
  } catch {
    blocked(`Speech private voice-catalog ${label} is unavailable.`)
  }
  const mode = metadata.mode & 0o777
  if (
    !metadata.isFile() || metadata.isSymbolicLink() || canonicalPath !== path ||
    mode !== 0o600 || metadata.size < 1 || metadata.size > maximumBytes ||
    (typeof process.getuid === 'function' && metadata.uid !== process.getuid())
  ) blocked(`Speech private voice-catalog ${label} is not an owner-only bounded file.`)
  let bytes: Buffer
  try {
    bytes = await readFile(path)
  } catch {
    blocked(`Speech private voice-catalog ${label} could not be read.`)
  }
  if (bytes.byteLength !== metadata.size || bytes.byteLength > maximumBytes) {
    blocked(`Speech private voice-catalog ${label} changed during its bounded read.`)
  }
  return Object.freeze({ bytes, byteLength: bytes.byteLength, sha256: sha256Bytes(bytes), mode })
}

function assertTrackedPrivateFile(
  file: PrivateEvidenceFile,
  expectedByteLength: unknown,
  expectedSha256: unknown,
  label: string,
): void {
  if (
    safeIntegerValue(expectedByteLength, `${label} byte length`, 1, MAX_RESPONSE_BYTES) !== file.byteLength ||
    digestValue(expectedSha256, `${label} SHA-256`) !== file.sha256 || file.mode !== 0o600
  ) blocked(`Speech private voice-catalog ${label} no longer matches its tracked descriptor.`)
}

function parseJson(bytes: Buffer, label: string): unknown {
  try {
    return JSON.parse(bytes.toString('utf8'))
  } catch {
    blocked(`Speech voice-catalog ${label} is not valid JSON.`)
  }
}

function restorePrivateCatalogEvidence(value: unknown): MotionStudioSpeechVoiceCatalogDiscoveryEvidenceV1 {
  const source = record(value, 'private catalog evidence')
  if (!Array.isArray(source.candidates) || source.candidates.length > MAX_VOICE_CANDIDATES) {
    blocked('Speech private voice-catalog evidence has an invalid candidate list.')
  }
  const seen = new Set<string>()
  const candidates = source.candidates.map((value, index) => {
    const candidate = record(value, `private candidate ${index + 1}`)
    const providerVoiceId = stringValue(candidate.providerVoiceId, 'private provider voice ID', 128)
    if (!VOICE_ID.test(providerVoiceId) || seen.has(providerVoiceId)) {
      blocked('Speech private voice-catalog evidence has a malformed or duplicate voice ID.')
    }
    seen.add(providerVoiceId)
    const voiceIdentityHash = digestValue(candidate.voiceIdentityHash, 'private voice identity hash')
    if (voiceIdentityHash !== sha256Text(providerVoiceId)) {
      blocked('Speech private voice-catalog identity hash does not match its provider voice ID.')
    }
    const previewAvailable = booleanValue(candidate.previewAvailable, 'private preview-available flag')
    const previewReferenceDigest = candidate.previewReferenceDigest === undefined
      ? undefined
      : digestValue(candidate.previewReferenceDigest, 'private preview reference digest')
    if (previewAvailable !== Boolean(previewReferenceDigest)) {
      blocked('Speech private voice-catalog preview evidence is inconsistent.')
    }
    const base = {
      schemaVersion: 'motion-studio.speech-premade-voice-candidate.v1' as const,
      providerVoiceId,
      voiceIdentityHash,
      displayName: stringValue(candidate.displayName, 'private voice display name', 160),
      category: 'premade' as const,
      labels: parseLabels(candidate.labels),
      description: nullableString(candidate.description, 'private voice description', 1_000),
      availableForTiers: Object.freeze(stringArray(candidate.availableForTiers,
        'private voice available tiers', 32, 96)),
      previewAvailable,
      ...(previewReferenceDigest ? { previewReferenceDigest } : {}),
      immutable: true as const,
    }
    if (
      candidate.schemaVersion !== base.schemaVersion || candidate.category !== 'premade' ||
      candidate.immutable !== true ||
      digestValue(candidate.candidateEvidenceDigest, 'private candidate evidence digest') !==
        sha256CanonicalJson(base)
    ) blocked('Speech private voice-catalog candidate failed its immutable evidence digest.')
    return Object.freeze({
      ...base,
      candidateEvidenceDigest: candidate.candidateEvidenceDigest as string,
    })
  })
  for (let index = 1; index < candidates.length; index += 1) {
    if (compareCandidates(candidates[index - 1], candidates[index]) >= 0) {
      blocked('Speech private voice-catalog candidates are not in their canonical unique order.')
    }
  }

  const catalogQuery = record(source.catalogQuery, 'private catalog query')
  const safeProviderRequestIdDigest = source.safeProviderRequestIdDigest === undefined
    ? undefined
    : digestValue(source.safeProviderRequestIdDigest, 'private provider request ID digest')
  const base = {
    schemaVersion: 'motion-studio.speech-voice-catalog-discovery-evidence.v1' as const,
    state: candidates.length > 0
      ? 'premade_voice_candidates_ready' as const
      : 'no_premade_voice_candidates' as const,
    planDigest: digestValue(source.planDigest, 'private plan digest'),
    credentialBindingDigest: digestValue(source.credentialBindingDigest, 'private credential binding digest'),
    credentialSource: 'google_secret_manager' as const,
    credentialValueRead: true as const,
    credentialValuePersisted: false as const,
    externalAuthorityApplied: true as const,
    externalAuthorityDigest: digestValue(source.externalAuthorityDigest, 'private external authority digest'),
    authorityPacketDigest: digestValue(source.authorityPacketDigest, 'private authority packet digest'),
    ownerAuthorizationEvidenceId: stringValue(source.ownerAuthorizationEvidenceId,
      'private owner authorization evidence ID', 240),
    providerRequestCount: 1 as const,
    providerGenerationCallMade: false as const,
    previewDownloaded: false as const,
    automaticVoiceSelectionPerformed: false as const,
    voiceBindingCreated: false as const,
    purchasePerformed: false as const,
    accountMutationPerformed: false as const,
    automaticRetryPerformed: false as const,
    automaticFallbackPerformed: false as const,
    rawProviderResponsePersisted: false as const,
    catalogQuery: Object.freeze({ category: 'premade' as const, voiceType: 'default' as const, pageSize: 25 as const }),
    catalogCompleteness: 'complete_exact_query' as const,
    hasMore: false,
    candidates: Object.freeze(candidates),
    candidateCount: candidates.length,
    responseBodyDigest: digestValue(source.responseBodyDigest, 'private response body digest'),
    ...(safeProviderRequestIdDigest ? { safeProviderRequestIdDigest } : {}),
    capturedAt: exactIso(stringValue(source.capturedAt, 'private capture time', 64),
      'private voice-catalog capture time'),
    immutable: true as const,
  }
  if (
    source.schemaVersion !== base.schemaVersion || source.state !== base.state ||
    source.credentialSource !== 'google_secret_manager' || source.credentialValueRead !== true ||
    source.credentialValuePersisted !== false || source.externalAuthorityApplied !== true ||
    source.providerRequestCount !== 1 || source.providerGenerationCallMade !== false ||
    source.previewDownloaded !== false || source.automaticVoiceSelectionPerformed !== false ||
    source.voiceBindingCreated !== false || source.purchasePerformed !== false ||
    source.accountMutationPerformed !== false || source.automaticRetryPerformed !== false ||
    source.automaticFallbackPerformed !== false || source.rawProviderResponsePersisted !== false ||
    catalogQuery.category !== 'premade' || catalogQuery.voiceType !== 'default' || catalogQuery.pageSize !== 25 ||
    source.catalogCompleteness !== 'complete_exact_query' || source.hasMore !== false ||
    source.nextPageTokenDigest !== undefined || source.candidateCount !== candidates.length ||
    source.immutable !== true || digestValue(source.evidenceDigest, 'private catalog evidence digest') !==
      sha256CanonicalJson(base)
  ) blocked('Speech private voice-catalog evidence failed its immutable integrity contract.')
  return Object.freeze({ ...base, evidenceDigest: source.evidenceDigest as string })
}

function safeIntegerValue(
  value: unknown,
  label: string,
  minimum: number,
  maximum: number,
): number {
  if (!Number.isSafeInteger(value) || (value as number) < minimum || (value as number) > maximum) {
    blocked(`Speech voice-catalog ${label} is malformed.`)
  }
  return value as number
}

function digestValue(value: unknown, label: string): string {
  const digest = stringValue(value, label, 64)
  if (!SHA256.test(digest)) blocked(`Speech voice-catalog ${label} is malformed.`)
  return digest
}

function createTransport(input: {
  transportEnabled: boolean
  credentialPayloadAccessEnabled: boolean
  loader: MotionStudioSpeechSecretValueLoader
  fetchImplementation: typeof fetch
  evidenceClass: MotionStudioSpeechVoiceCatalogEvidenceClass
  externalAuthority?: MotionStudioSpeechVoiceCatalogExternalAuthorityV1
  boundPlan?: MotionStudioSpeechVoiceCatalogDiscoveryPlanV1
  requestTimeoutMs?: number
}): MotionStudioSpeechVoiceCatalogDiscoveryTransport {
  if (typeof input.transportEnabled !== 'boolean' || typeof input.credentialPayloadAccessEnabled !== 'boolean') {
    invalid('Speech voice-catalog discovery activation must be explicit.')
  }
  const timeoutMs = input.requestTimeoutMs ?? 15_000
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1_000 || timeoutMs > 30_000) {
    invalid('Speech voice-catalog discovery timeout must be between one and 30 seconds.')
  }
  const loader = input.loader
  const fetchImplementation = input.fetchImplementation
  const evidenceClass = input.evidenceClass
  return Object.freeze({
    async execute({ plan, now }: {
      plan: MotionStudioSpeechVoiceCatalogDiscoveryPlanV1
      now: string
    }): Promise<MotionStudioSpeechVoiceCatalogDiscoveryEvidenceV1> {
      if (!input.transportEnabled) disabled('Speech voice-catalog discovery transport is disabled.')
      if (!input.credentialPayloadAccessEnabled) {
        blocked('Speech voice-catalog discovery credential payload access is disabled.')
      }
      const executionTime = assertPlan(plan, now)
      if (input.externalAuthority || input.boundPlan) {
        if (!input.externalAuthority || !input.boundPlan || plan !== input.boundPlan) {
          blocked('Speech voice-catalog external transport requires its exact bound plan.')
        }
        assertExternalAuthority(input.externalAuthority, plan, now)
      } else if (evidenceClass === 'authenticated_provider_read_only') {
        blocked('Speech live voice-catalog transport requires a single-use external authority.')
      }
      if (evidenceClass === 'authenticated_provider_read_only') {
        assertMotionStudioSpeechLiveGoogleSecretManagerLoader(loader)
      } else {
        assertMotionStudioSpeechFixtureGoogleSecretManagerLoader(loader)
      }
      pruneExpired(consumedPlans, executionTime)
      if (consumedPlans.has(plan.planDigest)) blocked('Speech voice-catalog discovery plan has already been consumed.')
      if (consumedPlans.size >= MAX_ACTIVE_CONSUMED_PLANS) {
        blocked('Speech voice-catalog active-plan guard is full; no credential was read.')
      }
      if (input.externalAuthority) {
        pruneExpired(consumedExternalAuthorities, executionTime)
        if (consumedExternalAuthorities.has(input.externalAuthority.authorityDigest)) {
          blocked('Speech voice-catalog external authority has already been consumed.')
        }
        if (consumedExternalAuthorities.size >= MAX_ACTIVE_CONSUMED_PLANS) {
          blocked('Speech voice-catalog external-authority guard is full; no credential was read.')
        }
        consumedExternalAuthorities.set(
          input.externalAuthority.authorityDigest,
          Date.parse(input.externalAuthority.expiresAt),
        )
      }
      consumedPlans.set(plan.planDigest, Date.parse(plan.expiresAt))

      let rawSecret: Buffer | Uint8Array | string
      try {
        rawSecret = await loader.access({
          secretLocatorId: plan.credentialBinding.secretLocatorId,
          secretVersionReference: plan.credentialBinding.secretVersionReference,
        })
      } catch {
        blocked('The pinned speech voice-catalog credential could not be accessed.')
      }
      const apiKey = validateSecretValue(rawSecret)
      const response = await requestCatalog({ fetchImplementation, apiKey, timeoutMs })
      const parsed = parseCatalog(response.value)
      const base = {
        schemaVersion: 'motion-studio.speech-voice-catalog-discovery-evidence.v1' as const,
        state: parsed.candidates.length > 0
          ? 'premade_voice_candidates_ready' as const
          : 'no_premade_voice_candidates' as const,
        planDigest: plan.planDigest,
        credentialBindingDigest: plan.credentialBinding.bindingDigest,
        credentialSource: evidenceClass === 'authenticated_provider_read_only'
          ? 'google_secret_manager' as const
          : 'private_local_fixture' as const,
        credentialValueRead: true as const,
        credentialValuePersisted: false as const,
        externalAuthorityApplied: Boolean(input.externalAuthority),
        ...(input.externalAuthority
          ? {
              externalAuthorityDigest: input.externalAuthority.authorityDigest,
              authorityPacketDigest: input.externalAuthority.authorityPacketDigest,
              ownerAuthorizationEvidenceId: input.externalAuthority.ownerAuthorizationEvidenceId,
            }
          : {}),
        providerRequestCount: 1 as const,
        providerGenerationCallMade: false as const,
        previewDownloaded: false as const,
        automaticVoiceSelectionPerformed: false as const,
        voiceBindingCreated: false as const,
        purchasePerformed: false as const,
        accountMutationPerformed: false as const,
        automaticRetryPerformed: false as const,
        automaticFallbackPerformed: false as const,
        rawProviderResponsePersisted: false as const,
        catalogQuery: Object.freeze({ category: 'premade' as const, voiceType: 'default' as const, pageSize: 25 as const }),
        catalogCompleteness: parsed.hasMore
          ? 'partial_first_page' as const
          : 'complete_exact_query' as const,
        hasMore: parsed.hasMore,
        ...(parsed.nextPageTokenDigest ? { nextPageTokenDigest: parsed.nextPageTokenDigest } : {}),
        candidates: parsed.candidates,
        candidateCount: parsed.candidates.length,
        responseBodyDigest: response.bodyDigest,
        ...(response.requestIdDigest ? { safeProviderRequestIdDigest: response.requestIdDigest } : {}),
        capturedAt: exactIso(now, 'voice-catalog discovery capture time'),
        immutable: true as const,
      }
      const evidence = Object.freeze({ ...base, evidenceDigest: sha256CanonicalJson(base) })
      evidenceClasses.set(evidence, evidenceClass)
      return evidence
    },
  })
}

async function requestCatalog(input: {
  fetchImplementation: typeof fetch
  apiKey: string
  timeoutMs: number
}): Promise<{ value: unknown; bodyDigest: string; requestIdDigest?: string }> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), input.timeoutMs)
  try {
    const response = await input.fetchImplementation(`${ELEVENLABS_API_ORIGIN}${VOICE_CATALOG_PATH}`, {
      method: 'GET',
      headers: { accept: 'application/json', 'xi-api-key': input.apiKey },
      redirect: 'manual',
      signal: controller.signal,
    })
    const body = await readBoundedBody(response)
    const bodyDigest = sha256Bytes(body)
    const requestId = response.headers.get('request-id')?.trim()
    const requestIdDigest = requestId ? sha256Text(requestId) : undefined
    if (response.status < 200 || response.status >= 300) {
      blocked(`Speech voice-catalog discovery was rejected with HTTP ${response.status}.`)
    }
    const contentType = response.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase()
    if (contentType !== 'application/json') {
      blocked('Speech voice-catalog discovery returned an unexpected content type.')
    }
    let value: unknown
    try {
      value = JSON.parse(body.toString('utf8'))
    } catch {
      blocked('Speech voice-catalog discovery returned malformed JSON.')
    }
    return { value, bodyDigest, ...(requestIdDigest ? { requestIdDigest } : {}) }
  } catch (error) {
    if (error instanceof ApiError) throw error
    if (error instanceof DOMException && error.name === 'AbortError') {
      blocked('Speech voice-catalog discovery timed out without retrying.')
    }
    blocked('Speech voice-catalog discovery network read failed without retrying.')
  } finally {
    clearTimeout(timeout)
  }
}

async function readBoundedBody(response: Response): Promise<Buffer> {
  if (!response.body) return Buffer.alloc(0)
  const reader = response.body.getReader()
  const chunks: Buffer[] = []
  let byteLength = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    byteLength += value.byteLength
    if (byteLength > MAX_RESPONSE_BYTES) {
      await reader.cancel()
      blocked('Speech voice-catalog response exceeds the private-evidence byte limit.')
    }
    chunks.push(Buffer.from(value))
  }
  return Buffer.concat(chunks, byteLength)
}

function parseCatalog(value: unknown): {
  candidates: readonly MotionStudioSpeechPremadeVoiceCandidateV1[]
  hasMore: boolean
  nextPageTokenDigest?: string
} {
  const object = record(value, 'response')
  if (!Array.isArray(object.voices) || object.voices.length > MAX_VOICE_CANDIDATES) {
    blocked('Speech voice-catalog response has an invalid candidate count.')
  }
  const seen = new Set<string>()
  const candidates = object.voices.map((voice, index) => {
    const candidate = record(voice, `candidate ${index + 1}`)
    const providerVoiceId = stringValue(candidate.voice_id, 'voice ID', 128)
    if (!VOICE_ID.test(providerVoiceId) || seen.has(providerVoiceId)) {
      blocked('Speech voice-catalog response contains a malformed or duplicate voice ID.')
    }
    seen.add(providerVoiceId)
    const category = stringValue(candidate.category, 'voice category', 64)
    if (category !== 'premade') {
      blocked('Speech voice-catalog response violated its exact premade category filter.')
    }
    const displayName = stringValue(candidate.name, 'voice name', 160)
    const labels = parseLabels(candidate.labels)
    const description = nullableString(candidate.description, 'voice description', 1_000)
    const availableForTiers = candidate.available_for_tiers === undefined || candidate.available_for_tiers === null
      ? Object.freeze([] as string[])
      : Object.freeze(stringArray(candidate.available_for_tiers, 'voice available tiers', 32, 96))
    const previewReferenceDigest = parsePreviewReference(candidate.preview_url)
    const base = {
      schemaVersion: 'motion-studio.speech-premade-voice-candidate.v1' as const,
      providerVoiceId,
      voiceIdentityHash: sha256Text(providerVoiceId),
      displayName,
      category: 'premade' as const,
      labels,
      description,
      availableForTiers,
      previewAvailable: Boolean(previewReferenceDigest),
      ...(previewReferenceDigest ? { previewReferenceDigest } : {}),
      immutable: true as const,
    }
    return Object.freeze({ ...base, candidateEvidenceDigest: sha256CanonicalJson(base) })
  }).sort(compareCandidates)
  const hasMore = booleanValue(object.has_more, 'has-more flag')
  const nextPageToken = nullableString(object.next_page_token, 'next-page token', 512)
  if (hasMore && !nextPageToken) {
    blocked('Speech voice-catalog response requires a next-page token when more results exist.')
  }
  if (!hasMore && nextPageToken) {
    blocked('Speech voice-catalog response returned an unexpected next-page token.')
  }
  return {
    candidates: Object.freeze(candidates),
    hasMore,
    ...(nextPageToken ? { nextPageTokenDigest: sha256Text(nextPageToken) } : {}),
  }
}

function parseLabels(value: unknown): Readonly<Record<string, string>> {
  if (value === undefined || value === null) return Object.freeze({})
  const labels = record(value, 'voice labels')
  const entries = Object.entries(labels).sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
  if (entries.length > 16) blocked('Speech voice-catalog candidate has too many labels.')
  const safe: Record<string, string> = {}
  for (const [key, labelValue] of entries) {
    if (!LABEL_KEY.test(key)) blocked('Speech voice-catalog candidate contains an invalid label key.')
    safe[key] = stringValue(labelValue, `voice label ${key}`, 160)
  }
  return Object.freeze(safe)
}

function parsePreviewReference(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined
  const raw = stringValue(value, 'voice preview reference', 2_048)
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    blocked('Speech voice-catalog candidate preview reference is malformed.')
  }
  if (url.protocol !== 'https:' || url.username || url.password) {
    blocked('Speech voice-catalog candidate preview reference is not a safe HTTPS reference.')
  }
  return sha256Text(raw)
}

function assertPlan(plan: MotionStudioSpeechVoiceCatalogDiscoveryPlanV1, now: string): number {
  if (issuedPlans.get(plan) !== plan.planDigest) {
    blocked('Speech voice-catalog discovery requires the exact frozen in-process plan.')
  }
  assertMotionStudioSpeechLiveGoogleSecretManagerBinding(plan.credentialBinding)
  const { planDigest, ...base } = plan
  if (!SHA256.test(planDigest) || sha256CanonicalJson(base) !== planDigest) {
    blocked('Speech voice-catalog discovery plan failed its immutable digest.')
  }
  if (
    plan.apiOrigin !== ELEVENLABS_API_ORIGIN || plan.requestPath !== VOICE_CATALOG_PATH ||
    plan.category !== 'premade' || plan.voiceType !== 'default' || plan.pageSize !== 25 ||
    plan.maximumNetworkCalls !== 1 || plan.maximumCapturedResponseBytes !== MAX_RESPONSE_BYTES ||
    plan.readOnlyRequestOnly !== true || plan.providerGenerationAllowed !== false ||
    plan.previewDownloadAllowed !== false || plan.automaticVoiceSelectionAllowed !== false ||
    plan.voiceBindingCreationAllowed !== false || plan.purchaseAllowed !== false ||
    plan.accountMutationAllowed !== false || plan.automaticRetryAllowed !== false ||
    plan.automaticFallbackAllowed !== false || plan.privateLocalEvidenceOnly !== true ||
    plan.immutable !== true
  ) blocked('Speech voice-catalog discovery plan violates its one-request read-only boundary.')
  const current = Date.parse(exactIso(now, 'voice-catalog discovery execution time'))
  if (current < Date.parse(plan.issuedAt) || current > Date.parse(plan.expiresAt)) {
    blocked('Speech voice-catalog discovery plan is outside its exact execution window.')
  }
  return current
}

function assertExternalAuthority(
  authority: MotionStudioSpeechVoiceCatalogExternalAuthorityV1,
  plan: MotionStudioSpeechVoiceCatalogDiscoveryPlanV1,
  now: string,
): void {
  const issuedDigest = issuedExternalAuthorities.get(authority)
  if (!issuedDigest || issuedDigest !== authority.authorityDigest) {
    blocked('Speech voice-catalog external execution requires the exact in-process authority.')
  }
  const { authorityDigest, ...base } = authority
  if (
    !SHA256.test(authorityDigest) || sha256CanonicalJson(base) !== authorityDigest ||
    authorityDigest !== issuedDigest || authority.immutable !== true || !Object.isFrozen(authority)
  ) blocked('Speech voice-catalog external authority failed its immutable integrity check.')
  if (
    authority.authorizationId !== MOTION_STUDIO_SPEECH_VOICE_CATALOG_EXTERNAL_AUTHORIZATION_ID ||
    !SHA256.test(authority.authorityPacketDigest) ||
    !STABLE_ID.test(authority.ownerAuthorizationEvidenceId) ||
    authority.planId !== plan.planId || authority.planDigest !== plan.planDigest ||
    authority.credentialBindingDigest !== plan.credentialBinding.bindingDigest ||
    authority.maximumSecretPayloadReads !== 1 || authority.maximumNetworkCalls !== 1 ||
    authority.maximumCapturedResponseBytes !== MAX_RESPONSE_BYTES || authority.maximumRedirects !== 0 ||
    authority.automaticRetryAllowed !== false || authority.automaticFallbackAllowed !== false ||
    authority.previewDownloadAllowed !== false || authority.voiceSelectionAllowed !== false ||
    authority.voiceBindingCreationAllowed !== false || authority.accountPreflightAllowed !== false ||
    authority.providerGenerationAllowed !== false ||
    authority.maximumInternalProductionCostMicros !== MAX_INTERNAL_PRODUCTION_COST_MICROS ||
    authority.privateLocalResearchReviewOnly !== true
  ) blocked('Speech voice-catalog external authority violates its exact bounded lane.')
  const current = Date.parse(exactIso(now, 'voice-catalog external-authority execution time'))
  if (
    current < Date.parse(authority.issuedAt) || current > Date.parse(authority.expiresAt) ||
    Date.parse(authority.issuedAt) < Date.parse(plan.issuedAt) ||
    Date.parse(authority.expiresAt) > Date.parse(plan.expiresAt)
  ) blocked('Speech voice-catalog external authority is outside its exact execution window.')
}

function pruneExpired(values: Map<string, number>, now: number): void {
  for (const [key, expiresAt] of values) if (expiresAt < now) values.delete(key)
}

function validateSecretValue(raw: Buffer | Uint8Array | string): string {
  const value = (typeof raw === 'string' ? raw : Buffer.from(raw).toString('utf8')).trim()
  if (value.length < 16 || value.length > 4_096 || /\s/.test(value)) {
    blocked('The pinned speech voice-catalog credential is malformed.')
  }
  return value
}

function record(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    blocked(`Speech voice-catalog ${label} is malformed.`)
  }
  return value as Record<string, unknown>
}

function stringValue(value: unknown, label: string, maximumLength: number): string {
  if (typeof value !== 'string' || value.length < 1 || value.length > maximumLength || value.includes('\0')) {
    blocked(`Speech voice-catalog ${label} is malformed.`)
  }
  return value
}

function nullableString(value: unknown, label: string, maximumLength: number): string | null {
  if (value === undefined || value === null) return null
  return stringValue(value, label, maximumLength)
}

function booleanValue(value: unknown, label: string): boolean {
  if (typeof value !== 'boolean') blocked(`Speech voice-catalog ${label} is malformed.`)
  return value
}

function stringArray(value: unknown, label: string, maximumItems: number, maximumLength: number): string[] {
  if (!Array.isArray(value) || value.length > maximumItems) {
    blocked(`Speech voice-catalog ${label} is malformed.`)
  }
  const entries = value.map((entry) => stringValue(entry, label, maximumLength))
  if (new Set(entries).size !== entries.length) blocked(`Speech voice-catalog ${label} contains duplicates.`)
  return entries.sort()
}

function compareCandidates(
  left: MotionStudioSpeechPremadeVoiceCandidateV1,
  right: MotionStudioSpeechPremadeVoiceCandidateV1,
): number {
  if (left.displayName < right.displayName) return -1
  if (left.displayName > right.displayName) return 1
  if (left.providerVoiceId < right.providerVoiceId) return -1
  if (left.providerVoiceId > right.providerVoiceId) return 1
  return 0
}

function exactIso(value: string, label: string): string {
  const timestamp = Date.parse(value)
  if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString() !== value) {
    invalid(`Speech ${label} is invalid.`)
  }
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
