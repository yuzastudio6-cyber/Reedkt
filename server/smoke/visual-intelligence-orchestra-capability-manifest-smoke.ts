import assert from 'node:assert/strict'

import {
  orchestraDigest,
  parseSkillCapabilityManifest,
} from '../orchestra/orchestra-skill-capability-contract'
import {
  assertVisualIntelligenceOrchestraJobScope,
  createVisualIntelligenceOrchestraCapabilityManifest,
  createVisualIntelligenceOrchestraQualificationSnapshot,
  getVisualIntelligenceOrchestraJobDefinition,
  listVisualIntelligenceOrchestraJobDefinitions,
  VISUAL_INTELLIGENCE_CANONICAL_TOOL_OPERATION_IDS,
  VISUAL_INTELLIGENCE_ORCHESTRA_CONTRACT_VERSION,
  VISUAL_INTELLIGENCE_ORCHESTRA_SKILL_VERSION,
} from '../visual-intelligence/visual-intelligence-orchestra-capability-manifest'
import {
  listVisualIntelligenceSkillDefinitions,
} from '../visual-intelligence/visual-intelligence-skill-registry'

const manifest = createVisualIntelligenceOrchestraCapabilityManifest()
const qualification =
  createVisualIntelligenceOrchestraQualificationSnapshot()
const jobs = listVisualIntelligenceOrchestraJobDefinitions()
const internalOperations = listVisualIntelligenceSkillDefinitions()

assert.equal(manifest.skillKey, 'visual_intelligence')
assert.equal(manifest.skillVersion, VISUAL_INTELLIGENCE_ORCHESTRA_SKILL_VERSION)
assert.equal(
  manifest.contractVersion,
  VISUAL_INTELLIGENCE_ORCHESTRA_CONTRACT_VERSION,
)
assert.equal(manifest.skillClass, 'analysis_support')
assert.equal(manifest.coordinationCritical, true)
assert.equal(manifest.canOwnPrimaryVisual, false)
assert.equal(manifest.canOwnPrimaryAnalysis, true)
assert.equal(manifest.canActAsSupport, true)
assert.equal(manifest.canOperateAtVideoLevel, true)
assert.equal(manifest.canOperateAtSceneLevel, true)
assert.equal(manifest.canOperateAtBoundaryLevel, true)
assert.equal(manifest.ownershipRequirements.orchestraOwnsInvocation, true)
assert.equal(manifest.ownershipRequirements.orchestraOwnsWorkGraph, true)
assert.equal(manifest.ownershipRequirements.skillOwnsPrimaryVisual, false)
assert.equal(manifest.ownershipRequirements.skillOwnsAnalysisReport, true)
assert.equal(manifest.ownershipRequirements.requestingSkillOwnsRepair, true)
assert.equal(manifest.invocationPolicy.orchestraDispatchRequired, true)
assert.equal(manifest.invocationPolicy.directUserInvocationAllowed, false)
assert.equal(manifest.invocationPolicy.directPeerSkillInvocationAllowed, false)
assert.equal(manifest.resultContract.resultReturnsToOrchestra, true)
assert.equal(manifest.resultContract.directMutationResultAllowed, false)
assert.equal(manifest.failureSemantics.failClosed, true)
assert.equal(manifest.failureSemantics.hiddenFallbackAllowed, false)

assert.equal(jobs.length, 29)
assert.equal(manifest.supportedJobTypes.length, jobs.length)
assert.deepEqual(
  manifest.supportedJobTypes.map((item) => item.jobType),
  jobs.map((item) => item.jobType),
)
assert.equal(internalOperations.length, 4)
assert.equal(
  internalOperations.every((operation) =>
    operation.topLevelSkillKey === 'visual_intelligence'
    && operation.internalOperationOnly
    && operation.topLevelSkillManifestRequired
    && !operation.legacyRouteInvocationAuthoritative
    && !operation.directUserInvocationAllowed
    && !operation.directPeerSkillInvocationAllowed),
  true,
)
assert.deepEqual(
  internalOperations.find((item) => item.operation === 'compare_media')
    ?.allowedAdmissionModes,
  ['planning_evidence', 'approved_edit_inspection'],
)
assert.deepEqual(
  internalOperations.find((item) => item.operation === 'query_range')
    ?.allowedAdmissionModes,
  ['planning_evidence', 'approved_edit_inspection'],
)
assert.deepEqual(
  [...new Set(jobs.map((item) => item.internalOperationId))].sort(),
  [
    'visual_intelligence.analyze_media',
    'visual_intelligence.compare_media',
    'visual_intelligence.inspect_edit',
    'visual_intelligence.query_range',
  ],
)

for (const job of jobs) {
  assert.ok(job.allowedPhases.length > 0)
  for (const phase of job.allowedPhases) {
    assert.ok(job.admissionClassByPhase[phase])
  }
}
assert.equal(
  getVisualIntelligenceOrchestraJobDefinition(
    'source_video_understanding',
  ).admissionClassByPhase.planning,
  'planning_evidence',
)
assert.equal(
  getVisualIntelligenceOrchestraJobDefinition(
    'scene_version_comparison',
  ).admissionClassByPhase.revision_inspection,
  'approved_edit_inspection',
)
assert.equal(
  getVisualIntelligenceOrchestraJobDefinition(
    'transition_boundary_inspection',
  ).admissionClassByPhase.postrender_inspection,
  'approved_edit_inspection',
)

const routeById = new Map(manifest.toolRoutes.map((route) => [
  route.routeId,
  route,
]))
assert.deepEqual(
  Object.fromEntries([
    ['fasterWhisper', routeById.get('faster-whisper-a100-primary')
      ?.operationId],
    ['ffmpeg', routeById.get('ffmpeg-l4-media-evidence')?.operationId],
    ['ffprobe', routeById.get('ffprobe-l4-colocated-evidence')?.operationId],
    ['opencv', routeById.get('opencv-l4-visual-evidence')?.operationId],
    ['paddleocr', routeById.get('paddleocr-l4-visible-text-evidence')
      ?.operationId],
    ['pyscenedetect', routeById.get('pyscenedetect-l4-scene-evidence')
      ?.operationId],
  ]),
  VISUAL_INTELLIGENCE_CANONICAL_TOOL_OPERATION_IDS,
)
assert.equal(
  routeById.get('gemini-3-1-pro-high-managed-provider')?.executionClass,
  'managed_provider',
)
assert.equal(
  routeById.get('faster-whisper-a100-primary')?.executionClass,
  'a100_80gb_gpu_heavy',
)
assert.equal(
  routeById.get('faster-whisper-l4-qualified-fallback')?.executionClass,
  'l4_gpu_standard',
)
assert.equal(
  manifest.toolRoutes.every((route) =>
    !route.executionClass.toLowerCase().includes('cpu')),
  true,
)
assert.equal(
  manifest.fallbackRoutes.find((route) =>
    route.routeId === 'faster-whisper-classified-l4-fallback')?.targetRouteId,
  'faster-whisper-l4-qualified-fallback',
)
assert.equal(
  manifest.fallbackRoutes.every((route) =>
    route.qualityReductionAllowed === false),
  true,
)
assert.equal(
  manifest.attemptPolicy.automaticRetryOnUnknownOutcome,
  false,
)
assert.equal(
  manifest.attemptPolicy.scopeExpansionRequiresNewOrchestraCall,
  true,
)
assert.deepEqual(
  manifest.requiredSourceEvidence.find((requirement) => (
    requirement.requirementId
      === 'edit_reference_consumer_result_binding'
  )),
  {
    requirementId: 'edit_reference_consumer_result_binding',
    evidenceType:
      'edit_reference_visual_intelligence_orchestra_binding_request_v1',
    requiredForJobTypes: ['reference_preference_analysis'],
    exactRereadRequired: true,
  },
)

assert.equal(manifest.trackingRequirements.length, 1)
assert.equal(manifest.trackingRequirements[0]!.trackingSkillKey, 'track_all')
assert.equal(
  manifest.toolRoutes.some((route) => route.toolOrProviderId === 'sam3_1'),
  false,
)
assert.equal(
  manifest.knownLimitations.some((limitation) =>
    limitation.includes('Track All')),
  true,
)

const serialized = JSON.stringify({ manifest, qualification })
assert.equal(/qwen/i.test(serialized), true)
assert.equal(serialized.includes('legacy_qwen_visual'), true)
assert.equal(serialized.includes('qwen_provider'), false)
assert.equal(serialized.includes('qwen2_5_vl_visual_understanding'), false)
assert.equal(serialized.includes('sam2'), false)
assert.equal(serialized.includes('SAM 2'), false)

assert.equal(qualification.overall, 'blocked')
assert.equal(manifest.qualificationStatus.overall, 'blocked')
assert.equal(manifest.qualificationStatus.qualifiedJobTypes.length, 0)
assert.equal(manifest.qualificationStatus.blockedJobTypes.length, jobs.length)
assert.equal(qualification.jobQualifications.length, jobs.length)
assert.equal(
  qualification.jobQualifications.every((item) =>
    item.status === 'blocked'
    && item.blockerCodes.includes(
      'live_gemini_3_1_pro_high_release_not_reread',
    )
    && item.qualifiedRouteIds.length === 0
    && item.qualificationEvidenceRefs.length === 0),
  true,
)
assert.equal(qualification.dispatchAuthorityGranted, false)
assert.equal(qualification.providerAuthorityGranted, false)
assert.equal(qualification.billingAuthorityGranted, false)
assert.equal(qualification.productionAuthorityGranted, false)

assert.doesNotThrow(() => assertVisualIntelligenceOrchestraJobScope(
  getVisualIntelligenceOrchestraJobDefinition('source_video_understanding'),
  'planning',
  {
    scopeType: 'video',
    sourceArtifactRef: manifest.securityPolicyRef,
    authorizedRanges: [{
      startFrame: 0,
      endFrameExclusive: 240,
      frameRate: { numerator: 24, denominator: 1 },
    }],
    completeSourceCoverageRequired: true,
    outputId: null,
  },
))

const adversarial: Array<() => unknown> = [
  () => getVisualIntelligenceOrchestraJobDefinition('mutate_timeline'),
  () => assertVisualIntelligenceOrchestraJobScope(
    getVisualIntelligenceOrchestraJobDefinition('source_video_understanding'),
    'postrender_inspection',
    {
      scopeType: 'video',
      sourceArtifactRef: manifest.securityPolicyRef,
      authorizedRanges: [{
        startFrame: 0,
        endFrameExclusive: 240,
        frameRate: { numerator: 24, denominator: 1 },
      }],
      completeSourceCoverageRequired: true,
      outputId: null,
    },
  ),
  () => assertVisualIntelligenceOrchestraJobScope(
    getVisualIntelligenceOrchestraJobDefinition(
      'transition_boundary_inspection',
    ),
    'postrender_inspection',
    {
      scopeType: 'scene',
      sourceArtifactRef: manifest.securityPolicyRef,
      sceneId: 'scene-1',
      outputId: 'output-1',
      authorizedRange: {
        startFrame: 90,
        endFrameExclusive: 110,
        frameRate: { numerator: 24, denominator: 1 },
      },
      selectedSceneBindingRef: manifest.securityPolicyRef,
      completeSceneCoverageRequired: true,
    },
  ),
  () => parseSkillCapabilityManifest({
    value: {
      ...manifest,
      invocationPolicy: {
        ...manifest.invocationPolicy,
        directPeerSkillInvocationAllowed: true,
      },
    },
    qualificationSnapshot: qualification,
  }),
  () => {
    const changed = structuredClone(manifest)
    changed.qualificationStatus.qualifiedJobTypes = [
      'source_video_understanding',
    ]
    changed.manifestDigestSha256 = orchestraDigest((() => {
      const payload = { ...changed }
      Reflect.deleteProperty(payload, 'manifestDigestSha256')
      return payload
    })())
    return parseSkillCapabilityManifest({
      value: changed,
      qualificationSnapshot: qualification,
    })
  },
  () => parseSkillCapabilityManifest({
    value: {
      ...manifest,
      ownershipRequirements: {
        ...manifest.ownershipRequirements,
        skillOwnsPrimaryVisual: true,
      },
    },
    qualificationSnapshot: qualification,
  }),
]

for (const refuse of adversarial) assert.throws(refuse)

console.log(JSON.stringify({
  smoke: 'visual-intelligence-orchestra-capability-manifest',
  checks: 80,
  skillKey: manifest.skillKey,
  topLevelSkillCount: 1,
  internalOperationCount: 4,
  supportedJobTypeCount: jobs.length,
  toolRouteCount: manifest.toolRoutes.length,
  gpuPolicy: {
    heavyPrimary: 'nvidia_a100_80gb',
    normalPrimary: 'nvidia_l4',
    cpuSubstantiveExecutionAllowed: false,
  },
  trackingOwner: manifest.trackingRequirements[0]!.trackingSkillKey,
  qualification: qualification.overall,
  blockerCount: manifest.qualificationStatus.blockedJobTypes.length,
  adversarialCases: adversarial.length,
  dispatchAuthorityGranted: qualification.dispatchAuthorityGranted,
  productionReady: qualification.productionAuthorityGranted,
}))
