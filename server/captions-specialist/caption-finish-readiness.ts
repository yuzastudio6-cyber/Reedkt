import { z } from 'zod'
import type { CanonicalPictureLockManifest } from '../../src/types/canonical-picture-lock-manifest'
import {
  CAPTION_DEPENDENCY_MANIFEST_VERSION,
  CAPTION_FINISH_READINESS_VERSION,
  CAPTION_INVALIDATION_RESULT_VERSION,
  CAPTION_LIFECYCLE_RECORD_VERSION,
  type CaptionDependencyManifestV2,
  type CaptionDependencyObservation,
  type CaptionDependencyRecord,
  type CaptionFinishDependencyKind,
  type CaptionFinishReadinessV2,
  type CaptionInvalidationResult,
  type CaptionLifecycleRecordV2,
  type CaptionLifecycleStateV2,
} from '../../src/types/caption-finish-readiness'
import type {
  CaptionDomainCanonicalScope,
  CaptionDomainRef,
} from '../../src/types/caption-domain-contracts'
import { assertClosedContractTree } from '../../src/lib/closed-contract-validation'
import { parseCanonicalPictureLockManifest } from '../edit-architecture/canonical-picture-lock-manifest'
import { calculateSkillContractDigest } from '../orchestra/orchestra-skill-contracts'

const safeKey = z.string().min(1).max(240)
  .regex(/^[a-z0-9][a-z0-9._:-]*$/u)
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const refSchema = z.object({ id: safeKey, version: safeKey, contentHash: sha256 }).strict()
const frameRangeSchema = z.object({
  startFrame: z.number().int().nonnegative(),
  endFrameExclusive: z.number().int().positive(),
}).strict().superRefine((range, context) => {
  if (range.endFrameExclusive <= range.startFrame) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Caption scope range has no duration.' })
  }
})
const scopeSchema: z.ZodType<CaptionDomainCanonicalScope> = z.object({
  ownerUserId: safeKey,
  workspaceId: safeKey,
  projectId: safeKey,
  editSessionId: safeKey,
  planVersionId: safeKey,
  approvedSnapshotRef: refSchema.nullable(),
  outputId: safeKey,
  sceneId: safeKey.nullable(),
  authorizedFrameRanges: z.array(frameRangeSchema).min(1).max(512),
}).strict()
const dependencyKindSchema = z.enum([
  'approved_snapshot', 'picture_lock', 'confirmed_output_frame',
  'canonical_transcript', 'word_timing', 'timeline', 'source_ranges',
  'shot_order', 'shot_durations', 'speed_changes', 'crop_reframe',
  'broll_layout', 'living_frame_layout', 'graphics_maps_charts',
  'lower_thirds', 'occupancy', 'near_final_visual_proxy', 'mask', 'tracking',
  'object_anchor', 'transition', 'master_timing', 'story_timing',
  'font_registry', 'caption_style', 'color_proxy', 'sound_plan',
  'renderer_runtime', 'approval_envelope', 'qa_policy',
  'source_asset_manifest', 'reservation_honored',
])
const dependencyStatusSchema = z.enum([
  'ready', 'missing', 'stale', 'approved_exception', 'fallback_ready',
  'not_applicable',
])
const observationSchema = z.object({
  dependencyId: safeKey,
  dependencyKind: dependencyKindSchema,
  ownerKey: safeKey,
  requiredForSceneIds: z.array(safeKey).min(1).max(10_000),
  requirement: z.enum(['required', 'conditional', 'not_applicable']),
  lockedRef: refSchema.nullable(),
  currentRef: refSchema.nullable(),
  approvedExceptionRef: refSchema.nullable(),
  fallbackAuthorizationRef: refSchema.nullable(),
  selectedFallbackId: safeKey.nullable(),
}).strict()
const dependencyRecordSchema: z.ZodType<CaptionDependencyRecord> = observationSchema.extend({
  status: dependencyStatusSchema,
  blockerCode: safeKey.nullable(),
  originalTreatmentReady: z.boolean(),
}).strict()
const manifestSchema: z.ZodType<CaptionDependencyManifestV2> = z.object({
  schemaVersion: z.literal(CAPTION_DEPENDENCY_MANIFEST_VERSION),
  manifestId: safeKey,
  manifestDigestSha256: sha256,
  canonicalScope: scopeSchema,
  pictureLockRef: refSchema,
  earlyPlanningBundleRef: refSchema,
  sceneIds: z.array(safeKey).min(1).max(10_000),
  dependencies: z.array(dependencyRecordSchema).min(dependencyKindSchema.options.length).max(100_000),
  completeDependencyMapping: z.literal(true),
  unrelatedScenesMayContinue: z.literal(true),
  finalRenderAuthorityClaimed: z.literal(false),
  workCreationAuthorityClaimed: z.literal(false),
  productionAuthorityClaimed: z.literal(false),
}).strict()
const gateSchema = z.object({
  dependencyId: safeKey,
  dependencyKind: dependencyKindSchema,
  status: dependencyStatusSchema,
  evidenceRef: refSchema.nullable(),
  blockerCode: safeKey.nullable(),
  selectedFallbackId: safeKey.nullable(),
}).strict()
const sceneReadinessSchema = z.object({
  sceneId: safeKey,
  disposition: z.enum(['ready', 'ready_with_fallback', 'blocked']),
  originalTreatmentReady: z.boolean(),
  gateResults: z.array(gateSchema).min(dependencyKindSchema.options.length).max(100_000),
  blockerCodes: z.array(safeKey).max(512),
  selectedFallbackIds: z.array(safeKey).max(512),
}).strict()
const readinessSchema: z.ZodType<CaptionFinishReadinessV2> = z.object({
  schemaVersion: z.literal(CAPTION_FINISH_READINESS_VERSION),
  readinessId: safeKey,
  readinessDigestSha256: sha256,
  canonicalScope: scopeSchema,
  pictureLockRef: refSchema,
  dependencyManifestRef: refSchema,
  sceneReadiness: z.array(sceneReadinessSchema).min(1).max(10_000),
  readySceneIds: z.array(safeKey).max(10_000),
  readyWithFallbackSceneIds: z.array(safeKey).max(10_000),
  blockedSceneIds: z.array(safeKey).max(10_000),
  allFinalCaptionScenesReady: z.boolean(),
  lateCaptionResolutionAllowed: z.boolean(),
  staleFinalSceneRenderAllowed: z.literal(false),
  finalRenderAllowed: z.literal(false),
  finalQaApprovalClaimed: z.literal(false),
  productionReady: z.literal(false),
}).strict()
const changedDependencySchema = z.object({
  dependencyId: safeKey,
  dependencyKind: dependencyKindSchema,
  priorRef: refSchema.nullable(),
  currentRef: refSchema.nullable(),
  affectedSceneIds: z.array(safeKey).min(1).max(10_000),
  reasonCode: safeKey,
}).strict()
const invalidationSchema: z.ZodType<CaptionInvalidationResult> = z.object({
  schemaVersion: z.literal(CAPTION_INVALIDATION_RESULT_VERSION),
  invalidationId: safeKey,
  invalidationDigestSha256: sha256,
  priorDependencyManifestRef: refSchema,
  currentDependencyManifestRef: refSchema,
  allSceneIds: z.array(safeKey).min(1).max(10_000),
  changedDependencies: z.array(changedDependencySchema).max(100_000),
  invalidatedSceneIds: z.array(safeKey).max(10_000),
  unchangedSceneIds: z.array(safeKey).max(10_000),
  requiresCanonicalReapproval: z.boolean(),
  unrelatedScenesMayContinue: z.literal(true),
  automaticRenderAllowed: z.literal(false),
  productionAuthorityClaimed: z.literal(false),
}).strict()
const lifecycleStateSchema = z.enum([
  'strategy_draft', 'strategy_reviewable', 'strategy_approved',
  'opportunities_mapped', 'space_reserved', 'blocking_ready',
  'awaiting_picture_lock', 'finish_readiness_blocked', 'finish_ready',
  'choreography_resolving', 'choreography_resolved', 'storytiming_locked',
  'sound_handoff_ready', 'render_ready', 'rendered', 'qa_warning', 'qa_failed',
  'qa_passed', 'delivery_ready', 'stale', 'revision_required', 'superseded',
])
const lifecycleSchema: z.ZodType<CaptionLifecycleRecordV2> = z.object({
  schemaVersion: z.literal(CAPTION_LIFECYCLE_RECORD_VERSION),
  lifecycleRecordId: safeKey,
  lifecycleRecordDigestSha256: sha256,
  priorLifecycleRef: refSchema.nullable(),
  fromState: lifecycleStateSchema.nullable(),
  toState: lifecycleStateSchema,
  affectedSceneIds: z.array(safeKey).min(1).max(10_000),
  reasonCodes: z.array(safeKey).min(1).max(512),
  createdAt: z.string().datetime({ offset: true }),
  appendOnly: z.literal(true),
  approvedVersionOverwritten: z.literal(false),
  globalWorkflowOwnerChanged: z.literal(false),
  runtimeExecutionAuthorityClaimed: z.literal(false),
  productionAuthorityClaimed: z.literal(false),
}).strict()

const ALL_DEPENDENCY_KINDS = dependencyKindSchema.options

function refKey(ref: CaptionDomainRef | null): string {
  return ref ? `${ref.id}:${ref.version}:${ref.contentHash}` : 'null'
}

function exactRef(left: CaptionDomainRef | null, right: CaptionDomainRef | null): boolean {
  return refKey(left) === refKey(right)
}

function pictureLockRef(lock: CanonicalPictureLockManifest): CaptionDomainRef {
  return {
    id: lock.manifestId,
    version: lock.schemaVersion,
    contentHash: lock.manifestDigestSha256,
  }
}

function dependencyManifestRef(manifest: CaptionDependencyManifestV2): CaptionDomainRef {
  return {
    id: manifest.manifestId,
    version: manifest.schemaVersion,
    contentHash: manifest.manifestDigestSha256,
  }
}

function expectedPictureLockBinding(
  lock: CanonicalPictureLockManifest,
  kind: CaptionFinishDependencyKind,
): CaptionDomainRef | null {
  const frameRef: CaptionDomainRef = {
    id: lock.confirmedOutputFrame.outputId,
    version: 'canonical-confirmed-output-frame-v1',
    contentHash: lock.confirmedOutputFrame.confirmedOutputFrameDigestSha256,
  }
  const bindings: Partial<Record<CaptionFinishDependencyKind, CaptionDomainRef>> = {
    approved_snapshot: lock.canonicalScope.approvedSnapshotRef,
    picture_lock: pictureLockRef(lock),
    confirmed_output_frame: frameRef,
    timeline: lock.timelineBindings.timelineVersionRef,
    source_ranges: lock.timelineBindings.sourceRangesRef,
    shot_order: lock.timelineBindings.shotOrderRef,
    shot_durations: lock.timelineBindings.shotDurationsRef,
    speed_changes: lock.timelineBindings.speedChangesRef,
    transition: lock.timelineBindings.transitionsRef,
    master_timing: lock.timelineBindings.masterTimingRef,
    crop_reframe: lock.compositionBindings.cropReframeRef,
    broll_layout: lock.compositionBindings.brollLayoutRef,
    living_frame_layout: lock.compositionBindings.livingFrameLayoutRef,
    graphics_maps_charts: lock.compositionBindings.graphicsMapsChartsRef,
    lower_thirds: lock.compositionBindings.lowerThirdsRef,
    mask: lock.compositionBindings.maskTrackingAnchorRef,
    tracking: lock.compositionBindings.maskTrackingAnchorRef,
    object_anchor: lock.compositionBindings.maskTrackingAnchorRef,
    occupancy: lock.compositionBindings.occupancyRef,
    near_final_visual_proxy: lock.compositionBindings.nearFinalVisualProxyRef,
    color_proxy: lock.compositionBindings.colorLookRef,
    source_asset_manifest: lock.sourceAssetManifestRef,
  }
  return bindings[kind] ?? null
}

function pictureLockExceptionCode(
  kind: CaptionFinishDependencyKind,
): CanonicalPictureLockManifest['approvedExceptions'][number]['dependencyCode'] | null {
  const codes: Partial<Record<
    CaptionFinishDependencyKind,
    CanonicalPictureLockManifest['approvedExceptions'][number]['dependencyCode']
  >> = {
    confirmed_output_frame: 'confirmed_output_frame',
    timeline: 'timeline',
    source_ranges: 'source_ranges',
    shot_order: 'shot_order',
    shot_durations: 'shot_durations',
    speed_changes: 'speed_changes',
    crop_reframe: 'crop_reframe',
    broll_layout: 'broll_layout',
    living_frame_layout: 'living_frame_layout',
    graphics_maps_charts: 'graphics_maps_charts',
    lower_thirds: 'lower_thirds',
    mask: 'mask_tracking_anchor',
    tracking: 'mask_tracking_anchor',
    object_anchor: 'mask_tracking_anchor',
    occupancy: 'occupancy',
    near_final_visual_proxy: 'near_final_visual_proxy',
    transition: 'transitions',
    master_timing: 'master_timing',
    color_proxy: 'color_look',
    source_asset_manifest: 'source_asset_manifest',
    renderer_runtime: 'renderer_plan',
  }
  return codes[kind] ?? null
}

function exactScope(
  scope: CaptionDomainCanonicalScope,
  lock: CanonicalPictureLockManifest,
): boolean {
  return scope.ownerUserId === lock.canonicalScope.ownerUserId
    && scope.workspaceId === lock.canonicalScope.workspaceId
    && scope.projectId === lock.canonicalScope.projectId
    && scope.editSessionId === lock.canonicalScope.editSessionId
    && scope.planVersionId === lock.canonicalScope.planVersionId
    && exactRef(scope.approvedSnapshotRef, lock.canonicalScope.approvedSnapshotRef)
    && scope.outputId === lock.confirmedOutputFrame.outputId
}

function deriveDependencyRecord(
  observation: CaptionDependencyObservation,
): CaptionDependencyRecord {
  if (observation.requirement === 'not_applicable') {
    if (observation.lockedRef !== null || observation.currentRef !== null
      || observation.approvedExceptionRef !== null
      || observation.fallbackAuthorizationRef !== null
      || observation.selectedFallbackId !== null) {
      throw new Error('Not-applicable Caption dependency contains active lineage.')
    }
    return {
      ...observation,
      status: 'not_applicable',
      blockerCode: null,
      originalTreatmentReady: false,
    }
  }
  if (observation.lockedRef === null) {
    throw new Error('Required Caption dependency lacks approved locked lineage.')
  }
  if (observation.currentRef !== null
    && exactRef(observation.lockedRef, observation.currentRef)) {
    if (observation.approvedExceptionRef !== null
      || observation.fallbackAuthorizationRef !== null
      || observation.selectedFallbackId !== null) {
      throw new Error('Ready Caption dependency cannot carry fallback or exception lineage.')
    }
    return {
      ...observation,
      status: 'ready',
      blockerCode: null,
      originalTreatmentReady: true,
    }
  }
  if (observation.approvedExceptionRef !== null) {
    if (observation.fallbackAuthorizationRef !== null
      || observation.selectedFallbackId !== null) {
      throw new Error('Caption dependency cannot combine exception and fallback.')
    }
    return {
      ...observation,
      status: 'approved_exception',
      blockerCode: null,
      originalTreatmentReady: false,
    }
  }
  if (observation.fallbackAuthorizationRef !== null
    || observation.selectedFallbackId !== null) {
    if (observation.fallbackAuthorizationRef === null
      || observation.selectedFallbackId === null) {
      throw new Error('Caption fallback requires exact authorization and fallback ID.')
    }
    return {
      ...observation,
      status: 'fallback_ready',
      blockerCode: null,
      originalTreatmentReady: false,
    }
  }
  const status = observation.currentRef === null ? 'missing' as const : 'stale' as const
  return {
    ...observation,
    status,
    blockerCode: `caption_dependency.${observation.dependencyKind}.${status}`,
    originalTreatmentReady: false,
  }
}

function assertDependencySemantics(record: CaptionDependencyRecord): void {
  const derived = deriveDependencyRecord({
    dependencyId: record.dependencyId,
    dependencyKind: record.dependencyKind,
    ownerKey: record.ownerKey,
    requiredForSceneIds: record.requiredForSceneIds,
    requirement: record.requirement,
    lockedRef: record.lockedRef,
    currentRef: record.currentRef,
    approvedExceptionRef: record.approvedExceptionRef,
    fallbackAuthorizationRef: record.fallbackAuthorizationRef,
    selectedFallbackId: record.selectedFallbackId,
  })
  if (derived.status !== record.status
    || derived.blockerCode !== record.blockerCode
    || derived.originalTreatmentReady !== record.originalTreatmentReady) {
    throw new Error('Caption dependency status was not derived canonically.')
  }
}

function assertManifestCoverage(manifest: CaptionDependencyManifestV2): void {
  const sceneIds = new Set(manifest.sceneIds)
  if (sceneIds.size !== manifest.sceneIds.length) throw new Error('Duplicate Caption scene ID.')
  const dependencyIds = new Set<string>()
  for (const dependency of manifest.dependencies) {
    if (dependencyIds.has(dependency.dependencyId)
      || new Set(dependency.requiredForSceneIds).size !== dependency.requiredForSceneIds.length
      || dependency.requiredForSceneIds.some((sceneId) => !sceneIds.has(sceneId))) {
      throw new Error('Caption dependency scope is invalid.')
    }
    dependencyIds.add(dependency.dependencyId)
    assertDependencySemantics(dependency)
  }
  for (const kind of ALL_DEPENDENCY_KINDS) {
    const coveredScenes = new Set(manifest.dependencies
      .filter((dependency) => dependency.dependencyKind === kind)
      .flatMap((dependency) => dependency.requiredForSceneIds))
    if (coveredScenes.size !== sceneIds.size
      || Array.from(sceneIds).some((sceneId) => !coveredScenes.has(sceneId))) {
      throw new Error(`Caption dependency kind ${kind} lacks complete scene mapping.`)
    }
  }
}

export function parseCaptionDependencyManifest(
  value: unknown,
  pictureLockValue: unknown,
): CaptionDependencyManifestV2 {
  assertClosedContractTree(value, 'Caption dependency manifest')
  const lock = parseCanonicalPictureLockManifest(pictureLockValue)
  const parsed = manifestSchema.parse(value)
  if (!exactScope(parsed.canonicalScope, lock)
    || !exactRef(parsed.pictureLockRef, pictureLockRef(lock))
    || parsed.sceneIds.some((sceneId) => !lock.lockedSceneIds.includes(sceneId))) {
    throw new Error('Caption dependency manifest diverges from canonical picture lock.')
  }
  for (const dependency of parsed.dependencies) {
    const expected = expectedPictureLockBinding(lock, dependency.dependencyKind)
    if (expected !== null && !exactRef(dependency.lockedRef, expected)) {
      throw new Error(`Caption ${dependency.dependencyKind} dependency is not picture-lock-bound.`)
    }
    const exceptionCode = pictureLockExceptionCode(dependency.dependencyKind)
    if (dependency.status === 'approved_exception' && exceptionCode === null) {
      throw new Error(`Caption ${dependency.dependencyKind} cannot invent a picture-lock exception.`)
    }
    if (dependency.status === 'approved_exception' && exceptionCode !== null) {
      const matchingException = lock.approvedExceptions.find((exception) =>
        exception.dependencyCode === exceptionCode
        && exactRef(exception.approvalRef, dependency.approvedExceptionRef)
        && dependency.requiredForSceneIds.every((sceneId) =>
          exception.affectedSceneIds.includes(sceneId)))
      if (!matchingException) {
        throw new Error(`Caption ${dependency.dependencyKind} exception is not picture-lock-approved.`)
      }
    }
  }
  assertManifestCoverage(parsed)
  const digest = calculateSkillContractDigest(
    parsed as unknown as Record<string, unknown>,
    'manifestDigestSha256',
  )
  if (digest !== parsed.manifestDigestSha256) {
    throw new Error('Caption dependency manifest digest verification failed.')
  }
  return parsed
}

export function createCaptionDependencyManifest(input: {
  manifestId: string
  canonicalScope: unknown
  pictureLock: unknown
  earlyPlanningBundleRef: unknown
  sceneIds: unknown[]
  observations: unknown[]
}): CaptionDependencyManifestV2 {
  assertClosedContractTree(input, 'Caption dependency manifest input')
  const lock = parseCanonicalPictureLockManifest(input.pictureLock)
  const scope = scopeSchema.parse(input.canonicalScope)
  const sceneIds = z.array(safeKey).min(1).max(10_000).parse(input.sceneIds)
  const observations = input.observations.map((item) => observationSchema.parse(item))
  if (!exactScope(scope, lock)) {
    throw new Error('Caption dependency input scope diverges from picture lock.')
  }
  const withoutDigest: Omit<CaptionDependencyManifestV2, 'manifestDigestSha256'> = {
    schemaVersion: CAPTION_DEPENDENCY_MANIFEST_VERSION,
    manifestId: safeKey.parse(input.manifestId),
    canonicalScope: scope,
    pictureLockRef: pictureLockRef(lock),
    earlyPlanningBundleRef: refSchema.parse(input.earlyPlanningBundleRef),
    sceneIds,
    dependencies: observations.map(deriveDependencyRecord),
    completeDependencyMapping: true,
    unrelatedScenesMayContinue: true,
    finalRenderAuthorityClaimed: false,
    workCreationAuthorityClaimed: false,
    productionAuthorityClaimed: false,
  }
  return parseCaptionDependencyManifest({
    ...withoutDigest,
    manifestDigestSha256: calculateSkillContractDigest(
      { ...withoutDigest, manifestDigestSha256: '' },
      'manifestDigestSha256',
    ),
  }, lock)
}

export function parseCaptionFinishReadiness(
  value: unknown,
): CaptionFinishReadinessV2 {
  assertClosedContractTree(value, 'Caption finish readiness')
  const parsed = readinessSchema.parse(value)
  const sceneIds = new Set(parsed.sceneReadiness.map((scene) => scene.sceneId))
  if (sceneIds.size !== parsed.sceneReadiness.length) throw new Error('Duplicate Caption readiness scene.')
  for (const scene of parsed.sceneReadiness) {
    const gateIds = new Set(scene.gateResults.map((gate) => gate.dependencyId))
    const coveredKinds = new Set(scene.gateResults.map((gate) => gate.dependencyKind))
    const blockers = scene.gateResults.filter((gate) =>
      gate.status === 'missing' || gate.status === 'stale')
    const fallbacks = scene.gateResults.filter((gate) =>
      gate.status === 'fallback_ready' || gate.status === 'approved_exception')
    const expectedDisposition = blockers.length > 0 ? 'blocked'
      : fallbacks.length > 0 ? 'ready_with_fallback' : 'ready'
    if (gateIds.size !== scene.gateResults.length
      || ALL_DEPENDENCY_KINDS.some((kind) => !coveredKinds.has(kind))
      || scene.gateResults.some((gate) => {
        const expectsEvidence = gate.status === 'ready'
          || gate.status === 'approved_exception' || gate.status === 'fallback_ready'
        const expectsBlocker = gate.status === 'missing' || gate.status === 'stale'
        return expectsEvidence !== (gate.evidenceRef !== null)
          || expectsBlocker !== (gate.blockerCode !== null)
          || (gate.status === 'fallback_ready') !== (gate.selectedFallbackId !== null)
      })
      || scene.disposition !== expectedDisposition
      || scene.originalTreatmentReady !== (expectedDisposition === 'ready')
      || new Set(scene.blockerCodes).size !== scene.blockerCodes.length
      || scene.blockerCodes.length !== blockers.length
      || blockers.some((gate) => !scene.blockerCodes.includes(gate.blockerCode!))
      || new Set(scene.selectedFallbackIds).size !== scene.selectedFallbackIds.length
      || scene.selectedFallbackIds.length !== scene.gateResults
        .filter((gate) => gate.status === 'fallback_ready').length
      || scene.gateResults.filter((gate) => gate.status === 'fallback_ready')
        .some((gate) => !scene.selectedFallbackIds.includes(gate.selectedFallbackId!))) {
      throw new Error('Caption scene finish-readiness semantics are invalid.')
    }
  }
  const ready = parsed.sceneReadiness.filter((scene) => scene.disposition === 'ready')
    .map((scene) => scene.sceneId)
  const fallback = parsed.sceneReadiness.filter((scene) => scene.disposition === 'ready_with_fallback')
    .map((scene) => scene.sceneId)
  const blocked = parsed.sceneReadiness.filter((scene) => scene.disposition === 'blocked')
    .map((scene) => scene.sceneId)
  if (new Set(parsed.readySceneIds).size !== parsed.readySceneIds.length
    || new Set(parsed.readyWithFallbackSceneIds).size
      !== parsed.readyWithFallbackSceneIds.length
    || new Set(parsed.blockedSceneIds).size !== parsed.blockedSceneIds.length
    || ready.join('|') !== parsed.readySceneIds.join('|')
    || fallback.join('|') !== parsed.readyWithFallbackSceneIds.join('|')
    || blocked.join('|') !== parsed.blockedSceneIds.join('|')
    || parsed.allFinalCaptionScenesReady !== (blocked.length === 0)
    || parsed.lateCaptionResolutionAllowed !== (blocked.length === 0)) {
    throw new Error('Caption aggregate finish readiness is overclaimed.')
  }
  const digest = calculateSkillContractDigest(
    parsed as unknown as Record<string, unknown>,
    'readinessDigestSha256',
  )
  if (digest !== parsed.readinessDigestSha256) {
    throw new Error('Caption finish-readiness digest verification failed.')
  }
  return parsed
}

export function createCaptionFinishReadiness(input: {
  readinessId: string
  dependencyManifest: unknown
  pictureLock: unknown
}): CaptionFinishReadinessV2 {
  assertClosedContractTree(input, 'Caption finish-readiness input')
  const lock = parseCanonicalPictureLockManifest(input.pictureLock)
  const manifest = parseCaptionDependencyManifest(input.dependencyManifest, lock)
  const sceneReadiness = manifest.sceneIds.map((sceneId) => {
    const dependencies = manifest.dependencies.filter((dependency) =>
      dependency.requiredForSceneIds.includes(sceneId))
    const gateResults = dependencies.map((dependency) => ({
      dependencyId: dependency.dependencyId,
      dependencyKind: dependency.dependencyKind,
      status: dependency.status,
      evidenceRef: dependency.status === 'ready' ? dependency.currentRef
        : dependency.status === 'approved_exception' ? dependency.approvedExceptionRef
          : dependency.status === 'fallback_ready' ? dependency.fallbackAuthorizationRef
            : null,
      blockerCode: dependency.blockerCode,
      selectedFallbackId: dependency.selectedFallbackId,
    }))
    const blockers = gateResults.filter((gate) =>
      gate.status === 'missing' || gate.status === 'stale')
    const fallbackGates = gateResults.filter((gate) =>
      gate.status === 'fallback_ready' || gate.status === 'approved_exception')
    const disposition = blockers.length > 0 ? 'blocked' as const
      : fallbackGates.length > 0 ? 'ready_with_fallback' as const : 'ready' as const
    return {
      sceneId,
      disposition,
      originalTreatmentReady: disposition === 'ready',
      gateResults,
      blockerCodes: blockers.map((gate) => gate.blockerCode!),
      selectedFallbackIds: gateResults.flatMap((gate) =>
        gate.status === 'fallback_ready' && gate.selectedFallbackId
          ? [gate.selectedFallbackId] : []),
    }
  })
  const readySceneIds = sceneReadiness.filter((scene) => scene.disposition === 'ready')
    .map((scene) => scene.sceneId)
  const readyWithFallbackSceneIds = sceneReadiness
    .filter((scene) => scene.disposition === 'ready_with_fallback')
    .map((scene) => scene.sceneId)
  const blockedSceneIds = sceneReadiness.filter((scene) => scene.disposition === 'blocked')
    .map((scene) => scene.sceneId)
  const withoutDigest: Omit<CaptionFinishReadinessV2, 'readinessDigestSha256'> = {
    schemaVersion: CAPTION_FINISH_READINESS_VERSION,
    readinessId: safeKey.parse(input.readinessId),
    canonicalScope: manifest.canonicalScope,
    pictureLockRef: pictureLockRef(lock),
    dependencyManifestRef: dependencyManifestRef(manifest),
    sceneReadiness,
    readySceneIds,
    readyWithFallbackSceneIds,
    blockedSceneIds,
    allFinalCaptionScenesReady: blockedSceneIds.length === 0,
    lateCaptionResolutionAllowed: blockedSceneIds.length === 0,
    staleFinalSceneRenderAllowed: false,
    finalRenderAllowed: false,
    finalQaApprovalClaimed: false,
    productionReady: false,
  }
  return parseCaptionFinishReadiness({
    ...withoutDigest,
    readinessDigestSha256: calculateSkillContractDigest(
      { ...withoutDigest, readinessDigestSha256: '' },
      'readinessDigestSha256',
    ),
  })
}

function dependencyChanged(
  prior: CaptionDependencyRecord,
  current: CaptionDependencyRecord,
): boolean {
  return prior.dependencyKind !== current.dependencyKind
    || prior.ownerKey !== current.ownerKey
    || prior.requirement !== current.requirement
    || [...prior.requiredForSceneIds].sort().join('|')
      !== [...current.requiredForSceneIds].sort().join('|')
    || prior.status !== current.status
    || !exactRef(prior.lockedRef, current.lockedRef)
    || !exactRef(prior.currentRef, current.currentRef)
    || !exactRef(prior.approvedExceptionRef, current.approvedExceptionRef)
    || !exactRef(prior.fallbackAuthorizationRef, current.fallbackAuthorizationRef)
    || prior.selectedFallbackId !== current.selectedFallbackId
}

const REAPPROVAL_KINDS = new Set<CaptionFinishDependencyKind>([
  'approved_snapshot', 'picture_lock', 'confirmed_output_frame', 'canonical_transcript',
  'timeline', 'source_ranges', 'shot_order', 'shot_durations', 'speed_changes',
  'crop_reframe', 'broll_layout', 'living_frame_layout', 'graphics_maps_charts',
  'transition', 'master_timing', 'approval_envelope',
])

export function parseCaptionInvalidationResult(value: unknown): CaptionInvalidationResult {
  assertClosedContractTree(value, 'Caption invalidation result')
  const parsed = invalidationSchema.parse(value)
  const allScenes = new Set(parsed.allSceneIds)
  const invalidated = new Set(parsed.invalidatedSceneIds)
  const unchanged = new Set(parsed.unchangedSceneIds)
  const changedDependencyIds = new Set(parsed.changedDependencies.map((change) =>
    change.dependencyId))
  const exactlyAffected = new Set(parsed.changedDependencies.flatMap((change) =>
    change.affectedSceneIds))
  if (allScenes.size !== parsed.allSceneIds.length
    || invalidated.size !== parsed.invalidatedSceneIds.length
    || unchanged.size !== parsed.unchangedSceneIds.length
    || changedDependencyIds.size !== parsed.changedDependencies.length
    || Array.from(invalidated).some((sceneId) => unchanged.has(sceneId))
    || Array.from(allScenes).some((sceneId) =>
      !invalidated.has(sceneId) && !unchanged.has(sceneId))
    || Array.from(invalidated).some((sceneId) =>
      !allScenes.has(sceneId) || !exactlyAffected.has(sceneId))
    || Array.from(exactlyAffected).some((sceneId) => !invalidated.has(sceneId))
    || Array.from(unchanged).some((sceneId) => !allScenes.has(sceneId))
    || parsed.changedDependencies.some((change) =>
      new Set(change.affectedSceneIds).size !== change.affectedSceneIds.length
      || change.affectedSceneIds.some((sceneId) => !invalidated.has(sceneId)))
    || parsed.requiresCanonicalReapproval !== parsed.changedDependencies.some((change) =>
      REAPPROVAL_KINDS.has(change.dependencyKind))) {
    throw new Error('Caption invalidation scope or approval semantics are invalid.')
  }
  const digest = calculateSkillContractDigest(
    parsed as unknown as Record<string, unknown>,
    'invalidationDigestSha256',
  )
  if (digest !== parsed.invalidationDigestSha256) {
    throw new Error('Caption invalidation digest verification failed.')
  }
  return parsed
}

export function createCaptionInvalidationResult(input: {
  invalidationId: string
  priorManifest: unknown
  priorPictureLock: unknown
  currentManifest: unknown
  currentPictureLock: unknown
}): CaptionInvalidationResult {
  assertClosedContractTree(input, 'Caption invalidation input')
  const priorLock = parseCanonicalPictureLockManifest(input.priorPictureLock)
  const currentLock = parseCanonicalPictureLockManifest(input.currentPictureLock)
  const prior = parseCaptionDependencyManifest(input.priorManifest, priorLock)
  const current = parseCaptionDependencyManifest(input.currentManifest, currentLock)
  const allSceneIds = Array.from(new Set([...prior.sceneIds, ...current.sceneIds])).sort()
  const currentById = new Map(current.dependencies.map((item) => [item.dependencyId, item]))
  const changedDependencies: CaptionInvalidationResult['changedDependencies'] = []
  for (const priorDependency of prior.dependencies) {
    const currentDependency = currentById.get(priorDependency.dependencyId)
    if (!currentDependency || dependencyChanged(priorDependency, currentDependency)) {
      changedDependencies.push({
        dependencyId: priorDependency.dependencyId,
        dependencyKind: currentDependency?.dependencyKind ?? priorDependency.dependencyKind,
        priorRef: priorDependency.currentRef,
        currentRef: currentDependency?.currentRef ?? null,
        affectedSceneIds: Array.from(new Set([
          ...priorDependency.requiredForSceneIds,
          ...(currentDependency?.requiredForSceneIds ?? []),
        ])).sort(),
        reasonCode: `caption_dependency.${currentDependency?.dependencyKind
          ?? priorDependency.dependencyKind}.changed`,
      })
    }
    if (currentDependency) currentById.delete(priorDependency.dependencyId)
  }
  for (const currentDependency of currentById.values()) {
    changedDependencies.push({
      dependencyId: currentDependency.dependencyId,
      dependencyKind: currentDependency.dependencyKind,
      priorRef: null,
      currentRef: currentDependency.currentRef,
      affectedSceneIds: [...currentDependency.requiredForSceneIds].sort(),
      reasonCode: `caption_dependency.${currentDependency.dependencyKind}.added`,
    })
  }
  if (!exactRef(prior.pictureLockRef, current.pictureLockRef)) {
    const existing = changedDependencies.find((change) =>
      change.dependencyKind === 'picture_lock')
    if (existing) existing.affectedSceneIds = allSceneIds
    else changedDependencies.push({
      dependencyId: 'dependency.picture_lock',
      dependencyKind: 'picture_lock',
      priorRef: prior.pictureLockRef,
      currentRef: current.pictureLockRef,
      affectedSceneIds: allSceneIds,
      reasonCode: 'caption_dependency.picture_lock.changed',
    })
  }
  const invalidatedSceneIds = Array.from(new Set(
    changedDependencies.flatMap((change) => change.affectedSceneIds),
  )).sort()
  const unchangedSceneIds = allSceneIds.filter((sceneId) =>
    !invalidatedSceneIds.includes(sceneId))
  const withoutDigest: Omit<CaptionInvalidationResult, 'invalidationDigestSha256'> = {
    schemaVersion: CAPTION_INVALIDATION_RESULT_VERSION,
    invalidationId: safeKey.parse(input.invalidationId),
    priorDependencyManifestRef: dependencyManifestRef(prior),
    currentDependencyManifestRef: dependencyManifestRef(current),
    allSceneIds,
    changedDependencies,
    invalidatedSceneIds,
    unchangedSceneIds,
    requiresCanonicalReapproval: changedDependencies.some((change) =>
      REAPPROVAL_KINDS.has(change.dependencyKind)),
    unrelatedScenesMayContinue: true,
    automaticRenderAllowed: false,
    productionAuthorityClaimed: false,
  }
  return parseCaptionInvalidationResult({
    ...withoutDigest,
    invalidationDigestSha256: calculateSkillContractDigest(
      { ...withoutDigest, invalidationDigestSha256: '' },
      'invalidationDigestSha256',
    ),
  })
}

const FORWARD_TRANSITIONS: Readonly<Partial<Record<
  CaptionLifecycleStateV2,
  CaptionLifecycleStateV2[]
>>> = Object.freeze({
  strategy_draft: ['strategy_reviewable'],
  strategy_reviewable: ['strategy_approved', 'strategy_draft'],
  strategy_approved: ['opportunities_mapped'],
  opportunities_mapped: ['space_reserved'],
  space_reserved: ['blocking_ready'],
  blocking_ready: ['awaiting_picture_lock'],
  awaiting_picture_lock: ['finish_readiness_blocked', 'finish_ready'],
  finish_readiness_blocked: ['finish_ready', 'revision_required'],
  finish_ready: ['choreography_resolving'],
  choreography_resolving: ['choreography_resolved'],
  choreography_resolved: ['storytiming_locked'],
  storytiming_locked: ['sound_handoff_ready'],
  sound_handoff_ready: ['render_ready'],
  render_ready: ['rendered'],
  rendered: ['qa_warning', 'qa_failed', 'qa_passed'],
  qa_warning: ['qa_passed', 'revision_required'],
  qa_failed: ['revision_required'],
  qa_passed: ['delivery_ready'],
  stale: ['revision_required', 'superseded'],
  revision_required: ['strategy_draft', 'awaiting_picture_lock', 'finish_readiness_blocked'],
})

function transitionAllowed(
  from: CaptionLifecycleStateV2 | null,
  to: CaptionLifecycleStateV2,
): boolean {
  if (from === null) return to === 'strategy_draft'
  if (to === 'superseded') return from !== 'superseded'
  if (to === 'stale') return from !== 'stale' && from !== 'superseded'
  return FORWARD_TRANSITIONS[from]?.includes(to) ?? false
}

export function parseCaptionLifecycleRecord(value: unknown): CaptionLifecycleRecordV2 {
  assertClosedContractTree(value, 'Caption lifecycle record')
  const parsed = lifecycleSchema.parse(value)
  if ((parsed.priorLifecycleRef === null) !== (parsed.fromState === null)
    || !transitionAllowed(parsed.fromState, parsed.toState)
    || new Set(parsed.affectedSceneIds).size !== parsed.affectedSceneIds.length) {
    throw new Error('Caption lifecycle transition is invalid.')
  }
  const digest = calculateSkillContractDigest(
    parsed as unknown as Record<string, unknown>,
    'lifecycleRecordDigestSha256',
  )
  if (digest !== parsed.lifecycleRecordDigestSha256) {
    throw new Error('Caption lifecycle digest verification failed.')
  }
  return parsed
}

export function createCaptionLifecycleRecord(input: Omit<CaptionLifecycleRecordV2,
  | 'schemaVersion'
  | 'lifecycleRecordDigestSha256'
  | 'appendOnly'
  | 'approvedVersionOverwritten'
  | 'globalWorkflowOwnerChanged'
  | 'runtimeExecutionAuthorityClaimed'
  | 'productionAuthorityClaimed'
>): CaptionLifecycleRecordV2 {
  assertClosedContractTree(input, 'Caption lifecycle input')
  const withoutDigest: Omit<CaptionLifecycleRecordV2, 'lifecycleRecordDigestSha256'> = {
    ...structuredClone(input),
    schemaVersion: CAPTION_LIFECYCLE_RECORD_VERSION,
    appendOnly: true,
    approvedVersionOverwritten: false,
    globalWorkflowOwnerChanged: false,
    runtimeExecutionAuthorityClaimed: false,
    productionAuthorityClaimed: false,
  }
  return parseCaptionLifecycleRecord({
    ...withoutDigest,
    lifecycleRecordDigestSha256: calculateSkillContractDigest(
      { ...withoutDigest, lifecycleRecordDigestSha256: '' },
      'lifecycleRecordDigestSha256',
    ),
  })
}
