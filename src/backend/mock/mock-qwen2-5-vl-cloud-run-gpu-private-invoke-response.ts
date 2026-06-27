import {
  classifyQwen25VlPrivateInvokeResponse,
  QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_RESPONSE_CONTRACT,
} from '../workers/qwen2-5-vl-cloud-run-gpu-private-invoke-response'
import { QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_ENVELOPE } from './mock-qwen2-5-vl-cloud-run-gpu-private-invoke-envelope'

const disabledRuntimeResponse = classifyQwen25VlPrivateInvokeResponse({
  httpStatus: 403,
  bodyJson: {
    ok: false,
    mode: 'qwen2_5_vl_cloud_run_gpu_source_spec_fail_closed',
    reason: 'qwen_inference_disabled_after_contract_check',
    contractSchemaVersion: 'qwen2_5_vl_cloud_run_gpu_runtime_request_v1',
    contractSatisfiedForFutureRuntime: true,
    modelInferenceEnabled: false,
    runtimeContractExecutesNow: false,
  },
})

const rejectedRuntimeContractResponse = classifyQwen25VlPrivateInvokeResponse({
  httpStatus: 403,
  bodyJson: {
    ok: false,
    mode: 'qwen2_5_vl_cloud_run_gpu_source_spec_fail_closed',
    reason: 'qwen_runtime_contract_rejected',
    contractSchemaVersion: 'qwen2_5_vl_cloud_run_gpu_runtime_request_v1',
    contractSatisfiedForFutureRuntime: false,
    contractRejectionReasons: ['missing_approvedPlanSnapshotId'],
    modelInferenceEnabled: false,
    runtimeContractExecutesNow: false,
  },
})

const requestTooLargeResponse = classifyQwen25VlPrivateInvokeResponse({
  httpStatus: 413,
  bodyJson: {
    ok: false,
    mode: 'qwen2_5_vl_cloud_run_gpu_source_spec_fail_closed',
    reason: 'request_too_large',
    maxRequestBytes: 65536,
  },
})

const authBlockedResponse = classifyQwen25VlPrivateInvokeResponse({
  transportBlocker: 'auth_session_requires_reauth',
})

const futureMetadataOnlyResponse = classifyQwen25VlPrivateInvokeResponse({
  httpStatus: 200,
  bodyJson: {
    ok: true,
    contractSchemaVersion: 'qwen2_5_vl_cloud_run_gpu_runtime_request_v1',
    outputKind: 'metadata_only_visual_understanding',
    generatedAssetCreated: false,
    publicArtifactCreated: false,
    signedUrlCreated: false,
    creditSpendCreated: false,
    findings: [
      {
        id: 'finding_mock_qwen_response_001',
        kind: 'visual_understanding_summary',
        privateSourceRef: 'private_media_asset_ref_mock_qwen_queue_001',
        confidence: 'mock_reference_only',
      },
    ],
  },
})

export const QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_RESPONSE = {
  workstream: 'AI_VIDEO_BROLL_GENERATION',
  toolId: 'qwen2_5_vl_7b_instruct',
  mode: 'cloud_run_gpu_private_invoke_response_contract',
  decision:
    'qwen2_5_vl_7b_cloud_run_gpu_private_invoke_response_contract_defined_no_runtime_mutation',
  upstreamEnvelopeDecision: QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_ENVELOPE.decision,
  responseContract: QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_RESPONSE_CONTRACT,
  classificationResults: {
    disabledRuntimeResponse,
    rejectedRuntimeContractResponse,
    requestTooLargeResponse,
    authBlockedResponse,
    futureMetadataOnlyResponse,
  },
  acceptedCurrentResponses: [
    'blocked_transport_auth',
    'blocked_transport_unavailable',
    'blocked_request_too_large',
    'blocked_invalid_json',
    'blocked_runtime_contract_rejected',
    'blocked_contract_valid_inference_disabled',
    'blocked_unexpected_runtime_response',
  ],
  futureResponseShape: {
    acceptedFutureStatus: 'accepted_future_metadata_output',
    outputKind: 'metadata_only_visual_understanding',
    generatedAssetCreated: false,
    publicArtifactCreated: false,
    signedUrlCreated: false,
    creditSpendCreated: false,
    persistsOutputNow: false,
    runtimeCanAdvanceNow: false,
  },
  blockedResponseBypasses: [
    'treating_403_inference_disabled_as_model_success',
    'persisting_output_without_approved_response_contract',
    'spending_credit_from_fail_closed_response',
    'retrying_without_idempotency_policy',
    'creating_generated_asset_from_metadata_response',
    'creating_public_artifact_from_private_visual_understanding',
  ],
  runtimeFlags: disabledRuntimeResponse.runtimeFlags,
  nextPrompt:
    'QWEN2_5_VL_STACK_TOOL_47-PRIVATE-INVOKE-REAUTH-VERIFY: rerun guarded private invoke auth verification after user gcloud reauth, no token/no inference',
} as const

export type Qwen25VlCloudRunGpuPrivateInvokeResponse =
  typeof QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_RESPONSE
