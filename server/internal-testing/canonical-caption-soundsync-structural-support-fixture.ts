import { createHash } from 'node:crypto'

import {
  CAPTION_SOUND_SUPPORT_RESULT_VERSION,
  type CaptionSoundSupportResult,
} from '../../src/types/caption-sound-support'
import type { CaptionDomainRef } from
  '../../src/types/caption-domain-contracts'
import type { OrchestraSkillCall, SkillContractRef } from
  '../../src/types/orchestra-skill-contracts'
import type { ServiceContext } from '../types'
import {
  parseCaptionSoundContext,
  parseCaptionSoundSupportResult,
  type CaptionSoundContext,
} from '../captions-specialist/caption-sound-support'
import { parseCaptionMultiTrackSceneGraph } from
  '../captions-specialist/caption-multi-track-scene-graph'
import { calculateSkillContractDigest } from
  '../orchestra/orchestra-skill-contracts'
import {
  createCanonicalCaptionSoundSupportInputReadPort,
} from '../services/canonical-caption-sound-support-input-service'
import {
  createCanonicalCaptionSoundSyncContextReadPort,
  createCanonicalCaptionSoundSyncEvidenceRepository,
  createCanonicalCaptionSoundSyncOwnerReadPort,
  createCanonicalCaptionSoundSyncSupportService,
} from '../services/canonical-caption-soundsync-support-service'
import { createCanonicalPrivateLocalJsonObjectPort } from
  '../services/canonical-private-local-json-object-port'
import {
  createCanonicalSpecialistSupportResumeRepository,
} from '../services/canonical-specialist-support-resume-service'
import type {
  CanonicalCaptionSupportResumeRequirement,
} from './canonical-caption-broll-approved-execution-harness'
import { CAP_11_SCENE_GRAPH_FIXTURE } from
  '../smoke/captions-specialist-cap-11-smoke'
import {
  CAP_12_MOTION_LOCK_FIXTURE,
  CAP_12_MOTION_PLAN_FIXTURE,
  CAP_12_STORYTIMING_RESOLUTION_FIXTURE,
} from '../smoke/captions-specialist-cap-12-smoke'

export const CANONICAL_CAPTION_SOUNDSYNC_STRUCTURAL_SUPPORT_FIXTURE_VERSION =
  'canonical-caption-soundsync-structural-support-fixture-v1' as const

export function createCanonicalCaptionSoundSyncStructuralSupportFixture(
  input: { readonly context: ServiceContext },
) {
  const contexts = new Map<string, CaptionSoundContext>()
  const objectPort = createCanonicalPrivateLocalJsonObjectPort({
    localStorageRoot: input.context.env.localStorageRoot,
  })
  const evidenceRepository =
    createCanonicalCaptionSoundSyncEvidenceRepository({ objectPort })
  const inputReadPort = createCanonicalCaptionSoundSupportInputReadPort(
    async (request) => {
      const exact = createCanonicalCaptionSoundSyncStructuralContext({
        call: request.call,
        pictureLockRef: request.pictureLockRef,
        finishReadinessRef: request.finishReadinessRef,
      })
      contexts.set(request.call.callDigestSha256, exact)
      return {
        canonicalContext: structuredClone(exact),
        dialogueTrackRef: ref(
          `caption.sound.dialogue.${request.call.callDigestSha256.slice(0, 24)}`,
          'canonical-dialogue-track-v1'),
        dialogueActivityRef: ref(
          `caption.sound.activity.${request.call.callDigestSha256.slice(0, 24)}`,
          'canonical-dialogue-activity-v1'),
        maximumRequestedCueCount: 2,
      }
    })

  return Object.freeze({
    inputReadPort,
    evidenceRepository,
    async inject(requirement: CanonicalCaptionSupportResumeRequirement) {
      if (requirement.supportRequestRefs.length !== 1
        || requirement.supportRequestRefs[0]?.targetSkillKey !== 'soundsync') {
        throw new Error(
          'Structural Caption Sound fixture accepts one SoundSync request.',
        )
      }
      if (input.context.auth?.userId !== requirement.ownerUserId) {
        throw new Error(
          'Structural Caption Sound fixture rejected crossed actor authority.',
        )
      }
      const supportRepository =
        createCanonicalSpecialistSupportResumeRepository({
          objectPort,
          prefix: [
            'private-internal/captions-specialist/v1',
            requirement.ownerUserId,
            requirement.workspaceId,
          ].join('/'),
        })
      const pair = await supportRepository.rereadCallResultPair({
        callRef: requirement.originalCallRef,
      })
      const selected = requirement.supportRequestRefs[0]
      if (!pair
        || pair.call.canonicalScope.ownerUserId !== requirement.ownerUserId
        || pair.call.canonicalScope.workspaceId !== requirement.workspaceId) {
        throw new Error(
          'Structural Caption Sound fixture could not reread the exact call.',
        )
      }
      const supportRequest = pair.result.supportRequests.find((candidate) =>
        candidate.requestId === selected.id
        && candidate.schemaVersion === selected.version
        && candidate.requestDigestSha256 === selected.contentHash)
      const context = contexts.get(pair.call.callDigestSha256)
      if (!supportRequest || !context) {
        throw new Error(
          'Structural Caption Sound fixture lacks its exact request context.',
        )
      }
      const service = createCanonicalCaptionSoundSyncSupportService({
        supportResumeRepository: supportRepository,
        evidenceRepository,
        contextReadPort: createCanonicalCaptionSoundSyncContextReadPort(
          async () => structuredClone(context)),
        ownerReadPort: createCanonicalCaptionSoundSyncOwnerReadPort(
          async ({ supportRequest: request, captionSoundRequest }) =>
            structuralOwnerResult({
              supportRequest: request,
              captionSoundRequest,
              context,
            })),
      })
      const record = await service.projectAuthenticatedEvidence({
        authenticatedOwnerUserId: pair.call.canonicalScope.ownerUserId,
        priorCallRef: requirement.originalCallRef,
        selectedSupportRequestRef: {
          id: selected.id,
          version: selected.version,
          contentHash: selected.contentHash,
        },
      })
      input.context.canonicalCaptionSoundSyncEvidenceRepository =
        evidenceRepository
      return Object.freeze({
        schemaVersion:
          CANONICAL_CAPTION_SOUNDSYNC_STRUCTURAL_SUPPORT_FIXTURE_VERSION,
        evidenceRecordRef: Object.freeze({
          id: record.recordId,
          version: record.schemaVersion,
          contentHash: record.recordDigestSha256,
        }),
        resumeOwnedByCanonicalCaptionExecution: true as const,
        structuralFixtureOnly: true as const,
        actualSoundRuntimeExecutedByFixture: false as const,
        actualAudioQualificationEvidence: false as const,
        privateQualificationEvidence: false as const,
        finalQaEvidence: false as const,
        publicOrProductionAuthorityGranted: false as const,
      })
    },
  })
}

export function createCanonicalCaptionSoundSyncStructuralContext(input: {
  call: OrchestraSkillCall
  pictureLockRef: CaptionDomainRef
  finishReadinessRef: CaptionDomainRef
}): CaptionSoundContext {
  const call = input.call
  const snapshot = call.canonicalScope.approvedSnapshotRef
  if (!snapshot || !call.canonicalScope.outputId
    || !call.canonicalScope.sceneId
    || call.canonicalScope.authorizedFrameRanges.length !== 1) {
    throw new Error('Structural Sound context requires exact scene authority.')
  }
  const confirmedFrameRef = requiredArtifactRef(
    call, 'confirmed_output_frame')
  const masterTimingRef = requiredArtifactRef(
    call, 'master_timing_or_planning_timing')
  const scope = {
    ownerUserId: call.canonicalScope.ownerUserId,
    workspaceId: call.canonicalScope.workspaceId,
    projectId: call.canonicalScope.projectId,
    editSessionId: call.canonicalScope.editSessionId,
    planVersionId: `plan.${snapshot.id}`,
    approvedSnapshotRef: structuredClone(snapshot),
    outputId: call.canonicalScope.outputId,
    sceneId: call.canonicalScope.sceneId,
    authorizedFrameRanges:
      structuredClone(call.canonicalScope.authorizedFrameRanges),
  }
  const targetRange = scope.authorizedFrameRanges[0]
  const sourceRange = { startFrame: 0, endFrameExclusive: 360 }
  const graphCandidate = structuredClone(CAP_11_SCENE_GRAPH_FIXTURE)
  graphCandidate.graphId =
    `caption.sound.graph.${call.callDigestSha256.slice(0, 24)}`
  graphCandidate.canonicalScope = structuredClone(scope)
  graphCandidate.confirmedOutputFrameRef = confirmedFrameRef
  graphCandidate.pictureLockRef = structuredClone(input.pictureLockRef)
  graphCandidate.finishReadinessRef = structuredClone(input.finishReadinessRef)
  graphCandidate.graphDigestSha256 = calculateSkillContractDigest(
    { ...graphCandidate, graphDigestSha256: '' },
    'graphDigestSha256')
  const sceneGraph = parseCaptionMultiTrackSceneGraph(graphCandidate)
  const sceneGraphRef = ref(
    sceneGraph.graphId,
    sceneGraph.schemaVersion,
    sceneGraph.graphDigestSha256)

  const resolution = structuredClone(
    CAP_12_STORYTIMING_RESOLUTION_FIXTURE)
  resolution.resolutionId =
    `caption.sound.resolution.${call.callDigestSha256.slice(0, 24)}`
  resolution.canonicalScope = structuredClone(scope)
  resolution.sceneGraphRef = sceneGraphRef
  resolution.confirmedOutputFrameRef = confirmedFrameRef
  resolution.masterTimingRef = masterTimingRef
  resolution.nodeResolutions = resolution.nodeResolutions.map((node) => ({
    ...node,
    cueRange: remapRange(node.cueRange, sourceRange, targetRange),
    semanticEventRefs: node.semanticEventRefs.map((event) => ({
      ...event,
      frame: remapFrame(event.frame, sourceRange, targetRange),
    })),
    stableReadRange:
      remapRange(node.stableReadRange, sourceRange, targetRange),
  }))
  resolution.phaseResolutions = resolution.phaseResolutions.map((phase) => ({
    ...phase,
    frameRange: remapRange(phase.frameRange, sourceRange, targetRange),
  }))
  resolution.resolutionDigestSha256 = calculateSkillContractDigest(
    { ...resolution, resolutionDigestSha256: '' },
    'resolutionDigestSha256')
  const resolutionRef = ref(
    resolution.resolutionId,
    resolution.schemaVersion,
    resolution.resolutionDigestSha256)

  const motionPlan = structuredClone(CAP_12_MOTION_PLAN_FIXTURE)
  motionPlan.planId =
    `caption.sound.motion.${call.callDigestSha256.slice(0, 24)}`
  motionPlan.canonicalScope = structuredClone(scope)
  motionPlan.sceneGraphRef = sceneGraphRef
  motionPlan.storyTimingResolutionRef = resolutionRef
  motionPlan.confirmedOutputFrameRef = confirmedFrameRef
  motionPlan.primitives = motionPlan.primitives.map((primitive) => ({
    ...primitive,
    frameRange: remapRange(
      primitive.frameRange, sourceRange, targetRange),
    reducedMotionReplacement: {
      ...primitive.reducedMotionReplacement,
      frameRange: remapRange(
        primitive.reducedMotionReplacement.frameRange,
        sourceRange,
        targetRange),
    },
  }))
  motionPlan.cameraRequests = motionPlan.cameraRequests.map((request) => ({
    ...request,
    requestedFrameRange: remapRange(
      request.requestedFrameRange, sourceRange, targetRange),
  }))
  motionPlan.planDigestSha256 = calculateSkillContractDigest(
    { ...motionPlan, planDigestSha256: '' }, 'planDigestSha256')
  const motionPlanRef = ref(
    motionPlan.planId,
    motionPlan.schemaVersion,
    motionPlan.planDigestSha256)

  const motionLock = structuredClone(CAP_12_MOTION_LOCK_FIXTURE)
  motionLock.lockId =
    `caption.sound.lock.${call.callDigestSha256.slice(0, 24)}`
  motionLock.canonicalScope = structuredClone(scope)
  motionLock.sceneGraphRef = sceneGraphRef
  motionLock.motionPlanRef = motionPlanRef
  motionLock.storyTimingResolutionRef = resolutionRef
  motionLock.lockDigestSha256 = calculateSkillContractDigest(
    { ...motionLock, lockDigestSha256: '' }, 'lockDigestSha256')

  return parseCaptionSoundContext({
    sceneGraph,
    motionPlan,
    motionLock,
    storyTimingResolution: resolution,
    approvedCaptionEnvelopeRef:
      structuredClone(sceneGraph.approvalEnvelopeRef),
  })
}

function remapFrame(
  frame: number,
  source: { readonly startFrame: number; readonly endFrameExclusive: number },
  target: { readonly startFrame: number; readonly endFrameExclusive: number },
): number {
  const sourceFrames = source.endFrameExclusive - source.startFrame
  const targetFrames = target.endFrameExclusive - target.startFrame
  if (sourceFrames <= 0 || targetFrames <= 0) {
    throw new Error('Structural Sound fixture received an empty frame range.')
  }
  const relative = Math.max(0, Math.min(sourceFrames - 1,
    frame - source.startFrame))
  return Math.min(target.endFrameExclusive - 1,
    target.startFrame + Math.floor(relative * targetFrames / sourceFrames))
}

function remapRange(
  range: { readonly startFrame: number; readonly endFrameExclusive: number },
  source: { readonly startFrame: number; readonly endFrameExclusive: number },
  target: { readonly startFrame: number; readonly endFrameExclusive: number },
): { startFrame: number; endFrameExclusive: number } {
  const sourceFrames = source.endFrameExclusive - source.startFrame
  const targetFrames = target.endFrameExclusive - target.startFrame
  if (sourceFrames <= 0 || targetFrames <= 0) {
    throw new Error('Structural Sound fixture received an empty frame range.')
  }
  const relativeStart = Math.max(0, Math.min(sourceFrames,
    range.startFrame - source.startFrame))
  const relativeEnd = Math.max(relativeStart + 1, Math.min(sourceFrames,
    range.endFrameExclusive - source.startFrame))
  const startFrame = Math.min(target.endFrameExclusive - 1,
    target.startFrame
      + Math.floor(relativeStart * targetFrames / sourceFrames))
  const endFrameExclusive = Math.min(target.endFrameExclusive,
    Math.max(startFrame + 1, target.startFrame
      + Math.ceil(relativeEnd * targetFrames / sourceFrames)))
  return { startFrame, endFrameExclusive }
}

function structuralOwnerResult(input: {
  supportRequest: Parameters<typeof parseCaptionSoundSupportResult>[1][
    'supportRequest'
  ]
  captionSoundRequest: Parameters<typeof parseCaptionSoundSupportResult>[1][
    'payload'
  ]
  context: CaptionSoundContext
}): CaptionSoundSupportResult {
  const payload = input.captionSoundRequest
  const supportRequestRef: SkillContractRef = {
    id: input.supportRequest.requestId,
    version: input.supportRequest.schemaVersion,
    contentHash: input.supportRequest.requestDigestSha256,
  }
  const seed = payload.requestDigestSha256.slice(0, 24)
  const base: Omit<CaptionSoundSupportResult, 'resultDigestSha256'> = {
    schemaVersion: CAPTION_SOUND_SUPPORT_RESULT_VERSION,
    resultId: `caption.sound.structural.result.${seed}`,
    supportRequestRef,
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
          ? 'structural_fixture_cue_admitted'
          : 'structural_fixture_silence_preserved',
        storyTimingEventRef: structuredClone(intent.storyTimingEventRef),
        soundSyncCueRef: admitted
          ? ref(`caption.sound.cue.${seed}.${intent.cueIntentId}`,
            'soundsync-cue-v1') : null,
        selectedSoundAssetRef: admitted
          ? ref(`caption.sound.asset.${seed}.${intent.cueIntentId}`,
            'sound-asset-v1') : null,
        trimAndAlignmentRef: admitted
          ? ref(`caption.sound.trim.${seed}.${intent.cueIntentId}`,
            'soundsync-trim-alignment-v1') : null,
        mixPlanRef: admitted
          ? ref(`caption.sound.mix.${seed}.${intent.cueIntentId}`,
            'soundsync-mix-plan-v1') : null,
        dialogueProtectionRef: admitted
          ? ref(`caption.sound.dialogue.${seed}.${intent.cueIntentId}`,
            'soundsync-dialogue-protection-v1') : null,
      }
    }),
    dialogueProtectedFinalMix: {
      dependencyRef: ref(`caption.sound.final-mix-dependency.${seed}`,
        'soundsync-dialogue-protected-final-mix-dependency-v1'),
      finalMixRef: ref(`caption.sound.final-mix.${seed}`,
        'soundsync-final-mix-v1'),
      dialogueProtectionQaRef: ref(`caption.sound.dialogue-qa.${seed}`,
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
      { ...base, resultDigestSha256: '' } as unknown as Record<string, unknown>,
      'resultDigestSha256'),
  }, { payload, supportRequest: input.supportRequest }, input.context)
}

function requiredArtifactRef(
  call: OrchestraSkillCall,
  artifactType: string,
): CaptionDomainRef {
  const matches = call.inputArtifactRefs.filter((artifact) =>
    artifact.artifactType === artifactType)
  if (matches.length !== 1) {
    throw new Error(`Structural Sound context lacks one ${artifactType}.`)
  }
  const value = matches[0]!
  return { id: value.id, version: value.version, contentHash: value.contentHash }
}

function ref(
  id: string,
  version: string,
  contentHash = createHash('sha256').update(id, 'utf8').digest('hex'),
): CaptionDomainRef {
  return { id, version, contentHash }
}
