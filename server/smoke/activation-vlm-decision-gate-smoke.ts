import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import {
  buildVlmDecisionGateReports,
  getVlmDecisionGatePlan,
} from '../activation/vlm-decision-gate'

const plan = getVlmDecisionGatePlan()
assert.equal(plan.phase, '39C-DECISION')
assert.equal(plan.defaultMode, 'report_only_non_mutating')
assert.equal(plan.branch, 'codex/rp-activation-39c-vlm-decision-gate-recovery-plan')
assert.equal(plan.baseIfPr115Open, 'codex/rp-activation-39c-sg-auth-rerun-fixed-kernel')
assert.equal(plan.prBaseIfPr115Open, 'codex/rp-activation-39c-sg-auth-rerun-fixed-kernel')
assert.equal(plan.requiredConfirmationsForReportGeneration.includes('REEDITPRO_CONFIRM_VLM_DECISION_GATE'), true)
assert.equal(plan.requiredConfirmationsForReportGeneration.includes('REEDITPRO_CONFIRM_VLM_DECISION_WEB_RESEARCH'), true)
assert.equal(plan.vlmToolFamilyBetaStatus, 'blocked')
assert.equal(plan.recommendedNextPhase, 'Phase 46A media/data tool readiness audit')

for (const forbidden of [
  'Docker execution',
  'Cloud Build execution',
  'Cloud Run execution',
  'GPU jobs',
  'IAM mutation',
  'model download',
  'model staging',
  'vLLM runtime',
  'SGLang runtime',
  'generated image fixture reprocessing',
  'real media processing',
  'provider/API calls',
]) {
  assert.equal(plan.forbiddenActions.includes(forbidden), true, `${forbidden} must be forbidden`)
}

for (const pr of [62, 64, 66, 87, 90, 97, 100, 104, 107, 110, 115]) {
  assert.equal(plan.sourcePullRequests.includes(pr), true, `PR ${pr} must be included`)
}

for (const blocked of [
  'Phase 39D controlled real-frame VLM',
  'Phase 39E object-aware/safe-zone planning integration',
  'VLM runtime retries without explicit new approval and new evidence',
  'provider calls',
  'production',
  'internal beta',
  'external beta',
  'public output',
  'broad user media',
  'arbitrary media',
  'unapproved GPU/runtime classes',
  'non-Qwen candidates unless separately approved',
  'new model downloads',
  'Track A runtime/visual/render stack',
]) {
  assert.equal(plan.blockedScopes.includes(blocked), true, `${blocked} must remain blocked`)
}

const reports = buildVlmDecisionGateReports()
assert.equal(reports.decisionRecord.phase39dStatus, 'blocked')
assert.equal(reports.decisionRecord.phase39eStatus, 'blocked')
assert.equal(reports.decisionRecord.vlmToolFamilyBetaStatus, 'blocked')
assert.equal(reports.decisionRecord.primaryRecommendation, 'Move to Phase 46A media/data tool readiness audit.')
assert.equal(reports.evidenceInventory.sourcePrs.length, 11)
assert.deepEqual(reports.recoveryMatrix.options.map((option) => option.id), ['A', 'B', 'C', 'D', 'E', 'F'])
assert.equal(reports.webResearch.sources.some((source) => source.id === 'vllm-supported-qwen3vl'), true)
assert.equal(reports.webResearch.sources.some((source) => source.id === 'sglang-qwen3vl'), true)
assert.equal(reports.webResearch.sources.some((source) => source.id === 'cloud-run-gpu'), true)
assert.equal(reports.rootCause.vllmBlockers.some((item) => item.includes('CUDA OOM')), true)
assert.equal(reports.rootCause.sglangBlockers.some((item) => item.includes('cuGreenCtxDestroy')), true)
assert.equal(reports.artifactManifest.privateArtifactsUploaded, false)

const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as { scripts: Record<string, string> }
assert.equal(packageJson.scripts['activation:vlm-decision-gate:plan'], 'tsx server/cli/activation-vlm-decision-gate-plan.ts')
assert.equal(packageJson.scripts['activation:vlm-decision-gate'], 'tsx server/cli/activation-vlm-decision-gate.ts')
assert.equal(packageJson.scripts['activation:vlm-decision-gate:report'], 'tsx server/cli/activation-vlm-decision-gate-report.ts')
assert.equal(packageJson.scripts['activation:vlm-decision-gate:web-research'], 'tsx server/cli/activation-vlm-decision-gate-web-research.ts')
assert.equal(packageJson.scripts['activation:vlm-decision-gate:summary'], 'tsx server/cli/activation-vlm-decision-gate-summary.ts')
assert.equal(packageJson.scripts['smoke:activation-vlm-decision-gate'], 'tsx server/smoke/activation-vlm-decision-gate-smoke.ts')

for (const filePath of [
  '../activation/vlm-decision-gate/index.ts',
  '../cli/activation-vlm-decision-gate.ts',
  '../cli/activation-vlm-decision-gate-report.ts',
  '../cli/activation-vlm-decision-gate-web-research.ts',
]) {
  assert.equal(existsSync(new URL(filePath, import.meta.url)), true, `${filePath} must exist`)
}

const source = readFileSync(new URL('../activation/vlm-decision-gate/index.ts', import.meta.url), 'utf8')
assert.equal(source.includes('REEDITPRO_CONFIRM_VLM_DECISION_GATE'), true)
assert.equal(source.includes('REEDITPRO_CONFIRM_VLM_DECISION_WEB_RESEARCH'), true)
assert.equal(/gcloud builds submit|gcloud run jobs execute|docker build|add-iam-policy-binding|huggingface-cli download|from_pretrained\(/.test(source), false)

console.log(JSON.stringify({
  ok: true,
  checks: [
    'decision_gate_report_only',
    'all_vlm_evidence_prs_referenced',
    'web_research_sources_recorded',
    'root_cause_and_recovery_matrix_present',
    'phase46a_recommended',
    'phase39d_phase39e_beta_production_track_a_blocked',
    'runtime_cloud_model_media_actions_forbidden',
  ],
}))
