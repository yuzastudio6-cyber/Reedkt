import {
  buildQwen25VlPrivateInvokeEnvelope,
  QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_ENVELOPE_CONTRACT,
} from '../workers/qwen2-5-vl-cloud-run-gpu-private-invoke-envelope'
import { createQwen25VlPrivateInvokeConfigCandidate } from '../workers/qwen2-5-vl-cloud-run-gpu-private-invoke-config'
import { QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT } from './mock-qwen2-5-vl-cloud-run-gpu-approved-snapshot-local-queue-contract'
import { QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_CONFIG } from './mock-qwen2-5-vl-cloud-run-gpu-private-invoke-config'

const invalidQueueFixture = {
  ...QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT.validQueueFixture,
  approvedPlanSnapshotId: undefined,
}

const validEnvelopeResult = buildQwen25VlPrivateInvokeEnvelope()
const blockedInvalidQueueResult = buildQwen25VlPrivateInvokeEnvelope({
  queueFixture: invalidQueueFixture,
})
const blockedInvalidConfigResult = buildQwen25VlPrivateInvokeEnvelope({
  configCandidate: createQwen25VlPrivateInvokeConfigCandidate({
    invocationEnabledNow: true,
  }),
})

export const QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_ENVELOPE = {
  workstream: 'AI_VIDEO_BROLL_GENERATION',
  toolId: 'qwen2_5_vl_7b_instruct',
  mode: 'cloud_run_gpu_private_invoke_envelope_contract',
  decision:
    'qwen2_5_vl_7b_cloud_run_gpu_private_invoke_envelope_contract_defined_no_invocation',
  upstreamPrivateInvokeConfigDecision: QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_CONFIG.decision,
  upstreamQueueDecision:
    QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT.decision,
  envelopeContract: QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_ENVELOPE_CONTRACT,
  validationResults: {
    validEnvelopeResult,
    blockedInvalidQueueResult,
    blockedInvalidConfigResult,
  },
  requestShape: {
    method: 'POST',
    path: '/',
    contentType: 'application/json',
    bodyDerivedFromApprovedSnapshotQueuePayload: true,
    maxBodyBytes:
      QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_ENVELOPE_CONTRACT.maxBodyBytes,
    includesApprovedSnapshotReference: true,
    includesJobReference: true,
    includesIdempotencyKey: true,
    serviceUrlIncluded: false,
    authHeaderIncluded: false,
    identityTokenIncluded: false,
  },
  blockedEnvelopeBypasses: [
    'raw_prompt_payload',
    'invalid_approved_snapshot_queue_payload',
    'private_invoke_config_with_invocation_enabled',
    'stored_concrete_service_url',
    'stored_identity_token',
    'stored_auth_header',
    'frontend_transport_invocation',
    'cloud_run_request_before_gcloud_auth_reverified',
  ],
  currentBlocker:
    'local_gcloud_session_requires_interactive_reauthentication_before_private_invoke_verify',
  runtimeFlags: validEnvelopeResult.runtimeFlags,
  nextPrompt:
    'QWEN2_5_VL_STACK_TOOL_46-GCLOUD-REAUTH-USER: refresh local gcloud auth outside Codex, no token/no invocation',
} as const

export type Qwen25VlCloudRunGpuPrivateInvokeEnvelope =
  typeof QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_ENVELOPE
