import fs from 'node:fs'
import {
  AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_HANDOFF_ADMISSION_DECISION,
  buildAiGraphicsExternalAgentCpuStaticPrivateWorkerHandoffAdmission,
} from '../tool-registry/ai-graphics-external-agent-cpu-static-private-worker-handoff-admission'

const sourceAdapterSmokePath =
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-adapter-smoke.json'
const outputJsonPath =
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-handoff-admission.json'
const outputMdPath =
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-handoff-admission.md'
const promptResultPath =
  'docs/prompt-ai-graphics-external-agent-cpu-static-private-worker-handoff-admission-results.md'
const implementationPromptPath =
  'docs/implementation-prompts/prompt-ai-graphics-external-agent-cpu-static-private-worker-handoff-admission.md'

type JsonRecord = Record<string, any>

function readJson(file: string): JsonRecord {
  return JSON.parse(fs.readFileSync(file, 'utf8')) as JsonRecord
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function makeMarkdown(
  report: ReturnType<typeof buildAiGraphicsExternalAgentCpuStaticPrivateWorkerHandoffAdmission>,
): string {
  const admittedTools = report.rows
    .filter((row) => row.privateWorkerHandoffAdmissionPrepared)
    .map((row) => `\`${row.toolId}\``)
    .join(', ')
  const blockedRows = report.rows
    .filter((row) => row.admissionStatus !== 'private_worker_handoff_admission_prepared_execution_blocked')
    .map((row) => `- \`${row.toolId}\`: ${row.blocker}`)
    .join('\n')
  const rows = report.rows
    .map(
      (row) =>
        `| \`${row.toolId}\` | \`${row.runtimeTarget}\` | \`${row.admissionStatus}\` | \`${row.privateWorkerHandoffAdmissionPrepared}\` | \`${row.externalAgentCanRequestPrivateWorkerHandoffNow}\` | \`${row.toolExecutionApprovedNow}\` | ${row.blocker} |`,
    )
    .join('\n')
  const unblockRequirements = report.unblockPolicy.requiredBeforeAnyToolExecution
    .map((requirement) => `- ${requirement}`)
    .join('\n')

  return `# AI Graphics External Agent CPU Static Private Worker Handoff Admission

Decision: \`${report.decision}\`

Status: \`${report.status}\`

This packet advances the five CPU/static adapter-smoke-ready tools into a private worker-handoff admission contract. It does not make the tools executable by the external agent yet. The runtime block is temporary and must be lifted tool-by-tool only after the required execution gates below pass.

## Source Evidence

- CPU/static adapter-smoke proof: \`${sourceAdapterSmokePath}\`
- Source adapter-smoke decision: \`${report.sourceAdapterSmokeDecision}\`
- Builder: \`server/tool-registry/ai-graphics-external-agent-cpu-static-private-worker-handoff-admission.ts\`
- CLI: \`server/cli/ai-graphics-external-agent-cpu-static-private-worker-handoff-admission.ts\`

## Admission Result

- Total AI graphics tools covered: \`${report.counts.totalAiGraphicsTools}\`
- Private worker-handoff admissions prepared: \`${report.counts.privateWorkerHandoffAdmissionPreparedTools}\` tools: ${admittedTools}
- CPU/static blocked tools: \`${report.counts.cpuStaticPrivateWorkerHandoffBlockedTools}\`
- Satori blocked pending approved font fixture: \`${report.counts.satoriBlockedPendingApprovedFontFixtureTools}\`
- Non-CPU/static tools deferred by runtime boundary: \`${report.counts.nonCpuStaticDeferredTools}\`
- External-agent private handoff request tools now: \`${report.counts.externalAgentCanRequestPrivateWorkerHandoffNowTools}\`
- Worker enqueue approved tools now: \`${report.counts.workerEnqueueApprovedNowTools}\`
- Worker dispatch approved tools now: \`${report.counts.workerDispatchApprovedNowTools}\`
- Tool execution approved tools now: \`${report.counts.toolExecutionApprovedNowTools}\`
- GPU runtime starts now: \`${report.counts.gpuRuntimeShouldStartNowTools}\`

## Temporary Runtime Block And Unblock Policy

The actual executable-by-agent gate remains blocked in this packet. It is not permanently blocked; it is intentionally fail-closed until a later gate proves the following items for the exact tool request:

${unblockRequirements}

## Tool Rows

| Tool | Runtime target | Admission status | Handoff admission prepared | Agent handoff request now | Tool execution now | Blocker |
| --- | --- | --- | --- | --- | --- | --- |
${rows}

## Blocked Or Deferred Rows

${blockedRows}

## Runtime Boundary

- \`agentCanSelectForPlanning=true\`
- \`externalAgentCanRequestPrivateWorkerHandoffNow=false\`
- \`externalAgentCanInvokeAdapterNow=false\`
- \`agentCanExecuteToolsNow=false\`
- \`routeExecutionApprovedNow=false\`
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
  report: ReturnType<typeof buildAiGraphicsExternalAgentCpuStaticPrivateWorkerHandoffAdmission>,
): string {
  return `# Prompt AI Graphics External Agent CPU Static Private Worker Handoff Admission Results

- Branch: \`codex/rp-ai-graphics-tool-call-readiness-contract\`
- Draft PR: https://github.com/yuzastudio6-cyber/Reedkt/pull/862
- Draft status: open/draft/CLEAN at the latest recorded push.
- Decision: \`${report.decision}\`
- Private worker-handoff admissions prepared: \`${report.counts.privateWorkerHandoffAdmissionPreparedTools}\`
- CPU/static blocked tools: \`${report.counts.cpuStaticPrivateWorkerHandoffBlockedTools}\`
- Satori block: pending approved font fixture proof.
- External-agent private handoff request tools now: \`${report.counts.externalAgentCanRequestPrivateWorkerHandoffNowTools}\`
- Worker enqueue approved tools now: \`${report.counts.workerEnqueueApprovedNowTools}\`
- Worker dispatch approved tools now: \`${report.counts.workerDispatchApprovedNowTools}\`
- Tool execution approved tools now: \`${report.counts.toolExecutionApprovedNowTools}\`
- GPU runtime starts now: \`${report.counts.gpuRuntimeShouldStartNowTools}\`

## Unblock Policy

The executable-by-agent block is temporary. It can be lifted only tool-by-tool after approved snapshot, credit reservation, Tool Route, Worker, private artifact manifest, queue, worker claim, idempotency, checkback, fallback, QA, and tool-specific runtime proofs are accepted for the exact request.

## No-Scope

No direct agent execution, Tool Route execution, Worker execution, provider/model runtime, browser/WebGL/canvas runtime, GPU/model runtime, dependency install, package-lock mutation, Supabase/GCS mutation, signed URL, public artifact, external beta unlock, or production unlock is approved.

## Next Prompt

\`AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_DRY_ADMISSION\`
`
}

function makeImplementationPrompt(
  report: ReturnType<typeof buildAiGraphicsExternalAgentCpuStaticPrivateWorkerHandoffAdmission>,
): string {
  return `# AI Graphics External Agent CPU Static Private Worker Handoff Admission Implementation Record

Implemented the private worker-handoff admission contract from accepted CPU/static adapter-smoke evidence.

## Accepted Source

- CPU/static adapter-smoke proof: \`${sourceAdapterSmokePath}\`

## Result

- \`${report.counts.privateWorkerHandoffAdmissionPreparedTools}\` CPU/static tools have private worker-handoff admission contracts prepared.
- \`${report.counts.satoriBlockedPendingApprovedFontFixtureTools}\` Satori row remains blocked pending approved font fixture proof.
- \`${report.counts.nonCpuStaticDeferredTools}\` browser/GPU tools remain deferred by runtime boundary.
- The actual executable-by-agent block remains temporary and fail-closed until the per-tool execution gates pass.
- All actual execution gates remain false.

## Draft PR Metadata

- Draft PR: https://github.com/yuzastudio6-cyber/Reedkt/pull/862
- Draft status: open/draft/CLEAN at the latest recorded push.
- Check rollup: empty at the latest recorded push.
`
}

async function main() {
  const source = readJson(sourceAdapterSmokePath)

  const report = buildAiGraphicsExternalAgentCpuStaticPrivateWorkerHandoffAdmission({
    sourceAdapterSmokeDecision: source.decision,
    sourceAdapterSmokeStatus: source.status,
    sourceAdapterSmokeRows: source.rows,
    sourceAdapterSmokeReadyTools: source.counts?.cpuStaticAdapterSmokeReadyTools,
    sourceAdapterSmokeBlockedTools: source.counts?.cpuStaticAdapterSmokeBlockedTools,
    sourceSatoriBlockedPendingApprovedFontFixtureTools:
      source.counts?.satoriBlockedPendingApprovedFontFixtureTools,
    sourceNonCpuStaticDeferredTools: source.counts?.nonCpuStaticDeferredTools,
    sourceExternalAgentCanInvokeAdapterNowTools:
      source.counts?.externalAgentCanInvokeAdapterNowTools,
    sourceToolExecutionApprovedNowTools: source.counts?.toolExecutionApprovedNowTools,
    sourceGpuRuntimeShouldStartNowTools: source.counts?.gpuRuntimeShouldStartNowTools,
  })

  assert(
    report.decision ===
      AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_HANDOFF_ADMISSION_DECISION,
    'Unexpected private worker handoff admission decision',
  )
  assert(report.counts.totalAiGraphicsTools === 21, 'Private worker handoff admission must cover all 21 tools')
  assert(
    report.counts.privateWorkerHandoffAdmissionPreparedTools === 5,
    'Expected five private worker handoff admissions',
  )
  assert(
    report.counts.satoriBlockedPendingApprovedFontFixtureTools === 1,
    'Expected Satori font fixture block',
  )
  assert(
    report.counts.externalAgentCanRequestPrivateWorkerHandoffNowTools === 0,
    'No external-agent private worker handoff request may be enabled now',
  )
  assert(report.counts.toolExecutionApprovedNowTools === 0, 'No tool execution may be approved now')
  assert(report.booleans.sourceCpuStaticAdapterSmokeAccepted === true, 'Source adapter smoke was not accepted')
  assert(report.booleans.unblockPolicyDefined === true, 'Unblock policy must be defined')
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
