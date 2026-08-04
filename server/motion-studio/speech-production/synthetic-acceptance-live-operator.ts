import { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'
import { chmod, lstat, mkdir, readFile, realpath, writeFile } from 'node:fs/promises'
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
  assertMotionStudioSpeechFixtureGoogleSecretManagerLoader,
  assertMotionStudioSpeechLiveGoogleSecretManagerLoader,
  createMotionStudioSpeechFixtureGoogleSecretManagerValueLoader,
  createMotionStudioSpeechGoogleSecretManagerValueLoader,
  createMotionStudioSpeechSecretBinding,
  type MotionStudioSpeechGoogleSecretManagerFixtureLoaderOptions,
  type MotionStudioSpeechSecretValueLoader,
} from './live-credential'
import {
  parseMotionStudioElevenLabsTimingResponse,
  type MotionStudioElevenLabsCharacterAlignment,
} from './live-request'
import { loadMotionStudioSpeechVoiceCatalogPrivateAcceptanceEvidence } from './voice-catalog-discovery'

const SHA256 = /^[a-f0-9]{64}$/
const STABLE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/
const SYSTEM_FETCH = globalThis.fetch.bind(globalThis)

const PACKET_RELATIVE_PATH =
  'tasks/motion-studio/MS-012C/c2-synthetic-acceptance-live-authorization-request.json' as const
const AUTHORIZATION_RECORD_RELATIVE_PATH =
  'tasks/motion-studio/MS-012C/c2-synthetic-acceptance-live-authorization-record.json' as const
const DECISION_RELATIVE_PATH =
  'tasks/motion-studio/MS-012C/c2-private-acceptance-voice-selection-decision.json' as const
const PRIVATE_RUN_ROOT_RELATIVE_PATH =
  '.reeditpro-local-storage-ms012c2-synthetic-acceptance-ext-001' as const
const CONSUMPTION_FILENAME = 'authority-consumed.json' as const
const AUDIO_FILENAME = 'synthetic-acceptance-audio.mp3' as const
const ALIGNMENT_FILENAME = 'synthetic-acceptance-alignment.json' as const
const EVIDENCE_FILENAME = 'synthetic-acceptance-evidence.json' as const
const FAILURE_FILENAME = 'terminal-failure.json' as const

const MAX_PACKET_BYTES = 256 * 1024
const MAX_AUTHORIZATION_BYTES = 64 * 1024
const MAX_DECISION_BYTES = 16 * 1024
const MAXIMUM_CAPTURED_RESPONSE_BYTES = 16 * 1024 * 1024
const REQUEST_TIMEOUT_MILLISECONDS = 60_000
const MAXIMUM_INTERNAL_PRODUCTION_COST_MICROS = 250_000
const PUBLIC_RATE_USD_MICROS_PER_1_000_CHARACTERS = 100_000
const MAXIMUM_PROVIDER_CHARACTER_COST_CREDITS = 2_500
const SYNTHETIC_TEXT_MAXIMUM_CHARACTERS = 160
const API_ORIGIN = 'https://api.elevenlabs.io' as const
const OUTPUT_FORMAT = 'mp3_44100_128' as const
const MODEL_ID = 'eleven_v3' as const
const PUBLIC_RATE_SOURCE_URL = 'https://elevenlabs.io/pricing/api' as const
const OWNER_STANDING_DIRECTIVE_ID = 'MS-OWNER-STANDING-IMPLEMENTATION-QA-20260718' as const
const OWNER_STANDING_DIRECTIVE_SHA256 =
  'b933153875768280382d9e9aecd1d904c4300518426bbe6ae52496c8ea0fff68' as const
const OWNER_AUTHORIZATION_STATEMENT_SHA256 =
  'cb26b67e69b5dde409462abaeeb34b1838c1561d58751314a8e78df1c39b672b' as const
const DECISION_FILE_SHA256 =
  'f32d4d1948170d51a20dfd153d565ced9eefb3d0e239e9e76718340def3774f9' as const
const DECISION_DIGEST =
  'c0be006fe3b35983fd4982870c963834a61783df4d2ca13b5d129a40f4b9346d' as const
const CATALOG_EVIDENCE_DIGEST =
  'c1a3b5fea2146ddf3533e1e37da2717f06cf2294c8ed9d96aa245bf694afd7dc' as const
const VOICE_IDENTITY_HASH =
  '49f550f19334ec34250f2c0377ca89f70ee26b8dff4904826e7e871bbadccba0' as const
const CANDIDATE_EVIDENCE_DIGEST =
  '389cd277661e116e924c565a5eab03cef58a96b78093c08357b240bf77629256' as const
const EXT_001_RESULT_SHA256 =
  'e792d34908533a70bf26b26bdcd1152c53ecddbddc6fa9e50ba1ee73b9dbdab3' as const
const EXT_002_RESULT_SHA256 =
  '497da68874d7af70851e51ade805038c0e65ca1bbd62c630d1d52e2ef5228440' as const
const CATALOG_RESULT_SHA256 =
  '68e0385bf37601ac86ed7a874bb0f24adbe21fa3ddaaf51f03133cd27d5c436e' as const

const REVIEWED_RUNTIME_RELATIVE_PATHS = Object.freeze([
  'package.json',
  'server/motion-studio/speech-production/live-credential.ts',
  'server/motion-studio/speech-production/live-request.ts',
  'server/motion-studio/speech-production/voice-catalog-discovery.ts',
  'server/motion-studio/speech-production/synthetic-acceptance-live-operator.ts',
  'server/motion-studio/speech-production/synthetic-acceptance-live-cli.ts',
] as const)

export const MOTION_STUDIO_SPEECH_SYNTHETIC_ACCEPTANCE_AUTHORIZATION_ID =
  'MS-012C2-SYNTHETIC-TTS-EXT-001' as const

export const MOTION_STUDIO_SPEECH_SYNTHETIC_ACCEPTANCE_TEXT =
  'At dawn, the city held its breath as a single light appeared on the horizon, marking the first moment of a story still waiting to be told.' as const

const SYNTHETIC_TEXT_DIGEST = sha256Text(MOTION_STUDIO_SPEECH_SYNTHETIC_ACCEPTANCE_TEXT)
const EXPECTED_PUBLIC_LIST_COST_MICROS =
  MOTION_STUDIO_SPEECH_SYNTHETIC_ACCEPTANCE_TEXT.length *
  (PUBLIC_RATE_USD_MICROS_PER_1_000_CHARACTERS / 1_000)
const PUBLIC_RATE_BASIS = Object.freeze({
  sourceUrl: PUBLIC_RATE_SOURCE_URL,
  modelClass: 'multilingual_v2_v3' as const,
  modelId: MODEL_ID,
  currency: 'USD' as const,
  priceMicrosPer1_000InputCharacters: PUBLIC_RATE_USD_MICROS_PER_1_000_CHARACTERS,
  providerCreditsPerInputCharacter: 1 as const,
  publicListOnly: true as const,
  exactAccountInvoice: false as const,
  serviceFeeIncluded: false as const,
  customerPricingIncluded: false as const,
  customerCreditsIncluded: false as const,
})
const PUBLIC_RATE_BASIS_DIGEST = sha256CanonicalJson(PUBLIC_RATE_BASIS)

export const MOTION_STUDIO_SPEECH_SYNTHETIC_ACCEPTANCE_LIVE_OPERATOR_PATHS = Object.freeze({
  packetRelativePath: PACKET_RELATIVE_PATH,
  authorizationRecordRelativePath: AUTHORIZATION_RECORD_RELATIVE_PATH,
  privateRunRootRelativePath: PRIVATE_RUN_ROOT_RELATIVE_PATH,
  consumptionFilename: CONSUMPTION_FILENAME,
  audioFilename: AUDIO_FILENAME,
  alignmentFilename: ALIGNMENT_FILENAME,
  evidenceFilename: EVIDENCE_FILENAME,
  failureFilename: FAILURE_FILENAME,
})

export type MotionStudioSpeechSyntheticAcceptanceFailureClass =
  | 'credential_read_failed'
  | 'provider_dispatch_failed_outcome_unknown'
  | 'provider_http_rejected'
  | 'provider_response_too_large'
  | 'provider_response_invalid'
  | 'cost_evidence_missing_or_over_ceiling'
  | 'private_persistence_failed'

export interface MotionStudioSpeechSyntheticAcceptanceLiveResultV1 {
  schemaVersion: 'motion-studio.speech-synthetic-acceptance-live-result.v1'
  state: 'private_synthetic_transport_evidence_ready_not_production_ready'
  evidenceClass: 'authenticated_provider_synthetic_acceptance' | 'private_local_fixture'
  authorizationId: typeof MOTION_STUDIO_SPEECH_SYNTHETIC_ACCEPTANCE_AUTHORIZATION_ID
  authorityPacketDigest: string
  ownerAuthorizationEvidenceId: string
  decisionDigest: typeof DECISION_DIGEST
  catalogEvidenceDigest: typeof CATALOG_EVIDENCE_DIGEST
  voiceIdentityHash: typeof VOICE_IDENTITY_HASH
  syntheticTextDigest: string
  syntheticTextCharacterCount: number
  modelId: typeof MODEL_ID
  outputFormat: typeof OUTPUT_FORMAT
  standardProviderRetentionAcceptedForSyntheticProof: true
  zeroRetentionClaimed: false
  credentialPayloadReadCount: 1
  providerRequestAttemptCount: 1
  providerRequestCompletedCount: 1
  providerGenerationCount: 1
  automaticRetryCount: 0
  automaticFallbackCount: 0
  purchaseCount: 0
  accountMutationCount: 0
  providerRequestIdDigest?: string
  providerCharacterCostCredits: number
  providerCharacterCostMicrocredits: number
  publicListProviderCostMicros: number
  maximumAuthorizedInternalProductionCostMicros: typeof MAXIMUM_INTERNAL_PRODUCTION_COST_MICROS
  audioSha256: string
  audioByteLength: number
  alignmentDigest: string
  privateEvidenceRelativePath: typeof PRIVATE_RUN_ROOT_RELATIVE_PATH
  productReady: false
  externalBetaReady: false
  productionReady: false
  finalSelectionAllowed: false
  timelineMutationAllowed: false
  customerBillingPerformed: false
  immutable: true
}

interface RuntimeInput {
  evidenceClass: MotionStudioSpeechSyntheticAcceptanceLiveResultV1['evidenceClass']
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
    | 'audio_persisted'
    | 'alignment_persisted'
  credentialPayloadReadCount: 0 | 1
  providerRequestAttemptCount: 0 | 1
  providerRequestCompletedCount: 0 | 1
  providerResponseStatus?: number
  providerRequestIdDigest?: string
  providerCharacterCostCredits?: number
  providerCharacterCostMicrocredits?: number
  retainedAudio?: { sha256: string; byteLength: number; filename: typeof AUDIO_FILENAME }
}

export async function executeMotionStudioSpeechSyntheticAcceptanceLiveOperator(input: {
  repositoryRoot: string
  now: string
}): Promise<MotionStudioSpeechSyntheticAcceptanceLiveResultV1> {
  return executeOperator(input, {
    evidenceClass: 'authenticated_provider_synthetic_acceptance',
    createLoader() {
      const loader = createMotionStudioSpeechGoogleSecretManagerValueLoader()
      assertMotionStudioSpeechLiveGoogleSecretManagerLoader(loader)
      return loader
    },
    fetchImplementation: SYSTEM_FETCH,
  })
}

export async function executeMotionStudioSpeechSyntheticAcceptanceAuthorizedFixtureOperator(input: {
  repositoryRoot: string
  now: string
  fixtureLoaderOptions: MotionStudioSpeechGoogleSecretManagerFixtureLoaderOptions
  fixtureFetchImplementation: typeof fetch
}): Promise<MotionStudioSpeechSyntheticAcceptanceLiveResultV1> {
  return executeOperator(input, {
    evidenceClass: 'private_local_fixture',
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
): Promise<MotionStudioSpeechSyntheticAcceptanceLiveResultV1> {
  const repositoryRoot = await realpath(input.repositoryRoot)
  const now = exactIso(input.now, 'synthetic acceptance run time')
  const packetFile = await readRegularBoundedFile(
    inside(repositoryRoot, PACKET_RELATIVE_PATH), MAX_PACKET_BYTES, 'authority packet')
  const authorityPacketDigest = sha256Bytes(packetFile)
  const packet = validatePacket(parseJson(packetFile, 'authority packet'), authorityPacketDigest, now)
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
  await verifyReviewedRuntimeFiles(repositoryRoot, packet.reviewedRuntimeFiles)
  await verifyPreservedTrackedHistory(repositoryRoot)

  const decisionFile = await readRegularBoundedFile(
    inside(repositoryRoot, DECISION_RELATIVE_PATH), MAX_DECISION_BYTES, 'private acceptance voice decision')
  if (sha256Bytes(decisionFile) !== DECISION_FILE_SHA256) {
    blocked('Speech synthetic acceptance voice decision changed after review.')
  }
  const decision = validateDecision(parseJson(decisionFile, 'private acceptance voice decision'))
  const catalog = await loadMotionStudioSpeechVoiceCatalogPrivateAcceptanceEvidence({ repositoryRoot })
  if (catalog.evidenceDigest !== CATALOG_EVIDENCE_DIGEST) {
    blocked('Speech synthetic acceptance catalog evidence changed after acceptance.')
  }
  const candidates = catalog.candidates.filter((candidate) =>
    candidate.voiceIdentityHash === decision.voiceIdentityHash &&
    candidate.candidateEvidenceDigest === decision.candidateEvidenceDigest)
  if (candidates.length !== 1 || candidates[0]!.category !== 'premade') {
    blocked('Speech synthetic acceptance requires the one reviewed premade catalog voice.')
  }
  const providerVoiceId = candidates[0]!.providerVoiceId
  const binding = createMotionStudioSpeechSecretBinding({
    credentialReferenceId: 'credential-elevenlabs-synthetic-acceptance-001',
    secretLocatorId: MOTION_STUDIO_SPEECH_ELEVENLABS_SECRET_LOCATOR_ID,
    secretVersionReference: MOTION_STUDIO_SPEECH_ELEVENLABS_SECRET_VERSION,
  })
  if (binding.bindingDigest !== packet.credentialBindingDigest) {
    blocked('Speech synthetic acceptance credential binding does not match its authority packet.')
  }

  const privateRoot = inside(repositoryRoot, PRIVATE_RUN_ROOT_RELATIVE_PATH)
  await createPrivateRunRoot(privateRoot)
  const consumption = Object.freeze({
    schemaVersion: 'motion-studio.speech-synthetic-acceptance-authority-consumption.v1' as const,
    state: 'single_use_authority_consumed_before_credential_read' as const,
    authorizationId: MOTION_STUDIO_SPEECH_SYNTHETIC_ACCEPTANCE_AUTHORIZATION_ID,
    authorityPacketDigest,
    authorizationRecordDigest: sha256Bytes(authorizationFile),
    ownerAuthorizationEvidenceId,
    decisionDigest: decision.decisionDigest,
    catalogEvidenceDigest: catalog.evidenceDigest,
    voiceIdentityHash: decision.voiceIdentityHash,
    syntheticTextDigest: SYNTHETIC_TEXT_DIGEST,
    syntheticTextCharacterCount: MOTION_STUDIO_SPEECH_SYNTHETIC_ACCEPTANCE_TEXT.length,
    credentialBindingDigest: binding.bindingDigest,
    standardProviderRetentionAcceptedForSyntheticProof: true as const,
    zeroRetentionClaimed: false as const,
    credentialPayloadReadCountAtConsumption: 0 as const,
    providerRequestAttemptCountAtConsumption: 0 as const,
    providerGenerationCountAtConsumption: 0 as const,
    consumedAt: now,
    immutable: true as const,
  })
  await writePrivateJsonExclusive(
    join(privateRoot, CONSUMPTION_FILENAME),
    consumption,
    'Speech synthetic acceptance authority was already consumed before credential access.',
  )

  const progress: SafeProgress = {
    lastPhase: 'authority_consumed',
    credentialPayloadReadCount: 0,
    providerRequestAttemptCount: 0,
    providerRequestCompletedCount: 0,
  }
  let failureClass: MotionStudioSpeechSyntheticAcceptanceFailureClass = 'credential_read_failed'
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

    const requestBody = Object.freeze({
      text: MOTION_STUDIO_SPEECH_SYNTHETIC_ACCEPTANCE_TEXT,
      model_id: MODEL_ID,
    })
    const requestBodyText = JSON.stringify(requestBody)
    const endpoint = `${API_ORIGIN}/v1/text-to-speech/${encodeURIComponent(providerVoiceId)}` +
      `/with-timestamps?output_format=${OUTPUT_FORMAT}&enable_logging=true`
    failureClass = 'provider_dispatch_failed_outcome_unknown'
    progress.providerRequestAttemptCount = 1
    progress.lastPhase = 'provider_request_started'
    const response = await fetchOnceBounded({
      fetchImplementation: runtime.fetchImplementation,
      endpoint,
      apiKey,
      requestBodyText,
    })
    progress.providerRequestCompletedCount = 1
    progress.providerResponseStatus = response.status
    progress.lastPhase = 'provider_response_received'
    const providerRequestId = response.headers.get('request-id') ??
      response.headers.get('x-request-id') ?? response.headers.get('x-trace-id')
    if (providerRequestId) progress.providerRequestIdDigest = sha256Text(providerRequestId)
    const characterCost = parseCharacterCostHeader(response.headers.get('character-cost'))
    if (characterCost) {
      progress.providerCharacterCostCredits = characterCost.credits
      progress.providerCharacterCostMicrocredits = characterCost.microcredits
    }
    if (!response.ok) {
      failureClass = 'provider_http_rejected'
      await response.body?.cancel().catch(() => undefined)
      blocked('Speech synthetic acceptance provider returned a non-success response; the lane is terminal.')
    }

    failureClass = 'provider_response_too_large'
    const responseBytes = await readResponseBytesBounded(response, MAXIMUM_CAPTURED_RESPONSE_BYTES)
    const responseBodyDigest = sha256Bytes(responseBytes)
    failureClass = 'provider_response_invalid'
    const responseValue = parseJson(responseBytes, 'provider response')
    const parsed = parseMotionStudioElevenLabsTimingResponse({
      value: responseValue,
      expectedSpokenText: MOTION_STUDIO_SPEECH_SYNTHETIC_ACCEPTANCE_TEXT,
    })

    failureClass = 'private_persistence_failed'
    const audioDescriptor = await writePrivateBytesExclusive(
      join(privateRoot, AUDIO_FILENAME), parsed.audioBytes, 'synthetic audio')
    progress.retainedAudio = { ...audioDescriptor, filename: AUDIO_FILENAME }
    progress.lastPhase = 'audio_persisted'
    const alignment = createAlignmentEvidence(parsed.alignment, parsed.normalizedAlignment)
    await writePrivateJsonExclusive(
      join(privateRoot, ALIGNMENT_FILENAME), alignment,
      'Speech synthetic acceptance alignment evidence already exists.',
    )
    progress.lastPhase = 'alignment_persisted'

    failureClass = 'cost_evidence_missing_or_over_ceiling'
    if (!characterCost || characterCost.credits <= 0 ||
      characterCost.credits > MAXIMUM_PROVIDER_CHARACTER_COST_CREDITS) {
      blocked('Speech synthetic acceptance response lacks bounded provider character-cost evidence.')
    }
    const publicListProviderCostMicros = calculatePublicListCostMicros(characterCost.microcredits)
    if (publicListProviderCostMicros > MAXIMUM_INTERNAL_PRODUCTION_COST_MICROS) {
      blocked('Speech synthetic acceptance provider usage exceeds its internal-cost ceiling.')
    }

    const evidenceBase = {
      schemaVersion: 'motion-studio.speech-synthetic-acceptance-private-evidence.v1' as const,
      state: 'private_synthetic_transport_evidence_ready_not_production_ready' as const,
      evidenceClass: runtime.evidenceClass,
      authorizationId: MOTION_STUDIO_SPEECH_SYNTHETIC_ACCEPTANCE_AUTHORIZATION_ID,
      authorityPacketDigest,
      ownerAuthorizationEvidenceId,
      decisionDigest: decision.decisionDigest,
      catalogEvidenceDigest: catalog.evidenceDigest,
      voiceIdentityHash: decision.voiceIdentityHash,
      credentialBindingDigest: binding.bindingDigest,
      syntheticTextDigest: SYNTHETIC_TEXT_DIGEST,
      syntheticTextCharacterCount: MOTION_STUDIO_SPEECH_SYNTHETIC_ACCEPTANCE_TEXT.length,
      requestBodyDigest: sha256CanonicalJson(requestBody),
      modelId: MODEL_ID,
      outputFormat: OUTPUT_FORMAT,
      standardProviderRetentionAcceptedForSyntheticProof: true as const,
      zeroRetentionClaimed: false as const,
      responseBodyDigest,
      responseCanonicalDigest: parsed.responseDigest,
      ...(progress.providerRequestIdDigest
        ? { providerRequestIdDigest: progress.providerRequestIdDigest }
        : {}),
      providerCharacterCostCredits: characterCost.credits,
      providerCharacterCostMicrocredits: characterCost.microcredits,
      costEvidence: Object.freeze({
        method: 'provider_character_cost_header_times_official_public_api_rate' as const,
        publicRateBasis: PUBLIC_RATE_BASIS,
        publicRateBasisDigest: PUBLIC_RATE_BASIS_DIGEST,
        expectedPublicListCostMicros: EXPECTED_PUBLIC_LIST_COST_MICROS,
        publicListProviderCostMicros,
        maximumAuthorizedInternalProductionCostMicros: MAXIMUM_INTERNAL_PRODUCTION_COST_MICROS,
        exactAccountInvoiceCostStatus: 'not_available_subscription_scope_read_blocked' as const,
        exactGoogleSecretManagerInvoiceCostStatus: 'not_fetched_one_bounded_read_only' as const,
        customerPricingIncluded: false as const,
        customerCreditsIncluded: false as const,
        customerBillingPerformed: false as const,
      }),
      audio: Object.freeze({
        filename: AUDIO_FILENAME,
        mimeType: parsed.mimeType,
        byteLength: audioDescriptor.byteLength,
        sha256: audioDescriptor.sha256,
      }),
      alignment: Object.freeze({
        filename: ALIGNMENT_FILENAME,
        digest: alignment.alignmentDigest,
        sourceCharacterCount: alignment.alignment.characters.length,
        normalizedCharacterCount: alignment.normalizedAlignment.characters.length,
      }),
      usage: Object.freeze({
        credentialPayloadReadCount: 1 as const,
        providerRequestAttemptCount: 1 as const,
        providerRequestCompletedCount: 1 as const,
        providerGenerationCount: 1 as const,
        automaticRetryCount: 0 as const,
        automaticFallbackCount: 0 as const,
        purchaseCount: 0 as const,
        accountMutationCount: 0 as const,
      }),
      boundaries: Object.freeze({
        syntheticAcceptanceOnly: true as const,
        userContentUsed: false as const,
        productionUserDefault: false as const,
        finalVoiceSelectionAllowed: false as const,
        timelineMutationAllowed: false as const,
        renderAllowed: false as const,
        exportAllowed: false as const,
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
    await writePrivateJsonExclusive(
      join(privateRoot, EVIDENCE_FILENAME), evidence,
      'Speech synthetic acceptance private evidence already exists.',
    )

    return Object.freeze({
      schemaVersion: 'motion-studio.speech-synthetic-acceptance-live-result.v1' as const,
      state: 'private_synthetic_transport_evidence_ready_not_production_ready' as const,
      evidenceClass: runtime.evidenceClass,
      authorizationId: MOTION_STUDIO_SPEECH_SYNTHETIC_ACCEPTANCE_AUTHORIZATION_ID,
      authorityPacketDigest,
      ownerAuthorizationEvidenceId,
      decisionDigest: DECISION_DIGEST,
      catalogEvidenceDigest: CATALOG_EVIDENCE_DIGEST,
      voiceIdentityHash: VOICE_IDENTITY_HASH,
      syntheticTextDigest: SYNTHETIC_TEXT_DIGEST,
      syntheticTextCharacterCount: MOTION_STUDIO_SPEECH_SYNTHETIC_ACCEPTANCE_TEXT.length,
      modelId: MODEL_ID,
      outputFormat: OUTPUT_FORMAT,
      standardProviderRetentionAcceptedForSyntheticProof: true as const,
      zeroRetentionClaimed: false as const,
      credentialPayloadReadCount: 1 as const,
      providerRequestAttemptCount: 1 as const,
      providerRequestCompletedCount: 1 as const,
      providerGenerationCount: 1 as const,
      automaticRetryCount: 0 as const,
      automaticFallbackCount: 0 as const,
      purchaseCount: 0 as const,
      accountMutationCount: 0 as const,
      ...(progress.providerRequestIdDigest
        ? { providerRequestIdDigest: progress.providerRequestIdDigest }
        : {}),
      providerCharacterCostCredits: characterCost.credits,
      providerCharacterCostMicrocredits: characterCost.microcredits,
      publicListProviderCostMicros,
      maximumAuthorizedInternalProductionCostMicros: MAXIMUM_INTERNAL_PRODUCTION_COST_MICROS,
      audioSha256: audioDescriptor.sha256,
      audioByteLength: audioDescriptor.byteLength,
      alignmentDigest: alignment.alignmentDigest,
      privateEvidenceRelativePath: PRIVATE_RUN_ROOT_RELATIVE_PATH,
      productReady: false as const,
      externalBetaReady: false as const,
      productionReady: false as const,
      finalSelectionAllowed: false as const,
      timelineMutationAllowed: false as const,
      customerBillingPerformed: false as const,
      immutable: true as const,
    })
  } catch {
    await writePrivateJsonBestEffort(join(privateRoot, FAILURE_FILENAME), {
      schemaVersion: 'motion-studio.speech-synthetic-acceptance-terminal-failure.v1',
      state: failureClass === 'provider_dispatch_failed_outcome_unknown'
        ? 'consumed_terminal_outcome_unknown_no_retry'
        : 'consumed_terminal_failure_no_retry',
      authorizationId: MOTION_STUDIO_SPEECH_SYNTHETIC_ACCEPTANCE_AUTHORIZATION_ID,
      authorityPacketDigest,
      failureReasonClass: failureClass,
      safeProgress: progress,
      standardProviderRetentionAcceptedForSyntheticProof: true,
      zeroRetentionClaimed: false,
      rawErrorMessagePersisted: false,
      rawProviderResponsePersisted: false,
      credentialPersisted: false,
      providerVoiceIdPersisted: false,
      automaticRetryAllowed: false,
      automaticFallbackAllowed: false,
      finalSelectionAllowed: false,
      timelineMutationAllowed: false,
      customerBillingPerformed: false,
      failedAt: now,
      immutable: true,
    })
    blocked('Speech synthetic acceptance lane ended terminally; no retry or fallback is allowed.')
  }
}

async function fetchOnceBounded(input: {
  fetchImplementation: typeof fetch
  endpoint: string
  apiKey: string
  requestBodyText: string
}): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MILLISECONDS)
  try {
    return await input.fetchImplementation(input.endpoint, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'xi-api-key': input.apiKey,
      },
      body: input.requestBodyText,
      redirect: 'manual',
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeout)
  }
}

async function readResponseBytesBounded(response: Response, maximumBytes: number): Promise<Buffer> {
  const declaredLength = response.headers.get('content-length')
  if (declaredLength && (!/^\d+$/.test(declaredLength) || Number(declaredLength) > maximumBytes)) {
    await response.body?.cancel().catch(() => undefined)
    blocked('Speech synthetic acceptance provider response exceeds its byte ceiling.')
  }
  if (!response.body) blocked('Speech synthetic acceptance provider response has no body.')
  const chunks: Buffer[] = []
  let total = 0
  const reader = response.body.getReader()
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      total += value.byteLength
      if (total > maximumBytes) {
        await reader.cancel().catch(() => undefined)
        blocked('Speech synthetic acceptance provider response exceeds its byte ceiling.')
      }
      chunks.push(Buffer.from(value))
    }
  } finally {
    reader.releaseLock()
  }
  if (total < 2) blocked('Speech synthetic acceptance provider response is empty.')
  return Buffer.concat(chunks, total)
}

function createAlignmentEvidence(
  alignment: MotionStudioElevenLabsCharacterAlignment,
  normalizedAlignment: MotionStudioElevenLabsCharacterAlignment,
) {
  const base = {
    schemaVersion: 'motion-studio.speech-synthetic-acceptance-alignment.v1' as const,
    source: 'elevenlabs_character_alignment' as const,
    syntheticTextDigest: SYNTHETIC_TEXT_DIGEST,
    alignment,
    normalizedAlignment,
    captionMutationPerformed: false as const,
    masterTimingMutationPerformed: false as const,
    immutable: true as const,
  }
  return Object.freeze({ ...base, alignmentDigest: sha256CanonicalJson(base) })
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
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) blocked('Speech synthetic acceptance cost exceeds safe bounds.')
  return Number(value)
}

function validatePacket(value: unknown, packetDigest: string, now: string): {
  credentialBindingDigest: string
  reviewedRuntimeFiles: readonly { relativePath: string; byteLength: number; sha256: string }[]
} {
  const packet = object(value, 'authority packet')
  const credential = object(packet.credential, 'authority credential')
  const runtime = object(packet.runtime, 'authority runtime')
  const request = object(packet.request, 'authority request')
  const input = object(packet.syntheticInput, 'authority synthetic input')
  const retention = object(packet.retention, 'authority retention')
  const cost = object(packet.cost, 'authority cost')
  const operator = object(packet.operator, 'authority operator')
  const history = object(packet.preservedHistory, 'authority preserved history')
  const reviewedRuntimeFiles = parseReviewedRuntimeFiles(packet.reviewedRuntimeFiles)
  const validFrom = exactIso(String(packet.validFrom), 'authority valid-from time')
  const expiresAt = exactIso(String(packet.expiresAt), 'authority expiry time')
  if (Date.parse(now) < Date.parse(validFrom) || Date.parse(now) >= Date.parse(expiresAt)) {
    blocked('Speech synthetic acceptance authority is outside its fixed time window.')
  }
  const binding = createMotionStudioSpeechSecretBinding({
    credentialReferenceId: 'credential-elevenlabs-synthetic-acceptance-001',
    secretLocatorId: MOTION_STUDIO_SPEECH_ELEVENLABS_SECRET_LOCATOR_ID,
    secretVersionReference: MOTION_STUDIO_SPEECH_ELEVENLABS_SECRET_VERSION,
  })
  if (
    packet.schemaVersion !== 'motion-studio.speech-synthetic-acceptance-live-authorization.v1' ||
    packet.authorizationId !== MOTION_STUDIO_SPEECH_SYNTHETIC_ACCEPTANCE_AUTHORIZATION_ID ||
    packet.milestone !== 'MS-012C2' ||
    packet.status !== 'standing_directive_authorization_ready_not_executed' || packet.singleUse !== true ||
    history.mustRemainImmutable !== true || history.catalogResultSha256 !== CATALOG_RESULT_SHA256 ||
    history.accountPreflightExt001ResultSha256 !== EXT_001_RESULT_SHA256 ||
    history.accountPreflightExt002ResultSha256 !== EXT_002_RESULT_SHA256 ||
    credential.provider !== 'google_secret_manager' ||
    credential.projectId !== MOTION_STUDIO_SPEECH_GOOGLE_CLOUD_PROJECT_ID ||
    credential.secretId !== MOTION_STUDIO_SPEECH_ELEVENLABS_SECRET_LOCATOR_ID ||
    credential.numericVersion !== MOTION_STUDIO_SPEECH_ELEVENLABS_SECRET_VERSION ||
    credential.bindingDigest !== binding.bindingDigest || credential.maximumPayloadReads !== 1 ||
    credential.credentialPersisted !== false || credential.browserExposureAllowed !== false ||
    runtime.cloudSdkVersion !== MOTION_STUDIO_SPEECH_GCLOUD_SDK_VERSION ||
    runtime.resolvedExecutablePath !== MOTION_STUDIO_SPEECH_GCLOUD_BINARY_PATH ||
    runtime.executableByteLength !== MOTION_STUDIO_SPEECH_GCLOUD_BINARY_BYTE_LENGTH ||
    runtime.executableSha256 !== MOTION_STUDIO_SPEECH_GCLOUD_BINARY_SHA256 ||
    runtime.callerSelectedExecutableAllowed !== false || runtime.proxyOrPacAllowed !== false ||
    input.textDigest !== SYNTHETIC_TEXT_DIGEST ||
    input.characterCount !== MOTION_STUDIO_SPEECH_SYNTHETIC_ACCEPTANCE_TEXT.length ||
    input.maximumCharacters !== SYNTHETIC_TEXT_MAXIMUM_CHARACTERS || input.syntheticNonPersonal !== true ||
    input.userContentUsed !== false || input.factualClaimAboutRealPerson !== false ||
    retention.enableLogging !== true || retention.mode !== 'standard_provider_retention' ||
    retention.syntheticAcceptanceOnly !== true || retention.zeroRetentionClaimed !== false ||
    retention.productionUserContentAllowed !== false ||
    request.method !== 'POST' || request.scheme !== 'https' || request.hostname !== 'api.elevenlabs.io' ||
    request.pathTemplate !== '/v1/text-to-speech/{private_provider_voice_id}/with-timestamps' ||
    request.modelId !== MODEL_ID || request.outputFormat !== OUTPUT_FORMAT ||
    request.maximumHttpRequests !== 1 || request.maximumRedirects !== 0 ||
    request.timeoutMilliseconds !== REQUEST_TIMEOUT_MILLISECONDS ||
    request.maximumCapturedResponseBytes !== MAXIMUM_CAPTURED_RESPONSE_BYTES ||
    request.automaticRetryAllowed !== false || request.automaticFallbackAllowed !== false ||
    request.purchaseAllowed !== false || request.accountMutationAllowed !== false ||
    cost.currency !== 'USD' || cost.publicRateSourceUrl !== PUBLIC_RATE_SOURCE_URL ||
    cost.publicRateBasisDigest !== PUBLIC_RATE_BASIS_DIGEST ||
    cost.publicRateUsdMicrosPer1_000Characters !== PUBLIC_RATE_USD_MICROS_PER_1_000_CHARACTERS ||
    cost.expectedPublicListCostMicros !== EXPECTED_PUBLIC_LIST_COST_MICROS ||
    cost.maximumProviderCharacterCostCredits !== MAXIMUM_PROVIDER_CHARACTER_COST_CREDITS ||
    cost.maximumInternalProductionCostMicros !== MAXIMUM_INTERNAL_PRODUCTION_COST_MICROS ||
    cost.exactAccountInvoiceClaimed !== false || cost.customerPricingAllowed !== false ||
    cost.customerCreditsAllowed !== false || cost.customerBillingAllowed !== false ||
    operator.command !==
      './node_modules/.bin/tsx server/motion-studio/speech-production/synthetic-acceptance-live-cli.ts' ||
    operator.authorizationRecordRelativePath !== AUTHORIZATION_RECORD_RELATIVE_PATH ||
    operator.privateRunRootRelativePath !== PRIVATE_RUN_ROOT_RELATIVE_PATH ||
    operator.consumeBeforeCredentialRead !== true || operator.exclusiveCreateOnly !== true ||
    !SHA256.test(packetDigest)
  ) blocked('Speech synthetic acceptance authority packet failed its exact runtime contract.')
  return { credentialBindingDigest: binding.bindingDigest, reviewedRuntimeFiles }
}

function validateAuthorizationRecord(value: unknown, packetDigest: string, now: string): string {
  const record = object(value, 'standing-directive authorization record')
  if (
    record.schemaVersion !== 'motion-studio.speech-synthetic-acceptance-live-authorization-record.v1' ||
    record.status !== 'standing_directive_authorized_unconsumed' ||
    record.authorizationId !== MOTION_STUDIO_SPEECH_SYNTHETIC_ACCEPTANCE_AUTHORIZATION_ID ||
    record.authorityPacketDigest !== packetDigest || record.singleUse !== true ||
    record.standingDirectiveId !== OWNER_STANDING_DIRECTIVE_ID ||
    record.standingDirectiveSha256 !== OWNER_STANDING_DIRECTIVE_SHA256 ||
    record.ownerAuthorizationStatementSha256 !== OWNER_AUTHORIZATION_STATEMENT_SHA256 ||
    record.maximumSecretPayloadReads !== 1 || record.maximumHttpRequests !== 1 ||
    record.maximumInternalProductionCostMicros !== MAXIMUM_INTERNAL_PRODUCTION_COST_MICROS ||
    record.syntheticAcceptanceOnly !== true || record.standardProviderRetentionAccepted !== true ||
    record.zeroRetentionClaimed !== false || record.automaticRetryAllowed !== false ||
    record.automaticFallbackAllowed !== false || record.purchaseAllowed !== false ||
    record.accountMutationAllowed !== false || record.privateLocalEvidenceOnly !== true ||
    record.customerBillingAllowed !== false || !STABLE_ID.test(String(record.ownerAuthorizationEvidenceId))
  ) blocked('Speech synthetic acceptance standing-directive authorization does not match the packet.')
  const recordedAt = exactIso(String(record.recordedAt), 'authorization record time')
  if (Date.parse(recordedAt) > Date.parse(now)) {
    blocked('Speech synthetic acceptance authorization record is from the future.')
  }
  return String(record.ownerAuthorizationEvidenceId)
}

function validateDecision(value: unknown): {
  decisionDigest: typeof DECISION_DIGEST
  voiceIdentityHash: typeof VOICE_IDENTITY_HASH
  candidateEvidenceDigest: typeof CANDIDATE_EVIDENCE_DIGEST
} {
  const decision = object(value, 'private acceptance voice decision')
  const { decisionDigest, ...base } = decision
  if (
    decision.schemaVersion !== 'motion-studio.speech-private-acceptance-voice-selection-decision.v1' ||
    decision.status !== 'owner_delegated_self_qa_selection_for_private_acceptance_only' ||
    decision.scope !== 'private_local_storytelling_acceptance_test' ||
    decision.selectionAuthority !== 'owner_delegated_implementation_qa_private_acceptance' ||
    decision.providerVoiceIdPersisted !== false || decision.automaticSelectionPerformed !== false ||
    decision.productionUserDefault !== false || decision.customerBindingAllowed !== false ||
    decision.finalVoiceSelectionAllowed !== false || decision.immutable !== true ||
    decisionDigest !== DECISION_DIGEST || sha256CanonicalJson(base) !== DECISION_DIGEST ||
    decision.catalogEvidenceDigest !== CATALOG_EVIDENCE_DIGEST ||
    decision.voiceIdentityHash !== VOICE_IDENTITY_HASH ||
    decision.candidateEvidenceDigest !== CANDIDATE_EVIDENCE_DIGEST
  ) blocked('Speech synthetic acceptance private voice decision failed its exact contract.')
  return {
    decisionDigest: DECISION_DIGEST,
    voiceIdentityHash: VOICE_IDENTITY_HASH,
    candidateEvidenceDigest: CANDIDATE_EVIDENCE_DIGEST,
  }
}

async function verifyPreservedTrackedHistory(repositoryRoot: string): Promise<void> {
  const expected = [
    ['tasks/motion-studio/MS-012C/c2-voice-catalog-live-result.json', CATALOG_RESULT_SHA256],
    ['tasks/motion-studio/MS-012C/c2-account-preflight-live-result-ext-001.json', EXT_001_RESULT_SHA256],
    ['tasks/motion-studio/MS-012C/c2-account-preflight-live-result-ext-002.json', EXT_002_RESULT_SHA256],
  ] as const
  for (const [relativePath, digest] of expected) {
    const bytes = await readRegularBoundedFile(
      inside(repositoryRoot, relativePath), 128 * 1024, `preserved history ${relativePath}`)
    if (sha256Bytes(bytes) !== digest) blocked('Speech synthetic acceptance preserved history changed.')
  }
}

function parseReviewedRuntimeFiles(value: unknown): readonly {
  relativePath: string
  byteLength: number
  sha256: string
}[] {
  if (!Array.isArray(value) || value.length !== REVIEWED_RUNTIME_RELATIVE_PATHS.length) {
    blocked('Speech synthetic acceptance packet has an invalid reviewed-runtime file set.')
  }
  return Object.freeze(value.map((entry, index) => {
    const file = object(entry, `reviewed runtime file ${index + 1}`)
    if (
      file.relativePath !== REVIEWED_RUNTIME_RELATIVE_PATHS[index] ||
      !Number.isSafeInteger(file.byteLength) || Number(file.byteLength) < 2 ||
      Number(file.byteLength) > 2 * 1024 * 1024 || !SHA256.test(String(file.sha256))
    ) blocked('Speech synthetic acceptance reviewed-runtime identity is malformed.')
    return Object.freeze({
      relativePath: String(file.relativePath),
      byteLength: Number(file.byteLength),
      sha256: String(file.sha256),
    })
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
      blocked('Speech synthetic acceptance reviewed runtime changed after packet review.')
    }
  }
}

async function createPrivateRunRoot(path: string): Promise<void> {
  try {
    await mkdir(path, { mode: 0o700 })
    await chmod(path, 0o700)
  } catch {
    blocked('Speech synthetic acceptance lane is already consumed or unavailable.')
  }
  const metadata = await lstat(path)
  if (!metadata.isDirectory() || metadata.isSymbolicLink() || (metadata.mode & 0o777) !== 0o700 ||
    (typeof process.getuid === 'function' && metadata.uid !== process.getuid())) {
    blocked('Speech synthetic acceptance private root is not owner-private.')
  }
}

async function writePrivateBytesExclusive(path: string, bytes: Buffer, label: string): Promise<{
  byteLength: number
  sha256: string
}> {
  if (bytes.byteLength < 1 || bytes.byteLength > 8 * 1024 * 1024) {
    blocked(`Speech synthetic acceptance ${label} is outside its private bound.`)
  }
  try {
    await writeFile(path, bytes, { flag: 'wx', mode: 0o600 })
  } catch {
    blocked(`Speech synthetic acceptance ${label} could not be persisted create-only.`)
  }
  const persisted = await readPrivateFile(path, bytes.byteLength + 1, label)
  const expectedDigest = sha256Bytes(bytes)
  if (persisted.byteLength !== bytes.byteLength || persisted.sha256 !== expectedDigest) {
    blocked(`Speech synthetic acceptance ${label} changed after persistence.`)
  }
  return Object.freeze({ byteLength: bytes.byteLength, sha256: expectedDigest })
}

async function writePrivateJsonExclusive(path: string, value: unknown, existingMessage: string): Promise<void> {
  try {
    await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx', mode: 0o600 })
  } catch {
    blocked(existingMessage)
  }
  await readPrivateFile(path, 2 * 1024 * 1024, 'private JSON evidence')
}

async function writePrivateJsonBestEffort(path: string, value: unknown): Promise<void> {
  try {
    await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx', mode: 0o600 })
  } catch {
    // The create-only consumption record remains the canonical terminal fact.
  }
}

async function readPrivateFile(path: string, maximumBytes: number, label: string): Promise<{
  byteLength: number
  sha256: string
}> {
  const metadata = await lstat(path)
  if (!metadata.isFile() || metadata.isSymbolicLink() || (metadata.mode & 0o777) !== 0o600 ||
    metadata.size < 1 || metadata.size > maximumBytes ||
    (typeof process.getuid === 'function' && metadata.uid !== process.getuid())) {
    blocked(`Speech synthetic acceptance ${label} is not one owner-private regular file.`)
  }
  const bytes = await readFile(path)
  if (bytes.byteLength !== metadata.size) {
    blocked(`Speech synthetic acceptance ${label} changed during verification.`)
  }
  return Object.freeze({ byteLength: bytes.byteLength, sha256: sha256Bytes(bytes) })
}

async function readRegularBoundedFile(path: string, maximumBytes: number, label: string): Promise<Buffer> {
  let metadata
  let canonicalPath
  try {
    ;[metadata, canonicalPath] = await Promise.all([lstat(path), realpath(path)])
  } catch {
    blocked(`Speech synthetic acceptance ${label} is unavailable.`)
  }
  if (!metadata.isFile() || metadata.isSymbolicLink() || canonicalPath !== path ||
    metadata.size < 2 || metadata.size > maximumBytes) {
    blocked(`Speech synthetic acceptance ${label} is not one bounded regular file.`)
  }
  const bytes = await readFile(path)
  if (bytes.byteLength !== metadata.size || bytes.byteLength > maximumBytes) {
    blocked(`Speech synthetic acceptance ${label} changed during its bounded read.`)
  }
  return bytes
}

function validateSecretValue(raw: Buffer | Uint8Array | string): string {
  const value = (typeof raw === 'string' ? raw : Buffer.from(raw).toString('utf8')).trim()
  if (value.length < 16 || value.length > 4_096 || /\s/.test(value)) {
    blocked('Speech synthetic acceptance credential payload is malformed.')
  }
  return value
}

function inside(root: string, relativePath: string): string {
  if (!relativePath || relativePath.includes('\0') || relativePath.startsWith('/') ||
    relativePath.split(/[\\/]/u).includes('..')) {
    blocked('Speech synthetic acceptance path is unsafe.')
  }
  const path = resolve(root, relativePath)
  if (!path.startsWith(`${root}${sep}`)) blocked('Speech synthetic acceptance path escaped its repository root.')
  return path
}

function parseJson(bytes: Buffer, label: string): unknown {
  try {
    return JSON.parse(bytes.toString('utf8'))
  } catch {
    blocked(`Speech synthetic acceptance ${label} is malformed JSON.`)
  }
}

function object(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    blocked(`Speech synthetic acceptance ${label} is malformed.`)
  }
  return value as Record<string, unknown>
}

function exactIso(value: string, label: string): string {
  if (typeof value !== 'string' || !value.endsWith('Z') || Number.isNaN(Date.parse(value)) ||
    new Date(value).toISOString() !== value) {
    invalid(`Speech ${label} must be an exact ISO timestamp.`)
  }
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
