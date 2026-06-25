import type { ProductionToolId } from '../../tool-registry'

export type GpuPythonImportToolId =
  | ProductionToolId
  | 'torch_torchvision'
  | 'pytorch'
  | 'torchvision'
  | 'transformers'
  | 'ctranslate2'
  | 'paddlepaddle_gpu'

export interface GpuToolPythonImportCheckDefinition {
  toolId: GpuPythonImportToolId
  checkName: string
  packageName: string
  importName: string
  optional: boolean
  modelWeightRequired: boolean
  notes: string[]
}

export const GPU_TOOL_PYTHON_IMPORT_CHECKS: GpuToolPythonImportCheckDefinition[] = [
  {
    toolId: 'pytorch',
    checkName: 'python_import_torch',
    packageName: 'torch',
    importName: 'torch',
    optional: false,
    modelWeightRequired: false,
    notes: ['Foundation GPU tensor runtime check; import only, no CUDA execution or inference.'],
  },
  {
    toolId: 'torchvision',
    checkName: 'python_import_torchvision',
    packageName: 'torchvision',
    importName: 'torchvision',
    optional: false,
    modelWeightRequired: false,
    notes: ['Foundation vision package check; import only.'],
  },
  {
    toolId: 'transformers',
    checkName: 'python_import_transformers',
    packageName: 'transformers',
    importName: 'transformers',
    optional: false,
    modelWeightRequired: false,
    notes: ['AI/model runtime foundation import only; no model loading, tokenizers, or provider calls.'],
  },
  {
    toolId: 'ctranslate2',
    checkName: 'python_import_ctranslate2',
    packageName: 'ctranslate2',
    importName: 'ctranslate2',
    optional: false,
    modelWeightRequired: false,
    notes: ['faster-whisper runtime dependency; import only, no model loading.'],
  },
  {
    toolId: 'faster_whisper',
    checkName: 'python_import_faster_whisper',
    packageName: 'faster-whisper',
    importName: 'faster_whisper',
    optional: false,
    modelWeightRequired: true,
    notes: ['Transcription package import only; model manifest approval is separate.'],
  },
  {
    toolId: 'kornia',
    checkName: 'python_import_kornia',
    packageName: 'kornia',
    importName: 'kornia',
    optional: false,
    modelWeightRequired: false,
    notes: ['GPU CV/mask refinement package import only.'],
  },
  {
    toolId: 'birefnet',
    checkName: 'python_import_transformers_for_birefnet',
    packageName: 'transformers + approved ZhengPeng7/BiRefNet snapshot',
    importName: 'transformers',
    optional: false,
    modelWeightRequired: true,
    notes: [
      'BiRefNet uses the Transformers model-loader path; import check must not call from_pretrained or fetch weights.',
    ],
  },
  {
    toolId: 'sam2',
    checkName: 'python_import_sam2',
    packageName: 'SAM-2 pinned source package',
    importName: 'sam2',
    optional: false,
    modelWeightRequired: true,
    notes: ['SAM2 package import only; no checkpoint load, mask prediction, CUDA execution, or media processing.'],
  },
  {
    toolId: 'transparent_background',
    checkName: 'python_import_transparent_background',
    packageName: 'transparent-background',
    importName: 'transparent_background',
    optional: false,
    modelWeightRequired: true,
    notes: ['Background-removal package import only; no model cache fetch, inference, or media processing.'],
  },
  {
    toolId: 'rembg',
    checkName: 'python_import_rembg',
    packageName: 'rembg[gpu]',
    importName: 'rembg',
    optional: false,
    modelWeightRequired: true,
    notes: ['Rembg package import only; no ONNX model download, session creation, or image processing.'],
  },
  {
    toolId: 'real_esrgan',
    checkName: 'python_import_realesrgan',
    packageName: 'realesrgan',
    importName: 'realesrgan',
    optional: false,
    modelWeightRequired: true,
    notes: ['Real-ESRGAN package import only; no model construction, weight loading, or upscaling.'],
  },
  {
    toolId: 'opencv',
    checkName: 'python_import_cv2_gpu_worker',
    packageName: 'opencv-python-headless',
    importName: 'cv2',
    optional: false,
    modelWeightRequired: false,
    notes: ['GPU worker still uses headless OpenCV for safe image/frame operations.'],
  },
  {
    toolId: 'deepfilternet',
    checkName: 'python_import_deepfilternet',
    packageName: 'deepfilternet',
    importName: 'df',
    optional: false,
    modelWeightRequired: true,
    notes: ['Audio AI package import only; do not run cleanup or load model weights.'],
  },
  {
    toolId: 'demucs',
    checkName: 'python_import_demucs',
    packageName: 'demucs',
    importName: 'demucs',
    optional: false,
    modelWeightRequired: true,
    notes: ['Stem separation package import only; no separation execution in M11.'],
  },
  {
    toolId: 'paddleocr',
    checkName: 'python_import_paddleocr_optional',
    packageName: 'paddleocr',
    importName: 'paddleocr',
    optional: true,
    modelWeightRequired: true,
    notes: ['Optional/planned GPU OCR package; model review required before production.'],
  },
  {
    toolId: 'paddlepaddle_gpu',
    checkName: 'python_import_paddle_optional',
    packageName: 'paddlepaddle-gpu',
    importName: 'paddle',
    optional: true,
    modelWeightRequired: false,
    notes: ['Optional/planned PaddleOCR GPU runtime dependency.'],
  },
]

export const GPU_PENDING_SOURCE_INSTALL_REVIEW = [
  { toolId: 'film' as const, packageName: 'FILM', reason: 'Frame interpolation source path requires review before production image declaration.' },
]

export function listGpuToolPythonImportChecks(): GpuToolPythonImportCheckDefinition[] {
  return [...GPU_TOOL_PYTHON_IMPORT_CHECKS]
}
