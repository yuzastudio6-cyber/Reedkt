import { filmRuntimeConfig } from './film-runtime-policy'
import type { FilmRuntimeIamPlan } from './film-runtime-types'

export function buildFilmRuntimeIamPlan(): FilmRuntimeIamPlan[] {
  const member = `serviceAccount:${filmRuntimeConfig.serviceAccountEmail}`
  const outputPrefix = `${filmRuntimeConfig.reportObjectPrefix}/`
  return [
    binding('film-model-read', filmRuntimeConfig.generatedAssetsBucket, 'roles/storage.objectViewer', member, 'phase38c_film_model_read', 'model-weights/film/film-net-style-saved-model/', 'Read approved Phase 38B FILM SavedModel objects only'),
    binding('film-generated-create', filmRuntimeConfig.generatedAssetsBucket, 'roles/storage.objectCreator', member, 'phase38c_film_generated_create', outputPrefix, 'Create Phase 38C generated-frame runtime artifacts only'),
    binding('film-qa-create', filmRuntimeConfig.qaBucket, 'roles/storage.objectCreator', member, 'phase38c_film_qa_create', outputPrefix, 'Create Phase 38C QA artifacts only'),
    binding('film-worker-temp-create', filmRuntimeConfig.workerTempBucket, 'roles/storage.objectCreator', member, 'phase38c_film_worker_temp_create', outputPrefix, 'Create Phase 38C worker temp artifacts only'),
  ]
}

function binding(
  bindingId: string,
  bucket: string,
  role: FilmRuntimeIamPlan['role'],
  member: string,
  conditionTitle: string,
  prefix: string,
  description: string,
): FilmRuntimeIamPlan {
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
