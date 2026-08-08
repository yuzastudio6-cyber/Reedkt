import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type { CaptionDomainRef } from
  '../../src/types/caption-domain-contracts'
import {
  CAPTION_SOUND_SUPPORT_RESULT_VERSION,
  type CaptionSoundSupportResult,
} from '../../src/types/caption-sound-support'
import type { CanonicalCreateOnlyJsonObjectPort } from
  '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createCaptionSoundSupportBundle,
  parseCaptionSoundSupportResult,
  type CaptionSoundContext,
} from '../captions-specialist/caption-sound-support'
import { runCaptionsSpecialistJob } from
  '../captions-specialist/captions-specialist-runtime'
import { createCaptionsHarnessCall } from
  '../internal-testing/captions-specialist-harness'
import { createCanonicalCaptionSoundSyncStructuralContext } from
  '../internal-testing/canonical-caption-soundsync-structural-support-fixture'
import {
  calculateSkillContractDigest,
  parseOrchestraSkillCall,
} from '../orchestra/orchestra-skill-contracts'
import {
  createCanonicalCaptionSoundSyncContextReadPort,
  createCanonicalCaptionSoundSyncEvidenceRepository,
  createCanonicalCaptionSoundSyncOwnerReadPort,
  createCanonicalCaptionSoundSyncSupportService,
  parseCanonicalCaptionSoundSyncAuthenticatedEvidenceRecord,
} from '../services/canonical-caption-soundsync-support-service'
import {
  createCanonicalCaptionSoundSupportInputReadPort,
  resolveCanonicalCaptionSoundSupportRuntimeInput,
} from '../services/canonical-caption-sound-support-input-service'
import {
  createCanonicalSpecialistCallResultPair,
  createCanonicalSpecialistSupportResumeRepository,
  rereadCanonicalSpecialistSupportResumeChain,
} from '../services/canonical-specialist-support-resume-service'
import {
  CAP_11_APPROVAL_ENVELOPE_REF,
  CAP_11_CONFIRMED_FRAME_REF,
  CAP_11_SCENE_GRAPH_FIXTURE,
} from './captions-specialist-cap-11-smoke'
import {
  CAP_12_MOTION_LOCK_FIXTURE,
  CAP_12_MOTION_PLAN_FIXTURE,
  CAP_12_STORYTIMING_RESOLUTION_FIXTURE,
} from './captions-specialist-cap-12-smoke'

let checks = 0
function check(value: unknown, message: string): asserts value {
  assert.ok(value, message)
  checks += 1
}
async function reject(action: () => Promise<unknown>): Promise<void> {
  await assert.rejects(action)
  checks += 1
}
function hash(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}
function ref(id: string, version = `${id}.v1`): CaptionDomainRef {
  return { id, version, contentHash: hash(id) }
}
function redigest<T extends Record<string, unknown>>(
  value: T,
  digestField: string,
): T {
  const clone = structuredClone(value)
  clone[digestField as keyof T] = calculateSkillContractDigest(
    clone, digestField) as T[keyof T]
  return clone
}

const context: CaptionSoundContext = {
  sceneGraph: CAP_11_SCENE_GRAPH_FIXTURE,
  motionPlan: CAP_12_MOTION_PLAN_FIXTURE,
  motionLock: CAP_12_MOTION_LOCK_FIXTURE,
  storyTimingResolution: CAP_12_STORYTIMING_RESOLUTION_FIXTURE,
  approvedCaptionEnvelopeRef: CAP_11_APPROVAL_ENVELOPE_REF,
}
const requestId = 'caption.soundsync.bridge.request'
const callSeed = createCaptionsHarnessCall({
  callId: 'caption.soundsync.bridge.call',
  jobType: 'provide_typographic_transition_support',
  scopeLevel: 'boundary',
  runtimeProfile: 'post_cap20_integration',
  approvedSnapshotRef:
    context.sceneGraph.canonicalScope.approvedSnapshotRef ?? undefined,
  outputId: context.sceneGraph.canonicalScope.outputId,
  sceneId: context.sceneGraph.canonicalScope.sceneId ?? undefined,
  boundaryId: `${requestId}.sound-boundary`,
  inputArtifactTypes: [
    'canonical_transcript', 'confirmed_output_frame',
    'master_timing_or_planning_timing',
  ],
})
const callCandidate = structuredClone(callSeed)
callCandidate.canonicalScope = {
  ownerUserId: context.sceneGraph.canonicalScope.ownerUserId,
  workspaceId: context.sceneGraph.canonicalScope.workspaceId,
  projectId: context.sceneGraph.canonicalScope.projectId,
  editSessionId: context.sceneGraph.canonicalScope.editSessionId,
  approvedSnapshotRef: structuredClone(
    context.sceneGraph.canonicalScope.approvedSnapshotRef),
  outputId: context.sceneGraph.canonicalScope.outputId,
  sceneId: context.sceneGraph.canonicalScope.sceneId,
  boundaryId: `${requestId}.sound-boundary`,
  authorizedFrameRanges: structuredClone(
    context.sceneGraph.canonicalScope.authorizedFrameRanges),
}
const masterTimingIndex = callCandidate.inputArtifactRefs.findIndex(
  (artifact) => artifact.artifactType
    === 'master_timing_or_planning_timing')
assert.ok(masterTimingIndex >= 0)
callCandidate.inputArtifactRefs[masterTimingIndex] = {
  ...callCandidate.inputArtifactRefs[masterTimingIndex]!,
  ...structuredClone(context.storyTimingResolution.masterTimingRef),
}
const confirmedFrameIndex = callCandidate.inputArtifactRefs.findIndex(
  (artifact) => artifact.artifactType === 'confirmed_output_frame')
assert.ok(confirmedFrameIndex >= 0)
callCandidate.inputArtifactRefs[confirmedFrameIndex] = {
  ...callCandidate.inputArtifactRefs[confirmedFrameIndex]!,
  ...structuredClone(CAP_11_CONFIRMED_FRAME_REF),
}
const call = parseOrchestraSkillCall(redigest(
  callCandidate as unknown as Record<string, unknown>,
  'callDigestSha256'))
const postapprovalFinishBindingRef = ref(
  'caption.finish.binding.soundsync.bridge',
  'canonical-caption-postapproval-finish-binding-v1')
let soundInputReads = 0
const soundRuntimeInput =
  await resolveCanonicalCaptionSoundSupportRuntimeInput({
    call,
    postapprovalFinishBindingRef,
    pictureLockRef: context.sceneGraph.pictureLockRef,
    finishReadinessRef: context.sceneGraph.finishReadinessRef,
    readPort: createCanonicalCaptionSoundSupportInputReadPort(
      async (request) => {
        soundInputReads += 1
        assert.deepEqual(
          request.postapprovalFinishBindingRef,
          postapprovalFinishBindingRef,
        )
        return {
          canonicalContext: structuredClone(context),
          dialogueTrackRef: ref(
            'dialogue.track.soundsync.bridge',
            'canonical-dialogue-track-v1'),
          dialogueActivityRef: ref(
            'dialogue.activity.soundsync.bridge',
            'dialogue-activity-v1'),
          maximumRequestedCueCount: 2,
        }
      }),
  })
check(soundInputReads === 2
  && soundRuntimeInput.soundSupportContext !== undefined
  && soundRuntimeInput.soundSupportPayload !== undefined,
'The canonical Caption runner must double-reread exact motion-lock and StoryTiming inputs before authoring a SoundSync request.')
const remappedCallCandidate = structuredClone(callCandidate)
remappedCallCandidate.canonicalScope.authorizedFrameRanges = [{
  startFrame: 60,
  endFrameExclusive: 240,
}]
const remappedCall = parseOrchestraSkillCall(redigest(
  remappedCallCandidate as unknown as Record<string, unknown>,
  'callDigestSha256'))
const remappedContext = createCanonicalCaptionSoundSyncStructuralContext({
  call: remappedCall,
  pictureLockRef: context.sceneGraph.pictureLockRef,
  finishReadinessRef: context.sceneGraph.finishReadinessRef,
})
const remappedRuntimeInput =
  await resolveCanonicalCaptionSoundSupportRuntimeInput({
    call: remappedCall,
    postapprovalFinishBindingRef,
    pictureLockRef: remappedContext.sceneGraph.pictureLockRef,
    finishReadinessRef: remappedContext.sceneGraph.finishReadinessRef,
    readPort: createCanonicalCaptionSoundSupportInputReadPort(async () => ({
      canonicalContext: structuredClone(remappedContext),
      dialogueTrackRef: ref(
        'dialogue.track.soundsync.remapped',
        'canonical-dialogue-track-v1'),
      dialogueActivityRef: ref(
        'dialogue.activity.soundsync.remapped',
        'dialogue-activity-v1'),
      maximumRequestedCueCount: 2,
    })),
  })
const remappedPayload = remappedRuntimeInput.soundSupportPayload as {
  densityBudget: { windowRange: { startFrame: number; endFrameExclusive: number } }
}
check(remappedPayload.densityBudget.windowRange.startFrame === 60
  && remappedPayload.densityBudget.windowRange.endFrameExclusive === 240,
'Structural Sound inputs must remap StoryTiming and motion into the exact approved call range rather than reusing CAP-12 fixture frames.')
const bundle = createCaptionSoundSupportBundle({
  requestId,
  idempotencyKey: call.idempotencyKey,
  originalCallRef: callRef(call),
  context,
  dialogueTrackRef: ref(
    'dialogue.track.soundsync.bridge', 'canonical-dialogue-track-v1'),
  dialogueActivityRef: ref(
    'dialogue.activity.soundsync.bridge', 'dialogue-activity-v1'),
  maximumRequestedCueCount: 2,
})
const initialResult = runCaptionsSpecialistJob({
  call,
  soundSupportContext: context,
  soundSupportPayload: bundle.payload,
})
check(initialResult.disposition === 'needs_followup'
  && initialResult.supportRequests.length === 1
  && initialResult.supportRequests[0]!.targetSkillKey === 'soundsync',
'Caption must stop at one typed SoundSync support request.')
const supportRequest = initialResult.supportRequests[0]!
check(supportRequest.requestDigestSha256
  === bundle.supportRequest.requestDigestSha256,
'The runtime request must preserve the exact Caption Sound payload and scope.')

const objectValues = new Map<string, Buffer>()
const objectPort = memoryObjectPort(objectValues)
const supportResumeRepository =
  createCanonicalSpecialistSupportResumeRepository({
    objectPort,
    prefix: 'private/smoke/caption-soundsync/resume/v1',
  })
await supportResumeRepository.persistCallResultPairCreateOnly({
  pair: createCanonicalSpecialistCallResultPair({
    call,
    result: initialResult,
    persistedAt: '2026-08-05T18:00:00.000Z',
  }),
})
const evidenceRepository =
  createCanonicalCaptionSoundSyncEvidenceRepository({
    objectPort,
    prefix: 'private/smoke/caption-soundsync/evidence/v1',
  })
const exactBundle = { payload: bundle.payload, supportRequest }
const ownerResult = authenticatedResultFixture(exactBundle, context)
let contextReads = 0
const contextReadPort = createCanonicalCaptionSoundSyncContextReadPort(
  async (request) => {
    contextReads += 1
    assert.equal(request.captionSoundRequestRef.contentHash,
      bundle.payload.requestDigestSha256)
    assert.equal(request.masterTimingRef.contentHash,
      bundle.payload.masterTimingRef.contentHash)
    return structuredClone(context)
  })
let ownerReads = 0
const ownerReadPort = createCanonicalCaptionSoundSyncOwnerReadPort(
  async ({ supportRequest: requestedSupport }) => {
    ownerReads += 1
    assert.equal(requestedSupport.requestDigestSha256,
      supportRequest.requestDigestSha256)
    return structuredClone(ownerResult)
  })
const service = createCanonicalCaptionSoundSyncSupportService({
  supportResumeRepository,
  contextReadPort,
  ownerReadPort,
  evidenceRepository,
  now: () => new Date('2026-08-05T18:01:00.000Z'),
})
const bridgeInput = {
  authenticatedOwnerUserId: call.canonicalScope.ownerUserId,
  priorCallRef: callRef(call),
  selectedSupportRequestRef: requestRef(supportRequest),
}
const projectedOnly = await service.projectAuthenticatedEvidence(bridgeInput)
const projectedOnlyChain =
  await rereadCanonicalSpecialistSupportResumeChain({
    initialCallRef: callRef(call),
    repository: supportResumeRepository,
  })
check(projectedOnly.recordDigestSha256.length === 64
  && projectedOnlyChain?.status === 'waiting_for_persisted_resume_record',
'The Sound owner projection must persist authenticated evidence without becoming a second Caption resume owner.')
const outcome = await service.projectAndResumeAuthenticatedEvidence(bridgeInput)
check(contextReads === 4 && ownerReads === 4,
  'Projection-only replay and canonical resume must each reread Caption context and SoundSync result twice.')
check(outcome.evidenceRecord.soundSyncResult.evidenceMode
  === 'authenticated_private_runtime'
  && outcome.evidenceRecord.captionAdmission.disposition
    === 'authenticated_private_ready'
  && outcome.evidenceRecord.captionAdmission
    .dialogueProtectedFinalMixVerified,
'Only authenticated runtime, audio reread, and dialogue-protected QA may admit.')
check(outcome.evidenceRecord.authenticatedOwnerProjection.ownerKey
  === 'soundsync'
  && outcome.evidenceRecord.authenticatedOwnerProjection.artifactRefs[0]!
    .artifactType === 'caption_sound_support_result',
'The resume ledger must carry one exact SoundSync-owned result artifact.')
check(outcome.resumeRecord.resumedResult.disposition === 'completed'
  && outcome.resumeRecord.resumedResult.reasonCodes.includes(
    'soundsync.authenticated_admission.accepted'),
'The same Caption job must resume only after exact SoundSync admission.')
check(!outcome.evidenceRecord.cueAssetOrMixChosenByCaption
  && !outcome.evidenceRecord.runtimeExecutionPerformedByBridge
  && !outcome.evidenceRecord.assetMutationPerformedByBridge
  && !outcome.evidenceRecord.finalQaApprovalGrantedByBridge
  && !outcome.evidenceRecord.productionAuthorityGranted,
'Caption and the bridge must gain no cue, asset, mix, runtime, or QA authority.')
check(parseCanonicalCaptionSoundSyncAuthenticatedEvidenceRecord(
  outcome.evidenceRecord).recordDigestSha256
  === outcome.evidenceRecord.recordDigestSha256,
'The create-only SoundSync evidence record must survive closed parsing.')
const replay = await service.projectAndResumeAuthenticatedEvidence(bridgeInput)
check(replay.evidenceRecord.recordDigestSha256
  === outcome.evidenceRecord.recordDigestSha256
  && replay.resumeRecord.recordDigestSha256
    === outcome.resumeRecord.recordDigestSha256,
'Exact replay must reconcile to identical evidence and resume records.')

await reject(() => service.projectAndResumeAuthenticatedEvidence({
  ...bridgeInput,
  authenticatedOwnerUserId: 'owner.crossed',
}))
await reject(() => service.projectAndResumeAuthenticatedEvidence({
  ...bridgeInput,
  soundSyncResult: ownerResult,
} as never))

let contextDriftReads = 0
const contextDriftService = createCanonicalCaptionSoundSyncSupportService({
  supportResumeRepository,
  ownerReadPort,
  evidenceRepository,
  contextReadPort: createCanonicalCaptionSoundSyncContextReadPort(async () => {
    contextDriftReads += 1
    if (contextDriftReads === 1) return structuredClone(context)
    const changed = structuredClone(context)
    changed.approvedCaptionEnvelopeRef.id = 'envelope.crossed'
    return changed
  }),
})
await reject(() => contextDriftService.projectAndResumeAuthenticatedEvidence(
  bridgeInput))

let resultDriftReads = 0
const resultDriftService = createCanonicalCaptionSoundSyncSupportService({
  supportResumeRepository,
  contextReadPort,
  evidenceRepository,
  ownerReadPort: createCanonicalCaptionSoundSyncOwnerReadPort(async () => {
    resultDriftReads += 1
    if (resultDriftReads === 1) return structuredClone(ownerResult)
    const changed = structuredClone(ownerResult)
    changed.dialogueProtectedFinalMix.finalMixRef!.id = 'mix.crossed'
    return redigest(changed as unknown as Record<string, unknown>,
      'resultDigestSha256')
  }),
})
await reject(() => resultDriftService.projectAndResumeAuthenticatedEvidence(
  bridgeInput))

const failedVoiceResult = structuredClone(ownerResult)
failedVoiceResult.dialogueProtectedFinalMix.voiceClarityPassed = false
const failedVoiceService = createCanonicalCaptionSoundSyncSupportService({
  supportResumeRepository,
  contextReadPort,
  evidenceRepository,
  ownerReadPort: createCanonicalCaptionSoundSyncOwnerReadPort(async () =>
    redigest(failedVoiceResult as unknown as Record<string, unknown>,
      'resultDigestSha256')),
})
await reject(() => failedVoiceService.projectAndResumeAuthenticatedEvidence(
  bridgeInput))

const tamperedRecord = structuredClone(outcome.evidenceRecord)
tamperedRecord.soundSyncResult.dialogueProtectedFinalMix.finalMixRef!.id =
  'mix.tampered'
assert.throws(() => parseCanonicalCaptionSoundSyncAuthenticatedEvidenceRecord(
  tamperedRecord))
checks += 1

assert.throws(() => createCanonicalCaptionSoundSyncSupportService({
  supportResumeRepository,
  contextReadPort,
  evidenceRepository,
  ownerReadPort: {
    schemaVersion: 'canonical-caption-soundsync-owner-read-port-v1',
    sourceAuthority: 'canonical_soundsync_owner',
    callerSuppliedSoundResultAccepted: false,
    async readExact() { return ownerResult },
  },
}))
checks += 1

console.log(JSON.stringify({
  smoke: 'canonical-caption-soundsync-support-service',
  status: 'passed',
  checks,
  contextReads,
  ownerReads,
  evidenceRecordDigestSha256:
    outcome.evidenceRecord.recordDigestSha256,
  resumeRecordDigestSha256: outcome.resumeRecord.recordDigestSha256,
  dialogueProtectedFinalMixVerified: true,
  authenticatedOwnerFixtureOnly: true,
  actualSoundRuntimeExecutedBySmoke: false,
  terminalQualificationClaimed: false,
  storyTimingRemainsFrameOwner: true,
  soundSyncRemainsCueAssetTrimMixOwner: true,
  runtimeExecutionPerformedByBridge: false,
  publicDeliveryGranted: false,
  productionAuthorityGranted: false,
}, null, 2))

function authenticatedResultFixture(
  soundBundle: typeof exactBundle,
  soundContext: CaptionSoundContext,
): CaptionSoundSupportResult {
  const payload = soundBundle.payload
  const base: Omit<CaptionSoundSupportResult, 'resultDigestSha256'> = {
    schemaVersion: CAPTION_SOUND_SUPPORT_RESULT_VERSION,
    resultId: 'caption.soundsync.bridge.result',
    supportRequestRef: requestRef(soundBundle.supportRequest),
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
    cueResults: payload.cueIntents.map((intent) => {
      const admitted = intent.decision === 'request_cue'
      return {
        cueIntentId: intent.cueIntentId,
        disposition: admitted ? 'admitted' as const : 'silent' as const,
        reasonCode: admitted
          ? 'soundsync_authenticated_cue_admitted'
          : 'caption_sound_restraint_preserved',
        storyTimingEventRef: structuredClone(intent.storyTimingEventRef),
        soundSyncCueRef: admitted
          ? ref(`soundsync.cue.${intent.cueIntentId}`, 'soundsync-cue-v1')
          : null,
        selectedSoundAssetRef: admitted
          ? ref(`soundsync.asset.${intent.cueIntentId}`, 'sound-asset-v1')
          : null,
        trimAndAlignmentRef: admitted
          ? ref(`soundsync.trim.${intent.cueIntentId}`,
            'soundsync-trim-alignment-v1') : null,
        mixPlanRef: admitted
          ? ref(`soundsync.mix.${intent.cueIntentId}`,
            'soundsync-mix-plan-v1') : null,
        dialogueProtectionRef: admitted
          ? ref(`soundsync.dialogue.${intent.cueIntentId}`,
            'soundsync-dialogue-protection-v1') : null,
      }
    }),
    dialogueProtectedFinalMix: {
      dependencyRef: ref(
        'soundsync.final-mix.dependency.bridge',
        'soundsync-dialogue-protected-final-mix-dependency-v1'),
      finalMixRef: ref(
        'soundsync.final-mix.bridge', 'soundsync-final-mix-v1'),
      dialogueProtectionQaRef: ref(
        'soundsync.dialogue-qa.bridge',
        'soundsync-dialogue-protection-qa-v1'),
      finalMixRereadVerified: true,
      voiceClarityPassed: true,
      noCueMasksDialogue: true,
    },
    evidenceMode: 'authenticated_private_runtime',
    exactCanonicalScopeReread: true,
    exactMotionAndTimingLineageVerified: true,
    actualSoundRuntimeObserved: true,
    actualAudioAssetReread: true,
    actualDialogueProtectedFinalMixQaCompleted: true,
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
    resultDigestSha256: calculateSkillContractDigest(
      { ...base, resultDigestSha256: '' }, 'resultDigestSha256'),
  }, soundBundle, soundContext)
}

function callRef(value: {
  callId: string
  schemaVersion: string
  callDigestSha256: string
}) {
  return {
    id: value.callId,
    version: value.schemaVersion,
    contentHash: value.callDigestSha256,
  }
}

function requestRef(value: {
  requestId: string
  schemaVersion: string
  requestDigestSha256: string
}) {
  return {
    id: value.requestId,
    version: value.schemaVersion,
    contentHash: value.requestDigestSha256,
  }
}

function memoryObjectPort(
  values: Map<string, Buffer>,
): CanonicalCreateOnlyJsonObjectPort {
  return {
    async createOnly(input) {
      assert.equal(createHash('sha256').update(input.body).digest('hex'),
        input.contentSha256)
      const prior = values.get(input.objectPath)
      if (prior) {
        if (!prior.equals(input.body)) throw new Error('create-only collision')
        return 'already_exists'
      }
      values.set(input.objectPath, Buffer.from(input.body))
      return 'created'
    },
    async readExact(path) {
      const value = values.get(path)
      return value ? Buffer.from(value) : null
    },
  }
}
