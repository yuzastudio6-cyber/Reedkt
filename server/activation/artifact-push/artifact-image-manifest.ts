import { containerImageBuildPlans } from '../container-build'
import type { ArtifactImageManifestEntry, ArtifactPushImageId } from './artifact-push-types'

export const artifactPushImageOrder: ArtifactPushImageId[] = [
  'api',
  'tool-readiness-worker',
  'cpu-worker',
  'qa-worker',
  'render-worker',
  'gpu-worker',
]

export const requiredNonGpuArtifactPushImageIds: ArtifactPushImageId[] = [
  'api',
  'tool-readiness-worker',
  'cpu-worker',
  'qa-worker',
  'render-worker',
]

const stagingTargetNames: Record<ArtifactPushImageId, string> = {
  api: 'reeditpro-staging-api',
  'tool-readiness-worker': 'reeditpro-staging-tool-readiness-worker',
  'cpu-worker': 'reeditpro-staging-cpu-worker',
  'qa-worker': 'reeditpro-staging-qa-worker',
  'render-worker': 'reeditpro-staging-render-worker',
  'gpu-worker': 'reeditpro-staging-gpu-worker',
}

export interface BuildArtifactImageManifestInput {
  project?: string
  artifactRegion?: string
  repository?: string
  imageTag?: string
}

export function buildArtifactImageManifest(input: BuildArtifactImageManifestInput): ArtifactImageManifestEntry[] {
  const project = input.project ?? '${GCP_PROJECT_ID}'
  const artifactRegion = input.artifactRegion ?? '${GCP_ARTIFACT_REGION}'
  const repository = input.repository ?? '${REEDITPRO_ARTIFACT_REPOSITORY}'
  const imageTag = input.imageTag ?? '${REEDITPRO_IMAGE_TAG}'

  return artifactPushImageOrder.map((imageId) => {
    const buildPlan = containerImageBuildPlans.find((plan) => plan.imageId === imageId)
    const sourceDisplayName = buildPlan?.displayName ?? imageId
    const targetImageName = stagingTargetNames[imageId]
    const deferred = imageId === 'gpu-worker'
    return {
      imageId,
      sourceImageNames: [
        `${sourceDisplayName}:${imageTag}`,
        `${artifactRegion}-docker.pkg.dev/reeditpro-staging-test/${repository}/${sourceDisplayName}:${imageTag}`,
      ],
      targetImageName,
      targetFullImageName: `${artifactRegion}-docker.pkg.dev/${project}/${repository}/${targetImageName}:${imageTag}`,
      imageTag,
      requiredForPhase24: !deferred,
      requiredForGpuPhase: deferred,
      deferred,
      notes: deferred
        ? ['GPU image was not built in Phase 20B and must not be pushed in Phase 23B.']
        : ['Non-GPU staging image required before Phase 24B deploy preparation.'],
    }
  })
}

export function getArtifactManifestEntry(
  imageId: ArtifactPushImageId,
  input: BuildArtifactImageManifestInput,
): ArtifactImageManifestEntry | undefined {
  return buildArtifactImageManifest(input).find((entry) => entry.imageId === imageId)
}
