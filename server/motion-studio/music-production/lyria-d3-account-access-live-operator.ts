import { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'
import { lstat, mkdir, readFile, realpath, writeFile } from 'node:fs/promises'
import { join, resolve, sep } from 'node:path'

import { ApiError } from '../../errors/api-error'
import {
  createMotionStudioLyriaOfficialDiscoveryEvidence,
  createMotionStudioMusicFoleyProtocolFixture,
} from '../audio'
import { sha256CanonicalJson } from '../commands/canonical-json'
import {
  MOTION_STUDIO_LYRIA_D3_ACCEPTED_EXTERNAL_READINESS_DIGEST,
  MOTION_STUDIO_LYRIA_D3_ACCEPTED_PREFLIGHT_DIGEST,
  MOTION_STUDIO_LYRIA_D3_ACCOUNT_ACCESS_AUTHORIZATION_ID,
  MOTION_STUDIO_LYRIA_D3_ACCOUNT_ACCESS_MAXIMUM_INTERNAL_PRODUCTION_COST_MICROS,
  MOTION_STUDIO_LYRIA_D3_ACCOUNT_ACCESS_MAXIMUM_RESPONSE_BYTES,
  createMotionStudioLyriaD3AccountAccessExternalAuthority,
  createMotionStudioLyriaD3AccountAccessFixtureSecretLoader,
  createMotionStudioLyriaD3AccountAccessLiveHttpReader,
  createMotionStudioLyriaD3AccountAccessLiveSecretLoader,
  createMotionStudioLyriaD3AccountAccessPlanFromAcceptedEvidence,
  createMotionStudioLyriaD3AccountAccessTransport,
  type MotionStudioLyriaD3AccountAccessHttpReader,
  type MotionStudioLyriaD3AccountAccessSafeProgressEventV1,
} from './lyria-d3-account-access'
import { createMotionStudioLyriaD3PreflightPlan } from './lyria-d3-preflight'
import {
  MOTION_STUDIO_LYRIA_D3_GCLOUD_BINARY_BYTE_LENGTH,
  MOTION_STUDIO_LYRIA_D3_GCLOUD_BINARY_PATH,
  MOTION_STUDIO_LYRIA_D3_GCLOUD_BINARY_SHA256,
  MOTION_STUDIO_LYRIA_D3_GCLOUD_SDK_VERSION,
  MOTION_STUDIO_LYRIA_D3_GOOGLE_CLOUD_PROJECT_ID,
  MOTION_STUDIO_LYRIA_D3_SECRET_LOCATOR_ID,
  MOTION_STUDIO_LYRIA_D3_SECRET_RESOURCE_NAME,
  MOTION_STUDIO_LYRIA_D3_SECRET_VERSION,
  createMotionStudioLyriaD3CredentialPresenceEvidence,
  createMotionStudioLyriaD3ExternalReadiness,
  createMotionStudioLyriaD3LocalComputeRateCard,
  createMotionStudioLyriaD3ModelDataPolicy,
  createMotionStudioLyriaD3SecretBinding,
  createMotionStudioLyriaD3TransportBudget,
} from './lyria-d3-readiness'

const SHA256 = /^[a-f0-9]{64}$/
const STABLE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/
const PACKET_RELATIVE_PATH =
  'tasks/motion-studio/MS-012D/d3-account-model-access-live-authorization-request-ext-001.json' as const
const AUTHORIZATION_RECORD_RELATIVE_PATH =
  'tasks/motion-studio/MS-012D/d3-account-model-access-live-authorization-record-ext-001.json' as const
const PRIVATE_INGEST_LINEAGE_RELATIVE_PATH =
  'tasks/motion-studio/MS-012D/d3-private-ingest-lineage-reconciliation.json' as const
const PRIVATE_RUN_ROOT_RELATIVE_PATH =
  '.reeditpro-local-storage-ms012d3-account-model-access-ext-001' as const
const CONSUMPTION_RECORD_FILENAME = 'authority-consumed.json' as const
const EVIDENCE_FILENAME = 'private-account-model-access-evidence.json' as const
const FAILURE_FILENAME = 'terminal-failure.json' as const
const MAXIMUM_PACKET_BYTES = 128 * 1024
const MAXIMUM_AUTHORIZATION_RECORD_BYTES = 32 * 1024
const MAXIMUM_LINEAGE_RECORD_BYTES = 32 * 1024
const REQUEST_TIMEOUT_MILLISECONDS = 15_000
const AUTHORITY_WINDOW_MILLISECONDS = 10 * 60_000
const OWNER_STANDING_DIRECTIVE_ID = 'MS-OWNER-STANDING-IMPLEMENTATION-QA-20260718' as const
const OWNER_AUTHORIZATION_EVIDENCE_ID = 'owner-standing-storytelling-self-qa-20260718' as const
const OWNER_STANDING_DIRECTIVE_SHA256 =
  'b933153875768280382d9e9aecd1d904c4300518426bbe6ae52496c8ea0fff68' as const
const OWNER_AUTHORIZATION_STATEMENT_SHA256 =
  'cb26b67e69b5dde409462abaeeb34b1838c1561d58751314a8e78df1c39b672b' as const
const ACCEPTED_NORMALIZED_SHA256 =
  '7ff187964b4c23235775f6185e40eab527b474876338baa10f7211e7ad033746' as const
const REVIEWED_RUNTIME_RELATIVE_PATHS = Object.freeze([
  'server/motion-studio/music-production/lyria-d3-account-access.ts',
  'server/motion-studio/music-production/lyria-d3-account-access-live-operator.ts',
  'server/motion-studio/music-production/lyria-d3-account-access-live-cli.ts',
] as const)

export const MOTION_STUDIO_LYRIA_D3_ACCOUNT_ACCESS_LIVE_OPERATOR_PATHS = Object.freeze({
  packetRelativePath: PACKET_RELATIVE_PATH,
  authorizationRecordRelativePath: AUTHORIZATION_RECORD_RELATIVE_PATH,
  privateIngestLineageRelativePath: PRIVATE_INGEST_LINEAGE_RELATIVE_PATH,
  privateRunRootRelativePath: PRIVATE_RUN_ROOT_RELATIVE_PATH,
  consumptionRecordFilename: CONSUMPTION_RECORD_FILENAME,
  evidenceFilename: EVIDENCE_FILENAME,
  failureFilename: FAILURE_FILENAME,
})

export interface MotionStudioLyriaD3AccountAccessLiveOperatorResultV1 {
  schemaVersion: 'motion-studio.lyria-d3-account-model-access-live-operator-result.v1'
  state: 'private_account_model_access_evidence_ready'
  evidenceClass: 'authenticated_provider_read_only' | 'private_local_fixture'
  authorizationId: typeof MOTION_STUDIO_LYRIA_D3_ACCOUNT_ACCESS_AUTHORIZATION_ID
  authorityPacketDigest: string
  ownerAuthorizationEvidenceId: string
  sourcePreflightDigest: typeof MOTION_STUDIO_LYRIA_D3_ACCEPTED_PREFLIGHT_DIGEST
  sourceExternalReadinessDigest: typeof MOTION_STUDIO_LYRIA_D3_ACCEPTED_EXTERNAL_READINESS_DIGEST
  sourcePrivateIngestLineageDigest: string
  planDigest: string
  externalAuthorityDigest: string
  preflightEvidenceDigest: string
  providerAccountAccessVerified: true
  providerFundsOrQuotaVerified: false
  providerAccountAccessAndFundsGateResolved: false
  credentialPayloadReadCount: 1
  providerRequestCount: 1
  providerGenerationCount: 0
  purchaseCount: 0
  accountMutationCount: 0
  automaticRetryCount: 0
  automaticFallbackCount: 0
  internalProductionCostMicros: 0
  privateEvidenceRelativePath: typeof EVIDENCE_FILENAME
  completedAt: string
  immutable: true
}

interface FixtureInput {
  repositoryRoot: string
  now: string
  fixtureSecretCommandRunner: (
    command: string,
    args: readonly string[],
  ) => Promise<Buffer | Uint8Array | string>
  fixtureHttpReader: MotionStudioLyriaD3AccountAccessHttpReader
}

export async function executeMotionStudioLyriaD3AccountAccessLiveOperator(input: {
  repositoryRoot: string
  now: string
}): Promise<MotionStudioLyriaD3AccountAccessLiveOperatorResultV1> {
  return executeOperator({ mode: 'live', ...input })
}

/** Fixture-only proof; it can never produce authenticated provider evidence. */
export async function executeMotionStudioLyriaD3AccountAccessAuthorizedFixtureOperator(
  input: FixtureInput,
): Promise<MotionStudioLyriaD3AccountAccessLiveOperatorResultV1> {
  return executeOperator({ mode: 'fixture', ...input })
}

async function executeOperator(input: ({
  mode: 'live'
  repositoryRoot: string
  now: string
} | ({ mode: 'fixture' } & FixtureInput))):
Promise<MotionStudioLyriaD3AccountAccessLiveOperatorResultV1> {
  const now = exactIso(input.now, 'Lyria account-access operator time')
  const repositoryRoot = await realpath(input.repositoryRoot)
  const packetBytes = await readRegularBoundedFile(
    inside(repositoryRoot, PACKET_RELATIVE_PATH), MAXIMUM_PACKET_BYTES, 'authority packet')
  const packetDigest = sha256Bytes(packetBytes)
  const packet = validatePacket(parseJson(packetBytes, 'authority packet'), packetDigest)
  await verifyReviewedRuntimeFiles(repositoryRoot, packet.reviewedRuntimeFiles)
  const authorizationRecordBytes = await readRegularBoundedFile(
    inside(repositoryRoot, AUTHORIZATION_RECORD_RELATIVE_PATH),
    MAXIMUM_AUTHORIZATION_RECORD_BYTES,
    'standing-directive authorization record',
  )
  const authorizationRecord = validateAuthorizationRecord(
    parseJson(authorizationRecordBytes, 'standing-directive authorization record'), packetDigest, now)
  const authorizationRecordDigest = sha256Bytes(authorizationRecordBytes)
  const lineageBytes = await readRegularBoundedFile(
    inside(repositoryRoot, PRIVATE_INGEST_LINEAGE_RELATIVE_PATH),
    MAXIMUM_LINEAGE_RECORD_BYTES,
    'private-ingest lineage reconciliation record',
  )
  if (sha256Bytes(lineageBytes) !== packet.privateIngestLineageFileSha256) {
    blocked('Lyria account-access private-ingest lineage file changed after authority review.')
  }
  const lineage = validatePrivateIngestLineage(
    parseJson(lineageBytes, 'private-ingest lineage reconciliation record'),
    packet.privateIngestLineageRecordDigest,
  )
  const { preflight, externalReadiness } = createAcceptedD3Lineage()
  const expiresAt = new Date(Math.min(
    Date.parse(now) + AUTHORITY_WINDOW_MILLISECONDS,
    Date.parse(preflight.expiresAt),
  )).toISOString()
  const plan = createMotionStudioLyriaD3AccountAccessPlanFromAcceptedEvidence({
    preflight,
    externalReadiness,
    privateIngestEvidenceId: lineage.evidenceId,
    privateIngestEvidenceDigest: lineage.recordDigest,
    issuedAt: now,
    expiresAt,
  })
  const externalAuthority = createMotionStudioLyriaD3AccountAccessExternalAuthority({
    plan,
    authorityPacketDigest: packetDigest,
    ownerAuthorizationEvidenceId: authorizationRecord.ownerAuthorizationEvidenceId,
    issuedAt: now,
    expiresAt,
  })

  const runRootPath = inside(repositoryRoot, PRIVATE_RUN_ROOT_RELATIVE_PATH)
  await mkdir(runRootPath, { recursive: true, mode: 0o700 })
  const [resolvedRunRoot, runRootMetadata] = await Promise.all([realpath(runRootPath), lstat(runRootPath)])
  if (
    resolvedRunRoot !== runRootPath || !resolvedRunRoot.startsWith(`${repositoryRoot}${sep}`) ||
    !runRootMetadata.isDirectory() || runRootMetadata.isSymbolicLink() ||
    (runRootMetadata.mode & 0o777) !== 0o700 ||
    (typeof process.getuid === 'function' && runRootMetadata.uid !== process.getuid())
  ) blocked('Lyria account-access private run root is not owner-private.')

  const safeProgress = {
    lastPhase: 'authority_consumed' as string,
    credentialReadStarted: false,
    credentialPayloadReadCount: 0,
    providerRequestAttemptCount: 0,
    providerRequestCompletedCount: 0,
  }
  const onSafeProgress = (event: MotionStudioLyriaD3AccountAccessSafeProgressEventV1) => {
    safeProgress.lastPhase = event.phase
    if (event.phase === 'credential_read_started') safeProgress.credentialReadStarted = true
    if (event.phase === 'credential_read_completed') safeProgress.credentialPayloadReadCount = 1
    if (event.phase === 'provider_request_started') safeProgress.providerRequestAttemptCount = 1
    if (event.phase === 'provider_request_completed') safeProgress.providerRequestCompletedCount = 1
  }
  const secretLoader = input.mode === 'live'
    ? createMotionStudioLyriaD3AccountAccessLiveSecretLoader({
        projectId: MOTION_STUDIO_LYRIA_D3_GOOGLE_CLOUD_PROJECT_ID,
        timeoutMilliseconds: REQUEST_TIMEOUT_MILLISECONDS,
      })
    : createMotionStudioLyriaD3AccountAccessFixtureSecretLoader({
        projectId: MOTION_STUDIO_LYRIA_D3_GOOGLE_CLOUD_PROJECT_ID,
        timeoutMilliseconds: REQUEST_TIMEOUT_MILLISECONDS,
        commandRunner: input.fixtureSecretCommandRunner,
      })
  const httpReader = input.mode === 'live'
    ? createMotionStudioLyriaD3AccountAccessLiveHttpReader()
    : input.fixtureHttpReader
  const transport = createMotionStudioLyriaD3AccountAccessTransport({
    plan,
    externalAuthority,
    secretLoader,
    httpReader,
    evidenceClass: input.mode === 'live'
      ? 'authenticated_provider_read_only'
      : 'private_local_fixture',
    requestTimeoutMilliseconds: REQUEST_TIMEOUT_MILLISECONDS,
    onSafeProgress,
  })

  await writePrivateJsonExclusive(join(resolvedRunRoot, CONSUMPTION_RECORD_FILENAME), {
    schemaVersion: 'motion-studio.lyria-d3-account-model-access-authority-consumption.v1',
    state: 'single_use_authority_consumed_before_credential_read',
    authorizationId: packet.authorizationId,
    authorityPacketDigest: packetDigest,
    authorizationRecordDigest,
    ownerAuthorizationEvidenceId: authorizationRecord.ownerAuthorizationEvidenceId,
    sourcePreflightDigest: preflight.preflightDigest,
    sourceExternalReadinessDigest: externalReadiness.readinessDigest,
    sourcePrivateIngestLineageDigest: lineage.recordDigest,
    planDigest: plan.planDigest,
    externalAuthorityDigest: externalAuthority.authorityDigest,
    secretBindingDigest: plan.secretBindingDigest,
    credentialPayloadReadCountAtConsumption: 0,
    providerRequestCountAtConsumption: 0,
    consumedAt: now,
    immutable: true,
  }, 'Lyria account-access external authority is already consumed.')

  try {
    const evidence = await transport.execute(now)
    if (
      evidence.planDigest !== plan.planDigest ||
      evidence.externalAuthorityDigest !== externalAuthority.authorityDigest ||
      evidence.sourcePrivateIngestEvidenceDigest !== lineage.recordDigest ||
      evidence.credentialValueRead !== true || evidence.providerRequestCount !== 1 ||
      evidence.dnsLookupCount !== 1 || evidence.addressConnectionAttemptCount !== 1 ||
      evidence.providerGenerationCallMade !== false || evidence.purchasePerformed !== false ||
      evidence.accountMutationPerformed !== false || evidence.automaticRetryPerformed !== false ||
      evidence.automaticFallbackPerformed !== false || evidence.rawProviderResponsePersisted !== false ||
      evidence.providerAccountAccessVerified !== true || evidence.providerFundsOrQuotaVerified !== false ||
      evidence.providerAccountAccessAndFundsGateResolved !== false ||
      evidence.providerGenerationEligibilityVerified !== false ||
      evidence.internalProductionCostMicros !== 0
    ) blocked('Lyria account-access evidence does not match the consumed read-only authority.')
    await writePrivateJsonExclusive(join(resolvedRunRoot, EVIDENCE_FILENAME), evidence,
      'Lyria account-access private evidence already exists.')
    return Object.freeze({
      schemaVersion: 'motion-studio.lyria-d3-account-model-access-live-operator-result.v1' as const,
      state: 'private_account_model_access_evidence_ready' as const,
      evidenceClass: input.mode === 'live'
        ? 'authenticated_provider_read_only' as const
        : 'private_local_fixture' as const,
      authorizationId: packet.authorizationId,
      authorityPacketDigest: packetDigest,
      ownerAuthorizationEvidenceId: authorizationRecord.ownerAuthorizationEvidenceId,
      sourcePreflightDigest: MOTION_STUDIO_LYRIA_D3_ACCEPTED_PREFLIGHT_DIGEST,
      sourceExternalReadinessDigest: MOTION_STUDIO_LYRIA_D3_ACCEPTED_EXTERNAL_READINESS_DIGEST,
      sourcePrivateIngestLineageDigest: lineage.recordDigest,
      planDigest: plan.planDigest,
      externalAuthorityDigest: externalAuthority.authorityDigest,
      preflightEvidenceDigest: evidence.evidenceDigest,
      providerAccountAccessVerified: true as const,
      providerFundsOrQuotaVerified: false as const,
      providerAccountAccessAndFundsGateResolved: false as const,
      credentialPayloadReadCount: 1 as const,
      providerRequestCount: 1 as const,
      providerGenerationCount: 0 as const,
      purchaseCount: 0 as const,
      accountMutationCount: 0 as const,
      automaticRetryCount: 0 as const,
      automaticFallbackCount: 0 as const,
      internalProductionCostMicros: 0 as const,
      privateEvidenceRelativePath: EVIDENCE_FILENAME,
      completedAt: now,
      immutable: true as const,
    })
  } catch (error) {
    await writePrivateJsonBestEffort(join(resolvedRunRoot, FAILURE_FILENAME), {
      schemaVersion: 'motion-studio.lyria-d3-account-model-access-terminal-failure.v1',
      state: 'consumed_terminal_no_retry',
      authorizationId: packet.authorizationId,
      authorityPacketDigest: packetDigest,
      ownerAuthorizationEvidenceId: authorizationRecord.ownerAuthorizationEvidenceId,
      sourcePreflightDigest: preflight.preflightDigest,
      sourceExternalReadinessDigest: externalReadiness.readinessDigest,
      sourcePrivateIngestLineageDigest: lineage.recordDigest,
      planDigest: plan.planDigest,
      externalAuthorityDigest: externalAuthority.authorityDigest,
      failureCode: error instanceof ApiError ? error.code : 'INTERNAL_ERROR',
      failureReasonClass: safeFailureReasonClass(error, safeProgress),
      safeProgress,
      credentialAndRequestOutcome: 'not_retried_after_authority_consumption',
      failedAt: now,
      immutable: true,
    })
    throw error
  }
}

function createAcceptedD3Lineage() {
  const scope = {
    workspaceId: '11111111-1111-4111-8111-111111111111',
    projectId: '22222222-2222-4222-8222-222222222222',
    editSessionId: 'edit-lyria-d3-local-preflight',
    productionId: '33333333-3333-4333-8333-333333333333',
  }
  const discovery = createMotionStudioLyriaOfficialDiscoveryEvidence(scope)
  const fixture = createMotionStudioMusicFoleyProtocolFixture({
    ...scope,
    approvedSnapshotId: '44444444-4444-4444-8444-444444444444',
    approvedSnapshotDigest: 'a'.repeat(64),
    createdAt: '2026-07-18T18:30:00.000Z',
  })
  const request = structuredClone(fixture.musicRequest)
  request.capabilitySnapshotId = discovery.capabilitySnapshot.capabilitySnapshotId
  request.capabilitySnapshotDigest = discovery.capabilitySnapshot.evidenceDigest
  const preflight = createMotionStudioLyriaD3PreflightPlan({
    request,
    discovery,
    fps: 24,
    createdAt: '2026-07-18T20:00:00.000Z',
  })
  const secretBinding = createMotionStudioLyriaD3SecretBinding(preflight)
  const credentialPresence = createMotionStudioLyriaD3CredentialPresenceEvidence({
    preflight,
    secretBinding,
    secretResourceName: MOTION_STUDIO_LYRIA_D3_SECRET_RESOURCE_NAME,
    versionState: 'ENABLED',
    versionCreateTime: '2026-05-21T02:50:33.191220Z',
    observedAt: '2026-07-18T23:41:29.000Z',
  })
  const modelDataPolicy = createMotionStudioLyriaD3ModelDataPolicy({
    preflight,
    approvedAt: '2026-07-18T23:42:00.000Z',
  })
  const transportBudget = createMotionStudioLyriaD3TransportBudget(preflight)
  const localComputeRateCard = createMotionStudioLyriaD3LocalComputeRateCard({
    preflight,
    verifiedAt: '2026-07-18T23:42:00.000Z',
  })
  const externalReadiness = createMotionStudioLyriaD3ExternalReadiness({
    preflight,
    secretBinding,
    credentialPresence,
    modelDataPolicy,
    transportBudget,
    localComputeRateCard,
    createdAt: '2026-07-18T23:43:00.000Z',
  })
  if (preflight.preflightDigest !== MOTION_STUDIO_LYRIA_D3_ACCEPTED_PREFLIGHT_DIGEST ||
      externalReadiness.readinessDigest !== MOTION_STUDIO_LYRIA_D3_ACCEPTED_EXTERNAL_READINESS_DIGEST) {
    blocked('Lyria account-access reconstructed D3 lineage differs from accepted evidence.')
  }
  return { preflight, externalReadiness }
}

function validatePrivateIngestLineage(value: unknown, expectedDigest: string): {
  evidenceId: string
  recordDigest: string
} {
  const record = object(value, 'private-ingest lineage record')
  const { recordDigest, ...base } = record
  if (
    record.schemaVersion !== 'motion-studio.lyria-d3-private-ingest-lineage-reconciliation.v1' ||
    record.status !== 'canonical_lineage_reconciled_execution_still_blocked' ||
    record.sourcePreflightDigest !== MOTION_STUDIO_LYRIA_D3_ACCEPTED_PREFLIGHT_DIGEST ||
    record.sourceExternalReadinessDigest !== MOTION_STUDIO_LYRIA_D3_ACCEPTED_EXTERNAL_READINESS_DIGEST ||
    record.canonicalOperationId !== 'tool.ffmpeg.execute_approved_media_recipe.v1' ||
    record.recipeProfileId !== 'approved_generated_music_candidate_normalization_v1' ||
    record.normalizedSha256 !== ACCEPTED_NORMALIZED_SHA256 ||
    record.providerRequestCount !== 0 || record.providerSubmissionCount !== 0 ||
    record.providerCandidateCreated !== false || record.executionAuthorityIssued !== false ||
    record.providerExecutionAllowed !== false || record.immutable !== true ||
    !STABLE_ID.test(String(record.evidenceId)) || !SHA256.test(String(recordDigest)) ||
    recordDigest !== expectedDigest || sha256CanonicalJson(base) !== recordDigest
  ) blocked('Lyria account-access private-ingest lineage record failed its exact contract.')
  return { evidenceId: String(record.evidenceId), recordDigest: String(recordDigest) }
}

function validatePacket(value: unknown, packetDigest: string): {
  authorizationId: typeof MOTION_STUDIO_LYRIA_D3_ACCOUNT_ACCESS_AUTHORIZATION_ID
  privateIngestLineageFileSha256: string
  privateIngestLineageRecordDigest: string
  reviewedRuntimeFiles: readonly { relativePath: string; byteLength: number; sha256: string }[]
} {
  const packet = object(value, 'authority packet')
  const source = object(packet.sourceEvidence, 'source evidence')
  const credential = object(packet.credentialAuthority, 'credential authority')
  const runtime = object(packet.credentialRuntimeIdentity, 'credential runtime')
  const request = object(packet.request, 'provider request')
  const authority = object(packet.runtimeExternalAuthority, 'runtime external authority')
  const operator = object(packet.operatorPolicy, 'operator policy')
  const evidence = object(packet.evidencePolicy, 'evidence policy')
  const failure = object(packet.safeFailureEvidencePolicy, 'safe failure evidence policy')
  const cost = object(packet.costPolicy, 'cost policy')
  const reviewedRuntimeFiles = parseReviewedRuntimeFiles(packet.reviewedRuntimeFiles)
  if (
    packet.schemaVersion !== 'motion-studio.lyria-d3-account-model-access-live-authorization.v1' ||
    packet.authorizationId !== MOTION_STUDIO_LYRIA_D3_ACCOUNT_ACCESS_AUTHORIZATION_ID ||
    packet.status !== 'standing_directive_authorization_ready_not_executed' || packet.singleUse !== true ||
    source.preflightDigest !== MOTION_STUDIO_LYRIA_D3_ACCEPTED_PREFLIGHT_DIGEST ||
    source.externalReadinessDigest !== MOTION_STUDIO_LYRIA_D3_ACCEPTED_EXTERNAL_READINESS_DIGEST ||
    source.privateIngestLineageRelativePath !== PRIVATE_INGEST_LINEAGE_RELATIVE_PATH ||
    !SHA256.test(String(source.privateIngestLineageFileSha256)) ||
    !SHA256.test(String(source.privateIngestLineageRecordDigest)) ||
    credential.provider !== 'google_secret_manager' ||
    credential.projectId !== MOTION_STUDIO_LYRIA_D3_GOOGLE_CLOUD_PROJECT_ID ||
    credential.secretId !== MOTION_STUDIO_LYRIA_D3_SECRET_LOCATOR_ID ||
    credential.numericVersion !== MOTION_STUDIO_LYRIA_D3_SECRET_VERSION ||
    credential.maximumPayloadReads !== 1 || credential.environmentFallbackAllowed !== false ||
    credential.credentialPersisted !== false ||
    runtime.cloudSdkVersion !== MOTION_STUDIO_LYRIA_D3_GCLOUD_SDK_VERSION ||
    runtime.resolvedExecutablePath !== MOTION_STUDIO_LYRIA_D3_GCLOUD_BINARY_PATH ||
    runtime.executableByteLength !== MOTION_STUDIO_LYRIA_D3_GCLOUD_BINARY_BYTE_LENGTH ||
    runtime.executableSha256 !== MOTION_STUDIO_LYRIA_D3_GCLOUD_BINARY_SHA256 ||
    runtime.callerSelectedExecutableAllowed !== false || runtime.proxyOrPacAllowed !== false ||
    request.method !== 'GET' || request.scheme !== 'https' ||
    request.hostname !== 'generativelanguage.googleapis.com' ||
    request.path !== '/v1beta/models/lyria-3-pro-preview' ||
    request.credentialHeaderName !== 'x-goog-api-key' || request.requestBodyAllowed !== false ||
    request.maximumHttpRequests !== 1 || request.maximumDnsLookups !== 1 ||
    request.maximumAddressConnectionAttempts !== 1 || request.ipv4Only !== true ||
    request.addressFallbackAllowed !== false || request.maximumRedirects !== 0 ||
    request.maximumResponseBytes !== MOTION_STUDIO_LYRIA_D3_ACCOUNT_ACCESS_MAXIMUM_RESPONSE_BYTES ||
    request.timeoutMilliseconds !== REQUEST_TIMEOUT_MILLISECONDS ||
    request.automaticRetryAllowed !== false || request.automaticFallbackAllowed !== false ||
    request.providerGenerationAllowed !== false || request.purchaseAllowed !== false ||
    request.accountMutationAllowed !== false ||
    authority.schemaVersion !== 'motion-studio.lyria-d3-account-model-access-external-authority.v1' ||
    authority.exactPlanInstanceRequired !== true || authority.singleUseBeforeCredentialRead !== true ||
    authority.copiedOrMismatchedAuthorityRejected !== true ||
    operator.command !==
      './node_modules/.bin/tsx server/motion-studio/music-production/lyria-d3-account-access-live-cli.ts' ||
    operator.authorizationRecordRelativePath !== AUTHORIZATION_RECORD_RELATIVE_PATH ||
    operator.privateRunRootRelativePath !== PRIVATE_RUN_ROOT_RELATIVE_PATH ||
    operator.consumptionRecordFilename !== CONSUMPTION_RECORD_FILENAME ||
    operator.privateEvidenceFilename !== EVIDENCE_FILENAME ||
    operator.terminalFailureFilename !== FAILURE_FILENAME ||
    operator.exclusiveFileCreateMode !== 'wx_0600' || operator.consumeBeforeCredentialRead !== true ||
    evidence.privateLocalEvidenceOnly !== true || evidence.rawProviderResponsePersisted !== false ||
    evidence.credentialPersisted !== false || evidence.browserProjectionAllowed !== false ||
    evidence.fundsOrQuotaMayBeClaimed !== false || evidence.combinedGateMayBeResolved !== false ||
    failure.allowlistedFailureClassOnly !== true || failure.rawErrorMessagePersisted !== false ||
    failure.responseBodyPersisted !== false || failure.credentialPersisted !== false ||
    cost.maximumInternalProductionCostMicros !==
      MOTION_STUDIO_LYRIA_D3_ACCOUNT_ACCESS_MAXIMUM_INTERNAL_PRODUCTION_COST_MICROS ||
    cost.currency !== 'USD' || cost.customerPricingAllowed !== false ||
    cost.customerCreditsAllowed !== false || cost.serviceFeeAllowed !== false ||
    cost.billingAllowed !== false || !SHA256.test(packetDigest)
  ) blocked('Lyria account-access authority packet failed its exact runtime contract.')
  return {
    authorizationId: MOTION_STUDIO_LYRIA_D3_ACCOUNT_ACCESS_AUTHORIZATION_ID,
    privateIngestLineageFileSha256: String(source.privateIngestLineageFileSha256),
    privateIngestLineageRecordDigest: String(source.privateIngestLineageRecordDigest),
    reviewedRuntimeFiles,
  }
}

function parseReviewedRuntimeFiles(value: unknown): readonly {
  relativePath: string
  byteLength: number
  sha256: string
}[] {
  if (!Array.isArray(value) || value.length !== REVIEWED_RUNTIME_RELATIVE_PATHS.length) {
    blocked('Lyria account-access packet has an invalid reviewed-runtime file set.')
  }
  return Object.freeze(value.map((entry, index) => {
    const file = object(entry, `reviewed runtime file ${index + 1}`)
    const relativePath = String(file.relativePath)
    const byteLength = Number(file.byteLength)
    const sha256 = String(file.sha256)
    if (
      relativePath !== REVIEWED_RUNTIME_RELATIVE_PATHS[index] ||
      !Number.isSafeInteger(byteLength) || byteLength < 2 || byteLength > 2 * 1024 * 1024 ||
      !SHA256.test(sha256)
    ) blocked('Lyria account-access reviewed-runtime identity is malformed.')
    return Object.freeze({ relativePath, byteLength, sha256 })
  }))
}

async function verifyReviewedRuntimeFiles(
  repositoryRoot: string,
  files: readonly { relativePath: string; byteLength: number; sha256: string }[],
): Promise<void> {
  for (const file of files) {
    const bytes = await readRegularBoundedFile(
      inside(repositoryRoot, file.relativePath), 2 * 1024 * 1024,
      `reviewed runtime file ${file.relativePath}`)
    if (bytes.byteLength !== file.byteLength || sha256Bytes(bytes) !== file.sha256) {
      blocked('Lyria account-access reviewed runtime changed after authority review.')
    }
  }
}

function validateAuthorizationRecord(value: unknown, packetDigest: string, now: string): {
  ownerAuthorizationEvidenceId: string
} {
  const record = object(value, 'standing-directive authorization record')
  if (
    record.schemaVersion !==
      'motion-studio.lyria-d3-account-model-access-live-authorization-record.v1' ||
    record.status !== 'standing_directive_authorized_unconsumed' ||
    record.authorizationId !== MOTION_STUDIO_LYRIA_D3_ACCOUNT_ACCESS_AUTHORIZATION_ID ||
    record.authorityPacketDigest !== packetDigest || record.singleUse !== true ||
    record.standingDirectiveId !== OWNER_STANDING_DIRECTIVE_ID ||
    record.ownerAuthorizationEvidenceId !== OWNER_AUTHORIZATION_EVIDENCE_ID ||
    record.standingDirectiveSha256 !== OWNER_STANDING_DIRECTIVE_SHA256 ||
    record.ownerAuthorizationStatementSha256 !== OWNER_AUTHORIZATION_STATEMENT_SHA256 ||
    record.maximumSecretPayloadReads !== 1 || record.maximumHttpRequests !== 1 ||
    record.maximumDnsLookups !== 1 || record.maximumAddressConnectionAttempts !== 1 ||
    record.maximumCapturedResponseBytes !==
      MOTION_STUDIO_LYRIA_D3_ACCOUNT_ACCESS_MAXIMUM_RESPONSE_BYTES ||
    record.maximumInternalProductionCostMicros !==
      MOTION_STUDIO_LYRIA_D3_ACCOUNT_ACCESS_MAXIMUM_INTERNAL_PRODUCTION_COST_MICROS ||
    record.automaticRetryAllowed !== false || record.automaticFallbackAllowed !== false ||
    record.providerGenerationAllowed !== false || record.purchaseAllowed !== false ||
    record.accountMutationAllowed !== false || record.privateLocalEvidenceOnly !== true ||
    record.fundsOrQuotaClaimAllowed !== false || record.combinedGateResolutionAllowed !== false ||
    !STABLE_ID.test(String(record.ownerAuthorizationEvidenceId))
  ) blocked('Lyria account-access standing-directive authorization does not match the packet.')
  const recordedAt = exactIso(String(record.recordedAt), 'Lyria account-access authorization time')
  if (Date.parse(recordedAt) > Date.parse(now)) {
    blocked('Lyria account-access authorization record is from the future.')
  }
  return { ownerAuthorizationEvidenceId: String(record.ownerAuthorizationEvidenceId) }
}

function safeFailureReasonClass(
  error: unknown,
  progress: {
    lastPhase: string
    credentialReadStarted: boolean
    credentialPayloadReadCount: number
    providerRequestAttemptCount: number
    providerRequestCompletedCount: number
  },
): string {
  const message = error instanceof Error ? error.message : ''
  if (message.includes('credential could not be accessed')) return 'credential_access_failed'
  if (message.includes('credential value is malformed')) return 'credential_value_validation_failed'
  if (progress.providerRequestAttemptCount > progress.providerRequestCompletedCount) {
    return 'model_metadata_read_failed'
  }
  if (message.includes('read was rejected with HTTP')) return 'model_metadata_access_rejected'
  if (message.includes('model response') || message.includes('model resource')) {
    return 'model_metadata_validation_failed'
  }
  if (message.includes('evidence does not match')) return 'post_response_authority_validation_failed'
  if (message.includes('private evidence already exists')) return 'private_evidence_persistence_failed'
  if (progress.lastPhase === 'evidence_compiled') return 'post_response_persistence_failed'
  return 'allowlisted_unclassified_failure'
}

async function readRegularBoundedFile(path: string, maximumBytes: number, label: string): Promise<Buffer> {
  let metadata
  let canonicalPath
  try {
    ;[metadata, canonicalPath] = await Promise.all([lstat(path), realpath(path)])
  } catch {
    blocked(`Lyria account-access ${label} is unavailable.`)
  }
  if (!metadata.isFile() || metadata.isSymbolicLink() || canonicalPath !== path ||
      metadata.size < 2 || metadata.size > maximumBytes) {
    blocked(`Lyria account-access ${label} is not one bounded regular file.`)
  }
  const bytes = await readFile(path)
  if (bytes.byteLength !== metadata.size || bytes.byteLength > maximumBytes) {
    blocked(`Lyria account-access ${label} changed during its bounded read.`)
  }
  return bytes
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
    // The exclusive authority-consumption record remains the terminal fact.
  }
}

function inside(root: string, relativePath: string): string {
  if (relativePath.length < 1 || relativePath.includes('\0') || relativePath.startsWith('/') ||
      relativePath.split(/[\\/]/u).includes('..')) blocked('Lyria account-access path is unsafe.')
  const path = resolve(root, relativePath)
  if (!path.startsWith(`${root}${sep}`)) blocked('Lyria account-access path escaped the repository boundary.')
  return path
}

function parseJson(bytes: Buffer, label: string): unknown {
  try {
    return JSON.parse(bytes.toString('utf8'))
  } catch {
    blocked(`Lyria account-access ${label} is malformed JSON.`)
  }
}

function object(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    blocked(`Lyria account-access ${label} is malformed.`)
  }
  return value as Record<string, unknown>
}

function exactIso(value: string, label: string): string {
  if (typeof value !== 'string' || !value.endsWith('Z') || Number.isNaN(Date.parse(value)) ||
      new Date(value).toISOString() !== value) invalid(`${label} must be canonical ISO-8601.`)
  return value
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
