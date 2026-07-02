import fs from 'node:fs'
import {
  AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_CLAIM_AND_DISPATCH_SMOKE_PROOF_DECISION,
  evaluateAiGraphicsExternalAgentCpuStaticPrivateWorkerClaimAndDispatchSmokeProof,
  type AiGraphicsExternalAgentCpuStaticPrivateWorkerClaimAndDispatchSmokeResult,
} from '../tool-registry/ai-graphics-external-agent-cpu-static-private-worker-claim-and-dispatch-smoke-proof'
import type {
  AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokeProofReport,
} from '../tool-registry/ai-graphics-external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-proof'
import type {
  AiGraphicsExternalAgentCpuStaticPrivateWorkerExactExecutionAdmissionReport,
} from '../tool-registry/ai-graphics-external-agent-cpu-static-private-worker-exact-execution-admission'

const defaultSourceQueueWriteSmokeProofPath =
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-proof.json'
const defaultSourceExactExecutionAdmissionPath =
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-exact-execution-admission.json'
const outputJsonPath =
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-claim-and-dispatch-smoke-proof.json'
const outputMdPath =
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-claim-and-dispatch-smoke-proof.md'
const promptResultPath =
  'docs/prompt-ai-graphics-external-agent-cpu-static-private-worker-claim-and-dispatch-smoke-proof-results.md'
const implementationPromptPath =
  'docs/implementation-prompts/prompt-ai-graphics-external-agent-cpu-static-private-worker-claim-and-dispatch-smoke-proof.md'

type Report = ReturnType<
  typeof evaluateAiGraphicsExternalAgentCpuStaticPrivateWorkerClaimAndDispatchSmokeProof
>

function stringFlag(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  if (index === -1) return undefined
  return process.argv[index + 1]
}

function readJsonFile<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T
}

function optionalJsonFlag<T>(flag: string): T | undefined {
  const filePath = stringFlag(flag)
  if (!filePath) return undefined
  return readJsonFile<T>(filePath)
}

function makeMarkdown(report: Report): string {
  const rows = report.rows
    .map((row) =>
      `| \`${row.toolId}\` | \`${row.runtimeTarget}\` | \`${row.workerClaimAndDispatchSmokeProofStatus}\` | \`${row.workerClaimAndDispatchSmokeProofAcceptedWithProvidedEvidence}\` | \`${row.workerClaimsAcceptedWithProvidedEvidence}\` | \`${row.workerDispatchHandoffsAcceptedWithProvidedEvidence}\` | \`${row.workerDispatchLeasesReleasedWithProvidedEvidence}\` | \`${row.toolExecutionApprovedNow}\` | ${row.blocker} |`,
    )
    .join('\n')
  const rejectionReasons = report.rejectionReasons.length > 0
    ? report.rejectionReasons.map((reason) => `- ${reason}`).join('\n')
    : '- none'

  return `# AI Graphics External Agent CPU Static Private Worker Claim And Dispatch Smoke Proof

Decision: \`${report.decision}\`

Status: \`${report.status}\`

This packet validates a saved non-production worker claim and dispatch handoff smoke result for the five CPU/static external-agent private-worker tools. The validator does not run the smoke, mutate Supabase, claim workers, dispatch workers, execute workers, execute tools, start GPU runtime, create signed URLs, or create public artifacts.

## Source Evidence

- Source queue-write smoke proof packet: \`${defaultSourceQueueWriteSmokeProofPath}\`
- Source exact execution admission packet: \`${defaultSourceExactExecutionAdmissionPath}\`
- Source queue-write smoke proof decision: \`${report.sourceQueueWriteSmokeProofDecision}\`
- Source exact execution admission decision: \`${report.sourceExactExecutionAdmissionDecision}\`
- Builder: \`server/tool-registry/ai-graphics-external-agent-cpu-static-private-worker-claim-and-dispatch-smoke-proof.ts\`
- CLI: \`server/cli/ai-graphics-external-agent-cpu-static-private-worker-claim-and-dispatch-smoke-proof.ts\`

## Proof State

- Source queue-write smoke proof accepted tools: \`${report.counts.sourceQueueWriteSmokeProofAcceptedTools}\`
- Saved worker claim and dispatch smoke accepted tools with provided evidence: \`${report.counts.savedWorkerClaimAndDispatchSmokeAcceptedToolsWithProvidedEvidence}\`
- Exact request lineages preserved with provided evidence: \`${report.counts.exactRequestLineagePreservedWithProvidedEvidenceTools}\`
- Saved worker claim and dispatch smoke rejected tools: \`${report.counts.savedWorkerClaimAndDispatchSmokeRejectedTools}\`
- Queue rows read accepted with provided evidence: \`${report.counts.queueRowsReadAcceptedWithProvidedEvidence}\`
- Worker claims accepted with provided evidence: \`${report.counts.workerClaimsAcceptedWithProvidedEvidence}\`
- Worker dispatch handoffs accepted with provided evidence: \`${report.counts.workerDispatchHandoffsAcceptedWithProvidedEvidence}\`
- Worker dispatch leases released with provided evidence: \`${report.counts.workerDispatchLeasesReleasedWithProvidedEvidence}\`
- Queue rows persisted after cleanup: \`${report.counts.queueRowsPersistedAfterCleanup}\`
- Worker executions performed now: \`${report.counts.workerExecutionsPerformedNow}\`
- Tool executions performed now: \`${report.counts.toolExecutionsPerformedNow}\`
- External-agent executable now tools: \`${report.counts.externalAgentExecutableNowTools}\`
- GPU runtime starts now: \`${report.counts.gpuRuntimeShouldStartNowTools}\`

## Operator Runner

- Operator preflight command: \`${report.operatorResultTemplate.operatorPreflightCommand}\`
- Runner command: \`${report.operatorResultTemplate.runnerCommand}\`
- Local-only suggested result path: \`${report.operatorResultTemplate.localOnlySuggestedResultPath}\`
- Validator command: \`${report.operatorResultTemplate.validatorCommand}\`
- Can be used as accepted result without live smoke: \`${report.operatorResultTemplate.canBeUsedAsAcceptedResultWithoutLiveSmoke}\`
- Required environment: \`${report.operatorResultTemplate.requiredEnvironment.join(', ')}\`

## Rejection Reasons

${rejectionReasons}

## Tool Rows

| Tool | Runtime target | Proof status | Accepted evidence | Worker claims | Dispatch handoffs | Leases released | Tool execution now | Blocker |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
${rows}

## Runtime Boundary

- \`agentCanSelectForPlanning=true\`
- \`externalAgentCanInvokeAdapterNow=false\`
- \`externalAgentCanSubmitPrivateWorkerQueueNow=false\`
- \`agentCanExecuteToolsNow=false\`
- \`routeExecutionApprovedNow=false\`
- \`backendQueueSubmissionApprovedNow=false\`
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

No dependency install, package-lock mutation, worker claim/dispatch smoke by this validator, backend queue submission, worker enqueue, live worker claim by this validator, live worker dispatch by this validator, worker execution, tool execution, route execution, provider/model runtime, browser/WebGL/canvas runtime, GPU/model runtime, model download/load, media processing, Supabase/GCS mutation, signed URL, public artifact, external beta unlock, or production unlock is approved.

## Next Milestone

\`${report.nextMilestone}\`
`
}

function makePromptResult(report: Report): string {
  return `# Prompt AI Graphics External Agent CPU Static Private Worker Claim And Dispatch Smoke Proof Results

- Branch: \`codex/rp-ai-graphics-tool-call-readiness-contract\`
- Draft PR: https://github.com/yuzastudio6-cyber/Reedkt/pull/862
- Decision: \`${report.decision}\`
- Status: \`${report.status}\`
- Source queue-write smoke proof accepted tools: \`${report.counts.sourceQueueWriteSmokeProofAcceptedTools}\`
- Saved worker claim and dispatch smoke accepted tools: \`${report.counts.savedWorkerClaimAndDispatchSmokeAcceptedToolsWithProvidedEvidence}\`
- Exact request lineages preserved: \`${report.counts.exactRequestLineagePreservedWithProvidedEvidenceTools}\`
- Worker dispatch handoffs accepted with provided evidence: \`${report.counts.workerDispatchHandoffsAcceptedWithProvidedEvidence}\`
- Worker executions performed now: \`${report.counts.workerExecutionsPerformedNow}\`
- Tool executions performed now: \`${report.counts.toolExecutionsPerformedNow}\`
- External-agent executable now tools: \`${report.counts.externalAgentExecutableNowTools}\`
- GPU runtime starts now: \`${report.counts.gpuRuntimeShouldStartNowTools}\`

## Interpretation

The claim and dispatch smoke proof validator is ready, but the checked-in repository packet remains blocked until the source queue-write smoke proof is accepted, the exact execution admission lineage is accepted, and an operator supplies a saved worker claim and dispatch smoke result. That future result must cover exactly five CPU/static tools, release five dispatch leases, leave zero queue rows after cleanup, preserve exact request lineage for approved snapshot, credit reservation, private artifact manifest, idempotency, worker schema, result schema, and QA gate references, and keep all worker-execution/tool-execution/runtime gates false.

## No-Scope

This command does not run the smoke, mutate Supabase, claim workers, dispatch workers, execute workers, or execute tools. It does not approve direct agent execution, Tool Route execution, Worker execution, backend queue write by the validator, worker claim/dispatch by the validator, provider/model runtime, browser/WebGL/canvas runtime, GPU/model runtime, dependency install, package-lock mutation, Supabase/GCS mutation, signed URL, public artifact, external beta unlock, or production unlock.

## Next Prompt

\`${report.nextMilestone}\`
`
}

function makeImplementationPrompt(report: Report): string {
  return `# AI Graphics External Agent CPU Static Private Worker Claim And Dispatch Smoke Proof Implementation Record

Implemented the saved-result validator for the CPU/static private-worker claim and dispatch smoke gate.

## Source

- Default source queue-write smoke proof packet: \`${defaultSourceQueueWriteSmokeProofPath}\`
- Default source exact execution admission packet: \`${defaultSourceExactExecutionAdmissionPath}\`

## Result

- Decision: \`${report.decision}\`
- Status: \`${report.status}\`
- Source queue-write smoke proof accepted tools: \`${report.counts.sourceQueueWriteSmokeProofAcceptedTools}\`
- Saved worker claim and dispatch smoke accepted tools: \`${report.counts.savedWorkerClaimAndDispatchSmokeAcceptedToolsWithProvidedEvidence}\`
- Exact request lineages preserved: \`${report.counts.exactRequestLineagePreservedWithProvidedEvidenceTools}\`
- External-agent executable now tools: \`${report.counts.externalAgentExecutableNowTools}\`
- GPU runtime starts now: \`${report.counts.gpuRuntimeShouldStartNowTools}\`

The validator is intentionally fail-closed until a saved queue-write smoke proof and saved worker claim/dispatch smoke result are supplied. It validates evidence only and does not perform live Supabase writes, worker claims, worker dispatches, worker execution, or tool execution.

The operator preflight command can be run before the live smoke to verify source packets, required flags, and required non-production environment without creating queue rows, worker claims, dispatch handoffs, worker executions, tool executions, GPU runtime, public artifacts, or signed URLs.
`
}

const sourceQueueWriteSmokeProofPath =
  stringFlag('--source-service-role-queue-write-smoke-proof-packet') ??
  defaultSourceQueueWriteSmokeProofPath
const sourceExactExecutionAdmissionPath =
  stringFlag('--source-exact-execution-admission-packet') ??
  defaultSourceExactExecutionAdmissionPath
const sourceQueueWriteSmokeProof = readJsonFile<
  AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokeProofReport
>(sourceQueueWriteSmokeProofPath)
const sourceExactExecutionAdmission = readJsonFile<
  AiGraphicsExternalAgentCpuStaticPrivateWorkerExactExecutionAdmissionReport
>(sourceExactExecutionAdmissionPath)
const smokeResult = optionalJsonFlag<
  AiGraphicsExternalAgentCpuStaticPrivateWorkerClaimAndDispatchSmokeResult
>('--external-agent-cpu-static-worker-claim-and-dispatch-smoke-result')
const report =
  evaluateAiGraphicsExternalAgentCpuStaticPrivateWorkerClaimAndDispatchSmokeProof({
    sourceQueueWriteSmokeProofPacket: sourceQueueWriteSmokeProof,
    sourceExactExecutionAdmissionPacket: sourceExactExecutionAdmission,
    workerClaimAndDispatchSmokeResult: smokeResult,
  })

if (
  report.decision !==
    AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_CLAIM_AND_DISPATCH_SMOKE_PROOF_DECISION ||
  report.booleans.agentCanExecuteToolsNow !== false ||
  report.booleans.workerClaimPerformedByValidator !== false ||
  report.booleans.workerDispatchPerformedByValidator !== false ||
  report.booleans.toolExecutionPerformed !== false ||
  report.booleans.gpuRuntimeShouldStartNow !== false
) {
  throw new Error('CPU/static worker claim and dispatch smoke proof validator did not preserve required gates.')
}

if (process.argv.includes('--print-only')) {
  console.log(JSON.stringify(report, null, 2))
} else {
  fs.writeFileSync(outputJsonPath, `${JSON.stringify(report, null, 2)}\n`)
  fs.writeFileSync(outputMdPath, makeMarkdown(report))
  fs.writeFileSync(promptResultPath, makePromptResult(report))
  fs.writeFileSync(implementationPromptPath, makeImplementationPrompt(report))
  console.log(JSON.stringify({
    ok: true,
    decision: report.decision,
    status: report.status,
    sourceQueueWriteSmokeProofAcceptedTools:
      report.counts.sourceQueueWriteSmokeProofAcceptedTools,
    sourceExactExecutionAdmissionAccepted:
      report.booleans.sourceExactExecutionAdmissionAccepted,
    savedWorkerClaimAndDispatchSmokeAcceptedToolsWithProvidedEvidence:
      report.counts.savedWorkerClaimAndDispatchSmokeAcceptedToolsWithProvidedEvidence,
    exactRequestLineagePreservedWithProvidedEvidenceTools:
      report.counts.exactRequestLineagePreservedWithProvidedEvidenceTools,
    externalAgentExecutableNowTools: report.counts.externalAgentExecutableNowTools,
    agentCanExecuteToolsNow: report.booleans.agentCanExecuteToolsNow,
    gpuRuntimeShouldStartNow: report.booleans.gpuRuntimeShouldStartNow,
  }, null, 2))
}
