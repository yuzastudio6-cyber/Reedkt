import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import type { CanonicalPictureLockManifest } from '../../src/types/canonical-picture-lock-manifest'
import type {
  CaptionDependencyObservation,
  CaptionFinishDependencyKind,
} from '../../src/types/caption-finish-readiness'
import type { CaptionDomainRef } from '../../src/types/caption-domain-contracts'
import {
  createCanonicalPictureLockManifest,
  parseCanonicalPictureLockManifest,
} from '../edit-architecture/canonical-picture-lock-manifest'
import {
  createCaptionDependencyManifest,
  createCaptionFinishReadiness,
  createCaptionInvalidationResult,
  createCaptionLifecycleRecord,
  parseCaptionDependencyManifest,
  parseCaptionFinishReadiness,
  parseCaptionInvalidationResult,
} from '../captions-specialist/caption-finish-readiness'
import { calculateSkillContractDigest } from '../orchestra/orchestra-skill-contracts'

let assertions = 0
function check(condition: unknown, message: string): asserts condition {
  assert.ok(condition, message)
  assertions += 1
}
function expectThrow(action: () => unknown): void {
  assert.throws(action)
  assertions += 1
}
function digest(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}
function ref(id: string): CaptionDomainRef {
  return { id, version: `${id}.v1`, contentHash: digest(id) }
}

const scenes = ['scene.one', 'scene.two', 'scene.three']
const snapshotRef = ref('snapshot.approved')
function createPictureLock(input?: {
  frame?: { width: number; height: number; numerator: number; denominator: number; digestSeed: string }
  exceptions?: CanonicalPictureLockManifest['approvedExceptions']
}) {
  const frame = input?.frame ?? {
    width: 1920,
    height: 1080,
    numerator: 16,
    denominator: 9,
    digestSeed: 'frame.16.9',
  }
  const exceptions = input?.exceptions ?? []
  return createCanonicalPictureLockManifest({
    manifestId: `picture.lock.${frame.digestSeed}`,
    canonicalScope: {
      ownerUserId: 'owner.fixture',
      workspaceId: 'workspace.fixture',
      projectId: 'project.fixture',
      editSessionId: 'edit.fixture',
      planVersionId: 'plan.fixture.v2',
      approvedSnapshotRef: snapshotRef,
    },
    confirmedOutputFrame: {
      outputId: 'output.primary',
      width: frame.width,
      height: frame.height,
      aspectRatioNumerator: frame.numerator,
      aspectRatioDenominator: frame.denominator,
      fpsNumerator: 30,
      fpsDenominator: 1,
      totalFrames: 300,
      confirmedOutputFrameDigestSha256: digest(frame.digestSeed),
    },
    timelineBindings: {
      timelineVersionRef: ref('lock.timeline'),
      sourceRangesRef: ref('lock.source.ranges'),
      shotOrderRef: ref('lock.shot.order'),
      shotDurationsRef: ref('lock.shot.durations'),
      speedChangesRef: ref('lock.speed.changes'),
      transitionsRef: ref('lock.transitions'),
      masterTimingRef: ref('lock.master.timing'),
    },
    compositionBindings: {
      cropReframeRef: ref('lock.crop.reframe'),
      brollLayoutRef: ref('lock.broll.layout'),
      livingFrameLayoutRef: ref('lock.living.frame.layout'),
      graphicsMapsChartsRef: ref('lock.graphics.maps.charts'),
      lowerThirdsRef: ref('lock.lower.thirds'),
      maskTrackingAnchorRef: ref('lock.mask.tracking.anchor'),
      occupancyRef: ref('lock.occupancy'),
      nearFinalVisualProxyRef: ref('lock.near.final.visual.proxy'),
      colorLookRef: ref('lock.color.look'),
      rendererPlanRef: ref('lock.renderer.plan'),
    },
    sourceAssetManifestRef: ref('lock.source.asset.manifest'),
    lockedSceneIds: scenes,
    lockState: exceptions.length > 0 ? 'locked_with_approved_exceptions' : 'locked',
    approvedExceptions: exceptions,
    lockedAt: '2026-08-04T12:00:00.000Z',
    lockedByRef: ref('canonical.picture.lock.owner'),
    immutable: true,
    sharedEditArchitectureOwner: 'canonical_edit_picture_lock',
    captionOwnsPictureLock: false,
    rawChatIncluded: false,
    mediaBytesIncluded: false,
    privateArtifact: true,
    publicDeliveryAuthorityClaimed: false,
    productionAuthorityClaimed: false,
  })
}
const lock = createPictureLock()
const lockRef: CaptionDomainRef = {
  id: lock.manifestId,
  version: lock.schemaVersion,
  contentHash: lock.manifestDigestSha256,
}
const frameRef: CaptionDomainRef = {
  id: lock.confirmedOutputFrame.outputId,
  version: 'canonical-confirmed-output-frame-v1',
  contentHash: lock.confirmedOutputFrame.confirmedOutputFrameDigestSha256,
}
const scope = {
  ownerUserId: lock.canonicalScope.ownerUserId,
  workspaceId: lock.canonicalScope.workspaceId,
  projectId: lock.canonicalScope.projectId,
  editSessionId: lock.canonicalScope.editSessionId,
  planVersionId: lock.canonicalScope.planVersionId,
  approvedSnapshotRef: snapshotRef,
  outputId: lock.confirmedOutputFrame.outputId,
  sceneId: null,
  authorizedFrameRanges: [{ startFrame: 0, endFrameExclusive: 300 }],
}

const kinds: CaptionFinishDependencyKind[] = [
  'approved_snapshot', 'picture_lock', 'confirmed_output_frame',
  'canonical_transcript', 'word_timing', 'timeline', 'source_ranges',
  'shot_order', 'shot_durations', 'speed_changes', 'crop_reframe',
  'broll_layout', 'living_frame_layout', 'graphics_maps_charts', 'lower_thirds',
  'occupancy', 'near_final_visual_proxy', 'mask', 'tracking', 'object_anchor',
  'transition', 'master_timing', 'story_timing', 'font_registry',
  'caption_style', 'color_proxy', 'sound_plan', 'renderer_runtime',
  'approval_envelope', 'qa_policy', 'source_asset_manifest',
  'reservation_honored',
]
function lockedRefFor(
  pictureLock: CanonicalPictureLockManifest,
  kind: CaptionFinishDependencyKind,
): CaptionDomainRef {
  const map: Partial<Record<CaptionFinishDependencyKind, CaptionDomainRef>> = {
    approved_snapshot: pictureLock.canonicalScope.approvedSnapshotRef,
    picture_lock: {
      id: pictureLock.manifestId,
      version: pictureLock.schemaVersion,
      contentHash: pictureLock.manifestDigestSha256,
    },
    confirmed_output_frame: {
      id: pictureLock.confirmedOutputFrame.outputId,
      version: 'canonical-confirmed-output-frame-v1',
      contentHash: pictureLock.confirmedOutputFrame.confirmedOutputFrameDigestSha256,
    },
    timeline: pictureLock.timelineBindings.timelineVersionRef,
    source_ranges: pictureLock.timelineBindings.sourceRangesRef,
    shot_order: pictureLock.timelineBindings.shotOrderRef,
    shot_durations: pictureLock.timelineBindings.shotDurationsRef,
    speed_changes: pictureLock.timelineBindings.speedChangesRef,
    crop_reframe: pictureLock.compositionBindings.cropReframeRef,
    broll_layout: pictureLock.compositionBindings.brollLayoutRef,
    living_frame_layout: pictureLock.compositionBindings.livingFrameLayoutRef,
    graphics_maps_charts: pictureLock.compositionBindings.graphicsMapsChartsRef,
    lower_thirds: pictureLock.compositionBindings.lowerThirdsRef,
    occupancy: pictureLock.compositionBindings.occupancyRef,
    near_final_visual_proxy: pictureLock.compositionBindings.nearFinalVisualProxyRef,
    mask: pictureLock.compositionBindings.maskTrackingAnchorRef,
    tracking: pictureLock.compositionBindings.maskTrackingAnchorRef,
    object_anchor: pictureLock.compositionBindings.maskTrackingAnchorRef,
    transition: pictureLock.timelineBindings.transitionsRef,
    master_timing: pictureLock.timelineBindings.masterTimingRef,
    color_proxy: pictureLock.compositionBindings.colorLookRef,
    source_asset_manifest: pictureLock.sourceAssetManifestRef,
  }
  return map[kind] ?? ref(`lock.caption.${kind}`)
}
function readyObservations(pictureLock: CanonicalPictureLockManifest): CaptionDependencyObservation[] {
  return kinds.map((dependencyKind) => {
    const locked = lockedRefFor(pictureLock, dependencyKind)
    return {
      dependencyId: `dependency.${dependencyKind}`,
      dependencyKind,
      ownerKey: `owner.${dependencyKind}`,
      requiredForSceneIds: scenes,
      requirement: 'required',
      lockedRef: locked,
      currentRef: locked,
      approvedExceptionRef: null,
      fallbackAuthorizationRef: null,
      selectedFallbackId: null,
    }
  })
}
function createManifest(
  manifestId: string,
  pictureLock: CanonicalPictureLockManifest,
  observations: CaptionDependencyObservation[],
) {
  return createCaptionDependencyManifest({
    manifestId,
    canonicalScope: {
      ...scope,
      approvedSnapshotRef: pictureLock.canonicalScope.approvedSnapshotRef,
    },
    pictureLock,
    earlyPlanningBundleRef: ref('caption.early.plan.approved'),
    sceneIds: scenes,
    observations,
  })
}

check(lock.immutable && !lock.captionOwnsPictureLock, 'Picture lock must be immutable and neutrally owned.')
check(
  lock.confirmedOutputFrame.aspectRatioNumerator === 16
    && lock.confirmedOutputFrame.aspectRatioDenominator === 9,
  'Picture lock must bind the exact reduced frame ratio.',
)

const readyManifest = createManifest('caption.dependencies.ready', lock, readyObservations(lock))
const ready = createCaptionFinishReadiness({
  readinessId: 'caption.finish.ready',
  dependencyManifest: readyManifest,
  pictureLock: lock,
})
check(
  ready.allFinalCaptionScenesReady
    && ready.lateCaptionResolutionAllowed
    && ready.readySceneIds.length === 3,
  'Exact current dependencies must permit late Caption resolution.',
)
check(
  !ready.finalRenderAllowed && !ready.finalQaApprovalClaimed && !ready.productionReady,
  'Finish readiness must not grant render, QA approval, or production authority.',
)
check(
  ready.sceneReadiness.every((scene) => scene.gateResults.length === kinds.length),
  'Every scene must have complete dependency-kind gate coverage.',
)

const fallbackObservations = readyObservations(lock)
const baseMaskIndex = fallbackObservations.findIndex((item) => item.dependencyKind === 'mask')
fallbackObservations.splice(baseMaskIndex, 1, {
  ...fallbackObservations[baseMaskIndex],
  dependencyId: 'dependency.mask.original.scenes.one.three',
  requiredForSceneIds: ['scene.one', 'scene.three'],
}, {
  ...fallbackObservations[baseMaskIndex],
  dependencyId: 'dependency.mask.fallback.scene.two',
  requiredForSceneIds: ['scene.two'],
  currentRef: null,
  fallbackAuthorizationRef: ref('approval.fallback.safe.top.layer'),
  selectedFallbackId: 'fallback.safe.top.layer',
})
const fallbackManifest = createManifest(
  'caption.dependencies.mask.fallback', lock, fallbackObservations,
)
const fallbackReadiness = createCaptionFinishReadiness({
  readinessId: 'caption.finish.mask.fallback',
  dependencyManifest: fallbackManifest,
  pictureLock: lock,
})
check(
  fallbackReadiness.readyWithFallbackSceneIds.join('|') === 'scene.two'
    && fallbackReadiness.sceneReadiness[1].originalTreatmentReady === false
    && fallbackReadiness.lateCaptionResolutionAllowed,
  'Missing mask may use an approved safe top-layer fallback without claiming original occlusion readiness.',
)

const exceptionApprovalRef = ref('approval.picture.lock.lower.thirds.exception')
const exceptionLock = createPictureLock({ exceptions: [{
  exceptionId: 'exception.lower.thirds.scene.two',
  dependencyCode: 'lower_thirds',
  affectedSceneIds: ['scene.two'],
  reasonCode: 'approved_lower_thirds_non_use',
  approvalRef: exceptionApprovalRef,
}] })
const exceptionObservations = readyObservations(exceptionLock)
const lowerThirdsIndex = exceptionObservations.findIndex((item) =>
  item.dependencyKind === 'lower_thirds')
exceptionObservations.splice(lowerThirdsIndex, 1, {
  ...exceptionObservations[lowerThirdsIndex],
  dependencyId: 'dependency.lower.thirds.scenes.one.three',
  requiredForSceneIds: ['scene.one', 'scene.three'],
}, {
  ...exceptionObservations[lowerThirdsIndex],
  dependencyId: 'dependency.lower.thirds.exception.scene.two',
  requiredForSceneIds: ['scene.two'],
  currentRef: null,
  approvedExceptionRef: exceptionApprovalRef,
})
const exceptionManifest = createManifest(
  'caption.dependencies.approved.exception', exceptionLock, exceptionObservations,
)
const exceptionReadiness = createCaptionFinishReadiness({
  readinessId: 'caption.finish.approved.exception',
  dependencyManifest: exceptionManifest,
  pictureLock: exceptionLock,
})
check(
  exceptionReadiness.readyWithFallbackSceneIds.join('|') === 'scene.two',
  'Only an exact PictureLockManifest exception may degrade a locked dependency.',
)

const inventedException = readyObservations(lock)
const inventedLowerThirds = inventedException.find((item) =>
  item.dependencyKind === 'lower_thirds')!
inventedLowerThirds.currentRef = null
inventedLowerThirds.approvedExceptionRef = ref('approval.invented.exception')
expectThrow(() => createManifest(
  'caption.dependencies.invented.exception', lock, inventedException,
))
const unmappedException = readyObservations(lock)
const unmappedFont = unmappedException.find((item) =>
  item.dependencyKind === 'font_registry')!
unmappedFont.currentRef = null
unmappedFont.approvedExceptionRef = ref('approval.invented.font.exception')
expectThrow(() => createManifest(
  'caption.dependencies.unmapped.exception', lock, unmappedException,
))

const fallbackAuthorizationChanged = structuredClone(fallbackObservations)
const changedFallbackMask = fallbackAuthorizationChanged.find((item) =>
  item.dependencyId === 'dependency.mask.fallback.scene.two')!
changedFallbackMask.fallbackAuthorizationRef = ref('approval.fallback.safe.top.layer.v2')
const changedFallbackManifest = createManifest(
  'caption.dependencies.mask.fallback.changed', lock, fallbackAuthorizationChanged,
)
const fallbackAuthorizationInvalidation = createCaptionInvalidationResult({
  invalidationId: 'caption.invalidation.mask.fallback.authorization',
  priorManifest: fallbackManifest,
  priorPictureLock: lock,
  currentManifest: changedFallbackManifest,
  currentPictureLock: lock,
})
check(
  fallbackAuthorizationInvalidation.invalidatedSceneIds.join('|') === 'scene.two',
  'Changed fallback authorization must invalidate only its exact affected scene.',
)

const blockedObservations = readyObservations(lock)
const baseWordIndex = blockedObservations.findIndex((item) => item.dependencyKind === 'word_timing')
blockedObservations.splice(baseWordIndex, 1, {
  ...blockedObservations[baseWordIndex],
  dependencyId: 'dependency.word.timing.scene.one',
  requiredForSceneIds: ['scene.one'],
  currentRef: null,
}, {
  ...blockedObservations[baseWordIndex],
  dependencyId: 'dependency.word.timing.scenes.two.three',
  requiredForSceneIds: ['scene.two', 'scene.three'],
})
const blockedManifest = createManifest(
  'caption.dependencies.word.blocked', lock, blockedObservations,
)
const blockedReadiness = createCaptionFinishReadiness({
  readinessId: 'caption.finish.word.blocked',
  dependencyManifest: blockedManifest,
  pictureLock: lock,
})
check(
  blockedReadiness.blockedSceneIds.join('|') === 'scene.one'
    && !blockedReadiness.lateCaptionResolutionAllowed,
  'Missing required word timing must block the affected final Caption scene.',
)

const scopedPriorObservations = readyObservations(lock)
const styleIndex = scopedPriorObservations.findIndex((item) => item.dependencyKind === 'caption_style')
scopedPriorObservations.splice(styleIndex, 1, {
  ...scopedPriorObservations[styleIndex],
  dependencyId: 'dependency.caption.style.scenes.one.three',
  requiredForSceneIds: ['scene.one', 'scene.three'],
}, {
  ...scopedPriorObservations[styleIndex],
  dependencyId: 'dependency.caption.style.scene.two',
  requiredForSceneIds: ['scene.two'],
})
const scopedPrior = createManifest(
  'caption.dependencies.style.prior', lock, scopedPriorObservations,
)
const scopedCurrentObservations = structuredClone(scopedPriorObservations)
const changedStyle = scopedCurrentObservations.find((item) =>
  item.dependencyId === 'dependency.caption.style.scene.two')!
changedStyle.currentRef = ref('lock.caption.caption_style.changed')
const scopedCurrent = createManifest(
  'caption.dependencies.style.current', lock, scopedCurrentObservations,
)
const localInvalidation = createCaptionInvalidationResult({
  invalidationId: 'caption.invalidation.style.scene.two',
  priorManifest: scopedPrior,
  priorPictureLock: lock,
  currentManifest: scopedCurrent,
  currentPictureLock: lock,
})
check(
  localInvalidation.invalidatedSceneIds.join('|') === 'scene.two'
    && localInvalidation.unchangedSceneIds.join('|') === 'scene.one|scene.three'
    && !localInvalidation.requiresCanonicalReapproval,
  'Local style drift must invalidate only the mapped Caption scene.',
)

const verticalLock = createPictureLock({
  frame: { width: 1080, height: 1920, numerator: 9, denominator: 16, digestSeed: 'frame.9.16' },
})
const verticalManifest = createManifest(
  'caption.dependencies.vertical.frame', verticalLock, readyObservations(verticalLock),
)
const globalInvalidation = createCaptionInvalidationResult({
  invalidationId: 'caption.invalidation.output.frame',
  priorManifest: readyManifest,
  priorPictureLock: lock,
  currentManifest: verticalManifest,
  currentPictureLock: verticalLock,
})
check(
  globalInvalidation.invalidatedSceneIds.length === scenes.length
    && globalInvalidation.requiresCanonicalReapproval,
  'Confirmed-frame or picture-lock change must invalidate all Caption scenes and require canonical reapproval.',
)

const initialLifecycle = createCaptionLifecycleRecord({
  lifecycleRecordId: 'caption.lifecycle.initial',
  priorLifecycleRef: null,
  fromState: null,
  toState: 'strategy_draft',
  affectedSceneIds: scenes,
  reasonCodes: ['caption_strategy_started'],
  createdAt: '2026-08-04T12:01:00.000Z',
})
check(initialLifecycle.appendOnly, 'Caption lifecycle must be append-only.')
const finishLifecycle = createCaptionLifecycleRecord({
  lifecycleRecordId: 'caption.lifecycle.finish.ready',
  priorLifecycleRef: ref('caption.lifecycle.awaiting.picture.lock'),
  fromState: 'awaiting_picture_lock',
  toState: 'finish_ready',
  affectedSceneIds: scenes,
  reasonCodes: ['caption_finish_dependencies_ready'],
  createdAt: '2026-08-04T12:02:00.000Z',
})
check(finishLifecycle.toState === 'finish_ready', 'Picture-lock readiness must enter finish_ready.')
const staleLifecycle = createCaptionLifecycleRecord({
  lifecycleRecordId: 'caption.lifecycle.stale',
  priorLifecycleRef: ref('caption.lifecycle.finish.ready'),
  fromState: 'finish_ready',
  toState: 'stale',
  affectedSceneIds: ['scene.two'],
  reasonCodes: ['caption_style_dependency_changed'],
  createdAt: '2026-08-04T12:03:00.000Z',
})
check(staleLifecycle.affectedSceneIds[0] === 'scene.two', 'Lifecycle staleness must preserve local scope.')
expectThrow(() => createCaptionLifecycleRecord({
  lifecycleRecordId: 'caption.lifecycle.invalid.jump',
  priorLifecycleRef: ref('caption.lifecycle.finish.ready'),
  fromState: 'finish_ready',
  toState: 'delivery_ready',
  affectedSceneIds: scenes,
  reasonCodes: ['invalid_jump'],
  createdAt: '2026-08-04T12:04:00.000Z',
}))

const wrongRatioLock = structuredClone(lock)
wrongRatioLock.confirmedOutputFrame.aspectRatioNumerator = 9
wrongRatioLock.confirmedOutputFrame.aspectRatioDenominator = 16
wrongRatioLock.manifestDigestSha256 = calculateSkillContractDigest(
  wrongRatioLock as unknown as Record<string, unknown>,
  'manifestDigestSha256',
)
expectThrow(() => parseCanonicalPictureLockManifest(wrongRatioLock))
const badExceptionState = structuredClone(lock)
badExceptionState.approvedExceptions.push({
  exceptionId: 'exception.invalid',
  dependencyCode: 'lower_thirds',
  affectedSceneIds: ['scene.one'],
  reasonCode: 'invalid_without_state',
  approvalRef: ref('approval.exception'),
})
badExceptionState.manifestDigestSha256 = calculateSkillContractDigest(
  badExceptionState as unknown as Record<string, unknown>,
  'manifestDigestSha256',
)
expectThrow(() => parseCanonicalPictureLockManifest(badExceptionState))
expectThrow(() => createPictureLock({ exceptions: [{
  exceptionId: 'exception.bad.scene',
  dependencyCode: 'lower_thirds',
  affectedSceneIds: ['scene.unknown'],
  reasonCode: 'unknown_scene',
  approvalRef: ref('approval.exception'),
}] }))

const unknownPictureLock = structuredClone(lock) as unknown as {
  compositionBindings: Record<string, unknown>
  manifestDigestSha256: string
} & Record<string, unknown>
unknownPictureLock.compositionBindings.captionOwnsLayout = true
unknownPictureLock.manifestDigestSha256 = calculateSkillContractDigest(
  unknownPictureLock,
  'manifestDigestSha256',
)
expectThrow(() => parseCanonicalPictureLockManifest(unknownPictureLock))

const missingKindManifest = structuredClone(readyManifest)
missingKindManifest.dependencies = missingKindManifest.dependencies.filter((item) =>
  item.dependencyKind !== 'qa_policy')
missingKindManifest.manifestDigestSha256 = calculateSkillContractDigest(
  missingKindManifest as unknown as Record<string, unknown>,
  'manifestDigestSha256',
)
expectThrow(() => parseCaptionDependencyManifest(missingKindManifest, lock))

const stalePictureLockBinding = structuredClone(readyManifest)
const timelineDependency = stalePictureLockBinding.dependencies.find((item) =>
  item.dependencyKind === 'timeline')!
timelineDependency.lockedRef = ref('wrong.timeline.lock')
timelineDependency.currentRef = timelineDependency.lockedRef
stalePictureLockBinding.manifestDigestSha256 = calculateSkillContractDigest(
  stalePictureLockBinding as unknown as Record<string, unknown>,
  'manifestDigestSha256',
)
expectThrow(() => parseCaptionDependencyManifest(stalePictureLockBinding, lock))

const incompleteFallback = structuredClone(readyObservations(lock))
const incompleteMask = incompleteFallback.find((item) => item.dependencyKind === 'mask')!
incompleteMask.currentRef = null
incompleteMask.selectedFallbackId = 'fallback.safe.top.layer'
expectThrow(() => createManifest(
  'caption.dependencies.incomplete.fallback', lock, incompleteFallback,
))

const notApplicableWithLineage = structuredClone(readyObservations(lock))
const soundDependency = notApplicableWithLineage.find((item) => item.dependencyKind === 'sound_plan')!
soundDependency.requirement = 'not_applicable'
expectThrow(() => createManifest(
  'caption.dependencies.invalid.not.applicable', lock, notApplicableWithLineage,
))

const scopeMismatch = structuredClone(scope)
scopeMismatch.outputId = 'output.other'
expectThrow(() => createCaptionDependencyManifest({
  manifestId: 'caption.dependencies.scope.mismatch',
  canonicalScope: scopeMismatch,
  pictureLock: lock,
  earlyPlanningBundleRef: ref('caption.early.plan.approved'),
  sceneIds: scenes,
  observations: readyObservations(lock),
}))

const statusOverclaim = structuredClone(blockedManifest)
const missingWord = statusOverclaim.dependencies.find((item) =>
  item.dependencyId === 'dependency.word.timing.scene.one')!
missingWord.status = 'ready'
missingWord.blockerCode = null
missingWord.originalTreatmentReady = true
statusOverclaim.manifestDigestSha256 = calculateSkillContractDigest(
  statusOverclaim as unknown as Record<string, unknown>,
  'manifestDigestSha256',
)
expectThrow(() => parseCaptionDependencyManifest(statusOverclaim, lock))

const readinessOverclaim = structuredClone(blockedReadiness)
readinessOverclaim.allFinalCaptionScenesReady = true
readinessOverclaim.lateCaptionResolutionAllowed = true
readinessOverclaim.readinessDigestSha256 = calculateSkillContractDigest(
  readinessOverclaim as unknown as Record<string, unknown>,
  'readinessDigestSha256',
)
expectThrow(() => parseCaptionFinishReadiness(readinessOverclaim))

const invalidationOverclaim = structuredClone(localInvalidation)
invalidationOverclaim.requiresCanonicalReapproval = true
invalidationOverclaim.invalidationDigestSha256 = calculateSkillContractDigest(
  invalidationOverclaim as unknown as Record<string, unknown>,
  'invalidationDigestSha256',
)
expectThrow(() => parseCaptionInvalidationResult(invalidationOverclaim))
const invalidationPartitionOmission = structuredClone(localInvalidation)
invalidationPartitionOmission.unchangedSceneIds = ['scene.one']
invalidationPartitionOmission.invalidationDigestSha256 = calculateSkillContractDigest(
  invalidationPartitionOmission as unknown as Record<string, unknown>,
  'invalidationDigestSha256',
)
expectThrow(() => parseCaptionInvalidationResult(invalidationPartitionOmission))

check(
  lockRef.contentHash === lock.manifestDigestSha256
    && frameRef.contentHash === lock.confirmedOutputFrame.confirmedOutputFrameDigestSha256,
  'Caption must consume opaque exact picture-lock and frame lineage.',
)

process.stdout.write(`${JSON.stringify({
  status: 'passed',
  milestone: 'CAP-07',
  assertions,
  sharedPictureLockVersion: lock.schemaVersion,
  dependencyKindCount: kinds.length,
  readySceneCount: ready.readySceneIds.length,
  fallbackSceneCount: fallbackReadiness.readyWithFallbackSceneIds.length,
  blockedSceneCount: blockedReadiness.blockedSceneIds.length,
  localInvalidatedSceneCount: localInvalidation.invalidatedSceneIds.length,
  globalInvalidatedSceneCount: globalInvalidation.invalidatedSceneIds.length,
  captionOwnsPictureLock: false,
  finalRenderAllowed: false,
  runtimeStarted: false,
  productionAuthorityPromoted: false,
}, null, 2)}\n`)
