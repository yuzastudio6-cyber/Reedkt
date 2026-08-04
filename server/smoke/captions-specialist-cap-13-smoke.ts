import assert from 'node:assert/strict'
import { pathToFileURL } from 'node:url'
import type { CaptionDomainRef } from '../../src/types/caption-domain-contracts'
import {
  CAPTION_SOUND_SUPPORT_RESULT_VERSION,
  type CaptionSoundSupportResult,
} from '../../src/types/caption-sound-support'
import {
  calculateSkillContractDigest,
  parseSkillSupportRequest,
} from '../orchestra/orchestra-skill-contracts'
import {
  createCaptionSoundAdmission,
  createCaptionSoundSupportBundle,
  parseCaptionSoundAdmission,
  parseCaptionSoundCueRequest,
  parseCaptionSoundSupportResult,
  type CaptionSoundContext,
} from '../captions-specialist/caption-sound-support'
import {
  CAP_11_APPROVAL_ENVELOPE_REF,
  CAP_11_SCENE_GRAPH_FIXTURE,
} from './captions-specialist-cap-11-smoke'
import {
  CAP_12_MOTION_LOCK_FIXTURE,
  CAP_12_MOTION_PLAN_FIXTURE,
  CAP_12_STORYTIMING_RESOLUTION_FIXTURE,
} from './captions-specialist-cap-12-smoke'

let assertions = 0

function check(condition: unknown, message: string): asserts condition {
  assert.ok(condition, message)
  assertions += 1
}

function expectThrow(run: () => unknown): void {
  assert.throws(run)
  assertions += 1
}

function ref(id: string, version = 'caption-cap13-fixture-v1'): CaptionDomainRef {
  return { id, version, contentHash: 'a'.repeat(64) }
}

function digest<T extends Record<string, unknown>>(value: T, field: keyof T): string {
  return calculateSkillContractDigest(value, String(field))
}

function createContractFixtureResult(input: {
  context: CaptionSoundContext
  bundle: ReturnType<typeof createCaptionSoundSupportBundle>
}): CaptionSoundSupportResult {
  const { payload, supportRequest } = input.bundle
  const base: Omit<CaptionSoundSupportResult, 'resultDigestSha256'> = {
    schemaVersion: CAPTION_SOUND_SUPPORT_RESULT_VERSION,
    resultId: 'caption.sound.cap13.fixture-result',
    supportRequestRef: {
      id: supportRequest.requestId,
      version: supportRequest.schemaVersion,
      contentHash: supportRequest.requestDigestSha256,
    },
    captionSoundRequestRef: {
      id: payload.requestId,
      version: payload.schemaVersion,
      contentHash: payload.requestDigestSha256,
    },
    canonicalScope: structuredClone(payload.canonicalScope),
    sceneGraphRef: structuredClone(payload.sceneGraphRef),
    motionLockRef: structuredClone(payload.motionLockRef),
    storyTimingResolutionRef: structuredClone(payload.storyTimingResolutionRef),
    masterTimingRef: structuredClone(payload.masterTimingRef),
    producerSkillKey: 'soundsync',
    cueResults: payload.cueIntents.map((intent) => ({
      cueIntentId: intent.cueIntentId,
      disposition: intent.decision === 'request_cue' ? 'admitted' : 'silent',
      reasonCode: intent.decision === 'request_cue'
        ? 'approved_sound_contract_fixture' : 'caption_restraint_preserved',
      storyTimingEventRef: structuredClone(intent.storyTimingEventRef),
      soundSyncCueRef: intent.decision === 'request_cue'
        ? ref(`soundsync.cue.${intent.cueIntentId}`, 'soundsync-cue-plan-v1') : null,
      selectedSoundAssetRef: null,
      trimAndAlignmentRef: null,
      mixPlanRef: null,
      dialogueProtectionRef: null,
    })),
    dialogueProtectedFinalMix: {
      dependencyRef: ref(
        'soundsync.dialogue-protected-final-mix.cap13',
        'soundsync-dialogue-protected-final-mix-dependency-v1',
      ),
      finalMixRef: null,
      dialogueProtectionQaRef: null,
      finalMixRereadVerified: false,
      voiceClarityPassed: false,
      noCueMasksDialogue: false,
    },
    evidenceMode: 'approved_contract_fixture',
    exactCanonicalScopeReread: false,
    exactMotionAndTimingLineageVerified: false,
    actualSoundRuntimeObserved: false,
    actualAudioAssetReread: false,
    actualDialogueProtectedFinalMixQaCompleted: false,
    browserLocalStateUsed: false,
    rawAudioBytesIncluded: false,
    pathsOrUrlsIncluded: false,
    providerPayloadIncluded: false,
    runtimeAuthorityGrantedToCaption: false,
    assetAuthorityGrantedToCaption: false,
    mixAuthorityGrantedToCaption: false,
    costOrBillingAuthorityGrantedToCaption: false,
    finalQaApprovalGrantedToCaption: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
  }
  return parseCaptionSoundSupportResult({
    ...base,
    resultDigestSha256: digest(
      { ...base, resultDigestSha256: '' }, 'resultDigestSha256'),
  }, input.bundle, input.context)
}

export function runCap13Smoke(): void {
  const context: CaptionSoundContext = {
    sceneGraph: CAP_11_SCENE_GRAPH_FIXTURE,
    motionPlan: CAP_12_MOTION_PLAN_FIXTURE,
    motionLock: CAP_12_MOTION_LOCK_FIXTURE,
    storyTimingResolution: CAP_12_STORYTIMING_RESOLUTION_FIXTURE,
    approvedCaptionEnvelopeRef: CAP_11_APPROVAL_ENVELOPE_REF,
  }
  const bundle = createCaptionSoundSupportBundle({
    requestId: 'caption.sound.cap13.request',
    idempotencyKey: 'caption.sound.cap13.idempotency',
    originalCallRef: ref('orchestra.call.caption.cap13', 'orchestra-skill-call-v1'),
    context,
    dialogueTrackRef: ref('dialogue.track.cap13', 'canonical-dialogue-track-v1'),
    dialogueActivityRef: ref('dialogue.activity.cap13', 'dialogue-activity-v1'),
    maximumRequestedCueCount: 2,
  })
  const request = parseCaptionSoundCueRequest(bundle.payload, context)
  const requested = request.cueIntents.filter((intent) => intent.decision === 'request_cue')
  const silent = request.cueIntents.filter((intent) => intent.decision === 'remain_silent')

  check(request.cueIntents.length === 12,
    'Every Caption node must receive an explicit Sound request or restraint decision.')
  check(requested.length === 2 && silent.length === 10,
    'Only the two graph-authorized hero cues may request restrained Sound support.')
  check(requested.every((intent) => intent.eligibility === 'sound_optional'),
    'Requested cues must derive from the graph sound-eligibility authority.')
  check(silent.every((intent) => intent.eligibility === 'sound_forbidden'),
    'Accessibility and ordinary speech nodes must remain explicitly silent.')
  check(request.densityBudget.requestedCueCount === 2
    && request.densityBudget.maximumRequestedCueCount === 2
    && request.densityBudget.simultaneousCueCountLimit === 1
    && request.densityBudget.forbiddenPerWordCuePattern,
  'Caption Sound density must stay restrained and forbid per-word audio decoration.')
  check(request.soundSupportBoundary.targetSkillKey === 'soundsync'
    && request.soundSupportBoundary.soundSyncOwnsCueSelectionGenerationAndMix,
  'SoundSync must remain the sole cue-selection, generation, and mix owner.')
  check(bundle.supportRequest.mediationPolicy.hqMediated
    && !bundle.supportRequest.mediationPolicy.directPeerDispatchAllowed
    && bundle.supportRequest.targetSkillKey === 'soundsync',
  'Caption Sound requests must cross the neutral HQ-mediated support boundary.')
  check(!request.soundAssetSelectionPerformedByCaption
    && !request.soundGenerationRequestedDirectlyByCaption
    && !request.mixOrLoudnessAuthorityClaimed,
  'Caption must not select assets, generate sound, or claim mix authority.')
  check(request.silentFallback.alwaysAllowed
    && request.silentFallback.selectedWhenSupportUnavailable
    && request.silentFallback.preservesCaptionMeaning,
  'A semantically safe silent fallback must always remain available.')

  const fixtureResult = createContractFixtureResult({ context, bundle })
  check(fixtureResult.cueResults.filter((item) => item.disposition === 'admitted').length === 2,
    'The injected Sound contract fixture must mirror the two eligible requests.')
  check(!fixtureResult.actualSoundRuntimeObserved
    && !fixtureResult.actualAudioAssetReread
    && !fixtureResult.actualDialogueProtectedFinalMixQaCompleted,
  'Contract fixture evidence must never be presented as actual Sound runtime evidence.')
  check(fixtureResult.cueResults.every((item) => item.selectedSoundAssetRef === null
    && item.trimAndAlignmentRef === null && item.mixPlanRef === null),
  'The source-only fixture must not invent selected assets, trims, or mix plans.')

  const fixtureAdmission = createCaptionSoundAdmission({
    admissionId: 'caption.sound.cap13.fixture-admission',
    bundle,
    context,
    supportResult: fixtureResult,
  })
  check(fixtureAdmission.disposition === 'contract_ready_silent_fallback',
    'A contract fixture must remain ready only for the safe silent fallback.')
  check(fixtureAdmission.cueAdmissions.filter((item) =>
    item.selectedDisposition === 'contract_fixture_only').length === 2,
  'Eligible fixture cues must remain contract-only until authenticated Sound runtime.')
  check(fixtureAdmission.cueAdmissions.filter((item) =>
    item.selectedDisposition === 'silent_fallback').length === 10,
  'Every forbidden cue must preserve explicit silence in admission.')
  check(!fixtureAdmission.dialogueProtectedFinalMixVerified
    && fixtureAdmission.soundSyncRemainsAudioOwner
    && fixtureAdmission.storyTimingRemainsFrameOwner,
  'Final-mix evidence must remain open under SoundSync and StoryTiming ownership.')

  const noResultAdmission = createCaptionSoundAdmission({
    admissionId: 'caption.sound.cap13.no-result-admission',
    bundle,
    context,
    supportResult: null,
  })
  check(noResultAdmission.disposition === 'silent_fallback_selected'
    && noResultAdmission.cueAdmissions.every((item) =>
      item.selectedDisposition === 'silent_fallback'),
  'Missing Sound support must deterministically select the silent fallback.')
  check(!noResultAdmission.captionSelectedProvider
    && !noResultAdmission.captionCreatedSoundAsset
    && !noResultAdmission.captionMixedAudio
    && !noResultAdmission.captionGrantedFinalQa
    && !noResultAdmission.runtimeExecutionGranted
    && !noResultAdmission.publicDeliveryGranted
    && !noResultAdmission.productionAuthorityGranted,
  'All Caption Sound runtime, asset, mix, QA, delivery, and production authorities stay closed.')

  const forbiddenIndex = request.cueIntents.findIndex((intent) =>
    intent.eligibility === 'sound_forbidden')
  check(forbiddenIndex >= 0, 'The fixture must contain a forbidden Sound cue for attacks.')

  const forbiddenRequest = structuredClone(request)
  forbiddenRequest.cueIntents[forbiddenIndex].decision = 'request_cue'
  forbiddenRequest.cueIntents[forbiddenIndex].requestedTextureCode = 'invalid_per_word_tick'
  forbiddenRequest.cueIntents[forbiddenIndex].musicRelationship = 'do_not_compete'
  forbiddenRequest.cueIntents[forbiddenIndex].intensity = 'subtle_polish'
  forbiddenRequest.densityBudget.requestedCueCount += 1
  forbiddenRequest.estimateInputs.requestedCueCount += 1
  forbiddenRequest.densityBudget.maximumRequestedCueCount += 1
  forbiddenRequest.requestDigestSha256 = digest(
    forbiddenRequest as unknown as Record<string, unknown>, 'requestDigestSha256')
  expectThrow(() => parseCaptionSoundCueRequest(forbiddenRequest, context))

  const excessiveDensity = structuredClone(request)
  excessiveDensity.densityBudget.maximumRequestedCueCount = 1
  excessiveDensity.requestDigestSha256 = digest(
    excessiveDensity as unknown as Record<string, unknown>, 'requestDigestSha256')
  expectThrow(() => parseCaptionSoundCueRequest(excessiveDensity, context))

  const captionAssetAuthority = structuredClone(request)
  captionAssetAuthority.soundAssetSelectionPerformedByCaption = true as false
  captionAssetAuthority.requestDigestSha256 = digest(
    captionAssetAuthority as unknown as Record<string, unknown>, 'requestDigestSha256')
  expectThrow(() => parseCaptionSoundCueRequest(captionAssetAuthority, context))

  const directPeerDispatch = structuredClone(bundle.supportRequest)
  directPeerDispatch.mediationPolicy.directPeerDispatchAllowed = true as false
  directPeerDispatch.requestDigestSha256 = digest(
    directPeerDispatch as unknown as Record<string, unknown>, 'requestDigestSha256')
  expectThrow(() => parseSkillSupportRequest(directPeerDispatch))

  const forbiddenAdmission = structuredClone(fixtureResult)
  forbiddenAdmission.cueResults[forbiddenIndex].disposition = 'admitted'
  forbiddenAdmission.cueResults[forbiddenIndex].soundSyncCueRef = ref('soundsync.invalid.cue')
  forbiddenAdmission.resultDigestSha256 = digest(
    forbiddenAdmission as unknown as Record<string, unknown>, 'resultDigestSha256')
  expectThrow(() => parseCaptionSoundSupportResult(forbiddenAdmission, bundle, context))

  const silentCueOverclaim = structuredClone(fixtureResult)
  silentCueOverclaim.cueResults[forbiddenIndex].soundSyncCueRef = ref('soundsync.invalid.silent-cue')
  silentCueOverclaim.resultDigestSha256 = digest(
    silentCueOverclaim as unknown as Record<string, unknown>, 'resultDigestSha256')
  expectThrow(() => parseCaptionSoundSupportResult(silentCueOverclaim, bundle, context))

  const fixtureRuntimeOverclaim = structuredClone(fixtureResult)
  fixtureRuntimeOverclaim.actualSoundRuntimeObserved = true
  fixtureRuntimeOverclaim.resultDigestSha256 = digest(
    fixtureRuntimeOverclaim as unknown as Record<string, unknown>, 'resultDigestSha256')
  expectThrow(() => parseCaptionSoundSupportResult(fixtureRuntimeOverclaim, bundle, context))

  const fixtureAssetOverclaim = structuredClone(fixtureResult)
  fixtureAssetOverclaim.cueResults.find((item) => item.disposition === 'admitted')!
    .selectedSoundAssetRef = ref('sound.asset.invalid')
  fixtureAssetOverclaim.resultDigestSha256 = digest(
    fixtureAssetOverclaim as unknown as Record<string, unknown>, 'resultDigestSha256')
  expectThrow(() => parseCaptionSoundSupportResult(fixtureAssetOverclaim, bundle, context))

  const staleMotion = structuredClone(fixtureResult)
  staleMotion.motionLockRef = ref('caption.motion.lock.stale')
  staleMotion.resultDigestSha256 = digest(
    staleMotion as unknown as Record<string, unknown>, 'resultDigestSha256')
  expectThrow(() => parseCaptionSoundSupportResult(staleMotion, bundle, context))

  const incompleteAuthenticated = structuredClone(fixtureResult)
  incompleteAuthenticated.evidenceMode = 'authenticated_private_runtime'
  incompleteAuthenticated.exactCanonicalScopeReread = true
  incompleteAuthenticated.exactMotionAndTimingLineageVerified = true
  incompleteAuthenticated.actualSoundRuntimeObserved = true
  incompleteAuthenticated.actualAudioAssetReread = true
  incompleteAuthenticated.actualDialogueProtectedFinalMixQaCompleted = true
  incompleteAuthenticated.resultDigestSha256 = digest(
    incompleteAuthenticated as unknown as Record<string, unknown>, 'resultDigestSha256')
  expectThrow(() => parseCaptionSoundSupportResult(incompleteAuthenticated, bundle, context))

  const forgedReadyAdmission = structuredClone(fixtureAdmission)
  forgedReadyAdmission.disposition = 'authenticated_private_ready'
  forgedReadyAdmission.admissionDigestSha256 = digest(
    forgedReadyAdmission as unknown as Record<string, unknown>, 'admissionDigestSha256')
  expectThrow(() => parseCaptionSoundAdmission(
    forgedReadyAdmission, bundle, context, fixtureResult))

  const inherited = Object.create(request) as typeof request
  expectThrow(() => parseCaptionSoundCueRequest(inherited, context))

  console.log(JSON.stringify({
    status: 'passed_with_authenticated_sound_runtime_and_final_mix_qa_gates',
    milestone: 'CAP-13',
    assertions,
    captionNodeCount: request.cueIntents.length,
    requestedCueCount: requested.length,
    explicitSilentCueCount: silent.length,
    maximumRequestedCueCount: request.densityBudget.maximumRequestedCueCount,
    fixtureAdmissionDisposition: fixtureAdmission.disposition,
    noResultAdmissionDisposition: noResultAdmission.disposition,
    actualSoundRuntimeObserved: false,
    actualAudioAssetReread: false,
    dialogueProtectedFinalMixQaCompleted: false,
    providerOrAssetSelectedByCaption: false,
    productionAuthorityPromoted: false,
  }, null, 2))
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCap13Smoke()
}
