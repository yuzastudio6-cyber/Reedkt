import type { ISODateString } from '../../types/shared'

export type GpacMp4boxDisabledRuntimeScaffoldLane =
  'TRACKA-GPAC-MP4BOX-DISABLED-RUNTIME-SCAFFOLD-1'

export type GpacMp4boxDisabledRuntimeScaffoldId =
  'runtimeScaffold.gpacMp4box.disabled'

export type GpacMp4boxDisabledRuntimeScaffoldStatus =
  | 'disabled_scaffold_registered_no_runtime'
  | 'blocked_enablement_plan_invalid'
  | 'blocked_runtime_flag_not_disabled'
  | 'blocked_missing_approved_snapshot_ref'
  | 'blocked_missing_service_role_route_ref'
  | 'blocked_missing_worker_dispatch_ref'
  | 'blocked_missing_private_artifact_refs'
  | 'blocked_missing_command_allowlist_ref'
  | 'blocked_missing_qa_cleanup_audit_refs'
  | 'blocked_missing_rollback_or_residue_refs'
  | 'blocked_rejected_input_present'
  | 'blocked_runtime_execution_attempt'
  | 'blocked_storage_or_public_delivery_attempt'

export interface GpacMp4boxDisabledRuntimeScaffoldRef {
  id: string
  status: 'approved' | 'planned' | 'disabled'
}

export interface GpacMp4boxDisabledRuntimeScaffoldRejectedInputs {
  rawChat: false
  rawCommandString: false
  frontendFilePath: false
  publicUrlSourceOfTruth: false
  signedUrlSourceOfTruth: false
  arbitraryPrivateMedia: false
  providerOrModelPromptPayload: false
  serviceRoleSecretPayload: false
  broadServiceRoleHandlerPayload: false
}

export interface GpacMp4boxDisabledRuntimeScaffoldSafety {
  routeExecution: false
  workerDispatch: false
  workerExecution: false
  gpacMp4boxExecution: false
  mediaProcessing: false
  storageTransfer: false
  signedUrlCreation: false
  publicArtifactCreation: false
  supabaseMutation: false
  sqlExecution: false
  externalBetaExpansion: false
  paidProductionUnlock: false
  productionUnlock: false
}

export interface GpacMp4boxDisabledRuntimeScaffoldInput {
  lane: GpacMp4boxDisabledRuntimeScaffoldLane
  scaffoldId: GpacMp4boxDisabledRuntimeScaffoldId
  createdAt: ISODateString
  runtimeMode: 'disabled_scaffold_only'
  enabled: false
  enablementPlanRef: {
    id: 'TRACKA-GPAC-MP4BOX-GUARDED-RUNTIME-ENABLEMENT-PLAN-1'
    decision: 'tracka_gpac_mp4box_guarded_runtime_enablement_plan_passed_ready_for_disabled_runtime_scaffold'
    mergeSha: 'fd44ba5c394cf6fa61856f4c66c16d0509b70f6a'
  }
  approvedSnapshotRef: GpacMp4boxDisabledRuntimeScaffoldRef & {
    status: 'approved'
  }
  serviceRoleRouteRef: GpacMp4boxDisabledRuntimeScaffoldRef & {
    id: 'render.gpacMp4box.serviceRolePackageMock'
    status: 'disabled'
    requiresServiceRole: true
  }
  workerDispatchRef: GpacMp4boxDisabledRuntimeScaffoldRef & {
    status: 'disabled'
    dispatchEnabled: false
  }
  privateArtifactManifestRef: GpacMp4boxDisabledRuntimeScaffoldRef
  privateArtifactChecksumRef: GpacMp4boxDisabledRuntimeScaffoldRef
  qaReportRef: GpacMp4boxDisabledRuntimeScaffoldRef
  cleanupPolicyRef: GpacMp4boxDisabledRuntimeScaffoldRef
  auditRecordRef: GpacMp4boxDisabledRuntimeScaffoldRef
  commandAllowlistRef: GpacMp4boxDisabledRuntimeScaffoldRef & {
    allowedCommandTemplateIds: ['mp4box_package_validation_metadata_v1']
    rawCommandStringsAllowed: false
  }
  rollbackPolicyRef: GpacMp4boxDisabledRuntimeScaffoldRef
  residuePolicyRef: GpacMp4boxDisabledRuntimeScaffoldRef & {
    residueValidationRequired: true
  }
  rejectedInputs: GpacMp4boxDisabledRuntimeScaffoldRejectedInputs
  safety: GpacMp4boxDisabledRuntimeScaffoldSafety
}

export interface GpacMp4boxDisabledRuntimeScaffoldResult {
  lane: GpacMp4boxDisabledRuntimeScaffoldLane
  scaffoldId: GpacMp4boxDisabledRuntimeScaffoldId
  ok: boolean
  scaffoldStatus: GpacMp4boxDisabledRuntimeScaffoldStatus
  blockers: GpacMp4boxDisabledRuntimeScaffoldStatus[]
  sanitizedScaffold: {
    scaffoldId: GpacMp4boxDisabledRuntimeScaffoldId
    runtimeMode: 'disabled_scaffold_only'
    enabled: false
    enablementPlanId: string
    approvedSnapshotId: string
    serviceRoleRouteId: string
    serviceRoleRouteStatus: 'disabled'
    workerDispatchId: string
    workerDispatchEnabled: false
    privateArtifactManifestId: string
    privateArtifactChecksumId: string
    qaReportId: string
    cleanupPolicyId: string
    auditRecordId: string
    commandAllowlistId: string
    rollbackPolicyId: string
    residuePolicyId: string
    residueValidationRequired: true
    rawCommandStringsAllowed: false
    routeExecution: false
    workerDispatch: false
    workerExecution: false
    gpacMp4boxExecution: false
    mediaProcessing: false
    storageTransfer: false
    signedUrlCreation: false
    publicArtifactCreation: false
    supabaseMutation: false
    sqlExecution: false
    externalBetaExpansion: false
    paidProductionUnlock: false
    productionUnlock: false
  }
  sanitizedSummary: string
  nextRequiredGate: 'TRACKA-GPAC-MP4BOX-RUNTIME-SCAFFOLD-NEGATIVE-TESTS-1'
}

export function buildGpacMp4boxDisabledRuntimeScaffoldInput(input: {
  createdAt: ISODateString
  approvedSnapshotId?: string
}): GpacMp4boxDisabledRuntimeScaffoldInput {
  return {
    lane: 'TRACKA-GPAC-MP4BOX-DISABLED-RUNTIME-SCAFFOLD-1',
    scaffoldId: 'runtimeScaffold.gpacMp4box.disabled',
    createdAt: input.createdAt,
    runtimeMode: 'disabled_scaffold_only',
    enabled: false,
    enablementPlanRef: {
      id: 'TRACKA-GPAC-MP4BOX-GUARDED-RUNTIME-ENABLEMENT-PLAN-1',
      decision: 'tracka_gpac_mp4box_guarded_runtime_enablement_plan_passed_ready_for_disabled_runtime_scaffold',
      mergeSha: 'fd44ba5c394cf6fa61856f4c66c16d0509b70f6a',
    },
    approvedSnapshotRef: {
      id: input.approvedSnapshotId ?? 'approved-snapshot-gpac-mp4box-disabled-runtime-scaffold',
      status: 'approved',
    },
    serviceRoleRouteRef: {
      id: 'render.gpacMp4box.serviceRolePackageMock',
      status: 'disabled',
      requiresServiceRole: true,
    },
    workerDispatchRef: {
      id: 'worker-dispatch-gpac-mp4box-disabled-runtime-scaffold',
      status: 'disabled',
      dispatchEnabled: false,
    },
    privateArtifactManifestRef: {
      id: 'private-artifact-manifest-gpac-mp4box-disabled-runtime-scaffold',
      status: 'approved',
    },
    privateArtifactChecksumRef: {
      id: 'private-artifact-checksum-gpac-mp4box-disabled-runtime-scaffold',
      status: 'planned',
    },
    qaReportRef: {
      id: 'qa-report-gpac-mp4box-disabled-runtime-scaffold',
      status: 'planned',
    },
    cleanupPolicyRef: {
      id: 'cleanup-policy-gpac-mp4box-disabled-runtime-scaffold',
      status: 'approved',
    },
    auditRecordRef: {
      id: 'audit-record-gpac-mp4box-disabled-runtime-scaffold',
      status: 'planned',
    },
    commandAllowlistRef: {
      id: 'command-allowlist-gpac-mp4box-disabled-runtime-scaffold',
      status: 'approved',
      allowedCommandTemplateIds: ['mp4box_package_validation_metadata_v1'],
      rawCommandStringsAllowed: false,
    },
    rollbackPolicyRef: {
      id: 'rollback-policy-gpac-mp4box-disabled-runtime-scaffold',
      status: 'planned',
    },
    residuePolicyRef: {
      id: 'residue-policy-gpac-mp4box-disabled-runtime-scaffold',
      status: 'planned',
      residueValidationRequired: true,
    },
    rejectedInputs: {
      rawChat: false,
      rawCommandString: false,
      frontendFilePath: false,
      publicUrlSourceOfTruth: false,
      signedUrlSourceOfTruth: false,
      arbitraryPrivateMedia: false,
      providerOrModelPromptPayload: false,
      serviceRoleSecretPayload: false,
      broadServiceRoleHandlerPayload: false,
    },
    safety: {
      routeExecution: false,
      workerDispatch: false,
      workerExecution: false,
      gpacMp4boxExecution: false,
      mediaProcessing: false,
      storageTransfer: false,
      signedUrlCreation: false,
      publicArtifactCreation: false,
      supabaseMutation: false,
      sqlExecution: false,
      externalBetaExpansion: false,
      paidProductionUnlock: false,
      productionUnlock: false,
    },
  }
}

function pushOnce<T>(list: T[], value: T): void {
  if (!list.includes(value)) list.push(value)
}

function hasText(value: string): boolean {
  return value.trim().length > 0
}

function refOk(ref: GpacMp4boxDisabledRuntimeScaffoldRef): boolean {
  return hasText(ref.id)
}

function hasRejectedInput(input: GpacMp4boxDisabledRuntimeScaffoldRejectedInputs): boolean {
  return Object.values(input).some((value) => value !== false)
}

function hasRuntimeAttempt(input: GpacMp4boxDisabledRuntimeScaffoldSafety): boolean {
  return input.routeExecution ||
    input.workerDispatch ||
    input.workerExecution ||
    input.gpacMp4boxExecution ||
    input.mediaProcessing ||
    input.supabaseMutation ||
    input.sqlExecution
}

function hasDeliveryAttempt(input: GpacMp4boxDisabledRuntimeScaffoldSafety): boolean {
  return input.storageTransfer ||
    input.signedUrlCreation ||
    input.publicArtifactCreation ||
    input.externalBetaExpansion ||
    input.paidProductionUnlock ||
    input.productionUnlock
}

function buildSanitizedScaffold(
  input: GpacMp4boxDisabledRuntimeScaffoldInput,
): GpacMp4boxDisabledRuntimeScaffoldResult['sanitizedScaffold'] {
  return {
    scaffoldId: input.scaffoldId,
    runtimeMode: 'disabled_scaffold_only',
    enabled: false,
    enablementPlanId: input.enablementPlanRef.id,
    approvedSnapshotId: input.approvedSnapshotRef.id,
    serviceRoleRouteId: input.serviceRoleRouteRef.id,
    serviceRoleRouteStatus: 'disabled',
    workerDispatchId: input.workerDispatchRef.id,
    workerDispatchEnabled: false,
    privateArtifactManifestId: input.privateArtifactManifestRef.id,
    privateArtifactChecksumId: input.privateArtifactChecksumRef.id,
    qaReportId: input.qaReportRef.id,
    cleanupPolicyId: input.cleanupPolicyRef.id,
    auditRecordId: input.auditRecordRef.id,
    commandAllowlistId: input.commandAllowlistRef.id,
    rollbackPolicyId: input.rollbackPolicyRef.id,
    residuePolicyId: input.residuePolicyRef.id,
    residueValidationRequired: true,
    rawCommandStringsAllowed: false,
    routeExecution: false,
    workerDispatch: false,
    workerExecution: false,
    gpacMp4boxExecution: false,
    mediaProcessing: false,
    storageTransfer: false,
    signedUrlCreation: false,
    publicArtifactCreation: false,
    supabaseMutation: false,
    sqlExecution: false,
    externalBetaExpansion: false,
    paidProductionUnlock: false,
    productionUnlock: false,
  }
}

export function validateGpacMp4boxDisabledRuntimeScaffoldInput(
  input: GpacMp4boxDisabledRuntimeScaffoldInput,
): GpacMp4boxDisabledRuntimeScaffoldResult {
  const blockers: GpacMp4boxDisabledRuntimeScaffoldStatus[] = []

  if (
    input.enablementPlanRef.id !== 'TRACKA-GPAC-MP4BOX-GUARDED-RUNTIME-ENABLEMENT-PLAN-1' ||
    input.enablementPlanRef.decision !== 'tracka_gpac_mp4box_guarded_runtime_enablement_plan_passed_ready_for_disabled_runtime_scaffold' ||
    input.enablementPlanRef.mergeSha !== 'fd44ba5c394cf6fa61856f4c66c16d0509b70f6a'
  ) {
    pushOnce(blockers, 'blocked_enablement_plan_invalid')
  }
  if (input.runtimeMode !== 'disabled_scaffold_only' || input.enabled !== false) {
    pushOnce(blockers, 'blocked_runtime_flag_not_disabled')
  }
  if (!refOk(input.approvedSnapshotRef) || input.approvedSnapshotRef.status !== 'approved') {
    pushOnce(blockers, 'blocked_missing_approved_snapshot_ref')
  }
  if (
    !refOk(input.serviceRoleRouteRef) ||
    input.serviceRoleRouteRef.id !== 'render.gpacMp4box.serviceRolePackageMock' ||
    input.serviceRoleRouteRef.status !== 'disabled' ||
    !input.serviceRoleRouteRef.requiresServiceRole
  ) {
    pushOnce(blockers, 'blocked_missing_service_role_route_ref')
  }
  if (!refOk(input.workerDispatchRef) || input.workerDispatchRef.status !== 'disabled' || input.workerDispatchRef.dispatchEnabled) {
    pushOnce(blockers, 'blocked_missing_worker_dispatch_ref')
  }
  if (
    !refOk(input.privateArtifactManifestRef) ||
    !refOk(input.privateArtifactChecksumRef) ||
    input.privateArtifactManifestRef.status !== 'approved'
  ) {
    pushOnce(blockers, 'blocked_missing_private_artifact_refs')
  }
  if (
    !refOk(input.commandAllowlistRef) ||
    input.commandAllowlistRef.status !== 'approved' ||
    input.commandAllowlistRef.rawCommandStringsAllowed ||
    !input.commandAllowlistRef.allowedCommandTemplateIds.includes('mp4box_package_validation_metadata_v1')
  ) {
    pushOnce(blockers, 'blocked_missing_command_allowlist_ref')
  }
  if (!refOk(input.qaReportRef) || !refOk(input.cleanupPolicyRef) || !refOk(input.auditRecordRef)) {
    pushOnce(blockers, 'blocked_missing_qa_cleanup_audit_refs')
  }
  if (!refOk(input.rollbackPolicyRef) || !refOk(input.residuePolicyRef) || !input.residuePolicyRef.residueValidationRequired) {
    pushOnce(blockers, 'blocked_missing_rollback_or_residue_refs')
  }
  if (hasRejectedInput(input.rejectedInputs)) {
    pushOnce(blockers, 'blocked_rejected_input_present')
  }
  if (hasRuntimeAttempt(input.safety)) {
    pushOnce(blockers, 'blocked_runtime_execution_attempt')
  }
  if (hasDeliveryAttempt(input.safety)) {
    pushOnce(blockers, 'blocked_storage_or_public_delivery_attempt')
  }

  const ok = blockers.length === 0
  const sanitizedScaffold = buildSanitizedScaffold(input)

  return {
    lane: input.lane,
    scaffoldId: input.scaffoldId,
    ok,
    scaffoldStatus: ok ? 'disabled_scaffold_registered_no_runtime' : blockers[0],
    blockers,
    sanitizedScaffold,
    sanitizedSummary: ok
      ? 'GPAC/MP4Box disabled runtime scaffold registered as contract metadata only; route, worker, tool, storage, media, and beta/production paths remain blocked.'
      : `GPAC/MP4Box disabled runtime scaffold blocked by ${blockers.join(', ')}.`,
    nextRequiredGate: 'TRACKA-GPAC-MP4BOX-RUNTIME-SCAFFOLD-NEGATIVE-TESTS-1',
  }
}

export function summarizeGpacMp4boxDisabledRuntimeScaffoldBoundary(): string[] {
  return [
    'The scaffold is disabled by default and is represented only as a TypeScript contract.',
    'The scaffold requires approved snapshot, disabled service-role route, disabled worker dispatch, private artifact, command allowlist, QA, cleanup, audit, rollback, and residue references.',
    'Rejected inputs include raw chat, raw command strings, frontend file paths, public URLs, signed URLs as source-of-truth, arbitrary private media, provider/model prompts, service-role secret payloads, and broad service-role handler payloads.',
    'No route execution, worker dispatch, worker execution, GPAC/MP4Box execution, media processing, storage transfer, signed URL creation, public artifact creation, Supabase mutation, SQL execution, external beta expansion, paid production unlock, or production unlock is enabled.',
    'The next gate must add runtime scaffold negative tests before any live registration or execution path can be considered.',
  ]
}
