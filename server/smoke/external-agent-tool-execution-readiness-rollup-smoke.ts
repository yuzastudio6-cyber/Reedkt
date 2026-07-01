import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import { EXTERNAL_AGENT_TOOL_EXECUTION_READINESS_ROLLUP } from '../../src/backend/mock/mock-external-agent-tool-execution-readiness-rollup'

const ROOT = process.cwd()
const DOC_PATH = 'docs/external-agent-tool-execution-readiness-rollup.md'
const SPEC_PATH = 'src/backend/mock/mock-external-agent-tool-execution-readiness-rollup.ts'
const SMOKE_PATH = 'server/smoke/external-agent-tool-execution-readiness-rollup-smoke.ts'
const PACKAGE_SCRIPT = 'smoke:external-agent-tool-execution-readiness-rollup'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58DW-PRIVATE-INFERENCE-BOUNDED-RETRY-PROMPT: run one bounded approved-fixture private inference retry through the persisted job and lease bridge, no generated assets/no mutation'

function read(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function scanForbiddenValues(value: unknown, prefix = 'rollup'): string[] {
  const findings: string[] = []

  if (typeof value === 'string') {
    const patterns: Array<[string, RegExp]> = [
      ['authorization bearer value', /\bAuthorization\s*:\s*Bearer\s+\S+/i],
      ['signed URL token', /\b(X-Amz-Signature|X-Amz-Credential|Signature=|Key-Pair-Id=|Policy=)/i],
      ['service-role value', /\bservice[_-]?role\s*[:=]\s*['"][^'"]+/i],
      ['api key value', /\bapi[_-]?key\s*[:=]\s*['"][^'"]+/i],
      ['raw worker prompt field', /\braw[_-]?worker[_-]?prompt\b/i],
      ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
      ['public storage URL', /\bstorage\.googleapis\.com\b/i],
      ['Supabase project URL', /https:\/\/[a-z0-9]{20}\.supabase\.co/i],
    ]

    for (const [name, pattern] of patterns) {
      if (pattern.test(value)) findings.push(`${prefix}: ${name}`)
    }

    return findings
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => findings.push(...scanForbiddenValues(item, `${prefix}[${index}]`)))
    return findings
  }

  if (value && typeof value === 'object') {
    for (const [key, nestedValue] of Object.entries(value)) {
      findings.push(...scanForbiddenValues(nestedValue, `${prefix}.${key}`))
    }
  }

  return findings
}

for (const file of [DOC_PATH, SPEC_PATH, SMOKE_PATH]) {
  assert.equal(existsSync(path.join(ROOT, file)), true, `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json'))
assert.equal(
  packageJson.scripts?.[PACKAGE_SCRIPT],
  'tsx server/smoke/external-agent-tool-execution-readiness-rollup-smoke.ts',
  'package.json script mismatch',
)

const doc = read(DOC_PATH)
for (const required of [
  'external_agent_tool_execution_readiness_partial_blocked_qwen_auth_verified_broll_quota',
  '`qwen2_5_vl_7b_instruct`',
  '`ai_video_broll_generation_wan`',
  '`sound_music_audio`',
  '`supabase_local_fixture_harness`',
  'ready for explicit tool gate',
  'auth-readable live preflight now reads GPU quota',
  '`GPUS_ALL_REGIONS` remains insufficient',
  'Qwen selected GPU: `nvidia_l4`',
  'Qwen Cloud Run minimum instances: `0`',
  'B-roll selected proof GPU: `nvidia_l4`',
  'B-roll no-idle GPU lifecycle is required',
  '## Safe Agent Commands',
  'auth/service/job visibility is now verified',
  'the historical 58DU blocked retry result, and the 58DV gate alignment are recorded',
  'Qwen may proceed only to the explicit 58DW bounded retry prompt',
  'External agents should start with `npm run external-agent-tool-action-plan`',
  '`npm run external-agent-tool-execution-gate` as a fail-closed static go/no-go gate',
  '`npm run external-agent-tool-execution-gate -- --require-go` exits zero only because Qwen is ready for the explicit 58DW tool prompt',
  'the preferred next safe command is `npm run external-agent-tool-next-command`',
  'combines the fail-closed gate and live read-only blocker probes',
  '`npm run external-agent-tool-execution-gate` provides a fail-closed static go/no-go report',
  '`npm run external-agent-tool-next-command` provides a read-only live next-command decision',
  '`npm run external-agent-tool-blockers:preflight` provides a read-only live blocker preflight',
  '`npm run external-agent-gcloud-session:diagnostic`',
  'read-only local gcloud session/config diagnostic',
  '`npm run ai-video-broll-wan-fast-cache-readiness:check` provides a stat-only Wan private cache preflight',
  'B-roll external-agent execution must not leave an idle GPU running',
  NEXT_PROMPT,
]) {
  assert.equal(doc.includes(required), true, `Rollup doc missing ${required}`)
}

const rollup = EXTERNAL_AGENT_TOOL_EXECUTION_READINESS_ROLLUP
assert.equal(rollup.decision, 'external_agent_tool_execution_readiness_partial_blocked_qwen_auth_verified_broll_quota')
assert.equal(rollup.mode, 'external_agent_tool_execution_readiness_rollup_only')
assert.equal(rollup.paidProductionInScope, false)
assert.equal(rollup.dryRunPassedClaimed, false)
assert.equal(rollup.generatedLocalFixturePassedClaimed, false)
assert.equal(rollup.sourceRules.approvedSnapshotRequired, true)
assert.equal(rollup.sourceRules.rawChatExecutionAllowed, false)
assert.equal(rollup.sourceRules.aiVideoOwnsFinalCanvas, false)
assert.equal(rollup.sourceRules.remotionOwnsFinalComposition, true)
assert.equal(rollup.recommendedNextPrompt, NEXT_PROMPT)
assert.equal(rollup.safeNextCommands.length, 7)
assert.equal(
  rollup.safeNextCommands.some((command) => command.command === 'npm run external-agent-tool-action-plan'),
  true,
)
assert.equal(
  rollup.safeNextCommands.some((command) => command.command === 'npm run external-agent-tool-readiness:check'),
  true,
)
assert.equal(
  rollup.safeNextCommands.some((command) => command.command === 'npm run external-agent-tool-execution-gate'),
  true,
)
assert.equal(
  rollup.safeNextCommands.some((command) => command.command === 'npm run external-agent-tool-next-command'),
  true,
)
assert.equal(
  rollup.safeNextCommands.some((command) => command.command === 'npm run external-agent-tool-blockers:preflight'),
  true,
)
assert.equal(
  rollup.safeNextCommands.some((command) => command.command === 'npm run external-agent-gcloud-session:diagnostic'),
  true,
)
assert.equal(
  rollup.safeNextCommands.some(
    (command) => command.command === 'npm run ai-video-broll-wan-fast-cache-readiness:check',
  ),
  true,
)
for (const command of rollup.safeNextCommands) {
  assert.equal(command.mutatesRuntime, false, `${command.id} must not mutate runtime`)
  assert.equal(command.runsModel, false, `${command.id} must not run models`)
  assert.equal(command.createsAssets, false, `${command.id} must not create assets`)
}

for (const [flag, value] of Object.entries(rollup.runtimeSideEffects)) {
  assert.equal(value, false, `Runtime side-effect flag must be false: ${flag}`)
}

const toolsById = new Map(rollup.tools.map((tool) => [tool.toolId, tool]))
for (const requiredTool of [
  'qwen2_5_vl_7b_instruct',
  'ai_video_broll_generation_wan',
  'sound_music_audio',
  'supabase_local_fixture_harness',
]) {
  assert.equal(toolsById.has(requiredTool), true, `Missing tool readiness row: ${requiredTool}`)
}

const qwen = toolsById.get('qwen2_5_vl_7b_instruct')
assert.equal(qwen?.status, 'ready_for_explicit_tool_gate')
assert.equal(qwen?.selectedGpu, 'nvidia_l4')
assert.equal(qwen?.scaleToZeroRequired, true)
assert.equal(qwen?.readyForExternalAgentExecutionNow, true)
assert.equal(qwen?.readyForBoundedRetryAfterBlockerClears, false)
assert.equal(qwen?.primaryBlocker, 'tool_specific_bounded_execution_prompt_required_before_runtime')
assert.equal(qwen?.nextAction, NEXT_PROMPT)
assert.equal(
  qwen?.evidence.includes(
    'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-gate-alignment.md',
  ),
  true,
)
assert.equal(
  qwen?.evidence.includes(
    'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-attempt-result.md',
  ),
  true,
)
assert.equal(
  qwen?.evidence.includes(
    'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-gate-alignment.ts',
  ),
  true,
)
assert.equal(
  qwen?.evidence.includes(
    'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-attempt-approval.md',
  ),
  true,
)
assert.equal(
  qwen?.evidence.includes(
    'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-gate.md',
  ),
  true,
)
assert.equal(
  qwen?.evidence.includes(
    'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-plan.md',
  ),
  true,
)
assert.equal(
  qwen?.evidence.includes(
    'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-gate.ts',
  ),
  true,
)
assert.equal(
  qwen?.evidence.includes(
    'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-attempt-result.ts',
  ),
  true,
)
assert.equal(
  qwen?.evidence.includes(
    'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-attempt-approval.ts',
  ),
  true,
)
assert.equal(
  qwen?.evidence.includes(
    'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-plan.ts',
  ),
  true,
)
assert.equal(
  qwen?.evidence.includes(
    'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-gate-alignment-smoke.ts',
  ),
  true,
)
assert.equal(
  qwen?.evidence.includes(
    'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-gate-smoke.ts',
  ),
  true,
)
assert.equal(
  qwen?.evidence.includes(
    'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-attempt-result-smoke.ts',
  ),
  true,
)
assert.equal(
  qwen?.evidence.includes(
    'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-attempt-approval-smoke.ts',
  ),
  true,
)
assert.equal(
  qwen?.evidence.includes(
    'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-plan-smoke.ts',
  ),
  true,
)
assert.equal(qwen?.evidence.includes('server/cli/external-agent-tool-blocker-preflight.ts'), true)
assert.equal(qwen?.evidence.includes('server/smoke/external-agent-tool-blocker-preflight-smoke.ts'), true)
assert.equal(qwen?.evidence.includes('server/cli/external-agent-gcloud-session-diagnostic.ts'), true)
assert.equal(qwen?.evidence.includes('server/smoke/external-agent-gcloud-session-diagnostic-smoke.ts'), true)

const broll = toolsById.get('ai_video_broll_generation_wan')
assert.equal(broll?.status, 'blocked_external_state')
assert.equal(broll?.selectedGpu, 'nvidia_l4')
assert.equal(broll?.scaleToZeroRequired, true)
assert.equal(broll?.readyForExternalAgentExecutionNow, false)
assert.equal(broll?.readyForBoundedRetryAfterBlockerClears, true)
assert.equal(
  broll?.primaryBlocker,
  'gpus_all_regions_quota_zero_or_unverified',
)
assert.equal(
  broll?.evidence.includes('docs/ai-video-broll-generation-runtime-gpu-architecture-plan.md'),
  true,
)
assert.equal(
  broll?.evidence.includes('docs/ai-video-broll-generation-gcp-private-vm-create-plan-3-result.md'),
  true,
)
assert.equal(
  broll?.evidence.includes('server/cli/ai-video-broll-wan-fast-cache-readiness-check.ts'),
  true,
)
assert.equal(
  broll?.evidence.includes('server/smoke/ai-video-broll-wan-fast-cache-readiness-check-smoke.ts'),
  true,
)
assert.equal(broll?.evidence.includes('server/cli/external-agent-tool-blocker-preflight.ts'), true)
assert.equal(broll?.evidence.includes('server/smoke/external-agent-tool-blocker-preflight-smoke.ts'), true)

for (const tool of rollup.tools) {
  if (tool.toolId === 'qwen2_5_vl_7b_instruct') {
    assert.equal(tool.readyForExternalAgentExecutionNow, true, `${tool.toolId} must be explicit-gate ready`)
  } else {
    assert.equal(tool.readyForExternalAgentExecutionNow, false, `${tool.toolId} must not be execution-ready now`)
  }
  assert.equal(tool.evidence.length > 0, true, `${tool.toolId} needs evidence references`)
}

const forbiddenFindings = scanForbiddenValues(rollup)
assert.equal(forbiddenFindings.length, 0, `Forbidden values in rollup data: ${forbiddenFindings.join('; ')}`)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: rollup.decision,
      toolCount: rollup.tools.length,
      qwenBlocker: qwen?.primaryBlocker,
      brollBlocker: broll?.primaryBlocker,
      paidProductionInScope: rollup.paidProductionInScope,
      generatedLocalFixturePassedClaimed: rollup.generatedLocalFixturePassedClaimed,
      runtimeSideEffectsAllFalse: Object.values(rollup.runtimeSideEffects).every((value) => value === false),
      recommendedNextPrompt: rollup.recommendedNextPrompt,
    },
    null,
    2,
  ),
)
