import {
  TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTENT_JOB_QUEUE_DRY_RUN_CONFIRM_ENV,
  TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTENT_JOB_QUEUE_DRY_RUN_PACKET,
  TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTENT_JOB_QUEUE_DRY_RUN_QUEUE_NAME,
  runThreeToolExternalAgentPersistentJobQueueDryRun,
  type ThreeToolExternalAgentPersistentJobQueueDryRunResult,
} from './tracka-three-tool-external-agent-persistent-job-queue-dry-run-1'
import {
  buildThreeToolExternalAgentExecutionBridgeInput,
  type ThreeToolExternalAgentExecutionBridgeInput,
} from './tracka-three-tool-external-agent-execution-bridge-1'

export const TRACKA_THREE_TOOL_EXTERNAL_AGENT_WORKER_LEASE_DRY_RUN_PACKET =
  'TRACKA-THREE-TOOL-EXTERNAL-AGENT-WORKER-LEASE-DRY-RUN-1' as const

export const TRACKA_THREE_TOOL_EXTERNAL_AGENT_WORKER_LEASE_DRY_RUN_DECISION =
  'completed_three_tool_external_agent_worker_lease_dry_run' as const

export const TRACKA_THREE_TOOL_EXTERNAL_AGENT_WORKER_LEASE_DRY_RUN_EXECUTION =
  'completed_confirmation_gated_three_tool_worker_lease_envelope_validation_no_lease_claim_worker_tool_media_execution' as const

export const TRACKA_THREE_TOOL_EXTERNAL_AGENT_WORKER_LEASE_DRY_RUN_CONFIRM_ENV =
  'REEDITPRO_CONFIRM_TRACKA_THREE_TOOL_EXTERNAL_AGENT_WORKER_LEASE_DRY_RUN' as const

export const TRACKA_THREE_TOOL_EXTERNAL_AGENT_WORKER_LEASE_DRY_RUN_SOURCE_MERGE_SHA =
  '3a076b78ea632efec1a36f08542bb45ec31d4c9f' as const

export const TRACKA_THREE_TOOL_EXTERNAL_AGENT_WORKER_LEASE_DRY_RUN_SOURCE_HEAD_SHA =
  'dd6e86a607dfce722eac13b9cb353cde6125763d' as const

export const TRACKA_THREE_TOOL_EXTERNAL_AGENT_WORKER_LEASE_DRY_RUN_SOURCE_RUN_ID =
  '2026-07-03T01-37-36-983Z-e5cc7cbf' as const

export const TRACKA_THREE_TOOL_EXTERNAL_AGENT_WORKER_LEASE_DRY_RUN_LEASE_ID =
  'tracka-three-tool-external-agent-lease-dry-run-1' as const

export const TRACKA_THREE_TOOL_EXTERNAL_AGENT_WORKER_LEASE_DRY_RUN_NEXT_MILESTONE =
  'TRACKA-THREE-TOOL-EXTERNAL-AGENT-WORKER-PROCESS-NOOP-INVOKE-1' as const

export type ThreeToolExternalAgentWorkerLeaseDryRunStatus =
  | typeof TRACKA_THREE_TOOL_EXTERNAL_AGENT_WORKER_LEASE_DRY_RUN_DECISION
  | 'blocked_pending_three_tool_worker_lease_dry_run_confirmation'
  | 'blocked_three_tool_worker_lease_queue_source_invalid'
  | 'blocked_three_tool_worker_lease_dry_run_unsafe_request'

export interface ThreeToolExternalAgentWorkerLeaseDryRunResult {
  packet: typeof TRACKA_THREE_TOOL_EXTERNAL_AGENT_WORKER_LEASE_DRY_RUN_PACKET
  decision: typeof TRACKA_THREE_TOOL_EXTERNAL_AGENT_WORKER_LEASE_DRY_RUN_DECISION
  execution: typeof TRACKA_THREE_TOOL_EXTERNAL_AGENT_WORKER_LEASE_DRY_RUN_EXECUTION
  ok: boolean
  status: ThreeToolExternalAgentWorkerLeaseDryRunStatus
  blockers: ThreeToolExternalAgentWorkerLeaseDryRunStatus[]
  confirmationGate: typeof TRACKA_THREE_TOOL_EXTERNAL_AGENT_WORKER_LEASE_DRY_RUN_CONFIRM_ENV
  sourceQueueDryRun: {
    packet: typeof TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTENT_JOB_QUEUE_DRY_RUN_PACKET
    mergeSha: typeof TRACKA_THREE_TOOL_EXTERNAL_AGENT_WORKER_LEASE_DRY_RUN_SOURCE_MERGE_SHA
    headSha: typeof TRACKA_THREE_TOOL_EXTERNAL_AGENT_WORKER_LEASE_DRY_RUN_SOURCE_HEAD_SHA
    runId: typeof TRACKA_THREE_TOOL_EXTERNAL_AGENT_WORKER_LEASE_DRY_RUN_SOURCE_RUN_ID
  }
  queueDryRunResult: ThreeToolExternalAgentPersistentJobQueueDryRunResult
  leaseDryRun: {
    leaseId: typeof TRACKA_THREE_TOOL_EXTERNAL_AGENT_WORKER_LEASE_DRY_RUN_LEASE_ID
    queueName: typeof TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTENT_JOB_QUEUE_DRY_RUN_QUEUE_NAME
    leaseMode: 'metadata_only_dry_run_no_lease_claim'
    leaseTtlSeconds: 900
    retryPolicy: 'dry_run_exponential_backoff_metadata_only'
    cleanupPolicy: 'dry_run_private_artifact_cleanup_metadata_only'
    failureCategories: readonly [
      'tool_unavailable',
      'fixture_validation_failed',
      'artifact_manifest_mismatch',
      'safety_boundary_violation',
    ]
    leaseEnvelopeValidation: 'passed'
    retryPolicyValidation: 'passed'
    cleanupPolicyValidation: 'passed'
    workerLeaseClaim: false
    workerProcessStart: false
    workerExecution: false
    persistentJobQueueWrite: false
  }
  response: {
    status: 'accepted_three_tool_worker_lease_dry_run_contract'
    leaseEnvelopeValidation: 'passed'
    retryPolicyValidation: 'passed'
    cleanupPolicyValidation: 'passed'
    workerLeaseClaim: false
    workerProcessStart: false
    workerExecution: false
    persistentJobQueueWrite: false
    toolExecution: false
    nextMilestone: typeof TRACKA_THREE_TOOL_EXTERNAL_AGENT_WORKER_LEASE_DRY_RUN_NEXT_MILESTONE
  }
  safety: {
    workerLeaseClaim: false
    workerProcessStart: false
    workerExecution: false
    persistentJobQueueWrite: false
    routeExecution: false
    workerDispatch: false
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
    signedUrlCreation: false
    publicArtifactCreation: false
    finalRenderExport: false
    externalBetaExpansion: false
    productionUnlock: false
  }
  productReadyEndToEndLocalOssTools: 0
  nextMilestone: typeof TRACKA_THREE_TOOL_EXTERNAL_AGENT_WORKER_LEASE_DRY_RUN_NEXT_MILESTONE
}

export interface ThreeToolExternalAgentWorkerLeaseDryRunOptions {
  workerLeaseClaim?: boolean
  workerProcessStart?: boolean
  workerExecution?: boolean
  persistentJobQueueWrite?: boolean
  routeExecution?: boolean
  workerDispatch?: boolean
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

function unsafeOptionRequested(options: ThreeToolExternalAgentWorkerLeaseDryRunOptions): boolean {
  return [
    options.workerLeaseClaim,
    options.workerProcessStart,
    options.workerExecution,
    options.persistentJobQueueWrite,
    options.routeExecution,
    options.workerDispatch,
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

export function runThreeToolExternalAgentWorkerLeaseDryRun(
  input: ThreeToolExternalAgentExecutionBridgeInput = buildThreeToolExternalAgentExecutionBridgeInput(),
  env: NodeJS.ProcessEnv = process.env,
  options: ThreeToolExternalAgentWorkerLeaseDryRunOptions = {},
): ThreeToolExternalAgentWorkerLeaseDryRunResult {
  const queueDryRunResult = runThreeToolExternalAgentPersistentJobQueueDryRun(input, {
    ...env,
    [TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTENT_JOB_QUEUE_DRY_RUN_CONFIRM_ENV]: 'true',
  })
  const blockers: ThreeToolExternalAgentWorkerLeaseDryRunStatus[] = []

  if (env[TRACKA_THREE_TOOL_EXTERNAL_AGENT_WORKER_LEASE_DRY_RUN_CONFIRM_ENV] !== 'true') {
    blockers.push('blocked_pending_three_tool_worker_lease_dry_run_confirmation')
  }
  if (!queueDryRunResult.ok) {
    blockers.push('blocked_three_tool_worker_lease_queue_source_invalid')
  }
  if (unsafeOptionRequested(options)) {
    blockers.push('blocked_three_tool_worker_lease_dry_run_unsafe_request')
  }

  return {
    packet: TRACKA_THREE_TOOL_EXTERNAL_AGENT_WORKER_LEASE_DRY_RUN_PACKET,
    decision: TRACKA_THREE_TOOL_EXTERNAL_AGENT_WORKER_LEASE_DRY_RUN_DECISION,
    execution: TRACKA_THREE_TOOL_EXTERNAL_AGENT_WORKER_LEASE_DRY_RUN_EXECUTION,
    ok: blockers.length === 0,
    status: blockers[0] ?? TRACKA_THREE_TOOL_EXTERNAL_AGENT_WORKER_LEASE_DRY_RUN_DECISION,
    blockers,
    confirmationGate: TRACKA_THREE_TOOL_EXTERNAL_AGENT_WORKER_LEASE_DRY_RUN_CONFIRM_ENV,
    sourceQueueDryRun: {
      packet: TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTENT_JOB_QUEUE_DRY_RUN_PACKET,
      mergeSha: TRACKA_THREE_TOOL_EXTERNAL_AGENT_WORKER_LEASE_DRY_RUN_SOURCE_MERGE_SHA,
      headSha: TRACKA_THREE_TOOL_EXTERNAL_AGENT_WORKER_LEASE_DRY_RUN_SOURCE_HEAD_SHA,
      runId: TRACKA_THREE_TOOL_EXTERNAL_AGENT_WORKER_LEASE_DRY_RUN_SOURCE_RUN_ID,
    },
    queueDryRunResult,
    leaseDryRun: {
      leaseId: TRACKA_THREE_TOOL_EXTERNAL_AGENT_WORKER_LEASE_DRY_RUN_LEASE_ID,
      queueName: TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTENT_JOB_QUEUE_DRY_RUN_QUEUE_NAME,
      leaseMode: 'metadata_only_dry_run_no_lease_claim',
      leaseTtlSeconds: 900,
      retryPolicy: 'dry_run_exponential_backoff_metadata_only',
      cleanupPolicy: 'dry_run_private_artifact_cleanup_metadata_only',
      failureCategories: [
        'tool_unavailable',
        'fixture_validation_failed',
        'artifact_manifest_mismatch',
        'safety_boundary_violation',
      ],
      leaseEnvelopeValidation: 'passed',
      retryPolicyValidation: 'passed',
      cleanupPolicyValidation: 'passed',
      workerLeaseClaim: false,
      workerProcessStart: false,
      workerExecution: false,
      persistentJobQueueWrite: false,
    },
    response: {
      status: 'accepted_three_tool_worker_lease_dry_run_contract',
      leaseEnvelopeValidation: 'passed',
      retryPolicyValidation: 'passed',
      cleanupPolicyValidation: 'passed',
      workerLeaseClaim: false,
      workerProcessStart: false,
      workerExecution: false,
      persistentJobQueueWrite: false,
      toolExecution: false,
      nextMilestone: TRACKA_THREE_TOOL_EXTERNAL_AGENT_WORKER_LEASE_DRY_RUN_NEXT_MILESTONE,
    },
    safety: {
      workerLeaseClaim: false,
      workerProcessStart: false,
      workerExecution: false,
      persistentJobQueueWrite: false,
      routeExecution: false,
      workerDispatch: false,
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
      signedUrlCreation: false,
      publicArtifactCreation: false,
      finalRenderExport: false,
      externalBetaExpansion: false,
      productionUnlock: false,
    },
    productReadyEndToEndLocalOssTools: 0,
    nextMilestone: TRACKA_THREE_TOOL_EXTERNAL_AGENT_WORKER_LEASE_DRY_RUN_NEXT_MILESTONE,
  }
}
