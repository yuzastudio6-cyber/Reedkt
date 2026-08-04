import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import {
  CAPTION_DOMAIN_CONTRACT_VERSIONS,
  type CaptionDomainContract,
  type CaptionDomainContractKind,
  type CaptionDomainPayloadMap,
  type CaptionDomainRef,
} from '../../src/types/caption-domain-contracts'
import { CAPTION_DESIGN_COMPOSITE } from '../captions-specialist/caption-design-composite'
import {
  createCaptionDomainContract,
  parseCaptionDomainContract,
} from '../captions-specialist/caption-domain-contracts'
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
function ref(id: string): CaptionDomainRef {
  return {
    id,
    version: `${id}-v1`,
    contentHash: createHash('sha256').update(id, 'utf8').digest('hex'),
  }
}
const compositeRef: CaptionDomainRef = {
  id: CAPTION_DESIGN_COMPOSITE.compositeId,
  version: CAPTION_DESIGN_COMPOSITE.compositeVersion,
  contentHash: CAPTION_DESIGN_COMPOSITE.compositeDigestSha256,
}
const confirmedFrameRef = ref('frame')
const transcriptRef = ref('transcript')
const masterTimingRef = ref('mastertiming')
const common: Pick<
  CaptionDomainContract<'strategy_plan'>,
  | 'canonicalScope'
  | 'sourceBindings'
  | 'stalenessTuple'
  | 'privateArtifact'
  | 'byteFree'
  | 'authorityBoundary'
> = {
  canonicalScope: {
    ownerUserId: 'owner.fixture',
    workspaceId: 'workspace.fixture',
    projectId: 'project.fixture',
    editSessionId: 'edit.fixture',
    planVersionId: 'plan.fixture.v1',
    approvedSnapshotRef: null,
    outputId: 'output.vertical',
    sceneId: 'scene.one',
    authorizedFrameRanges: [{ startFrame: 0, endFrameExclusive: 300 }],
  },
  sourceBindings: {
    captionCompositeRef: compositeRef,
    confirmedOutputFrameRef: confirmedFrameRef,
    canonicalTranscriptRef: transcriptRef,
    masterTimingRef,
    storyTimingRef: null,
    captionApprovalEnvelopeRef: null,
  },
  stalenessTuple: [
    compositeRef, confirmedFrameRef, transcriptRef, masterTimingRef,
    ref('source'), ref('layout'), ref('timing'),
  ],
  privateArtifact: true as const,
  byteFree: true as const,
  authorityBoundary: {
    canonicalApprovalGranted: false as const,
    snapshotMutationGranted: false as const,
    timelineMutationGranted: false as const,
    workCreationGranted: false as const,
    providerDispatchGranted: false as const,
    runtimeExecutionGranted: false as const,
    assetCreationGranted: false as const,
    costAuthorityGranted: false as const,
    billingAuthorityGranted: false as const,
    finalQaApprovalGranted: false as const,
    finalCanvasAuthorityGranted: false as const,
    publicDeliveryGranted: false as const,
    productionAuthorityGranted: false as const,
  },
}

const payloads: CaptionDomainPayloadMap = {
  strategy_plan: {
    projectMode: 'dynamic_short_form',
    approximateDensity: 'balanced',
    primaryLanguage: 'en',
    accessibleProjectionRequired: true,
    integrationClasses: ['clean_phrase', 'hero'],
    allowedTypographyRoles: ['primary_speech', 'hero_display'],
    likelyHeroMomentCount: 1,
    likelyMaskOrTrackingNeeded: false,
    likelyCaptionToVisualHandoffNeeded: false,
    estimateFactorCodes: ['output_count', 'render_complexity'],
    reasonCodes: ['speech_carries_story'],
  },
  opportunity_map: {
    opportunities: [{
      opportunityId: 'opportunity.one',
      sceneId: 'scene.one',
      frameRange: { startFrame: 30, endFrameExclusive: 90 },
      semanticPurposeCode: 'establish_main_idea',
      integrationClass: 'hero',
      confidenceBasisPoints: 9000,
      likelyNeedsVisualEvidence: true,
      likelyNeedsTracking: false,
      heroCandidate: true,
      handoffCandidate: false,
      sourcePhraseIds: ['phrase.one'],
    }],
  },
  integration_classification: {
    sceneClassifications: [{
      sceneId: 'scene.one',
      integrationClass: 'hero',
      reasonCodes: ['single_high_value_phrase'],
      deliberateNonUse: false,
    }],
  },
  reservation_plan: {
    reservations: [{
      reservationId: 'reservation.one',
      sceneId: 'scene.one',
      frameRange: { startFrame: 30, endFrameExclusive: 90 },
      regionBasisPoints: { x: 800, y: 6500, width: 8400, height: 2200 },
      priority: 'caption_primary',
      protectedRegionIds: ['face.one'],
      fallbackRegionIds: ['zone.upper'],
    }],
    intentOnly: true,
    createsLayoutAuthority: false,
  },
  approval_envelope: {
    allowedProjectModes: ['dynamic_short_form'],
    allowedTypographyRoles: ['primary_speech', 'hero_display'],
    maximumMotionLevel: 'moderate',
    maximumHeroMoments: 2,
    subjectOverlapAllowed: false,
    objectAnchoringAllowed: false,
    captionToVisualAllowed: true,
    captionSoundAllowed: false,
    allowedTextTransformations: ['exact', 'punctuation_cleanup'],
    languages: ['en'],
    accessibleOutputKinds: ['srt', 'webvtt'],
    maximumCaptionCredits: 250,
    approvedFallbackIds: ['clean_phrase'],
    canonicalApprovalStillRequired: true,
  },
  style_profile: {
    projectMode: 'dynamic_short_form',
    typographyRoles: [{
      roleId: 'primary_speech',
      purposeCode: 'readable_speech',
      allowedSceneIds: ['scene.one'],
      maximumFrequency: 30,
      fontAssetRef: ref('font'),
      weightCodes: ['bold'],
      colorRoleIds: ['base_speech'],
      motionPresetIds: ['caption.fade'],
      supportedScriptCodes: ['latin'],
      fallbackRoleId: null,
    }],
    colorRoles: [{
      colorRoleId: 'base_speech',
      semanticPurposeCode: 'primary_readability',
      colorTokenRef: ref('color'),
      nonColorCounterpartRequired: true,
    }],
    legibility: {
      minimumContrastRatioMilli: 4500,
      strokeAllowed: true,
      shadowAllowed: true,
      backplateAllowed: true,
      localScrimAllowed: true,
      backgroundBlurAllowed: false,
    },
    motionLanguage: {
      allowedPrimitiveIds: ['caption.fade'],
      repetitionLimit: 4,
      reducedMotionReplacementIds: ['caption.cut'],
      modelAuthoredCodeAllowed: false,
    },
    placementLanguage: {
      preferredZoneIds: ['zone.lower'],
      fallbackZoneIds: ['zone.upper'],
      protectedRoleCodes: ['face', 'product'],
      allowedDepthPlanes: ['foreground_hero'],
    },
  },
  lifecycle: {
    state: 'early_planned',
    affectedSceneIds: ['scene.one'],
    transitionReasonCodes: ['strategy_created'],
    priorLifecycleRef: null,
    globalWorkflowOwnerChanged: false,
  },
  dependency_manifest: {
    dependencies: [{
      dependencyId: 'dependency.transcript',
      ownerKey: 'canonical_transcript_owner',
      artifactType: 'canonical_transcript',
      requiredForJobTypes: ['resolve_semantic_caption_phrases'],
      status: 'ready',
      artifactRef: ref('transcript'),
      affectedSceneIds: ['scene.one'],
      blockerCode: null,
    }],
    unrelatedScenesMayContinue: true,
  },
  finish_readiness: {
    pictureLockRef: ref('picturelock'),
    gates: [{
      gateCode: 'confirmed_frame',
      status: 'ready',
      evidenceRef: ref('frame'),
      affectedSceneIds: ['scene.one'],
    }],
    readySceneIds: ['scene.one'],
    blockedSceneIds: [],
    allFinalCaptionScenesReady: true,
    staleFinalSceneRenderAllowed: false,
  },
  scene_graph: {
    nodes: [{
      nodeId: 'node.speech',
      sceneId: 'scene.one',
      trackRole: 'semantic_phrase',
      phraseLineageRefs: [ref('phrase')],
      typographyRoleId: 'primary_speech',
      timingRequirementRef: ref('timingrequest'),
      depthPlane: 'foreground_hero',
      maskOrTrackRef: null,
      objectAnchorRef: null,
      motionIntentRef: ref('motionintent'),
      accessibilityCounterpartNodeId: 'node.accessible',
      fallbackId: 'clean_phrase',
    }, {
      nodeId: 'node.accessible',
      sceneId: 'scene.one',
      trackRole: 'accessible_sidecar',
      phraseLineageRefs: [ref('phrase')],
      typographyRoleId: 'primary_speech',
      timingRequirementRef: ref('timingrequest'),
      depthPlane: 'foreground_hero',
      maskOrTrackRef: null,
      objectAnchorRef: null,
      motionIntentRef: null,
      accessibilityCounterpartNodeId: 'node.speech',
      fallbackId: 'srt',
    }],
    edges: [{
      edgeId: 'edge.accessible',
      fromNodeId: 'node.speech',
      toNodeId: 'node.accessible',
      edgeKind: 'accessibility_counterpart',
    }],
    remotionRemainsFinalCanvas: true,
  },
  motion_lock: {
    motions: [{
      nodeId: 'node.speech',
      motionPrimitiveId: 'caption.fade',
      semanticTimingRequestRef: ref('timingrequest'),
      resolvedStoryTimingRef: null,
      reducedMotionPrimitiveId: 'caption.cut',
    }],
    storyTimingSoleFrameAuthority: true,
    captionAuthoredExecutableFrames: false,
    modelAuthoredCodeAllowed: false,
  },
  render_spec: {
    renderer: 'remotion',
    confirmedFrameRef: ref('frame'),
    sceneGraphRef: ref('scenegraph'),
    motionLockRef: ref('motionlock'),
    fontAssetRefs: [ref('font')],
    layerOrderRule: 'caption_above_living_frame',
    executableCodeIncluded: false,
    arbitraryAssTagsIncluded: false,
    arbitraryFfmpegArgumentsIncluded: false,
    finalCanvasOwner: 'remotion',
  },
  qa_report: {
    checks: [{
      checkCode: 'caption_readability',
      disposition: 'passed',
      affectedSceneIds: ['scene.one'],
      evidenceRefs: [ref('qaevidence')],
      proposedRepairCode: null,
    }],
    captionQaRecommendation: 'accept_caption_scope',
    independentFinalQaStillRequired: true,
  },
  repair_plan: {
    repairs: [{
      repairId: 'repair.one',
      issueCode: 'placement_collision',
      affectedSceneIds: ['scene.one'],
      affectedNodeIds: ['node.speech'],
      repairActionCode: 'alternate_zone_reflow',
      fallbackId: 'clean_phrase',
      requiresNewApproval: false,
      requiresReinspection: true,
    }],
    smallestAffectedScopeOnly: true,
    hiddenQualityDowngradeAllowed: false,
    unrelatedWorkMayContinue: true,
  },
}

const contracts = (Object.keys(payloads) as CaptionDomainContractKind[]).map(
  (contractKind) => {
    const contractCommon = structuredClone(common)
    if (contractKind === 'finish_readiness') {
      const snapshotRef = ref('snapshot')
      const storyTimingRef = ref('storytiming')
      const approvalRef = ref('approval')
      contractCommon.canonicalScope.approvedSnapshotRef = snapshotRef
      contractCommon.sourceBindings.storyTimingRef = storyTimingRef
      contractCommon.sourceBindings.captionApprovalEnvelopeRef = approvalRef
      contractCommon.stalenessTuple.push(
        snapshotRef, storyTimingRef, approvalRef,
      )
    }
    return createCaptionDomainContract({
    contractId: `contract.${contractKind}`,
    contractKind,
    ...contractCommon,
    payload: payloads[contractKind],
  } as Omit<CaptionDomainContract<typeof contractKind>,
    'schemaVersion' | 'contractVersion' | 'contractDigestSha256'>)
  },
)

check(contracts.length === 14, 'All 14 core Caption domain contracts must publish.')
check(
  contracts.every((contract) =>
    contract.contractVersion === CAPTION_DOMAIN_CONTRACT_VERSIONS[contract.contractKind]),
  'Each domain kind must bind its exact version.',
)
check(
  contracts.every((contract) => parseCaptionDomainContract(contract).byteFree),
  'Every contract must round-trip as byte-free closed data.',
)
check(
  contracts.every((contract) =>
    Object.values(contract.authorityBoundary).every((claim) => claim === false)),
  'Every domain contract must keep canonical authority closed.',
)
check(
  contracts.every((contract) =>
    contract.sourceBindings.captionCompositeRef.contentHash
      === CAPTION_DESIGN_COMPOSITE.compositeDigestSha256),
  'Every contract must bind the canonical Caption composite.',
)
check(
  contracts.every((contract) =>
    calculateSkillContractDigest(
      contract as unknown as Record<string, unknown>,
      'contractDigestSha256',
    ) === contract.contractDigestSha256),
  'Every domain digest must recompute exactly.',
)

const tampered = structuredClone(contracts[0])
tampered.contractDigestSha256 = 'f'.repeat(64)
expectThrow(() => parseCaptionDomainContract(tampered))

const wrongVersion = structuredClone(contracts[0])
wrongVersion.contractVersion = 'caption-opportunity-map-v1'
wrongVersion.contractDigestSha256 = calculateSkillContractDigest(
  wrongVersion as unknown as Record<string, unknown>, 'contractDigestSha256',
)
expectThrow(() => parseCaptionDomainContract(wrongVersion))

const unknownField = { ...structuredClone(contracts[0]), hiddenOwner: true }
expectThrow(() => parseCaptionDomainContract(unknownField))

const unsafe = structuredClone(contracts[0])
unsafe.contractId = 'https://unsafe.example'
unsafe.contractDigestSha256 = calculateSkillContractDigest(
  unsafe as unknown as Record<string, unknown>, 'contractDigestSha256',
)
expectThrow(() => parseCaptionDomainContract(unsafe))

const authority = structuredClone(contracts[0]) as unknown as Record<string, unknown>
;(authority.authorityBoundary as Record<string, unknown>).workCreationGranted = true
authority.contractDigestSha256 = calculateSkillContractDigest(
  authority, 'contractDigestSha256',
)
expectThrow(() => parseCaptionDomainContract(authority))

const duplicateStaleness = structuredClone(contracts[0])
duplicateStaleness.stalenessTuple.push(structuredClone(duplicateStaleness.stalenessTuple[0]))
duplicateStaleness.contractDigestSha256 = calculateSkillContractDigest(
  duplicateStaleness as unknown as Record<string, unknown>, 'contractDigestSha256',
)
expectThrow(() => parseCaptionDomainContract(duplicateStaleness))

const reservation = structuredClone(contracts.find(
  (contract) => contract.contractKind === 'reservation_plan',
)!) as CaptionDomainContract<'reservation_plan'>
reservation.payload.reservations[0].regionBasisPoints.x = 9000
reservation.contractDigestSha256 = calculateSkillContractDigest(
  reservation as unknown as Record<string, unknown>, 'contractDigestSha256',
)
expectThrow(() => parseCaptionDomainContract(reservation))

const dependency = structuredClone(contracts.find(
  (contract) => contract.contractKind === 'dependency_manifest',
)!) as CaptionDomainContract<'dependency_manifest'>
dependency.payload.dependencies[0].artifactRef = null
dependency.contractDigestSha256 = calculateSkillContractDigest(
  dependency as unknown as Record<string, unknown>, 'contractDigestSha256',
)
expectThrow(() => parseCaptionDomainContract(dependency))

const readiness = structuredClone(contracts.find(
  (contract) => contract.contractKind === 'finish_readiness',
)!) as CaptionDomainContract<'finish_readiness'>
readiness.payload.blockedSceneIds.push('scene.one')
readiness.contractDigestSha256 = calculateSkillContractDigest(
  readiness as unknown as Record<string, unknown>, 'contractDigestSha256',
)
expectThrow(() => parseCaptionDomainContract(readiness))

const graph = structuredClone(contracts.find(
  (contract) => contract.contractKind === 'scene_graph',
)!) as CaptionDomainContract<'scene_graph'>
graph.payload.edges[0].toNodeId = 'node.missing'
graph.contractDigestSha256 = calculateSkillContractDigest(
  graph as unknown as Record<string, unknown>, 'contractDigestSha256',
)
expectThrow(() => parseCaptionDomainContract(graph))

const render = structuredClone(contracts.find(
  (contract) => contract.contractKind === 'render_spec',
)!) as unknown as Record<string, unknown>
;(render.payload as Record<string, unknown>).executableCodeIncluded = true
render.contractDigestSha256 = calculateSkillContractDigest(render, 'contractDigestSha256')
expectThrow(() => parseCaptionDomainContract(render))

const inherited = Object.create({ hiddenOwner: true })
Object.assign(inherited, contracts[0])
expectThrow(() => parseCaptionDomainContract(inherited))

const cyclic = structuredClone(contracts[0]) as unknown as Record<string, unknown>
cyclic.cycle = cyclic
expectThrow(() => parseCaptionDomainContract(cyclic))

process.stdout.write(`${JSON.stringify({
  status: 'passed',
  milestone: 'CAP-03',
  contractKinds: contracts.map((contract) => contract.contractKind),
  contractCount: contracts.length,
  assertions,
  canonicalAuthorityPromoted: false,
  mediaRuntimeStarted: false,
  registryMutated: false,
}, null, 2)}\n`)
