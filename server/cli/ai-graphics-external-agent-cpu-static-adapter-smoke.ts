import fs from 'node:fs'
import {
  AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_ADAPTER_SMOKE_DECISION,
  buildAiGraphicsExternalAgentCpuStaticAdapterSmoke,
} from '../tool-registry/ai-graphics-external-agent-cpu-static-adapter-smoke'

const phase0Path =
  'docs/tool-intelligence/ai-graphics/cpu-static-execution-proof-phase-0.json'
const adapterAuthorizationPath =
  'docs/tool-intelligence/ai-graphics/external-agent-tool-adapter-authorization-proof.json'
const outputJsonPath =
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-adapter-smoke.json'
const outputMdPath =
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-adapter-smoke.md'
const promptResultPath =
  'docs/prompt-ai-graphics-external-agent-cpu-static-adapter-smoke-results.md'
const implementationPromptPath =
  'docs/implementation-prompts/prompt-ai-graphics-external-agent-cpu-static-adapter-smoke.md'

type JsonRecord = Record<string, any>

function readJson(file: string): JsonRecord {
  return JSON.parse(fs.readFileSync(file, 'utf8')) as JsonRecord
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function makeMarkdown(report: ReturnType<typeof buildAiGraphicsExternalAgentCpuStaticAdapterSmoke>): string {
  const readyTools = report.rows
    .filter((row) => row.adapterSmokePreparedWithProvidedEvidence)
    .map((row) => `\`${row.toolId}\``)
    .join(', ')
  const blockedTools = report.rows
    .filter((row) => row.cpuStaticCohortTool && !row.adapterSmokePreparedWithProvidedEvidence)
    .map((row) => `\`${row.toolId}\`: ${row.blocker}`)
    .join('\n- ')
  const rows = report.rows
    .map(
      (row) =>
        `| \`${row.toolId}\` | \`${row.runtimeTarget}\` | \`${row.adapterSmokeStatus}\` | \`${row.phase0Status ?? 'n/a'}\` | \`${row.externalAgentCanInvokeAdapterNow}\` | ${row.blocker} |`,
    )
    .join('\n')

  return `# AI Graphics External Agent CPU Static Adapter Smoke

Decision: \`${report.decision}\`

Status: \`${report.status}\`

This packet takes the next small execution-readiness step after adapter authorization. It consumes the accepted CPU/static Phase 0 proof and marks the five passed CPU/static tools as adapter-smoke ready with private output contracts. It still keeps actual external-agent adapter invocation and tool execution blocked.

## Source Evidence

- CPU/static Phase 0 proof: \`${phase0Path}\`
- Phase 0 decision: \`${report.sourcePhase0Decision}\`
- Adapter authorization proof: \`${adapterAuthorizationPath}\`
- Adapter authorization decision: \`${report.sourceAdapterAuthorizationDecision}\`
- Builder: \`server/tool-registry/ai-graphics-external-agent-cpu-static-adapter-smoke.ts\`
- CLI: \`server/cli/ai-graphics-external-agent-cpu-static-adapter-smoke.ts\`

## CPU/Static Adapter Smoke Result

- CPU/static cohort tools: \`${report.counts.cpuStaticCohortTools}\`
- Adapter-smoke ready with private output contracts: \`${report.counts.cpuStaticAdapterSmokeReadyTools}\` tools: ${readyTools}
- Blocked CPU/static tools: \`${report.counts.cpuStaticAdapterSmokeBlockedTools}\`
- Satori blocked pending approved font fixture: \`${report.counts.satoriBlockedPendingApprovedFontFixtureTools}\`
- Non-CPU/static tools deferred by runtime boundary: \`${report.counts.nonCpuStaticDeferredTools}\`
- External-agent invokable adapter tools now: \`${report.counts.externalAgentCanInvokeAdapterNowTools}\`
- Tool execution approved tools now: \`${report.counts.toolExecutionApprovedNowTools}\`
- GPU runtime starts now: \`${report.counts.gpuRuntimeShouldStartNowTools}\`

Blocked CPU/static rows:

- ${blockedTools || 'none'}

## Tool Rows

| Tool | Runtime target | Adapter smoke status | Phase 0 status | Invokable now | Blocker |
| --- | --- | --- | --- | --- | --- |
${rows}

## Runtime Boundary

- \`agentCanSelectForPlanning=true\`
- \`externalAgentCanInvokeAdapterNow=false\`
- \`agentCanExecuteToolsNow=false\`
- \`routeExecutionApprovedNow=false\`
- \`workerExecutionApprovedNow=false\`
- \`toolExecutionApprovedNow=false\`
- \`providerRuntimeApprovedNow=false\`
- \`browserWebglCanvasRuntimeApprovedNow=false\`
- \`gpuRuntimeApprovedNow=false\`
- \`gpuRuntimeShouldStartNow=false\`
- \`runtimeReadyNow=false\`
- \`externalBetaReadyNow=false\`
- \`productionReadyNow=false\`

No dependency install, package-lock mutation, backend queue submission, live queue write, worker enqueue, worker dispatch, tool execution, route execution, provider/model runtime, browser/WebGL/canvas runtime, GPU/model runtime, model download/load, media processing, Supabase/GCS mutation, signed URL, public artifact, external beta unlock, or production unlock is approved by this packet.

## Next Milestone

${report.nextMilestone}
`
}

function makePromptResult(
  report: ReturnType<typeof buildAiGraphicsExternalAgentCpuStaticAdapterSmoke>,
): string {
  return `# Prompt AI Graphics External Agent CPU Static Adapter Smoke Results

- Branch: \`codex/rp-ai-graphics-tool-call-readiness-contract\`
- Draft PR: https://github.com/yuzastudio6-cyber/Reedkt/pull/862
- Draft status: open/draft/CLEAN at the latest recorded push.
- Decision: \`${report.decision}\`
- CPU/static adapter-smoke ready tools: \`${report.counts.cpuStaticAdapterSmokeReadyTools}\`
- CPU/static blocked tools: \`${report.counts.cpuStaticAdapterSmokeBlockedTools}\`
- Satori block: pending approved font fixture.
- External-agent invokable adapter tools now: \`${report.counts.externalAgentCanInvokeAdapterNowTools}\`
- Tool execution approved tools now: \`${report.counts.toolExecutionApprovedNowTools}\`
- GPU runtime starts now: \`${report.counts.gpuRuntimeShouldStartNowTools}\`

## No-Scope

No direct agent execution, Tool Route execution, Worker execution, provider/model runtime, browser/WebGL/canvas runtime, GPU/model runtime, dependency install, package-lock mutation, Supabase/GCS mutation, signed URL, public artifact, external beta unlock, or production unlock is approved.

## Next Prompt

\`AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_HANDOFF_ADMISSION\`
`
}

function makeImplementationPrompt(
  report: ReturnType<typeof buildAiGraphicsExternalAgentCpuStaticAdapterSmoke>,
): string {
  return `# AI Graphics External Agent CPU Static Adapter Smoke Implementation Record

Implemented the CPU/static adapter-smoke contract from accepted Phase 0 evidence.

## Accepted Source

- Phase 0 proof: \`${phase0Path}\`
- Adapter authorization proof: \`${adapterAuthorizationPath}\`

## Result

- \`${report.counts.cpuStaticAdapterSmokeReadyTools}\` CPU/static adapter-smoke tools are ready with private output contracts.
- \`${report.counts.satoriBlockedPendingApprovedFontFixtureTools}\` Satori row remains blocked pending approved font fixture proof.
- \`${report.counts.nonCpuStaticDeferredTools}\` browser/GPU tools remain deferred by runtime boundary.
- All actual execution gates remain false.

## Draft PR Metadata

- Draft PR: https://github.com/yuzastudio6-cyber/Reedkt/pull/862
- Draft status: open/draft/CLEAN at the latest recorded push.
- Check rollup: empty at the latest recorded push.
`
}

async function main() {
  const phase0 = readJson(phase0Path)
  const adapter = readJson(adapterAuthorizationPath)

  const report = buildAiGraphicsExternalAgentCpuStaticAdapterSmoke({
    sourcePhase0Decision: phase0.decision,
    sourcePhase0Status: phase0.status,
    sourcePhase0Tools: phase0.tools,
    sourceAdapterAuthorizationDecision: adapter.decision,
    sourceAdapterAuthorizationStatus: adapter.status,
    sourceAdapterAuthorizationRows: adapter.counts?.adapterAuthorizationRows,
    sourceAdapterContractsAuthorizedWithRuntimeBlocks:
      adapter.counts?.adapterContractsAuthorizedWithRuntimeBlocks,
    sourceAdapterExternalAgentCanInvokeAdapterNowTools:
      adapter.counts?.externalAgentCanInvokeAdapterNowTools,
    sourceAdapterToolExecutionApprovedNowTools:
      adapter.counts?.toolExecutionApprovedNowTools,
    sourceAdapterGpuRuntimeShouldStartNowTools:
      adapter.counts?.gpuRuntimeShouldStartNowTools,
  })

  assert(
    report.decision === AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_ADAPTER_SMOKE_DECISION,
    'Unexpected CPU/static adapter smoke decision',
  )
  assert(report.counts.totalAiGraphicsTools === 21, 'CPU/static adapter smoke must cover all 21 tools')
  assert(report.counts.cpuStaticCohortTools === 6, 'CPU/static cohort count mismatch')
  assert(report.counts.cpuStaticAdapterSmokeReadyTools === 5, 'Expected five ready CPU/static adapter smoke tools')
  assert(report.counts.satoriBlockedPendingApprovedFontFixtureTools === 1, 'Expected Satori font fixture block')
  assert(report.counts.externalAgentCanInvokeAdapterNowTools === 0, 'No adapter may be invokable now')
  assert(report.counts.toolExecutionApprovedNowTools === 0, 'No tool execution may be approved now')
  assert(report.booleans.sourcePhase0Accepted === true, 'Phase 0 proof was not accepted')
  assert(report.booleans.sourceAdapterAuthorizationAccepted === true, 'Adapter authorization proof was not accepted')
  assert(report.booleans.agentCanExecuteToolsNow === false, 'Agent execution must remain false')
  assert(report.booleans.gpuRuntimeShouldStartNow === false, 'GPU runtime must not start now')

  if (process.argv.includes('--write-records')) {
    fs.writeFileSync(outputJsonPath, `${JSON.stringify(report, null, 2)}\n`)
    fs.writeFileSync(outputMdPath, makeMarkdown(report))
    fs.writeFileSync(promptResultPath, makePromptResult(report))
    fs.writeFileSync(implementationPromptPath, makeImplementationPrompt(report))
  }

  console.log(JSON.stringify(report, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
