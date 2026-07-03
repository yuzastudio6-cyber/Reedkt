import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

import {
  TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_JOB_TYPE,
  TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_PACKET,
  TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_PAYLOAD_KIND,
  TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_ROUTE_PATH,
  buildThreeToolExternalAgentPersistedJobRuntimeHandoffInput,
} from './tracka-three-tool-external-agent-persisted-job-runtime-handoff-1'

export const TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_ROUTE_INVOCATION_PACKET =
  'TRACKA-THREE-TOOL-EXTERNAL-AGENT-PERSISTED-JOB-ROUTE-INVOCATION-1' as const

export const TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_ROUTE_INVOCATION_DECISION =
  'completed_three_tool_external_agent_persisted_job_payload_to_runtime_route_invocation' as const

export const TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_ROUTE_INVOCATION_EXECUTION =
  'completed_persisted_job_payload_to_three_tool_approved_snapshot_runtime_delegate_generated_fixture_only' as const

export const TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_ROUTE_INVOCATION_CONFIRM_ENV =
  'REEDITPRO_CONFIRM_TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_ROUTE_INVOCATION' as const

export const TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_ROUTE_INVOCATION_ROUTE_PATH =
  '/v1/external-beta/tracka/three-tool/generated-fixture-runtime/approved-snapshot/jobs/persisted-invoke' as const

export const TRACKA_THREE_TOOL_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_EXECUTION_CONFIRM_ENV =
  'REEDITPRO_CONFIRM_TRACKA_THREE_TOOL_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_EXECUTION' as const

export const TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_ROUTE_INVOCATION_NEXT_MILESTONE =
  'TRACKA-THREE-TOOL-EXTERNAL-AGENT-WORKER-DISPATCH-CLAIM-LEASE-1' as const

export type ThreeToolExternalAgentPersistedJobRouteInvocationStatus =
  | 'completed_persisted_job_route_invocation'
  | 'blocked_pending_three_tool_persisted_job_route_invocation_confirmation'
  | 'blocked_missing_three_tool_persisted_job_route_invocation_reference'
  | 'blocked_invalid_three_tool_persisted_job_route_invocation_state'
  | 'blocked_missing_three_tool_persisted_job_payload'
  | 'blocked_three_tool_persisted_job_route_invocation_unsafe_request'
  | 'blocked_three_tool_approved_snapshot_runtime_delegate_failed'
  | 'blocked_three_tool_approved_snapshot_runtime_delegate_safety_invalid'

export interface ThreeToolExternalAgentPersistedJobPayload {
  persistedHandoffId: string
  packet: typeof TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_PACKET | string
  persistedJobPayloadKind?: typeof TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_PAYLOAD_KIND | string
  sourceApprovedSnapshotJobExecution: {
    mergeSha: string
    runId: string
    childRunId: string
    recordPath: string
    decision: string
  }
  tools: readonly string[]
  approvedSnapshotRuntimeEnvelope: {
    workspaceId: string
    projectId: string
    editSessionId?: string | null
    approvedSnapshotId: string
    approvalRecordId: string
    creditPolicyRef?: string | null
    jobId: string
    runtimePacketId?: string | null
    runtimeExecutionId?: string | null
    privateInputManifestId?: string | null
    outputManifestSchemaId?: string | null
    qaReportSchemaId?: string | null
    cleanupPolicyId?: string | null
    retentionPolicyId?: string | null
    failurePolicyId?: string | null
  }
  safety?: Record<string, unknown>
}

export interface ThreeToolExternalAgentPersistedJobRouteInvocationInput {
  workspaceId: string
  projectId: string
  approvedSnapshotId: string
  persistedInvocationId: string
  persistedJobId: string
  persistedJobType: typeof TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_JOB_TYPE | string
  persistedJobPayloadMode: 'persisted_job_payload_to_three_tool_approved_snapshot_runtime_delegate' | string
  persistedJobPayloadJson: ThreeToolExternalAgentPersistedJobPayload
  persistedJobRuntimeRouteInvocationConfirmed: boolean
  routeIdempotencyKey: string
  workerDispatchRequestedNow?: boolean
  workerExecutionRequestedNow?: boolean
  workerProcessStartRequestedNow?: boolean
  workerLeaseClaimRequestedNow?: boolean
  persistentJobQueueWriteRequestedNow?: boolean
  privateMediaProcessingRequestedNow?: boolean
  userMediaProcessingRequestedNow?: boolean
  ffmpegFfprobeExecutionRequestedNow?: boolean
  dockerPushDeployRequestedNow?: boolean
  remotionExecutionRequestedNow?: boolean
  supabaseMutationRequestedNow?: boolean
  sqlExecutionRequestedNow?: boolean
  secretPayloadAccessRequestedNow?: boolean
  serviceRoleSecretPayloadAccessRequestedNow?: boolean
  signedUrlCreationRequestedNow?: boolean
  publicArtifactRequestedNow?: boolean
  finalRenderExportRequestedNow?: boolean
  externalBetaUnlockRequestedNow?: boolean
  paidProductionUnlockRequestedNow?: boolean
  productionUnlockRequestedNow?: boolean
}

export interface ThreeToolExternalAgentApprovedSnapshotRunnerSummary {
  packet?: string
  decision: string
  execution: string
  runId: string
  outputDir: string
  report: string
  manifest: string
  artifacts: Array<{ fileName: string; bytes: number; sha256: string }>
}

export interface ThreeToolExternalAgentPersistedJobRouteInvocationResult {
  packet: typeof TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_ROUTE_INVOCATION_PACKET
  decision: typeof TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_ROUTE_INVOCATION_DECISION
  execution: typeof TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_ROUTE_INVOCATION_EXECUTION
  ok: boolean
  status: ThreeToolExternalAgentPersistedJobRouteInvocationStatus
  blockers: ThreeToolExternalAgentPersistedJobRouteInvocationStatus[]
  confirmationGate: typeof TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_ROUTE_INVOCATION_CONFIRM_ENV
  approvedSnapshotExecutionConfirmationGate:
    typeof TRACKA_THREE_TOOL_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_EXECUTION_CONFIRM_ENV
  routePath: typeof TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_ROUTE_INVOCATION_ROUTE_PATH
  persistedHandoffRoutePath: typeof TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_ROUTE_PATH
  runtimeDelegateResult?: ThreeToolExternalAgentApprovedSnapshotRunnerSummary
  sanitizedInvocation: {
    persistedInvocationId: string
    persistedJobId: string
    persistedJobType: typeof TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_JOB_TYPE
    persistedJobPayloadMode: 'persisted_job_payload_to_three_tool_approved_snapshot_runtime_delegate'
    routeIdempotencyKey: string
    runtimeDelegateRunId: string | null
    runtimeDelegateOutputDir: string | null
    runtimeDelegateArtifacts: Array<{ fileName: string; bytes: number; sha256: string }>
    runtimeRouteInvocation: 'completed_three_tool_approved_snapshot_runtime_delegate' | false
    gstreamerExecution: 'completed_controlled_generated_fixture_only' | false
    mkvtoolnixExecution: 'completed_controlled_generated_fixture_only' | false
    gpacMp4boxExecution: 'completed_controlled_generated_fixture_only' | false
    privateMediaProcessing: false
    userMediaProcessing: false
    workerDispatch: false
    workerExecution: false
    persistentJobQueueWrite: false
    supabaseMutation: false
    sqlExecution: false
    signedUrlCreation: false
    publicArtifactCreation: false
    finalRenderExport: false
  }
  safety: {
    routeHandlerInvocation: 'completed_guarded_three_tool_persisted_job_route_invocation_handler' | 'not_run_blocked_before_invocation'
    persistedJobPayloadRead: 'completed_local_payload_read_only' | false
    runtimeRouteInvocation: 'completed_three_tool_approved_snapshot_runtime_delegate' | false
    workerDispatch: false
    workerExecution: false
    workerProcessStart: false
    workerLeaseClaim: false
    persistentJobQueueWrite: false
    gstreamerExecution: 'completed_controlled_generated_fixture_only' | false
    mkvtoolnixExecution: 'completed_controlled_generated_fixture_only' | false
    gpacMp4boxExecution: 'completed_controlled_generated_fixture_only' | false
    privateMediaProcessing: false
    userMediaProcessing: false
    ffmpegFfprobeExecution: false
    dockerPushDeploy: false
    remotionExecution: false
    supabaseMutation: false
    sqlExecution: false
    secretPayloadAccess: false
    serviceRoleSecretPayloadAccess: false
    signedUrlCreation: false
    publicArtifactCreation: false
    finalRenderExport: false
    externalBetaUnlock: false
    paidProductionUnlock: false
    productionUnlock: false
  }
  productReadyEndToEndLocalOssTools: 0
  nextMilestone: typeof TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_ROUTE_INVOCATION_NEXT_MILESTONE
}

export interface ThreeToolExternalAgentPersistedJobRouteInvocationDependencies {
  env?: NodeJS.ProcessEnv
  runtimeRunner?: () => Promise<ThreeToolExternalAgentApprovedSnapshotRunnerSummary>
}

function pushOnce<T>(list: T[], value: T): void {
  if (!list.includes(value)) list.push(value)
}

function blank(value: unknown): boolean {
  return typeof value !== 'string' || value.trim().length === 0
}

function unsafeRequested(input: ThreeToolExternalAgentPersistedJobRouteInvocationInput): boolean {
  return [
    input.workerDispatchRequestedNow,
    input.workerExecutionRequestedNow,
    input.workerProcessStartRequestedNow,
    input.workerLeaseClaimRequestedNow,
    input.persistentJobQueueWriteRequestedNow,
    input.privateMediaProcessingRequestedNow,
    input.userMediaProcessingRequestedNow,
    input.ffmpegFfprobeExecutionRequestedNow,
    input.dockerPushDeployRequestedNow,
    input.remotionExecutionRequestedNow,
    input.supabaseMutationRequestedNow,
    input.sqlExecutionRequestedNow,
    input.secretPayloadAccessRequestedNow,
    input.serviceRoleSecretPayloadAccessRequestedNow,
    input.signedUrlCreationRequestedNow,
    input.publicArtifactRequestedNow,
    input.finalRenderExportRequestedNow,
    input.externalBetaUnlockRequestedNow,
    input.paidProductionUnlockRequestedNow,
    input.productionUnlockRequestedNow,
  ].some(Boolean)
}

function expectedRouteIdempotencyKey(
  input: Pick<
    ThreeToolExternalAgentPersistedJobRouteInvocationInput,
    'workspaceId' | 'projectId' | 'approvedSnapshotId' | 'persistedInvocationId' | 'persistedJobId'
  >,
): string {
  return [
    'tracka-three-tool',
    'persisted-job-route-invocation-1',
    input.workspaceId,
    input.projectId,
    input.approvedSnapshotId,
    input.persistedJobId,
    input.persistedInvocationId,
  ].join(':')
}

export function buildThreeToolExternalAgentPersistedJobRouteInvocationInput(
  overrides: Partial<ThreeToolExternalAgentPersistedJobRouteInvocationInput> = {},
): ThreeToolExternalAgentPersistedJobRouteInvocationInput {
  const handoff = buildThreeToolExternalAgentPersistedJobRuntimeHandoffInput()
  const payload = overrides.persistedJobPayloadJson ?? {
    persistedHandoffId: handoff.persistedHandoffId ?? 'persisted-handoff-three-tool-external-agent-generated-fixture-1',
    packet: TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_PACKET,
    persistedJobPayloadKind: TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_PAYLOAD_KIND,
    sourceApprovedSnapshotJobExecution: {
      mergeSha: '47a3a5f358f7a00f451b9fef277ed0b66251c9e0',
      runId: '2026-07-03T03-41-30-494Z-41a3b873',
      childRunId: '2026-07-03T03-41-30-650Z-41ce5185',
      recordPath:
        'docs/external-beta/tracka-three-tool-external-agent-approved-snapshot-job-execution-1/tracka-three-tool-external-agent-approved-snapshot-job-execution-1-record.json',
      decision: 'completed_three_tool_external_agent_approved_snapshot_job_execution',
    },
    tools: [
      'gstreamer_render_pipeline_support',
      'mkvtoolnix_container_validation',
      'gpac_mp4box_packaging_validation',
    ],
    approvedSnapshotRuntimeEnvelope: {
      workspaceId: handoff.workspaceId ?? '',
      projectId: handoff.projectId ?? '',
      editSessionId: handoff.editSessionId,
      approvedSnapshotId: handoff.approvedSnapshotId ?? '',
      approvalRecordId: handoff.approvalRecordId ?? '',
      creditPolicyRef: handoff.creditPolicyRef,
      jobId: handoff.jobId ?? '',
      runtimePacketId: handoff.runtimePacketId,
      runtimeExecutionId: handoff.runtimeExecutionId,
      privateInputManifestId: handoff.privateInputManifestId,
      outputManifestSchemaId: handoff.outputManifestSchemaId,
      qaReportSchemaId: handoff.qaReportSchemaId,
      cleanupPolicyId: handoff.cleanupPolicyId,
      retentionPolicyId: handoff.retentionPolicyId,
      failurePolicyId: handoff.failurePolicyId,
    },
    safety: {
      privateMediaProcessing: false,
      userMediaProcessing: false,
      signedUrlCreation: false,
      publicArtifactCreation: false,
      finalRenderExport: false,
    },
  }
  const base = {
    workspaceId: overrides.workspaceId ?? payload.approvedSnapshotRuntimeEnvelope.workspaceId,
    projectId: overrides.projectId ?? payload.approvedSnapshotRuntimeEnvelope.projectId,
    approvedSnapshotId: overrides.approvedSnapshotId ?? payload.approvedSnapshotRuntimeEnvelope.approvedSnapshotId,
    persistedInvocationId: overrides.persistedInvocationId ?? 'persisted-invocation-three-tool-external-agent-generated-fixture-1',
    persistedJobId: overrides.persistedJobId ?? 'job-persisted-three-tool-external-agent-generated-fixture-runtime-1',
    persistedJobType: overrides.persistedJobType ?? TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_JOB_TYPE,
    persistedJobPayloadMode:
      overrides.persistedJobPayloadMode ?? 'persisted_job_payload_to_three_tool_approved_snapshot_runtime_delegate',
    persistedJobPayloadJson: payload,
    persistedJobRuntimeRouteInvocationConfirmed: overrides.persistedJobRuntimeRouteInvocationConfirmed ?? true,
    workerDispatchRequestedNow: overrides.workerDispatchRequestedNow ?? false,
    workerExecutionRequestedNow: overrides.workerExecutionRequestedNow ?? false,
    workerProcessStartRequestedNow: overrides.workerProcessStartRequestedNow ?? false,
    workerLeaseClaimRequestedNow: overrides.workerLeaseClaimRequestedNow ?? false,
    persistentJobQueueWriteRequestedNow: overrides.persistentJobQueueWriteRequestedNow ?? false,
    privateMediaProcessingRequestedNow: overrides.privateMediaProcessingRequestedNow ?? false,
    userMediaProcessingRequestedNow: overrides.userMediaProcessingRequestedNow ?? false,
    ffmpegFfprobeExecutionRequestedNow: overrides.ffmpegFfprobeExecutionRequestedNow ?? false,
    dockerPushDeployRequestedNow: overrides.dockerPushDeployRequestedNow ?? false,
    remotionExecutionRequestedNow: overrides.remotionExecutionRequestedNow ?? false,
    supabaseMutationRequestedNow: overrides.supabaseMutationRequestedNow ?? false,
    sqlExecutionRequestedNow: overrides.sqlExecutionRequestedNow ?? false,
    secretPayloadAccessRequestedNow: overrides.secretPayloadAccessRequestedNow ?? false,
    serviceRoleSecretPayloadAccessRequestedNow: overrides.serviceRoleSecretPayloadAccessRequestedNow ?? false,
    signedUrlCreationRequestedNow: overrides.signedUrlCreationRequestedNow ?? false,
    publicArtifactRequestedNow: overrides.publicArtifactRequestedNow ?? false,
    finalRenderExportRequestedNow: overrides.finalRenderExportRequestedNow ?? false,
    externalBetaUnlockRequestedNow: overrides.externalBetaUnlockRequestedNow ?? false,
    paidProductionUnlockRequestedNow: overrides.paidProductionUnlockRequestedNow ?? false,
    productionUnlockRequestedNow: overrides.productionUnlockRequestedNow ?? false,
  }
  return {
    ...base,
    routeIdempotencyKey: overrides.routeIdempotencyKey ?? expectedRouteIdempotencyKey(base),
  }
}

export function validateThreeToolExternalAgentPersistedJobRouteInvocationInput(
  input: ThreeToolExternalAgentPersistedJobRouteInvocationInput,
): ThreeToolExternalAgentPersistedJobRouteInvocationStatus[] {
  const blockers: ThreeToolExternalAgentPersistedJobRouteInvocationStatus[] = []
  const payload = input.persistedJobPayloadJson
  const envelope = payload?.approvedSnapshotRuntimeEnvelope

  if (!input.persistedJobRuntimeRouteInvocationConfirmed) {
    pushOnce(blockers, 'blocked_pending_three_tool_persisted_job_route_invocation_confirmation')
  }
  for (const value of [
    input.workspaceId,
    input.projectId,
    input.approvedSnapshotId,
    input.persistedInvocationId,
    input.persistedJobId,
    input.routeIdempotencyKey,
  ]) {
    if (blank(value)) pushOnce(blockers, 'blocked_missing_three_tool_persisted_job_route_invocation_reference')
  }
  if (!payload || !envelope) pushOnce(blockers, 'blocked_missing_three_tool_persisted_job_payload')
  if (
    input.persistedJobType !== TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_JOB_TYPE ||
    input.persistedJobPayloadMode !== 'persisted_job_payload_to_three_tool_approved_snapshot_runtime_delegate' ||
    payload?.packet !== TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_PACKET ||
    payload?.persistedJobPayloadKind !== TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_PAYLOAD_KIND ||
    payload?.sourceApprovedSnapshotJobExecution?.decision !==
      'completed_three_tool_external_agent_approved_snapshot_job_execution' ||
    payload?.sourceApprovedSnapshotJobExecution?.runId !== '2026-07-03T03-41-30-494Z-41a3b873' ||
    payload?.sourceApprovedSnapshotJobExecution?.childRunId !== '2026-07-03T03-41-30-650Z-41ce5185' ||
    envelope?.workspaceId !== input.workspaceId ||
    envelope?.projectId !== input.projectId ||
    envelope?.approvedSnapshotId !== input.approvedSnapshotId
  ) {
    pushOnce(blockers, 'blocked_invalid_three_tool_persisted_job_route_invocation_state')
  }
  if (payload && envelope && input.routeIdempotencyKey !== expectedRouteIdempotencyKey(input)) {
    pushOnce(blockers, 'blocked_invalid_three_tool_persisted_job_route_invocation_state')
  }
  if (unsafeRequested(input)) {
    pushOnce(blockers, 'blocked_three_tool_persisted_job_route_invocation_unsafe_request')
  }
  return blockers
}

async function defaultRuntimeRunner(
  env: NodeJS.ProcessEnv = process.env,
): Promise<ThreeToolExternalAgentApprovedSnapshotRunnerSummary> {
  const output = execFileSync(
    process.execPath,
    ['scripts/validation/tracka-three-tool-external-agent-approved-snapshot-job-execution-1.mjs'],
    {
      env: {
        ...env,
        [TRACKA_THREE_TOOL_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_EXECUTION_CONFIRM_ENV]: 'true',
      },
      encoding: 'utf8',
      timeout: 600000,
    },
  )
  const summary = JSON.parse(output) as ThreeToolExternalAgentApprovedSnapshotRunnerSummary
  if (!fs.existsSync(summary.report)) {
    throw new Error('three-tool approved-snapshot runtime delegate report missing')
  }
  return summary
}

function delegateSafetyValid(result: ThreeToolExternalAgentApprovedSnapshotRunnerSummary): boolean {
  if (
    result.decision !== 'completed_three_tool_external_agent_approved_snapshot_job_execution' ||
    result.execution !== 'completed_confirmation_gated_three_tool_approved_snapshot_job_execution_generated_fixture_only' ||
    !result.runId ||
    !result.outputDir ||
    !Array.isArray(result.artifacts) ||
    result.artifacts.length === 0
  ) {
    return false
  }
  const report = JSON.parse(fs.readFileSync(result.report, 'utf8')) as {
    safety?: Record<string, unknown>
    approvedSnapshotJobExecution?: Record<string, unknown>
  }
  return (
    report.approvedSnapshotJobExecution?.gstreamerExecution === 'completed_controlled_generated_fixture_only' &&
    report.approvedSnapshotJobExecution?.mkvtoolnixExecution === 'completed_controlled_generated_fixture_only' &&
    report.approvedSnapshotJobExecution?.gpacMp4boxExecution === 'completed_controlled_generated_fixture_only' &&
    report.safety?.privateMediaProcessing === false &&
    report.safety?.userMediaProcessing === false &&
    report.safety?.supabaseMutation === false &&
    report.safety?.sqlExecution === false &&
    report.safety?.signedUrlCreation === false &&
    report.safety?.publicArtifactCreation === false &&
    report.safety?.finalRenderExport === false
  )
}

function buildResult(
  input: ThreeToolExternalAgentPersistedJobRouteInvocationInput,
  ok: boolean,
  status: ThreeToolExternalAgentPersistedJobRouteInvocationStatus,
  blockers: ThreeToolExternalAgentPersistedJobRouteInvocationStatus[],
  runtimeDelegateResult?: ThreeToolExternalAgentApprovedSnapshotRunnerSummary,
): ThreeToolExternalAgentPersistedJobRouteInvocationResult {
  const runtimeCompleted = Boolean(ok && runtimeDelegateResult)
  const artifacts = runtimeDelegateResult?.artifacts ?? []
  return {
    packet: TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_ROUTE_INVOCATION_PACKET,
    decision: TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_ROUTE_INVOCATION_DECISION,
    execution: TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_ROUTE_INVOCATION_EXECUTION,
    ok,
    status,
    blockers,
    confirmationGate: TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_ROUTE_INVOCATION_CONFIRM_ENV,
    approvedSnapshotExecutionConfirmationGate:
      TRACKA_THREE_TOOL_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_EXECUTION_CONFIRM_ENV,
    routePath: TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_ROUTE_INVOCATION_ROUTE_PATH,
    persistedHandoffRoutePath: TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_ROUTE_PATH,
    runtimeDelegateResult,
    sanitizedInvocation: {
      persistedInvocationId: input.persistedInvocationId,
      persistedJobId: input.persistedJobId,
      persistedJobType: TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_JOB_TYPE,
      persistedJobPayloadMode: 'persisted_job_payload_to_three_tool_approved_snapshot_runtime_delegate',
      routeIdempotencyKey: input.routeIdempotencyKey,
      runtimeDelegateRunId: runtimeDelegateResult?.runId ?? null,
      runtimeDelegateOutputDir: runtimeDelegateResult?.outputDir ?? null,
      runtimeDelegateArtifacts: artifacts,
      runtimeRouteInvocation: runtimeCompleted ? 'completed_three_tool_approved_snapshot_runtime_delegate' : false,
      gstreamerExecution: runtimeCompleted ? 'completed_controlled_generated_fixture_only' : false,
      mkvtoolnixExecution: runtimeCompleted ? 'completed_controlled_generated_fixture_only' : false,
      gpacMp4boxExecution: runtimeCompleted ? 'completed_controlled_generated_fixture_only' : false,
      privateMediaProcessing: false,
      userMediaProcessing: false,
      workerDispatch: false,
      workerExecution: false,
      persistentJobQueueWrite: false,
      supabaseMutation: false,
      sqlExecution: false,
      signedUrlCreation: false,
      publicArtifactCreation: false,
      finalRenderExport: false,
    },
    safety: {
      routeHandlerInvocation: ok
        ? 'completed_guarded_three_tool_persisted_job_route_invocation_handler'
        : 'not_run_blocked_before_invocation',
      persistedJobPayloadRead: ok ? 'completed_local_payload_read_only' : false,
      runtimeRouteInvocation: runtimeCompleted ? 'completed_three_tool_approved_snapshot_runtime_delegate' : false,
      workerDispatch: false,
      workerExecution: false,
      workerProcessStart: false,
      workerLeaseClaim: false,
      persistentJobQueueWrite: false,
      gstreamerExecution: runtimeCompleted ? 'completed_controlled_generated_fixture_only' : false,
      mkvtoolnixExecution: runtimeCompleted ? 'completed_controlled_generated_fixture_only' : false,
      gpacMp4boxExecution: runtimeCompleted ? 'completed_controlled_generated_fixture_only' : false,
      privateMediaProcessing: false,
      userMediaProcessing: false,
      ffmpegFfprobeExecution: false,
      dockerPushDeploy: false,
      remotionExecution: false,
      supabaseMutation: false,
      sqlExecution: false,
      secretPayloadAccess: false,
      serviceRoleSecretPayloadAccess: false,
      signedUrlCreation: false,
      publicArtifactCreation: false,
      finalRenderExport: false,
      externalBetaUnlock: false,
      paidProductionUnlock: false,
      productionUnlock: false,
    },
    productReadyEndToEndLocalOssTools: 0,
    nextMilestone: TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_ROUTE_INVOCATION_NEXT_MILESTONE,
  }
}

export async function runThreeToolExternalAgentPersistedJobRouteInvocation(
  input: ThreeToolExternalAgentPersistedJobRouteInvocationInput,
  dependencies: ThreeToolExternalAgentPersistedJobRouteInvocationDependencies = {},
): Promise<ThreeToolExternalAgentPersistedJobRouteInvocationResult> {
  const blockers = validateThreeToolExternalAgentPersistedJobRouteInvocationInput(input)
  const env = dependencies.env ?? process.env
  if (env[TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_ROUTE_INVOCATION_CONFIRM_ENV] !== 'true') {
    pushOnce(blockers, 'blocked_pending_three_tool_persisted_job_route_invocation_confirmation')
  }
  if (env[TRACKA_THREE_TOOL_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_EXECUTION_CONFIRM_ENV] !== 'true') {
    pushOnce(blockers, 'blocked_pending_three_tool_persisted_job_route_invocation_confirmation')
  }
  if (blockers.length > 0) return buildResult(input, false, blockers[0], blockers)

  try {
    const runtimeDelegate = await (dependencies.runtimeRunner ?? (() => defaultRuntimeRunner(env)))()
    if (!delegateSafetyValid(runtimeDelegate)) {
      return buildResult(input, false, 'blocked_three_tool_approved_snapshot_runtime_delegate_safety_invalid', [
        'blocked_three_tool_approved_snapshot_runtime_delegate_safety_invalid',
      ], runtimeDelegate)
    }
    return buildResult(input, true, 'completed_persisted_job_route_invocation', [], runtimeDelegate)
  } catch {
    return buildResult(input, false, 'blocked_three_tool_approved_snapshot_runtime_delegate_failed', [
      'blocked_three_tool_approved_snapshot_runtime_delegate_failed',
    ])
  }
}

export function summarizeThreeToolExternalAgentPersistedJobRouteInvocationBoundary(): string[] {
  return [
    'Consumes the local/mock three-tool persisted job handoff payload and delegates to the already confirmed approved-snapshot generated-fixture runtime packet.',
    'Requires both the persisted route invocation gate and the approved-snapshot runtime execution gate before any generated-fixture runtime delegate can run.',
    'Runtime execution remains limited to controlled generated fixtures for GStreamer, MKVToolNix, and GPAC/MP4Box; private/user media, public URLs, signed URLs, Supabase mutation, SQL, final export, worker dispatch, and production unlocks remain blocked.',
  ]
}
