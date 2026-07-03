import { readFileSync } from 'node:fs'

type HandlerReadinessStatus =
  | 'ready_for_real_tool_execution'
  | 'ready_for_scoped_real_tool_execution'
  | 'partial_real_handler_coverage'
  | 'blocked_by_placeholder_worker_handlers'
type HandlerReadinessDecision =
  | 'production_real_worker_handler_readiness_ready_for_real_tool_execution_gate'
  | 'production_real_worker_handler_readiness_passed_scoped_reviewed_handler_gate'
  | 'production_real_worker_handler_readiness_blocked_by_partial_handler_coverage'
  | 'production_real_worker_handler_readiness_blocked_by_mock_safe_placeholder_dispatch'

interface HandlerReadinessCheck {
  id: string
  passed: boolean
  message: string
  evidence: Record<string, unknown>
}

export interface ProductionRealWorkerHandlerReadinessReport {
  reportId: string
  status: HandlerReadinessStatus
  decision: HandlerReadinessDecision
  readyForRealToolExecution: boolean
  boundedRealHandlerReady: boolean
  scopedReviewedHandlerReady: boolean
  allProductionHandlerCoverageReady: boolean
  productionScope: 'reviewed_real_backend_adapters_only' | 'all_production_worker_routes'
  reviewedRealAdapterIds: string[]
  blockedPlaceholderAdapterIds: string[]
  backendCallsAttempted: false
  toolExecutionAttempted: false
  mediaProcessingAttempted: false
  blockers: string[]
  checks: HandlerReadinessCheck[]
  nextAction: string
  warnings: string[]
}

const sourceFiles = {
  workerTypes: 'server/workers/production/production-worker-types.ts',
  workerRouter: 'server/workers/production/production-worker-router.ts',
  workerDispatcher: 'server/workers/production/production-worker-dispatcher.ts',
  gatewaySchemas: 'server/validation/tool-execution-gateway-schemas.ts',
  gatewayService: 'server/services/tool-execution-gateway-service.ts',
  gatewaySmoke: 'server/smoke/tool-execution-gateway-smoke.ts',
}

const reviewedRealAdapterIds = [
  'cpu_analysis_worker_media_audio_extract',
  'cpu_analysis_worker_media_keyframes',
  'cpu_analysis_worker_media_probe',
  'cpu_analysis_worker_media_proxy',
  'cpu_analysis_worker_media_representative_frames',
  'cpu_analysis_worker_audio_metadata',
  'cpu_analysis_worker_color_metadata',
  'cpu_analysis_worker_smart_cut_timeline',
  'render_worker_caption_metadata',
  'render_worker_final_render_metadata',
  'qa_worker_caption_metadata',
  'qa_worker_final_render_qa_metadata',
  'tool_readiness_worker_core_checks',
  'tool_readiness_worker_streamer_render_pipeline_support',
  'tool_readiness_worker_mkvtoolnix_container_validation',
  'tool_readiness_worker_gpac_mp4box_packaging_validation',
]

const placeholderAdapterIds = [
  'cpu_analysis_worker_placeholder',
  'gpu_ai_worker_placeholder',
  'render_worker_placeholder',
  'qa_worker_placeholder',
  'tool_readiness_worker_placeholder',
]

export function buildProductionRealWorkerHandlerReadinessReport(): ProductionRealWorkerHandlerReadinessReport {
  const sources = Object.fromEntries(
    Object.entries(sourceFiles).map(([key, path]) => [key, readSource(path)]),
  ) as Record<keyof typeof sourceFiles, string>
  const routerLiteralNonMockOutputs = countOccurrences(sources.workerRouter, 'mockOnly: false')
  const routerConditionalNonMockOutputs = countOccurrences(sources.workerRouter, 'mockOnly: !realMediaHandler') +
    countOccurrences(sources.workerRouter, 'mockOnly: !realSmartCutTimelineHandler') +
    countOccurrences(sources.workerRouter, 'mockOnly: !realAudioMetadataHandler') +
    countOccurrences(sources.workerRouter, 'mockOnly: !realColorMetadataHandler') +
    countOccurrences(sources.workerRouter, 'mockOnly: !realCaptionMetadataHandler') +
    countOccurrences(sources.workerRouter, 'mockOnly: !realCaptionQaMetadataHandler') +
    countOccurrences(sources.workerRouter, 'mockOnly: !realFinalRenderMetadataHandler') +
    countOccurrences(sources.workerRouter, 'mockOnly: !realFinalRenderQaMetadataHandler') +
    countOccurrences(sources.workerRouter, 'mockOnly: !realMediaProbeHandler') +
    countOccurrences(sources.workerRouter, 'mockOnly: !realToolReadinessHandler') +
    countOccurrences(sources.workerRouter, 'mockOnly: !realTrackANativeValidationHandler')
  const routerHasReviewedNonMockOutput = routerLiteralNonMockOutputs + routerConditionalNonMockOutputs > 0
  const presentRealAdapterIds = reviewedRealAdapterIds
    .filter((adapterId) => sources.gatewaySchemas.includes(adapterId))
  const presentPlaceholderAdapterIds = placeholderAdapterIds
    .filter((adapterId) => sources.gatewaySchemas.includes(adapterId))
  const realAdapterCount = presentRealAdapterIds.length

  const checks: HandlerReadinessCheck[] = [
    {
      id: 'route_output_type_allows_real_handlers',
      passed: !sources.workerTypes.includes('mockOnly: true'),
      message: 'Production worker route output must not be typed as mock-only before real production execution can be claimed.',
      evidence: {
        file: sourceFiles.workerTypes,
        mockOnlyTrueOccurrences: countOccurrences(sources.workerTypes, 'mockOnly: true'),
      },
    },
    {
      id: 'router_has_non_mock_outputs',
      passed: routerHasReviewedNonMockOutput,
      message: 'Production worker router must expose non-mock handler outputs for paid production.',
      evidence: {
        file: sourceFiles.workerRouter,
        mockOnlyTrueOccurrences: countOccurrences(sources.workerRouter, 'mockOnly: true'),
        mockOnlyFalseOccurrences: routerLiteralNonMockOutputs,
        conditionalNonMockOccurrences: routerConditionalNonMockOutputs,
        futureHandlerOccurrences: countOccurrences(sources.workerRouter, 'futureHandler'),
      },
    },
    {
      id: 'dispatcher_has_real_handler_completion_copy',
      passed: /real backend handler step completed/i.test(sources.workerDispatcher),
      message: 'Production worker dispatcher must distinguish real backend handler completion from mock-safe completion.',
      evidence: {
        file: sourceFiles.workerDispatcher,
        placeholderMentions: countCaseInsensitive(sources.workerDispatcher, 'placeholder'),
        mockSafeMentions: countCaseInsensitive(sources.workerDispatcher, 'mock-safe'),
      },
    },
    {
      id: 'gateway_has_real_backend_adapter',
      passed: realAdapterCount === reviewedRealAdapterIds.length,
      message: 'Production gateway adapter IDs must include the reviewed real backend handler adapter set.',
      evidence: {
        file: sourceFiles.gatewaySchemas,
        realAdapterCount,
        expectedRealAdapterCount: reviewedRealAdapterIds.length,
        reviewedRealAdapterIds: presentRealAdapterIds,
        mediaAudioExtractAdapterPresent: sources.gatewaySchemas.includes('cpu_analysis_worker_media_audio_extract'),
        mediaKeyframesAdapterPresent: sources.gatewaySchemas.includes('cpu_analysis_worker_media_keyframes'),
        mediaProbeAdapterPresent: sources.gatewaySchemas.includes('cpu_analysis_worker_media_probe'),
        mediaProxyAdapterPresent: sources.gatewaySchemas.includes('cpu_analysis_worker_media_proxy'),
        mediaRepresentativeFramesAdapterPresent: sources.gatewaySchemas.includes('cpu_analysis_worker_media_representative_frames'),
        audioMetadataAdapterPresent: sources.gatewaySchemas.includes('cpu_analysis_worker_audio_metadata'),
        colorMetadataAdapterPresent: sources.gatewaySchemas.includes('cpu_analysis_worker_color_metadata'),
        smartCutTimelineAdapterPresent: sources.gatewaySchemas.includes('cpu_analysis_worker_smart_cut_timeline'),
        captionMetadataAdapterPresent: sources.gatewaySchemas.includes('render_worker_caption_metadata'),
        finalRenderMetadataAdapterPresent: sources.gatewaySchemas.includes('render_worker_final_render_metadata'),
        captionQaMetadataAdapterPresent: sources.gatewaySchemas.includes('qa_worker_caption_metadata'),
        finalRenderQaMetadataAdapterPresent: sources.gatewaySchemas.includes('qa_worker_final_render_qa_metadata'),
        toolReadinessAdapterPresent: sources.gatewaySchemas.includes('tool_readiness_worker_core_checks'),
        trackANativeStreamerAdapterPresent: sources.gatewaySchemas.includes('tool_readiness_worker_streamer_render_pipeline_support'),
        trackANativeMkvToolNixAdapterPresent: sources.gatewaySchemas.includes('tool_readiness_worker_mkvtoolnix_container_validation'),
        trackANativeGpacMp4BoxAdapterPresent: sources.gatewaySchemas.includes('tool_readiness_worker_gpac_mp4box_packaging_validation'),
        placeholderAdapterMentions: countOccurrences(sources.gatewaySchemas, '_placeholder'),
      },
    },
    {
      id: 'production_ready_placeholder_adapters_blocked',
      passed: sources.gatewayService.includes('PRODUCTION_READY_PLACEHOLDER_ADAPTER_BLOCKED') &&
        sources.gatewayService.includes("adapterId.endsWith('_placeholder')") &&
        presentPlaceholderAdapterIds.length === placeholderAdapterIds.length,
      message: 'production_ready gateway dispatch must hard-block placeholder adapters while dry-run/mock-safe placeholder routes remain available for planning.',
      evidence: {
        file: sourceFiles.gatewayService,
        blockedPlaceholderAdapterIds: presentPlaceholderAdapterIds,
        expectedPlaceholderAdapterCount: placeholderAdapterIds.length,
        productionReadyPlaceholderBlockerPresent: sources.gatewayService.includes('PRODUCTION_READY_PLACEHOLDER_ADAPTER_BLOCKED'),
      },
    },
    {
      id: 'gateway_smoke_proves_real_production_ready_handler',
      passed: (
        sources.gatewaySmoke.includes('cpu_analysis_worker_media_probe') ||
        sources.gatewaySmoke.includes('cpu_analysis_worker_media_audio_extract') ||
        sources.gatewaySmoke.includes('cpu_analysis_worker_media_keyframes') ||
        sources.gatewaySmoke.includes('cpu_analysis_worker_media_proxy') ||
        sources.gatewaySmoke.includes('cpu_analysis_worker_media_representative_frames') ||
        sources.gatewaySmoke.includes('cpu_analysis_worker_audio_metadata') ||
        sources.gatewaySmoke.includes('cpu_analysis_worker_color_metadata') ||
        sources.gatewaySmoke.includes('cpu_analysis_worker_smart_cut_timeline') ||
        sources.gatewaySmoke.includes('render_worker_caption_metadata') ||
        sources.gatewaySmoke.includes('render_worker_final_render_metadata') ||
        sources.gatewaySmoke.includes('qa_worker_caption_metadata') ||
        sources.gatewaySmoke.includes('qa_worker_final_render_qa_metadata') ||
        sources.gatewaySmoke.includes('tool_readiness_worker_core_checks')
      ) &&
        /production_ready[\s\S]{0,2400}output\?\.mockOnly[\s\S]{0,240}false/i.test(sources.gatewaySmoke),
      message: 'Production gateway smoke coverage must prove at least one production_ready request reaches a non-mock backend handler.',
      evidence: {
        file: sourceFiles.gatewaySmoke,
        productionReadyMentions: countOccurrences(sources.gatewaySmoke, 'production_ready'),
        realMediaAudioExtractAdapterMentions: countOccurrences(sources.gatewaySmoke, 'cpu_analysis_worker_media_audio_extract'),
        realMediaKeyframesAdapterMentions: countOccurrences(sources.gatewaySmoke, 'cpu_analysis_worker_media_keyframes'),
        realMediaProbeAdapterMentions: countOccurrences(sources.gatewaySmoke, 'cpu_analysis_worker_media_probe'),
        realMediaProxyAdapterMentions: countOccurrences(sources.gatewaySmoke, 'cpu_analysis_worker_media_proxy'),
        realMediaRepresentativeFramesAdapterMentions: countOccurrences(sources.gatewaySmoke, 'cpu_analysis_worker_media_representative_frames'),
        realAudioMetadataAdapterMentions: countOccurrences(sources.gatewaySmoke, 'cpu_analysis_worker_audio_metadata'),
        realColorMetadataAdapterMentions: countOccurrences(sources.gatewaySmoke, 'cpu_analysis_worker_color_metadata'),
        realSmartCutTimelineAdapterMentions: countOccurrences(sources.gatewaySmoke, 'cpu_analysis_worker_smart_cut_timeline'),
        realCaptionMetadataAdapterMentions: countOccurrences(sources.gatewaySmoke, 'render_worker_caption_metadata'),
        realFinalRenderMetadataAdapterMentions: countOccurrences(sources.gatewaySmoke, 'render_worker_final_render_metadata'),
        realCaptionQaMetadataAdapterMentions: countOccurrences(sources.gatewaySmoke, 'qa_worker_caption_metadata'),
        realFinalRenderQaMetadataAdapterMentions: countOccurrences(sources.gatewaySmoke, 'qa_worker_final_render_qa_metadata'),
        realToolReadinessAdapterMentions: countOccurrences(sources.gatewaySmoke, 'tool_readiness_worker_core_checks'),
        mockOnlyFalseAssertions: countOccurrences(sources.gatewaySmoke, 'mockOnly, false'),
        mockOnlyTrueAssertions: countOccurrences(sources.gatewaySmoke, 'mockOnly, true') + countOccurrences(sources.gatewaySmoke, 'mock-safe placeholder output'),
      },
    },
    {
      id: 'dry_run_placeholder_adapters_excluded_from_production_scope',
      passed: sources.gatewayService.includes('PRODUCTION_READY_PLACEHOLDER_ADAPTER_BLOCKED') &&
        presentPlaceholderAdapterIds.every((adapterId) => adapterId.endsWith('_placeholder')) &&
        presentPlaceholderAdapterIds.every((adapterId) => !presentRealAdapterIds.includes(adapterId)),
      message: 'Dry-run/mock-safe placeholder adapters may remain available for planning, but they are excluded from production handler coverage and hard-blocked for production_ready dispatch.',
      evidence: {
        file: sourceFiles.gatewaySchemas,
        dryRunOnlyPlaceholderAdapterIds: presentPlaceholderAdapterIds,
        reviewedProductionAdapterIds: presentRealAdapterIds,
        productionReadyPlaceholderBlockerPresent: sources.gatewayService.includes('PRODUCTION_READY_PLACEHOLDER_ADAPTER_BLOCKED'),
        routerMockOnlyTrueMentions: countOccurrences(sources.workerRouter, 'mockOnly: true'),
      },
    },
  ]

  const scopedBlockingCheckIds = new Set(checks.map((check) => check.id))
  const blockers = checks
    .filter((check) => !check.passed && scopedBlockingCheckIds.has(check.id))
    .map((check) => `${check.id}: ${check.message}`)
  const boundedRealHandlerReady = checks
    .filter((check) => check.id !== 'placeholder_handler_coverage_retired')
    .every((check) => check.passed)
  const allProductionHandlerCoverageReady = checks.every((check) => check.passed)
  const scopedReviewedHandlerReady = boundedRealHandlerReady
  const readyForRealToolExecution = scopedReviewedHandlerReady
  const status: HandlerReadinessStatus = readyForRealToolExecution
    ? allProductionHandlerCoverageReady
      ? 'ready_for_real_tool_execution'
      : 'ready_for_scoped_real_tool_execution'
    : boundedRealHandlerReady
      ? 'partial_real_handler_coverage'
      : 'blocked_by_placeholder_worker_handlers'
  const decision: HandlerReadinessDecision = readyForRealToolExecution
    ? allProductionHandlerCoverageReady
      ? 'production_real_worker_handler_readiness_ready_for_real_tool_execution_gate'
      : 'production_real_worker_handler_readiness_passed_scoped_reviewed_handler_gate'
    : boundedRealHandlerReady
      ? 'production_real_worker_handler_readiness_blocked_by_partial_handler_coverage'
      : 'production_real_worker_handler_readiness_blocked_by_mock_safe_placeholder_dispatch'

  return {
    reportId: `production-real-worker-handler-readiness-${new Date().toISOString()}`,
    status,
    decision,
    readyForRealToolExecution,
    boundedRealHandlerReady,
    scopedReviewedHandlerReady,
    allProductionHandlerCoverageReady,
    productionScope: allProductionHandlerCoverageReady
      ? 'all_production_worker_routes'
      : 'reviewed_real_backend_adapters_only',
    reviewedRealAdapterIds: presentRealAdapterIds,
    blockedPlaceholderAdapterIds: presentPlaceholderAdapterIds,
    backendCallsAttempted: false,
    toolExecutionAttempted: false,
    mediaProcessingAttempted: false,
    blockers,
    checks,
    nextAction: readyForRealToolExecution
      ? allProductionHandlerCoverageReady
        ? 'Run the final production tool execution gate against deployed evidence before enabling production dispatch for the reviewed production adapter surface; keep dry-run placeholders hard-blocked for production_ready dispatch.'
        : 'Run final production readiness only for the reviewed real backend adapter scope; keep placeholder adapters hard-blocked for production_ready dispatch.'
      : boundedRealHandlerReady
        ? 'Continue replacing placeholder gateway adapters and mock-only worker routes, or narrow the production go/no-go to the reviewed real handler coverage.'
      : 'Replace placeholder gateway adapters and mock-only production worker routes with reviewed real backend handlers, then rerun this gate.',
    warnings: [
      'This readiness report is static and no-runtime: it reads source files only.',
      'It does not call backend routes, dispatch workers, run tools, process media, call Supabase, call Stripe, or activate production.',
      allProductionHandlerCoverageReady
        ? 'All reviewed production worker routes have real handler coverage; dry-run placeholder adapters remain available only for planning/mock-safe modes and are hard-blocked for production_ready dispatch.'
        : 'Broad all-route production coverage remains incomplete, but reviewed real backend adapters can be gated independently while placeholders stay blocked from production_ready dispatch.',
    ],
  }
}

function readSource(path: string): string {
  return readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')
}

function countOccurrences(input: string, needle: string): number {
  return input.split(needle).length - 1
}

function countCaseInsensitive(input: string, needle: string): number {
  return input.toLowerCase().split(needle.toLowerCase()).length - 1
}

function argValue(name: string): string | undefined {
  const prefix = `--${name}=`
  const match = process.argv.find((arg) => arg.startsWith(prefix))
  return match?.slice(prefix.length)
}

function renderText(report: ProductionRealWorkerHandlerReadinessReport): string {
  const lines = [
    `status=${report.status}`,
    `decision=${report.decision}`,
    `readyForRealToolExecution=${report.readyForRealToolExecution}`,
    `boundedRealHandlerReady=${report.boundedRealHandlerReady}`,
    `scopedReviewedHandlerReady=${report.scopedReviewedHandlerReady}`,
    `allProductionHandlerCoverageReady=${report.allProductionHandlerCoverageReady}`,
    `productionScope=${report.productionScope}`,
    `backendCallsAttempted=${report.backendCallsAttempted}`,
    `toolExecutionAttempted=${report.toolExecutionAttempted}`,
    `mediaProcessingAttempted=${report.mediaProcessingAttempted}`,
    '',
    'Checks:',
  ]
  for (const check of report.checks) {
    lines.push(`- ${check.id}: passed=${check.passed}; ${check.message}`)
  }
  if (report.blockers.length > 0) {
    lines.push('', 'Blockers:')
    for (const blocker of report.blockers) {
      lines.push(`- ${blocker}`)
    }
  }
  lines.push('', `Next action: ${report.nextAction}`)
  return lines.join('\n')
}

const isDirectCli = process.argv[1]?.endsWith('production-real-worker-handler-readiness.ts')
if (isDirectCli) {
  const report = buildProductionRealWorkerHandlerReadinessReport()
  const format = argValue('format') ?? 'json'
  console.log(format === 'text' ? renderText(report) : JSON.stringify(report, null, 2))
}
