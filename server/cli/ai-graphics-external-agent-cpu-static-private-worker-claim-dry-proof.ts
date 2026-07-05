import fs from 'node:fs'
import {
  AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_CLAIM_DRY_PROOF_DECISION,
  buildAiGraphicsExternalAgentCpuStaticPrivateWorkerClaimDryProof,
} from '../tool-registry/ai-graphics-external-agent-cpu-static-private-worker-claim-dry-proof'

const sourceQueueDryAdmissionPath =
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-queue-dry-admission.json'
const outputJsonPath =
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-claim-dry-proof.json'
const outputMdPath =
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-claim-dry-proof.md'
const promptResultPath =
  'docs/prompt-ai-graphics-external-agent-cpu-static-private-worker-claim-dry-proof-results.md'
const implementationPromptPath =
  'docs/implementation-prompts/prompt-ai-graphics-external-agent-cpu-static-private-worker-claim-dry-proof.md'

type JsonRecord = Record<string, any>

function readJson(file: string): JsonRecord {
  return JSON.parse(fs.readFileSync(file, 'utf8')) as JsonRecord
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function makeMarkdown(
  report: ReturnType<typeof buildAiGraphicsExternalAgentCpuStaticPrivateWorkerClaimDryProof>,
): string {
  const claimableTools = report.rows
    .filter((row) => row.dryWorkerClaimProofPrepared)
    .map((row) => `\`${row.toolId}\``)
    .join(', ')
  const blockedRows = report.rows
    .filter(
      (row) =>
        row.claimDryProofStatus !==
        'private_worker_claim_dry_proof_prepared_execution_blocked',
    )
    .map((row) => `- \`${row.toolId}\`: ${row.blocker}`)
    .join('\n')
  const rows = report.rows
    .map(
      (row) =>
        `| \`${row.toolId}\` | \`${row.runtimeTarget}\` | \`${row.claimDryProofStatus}\` | \`${row.dryWorkerClaimProofPrepared}\` | \`${row.dryWorkerClaimEnvelopePrepared}\` | \`${row.externalAgentCanClaimPrivateWorkerJobNow}\` | \`${row.workerClaimApprovedNow}\` | \`${row.workerDispatchApprovedNow}\` | \`${row.toolExecutionApprovedNow}\` | ${row.blocker} |`,
    )
    .join('\n')
  const claimEnvelopes = report.rows
    .filter((row) => row.dryClaimContract)
    .map((row) => {
      const claim = row.dryClaimContract
      return `- \`${row.toolId}\`: queue=\`${claim?.queueName}\`, snapshot=\`${claim?.approvedPlanSnapshotRef}\`, reservation=\`${claim?.creditReservationRef}\`, manifest=\`${claim?.privateArtifactManifestRef}\`, queueIdempotency=\`${claim?.queuePayloadIdempotencyKey}\`, claimIdempotency=\`${claim?.dryClaimIdempotencyKey}\`, lease=\`${claim?.workerClaimLeaseRef}\``
    })
    .join('\n')
  const liveRequirements = report.dryClaimPolicy.requiredBeforeAnyLiveWorkerClaim
    .map((requirement) => `- ${requirement}`)
    .join('\n')

  return `# AI Graphics External Agent CPU Static Private Worker Claim Dry Proof

Decision: \`${report.decision}\`

Status: \`${report.status}\`

This packet advances the five CPU/static private worker queue dry-admitted tools into deterministic private worker claim envelopes. It does not claim a live worker job, enqueue a worker, dispatch a worker, invoke an adapter, execute a tool, or start GPU/runtime resources.

## Source Evidence

- Private worker queue dry-admission packet: \`${sourceQueueDryAdmissionPath}\`
- Source queue dry-admission decision: \`${report.sourceQueueDryAdmissionDecision}\`
- Builder: \`server/tool-registry/ai-graphics-external-agent-cpu-static-private-worker-claim-dry-proof.ts\`
- CLI: \`server/cli/ai-graphics-external-agent-cpu-static-private-worker-claim-dry-proof.ts\`

## Claim Dry Proof Result

- Total AI graphics tools covered: \`${report.counts.totalAiGraphicsTools}\`
- Private worker claim dry proofs prepared: \`${report.counts.privateWorkerClaimDryProofPreparedTools}\` tools: ${claimableTools}
- Dry worker claim envelopes prepared: \`${report.counts.dryWorkerClaimEnvelopesPreparedTools}\`
- CPU/static blocked tools: \`${report.counts.cpuStaticPrivateWorkerClaimDryBlockedTools}\`
- Satori blocked pending approved font fixture: \`${report.counts.satoriBlockedPendingApprovedFontFixtureTools}\`
- Non-CPU/static tools deferred by runtime boundary: \`${report.counts.nonCpuStaticDeferredTools}\`
- External-agent private worker claims approved now: \`${report.counts.externalAgentCanClaimPrivateWorkerJobNowTools}\`
- External-agent private queue submissions approved now: \`${report.counts.externalAgentCanSubmitPrivateWorkerQueueNowTools}\`
- Backend queue submissions approved now: \`${report.counts.backendQueueSubmissionApprovedNowTools}\`
- Live queue writes approved now: \`${report.counts.liveQueueWriteApprovedNowTools}\`
- Worker claim approved tools now: \`${report.counts.workerClaimApprovedNowTools}\`
- Worker enqueue approved tools now: \`${report.counts.workerEnqueueApprovedNowTools}\`
- Worker dispatch approved tools now: \`${report.counts.workerDispatchApprovedNowTools}\`
- Tool execution approved tools now: \`${report.counts.toolExecutionApprovedNowTools}\`
- GPU runtime starts now: \`${report.counts.gpuRuntimeShouldStartNowTools}\`

## Dry Claim Envelopes

${claimEnvelopes}

## Temporary Runtime Block And Live Worker Claim Policy

The actual executable-by-agent, live queue submission, live worker claim, worker dispatch, and tool execution gates remain blocked in this packet. This block is intentional and temporary. It can be lifted tool-by-tool only after the exact request has accepted evidence for:

${liveRequirements}

## Tool Rows

| Tool | Runtime target | Claim dry proof status | Claim dry proof prepared | Claim envelope prepared | Agent worker claim now | Worker claim now | Worker dispatch now | Tool execution now | Blocker |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
${rows}

## Blocked Or Deferred Rows

${blockedRows}

## Runtime Boundary

- \`agentCanSelectForPlanning=true\`
- \`externalAgentCanClaimPrivateWorkerJobNow=false\`
- \`externalAgentCanSubmitPrivateWorkerQueueNow=false\`
- \`externalAgentCanRequestPrivateWorkerHandoffNow=false\`
- \`externalAgentCanInvokeAdapterNow=false\`
- \`agentCanExecuteToolsNow=false\`
- \`routeExecutionApprovedNow=false\`
- \`backendQueueSubmissionApprovedNow=false\`
- \`liveQueueWriteApprovedNow=false\`
- \`workerClaimApprovedNow=false\`
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

No dependency install, package-lock mutation, backend queue submission, live queue write, worker claim, worker enqueue, worker dispatch, tool execution, route execution, provider/model runtime, browser/WebGL/canvas runtime, GPU/model runtime, model download/load, media processing, Supabase/GCS mutation, signed URL, public artifact, external beta unlock, or production unlock is approved by this packet.

## Next Milestone

${report.nextMilestone}
`
}

function makePromptResult(
  report: ReturnType<typeof buildAiGraphicsExternalAgentCpuStaticPrivateWorkerClaimDryProof>,
): string {
  return `# Prompt AI Graphics External Agent CPU Static Private Worker Claim Dry Proof Results

- Branch: \`codex/rp-ai-graphics-tool-call-readiness-contract\`
- Draft PR: https://github.com/yuzastudio6-cyber/Reedkt/pull/862
- Draft status: open/draft/CLEAN at the latest recorded push.
- Decision: \`${report.decision}\`
- Private worker claim dry proofs prepared: \`${report.counts.privateWorkerClaimDryProofPreparedTools}\`
- Dry worker claim envelopes prepared: \`${report.counts.dryWorkerClaimEnvelopesPreparedTools}\`
- CPU/static blocked tools: \`${report.counts.cpuStaticPrivateWorkerClaimDryBlockedTools}\`
- Satori block: pending approved font fixture proof.
- External-agent private worker claims approved now: \`${report.counts.externalAgentCanClaimPrivateWorkerJobNowTools}\`
- External-agent private queue submissions approved now: \`${report.counts.externalAgentCanSubmitPrivateWorkerQueueNowTools}\`
- Backend queue submissions approved now: \`${report.counts.backendQueueSubmissionApprovedNowTools}\`
- Live queue writes approved now: \`${report.counts.liveQueueWriteApprovedNowTools}\`
- Worker claim approved tools now: \`${report.counts.workerClaimApprovedNowTools}\`
- Worker dispatch approved tools now: \`${report.counts.workerDispatchApprovedNowTools}\`
- Tool execution approved tools now: \`${report.counts.toolExecutionApprovedNowTools}\`
- GPU runtime starts now: \`${report.counts.gpuRuntimeShouldStartNowTools}\`

## Unblock Policy

The executable-by-agent, live worker claim, worker dispatch, and tool execution gates remain temporary and fail-closed. They can be lifted only tool-by-tool after approved snapshot, credit reservation, Tool Route, Worker, private artifact manifest, backend queue transport, live queue write, worker claim lease, worker dispatch, idempotency, checkback, fallback, QA, and tool-specific runtime proofs are accepted for the exact request.

## No-Scope

No direct agent execution, Tool Route execution, Worker execution, backend queue write, live worker claim, worker dispatch, provider/model runtime, browser/WebGL/canvas runtime, GPU/model runtime, dependency install, package-lock mutation, Supabase/GCS mutation, signed URL, public artifact, external beta unlock, or production unlock is approved.

## Next Prompt

\`AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_DISPATCH_DRY_PROOF\`
`
}

function makeImplementationPrompt(
  report: ReturnType<typeof buildAiGraphicsExternalAgentCpuStaticPrivateWorkerClaimDryProof>,
): string {
  return `# AI Graphics External Agent CPU Static Private Worker Claim Dry Proof Implementation Record

Implemented the private worker claim dry-proof contract from accepted CPU/static private worker queue dry-admission evidence.

## Accepted Source

- Private worker queue dry-admission packet: \`${sourceQueueDryAdmissionPath}\`

## Result

- \`${report.counts.privateWorkerClaimDryProofPreparedTools}\` CPU/static tools have private worker claim dry-proof envelopes prepared.
- \`${report.counts.dryWorkerClaimEnvelopesPreparedTools}\` dry claim envelopes preserve approved plan snapshot fixture refs, credit reservation fixture refs, private artifact manifest refs, queue idempotency keys, dry claim idempotency keys, request trace refs, checkback refs, fallback refs, QA gate refs, and private artifact visibility.
- \`${report.counts.satoriBlockedPendingApprovedFontFixtureTools}\` Satori row remains blocked pending approved font fixture proof.
- \`${report.counts.nonCpuStaticDeferredTools}\` browser/GPU tools remain deferred by runtime boundary.
- The actual executable-by-agent, live worker claim, worker dispatch, and tool execution blocks remain temporary and fail-closed until the per-tool execution gates pass.
- All actual execution, live queue, worker claim, worker dispatch, GPU runtime, external beta, and production gates remain false.

## Draft PR Metadata

- Draft PR: https://github.com/yuzastudio6-cyber/Reedkt/pull/862
- Draft status: open/draft/CLEAN at the latest recorded push.
- Check rollup: empty at the latest recorded push.
`
}

async function main() {
  const source = readJson(sourceQueueDryAdmissionPath)

  const report = buildAiGraphicsExternalAgentCpuStaticPrivateWorkerClaimDryProof({
    sourceQueueDryAdmissionDecision: source.decision,
    sourceQueueDryAdmissionStatus: source.status,
    sourceQueueDryAdmissionRows: source.rows,
    sourcePrivateWorkerQueueDryAdmissionPreparedTools:
      source.counts?.privateWorkerQueueDryAdmissionPreparedTools,
    sourceCpuStaticPrivateWorkerQueueDryReadyTools:
      source.counts?.cpuStaticPrivateWorkerQueueDryReadyTools,
    sourceCpuStaticPrivateWorkerQueueDryBlockedTools:
      source.counts?.cpuStaticPrivateWorkerQueueDryBlockedTools,
    sourceSatoriBlockedPendingApprovedFontFixtureTools:
      source.counts?.satoriBlockedPendingApprovedFontFixtureTools,
    sourceNonCpuStaticDeferredTools: source.counts?.nonCpuStaticDeferredTools,
    sourceDryQueuePayloadContractsPreparedTools:
      source.counts?.dryQueuePayloadContractsPreparedTools,
    sourceExternalAgentCanSubmitPrivateWorkerQueueNowTools:
      source.counts?.externalAgentCanSubmitPrivateWorkerQueueNowTools,
    sourceBackendQueueSubmissionApprovedNowTools:
      source.counts?.backendQueueSubmissionApprovedNowTools,
    sourceLiveQueueWriteApprovedNowTools:
      source.counts?.liveQueueWriteApprovedNowTools,
    sourceWorkerEnqueueApprovedNowTools:
      source.counts?.workerEnqueueApprovedNowTools,
    sourceWorkerDispatchApprovedNowTools:
      source.counts?.workerDispatchApprovedNowTools,
    sourceToolExecutionApprovedNowTools: source.counts?.toolExecutionApprovedNowTools,
    sourceGpuRuntimeShouldStartNowTools: source.counts?.gpuRuntimeShouldStartNowTools,
  })

  assert(
    report.decision ===
      AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_CLAIM_DRY_PROOF_DECISION,
    'Unexpected private worker claim dry-proof decision',
  )
  assert(
    report.counts.totalAiGraphicsTools === 21,
    'Private worker claim dry proof must cover all 21 tools',
  )
  assert(
    report.counts.privateWorkerClaimDryProofPreparedTools === 5,
    'Expected five private worker claim dry proofs',
  )
  assert(
    report.counts.dryWorkerClaimEnvelopesPreparedTools === 5,
    'Expected five private worker dry claim envelopes',
  )
  assert(
    report.counts.satoriBlockedPendingApprovedFontFixtureTools === 1,
    'Expected Satori font fixture block',
  )
  assert(
    report.counts.externalAgentCanClaimPrivateWorkerJobNowTools === 0,
    'No external-agent private worker claim may be enabled now',
  )
  assert(
    report.counts.workerClaimApprovedNowTools === 0,
    'No worker claim may be approved now',
  )
  assert(
    report.counts.workerDispatchApprovedNowTools === 0,
    'No worker dispatch may be approved now',
  )
  assert(report.counts.toolExecutionApprovedNowTools === 0, 'No tool execution may be approved now')
  assert(
    report.booleans.sourceQueueDryAdmissionAccepted === true,
    'Source queue dry admission was not accepted',
  )
  assert(report.booleans.unblockPolicyDefined === true, 'Unblock policy must be defined')
  assert(report.booleans.agentCanExecuteToolsNow === false, 'Agent execution must remain false')
  assert(report.booleans.workerClaimApprovedNow === false, 'Worker claim must remain false')
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
