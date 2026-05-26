import {
  getProductionToolProfile,
  listProductionToolProfiles,
  type ProductionRegistryWorkerType,
  type ProductionToolId,
} from '../../tool-registry'
import {
  getProductionReadinessSpec,
  runCoreCpuRenderReadinessChecks,
  runGpuAiReadinessChecks,
  runProductionToolReadiness,
} from '../production-readiness'
import {
  evaluateModelWeightManifestForMode,
  listGpuModelWeightManifestTemplates,
} from '../../model-weights'
import { listContainerImageReadinessManifest } from './container-image-readiness-manifest'
import { buildReadinessCommandPlans } from './readiness-command-plan-builder'
import {
  classifyProductionReadinessBlocker,
  type ProductionReadinessBlockerCandidate,
} from './production-readiness-blocker-policy'
import type {
  BuildProductionReadinessReportOptions,
  ProductionReadinessBlockerSummary,
  ProductionReadinessOverallStatus,
  ProductionReadinessReport,
  ReadinessImageSummary,
  ReadinessLicenseSummary,
  ReadinessModelWeightSummary,
  ReadinessToolSummary,
  ReadinessValidationStatus,
  ReadinessWorkerSummary,
} from './readiness-validation-types'

const reportWorkerTypes: ProductionRegistryWorkerType[] = [
  'api_service',
  'cpu_analysis_worker',
  'gpu_ai_worker',
  'render_worker',
  'qa_worker',
  'tool_readiness_worker',
]

const gpuWorkerOnlyToolIds = new Set<ProductionToolId>([
  'faster_whisper',
  'birefnet',
  'sam2',
  'kornia',
  'deepfilternet',
  'demucs',
  'real_esrgan',
  'film',
])

function mapReadinessStatus(status: string): ReadinessValidationStatus {
  if (status === 'needs_model_weight_review') return 'needs_model_weight_review'
  if (status === 'model_weight_missing') return 'model_weight_missing'
  if (status === 'model_weight_blocked') return 'model_weight_blocked'
  if (status === 'source_install_review_required') return 'source_install_review_required'

  const known: ReadinessValidationStatus[] = [
    'passed',
    'warning',
    'missing',
    'blocked',
    'not_checked',
    'not_installed',
    'future_only',
    'evaluation_only',
    'needs_license_review',
    'pending_manual_review',
  ]

  return known.includes(status as ReadinessValidationStatus)
    ? status as ReadinessValidationStatus
    : 'not_checked'
}

function statusBlocksProduction(status: ReadinessValidationStatus): boolean {
  return [
    'missing',
    'blocked',
    'evaluation_only',
    'needs_license_review',
    'needs_model_weight_review',
    'model_weight_missing',
    'model_weight_blocked',
  ].includes(status)
}

function statusIsWarning(status: ReadinessValidationStatus): boolean {
  return [
    'warning',
    'not_checked',
    'not_installed',
    'future_only',
    'pending_manual_review',
    'source_install_review_required',
  ].includes(status)
}

function dedupeBlockers(blockers: ProductionReadinessBlockerSummary[]): ProductionReadinessBlockerSummary[] {
  const seen = new Set<string>()
  const deduped: ProductionReadinessBlockerSummary[] = []

  for (const blocker of blockers) {
    if (seen.has(blocker.id)) continue
    seen.add(blocker.id)
    deduped.push(blocker)
  }

  return deduped
}

function buildToolBlockers(toolId: ProductionToolId, status: ReadinessValidationStatus): ProductionReadinessBlockerSummary[] {
  const profile = getProductionToolProfile(toolId)
  const candidates: ProductionReadinessBlockerCandidate[] = []

  if (profile?.launchCore && (status === 'missing' || status === 'not_checked')) {
    candidates.push({ kind: 'required_launch_core_missing', toolId, detail: `${profile.displayName} requires a passing readiness check.` })
  }

  if (profile?.modelWeightsRequired) {
    candidates.push({ kind: 'model_weight_missing', toolId, detail: `${profile.displayName} requires approved model-weight metadata and runtime mounts before production.` })
  }

  if (profile?.productionStatus === 'evaluation_only') {
    candidates.push({ kind: toolId === 'revideo' ? 'revideo_production_execution' : 'evaluation_only_production_execution', toolId, detail: `${profile.displayName} is evaluation-only.` })
  }

  if (profile?.productionStatus === 'future') {
    candidates.push({ kind: 'future_only_tool_not_installed', toolId, detail: `${profile.displayName} remains future-only.` })
  }

  if (toolId === 'openimageio' || toolId === 'opencolorio') {
    candidates.push({ kind: 'optional_openimageio_opencolorio_pending', toolId, detail: `${profile?.displayName ?? toolId} is optional/pending.` })
  }

  return candidates.map(classifyProductionReadinessBlocker)
}

function buildToolSummaries(): ReadinessToolSummary[] {
  const dryRun = runProductionToolReadiness({ dryRun: true })
  const resultByTool = new Map(dryRun.results.map((result) => [result.toolId, result]))

  return listProductionToolProfiles().map((profile) => {
    const spec = getProductionReadinessSpec(profile.toolId)
    const result = resultByTool.get(profile.toolId)
    const baseStatus = profile.modelWeightsRequired
      ? 'needs_model_weight_review'
      : mapReadinessStatus(result?.status ?? spec?.readinessStatusWhenMissing ?? 'not_checked')
    const status = profile.productionStatus === 'evaluation_only' ? 'evaluation_only' : baseStatus
    const blockers = buildToolBlockers(profile.toolId, status)

    return {
      toolId: profile.toolId,
      displayName: profile.displayName,
      status,
      expectedWorkerTypes: spec?.expectedWorkerTypes ?? [profile.workerType],
      imageRoles: spec?.imageRoles ?? [],
      requiredForProduction: Boolean(spec?.productionRequired || profile.launchCore),
      gpuRequired: profile.gpuRequired,
      modelWeightsRequired: profile.modelWeightsRequired,
      evaluationOnly: profile.productionStatus === 'evaluation_only',
      warnings: [
        ...(result?.warnings ?? []),
        ...(statusIsWarning(status) ? [`${profile.displayName} is ${status} in static readiness.`] : []),
      ],
      blockers,
    }
  })
}

function readinessScore(blockers: ProductionReadinessBlockerSummary[], warnings: string[], expectedTools: ProductionToolId[]): number {
  if (expectedTools.length === 0) return blockers.some((blocker) => blocker.severity === 'hard_blocker') ? 0 : 100
  const penalty = blockers.filter((blocker) => blocker.severity === 'hard_blocker').length * 20 +
    blockers.filter((blocker) => blocker.severity === 'warning').length * 6 +
    warnings.length * 2
  return Math.max(0, Math.min(100, 100 - penalty))
}

function buildImageSummaries(toolSummaries: ReadinessToolSummary[]): ReadinessImageSummary[] {
  const toolById = new Map(toolSummaries.map((tool) => [tool.toolId, tool]))
  return listContainerImageReadinessManifest().map((entry) => {
    const expectedTools = entry.expectedToolIds
    const expectedSummaries = expectedTools
      .map((toolId) => toolById.get(toolId))
      .filter((tool): tool is ReadinessToolSummary => Boolean(tool))
    const candidates: ProductionReadinessBlockerCandidate[] = []

    for (const toolId of entry.forbiddenToolIds) {
      if (expectedTools.includes(toolId)) {
        candidates.push({
          kind: toolId === 'revideo' ? 'revideo_production_execution' : 'gpu_tool_on_non_gpu_worker',
          toolId,
          imageRole: entry.imageRole,
          workerType: entry.workerType,
        })
      }
    }

    for (const tool of expectedSummaries) {
      if (entry.imageRole !== 'gpu_worker' && gpuWorkerOnlyToolIds.has(tool.toolId)) {
        candidates.push({
          kind: 'gpu_tool_on_non_gpu_worker',
          toolId: tool.toolId,
          imageRole: entry.imageRole,
          workerType: entry.workerType,
        })
      }
    }

    const policyBlockers = candidates.map(classifyProductionReadinessBlocker)
    const blockers = dedupeBlockers([
      ...policyBlockers,
      ...expectedSummaries.flatMap((tool) => tool.blockers.map((blocker) => ({
        ...blocker,
        imageRole: entry.imageRole,
        workerType: entry.workerType,
        id: `${entry.imageRole}_${blocker.id}`,
      }))),
    ])
    const warnings = [
      ...entry.notes,
      ...expectedSummaries.flatMap((tool) => tool.warnings),
    ]

    return {
      imageRole: entry.imageRole,
      imageName: entry.imageName,
      dockerfilePath: entry.dockerfilePath,
      expectedTools,
      requiredTools: entry.requiredToolIds,
      optionalTools: entry.optionalToolIds,
      forbiddenTools: entry.forbiddenToolIds,
      missingTools: expectedSummaries
        .filter((tool) => tool.status === 'missing' || tool.status === 'not_checked')
        .map((tool) => tool.toolId),
      blockedTools: expectedSummaries
        .filter((tool) => statusBlocksProduction(tool.status))
        .map((tool) => tool.toolId),
      modelWeightBlockedTools: expectedSummaries
        .filter((tool) => tool.modelWeightsRequired)
        .map((tool) => tool.toolId),
      evaluationOnlyTools: expectedSummaries
        .filter((tool) => tool.evaluationOnly)
        .map((tool) => tool.toolId),
      readinessScore: readinessScore(blockers, warnings, expectedTools),
      productionAllowed: !blockers.some((blocker) => blocker.severity === 'hard_blocker'),
      blockers,
      warnings,
    }
  })
}

function buildWorkerSummaries(imageSummaries: ReadinessImageSummary[]): ReadinessWorkerSummary[] {
  return reportWorkerTypes.map((workerType) => {
    const image = imageSummaries.find((summary) => {
      if (workerType === 'api_service') return summary.imageRole === 'api'
      if (workerType === 'cpu_analysis_worker') return summary.imageRole === 'cpu_worker'
      if (workerType === 'gpu_ai_worker') return summary.imageRole === 'gpu_worker'
      if (workerType === 'render_worker') return summary.imageRole === 'render_worker'
      if (workerType === 'qa_worker') return summary.imageRole === 'qa_worker'
      return summary.imageRole === 'tool_readiness_worker'
    })

    return {
      workerType,
      imageRole: image?.imageRole,
      expectedTools: image?.expectedTools ?? [],
      requiredTools: image?.requiredTools ?? [],
      optionalTools: image?.optionalTools ?? [],
      missingTools: image?.missingTools ?? [],
      blockedTools: image?.blockedTools ?? [],
      modelWeightBlockedTools: image?.modelWeightBlockedTools ?? [],
      evaluationOnlyTools: image?.evaluationOnlyTools ?? [],
      readinessScore: image?.readinessScore ?? 0,
      productionAllowed: image?.productionAllowed ?? false,
      blockers: image?.blockers ?? [],
      warnings: image?.warnings ?? [],
    }
  })
}

function buildModelWeightSummaries(): ReadinessModelWeightSummary[] {
  return listGpuModelWeightManifestTemplates().map((template) => {
    const evaluation = evaluateModelWeightManifestForMode(template, 'production_ready')
    const status: ReadinessValidationStatus = evaluation.allowedForProduction
      ? 'passed'
      : template.license.toLowerCase() === 'unknown' || template.commercialUseStatus === 'unknown'
        ? 'needs_model_weight_review'
        : 'model_weight_blocked'

    return {
      manifestId: template.id,
      toolId: template.toolId,
      modelName: template.modelName,
      expectedPath: template.expectedPath,
      status,
      reviewStatus: template.reviewStatus,
      commercialUseAllowed: template.commercialUseAllowed,
      blocksProduction: !evaluation.allowedForProduction,
      warnings: evaluation.warnings,
      blockers: evaluation.blockingReasons,
    }
  })
}

function buildLicenseSummaries(modelWeightSummaries: ReadinessModelWeightSummary[]): ReadinessLicenseSummary[] {
  const core = runCoreCpuRenderReadinessChecks({ realCheckMode: false })
  const gpu = runGpuAiReadinessChecks({ dryRun: true })
  return [
    {
      id: 'ffmpeg_lgpl_commercial_build',
      toolId: 'ffmpeg',
      status: mapReadinessStatus(core.report.ffmpegLgplVerificationStatus),
      message: 'FFmpeg commercial LGPL-safe build verification remains pending manual review.',
      manualReviewRequired: true,
    },
    {
      id: 'libass_subtitle_support',
      toolId: 'libass',
      status: core.report.libassSubtitleSupportStatus === 'passed' ? 'passed' : 'pending_manual_review',
      message: 'libass subtitle support may be pending manual verification unless explicitly checked.',
      manualReviewRequired: true,
    },
    {
      id: 'gpu_model_weight_license_review',
      status: gpu.report.modelWeightReadiness === 'blocked' ? 'needs_model_weight_review' : mapReadinessStatus(gpu.report.modelWeightReadiness),
      message: `GPU model-weight readiness has ${modelWeightSummaries.filter((summary) => summary.blocksProduction).length} production blockers.`,
      manualReviewRequired: true,
    },
    {
      id: 'revideo_evaluation_only',
      toolId: 'revideo',
      status: 'evaluation_only',
      message: 'Revideo remains evaluation-only and production-blocked.',
      manualReviewRequired: true,
    },
  ]
}

function buildGlobalBlockers(
  toolSummaries: ReadinessToolSummary[],
  imageSummaries: ReadinessImageSummary[],
  modelWeightSummaries: ReadinessModelWeightSummary[],
  licenseSummaries: ReadinessLicenseSummary[],
): ProductionReadinessBlockerSummary[] {
  const modelWeightBlockers = modelWeightSummaries.flatMap((summary) => {
    const candidates: ProductionReadinessBlockerCandidate[] = []
    if (summary.status === 'needs_model_weight_review') {
      candidates.push({ kind: 'unknown_model_weight_license', toolId: summary.toolId, detail: `${summary.manifestId} is ${summary.reviewStatus}.` })
    }
    if (summary.status === 'model_weight_blocked') {
      candidates.push({ kind: 'model_weight_blocked', toolId: summary.toolId, detail: `${summary.manifestId} is blocked.` })
    }
    if (!summary.commercialUseAllowed) {
      candidates.push({ kind: 'non_commercial_model_weight', toolId: summary.toolId, detail: `${summary.manifestId} is not commercially approved.` })
    }
    return candidates.map(classifyProductionReadinessBlocker)
  })

  const licenseBlockers = licenseSummaries
    .filter((summary) => summary.status === 'pending_manual_review')
    .map((summary) => classifyProductionReadinessBlocker({
      kind: summary.toolId === 'ffmpeg' ? 'ffmpeg_lgpl_pending' : 'libass_pending_manual_verification',
      toolId: summary.toolId,
    }))

  return dedupeBlockers([
    ...toolSummaries.flatMap((tool) => tool.blockers),
    ...imageSummaries.flatMap((image) => image.blockers),
    ...modelWeightBlockers,
    ...licenseBlockers,
  ])
}

function overallStatus(blockers: ProductionReadinessBlockerSummary[], warnings: string[]): ProductionReadinessOverallStatus {
  if (blockers.some((blocker) => blocker.severity === 'hard_blocker')) return 'blocked'
  if (blockers.length > 0 || warnings.length > 0) return 'warning'
  return 'passed'
}

export function buildProductionReadinessReport(
  options: BuildProductionReadinessReportOptions = {},
): ProductionReadinessReport {
  const mode = options.mode ?? 'static_only'
  const toolSummaries = buildToolSummaries()
  const imageSummaries = buildImageSummaries(toolSummaries)
  const workerSummaries = buildWorkerSummaries(imageSummaries)
  const modelWeightSummaries = buildModelWeightSummaries()
  const licenseSummaries = buildLicenseSummaries(modelWeightSummaries)
  const blockerSummaries = buildGlobalBlockers(toolSummaries, imageSummaries, modelWeightSummaries, licenseSummaries)
  const warnings = dedupeBlockers(blockerSummaries)
    .filter((blocker) => blocker.severity === 'warning')
    .map((blocker) => blocker.message)

  return {
    id: `prod-readiness-${mode}-${new Date().toISOString()}`,
    createdAt: new Date().toISOString(),
    mode,
    overallStatus: overallStatus(blockerSummaries, warnings),
    workerSummaries,
    toolSummaries,
    imageSummaries,
    modelWeightSummaries,
    licenseSummaries,
    blockerSummaries,
    commandPlans: options.includeCommandPlans === false ? [] : buildReadinessCommandPlans(),
    warnings,
    nextActions: [
      'Review hard blockers before enabling production execution.',
      'Run static readiness before any human-built container readiness checks.',
      'Build production images manually in a later approved step; M12 does not build or push images.',
      'Complete FFmpeg LGPL, libass, source-install, and model-weight license reviews before production-ready execution.',
    ],
  }
}
