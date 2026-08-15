import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

import {
  validateProviderGatewayRequest,
  type ProviderGatewayRequest,
} from '../../src/backend/cloud/provider-gateway-contracts'
import {
  REEDITPRO_MODEL_ROLE_CONTRACTS,
  validateReEditProModelRoleContracts,
  validateReEditProModelRoleUse,
} from '../../src/lib/model-role-routing-contract'
import { createPrivateGcpVisualUnderstandingPlan } from
  '../../src/lib/private-gcp-visual-understanding-contract'
import { createMockProviderGatewayClient } from
  '../../src/backend/providers/gateway/mock-provider-clients'
import { getProviderSecretReference } from
  '../../src/backend/providers/gateway/provider-secret-boundary'
import {
  CANONICAL_SAM2_GPU_RUNTIME_RETIREMENT,
  assertCanonicalSam2GpuRuntimeContract,
  getCanonicalSam2GpuRuntimeContract,
} from '../model-artifacts/canonical-sam2-gpu-runtime-contract'
import {
  createCanonicalGpuWorkerSam2SubprocessRuntimePort,
} from '../model-artifacts/canonical-gpu-worker-sam2-subprocess-runtime'
import {
  classifyOwnerLaneFromPr,
  extractAffectedToolsFromPr,
} from '../tool-calling/unmerged-owner-evidence-analyzer'
import {
  buildAllOwnerToolReconciliationMatrix,
  recommendNextToolCallingExpansionMilestones,
} from '../tool-calling/all-owner-stack-reconciliation-analyzer'

const modelRoleValidation = validateReEditProModelRoleContracts()
assert.equal(modelRoleValidation.ok, true)
assert.deepEqual(modelRoleValidation.errors, [])

const visualIntelligenceRole = REEDITPRO_MODEL_ROLE_CONTRACTS.find(
  (role) => role.modelRoleId === 'visual_intelligence_gemini_pro_high',
)
assert.equal(
  visualIntelligenceRole?.canonicalProviderModel,
  'gemini-3.1-pro-preview',
)
assert.equal(
  visualIntelligenceRole?.providerBoundary,
  'vertex_gemini_pro_visual_intelligence_boundary',
)
assert.equal(visualIntelligenceRole?.visualUnderstandingAllowed, true)
assert.equal(visualIntelligenceRole?.editPlanningAllowed, false)

for (const modelRoleId of [
  'qwen_3_7_api_visual_understanding',
  'qwen2_5_vl_visual_understanding',
] as const) {
  const role = REEDITPRO_MODEL_ROLE_CONTRACTS.find(
    (item) => item.modelRoleId === modelRoleId,
  )
  assert.equal(role?.executionStatus, 'retired_historical_read_only')
  assert.equal(validateReEditProModelRoleUse({
    modelRoleId,
    providerRoute: role?.providerBoundary,
    providerModel: role?.canonicalProviderModel,
    requestedUse: 'visual_understanding',
  }).ok, false)
  assert.equal(validateReEditProModelRoleUse({
    modelRoleId,
    providerRoute: role?.providerBoundary,
    providerModel: role?.canonicalProviderModel,
    requestedUse: 'visual_understanding',
    historicalReadOnly: true,
  }).ok, true)
}

const historicalRequest = providerRequest({
  providerRoute: 'qwen_model_studio_visual_understanding_api_boundary',
  providerModel: 'qwen3.7-plus-2026-05-26',
  modelRoleId: 'qwen_3_7_api_visual_understanding',
})
assert.equal(validateProviderGatewayRequest(historicalRequest).ok, false)
assert.equal(
  createMockProviderGatewayClient(historicalRequest.providerRoute)
    .prepareRequest(historicalRequest).status,
  'blocked_by_policy',
)

const directGeminiRequest = providerRequest({
  providerRoute: 'vertex_gemini_pro_visual_intelligence_boundary',
  providerModel: 'gemini-3.1-pro-preview',
  modelRoleId: 'visual_intelligence_gemini_pro_high',
})
const directGeminiValidation =
  validateProviderGatewayRequest(directGeminiRequest)
assert.equal(directGeminiValidation.ok, false)
assert.ok(directGeminiValidation.errors.some((error) =>
  error.includes('owned exclusively by the admitted visual_intelligence')))
assert.equal(
  createMockProviderGatewayClient(directGeminiRequest.providerRoute)
    .prepareRequest(directGeminiRequest).status,
  'blocked_by_policy',
)

assert.equal(
  getProviderSecretReference(
    'qwen2_5_vl_7b_instruct_provider_boundary',
  ),
  undefined,
)
assert.equal(
  getProviderSecretReference(
    'qwen_model_studio_visual_understanding_api_boundary',
  ),
  undefined,
)

assert.equal(
  CANONICAL_SAM2_GPU_RUNTIME_RETIREMENT.replacementToolId,
  'sam3_1',
)
assert.equal(
  CANONICAL_SAM2_GPU_RUNTIME_RETIREMENT.freshContractCompilationAllowed,
  false,
)
for (const compile of [
  () => getCanonicalSam2GpuRuntimeContract(),
  () => assertCanonicalSam2GpuRuntimeContract(new Proxy({}, {
    get() {
      throw new Error('Retired SAM2 input must not be read.')
    },
  })),
]) {
  await assert.rejects(
    compile,
    /sam2_historical_only_new_dispatch_blocked/u,
  )
}
assert.throws(
  () => createCanonicalGpuWorkerSam2SubprocessRuntimePort(),
  /sam2_historical_only_new_dispatch_blocked/u,
)

for (const removedPath of [
  'docker/prod/gpu-worker/sam2/Dockerfile.runtime-candidate',
  'docker/prod/gpu-worker/sam2/runner.py',
  'docker/prod/gpu-worker/sam2/source-provenance.lock',
  'server/workers/masks/sam2-execution-runner.ts',
  'server/services/canonical-source-led-visual-intelligence-content-analysis-port.ts',
  'server/services/canonical-source-visual-intelligence-owner-service.ts',
  'server/services/canonical-visual-intelligence-source-gpu-evidence-service.ts',
  'server/edit-references/edit-reference-reviewed-local-long-form-all-specialist-runtime.ts',
  'server/edit-references/edit-reference-reviewed-local-long-form-caption-design-runtime.ts',
  'server/edit-references/edit-reference-reviewed-local-long-form-speech-pacing-runtime.ts',
  'server/edit-references/edit-reference-reviewed-local-long-form-visual-style-story-runtime.ts',
  'server/edit-references/edit-reference-reviewed-local-qwen25vl-mlx-speech-pacing-provider.ts',
  'server/edit-references/edit-reference-reviewed-local-qwen25vl-mlx-story-editorial-provider.ts',
  'server/edit-references/edit-reference-reviewed-local-qwen25vl-mlx-adapter.ts',
  'server/edit-references/edit-reference-reviewed-local-qwen25vl-mlx-caption-design-adapter.ts',
  'server/edit-references/edit-reference-reviewed-local-qwen25vl-mlx-style-adapters.ts',
  'server/edit-references/edit-reference-reviewed-local-qwen25vl-mlx-runtime.ts',
  'server/edit-references/runtime/qwen25vl-mlx-classify-caption-design.py',
  'server/edit-references/runtime/qwen25vl-mlx-classify-frames.py',
  'server/edit-references/runtime/qwen25vl-mlx-classify-reference-style.py',
  'server/edit-references/runtime/qwen25vl-mlx-classify-speech-pacing.py',
  'server/edit-references/runtime/qwen25vl-mlx-classify-story-editorial.py',
  'server/edit-references/edit-reference-media-study.ts',
  'server/edit-references/edit-reference-qwen-visual-language-adapter.ts',
  'server/edit-references/edit-reference-qwen-color-treatment-adapter.ts',
  'server/edit-references/edit-reference-qwen-graphics-motion-adapter.ts',
  'server/edit-references/edit-reference-qwen-caption-design-adapter.ts',
  'server/edit-references/edit-reference-long-form-semantic-window-specialist-executor.ts',
  'server/edit-references/edit-reference-long-form-semantic-window-stage-executor.ts',
  'server/services/qwen-visual-understanding-provider.ts',
]) assert.equal(existsSync(removedPath), false, `${removedPath} must be absent`)

const sam2RuntimeTombstoneSource = readFileSync(
  'server/model-artifacts/canonical-sam2-gpu-runtime-contract.ts',
  'utf8',
)
assert.doesNotMatch(
  sam2RuntimeTombstoneSource,
  /node:fs|node:path|node:url|child_process|docker\/prod\/gpu-worker\/sam2|build_sam2|python3/u,
)

const sourceCleanupReconciliationSource = readFileSync(
  'server/services/canonical-source-led-orchestra-content-analysis-reconciliation.ts',
  'utf8',
)
assert.doesNotMatch(
  sourceCleanupReconciliationSource,
  /VisualIntelligenceLifecycleService|createVisualIntelligenceRequest|planningAdmissionPort|visualIntelligenceLifecycle/u,
)
assert.match(
  sourceCleanupReconciliationSource,
  /readCompletedSourceVideoUnderstanding/u,
)
const sourcePlanningReconciliationSource = readFileSync(
  'server/services/canonical-source-led-orchestra-planning-reconciliation.ts',
  'utf8',
)
assert.doesNotMatch(
  sourcePlanningReconciliationSource,
  /VisualIntelligenceLifecycleService|createVisualIntelligenceRequest|planningAdmissionPort|CloudRun|Batch|fetch\(|child_process/u,
)
assert.match(
  sourcePlanningReconciliationSource,
  /readExactPreparedRequest/u,
)
assert.match(
  sourcePlanningReconciliationSource,
  /readOrReconcileCanonicalSourceCleanupAuthority/u,
)
const sourcePreparedRequestRepositorySource = readFileSync(
  'server/services/canonical-source-analysis-request-authority-repository.ts',
  'utf8',
)
assert.doesNotMatch(
  sourcePreparedRequestRepositorySource,
  /VisualIntelligenceLifecycleService|createVisualIntelligenceRequest|CloudRun|Batch|fetch\(|child_process/u,
)
assert.match(
  sourcePreparedRequestRepositorySource,
  /persistCreateOnly/u,
)
const sourceProbeAuthorityRepositorySource = readFileSync(
  'server/services/canonical-source-analysis-probe-authority-repository.ts',
  'utf8',
)
assert.doesNotMatch(
  sourceProbeAuthorityRepositorySource,
  /VisualIntelligenceLifecycleService|createVisualIntelligenceRequest|CloudRun|Batch|fetch\(|child_process|execFile|spawn\(/u,
)
assert.match(
  sourceProbeAuthorityRepositorySource,
  /persistCreateOnly/u,
)
assert.match(
  sourceProbeAuthorityRepositorySource,
  /repositoryMayDispatchGpuJob: false/u,
)
const sourceAnalysisPreparationOwnerSource = readFileSync(
  'server/services/canonical-source-analysis-preparation-owner.ts',
  'utf8',
)
assert.doesNotMatch(
  sourceAnalysisPreparationOwnerSource,
  /VisualIntelligenceLifecycleService|createVisualIntelligenceRequest|CloudRun|Batch|fetch\(|child_process/u,
)
assert.match(
  sourceAnalysisPreparationOwnerSource,
  /approximateDurationToFrameInferenceAllowed: false/u,
)
assert.match(
  sourceAnalysisPreparationOwnerSource,
  /quality_l4_user_triggered_standard_media_job_v1/u,
)
const sourcePlanPresentationSource = readFileSync(
  'server/services/canonical-source-led-plan-presentation-service.ts',
  'utf8',
)
assert.match(
  sourcePlanPresentationSource,
  /readOrReconcileCanonicalSourceCleanupAuthority/u,
)

const activeEditReferenceServiceSource = readFileSync(
  'server/services/edit-reference-service.ts',
  'utf8',
)
assert.doesNotMatch(
  activeEditReferenceServiceSource,
  /createQwenVisualUnderstandingProvider|prepareEditReferenceMediaStudies|runEditReferenceLocalMediaStudy/u,
)
assert.match(
  activeEditReferenceServiceSource,
  /edit_reference_visual_intelligence_orchestra_result_reread/u,
)
assert.match(
  activeEditReferenceServiceSource,
  /retiredLocalMediaStudyAccepted: false/u,
)

const activeEditReferenceSemanticContract = readFileSync(
  'server/edit-references/edit-reference-semantic-study-contract.ts',
  'utf8',
)
assert.match(
  activeEditReferenceSemanticContract,
  /visual_intelligence\.reference_preference_analysis/u,
)
const activeEditReferenceOrchestrator = readFileSync(
  'server/edit-references/edit-reference-evidence-orchestrator.ts',
  'utf8',
)
assert.doesNotMatch(
  activeEditReferenceOrchestrator,
  /mediaStudies|appendLocalMediaStudy|media_studied_local_partial/u,
)
for (const activeEditReferenceSourcePath of [
  'server/edit-references/edit-reference-evidence-orchestrator.ts',
  'server/edit-references/edit-reference-semantic-study-contract.ts',
]) {
  const activeSource = readFileSync(activeEditReferenceSourcePath, 'utf8')
  assert.doesNotMatch(
    activeSource,
    /['"]edit_reference\.visual_language\.qwen_visual_analysis['"]/u,
    `${activeEditReferenceSourcePath} must not emit the retired Qwen visual skill identity for fresh work.`,
  )
}

assert.throws(
  () => createPrivateGcpVisualUnderstandingPlan(new Proxy({} as never, {
    get() {
      throw new Error('Retired Qwen plan input must not be read.')
    },
  })),
  /private_gcp_qwen_visual_retired_use_visual_intelligence/u,
)

for (const activeSourcePath of [
  'server/edit-architecture/approved-edit-execution-package.ts',
  'server/services/approved-edit-execution-package-service.ts',
  'src/backend/edit-level-tool-router/mock-edit-level-tool-router-scenarios.ts',
  'src/lib/edit-level-tool-router-rules.ts',
  'src/lib/edit-level-tool-router-summaries.ts',
  'src/lib/edit-level-tool-router-ui-adapter.ts',
  'src/lib/intelligence-orchestration-contract.ts',
  'src/lib/private-edit-decision-manifest-verification.ts',
  'src/lib/professional-skills/professional-skill-planner.ts',
  'src/lib/professional-skills/professional-skill-registry.ts',
  'src/backend/api/mock-api-router.ts',
  'src/types/edit-level-tool-router.ts',
]) {
  const activeSource = readFileSync(activeSourcePath, 'utf8')
  assert.match(
    activeSource,
    /visual_intelligence(?:_gemini_pro_high)?/u,
    `${activeSourcePath} must route fresh visual work through Visual Intelligence.`,
  )
  assert.doesNotMatch(
    activeSource,
    /qwen2_5_vl_visual_understanding|qwen25vl_visual_understanding|qwen_3_7_api_visual_understanding/u,
    `${activeSourcePath} must not retain an active Qwen visual route.`,
  )
}

for (const currentSam31SourcePath of [
  'scripts/validation/tool-calling-unmerged-owner-evidence-overlay-diagnostics.mjs',
  'scripts/validation/tool-calling-all-owner-stack-reconciliation-diagnostics.mjs',
  'server/smoke/supabase-auth-internal-test-execution-smoke.ts',
  'server/smoke/edit-execution-package-client-smoke.ts',
  'server/smoke/gcs-upload-to-private-internal-edit-route-smoke.ts',
  'server/smoke/gcs-private-internal-test-run-route-smoke.ts',
  'server/smoke/gcs-source-media-processing-staging-smoke.ts',
  'server/smoke/private-internal-edit-upload-e2e-smoke.ts',
]) {
  const currentSource = readFileSync(currentSam31SourcePath, 'utf8')
  assert.match(
    currentSource,
    /sam3_1/u,
    `${currentSam31SourcePath} must use the SAM 3.1 identity for current fixture or diagnostic coverage.`,
  )
  assert.doesNotMatch(
    currentSource,
    /['"]sam2['"]/u,
    `${currentSam31SourcePath} must not present SAM 2 as a current fixture or diagnostic tool.`,
  )
}
const sam31OwnerEvidence = {
  title: 'SAM 3.1 Object Multiplex A100 and L4 qualification',
  files: ['server/model-artifacts/canonical-sam3_1-gpu-runtime-release.ts'],
}
assert.deepEqual(extractAffectedToolsFromPr(sam31OwnerEvidence), ['sam3_1'])
assert.equal(
  classifyOwnerLaneFromPr(sam31OwnerEvidence),
  'ai_graphics_static_motion_chart_model_tools',
)
assert.deepEqual(
  extractAffectedToolsFromPr({ title: 'Historical SAM2 evidence audit' }),
  ['sam2'],
)
const ownerReconciliationRows = buildAllOwnerToolReconciliationMatrix()
const historicalSam2Row = ownerReconciliationRows.find((row) =>
  row.normalizedToolId === 'sam2')
assert.equal(
  historicalSam2Row?.currentRepoStatus.includes('historical_read_only'),
  true,
)
assert.equal(historicalSam2Row?.selectableAsRuntimeTool, false)
const ownerRecommendations = recommendNextToolCallingExpansionMilestones(
  ownerReconciliationRows,
)
assert.equal(
  ownerRecommendations.some((milestone) =>
    milestone.candidateToolIds.includes('sam2')),
  false,
)
assert.equal(
  ownerRecommendations.some((milestone) =>
    milestone.candidateToolIds.includes('sam3_1')),
  true,
)

console.log(JSON.stringify({
  smoke: 'visual-intelligence-qwen-retirement',
  visualIntelligenceRoleRegistered: true,
  genericGeminiProviderGatewayBypassRejected: true,
  qwen37VisualHistoricalReadOnly: true,
  qwen25VisualHistoricalReadOnly: true,
  qwenProviderAndEditReferenceAdaptersRemoved: true,
  qwenSecretReferenceRemoved: true,
  privateGcpQwenFreshPlanRejectedBeforeInputRead: true,
  localQwenMlxExecutableRuntimeRemoved: true,
  unreferencedLocalQwenLongFormRuntimeRemoved: true,
  localQwenPythonRunnersRemoved: true,
  activePlanningAndPolicyRoutesUseVisualIntelligence: true,
  activeEditReferenceRequiresOrchestraResultReread: true,
  editReferenceLocalMediaStudyFallbackRemoved: true,
  editReferenceLegacyResultTransformerRemoved: true,
  activeEditReferenceRecordsUseProviderNeutralSkillIdentity: true,
  directSourceVisualLifecycleFactoryRemoved: true,
  sourceCleanupRequiresOrchestraResultReread: true,
  sourcePlanningUsesPreparedRequestAndDurableCleanupReread: true,
  sourcePreparedRequestRepositoryCannotDispatch: true,
  sourceProbeAuthorityRepositoryCannotDispatch: true,
  sourceAnalysisPreparationOwnerCannotDispatch: true,
  sourceAnalysisPreparationRejectsApproximateFrameInference: true,
  sam2ExecutableImageSourceRemoved: true,
  sam2RuntimeCompilerAndSubprocessBlockedBeforeInputRead: true,
  sam31IsOnlyFreshSegmentationReplacement: true,
  currentDiagnosticsAndFixturesUseSam31: true,
  historicalSam2ExcludedFromExpansionRecommendations: true,
  historicalEvidenceSchemasPreserved: true,
}, null, 2))

function providerRequest(input: Pick<
  ProviderGatewayRequest,
  'providerRoute' | 'providerModel' | 'modelRoleId'
>): ProviderGatewayRequest {
  return {
    generationRequestId: `retired-${input.modelRoleId}`,
    jobId: `job-${input.modelRoleId}`,
    workspaceId: 'workspace-visual-cutover',
    projectId: 'project-visual-cutover',
    approvedPlanSnapshotId: 'snapshot-visual-cutover',
    editPlanId: 'plan-visual-cutover',
    creditReservationId: 'reservation-visual-cutover',
    providerRoute: input.providerRoute,
    providerModel: input.providerModel,
    modelRoleId: input.modelRoleId,
    requestedModelUse: 'visual_understanding',
    signatureSystem: 'visual-intelligence-cutover',
    generationType: 'none',
    qualityLevel: 'high',
    modelTier: 'premium',
    inputAssetIds: [],
    outputRequirements: { outputAssetType: 'visual_evidence' },
    safetyConstraints: { routeRole: 'primary' },
    idempotencyKey: `retired-${input.modelRoleId}`,
  }
}
