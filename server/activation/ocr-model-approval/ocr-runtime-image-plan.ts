import type { OcrRuntimeImagePlan } from './ocr-model-approval-types'

export function buildOcrRuntimeImagePlan(): OcrRuntimeImagePlan {
  return {
    imagePlanId: 'paddleocr_cpu_first_runtime_image_plan_v1',
    futurePhase: '37C',
    dockerfilePath: 'docker/prod/ocr-runtime/Dockerfile',
    requirementsPath: 'docker/prod/ocr-runtime/requirements.ocr.txt',
    runtimeBase: 'python_cpu_first',
    cpuFirst: true,
    gpuAllowedOnlyAfterLaterApproval: true,
    runtimeRequirements: [
      'Python runtime',
      'PaddlePaddle CPU runtime first unless later evidence requires GPU',
      'PaddleOCR package/runtime pinned to selected version',
      'OpenCV headless image support',
      'Pillow and numpy for generated fixtures and image metadata',
      'google-cloud-storage or equivalent private model copy path',
      'no provider calls',
      'no public access',
      'no runtime model download',
      'no Revideo',
    ],
    forbidsRuntimeModelDownload: true,
    providerAllowed: false,
    publicAccessAllowed: false,
    revideoAllowed: false,
  }
}
