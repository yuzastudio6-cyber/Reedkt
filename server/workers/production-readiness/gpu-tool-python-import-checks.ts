import type {
  ProductionToolId,
  RunnerOnlyFoundationId,
} from '../../tool-registry'

export type GpuPythonImportToolId =
  | ProductionToolId
  | RunnerOnlyFoundationId
  | 'pytorch'
  | 'torchvision'

export interface GpuToolPythonImportCheckDefinition {
  toolId: GpuPythonImportToolId
  checkName: string
  packageName: string
  importName: string
  optional: boolean
  modelWeightRequired: boolean
  notes: string[]
}

export interface GpuPendingSourceInstallReview {
  toolId: ProductionToolId
  packageName: string
  reason: string
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
    toolId: 'torch_torchvision',
    checkName: 'python_import_torch_canonical',
    packageName: 'torch',
    importName: 'torch',
    optional: false,
    modelWeightRequired: true,
    notes: ['Runner foundation only; import readiness does not create a production tool identity.'],
  },
  {
    toolId: 'torch_torchvision',
    checkName: 'python_import_torchvision_canonical',
    packageName: 'torchvision',
    importName: 'torchvision',
    optional: false,
    modelWeightRequired: true,
    notes: ['Runner foundation only; import readiness does not create a production tool identity.'],
  },
  {
    toolId: 'transformers',
    checkName: 'python_import_transformers_canonical',
    packageName: 'transformers',
    importName: 'transformers',
    optional: false,
    modelWeightRequired: true,
    notes: ['Runner foundation only; import readiness does not create a production tool identity or authorize a model download.'],
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
    toolId: 'rembg',
    checkName: 'python_import_rembg',
    packageName: 'rembg',
    importName: 'rembg',
    optional: false,
    modelWeightRequired: true,
    notes: ['Canonical still-image matting adapter import only; model loading remains separately gated.'],
  },
]

export const GPU_PENDING_SOURCE_INSTALL_REVIEW:
GpuPendingSourceInstallReview[] = []

export function listGpuToolPythonImportChecks(): GpuToolPythonImportCheckDefinition[] {
  return [...GPU_TOOL_PYTHON_IMPORT_CHECKS]
}
