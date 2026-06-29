import type { ISODateString } from '../../types/shared'

export type GpacMp4boxDisabledHandlerRegistrationScaffoldLane =
  'TRACKA-GPAC-MP4BOX-DISABLED-HANDLER-REGISTRATION-SCAFFOLD-1'

export type GpacMp4boxDisabledHandlerRegistrationScaffoldId =
  'handlerRegistrationScaffold.gpacMp4box.disabled'

export type GpacMp4boxDisabledHandlerRegistrationScaffoldStatus =
  | 'disabled_handler_registration_scaffold_registered_no_executable_handler'
  | 'blocked_guarded_handler_registration_plan_invalid'
  | 'blocked_missing_backend_service_role_context'
  | 'blocked_handler_registration_not_disabled'
  | 'blocked_feature_flag_enabled'
  | 'blocked_missing_approved_snapshot_guard'
  | 'blocked_missing_route_idempotency_guard'
  | 'blocked_missing_private_artifact_manifest_guard'
  | 'blocked_missing_command_allowlist_guard'
  | 'blocked_missing_negative_tests_guard'
  | 'blocked_missing_storage_or_public_artifact_gate'
  | 'blocked_missing_cleanup_audit_reference'
  | 'blocked_missing_operator_confirmation_guard'
  | 'blocked_rejected_input_present'
  | 'blocked_runtime_execution_attempt'
  | 'blocked_storage_or_public_artifact_attempt'

export interface GpacMp4boxDisabledHandlerRegistrationScaffoldRef {
  id: string
  status: 'approved' | 'planned' | 'disabled'
}

export interface GpacMp4boxDisabledHandlerRegistrationScaffoldRejectedInputs {
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

export interface GpacMp4boxDisabledHandlerRegistrationScaffoldSafety {
  executableHandlerRegistration: false
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
  finalDeliveryExport: false
}

export interface GpacMp4boxDisabledHandlerRegistrationScaffoldInput {
  lane: GpacMp4boxDisabledHandlerRegistrationScaffoldLane
  scaffoldId: GpacMp4boxDisabledHandlerRegistrationScaffoldId
  createdAt: ISODateString
  routeId: 'render.gpacMp4box.disabledHandlerRegistrationScaffold'
  routeOwner: 'backend_service_role_only'
  handlerRegistrationMode: 'disabled_handler_registration_scaffold_only'
  enabled: false
  guardedHandlerRegistrationPlanRef: {
    id: 'TRACKA-GPAC-MP4BOX-GUARDED-HANDLER-REGISTRATION-PLAN-1'
    decision: 'tracka_gpac_mp4box_guarded_handler_registration_plan_passed_ready_for_disabled_handler_registration_scaffold'
    mergeSha: '86a14cd98a91700e3a607787198dc2ce4fcc92d0'
  }
  serviceRoleContext: {
    serviceRoleOwned: true
    serviceRoleSecretPayloadAccess: false
    frontendCredentialExposure: false
    broadServiceRoleHandler: false
  }
  approvedSnapshotGuardRef: GpacMp4boxDisabledHandlerRegistrationScaffoldRef & {
    status: 'approved'
  }
  routeIdempotencyGuardRef: GpacMp4boxDisabledHandlerRegistrationScaffoldRef & {
    status: 'approved'
    idempotencyRequired: true
  }
  privateArtifactManifestGuardRef: GpacMp4boxDisabledHandlerRegistrationScaffoldRef & {
    status: 'approved'
  }
  commandAllowlistGuardRef: GpacMp4boxDisabledHandlerRegistrationScaffoldRef & {
    status: 'approved'
    rawCommandStringsAllowed: false
  }
  negativeTestsGuardRef: GpacMp4boxDisabledHandlerRegistrationScaffoldRef & {
    status: 'approved'
  }
  storageTransferGateRef: GpacMp4boxDisabledHandlerRegistrationScaffoldRef & {
    status: 'planned'
    storageTransferEnabled: false
  }
  signedPublicArtifactGateRef: GpacMp4boxDisabledHandlerRegistrationScaffoldRef & {
    status: 'planned'
    signedOrPublicArtifactsEnabled: false
  }
  cleanupAuditRef: GpacMp4boxDisabledHandlerRegistrationScaffoldRef & {
    status: 'planned'
    cleanupAuditRequired: true
  }
  operatorConfirmationGuardRef: GpacMp4boxDisabledHandlerRegistrationScaffoldRef & {
    status: 'planned'
    requiredBeforeExecution: true
    confirmed: false
  }
  handlerRegistered: false
  executableHandlerRegistered: false
  handlerEnabled: false
  featureFlagDefault: false
  runtimeExecutionApproved: false
  rejectedInputs: GpacMp4boxDisabledHandlerRegistrationScaffoldRejectedInputs
  safety: GpacMp4boxDisabledHandlerRegistrationScaffoldSafety
}

export interface GpacMp4boxDisabledHandlerRegistrationScaffoldResult {
  lane: GpacMp4boxDisabledHandlerRegistrationScaffoldLane
  scaffoldId: GpacMp4boxDisabledHandlerRegistrationScaffoldId
  ok: boolean
  scaffoldStatus: GpacMp4boxDisabledHandlerRegistrationScaffoldStatus
  blockers: GpacMp4boxDisabledHandlerRegistrationScaffoldStatus[]
  sanitizedScaffold: {
    scaffoldId: GpacMp4boxDisabledHandlerRegistrationScaffoldId
    routeId: 'render.gpacMp4box.disabledHandlerRegistrationScaffold'
    routeOwner: 'backend_service_role_only'
    handlerRegistrationMode: 'disabled_handler_registration_scaffold_only'
    enabled: false
    handlerRegistered: false
    executableHandlerRegistered: false
    handlerEnabled: false
    featureFlagDefault: false
    runtimeExecutionApproved: false
    guardedHandlerRegistrationPlanId: string
    serviceRoleOwned: true
    serviceRoleSecretPayloadAccess: false
    frontendCredentialExposure: false
    broadServiceRoleHandler: false
    approvedSnapshotGuardId: string
    routeIdempotencyGuardId: string
    privateArtifactManifestGuardId: string
    commandAllowlistGuardId: string
    negativeTestsGuardId: string
    storageTransferGateId: string
    signedPublicArtifactGateId: string
    cleanupAuditId: string
    operatorConfirmationGuardId: string
    operatorConfirmed: false
    executableHandlerRegistration: false
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
    finalDeliveryExport: false
  }
  sanitizedSummary: string
  nextRequiredGate: 'TRACKA-GPAC-MP4BOX-HANDLER-REGISTRATION-SCAFFOLD-NEGATIVE-TESTS-1'
}

export function buildGpacMp4boxDisabledHandlerRegistrationScaffoldInput(input: {
  createdAt: ISODateString
  approvedSnapshotGuardId?: string
}): GpacMp4boxDisabledHandlerRegistrationScaffoldInput {
  return {
    lane: 'TRACKA-GPAC-MP4BOX-DISABLED-HANDLER-REGISTRATION-SCAFFOLD-1',
    scaffoldId: 'handlerRegistrationScaffold.gpacMp4box.disabled',
    createdAt: input.createdAt,
    routeId: 'render.gpacMp4box.disabledHandlerRegistrationScaffold',
    routeOwner: 'backend_service_role_only',
    handlerRegistrationMode: 'disabled_handler_registration_scaffold_only',
    enabled: false,
    guardedHandlerRegistrationPlanRef: {
      id: 'TRACKA-GPAC-MP4BOX-GUARDED-HANDLER-REGISTRATION-PLAN-1',
      decision: 'tracka_gpac_mp4box_guarded_handler_registration_plan_passed_ready_for_disabled_handler_registration_scaffold',
      mergeSha: '86a14cd98a91700e3a607787198dc2ce4fcc92d0',
    },
    serviceRoleContext: {
      serviceRoleOwned: true,
      serviceRoleSecretPayloadAccess: false,
      frontendCredentialExposure: false,
      broadServiceRoleHandler: false,
    },
    approvedSnapshotGuardRef: {
      id: input.approvedSnapshotGuardId ?? 'approved-snapshot-guard-gpac-mp4box-disabled-handler-registration-scaffold',
      status: 'approved',
    },
    routeIdempotencyGuardRef: {
      id: 'route-idempotency-guard-gpac-mp4box-disabled-handler-registration-scaffold',
      status: 'approved',
      idempotencyRequired: true,
    },
    privateArtifactManifestGuardRef: {
      id: 'private-artifact-manifest-guard-gpac-mp4box-disabled-handler-registration-scaffold',
      status: 'approved',
    },
    commandAllowlistGuardRef: {
      id: 'command-allowlist-guard-gpac-mp4box-disabled-handler-registration-scaffold',
      status: 'approved',
      rawCommandStringsAllowed: false,
    },
    negativeTestsGuardRef: {
      id: 'negative-tests-guard-gpac-mp4box-disabled-handler-registration-scaffold',
      status: 'approved',
    },
    storageTransferGateRef: {
      id: 'storage-transfer-gate-gpac-mp4box-disabled-handler-registration-scaffold',
      status: 'planned',
      storageTransferEnabled: false,
    },
    signedPublicArtifactGateRef: {
      id: 'signed-public-artifact-gate-gpac-mp4box-disabled-handler-registration-scaffold',
      status: 'planned',
      signedOrPublicArtifactsEnabled: false,
    },
    cleanupAuditRef: {
      id: 'cleanup-audit-ref-gpac-mp4box-disabled-handler-registration-scaffold',
      status: 'planned',
      cleanupAuditRequired: true,
    },
    operatorConfirmationGuardRef: {
      id: 'operator-confirmation-guard-gpac-mp4box-disabled-handler-registration-scaffold',
      status: 'planned',
      requiredBeforeExecution: true,
      confirmed: false,
    },
    handlerRegistered: false,
    executableHandlerRegistered: false,
    handlerEnabled: false,
    featureFlagDefault: false,
    runtimeExecutionApproved: false,
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
      executableHandlerRegistration: false,
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
      finalDeliveryExport: false,
    },
  }
}

function pushOnce<T>(list: T[], value: T): void {
  if (!list.includes(value)) list.push(value)
}

function hasText(value: string): boolean {
  return value.trim().length > 0
}

function refOk(ref: GpacMp4boxDisabledHandlerRegistrationScaffoldRef): boolean {
  return hasText(ref.id)
}

function hasRejectedInput(input: GpacMp4boxDisabledHandlerRegistrationScaffoldRejectedInputs): boolean {
  return Object.values(input).some((value) => value !== false)
}

function hasRuntimeAttempt(input: GpacMp4boxDisabledHandlerRegistrationScaffoldSafety): boolean {
  return input.executableHandlerRegistration ||
    input.routeExecution ||
    input.workerDispatch ||
    input.workerExecution ||
    input.gpacMp4boxExecution ||
    input.mediaProcessing ||
    input.supabaseMutation ||
    input.sqlExecution
}

function hasDeliveryAttempt(input: GpacMp4boxDisabledHandlerRegistrationScaffoldSafety): boolean {
  return input.storageTransfer ||
    input.signedUrlCreation ||
    input.publicArtifactCreation ||
    input.externalBetaExpansion ||
    input.paidProductionUnlock ||
    input.productionUnlock ||
    input.finalDeliveryExport
}

function buildSanitizedScaffold(
  input: GpacMp4boxDisabledHandlerRegistrationScaffoldInput,
): GpacMp4boxDisabledHandlerRegistrationScaffoldResult['sanitizedScaffold'] {
  return {
    scaffoldId: input.scaffoldId,
    routeId: input.routeId,
    routeOwner: 'backend_service_role_only',
    handlerRegistrationMode: 'disabled_handler_registration_scaffold_only',
    enabled: false,
    handlerRegistered: false,
    executableHandlerRegistered: false,
    handlerEnabled: false,
    featureFlagDefault: false,
    runtimeExecutionApproved: false,
    guardedHandlerRegistrationPlanId: input.guardedHandlerRegistrationPlanRef.id,
    serviceRoleOwned: true,
    serviceRoleSecretPayloadAccess: false,
    frontendCredentialExposure: false,
    broadServiceRoleHandler: false,
    approvedSnapshotGuardId: input.approvedSnapshotGuardRef.id,
    routeIdempotencyGuardId: input.routeIdempotencyGuardRef.id,
    privateArtifactManifestGuardId: input.privateArtifactManifestGuardRef.id,
    commandAllowlistGuardId: input.commandAllowlistGuardRef.id,
    negativeTestsGuardId: input.negativeTestsGuardRef.id,
    storageTransferGateId: input.storageTransferGateRef.id,
    signedPublicArtifactGateId: input.signedPublicArtifactGateRef.id,
    cleanupAuditId: input.cleanupAuditRef.id,
    operatorConfirmationGuardId: input.operatorConfirmationGuardRef.id,
    operatorConfirmed: false,
    executableHandlerRegistration: false,
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
    finalDeliveryExport: false,
  }
}

export function validateGpacMp4boxDisabledHandlerRegistrationScaffoldInput(
  input: GpacMp4boxDisabledHandlerRegistrationScaffoldInput,
): GpacMp4boxDisabledHandlerRegistrationScaffoldResult {
  const blockers: GpacMp4boxDisabledHandlerRegistrationScaffoldStatus[] = []

  if (
    input.guardedHandlerRegistrationPlanRef.id !== 'TRACKA-GPAC-MP4BOX-GUARDED-HANDLER-REGISTRATION-PLAN-1' ||
    input.guardedHandlerRegistrationPlanRef.decision !== 'tracka_gpac_mp4box_guarded_handler_registration_plan_passed_ready_for_disabled_handler_registration_scaffold' ||
    input.guardedHandlerRegistrationPlanRef.mergeSha !== '86a14cd98a91700e3a607787198dc2ce4fcc92d0'
  ) {
    pushOnce(blockers, 'blocked_guarded_handler_registration_plan_invalid')
  }
  if (
    input.routeOwner !== 'backend_service_role_only' ||
    !input.serviceRoleContext.serviceRoleOwned ||
    input.serviceRoleContext.serviceRoleSecretPayloadAccess ||
    input.serviceRoleContext.frontendCredentialExposure ||
    input.serviceRoleContext.broadServiceRoleHandler
  ) {
    pushOnce(blockers, 'blocked_missing_backend_service_role_context')
  }
  if (
    input.handlerRegistrationMode !== 'disabled_handler_registration_scaffold_only' ||
    input.enabled ||
    input.handlerRegistered ||
    input.executableHandlerRegistered ||
    input.handlerEnabled ||
    input.runtimeExecutionApproved
  ) {
    pushOnce(blockers, 'blocked_handler_registration_not_disabled')
  }
  if (input.featureFlagDefault) {
    pushOnce(blockers, 'blocked_feature_flag_enabled')
  }
  if (!refOk(input.approvedSnapshotGuardRef) || input.approvedSnapshotGuardRef.status !== 'approved') {
    pushOnce(blockers, 'blocked_missing_approved_snapshot_guard')
  }
  if (
    !refOk(input.routeIdempotencyGuardRef) ||
    input.routeIdempotencyGuardRef.status !== 'approved' ||
    !input.routeIdempotencyGuardRef.idempotencyRequired
  ) {
    pushOnce(blockers, 'blocked_missing_route_idempotency_guard')
  }
  if (!refOk(input.privateArtifactManifestGuardRef) || input.privateArtifactManifestGuardRef.status !== 'approved') {
    pushOnce(blockers, 'blocked_missing_private_artifact_manifest_guard')
  }
  if (
    !refOk(input.commandAllowlistGuardRef) ||
    input.commandAllowlistGuardRef.status !== 'approved' ||
    input.commandAllowlistGuardRef.rawCommandStringsAllowed
  ) {
    pushOnce(blockers, 'blocked_missing_command_allowlist_guard')
  }
  if (!refOk(input.negativeTestsGuardRef) || input.negativeTestsGuardRef.status !== 'approved') {
    pushOnce(blockers, 'blocked_missing_negative_tests_guard')
  }
  if (
    !refOk(input.storageTransferGateRef) ||
    input.storageTransferGateRef.storageTransferEnabled ||
    !refOk(input.signedPublicArtifactGateRef) ||
    input.signedPublicArtifactGateRef.signedOrPublicArtifactsEnabled
  ) {
    pushOnce(blockers, 'blocked_missing_storage_or_public_artifact_gate')
  }
  if (
    !refOk(input.cleanupAuditRef) ||
    input.cleanupAuditRef.status !== 'planned' ||
    !input.cleanupAuditRef.cleanupAuditRequired
  ) {
    pushOnce(blockers, 'blocked_missing_cleanup_audit_reference')
  }
  if (
    !refOk(input.operatorConfirmationGuardRef) ||
    !input.operatorConfirmationGuardRef.requiredBeforeExecution ||
    input.operatorConfirmationGuardRef.confirmed
  ) {
    pushOnce(blockers, 'blocked_missing_operator_confirmation_guard')
  }
  if (hasRejectedInput(input.rejectedInputs)) {
    pushOnce(blockers, 'blocked_rejected_input_present')
  }
  if (hasRuntimeAttempt(input.safety)) {
    pushOnce(blockers, 'blocked_runtime_execution_attempt')
  }
  if (hasDeliveryAttempt(input.safety)) {
    pushOnce(blockers, 'blocked_storage_or_public_artifact_attempt')
  }

  const ok = blockers.length === 0
  return {
    lane: input.lane,
    scaffoldId: input.scaffoldId,
    ok,
    scaffoldStatus: ok ? 'disabled_handler_registration_scaffold_registered_no_executable_handler' : blockers[0],
    blockers,
    sanitizedScaffold: buildSanitizedScaffold(input),
    sanitizedSummary: ok
      ? 'GPAC/MP4Box disabled handler-registration scaffold is metadata-only with no executable handler, no route execution, no worker dispatch, and no tool execution.'
      : `GPAC/MP4Box disabled handler-registration scaffold blocked by ${blockers.join(', ')}.`,
    nextRequiredGate: 'TRACKA-GPAC-MP4BOX-HANDLER-REGISTRATION-SCAFFOLD-NEGATIVE-TESTS-1',
  }
}

export function summarizeGpacMp4boxDisabledHandlerRegistrationScaffoldBoundary(): string[] {
  return [
    'The handler-registration scaffold is disabled metadata only and does not register an executable HTTP handler.',
    'Backend/service-role ownership, approved snapshot guard, route idempotency, private artifact manifest, command allowlist, negative tests, storage/public artifact gates, cleanup/audit references, and operator confirmation remain required.',
    'Rejected inputs include raw chat, raw command strings, frontend file paths, public URLs, signed URLs as source-of-truth, arbitrary private media, provider/model prompts, service-role secret payloads, and broad service-role handler payloads.',
    'No route execution, worker dispatch, worker execution, GPAC/MP4Box execution, media processing, storage transfer, signed URL creation, public artifact creation, Supabase mutation, SQL execution, external beta expansion, paid production unlock, production unlock, or final delivery/export is enabled.',
    'The next gate must add disabled handler-registration scaffold negative tests before any guarded handler implementation can be considered.',
  ]
}
