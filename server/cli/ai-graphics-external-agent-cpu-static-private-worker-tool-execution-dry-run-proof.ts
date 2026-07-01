import fs from 'node:fs'
import {
  AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_TOOL_EXECUTION_DRY_RUN_PROOF_DECISION,
  buildAiGraphicsExternalAgentCpuStaticPrivateWorkerToolExecutionDryRunProof,
} from '../tool-registry/ai-graphics-external-agent-cpu-static-private-worker-tool-execution-dry-run-proof'

const sourceDispatchSmokeProofPath =
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-dispatch-smoke-proof.json'
const outputJsonPath =
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-tool-execution-dry-run-proof.json'
const outputMdPath =
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-tool-execution-dry-run-proof.md'
const promptResultPath =
  'docs/prompt-ai-graphics-external-agent-cpu-static-private-worker-tool-execution-dry-run-proof-results.md'
const implementationPromptPath =
  'docs/implementation-prompts/prompt-ai-graphics-external-agent-cpu-static-private-worker-tool-execution-dry-run-proof.md'

type JsonRecord = Record<string, any>

function readJson(file: string): JsonRecord {
  return JSON.parse(fs.readFileSync(file, 'utf8')) as JsonRecord
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function makeMarkdown(
  report: ReturnType<
    typeof buildAiGraphicsExternalAgentCpuStaticPrivateWorkerToolExecutionDryRunProof
  >,
): string {
  const preparedTools = report.rows
    .filter((row) => row.dryToolExecutionProofPrepared)
    .map((row) => `\`${row.toolId}\``)
    .join(', ')
  const rows = report.rows
    .map(
      (row) =>
        `| \`${row.toolId}\` | \`${row.runtimeTarget}\` | \`${row.toolExecutionDryRunStatus}\` | \`${row.dryToolExecutionProofPrepared}\` | \`${row.adapterPayloadShapeValidated}\` | \`${row.privateOutputManifestContractValidated}\` | \`${row.toolResultSchemaValidated}\` | \`${row.externalAgentCanInvokeAdapterNow}\` | \`${row.toolExecutionApprovedNow}\` | \`${row.gpuRuntimeShouldStartNow}\` | ${row.blocker} |`,
    )
    .join('\n')
  const contractRows = report.rows
    .filter((row) => row.dryRunContract)
    .map((row) => {
      const contract = row.dryRunContract
      return `- \`${row.toolId}\`: adapterDryRun=\`${contract?.adapterInvocationDryRunRef}\`, inputContract=\`${contract?.toolInputContractRef}\`, outputContract=\`${contract?.expectedPrivateOutputContractRef}\`, resultSchema=\`${contract?.expectedToolResultSchemaRef}\`, qaGate=\`${contract?.toolSpecificQaGateRef}\`, manifest=\`${contract?.privateArtifactManifestRef}\``
    })
    .join('\n')

  return `# AI Graphics External Agent CPU Static Private Worker Tool Execution Dry-Run Proof

Decision: \`${report.decision}\`

Status: \`${report.status}\`

This packet prepares exact dry-run tool execution contracts for the five CPU/static tools that already have accepted private worker dispatch smoke proof. It validates adapter payload shape, private output manifest contract, tool result schema contract, and tool-specific QA gate references without invoking an adapter, executing a tool, dispatching a worker, creating artifacts, creating signed URLs, or starting browser/GPU/runtime resources.

## Source Evidence

- Private worker dispatch smoke-proof packet: \`${sourceDispatchSmokeProofPath}\`
- Source dispatch smoke-proof decision: \`${report.sourceDispatchSmokeProofDecision}\`
- Private worker queue: \`${report.queueName}\`
- Builder: \`server/tool-registry/ai-graphics-external-agent-cpu-static-private-worker-tool-execution-dry-run-proof.ts\`
- CLI: \`server/cli/ai-graphics-external-agent-cpu-static-private-worker-tool-execution-dry-run-proof.ts\`

## Dry-Run Result

- Total AI graphics tools covered: \`${report.counts.totalAiGraphicsTools}\`
- Tool execution dry-run proofs prepared: \`${report.counts.toolExecutionDryRunProofPreparedTools}\` tools: ${preparedTools}
- Dry tool execution contracts prepared: \`${report.counts.dryToolExecutionContractsPreparedTools}\`
- Adapter payload shapes validated: \`${report.counts.adapterPayloadShapeValidatedTools}\`
- Private output manifest contracts validated: \`${report.counts.privateOutputManifestContractValidatedTools}\`
- Tool result schemas validated: \`${report.counts.toolResultSchemaValidatedTools}\`
- Source dispatch smoke proof accepted tools: \`${report.counts.sourceDispatchSmokeProofAcceptedTools}\`
- Satori blocked pending approved font fixture: \`${report.counts.satoriBlockedPendingApprovedFontFixtureTools}\`
- Non-CPU/static tools deferred by runtime boundary: \`${report.counts.nonCpuStaticDeferredTools}\`
- External-agent adapter invocations approved now: \`${report.counts.externalAgentCanInvokeAdapterNowTools}\`
- External-agent executable tools now: \`${report.counts.externalAgentExecutableNowTools}\`
- Worker dispatch approved tools now: \`${report.counts.workerDispatchApprovedNowTools}\`
- Tool execution approved tools now: \`${report.counts.toolExecutionApprovedNowTools}\`
- GPU runtime starts now: \`${report.counts.gpuRuntimeShouldStartNowTools}\`

## Dry-Run Contracts

${contractRows}

## Tool Rows

| Tool | Runtime target | Dry-run status | Dry-run proof prepared | Adapter payload validated | Private output manifest validated | Result schema validated | Adapter invocation now | Tool execution now | GPU runtime now | Blocker |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
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

No dependency install, package-lock mutation, backend queue submission, live queue write, worker claim, worker enqueue, worker dispatch, adapter invocation, tool execution, route execution, provider/model runtime, browser/WebGL/canvas runtime, GPU/model runtime, model download/load, media processing, Supabase/GCS mutation, signed URL, public artifact, external beta unlock, or production unlock is approved by this packet.

## Next Milestone

${report.nextMilestone}
`
}

function makePromptResult(
  report: ReturnType<
    typeof buildAiGraphicsExternalAgentCpuStaticPrivateWorkerToolExecutionDryRunProof
  >,
): string {
  return `# Prompt AI Graphics External Agent CPU Static Private Worker Tool Execution Dry-Run Proof Results

- Branch: \`codex/rp-ai-graphics-tool-call-readiness-contract\`
- Draft PR: https://github.com/yuzastudio6-cyber/Reedkt/pull/862
- Draft status: open/draft/CLEAN at the latest recorded push.
- Decision: \`${report.decision}\`
- Tool execution dry-run proofs prepared: \`${report.counts.toolExecutionDryRunProofPreparedTools}\`
- Dry tool execution contracts prepared: \`${report.counts.dryToolExecutionContractsPreparedTools}\`
- Adapter payload shapes validated: \`${report.counts.adapterPayloadShapeValidatedTools}\`
- Private output manifest contracts validated: \`${report.counts.privateOutputManifestContractValidatedTools}\`
- Tool result schemas validated: \`${report.counts.toolResultSchemaValidatedTools}\`
- Satori block: pending approved font fixture proof.
- Non-CPU/static deferred tools: \`${report.counts.nonCpuStaticDeferredTools}\`
- External-agent adapter invocations approved now: \`${report.counts.externalAgentCanInvokeAdapterNowTools}\`
- External-agent executable tools now: \`${report.counts.externalAgentExecutableNowTools}\`
- Worker dispatch approved tools now: \`${report.counts.workerDispatchApprovedNowTools}\`
- Tool execution approved tools now: \`${report.counts.toolExecutionApprovedNowTools}\`
- GPU runtime starts now: \`${report.counts.gpuRuntimeShouldStartNowTools}\`

## Unblock Policy

The executable-by-agent, adapter invocation, live worker dispatch, and tool execution gates remain temporary and fail-closed. They can be lifted tool-by-tool only after controlled private tool execution proof passes for the exact request with accepted approved snapshot, credit reservation, Tool Route, Worker, private artifact manifest, backend queue transport, live queue write, worker claim lease, worker dispatch authorization, idempotency, checkback, fallback, QA, and tool-specific runtime evidence.

## No-Scope

No direct agent execution, Tool Route execution, Worker execution, backend queue write, live worker dispatch, adapter invocation, provider/model runtime, browser/WebGL/canvas runtime, GPU/model runtime, dependency install, package-lock mutation, Supabase/GCS mutation, signed URL, public artifact, external beta unlock, or production unlock is approved.

## Next Prompt

\`AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_CONTROLLED_TOOL_EXECUTION_PROOF\`
`
}

function makeImplementationPrompt(
  report: ReturnType<
    typeof buildAiGraphicsExternalAgentCpuStaticPrivateWorkerToolExecutionDryRunProof
  >,
): string {
  return `# AI Graphics External Agent CPU Static Private Worker Tool Execution Dry-Run Proof Implementation Record

Implemented the private worker tool execution dry-run proof contract from accepted dispatch smoke evidence.

## Accepted Source

- Private worker dispatch smoke-proof packet: \`${sourceDispatchSmokeProofPath}\`

## Result

- \`${report.counts.toolExecutionDryRunProofPreparedTools}\` CPU/static tools have tool execution dry-run contracts prepared.
- \`${report.counts.dryToolExecutionContractsPreparedTools}\` dry tool execution contracts preserve approved plan snapshot fixture refs, credit reservation fixture refs, private artifact manifest refs, queue idempotency keys, dry dispatch idempotency keys, dry tool execution idempotency keys, source dispatch attempt refs, dispatch smoke evidence refs, adapter dry-run refs, tool input contract refs, output contract refs, result schema refs, QA gate refs, and private artifact visibility.
- \`${report.counts.satoriBlockedPendingApprovedFontFixtureTools}\` Satori remains blocked pending approved font fixture proof.
- \`${report.counts.nonCpuStaticDeferredTools}\` browser/GPU/model tools remain deferred by runtime boundary.
- The actual executable-by-agent, adapter invocation, live worker dispatch, and tool execution blocks remain temporary and fail-closed until the controlled private tool execution proof passes.
- All actual execution, live queue, worker dispatch, GPU runtime, external beta, and production gates remain false.

## Draft PR Metadata

- Draft PR: https://github.com/yuzastudio6-cyber/Reedkt/pull/862
- Draft status: open/draft/CLEAN at the latest recorded push.
- Check rollup: empty at the latest recorded push.
`
}

async function main() {
  const source = readJson(sourceDispatchSmokeProofPath)
  const report = buildAiGraphicsExternalAgentCpuStaticPrivateWorkerToolExecutionDryRunProof({
    sourceDispatchSmokeProofReport: source as any,
  })

  assert(
    report.decision ===
      AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_TOOL_EXECUTION_DRY_RUN_PROOF_DECISION,
    'Unexpected private worker tool execution dry-run proof decision',
  )
  assert(
    report.counts.totalAiGraphicsTools === 21,
    'Private worker tool execution dry-run proof must cover all 21 tools',
  )
  assert(
    report.counts.toolExecutionDryRunProofPreparedTools === 5,
    'Expected five tool execution dry-run proofs',
  )
  assert(
    report.counts.dryToolExecutionContractsPreparedTools === 5,
    'Expected five dry tool execution contracts',
  )
  assert(
    report.counts.satoriBlockedPendingApprovedFontFixtureTools === 1,
    'Expected Satori font fixture block',
  )
  assert(
    report.counts.externalAgentCanInvokeAdapterNowTools === 0,
    'No external-agent adapter invocation may be enabled now',
  )
  assert(
    report.counts.toolExecutionApprovedNowTools === 0,
    'No tool execution may be approved now',
  )
  assert(
    report.booleans.sourceDispatchSmokeProofAccepted === true,
    'Source dispatch smoke proof was not accepted',
  )
  assert(
    report.booleans.allFiveCpuStaticToolExecutionDryRunProofsPrepared === true,
    'Five CPU/static tool execution dry-run proofs must be prepared',
  )
  assert(report.booleans.agentCanExecuteToolsNow === false, 'Agent execution must remain false')
  assert(report.booleans.externalAgentCanInvokeAdapterNow === false, 'Adapter invocation must remain false')
  assert(report.booleans.toolExecutionApprovedNow === false, 'Tool execution must remain false')
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
