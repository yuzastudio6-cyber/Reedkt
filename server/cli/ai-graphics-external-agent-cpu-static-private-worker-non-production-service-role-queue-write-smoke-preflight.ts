import fs from 'node:fs'
import {
  AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_NON_PRODUCTION_SERVICE_ROLE_QUEUE_WRITE_SMOKE_PREFLIGHT_DECISION,
  buildAiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokePreflight,
} from '../tool-registry/ai-graphics-external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-preflight'

const sourceLiveAdapterQueueWriteProofPath =
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-live-adapter-invocation-queue-write-proof.json'
const outputJsonPath =
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-preflight.json'
const outputMdPath =
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-preflight.md'
const promptResultPath =
  'docs/prompt-ai-graphics-external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-preflight-results.md'
const implementationPromptPath =
  'docs/implementation-prompts/prompt-ai-graphics-external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-preflight.md'

type Report = ReturnType<
  typeof buildAiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokePreflight
>

function readJson(file: string) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function makeMarkdown(report: Report): string {
  const readyTools = report.rows
    .filter((row) => row.nonProductionServiceRoleQueueWriteSmokePreflightReady)
    .map((row) => `\`${row.toolId}\``)
    .join(', ')
  const evidenceRows = report.rows
    .filter((row) => row.preflightEvidence)
    .map((row) => {
      const evidence = row.preflightEvidence
      return `- \`${row.toolId}\`: queue=\`${evidence?.queueName}\`, sourceProof=\`${evidence?.sourceLiveAdapterQueueWriteProofRef}\`, boundary=\`${evidence?.nonProductionServiceRoleBoundaryRef}\`, telemetry=\`${evidence?.smokeTelemetryRef}\`, cleanup=\`${evidence?.smokeCleanupProofRef}\``
    })
    .join('\n')
  const rows = report.rows
    .map(
      (row) =>
        `| \`${row.toolId}\` | \`${row.runtimeTarget}\` | \`${row.nonProductionServiceRoleQueueWriteSmokePreflightStatus}\` | \`${row.nonProductionServiceRoleQueueWriteSmokePreflightReady}\` | \`${row.serviceRoleQueueWriteSmokeApprovedNow}\` | \`${row.liveQueueWriteApprovedNow}\` | \`${row.workerDispatchApprovedNow}\` | \`${row.toolExecutionApprovedNow}\` | ${row.blocker} |`,
    )
    .join('\n')
  const requiredEnv = report.rows
    .find((row) => row.preflightContract)
    ?.preflightContract?.requiredEnvironment
    .map((value) => `- \`${value}\``)
    .join('\n')
  const requiredFlags = report.rows
    .find((row) => row.preflightContract)
    ?.preflightContract?.requiredFlags
    .map((value) => `- \`${value}\``)
    .join('\n')
  const futureRequirements = report.futureSmokeResultRequirements
    .map((requirement) => `- ${requirement}`)
    .join('\n')

  return `# AI Graphics External Agent CPU Static Private Worker Non-Production Service-Role Queue-Write Smoke Preflight

Decision: \`${report.decision}\`

Status: \`${report.status}\`

This packet prepares the exact non-production service-role queue-write smoke requirements for the five CPU/static private-worker tools. It does not run the smoke, write to Supabase, claim a worker row, dispatch a worker, execute a tool, create a signed URL, create a public artifact, or start GPU/runtime resources.

## Source Evidence

- CPU/static live-adapter queue-service proof: \`${sourceLiveAdapterQueueWriteProofPath}\`
- Source decision: \`${report.sourceLiveAdapterQueueWriteProofDecision}\`
- Builder: \`server/tool-registry/ai-graphics-external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-preflight.ts\`
- CLI: \`server/cli/ai-graphics-external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-preflight.ts\`

## Preflight Result

- Total AI graphics tools covered: \`${report.counts.totalAiGraphicsTools}\`
- CPU/static service-role queue-write smoke preflights ready: \`${report.counts.nonProductionServiceRoleQueueWriteSmokePreflightReadyTools}\` tools: ${readyTools}
- Ready with provided evidence: \`${report.counts.nonProductionServiceRoleQueueWriteSmokePreflightReadyWithProvidedEvidenceTools}\`
- Source live-adapter queue-service proof accepted tools: \`${report.counts.sourceLiveAdapterQueueWriteProofAcceptedTools}\`
- Satori blocked pending approved font fixture: \`${report.counts.satoriBlockedPendingApprovedFontFixtureTools}\`
- Non-CPU/static tools deferred by runtime boundary: \`${report.counts.nonCpuStaticDeferredTools}\`
- Service-role queue-write smoke approved now: \`${report.counts.serviceRoleQueueWriteSmokeApprovedNowTools}\`
- Live queue writes approved now: \`${report.counts.liveQueueWriteApprovedNowTools}\`
- Live queue writes performed now: \`${report.counts.liveQueueWritePerformedNowTools}\`
- Worker claims performed now: \`${report.counts.workerClaimPerformedNowTools}\`
- Worker dispatches approved now: \`${report.counts.workerDispatchApprovedNowTools}\`
- Tool executions approved now: \`${report.counts.toolExecutionApprovedNowTools}\`
- GPU runtime starts now: \`${report.counts.gpuRuntimeShouldStartNowTools}\`

## Required Future Smoke Environment

${requiredEnv}

## Required Future Smoke Flags

${requiredFlags}

## Per-Tool Preflight Evidence

${evidenceRows}

## Tool Rows

| Tool | Runtime target | Preflight status | Preflight ready | Smoke approved now | Live queue write now | Worker dispatch now | Tool execution now | Blocker |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
${rows}

## Future Saved Smoke Result Requirements

${futureRequirements}

## Runtime Boundary

- \`agentCanSelectForPlanning=true\`
- \`externalAgentCanInvokeAdapterNow=false\`
- \`externalAgentCanSubmitPrivateWorkerQueueNow=false\`
- \`agentCanExecuteToolsNow=false\`
- \`routeExecutionApprovedNow=false\`
- \`backendQueueSubmissionApprovedNow=false\`
- \`serviceRoleQueueWriteSmokeApprovedNow=false\`
- \`liveQueueWriteApprovedNow=false\`
- \`workerClaimApprovedNow=false\`
- \`workerDispatchApprovedNow=false\`
- \`workerExecutionApprovedNow=false\`
- \`toolExecutionApprovedNow=false\`
- \`providerRuntimeApprovedNow=false\`
- \`browserWebglCanvasRuntimeApprovedNow=false\`
- \`gpuRuntimeApprovedNow=false\`
- \`gpuRuntimeShouldStartNow=false\`
- \`runtimeReadyNow=false\`
- \`externalBetaReadyNow=false\`
- \`productionReadyNow=false\`

No dependency install, package-lock mutation, service-role queue-write smoke, backend queue submission, live queue write, worker enqueue, worker claim, worker dispatch, tool execution, route execution, provider/model runtime, browser/WebGL/canvas runtime, GPU/model runtime, model download/load, media processing, Supabase/GCS mutation, signed URL, public artifact, external beta unlock, or production unlock is approved by this packet.

## Next Milestone

\`${report.nextMilestone}\`
`
}

function makePromptResult(report: Report): string {
  return `# Prompt AI Graphics External Agent CPU Static Private Worker Non-Production Service-Role Queue-Write Smoke Preflight Results

- Branch: \`codex/rp-ai-graphics-tool-call-readiness-contract\`
- Draft PR: https://github.com/yuzastudio6-cyber/Reedkt/pull/862
- Decision: \`${report.decision}\`
- Status: \`${report.status}\`
- CPU/static preflight-ready tools: \`${report.counts.nonProductionServiceRoleQueueWriteSmokePreflightReadyTools}\`
- Source live-adapter queue-service proof accepted tools: \`${report.counts.sourceLiveAdapterQueueWriteProofAcceptedTools}\`
- Satori block: pending approved font fixture proof.
- Non-CPU/static deferred tools: \`${report.counts.nonCpuStaticDeferredTools}\`
- Service-role queue-write smoke approved now: \`${report.counts.serviceRoleQueueWriteSmokeApprovedNowTools}\`
- Live queue writes performed now: \`${report.counts.liveQueueWritePerformedNowTools}\`
- Worker dispatch approved now: \`${report.counts.workerDispatchApprovedNowTools}\`
- Tool execution approved now: \`${report.counts.toolExecutionApprovedNowTools}\`
- GPU runtime starts now: \`${report.counts.gpuRuntimeShouldStartNowTools}\`

## Interpretation

The five CPU/static tools have the exact private-worker smoke preflight contract prepared. This is not an execution unlock. The next required evidence is a saved non-production service-role queue-write smoke result with cleanup proof, telemetry, rollback refs, and no worker dispatch or tool execution.

## No-Scope

No direct agent execution, Tool Route execution, Worker execution, backend queue write, live queue write, worker claim, worker dispatch, provider/model runtime, browser/WebGL/canvas runtime, GPU/model runtime, dependency install, package-lock mutation, Supabase/GCS mutation, signed URL, public artifact, external beta unlock, or production unlock is approved.

## Next Prompt

\`AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_NON_PRODUCTION_SERVICE_ROLE_QUEUE_WRITE_SMOKE_PROOF\`
`
}

function makeImplementationPrompt(report: Report): string {
  return `# AI Graphics External Agent CPU Static Private Worker Non-Production Service-Role Queue-Write Smoke Preflight Implementation Record

Implemented the CPU/static private-worker non-production service-role queue-write smoke preflight from accepted live-adapter queue-service proof evidence.

## Accepted Source

- CPU/static live-adapter queue-service proof packet: \`${sourceLiveAdapterQueueWriteProofPath}\`

## Result

- Decision: \`${report.decision}\`
- Status: \`${report.status}\`
- \`${report.counts.nonProductionServiceRoleQueueWriteSmokePreflightReadyTools}\` CPU/static tools have exact non-production service-role queue-write smoke preflight contracts prepared.
- \`${report.counts.nonProductionServiceRoleQueueWriteSmokePreflightReadyWithProvidedEvidenceTools}\` preflight rows preserve source adapter invocation, worker enqueue payload, backend queue adapter, service-role boundary, private artifact manifest, telemetry, cleanup, and rollback refs.
- \`${report.counts.satoriBlockedPendingApprovedFontFixtureTools}\` Satori row remains blocked pending approved font fixture proof.
- \`${report.counts.nonCpuStaticDeferredTools}\` browser/GPU/model/animation tools remain deferred by runtime boundary.
- All actual execution, live queue write, worker claim, worker dispatch, GPU runtime, external beta, and production gates remain false.

## Draft PR Metadata

- Draft PR: https://github.com/yuzastudio6-cyber/Reedkt/pull/862
- Draft status: open/draft/CLEAN at the latest recorded push.
- Check rollup: empty at the latest recorded push.
`
}

async function main() {
  const source = readJson(sourceLiveAdapterQueueWriteProofPath)
  const report =
    buildAiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokePreflight({
      sourceLiveAdapterQueueWriteProofReport: source,
    })

  if (
    report.decision !==
      AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_NON_PRODUCTION_SERVICE_ROLE_QUEUE_WRITE_SMOKE_PREFLIGHT_DECISION ||
    report.counts.nonProductionServiceRoleQueueWriteSmokePreflightReadyTools !== 5 ||
    report.booleans.agentCanExecuteToolsNow !== false ||
    report.booleans.liveQueueWritePerformed !== false ||
    report.booleans.toolExecutionPerformed !== false ||
    report.booleans.gpuRuntimeShouldStartNow !== false
  ) {
    throw new Error('CPU/static service-role queue-write smoke preflight did not preserve required gates.')
  }

  fs.writeFileSync(outputJsonPath, `${JSON.stringify(report, null, 2)}\n`)
  fs.writeFileSync(outputMdPath, makeMarkdown(report))
  fs.writeFileSync(promptResultPath, makePromptResult(report))
  fs.writeFileSync(implementationPromptPath, makeImplementationPrompt(report))
  console.log(JSON.stringify({
    ok: true,
    decision: report.decision,
    status: report.status,
    preflightReadyTools:
      report.counts.nonProductionServiceRoleQueueWriteSmokePreflightReadyTools,
    sourceLiveAdapterQueueWriteProofAcceptedTools:
      report.counts.sourceLiveAdapterQueueWriteProofAcceptedTools,
    serviceRoleQueueWriteSmokeApprovedNow:
      report.booleans.serviceRoleQueueWriteSmokeApprovedNow,
    liveQueueWritePerformed: report.booleans.liveQueueWritePerformed,
    agentCanExecuteToolsNow: report.booleans.agentCanExecuteToolsNow,
    gpuRuntimeShouldStartNow: report.booleans.gpuRuntimeShouldStartNow,
  }, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
