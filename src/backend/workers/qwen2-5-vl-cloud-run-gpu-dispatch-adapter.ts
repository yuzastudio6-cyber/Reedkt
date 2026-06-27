import {
  QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT,
  validateQwen25VlLocalQueueFixture,
  type Qwen25VlLocalQueueValidationIssue,
} from '../mock/mock-qwen2-5-vl-cloud-run-gpu-approved-snapshot-local-queue-contract'
import { QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_RUNTIME_CONTRACT } from '../mock/mock-qwen2-5-vl-cloud-run-gpu-approved-snapshot-runtime-contract'

export type Qwen25VlCloudRunGpuDispatchAdapterStatus =
  | 'blocked_invalid_queue_contract'
  | 'blocked_fail_closed_cloud_run_invocation_disabled'

export interface Qwen25VlCloudRunGpuDispatchAdapterInput {
  queueFixture?: Record<string, unknown>
}

export interface Qwen25VlCloudRunGpuDispatchAdapterResult {
  ok: false
  status: Qwen25VlCloudRunGpuDispatchAdapterStatus
  decision: 'qwen2_5_vl_7b_cloud_run_gpu_fail_closed_dispatch_adapter_refused_no_cloud_run_invocation'
  queueContractValidated: boolean
  localQueueAcceptedForFutureDispatch: boolean
  runtimeSchemaVersion: string
  validationIssues: Qwen25VlLocalQueueValidationIssue[]
  message: string
  runtimeFlags: {
    adapterImplemented: true
    adapterInvokedLocally: true
    dispatchSubmitted: false
    cloudRunInvocationAttempted: false
    serviceRuntimeRequestSent: false
    modelImportRun: false
    modelLoadRun: false
    vllmEngineInitialized: false
    promptProcessed: false
    forwardPassRun: false
    inferenceRun: false
    providerCallsMade: false
    workersDispatched: false
    supabaseTouched: false
    sqlExecuted: false
    generatedAssetsCreated: false
    publicArtifactsCreated: false
    signedUrlsCreated: false
    creditMutationCreated: false
    betaUnlocked: false
    productionUnlocked: false
    dryRunPassedClaimed: false
    generatedLocalFixturePassedClaimed: false
  }
  warnings: string[]
}

const DECISION =
  'qwen2_5_vl_7b_cloud_run_gpu_fail_closed_dispatch_adapter_refused_no_cloud_run_invocation' as const

const BASE_RUNTIME_FLAGS = {
  adapterImplemented: true,
  adapterInvokedLocally: true,
  dispatchSubmitted: false,
  cloudRunInvocationAttempted: false,
  serviceRuntimeRequestSent: false,
  modelImportRun: false,
  modelLoadRun: false,
  vllmEngineInitialized: false,
  promptProcessed: false,
  forwardPassRun: false,
  inferenceRun: false,
  providerCallsMade: false,
  workersDispatched: false,
  supabaseTouched: false,
  sqlExecuted: false,
  generatedAssetsCreated: false,
  publicArtifactsCreated: false,
  signedUrlsCreated: false,
  creditMutationCreated: false,
  betaUnlocked: false,
  productionUnlocked: false,
  dryRunPassedClaimed: false,
  generatedLocalFixturePassedClaimed: false,
} as const

export function runQwen25VlCloudRunGpuFailClosedDispatchAdapter(
  input: Qwen25VlCloudRunGpuDispatchAdapterInput = {},
): Qwen25VlCloudRunGpuDispatchAdapterResult {
  const fixture = input.queueFixture ??
    QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT.validQueueFixture
  const queueValidation = validateQwen25VlLocalQueueFixture(fixture)

  if (!queueValidation.ok) {
    return {
      ok: false,
      status: 'blocked_invalid_queue_contract',
      decision: DECISION,
      queueContractValidated: false,
      localQueueAcceptedForFutureDispatch: false,
      runtimeSchemaVersion:
        QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_RUNTIME_CONTRACT.contract.schemaVersion,
      validationIssues: queueValidation.issues,
      message: 'Qwen dispatch adapter refused the queue fixture before runtime invocation.',
      runtimeFlags: BASE_RUNTIME_FLAGS,
      warnings: [
        'No worker dispatch was submitted.',
        'No Cloud Run request was sent.',
        'Invalid queue contracts must be repaired before any future dispatch prompt.',
      ],
    }
  }

  return {
    ok: false,
    status: 'blocked_fail_closed_cloud_run_invocation_disabled',
    decision: DECISION,
    queueContractValidated: true,
    localQueueAcceptedForFutureDispatch: true,
    runtimeSchemaVersion:
      QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_RUNTIME_CONTRACT.contract.schemaVersion,
    validationIssues: [],
    message:
      'Qwen dispatch adapter is fail-closed: queue contract is valid, but Cloud Run invocation and inference remain disabled.',
    runtimeFlags: BASE_RUNTIME_FLAGS,
    warnings: [
      'This adapter is an integration boundary only.',
      'Backend runtime, privileged lease enforcement, idempotency enforcement, and private Cloud Run invocation must be implemented before dispatch.',
      'No worker dispatch, Cloud Run invocation, model import, model load, vLLM startup, forward pass, or inference occurred.',
    ],
  }
}

export const QWEN2_5_VL_CLOUD_RUN_GPU_FAIL_CLOSED_DISPATCH_ADAPTER_CONTRACT = {
  adapterId: 'qwen2_5_vl_cloud_run_gpu_fail_closed_dispatch_adapter',
  workerType:
    QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT.queueEnvelope.workerType,
  jobType:
    QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT.queueEnvelope.jobType,
  runtimeSchemaVersion:
    QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_RUNTIME_CONTRACT.contract.schemaVersion,
  acceptsValidatedLocalQueueContract: true,
  submitsDispatch: false,
  invokesCloudRun: false,
  enablesInference: false,
  decision: DECISION,
} as const
