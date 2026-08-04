import { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'
import { chmod, lstat, mkdir, readFile, realpath, writeFile } from 'node:fs/promises'
import { join, resolve, sep } from 'node:path'

import { ApiError } from '../../errors/api-error'
import { sha256CanonicalJson } from '../commands/canonical-json'
import {
  MOTION_STUDIO_SPEECH_ELEVENLABS_SECRET_LOCATOR_ID,
  MOTION_STUDIO_SPEECH_ELEVENLABS_SECRET_VERSION,
  MOTION_STUDIO_SPEECH_GOOGLE_CLOUD_PROJECT_ID,
  assertMotionStudioSpeechFixtureGoogleSecretManagerLoader,
  assertMotionStudioSpeechLiveGoogleSecretManagerLoader,
  createMotionStudioSpeechFixtureGoogleSecretManagerValueLoader,
  createMotionStudioSpeechGoogleSecretManagerValueLoader,
  createMotionStudioSpeechSecretBinding,
  type MotionStudioSpeechGoogleSecretManagerFixtureLoaderOptions,
  type MotionStudioSpeechSecretValueLoader,
} from './live-credential'
import { MOTION_STUDIO_SPEECH_SYNTHETIC_ACCEPTANCE_TEXT } from './synthetic-acceptance-live-operator'

const SHA256 = /^[a-f0-9]{64}$/u
const GIT_OBJECT_ID = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/u
const SYSTEM_FETCH = globalThis.fetch.bind(globalThis)

const PACKET_RELATIVE_PATH =
  'tasks/motion-studio/MS-012C/c2-synthetic-acceptance-transcript-live-authorization-request-ext-002.json' as const
const AUTHORIZATION_RECORD_RELATIVE_PATH =
  'tasks/motion-studio/MS-012C/c2-synthetic-acceptance-transcript-live-authorization-record-ext-002.json' as const
const STANDING_DIRECTIVE_RELATIVE_PATH =
  'tasks/motion-studio/owner-standing-implementation-qa-directive.json' as const
const SOURCE_RESULT_RELATIVE_PATH =
  'tasks/motion-studio/MS-012C/c2-synthetic-acceptance-live-result.json' as const
const SOURCE_PRIVATE_ROOT_RELATIVE_PATH =
  '.reeditpro-local-storage-ms012c2-synthetic-acceptance-ext-001' as const
const SOURCE_AUDIO_FILENAME = 'synthetic-acceptance-audio.mp3' as const
const PRIVATE_RUN_ROOT_RELATIVE_PATH =
  '.reeditpro-local-storage-ms012c2-synthetic-transcript-ext-002' as const
const CONSUMPTION_FILENAME = 'authority-consumed.json' as const
const EVIDENCE_FILENAME = 'synthetic-transcript-evidence.json' as const
const FAILURE_FILENAME = 'terminal-failure.json' as const

const MAX_PACKET_BYTES = 256 * 1024
const MAX_AUTHORIZATION_BYTES = 64 * 1024
const MAX_SOURCE_RESULT_BYTES = 256 * 1024
const MAX_SOURCE_AUDIO_BYTES = 200 * 1024
const MAXIMUM_CAPTURED_RESPONSE_BYTES = 512 * 1024
const REQUEST_TIMEOUT_MILLISECONDS = 60_000
const MAXIMUM_INTERNAL_PRODUCTION_COST_MICROS = 50_000
const PUBLIC_RATE_USD_MICROS_PER_HOUR = 220_000
const API_ENDPOINT = 'https://api.elevenlabs.io/v1/speech-to-text?enable_logging=true' as const
const MODEL_ID = 'scribe_v2' as const
const LANGUAGE_CODE = 'eng' as const
const PUBLIC_RATE_SOURCE_URL = 'https://elevenlabs.io/pricing/api?price.section=speech_to_text' as const
const OWNER_STANDING_DIRECTIVE_ID = 'MS-OWNER-STANDING-IMPLEMENTATION-QA-20260718' as const
const OWNER_STANDING_DIRECTIVE_SHA256 =
  'b933153875768280382d9e9aecd1d904c4300518426bbe6ae52496c8ea0fff68' as const
const OWNER_AUTHORIZATION_STATEMENT_SHA256 =
  'cb26b67e69b5dde409462abaeeb34b1838c1561d58751314a8e78df1c39b672b' as const
const LIVE_SOURCE_RESULT_DIGEST =
  '0a52b67146d13c6d46551167e9eba05a7d3dc3d6695d2171caa28ed2977a1490' as const
const LIVE_SOURCE_AUDIO_SHA256 =
  '25f156baf1901c0c7d4d3d49c3ec10e2127f987a91a71261642887703af3e9b7' as const
const LIVE_SOURCE_AUDIO_BYTE_LENGTH = 159_704 as const
const LIVE_SOURCE_AUDIO_DURATION_MILLISECONDS = 9_920 as const
const REQUIRED_CONCEPT_TOKENS = Object.freeze([
  'dawn', 'city', 'breath', 'single', 'light', 'horizon', 'first', 'moment', 'story', 'waiting', 'told',
] as const)
const MAXIMUM_ACCEPTED_WORD_ERROR_RATE = 0.12

const REVIEWED_RUNTIME_RELATIVE_PATHS = Object.freeze([
  'server/motion-studio/speech-production/live-credential.ts',
  'server/motion-studio/speech-production/synthetic-acceptance-live-operator.ts',
  'server/motion-studio/speech-production/synthetic-acceptance-transcript-live-operator.ts',
  'server/motion-studio/speech-production/synthetic-acceptance-transcript-live-cli.ts',
] as const)

export const MOTION_STUDIO_SPEECH_SYNTHETIC_TRANSCRIPT_AUTHORIZATION_ID =
  'MS-012C2-SYNTHETIC-STT-EXT-002' as const

const EXPECTED_TEXT_DIGEST = sha256Text(MOTION_STUDIO_SPEECH_SYNTHETIC_ACCEPTANCE_TEXT)

export const MOTION_STUDIO_SPEECH_SYNTHETIC_TRANSCRIPT_LIVE_OPERATOR_PATHS = Object.freeze({
  packetRelativePath: PACKET_RELATIVE_PATH,
  authorizationRecordRelativePath: AUTHORIZATION_RECORD_RELATIVE_PATH,
  sourceResultRelativePath: SOURCE_RESULT_RELATIVE_PATH,
  sourcePrivateRootRelativePath: SOURCE_PRIVATE_ROOT_RELATIVE_PATH,
  sourceAudioFilename: SOURCE_AUDIO_FILENAME,
  privateRunRootRelativePath: PRIVATE_RUN_ROOT_RELATIVE_PATH,
  consumptionFilename: CONSUMPTION_FILENAME,
  evidenceFilename: EVIDENCE_FILENAME,
  failureFilename: FAILURE_FILENAME,
})

export type MotionStudioSpeechSyntheticTranscriptFailureClass =
  | 'credential_read_failed'
  | 'provider_dispatch_failed_outcome_unknown'
  | 'provider_http_rejected'
  | 'provider_response_too_large'
  | 'provider_response_invalid'
  | 'private_persistence_failed'

export interface MotionStudioSpeechSyntheticTranscriptLiveResultV1 {
  schemaVersion: 'motion-studio.speech-synthetic-transcript-live-result.v1'
  state: 'private_synthetic_independent_transcript_ready_human_listening_required'
  evidenceClass: 'authenticated_provider_synthetic_transcript' | 'private_local_fixture'
  authorizationId: typeof MOTION_STUDIO_SPEECH_SYNTHETIC_TRANSCRIPT_AUTHORIZATION_ID
  authorityPacketDigest: string
  ownerAuthorizationEvidenceId: string
  sourceLiveResultDigest: string
  sourceAudioSha256: string
  sourceAudioByteLength: number
  sourceAudioDurationMilliseconds: number
  expectedTextDigest: string
  modelId: typeof MODEL_ID
  languageCodeRequested: typeof LANGUAGE_CODE
  languageCodeDetected: string
  languageProbability?: number
  standardProviderRetentionAcceptedForSyntheticProof: true
  zeroRetentionClaimed: false
  credentialPayloadReadCount: 1
  providerRequestAttemptCount: 1
  providerRequestCompletedCount: 1
  providerTranscriptionCount: 1
  automaticRetryCount: 0
  automaticFallbackCount: 0
  purchaseCount: 0
  accountMutationCount: 0
  providerRequestIdDigest?: string
  transcriptDigest: string
  normalizedTranscriptDigest: string
  transcriptCharacterCount: number
  transcriptWordCount: number
  timestampedWordCount: number
  wordErrorDistance: number
  wordErrorRate: number
  requiredConceptCoverage: number
  exactNormalizedTextMatch: boolean
  semanticEvidenceReady: boolean
  publicListProviderCostMicros: number
  maximumAuthorizedInternalProductionCostMicros: typeof MAXIMUM_INTERNAL_PRODUCTION_COST_MICROS
  privateEvidenceRelativePath: typeof PRIVATE_RUN_ROOT_RELATIVE_PATH
  humanListeningReviewComplete: false
  takeSelectionAllowed: false
  timelineMutationAllowed: false
  customerBillingPerformed: false
  productReady: false
  externalBetaReady: false
  productionReady: false
  immutable: true
}

interface RuntimeSourceExpectation {
  resultDigest: string
  audioSha256: string
  audioByteLength: number
  audioDurationMilliseconds: number
}

interface RuntimeInput {
  evidenceClass: MotionStudioSpeechSyntheticTranscriptLiveResultV1['evidenceClass']
  source: RuntimeSourceExpectation
  createLoader(): MotionStudioSpeechSecretValueLoader
  fetchImplementation: typeof fetch
}

interface SafeProgress {
  lastPhase:
    | 'authority_consumed'
    | 'credential_read_started'
    | 'credential_read_completed'
    | 'provider_request_started'
    | 'provider_response_received'
  credentialPayloadReadCount: 0 | 1
  providerRequestAttemptCount: 0 | 1
  providerRequestCompletedCount: 0 | 1
  providerResponseStatus?: number
  providerRequestIdDigest?: string
}

interface ParsedTranscript {
  text: string
  languageCode: string
  languageProbability?: number
  words: Array<{
    text: string
    start: number
    end: number
    type: string
    speakerId?: string
    logprob?: number
  }>
  responseBodyDigest: string
}

export async function executeMotionStudioSpeechSyntheticTranscriptLiveOperator(input: {
  repositoryRoot: string
  now: string
}): Promise<MotionStudioSpeechSyntheticTranscriptLiveResultV1> {
  return executeOperator(input, {
    evidenceClass: 'authenticated_provider_synthetic_transcript',
    source: {
      resultDigest: LIVE_SOURCE_RESULT_DIGEST,
      audioSha256: LIVE_SOURCE_AUDIO_SHA256,
      audioByteLength: LIVE_SOURCE_AUDIO_BYTE_LENGTH,
      audioDurationMilliseconds: LIVE_SOURCE_AUDIO_DURATION_MILLISECONDS,
    },
    createLoader() {
      const loader = createMotionStudioSpeechGoogleSecretManagerValueLoader()
      assertMotionStudioSpeechLiveGoogleSecretManagerLoader(loader)
      return loader
    },
    fetchImplementation: SYSTEM_FETCH,
  })
}

export async function executeMotionStudioSpeechSyntheticTranscriptAuthorizedFixtureOperator(input: {
  repositoryRoot: string
  now: string
  source: RuntimeSourceExpectation
  fixtureLoaderOptions: MotionStudioSpeechGoogleSecretManagerFixtureLoaderOptions
  fixtureFetchImplementation: typeof fetch
}): Promise<MotionStudioSpeechSyntheticTranscriptLiveResultV1> {
  return executeOperator(input, {
    evidenceClass: 'private_local_fixture',
    source: input.source,
    createLoader() {
      const loader = createMotionStudioSpeechFixtureGoogleSecretManagerValueLoader(input.fixtureLoaderOptions)
      assertMotionStudioSpeechFixtureGoogleSecretManagerLoader(loader)
      return loader
    },
    fetchImplementation: input.fixtureFetchImplementation,
  })
}

async function executeOperator(
  input: { repositoryRoot: string; now: string },
  runtime: RuntimeInput,
): Promise<MotionStudioSpeechSyntheticTranscriptLiveResultV1> {
  const repositoryRoot = await realpath(input.repositoryRoot)
  const now = exactIso(input.now, 'synthetic transcript run time')
  const packetFile = await readRegularBoundedFile(
    inside(repositoryRoot, PACKET_RELATIVE_PATH), MAX_PACKET_BYTES, 'authority packet')
  const authorityPacketDigest = sha256Bytes(packetFile)
  const packet = validatePacket(parseJson(packetFile, 'authority packet'), authorityPacketDigest, now, runtime.source)
  const authorizationFile = await readRegularBoundedFile(
    inside(repositoryRoot, AUTHORIZATION_RECORD_RELATIVE_PATH),
    MAX_AUTHORIZATION_BYTES,
    'standing-directive authorization record',
  )
  const ownerAuthorizationEvidenceId = validateAuthorizationRecord(
    parseJson(authorizationFile, 'standing-directive authorization record'),
    authorityPacketDigest,
    now,
  )
  const directiveFile = await readRegularBoundedFile(
    inside(repositoryRoot, STANDING_DIRECTIVE_RELATIVE_PATH), 128 * 1024, 'standing directive')
  if (sha256Bytes(directiveFile) !== OWNER_STANDING_DIRECTIVE_SHA256) {
    blocked('Speech synthetic transcript standing directive changed after review.')
  }
  await verifyReviewedRuntimeFiles(repositoryRoot, packet.reviewedRuntimeFiles)

  const sourceResultFile = await readRegularBoundedFile(
    inside(repositoryRoot, SOURCE_RESULT_RELATIVE_PATH), MAX_SOURCE_RESULT_BYTES, 'source live result')
  const sourceResult = validateSourceResult(
    parseJson(sourceResultFile, 'source live result'), runtime.source)
  const sourceAudioPath = inside(repositoryRoot, join(SOURCE_PRIVATE_ROOT_RELATIVE_PATH, SOURCE_AUDIO_FILENAME))
  const sourceAudio = await readOwnerPrivateFile(
    sourceAudioPath,
    MAX_SOURCE_AUDIO_BYTES,
    'source synthetic audio',
    runtime.source.audioSha256,
    runtime.source.audioByteLength,
  )
  const binding = createMotionStudioSpeechSecretBinding({
    credentialReferenceId: 'credential-elevenlabs-synthetic-transcript-001',
    secretLocatorId: MOTION_STUDIO_SPEECH_ELEVENLABS_SECRET_LOCATOR_ID,
    secretVersionReference: MOTION_STUDIO_SPEECH_ELEVENLABS_SECRET_VERSION,
  })
  if (binding.bindingDigest !== packet.credentialBindingDigest) {
    blocked('Speech synthetic transcript credential binding does not match its authority packet.')
  }

  const privateRoot = inside(repositoryRoot, PRIVATE_RUN_ROOT_RELATIVE_PATH)
  await createPrivateRunRoot(privateRoot)
  const consumption = Object.freeze({
    schemaVersion: 'motion-studio.speech-synthetic-transcript-authority-consumption.v1' as const,
    state: 'single_use_authority_consumed_before_credential_read' as const,
    authorizationId: MOTION_STUDIO_SPEECH_SYNTHETIC_TRANSCRIPT_AUTHORIZATION_ID,
    authorityPacketDigest,
    authorizationRecordDigest: sha256Bytes(authorizationFile),
    ownerAuthorizationEvidenceId,
    sourceLiveResultDigest: sourceResult.resultDigest,
    sourceAudioSha256: sourceAudio.sha256,
    sourceAudioByteLength: sourceAudio.byteLength,
    expectedTextDigest: EXPECTED_TEXT_DIGEST,
    credentialBindingDigest: binding.bindingDigest,
    standardProviderRetentionAcceptedForSyntheticProof: true as const,
    zeroRetentionClaimed: false as const,
    credentialPayloadReadCountAtConsumption: 0 as const,
    providerRequestAttemptCountAtConsumption: 0 as const,
    providerTranscriptionCountAtConsumption: 0 as const,
    consumedAt: now,
    immutable: true as const,
  })
  await writePrivateJsonExclusive(
    join(privateRoot, CONSUMPTION_FILENAME),
    consumption,
    'Speech synthetic transcript authority was already consumed before credential access.',
  )

  const progress: SafeProgress = {
    lastPhase: 'authority_consumed',
    credentialPayloadReadCount: 0,
    providerRequestAttemptCount: 0,
    providerRequestCompletedCount: 0,
  }
  let failureClass: MotionStudioSpeechSyntheticTranscriptFailureClass = 'credential_read_failed'
  try {
    const loader = runtime.createLoader()
    progress.lastPhase = 'credential_read_started'
    const rawCredential = await loader.access({
      secretLocatorId: MOTION_STUDIO_SPEECH_ELEVENLABS_SECRET_LOCATOR_ID,
      secretVersionReference: MOTION_STUDIO_SPEECH_ELEVENLABS_SECRET_VERSION,
    })
    const apiKey = validateSecretValue(rawCredential)
    progress.credentialPayloadReadCount = 1
    progress.lastPhase = 'credential_read_completed'

    const requestDescriptor = Object.freeze({
      endpoint: API_ENDPOINT,
      modelId: MODEL_ID,
      languageCode: LANGUAGE_CODE,
      tagAudioEvents: false as const,
      diarize: false as const,
      noVerbatim: false as const,
      sourceAudioSha256: sourceAudio.sha256,
      sourceAudioByteLength: sourceAudio.byteLength,
      standardProviderRetention: true as const,
    })
    const uploadBytes = new Uint8Array(sourceAudio.bytes.byteLength)
    uploadBytes.set(sourceAudio.bytes)
    const form = new FormData()
    form.set('file', new Blob([uploadBytes.buffer], { type: 'audio/mpeg' }), SOURCE_AUDIO_FILENAME)
    form.set('model_id', MODEL_ID)
    form.set('language_code', LANGUAGE_CODE)
    form.set('tag_audio_events', 'false')
    form.set('diarize', 'false')
    form.set('no_verbatim', 'false')

    failureClass = 'provider_dispatch_failed_outcome_unknown'
    progress.providerRequestAttemptCount = 1
    progress.lastPhase = 'provider_request_started'
    const response = await fetchOnceBounded({
      fetchImplementation: runtime.fetchImplementation,
      apiKey,
      body: form,
    })
    progress.providerRequestCompletedCount = 1
    progress.providerResponseStatus = response.status
    progress.lastPhase = 'provider_response_received'
    const providerRequestId = response.headers.get('request-id') ??
      response.headers.get('x-request-id') ?? response.headers.get('x-trace-id')
    if (providerRequestId) progress.providerRequestIdDigest = sha256Text(providerRequestId)
    if (!response.ok) {
      failureClass = 'provider_http_rejected'
      await response.body?.cancel().catch(() => undefined)
      blocked('Speech synthetic transcript provider returned a non-success response; the lane is terminal.')
    }

    failureClass = 'provider_response_too_large'
    const responseBytes = await readResponseBytesBounded(response, MAXIMUM_CAPTURED_RESPONSE_BYTES)
    failureClass = 'provider_response_invalid'
    const transcript = parseTranscriptResponse(responseBytes)
    const semantic = evaluateTranscriptSemantics(transcript)
    const publicListProviderCostMicros = calculatePublicListCostMicros(runtime.source.audioDurationMilliseconds)
    if (publicListProviderCostMicros > MAXIMUM_INTERNAL_PRODUCTION_COST_MICROS) {
      blocked('Speech synthetic transcript public-list usage exceeds its internal-cost ceiling.')
    }

    const evidenceBase = {
      schemaVersion: 'motion-studio.speech-synthetic-transcript-private-evidence.v1' as const,
      state: 'private_synthetic_independent_transcript_ready_human_listening_required' as const,
      evidenceClass: runtime.evidenceClass,
      authorizationId: MOTION_STUDIO_SPEECH_SYNTHETIC_TRANSCRIPT_AUTHORIZATION_ID,
      authorityPacketDigest,
      ownerAuthorizationEvidenceId,
      source: Object.freeze({
        liveResultDigest: sourceResult.resultDigest,
        audioSha256: sourceAudio.sha256,
        audioByteLength: sourceAudio.byteLength,
        audioDurationMilliseconds: runtime.source.audioDurationMilliseconds,
        expectedTextDigest: EXPECTED_TEXT_DIGEST,
      }),
      credentialBindingDigest: binding.bindingDigest,
      requestDescriptor,
      requestDescriptorDigest: sha256CanonicalJson(requestDescriptor),
      modelId: MODEL_ID,
      standardProviderRetentionAcceptedForSyntheticProof: true as const,
      zeroRetentionClaimed: false as const,
      responseBodyDigest: transcript.responseBodyDigest,
      ...(progress.providerRequestIdDigest
        ? { providerRequestIdDigest: progress.providerRequestIdDigest }
        : {}),
      transcript: Object.freeze({
        text: transcript.text,
        transcriptDigest: sha256Text(transcript.text),
        normalizedTextDigest: semantic.normalizedTranscriptDigest,
        languageCode: transcript.languageCode,
        ...(transcript.languageProbability === undefined
          ? {}
          : { languageProbability: transcript.languageProbability }),
        words: transcript.words,
      }),
      semantic,
      costEvidence: Object.freeze({
        method: 'source_duration_times_official_public_scribe_v2_hourly_rate' as const,
        sourceUrl: PUBLIC_RATE_SOURCE_URL,
        currency: 'USD' as const,
        publicRateUsdMicrosPerHour: PUBLIC_RATE_USD_MICROS_PER_HOUR,
        sourceAudioDurationMilliseconds: runtime.source.audioDurationMilliseconds,
        publicListProviderCostMicros,
        maximumAuthorizedInternalProductionCostMicros: MAXIMUM_INTERNAL_PRODUCTION_COST_MICROS,
        exactAccountInvoiceClaimed: false as const,
        customerPricingIncluded: false as const,
        customerCreditsIncluded: false as const,
        customerBillingPerformed: false as const,
      }),
      usage: Object.freeze({
        credentialPayloadReadCount: 1 as const,
        providerRequestAttemptCount: 1 as const,
        providerRequestCompletedCount: 1 as const,
        providerTranscriptionCount: 1 as const,
        automaticRetryCount: 0 as const,
        automaticFallbackCount: 0 as const,
        purchaseCount: 0 as const,
        accountMutationCount: 0 as const,
      }),
      boundaries: Object.freeze({
        syntheticAcceptanceOnly: true as const,
        userContentUsed: false as const,
        humanListeningReviewComplete: false as const,
        takeSelectionAllowed: false as const,
        timelineMutationAllowed: false as const,
        renderAllowed: false as const,
        exportAllowed: false as const,
        deploymentAllowed: false as const,
        publicDeliveryAllowed: false as const,
        productReady: false as const,
        externalBetaReady: false as const,
        productionReady: false as const,
      }),
      capturedAt: now,
      immutable: true as const,
    }
    const evidence = Object.freeze({
      ...evidenceBase,
      evidenceDigest: sha256CanonicalJson(evidenceBase),
    })
    failureClass = 'private_persistence_failed'
    await writePrivateJsonExclusive(
      join(privateRoot, EVIDENCE_FILENAME),
      evidence,
      'Speech synthetic transcript private evidence already exists.',
    )

    return Object.freeze({
      schemaVersion: 'motion-studio.speech-synthetic-transcript-live-result.v1' as const,
      state: 'private_synthetic_independent_transcript_ready_human_listening_required' as const,
      evidenceClass: runtime.evidenceClass,
      authorizationId: MOTION_STUDIO_SPEECH_SYNTHETIC_TRANSCRIPT_AUTHORIZATION_ID,
      authorityPacketDigest,
      ownerAuthorizationEvidenceId,
      sourceLiveResultDigest: sourceResult.resultDigest,
      sourceAudioSha256: sourceAudio.sha256,
      sourceAudioByteLength: sourceAudio.byteLength,
      sourceAudioDurationMilliseconds: runtime.source.audioDurationMilliseconds,
      expectedTextDigest: EXPECTED_TEXT_DIGEST,
      modelId: MODEL_ID,
      languageCodeRequested: LANGUAGE_CODE,
      languageCodeDetected: transcript.languageCode,
      ...(transcript.languageProbability === undefined
        ? {}
        : { languageProbability: transcript.languageProbability }),
      standardProviderRetentionAcceptedForSyntheticProof: true as const,
      zeroRetentionClaimed: false as const,
      credentialPayloadReadCount: 1 as const,
      providerRequestAttemptCount: 1 as const,
      providerRequestCompletedCount: 1 as const,
      providerTranscriptionCount: 1 as const,
      automaticRetryCount: 0 as const,
      automaticFallbackCount: 0 as const,
      purchaseCount: 0 as const,
      accountMutationCount: 0 as const,
      ...(progress.providerRequestIdDigest
        ? { providerRequestIdDigest: progress.providerRequestIdDigest }
        : {}),
      transcriptDigest: sha256Text(transcript.text),
      normalizedTranscriptDigest: semantic.normalizedTranscriptDigest,
      transcriptCharacterCount: transcript.text.length,
      transcriptWordCount: semantic.actualTokenCount,
      timestampedWordCount: transcript.words.filter((word) => word.type === 'word').length,
      wordErrorDistance: semantic.wordErrorDistance,
      wordErrorRate: semantic.wordErrorRate,
      requiredConceptCoverage: semantic.requiredConceptCoverage,
      exactNormalizedTextMatch: semantic.exactNormalizedTextMatch,
      semanticEvidenceReady: semantic.semanticEvidenceReady,
      publicListProviderCostMicros,
      maximumAuthorizedInternalProductionCostMicros: MAXIMUM_INTERNAL_PRODUCTION_COST_MICROS,
      privateEvidenceRelativePath: PRIVATE_RUN_ROOT_RELATIVE_PATH,
      humanListeningReviewComplete: false as const,
      takeSelectionAllowed: false as const,
      timelineMutationAllowed: false as const,
      customerBillingPerformed: false as const,
      productReady: false as const,
      externalBetaReady: false as const,
      productionReady: false as const,
      immutable: true as const,
    })
  } catch (error) {
    await writePrivateJsonBestEffort(join(privateRoot, FAILURE_FILENAME), {
      schemaVersion: 'motion-studio.speech-synthetic-transcript-terminal-failure.v1',
      state: 'single_use_lane_consumed_terminal_no_retry_or_fallback',
      authorizationId: MOTION_STUDIO_SPEECH_SYNTHETIC_TRANSCRIPT_AUTHORIZATION_ID,
      authorityPacketDigest,
      failureReasonClass: failureClass,
      safeProgress: progress,
      credentialPersisted: false,
      sourceAudioCopied: false,
      rawProviderResponsePersisted: false,
      transcriptProjectedToBrowser: false,
      retryAllowed: false,
      fallbackAllowed: false,
      takeSelectionAllowed: false,
      timelineMutationAllowed: false,
      customerBillingPerformed: false,
      productReady: false,
      productionReady: false,
      failedAt: now,
      immutable: true,
    })
    throw error
  }
}

function validatePacket(
  value: unknown,
  authorityPacketDigest: string,
  now: string,
  source: RuntimeSourceExpectation,
): { credentialBindingDigest: string; reviewedRuntimeFiles: Array<Record<string, unknown>> } {
  const packet = object(value, 'authority packet')
  exact(packet.schemaVersion, 'motion-studio.speech-synthetic-transcript-live-authorization.v1', 'packet schema')
  exact(packet.authorizationId, MOTION_STUDIO_SPEECH_SYNTHETIC_TRANSCRIPT_AUTHORIZATION_ID, 'packet authorization')
  exact(packet.status, 'standing_directive_authorization_ready_not_executed', 'packet status')
  exact(packet.singleUse, true, 'packet single-use boundary')
  exact(packet.immutable, true, 'packet immutability')
  const validFrom = exactIso(string(packet.validFrom, 'packet validFrom'), 'packet validFrom')
  const expiresAt = exactIso(string(packet.expiresAt, 'packet expiresAt'), 'packet expiresAt')
  if (Date.parse(now) < Date.parse(validFrom) || Date.parse(now) > Date.parse(expiresAt)) {
    blocked('Speech synthetic transcript authority is outside its frozen execution window.')
  }
  const baseline = object(packet.reviewedLocalBaseline, 'reviewed baseline')
  exact(baseline.standingDirectiveId, OWNER_STANDING_DIRECTIVE_ID, 'standing directive ID')
  exact(baseline.standingDirectiveSha256, OWNER_STANDING_DIRECTIVE_SHA256, 'standing directive digest')
  exact(baseline.ownerAuthorizationStatementSha256,
    OWNER_AUTHORIZATION_STATEMENT_SHA256, 'owner authorization statement digest')
  gitObjectId(string(baseline.implementationCommit, 'implementation commit'), 'implementation commit')
  gitObjectId(string(baseline.implementationTree, 'implementation tree'), 'implementation tree')

  const sourceEvidence = object(packet.sourceEvidence, 'source evidence')
  exact(sourceEvidence.trackedResultRelativePath, SOURCE_RESULT_RELATIVE_PATH, 'source result path')
  exact(sourceEvidence.trackedResultDigest, source.resultDigest, 'source result digest')
  exact(sourceEvidence.privateRootRelativePath, SOURCE_PRIVATE_ROOT_RELATIVE_PATH, 'source private root')
  exact(sourceEvidence.audioFilename, SOURCE_AUDIO_FILENAME, 'source audio filename')
  exact(sourceEvidence.audioSha256, source.audioSha256, 'source audio digest')
  exact(sourceEvidence.audioByteLength, source.audioByteLength, 'source audio length')
  exact(sourceEvidence.audioDurationMilliseconds,
    source.audioDurationMilliseconds, 'source audio duration')
  exact(sourceEvidence.expectedTextDigest, EXPECTED_TEXT_DIGEST, 'expected text digest')
  exact(sourceEvidence.syntheticNonPersonal, true, 'synthetic-only source')
  exact(sourceEvidence.userContentUsed, false, 'user-content source boundary')

  const credential = object(packet.credential, 'credential boundary')
  exact(credential.provider, 'google_secret_manager', 'credential provider')
  exact(credential.projectId, MOTION_STUDIO_SPEECH_GOOGLE_CLOUD_PROJECT_ID, 'credential project')
  exact(credential.secretId, MOTION_STUDIO_SPEECH_ELEVENLABS_SECRET_LOCATOR_ID, 'credential secret')
  exact(credential.numericVersion, MOTION_STUDIO_SPEECH_ELEVENLABS_SECRET_VERSION, 'credential version')
  const credentialBindingDigest = sha(string(credential.bindingDigest, 'credential binding'), 'credential binding')
  exact(credential.maximumPayloadReads, 1, 'credential read ceiling')
  exact(credential.environmentFallbackAllowed, false, 'credential fallback boundary')

  const request = object(packet.request, 'request boundary')
  exact(request.method, 'POST', 'request method')
  exact(request.endpoint, API_ENDPOINT, 'request endpoint')
  exact(request.modelId, MODEL_ID, 'request model')
  exact(request.languageCode, LANGUAGE_CODE, 'request language')
  exact(request.maximumHttpRequests, 1, 'request count ceiling')
  exact(request.maximumRedirects, 0, 'redirect ceiling')
  exact(request.timeoutMilliseconds, REQUEST_TIMEOUT_MILLISECONDS, 'request timeout')
  exact(request.maximumUploadBytes, MAX_SOURCE_AUDIO_BYTES, 'upload ceiling')
  exact(request.maximumCapturedResponseBytes,
    MAXIMUM_CAPTURED_RESPONSE_BYTES, 'response ceiling')
  exact(request.automaticRetryAllowed, false, 'retry boundary')
  exact(request.automaticFallbackAllowed, false, 'fallback boundary')

  const retention = object(packet.retention, 'retention boundary')
  exact(retention.enableLogging, true, 'retention logging mode')
  exact(retention.mode, 'standard_provider_retention', 'retention mode')
  exact(retention.syntheticAcceptanceOnly, true, 'retention synthetic boundary')
  exact(retention.zeroRetentionClaimed, false, 'zero-retention claim')

  const cost = object(packet.cost, 'cost boundary')
  exact(cost.currency, 'USD', 'cost currency')
  exact(cost.publicRateSourceUrl, PUBLIC_RATE_SOURCE_URL, 'cost source')
  exact(cost.publicRateUsdMicrosPerHour, PUBLIC_RATE_USD_MICROS_PER_HOUR, 'public rate')
  exact(cost.expectedPublicListCostMicros,
    calculatePublicListCostMicros(source.audioDurationMilliseconds), 'expected public cost')
  exact(cost.maximumInternalProductionCostMicros,
    MAXIMUM_INTERNAL_PRODUCTION_COST_MICROS, 'cost ceiling')
  exact(cost.customerBillingAllowed, false, 'customer billing boundary')

  const reviewedRuntimeFiles = array(packet.reviewedRuntimeFiles, 'reviewed runtime files')
    .map((entry) => object(entry, 'reviewed runtime file'))
  if (reviewedRuntimeFiles.length !== REVIEWED_RUNTIME_RELATIVE_PATHS.length) {
    blocked('Speech synthetic transcript reviewed runtime file count changed.')
  }
  for (const [index, expectedPath] of REVIEWED_RUNTIME_RELATIVE_PATHS.entries()) {
    const entry = reviewedRuntimeFiles[index]!
    exact(entry.relativePath, expectedPath, 'reviewed runtime path')
    positiveInteger(entry.byteLength, 'reviewed runtime byte length')
    sha(string(entry.sha256, 'reviewed runtime digest'), 'reviewed runtime digest')
  }
  if (!SHA256.test(authorityPacketDigest)) blocked('Speech synthetic transcript packet digest is invalid.')
  return { credentialBindingDigest, reviewedRuntimeFiles }
}

function validateAuthorizationRecord(value: unknown, packetDigest: string, now: string): string {
  const record = object(value, 'authorization record')
  exact(record.schemaVersion,
    'motion-studio.speech-synthetic-transcript-live-authorization-record.v1', 'authorization schema')
  exact(record.status, 'standing_directive_authorized_unconsumed', 'authorization status')
  exact(record.authorizationId, MOTION_STUDIO_SPEECH_SYNTHETIC_TRANSCRIPT_AUTHORIZATION_ID,
    'authorization ID')
  exact(record.authorityPacketDigest, packetDigest, 'authority packet digest')
  exact(record.singleUse, true, 'authorization single-use boundary')
  exact(record.standingDirectiveId, OWNER_STANDING_DIRECTIVE_ID, 'authorization directive')
  exact(record.standingDirectiveSha256, OWNER_STANDING_DIRECTIVE_SHA256, 'authorization directive digest')
  exact(record.ownerAuthorizationStatementSha256,
    OWNER_AUTHORIZATION_STATEMENT_SHA256, 'authorization statement digest')
  exact(record.maximumSecretPayloadReads, 1, 'authorization secret-read ceiling')
  exact(record.maximumHttpRequests, 1, 'authorization request ceiling')
  exact(record.maximumCapturedResponseBytes,
    MAXIMUM_CAPTURED_RESPONSE_BYTES, 'authorization response ceiling')
  exact(record.maximumInternalProductionCostMicros,
    MAXIMUM_INTERNAL_PRODUCTION_COST_MICROS, 'authorization cost ceiling')
  exact(record.syntheticAcceptanceOnly, true, 'authorization synthetic boundary')
  exact(record.standardProviderRetentionAccepted, true, 'authorization retention boundary')
  exact(record.zeroRetentionClaimed, false, 'authorization zero-retention claim')
  exact(record.automaticRetryAllowed, false, 'authorization retry boundary')
  exact(record.automaticFallbackAllowed, false, 'authorization fallback boundary')
  exact(record.purchaseAllowed, false, 'authorization purchase boundary')
  exact(record.accountMutationAllowed, false, 'authorization mutation boundary')
  exact(record.customerBillingAllowed, false, 'authorization billing boundary')
  exact(record.timelineMutationAllowed, false, 'authorization timeline boundary')
  exact(record.renderAllowed, false, 'authorization render boundary')
  exact(record.exportAllowed, false, 'authorization export boundary')
  exact(record.deploymentAllowed, false, 'authorization deployment boundary')
  exact(record.publicDeliveryAllowed, false, 'authorization public boundary')
  exact(record.immutable, true, 'authorization immutability')
  const recordedAt = exactIso(string(record.recordedAt, 'authorization time'), 'authorization time')
  if (Date.parse(recordedAt) > Date.parse(now)) {
    blocked('Speech synthetic transcript authorization record is from the future.')
  }
  const evidenceId = string(record.ownerAuthorizationEvidenceId, 'authorization evidence ID')
  if (!/^owner-standing-storytelling-self-qa-[a-z0-9-]+$/u.test(evidenceId)) {
    blocked('Speech synthetic transcript authorization evidence ID is invalid.')
  }
  return evidenceId
}

function validateSourceResult(value: unknown, source: RuntimeSourceExpectation): { resultDigest: string } {
  const result = object(value, 'source live result')
  const resultDigest = sha(string(result.resultDigest, 'source result digest'), 'source result digest')
  const base = Object.fromEntries(Object.entries(result).filter(([key]) => key !== 'resultDigest'))
  exact(resultDigest, sha256CanonicalJson(base), 'source result canonical digest')
  exact(resultDigest, source.resultDigest, 'source result pinned digest')
  exact(result.schemaVersion,
    'motion-studio.speech-synthetic-acceptance-tracked-result.v1', 'source result schema')
  exact(result.authorizationId, 'MS-012C2-SYNTHETIC-TTS-EXT-001', 'source authorization')
  const privateEvidence = object(result.privateEvidence, 'source private evidence')
  const audio = object(privateEvidence.audio, 'source audio descriptor')
  exact(audio.sha256, source.audioSha256, 'source audio result digest')
  exact(audio.byteLength, source.audioByteLength, 'source audio result length')
  const usage = object(result.usage, 'source usage')
  exact(usage.providerGenerationCount, 1, 'source provider generation count')
  const readiness = object(result.readiness, 'source readiness')
  exact(readiness.candidateSelected, false, 'source selection boundary')
  exact(readiness.productReady, false, 'source product boundary')
  exact(readiness.productionReady, false, 'source production boundary')
  exact(result.immutable, true, 'source result immutability')
  return { resultDigest }
}

async function verifyReviewedRuntimeFiles(
  repositoryRoot: string,
  files: Array<Record<string, unknown>>,
): Promise<void> {
  for (const entry of files) {
    const relativePath = string(entry.relativePath, 'reviewed runtime path')
    const expectedByteLength = positiveInteger(entry.byteLength, 'reviewed runtime byte length')
    const expectedDigest = sha(string(entry.sha256, 'reviewed runtime digest'), 'reviewed runtime digest')
    const bytes = await readRegularBoundedFile(
      inside(repositoryRoot, relativePath), 2 * 1024 * 1024, `reviewed runtime ${relativePath}`)
    if (bytes.byteLength !== expectedByteLength || sha256Bytes(bytes) !== expectedDigest) {
      blocked(`Speech synthetic transcript reviewed runtime changed: ${relativePath}.`)
    }
  }
}

async function fetchOnceBounded(input: {
  fetchImplementation: typeof fetch
  apiKey: string
  body: FormData
}): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MILLISECONDS)
  try {
    return await input.fetchImplementation(API_ENDPOINT, {
      method: 'POST',
      headers: { 'xi-api-key': input.apiKey },
      body: input.body,
      redirect: 'manual',
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeout)
  }
}

async function readResponseBytesBounded(response: Response, maximumBytes: number): Promise<Buffer> {
  const contentLength = response.headers.get('content-length')
  if (contentLength && (!/^\d+$/u.test(contentLength) || Number(contentLength) > maximumBytes)) {
    await response.body?.cancel().catch(() => undefined)
    blocked('Speech synthetic transcript response exceeds its captured-byte ceiling.')
  }
  if (!response.body) blocked('Speech synthetic transcript response body is unavailable.')
  const reader = response.body.getReader()
  const chunks: Buffer[] = []
  let total = 0
  while (true) {
    const next = await reader.read()
    if (next.done) break
    const chunk = Buffer.from(next.value)
    total += chunk.byteLength
    if (total > maximumBytes) {
      await reader.cancel().catch(() => undefined)
      blocked('Speech synthetic transcript response exceeded its captured-byte ceiling.')
    }
    chunks.push(chunk)
  }
  if (total < 2) blocked('Speech synthetic transcript response is empty.')
  return Buffer.concat(chunks, total)
}

function parseTranscriptResponse(bytes: Buffer): ParsedTranscript {
  const responseBodyDigest = sha256Bytes(bytes)
  const value = object(parseJson(bytes, 'provider transcript response'), 'provider transcript response')
  const text = string(value.text, 'provider transcript text')
  if (text.length > 16_384) blocked('Speech synthetic transcript text exceeds its private bound.')
  const languageCode = string(value.language_code, 'provider transcript language code')
  if (!/^[a-z]{2,3}(?:-[A-Za-z0-9]+)?$/u.test(languageCode)) {
    blocked('Speech synthetic transcript language code is invalid.')
  }
  const languageProbability = optionalProbability(value.language_probability, 'language probability')
  const rawWords = array(value.words, 'provider transcript words')
  if (rawWords.length < 1 || rawWords.length > 1_024) {
    blocked('Speech synthetic transcript word timing count is outside its bound.')
  }
  let previousEnd = 0
  const words = rawWords.map((rawWord) => {
    const word = object(rawWord, 'provider transcript word')
    const wordText = string(word.text, 'provider transcript word text')
    const start = finiteNumber(word.start, 'provider transcript word start')
    const end = finiteNumber(word.end, 'provider transcript word end')
    if (start < 0 || end < start || start + 0.05 < previousEnd) {
      blocked('Speech synthetic transcript word timings are invalid or non-monotonic.')
    }
    previousEnd = Math.max(previousEnd, end)
    const type = string(word.type, 'provider transcript word type')
    const speakerId = optionalString(word.speaker_id)
    const logprob = optionalFiniteNumber(word.logprob)
    return Object.freeze({
      text: wordText,
      start,
      end,
      type,
      ...(speakerId ? { speakerId } : {}),
      ...(logprob === undefined ? {} : { logprob }),
    })
  })
  return Object.freeze({ text, languageCode, ...(languageProbability === undefined
    ? {}
    : { languageProbability }), words, responseBodyDigest })
}

function evaluateTranscriptSemantics(transcript: ParsedTranscript) {
  const expectedNormalized = normalizeSpeechText(MOTION_STUDIO_SPEECH_SYNTHETIC_ACCEPTANCE_TEXT)
  const actualNormalized = normalizeSpeechText(transcript.text)
  const expectedTokens = expectedNormalized.split(' ').filter(Boolean)
  const actualTokens = actualNormalized.split(' ').filter(Boolean)
  const wordErrorDistance = levenshtein(expectedTokens, actualTokens)
  const wordErrorRate = Number((wordErrorDistance / Math.max(1, expectedTokens.length)).toFixed(6))
  const actualTokenSet = new Set(actualTokens)
  const matchedConceptCount = REQUIRED_CONCEPT_TOKENS.filter((token) => actualTokenSet.has(token)).length
  const requiredConceptCoverage = Number((matchedConceptCount / REQUIRED_CONCEPT_TOKENS.length).toFixed(6))
  const exactNormalizedTextMatch = expectedNormalized === actualNormalized
  const languageAccepted = ['en', 'eng'].includes(transcript.languageCode.toLowerCase()) &&
    (transcript.languageProbability === undefined || transcript.languageProbability >= 0.8)
  const timestampedWords = transcript.words.filter((word) => word.type === 'word')
  const timestampsFitSource = timestampedWords.length > 0 &&
    timestampedWords.every((word) => word.end <= LIVE_SOURCE_AUDIO_DURATION_MILLISECONDS / 1_000 + 0.25)
  const semanticEvidenceReady = languageAccepted && timestampsFitSource &&
    wordErrorRate <= MAXIMUM_ACCEPTED_WORD_ERROR_RATE && requiredConceptCoverage === 1
  return Object.freeze({
    expectedNormalizedTextDigest: sha256Text(expectedNormalized),
    normalizedTranscriptDigest: sha256Text(actualNormalized),
    expectedTokenCount: expectedTokens.length,
    actualTokenCount: actualTokens.length,
    wordErrorDistance,
    wordErrorRate,
    maximumAcceptedWordErrorRate: MAXIMUM_ACCEPTED_WORD_ERROR_RATE,
    requiredConceptTokenCount: REQUIRED_CONCEPT_TOKENS.length,
    matchedConceptCount,
    requiredConceptCoverage,
    exactNormalizedTextMatch,
    languageAccepted,
    timestampsFitSource,
    independentTranscriptEvaluated: true as const,
    humanListeningReviewComplete: false as const,
    semanticEvidenceReady,
  })
}

function normalizeSpeechText(value: string): string {
  return value.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}']+/gu, ' ')
    .replace(/^\s+|\s+$/gu, '').replace(/\s+/gu, ' ')
}

function levenshtein(expected: string[], actual: string[]): number {
  const previous = Array.from({ length: actual.length + 1 }, (_, index) => index)
  for (let expectedIndex = 1; expectedIndex <= expected.length; expectedIndex += 1) {
    const current = [expectedIndex]
    for (let actualIndex = 1; actualIndex <= actual.length; actualIndex += 1) {
      const substitution = previous[actualIndex - 1]! +
        (expected[expectedIndex - 1] === actual[actualIndex - 1] ? 0 : 1)
      current[actualIndex] = Math.min(
        current[actualIndex - 1]! + 1,
        previous[actualIndex]! + 1,
        substitution,
      )
    }
    for (let index = 0; index < current.length; index += 1) previous[index] = current[index]!
  }
  return previous[actual.length]!
}

function calculatePublicListCostMicros(durationMilliseconds: number): number {
  return Math.ceil((durationMilliseconds * PUBLIC_RATE_USD_MICROS_PER_HOUR) / 3_600_000)
}

async function createPrivateRunRoot(path: string): Promise<void> {
  try {
    await mkdir(path, { mode: 0o700 })
    await chmod(path, 0o700)
  } catch {
    blocked('Speech synthetic transcript lane is already consumed or unavailable.')
  }
  const metadata = await lstat(path)
  if (!metadata.isDirectory() || metadata.isSymbolicLink() || (metadata.mode & 0o777) !== 0o700 ||
    (typeof process.getuid === 'function' && metadata.uid !== process.getuid())) {
    blocked('Speech synthetic transcript private root is not owner-private.')
  }
}

async function writePrivateJsonExclusive(path: string, value: unknown, existingMessage: string): Promise<void> {
  try {
    await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx', mode: 0o600 })
  } catch {
    blocked(existingMessage)
  }
  await readOwnerPrivateFile(path, 2 * 1024 * 1024, 'private JSON evidence')
}

async function writePrivateJsonBestEffort(path: string, value: unknown): Promise<void> {
  try {
    await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx', mode: 0o600 })
  } catch {
    // The create-only consumption record is the terminal single-use fact.
  }
}

async function readOwnerPrivateFile(
  path: string,
  maximumBytes: number,
  label: string,
  expectedDigest?: string,
  expectedByteLength?: number,
): Promise<{ bytes: Buffer; byteLength: number; sha256: string }> {
  let metadata
  let canonicalPath
  try {
    ;[metadata, canonicalPath] = await Promise.all([lstat(path), realpath(path)])
  } catch {
    blocked(`Speech synthetic transcript ${label} is unavailable.`)
  }
  if (!metadata.isFile() || metadata.isSymbolicLink() || canonicalPath !== path ||
    (metadata.mode & 0o777) !== 0o600 || metadata.size < 1 || metadata.size > maximumBytes ||
    (typeof process.getuid === 'function' && metadata.uid !== process.getuid())) {
    blocked(`Speech synthetic transcript ${label} is not one owner-private regular file.`)
  }
  const bytes = await readFile(path)
  const digest = sha256Bytes(bytes)
  if (bytes.byteLength !== metadata.size ||
    (expectedDigest !== undefined && digest !== expectedDigest) ||
    (expectedByteLength !== undefined && bytes.byteLength !== expectedByteLength)) {
    blocked(`Speech synthetic transcript ${label} changed during verification.`)
  }
  return Object.freeze({ bytes, byteLength: bytes.byteLength, sha256: digest })
}

async function readRegularBoundedFile(path: string, maximumBytes: number, label: string): Promise<Buffer> {
  let metadata
  let canonicalPath
  try {
    ;[metadata, canonicalPath] = await Promise.all([lstat(path), realpath(path)])
  } catch {
    blocked(`Speech synthetic transcript ${label} is unavailable.`)
  }
  if (!metadata.isFile() || metadata.isSymbolicLink() || canonicalPath !== path ||
    metadata.size < 2 || metadata.size > maximumBytes) {
    blocked(`Speech synthetic transcript ${label} is not one bounded regular file.`)
  }
  const bytes = await readFile(path)
  if (bytes.byteLength !== metadata.size || bytes.byteLength > maximumBytes) {
    blocked(`Speech synthetic transcript ${label} changed during its bounded read.`)
  }
  return bytes
}

function validateSecretValue(raw: Buffer | Uint8Array | string): string {
  const value = (typeof raw === 'string' ? raw : Buffer.from(raw).toString('utf8')).trim()
  if (value.length < 16 || value.length > 4_096 || /\s/u.test(value)) {
    blocked('Speech synthetic transcript credential payload is malformed.')
  }
  return value
}

function inside(root: string, relativePath: string): string {
  if (!relativePath || relativePath.includes('\0') || relativePath.startsWith('/') ||
    relativePath.split(/[\\/]/u).includes('..')) {
    blocked('Speech synthetic transcript path is unsafe.')
  }
  const path = resolve(root, relativePath)
  if (!path.startsWith(`${root}${sep}`)) blocked('Speech synthetic transcript path escaped its repository root.')
  return path
}

function parseJson(bytes: Buffer, label: string): unknown {
  try {
    return JSON.parse(bytes.toString('utf8'))
  } catch {
    blocked(`Speech synthetic transcript ${label} is malformed JSON.`)
  }
}

function object(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    blocked(`Speech synthetic transcript ${label} is malformed.`)
  }
  return value as Record<string, unknown>
}

function array(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) blocked(`Speech synthetic transcript ${label} is malformed.`)
  return value
}

function string(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.length < 1 || value.length > 16_384) {
    blocked(`Speech synthetic transcript ${label} is malformed.`)
  }
  return value
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 && value.length <= 512 ? value : undefined
}

function finiteNumber(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    blocked(`Speech synthetic transcript ${label} is malformed.`)
  }
  return value
}

function optionalFiniteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function optionalProbability(value: unknown, label: string): number | undefined {
  if (value === undefined || value === null) return undefined
  const number = finiteNumber(value, label)
  if (number < 0 || number > 1) blocked(`Speech synthetic transcript ${label} is outside 0..1.`)
  return number
}

function positiveInteger(value: unknown, label: string): number {
  if (!Number.isSafeInteger(value) || Number(value) < 1) {
    blocked(`Speech synthetic transcript ${label} is malformed.`)
  }
  return Number(value)
}

function exact(actual: unknown, expected: unknown, label: string): void {
  if (actual !== expected) blocked(`Speech synthetic transcript ${label} does not match its frozen value.`)
}

function exactIso(value: string, label: string): string {
  if (!value.endsWith('Z') || Number.isNaN(Date.parse(value)) || new Date(value).toISOString() !== value) {
    invalid(`Speech synthetic transcript ${label} must be an exact ISO timestamp.`)
  }
  return value
}

function sha(value: string, label: string): string {
  if (!SHA256.test(value)) blocked(`Speech synthetic transcript ${label} is not SHA-256.`)
  return value
}

function gitObjectId(value: string, label: string): string {
  if (!GIT_OBJECT_ID.test(value)) blocked(`Speech synthetic transcript ${label} is not a Git object ID.`)
  return value
}

function sha256Bytes(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function sha256Text(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}

function invalid(message: string): never {
  throw new ApiError('VALIDATION_FAILED', message, 400)
}

function blocked(message: string): never {
  throw new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', message, 409)
}
