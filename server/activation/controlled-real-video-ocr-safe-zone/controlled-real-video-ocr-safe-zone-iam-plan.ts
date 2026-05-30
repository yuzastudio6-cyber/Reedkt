import { controlledRealVideoOcrSafeZoneConfig } from './controlled-real-video-ocr-safe-zone-policy'
import type { ControlledRealVideoOcrSafeZoneIamPlan } from './controlled-real-video-ocr-safe-zone-types'

export function buildControlledRealVideoOcrSafeZoneIamPlan(): ControlledRealVideoOcrSafeZoneIamPlan[] {
  const member = `serviceAccount:${controlledRealVideoOcrSafeZoneConfig.serviceAccountEmail}`
  return [
    binding(
      'phase37d-controlled-source-read',
      controlledRealVideoOcrSafeZoneConfig.finalExportsBucket,
      'roles/storage.objectViewer',
      member,
      'phase37d_controlled_source_read',
      'activation-real-video/phase32/phase32-20260528T13330/',
      'Future read access for the single approved Phase 32 controlled private export only',
    ),
    binding(
      'phase37d-private-qa-create',
      controlledRealVideoOcrSafeZoneConfig.qaBucket,
      'roles/storage.objectCreator',
      member,
      'phase37d_private_qa_create',
      `${controlledRealVideoOcrSafeZoneConfig.qaArtifactPrefix}/`,
      'Future create access for Phase 37D private OCR safe-zone QA artifacts only',
    ),
  ]
}

function binding(
  bindingId: string,
  bucket: ControlledRealVideoOcrSafeZoneIamPlan['bucket'],
  role: ControlledRealVideoOcrSafeZoneIamPlan['role'],
  member: string,
  conditionTitle: string,
  prefix: string,
  description: string,
): ControlledRealVideoOcrSafeZoneIamPlan {
  const conditionExpression = `resource.name.startsWith("projects/_/buckets/${bucket}/objects/${prefix}")`
  return {
    bindingId,
    bucket,
    role,
    member,
    conditionTitle,
    conditionExpression,
    description,
    required: false,
    commandString: `TEXT_ONLY gcloud storage buckets add-iam-policy-binding gs://${bucket} --member=${member} --role=${role} --condition=title=${conditionTitle},expression='${conditionExpression}',description='${description}'`,
  }
}
