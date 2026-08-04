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
import { createEditReferenceQwenCaptionDesignAdapter } from
  '../edit-references/edit-reference-qwen-caption-design-adapter'
import { createEditReferenceQwenColorTreatmentAdapter } from
  '../edit-references/edit-reference-qwen-color-treatment-adapter'
import { createEditReferenceQwenGraphicsMotionAdapter } from
  '../edit-references/edit-reference-qwen-graphics-motion-adapter'
import { createEditReferenceQwenVisualLanguageAdapter } from
  '../edit-references/edit-reference-qwen-visual-language-adapter'
import { createEditReferenceReviewedLocalQwen25VlMlxAdapter } from
  '../edit-references/edit-reference-reviewed-local-qwen25vl-mlx-adapter'
import { createEditReferenceReviewedLocalQwen25VlMlxCaptionDesignAdapter } from
  '../edit-references/edit-reference-reviewed-local-qwen25vl-mlx-caption-design-adapter'
import {
  createEditReferenceReviewedLocalQwen25VlMlxRunValidationAuthority,
  resolveEditReferenceReviewedLocalQwen25VlMlxRuntimeReceipt,
  validateEditReferenceReviewedLocalQwen25VlMlxRuntime,
} from '../edit-references/edit-reference-reviewed-local-qwen25vl-mlx-runtime'
import { createEditReferenceReviewedLocalQwen25VlMlxSpeechPacingProvider } from
  '../edit-references/edit-reference-reviewed-local-qwen25vl-mlx-speech-pacing-provider'
import { createEditReferenceReviewedLocalQwen25VlMlxStoryEditorialProvider } from
  '../edit-references/edit-reference-reviewed-local-qwen25vl-mlx-story-editorial-provider'
import {
  createEditReferenceReviewedLocalQwen25VlMlxColorAdapter,
  createEditReferenceReviewedLocalQwen25VlMlxGraphicsAdapter,
} from '../edit-references/edit-reference-reviewed-local-qwen25vl-mlx-style-adapters'
import {
  createQwenVisualUnderstandingProvider,
  QWEN_VISUAL_UNDERSTANDING_RETIREMENT,
} from '../services/qwen-visual-understanding-provider'
import {
  CANONICAL_SAM2_GPU_RUNTIME_RETIREMENT,
  assertCanonicalSam2GpuRuntimeContract,
  getCanonicalSam2GpuRuntimeContract,
} from '../model-artifacts/canonical-sam2-gpu-runtime-contract'
import {
  createCanonicalGpuWorkerSam2SubprocessRuntimePort,
} from '../model-artifacts/canonical-gpu-worker-sam2-subprocess-runtime'

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

let transportCalls = 0
const historicalProvider = createQwenVisualUnderstandingProvider({
  env: new Proxy({}, {
    get() {
      throw new Error('Retired Qwen environment must not be read.')
    },
  }),
  authenticatedPost: async () => {
    transportCalls += 1
    throw new Error('Retired Qwen transport must not be called.')
  },
})
const blockedResult = await historicalProvider.analyze(new Proxy({} as never, {
  get() {
    throw new Error('Retired Qwen request must not be read.')
  },
}))
assert.equal(blockedResult.status, 'blocked')
assert.deepEqual(blockedResult.blockers, [
  'qwen_visual_runtime_retired_historical_read_only',
])
assert.equal(blockedResult.execution.boundedPrivateFramesRead, false)
assert.equal(blockedResult.execution.providerCallMade, false)
assert.equal(blockedResult.execution.modelCallMade, false)
assert.equal(transportCalls, 0)
assert.equal(
  QWEN_VISUAL_UNDERSTANDING_RETIREMENT.networkOrProviderCallAllowed,
  false,
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
  /createQwenVisualUnderstandingProvider/u,
)
assert.match(
  activeEditReferenceServiceSource,
  /createUnavailableOrchestraVisualIntelligenceBridge/u,
)

const activeEditReferenceSemanticContract = readFileSync(
  'server/edit-references/edit-reference-semantic-study-contract.ts',
  'utf8',
)
assert.match(
  activeEditReferenceSemanticContract,
  /visual_intelligence\.reference_preference_analysis/u,
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

for (const construct of [
  () => createEditReferenceQwenVisualLanguageAdapter({} as never),
  () => createEditReferenceQwenColorTreatmentAdapter({} as never),
  () => createEditReferenceQwenGraphicsMotionAdapter({} as never),
  () => createEditReferenceQwenCaptionDesignAdapter({} as never),
  () => createEditReferenceReviewedLocalQwen25VlMlxAdapter({} as never),
  () => createEditReferenceReviewedLocalQwen25VlMlxCaptionDesignAdapter(
    {} as never,
  ),
  () => createEditReferenceReviewedLocalQwen25VlMlxSpeechPacingProvider(
    {} as never,
  ),
  () => createEditReferenceReviewedLocalQwen25VlMlxStoryEditorialProvider(
    {} as never,
  ),
  () => createEditReferenceReviewedLocalQwen25VlMlxColorAdapter(
    {} as never,
  ),
  () => createEditReferenceReviewedLocalQwen25VlMlxGraphicsAdapter(
    {} as never,
  ),
]) {
  assert.throws(construct, /retired_use_visual_intelligence/u)
}

const retiredRuntimeInput = {
  manifestPath: '/path-must-not-be-read/manifest.json',
  modelPath: '/path-must-not-be-read/model',
  pythonCommand: '/path-must-not-be-run/python',
}
await assert.rejects(
  () => validateEditReferenceReviewedLocalQwen25VlMlxRuntime(
    retiredRuntimeInput,
  ),
  /retired_use_visual_intelligence/u,
)
await assert.rejects(
  () => resolveEditReferenceReviewedLocalQwen25VlMlxRuntimeReceipt(
    retiredRuntimeInput,
  ),
  /retired_use_visual_intelligence/u,
)
await assert.rejects(
  () => createEditReferenceReviewedLocalQwen25VlMlxRunValidationAuthority({
    ...retiredRuntimeInput,
    runId: 'retired-qwen-runtime-must-not-start',
  }),
  /retired_use_visual_intelligence/u,
)

const retiredProviderSource = readFileSync(
  'server/services/qwen-visual-understanding-provider.ts',
  'utf8',
)
assert.doesNotMatch(
  retiredProviderSource,
  /node:fs|node:child_process|createRequire|GoogleAuth|authenticatedCloudRunPost|QWEN_VISUAL_RUNTIME|Qwen\/Qwen2\.5-VL-7B-Instruct[\s\S]*authenticatedPost\(/,
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

console.log(JSON.stringify({
  smoke: 'visual-intelligence-qwen-retirement',
  visualIntelligenceRoleRegistered: true,
  genericGeminiProviderGatewayBypassRejected: true,
  qwen37VisualHistoricalReadOnly: true,
  qwen25VisualHistoricalReadOnly: true,
  qwenProviderTransportRemoved: true,
  qwenSecretReferenceRemoved: true,
  privateGcpQwenFreshPlanRejectedBeforeInputRead: true,
  localQwenMlxRejectedBeforeFilesystemOrProcessAccess: true,
  activePlanningAndPolicyRoutesUseVisualIntelligence: true,
  activeEditReferenceDefaultUsesOrchestraBridge: true,
  activeEditReferenceRecordsUseProviderNeutralSkillIdentity: true,
  directSourceVisualLifecycleFactoryRemoved: true,
  sourceCleanupRequiresOrchestraResultReread: true,
  sourcePlanningUsesPreparedRequestAndDurableCleanupReread: true,
  sourcePreparedRequestRepositoryCannotDispatch: true,
  sam2ExecutableImageSourceRemoved: true,
  sam2RuntimeCompilerAndSubprocessBlockedBeforeInputRead: true,
  sam31IsOnlyFreshSegmentationReplacement: true,
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
