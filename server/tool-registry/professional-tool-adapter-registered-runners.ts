import { execFile } from 'node:child_process'
import { createRequire } from 'node:module'
import { promisify } from 'node:util'
import type { ProductionToolId } from './production-tool-types'
import type { ProfessionalToolAdapterBoundedExecutionRun } from './professional-tool-adapter-execution'

const execFileAsync = promisify(execFile)
const requireFromHere = createRequire(import.meta.url)

export type ProfessionalToolAdapterRunnerRuntime = 'node' | 'python' | 'binary'
export type ProfessionalToolAdapterRunnerStatus =
  | 'completed_import_probe'
  | 'blocked_missing_package'
  | 'blocked_missing_binary'
  | 'blocked_worker_runtime_not_hydrated'
  | 'blocked_native_runtime_incompatible'
  | 'blocked_no_registered_runner'
  | 'blocked_import_probe_not_enabled'

export interface ProfessionalToolAdapterRegisteredRunnerResult {
  activityResultId: string
  canonicalToolId: ProductionToolId
  runtime: ProfessionalToolAdapterRunnerRuntime | 'none'
  packageName?: string
  importName?: string
  importProbeOnly: true
  runtimeBinary?: string
  runtimeReadinessScope?: 'configured_backend_runtime_import_probe'
  declaredWorkerImageRoles: string[]
  declaredRequirementsFiles: string[]
  status: ProfessionalToolAdapterRunnerStatus
  packageResolved: boolean
  packageImported: boolean
  actualToolPackageExecuted: boolean
  summary: string
  errorMessage?: string
}

export interface ProfessionalToolAdapterRegisteredRunnerRun {
  id: string
  boundedAdapterExecutionRunId: string
  packageRecordId: string
  workspaceId: string
  projectId: string
  approvedPlanSnapshotId: string
  creditReservationId: string
  status: 'completed_import_probe' | 'blocked'
  probeOnly: true
  requestedActivityCount: number
  completedImportProbeCount: number
  blockedRunnerCount: number
  actualToolPackageExecutionCount: number
  mediaProcessingExecuted: false
  frontendExecutionAllowed: false
  productReady: false
  results: ProfessionalToolAdapterRegisteredRunnerResult[]
  blockers: string[]
  nextRequiredGate: 'tool_specific_private_media_execution_runner'
  userFacingSummary: string
  internalExecutionSummary: string
  noRuntimeSideEffects: string[]
}

const nodeRunnerPackages: Partial<Record<ProductionToolId, string>> = {
  d3: 'd3',
  echarts: 'echarts',
  vega_lite: 'vega-lite',
  vega: 'vega',
  satori: 'satori',
  svg_js: '@svgdotjs/svg.js',
  viz_js: '@viz-js/viz',
  lottie: 'lottie-web',
  animejs: 'animejs',
  three_js: 'three',
  pixijs: 'pixi.js',
  konva: 'konva',
  babylon_js: '@babylonjs/core',
  playwright: 'playwright',
  maplibre: 'maplibre-gl',
  turf: '@turf/turf',
  deck_gl: '@deck.gl/core',
}

export function getProfessionalToolAdapterNodeRunnerPackage(toolId: ProductionToolId): string | undefined {
  return nodeRunnerPackages[toolId]
}

export interface ProfessionalToolAdapterBinaryRunnerCommand {
  packageName: string
  commandName: string
  declaredWorkerImageRoles: string[]
  declaredRequirementsFiles: string[]
}

const binaryRunnerCommands: Partial<Record<ProductionToolId, ProfessionalToolAdapterBinaryRunnerCommand>> = {
  streamer_render_pipeline_support: {
    packageName: 'gstreamer',
    commandName: 'gst-launch-1.0',
    declaredWorkerImageRoles: ['render_worker', 'tool_readiness_worker'],
    declaredRequirementsFiles: ['docker/prod/render-worker/Dockerfile'],
  },
  mkvtoolnix_container_validation: {
    packageName: 'mkvtoolnix',
    commandName: 'mkvmerge',
    declaredWorkerImageRoles: ['render_worker', 'tool_readiness_worker'],
    declaredRequirementsFiles: ['docker/prod/render-worker/Dockerfile'],
  },
  gpac_mp4box_packaging_validation: {
    packageName: 'gpac',
    commandName: 'MP4Box',
    declaredWorkerImageRoles: ['render_worker', 'tool_readiness_worker'],
    declaredRequirementsFiles: ['docker/prod/render-worker/Dockerfile'],
  },
  rnnoise: {
    packageName: 'rnnoise',
    commandName: 'rnnoise_demo',
    declaredWorkerImageRoles: ['cpu_worker', 'tool_readiness_worker'],
    declaredRequirementsFiles: ['tool-specific worker requirements pending owner-approved runtime hydration'],
  },
}

export function getProfessionalToolAdapterBinaryRunnerCommand(
  toolId: ProductionToolId,
): ProfessionalToolAdapterBinaryRunnerCommand | undefined {
  return binaryRunnerCommands[toolId]
}

export interface ProfessionalToolAdapterPythonRunnerImport {
  packageName: string
  importName: string
}

const pythonRunnerImports: Partial<Record<ProductionToolId, { packageName: string; importName: string }>> = {
  librosa: { packageName: 'librosa', importName: 'librosa' },
  audioread: { packageName: 'audioread', importName: 'audioread' },
  pydub: { packageName: 'pydub', importName: 'pydub' },
  scipy: { packageName: 'scipy', importName: 'scipy' },
  resampy: { packageName: 'resampy', importName: 'resampy' },
  pyloudnorm: { packageName: 'pyloudnorm', importName: 'pyloudnorm' },
  audioflux: { packageName: 'audioflux', importName: 'audioflux' },
  music21: { packageName: 'music21', importName: 'music21' },
  pretty_midi: { packageName: 'pretty_midi', importName: 'pretty_midi' },
  mido: { packageName: 'mido', importName: 'mido' },
  noisereduce: { packageName: 'noisereduce', importName: 'noisereduce' },
  pedalboard: { packageName: 'pedalboard', importName: 'pedalboard' },
  mir_eval: { packageName: 'mir_eval', importName: 'mir_eval' },
  pydub_effects: { packageName: 'pydub', importName: 'pydub.effects' },
  ebu_r128_pyloudnorm: { packageName: 'pyloudnorm', importName: 'pyloudnorm' },
  faster_whisper: { packageName: 'faster-whisper', importName: 'faster_whisper' },
  whisper_cpp: { packageName: 'whisper.cpp bindings', importName: 'whisper_cpp' },
  pyscenedetect: { packageName: 'scenedetect', importName: 'scenedetect' },
  opencolorio: { packageName: 'opencolorio', importName: 'PyOpenColorIO' },
  openimageio: { packageName: 'openimageio', importName: 'OpenImageIO' },
  deepfilternet: { packageName: 'deepfilternet', importName: 'df' },
  kornia: { packageName: 'kornia', importName: 'kornia' },
  torch_torchvision: { packageName: 'torch+torchvision', importName: 'torch,torchvision' },
  transformers: { packageName: 'transformers', importName: 'transformers' },
  sam2: { packageName: 'sam2', importName: 'sam2' },
  birefnet: { packageName: 'birefnet', importName: 'birefnet' },
  rembg: { packageName: 'rembg', importName: 'rembg' },
  transparent_background: { packageName: 'transparent-background', importName: 'transparent_background' },
  real_esrgan: { packageName: 'real-esrgan', importName: 'realesrgan' },
}

export function getProfessionalToolAdapterPythonRunnerImport(toolId: ProductionToolId): ProfessionalToolAdapterPythonRunnerImport | undefined {
  return pythonRunnerImports[toolId]
}

export async function runProfessionalToolAdapterRegisteredRunners(input: {
  boundedAdapterExecutionRun: ProfessionalToolAdapterBoundedExecutionRun
  allowImportProbe: boolean
  pythonBin?: string
}): Promise<ProfessionalToolAdapterRegisteredRunnerRun> {
  const run = input.boundedAdapterExecutionRun
  const results = await Promise.all(run.activityResults.map((activity) =>
    runRegisteredRunnerForTool({
      activityResultId: activity.activityResultId,
      canonicalToolId: activity.canonicalToolId,
      allowImportProbe: input.allowImportProbe,
      pythonBin: input.pythonBin ?? 'python3',
    })
  ))
  const blockers = results
    .filter((result) => result.status !== 'completed_import_probe')
    .map((result) => `${result.canonicalToolId}: ${result.summary}`)
  const completedImportProbeCount = results.filter((result) => result.status === 'completed_import_probe').length
  const status = blockers.length ? 'blocked' : 'completed_import_probe'

  return {
    id: `registered-runner-run-${run.id}`,
    boundedAdapterExecutionRunId: run.id,
    packageRecordId: run.packageRecordId,
    workspaceId: run.workspaceId,
    projectId: run.projectId,
    approvedPlanSnapshotId: run.approvedPlanSnapshotId,
    creditReservationId: run.creditReservationId,
    status,
    probeOnly: true,
    requestedActivityCount: run.activityResults.length,
    completedImportProbeCount,
    blockedRunnerCount: blockers.length,
    actualToolPackageExecutionCount: 0,
    mediaProcessingExecuted: false,
    frontendExecutionAllowed: false,
    productReady: false,
    results,
    blockers,
    nextRequiredGate: 'tool_specific_private_media_execution_runner',
    userFacingSummary: status === 'completed_import_probe'
      ? `Verified ${completedImportProbeCount} backend edit activity runner${completedImportProbeCount === 1 ? '' : 's'} for the next private execution gate.`
      : 'Some backend edit activity runners are not installed or registered yet.',
    internalExecutionSummary: [
      `Registered runner import probes completed: ${completedImportProbeCount}.`,
      `Blocked runner probes: ${blockers.length}.`,
      'Probe-only mode verifies backend package availability; it does not process media or execute approved edit operations.',
    ].join(' '),
    noRuntimeSideEffects: [
      'Registered runner probe does not process media, render, call providers, write Supabase/GCS, create signed URLs, create public artifacts, or bill users.',
      'Import-probe readiness is not counted as actual tool execution; a later tool-specific runner must execute against approved private artifacts.',
      'Frontend execution remains disabled.',
      'A later tool-specific private media execution runner must consume approved private artifacts before final render readiness.',
    ],
  }
}

async function runRegisteredRunnerForTool(input: {
  activityResultId: string
  canonicalToolId: ProductionToolId
  allowImportProbe: boolean
  pythonBin: string
}): Promise<ProfessionalToolAdapterRegisteredRunnerResult> {
  if (!input.allowImportProbe) {
    return {
      activityResultId: input.activityResultId,
      canonicalToolId: input.canonicalToolId,
      runtime: 'none',
      importProbeOnly: true,
      declaredWorkerImageRoles: [],
      declaredRequirementsFiles: [],
      status: 'blocked_import_probe_not_enabled',
      packageResolved: false,
      packageImported: false,
      actualToolPackageExecuted: false,
      summary: 'Backend import probe was not explicitly enabled.',
    }
  }

  const nodePackageName = nodeRunnerPackages[input.canonicalToolId]
  if (nodePackageName) {
    try {
      requireFromHere.resolve(nodePackageName)
      return {
        activityResultId: input.activityResultId,
        canonicalToolId: input.canonicalToolId,
        runtime: 'node',
        packageName: nodePackageName,
        importName: nodePackageName,
        importProbeOnly: true,
        runtimeReadinessScope: 'configured_backend_runtime_import_probe',
        declaredWorkerImageRoles: ['render_worker', 'tool_readiness_worker'],
        declaredRequirementsFiles: ['package.json', 'package-lock.json'],
        status: 'completed_import_probe',
        packageResolved: true,
        packageImported: true,
        actualToolPackageExecuted: false,
        summary: `${nodePackageName} resolved in the configured backend Node runtime; no edit operation or media transform ran.`,
      }
    } catch (error) {
      return {
        activityResultId: input.activityResultId,
        canonicalToolId: input.canonicalToolId,
        runtime: 'node',
        packageName: nodePackageName,
        importName: nodePackageName,
        importProbeOnly: true,
        runtimeReadinessScope: 'configured_backend_runtime_import_probe',
        declaredWorkerImageRoles: ['render_worker', 'tool_readiness_worker'],
        declaredRequirementsFiles: ['package.json', 'package-lock.json'],
        status: 'blocked_missing_package',
        packageResolved: false,
        packageImported: false,
        actualToolPackageExecuted: false,
        summary: `${nodePackageName} is not installed in the configured backend Node runtime.`,
        errorMessage: error instanceof Error ? error.message : String(error),
      }
    }
  }

  const pythonImport = pythonRunnerImports[input.canonicalToolId]
  const binaryCommand = binaryRunnerCommands[input.canonicalToolId]
  if (binaryCommand) {
    try {
      const { stdout } = await execFileAsync('/usr/bin/env', [
        'sh',
        '-lc',
        `command -v ${binaryCommand.commandName}`,
      ], { timeout: 10_000 })
      return {
        activityResultId: input.activityResultId,
        canonicalToolId: input.canonicalToolId,
        runtime: 'binary',
        packageName: binaryCommand.packageName,
        importName: binaryCommand.commandName,
        importProbeOnly: true,
        runtimeBinary: stdout.trim() || binaryCommand.commandName,
        runtimeReadinessScope: 'configured_backend_runtime_import_probe',
        declaredWorkerImageRoles: binaryCommand.declaredWorkerImageRoles,
        declaredRequirementsFiles: binaryCommand.declaredRequirementsFiles,
        status: 'completed_import_probe',
        packageResolved: true,
        packageImported: true,
        actualToolPackageExecuted: false,
        summary: `${binaryCommand.commandName} resolved in the configured backend worker PATH; no media command or product runtime ran.`,
      }
    } catch (error) {
      return {
        activityResultId: input.activityResultId,
        canonicalToolId: input.canonicalToolId,
        runtime: 'binary',
        packageName: binaryCommand.packageName,
        importName: binaryCommand.commandName,
        importProbeOnly: true,
        runtimeReadinessScope: 'configured_backend_runtime_import_probe',
        declaredWorkerImageRoles: binaryCommand.declaredWorkerImageRoles,
        declaredRequirementsFiles: binaryCommand.declaredRequirementsFiles,
        status: 'blocked_missing_binary',
        packageResolved: false,
        packageImported: false,
        actualToolPackageExecuted: false,
        summary: `${binaryCommand.commandName} is not available in the configured backend worker PATH. Use the approved render-worker image/runtime before this gate can pass.`,
        errorMessage: error instanceof Error ? error.message : String(error),
      }
    }
  }

  if (pythonImport) {
    try {
      await execFileAsync(input.pythonBin, [
        '-c',
        `import ${pythonImport.importName.replace(',', '; import ')}`,
      ], { timeout: 10_000 })
      return {
        activityResultId: input.activityResultId,
        canonicalToolId: input.canonicalToolId,
        runtime: 'python',
        packageName: pythonImport.packageName,
        importName: pythonImport.importName,
        importProbeOnly: true,
        runtimeBinary: input.pythonBin,
        runtimeReadinessScope: 'configured_backend_runtime_import_probe',
        declaredWorkerImageRoles: declaredPythonWorkerImageRoles(input.canonicalToolId),
        declaredRequirementsFiles: declaredPythonRequirementsFiles(input.canonicalToolId),
        status: 'completed_import_probe',
        packageResolved: true,
        packageImported: true,
        actualToolPackageExecuted: false,
        summary: `${pythonImport.importName} imported in the configured backend Python runtime; no edit operation or media transform ran.`,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      const nativeRuntimeIncompatible = isNativeRuntimeIncompatibleImportFailure({
        canonicalToolId: input.canonicalToolId,
        errorMessage,
      })
      return {
        activityResultId: input.activityResultId,
        canonicalToolId: input.canonicalToolId,
        runtime: 'python',
        packageName: pythonImport.packageName,
        importName: pythonImport.importName,
        importProbeOnly: true,
        runtimeBinary: input.pythonBin,
        runtimeReadinessScope: 'configured_backend_runtime_import_probe',
        declaredWorkerImageRoles: declaredPythonWorkerImageRoles(input.canonicalToolId),
        declaredRequirementsFiles: declaredPythonRequirementsFiles(input.canonicalToolId),
        status: nativeRuntimeIncompatible ? 'blocked_native_runtime_incompatible' : 'blocked_worker_runtime_not_hydrated',
        packageResolved: false,
        packageImported: false,
        actualToolPackageExecuted: false,
        summary: nativeRuntimeIncompatible
          ? `${pythonImport.importName} is installed but its native library is not compatible with the configured backend Python runtime architecture.`
          : `${pythonImport.importName} is declared for backend worker readiness via ${declaredPythonRequirementsFiles(input.canonicalToolId).join(' and ')}, but it is not importable from the configured adapter Python runtime (${input.pythonBin}). Set TOOL_ADAPTER_PYTHON_BIN to a hydrated worker Python runtime before this gate can pass.`,
        errorMessage,
      }
    }
  }

  return {
    activityResultId: input.activityResultId,
    canonicalToolId: input.canonicalToolId,
    runtime: 'none',
    importProbeOnly: true,
    declaredWorkerImageRoles: [],
    declaredRequirementsFiles: [],
    status: 'blocked_no_registered_runner',
    packageResolved: false,
    packageImported: false,
    actualToolPackageExecuted: false,
    summary: 'No registered backend runner exists for this adapter yet.',
  }
}

function declaredPythonWorkerImageRoles(toolId: ProductionToolId): string[] {
  if ([
    'torch_torchvision',
    'transformers',
    'sam2',
    'birefnet',
    'rembg',
    'transparent_background',
    'real_esrgan',
    'kornia',
    'faster_whisper',
    'whisper_cpp',
    'deepfilternet',
  ].includes(toolId)) {
    return ['gpu_worker', 'tool_readiness_worker']
  }

  return ['cpu_worker', 'tool_readiness_worker']
}

function declaredPythonRequirementsFiles(toolId: ProductionToolId): string[] {
  if ([
    'librosa',
    'audioread',
    'pydub',
    'scipy',
    'resampy',
    'pyloudnorm',
    'audioflux',
    'music21',
    'pretty_midi',
    'mido',
    'noisereduce',
    'pedalboard',
    'mir_eval',
    'pydub_effects',
    'ebu_r128_pyloudnorm',
    'pyscenedetect',
  ].includes(toolId)) {
    return [
      'docker/prod/cpu-worker/requirements.cpu.txt',
      'docker/prod/tool-readiness-worker/requirements.readiness.txt',
    ]
  }

  if ([
    'faster_whisper',
    'deepfilternet',
  ].includes(toolId)) {
    return ['docker/prod/gpu-worker/requirements.gpu.txt']
  }

  return ['tool-specific worker requirements pending owner-approved runtime hydration']
}

function isNativeRuntimeIncompatibleImportFailure(input: {
  canonicalToolId: ProductionToolId
  errorMessage: string
}): boolean {
  if (input.canonicalToolId !== 'audioflux') return false
  const normalized = input.errorMessage.toLowerCase()
  return (
    normalized.includes('audioflux/lib/libaudioflux.so') &&
    (
      normalized.includes('cannot open shared object file') ||
      normalized.includes('wrong elf class') ||
      normalized.includes('bad cpu type') ||
      normalized.includes('mach-o') ||
      normalized.includes('incompatible architecture')
    )
  )
}
