import type { ControlledRealVideoFutureArtifactSchema } from './controlled-real-video-ocr-safe-zone-types'

export function buildControlledRealVideoOcrSafeZoneFutureArtifactSchemas(): ControlledRealVideoFutureArtifactSchema[] {
  return [
    {
      artifactName: 'phase_37d_future_ocr_text_regions_schema.json',
      requiredForFutureExecution: true,
      description: 'Future controlled-real-video OCR text-region output. Phase 37D defines the shape only.',
      privacy: 'private_qa_artifact_only',
      schema: {
        phase: '37D',
        runId: 'phase37d-YYYYMMDDTHHMMSS',
        sampleId: 'phase37d-phase32-color-export-safe-zone-window-v1',
        sourceGcsUri: 'private gs:// URI only',
        frames: [
          {
            offsetSeconds: 'number',
            extractedFrameArtifact: 'private QA artifact ref',
            textRegions: [
              {
                regionId: 'string',
                text: 'string',
                confidence: 'number | undefined',
                polygon: 'Array<[number, number]>',
                center: '[number, number]',
                normalizedBounds: '{ x: number, y: number, width: number, height: number }',
              },
            ],
          },
        ],
        blockers: 'string[]',
        warnings: 'string[]',
      },
    },
    {
      artifactName: 'phase_37d_future_caption_safe_zone_schema.json',
      requiredForFutureExecution: true,
      description: 'Future caption safe-zone review shape for OCR-derived avoid regions.',
      privacy: 'private_qa_artifact_only',
      schema: {
        phase: '37D',
        runId: 'phase37d-YYYYMMDDTHHMMSS',
        sampleId: 'phase37d-phase32-color-export-safe-zone-window-v1',
        coordinateSpace: 'normalized',
        captionZones: [
          {
            zoneId: 'vertical_lower_caption_safe_zone',
            x: 'number',
            y: 'number',
            width: 'number',
            height: 'number',
            required: 'boolean',
          },
        ],
        ocrAvoidRegions: [
          {
            sourceFrameOffsetSeconds: 'number',
            textRegionId: 'string',
            reason: 'text overlaps planned caption safe zone or important visual text',
          },
        ],
      },
    },
    {
      artifactName: 'phase_37d_future_collision_report_schema.json',
      requiredForFutureExecution: true,
      description: 'Future OCR/caption collision report shape for controlled real-video OCR QA.',
      privacy: 'private_qa_artifact_only',
      schema: {
        phase: '37D',
        runId: 'phase37d-YYYYMMDDTHHMMSS',
        sampleId: 'phase37d-phase32-color-export-safe-zone-window-v1',
        collisions: [
          {
            collisionId: 'string',
            frameOffsetSeconds: 'number',
            textRegionId: 'string',
            captionZoneId: 'string',
            severity: 'passed | warning | blocked',
            recommendation: 'move_caption | simplify_caption | require_human_review | no_change',
          },
        ],
        qaStatus: 'passed | warning | blocked',
        blockers: 'string[]',
        warnings: 'string[]',
      },
    },
    {
      artifactName: 'phase_37d_future_private_artifact_manifest_schema.json',
      requiredForFutureExecution: true,
      description: 'Future private artifact manifest shape. This must never include public URLs or signed URL source-of-truth.',
      privacy: 'private_qa_artifact_only',
      schema: {
        phase: '37D',
        runId: 'phase37d-YYYYMMDDTHHMMSS',
        artifactPrefix: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase37d/controlled-real-video-ocr-safe-zone/<run-id>/',
        artifacts: [
          {
            artifactId: 'string',
            kind: 'metadata | frame_image | report',
            bucket: 'string',
            object: 'string',
            gcsUri: 'private gs:// URI',
            sha256: 'string | undefined',
            publicAccessEnabled: false,
            signedUrlSourceOfTruthUsed: false,
          },
        ],
      },
    },
  ]
}
