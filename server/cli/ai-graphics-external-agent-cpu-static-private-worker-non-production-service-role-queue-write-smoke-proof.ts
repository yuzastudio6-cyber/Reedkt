import fs from 'node:fs'
import {
  AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_NON_PRODUCTION_SERVICE_ROLE_QUEUE_WRITE_SMOKE_PROOF_DECISION,
  evaluateAiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokeProof,
  type AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokeResult,
} from '../tool-registry/ai-graphics-external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-proof'
import type {
  AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokePreflightReport,
} from '../tool-registry/ai-graphics-external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-preflight'

const sourcePreflightPath =
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-preflight.json'
const outputJsonPath =
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-proof.json'
const outputMdPath =
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-proof.md'
const promptResultPath =
  'docs/prompt-ai-graphics-external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-proof-results.md'
const implementationPromptPath =
  'docs/implementation-prompts/prompt-ai-graphics-external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-proof.md'

type Report = ReturnType<
  typeof evaluateAiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokeProof
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
      `| \`${row.toolId}\` | \`${row.runtimeTarget}\` | \`${row.serviceRoleQueueWriteSmokeProofStatus}\` | \`${row.serviceRoleQueueWriteSmokeProofAcceptedWithProvidedEvidence}\` | \`${row.queueRowsWrittenWithProvidedEvidence}\` | \`${row.queueRowsPersistedAfterCleanup}\` | \`${row.serviceRoleQueueWriteSmokeJobBatchId}\` | \`${row.serviceRoleQueueWriteSmokeJobId}\` | \`${row.serviceRoleQueueWriteSmokeIdempotencyPrefix}\` | \`${row.workerDispatchApprovedNow}\` | \`${row.toolExecutionApprovedNow}\` | ${row.blocker} |`,
    )
    .join('\n')
  const rejectionReasons = report.rejectionReasons.length > 0
    ? report.rejectionReasons.map((reason) => `- ${reason}`).join('\n')
    : '- none'
  const operatorRows = report.operatorResultTemplate.perToolQueueRows
    .map((row) =>
      `| \`${row.toolId}\` | \`${row.productionToolId}\` | \`${row.runtimeTarget}\` | \`${row.sourceWorkerEnqueuePayloadRef}\` | \`${row.sourceBackendQueueAdapterRef}\` | \`${row.privateArtifactManifestRef}\` |`,
    )
    .join('\n')
  const requiredFields = report.operatorResultTemplate.requiredResultFields
    .map((field) => `- \`${field}\``)
    .join('\n')

  return `# AI Graphics External Agent CPU Static Private Worker Non-Production Service-Role Queue-Write Smoke Proof

Decision: \`${report.decision}\`

Status: \`${report.status}\`

This packet validates a saved non-production service-role queue-write smoke result for the five CPU/static external-agent private-worker tools. The validator does not run the smoke, write to Supabase, claim or dispatch workers, execute tools, start GPU runtime, create signed URLs, or create public artifacts.

## Source Evidence

- Source preflight packet: \`${sourcePreflightPath}\`
- Source preflight decision: \`${report.sourcePreflightDecision}\`
- Builder: \`server/tool-registry/ai-graphics-external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-proof.ts\`
- CLI: \`server/cli/ai-graphics-external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-proof.ts\`

## Proof State

- Source preflight ready tools: \`${report.counts.sourcePreflightReadyTools}\`
- Saved smoke result accepted tools with provided evidence: \`${report.counts.savedSmokeResultAcceptedToolsWithProvidedEvidence}\`
- Saved smoke result rejected tools: \`${report.counts.savedSmokeResultRejectedTools}\`
- Service-role queue writes accepted with provided evidence: \`${report.counts.serviceRoleQueueWritesAcceptedWithProvidedEvidence}\`
- Service-role queue-write trace accepted with provided evidence: \`${report.counts.serviceRoleQueueWriteSmokeTraceAcceptedWithProvidedEvidence}\`
- Queue rows persisted after cleanup: \`${report.counts.queueRowsPersistedAfterCleanup}\`
- Worker claims created now: \`${report.counts.workerClaimsCreatedNow}\`
- Worker dispatches performed now: \`${report.counts.workerDispatchesPerformedNow}\`
- Tool executions performed now: \`${report.counts.toolExecutionsPerformedNow}\`
- External-agent executable now tools: \`${report.counts.externalAgentExecutableNowTools}\`
- GPU runtime starts now: \`${report.counts.gpuRuntimeShouldStartNowTools}\`

## Rejection Reasons

${rejectionReasons}

## Operator Result Template

- Template mode: \`${report.operatorResultTemplate.templateMode}\`
- Source preflight accepted: \`${report.operatorResultTemplate.sourcePreflightAccepted}\`
- Tools submitted: \`${report.operatorResultTemplate.toolsSubmitted}\`
- Expected queue rows written: \`${report.operatorResultTemplate.expectedQueueRowsWritten}\`
- Expected queue rows cleaned up: \`${report.operatorResultTemplate.expectedQueueRowsCleanedUp}\`
- Expected queue rows persisted after cleanup: \`${report.operatorResultTemplate.expectedQueueRowsPersistedAfterCleanup}\`
- Local-only suggested result path: \`${report.operatorResultTemplate.localOnlySuggestedResultPath}\`
- Operator preflight command: \`${report.operatorResultTemplate.operatorPreflightCommand}\`
- Runner command: \`${report.operatorResultTemplate.runnerCommand}\`
- Validator command: \`${report.operatorResultTemplate.validatorCommand}\`
- Can be used as accepted result without live smoke: \`${report.operatorResultTemplate.canBeUsedAsAcceptedResultWithoutLiveSmoke}\`

| Tool | Production tool | Runtime target | Source enqueue payload | Backend queue adapter | Private manifest |
| --- | --- | --- | --- | --- | --- |
${operatorRows}

Required saved-result fields:

${requiredFields}

## Tool Rows

| Tool | Runtime target | Proof status | Accepted evidence | Queue rows | Persisted after cleanup | Job batch | Job id | Idempotency prefix | Worker dispatch now | Tool execution now | Blocker |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
${rows}

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

No dependency install, package-lock mutation, service-role queue write by this validator, backend queue submission by this validator, worker enqueue, worker claim, worker dispatch, tool execution, route execution, provider/model runtime, browser/WebGL/canvas runtime, GPU/model runtime, model download/load, media processing, Supabase/GCS mutation, signed URL, public artifact, external beta unlock, or production unlock is approved.

## Next Milestone

\`${report.nextMilestone}\`
`
}

function makePromptResult(report: Report): string {
  return `# Prompt AI Graphics External Agent CPU Static Private Worker Non-Production Service-Role Queue-Write Smoke Proof Results

- Branch: \`codex/rp-ai-graphics-tool-call-readiness-contract\`
- Draft PR: https://github.com/yuzastudio6-cyber/Reedkt/pull/862
- Decision: \`${report.decision}\`
- Status: \`${report.status}\`
- Source preflight ready tools: \`${report.counts.sourcePreflightReadyTools}\`
- Saved smoke result accepted tools with provided evidence: \`${report.counts.savedSmokeResultAcceptedToolsWithProvidedEvidence}\`
- Service-role queue-write trace accepted with provided evidence: \`${report.counts.serviceRoleQueueWriteSmokeTraceAcceptedWithProvidedEvidence}\`
- Operator result template rows: \`${report.operatorResultTemplate.perToolQueueRows.length}\`
- Operator result template can be accepted without live smoke: \`${report.operatorResultTemplate.canBeUsedAsAcceptedResultWithoutLiveSmoke}\`
- Operator preflight command: \`${report.operatorResultTemplate.operatorPreflightCommand}\`
- Operator runner command: \`${report.operatorResultTemplate.runnerCommand}\`
- Queue rows persisted after cleanup: \`${report.counts.queueRowsPersistedAfterCleanup}\`
- Worker dispatches performed now: \`${report.counts.workerDispatchesPerformedNow}\`
- Tool executions performed now: \`${report.counts.toolExecutionsPerformedNow}\`
- External-agent executable now tools: \`${report.counts.externalAgentExecutableNowTools}\`
- GPU runtime starts now: \`${report.counts.gpuRuntimeShouldStartNowTools}\`

## Interpretation

The proof validator is ready, but the repository packet remains blocked until an operator supplies a saved non-production service-role queue-write smoke result. That future result must cover exactly five CPU/static tools, leave zero queue rows after cleanup, and preserve all worker/tool/runtime gates as false.

The packet now includes a first-class operator result template so the future non-production smoke has an exact local-only output shape and validator command. The template itself is not accepted as proof and cannot unlock execution without a real smoke result.

## No-Scope

This command does not run the smoke or mutate Supabase. It does not approve direct agent execution, Tool Route execution, Worker execution, backend queue write by the validator, live queue write by the validator, worker claim, worker dispatch, provider/model runtime, browser/WebGL/canvas runtime, GPU/model runtime, dependency install, package-lock mutation, Supabase/GCS mutation, signed URL, public artifact, external beta unlock, or production unlock.

## Next Prompt

\`${report.nextMilestone}\`
`
}

function makeImplementationPrompt(report: Report): string {
  return `# AI Graphics External Agent CPU Static Private Worker Non-Production Service-Role Queue-Write Smoke Proof Implementation Record

Implemented the saved-result validator for the CPU/static private-worker non-production service-role queue-write smoke gate.

## Source

- Preflight packet: \`${sourcePreflightPath}\`

## Result

- Decision: \`${report.decision}\`
- Status: \`${report.status}\`
- Source preflight ready tools: \`${report.counts.sourcePreflightReadyTools}\`
- Saved smoke result accepted tools with provided evidence: \`${report.counts.savedSmokeResultAcceptedToolsWithProvidedEvidence}\`
- Service-role queue-write trace accepted with provided evidence: \`${report.counts.serviceRoleQueueWriteSmokeTraceAcceptedWithProvidedEvidence}\`
- Operator result template rows: \`${report.operatorResultTemplate.perToolQueueRows.length}\`
- Operator result template local-only output path: \`${report.operatorResultTemplate.localOnlySuggestedResultPath}\`
- Operator preflight command: \`${report.operatorResultTemplate.operatorPreflightCommand}\`
- Operator runner command: \`${report.operatorResultTemplate.runnerCommand}\`
- External-agent executable now tools: \`${report.counts.externalAgentExecutableNowTools}\`
- GPU runtime starts now: \`${report.counts.gpuRuntimeShouldStartNowTools}\`

The validator is intentionally fail-closed until a saved non-production smoke result is supplied. It validates evidence only and does not perform live Supabase writes. The operator result template documents the exact local-only result shape required after a real non-production queue-write smoke.
`
}

const sourcePreflight = readJsonFile<
  AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokePreflightReport
>(sourcePreflightPath)
const smokeResult = optionalJsonFlag<
  AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokeResult
>('--external-agent-cpu-static-service-role-queue-write-smoke-result')
const report =
  evaluateAiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokeProof({
    sourcePreflightPacket: sourcePreflight,
    serviceRoleQueueWriteSmokeResult: smokeResult,
  })

if (
  report.decision !==
    AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_NON_PRODUCTION_SERVICE_ROLE_QUEUE_WRITE_SMOKE_PROOF_DECISION ||
  report.booleans.agentCanExecuteToolsNow !== false ||
  report.booleans.liveQueueWritePerformedByValidator !== false ||
  report.booleans.toolExecutionPerformed !== false ||
  report.booleans.gpuRuntimeShouldStartNow !== false
) {
  throw new Error('CPU/static service-role queue-write smoke proof validator did not preserve required gates.')
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
    sourcePreflightReadyTools: report.counts.sourcePreflightReadyTools,
    savedSmokeResultAcceptedToolsWithProvidedEvidence:
      report.counts.savedSmokeResultAcceptedToolsWithProvidedEvidence,
    serviceRoleQueueWriteSmokeTraceAcceptedWithProvidedEvidence:
      report.counts.serviceRoleQueueWriteSmokeTraceAcceptedWithProvidedEvidence,
    externalAgentExecutableNowTools: report.counts.externalAgentExecutableNowTools,
    agentCanExecuteToolsNow: report.booleans.agentCanExecuteToolsNow,
    gpuRuntimeShouldStartNow: report.booleans.gpuRuntimeShouldStartNow,
  }, null, 2))
}
