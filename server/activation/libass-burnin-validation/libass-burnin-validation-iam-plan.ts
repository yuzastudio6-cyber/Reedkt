import { libassBurninValidationConfig } from './libass-burnin-validation-policy'

export function buildLibassBurninIamPlan() {
  const member = `serviceAccount:${libassBurninValidationConfig.serviceAccountEmail}`
  return [
    binding('phase45a-source-read', libassBurninValidationConfig.finalExportsBucket, 'roles/storage.objectViewer', member, 'phase45a_libass_source_read', 'activation-real-video/phase32/phase32-20260528T13330/', 'Read approved Phase 32 private export only'),
    binding('phase45a-caption-read', libassBurninValidationConfig.transcriptsBucket, 'roles/storage.objectViewer', member, 'phase45a_libass_caption_read', 'activation-real-video/phase28/phase28-20260528T01552/captions/', 'Read approved Phase 28 caption sidecars only'),
    binding('phase45a-previews-create', libassBurninValidationConfig.previewsBucket, 'roles/storage.objectCreator', member, 'phase45a_libass_previews_create', 'activation-render-hardening/phase45a/', 'Create Phase 45A private preview artifacts only'),
    binding('phase45a-qa-create', libassBurninValidationConfig.qaBucket, 'roles/storage.objectCreator', member, 'phase45a_libass_qa_create', 'activation-render-hardening/phase45a/', 'Create Phase 45A QA artifacts only'),
  ]
}

function binding(bindingId: string, bucket: string, role: 'roles/storage.objectViewer' | 'roles/storage.objectCreator', member: string, conditionTitle: string, prefix: string, description: string) {
  const conditionExpression = `resource.name.startsWith("projects/_/buckets/${bucket}/objects/${prefix}")`
  return {
    bindingId,
    bucket,
    role,
    member,
    conditionTitle,
    conditionExpression,
    description,
    commandString: `gcloud storage buckets add-iam-policy-binding gs://${bucket} --member=${member} --role=${role} --condition=title=${conditionTitle},expression='${conditionExpression}',description='${description}'`,
  }
}
