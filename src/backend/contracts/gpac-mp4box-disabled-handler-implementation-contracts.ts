import type { ISODateString } from '../../types/shared'

export type GpacMp4boxDisabledHandlerImplementationContractLane =
  'TRACKA-GPAC-MP4BOX-DISABLED-HANDLER-IMPLEMENTATION-CONTRACT-1'

export type GpacMp4boxDisabledHandlerImplementationContractId =
  'handlerImplementation.gpacMp4box.disabled'

export type GpacMp4boxDisabledHandlerImplementationContractStatus =
  | 'disabled_handler_implementation_contract_registered_no_executable_handler'
  | 'blocked_guarded_handler_implementation_review_invalid'
  | 'blocked_missing_backend_service_role_context'
  | 'blocked_handler_implementation_not_disabled'
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

export interface GpacMp4boxDisabledHandlerImplementationContractRef {
  id: string
  status: 'approved' | 'planned' | 'disabled'
}

export interface GpacMp4boxDisabledHandlerImplementationContractRejectedInputs {
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

export interface GpacMp4boxDisabledHandlerImplementationContractSafety {
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

export interface GpacMp4boxDisabledHandlerImplementationContractInput {
  lane: GpacMp4boxDisabledHandlerImplementationContractLane
  contractId: GpacMp4boxDisabledHandlerImplementationContractId
  createdAt: ISODateString
  routeId: 'render.gpacMp4box.disabledHandlerImplementationContract'
  routeOwner: 'backend_service_role_only'
  handlerImplementationMode: 'disabled_handler_implementation_contract_only'
  enabled: false
  guardedHandlerImplementationReviewRef: {
    id: 'TRACKA-GPAC-MP4BOX-GUARDED-HANDLER-IMPLEMENTATION-REVIEW-1'
    decision: 'tracka_gpac_mp4box_guarded_handler_implementation_review_passed_ready_for_disabled_handler_implementation_contract'
    mergeSha: 'c27b17025043c6b7f5b15f2e13ccd671b7011941'
  }
  serviceRoleContext: {
    serviceRoleOwned: true
    serviceRoleSecretPayloadAccess: false
    frontendCredentialExposure: false
    broadServiceRoleHandler: false
  }
  approvedSnapshotGuardRef: GpacMp4boxDisabledHandlerImplementationContractRef & {
    status: 'approved'
  }
  routeIdempotencyGuardRef: GpacMp4boxDisabledHandlerImplementationContractRef & {
    status: 'approved'
    idempotencyRequired: true
  }
  privateArtifactManifestGuardRef: GpacMp4boxDisabledHandlerImplementationContractRef & {
    status: 'approved'
  }
  commandAllowlistGuardRef: GpacMp4boxDisabledHandlerImplementationContractRef & {
    status: 'approved'
    rawCommandStringsAllowed: false
  }
  negativeTestsGuardRef: GpacMp4boxDisabledHandlerImplementationContractRef & {
    status: 'planned'
    requiredBeforeEnablement: true
  }
  storageTransferGateRef: GpacMp4boxDisabledHandlerImplementationContractRef & {
    status: 'planned'
    storageTransferEnabled: false
  }
  signedPublicArtifactGateRef: GpacMp4boxDisabledHandlerImplementationContractRef & {
    status: 'planned'
    signedOrPublicArtifactsEnabled: false
  }
  cleanupAuditRef: GpacMp4boxDisabledHandlerImplementationContractRef & {
    status: 'planned'
    cleanupAuditRequired: true
  }
  operatorConfirmationGuardRef: GpacMp4boxDisabledHandlerImplementationContractRef & {
    status: 'planned'
    requiredBeforeExecution: true
    confirmed: false
  }
  handlerRegistered: false
  executableHandlerRegistered: false
  handlerImplemented: false
  handlerEnabled: false
  featureFlagDefault: false
  runtimeExecutionApproved: false
  rejectedInputs: GpacMp4boxDisabledHandlerImplementationContractRejectedInputs
  safety: GpacMp4boxDisabledHandlerImplementationContractSafety
}

export interface GpacMp4boxDisabledHandlerImplementationContractResult {
  lane: GpacMp4boxDisabledHandlerImplementationContractLane
  contractId: GpacMp4boxDisabledHandlerImplementationContractId
  ok: boolean
  contractStatus: GpacMp4boxDisabledHandlerImplementationContractStatus
  blockers: GpacMp4boxDisabledHandlerImplementationContractStatus[]
  sanitizedContract: {
    contractId: GpacMp4boxDisabledHandlerImplementationContractId
    routeId: 'render.gpacMp4box.disabledHandlerImplementationContract'
    routeOwner: 'backend_service_role_only'
    handlerImplementationMode: 'disabled_handler_implementation_contract_only'
    enabled: false
    handlerRegistered: false
    executableHandlerRegistered: false
    handlerImplemented: false
    handlerEnabled: false
    featureFlagDefault: false
    runtimeExecutionApproved: false
    guardedHandlerImplementationReviewId: string
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
  nextRequiredGate: 'TRACKA-GPAC-MP4BOX-HANDLER-IMPLEMENTATION-CONTRACT-NEGATIVE-TESTS-1'
}

export function buildGpacMp4boxDisabledHandlerImplementationContractInput(input: {
  createdAt: ISODateString
  approvedSnapshotGuardId?: string
}): GpacMp4boxDisabledHandlerImplementationContractInput {
  return {
    lane: 'TRACKA-GPAC-MP4BOX-DISABLED-HANDLER-IMPLEMENTATION-CONTRACT-1',
    contractId: 'handlerImplementation.gpacMp4box.disabled',
    createdAt: input.createdAt,
    routeId: 'render.gpacMp4box.disabledHandlerImplementationContract',
    routeOwner: 'backend_service_role_only',
    handlerImplementationMode: 'disabled_handler_implementation_contract_only',
    enabled: false,
    guardedHandlerImplementationReviewRef: {
      id: 'TRACKA-GPAC-MP4BOX-GUARDED-HANDLER-IMPLEMENTATION-REVIEW-1',
      decision: 'tracka_gpac_mp4box_guarded_handler_implementation_review_passed_ready_for_disabled_handler_implementation_contract',
      mergeSha: 'c27b17025043c6b7f5b15f2e13ccd671b7011941',
    },
    serviceRoleContext: {
      serviceRoleOwned: true,
      serviceRoleSecretPayloadAccess: false,
      frontendCredentialExposure: false,
      broadServiceRoleHandler: false,
    },
    approvedSnapshotGuardRef: {
      id: input.approvedSnapshotGuardId ?? 'approved-snapshot-guard-gpac-mp4box-disabled-handler-implementation-contract',
      status: 'approved',
    },
    routeIdempotencyGuardRef: {
      id: 'route-idempotency-guard-gpac-mp4box-disabled-handler-implementation-contract',
      status: 'approved',
      idempotencyRequired: true,
    },
    privateArtifactManifestGuardRef: {
      id: 'private-artifact-manifest-guard-gpac-mp4box-disabled-handler-implementation-contract',
      status: 'approved',
    },
    commandAllowlistGuardRef: {
      id: 'command-allowlist-guard-gpac-mp4box-disabled-handler-implementation-contract',
      status: 'approved',
      rawCommandStringsAllowed: false,
    },
    negativeTestsGuardRef: {
      id: 'negative-tests-guard-gpac-mp4box-disabled-handler-implementation-contract',
      status: 'planned',
      requiredBeforeEnablement: true,
    },
    storageTransferGateRef: {
      id: 'storage-transfer-gate-gpac-mp4box-disabled-handler-implementation-contract',
      status: 'planned',
      storageTransferEnabled: false,
    },
    signedPublicArtifactGateRef: {
      id: 'signed-public-artifact-gate-gpac-mp4box-disabled-handler-implementation-contract',
      status: 'planned',
      signedOrPublicArtifactsEnabled: false,
    },
    cleanupAuditRef: {
      id: 'cleanup-audit-ref-gpac-mp4box-disabled-handler-implementation-contract',
      status: 'planned',
      cleanupAuditRequired: true,
    },
    operatorConfirmationGuardRef: {
      id: 'operator-confirmation-guard-gpac-mp4box-disabled-handler-implementation-contract',
      status: 'planned',
      requiredBeforeExecution: true,
      confirmed: false,
    },
    handlerRegistered: false,
    executableHandlerRegistered: false,
    handlerImplemented: false,
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

function refOk(ref: GpacMp4boxDisabledHandlerImplementationContractRef): boolean {
  return hasText(ref.id)
}

function hasRejectedInput(input: GpacMp4boxDisabledHandlerImplementationContractRejectedInputs): boolean {
  return Object.values(input).some((value) => value !== false)
}

function hasRuntimeAttempt(input: GpacMp4boxDisabledHandlerImplementationContractSafety): boolean {
  return input.executableHandlerRegistration ||
    input.routeExecution ||
    input.workerDispatch ||
    input.workerExecution ||
    input.gpacMp4boxExecution ||
    input.mediaProcessing ||
    input.supabaseMutation ||
    input.sqlExecution
}

function hasDeliveryAttempt(input: GpacMp4boxDisabledHandlerImplementationContractSafety): boolean {
  return input.storageTransfer ||
    input.signedUrlCreation ||
    input.publicArtifactCreation ||
    input.externalBetaExpansion ||
    input.paidProductionUnlock ||
    input.productionUnlock ||
    input.finalDeliveryExport
}

function buildSanitizedContract(
  input: GpacMp4boxDisabledHandlerImplementationContractInput,
): GpacMp4boxDisabledHandlerImplementationContractResult['sanitizedContract'] {
  return {
    contractId: input.contractId,
    routeId: input.routeId,
    routeOwner: 'backend_service_role_only',
    handlerImplementationMode: 'disabled_handler_implementation_contract_only',
    enabled: false,
    handlerRegistered: false,
    executableHandlerRegistered: false,
    handlerImplemented: false,
    handlerEnabled: false,
    featureFlagDefault: false,
    runtimeExecutionApproved: false,
    guardedHandlerImplementationReviewId: input.guardedHandlerImplementationReviewRef.id,
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

export function validateGpacMp4boxDisabledHandlerImplementationContractInput(
  input: GpacMp4boxDisabledHandlerImplementationContractInput,
): GpacMp4boxDisabledHandlerImplementationContractResult {
  const blockers: GpacMp4boxDisabledHandlerImplementationContractStatus[] = []

  if (
    input.guardedHandlerImplementationReviewRef.id !== 'TRACKA-GPAC-MP4BOX-GUARDED-HANDLER-IMPLEMENTATION-REVIEW-1' ||
    input.guardedHandlerImplementationReviewRef.decision !== 'tracka_gpac_mp4box_guarded_handler_implementation_review_passed_ready_for_disabled_handler_implementation_contract' ||
    input.guardedHandlerImplementationReviewRef.mergeSha !== 'c27b17025043c6b7f5b15f2e13ccd671b7011941'
  ) {
    pushOnce(blockers, 'blocked_guarded_handler_implementation_review_invalid')
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
    input.handlerImplementationMode !== 'disabled_handler_implementation_contract_only' ||
    input.enabled ||
    input.handlerRegistered ||
    input.executableHandlerRegistered ||
    input.handlerImplemented ||
    input.handlerEnabled ||
    input.runtimeExecutionApproved
  ) {
    pushOnce(blockers, 'blocked_handler_implementation_not_disabled')
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
  if (
    !refOk(input.negativeTestsGuardRef) ||
    input.negativeTestsGuardRef.status !== 'planned' ||
    !input.negativeTestsGuardRef.requiredBeforeEnablement
  ) {
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
    contractId: input.contractId,
    ok,
    contractStatus: ok ? 'disabled_handler_implementation_contract_registered_no_executable_handler' : blockers[0],
    blockers,
    sanitizedContract: buildSanitizedContract(input),
    sanitizedSummary: ok
      ? 'GPAC/MP4Box disabled handler implementation contract is metadata-only with no executable handler, no route execution, no worker dispatch, and no tool execution.'
      : `GPAC/MP4Box disabled handler implementation contract blocked by ${blockers.join(', ')}.`,
    nextRequiredGate: 'TRACKA-GPAC-MP4BOX-HANDLER-IMPLEMENTATION-CONTRACT-NEGATIVE-TESTS-1',
  }
}

export function summarizeGpacMp4boxDisabledHandlerImplementationContractBoundary(): string[] {
  return [
    'The handler implementation contract is disabled metadata only and does not register an executable HTTP handler.',
    'Backend/service-role ownership, approved snapshot guard, route idempotency, private artifact manifest, command allowlist, negative tests, storage/public artifact gates, cleanup/audit references, and operator confirmation remain required.',
    'Rejected inputs include raw chat, raw command strings, frontend file paths, public URLs, signed URLs as source-of-truth, arbitrary private media, provider/model prompts, service-role secret payloads, and broad service-role handler payloads.',
    'No route execution, worker dispatch, worker execution, GPAC/MP4Box execution, media processing, storage transfer, signed URL creation, public artifact creation, Supabase mutation, SQL execution, external beta expansion, paid production unlock, production unlock, or final delivery/export is enabled.',
    'The next gate must add disabled handler implementation contract negative tests before any guarded executable implementation can be considered.',
  ]
}
