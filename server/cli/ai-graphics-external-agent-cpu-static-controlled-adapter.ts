import fs from 'node:fs'

import {
  AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_CONTROLLED_ADAPTER_DECISION,
  AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_CONTROLLED_ADAPTER_TOOL_IDS,
  executeAiGraphicsExternalAgentCpuStaticControlledAdapter,
  type AiGraphicsExternalAgentCpuStaticControlledAdapterResult,
} from '../tool-registry/ai-graphics-external-agent-cpu-static-controlled-adapter'

const outputJsonPath =
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-controlled-adapter.json'
const outputMdPath =
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-controlled-adapter.md'
const promptResultPath =
  'docs/prompt-ai-graphics-external-agent-cpu-static-controlled-adapter-results.md'
const implementationPromptPath =
  'docs/implementation-prompts/prompt-ai-graphics-external-agent-cpu-static-controlled-adapter.md'

function makeRequest(toolId: string) {
  return {
    requestId: `controlled-adapter-${toolId}`,
    toolId: toolId as any,
    approvedPlanSnapshotId: `approved-plan-snapshot-${toolId}`,
    creditReservationId: `credit-reservation-${toolId}`,
    privateArtifactManifestRef: `private://ai-graphics/cpu-static-controlled-adapter/${toolId}/artifact-manifest`,
    toolRouteApprovalRef: `private://ai-graphics/cpu-static-controlled-adapter/${toolId}/tool-route-approval`,
    workerApprovalRef: `private://ai-graphics/cpu-static-controlled-adapter/${toolId}/worker-approval`,
    traceId: `trace-ai-graphics-cpu-static-controlled-adapter-${toolId}`,
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function summarize(results: AiGraphicsExternalAgentCpuStaticControlledAdapterResult[]) {
  const executed = results.filter((result) => result.controlledAdapterExecutedNow)
  return {
    schemaVersion: '2026-07-02.ai-graphics.external-agent-cpu-static-controlled-adapter',
    decision: AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_CONTROLLED_ADAPTER_DECISION,
    status:
      'controlled_cpu_static_adapter_executed_five_private_outputs_external_route_blocked',
    generatedAt: new Date().toISOString(),
    tools: [...AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_CONTROLLED_ADAPTER_TOOL_IDS],
    results,
    counts: {
      controlledAdapterExecutableTools: executed.length,
      controlledAdapterExecutedTools: executed.length,
      localCpuStaticPackageExecutionPerformedTools: results.filter(
        (result) => result.localCpuStaticPackageExecutionPerformed,
      ).length,
      privateOutputCandidatesReadyTools: results.filter((result) => result.output).length,
      externalAgentRouteExecutableNowTools: results.filter(
        (result) => result.externalAgentCanExecuteViaMountedRouteNow,
      ).length,
      routeExecutionApprovedNowTools: results.filter(
        (result) => result.routeExecutionApprovedNow,
      ).length,
      workerExecutionApprovedNowTools: results.filter(
        (result) => result.workerExecutionApprovedNow,
      ).length,
      toolExecutionApprovedNowTools: results.filter(
        (result) => result.toolExecutionApprovedNow,
      ).length,
      gpuRuntimeShouldStartNowTools: results.filter(
        (result) => result.gpuRuntimeShouldStartNow,
      ).length,
      publicArtifactCreatedTools: results.filter((result) => result.publicArtifactCreated).length,
      signedUrlCreatedTools: results.filter((result) => result.signedUrlCreated).length,
    },
    booleans: {
      cpuStaticControlledAdapterImplemented: true,
      cpuStaticControlledAdapterSmokeExecuted: true,
      fiveCpuStaticToolsControlledAdapterExecutable: executed.length === 5,
      fiveCpuStaticToolsControlledAdapterExecuted: executed.length === 5,
      fivePrivateOutputCandidatesReady: results.every((result) => Boolean(result.output)),
      localCpuStaticPackageExecutionPerformed: true,
      externalAgentCanExecuteViaMountedRouteNow: false,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      toolExecutionApprovedNow: false,
      browserWebglCanvasRuntimeApprovedNow: false,
      gpuRuntimeApprovedNow: false,
      gpuRuntimeShouldStartNow: false,
      providerRuntimeApprovedNow: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
      runtimeReadyNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
      npmCiFromExistingLockfilePerformedInWorktree: true,
      dependencyInstallPerformedByAdapterScript: false,
      packageLockMutationPerformed: false,
      supabaseMutationPerformed: false,
      gcsUploadPerformed: false,
    },
    nextMilestone:
      'bind controlled CPU/static adapter to private worker queue/claim/dispatch proof, then promote mounted external-beta route for the five-tool cohort',
  }
}

function makeMarkdown(report: ReturnType<typeof summarize>): string {
  const rows = report.results
    .map((result) => {
      const output = result.output
      return `| \`${result.toolId}\` | \`${result.status}\` | \`${result.controlledAdapterExecutedNow}\` | \`${output?.privateArtifactExtension ?? 'n/a'}\` | \`${output?.privateArtifactSha256 ?? 'n/a'}\` | \`${result.externalAgentCanExecuteViaMountedRouteNow}\` |`
    })
    .join('\n')

  return `# AI Graphics External Agent CPU Static Controlled Adapter

Decision: \`${report.decision}\`

Status: \`${report.status}\`

This packet is the first real execution bridge after the proof-heavy gate work. It invokes the five CPU/static tools that already passed Phase 0 evidence through a server-side controlled adapter and records sanitized private-output hashes only. It does not mount external-agent execution and does not write public artifacts.

## Tool Results

| Tool | Status | Controlled adapter executed | Private output type | Private output SHA-256 | Mounted route executable now |
| --- | --- | --- | --- | --- | --- |
${rows}

## Counts

${Object.entries(report.counts).map(([key, value]) => `- \`${key}\`: ${value}`).join('\n')}

## Booleans

${Object.entries(report.booleans).map(([key, value]) => `- \`${key}\`: ${value}`).join('\n')}

## Boundary

The controlled adapter is executable for the five CPU/static tools only: \`${report.tools.join('`, `')}\`. External route execution, worker execution, public artifact creation, signed URLs, browser/WebGL/canvas runtime, GPU runtime, beta, and production all remain blocked until their specific proofs pass.

## Next Milestone

${report.nextMilestone}
`
}

function makePromptResult(report: ReturnType<typeof summarize>): string {
  return `# Prompt AI Graphics External Agent CPU Static Controlled Adapter Results

- Branch: \`codex/rp-ai-graphics-tool-call-readiness-contract\`
- Draft PR: https://github.com/yuzastudio6-cyber/Reedkt/pull/862
- Decision: \`${report.decision}\`
- Controlled adapter executable tools: \`${report.counts.controlledAdapterExecutableTools}\`
- Controlled adapter executed tools: \`${report.counts.controlledAdapterExecutedTools}\`
- External route executable tools now: \`${report.counts.externalAgentRouteExecutableNowTools}\`
- Worker execution approved tools now: \`${report.counts.workerExecutionApprovedNowTools}\`
- GPU runtime starts now: \`${report.counts.gpuRuntimeShouldStartNowTools}\`
- Public artifacts created: \`${report.counts.publicArtifactCreatedTools}\`

## No-Scope

No external mounted route execution, Worker execution, provider/model runtime, browser/WebGL/canvas runtime, GPU runtime, Supabase/GCS mutation, signed URL, public artifact, external beta unlock, production unlock, dependency add/remove, or package-lock mutation was performed. This worktree used \`npm ci\` from the existing lockfile so the packages were actually present locally.

## Next Prompt

\`AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_WRITE_SMOKE_RESULT\`
`
}

function makeImplementationPrompt(report: ReturnType<typeof summarize>): string {
  return `# AI Graphics External Agent CPU Static Controlled Adapter Implementation Record

Implemented a server-side controlled adapter that actually invokes the five CPU/static packages from the existing lockfile install:

${report.results.map((result) => `- \`${result.toolId}\`: ${result.status}, outputHash=\`${result.output?.privateArtifactSha256 ?? 'n/a'}\``).join('\n')}

The mounted external-beta route remains blocked until the private queue/worker proof chain is complete.
`
}

async function main() {
  const results = []
  for (const toolId of AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_CONTROLLED_ADAPTER_TOOL_IDS) {
    results.push(await executeAiGraphicsExternalAgentCpuStaticControlledAdapter(makeRequest(toolId)))
  }
  const report = summarize(results)

  assert(report.counts.controlledAdapterExecutableTools === 5, 'Expected five controlled adapter executable tools')
  assert(report.counts.controlledAdapterExecutedTools === 5, 'Expected five controlled adapter executed tools')
  assert(report.counts.externalAgentRouteExecutableNowTools === 0, 'Mounted route must remain blocked')
  assert(report.counts.workerExecutionApprovedNowTools === 0, 'Worker execution must remain blocked')
  assert(report.counts.gpuRuntimeShouldStartNowTools === 0, 'GPU runtime must not start')
  assert(report.booleans.fivePrivateOutputCandidatesReady === true, 'Expected private output candidates for all five tools')

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
