import type { ISODateString } from '../../types/shared'

export type GpacMp4boxDisabledHandlerRegistrationContractLane =
  'TRACKA-GPAC-MP4BOX-DISABLED-HANDLER-REGISTRATION-CONTRACT-1'

export type GpacMp4boxDisabledHandlerRegistrationContractId =
  'handlerRegistration.gpacMp4box.disabled'

export type GpacMp4boxDisabledHandlerRegistrationContractStatus =
  | 'disabled_handler_registration_contract_registered_no_executable_handler'
  | 'blocked_disabled_handler_review_invalid'
  | 'blocked_missing_backend_service_role_context'
  | 'blocked_executable_handler_registered'
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

export interface GpacMp4boxDisabledHandlerRegistrationRef {
  id: string
  status: 'approved' | 'planned' | 'disabled'
}

export interface GpacMp4boxDisabledHandlerRegistrationRejectedInputs {
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

export interface GpacMp4boxDisabledHandlerRegistrationSafety {
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

export interface GpacMp4boxDisabledHandlerRegistrationContractInput {
  lane: GpacMp4boxDisabledHandlerRegistrationContractLane
  contractId: GpacMp4boxDisabledHandlerRegistrationContractId
  createdAt: ISODateString
  routeId: 'render.gpacMp4box.disabledHandlerRegistrationContract'
  routeOwner: 'backend_service_role_only'
  handlerRegistrationMode: 'disabled_handler_registration_metadata_contract_only'
  serviceRoleContext: {
    serviceRoleOwned: true
    serviceRoleSecretPayloadAccess: false
    frontendCredentialExposure: false
    broadServiceRoleHandler: false
  }
  disabledHandlerReviewRef: {
    id: 'TRACKA-GPAC-MP4BOX-DISABLED-HANDLER-REGISTRATION-REVIEW-1'
    decision: 'tracka_gpac_mp4box_disabled_handler_registration_review_passed_ready_for_disabled_handler_registration_contract'
    mergeSha: '4111cf960d8834fb15596b94d9beb5d99e1ace91'
  }
  approvedSnapshotGuardRef: GpacMp4boxDisabledHandlerRegistrationRef & {
    status: 'approved'
  }
  routeIdempotencyGuardRef: GpacMp4boxDisabledHandlerRegistrationRef & {
    status: 'approved'
    idempotencyRequired: true
  }
  privateArtifactManifestGuardRef: GpacMp4boxDisabledHandlerRegistrationRef & {
    status: 'approved'
  }
  commandAllowlistGuardRef: GpacMp4boxDisabledHandlerRegistrationRef & {
    status: 'approved'
    rawCommandStringsAllowed: false
  }
  negativeTestsGuardRef: GpacMp4boxDisabledHandlerRegistrationRef & {
    status: 'approved'
  }
  storageTransferGateRef: GpacMp4boxDisabledHandlerRegistrationRef & {
    status: 'planned'
    storageTransferEnabled: false
  }
  signedPublicArtifactGateRef: GpacMp4boxDisabledHandlerRegistrationRef & {
    status: 'planned'
    signedOrPublicArtifactsEnabled: false
  }
  cleanupAuditRef: GpacMp4boxDisabledHandlerRegistrationRef & {
    status: 'planned'
    cleanupAuditRequired: true
  }
  operatorConfirmationGuardRef: GpacMp4boxDisabledHandlerRegistrationRef & {
    status: 'planned'
    requiredBeforeExecution: true
    confirmed: false
  }
  handlerRegistered: false
  handlerEnabled: false
  featureFlagDefault: false
  runtimeExecutionApproved: false
  rejectedInputs: GpacMp4boxDisabledHandlerRegistrationRejectedInputs
  safety: GpacMp4boxDisabledHandlerRegistrationSafety
}

export interface GpacMp4boxDisabledHandlerRegistrationContractResult {
  lane: GpacMp4boxDisabledHandlerRegistrationContractLane
  contractId: GpacMp4boxDisabledHandlerRegistrationContractId
  ok: boolean
  registrationStatus: GpacMp4boxDisabledHandlerRegistrationContractStatus
  blockers: GpacMp4boxDisabledHandlerRegistrationContractStatus[]
  sanitizedRegistration: {
    contractId: GpacMp4boxDisabledHandlerRegistrationContractId
    routeId: 'render.gpacMp4box.disabledHandlerRegistrationContract'
    routeOwner: 'backend_service_role_only'
    handlerRegistrationMode: 'disabled_handler_registration_metadata_contract_only'
    handlerRegistered: false
    handlerEnabled: false
    featureFlagDefault: false
    runtimeExecutionApproved: false
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
  nextRequiredGate: 'TRACKA-GPAC-MP4BOX-DISABLED-HANDLER-REGISTRATION-CONTRACT-NEGATIVE-TESTS-1'
}

export function buildGpacMp4boxDisabledHandlerRegistrationContractInput(input: {
  createdAt: ISODateString
  approvedSnapshotGuardId?: string
}): GpacMp4boxDisabledHandlerRegistrationContractInput {
  return {
    lane: 'TRACKA-GPAC-MP4BOX-DISABLED-HANDLER-REGISTRATION-CONTRACT-1',
    contractId: 'handlerRegistration.gpacMp4box.disabled',
    createdAt: input.createdAt,
    routeId: 'render.gpacMp4box.disabledHandlerRegistrationContract',
    routeOwner: 'backend_service_role_only',
    handlerRegistrationMode: 'disabled_handler_registration_metadata_contract_only',
    serviceRoleContext: {
      serviceRoleOwned: true,
      serviceRoleSecretPayloadAccess: false,
      frontendCredentialExposure: false,
      broadServiceRoleHandler: false,
    },
    disabledHandlerReviewRef: {
      id: 'TRACKA-GPAC-MP4BOX-DISABLED-HANDLER-REGISTRATION-REVIEW-1',
      decision: 'tracka_gpac_mp4box_disabled_handler_registration_review_passed_ready_for_disabled_handler_registration_contract',
      mergeSha: '4111cf960d8834fb15596b94d9beb5d99e1ace91',
    },
    approvedSnapshotGuardRef: {
      id: input.approvedSnapshotGuardId ?? 'approved-snapshot-guard-gpac-mp4box-disabled-handler-registration',
      status: 'approved',
    },
    routeIdempotencyGuardRef: {
      id: 'route-idempotency-guard-gpac-mp4box-disabled-handler-registration',
      status: 'approved',
      idempotencyRequired: true,
    },
    privateArtifactManifestGuardRef: {
      id: 'private-artifact-manifest-guard-gpac-mp4box-disabled-handler-registration',
      status: 'approved',
    },
    commandAllowlistGuardRef: {
      id: 'command-allowlist-guard-gpac-mp4box-disabled-handler-registration',
      status: 'approved',
      rawCommandStringsAllowed: false,
    },
    negativeTestsGuardRef: {
      id: 'live-registration-negative-tests-guard-gpac-mp4box-disabled-handler-registration',
      status: 'approved',
    },
    storageTransferGateRef: {
      id: 'storage-transfer-gate-gpac-mp4box-disabled-handler-registration',
      status: 'planned',
      storageTransferEnabled: false,
    },
    signedPublicArtifactGateRef: {
      id: 'signed-public-artifact-gate-gpac-mp4box-disabled-handler-registration',
      status: 'planned',
      signedOrPublicArtifactsEnabled: false,
    },
    cleanupAuditRef: {
      id: 'cleanup-audit-ref-gpac-mp4box-disabled-handler-registration',
      status: 'planned',
      cleanupAuditRequired: true,
    },
    operatorConfirmationGuardRef: {
      id: 'operator-confirmation-guard-gpac-mp4box-disabled-handler-registration',
      status: 'planned',
      requiredBeforeExecution: true,
      confirmed: false,
    },
    handlerRegistered: false,
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

function refOk(ref: GpacMp4boxDisabledHandlerRegistrationRef): boolean {
  return hasText(ref.id)
}

function hasRejectedInput(input: GpacMp4boxDisabledHandlerRegistrationRejectedInputs): boolean {
  return Object.values(input).some((value) => value !== false)
}

function hasRuntimeAttempt(input: GpacMp4boxDisabledHandlerRegistrationSafety): boolean {
  return input.executableHandlerRegistration ||
    input.routeExecution ||
    input.workerDispatch ||
    input.workerExecution ||
    input.gpacMp4boxExecution ||
    input.mediaProcessing ||
    input.supabaseMutation ||
    input.sqlExecution
}

function hasDeliveryAttempt(input: GpacMp4boxDisabledHandlerRegistrationSafety): boolean {
  return input.storageTransfer ||
    input.signedUrlCreation ||
    input.publicArtifactCreation ||
    input.externalBetaExpansion ||
    input.paidProductionUnlock ||
    input.productionUnlock ||
    input.finalDeliveryExport
}

function buildSanitizedRegistration(
  input: GpacMp4boxDisabledHandlerRegistrationContractInput,
): GpacMp4boxDisabledHandlerRegistrationContractResult['sanitizedRegistration'] {
  return {
    contractId: input.contractId,
    routeId: input.routeId,
    routeOwner: 'backend_service_role_only',
    handlerRegistrationMode: 'disabled_handler_registration_metadata_contract_only',
    handlerRegistered: false,
    handlerEnabled: false,
    featureFlagDefault: false,
    runtimeExecutionApproved: false,
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

export function validateGpacMp4boxDisabledHandlerRegistrationContractInput(
  input: GpacMp4boxDisabledHandlerRegistrationContractInput,
): GpacMp4boxDisabledHandlerRegistrationContractResult {
  const blockers: GpacMp4boxDisabledHandlerRegistrationContractStatus[] = []

  if (
    input.disabledHandlerReviewRef.id !== 'TRACKA-GPAC-MP4BOX-DISABLED-HANDLER-REGISTRATION-REVIEW-1' ||
    input.disabledHandlerReviewRef.decision !== 'tracka_gpac_mp4box_disabled_handler_registration_review_passed_ready_for_disabled_handler_registration_contract' ||
    input.disabledHandlerReviewRef.mergeSha !== '4111cf960d8834fb15596b94d9beb5d99e1ace91'
  ) {
    pushOnce(blockers, 'blocked_disabled_handler_review_invalid')
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
    input.handlerRegistrationMode !== 'disabled_handler_registration_metadata_contract_only' ||
    input.handlerRegistered ||
    input.handlerEnabled ||
    input.runtimeExecutionApproved
  ) {
    pushOnce(blockers, 'blocked_executable_handler_registered')
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
    contractId: input.contractId,
    ok,
    registrationStatus: ok ? 'disabled_handler_registration_contract_registered_no_executable_handler' : blockers[0],
    blockers,
    sanitizedRegistration: buildSanitizedRegistration(input),
    sanitizedSummary: ok
      ? 'GPAC/MP4Box disabled handler-registration contract is metadata-only with no executable handler, no route execution, no worker dispatch, and no tool execution.'
      : `GPAC/MP4Box disabled handler-registration contract blocked by ${blockers.join(', ')}.`,
    nextRequiredGate: 'TRACKA-GPAC-MP4BOX-DISABLED-HANDLER-REGISTRATION-CONTRACT-NEGATIVE-TESTS-1',
  }
}

export function summarizeGpacMp4boxDisabledHandlerRegistrationBoundary(): string[] {
  return [
    'The handler-registration contract is disabled metadata only and does not register an executable HTTP handler.',
    'Backend/service-role ownership, approved snapshot guard, route idempotency, private artifact manifest, command allowlist, negative tests, storage/public artifact gates, cleanup/audit references, and operator confirmation remain required.',
    'Rejected inputs include raw chat, raw command strings, frontend file paths, public URLs, signed URLs as source-of-truth, arbitrary private media, provider/model prompts, service-role secret payloads, and broad service-role handler payloads.',
    'No route execution, worker dispatch, worker execution, GPAC/MP4Box execution, media processing, storage transfer, signed URL creation, public artifact creation, Supabase mutation, SQL execution, external beta expansion, paid production unlock, production unlock, or final delivery/export is enabled.',
    'The next gate must add disabled handler-registration contract negative tests before any guarded handler registration plan can be considered.',
  ]
}
