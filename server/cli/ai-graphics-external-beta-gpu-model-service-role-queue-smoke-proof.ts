import fs from 'node:fs'

const preparedDecision =
  'ai_graphics_external_beta_gpu_model_service_role_queue_smoke_proof_prepared_with_runtime_blocks'
const acceptedDecision =
  'ai_graphics_external_beta_gpu_model_service_role_queue_smoke_proof_accepted_with_runtime_blocks'
const rejectedDecision =
  'ai_graphics_external_beta_gpu_model_service_role_queue_smoke_proof_rejected'
const preparedStatus =
  'gpu_model_service_role_queue_smoke_proof_prepared_validator_only'
const acceptedStatus =
  'gpu_model_service_role_queue_smoke_proof_accepted_cleanup_verified_no_dispatch'

const gpuModelTools = [
  'torch_torchvision',
  'transformers',
  'sam2',
  'birefnet',
  'real_esrgan',
  'kornia',
  'rembg',
  'transparent_background',
] as const

type GpuModelToolId = typeof gpuModelTools[number]

interface SourceHarnessPacket {
  decision?: string
  status?: string
  gpuModelTools?: Array<{ toolId?: string }>
  counts?: Record<string, number>
  booleans?: Record<string, boolean>
}

interface SmokeResult {
  decision?: string
  status?: string
  toolsSubmitted?: number
  toolsSubmittedIds?: string[]
  jobIdsReturned?: number
  workerClaimsReturned?: number
  serviceRoleQueueSmokeAuthorizationRef?: string
  sourceGpuModelWorkerBoundaryProofAccepted?: boolean
  sourceRuntimeQueueServiceProofBridgeAccepted?: boolean
  gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools?: number
  liveServiceRoleQueueSmokeExecutedNow?: boolean
  liveSupabaseQueueWritesNow?: number
  liveWorkerClaimRowsNow?: number
  liveWorkerDispatchesNow?: number
  liveToolExecutionsNow?: number
  gpuRuntimeShouldStartNow?: boolean
  modelWeightsLoadedNow?: boolean
  fixtureRowsPersistedAfterCleanup?: number
  externalBetaReadyNowTools?: number
  productionReadyNowTools?: number
}

function stringFlag(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  return index === -1 ? undefined : process.argv[index + 1]
}

function readJsonFlag<T>(flag: string): T | undefined {
  const filePath = stringFlag(flag)
  if (!filePath) return undefined
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T
}

function sorted(value: readonly string[]): string[] {
  return [...value].sort()
}

function sameTools(value: unknown): value is GpuModelToolId[] {
  if (!Array.isArray(value)) return false
  return JSON.stringify(sorted(value)) === JSON.stringify(sorted(gpuModelTools))
}

function hasRef(value: string | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

function sourceHarnessAccepted(packet: SourceHarnessPacket | undefined): boolean {
  if (!packet) return false
  const tools = packet.gpuModelTools?.map((tool) => tool.toolId).filter(Boolean) ?? []
  return (
    packet.decision ===
      'ai_graphics_external_beta_gpu_model_service_role_queue_smoke_harness_prepared_with_runtime_blocks' &&
    packet.status === 'gpu_model_service_role_queue_smoke_prepared_not_executed' &&
    sameTools(tools) &&
    packet.counts?.gpuModelToolsCovered === 8 &&
    packet.counts?.expectedLiveQueueRowsBeforeCleanup === 8 &&
    packet.counts?.expectedWorkerClaimRowsBeforeCleanup === 8 &&
    packet.counts?.expectedPersistedRowsAfterCleanup === 0 &&
    packet.counts?.gpuRuntimeShouldStartNowTools === 0 &&
    packet.booleans?.all8GpuModelToolsReadyForExplicitNonProductionQueueSmoke === true &&
    packet.booleans?.usesExistingAiGraphicsRuntimeQueueService === true &&
    packet.booleans?.newGpuWorkerCreated === false &&
    packet.booleans?.gpuRuntimeOnDemandOnly === true &&
    packet.booleans?.gpuRuntimeShouldStartNow === false &&
    packet.booleans?.agentCanExecuteGpuModelToolsNow === false
  )
}

function evaluate(input: {
  sourceHarnessPacket?: SourceHarnessPacket
  smokeResult?: SmokeResult
  evidenceRef?: string
  telemetryRef?: string
  cleanupProofRef?: string
}) {
  const errors: string[] = []
  const result = input.smokeResult

  if (!sourceHarnessAccepted(input.sourceHarnessPacket)) {
    errors.push('source_gpu_model_service_role_queue_smoke_harness_not_accepted')
  }
  if (!result) {
    errors.push('missing_gpu_model_service_role_queue_smoke_result')
  } else {
    if (
      result.decision !==
      'ai_graphics_external_beta_gpu_model_service_role_queue_smoke_passed_with_cleanup'
    ) {
      errors.push('result_decision_not_passed_with_cleanup')
    }
    if (result.status !== 'gpu_model_service_role_queue_smoke_passed_with_cleanup_no_worker_dispatch') {
      errors.push('result_status_not_cleanup_no_dispatch')
    }
    if (result.toolsSubmitted !== 8) errors.push('tools_submitted_not_8')
    if (!sameTools(result.toolsSubmittedIds)) errors.push('tools_submitted_ids_do_not_cover_8_gpu_tools')
    if (result.jobIdsReturned !== 8) errors.push('job_ids_returned_not_8')
    if (result.workerClaimsReturned !== 8) errors.push('worker_claims_returned_not_8')
    if (!hasRef(result.serviceRoleQueueSmokeAuthorizationRef)) {
      errors.push('service_role_queue_smoke_authorization_ref_missing')
    }
    if (result.sourceGpuModelWorkerBoundaryProofAccepted !== true) {
      errors.push('source_gpu_model_worker_boundary_proof_not_accepted')
    }
    if (result.sourceRuntimeQueueServiceProofBridgeAccepted !== true) {
      errors.push('source_runtime_queue_service_proof_bridge_not_accepted')
    }
    if (result.gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools !== 8) {
      errors.push('gpu_runtime_start_allowed_tools_not_8')
    }
    if (result.liveServiceRoleQueueSmokeExecutedNow !== true) {
      errors.push('live_service_role_queue_smoke_not_executed_in_source_result')
    }
    if (result.liveSupabaseQueueWritesNow !== 8) errors.push('live_queue_writes_not_8')
    if (result.liveWorkerClaimRowsNow !== 8) errors.push('live_worker_claim_rows_not_8')
    if (result.liveWorkerDispatchesNow !== 0) errors.push('worker_dispatches_not_0')
    if (result.liveToolExecutionsNow !== 0) errors.push('tool_executions_not_0')
    if (result.gpuRuntimeShouldStartNow !== false) errors.push('gpu_runtime_should_start_now_not_false')
    if (result.modelWeightsLoadedNow !== false) errors.push('model_weights_loaded_not_false')
    if (result.fixtureRowsPersistedAfterCleanup !== 0) {
      errors.push('fixture_rows_persisted_after_cleanup_not_0')
    }
    if (result.externalBetaReadyNowTools !== 0) errors.push('external_beta_ready_now_not_0')
    if (result.productionReadyNowTools !== 0) errors.push('production_ready_now_not_0')
  }

  if (!hasRef(input.evidenceRef)) errors.push('evidence_ref_missing')
  if (!hasRef(input.telemetryRef)) errors.push('telemetry_ref_missing')
  if (!hasRef(input.cleanupProofRef)) errors.push('cleanup_proof_ref_missing')

  const accepted = errors.length === 0
  return {
    decision: accepted ? acceptedDecision : rejectedDecision,
    status: accepted ? acceptedStatus : 'gpu_model_service_role_queue_smoke_proof_rejected',
    errors,
    tools: [...gpuModelTools],
    counts: {
      gpuModelToolsCovered: 8,
      sourceHarnessAccepted: sourceHarnessAccepted(input.sourceHarnessPacket) ? 1 : 0,
      acceptedLiveQueueWritesWithProvidedEvidence: accepted ? 8 : 0,
      acceptedWorkerClaimRowsWithProvidedEvidence: accepted ? 8 : 0,
      acceptedWorkerDispatchesWithProvidedEvidence: 0,
      acceptedToolExecutionsWithProvidedEvidence: 0,
      acceptedGpuRuntimeStartNowWithProvidedEvidence: 0,
      acceptedModelWeightsLoadedWithProvidedEvidence: 0,
      acceptedRowsPersistedAfterCleanup: accepted ? 0 : undefined,
      externalBetaReadyNowTools: 0,
      productionReadyNowTools: 0,
    },
    evidence: {
      serviceRoleQueueSmokeEvidenceRef: input.evidenceRef ?? null,
      serviceRoleQueueSmokeTelemetryRef: input.telemetryRef ?? null,
      serviceRoleQueueSmokeCleanupProofRef: input.cleanupProofRef ?? null,
      savedResultOnly: true,
      validatorLiveQueueWritePerformed: false,
      validatorWorkerClaimPerformed: false,
      validatorWorkerDispatchPerformed: false,
      validatorToolExecutionPerformed: false,
      validatorGpuRuntimePerformed: false,
    },
    booleans: {
      gpuModelServiceRoleQueueSmokeProofAcceptedWithProvidedEvidence: accepted,
      sourceGpuModelServiceRoleQueueSmokeHarnessAccepted: sourceHarnessAccepted(input.sourceHarnessPacket),
      all8GpuModelToolsCovered: true,
      liveServiceRoleQueueSmokeAcceptedWithProvidedEvidence: accepted,
      liveQueueWritesAcceptedWithProvidedEvidence: accepted,
      liveWorkerClaimsAcceptedWithProvidedEvidence: accepted,
      cleanupVerifiedWithProvidedEvidence: accepted,
      serviceRoleCredentialsServerOnly: true,
      nonProductionEnvironmentRequired: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      agentCanSelectForPlanning: true,
      agentCanExecuteGpuModelToolsNow: false,
      agentCanExecuteAll21ToolsNow: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      workerDispatchApprovedNow: false,
      toolExecutionApprovedNow: false,
      providerRuntimeApprovedNow: false,
      browserWebglCanvasRuntimeApprovedNow: false,
      gpuRuntimeApprovedNow: false,
      gpuRuntimeShouldStartNow: false,
      runtimeReadyNow: false,
      internalBetaReadyNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
      dependencyInstallPerformed: false,
      packageLockMutationPerformed: false,
      toolExecutionPerformed: false,
      workerExecutionPerformed: false,
      routeExecutionPerformed: false,
      providerRuntimePerformed: false,
      browserWebglCanvasRuntimePerformed: false,
      gpuRuntimePerformed: false,
      modelWeightsDownloaded: false,
      modelWeightsLoaded: false,
      modelInferencePerformed: false,
      mediaProcessingPerformed: false,
      supabaseMutationPerformedByValidator: false,
      gcsUploadPerformed: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
    },
    input: {
      validatorOnly: true,
      liveServiceRoleQueueSmokeExecutedByThisCommand: false,
      packageLockMutationPerformed: false,
      dependencyInstallPerformed: false,
    },
  }
}

function preparedContract() {
  return {
    decision: preparedDecision,
    status: preparedStatus,
    summary:
      'Validator for saved GPU/model non-production service-role queue-smoke results. It performs no live queue write, worker claim, worker dispatch, tool execution, GPU runtime, model load, Supabase mutation, public artifact, signed URL, beta unlock, or production unlock.',
    validatorScript: 'ai-graphics:external-beta-gpu-model-service-role-queue-smoke-proof',
    diagnosticScript:
      'ai-graphics:external-beta-gpu-model-service-role-queue-smoke-proof:diagnostics',
    requiredInputs: [
      '--external-beta-gpu-model-service-role-queue-smoke-harness-packet',
      '--external-beta-gpu-model-service-role-queue-smoke-result',
      '--external-beta-gpu-model-service-role-queue-smoke-evidence-ref',
      '--external-beta-gpu-model-service-role-queue-smoke-telemetry-ref',
      '--external-beta-gpu-model-service-role-queue-smoke-cleanup-proof-ref',
    ],
    acceptedResultDecision:
      'ai_graphics_external_beta_gpu_model_service_role_queue_smoke_passed_with_cleanup',
    acceptedResultStatus:
      'gpu_model_service_role_queue_smoke_passed_with_cleanup_no_worker_dispatch',
    tools: [...gpuModelTools],
    acceptanceCriteria: {
      toolsSubmitted: 8,
      toolsSubmittedIdsCoverAll8GpuModelTools: true,
      jobIdsReturned: 8,
      workerClaimsReturned: 8,
      liveQueueWritesAcceptedWithProvidedEvidence: 8,
      workerDispatchesAcceptedWithProvidedEvidence: 0,
      toolExecutionsAcceptedWithProvidedEvidence: 0,
      gpuRuntimeShouldStartNow: false,
      modelWeightsLoadedNow: false,
      fixtureRowsPersistedAfterCleanup: 0,
      evidenceRefsRequired: true,
    },
  }
}

if (process.argv.includes('--print-contract')) {
  console.log(JSON.stringify(preparedContract(), null, 2))
} else {
  console.log(
    JSON.stringify(
      evaluate({
        sourceHarnessPacket: readJsonFlag<SourceHarnessPacket>(
          '--external-beta-gpu-model-service-role-queue-smoke-harness-packet',
        ),
        smokeResult: readJsonFlag<SmokeResult>(
          '--external-beta-gpu-model-service-role-queue-smoke-result',
        ),
        evidenceRef: stringFlag('--external-beta-gpu-model-service-role-queue-smoke-evidence-ref'),
        telemetryRef: stringFlag('--external-beta-gpu-model-service-role-queue-smoke-telemetry-ref'),
        cleanupProofRef: stringFlag('--external-beta-gpu-model-service-role-queue-smoke-cleanup-proof-ref'),
      }),
      null,
      2,
    ),
  )
}
