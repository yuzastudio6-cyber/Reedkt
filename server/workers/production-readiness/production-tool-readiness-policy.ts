import {
  PRODUCTION_TOOL_IDS,
  getGpuRequiredTools,
  getProductionToolProfile,
  getToolsWithModelWeights,
} from '../../tool-registry'
import type { ProductionToolId } from '../../tool-registry'
import { productionToolReadinessSpecs } from './production-tool-readiness-specs'
import type {
  ProductionContainerImageRole,
  ProductionToolReadinessSpec,
} from './production-tool-readiness-types'

export interface ProductionContainerImageExpectation {
  imageRole: ProductionContainerImageRole
  imageName: string
  dockerfilePath: string
  expectedToolIds: ProductionToolId[]
  forbiddenToolIds: ProductionToolId[]
  notes: string[]
}

const apiForbiddenTools: ProductionToolId[] = [
  ...getGpuRequiredTools().map((profile) => profile.toolId),
  ...getToolsWithModelWeights().map((profile) => profile.toolId),
  'ffmpeg',
  'ffprobe',
  'revideo',
]

export const productionContainerImageExpectations: ProductionContainerImageExpectation[] = [
  {
    imageRole: 'api',
    imageName: 'reeditpro-api',
    dockerfilePath: 'docker/prod/api/Dockerfile',
    expectedToolIds: [],
    forbiddenToolIds: Array.from(new Set(apiForbiddenTools)),
    notes: [
      'API image is backend service only.',
      'It must not include FFmpeg, GPU tooling, model weights, or heavy media/AI execution dependencies.',
    ],
  },
  {
    imageRole: 'cpu_worker',
    imageName: 'reeditpro-cpu-worker',
    dockerfilePath: 'docker/prod/cpu-worker/Dockerfile',
    expectedToolIds: [
      'ffmpeg',
      'ffprobe',
      'pyav',
      'pyscenedetect',
      'opencv',
      'sharp',
      'duckdb',
      'polars',
      'opentimelineio',
      'paddleocr',
      'openimageio',
      'opencolorio',
    ],
    forbiddenToolIds: ['revideo'],
    notes: ['CPU worker image is for probe/proxy/analysis/timeline preparation, not AI model inference by default.'],
  },
  {
    imageRole: 'gpu_worker',
    imageName: 'reeditpro-gpu-worker',
    dockerfilePath: 'docker/prod/gpu-worker/Dockerfile',
    expectedToolIds: [
      'faster_whisper',
      'birefnet',
      'sam2',
      'kornia',
      'deepfilternet',
      'demucs',
      'real_esrgan',
      'film',
      'opencv',
      'paddleocr',
    ],
    forbiddenToolIds: ['revideo'],
    notes: ['GPU worker image targets Cloud Run Jobs with NVIDIA L4 first; model weights are placeholders only.'],
  },
  {
    imageRole: 'render_worker',
    imageName: 'reeditpro-render-worker',
    dockerfilePath: 'docker/prod/render-worker/Dockerfile',
    expectedToolIds: [
      'hyperframe',
      'remotion',
      'ffmpeg',
      'ffprobe',
      'libass',
      'sharp',
      'opentimelineio',
    ],
    forbiddenToolIds: ['revideo'],
    notes: ['Render image centers Remotion + FFmpeg + libass with Hyperframe/OTIO handoff boundaries.'],
  },
  {
    imageRole: 'qa_worker',
    imageName: 'reeditpro-qa-worker',
    dockerfilePath: 'docker/prod/qa-worker/Dockerfile',
    expectedToolIds: [
      'ffmpeg',
      'ffprobe',
      'opencv',
      'sharp',
      'openimageio',
      'opencolorio',
      'audioflux',
    ],
    forbiddenToolIds: ['revideo'],
    notes: ['QA worker validates outputs and quality gates; it does not make creative editing decisions.'],
  },
  {
    imageRole: 'tool_readiness_worker',
    imageName: 'reeditpro-tool-readiness-worker',
    dockerfilePath: 'docker/prod/tool-readiness-worker/Dockerfile',
    expectedToolIds: [...PRODUCTION_TOOL_IDS],
    forbiddenToolIds: [],
    notes: ['Tool readiness image reports installed/missing/future/evaluation status and does not need model weights.'],
  },
]

export function listProductionReadinessSpecs(): ProductionToolReadinessSpec[] {
  return [...productionToolReadinessSpecs]
}

export function getProductionReadinessSpec(toolId: ProductionToolId): ProductionToolReadinessSpec | undefined {
  return productionToolReadinessSpecs.find((spec) => spec.toolId === toolId)
}

export function getReadinessSpecsForImageRole(
  imageRole: ProductionContainerImageRole,
): ProductionToolReadinessSpec[] {
  return productionToolReadinessSpecs.filter((spec) => spec.imageRoles.includes(imageRole))
}

export function getContainerImageExpectation(
  imageRole: ProductionContainerImageRole,
): ProductionContainerImageExpectation | undefined {
  return productionContainerImageExpectations.find((expectation) => expectation.imageRole === imageRole)
}

export function assertProductionReadinessSpecsCoverRegistry(): void {
  const specIds = new Set(productionToolReadinessSpecs.map((spec) => spec.toolId))
  const missingSpecs = PRODUCTION_TOOL_IDS.filter((toolId) => !specIds.has(toolId))
  const unknownSpecs = productionToolReadinessSpecs
    .map((spec) => spec.toolId)
    .filter((toolId) => !PRODUCTION_TOOL_IDS.includes(toolId))

  if (missingSpecs.length > 0) {
    throw new Error(`Production readiness specs missing registry tools: ${missingSpecs.join(', ')}`)
  }

  if (unknownSpecs.length > 0) {
    throw new Error(`Production readiness specs reference unknown tools: ${unknownSpecs.join(', ')}`)
  }

  if (specIds.size !== productionToolReadinessSpecs.length) {
    throw new Error('Production readiness specs must be unique per production tool.')
  }
}

export function assertApiImageHasNoHeavyTools(): void {
  const apiExpectation = getContainerImageExpectation('api')

  if (!apiExpectation) {
    throw new Error('API image expectation is missing.')
  }

  const forbiddenInstalled = apiExpectation.expectedToolIds.filter((toolId) => apiExpectation.forbiddenToolIds.includes(toolId))

  if (forbiddenInstalled.length > 0) {
    throw new Error(`API image must not expect heavy production tools: ${forbiddenInstalled.join(', ')}`)
  }
}

export function assertGpuToolsStayOutOfApiImage(): void {
  const apiSpecs = getReadinessSpecsForImageRole('api')
  const gpuApiSpecs = apiSpecs.filter((spec) => spec.gpuRequired || spec.modelWeightChecks.length > 0)

  if (gpuApiSpecs.length > 0) {
    throw new Error(`GPU/model-weight tools cannot be assigned to API image: ${gpuApiSpecs.map((spec) => spec.toolId).join(', ')}`)
  }
}

export function assertRevideoReadinessBlocked(): void {
  const revideo = getProductionReadinessSpec('revideo')
  const profile = getProductionToolProfile('revideo')

  if (!revideo || !profile) {
    throw new Error('Revideo profile/readiness spec is missing.')
  }

  if (!revideo.evaluationOnly || revideo.readinessStatusWhenMissing !== 'evaluation_only') {
    throw new Error('Revideo readiness must be evaluation-only.')
  }

  if (revideo.blocksProductionIfMissing || revideo.productionRequired || profile.launchCore) {
    throw new Error('Revideo must be evaluation-only, static-readiness visible, execution-blocked, and not launch core.')
  }
}
