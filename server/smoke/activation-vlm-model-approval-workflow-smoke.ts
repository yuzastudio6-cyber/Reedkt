import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import {
  PHASE39A_VLM_BLOCKED_SCOPES,
  PHASE39A_VLM_EXPECTED_ARTIFACTS,
  buildVlmModelApprovalArtifacts,
  buildVlmModelApprovalIamPlan,
  buildVlmModelApprovalReport,
  buildVlmModelStoragePlan,
  validateVlmModelApprovalPhaseSafety,
  vlmModelCandidates,
  vlmModelLicenseEvidence,
  vlmModelSourceEvidence,
  vlmRuntimeSupportEvidence,
} from '../activation/vlm-model-approval'

const report = buildVlmModelApprovalReport('2026-05-31T00:00:00.000Z')

assert.equal(report.phase, '39A')
assert.equal(report.track, 'B')
assert.equal(report.status, 'staging_planning_approved')
assert.equal(report.plan.candidateModel, 'Qwen/Qwen3-VL-8B-Instruct')
assert.equal(report.plan.candidateFamily, 'Qwen3-VL')
assert.equal(report.plan.runtimeCandidate, 'vLLM')
assert.equal(report.plan.fallbackRuntimePlanningOnly, 'local Transformers')
assert.equal(PHASE39A_VLM_EXPECTED_ARTIFACTS.length, 15)
assert.ok(PHASE39A_VLM_EXPECTED_ARTIFACTS.includes('phase_39a_vlm_model_approval_report.json'))
assert.ok(PHASE39A_VLM_BLOCKED_SCOPES.includes('Qwen3-VL model weight download'))
assert.ok(PHASE39A_VLM_BLOCKED_SCOPES.includes('Track A execution/runtime code'))

const qwenCandidate = vlmModelCandidates.find((candidate) => candidate.candidateId === 'qwen3_vl_8b_instruct')
assert.ok(qwenCandidate, 'Qwen3-VL candidate must exist.')
assert.equal(qwenCandidate?.modelId, 'Qwen/Qwen3-VL-8B-Instruct')
assert.equal(qwenCandidate?.downloadStatus, 'blocked_until_phase39b')
assert.equal(qwenCandidate?.runtimeStatus, 'blocked_until_phase39c')
assert.equal(qwenCandidate?.noDownloadInPhase39A, true)
assert.equal(qwenCandidate?.noRuntimeInPhase39A, true)
assert.equal(qwenCandidate?.noMediaProcessingInPhase39A, true)

assert.ok(vlmModelSourceEvidence.some((evidence) => evidence.evidenceId === 'qwen3_vl_repo_multimodal_vlm'))
assert.ok(vlmModelSourceEvidence.some((evidence) => evidence.evidenceId === 'qwen3_vl_8b_hf_model_card_identity'))
assert.ok(vlmModelSourceEvidence.some((evidence) => evidence.evidenceId === 'vllm_supported_models_qwen3_vl'))
assert.ok(vlmModelSourceEvidence.some((evidence) => evidence.evidenceId === 'qwen_vllm_docs_runtime_caveats'))
assert.ok(vlmModelSourceEvidence.some((evidence) => evidence.evidenceId === 'qwen_vl_utils_pypi_apache2'))
assert.ok(vlmModelLicenseEvidence.some((evidence) => evidence.candidateId === 'qwen3_vl_8b_instruct' && evidence.licenseName === 'Apache-2.0'))
assert.ok(vlmModelLicenseEvidence.some((evidence) => evidence.candidateId === 'vllm' && evidence.licenseName === 'Apache-2.0'))

const vllmEvidence = vlmRuntimeSupportEvidence.find((evidence) => evidence.runtimeId === 'vllm')
assert.ok(vllmEvidence)
assert.equal(vllmEvidence?.qwen3VlSupported, true)
assert.equal(vllmEvidence?.localPathRequired, true)
assert.equal(vllmEvidence?.defaultExternalDownloadRisk, true)
assert.ok(vllmEvidence?.warnings.some((warning) => warning.includes('vLLM>=0.11.0')))

const storagePlan = buildVlmModelStoragePlan()
assert.equal(storagePlan.baseStagingPath, 'gs://reeditpro-staging-reeditpro-generated-assets/model-weights/qwen3-vl/qwen3-vl-8b-instruct/<revision>/')
assert.equal(storagePlan.privateStorageRequired, true)
assert.equal(storagePlan.publicAccessAllowed, false)
assert.equal(storagePlan.committedToGitAllowed, false)
assert.equal(storagePlan.exactRevisionRequiredBeforeDownload, true)

assert.equal(report.downloadHandoffPlan.every((plan) => plan.executionMode === 'text_only' && plan.executableCommand === null && !plan.safeToRunNow), true)
assert.equal(report.runtimeHandoffPlan.every((plan) => plan.executionMode === 'text_only' && plan.executableCommand === null && !plan.safeToRunNow), true)
assert.equal(report.generatedFixturePlan.realMediaAllowed, false)
assert.equal(report.controlledRealFramePlan.sourceMediaBytesAllowedInPhase39A, false)
assert.equal(report.toolPlanningIntegrationPlan.directToolExecutionAllowed, false)
assert.equal(report.privacySecurityPolicyReport.modelBytesAllowed, false)
assert.equal(report.gpuCostRiskReport.gpuRuntimeApprovedNow, false)
assert.equal(report.privateArtifactManifest.artifactCount, 15)

assert.equal(report.modelDownloadAllowed, false)
assert.equal(report.tokenizerDownloadAllowed, false)
assert.equal(report.processorDownloadAllowed, false)
assert.equal(report.runtimeExecutionAllowed, false)
assert.equal(report.vllmExecutionAllowed, false)
assert.equal(report.transformersExecutionAllowed, false)
assert.equal(report.sglangExecutionAllowed, false)
assert.equal(report.gpuJobAllowed, false)
assert.equal(report.mediaProcessingAllowed, false)
assert.equal(report.gcpMutationAllowed, false)
assert.equal(report.iamMutationAllowed, false)
assert.equal(report.cloudRunDeployAllowed, false)
assert.equal(report.dockerBuildPushAllowed, false)
assert.equal(report.trackAExecutionAllowed, false)
assert.equal(report.productionReadyAllowed, false)
assert.equal(report.internalBetaAllowed, false)
assert.equal(report.externalBetaAllowed, false)
assert.equal(report.broadRealUserMediaAllowed, false)
assert.equal(report.phase39BReadiness.ready, true)
assert.equal(report.phase39CReadiness.ready, false)
assert.equal(report.phase39DReadiness.ready, false)
assert.equal(report.phase39EReadiness.ready, false)

const safeValidation = validateVlmModelApprovalPhaseSafety({})
assert.equal(safeValidation.allowed, true)
assert.equal(validateVlmModelApprovalPhaseSafety({ modelDownloadConfirmation: 'true' }).allowed, false)
assert.equal(validateVlmModelApprovalPhaseSafety({ runtimeExecuteConfirmation: 'true' }).allowed, false)
assert.equal(validateVlmModelApprovalPhaseSafety({ mediaInput: '/tmp/video.mp4' }).allowed, false)
assert.equal(validateVlmModelApprovalPhaseSafety({ trackAExecutionEnabled: 'true' }).allowed, false)

const iamPlan = buildVlmModelApprovalIamPlan('2026-05-31T00:00:00.000Z')
assert.equal(iamPlan.iamMutationAllowed, false)
assert.equal(iamPlan.gcpMutationAllowed, false)
assert.equal(iamPlan.requiredCurrentIamChanges.length, 0)

const artifacts = buildVlmModelApprovalArtifacts('2026-05-31T00:00:00.000Z')
assert.equal(artifacts.privateArtifactManifest.artifacts.every((artifact) => artifact.safeToCommit), true)
assert.equal(artifacts.privateArtifactManifest.artifacts.every((artifact) => !artifact.containsModelBytes && !artifact.containsMediaBytes && !artifact.containsSecrets && !artifact.containsSignedUrls), true)

const commandText = [...report.downloadHandoffPlan, ...report.runtimeHandoffPlan].map((plan) => plan.description).join('\n')
assert.doesNotMatch(commandText, /\b(curl|wget|gcloud\s+storage\s+cp|gsutil|vllm\s+serve|python\s+-m|docker\s+(?:build|push)|gcloud\s+run)\b/i)

const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as { scripts: Record<string, string> }
assert.equal(packageJson.scripts['activation:vlm-model-approval:plan'], 'tsx server/cli/activation-vlm-model-approval-plan.ts')
assert.equal(packageJson.scripts['activation:vlm-model-approval'], 'tsx server/cli/activation-vlm-model-approval.ts')
assert.equal(packageJson.scripts['activation:vlm-model-approval:report'], 'tsx server/cli/activation-vlm-model-approval-report.ts')
assert.equal(packageJson.scripts['activation:vlm-model-approval:iam-plan'], 'tsx server/cli/activation-vlm-model-approval-iam-plan.ts')
assert.equal(packageJson.scripts['activation:vlm-model-weight:summary'], 'tsx server/cli/activation-vlm-model-weight-summary.ts')
assert.equal(packageJson.scripts['smoke:activation-vlm-model-approval-workflow'], 'tsx server/smoke/activation-vlm-model-approval-workflow-smoke.ts')

assert.equal(existsSync(new URL('../activation/vlm-model-approval/index.ts', import.meta.url)), true)
const moduleDir = new URL('../activation/vlm-model-approval/', import.meta.url)
const moduleSource = readdirSync(moduleDir)
  .filter((fileName) => fileName.endsWith('.ts'))
  .map((fileName) => readFileSync(new URL(fileName, moduleDir), 'utf8'))
  .join('\n')
assert.equal(/from\s+['"].*workers\//.test(moduleSource), false)
assert.equal(/docker\s+(?:build|push)|gcloud\s+run\s+deploy|gcloud\s+run\s+jobs\s+execute|vllm\s+serve|AutoModel.*from_pretrained/.test(moduleSource), false)

console.log(JSON.stringify({
  ok: true,
  checks: [
    'qwen3_vl_candidate_registry',
    'source_license_runtime_evidence',
    'phase39b_private_storage_plan',
    'future_handoffs_text_only',
    'generated_and_controlled_fixture_plans',
    'privacy_gpu_blocker_reports',
    'phase39a_execution_gates_false',
    'package_scripts',
  ],
}))
