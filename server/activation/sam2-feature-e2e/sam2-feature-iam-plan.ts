import { sam2FeatureE2EConfig } from './sam2-feature-e2e-policy'
import type { Sam2FeatureIamPlan } from './sam2-feature-e2e-types'

export function buildSam2FeatureE2EIamPlan(): Sam2FeatureIamPlan[] {
  return [
    viewer('phase35f-gpu-source-media-viewer', sam2FeatureE2EConfig.sourceMediaBucket, 'activation-real-video/phase28/phase28-20260528T01552/', sam2FeatureE2EConfig.gpuServiceAccountEmail),
    viewer('phase35f-gpu-final-export-viewer', sam2FeatureE2EConfig.finalExportsBucket, 'activation-real-video/phase32/phase32-20260528T13330/', sam2FeatureE2EConfig.gpuServiceAccountEmail),
    viewer('phase35f-gpu-model-viewer', sam2FeatureE2EConfig.generatedAssetsBucket, 'model-weights/sam2/sam2.1-hiera-tiny/', sam2FeatureE2EConfig.gpuServiceAccountEmail),
    creator('phase35f-gpu-generated-assets-creator', sam2FeatureE2EConfig.generatedAssetsBucket, 'activation-real-video/phase35f/', sam2FeatureE2EConfig.gpuServiceAccountEmail),
    creator('phase35f-gpu-masks-creator', sam2FeatureE2EConfig.masksBucket, 'activation-real-video/phase35f/', sam2FeatureE2EConfig.gpuServiceAccountEmail),
    creator('phase35f-gpu-qa-creator', sam2FeatureE2EConfig.qaBucket, 'activation-real-video/phase35f/', sam2FeatureE2EConfig.gpuServiceAccountEmail),
    creator('phase35f-gpu-temp-creator', sam2FeatureE2EConfig.workerTempBucket, 'activation-real-video/phase35f/', sam2FeatureE2EConfig.gpuServiceAccountEmail),
    viewer('phase35f-render-generated-assets-viewer', sam2FeatureE2EConfig.generatedAssetsBucket, 'activation-real-video/phase35f/', sam2FeatureE2EConfig.renderServiceAccountEmail),
    viewer('phase35f-render-masks-viewer', sam2FeatureE2EConfig.masksBucket, 'activation-real-video/phase35f/', sam2FeatureE2EConfig.renderServiceAccountEmail),
    creator('phase35f-render-previews-creator', sam2FeatureE2EConfig.previewsBucket, 'activation-real-video/phase35f/', sam2FeatureE2EConfig.renderServiceAccountEmail),
    creator('phase35f-qa-artifacts-creator', sam2FeatureE2EConfig.qaBucket, 'activation-real-video/phase35f/', sam2FeatureE2EConfig.qaServiceAccountEmail),
  ]
}

function viewer(bindingId: string, bucket: string, prefix: string, serviceAccount: string): Sam2FeatureIamPlan {
  return binding(bindingId, bucket, prefix, serviceAccount, 'roles/storage.objectViewer')
}

function creator(bindingId: string, bucket: string, prefix: string, serviceAccount: string): Sam2FeatureIamPlan {
  return binding(bindingId, bucket, prefix, serviceAccount, 'roles/storage.objectCreator')
}

function binding(
  bindingId: string,
  bucket: string,
  prefix: string,
  serviceAccount: string,
  role: Sam2FeatureIamPlan['role'],
): Sam2FeatureIamPlan {
  const conditionTitle = `reeditpro_${bindingId.replaceAll('-', '_')}`
  const conditionExpression = `resource.name.startsWith("projects/_/buckets/${bucket}/objects/${prefix}")`
  const member = `serviceAccount:${serviceAccount}`
  const description = `Phase 35F prefix-scoped ${role} for ${prefix}`
  return {
    bindingId,
    bucket,
    role,
    member,
    conditionTitle,
    conditionExpression,
    description,
    commandString: `gcloud storage buckets add-iam-policy-binding gs://${bucket} --member=${member} --role=${role} --condition=title=${conditionTitle},expression=${conditionExpression},description=${description}`,
  }
}
