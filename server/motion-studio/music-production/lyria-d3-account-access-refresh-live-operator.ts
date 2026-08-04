import { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'
import { lstat, mkdir, readFile, realpath, writeFile } from 'node:fs/promises'
import { join, resolve, sep } from 'node:path'

import { ApiError } from '../../errors/api-error'
import { sha256CanonicalJson } from '../commands/canonical-json'
import {
  MOTION_STUDIO_LYRIA_D3_ACCEPTED_EXTERNAL_READINESS_DIGEST,
  MOTION_STUDIO_LYRIA_D3_ACCEPTED_PREFLIGHT_DIGEST,
  MOTION_STUDIO_LYRIA_D3_ACCOUNT_ACCESS_API_ORIGIN,
  MOTION_STUDIO_LYRIA_D3_ACCOUNT_ACCESS_API_PATH,
  MOTION_STUDIO_LYRIA_D3_ACCOUNT_ACCESS_MAXIMUM_INTERNAL_PRODUCTION_COST_MICROS,
  MOTION_STUDIO_LYRIA_D3_ACCOUNT_ACCESS_MAXIMUM_RESPONSE_BYTES,
  createMotionStudioLyriaD3AccountAccessFixtureSecretLoader,
  createMotionStudioLyriaD3AccountAccessLiveHttpReader,
  createMotionStudioLyriaD3AccountAccessLiveSecretLoader,
  type MotionStudioLyriaD3AccountAccessHttpReader,
  type MotionStudioLyriaD3SecretValueLoader,
} from './lyria-d3-account-access'
import {
  MOTION_STUDIO_LYRIA_D3_GCLOUD_BINARY_BYTE_LENGTH,
  MOTION_STUDIO_LYRIA_D3_GCLOUD_BINARY_PATH,
  MOTION_STUDIO_LYRIA_D3_GCLOUD_BINARY_SHA256,
  MOTION_STUDIO_LYRIA_D3_GCLOUD_SDK_VERSION,
  MOTION_STUDIO_LYRIA_D3_GOOGLE_CLOUD_PROJECT_ID,
  MOTION_STUDIO_LYRIA_D3_SECRET_LOCATOR_ID,
  MOTION_STUDIO_LYRIA_D3_SECRET_VERSION,
} from './lyria-d3-readiness'

const SHA256 = /^[a-f0-9]{64}$/
const STABLE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/
const MODEL_RESOURCE_NAME = 'models/lyria-3-pro-preview' as const
const AUTHORIZATION_ID = 'MS-012D3-ACCOUNT-MODEL-ACCESS-EXT-002' as const
const PREVIOUS_AUTHORIZATION_ID = 'MS-012D3-ACCOUNT-MODEL-ACCESS-EXT-001' as const
const PACKET_RELATIVE_PATH =
  'tasks/motion-studio/MS-012D/d3-account-model-access-refresh-live-authorization-request-ext-002.json' as const
const AUTHORIZATION_RECORD_RELATIVE_PATH =
  'tasks/motion-studio/MS-012D/d3-account-model-access-refresh-live-authorization-record-ext-002.json' as const
const PREVIOUS_RESULT_RELATIVE_PATH =
  'tasks/motion-studio/MS-012D/d3-account-model-access-live-result-ext-001.json' as const
const PRIVATE_INGEST_LINEAGE_RELATIVE_PATH =
  'tasks/motion-studio/MS-012D/d3-private-ingest-lineage-reconciliation.json' as const
const PRIVATE_RUN_ROOT_RELATIVE_PATH =
  '.reeditpro-local-storage-ms012d3-account-model-access-ext-002' as const
const CONSUMPTION_RECORD_FILENAME = 'authority-consumed.json' as const
const EVIDENCE_FILENAME = 'private-account-model-access-evidence.json' as const
const FAILURE_FILENAME = 'terminal-failure.json' as const
const REQUEST_TIMEOUT_MILLISECONDS = 15_000
const MAXIMUM_PACKET_BYTES = 128 * 1024
const MAXIMUM_AUTHORIZATION_RECORD_BYTES = 32 * 1024
const MAXIMUM_SOURCE_RECORD_BYTES = 64 * 1024
const MAXIMUM_RUNTIME_FILE_BYTES = 2 * 1024 * 1024
const MAXIMUM_SECRET_BYTES = 8_192
const OWNER_STANDING_DIRECTIVE_ID = 'MS-OWNER-STANDING-IMPLEMENTATION-QA-20260718' as const
const OWNER_AUTHORIZATION_EVIDENCE_ID = 'owner-standing-storytelling-self-qa-20260718' as const
const OWNER_STANDING_DIRECTIVE_SHA256 =
  'b933153875768280382d9e9aecd1d904c4300518426bbe6ae52496c8ea0fff68' as const
const OWNER_AUTHORIZATION_STATEMENT_SHA256 =
  'cb26b67e69b5dde409462abaeeb34b1838c1561d58751314a8e78df1c39b672b' as const
const ACCEPTED_PRIVATE_INGEST_LINEAGE_FILE_SHA256 =
  '2f8ae5c0a84ed04e902a3f26d56f207ae492408d14c627e90aed025fb0e2da04' as const
const ACCEPTED_PRIVATE_INGEST_LINEAGE_RECORD_DIGEST =
  'ba6c7052da664f0e1674d76b6c9bc4e6fdff0d21a974044571d562a33edc9847' as const
const REVIEWED_RUNTIME_RELATIVE_PATHS = Object.freeze([
  'server/motion-studio/music-production/lyria-d3-account-access.ts',
  'server/motion-studio/music-production/lyria-d3-readiness.ts',
  'server/motion-studio/music-production/lyria-d3-account-access-refresh-live-operator.ts',
  'server/motion-studio/music-production/lyria-d3-account-access-refresh-live-cli.ts',
] as const)

export const MOTION_STUDIO_LYRIA_D3_ACCOUNT_ACCESS_REFRESH_AUTHORIZATION_ID =
  AUTHORIZATION_ID

export const MOTION_STUDIO_LYRIA_D3_ACCOUNT_ACCESS_REFRESH_LIVE_OPERATOR_PATHS =
  Object.freeze({
    packetRelativePath: PACKET_RELATIVE_PATH,
    authorizationRecordRelativePath: AUTHORIZATION_RECORD_RELATIVE_PATH,
    previousResultRelativePath: PREVIOUS_RESULT_RELATIVE_PATH,
    privateIngestLineageRelativePath: PRIVATE_INGEST_LINEAGE_RELATIVE_PATH,
    privateRunRootRelativePath: PRIVATE_RUN_ROOT_RELATIVE_PATH,
    consumptionRecordFilename: CONSUMPTION_RECORD_FILENAME,
    evidenceFilename: EVIDENCE_FILENAME,
    failureFilename: FAILURE_FILENAME,
  })

export interface MotionStudioLyriaD3AccountAccessRefreshLiveOperatorResultV2 {
  schemaVersion: 'motion-studio.lyria-d3-account-model-access-refresh-live-operator-result.v2'
  state: 'private_account_model_access_refresh_evidence_ready'
  evidenceClass: 'authenticated_provider_read_only' | 'private_local_fixture'
  authorizationId: typeof AUTHORIZATION_ID
  authorityPacketDigest: string
  ownerAuthorizationEvidenceId: string
  previousAuthorizationId: typeof PREVIOUS_AUTHORIZATION_ID
  previousResultDigest: string
  historyPreserved: true
  sourcePreflightDigest: typeof MOTION_STUDIO_LYRIA_D3_ACCEPTED_PREFLIGHT_DIGEST
  sourceExternalReadinessDigest: typeof MOTION_STUDIO_LYRIA_D3_ACCEPTED_EXTERNAL_READINESS_DIGEST
  sourcePrivateIngestLineageDigest: typeof ACCEPTED_PRIVATE_INGEST_LINEAGE_RECORD_DIGEST
  runAuthorityDigest: string
  evidenceDigest: string
  providerAccountAccessVerified: true
  exactModelResourceVisible: true
  providerFundsOrQuotaVerified: false
  providerAccountAccessAndFundsGateResolved: false
  providerGenerationEligibilityVerified: false
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

type SafeProgress = {
  lastPhase: 'authority_consumed' | 'credential_read_started' | 'credential_read_completed' |
    'provider_request_started' | 'provider_request_completed' | 'evidence_compiled'
  credentialReadStarted: boolean
  credentialPayloadReadCount: 0 | 1
  providerRequestAttemptCount: 0 | 1
  providerRequestCompletedCount: 0 | 1
}

export async function executeMotionStudioLyriaD3AccountAccessRefreshLiveOperator(input: {
  repositoryRoot: string
  now: string
}): Promise<MotionStudioLyriaD3AccountAccessRefreshLiveOperatorResultV2> {
  return executeOperator({ mode: 'live', ...input })
}

/** Fixture-only proof. It cannot emit authenticated-provider evidence. */
export async function executeMotionStudioLyriaD3AccountAccessRefreshAuthorizedFixtureOperator(
  input: FixtureInput,
): Promise<MotionStudioLyriaD3AccountAccessRefreshLiveOperatorResultV2> {
  return executeOperator({ mode: 'fixture', ...input })
}

async function executeOperator(input: ({
  mode: 'live'
  repositoryRoot: string
  now: string
} | ({ mode: 'fixture' } & FixtureInput))):
Promise<MotionStudioLyriaD3AccountAccessRefreshLiveOperatorResultV2> {
  const now = exactIso(input.now, 'Lyria refreshed account-access operator time')
  const repositoryRoot = await realpath(input.repositoryRoot)

  const packetBytes = await readRegularBoundedFile(
    inside(repositoryRoot, PACKET_RELATIVE_PATH),
    MAXIMUM_PACKET_BYTES,
    'refreshed authority packet',
  )
  const packetDigest = sha256Bytes(packetBytes)
  const packet = validatePacket(parseJson(packetBytes, 'refreshed authority packet'), packetDigest)
  await verifyReviewedRuntimeFiles(repositoryRoot, packet.reviewedRuntimeFiles)

  const authorizationRecordBytes = await readRegularBoundedFile(
    inside(repositoryRoot, AUTHORIZATION_RECORD_RELATIVE_PATH),
    MAXIMUM_AUTHORIZATION_RECORD_BYTES,
    'refreshed standing-directive authorization record',
  )
  const authorizationRecord = validateAuthorizationRecord(
    parseJson(authorizationRecordBytes, 'refreshed standing-directive authorization record'),
    packetDigest,
    now,
  )
  const authorizationRecordDigest = sha256Bytes(authorizationRecordBytes)

  const previousResultBytes = await readRegularBoundedFile(
    inside(repositoryRoot, PREVIOUS_RESULT_RELATIVE_PATH),
    MAXIMUM_SOURCE_RECORD_BYTES,
    'immutable EXT-001 result',
  )
  if (sha256Bytes(previousResultBytes) !== packet.previousResultSha256) {
    blocked('Lyria refreshed account-access EXT-001 history changed after review.')
  }
  validatePreviousResult(parseJson(previousResultBytes, 'immutable EXT-001 result'))

  const lineageBytes = await readRegularBoundedFile(
    inside(repositoryRoot, PRIVATE_INGEST_LINEAGE_RELATIVE_PATH),
    MAXIMUM_SOURCE_RECORD_BYTES,
    'private-ingest lineage reconciliation record',
  )
  if (sha256Bytes(lineageBytes) !== ACCEPTED_PRIVATE_INGEST_LINEAGE_FILE_SHA256) {
    blocked('Lyria refreshed account-access private-ingest lineage file changed after review.')
  }
  validatePrivateIngestLineage(parseJson(lineageBytes, 'private-ingest lineage reconciliation record'))

  const runAuthorityBase = {
    schemaVersion: 'motion-studio.lyria-d3-account-model-access-refresh-run-authority.v2' as const,
    authorizationId: AUTHORIZATION_ID,
    authorityPacketDigest: packetDigest,
    authorizationRecordDigest,
    ownerAuthorizationEvidenceId: authorizationRecord.ownerAuthorizationEvidenceId,
    previousAuthorizationId: PREVIOUS_AUTHORIZATION_ID,
    previousResultDigest: packet.previousResultSha256,
    replacementPolicy: 'new_single_use_run_preserving_immutable_ext_001_history' as const,
    sourcePreflightDigest: MOTION_STUDIO_LYRIA_D3_ACCEPTED_PREFLIGHT_DIGEST,
    sourceExternalReadinessDigest: MOTION_STUDIO_LYRIA_D3_ACCEPTED_EXTERNAL_READINESS_DIGEST,
    sourcePrivateIngestLineageDigest: ACCEPTED_PRIVATE_INGEST_LINEAGE_RECORD_DIGEST,
    secretLocatorId: MOTION_STUDIO_LYRIA_D3_SECRET_LOCATOR_ID,
    secretVersionReference: MOTION_STUDIO_LYRIA_D3_SECRET_VERSION,
    modelResourceName: MODEL_RESOURCE_NAME,
    apiOrigin: MOTION_STUDIO_LYRIA_D3_ACCOUNT_ACCESS_API_ORIGIN,
    requestPath: MOTION_STUDIO_LYRIA_D3_ACCOUNT_ACCESS_API_PATH,
    method: 'GET' as const,
    maximumSecretPayloadReads: 1 as const,
    maximumNetworkRequests: 1 as const,
    maximumDnsLookups: 1 as const,
    maximumAddressConnectionAttempts: 1 as const,
    maximumRedirects: 0 as const,
    maximumRetries: 0 as const,
    maximumFallbacks: 0 as const,
    maximumCapturedResponseBytes:
      MOTION_STUDIO_LYRIA_D3_ACCOUNT_ACCESS_MAXIMUM_RESPONSE_BYTES,
    maximumInternalProductionCostMicros:
      MOTION_STUDIO_LYRIA_D3_ACCOUNT_ACCESS_MAXIMUM_INTERNAL_PRODUCTION_COST_MICROS,
    providerGenerationAllowed: false as const,
    purchaseAllowed: false as const,
    accountMutationAllowed: false as const,
    rawProviderResponsePersistenceAllowed: false as const,
    privateLocalEvidenceOnly: true as const,
    issuedAt: now,
    immutable: true as const,
  }
  const runAuthority = Object.freeze({
    ...runAuthorityBase,
    authorityDigest: sha256CanonicalJson(runAuthorityBase),
  })

  const runRoot = inside(repositoryRoot, PRIVATE_RUN_ROOT_RELATIVE_PATH)
  await createPrivateRunRoot(runRoot)
  const progress: SafeProgress = {
    lastPhase: 'authority_consumed',
    credentialReadStarted: false,
    credentialPayloadReadCount: 0,
    providerRequestAttemptCount: 0,
    providerRequestCompletedCount: 0,
  }

  await writePrivateJsonExclusive(join(runRoot, CONSUMPTION_RECORD_FILENAME), {
    schemaVersion: 'motion-studio.lyria-d3-account-model-access-refresh-authority-consumption.v2',
    state: 'new_single_use_authority_consumed_before_credential_read',
    authorizationId: AUTHORIZATION_ID,
    authorityPacketDigest: packetDigest,
    authorizationRecordDigest,
    ownerAuthorizationEvidenceId: authorizationRecord.ownerAuthorizationEvidenceId,
    previousAuthorizationId: PREVIOUS_AUTHORIZATION_ID,
    previousResultDigest: packet.previousResultSha256,
    historyPreserved: true,
    sourcePreflightDigest: MOTION_STUDIO_LYRIA_D3_ACCEPTED_PREFLIGHT_DIGEST,
    sourceExternalReadinessDigest: MOTION_STUDIO_LYRIA_D3_ACCEPTED_EXTERNAL_READINESS_DIGEST,
    sourcePrivateIngestLineageDigest: ACCEPTED_PRIVATE_INGEST_LINEAGE_RECORD_DIGEST,
    runAuthorityDigest: runAuthority.authorityDigest,
    credentialPayloadReadCountAtConsumption: 0,
    providerRequestCountAtConsumption: 0,
    consumedAt: now,
    immutable: true,
  }, 'Lyria refreshed account-access authority is already consumed.')

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

  try {
    const modelEvidence = await readModelEvidence({ secretLoader, httpReader, progress })
    progress.lastPhase = 'evidence_compiled'
    const evidenceBase = {
      schemaVersion: 'motion-studio.lyria-d3-account-model-access-refresh-evidence.v2' as const,
      state: 'provider_model_access_verified_funds_and_quota_unverified' as const,
      evidenceClass: input.mode === 'live'
        ? 'authenticated_provider_read_only' as const
        : 'private_local_fixture' as const,
      authorizationId: AUTHORIZATION_ID,
      authorityPacketDigest: packetDigest,
      authorizationRecordDigest,
      ownerAuthorizationEvidenceId: authorizationRecord.ownerAuthorizationEvidenceId,
      previousAuthorizationId: PREVIOUS_AUTHORIZATION_ID,
      previousResultDigest: packet.previousResultSha256,
      previousResultState: 'consumed_terminal_model_metadata_read_failed_no_retry' as const,
      replacementPolicy: 'new_single_use_run_preserving_immutable_ext_001_history' as const,
      historyPreserved: true as const,
      sourcePreflightDigest: MOTION_STUDIO_LYRIA_D3_ACCEPTED_PREFLIGHT_DIGEST,
      sourceExternalReadinessDigest: MOTION_STUDIO_LYRIA_D3_ACCEPTED_EXTERNAL_READINESS_DIGEST,
      sourcePrivateIngestLineageDigest: ACCEPTED_PRIVATE_INGEST_LINEAGE_RECORD_DIGEST,
      runAuthorityDigest: runAuthority.authorityDigest,
      credentialSource: input.mode === 'live'
        ? 'google_secret_manager' as const
        : 'private_local_fixture' as const,
      credentialValueRead: true as const,
      credentialValuePersisted: false as const,
      providerRequestCount: 1 as const,
      dnsLookupCount: 1 as const,
      addressConnectionAttemptCount: 1 as const,
      requestBodySent: false as const,
      providerGenerationCallMade: false as const,
      purchasePerformed: false as const,
      accountMutationPerformed: false as const,
      automaticRetryPerformed: false as const,
      automaticFallbackPerformed: false as const,
      rawProviderResponsePersisted: false as const,
      model: modelEvidence,
      accountCredentialAccepted: true as const,
      exactModelResourceVisible: true as const,
      providerAccountAccessVerified: true as const,
      providerFundsOrQuotaVerified: false as const,
      providerAccountAccessAndFundsGateResolved: false as const,
      providerGenerationEligibilityVerified: false as const,
      internalProductionCostMicros: 0 as const,
      maximumAuthorizedInternalProductionCostMicros:
        MOTION_STUDIO_LYRIA_D3_ACCOUNT_ACCESS_MAXIMUM_INTERNAL_PRODUCTION_COST_MICROS,
      customerPriceIncluded: false as const,
      customerCreditsIncluded: false as const,
      serviceFeeIncluded: false as const,
      billingMutationPerformed: false as const,
      capturedAt: now,
      immutable: true as const,
    }
    const evidence = Object.freeze({
      ...evidenceBase,
      evidenceDigest: sha256CanonicalJson(evidenceBase),
    })
    await writePrivateJsonExclusive(
      join(runRoot, EVIDENCE_FILENAME),
      evidence,
      'Lyria refreshed account-access private evidence already exists.',
    )
    return Object.freeze({
      schemaVersion:
        'motion-studio.lyria-d3-account-model-access-refresh-live-operator-result.v2' as const,
      state: 'private_account_model_access_refresh_evidence_ready' as const,
      evidenceClass: evidence.evidenceClass,
      authorizationId: AUTHORIZATION_ID,
      authorityPacketDigest: packetDigest,
      ownerAuthorizationEvidenceId: authorizationRecord.ownerAuthorizationEvidenceId,
      previousAuthorizationId: PREVIOUS_AUTHORIZATION_ID,
      previousResultDigest: packet.previousResultSha256,
      historyPreserved: true as const,
      sourcePreflightDigest: MOTION_STUDIO_LYRIA_D3_ACCEPTED_PREFLIGHT_DIGEST,
      sourceExternalReadinessDigest: MOTION_STUDIO_LYRIA_D3_ACCEPTED_EXTERNAL_READINESS_DIGEST,
      sourcePrivateIngestLineageDigest: ACCEPTED_PRIVATE_INGEST_LINEAGE_RECORD_DIGEST,
      runAuthorityDigest: runAuthority.authorityDigest,
      evidenceDigest: evidence.evidenceDigest,
      providerAccountAccessVerified: true as const,
      exactModelResourceVisible: true as const,
      providerFundsOrQuotaVerified: false as const,
      providerAccountAccessAndFundsGateResolved: false as const,
      providerGenerationEligibilityVerified: false as const,
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
    await writePrivateJsonBestEffort(join(runRoot, FAILURE_FILENAME), {
      schemaVersion: 'motion-studio.lyria-d3-account-model-access-refresh-terminal-failure.v2',
      state: 'new_authority_consumed_terminal_no_retry',
      authorizationId: AUTHORIZATION_ID,
      authorityPacketDigest: packetDigest,
      ownerAuthorizationEvidenceId: authorizationRecord.ownerAuthorizationEvidenceId,
      previousAuthorizationId: PREVIOUS_AUTHORIZATION_ID,
      previousResultDigest: packet.previousResultSha256,
      historyPreserved: true,
      sourcePreflightDigest: MOTION_STUDIO_LYRIA_D3_ACCEPTED_PREFLIGHT_DIGEST,
      sourceExternalReadinessDigest: MOTION_STUDIO_LYRIA_D3_ACCEPTED_EXTERNAL_READINESS_DIGEST,
      sourcePrivateIngestLineageDigest: ACCEPTED_PRIVATE_INGEST_LINEAGE_RECORD_DIGEST,
      runAuthorityDigest: runAuthority.authorityDigest,
      failureCode: error instanceof ApiError ? error.code : 'INTERNAL_ERROR',
      failureReasonClass: safeFailureReasonClass(error, progress),
      safeProgress: progress,
      credentialAndRequestOutcome: 'not_retried_after_new_authority_consumption',
      failedAt: now,
      immutable: true,
    })
    throw error
  }
}

async function readModelEvidence(input: {
  secretLoader: MotionStudioLyriaD3SecretValueLoader
  httpReader: MotionStudioLyriaD3AccountAccessHttpReader
  progress: SafeProgress
}): Promise<{
  name: typeof MODEL_RESOURCE_NAME
  baseModelId: string | null
  version: string | null
  displayName: string | null
  supportedGenerationMethods: readonly string[]
  responseBodyByteLength: number
  responseBodyDigest: string
  safeRequestIdDigest?: string
  modelMetadataDigest: string
}> {
  input.progress.lastPhase = 'credential_read_started'
  input.progress.credentialReadStarted = true
  let rawSecret: Buffer | Uint8Array | string
  try {
    rawSecret = await input.secretLoader.access({
      secretLocatorId: MOTION_STUDIO_LYRIA_D3_SECRET_LOCATOR_ID,
      secretVersionReference: MOTION_STUDIO_LYRIA_D3_SECRET_VERSION,
    })
  } catch {
    blocked('The pinned Lyria refreshed account-access credential could not be accessed.')
  }
  const apiKey = validateSecretValue(rawSecret)
  input.progress.lastPhase = 'credential_read_completed'
  input.progress.credentialPayloadReadCount = 1
  input.progress.lastPhase = 'provider_request_started'
  input.progress.providerRequestAttemptCount = 1
  let response
  try {
    response = await input.httpReader.read({
      url: MOTION_STUDIO_LYRIA_D3_ACCOUNT_ACCESS_API_ORIGIN,
      path: MOTION_STUDIO_LYRIA_D3_ACCOUNT_ACCESS_API_PATH,
      method: 'GET',
      headers: Object.freeze({ accept: 'application/json', 'x-goog-api-key': apiKey }),
      body: undefined,
      timeoutMilliseconds: REQUEST_TIMEOUT_MILLISECONDS,
    })
  } catch {
    blocked('The exact Lyria refreshed model-metadata read could not be completed.')
  }
  input.progress.lastPhase = 'provider_request_completed'
  input.progress.providerRequestCompletedCount = 1
  if (response.dnsLookupCount !== 1 || response.addressConnectionAttemptCount !== 1) {
    blocked('The Lyria refreshed model-metadata read exceeded its single-address authority.')
  }
  if (!Buffer.isBuffer(response.body) || response.body.byteLength < 2 ||
      response.body.byteLength > MOTION_STUDIO_LYRIA_D3_ACCOUNT_ACCESS_MAXIMUM_RESPONSE_BYTES) {
    blocked('The Lyria refreshed model response exceeded its bounded capture authority.')
  }
  if (!Number.isInteger(response.statusCode) || response.statusCode !== 200) {
    blocked(`The Lyria refreshed model-metadata read was rejected with HTTP ${response.statusCode}.`)
  }
  const contentType = header(response.headers, 'content-type')
  if (!contentType?.toLowerCase().startsWith('application/json')) {
    blocked('The Lyria refreshed model response did not use the required JSON content type.')
  }
  const parsed = parseJson(response.body, 'refreshed model response')
  const model = object(parsed, 'refreshed model response')
  if (model.name !== MODEL_RESOURCE_NAME) {
    blocked('The refreshed provider response did not expose the exact Lyria model resource.')
  }
  const supportedGenerationMethods = safeStringArray(
    model.supportedGenerationMethods,
    'supported generation methods',
    32,
    120,
  )
  if (supportedGenerationMethods.length < 1) {
    blocked('The refreshed Lyria model response has no bounded generation-method metadata.')
  }
  const responseBodyDigest = sha256Bytes(response.body)
  const requestId = header(response.headers, 'x-goog-request-id') ??
    header(response.headers, 'x-request-id')
  const metadataBase = {
    name: MODEL_RESOURCE_NAME,
    baseModelId: optionalSafeText(model.baseModelId, 'base model ID', 240),
    version: optionalSafeText(model.version, 'model version', 240),
    displayName: optionalSafeText(model.displayName, 'model display name', 240),
    supportedGenerationMethods,
    responseBodyByteLength: response.body.byteLength,
    responseBodyDigest,
    ...(requestId ? { safeRequestIdDigest: sha256Text(requestId) } : {}),
  }
  return Object.freeze({
    ...metadataBase,
    modelMetadataDigest: sha256CanonicalJson(metadataBase),
  })
}

function validatePacket(value: unknown, packetDigest: string): {
  previousResultSha256: string
  reviewedRuntimeFiles: readonly { relativePath: string; byteLength: number; sha256: string }[]
} {
  const packet = object(value, 'refreshed authority packet')
  const history = object(packet.previousRunHistory, 'previous-run history')
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
    packet.schemaVersion !==
      'motion-studio.lyria-d3-account-model-access-refresh-live-authorization.v2' ||
    packet.authorizationId !== AUTHORIZATION_ID ||
    packet.status !== 'standing_directive_authorization_ready_not_executed' ||
    packet.singleUse !== true || packet.newRunReason !== 'refreshed_google_authentication' ||
    packet.retryOfPreviousAuthority !== false ||
    history.authorizationId !== PREVIOUS_AUTHORIZATION_ID ||
    history.resultRelativePath !== PREVIOUS_RESULT_RELATIVE_PATH ||
    history.resultState !== 'consumed_terminal_model_metadata_read_failed_no_retry' ||
    history.mustRemainImmutable !== true || history.overwriteAllowed !== false ||
    !SHA256.test(String(history.resultSha256)) ||
    source.preflightDigest !== MOTION_STUDIO_LYRIA_D3_ACCEPTED_PREFLIGHT_DIGEST ||
    source.externalReadinessDigest !== MOTION_STUDIO_LYRIA_D3_ACCEPTED_EXTERNAL_READINESS_DIGEST ||
    source.privateIngestLineageRelativePath !== PRIVATE_INGEST_LINEAGE_RELATIVE_PATH ||
    source.privateIngestLineageFileSha256 !== ACCEPTED_PRIVATE_INGEST_LINEAGE_FILE_SHA256 ||
    source.privateIngestLineageRecordDigest !== ACCEPTED_PRIVATE_INGEST_LINEAGE_RECORD_DIGEST ||
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
    authority.schemaVersion !==
      'motion-studio.lyria-d3-account-model-access-refresh-run-authority.v2' ||
    authority.singleUseBeforeCredentialRead !== true ||
    authority.copiedOrMismatchedAuthorityRejected !== true ||
    authority.previousAuthorityHistoryRequired !== true ||
    operator.command !==
      './node_modules/.bin/tsx server/motion-studio/music-production/lyria-d3-account-access-refresh-live-cli.ts' ||
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
  ) blocked('Lyria refreshed account-access authority packet failed its exact runtime contract.')
  return {
    previousResultSha256: String(history.resultSha256),
    reviewedRuntimeFiles,
  }
}

function parseReviewedRuntimeFiles(value: unknown): readonly {
  relativePath: string
  byteLength: number
  sha256: string
}[] {
  if (!Array.isArray(value) || value.length !== REVIEWED_RUNTIME_RELATIVE_PATHS.length) {
    blocked('Lyria refreshed account-access packet has an invalid reviewed-runtime file set.')
  }
  return Object.freeze(value.map((entry, index) => {
    const file = object(entry, `reviewed runtime file ${index + 1}`)
    const relativePath = String(file.relativePath)
    const byteLength = Number(file.byteLength)
    const sha256 = String(file.sha256)
    if (
      relativePath !== REVIEWED_RUNTIME_RELATIVE_PATHS[index] ||
      !Number.isSafeInteger(byteLength) || byteLength < 2 ||
      byteLength > MAXIMUM_RUNTIME_FILE_BYTES || !SHA256.test(sha256)
    ) blocked('Lyria refreshed account-access reviewed-runtime identity is malformed.')
    return Object.freeze({ relativePath, byteLength, sha256 })
  }))
}

async function verifyReviewedRuntimeFiles(
  repositoryRoot: string,
  files: readonly { relativePath: string; byteLength: number; sha256: string }[],
): Promise<void> {
  for (const file of files) {
    const bytes = await readRegularBoundedFile(
      inside(repositoryRoot, file.relativePath),
      MAXIMUM_RUNTIME_FILE_BYTES,
      `reviewed runtime file ${file.relativePath}`,
    )
    if (bytes.byteLength !== file.byteLength || sha256Bytes(bytes) !== file.sha256) {
      blocked('Lyria refreshed account-access reviewed runtime changed after authority review.')
    }
  }
}

function validateAuthorizationRecord(value: unknown, packetDigest: string, now: string): {
  ownerAuthorizationEvidenceId: string
} {
  const record = object(value, 'refreshed standing-directive authorization record')
  if (
    record.schemaVersion !==
      'motion-studio.lyria-d3-account-model-access-refresh-live-authorization-record.v2' ||
    record.status !== 'standing_directive_authorized_unconsumed' ||
    record.authorizationId !== AUTHORIZATION_ID || record.authorityPacketDigest !== packetDigest ||
    record.singleUse !== true || record.newRunNotRetryOfExt001 !== true ||
    record.preserveExt001History !== true ||
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
  ) blocked('Lyria refreshed account-access standing-directive authorization does not match the packet.')
  const recordedAt = exactIso(String(record.recordedAt), 'Lyria refreshed account-access authorization time')
  if (Date.parse(recordedAt) > Date.parse(now)) {
    blocked('Lyria refreshed account-access authorization record is from the future.')
  }
  return { ownerAuthorizationEvidenceId: String(record.ownerAuthorizationEvidenceId) }
}

function validatePreviousResult(value: unknown): void {
  const result = object(value, 'immutable EXT-001 result')
  const history = object(result.historyPolicy, 'EXT-001 history policy')
  if (
    result.schemaVersion !== 'motion-studio.lyria-d3-account-model-access-live-result.v1' ||
    result.status !== 'consumed_terminal_model_metadata_read_failed_no_retry' ||
    result.authorizationId !== PREVIOUS_AUTHORIZATION_ID || result.immutable !== true ||
    history.immutable !== true || history.retryUnderSameAuthorityAllowed !== false ||
    history.replacementAuthorityMayOverwriteHistory !== false
  ) blocked('Lyria refreshed account-access EXT-001 history lost its terminal immutable contract.')
}

function validatePrivateIngestLineage(value: unknown): void {
  const record = object(value, 'private-ingest lineage record')
  const { recordDigest, ...base } = record
  if (
    record.schemaVersion !== 'motion-studio.lyria-d3-private-ingest-lineage-reconciliation.v1' ||
    record.status !== 'canonical_lineage_reconciled_execution_still_blocked' ||
    record.sourcePreflightDigest !== MOTION_STUDIO_LYRIA_D3_ACCEPTED_PREFLIGHT_DIGEST ||
    record.sourceExternalReadinessDigest !==
      MOTION_STUDIO_LYRIA_D3_ACCEPTED_EXTERNAL_READINESS_DIGEST ||
    record.providerRequestCount !== 0 || record.providerCandidateCreated !== false ||
    record.providerExecutionAllowed !== false || record.immutable !== true ||
    recordDigest !== ACCEPTED_PRIVATE_INGEST_LINEAGE_RECORD_DIGEST ||
    sha256CanonicalJson(base) !== recordDigest
  ) blocked('Lyria refreshed account-access private-ingest lineage failed its exact contract.')
}

function validateSecretValue(value: Buffer | Uint8Array | string): string {
  const bytes = typeof value === 'string' ? Buffer.from(value) : Buffer.from(value)
  if (bytes.byteLength < 8 || bytes.byteLength > MAXIMUM_SECRET_BYTES) {
    blocked('The pinned Lyria refreshed account-access credential value is malformed.')
  }
  const text = bytes.toString('utf8').trim()
  if (text.length < 8 || Buffer.byteLength(text) > MAXIMUM_SECRET_BYTES ||
      containsControlCharacter(text) || containsWhitespace(text)) {
    blocked('The pinned Lyria refreshed account-access credential value is malformed.')
  }
  return text
}

function optionalSafeText(value: unknown, label: string, maximumLength: number): string | null {
  if (value === undefined || value === null) return null
  if (typeof value !== 'string' || value.length < 1 || value.length > maximumLength ||
      containsControlCharacter(value)) blocked(`Lyria refreshed ${label} is malformed.`)
  return value
}

function safeStringArray(
  value: unknown,
  label: string,
  maximumItems: number,
  maximumItemLength: number,
): readonly string[] {
  if (!Array.isArray(value) || value.length > maximumItems) {
    blocked(`Lyria refreshed ${label} is malformed.`)
  }
  const output = value.map((item) => {
    if (typeof item !== 'string' || item.length < 1 || item.length > maximumItemLength ||
        containsControlCharacter(item)) blocked(`Lyria refreshed ${label} is malformed.`)
    return item
  })
  if (new Set(output).size !== output.length) blocked(`Lyria refreshed ${label} contains duplicates.`)
  return Object.freeze(output)
}

function header(headers: Readonly<Record<string, string>>, name: string): string | undefined {
  const entry = Object.entries(headers).find(([key]) => key.toLowerCase() === name)
  const value = entry?.[1]
  if (value === undefined) return undefined
  if (typeof value !== 'string' || value.length > 8_192 || containsControlCharacter(value)) {
    blocked('The Lyria refreshed model response included malformed headers.')
  }
  return value
}

function containsControlCharacter(value: string): boolean {
  for (const character of value) {
    const codePoint = character.codePointAt(0)
    if (codePoint !== undefined && (codePoint <= 31 || codePoint === 127)) return true
  }
  return false
}

function containsWhitespace(value: string): boolean {
  return Array.from(value).some((character) => character.trim().length === 0)
}

function safeFailureReasonClass(error: unknown, progress: SafeProgress): string {
  const message = error instanceof Error ? error.message : ''
  if (message.includes('credential could not be accessed')) return 'credential_access_failed'
  if (message.includes('credential value is malformed')) return 'credential_value_validation_failed'
  if (progress.providerRequestAttemptCount > progress.providerRequestCompletedCount) {
    return 'model_metadata_read_failed'
  }
  if (message.includes('rejected with HTTP')) return 'model_metadata_access_rejected'
  if (message.includes('model response') || message.includes('model resource')) {
    return 'model_metadata_validation_failed'
  }
  if (message.includes('private evidence already exists')) return 'private_evidence_persistence_failed'
  if (progress.lastPhase === 'evidence_compiled') return 'post_response_persistence_failed'
  return 'allowlisted_unclassified_failure'
}

async function createPrivateRunRoot(path: string): Promise<void> {
  try {
    await mkdir(path, { mode: 0o700 })
  } catch {
    blocked('Lyria refreshed account-access private run already exists or cannot be created.')
  }
  const [metadata, canonicalPath] = await Promise.all([lstat(path), realpath(path)])
  if (!metadata.isDirectory() || metadata.isSymbolicLink() || canonicalPath !== path) {
    blocked('Lyria refreshed account-access private run root is unsafe.')
  }
}

async function readRegularBoundedFile(
  path: string,
  maximumBytes: number,
  label: string,
): Promise<Buffer> {
  let metadata
  let canonicalPath
  try {
    ;[metadata, canonicalPath] = await Promise.all([lstat(path), realpath(path)])
  } catch {
    blocked(`Lyria refreshed account-access ${label} is unavailable.`)
  }
  if (!metadata.isFile() || metadata.isSymbolicLink() || canonicalPath !== path ||
      metadata.size < 2 || metadata.size > maximumBytes) {
    blocked(`Lyria refreshed account-access ${label} is not one bounded regular file.`)
  }
  const bytes = await readFile(path)
  if (bytes.byteLength !== metadata.size || bytes.byteLength > maximumBytes) {
    blocked(`Lyria refreshed account-access ${label} changed during its bounded read.`)
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
      relativePath.split(/[\\/]/u).includes('..')) blocked('Lyria refreshed account-access path is unsafe.')
  const path = resolve(root, relativePath)
  if (!path.startsWith(`${root}${sep}`)) {
    blocked('Lyria refreshed account-access path escaped the repository boundary.')
  }
  return path
}

function parseJson(bytes: Buffer, label: string): unknown {
  try {
    return JSON.parse(bytes.toString('utf8'))
  } catch {
    blocked(`Lyria refreshed account-access ${label} is malformed JSON.`)
  }
}

function object(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    blocked(`Lyria refreshed account-access ${label} is malformed.`)
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

function sha256Text(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function invalid(message: string): never {
  throw new ApiError('VALIDATION_FAILED', message, 400)
}

function blocked(message: string): never {
  throw new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', message, 409)
}
