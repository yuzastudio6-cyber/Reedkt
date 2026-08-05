import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { z } from 'zod'

import type {
  CaptionSoundCueRequest,
  CaptionSoundSupportResult,
} from '../../src/types/caption-sound-support'
import type {
  CanonicalCaptionSoundSyncOwnerReadPort,
} from '../../src/types/canonical-caption-soundsync-support'
import type {
  CaptionDomainRef,
} from '../../src/types/caption-domain-contracts'
import type {
  SkillContractRef,
  SkillSupportRequest,
} from '../../src/types/orchestra-skill-contracts'
import { assertClosedContractTree } from
  '../../src/lib/closed-contract-validation'
import type {
  CanonicalSoundArtifactResolver,
} from '../edit-skills/sound/sound-route-executor'
import {
  canonicalSoundRequestSchema,
  canonicalSoundResultSchema,
  type CanonicalSoundRequest,
  type CanonicalSoundResult,
  type SoundArtifactRef,
} from '../sound/sound-contracts'
import { hashSkillValue } from
  '../edit-skills/core/skill-capability-manifest-hash'
import {
  calculateSkillContractDigest,
  parseSkillSupportRequest,
} from '../orchestra/orchestra-skill-contracts'
import {
  createCanonicalCaptionSoundSyncOwnerReadPort,
} from './canonical-caption-soundsync-support-service'
import type { CanonicalCreateOnlyJsonObjectPort } from
  './canonical-gcs-source-analysis-lifecycle-store'

export const CANONICAL_SOUND_CAPTION_OWNER_SERVICE_VERSION =
  'canonical-sound-caption-owner-service-v1' as const
export const CANONICAL_SOUND_CAPTION_EXECUTION_READ_PORT_VERSION =
  'canonical-sound-caption-execution-read-port-v1' as const
export const CANONICAL_SOUND_CAPTION_LISTENING_REVIEW_READ_PORT_VERSION =
  'canonical-sound-caption-listening-review-read-port-v1' as const
export const CANONICAL_SOUND_CAPTION_LISTENING_REVIEW_VERSION =
  'canonical-sound-caption-listening-review-v1' as const

const DEFAULT_PREFIX = 'private/edit-skills/sound/v1/caption-owner'
const MAX_RECORD_BYTES = 16 * 1024 * 1024
const identity = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const prefixSchema = z.string().trim().min(1).max(1_024)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u)
  .refine((value) =>
    !value.includes('..') && !value.includes('//') && !value.endsWith('/'))
const refSchema: z.ZodType<CaptionDomainRef> = z.object({
  id: identity,
  version: identity,
  contentHash: sha256,
}).strict()
const frameRangeSchema = z.object({
  startFrame: z.number().int().nonnegative(),
  endFrameExclusive: z.number().int().positive(),
}).strict().refine((range) => range.endFrameExclusive > range.startFrame)
const listeningReviewCoreSchema = z.object({
  schemaVersion: z.literal(CANONICAL_SOUND_CAPTION_LISTENING_REVIEW_VERSION),
  reviewId: identity,
  captionSoundRequestRef: refSchema,
  canonicalSoundRequestRef: refSchema,
  canonicalSoundResultRef: refSchema,
  finalMixArtifactRefs: z.array(refSchema).min(1).max(128),
  qaEvidenceHash: sha256,
  reviewedFrameRanges: z.array(frameRangeSchema).min(1).max(512),
  reviewedCueIds: z.array(identity).min(1).max(4_096),
  inspectionMode: z.literal('complete_time_private_audio_review'),
  reviewerClass: z.enum(['qualified_audio_ai', 'direct_private_human']),
  disposition: z.enum(['accepted', 'accepted_with_warnings']),
  actualAudioPlaybackCompleted: z.literal(true),
  everyRequestedRangeReviewed: z.literal(true),
  voiceClarityPassed: z.literal(true),
  noCueMasksDialogue: z.literal(true),
  sourceBytesIncluded: z.literal(false),
  mediaLocatorIncluded: z.literal(false),
  finalQaApprovalGranted: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  reviewedAt: timestamp,
}).strict()

export const canonicalSoundCaptionListeningReviewSchema =
  listeningReviewCoreSchema.extend({
    reviewDigestSha256: sha256,
  }).strict().superRefine((value, context) => {
    const { reviewDigestSha256, ...core } = value
    if (hashSkillValue(core) !== reviewDigestSha256) {
      context.addIssue({
        code: 'custom',
        message: 'Canonical Sound Caption listening review digest is stale.',
      })
    }
    if (new Set(value.reviewedCueIds).size !== value.reviewedCueIds.length) {
      context.addIssue({ code: 'custom', message: 'Reviewed Sound cues repeat.' })
    }
  })

export type CanonicalSoundCaptionListeningReview = z.infer<
  typeof canonicalSoundCaptionListeningReviewSchema
>

export function createCanonicalSoundCaptionListeningReview(
  input: z.input<typeof listeningReviewCoreSchema>,
): CanonicalSoundCaptionListeningReview {
  const core = listeningReviewCoreSchema.parse(input)
  return canonicalSoundCaptionListeningReviewSchema.parse({
    ...core,
    reviewDigestSha256: hashSkillValue(core),
  })
}

export interface CanonicalSoundCaptionExecutionReadPort {
  readonly schemaVersion:
    typeof CANONICAL_SOUND_CAPTION_EXECUTION_READ_PORT_VERSION
  readonly sourceAuthority: 'canonical_sound_execution_owner'
  readonly callerSuppliedExecutionAccepted: false
  readExact(input: {
    readonly supportRequestRef: SkillContractRef
    readonly captionSoundRequestRef: CaptionDomainRef
  }): Promise<{
    readonly request: unknown
    readonly result: unknown
  }>
}

export interface CanonicalSoundCaptionListeningReviewReadPort {
  readonly schemaVersion:
    typeof CANONICAL_SOUND_CAPTION_LISTENING_REVIEW_READ_PORT_VERSION
  readonly sourceAuthority: 'canonical_private_sound_listening_review_owner'
  readonly callerSuppliedReviewAccepted: false
  readExact(input: {
    readonly captionSoundRequestRef: CaptionDomainRef
    readonly canonicalSoundRequestRef: CaptionDomainRef
    readonly canonicalSoundResultRef: CaptionDomainRef
  }): Promise<unknown>
}

export interface CanonicalSoundCaptionOwnerService {
  readonly schemaVersion: typeof CANONICAL_SOUND_CAPTION_OWNER_SERVICE_VERSION
  readonly ownerReadPort: CanonicalCaptionSoundSyncOwnerReadPort
  readExact(input: {
    readonly supportRequest: SkillSupportRequest
    readonly captionSoundRequest: CaptionSoundCueRequest
  }): Promise<CaptionSoundSupportResult>
}

const admittedExecutionReaders = new WeakSet<object>()
const admittedListeningReaders = new WeakSet<object>()

export function createCanonicalSoundCaptionExecutionReadPort(
  readExact: CanonicalSoundCaptionExecutionReadPort['readExact'],
): CanonicalSoundCaptionExecutionReadPort {
  if (typeof readExact !== 'function') {
    throw new Error('Canonical Sound Caption execution reader is required.')
  }
  const port = Object.freeze({
    schemaVersion: CANONICAL_SOUND_CAPTION_EXECUTION_READ_PORT_VERSION,
    sourceAuthority: 'canonical_sound_execution_owner' as const,
    callerSuppliedExecutionAccepted: false as const,
    readExact: readExact.bind(undefined),
  })
  admittedExecutionReaders.add(port)
  return port
}

export function createCanonicalSoundCaptionListeningReviewReadPort(
  readExact: CanonicalSoundCaptionListeningReviewReadPort['readExact'],
): CanonicalSoundCaptionListeningReviewReadPort {
  if (typeof readExact !== 'function') {
    throw new Error('Canonical Sound Caption listening-review reader is required.')
  }
  const port = Object.freeze({
    schemaVersion: CANONICAL_SOUND_CAPTION_LISTENING_REVIEW_READ_PORT_VERSION,
    sourceAuthority: 'canonical_private_sound_listening_review_owner' as const,
    callerSuppliedReviewAccepted: false as const,
    readExact: readExact.bind(undefined),
  })
  admittedListeningReaders.add(port)
  return port
}

export function createCanonicalSoundCaptionOwnerService(input: {
  readonly objectPort: CanonicalCreateOnlyJsonObjectPort
  readonly executionReadPort: CanonicalSoundCaptionExecutionReadPort
  readonly listeningReviewReadPort:
    CanonicalSoundCaptionListeningReviewReadPort
  readonly artifactResolver: CanonicalSoundArtifactResolver
  readonly prefix?: string
}): CanonicalSoundCaptionOwnerService {
  assertDependencies(input)
  const prefix = prefixSchema.parse(input.prefix ?? DEFAULT_PREFIX)
  const read = async (readInput: {
    supportRequest: SkillSupportRequest
    captionSoundRequest: CaptionSoundCueRequest
  }): Promise<CaptionSoundSupportResult> => {
    assertClosedContractTree(readInput, 'Canonical Sound Caption owner read')
    const support = parseSkillSupportRequest(readInput.supportRequest)
    const captionRequest = parseCaptionRequestEnvelope(
      readInput.captionSoundRequest)
    assertSupportRequest(support, captionRequest)
    const supportRef = skillRef(
      support.requestId, support.schemaVersion, support.requestDigestSha256)
    const captionRef = domainRef(
      captionRequest.requestId,
      captionRequest.schemaVersion,
      captionRequest.requestDigestSha256,
    )
    const execution = await rereadExecution(
      input.executionReadPort, supportRef, captionRef)
    assertExecutionLineage(captionRequest, execution.request, execution.result)
    const handoff = execution.result.finalCompositionHandoff!
    await rereadFinalArtifacts(input.artifactResolver,
      handoff.finalSoundArtifactReferences)
    const soundRequestRef = domainRef(
      execution.request.requestId,
      execution.request.schemaVersion,
      contractDigest(execution.request),
    )
    const soundResultRef = domainRef(
      `sound.result.${execution.result.requestId}`,
      execution.result.schemaVersion,
      contractDigest(execution.result),
    )
    const review = await rereadListeningReview(
      input.listeningReviewReadPort,
      captionRef,
      soundRequestRef,
      soundResultRef,
    )
    assertListeningReview({
      review,
      captionRequest,
      soundRequestRef,
      soundResultRef,
      soundResult: execution.result,
    })
    const result = buildCaptionSoundResult({
      supportRef,
      captionRequest,
      soundResult: execution.result,
      review,
    })
    await persistJson(input.objectPort, resultPath(prefix, supportRef), result)
    const reread = await readJson(
      input.objectPort, resultPath(prefix, supportRef))
    if (!reread || hashSkillValue(reread) !== hashSkillValue(result)) {
      throw new Error('Canonical Sound Caption result persistence failed.')
    }
    return reread as CaptionSoundSupportResult
  }
  const ownerReadPort = createCanonicalCaptionSoundSyncOwnerReadPort(read)
  return Object.freeze({
    schemaVersion: CANONICAL_SOUND_CAPTION_OWNER_SERVICE_VERSION,
    ownerReadPort,
    readExact: read,
  })
}

function parseCaptionRequestEnvelope(
  value: CaptionSoundCueRequest,
): CaptionSoundCueRequest {
  assertClosedContractTree(value, 'Caption Sound request owner envelope')
  if (value.schemaVersion !== 'caption-sound-cue-request-v1'
    || calculateSkillContractDigest(
      value as unknown as Record<string, unknown>, 'requestDigestSha256')
      !== value.requestDigestSha256) {
    throw new Error('Caption Sound request digest is stale or forged.')
  }
  return structuredClone(value)
}

function assertSupportRequest(
  support: SkillSupportRequest,
  request: CaptionSoundCueRequest,
): void {
  if (support.targetSkillKey !== 'soundsync'
    || support.requestingSkillKey !== 'captions'
    || support.typedPayloadType !== request.schemaVersion
    || hashSkillValue(support.typedPayload) !== hashSkillValue(request)
    || support.mediationPolicy.hqMediated !== true
    || support.mediationPolicy.directPeerDispatchAllowed
    || support.authorityBoundary.scopeExpansionGranted
    || support.authorityBoundary.timelineMutationGranted
    || support.authorityBoundary.directPeerDispatchGranted
    || support.authorityBoundary.providerCallGranted
    || support.authorityBoundary.runtimeExecutionGranted
    || support.authorityBoundary.assetCreationGranted
    || support.authorityBoundary.costAuthorityGranted
    || support.authorityBoundary.billingAuthorityGranted
    || support.authorityBoundary.qaApprovalGranted
    || support.authorityBoundary.publicDeliveryGranted
    || support.authorityBoundary.productionAuthorityGranted) {
    throw new Error('SoundSync support request crossed its neutral boundary.')
  }
}

async function rereadExecution(
  port: CanonicalSoundCaptionExecutionReadPort,
  supportRequestRef: SkillContractRef,
  captionSoundRequestRef: CaptionDomainRef,
): Promise<{ request: CanonicalSoundRequest; result: CanonicalSoundResult }> {
  const request = { supportRequestRef, captionSoundRequestRef }
  const first = await port.readExact(structuredClone(request))
  const second = await port.readExact(structuredClone(request))
  assertClosedContractTree(first, 'Canonical Sound execution owner result')
  assertClosedContractTree(second, 'Canonical Sound execution owner result')
  const parsed = {
    request: canonicalSoundRequestSchema.parse(first.request),
    result: canonicalSoundResultSchema.parse(first.result),
  }
  const repeated = {
    request: canonicalSoundRequestSchema.parse(second.request),
    result: canonicalSoundResultSchema.parse(second.result),
  }
  if (contractDigest(parsed) !== contractDigest(repeated)) {
    throw new Error('Canonical Sound execution changed during exact reread.')
  }
  return parsed
}

function assertExecutionLineage(
  caption: CaptionSoundCueRequest,
  request: CanonicalSoundRequest,
  result: CanonicalSoundResult,
): void {
  const captionScope = caption.canonicalScope
  const soundRanges = request.assignmentScope.authorizedAudioWriteRanges
    .map((range) => ({
      startFrame: range.startFrame,
      endFrameExclusive: range.endFrameExclusive,
    }))
  if (request.callerType !== 'typed_peer_skill'
    || request.callerSkillKey !== 'captions'
    || ![
      'support_motion_design_sound',
      'support_transition_sound',
      'design_boundary_sound',
    ].includes(request.requestedJobType)
    || request.idempotencyKey !== caption.idempotencyKey
    || request.executionAuthority.approvalStatus !== 'approved'
    || !captionScope.approvedSnapshotRef
    || request.executionAuthority.approvedPlanSnapshotId
      !== captionScope.approvedSnapshotRef.id
    || request.executionAuthority.approvedPlanSnapshotHash
      !== captionScope.approvedSnapshotRef.contentHash
    || request.assignmentScope.sceneIds.length !== 1
    || request.assignmentScope.sceneIds[0] !== captionScope.sceneId
    || hashSkillValue(soundRanges)
      !== hashSkillValue(captionScope.authorizedFrameRanges)
    || request.timelineManifestHash !== caption.masterTimingRef.contentHash
    || result.requestId !== request.requestId
    || result.soundManifestHash !== request.soundManifestHash
    || result.sourceTimingHash !== request.timelineManifestHash
    || hashSkillValue(result.timelineRate) !== hashSkillValue(request.timelineRate)
    || result.status !== 'completed'
    || !['internal_execution_qualified', 'production_qualified']
      .includes(result.qualificationStatusUsed)
    || result.workerStatus !== 'completed'
    || result.artifactStatus !== 'private_ready'
    || result.qaStatus === 'failed'
    || !result.actualExecutionEvidence
    || result.actualExecutionEvidence.outputArtifactHashes.length === 0
    || !result.finalCompositionHandoff
    || result.finalCompositionHandoff.intentionalNoSound
    || result.finalCompositionHandoff.finalSoundArtifactReferences.length === 0
    || result.finalCompositionHandoff.timelineManifestHash
      !== caption.masterTimingRef.contentHash
    || result.finalCompositionHandoff.finalRenderOwnedBySound
    || caption.cueIntents.some((intent) =>
      intent.decision === 'request_cue'
      && intent.eligibility !== 'sound_forbidden'
      && !request.eventAnchors.some((event) =>
        event.anchorId === intent.storyTimingEventRef.id))) {
    throw new Error('Canonical Sound execution does not bind the Caption request.')
  }
  assertExecutionQa(result)
}

function assertExecutionQa(result: CanonicalSoundResult): void {
  const report = result.qaReport as Record<string, unknown>
  if (report.schemaVersion !== 'canonical-sound-execution-qa-v1'
    || report.evidenceHash !== result.finalCompositionHandoff?.qaEvidenceHash) {
    throw new Error('Canonical Sound execution QA lineage is invalid.')
  }
  const groups = [
    'planningQa', 'technicalOutputQa', 'synchronizationQa', 'mixQa',
    'continuityQa', 'provenanceQa', 'integrationQa',
  ]
  for (const group of groups) {
    const findings = report[group]
    if (!Array.isArray(findings) || findings.some((finding) =>
      !finding || typeof finding !== 'object'
      || !['pass', 'warning'].includes(String(
        (finding as Record<string, unknown>).disposition)))) {
      throw new Error(`Canonical Sound ${group} contains unresolved QA.`)
    }
  }
  const sync = report.synchronizationQa as Array<Record<string, unknown>>
  const mix = report.mixQa as Array<Record<string, unknown>>
  if (sync.some((finding) => finding.disposition !== 'pass')
    || !mix.some((finding) =>
      String(finding.key).startsWith('mix.measured_ducking.')
      && finding.disposition === 'pass')) {
    throw new Error('Canonical Sound lacks measured sync or dialogue ducking QA.')
  }
}

async function rereadFinalArtifacts(
  resolver: CanonicalSoundArtifactResolver,
  artifacts: readonly SoundArtifactRef[],
): Promise<void> {
  for (const artifact of artifacts) {
    const first = await resolver.resolve(structuredClone(artifact))
    const second = await resolver.resolve(structuredClone(artifact))
    if (hashSkillValue(first.artifact) !== hashSkillValue(artifact)
      || hashSkillValue(second.artifact) !== hashSkillValue(artifact)
      || resolve(first.absolutePath) !== resolve(second.absolutePath)
      || !resolve(first.absolutePath).startsWith(`${resolve(first.approvedRoot)}/`)
      || !resolve(second.absolutePath).startsWith(`${resolve(second.approvedRoot)}/`)) {
      throw new Error('Canonical Sound final artifact resolver crossed authority.')
    }
    const [firstBytes, secondBytes] = await Promise.all([
      readFile(first.absolutePath), readFile(second.absolutePath),
    ])
    const firstHash = createHash('sha256').update(firstBytes).digest('hex')
    const secondHash = createHash('sha256').update(secondBytes).digest('hex')
    if (firstHash !== artifact.checksumSha256
      || secondHash !== artifact.checksumSha256
      || !firstBytes.equals(secondBytes)) {
      throw new Error('Canonical Sound final artifact failed exact reread.')
    }
  }
}

async function rereadListeningReview(
  port: CanonicalSoundCaptionListeningReviewReadPort,
  captionSoundRequestRef: CaptionDomainRef,
  canonicalSoundRequestRef: CaptionDomainRef,
  canonicalSoundResultRef: CaptionDomainRef,
): Promise<CanonicalSoundCaptionListeningReview> {
  const request = {
    captionSoundRequestRef,
    canonicalSoundRequestRef,
    canonicalSoundResultRef,
  }
  const first = canonicalSoundCaptionListeningReviewSchema.parse(
    await port.readExact(structuredClone(request)))
  const second = canonicalSoundCaptionListeningReviewSchema.parse(
    await port.readExact(structuredClone(request)))
  if (hashSkillValue(first) !== hashSkillValue(second)) {
    throw new Error('Canonical Sound listening review changed during reread.')
  }
  return first
}

function assertListeningReview(input: {
  review: CanonicalSoundCaptionListeningReview
  captionRequest: CaptionSoundCueRequest
  soundRequestRef: CaptionDomainRef
  soundResultRef: CaptionDomainRef
  soundResult: CanonicalSoundResult
}): void {
  const handoff = input.soundResult.finalCompositionHandoff!
  const finalRefs = handoff.finalSoundArtifactReferences.map(soundArtifactRef)
  const requestedCueIds = input.soundResult.cueManifest.cues.map((cue) => cue.cueId)
  if (!sameRef(input.review.captionSoundRequestRef,
    domainRef(input.captionRequest.requestId, input.captionRequest.schemaVersion,
      input.captionRequest.requestDigestSha256))
    || !sameRef(input.review.canonicalSoundRequestRef, input.soundRequestRef)
    || !sameRef(input.review.canonicalSoundResultRef, input.soundResultRef)
    || hashSkillValue(input.review.finalMixArtifactRefs) !== hashSkillValue(finalRefs)
    || input.review.qaEvidenceHash !== handoff.qaEvidenceHash
    || hashSkillValue(input.review.reviewedFrameRanges)
      !== hashSkillValue(input.captionRequest.canonicalScope.authorizedFrameRanges)
    || requestedCueIds.some((cueId) => !input.review.reviewedCueIds.includes(cueId))) {
    throw new Error('Canonical Sound listening review does not bind execution.')
  }
}

function buildCaptionSoundResult(input: {
  supportRef: SkillContractRef
  captionRequest: CaptionSoundCueRequest
  soundResult: CanonicalSoundResult
  review: CanonicalSoundCaptionListeningReview
}): CaptionSoundSupportResult {
  const { captionRequest, soundResult, review } = input
  const handoff = soundResult.finalCompositionHandoff!
  const finalArtifact = handoff.finalSoundArtifactReferences[0]!
  const finalMixRef = domainRef(
    handoff.handoffId,
    'canonical-sound-final-composition-handoff-v1',
    hashSkillValue(handoff),
  )
  const reviewRef = domainRef(
    review.reviewId, review.schemaVersion, review.reviewDigestSha256)
  const cueResults = captionRequest.cueIntents.map((intent) => {
    const mustStaySilent = intent.eligibility === 'sound_forbidden'
      || intent.decision === 'remain_silent'
    if (mustStaySilent) return {
      cueIntentId: intent.cueIntentId,
      disposition: 'silent' as const,
      reasonCode: 'caption_restraint_silent',
      storyTimingEventRef: structuredClone(intent.storyTimingEventRef),
      soundSyncCueRef: null,
      selectedSoundAssetRef: null,
      trimAndAlignmentRef: null,
      mixPlanRef: null,
      dialogueProtectionRef: null,
    }
    const cue = soundResult.cueManifest.cues.find((candidate) =>
      candidate.eventAnchorId === intent.storyTimingEventRef.id)
    const decision = soundResult.acceptedCueRequests.find((candidate) =>
      candidate.resultingCueId === cue?.cueId)
    const placement = soundResult.synchronizationPlacements?.find((candidate) =>
      candidate.cueId === cue?.cueId)
    const automation = soundResult.mixAutomationManifest.automations.find(
      (candidate) => candidate.cueId === cue?.cueId)
    if (!cue || !decision || !placement || !automation
      || placement.residualErrorFrames > 2
      || automation.protectedSpeechRanges.length === 0) {
      return {
        cueIntentId: intent.cueIntentId,
        disposition: 'declined' as const,
        reasonCode: 'sound_owner_evidence_incomplete',
        storyTimingEventRef: structuredClone(intent.storyTimingEventRef),
        soundSyncCueRef: null,
        selectedSoundAssetRef: null,
        trimAndAlignmentRef: null,
        mixPlanRef: null,
        dialogueProtectionRef: null,
      }
    }
    return {
      cueIntentId: intent.cueIntentId,
      disposition: 'admitted' as const,
      reasonCode: 'sound_owner_admitted',
      storyTimingEventRef: structuredClone(intent.storyTimingEventRef),
      soundSyncCueRef: domainRef(
        cue.cueId, 'canonical-sound-cue-v1', hashSkillValue(cue)),
      selectedSoundAssetRef: soundArtifactRef(finalArtifact),
      trimAndAlignmentRef: domainRef(
        placement.placementId,
        'canonical-sound-synchronization-placement-v1',
        placement.placementManifestHash,
      ),
      mixPlanRef: domainRef(
        `sound.mix.${cue.cueId}`,
        'canonical-sound-mix-automation-v1',
        hashSkillValue(automation),
      ),
      dialogueProtectionRef: domainRef(
        `sound.dialogue-protection.${cue.cueId}`,
        'canonical-sound-dialogue-protection-v1',
        hashSkillValue({ automation, reviewDigestSha256:
          review.reviewDigestSha256 }),
      ),
    }
  })
  const withoutDigest: Omit<CaptionSoundSupportResult,
    'resultDigestSha256'> = {
    schemaVersion: 'caption-sound-support-result-v1',
    resultId: `caption.sound.result.${soundResult.requestId}`,
    supportRequestRef: structuredClone(input.supportRef),
    captionSoundRequestRef: domainRef(
      captionRequest.requestId,
      captionRequest.schemaVersion,
      captionRequest.requestDigestSha256,
    ),
    canonicalScope: structuredClone(captionRequest.canonicalScope),
    sceneGraphRef: structuredClone(captionRequest.sceneGraphRef),
    motionLockRef: structuredClone(captionRequest.motionLockRef),
    storyTimingResolutionRef:
      structuredClone(captionRequest.storyTimingResolutionRef),
    masterTimingRef: structuredClone(captionRequest.masterTimingRef),
    producerSkillKey: 'soundsync',
    cueResults,
    dialogueProtectedFinalMix: {
      dependencyRef: structuredClone(
        captionRequest.dialogueProtection.dialogueActivityRef),
      finalMixRef,
      dialogueProtectionQaRef: reviewRef,
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
  return Object.freeze({
    ...withoutDigest,
    resultDigestSha256: calculateSkillContractDigest(
      { ...withoutDigest, resultDigestSha256: '' },
      'resultDigestSha256',
    ),
  })
}

function soundArtifactRef(artifact: SoundArtifactRef): CaptionDomainRef {
  return domainRef(
    artifact.artifactId,
    `${artifact.artifactType}.v${artifact.version}`,
    artifact.checksumSha256,
  )
}

function domainRef(id: string, version: string, contentHash: string) {
  return refSchema.parse({ id, version, contentHash })
}

function skillRef(id: string, version: string, contentHash: string) {
  return domainRef(id, version, contentHash) as SkillContractRef
}

function sameRef(left: CaptionDomainRef, right: CaptionDomainRef): boolean {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}

function contractDigest(value: unknown): string {
  return calculateSkillContractDigest({
    value: JSON.parse(JSON.stringify(value)) as unknown,
    digest: '',
  }, 'digest')
}

async function persistJson(
  port: CanonicalCreateOnlyJsonObjectPort,
  objectPath: string,
  value: unknown,
): Promise<void> {
  const body = Buffer.from(JSON.stringify(value), 'utf8')
  if (body.byteLength < 2 || body.byteLength > MAX_RECORD_BYTES) {
    throw new Error('Canonical Sound Caption record size is invalid.')
  }
  const contentSha256 = createHash('sha256').update(body).digest('hex')
  await port.createOnly({ objectPath, body, contentSha256 })
  const reread = await port.readExact(objectPath)
  if (!reread || !reread.equals(body)) {
    throw new Error('Canonical Sound Caption create-only reread failed.')
  }
}

async function readJson(
  port: CanonicalCreateOnlyJsonObjectPort,
  objectPath: string,
): Promise<unknown | null> {
  const body = await port.readExact(objectPath)
  if (!body) return null
  if (body.byteLength < 2 || body.byteLength > MAX_RECORD_BYTES) {
    throw new Error('Canonical Sound Caption record bytes are invalid.')
  }
  return JSON.parse(body.toString('utf8')) as unknown
}

function resultPath(prefix: string, requestRef: SkillContractRef): string {
  return `${prefix}/results/${requestRef.contentHash}.json`
}

function assertDependencies(input: {
  objectPort: CanonicalCreateOnlyJsonObjectPort
  executionReadPort: CanonicalSoundCaptionExecutionReadPort
  listeningReviewReadPort: CanonicalSoundCaptionListeningReviewReadPort
  artifactResolver: CanonicalSoundArtifactResolver
}): void {
  if (!input.objectPort || typeof input.objectPort.createOnly !== 'function'
    || typeof input.objectPort.readExact !== 'function'
    || !admittedExecutionReaders.has(input.executionReadPort)
    || !admittedListeningReaders.has(input.listeningReviewReadPort)
    || !input.artifactResolver
    || typeof input.artifactResolver.resolve !== 'function') {
    throw new Error('Canonical Sound Caption owner dependencies are incomplete.')
  }
}
