import { getFrontendInstalledTools, getFrontendWorkerOnlyTools } from './tool-install-status'
import { openSourceToolProfiles } from './tool-registry'
import type {
  EditPlan,
  LicenseReviewStatus,
  OpenSourceToolId,
  ProductionReadinessCheck,
  ProductionReadinessReport,
  ProductionReadinessStatus,
  ProviderModel,
  ToolLicenseReview,
} from '../types/reeditpro'

type CreateProductionReadinessReportParams = {
  plan?: EditPlan
}

const providerModels: ProviderModel[] = [
  'gpt_image_2',
  'wan_2_2_kf2v_flash',
  'wan_2_6_i2v_flash',
  'hailuo_2_3_fast',
  'hailuo_02',
  'veo_3_1_lite',
]

const reportLimitations = [
  'This is not legal advice.',
  'No production legal review has been completed.',
  'No backend workers or provider clients are implemented.',
  'Frontend previews are mock-only.',
]

function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values))
}

function check(params: ProductionReadinessCheck): ProductionReadinessCheck {
  return params
}

function productionStatusForReview(reviewStatus: LicenseReviewStatus): ProductionReadinessStatus {
  if (reviewStatus === 'approved' || reviewStatus === 'approved_with_conditions') {
    return 'approved_for_prototype'
  }

  if (reviewStatus === 'rejected') {
    return 'blocked'
  }

  return 'needs_license_review'
}

function modelsFromPlan(plan?: EditPlan): ProviderModel[] {
  if (!plan) {
    return providerModels
  }

  return unique([
    ...providerModels,
    ...(plan.providerPromptPlans ?? []).map((prompt) => prompt.providerModel),
    ...(plan.visualAssetPlan ?? []).flatMap((asset) => [
      asset.providerRoute.primaryModel,
      ...asset.providerRoute.fallbackModels,
      ...(asset.providerRoute.fallbackSteps.map((step) => step.model).filter(Boolean) as ProviderModel[]),
    ]),
    ...(plan.workerRuntimePlan?.providerModelsReferenced ?? []),
  ]).filter((model) => model !== 'none' && model !== 'remotion_editor_motion' && model !== 'svg_lottie_renderer')
}

export function createToolLicenseReviews(): ToolLicenseReview[] {
  return openSourceToolProfiles.map((tool) => tool.licenseReview ?? {
    toolId: tool.id,
    toolLabel: tool.label,
    productionClass: tool.productionClass ?? 'planning_only_tool',
    licenseRisk: 'unknown',
    reviewStatus: 'not_reviewed',
    commercialUseReviewed: false,
    notes: [
      'License review metadata is missing; treat as not reviewed.',
      'This metadata is not legal advice.',
    ],
  })
}

function providerChecks(plan?: EditPlan): ProductionReadinessCheck[] {
  const editLevel = plan?.compiledIntent?.resolvedSettings.editLevel ?? plan?.creditEstimate.editLevel
  const visualAssets = plan?.visualAssetPlan ?? []
  const basicProVeo = editLevel !== 'premium' && visualAssets.some((asset) =>
    asset.providerRoute.primaryModel === 'veo_3_1_lite' ||
    asset.providerRoute.fallbackModels.includes('veo_3_1_lite') ||
    asset.providerRoute.fallbackSteps.some((step) => step.model === 'veo_3_1_lite'),
  )
  const primaryVeo = visualAssets.some((asset) => asset.providerRoute.primaryModel === 'veo_3_1_lite')
  const providerAsTool = openSourceToolProfiles.some((tool) =>
    providerModels.includes(tool.id as ProviderModel),
  )

  return [
    check({
      id: 'production-provider-separation',
      category: 'provider_terms',
      label: 'Provider models stay separate',
      status: providerAsTool ? 'blocked' : 'planning_only',
      severity: providerAsTool ? 'blocking' : 'info',
      message: 'GPT-Image-2, Wan, Hailuo, and Veo are provider models, not open-source tools.',
      recommendation: 'Keep provider model routing in provider prompts/routes, not the tool registry.',
    }),
    check({
      id: 'production-basic-pro-no-veo',
      category: 'model_tier_policy',
      label: 'Basic/Pro no Veo',
      status: basicProVeo ? 'blocked' : 'planning_only',
      severity: basicProVeo ? 'blocking' : 'info',
      message: 'Basic and Pro must never use Veo.',
      recommendation: 'Use Wan primary and Hailuo fallback unless Premium final-rescue routing is approved.',
      relatedProviderModel: 'veo_3_1_lite',
    }),
    check({
      id: 'production-veo-not-primary',
      category: 'model_tier_policy',
      label: 'Veo never primary/default',
      status: primaryVeo ? 'blocked' : 'planning_only',
      severity: primaryVeo ? 'blocking' : 'info',
      message: 'Veo must not be treated as primary/default.',
      recommendation: 'Keep Veo Premium-only final fallback/rescue when explicitly approved.',
      relatedProviderModel: 'veo_3_1_lite',
    }),
  ]
}

function browserCaptureActive(plan?: EditPlan) {
  const runtimeHasBrowserStep = plan?.workerRuntimePlan?.jobs.some((job) =>
    job.steps.some((step) => step.stepType === 'capture_browser_asset'),
  )
  const toolStrategyMentionsBrowser = JSON.stringify(plan?.toolStrategyPlan ?? {}).toLowerCase().includes('browser')
  return Boolean(runtimeHasBrowserStep || toolStrategyMentionsBrowser)
}

function workerOnlyToolsMarkedFrontend(): OpenSourceToolId[] {
  return openSourceToolProfiles
    .filter((tool) => tool.productionClass === 'worker_tool' && tool.frontendInstallInfo?.installedInFrontend)
    .map((tool) => tool.id)
}

export function createProductionLaunchChecklist(plan?: EditPlan): ProductionReadinessCheck[] {
  return [
    check({
      id: 'launch-planning-correctness',
      category: 'qa_coverage',
      label: 'Planning correctness',
      status: plan ? 'planning_only' : 'needs_worker_architecture',
      severity: plan ? 'info' : 'warning',
      message: 'Intent, strategy, tool planning, render planning, QA, and credit estimate should be present before launch.',
      recommendation: 'Use planner validation and QA reports as launch gates.',
    }),
    check({
      id: 'launch-approval-billing',
      category: 'credit_billing',
      label: 'Approval and billing',
      status: plan?.approvalRequired && plan.creditEstimate ? 'planning_only' : 'needs_license_review',
      severity: plan?.approvalRequired && plan.creditEstimate ? 'info' : 'warning',
      message: 'Production requires plan approval, credit estimate approval, reservation, ledger, and refund/restore policy.',
      recommendation: 'Do not generate, render, execute tools, or deduct credits before approval.',
    }),
    check({
      id: 'launch-worker-runtime',
      category: 'worker_runtime',
      label: 'Worker runtime',
      status: plan?.workerRuntimePlan ? 'needs_worker_architecture' : 'planning_only',
      severity: plan?.workerRuntimePlan ? 'warning' : 'info',
      message: 'Worker plans are typed architecture only; backend queues/storage/workers are not implemented.',
      recommendation: 'Implement future workers from approved snapshots only after license/security/privacy review.',
    }),
    check({
      id: 'launch-privacy-security',
      category: 'privacy',
      label: 'Privacy and security',
      status: browserCaptureActive(plan) ? 'needs_privacy_review' : 'planning_only',
      severity: browserCaptureActive(plan) ? 'warning' : 'info',
      message: 'Browser/source capture and user media require authorization, redaction, access control, and audit events.',
      recommendation: 'Review privacy and source authorization before production capture or media processing.',
    }),
    check({
      id: 'launch-render-export',
      category: 'render_export',
      label: 'Rendering and export',
      status: plan?.rendererCompositionPlan ? 'needs_worker_architecture' : 'planning_only',
      severity: 'info',
      message: 'Remotion planning exists, but real rendering/export workers are not implemented here.',
      recommendation: 'Keep rendering/export future-only until runtime, storage, QA, and failure handling are implemented.',
    }),
  ]
}

export function createProductionReadinessReport({ plan }: CreateProductionReadinessReportParams = {}): ProductionReadinessReport {
  const licenseReviews = createToolLicenseReviews()
  const frontendInstalledTools = getFrontendInstalledTools().map((tool) => tool.id)
  const workerOnlyTools = getFrontendWorkerOnlyTools().map((tool) => tool.id)
  const workerFrontendContradictions = workerOnlyToolsMarkedFrontend()
  const unreviewedTools = licenseReviews.filter((review) =>
    review.reviewStatus === 'not_reviewed' ||
    review.reviewStatus === 'needs_legal_review' ||
    review.licenseRisk === 'unknown' ||
    review.licenseRisk === 'high' ||
    review.licenseRisk === 'blocked',
  )
  const frontendApprovedForProduction = openSourceToolProfiles.filter((tool) =>
    tool.frontendInstallInfo?.installedInFrontend &&
    tool.productionReadinessStatus === 'approved_for_production',
  )
  const workerRuntimeFrontendEnabled = (plan?.workerRuntimePlan as { frontendExecutionAllowed?: boolean } | undefined)?.frontendExecutionAllowed === true
  const checks: ProductionReadinessCheck[] = [
    check({
      id: 'production-license-review-status',
      category: 'licensing',
      label: 'License review status',
      status: unreviewedTools.length > 0 ? 'needs_license_review' : 'approved_for_prototype',
      severity: unreviewedTools.length > 0 ? 'warning' : 'info',
      message: `${unreviewedTools.length} tool${unreviewedTools.length === 1 ? '' : 's'} still need license/commercial-use review.`,
      recommendation: 'Do not treat planning metadata as production approval; complete legal/business review before execution.',
    }),
    check({
      id: 'production-worker-only-not-frontend',
      category: 'worker_runtime',
      label: 'Worker-only tools stay out of frontend',
      status: workerFrontendContradictions.length ? 'blocked' : 'planning_only',
      severity: workerFrontendContradictions.length ? 'blocking' : 'info',
      message: workerFrontendContradictions.length
        ? `${workerFrontendContradictions.join(', ')} are marked as frontend installed but should be worker-only.`
        : 'Worker-only tools remain out of the frontend bundle.',
      recommendation: 'Keep FFmpeg, OpenCV, Playwright, audio analysis, and similar tools in future workers only.',
    }),
    check({
      id: 'production-frontend-preview-not-approved',
      category: 'frontend_bundle',
      label: 'Frontend tools are preview/dev only',
      status: frontendApprovedForProduction.length ? 'blocked' : 'needs_performance_review',
      severity: frontendApprovedForProduction.length ? 'blocking' : 'warning',
      message: 'Installed browser-safe tools are not production-approved by this milestone.',
      recommendation: 'Keep D3/ECharts/MapLibre/Turf/Lottie lazy-loaded and preview-only until license/performance review clears production use.',
    }),
    check({
      id: 'production-worker-runtime-policy',
      category: 'worker_runtime',
      label: 'Worker runtime is future-only',
      status: workerRuntimeFrontendEnabled ? 'blocked' : plan?.workerRuntimePlan ? 'needs_worker_architecture' : 'planning_only',
      severity: workerRuntimeFrontendEnabled ? 'blocking' : plan?.workerRuntimePlan ? 'warning' : 'info',
      message: plan?.workerRuntimePlan
        ? 'Worker runtime plan exists but no backend workers, queues, storage, or provider clients are implemented.'
        : 'No worker runtime plan provided for this report.',
      recommendation: 'Future workers must execute approved snapshots only after approval and credit reservation.',
    }),
    check({
      id: 'production-browser-capture-privacy',
      category: 'privacy',
      label: 'Browser capture authorization',
      status: browserCaptureActive(plan) ? 'needs_privacy_review' : 'planning_only',
      severity: browserCaptureActive(plan) ? 'warning' : 'info',
      message: browserCaptureActive(plan)
        ? 'Browser capture planning requires source authorization, privacy, and redaction review.'
        : 'No active browser capture execution is present in this mock report.',
      recommendation: 'Do not bypass auth, paywalls, CAPTCHAs, robots, rate limits, or site restrictions.',
    }),
    check({
      id: 'production-approval-credit-gate',
      category: 'credit_billing',
      label: 'Approval and credit gate',
      status: plan?.approvalRequired && plan.creditEstimate ? 'planning_only' : 'needs_worker_architecture',
      severity: plan?.approvalRequired && plan.creditEstimate ? 'info' : 'warning',
      message: 'Production execution must require plan approval, credit estimate approval, and future reservation.',
      recommendation: 'Do not deduct credits or run generation/tool/rendering before approval.',
    }),
    check({
      id: 'production-render-export-future',
      category: 'render_export',
      label: 'Rendering/export readiness',
      status: 'needs_worker_architecture',
      severity: 'info',
      message: 'Real Remotion rendering, export jobs, storage, and postprocess workers are not implemented by this milestone.',
      recommendation: 'Keep renderer/export work as future worker architecture until production runtime is built.',
    }),
    ...providerChecks(plan),
  ]
  const launchChecklist = createProductionLaunchChecklist(plan)
  const allChecks = [...checks, ...launchChecklist]
  const blockedItems = allChecks.filter((item) => item.status === 'blocked').map((item) => item.label)
  const needsReviewItems = [
    ...allChecks
      .filter((item) => item.status.startsWith('needs_'))
      .map((item) => item.label),
    ...unreviewedTools.map((review) => review.toolLabel),
  ]
  const approvedPrototypeItems = allChecks
    .filter((item) => item.status === 'approved_for_prototype')
    .map((item) => item.label)
  const overallStatus: ProductionReadinessStatus = blockedItems.length
    ? 'blocked'
    : needsReviewItems.some((item) => /worker/i.test(item))
      ? 'needs_worker_architecture'
      : needsReviewItems.length
        ? 'needs_license_review'
        : 'planning_only'

  return {
    id: 'production-readiness-report-v1',
    summary: `${blockedItems.length} blocked item${blockedItems.length === 1 ? '' : 's'}, ${needsReviewItems.length} review item${needsReviewItems.length === 1 ? '' : 's'}; report is planning metadata only and not legal advice.`,
    overallStatus,
    checks,
    licenseReviews,
    frontendInstalledTools,
    workerOnlyTools,
    providerModels: modelsFromPlan(plan),
    blockedItems,
    needsReviewItems: unique(needsReviewItems),
    approvedPrototypeItems,
    launchChecklist,
    limitations: reportLimitations,
    notes: [
      'Frontend-installed browser tools are local preview/dev only, not production-approved.',
      'Worker-only tools remain future/backend-only.',
      'Provider models remain separate from open-source tools.',
      'Production readiness does not enable Veo or bypass approval.',
    ],
  }
}

export function getProductionReadinessSummary(report: ProductionReadinessReport) {
  return `${report.overallStatus.replaceAll('_', ' ')}: ${report.blockedItems.length} blocked, ${report.needsReviewItems.length} needing review, ${report.frontendInstalledTools.length} frontend preview tool(s), ${report.workerOnlyTools.length} worker-only tool(s).`
}

export function statusForLicenseReview(review: ToolLicenseReview): ProductionReadinessStatus {
  return productionStatusForReview(review.reviewStatus)
}
