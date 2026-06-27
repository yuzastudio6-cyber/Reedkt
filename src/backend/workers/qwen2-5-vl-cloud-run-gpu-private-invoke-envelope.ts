import {
  QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT,
  validateQwen25VlLocalQueueFixture,
  type Qwen25VlLocalQueueValidationIssue,
} from '../mock/mock-qwen2-5-vl-cloud-run-gpu-approved-snapshot-local-queue-contract'
import { QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_RUNTIME_CONTRACT } from '../mock/mock-qwen2-5-vl-cloud-run-gpu-approved-snapshot-runtime-contract'
import {
  createQwen25VlPrivateInvokeConfigCandidate,
  QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_CONFIG_CONTRACT,
  validateQwen25VlPrivateInvokeConfigCandidate,
  type Qwen25VlPrivateInvokeConfigCandidate,
} from './qwen2-5-vl-cloud-run-gpu-private-invoke-config'

type JsonRecord = Record<string, unknown>

export type Qwen25VlPrivateInvokeEnvelopeStatus =
  | 'blocked_invalid_queue_contract'
  | 'blocked_invalid_private_invoke_config'
  | 'blocked_private_invocation_disabled'

export interface Qwen25VlPrivateInvokeEnvelope {
  method: 'POST'
  path: '/'
  contentType: 'application/json'
  bodyJson: JsonRecord
  bodyByteLength: number
  maxBodyBytes: number
  schemaVersion: string
  approvedPlanSnapshotId: string
  jobId: string
  idempotencyKey: string
  authHeaderRequiredForFutureRuntime: true
  authHeaderPresentNow: false
  serviceUrlResolvedNow: false
  audienceResolvedNow: false
}

export type Qwen25VlPrivateInvokeEnvelopeRuntimeFlags = {
  [Key in keyof typeof BASE_RUNTIME_FLAGS]: boolean
}

export interface Qwen25VlPrivateInvokeEnvelopeResult {
  ok: false
  status: Qwen25VlPrivateInvokeEnvelopeStatus
  decision: 'qwen2_5_vl_7b_cloud_run_gpu_private_invoke_envelope_contract_defined_no_invocation'
  queueContractValidated: boolean
  configContractValidated: boolean
  envelopeAcceptedForFutureTransport: boolean
  invocationAllowedNow: false
  queueIssues: Qwen25VlLocalQueueValidationIssue[]
  configIssues: string[]
  envelope?: Qwen25VlPrivateInvokeEnvelope
  message: string
  runtimeFlags: Qwen25VlPrivateInvokeEnvelopeRuntimeFlags
  warnings: string[]
}

export interface BuildQwen25VlPrivateInvokeEnvelopeInput {
  queueFixture?: JsonRecord
  configCandidate?: Qwen25VlPrivateInvokeConfigCandidate
}

const DECISION =
  'qwen2_5_vl_7b_cloud_run_gpu_private_invoke_envelope_contract_defined_no_invocation' as const

const BASE_RUNTIME_FLAGS = {
  envelopeContractDefined: true,
  validQueueFixtureAcceptedForEnvelope: false,
  validConfigCandidateAcceptedForEnvelope: false,
  envelopeAcceptedForFutureTransport: false,
  serviceUrlResolvedNow: false,
  audienceResolvedNow: false,
  authHeaderCreated: false,
  identityTokenFetched: false,
  cloudRunInvocationAttempted: false,
  serviceRuntimeRequestSent: false,
  dispatchSubmitted: false,
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

const ACCEPTED_ENVELOPE_FLAGS = {
  ...BASE_RUNTIME_FLAGS,
  validQueueFixtureAcceptedForEnvelope: true,
  validConfigCandidateAcceptedForEnvelope: true,
  envelopeAcceptedForFutureTransport: true,
} as const

export function buildQwen25VlPrivateInvokeEnvelope(
  input: BuildQwen25VlPrivateInvokeEnvelopeInput = {},
): Qwen25VlPrivateInvokeEnvelopeResult {
  const queueFixture = input.queueFixture ??
    QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT.validQueueFixture
  const configCandidate = input.configCandidate ?? createQwen25VlPrivateInvokeConfigCandidate()
  const queueValidation = validateQwen25VlLocalQueueFixture(queueFixture)
  const configValidation = validateQwen25VlPrivateInvokeConfigCandidate(configCandidate)

  if (!queueValidation.ok) {
    return {
      ok: false,
      status: 'blocked_invalid_queue_contract',
      decision: DECISION,
      queueContractValidated: false,
      configContractValidated: configValidation.ok,
      envelopeAcceptedForFutureTransport: false,
      invocationAllowedNow: false,
      queueIssues: queueValidation.issues,
      configIssues: configValidation.issues,
      message: 'Qwen private invocation envelope refused the queue fixture before transport shaping.',
      runtimeFlags: BASE_RUNTIME_FLAGS,
      warnings: [
        'No service URL was resolved.',
        'No identity token was fetched.',
        'No Cloud Run request was sent.',
      ],
    }
  }

  if (!configValidation.ok) {
    return {
      ok: false,
      status: 'blocked_invalid_private_invoke_config',
      decision: DECISION,
      queueContractValidated: true,
      configContractValidated: false,
      envelopeAcceptedForFutureTransport: false,
      invocationAllowedNow: false,
      queueIssues: [],
      configIssues: configValidation.issues,
      message: 'Qwen private invocation envelope refused the config candidate before transport shaping.',
      runtimeFlags: BASE_RUNTIME_FLAGS,
      warnings: [
        'No service URL was resolved.',
        'No identity token was fetched.',
        'No Cloud Run request was sent.',
      ],
    }
  }

  const payload = asJsonRecord(queueFixture.payloadJson)
  const envelope = createEnvelope(payload)

  return {
    ok: false,
    status: 'blocked_private_invocation_disabled',
    decision: DECISION,
    queueContractValidated: true,
    configContractValidated: true,
    envelopeAcceptedForFutureTransport: true,
    invocationAllowedNow: false,
    queueIssues: [],
    configIssues: [],
    envelope,
    message:
      'Qwen private invocation envelope is structurally ready for future backend transport, but invocation remains disabled.',
    runtimeFlags: ACCEPTED_ENVELOPE_FLAGS,
    warnings: [
      'The envelope does not contain a service URL.',
      'The envelope does not contain an auth header or token.',
      'No service runtime request was sent.',
    ],
  }
}

function createEnvelope(payload: JsonRecord): Qwen25VlPrivateInvokeEnvelope {
  return {
    method: 'POST',
    path: '/',
    contentType: 'application/json',
    bodyJson: payload,
    bodyByteLength: new TextEncoder().encode(JSON.stringify(payload)).length,
    maxBodyBytes:
      QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_CONFIG_CONTRACT.requiredCandidateDefaults.maxBodyBytes,
    schemaVersion:
      QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_RUNTIME_CONTRACT.contract.schemaVersion,
    approvedPlanSnapshotId: String(payload.approvedPlanSnapshotId),
    jobId: String(payload.jobId),
    idempotencyKey: String(payload.idempotencyKey),
    authHeaderRequiredForFutureRuntime: true,
    authHeaderPresentNow: false,
    serviceUrlResolvedNow: false,
    audienceResolvedNow: false,
  }
}

function asJsonRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as JsonRecord
    : {}
}

export const QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_ENVELOPE_CONTRACT = {
  decision: DECISION,
  method: 'POST',
  path: '/',
  contentType: 'application/json',
  maxBodyBytes:
    QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_CONFIG_CONTRACT.requiredCandidateDefaults.maxBodyBytes,
  derivesBodyFromApprovedSnapshotQueuePayload: true,
  serviceUrlStoredInRepo: false,
  serviceUrlResolvedNow: false,
  audienceResolvedNow: false,
  authHeaderCreated: false,
  identityTokenFetched: false,
  invokesCloudRun: false,
  sendsRequest: false,
  enablesInference: false,
  acceptedForFutureBackendTransportOnly: true,
} as const
