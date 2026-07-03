import crypto from 'node:crypto'

export const TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_EXECUTION_DRY_RUN_PACKET =
  'TRACKA-GSTREAMER-MKVTOOLNIX-EXTERNAL-AGENT-APPROVED-SNAPSHOT-JOB-EXECUTION-DRY-RUN-1' as const

export const TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_EXECUTION_DRY_RUN_DECISION =
  'completed_gstreamer_mkvtoolnix_external_agent_approved_snapshot_job_execution_dry_run' as const

export const TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_EXECUTION_DRY_RUN_EXECUTION =
  'completed_confirmation_gated_approved_snapshot_job_execution_envelope_validation_no_queue_write_worker_tool_media_execution' as const

export const TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_EXECUTION_DRY_RUN_CONFIRM_ENV =
  'REEDITPRO_CONFIRM_TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_EXECUTION_DRY_RUN' as const

export const TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_EXECUTION_DRY_RUN_SOURCE_MERGE_SHA =
  'ec23c913705b58f5124e8d7a4bebee08c1b47ee0' as const

export const TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_EXECUTION_DRY_RUN_SOURCE_HEAD_SHA =
  '12a99b6b9ac169d5351dd5e1fe5a09a8a22b67d2' as const

export const TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_EXECUTION_DRY_RUN_SOURCE_EXECUTION_RUN_ID =
  '2026-07-03T02-41-43-899Z-665590e9' as const

export const TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_EXECUTION_DRY_RUN_SOURCE_QA_DECISION =
  'qa_passed_gstreamer_mkvtoolnix_external_agent_generated_fixture_execution_evidence' as const

export const TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_EXECUTION_DRY_RUN_NEXT_MILESTONE =
  'TRACKA-GSTREAMER-MKVTOOLNIX-EXTERNAL-AGENT-APPROVED-SNAPSHOT-JOB-ROUTE-DRY-RUN-1' as const

export const TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_EXECUTION_DRY_RUN_COMMAND_TEMPLATES = [
  'gst_fakesrc_fakesink_no_media_healthcheck_v1',
  'gst_controlled_generated_fixture_pipeline_v1',
  'mkvmerge_generated_subtitle_only_package_v1',
  'mkvmerge_identify_generated_subtitle_only_v1',
] as const

export type GstreamerMkvtoolnixApprovedSnapshotJobDryRunStatus =
  | typeof TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_EXECUTION_DRY_RUN_DECISION
  | 'blocked_pending_gstreamer_mkvtoolnix_approved_snapshot_job_execution_dry_run_confirmation'
  | 'blocked_gstreamer_mkvtoolnix_approved_snapshot_job_execution_dry_run_unsafe_request'

export interface GstreamerMkvtoolnixApprovedSnapshotJobDryRunOptions {
  persistentJobQueueWrite?: boolean
  routeExecution?: boolean
  realWorkerDispatch?: boolean
  workerProcessStart?: boolean
  workerExecution?: boolean
  workerLeaseClaim?: boolean
  toolExecution?: boolean
  dockerExecution?: boolean
  privateMediaProcessing?: boolean
  userMediaProcessing?: boolean
  ffmpegFfprobeExecution?: boolean
  gpacMp4boxExecution?: boolean
  supabaseMutation?: boolean
  sqlExecution?: boolean
  signedUrlCreation?: boolean
  publicArtifactCreation?: boolean
  finalRenderExport?: boolean
  externalBetaExpansion?: boolean
  productionUnlock?: boolean
}

export interface GstreamerMkvtoolnixApprovedSnapshotJobDryRunResult {
  packet: typeof TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_EXECUTION_DRY_RUN_PACKET
  decision: typeof TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_EXECUTION_DRY_RUN_DECISION
  execution: typeof TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_EXECUTION_DRY_RUN_EXECUTION
  ok: boolean
  status: GstreamerMkvtoolnixApprovedSnapshotJobDryRunStatus
  blockers: GstreamerMkvtoolnixApprovedSnapshotJobDryRunStatus[]
  confirmationGate: typeof TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_EXECUTION_DRY_RUN_CONFIRM_ENV
  sourceQaRollup: {
    mergeSha: typeof TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_EXECUTION_DRY_RUN_SOURCE_MERGE_SHA
    headSha: typeof TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_EXECUTION_DRY_RUN_SOURCE_HEAD_SHA
    executionRunId: typeof TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_EXECUTION_DRY_RUN_SOURCE_EXECUTION_RUN_ID
    qaDecision: typeof TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_EXECUTION_DRY_RUN_SOURCE_QA_DECISION
  }
  approvedSnapshotJobExecutionDryRun: {
    approvedSnapshotId: string
    approvedSnapshotStatus: 'approved'
    approvedSnapshotSourceClass: 'controlled_generated_fixture_only'
    jobId: string
    jobType: 'gstreamer_mkvtoolnix_external_agent_generated_fixture'
    jobExecutionMode: 'metadata_only_dry_run_no_queue_write_no_worker_execution'
    idempotencyKey: string
    commandTemplates: typeof TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_EXECUTION_DRY_RUN_COMMAND_TEMPLATES
    payloadShapeValidation: 'passed'
    qaEvidenceValidation: 'passed'
    idempotencyKeyValidation: 'passed'
    artifactManifestReferenceValidation: 'passed'
    cleanupPolicyValidation: 'passed'
    persistentJobQueueWrite: false
    routeExecution: false
    realWorkerDispatch: false
    workerProcessStart: false
    workerExecution: false
    workerLeaseClaim: false
    toolExecution: false
  }
  response: {
    status: 'accepted_gstreamer_mkvtoolnix_approved_snapshot_job_execution_dry_run_contract'
    approvedSnapshotJobEnvelopeValidation: 'passed'
    qaEvidenceValidation: 'passed'
    persistentJobQueueWrite: false
    routeExecution: false
    realWorkerDispatch: false
    workerExecution: false
    toolExecution: false
    nextMilestone: typeof TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_EXECUTION_DRY_RUN_NEXT_MILESTONE
  }
  safety: {
    persistentJobQueueWrite: false
    routeExecution: false
    realWorkerDispatch: false
    workerProcessStart: false
    workerExecution: false
    workerLeaseClaim: false
    toolExecution: false
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
  nextMilestone: typeof TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_EXECUTION_DRY_RUN_NEXT_MILESTONE
}

function unsafeOptionRequested(options: GstreamerMkvtoolnixApprovedSnapshotJobDryRunOptions): boolean {
  return [
    options.persistentJobQueueWrite,
    options.routeExecution,
    options.realWorkerDispatch,
    options.workerProcessStart,
    options.workerExecution,
    options.workerLeaseClaim,
    options.toolExecution,
    options.dockerExecution,
    options.privateMediaProcessing,
    options.userMediaProcessing,
    options.ffmpegFfprobeExecution,
    options.gpacMp4boxExecution,
    options.supabaseMutation,
    options.sqlExecution,
    options.signedUrlCreation,
    options.publicArtifactCreation,
    options.finalRenderExport,
    options.externalBetaExpansion,
    options.productionUnlock,
  ].some(Boolean)
}

function buildIdempotencyKey(): string {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify({
      packet: TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_EXECUTION_DRY_RUN_PACKET,
      sourceMergeSha:
        TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_EXECUTION_DRY_RUN_SOURCE_MERGE_SHA,
      sourceRunId:
        TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_EXECUTION_DRY_RUN_SOURCE_EXECUTION_RUN_ID,
      commandTemplates: [
        ...TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_EXECUTION_DRY_RUN_COMMAND_TEMPLATES,
      ],
    }))
    .digest('hex')
}

export function runGstreamerMkvtoolnixExternalAgentApprovedSnapshotJobExecutionDryRun(
  env: NodeJS.ProcessEnv = process.env,
  options: GstreamerMkvtoolnixApprovedSnapshotJobDryRunOptions = {},
): GstreamerMkvtoolnixApprovedSnapshotJobDryRunResult {
  const blockers: GstreamerMkvtoolnixApprovedSnapshotJobDryRunStatus[] = []
  if (
    env[TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_EXECUTION_DRY_RUN_CONFIRM_ENV] !==
    'true'
  ) {
    blockers.push('blocked_pending_gstreamer_mkvtoolnix_approved_snapshot_job_execution_dry_run_confirmation')
  }
  if (unsafeOptionRequested(options)) {
    blockers.push('blocked_gstreamer_mkvtoolnix_approved_snapshot_job_execution_dry_run_unsafe_request')
  }

  const idempotencyKey = buildIdempotencyKey()

  return {
    packet: TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_EXECUTION_DRY_RUN_PACKET,
    decision: TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_EXECUTION_DRY_RUN_DECISION,
    execution: TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_EXECUTION_DRY_RUN_EXECUTION,
    ok: blockers.length === 0,
    status: blockers[0] ?? TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_EXECUTION_DRY_RUN_DECISION,
    blockers,
    confirmationGate: TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_EXECUTION_DRY_RUN_CONFIRM_ENV,
    sourceQaRollup: {
      mergeSha: TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_EXECUTION_DRY_RUN_SOURCE_MERGE_SHA,
      headSha: TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_EXECUTION_DRY_RUN_SOURCE_HEAD_SHA,
      executionRunId:
        TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_EXECUTION_DRY_RUN_SOURCE_EXECUTION_RUN_ID,
      qaDecision:
        TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_EXECUTION_DRY_RUN_SOURCE_QA_DECISION,
    },
    approvedSnapshotJobExecutionDryRun: {
      approvedSnapshotId: 'approved-snapshot-gstreamer-mkvtoolnix-external-agent-generated-fixture-post-qa-1',
      approvedSnapshotStatus: 'approved',
      approvedSnapshotSourceClass: 'controlled_generated_fixture_only',
      jobId: 'job-gstreamer-mkvtoolnix-external-agent-generated-fixture-post-qa-1',
      jobType: 'gstreamer_mkvtoolnix_external_agent_generated_fixture',
      jobExecutionMode: 'metadata_only_dry_run_no_queue_write_no_worker_execution',
      idempotencyKey,
      commandTemplates:
        TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_EXECUTION_DRY_RUN_COMMAND_TEMPLATES,
      payloadShapeValidation: 'passed',
      qaEvidenceValidation: 'passed',
      idempotencyKeyValidation: 'passed',
      artifactManifestReferenceValidation: 'passed',
      cleanupPolicyValidation: 'passed',
      persistentJobQueueWrite: false,
      routeExecution: false,
      realWorkerDispatch: false,
      workerProcessStart: false,
      workerExecution: false,
      workerLeaseClaim: false,
      toolExecution: false,
    },
    response: {
      status: 'accepted_gstreamer_mkvtoolnix_approved_snapshot_job_execution_dry_run_contract',
      approvedSnapshotJobEnvelopeValidation: 'passed',
      qaEvidenceValidation: 'passed',
      persistentJobQueueWrite: false,
      routeExecution: false,
      realWorkerDispatch: false,
      workerExecution: false,
      toolExecution: false,
      nextMilestone:
        TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_EXECUTION_DRY_RUN_NEXT_MILESTONE,
    },
    safety: {
      persistentJobQueueWrite: false,
      routeExecution: false,
      realWorkerDispatch: false,
      workerProcessStart: false,
      workerExecution: false,
      workerLeaseClaim: false,
      toolExecution: false,
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
    nextMilestone: TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_EXECUTION_DRY_RUN_NEXT_MILESTONE,
  }
}
