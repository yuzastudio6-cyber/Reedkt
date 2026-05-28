import type { ModelDownloadCommandPlan, ModelStoragePlan } from './model-approval-types'

export const modelDownloadDoesNotDo = [
  'does not execute by default',
  'does not download model files in Phase 26',
  'does not store model files in the repo',
  'does not print tokens',
  'does not call providers',
  'does not run GPU inference',
  'does not process real media',
  'does not create public buckets',
  'does not unblock production, external beta, or broad real-user-media testing',
]

export function buildModelDownloadCommandPlan(storagePlan: ModelStoragePlan): ModelDownloadCommandPlan[] {
  return [
    {
      commandId: 'future_download_faster_whisper_tiny_with_huggingface_cli',
      modelCandidateId: 'systran_faster_whisper_tiny',
      commandString: [
        'REEDITPRO_CONFIRM_MODEL_WEIGHT_DOWNLOAD=true huggingface-cli download Systran/faster-whisper-tiny',
        `--local-dir ${storagePlan.expectedRuntimePath}`,
        '--local-dir-use-symlinks False',
      ].join(' '),
      executionMode: 'text_only',
      requiresFutureExecutionFlag: true,
      futureExecutionFlag: 'REEDITPRO_CONFIRM_MODEL_WEIGHT_DOWNLOAD',
      safeToRunNow: false,
      doesNotDo: [...modelDownloadDoesNotDo],
      warnings: [
        'Text-only future command. Do not run in Phase 26.',
        'A future execution phase must record revision and checksums before Phase 28 execution.',
      ],
    },
    {
      commandId: 'future_download_faster_whisper_tiny_with_huggingface_hub',
      modelCandidateId: 'systran_faster_whisper_tiny',
      commandString: [
        'REEDITPRO_CONFIRM_MODEL_WEIGHT_DOWNLOAD=true python -c',
        '"from huggingface_hub import snapshot_download;',
        `snapshot_download(repo_id='Systran/faster-whisper-tiny', local_dir='${storagePlan.expectedRuntimePath}')"` ,
      ].join(' '),
      executionMode: 'text_only',
      requiresFutureExecutionFlag: true,
      futureExecutionFlag: 'REEDITPRO_CONFIRM_MODEL_WEIGHT_DOWNLOAD',
      safeToRunNow: false,
      doesNotDo: [...modelDownloadDoesNotDo],
      warnings: [
        'Text-only future Python alternative. Do not run in Phase 26.',
        `Future upload/sync target is ${storagePlan.stagingStoragePath}.`,
      ],
    },
  ]
}
