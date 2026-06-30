import type { ISODateString } from '../../types/shared'

export type GstreamerMkvtoolnixDisabledWorkerScaffoldLane =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-DISABLED-WORKER-SCAFFOLD-1'

export type GstreamerMkvtoolnixDisabledWorkerScaffoldId =
  'workerScaffold.gstreamerMkvtoolnix.disabled'

export const GSTREAMER_MKVTOOLNIX_ALLOWED_COMMAND_TEMPLATE_IDS = [
  'gst_fakesrc_fakesink_no_media_healthcheck_v1',
  'gst_controlled_generated_fixture_pipeline_v1',
  'mkvmerge_generated_subtitle_only_package_v1',
  'mkvmerge_identify_generated_subtitle_only_v1',
] as const

export type GstreamerMkvtoolnixAllowedCommandTemplateId =
  (typeof GSTREAMER_MKVTOOLNIX_ALLOWED_COMMAND_TEMPLATE_IDS)[number]

export type GstreamerMkvtoolnixDisabledWorkerScaffoldStatus =
  | 'disabled_worker_scaffold_registered_no_tool_execution'
  | 'blocked_contract_source_invalid'
  | 'blocked_scaffold_mode_not_disabled'
  | 'blocked_missing_approved_plan_snapshot'
  | 'blocked_missing_approval_record'
  | 'blocked_missing_credit_or_no_spend_policy'
  | 'blocked_missing_worker_lease'
  | 'blocked_missing_idempotency_key'
  | 'blocked_unapproved_command_template'
  | 'blocked_raw_command_string'
  | 'blocked_missing_private_input_manifest'
  | 'blocked_manifest_checksum_mismatch'
  | 'blocked_unapproved_media_source'
  | 'blocked_public_or_signed_url_source'
  | 'blocked_output_manifest_missing'
  | 'blocked_qa_report_missing'
  | 'blocked_cleanup_policy_missing'
  | 'blocked_worker_or_tool_execution_attempt'
  | 'blocked_delivery_or_unlock_attempt'

export interface GstreamerMkvtoolnixDisabledWorkerScaffoldRef {
  id: string
  status: 'approved' | 'planned' | 'disabled'
}

export interface GstreamerMkvtoolnixRejectedInputs {
  rawChat: false
  rawCommandString: false
  frontendFilePath: false
  publicUrlSourceOfTruth: false
  signedUrlSourceOfTruth: false
  arbitraryPrivateMedia: false
  unmanifestedFile: false
  providerOrModelPromptPayload: false
  serviceRoleSecretPayload: false
}

export interface GstreamerMkvtoolnixDisabledWorkerScaffoldSafety {
  workerExecution: false
  workerDispatch: false
  serviceRoleRouteExecution: false
  routeExecution: false
  gstreamerExecution: false
  mkvtoolnixExecution: false
  ffmpegFfprobeExecution: false
  dockerExecution: false
  remotionExecution: false
  mediaProcessing: false
  privateMediaProcessing: false
  userMediaProcessing: false
  supabaseMutation: false
  sqlExecution: false
  signedUrlCreation: false
  publicArtifactCreation: false
  finalRenderExport: false
  broadExternalBetaUnlock: false
  paidProductionUnlock: false
  productionUnlock: false
  dependencyMutation: false
  packageLockMutation: false
}

export interface GstreamerMkvtoolnixDisabledWorkerScaffoldInput {
  lane: GstreamerMkvtoolnixDisabledWorkerScaffoldLane
  scaffoldId: GstreamerMkvtoolnixDisabledWorkerScaffoldId
  createdAt: ISODateString
  scaffoldMode: 'disabled_worker_scaffold_only'
  enabled: false
  contractRef: {
    id: 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-AGENT-EXECUTION-CONTRACT-1'
    decision: 'completed_gstreamer_mkvtoolnix_guarded_agent_execution_contract_ready_for_disabled_worker_scaffold'
    mergeSha: '4213bb31a92c6585359f95b0d3fc13bc055b526c'
  }
  approvedPlanSnapshotRef: GstreamerMkvtoolnixDisabledWorkerScaffoldRef & {
    status: 'approved'
    version: string
  }
  approvalRecordRef: GstreamerMkvtoolnixDisabledWorkerScaffoldRef & {
    status: 'approved'
  }
  creditPolicyRef: GstreamerMkvtoolnixDisabledWorkerScaffoldRef & {
    status: 'approved'
    mode: 'no_spend_fixture_policy' | 'credit_reservation'
  }
  jobRef: GstreamerMkvtoolnixDisabledWorkerScaffoldRef
  workerLeaseRef: GstreamerMkvtoolnixDisabledWorkerScaffoldRef & {
    status: 'disabled'
    leaseRequired: true
  }
  idempotencyRef: GstreamerMkvtoolnixDisabledWorkerScaffoldRef & {
    status: 'approved'
  }
  commandTemplateRef: GstreamerMkvtoolnixDisabledWorkerScaffoldRef & {
    status: 'approved'
    templateId: GstreamerMkvtoolnixAllowedCommandTemplateId
    rawCommandStringsAllowed: false
  }
  privateInputManifestRef: GstreamerMkvtoolnixDisabledWorkerScaffoldRef & {
    status: 'approved'
    sha256: string
    checksumMatches: true
    sourceClass: 'controlled_generated_fixture' | 'approved_private_manifest'
  }
  expectedOutputManifestSchemaRef: GstreamerMkvtoolnixDisabledWorkerScaffoldRef
  expectedQaReportSchemaRef: GstreamerMkvtoolnixDisabledWorkerScaffoldRef
  cleanupPolicyRef: GstreamerMkvtoolnixDisabledWorkerScaffoldRef
  retentionPolicyRef: GstreamerMkvtoolnixDisabledWorkerScaffoldRef
  failurePolicyRef: GstreamerMkvtoolnixDisabledWorkerScaffoldRef
  auditEventParentRef: GstreamerMkvtoolnixDisabledWorkerScaffoldRef
  rejectedInputs: GstreamerMkvtoolnixRejectedInputs
  safety: GstreamerMkvtoolnixDisabledWorkerScaffoldSafety
}

export interface GstreamerMkvtoolnixDisabledWorkerScaffoldResult {
  lane: GstreamerMkvtoolnixDisabledWorkerScaffoldLane
  scaffoldId: GstreamerMkvtoolnixDisabledWorkerScaffoldId
  ok: boolean
  scaffoldStatus: GstreamerMkvtoolnixDisabledWorkerScaffoldStatus
  blockers: GstreamerMkvtoolnixDisabledWorkerScaffoldStatus[]
  sanitizedScaffold: {
    scaffoldId: GstreamerMkvtoolnixDisabledWorkerScaffoldId
    scaffoldMode: 'disabled_worker_scaffold_only'
    enabled: false
    contractId: string
    approvedPlanSnapshotId: string
    approvalRecordId: string
    creditPolicyId: string
    creditPolicyMode: 'no_spend_fixture_policy' | 'credit_reservation'
    jobId: string
    workerLeaseId: string
    workerLeaseStatus: 'disabled'
    idempotencyKeyId: string
    commandTemplateId: GstreamerMkvtoolnixAllowedCommandTemplateId
    rawCommandStringsAllowed: false
    privateInputManifestId: string
    expectedOutputManifestSchemaId: string
    expectedQaReportSchemaId: string
    cleanupPolicyId: string
    retentionPolicyId: string
    failurePolicyId: string
    auditEventParentId: string
    workerExecution: false
    workerDispatch: false
    serviceRoleRouteExecution: false
    routeExecution: false
    gstreamerExecution: false
    mkvtoolnixExecution: false
    ffmpegFfprobeExecution: false
    dockerExecution: false
    remotionExecution: false
    mediaProcessing: false
    privateMediaProcessing: false
    userMediaProcessing: false
    supabaseMutation: false
    sqlExecution: false
    signedUrlCreation: false
    publicArtifactCreation: false
    finalRenderExport: false
    broadExternalBetaUnlock: false
    paidProductionUnlock: false
    productionUnlock: false
  }
  sanitizedSummary: string
  nextRequiredGate: 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-ENABLEMENT-REVIEW-1'
}

export function buildGstreamerMkvtoolnixDisabledWorkerScaffoldInput(input: {
  createdAt: ISODateString
  approvedPlanSnapshotId?: string
  commandTemplateId?: GstreamerMkvtoolnixAllowedCommandTemplateId
}): GstreamerMkvtoolnixDisabledWorkerScaffoldInput {
  return {
    lane: 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-DISABLED-WORKER-SCAFFOLD-1',
    scaffoldId: 'workerScaffold.gstreamerMkvtoolnix.disabled',
    createdAt: input.createdAt,
    scaffoldMode: 'disabled_worker_scaffold_only',
    enabled: false,
    contractRef: {
      id: 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-AGENT-EXECUTION-CONTRACT-1',
      decision: 'completed_gstreamer_mkvtoolnix_guarded_agent_execution_contract_ready_for_disabled_worker_scaffold',
      mergeSha: '4213bb31a92c6585359f95b0d3fc13bc055b526c',
    },
    approvedPlanSnapshotRef: {
      id: input.approvedPlanSnapshotId ?? 'approved-snapshot-gstreamer-mkvtoolnix-disabled-worker-scaffold',
      status: 'approved',
      version: 'approved-plan-v1',
    },
    approvalRecordRef: {
      id: 'approval-record-gstreamer-mkvtoolnix-disabled-worker-scaffold',
      status: 'approved',
    },
    creditPolicyRef: {
      id: 'no-spend-fixture-policy-gstreamer-mkvtoolnix-disabled-worker-scaffold',
      status: 'approved',
      mode: 'no_spend_fixture_policy',
    },
    jobRef: {
      id: 'job-gstreamer-mkvtoolnix-disabled-worker-scaffold',
      status: 'planned',
    },
    workerLeaseRef: {
      id: 'worker-lease-gstreamer-mkvtoolnix-disabled-worker-scaffold',
      status: 'disabled',
      leaseRequired: true,
    },
    idempotencyRef: {
      id: 'idempotency-gstreamer-mkvtoolnix-disabled-worker-scaffold',
      status: 'approved',
    },
    commandTemplateRef: {
      id: 'command-template-gstreamer-mkvtoolnix-disabled-worker-scaffold',
      status: 'approved',
      templateId: input.commandTemplateId ?? 'gst_controlled_generated_fixture_pipeline_v1',
      rawCommandStringsAllowed: false,
    },
    privateInputManifestRef: {
      id: 'private-input-manifest-gstreamer-mkvtoolnix-disabled-worker-scaffold',
      status: 'approved',
      sha256: 'sha256-gstreamer-mkvtoolnix-disabled-worker-scaffold-input-manifest',
      checksumMatches: true,
      sourceClass: 'controlled_generated_fixture',
    },
    expectedOutputManifestSchemaRef: {
      id: 'output-manifest-schema-gstreamer-mkvtoolnix-disabled-worker-scaffold',
      status: 'approved',
    },
    expectedQaReportSchemaRef: {
      id: 'qa-report-schema-gstreamer-mkvtoolnix-disabled-worker-scaffold',
      status: 'approved',
    },
    cleanupPolicyRef: {
      id: 'cleanup-policy-gstreamer-mkvtoolnix-disabled-worker-scaffold',
      status: 'approved',
    },
    retentionPolicyRef: {
      id: 'retention-policy-gstreamer-mkvtoolnix-disabled-worker-scaffold',
      status: 'approved',
    },
    failurePolicyRef: {
      id: 'failure-policy-gstreamer-mkvtoolnix-disabled-worker-scaffold',
      status: 'approved',
    },
    auditEventParentRef: {
      id: 'audit-event-parent-gstreamer-mkvtoolnix-disabled-worker-scaffold',
      status: 'planned',
    },
    rejectedInputs: {
      rawChat: false,
      rawCommandString: false,
      frontendFilePath: false,
      publicUrlSourceOfTruth: false,
      signedUrlSourceOfTruth: false,
      arbitraryPrivateMedia: false,
      unmanifestedFile: false,
      providerOrModelPromptPayload: false,
      serviceRoleSecretPayload: false,
    },
    safety: {
      workerExecution: false,
      workerDispatch: false,
      serviceRoleRouteExecution: false,
      routeExecution: false,
      gstreamerExecution: false,
      mkvtoolnixExecution: false,
      ffmpegFfprobeExecution: false,
      dockerExecution: false,
      remotionExecution: false,
      mediaProcessing: false,
      privateMediaProcessing: false,
      userMediaProcessing: false,
      supabaseMutation: false,
      sqlExecution: false,
      signedUrlCreation: false,
      publicArtifactCreation: false,
      finalRenderExport: false,
      broadExternalBetaUnlock: false,
      paidProductionUnlock: false,
      productionUnlock: false,
      dependencyMutation: false,
      packageLockMutation: false,
    },
  }
}

function pushOnce<T>(list: T[], value: T): void {
  if (!list.includes(value)) list.push(value)
}

function hasText(value: string): boolean {
  return value.trim().length > 0
}

function refOk(ref: GstreamerMkvtoolnixDisabledWorkerScaffoldRef): boolean {
  return hasText(ref.id)
}

function allowedTemplateId(value: string): value is GstreamerMkvtoolnixAllowedCommandTemplateId {
  return GSTREAMER_MKVTOOLNIX_ALLOWED_COMMAND_TEMPLATE_IDS.includes(
    value as GstreamerMkvtoolnixAllowedCommandTemplateId,
  )
}

function hasWorkerOrToolExecutionAttempt(input: GstreamerMkvtoolnixDisabledWorkerScaffoldSafety): boolean {
  return input.workerExecution ||
    input.workerDispatch ||
    input.serviceRoleRouteExecution ||
    input.routeExecution ||
    input.gstreamerExecution ||
    input.mkvtoolnixExecution ||
    input.ffmpegFfprobeExecution ||
    input.dockerExecution ||
    input.remotionExecution ||
    input.mediaProcessing ||
    input.privateMediaProcessing ||
    input.userMediaProcessing ||
    input.supabaseMutation ||
    input.sqlExecution
}

function hasDeliveryOrUnlockAttempt(input: GstreamerMkvtoolnixDisabledWorkerScaffoldSafety): boolean {
  return input.signedUrlCreation ||
    input.publicArtifactCreation ||
    input.finalRenderExport ||
    input.broadExternalBetaUnlock ||
    input.paidProductionUnlock ||
    input.productionUnlock ||
    input.dependencyMutation ||
    input.packageLockMutation
}

export function validateGstreamerMkvtoolnixDisabledWorkerScaffoldInput(
  input: GstreamerMkvtoolnixDisabledWorkerScaffoldInput,
): GstreamerMkvtoolnixDisabledWorkerScaffoldResult {
  const blockers: GstreamerMkvtoolnixDisabledWorkerScaffoldStatus[] = []

  if (
    input.contractRef.id !== 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-AGENT-EXECUTION-CONTRACT-1' ||
    input.contractRef.decision !==
      'completed_gstreamer_mkvtoolnix_guarded_agent_execution_contract_ready_for_disabled_worker_scaffold' ||
    input.contractRef.mergeSha !== '4213bb31a92c6585359f95b0d3fc13bc055b526c'
  ) {
    pushOnce(blockers, 'blocked_contract_source_invalid')
  }

  if (
    input.scaffoldMode !== 'disabled_worker_scaffold_only' ||
    input.enabled !== false
  ) {
    pushOnce(blockers, 'blocked_scaffold_mode_not_disabled')
  }

  if (
    !refOk(input.approvedPlanSnapshotRef) ||
    input.approvedPlanSnapshotRef.status !== 'approved' ||
    !hasText(input.approvedPlanSnapshotRef.version)
  ) {
    pushOnce(blockers, 'blocked_missing_approved_plan_snapshot')
  }

  if (!refOk(input.approvalRecordRef) || input.approvalRecordRef.status !== 'approved') {
    pushOnce(blockers, 'blocked_missing_approval_record')
  }

  if (
    !refOk(input.creditPolicyRef) ||
    input.creditPolicyRef.status !== 'approved' ||
    !['no_spend_fixture_policy', 'credit_reservation'].includes(input.creditPolicyRef.mode)
  ) {
    pushOnce(blockers, 'blocked_missing_credit_or_no_spend_policy')
  }

  if (
    !refOk(input.workerLeaseRef) ||
    input.workerLeaseRef.status !== 'disabled' ||
    input.workerLeaseRef.leaseRequired !== true
  ) {
    pushOnce(blockers, 'blocked_missing_worker_lease')
  }

  if (!refOk(input.idempotencyRef) || input.idempotencyRef.status !== 'approved') {
    pushOnce(blockers, 'blocked_missing_idempotency_key')
  }

  if (
    !refOk(input.commandTemplateRef) ||
    input.commandTemplateRef.status !== 'approved' ||
    !allowedTemplateId(input.commandTemplateRef.templateId)
  ) {
    pushOnce(blockers, 'blocked_unapproved_command_template')
  }
  if (input.commandTemplateRef.rawCommandStringsAllowed !== false || input.rejectedInputs.rawCommandString !== false) {
    pushOnce(blockers, 'blocked_raw_command_string')
  }

  if (
    !refOk(input.privateInputManifestRef) ||
    input.privateInputManifestRef.status !== 'approved' ||
    !hasText(input.privateInputManifestRef.sha256)
  ) {
    pushOnce(blockers, 'blocked_missing_private_input_manifest')
  }
  if (input.privateInputManifestRef.checksumMatches !== true) {
    pushOnce(blockers, 'blocked_manifest_checksum_mismatch')
  }

  if (
    input.rejectedInputs.frontendFilePath ||
    input.rejectedInputs.arbitraryPrivateMedia ||
    input.rejectedInputs.unmanifestedFile ||
    input.rejectedInputs.rawChat ||
    input.rejectedInputs.providerOrModelPromptPayload ||
    input.rejectedInputs.serviceRoleSecretPayload
  ) {
    pushOnce(blockers, 'blocked_unapproved_media_source')
  }

  if (input.rejectedInputs.publicUrlSourceOfTruth || input.rejectedInputs.signedUrlSourceOfTruth) {
    pushOnce(blockers, 'blocked_public_or_signed_url_source')
  }

  if (!refOk(input.expectedOutputManifestSchemaRef) || input.expectedOutputManifestSchemaRef.status !== 'approved') {
    pushOnce(blockers, 'blocked_output_manifest_missing')
  }

  if (!refOk(input.expectedQaReportSchemaRef) || input.expectedQaReportSchemaRef.status !== 'approved') {
    pushOnce(blockers, 'blocked_qa_report_missing')
  }

  if (
    !refOk(input.cleanupPolicyRef) ||
    input.cleanupPolicyRef.status !== 'approved' ||
    !refOk(input.retentionPolicyRef) ||
    input.retentionPolicyRef.status !== 'approved' ||
    !refOk(input.failurePolicyRef) ||
    input.failurePolicyRef.status !== 'approved'
  ) {
    pushOnce(blockers, 'blocked_cleanup_policy_missing')
  }

  if (hasWorkerOrToolExecutionAttempt(input.safety)) {
    pushOnce(blockers, 'blocked_worker_or_tool_execution_attempt')
  }

  if (hasDeliveryOrUnlockAttempt(input.safety)) {
    pushOnce(blockers, 'blocked_delivery_or_unlock_attempt')
  }

  const ok = blockers.length === 0

  return {
    lane: input.lane,
    scaffoldId: input.scaffoldId,
    ok,
    scaffoldStatus: ok ? 'disabled_worker_scaffold_registered_no_tool_execution' : blockers[0],
    blockers,
    sanitizedScaffold: {
      scaffoldId: input.scaffoldId,
      scaffoldMode: input.scaffoldMode,
      enabled: false,
      contractId: input.contractRef.id,
      approvedPlanSnapshotId: input.approvedPlanSnapshotRef.id,
      approvalRecordId: input.approvalRecordRef.id,
      creditPolicyId: input.creditPolicyRef.id,
      creditPolicyMode: input.creditPolicyRef.mode,
      jobId: input.jobRef.id,
      workerLeaseId: input.workerLeaseRef.id,
      workerLeaseStatus: 'disabled',
      idempotencyKeyId: input.idempotencyRef.id,
      commandTemplateId: input.commandTemplateRef.templateId,
      rawCommandStringsAllowed: false,
      privateInputManifestId: input.privateInputManifestRef.id,
      expectedOutputManifestSchemaId: input.expectedOutputManifestSchemaRef.id,
      expectedQaReportSchemaId: input.expectedQaReportSchemaRef.id,
      cleanupPolicyId: input.cleanupPolicyRef.id,
      retentionPolicyId: input.retentionPolicyRef.id,
      failurePolicyId: input.failurePolicyRef.id,
      auditEventParentId: input.auditEventParentRef.id,
      workerExecution: false,
      workerDispatch: false,
      serviceRoleRouteExecution: false,
      routeExecution: false,
      gstreamerExecution: false,
      mkvtoolnixExecution: false,
      ffmpegFfprobeExecution: false,
      dockerExecution: false,
      remotionExecution: false,
      mediaProcessing: false,
      privateMediaProcessing: false,
      userMediaProcessing: false,
      supabaseMutation: false,
      sqlExecution: false,
      signedUrlCreation: false,
      publicArtifactCreation: false,
      finalRenderExport: false,
      broadExternalBetaUnlock: false,
      paidProductionUnlock: false,
      productionUnlock: false,
    },
    sanitizedSummary: ok
      ? 'GStreamer/MKVToolNix disabled worker scaffold registered as metadata-only; worker dispatch and tool execution remain disabled.'
      : `GStreamer/MKVToolNix disabled worker scaffold blocked by ${blockers.join(', ')}.`,
    nextRequiredGate: 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-ENABLEMENT-REVIEW-1',
  }
}
