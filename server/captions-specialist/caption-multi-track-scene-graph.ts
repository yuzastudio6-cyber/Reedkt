import { z } from 'zod'
import {
  CAPTION_BROLL_OWNER_READ_BINDING_VERSION,
  CAPTION_MULTI_TRACK_SCENE_GRAPH_VERSION,
  type CaptionBrollOwnerReadBinding,
  type CaptionMultiTrackSceneGraph,
  type CaptionSceneGraphProposal,
  type CaptionSceneNode,
  type CaptionSceneNodeProposal,
  type CaptionSceneTrack,
} from '../../src/types/caption-multi-track-scene-graph'
import type {
  AnyCaptionDomainContract,
  CaptionDomainCanonicalScope,
  CaptionDomainContract,
  CaptionDomainRef,
} from '../../src/types/caption-domain-contracts'
import type { CaptionTrackAllAdmission } from '../../src/types/caption-track-all-support'
import { assertClosedContractTree } from '../../src/lib/closed-contract-validation'
import { calculateSkillContractDigest } from '../orchestra/orchestra-skill-contracts'
import { parseCaptionDomainContract } from './caption-domain-contracts'
import { parseCaptionSemanticStylePlan } from './caption-semantic-style'
import { parseCaptionPhraseLineageProjection } from './caption-transcript-lineage'
import {
  parseCaptionFinalVisualHierarchy,
  parseCaptionVisualOccupancyManifest,
} from './caption-visual-intelligence-support'
import { parseCaptionTrackAllAdmission } from './caption-track-all-support'

function containsControlCharacter(value: string): boolean {
  return Array.from(value).some((character) => {
    const codePoint = character.codePointAt(0) ?? 0
    return codePoint < 32 || codePoint === 127
  })
}

const safeKey = z.string().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
const safeCode = z.string().min(1).max(240)
  .refine((value) => !containsControlCharacter(value))
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const refSchema = z.object({ id: safeKey, version: safeKey, contentHash: sha256 }).strict()
const frameRangeSchema = z.object({
  startFrame: z.number().int().nonnegative(),
  endFrameExclusive: z.number().int().positive(),
}).strict().refine((range) => range.endFrameExclusive > range.startFrame)
const scopeSchema = z.object({
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
const trackRoleSchema = z.enum([
  'verbatim_speech', 'semantic_phrase', 'active_word', 'hero_typography',
  'persistent_topic_list', 'quote', 'speaker_attribution', 'caption_to_visual',
  'accessible_sidecar', 'localized_accessible',
])
const depthSchema = z.enum([
  'far_background', 'environmental_background', 'behind_subject', 'subject_plane',
  'speaker_adjacent', 'object_attached', 'in_front_of_subject', 'foreground_hero',
  'full_screen', 'safe_accessible',
])
const compositionRoleSchema = z.enum([
  'caption_only', 'subject_occlusion', 'object_anchor', 'environmental_surface',
  'broll_shared_frame', 'full_screen_hero',
])
const semanticRoleSchema = z.enum([
  'primary_statement', 'supporting_detail', 'contrast', 'question', 'quotation',
  'speaker_identity', 'warning_or_conflict', 'positive_result', 'hero_concept',
  'historical_context', 'technical_term',
])
const modeSchema = z.enum([
  'clean_verbatim', 'spatial_sentence', 'hero_typography', 'minimal_emotional',
  'persistent_list', 'caption_to_visual',
])

const brollBindingSchema: z.ZodType<CaptionBrollOwnerReadBinding> = z.object({
  schemaVersion: z.literal(CAPTION_BROLL_OWNER_READ_BINDING_VERSION),
  bindingId: safeKey,
  bindingDigestSha256: sha256,
  canonicalScope: scopeSchema,
  requestedSceneId: safeKey,
  planningConstraintRef: refSchema,
  ownerRequestRef: refSchema.nullable(),
  ownerResultRef: refSchema.nullable(),
  selectedMediaManifestRef: refSchema.nullable(),
  layoutOccupancyRef: refSchema.nullable(),
  cropTimingRef: refSchema.nullable(),
  visibleTextEvidenceRef: refSchema.nullable(),
  bindingState: z.enum([
    'not_applicable', 'planning_constraints_only', 'authenticated_owner_ready',
  ]),
  evidenceMode: z.enum(['contract_fixture', 'authenticated_private_runtime']),
  exactOwnerResultRereadVerified: z.boolean(),
  exactScopeFrameAndTimingVerified: z.boolean(),
  mediaBytesIncluded: z.literal(false),
  mediaLocatorIncluded: z.literal(false),
  sourceSelectionPerformedByCaption: z.literal(false),
  cropOrTimingPerformedByCaption: z.literal(false),
  runtimeOrDispatchAuthorityGranted: z.literal(false),
  assetMutationAuthorityGranted: z.literal(false),
  finalQaApprovalGranted: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()

const trackSchema: z.ZodType<CaptionSceneTrack> = z.object({
  trackId: safeKey,
  role: trackRoleSchema,
  priority: z.enum(['mandatory_accessibility', 'primary', 'supporting', 'accent']),
  rendererPreference: z.enum(['remotion', 'libass', 'sidecar_only']),
  phraseIds: z.array(safeKey).min(1).max(4_096),
  persistence: z.enum(['phrase_bound', 'scene_bound', 'accumulates_until_clear']),
  conflictPolicy: z.enum([
    'accessible_wins', 'higher_semantic_priority_wins',
    'coexist_only_in_separate_regions',
  ]),
  accessibleCompletenessRequired: z.boolean(),
  reducedMotionCounterpartRequired: z.boolean(),
  deliberateRestraintReasonCode: safeCode.nullable(),
}).strict()

const nodeSchema: z.ZodType<CaptionSceneNode> = z.object({
  nodeId: safeKey,
  trackId: safeKey,
  phraseId: safeKey,
  semanticRole: semanticRoleSchema,
  exactSourceWordIds: z.array(safeKey).min(1).max(256),
  typographyRoleId: safeKey,
  colorRoleId: safeKey,
  fontResolutionRef: refSchema,
  selectedLineCandidateId: safeKey,
  timingRequirementRef: refSchema,
  compositionRole: compositionRoleSchema,
  requestedRegionId: safeKey,
  resolvedRegionId: safeKey,
  requestedDepthPlane: depthSchema,
  resolvedDepthPlane: depthSchema,
  depthDisposition: z.enum([
    'admitted', 'fallback_safe_top_plane', 'fallback_speaker_adjacent',
    'fallback_caption_only',
  ]),
  trackAllAdmissionRef: refSchema.nullable(),
  maskSequenceRef: refSchema.nullable(),
  trackManifestRef: refSchema.nullable(),
  objectAnchorRef: refSchema.nullable(),
  brollOwnerBindingRef: refSchema.nullable(),
  occlusionPolicy: z.object({
    intentional: z.boolean(),
    maximumHiddenAreaBasisPoints: z.number().int().min(0).max(10_000),
    maximumHiddenDurationFrames: z.number().int().min(0).max(10_000),
    criticalTokenOcclusionAllowed: z.literal(false),
    accessibleCounterpartVisibleThroughout: z.literal(true),
  }).strict(),
  motionIntentRef: z.null(),
  soundEligibility: z.enum(['required', 'optional', 'forbidden']),
  accessibilityCounterpartNodeId: safeKey.nullable(),
  qaRequirementCodes: z.array(safeCode).min(1).max(64),
  fallbackCode: safeCode,
  storyTimingFramesResolved: z.literal(false),
  renderExecutionReady: z.literal(false),
}).strict()

const listSchema = z.object({
  listId: safeKey,
  trackId: safeKey,
  titlePhraseId: safeKey.nullable(),
  entries: z.array(z.object({
    entryId: safeKey,
    phraseId: safeKey,
    accumulationOrder: z.number().int().positive().max(1_000),
    retainAfterReveal: z.literal(true),
    accessibleCounterpartNodeId: safeKey,
  }).strict()).min(1).max(32),
  clearCondition: z.enum(['scene_end', 'explicit_handoff', 'explicit_clear_event']),
  maximumVisibleEntries: z.number().int().min(1).max(12),
  priorEntriesRemainStable: z.literal(true),
  oneAtATimeSubtitleBehavior: z.literal(false),
}).strict()
const edgeSchema = z.object({
  edgeId: safeKey,
  fromNodeId: safeKey,
  toNodeId: safeKey,
  edgeKind: z.enum([
    'sequence', 'simultaneous', 'accessibility_counterpart', 'accumulates', 'handoff',
  ]),
}).strict()
const modePhaseSchema = z.object({
  phaseId: safeKey,
  mode: modeSchema,
  activeTrackIds: z.array(safeKey).min(1).max(16),
  activeNodeIds: z.array(safeKey).min(1).max(64),
  storyTimingRequirementRef: refSchema,
  switchReasonCode: safeCode,
  transitionOwnerRequestRef: refSchema.nullable(),
  executableFramesResolved: z.literal(false),
  randomPhraseLevelSwitchingAllowed: z.literal(false),
}).strict()

const graphSchema: z.ZodType<CaptionMultiTrackSceneGraph> = z.object({
  schemaVersion: z.literal(CAPTION_MULTI_TRACK_SCENE_GRAPH_VERSION),
  graphId: safeKey,
  graphDigestSha256: sha256,
  canonicalScope: scopeSchema,
  semanticStylePlanRef: refSchema,
  phraseLineageProjectionRef: refSchema,
  styleProfileRef: refSchema,
  approvalEnvelopeRef: refSchema,
  confirmedOutputFrameRef: refSchema,
  pictureLockRef: refSchema,
  finishReadinessRef: refSchema,
  occupancyManifestRef: refSchema,
  visualHierarchyRef: refSchema,
  trackAllAdmissionRefs: z.array(refSchema).max(64),
  brollOwnerBindingRef: refSchema,
  tracks: z.array(trackSchema).min(1).max(64),
  nodes: z.array(nodeSchema).min(1).max(4_096),
  persistentLists: z.array(listSchema).max(64),
  edges: z.array(edgeSchema).max(8_192),
  modePhases: z.array(modePhaseSchema).min(1).max(128),
  maximumConcurrentTrackCount: z.number().int().min(1).max(8),
  maximumHeroMomentCount: z.number().int().nonnegative().max(64),
  selectedHeroMomentCount: z.number().int().nonnegative().max(64),
  selectedCreativeTrackCount: z.number().int().nonnegative().max(64),
  accessibleTrackCount: z.number().int().positive().max(64),
  structuralDisposition: z.enum([
    'ready_for_storytiming_resolution', 'ready_with_declared_fallbacks',
    'blocked_structural_validation',
  ]),
  blockerCodes: z.array(safeCode).max(256),
  fallbackCodesApplied: z.array(safeCode).max(256),
  accessibleCompleteWordingRetained: z.literal(true),
  fewestUsefulTracksPolicyApplied: z.literal(true),
  captionAboveLivingFrameByDefault: z.literal(true),
  accessibleCaptionAboveAllVisuals: z.literal(true),
  brollOwnerRetained: z.literal(true),
  trackAllOwnerRetained: z.literal(true),
  storyTimingSoleFrameAuthority: z.literal(true),
  remotionRemainsFinalCanvas: z.literal(true),
  modelAuthoredCodeIncluded: z.literal(false),
  mediaBytesIncluded: z.literal(false),
  runtimeExecutionGranted: z.literal(false),
  assetCreationGranted: z.literal(false),
  finalQaApprovalGranted: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()

const trackProposalSchema = z.object({
  trackId: safeKey,
  role: trackRoleSchema,
  priority: z.enum(['mandatory_accessibility', 'primary', 'supporting', 'accent']),
  rendererPreference: z.enum(['remotion', 'libass', 'sidecar_only']),
  phraseIds: z.array(safeKey).min(1).max(4_096),
  persistence: z.enum(['phrase_bound', 'scene_bound', 'accumulates_until_clear']),
  conflictPolicy: z.enum([
    'accessible_wins', 'higher_semantic_priority_wins',
    'coexist_only_in_separate_regions',
  ]),
  reducedMotionCounterpartRequired: z.boolean(),
  deliberateRestraintReasonCode: safeCode.nullable(),
}).strict()
const nodeProposalSchema: z.ZodType<CaptionSceneNodeProposal> = z.object({
  nodeId: safeKey,
  trackId: safeKey,
  phraseId: safeKey,
  timingRequirementRef: refSchema,
  compositionRole: compositionRoleSchema,
  requestedRegionId: safeKey,
  requestedDepthPlane: depthSchema,
  trackAllAdmissionId: safeKey.nullable(),
  accessibilityCounterpartNodeId: safeKey.nullable(),
  maximumHiddenAreaBasisPoints: z.number().int().min(0).max(10_000),
  maximumHiddenDurationFrames: z.number().int().min(0).max(10_000),
  soundEligibility: z.enum(['required', 'optional', 'forbidden']),
  qaRequirementCodes: z.array(safeCode).min(1).max(64),
  fallbackCode: safeCode,
}).strict()
const proposalSchema: z.ZodType<CaptionSceneGraphProposal> = z.object({
  tracks: z.array(trackProposalSchema).min(1).max(64),
  nodes: z.array(nodeProposalSchema).min(1).max(4_096),
  persistentLists: z.array(listSchema).max(64),
  edges: z.array(edgeSchema).max(8_192),
  modePhases: z.array(modePhaseSchema).min(1).max(128),
}).strict()

function exactRef(left: CaptionDomainRef, right: CaptionDomainRef): boolean {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}

function refKey(ref: CaptionDomainRef): string {
  return `${ref.id}\u0000${ref.version}\u0000${ref.contentHash}`
}

function scopeKey(scope: CaptionDomainCanonicalScope): string {
  return calculateSkillContractDigest({ scope, scopeDigestSha256: '' }, 'scopeDigestSha256')
}

function exactScope(left: CaptionDomainCanonicalScope, right: CaptionDomainCanonicalScope): boolean {
  return scopeKey(left) === scopeKey(right)
}

function recordRef(id: string, version: string, digest: string): CaptionDomainRef {
  return { id, version, contentHash: digest }
}

function verifyDigest<T extends Record<string, unknown>>(
  value: T,
  field: keyof T & string,
  label: string,
): void {
  const expected = calculateSkillContractDigest(value, field)
  if (expected !== value[field]) throw new Error(`${label} digest verification failed.`)
}

function requireDomainContract<K extends 'style_profile' | 'approval_envelope'>(
  value: unknown,
  kind: K,
): CaptionDomainContract<K> {
  const parsed: AnyCaptionDomainContract = parseCaptionDomainContract(value)
  if (parsed.contractKind !== kind) {
    throw new Error(`CAP-11 requires an exact ${kind} contract.`)
  }
  return parsed as CaptionDomainContract<K>
}

function brollBindingRef(binding: CaptionBrollOwnerReadBinding): CaptionDomainRef {
  return recordRef(binding.bindingId, binding.schemaVersion, binding.bindingDigestSha256)
}

function graphRef(graph: CaptionMultiTrackSceneGraph): CaptionDomainRef {
  return recordRef(graph.graphId, graph.schemaVersion, graph.graphDigestSha256)
}

function isAccessibleRole(role: CaptionSceneTrack['role']): boolean {
  return role === 'accessible_sidecar' || role === 'localized_accessible'
}

function graphHasCycle(graph: CaptionMultiTrackSceneGraph): boolean {
  const directedKinds = new Set(['sequence', 'accumulates', 'handoff'])
  const adjacency = new Map(graph.nodes.map((node) => [node.nodeId, [] as string[]]))
  const indegree = new Map(graph.nodes.map((node) => [node.nodeId, 0]))
  for (const edge of graph.edges) {
    if (!directedKinds.has(edge.edgeKind)) continue
    adjacency.get(edge.fromNodeId)!.push(edge.toNodeId)
    indegree.set(edge.toNodeId, (indegree.get(edge.toNodeId) ?? 0) + 1)
  }
  const queue = [...indegree.entries()].filter(([, count]) => count === 0)
    .map(([id]) => id)
  let visited = 0
  while (queue.length > 0) {
    const nodeId = queue.shift()!
    visited += 1
    for (const next of adjacency.get(nodeId) ?? []) {
      const nextCount = (indegree.get(next) ?? 0) - 1
      indegree.set(next, nextCount)
      if (nextCount === 0) queue.push(next)
    }
  }
  return visited !== graph.nodes.length
}

function modeMatchesTracks(
  mode: CaptionMultiTrackSceneGraph['modePhases'][number]['mode'],
  tracks: CaptionSceneTrack[],
): boolean {
  const roles = new Set(tracks.map((track) => track.role))
  if (mode === 'hero_typography') return roles.has('hero_typography')
  if (mode === 'persistent_list') return roles.has('persistent_topic_list')
  if (mode === 'caption_to_visual') return roles.has('caption_to_visual')
  if (mode === 'clean_verbatim') {
    return roles.has('verbatim_speech') || roles.has('accessible_sidecar')
  }
  return true
}

export function parseCaptionBrollOwnerReadBinding(
  value: unknown,
): CaptionBrollOwnerReadBinding {
  assertClosedContractTree(value, 'Caption B-roll owner read binding')
  const parsed = brollBindingSchema.parse(value)
  const ownerFields = [
    parsed.ownerRequestRef, parsed.ownerResultRef, parsed.selectedMediaManifestRef,
    parsed.layoutOccupancyRef, parsed.cropTimingRef, parsed.visibleTextEvidenceRef,
  ]
  const ready = parsed.bindingState === 'authenticated_owner_ready'
  if (parsed.canonicalScope.sceneId !== parsed.requestedSceneId
    || (ready && (parsed.evidenceMode !== 'authenticated_private_runtime'
      || ownerFields.some((item) => item === null)
      || !parsed.exactOwnerResultRereadVerified
      || !parsed.exactScopeFrameAndTimingVerified))
    || (!ready && (parsed.exactOwnerResultRereadVerified
      || parsed.exactScopeFrameAndTimingVerified))
    || (parsed.bindingState === 'not_applicable'
      && ownerFields.some((item) => item !== null))
    || (parsed.bindingState === 'planning_constraints_only'
      && [parsed.ownerResultRef, parsed.selectedMediaManifestRef, parsed.layoutOccupancyRef,
        parsed.cropTimingRef, parsed.visibleTextEvidenceRef].some((item) => item !== null))) {
    throw new Error('Caption B-roll owner binding overclaims readiness or scope.')
  }
  verifyDigest(
    parsed as unknown as Record<string, unknown>,
    'bindingDigestSha256',
    'Caption B-roll owner binding',
  )
  return parsed
}

export function createCaptionBrollOwnerReadBinding(input: Omit<
  CaptionBrollOwnerReadBinding,
  'schemaVersion' | 'bindingDigestSha256'
>): CaptionBrollOwnerReadBinding {
  if (input.bindingState === 'authenticated_owner_ready') {
    throw new Error('Caption cannot manufacture an authenticated B-roll owner result.')
  }
  const withoutDigest = {
    ...structuredClone(input),
    schemaVersion: CAPTION_BROLL_OWNER_READ_BINDING_VERSION,
  }
  return parseCaptionBrollOwnerReadBinding({
    ...withoutDigest,
    bindingDigestSha256: calculateSkillContractDigest(
      { ...withoutDigest, bindingDigestSha256: '' },
      'bindingDigestSha256',
    ),
  })
}

export function parseCaptionMultiTrackSceneGraph(
  value: unknown,
): CaptionMultiTrackSceneGraph {
  assertClosedContractTree(value, 'Caption multi-track scene graph')
  const graph = graphSchema.parse(value)
  const trackIds = new Set(graph.tracks.map((track) => track.trackId))
  const nodeIds = new Set(graph.nodes.map((node) => node.nodeId))
  const phraseIds = new Set(graph.nodes.map((node) => node.phraseId))
  const accessibleTracks = graph.tracks.filter((track) => isAccessibleRole(track.role))
  const creativeTracks = graph.tracks.filter((track) => !isAccessibleRole(track.role))
  const heroNodeCount = graph.nodes.filter((node) => {
    const track = graph.tracks.find((item) => item.trackId === node.trackId)
    return track?.role === 'hero_typography'
  }).length
  if (trackIds.size !== graph.tracks.length
    || nodeIds.size !== graph.nodes.length
    || new Set(graph.edges.map((edge) => edge.edgeId)).size !== graph.edges.length
    || new Set(graph.modePhases.map((phase) => phase.phaseId)).size !== graph.modePhases.length
    || new Set(graph.trackAllAdmissionRefs.map(refKey)).size !== graph.trackAllAdmissionRefs.length
    || graph.accessibleTrackCount !== accessibleTracks.length
    || graph.selectedCreativeTrackCount !== creativeTracks.length
    || graph.selectedHeroMomentCount !== heroNodeCount
    || heroNodeCount > graph.maximumHeroMomentCount
    || graphHasCycle(graph)) {
    throw new Error('Caption scene graph identity, count, hero, or cycle semantics are invalid.')
  }
  for (const track of graph.tracks) {
    const trackNodePhraseIds = graph.nodes.filter((node) => node.trackId === track.trackId)
      .map((node) => node.phraseId)
    if (new Set(track.phraseIds).size !== track.phraseIds.length
      || trackNodePhraseIds.length !== track.phraseIds.length
      || trackNodePhraseIds.some((phraseId) => !track.phraseIds.includes(phraseId))
      || isAccessibleRole(track.role) !== track.accessibleCompletenessRequired
      || (isAccessibleRole(track.role)
        && (track.priority !== 'mandatory_accessibility'
          || track.conflictPolicy !== 'accessible_wins'))
      || (track.role === 'hero_typography' && track.rendererPreference !== 'remotion')
      || (track.role === 'persistent_topic_list'
        && track.persistence !== 'accumulates_until_clear')) {
      throw new Error(`Caption scene track ${track.trackId} is inconsistent.`)
    }
  }
  for (const node of graph.nodes) {
    const track = graph.tracks.find((item) => item.trackId === node.trackId)
    if (!track || !track.phraseIds.includes(node.phraseId)
      || new Set(node.exactSourceWordIds).size !== node.exactSourceWordIds.length
      || (node.depthDisposition === 'admitted')
        !== (node.requestedDepthPlane === node.resolvedDepthPlane
          && node.requestedRegionId === node.resolvedRegionId)
      || (node.resolvedDepthPlane === 'safe_accessible') !== isAccessibleRole(track.role)
      || (isAccessibleRole(track.role)
        && (node.accessibilityCounterpartNodeId !== null
          || node.trackAllAdmissionRef !== null
          || node.maskSequenceRef !== null
          || node.trackManifestRef !== null
          || node.objectAnchorRef !== null
          || node.occlusionPolicy.intentional))
      || (!node.occlusionPolicy.intentional
        && (node.occlusionPolicy.maximumHiddenAreaBasisPoints !== 0
          || node.occlusionPolicy.maximumHiddenDurationFrames !== 0))
      || (node.trackAllAdmissionRef === null)
        !== (node.maskSequenceRef === null && node.trackManifestRef === null
          && node.objectAnchorRef === null)
      || (node.compositionRole === 'full_screen_hero'
        && (track.role !== 'hero_typography' || node.resolvedDepthPlane !== 'full_screen'))
      || (track.role === 'active_word' && node.soundEligibility === 'required')) {
      throw new Error(`Caption scene node ${node.nodeId} is inconsistent.`)
    }
    if (!isAccessibleRole(track.role)) {
      const counterpart = graph.nodes.find((item) =>
        item.nodeId === node.accessibilityCounterpartNodeId)
      const counterpartTrack = counterpart
        ? graph.tracks.find((item) => item.trackId === counterpart.trackId) : null
      const hasEdge = graph.edges.some((edge) => edge.edgeKind === 'accessibility_counterpart'
        && ((edge.fromNodeId === node.nodeId && edge.toNodeId === counterpart?.nodeId)
          || (edge.toNodeId === node.nodeId && edge.fromNodeId === counterpart?.nodeId)))
      if (!counterpart || !counterpartTrack || !isAccessibleRole(counterpartTrack.role)
        || counterpart.phraseId !== node.phraseId
        || counterpart.exactSourceWordIds.join('|') !== node.exactSourceWordIds.join('|')
        || !hasEdge) {
        throw new Error(`Caption scene node ${node.nodeId} lacks a complete accessible counterpart.`)
      }
    }
  }
  for (const edge of graph.edges) {
    if (!nodeIds.has(edge.fromNodeId) || !nodeIds.has(edge.toNodeId)
      || edge.fromNodeId === edge.toNodeId) {
      throw new Error(`Caption scene edge ${edge.edgeId} is dangling or self-referential.`)
    }
  }
  for (const list of graph.persistentLists) {
    const track = graph.tracks.find((item) => item.trackId === list.trackId)
    const orders = list.entries.map((entry) => entry.accumulationOrder)
    if (!track || track.role !== 'persistent_topic_list'
      || new Set(list.entries.map((entry) => entry.entryId)).size !== list.entries.length
      || list.entries.length > list.maximumVisibleEntries
      || orders.some((order, index) => order !== index + 1)
      || list.entries.some((entry) => !phraseIds.has(entry.phraseId)
        || !nodeIds.has(entry.accessibleCounterpartNodeId))) {
      throw new Error(`Caption persistent list ${list.listId} is invalid.`)
    }
  }
  for (const phase of graph.modePhases) {
    const tracks = phase.activeTrackIds.map((trackId) =>
      graph.tracks.find((track) => track.trackId === trackId))
    const activeNodes = phase.activeNodeIds.map((nodeId) =>
      graph.nodes.find((node) => node.nodeId === nodeId))
    if (new Set(phase.activeTrackIds).size !== phase.activeTrackIds.length
      || new Set(phase.activeNodeIds).size !== phase.activeNodeIds.length
      || tracks.some((track) => !track)
      || activeNodes.some((node) => !node)
      || activeNodes.some((node) => node && !phase.activeTrackIds.includes(node.trackId))
      || tracks.some((track) => track && !activeNodes.some((node) =>
        node?.trackId === track.trackId))
      || phase.activeTrackIds.length > graph.maximumConcurrentTrackCount
      || !modeMatchesTracks(phase.mode, tracks as CaptionSceneTrack[])
      || !tracks.some((track) => track && isAccessibleRole(track.role))
      || activeNodes.some((node) => {
        if (!node) return true
        const track = graph.tracks.find((item) => item.trackId === node.trackId)
        if (!track || isAccessibleRole(track.role)) return false
        return !activeNodes.some((candidate) =>
          candidate?.nodeId === node.accessibilityCounterpartNodeId)
      })
      || new Set(activeNodes.map((node) => node!.resolvedRegionId)).size
        !== activeNodes.length) {
      throw new Error(`Caption scene mode phase ${phase.phaseId} is invalid.`)
    }
  }
  const expectedFallbackDisposition = graph.fallbackCodesApplied.length > 0
    ? 'ready_with_declared_fallbacks' : 'ready_for_storytiming_resolution'
  if (graph.structuralDisposition !== expectedFallbackDisposition
    || graph.blockerCodes.includes('structural_validation_failed')) {
    throw new Error('Caption scene graph structural disposition is inconsistent.')
  }
  verifyDigest(
    graph as unknown as Record<string, unknown>,
    'graphDigestSha256',
    'Caption multi-track scene graph',
  )
  return graph
}

interface TrackAllAdmissionBundleInput {
  admission: unknown
  packet: unknown
  payload: unknown
  supportRequest: unknown
}

function admissionRef(admission: CaptionTrackAllAdmission): CaptionDomainRef {
  return recordRef(
    admission.admissionId,
    admission.schemaVersion,
    admission.admissionDigestSha256,
  )
}

function safeRegion(
  occupancy: ReturnType<typeof parseCaptionVisualOccupancyManifest>,
): { accessible: string; creative: string } {
  const accessible = occupancy.provisionalSelectedCandidateRegionId
  if (!accessible) throw new Error('CAP-11 requires a deterministic safe Caption region.')
  return {
    accessible,
    creative: occupancy.provisionalFallbackCandidateRegionIds[0] ?? accessible,
  }
}

function resolveNodeDepth(input: {
  proposal: CaptionSceneNodeProposal
  track: CaptionSceneTrack
  accessibleRegionId: string
  creativeFallbackRegionId: string
  approval: CaptionDomainContract<'approval_envelope'>['payload']
  admission: CaptionTrackAllAdmission | null
  broll: CaptionBrollOwnerReadBinding
}): Pick<CaptionSceneNode,
  | 'resolvedRegionId' | 'resolvedDepthPlane' | 'depthDisposition'
  | 'trackAllAdmissionRef' | 'maskSequenceRef' | 'trackManifestRef'
  | 'objectAnchorRef' | 'brollOwnerBindingRef' | 'occlusionPolicy'> {
  const {
    proposal, track, accessibleRegionId, creativeFallbackRegionId,
    approval, admission, broll,
  } = input
  const accessible = isAccessibleRole(track.role)
  if (accessible) {
    return {
      resolvedRegionId: accessibleRegionId,
      resolvedDepthPlane: 'safe_accessible',
      depthDisposition: proposal.requestedRegionId === accessibleRegionId
        && proposal.requestedDepthPlane === 'safe_accessible'
        ? 'admitted' : 'fallback_safe_top_plane',
      trackAllAdmissionRef: null,
      maskSequenceRef: null,
      trackManifestRef: null,
      objectAnchorRef: null,
      brollOwnerBindingRef: null,
      occlusionPolicy: {
        intentional: false,
        maximumHiddenAreaBasisPoints: 0,
        maximumHiddenDurationFrames: 0,
        criticalTokenOcclusionAllowed: false,
        accessibleCounterpartVisibleThroughout: true,
      },
    }
  }
  const subject = admission?.subjectAdmissions[0] ?? null
  const admittedOcclusion = proposal.compositionRole === 'subject_occlusion'
    && approval.subjectOverlapAllowed
    && admission?.textBehindSubjectAllowed === true
    && subject?.maskSequenceRef !== null
    && subject?.maskSequenceRef !== undefined
  const admittedAnchor = (proposal.compositionRole === 'object_anchor'
      || proposal.compositionRole === 'environmental_surface')
    && approval.objectAnchoringAllowed
    && admission?.objectAnchorAllowed === true
    && subject?.anchorManifestRef !== null
    && subject?.anchorManifestRef !== undefined
  const admittedBroll = proposal.compositionRole === 'broll_shared_frame'
    && broll.bindingState === 'authenticated_owner_ready'
  const needsEvidence = ['subject_occlusion', 'object_anchor', 'environmental_surface']
    .includes(proposal.compositionRole)
  if (admittedOcclusion || admittedAnchor) {
    return {
      resolvedRegionId: proposal.requestedRegionId,
      resolvedDepthPlane: proposal.requestedDepthPlane,
      depthDisposition: 'admitted',
      trackAllAdmissionRef: admissionRef(admission!),
      maskSequenceRef: subject!.maskSequenceRef,
      trackManifestRef: subject!.trackManifestRef,
      objectAnchorRef: admittedAnchor ? subject!.anchorManifestRef : null,
      brollOwnerBindingRef: null,
      occlusionPolicy: {
        intentional: true,
        maximumHiddenAreaBasisPoints: Math.min(proposal.maximumHiddenAreaBasisPoints, 3_000),
        maximumHiddenDurationFrames: Math.min(proposal.maximumHiddenDurationFrames, 15),
        criticalTokenOcclusionAllowed: false,
        accessibleCounterpartVisibleThroughout: true,
      },
    }
  }
  if (admittedBroll) {
    return {
      resolvedRegionId: proposal.requestedRegionId,
      resolvedDepthPlane: proposal.requestedDepthPlane,
      depthDisposition: 'admitted',
      trackAllAdmissionRef: null,
      maskSequenceRef: null,
      trackManifestRef: null,
      objectAnchorRef: null,
      brollOwnerBindingRef: brollBindingRef(broll),
      occlusionPolicy: {
        intentional: false,
        maximumHiddenAreaBasisPoints: 0,
        maximumHiddenDurationFrames: 0,
        criticalTokenOcclusionAllowed: false,
        accessibleCounterpartVisibleThroughout: true,
      },
    }
  }
  if (proposal.compositionRole === 'caption_only'
    && (proposal.requestedRegionId === creativeFallbackRegionId
      || proposal.requestedRegionId === accessibleRegionId)
    && ['speaker_adjacent', 'in_front_of_subject', 'foreground_hero']
      .includes(proposal.requestedDepthPlane)) {
    return {
      resolvedRegionId: proposal.requestedRegionId,
      resolvedDepthPlane: proposal.requestedDepthPlane,
      depthDisposition: 'admitted',
      trackAllAdmissionRef: null,
      maskSequenceRef: null,
      trackManifestRef: null,
      objectAnchorRef: null,
      brollOwnerBindingRef: null,
      occlusionPolicy: {
        intentional: false,
        maximumHiddenAreaBasisPoints: 0,
        maximumHiddenDurationFrames: 0,
        criticalTokenOcclusionAllowed: false,
        accessibleCounterpartVisibleThroughout: true,
      },
    }
  }
  if (proposal.compositionRole === 'full_screen_hero') {
    return {
      resolvedRegionId: proposal.requestedRegionId,
      resolvedDepthPlane: 'full_screen',
      depthDisposition: proposal.requestedDepthPlane === 'full_screen'
        ? 'admitted' : 'fallback_caption_only',
      trackAllAdmissionRef: null,
      maskSequenceRef: null,
      trackManifestRef: null,
      objectAnchorRef: null,
      brollOwnerBindingRef: null,
      occlusionPolicy: {
        intentional: false,
        maximumHiddenAreaBasisPoints: 0,
        maximumHiddenDurationFrames: 0,
        criticalTokenOcclusionAllowed: false,
        accessibleCounterpartVisibleThroughout: true,
      },
    }
  }
  return {
    resolvedRegionId: creativeFallbackRegionId,
    resolvedDepthPlane: needsEvidence && proposal.compositionRole !== 'subject_occlusion'
      ? 'speaker_adjacent' : 'in_front_of_subject',
    depthDisposition: needsEvidence && proposal.compositionRole !== 'subject_occlusion'
      ? 'fallback_speaker_adjacent' : proposal.compositionRole === 'broll_shared_frame'
        ? 'fallback_caption_only' : 'fallback_safe_top_plane',
    trackAllAdmissionRef: null,
    maskSequenceRef: null,
    trackManifestRef: null,
    objectAnchorRef: null,
    brollOwnerBindingRef: proposal.compositionRole === 'broll_shared_frame'
      ? brollBindingRef(broll) : null,
    occlusionPolicy: {
      intentional: false,
      maximumHiddenAreaBasisPoints: 0,
      maximumHiddenDurationFrames: 0,
      criticalTokenOcclusionAllowed: false,
      accessibleCounterpartVisibleThroughout: true,
    },
  }
}

export function createCaptionMultiTrackSceneGraph(input: {
  graphId: string
  semanticStylePlan: unknown
  phraseLineageProjection: unknown
  styleProfileContract: unknown
  approvalEnvelopeContract: unknown
  occupancyManifest: unknown
  visualHierarchy: unknown
  pictureLockRef: unknown
  finishReadinessRef: unknown
  brollOwnerBinding: unknown
  trackAllAdmissionBundles: TrackAllAdmissionBundleInput[]
  proposal: unknown
}): CaptionMultiTrackSceneGraph {
  assertClosedContractTree(input, 'Caption multi-track scene graph input')
  const graphId = safeKey.parse(input.graphId)
  const stylePlan = parseCaptionSemanticStylePlan(input.semanticStylePlan)
  const phraseProjection = parseCaptionPhraseLineageProjection(input.phraseLineageProjection)
  const styleProfile = requireDomainContract(input.styleProfileContract, 'style_profile')
  const approval = requireDomainContract(input.approvalEnvelopeContract, 'approval_envelope')
  const occupancy = parseCaptionVisualOccupancyManifest(input.occupancyManifest)
  const hierarchy = parseCaptionFinalVisualHierarchy(input.visualHierarchy, occupancy)
  const pictureLockRef = refSchema.parse(input.pictureLockRef)
  const finishReadinessRef = refSchema.parse(input.finishReadinessRef)
  const broll = parseCaptionBrollOwnerReadBinding(input.brollOwnerBinding)
  const proposal = proposalSchema.parse(input.proposal)
  const admissions = input.trackAllAdmissionBundles.map((bundle) =>
    parseCaptionTrackAllAdmission(bundle.admission, bundle))
  const scope = stylePlan.canonicalScope
  if (!exactScope(scope, styleProfile.canonicalScope)
    || !exactScope(scope, approval.canonicalScope)
    || !exactScope(scope, occupancy.canonicalScope)
    || !exactScope(scope, hierarchy.canonicalScope)
    || !exactScope(scope, broll.canonicalScope)
    || admissions.some((admission) => !exactScope(scope, admission.canonicalScope))
    || !exactRef(stylePlan.phraseLineageProjectionRef, recordRef(
      phraseProjection.projectionId,
      phraseProjection.schemaVersion,
      phraseProjection.projectionDigestSha256,
    ))
    || !exactRef(stylePlan.styleProfileRef, recordRef(
      styleProfile.contractId, styleProfile.contractVersion,
      styleProfile.contractDigestSha256,
    ))
    || !exactRef(stylePlan.confirmedOutputFrame.frameRef,
      styleProfile.sourceBindings.confirmedOutputFrameRef)
    || !exactRef(stylePlan.confirmedOutputFrame.frameRef,
      approval.sourceBindings.confirmedOutputFrameRef)
    || !exactRef(pictureLockRef, occupancy.pictureLockRef)
    || !exactRef(finishReadinessRef, occupancy.finishReadinessRef)
    || !exactRef(stylePlan.occupancyManifestRef, recordRef(
      occupancy.manifestId, occupancy.schemaVersion, occupancy.manifestDigestSha256,
    ))) {
    throw new Error('CAP-11 source scope or lineage is stale.')
  }
  if (new Set(admissions.map((admission) => admission.admissionId)).size !== admissions.length
    || new Set(proposal.tracks.map((track) => track.trackId)).size !== proposal.tracks.length
    || new Set(proposal.nodes.map((node) => node.nodeId)).size !== proposal.nodes.length) {
    throw new Error('CAP-11 proposal identities must be unique.')
  }
  const maximumConcurrentTrackCount = stylePlan.platformProfileId === 'desktop_widescreen'
    ? 4 : 3
  const trackById = new Map(proposal.tracks.map((track) => [track.trackId, track]))
  const phraseById = new Map(stylePlan.phrases.map((phrase) => [phrase.phraseId, phrase]))
  const admissionById = new Map(admissions.map((admission) => [
    admission.admissionId, admission,
  ]))
  const safeRegions = safeRegion(occupancy)
  const tracks: CaptionSceneTrack[] = proposal.tracks.map((track) => ({
    ...track,
    accessibleCompletenessRequired: isAccessibleRole(track.role),
  }))
  const selectedHeroMomentCount = proposal.nodes.filter((node) =>
    trackById.get(node.trackId)?.role === 'hero_typography').length
  if (selectedHeroMomentCount > approval.payload.maximumHeroMoments) {
    throw new Error('CAP-11 hero moment count exceeds the approval envelope.')
  }
  const nodes: CaptionSceneNode[] = proposal.nodes.map((node) => {
    const track = trackById.get(node.trackId)
    const phrase = phraseById.get(node.phraseId)
    if (!track || !track.phraseIds.includes(node.phraseId) || !phrase) {
      throw new Error(`CAP-11 node ${node.nodeId} has stale track or phrase lineage.`)
    }
    if (!occupancy.regions.some((region) => region.regionId === node.requestedRegionId)
      && !(node.compositionRole === 'full_screen_hero'
        && node.requestedRegionId === 'caption.region.full_canvas')) {
      throw new Error(`CAP-11 node ${node.nodeId} requests an unknown region.`)
    }
    if (node.requestedDepthPlane === 'subject_plane') {
      throw new Error('Caption nodes cannot occupy the canonical subject plane.')
    }
    if (track.role === 'hero_typography'
      && phrase.semanticRole !== 'hero_concept') {
      throw new Error('Hero Caption tracks require an approved hero semantic role.')
    }
    if (track.role === 'active_word' && phrase.emphasisSourceWordIds.length === 0) {
      throw new Error('Active-word Caption track lacks exact emphasized source words.')
    }
    if (track.role === 'caption_to_visual' && !approval.payload.captionToVisualAllowed) {
      throw new Error('Caption-to-Visual track is outside the approval envelope.')
    }
    const admission = node.trackAllAdmissionId === null ? null
      : admissionById.get(node.trackAllAdmissionId) ?? null
    if (node.trackAllAdmissionId !== null && !admission) {
      throw new Error(`CAP-11 node ${node.nodeId} references unknown Track All admission.`)
    }
    const resolved = resolveNodeDepth({
      proposal: node,
      track: tracks.find((item) => item.trackId === track.trackId)!,
      accessibleRegionId: safeRegions.accessible,
      creativeFallbackRegionId: safeRegions.creative,
      approval: approval.payload,
      admission,
      broll,
    })
    return {
      nodeId: node.nodeId,
      trackId: node.trackId,
      phraseId: node.phraseId,
      semanticRole: phrase.semanticRole,
      exactSourceWordIds: phrase.exactSourceWordIds,
      typographyRoleId: phrase.typographyRoleId,
      colorRoleId: phrase.colorRoleId,
      fontResolutionRef: phrase.fontResolutionRef,
      selectedLineCandidateId: phrase.lineLayout.selectedCandidateId,
      timingRequirementRef: node.timingRequirementRef,
      compositionRole: node.compositionRole,
      requestedRegionId: node.requestedRegionId,
      requestedDepthPlane: node.requestedDepthPlane,
      ...resolved,
      motionIntentRef: null,
      soundEligibility: node.soundEligibility,
      accessibilityCounterpartNodeId: node.accessibilityCounterpartNodeId,
      qaRequirementCodes: node.qaRequirementCodes,
      fallbackCode: node.fallbackCode,
      storyTimingFramesResolved: false,
      renderExecutionReady: false,
    }
  })
  if (stylePlan.phrases.some((phrase) => !nodes.some((node) => {
    const track = tracks.find((item) => item.trackId === node.trackId)
    return node.phraseId === phrase.phraseId && track && isAccessibleRole(track.role)
      && node.exactSourceWordIds.join('|') === phrase.exactSourceWordIds.join('|')
  }))) {
    throw new Error('CAP-11 omits an accessible complete-wording phrase projection.')
  }
  const fallbackCodesApplied = Array.from(new Set(nodes
    .filter((node) => node.depthDisposition !== 'admitted')
    .map((node) => node.fallbackCode)))
  const blockerCodes = Array.from(new Set([
    'storytiming_resolution_required',
    ...(stylePlan.qualificationState !== 'ready_private_internal'
      ? ['semantic_style_plan_runtime_gated'] : []),
    ...(hierarchy.qualificationState !== 'ready'
      ? ['visual_hierarchy_runtime_gated'] : []),
    ...(nodes.some((node) => node.compositionRole === 'subject_occlusion'
      && node.depthDisposition !== 'admitted')
      ? ['track_all_subject_occlusion_evidence_required'] : []),
    ...(nodes.some((node) => ['object_anchor', 'environmental_surface']
      .includes(node.compositionRole) && node.depthDisposition !== 'admitted')
      ? ['track_all_anchor_evidence_required'] : []),
    ...(nodes.some((node) => node.compositionRole === 'broll_shared_frame'
      && node.depthDisposition !== 'admitted')
      ? ['authenticated_broll_owner_read_required'] : []),
  ]))
  const withoutDigest: Omit<CaptionMultiTrackSceneGraph, 'graphDigestSha256'> = {
    schemaVersion: CAPTION_MULTI_TRACK_SCENE_GRAPH_VERSION,
    graphId,
    canonicalScope: scope,
    semanticStylePlanRef: recordRef(
      stylePlan.planId, stylePlan.schemaVersion, stylePlan.planDigestSha256,
    ),
    phraseLineageProjectionRef: stylePlan.phraseLineageProjectionRef,
    styleProfileRef: stylePlan.styleProfileRef,
    approvalEnvelopeRef: recordRef(
      approval.contractId, approval.contractVersion, approval.contractDigestSha256,
    ),
    confirmedOutputFrameRef: stylePlan.confirmedOutputFrame.frameRef,
    pictureLockRef,
    finishReadinessRef,
    occupancyManifestRef: stylePlan.occupancyManifestRef,
    visualHierarchyRef: recordRef(
      hierarchy.hierarchyId, hierarchy.schemaVersion, hierarchy.hierarchyDigestSha256,
    ),
    trackAllAdmissionRefs: admissions.map(admissionRef),
    brollOwnerBindingRef: brollBindingRef(broll),
    tracks,
    nodes,
    persistentLists: proposal.persistentLists,
    edges: proposal.edges,
    modePhases: proposal.modePhases,
    maximumConcurrentTrackCount,
    maximumHeroMomentCount: approval.payload.maximumHeroMoments,
    selectedHeroMomentCount,
    selectedCreativeTrackCount: tracks.filter((track) => !isAccessibleRole(track.role)).length,
    accessibleTrackCount: tracks.filter((track) => isAccessibleRole(track.role)).length,
    structuralDisposition: fallbackCodesApplied.length > 0
      ? 'ready_with_declared_fallbacks'
      : 'ready_for_storytiming_resolution',
    blockerCodes,
    fallbackCodesApplied,
    accessibleCompleteWordingRetained: true,
    fewestUsefulTracksPolicyApplied: true,
    captionAboveLivingFrameByDefault: true,
    accessibleCaptionAboveAllVisuals: true,
    brollOwnerRetained: true,
    trackAllOwnerRetained: true,
    storyTimingSoleFrameAuthority: true,
    remotionRemainsFinalCanvas: true,
    modelAuthoredCodeIncluded: false,
    mediaBytesIncluded: false,
    runtimeExecutionGranted: false,
    assetCreationGranted: false,
    finalQaApprovalGranted: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
  }
  return parseCaptionMultiTrackSceneGraph({
    ...withoutDigest,
    graphDigestSha256: calculateSkillContractDigest(
      { ...withoutDigest, graphDigestSha256: '' },
      'graphDigestSha256',
    ),
  })
}

export function captionMultiTrackSceneGraphRef(
  graph: CaptionMultiTrackSceneGraph,
): CaptionDomainRef {
  return graphRef(parseCaptionMultiTrackSceneGraph(graph))
}
