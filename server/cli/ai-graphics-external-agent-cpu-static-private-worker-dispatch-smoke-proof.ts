import fs from 'node:fs'
import {
  AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_DISPATCH_SMOKE_PROOF_DECISION,
  buildAiGraphicsExternalAgentCpuStaticPrivateWorkerDispatchSmokeProof,
} from '../tool-registry/ai-graphics-external-agent-cpu-static-private-worker-dispatch-smoke-proof'

const sourceDispatchDryProofPath =
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-dispatch-dry-proof.json'
const outputJsonPath =
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-dispatch-smoke-proof.json'
const outputMdPath =
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-dispatch-smoke-proof.md'
const promptResultPath =
  'docs/prompt-ai-graphics-external-agent-cpu-static-private-worker-dispatch-smoke-proof-results.md'
const implementationPromptPath =
  'docs/implementation-prompts/prompt-ai-graphics-external-agent-cpu-static-private-worker-dispatch-smoke-proof.md'

type JsonRecord = Record<string, any>

function readJson(file: string): JsonRecord {
  return JSON.parse(fs.readFileSync(file, 'utf8')) as JsonRecord
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function makeMarkdown(
  report: ReturnType<typeof buildAiGraphicsExternalAgentCpuStaticPrivateWorkerDispatchSmokeProof>,
): string {
  const acceptedTools = report.rows
    .filter((row) => row.workerDispatchSmokeProofAcceptedWithProvidedEvidence)
    .map((row) => `\`${row.toolId}\``)
    .join(', ')
  const rows = report.rows
    .map(
      (row) =>
        `| \`${row.toolId}\` | \`${row.runtimeTarget}\` | \`${row.dispatchSmokeProofStatus}\` | \`${row.providedDispatchSmokeEvidenceAccepted}\` | \`${row.workerDispatchSmokeCompletedWithProvidedEvidence}\` | \`${row.externalAgentCanDispatchPrivateWorkerJobNow}\` | \`${row.workerDispatchApprovedNow}\` | \`${row.toolExecutionApprovedNow}\` | \`${row.gpuRuntimeShouldStartNow}\` | ${row.blocker} |`,
    )
    .join('\n')
  const evidenceRows = report.rows
    .filter((row) => row.providedDispatchSmokeEvidence)
    .map((row) => {
      const evidence = row.providedDispatchSmokeEvidence
      return `- \`${row.toolId}\`: evidence=\`${evidence?.workerDispatchSmokeEvidenceRef}\`, telemetry=\`${evidence?.workerDispatchSmokeTelemetryRef}\`, leaseAudit=\`${evidence?.workerDispatchSmokeLeaseAuditRef}\`, cleanup=\`${evidence?.workerDispatchSmokeCleanupProofRef}\`, sourceDispatchAttempt=\`${evidence?.sourceWorkerDispatchAttemptRef}\`, manifest=\`${evidence?.privateArtifactManifestRef}\``
    })
    .join('\n')

  return `# AI Graphics External Agent CPU Static Private Worker Dispatch Smoke Proof

Decision: \`${report.decision}\`

Status: \`${report.status}\`

This packet validates saved/provided private worker dispatch smoke evidence for the five CPU/static tools that already passed dispatch dry proof. It does not create a live worker lease, submit a backend queue write, dispatch a worker, invoke an adapter, execute a tool, create an artifact, create a signed URL, or start browser/GPU/runtime resources.

## Source Evidence

- Private worker dispatch dry-proof packet: \`${sourceDispatchDryProofPath}\`
- Source dispatch dry-proof decision: \`${report.sourceDispatchDryProofDecision}\`
- Private worker queue: \`${report.queueName}\`
- Builder: \`server/tool-registry/ai-graphics-external-agent-cpu-static-private-worker-dispatch-smoke-proof.ts\`
- CLI: \`server/cli/ai-graphics-external-agent-cpu-static-private-worker-dispatch-smoke-proof.ts\`

## Smoke Proof Result

- Total AI graphics tools covered: \`${report.counts.totalAiGraphicsTools}\`
- Dispatch smoke proof accepted tools: \`${report.counts.dispatchSmokeProofAcceptedTools}\` tools: ${acceptedTools}
- Dispatch smoke proof accepted with provided evidence: \`${report.counts.dispatchSmokeProofAcceptedWithProvidedEvidenceTools}\`
- Source dispatch dry-proof prepared tools: \`${report.counts.sourceDispatchDryProofPreparedTools}\`
- Satori blocked pending approved font fixture: \`${report.counts.satoriBlockedPendingApprovedFontFixtureTools}\`
- Non-CPU/static tools deferred by runtime boundary: \`${report.counts.nonCpuStaticDeferredTools}\`
- External-agent private worker dispatches approved now: \`${report.counts.externalAgentCanDispatchPrivateWorkerJobNowTools}\`
- External-agent private queue submissions approved now: \`${report.counts.externalAgentCanSubmitPrivateWorkerQueueNowTools}\`
- Backend queue submissions approved now: \`${report.counts.backendQueueSubmissionApprovedNowTools}\`
- Live queue writes approved now: \`${report.counts.liveQueueWriteApprovedNowTools}\`
- Worker claim approved tools now: \`${report.counts.workerClaimApprovedNowTools}\`
- Worker dispatch approved tools now: \`${report.counts.workerDispatchApprovedNowTools}\`
- Tool execution approved tools now: \`${report.counts.toolExecutionApprovedNowTools}\`
- GPU runtime starts now: \`${report.counts.gpuRuntimeShouldStartNowTools}\`

## Provided Smoke Evidence Refs

${evidenceRows}

## Tool Rows

| Tool | Runtime target | Smoke proof status | Evidence accepted | Smoke completed with evidence | Agent worker dispatch now | Worker dispatch now | Tool execution now | GPU runtime now | Blocker |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
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

No dependency install, package-lock mutation, backend queue submission, live queue write, worker claim, worker enqueue, worker dispatch, tool execution, route execution, provider/model runtime, browser/WebGL/canvas runtime, GPU/model runtime, model download/load, media processing, Supabase/GCS mutation, signed URL, public artifact, external beta unlock, or production unlock is approved by this packet.

## Next Milestone

${report.nextMilestone}
`
}

function makePromptResult(
  report: ReturnType<typeof buildAiGraphicsExternalAgentCpuStaticPrivateWorkerDispatchSmokeProof>,
): string {
  return `# Prompt AI Graphics External Agent CPU Static Private Worker Dispatch Smoke Proof Results

- Branch: \`codex/rp-ai-graphics-tool-call-readiness-contract\`
- Draft PR: https://github.com/yuzastudio6-cyber/Reedkt/pull/862
- Draft status: open/draft/CLEAN at the latest recorded push.
- Decision: \`${report.decision}\`
- Dispatch smoke proof accepted tools: \`${report.counts.dispatchSmokeProofAcceptedTools}\`
- Dispatch smoke proof accepted with provided evidence: \`${report.counts.dispatchSmokeProofAcceptedWithProvidedEvidenceTools}\`
- Satori block: pending approved font fixture proof.
- Non-CPU/static deferred tools: \`${report.counts.nonCpuStaticDeferredTools}\`
- External-agent private worker dispatches approved now: \`${report.counts.externalAgentCanDispatchPrivateWorkerJobNowTools}\`
- External-agent private queue submissions approved now: \`${report.counts.externalAgentCanSubmitPrivateWorkerQueueNowTools}\`
- Backend queue submissions approved now: \`${report.counts.backendQueueSubmissionApprovedNowTools}\`
- Live queue writes approved now: \`${report.counts.liveQueueWriteApprovedNowTools}\`
- Worker claim approved tools now: \`${report.counts.workerClaimApprovedNowTools}\`
- Worker dispatch approved tools now: \`${report.counts.workerDispatchApprovedNowTools}\`
- Tool execution approved tools now: \`${report.counts.toolExecutionApprovedNowTools}\`
- GPU runtime starts now: \`${report.counts.gpuRuntimeShouldStartNowTools}\`

## Unblock Policy

The executable-by-agent, live worker dispatch, and tool execution gates remain temporary and fail-closed. They can be lifted only tool-by-tool after tool execution dry-run proof, approved snapshot, credit reservation, Tool Route, Worker, private artifact manifest, backend queue transport, live queue write, worker claim lease, worker dispatch authorization, idempotency, checkback, fallback, QA, and tool-specific runtime proofs are accepted for the exact request.

## No-Scope

No direct agent execution, Tool Route execution, Worker execution, backend queue write, live worker dispatch, provider/model runtime, browser/WebGL/canvas runtime, GPU/model runtime, dependency install, package-lock mutation, Supabase/GCS mutation, signed URL, public artifact, external beta unlock, or production unlock is approved.

## Next Prompt

\`AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_TOOL_EXECUTION_DRY_RUN_PROOF\`
`
}

function makeImplementationPrompt(
  report: ReturnType<typeof buildAiGraphicsExternalAgentCpuStaticPrivateWorkerDispatchSmokeProof>,
): string {
  return `# AI Graphics External Agent CPU Static Private Worker Dispatch Smoke Proof Implementation Record

Implemented the saved/provided private worker dispatch smoke proof contract from accepted CPU/static private worker dispatch dry-proof evidence.

## Accepted Source

- Private worker dispatch dry-proof packet: \`${sourceDispatchDryProofPath}\`

## Result

- \`${report.counts.dispatchSmokeProofAcceptedTools}\` CPU/static tools have private worker dispatch smoke proof accepted with provided evidence.
- \`${report.counts.dispatchSmokeProofAcceptedWithProvidedEvidenceTools}\` provided-evidence refs preserve dispatch evidence, telemetry, lease-audit, cleanup, approved plan snapshot fixture refs, credit reservation fixture refs, private artifact manifest refs, queue idempotency keys, dry dispatch idempotency keys, source dispatch-attempt refs, and private artifact visibility.
- \`${report.counts.satoriBlockedPendingApprovedFontFixtureTools}\` Satori row remains blocked pending approved font fixture proof.
- \`${report.counts.nonCpuStaticDeferredTools}\` browser/GPU tools remain deferred by runtime boundary.
- The actual executable-by-agent, live worker dispatch, and tool execution blocks remain temporary and fail-closed until the per-tool execution gates pass.
- All actual execution, live queue, worker dispatch, GPU runtime, external beta, and production gates remain false.

## Draft PR Metadata

- Draft PR: https://github.com/yuzastudio6-cyber/Reedkt/pull/862
- Draft status: open/draft/CLEAN at the latest recorded push.
- Check rollup: empty at the latest recorded push.
`
}

async function main() {
  const source = readJson(sourceDispatchDryProofPath)
  const report = buildAiGraphicsExternalAgentCpuStaticPrivateWorkerDispatchSmokeProof({
    sourceDispatchDryProofReport: source as any,
  })

  assert(
    report.decision ===
      AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_DISPATCH_SMOKE_PROOF_DECISION,
    'Unexpected private worker dispatch smoke-proof decision',
  )
  assert(
    report.counts.totalAiGraphicsTools === 21,
    'Private worker dispatch smoke proof must cover all 21 tools',
  )
  assert(
    report.counts.dispatchSmokeProofAcceptedTools === 5,
    'Expected five private worker dispatch smoke proofs',
  )
  assert(
    report.counts.dispatchSmokeProofAcceptedWithProvidedEvidenceTools === 5,
    'Expected five private worker dispatch smoke proofs with provided evidence',
  )
  assert(
    report.counts.satoriBlockedPendingApprovedFontFixtureTools === 1,
    'Expected Satori font fixture block',
  )
  assert(
    report.counts.externalAgentCanDispatchPrivateWorkerJobNowTools === 0,
    'No external-agent private worker dispatch may be enabled now',
  )
  assert(
    report.counts.workerDispatchApprovedNowTools === 0,
    'No worker dispatch may be approved now',
  )
  assert(report.counts.toolExecutionApprovedNowTools === 0, 'No tool execution may be approved now')
  assert(
    report.booleans.sourceDispatchDryProofAccepted === true,
    'Source dispatch dry proof was not accepted',
  )
  assert(
    report.booleans.allFiveCpuStaticDispatchSmokeProofsAcceptedWithProvidedEvidence === true,
    'Five CPU/static dispatch smoke proofs must be accepted with provided evidence',
  )
  assert(report.booleans.agentCanExecuteToolsNow === false, 'Agent execution must remain false')
  assert(report.booleans.workerDispatchApprovedNow === false, 'Worker dispatch must remain false')
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
