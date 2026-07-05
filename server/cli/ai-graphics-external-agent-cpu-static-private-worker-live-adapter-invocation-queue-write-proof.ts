import fs from 'node:fs'
import { loadRuntimeEnv } from '../config/env'
import {
  createAiGraphicsToolRuntimeQueueService,
  type AiGraphicsToolRuntimeQueueJobInput,
} from '../services/ai-graphics-tool-runtime-queue-service'
import {
  AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_LIVE_ADAPTER_INVOCATION_QUEUE_WRITE_PROOF_DECISION,
  buildAiGraphicsExternalAgentCpuStaticPrivateWorkerLiveAdapterInvocationQueueWriteProof,
  type AiGraphicsExternalAgentCpuStaticPrivateWorkerQueueServiceProof,
  type AiGraphicsExternalAgentCpuStaticPrivateWorkerQueueServiceProofJob,
} from '../tool-registry/ai-graphics-external-agent-cpu-static-private-worker-live-adapter-invocation-queue-write-proof'
import type { AiGraphicsCanonicalToolId } from '../tool-registry/ai-graphics-tool-call-readiness'
import type { ProductionToolId } from '../tool-registry/production-tool-types'

const sourceAdmissionPath =
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-adapter-invocation-enqueue-admission.json'
const outputJsonPath =
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-live-adapter-invocation-queue-write-proof.json'
const outputMdPath =
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-live-adapter-invocation-queue-write-proof.md'
const promptResultPath =
  'docs/prompt-ai-graphics-external-agent-cpu-static-private-worker-live-adapter-invocation-queue-write-proof-results.md'
const implementationPromptPath =
  'docs/implementation-prompts/prompt-ai-graphics-external-agent-cpu-static-private-worker-live-adapter-invocation-queue-write-proof.md'

const proofTools: AiGraphicsCanonicalToolId[] = [
  'd3',
  'vega_lite',
  'vega',
  'svgdotjs_svg_js',
  'viz_js',
]

function asProductionToolId(toolId: unknown): ProductionToolId {
  if (typeof toolId === 'string' && proofTools.includes(toolId as AiGraphicsCanonicalToolId)) {
    return toolId as ProductionToolId
  }
  throw new Error(`Unexpected CPU/static production tool id in queue proof: ${String(toolId)}`)
}

type JsonRecord = Record<string, any>
type Report = ReturnType<
  typeof buildAiGraphicsExternalAgentCpuStaticPrivateWorkerLiveAdapterInvocationQueueWriteProof
>

function readJson(file: string): JsonRecord {
  return JSON.parse(fs.readFileSync(file, 'utf8')) as JsonRecord
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function buildMockEnv() {
  return loadRuntimeEnv({
    NODE_ENV: 'test',
    API_PORT: '8787',
    E2E_RUNTIME_MODE: 'mock',
    API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
    STORAGE_MODE: 'local',
    WORKER_RUNTIME_MODE: 'mock',
    AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_MOUNT_ENABLED: 'false',
  })
}

function readySourceRows(source: JsonRecord): JsonRecord[] {
  assert(
    source.decision ===
      'ai_graphics_external_agent_cpu_static_private_worker_adapter_invocation_enqueue_admission_prepared_with_runtime_blocks',
    'source adapter invocation enqueue admission decision mismatch',
  )
  assert(
    source.status ===
      'external_agent_cpu_static_private_worker_adapter_invocation_enqueue_admission_prepared_five_with_runtime_blocks',
    'source adapter invocation enqueue admission status mismatch',
  )
  assert(source.booleans?.agentCanExecuteToolsNow === false, 'source must keep agent execution blocked')
  assert(source.booleans?.externalAgentCanInvokeAdapterNow === false, 'source must keep adapter invocation blocked')
  assert(source.booleans?.workerEnqueueApprovedNow === false, 'source must keep worker enqueue blocked')
  assert(source.booleans?.gpuRuntimeShouldStartNow === false, 'source must keep GPU runtime stopped')
  assert(Array.isArray(source.rows), 'source rows must be an array')

  return proofTools.map((toolId) => {
    const row = source.rows.find((candidate: JsonRecord) => candidate.toolId === toolId)
    assert(row, `missing source row for ${toolId}`)
    assert(row.adapterInvocationEnqueueAdmissionReady === true, `source row not ready for ${toolId}`)
    assert(row.adapterInvocationEnqueueEvidence, `missing source evidence for ${toolId}`)
    assert(row.externalAgentCanInvokeAdapterNow === false, `source adapter invocation must be blocked for ${toolId}`)
    assert(row.workerEnqueueApprovedNow === false, `source worker enqueue must be blocked for ${toolId}`)
    assert(row.toolExecutionApprovedNow === false, `source tool execution must be blocked for ${toolId}`)
    assert(row.gpuRuntimeShouldStartNow === false, `source GPU runtime must be stopped for ${toolId}`)
    return row
  })
}

function buildQueueJob(row: JsonRecord): AiGraphicsToolRuntimeQueueJobInput {
  const evidence = row.adapterInvocationEnqueueEvidence as JsonRecord
  const payload = evidence.productionWorkerJobPayload as JsonRecord
  assert(evidence.privateArtifactManifestRef?.startsWith('private://'), `private artifact ref required for ${row.toolId}`)
  assert(payload?.idempotencyKey, `production worker payload idempotency key required for ${row.toolId}`)
  assert(row.capabilityId, `capability id required for ${row.toolId}`)

  return {
    toolId: row.toolId,
    productionToolId: asProductionToolId(row.productionToolId),
    workerType: row.workerType,
    runtimeTarget: row.runtimeTarget,
    capabilityIds: [row.capabilityId],
    privateArtifactManifestRef: evidence.privateArtifactManifestRef,
    idempotencyKey: payload.idempotencyKey,
    priority: 'normal',
    maxAttempts: 1,
    inputPayload: {
      sourceAdapterInvocationEnvelopeRef: evidence.adapterInvocationEnvelopeRef,
      sourceWorkerEnqueuePayloadRef: evidence.workerEnqueuePayloadRef,
      sourceBackendQueueAdapterRef: evidence.backendQueueAdapterRef,
      sourceServiceRoleBoundaryRef: evidence.serviceRoleBoundaryRef,
      sourceWorkerPayloadSchemaRef: evidence.workerPayloadSchemaRef,
      externalAgentExecutionExpected: false,
      backendQueueSubmissionExpected: false,
      liveQueueWriteExpected: false,
      workerEnqueueExpected: false,
      workerDispatchExpected: false,
      toolExecutionExpected: false,
      gpuRuntimeExpected: false,
    },
  }
}

function buildProofJob(row: JsonRecord, job: AiGraphicsToolRuntimeQueueJobInput): AiGraphicsExternalAgentCpuStaticPrivateWorkerQueueServiceProofJob {
  const evidence = row.adapterInvocationEnqueueEvidence as JsonRecord
  return {
    toolId: row.toolId,
    productionToolId: job.productionToolId as ProductionToolId,
    workerType: job.workerType as AiGraphicsExternalAgentCpuStaticPrivateWorkerQueueServiceProofJob['workerType'],
    runtimeTarget: job.runtimeTarget as AiGraphicsExternalAgentCpuStaticPrivateWorkerQueueServiceProofJob['runtimeTarget'],
    capabilityIds: job.capabilityIds,
    privateArtifactManifestRef: job.privateArtifactManifestRef,
    idempotencyKey: job.idempotencyKey,
    adapterInvocationEnvelopeRef: evidence.adapterInvocationEnvelopeRef,
    workerEnqueuePayloadRef: evidence.workerEnqueuePayloadRef,
    backendQueueAdapterRef: evidence.backendQueueAdapterRef,
    serviceRoleBoundaryRef: evidence.serviceRoleBoundaryRef,
    localAdapterInvocationValidated: true,
    mockQueueWriteValidated: true,
    liveQueueWritePerformed: false,
    workerEnqueuePerformed: false,
    workerDispatchPerformed: false,
    toolExecutionPerformed: false,
    gpuRuntimeShouldStartNow: false,
  }
}

async function buildQueueServiceProof(source: JsonRecord): Promise<AiGraphicsExternalAgentCpuStaticPrivateWorkerQueueServiceProof> {
  const rows = readySourceRows(source)
  const jobs = rows.map(buildQueueJob)
  const env = buildMockEnv()
  assert(env.mockOnly === true, 'queue proof must run with mockOnly=true')

  const service = createAiGraphicsToolRuntimeQueueService({
    env,
    clients: { admin: null, public: null },
    requestId:
      'ai-graphics-external-agent-cpu-static-private-worker-live-adapter-invocation-queue-write-proof',
    auth: {
      userId:
        'ai_graphics_external_agent_cpu_static_private_worker_live_adapter_invocation_queue_write_proof',
      isMockUser: true,
    },
  })

  const enqueue = await service.enqueueToolRuntimeJobs({
    workspaceId:
      'workspace_ai_graphics_external_agent_cpu_static_private_worker_live_adapter_invocation_queue_write_proof',
    projectId:
      'project_ai_graphics_external_agent_cpu_static_private_worker_live_adapter_invocation_queue_write_proof',
    approvedPlanSnapshotId:
      'approved_snapshot_ai_graphics_external_agent_cpu_static_private_worker_live_adapter_invocation_queue_write_proof',
    creditReservationId:
      'credit_reservation_ai_graphics_external_agent_cpu_static_private_worker_live_adapter_invocation_queue_write_proof',
    jobs,
    idempotencyKey:
      'ai-graphics-external-agent-cpu-static-private-worker-live-adapter-invocation-queue-write-proof:batch:five',
    chatSessionId:
      'chat_ai_graphics_external_agent_cpu_static_private_worker_live_adapter_invocation_queue_write_proof',
    editPlanId:
      'edit_plan_ai_graphics_external_agent_cpu_static_private_worker_live_adapter_invocation_queue_write_proof',
    creditEstimateId:
      'credit_estimate_ai_graphics_external_agent_cpu_static_private_worker_live_adapter_invocation_queue_write_proof',
    batchName:
      'AI graphics external agent CPU static private worker live adapter invocation queue write proof',
    createdByAgent:
      'ai_graphics_external_agent_cpu_static_private_worker_live_adapter_invocation_queue_write_proof',
  })

  const queueResult = enqueue.queueResult as JsonRecord
  assert(queueResult.mockOnly === true, 'queue service must report mockOnly=true')
  assert(queueResult.insertedJobCount === 5, 'queue service must accept five mock jobs')
  assert(Array.isArray(queueResult.jobIds) && queueResult.jobIds.length === 5, 'queue service must return five mock job ids')
  assert(queueResult.liveToolExecutionPerformed === false, 'queue service must not execute tools')

  return {
    serviceMode: 'mock_only_no_supabase_write',
    queueServiceRef: 'server/services/ai-graphics-tool-runtime-queue-service.ts',
    queueName: 'ai_graphics_external_agent_cpu_static_private_worker_queue',
    mockOnly: true,
    insertedJobCount: 5,
    returnedJobIdCount: 5,
    warningCount: enqueue.warnings.length,
    liveToolExecutionPerformed: false,
    idempotentReplay: false,
    jobs: rows.map((row, index) => buildProofJob(row, jobs[index])),
  }
}

function makeMarkdown(report: Report): string {
  const passedTools = report.rows
    .filter((row) => row.localAdapterInvocationProofPassed)
    .map((row) => `\`${row.toolId}\``)
    .join(', ')
  const evidenceRows = report.rows
    .filter((row) => row.liveAdapterInvocationQueueWriteProofEvidence)
    .map((row) => {
      const evidence = row.liveAdapterInvocationQueueWriteProofEvidence
      return `- \`${row.toolId}\`: adapterProof=\`${evidence?.localAdapterInvocationProofRef}\`, queueProof=\`${evidence?.mockQueueWriteProofRef}\`, privateArtifact=\`${evidence?.privateArtifactManifestRef}\``
    })
    .join('\n')
  const rows = report.rows
    .map(
      (row) =>
        `| \`${row.toolId}\` | \`${row.capabilityId ?? 'n/a'}\` | \`${row.runtimeTarget}\` | \`${row.liveAdapterInvocationQueueWriteProofStatus}\` | \`${row.localAdapterInvocationProofPassed}\` | \`${row.mockQueueWriteValidationPassed}\` | \`${row.externalAgentCanInvokeAdapterNow}\` | \`${row.liveQueueWriteApprovedNow}\` | \`${row.workerEnqueueApprovedNow}\` | \`${row.toolExecutionApprovedNow}\` | \`${row.gpuRuntimeShouldStartNow}\` | ${row.blocker} |`,
    )
    .join('\n')

  return `# AI Graphics External Agent CPU Static Private Worker Live Adapter Invocation Queue Write Proof

Decision: \`${report.decision}\`

Status: \`${report.status}\`

This packet invokes the ReeditPro AI graphics runtime queue service adapter in explicit mock-only mode using the five exact CPU/static private-worker payloads. It validates adapter/request shape and queue-service write validation without Supabase mutation, live queue write, worker enqueue, worker dispatch, tool execution, artifact creation, signed URL creation, GPU startup, external beta unlock, or production unlock.

## Source Evidence

- Adapter invocation/enqueue admission packet: \`${sourceAdmissionPath}\`
- Source decision: \`${report.sourceAdapterInvocationEnqueueAdmissionDecision}\`
- Queue service: \`server/services/ai-graphics-tool-runtime-queue-service.ts\`
- Builder: \`server/tool-registry/ai-graphics-external-agent-cpu-static-private-worker-live-adapter-invocation-queue-write-proof.ts\`
- CLI: \`server/cli/ai-graphics-external-agent-cpu-static-private-worker-live-adapter-invocation-queue-write-proof.ts\`

## Proof Result

- Total AI graphics tools covered: \`${report.counts.totalAiGraphicsTools}\`
- Local adapter invocation proofs passed: \`${report.counts.localAdapterInvocationProofPassedTools}\` tools: ${passedTools}
- Queue service adapter validations passed: \`${report.counts.queueServiceAdapterValidationPassedTools}\`
- Mock queue write validations passed: \`${report.counts.mockQueueWriteValidationPassedTools}\`
- Source adapter envelopes accepted: \`${report.counts.sourceAdapterInvocationEnvelopeAcceptedTools}\`
- Source worker enqueue payloads accepted: \`${report.counts.sourceWorkerEnqueuePayloadAcceptedTools}\`
- Queue service mock-only mode accepted: \`${report.booleans.queueServiceMockOnlyRuntimeAccepted}\`
- Mock queue inserted job count: \`${report.queueServiceProof?.insertedJobCount ?? 0}\`
- Mock queue returned job id count: \`${report.queueServiceProof?.returnedJobIdCount ?? 0}\`
- Satori blocked pending approved font fixture: \`${report.counts.satoriBlockedPendingApprovedFontFixtureTools}\`
- Non-CPU/static tools deferred by runtime boundary: \`${report.counts.nonCpuStaticDeferredTools}\`
- External-agent executable tools now: \`${report.counts.externalAgentExecutableNowTools}\`
- Live queue writes approved now: \`${report.counts.liveQueueWriteApprovedNowTools}\`
- Worker enqueue approved now: \`${report.counts.workerEnqueueApprovedNowTools}\`
- Tool execution approved now: \`${report.counts.toolExecutionApprovedNowTools}\`
- GPU runtime starts now: \`${report.counts.gpuRuntimeShouldStartNowTools}\`

## Evidence Refs

${evidenceRows}

## Tool Rows

| Tool | Capability | Runtime target | Proof status | Adapter proof | Mock queue validation | Adapter now | Live queue now | Worker enqueue now | Tool execution now | GPU runtime now | Blocker |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
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

This moves the five CPU/static tools one gate forward: the prepared payloads now pass the runtime queue service validation in mock-only mode. The actual executable-by-agent switch stays blocked until a non-production service-role queue write, worker claim/dispatch, and exact tool execution boundary proof pass.

## Next Milestone

\`${report.nextMilestone}\`
`
}

function makePromptResult(report: Report): string {
  return `# Prompt AI Graphics External Agent CPU Static Private Worker Live Adapter Invocation Queue Write Proof Results

- Branch: \`codex/rp-ai-graphics-tool-call-readiness-contract\`
- Draft PR: https://github.com/yuzastudio6-cyber/Reedkt/pull/862
- Decision: \`${report.decision}\`
- Local adapter invocation proofs passed: \`${report.counts.localAdapterInvocationProofPassedTools}\`
- Queue service adapter validations passed: \`${report.counts.queueServiceAdapterValidationPassedTools}\`
- Mock queue write validations passed: \`${report.counts.mockQueueWriteValidationPassedTools}\`
- Mock queue inserted job count: \`${report.queueServiceProof?.insertedJobCount ?? 0}\`
- Satori blocked pending approved font fixture: \`${report.counts.satoriBlockedPendingApprovedFontFixtureTools}\`
- Non-CPU/static deferred tools: \`${report.counts.nonCpuStaticDeferredTools}\`
- External-agent executable tools now: \`${report.counts.externalAgentExecutableNowTools}\`
- Live queue writes approved now: \`${report.counts.liveQueueWriteApprovedNowTools}\`
- Worker enqueue approved now: \`${report.counts.workerEnqueueApprovedNowTools}\`
- Tool execution approved now: \`${report.counts.toolExecutionApprovedNowTools}\`
- GPU runtime starts now: \`${report.counts.gpuRuntimeShouldStartNowTools}\`
- \`agentCanExecuteToolsNow=false\`
- \`externalAgentCanInvokeAdapterNow=false\`
- \`workerEnqueueApprovedNow=false\`
- \`toolExecutionApprovedNow=false\`
- \`gpuRuntimeShouldStartNow=false\`

## Unblock Policy

The five CPU/static tools now pass the runtime queue service adapter validation in mock-only mode. The external-agent executable switch remains fail-closed until the next gate proves a non-production service-role queue write plus the worker claim/dispatch boundary for the exact request.

## No-Scope

No direct agent execution, Tool Route execution, Worker execution, backend queue submission, live queue write, worker enqueue, worker dispatch, tool execution, provider/model runtime, browser/WebGL/canvas runtime, GPU/model runtime, dependency install, package-lock mutation, Supabase/GCS mutation, signed URL, public artifact, external beta unlock, or production unlock is approved.

## Next Prompt

\`AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_NON_PRODUCTION_SERVICE_ROLE_QUEUE_WRITE_SMOKE\`
`
}

function makeImplementationPrompt(report: Report): string {
  return `# AI Graphics External Agent CPU Static Private Worker Live Adapter Invocation Queue Write Proof Implementation Record

Implemented the mock-only runtime queue service proof for the first CPU/static external-agent private-worker cohort.

Decision: \`${report.decision}\`

## Accepted Source

- Adapter invocation/enqueue admission packet: \`${sourceAdmissionPath}\`

## Result

- \`${report.counts.localAdapterInvocationProofPassedTools}\` CPU/static tools passed local adapter invocation proof through the runtime queue service boundary.
- \`${report.counts.mockQueueWriteValidationPassedTools}\` CPU/static tools passed mock-only queue write validation.
- \`${report.queueServiceProof?.insertedJobCount ?? 0}\` mock queue jobs were accepted by the queue service validator.
- \`${report.counts.satoriBlockedPendingApprovedFontFixtureTools}\` Satori remains blocked pending approved font fixture proof.
- \`${report.counts.nonCpuStaticDeferredTools}\` browser/GPU/model tools remain deferred by runtime boundary.
- Actual executable-by-agent, live queue write, worker enqueue, worker dispatch, and tool execution blocks remain fail-closed until the next service-role queue write and worker proof passes.
- \`agentCanExecuteToolsNow=false\`
- \`externalAgentCanInvokeAdapterNow=false\`
- \`workerEnqueueApprovedNow=false\`
- \`toolExecutionApprovedNow=false\`
- \`gpuRuntimeShouldStartNow=false\`
`
}

async function main() {
  const sourceAdmission = readJson(sourceAdmissionPath)
  const queueServiceProof = await buildQueueServiceProof(sourceAdmission)
  const report =
    buildAiGraphicsExternalAgentCpuStaticPrivateWorkerLiveAdapterInvocationQueueWriteProof({
      sourceAdapterInvocationEnqueueAdmissionReport: sourceAdmission as any,
      queueServiceProof,
    })

  assert(
    report.decision ===
      AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_LIVE_ADAPTER_INVOCATION_QUEUE_WRITE_PROOF_DECISION,
    'unexpected live adapter invocation queue write proof decision',
  )
  assert(report.counts.localAdapterInvocationProofPassedTools === 5, 'expected five adapter proofs')
  assert(report.counts.mockQueueWriteValidationPassedTools === 5, 'expected five mock queue validations')
  assert(report.counts.externalAgentExecutableNowTools === 0, 'execution must remain blocked')
  assert(report.booleans.agentCanExecuteToolsNow === false, 'agent execution must remain false')
  assert(report.booleans.externalAgentCanInvokeAdapterNow === false, 'adapter invocation must remain false')
  assert(report.booleans.liveQueueWriteApprovedNow === false, 'live queue write must remain false')
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
    localAdapterInvocationProofPassedTools:
      report.counts.localAdapterInvocationProofPassedTools,
    mockQueueWriteValidationPassedTools:
      report.counts.mockQueueWriteValidationPassedTools,
    externalAgentExecutableNowTools: report.counts.externalAgentExecutableNowTools,
    liveQueueWriteApprovedNowTools: report.counts.liveQueueWriteApprovedNowTools,
    toolExecutionApprovedNowTools: report.counts.toolExecutionApprovedNowTools,
    gpuRuntimeShouldStartNowTools: report.counts.gpuRuntimeShouldStartNowTools,
  }, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
