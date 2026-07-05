import fs from 'node:fs'
import {
  AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_DRY_ADMISSION_DECISION,
  buildAiGraphicsExternalAgentCpuStaticPrivateWorkerQueueDryAdmission,
} from '../tool-registry/ai-graphics-external-agent-cpu-static-private-worker-queue-dry-admission'

const sourceHandoffPath =
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-handoff-admission.json'
const outputJsonPath =
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-queue-dry-admission.json'
const outputMdPath =
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-queue-dry-admission.md'
const promptResultPath =
  'docs/prompt-ai-graphics-external-agent-cpu-static-private-worker-queue-dry-admission-results.md'
const implementationPromptPath =
  'docs/implementation-prompts/prompt-ai-graphics-external-agent-cpu-static-private-worker-queue-dry-admission.md'

type JsonRecord = Record<string, any>

function readJson(file: string): JsonRecord {
  return JSON.parse(fs.readFileSync(file, 'utf8')) as JsonRecord
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function makeMarkdown(
  report: ReturnType<typeof buildAiGraphicsExternalAgentCpuStaticPrivateWorkerQueueDryAdmission>,
): string {
  const admittedTools = report.rows
    .filter((row) => row.privateWorkerQueueDryAdmissionPrepared)
    .map((row) => `\`${row.toolId}\``)
    .join(', ')
  const blockedRows = report.rows
    .filter(
      (row) =>
        row.dryAdmissionStatus !==
        'private_worker_queue_dry_admission_prepared_execution_blocked',
    )
    .map((row) => `- \`${row.toolId}\`: ${row.blocker}`)
    .join('\n')
  const rows = report.rows
    .map(
      (row) =>
        `| \`${row.toolId}\` | \`${row.runtimeTarget}\` | \`${row.dryAdmissionStatus}\` | \`${row.privateWorkerQueueDryAdmissionPrepared}\` | \`${row.dryQueuePayloadContractPrepared}\` | \`${row.externalAgentCanSubmitPrivateWorkerQueueNow}\` | \`${row.liveQueueWriteApprovedNow}\` | \`${row.toolExecutionApprovedNow}\` | ${row.blocker} |`,
    )
    .join('\n')
  const queuePayloads = report.rows
    .filter((row) => row.queuePayloadContract)
    .map((row) => {
      const payload = row.queuePayloadContract
      return `- \`${row.toolId}\`: queue=\`${payload?.queueName}\`, snapshot=\`${payload?.approvedPlanSnapshotRef}\`, reservation=\`${payload?.creditReservationRef}\`, manifest=\`${payload?.privateArtifactManifestRef}\`, idempotency=\`${payload?.idempotencyKey}\``
    })
    .join('\n')
  const liveRequirements = report.dryAdmissionPolicy.requiredBeforeAnyLiveQueueSubmission
    .map((requirement) => `- ${requirement}`)
    .join('\n')

  return `# AI Graphics External Agent CPU Static Private Worker Queue Dry Admission

Decision: \`${report.decision}\`

Status: \`${report.status}\`

This packet advances the five CPU/static private worker-handoff-admitted tools into deterministic private worker queue dry-admission payload contracts. It does not submit any live queue job, enqueue a worker, dispatch a worker, invoke an adapter, execute a tool, or start GPU/runtime resources.

## Source Evidence

- Private worker-handoff admission packet: \`${sourceHandoffPath}\`
- Source handoff decision: \`${report.sourceHandoffDecision}\`
- Builder: \`server/tool-registry/ai-graphics-external-agent-cpu-static-private-worker-queue-dry-admission.ts\`
- CLI: \`server/cli/ai-graphics-external-agent-cpu-static-private-worker-queue-dry-admission.ts\`

## Queue Dry Admission Result

- Total AI graphics tools covered: \`${report.counts.totalAiGraphicsTools}\`
- Private worker queue dry admissions prepared: \`${report.counts.privateWorkerQueueDryAdmissionPreparedTools}\` tools: ${admittedTools}
- Dry queue payload contracts prepared: \`${report.counts.dryQueuePayloadContractsPreparedTools}\`
- CPU/static blocked tools: \`${report.counts.cpuStaticPrivateWorkerQueueDryBlockedTools}\`
- Satori blocked pending approved font fixture: \`${report.counts.satoriBlockedPendingApprovedFontFixtureTools}\`
- Non-CPU/static tools deferred by runtime boundary: \`${report.counts.nonCpuStaticDeferredTools}\`
- External-agent private queue submissions approved now: \`${report.counts.externalAgentCanSubmitPrivateWorkerQueueNowTools}\`
- Backend queue submissions approved now: \`${report.counts.backendQueueSubmissionApprovedNowTools}\`
- Live queue writes approved now: \`${report.counts.liveQueueWriteApprovedNowTools}\`
- Worker enqueue approved tools now: \`${report.counts.workerEnqueueApprovedNowTools}\`
- Worker dispatch approved tools now: \`${report.counts.workerDispatchApprovedNowTools}\`
- Tool execution approved tools now: \`${report.counts.toolExecutionApprovedNowTools}\`
- GPU runtime starts now: \`${report.counts.gpuRuntimeShouldStartNowTools}\`

## Dry Queue Payloads

${queuePayloads}

## Temporary Runtime Block And Live Queue Submission Policy

The actual executable-by-agent and live queue submission gates remain blocked in this packet. This block is intentional and temporary. It can be lifted tool-by-tool only after the exact request has accepted evidence for:

${liveRequirements}

## Tool Rows

| Tool | Runtime target | Dry admission status | Dry admitted | Payload prepared | Agent queue submit now | Live queue write now | Tool execution now | Blocker |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
${rows}

## Blocked Or Deferred Rows

${blockedRows}

## Runtime Boundary

- \`agentCanSelectForPlanning=true\`
- \`externalAgentCanSubmitPrivateWorkerQueueNow=false\`
- \`externalAgentCanRequestPrivateWorkerHandoffNow=false\`
- \`externalAgentCanInvokeAdapterNow=false\`
- \`agentCanExecuteToolsNow=false\`
- \`routeExecutionApprovedNow=false\`
- \`backendQueueSubmissionApprovedNow=false\`
- \`liveQueueWriteApprovedNow=false\`
- \`workerExecutionApprovedNow=false\`
- \`workerEnqueueApprovedNow=false\`
- \`workerDispatchApprovedNow=false\`
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
  report: ReturnType<typeof buildAiGraphicsExternalAgentCpuStaticPrivateWorkerQueueDryAdmission>,
): string {
  return `# Prompt AI Graphics External Agent CPU Static Private Worker Queue Dry Admission Results

- Branch: \`codex/rp-ai-graphics-tool-call-readiness-contract\`
- Draft PR: https://github.com/yuzastudio6-cyber/Reedkt/pull/862
- Draft status: open/draft/CLEAN at the latest recorded push.
- Decision: \`${report.decision}\`
- Private worker queue dry admissions prepared: \`${report.counts.privateWorkerQueueDryAdmissionPreparedTools}\`
- Dry queue payload contracts prepared: \`${report.counts.dryQueuePayloadContractsPreparedTools}\`
- CPU/static blocked tools: \`${report.counts.cpuStaticPrivateWorkerQueueDryBlockedTools}\`
- Satori block: pending approved font fixture proof.
- External-agent private queue submissions approved now: \`${report.counts.externalAgentCanSubmitPrivateWorkerQueueNowTools}\`
- Backend queue submissions approved now: \`${report.counts.backendQueueSubmissionApprovedNowTools}\`
- Live queue writes approved now: \`${report.counts.liveQueueWriteApprovedNowTools}\`
- Worker enqueue approved tools now: \`${report.counts.workerEnqueueApprovedNowTools}\`
- Worker dispatch approved tools now: \`${report.counts.workerDispatchApprovedNowTools}\`
- Tool execution approved tools now: \`${report.counts.toolExecutionApprovedNowTools}\`
- GPU runtime starts now: \`${report.counts.gpuRuntimeShouldStartNowTools}\`

## Unblock Policy

The executable-by-agent and live queue submission gates remain temporary and fail-closed. They can be lifted only tool-by-tool after approved snapshot, credit reservation, Tool Route, Worker, private artifact manifest, backend queue transport, worker claim, idempotency, checkback, fallback, QA, and tool-specific runtime proofs are accepted for the exact request.

## No-Scope

No direct agent execution, Tool Route execution, Worker execution, backend queue write, provider/model runtime, browser/WebGL/canvas runtime, GPU/model runtime, dependency install, package-lock mutation, Supabase/GCS mutation, signed URL, public artifact, external beta unlock, or production unlock is approved.

## Next Prompt

\`AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_CLAIM_DRY_PROOF\`
`
}

function makeImplementationPrompt(
  report: ReturnType<typeof buildAiGraphicsExternalAgentCpuStaticPrivateWorkerQueueDryAdmission>,
): string {
  return `# AI Graphics External Agent CPU Static Private Worker Queue Dry Admission Implementation Record

Implemented the private worker queue dry-admission contract from accepted CPU/static private worker-handoff evidence.

## Accepted Source

- Private worker-handoff admission packet: \`${sourceHandoffPath}\`

## Result

- \`${report.counts.privateWorkerQueueDryAdmissionPreparedTools}\` CPU/static tools have private worker queue dry-admission payload contracts prepared.
- \`${report.counts.dryQueuePayloadContractsPreparedTools}\` dry queue payload contracts include approved plan snapshot fixture refs, credit reservation fixture refs, private artifact manifest refs, request trace refs, checkback refs, fallback refs, QA gate refs, and idempotency keys.
- \`${report.counts.satoriBlockedPendingApprovedFontFixtureTools}\` Satori row remains blocked pending approved font fixture proof.
- \`${report.counts.nonCpuStaticDeferredTools}\` browser/GPU tools remain deferred by runtime boundary.
- The actual executable-by-agent and live queue submission blocks remain temporary and fail-closed until the per-tool execution gates pass.
- All actual execution, live queue, worker dispatch, GPU runtime, external beta, and production gates remain false.

## Draft PR Metadata

- Draft PR: https://github.com/yuzastudio6-cyber/Reedkt/pull/862
- Draft status: open/draft/CLEAN at the latest recorded push.
- Check rollup: empty at the latest recorded push.
`
}

async function main() {
  const source = readJson(sourceHandoffPath)

  const report = buildAiGraphicsExternalAgentCpuStaticPrivateWorkerQueueDryAdmission({
    sourceHandoffDecision: source.decision,
    sourceHandoffStatus: source.status,
    sourceHandoffRows: source.rows,
    sourcePrivateWorkerHandoffAdmissionPreparedTools:
      source.counts?.privateWorkerHandoffAdmissionPreparedTools,
    sourceCpuStaticPrivateWorkerHandoffBlockedTools:
      source.counts?.cpuStaticPrivateWorkerHandoffBlockedTools,
    sourceSatoriBlockedPendingApprovedFontFixtureTools:
      source.counts?.satoriBlockedPendingApprovedFontFixtureTools,
    sourceNonCpuStaticDeferredTools: source.counts?.nonCpuStaticDeferredTools,
    sourceExternalAgentCanRequestPrivateWorkerHandoffNowTools:
      source.counts?.externalAgentCanRequestPrivateWorkerHandoffNowTools,
    sourceWorkerEnqueueApprovedNowTools:
      source.counts?.workerEnqueueApprovedNowTools,
    sourceWorkerDispatchApprovedNowTools:
      source.counts?.workerDispatchApprovedNowTools,
    sourceToolExecutionApprovedNowTools: source.counts?.toolExecutionApprovedNowTools,
    sourceGpuRuntimeShouldStartNowTools: source.counts?.gpuRuntimeShouldStartNowTools,
  })

  assert(
    report.decision ===
      AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_DRY_ADMISSION_DECISION,
    'Unexpected private worker queue dry-admission decision',
  )
  assert(
    report.counts.totalAiGraphicsTools === 21,
    'Private worker queue dry admission must cover all 21 tools',
  )
  assert(
    report.counts.privateWorkerQueueDryAdmissionPreparedTools === 5,
    'Expected five private worker queue dry admissions',
  )
  assert(
    report.counts.dryQueuePayloadContractsPreparedTools === 5,
    'Expected five private worker queue dry payloads',
  )
  assert(
    report.counts.satoriBlockedPendingApprovedFontFixtureTools === 1,
    'Expected Satori font fixture block',
  )
  assert(
    report.counts.externalAgentCanSubmitPrivateWorkerQueueNowTools === 0,
    'No external-agent private worker queue submission may be enabled now',
  )
  assert(
    report.counts.liveQueueWriteApprovedNowTools === 0,
    'No live queue write may be approved now',
  )
  assert(report.counts.toolExecutionApprovedNowTools === 0, 'No tool execution may be approved now')
  assert(
    report.booleans.sourcePrivateWorkerHandoffAdmissionAccepted === true,
    'Source handoff admission was not accepted',
  )
  assert(report.booleans.unblockPolicyDefined === true, 'Unblock policy must be defined')
  assert(report.booleans.agentCanExecuteToolsNow === false, 'Agent execution must remain false')
  assert(report.booleans.liveQueueWriteApprovedNow === false, 'Live queue write must remain false')
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
