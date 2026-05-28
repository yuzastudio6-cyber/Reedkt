import { textBehindSubjectFrameConfig } from './text-behind-subject-frame-policy'
import type { TextBehindSubjectFrameCommandPlan } from './text-behind-subject-frame-types'

export function buildTextBehindSubjectFrameIamCommandPlans(): TextBehindSubjectFrameCommandPlan[] {
  const sourceRead = `resource.name.startsWith("projects/_/buckets/${textBehindSubjectFrameConfig.sourceBucket}/objects/${textBehindSubjectFrameConfig.phase33dPrefix}/")`
  const generatedCreate = `resource.name.startsWith("projects/_/buckets/${textBehindSubjectFrameConfig.generatedAssetsBucket}/objects/${textBehindSubjectFrameConfig.phase33ePrefix}/")`
  const previewsCreate = `resource.name.startsWith("projects/_/buckets/${textBehindSubjectFrameConfig.previewsBucket}/objects/${textBehindSubjectFrameConfig.phase33ePrefix}/")`
  const qaCreate = `resource.name.startsWith("projects/_/buckets/${textBehindSubjectFrameConfig.qaBucket}/objects/${textBehindSubjectFrameConfig.phase33ePrefix}/")`
  const tempCreate = `resource.name.startsWith("projects/_/buckets/${textBehindSubjectFrameConfig.workerTempBucket}/objects/${textBehindSubjectFrameConfig.phase33ePrefix}/")`
  return [
    {
      commandId: 'iam-render-read-phase33d-artifacts',
      phase: 'iam',
      commandString: `gcloud storage buckets add-iam-policy-binding gs://${textBehindSubjectFrameConfig.sourceBucket} --member=serviceAccount:${textBehindSubjectFrameConfig.renderServiceAccountEmail} --role=roles/storage.objectViewer --condition=title=phase33e_render_phase33d_read,expression='${sourceRead}',description='Read approved Phase 33D frame/mask/cutout objects only'`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      warnings: ['Do not grant bucket-wide objectViewer.'],
    },
    {
      commandId: 'iam-render-create-generated-assets',
      phase: 'iam',
      commandString: `gcloud storage buckets add-iam-policy-binding gs://${textBehindSubjectFrameConfig.generatedAssetsBucket} --member=serviceAccount:${textBehindSubjectFrameConfig.renderServiceAccountEmail} --role=roles/storage.objectCreator --condition=title=phase33e_render_generated_create,expression='${generatedCreate}',description='Create Phase 33E generated metadata only'`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      warnings: ['Do not grant objectAdmin or objectUser.'],
    },
    {
      commandId: 'iam-render-create-previews',
      phase: 'iam',
      commandString: `gcloud storage buckets add-iam-policy-binding gs://${textBehindSubjectFrameConfig.previewsBucket} --member=serviceAccount:${textBehindSubjectFrameConfig.renderServiceAccountEmail} --role=roles/storage.objectCreator --condition=title=phase33e_render_preview_create,expression='${previewsCreate}',description='Create Phase 33E private preview PNG only'`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      warnings: ['Preview artifacts remain private; no signed URL or public ACL.'],
    },
    {
      commandId: 'iam-render-create-qa',
      phase: 'iam',
      commandString: `gcloud storage buckets add-iam-policy-binding gs://${textBehindSubjectFrameConfig.qaBucket} --member=serviceAccount:${textBehindSubjectFrameConfig.renderServiceAccountEmail} --role=roles/storage.objectCreator --condition=title=phase33e_render_qa_create,expression='${qaCreate}',description='Create Phase 33E QA and report artifacts only'`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      warnings: ['QA/report artifacts remain private.'],
    },
    {
      commandId: 'iam-render-create-temp',
      phase: 'iam',
      commandString: `gcloud storage buckets add-iam-policy-binding gs://${textBehindSubjectFrameConfig.workerTempBucket} --member=serviceAccount:${textBehindSubjectFrameConfig.renderServiceAccountEmail} --role=roles/storage.objectCreator --condition=title=phase33e_render_temp_create,expression='${tempCreate}',description='Create Phase 33E worker-temp artifacts only if needed'`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      warnings: ['Temporary artifacts must remain under Phase 33E prefixes.'],
    },
  ]
}
