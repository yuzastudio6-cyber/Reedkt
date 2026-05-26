import type { ProductionToolId } from '../../tool-registry'

export interface CoreToolPythonImportCheckDefinition {
  toolId: Extract<ProductionToolId,
    | 'pyav'
    | 'pyscenedetect'
    | 'opencv'
    | 'duckdb'
    | 'polars'
    | 'opentimelineio'
    | 'openimageio'
    | 'opencolorio'
  >
  checkName: string
  packageName: string
  importName: string
  optional: boolean
  notes: string[]
}

export const CORE_TOOL_PYTHON_IMPORT_CHECKS: CoreToolPythonImportCheckDefinition[] = [
  {
    toolId: 'pyav',
    checkName: 'python_import_av',
    packageName: 'av',
    importName: 'av',
    optional: false,
    notes: ['PyAV supports CPU media stream/frame inspection and FFmpeg handoff.'],
  },
  {
    toolId: 'pyscenedetect',
    checkName: 'python_import_scenedetect',
    packageName: 'scenedetect',
    importName: 'scenedetect',
    optional: false,
    notes: ['PySceneDetect supports future CPU scene boundary analysis.'],
  },
  {
    toolId: 'opencv',
    checkName: 'python_import_cv2',
    packageName: 'opencv-python-headless',
    importName: 'cv2',
    optional: false,
    notes: ['OpenCV headless supports CPU-safe visual and QA checks.'],
  },
  {
    toolId: 'duckdb',
    checkName: 'python_import_duckdb',
    packageName: 'duckdb',
    importName: 'duckdb',
    optional: false,
    notes: ['DuckDB supports local analytical summaries and structured report joins.'],
  },
  {
    toolId: 'polars',
    checkName: 'python_import_polars',
    packageName: 'polars',
    importName: 'polars',
    optional: false,
    notes: ['Polars supports deterministic tabular analysis in workers.'],
  },
  {
    toolId: 'opentimelineio',
    checkName: 'python_import_opentimelineio',
    packageName: 'opentimelineio',
    importName: 'opentimelineio',
    optional: false,
    notes: ['OpenTimelineIO supports timeline interchange validation and handoff.'],
  },
  {
    toolId: 'openimageio',
    checkName: 'python_import_openimageio',
    packageName: 'OpenImageIO',
    importName: 'OpenImageIO',
    optional: true,
    notes: ['Optional in M10; production package/build selection remains pending review.'],
  },
  {
    toolId: 'opencolorio',
    checkName: 'python_import_pyopencolorio',
    packageName: 'OpenColorIO',
    importName: 'PyOpenColorIO',
    optional: true,
    notes: ['Optional in M10; professional color execution is a later milestone.'],
  },
]

export function listCoreToolPythonImportChecks(): CoreToolPythonImportCheckDefinition[] {
  return [...CORE_TOOL_PYTHON_IMPORT_CHECKS]
}
