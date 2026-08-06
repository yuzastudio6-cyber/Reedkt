import { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'
import { lstat, mkdir, readFile, realpath, writeFile } from 'node:fs/promises'
import { join, resolve, sep } from 'node:path'

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
  createMotionStudioSpeechFixtureGoogleSecretManagerValueLoader,
  createMotionStudioSpeechGoogleSecretManagerValueLoader,
  createMotionStudioSpeechSecretBinding,
  type MotionStudioSpeechGoogleSecretManagerFixtureLoaderOptions,
} from './live-credential'
import {
  MOTION_STUDIO_SPEECH_ACCOUNT_PREFLIGHT_EXTERNAL_AUTHORIZATION_ID,
  createMotionStudioSpeechAccountPreflightAuthorizedFixtureTransport,
  createMotionStudioSpeechAccountPreflightExternalAuthority,
  createMotionStudioSpeechAccountPreflightLiveTransport,
  createMotionStudioSpeechAccountPreflightPlan,
  type MotionStudioSpeechAccountPreflightSafeProgressEventV1,
} from './account-preflight'
import {
  createMotionStudioSpeechVoiceBindingFromCatalogSelection,
  createMotionStudioSpeechVoiceCatalogSelection,
} from './voice-catalog-binding'
import { loadMotionStudioSpeechVoiceCatalogPrivateAcceptanceEvidence } from './voice-catalog-discovery'

const SHA256 = /^[a-f0-9]{64}$/
const STABLE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/
const PACKET_RELATIVE_PATH =
  'tasks/motion-studio/MS-012C/c2-account-preflight-live-authorization-request-ext-002.json' as const
const AUTHORIZATION_RECORD_RELATIVE_PATH =
  'tasks/motion-studio/MS-012C/c2-account-preflight-live-authorization-record-ext-002.json' as const
const DECISION_RELATIVE_PATH =
  'tasks/motion-studio/MS-012C/c2-private-acceptance-voice-selection-decision.json' as const
const PRIVATE_RUN_ROOT_RELATIVE_PATH =
  '.reeditpro-local-storage-ms012c2-account-preflight-ext-002' as const
const CONSUMPTION_RECORD_FILENAME = 'authority-consumed.json' as const
const EVIDENCE_FILENAME = 'private-account-preflight-evidence.json' as const
const FAILURE_FILENAME = 'terminal-failure.json' as const
const EXT_001_RESULT_RELATIVE_PATH =
  'tasks/motion-studio/MS-012C/c2-account-preflight-live-result-ext-001.json' as const
const EXT_001_RESULT_SHA256 =
  'e792d34908533a70bf26b26bdcd1152c53ecddbddc6fa9e50ba1ee73b9dbdab3' as const
const EXT_001_PRIVATE_ROOT_RELATIVE_PATH =
  '.reeditpro-local-storage-ms012c2-account-preflight-ext-001' as const
const EXT_001_PRIVATE_FILES = Object.freeze([
  Object.freeze({
    filename: 'authority-consumed.json',
    byteLength: 1196,
    sha256: 'd6175b9824f3b762a3083b3e1645aa4c08cd1a7d89f5da57776bd79689466e3e',
  }),
  Object.freeze({
    filename: 'terminal-failure.json',
    byteLength: 820,
    sha256: '8ec8f2166067930fb5dc9c69903a7af65cef5222b06264f81d35e361afb633d1',
  }),
] as const)
const MAX_PACKET_BYTES = 128 * 1024
const MAX_AUTHORIZATION_RECORD_BYTES = 32 * 1024
const MAX_DECISION_BYTES = 16 * 1024
const MAXIMUM_RESPONSE_BYTES_PER_REQUEST = 524_288
const MAXIMUM_CAPTURED_RESPONSE_BYTES = 3 * MAXIMUM_RESPONSE_BYTES_PER_REQUEST
const REQUEST_TIMEOUT_MILLISECONDS = 15_000
const MAXIMUM_INTERNAL_PRODUCTION_COST_MICROS = 100_000
const EXPECTED_SPOKEN_TEXT_CHARACTER_COUNT = 160
const MAXIMUM_AUTHORIZED_PROVIDER_COST_MICROS = 250_000
const AUTHORITY_WINDOW_MILLISECONDS = 10 * 60_000
const PRIVATE_ACCEPTANCE_DECISION_FILE_SHA256 =
  'f32d4d1948170d51a20dfd153d565ced9eefb3d0e239e9e76718340def3774f9' as const
const PRIVATE_ACCEPTANCE_DECISION_DIGEST =
  'c0be006fe3b35983fd4982870c963834a61783df4d2ca13b5d129a40f4b9346d' as const
const PRIVATE_ACCEPTANCE_CATALOG_EVIDENCE_DIGEST =
  'c1a3b5fea2146ddf3533e1e37da2717f06cf2294c8ed9d96aa245bf694afd7dc' as const
const OWNER_STANDING_DIRECTIVE_ID = 'MS-OWNER-STANDING-IMPLEMENTATION-QA-20260718' as const
const OWNER_AUTHORIZATION_EVIDENCE_ID = 'owner-standing-storytelling-self-qa-20260718' as const
const OWNER_STANDING_DIRECTIVE_SHA256 =
  'b933153875768280382d9e9aecd1d904c4300518426bbe6ae52496c8ea0fff68' as const
const OWNER_AUTHORIZATION_STATEMENT_SHA256 =
  'cb26b67e69b5dde409462abaeeb34b1838c1561d58751314a8e78df1c39b672b' as const
const REVIEWED_RUNTIME_RELATIVE_PATHS = Object.freeze([
  'server/motion-studio/speech-production/live-credential.ts',
  'server/motion-studio/speech-production/voice-catalog-discovery.ts',
  'server/motion-studio/speech-production/voice-catalog-binding.ts',
  'server/motion-studio/speech-production/account-preflight.ts',
  'server/motion-studio/speech-production/account-preflight-live-operator.ts',
  'server/motion-studio/speech-production/account-preflight-live-cli.ts',
] as const)

export const MOTION_STUDIO_SPEECH_ACCOUNT_PREFLIGHT_LIVE_OPERATOR_PATHS = Object.freeze({
  packetRelativePath: PACKET_RELATIVE_PATH,
  authorizationRecordRelativePath: AUTHORIZATION_RECORD_RELATIVE_PATH,
  decisionRelativePath: DECISION_RELATIVE_PATH,
  privateRunRootRelativePath: PRIVATE_RUN_ROOT_RELATIVE_PATH,
  consumptionRecordFilename: CONSUMPTION_RECORD_FILENAME,
  evidenceFilename: EVIDENCE_FILENAME,
  failureFilename: FAILURE_FILENAME,
})

export interface MotionStudioSpeechAccountPreflightLiveOperatorResultV1 {
  schemaVersion: 'motion-studio.speech-account-preflight-live-operator-result.v1'
  state: 'private_account_preflight_evidence_ready'
  evidenceClass: 'authenticated_provider_read_only' | 'private_local_fixture'
  authorizationId: typeof MOTION_STUDIO_SPEECH_ACCOUNT_PREFLIGHT_EXTERNAL_AUTHORIZATION_ID
  authorityPacketDigest: string
  ownerAuthorizationEvidenceId: string
  decisionDigest: string
  selectionDigest: string
  catalogEvidenceDigest: string
  planDigest: string
  externalAuthorityDigest: string
  preflightEvidenceDigest: string
  accountFundedWithoutPurchase: boolean
  modelAccessVerified: boolean
  verifiedProviderCatalogVoice: boolean
  zeroRetentionEntitlementVerified: false
  credentialPayloadReadCount: 1
  providerRequestCount: 3
  providerGenerationCount: 0
  purchaseCount: 0
  accountMutationCount: 0
  automaticRetryCount: 0
  automaticFallbackCount: 0
  privateEvidenceRelativePath: typeof EVIDENCE_FILENAME
  completedAt: string
  immutable: true
}

interface FixtureInput {
  repositoryRoot: string
  now: string
  fixtureLoaderOptions: MotionStudioSpeechGoogleSecretManagerFixtureLoaderOptions
  fixtureFetchImplementation: typeof fetch
}

export async function executeMotionStudioSpeechAccountPreflightLiveOperator(input: {
  repositoryRoot: string
  now: string
}): Promise<MotionStudioSpeechAccountPreflightLiveOperatorResultV1> {
  return executeOperator({ mode: 'live', ...input })
}

/** Fixture-only proof; it can never produce authenticated provider evidence. */
export async function executeMotionStudioSpeechAccountPreflightAuthorizedFixtureOperator(
  input: FixtureInput,
): Promise<MotionStudioSpeechAccountPreflightLiveOperatorResultV1> {
  return executeOperator({ mode: 'fixture', ...input })
}

async function executeOperator(input: ({
  mode: 'live'
  repositoryRoot: string
  now: string
} | ({ mode: 'fixture' } & FixtureInput))): Promise<MotionStudioSpeechAccountPreflightLiveOperatorResultV1> {
  const now = exactIso(input.now, 'account-preflight operator time')
  const repositoryRoot = await realpath(input.repositoryRoot)
  const packetBytes = await readRegularBoundedFile(
    inside(repositoryRoot, PACKET_RELATIVE_PATH), MAX_PACKET_BYTES, 'authority packet')
  const packetDigest = sha256Bytes(packetBytes)
  const packet = validatePacket(parseJson(packetBytes, 'authority packet'), packetDigest)
  await verifyReviewedRuntimeFiles(repositoryRoot, packet.reviewedRuntimeFiles)
  await verifyExt001History(repositoryRoot)
  const authorizationRecordBytes = await readRegularBoundedFile(
    inside(repositoryRoot, AUTHORIZATION_RECORD_RELATIVE_PATH),
    MAX_AUTHORIZATION_RECORD_BYTES,
    'standing-directive authorization record',
  )
  const authorizationRecord = validateAuthorizationRecord(
    parseJson(authorizationRecordBytes, 'standing-directive authorization record'), packetDigest, now)
  const authorizationRecordDigest = sha256Bytes(authorizationRecordBytes)
  const decisionBytes = await readRegularBoundedFile(
    inside(repositoryRoot, DECISION_RELATIVE_PATH), MAX_DECISION_BYTES, 'private acceptance voice decision')
  if (sha256Bytes(decisionBytes) !== PRIVATE_ACCEPTANCE_DECISION_FILE_SHA256) {
    blocked('Speech account-preflight private acceptance voice decision changed after review.')
  }
  const decision = validateDecision(parseJson(decisionBytes, 'private acceptance voice decision'))

  const runRootPath = inside(repositoryRoot, PRIVATE_RUN_ROOT_RELATIVE_PATH)
  await mkdir(runRootPath, { recursive: true, mode: 0o700 })
  const [resolvedRunRoot, runRootMetadata] = await Promise.all([realpath(runRootPath), lstat(runRootPath)])
  if (
    !resolvedRunRoot.startsWith(`${repositoryRoot}${sep}`) || !runRootMetadata.isDirectory() ||
    runRootMetadata.isSymbolicLink() || (runRootMetadata.mode & 0o777) !== 0o700 ||
    (typeof process.getuid === 'function' && runRootMetadata.uid !== process.getuid())
  ) blocked('Speech account-preflight private run root is not owner-private.')

  const catalogEvidence = await loadMotionStudioSpeechVoiceCatalogPrivateAcceptanceEvidence({ repositoryRoot })
  if (catalogEvidence.evidenceDigest !== decision.catalogEvidenceDigest) {
    blocked('Speech account-preflight decision no longer matches the accepted catalog evidence.')
  }
  const candidates = catalogEvidence.candidates.filter((candidate) =>
    candidate.voiceIdentityHash === decision.voiceIdentityHash &&
    candidate.candidateEvidenceDigest === decision.candidateEvidenceDigest)
  if (candidates.length !== 1) blocked('Speech account-preflight decision does not resolve one exact candidate.')
  const candidate = candidates[0]!
  if (candidate.displayName !== decision.displayName) {
    blocked('Speech account-preflight decision display name no longer matches the exact candidate.')
  }
  const approvedSnapshotDigest = sha256CanonicalJson({
    scope: decision.scope,
    decisionDigest: decision.decisionDigest,
    purpose: 'private speech acceptance proof only',
  })
  const voiceBibleContentDigest = sha256CanonicalJson({
    profile: 'warm-captivating-storyteller-private-acceptance-v1',
    decisionDigest: decision.decisionDigest,
  })
  const selection = createMotionStudioSpeechVoiceCatalogSelection({
    workspaceId: 'workspace-storytelling-private-acceptance',
    projectId: 'project-storytelling-private-acceptance',
    editSessionId: 'edit-storytelling-private-acceptance',
    productionId: 'production-storytelling-private-acceptance',
    selectionId: 'voice-selection-private-acceptance-001',
    selectionDecisionId: decision.decisionId,
    selectedByActorId: decision.selectedByActorId,
    selectionMode: 'explicit_user_selection',
    approvalRecordId: decision.standingDirectiveId,
    approvedSnapshotId: 'approved-snapshot-private-acceptance-001',
    approvedSnapshotDigest,
    voiceBibleArtifactVersion: {
      artifactId: 'voice-bible-private-acceptance-001',
      versionId: 'voice-bible-version-private-acceptance-001',
      versionNumber: 1,
      contentDigest: voiceBibleContentDigest,
    },
    voiceBindingId: 'voice-binding-private-acceptance-001',
    providerVoiceId: candidate.providerVoiceId,
    expectedVoiceIdentityHash: candidate.voiceIdentityHash,
    expectedCandidateEvidenceDigest: candidate.candidateEvidenceDigest,
    catalogEvidence,
    voiceProfileReference: 'warm-captivating-storyteller-private-acceptance-v1',
    rightsEvidenceId: 'provider-premade-catalog-rights-private-acceptance-001',
    retentionPolicyId: 'zero-retention-entitlement-pending-private-acceptance-001',
    selectedAt: decision.recordedAt,
  })
  const catalogBindingResult = createMotionStudioSpeechVoiceBindingFromCatalogSelection({
    selection,
    catalogEvidence,
  })
  const credentialBinding = createMotionStudioSpeechSecretBinding({
    credentialReferenceId: 'gsm-elevenlabs-api-key-v1',
    secretLocatorId: MOTION_STUDIO_SPEECH_ELEVENLABS_SECRET_LOCATOR_ID,
    secretVersionReference: MOTION_STUDIO_SPEECH_ELEVENLABS_SECRET_VERSION,
  })
  if (credentialBinding.bindingDigest !== packet.credentialBindingDigest) {
    blocked('Speech account-preflight packet no longer matches the pinned Secret Manager binding.')
  }
  const expiresAt = new Date(Date.parse(now) + AUTHORITY_WINDOW_MILLISECONDS).toISOString()
  const plan = createMotionStudioSpeechAccountPreflightPlan({
    planId: `account-preflight-ext-002-${packetDigest.slice(0, 16)}`,
    credentialBinding,
    catalogBindingResult,
    expectedSpokenTextCharacterCount: EXPECTED_SPOKEN_TEXT_CHARACTER_COUNT,
    maximumAuthorizedProviderCostMicros: MAXIMUM_AUTHORIZED_PROVIDER_COST_MICROS,
    issuedAt: now,
    expiresAt,
  })
  const externalAuthority = createMotionStudioSpeechAccountPreflightExternalAuthority({
    plan,
    authorityPacketDigest: packetDigest,
    ownerAuthorizationEvidenceId: authorizationRecord.ownerAuthorizationEvidenceId,
    issuedAt: now,
    expiresAt,
  })
  const safeProgress = {
    lastPhase: 'authority_consumed' as string,
    credentialReadStarted: false,
    credentialPayloadReadCount: 0,
    providerRequestAttemptCount: 0,
    providerRequestCompletedCount: 0,
    lastRequestKind: null as null | 'subscription' | 'model_catalog' | 'exact_accepted_voice',
  }
  const onSafeProgress = (event: MotionStudioSpeechAccountPreflightSafeProgressEventV1) => {
    safeProgress.lastPhase = event.phase
    if (event.phase === 'credential_read_started') safeProgress.credentialReadStarted = true
    if (event.phase === 'credential_read_completed') safeProgress.credentialPayloadReadCount = 1
    if (event.phase === 'provider_request_started') {
      safeProgress.providerRequestAttemptCount = event.requestIndex
      safeProgress.lastRequestKind = event.requestKind
    }
    if (event.phase === 'provider_request_completed') {
      safeProgress.providerRequestCompletedCount = event.requestIndex
      safeProgress.lastRequestKind = event.requestKind
    }
  }
  const transport = input.mode === 'live'
    ? createMotionStudioSpeechAccountPreflightLiveTransport({
        externalNetworkEnabled: true,
        credentialPayloadAccessEnabled: true,
        loader: createMotionStudioSpeechGoogleSecretManagerValueLoader({
          projectId: MOTION_STUDIO_SPEECH_GOOGLE_CLOUD_PROJECT_ID,
          timeoutMs: REQUEST_TIMEOUT_MILLISECONDS,
        }),
        plan,
        externalAuthority,
        onSafeProgress,
        requestTimeoutMs: REQUEST_TIMEOUT_MILLISECONDS,
      })
    : createMotionStudioSpeechAccountPreflightAuthorizedFixtureTransport({
        transportEnabled: true,
        credentialPayloadAccessEnabled: true,
        fixtureLoader: createMotionStudioSpeechFixtureGoogleSecretManagerValueLoader(
          input.fixtureLoaderOptions),
        fixtureFetchImplementation: input.fixtureFetchImplementation,
        plan,
        externalAuthority,
        onSafeProgress,
        requestTimeoutMs: REQUEST_TIMEOUT_MILLISECONDS,
      })

  await writePrivateJsonExclusive(join(resolvedRunRoot, CONSUMPTION_RECORD_FILENAME), {
    schemaVersion: 'motion-studio.speech-account-preflight-authority-consumption.v1',
    state: 'single_use_authority_consumed_before_credential_read',
    authorizationId: packet.authorizationId,
    authorityPacketDigest: packetDigest,
    authorizationRecordDigest,
    ownerAuthorizationEvidenceId: authorizationRecord.ownerAuthorizationEvidenceId,
    decisionDigest: decision.decisionDigest,
    selectionDigest: selection.selectionDigest,
    catalogEvidenceDigest: catalogEvidence.evidenceDigest,
    planDigest: plan.planDigest,
    externalAuthorityDigest: externalAuthority.authorityDigest,
    credentialBindingDigest: credentialBinding.bindingDigest,
      credentialPayloadReadCountAtConsumption: 0,
      providerRequestCountAtConsumption: 0,
    consumedAt: now,
    immutable: true,
  }, 'Speech account-preflight external authority is already consumed.')

  try {
    const evidence = await transport.execute({ plan, now })
    if (
      evidence.planDigest !== plan.planDigest ||
      evidence.credentialBindingDigest !== credentialBinding.bindingDigest ||
      evidence.providerRequestCount !== 3 || evidence.credentialValueRead !== true ||
      evidence.providerGenerationCallMade !== false || evidence.purchasePerformed !== false ||
      evidence.accountMutationPerformed !== false || evidence.automaticRetryPerformed !== false ||
      evidence.automaticFallbackPerformed !== false || evidence.rawProviderResponsesPersisted !== false ||
      evidence.voice.voiceIdentityHash !== candidate.voiceIdentityHash ||
      evidence.voiceAuthorityDigest !== sha256CanonicalJson(plan.voiceAuthority)
    ) blocked('Speech account-preflight evidence does not match the consumed external authority.')
    await writePrivateJsonExclusive(join(resolvedRunRoot, EVIDENCE_FILENAME), evidence,
      'Speech account-preflight private evidence already exists.')
    return Object.freeze({
      schemaVersion: 'motion-studio.speech-account-preflight-live-operator-result.v1' as const,
      state: 'private_account_preflight_evidence_ready' as const,
      evidenceClass: input.mode === 'live'
        ? 'authenticated_provider_read_only' as const
        : 'private_local_fixture' as const,
      authorizationId: packet.authorizationId,
      authorityPacketDigest: packetDigest,
      ownerAuthorizationEvidenceId: authorizationRecord.ownerAuthorizationEvidenceId,
      decisionDigest: decision.decisionDigest,
      selectionDigest: selection.selectionDigest,
      catalogEvidenceDigest: catalogEvidence.evidenceDigest,
      planDigest: plan.planDigest,
      externalAuthorityDigest: externalAuthority.authorityDigest,
      preflightEvidenceDigest: evidence.evidenceDigest,
      accountFundedWithoutPurchase: evidence.accountFundedWithoutPurchase,
      modelAccessVerified: evidence.modelAccessVerified,
      verifiedProviderCatalogVoice: evidence.verifiedProviderCatalogVoice,
      zeroRetentionEntitlementVerified: false as const,
      credentialPayloadReadCount: 1 as const,
      providerRequestCount: 3 as const,
      providerGenerationCount: 0 as const,
      purchaseCount: 0 as const,
      accountMutationCount: 0 as const,
      automaticRetryCount: 0 as const,
      automaticFallbackCount: 0 as const,
      privateEvidenceRelativePath: EVIDENCE_FILENAME,
      completedAt: now,
      immutable: true as const,
    })
  } catch (error) {
    const failureReasonClass = safeFailureReasonClass(error, safeProgress)
    await writePrivateJsonBestEffort(join(resolvedRunRoot, FAILURE_FILENAME), {
      schemaVersion: 'motion-studio.speech-account-preflight-terminal-failure.v1',
      state: 'consumed_terminal_no_retry',
      authorizationId: packet.authorizationId,
      authorityPacketDigest: packetDigest,
      ownerAuthorizationEvidenceId: authorizationRecord.ownerAuthorizationEvidenceId,
      decisionDigest: decision.decisionDigest,
      planDigest: plan.planDigest,
      externalAuthorityDigest: externalAuthority.authorityDigest,
      failureCode: error instanceof ApiError ? error.code : 'INTERNAL_ERROR',
      failureReasonClass,
      safeProgress: {
        lastPhase: safeProgress.lastPhase,
        credentialReadStarted: safeProgress.credentialReadStarted,
        credentialPayloadReadCount: safeProgress.credentialPayloadReadCount,
        providerRequestAttemptCount: safeProgress.providerRequestAttemptCount,
        providerRequestCompletedCount: safeProgress.providerRequestCompletedCount,
        lastRequestKind: safeProgress.lastRequestKind,
      },
      credentialAndRequestOutcome: 'not_retried_after_authority_consumption',
      failedAt: now,
      immutable: true,
    })
    throw error
  }
}

function safeFailureReasonClass(
  error: unknown,
  progress: {
    lastPhase: string
    credentialReadStarted: boolean
    credentialPayloadReadCount: number
    providerRequestAttemptCount: number
    providerRequestCompletedCount: number
    lastRequestKind: null | 'subscription' | 'model_catalog' | 'exact_accepted_voice'
  },
): string {
  const message = error instanceof Error ? error.message : ''
  if (message.includes('credential could not be accessed')) return 'credential_access_failed'
  if (message.includes('credential value is malformed')) return 'credential_value_validation_failed'
  if (progress.providerRequestAttemptCount > progress.providerRequestCompletedCount) {
    return `${progress.lastRequestKind ?? 'provider'}_read_failed`
  }
  if (message.includes('subscription')) return 'subscription_response_validation_failed'
  if (message.includes('model')) return 'model_catalog_response_validation_failed'
  if (message.includes('voice')) return 'exact_voice_response_validation_failed'
  if (message.includes('responses exceed')) return 'combined_response_limit_failed'
  if (message.includes('evidence does not match')) return 'post_response_authority_validation_failed'
  if (message.includes('private evidence already exists')) return 'private_evidence_persistence_failed'
  if (progress.lastPhase === 'evidence_compiled') return 'post_response_persistence_failed'
  return 'allowlisted_unclassified_failure'
}

function validatePacket(value: unknown, packetDigest: string): {
  authorizationId: typeof MOTION_STUDIO_SPEECH_ACCOUNT_PREFLIGHT_EXTERNAL_AUTHORIZATION_ID
  credentialBindingDigest: string
  reviewedRuntimeFiles: readonly { relativePath: string; byteLength: number; sha256: string }[]
} {
  const packet = object(value, 'authority packet')
  const credential = object(packet.credentialAuthority, 'credential authority')
  const runtime = object(packet.credentialRuntimeIdentity, 'credential runtime')
  const decision = object(packet.selectionDecision, 'selection decision')
  const request = object(packet.request, 'provider request')
  const authority = object(packet.runtimeExternalAuthority, 'runtime external authority')
  const operator = object(packet.operatorPolicy, 'operator policy')
  const evidence = object(packet.evidencePolicy, 'evidence policy')
  const safeFailure = object(packet.safeFailureEvidencePolicy, 'safe failure evidence policy')
  const cost = object(packet.costPolicy, 'cost policy')
  const baseline = object(packet.reviewedLocalBaseline, 'reviewed local baseline')
  const reviewedRuntimeFiles = parseReviewedRuntimeFiles(packet.reviewedRuntimeFiles)
  if (
    packet.schemaVersion !== 'motion-studio.speech-account-preflight-live-authorization.v1' ||
    packet.authorizationId !== MOTION_STUDIO_SPEECH_ACCOUNT_PREFLIGHT_EXTERNAL_AUTHORIZATION_ID ||
    packet.status !== 'standing_directive_authorization_ready_not_executed' || packet.singleUse !== true ||
    baseline.ext001ResultRecord !== EXT_001_RESULT_RELATIVE_PATH ||
    baseline.ext001ResultSha256 !== EXT_001_RESULT_SHA256 ||
    baseline.ext001HistoryMustRemainImmutable !== true ||
    credential.provider !== 'google_secret_manager' ||
    credential.projectId !== MOTION_STUDIO_SPEECH_GOOGLE_CLOUD_PROJECT_ID ||
    credential.secretId !== MOTION_STUDIO_SPEECH_ELEVENLABS_SECRET_LOCATOR_ID ||
    credential.numericVersion !== MOTION_STUDIO_SPEECH_ELEVENLABS_SECRET_VERSION ||
    !SHA256.test(String(credential.bindingDigest)) || credential.maximumPayloadReads !== 1 ||
    credential.environmentFallbackAllowed !== false || credential.credentialPersisted !== false ||
    runtime.cloudSdkVersion !== MOTION_STUDIO_SPEECH_GCLOUD_SDK_VERSION ||
    runtime.resolvedExecutablePath !== MOTION_STUDIO_SPEECH_GCLOUD_BINARY_PATH ||
    runtime.executableByteLength !== MOTION_STUDIO_SPEECH_GCLOUD_BINARY_BYTE_LENGTH ||
    runtime.executableSha256 !== MOTION_STUDIO_SPEECH_GCLOUD_BINARY_SHA256 ||
    runtime.callerSelectedExecutableAllowed !== false || runtime.proxyOrPacAllowed !== false ||
    decision.relativePath !== DECISION_RELATIVE_PATH ||
    decision.fileSha256 !== PRIVATE_ACCEPTANCE_DECISION_FILE_SHA256 ||
    decision.decisionDigest !== PRIVATE_ACCEPTANCE_DECISION_DIGEST ||
    decision.catalogEvidenceDigest !== PRIVATE_ACCEPTANCE_CATALOG_EVIDENCE_DIGEST ||
    decision.productionUserDefault !== false || decision.customerBindingAllowed !== false ||
    request.method !== 'GET' || request.scheme !== 'https' || request.hostname !== 'api.elevenlabs.io' ||
    request.maximumHttpRequests !== 3 ||
    request.maximumResponseBytesPerRequest !== MAXIMUM_RESPONSE_BYTES_PER_REQUEST ||
    request.maximumCapturedResponseBytes !== MAXIMUM_CAPTURED_RESPONSE_BYTES ||
    request.timeoutMilliseconds !== REQUEST_TIMEOUT_MILLISECONDS || request.maximumRedirects !== 0 ||
    request.automaticRetryAllowed !== false || request.automaticFallbackAllowed !== false ||
    request.providerGenerationAllowed !== false || request.purchaseAllowed !== false ||
    request.accountMutationAllowed !== false || request.exactVoicePathResolvedServerSide !== true ||
    request.expectedSpokenTextCharacterCount !== EXPECTED_SPOKEN_TEXT_CHARACTER_COUNT ||
    request.maximumAuthorizedProviderCostMicros !== MAXIMUM_AUTHORIZED_PROVIDER_COST_MICROS ||
    authority.schemaVersion !== 'motion-studio.speech-account-preflight-external-authority.v1' ||
    authority.exactPlanInstanceRequired !== true || authority.singleUseBeforeCredentialRead !== true ||
    authority.copiedOrMismatchedAuthorityRejected !== true ||
    operator.command !== './node_modules/.bin/tsx server/motion-studio/speech-production/account-preflight-live-cli.ts' ||
    operator.authorizationRecordRelativePath !== AUTHORIZATION_RECORD_RELATIVE_PATH ||
    operator.privateRunRootRelativePath !== PRIVATE_RUN_ROOT_RELATIVE_PATH ||
    operator.consumptionRecordFilename !== CONSUMPTION_RECORD_FILENAME ||
    operator.privateEvidenceFilename !== EVIDENCE_FILENAME || operator.terminalFailureFilename !== FAILURE_FILENAME ||
    operator.exclusiveFileCreateMode !== 'wx_0600' || operator.consumeBeforeCredentialRead !== true ||
    evidence.privateLocalEvidenceOnly !== true || evidence.rawProviderResponsesPersisted !== false ||
    evidence.credentialPersisted !== false || evidence.browserProjectionAllowed !== false ||
    safeFailure.allowlistedFailureClassOnly !== true ||
    safeFailure.credentialReadStartedBooleanAllowed !== true ||
    JSON.stringify(safeFailure.credentialPayloadReadCountAllowedValues) !== '[0,1]' ||
    JSON.stringify(safeFailure.providerRequestAttemptCountAllowedRange) !== '[0,3]' ||
    JSON.stringify(safeFailure.providerRequestCompletedCountAllowedRange) !== '[0,3]' ||
    JSON.stringify(safeFailure.requestKindsAllowed) !==
      '["subscription","model_catalog","exact_accepted_voice"]' ||
    safeFailure.rawErrorMessagePersisted !== false || safeFailure.responseBodyPersisted !== false ||
    safeFailure.providerVoiceIdPersistedInFailure !== false ||
    cost.providerAccountReadFeeExpectedMicros !== 0 ||
    cost.maximumInternalProductionCostMicros !== MAXIMUM_INTERNAL_PRODUCTION_COST_MICROS ||
    cost.currency !== 'USD' || cost.customerPricingAllowed !== false ||
    cost.customerCreditsAllowed !== false || cost.billingAllowed !== false || !SHA256.test(packetDigest)
  ) blocked('Speech account-preflight live authority packet failed its exact runtime contract.')
  return {
    authorizationId: MOTION_STUDIO_SPEECH_ACCOUNT_PREFLIGHT_EXTERNAL_AUTHORIZATION_ID,
    credentialBindingDigest: String(credential.bindingDigest),
    reviewedRuntimeFiles,
  }
}

async function verifyExt001History(repositoryRoot: string): Promise<void> {
  const resultBytes = await readRegularBoundedFile(
    inside(repositoryRoot, EXT_001_RESULT_RELATIVE_PATH), 64 * 1024, 'EXT-001 tracked result')
  if (sha256Bytes(resultBytes) !== EXT_001_RESULT_SHA256) {
    blocked('Speech account-preflight EXT-001 tracked history changed before EXT-002.')
  }
  const result = object(parseJson(resultBytes, 'EXT-001 tracked result'), 'EXT-001 tracked result')
  if (
    result.authorizationId !== 'MS-012C2-ACCOUNT-PREFLIGHT-EXT-001' ||
    result.status !== 'consumed_terminal_failure_no_retry' || result.immutable !== true ||
    result.verdict !== 'MS-012C2_ACCOUNT_PREFLIGHT_EXT_001_CONSUMED_TERMINAL_NO_RETRY'
  ) blocked('Speech account-preflight EXT-001 tracked history is not the accepted terminal record.')

  const rootPath = inside(repositoryRoot, EXT_001_PRIVATE_ROOT_RELATIVE_PATH)
  let rootMetadata
  let canonicalRoot
  try {
    ;[rootMetadata, canonicalRoot] = await Promise.all([lstat(rootPath), realpath(rootPath)])
  } catch {
    blocked('Speech account-preflight EXT-001 private history is unavailable.')
  }
  if (
    canonicalRoot !== rootPath || !rootMetadata.isDirectory() || rootMetadata.isSymbolicLink() ||
    (rootMetadata.mode & 0o777) !== 0o700 ||
    (typeof process.getuid === 'function' && rootMetadata.uid !== process.getuid())
  ) blocked('Speech account-preflight EXT-001 private history root is not owner-private.')
  for (const expected of EXT_001_PRIVATE_FILES) {
    const path = join(canonicalRoot, expected.filename)
    const bytes = await readRegularBoundedFile(path, 4 * 1024, `EXT-001 ${expected.filename}`)
    const metadata = await lstat(path)
    if (
      bytes.byteLength !== expected.byteLength || sha256Bytes(bytes) !== expected.sha256 ||
      (metadata.mode & 0o777) !== 0o600 ||
      (typeof process.getuid === 'function' && metadata.uid !== process.getuid())
    ) blocked('Speech account-preflight EXT-001 private history changed before EXT-002.')
  }
}

function parseReviewedRuntimeFiles(value: unknown): readonly {
  relativePath: string
  byteLength: number
  sha256: string
}[] {
  if (!Array.isArray(value) || value.length !== REVIEWED_RUNTIME_RELATIVE_PATHS.length) {
    blocked('Speech account-preflight packet has an invalid reviewed-runtime file set.')
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
    ) blocked('Speech account-preflight reviewed-runtime identity is malformed.')
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
      blocked('Speech account-preflight reviewed runtime changed after packet review.')
    }
  }
}

function validateAuthorizationRecord(value: unknown, packetDigest: string, now: string): {
  ownerAuthorizationEvidenceId: string
} {
  const record = object(value, 'standing-directive authorization record')
  if (
    record.schemaVersion !== 'motion-studio.speech-account-preflight-live-authorization-record.v1' ||
    record.status !== 'standing_directive_authorized_unconsumed' ||
    record.authorizationId !== MOTION_STUDIO_SPEECH_ACCOUNT_PREFLIGHT_EXTERNAL_AUTHORIZATION_ID ||
    record.authorityPacketDigest !== packetDigest || record.singleUse !== true ||
    record.standingDirectiveId !== OWNER_STANDING_DIRECTIVE_ID ||
    record.ownerAuthorizationEvidenceId !== OWNER_AUTHORIZATION_EVIDENCE_ID ||
    record.standingDirectiveSha256 !== OWNER_STANDING_DIRECTIVE_SHA256 ||
    record.ownerAuthorizationStatementSha256 !== OWNER_AUTHORIZATION_STATEMENT_SHA256 ||
    record.maximumSecretPayloadReads !== 1 || record.maximumHttpRequests !== 3 ||
    record.maximumCapturedResponseBytes !== MAXIMUM_CAPTURED_RESPONSE_BYTES ||
    record.maximumInternalProductionCostMicros !== MAXIMUM_INTERNAL_PRODUCTION_COST_MICROS ||
    record.automaticRetryAllowed !== false || record.automaticFallbackAllowed !== false ||
    record.providerGenerationAllowed !== false || record.purchaseAllowed !== false ||
    record.accountMutationAllowed !== false || record.privateLocalEvidenceOnly !== true ||
    !STABLE_ID.test(String(record.ownerAuthorizationEvidenceId))
  ) blocked('Speech account-preflight standing-directive authorization does not match the packet.')
  const recordedAt = exactIso(String(record.recordedAt), 'account-preflight authorization record time')
  if (Date.parse(recordedAt) > Date.parse(now)) {
    blocked('Speech account-preflight authorization record is from the future.')
  }
  return { ownerAuthorizationEvidenceId: String(record.ownerAuthorizationEvidenceId) }
}

function validateDecision(value: unknown): {
  decisionId: string
  decisionDigest: string
  scope: string
  displayName: string
  voiceIdentityHash: string
  candidateEvidenceDigest: string
  catalogEvidenceDigest: string
  standingDirectiveId: string
  selectedByActorId: string
  recordedAt: string
} {
  const decision = object(value, 'private acceptance voice decision')
  const { decisionDigest, ...base } = decision
  if (
    decision.schemaVersion !== 'motion-studio.speech-private-acceptance-voice-selection-decision.v1' ||
    decision.status !== 'owner_delegated_self_qa_selection_for_private_acceptance_only' ||
    decision.scope !== 'private_local_storytelling_acceptance_test' ||
    decision.selectionMode !== 'explicit_user_selection' ||
    decision.selectionAuthority !== 'owner_delegated_implementation_qa_private_acceptance' ||
    decision.providerVoiceIdPersisted !== false || decision.automaticSelectionPerformed !== false ||
    decision.productionUserDefault !== false || decision.customerBindingAllowed !== false ||
    decision.finalVoiceSelectionAllowed !== false || decision.immutable !== true ||
    decisionDigest !== PRIVATE_ACCEPTANCE_DECISION_DIGEST ||
    sha256CanonicalJson(base) !== decisionDigest ||
    decision.catalogEvidenceDigest !== PRIVATE_ACCEPTANCE_CATALOG_EVIDENCE_DIGEST
  ) blocked('Speech account-preflight private acceptance voice decision failed its exact contract.')
  for (const field of ['decisionId', 'standingDirectiveId', 'selectedByActorId'] as const) {
    if (!STABLE_ID.test(String(decision[field]))) {
      blocked('Speech account-preflight private acceptance decision identity is malformed.')
    }
  }
  for (const field of ['voiceIdentityHash', 'candidateEvidenceDigest', 'catalogEvidenceDigest'] as const) {
    if (!SHA256.test(String(decision[field]))) {
      blocked('Speech account-preflight private acceptance decision digest is malformed.')
    }
  }
  return {
    decisionId: String(decision.decisionId),
    decisionDigest: String(decisionDigest),
    scope: String(decision.scope),
    displayName: safeText(decision.displayName, 'decision display name', 160),
    voiceIdentityHash: String(decision.voiceIdentityHash),
    candidateEvidenceDigest: String(decision.candidateEvidenceDigest),
    catalogEvidenceDigest: String(decision.catalogEvidenceDigest),
    standingDirectiveId: String(decision.standingDirectiveId),
    selectedByActorId: String(decision.selectedByActorId),
    recordedAt: exactIso(String(decision.recordedAt), 'private acceptance voice decision time'),
  }
}

async function readRegularBoundedFile(path: string, maximumBytes: number, label: string): Promise<Buffer> {
  let metadata
  let canonicalPath
  try {
    ;[metadata, canonicalPath] = await Promise.all([lstat(path), realpath(path)])
  } catch {
    blocked(`Speech account-preflight ${label} is unavailable.`)
  }
  if (
    !metadata.isFile() || metadata.isSymbolicLink() || canonicalPath !== path ||
    metadata.size < 2 || metadata.size > maximumBytes
  ) blocked(`Speech account-preflight ${label} is not one bounded regular file.`)
  const bytes = await readFile(path)
  if (bytes.byteLength !== metadata.size || bytes.byteLength > maximumBytes) {
    blocked(`Speech account-preflight ${label} changed during its bounded read.`)
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
    // The exclusive consumption record remains the canonical terminal fact.
  }
}

function inside(root: string, relativePath: string): string {
  if (
    relativePath.length < 1 || relativePath.includes('\0') || relativePath.startsWith('/') ||
    relativePath.split(/[\\/]/u).includes('..')
  ) blocked('Speech account-preflight path is unsafe.')
  const path = resolve(root, relativePath)
  if (!path.startsWith(`${root}${sep}`)) blocked('Speech account-preflight path escaped the repository boundary.')
  return path
}

function parseJson(bytes: Buffer, label: string): unknown {
  try {
    return JSON.parse(bytes.toString('utf8'))
  } catch {
    blocked(`Speech account-preflight ${label} is malformed JSON.`)
  }
}

function object(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    blocked(`Speech account-preflight ${label} is malformed.`)
  }
  return value as Record<string, unknown>
}

function safeText(value: unknown, label: string, maximumLength: number): string {
  if (
    typeof value !== 'string' || value.length < 1 || value.length > maximumLength || value.includes('\0')
  ) blocked(`Speech account-preflight ${label} is malformed.`)
  return value
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
