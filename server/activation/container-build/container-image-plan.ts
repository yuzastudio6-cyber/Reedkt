import {
  getGpuRequiredTools,
  getToolsWithModelWeights,
} from '../../tool-registry'
import type { ProductionToolId } from '../../tool-registry'
import {
  getContainerImageExpectation,
} from '../../workers/production-readiness'
import type { ContainerBuildImageId, ContainerImageBuildPlan } from './container-build-types'

export const containerBuildImageOrder: ContainerBuildImageId[] = [
  'api',
  'tool-readiness-worker',
  'cpu-worker',
  'qa-worker',
  'render-worker',
  'gpu-worker',
]

export const requiredContainerBuildEnvVars = [
  'GCP_PROJECT_ID',
  'GCP_ARTIFACT_REGION',
  'REEDITPRO_ARTIFACT_REPOSITORY',
  'REEDITPRO_IMAGE_TAG',
] as const

export const commonForbiddenContainerBuildBehaviors = [
  'No automatic Docker execution from Codex.',
  'No Docker push in Phase 20.',
  'No gcloud or deployment.',
  'No provider calls.',
  'No model weight downloads.',
  'No secrets or secret build args.',
  'No media processing or inference during build.',
  'No Revideo core dependency.',
]

const gpuAndModelTools = Array.from(new Set([
  ...getGpuRequiredTools().map((profile) => profile.toolId),
  ...getToolsWithModelWeights().map((profile) => profile.toolId),
])) as ProductionToolId[]

export const containerImageBuildPlans: ContainerImageBuildPlan[] = [
  imagePlan('api', 'api', 'api_service', 'reeditpro-api', 1, {
    buildRequiredForPhase21: true,
    buildRequiredForPhase24: true,
    forbiddenTools: [...gpuAndModelTools, 'ffmpeg', 'ffprobe', 'revideo'],
    notes: ['API image is backend service only and must not include heavy media, GPU, model-weight, or Revideo dependencies.'],
  }),
  imagePlan('tool-readiness-worker', 'tool-readiness-worker', 'tool_readiness_worker', 'reeditpro-tool-readiness-worker', 2, {
    buildRequiredForPhase21: true,
    buildRequiredForPhase24: false,
    notes: ['Tool-readiness image reports installed/missing/evaluation status and does not need model weights.'],
  }),
  imagePlan('cpu-worker', 'cpu-worker', 'cpu_analysis_worker', 'reeditpro-cpu-worker', 3, {
    buildRequiredForPhase21: true,
    buildRequiredForPhase24: true,
    forbiddenTools: [...gpuAndModelTools, 'revideo'],
    notes: ['CPU worker image supports deterministic analysis/timeline preparation and must not include GPU model packages.'],
  }),
  imagePlan('qa-worker', 'qa-worker', 'qa_worker', 'reeditpro-qa-worker', 4, {
    buildRequiredForPhase21: true,
    buildRequiredForPhase24: true,
    forbiddenTools: [...gpuAndModelTools, 'revideo'],
    notes: ['QA worker validates outputs; it should not include GPU model packages or creative execution paths.'],
  }),
  imagePlan('render-worker', 'render-worker', 'render_worker', 'reeditpro-render-worker', 5, {
    buildRequiredForPhase21: true,
    buildRequiredForPhase24: true,
    forbiddenTools: [...gpuAndModelTools, 'revideo'],
    notes: ['Render worker uses Hyperframe, Remotion, FFmpeg, libass, and OTIO. Revideo remains excluded.'],
  }),
  imagePlan('gpu-worker', 'gpu-worker', 'gpu_ai_worker', 'reeditpro-gpu-worker', 6, {
    buildRequiredForPhase21: false,
    buildRequiredForPhase24: false,
    buildRequiredForGpuPhase: true,
    optionalForNonGpuStaging: true,
    requiredForGpuPhase: true,
    heavyBuild: true,
    notes: [
      'GPU image is heavy and can be deferred until non-GPU staging is healthy.',
      'GPU target is L4 later; RTX PRO 6000 is not used by default.',
      'Model weight directories are placeholders only and downloads are forbidden during build.',
    ],
  }),
]

export function getContainerImageBuildPlan(imageId: ContainerBuildImageId): ContainerImageBuildPlan | undefined {
  return containerImageBuildPlans.find((plan) => plan.imageId === imageId)
}

export function requiredNonGpuPhase21ImageIds(): ContainerBuildImageId[] {
  return containerImageBuildPlans
    .filter((plan) => plan.buildRequiredForPhase21)
    .map((plan) => plan.imageId)
}

function imagePlan(
  imageId: ContainerBuildImageId,
  imagePathSegment: string,
  workerType: ContainerImageBuildPlan['workerType'],
  imageName: string,
  buildOrder: number,
  overrides: Partial<ContainerImageBuildPlan> = {},
): ContainerImageBuildPlan {
  const expectation = getContainerImageExpectation(workerType === 'api_service' ? 'api' : imageRoleForWorker(workerType))
  const dockerfilePath = `docker/prod/${imagePathSegment}/Dockerfile`
  const expectedTools = overrides.expectedTools ?? expectation?.expectedToolIds ?? []
  const forbiddenTools = Array.from(new Set([...(expectation?.forbiddenToolIds ?? []), ...(overrides.forbiddenTools ?? []), 'revideo'])) as ProductionToolId[]

  return {
    imageId,
    displayName: imageName,
    workerType,
    dockerfilePath,
    contextPath: '.',
    requiredBuildArgs: [],
    requiredEnvVars: [...requiredContainerBuildEnvVars],
    expectedImageNameTemplate: `${imageName}:\${REEDITPRO_IMAGE_TAG}`,
    expectedArtifactRegistryPathTemplate: `\${GCP_ARTIFACT_REGION}-docker.pkg.dev/\${GCP_PROJECT_ID}/\${REEDITPRO_ARTIFACT_REPOSITORY}/${imageName}:\${REEDITPRO_IMAGE_TAG}`,
    buildOrder,
    buildRequiredForPhase21: overrides.buildRequiredForPhase21 ?? true,
    buildRequiredForPhase24: overrides.buildRequiredForPhase24 ?? false,
    buildRequiredForGpuPhase: overrides.buildRequiredForGpuPhase ?? false,
    optionalForNonGpuStaging: overrides.optionalForNonGpuStaging ?? false,
    requiredForGpuPhase: overrides.requiredForGpuPhase ?? false,
    heavyBuild: overrides.heavyBuild ?? false,
    expectedTools,
    forbiddenTools,
    forbiddenBehaviors: commonForbiddenContainerBuildBehaviors,
    modelDownloadsAllowed: false,
    secretsAllowed: false,
    revideoAllowed: false,
    notes: overrides.notes ?? expectation?.notes ?? [],
  }
}

function imageRoleForWorker(workerType: ContainerImageBuildPlan['workerType']) {
  if (workerType === 'cpu_analysis_worker') return 'cpu_worker'
  if (workerType === 'qa_worker') return 'qa_worker'
  if (workerType === 'render_worker') return 'render_worker'
  if (workerType === 'gpu_ai_worker') return 'gpu_worker'
  return 'tool_readiness_worker'
}
