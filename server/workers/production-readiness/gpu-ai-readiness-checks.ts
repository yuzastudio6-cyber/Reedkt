import { execFileSync } from 'node:child_process'
import type { ProductionReadinessStatus } from './production-tool-readiness-types'
import {
  GPU_PENDING_SOURCE_INSTALL_REVIEW,
  GPU_TOOL_PYTHON_IMPORT_CHECKS,
  type GpuToolPythonImportCheckDefinition,
} from './gpu-tool-python-import-checks'
import {
  listGpuModelWeightReadinessChecks,
  summarizeGpuModelWeightsForReadiness,
  type GpuModelWeightReadinessCheck,
} from './gpu-model-weight-checks'
import { buildGpuRuntimeEnvironmentChecks, type GpuRuntimeEnvironmentCheck } from './gpu-runtime-env-checks'
import { buildGpuToolReadinessReport, type GpuToolReadinessReport } from './gpu-tool-readiness-report'
import type { ProductionToolId } from '../../tool-registry'

export const M11_GPU_AI_TOOL_IDS: ProductionToolId[] = [
  'faster_whisper',
  'kornia',
  'birefnet',
  'sam2',
  'transparent_background',
  'rembg',
  'deepfilternet',
  'demucs',
  'real_esrgan',
  'film',
  'opencv',
  'paddleocr',
]

export const M11_GPU_MODEL_WEIGHT_TOOL_IDS: ProductionToolId[] = [
  'faster_whisper',
  'birefnet',
  'sam2',
  'transparent_background',
  'rembg',
  'deepfilternet',
  'demucs',
  'real_esrgan',
  'film',
  'paddleocr',
]

export type GpuAiReadinessCheckKind =
  | 'dry_run_import_declared'
  | 'python_import'
  | 'model_weight_manifest'
  | 'runtime_env'
  | 'source_install_review'

export interface GpuAiReadinessCheckResult {
  toolId: string
  checkKind: GpuAiReadinessCheckKind
  checkName: string
  status: ProductionReadinessStatus
  optional: boolean
  message: string
  detail?: string
  packageName?: string
  importName?: string
  checkedAt: string
}

export interface RunGpuAiReadinessOptions {
  dryRun?: boolean
  realImportCheckMode?: boolean
  strict?: boolean
  timeoutMs?: number
  maxBuffer?: number
}

export interface RunGpuAiReadinessResult {
  dryRun: boolean
  realImportCheckMode: boolean
  strict: boolean
  checkedAt: string
  importChecks: GpuAiReadinessCheckResult[]
  modelWeightChecks: GpuModelWeightReadinessCheck[]
  runtimeChecks: GpuRuntimeEnvironmentCheck[]
  report: GpuToolReadinessReport
  gpuToolIds: ProductionToolId[]
  modelWeightToolIds: ProductionToolId[]
}

function cleanDetail(value: string | Buffer | undefined): string {
  return String(value ?? '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 2)
    .join(' | ')
    .slice(0, 300)
}

function findPythonCommand(timeoutMs: number): string | undefined {
  const candidates = [
    process.env.REEDITPRO_GPU_READINESS_PYTHON_BIN,
    'python3',
    'python',
    'py',
  ].filter((candidate): candidate is string => Boolean(candidate))

  for (const candidate of candidates) {
    try {
      execFileSync(candidate, ['-c', 'import sys; print(sys.version_info[0])'], {
        encoding: 'utf8',
        timeout: timeoutMs,
        maxBuffer: 1024 * 64,
        stdio: ['ignore', 'pipe', 'pipe'],
      })
      return candidate
    } catch {
      // Try next candidate.
    }
  }

  return undefined
}

function dryRunImportResult(
  definition: GpuToolPythonImportCheckDefinition,
  checkedAt: string,
): GpuAiReadinessCheckResult {
  return {
    toolId: definition.toolId,
    checkKind: 'dry_run_import_declared',
    checkName: definition.checkName,
    status: 'not_checked',
    optional: definition.optional,
    message: 'Dry-run GPU readiness declares import checks without importing heavy packages.',
    packageName: definition.packageName,
    importName: definition.importName,
    checkedAt,
  }
}

function runPythonImportCheck(
  definition: GpuToolPythonImportCheckDefinition,
  pythonCommand: string | undefined,
  checkedAt: string,
  timeoutMs: number,
  maxBuffer: number,
): GpuAiReadinessCheckResult {
  if (!pythonCommand) {
    return {
      toolId: definition.toolId,
      checkKind: 'python_import',
      checkName: definition.checkName,
      status: definition.optional ? 'not_installed' : 'missing',
      optional: definition.optional,
      message: 'No Python command was available for optional GPU import readiness checks.',
      packageName: definition.packageName,
      importName: definition.importName,
      checkedAt,
    }
  }

  try {
    execFileSync(pythonCommand, [
      '-c',
      `import importlib; importlib.import_module(${JSON.stringify(definition.importName)}); print("ok")`,
    ], {
      encoding: 'utf8',
      timeout: timeoutMs,
      maxBuffer,
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    return {
      toolId: definition.toolId,
      checkKind: 'python_import',
      checkName: definition.checkName,
      status: 'passed',
      optional: definition.optional,
      message: `${definition.importName} import check passed without inference or model loading.`,
      packageName: definition.packageName,
      importName: definition.importName,
      checkedAt,
    }
  } catch (error) {
    const failed = error as { stderr?: string | Buffer, message?: string }
    return {
      toolId: definition.toolId,
      checkKind: 'python_import',
      checkName: definition.checkName,
      status: definition.optional ? 'not_installed' : 'missing',
      optional: definition.optional,
      message: `${definition.importName} import check did not pass.`,
      detail: cleanDetail(failed.stderr) || cleanDetail(failed.message),
      packageName: definition.packageName,
      importName: definition.importName,
      checkedAt,
    }
  }
}

function sourceInstallReviewResults(checkedAt: string): GpuAiReadinessCheckResult[] {
  return GPU_PENDING_SOURCE_INSTALL_REVIEW.map((item) => ({
    toolId: item.toolId,
    checkKind: 'source_install_review',
    checkName: `${item.toolId}_pending_source_install_review`,
    status: 'pending_manual_review',
    optional: false,
    message: `${item.packageName} is pending source install review: ${item.reason}`,
    packageName: item.packageName,
    checkedAt,
  }))
}

export function runGpuAiReadinessChecks(
  options: RunGpuAiReadinessOptions = {},
): RunGpuAiReadinessResult {
  const realImportCheckMode = options.realImportCheckMode === true
  const dryRun = !realImportCheckMode || options.dryRun === true
  const strict = options.strict === true
  const timeoutMs = options.timeoutMs ?? 5000
  const maxBuffer = options.maxBuffer ?? 1024 * 1024
  const checkedAt = new Date().toISOString()
  const modelWeightChecks = listGpuModelWeightReadinessChecks()
  summarizeGpuModelWeightsForReadiness()

  const importChecks = realImportCheckMode && !dryRun
    ? [
        ...GPU_TOOL_PYTHON_IMPORT_CHECKS.map((definition) => runPythonImportCheck(
          definition,
          findPythonCommand(timeoutMs),
          checkedAt,
          timeoutMs,
          maxBuffer,
        )),
        ...sourceInstallReviewResults(checkedAt),
      ]
    : [
        ...GPU_TOOL_PYTHON_IMPORT_CHECKS.map((definition) => dryRunImportResult(definition, checkedAt)),
        ...sourceInstallReviewResults(checkedAt),
      ]

  const runtimeChecks = buildGpuRuntimeEnvironmentChecks()
  const report = buildGpuToolReadinessReport({
    dryRun,
    importChecks,
    modelWeightChecks,
    runtimeChecks,
    pendingSourceInstallReviewTools: GPU_PENDING_SOURCE_INSTALL_REVIEW.map((item) => item.toolId),
  })

  if (strict) {
    const blocking = [
      ...importChecks.filter((check) => !check.optional && (check.status === 'missing' || check.status === 'blocked')),
      ...runtimeChecks.filter((check) => check.status === 'blocked').map((check) => ({
        checkName: check.checkName,
      })),
    ]
    if (blocking.length > 0) {
      throw new Error(`Strict GPU readiness failed: ${blocking.map((check) => check.checkName).join(', ')}`)
    }
  }

  return {
    dryRun,
    realImportCheckMode,
    strict,
    checkedAt,
    importChecks,
    modelWeightChecks,
    runtimeChecks,
    report,
    gpuToolIds: [...M11_GPU_AI_TOOL_IDS],
    modelWeightToolIds: [...M11_GPU_MODEL_WEIGHT_TOOL_IDS],
  }
}
