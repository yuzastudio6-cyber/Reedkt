import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_MOCK_ONLY_SOURCE_IMPORT_1 } from './mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-mock-only-source-import-1'

const PACKET = 'RP-EXTERNAL-BETA-QWEN-REAL-DISPATCH-PREFLIGHT-1' as const
const BLOCKED_DECISION = 'blocked_pending_qwen_real_dispatch_preflight_confirmation' as const
const PASSED_DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_preflight_passed_runtime_invocation_still_blocked' as const
const EXECUTION = 'completed_qwen_real_dispatch_preflight_gate_source_no_runtime_execution' as const
const CONFIRMATION_ENV = 'REEDITPRO_CONFIRM_QWEN_REAL_DISPATCH_PREFLIGHT' as const
const NEXT_PROMPT =
  'QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_CONFIRMED_PREFLIGHT_1' as const

const SOURCE_IMPORT_RECORD =
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_MOCK_ONLY_SOURCE_IMPORT_1

const RUNTIME_FALSE_FLAGS = {
  cloudRunInvocationAttempted: false,
  serviceRuntimeRequestSent: false,
  serviceUrlResolvedNow: false,
  audienceResolvedNow: false,
  identityTokenFetched: false,
  authHeaderCreated: false,
  modelImportRun: false,
  modelLoadRun: false,
  vllmEngineInitialized: false,
  promptProcessed: false,
  forwardPassRun: false,
  inferenceRun: false,
  providerCallsMade: false,
  realJobCreated: false,
  realLeaseClaimed: false,
  idempotencyRowCreated: false,
  jobEventCreated: false,
  backendRuntimeMessageCreated: false,
  workerClaimCreated: false,
  workersDispatched: false,
  supabaseTouched: false,
  sqlExecuted: false,
  generatedAssetsCreated: false,
  publicArtifactsCreated: false,
  signedUrlsCreated: false,
  mediaProcessingRun: false,
  renderExportRun: false,
  creditMutationCreated: false,
  betaReady: false,
  productionReady: false,
} as const

export type Qwen25VlRealDispatchPreflightFixture = {
  approvedPlanSnapshotId: string
  immutablePlanVersion: number
  approvedSnapshotHash: string
  confirmedOutputFrame: {
    width: number
    height: number
    fps: number
    aspectRatio: string
  }
  creditReservationId: string
  creditSpendAllowed: false
  estimatedInternalToolCostEventId: string
  privateStorageRef: string
  assetManifestRef: string
  checksumRef: string
  idempotencyKey: string
  duplicateSourceGuard: 'required_and_present'
  serviceRoleBackendContext: 'backend_service_role_only'
  frontendServiceRoleExposure: false
  workerLeaseRequest: {
    leaseMode: 'preflight_only'
    executionAllowed: false
  }
  structuredPromptEnvelopeRef: string
  privateInputManifestRef: string
  serviceUrlNameOnly: 'reeditpro-qwen2-5-vl-l4-worker'
  audienceNameOnly: 'reeditpro-qwen2-5-vl-l4-worker'
  identityTokenPolicy: 'not_fetched_in_preflight_source_gate'
  scaleToZeroL4RuntimePolicy: 'required'
  noPublicArtifactPolicy: true
  qaReportRef: string
  auditEventRef: string
  cleanupPolicy: 'required'
  creditReleaseOrSpendPolicy: 'no_spend'
}

export type Qwen25VlRealDispatchPreflightResult = {
  packet: typeof PACKET
  decision: typeof BLOCKED_DECISION | typeof PASSED_DECISION
  execution: typeof EXECUTION
  confirmationEnv: typeof CONFIRMATION_ENV
  confirmationProvided: boolean
  status: 'blocked' | 'passed'
  blocker: typeof BLOCKED_DECISION | null
  validatedEnvelopeStepCount: number
  missingRequiredFields: string[]
  runtimeInvocationStillBlocked: true
  nextPrompt: typeof NEXT_PROMPT
  runtimeFlags: typeof RUNTIME_FALSE_FLAGS
}

export const QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_PREFLIGHT_1 = {
  packet: PACKET,
  workstream: SOURCE_IMPORT_RECORD.workstream,
  toolId: SOURCE_IMPORT_RECORD.toolId,
  registryToolId: SOURCE_IMPORT_RECORD.registryToolId,
  mode: 'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_preflight_1',
  decision: BLOCKED_DECISION,
  execution: EXECUTION,
  sourceChain: {
    mockOnlySourceImportMerge: '135999b39498688da2002c2f5dbc68acda3b1bb0',
    sourceImportScopeMerge: SOURCE_IMPORT_RECORD.sourceChain.sourceImportScopeMerge,
    topDraftApprovalPr: SOURCE_IMPORT_RECORD.sourceChain.topDraftApprovalPr,
    lowerExecutionPlanPr: SOURCE_IMPORT_RECORD.sourceChain.lowerExecutionPlanPr,
    olderStackedPreflightPr: SOURCE_IMPORT_RECORD.sourceChain.newerPreflightPr,
    singleTesterRealUsageQa: SOURCE_IMPORT_RECORD.sourceChain.singleTesterRealUsageQa,
    excludedRemotionPr: SOURCE_IMPORT_RECORD.sourceChain.excludedRemotionPr,
  },
  confirmationGate: {
    env: CONFIRMATION_ENV,
    requiredValue: 'true',
    absentDecision: BLOCKED_DECISION,
  },
  selectedRuntime: SOURCE_IMPORT_RECORD.selectedRuntime,
  preflightEnvelope: SOURCE_IMPORT_RECORD.firstRealDispatchPreflightEnvelope.map((step) => ({
    ...step,
    executionAllowedNow: false,
  })),
  runtimeFalseFlags: RUNTIME_FALSE_FLAGS,
  sourceOfTruthRules: {
    ...SOURCE_IMPORT_RECORD.sourceOfTruthRules,
    runtimeInvocationStillBlockedAfterPreflight: true,
    confirmedPreflightMayNotSpendCredits: true,
    confirmedPreflightMayNotCreateAssets: true,
  },
  nextPrompt: NEXT_PROMPT,
} as const

export function buildDefaultQwen25VlRealDispatchPreflightFixture(): Qwen25VlRealDispatchPreflightFixture {
  return {
    approvedPlanSnapshotId: 'approved-plan-snapshot-qwen-preflight-local-fixture',
    immutablePlanVersion: 1,
    approvedSnapshotHash: 'sha256:approved-snapshot-local-fixture',
    confirmedOutputFrame: {
      width: 1920,
      height: 1080,
      fps: 30,
      aspectRatio: '16:9',
    },
    creditReservationId: 'credit-reservation-qwen-preflight-local-fixture',
    creditSpendAllowed: false,
    estimatedInternalToolCostEventId: 'tool-cost-event-qwen-preflight-local-fixture',
    privateStorageRef: 'private://reeditpro-staging/qwen-preflight/local-source-fixture',
    assetManifestRef: 'manifest://qwen-preflight/local-asset-manifest',
    checksumRef: 'sha256:qwen-preflight-local-checksum',
    idempotencyKey: 'qwen-real-dispatch-preflight-local-fixture-v1',
    duplicateSourceGuard: 'required_and_present',
    serviceRoleBackendContext: 'backend_service_role_only',
    frontendServiceRoleExposure: false,
    workerLeaseRequest: {
      leaseMode: 'preflight_only',
      executionAllowed: false,
    },
    structuredPromptEnvelopeRef: 'prompt-envelope://qwen-preflight/local-structured-envelope',
    privateInputManifestRef: 'manifest://qwen-preflight/local-private-input-manifest',
    serviceUrlNameOnly: 'reeditpro-qwen2-5-vl-l4-worker',
    audienceNameOnly: 'reeditpro-qwen2-5-vl-l4-worker',
    identityTokenPolicy: 'not_fetched_in_preflight_source_gate',
    scaleToZeroL4RuntimePolicy: 'required',
    noPublicArtifactPolicy: true,
    qaReportRef: 'qa-report://qwen-preflight/local-required-report',
    auditEventRef: 'audit://qwen-preflight/local-required-event',
    cleanupPolicy: 'required',
    creditReleaseOrSpendPolicy: 'no_spend',
  }
}

export function evaluateQwen25VlRealDispatchPreflightFixture(
  fixture: Qwen25VlRealDispatchPreflightFixture,
): Qwen25VlRealDispatchPreflightResult {
  const missingRequiredFields: string[] = []
  const requireString = (field: keyof Qwen25VlRealDispatchPreflightFixture) => {
    const value = fixture[field]
    if (typeof value !== 'string' || value.trim().length === 0) {
      missingRequiredFields.push(String(field))
    }
  }

  for (const field of [
    'approvedPlanSnapshotId',
    'approvedSnapshotHash',
    'creditReservationId',
    'estimatedInternalToolCostEventId',
    'privateStorageRef',
    'assetManifestRef',
    'checksumRef',
    'idempotencyKey',
    'structuredPromptEnvelopeRef',
    'privateInputManifestRef',
    'qaReportRef',
    'auditEventRef',
  ] as const) {
    requireString(field)
  }

  if (fixture.immutablePlanVersion < 1) missingRequiredFields.push('immutablePlanVersion')
  if (fixture.confirmedOutputFrame.width < 1) missingRequiredFields.push('confirmedOutputFrame.width')
  if (fixture.confirmedOutputFrame.height < 1) missingRequiredFields.push('confirmedOutputFrame.height')
  if (fixture.confirmedOutputFrame.fps < 1) missingRequiredFields.push('confirmedOutputFrame.fps')
  if (fixture.creditSpendAllowed !== false) missingRequiredFields.push('creditSpendAllowed')
  if (fixture.frontendServiceRoleExposure !== false) missingRequiredFields.push('frontendServiceRoleExposure')
  if (fixture.workerLeaseRequest.executionAllowed !== false) missingRequiredFields.push('workerLeaseRequest.executionAllowed')
  if (fixture.noPublicArtifactPolicy !== true) missingRequiredFields.push('noPublicArtifactPolicy')

  return {
    packet: PACKET,
    decision: missingRequiredFields.length === 0 ? PASSED_DECISION : BLOCKED_DECISION,
    execution: EXECUTION,
    confirmationEnv: CONFIRMATION_ENV,
    confirmationProvided: true,
    status: missingRequiredFields.length === 0 ? 'passed' : 'blocked',
    blocker: missingRequiredFields.length === 0 ? null : BLOCKED_DECISION,
    validatedEnvelopeStepCount:
      QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_PREFLIGHT_1.preflightEnvelope.length,
    missingRequiredFields,
    runtimeInvocationStillBlocked: true,
    nextPrompt: NEXT_PROMPT,
    runtimeFlags: RUNTIME_FALSE_FLAGS,
  }
}

export function runQwen25VlRealDispatchPreflight1(
  env: Record<string, string | undefined> = process.env,
): Qwen25VlRealDispatchPreflightResult {
  if (env[CONFIRMATION_ENV] !== 'true') {
    return {
      packet: PACKET,
      decision: BLOCKED_DECISION,
      execution: EXECUTION,
      confirmationEnv: CONFIRMATION_ENV,
      confirmationProvided: false,
      status: 'blocked',
      blocker: BLOCKED_DECISION,
      validatedEnvelopeStepCount: 0,
      missingRequiredFields: [],
      runtimeInvocationStillBlocked: true,
      nextPrompt: NEXT_PROMPT,
      runtimeFlags: RUNTIME_FALSE_FLAGS,
    }
  }

  return evaluateQwen25VlRealDispatchPreflightFixture(buildDefaultQwen25VlRealDispatchPreflightFixture())
}

export type Qwen25VlControlledPersistedWorkerDispatchRuntimeRealDispatchPreflight1 =
  typeof QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_PREFLIGHT_1
