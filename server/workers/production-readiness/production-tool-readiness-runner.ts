import type { ProductionToolId } from '../../tool-registry'
import { getProductionToolProfile } from '../../tool-registry'
import { existsSync, readFileSync } from 'node:fs'
import { productionToolReadinessSpecs } from './production-tool-readiness-specs'
import { summarizeProductionToolReadiness } from './production-tool-readiness-summary'
import {
  M10_CORE_CPU_RENDER_TOOL_IDS,
  runCoreCpuRenderReadinessChecks,
  type RunCoreCpuRenderReadinessResult,
} from './core-cpu-render-readiness-checks'
import {
  runGpuAiReadinessChecks,
  type RunGpuAiReadinessResult,
} from './gpu-ai-readiness-checks'
import type {
  ProductionContainerImageRole,
  ProductionReadinessStatus,
  ProductionToolReadinessResult,
  ProductionToolReadinessSummary,
} from './production-tool-readiness-types'

export interface RunProductionToolReadinessDryRunOptions {
  dryRun: true
  toolIds?: ProductionToolId[]
  imageRole?: ProductionContainerImageRole
}

export interface RunProductionToolReadinessRealCheckOptions {
  realCheckMode: true
  strict?: boolean
  toolIds?: ProductionToolId[]
  imageRole?: ProductionContainerImageRole
}

export type RunProductionToolReadinessOptions =
  | RunProductionToolReadinessDryRunOptions
  | RunProductionToolReadinessRealCheckOptions

export interface RunProductionToolReadinessResult {
  dryRun: boolean
  realCheckMode?: boolean
  results: ProductionToolReadinessResult[]
  summary: ProductionToolReadinessSummary
  coreToolReadiness?: RunCoreCpuRenderReadinessResult
  gpuToolReadiness?: RunGpuAiReadinessResult
}

const launchCoreRequirementsPath = 'server/workers/sound-cpu/requirements.launch-core.txt'
const soundCpuDockerfilePath = 'server/workers/sound-cpu/Dockerfile'
const soundCpuControlledRequirementsPath = 'server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt'
const boundedActivationEvidenceFiles = new Map<ProductionToolId, Array<{ path: string, markers: string[] }>>([
  ['signalsmith_stretch', [
    {
      path: 'docs/activation-phase-36i-signalsmith-stretch-generated-fixture-reports/phase_36i_signalsmith_runtime_generated_fixture_report.json',
      markers: [
        '"status": "passed"',
        '"runtimeBuildStatus": "passed"',
        '"generatedFixtureStatus": "passed"',
        '"realMedia": "not_run_blocked"',
      ],
    },
    {
      path: 'docs/activation-phase-36j-controlled-real-media-timing-stretch-sample-reports/phase_36j_signalsmith_controlled_stretch_report.json',
      markers: [
        '"status": "passed"',
        '"boundedControlledAudioOnly": true',
        '"publicOutput": "blocked"',
      ],
    },
    {
      path: 'docs/activation-phase-36m-audio-timing-internal-beta-readiness-gate-reports/phase_36m_audio_timing_beta_gate_decision.json',
      markers: [
        '"status": "passed"',
        '"audioTimingToolFamilyBetaStatus": "internally beta-ready candidate"',
        '"externalBeta": "blocked"',
        '"production": "blocked"',
        '"Signalsmith runtime reruns"',
      ],
    },
  ]],
])
const manifestBackedPythonPackages = new Map<ProductionToolId, string>([
  ['pyav', 'av==17.1.0'],
  ['pyscenedetect', 'scenedetect==0.7'],
  ['opencv', 'opencv-python-headless==4.13.0.92'],
  ['duckdb', 'duckdb==1.5.4'],
  ['polars', 'polars==1.42.0'],
  ['opentimelineio', 'opentimelineio==0.18.1'],
])
const manifestBackedNodePackages = new Map<ProductionToolId, [string, string]>([
  ['sharp', ['sharp', '0.35.2']],
  ['remotion', ['remotion', '4.0.484']],
])
const dockerfileBackedSystemPackages = new Map<ProductionToolId, string[]>([
  ['ffmpeg', ['ffmpeg']],
  ['ffprobe', ['ffmpeg']],
  ['libass', ['libass9', 'fontconfig', 'fonts-dejavu-core']],
])
const dockerfileBackedPythonRequirementPackages = new Map<ProductionToolId, string>([
  ['audioflux', 'audioflux==0.1.9'],
])
const sourceInstallReviewedToolIds = new Set<ProductionToolId>([
  'duckdb',
  'polars',
  'opentimelineio',
  'pyav',
  'pyscenedetect',
  'opencv',
  'sharp',
  'remotion',
])
const pendingManualReviewClosedToolIds = new Set<ProductionToolId>([
  'duckdb',
  'polars',
  'opentimelineio',
  'pyav',
  'pyscenedetect',
  'opencv',
  'sharp',
  'remotion',
])
const dockerfileBackedStaticReviewClosedToolIds = new Set<ProductionToolId>([
  'ffmpeg',
  'ffprobe',
  'libass',
])
const dockerfilePipStaticReviewClosedToolIds = new Set<ProductionToolId>([
  'audioflux',
])
const boundedActivationEvidenceWarningToolIds = new Set<ProductionToolId>([
  'signalsmith_stretch',
])
const internalPreviewBoundaryWarningToolIds = new Set<ProductionToolId>([
  'hyperframe',
])

function dryRunStatusForSpec(specStatus: ProductionReadinessStatus): ProductionReadinessStatus {
  if (specStatus === 'passed' || specStatus === 'warning') return 'not_checked'
  return specStatus
}

function readLaunchCoreRequirementsLines(): Set<string> {
  if (!existsSync(launchCoreRequirementsPath)) return new Set()
  return new Set(readFileSync(launchCoreRequirementsPath, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#')))
}

function readSoundCpuControlledRequirementsLines(): Set<string> {
  if (!existsSync(soundCpuControlledRequirementsPath)) return new Set()
  return new Set(readFileSync(soundCpuControlledRequirementsPath, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#')))
}

function readPackageJsonDependencies(): Record<string, string> {
  if (!existsSync('package.json')) return {}

  try {
    const parsed = JSON.parse(readFileSync('package.json', 'utf8')) as {
      dependencies?: Record<string, string>
    }
    return parsed.dependencies ?? {}
  } catch {
    return {}
  }
}

function readPackageLockRootDependencies(): Record<string, string> {
  if (!existsSync('package-lock.json')) return {}

  try {
    const parsed = JSON.parse(readFileSync('package-lock.json', 'utf8')) as {
      packages?: Record<string, { dependencies?: Record<string, string> }>
    }
    return parsed.packages?.['']?.dependencies ?? {}
  } catch {
    return {}
  }
}

function buildManifestBackedToolSet(): Set<ProductionToolId> {
  const backedToolIds = new Set<ProductionToolId>()
  const requirementLines = readLaunchCoreRequirementsLines()

  for (const [toolId, requirementLine] of manifestBackedPythonPackages) {
    if (requirementLines.has(requirementLine)) backedToolIds.add(toolId)
  }

  const packageJsonDependencies = readPackageJsonDependencies()
  const packageLockRootDependencies = readPackageLockRootDependencies()

  for (const [toolId, [packageName, version]] of manifestBackedNodePackages) {
    if (packageJsonDependencies[packageName] === version && packageLockRootDependencies[packageName] === version) {
      backedToolIds.add(toolId)
    }
  }

  return backedToolIds
}

function dockerfileInstallsSoundCpuControlledRequirements(dockerfile: string): boolean {
  return dockerfile.includes('server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt') &&
    dockerfile.includes('pip install --no-cache-dir --requirement ./requirements.sound-oss-tools.txt')
}

function packageNamePattern(packageName: string): RegExp {
  const escaped = packageName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`\\b${escaped}\\b`)
}

function buildDockerfileBackedToolSet(): Set<ProductionToolId> {
  const backedToolIds = new Set<ProductionToolId>()
  if (!existsSync(soundCpuDockerfilePath)) return backedToolIds

  const dockerfile = readFileSync(soundCpuDockerfilePath, 'utf8')
  for (const [toolId, packageNames] of dockerfileBackedSystemPackages) {
    if (packageNames.every((packageName) => packageNamePattern(packageName).test(dockerfile))) {
      backedToolIds.add(toolId)
    }
  }

  return backedToolIds
}

function buildDockerfilePipBackedToolSet(): Set<ProductionToolId> {
  const backedToolIds = new Set<ProductionToolId>()
  if (!existsSync(soundCpuDockerfilePath)) return backedToolIds

  const dockerfile = readFileSync(soundCpuDockerfilePath, 'utf8')
  if (!dockerfileInstallsSoundCpuControlledRequirements(dockerfile)) return backedToolIds

  const requirementLines = readSoundCpuControlledRequirementsLines()
  for (const [toolId, requirementLine] of dockerfileBackedPythonRequirementPackages) {
    if (requirementLines.has(requirementLine)) backedToolIds.add(toolId)
  }

  return backedToolIds
}

function fileIncludesAll(path: string, markers: string[]): boolean {
  if (!existsSync(path)) return false
  const text = readFileSync(path, 'utf8')
  return markers.every((marker) => text.includes(marker))
}

function buildBoundedActivationEvidenceToolSet(): Set<ProductionToolId> {
  const backedToolIds = new Set<ProductionToolId>()

  for (const [toolId, files] of boundedActivationEvidenceFiles) {
    if (files.every((file) => fileIncludesAll(file.path, file.markers))) {
      backedToolIds.add(toolId)
    }
  }

  return backedToolIds
}

function dryRunStatusForTool(
  specToolId: ProductionToolId,
  specStatus: ProductionReadinessStatus,
  manifestBackedToolIds: Set<ProductionToolId>,
  dockerfileBackedToolIds: Set<ProductionToolId>,
  dockerfilePipBackedToolIds: Set<ProductionToolId>,
  boundedActivationEvidenceToolIds: Set<ProductionToolId>,
): ProductionReadinessStatus {
  const baseStatus = dryRunStatusForSpec(specStatus)
  if (internalPreviewBoundaryWarningToolIds.has(specToolId)) return 'warning'
  if (
    manifestBackedToolIds.has(specToolId) &&
    (baseStatus === 'missing' || baseStatus === 'not_installed')
  ) {
    if (sourceInstallReviewedToolIds.has(specToolId)) {
      if (pendingManualReviewClosedToolIds.has(specToolId)) return 'warning'
      return 'pending_manual_review'
    }
    return 'source_install_review_required'
  }
  if (
    dockerfileBackedToolIds.has(specToolId) &&
    (baseStatus === 'missing' || baseStatus === 'not_installed')
  ) {
    if (dockerfileBackedStaticReviewClosedToolIds.has(specToolId)) return 'warning'
    return 'source_install_review_required'
  }
  if (
    dockerfilePipBackedToolIds.has(specToolId) &&
    (baseStatus === 'missing' || baseStatus === 'not_installed')
  ) {
    if (dockerfilePipStaticReviewClosedToolIds.has(specToolId)) return 'warning'
    return 'source_install_review_required'
  }
  if (
    boundedActivationEvidenceToolIds.has(specToolId) &&
    (baseStatus === 'missing' || baseStatus === 'not_installed')
  ) {
    if (boundedActivationEvidenceWarningToolIds.has(specToolId)) return 'warning'
    return 'source_install_review_required'
  }
  return baseStatus
}

function buildDryRunWarnings(
  specToolId: ProductionToolId,
  manifestBackedToolIds: Set<ProductionToolId>,
  dockerfileBackedToolIds: Set<ProductionToolId>,
  dockerfilePipBackedToolIds: Set<ProductionToolId>,
  boundedActivationEvidenceToolIds: Set<ProductionToolId>,
): string[] {
  const profile = getProductionToolProfile(specToolId)
  const warnings = [
    'Dry-run readiness does not execute command version checks, Python imports, Node imports, media tools, or model downloads.',
  ]

  if (manifestBackedToolIds.has(specToolId)) {
    if (pendingManualReviewClosedToolIds.has(specToolId)) {
      warnings.push('Persistent launch-core manifest source, controlled install/import proof, source-install review, and pending-manual owner review passed; static readiness records warning until runtime policy closes.')
    } else {
      warnings.push(sourceInstallReviewedToolIds.has(specToolId)
        ? 'Persistent launch-core manifest source passed source-install review; static readiness records pending_manual_review until runtime policy closes.'
        : 'Persistent launch-core manifest source exists; static readiness records source_install_review_required until runtime/install policy closes.')
    }
  }

  if (dockerfileBackedToolIds.has(specToolId)) {
    if (dockerfileBackedStaticReviewClosedToolIds.has(specToolId)) {
      warnings.push('SOUND CPU Dockerfile system-package declaration, static validation, and owner review passed; static readiness records warning until controlled command proof, media policy, and runtime policy close.')
    } else {
      warnings.push('SOUND CPU Dockerfile system-package declaration exists; static readiness records source_install_review_required until static validation and owner review close.')
    }
  }

  if (dockerfilePipBackedToolIds.has(specToolId)) {
    if (dockerfilePipStaticReviewClosedToolIds.has(specToolId)) {
      warnings.push('SOUND CPU Dockerfile pip requirements declaration, controlled install/import proof, and source-fix owner review passed; static readiness records warning until controlled tool-call, media policy, and runtime policy close.')
    } else {
      warnings.push('SOUND CPU Dockerfile pip requirements declaration exists; static readiness records source_install_review_required until controlled install/import proof and owner review close.')
    }
  }

  if (boundedActivationEvidenceToolIds.has(specToolId)) {
    if (boundedActivationEvidenceWarningToolIds.has(specToolId)) {
      warnings.push('Signalsmith Phase 36I/36J/36M bounded activation evidence passed for generated fixtures and one private controlled sample; static readiness records warning only. Runtime reruns, broad media, external beta, and production remain blocked.')
    } else {
      warnings.push('Bounded activation evidence exists; static readiness records source_install_review_required until owner review closes the exact scope.')
    }
  }

  if (internalPreviewBoundaryWarningToolIds.has(specToolId)) {
    warnings.push('Hyperframe package identity review concluded this is an internal preview boundary; static readiness records warning and does not require hyperframe/package.json or install guessed package names.')
  }

  if (profile?.modelWeightsRequired) {
    warnings.push('Model weights are placeholders only and block production readiness until reviewed.')
  }

  if (profile?.productionStatus === 'evaluation_only') {
    warnings.push('Evaluation-only tools are intentionally blocked from production execution.')
  }

  if (profile?.productionStatus === 'future') {
    warnings.push('Future tools are documented for later milestones and do not pass production readiness yet.')
  }

  return warnings
}

export function runProductionToolReadiness(
  options: RunProductionToolReadinessOptions = { dryRun: true },
): RunProductionToolReadinessResult {
  if ('realCheckMode' in options && options.realCheckMode === true) {
    return runProductionToolReadinessRealChecks(options)
  }

  const requestedToolIds = options.toolIds ? new Set(options.toolIds) : undefined
  const specs = productionToolReadinessSpecs.filter((spec) => {
    if (requestedToolIds && !requestedToolIds.has(spec.toolId)) return false
    if (options.imageRole && !spec.imageRoles.includes(options.imageRole)) return false
    return true
  })

  const checkedAt = new Date().toISOString()
  const manifestBackedToolIds = buildManifestBackedToolSet()
  const dockerfileBackedToolIds = buildDockerfileBackedToolSet()
  const dockerfilePipBackedToolIds = buildDockerfilePipBackedToolSet()
  const boundedActivationEvidenceToolIds = buildBoundedActivationEvidenceToolSet()
  const results: ProductionToolReadinessResult[] = specs.map((spec) => ({
    toolId: spec.toolId,
    displayName: spec.displayName,
    status: dryRunStatusForTool(
      spec.toolId,
      spec.readinessStatusWhenMissing,
      manifestBackedToolIds,
      dockerfileBackedToolIds,
      dockerfilePipBackedToolIds,
      boundedActivationEvidenceToolIds,
    ),
    dryRun: true,
    commandChecks: spec.commandChecks,
    pythonImportChecks: spec.pythonImportChecks,
    nodePackageChecks: spec.nodePackageChecks,
    modelWeightChecks: spec.modelWeightChecks,
    environmentChecks: spec.environmentChecks,
    warnings: buildDryRunWarnings(
      spec.toolId,
      manifestBackedToolIds,
      dockerfileBackedToolIds,
      dockerfilePipBackedToolIds,
      boundedActivationEvidenceToolIds,
    ),
    blocksProduction: spec.blocksProductionIfMissing,
    checkedAt,
  }))

  return {
    dryRun: true,
    results,
    summary: summarizeProductionToolReadiness(results),
    gpuToolReadiness: runGpuAiReadinessChecks({ dryRun: true }),
  }
}

function statusPriority(status: ProductionReadinessStatus): number {
  const priority: Record<ProductionReadinessStatus, number> = {
    blocked: 100,
    missing: 90,
    not_installed: 80,
    needs_license_review: 70,
    pending_manual_review: 65,
    source_install_review_required: 64,
    evaluation_only: 60,
    future_only: 50,
    warning: 40,
    not_checked: 20,
    passed: 10,
  }
  return priority[status]
}

function aggregateStatus(statuses: ProductionReadinessStatus[]): ProductionReadinessStatus {
  if (statuses.length === 0) return 'not_checked'
  return statuses.reduce((selected, status) => (
    statusPriority(status) > statusPriority(selected) ? status : selected
  ), statuses[0])
}

function runProductionToolReadinessRealChecks(
  options: RunProductionToolReadinessRealCheckOptions,
): RunProductionToolReadinessResult {
  const coreToolReadiness = runCoreCpuRenderReadinessChecks({
    realCheckMode: true,
    strict: options.strict,
  })
  const allowedCoreToolIds = new Set(M10_CORE_CPU_RENDER_TOOL_IDS)
  const requestedToolIds = options.toolIds ? new Set(options.toolIds) : undefined
  const checkedStatusByTool = new Map<ProductionToolId, ProductionReadinessStatus[]>()

  for (const result of coreToolReadiness.results) {
    if (result.toolId === 'ffmpeg_lgpl_policy') continue
    if (!allowedCoreToolIds.has(result.toolId)) continue
    const statuses = checkedStatusByTool.get(result.toolId) ?? []
    statuses.push(result.status)
    checkedStatusByTool.set(result.toolId, statuses)
  }

  const specs = productionToolReadinessSpecs.filter((spec) => {
    if (!allowedCoreToolIds.has(spec.toolId)) return false
    if (requestedToolIds && !requestedToolIds.has(spec.toolId)) return false
    if (options.imageRole && !spec.imageRoles.includes(options.imageRole)) return false
    return true
  })

  const checkedAt = coreToolReadiness.checkedAt
  const results: ProductionToolReadinessResult[] = specs.map((spec) => {
    const coreStatuses = checkedStatusByTool.get(spec.toolId) ?? []
    const status = aggregateStatus(coreStatuses)

    return {
      toolId: spec.toolId,
      displayName: spec.displayName,
      status,
      dryRun: false,
      commandChecks: spec.commandChecks,
      pythonImportChecks: spec.pythonImportChecks,
      nodePackageChecks: spec.nodePackageChecks,
      modelWeightChecks: [],
      environmentChecks: [],
      warnings: [
        'M10 realCheckMode runs safe command/import/package-metadata checks only.',
        ...(status === 'pending_manual_review' ? ['Manual review is still required before production execution.'] : []),
      ],
      blocksProduction: status === 'missing' || status === 'blocked' || status === 'pending_manual_review',
      checkedAt,
    }
  })

  return {
    dryRun: false,
    realCheckMode: true,
    results,
    summary: summarizeProductionToolReadiness(results),
    coreToolReadiness,
    gpuToolReadiness: runGpuAiReadinessChecks({ dryRun: true }),
  }
}
