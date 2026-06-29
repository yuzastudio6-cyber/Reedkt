import type { ISODateString } from '../../types/shared'

export type GpacMp4boxDisabledLiveRegistrationContractLane =
  'TRACKA-GPAC-MP4BOX-DISABLED-LIVE-REGISTRATION-CONTRACT-1'

export type GpacMp4boxDisabledLiveRegistrationContractId =
  'liveRegistration.gpacMp4box.disabled'

export type GpacMp4boxDisabledLiveRegistrationContractStatus =
  | 'disabled_live_registration_contract_registered_no_handler'
  | 'blocked_guarded_review_invalid'
  | 'blocked_missing_backend_service_role_context'
  | 'blocked_live_handler_registered'
  | 'blocked_feature_flag_enabled'
  | 'blocked_missing_approved_snapshot_guard'
  | 'blocked_missing_route_idempotency_guard'
  | 'blocked_missing_private_artifact_manifest_guard'
  | 'blocked_missing_command_allowlist_guard'
  | 'blocked_missing_negative_tests_guard'
  | 'blocked_missing_storage_or_public_artifact_gate'
  | 'blocked_missing_operator_confirmation_guard'
  | 'blocked_rejected_input_present'
  | 'blocked_runtime_execution_attempt'
  | 'blocked_storage_or_public_artifact_attempt'

export interface GpacMp4boxDisabledLiveRegistrationRef {
  id: string
  status: 'approved' | 'planned' | 'disabled'
}

export interface GpacMp4boxDisabledLiveRegistrationRejectedInputs {
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

export interface GpacMp4boxDisabledLiveRegistrationSafety {
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

export interface GpacMp4boxDisabledLiveRegistrationContractInput {
  lane: GpacMp4boxDisabledLiveRegistrationContractLane
  contractId: GpacMp4boxDisabledLiveRegistrationContractId
  createdAt: ISODateString
  routeId: 'render.gpacMp4box.disabledLiveRegistrationContract'
  routeOwner: 'backend_service_role_only'
  routeRegistrationMode: 'disabled_metadata_contract_only'
  serviceRoleContext: {
    serviceRoleOwned: true
    serviceRoleSecretPayloadAccess: false
    frontendCredentialExposure: false
    broadServiceRoleHandler: false
  }
  guardedReviewRef: {
    id: 'TRACKA-GPAC-MP4BOX-GUARDED-LIVE-REGISTRATION-REVIEW-1'
    decision: 'tracka_gpac_mp4box_guarded_live_registration_review_passed_ready_for_disabled_live_registration_contract'
    mergeSha: 'd0aaa82eac128b71fc37be63a5c2194b2990f432'
  }
  approvedSnapshotGuardRef: GpacMp4boxDisabledLiveRegistrationRef & {
    status: 'approved'
  }
  routeIdempotencyGuardRef: GpacMp4boxDisabledLiveRegistrationRef & {
    status: 'approved'
    idempotencyRequired: true
  }
  privateArtifactManifestGuardRef: GpacMp4boxDisabledLiveRegistrationRef & {
    status: 'approved'
  }
  commandAllowlistGuardRef: GpacMp4boxDisabledLiveRegistrationRef & {
    status: 'approved'
    rawCommandStringsAllowed: false
  }
  negativeTestsGuardRef: GpacMp4boxDisabledLiveRegistrationRef & {
    status: 'approved'
  }
  storageTransferGateRef: GpacMp4boxDisabledLiveRegistrationRef & {
    status: 'planned'
    storageTransferEnabled: false
  }
  signedPublicArtifactGateRef: GpacMp4boxDisabledLiveRegistrationRef & {
    status: 'planned'
    signedOrPublicArtifactsEnabled: false
  }
  operatorConfirmationGuardRef: GpacMp4boxDisabledLiveRegistrationRef & {
    status: 'planned'
    requiredBeforeExecution: true
    confirmed: false
  }
  liveHandlerRegistered: false
  liveHandlerEnabled: false
  featureFlagDefault: false
  runtimeExecutionApproved: false
  rejectedInputs: GpacMp4boxDisabledLiveRegistrationRejectedInputs
  safety: GpacMp4boxDisabledLiveRegistrationSafety
}

export interface GpacMp4boxDisabledLiveRegistrationContractResult {
  lane: GpacMp4boxDisabledLiveRegistrationContractLane
  contractId: GpacMp4boxDisabledLiveRegistrationContractId
  ok: boolean
  registrationStatus: GpacMp4boxDisabledLiveRegistrationContractStatus
  blockers: GpacMp4boxDisabledLiveRegistrationContractStatus[]
  sanitizedRegistration: {
    contractId: GpacMp4boxDisabledLiveRegistrationContractId
    routeId: 'render.gpacMp4box.disabledLiveRegistrationContract'
    routeOwner: 'backend_service_role_only'
    routeRegistrationMode: 'disabled_metadata_contract_only'
    liveHandlerRegistered: false
    liveHandlerEnabled: false
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
    operatorConfirmationGuardId: string
    operatorConfirmed: false
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
  nextRequiredGate: 'TRACKA-GPAC-MP4BOX-LIVE-REGISTRATION-CONTRACT-NEGATIVE-TESTS-1'
}

export function buildGpacMp4boxDisabledLiveRegistrationContractInput(input: {
  createdAt: ISODateString
  approvedSnapshotGuardId?: string
}): GpacMp4boxDisabledLiveRegistrationContractInput {
  return {
    lane: 'TRACKA-GPAC-MP4BOX-DISABLED-LIVE-REGISTRATION-CONTRACT-1',
    contractId: 'liveRegistration.gpacMp4box.disabled',
    createdAt: input.createdAt,
    routeId: 'render.gpacMp4box.disabledLiveRegistrationContract',
    routeOwner: 'backend_service_role_only',
    routeRegistrationMode: 'disabled_metadata_contract_only',
    serviceRoleContext: {
      serviceRoleOwned: true,
      serviceRoleSecretPayloadAccess: false,
      frontendCredentialExposure: false,
      broadServiceRoleHandler: false,
    },
    guardedReviewRef: {
      id: 'TRACKA-GPAC-MP4BOX-GUARDED-LIVE-REGISTRATION-REVIEW-1',
      decision: 'tracka_gpac_mp4box_guarded_live_registration_review_passed_ready_for_disabled_live_registration_contract',
      mergeSha: 'd0aaa82eac128b71fc37be63a5c2194b2990f432',
    },
    approvedSnapshotGuardRef: {
      id: input.approvedSnapshotGuardId ?? 'approved-snapshot-guard-gpac-mp4box-disabled-live-registration',
      status: 'approved',
    },
    routeIdempotencyGuardRef: {
      id: 'route-idempotency-guard-gpac-mp4box-disabled-live-registration',
      status: 'approved',
      idempotencyRequired: true,
    },
    privateArtifactManifestGuardRef: {
      id: 'private-artifact-manifest-guard-gpac-mp4box-disabled-live-registration',
      status: 'approved',
    },
    commandAllowlistGuardRef: {
      id: 'command-allowlist-guard-gpac-mp4box-disabled-live-registration',
      status: 'approved',
      rawCommandStringsAllowed: false,
    },
    negativeTestsGuardRef: {
      id: 'runtime-scaffold-negative-tests-guard-gpac-mp4box-disabled-live-registration',
      status: 'approved',
    },
    storageTransferGateRef: {
      id: 'storage-transfer-gate-gpac-mp4box-disabled-live-registration',
      status: 'planned',
      storageTransferEnabled: false,
    },
    signedPublicArtifactGateRef: {
      id: 'signed-public-artifact-gate-gpac-mp4box-disabled-live-registration',
      status: 'planned',
      signedOrPublicArtifactsEnabled: false,
    },
    operatorConfirmationGuardRef: {
      id: 'operator-confirmation-guard-gpac-mp4box-disabled-live-registration',
      status: 'planned',
      requiredBeforeExecution: true,
      confirmed: false,
    },
    liveHandlerRegistered: false,
    liveHandlerEnabled: false,
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

function refOk(ref: GpacMp4boxDisabledLiveRegistrationRef): boolean {
  return hasText(ref.id)
}

function hasRejectedInput(input: GpacMp4boxDisabledLiveRegistrationRejectedInputs): boolean {
  return Object.values(input).some((value) => value !== false)
}

function hasRuntimeAttempt(input: GpacMp4boxDisabledLiveRegistrationSafety): boolean {
  return input.routeExecution ||
    input.workerDispatch ||
    input.workerExecution ||
    input.gpacMp4boxExecution ||
    input.mediaProcessing ||
    input.supabaseMutation ||
    input.sqlExecution
}

function hasDeliveryAttempt(input: GpacMp4boxDisabledLiveRegistrationSafety): boolean {
  return input.storageTransfer ||
    input.signedUrlCreation ||
    input.publicArtifactCreation ||
    input.externalBetaExpansion ||
    input.paidProductionUnlock ||
    input.productionUnlock ||
    input.finalDeliveryExport
}

function buildSanitizedRegistration(
  input: GpacMp4boxDisabledLiveRegistrationContractInput,
): GpacMp4boxDisabledLiveRegistrationContractResult['sanitizedRegistration'] {
  return {
    contractId: input.contractId,
    routeId: input.routeId,
    routeOwner: 'backend_service_role_only',
    routeRegistrationMode: 'disabled_metadata_contract_only',
    liveHandlerRegistered: false,
    liveHandlerEnabled: false,
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
    operatorConfirmationGuardId: input.operatorConfirmationGuardRef.id,
    operatorConfirmed: false,
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

export function validateGpacMp4boxDisabledLiveRegistrationContractInput(
  input: GpacMp4boxDisabledLiveRegistrationContractInput,
): GpacMp4boxDisabledLiveRegistrationContractResult {
  const blockers: GpacMp4boxDisabledLiveRegistrationContractStatus[] = []

  if (
    input.guardedReviewRef.id !== 'TRACKA-GPAC-MP4BOX-GUARDED-LIVE-REGISTRATION-REVIEW-1' ||
    input.guardedReviewRef.decision !== 'tracka_gpac_mp4box_guarded_live_registration_review_passed_ready_for_disabled_live_registration_contract' ||
    input.guardedReviewRef.mergeSha !== 'd0aaa82eac128b71fc37be63a5c2194b2990f432'
  ) {
    pushOnce(blockers, 'blocked_guarded_review_invalid')
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
    input.routeRegistrationMode !== 'disabled_metadata_contract_only' ||
    input.liveHandlerRegistered ||
    input.liveHandlerEnabled ||
    input.runtimeExecutionApproved
  ) {
    pushOnce(blockers, 'blocked_live_handler_registered')
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
    registrationStatus: ok ? 'disabled_live_registration_contract_registered_no_handler' : blockers[0],
    blockers,
    sanitizedRegistration: buildSanitizedRegistration(input),
    sanitizedSummary: ok
      ? 'GPAC/MP4Box disabled live-registration contract is metadata-only with no live handler, no route execution, no worker dispatch, and no tool execution.'
      : `GPAC/MP4Box disabled live-registration contract blocked by ${blockers.join(', ')}.`,
    nextRequiredGate: 'TRACKA-GPAC-MP4BOX-LIVE-REGISTRATION-CONTRACT-NEGATIVE-TESTS-1',
  }
}

export function summarizeGpacMp4boxDisabledLiveRegistrationBoundary(): string[] {
  return [
    'The live-registration contract is disabled metadata only and does not register an executable HTTP handler.',
    'Backend/service-role ownership, approved snapshot guard, route idempotency, private artifact manifest, command allowlist, negative tests, storage/public artifact gates, and operator confirmation remain required.',
    'Rejected inputs include raw chat, raw command strings, frontend file paths, public URLs, signed URLs as source-of-truth, arbitrary private media, provider/model prompts, service-role secret payloads, and broad service-role handler payloads.',
    'No route execution, worker dispatch, worker execution, GPAC/MP4Box execution, media processing, storage transfer, signed URL creation, public artifact creation, Supabase mutation, SQL execution, external beta expansion, paid production unlock, production unlock, or final delivery/export is enabled.',
    'The next gate must add live-registration contract negative tests before any handler registration review can be considered.',
  ]
}
