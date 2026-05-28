import {
  containerBuildImageOrder,
  getContainerImageBuildPlan,
} from '../container-build'
import type {
  ContainerReadinessExpectedTool,
  ContainerReadinessImageExpectation,
  ContainerReadinessImageId,
  ContainerReadinessStatus,
  ContainerReadinessToolId,
} from './container-readiness-types'

export const containerReadinessImageOrder: ContainerReadinessImageId[] = [...containerBuildImageOrder]

export const containerReadinessImageEnvVars: Record<ContainerReadinessImageId, string> = {
  api: 'REEDITPRO_API_IMAGE',
  'tool-readiness-worker': 'REEDITPRO_TOOL_READINESS_IMAGE',
  'cpu-worker': 'REEDITPRO_CPU_WORKER_IMAGE',
  'qa-worker': 'REEDITPRO_QA_WORKER_IMAGE',
  'render-worker': 'REEDITPRO_RENDER_WORKER_IMAGE',
  'gpu-worker': 'REEDITPRO_GPU_WORKER_IMAGE',
}

export const containerReadinessProductionRoleByImageId: Record<ContainerReadinessImageId, string> = {
  api: 'api',
  'tool-readiness-worker': 'tool_readiness_worker',
  'cpu-worker': 'cpu_worker',
  'qa-worker': 'qa_worker',
  'render-worker': 'render_worker',
  'gpu-worker': 'gpu_worker',
}

const forbiddenGpuAndModelTools = [
  'cuda',
  'torch',
  'torchvision',
  'faster-whisper',
  'ctranslate2',
  'birefnet',
  'sam2',
  'real-esrgan',
  'film',
  'demucs',
  'deepfilternet',
  'model weights',
  'revideo',
]

export const requiredPhase23ImageIds: ContainerReadinessImageId[] = [
  'api',
  'tool-readiness-worker',
  'cpu-worker',
  'qa-worker',
  'render-worker',
]

export const containerReadinessExpectedToolsByImage: Record<ContainerReadinessImageId, ContainerReadinessExpectedTool[]> = {
  api: [
    tool('node-runtime', 'Node runtime', { aliases: ['node runtime', 'node --version', 'node version'] }),
    tool('server-build', 'Server build', { aliases: ['server build', 'dist-server', 'build:server'] }),
  ],
  'tool-readiness-worker': [
    tool('node-runtime', 'Node runtime', { aliases: ['node runtime', 'node --version', 'node version'] }),
    tool('python-runtime', 'Python runtime', { aliases: ['python runtime', 'python --version', 'python3 --version'] }),
    tool('shell-utilities', 'Shell utilities', { aliases: ['shell utilities', 'bash', 'sh check'] }),
    tool('readiness-scripts', 'Readiness scripts', { aliases: ['readiness scripts', 'prod:readiness:summary'] }),
  ],
  'cpu-worker': [
    tool('ffmpeg', 'FFmpeg', { aliases: ['ffmpeg'] }),
    tool('ffprobe', 'FFprobe', { aliases: ['ffprobe'] }),
    tool('python3', 'Python 3', { aliases: ['python3', 'python 3'] }),
    tool('pyav', 'PyAV', { aliases: ['pyav', 'av import'] }),
    tool('pyscenedetect', 'PySceneDetect', { aliases: ['pyscenedetect', 'scene detect'] }),
    tool('opencv-python-headless', 'opencv-python-headless', { aliases: ['opencv-python-headless', 'cv2', 'opencv'] }),
    tool('duckdb', 'DuckDB', { aliases: ['duckdb'] }),
    tool('polars', 'Polars', { aliases: ['polars'] }),
    tool('opentimelineio', 'OpenTimelineIO', { aliases: ['opentimelineio', 'otio'] }),
    tool('sharp-libvips', 'Sharp/libvips support', { aliases: ['sharp', 'libvips', 'vips'] }),
    optionalReviewTool('opencolorio', 'OpenColorIO', ['opencolorio', 'ocio']),
    optionalReviewTool('openimageio', 'OpenImageIO', ['openimageio', 'oiio']),
  ],
  'qa-worker': [
    tool('ffmpeg', 'FFmpeg', { aliases: ['ffmpeg'] }),
    tool('ffprobe', 'FFprobe', { aliases: ['ffprobe'] }),
    tool('opencv-python-headless', 'opencv-python-headless', { aliases: ['opencv-python-headless', 'cv2', 'opencv'] }),
    tool('sharp-libvips', 'Sharp/libvips support', { aliases: ['sharp', 'libvips', 'vips'] }),
    tool('python3', 'Python 3', { aliases: ['python3', 'python 3'] }),
    optionalReviewTool('opencolorio', 'OpenColorIO', ['opencolorio', 'ocio']),
    optionalReviewTool('openimageio', 'OpenImageIO', ['openimageio', 'oiio']),
  ],
  'render-worker': [
    tool('node-runtime', 'Node runtime', { aliases: ['node runtime', 'node --version', 'node version'] }),
    tool('remotion', 'Remotion package/build metadata', { aliases: ['remotion', '@remotion'] }),
    tool('ffmpeg', 'FFmpeg', { aliases: ['ffmpeg'] }),
    tool('ffprobe', 'FFprobe', { aliases: ['ffprobe'] }),
    manualReviewTool('libass', 'libass/subtitle support', ['libass', 'ass subtitle', 'subtitle support']),
    tool('sharp-libvips', 'Sharp/libvips support', { aliases: ['sharp', 'libvips', 'vips'] }),
  ],
  'gpu-worker': [
    gpuTool('cuda-gpu-base-policy', 'CUDA/GPU base policy', ['cuda', 'gpu base', 'nvidia l4']),
    gpuTool('python3', 'Python 3', ['python3', 'python 3']),
    sourceReviewGpuTool('torch-torchvision', 'torch/torchvision', ['torch', 'torchvision']),
    sourceReviewGpuTool('ctranslate2-faster-whisper', 'ctranslate2/faster-whisper', ['ctranslate2', 'faster-whisper', 'faster_whisper']),
    sourceReviewGpuTool('kornia', 'Kornia', ['kornia']),
    sourceReviewGpuTool('opencv', 'OpenCV', ['opencv', 'cv2']),
    sourceReviewGpuTool('deepfilternet-demucs', 'DeepFilterNet/Demucs', ['deepfilternet', 'demucs']),
    sourceReviewGpuTool('birefnet-sam2-real-esrgan-film', 'BiRefNet/SAM2/Real-ESRGAN/FILM', ['birefnet', 'sam2', 'real-esrgan', 'real_esrgan', 'film']),
    modelWeightTool('model-weight-directories', 'Model-weight directories only', ['model_weight', 'model weights', 'weights directory']),
  ],
}

export const containerReadinessImageExpectations: ContainerReadinessImageExpectation[] = containerReadinessImageOrder.map((imageId) => {
  const buildPlan = getContainerImageBuildPlan(imageId)
  const expectedTools = containerReadinessExpectedToolsByImage[imageId]
  const nonGpuForbidden = imageId === 'gpu-worker' ? ['revideo'] : forbiddenGpuAndModelTools

  return {
    imageId,
    displayName: buildPlan?.displayName ?? imageId,
    productionImageRole: containerReadinessProductionRoleByImageId[imageId],
    dockerfilePath: buildPlan?.dockerfilePath ?? `docker/prod/${imageId}/Dockerfile`,
    expectedTools,
    forbiddenTools: nonGpuForbidden,
    heavy: imageId === 'gpu-worker',
    optionalForNonGpuStaging: imageId === 'gpu-worker',
    requiredForGpuPhase: imageId === 'gpu-worker',
    productionBlockedUntilApprovals: true,
    notes: [
      ...(buildPlan?.notes ?? []),
      imageId === 'gpu-worker'
        ? 'GPU readiness is deferred for non-GPU staging and requires model/license approval later.'
        : 'Non-GPU image readiness is required before image push readiness.',
    ],
  }
})

export function getContainerReadinessExpectation(
  imageId: ContainerReadinessImageId,
): ContainerReadinessImageExpectation | undefined {
  return containerReadinessImageExpectations.find((expectation) => expectation.imageId === imageId)
}

export function getExpectedToolsForImage(imageId: ContainerReadinessImageId): ContainerReadinessExpectedTool[] {
  return [...containerReadinessExpectedToolsByImage[imageId]]
}

export function getAllExpectedReadinessTools(): ContainerReadinessExpectedTool[] {
  return containerReadinessImageOrder.flatMap((imageId) => getExpectedToolsForImage(imageId))
}

function tool(
  toolId: ContainerReadinessToolId,
  displayName: string,
  input: {
    aliases: string[]
    requiredForPhase23?: boolean
    requiredForGpuPhase?: boolean
    optionalForNonGpuStaging?: boolean
    manualReviewRequired?: boolean
    sourceInstallReviewRequired?: boolean
    modelWeightRelated?: boolean
    defaultStatusWhenMissing?: ContainerReadinessStatus
    notes?: string[]
  },
): ContainerReadinessExpectedTool {
  return {
    toolId,
    displayName,
    requiredForPhase23: input.requiredForPhase23 ?? true,
    requiredForGpuPhase: input.requiredForGpuPhase ?? false,
    optionalForNonGpuStaging: input.optionalForNonGpuStaging ?? false,
    manualReviewRequired: input.manualReviewRequired ?? false,
    sourceInstallReviewRequired: input.sourceInstallReviewRequired ?? false,
    modelWeightRelated: input.modelWeightRelated ?? false,
    defaultStatusWhenMissing: input.defaultStatusWhenMissing ?? 'missing',
    aliases: [toolId, displayName, ...input.aliases].map((alias) => alias.toLowerCase()),
    notes: input.notes ?? [],
  }
}

function optionalReviewTool(
  toolId: ContainerReadinessToolId,
  displayName: string,
  aliases: string[],
): ContainerReadinessExpectedTool {
  return tool(toolId, displayName, {
    aliases,
    requiredForPhase23: false,
    optionalForNonGpuStaging: true,
    manualReviewRequired: true,
    defaultStatusWhenMissing: 'pending_manual_review',
    notes: ['Optional for initial non-GPU staging and pending manual dependency/license review.'],
  })
}

function manualReviewTool(
  toolId: ContainerReadinessToolId,
  displayName: string,
  aliases: string[],
): ContainerReadinessExpectedTool {
  return tool(toolId, displayName, {
    aliases,
    manualReviewRequired: true,
    defaultStatusWhenMissing: 'pending_manual_review',
    notes: ['Pending manual verification is warning-only; failed support blocks render readiness.'],
  })
}

function gpuTool(
  toolId: ContainerReadinessToolId,
  displayName: string,
  aliases: string[],
): ContainerReadinessExpectedTool {
  return tool(toolId, displayName, {
    aliases,
    requiredForPhase23: false,
    requiredForGpuPhase: true,
    optionalForNonGpuStaging: true,
    defaultStatusWhenMissing: 'deferred',
    notes: ['GPU readiness is optional for non-GPU staging and required for later GPU/model phases.'],
  })
}

function sourceReviewGpuTool(
  toolId: ContainerReadinessToolId,
  displayName: string,
  aliases: string[],
): ContainerReadinessExpectedTool {
  return tool(toolId, displayName, {
    aliases,
    requiredForPhase23: false,
    requiredForGpuPhase: true,
    optionalForNonGpuStaging: true,
    sourceInstallReviewRequired: true,
    defaultStatusWhenMissing: 'source_install_review_required',
    notes: ['GPU package may need source-install and license review before GPU activation.'],
  })
}

function modelWeightTool(
  toolId: ContainerReadinessToolId,
  displayName: string,
  aliases: string[],
): ContainerReadinessExpectedTool {
  return tool(toolId, displayName, {
    aliases,
    requiredForPhase23: false,
    requiredForGpuPhase: true,
    optionalForNonGpuStaging: true,
    modelWeightRelated: true,
    defaultStatusWhenMissing: 'model_weight_blocked',
    notes: ['Readiness may check directories only; model downloads are forbidden until approval.'],
  })
}
