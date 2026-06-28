import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, parse } from 'node:path'
import type { ProductionToolId } from '../../tool-registry'
import type { ProductionReadinessStatus } from './production-tool-readiness-types'
import { CORE_TOOL_COMMAND_CHECKS, type CoreToolCommandCheckDefinition } from './core-tool-command-checks'
import { CORE_TOOL_PYTHON_IMPORT_CHECKS, type CoreToolPythonImportCheckDefinition } from './core-tool-python-import-checks'
import { CORE_TOOL_NODE_PACKAGE_CHECKS, type CoreToolNodePackageCheckDefinition } from './core-tool-node-import-checks'
import { buildCoreToolReadinessReport, type CoreToolReadinessReport } from './core-tool-readiness-report'

export const M10_CORE_CPU_RENDER_TOOL_IDS: ProductionToolId[] = [
  'ffmpeg',
  'ffprobe',
  'pyav',
  'pyscenedetect',
  'opencv',
  'duckdb',
  'polars',
  'opentimelineio',
  'sharp',
  'remotion',
  'libass',
  'hyperframe',
  'openimageio',
  'opencolorio',
]

export const M10_EXCLUDED_GPU_MODEL_TOOL_IDS: ProductionToolId[] = [
  'faster_whisper',
  'whisper_cpp',
  'paddleocr',
  'mediapipe',
  'kornia',
  'birefnet',
  'sam2',
  'transparent_background',
  'rembg',
  'deepfilternet',
  'demucs',
  'real_esrgan',
  'film',
]

export type CoreToolReadinessCheckKind =
  | 'command_version'
  | 'python_import'
  | 'node_package_metadata'
  | 'manual_review'
  | 'registry_policy'

export interface CoreToolReadinessCheckResult {
  toolId: ProductionToolId | 'ffmpeg_lgpl_policy'
  checkKind: CoreToolReadinessCheckKind
  checkName: string
  status: ProductionReadinessStatus
  optional: boolean
  manualReviewRequired: boolean
  message: string
  detail?: string
  command?: string
  args?: string[]
  packageName?: string
  importName?: string
  checkedAt: string
}

export interface RunCoreCpuRenderReadinessOptions {
  realCheckMode?: boolean
  strict?: boolean
  timeoutMs?: number
  maxBuffer?: number
}

export interface RunCoreCpuRenderReadinessResult {
  realCheckMode: boolean
  strict: boolean
  checkedAt: string
  results: CoreToolReadinessCheckResult[]
  report: CoreToolReadinessReport
  coreToolIds: ProductionToolId[]
  excludedGpuModelToolIds: ProductionToolId[]
}

const requireFromReadiness = createRequire(import.meta.url)

function cleanDetail(value: string | Buffer | undefined): string {
  return String(value ?? '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 3)
    .join(' | ')
    .slice(0, 500)
}

function runCommandCheck(
  definition: CoreToolCommandCheckDefinition,
  checkedAt: string,
  options: Required<Pick<RunCoreCpuRenderReadinessOptions, 'timeoutMs' | 'maxBuffer'>>,
): CoreToolReadinessCheckResult {
  try {
    const output = execFileSync(definition.command, definition.args, {
      encoding: 'utf8',
      timeout: options.timeoutMs,
      maxBuffer: options.maxBuffer,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    const matches = definition.expectedPattern ? definition.expectedPattern.test(output) : true

    return {
      toolId: definition.toolId,
      checkKind: definition.versionOnly ? 'command_version' : 'command_version',
      checkName: definition.checkName,
      status: matches ? 'passed' : 'warning',
      optional: definition.optional,
      manualReviewRequired: definition.manualReviewRequired,
      message: matches
        ? `${definition.command} command check passed.`
        : `${definition.command} command ran but output did not match expected readiness pattern.`,
      detail: cleanDetail(output),
      command: definition.command,
      args: definition.args,
      checkedAt,
    }
  } catch (error) {
    const failed = error as { code?: string, stdout?: string | Buffer, stderr?: string | Buffer, message?: string }
    return {
      toolId: definition.toolId,
      checkKind: 'command_version',
      checkName: definition.checkName,
      status: definition.optional ? 'not_installed' : 'missing',
      optional: definition.optional,
      manualReviewRequired: definition.manualReviewRequired,
      message: `${definition.command} command check did not pass.`,
      detail: cleanDetail(failed.stdout) || cleanDetail(failed.stderr) || cleanDetail(failed.message),
      command: definition.command,
      args: definition.args,
      checkedAt,
    }
  }
}

function findPythonCommand(timeoutMs: number): string | undefined {
  const candidates = [
    process.env.REEDITPRO_READINESS_PYTHON_BIN,
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
      // Try the next candidate.
    }
  }

  return undefined
}

function runPythonImportCheck(
  definition: CoreToolPythonImportCheckDefinition,
  checkedAt: string,
  pythonCommand: string | undefined,
  options: Required<Pick<RunCoreCpuRenderReadinessOptions, 'timeoutMs' | 'maxBuffer'>>,
): CoreToolReadinessCheckResult {
  if (!pythonCommand) {
    return {
      toolId: definition.toolId,
      checkKind: 'python_import',
      checkName: definition.checkName,
      status: definition.optional ? 'not_installed' : 'missing',
      optional: definition.optional,
      manualReviewRequired: false,
      message: 'No Python command was available for import readiness checks.',
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
      timeout: options.timeoutMs,
      maxBuffer: options.maxBuffer,
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    return {
      toolId: definition.toolId,
      checkKind: 'python_import',
      checkName: definition.checkName,
      status: 'passed',
      optional: definition.optional,
      manualReviewRequired: false,
      message: `${definition.importName} Python import check passed.`,
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
      manualReviewRequired: false,
      message: `${definition.importName} Python import check did not pass.`,
      detail: cleanDetail(failed.stderr) || cleanDetail(failed.message),
      packageName: definition.packageName,
      importName: definition.importName,
      checkedAt,
    }
  }
}

function runNodePackageCheck(
  definition: CoreToolNodePackageCheckDefinition,
  checkedAt: string,
): CoreToolReadinessCheckResult {
  try {
    const resolvedPath = definition.sourcePath
      ? resolveSourceMetadataPath(definition)
      : resolvePackageMetadataPath(definition)
    return {
      toolId: definition.toolId,
      checkKind: 'node_package_metadata',
      checkName: definition.checkName,
      status: 'passed',
      optional: definition.optional,
      manualReviewRequired: false,
      message: definition.sourcePath
        ? `${definition.packageName} source boundary is present without importing runtime code.`
        : `${definition.packageName} package metadata is resolvable without importing runtime code.`,
      detail: resolvedPath,
      packageName: definition.packageName,
      importName: definition.sourcePath ?? definition.packageJsonPath,
      checkedAt,
    }
  } catch (error) {
    const failed = error as { message?: string }
    return {
      toolId: definition.toolId,
      checkKind: 'node_package_metadata',
      checkName: definition.checkName,
      status: definition.optional ? 'not_installed' : 'missing',
      optional: definition.optional,
      manualReviewRequired: false,
      message: definition.sourcePath
        ? `${definition.packageName} source boundary is not currently resolvable.`
        : `${definition.packageName} package metadata is not currently resolvable.`,
      detail: cleanDetail(failed.message),
      packageName: definition.packageName,
      importName: definition.sourcePath ?? definition.packageJsonPath,
      checkedAt,
    }
  }
}

function resolveSourceMetadataPath(definition: CoreToolNodePackageCheckDefinition): string {
  if (!definition.sourcePath) throw new Error(`${definition.packageName} source path is not configured.`)
  const candidate = join(process.cwd(), definition.sourcePath)
  if (!existsSync(candidate)) throw new Error(`${definition.packageName} source boundary is missing: ${definition.sourcePath}`)
  return candidate
}

function resolvePackageMetadataPath(definition: CoreToolNodePackageCheckDefinition): string {
  try {
    return requireFromReadiness.resolve(definition.packageJsonPath)
  } catch (error) {
    const packageJsonExportError = error as { code?: string }
    if (packageJsonExportError.code !== 'ERR_PACKAGE_PATH_NOT_EXPORTED') throw error
  }

  let current = dirname(requireFromReadiness.resolve(definition.packageName))
  const root = parse(current).root
  while (current && current !== root) {
    const candidate = join(current, 'package.json')
    if (existsSync(candidate)) return candidate
    current = dirname(current)
  }
  throw new Error(`${definition.packageName} package metadata is not resolvable from ${definition.packageName}.`)
}

function dryRunResult(
  definition: CoreToolCommandCheckDefinition | CoreToolPythonImportCheckDefinition | CoreToolNodePackageCheckDefinition,
  checkedAt: string,
  checkKind: CoreToolReadinessCheckKind,
): CoreToolReadinessCheckResult {
  return {
    toolId: definition.toolId,
    checkKind,
    checkName: definition.checkName,
    status: 'not_checked',
    optional: definition.optional,
    manualReviewRequired: 'manualReviewRequired' in definition ? definition.manualReviewRequired : false,
    message: 'Dry-run readiness records expected checks without executing commands or imports.',
    command: 'command' in definition ? definition.command : undefined,
    args: 'args' in definition ? definition.args : undefined,
    packageName: 'packageName' in definition ? definition.packageName : undefined,
    importName: 'importName' in definition ? definition.importName : undefined,
    checkedAt,
  }
}

function policyResults(checkedAt: string): CoreToolReadinessCheckResult[] {
  return [
    {
      toolId: 'ffmpeg_lgpl_policy',
      checkKind: 'manual_review',
      checkName: 'ffmpeg_lgpl_safe_build_manual_review',
      status: 'pending_manual_review',
      optional: false,
      manualReviewRequired: true,
      message: 'Distro FFmpeg may be declared for dev/readiness images, but final commercial LGPL-safe build verification is pending manual review.',
      checkedAt,
    },
    {
      toolId: 'revideo',
      checkKind: 'registry_policy',
      checkName: 'revideo_evaluation_only_policy',
      status: 'evaluation_only',
      optional: false,
      manualReviewRequired: true,
      message: 'Revideo remains evaluation-only and is not installed as a core render dependency.',
      checkedAt,
    },
  ]
}

function assertM10CoreResultsExcludeGpuModelTools(results: CoreToolReadinessCheckResult[]): void {
  const checkedToolIds = new Set(results.map((result) => result.toolId))
  const forbidden = M10_EXCLUDED_GPU_MODEL_TOOL_IDS.filter((toolId) => checkedToolIds.has(toolId))

  if (forbidden.length > 0) {
    throw new Error(`M10 core readiness must not include GPU/model tool checks: ${forbidden.join(', ')}`)
  }
}

export function runCoreCpuRenderReadinessChecks(
  options: RunCoreCpuRenderReadinessOptions = {},
): RunCoreCpuRenderReadinessResult {
  const realCheckMode = options.realCheckMode === true
  const strict = options.strict === true
  const timeoutMs = options.timeoutMs ?? 15000
  const maxBuffer = options.maxBuffer ?? 1024 * 1024
  const checkedAt = new Date().toISOString()

  const results: CoreToolReadinessCheckResult[] = realCheckMode
    ? [
        ...CORE_TOOL_COMMAND_CHECKS.map((definition) => runCommandCheck(definition, checkedAt, { timeoutMs, maxBuffer })),
        ...CORE_TOOL_PYTHON_IMPORT_CHECKS.map((definition) => runPythonImportCheck(definition, checkedAt, findPythonCommand(timeoutMs), { timeoutMs, maxBuffer })),
        ...CORE_TOOL_NODE_PACKAGE_CHECKS.map((definition) => runNodePackageCheck(definition, checkedAt)),
        ...policyResults(checkedAt),
      ]
    : [
        ...CORE_TOOL_COMMAND_CHECKS.map((definition) => dryRunResult(definition, checkedAt, 'command_version')),
        ...CORE_TOOL_PYTHON_IMPORT_CHECKS.map((definition) => dryRunResult(definition, checkedAt, 'python_import')),
        ...CORE_TOOL_NODE_PACKAGE_CHECKS.map((definition) => dryRunResult(definition, checkedAt, 'node_package_metadata')),
        ...policyResults(checkedAt),
      ]

  assertM10CoreResultsExcludeGpuModelTools(results)

  if (strict) {
    const blocking = results.filter((result) => !result.optional && (result.status === 'missing' || result.status === 'blocked'))
    if (blocking.length > 0) {
      throw new Error(`Strict M10 core readiness failed: ${blocking.map((result) => result.checkName).join(', ')}`)
    }
  }

  return {
    realCheckMode,
    strict,
    checkedAt,
    results,
    report: buildCoreToolReadinessReport(results, true),
    coreToolIds: [...M10_CORE_CPU_RENDER_TOOL_IDS],
    excludedGpuModelToolIds: [...M10_EXCLUDED_GPU_MODEL_TOOL_IDS],
  }
}

export function listM10CoreCpuRenderToolIds(): ProductionToolId[] {
  return [...M10_CORE_CPU_RENDER_TOOL_IDS]
}

export function listM10ExcludedGpuModelToolIds(): ProductionToolId[] {
  return [...M10_EXCLUDED_GPU_MODEL_TOOL_IDS]
}
