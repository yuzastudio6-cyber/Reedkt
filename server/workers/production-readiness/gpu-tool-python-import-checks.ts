import type { ProductionToolId } from '../../tool-registry'

export type GpuPythonImportToolId =
  | ProductionToolId
  | 'pytorch'
  | 'torchvision'
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
    toolId: 'qwen_vl',
    checkName: 'python_import_qwen_vl_utils_optional',
    packageName: 'qwen-vl-utils',
    importName: 'qwen_vl_utils',
    optional: true,
    modelWeightRequired: true,
    notes: [
      'Optional/planned Qwen2.5-VL helper import only; do not import vLLM, load model weights, or run VLM inference in readiness checks.',
      'Exact Qwen2.5-VL model revision/checksum and private model path acceptance remain separate gates.',
    ],
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
  { toolId: 'birefnet' as const, packageName: 'BiRefNet', reason: 'No stable package path is declared in M11.' },
  { toolId: 'sam2' as const, packageName: 'SAM2', reason: 'Source/package selection requires review before install declaration.' },
  { toolId: 'real_esrgan' as const, packageName: 'Real-ESRGAN', reason: 'Package/source path requires review before production image declaration.' },
  { toolId: 'film' as const, packageName: 'FILM', reason: 'Frame interpolation source path requires review before production image declaration.' },
  { toolId: 'wan_video' as const, packageName: 'Wan/Wan2.1', reason: 'Primary AI B-roll source/runtime path requires approved source install, GPU cost, and model-weight review before import checks.' },
  { toolId: 'ltx_video' as const, packageName: 'LTX-Video', reason: 'Secondary AI B-roll source/runtime path requires version-specific license and source install review before import checks.' },
  { toolId: 'mochi_video' as const, packageName: 'Mochi 1', reason: 'Fallback/research source/runtime path requires owner approval before import checks.' },
  { toolId: 'hunyuan_video' as const, packageName: 'HunyuanVideo', reason: 'Premium-gated candidate is blocked pending legal, territory, commercial, GPU, and source install review.' },
]

export function listGpuToolPythonImportChecks(): GpuToolPythonImportCheckDefinition[] {
  return [...GPU_TOOL_PYTHON_IMPORT_CHECKS]
}
