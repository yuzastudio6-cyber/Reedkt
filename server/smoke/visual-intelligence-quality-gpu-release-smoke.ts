import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import {
  VISUAL_INTELLIGENCE_CAPABILITY_ID,
  VISUAL_INTELLIGENCE_INTERNAL_OPERATION_IDS,
  VISUAL_INTELLIGENCE_MEDIA_RESOLUTION,
  VISUAL_INTELLIGENCE_MODEL_ID,
  VISUAL_INTELLIGENCE_QUALITY_PROFILE,
  VISUAL_INTELLIGENCE_THINKING_LEVEL,
} from '../../src/types/visual-intelligence'
import {
  GCP_PRODUCTION_LEGACY_CLOUD_RUN_JOB_TEMPLATES,
  GCP_PRODUCTION_QUALITY_FIRST_GPU_RUNTIMES,
} from '../config/gcp-production-config'
import {
  createCanonicalQualityFirstUserTriggeredGpuPolicy,
} from '../edit-architecture/canonical-quality-first-user-triggered-gpu-policy'
import {
  createCanonicalSam31SourceRuntimeCandidate,
} from '../model-artifacts/canonical-sam3_1-source-runtime-candidate'
import {
  createVisualIntelligenceOrchestraCapabilityManifest,
  createVisualIntelligenceOrchestraQualificationSnapshot,
  listVisualIntelligenceOrchestraJobDefinitions,
} from '../visual-intelligence/visual-intelligence-orchestra-capability-manifest'

const manifest = createVisualIntelligenceOrchestraCapabilityManifest()
const qualification =
  createVisualIntelligenceOrchestraQualificationSnapshot()
const jobs = listVisualIntelligenceOrchestraJobDefinitions()
const gpuPolicy = createCanonicalQualityFirstUserTriggeredGpuPolicy()
const sam31 = createCanonicalSam31SourceRuntimeCandidate()
const retirementScript = readFileSync(
  'scripts/gcp/prod/15-retire-legacy-visual-runtimes.sh',
  'utf8',
)
const qualificationRunner = readFileSync(
  'scripts/verify-visual-intelligence-quality-gpu-release.mjs',
  'utf8',
)
const requiredCoreQualificationSmokes = [
  'visual-intelligence-lifecycle-smoke.ts',
  'visual-intelligence-durable-authorities-smoke.ts',
  'visual-intelligence-account-effective-rate-read-port-smoke.ts',
  'visual-intelligence-account-effective-rate-publisher-smoke.ts',
  'visual-intelligence-runtime-release-publisher-smoke.ts',
  'visual-intelligence-inspection-coordinator-smoke.ts',
  'visual-intelligence-active-cutover-smoke.ts',
  'canonical-specialist-support-resume-service-smoke.ts',
  'canonical-caption-track-all-support-service-smoke.ts',
  'canonical-track-all-sam3_1-l4-task-qa-worker-smoke.ts',
  'canonical-track-all-sam3_1-l4-task-qa-owner-smoke.ts',
  'visual-intelligence-live-prerequisites-audit-smoke.ts',
  'gcp-foundation-config-smoke.ts',
  'source-led-visual-intelligence-content-analysis-smoke.ts',
  'canonical-source-led-content-analysis-reasoner-smoke.ts',
  'canonical-planning-visual-intelligence-operation-owner-smoke.ts',
  'canonical-source-transcript-a100-attempt-owner-smoke.ts',
  'canonical-sam3_1-funded-gpu-runtime-composition-smoke.ts',
  'canonical-sam3_1-a100-qualification-foundation-owner-smoke.ts',
  'canonical-sam3_1-a100-qualification-foundation-repository-smoke.ts',
  'canonical-sam3_1-source-checkpoint-qualification-package-repository-smoke.ts',
  'canonical-sam3_1-source-checkpoint-qualification-package-publisher-smoke.ts',
  'canonical-sam3_1-official-probe-fixture-smoke.ts',
  'canonical-sam3_1-official-probe-fixture-cloud-job-smoke.ts',
  'canonical-sam3_1-qualification-a100-rate-owner-smoke.ts',
  'canonical-professional-gpu-funded-start-authority-store-smoke.ts',
  'canonical-current-google-cloud-gpu-rate-authority-repository-smoke.ts',
  'canonical-current-google-cloud-gpu-rate-authority-publisher-smoke.ts',
  'canonical-professional-google-cloud-gpu-runtime-configuration-repository-smoke.ts',
  'canonical-sam3_1-google-cloud-runtime-configuration-publisher-smoke.ts',
  'canonical-track-all-sam3_1-l4-task-qa-runtime-release-publisher-smoke.ts',
  'canonical-sam3_1-approved-track-all-task-source-repository-smoke.ts',
  'canonical-track-all-sam3_1-authenticated-gpu-start-route-smoke.ts',
  'canonical-track-all-sam3_1-production-runtime-smoke.ts',
  'canonical-sam3_1-prepared-mask-proxy-repository-smoke.ts',
  'production-tool-cost-smoke.ts',
] as const

assert.equal(VISUAL_INTELLIGENCE_CAPABILITY_ID, 'visual_intelligence')
assert.deepEqual(VISUAL_INTELLIGENCE_INTERNAL_OPERATION_IDS, [
  'visual_intelligence.analyze_media',
  'visual_intelligence.inspect_edit',
  'visual_intelligence.query_range',
  'visual_intelligence.compare_media',
])
assert.equal(VISUAL_INTELLIGENCE_MODEL_ID, 'gemini-3.1-pro-preview')
assert.equal(VISUAL_INTELLIGENCE_QUALITY_PROFILE, 'professional_high')
assert.equal(VISUAL_INTELLIGENCE_THINKING_LEVEL, 'high')
assert.equal(VISUAL_INTELLIGENCE_MEDIA_RESOLUTION, 'high')

assert.equal(manifest.skillKey, 'visual_intelligence')
assert.equal(manifest.skillVersion, 'visual-intelligence-skill-v3')
assert.equal(jobs.length, 29)
assert.equal(manifest.ownershipRequirements.orchestraOwnsInvocation, true)
assert.equal(manifest.ownershipRequirements.orchestraOwnsWorkGraph, true)
assert.equal(manifest.resultContract.resultReturnsToOrchestra, true)
assert.equal(manifest.resultContract.directMutationResultAllowed, false)
assert.equal(qualification.overall, 'blocked')
assert.equal(qualification.dispatchAuthorityGranted, false)
assert.equal(qualification.providerAuthorityGranted, false)
assert.equal(qualification.billingAuthorityGranted, false)
assert.equal(
  qualification.jobQualifications.every(
    (qualification) => qualification.status === 'blocked',
  ),
  true,
)

assert.equal(sam31.replacement.supersedesForNewPlans, 'sam2')
assert.equal(
  sam31.replacement.sam2MayAuthorizeNewPlanWorkFallbackOrRepair,
  false,
)
assert.equal(sam31.officialSource.release, 'SAM 3.1')
assert.equal(sam31.officialCheckpoint.repository, 'facebook/sam3.1')
assert.equal(sam31.officialCheckpoint.repositoryGating, 'manual')
assert.equal(
  sam31.officialCheckpoint.automatedTermsAcceptanceAllowed,
  false,
)
assert.equal(sam31.officialCheckpoint.checkpointPrivateArtifactIngested, false)
assert.equal(sam31.runtimeClosure.immutableA100ImageBuiltAndScanned, false)
assert.equal(sam31.runtimeClosure.immutableL4ImageBuiltAndScanned, false)
assert.equal(sam31.fixedApi.runtimeNetworkOrHuggingFaceDownloadAllowed, false)
assert.equal(sam31.compute.a100Primary, true)
assert.equal(sam31.compute.l4ClassifiedFallback, true)
assert.equal(sam31.compute.cpuOnlyHeavyExecutionAllowed, false)
assert.equal(sam31.authority.sourceCandidateOnly, true)
assert.equal(sam31.authority.runtimeExecuted, false)
assert.equal(sam31.authority.productionReady, false)

assert.equal(gpuPolicy.migration.a100IsPrimaryForHeavyProcessing, true)
assert.equal(gpuPolicy.migration.l4IsClassifiedFallbackForHeavyProcessing, true)
assert.equal(gpuPolicy.migration.l4IsPrimaryForNormalMediaRenderAndQa, true)
assert.equal(gpuPolicy.migration.cpuOnlyHeavyExecutionAllowed, false)
assert.equal(
  gpuPolicy.userTriggeredScaleToZeroLifecycle.minimumIdleA100JobCount,
  0,
)
assert.equal(
  gpuPolicy.userTriggeredScaleToZeroLifecycle.minimumIdleL4JobCount,
  0,
)
assert.equal(
  gpuPolicy.userTriggeredScaleToZeroLifecycle
    .fundedCreditReservationRequiredBeforeStart,
  true,
)
assert.equal(gpuPolicy.creditAndCost.exactCloudSkuRegionCurrencyTierAndCurrentAccountPriceRequired, true)
assert.equal(gpuPolicy.creditAndCost.reeditproFailureRefundOrReleaseRequired, true)
assert.equal(gpuPolicy.target.rawFootageCeilingSeconds, 480)
assert.equal(
  gpuPolicy.target.maximumUserTriggeredEndToEndSecondsIncludingColdStart,
  480,
)
assert.equal(gpuPolicy.target.qualityGatesMayBeSkippedForSpeed, false)

assert.deepEqual(
  GCP_PRODUCTION_QUALITY_FIRST_GPU_RUNTIMES.map((runtime) => ({
    routeId: runtime.routeId,
    accelerator: runtime.accelerator,
    minimumIdleInstances: runtime.minimumIdleInstances,
  })),
  [
    {
      routeId: 'a100_80gb_heavy_primary',
      accelerator: 'nvidia_a100_80gb',
      minimumIdleInstances: 0,
    },
    {
      routeId: 'l4_heavy_fallback',
      accelerator: 'nvidia_l4',
      minimumIdleInstances: 0,
    },
    {
      routeId: 'l4_standard_primary',
      accelerator: 'nvidia_l4',
      minimumIdleInstances: 0,
    },
  ],
)
assert.equal(
  GCP_PRODUCTION_LEGACY_CLOUD_RUN_JOB_TEMPLATES.mayAuthorizeNewWork,
  false,
)
assert.match(retirementScript, /LEGACY_VISUAL_JOBS/u)
assert.match(retirementScript, /Orchestra -> visual_intelligence/u)
assert.doesNotMatch(retirementScript, /artifacts docker images delete/u)
for (const smoke of requiredCoreQualificationSmokes) {
  assert.equal(
    qualificationRunner.includes(`'server/smoke/${smoke}'`),
    true,
  )
}

console.log(JSON.stringify({
  smoke: 'visual-intelligence-quality-gpu-release',
  productName: 'WeEditPro',
  topLevelSkill: VISUAL_INTELLIGENCE_CAPABILITY_ID,
  internalOperations: VISUAL_INTELLIGENCE_INTERNAL_OPERATION_IDS,
  orchestraJobTypes: jobs.length,
  semanticProvider: {
    model: VISUAL_INTELLIGENCE_MODEL_ID,
    thinkingLevel: VISUAL_INTELLIGENCE_THINKING_LEVEL,
    mediaResolution: VISUAL_INTELLIGENCE_MEDIA_RESOLUTION,
  },
  heavyPrimary: 'NVIDIA A100 80GB',
  heavyFallback: 'NVIDIA L4 separate qualification required; unreleased',
  standardProcessing: 'NVIDIA L4',
  minimumIdleGpuInstances: 0,
  sam31SourceCandidateComplete: true,
  sam31CloudInstallQualified: false,
  liveGeminiReleaseQualified: false,
  sourceGateContainsCoreLifecycleEvidence: true,
  sourceReleaseGatesFailClosed: true,
  productionReady: false,
}, null, 2))
