import { readFileSync } from 'node:fs'
import {
  HEAVY_TOOL_FAMILIES,
  REQUIRED_TOOL_IDS,
  TOOL_READINESS_POLICY,
  TOOL_READINESS_STATES,
  listToolReadinessEntries,
  runToolReadinessDiagnostics,
} from '../foundation/tool-readiness'

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
}

const tools = listToolReadinessEntries()
const toolIds = new Set(tools.map((tool) => tool.toolId))

assert(tools.length >= REQUIRED_TOOL_IDS.length, 'Registry should include required Prompt 13 tools.')

for (const toolId of REQUIRED_TOOL_IDS) {
  assert(toolIds.has(toolId), `Registry should include ${toolId}.`)
}

for (const tool of tools) {
  assert(
    TOOL_READINESS_STATES.includes(tool.readinessState),
    `${tool.toolId} should have a valid readiness state.`,
  )
  assert(!tool.productionAllowed, `${tool.toolId} must not be production enabled.`)
  assert(!tool.externalBetaAllowed, `${tool.toolId} must not be external beta enabled.`)
  assert(!tool.broadRealMediaAllowed, `${tool.toolId} must not be broad real media enabled.`)
  assert(!tool.allowedInRuntime, `${tool.toolId} must not be runtime enabled in Prompt 13.`)
  assert(!tool.requiresSignedUrl, `${tool.toolId} must not require signed URLs as source of truth.`)
  assert(!tool.requiresFrontendExecution, `${tool.toolId} must not execute from the frontend.`)
  assert(
    !tool.requiresProvider || tool.readinessState === 'disabled',
    `${tool.toolId} provider tools must remain disabled.`,
  )
  if (
    tool.readinessState === 'disabled' ||
    tool.readinessState === 'blocked_missing_runtime' ||
    tool.readinessState === 'blocked_missing_approval' ||
    tool.readinessState === 'blocked_missing_secret' ||
    tool.readinessState === 'blocked_by_policy' ||
    tool.readinessState === 'never_public' ||
    tool.readinessState === 'not_configured'
  ) {
    assert(Boolean(tool.blockedReason), `${tool.toolId} blocked state should include a reason.`)
  }
  if (HEAVY_TOOL_FAMILIES.includes(tool.family as (typeof HEAVY_TOOL_FAMILIES)[number])) {
    assert(!tool.requiresFrontendExecution, `${tool.toolId} heavy tool must stay out of browser runtime.`)
  }
}

const demucs = tools.find((tool) => tool.toolId === 'demucs')
const qwenVl = tools.find((tool) => tool.toolId === 'qwen-vl')
const vllm = tools.find((tool) => tool.toolId === 'vllm')
assert(demucs?.readinessState === 'blocked_missing_approval', 'Demucs should be blocked pending model approval.')
assert(qwenVl?.readinessState === 'blocked_by_policy', 'Qwen VL should be blocked by policy.')
assert(vllm?.readinessState === 'blocked_by_policy', 'vLLM should be blocked by policy.')

const diagnostics = runToolReadinessDiagnostics(tools)
assert(diagnostics.status === 'passed', `Diagnostics should pass: ${diagnostics.failedCheckIds.join(', ')}`)

const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
  scripts?: Record<string, string>
}
assert(
  packageJson.scripts?.['foundation:tool-readiness'] === 'tsx server/cli/foundation-tool-readiness.ts',
  'foundation:tool-readiness script should exist.',
)
assert(
  packageJson.scripts?.['foundation:tool-readiness:report'] ===
    'tsx server/cli/foundation-tool-readiness-report.ts',
  'foundation:tool-readiness:report script should exist.',
)
assert(
  packageJson.scripts?.['smoke:tool-readiness-worker-runtime-foundation'] ===
    'tsx server/smoke/tool-readiness-worker-runtime-foundation-smoke.ts',
  'Prompt 13 smoke script should exist.',
)

assert(!TOOL_READINESS_POLICY.runtimeExecutionAllowed, 'Runtime execution policy must remain disabled.')
assert(!TOOL_READINESS_POLICY.providerExecutionAllowed, 'Provider execution policy must remain disabled.')
assert(!TOOL_READINESS_POLICY.mediaProcessingAllowed, 'Media processing policy must remain disabled.')
assert(!TOOL_READINESS_POLICY.productionAllowed, 'Production policy must remain disabled.')
assert(!TOOL_READINESS_POLICY.externalBetaAllowed, 'External beta policy must remain disabled.')
assert(!TOOL_READINESS_POLICY.broadRealMediaAllowed, 'Broad media policy must remain disabled.')

console.log(JSON.stringify({
  ok: true,
  checks: [
    'registry_loads',
    'known_tools_exist',
    'readiness_states_valid',
    'blocked_tools_have_reasons',
    'runtime_execution_disabled',
    'provider_execution_disabled',
    'signed_urls_disabled',
    'frontend_heavy_runtime_disabled',
    'diagnostics_pass',
    'package_scripts_exist',
  ],
  registrySize: tools.length,
  diagnostics: diagnostics.status,
}, null, 2))
