import {
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_ALLOWED_TEMPLATES,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_ROUTE_PATH,
  buildGstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridgeInput,
} from './rp-external-beta-gstreamer-mkvtoolnix-narrow-execution-ready-route-worker-bridge-1'
import {
  TRACKA_GPAC_MP4BOX_EXECUTION_READY_ROUTE_WORKER_BRIDGE_ALLOWED_TEMPLATES,
  TRACKA_GPAC_MP4BOX_EXECUTION_READY_ROUTE_WORKER_BRIDGE_ROUTE_PATH,
  buildGpacMp4boxExecutionReadyRouteWorkerBridgeInput,
} from './tracka-gpac-mp4box-execution-ready-route-worker-bridge-1'

export const TRACKA_THREE_TOOL_EXTERNAL_AGENT_EXECUTION_BRIDGE_PACKET =
  'TRACKA-THREE-TOOL-EXTERNAL-AGENT-EXECUTION-BRIDGE-1' as const

export const TRACKA_THREE_TOOL_EXTERNAL_AGENT_EXECUTION_BRIDGE_DECISION =
  'completed_three_tool_external_agent_execution_bridge_ready_for_confirmation_gated_bridge_dry_run' as const

export const TRACKA_THREE_TOOL_EXTERNAL_AGENT_EXECUTION_BRIDGE_EXECUTION =
  'completed_backend_source_three_tool_agent_execution_bridge_no_route_worker_dispatch_or_tool_execution' as const

export const TRACKA_THREE_TOOL_EXTERNAL_AGENT_EXECUTION_BRIDGE_READY_STATUS =
  'ready_for_confirmation_gated_three_tool_external_agent_execution_bridge_dry_run' as const

export const TRACKA_THREE_TOOL_EXTERNAL_AGENT_EXECUTION_BRIDGE_CONFIRM_ENV =
  'REEDITPRO_CONFIRM_TRACKA_THREE_TOOL_EXTERNAL_AGENT_EXECUTION_BRIDGE_DRY_RUN' as const

export const TRACKA_THREE_TOOL_EXTERNAL_AGENT_EXECUTION_BRIDGE_NEXT_MILESTONE =
  'TRACKA-THREE-TOOL-EXTERNAL-AGENT-EXECUTION-BRIDGE-DRY-RUN-1' as const

export const TRACKA_THREE_TOOL_EXTERNAL_AGENT_EXECUTION_BRIDGE_QA_MERGE_SHA =
  '13c922b3cc8d40223920c45bb800729dbbe3e7b5' as const

export const TRACKA_THREE_TOOL_EXTERNAL_AGENT_EXECUTION_BRIDGE_COMBINED_RUN_ID =
  '2026-07-02T23-06-37-783Z-735edf80' as const

export const TRACKA_THREE_TOOL_EXTERNAL_AGENT_EXECUTION_BRIDGE_GSTREAMER_MKVTOOLNIX_RUN_ID =
  '2026-07-02T23-06-37-953Z-ee1ebbec' as const

export const TRACKA_THREE_TOOL_EXTERNAL_AGENT_EXECUTION_BRIDGE_GPAC_MP4BOX_RUN_ID =
  '2026-07-02T23-06-42-095Z-21ff9b93' as const

export const TRACKA_THREE_TOOL_EXTERNAL_AGENT_EXECUTION_BRIDGE_TOOLS = [
  'gstreamer_render_pipeline_support',
  'mkvtoolnix_container_validation',
  'gpac_mp4box_packaging_validation',
] as const

export type ThreeToolExternalAgentExecutionBridgeTool =
  typeof TRACKA_THREE_TOOL_EXTERNAL_AGENT_EXECUTION_BRIDGE_TOOLS[number]

export type ThreeToolExternalAgentExecutionBridgeStatus =
  | typeof TRACKA_THREE_TOOL_EXTERNAL_AGENT_EXECUTION_BRIDGE_READY_STATUS
  | 'blocked_missing_three_tool_external_agent_execution_bridge_reference'
  | 'blocked_invalid_three_tool_external_agent_execution_bridge_state'
  | 'blocked_unapproved_three_tool_external_agent_command_template'
  | 'blocked_unsupported_three_tool_external_agent_input'
  | 'blocked_unsafe_three_tool_external_agent_execution_bridge_request'

export interface ThreeToolExternalAgentExecutionBridgeInput {
  workspaceId?: string | null
  projectId?: string | null
  editSessionId?: string | null
  approvedSnapshotId?: string | null
  approvedSnapshotStatus?: 'approved' | 'draft' | 'superseded' | 'rejected' | null
  approvalRecordId?: string | null
  approvalRecordStatus?: 'approved' | 'pending' | 'revoked' | null
  creditPolicyRef?: string | null
  creditPolicyMode?: 'no_spend_fixture_policy' | 'credit_reservation' | null
  creditPolicyStatus?: 'approved' | 'reserved' | 'pending' | 'spent' | 'released' | 'refunded' | null
  jobId?: string | null
  jobStatus?: 'queued' | 'leased' | 'planned' | 'running' | 'completed' | 'failed' | null
  workerLeaseId?: string | null
  workerLeaseStatus?: 'claimed' | 'disabled' | 'planned' | 'expired' | 'released' | null
  routeIdempotencyKey?: string | null
  runtimePacketId?: string | null
  runtimeExecutionId?: string | null
  privateInputManifestId?: string | null
  privateInputManifestSha256?: string | null
  outputManifestSchemaId?: string | null
  qaReportSchemaId?: string | null
  cleanupPolicyId?: string | null
  retentionPolicyId?: string | null
  failurePolicyId?: string | null
  auditEventParentId?: string | null
  combinedExecutionRunId?: string | null
  combinedExecutionQaMergeSha?: string | null
  gstreamerMkvtoolnixRunId?: string | null
  gpacMp4boxRunId?: string | null
  gstreamerMkvtoolnixCommandTemplates?: readonly string[]
  gpacMp4boxCommandTemplates?: readonly string[]
  rawCommandString?: string | null
  rawChat?: string | null
  arbitraryFilePath?: string | null
  publicUrlSourceOfTruth?: string | null
  signedUrlSourceOfTruth?: string | null
  arbitraryPrivateMediaRef?: string | null
  ffmpegFfprobeExpansionRequested?: boolean
  routeExecutionRequestedNow?: boolean
  workerDispatchRequestedNow?: boolean
  workerExecutionRequestedNow?: boolean
  gstreamerExecutionRequestedNow?: boolean
  mkvtoolnixExecutionRequestedNow?: boolean
  gpacMp4boxExecutionRequestedNow?: boolean
  dockerExecutionRequestedNow?: boolean
  dockerPushDeployRequestedNow?: boolean
  remotionRenderRequestedNow?: boolean
  supabaseMutationRequestedNow?: boolean
  sqlExecutionRequestedNow?: boolean
  signedUrlCreationRequestedNow?: boolean
  publicArtifactRequestedNow?: boolean
  finalRenderExportRequestedNow?: boolean
  externalBetaExpansionRequestedNow?: boolean
  paidProductionUnlockRequestedNow?: boolean
  productionUnlockRequestedNow?: boolean
}

export interface ThreeToolExternalAgentExecutionBridgeResult {
  packet: typeof TRACKA_THREE_TOOL_EXTERNAL_AGENT_EXECUTION_BRIDGE_PACKET
  decision: typeof TRACKA_THREE_TOOL_EXTERNAL_AGENT_EXECUTION_BRIDGE_DECISION
  execution: typeof TRACKA_THREE_TOOL_EXTERNAL_AGENT_EXECUTION_BRIDGE_EXECUTION
  ok: boolean
  status: ThreeToolExternalAgentExecutionBridgeStatus
  blockers: ThreeToolExternalAgentExecutionBridgeStatus[]
  confirmationGate: typeof TRACKA_THREE_TOOL_EXTERNAL_AGENT_EXECUTION_BRIDGE_CONFIRM_ENV
  confirmationRequiredForFutureDryRun: true
  directRuntimeExecutionInThisBridge: false
  activeNativeContainerToolLaneCount: 3
  sanitizedRequest: {
    workspaceId: string
    projectId: string
    editSessionId: string
    approvedSnapshotId: string
    approvalRecordId: string
    creditPolicyRef: string
    creditPolicyMode: 'no_spend_fixture_policy' | 'credit_reservation'
    jobId: string
    jobStatus: 'queued' | 'leased' | 'planned'
    workerLeaseId: string
    workerLeaseStatus: 'claimed' | 'disabled' | 'planned'
    routeIdempotencyKey: string
    runtimePacketId: string
    runtimeExecutionId: string
    privateInputManifestId: string
    privateInputManifestSha256: string
    outputManifestSchemaId: string
    qaReportSchemaId: string
    cleanupPolicyId: string
    retentionPolicyId: string
    failurePolicyId: string
    auditEventParentId: string
    combinedExecutionRunId: typeof TRACKA_THREE_TOOL_EXTERNAL_AGENT_EXECUTION_BRIDGE_COMBINED_RUN_ID
    combinedExecutionQaMergeSha: typeof TRACKA_THREE_TOOL_EXTERNAL_AGENT_EXECUTION_BRIDGE_QA_MERGE_SHA
    gstreamerMkvtoolnixRunId: typeof TRACKA_THREE_TOOL_EXTERNAL_AGENT_EXECUTION_BRIDGE_GSTREAMER_MKVTOOLNIX_RUN_ID
    gpacMp4boxRunId: typeof TRACKA_THREE_TOOL_EXTERNAL_AGENT_EXECUTION_BRIDGE_GPAC_MP4BOX_RUN_ID
  }
  childRouteBridges: {
    gstreamerMkvtoolnix: {
      routePath: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_ROUTE_PATH
      commandTemplates: string[]
      input: ReturnType<typeof buildGstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridgeInput>
    }
    gpacMp4box: {
      routePath: typeof TRACKA_GPAC_MP4BOX_EXECUTION_READY_ROUTE_WORKER_BRIDGE_ROUTE_PATH
      commandTemplates: string[]
      input: ReturnType<typeof buildGpacMp4boxExecutionReadyRouteWorkerBridgeInput>
    }
  }
  safety: {
    routeExecution: false
    workerDispatch: false
    workerExecution: false
    gstreamerExecutionInThisBridge: false
    mkvtoolnixExecutionInThisBridge: false
    gpacMp4boxExecutionInThisBridge: false
    dockerExecutionInThisBridge: false
    privateMediaProcessing: false
    userMediaProcessing: false
    ffmpegFfprobeExecution: false
    dockerPushDeploy: false
    remotionExecution: false
    supabaseMutation: false
    sqlExecution: false
    signedUrlCreation: false
    publicArtifactCreation: false
    finalRenderExport: false
    externalBetaExpansion: false
    paidProductionUnlock: false
    productionUnlock: false
  }
  productReadyEndToEndLocalOssTools: 0
  nextMilestone: typeof TRACKA_THREE_TOOL_EXTERNAL_AGENT_EXECUTION_BRIDGE_NEXT_MILESTONE
}

const REQUIRED_REF_FIELDS = [
  'workspaceId',
  'projectId',
  'editSessionId',
  'approvedSnapshotId',
  'approvalRecordId',
  'creditPolicyRef',
  'jobId',
  'workerLeaseId',
  'routeIdempotencyKey',
  'runtimePacketId',
  'runtimeExecutionId',
  'privateInputManifestId',
  'privateInputManifestSha256',
  'outputManifestSchemaId',
  'qaReportSchemaId',
  'cleanupPolicyId',
  'retentionPolicyId',
  'failurePolicyId',
  'auditEventParentId',
] as const

function pushOnce<T>(list: T[], value: T): void {
  if (!list.includes(value)) list.push(value)
}

function isBlank(value: unknown): boolean {
  return typeof value !== 'string' || value.trim().length === 0
}

function hasText(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

function templatesEqual(actual: readonly string[] | undefined, expected: readonly string[]): boolean {
  return actual?.length === expected.length && expected.every((template, index) => actual[index] === template)
}

function hasUnsafeRequest(input: ThreeToolExternalAgentExecutionBridgeInput): boolean {
  return [
    input.ffmpegFfprobeExpansionRequested,
    input.routeExecutionRequestedNow,
    input.workerDispatchRequestedNow,
    input.workerExecutionRequestedNow,
    input.gstreamerExecutionRequestedNow,
    input.mkvtoolnixExecutionRequestedNow,
    input.gpacMp4boxExecutionRequestedNow,
    input.dockerExecutionRequestedNow,
    input.dockerPushDeployRequestedNow,
    input.remotionRenderRequestedNow,
    input.supabaseMutationRequestedNow,
    input.sqlExecutionRequestedNow,
    input.signedUrlCreationRequestedNow,
    input.publicArtifactRequestedNow,
    input.finalRenderExportRequestedNow,
    input.externalBetaExpansionRequestedNow,
    input.paidProductionUnlockRequestedNow,
    input.productionUnlockRequestedNow,
  ].some(Boolean)
}

function hasUnsupportedExternalAgentInput(input: ThreeToolExternalAgentExecutionBridgeInput): boolean {
  return [
    input.rawCommandString,
    input.rawChat,
    input.arbitraryFilePath,
    input.publicUrlSourceOfTruth,
    input.signedUrlSourceOfTruth,
    input.arbitraryPrivateMediaRef,
  ].some(hasText)
}

function validState(input: ThreeToolExternalAgentExecutionBridgeInput): boolean {
  return (
    input.approvedSnapshotStatus === 'approved' &&
    input.approvalRecordStatus === 'approved' &&
    (input.creditPolicyMode === 'no_spend_fixture_policy' || input.creditPolicyMode === 'credit_reservation') &&
    (input.creditPolicyStatus === 'approved' || input.creditPolicyStatus === 'reserved') &&
    (input.jobStatus === 'queued' || input.jobStatus === 'leased' || input.jobStatus === 'planned') &&
    (input.workerLeaseStatus === 'claimed' ||
      input.workerLeaseStatus === 'disabled' ||
      input.workerLeaseStatus === 'planned') &&
    input.combinedExecutionRunId === TRACKA_THREE_TOOL_EXTERNAL_AGENT_EXECUTION_BRIDGE_COMBINED_RUN_ID &&
    input.combinedExecutionQaMergeSha === TRACKA_THREE_TOOL_EXTERNAL_AGENT_EXECUTION_BRIDGE_QA_MERGE_SHA &&
    input.gstreamerMkvtoolnixRunId ===
      TRACKA_THREE_TOOL_EXTERNAL_AGENT_EXECUTION_BRIDGE_GSTREAMER_MKVTOOLNIX_RUN_ID &&
    input.gpacMp4boxRunId === TRACKA_THREE_TOOL_EXTERNAL_AGENT_EXECUTION_BRIDGE_GPAC_MP4BOX_RUN_ID
  )
}

function buildResult(
  input: ThreeToolExternalAgentExecutionBridgeInput,
  ok: boolean,
  status: ThreeToolExternalAgentExecutionBridgeStatus,
  blockers: ThreeToolExternalAgentExecutionBridgeStatus[],
): ThreeToolExternalAgentExecutionBridgeResult {
  const sanitized = {
    workspaceId: input.workspaceId ?? '',
    projectId: input.projectId ?? '',
    editSessionId: input.editSessionId ?? '',
    approvedSnapshotId: input.approvedSnapshotId ?? '',
    approvalRecordId: input.approvalRecordId ?? '',
    creditPolicyRef: input.creditPolicyRef ?? '',
    creditPolicyMode: input.creditPolicyMode === 'credit_reservation' ? 'credit_reservation' : 'no_spend_fixture_policy',
    jobId: input.jobId ?? '',
    jobStatus: ['queued', 'leased', 'planned'].includes(String(input.jobStatus))
      ? input.jobStatus as 'queued' | 'leased' | 'planned'
      : 'planned',
    workerLeaseId: input.workerLeaseId ?? '',
    workerLeaseStatus: ['claimed', 'disabled', 'planned'].includes(String(input.workerLeaseStatus))
      ? input.workerLeaseStatus as 'claimed' | 'disabled' | 'planned'
      : 'planned',
    routeIdempotencyKey: input.routeIdempotencyKey ?? '',
    runtimePacketId: input.runtimePacketId ?? '',
    runtimeExecutionId: input.runtimeExecutionId ?? '',
    privateInputManifestId: input.privateInputManifestId ?? '',
    privateInputManifestSha256: input.privateInputManifestSha256 ?? '',
    outputManifestSchemaId: input.outputManifestSchemaId ?? '',
    qaReportSchemaId: input.qaReportSchemaId ?? '',
    cleanupPolicyId: input.cleanupPolicyId ?? '',
    retentionPolicyId: input.retentionPolicyId ?? '',
    failurePolicyId: input.failurePolicyId ?? '',
    auditEventParentId: input.auditEventParentId ?? '',
    combinedExecutionRunId: TRACKA_THREE_TOOL_EXTERNAL_AGENT_EXECUTION_BRIDGE_COMBINED_RUN_ID,
    combinedExecutionQaMergeSha: TRACKA_THREE_TOOL_EXTERNAL_AGENT_EXECUTION_BRIDGE_QA_MERGE_SHA,
    gstreamerMkvtoolnixRunId: TRACKA_THREE_TOOL_EXTERNAL_AGENT_EXECUTION_BRIDGE_GSTREAMER_MKVTOOLNIX_RUN_ID,
    gpacMp4boxRunId: TRACKA_THREE_TOOL_EXTERNAL_AGENT_EXECUTION_BRIDGE_GPAC_MP4BOX_RUN_ID,
  } satisfies ThreeToolExternalAgentExecutionBridgeResult['sanitizedRequest']

  return {
    packet: TRACKA_THREE_TOOL_EXTERNAL_AGENT_EXECUTION_BRIDGE_PACKET,
    decision: TRACKA_THREE_TOOL_EXTERNAL_AGENT_EXECUTION_BRIDGE_DECISION,
    execution: TRACKA_THREE_TOOL_EXTERNAL_AGENT_EXECUTION_BRIDGE_EXECUTION,
    ok,
    status,
    blockers,
    confirmationGate: TRACKA_THREE_TOOL_EXTERNAL_AGENT_EXECUTION_BRIDGE_CONFIRM_ENV,
    confirmationRequiredForFutureDryRun: true,
    directRuntimeExecutionInThisBridge: false,
    activeNativeContainerToolLaneCount: 3,
    sanitizedRequest: sanitized,
    childRouteBridges: {
      gstreamerMkvtoolnix: {
        routePath: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_ROUTE_PATH,
        commandTemplates: [
          ...RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_ALLOWED_TEMPLATES,
        ],
        input: buildGstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridgeInput({
          workspaceId: sanitized.workspaceId,
          projectId: sanitized.projectId,
          approvedSnapshotId: sanitized.approvedSnapshotId,
          approvalRecordId: sanitized.approvalRecordId,
          creditOrNoSpendPolicyId: sanitized.creditPolicyRef,
          jobId: `${sanitized.jobId}-gstreamer-mkvtoolnix`,
          workerLeaseId: `${sanitized.workerLeaseId}-gstreamer-mkvtoolnix`,
          routeIdempotencyKey: `${sanitized.routeIdempotencyKey}-gstreamer-mkvtoolnix`,
          runtimePacketId: `${sanitized.runtimePacketId}-gstreamer-mkvtoolnix`,
          runtimeExecutionId: `${sanitized.runtimeExecutionId}-gstreamer-mkvtoolnix`,
          privateInputManifestId: `${sanitized.privateInputManifestId}-gstreamer-mkvtoolnix`,
          outputManifestSchemaId: sanitized.outputManifestSchemaId,
          qaReportSchemaId: sanitized.qaReportSchemaId,
          cleanupPolicyId: sanitized.cleanupPolicyId,
          retentionPolicyId: sanitized.retentionPolicyId,
          failurePolicyId: sanitized.failurePolicyId,
        }),
      },
      gpacMp4box: {
        routePath: TRACKA_GPAC_MP4BOX_EXECUTION_READY_ROUTE_WORKER_BRIDGE_ROUTE_PATH,
        commandTemplates: [...TRACKA_GPAC_MP4BOX_EXECUTION_READY_ROUTE_WORKER_BRIDGE_ALLOWED_TEMPLATES],
        input: buildGpacMp4boxExecutionReadyRouteWorkerBridgeInput({
          workspaceId: sanitized.workspaceId,
          projectId: sanitized.projectId,
          approvedSnapshotId: sanitized.approvedSnapshotId,
          approvalRecordId: sanitized.approvalRecordId,
          creditOrNoSpendPolicyId: sanitized.creditPolicyRef,
          jobId: `${sanitized.jobId}-gpac-mp4box`,
          workerLeaseId: `${sanitized.workerLeaseId}-gpac-mp4box`,
          routeIdempotencyKey: `${sanitized.routeIdempotencyKey}-gpac-mp4box`,
          runtimePacketId: `${sanitized.runtimePacketId}-gpac-mp4box`,
          runtimeExecutionId: `${sanitized.runtimeExecutionId}-gpac-mp4box`,
          privateInputManifestId: `${sanitized.privateInputManifestId}-gpac-mp4box`,
          outputManifestSchemaId: sanitized.outputManifestSchemaId,
          qaReportSchemaId: sanitized.qaReportSchemaId,
          cleanupPolicyId: sanitized.cleanupPolicyId,
          retentionPolicyId: sanitized.retentionPolicyId,
          failurePolicyId: sanitized.failurePolicyId,
        }),
      },
    },
    safety: {
      routeExecution: false,
      workerDispatch: false,
      workerExecution: false,
      gstreamerExecutionInThisBridge: false,
      mkvtoolnixExecutionInThisBridge: false,
      gpacMp4boxExecutionInThisBridge: false,
      dockerExecutionInThisBridge: false,
      privateMediaProcessing: false,
      userMediaProcessing: false,
      ffmpegFfprobeExecution: false,
      dockerPushDeploy: false,
      remotionExecution: false,
      supabaseMutation: false,
      sqlExecution: false,
      signedUrlCreation: false,
      publicArtifactCreation: false,
      finalRenderExport: false,
      externalBetaExpansion: false,
      paidProductionUnlock: false,
      productionUnlock: false,
    },
    productReadyEndToEndLocalOssTools: 0,
    nextMilestone: TRACKA_THREE_TOOL_EXTERNAL_AGENT_EXECUTION_BRIDGE_NEXT_MILESTONE,
  }
}

export function buildThreeToolExternalAgentExecutionBridgeInput(
  overrides: Partial<ThreeToolExternalAgentExecutionBridgeInput> = {},
): ThreeToolExternalAgentExecutionBridgeInput {
  return {
    workspaceId: 'workspace-three-tool-external-agent-bridge',
    projectId: 'project-three-tool-external-agent-bridge',
    editSessionId: 'edit-session-three-tool-external-agent-bridge',
    approvedSnapshotId: 'approved-snapshot-three-tool-external-agent-bridge',
    approvedSnapshotStatus: 'approved',
    approvalRecordId: 'approval-three-tool-external-agent-bridge',
    approvalRecordStatus: 'approved',
    creditPolicyRef: 'no-spend-policy-three-tool-external-agent-bridge',
    creditPolicyMode: 'no_spend_fixture_policy',
    creditPolicyStatus: 'approved',
    jobId: 'job-three-tool-external-agent-bridge',
    jobStatus: 'planned',
    workerLeaseId: 'worker-lease-three-tool-external-agent-bridge',
    workerLeaseStatus: 'planned',
    routeIdempotencyKey: 'idem-three-tool-external-agent-bridge',
    runtimePacketId: 'runtime-packet-three-tool-external-agent-bridge',
    runtimeExecutionId: 'runtime-execution-three-tool-external-agent-bridge',
    privateInputManifestId: 'private-input-manifest-three-tool-external-agent-bridge',
    privateInputManifestSha256: 'a'.repeat(64),
    outputManifestSchemaId: 'output-manifest-schema-three-tool-external-agent-bridge',
    qaReportSchemaId: 'qa-report-schema-three-tool-external-agent-bridge',
    cleanupPolicyId: 'cleanup-policy-three-tool-external-agent-bridge',
    retentionPolicyId: 'retention-policy-three-tool-external-agent-bridge',
    failurePolicyId: 'failure-policy-three-tool-external-agent-bridge',
    auditEventParentId: 'audit-three-tool-external-agent-bridge',
    combinedExecutionRunId: TRACKA_THREE_TOOL_EXTERNAL_AGENT_EXECUTION_BRIDGE_COMBINED_RUN_ID,
    combinedExecutionQaMergeSha: TRACKA_THREE_TOOL_EXTERNAL_AGENT_EXECUTION_BRIDGE_QA_MERGE_SHA,
    gstreamerMkvtoolnixRunId: TRACKA_THREE_TOOL_EXTERNAL_AGENT_EXECUTION_BRIDGE_GSTREAMER_MKVTOOLNIX_RUN_ID,
    gpacMp4boxRunId: TRACKA_THREE_TOOL_EXTERNAL_AGENT_EXECUTION_BRIDGE_GPAC_MP4BOX_RUN_ID,
    gstreamerMkvtoolnixCommandTemplates: [
      ...RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_ALLOWED_TEMPLATES,
    ],
    gpacMp4boxCommandTemplates: [...TRACKA_GPAC_MP4BOX_EXECUTION_READY_ROUTE_WORKER_BRIDGE_ALLOWED_TEMPLATES],
    routeExecutionRequestedNow: false,
    workerDispatchRequestedNow: false,
    workerExecutionRequestedNow: false,
    gstreamerExecutionRequestedNow: false,
    mkvtoolnixExecutionRequestedNow: false,
    gpacMp4boxExecutionRequestedNow: false,
    dockerExecutionRequestedNow: false,
    dockerPushDeployRequestedNow: false,
    remotionRenderRequestedNow: false,
    supabaseMutationRequestedNow: false,
    sqlExecutionRequestedNow: false,
    signedUrlCreationRequestedNow: false,
    publicArtifactRequestedNow: false,
    finalRenderExportRequestedNow: false,
    externalBetaExpansionRequestedNow: false,
    paidProductionUnlockRequestedNow: false,
    productionUnlockRequestedNow: false,
    ...overrides,
  }
}

export function validateThreeToolExternalAgentExecutionBridgeInput(
  input: ThreeToolExternalAgentExecutionBridgeInput,
): ThreeToolExternalAgentExecutionBridgeResult {
  const blockers: ThreeToolExternalAgentExecutionBridgeStatus[] = []

  for (const field of REQUIRED_REF_FIELDS) {
    if (isBlank(input[field])) {
      pushOnce(blockers, 'blocked_missing_three_tool_external_agent_execution_bridge_reference')
    }
  }
  if (!validState(input)) pushOnce(blockers, 'blocked_invalid_three_tool_external_agent_execution_bridge_state')
  if (
    !templatesEqual(
      input.gstreamerMkvtoolnixCommandTemplates,
      RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_ALLOWED_TEMPLATES,
    ) ||
    !templatesEqual(
      input.gpacMp4boxCommandTemplates,
      TRACKA_GPAC_MP4BOX_EXECUTION_READY_ROUTE_WORKER_BRIDGE_ALLOWED_TEMPLATES,
    )
  ) {
    pushOnce(blockers, 'blocked_unapproved_three_tool_external_agent_command_template')
  }
  if (hasUnsupportedExternalAgentInput(input)) {
    pushOnce(blockers, 'blocked_unsupported_three_tool_external_agent_input')
  }
  if (hasUnsafeRequest(input)) {
    pushOnce(blockers, 'blocked_unsafe_three_tool_external_agent_execution_bridge_request')
  }

  return buildResult(
    input,
    blockers.length === 0,
    blockers[0] ?? TRACKA_THREE_TOOL_EXTERNAL_AGENT_EXECUTION_BRIDGE_READY_STATUS,
    blockers,
  )
}

export function summarizeThreeToolExternalAgentExecutionBridgeBoundary(): string[] {
  return [
    'External agents may submit only structured three-tool generated-fixture bridge envelopes.',
    'The bridge composes the existing GStreamer/MKVToolNix and GPAC/MP4Box route-worker bridge contracts.',
    'This bridge source packet performs no route execution, worker dispatch, Docker execution, or tool execution.',
    'Raw commands, raw chat, arbitrary paths, private/user media, public URLs, signed URLs, Supabase mutation, SQL, public artifacts, and final render/export are rejected.',
    'A separate confirmation-gated bridge dry run is required before runtime invocation.',
  ]
}
