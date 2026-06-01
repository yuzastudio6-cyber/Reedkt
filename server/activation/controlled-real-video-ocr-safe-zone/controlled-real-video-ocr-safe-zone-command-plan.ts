import { getSelectedControlledRealVideoOcrSafeZoneSample } from './controlled-real-video-chain-registry'
import {
  controlledRealVideoOcrSafeZoneConfig,
  controlledRealVideoOcrSafeZoneDoesNotDo,
  phase37DControlledRealVideoOcrSafeZoneArtifactPrefix,
} from './controlled-real-video-ocr-safe-zone-policy'
import type { ControlledRealVideoOcrSafeZoneCommandPlan } from './controlled-real-video-ocr-safe-zone-types'

export function buildControlledRealVideoOcrSafeZoneCommandPlans(input: { runId?: string } = {}): ControlledRealVideoOcrSafeZoneCommandPlan[] {
  const runId = input.runId ?? 'phase37d-YYYYMMDDTHHMMSS'
  const sample = getSelectedControlledRealVideoOcrSafeZoneSample()
  const artifactPrefix = `gs://${controlledRealVideoOcrSafeZoneConfig.qaBucket}/${phase37DControlledRealVideoOcrSafeZoneArtifactPrefix(runId)}/`
  const reportDir = `${controlledRealVideoOcrSafeZoneConfig.localTempRoot}/${runId}/reports`

  return [
    {
      commandId: 'controlled_real_video_ocr_safe_zone_preflight',
      phase: 'preflight',
      commandString: [
        'gcloud auth list --filter=status:ACTIVE --format=value(account)',
        'gcloud config get-value project',
        'gcloud projects describe reeditpro --format=value(projectId)',
        `gcloud storage buckets describe gs://${controlledRealVideoOcrSafeZoneConfig.finalExportsBucket} --format=json`,
        `gcloud storage buckets describe gs://${controlledRealVideoOcrSafeZoneConfig.qaBucket} --format=json`,
        `gcloud storage objects describe ${sample.sourceGcsUri} --format=json`,
      ].join(' && '),
      requiresConfirmation: false,
      textOnlyByDefault: true,
      doesNotDo: controlledRealVideoOcrSafeZoneDoesNotDo,
      warnings: ['Read-only metadata validation only; does not copy, download, extract, OCR, upload, or mutate GCP/IAM.'],
    },
    {
      commandId: 'controlled_real_video_ocr_safe_zone_chain_validation',
      phase: 'chain-validation',
      commandString: 'npm run activation:controlled-real-video-ocr-safe-zone:report -- --json',
      requiresConfirmation: false,
      textOnlyByDefault: true,
      doesNotDo: controlledRealVideoOcrSafeZoneDoesNotDo,
      warnings: ['Validates repo-recorded Phase 28-32 controlled chain evidence and Phase 37B/37C OCR evidence only.'],
    },
    {
      commandId: 'controlled_real_video_ocr_safe_zone_sample_selection',
      phase: 'sample-selection',
      commandString: [
        `sample=${sample.sampleId}`,
        `source=${sample.sourceGcsUri}`,
        `window=${sample.plannedWindow.startSeconds}-${sample.plannedWindow.endSeconds}s`,
        `offsets=${sample.plannedFrameOffsetsSeconds.join(',')}`,
        'metadata_only=true',
      ].join(' '),
      requiresConfirmation: false,
      textOnlyByDefault: true,
      doesNotDo: controlledRealVideoOcrSafeZoneDoesNotDo,
      warnings: ['Defines one future bounded sample candidate only; no frames are extracted.'],
    },
    {
      commandId: 'controlled_real_video_ocr_safe_zone_schema_emit',
      phase: 'schema',
      commandString: `TEXT_ONLY emit planned JSON schemas under ${reportDir}`,
      requiresConfirmation: false,
      textOnlyByDefault: true,
      doesNotDo: controlledRealVideoOcrSafeZoneDoesNotDo,
      warnings: ['Schema emission is represented in the report; no artifact files are uploaded by Phase 37D.'],
    },
    {
      commandId: 'controlled_real_video_ocr_safe_zone_future_execute',
      phase: 'future-execute',
      commandString: 'TEXT_ONLY future phase only: REEDITPRO_CONFIRM_CONTROLLED_REAL_VIDEO_OCR_EXECUTE=true and REEDITPRO_CONFIRM_CONTROLLED_REAL_VIDEO_FRAME_EXTRACTION=true would be required before any real-video OCR execution.',
      requiresConfirmation: true,
      confirmationEnvVar: 'REEDITPRO_CONFIRM_CONTROLLED_REAL_VIDEO_OCR_EXECUTE',
      textOnlyByDefault: true,
      doesNotDo: controlledRealVideoOcrSafeZoneDoesNotDo,
      warnings: ['Do not set this confirmation in Phase 37D; this gate rejects real-video OCR execution confirmations when present.'],
    },
    {
      commandId: 'controlled_real_video_ocr_safe_zone_future_upload',
      phase: 'future-upload',
      commandString: `TEXT_ONLY future phase only: private artifacts would be uploaded to ${artifactPrefix} only after REEDITPRO_CONFIRM_CONTROLLED_REAL_VIDEO_ARTIFACT_UPLOAD=true.`,
      requiresConfirmation: true,
      confirmationEnvVar: 'REEDITPRO_CONFIRM_CONTROLLED_REAL_VIDEO_ARTIFACT_UPLOAD',
      textOnlyByDefault: true,
      doesNotDo: controlledRealVideoOcrSafeZoneDoesNotDo,
      warnings: ['Do not upload artifacts in Phase 37D; this gate defines the private prefix only.'],
    },
  ]
}
