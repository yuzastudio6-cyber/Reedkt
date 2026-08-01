import type {
  ApprovedToolWorkSourceReferences,
} from '../edit-architecture/approved-tool-work-manifest'
import type {
  DataVizPlan,
  DataVizPlanItem,
  DocumentaryFactSafetyPlan,
  FactSafetyPlanItem,
  MapAnimationPlan,
  MapAnimationPlanItem,
} from '../../src/types/reeditpro'
import {
  LIVING_FRAME_NON_CHARACTER_CONTENT_CASE_IDS,
  LIVING_FRAME_NON_CHARACTER_CONTENT_LINEAGE_CLASS,
  LIVING_FRAME_NON_CHARACTER_CONTENT_LINEAGE_OPEN_GATES,
  LIVING_FRAME_NON_CHARACTER_CONTENT_LINEAGE_VERSION,
  type LivingFrameNonCharacterApprovedPlanRefs,
  type LivingFrameNonCharacterContentCaseId,
  type LivingFrameNonCharacterContentLineageBinding,
  type LivingFrameNonCharacterContentLineageBindingDraft,
  type LivingFrameNonCharacterContentLineageCase,
  type LivingFrameNonCharacterDigestRef,
  type LivingFrameNonCharacterSelectedSceneRef,
  type LivingFrameNonCharacterSourceEvidenceKind,
  type LivingFrameNonCharacterSourceEvidenceRef,
  type LivingFrameNonCharacterSourceTruthSummary,
  type LivingFrameNonCharacterToolRouteRef,
} from '../../src/types/living-frame-non-character-content-lineage'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const SAFE_VERSION = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/u
const SHA256 = /^[a-f0-9]{64}$/u

const EXPECTED_MODE = {
  source_bound_map_route: 'living_a_roll',
  source_bound_archive_document: 'living_archive',
  source_bound_exact_diagram: 'living_diagram',
  source_bound_hybrid_expansion: 'hybrid_expansion',
} as const

const EXPECTED_PLAN_OWNER = {
  source_bound_map_route: 'MapAnimationPlan',
  source_bound_archive_document: 'DataVizPlan',
  source_bound_exact_diagram: 'DataVizPlan',
  source_bound_hybrid_expansion: 'MapAnimationPlan',
} as const

const EXPECTED_SOURCE_EVIDENCE_KINDS = {
  source_bound_map_route: [
    'map_coordinate_citation',
    'map_route_geometry',
  ],
  source_bound_archive_document: [
    'archive_document_artifact',
    'archive_ocr_excerpt_citation',
  ],
  source_bound_exact_diagram: [
    'dataviz_approved_rows',
  ],
  source_bound_hybrid_expansion: [
    'map_coordinate_citation',
    'map_route_geometry',
    'hybrid_source_content',
  ],
} as const satisfies Record<
  LivingFrameNonCharacterContentCaseId,
  readonly LivingFrameNonCharacterSourceEvidenceKind[]
>

const AUTHORITY_BOUNDARY = Object.freeze({
  structuralBindingOnly: true as const,
  mapAuthority: false as const,
  dataVizAuthority: false as const,
  archiveTextOrOcrAuthority: false as const,
  sourceEvidenceAuthority: false as const,
  documentaryFactAuthority: false as const,
  selectedSceneAuthority: false as const,
  masterTimingAuthority: false as const,
  hybridTimingAuthority: false as const,
  exactFrameAuthority: false as const,
  soundSyncAuthority: false as const,
  captionAuthority: false as const,
  workGraphAuthority: false as const,
  assetManifestAuthority: false as const,
  rendererAuthority: false as const,
  providerAuthority: false as const,
  toolRouteAuthority: false as const,
  dispatchAuthority: false as const,
  runtimeAuthority: false as const,
  costAuthority: false as const,
  artifactAuthority: false as const,
  qaApprovalAuthority: false as const,
  privateReviewAuthority: false as const,
  billingAuthority: false as const,
  publicDeliveryAuthority: false as const,
  productionAuthority: false as const,
})

export interface LivingFrameNonCharacterContentLineageCaseInput {
  readonly caseId: LivingFrameNonCharacterContentCaseId
  readonly selectedScene: LivingFrameNonCharacterSelectedSceneRef
  readonly approvedPlanRefs: LivingFrameNonCharacterApprovedPlanRefs
  readonly sourceEvidenceRefs:
    readonly LivingFrameNonCharacterSourceEvidenceRef[]
  readonly planningOwnerItemId: string
  readonly linkedFactSafetyItemIds: readonly string[]
  readonly approvedToolWorkSourceReferences:
    ApprovedToolWorkSourceReferences
}

export interface CompileLivingFrameNonCharacterContentLineageInput {
  readonly mapAnimationPlan: MapAnimationPlan
  readonly dataVizPlan: DataVizPlan
  readonly documentaryFactSafetyPlan:
    DocumentaryFactSafetyPlan
  readonly cases:
    readonly LivingFrameNonCharacterContentLineageCaseInput[]
}

export function compileLivingFrameNonCharacterContentLineage(
  input: CompileLivingFrameNonCharacterContentLineageInput,
): LivingFrameNonCharacterContentLineageBinding {
  assertInput(input)
  const mapItems = new Map(
    input.mapAnimationPlan.items.map((item) => [item.id, item]),
  )
  const dataVizItems = new Map(
    input.dataVizPlan.items.map((item) => [item.id, item]),
  )
  const factItems = new Map(
    input.documentaryFactSafetyPlan.claimItems.map(
      (item) => [item.id, item],
    ),
  )
  const cases = input.cases.map((candidate, order) =>
    compileCase({
      candidate,
      order,
      mapPlan: input.mapAnimationPlan,
      mapItems,
      dataVizPlan: input.dataVizPlan,
      dataVizItems,
      factPlan: input.documentaryFactSafetyPlan,
      factItems,
    }))
  const draft:
    LivingFrameNonCharacterContentLineageBindingDraft = {
      contractVersion:
        LIVING_FRAME_NON_CHARACTER_CONTENT_LINEAGE_VERSION,
      bindingClass:
        LIVING_FRAME_NON_CHARACTER_CONTENT_LINEAGE_CLASS,
      bindingState:
        'all_representative_content_refs_bound_canonical_reread_and_admission_pending',
      cases,
      caseCount: 4,
      openGateCodes: [
        ...LIVING_FRAME_NON_CHARACTER_CONTENT_LINEAGE_OPEN_GATES,
      ],
      authorityBoundary: AUTHORITY_BOUNDARY,
      ownerScopeAmendmentPreserved: true,
      animatedLivingOrOrganicSubjectAllowed: false,
      completeCharacterKeyposeOrInterpolationAllowed: false,
      livingSubjectRiggingAllowed: false,
      mechanicalRiggingAllowed: false,
      staticIllustrationMayRemainUnanimated: true,
      containsRawChatTranscriptMediaBytesPathsUrlsCredentialsCommandsOrEnvironment:
        false,
      containsRawMapCoordinatesDataValuesDocumentExcerptsOrClaims:
        false,
      operationRegistered: false,
      dispatchGranted: false,
      runtimeExecuted: false,
      artifactCreated: false,
      canonicalQaApproved: false,
      privateReviewApproved: false,
      customerCharged: false,
      publicDeliveryReady: false,
      productionReady: false,
    }
  return deepFreeze({
    ...draft,
    bindingDigestSha256: sha256AuthorityValue(draft),
  })
}

export function verifyLivingFrameNonCharacterContentLineage(
  value: unknown,
  input: CompileLivingFrameNonCharacterContentLineageInput,
): value is LivingFrameNonCharacterContentLineageBinding {
  if (
    !isRecord(value)
    || !SHA256.test(String(value.bindingDigestSha256 ?? ''))
  ) return false
  try {
    return stableAuthorityStringify(value)
      === stableAuthorityStringify(
        compileLivingFrameNonCharacterContentLineage(input),
      )
  } catch {
    return false
  }
}

function assertInput(
  input: CompileLivingFrameNonCharacterContentLineageInput,
): void {
  if (
    !isRecord(input)
    || !hasExactKeys(input, [
      'mapAnimationPlan',
      'dataVizPlan',
      'documentaryFactSafetyPlan',
      'cases',
    ])
    || !Array.isArray(input.cases)
    || input.cases.length !==
      LIVING_FRAME_NON_CHARACTER_CONTENT_CASE_IDS.length
    || input.cases.some((candidate, order) =>
      candidate.caseId
        !== LIVING_FRAME_NON_CHARACTER_CONTENT_CASE_IDS[order])
  ) throw new Error('Invalid Living Frame non-character content-lineage input.')
  assertMapPlan(input.mapAnimationPlan)
  assertDataVizPlan(input.dataVizPlan)
  assertFactSafetyPlan(input.documentaryFactSafetyPlan)
}

function compileCase(input: {
  readonly candidate:
    LivingFrameNonCharacterContentLineageCaseInput
  readonly order: number
  readonly mapPlan: MapAnimationPlan
  readonly mapItems:
    ReadonlyMap<string, MapAnimationPlanItem>
  readonly dataVizPlan: DataVizPlan
  readonly dataVizItems:
    ReadonlyMap<string, DataVizPlanItem>
  readonly factPlan: DocumentaryFactSafetyPlan
  readonly factItems:
    ReadonlyMap<string, FactSafetyPlanItem>
}): LivingFrameNonCharacterContentLineageCase {
  const { candidate, order } = input
  assertCaseInput(candidate, order)
  const owner = EXPECTED_PLAN_OWNER[candidate.caseId]
  const plan = owner === 'MapAnimationPlan'
    ? input.mapPlan
    : input.dataVizPlan
  const item = owner === 'MapAnimationPlan'
    ? input.mapItems.get(candidate.planningOwnerItemId)
    : input.dataVizItems.get(candidate.planningOwnerItemId)
  if (!item) {
    throw new Error('Living Frame content-lineage owner item is missing.')
  }
  const sourceTruth = owner === 'MapAnimationPlan'
    ? summarizeMapItem(
      candidate.caseId,
      item as MapAnimationPlanItem,
    )
    : summarizeDataVizItem(
      candidate.caseId,
      item as DataVizPlanItem,
    )
  const factSafetyItems = bindFactSafetyItems(
    candidate.linkedFactSafetyItemIds,
    input.factItems,
  )
  const planningOwner = {
    ownerType: owner,
    ownerPlanId: plan.id,
    ownerPlanDigestSha256: sha256AuthorityValue(plan),
    ownerItemId: item.id,
    ownerItemDigestSha256: sha256AuthorityValue(item),
    canonicalApprovedSnapshotRereadRequired: true as const,
    immutableSourceAuthorityClaimed: false as const,
  }
  const factSafety = {
    ownerType: 'DocumentaryFactSafetyPlan' as const,
    ownerPlanId: input.factPlan.id,
    ownerPlanDigestSha256:
      sha256AuthorityValue(input.factPlan),
    linkedFactSafetyItemIds:
      factSafetyItems.map((entry) => entry.id),
    linkedFactSafetyItemSetDigestSha256:
      sha256AuthorityValue(factSafetyItems),
    sourceNeededCount: 0 as const,
    unknownClaimCount: 0 as const,
    canonicalApprovedSnapshotRereadRequired: true as const,
  }
  const approvedWorkSource = compileApprovedWorkSource(
    candidate.approvedToolWorkSourceReferences,
  )
  const toolRoute = compileToolRoute(candidate.caseId, item)
  const sourceEvidenceRefs = structuredClone(
    candidate.sourceEvidenceRefs,
  )
  const withoutDigest = {
    caseId: candidate.caseId,
    order,
    selectedScene: structuredClone(candidate.selectedScene),
    approvedPlanRefs: structuredClone(candidate.approvedPlanRefs),
    sourceEvidenceRefs,
    sourceEvidenceSetDigestSha256:
      sha256AuthorityValue(sourceEvidenceRefs),
    planningOwner,
    sourceTruth,
    factSafety,
    approvedWorkSource,
    toolRoute,
    exactFramesRemainOwnedByMasterTiming: true as const,
    captionsAndOccupancyRemainSeparateOwners: true as const,
    postrenderAiVisualInspectionRequired: true as const,
    canonicalPrivateReviewRequired: true as const,
  }
  return deepFreeze({
    ...withoutDigest,
    caseDigestSha256: sha256AuthorityValue(withoutDigest),
  })
}

function assertCaseInput(
  candidate: LivingFrameNonCharacterContentLineageCaseInput,
  order: number,
): void {
  if (
    !isRecord(candidate)
    || !hasExactKeys(candidate, [
      'caseId',
      'selectedScene',
      'approvedPlanRefs',
      'sourceEvidenceRefs',
      'planningOwnerItemId',
      'linkedFactSafetyItemIds',
      'approvedToolWorkSourceReferences',
    ])
    || candidate.caseId !==
      LIVING_FRAME_NON_CHARACTER_CONTENT_CASE_IDS[order]
    || !SAFE_ID.test(candidate.planningOwnerItemId)
    || !validSelectedScene(
      candidate.selectedScene,
      candidate.caseId,
    )
    || !validApprovedPlanRefs(candidate.approvedPlanRefs)
    || !validSourceEvidenceRefs(
      candidate.sourceEvidenceRefs,
      candidate.caseId,
    )
    || !validSafeIdArray(candidate.linkedFactSafetyItemIds, true)
    || !validApprovedToolWorkSourceReferences(
      candidate.approvedToolWorkSourceReferences,
    )
    || !candidate.approvedToolWorkSourceReferences.workItemIds.includes(
      candidate.approvedPlanRefs.approvedWorkItem.refId,
    )
  ) throw new Error('Invalid Living Frame content-lineage case input.')
}

function validSelectedScene(
  value: LivingFrameNonCharacterSelectedSceneRef,
  caseId: LivingFrameNonCharacterContentCaseId,
): boolean {
  return isRecord(value)
    && hasExactKeys(value, [
      'refId',
      'refVersion',
      'digestSha256',
      'sceneId',
      'mode',
      'professionalSkillComponentVersion',
      'canonicalSelectedSceneBindingVersion',
      'canonicalRereadRequired',
    ])
    && validDigestRefFields(value)
    && SAFE_ID.test(value.sceneId)
    && value.mode === EXPECTED_MODE[caseId]
    && value.professionalSkillComponentVersion ===
      'living-frame-professional-skill-component-v1'
    && value.canonicalSelectedSceneBindingVersion ===
      'canonical-living-frame-selected-scene-binding-v1'
    && value.canonicalRereadRequired === true
}

function validApprovedPlanRefs(
  value: LivingFrameNonCharacterApprovedPlanRefs,
): boolean {
  if (
    !isRecord(value)
    || !hasExactKeys(value, [
      'approvedSnapshot',
      'confirmedOutputFrame',
      'masterTiming',
      'approvedLineageBinding',
      'motionInterval',
      'estimateCostProjection',
      'workGraphProjection',
      'approvedWorkItem',
      'approvedOutputIntent',
      'assetManifest',
      'assetManifestEntry',
      'rendererBinding',
      'rendererLayer',
      'sceneEvidencePackage',
      'postrenderVisualInspectionRequest',
      'deterministicQa',
      'privateReviewAssembly',
    ])
  ) return false
  return Object.values(value).every(validDigestRef)
}

function validSourceEvidenceRefs(
  value: readonly LivingFrameNonCharacterSourceEvidenceRef[],
  caseId: LivingFrameNonCharacterContentCaseId,
): boolean {
  const expectedKinds = new Set<string>(
    EXPECTED_SOURCE_EVIDENCE_KINDS[caseId],
  )
  if (
    !Array.isArray(value)
    || !sameStringSet(
      value.map((entry) => entry.evidenceKind),
      EXPECTED_SOURCE_EVIDENCE_KINDS[caseId],
    )
    || value.some((entry, order) =>
      entry.evidenceKind !==
        EXPECTED_SOURCE_EVIDENCE_KINDS[caseId][order])
    || new Set(value.map((entry) => entry.refId)).size
      !== value.length
  ) return false
  return value.every((entry) =>
    isRecord(entry)
    && hasExactKeys(entry, [
      'refId',
      'refVersion',
      'digestSha256',
      'evidenceKind',
      'canonicalRereadRequired',
      'immutableSourceAuthorityClaimed',
    ])
    && validDigestRefFields(entry)
    && typeof entry.evidenceKind === 'string'
    && expectedKinds.has(entry.evidenceKind)
    && entry.canonicalRereadRequired === true
    && entry.immutableSourceAuthorityClaimed === false)
}

function validDigestRef(
  value: unknown,
): value is LivingFrameNonCharacterDigestRef {
  return isRecord(value)
    && hasExactKeys(value, [
      'refId',
      'refVersion',
      'digestSha256',
    ])
    && validDigestRefFields(value)
}

function validDigestRefFields(
  value: Record<string, unknown>,
): boolean {
  return typeof value.refId === 'string'
    && SAFE_ID.test(value.refId)
    && typeof value.refVersion === 'string'
    && SAFE_VERSION.test(value.refVersion)
    && typeof value.digestSha256 === 'string'
    && SHA256.test(value.digestSha256)
}

function assertMapPlan(plan: MapAnimationPlan): void {
  if (
    !isRecord(plan)
    || typeof plan.id !== 'string'
    || !SAFE_ID.test(plan.id)
    || plan.active !== true
    || !Array.isArray(plan.items)
    || plan.items.length < 2
    || plan.items.length > 128
    || new Set(plan.items.map((item) => item.id)).size
      !== plan.items.length
    || plan.items.some((item) =>
      !isRecord(item)
      || typeof item.id !== 'string'
      || !SAFE_ID.test(item.id))
  ) throw new Error('Invalid Living Frame MapAnimationPlan source.')
}

function assertDataVizPlan(plan: DataVizPlan): void {
  if (
    !isRecord(plan)
    || typeof plan.id !== 'string'
    || !SAFE_ID.test(plan.id)
    || plan.active !== true
    || !Array.isArray(plan.items)
    || plan.items.length < 2
    || plan.items.length > 128
    || new Set(plan.items.map((item) => item.id)).size
      !== plan.items.length
    || plan.items.some((item) =>
      !isRecord(item)
      || typeof item.id !== 'string'
      || !SAFE_ID.test(item.id))
  ) throw new Error('Invalid Living Frame DataVizPlan source.')
}

function assertFactSafetyPlan(
  plan: DocumentaryFactSafetyPlan,
): void {
  if (
    !isRecord(plan)
    || typeof plan.id !== 'string'
    || !SAFE_ID.test(plan.id)
    || plan.active !== true
    || !Array.isArray(plan.claimItems)
    || plan.claimItems.length < 1
    || plan.claimItems.length > 256
    || new Set(plan.claimItems.map((item) => item.id)).size
      !== plan.claimItems.length
  ) throw new Error('Invalid Living Frame DocumentaryFactSafetyPlan source.')
}

function summarizeMapItem(
  caseId: LivingFrameNonCharacterContentCaseId,
  item: MapAnimationPlanItem,
): LivingFrameNonCharacterSourceTruthSummary {
  const expectedVisualTypes = caseId === 'source_bound_map_route'
    ? new Set([
      'route_reveal',
      'documentary_case_map',
      'evidence_location_map',
      'map_behind_subject',
      'map_behind_subject_and_contact_object',
    ])
    : new Set(['full_map_takeover'])
  if (
    !expectedVisualTypes.has(item.mapVisualType)
    || !Array.isArray(item.locations)
    || item.locations.length < 2
    || item.locations.length > 64
    || new Set(item.locations.map((location) => location.id)).size
      !== item.locations.length
    || !item.route
    || !SAFE_ID.test(item.route.id)
    || !item.route.routeLabel.trim()
    || item.route.routeCoordinates.length < 2
    || item.route.routeCoordinates.length > 256
    || item.locations.some((location) =>
      !SAFE_ID.test(location.id)
      || !location.label.trim()
      || location.sourceNeeded
      || location.confidence !== 'exact'
      || location.claimStatus !== 'verified'
      || !location.sourceLabel?.trim()
      || !location.safeWording.trim()
      || !location.coordinates
      || !validCoordinate(location.coordinates))
    || item.route.routeCoordinates.some(
      (coordinate) => !validCoordinate(coordinate),
    )
    || !sameCoordinate(
      item.route.routeCoordinates[0]!,
      item.locations[0]!.coordinates!,
    )
    || !sameCoordinate(
      item.route.routeCoordinates.at(-1)!,
      item.locations.at(-1)!.coordinates!,
    )
    || item.toolChain !== 'map_route_chain'
    || !sameStringSet(item.toolIds, ['d3', 'svg_js', 'remotion'])
    || item.qaChecks.length < 1
  ) throw new Error('Unsafe or non-exact Living Frame map content lineage.')
  const citations = uniqueStrings(
    item.locations.flatMap((location) =>
      location.sourceLabel ? [location.sourceLabel] : []),
  )
  const statuses = uniqueStrings(
    item.locations.flatMap((location) => [
      location.confidence,
      location.claimStatus,
    ]),
  )
  const sourceRecords = {
    locations: item.locations,
    route: item.route,
  }
  return {
    sourceRecordCount:
      item.locations.length + item.route.routeCoordinates.length,
    sourceCitationCount: citations.length,
    sourceNeededCount: 0,
    unknownOrUnsafeCount: 0,
    claimOrConfidenceStatuses: statuses,
    sourceRecordSetDigestSha256:
      sha256AuthorityValue(sourceRecords),
    rawLabelsValuesCoordinatesExcerptsAndClaimsOmitted: true,
    exactMapOrDataMustRemainDeterministic: true,
    generatedVideoMayNotOwnExactContent: true,
  }
}

function summarizeDataVizItem(
  caseId: LivingFrameNonCharacterContentCaseId,
  item: DataVizPlanItem,
): LivingFrameNonCharacterSourceTruthSummary {
  const archive = caseId === 'source_bound_archive_document'
  const allowedVisualTypes = archive
    ? new Set([
      'document_breakdown_card',
      'timeline_diagram',
      'evidence_flow_diagram',
    ])
    : new Set([
      'cause_effect_diagram',
      'process_step_diagram',
      'timeline_diagram',
      'claim_support_diagram',
    ])
  const allowedConfidence = archive
    ? new Set(['verified', 'reported', 'claimed'])
    : new Set(['verified'])
  const records = [
    ...item.dataPlan.dataPoints,
    ...item.dataPlan.nodes,
    ...item.dataPlan.edges,
  ]
  const recordIds = records.map((record) => record.id)
  const nodeIds = new Set(item.dataPlan.nodes.map((node) => node.id))
  if (
    !allowedVisualTypes.has(item.visualType)
    || item.dataPlan.dataSourceType !==
      (archive ? 'uploaded_document' : 'user_provided')
    || !allowedConfidence.has(item.dataPlan.confidence)
    || item.dataPlan.sourceNeeded
    || !item.dataPlan.sourceLabel?.trim()
    || !item.dataPlan.safeWording.trim()
    || item.dataPlan.mockData
    || item.dataPlan.fictionalData
    || records.length < 1
    || records.length > 512
    || new Set(recordIds).size !== recordIds.length
    || records.some((record) =>
      !SAFE_ID.test(record.id)
      || !allowedConfidence.has(record.confidence)
      || !record.sourceLabel?.trim())
    || item.dataPlan.edges.some((edge) =>
      !nodeIds.has(edge.fromNodeId)
      || !nodeIds.has(edge.toNodeId)
      || edge.fromNodeId === edge.toNodeId)
    || (!archive && (
      item.dataPlan.nodes.length < 2
      || item.dataPlan.edges.length < 1
    ))
    || (archive
      ? !sameStringSet(item.toolIds, ['satori', 'svg_js', 'remotion'])
      : !sameStringSet(item.toolIds, ['viz_js', 'svg_js', 'remotion']))
    || item.preferredTool !== (archive ? 'satori' : 'viz_js')
    || item.toolChain !== 'chart_diagram_chain'
    || item.qaChecks.length < 1
    || !item.whyNotAiVideo.trim()
  ) throw new Error('Unsafe or non-exact Living Frame dataviz content lineage.')
  const citations = uniqueStrings([
    item.dataPlan.sourceLabel,
    ...records.flatMap((record) =>
      record.sourceLabel ? [record.sourceLabel] : []),
  ])
  const statuses = uniqueStrings(
    [
      item.dataPlan.confidence,
      ...records.map((record) => record.confidence),
    ],
  )
  return {
    sourceRecordCount: records.length,
    sourceCitationCount: citations.length,
    sourceNeededCount: 0,
    unknownOrUnsafeCount: 0,
    claimOrConfidenceStatuses: statuses,
    sourceRecordSetDigestSha256:
      sha256AuthorityValue(item.dataPlan),
    rawLabelsValuesCoordinatesExcerptsAndClaimsOmitted: true,
    exactMapOrDataMustRemainDeterministic: true,
    generatedVideoMayNotOwnExactContent: true,
  }
}

function bindFactSafetyItems(
  ids: readonly string[],
  factItems: ReadonlyMap<string, FactSafetyPlanItem>,
): readonly FactSafetyPlanItem[] {
  const items = ids.map((id) => factItems.get(id))
  if (
    items.some((item) => !item)
    || items.some((item) =>
      item!.sourceNeeded
      || ['unknown', 'fictional'].includes(item!.claimStatus)
      || !item!.safeWording.trim()
      || item!.visualTreatment === 'needs_user_confirmation'
      || (
        ['allegation', 'charge', 'claim_by_source', 'opinion'].includes(
          item!.claimStatus,
        )
        && !item!.sourceLabel?.trim()
      ))
  ) throw new Error('Unsafe Living Frame documentary fact-safety lineage.')
  return items as readonly FactSafetyPlanItem[]
}

function compileApprovedWorkSource(
  value: ApprovedToolWorkSourceReferences,
) {
  return {
    ownerType: 'ApprovedToolWorkSourceReferences' as const,
    sourceReferencesDigestSha256:
      sha256AuthorityValue(value),
    toolStrategyItemCount: value.toolStrategyItemIds.length,
    professionalSkillCount: value.professionalSkillIds.length,
    renderStrategyItemCount: value.renderStrategyItemIds.length,
    workItemCount: value.workItemIds.length,
    canonicalWorkAndManifestRereadRequired: true as const,
  }
}

function validApprovedToolWorkSourceReferences(
  value: ApprovedToolWorkSourceReferences,
): boolean {
  if (
    !isRecord(value)
    || !hasExactKeys(value, [
      'toolStrategyItemIds',
      'toolStrategyStepIds',
      'professionalSkillIds',
      'backendIntentIds',
      'renderStrategyItemIds',
      'colorOperationIds',
      'audioOperationIds',
      'workItemIds',
    ])
  ) return false
  const arrays = Object.values(value)
  return arrays.every((entry) => validSafeIdArray(entry, false))
    && value.toolStrategyItemIds.length >= 1
    && value.professionalSkillIds.length >= 1
    && value.professionalSkillIds.includes(
      'motion.living_frame_storytelling',
    )
    && value.renderStrategyItemIds.length >= 1
    && value.workItemIds.length >= 1
}

function compileToolRoute(
  caseId: LivingFrameNonCharacterContentCaseId,
  item: MapAnimationPlanItem | DataVizPlanItem,
): LivingFrameNonCharacterToolRouteRef {
  const route = caseId === 'source_bound_archive_document'
    ? {
      toolIds: ['satori', 'svg_js', 'remotion'],
      operationIds: [
        'tool.satori.render_svg_text_card.v1',
        'tool.svg_js.render_svg_overlay.v1',
        'tool.remotion.render_approved_composition.v1',
      ],
    }
    : caseId === 'source_bound_exact_diagram'
      ? {
        toolIds: ['viz_js', 'svg_js', 'remotion'],
        operationIds: [
          'tool.viz_js.render_dot_diagram.v1',
          'tool.svg_js.render_svg_overlay.v1',
          'tool.remotion.render_approved_composition.v1',
        ],
      }
      : {
        toolIds: ['d3', 'svg_js', 'remotion'],
        operationIds: [
          'tool.d3.render_chart_or_diagram.v1',
          'tool.svg_js.render_svg_overlay.v1',
          'tool.remotion.render_approved_composition.v1',
        ],
      }
  if (!sameStringSet(item.toolIds, route.toolIds)) {
    throw new Error('Living Frame controlled-tool route substitution.')
  }
  const routeWithoutDigest = {
    toolIds: route.toolIds,
    operationIds: route.operationIds,
    allIdentitiesAlreadyExist: true as const,
    createsNoToolIdentity: true as const,
    exactContentOwnedByControlledPlanningData: true as const,
    remotionOwnsFinalCanvas: true as const,
    aiVideoOwnsNoExactMapDataDocumentOrLabels: true as const,
    operationRegistrationOrDispatchClaimed: false as const,
  }
  return {
    ...routeWithoutDigest,
    routeDigestSha256: sha256AuthorityValue(routeWithoutDigest),
  }
}

function validCoordinate(value: {
  readonly longitude: number
  readonly latitude: number
}): boolean {
  return Number.isFinite(value.longitude)
    && value.longitude >= -180
    && value.longitude <= 180
    && Number.isFinite(value.latitude)
    && value.latitude >= -90
    && value.latitude <= 90
}

function sameCoordinate(
  first: { readonly longitude: number; readonly latitude: number },
  second: { readonly longitude: number; readonly latitude: number },
): boolean {
  return first.longitude === second.longitude
    && first.latitude === second.latitude
}

function validSafeIdArray(
  value: unknown,
  nonEmpty: boolean,
): value is readonly string[] {
  return Array.isArray(value)
    && (!nonEmpty || value.length >= 1)
    && value.length <= 512
    && new Set(value).size === value.length
    && value.every((entry) =>
      typeof entry === 'string' && SAFE_ID.test(entry))
}

function sameStringSet(
  actual: readonly string[],
  expected: readonly string[],
): boolean {
  return Array.isArray(actual)
    && new Set(actual).size === actual.length
    && [...actual].sort().join('|') === [...expected].sort().join('|')
}

function uniqueStrings(values: readonly string[]): readonly string[] {
  return [...new Set(values)].sort()
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null
    && typeof value === 'object'
    && !Array.isArray(value)
}

function deepFreeze<T>(value: T): T {
  if (
    value == null
    || typeof value !== 'object'
    || Object.isFrozen(value)
  ) return value
  Object.freeze(value)
  for (const child of Object.values(value as Record<string, unknown>)) {
    deepFreeze(child)
  }
  return value
}
