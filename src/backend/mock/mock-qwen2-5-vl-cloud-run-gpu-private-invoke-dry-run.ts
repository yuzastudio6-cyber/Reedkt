import {
  runQwen25VlPrivateInvokeDryRun,
  QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_DRY_RUN_CONTRACT,
} from '../workers/qwen2-5-vl-cloud-run-gpu-private-invoke-dry-run'
import { QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT } from './mock-qwen2-5-vl-cloud-run-gpu-approved-snapshot-local-queue-contract'
import { QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_ENVELOPE } from './mock-qwen2-5-vl-cloud-run-gpu-private-invoke-envelope'
import { QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_RESPONSE } from './mock-qwen2-5-vl-cloud-run-gpu-private-invoke-response'

const invalidQueueFixture = {
  ...QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT.validQueueFixture,
  approvedPlanSnapshotId: undefined,
}

const defaultAuthBlockedDryRun = runQwen25VlPrivateInvokeDryRun()
const invalidEnvelopeDryRun = runQwen25VlPrivateInvokeDryRun({
  queueFixture: invalidQueueFixture,
})
const futureMetadataResponseDryRun = runQwen25VlPrivateInvokeDryRun({
  simulatedResponse: {
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
          id: 'finding_mock_qwen_dry_run_001',
          kind: 'visual_understanding_summary',
          privateSourceRef: 'private_media_asset_ref_mock_qwen_queue_001',
          confidence: 'mock_reference_only',
        },
      ],
    },
  },
})

export const QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_DRY_RUN = {
  workstream: 'AI_VIDEO_BROLL_GENERATION',
  toolId: 'qwen2_5_vl_7b_instruct',
  mode: 'cloud_run_gpu_private_invoke_dry_run_coordinator',
  decision:
    'qwen2_5_vl_7b_cloud_run_gpu_private_invoke_dry_run_coordinator_defined_no_transport',
  upstreamEnvelopeDecision: QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_ENVELOPE.decision,
  upstreamResponseDecision: QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_RESPONSE.decision,
  dryRunContract: QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_DRY_RUN_CONTRACT,
  dryRunResults: {
    defaultAuthBlockedDryRun,
    invalidEnvelopeDryRun,
    futureMetadataResponseDryRun,
  },
  blockedDryRunBypasses: [
    'resolving_service_url_in_dry_run',
    'creating_auth_header_in_dry_run',
    'fetching_identity_token_in_dry_run',
    'sending_cloud_run_request_in_dry_run',
    'persisting_metadata_output_from_dry_run',
    'spending_credit_from_dry_run',
    'marking_worker_success_from_dry_run',
  ],
  runtimeFlags: defaultAuthBlockedDryRun.runtimeFlags,
  nextPrompt:
    'QWEN2_5_VL_STACK_TOOL_48-PRIVATE-INVOKE-DRY-RUN-ROUTE-CONTRACT: define backend route contract for Qwen dry-run invocation, no transport',
} as const

export type Qwen25VlCloudRunGpuPrivateInvokeDryRun =
  typeof QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_DRY_RUN
