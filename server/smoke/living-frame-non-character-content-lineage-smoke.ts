import assert from 'node:assert/strict'

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
} from '../../src/types/living-frame-non-character-content-lineage'
import type {
  ApprovedToolWorkSourceReferences,
} from '../edit-architecture/approved-tool-work-manifest'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  compileLivingFrameNonCharacterContentLineage,
  verifyLivingFrameNonCharacterContentLineage,
  type CompileLivingFrameNonCharacterContentLineageInput,
} from '../living-frame/living-frame-non-character-content-lineage'

type DeepMutable<T> =
  T extends readonly (infer Item)[]
    ? DeepMutable<Item>[]
    : T extends object
      ? { -readonly [Key in keyof T]: DeepMutable<T[Key]> }
      : T

const cloneMutable = <T>(value: T): DeepMutable<T> =>
  structuredClone(value) as DeepMutable<T>

const sha = (seed: string) => sha256AuthorityValue({ seed })

const mapItem = (
  id: string,
  mapVisualType: MapAnimationPlanItem['mapVisualType'],
): MapAnimationPlanItem => ({
  id,
  segmentId: `segment.${id}`,
  assetPlanItemId: `asset.plan.${id}`,
  visualAssetPlanItemId: `visual.plan.${id}`,
  speakerVisualLayoutItemId: `layout.${id}`,
  depthAwareOverlayItemId: `depth.${id}`,
  mapVisualType,
  title: 'Verified strategic route',
  purpose: 'Explain a verified location relationship.',
  locations: [
    {
      id: `location.${id}.west`,
      label: 'Verified west location',
      dataSource: 'manual_coordinates',
      confidence: 'exact',
      claimStatus: 'verified',
      coordinates: { longitude: 56.22, latitude: 26.57 },
      sourceNeeded: false,
      sourceLabel: 'source.map.coordinates.v1',
      safeWording: 'Verified coordinate from the approved source.',
      notes: [],
    },
    {
      id: `location.${id}.east`,
      label: 'Verified east location',
      dataSource: 'manual_coordinates',
      confidence: 'exact',
      claimStatus: 'verified',
      coordinates: { longitude: 56.64, latitude: 26.37 },
      sourceNeeded: false,
      sourceLabel: 'source.map.coordinates.v1',
      safeWording: 'Verified coordinate from the approved source.',
      notes: [],
    },
  ],
  style: {
    styleFamily: 'documentary_evidence_map',
    baseMapStyle: 'approved-muted-documentary',
    labelDensity: 'low',
    colorPalette: ['#101319', '#f4f0e6'],
    routeColor: '#ff7a1a',
    markerColor: '#f4f0e6',
    highlightColor: '#ff7a1a',
    documentaryNeutrality: true,
    darkMode: true,
    notes: [],
  },
  camera: {
    animationType: 'route_draw',
    center: { longitude: 56.43, latitude: 26.47 },
    zoom: 8,
    holdDurationMs: 1600,
    notes: [],
  },
  route: {
    id: `route.${id}`,
    routeCoordinates: [
      { longitude: 56.22, latitude: 26.57 },
      { longitude: 56.43, latitude: 26.47 },
      { longitude: 56.64, latitude: 26.37 },
    ],
    routeLabel: 'Verified route',
    routeRevealDurationMs: 900,
    routeLineColor: '#ff7a1a',
    routeLineWidth: 3,
    direction: 'start_to_end',
    notes: [],
  },
  layout: {
    layoutMode: mapVisualType === 'full_map_takeover'
      ? 'full_map_takeover'
      : 'object_anchored_callout',
    frameTemplateType: 'horizontal_wide_frame',
    safeMargins: 64,
    panelBackgroundColor: '#101319',
    foregroundMaskAware: mapVisualType !== 'full_map_takeover',
    labelAvoidZones: [],
    depthCompositingMode: mapVisualType === 'full_map_takeover'
      ? 'full_visual_replacement'
      : 'graphic_behind_subject',
    maskStrategy: mapVisualType === 'full_map_takeover'
      ? 'none'
      : 'subject_mask',
    notes: [],
  },
  toolChain: 'map_route_chain',
  toolIds: ['d3', 'svg_js', 'remotion'],
  remotionCapabilities: [
    'map_layer_placement',
    'motion_design',
    'caption_safe_composition',
  ],
  soundSyncCueIds: [`sound.cue.${id}`],
  creditImpact: 'low',
  tierAllowed: { basic: true, pro: true, premium: true },
  reason: 'Deterministic map geometry is required.',
  fallbackStrategy: ['static verified route card'],
  qaChecks: ['coordinates and labels match approved source'],
  workerNotes: [],
})

const dataVizItem = (
  id: string,
  archive: boolean,
): DataVizPlanItem => ({
  id,
  segmentId: `segment.${id}`,
  assetPlanItemId: `asset.plan.${id}`,
  visualAssetPlanItemId: `visual.plan.${id}`,
  speakerVisualLayoutItemId: `layout.${id}`,
  renderStrategyItemId: `render.strategy.${id}`,
  toolStrategyItemId: `tool.strategy.${id}`,
  visualType: archive
    ? 'document_breakdown_card'
    : 'cause_effect_diagram',
  title: archive ? 'Approved source document' : 'Verified causal model',
  purpose: archive
    ? 'Present a sourced document without inventing text.'
    : 'Explain exact approved relationships.',
  dataPlan: {
    id: `data.${id}`,
    dataSourceType: archive ? 'uploaded_document' : 'user_provided',
    confidence: 'verified',
    sourceNeeded: false,
    sourceLabel: archive
      ? 'source.document.upload.v1'
      : 'source.diagram.rows.v1',
    safeWording: 'Display only approved, source-bound content.',
    mockData: false,
    fictionalData: false,
    dataPoints: archive
      ? [{
        id: `point.${id}.date`,
        label: 'Approved date field',
        value: 'approved-value',
        confidence: 'reported',
        sourceLabel: 'source.document.upload.v1',
        notes: [],
      }]
      : [{
        id: `point.${id}.metric`,
        label: 'Verified metric',
        value: 42,
        unit: 'approved-units',
        confidence: 'verified',
        sourceLabel: 'source.diagram.rows.v1',
        notes: [],
      }],
    nodes: [
      {
        id: `node.${id}.a`,
        label: archive ? 'Approved excerpt A' : 'Verified cause',
        nodeType: archive ? 'document' : 'step',
        confidence: archive ? 'claimed' : 'verified',
        sourceLabel: archive
          ? 'source.document.upload.v1'
          : 'source.diagram.rows.v1',
        visualRole: 'primary',
        notes: [],
      },
      {
        id: `node.${id}.b`,
        label: archive ? 'Approved excerpt B' : 'Verified effect',
        nodeType: archive ? 'claim' : 'step',
        confidence: archive ? 'reported' : 'verified',
        sourceLabel: archive
          ? 'source.document.upload.v1'
          : 'source.diagram.rows.v1',
        visualRole: 'secondary',
        notes: [],
      },
    ],
    edges: [{
      id: `edge.${id}.a-b`,
      fromNodeId: `node.${id}.a`,
      toNodeId: `node.${id}.b`,
      label: 'Approved relationship',
      direction: 'left_to_right',
      confidence: archive ? 'reported' : 'verified',
      sourceLabel: archive
        ? 'source.document.upload.v1'
        : 'source.diagram.rows.v1',
      notes: [],
    }],
    qaChecks: ['all visible values and labels retain source lineage'],
    notes: [],
  },
  style: {
    styleFamily: archive
      ? 'documentary_evidence_diagram'
      : 'clean_visual_explain',
    colorPalette: ['#101319', '#f4f0e6'],
    highlightColor: '#ff7a1a',
    labelDensity: 'low',
    typographyScale: 'normal',
    lineWeight: 'medium',
    cardStyle: 'approved-documentary-card',
    documentaryNeutrality: true,
    brandColorUse: false,
    playfulElementsAllowed: false,
    notes: [],
  },
  animation: {
    animationType: archive ? 'step_reveal' : 'sequence_build',
    durationMs: 1800,
    revealOrder: [`node.${id}.a`, `node.${id}.b`],
    easing: 'ease-in-out',
    soundSyncCueIds: [`sound.cue.${id}`],
    notes: [],
  },
  layout: {
    layoutMode: archive ? 'full_evidence_board' : 'full_graphic_explainer',
    frameTemplateType: archive
      ? 'evidence_board'
      : 'horizontal_wide_frame',
    safeMargins: 64,
    panelBackgroundColor: '#101319',
    labelAvoidZones: [],
    maxLabelCount: 8,
    compactMode: false,
    fullTakeoverMode: true,
    notes: [],
  },
  preferredTool: archive ? 'satori' : 'viz_js',
  toolChain: 'chart_diagram_chain',
  toolIds: archive
    ? ['satori', 'svg_js', 'remotion']
    : ['viz_js', 'svg_js', 'remotion'],
  remotionCapabilities: [
    archive ? 'evidence_board' : 'diagram_build',
    'motion_design',
    'caption_safe_composition',
  ],
  creditImpact: 'low',
  tierAllowed: { basic: true, pro: true, premium: true },
  reason: 'Exact text and relationships require deterministic rendering.',
  whyNotAiVideo: 'AI video must not invent exact labels, values, or citations.',
  fallbackStrategy: ['static source-bound card'],
  qaChecks: ['compare visible content with approved source records'],
  workerNotes: [],
})

const mapAnimationPlan: MapAnimationPlan = {
  id: 'plan.map.living-frame.v1',
  active: true,
  summary: 'Source-bound map and hybrid plans.',
  items: [
    mapItem('map.route.living-a-roll.v1', 'map_behind_subject'),
    mapItem('map.hybrid.expansion.v1', 'full_map_takeover'),
  ],
  mapToolsPlanned: ['d3', 'svg_js', 'remotion'],
  globalRules: ['verified coordinates only'],
  qaChecks: ['source lineage required'],
  limitations: [],
  notes: [],
}

const dataVizPlan: DataVizPlan = {
  id: 'plan.dataviz.living-frame.v1',
  active: true,
  summary: 'Source-bound archive and diagram plans.',
  items: [
    dataVizItem('archive.document.v1', true),
    dataVizItem('diagram.exact.v1', false),
  ],
  toolsPlanned: ['viz_js', 'satori', 'svg_js', 'remotion'],
  globalRules: ['approved source content only'],
  qaChecks: ['source values must match'],
  limitations: [],
  notes: [],
}

const factItem = (
  id: string,
  sourceLabel: string,
): FactSafetyPlanItem => ({
  id,
  claimText: 'Approved claim text retained only in the fact owner.',
  peopleMentioned: [],
  organizationsMentioned: [],
  claimStatus: 'claim_by_source',
  sourceNeeded: false,
  sourceLabel,
  safeWording: 'According to the approved source.',
  visualTreatment: 'source_attribution_card',
  avoidRules: ['do not present as independently verified'],
  qaChecks: ['source attribution remains visible'],
  severity: 'medium',
})

const documentaryFactSafetyPlan: DocumentaryFactSafetyPlan = {
  id: 'plan.fact-safety.living-frame.v1',
  active: true,
  claimItems: LIVING_FRAME_NON_CHARACTER_CONTENT_CASE_IDS.map((caseId) =>
    factItem(`fact.${caseId}.v1`, `source.${caseId}.v1`)),
  globalRules: ['never invent documentary claims'],
  clarifyingQuestions: [],
  qaChecks: ['all claims retain source treatment'],
  notes: [],
}

const digestRef = (id: string, version: string) => ({
  refId: id,
  refVersion: version,
  digestSha256: sha(`${id}:${version}`),
})

const workSource = (
  caseId: string,
): ApprovedToolWorkSourceReferences => ({
  toolStrategyItemIds: [`tool.strategy.${caseId}.v1`],
  toolStrategyStepIds: [`tool.step.${caseId}.v1`],
  professionalSkillIds: ['motion.living_frame_storytelling'],
  backendIntentIds: [`intent.${caseId}.v1`],
  renderStrategyItemIds: [`render.strategy.${caseId}.v1`],
  colorOperationIds: [],
  audioOperationIds: [`audio.operation.${caseId}.v1`],
  workItemIds: [`work.${caseId}.v1`],
})

const modeByCase = {
  source_bound_map_route: 'living_a_roll',
  source_bound_archive_document: 'living_archive',
  source_bound_exact_diagram: 'living_diagram',
  source_bound_hybrid_expansion: 'hybrid_expansion',
} as const

const ownerItemByCase = {
  source_bound_map_route: 'map.route.living-a-roll.v1',
  source_bound_archive_document: 'archive.document.v1',
  source_bound_exact_diagram: 'diagram.exact.v1',
  source_bound_hybrid_expansion: 'map.hybrid.expansion.v1',
} as const

const sourceEvidenceKindsByCase = {
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
} as const

const baseInput: CompileLivingFrameNonCharacterContentLineageInput = {
  mapAnimationPlan,
  dataVizPlan,
  documentaryFactSafetyPlan,
  cases: LIVING_FRAME_NON_CHARACTER_CONTENT_CASE_IDS.map((caseId) => ({
    caseId,
    selectedScene: {
      ...digestRef(
        `selected-scene.${caseId}.v1`,
        'canonical-living-frame-selected-scene-binding-v1',
      ),
      sceneId: `scene.${caseId}.v1`,
      mode: modeByCase[caseId],
      professionalSkillComponentVersion:
        'living-frame-professional-skill-component-v1',
      canonicalSelectedSceneBindingVersion:
        'canonical-living-frame-selected-scene-binding-v1',
      canonicalRereadRequired: true,
    },
    approvedPlanRefs: {
      approvedSnapshot: digestRef('snapshot.lf.v1', 'approved-plan-snapshot-v1'),
      confirmedOutputFrame: digestRef('frame.lf.v1', 'confirmed-output-frame-v1'),
      masterTiming: digestRef('timing.lf.v1', 'master-timing-plan-v1'),
      approvedLineageBinding: digestRef('lineage.lf.v1', 'living-frame-approved-lineage-binding-v1'),
      motionInterval: digestRef(`motion.${caseId}.v1`, 'living-frame-motion-spec-v3'),
      estimateCostProjection: digestRef(`estimate.${caseId}.v1`, 'canonical-living-frame-estimate-work-asset-projection-v5'),
      workGraphProjection: digestRef(`work-graph.${caseId}.v1`, 'canonical-living-frame-work-graph-projection-v10'),
      approvedWorkItem: digestRef(`work.${caseId}.v1`, 'approved-edit-work-item-v1'),
      approvedOutputIntent: digestRef(`output.${caseId}.v1`, 'living-frame-output-intent-v1'),
      assetManifest: digestRef(`asset-manifest.${caseId}.v1`, 'editing-asset-manifest-v1'),
      assetManifestEntry: digestRef(`asset-entry.${caseId}.v1`, 'editing-asset-manifest-entry-v1'),
      rendererBinding: digestRef(`renderer.${caseId}.v1`, 'living-frame-remotion-binding-v1'),
      rendererLayer: digestRef(`layer.${caseId}.v1`, 'living-frame-layer-manifest-v1'),
      sceneEvidencePackage: digestRef(`evidence.${caseId}.v1`, 'living-frame-scene-evidence-package-v1'),
      postrenderVisualInspectionRequest: digestRef(`visual-qa.${caseId}.v1`, 'living-frame-postrender-visual-inspection-request-v1'),
      deterministicQa: digestRef(`technical-qa.${caseId}.v1`, 'approved-final-technical-qa-v1'),
      privateReviewAssembly: digestRef(`private-review.${caseId}.v1`, 'canonical-private-review-assembly-v1'),
    },
    sourceEvidenceRefs: sourceEvidenceKindsByCase[caseId].map(
      (evidenceKind) => ({
        ...digestRef(
          `source-evidence.${caseId}.${evidenceKind}.v1`,
          'canonical-source-evidence-ref-v1',
        ),
        evidenceKind,
        canonicalRereadRequired: true,
        immutableSourceAuthorityClaimed: false,
      }),
    ),
    planningOwnerItemId: ownerItemByCase[caseId],
    linkedFactSafetyItemIds: [`fact.${caseId}.v1`],
    approvedToolWorkSourceReferences: workSource(caseId),
  })),
}

const binding = compileLivingFrameNonCharacterContentLineage(baseInput)
assert.equal(binding.caseCount, 4)
assert.equal(binding.cases.length, 4)
assert.equal(binding.bindingState,
  'all_representative_content_refs_bound_canonical_reread_and_admission_pending')
assert.equal(binding.authorityBoundary.structuralBindingOnly, true)
assert.equal(binding.authorityBoundary.sourceEvidenceAuthority, false)
assert.equal(binding.authorityBoundary.hybridTimingAuthority, false)
assert.equal(binding.authorityBoundary.runtimeAuthority, false)
assert.equal(binding.authorityBoundary.qaApprovalAuthority, false)
assert.equal(binding.productionReady, false)
assert.equal(binding.animatedLivingOrOrganicSubjectAllowed, false)
assert.equal(binding.mechanicalRiggingAllowed, false)
assert.equal(binding.containsRawMapCoordinatesDataValuesDocumentExcerptsOrClaims, false)
assert.equal(verifyLivingFrameNonCharacterContentLineage(binding, baseInput), true)
for (const [order, item] of binding.cases.entries()) {
  assert.equal(item.order, order)
  assert.equal(item.caseId, LIVING_FRAME_NON_CHARACTER_CONTENT_CASE_IDS[order])
  assert.equal(item.sourceTruth.sourceNeededCount, 0)
  assert.equal(item.sourceTruth.unknownOrUnsafeCount, 0)
  assert.equal(item.sourceTruth.rawLabelsValuesCoordinatesExcerptsAndClaimsOmitted, true)
  assert.ok(item.sourceEvidenceRefs.length >= 1)
  assert.equal(item.toolRoute.createsNoToolIdentity, true)
  assert.equal(item.toolRoute.remotionOwnsFinalCanvas, true)
  assert.equal(item.exactFramesRemainOwnedByMasterTiming, true)
  assert.equal(item.postrenderAiVisualInspectionRequired, true)
}
assert.deepEqual(binding.cases[0]!.toolRoute.toolIds,
  ['d3', 'svg_js', 'remotion'])
assert.deepEqual(binding.cases[1]!.toolRoute.toolIds,
  ['satori', 'svg_js', 'remotion'])
assert.deepEqual(binding.cases[2]!.toolRoute.toolIds,
  ['viz_js', 'svg_js', 'remotion'])
assert.deepEqual(binding.cases[3]!.toolRoute.toolIds,
  ['d3', 'svg_js', 'remotion'])

let adversarialChecks = 0
const reject = (
  mutate: (
    candidate:
      DeepMutable<CompileLivingFrameNonCharacterContentLineageInput>,
  ) => void,
) => {
  const candidate = cloneMutable(baseInput)
  mutate(candidate)
  assert.throws(() => compileLivingFrameNonCharacterContentLineage(candidate))
  adversarialChecks += 1
}

reject((candidate) => {
  candidate.mapAnimationPlan.items[0]!.locations[0]!.confidence = 'approximate'
})
reject((candidate) => {
  candidate.mapAnimationPlan.items[0]!.locations[0]!.sourceNeeded = true
})
reject((candidate) => {
  candidate.mapAnimationPlan.items[0]!.toolIds = ['custom', 'remotion']
})
reject((candidate) => {
  candidate.dataVizPlan.items[0]!.dataPlan.confidence = 'unknown'
})
reject((candidate) => {
  candidate.dataVizPlan.items[0]!.dataPlan.mockData = true
})
reject((candidate) => {
  delete candidate.dataVizPlan.items[1]!.dataPlan.dataPoints[0]!.sourceLabel
})
reject((candidate) => {
  candidate.dataVizPlan.items[0]!.preferredTool = 'viz_js'
})
reject((candidate) => {
  candidate.mapAnimationPlan.items[1]!.toolChain = 'chart_diagram_chain'
})
reject((candidate) => {
  candidate.dataVizPlan.items[1]!.dataPlan.edges[0]!.toNodeId =
    'node.not-approved.v1'
})
reject((candidate) => {
  candidate.mapAnimationPlan.items[0]!.locations[1]!.id =
    candidate.mapAnimationPlan.items[0]!.locations[0]!.id
})
reject((candidate) => {
  candidate.mapAnimationPlan.items[0]!.route!.routeCoordinates[0] = {
    longitude: 0,
    latitude: 0,
  }
})
reject((candidate) => {
  candidate.cases[0]!.sourceEvidenceRefs =
    candidate.cases[0]!.sourceEvidenceRefs.slice(0, 1)
})
reject((candidate) => {
  candidate.cases[1]!.sourceEvidenceRefs[0]!.evidenceKind =
    'dataviz_approved_rows'
})
reject((candidate) => {
  candidate.cases[3]!.sourceEvidenceRefs = [
    ...candidate.cases[3]!.sourceEvidenceRefs,
  ].reverse()
})
reject((candidate) => {
  candidate.cases[3]!.selectedScene.mode = 'living_diagram'
})
reject((candidate) => {
  candidate.cases[3]!.approvedPlanRefs.motionInterval.digestSha256 = sha('forged')
  candidate.cases[3]!.approvedPlanRefs.motionInterval.refVersion = '../../clock'
})
reject((candidate) => {
  candidate.cases[0]!.linkedFactSafetyItemIds = ['fact.missing.v1']
})
reject((candidate) => {
  candidate.documentaryFactSafetyPlan.claimItems[0]!.claimStatus = 'unknown'
})
reject((candidate) => {
  candidate.documentaryFactSafetyPlan.claimItems[0]!.claimStatus = 'fictional'
})
reject((candidate) => {
  candidate.cases[1]!.approvedToolWorkSourceReferences.workItemIds = []
})
reject((candidate) => {
  candidate.cases[1]!.approvedToolWorkSourceReferences.professionalSkillIds = [
    'motion.unrelated_skill',
  ]
})
reject((candidate) => {
  candidate.cases[2]!.approvedPlanRefs.approvedWorkItem.refId =
    'work.cross-scene-substitution.v1'
})
reject((candidate) => {
  Object.assign(candidate.cases[2]!, { rawDocumentText: 'smuggled text' })
})

assert.equal(adversarialChecks, 23)

console.log(JSON.stringify({
  contractVersion: binding.contractVersion,
  bindingDigestSha256: binding.bindingDigestSha256,
  caseIds: binding.cases.map((item) => item.caseId),
  sourceRecordCounts: binding.cases.map((item) => item.sourceTruth.sourceRecordCount),
  adversarialChecks,
  canonicalRereadAndAdmissionPending: true,
  runtimeExecuted: binding.runtimeExecuted,
  productionReady: binding.productionReady,
}, null, 2))
