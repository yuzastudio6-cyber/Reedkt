import { ocrRuntimeConfig } from './ocr-runtime-policy'
import type { OcrRuntimeIamPlan } from './ocr-runtime-types'

export function buildOcrRuntimeIamPlan(): OcrRuntimeIamPlan[] {
  const member = `serviceAccount:${ocrRuntimeConfig.serviceAccountEmail}`
  return [
    binding(
      'ocr-model-read',
      ocrRuntimeConfig.generatedAssetsBucket,
      'roles/storage.objectViewer',
      member,
      'phase37c_ocr_model_read',
      'model-weights/paddleocr/pp-ocrv5/paddle3.0.0-mobile-safe-zone-v1/',
      'Read only verified Phase 37B PP-OCRv5 model assets for generated OCR runtime verification',
    ),
    binding(
      'ocr-qa-create',
      ocrRuntimeConfig.qaBucket,
      'roles/storage.objectCreator',
      member,
      'phase37c_ocr_qa_create',
      `${ocrRuntimeConfig.qaArtifactPrefix}/`,
      'Create only Phase 37C generated OCR runtime QA artifacts',
    ),
  ]
}

function binding(
  bindingId: string,
  bucket: OcrRuntimeIamPlan['bucket'],
  role: OcrRuntimeIamPlan['role'],
  member: string,
  conditionTitle: string,
  prefix: string,
  description: string,
): OcrRuntimeIamPlan {
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
    commandString: `gcloud storage buckets add-iam-policy-binding gs://${bucket} --member=${member} --role=${role} --condition=title=${conditionTitle},expression='${conditionExpression}',description='${description}'`,
  }
}
