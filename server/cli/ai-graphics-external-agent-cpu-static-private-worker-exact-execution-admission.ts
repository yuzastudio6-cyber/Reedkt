import fs from 'node:fs'
import {
  AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_EXACT_EXECUTION_ADMISSION_DECISION,
  buildAiGraphicsExternalAgentCpuStaticPrivateWorkerExactExecutionAdmission,
} from '../tool-registry/ai-graphics-external-agent-cpu-static-private-worker-exact-execution-admission'

const sourceControlledProofPath =
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-controlled-tool-execution-proof.json'
const outputJsonPath =
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-exact-execution-admission.json'
const outputMdPath =
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-exact-execution-admission.md'
const promptResultPath =
  'docs/prompt-ai-graphics-external-agent-cpu-static-private-worker-exact-execution-admission-results.md'
const implementationPromptPath =
  'docs/implementation-prompts/prompt-ai-graphics-external-agent-cpu-static-private-worker-exact-execution-admission.md'

type Report = ReturnType<
  typeof buildAiGraphicsExternalAgentCpuStaticPrivateWorkerExactExecutionAdmission
>

function readJson(file: string): Record<string, any> {
  return JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, any>
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function makeMarkdown(report: Report): string {
  const admittedTools = report.rows
    .filter((row) => row.exactExecutionAdmissionReady)
    .map((row) => `\`${row.toolId}\``)
    .join(', ')
  const evidenceRows = report.rows
    .filter((row) => row.exactExecutionAdmissionEvidence)
    .map((row) => {
      const evidence = row.exactExecutionAdmissionEvidence
      return `- \`${row.toolId}\`: exactRequest=\`${evidence?.externalAgentExactRequestEnvelopeRef}\`, admission=\`${evidence?.externalAgentAdmissionDecisionRef}\`, workerSchema=\`${evidence?.workerAcceptedRequestSchemaRef}\`, sourceControlled=\`${evidence?.sourceControlledToolExecutionEvidenceRef}\`, manifest=\`${evidence?.privateArtifactManifestRef}\`, unlockCondition=\`${evidence?.executionUnlockConditionRef}\``
    })
    .join('\n')
  const rows = report.rows
    .map(
      (row) =>
        `| \`${row.toolId}\` | \`${row.runtimeTarget}\` | \`${row.exactExecutionAdmissionStatus}\` | \`${row.exactExecutionAdmissionReady}\` | \`${row.exactRequestEnvelopeAccepted}\` | \`${row.sourceControlledEvidenceAccepted}\` | \`${row.externalAgentCanInvokeAdapterNow}\` | \`${row.workerEnqueueApprovedNow}\` | \`${row.toolExecutionApprovedNow}\` | \`${row.gpuRuntimeShouldStartNow}\` | ${row.blocker} |`,
    )
    .join('\n')

  return `# AI Graphics External Agent CPU Static Private Worker Exact Execution Admission

Decision: \`${report.decision}\`

Status: \`${report.status}\`

This packet admits exact request envelopes for the first five CPU/static tools that already have controlled private-worker proof. It is a request-admission gate only: it does not write queues, invoke adapters, enqueue workers, dispatch workers, execute tools, create artifacts, create signed URLs, start GPU runtime, or unlock external beta/production traffic.

## Source Evidence

- Controlled proof packet: \`${sourceControlledProofPath}\`
- Source controlled proof decision: \`${report.sourceControlledToolExecutionProofDecision}\`
- Private worker queue: \`${report.queueName}\`
- Builder: \`server/tool-registry/ai-graphics-external-agent-cpu-static-private-worker-exact-execution-admission.ts\`
- CLI: \`server/cli/ai-graphics-external-agent-cpu-static-private-worker-exact-execution-admission.ts\`

## Exact Admission Result

- Total AI graphics tools covered: \`${report.counts.totalAiGraphicsTools}\`
- Exact execution admissions ready: \`${report.counts.exactExecutionAdmissionReadyTools}\` tools: ${admittedTools}
- Source controlled proofs accepted: \`${report.counts.sourceControlledToolExecutionProofAcceptedTools}\`
- Exact request envelopes accepted: \`${report.counts.exactRequestEnvelopeAcceptedTools}\`
- Approved plan snapshots accepted: \`${report.counts.approvedPlanSnapshotAcceptedTools}\`
- Credit reservations accepted: \`${report.counts.creditReservationAcceptedTools}\`
- Private artifact manifests accepted: \`${report.counts.privateArtifactManifestAcceptedTools}\`
- Worker accepted request schemas accepted: \`${report.counts.workerAcceptedRequestSchemaAcceptedTools}\`
- Tool-specific QA gates accepted: \`${report.counts.toolSpecificQaGateAcceptedTools}\`
- Satori blocked pending approved font fixture: \`${report.counts.satoriBlockedPendingApprovedFontFixtureTools}\`
- Non-CPU/static tools deferred by runtime boundary: \`${report.counts.nonCpuStaticDeferredTools}\`
- External-agent adapter invocations approved now: \`${report.counts.externalAgentCanInvokeAdapterNowTools}\`
- External-agent executable tools now: \`${report.counts.externalAgentExecutableNowTools}\`
- Tool execution approved tools now: \`${report.counts.toolExecutionApprovedNowTools}\`
- GPU runtime starts now: \`${report.counts.gpuRuntimeShouldStartNowTools}\`

## Exact Admission Evidence Refs

${evidenceRows}

## Tool Rows

| Tool | Runtime target | Exact admission status | Admission ready | Request envelope accepted | Source controlled evidence accepted | Adapter invocation now | Worker enqueue now | Tool execution now | GPU runtime now | Blocker |
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

The block is temporary and intentional. It can be lifted per tool only after the next adapter-invocation and worker-enqueue admission proves the real private worker path for an approved snapshot, credit reservation, private artifact manifest, idempotency key, checkback policy, fallback policy, and tool-specific QA gate.

## Next Milestone

\`${report.nextMilestone}\`
`
}

function makePromptResult(report: Report): string {
  return `# Prompt AI Graphics External Agent CPU Static Private Worker Exact Execution Admission Results

- Branch: \`codex/rp-ai-graphics-tool-call-readiness-contract\`
- Draft PR: https://github.com/yuzastudio6-cyber/Reedkt/pull/862
- Decision: \`${report.decision}\`
- Exact execution admissions ready: \`${report.counts.exactExecutionAdmissionReadyTools}\`
- Exact request envelopes accepted: \`${report.counts.exactRequestEnvelopeAcceptedTools}\`
- Source controlled proofs accepted: \`${report.counts.sourceControlledToolExecutionProofAcceptedTools}\`
- Satori blocked pending approved font fixture: \`${report.counts.satoriBlockedPendingApprovedFontFixtureTools}\`
- Non-CPU/static deferred tools: \`${report.counts.nonCpuStaticDeferredTools}\`
- External-agent executable tools now: \`${report.counts.externalAgentExecutableNowTools}\`
- Adapter invocations approved now: \`${report.counts.externalAgentCanInvokeAdapterNowTools}\`
- Worker enqueue approved now: \`${report.counts.workerEnqueueApprovedNowTools}\`
- Tool execution approved now: \`${report.counts.toolExecutionApprovedNowTools}\`
- GPU runtime starts now: \`${report.counts.gpuRuntimeShouldStartNowTools}\`
- \`agentCanExecuteToolsNow=false\`
- \`externalAgentCanInvokeAdapterNow=false\`
- \`toolExecutionApprovedNow=false\`
- \`gpuRuntimeShouldStartNow=false\`

## Unblock Policy

The executable-by-agent block is not permanent. It remains fail-closed until a per-tool adapter-invocation and worker-enqueue admission proves the real private worker path. GPU/model runtime must remain cold until an accepted GPU worker job is claimed.

## No-Scope

No direct agent execution, Tool Route execution, Worker execution, backend queue write, live worker dispatch, adapter invocation, provider/model runtime, browser/WebGL/canvas runtime, GPU/model runtime, dependency install, package-lock mutation, Supabase/GCS mutation, signed URL, public artifact, external beta unlock, or production unlock is approved.

## Next Prompt

\`AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_ADAPTER_INVOCATION_AND_ENQUEUE_ADMISSION\`
`
}

function makeImplementationPrompt(report: Report): string {
  return `# AI Graphics External Agent CPU Static Private Worker Exact Execution Admission Implementation Record

Implemented the exact request-admission layer for the first CPU/static external-agent private-worker cohort.

Decision: \`${report.decision}\`

## Accepted Source

- Controlled proof packet: \`${sourceControlledProofPath}\`

## Result

- \`${report.counts.exactExecutionAdmissionReadyTools}\` CPU/static tools have exact request-admission envelopes prepared and accepted with provided evidence.
- \`${report.counts.exactRequestEnvelopeAcceptedTools}\` exact request envelopes preserve approved plan snapshot refs, credit reservation refs, private artifact manifest refs, source controlled proof refs, source adapter dry-run refs, worker accepted request schemas, result schemas, QA gates, and idempotency refs.
- \`${report.counts.satoriBlockedPendingApprovedFontFixtureTools}\` Satori remains blocked pending approved font fixture proof.
- \`${report.counts.nonCpuStaticDeferredTools}\` browser/GPU/model tools remain deferred by runtime boundary.
- The actual executable-by-agent, adapter invocation, live queue write, worker enqueue, worker dispatch, and tool execution blocks remain temporary and fail-closed until the next admission gate passes.
- \`agentCanExecuteToolsNow=false\`
- \`externalAgentCanInvokeAdapterNow=false\`
- \`workerEnqueueApprovedNow=false\`
- \`toolExecutionApprovedNow=false\`
- \`gpuRuntimeShouldStartNow=false\`
`
}

async function main() {
  const sourceControlledProof = readJson(sourceControlledProofPath)
  const report = buildAiGraphicsExternalAgentCpuStaticPrivateWorkerExactExecutionAdmission({
    sourceControlledToolExecutionProofReport: sourceControlledProof as any,
  })

  assert(
    report.decision ===
      AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_EXACT_EXECUTION_ADMISSION_DECISION,
    'unexpected exact execution admission decision',
  )
  assert(report.counts.exactExecutionAdmissionReadyTools === 5, 'expected five admissions')
  assert(report.counts.externalAgentExecutableNowTools === 0, 'execution must remain blocked')
  assert(report.booleans.agentCanExecuteToolsNow === false, 'agent execution must remain false')
  assert(report.booleans.externalAgentCanInvokeAdapterNow === false, 'adapter invocation must remain false')
  assert(report.booleans.gpuRuntimeShouldStartNow === false, 'GPU runtime must not start now')

  const shouldWrite = process.argv.includes('--write-records')
  if (shouldWrite) {
    fs.writeFileSync(outputJsonPath, `${JSON.stringify(report, null, 2)}\n`)
    fs.writeFileSync(outputMdPath, makeMarkdown(report))
    fs.writeFileSync(promptResultPath, makePromptResult(report))
    fs.writeFileSync(implementationPromptPath, makeImplementationPrompt(report))
  }

  console.log(JSON.stringify({
    ok: true,
    decision: report.decision,
    acceptedStatus: report.status,
    exactExecutionAdmissionReadyTools: report.counts.exactExecutionAdmissionReadyTools,
    agentCanExecuteToolsNow: report.booleans.agentCanExecuteToolsNow,
    externalAgentCanInvokeAdapterNow: report.booleans.externalAgentCanInvokeAdapterNow,
    toolExecutionApprovedNow: report.booleans.toolExecutionApprovedNow,
    gpuRuntimeShouldStartNow: report.booleans.gpuRuntimeShouldStartNow,
  }, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
