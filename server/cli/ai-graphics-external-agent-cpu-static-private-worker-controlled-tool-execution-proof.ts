import fs from 'node:fs'
import {
  AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_CONTROLLED_TOOL_EXECUTION_PROOF_DECISION,
  buildAiGraphicsExternalAgentCpuStaticPrivateWorkerControlledToolExecutionProof,
} from '../tool-registry/ai-graphics-external-agent-cpu-static-private-worker-controlled-tool-execution-proof'

const sourceToolExecutionDryRunProofPath =
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-tool-execution-dry-run-proof.json'
const sourcePhase0Path =
  'docs/tool-intelligence/ai-graphics/cpu-static-execution-proof-phase-0.json'
const outputJsonPath =
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-controlled-tool-execution-proof.json'
const outputMdPath =
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-controlled-tool-execution-proof.md'
const promptResultPath =
  'docs/prompt-ai-graphics-external-agent-cpu-static-private-worker-controlled-tool-execution-proof-results.md'
const implementationPromptPath =
  'docs/implementation-prompts/prompt-ai-graphics-external-agent-cpu-static-private-worker-controlled-tool-execution-proof.md'

type JsonRecord = Record<string, any>

function readJson(file: string): JsonRecord {
  return JSON.parse(fs.readFileSync(file, 'utf8')) as JsonRecord
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function makeMarkdown(
  report: ReturnType<
    typeof buildAiGraphicsExternalAgentCpuStaticPrivateWorkerControlledToolExecutionProof
  >,
): string {
  const acceptedTools = report.rows
    .filter((row) => row.controlledToolExecutionProofAccepted)
    .map((row) => `\`${row.toolId}\``)
    .join(', ')
  const evidenceRows = report.rows
    .filter((row) => row.controlledToolExecutionEvidence)
    .map((row) => {
      const evidence = row.controlledToolExecutionEvidence
      return `- \`${row.toolId}\`: controlledEvidence=\`${evidence?.controlledToolExecutionEvidenceRef}\`, phase0Evidence=\`${evidence?.phase0LocalArtifactEvidenceRef}\`, inputContract=\`${evidence?.toolInputContractRef}\`, outputContract=\`${evidence?.expectedPrivateOutputContractRef}\`, resultSchema=\`${evidence?.expectedToolResultSchemaRef}\`, qaGate=\`${evidence?.toolSpecificQaGateRef}\`, manifest=\`${evidence?.privateArtifactManifestRef}\``
    })
    .join('\n')
  const rows = report.rows
    .map(
      (row) =>
        `| \`${row.toolId}\` | \`${row.runtimeTarget}\` | \`${row.controlledToolExecutionProofStatus}\` | \`${row.controlledToolExecutionProofAccepted}\` | \`${row.sourceDryRunContractAccepted}\` | \`${row.phase0ExecutionEvidenceAccepted}\` | \`${row.privateOutputManifestAccepted}\` | \`${row.toolResultSchemaAccepted}\` | \`${row.externalAgentCanInvokeAdapterNow}\` | \`${row.toolExecutionApprovedNow}\` | \`${row.gpuRuntimeShouldStartNow}\` | ${row.blocker} |`,
    )
    .join('\n')

  return `# AI Graphics External Agent CPU Static Private Worker Controlled Tool Execution Proof

Decision: \`${report.decision}\`

Status: \`${report.status}\`

This packet binds accepted CPU/static Phase 0 local execution evidence to the exact private-worker tool execution dry-run contracts for five tools. It proves the request/result/output/QA contract can be traced for the external-agent path without rerunning tools, invoking adapters, dispatching workers, writing queues, creating public artifacts, creating signed URLs, or starting browser/GPU/runtime resources.

## Source Evidence

- Tool execution dry-run packet: \`${sourceToolExecutionDryRunProofPath}\`
- Source dry-run decision: \`${report.sourceToolExecutionDryRunProofDecision}\`
- CPU/static Phase 0 proof packet: \`${sourcePhase0Path}\`
- Source Phase 0 decision: \`${report.sourcePhase0Decision}\`
- Private worker queue: \`${report.queueName}\`
- Builder: \`server/tool-registry/ai-graphics-external-agent-cpu-static-private-worker-controlled-tool-execution-proof.ts\`
- CLI: \`server/cli/ai-graphics-external-agent-cpu-static-private-worker-controlled-tool-execution-proof.ts\`

## Controlled Proof Result

- Total AI graphics tools covered: \`${report.counts.totalAiGraphicsTools}\`
- Controlled tool execution proofs accepted: \`${report.counts.controlledToolExecutionProofAcceptedTools}\` tools: ${acceptedTools}
- Source tool execution dry-run proofs prepared: \`${report.counts.sourceToolExecutionDryRunProofPreparedTools}\`
- Source Phase 0 proof-passed tools: \`${report.counts.sourcePhase0ProofPassedTools}\`
- Exact request contracts accepted: \`${report.counts.exactRequestContractsAcceptedTools}\`
- Private output manifests accepted: \`${report.counts.privateOutputManifestAcceptedTools}\`
- Tool result schemas accepted: \`${report.counts.toolResultSchemaAcceptedTools}\`
- Tool-specific QA gates accepted: \`${report.counts.toolSpecificQaGateAcceptedTools}\`
- Phase 0 local artifact evidence accepted: \`${report.counts.phase0LocalArtifactEvidenceAcceptedTools}\`
- Satori blocked pending approved font fixture: \`${report.counts.satoriBlockedPendingApprovedFontFixtureTools}\`
- Non-CPU/static tools deferred by runtime boundary: \`${report.counts.nonCpuStaticDeferredTools}\`
- External-agent adapter invocations approved now: \`${report.counts.externalAgentCanInvokeAdapterNowTools}\`
- External-agent executable tools now: \`${report.counts.externalAgentExecutableNowTools}\`
- Tool execution approved tools now: \`${report.counts.toolExecutionApprovedNowTools}\`
- GPU runtime starts now: \`${report.counts.gpuRuntimeShouldStartNowTools}\`

## Controlled Evidence Refs

${evidenceRows}

## Tool Rows

| Tool | Runtime target | Controlled proof status | Controlled proof accepted | Dry-run contract accepted | Phase 0 evidence accepted | Private manifest accepted | Result schema accepted | Adapter invocation now | Tool execution now | GPU runtime now | Blocker |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
${rows}

## Runtime Boundary

- \`agentCanSelectForPlanning=true\`
- \`externalAgentCanDispatchPrivateWorkerJobNow=false\`
- \`externalAgentCanSubmitPrivateWorkerQueueNow=false\`
- \`externalAgentCanRequestPrivateWorkerHandoffNow=false\`
- \`externalAgentCanInvokeAdapterNow=false\`
- \`agentCanExecuteToolsNow=false\`
- \`routeExecutionApprovedNow=false\`
- \`backendQueueSubmissionApprovedNow=false\`
- \`liveQueueWriteApprovedNow=false\`
- \`workerClaimApprovedNow=false\`
- \`workerDispatchApprovedNow=false\`
- \`workerExecutionApprovedNow=false\`
- \`workerEnqueueApprovedNow=false\`
- \`toolExecutionApprovedNow=false\`
- \`providerRuntimeApprovedNow=false\`
- \`browserWebglCanvasRuntimeApprovedNow=false\`
- \`gpuRuntimeApprovedNow=false\`
- \`gpuRuntimeShouldStartNow=false\`
- \`runtimeReadyNow=false\`
- \`externalBetaReadyNow=false\`
- \`productionReadyNow=false\`

No dependency install, package-lock mutation, backend queue submission, live queue write, worker claim, worker enqueue, worker dispatch, adapter invocation, new tool execution, route execution, provider/model runtime, browser/WebGL/canvas runtime, GPU/model runtime, model download/load, media processing, Supabase/GCS mutation, signed URL, public artifact, external beta unlock, or production unlock is approved by this packet.

## Next Milestone

${report.nextMilestone}
`
}

function makePromptResult(
  report: ReturnType<
    typeof buildAiGraphicsExternalAgentCpuStaticPrivateWorkerControlledToolExecutionProof
  >,
): string {
  return `# Prompt AI Graphics External Agent CPU Static Private Worker Controlled Tool Execution Proof Results

- Branch: \`codex/rp-ai-graphics-tool-call-readiness-contract\`
- Draft PR: https://github.com/yuzastudio6-cyber/Reedkt/pull/862
- Draft status: open/draft/CLEAN at the latest recorded push.
- Decision: \`${report.decision}\`
- Controlled tool execution proofs accepted: \`${report.counts.controlledToolExecutionProofAcceptedTools}\`
- Source tool execution dry-run proofs prepared: \`${report.counts.sourceToolExecutionDryRunProofPreparedTools}\`
- Source Phase 0 proof-passed tools: \`${report.counts.sourcePhase0ProofPassedTools}\`
- Exact request contracts accepted: \`${report.counts.exactRequestContractsAcceptedTools}\`
- Private output manifests accepted: \`${report.counts.privateOutputManifestAcceptedTools}\`
- Tool result schemas accepted: \`${report.counts.toolResultSchemaAcceptedTools}\`
- Tool-specific QA gates accepted: \`${report.counts.toolSpecificQaGateAcceptedTools}\`
- Satori block: pending approved font fixture proof.
- Non-CPU/static deferred tools: \`${report.counts.nonCpuStaticDeferredTools}\`
- External-agent adapter invocations approved now: \`${report.counts.externalAgentCanInvokeAdapterNowTools}\`
- External-agent executable tools now: \`${report.counts.externalAgentExecutableNowTools}\`
- Tool execution approved tools now: \`${report.counts.toolExecutionApprovedNowTools}\`
- GPU runtime starts now: \`${report.counts.gpuRuntimeShouldStartNowTools}\`
- \`agentCanExecuteToolsNow=false\`
- \`externalAgentCanInvokeAdapterNow=false\`
- \`toolExecutionApprovedNow=false\`
- \`gpuRuntimeShouldStartNow=false\`

## Unblock Policy

The executable-by-agent, adapter invocation, live worker dispatch, and tool execution gates remain temporary and fail-closed. They can be lifted tool-by-tool only after exact external-agent execution admission passes for an approved snapshot, credit reservation, Tool Route, Worker, private artifact manifest, backend queue transport, live queue write, worker claim lease, worker dispatch authorization, adapter invocation, idempotency, checkback, fallback, QA, and tool-specific runtime evidence.

## No-Scope

No direct agent execution, Tool Route execution, Worker execution, backend queue write, live worker dispatch, adapter invocation, provider/model runtime, browser/WebGL/canvas runtime, GPU/model runtime, dependency install, package-lock mutation, Supabase/GCS mutation, signed URL, public artifact, external beta unlock, or production unlock is approved.

## Next Prompt

\`AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_EXACT_EXECUTION_ADMISSION\`
`
}

function makeImplementationPrompt(
  report: ReturnType<
    typeof buildAiGraphicsExternalAgentCpuStaticPrivateWorkerControlledToolExecutionProof
  >,
): string {
  return `# AI Graphics External Agent CPU Static Private Worker Controlled Tool Execution Proof Implementation Record

Implemented the controlled private worker tool execution proof binding from accepted dry-run contracts and CPU/static Phase 0 local execution evidence.

Decision: \`${report.decision}\`

## Accepted Sources

- Private worker tool execution dry-run packet: \`${sourceToolExecutionDryRunProofPath}\`
- CPU/static Phase 0 proof packet: \`${sourcePhase0Path}\`

## Result

- \`${report.counts.controlledToolExecutionProofAcceptedTools}\` CPU/static tools have controlled proof accepted from Phase 0 local execution evidence.
- \`${report.counts.exactRequestContractsAcceptedTools}\` exact request contracts preserve approved plan snapshot fixture refs, credit reservation fixture refs, private artifact manifest refs, queue idempotency keys, dry dispatch idempotency keys, dry tool execution idempotency keys, controlled tool execution idempotency keys, source dispatch refs, adapter dry-run refs, input contract refs, output contract refs, result schema refs, QA gate refs, and private artifact visibility.
- \`${report.counts.satoriBlockedPendingApprovedFontFixtureTools}\` Satori remains blocked pending approved font fixture proof.
- \`${report.counts.nonCpuStaticDeferredTools}\` browser/GPU/model tools remain deferred by runtime boundary.
- The actual executable-by-agent, adapter invocation, live worker dispatch, and tool execution blocks remain temporary and fail-closed until exact external-agent execution admission passes.
- All actual execution, live queue, worker dispatch, GPU runtime, external beta, and production gates remain false.
- \`agentCanExecuteToolsNow=false\`
- \`externalAgentCanInvokeAdapterNow=false\`
- \`toolExecutionApprovedNow=false\`
- \`gpuRuntimeShouldStartNow=false\`

## Draft PR Metadata

- Draft PR: https://github.com/yuzastudio6-cyber/Reedkt/pull/862
- Draft status: open/draft/CLEAN at the latest recorded push.
- Check rollup: empty at the latest recorded push.
`
}

async function main() {
  const sourceDryRun = readJson(sourceToolExecutionDryRunProofPath)
  const sourcePhase0 = readJson(sourcePhase0Path)
  const report = buildAiGraphicsExternalAgentCpuStaticPrivateWorkerControlledToolExecutionProof({
    sourceToolExecutionDryRunProofReport: sourceDryRun as any,
    sourcePhase0Report: sourcePhase0 as any,
  })

  assert(
    report.decision ===
      AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_CONTROLLED_TOOL_EXECUTION_PROOF_DECISION,
    'Unexpected private worker controlled tool execution proof decision',
  )
  assert(
    report.counts.totalAiGraphicsTools === 21,
    'Controlled tool execution proof must cover all 21 tools',
  )
  assert(
    report.counts.controlledToolExecutionProofAcceptedTools === 5,
    'Expected five controlled tool execution proofs',
  )
  assert(
    report.counts.exactRequestContractsAcceptedTools === 5,
    'Expected five exact request contracts',
  )
  assert(
    report.counts.satoriBlockedPendingApprovedFontFixtureTools === 1,
    'Expected Satori font fixture block',
  )
  assert(
    report.counts.externalAgentCanInvokeAdapterNowTools === 0,
    'No external-agent adapter invocation may be enabled now',
  )
  assert(report.counts.toolExecutionApprovedNowTools === 0, 'No tool execution may be approved now')
  assert(
    report.counts.gpuRuntimeShouldStartNowTools === 0,
    'GPU runtime must not start now',
  )
  assert(
    report.booleans.sourceToolExecutionDryRunProofAccepted === true,
    'Source tool execution dry-run proof was not accepted',
  )
  assert(
    report.booleans.sourcePhase0ExecutionProofAccepted === true,
    'Source Phase 0 execution proof was not accepted',
  )
  assert(report.booleans.agentCanExecuteToolsNow === false, 'Agent execution must remain false')
  assert(
    report.booleans.externalAgentCanInvokeAdapterNow === false,
    'Adapter invocation must remain false',
  )
  assert(report.booleans.toolExecutionApprovedNow === false, 'Tool execution must remain false')

  if (process.argv.includes('--write-records')) {
    fs.writeFileSync(outputJsonPath, `${JSON.stringify(report, null, 2)}\n`)
    fs.writeFileSync(outputMdPath, makeMarkdown(report))
    fs.writeFileSync(promptResultPath, makePromptResult(report))
    fs.writeFileSync(implementationPromptPath, makeImplementationPrompt(report))
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        decision: report.decision,
        acceptedStatus: report.status,
        controlledToolExecutionProofAcceptedTools:
          report.counts.controlledToolExecutionProofAcceptedTools,
        agentCanExecuteToolsNow: report.booleans.agentCanExecuteToolsNow,
        externalAgentCanInvokeAdapterNow: report.booleans.externalAgentCanInvokeAdapterNow,
        toolExecutionApprovedNow: report.booleans.toolExecutionApprovedNow,
        gpuRuntimeShouldStartNow: report.booleans.gpuRuntimeShouldStartNow,
      },
      null,
      2,
    ),
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
