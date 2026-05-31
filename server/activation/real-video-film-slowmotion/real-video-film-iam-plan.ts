import { realVideoFilmSlowmotionConfig } from './real-video-film-slowmotion-policy'
import type { RealVideoFilmSlowmotionIamPlan } from './real-video-film-slowmotion-types'

export function buildRealVideoFilmIamPlan(): RealVideoFilmSlowmotionIamPlan[] {
  const member = `serviceAccount:${realVideoFilmSlowmotionConfig.serviceAccountEmail}`
  return [
    binding('phase32-video-read', realVideoFilmSlowmotionConfig.finalExportsBucket, 'roles/storage.objectViewer', member, 'phase38d_phase32_video_read', 'activation-real-video/phase32/phase32-20260528T13330/', 'Read approved Phase 32 private export only'),
    binding('film-model-read', realVideoFilmSlowmotionConfig.generatedAssetsBucket, 'roles/storage.objectViewer', member, 'phase38d_film_model_read', 'model-weights/film/film-net-style-saved-model/', 'Read approved Phase 38B FILM SavedModel objects only'),
    binding('phase38d-plan-read', realVideoFilmSlowmotionConfig.generatedAssetsBucket, 'roles/storage.objectViewer', member, 'phase38d_film_plan_read', 'activation-film-runtime/phase38d/', 'Read approved Phase 38D plan snapshot only'),
    binding('phase38d-generated-create', realVideoFilmSlowmotionConfig.generatedAssetsBucket, 'roles/storage.objectCreator', member, 'phase38d_film_generated_create', 'activation-film-runtime/phase38d/', 'Create Phase 38D generated frame and metadata artifacts only'),
    binding('phase38d-preview-create', realVideoFilmSlowmotionConfig.previewsBucket, 'roles/storage.objectCreator', member, 'phase38d_film_preview_create', 'activation-film-runtime/phase38d/', 'Create Phase 38D private preview artifacts only'),
    binding('phase38d-qa-create', realVideoFilmSlowmotionConfig.qaBucket, 'roles/storage.objectCreator', member, 'phase38d_film_qa_create', 'activation-film-runtime/phase38d/', 'Create Phase 38D QA artifacts only'),
    binding('phase38d-worker-temp-create', realVideoFilmSlowmotionConfig.workerTempBucket, 'roles/storage.objectCreator', member, 'phase38d_film_worker_temp_create', 'activation-film-runtime/phase38d/', 'Create Phase 38D worker temp artifacts only'),
  ]
}

function binding(
  bindingId: string,
  bucket: string,
  role: RealVideoFilmSlowmotionIamPlan['role'],
  member: string,
  conditionTitle: string,
  prefix: string,
  description: string,
): RealVideoFilmSlowmotionIamPlan {
  const conditionExpression = `resource.name.startsWith("projects/_/buckets/${bucket}/objects/${prefix}")`
  return {
    bindingId,
    bucket,
    role,
    member,
    conditionTitle,
    conditionExpression,
    description,
    required: true,
    commandString: `gcloud storage buckets add-iam-policy-binding gs://${bucket} --member=${member} --role=${role} --condition=title=${conditionTitle},expression='${conditionExpression}',description='${description}'`,
  }
}
