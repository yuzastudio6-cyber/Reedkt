import {
  QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_SOURCE_DECISION,
  type Qwen25VlExternalBetaRuntimeGateInput,
  type Qwen25VlExternalBetaRuntimeGateResult,
  type Qwen25VlExternalBetaRuntimeGateStatus,
  assertQwen25VlExternalBetaRuntimeGateResult,
  evaluateQwen25VlExternalBetaRuntimeGate,
} from '../config/qwen2-5-vl-external-beta-runtime-gate-contract'

export const QWEN2_5_VL_EXTERNAL_BETA_BACKEND_RUNTIME_ADAPTER_PACKET =
  'QWEN2_5_VL_EXTERNAL_BETA_BACKEND_RUNTIME_ADAPTER_1' as const

export const QWEN2_5_VL_EXTERNAL_BETA_BACKEND_RUNTIME_ADAPTER_DECISION =
  'completed_qwen2_5_vl_external_beta_backend_runtime_adapter_source_contract' as const

export const QWEN2_5_VL_EXTERNAL_BETA_BACKEND_RUNTIME_ADAPTER_EXECUTION =
  'completed_backend_only_adapter_source_no_qwen_runtime_execution' as const

export const QWEN2_5_VL_EXTERNAL_BETA_BACKEND_RUNTIME_ADAPTER_READY_STATUS =
  'ready_for_confirmed_qwen2_5_vl_external_beta_adapter_runtime_fixture' as const

export const QWEN2_5_VL_EXTERNAL_BETA_BACKEND_RUNTIME_ADAPTER_NEXT_MILESTONE =
  'QWEN2_5_VL_EXTERNAL_BETA_CONFIRMED_ADAPTER_RUNTIME_FIXTURE_1' as const

export const QWEN2_5_VL_EXTERNAL_BETA_BACKEND_RUNTIME_ADAPTER_TARGET = {
  googleCloudProjectId: 'reeditpro',
  region: 'us-central1',
  gpuService: 'reeditpro-qwen2-5-vl-l4-worker',
  cpuCallerJob: 'reeditpro-qwen2-5-vl-private-caller',
} as const

export type Qwen25VlExternalBetaBackendRuntimeAdapterStatus =
  | typeof QWEN2_5_VL_EXTERNAL_BETA_BACKEND_RUNTIME_ADAPTER_READY_STATUS
  | Qwen25VlExternalBetaRuntimeGateStatus

export interface Qwen25VlExternalBetaBackendRuntimeAdapterInput
  extends Qwen25VlExternalBetaRuntimeGateInput {
  adapterRequestId?: string | null
  approvedSnapshotTaskClass?: string | null
  privateInputManifestRef?: string | null
  structuredOutputSchema?: string | null
}

export interface Qwen25VlExternalBetaBackendRuntimeAdapterResult {
  packet: typeof QWEN2_5_VL_EXTERNAL_BETA_BACKEND_RUNTIME_ADAPTER_PACKET
  decision: typeof QWEN2_5_VL_EXTERNAL_BETA_BACKEND_RUNTIME_ADAPTER_DECISION
  execution: typeof QWEN2_5_VL_EXTERNAL_BETA_BACKEND_RUNTIME_ADAPTER_EXECUTION
  ok: boolean
  status: Qwen25VlExternalBetaBackendRuntimeAdapterStatus
  runtimeGate: Qwen25VlExternalBetaRuntimeGateResult
  adapter: {
    backendOnly: true
    sourceOnlyContract: true
    executeNow: false
    futureConfirmedRuntimePacketRequired: true
    targetRef: 'wmyyttnynmteqgcdishd'
    targetEnvironment: 'staging'
    runtimeScope: 'approved_snapshot_structured_metadata_only'
    structuredOutputSchema: string
    acceptedSourceDecision: typeof QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_SOURCE_DECISION
    adapterReadiness: 'blocked_pending_runtime_gate' | 'ready_for_confirmed_adapter_runtime_fixture'
  }
  invocationEnvelope: {
    adapterRequestId: string | null
    approvedSnapshotRef: string | null
    creditReservationRef: string | null
    queueLeaseRef: string | null
    idempotencyKey: string | null
    privateArtifactManifestRef: string | null
    privateArtifactChecksumRef: string | null
    privateInputManifestRef: string | null
    approvedSnapshotTaskClass: 'structured_metadata_only' | null
  }
  cloudRunPlan: {
    googleCloudProjectId: 'reeditpro'
    region: 'us-central1'
    gpuService: 'reeditpro-qwen2-5-vl-l4-worker'
    cpuCallerJob: 'reeditpro-qwen2-5-vl-private-caller'
    serviceUpdateAllowed: false
    jobExecutionAllowedInThisPhase: false
    identityTokenFetchAllowedInThisPhase: false
    secretPayloadAccessAllowed: false
  }
  requiredL4VllmConfig: Qwen25VlExternalBetaRuntimeGateResult['requiredL4VllmConfig']
  artifactPolicy: {
    privateArtifactsOnly: true
    publicArtifactsAllowed: false
    signedUrlsAllowed: false
    rawOutputStoredInRepo: false
    checksumRequired: true
    manifestRequired: true
  }
  safety: {
    sourceOnlyContract: true
    qwenRuntimeExecuted: false
    cloudRunServiceUpdated: false
    cloudRunJobExecuted: false
    identityTokenFetch: false
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
  nextMilestone: typeof QWEN2_5_VL_EXTERNAL_BETA_BACKEND_RUNTIME_ADAPTER_NEXT_MILESTONE
}

function normalize(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function buildQwen25VlExternalBetaBackendRuntimeAdapterContract(
  input: Qwen25VlExternalBetaBackendRuntimeAdapterInput = {},
): Qwen25VlExternalBetaBackendRuntimeAdapterResult {
  const runtimeGate = evaluateQwen25VlExternalBetaRuntimeGate({
    ...input,
    sourceDecision: input.sourceDecision ?? QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_SOURCE_DECISION,
  })
  assertQwen25VlExternalBetaRuntimeGateResult(runtimeGate)

  const ok = runtimeGate.ok
  const blockers = [...runtimeGate.blockers]
  const status: Qwen25VlExternalBetaBackendRuntimeAdapterStatus = ok
    ? QWEN2_5_VL_EXTERNAL_BETA_BACKEND_RUNTIME_ADAPTER_READY_STATUS
    : runtimeGate.status

  return {
    packet: QWEN2_5_VL_EXTERNAL_BETA_BACKEND_RUNTIME_ADAPTER_PACKET,
    decision: QWEN2_5_VL_EXTERNAL_BETA_BACKEND_RUNTIME_ADAPTER_DECISION,
    execution: QWEN2_5_VL_EXTERNAL_BETA_BACKEND_RUNTIME_ADAPTER_EXECUTION,
    ok,
    status,
    runtimeGate,
    adapter: {
      backendOnly: true,
      sourceOnlyContract: true,
      executeNow: false,
      futureConfirmedRuntimePacketRequired: true,
      targetRef: runtimeGate.target.projectRef,
      targetEnvironment: runtimeGate.target.environment,
      runtimeScope: 'approved_snapshot_structured_metadata_only',
      structuredOutputSchema: normalize(input.structuredOutputSchema) ?? 'qwen_fixture_visual_metadata_v1',
      acceptedSourceDecision: QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_SOURCE_DECISION,
      adapterReadiness: ok ? 'ready_for_confirmed_adapter_runtime_fixture' : 'blocked_pending_runtime_gate',
    },
    invocationEnvelope: {
      adapterRequestId: normalize(input.adapterRequestId),
      approvedSnapshotRef: normalize(input.approvedSnapshotRef),
      creditReservationRef: normalize(input.creditReservationRef),
      queueLeaseRef: normalize(input.queueLeaseRef),
      idempotencyKey: normalize(input.idempotencyKey),
      privateArtifactManifestRef: normalize(input.privateArtifactManifestRef),
      privateArtifactChecksumRef: normalize(input.privateArtifactChecksumRef),
      privateInputManifestRef: normalize(input.privateInputManifestRef),
      approvedSnapshotTaskClass: ok ? 'structured_metadata_only' : null,
    },
    cloudRunPlan: {
      ...QWEN2_5_VL_EXTERNAL_BETA_BACKEND_RUNTIME_ADAPTER_TARGET,
      serviceUpdateAllowed: false,
      jobExecutionAllowedInThisPhase: false,
      identityTokenFetchAllowedInThisPhase: false,
      secretPayloadAccessAllowed: false,
    },
    requiredL4VllmConfig: runtimeGate.requiredL4VllmConfig,
    artifactPolicy: {
      privateArtifactsOnly: true,
      publicArtifactsAllowed: false,
      signedUrlsAllowed: false,
      rawOutputStoredInRepo: false,
      checksumRequired: true,
      manifestRequired: true,
    },
    safety: {
      sourceOnlyContract: true,
      qwenRuntimeExecuted: false,
      cloudRunServiceUpdated: false,
      cloudRunJobExecuted: false,
      identityTokenFetch: false,
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
    nextMilestone: QWEN2_5_VL_EXTERNAL_BETA_BACKEND_RUNTIME_ADAPTER_NEXT_MILESTONE,
  }
}

export function assertQwen25VlExternalBetaBackendRuntimeAdapterResult(
  result: Qwen25VlExternalBetaBackendRuntimeAdapterResult,
): void {
  if (result.decision !== QWEN2_5_VL_EXTERNAL_BETA_BACKEND_RUNTIME_ADAPTER_DECISION) {
    throw new Error('QWEN backend runtime adapter decision mismatch.')
  }
  if (result.execution !== QWEN2_5_VL_EXTERNAL_BETA_BACKEND_RUNTIME_ADAPTER_EXECUTION) {
    throw new Error('QWEN backend runtime adapter execution mismatch.')
  }
  assertQwen25VlExternalBetaRuntimeGateResult(result.runtimeGate)
  if (!result.adapter.backendOnly) throw new Error('QWEN backend runtime adapter must remain backend-only.')
  if (!result.adapter.sourceOnlyContract) throw new Error('QWEN backend runtime adapter must remain source-only.')
  if (result.adapter.executeNow) throw new Error('QWEN backend runtime adapter must not execute now.')
  if (!result.adapter.futureConfirmedRuntimePacketRequired) {
    throw new Error('QWEN backend runtime adapter must require a future confirmed runtime packet.')
  }
  if (result.cloudRunPlan.serviceUpdateAllowed) throw new Error('QWEN Cloud Run service update must remain blocked.')
  if (result.cloudRunPlan.jobExecutionAllowedInThisPhase) {
    throw new Error('QWEN Cloud Run job execution must remain blocked in this phase.')
  }
  if (result.cloudRunPlan.identityTokenFetchAllowedInThisPhase) {
    throw new Error('QWEN identity token fetch must remain blocked in this phase.')
  }
  if (result.cloudRunPlan.secretPayloadAccessAllowed) throw new Error('QWEN secret payload access must remain blocked.')
  if (!result.artifactPolicy.privateArtifactsOnly) throw new Error('QWEN adapter must require private artifacts only.')
  if (!result.artifactPolicy.checksumRequired || !result.artifactPolicy.manifestRequired) {
    throw new Error('QWEN adapter must require artifact manifest and checksum references.')
  }
  for (const [key, value] of Object.entries(result.safety)) {
    if (key === 'sourceOnlyContract') {
      if (value !== true) throw new Error('QWEN source-only safety flag must remain true.')
      continue
    }
    if (value !== false) throw new Error(`QWEN safety flag ${key} must remain false.`)
  }
}
