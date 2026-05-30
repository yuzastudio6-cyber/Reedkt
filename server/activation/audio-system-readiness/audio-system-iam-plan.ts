import { audioSystemReadinessConfig } from './audio-system-readiness-policy'
import type { AudioSystemReadinessIamPlan } from './audio-system-readiness-types'

export function buildAudioSystemReadinessIamPlan(): AudioSystemReadinessIamPlan[] {
  return [
    readCheck('phase36f-source-final-exports-read', audioSystemReadinessConfig.finalExportsBucket, 'activation-real-video/phase32/phase32-20260528T13330/', 'Read the approved Phase 32 source and Phase 36E private review MP4.'),
    readCheck('phase36f-reference-final-exports-read', audioSystemReadinessConfig.finalExportsBucket, 'activation-real-video/phase31/phase31-20260528T13060/', 'Read the approved Phase 31 normalized-audio reference.'),
    readCheck('phase36f-generated-phase36e-read', audioSystemReadinessConfig.generatedAssetsBucket, 'activation-audio-ai/phase36e/phase36e-20260530T152327/', 'Read Phase 36E generated-assets artifacts.'),
    readCheck('phase36f-analysis-phase36e-read', audioSystemReadinessConfig.analysisBucket, 'activation-audio-ai/phase36e/phase36e-20260530T152327/', 'Read Phase 36E metrics artifacts.'),
    readCheck('phase36f-qa-phase36e-read', audioSystemReadinessConfig.qaBucket, 'activation-audio-ai/phase36e/phase36e-20260530T152327/', 'Read Phase 36E QA/report artifacts.'),
    createCheck('phase36f-qa-create', audioSystemReadinessConfig.qaBucket, 'activation-audio-ai/phase36f/', 'Create Phase 36F beta-scope and readiness report artifacts.'),
  ]
}

function readCheck(bindingId: string, bucket: string, prefix: string, description: string): AudioSystemReadinessIamPlan {
  return binding(bindingId, bucket, 'existing-read-check', prefix, description)
}

function createCheck(bindingId: string, bucket: string, prefix: string, description: string): AudioSystemReadinessIamPlan {
  return binding(bindingId, bucket, 'existing-create-check', prefix, description)
}

function binding(
  bindingId: string,
  bucket: string,
  role: AudioSystemReadinessIamPlan['role'],
  prefix: string,
  description: string,
): AudioSystemReadinessIamPlan {
  const expression = `resource.name.startsWith("projects/_/buckets/${bucket}/objects/${prefix}")`
  return {
    bindingId,
    bucket,
    role,
    member: 'active-gcloud-account',
    conditionExpression: expression,
    description,
    commandString: `NO_IAM_MUTATION_PLANNED; verify active gcloud account has ${role} for gs://${bucket}/${prefix}`,
    mutationPlanned: false,
  }
}
