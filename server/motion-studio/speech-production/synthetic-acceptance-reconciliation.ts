import { createHash } from 'node:crypto'
import { lstat, readFile, realpath } from 'node:fs/promises'
import { resolve, sep } from 'node:path'

import { ApiError } from '../../errors/api-error'
import {
  persistCanonicalPrivateAudioArtifact,
  readCanonicalPrivateAudioArtifact,
} from '../../services/canonical-private-audio-artifact-storage'
import {
  readPrivateFileIfExistsWithinRoot,
  writePrivateFileCreateOnlyWithinRoot,
} from '../../security/private-local-persistence'
import {
  activatePrivateOfflineMediaBinaryRuntime,
  APPROVED_STORYTELLING_SPEECH_TAKE_NORMALIZATION_PROFILE_ID,
  OFFLINE_MEDIA_BINARY_OPERATIONS,
  openPrivateOfflineMediaBinaryRuntime,
  readPersistedOfflineMediaBinaryRuntimeAuthority,
} from '../../tool-execution/media-binary-execution'
import { parseMotionStudioPcmWave } from '../audio-production/pcm-wave'
import { sha256CanonicalJson } from '../commands/canonical-json'
import {
  MOTION_STUDIO_SPEECH_SYNTHETIC_ACCEPTANCE_AUTHORIZATION_ID,
  MOTION_STUDIO_SPEECH_SYNTHETIC_ACCEPTANCE_LIVE_OPERATOR_PATHS,
  MOTION_STUDIO_SPEECH_SYNTHETIC_ACCEPTANCE_TEXT,
} from './synthetic-acceptance-live-operator'
import {
  compileCanonicalMotionStudioSpeechNormalizationExecution,
} from './canonical-normalization-execution-adapter'

const SHA256 = /^[a-f0-9]{64}$/
const TRACKED_RESULT_RELATIVE_PATH =
  'tasks/motion-studio/MS-012C/c2-synthetic-acceptance-live-result.json' as const
const TRACKED_RESULT_DIGEST =
  '0a52b67146d13c6d46551167e9eba05a7d3dc3d6695d2171caa28ed2977a1490' as const
const RECONCILIATION_FILENAME = 'synthetic-acceptance-reconciliation.json' as const
const MAXIMUM_TRACKED_RESULT_BYTES = 256 * 1024
const MAXIMUM_PRIVATE_JSON_BYTES = 256 * 1024
const MAXIMUM_SOURCE_AUDIO_BYTES = 16 * 1024 * 1024
const PRIVATE_DIRECTORY_MODE = 0o700
const PRIVATE_FILE_MODE = 0o600
const ALIGNMENT_DURATION_TOLERANCE_SECONDS = 0.15

export const MOTION_STUDIO_SPEECH_SYNTHETIC_ACCEPTANCE_RECONCILIATION_PATHS = Object.freeze({
  trackedResultRelativePath: TRACKED_RESULT_RELATIVE_PATH,
  privateRunRootRelativePath:
    MOTION_STUDIO_SPEECH_SYNTHETIC_ACCEPTANCE_LIVE_OPERATOR_PATHS.privateRunRootRelativePath,
  reconciliationFilename: RECONCILIATION_FILENAME,
})

export const MOTION_STUDIO_SPEECH_SYNTHETIC_ACCEPTANCE_TRACKED_RESULT_DIGEST =
  TRACKED_RESULT_DIGEST

export type MotionStudioSpeechSyntheticAcceptanceReconciliationGate =
  | 'tracked_result_integrity'
  | 'private_storage_integrity'
  | 'single_use_authority_integrity'
  | 'provider_evidence_integrity'
  | 'source_audio_integrity'
  | 'source_decode_and_normalization'
  | 'normalized_format'
  | 'non_silent'
  | 'sample_clipping'
  | 'alignment_exact_text'
  | 'alignment_monotonic'
  | 'alignment_timing_fit'
  | 'provider_cost_evidence'
  | 'privacy_boundary'
  | 'replay_boundary'
  | 'independent_transcription'
  | 'meaning_fidelity'
  | 'pronunciation'
  | 'human_listening'
  | 'voice_continuity'
  | 'production_zero_retention'
  | 'production_account_preflight'
  | 'local_compute_cost_reconciliation'

export interface MotionStudioSpeechSyntheticAcceptanceReconciliationV1 {
  schemaVersion: 'motion-studio.speech-synthetic-acceptance-reconciliation.v1'
  state: 'private_synthetic_audio_reconciled_semantic_review_required_not_production_ready'
  evidenceClass: 'authenticated_provider_synthetic_acceptance' | 'private_local_fixture'
  authorizationId: string
  authorityPacketDigest: string
  ownerAuthorizationEvidenceId: string
  trackedResultDigest: string
  providerEvidenceDigest: string
  alignmentEvidenceDigest: string
  syntheticTextDigest: string
  syntheticTextCharacterCount: number
  source: {
    mimeType: 'audio/mpeg'
    byteLength: number
    sha256: string
    privateFileMode: '0600'
    decodeVerifiedByPinnedRuntime: true
    rawProviderResponsePersisted: false
  }
  normalizedArtifact: {
    privateObjectIdentityHash: string
    mimeType: 'audio/wav'
    codec: 'pcm_s16le'
    sampleRateHertz: 48_000
    channelCount: 1
    bitsPerSample: 16
    sampleCountPerChannel: number
    durationMilliseconds: number
    byteLength: number
    sha256: string
    runtimeImageIdentityDigest: string
    runtimeAuthorityDigest: string
    normalizationRequestDigest: string
    normalizationAttestationDigest: string
    confinementDigest: string
    privateFileMode: '0600'
  }
  alignment: {
    source: 'elevenlabs_character_alignment'
    exactSourceText: true
    exactNormalizedText: true
    sourceCharacterCount: number
    normalizedCharacterCount: number
    wordCount: number
    firstCharacterStartSeconds: number
    lastCharacterEndSeconds: number
    monotonic: true
    fitsNormalizedAudio: true
    recommendedMinimumSegmentFramesAt24Fps: number
    recommendedMinimumSegmentFramesAt30Fps: number
    masterTimingMutationPerformed: false
    captionMutationPerformed: false
  }
  objectiveAudioQa: {
    rmsLinear: number
    rmsDbfs: number
    samplePeakDbfs: number
    silent: false
    clippingDetected: false
  }
  qa: {
    results: readonly {
      gate: MotionStudioSpeechSyntheticAcceptanceReconciliationGate
      result: 'passed' | 'not_evaluated'
      blocksTakeSelection: boolean
      blocksProductionReadiness: boolean
      evidenceId: string
      note: string
    }[]
    qaEvidenceDigest: string
    privateSyntheticTechnicalAcceptanceReady: true
    takeSelectionEligible: false
    productionReadinessEligible: false
  }
  cost: {
    currency: 'USD'
    providerCharacterCostCredits: number
    providerCharacterCostMicrocredits: number
    publicListProviderCostMicros: number
    maximumAuthorizedInternalProductionCostMicros: number
    providerUsageWithinAuthorizedCeiling: true
    exactAccountInvoiceClaimed: false
    localComputeCostState: 'not_reconciled_no_infrastructure_cpu_meter'
    localComputeCostMicros: null
    customerPricingIncluded: false
    customerCreditsIncluded: false
    serviceFeeIncluded: false
    customerBillingPerformed: false
  }
  privacyAndRetention: {
    privateLocalOnly: true
    standardProviderRetentionAcceptedForSyntheticProof: true
    syntheticAcceptanceOnly: true
    userContentUsed: false
    zeroRetentionClaimed: false
    productionZeroRetentionSatisfied: false
    credentialPersisted: false
    providerVoiceIdPersisted: false
    browserProjectionAllowed: false
  }
  selection: {
    selected: false
    firstTakeAutoAccepted: false
    semanticReviewRequired: true
    listeningReviewRequired: true
    finalAssetEligible: false
    finalNarrationMutationPerformed: false
    timelineMutationPerformed: false
  }
  persistence: {
    privateLocalOnly: true
    privateRunRootRelativePath: string
    reconciliationFilename: typeof RECONCILIATION_FILENAME
    normalizedAudioPersistedCreateOnly: true
    reconciliationPersistedCreateOnly: true
  }
  readiness: {
    privateTransportIntegrationEvidenceReady: true
    privateNormalizationEvidenceReady: true
    privateSyntheticTechnicalAcceptanceReady: true
    independentTranscriptionEvaluated: false
    humanListeningReviewComplete: false
    productionAccountPreflightSatisfied: false
    productionZeroRetentionSatisfied: false
    candidateSelected: false
    timelineMutationPerformed: false
    productReady: false
    externalBetaReady: false
    productionReady: false
    finalDeliveryReady: false
  }
  reconciledAt: string
  immutable: true
  evidenceDigest: string
}

interface RepositoryReconciliationConfig {
  trackedResultRelativePath: string
  privateRunRootRelativePath: string
  expectedTrackedResultDigest: string
  expectedAuthorizationId: string
  expectedSyntheticText: string
  expectedEvidenceClass?: MotionStudioSpeechSyntheticAcceptanceReconciliationV1['evidenceClass']
}

interface VerifiedTrackedResult {
  evidenceClass: MotionStudioSpeechSyntheticAcceptanceReconciliationV1['evidenceClass']
  authorizationId: string
  authorityPacketDigest: string
  ownerAuthorizationEvidenceId: string
  trackedResultDigest: string
  syntheticTextDigest: string
  syntheticTextCharacterCount: number
  providerEvidenceDigest: string
  alignmentEvidenceDigest: string
  sourceDescriptor: PrivateFileDescriptor
  alignmentDescriptor: PrivateFileDescriptor
  consumptionDescriptor: PrivateFileDescriptor
  evidenceDescriptor: PrivateFileDescriptor
  providerCharacterCostCredits: number
  providerCharacterCostMicrocredits: number
  publicListProviderCostMicros: number
  maximumAuthorizedInternalProductionCostMicros: number
  privateRunRootRelativePath: string
}

interface PrivateFileDescriptor {
  filename: string
  byteLength: number
  sha256: string
  mode: '0600'
}

interface CharacterAlignment {
  characters: readonly string[]
  characterStartTimesSeconds: readonly number[]
  characterEndTimesSeconds: readonly number[]
}

interface VerifiedAlignment {
  alignmentEvidenceDigest: string
  alignment: CharacterAlignment
  normalizedAlignment: CharacterAlignment
  wordCount: number
  firstCharacterStartSeconds: number
  lastCharacterEndSeconds: number
}

export async function reconcileMotionStudioSpeechSyntheticAcceptance(input: {
  repositoryRoot: string
  reconciledAt: string
}): Promise<MotionStudioSpeechSyntheticAcceptanceReconciliationV1> {
  return reconcileFromRepository(input, {
    trackedResultRelativePath: TRACKED_RESULT_RELATIVE_PATH,
    privateRunRootRelativePath:
      MOTION_STUDIO_SPEECH_SYNTHETIC_ACCEPTANCE_LIVE_OPERATOR_PATHS.privateRunRootRelativePath,
    expectedTrackedResultDigest: TRACKED_RESULT_DIGEST,
    expectedAuthorizationId: MOTION_STUDIO_SPEECH_SYNTHETIC_ACCEPTANCE_AUTHORIZATION_ID,
    expectedSyntheticText: MOTION_STUDIO_SPEECH_SYNTHETIC_ACCEPTANCE_TEXT,
    expectedEvidenceClass: 'authenticated_provider_synthetic_acceptance',
  })
}

/** Offline-only fixture seam used by smoke tests. It cannot read credentials or call a provider. */
export async function reconcileMotionStudioSpeechSyntheticAcceptanceFixture(input: {
  repositoryRoot: string
  reconciledAt: string
  trackedResultRelativePath: string
  privateRunRootRelativePath: string
  expectedTrackedResultDigest: string
  expectedAuthorizationId: string
  expectedSyntheticText: string
}): Promise<MotionStudioSpeechSyntheticAcceptanceReconciliationV1> {
  return reconcileFromRepository(input, {
    trackedResultRelativePath: input.trackedResultRelativePath,
    privateRunRootRelativePath: input.privateRunRootRelativePath,
    expectedTrackedResultDigest: input.expectedTrackedResultDigest,
    expectedAuthorizationId: input.expectedAuthorizationId,
    expectedSyntheticText: input.expectedSyntheticText,
    expectedEvidenceClass: 'private_local_fixture',
  })
}

async function reconcileFromRepository(
  input: { repositoryRoot: string; reconciledAt: string },
  config: RepositoryReconciliationConfig,
): Promise<MotionStudioSpeechSyntheticAcceptanceReconciliationV1> {
  const repositoryRoot = await realpath(input.repositoryRoot)
  const reconciledAt = exactIso(input.reconciledAt, 'synthetic reconciliation time')
  const trackedBytes = await readBoundedRegularFile(
    inside(repositoryRoot, config.trackedResultRelativePath),
    MAXIMUM_TRACKED_RESULT_BYTES,
    'tracked synthetic acceptance result',
  )
  const tracked = validateTrackedResult(parseJson(trackedBytes, 'tracked result'), config)
  const privateRoot = inside(repositoryRoot, config.privateRunRootRelativePath)
  await assertPrivateDirectory(privateRoot)

  const sourceBytes = await readVerifiedPrivateFile(privateRoot, tracked.sourceDescriptor, MAXIMUM_SOURCE_AUDIO_BYTES)
  const alignmentBytes = await readVerifiedPrivateFile(
    privateRoot, tracked.alignmentDescriptor, MAXIMUM_PRIVATE_JSON_BYTES)
  const consumptionBytes = await readVerifiedPrivateFile(
    privateRoot, tracked.consumptionDescriptor, MAXIMUM_PRIVATE_JSON_BYTES)
  const providerEvidenceBytes = await readVerifiedPrivateFile(
    privateRoot, tracked.evidenceDescriptor, MAXIMUM_PRIVATE_JSON_BYTES)
  await assertNoPrivateFailureRecord(privateRoot)
  validateAuthorityConsumption(parseJson(consumptionBytes, 'authority consumption'), tracked)
  validateProviderEvidence(parseJson(providerEvidenceBytes, 'provider evidence'), tracked)
  const alignment = validateAlignmentEvidence(
    parseJson(alignmentBytes, 'alignment evidence'), tracked, config.expectedSyntheticText)

  const existingBytes = await readPrivateFileIfExistsWithinRoot({
    rootPath: privateRoot,
    relativePath: RECONCILIATION_FILENAME,
  })
  if (existingBytes) {
    await assertPrivateFileMode(resolve(privateRoot, RECONCILIATION_FILENAME), PRIVATE_FILE_MODE)
    const existing = validatePersistedReconciliation(parseJson(existingBytes, 'reconciliation evidence'), tracked)
    const stored = await readCanonicalPrivateAudioArtifact({
      localStorageRoot: privateRoot,
      privateObjectIdentityHash: existing.normalizedArtifact.privateObjectIdentityHash,
    })
    if (!stored || stored.sha256 !== existing.normalizedArtifact.sha256 ||
      stored.byteLength !== existing.normalizedArtifact.byteLength) {
      blocked('Synthetic reconciliation audio changed after its create-only commit.')
    }
    await assertPrivateFileMode(
      canonicalAudioPath(privateRoot, existing.normalizedArtifact.privateObjectIdentityHash),
      PRIVATE_FILE_MODE,
    )
    return deepFreeze(existing)
  }

  const activatedRuntime = await activatePrivateOfflineMediaBinaryRuntime()
  const runtimeAuthority = await readPersistedOfflineMediaBinaryRuntimeAuthority()
  if (
    !runtimeAuthority || !runtimeAuthority.readiness.privateInternalExecutionReady ||
    runtimeAuthority.readiness.productReady || runtimeAuthority.readiness.externalBetaReady ||
    runtimeAuthority.readiness.productionReady || runtimeAuthority.readiness.finalExportReady ||
    !runtimeAuthority.supportedOperations.some((entry) =>
      entry.toolId === 'ffmpeg' &&
      entry.operationId === OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg) ||
    !runtimeAuthority.supportedRecipeProfiles.includes(
      APPROVED_STORYTELLING_SPEECH_TAKE_NORMALIZATION_PROFILE_ID)
  ) blocked('Pinned private speech normalization runtime authority is unavailable.')
  const runtime = await openPrivateOfflineMediaBinaryRuntime()
  if (
    runtime.image.imageIdentityHash !== activatedRuntime.image.imageIdentityHash ||
    runtime.image.imageIdentityHash !== runtimeAuthority.image.imageIdentityHash
  ) blocked('Pinned speech normalization runtime changed after activation.')

  const frameRate = 30 as const
  const endFrameExclusive = Math.max(
    1,
    Math.ceil(alignment.lastCharacterEndSeconds * frameRate),
  )
  const preparedScriptSegmentId =
    `synthetic-segment-${tracked.trackedResultDigest.slice(0, 40)}`
  const voiceBibleContentDigest = sha256CanonicalJson({
    domain: 'motion-studio:synthetic-speech-voice-bible:v1',
    authorizationId: tracked.authorizationId,
    authorityPacketDigest: tracked.authorityPacketDigest,
    ownerAuthorizationEvidenceId: tracked.ownerAuthorizationEvidenceId,
  })
  const timingAuthorityDigest = sha256CanonicalJson({
    domain: 'motion-studio:synthetic-speech-timing-authority:v1',
    alignmentEvidenceDigest: tracked.alignmentEvidenceDigest,
    frameRate,
    startFrame: 0,
    endFrameExclusive,
  })
  const normalization =
    compileCanonicalMotionStudioSpeechNormalizationExecution({
      productionId:
        `synthetic-production-${tracked.authorizationId.slice(0, 40)}`,
      productionAuthorityDigest: tracked.authorityPacketDigest,
      providerOutputAuthorityDigest: tracked.providerEvidenceDigest,
      preparedScriptSegmentId,
      sceneId: `synthetic-scene-${tracked.trackedResultDigest.slice(0, 40)}`,
      voiceBibleVersionId:
        `synthetic-voice-bible-${tracked.authorityPacketDigest.slice(0, 40)}`,
      voiceBibleContentDigest,
      spokenTextDigest: tracked.syntheticTextDigest,
      timingAuthorityDigest,
      startFrame: 0,
      endFrameExclusive,
      frameRate,
      sourceAudio: {
        mimeType: 'audio/mpeg',
        bytes: sourceBytes,
        byteLength: sourceBytes.byteLength,
        sha256: tracked.sourceDescriptor.sha256,
      },
      alignmentBinding: {
        contentSha256: tracked.alignmentDescriptor.sha256,
        sourceAudioSha256: tracked.sourceDescriptor.sha256,
        preparedScriptSegmentId,
        voiceBibleContentDigest,
        spokenTextDigest: tracked.syntheticTextDigest,
        timingAuthorityDigest,
      },
    })
  const normalized = await runtime.executeServerInjected(
    normalization.request,
    normalization.source,
  )
  if (
    normalized.evidence.sourceSha256 !== tracked.sourceDescriptor.sha256 ||
    normalized.evidence.resultSha256 !== normalized.resultArtifact.sha256 ||
    normalized.evidence.semanticEvidence.recipeProfileId !==
      APPROVED_STORYTELLING_SPEECH_TAKE_NORMALIZATION_PROFILE_ID ||
    normalized.evidence.semanticEvidence.sourceAuthorityDigest !==
      normalization.sourceAuthorityDigest ||
    normalized.evidence.semanticEvidence.productionAuthorityHash !==
      normalization.productionAuthorityHash ||
    normalized.evidence.containerExitCode !== 0 || normalized.evidence.oomKilled ||
    normalized.readiness.privateInternalOnly !== true || normalized.readiness.productReady ||
    normalized.readiness.externalBetaReady || normalized.readiness.productionReady
  ) blocked('Pinned speech normalization evidence is outside the private acceptance boundary.')
  const wave = parseMotionStudioPcmWave(normalized.resultArtifact.bytes)
  if (
    normalized.resultArtifact.mimeType !== 'audio/wav' ||
    wave.sampleRateHertz !== 48_000 || wave.channelCount !== 1 ||
    wave.sampleCountPerChannel !== normalized.resultArtifact.sampleCountPerChannel ||
    wave.durationMilliseconds !== normalized.resultArtifact.durationMilliseconds ||
    wave.bitsPerSample !== 16
  ) blocked('Normalized synthetic speech does not match its exact PCM evidence.')
  const durationSeconds = wave.sampleCountPerChannel / wave.sampleRateHertz
  if (alignment.lastCharacterEndSeconds > durationSeconds + ALIGNMENT_DURATION_TOLERANCE_SECONDS) {
    blocked('Synthetic speech alignment exceeds the normalized audio duration.')
  }
  const metrics = analyzePcm(wave.interleavedSamples)
  if (metrics.rmsLinear <= 0.000_01) blocked('Normalized synthetic speech is silent.')
  if (metrics.samplePeakDbfs > -0.01) blocked('Normalized synthetic speech is clipped.')

  const privateObjectIdentityHash = sha256CanonicalJson({
    domain: 'motion_studio_synthetic_speech_acceptance_normalized_audio_v1',
    authorizationId: tracked.authorizationId,
    trackedResultDigest: tracked.trackedResultDigest,
    sourceSha256: tracked.sourceDescriptor.sha256,
    normalizedSha256: normalized.resultArtifact.sha256,
  })
  await persistCanonicalPrivateAudioArtifact({
    localStorageRoot: privateRoot,
    privateObjectIdentityHash,
    bytes: normalized.resultArtifact.bytes,
    expectedSha256: normalized.resultArtifact.sha256,
  })
  const stored = await readCanonicalPrivateAudioArtifact({ localStorageRoot: privateRoot, privateObjectIdentityHash })
  if (!stored || stored.sha256 !== normalized.resultArtifact.sha256 ||
    stored.byteLength !== normalized.resultArtifact.byteLength) {
    blocked('Normalized synthetic speech changed during create-only private persistence.')
  }
  await assertPrivateFileMode(canonicalAudioPath(privateRoot, privateObjectIdentityHash), PRIVATE_FILE_MODE)

  const qaResults = createQaResults({
    authorizationId: tracked.authorizationId,
    trackedResultDigest: tracked.trackedResultDigest,
    sourceSha256: tracked.sourceDescriptor.sha256,
    normalizedSha256: normalized.resultArtifact.sha256,
    alignmentEvidenceDigest: alignment.alignmentEvidenceDigest,
    normalizationAttestationDigest: normalized.attestation.attestationHash,
  })
  const qaEvidenceDigest = sha256CanonicalJson(qaResults)
  const runtimeAuthorityDigest = runtimeAuthority.authorityHash
  const base: Omit<MotionStudioSpeechSyntheticAcceptanceReconciliationV1, 'evidenceDigest'> = {
    schemaVersion: 'motion-studio.speech-synthetic-acceptance-reconciliation.v1',
    state: 'private_synthetic_audio_reconciled_semantic_review_required_not_production_ready',
    evidenceClass: tracked.evidenceClass,
    authorizationId: tracked.authorizationId,
    authorityPacketDigest: tracked.authorityPacketDigest,
    ownerAuthorizationEvidenceId: tracked.ownerAuthorizationEvidenceId,
    trackedResultDigest: tracked.trackedResultDigest,
    providerEvidenceDigest: tracked.providerEvidenceDigest,
    alignmentEvidenceDigest: tracked.alignmentEvidenceDigest,
    syntheticTextDigest: tracked.syntheticTextDigest,
    syntheticTextCharacterCount: tracked.syntheticTextCharacterCount,
    source: {
      mimeType: 'audio/mpeg',
      byteLength: sourceBytes.byteLength,
      sha256: tracked.sourceDescriptor.sha256,
      privateFileMode: '0600',
      decodeVerifiedByPinnedRuntime: true,
      rawProviderResponsePersisted: false,
    },
    normalizedArtifact: {
      privateObjectIdentityHash,
      mimeType: 'audio/wav',
      codec: 'pcm_s16le',
      sampleRateHertz: 48_000,
      channelCount: 1,
      bitsPerSample: 16,
      sampleCountPerChannel: wave.sampleCountPerChannel,
      durationMilliseconds: wave.durationMilliseconds,
      byteLength: normalized.resultArtifact.byteLength,
      sha256: normalized.resultArtifact.sha256,
      runtimeImageIdentityDigest: runtime.image.imageIdentityHash,
      runtimeAuthorityDigest,
      normalizationRequestDigest: normalized.evidence.requestEnvelopeSha256,
      normalizationAttestationDigest: normalized.attestation.attestationHash,
      confinementDigest: sha256CanonicalJson(normalized.evidence.confinement),
      privateFileMode: '0600',
    },
    alignment: {
      source: 'elevenlabs_character_alignment',
      exactSourceText: true,
      exactNormalizedText: true,
      sourceCharacterCount: alignment.alignment.characters.length,
      normalizedCharacterCount: alignment.normalizedAlignment.characters.length,
      wordCount: alignment.wordCount,
      firstCharacterStartSeconds: alignment.firstCharacterStartSeconds,
      lastCharacterEndSeconds: alignment.lastCharacterEndSeconds,
      monotonic: true,
      fitsNormalizedAudio: true,
      recommendedMinimumSegmentFramesAt24Fps: Math.ceil(durationSeconds * 24),
      recommendedMinimumSegmentFramesAt30Fps: Math.ceil(durationSeconds * 30),
      masterTimingMutationPerformed: false,
      captionMutationPerformed: false,
    },
    objectiveAudioQa: {
      rmsLinear: metrics.rmsLinear,
      rmsDbfs: metrics.rmsDbfs,
      samplePeakDbfs: metrics.samplePeakDbfs,
      silent: false,
      clippingDetected: false,
    },
    qa: {
      results: qaResults,
      qaEvidenceDigest,
      privateSyntheticTechnicalAcceptanceReady: true,
      takeSelectionEligible: false,
      productionReadinessEligible: false,
    },
    cost: {
      currency: 'USD',
      providerCharacterCostCredits: tracked.providerCharacterCostCredits,
      providerCharacterCostMicrocredits: tracked.providerCharacterCostMicrocredits,
      publicListProviderCostMicros: tracked.publicListProviderCostMicros,
      maximumAuthorizedInternalProductionCostMicros:
        tracked.maximumAuthorizedInternalProductionCostMicros,
      providerUsageWithinAuthorizedCeiling: true,
      exactAccountInvoiceClaimed: false,
      localComputeCostState: 'not_reconciled_no_infrastructure_cpu_meter',
      localComputeCostMicros: null,
      customerPricingIncluded: false,
      customerCreditsIncluded: false,
      serviceFeeIncluded: false,
      customerBillingPerformed: false,
    },
    privacyAndRetention: {
      privateLocalOnly: true,
      standardProviderRetentionAcceptedForSyntheticProof: true,
      syntheticAcceptanceOnly: true,
      userContentUsed: false,
      zeroRetentionClaimed: false,
      productionZeroRetentionSatisfied: false,
      credentialPersisted: false,
      providerVoiceIdPersisted: false,
      browserProjectionAllowed: false,
    },
    selection: {
      selected: false,
      firstTakeAutoAccepted: false,
      semanticReviewRequired: true,
      listeningReviewRequired: true,
      finalAssetEligible: false,
      finalNarrationMutationPerformed: false,
      timelineMutationPerformed: false,
    },
    persistence: {
      privateLocalOnly: true,
      privateRunRootRelativePath: tracked.privateRunRootRelativePath,
      reconciliationFilename: RECONCILIATION_FILENAME,
      normalizedAudioPersistedCreateOnly: true,
      reconciliationPersistedCreateOnly: true,
    },
    readiness: {
      privateTransportIntegrationEvidenceReady: true,
      privateNormalizationEvidenceReady: true,
      privateSyntheticTechnicalAcceptanceReady: true,
      independentTranscriptionEvaluated: false,
      humanListeningReviewComplete: false,
      productionAccountPreflightSatisfied: false,
      productionZeroRetentionSatisfied: false,
      candidateSelected: false,
      timelineMutationPerformed: false,
      productReady: false,
      externalBetaReady: false,
      productionReady: false,
      finalDeliveryReady: false,
    },
    reconciledAt,
    immutable: true,
  }
  const evidence = deepFreeze({ ...base, evidenceDigest: sha256CanonicalJson(base) })
  const envelope = Buffer.from(`${JSON.stringify(evidence, null, 2)}\n`, 'utf8')
  await writePrivateFileCreateOnlyWithinRoot({
    rootPath: privateRoot,
    relativePath: RECONCILIATION_FILENAME,
    content: envelope,
  })
  const committed = await readPrivateFileIfExistsWithinRoot({
    rootPath: privateRoot,
    relativePath: RECONCILIATION_FILENAME,
  })
  if (!committed || !committed.equals(envelope)) {
    blocked('Synthetic reconciliation changed during create-only private persistence.')
  }
  await assertPrivateFileMode(resolve(privateRoot, RECONCILIATION_FILENAME), PRIVATE_FILE_MODE)
  return evidence
}

function validateTrackedResult(value: unknown, config: RepositoryReconciliationConfig): VerifiedTrackedResult {
  const result = object(value, 'tracked result')
  const resultDigest = text(result.resultDigest, 'tracked result digest')
  const base = { ...result }
  delete base.resultDigest
  if (
    !SHA256.test(config.expectedTrackedResultDigest) ||
    resultDigest !== config.expectedTrackedResultDigest ||
    sha256CanonicalJson(base) !== resultDigest ||
    result.schemaVersion !== 'motion-studio.speech-synthetic-acceptance-tracked-result.v1' ||
    result.status !== 'completed_private_synthetic_transport_evidence_ready_not_production_ready' ||
    result.authorizationId !== config.expectedAuthorizationId ||
    result.immutable !== true
  ) blocked('Tracked synthetic acceptance result failed its immutable authority.')
  const retention = object(result.retention, 'tracked retention')
  const usage = object(result.usage, 'tracked usage')
  const cost = object(result.cost, 'tracked cost')
  const privateEvidence = object(result.privateEvidence, 'tracked private evidence')
  const readiness = object(result.readiness, 'tracked readiness')
  const evidenceClass = config.expectedEvidenceClass ?? 'authenticated_provider_synthetic_acceptance'
  if (
    retention.mode !== 'standard_provider_retention' ||
    retention.syntheticAcceptanceOnly !== true || retention.zeroRetentionClaimed !== false ||
    retention.productionZeroRetentionGateSatisfied !== false ||
    usage.credentialPayloadReadCount !== 1 || usage.providerRequestAttemptCount !== 1 ||
    usage.providerRequestCompletedCount !== 1 || usage.providerGenerationCount !== 1 ||
    usage.automaticRetryCount !== 0 || usage.automaticFallbackCount !== 0 ||
    usage.purchaseCount !== 0 || usage.accountMutationCount !== 0 ||
    cost.currency !== 'USD' || cost.exactAccountInvoiceClaimed !== false ||
    cost.customerPricingIncluded !== false || cost.customerCreditsIncluded !== false ||
    cost.customerBillingPerformed !== false ||
    privateEvidence.rootRelativePath !== config.privateRunRootRelativePath ||
    privateEvidence.rootMode !== '0700' || privateEvidence.failureRecordPresent !== false ||
    privateEvidence.rawProviderResponsePersisted !== false ||
    privateEvidence.credentialPersisted !== false || privateEvidence.browserProjectionAllowed !== false ||
    readiness.privateTransportIntegrationEvidenceReady !== true ||
    readiness.independentTranscriptionEvaluated !== false ||
    readiness.humanListeningReviewComplete !== false ||
    readiness.productionAccountPreflightSatisfied !== false ||
    readiness.productionZeroRetentionSatisfied !== false || readiness.candidateSelected !== false ||
    readiness.timelineMutationPerformed !== false || readiness.productReady !== false ||
    readiness.externalBetaReady !== false || readiness.productionReady !== false ||
    readiness.finalDeliveryReady !== false
  ) blocked('Tracked synthetic acceptance result crosses its private evidence boundary.')
  const syntheticTextDigest = text(result.syntheticTextDigest, 'synthetic text digest')
  if (
    syntheticTextDigest !== sha256Text(config.expectedSyntheticText) ||
    result.syntheticTextCharacterCount !== config.expectedSyntheticText.length
  ) blocked('Tracked synthetic acceptance text changed after authorization.')
  const providerCharacterCostCredits = safeNonNegativeNumber(
    usage.providerCharacterCostCredits, 'provider character cost credits')
  const providerCharacterCostMicrocredits = safeInteger(
    usage.providerCharacterCostMicrocredits, 'provider character cost microcredits', 0)
  const publicListProviderCostMicros = safeInteger(
    cost.publicListProviderCostMicros, 'public-list provider cost', 0)
  const maximumAuthorizedInternalProductionCostMicros = safeInteger(
    cost.maximumAuthorizedInternalProductionCostMicros, 'maximum authorized internal cost', 1)
  if (
    providerCharacterCostMicrocredits !== providerCharacterCostCredits * 1_000_000 ||
    publicListProviderCostMicros > maximumAuthorizedInternalProductionCostMicros
  ) blocked('Tracked synthetic acceptance provider cost evidence is inconsistent or over ceiling.')
  const consumption = privateDescriptor(privateEvidence.consumption, 'authority consumption')
  const audio = privateDescriptor(privateEvidence.audio, 'source audio')
  const alignment = privateDescriptor(privateEvidence.alignment, 'alignment evidence')
  const evidence = privateDescriptor(privateEvidence.evidence, 'provider evidence')
  const alignmentRecord = object(privateEvidence.alignment, 'tracked alignment evidence')
  const providerRecord = object(privateEvidence.evidence, 'tracked provider evidence')
  const alignmentEvidenceDigest = text(alignmentRecord.alignmentDigest, 'alignment evidence digest')
  const providerEvidenceDigest = text(providerRecord.evidenceDigest, 'provider evidence digest')
  if (!SHA256.test(alignmentEvidenceDigest) || !SHA256.test(providerEvidenceDigest)) {
    blocked('Tracked synthetic acceptance private evidence digest is malformed.')
  }
  const runtimeEvidenceClass = result.evidenceClass
  if (runtimeEvidenceClass !== undefined && runtimeEvidenceClass !== evidenceClass) {
    blocked('Tracked synthetic acceptance evidence class changed after authorization.')
  }
  return {
    evidenceClass,
    authorizationId: config.expectedAuthorizationId,
    authorityPacketDigest: digest(result.authorityPacketDigest, 'authority packet digest'),
    ownerAuthorizationEvidenceId: text(
      result.ownerAuthorizationEvidenceId, 'owner authorization evidence ID'),
    trackedResultDigest: resultDigest,
    syntheticTextDigest,
    syntheticTextCharacterCount: config.expectedSyntheticText.length,
    providerEvidenceDigest,
    alignmentEvidenceDigest,
    sourceDescriptor: audio,
    alignmentDescriptor: alignment,
    consumptionDescriptor: consumption,
    evidenceDescriptor: evidence,
    providerCharacterCostCredits,
    providerCharacterCostMicrocredits,
    publicListProviderCostMicros,
    maximumAuthorizedInternalProductionCostMicros,
    privateRunRootRelativePath: config.privateRunRootRelativePath,
  }
}

function validateAuthorityConsumption(value: unknown, tracked: VerifiedTrackedResult): void {
  const record = object(value, 'authority consumption')
  if (
    record.schemaVersion !== 'motion-studio.speech-synthetic-acceptance-authority-consumption.v1' ||
    record.state !== 'single_use_authority_consumed_before_credential_read' ||
    record.authorizationId !== tracked.authorizationId ||
    record.authorityPacketDigest !== tracked.authorityPacketDigest ||
    record.ownerAuthorizationEvidenceId !== tracked.ownerAuthorizationEvidenceId ||
    record.syntheticTextDigest !== tracked.syntheticTextDigest ||
    record.syntheticTextCharacterCount !== tracked.syntheticTextCharacterCount ||
    record.standardProviderRetentionAcceptedForSyntheticProof !== true ||
    record.zeroRetentionClaimed !== false || record.credentialPayloadReadCountAtConsumption !== 0 ||
    record.providerRequestAttemptCountAtConsumption !== 0 ||
    record.providerGenerationCountAtConsumption !== 0 || record.immutable !== true
  ) blocked('Synthetic acceptance single-use authority consumption evidence is inconsistent.')
}

function validateProviderEvidence(value: unknown, tracked: VerifiedTrackedResult): void {
  const evidence = object(value, 'provider evidence')
  const evidenceDigest = digest(evidence.evidenceDigest, 'provider evidence digest')
  const base = { ...evidence }
  delete base.evidenceDigest
  const audio = object(evidence.audio, 'provider evidence audio')
  const alignment = object(evidence.alignment, 'provider evidence alignment')
  const usage = object(evidence.usage, 'provider evidence usage')
  const cost = object(evidence.costEvidence, 'provider cost evidence')
  const boundaries = object(evidence.boundaries, 'provider evidence boundaries')
  if (
    evidenceDigest !== tracked.providerEvidenceDigest || sha256CanonicalJson(base) !== evidenceDigest ||
    evidence.schemaVersion !== 'motion-studio.speech-synthetic-acceptance-private-evidence.v1' ||
    evidence.state !== 'private_synthetic_transport_evidence_ready_not_production_ready' ||
    evidence.evidenceClass !== tracked.evidenceClass || evidence.authorizationId !== tracked.authorizationId ||
    evidence.authorityPacketDigest !== tracked.authorityPacketDigest ||
    evidence.ownerAuthorizationEvidenceId !== tracked.ownerAuthorizationEvidenceId ||
    evidence.syntheticTextDigest !== tracked.syntheticTextDigest ||
    evidence.syntheticTextCharacterCount !== tracked.syntheticTextCharacterCount ||
    evidence.standardProviderRetentionAcceptedForSyntheticProof !== true ||
    evidence.zeroRetentionClaimed !== false || evidence.immutable !== true ||
    audio.filename !== tracked.sourceDescriptor.filename ||
    audio.mimeType !== 'audio/mpeg' || audio.byteLength !== tracked.sourceDescriptor.byteLength ||
    audio.sha256 !== tracked.sourceDescriptor.sha256 ||
    alignment.filename !== tracked.alignmentDescriptor.filename ||
    alignment.digest !== tracked.alignmentEvidenceDigest ||
    usage.credentialPayloadReadCount !== 1 || usage.providerRequestAttemptCount !== 1 ||
    usage.providerRequestCompletedCount !== 1 || usage.providerGenerationCount !== 1 ||
    usage.automaticRetryCount !== 0 || usage.automaticFallbackCount !== 0 ||
    usage.purchaseCount !== 0 || usage.accountMutationCount !== 0 ||
    evidence.providerCharacterCostCredits !== tracked.providerCharacterCostCredits ||
    evidence.providerCharacterCostMicrocredits !== tracked.providerCharacterCostMicrocredits ||
    cost.publicListProviderCostMicros !== tracked.publicListProviderCostMicros ||
    cost.maximumAuthorizedInternalProductionCostMicros !==
      tracked.maximumAuthorizedInternalProductionCostMicros ||
    cost.exactAccountInvoiceCostStatus !== 'not_available_subscription_scope_read_blocked' ||
    cost.customerPricingIncluded !== false || cost.customerCreditsIncluded !== false ||
    cost.customerBillingPerformed !== false ||
    boundaries.syntheticAcceptanceOnly !== true || boundaries.userContentUsed !== false ||
    boundaries.productionUserDefault !== false || boundaries.finalVoiceSelectionAllowed !== false ||
    boundaries.timelineMutationAllowed !== false || boundaries.renderAllowed !== false ||
    boundaries.exportAllowed !== false || boundaries.publicDeliveryAllowed !== false ||
    boundaries.productReady !== false || boundaries.externalBetaReady !== false ||
    boundaries.productionReady !== false
  ) blocked('Synthetic acceptance provider evidence failed immutable private reconciliation.')
  const serialized = JSON.stringify(evidence)
  if (
    serialized.includes('providerVoiceId') || serialized.includes('audio_base64') ||
    serialized.includes('credentialValue') || serialized.includes('apiKey')
  ) blocked('Synthetic acceptance provider evidence contains a prohibited private payload.')
}

function validateAlignmentEvidence(
  value: unknown,
  tracked: VerifiedTrackedResult,
  expectedText: string,
): VerifiedAlignment {
  const evidence = object(value, 'alignment evidence')
  const alignmentEvidenceDigest = digest(evidence.alignmentDigest, 'alignment evidence digest')
  const base = { ...evidence }
  delete base.alignmentDigest
  if (
    alignmentEvidenceDigest !== tracked.alignmentEvidenceDigest ||
    sha256CanonicalJson(base) !== alignmentEvidenceDigest ||
    evidence.schemaVersion !== 'motion-studio.speech-synthetic-acceptance-alignment.v1' ||
    evidence.source !== 'elevenlabs_character_alignment' ||
    evidence.syntheticTextDigest !== tracked.syntheticTextDigest ||
    evidence.captionMutationPerformed !== false || evidence.masterTimingMutationPerformed !== false ||
    evidence.immutable !== true
  ) blocked('Synthetic acceptance alignment evidence failed its immutable authority.')
  const alignment = characterAlignment(evidence.alignment, 'source alignment')
  const normalizedAlignment = characterAlignment(evidence.normalizedAlignment, 'normalized alignment')
  if (alignment.characters.join('') !== expectedText || normalizedAlignment.characters.join('') !== expectedText) {
    blocked('Synthetic acceptance alignment does not preserve the exact authorized text.')
  }
  const firstCharacterStartSeconds = alignment.characterStartTimesSeconds[0]!
  const lastCharacterEndSeconds = alignment.characterEndTimesSeconds.at(-1)!
  return {
    alignmentEvidenceDigest,
    alignment,
    normalizedAlignment,
    wordCount: expectedText.trim().split(/\s+/u).length,
    firstCharacterStartSeconds,
    lastCharacterEndSeconds,
  }
}

function characterAlignment(value: unknown, label: string): CharacterAlignment {
  const alignment = object(value, label)
  if (!Array.isArray(alignment.characters) || !Array.isArray(alignment.characterStartTimesSeconds) ||
    !Array.isArray(alignment.characterEndTimesSeconds)) {
    blocked(`Synthetic ${label} arrays are missing.`)
  }
  const characters = alignment.characters
  const starts = alignment.characterStartTimesSeconds
  const ends = alignment.characterEndTimesSeconds
  if (!characters.length || characters.length > 2_000 ||
    starts.length !== characters.length || ends.length !== characters.length) {
    blocked(`Synthetic ${label} lengths are inconsistent.`)
  }
  let previousStart = -1
  let previousEnd = -1
  for (let index = 0; index < characters.length; index += 1) {
    const character = characters[index]
    const start = starts[index]
    const end = ends[index]
    if (
      typeof character !== 'string' || [...character].length !== 1 ||
      typeof start !== 'number' || !Number.isFinite(start) || start < 0 ||
      typeof end !== 'number' || !Number.isFinite(end) || end < start ||
      start < previousStart || end < previousEnd
    ) blocked(`Synthetic ${label} is not finite and monotonic.`)
    previousStart = start
    previousEnd = end
  }
  return {
    characters: characters as string[],
    characterStartTimesSeconds: starts as number[],
    characterEndTimesSeconds: ends as number[],
  }
}

function createQaResults(input: {
  authorizationId: string
  trackedResultDigest: string
  sourceSha256: string
  normalizedSha256: string
  alignmentEvidenceDigest: string
  normalizationAttestationDigest: string
}): MotionStudioSpeechSyntheticAcceptanceReconciliationV1['qa']['results'] {
  const passed: MotionStudioSpeechSyntheticAcceptanceReconciliationGate[] = [
    'tracked_result_integrity',
    'private_storage_integrity',
    'single_use_authority_integrity',
    'provider_evidence_integrity',
    'source_audio_integrity',
    'source_decode_and_normalization',
    'normalized_format',
    'non_silent',
    'sample_clipping',
    'alignment_exact_text',
    'alignment_monotonic',
    'alignment_timing_fit',
    'provider_cost_evidence',
    'privacy_boundary',
    'replay_boundary',
  ]
  const notEvaluated: readonly {
    gate: MotionStudioSpeechSyntheticAcceptanceReconciliationGate
    blocksTakeSelection: boolean
    note: string
  }[] = [
    {
      gate: 'independent_transcription',
      blocksTakeSelection: true,
      note: 'No independent speech-to-text model is installed in the accepted private runtime.',
    },
    {
      gate: 'meaning_fidelity',
      blocksTakeSelection: true,
      note: 'Meaning fidelity requires independent transcript or human listening review.',
    },
    {
      gate: 'pronunciation',
      blocksTakeSelection: true,
      note: 'Pronunciation requires human listening review.',
    },
    {
      gate: 'human_listening',
      blocksTakeSelection: true,
      note: 'No owner or delegated human listening decision has been recorded.',
    },
    {
      gate: 'voice_continuity',
      blocksTakeSelection: true,
      note: 'A single synthetic take cannot prove production-wide voice continuity.',
    },
    {
      gate: 'production_zero_retention',
      blocksTakeSelection: false,
      note: 'This synthetic proof used standard provider retention; production zero retention remains closed.',
    },
    {
      gate: 'production_account_preflight',
      blocksTakeSelection: false,
      note: 'The provider subscription/account preflight remains unproven.',
    },
    {
      gate: 'local_compute_cost_reconciliation',
      blocksTakeSelection: false,
      note: 'The pinned local runtime does not expose accepted infrastructure CPU metering.',
    },
  ]
  const common = {
    authorizationId: input.authorizationId,
    trackedResultDigest: input.trackedResultDigest,
    sourceSha256: input.sourceSha256,
    normalizedSha256: input.normalizedSha256,
    alignmentEvidenceDigest: input.alignmentEvidenceDigest,
    normalizationAttestationDigest: input.normalizationAttestationDigest,
  }
  return [
    ...passed.map((gate) => ({
      gate,
      result: 'passed' as const,
      blocksTakeSelection: false,
      blocksProductionReadiness: false,
      evidenceId: `synthetic-speech-qa-${sha256CanonicalJson({ ...common, gate }).slice(0, 48)}`,
      note: passedGateNote(gate),
    })),
    ...notEvaluated.map(({ gate, blocksTakeSelection, note }) => ({
      gate,
      result: 'not_evaluated' as const,
      blocksTakeSelection,
      blocksProductionReadiness: true,
      evidenceId: `synthetic-speech-qa-${sha256CanonicalJson({ ...common, gate }).slice(0, 48)}`,
      note,
    })),
  ]
}

function passedGateNote(gate: MotionStudioSpeechSyntheticAcceptanceReconciliationGate): string {
  const notes: Partial<Record<MotionStudioSpeechSyntheticAcceptanceReconciliationGate, string>> = {
    tracked_result_integrity: 'Tracked result matches its frozen canonical digest.',
    private_storage_integrity: 'Private root and retained evidence use exact 0700/0600 modes and hashes.',
    single_use_authority_integrity: 'Authority was consumed before credential access and replay remains blocked.',
    provider_evidence_integrity: 'Provider evidence binds the exact single submission without raw response persistence.',
    source_audio_integrity: 'Retained MP3 bytes match the frozen source commitment.',
    source_decode_and_normalization: 'Pinned network-disabled FFmpeg decoded and normalized the exact source bytes.',
    normalized_format: 'Output is exact 48 kHz mono signed 16-bit PCM WAV.',
    non_silent: 'Normalized PCM exceeds the fixed non-silence floor.',
    sample_clipping: 'Normalized PCM remains below the fixed clipping ceiling.',
    alignment_exact_text: 'Both provider alignment tracks preserve the exact synthetic phrase.',
    alignment_monotonic: 'Character timing arrays are finite, ordered, and monotonic.',
    alignment_timing_fit: 'Character timing fits the normalized audio duration within the fixed tolerance.',
    provider_cost_evidence: 'Provider character usage and public-list equivalent remain below the authority ceiling.',
    privacy_boundary: 'Credentials, provider voice ID, raw response, and browser projection remain excluded.',
    replay_boundary: 'The original single-use provider lane is consumed; reconciliation performs no network access.',
  }
  return notes[gate] ?? 'Private synthetic acceptance structural gate passed.'
}

function validatePersistedReconciliation(
  value: unknown,
  tracked: VerifiedTrackedResult,
): MotionStudioSpeechSyntheticAcceptanceReconciliationV1 {
  const evidence = object(value, 'reconciliation evidence')
  const evidenceDigest = digest(evidence.evidenceDigest, 'reconciliation evidence digest')
  const base = { ...evidence }
  delete base.evidenceDigest
  const normalized = object(evidence.normalizedArtifact, 'normalized reconciliation artifact')
  const readiness = object(evidence.readiness, 'reconciliation readiness')
  const selection = object(evidence.selection, 'reconciliation selection')
  const source = object(evidence.source, 'reconciliation source')
  const alignment = object(evidence.alignment, 'reconciliation alignment')
  const objectiveAudioQa = object(evidence.objectiveAudioQa, 'reconciliation audio QA')
  const qa = object(evidence.qa, 'reconciliation QA')
  const cost = object(evidence.cost, 'reconciliation cost')
  const privacy = object(evidence.privacyAndRetention, 'reconciliation privacy')
  const persistence = object(evidence.persistence, 'reconciliation persistence')
  if (!Array.isArray(qa.results) || sha256CanonicalJson(qa.results) !== qa.qaEvidenceDigest) {
    blocked('Persisted synthetic reconciliation QA digest is invalid.')
  }
  const passedCount = qa.results.filter((entry) =>
    object(entry, 'reconciliation QA result').result === 'passed').length
  const notEvaluatedCount = qa.results.filter((entry) =>
    object(entry, 'reconciliation QA result').result === 'not_evaluated').length
  const expectedPrivateObjectIdentityHash = sha256CanonicalJson({
    domain: 'motion_studio_synthetic_speech_acceptance_normalized_audio_v1',
    authorizationId: tracked.authorizationId,
    trackedResultDigest: tracked.trackedResultDigest,
    sourceSha256: tracked.sourceDescriptor.sha256,
    normalizedSha256: normalized.sha256,
  })
  if (
    sha256CanonicalJson(base) !== evidenceDigest ||
    evidence.schemaVersion !== 'motion-studio.speech-synthetic-acceptance-reconciliation.v1' ||
    evidence.state !== 'private_synthetic_audio_reconciled_semantic_review_required_not_production_ready' ||
    evidence.evidenceClass !== tracked.evidenceClass || evidence.authorizationId !== tracked.authorizationId ||
    evidence.trackedResultDigest !== tracked.trackedResultDigest ||
    evidence.providerEvidenceDigest !== tracked.providerEvidenceDigest ||
    evidence.alignmentEvidenceDigest !== tracked.alignmentEvidenceDigest || evidence.immutable !== true ||
    normalized.privateObjectIdentityHash !== expectedPrivateObjectIdentityHash ||
    !SHA256.test(String(normalized.sha256)) || normalized.mimeType !== 'audio/wav' ||
    normalized.codec !== 'pcm_s16le' || normalized.sampleRateHertz !== 48_000 ||
    normalized.channelCount !== 1 || normalized.bitsPerSample !== 16 ||
    !Number.isSafeInteger(normalized.sampleCountPerChannel) ||
    Number(normalized.sampleCountPerChannel) < 1 ||
    !Number.isSafeInteger(normalized.durationMilliseconds) ||
    Number(normalized.durationMilliseconds) < 1 ||
    !Number.isSafeInteger(normalized.byteLength) || Number(normalized.byteLength) < 44 ||
    source.mimeType !== 'audio/mpeg' || source.sha256 !== tracked.sourceDescriptor.sha256 ||
    source.byteLength !== tracked.sourceDescriptor.byteLength ||
    source.privateFileMode !== '0600' || source.decodeVerifiedByPinnedRuntime !== true ||
    source.rawProviderResponsePersisted !== false ||
    alignment.exactSourceText !== true || alignment.exactNormalizedText !== true ||
    alignment.monotonic !== true || alignment.fitsNormalizedAudio !== true ||
    alignment.masterTimingMutationPerformed !== false || alignment.captionMutationPerformed !== false ||
    objectiveAudioQa.silent !== false || objectiveAudioQa.clippingDetected !== false ||
    passedCount !== 15 || notEvaluatedCount !== 8 ||
    qa.privateSyntheticTechnicalAcceptanceReady !== true || qa.takeSelectionEligible !== false ||
    qa.productionReadinessEligible !== false ||
    cost.providerCharacterCostCredits !== tracked.providerCharacterCostCredits ||
    cost.providerCharacterCostMicrocredits !== tracked.providerCharacterCostMicrocredits ||
    cost.publicListProviderCostMicros !== tracked.publicListProviderCostMicros ||
    cost.maximumAuthorizedInternalProductionCostMicros !==
      tracked.maximumAuthorizedInternalProductionCostMicros ||
    cost.providerUsageWithinAuthorizedCeiling !== true || cost.exactAccountInvoiceClaimed !== false ||
    cost.localComputeCostState !== 'not_reconciled_no_infrastructure_cpu_meter' ||
    cost.localComputeCostMicros !== null || cost.customerPricingIncluded !== false ||
    cost.customerCreditsIncluded !== false || cost.serviceFeeIncluded !== false ||
    cost.customerBillingPerformed !== false ||
    privacy.privateLocalOnly !== true ||
    privacy.standardProviderRetentionAcceptedForSyntheticProof !== true ||
    privacy.syntheticAcceptanceOnly !== true || privacy.userContentUsed !== false ||
    privacy.zeroRetentionClaimed !== false || privacy.productionZeroRetentionSatisfied !== false ||
    privacy.credentialPersisted !== false || privacy.providerVoiceIdPersisted !== false ||
    privacy.browserProjectionAllowed !== false ||
    selection.selected !== false || selection.finalAssetEligible !== false ||
    selection.firstTakeAutoAccepted !== false || selection.semanticReviewRequired !== true ||
    selection.listeningReviewRequired !== true ||
    selection.finalNarrationMutationPerformed !== false || selection.timelineMutationPerformed !== false ||
    persistence.privateLocalOnly !== true ||
    persistence.privateRunRootRelativePath !== tracked.privateRunRootRelativePath ||
    persistence.reconciliationFilename !== RECONCILIATION_FILENAME ||
    persistence.normalizedAudioPersistedCreateOnly !== true ||
    persistence.reconciliationPersistedCreateOnly !== true ||
    readiness.privateSyntheticTechnicalAcceptanceReady !== true ||
    readiness.privateTransportIntegrationEvidenceReady !== true ||
    readiness.privateNormalizationEvidenceReady !== true ||
    readiness.independentTranscriptionEvaluated !== false ||
    readiness.humanListeningReviewComplete !== false ||
    readiness.productionAccountPreflightSatisfied !== false ||
    readiness.productionZeroRetentionSatisfied !== false || readiness.candidateSelected !== false ||
    readiness.timelineMutationPerformed !== false ||
    readiness.productReady !== false || readiness.externalBetaReady !== false ||
    readiness.productionReady !== false || readiness.finalDeliveryReady !== false ||
    exactIso(String(evidence.reconciledAt), 'persisted reconciliation time') !== evidence.reconciledAt
  ) blocked('Persisted synthetic reconciliation failed its immutable private boundary.')
  return evidence as unknown as MotionStudioSpeechSyntheticAcceptanceReconciliationV1
}

async function readVerifiedPrivateFile(
  privateRoot: string,
  descriptor: PrivateFileDescriptor,
  maximumBytes: number,
): Promise<Buffer> {
  const path = resolve(privateRoot, descriptor.filename)
  if (path === privateRoot || !path.startsWith(`${privateRoot}${sep}`)) {
    blocked('Synthetic acceptance private descriptor escapes its run root.')
  }
  await assertPrivateFileMode(path, PRIVATE_FILE_MODE)
  const bytes = await readPrivateFileIfExistsWithinRoot({
    rootPath: privateRoot,
    relativePath: descriptor.filename,
  })
  if (
    !bytes || bytes.byteLength !== descriptor.byteLength || bytes.byteLength > maximumBytes ||
    sha256Bytes(bytes) !== descriptor.sha256
  ) blocked('Synthetic acceptance private file does not match its frozen descriptor.')
  return bytes
}

async function readBoundedRegularFile(path: string, maximumBytes: number, label: string): Promise<Buffer> {
  const stat = await lstat(path).catch(() => undefined)
  if (!stat || stat.isSymbolicLink() || !stat.isFile() || stat.size < 2 || stat.size > maximumBytes) {
    blocked(`Synthetic acceptance ${label} is unavailable or outside its byte ceiling.`)
  }
  return readFile(path)
}

async function assertPrivateDirectory(path: string): Promise<void> {
  const stat = await lstat(path).catch(() => undefined)
  if (!stat || stat.isSymbolicLink() || !stat.isDirectory() || (stat.mode & 0o777) !== PRIVATE_DIRECTORY_MODE) {
    blocked('Synthetic acceptance private root is not an exact 0700 regular directory.')
  }
}

async function assertPrivateFileMode(path: string, mode: number): Promise<void> {
  const stat = await lstat(path).catch(() => undefined)
  if (!stat || stat.isSymbolicLink() || !stat.isFile() || (stat.mode & 0o777) !== mode) {
    blocked('Synthetic acceptance private evidence is not an exact 0600 regular file.')
  }
}

async function assertNoPrivateFailureRecord(privateRoot: string): Promise<void> {
  const failure = await lstat(resolve(
    privateRoot,
    MOTION_STUDIO_SPEECH_SYNTHETIC_ACCEPTANCE_LIVE_OPERATOR_PATHS.failureFilename,
  )).catch((error: unknown) => isNodeError(error, 'ENOENT') ? undefined : Promise.reject(error))
  if (failure) blocked('Synthetic acceptance has a terminal failure record and cannot be reconciled as success.')
}

function privateDescriptor(value: unknown, label: string): PrivateFileDescriptor {
  const descriptor = object(value, label)
  const filename = text(descriptor.filename, `${label} filename`)
  if (
    !filename || filename.includes('/') || filename.includes('\\') || filename.includes('\0') ||
    descriptor.mode !== '0600'
  ) blocked(`Synthetic acceptance ${label} private descriptor is invalid.`)
  return {
    filename,
    byteLength: safeInteger(descriptor.byteLength, `${label} byte length`, 1),
    sha256: digest(descriptor.sha256, `${label} SHA-256`),
    mode: '0600',
  }
}

function analyzePcm(samples: Int16Array): { rmsLinear: number; rmsDbfs: number; samplePeakDbfs: number } {
  let sumSquares = 0
  let peak = 0
  for (const sample of samples) {
    const linear = sample / 32_768
    sumSquares += linear * linear
    peak = Math.max(peak, Math.abs(linear))
  }
  const rmsLinear = Math.sqrt(sumSquares / samples.length)
  return {
    rmsLinear: rounded(rmsLinear),
    rmsDbfs: rounded(20 * Math.log10(Math.max(rmsLinear, Number.EPSILON))),
    samplePeakDbfs: rounded(20 * Math.log10(Math.max(peak, Number.EPSILON))),
  }
}

function canonicalAudioPath(root: string, identity: string): string {
  return resolve(root, `canonical-audio-tool-results/private-v1/${identity.slice(0, 2)}/${identity}.wav`)
}

function inside(root: string, relativePath: string): string {
  if (!relativePath || relativePath.includes('\0') || relativePath.startsWith('/') ||
    relativePath.replace(/\\/g, '/').split('/').some((segment) => segment === '..')) {
    invalid('Synthetic acceptance repository-relative path is invalid.')
  }
  const path = resolve(root, relativePath)
  if (path === root || !path.startsWith(`${root}${sep}`)) {
    invalid('Synthetic acceptance repository-relative path escapes the checkout.')
  }
  return path
}

function parseJson(bytes: Buffer, label: string): unknown {
  try { return JSON.parse(bytes.toString('utf8')) }
  catch { blocked(`Synthetic acceptance ${label} is not valid JSON.`) }
}

function object(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    blocked(`Synthetic acceptance ${label} must be an object.`)
  }
  return value as Record<string, unknown>
}

function text(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.length < 1 || value.length > 1_024 || hasControlCharacters(value)) {
    blocked(`Synthetic acceptance ${label} is invalid.`)
  }
  return value
}

function hasControlCharacters(value: string): boolean {
  for (const character of value) {
    const code = character.charCodeAt(0)
    if ((code >= 0 && code <= 8) || code === 11 || code === 12 ||
      (code >= 14 && code <= 31) || code === 127) return true
  }
  return false
}

function digest(value: unknown, label: string): string {
  const candidate = text(value, label)
  if (!SHA256.test(candidate)) blocked(`Synthetic acceptance ${label} is malformed.`)
  return candidate
}

function safeInteger(value: unknown, label: string, minimum: number): number {
  if (!Number.isSafeInteger(value) || Number(value) < minimum) {
    blocked(`Synthetic acceptance ${label} is invalid.`)
  }
  return Number(value)
}

function safeNonNegativeNumber(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    blocked(`Synthetic acceptance ${label} is invalid.`)
  }
  return value
}

function exactIso(value: string, label: string): string {
  const milliseconds = Date.parse(value)
  if (!Number.isFinite(milliseconds) || new Date(milliseconds).toISOString() !== value) {
    invalid(`Synthetic acceptance ${label} must be exact ISO-8601.`)
  }
  return value
}

function sha256Bytes(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function sha256Text(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}

function rounded(value: number): number { return Number(value.toFixed(6)) }

function isNodeError(value: unknown, code: string): boolean {
  return value instanceof Error && 'code' in value && (value as NodeJS.ErrnoException).code === code
}

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value
  if (Array.isArray(value)) value.forEach(deepFreeze)
  else Object.values(value as Record<string, unknown>).forEach(deepFreeze)
  return Object.freeze(value)
}

function invalid(message: string): never {
  throw new ApiError('VALIDATION_FAILED', message, 400)
}

function blocked(message: string): never {
  throw new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', message, 409, {
    requiredGate: 'private_synthetic_speech_reconciliation',
  })
}
