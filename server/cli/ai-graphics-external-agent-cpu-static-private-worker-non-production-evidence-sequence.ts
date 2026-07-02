import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const RUNNER_DECISION =
  'ai_graphics_external_agent_cpu_static_private_worker_non_production_evidence_sequence_prepared_with_runtime_blocks'
const OPERATOR_PREFLIGHT_DECISION =
  'ai_graphics_external_agent_cpu_static_private_worker_non_production_evidence_sequence_operator_preflight_completed_with_runtime_blocks'

const executeFlag =
  '--execute-ai-graphics-external-agent-cpu-static-non-production-evidence-sequence'
const operatorPreflightFlag = '--operator-preflight'

const proofTools = ['d3', 'vega_lite', 'vega', 'svgdotjs_svg_js', 'viz_js'] as const

const defaultSourceQueueWritePreflightPath =
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-preflight.json'
const defaultSourceExactExecutionAdmissionPath =
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-exact-execution-admission.json'
const defaultOutputDir =
  '.local-artifacts/ai-graphics/external-agent/cpu-static-private-worker/non-production-evidence-sequence'
const outputJsonPath =
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-non-production-evidence-sequence.json'
const outputMdPath =
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-non-production-evidence-sequence.md'
const promptResultPath =
  'docs/prompt-ai-graphics-external-agent-cpu-static-private-worker-non-production-evidence-sequence-results.md'
const implementationPromptPath =
  'docs/implementation-prompts/prompt-ai-graphics-external-agent-cpu-static-private-worker-non-production-evidence-sequence.md'

const requiredEnv = [
  'REEDITPRO_CONFIRM_AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_NON_PRODUCTION_EVIDENCE_SEQUENCE=true',
  'REEDITPRO_CONFIRM_AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_SERVICE_ROLE_QUEUE_WRITE_SMOKE=true',
  'REEDITPRO_CONFIRM_AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_WORKER_CLAIM_AND_DISPATCH_SMOKE=true',
  'REEDITPRO_AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_NON_PRODUCTION_EVIDENCE_SEQUENCE_ENV=non_production',
  'REEDITPRO_AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_SERVICE_ROLE_QUEUE_WRITE_SMOKE_ENV=non_production',
  'REEDITPRO_AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_WORKER_CLAIM_AND_DISPATCH_SMOKE_ENV=non_production',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'E2E_RUNTIME_MODE=local',
  'WORKER_RUNTIME_MODE=mock',
] as const

const requiredFlags = [
  executeFlag,
  '--workspace-id',
  '--project-id',
  '--approved-plan-snapshot-id',
  '--credit-reservation-id',
  '--idempotency-prefix',
  '--source-non-production-service-role-queue-write-smoke-preflight-packet',
  '--source-exact-execution-admission-packet',
  '--output-dir',
] as const

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag)
}

function valueAfterFlag(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  return index >= 0 ? process.argv[index + 1] : undefined
}

function requiredFlag(flag: string): string {
  const value = valueAfterFlag(flag)
  if (!value) throw new Error(`Missing required flag for CPU/static evidence sequence: ${flag}`)
  return value
}

function optionalFlag(flag: string, fallback: string): string {
  return valueAfterFlag(flag) ?? fallback
}

function refFor(prefix: string, name: string): string {
  return `private://ai-graphics/external-agent/cpu-static-non-production-evidence-sequence/${prefix}/${name}`
}

function preparedContract() {
  return {
    ok: true,
    decision: RUNNER_DECISION,
    status:
      'external_agent_cpu_static_private_worker_non_production_evidence_sequence_prepared_not_executed',
    preparedScript:
      'ai-graphics:external-agent-cpu-static-private-worker-non-production-evidence-sequence',
    executeFlagRequired: executeFlag,
    operatorPreflightFlag,
    sourceQueueWritePreflightPacket: defaultSourceQueueWritePreflightPath,
    sourceExactExecutionAdmissionPacket: defaultSourceExactExecutionAdmissionPath,
    requiredEnv,
    requiredFlags,
    localOnlySuggestedOutputDir: defaultOutputDir,
    localOnlySuggestedSequenceResult: `${defaultOutputDir}/evidence-sequence-result.json`,
    stages: [
      {
        stageId: 'queue_write_smoke',
        command:
          'npm run ai-graphics:external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke -- --execute-ai-graphics-external-agent-cpu-static-service-role-queue-write-smoke ...',
        outputResult: `${defaultOutputDir}/queue-write-smoke-result.json`,
        outputProof: `${defaultOutputDir}/queue-write-smoke-proof.json`,
        expectedQueueRowsWritten: 5,
        expectedQueueRowsCleanedUp: 5,
        expectedQueueRowsPersistedAfterCleanup: 0,
        expectedWorkerClaimsCreated: 0,
        expectedWorkerDispatchesPerformed: 0,
        expectedToolExecutionsPerformed: 0,
      },
      {
        stageId: 'worker_claim_and_dispatch_smoke',
        command:
          'npm run ai-graphics:external-agent-cpu-static-private-worker-claim-and-dispatch-smoke -- --execute-ai-graphics-external-agent-cpu-static-worker-claim-and-dispatch-smoke ...',
        outputResult: `${defaultOutputDir}/claim-and-dispatch-smoke-result.json`,
        outputProof: `${defaultOutputDir}/claim-and-dispatch-smoke-proof.json`,
        expectedQueueRowsRead: 5,
        expectedWorkerClaimsCreated: 5,
        expectedWorkerDispatchHandoffsCreated: 5,
        expectedWorkerDispatchLeasesReleased: 5,
        expectedQueueRowsPersistedAfterCleanup: 0,
        expectedToolExecutionsPerformed: 0,
      },
    ],
    toolsCovered: 5,
    toolsCoveredIds: [...proofTools],
    liveEvidenceSequenceExecutedNow: false,
    liveSupabaseQueueWritesNow: 0,
    liveWorkerClaimsNow: 0,
    liveWorkerDispatchHandoffsNow: 0,
    toolExecutionsPerformedNow: 0,
    agentCanExecuteToolsNow: false,
    gpuRuntimeShouldStartNow: false,
    runtimeReadyNow: false,
    externalBetaReadyNow: false,
    productionReadyNow: false,
    booleans: {
      externalAgentCpuStaticPrivateWorkerNonProductionEvidenceSequencePrepared:
        true,
      exactFiveCpuStaticToolsOnly: true,
      serverOnlyServiceRoleCredentialsRequired: true,
      nonProductionEnvironmentRequired: true,
      explicitOperatorConfirmationRequired: true,
      queueWriteSmokeRunsFirst: true,
      queueWriteProofMustValidateBeforeClaimDispatch: true,
      claimDispatchSmokeRunsSecond: true,
      claimDispatchProofMustValidateBeforeExecutionGate: true,
      localArtifactsOnly: true,
      cleanupRequired: true,
      noToolExecutionBySequence: true,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      externalAgentCanInvokeAdapterNow: false,
      externalAgentCanSubmitPrivateWorkerQueueNow: false,
      liveQueueWriteApprovedNow: false,
      backendQueueSubmissionApprovedNow: false,
      workerEnqueueApprovedNow: false,
      workerClaimApprovedNow: false,
      workerDispatchApprovedNow: false,
      workerExecutionApprovedNow: false,
      toolExecutionApprovedNow: false,
      providerRuntimeApprovedNow: false,
      browserWebglCanvasRuntimeApprovedNow: false,
      gpuRuntimeApprovedNow: false,
      gpuRuntimeShouldStartNow: false,
      runtimeReadyNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
      dependencyInstallPerformed: false,
      packageLockMutationPerformed: false,
      toolExecutionPerformed: false,
      workerExecutionPerformed: false,
      routeExecutionPerformed: false,
      providerRuntimePerformed: false,
      browserWebglCanvasRuntimePerformed: false,
      gpuRuntimePerformed: false,
      mediaProcessingPerformed: false,
      supabaseMutationPerformed: false,
      gcsUploadPerformed: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
    },
  }
}

type PreparedContract = ReturnType<typeof preparedContract>

function markdownList(values: readonly string[]): string {
  return values.map((value) => `- \`${value}\``).join('\n')
}

function stageRows(contract: PreparedContract): string {
  return contract.stages
    .map((stage) =>
      `| \`${stage.stageId}\` | \`${stage.command}\` | \`${stage.outputResult}\` | \`${stage.outputProof}\` | \`${stage.expectedToolExecutionsPerformed}\` |`,
    )
    .join('\n')
}

function makeMarkdown(contract: PreparedContract): string {
  return `# AI Graphics External Agent CPU Static Private Worker Non-Production Evidence Sequence

Decision: \`${contract.decision}\`

Status: \`${contract.status}\`

This packet records the exact operator handoff for the CPU/static private-worker non-production evidence sequence. It does not execute the sequence, mutate Supabase, claim workers, dispatch workers, execute tools, start GPU runtime, create signed URLs, create public artifacts, unlock external beta, or unlock production.

## Scope

- Tools covered: \`${contract.toolsCovered}\`
- Tool IDs: ${contract.toolsCoveredIds.map((toolId) => `\`${toolId}\``).join(', ')}
- Source queue-write preflight packet: \`${contract.sourceQueueWritePreflightPacket}\`
- Source exact execution admission packet: \`${contract.sourceExactExecutionAdmissionPacket}\`
- Local-only suggested output directory: \`${contract.localOnlySuggestedOutputDir}\`
- Local-only sequence result: \`${contract.localOnlySuggestedSequenceResult}\`

## Required Environment

${markdownList(contract.requiredEnv)}

## Required Flags

${markdownList(contract.requiredFlags)}

## Operator Preflight

- Non-mutating preflight flag: \`${contract.operatorPreflightFlag}\`
- Purpose: verify exact future execution environment, flags, source packets, and production block state without queue writes, worker claims, worker dispatches, tool execution, GPU runtime, signed URLs, or public artifacts.
- Usage: run the evidence sequence command with \`${contract.operatorPreflightFlag}\` plus the same env/flags intended for the future execution run. The preflight reports \`canRunEvidenceSequenceNow\` but never executes the sequence.

## Ordered Evidence Stages

| Stage | Command | Result output | Proof output | Tool executions expected |
| --- | --- | --- | --- | --- |
${stageRows(contract)}

## Runtime Gates

- \`liveEvidenceSequenceExecutedNow=${contract.liveEvidenceSequenceExecutedNow}\`
- \`liveSupabaseQueueWritesNow=${contract.liveSupabaseQueueWritesNow}\`
- \`liveWorkerClaimsNow=${contract.liveWorkerClaimsNow}\`
- \`liveWorkerDispatchHandoffsNow=${contract.liveWorkerDispatchHandoffsNow}\`
- \`toolExecutionsPerformedNow=${contract.toolExecutionsPerformedNow}\`
- \`agentCanExecuteToolsNow=${contract.agentCanExecuteToolsNow}\`
- \`gpuRuntimeShouldStartNow=${contract.gpuRuntimeShouldStartNow}\`
- \`runtimeReadyNow=${contract.runtimeReadyNow}\`
- \`externalBetaReadyNow=${contract.externalBetaReadyNow}\`
- \`productionReadyNow=${contract.productionReadyNow}\`

## Operator Rule

Run this sequence only in a private non-production environment with server-only service-role credentials and explicit operator confirmation. The queue-write smoke proof must validate before the claim/dispatch smoke runs. The claim/dispatch smoke proof must validate before any later dry-run or controlled tool execution gate can advance.

## No-Scope

This packet does not run \`npm install\`, run \`npm ci\`, mutate \`package-lock.json\`, rerun CPU/static validation, execute tools, execute workers, execute routes, call providers/models, run browser/WebGL/canvas runtime, run GPU/model runtime, download model weights, process media, mutate Supabase/GCS, create signed URLs, create public artifacts, unlock external beta, or unlock production.
`
}

function makePromptResult(contract: PreparedContract): string {
  return `# Prompt AI Graphics External Agent CPU Static Private Worker Non-Production Evidence Sequence Results

- Branch: \`codex/rp-ai-graphics-tool-call-readiness-contract\`
- Draft PR: https://github.com/yuzastudio6-cyber/Reedkt/pull/862
- Decision: \`${contract.decision}\`
- Status: \`${contract.status}\`
- Tools covered: \`${contract.toolsCovered}\`
- Tool IDs: ${contract.toolsCoveredIds.map((toolId) => `\`${toolId}\``).join(', ')}
- Live evidence sequence executed now: \`${contract.liveEvidenceSequenceExecutedNow}\`
- Operator preflight flag: \`${contract.operatorPreflightFlag}\`
- Local-only sequence result path: \`${contract.localOnlySuggestedSequenceResult}\`
- Live Supabase queue writes now: \`${contract.liveSupabaseQueueWritesNow}\`
- Worker claims now: \`${contract.liveWorkerClaimsNow}\`
- Worker dispatch handoffs now: \`${contract.liveWorkerDispatchHandoffsNow}\`
- Tool executions now: \`${contract.toolExecutionsPerformedNow}\`
- Agent can execute tools now: \`${contract.agentCanExecuteToolsNow}\`
- GPU runtime should start now: \`${contract.gpuRuntimeShouldStartNow}\`

## Interpretation

The evidence sequence handoff is prepared but not executed. It preserves the exact two-stage order needed for the next real non-production proof: queue-write smoke first, then worker claim/dispatch smoke. Both stages write local-only proof files under \`${contract.localOnlySuggestedOutputDir}\`.
The future executed sequence must also save the final local-only sequence summary to \`${contract.localOnlySuggestedSequenceResult}\`.

## Next Step

Run the sequence only after explicit non-production operator approval and server-only service-role credentials are present. The checked-in packet remains fail-closed and does not make the five CPU/static tools agent-executable.
`
}

function makeImplementationPrompt(contract: PreparedContract): string {
  return `# AI Graphics External Agent CPU Static Private Worker Non-Production Evidence Sequence Implementation Record

Implemented committed evidence-sequence records for the CPU/static private-worker external-agent execution path.

## Result

- Decision: \`${contract.decision}\`
- Status: \`${contract.status}\`
- Tools covered: \`${contract.toolsCovered}\`
- Local-only output directory: \`${contract.localOnlySuggestedOutputDir}\`
- Local-only sequence result path: \`${contract.localOnlySuggestedSequenceResult}\`
- Operator preflight flag: \`${contract.operatorPreflightFlag}\`
- Queue-write smoke proof must validate before claim/dispatch smoke: \`${contract.booleans.queueWriteProofMustValidateBeforeClaimDispatch}\`
- Claim/dispatch smoke proof must validate before execution gate: \`${contract.booleans.claimDispatchProofMustValidateBeforeExecutionGate}\`
- Agent can execute tools now: \`${contract.booleans.agentCanExecuteToolsNow}\`
- GPU runtime should start now: \`${contract.booleans.gpuRuntimeShouldStartNow}\`

This record adds traceability for the next real non-production proof run. It does not execute the sequence or approve runtime.
`
}

function writePreparedRecords(contract: PreparedContract): void {
  fs.writeFileSync(outputJsonPath, `${JSON.stringify(contract, null, 2)}\n`)
  fs.writeFileSync(outputMdPath, makeMarkdown(contract))
  fs.writeFileSync(promptResultPath, makePromptResult(contract))
  fs.writeFileSync(implementationPromptPath, makeImplementationPrompt(contract))
}

function assertAllowedToExecute(): void {
  const requirements: Array<[string, string]> = [
    [
      'REEDITPRO_CONFIRM_AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_NON_PRODUCTION_EVIDENCE_SEQUENCE',
      'true',
    ],
    [
      'REEDITPRO_CONFIRM_AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_SERVICE_ROLE_QUEUE_WRITE_SMOKE',
      'true',
    ],
    [
      'REEDITPRO_CONFIRM_AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_WORKER_CLAIM_AND_DISPATCH_SMOKE',
      'true',
    ],
    [
      'REEDITPRO_AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_NON_PRODUCTION_EVIDENCE_SEQUENCE_ENV',
      'non_production',
    ],
    [
      'REEDITPRO_AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_SERVICE_ROLE_QUEUE_WRITE_SMOKE_ENV',
      'non_production',
    ],
    [
      'REEDITPRO_AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_WORKER_CLAIM_AND_DISPATCH_SMOKE_ENV',
      'non_production',
    ],
    ['E2E_RUNTIME_MODE', 'local'],
    ['WORKER_RUNTIME_MODE', 'mock'],
  ]
  for (const [key, expected] of requirements) {
    if (process.env[key] !== expected) {
      throw new Error(`Set ${key}=${expected} to run the CPU/static non-production evidence sequence.`)
    }
  }
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'CPU/static non-production evidence sequence requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in server env.',
    )
  }
  if (hasFlag('--production') || process.env.NODE_ENV === 'production') {
    throw new Error('CPU/static non-production evidence sequence is blocked in production.')
  }
}

function splitRequiredEnv(value: string): { key: string; expected?: string } {
  const separatorIndex = value.indexOf('=')
  if (separatorIndex === -1) return { key: value }
  return {
    key: value.slice(0, separatorIndex),
    expected: value.slice(separatorIndex + 1),
  }
}

function buildOperatorPreflightReport() {
  const envChecks = requiredEnv.map((entry) => {
    const { key, expected } = splitRequiredEnv(entry)
    const actual = process.env[key]
    const present = Boolean(actual)
    const matchesExpected = expected === undefined ? present : actual === expected
    return {
      key,
      expected: expected ?? 'present',
      present,
      matchesExpected,
      value: present ? '<present>' : '<missing>',
    }
  })
  const flagChecks = requiredFlags.map((flag) => {
    const present =
      flag === executeFlag || flag === operatorPreflightFlag
        ? hasFlag(flag)
        : Boolean(valueAfterFlag(flag))
    return {
      flag,
      present,
    }
  })
  const sourcePacketChecks = [
    {
      path: defaultSourceQueueWritePreflightPath,
      exists: fs.existsSync(defaultSourceQueueWritePreflightPath),
    },
    {
      path: defaultSourceExactExecutionAdmissionPath,
      exists: fs.existsSync(defaultSourceExactExecutionAdmissionPath),
    },
  ]
  const productionBlocked = hasFlag('--production') || process.env.NODE_ENV === 'production'
  const missingOrMismatchedEnv = envChecks
    .filter((check) => !check.matchesExpected)
    .map((check) => check.key)
  const missingFlags = flagChecks.filter((check) => !check.present).map((check) => check.flag)
  const missingSourcePackets = sourcePacketChecks
    .filter((check) => !check.exists)
    .map((check) => check.path)
  const canRunEvidenceSequenceNow =
    missingOrMismatchedEnv.length === 0 &&
    missingFlags.length === 0 &&
    missingSourcePackets.length === 0 &&
    !productionBlocked

  return {
    ok: true,
    decision: OPERATOR_PREFLIGHT_DECISION,
    status: canRunEvidenceSequenceNow
      ? 'external_agent_cpu_static_private_worker_non_production_evidence_sequence_operator_preflight_ready_for_execute_flag'
      : 'external_agent_cpu_static_private_worker_non_production_evidence_sequence_operator_preflight_blocked_pending_runtime_prerequisites',
    operatorPreflightOnly: true,
    canRunEvidenceSequenceNow,
    executeFlagRequired: executeFlag,
    operatorPreflightFlag,
    sourceQueueWritePreflightPacket: defaultSourceQueueWritePreflightPath,
    sourceExactExecutionAdmissionPacket: defaultSourceExactExecutionAdmissionPath,
    localOnlySuggestedOutputDir: defaultOutputDir,
    localOnlySuggestedSequenceResult: `${defaultOutputDir}/evidence-sequence-result.json`,
    envChecks,
    flagChecks,
    sourcePacketChecks,
    missingOrMismatchedEnv,
    missingFlags,
    missingSourcePackets,
    productionBlocked,
    toolsCovered: 5,
    toolsCoveredIds: [...proofTools],
    liveEvidenceSequenceExecutedNow: false,
    liveSupabaseQueueWritesNow: 0,
    liveWorkerClaimsNow: 0,
    liveWorkerDispatchHandoffsNow: 0,
    toolExecutionsPerformedNow: 0,
    agentCanExecuteToolsNow: false,
    gpuRuntimeShouldStartNow: false,
    runtimeReadyNow: false,
    externalBetaReadyNow: false,
    productionReadyNow: false,
    booleans: {
      operatorPreflightOnly: true,
      canRunEvidenceSequenceNow,
      sourcePacketsPresent: missingSourcePackets.length === 0,
      explicitExecuteFlagPresent: hasFlag(executeFlag),
      explicitOperatorPreflightFlagPresent: hasFlag(operatorPreflightFlag),
      productionBlocked,
      toolExecutionPerformed: false,
      workerExecutionPerformed: false,
      routeExecutionPerformed: false,
      providerRuntimePerformed: false,
      browserWebglCanvasRuntimePerformed: false,
      gpuRuntimePerformed: false,
      supabaseMutationPerformed: false,
      gcsUploadPerformed: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
      agentCanExecuteToolsNow: false,
      gpuRuntimeShouldStartNow: false,
      runtimeReadyNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
    },
  }
}

function runNpmJson(script: string, args: string[]): Record<string, any> {
  const output = execFileSync('npm', ['run', '--silent', script, '--', ...args], {
    encoding: 'utf8',
    maxBuffer: 40 * 1024 * 1024,
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
  })
  return JSON.parse(output)
}

function writeJson(filePath: string, value: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`)
}

function assertAcceptedQueueProof(proof: Record<string, any>): void {
  if (
    proof.status !==
      'accepted_saved_non_production_service_role_queue_write_smoke_result_execution_blocked' ||
    proof.counts?.savedSmokeResultAcceptedToolsWithProvidedEvidence !== 5 ||
    proof.counts?.serviceRoleQueueWritesAcceptedWithProvidedEvidence !== 5 ||
    proof.counts?.queueRowsPersistedAfterCleanup !== 0 ||
    proof.booleans?.agentCanExecuteToolsNow !== false ||
    proof.booleans?.gpuRuntimeShouldStartNow !== false
  ) {
    throw new Error('CPU/static evidence sequence queue-write proof did not validate as accepted.')
  }
}

function assertAcceptedClaimDispatchProof(proof: Record<string, any>): void {
  if (
    proof.status !==
      'accepted_saved_worker_claim_and_dispatch_smoke_result_execution_blocked' ||
    proof.counts?.savedWorkerClaimAndDispatchSmokeAcceptedToolsWithProvidedEvidence !== 5 ||
    proof.counts?.workerClaimsAcceptedWithProvidedEvidence !== 5 ||
    proof.counts?.workerDispatchHandoffsAcceptedWithProvidedEvidence !== 5 ||
    proof.counts?.workerDispatchLeasesReleasedWithProvidedEvidence !== 5 ||
    proof.counts?.queueRowsPersistedAfterCleanup !== 0 ||
    proof.booleans?.agentCanExecuteToolsNow !== false ||
    proof.booleans?.gpuRuntimeShouldStartNow !== false
  ) {
    throw new Error('CPU/static evidence sequence claim/dispatch proof did not validate as accepted.')
  }
}

async function executeSequence() {
  assertAllowedToExecute()
  const workspaceId = requiredFlag('--workspace-id')
  const projectId = requiredFlag('--project-id')
  const approvedPlanSnapshotId = requiredFlag('--approved-plan-snapshot-id')
  const creditReservationId = requiredFlag('--credit-reservation-id')
  const idempotencyPrefix = requiredFlag('--idempotency-prefix')
  const sourcePreflightPath = optionalFlag(
    '--source-non-production-service-role-queue-write-smoke-preflight-packet',
    defaultSourceQueueWritePreflightPath,
  )
  const sourceExactAdmissionPath = optionalFlag(
    '--source-exact-execution-admission-packet',
    defaultSourceExactExecutionAdmissionPath,
  )
  const outputDir = optionalFlag('--output-dir', defaultOutputDir)

  const queueResultPath = path.join(outputDir, 'queue-write-smoke-result.json')
  const queueProofPath = path.join(outputDir, 'queue-write-smoke-proof.json')
  const claimResultPath = path.join(outputDir, 'claim-and-dispatch-smoke-result.json')
  const claimProofPath = path.join(outputDir, 'claim-and-dispatch-smoke-proof.json')
  const sequenceResultPath = path.join(outputDir, 'evidence-sequence-result.json')

  const queueResult = runNpmJson(
    'ai-graphics:external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke',
    [
      '--execute-ai-graphics-external-agent-cpu-static-service-role-queue-write-smoke',
      '--workspace-id',
      workspaceId,
      '--project-id',
      projectId,
      '--approved-plan-snapshot-id',
      approvedPlanSnapshotId,
      '--credit-reservation-id',
      creditReservationId,
      '--idempotency-prefix',
      `${idempotencyPrefix}:queue-write`,
      '--source-non-production-service-role-queue-write-smoke-preflight-packet',
      sourcePreflightPath,
      '--service-role-boundary-ref',
      `service-role-boundary://ai-graphics/external-agent/cpu-static-non-production-evidence-sequence/${idempotencyPrefix}/queue-write`,
      '--private-evidence-ref',
      refFor(idempotencyPrefix, 'queue-write/evidence.json'),
      '--telemetry-ref',
      refFor(idempotencyPrefix, 'queue-write/telemetry.json'),
      '--cleanup-proof-ref',
      refFor(idempotencyPrefix, 'queue-write/cleanup.json'),
      '--rollback-ref',
      refFor(idempotencyPrefix, 'queue-write/rollback.json'),
      '--output-result',
      queueResultPath,
    ],
  )

  const queueProof = runNpmJson(
    'ai-graphics:external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-proof',
    [
      '--external-agent-cpu-static-service-role-queue-write-smoke-result',
      queueResultPath,
      '--print-only',
    ],
  )
  assertAcceptedQueueProof(queueProof)
  writeJson(queueProofPath, queueProof)

  const claimResult = runNpmJson(
    'ai-graphics:external-agent-cpu-static-private-worker-claim-and-dispatch-smoke',
    [
      '--execute-ai-graphics-external-agent-cpu-static-worker-claim-and-dispatch-smoke',
      '--workspace-id',
      workspaceId,
      '--project-id',
      projectId,
      '--approved-plan-snapshot-id',
      approvedPlanSnapshotId,
      '--credit-reservation-id',
      creditReservationId,
      '--idempotency-prefix',
      `${idempotencyPrefix}:claim-dispatch`,
      '--source-service-role-queue-write-smoke-proof-packet',
      queueProofPath,
      '--source-exact-execution-admission-packet',
      sourceExactAdmissionPath,
      '--service-role-boundary-ref',
      `service-role-boundary://ai-graphics/external-agent/cpu-static-non-production-evidence-sequence/${idempotencyPrefix}/claim-dispatch`,
      '--private-evidence-ref',
      refFor(idempotencyPrefix, 'claim-dispatch/evidence.json'),
      '--telemetry-ref',
      refFor(idempotencyPrefix, 'claim-dispatch/telemetry.json'),
      '--lease-audit-ref',
      refFor(idempotencyPrefix, 'claim-dispatch/lease-audit.json'),
      '--cleanup-proof-ref',
      refFor(idempotencyPrefix, 'claim-dispatch/cleanup.json'),
      '--rollback-ref',
      refFor(idempotencyPrefix, 'claim-dispatch/rollback.json'),
      '--output-result',
      claimResultPath,
    ],
  )

  const claimProof = runNpmJson(
    'ai-graphics:external-agent-cpu-static-private-worker-claim-and-dispatch-smoke-proof',
    [
      '--source-service-role-queue-write-smoke-proof-packet',
      queueProofPath,
      '--source-exact-execution-admission-packet',
      sourceExactAdmissionPath,
      '--external-agent-cpu-static-worker-claim-and-dispatch-smoke-result',
      claimResultPath,
      '--print-only',
    ],
  )
  assertAcceptedClaimDispatchProof(claimProof)
  writeJson(claimProofPath, claimProof)

  const sequenceResult = {
    ok: true,
    decision:
      'ai_graphics_external_agent_cpu_static_private_worker_non_production_evidence_sequence_passed_with_cleanup',
    status:
      'external_agent_cpu_static_private_worker_non_production_evidence_sequence_passed_queue_write_and_claim_dispatch_no_tool_execution',
    toolsCovered: 5,
    toolsCoveredIds: [...proofTools],
    queueWriteSmokeResultPath: queueResultPath,
    queueWriteSmokeProofPath: queueProofPath,
    claimAndDispatchSmokeResultPath: claimResultPath,
    claimAndDispatchSmokeProofPath: claimProofPath,
    evidenceSequenceResultPath: sequenceResultPath,
    queueRowsWritten: queueResult.queueRowsWritten,
    queueRowsPersistedAfterQueueWriteCleanup:
      queueResult.queueRowsPersistedAfterCleanup,
    workerClaimsCreated: claimResult.workerClaimsCreated,
    workerDispatchHandoffsCreated: claimResult.workerDispatchHandoffsCreated,
    workerDispatchLeasesReleased: claimResult.workerDispatchLeasesReleased,
    queueRowsPersistedAfterClaimDispatchCleanup:
      claimResult.queueRowsPersistedAfterCleanup,
    toolExecutionsPerformed: 0,
    liveEvidenceSequenceExecutedNow: true,
    publicArtifactCreated: false,
    signedUrlCreated: false,
    gpuRuntimeShouldStartNow: false,
    agentCanExecuteToolsNow: false,
    runtimeReadyNow: false,
    externalBetaReadyNow: false,
    productionReadyNow: false,
  }
  writeJson(sequenceResultPath, sequenceResult)
  return sequenceResult
}

async function main(): Promise<void> {
  if (hasFlag(operatorPreflightFlag)) {
    console.log(JSON.stringify(buildOperatorPreflightReport(), null, 2))
    return
  }
  if (!hasFlag(executeFlag)) {
    const contract = preparedContract()
    if (hasFlag('--write-records')) {
      writePreparedRecords(contract)
    }
    console.log(JSON.stringify(contract, null, 2))
    return
  }
  const result = await executeSequence()
  console.log(JSON.stringify(result, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
