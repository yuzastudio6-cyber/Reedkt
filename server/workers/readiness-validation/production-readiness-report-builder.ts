import { existsSync, readFileSync } from 'node:fs'
import {
  getProductionToolProfile,
  isProductionToolId,
  listProductionToolProfiles,
  type ProductionRegistryWorkerType,
  type ProductionToolId,
} from '../../tool-registry'
import { resolveProfessionalToolAdapterContract } from '../../tool-registry/professional-tool-adapter-contracts'
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
  buildMissingDeployedToolReleaseQualificationEvidence,
  buildMissingProductionImageQualificationEvidence,
  getCanonicalPrivateToolReadinessEvidence,
  summarizeCanonicalToolReadinessEvidence,
} from './canonical-tool-readiness-evidence'
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
  ProductionReadinessActionPlan,
  ProductionReadinessActionStage,
  ProductionReadinessSourceDeclarationEvidence,
  ProductionReadinessSourceDeclarationKind,
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
  'kornia',
  'deepfilternet',
  'rembg',
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
  const privateEvidence = getCanonicalPrivateToolReadinessEvidence(toolId)
  const candidates: ProductionReadinessBlockerCandidate[] = []

  if (profile?.launchCore && (status === 'missing' || status === 'not_checked')) {
    candidates.push({
      kind: privateEvidence.privateInternalBoundaryContractReady
        ? 'required_launch_core_boundary_release_missing'
        : 'required_launch_core_missing',
      toolId,
      detail: privateEvidence.privateInternalBoundaryContractReady
        ? `${profile.displayName} requires a same-source deployed integration receipt; its source-verified boundary contract does not satisfy that release gate and must never be promoted through a worker image.`
        : `${profile.displayName} requires a same-source production-image readiness receipt; any retained private lifecycle proof does not satisfy this gate.`,
    })
  }

  if (profile?.modelWeightsRequired) {
    candidates.push({ kind: 'model_weight_missing', toolId, detail: `${profile.displayName} requires approved model-weight metadata and runtime mounts before production.` })
  }

  if (profile?.productionStatus === 'evaluation_only') {
    candidates.push({
      kind: 'evaluation_only_production_execution',
      toolId,
      detail: `${profile.displayName} is evaluation-only.`,
    })
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
      statusScope: 'production_image_and_release_qualification' as const,
      status,
      canonicalPrivateEvidence: getCanonicalPrivateToolReadinessEvidence(profile.toolId),
      productionImageQualification: buildMissingProductionImageQualificationEvidence(),
      deployedReleaseQualification: buildMissingDeployedToolReleaseQualificationEvidence(),
      expectedWorkerTypes: spec?.expectedWorkerTypes ?? [profile.workerType],
      imageRoles: spec?.imageRoles ?? [],
      requiredForProduction: Boolean(spec?.productionRequired || profile.launchCore),
      gpuRequired: profile.gpuRequired,
      modelWeightsRequired: profile.modelWeightsRequired,
      evaluationOnly: profile.productionStatus === 'evaluation_only',
      warnings: [
        ...(result?.warnings ?? []),
        ...(statusIsWarning(status) ? [`${profile.displayName} production qualification is ${status} in static readiness.`] : []),
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
          kind: 'gpu_tool_on_non_gpu_worker',
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
  return listGpuModelWeightManifestTemplates().flatMap((template) => {
    const toolId = template.toolId
    if (!isProductionToolId(toolId)) return []

    const evaluation = evaluateModelWeightManifestForMode(template, 'production_ready')
    const status: ReadinessValidationStatus = evaluation.allowedForProduction
      ? 'passed'
      : template.license.toLowerCase() === 'unknown' || template.commercialUseStatus === 'unknown'
        ? 'needs_model_weight_review'
        : 'model_weight_blocked'

    return {
      manifestId: template.id,
      toolId,
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

function uniqueToolIds(toolIds: ProductionToolId[]): ProductionToolId[] {
  return [...new Set(toolIds)]
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)]
}

function adapterContractToolIds(toolIds: ProductionToolId[]): ProductionToolId[] {
  return uniqueToolIds(toolIds.filter((toolId) => Boolean(resolveProfessionalToolAdapterContract(toolId))))
}

function missingProductionToolIds(toolIds: ProductionToolId[], toolSummaries: ReadinessToolSummary[]): ProductionToolId[] {
  const summaryByToolId = new Map(toolSummaries.map((tool) => [tool.toolId, tool.status]))
  return uniqueToolIds(toolIds.filter((toolId) => summaryByToolId.get(toolId) !== 'passed'))
}

type StaticDeclarationFile = {
  path: string
  kind: ProductionReadinessSourceDeclarationKind
  text: string
  packageNames?: Set<string>
}

const sourceDeclarationFilePaths: Array<Omit<StaticDeclarationFile, 'text' | 'packageNames'>> = [
  { path: 'package.json', kind: 'node_package_manifest' },
  { path: 'docker/prod/cpu-worker/Dockerfile', kind: 'dockerfile' },
  { path: 'docker/prod/render-worker/Dockerfile', kind: 'dockerfile' },
  { path: 'docker/prod/qa-worker/Dockerfile', kind: 'dockerfile' },
  { path: 'docker/prod/tool-readiness-worker/Dockerfile', kind: 'dockerfile' },
  { path: 'docker/prod/gpu-worker/Dockerfile', kind: 'dockerfile' },
  { path: 'docker/prod/cpu-worker/requirements.cpu.txt', kind: 'python_requirements' },
  { path: 'docker/prod/render-worker/requirements.render.txt', kind: 'python_requirements' },
  { path: 'docker/prod/qa-worker/requirements.qa.txt', kind: 'python_requirements' },
  { path: 'docker/prod/tool-readiness-worker/requirements.readiness.txt', kind: 'python_requirements' },
  { path: 'docker/prod/gpu-worker/requirements.gpu.txt', kind: 'python_requirements' },
  { path: 'server/workers/timeline/hyperframe-timeline-bridge.ts', kind: 'internal_integration_boundary' },
  { path: 'server/workers/timeline/timeline-worker-types.ts', kind: 'internal_integration_boundary' },
]

function normalizePackageName(value: string): string {
  return value.trim().toLowerCase()
}

function stripCommentLines(text: string): string {
  return text.split(/\r?\n/)
    .filter((line) => !line.trim().startsWith('#'))
    .join('\n')
}

function parseRequirementPackageNames(text: string): Set<string> {
  const names = text.split(/\r?\n/)
    .map((line) => line.replace(/#.*/, '').trim())
    .filter(Boolean)
    .map((line) => line.split(/[<>=~!;\s]|\[/, 1)[0])
    .filter(Boolean)
    .map(normalizePackageName)

  return new Set(names)
}

function parsePackageJsonNames(text: string): Set<string> {
  try {
    const parsed = JSON.parse(text) as {
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
      optionalDependencies?: Record<string, string>
    }
    return new Set([
      ...Object.keys(parsed.dependencies ?? {}),
      ...Object.keys(parsed.devDependencies ?? {}),
      ...Object.keys(parsed.optionalDependencies ?? {}),
    ].map(normalizePackageName))
  } catch {
    return new Set()
  }
}

function readStaticDeclarationFiles(): StaticDeclarationFile[] {
  return sourceDeclarationFilePaths.flatMap((file) => {
    if (!existsSync(file.path)) return []
    const rawText = readFileSync(file.path, 'utf8')
    const text = file.kind === 'dockerfile' ? stripCommentLines(rawText) : rawText
    const packageNames = file.kind === 'python_requirements'
      ? parseRequirementPackageNames(rawText)
      : file.kind === 'node_package_manifest'
        ? parsePackageJsonNames(rawText)
        : undefined

    return [{ ...file, text: text.toLowerCase(), packageNames }]
  })
}

function sourceDeclarationPatterns(toolId: ProductionToolId): string[] {
  const spec = getProductionReadinessSpec(toolId)
  const patterns = [
    ...(spec?.commandChecks.map((check) => check.command) ?? []),
    ...(spec?.pythonImportChecks.map((check) => check.packageName) ?? []),
    ...(spec?.nodePackageChecks.map((check) => check.packageName) ?? []),
  ]
  const aliases: Partial<Record<ProductionToolId, string[]>> = {
    ffprobe: ['ffmpeg'],
    libass: ['libass9', 'libass-dev', 'libass'],
    sharp: ['sharp', 'libvips42', 'libvips-dev'],
    pydub_effects: ['pydub'],
    ebu_r128_pyloudnorm: ['pyloudnorm'],
    signalsmith_stretch: ['signalsmith-stretch', 'signalsmith_stretch'],
  }

  return uniqueStrings([...patterns, ...(aliases[toolId] ?? [])])
    .map((pattern) => normalizePackageName(String(pattern)))
    .filter(Boolean)
}

function buildSourceDeclarationEvidence(toolIds: ProductionToolId[]): ProductionReadinessSourceDeclarationEvidence[] {
  const files = readStaticDeclarationFiles()

  return uniqueToolIds(toolIds).flatMap((toolId) => {
    const patterns = sourceDeclarationPatterns(toolId)
    const matchedFiles = files.filter((file) => patterns.some((pattern) => {
      if (file.packageNames?.has(pattern)) return true
      return file.text.includes(pattern)
    }))

    if (matchedFiles.length === 0) return []

    return [{
      toolId,
      sources: [...new Set(matchedFiles.map((file) => file.path))],
      evidenceKinds: [...new Set(matchedFiles.map((file) => file.kind))],
      runtimeProofRequired: true,
      productReady: false,
    }]
  })
}

function declaredSourceToolIds(toolIds: ProductionToolId[]): ProductionToolId[] {
  return buildSourceDeclarationEvidence(toolIds).map((evidence) => evidence.toolId)
}

function missingSourceDeclarationToolIds(toolIds: ProductionToolId[]): ProductionToolId[] {
  const declared = new Set(declaredSourceToolIds(toolIds))
  return uniqueToolIds(toolIds.filter((toolId) => !declared.has(toolId)))
}

function stageStatus(toolIds: ProductionToolId[], blockerCount: number): ProductionReadinessActionStage['status'] {
  if (toolIds.length === 0 && blockerCount === 0) return 'passed'
  return blockerCount > 0 || toolIds.length > 0 ? 'blocked' : 'pending_evidence'
}

function transitionSummary(toolIds: ProductionToolId[], toolSummaries: ReadinessToolSummary[]): string {
  const adapterToolIds = adapterContractToolIds(toolIds)
  const missingToolIds = missingProductionToolIds(toolIds, toolSummaries)
  const declaredToolIds = declaredSourceToolIds(toolIds)
  const canonicalPrivateToolIds = toolSummaries
    .filter((tool) => toolIds.includes(tool.toolId))
    .filter((tool) => tool.canonicalPrivateEvidence.privateInternalEndToEndReady)
    .map((tool) => tool.toolId)
  const canonicalBoundaryToolIds = toolSummaries
    .filter((tool) => toolIds.includes(tool.toolId))
    .filter((tool) => tool.canonicalPrivateEvidence.privateInternalBoundaryContractReady)
    .map((tool) => tool.toolId)
  const executableToolCount = toolIds.length - canonicalBoundaryToolIds.length
  const privateProofSummary = canonicalBoundaryToolIds.length > 0
    ? `${canonicalPrivateToolIds.length}/${executableToolCount} executable tool(s) have canonical private end-to-end proof and ${canonicalBoundaryToolIds.length}/${canonicalBoundaryToolIds.length} non-executable integration boundary has a canonical contract proof`
    : `${canonicalPrivateToolIds.length} tool(s) have canonical private end-to-end proof`
  if (adapterToolIds.length === 0) {
    return `${privateProofSummary}; ${declaredToolIds.length} have static source declarations, but ${missingToolIds.length} still need production image/release evidence; none are currently represented by backend bounded adapter contracts.`
  }
  const releaseEvidenceSummary = canonicalBoundaryToolIds.length > 0
    ? 'same-source production-image evidence for executable tools or deployed-integration evidence for the non-executable boundary'
    : 'same-source production image and deployed-release evidence'
  return `${privateProofSummary}; ${adapterToolIds.length} have backend bounded adapter contracts, and ${declaredToolIds.length} have static source declarations, but ${missingToolIds.length} still need ${releaseEvidenceSummary} before external beta or production.`
}

function privateEvidenceToolIds(
  toolIds: ProductionToolId[],
  toolSummaries: ReadinessToolSummary[],
  key: 'privateInternalRunnerReady' | 'privateInternalEndToEndReady' | 'privateInternalJobAdapterReady' | 'privateInternalBoundaryContractReady',
): ProductionToolId[] {
  return uniqueToolIds(toolSummaries
    .filter((tool) => toolIds.includes(tool.toolId) && tool.canonicalPrivateEvidence[key])
    .map((tool) => tool.toolId))
}

function privateEvidenceFields(
  toolIds: ProductionToolId[],
  toolSummaries: ReadinessToolSummary[],
): Pick<
  ProductionReadinessActionStage,
  'canonicalPrivateRunnerVerifiedToolIds' |
  'canonicalPrivateEndToEndVerifiedToolIds' |
  'canonicalPrivateJobAdapterVerifiedToolIds' |
  'canonicalPrivateBoundaryContractVerifiedToolIds'
> {
  return {
    canonicalPrivateRunnerVerifiedToolIds: privateEvidenceToolIds(
      toolIds,
      toolSummaries,
      'privateInternalRunnerReady',
    ),
    canonicalPrivateEndToEndVerifiedToolIds: privateEvidenceToolIds(
      toolIds,
      toolSummaries,
      'privateInternalEndToEndReady',
    ),
    canonicalPrivateJobAdapterVerifiedToolIds: privateEvidenceToolIds(
      toolIds,
      toolSummaries,
      'privateInternalJobAdapterReady',
    ),
    canonicalPrivateBoundaryContractVerifiedToolIds: privateEvidenceToolIds(
      toolIds,
      toolSummaries,
      'privateInternalBoundaryContractReady',
    ),
  }
}

function buildActionPlan(
  reportStatus: ProductionReadinessOverallStatus,
  toolSummaries: ReadinessToolSummary[],
  blockerSummaries: ProductionReadinessBlockerSummary[],
  modelWeightSummaries: ReadinessModelWeightSummary[],
  licenseSummaries: ReadinessLicenseSummary[],
): ProductionReadinessActionPlan {
  const launchCoreTools = uniqueToolIds(toolSummaries
    .filter((tool) => tool.requiredForProduction && tool.status !== 'passed')
    .map((tool) => tool.toolId))
  const modelWeightTools = uniqueToolIds([
    ...toolSummaries.filter((tool) => tool.modelWeightsRequired && tool.status !== 'passed').map((tool) => tool.toolId),
    ...modelWeightSummaries.filter((summary) => summary.blocksProduction).map((summary) => summary.toolId),
  ])
  const optionalAdapterTools = uniqueToolIds(toolSummaries
    .filter((tool) => !tool.requiredForProduction && !tool.modelWeightsRequired && !tool.evaluationOnly)
    .filter((tool) => ['not_installed', 'needs_license_review', 'source_install_review_required', 'pending_manual_review'].includes(tool.status))
    .map((tool) => tool.toolId))
  const evaluationFutureTools = uniqueToolIds(toolSummaries
    .filter((tool) => ['evaluation_only', 'future_only'].includes(tool.status))
    .map((tool) => tool.toolId))

  const blockerCountFor = (toolIds: ProductionToolId[]) => blockerSummaries
    .filter((blocker) => blocker.toolId && toolIds.includes(blocker.toolId as ProductionToolId))
    .filter((blocker) => blocker.severity === 'hard_blocker')
    .length

  const launchCoreBlockerCount = blockerCountFor(launchCoreTools)
  const modelWeightBlockerCount = blockerCountFor(modelWeightTools) +
    modelWeightSummaries.filter((summary) => summary.blocksProduction).length
  const optionalAdapterBlockerCount = blockerCountFor(optionalAdapterTools)
  const evaluationFutureBlockerCount = blockerCountFor(evaluationFutureTools)
  const manualLicenseCount = licenseSummaries.filter((summary) => summary.manualReviewRequired && summary.status !== 'passed').length
  const launchCoreSourceMissing = missingSourceDeclarationToolIds(launchCoreTools)

  const stages: ProductionReadinessActionStage[] = [
    {
      id: 'launch_core_container_readiness',
      status: stageStatus(launchCoreTools, launchCoreBlockerCount),
      title: 'Launch-core container readiness',
      summary: launchCoreTools.length > 0
        ? `${launchCoreTools.length} launch-core identities still need production-image and deployed-release evidence.`
        : 'Launch-core tools have production readiness evidence.',
      toolIds: launchCoreTools,
      adapterContractToolIds: adapterContractToolIds(launchCoreTools),
      productionReadinessMissingToolIds: missingProductionToolIds(launchCoreTools, toolSummaries),
      sourceDeclarationToolIds: declaredSourceToolIds(launchCoreTools),
      sourceDeclarationMissingToolIds: launchCoreSourceMissing,
      sourceDeclarationEvidence: buildSourceDeclarationEvidence(launchCoreTools),
      ...privateEvidenceFields(launchCoreTools, toolSummaries),
      blockerCount: launchCoreBlockerCount,
      requiredEvidence: [
        'Immutable production image digest bound to the exact source commit and tree.',
        'Bounded container runtime candidate receipt for required and forbidden tools with no media processing.',
        'Independent same-source/image verification of the candidate receipt.',
        'Manual license review where the package has production licensing obligations.',
      ],
      nextActions: [
        ...(launchCoreSourceMissing.length > 0
          ? [`Resolve approved source declarations before runtime proof for: ${launchCoreSourceMissing.join(', ')}.`]
          : []),
        'Run the approved candidate-receipt command plan for all six immutable production images.',
        'Independently verify exact package evidence, image digests, source identity, and license notes before promoting any worker.',
      ],
      safetyBoundary: 'Does not authorize provider calls, user media processing, public delivery, billing, beta, or production traffic.',
      transitionSummary: transitionSummary(launchCoreTools, toolSummaries),
    },
    {
      id: 'model_weight_license_mount_approval',
      status: stageStatus(modelWeightTools, modelWeightBlockerCount),
      title: 'Model-weight, license, and mount approval',
      summary: modelWeightTools.length > 0
        ? `${modelWeightTools.length} model-backed tools need approved model/license/mount evidence.`
        : 'Model-backed tools have approved model/license/mount evidence.',
      toolIds: modelWeightTools,
      adapterContractToolIds: adapterContractToolIds(modelWeightTools),
      productionReadinessMissingToolIds: missingProductionToolIds(modelWeightTools, toolSummaries),
      sourceDeclarationToolIds: declaredSourceToolIds(modelWeightTools),
      sourceDeclarationMissingToolIds: missingSourceDeclarationToolIds(modelWeightTools),
      sourceDeclarationEvidence: buildSourceDeclarationEvidence(modelWeightTools),
      ...privateEvidenceFields(modelWeightTools, toolSummaries),
      blockerCount: modelWeightBlockerCount,
      requiredEvidence: [
        'Approved commercial-use model-weight manifest.',
        'Private storage or image mount path with checksum/version metadata.',
        'Runtime check proving model discovery without downloads or public artifacts.',
      ],
      nextActions: [
        'Review each model-backed tool separately before production promotion.',
        'Keep evaluation-only tools excluded unless a later owner decision changes their status.',
      ],
      safetyBoundary: 'Does not authorize model downloads, public model artifacts, or production inference.',
      transitionSummary: transitionSummary(modelWeightTools, toolSummaries),
    },
    {
      id: 'optional_adapter_promotion',
      status: optionalAdapterTools.length > 0 || optionalAdapterBlockerCount > 0 ? 'pending_evidence' : 'passed',
      title: 'Optional adapter promotion',
      summary: optionalAdapterTools.length > 0
        ? `${optionalAdapterTools.length} optional/non-core adapters are not production-promoted yet.`
        : 'No optional adapter promotion is blocking the core production path.',
      toolIds: optionalAdapterTools,
      adapterContractToolIds: adapterContractToolIds(optionalAdapterTools),
      productionReadinessMissingToolIds: missingProductionToolIds(optionalAdapterTools, toolSummaries),
      sourceDeclarationToolIds: declaredSourceToolIds(optionalAdapterTools),
      sourceDeclarationMissingToolIds: missingSourceDeclarationToolIds(optionalAdapterTools),
      sourceDeclarationEvidence: buildSourceDeclarationEvidence(optionalAdapterTools),
      ...privateEvidenceFields(optionalAdapterTools, toolSummaries),
      blockerCount: optionalAdapterBlockerCount,
      requiredEvidence: [
        'Adapter package/runtime proof in the intended worker image.',
        'Private artifact manifest proof for adapter output.',
        'QA handoff proof that hides internal tool names from user-facing UI.',
      ],
      nextActions: [
        'Promote optional adapters only when a product workflow actually needs them.',
        'Keep product-ready counts at zero until private QA and owner approval exist.',
      ],
      safetyBoundary: 'Optional adapter promotion must remain backend-gated and private-artifact-only.',
      transitionSummary: transitionSummary(optionalAdapterTools, toolSummaries),
    },
    {
      id: 'evaluation_future_scope_decision',
      status: evaluationFutureTools.length > 0 || evaluationFutureBlockerCount > 0 ? 'pending_evidence' : 'passed',
      title: 'Evaluation-only and future scope decision',
      summary: evaluationFutureTools.length > 0
        ? `${evaluationFutureTools.length} tools are future-only or evaluation-only and need an explicit scope decision.`
        : 'No evaluation-only or future-only tools remain in the production path.',
      toolIds: evaluationFutureTools,
      adapterContractToolIds: adapterContractToolIds(evaluationFutureTools),
      productionReadinessMissingToolIds: missingProductionToolIds(evaluationFutureTools, toolSummaries),
      sourceDeclarationToolIds: declaredSourceToolIds(evaluationFutureTools),
      sourceDeclarationMissingToolIds: missingSourceDeclarationToolIds(evaluationFutureTools),
      sourceDeclarationEvidence: buildSourceDeclarationEvidence(evaluationFutureTools),
      ...privateEvidenceFields(evaluationFutureTools, toolSummaries),
      blockerCount: evaluationFutureBlockerCount,
      requiredEvidence: [
        'Owner decision to keep excluded, replace, or promote through a separate approval lane.',
        'License/source review before any evaluation-only tool can become production eligible.',
      ],
      nextActions: [
        'Do not unblock future/evaluation tools by default.',
        'Prefer replacement or exclusion until a clean owner-approved source path exists.',
      ],
      safetyBoundary: 'Future/evaluation tools remain out of production execution until a separate owner gate passes.',
      transitionSummary: transitionSummary(evaluationFutureTools, toolSummaries),
    },
    {
      id: 'deployment_billing_release_evidence',
      status: reportStatus === 'passed' && manualLicenseCount === 0 ? 'pending_evidence' : 'blocked',
      title: 'Deployment, billing, and release evidence',
      summary: reportStatus === 'passed'
        ? 'Tool readiness can move to deployment, billing, observability, legal, and release evidence review.'
        : 'Deployment, billing, and release review waits until tool readiness blockers are resolved.',
      toolIds: [],
      adapterContractToolIds: [],
      productionReadinessMissingToolIds: [],
      sourceDeclarationToolIds: [],
      sourceDeclarationMissingToolIds: [],
      sourceDeclarationEvidence: [],
      ...privateEvidenceFields([], toolSummaries),
      blockerCount: reportStatus === 'passed' ? 0 : blockerSummaries.filter((blocker) => blocker.severity === 'hard_blocker').length,
      requiredEvidence: [
        'Deployment approval and environment readback.',
        'Persistent billing/ledger approval with no silent charging.',
        'Incident runbook, observability, storage/privacy, security, and legal approval.',
      ],
      nextActions: [
        'Keep internal testing separate from external beta and paid production readiness.',
        'Allow launch-stage graduation only through evidence-gated readiness inputs.',
      ],
      safetyBoundary: 'No external beta, paid production, public delivery, or billing mutation is authorized by static readiness.',
      transitionSummary: 'Deployment and billing evidence waits until tool readiness, model/license, and adapter promotion gates are complete.',
    },
  ]

  return {
    status: stages.every((stage) => stage.status === 'passed') ? 'production_ready' : 'blocked_by_evidence_gates',
    currentSafeStage: 'internal_testing',
    stages,
  }
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
  const reportStatus = overallStatus(blockerSummaries, warnings)

  return {
    id: `prod-readiness-${mode}-${new Date().toISOString()}`,
    createdAt: new Date().toISOString(),
    mode,
    overallStatus: reportStatus,
    evidenceTiers: summarizeCanonicalToolReadinessEvidence(),
    workerSummaries,
    toolSummaries,
    imageSummaries,
    modelWeightSummaries,
    licenseSummaries,
    blockerSummaries,
    commandPlans: options.includeCommandPlans === false ? [] : buildReadinessCommandPlans(),
    warnings,
    actionPlan: buildActionPlan(reportStatus, toolSummaries, blockerSummaries, modelWeightSummaries, licenseSummaries),
    nextActions: [
      'Review hard blockers before enabling production execution.',
      'Run static readiness before any human-built container readiness checks.',
      'Build production images only in a separately approved human-run step; this source workflow does not build or push images.',
      'Complete FFmpeg LGPL, libass, source-install, and model-weight license reviews before production-ready execution.',
    ],
  }
}
