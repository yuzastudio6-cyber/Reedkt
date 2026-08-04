import { createHash } from 'node:crypto'
import { lstat, readFile, realpath } from 'node:fs/promises'
import { resolve, sep } from 'node:path'

import { ApiError } from '../../errors/api-error'
import {
  readPrivateFileIfExistsWithinRoot,
  writePrivateFileCreateOnlyWithinRoot,
} from '../../security/private-local-persistence'
import { readCanonicalPrivateAudioArtifact } from '../../services/canonical-private-audio-artifact-storage'
import { sha256CanonicalJson } from '../commands/canonical-json'
import {
  MOTION_STUDIO_SPEECH_SYNTHETIC_ACCEPTANCE_TEXT,
} from './synthetic-acceptance-live-operator'
import {
  MOTION_STUDIO_SPEECH_SYNTHETIC_ACCEPTANCE_RECONCILIATION_PATHS,
  reconcileMotionStudioSpeechSyntheticAcceptance,
  type MotionStudioSpeechSyntheticAcceptanceReconciliationV1,
} from './synthetic-acceptance-reconciliation'

const SHA256 = /^[a-f0-9]{64}$/u
const STABLE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const PRIVATE_FILE_MODE = 0o600
const MAXIMUM_TRACKED_RESULT_BYTES = 256 * 1024
const MAXIMUM_PLAYER_BYTES = 4 * 1024 * 1024
const REVIEW_FILENAME = 'synthetic-acceptance-listening-review.json' as const
const TRANSCRIPT_TRACKED_RESULT_RELATIVE_PATH =
  'tasks/motion-studio/MS-012C/c2-synthetic-acceptance-transcript-live-result-ext-002.json' as const
const TRANSCRIPT_TRACKED_RESULT_DIGEST =
  'a9a4ec18a2acca6d665be609a64f770d8705693315750d65ca017912625dcf24' as const
const LOCAL_PLAYER_PATH = '/usr/bin/afplay' as const

const LISTENING_GATES = Object.freeze([
  'meaning_fidelity',
  'pronunciation',
  'voice_continuity',
  'loudness',
] as const)

export type MotionStudioSpeechSyntheticListeningGate = typeof LISTENING_GATES[number]

export interface MotionStudioSpeechSyntheticListeningPlaybackEventV1 {
  sequence: number
  playerExecutableSha256: string
  normalizedAudioSha256: string
  startedAt: string
  completedAt: string
  exitCode: 0
  entireCandidatePlaybackAttested: true
  eventDigest: string
}

export interface MotionStudioSpeechSyntheticListeningReviewV1 {
  schemaVersion: 'motion-studio.speech-synthetic-listening-review.v1'
  state: 'synthetic_human_review_complete_not_c3_accepted'
  evidenceClass: 'owner_delegated_private_synthetic_review'
  authorizationId: string
  reconciliationEvidenceDigest: string
  independentTranscriptResultDigest: string
  syntheticTextDigest: string
  normalizedAudio: {
    sha256: string
    byteLength: number
    durationMilliseconds: number
    privatePlaybackOnly: true
    browserProjectionAllowed: false
  }
  playback: {
    method: 'fixed_local_system_audio_player'
    playerPathPersisted: false
    events: readonly MotionStudioSpeechSyntheticListeningPlaybackEventV1[]
    playbackCount: number
    playbackEvidenceDigest: string
  }
  review: {
    reviewerActorId: string
    humanAttestationAccepted: true
    decision: 'pass_for_selection_review' | 'reject_take'
    results: readonly {
      gate: MotionStudioSpeechSyntheticListeningGate
      result: 'passed' | 'failed'
      note: string
    }[]
    reviewedAt: string
    reviewDigest: string
  }
  selection: {
    eligibleForExplicitSelection: false
    selectionDecisionCreated: false
    selected: false
    firstTakeAutoAccepted: false
    finalAssetEligible: false
    finalNarrationMutationPerformed: false
    timelineMutationPerformed: false
  }
  cost: {
    providerUsagePreserved: true
    localComputeCostReconciled: false
    customerPricingIncluded: false
    customerCreditsIncluded: false
    serviceFeeIncluded: false
    billingMutationPerformed: false
  }
  readiness: {
    independentSemanticEvidenceReady: true
    humanListeningReviewComplete: true
    pronunciationHumanReviewComplete: true
    performanceHumanReviewComplete: true
    productionMultiTakeContinuityProven: false
    c3ProviderEvidenceComplete: false
    ms012cAccepted: false
    productReady: false
    externalBetaReady: false
    productionReady: false
    finalDeliveryReady: false
  }
  persistence: {
    privateLocalOnly: true
    createOnly: true
    filename: typeof REVIEW_FILENAME
  }
  createdAt: string
  immutable: true
  recordDigest: string
}

export interface MotionStudioSpeechSyntheticListeningReviewPreparation {
  reconciliation: MotionStudioSpeechSyntheticAcceptanceReconciliationV1
  independentTranscriptResultDigest: string
  syntheticText: typeof MOTION_STUDIO_SPEECH_SYNTHETIC_ACCEPTANCE_TEXT
  privateRunRoot: string
  privateAudioPath: string
  playerExecutablePath: typeof LOCAL_PLAYER_PATH
  playerExecutableSha256: string
  existingReview?: MotionStudioSpeechSyntheticListeningReviewV1
}

const trustedPreparations = new WeakMap<object, string>()

export async function prepareMotionStudioSpeechSyntheticListeningReview(input: {
  repositoryRoot: string
}): Promise<MotionStudioSpeechSyntheticListeningReviewPreparation> {
  const repositoryRoot = await realpath(input.repositoryRoot)
  const reconciliation = await reconcileMotionStudioSpeechSyntheticAcceptance({
    repositoryRoot,
    reconciledAt: new Date().toISOString(),
  })
  assertReviewableReconciliation(reconciliation)
  const independentTranscriptResultDigest = await verifyIndependentTranscriptResult(
    repositoryRoot,
    reconciliation,
  )
  const privateRunRoot = inside(
    repositoryRoot,
    MOTION_STUDIO_SPEECH_SYNTHETIC_ACCEPTANCE_RECONCILIATION_PATHS.privateRunRootRelativePath,
  )
  const audio = await readCanonicalPrivateAudioArtifact({
    localStorageRoot: privateRunRoot,
    privateObjectIdentityHash: reconciliation.normalizedArtifact.privateObjectIdentityHash,
  })
  if (
    !audio || audio.sha256 !== reconciliation.normalizedArtifact.sha256 ||
    audio.byteLength !== reconciliation.normalizedArtifact.byteLength
  ) blocked('Synthetic listening review audio no longer matches immutable reconciliation evidence.')
  const privateAudioPath = canonicalAudioPath(
    privateRunRoot,
    reconciliation.normalizedArtifact.privateObjectIdentityHash,
  )
  await assertPrivateRegularFile(privateAudioPath, reconciliation.normalizedArtifact.byteLength)
  const playerExecutableSha256 = await verifyFixedLocalPlayer()
  const existingReview = await readMotionStudioSpeechSyntheticListeningReview({ privateRunRoot })
  if (existingReview) {
    assertReviewMatchesEvidence(
      existingReview,
      reconciliation,
      independentTranscriptResultDigest,
      playerExecutableSha256,
    )
  }
  const preparation = deepFreeze({
    reconciliation,
    independentTranscriptResultDigest,
    syntheticText: MOTION_STUDIO_SPEECH_SYNTHETIC_ACCEPTANCE_TEXT,
    privateRunRoot,
    privateAudioPath,
    playerExecutablePath: LOCAL_PLAYER_PATH,
    playerExecutableSha256,
    ...(existingReview ? { existingReview } : {}),
  })
  trustedPreparations.set(preparation, preparationDigest(preparation))
  return preparation
}

export function compileMotionStudioSpeechSyntheticListeningReview(input: {
  preparation: MotionStudioSpeechSyntheticListeningReviewPreparation
  reviewerActorId: string
  playbackEvents: readonly MotionStudioSpeechSyntheticListeningPlaybackEventV1[]
  results: MotionStudioSpeechSyntheticListeningReviewV1['review']['results']
  reviewedAt: string
  humanAttestationAccepted: true
}): MotionStudioSpeechSyntheticListeningReviewV1 {
  assertTrustedPreparation(input.preparation)
  if (input.preparation.existingReview) {
    blocked('Synthetic listening review is already immutable and cannot be replaced.')
  }
  const reviewerActorId = stableId(input.reviewerActorId, 'Synthetic listening reviewer actor ID')
  const playbackEvents = validatePlaybackEvents(
    input.playbackEvents,
    input.preparation.reconciliation.normalizedArtifact.sha256,
    input.preparation.playerExecutableSha256,
    input.preparation.reconciliation.normalizedArtifact.durationMilliseconds,
  )
  const results = validateListeningResults(input.results)
  if (input.humanAttestationAccepted !== true) {
    invalid('Synthetic listening review requires the reviewer\'s explicit human-listening attestation.')
  }
  const reviewedAt = exactIso(input.reviewedAt, 'Synthetic listening review time')
  const lastPlayback = playbackEvents.at(-1)
  if (!lastPlayback || Date.parse(reviewedAt) < Date.parse(lastPlayback.completedAt)) {
    invalid('Synthetic listening review cannot predate the completed private playback.')
  }
  const allPassed = results.every((result) => result.result === 'passed')
  const decision = allPassed ? 'pass_for_selection_review' as const : 'reject_take' as const
  const playbackBase = {
    method: 'fixed_local_system_audio_player' as const,
    playerPathPersisted: false as const,
    events: playbackEvents,
    playbackCount: playbackEvents.length,
  }
  const playbackEvidenceDigest = sha256CanonicalJson(playbackBase)
  const reviewBase = {
    reviewerActorId,
    humanAttestationAccepted: true as const,
    decision,
    results,
    reviewedAt,
  }
  const reviewDigest = sha256CanonicalJson(reviewBase)
  const reconciliation = input.preparation.reconciliation
  const base: Omit<MotionStudioSpeechSyntheticListeningReviewV1, 'recordDigest'> = {
    schemaVersion: 'motion-studio.speech-synthetic-listening-review.v1',
    state: 'synthetic_human_review_complete_not_c3_accepted',
    evidenceClass: 'owner_delegated_private_synthetic_review',
    authorizationId: reconciliation.authorizationId,
    reconciliationEvidenceDigest: reconciliation.evidenceDigest,
    independentTranscriptResultDigest: input.preparation.independentTranscriptResultDigest,
    syntheticTextDigest: reconciliation.syntheticTextDigest,
    normalizedAudio: {
      sha256: reconciliation.normalizedArtifact.sha256,
      byteLength: reconciliation.normalizedArtifact.byteLength,
      durationMilliseconds: reconciliation.normalizedArtifact.durationMilliseconds,
      privatePlaybackOnly: true,
      browserProjectionAllowed: false,
    },
    playback: { ...playbackBase, playbackEvidenceDigest },
    review: { ...reviewBase, reviewDigest },
    selection: {
      eligibleForExplicitSelection: false,
      selectionDecisionCreated: false,
      selected: false,
      firstTakeAutoAccepted: false,
      finalAssetEligible: false,
      finalNarrationMutationPerformed: false,
      timelineMutationPerformed: false,
    },
    cost: {
      providerUsagePreserved: true,
      localComputeCostReconciled: false,
      customerPricingIncluded: false,
      customerCreditsIncluded: false,
      serviceFeeIncluded: false,
      billingMutationPerformed: false,
    },
    readiness: {
      independentSemanticEvidenceReady: true,
      humanListeningReviewComplete: true,
      pronunciationHumanReviewComplete: true,
      performanceHumanReviewComplete: true,
      productionMultiTakeContinuityProven: false,
      c3ProviderEvidenceComplete: false,
      ms012cAccepted: false,
      productReady: false,
      externalBetaReady: false,
      productionReady: false,
      finalDeliveryReady: false,
    },
    persistence: {
      privateLocalOnly: true,
      createOnly: true,
      filename: REVIEW_FILENAME,
    },
    createdAt: reviewedAt,
    immutable: true,
  }
  return deepFreeze({ ...base, recordDigest: sha256CanonicalJson(base) })
}

export async function persistMotionStudioSpeechSyntheticListeningReview(input: {
  preparation: MotionStudioSpeechSyntheticListeningReviewPreparation
  record: MotionStudioSpeechSyntheticListeningReviewV1
}): Promise<MotionStudioSpeechSyntheticListeningReviewV1> {
  assertTrustedPreparation(input.preparation)
  validatePersistedReview(input.record)
  assertReviewMatchesEvidence(
    input.record,
    input.preparation.reconciliation,
    input.preparation.independentTranscriptResultDigest,
    input.preparation.playerExecutableSha256,
  )
  const bytes = Buffer.from(`${JSON.stringify(input.record, null, 2)}\n`, 'utf8')
  await writePrivateFileCreateOnlyWithinRoot({
    rootPath: input.preparation.privateRunRoot,
    relativePath: REVIEW_FILENAME,
    content: bytes,
  })
  const stored = await readMotionStudioSpeechSyntheticListeningReview({
    privateRunRoot: input.preparation.privateRunRoot,
  })
  if (!stored || stored.recordDigest !== input.record.recordDigest) {
    blocked('Synthetic listening review changed during create-only private persistence.')
  }
  return stored
}

export function assertMotionStudioSpeechSyntheticListeningReviewForPreparation(input: {
  preparation: MotionStudioSpeechSyntheticListeningReviewPreparation
  record: MotionStudioSpeechSyntheticListeningReviewV1
}): MotionStudioSpeechSyntheticListeningReviewV1 {
  assertTrustedPreparation(input.preparation)
  validatePersistedReview(input.record)
  assertReviewMatchesEvidence(
    input.record,
    input.preparation.reconciliation,
    input.preparation.independentTranscriptResultDigest,
    input.preparation.playerExecutableSha256,
  )
  return input.record
}

export async function readMotionStudioSpeechSyntheticListeningReview(input: {
  privateRunRoot: string
}): Promise<MotionStudioSpeechSyntheticListeningReviewV1 | undefined> {
  const bytes = await readPrivateFileIfExistsWithinRoot({
    rootPath: input.privateRunRoot,
    relativePath: REVIEW_FILENAME,
  })
  if (!bytes) return undefined
  if (bytes.byteLength > MAXIMUM_TRACKED_RESULT_BYTES) {
    blocked('Synthetic listening review exceeded its private evidence bound.')
  }
  const review = parseJson(bytes, 'synthetic listening review') as MotionStudioSpeechSyntheticListeningReviewV1
  validatePersistedReview(review)
  await assertPrivateRegularFile(resolve(input.privateRunRoot, REVIEW_FILENAME), bytes.byteLength)
  return deepFreeze(review)
}

export function createMotionStudioSpeechSyntheticListeningPlaybackEvent(input: {
  sequence: number
  playerExecutableSha256: string
  normalizedAudioSha256: string
  startedAt: string
  completedAt: string
}): MotionStudioSpeechSyntheticListeningPlaybackEventV1 {
  if (!Number.isSafeInteger(input.sequence) || input.sequence < 1 || input.sequence > 3) {
    invalid('Synthetic listening playback sequence is outside its one-to-three bound.')
  }
  for (const digest of [input.playerExecutableSha256, input.normalizedAudioSha256]) {
    if (!SHA256.test(digest)) invalid('Synthetic listening playback digest is malformed.')
  }
  const startedAt = exactIso(input.startedAt, 'Synthetic listening playback start time')
  const completedAt = exactIso(input.completedAt, 'Synthetic listening playback completion time')
  if (Date.parse(completedAt) <= Date.parse(startedAt) || Date.parse(completedAt) - Date.parse(startedAt) > 60_000) {
    invalid('Synthetic listening playback duration is invalid.')
  }
  const base = {
    sequence: input.sequence,
    playerExecutableSha256: input.playerExecutableSha256,
    normalizedAudioSha256: input.normalizedAudioSha256,
    startedAt,
    completedAt,
    exitCode: 0 as const,
    entireCandidatePlaybackAttested: true as const,
  }
  return deepFreeze({ ...base, eventDigest: sha256CanonicalJson(base) })
}

function validatePlaybackEvents(
  value: readonly MotionStudioSpeechSyntheticListeningPlaybackEventV1[],
  expectedAudioSha256: string,
  expectedPlayerSha256: string,
  expectedDurationMilliseconds: number,
): readonly MotionStudioSpeechSyntheticListeningPlaybackEventV1[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 3) {
    invalid('Synthetic listening review requires one to three complete private playbacks.')
  }
  let previousCompletion = 0
  return Object.freeze(value.map((event, index) => {
    const expected = createMotionStudioSpeechSyntheticListeningPlaybackEvent({
      sequence: index + 1,
      playerExecutableSha256: expectedPlayerSha256,
      normalizedAudioSha256: expectedAudioSha256,
      startedAt: event.startedAt,
      completedAt: event.completedAt,
    })
    if (
      event.sequence !== expected.sequence || event.playerExecutableSha256 !== expectedPlayerSha256 ||
      event.normalizedAudioSha256 !== expectedAudioSha256 || event.exitCode !== 0 ||
      event.entireCandidatePlaybackAttested !== true || event.eventDigest !== expected.eventDigest ||
      Date.parse(event.startedAt) < previousCompletion ||
      Date.parse(event.completedAt) - Date.parse(event.startedAt) < expectedDurationMilliseconds - 250 ||
      Date.parse(event.completedAt) - Date.parse(event.startedAt) > expectedDurationMilliseconds + 15_000
    ) invalid('Synthetic listening playback evidence is invalid or out of order.')
    previousCompletion = Date.parse(event.completedAt)
    return expected
  }))
}

function validateListeningResults(
  value: MotionStudioSpeechSyntheticListeningReviewV1['review']['results'],
): MotionStudioSpeechSyntheticListeningReviewV1['review']['results'] {
  if (!Array.isArray(value) || value.length !== LISTENING_GATES.length) {
    invalid('Synthetic listening review requires every exact listening gate.')
  }
  return Object.freeze(value.map((entry, index) => {
    if (entry.gate !== LISTENING_GATES[index] || !['passed', 'failed'].includes(entry.result)) {
      invalid('Synthetic listening review gates are missing, duplicated, or out of order.')
    }
    return deepFreeze({ gate: entry.gate, result: entry.result, note: safeNote(entry.note) })
  }))
}

async function verifyIndependentTranscriptResult(
  repositoryRoot: string,
  reconciliation: MotionStudioSpeechSyntheticAcceptanceReconciliationV1,
): Promise<string> {
  const path = inside(repositoryRoot, TRANSCRIPT_TRACKED_RESULT_RELATIVE_PATH)
  const bytes = await readBoundedRegularFile(path, MAXIMUM_TRACKED_RESULT_BYTES)
  const result = object(parseJson(bytes, 'independent transcript tracked result'), 'independent transcript result')
  const resultDigest = text(result.resultDigest, 'independent transcript result digest')
  const base = { ...result }
  delete base.resultDigest
  const sourceAudio = object(result.sourceAudio, 'independent transcript source audio')
  const semantic = object(result.semantic, 'independent transcript semantic evidence')
  const privateEvidence = object(result.privateEvidence, 'independent transcript private evidence')
  const readiness = object(result.readiness, 'independent transcript readiness')
  if (
    resultDigest !== TRANSCRIPT_TRACKED_RESULT_DIGEST || sha256CanonicalJson(base) !== resultDigest ||
    result.schemaVersion !== 'motion-studio.speech-synthetic-transcript-tracked-result.v1' ||
    result.status !== 'completed_private_synthetic_independent_transcript_ready_human_listening_required' ||
    result.sourceLiveResultDigest !== reconciliation.trackedResultDigest ||
    sourceAudio.sha256 !== reconciliation.source.sha256 ||
    sourceAudio.byteLength !== reconciliation.source.byteLength ||
    sourceAudio.expectedTextDigest !== reconciliation.syntheticTextDigest ||
    semantic.wordErrorDistance !== 0 || semantic.wordErrorRate !== 0 ||
    semantic.exactNormalizedTextMatch !== true || semantic.languageAccepted !== true ||
    semantic.timestampsFitSource !== true || semantic.independentTranscriptEvaluated !== true ||
    semantic.semanticEvidenceReady !== true ||
    privateEvidence.sourceAudioCopied !== false || privateEvidence.rawProviderResponsePersisted !== false ||
    privateEvidence.credentialPersisted !== false || privateEvidence.browserProjectionAllowed !== false ||
    readiness.independentTranscriptionEvaluated !== true || readiness.semanticContentVerified !== true ||
    readiness.humanListeningReviewComplete !== false || readiness.candidateSelected !== false ||
    readiness.timelineMutationPerformed !== false || readiness.productReady !== false ||
    readiness.externalBetaReady !== false || readiness.productionReady !== false ||
    readiness.finalDeliveryReady !== false || result.immutable !== true
  ) blocked('Independent transcript evidence is not valid for synthetic listening review.')
  return resultDigest
}

function assertReviewableReconciliation(
  reconciliation: MotionStudioSpeechSyntheticAcceptanceReconciliationV1,
): void {
  if (
    reconciliation.evidenceClass !== 'authenticated_provider_synthetic_acceptance' ||
    reconciliation.state !== 'private_synthetic_audio_reconciled_semantic_review_required_not_production_ready' ||
    reconciliation.qa.privateSyntheticTechnicalAcceptanceReady !== true ||
    reconciliation.privacyAndRetention.privateLocalOnly !== true ||
    reconciliation.privacyAndRetention.browserProjectionAllowed !== false ||
    reconciliation.selection.listeningReviewRequired !== true || reconciliation.selection.selected !== false ||
    reconciliation.selection.timelineMutationPerformed !== false ||
    reconciliation.readiness.humanListeningReviewComplete !== false ||
    reconciliation.readiness.productReady !== false || reconciliation.readiness.productionReady !== false
  ) blocked('Synthetic reconciliation is not eligible for private local listening review.')
}

function assertReviewMatchesEvidence(
  review: MotionStudioSpeechSyntheticListeningReviewV1,
  reconciliation: MotionStudioSpeechSyntheticAcceptanceReconciliationV1,
  transcriptDigest: string,
  playerExecutableSha256: string,
): void {
  if (
    review.authorizationId !== reconciliation.authorizationId ||
    review.reconciliationEvidenceDigest !== reconciliation.evidenceDigest ||
    review.independentTranscriptResultDigest !== transcriptDigest ||
    review.syntheticTextDigest !== reconciliation.syntheticTextDigest ||
    review.normalizedAudio.sha256 !== reconciliation.normalizedArtifact.sha256 ||
    review.normalizedAudio.byteLength !== reconciliation.normalizedArtifact.byteLength ||
    review.normalizedAudio.durationMilliseconds !== reconciliation.normalizedArtifact.durationMilliseconds ||
    review.playback.events.some((event) => event.playerExecutableSha256 !== playerExecutableSha256)
  ) blocked('Synthetic listening review does not bind the exact private audio and semantic evidence.')
}

function validatePersistedReview(review: MotionStudioSpeechSyntheticListeningReviewV1): void {
  if (!review || typeof review !== 'object' || Array.isArray(review)) {
    blocked('Persisted synthetic listening review shape is invalid.')
  }
  assertExactKeys(review as unknown as Record<string, unknown>, [
    'authorizationId', 'cost', 'createdAt', 'evidenceClass', 'immutable',
    'independentTranscriptResultDigest', 'normalizedAudio', 'persistence', 'playback',
    'readiness', 'reconciliationEvidenceDigest', 'recordDigest', 'review', 'schemaVersion',
    'selection', 'state', 'syntheticTextDigest',
  ], 'Persisted synthetic listening review')
  for (const [label, nested] of [
    ['normalized audio', review.normalizedAudio], ['playback', review.playback],
    ['review', review.review], ['selection', review.selection], ['cost', review.cost],
    ['readiness', review.readiness], ['persistence', review.persistence],
  ] as const) {
    if (!nested || typeof nested !== 'object' || Array.isArray(nested)) {
      blocked(`Persisted synthetic listening ${label} shape is invalid.`)
    }
  }
  if (!Array.isArray(review.playback.events) || !Array.isArray(review.review.results)) {
    blocked('Persisted synthetic listening playback or gate list is invalid.')
  }
  assertExactKeys(review.normalizedAudio as unknown as Record<string, unknown>, [
    'browserProjectionAllowed', 'byteLength', 'durationMilliseconds', 'privatePlaybackOnly', 'sha256',
  ], 'Persisted synthetic listening normalized audio')
  assertExactKeys(review.playback as unknown as Record<string, unknown>, [
    'events', 'method', 'playbackCount', 'playbackEvidenceDigest', 'playerPathPersisted',
  ], 'Persisted synthetic listening playback')
  assertExactKeys(review.review as unknown as Record<string, unknown>, [
    'decision', 'humanAttestationAccepted', 'results', 'reviewDigest', 'reviewedAt', 'reviewerActorId',
  ], 'Persisted synthetic listening decision')
  assertExactKeys(review.selection as unknown as Record<string, unknown>, [
    'eligibleForExplicitSelection', 'finalAssetEligible', 'finalNarrationMutationPerformed',
    'firstTakeAutoAccepted', 'selected', 'selectionDecisionCreated', 'timelineMutationPerformed',
  ], 'Persisted synthetic listening selection')
  assertExactKeys(review.cost as unknown as Record<string, unknown>, [
    'billingMutationPerformed', 'customerCreditsIncluded', 'customerPricingIncluded',
    'localComputeCostReconciled', 'providerUsagePreserved', 'serviceFeeIncluded',
  ], 'Persisted synthetic listening cost')
  assertExactKeys(review.readiness as unknown as Record<string, unknown>, [
    'c3ProviderEvidenceComplete', 'externalBetaReady', 'finalDeliveryReady',
    'humanListeningReviewComplete', 'independentSemanticEvidenceReady', 'ms012cAccepted',
    'performanceHumanReviewComplete', 'productReady', 'productionMultiTakeContinuityProven',
    'productionReady', 'pronunciationHumanReviewComplete',
  ], 'Persisted synthetic listening readiness')
  assertExactKeys(review.persistence as unknown as Record<string, unknown>, [
    'createOnly', 'filename', 'privateLocalOnly',
  ], 'Persisted synthetic listening persistence')
  review.playback.events.forEach((event, index) => assertExactKeys(
    event as unknown as Record<string, unknown>,
    [
      'completedAt', 'entireCandidatePlaybackAttested', 'eventDigest', 'exitCode',
      'normalizedAudioSha256', 'playerExecutableSha256', 'sequence', 'startedAt',
    ],
    `Persisted synthetic listening playback event ${index}`,
  ))
  review.review.results.forEach((result, index) => assertExactKeys(
    result as unknown as Record<string, unknown>,
    ['gate', 'note', 'result'],
    `Persisted synthetic listening gate ${index}`,
  ))
  const base = { ...review } as Record<string, unknown>
  delete base.recordDigest
  if (
    review.schemaVersion !== 'motion-studio.speech-synthetic-listening-review.v1' ||
    review.state !== 'synthetic_human_review_complete_not_c3_accepted' ||
    review.evidenceClass !== 'owner_delegated_private_synthetic_review' ||
    review.immutable !== true || !SHA256.test(review.recordDigest) ||
    sha256CanonicalJson(base) !== review.recordDigest ||
    !SHA256.test(review.reconciliationEvidenceDigest) ||
    !SHA256.test(review.independentTranscriptResultDigest) || !SHA256.test(review.syntheticTextDigest) ||
    review.normalizedAudio.privatePlaybackOnly !== true ||
    review.normalizedAudio.browserProjectionAllowed !== false ||
    !SHA256.test(review.normalizedAudio.sha256) ||
    !Number.isSafeInteger(review.normalizedAudio.byteLength) || review.normalizedAudio.byteLength < 44 ||
    !Number.isSafeInteger(review.normalizedAudio.durationMilliseconds) ||
    review.normalizedAudio.durationMilliseconds < 100 || review.normalizedAudio.durationMilliseconds > 30_000 ||
    review.playback.method !== 'fixed_local_system_audio_player' ||
    review.playback.playerPathPersisted !== false || review.playback.playbackCount !== review.playback.events.length ||
    review.playback.playbackEvidenceDigest !== sha256CanonicalJson({
      method: review.playback.method,
      playerPathPersisted: review.playback.playerPathPersisted,
      events: review.playback.events,
      playbackCount: review.playback.playbackCount,
    }) ||
    review.review.humanAttestationAccepted !== true ||
    review.review.reviewDigest !== sha256CanonicalJson({
      reviewerActorId: review.review.reviewerActorId,
      humanAttestationAccepted: review.review.humanAttestationAccepted,
      decision: review.review.decision,
      results: review.review.results,
      reviewedAt: review.review.reviewedAt,
    }) ||
    review.selection.eligibleForExplicitSelection !== false ||
    Object.values(review.selection).some((value) => value !== false) ||
    review.cost.providerUsagePreserved !== true || review.cost.localComputeCostReconciled !== false ||
    review.cost.customerPricingIncluded !== false || review.cost.customerCreditsIncluded !== false ||
    review.cost.serviceFeeIncluded !== false || review.cost.billingMutationPerformed !== false ||
    review.readiness.independentSemanticEvidenceReady !== true ||
    review.readiness.humanListeningReviewComplete !== true ||
    review.readiness.pronunciationHumanReviewComplete !== true ||
    review.readiness.performanceHumanReviewComplete !== true ||
    review.readiness.productionMultiTakeContinuityProven !== false ||
    review.readiness.c3ProviderEvidenceComplete !== false || review.readiness.ms012cAccepted !== false ||
    review.readiness.productReady !== false || review.readiness.externalBetaReady !== false ||
    review.readiness.productionReady !== false || review.readiness.finalDeliveryReady !== false ||
    review.persistence.privateLocalOnly !== true || review.persistence.createOnly !== true ||
    review.persistence.filename !== REVIEW_FILENAME
  ) blocked('Persisted synthetic listening review contains invalid authority or readiness state.')
  stableId(review.authorizationId, 'Persisted synthetic listening authorization ID')
  stableId(review.review.reviewerActorId, 'Persisted synthetic listening reviewer actor ID')
  exactIso(review.createdAt, 'Persisted synthetic listening creation time')
  if (review.createdAt !== review.review.reviewedAt) {
    blocked('Persisted synthetic listening review time diverged from its creation authority.')
  }
  const events = validatePlaybackEvents(
    review.playback.events,
    review.normalizedAudio.sha256,
    review.playback.events[0]?.playerExecutableSha256 ?? '',
    review.normalizedAudio.durationMilliseconds,
  )
  const results = validateListeningResults(review.review.results)
  const allPassed = results.every((result) => result.result === 'passed')
  if (
    events.length !== review.playback.playbackCount ||
    (allPassed && review.review.decision !== 'pass_for_selection_review') ||
    (!allPassed && review.review.decision !== 'reject_take') ||
    Date.parse(review.review.reviewedAt) < Date.parse(events.at(-1)?.completedAt ?? '')
  ) blocked('Persisted synthetic listening review decision does not match exact playback and gates.')
}

function preparationDigest(preparation: MotionStudioSpeechSyntheticListeningReviewPreparation): string {
  return sha256CanonicalJson({
    reconciliationEvidenceDigest: preparation.reconciliation.evidenceDigest,
    independentTranscriptResultDigest: preparation.independentTranscriptResultDigest,
    privateRunRoot: preparation.privateRunRoot,
    privateAudioPath: preparation.privateAudioPath,
    playerExecutablePath: preparation.playerExecutablePath,
    playerExecutableSha256: preparation.playerExecutableSha256,
    existingReviewDigest: preparation.existingReview?.recordDigest ?? null,
  })
}

function assertTrustedPreparation(preparation: MotionStudioSpeechSyntheticListeningReviewPreparation): void {
  if (trustedPreparations.get(preparation) !== preparationDigest(preparation)) {
    blocked('Synthetic listening review preparation is not a trusted exact instance.')
  }
}

async function verifyFixedLocalPlayer(): Promise<string> {
  const stat = await lstat(LOCAL_PLAYER_PATH).catch(() => undefined)
  if (!stat?.isFile() || stat.uid !== 0 || (stat.mode & 0o111) === 0 || stat.size < 1 || stat.size > MAXIMUM_PLAYER_BYTES) {
    blocked('Fixed local audio player is unavailable or outside its trusted filesystem boundary.')
  }
  const bytes = await readFile(LOCAL_PLAYER_PATH)
  if (bytes.byteLength !== stat.size) blocked('Fixed local audio player changed during verification.')
  return createHash('sha256').update(bytes).digest('hex')
}

async function assertPrivateRegularFile(path: string, expectedBytes: number): Promise<void> {
  const stat = await lstat(path).catch(() => undefined)
  if (!stat?.isFile() || stat.isSymbolicLink() || stat.size !== expectedBytes || (stat.mode & 0o777) !== PRIVATE_FILE_MODE) {
    blocked('Synthetic listening review private file authority is invalid.')
  }
}

function canonicalAudioPath(root: string, identity: string): string {
  if (!SHA256.test(identity)) invalid('Synthetic listening private audio identity is invalid.')
  return resolve(root, 'canonical-audio-tool-results', 'private-v1', identity.slice(0, 2), `${identity}.wav`)
}

async function readBoundedRegularFile(path: string, maximumBytes: number): Promise<Buffer> {
  const stat = await lstat(path).catch(() => undefined)
  if (!stat?.isFile() || stat.isSymbolicLink() || stat.size < 2 || stat.size > maximumBytes) {
    blocked('Synthetic listening review source file is missing or outside its byte bound.')
  }
  const bytes = await readFile(path)
  if (bytes.byteLength !== stat.size) blocked('Synthetic listening review source changed during verification.')
  return bytes
}

function inside(root: string, relativePath: string): string {
  if (!relativePath || relativePath.startsWith('/') || relativePath.includes('..') || relativePath.includes('\\')) {
    invalid('Synthetic listening review repository-relative path is invalid.')
  }
  const path = resolve(root, relativePath)
  if (path === root || !path.startsWith(`${root}${sep}`)) {
    invalid('Synthetic listening review path escapes the repository root.')
  }
  return path
}

function parseJson(bytes: Buffer, label: string): unknown {
  try { return JSON.parse(bytes.toString('utf8')) as unknown } catch {
    blocked(`${label} is not valid JSON.`)
  }
}

function object(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) blocked(`${label} is invalid.`)
  return value as Record<string, unknown>
}

function text(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value) blocked(`${label} is invalid.`)
  return value
}

function stableId(value: string, label: string): string {
  if (typeof value !== 'string' || !STABLE_ID.test(value)) invalid(`${label} is invalid.`)
  return value
}

function safeNote(value: string): string {
  const trimmed = typeof value === 'string' ? value.trim() : ''
  if (
    trimmed.length < 4 || trimmed.length > 500 ||
    [...trimmed].some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127) ||
    /(?:https?:\/\/|file:|data:|javascript:|\.\.\/|\.\.\\)/iu.test(trimmed)
  ) invalid('Synthetic listening review note is unsafe or outside its bounded size.')
  return trimmed
}

function assertExactKeys(value: Record<string, unknown>, expected: readonly string[], label: string): void {
  const actual = Object.keys(value).sort()
  const required = [...expected].sort()
  if (actual.length !== required.length || actual.some((key, index) => key !== required[index])) {
    blocked(`${label} contains missing or unknown fields.`)
  }
}

function exactIso(value: string, label: string): string {
  const milliseconds = Date.parse(value)
  if (!Number.isFinite(milliseconds) || new Date(milliseconds).toISOString() !== value) {
    invalid(`${label} is invalid.`)
  }
  return value
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
  throw new ApiError('JOB_DEPENDENCY_NOT_READY', message, 409, {
    requiredGate: 'motion_studio_speech_synthetic_human_listening_review',
  })
}
