import { providerModelApprovalRequiredScripts } from './provider-model-approval-policy'
import type {
  ProviderApprovalEvidence,
  ProviderCostPolicy,
  ProviderDataPolicy,
  ProviderModelApprovalQaGate,
  ProviderModelApprovalQaSummary,
  ProviderModelApprovalSupabaseSyncResult,
  ProviderNextPhasePlan,
  ProviderRoleApproval,
  ProviderRoutingPolicy,
  ProviderSecretPolicy,
  ProviderStoragePolicy,
} from './provider-model-approval-types'

export function buildProviderModelApprovalQaSummary(input: {
  packageScripts: Record<string, string>
  docsPresent: Record<string, boolean>
  evidence: ProviderApprovalEvidence[]
  roleApprovals: ProviderRoleApproval[]
  secretPolicy: ProviderSecretPolicy
  dataPolicy: ProviderDataPolicy
  costPolicy: ProviderCostPolicy
  routingPolicy: ProviderRoutingPolicy
  storagePolicy: ProviderStoragePolicy
  nextPhasePlan: ProviderNextPhasePlan
  supabaseSyncResult: ProviderModelApprovalSupabaseSyncResult
  executionMode: boolean
}): ProviderModelApprovalQaSummary {
  const gates: ProviderModelApprovalQaGate[] = [
    gate('provider0_evidence', hasEvidence(input.evidence, 'deepseek') && hasEvidence(input.evidence, 'qwen'), 'PROVIDER-0 official evidence is carried forward and narrowed into PROVIDER-1 approval policy.'),
    gate('model_identity_recorded', input.roleApprovals.some((role) => role.providerModelIds.includes('deepseek-v4-pro')) && input.roleApprovals.some((role) => role.providerModelIds.includes('deepseek-v4-flash')) && input.roleApprovals.some((role) => role.providerModelIds.includes('qwen3.7-max')), 'DeepSeek V4-Pro/V4-Flash and Qwen3.7-Max model identities are recorded.'),
    gate('deepseek_policy_defined', input.roleApprovals.some((role) => role.roleId === 'deepseek_v4_pro_coding_specialist' && role.blockedActions.includes('direct execution')), 'DeepSeek role, allowed outputs, and blocked direct execution are defined.'),
    gate('qwen_policy_defined', input.roleApprovals.some((role) => role.roleId === 'qwen_3_7_max_head_planning_agent' && role.blockedActions.includes('direct worker execution')), 'Qwen role, allowed outputs, and blocked tool/worker execution are defined.'),
    gate('secret_policy', input.secretPolicy.frontendExposureAllowed === false && input.secretPolicy.secretValuesResolvedInProvider1 === false && input.secretPolicy.secretManagerOnly, 'Provider secret references are backend-only metadata and no values are resolved.'),
    gate('data_policy', input.dataPolicy.rawProviderPayloadStorageAllowed === false && input.dataPolicy.signedUrlSourceOfTruthAllowed === false && input.dataPolicy.globalBlockedData.length >= 8, 'Data policy blocks raw media, secrets, signed URLs, private rows, and raw provider payload storage.'),
    gate('cost_policy', input.costPolicy.provider1BudgetUsd === 0 && input.costPolicy.providerCallsBlockedByDefault && input.costPolicy.liveValidationDefaults.maxCallsPerPhase === 1, 'Cost policy keeps PROVIDER-1 at zero budget and future live validation to one guarded call.'),
    gate('routing_policy', input.routingPolicy.qwenCanExecuteToolsOrWorkers === false && input.routingPolicy.deepSeekCanExecuteCodeOrTools === false && input.routingPolicy.workerExecutionSource === 'approved_plan_snapshots_only', 'Routing policy blocks direct tool/code/worker execution and preserves approved snapshots as worker source.'),
    gate('storage_policy', input.storagePolicy.privateGcsOnly && input.storagePolicy.publicArtifactsAllowed === false && input.storagePolicy.signedUrlsAsSourceOfTruthAllowed === false, 'Storage policy allows private artifacts only and blocks public/signed URL source-of-truth.'),
    gate('blocked_features', true, 'Provider calls, tools, workers, model inference, media, web/search/browser/map, Docker, Cloud Run, SQL/schema/RLS, production, external beta, and broad media remain blocked.'),
    gate('supabase_milestone_sync', input.executionMode ? input.supabaseSyncResult.status === 'completed' : true, input.executionMode ? 'PROVIDER-1 milestone sync completed during execution or exact blocker recorded.' : 'Static mode does not write Supabase.'),
  ]
  if (input.nextPhasePlan.items.length !== 5) gates.push(gate('blocked_features', false, 'PROVIDER-2 through PROVIDER-6 next phase roadmap must be present.'))
  for (const scriptName of providerModelApprovalRequiredScripts) {
    if (!input.packageScripts[scriptName]) gates.push(gate('blocked_features', false, `Missing package script ${scriptName}.`))
  }
  for (const [docPath, present] of Object.entries(input.docsPresent)) {
    if (!present) gates.push(gate('provider0_evidence', false, `Missing PROVIDER-1 doc ${docPath}.`))
  }
  const blockers = Array.from(new Set([...gates.filter((qaGate) => !qaGate.passed).map((qaGate) => `${qaGate.gateId}: ${qaGate.summary}`), ...input.supabaseSyncResult.blockers]))
  const warnings = Array.from(new Set([...input.supabaseSyncResult.warnings]))
  return { status: blockers.length ? 'blocked' : 'passed', gates, blockers, warnings }
}

function hasEvidence(evidence: ProviderApprovalEvidence[], provider: ProviderApprovalEvidence['provider']): boolean {
  return evidence.some((entry) => entry.provider === provider && entry.sourceType === 'official_docs')
}

function gate(gateId: ProviderModelApprovalQaGate['gateId'], passed: boolean, summary: string): ProviderModelApprovalQaGate {
  return { gateId, passed, mandatory: true, summary }
}
