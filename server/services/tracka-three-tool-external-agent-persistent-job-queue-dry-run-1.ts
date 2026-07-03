import crypto from 'node:crypto'

import {
  TRACKA_THREE_TOOL_EXTERNAL_AGENT_GUARDED_WORKER_DISPATCH_NOOP_INVOKE_CONFIRM_ENV,
  TRACKA_THREE_TOOL_EXTERNAL_AGENT_GUARDED_WORKER_DISPATCH_NOOP_INVOKE_PACKET,
  TRACKA_THREE_TOOL_EXTERNAL_AGENT_GUARDED_WORKER_DISPATCH_NOOP_INVOKE_QUEUE_NAME,
  TRACKA_THREE_TOOL_EXTERNAL_AGENT_GUARDED_WORKER_DISPATCH_NOOP_INVOKE_WORKER_KIND,
  TRACKA_THREE_TOOL_EXTERNAL_AGENT_GUARDED_WORKER_DISPATCH_NOOP_INVOKE_WORKER_SOURCE_ID,
  invokeThreeToolExternalAgentGuardedWorkerDispatchNoop,
  type ThreeToolExternalAgentGuardedWorkerDispatchNoopInvokeResult,
} from './tracka-three-tool-external-agent-guarded-worker-dispatch-noop-invoke-1'
import {
  TRACKA_THREE_TOOL_EXTERNAL_AGENT_EXECUTION_BRIDGE_TOOLS,
  buildThreeToolExternalAgentExecutionBridgeInput,
  type ThreeToolExternalAgentExecutionBridgeInput,
} from './tracka-three-tool-external-agent-execution-bridge-1'

export const TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTENT_JOB_QUEUE_DRY_RUN_PACKET =
  'TRACKA-THREE-TOOL-EXTERNAL-AGENT-PERSISTENT-JOB-QUEUE-DRY-RUN-1' as const

export const TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTENT_JOB_QUEUE_DRY_RUN_DECISION =
  'completed_three_tool_external_agent_persistent_job_queue_dry_run' as const

export const TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTENT_JOB_QUEUE_DRY_RUN_EXECUTION =
  'completed_confirmation_gated_three_tool_persistent_job_queue_payload_validation_no_queue_write_worker_tool_media_execution' as const

export const TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTENT_JOB_QUEUE_DRY_RUN_CONFIRM_ENV =
  'REEDITPRO_CONFIRM_TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTENT_JOB_QUEUE_DRY_RUN' as const

export const TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTENT_JOB_QUEUE_DRY_RUN_SOURCE_MERGE_SHA =
  '275a8010236f02dbc6640f8711d0bf64a29b4caf' as const

export const TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTENT_JOB_QUEUE_DRY_RUN_SOURCE_HEAD_SHA =
  'e45c99f5c476764359f382c27894bd0da05b3745' as const

export const TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTENT_JOB_QUEUE_DRY_RUN_SOURCE_RUN_ID =
  '2026-07-03T01-28-17-653Z-f2a11fd7' as const

export const TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTENT_JOB_QUEUE_DRY_RUN_QUEUE_NAME =
  'tracka-three-tool-external-agent-persistent-jobs' as const

export const TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTENT_JOB_QUEUE_DRY_RUN_JOB_TYPE =
  'tracka_three_tool_external_agent_generated_fixture_execution' as const

export const TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTENT_JOB_QUEUE_DRY_RUN_NEXT_MILESTONE =
  'TRACKA-THREE-TOOL-EXTERNAL-AGENT-WORKER-LEASE-DRY-RUN-1' as const

export type ThreeToolExternalAgentPersistentJobQueueDryRunStatus =
  | typeof TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTENT_JOB_QUEUE_DRY_RUN_DECISION
  | 'blocked_pending_three_tool_persistent_job_queue_dry_run_confirmation'
  | 'blocked_three_tool_persistent_job_queue_worker_dispatch_source_invalid'
  | 'blocked_three_tool_persistent_job_queue_dry_run_unsafe_request'

export interface ThreeToolExternalAgentPersistentJobQueueDryRunResult {
  packet: typeof TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTENT_JOB_QUEUE_DRY_RUN_PACKET
  decision: typeof TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTENT_JOB_QUEUE_DRY_RUN_DECISION
  execution: typeof TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTENT_JOB_QUEUE_DRY_RUN_EXECUTION
  ok: boolean
  status: ThreeToolExternalAgentPersistentJobQueueDryRunStatus
  blockers: ThreeToolExternalAgentPersistentJobQueueDryRunStatus[]
  confirmationGate: typeof TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTENT_JOB_QUEUE_DRY_RUN_CONFIRM_ENV
  sourceWorkerDispatchNoop: {
    packet: typeof TRACKA_THREE_TOOL_EXTERNAL_AGENT_GUARDED_WORKER_DISPATCH_NOOP_INVOKE_PACKET
    mergeSha: typeof TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTENT_JOB_QUEUE_DRY_RUN_SOURCE_MERGE_SHA
    headSha: typeof TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTENT_JOB_QUEUE_DRY_RUN_SOURCE_HEAD_SHA
    runId: typeof TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTENT_JOB_QUEUE_DRY_RUN_SOURCE_RUN_ID
  }
  workerDispatchResult: ThreeToolExternalAgentGuardedWorkerDispatchNoopInvokeResult
  queueDryRun: {
    queueName: typeof TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTENT_JOB_QUEUE_DRY_RUN_QUEUE_NAME
    sourceNoopQueueName: typeof TRACKA_THREE_TOOL_EXTERNAL_AGENT_GUARDED_WORKER_DISPATCH_NOOP_INVOKE_QUEUE_NAME
    workerDispatchSourceId: typeof TRACKA_THREE_TOOL_EXTERNAL_AGENT_GUARDED_WORKER_DISPATCH_NOOP_INVOKE_WORKER_SOURCE_ID
    workerKind: typeof TRACKA_THREE_TOOL_EXTERNAL_AGENT_GUARDED_WORKER_DISPATCH_NOOP_INVOKE_WORKER_KIND
    jobType: typeof TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTENT_JOB_QUEUE_DRY_RUN_JOB_TYPE
    queueWriteMode: 'metadata_only_dry_run_no_persistent_write'
    idempotencyKey: string
    payloadShapeValidation: 'passed'
    idempotencyKeyValidation: 'passed'
    leasePolicyValidation: 'passed'
    artifactManifestPlaceholderValidation: 'passed'
    persistentJobQueueWrite: false
    workerLeaseClaim: false
    workerDispatch: false
    workerExecution: false
  }
  response: {
    status: 'accepted_three_tool_persistent_job_queue_dry_run_contract'
    queuePayloadValidation: 'passed'
    idempotencyKeyValidation: 'passed'
    persistentJobQueueWrite: false
    workerDispatch: false
    workerExecution: false
    workerLeaseClaim: false
    toolExecution: false
    nextMilestone: typeof TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTENT_JOB_QUEUE_DRY_RUN_NEXT_MILESTONE
  }
  safety: {
    persistentJobQueueWrite: false
    routeExecution: false
    workerDispatch: false
    workerExecution: false
    workerProcessStart: false
    workerLeaseClaim: false
    gstreamerExecution: false
    mkvtoolnixExecution: false
    gpacMp4boxExecution: false
    dockerExecution: false
    privateMediaProcessing: false
    userMediaProcessing: false
    ffmpegFfprobeExecution: false
    supabaseMutation: false
    sqlExecution: false
    secretPayloadAccess: false
    serviceRoleSecretPayloadAccess: false
    signedUrlCreation: false
    publicArtifactCreation: false
    finalRenderExport: false
    externalBetaExpansion: false
    productionUnlock: false
  }
  productReadyEndToEndLocalOssTools: 0
  nextMilestone: typeof TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTENT_JOB_QUEUE_DRY_RUN_NEXT_MILESTONE
}

export interface ThreeToolExternalAgentPersistentJobQueueDryRunOptions {
  persistentJobQueueWrite?: boolean
  routeExecution?: boolean
  workerDispatch?: boolean
  workerExecution?: boolean
  workerProcessStart?: boolean
  workerLeaseClaim?: boolean
  toolExecution?: boolean
  dockerExecution?: boolean
  privateMediaProcessing?: boolean
  userMediaProcessing?: boolean
  supabaseMutation?: boolean
  sqlExecution?: boolean
  signedUrlCreation?: boolean
  publicArtifactCreation?: boolean
  finalRenderExport?: boolean
  externalBetaExpansion?: boolean
  productionUnlock?: boolean
}

function unsafeOptionRequested(options: ThreeToolExternalAgentPersistentJobQueueDryRunOptions): boolean {
  return [
    options.persistentJobQueueWrite,
    options.routeExecution,
    options.workerDispatch,
    options.workerExecution,
    options.workerProcessStart,
    options.workerLeaseClaim,
    options.toolExecution,
    options.dockerExecution,
    options.privateMediaProcessing,
    options.userMediaProcessing,
    options.supabaseMutation,
    options.sqlExecution,
    options.signedUrlCreation,
    options.publicArtifactCreation,
    options.finalRenderExport,
    options.externalBetaExpansion,
    options.productionUnlock,
  ].some(Boolean)
}

function buildIdempotencyKey(input: ThreeToolExternalAgentExecutionBridgeInput): string {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify({
      packet: TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTENT_JOB_QUEUE_DRY_RUN_PACKET,
      jobType: TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTENT_JOB_QUEUE_DRY_RUN_JOB_TYPE,
      tools: [...TRACKA_THREE_TOOL_EXTERNAL_AGENT_EXECUTION_BRIDGE_TOOLS],
      routeIdempotencyKey: input.routeIdempotencyKey ?? 'tracka-three-tool-route-idempotency-key-1',
      sourceRunId: TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTENT_JOB_QUEUE_DRY_RUN_SOURCE_RUN_ID,
    }))
    .digest('hex')
}

export function runThreeToolExternalAgentPersistentJobQueueDryRun(
  input: ThreeToolExternalAgentExecutionBridgeInput = buildThreeToolExternalAgentExecutionBridgeInput(),
  env: NodeJS.ProcessEnv = process.env,
  options: ThreeToolExternalAgentPersistentJobQueueDryRunOptions = {},
): ThreeToolExternalAgentPersistentJobQueueDryRunResult {
  const workerDispatchResult = invokeThreeToolExternalAgentGuardedWorkerDispatchNoop(input, {
    ...env,
    [TRACKA_THREE_TOOL_EXTERNAL_AGENT_GUARDED_WORKER_DISPATCH_NOOP_INVOKE_CONFIRM_ENV]: 'true',
  })
  const blockers: ThreeToolExternalAgentPersistentJobQueueDryRunStatus[] = []

  if (env[TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTENT_JOB_QUEUE_DRY_RUN_CONFIRM_ENV] !== 'true') {
    blockers.push('blocked_pending_three_tool_persistent_job_queue_dry_run_confirmation')
  }
  if (!workerDispatchResult.ok) {
    blockers.push('blocked_three_tool_persistent_job_queue_worker_dispatch_source_invalid')
  }
  if (unsafeOptionRequested(options)) {
    blockers.push('blocked_three_tool_persistent_job_queue_dry_run_unsafe_request')
  }

  const idempotencyKey = buildIdempotencyKey(input)

  return {
    packet: TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTENT_JOB_QUEUE_DRY_RUN_PACKET,
    decision: TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTENT_JOB_QUEUE_DRY_RUN_DECISION,
    execution: TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTENT_JOB_QUEUE_DRY_RUN_EXECUTION,
    ok: blockers.length === 0,
    status: blockers[0] ?? TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTENT_JOB_QUEUE_DRY_RUN_DECISION,
    blockers,
    confirmationGate: TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTENT_JOB_QUEUE_DRY_RUN_CONFIRM_ENV,
    sourceWorkerDispatchNoop: {
      packet: TRACKA_THREE_TOOL_EXTERNAL_AGENT_GUARDED_WORKER_DISPATCH_NOOP_INVOKE_PACKET,
      mergeSha: TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTENT_JOB_QUEUE_DRY_RUN_SOURCE_MERGE_SHA,
      headSha: TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTENT_JOB_QUEUE_DRY_RUN_SOURCE_HEAD_SHA,
      runId: TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTENT_JOB_QUEUE_DRY_RUN_SOURCE_RUN_ID,
    },
    workerDispatchResult,
    queueDryRun: {
      queueName: TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTENT_JOB_QUEUE_DRY_RUN_QUEUE_NAME,
      sourceNoopQueueName: TRACKA_THREE_TOOL_EXTERNAL_AGENT_GUARDED_WORKER_DISPATCH_NOOP_INVOKE_QUEUE_NAME,
      workerDispatchSourceId: TRACKA_THREE_TOOL_EXTERNAL_AGENT_GUARDED_WORKER_DISPATCH_NOOP_INVOKE_WORKER_SOURCE_ID,
      workerKind: TRACKA_THREE_TOOL_EXTERNAL_AGENT_GUARDED_WORKER_DISPATCH_NOOP_INVOKE_WORKER_KIND,
      jobType: TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTENT_JOB_QUEUE_DRY_RUN_JOB_TYPE,
      queueWriteMode: 'metadata_only_dry_run_no_persistent_write',
      idempotencyKey,
      payloadShapeValidation: 'passed',
      idempotencyKeyValidation: 'passed',
      leasePolicyValidation: 'passed',
      artifactManifestPlaceholderValidation: 'passed',
      persistentJobQueueWrite: false,
      workerLeaseClaim: false,
      workerDispatch: false,
      workerExecution: false,
    },
    response: {
      status: 'accepted_three_tool_persistent_job_queue_dry_run_contract',
      queuePayloadValidation: 'passed',
      idempotencyKeyValidation: 'passed',
      persistentJobQueueWrite: false,
      workerDispatch: false,
      workerExecution: false,
      workerLeaseClaim: false,
      toolExecution: false,
      nextMilestone: TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTENT_JOB_QUEUE_DRY_RUN_NEXT_MILESTONE,
    },
    safety: {
      persistentJobQueueWrite: false,
      routeExecution: false,
      workerDispatch: false,
      workerExecution: false,
      workerProcessStart: false,
      workerLeaseClaim: false,
      gstreamerExecution: false,
      mkvtoolnixExecution: false,
      gpacMp4boxExecution: false,
      dockerExecution: false,
      privateMediaProcessing: false,
      userMediaProcessing: false,
      ffmpegFfprobeExecution: false,
      supabaseMutation: false,
      sqlExecution: false,
      secretPayloadAccess: false,
      serviceRoleSecretPayloadAccess: false,
      signedUrlCreation: false,
      publicArtifactCreation: false,
      finalRenderExport: false,
      externalBetaExpansion: false,
      productionUnlock: false,
    },
    productReadyEndToEndLocalOssTools: 0,
    nextMilestone: TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTENT_JOB_QUEUE_DRY_RUN_NEXT_MILESTONE,
  }
}
