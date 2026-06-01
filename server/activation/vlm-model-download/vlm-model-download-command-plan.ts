import {
  VLM_MODEL_DOWNLOAD_EXPECTED_REVISION,
  VLM_MODEL_DOWNLOAD_GCS_PATH,
  VLM_MODEL_DOWNLOAD_MODEL_ID,
  VLM_MODEL_DOWNLOAD_TEMP_ROOT,
} from './vlm-model-download-config'
import { vlmModelDownloadExecutionDoesNotDo } from './vlm-model-download-policy'
import type { VlmModelDownloadExecutionCommandPlan } from './vlm-model-download-types'

export function buildVlmModelDownloadCommandPlan(): VlmModelDownloadExecutionCommandPlan[] {
  return [
    {
      commandId: 'phase39b_preflight_static_validation',
      phase: 'preflight',
      commandString: 'npm run smoke:activation-vlm-model-download && npm run activation:vlm-model-download:plan',
      textOnlyByDefault: true,
      requiresConfirmation: false,
      doesNotDo: [...vlmModelDownloadExecutionDoesNotDo],
      warnings: ['Safe validation does not download model files or mutate GCS.'],
    },
    {
      commandId: 'phase39b_hf_metadata_resolution',
      phase: 'metadata',
      commandString: `Resolve ${VLM_MODEL_DOWNLOAD_MODEL_ID} via Hugging Face model API and require revision ${VLM_MODEL_DOWNLOAD_EXPECTED_REVISION}.`,
      textOnlyByDefault: true,
      requiresConfirmation: false,
      doesNotDo: [...vlmModelDownloadExecutionDoesNotDo],
      warnings: ['Metadata refresh may use HF_TOKEN from the environment if the model ever becomes gated, but token values are never printed or persisted.'],
    },
    {
      commandId: 'phase39b_download_selected_assets',
      phase: 'download',
      commandString: 'Set the current-shell VLM model download confirmation, then run npm run activation:vlm-model-download -- --execute --keep-temp',
      textOnlyByDefault: true,
      requiresConfirmation: true,
      confirmationEnvVar: 'REEDITPRO_CONFIRM_VLM_MODEL_DOWNLOAD',
      doesNotDo: [...vlmModelDownloadExecutionDoesNotDo],
      warnings: [`Downloads only the pinned selected files into ${VLM_MODEL_DOWNLOAD_TEMP_ROOT}/<run-id>/downloads/.`],
    },
    {
      commandId: 'phase39b_compute_sha256',
      phase: 'checksum',
      commandString: 'Compute SHA256 while streaming each selected Hugging Face file and build aggregate manifest.',
      textOnlyByDefault: true,
      requiresConfirmation: false,
      doesNotDo: [...vlmModelDownloadExecutionDoesNotDo],
      warnings: ['Checksum manifests are safe metadata; model payloads are not committed.'],
    },
    {
      commandId: 'phase39b_private_gcs_upload',
      phase: 'upload',
      commandString: `With the current-shell private GCS upload confirmation set, upload selected files and JSON manifests to ${VLM_MODEL_DOWNLOAD_GCS_PATH}`,
      textOnlyByDefault: true,
      requiresConfirmation: true,
      confirmationEnvVar: 'REEDITPRO_CONFIRM_VLM_PRIVATE_GCS_UPLOAD',
      doesNotDo: [...vlmModelDownloadExecutionDoesNotDo],
      warnings: ['Uploads only verified selected assets and safe manifests to the approved private generated-assets prefix.'],
    },
    {
      commandId: 'phase39b_verify_private_gcs_objects',
      phase: 'verify',
      commandString: `gcloud storage objects describe ${VLM_MODEL_DOWNLOAD_GCS_PATH}<relative-path> --format=json`,
      textOnlyByDefault: true,
      requiresConfirmation: false,
      doesNotDo: [...vlmModelDownloadExecutionDoesNotDo],
      warnings: ['Verification records size, generation, metageneration, CRC32C, MD5 when available, and local SHA256 from the manifest.'],
    },
    {
      commandId: 'phase39b_cleanup_policy',
      phase: 'cleanup',
      commandString: 'Delete local temp staging unless --keep-temp is intentionally provided for review.',
      textOnlyByDefault: true,
      requiresConfirmation: false,
      doesNotDo: [...vlmModelDownloadExecutionDoesNotDo],
      warnings: ['No temp payloads, HF cache, or model files may be committed.'],
    },
  ]
}

export function buildVlmModelDownloadIamPlan(createdAt = new Date().toISOString()) {
  return {
    phase: '39B' as const,
    reportId: 'phase_39b_vlm_model_download_iam_plan',
    createdAt,
    project: 'reeditpro',
    region: 'us-central1',
    iamMutationAllowed: false,
    gcpInfrastructureMutationAllowed: false,
    requiredCurrentIamChanges: [] as string[],
    approvedPrivateUploadTarget: VLM_MODEL_DOWNLOAD_GCS_PATH,
    serviceAccountExpectations: [
      'Future Phase 39C runtime service account may require objectViewer access to the exact private model prefix only after Phase 39B passes.',
      'Phase 39B does not grant, revoke, create, or mutate IAM bindings.',
    ],
    blocked: [
      'No IAM changes in Phase 39B.',
      'No public bucket, ACL, signed URL, Cloud Run deploy, Docker push, or GPU job.',
    ],
  }
}
