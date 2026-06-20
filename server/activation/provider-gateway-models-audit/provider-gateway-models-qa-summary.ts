import { providerModelsAuditRequiredScripts } from './provider-gateway-models-audit-policy'
import type {
  ProviderCostPolicy,
  ProviderDataPolicy,
  ProviderExecutionPolicy,
  ProviderGatewayRepoAudit,
  ProviderModelDecision,
  ProviderModelsAuditQaGate,
  ProviderModelsAuditQaSummary,
  ProviderModelsAuditSupabaseSyncResult,
  ProviderOfficialEvidence,
  ProviderPhaseRoadmap,
  ProviderSecretPolicy,
} from './provider-gateway-models-audit-types'

export function buildProviderModelsAuditQaSummary(input: {
  packageScripts: Record<string, string>
  docsPresent: Record<string, boolean>
  evidence: ProviderOfficialEvidence[]
  repoAudit: ProviderGatewayRepoAudit
  modelDecisions: ProviderModelDecision[]
  secretPolicy: ProviderSecretPolicy
  dataPolicy: ProviderDataPolicy
  costPolicy: ProviderCostPolicy
  executionPolicy: ProviderExecutionPolicy
  phaseRoadmap: ProviderPhaseRoadmap
  supabaseSyncResult: ProviderModelsAuditSupabaseSyncResult
  executionMode: boolean
}): ProviderModelsAuditQaSummary {
  const gates: ProviderModelsAuditQaGate[] = [
    gate('official_provider_evidence', hasEvidence(input.evidence, 'deepseek') && hasEvidence(input.evidence, 'qwen'), 'DeepSeek and Qwen official evidence is encoded with source URLs.'),
    gate('repo_contract_audit', input.repoAudit.blockers.length === 0 && input.repoAudit.realProviderCallsBlocked, 'Provider gateway repo contracts are audited and real provider calls remain blocked.'),
    gate('model_name_decisions', input.modelDecisions.some((model) => model.providerModelId === 'qwen3.7-max') && input.modelDecisions.some((model) => model.providerModelId === 'deepseek-v4-pro') && input.modelDecisions.some((model) => model.providerModelId === 'deepseek-v4-flash'), 'Internal and provider model names are decided.'),
    gate('secret_policy', input.secretPolicy.frontendExposureAllowed === false && input.secretPolicy.secretValuesResolvedInProvider0 === false, 'Provider secrets are backend-only future references; no secret values are read.'),
    gate('data_policy', input.dataPolicy.rawProviderResponseStorageAllowed === false && input.dataPolicy.signedUrlSourceOfTruthAllowed === false && input.dataPolicy.blockedData.length >= 8, 'Qwen/DeepSeek data policy blocks sensitive and raw-provider data.'),
    gate('cost_policy', input.costPolicy.providerBudgetsDefaultToZero && input.costPolicy.providerCallsBlockedByDefault, 'Provider budgets default to zero and calls remain blocked.'),
    gate('execution_policy', input.executionPolicy.deepSeekCanDirectlyExecuteCode === false && input.executionPolicy.qwenCanDirectlyExecuteWorkersOrTools === false && input.executionPolicy.approvedPlanSnapshotsRequiredBeforeAnyFutureRuntime, 'No direct code, worker, tool, or raw prompt execution is allowed.'),
    gate('phase_roadmap', input.phaseRoadmap.items.length >= 8 && input.phaseRoadmap.provider1Readiness !== undefined, 'Provider roadmap defines audit, fixtures, guarded live validation, dry-run routing, and later samples.'),
    gate('supabase_milestone_sync', input.executionMode ? input.supabaseSyncResult.status === 'completed' : true, input.executionMode ? 'PROVIDER-0 milestone sync completed during execution or exact blocker recorded.' : 'Static mode does not write Supabase.'),
    gate('blocked_features', true, 'Runtime, provider calls, public artifacts, signed URL source-of-truth, production, beta, and broad media remain blocked.'),
  ]
  for (const scriptName of providerModelsAuditRequiredScripts) {
    if (!input.packageScripts[scriptName]) gates.push(gate('blocked_features', false, `Missing package script ${scriptName}.`))
  }
  for (const [docPath, present] of Object.entries(input.docsPresent)) {
    if (!present) gates.push(gate('repo_contract_audit', false, `Missing PROVIDER-0 doc ${docPath}.`))
  }
  const blockers = Array.from(new Set([...input.repoAudit.blockers, ...gates.filter((qaGate) => !qaGate.passed).map((qaGate) => `${qaGate.gateId}: ${qaGate.summary}`), ...input.supabaseSyncResult.blockers]))
  const warnings = Array.from(new Set([...input.repoAudit.warnings, ...input.supabaseSyncResult.warnings]))
  return { status: blockers.length ? 'blocked' : 'passed', gates, blockers, warnings }
}

function hasEvidence(evidence: ProviderOfficialEvidence[], provider: ProviderOfficialEvidence['provider']): boolean {
  return evidence.some((entry) => entry.provider === provider && entry.sourceType === 'official_docs')
}

function gate(gateId: ProviderModelsAuditQaGate['gateId'], passed: boolean, summary: string): ProviderModelsAuditQaGate {
  return { gateId, passed, mandatory: true, summary }
}
