export const QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_PACKET =
  'QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_INTEGRATION_1' as const

export const QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_SOURCE_DECISION =
  'completed_qwen2_5_vl_l4_vllm_kv_cache_tuning_structured_output_smoke_passed' as const

export const QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_ENV = {
  enabled: 'REEDITPRO_QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE',
  targetRef: 'REEDITPRO_EXTERNAL_BETA_TARGET_REF',
  scope: 'REEDITPRO_QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_SCOPE',
} as const

export const QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_REQUIRED_VALUES = {
  enabled: 'true',
  targetRef: 'wmyyttnynmteqgcdishd',
  scope: 'approved_snapshot_structured_metadata_only',
  maxModelLen: 2048,
  maxNumBatchedTokens: 1024,
  maxNumSeqs: 1,
  gpuMemoryUtilization: 0.92,
} as const

export type Qwen25VlExternalBetaRuntimeGateStatus =
  | 'disabled_pending_explicit_qwen_runtime_gate'
  | 'ready_backend_only_qwen_structured_metadata_runtime_gate'
  | 'blocked_source_decision_mismatch'
  | 'blocked_target_ref_mismatch'
  | 'blocked_scope_mismatch'
  | 'blocked_missing_approved_snapshot_reference'
  | 'blocked_missing_credit_reservation_reference'
  | 'blocked_missing_queue_lease_reference'
  | 'blocked_missing_idempotency_key'
  | 'blocked_missing_private_artifact_manifest_reference'
  | 'blocked_missing_private_artifact_checksum_reference'
  | 'blocked_frontend_provider_or_model_call_attempt'
  | 'blocked_public_or_signed_artifact_request'
  | 'blocked_raw_prompt_or_arbitrary_media_request'
  | 'blocked_final_render_export_request'

export interface Qwen25VlExternalBetaRuntimeGateInput {
  env?: Record<string, string | undefined>
  sourceDecision?: string
  approvedSnapshotRef?: string | null
  creditReservationRef?: string | null
  queueLeaseRef?: string | null
  idempotencyKey?: string | null
  privateArtifactManifestRef?: string | null
  privateArtifactChecksumRef?: string | null
  frontendProviderCallAttempted?: boolean
  frontendModelCallAttempted?: boolean
  publicArtifactRequested?: boolean
  signedUrlRequested?: boolean
  rawPromptRequested?: boolean
  arbitraryUserMediaRequested?: boolean
  finalRenderExportRequested?: boolean
}

export interface Qwen25VlExternalBetaRuntimeGateResult {
  packet: typeof QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_PACKET
  sourceDecision: typeof QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_SOURCE_DECISION
  ok: boolean
  status: Qwen25VlExternalBetaRuntimeGateStatus
  target: {
    projectName: 'Reeditpro'
    projectRef: 'wmyyttnynmteqgcdishd'
    environment: 'staging'
  }
  requiredL4VllmConfig: {
    QWEN_VLLM_MAX_MODEL_LEN: 2048
    QWEN_VLLM_MAX_NUM_BATCHED_TOKENS: 1024
    QWEN_VLLM_MAX_NUM_SEQS: 1
    QWEN_VLLM_GPU_MEMORY_UTILIZATION: 0.92
  }
  runtimeGate: {
    approvedSnapshotRequired: true
    creditReservationRequired: true
    queueLeaseRequired: true
    idempotencyKeyRequired: true
    privateArtifactManifestRequired: true
    privateArtifactChecksumRequired: true
    backendOnlyAdapterRequired: true
    structuredMetadataOnly: true
    frontendProviderCallsAllowed: false
    frontendModelCallsAllowed: false
    rawPromptExecutionAllowed: false
    arbitraryUserMediaAllowed: false
    publicArtifactsAllowed: false
    signedUrlsAllowed: false
    broadExternalBetaAllowed: false
    paidProductionAllowed: false
    productionAllowed: false
    finalRenderExportAllowed: false
  }
  safety: {
    sourceOnlyContract: true
    qwenRuntimeExecuted: false
    cloudRunServiceUpdated: false
    cloudRunJobExecuted: false
    providerCall: false
    modelCall: false
    workerExecution: false
    workerDispatch: false
    routeExecution: false
    supabaseMutation: false
    sqlExecution: false
    secretPayloadAccess: false
    signedUrlCreation: false
    publicArtifactCreation: false
    mediaProcessing: false
    finalRenderExport: false
    externalBetaUnlockAppliedToEnvironment: false
    productionUnlock: false
  }
  blockers: string[]
  nextMilestone: 'QWEN2_5_VL_EXTERNAL_BETA_BACKEND_RUNTIME_ADAPTER_1'
}

function hasValue(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

export function evaluateQwen25VlExternalBetaRuntimeGate(
  input: Qwen25VlExternalBetaRuntimeGateInput = {},
): Qwen25VlExternalBetaRuntimeGateResult {
  const env = input.env ?? {}
  const blockers: string[] = []
  let status: Qwen25VlExternalBetaRuntimeGateStatus = 'disabled_pending_explicit_qwen_runtime_gate'

  const enabled = env[QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_ENV.enabled] ===
    QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_REQUIRED_VALUES.enabled
  const targetMatches = env[QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_ENV.targetRef] ===
    QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_REQUIRED_VALUES.targetRef
  const scopeMatches = env[QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_ENV.scope] ===
    QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_REQUIRED_VALUES.scope

  if (!enabled) blockers.push('missing_REEDITPRO_QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_true')
  if (input.sourceDecision && input.sourceDecision !== QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_SOURCE_DECISION) {
    blockers.push('source_decision_must_match_completed_qwen_l4_vllm_tuning_proof')
    status = 'blocked_source_decision_mismatch'
  } else if (enabled && !targetMatches) {
    blockers.push('REEDITPRO_EXTERNAL_BETA_TARGET_REF_must_equal_wmyyttnynmteqgcdishd')
    status = 'blocked_target_ref_mismatch'
  } else if (enabled && !scopeMatches) {
    blockers.push('REEDITPRO_QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_SCOPE_must_equal_approved_snapshot_structured_metadata_only')
    status = 'blocked_scope_mismatch'
  } else if (enabled && !hasValue(input.approvedSnapshotRef)) {
    blockers.push('approved_snapshot_reference_required')
    status = 'blocked_missing_approved_snapshot_reference'
  } else if (enabled && !hasValue(input.creditReservationRef)) {
    blockers.push('credit_reservation_reference_required')
    status = 'blocked_missing_credit_reservation_reference'
  } else if (enabled && !hasValue(input.queueLeaseRef)) {
    blockers.push('queue_lease_reference_required')
    status = 'blocked_missing_queue_lease_reference'
  } else if (enabled && !hasValue(input.idempotencyKey)) {
    blockers.push('idempotency_key_required')
    status = 'blocked_missing_idempotency_key'
  } else if (enabled && !hasValue(input.privateArtifactManifestRef)) {
    blockers.push('private_artifact_manifest_reference_required')
    status = 'blocked_missing_private_artifact_manifest_reference'
  } else if (enabled && !hasValue(input.privateArtifactChecksumRef)) {
    blockers.push('private_artifact_checksum_reference_required')
    status = 'blocked_missing_private_artifact_checksum_reference'
  } else if (enabled && (input.frontendProviderCallAttempted || input.frontendModelCallAttempted)) {
    blockers.push('frontend_provider_and_model_calls_forbidden')
    status = 'blocked_frontend_provider_or_model_call_attempt'
  } else if (enabled && (input.publicArtifactRequested || input.signedUrlRequested)) {
    blockers.push('public_artifacts_and_signed_urls_blocked')
    status = 'blocked_public_or_signed_artifact_request'
  } else if (enabled && (input.rawPromptRequested || input.arbitraryUserMediaRequested)) {
    blockers.push('raw_prompt_and_arbitrary_user_media_blocked')
    status = 'blocked_raw_prompt_or_arbitrary_media_request'
  } else if (enabled && input.finalRenderExportRequested) {
    blockers.push('final_render_export_blocked')
    status = 'blocked_final_render_export_request'
  } else if (enabled) {
    status = 'ready_backend_only_qwen_structured_metadata_runtime_gate'
  }

  return {
    packet: QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_PACKET,
    sourceDecision: QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_SOURCE_DECISION,
    ok: status === 'ready_backend_only_qwen_structured_metadata_runtime_gate',
    status,
    target: {
      projectName: 'Reeditpro',
      projectRef: QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_REQUIRED_VALUES.targetRef,
      environment: 'staging',
    },
    requiredL4VllmConfig: {
      QWEN_VLLM_MAX_MODEL_LEN: QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_REQUIRED_VALUES.maxModelLen,
      QWEN_VLLM_MAX_NUM_BATCHED_TOKENS:
        QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_REQUIRED_VALUES.maxNumBatchedTokens,
      QWEN_VLLM_MAX_NUM_SEQS: QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_REQUIRED_VALUES.maxNumSeqs,
      QWEN_VLLM_GPU_MEMORY_UTILIZATION:
        QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_REQUIRED_VALUES.gpuMemoryUtilization,
    },
    runtimeGate: {
      approvedSnapshotRequired: true,
      creditReservationRequired: true,
      queueLeaseRequired: true,
      idempotencyKeyRequired: true,
      privateArtifactManifestRequired: true,
      privateArtifactChecksumRequired: true,
      backendOnlyAdapterRequired: true,
      structuredMetadataOnly: true,
      frontendProviderCallsAllowed: false,
      frontendModelCallsAllowed: false,
      rawPromptExecutionAllowed: false,
      arbitraryUserMediaAllowed: false,
      publicArtifactsAllowed: false,
      signedUrlsAllowed: false,
      broadExternalBetaAllowed: false,
      paidProductionAllowed: false,
      productionAllowed: false,
      finalRenderExportAllowed: false,
    },
    safety: {
      sourceOnlyContract: true,
      qwenRuntimeExecuted: false,
      cloudRunServiceUpdated: false,
      cloudRunJobExecuted: false,
      providerCall: false,
      modelCall: false,
      workerExecution: false,
      workerDispatch: false,
      routeExecution: false,
      supabaseMutation: false,
      sqlExecution: false,
      secretPayloadAccess: false,
      signedUrlCreation: false,
      publicArtifactCreation: false,
      mediaProcessing: false,
      finalRenderExport: false,
      externalBetaUnlockAppliedToEnvironment: false,
      productionUnlock: false,
    },
    blockers,
    nextMilestone: 'QWEN2_5_VL_EXTERNAL_BETA_BACKEND_RUNTIME_ADAPTER_1',
  }
}

export function assertQwen25VlExternalBetaRuntimeGateResult(
  result: Qwen25VlExternalBetaRuntimeGateResult,
): void {
  if (result.sourceDecision !== QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_SOURCE_DECISION) {
    throw new Error('QWEN2.5-VL runtime gate source decision mismatch.')
  }
  if (result.target.projectRef !== QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_REQUIRED_VALUES.targetRef) {
    throw new Error('QWEN2.5-VL runtime gate target mismatch.')
  }
  if (result.requiredL4VllmConfig.QWEN_VLLM_MAX_MODEL_LEN !== 2048) throw new Error('QWEN max model len mismatch.')
  if (result.requiredL4VllmConfig.QWEN_VLLM_MAX_NUM_BATCHED_TOKENS !== 1024) {
    throw new Error('QWEN max batched token mismatch.')
  }
  if (result.requiredL4VllmConfig.QWEN_VLLM_MAX_NUM_SEQS !== 1) throw new Error('QWEN max seqs mismatch.')
  if (result.requiredL4VllmConfig.QWEN_VLLM_GPU_MEMORY_UTILIZATION !== 0.92) {
    throw new Error('QWEN GPU memory utilization mismatch.')
  }

  for (const [key, value] of Object.entries(result.runtimeGate)) {
    if (key.endsWith('Required') || key === 'backendOnlyAdapterRequired' || key === 'structuredMetadataOnly') {
      if (value !== true) throw new Error(`Runtime gate ${key} must remain true.`)
      continue
    }
    if (key.endsWith('Allowed') && value !== false) throw new Error(`Runtime gate ${key} must remain false.`)
  }

  for (const [key, value] of Object.entries(result.safety)) {
    if (key === 'sourceOnlyContract') {
      if (value !== true) throw new Error('Source-only contract flag must be true.')
      continue
    }
    if (value !== false) throw new Error(`Safety flag ${key} must remain false.`)
  }
}
