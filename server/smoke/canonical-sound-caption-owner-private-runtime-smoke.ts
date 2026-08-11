import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { basename, join, resolve } from 'node:path'

import type { CaptionDomainRef } from
  '../../src/types/caption-domain-contracts'
import type { CanonicalCreateOnlyJsonObjectPort } from
  '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createCaptionSoundSupportBundle,
  parseCaptionSoundSupportResult,
  type CaptionSoundContext,
} from '../captions-specialist/caption-sound-support'
import {
  StandaloneCanonicalSoundSkillService,
  StructuredRequestSoundContextLoader,
  type ApprovedSoundExecutionPackage,
} from '../edit-skills/sound'
import { canonicalSoundRequestSchema } from '../sound/sound-contracts'
import { validateSoundAudioFile } from
  '../sound/sound-local-audio-processor'
import { calculateSkillContractDigest } from
  '../orchestra/orchestra-skill-contracts'
import {
  createCanonicalSoundCaptionExecutionReadPort,
  createCanonicalSoundCaptionOwnerService,
} from '../services/canonical-sound-caption-owner-service'
import { createCanonicalPrivateLocalJsonObjectPort } from
  '../services/canonical-private-local-json-object-port'
import { createCanonicalSoundCaptionListeningReviewRepository } from
  '../services/canonical-sound-caption-listening-review-completion'
import {
  buildExecutableSoundRequest,
  createCanonicalSoundTestRuntime,
} from './canonical-sound-test-runtime'
import {
  CAP_11_APPROVAL_ENVELOPE_REF,
  CAP_11_SCENE_GRAPH_FIXTURE,
} from './captions-specialist-cap-11-smoke'
import {
  CAP_12_MOTION_LOCK_FIXTURE,
  CAP_12_MOTION_PLAN_FIXTURE,
  CAP_12_STORYTIMING_RESOLUTION_FIXTURE,
} from './captions-specialist-cap-12-smoke'

const inspectionRoot = process.env
  .REEDITPRO_CAPTION_SOUND_PRIVATE_INSPECTION_DIR
if (!inspectionRoot || !resolve(inspectionRoot).startsWith('/')) {
  throw new Error('A private absolute Caption Sound inspection directory is required.')
}

const context: CaptionSoundContext = {
  sceneGraph: CAP_11_SCENE_GRAPH_FIXTURE,
  motionPlan: CAP_12_MOTION_PLAN_FIXTURE,
  motionLock: CAP_12_MOTION_LOCK_FIXTURE,
  storyTimingResolution: CAP_12_STORYTIMING_RESOLUTION_FIXTURE,
  approvedCaptionEnvelopeRef: CAP_11_APPROVAL_ENVELOPE_REF,
}
const bundle = createCaptionSoundSupportBundle({
  requestId: 'caption.sound.private-runtime.v1',
  idempotencyKey: 'caption.sound.private-runtime.idempotency.v1',
  originalCallRef: ref(
    'caption.sound.private-runtime.call', 'orchestra-skill-call-v1'),
  context,
  dialogueTrackRef: ref(
    'caption.sound.private-runtime.dialogue', 'canonical-dialogue-track-v1'),
  dialogueActivityRef: ref(
    'caption.sound.private-runtime.activity',
    'canonical-dialogue-activity-v1'),
  maximumRequestedCueCount: 4,
})
const captionRequest = bundle.payload
assert.ok(captionRequest.canonicalScope.approvedSnapshotRef)
assert.ok(captionRequest.canonicalScope.sceneId)
const requestedIntents = captionRequest.cueIntents.filter((intent) =>
  intent.decision === 'request_cue'
  && intent.eligibility !== 'sound_forbidden')
assert.ok(requestedIntents.length > 0)

const runtime = await createCanonicalSoundTestRuntime(
  { numerator: 30, denominator: 1 }, 12)
try {
  const ranges = captionRequest.canonicalScope.authorizedFrameRanges.map(
    (range, index) => ({
      rangeId: `caption-private-range-${index + 1}`,
      startFrame: range.startFrame,
      endFrameExclusive: range.endFrameExclusive,
    }))
  const rawRequest = buildExecutableSoundRequest({
    runtime,
    job: 'support_motion_design_sound',
    mode: 'private_internal',
    audioArtifacts: [runtime.secondAudioArtifact, runtime.audioArtifact],
  })
  const callerManifestHash = sha('captions-private-runtime-manifest-v1')
  rawRequest.requestId = 'canonical.sound.caption.private-runtime.v1'
  rawRequest.idempotencyKey = captionRequest.idempotencyKey
  rawRequest.attemptId = 'canonical.sound.caption.private-runtime.attempt.v1'
  rawRequest.callerType = 'typed_peer_skill'
  rawRequest.callerSkillKey = 'captions'
  rawRequest.callerManifestHash = callerManifestHash
  delete rawRequest.orchestraRunId
  rawRequest.peerAuthority = {
    parentWorkItemId: 'caption.sound.private-runtime.parent-work.v1',
    parentAuthorityHash: rawRequest.assignmentScope.parentAuthorityHash,
    callerOwnedAudioRanges: ranges,
    callerOwnedVisualRanges: [],
    ancestorSkillKeys: ['captions'],
    callerManifestHash,
  }
  rawRequest.dependencyChain = ['captions']
  rawRequest.assignmentScope.assignmentMode = 'range'
  rawRequest.assignmentScope.sceneIds = [
    captionRequest.canonicalScope.sceneId,
  ]
  rawRequest.assignmentScope.authorizedAudioWriteRanges = ranges
  rawRequest.assignmentScope.inspectRanges = ranges
  rawRequest.operationDirectives = [{
    directiveId: 'caption-sound-private-dialogue-binding-v1',
    operation: 'design',
    targetRangeId: ranges[0]!.rangeId,
    parameters: {
      dialogueSourceArtifactId: runtime.secondAudioArtifact.artifactId,
      sourceGainDb: {
        [runtime.secondAudioArtifact.artifactId]: 0,
      },
    },
  }]
  rawRequest.assignmentScope.sourceTimelineHash =
    captionRequest.masterTimingRef.contentHash
  rawRequest.timelineManifestHash = captionRequest.masterTimingRef.contentHash
  rawRequest.timelineManifestRef = {
    ...rawRequest.timelineManifestRef,
    checksumSha256: captionRequest.masterTimingRef.contentHash,
  }
  rawRequest.visualDependencies = rawRequest.visualDependencies.map(
    (dependency) => ({
      ...dependency,
      timingManifestHash: captionRequest.masterTimingRef.contentHash,
    }))
  rawRequest.assignmentScope.sourceArtifactVersions =
    rawRequest.assignmentScope.sourceArtifactVersions.map((artifact) =>
      artifact.artifactId === rawRequest.timelineManifestRef.artifactId
        ? {
            ...artifact,
            checksumSha256: captionRequest.masterTimingRef.contentHash,
          }
        : artifact)
  rawRequest.executionAuthority.approvedPlanSnapshotId =
    captionRequest.canonicalScope.approvedSnapshotRef.id
  rawRequest.executionAuthority.approvedPlanSnapshotHash =
    captionRequest.canonicalScope.approvedSnapshotRef.contentHash
  rawRequest.eventAnchors = requestedIntents.map((intent, index) => ({
    ...rawRequest.eventAnchors[0]!,
    anchorId: intent.storyTimingEventRef.id,
    frame: 30 + index * 75,
    endFrameExclusive: 42 + index * 75,
    sceneId: captionRequest.canonicalScope.sceneId!,
  }))
  const canonicalRequest = canonicalSoundRequestSchema.parse(rawRequest)
  const baseContext = new StructuredRequestSoundContextLoader()
  const sound = new StandaloneCanonicalSoundSkillService({
    artifacts: runtime.resolver,
    context: {
      async load(request) {
        const loaded = await baseContext.load(request)
        return {
          ...loaded,
          controllerContext: {
            sourceMatches: request.eventAnchors.map((anchor) => ({
              anchorId: anchor.anchorId,
              artifact: runtime.audioArtifact,
              usable: true,
              requiresRepair: false,
            })),
            protectedSpeechRanges: [{
              rangeId: 'caption-private-dialogue-window-1',
              startFrame: 20,
              endFrameExclusive: 50,
            }],
          },
        }
      },
    },
  })
  const plan = await sound.plan(canonicalRequest)
  const executionPackage: ApprovedSoundExecutionPackage = {
    schemaVersion: 'approved-sound-execution-package-v1',
    packageId: 'caption-sound-private-runtime-package-v1',
    approvedWorkItemId: 'caption-sound-private-runtime-work-v1',
    request: plan.request,
    plannedResult: plan.controller.result,
    selectedRoute: plan.selectedRoute,
    executionGraph: plan.executionGraph,
    selectedOptionalStepKeys: [],
    continuitySceneEvidence: plan.continuity.sceneEvidence,
  }
  const soundResult = await sound.execute(executionPackage)
  assert.equal(soundResult.status, 'completed', JSON.stringify({
    units: soundResult.executionUnits,
    unresolved: soundResult.unresolvedDependencies,
    qa: soundResult.qaReport,
  }))
  assert.equal(soundResult.qualificationStatusUsed, 'planning_qualified')
  assert.ok(soundResult.executionUnits?.every((unit) =>
    unit.status === 'completed'))
  assert.ok(soundResult.synchronizationPlacements?.length
    === requestedIntents.length)
  assert.ok(soundResult.privateSoundStemArtifacts.length > 0)
  assert.ok(soundResult.finalCompositionHandoff)
  assert.equal(soundResult.finalCompositionHandoff.intentionalNoSound, false)
  assert.ok(soundResult.finalCompositionHandoff
    .finalSoundArtifactReferences.length > 0)

  await mkdir(resolve(inspectionRoot), { recursive: true, mode: 0o700 })
  const finalArtifacts = soundResult.finalCompositionHandoff
    .finalSoundArtifactReferences
  for (const artifact of finalArtifacts) {
    const resolvedArtifact = await runtime.resolver.resolve(artifact)
    const bytes = await readFile(resolvedArtifact.absolutePath)
    assert.equal(sha(bytes), artifact.checksumSha256)
    const metadata = await validateSoundAudioFile(resolvedArtifact.absolutePath)
    assert.equal(metadata.sampleRate, 48_000)
    assert.equal(metadata.channels, 2)
    await copyFile(resolvedArtifact.absolutePath,
      join(resolve(inspectionRoot),
        `${artifact.checksumSha256}-${basename(resolvedArtifact.absolutePath)}`))
  }
  const evidence = {
    schemaVersion: 'caption-sound-private-runtime-inspection-package-v1',
    captionRequest,
    supportRequest: bundle.supportRequest,
    canonicalSoundRequest: canonicalRequest,
    canonicalSoundResult: soundResult,
    finalArtifactHashes: finalArtifacts.map((artifact) =>
      artifact.checksumSha256),
    actualMediaRuntimeExecuted: true,
    directListeningReviewCompleted: false,
    terminalQualificationClaimed: false,
  }
  await writeFile(join(resolve(inspectionRoot), 'inspection-package.json'),
    JSON.stringify(evidence, null, 2), { encoding: 'utf8', mode: 0o600 })

  const inspectedHash = process.env
    .REEDITPRO_CAPTION_SOUND_INSPECTED_ARTIFACT_SHA256
  const listeningReviewRoot = process.env
    .REEDITPRO_CAPTION_SOUND_LISTENING_REVIEW_ROOT
  if (!inspectedHash || !listeningReviewRoot) {
    console.log(JSON.stringify({
      smoke: 'canonical_sound_caption_owner_private_runtime',
      status: 'needs_direct_listening_review',
      actualMediaRuntimeExecuted: true,
      finalArtifactHashes: evidence.finalArtifactHashes,
      synchronizedCueCount: soundResult.synchronizationPlacements?.length ?? 0,
      parentCapabilityPromoted: false,
      childRoutesIndependentlyQualified: true,
      inspectedArtifactHashProvided: Boolean(inspectedHash),
      createOnlyListeningReviewProvided: Boolean(listeningReviewRoot),
      captionRuntimeAuthority: false,
      publicDeliveryAuthority: false,
      productionAuthority: false,
    }, null, 2))
  } else {
    assert.deepEqual(evidence.finalArtifactHashes, [inspectedHash])
    const resolvedListeningReviewRoot = resolve(listeningReviewRoot)
    assert.equal(resolvedListeningReviewRoot === process.cwd()
      || resolvedListeningReviewRoot.startsWith(`${process.cwd()}/`), false,
    'The Sound listening review repository must remain outside the repo.')
    const canonicalRequestRef = ref(
      canonicalRequest.requestId,
      canonicalRequest.schemaVersion,
      contractDigest(canonicalRequest),
    )
    const canonicalResultRef = ref(
      `sound.result.${soundResult.requestId}`,
      soundResult.schemaVersion,
      contractDigest(soundResult),
    )
    const captionRequestRef = ref(
      captionRequest.requestId,
      captionRequest.schemaVersion,
      captionRequest.requestDigestSha256,
    )
    const listeningReviewRepository =
      createCanonicalSoundCaptionListeningReviewRepository({
        objectPort: createCanonicalPrivateLocalJsonObjectPort({
          localStorageRoot: resolvedListeningReviewRoot,
        }),
        prefix: 'canonical-sound-caption-listening-review',
      })
    const persistedReview = await listeningReviewRepository.rereadExact({
      captionSoundRequestRef: captionRequestRef,
      canonicalSoundRequestRef: canonicalRequestRef,
      canonicalSoundResultRef: canonicalResultRef,
    })
    assert.ok(persistedReview,
      'The exact create-only Sound listening review is not persisted.')
    const objectPort = memoryObjectPort(new Map())
    const owner = createCanonicalSoundCaptionOwnerService({
      objectPort,
      executionReadPort: createCanonicalSoundCaptionExecutionReadPort(
        async () => ({
          request: JSON.parse(JSON.stringify(canonicalRequest)) as unknown,
          result: JSON.parse(JSON.stringify(soundResult)) as unknown,
        })),
      listeningReviewReadPort:
        listeningReviewRepository.listeningReviewReadPort,
      artifactResolver: runtime.resolver,
      prefix: 'private/smoke/caption-sound-private-runtime',
    })
    const ownerResult = await owner.readExact({
      supportRequest: bundle.supportRequest,
      captionSoundRequest: captionRequest,
    })
    const parsed = parseCaptionSoundSupportResult(ownerResult, bundle, context)
    assert.equal(parsed.evidenceMode, 'authenticated_private_runtime')
    assert.ok(parsed.cueResults.some((cue) => cue.disposition === 'admitted'))
    assert.ok(parsed.cueResults.filter((cue) =>
      cue.disposition === 'admitted').every((cue) =>
      cue.selectedSoundAssetRef && cue.trimAndAlignmentRef
      && cue.mixPlanRef && cue.dialogueProtectionRef))
    assert.equal(parsed.runtimeAuthorityGrantedToCaption, false)
    assert.equal(parsed.assetAuthorityGrantedToCaption, false)
    assert.equal(parsed.mixAuthorityGrantedToCaption, false)
    assert.equal(parsed.finalQaApprovalGrantedToCaption, false)
    assert.equal(parsed.publicDeliveryGranted, false)
    assert.equal(parsed.productionAuthorityGranted, false)
    console.log(JSON.stringify({
      smoke: 'canonical_sound_caption_owner_private_runtime',
      status: 'passed',
      actualMediaRuntimeExecuted: true,
      actualAudioPlaybackCompleted: true,
      listeningReviewRecordDigestSha256:
        persistedReview.recordDigestSha256,
      finalArtifactHashes: evidence.finalArtifactHashes,
      synchronizedCueCount: soundResult.synchronizationPlacements?.length ?? 0,
      admittedCaptionCueCount: parsed.cueResults.filter((cue) =>
        cue.disposition === 'admitted').length,
      parentCapabilityPromoted: false,
      childRoutesIndependentlyQualified: true,
      captionRuntimeAuthority: false,
      publicDeliveryAuthority: false,
      productionAuthority: false,
    }, null, 2))
  }
} finally {
  await runtime.cleanup()
}

function ref(
  id: string,
  version: string,
  contentHash = sha(`${id}:${version}`),
): CaptionDomainRef {
  return { id, version, contentHash }
}

function sha(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function contractDigest(value: unknown): string {
  return calculateSkillContractDigest({
    value: JSON.parse(JSON.stringify(value)) as unknown,
    digest: '',
  }, 'digest')
}

function memoryObjectPort(values: Map<string, Buffer>):
CanonicalCreateOnlyJsonObjectPort {
  return {
    async createOnly(input) {
      assert.equal(sha(input.body), input.contentSha256)
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
