import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import {
  MODEL_PROVIDER_DRY_RUN_BASE_BRANCH,
  MODEL_PROVIDER_DRY_RUN_BRANCH,
  MODEL_PROVIDER_DRY_RUN_PR_TITLE,
} from './model-provider-dry-run-policy'

function readJson(filePath: string): Record<string, unknown> | undefined {
  if (!existsSync(filePath)) return undefined
  return JSON.parse(readFileSync(filePath, 'utf8')) as Record<string, unknown>
}

function pathStatus(filePath: string) {
  return { path: filePath, present: existsSync(filePath) }
}

export function buildModelProviderDryRunSourceAudit(runId: string) {
  const approvalDir = 'docs/activation-model-orchestration-dry-run-approval-reports'
  const auditDir = 'docs/activation-model-orchestration-qwen-deepseek-audit-reports'
  const approvalReadiness = readJson(path.join(approvalDir, 'dry_run_readiness_report.json'))
  const approvalDecision = readJson(path.join(approvalDir, 'dry_run_approval_decision.json'))
  const providerReview = readJson(path.join(approvalDir, 'provider_candidate_review.json'))
  const cases = readJson(path.join(approvalDir, 'dry_run_synthetic_cases.json'))

  const approved = approvalDecision?.decision === 'approved_for_future_qwen_deepseek_provider_dry_run'
    && approvalReadiness?.status === 'passed'
    && providerReview?.status === 'passed'

  return {
    phase: 'MODEL_DRYRUN_1',
    runId,
    branch: MODEL_PROVIDER_DRY_RUN_BRANCH,
    baseBranch: MODEL_PROVIDER_DRY_RUN_BASE_BRANCH,
    prTitle: MODEL_PROVIDER_DRY_RUN_PR_TITLE,
    pr318: {
      title: '[model] Qwen DeepSeek dry-run approval packet',
      headBranch: MODEL_PROVIDER_DRY_RUN_BASE_BRANCH,
      recordedHead: '64a52452893c47d7a5972134243af313a2b76ac9',
      approvalPacketSource: approvalDir,
    },
    sourcePaths: [
      'model-routing-policy.md',
      'provider-prompt-architecture.md',
      'docs/model-orchestration-dry-run-approval.md',
      'docs/model-orchestration-dry-run-approval-decision.md',
      'docs/model-orchestration-dry-run-schema-contract.md',
      'docs/model-orchestration-dry-run-audit-redaction-policy.md',
      approvalDir,
      auditDir,
    ].map(pathStatus),
    approvalDecision: approvalDecision?.decision ?? 'missing',
    approvalStatus: approvalDecision?.approvalStatus ?? 'missing',
    approvalReadinessStatus: approvalReadiness?.status ?? 'missing',
    providerCandidateReviewStatus: providerReview?.status ?? 'missing',
    syntheticCaseCount: cases?.caseCount ?? 'missing',
    dryRunAuthorization: approved ? 'approved_for_modeldryrun1_execution_gated' : 'missing_or_blocked',
    liveSyntheticProviderCallAuthorization: approved,
    qwenDefaultModel: 'qwen3.7-plus',
    deepseekDefaultModel: 'deepseek-v4-flash',
    escalationModelsApprovedForThisRun: false,
    blockers: approved ? [] : ['blocked_missing_live_synthetic_provider_authorization'],
    noScope: {
      userDataAllowed: false,
      rawMediaAllowed: false,
      providerChainingAllowed: false,
      toolExecutionAllowed: false,
      workerExecutionAllowed: false,
      routeExecutionAllowed: false,
      supabaseSqlAllowed: false,
      productionAllowed: false,
      externalBetaAllowed: false,
    },
  }
}
