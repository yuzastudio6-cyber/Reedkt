import type { AudioStackDemucsIamPlan } from './audio-stack-demucs-types'

export function buildAudioStackDemucsIamPlan(): AudioStackDemucsIamPlan[] {
  return [
    binding('phase36g-phase32-source-read-check', 'reeditpro-staging-reeditpro-final-exports', 'existing-read-check', 'active-gcloud-account', 'activation-real-video/phase32/phase32-20260528T13330/', 'Read check for the approved controlled Phase 32 source only.'),
    binding('phase36g-phase31-reference-read-check', 'reeditpro-staging-reeditpro-final-exports', 'existing-read-check', 'active-gcloud-account', 'activation-real-video/phase31/phase31-20260528T13060/', 'Read check for the approved Phase 31 audio reference only.'),
    binding('phase36g-demucs-model-viewer-deferred', 'reeditpro-staging-reeditpro-generated-assets', 'deferred-object-viewer', 'reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com', 'model-weights/audio-ai/demucs/htdemucs/', 'Deferred until Demucs model artifacts are legally approved and uploaded.'),
    binding('phase36g-demucs-output-creator-deferred', 'reeditpro-staging-reeditpro-qa-artifacts', 'deferred-object-creator', 'reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com', 'activation-audio-ai/phase36g/', 'Deferred because no Demucs runtime is approved in Phase 36G.'),
  ]
}

function binding(
  bindingId: string,
  bucket: string,
  role: AudioStackDemucsIamPlan['role'],
  member: AudioStackDemucsIamPlan['member'],
  prefix: string,
  description: string,
): AudioStackDemucsIamPlan {
  return {
    bindingId,
    bucket,
    role,
    member,
    conditionExpression: `resource.name.startsWith("projects/_/buckets/${bucket}/objects/${prefix}")`,
    description,
    mutationPlanned: false,
  }
}
