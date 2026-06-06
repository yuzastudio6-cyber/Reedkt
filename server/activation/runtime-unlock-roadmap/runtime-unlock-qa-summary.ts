import { runtimeUnlockRequiredScripts } from './runtime-unlock-roadmap-policy'
import type {
  OwnerAcceptanceMatrix,
  OwnerRepoAuditPrompt,
  RuntimeUnlockBlockedScopePolicy,
  RuntimeUnlockLadder,
  RuntimeUnlockQaGate,
  RuntimeUnlockQaSummary,
  RuntimeUnlockSourceAudit,
  RuntimeUnlockSupabaseSyncResult,
} from './runtime-unlock-roadmap-types'

export function buildRuntimeUnlockQaSummary(input: {
  packageScripts: Record<string, string>
  docsPresent: Record<string, boolean>
  sourceAudit: RuntimeUnlockSourceAudit
  ladder: RuntimeUnlockLadder
  blockedScopePolicy: RuntimeUnlockBlockedScopePolicy
  ownerAcceptanceMatrix: OwnerAcceptanceMatrix
  ownerRepoAuditPrompts: OwnerRepoAuditPrompt[]
  supabaseSyncResult: RuntimeUnlockSupabaseSyncResult
  executionMode: boolean
}): RuntimeUnlockQaSummary {
  const gates: RuntimeUnlockQaGate[] = [
    gate('source_of_truth_repo_audit', input.sourceAudit.blockers.length === 0, 'Required source-of-truth contracts are present; optional gaps are documented.'),
    gate('phase52h_evidence', input.sourceAudit.phase52HEvidencePresent && input.sourceAudit.phase52HStatus === 'completed', 'Phase 52H completed evidence is present.'),
    gate('unlock_ladder_defined', input.ladder.stages.length === 10 && input.ladder.stages[0]?.stageId === 'blocked' && input.ladder.stages.at(-1)?.stageId === 'production_candidate', 'Official 10-stage unlock ladder is defined.'),
    gate('blocked_scope_policy', input.blockedScopePolicy.rules.length >= 16, 'Blocked scope policy covers runtime, provider, artifact, beta, and production scopes.'),
    gate('owner_acceptance_matrix', input.ownerAcceptanceMatrix.rows.length === 12 && input.ownerAcceptanceMatrix.rows.every((row) => row.currentUnlockStage === 'blocked' || row.currentUnlockStage === 'owner_accepted'), 'Owner acceptance matrix covers all 12 workstreams.'),
    gate('owner_repo_audit_prompts', input.ownerRepoAuditPrompts.length === 12 && input.ownerRepoAuditPrompts.every((prompt) => prompt.noImplementationUntilAudit), 'Owner repo-audit prompts exist and prohibit implementation during audit.'),
    gate('raw_prompt_execution_policy', input.blockedScopePolicy.rawPromptExecutionPolicy === 'blocked_as_direct_execution_forever', 'Raw prompt direct execution is permanently blocked.'),
    gate('signed_url_source_of_truth_policy', input.blockedScopePolicy.signedUrlSourceOfTruthPolicy === 'blocked_forever', 'Signed URLs remain blocked as source of truth forever.'),
    gate('supabase_milestone_sync', input.executionMode ? input.supabaseSyncResult.status === 'completed' : true, input.executionMode ? 'Phase 53A milestone sync completed during execution or exact blocker recorded.' : 'Static mode references Supabase sync without writing.'),
    gate('blocked_features', true, 'Runtime execution, schema changes, public artifacts, beta, and production remain blocked.'),
  ]

  for (const scriptName of runtimeUnlockRequiredScripts) {
    if (!input.packageScripts[scriptName]) gates.push(gate('blocked_features', false, `Missing package script ${scriptName}.`))
  }
  for (const [docPath, present] of Object.entries(input.docsPresent)) {
    if (!present) gates.push(gate('source_of_truth_repo_audit', false, `Missing Phase 53A doc ${docPath}.`))
  }

  const blockers = Array.from(new Set([...input.sourceAudit.blockers, ...gates.filter((qaGate) => !qaGate.passed).map((qaGate) => `${qaGate.gateId}: ${qaGate.summary}`), ...input.supabaseSyncResult.blockers]))
  const warnings = Array.from(new Set([...input.sourceAudit.warnings, ...input.supabaseSyncResult.warnings]))
  return {
    status: blockers.length ? 'blocked' : 'passed',
    gates,
    blockers,
    warnings,
  }
}

function gate(gateId: RuntimeUnlockQaGate['gateId'], passed: boolean, summary: string): RuntimeUnlockQaGate {
  return { gateId, passed, mandatory: true, summary }
}
