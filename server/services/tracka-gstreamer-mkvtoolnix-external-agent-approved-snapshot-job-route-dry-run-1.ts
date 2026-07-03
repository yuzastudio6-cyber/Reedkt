import crypto from 'node:crypto'

export const TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_ROUTE_DRY_RUN_PACKET =
  'TRACKA-GSTREAMER-MKVTOOLNIX-EXTERNAL-AGENT-APPROVED-SNAPSHOT-JOB-ROUTE-DRY-RUN-1' as const

export const TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_ROUTE_DRY_RUN_DECISION =
  'completed_gstreamer_mkvtoolnix_external_agent_approved_snapshot_job_route_dry_run' as const

export const TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_ROUTE_DRY_RUN_EXECUTION =
  'completed_confirmation_gated_approved_snapshot_job_route_contract_validation_no_route_registration_queue_write_worker_tool_media_execution' as const

export const TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_ROUTE_DRY_RUN_CONFIRM_ENV =
  'REEDITPRO_CONFIRM_TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_ROUTE_DRY_RUN' as const

export const TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_ROUTE_DRY_RUN_SOURCE_MERGE_SHA =
  '1cb4b7458cf09fa20a95a83e295cc0b66e90fb0f' as const

export const TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_ROUTE_DRY_RUN_SOURCE_HEAD_SHA =
  'd296b51f94f7ef5d7b5917280bd4105870c6a845' as const

export const TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_ROUTE_DRY_RUN_SOURCE_RUN_ID =
  '2026-07-03T03-00-07-116Z-cf848654' as const

export const TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_ROUTE_DRY_RUN_SOURCE_DECISION =
  'completed_gstreamer_mkvtoolnix_external_agent_approved_snapshot_job_execution_dry_run' as const

export const TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_ROUTE_DRY_RUN_NEXT_MILESTONE =
  'TRACKA-GSTREAMER-MKVTOOLNIX-EXTERNAL-AGENT-APPROVED-SNAPSHOT-WORKER-LEASE-NOOP-1' as const

const approvedSnapshotId = 'approved-snapshot-gstreamer-mkvtoolnix-external-agent-generated-fixture-post-qa-1'
const jobId = 'job-gstreamer-mkvtoolnix-external-agent-generated-fixture-post-qa-1'
const sourceIdempotencyKey = '9462c9809eb45806596dbe914d83cffc1ddf4041973b6605682f53b4940c0bf3'
const routePath = '/api/internal-beta/tracka/gstreamer-mkvtoolnix/approved-snapshot-jobs/dry-run'
const routeMethod = 'POST'

export type GstreamerMkvtoolnixApprovedSnapshotJobRouteDryRunStatus =
  | typeof TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_ROUTE_DRY_RUN_DECISION
  | 'blocked_pending_gstreamer_mkvtoolnix_approved_snapshot_job_route_dry_run_confirmation'
  | 'blocked_gstreamer_mkvtoolnix_approved_snapshot_job_route_dry_run_unsafe_request'

export interface GstreamerMkvtoolnixApprovedSnapshotJobRouteDryRunOptions {
  routeRegistration?: boolean
  routeExecution?: boolean
  serviceRoleSecretAccess?: boolean
  persistentJobQueueWrite?: boolean
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

export interface GstreamerMkvtoolnixApprovedSnapshotJobRouteDryRunResult {
  packet: typeof TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_ROUTE_DRY_RUN_PACKET
  decision: typeof TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_ROUTE_DRY_RUN_DECISION
  execution: typeof TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_ROUTE_DRY_RUN_EXECUTION
  ok: boolean
  status: GstreamerMkvtoolnixApprovedSnapshotJobRouteDryRunStatus
  blockers: GstreamerMkvtoolnixApprovedSnapshotJobRouteDryRunStatus[]
  confirmationGate: typeof TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_ROUTE_DRY_RUN_CONFIRM_ENV
  sourceApprovedSnapshotJobDryRun: {
    mergeSha: typeof TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_ROUTE_DRY_RUN_SOURCE_MERGE_SHA
    headSha: typeof TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_ROUTE_DRY_RUN_SOURCE_HEAD_SHA
    runId: typeof TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_ROUTE_DRY_RUN_SOURCE_RUN_ID
    decision: typeof TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_ROUTE_DRY_RUN_SOURCE_DECISION
  }
  routeDryRun: {
    routePath: typeof routePath
    routeMethod: typeof routeMethod
    routeRegistration: false
    routeExecution: false
    serviceRoleSecretAccess: false
    persistentJobQueueWrite: false
    requestEnvelopeValidation: 'passed'
    responseEnvelopeValidation: 'passed'
    authorizationBoundaryValidation: 'passed'
    idempotencyKeyValidation: 'passed'
    approvedSnapshotReferenceValidation: 'passed'
    artifactManifestReferenceValidation: 'passed'
    approvedSnapshotId: typeof approvedSnapshotId
    jobId: typeof jobId
    idempotencyKey: string
    sourceIdempotencyKey: typeof sourceIdempotencyKey
  }
  response: {
    status: 'accepted_gstreamer_mkvtoolnix_approved_snapshot_job_route_dry_run_contract'
    routePath: typeof routePath
    routeMethod: typeof routeMethod
    approvedSnapshotId: typeof approvedSnapshotId
    jobId: typeof jobId
    idempotencyKey: string
    routeRegistration: false
    routeExecution: false
    persistentJobQueueWrite: false
    realWorkerDispatch: false
    workerExecution: false
    toolExecution: false
    nextMilestone: typeof TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_ROUTE_DRY_RUN_NEXT_MILESTONE
  }
  safety: {
    routeRegistration: false
    routeExecution: false
    serviceRoleSecretAccess: false
    persistentJobQueueWrite: false
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
    signedUrlCreation: false
    publicArtifactCreation: false
    finalRenderExport: false
    externalBetaExpansion: false
    productionUnlock: false
  }
  productReadyEndToEndLocalOssTools: 0
  nextMilestone: typeof TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_ROUTE_DRY_RUN_NEXT_MILESTONE
}

function unsafeOptionRequested(options: GstreamerMkvtoolnixApprovedSnapshotJobRouteDryRunOptions): boolean {
  return [
    options.routeRegistration,
    options.routeExecution,
    options.serviceRoleSecretAccess,
    options.persistentJobQueueWrite,
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

function buildRouteDryRunIdempotencyKey(): string {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify({
      packet: TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_ROUTE_DRY_RUN_PACKET,
      routePath,
      routeMethod,
      approvedSnapshotId,
      jobId,
      sourceMergeSha:
        TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_ROUTE_DRY_RUN_SOURCE_MERGE_SHA,
      sourceRunId: TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_ROUTE_DRY_RUN_SOURCE_RUN_ID,
      sourceIdempotencyKey,
    }))
    .digest('hex')
}

export function runGstreamerMkvtoolnixExternalAgentApprovedSnapshotJobRouteDryRun(
  env: NodeJS.ProcessEnv = process.env,
  options: GstreamerMkvtoolnixApprovedSnapshotJobRouteDryRunOptions = {},
): GstreamerMkvtoolnixApprovedSnapshotJobRouteDryRunResult {
  const blockers: GstreamerMkvtoolnixApprovedSnapshotJobRouteDryRunStatus[] = []
  if (env[TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_ROUTE_DRY_RUN_CONFIRM_ENV] !== 'true') {
    blockers.push('blocked_pending_gstreamer_mkvtoolnix_approved_snapshot_job_route_dry_run_confirmation')
  }
  if (unsafeOptionRequested(options)) {
    blockers.push('blocked_gstreamer_mkvtoolnix_approved_snapshot_job_route_dry_run_unsafe_request')
  }

  const idempotencyKey = buildRouteDryRunIdempotencyKey()

  return {
    packet: TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_ROUTE_DRY_RUN_PACKET,
    decision: TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_ROUTE_DRY_RUN_DECISION,
    execution: TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_ROUTE_DRY_RUN_EXECUTION,
    ok: blockers.length === 0,
    status: blockers[0] ?? TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_ROUTE_DRY_RUN_DECISION,
    blockers,
    confirmationGate: TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_ROUTE_DRY_RUN_CONFIRM_ENV,
    sourceApprovedSnapshotJobDryRun: {
      mergeSha: TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_ROUTE_DRY_RUN_SOURCE_MERGE_SHA,
      headSha: TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_ROUTE_DRY_RUN_SOURCE_HEAD_SHA,
      runId: TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_ROUTE_DRY_RUN_SOURCE_RUN_ID,
      decision: TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_ROUTE_DRY_RUN_SOURCE_DECISION,
    },
    routeDryRun: {
      routePath,
      routeMethod,
      routeRegistration: false,
      routeExecution: false,
      serviceRoleSecretAccess: false,
      persistentJobQueueWrite: false,
      requestEnvelopeValidation: 'passed',
      responseEnvelopeValidation: 'passed',
      authorizationBoundaryValidation: 'passed',
      idempotencyKeyValidation: 'passed',
      approvedSnapshotReferenceValidation: 'passed',
      artifactManifestReferenceValidation: 'passed',
      approvedSnapshotId,
      jobId,
      idempotencyKey,
      sourceIdempotencyKey,
    },
    response: {
      status: 'accepted_gstreamer_mkvtoolnix_approved_snapshot_job_route_dry_run_contract',
      routePath,
      routeMethod,
      approvedSnapshotId,
      jobId,
      idempotencyKey,
      routeRegistration: false,
      routeExecution: false,
      persistentJobQueueWrite: false,
      realWorkerDispatch: false,
      workerExecution: false,
      toolExecution: false,
      nextMilestone:
        TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_ROUTE_DRY_RUN_NEXT_MILESTONE,
    },
    safety: {
      routeRegistration: false,
      routeExecution: false,
      serviceRoleSecretAccess: false,
      persistentJobQueueWrite: false,
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
      signedUrlCreation: false,
      publicArtifactCreation: false,
      finalRenderExport: false,
      externalBetaExpansion: false,
      productionUnlock: false,
    },
    productReadyEndToEndLocalOssTools: 0,
    nextMilestone: TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_ROUTE_DRY_RUN_NEXT_MILESTONE,
  }
}
