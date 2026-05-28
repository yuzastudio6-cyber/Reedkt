import type { MaskModelDownloadCommandPlan, MaskModelStoragePlan } from './mask-model-approval-types'

export const maskModelDownloadDoesNotDo = [
  'does not execute by default',
  'does not download model files in Phase 33A',
  'does not store model files in the repo',
  'does not print tokens',
  'does not call providers',
  'does not deploy or run GPU jobs',
  'does not process frames or video',
  'does not run masks or text-behind-subject',
  'does not create public buckets or signed URL source of truth',
  'does not unblock production, external beta, paid production, or broad real-user-media testing',
]

export function buildMaskModelDownloadCommandPlan(storagePlan: MaskModelStoragePlan): MaskModelDownloadCommandPlan[] {
  return [
    {
      commandId: 'future_download_birefnet_with_huggingface_cli',
      modelCandidateId: 'zhengpeng7_birefnet',
      commandString: [
        'REEDITPRO_CONFIRM_MASK_MODEL_WEIGHT_DOWNLOAD=true huggingface-cli download ZhengPeng7/BiRefNet',
        `--local-dir ${storagePlan.runtimeTempPath}`,
        '--local-dir-use-symlinks False',
      ].join(' '),
      executionMode: 'text_only',
      requiresFutureExecutionFlag: true,
      futureExecutionFlag: 'REEDITPRO_CONFIRM_MASK_MODEL_WEIGHT_DOWNLOAD',
      safeToRunNow: false,
      doesNotDo: [...maskModelDownloadDoesNotDo],
      warnings: [
        'Text-only future command. Do not run in Phase 33A.',
        `Future upload/sync target is ${storagePlan.stagingStoragePath}.`,
      ],
    },
    {
      commandId: 'future_download_birefnet_with_huggingface_hub',
      modelCandidateId: 'zhengpeng7_birefnet',
      commandString: [
        'REEDITPRO_CONFIRM_MASK_MODEL_WEIGHT_DOWNLOAD=true python -c',
        '"from huggingface_hub import snapshot_download;',
        `snapshot_download(repo_id='ZhengPeng7/BiRefNet', local_dir='${storagePlan.runtimeTempPath}')"` ,
      ].join(' '),
      executionMode: 'text_only',
      requiresFutureExecutionFlag: true,
      futureExecutionFlag: 'REEDITPRO_CONFIRM_MASK_MODEL_WEIGHT_DOWNLOAD',
      safeToRunNow: false,
      doesNotDo: [...maskModelDownloadDoesNotDo],
      warnings: [
        'Text-only future Python alternative. Do not run in Phase 33A.',
        'Future Phase 33B must record resolved revision, file checksums, aggregate checksum, and private GCS upload evidence.',
      ],
    },
  ]
}
