import type {
  LivingFrameComponentArtifactIntentRef,
  LivingFrameComponentArtifactMatchKind,
  LivingFrameComponentArtifactReconciliation,
  LivingFrameComponentArtifactReconciliationAuthorityBoundary,
  LivingFrameComponentArtifactReconciliationBinding,
  LivingFrameComponentArtifactReconciliationBlocker,
  LivingFrameComponentArtifactReconciliationDraft,
  LivingFrameComponentArtifactReconciliationMetrics,
  LivingFrameComponentArtifactReconciliationState,
} from '../../src/types/living-frame-component-artifact-reconciliation'
import {
  LIVING_FRAME_COMPONENT_ARTIFACT_MATCH_KINDS,
  LIVING_FRAME_COMPONENT_ARTIFACT_MATCH_STATES,
  LIVING_FRAME_COMPONENT_ARTIFACT_RECONCILIATION_BLOCKERS,
  LIVING_FRAME_COMPONENT_ARTIFACT_RECONCILIATION_CLASS,
  LIVING_FRAME_COMPONENT_ARTIFACT_RECONCILIATION_STATES,
  LIVING_FRAME_COMPONENT_ARTIFACT_RECONCILIATION_VERSION,
} from '../../src/types/living-frame-component-artifact-reconciliation'
import type {
  LivingFrameComponentAssetIntent,
  LivingFrameComponentAssetIntentBundle,
} from '../../src/types/living-frame-component-asset-intent'
import {
  LIVING_FRAME_TRANSPARENCY_EXPECTATIONS,
} from '../../src/types/living-frame'
import {
  LIVING_FRAME_COMPONENT_ASSET_KINDS,
} from '../../src/types/living-frame-component-asset-intent'
import type {
  LivingFrameSceneComponentEvidenceBinding,
  LivingFrameSceneEvidencePackage,
} from '../../src/types/living-frame-scene-evidence-package'
import {
  LIVING_FRAME_SCENE_ARTIFACT_KINDS,
} from '../../src/types/living-frame-scene-evidence-package'
import {
  verifyLivingFrameComponentAssetIntentBundle,
} from './living-frame-component-asset-intent'
import {
  verifyLivingFrameSceneEvidencePackageDigest,
} from './living-frame-scene-evidence-package'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'

const SHA256 = /^[a-f0-9]{64}$/
const SAFE_ID = /^[a-z0-9][a-z0-9._:-]{0,199}$/
const MAX_COMPONENTS = 256
const BASE_BLOCKERS = [
  'canonical_selected_scene_required',
  'canonical_current_artifact_reread_required',
  'canonical_artifact_origin_lineage_required',
  'canonical_work_output_lineage_required',
  'canonical_asset_manifest_lineage_required',
  'canonical_artifact_qa_required',
] as const satisfies readonly LivingFrameComponentArtifactReconciliationBlocker[]

const AUTHORITY_BOUNDARY:
  LivingFrameComponentArtifactReconciliationAuthorityBoundary =
  Object.freeze({
    structuralLineageCandidateOnly: true,
    selectedSceneAuthority: false,
    sourceAssetAuthority: false,
    artifactOriginAuthority: false,
    artifactQaAuthority: false,
    continuityQaAuthority: false,
    masterTimingAuthority: false,
    exactFrameAuthority: false,
    soundSyncAuthority: false,
    estimateAuthority: false,
    customerCommercialAuthority: false,
    approvalAuthority: false,
    snapshotAuthority: false,
    providerAuthority: false,
    toolRouteAuthority: false,
    workItemCreationAuthority: false,
    workGraphMutationAuthority: false,
    queueAuthority: false,
    assetManifestMutationAuthority: false,
    rendererAuthority: false,
    renderExecutionAuthority: false,
    privateReviewAuthority: false,
    runtimePromotionAuthority: false,
    productionAuthority: false,
  })

export interface CompileLivingFrameComponentArtifactReconciliationInput {
  readonly componentAssetIntentBundle:
    LivingFrameComponentAssetIntentBundle
  readonly sceneEvidencePackage:
    LivingFrameSceneEvidencePackage | null
}

export function compileLivingFrameComponentArtifactReconciliation(
  input: CompileLivingFrameComponentArtifactReconciliationInput,
): LivingFrameComponentArtifactReconciliation {
  assertInput(input)
  const intents = input.componentAssetIntentBundle
  const evidence = input.sceneEvidencePackage
  if (intents.intentState === 'deliberate_non_use') {
    return sign({
      contractVersion:
        LIVING_FRAME_COMPONENT_ARTIFACT_RECONCILIATION_VERSION,
      reconciliationClass:
        LIVING_FRAME_COMPONENT_ARTIFACT_RECONCILIATION_CLASS,
      reconciliationState: 'deliberate_non_use',
      sceneId: null,
      sourceBindings: {
        componentAssetIntentBundleDigestSha256:
          intents.bundleDigestSha256,
        sceneEvidencePackageDigestSha256: null,
      },
      componentBindings: [],
      blockerCodes: [],
      metrics: emptyMetrics(),
      authorityBoundary: AUTHORITY_BOUNDARY,
      existingCanonicalWorkGraphRemainsAuthority: true,
      existingCanonicalAssetManifestRemainsAuthority: true,
      containsRawChatTranscriptMediaBytesPathsUrlsOrCredentials:
        false,
      containsProviderModelToolOperationJobQueueCostOrCommercialRoute:
        false,
      containsExecutableCodeOrCommands: false,
      createsWorkItems: false,
      createsAssetManifestEntries: false,
      subjectSpecificRouting: false,
      promotionAllowed: false,
    })
  }

  const sceneId = evidence!.sceneId
  const sceneIntents = intents.assetIntents.filter(
    (entry) => entry.sceneId === sceneId,
  )
  const intentsByComponent = groupByComponent(sceneIntents)
  const componentBindings = evidence!.componentEvidenceBindings.map(
    (entry, order) => compileBinding({
      evidence: entry,
      order,
      sceneId,
      intents: intentsByComponent.get(entry.componentId) ?? [],
    }),
  )
  for (const componentId of intentsByComponent.keys()) {
    if (!componentBindings.some((entry) =>
      entry.componentId === componentId)) {
      throw invalid(
        'Living Frame asset intent has no scene-evidence component.',
      )
    }
  }
  const evidenceBlocked =
    evidence!.packageState !== 'evidence_bound_pending_canonical_qa'
  const incompatible = componentBindings.some(
    (entry) => entry.matchState === 'incompatible',
  )
  const reconciliationState:
    LivingFrameComponentArtifactReconciliationState =
    evidenceBlocked || incompatible
      ? 'blocked_by_evidence_or_lineage'
      : 'candidate_lineage_structurally_reconciled'
  const blockerCodes = uniqueSorted([
    ...BASE_BLOCKERS,
    ...(evidenceBlocked
      ? ['scene_evidence_blocked' as const]
      : []),
    ...componentBindings.flatMap((entry) => entry.blockerCodes),
  ])
  return sign({
    contractVersion:
      LIVING_FRAME_COMPONENT_ARTIFACT_RECONCILIATION_VERSION,
    reconciliationClass:
      LIVING_FRAME_COMPONENT_ARTIFACT_RECONCILIATION_CLASS,
    reconciliationState,
    sceneId,
    sourceBindings: {
      componentAssetIntentBundleDigestSha256:
        intents.bundleDigestSha256,
      sceneEvidencePackageDigestSha256:
        evidence!.packageDigestSha256,
    },
    componentBindings,
    blockerCodes,
    metrics: deriveMetrics(componentBindings),
    authorityBoundary: AUTHORITY_BOUNDARY,
    existingCanonicalWorkGraphRemainsAuthority: true,
    existingCanonicalAssetManifestRemainsAuthority: true,
    containsRawChatTranscriptMediaBytesPathsUrlsOrCredentials:
      false,
    containsProviderModelToolOperationJobQueueCostOrCommercialRoute:
      false,
    containsExecutableCodeOrCommands: false,
    createsWorkItems: false,
    createsAssetManifestEntries: false,
    subjectSpecificRouting: false,
    promotionAllowed: false,
  })
}

export function verifyLivingFrameComponentArtifactReconciliation(
  value: unknown,
): value is LivingFrameComponentArtifactReconciliation {
  try {
    if (!isRecord(value) || !hasExactKeys(value, [
      'contractVersion',
      'reconciliationClass',
      'reconciliationState',
      'sceneId',
      'sourceBindings',
      'componentBindings',
      'blockerCodes',
      'metrics',
      'authorityBoundary',
      'existingCanonicalWorkGraphRemainsAuthority',
      'existingCanonicalAssetManifestRemainsAuthority',
      'containsRawChatTranscriptMediaBytesPathsUrlsOrCredentials',
      'containsProviderModelToolOperationJobQueueCostOrCommercialRoute',
      'containsExecutableCodeOrCommands',
      'createsWorkItems',
      'createsAssetManifestEntries',
      'subjectSpecificRouting',
      'promotionAllowed',
      'reconciliationDigestSha256',
    ])) return false
    const packet =
      value as unknown as LivingFrameComponentArtifactReconciliation
    const { reconciliationDigestSha256, ...draft } = packet
    if (
      !SHA256.test(reconciliationDigestSha256)
      || reconciliationDigestSha256
        !== sha256AuthorityValue(draft)
      || packet.contractVersion
        !== LIVING_FRAME_COMPONENT_ARTIFACT_RECONCILIATION_VERSION
      || packet.reconciliationClass
        !== LIVING_FRAME_COMPONENT_ARTIFACT_RECONCILIATION_CLASS
      || !LIVING_FRAME_COMPONENT_ARTIFACT_RECONCILIATION_STATES
        .includes(packet.reconciliationState)
      || !validateSourceBindings(packet.sourceBindings)
      || !validateBindings(packet.componentBindings)
      || !validateClosedSet(
        packet.blockerCodes,
        LIVING_FRAME_COMPONENT_ARTIFACT_RECONCILIATION_BLOCKERS,
      )
      || stableAuthorityStringify(packet.metrics)
        !== stableAuthorityStringify(
          deriveMetrics(packet.componentBindings),
        )
      || !validateAuthorityBoundary(packet.authorityBoundary)
      || packet.existingCanonicalWorkGraphRemainsAuthority
        !== true
      || packet.existingCanonicalAssetManifestRemainsAuthority
        !== true
      || packet
        .containsRawChatTranscriptMediaBytesPathsUrlsOrCredentials
        !== false
      || packet
        .containsProviderModelToolOperationJobQueueCostOrCommercialRoute
        !== false
      || packet.containsExecutableCodeOrCommands !== false
      || packet.createsWorkItems !== false
      || packet.createsAssetManifestEntries !== false
      || packet.subjectSpecificRouting !== false
      || packet.promotionAllowed !== false
    ) return false
    if (packet.reconciliationState === 'deliberate_non_use') {
      return packet.sceneId === null
        && packet.sourceBindings.sceneEvidencePackageDigestSha256
          === null
        && packet.componentBindings.length === 0
        && packet.blockerCodes.length === 0
        && packet.metrics.sceneCount === 0
    }
    const hasIncompatible = packet.componentBindings.some(
      (entry) => entry.matchState === 'incompatible',
    )
    const expectedBlockers = uniqueSorted([
      ...BASE_BLOCKERS,
      ...(packet.blockerCodes.includes('scene_evidence_blocked')
        ? ['scene_evidence_blocked' as const]
        : []),
      ...packet.componentBindings.flatMap(
        (entry) => entry.blockerCodes,
      ),
    ])
    return typeof packet.sceneId === 'string'
      && SAFE_ID.test(packet.sceneId)
      && packet.sourceBindings.sceneEvidencePackageDigestSha256
        !== null
      && packet.componentBindings.length > 0
      && BASE_BLOCKERS.every((code) =>
        packet.blockerCodes.includes(code))
      && stableAuthorityStringify(packet.blockerCodes)
        === stableAuthorityStringify(expectedBlockers)
      && packet.reconciliationState === (
        hasIncompatible
          || packet.blockerCodes.includes('scene_evidence_blocked')
          ? 'blocked_by_evidence_or_lineage'
          : 'candidate_lineage_structurally_reconciled'
      )
  } catch {
    return false
  }
}

function assertInput(
  input: CompileLivingFrameComponentArtifactReconciliationInput,
): void {
  if (
    !isRecord(input)
    || !hasExactKeys(input, [
      'componentAssetIntentBundle',
      'sceneEvidencePackage',
    ])
    || !verifyLivingFrameComponentAssetIntentBundle(
      input.componentAssetIntentBundle,
    )
  ) throw invalid(
    'Living Frame component-artifact reconciliation input is invalid.',
  )
  if (
    input.componentAssetIntentBundle.intentState
      === 'deliberate_non_use'
  ) {
    if (input.sceneEvidencePackage !== null) {
      throw invalid(
        'Living Frame deliberate non-use cannot carry scene evidence.',
      )
    }
    return
  }
  if (
    !verifyLivingFrameSceneEvidencePackageDigest(
      input.sceneEvidencePackage,
    )
    || !input.componentAssetIntentBundle.assetIntents.some(
      (entry) => entry.sceneId === input.sceneEvidencePackage!.sceneId,
    )
  ) throw invalid(
    'Living Frame current scene evidence is missing or unrelated.',
  )
  const intentsById = new Map(
    input.componentAssetIntentBundle.assetIntents.map((entry) => [
      entry.assetIntentId,
      entry,
    ]),
  )
  for (const intent of input.componentAssetIntentBundle.assetIntents) {
    if (intent.dependencyAssetIntentIds.some((dependencyId) => {
      const dependency = intentsById.get(dependencyId)
      return !dependency
        || dependency.sceneId !== intent.sceneId
        || dependency.componentId !== intent.componentId
    })) throw invalid(
      'Living Frame asset-intent dependency crosses a component boundary.',
    )
  }
}

function compileBinding(input: {
  evidence: LivingFrameSceneComponentEvidenceBinding
  order: number
  sceneId: string
  intents: readonly LivingFrameComponentAssetIntent[]
}): LivingFrameComponentArtifactReconciliationBinding {
  const intents = [...input.intents].sort(
    (left, right) => left.order - right.order,
  )
  const kinds = new Set(intents.map((entry) => entry.assetKind))
  const transparencyExpectations = new Set(
    intents.map((entry) => entry.transparencyExpectation),
  )
  const expectedArtifactIntent = expectedArtifact(kinds, intents)
  const expectedMaskIntent = expectedMask(kinds, intents)
  const matchKind = deriveMatchKind(kinds, input.evidence.artifactKind)
  const blockers: LivingFrameComponentArtifactReconciliationBlocker[] = []
  if (intents.length === 0) {
    blockers.push('component_intent_chain_missing')
  }
  if (expectedArtifactIntent === null && intents.length > 0) {
    blockers.push('component_intent_chain_not_terminal')
  }
  if (transparencyExpectations.size > 1) {
    blockers.push('component_intent_chain_not_terminal')
  }
  const requiresStillAlpha = intents.some((entry) =>
    entry.transparencyExpectation === 'still_alpha_required'
    || entry.transparencyExpectation === 'native_alpha_preferred')
  const requiresTemporalMask = intents.some((entry) =>
    entry.transparencyExpectation === 'temporal_mask_required')
  if (
    (requiresStillAlpha
      && !kinds.has('processed_rgba_still_component'))
    || (
      requiresTemporalMask
      && !kinds.has('temporal_subject_mask_sequence')
    )
  ) blockers.push('component_intent_chain_not_terminal')
  if (matchKind === 'unsupported_bounded_video_candidate') {
    blockers.push('bounded_video_artifact_kind_not_supported')
  } else if (!artifactKindCompatible(
    input.evidence.artifactKind,
    matchKind,
    expectedArtifactIntent?.assetKind ?? null,
  )) {
    blockers.push('artifact_kind_incompatible_with_asset_intent')
  }
  if (
    (expectedMaskIntent !== null)
      !== (input.evidence.maskArtifact !== null)
  ) blockers.push('mask_artifact_incompatible_with_asset_intent')
  return {
    order: input.order,
    sceneId: input.sceneId,
    componentId: input.evidence.componentId,
    orderedAssetIntentIds: intents.map((entry) => entry.assetIntentId),
    expectedArtifactIntent,
    expectedMaskIntent,
    transparencyExpectation:
      intents[0]?.transparencyExpectation ?? 'opaque_plate',
    artifactKind: input.evidence.artifactKind,
    artifact: { ...input.evidence.artifact },
    maskArtifact: input.evidence.maskArtifact
      ? { ...input.evidence.maskArtifact }
      : null,
    matchKind,
    matchState: blockers.length === 0
      ? 'structurally_compatible_pending_canonical_lineage'
      : 'incompatible',
    blockerCodes: uniqueSorted(blockers),
    canonicalArtifactOriginProven: false,
    canonicalWorkOutputLineageProven: false,
    canonicalAssetManifestLineageProven: false,
  }
}

function expectedArtifact(
  kinds: ReadonlySet<LivingFrameComponentAssetIntent['assetKind']>,
  intents: readonly LivingFrameComponentAssetIntent[],
): LivingFrameComponentArtifactIntentRef | null {
  const preference: readonly LivingFrameComponentAssetIntent['assetKind'][] = [
    'processed_rgba_still_component',
    'reconstructed_background_plate_png',
    'procedural_graphic_spec',
    'exact_map_spec',
    'exact_data_graphic_spec',
    'bounded_generated_video_clip',
    'approved_source_asset_reference',
    'generated_opaque_still_source',
    'controlled_opaque_still_variation_source',
  ]
  const kind = preference.find((candidate) => kinds.has(candidate))
  const intent = kind
    ? intents.find((entry) => entry.assetKind === kind)
    : undefined
  return intent ? ref(intent) : null
}

function expectedMask(
  kinds: ReadonlySet<LivingFrameComponentAssetIntent['assetKind']>,
  intents: readonly LivingFrameComponentAssetIntent[],
): LivingFrameComponentArtifactIntentRef | null {
  if (!kinds.has('temporal_subject_mask_sequence')) return null
  const intent = intents.find(
    (entry) => entry.assetKind === 'temporal_subject_mask_sequence',
  )
  return intent ? ref(intent) : null
}

function ref(
  intent: LivingFrameComponentAssetIntent,
): LivingFrameComponentArtifactIntentRef {
  return {
    assetIntentId: intent.assetIntentId,
    assetKind: intent.assetKind,
  }
}

function deriveMatchKind(
  kinds: ReadonlySet<LivingFrameComponentAssetIntent['assetKind']>,
  artifactKind: LivingFrameSceneComponentEvidenceBinding['artifactKind'],
): LivingFrameComponentArtifactMatchKind {
  if (kinds.has('bounded_generated_video_clip')) {
    return 'unsupported_bounded_video_candidate'
  }
  if (kinds.has('processed_rgba_still_component')) {
    return 'processed_rgba_candidate'
  }
  if (kinds.has('temporal_subject_mask_sequence')) {
    return 'source_with_temporal_mask_candidate'
  }
  if (kinds.has('reconstructed_background_plate_png')) {
    return 'reconstructed_plate_candidate'
  }
  if (
    kinds.has('procedural_graphic_spec')
    || kinds.has('exact_map_spec')
    || kinds.has('exact_data_graphic_spec')
  ) {
    return artifactKind === 'opaque_raster'
      ? 'deterministic_raster_candidate'
      : 'deterministic_alpha_candidate'
  }
  return 'opaque_source_candidate'
}

function artifactKindCompatible(
  artifactKind: LivingFrameSceneComponentEvidenceBinding['artifactKind'],
  matchKind: LivingFrameComponentArtifactMatchKind,
  expectedAssetKind:
    LivingFrameComponentAssetIntent['assetKind'] | null = null,
): boolean {
  switch (matchKind) {
    case 'opaque_source_candidate':
    case 'reconstructed_plate_candidate':
    case 'deterministic_raster_candidate':
      return artifactKind === 'opaque_raster'
    case 'processed_rgba_candidate':
      return artifactKind === 'still_rgba'
    case 'source_with_temporal_mask_candidate':
      return artifactKind === 'source_a_roll'
    case 'deterministic_alpha_candidate':
      if (
        expectedAssetKind === 'exact_map_spec'
        || expectedAssetKind === 'exact_data_graphic_spec'
      ) {
        return artifactKind === 'still_rgba'
          || artifactKind === 'procedural_alpha_primitive'
      }
      return artifactKind === 'still_rgba'
        || artifactKind === 'procedural_alpha_primitive'
        || artifactKind === 'additive_effect_primitive'
    case 'unsupported_bounded_video_candidate':
      return false
  }
}

function groupByComponent(
  intents: readonly LivingFrameComponentAssetIntent[],
): ReadonlyMap<string, readonly LivingFrameComponentAssetIntent[]> {
  const grouped = new Map<string, LivingFrameComponentAssetIntent[]>()
  for (const intent of intents) {
    const entries = grouped.get(intent.componentId) ?? []
    entries.push(intent)
    grouped.set(intent.componentId, entries)
  }
  return grouped
}

function deriveMetrics(
  bindings: readonly LivingFrameComponentArtifactReconciliationBinding[],
): LivingFrameComponentArtifactReconciliationMetrics {
  return {
    sceneCount: bindings.length === 0 ? 0 : 1,
    componentBindingCount: bindings.length,
    structurallyCompatibleComponentCount: bindings.filter(
      (entry) => entry.matchState
        === 'structurally_compatible_pending_canonical_lineage',
    ).length,
    incompatibleComponentCount: bindings.filter(
      (entry) => entry.matchState === 'incompatible',
    ).length,
    artifactCount: bindings.length,
    maskArtifactCount: bindings.filter(
      (entry) => entry.maskArtifact !== null,
    ).length,
    referencedAssetIntentCount: new Set(
      bindings.flatMap((entry) => entry.orderedAssetIntentIds),
    ).size,
  }
}

function emptyMetrics():
  LivingFrameComponentArtifactReconciliationMetrics {
  return {
    sceneCount: 0,
    componentBindingCount: 0,
    structurallyCompatibleComponentCount: 0,
    incompatibleComponentCount: 0,
    artifactCount: 0,
    maskArtifactCount: 0,
    referencedAssetIntentCount: 0,
  }
}

function validateBindings(
  bindings: readonly LivingFrameComponentArtifactReconciliationBinding[],
): boolean {
  if (!Array.isArray(bindings) || bindings.length > MAX_COMPONENTS) {
    return false
  }
  const componentIds = new Set<string>()
  for (const [index, binding] of bindings.entries()) {
    const raw: unknown = binding
    if (!isRecord(raw) || !hasExactKeys(raw, [
      'order',
      'sceneId',
      'componentId',
      'orderedAssetIntentIds',
      'expectedArtifactIntent',
      'expectedMaskIntent',
      'transparencyExpectation',
      'artifactKind',
      'artifact',
      'maskArtifact',
      'matchKind',
      'matchState',
      'blockerCodes',
      'canonicalArtifactOriginProven',
      'canonicalWorkOutputLineageProven',
      'canonicalAssetManifestLineageProven',
    ])) return false
    if (
      binding.order !== index
      || !SAFE_ID.test(binding.sceneId)
      || !SAFE_ID.test(binding.componentId)
      || componentIds.has(binding.componentId)
      || !validateOrderedIds(binding.orderedAssetIntentIds)
      || !validateIntentRef(binding.expectedArtifactIntent)
      || !validateIntentRef(binding.expectedMaskIntent)
      || !LIVING_FRAME_TRANSPARENCY_EXPECTATIONS.includes(
        binding.transparencyExpectation,
      )
      || !LIVING_FRAME_SCENE_ARTIFACT_KINDS
        .includes(binding.artifactKind)
      || !validateArtifactRef(binding.artifact)
      || (
        binding.maskArtifact !== null
        && !validateArtifactRef(binding.maskArtifact)
      )
      || !LIVING_FRAME_COMPONENT_ARTIFACT_MATCH_KINDS
        .includes(binding.matchKind)
      || !LIVING_FRAME_COMPONENT_ARTIFACT_MATCH_STATES
        .includes(binding.matchState)
      || !validateClosedSet(
        binding.blockerCodes,
        LIVING_FRAME_COMPONENT_ARTIFACT_RECONCILIATION_BLOCKERS,
      )
      || binding.matchState !== (
        binding.blockerCodes.length === 0
          ? 'structurally_compatible_pending_canonical_lineage'
          : 'incompatible'
      )
      || (
        binding.matchState
          === 'structurally_compatible_pending_canonical_lineage'
        && binding.expectedArtifactIntent === null
      )
      || !validateBindingSemantics(binding)
      || binding.canonicalArtifactOriginProven !== false
      || binding.canonicalWorkOutputLineageProven !== false
      || binding.canonicalAssetManifestLineageProven !== false
    ) return false
    componentIds.add(binding.componentId)
  }
  return true
}

function validateBindingSemantics(
  binding: LivingFrameComponentArtifactReconciliationBinding,
): boolean {
  if (
    binding.expectedArtifactIntent !== null
    && !binding.orderedAssetIntentIds.includes(
      binding.expectedArtifactIntent.assetIntentId,
    )
  ) return false
  if (
    binding.expectedMaskIntent !== null
    && !binding.orderedAssetIntentIds.includes(
      binding.expectedMaskIntent.assetIntentId,
    )
  ) return false
  if (
    (binding.expectedMaskIntent !== null)
      !== (binding.maskArtifact !== null)
  ) {
    return binding.blockerCodes.includes(
      'mask_artifact_incompatible_with_asset_intent',
    )
  }
  if (
    (
      binding.transparencyExpectation === 'still_alpha_required'
      || binding.transparencyExpectation === 'native_alpha_preferred'
    )
    && (
      binding.matchKind !== 'processed_rgba_candidate'
      && binding.matchKind !== 'deterministic_alpha_candidate'
    )
  ) return false
  if (
    binding.transparencyExpectation === 'temporal_mask_required'
    && binding.matchKind
      !== 'source_with_temporal_mask_candidate'
  ) return false
  if (
    binding.transparencyExpectation === 'opaque_plate'
    && (
      binding.matchKind === 'processed_rgba_candidate'
      || binding.matchKind
        === 'source_with_temporal_mask_candidate'
    )
  ) return false
  const compatible = artifactKindCompatible(
    binding.artifactKind,
    binding.matchKind,
    binding.expectedArtifactIntent?.assetKind ?? null,
  )
  if (compatible) {
    return !binding.blockerCodes.includes(
      'artifact_kind_incompatible_with_asset_intent',
    )
      && binding.matchKind
        !== 'unsupported_bounded_video_candidate'
  }
  return binding.blockerCodes.includes(
    binding.matchKind === 'unsupported_bounded_video_candidate'
      ? 'bounded_video_artifact_kind_not_supported'
      : 'artifact_kind_incompatible_with_asset_intent',
  )
}

function validateIntentRef(
  value: LivingFrameComponentArtifactIntentRef | null,
): boolean {
  if (value === null) return true
  return isRecord(value)
    && hasExactKeys(value, ['assetIntentId', 'assetKind'])
    && SAFE_ID.test(value.assetIntentId as string)
    && LIVING_FRAME_COMPONENT_ASSET_KINDS.includes(
      value.assetKind as never,
    )
}

function validateArtifactRef(value: unknown): boolean {
  return isRecord(value)
    && hasExactKeys(value, ['artifactId', 'artifactDigestSha256'])
    && SAFE_ID.test(value.artifactId as string)
    && SHA256.test(value.artifactDigestSha256 as string)
}

function validateSourceBindings(value: unknown): boolean {
  return isRecord(value)
    && hasExactKeys(value, [
      'componentAssetIntentBundleDigestSha256',
      'sceneEvidencePackageDigestSha256',
    ])
    && SHA256.test(
      value.componentAssetIntentBundleDigestSha256 as string,
    )
    && (
      value.sceneEvidencePackageDigestSha256 === null
      || SHA256.test(value.sceneEvidencePackageDigestSha256 as string)
    )
}

function validateAuthorityBoundary(value: unknown): boolean {
  return isRecord(value)
    && stableAuthorityStringify(value)
      === stableAuthorityStringify(AUTHORITY_BOUNDARY)
}

function validateOrderedIds(values: readonly string[]): boolean {
  return Array.isArray(values)
    && values.length > 0
    && values.every((value) => SAFE_ID.test(value))
    && new Set(values).size === values.length
}

function validateClosedSet<T extends string>(
  values: readonly T[],
  allowed: readonly T[],
): boolean {
  return Array.isArray(values)
    && values.length === new Set(values).size
    && values.every((value) => allowed.includes(value))
    && stableAuthorityStringify(values)
      === stableAuthorityStringify([...values].sort())
}

function uniqueSorted<T extends string>(
  values: readonly T[],
): T[] {
  return [...new Set(values)].sort()
}

function sign(
  draft: LivingFrameComponentArtifactReconciliationDraft,
): LivingFrameComponentArtifactReconciliation {
  return {
    ...draft,
    reconciliationDigestSha256: sha256AuthorityValue(draft),
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
    && !Array.isArray(value)
}

function hasExactKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean {
  const actual = Object.keys(value).sort()
  const expected = [...keys].sort()
  return actual.length === expected.length
    && actual.every((key, index) => key === expected[index])
}

function invalid(message: string): Error {
  return new Error(message)
}
