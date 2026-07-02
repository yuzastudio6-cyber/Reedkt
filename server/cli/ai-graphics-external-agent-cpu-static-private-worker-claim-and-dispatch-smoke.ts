import fs from 'node:fs'
import path from 'node:path'
import { loadRuntimeEnv } from '../config/env'
import { createAiGraphicsToolRuntimeQueueService } from '../services/ai-graphics-tool-runtime-queue-service'
import { createSupabaseAdminClient } from '../supabase/admin-client'
import {
  getAiGraphicsToolCallReadiness,
  type AiGraphicsCanonicalToolId,
} from '../tool-registry/ai-graphics-tool-call-readiness'
import {
  AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_CLAIM_AND_DISPATCH_SMOKE_PROOF_DECISION,
  type AiGraphicsExternalAgentCpuStaticPrivateWorkerClaimAndDispatchSmokeResult,
} from '../tool-registry/ai-graphics-external-agent-cpu-static-private-worker-claim-and-dispatch-smoke-proof'
import {
  AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_EXACT_EXECUTION_ADMISSION_DECISION,
  type AiGraphicsExternalAgentCpuStaticPrivateWorkerExactExecutionAdmissionReport,
  type AiGraphicsExternalAgentCpuStaticPrivateWorkerExactExecutionAdmissionRow,
} from '../tool-registry/ai-graphics-external-agent-cpu-static-private-worker-exact-execution-admission'
import {
  AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_NON_PRODUCTION_SERVICE_ROLE_QUEUE_WRITE_SMOKE_PROOF_DECISION,
  type AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokeProofReport,
} from '../tool-registry/ai-graphics-external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-proof'
import {
  AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME,
} from '../tool-registry/ai-graphics-external-agent-cpu-static-private-worker-queue-dry-admission'
import type { ServiceContext } from '../types'

const RUNNER_DECISION =
  'ai_graphics_external_agent_cpu_static_private_worker_claim_and_dispatch_smoke_runner_prepared_with_runtime_blocks'

const executeFlag =
  '--execute-ai-graphics-external-agent-cpu-static-worker-claim-and-dispatch-smoke'
const operatorPreflightFlag = '--operator-preflight'

const proofTools = ['d3', 'vega_lite', 'vega', 'svgdotjs_svg_js', 'viz_js'] as const

const sourceQueueWriteSmokeProofPath =
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-proof.json'
const sourceExactExecutionAdmissionPath =
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-exact-execution-admission.json'
const localOnlySuggestedResultPath =
  '.local-artifacts/ai-graphics/external-agent/cpu-static-private-worker/claim-and-dispatch-smoke-result.json'

const requiredEnv = [
  'REEDITPRO_CONFIRM_AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_WORKER_CLAIM_AND_DISPATCH_SMOKE=true',
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
  '--source-service-role-queue-write-smoke-proof-packet',
  '--source-exact-execution-admission-packet',
  '--service-role-boundary-ref',
  '--private-evidence-ref',
  '--telemetry-ref',
  '--lease-audit-ref',
  '--cleanup-proof-ref',
  '--rollback-ref',
  '--output-result',
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
  if (!value) throw new Error(`Missing required flag for CPU/static claim/dispatch smoke: ${flag}`)
  return value
}

function readJsonFile<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T
}

function isPlaceholderValue(value: string): boolean {
  const trimmed = value.trim()
  return trimmed.length === 0 || /^<[^>]+>$/.test(trimmed) || trimmed.includes('<') || trimmed.includes('>')
}

function flagValueRejection(flag: string, value: string): string | null {
  if (isPlaceholderValue(value)) {
    return `${flag} must be a real non-production value, not a placeholder`
  }
  if (/\s/.test(value)) return `${flag} must not contain whitespace`
  if (flag === '--idempotency-prefix') {
    return /^[a-z0-9][a-z0-9:_-]{15,160}$/i.test(value) && value.includes('smoke')
      ? null
      : `${flag} must be a unique smoke idempotency prefix with 16-160 safe characters`
  }
  if (
    flag === '--source-service-role-queue-write-smoke-proof-packet' ||
    flag === '--source-exact-execution-admission-packet'
  ) {
    return value.endsWith('.json') && !value.includes('..')
      ? null
      : `${flag} must point at a JSON source packet without parent traversal`
  }
  if (flag === '--service-role-boundary-ref') {
    return value.startsWith('service-role-boundary://')
      ? null
      : `${flag} must use a service-role-boundary:// reference`
  }
  if (
    flag === '--private-evidence-ref' ||
    flag === '--telemetry-ref' ||
    flag === '--lease-audit-ref' ||
    flag === '--cleanup-proof-ref' ||
    flag === '--rollback-ref'
  ) {
    return value.startsWith('private://') ? null : `${flag} must use a private:// reference`
  }
  if (flag === '--output-result') {
    return value === localOnlySuggestedResultPath
      ? null
      : `${flag} must write only to ${localOnlySuggestedResultPath}`
  }
  return value.length >= 4 ? null : `${flag} must be at least four characters`
}

function invalidFlagValueFindings(): Array<{ flag: string; value: string; reason: string }> {
  return requiredFlags
    .filter((flag) => flag !== executeFlag)
    .map((flag) => {
      const value = valueAfterFlag(flag)
      if (!value) return undefined
      const reason = flagValueRejection(flag, value)
      return reason ? { flag, value, reason } : undefined
    })
    .filter((entry): entry is { flag: string; value: string; reason: string } => Boolean(entry))
}

function assertRuntimeFlagValues(): void {
  const invalidFlagValues = invalidFlagValueFindings()
  if (invalidFlagValues.length > 0) {
    throw new Error(
      `CPU/static worker claim/dispatch smoke received unsafe runtime flag values: ${invalidFlagValues
        .map((entry) => `${entry.flag}: ${entry.reason}`)
        .join('; ')}`,
    )
  }
}

function preparedContract() {
  return {
    ok: true,
    decision: RUNNER_DECISION,
    status:
      'external_agent_cpu_static_private_worker_claim_and_dispatch_smoke_runner_prepared_not_executed',
    preparedScript:
      'ai-graphics:external-agent-cpu-static-private-worker-claim-and-dispatch-smoke',
    executeFlagRequired: executeFlag,
    operatorPreflightFlag,
    sourceQueueWriteSmokeProofPacket: sourceQueueWriteSmokeProofPath,
    sourceExactExecutionAdmissionPacket: sourceExactExecutionAdmissionPath,
    requiredEnv,
    requiredFlags,
    localOnlySuggestedResultPath,
    validatorCommand:
      'npm run ai-graphics:external-agent-cpu-static-private-worker-claim-and-dispatch-smoke-proof -- --external-agent-cpu-static-worker-claim-and-dispatch-smoke-result <local-result.json> --print-only',
    toolsClaimed: 5,
    toolsClaimedIds: [...proofTools],
    queueName: AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME,
    expectedQueueRowsRead: 5,
    expectedWorkerClaimsCreated: 5,
    expectedWorkerDispatchHandoffsCreated: 5,
    expectedWorkerDispatchLeasesReleased: 5,
    expectedWorkerExecutionsPerformed: 0,
    expectedToolExecutionsPerformed: 0,
    expectedQueueRowsCleanedUp: 5,
    expectedQueueRowsPersistedAfterCleanup: 0,
    liveWorkerClaimAndDispatchSmokeExecutedNow: false,
    liveSupabaseQueueWritesNow: 0,
    liveWorkerClaimsNow: 0,
    liveWorkerDispatchHandoffsNow: 0,
    agentCanExecuteToolsNow: false,
    workerClaimApprovedNow: false,
    workerDispatchApprovedNow: false,
    workerExecutionApprovedNow: false,
    toolExecutionApprovedNow: false,
    gpuRuntimeShouldStartNow: false,
    runtimeReadyNow: false,
    externalBetaReadyNow: false,
    productionReadyNow: false,
    booleans: {
      externalAgentCpuStaticPrivateWorkerClaimAndDispatchSmokeRunnerPrepared:
        true,
      exactFiveCpuStaticToolsOnly: true,
      sourceQueueWriteSmokeProofPacketRequired: true,
      sourceExactExecutionAdmissionPacketRequired: true,
      serverOnlyServiceRoleCredentialsRequired: true,
      nonProductionEnvironmentRequired: true,
      explicitOperatorConfirmationRequired: true,
      cleanupRequired: true,
      workerClaimsReleasedByCleanupRequired: true,
      savedResultMustBeValidatedSeparately: true,
      agentCanSelectForPlanning: true,
      externalAgentCanSubmitPrivateWorkerQueueNow: false,
      agentCanExecuteToolsNow: false,
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
      backendQueueSubmissionPerformed: false,
      serviceRoleQueueWriteSmokePerformed: false,
      liveQueueWritePerformed: false,
      workerEnqueuePerformed: false,
      workerClaimPerformed: false,
      workerDispatchPerformed: false,
      workerExecutionPerformed: false,
      toolExecutionPerformed: false,
      routeExecutionPerformed: false,
      providerRuntimePerformed: false,
      browserWebglCanvasRuntimePerformed: false,
      gpuRuntimePerformed: false,
      modelWeightsDownloaded: false,
      modelWeightsLoaded: false,
      mediaProcessingPerformed: false,
      supabaseMutationPerformed: false,
      gcsUploadPerformed: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
    },
  }
}

function splitRequiredEnv(entry: string): { name: string; expectedValue?: string } {
  const separator = entry.indexOf('=')
  if (separator === -1) return { name: entry }
  return {
    name: entry.slice(0, separator),
    expectedValue: entry.slice(separator + 1),
  }
}

function requiredFlagSatisfiedForOperatorPreflight(flag: string): boolean {
  if (flag === executeFlag) return hasFlag(flag)
  return hasFlag(flag) && Boolean(valueAfterFlag(flag))
}

function buildOperatorPreflightReport() {
  const missingOrMismatchedEnv = requiredEnv
    .map((entry) => {
      const { name, expectedValue } = splitRequiredEnv(entry)
      const actualValue = process.env[name]
      if (expectedValue == null) {
        return actualValue && actualValue.trim().length > 0
          ? undefined
          : { name, expectedValue: 'present', actualValue: actualValue ?? null }
      }
      return actualValue === expectedValue
        ? undefined
        : { name, expectedValue, actualValue: actualValue ?? null }
    })
    .filter((value): value is { name: string; expectedValue: string; actualValue: string | null } =>
      Boolean(value),
    )
  const missingFlags = requiredFlags.filter(
    (flag) => !requiredFlagSatisfiedForOperatorPreflight(flag),
  )
  const invalidFlagValues = invalidFlagValueFindings()
  const explicitSourceQueueWriteSmokeProofPath = valueAfterFlag(
    '--source-service-role-queue-write-smoke-proof-packet',
  )
  const checkedSourceQueueWriteSmokeProofPath =
    explicitSourceQueueWriteSmokeProofPath ?? sourceQueueWriteSmokeProofPath
  const explicitSourceExactExecutionAdmissionPath = valueAfterFlag(
    '--source-exact-execution-admission-packet',
  )
  const checkedSourceExactExecutionAdmissionPath =
    explicitSourceExactExecutionAdmissionPath ?? sourceExactExecutionAdmissionPath

  const sourceQueueWriteSmokeProofExists = fs.existsSync(checkedSourceQueueWriteSmokeProofPath)
  let sourceQueueWriteSmokeProofAccepted = false
  let sourceQueueWriteSmokeProofError: string | null = null
  if (sourceQueueWriteSmokeProofExists) {
    try {
      const sourceQueueWriteSmokeProof = readJsonFile<
        AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokeProofReport
      >(checkedSourceQueueWriteSmokeProofPath)
      requireAcceptedQueueWriteSmokeProof(sourceQueueWriteSmokeProof)
      sourceQueueWriteSmokeProofAccepted = true
    } catch (error) {
      sourceQueueWriteSmokeProofError = error instanceof Error ? error.message : String(error)
    }
  } else {
    sourceQueueWriteSmokeProofError = 'source queue-write smoke proof packet is missing'
  }

  const sourceExactExecutionAdmissionExists = fs.existsSync(checkedSourceExactExecutionAdmissionPath)
  let sourceExactExecutionAdmissionAccepted = false
  let sourceExactExecutionAdmissionError: string | null = null
  if (sourceExactExecutionAdmissionExists) {
    try {
      const sourceExactExecutionAdmission = readJsonFile<
        AiGraphicsExternalAgentCpuStaticPrivateWorkerExactExecutionAdmissionReport
      >(checkedSourceExactExecutionAdmissionPath)
      acceptedExactExecutionAdmissionRows(sourceExactExecutionAdmission)
      sourceExactExecutionAdmissionAccepted = true
    } catch (error) {
      sourceExactExecutionAdmissionError = error instanceof Error ? error.message : String(error)
    }
  } else {
    sourceExactExecutionAdmissionError = 'source exact execution admission packet is missing'
  }

  const productionBlocked = hasFlag('--production') || process.env.NODE_ENV === 'production'
  const canRunClaimAndDispatchSmokeNow =
    missingOrMismatchedEnv.length === 0 &&
    missingFlags.length === 0 &&
    invalidFlagValues.length === 0 &&
    sourceQueueWriteSmokeProofAccepted &&
    sourceExactExecutionAdmissionAccepted &&
    productionBlocked === false

  return {
    ok: true,
    decision:
      'ai_graphics_external_agent_cpu_static_private_worker_claim_and_dispatch_smoke_operator_preflight_completed_with_runtime_blocks',
    status: canRunClaimAndDispatchSmokeNow
      ? 'external_agent_cpu_static_private_worker_claim_and_dispatch_smoke_operator_preflight_ready_for_explicit_non_production_run'
      : 'external_agent_cpu_static_private_worker_claim_and_dispatch_smoke_operator_preflight_blocked_pending_runtime_prerequisites',
    operatorPreflightOnly: true,
    canRunClaimAndDispatchSmokeNow,
    preparedScript:
      'ai-graphics:external-agent-cpu-static-private-worker-claim-and-dispatch-smoke',
    executeFlagRequired: executeFlag,
    sourceQueueWriteSmokeProofPacket: checkedSourceQueueWriteSmokeProofPath,
    sourceExactExecutionAdmissionPacket: checkedSourceExactExecutionAdmissionPath,
    sourceQueueWriteSmokeProofChecks: {
      sourceQueueWriteSmokeProofExists,
      sourceQueueWriteSmokeProofAccepted,
      sourceQueueWriteSmokeProofError,
    },
    sourceExactExecutionAdmissionChecks: {
      sourceExactExecutionAdmissionExists,
      sourceExactExecutionAdmissionAccepted,
      sourceExactExecutionAdmissionError,
    },
    missingOrMismatchedEnv,
    missingFlags,
    invalidFlagValues,
    productionBlocked,
    requiredEnv,
    requiredFlags,
    toolsClaimed: 5,
    toolsClaimedIds: [...proofTools],
    expectedQueueRowsRead: 5,
    expectedWorkerClaimsCreated: 5,
    expectedWorkerDispatchHandoffsCreated: 5,
    expectedWorkerDispatchLeasesReleased: 5,
    expectedWorkerExecutionsPerformed: 0,
    expectedToolExecutionsPerformed: 0,
    expectedQueueRowsCleanedUp: 5,
    expectedQueueRowsPersistedAfterCleanup: 0,
    liveWorkerClaimAndDispatchSmokeExecutedNow: false,
    liveSupabaseQueueWritesNow: 0,
    liveWorkerClaimsNow: 0,
    liveWorkerDispatchHandoffsNow: 0,
    workerExecutionsPerformedNow: 0,
    toolExecutionsPerformedNow: 0,
    agentCanExecuteToolsNow: false,
    liveQueueWriteApprovedNow: false,
    backendQueueSubmissionApprovedNow: false,
    workerEnqueueApprovedNow: false,
    workerClaimApprovedNow: false,
    workerDispatchApprovedNow: false,
    workerExecutionApprovedNow: false,
    toolExecutionApprovedNow: false,
    gpuRuntimeShouldStartNow: false,
    runtimeReadyNow: false,
    externalBetaReadyNow: false,
    productionReadyNow: false,
    booleans: {
      operatorPreflightOnly: true,
      canRunClaimAndDispatchSmokeNow,
      agentCanSelectForPlanning: true,
      externalAgentCanSubmitPrivateWorkerQueueNow: false,
      agentCanExecuteToolsNow: false,
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
      backendQueueSubmissionPerformed: false,
      serviceRoleQueueWriteSmokePerformed: false,
      liveQueueWritePerformed: false,
      workerEnqueuePerformed: false,
      workerClaimPerformed: false,
      workerDispatchPerformed: false,
      workerExecutionPerformed: false,
      toolExecutionPerformed: false,
      routeExecutionPerformed: false,
      providerRuntimePerformed: false,
      browserWebglCanvasRuntimePerformed: false,
      gpuRuntimePerformed: false,
      modelWeightsDownloaded: false,
      modelWeightsLoaded: false,
      mediaProcessingPerformed: false,
      supabaseMutationPerformed: false,
      gcsUploadPerformed: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
    },
  }
}

function assertAllowedToExecute(): void {
  if (
    process.env.REEDITPRO_CONFIRM_AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_WORKER_CLAIM_AND_DISPATCH_SMOKE !==
    'true'
  ) {
    throw new Error(
      'Set REEDITPRO_CONFIRM_AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_WORKER_CLAIM_AND_DISPATCH_SMOKE=true to run the CPU/static worker claim/dispatch smoke.',
    )
  }
  if (
    process.env.REEDITPRO_AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_WORKER_CLAIM_AND_DISPATCH_SMOKE_ENV !==
    'non_production'
  ) {
    throw new Error(
      'CPU/static worker claim/dispatch smoke requires REEDITPRO_AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_WORKER_CLAIM_AND_DISPATCH_SMOKE_ENV=non_production.',
    )
  }
  if (hasFlag('--production') || process.env.NODE_ENV === 'production') {
    throw new Error('CPU/static worker claim/dispatch smoke is blocked in production.')
  }
  if (process.env.E2E_RUNTIME_MODE !== 'local') {
    throw new Error('CPU/static worker claim/dispatch smoke requires E2E_RUNTIME_MODE=local.')
  }
  if (process.env.WORKER_RUNTIME_MODE !== 'mock') {
    throw new Error('CPU/static worker claim/dispatch smoke requires WORKER_RUNTIME_MODE=mock.')
  }
}

function requireAcceptedQueueWriteSmokeProof(
  packet: AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokeProofReport,
): void {
  const accepted =
    packet.decision ===
      AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_NON_PRODUCTION_SERVICE_ROLE_QUEUE_WRITE_SMOKE_PROOF_DECISION &&
    packet.status ===
      'accepted_saved_non_production_service_role_queue_write_smoke_result_execution_blocked' &&
    packet.queueName === AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME &&
    packet.counts?.savedSmokeResultAcceptedToolsWithProvidedEvidence === 5 &&
    packet.counts?.serviceRoleQueueWritesAcceptedWithProvidedEvidence === 5 &&
    packet.counts?.queueRowsPersistedAfterCleanup === 0 &&
    packet.counts?.workerClaimsCreatedNow === 0 &&
    packet.counts?.workerDispatchesPerformedNow === 0 &&
    packet.counts?.workerExecutionsPerformedNow === 0 &&
    packet.counts?.toolExecutionsPerformedNow === 0 &&
    packet.booleans?.serviceRoleQueueWriteSmokeProofAcceptedWithProvidedEvidence === true &&
    packet.booleans?.allFiveCpuStaticSavedSmokeResultsAcceptedWithProvidedEvidence === true &&
    packet.booleans?.cleanupVerifiedWithProvidedEvidence === true &&
    packet.booleans?.agentCanExecuteToolsNow === false &&
    packet.booleans?.workerClaimApprovedNow === false &&
    packet.booleans?.workerDispatchApprovedNow === false &&
    packet.booleans?.toolExecutionApprovedNow === false &&
    packet.booleans?.gpuRuntimeShouldStartNow === false

  if (!accepted) {
    throw new Error(
      'CPU/static worker claim/dispatch smoke requires an accepted non-production service-role queue-write smoke proof packet.',
    )
  }
}

function acceptedExactExecutionAdmissionRows(
  packet: AiGraphicsExternalAgentCpuStaticPrivateWorkerExactExecutionAdmissionReport,
): AiGraphicsExternalAgentCpuStaticPrivateWorkerExactExecutionAdmissionRow[] {
  const rows = packet.rows.filter(
    (row) =>
      proofTools.includes(row.toolId as (typeof proofTools)[number]) &&
      row.externalAgentExactRequestAdmittedWithProvidedEvidence === true &&
      row.exactExecutionAdmissionEvidence != null,
  )
  const accepted =
    packet.decision ===
      AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_EXACT_EXECUTION_ADMISSION_DECISION &&
    packet.status ===
      'external_agent_cpu_static_private_worker_exact_execution_admission_prepared_five_with_runtime_blocks' &&
    packet.queueName === AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME &&
    packet.counts?.exactExecutionAdmissionReadyTools === 5 &&
    packet.counts?.exactRequestEnvelopeAcceptedTools === 5 &&
    packet.counts?.approvedPlanSnapshotAcceptedTools === 5 &&
    packet.counts?.creditReservationAcceptedTools === 5 &&
    packet.counts?.privateArtifactManifestAcceptedTools === 5 &&
    packet.counts?.workerAcceptedRequestSchemaAcceptedTools === 5 &&
    packet.counts?.toolSpecificQaGateAcceptedTools === 5 &&
    packet.booleans?.allFiveExactExecutionAdmissionsReady === true &&
    packet.booleans?.exactExecutionAdmissionRefsPreserved === true &&
    packet.booleans?.agentCanExecuteToolsNow === false &&
    packet.booleans?.workerClaimApprovedNow === false &&
    packet.booleans?.workerDispatchApprovedNow === false &&
    packet.booleans?.toolExecutionApprovedNow === false &&
    packet.booleans?.gpuRuntimeShouldStartNow === false &&
    rows.length === 5 &&
    proofTools.every((toolId) => rows.some((row) => row.toolId === toolId))

  if (!accepted) {
    throw new Error(
      'CPU/static worker claim/dispatch smoke requires the accepted exact execution admission packet for the five CPU/static tools.',
    )
  }
  return rows
}

async function deleteRows(
  admin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  table: string,
  column: string,
  values: string[],
): Promise<void> {
  if (values.length === 0) return
  const { error } = await admin.from(table).delete().in(column, values)
  if (error) throw error
}

async function countRows(
  admin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  table: string,
  column: string,
  values: string[],
): Promise<number> {
  if (values.length === 0) return 0
  const { count, error } = await admin
    .from(table)
    .select(column, { count: 'exact', head: true })
    .in(column, values)
  if (error) throw error
  return count ?? 0
}

async function cleanupSmokeRows(
  admin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  input: { jobBatchId?: string; jobIds: string[]; idempotencyPrefix: string },
): Promise<{
  jobRowsPersistedAfterCleanup: number
  workerClaimRowsPersistedAfterCleanup: number
  jobEventRowsPersistedAfterCleanup: number
}> {
  await deleteRows(admin, 'job_events', 'job_id', input.jobIds)
  await deleteRows(admin, 'worker_job_claims', 'job_id', input.jobIds)
  await deleteRows(admin, 'jobs', 'id', input.jobIds)
  await deleteRows(admin, 'job_batches', 'id', input.jobBatchId ? [input.jobBatchId] : [])
  const { error } = await admin
    .from('audit_events')
    .delete()
    .eq(
      'event_type',
      'ai_graphics_external_agent_cpu_static_worker_claim_and_dispatch_smoke',
    )
    .contains('event_json', { idempotencyPrefix: input.idempotencyPrefix })
  if (error) throw error
  return {
    jobRowsPersistedAfterCleanup: await countRows(admin, 'jobs', 'id', input.jobIds),
    workerClaimRowsPersistedAfterCleanup: await countRows(
      admin,
      'worker_job_claims',
      'job_id',
      input.jobIds,
    ),
    jobEventRowsPersistedAfterCleanup: await countRows(
      admin,
      'job_events',
      'job_id',
      input.jobIds,
    ),
  }
}

function buildJobs(
  rows: AiGraphicsExternalAgentCpuStaticPrivateWorkerExactExecutionAdmissionRow[],
  idempotencyPrefix: string,
) {
  return rows.map((row) => {
    const readiness = getAiGraphicsToolCallReadiness(row.toolId)
    const capabilityIds = readiness.capabilities.filter(
      (capability) =>
        capability !== 'planning_metadata_only' &&
        capability !== 'blocked_or_deferred',
    )
    return {
      toolId: row.toolId,
      productionToolId: row.productionToolId,
      workerType: row.workerType,
      runtimeTarget: row.runtimeTarget,
      capabilityIds,
      privateArtifactManifestRef:
        row.exactExecutionAdmissionEvidence?.privateArtifactManifestRef ?? '',
      idempotencyKey: `${idempotencyPrefix}:job:${row.toolId}`,
      priority: 'normal' as const,
      maxAttempts: 1,
      inputPayload: {
        smokeOnly: true,
        externalAgentCpuStaticWorkerClaimAndDispatchSmoke: true,
        aiGraphicsCanonicalToolId: row.toolId,
        productionToolId: row.productionToolId,
        runtimeTarget: row.runtimeTarget,
        sourceQueueWriteSmokeProofDecision:
          AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_NON_PRODUCTION_SERVICE_ROLE_QUEUE_WRITE_SMOKE_PROOF_DECISION,
        sourceExactExecutionAdmissionDecision:
          AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_EXACT_EXECUTION_ADMISSION_DECISION,
        approvedPlanSnapshotRef:
          row.exactExecutionAdmissionEvidence?.approvedPlanSnapshotRef,
        creditReservationRef:
          row.exactExecutionAdmissionEvidence?.creditReservationRef,
        privateArtifactManifestRef:
          row.exactExecutionAdmissionEvidence?.privateArtifactManifestRef,
        workerAcceptedRequestSchemaRef:
          row.exactExecutionAdmissionEvidence?.workerAcceptedRequestSchemaRef,
        toolSpecificQaGateRef:
          row.exactExecutionAdmissionEvidence?.toolSpecificQaGateRef,
        workerExecutionApprovedNow: false,
        toolExecutionApprovedNow: false,
        gpuRuntimeShouldStartNow: false,
      },
    }
  })
}

async function executeSmoke(): Promise<AiGraphicsExternalAgentCpuStaticPrivateWorkerClaimAndDispatchSmokeResult> {
  assertAllowedToExecute()
  assertRuntimeFlagValues()
  const sourceQueueWriteSmokeProof = readJsonFile<
    AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokeProofReport
  >(requiredFlag('--source-service-role-queue-write-smoke-proof-packet'))
  requireAcceptedQueueWriteSmokeProof(sourceQueueWriteSmokeProof)
  const sourceExactExecutionAdmission = readJsonFile<
    AiGraphicsExternalAgentCpuStaticPrivateWorkerExactExecutionAdmissionReport
  >(requiredFlag('--source-exact-execution-admission-packet'))
  const rows = acceptedExactExecutionAdmissionRows(sourceExactExecutionAdmission)
  const runtimeEnv = loadRuntimeEnv({
    ...process.env,
    E2E_RUNTIME_MODE: 'local',
    WORKER_RUNTIME_MODE: 'mock',
  })
  const admin = createSupabaseAdminClient(runtimeEnv)
  if (!admin || runtimeEnv.mockOnly) {
    throw new Error(
      'CPU/static worker claim/dispatch smoke requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in server env.',
    )
  }

  const workspaceId = requiredFlag('--workspace-id')
  const projectId = requiredFlag('--project-id')
  const approvedPlanSnapshotId = requiredFlag('--approved-plan-snapshot-id')
  const creditReservationId = requiredFlag('--credit-reservation-id')
  const idempotencyPrefix = requiredFlag('--idempotency-prefix')
  const serviceRoleBoundaryRef = requiredFlag('--service-role-boundary-ref')
  const privateEvidenceRef = requiredFlag('--private-evidence-ref')
  const telemetryRef = requiredFlag('--telemetry-ref')
  const leaseAuditRef = requiredFlag('--lease-audit-ref')
  const cleanupProofRef = requiredFlag('--cleanup-proof-ref')
  const rollbackRef = requiredFlag('--rollback-ref')
  requiredFlag('--output-result')
  const workerInstanceId =
    valueAfterFlag('--worker-instance-id') ??
    'ai-graphics-external-agent-cpu-static-claim-dispatch-smoke-worker'

  const context: ServiceContext = {
    env: runtimeEnv,
    clients: { admin, public: null },
    requestId: 'ai-graphics-external-agent-cpu-static-worker-claim-dispatch-smoke',
    auth: {
      userId: 'ai-graphics-external-agent-cpu-static-worker-claim-dispatch-smoke',
      isMockUser: true,
    },
  }
  const service = createAiGraphicsToolRuntimeQueueService(context)
  const jobs = buildJobs(rows, idempotencyPrefix)
  const queue = await service.enqueueToolRuntimeJobs({
    workspaceId,
    projectId,
    approvedPlanSnapshotId,
    creditReservationId,
    jobs,
    idempotencyKey: `${idempotencyPrefix}:batch`,
    batchName: 'AI graphics external-agent CPU/static worker claim dispatch smoke',
    createdByAgent:
      'ai_graphics_external_agent_cpu_static_worker_claim_dispatch_smoke',
  })
  const queueResult = queue.queueResult as {
    jobBatchId?: string
    jobIds?: string[]
    insertedJobCount?: number
  }
  const jobIds = queueResult.jobIds ?? []
  if (
    jobIds.length !== 5 ||
    (typeof queueResult.insertedJobCount === 'number' &&
      queueResult.insertedJobCount !== 5)
  ) {
    await cleanupSmokeRows(admin, {
      jobBatchId: queueResult.jobBatchId,
      jobIds,
      idempotencyPrefix,
    })
    throw new Error(
      `CPU/static worker claim/dispatch smoke expected five inserted rows, received ${jobIds.length}.`,
    )
  }

  const claims = []
  let workerDispatchHandoffsCreated = 0
  let cleanupSummary: Awaited<ReturnType<typeof cleanupSmokeRows>> | undefined
  try {
    for (const [index, jobId] of jobIds.entries()) {
      const job = jobs[index]
      const claim = await service.claimToolRuntimeJob({
        jobId,
        workerType: job.workerType,
        workerInstanceId,
        idempotencyKey: `${idempotencyPrefix}:claim:${job.toolId}`,
        leaseSeconds: 60,
      })
      claims.push(claim.claimResult)
      await service.recordWorkerEvent({
        jobId,
        eventType:
          'ai_graphics_external_agent_cpu_static_worker_claim_dispatch_smoke_handoff',
        message:
          'CPU/static worker claim/dispatch smoke created a private-worker handoff without executing worker code or tools.',
        payload: {
          idempotencyPrefix,
          toolId: job.toolId,
          runtimeTarget: job.runtimeTarget,
          sourceQueueWriteSmokeProofDecision:
            AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_NON_PRODUCTION_SERVICE_ROLE_QUEUE_WRITE_SMOKE_PROOF_DECISION,
          sourceExactExecutionAdmissionDecision:
            AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_EXACT_EXECUTION_ADMISSION_DECISION,
          sourceQueueWriteSmokeProofAccepted: true,
          sourceExactExecutionAdmissionAccepted: true,
          serviceRoleBoundaryRef,
          privateEvidenceRef,
          telemetryRef,
          leaseAuditRef,
          cleanupProofRef,
          rollbackRef,
          workerExecutionApprovedNow: false,
          toolExecutionApprovedNow: false,
          gpuRuntimeShouldStartNow: false,
        },
        progressPercent: 0,
      })
      workerDispatchHandoffsCreated += 1
    }
    await service.recordAuditEvent({
      workspaceId,
      projectId,
      eventType:
        'ai_graphics_external_agent_cpu_static_worker_claim_and_dispatch_smoke',
      eventJson: {
        idempotencyPrefix,
        jobBatchId: queueResult.jobBatchId,
        jobCount: jobIds.length,
        sourceQueueWriteSmokeProofAccepted: true,
        sourceExactExecutionAdmissionAccepted: true,
        serviceRoleBoundaryRef,
        privateEvidenceRef,
        telemetryRef,
        leaseAuditRef,
        cleanupProofRef,
        rollbackRef,
        workerExecutionApprovedNow: false,
        toolExecutionApprovedNow: false,
        gpuRuntimeShouldStartNow: false,
      },
      actorUserId: undefined,
    })
  } finally {
    cleanupSummary = await cleanupSmokeRows(admin, {
      jobBatchId: queueResult.jobBatchId,
      jobIds,
      idempotencyPrefix,
    })
  }

  if (
    claims.length !== 5 ||
    workerDispatchHandoffsCreated !== 5 ||
    cleanupSummary.jobRowsPersistedAfterCleanup !== 0 ||
    cleanupSummary.workerClaimRowsPersistedAfterCleanup !== 0 ||
    cleanupSummary.jobEventRowsPersistedAfterCleanup !== 0
  ) {
    throw new Error(
      'CPU/static worker claim/dispatch smoke must claim five jobs, create five handoffs, and leave zero job/claim/event rows after cleanup.',
    )
  }

  return {
    ok: true,
    decision:
      'ai_graphics_external_agent_cpu_static_private_worker_claim_and_dispatch_smoke_passed_with_cleanup',
    status:
      'non_production_worker_claim_and_dispatch_smoke_passed_with_cleanup_no_tool_execution',
    queueName: AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME,
    toolsClaimed: 5,
    toolsClaimedIds: [...proofTools] as AiGraphicsCanonicalToolId[],
    queueRowsRead: 5,
    workerClaimsCreated: 5,
    workerDispatchHandoffsCreated: 5,
    workerDispatchLeasesReleased: 5,
    workerExecutionsPerformed: 0,
    toolExecutionsPerformed: 0,
    queueRowsCleanedUp: 5,
    queueRowsPersistedAfterCleanup: 0,
    serviceRoleBoundaryRef,
    privateEvidenceRef,
    telemetryRef,
    leaseAuditRef,
    cleanupProofRef,
    rollbackRef,
    sourceQueueWriteSmokeProofDecision:
      AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_NON_PRODUCTION_SERVICE_ROLE_QUEUE_WRITE_SMOKE_PROOF_DECISION,
    sourceQueueWriteSmokeProofAccepted: true,
    liveWorkerClaimAndDispatchSmokeExecutedNow: true,
    publicArtifactCreated: false,
    signedUrlCreated: false,
    gpuRuntimeShouldStartNow: false,
    externalAgentExecutableNowTools: 0,
    runtimeReadyNow: false,
    externalBetaReadyNow: false,
    productionReadyNow: false,
  }
}

async function main(): Promise<void> {
  if (hasFlag(operatorPreflightFlag)) {
    console.log(JSON.stringify(buildOperatorPreflightReport(), null, 2))
    return
  }
  if (!hasFlag(executeFlag)) {
    console.log(JSON.stringify(preparedContract(), null, 2))
    return
  }
  const result = await executeSmoke()
  const outputPath = valueAfterFlag('--output-result')
  if (outputPath) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true })
    fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`)
  }
  console.log(JSON.stringify(result, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
