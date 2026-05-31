import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import {
  PHASE39A_VLM_EXPECTED_ARTIFACTS,
} from './vlm-model-approval-policy'
import type {
  VlmArtifactManifestRecord,
  VlmModelApprovalArtifacts,
  VlmPrivateArtifactManifest,
} from './vlm-model-approval-types'

const artifactDescriptions: Record<typeof PHASE39A_VLM_EXPECTED_ARTIFACTS[number], string> = {
  'phase_39a_vlm_model_approval_plan.json': 'Phase 39A metadata-only approval plan and blocked scopes.',
  'phase_39a_vlm_candidate_registry.json': 'Qwen3-VL, vLLM, fallback runtime, and utility dependency candidate registry.',
  'phase_39a_vlm_source_evidence.json': 'Official/public source evidence for candidate model and runtime planning.',
  'phase_39a_vlm_license_evidence.json': 'License evidence and human-review requirements.',
  'phase_39a_vlm_runtime_support_evidence.json': 'vLLM and local Transformers runtime support evidence.',
  'phase_39a_vlm_storage_plan.json': 'Future private GCS model-weight staging plan.',
  'phase_39a_vlm_download_handoff_plan.json': 'Phase 39B exact revision/file/checksum handoff plan.',
  'phase_39a_vlm_runtime_handoff_plan.json': 'Phase 39C/39D runtime and controlled-frame handoff plan.',
  'phase_39a_vlm_generated_fixture_plan.json': 'Future generated-fixture VLM QA plan.',
  'phase_39a_vlm_controlled_real_frame_plan.json': 'Future one-sample controlled real-frame VLM plan.',
  'phase_39a_vlm_tool_planning_integration_plan.json': 'Future structured VLM hint integration plan.',
  'phase_39a_vlm_privacy_security_policy_report.json': 'Metadata-only privacy/security policy report.',
  'phase_39a_vlm_gpu_cost_risk_report.json': 'GPU/runtime cost and risk report.',
  'phase_39a_vlm_approval_blocker_report.json': 'Blocked-scope and human-review report.',
  'phase_39a_vlm_model_approval_report.json': 'Combined Phase 39A approval report.',
}

const artifactKeyByName: Record<typeof PHASE39A_VLM_EXPECTED_ARTIFACTS[number], keyof VlmModelApprovalArtifacts> = {
  'phase_39a_vlm_model_approval_plan.json': 'plan',
  'phase_39a_vlm_candidate_registry.json': 'candidateRegistry',
  'phase_39a_vlm_source_evidence.json': 'sourceEvidence',
  'phase_39a_vlm_license_evidence.json': 'licenseEvidence',
  'phase_39a_vlm_runtime_support_evidence.json': 'runtimeSupportEvidence',
  'phase_39a_vlm_storage_plan.json': 'storagePlan',
  'phase_39a_vlm_download_handoff_plan.json': 'downloadHandoffPlan',
  'phase_39a_vlm_runtime_handoff_plan.json': 'runtimeHandoffPlan',
  'phase_39a_vlm_generated_fixture_plan.json': 'generatedFixturePlan',
  'phase_39a_vlm_controlled_real_frame_plan.json': 'controlledRealFramePlan',
  'phase_39a_vlm_tool_planning_integration_plan.json': 'toolPlanningIntegrationPlan',
  'phase_39a_vlm_privacy_security_policy_report.json': 'privacySecurityPolicyReport',
  'phase_39a_vlm_gpu_cost_risk_report.json': 'gpuCostRiskReport',
  'phase_39a_vlm_approval_blocker_report.json': 'approvalBlockerReport',
  'phase_39a_vlm_model_approval_report.json': 'plan',
}

export function buildVlmPrivateArtifactManifest(createdAt: string): VlmPrivateArtifactManifest {
  const artifacts: VlmArtifactManifestRecord[] = PHASE39A_VLM_EXPECTED_ARTIFACTS.map((artifactName) => ({
    artifactName,
    reportKey: artifactKeyByName[artifactName],
    safeToCommit: true,
    containsModelBytes: false,
    containsMediaBytes: false,
    containsSecrets: false,
    containsSignedUrls: false,
    description: artifactDescriptions[artifactName],
  }))

  return {
    manifestId: 'phase39a_vlm_model_approval_metadata_manifest',
    createdAt,
    artifactCount: artifacts.length,
    localOnly: true,
    gcsUploadAllowed: false,
    artifacts,
  }
}

export async function writeVlmModelApprovalArtifacts(input: {
  artifactDir: string
  artifacts: VlmModelApprovalArtifacts
  fullReport: unknown
}): Promise<string[]> {
  await mkdir(input.artifactDir, { recursive: true })
  const contentByName: Record<typeof PHASE39A_VLM_EXPECTED_ARTIFACTS[number], unknown> = {
    'phase_39a_vlm_model_approval_plan.json': input.artifacts.plan,
    'phase_39a_vlm_candidate_registry.json': input.artifacts.candidateRegistry,
    'phase_39a_vlm_source_evidence.json': input.artifacts.sourceEvidence,
    'phase_39a_vlm_license_evidence.json': input.artifacts.licenseEvidence,
    'phase_39a_vlm_runtime_support_evidence.json': input.artifacts.runtimeSupportEvidence,
    'phase_39a_vlm_storage_plan.json': input.artifacts.storagePlan,
    'phase_39a_vlm_download_handoff_plan.json': input.artifacts.downloadHandoffPlan,
    'phase_39a_vlm_runtime_handoff_plan.json': input.artifacts.runtimeHandoffPlan,
    'phase_39a_vlm_generated_fixture_plan.json': input.artifacts.generatedFixturePlan,
    'phase_39a_vlm_controlled_real_frame_plan.json': input.artifacts.controlledRealFramePlan,
    'phase_39a_vlm_tool_planning_integration_plan.json': input.artifacts.toolPlanningIntegrationPlan,
    'phase_39a_vlm_privacy_security_policy_report.json': input.artifacts.privacySecurityPolicyReport,
    'phase_39a_vlm_gpu_cost_risk_report.json': input.artifacts.gpuCostRiskReport,
    'phase_39a_vlm_approval_blocker_report.json': input.artifacts.approvalBlockerReport,
    'phase_39a_vlm_model_approval_report.json': input.fullReport,
  }
  const written: string[] = []
  for (const artifactName of PHASE39A_VLM_EXPECTED_ARTIFACTS) {
    const target = path.join(input.artifactDir, artifactName)
    await writeFile(target, `${JSON.stringify(contentByName[artifactName], null, 2)}\n`, 'utf8')
    written.push(target)
  }
  return written
}
