import fs from 'node:fs'
import {
  AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_ADAPTER_INVOCATION_ENQUEUE_ADMISSION_DECISION,
  buildAiGraphicsExternalAgentCpuStaticPrivateWorkerAdapterInvocationEnqueueAdmission,
} from '../tool-registry/ai-graphics-external-agent-cpu-static-private-worker-adapter-invocation-enqueue-admission'

const defaultSourceExactAdmissionPath =
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-exact-execution-admission.json'
const outputJsonPath =
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-adapter-invocation-enqueue-admission.json'
const outputMdPath =
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-adapter-invocation-enqueue-admission.md'
const promptResultPath =
  'docs/prompt-ai-graphics-external-agent-cpu-static-private-worker-adapter-invocation-enqueue-admission-results.md'
const implementationPromptPath =
  'docs/implementation-prompts/prompt-ai-graphics-external-agent-cpu-static-private-worker-adapter-invocation-enqueue-admission.md'

type Report = ReturnType<
  typeof buildAiGraphicsExternalAgentCpuStaticPrivateWorkerAdapterInvocationEnqueueAdmission
>

function valueAfterFlag(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  return index >= 0 ? process.argv[index + 1] : undefined
}

const sourceExactAdmissionPath =
  valueAfterFlag('--source-exact-execution-admission-packet') ??
  defaultSourceExactAdmissionPath

function readJson(file: string): Record<string, any> {
  return JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, any>
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function makeMarkdown(report: Report): string {
  const admittedTools = report.rows
    .filter((row) => row.adapterInvocationEnqueueAdmissionReady)
    .map((row) => `\`${row.toolId}\``)
    .join(', ') || 'none'
  const evidenceRows = report.rows
    .filter((row) => row.adapterInvocationEnqueueEvidence)
    .map((row) => {
      const evidence = row.adapterInvocationEnqueueEvidence
      const payload = evidence?.productionWorkerJobPayload
      return `- \`${row.toolId}\`: adapterEnvelope=\`${evidence?.adapterInvocationEnvelopeRef}\`, enqueuePayload=\`${evidence?.workerEnqueuePayloadRef}\`, jobId=\`${payload?.jobId}\`, workerType=\`${payload?.workerType}\`, idempotency=\`${payload?.idempotencyKey}\`, queue=\`${evidence?.queueName}\``
    })
    .join('\n')
  const rows = report.rows
    .map(
      (row) =>
        `| \`${row.toolId}\` | \`${row.capabilityId ?? 'n/a'}\` | \`${row.runtimeTarget}\` | \`${row.adapterInvocationEnqueueAdmissionStatus}\` | \`${row.adapterInvocationEnqueueAdmissionReady}\` | \`${row.adapterInvocationEnvelopePrepared}\` | \`${row.workerEnqueuePayloadPrepared}\` | \`${row.productionWorkerJobPayloadAccepted}\` | \`${row.externalAgentCanInvokeAdapterNow}\` | \`${row.workerEnqueueApprovedNow}\` | \`${row.toolExecutionApprovedNow}\` | \`${row.gpuRuntimeShouldStartNow}\` | ${row.blocker} |`,
    )
    .join('\n')

  return `# AI Graphics External Agent CPU Static Private Worker Adapter Invocation And Enqueue Admission

Decision: \`${report.decision}\`

Status: \`${report.status}\`

This packet prepares adapter-invocation envelopes and private worker enqueue payload contracts only when the source exact-admission packet has accepted exact CPU/static request envelopes. With the checked-in blocked source packet, it remains fail-closed. It does not call an adapter, submit a backend queue item, write a live queue, enqueue a worker, dispatch a worker, execute a tool, create artifacts, create signed URLs, start GPU runtime, or unlock external beta/production traffic.

## Source Evidence

- Exact admission packet: \`${sourceExactAdmissionPath}\`
- Source exact admission decision: \`${report.sourceExactExecutionAdmissionDecision}\`
- Private worker queue: \`${report.queueName}\`
- Builder: \`server/tool-registry/ai-graphics-external-agent-cpu-static-private-worker-adapter-invocation-enqueue-admission.ts\`
- CLI: \`server/cli/ai-graphics-external-agent-cpu-static-private-worker-adapter-invocation-enqueue-admission.ts\`

## Admission Result

- Total AI graphics tools covered: \`${report.counts.totalAiGraphicsTools}\`
- Adapter/enqueue admissions ready: \`${report.counts.adapterInvocationEnqueueAdmissionReadyTools}\` tools: ${admittedTools}
- Source exact admissions accepted: \`${report.counts.sourceExactExecutionAdmissionAcceptedTools}\`
- Adapter invocation envelopes prepared: \`${report.counts.adapterInvocationEnvelopePreparedTools}\`
- Worker enqueue payloads prepared: \`${report.counts.workerEnqueuePayloadPreparedTools}\`
- Production worker job payloads accepted: \`${report.counts.productionWorkerJobPayloadAcceptedTools}\`
- Backend queue adapter refs accepted: \`${report.counts.backendQueueAdapterRefAcceptedTools}\`
- Service-role boundaries accepted: \`${report.counts.serviceRoleBoundaryAcceptedTools}\`
- Worker payload schemas accepted: \`${report.counts.workerPayloadSchemaAcceptedTools}\`
- Private storage policies accepted: \`${report.counts.privateStoragePolicyAcceptedTools}\`
- Retry/dead-letter policies accepted: \`${report.counts.retryPolicyAcceptedTools}\` / \`${report.counts.deadLetterPolicyAcceptedTools}\`
- Satori blocked pending approved font fixture: \`${report.counts.satoriBlockedPendingApprovedFontFixtureTools}\`
- Non-CPU/static tools deferred by runtime boundary: \`${report.counts.nonCpuStaticDeferredTools}\`
- External-agent adapter invocations approved now: \`${report.counts.externalAgentCanInvokeAdapterNowTools}\`
- Worker enqueue approved tools now: \`${report.counts.workerEnqueueApprovedNowTools}\`
- External-agent executable tools now: \`${report.counts.externalAgentExecutableNowTools}\`
- Tool execution approved tools now: \`${report.counts.toolExecutionApprovedNowTools}\`
- GPU runtime starts now: \`${report.counts.gpuRuntimeShouldStartNowTools}\`

## Adapter And Enqueue Evidence

${evidenceRows || 'none'}

## Tool Rows

| Tool | Capability | Runtime target | Admission status | Ready | Adapter envelope | Enqueue payload | Worker payload | Adapter now | Enqueue now | Tool execution now | GPU runtime now | Blocker |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
${rows}

## Runtime Boundary

- \`agentCanSelectForPlanning=true\`
- \`externalAgentCanInvokeAdapterNow=false\`
- \`externalAgentCanSubmitPrivateWorkerQueueNow=false\`
- \`agentCanExecuteToolsNow=false\`
- \`routeExecutionApprovedNow=false\`
- \`backendQueueSubmissionApprovedNow=false\`
- \`liveQueueWriteApprovedNow=false\`
- \`workerEnqueueApprovedNow=false\`
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

The executable-by-agent block is still intentional and temporary. This admission gets the five CPU/static tools closer by proving the adapter/enqueue envelope shape; the next proof must exercise the live adapter invocation and queue-write boundary without widening the runtime scope.

## Next Milestone

\`${report.nextMilestone}\`
`
}

function makePromptResult(report: Report): string {
  return `# Prompt AI Graphics External Agent CPU Static Private Worker Adapter Invocation And Enqueue Admission Results

- Branch: \`codex/rp-ai-graphics-tool-call-readiness-contract\`
- Draft PR: https://github.com/yuzastudio6-cyber/Reedkt/pull/862
- Decision: \`${report.decision}\`
- Adapter/enqueue admissions ready: \`${report.counts.adapterInvocationEnqueueAdmissionReadyTools}\`
- Source exact admissions accepted: \`${report.counts.sourceExactExecutionAdmissionAcceptedTools}\`
- Adapter invocation envelopes prepared: \`${report.counts.adapterInvocationEnvelopePreparedTools}\`
- Worker enqueue payloads prepared: \`${report.counts.workerEnqueuePayloadPreparedTools}\`
- Production worker job payloads accepted: \`${report.counts.productionWorkerJobPayloadAcceptedTools}\`
- Satori blocked pending approved font fixture: \`${report.counts.satoriBlockedPendingApprovedFontFixtureTools}\`
- Non-CPU/static deferred tools: \`${report.counts.nonCpuStaticDeferredTools}\`
- External-agent executable tools now: \`${report.counts.externalAgentExecutableNowTools}\`
- Adapter invocations approved now: \`${report.counts.externalAgentCanInvokeAdapterNowTools}\`
- Worker enqueue approved now: \`${report.counts.workerEnqueueApprovedNowTools}\`
- Tool execution approved now: \`${report.counts.toolExecutionApprovedNowTools}\`
- GPU runtime starts now: \`${report.counts.gpuRuntimeShouldStartNowTools}\`
- \`agentCanExecuteToolsNow=false\`
- \`externalAgentCanInvokeAdapterNow=false\`
- \`workerEnqueueApprovedNow=false\`
- \`toolExecutionApprovedNow=false\`
- \`gpuRuntimeShouldStartNow=false\`

## Unblock Policy

The five CPU/static tools now have exact adapter invocation and private worker enqueue contracts prepared, but actual adapter invocation and worker enqueue remain fail-closed. The next gate must prove live adapter invocation and queue-write behavior for the exact request before any tool can be marked executable by an external agent.

## No-Scope

No direct agent execution, Tool Route execution, Worker execution, backend queue write, live queue write, worker enqueue, worker dispatch, adapter invocation, provider/model runtime, browser/WebGL/canvas runtime, GPU/model runtime, dependency install, package-lock mutation, Supabase/GCS mutation, signed URL, public artifact, external beta unlock, or production unlock is approved.

## Next Prompt

\`AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_LIVE_ADAPTER_INVOCATION_AND_QUEUE_WRITE_PROOF\`
`
}

function makeImplementationPrompt(report: Report): string {
  return `# AI Graphics External Agent CPU Static Private Worker Adapter Invocation And Enqueue Admission Implementation Record

Implemented the adapter-invocation and worker-enqueue admission layer for the first CPU/static external-agent private-worker cohort.

Decision: \`${report.decision}\`

## Accepted Source

- Exact admission packet: \`${sourceExactAdmissionPath}\`

## Result

- \`${report.counts.adapterInvocationEnqueueAdmissionReadyTools}\` CPU/static tools have adapter invocation envelopes and private worker enqueue payloads prepared with provided evidence.
- \`${report.counts.productionWorkerJobPayloadAcceptedTools}\` production worker job payloads preserve the exact request, approved snapshot, credit reservation, private artifact manifest, adapter envelope, queue adapter, service-role boundary, retry/dead-letter policy, and idempotency contract.
- \`${report.counts.satoriBlockedPendingApprovedFontFixtureTools}\` Satori remains blocked pending approved font fixture proof.
- \`${report.counts.nonCpuStaticDeferredTools}\` browser/GPU/model tools remain deferred by runtime boundary.
- Actual executable-by-agent, adapter invocation, live queue write, worker enqueue, worker dispatch, and tool execution blocks remain fail-closed until the next live boundary proof passes.
- \`agentCanExecuteToolsNow=false\`
- \`externalAgentCanInvokeAdapterNow=false\`
- \`workerEnqueueApprovedNow=false\`
- \`toolExecutionApprovedNow=false\`
- \`gpuRuntimeShouldStartNow=false\`
`
}

async function main() {
  const sourceExactAdmission = readJson(sourceExactAdmissionPath)
  const report = buildAiGraphicsExternalAgentCpuStaticPrivateWorkerAdapterInvocationEnqueueAdmission({
    sourceExactExecutionAdmissionReport: sourceExactAdmission as any,
  })

  assert(
    report.decision ===
      AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_ADAPTER_INVOCATION_ENQUEUE_ADMISSION_DECISION,
    'unexpected adapter invocation enqueue admission decision',
  )
  const expectedAdmissions =
    report.booleans.sourceExactExecutionAdmissionAccepted === true ? 5 : 0
  assert(
    report.counts.adapterInvocationEnqueueAdmissionReadyTools === expectedAdmissions,
    `expected ${expectedAdmissions} admissions`,
  )
  assert(
    report.counts.productionWorkerJobPayloadAcceptedTools === expectedAdmissions,
    `expected ${expectedAdmissions} worker payloads`,
  )
  assert(report.counts.externalAgentExecutableNowTools === 0, 'execution must remain blocked')
  assert(report.booleans.agentCanExecuteToolsNow === false, 'agent execution must remain false')
  assert(report.booleans.externalAgentCanInvokeAdapterNow === false, 'adapter invocation must remain false')
  assert(report.booleans.workerEnqueueApprovedNow === false, 'worker enqueue must remain false')
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
    adapterInvocationEnqueueAdmissionReadyTools:
      report.counts.adapterInvocationEnqueueAdmissionReadyTools,
    productionWorkerJobPayloadAcceptedTools:
      report.counts.productionWorkerJobPayloadAcceptedTools,
    agentCanExecuteToolsNow: report.booleans.agentCanExecuteToolsNow,
    externalAgentCanInvokeAdapterNow: report.booleans.externalAgentCanInvokeAdapterNow,
    workerEnqueueApprovedNow: report.booleans.workerEnqueueApprovedNow,
    toolExecutionApprovedNow: report.booleans.toolExecutionApprovedNow,
    gpuRuntimeShouldStartNow: report.booleans.gpuRuntimeShouldStartNow,
  }, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
