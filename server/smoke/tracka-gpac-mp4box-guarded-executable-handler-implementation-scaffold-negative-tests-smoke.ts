import assert from 'node:assert/strict'
import {
  buildGpacMp4boxGuardedExecutableHandlerImplementationScaffoldInput,
  validateGpacMp4boxGuardedExecutableHandlerImplementationScaffoldInput,
} from '../../src/backend/contracts/gpac-mp4box-guarded-executable-handler-implementation-scaffold-contracts'

const createdAt = new Date('2026-06-29T00:00:00.000Z').toISOString()
const baseline = buildGpacMp4boxGuardedExecutableHandlerImplementationScaffoldInput({ createdAt })
const baselineResult = validateGpacMp4boxGuardedExecutableHandlerImplementationScaffoldInput(baseline)

assert.equal(baselineResult.ok, true, baselineResult.sanitizedSummary)
assert.equal(baselineResult.scaffoldStatus, 'guarded_executable_handler_implementation_scaffold_registered_disabled_no_runtime_execution')
assert.equal(baselineResult.nextRequiredGate, 'TRACKA-GPAC-MP4BOX-GUARDED-EXECUTABLE-HANDLER-IMPLEMENTATION-SCAFFOLD-NEGATIVE-TESTS-1')

function expectBlock(
  label: string,
  patch: Partial<typeof baseline>,
  expected: string,
): string {
  const result = validateGpacMp4boxGuardedExecutableHandlerImplementationScaffoldInput({
    ...baseline,
    ...patch,
  } as unknown as typeof baseline)
  assert.equal(result.ok, false, label)
  assert.ok(result.blockers.includes(expected as never), `${label} should include ${expected}: ${result.blockers.join(', ')}`)
  return label
}

const checks = [
  expectBlock('plan_drift_blocks', {
    guardedExecutableHandlerImplementationPlanRef: {
      ...baseline.guardedExecutableHandlerImplementationPlanRef,
      decision: 'wrong' as typeof baseline.guardedExecutableHandlerImplementationPlanRef.decision,
    },
  }, 'blocked_guarded_executable_handler_implementation_plan_invalid'),
  expectBlock('missing_backend_service_role_context_blocks', {
    serviceRoleContext: {
      ...baseline.serviceRoleContext,
      serviceRoleOwned: false,
    } as unknown as typeof baseline.serviceRoleContext,
  }, 'blocked_missing_backend_service_role_context'),
  expectBlock('service_role_secret_payload_access_blocks', {
    serviceRoleContext: {
      ...baseline.serviceRoleContext,
      serviceRoleSecretPayloadAccess: true,
    } as unknown as typeof baseline.serviceRoleContext,
  }, 'blocked_missing_backend_service_role_context'),
  expectBlock('frontend_credential_exposure_blocks', {
    serviceRoleContext: {
      ...baseline.serviceRoleContext,
      frontendCredentialExposure: true,
    } as unknown as typeof baseline.serviceRoleContext,
  }, 'blocked_missing_backend_service_role_context'),
  expectBlock('broad_service_role_handler_blocks', {
    serviceRoleContext: {
      ...baseline.serviceRoleContext,
      broadServiceRoleHandler: true,
    } as unknown as typeof baseline.serviceRoleContext,
  }, 'blocked_missing_backend_service_role_context'),
  expectBlock('route_registration_blocks', {
    routeRegistered: true,
  } as unknown as Partial<typeof baseline>, 'blocked_handler_scaffold_not_disabled'),
  expectBlock('route_executable_blocks', {
    routeExecutable: true,
  } as unknown as Partial<typeof baseline>, 'blocked_handler_scaffold_not_disabled'),
  expectBlock('worker_dispatch_enablement_blocks', {
    workerDispatchEnabled: true,
  } as unknown as Partial<typeof baseline>, 'blocked_handler_scaffold_not_disabled'),
  expectBlock('feature_flag_enablement_blocks', {
    featureFlagDefault: true,
  } as unknown as Partial<typeof baseline>, 'blocked_feature_flag_enabled'),
  expectBlock('runtime_approval_blocks', {
    runtimeExecutionApproved: true,
  } as unknown as Partial<typeof baseline>, 'blocked_handler_scaffold_not_disabled'),
  expectBlock('approved_snapshot_guard_missing_blocks', {
    approvedSnapshotGuardRef: {
      ...baseline.approvedSnapshotGuardRef,
      id: '',
    },
  }, 'blocked_missing_approved_snapshot_guard'),
  expectBlock('route_idempotency_guard_missing_blocks', {
    routeIdempotencyGuardRef: {
      ...baseline.routeIdempotencyGuardRef,
      idempotencyRequired: false,
    } as unknown as typeof baseline.routeIdempotencyGuardRef,
  }, 'blocked_missing_route_idempotency_guard'),
  expectBlock('private_artifact_manifest_guard_missing_blocks', {
    privateArtifactManifestGuardRef: {
      ...baseline.privateArtifactManifestGuardRef,
      id: '',
    },
  }, 'blocked_missing_private_artifact_manifest_guard'),
  expectBlock('command_allowlist_raw_command_blocks', {
    commandAllowlistGuardRef: {
      ...baseline.commandAllowlistGuardRef,
      rawCommandStringsAllowed: true,
    } as unknown as typeof baseline.commandAllowlistGuardRef,
  }, 'blocked_missing_command_allowlist_guard'),
  expectBlock('negative_tests_guard_missing_blocks', {
    negativeTestsGuardRef: {
      ...baseline.negativeTestsGuardRef,
      id: '',
    },
  }, 'blocked_missing_negative_tests_guard'),
  expectBlock('storage_transfer_gate_enablement_blocks', {
    storageTransferGateRef: {
      ...baseline.storageTransferGateRef,
      storageTransferEnabled: true,
    } as unknown as typeof baseline.storageTransferGateRef,
  }, 'blocked_missing_storage_or_public_artifact_gate'),
  expectBlock('signed_public_artifact_gate_enablement_blocks', {
    signedPublicArtifactGateRef: {
      ...baseline.signedPublicArtifactGateRef,
      signedOrPublicArtifactsEnabled: true,
    } as unknown as typeof baseline.signedPublicArtifactGateRef,
  }, 'blocked_missing_storage_or_public_artifact_gate'),
  expectBlock('cleanup_audit_reference_missing_blocks', {
    cleanupAuditRef: {
      ...baseline.cleanupAuditRef,
      cleanupAuditRequired: false,
    } as unknown as typeof baseline.cleanupAuditRef,
  }, 'blocked_missing_cleanup_audit_reference'),
  expectBlock('operator_confirmation_blocks', {
    operatorConfirmationGuardRef: {
      ...baseline.operatorConfirmationGuardRef,
      confirmed: true,
    } as unknown as typeof baseline.operatorConfirmationGuardRef,
  }, 'blocked_missing_operator_confirmation_guard'),
  expectBlock('raw_chat_rejected_input_blocks', {
    rejectedInputs: {
      ...baseline.rejectedInputs,
      rawChat: true,
    } as unknown as typeof baseline.rejectedInputs,
  }, 'blocked_rejected_input_present'),
  expectBlock('raw_command_rejected_input_blocks', {
    rejectedInputs: {
      ...baseline.rejectedInputs,
      rawCommandString: true,
    } as unknown as typeof baseline.rejectedInputs,
  }, 'blocked_rejected_input_present'),
  expectBlock('frontend_file_path_rejected_input_blocks', {
    rejectedInputs: {
      ...baseline.rejectedInputs,
      frontendFilePath: true,
    } as unknown as typeof baseline.rejectedInputs,
  }, 'blocked_rejected_input_present'),
  expectBlock('public_url_rejected_input_blocks', {
    rejectedInputs: {
      ...baseline.rejectedInputs,
      publicUrlSourceOfTruth: true,
    } as unknown as typeof baseline.rejectedInputs,
  }, 'blocked_rejected_input_present'),
  expectBlock('signed_url_rejected_input_blocks', {
    rejectedInputs: {
      ...baseline.rejectedInputs,
      signedUrlSourceOfTruth: true,
    } as unknown as typeof baseline.rejectedInputs,
  }, 'blocked_rejected_input_present'),
  expectBlock('arbitrary_private_media_rejected_input_blocks', {
    rejectedInputs: {
      ...baseline.rejectedInputs,
      arbitraryPrivateMedia: true,
    } as unknown as typeof baseline.rejectedInputs,
  }, 'blocked_rejected_input_present'),
  expectBlock('provider_model_prompt_rejected_input_blocks', {
    rejectedInputs: {
      ...baseline.rejectedInputs,
      providerOrModelPromptPayload: true,
    } as unknown as typeof baseline.rejectedInputs,
  }, 'blocked_rejected_input_present'),
  expectBlock('service_role_secret_payload_rejected_input_blocks', {
    rejectedInputs: {
      ...baseline.rejectedInputs,
      serviceRoleSecretPayload: true,
    } as unknown as typeof baseline.rejectedInputs,
  }, 'blocked_rejected_input_present'),
  expectBlock('broad_service_role_handler_payload_rejected_input_blocks', {
    rejectedInputs: {
      ...baseline.rejectedInputs,
      broadServiceRoleHandlerPayload: true,
    } as unknown as typeof baseline.rejectedInputs,
  }, 'blocked_rejected_input_present'),
  expectBlock('executable_handler_implementation_blocks', {
    safety: {
      ...baseline.safety,
      executableHandlerImplementation: true,
    } as unknown as typeof baseline.safety,
  }, 'blocked_runtime_execution_attempt'),
  expectBlock('route_execution_blocks', {
    safety: {
      ...baseline.safety,
      routeExecution: true,
    } as unknown as typeof baseline.safety,
  }, 'blocked_runtime_execution_attempt'),
  expectBlock('worker_dispatch_blocks', {
    safety: {
      ...baseline.safety,
      workerDispatch: true,
    } as unknown as typeof baseline.safety,
  }, 'blocked_runtime_execution_attempt'),
  expectBlock('worker_execution_blocks', {
    safety: {
      ...baseline.safety,
      workerExecution: true,
    } as unknown as typeof baseline.safety,
  }, 'blocked_runtime_execution_attempt'),
  expectBlock('gpac_mp4box_execution_blocks', {
    safety: {
      ...baseline.safety,
      gpacMp4boxExecution: true,
    } as unknown as typeof baseline.safety,
  }, 'blocked_runtime_execution_attempt'),
  expectBlock('media_processing_blocks', {
    safety: {
      ...baseline.safety,
      mediaProcessing: true,
    } as unknown as typeof baseline.safety,
  }, 'blocked_runtime_execution_attempt'),
  expectBlock('supabase_mutation_blocks', {
    safety: {
      ...baseline.safety,
      supabaseMutation: true,
    } as unknown as typeof baseline.safety,
  }, 'blocked_runtime_execution_attempt'),
  expectBlock('sql_execution_blocks', {
    safety: {
      ...baseline.safety,
      sqlExecution: true,
    } as unknown as typeof baseline.safety,
  }, 'blocked_runtime_execution_attempt'),
  expectBlock('storage_transfer_blocks', {
    safety: {
      ...baseline.safety,
      storageTransfer: true,
    } as unknown as typeof baseline.safety,
  }, 'blocked_storage_or_public_artifact_attempt'),
  expectBlock('signed_url_creation_blocks', {
    safety: {
      ...baseline.safety,
      signedUrlCreation: true,
    } as unknown as typeof baseline.safety,
  }, 'blocked_storage_or_public_artifact_attempt'),
  expectBlock('public_artifact_creation_blocks', {
    safety: {
      ...baseline.safety,
      publicArtifactCreation: true,
    } as unknown as typeof baseline.safety,
  }, 'blocked_storage_or_public_artifact_attempt'),
  expectBlock('external_beta_expansion_blocks', {
    safety: {
      ...baseline.safety,
      externalBetaExpansion: true,
    } as unknown as typeof baseline.safety,
  }, 'blocked_storage_or_public_artifact_attempt'),
  expectBlock('paid_production_unlock_blocks', {
    safety: {
      ...baseline.safety,
      paidProductionUnlock: true,
    } as unknown as typeof baseline.safety,
  }, 'blocked_storage_or_public_artifact_attempt'),
  expectBlock('production_unlock_blocks', {
    safety: {
      ...baseline.safety,
      productionUnlock: true,
    } as unknown as typeof baseline.safety,
  }, 'blocked_storage_or_public_artifact_attempt'),
  expectBlock('final_delivery_export_blocks', {
    safety: {
      ...baseline.safety,
      finalDeliveryExport: true,
    } as unknown as typeof baseline.safety,
  }, 'blocked_storage_or_public_artifact_attempt'),
]

console.log(JSON.stringify({
  ok: true,
  checks,
  totalChecks: checks.length,
  baselineStatus: baselineResult.scaffoldStatus,
  nextRequiredGate: baselineResult.nextRequiredGate,
  noRouteWorkerToolStorageMediaOrUnlockEnabled: true,
}, null, 2))
