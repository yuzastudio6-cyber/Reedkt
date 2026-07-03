import { readFileSync } from 'node:fs'

type HandlerReadinessStatus =
  | 'ready_for_real_tool_execution'
  | 'partial_real_handler_coverage'
  | 'blocked_by_placeholder_worker_handlers'
type HandlerReadinessDecision =
  | 'production_real_worker_handler_readiness_ready_for_real_tool_execution_gate'
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
  allProductionHandlerCoverageReady: boolean
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
  gatewaySmoke: 'server/smoke/tool-execution-gateway-smoke.ts',
}

export function buildProductionRealWorkerHandlerReadinessReport(): ProductionRealWorkerHandlerReadinessReport {
  const sources = Object.fromEntries(
    Object.entries(sourceFiles).map(([key, path]) => [key, readSource(path)]),
  ) as Record<keyof typeof sourceFiles, string>
  const routerLiteralNonMockOutputs = countOccurrences(sources.workerRouter, 'mockOnly: false')
  const routerConditionalNonMockOutputs = countOccurrences(sources.workerRouter, 'mockOnly: !realMediaHandler') +
    countOccurrences(sources.workerRouter, 'mockOnly: !realMediaProbeHandler') +
    countOccurrences(sources.workerRouter, 'mockOnly: !realToolReadinessHandler')
  const routerHasReviewedNonMockOutput = routerLiteralNonMockOutputs + routerConditionalNonMockOutputs > 0
  const realAdapterCount = [
    'cpu_analysis_worker_media_audio_extract',
    'cpu_analysis_worker_media_keyframes',
    'cpu_analysis_worker_media_probe',
    'cpu_analysis_worker_media_proxy',
    'cpu_analysis_worker_media_representative_frames',
    'tool_readiness_worker_core_checks',
  ].filter((adapterId) => sources.gatewaySchemas.includes(adapterId)).length

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
      passed: realAdapterCount > 0,
      message: 'Production gateway adapter IDs must include at least one reviewed real backend handler adapter.',
      evidence: {
        file: sourceFiles.gatewaySchemas,
        realAdapterCount,
        mediaAudioExtractAdapterPresent: sources.gatewaySchemas.includes('cpu_analysis_worker_media_audio_extract'),
        mediaKeyframesAdapterPresent: sources.gatewaySchemas.includes('cpu_analysis_worker_media_keyframes'),
        mediaProbeAdapterPresent: sources.gatewaySchemas.includes('cpu_analysis_worker_media_probe'),
        mediaProxyAdapterPresent: sources.gatewaySchemas.includes('cpu_analysis_worker_media_proxy'),
        mediaRepresentativeFramesAdapterPresent: sources.gatewaySchemas.includes('cpu_analysis_worker_media_representative_frames'),
        toolReadinessAdapterPresent: sources.gatewaySchemas.includes('tool_readiness_worker_core_checks'),
        placeholderAdapterMentions: countOccurrences(sources.gatewaySchemas, '_placeholder'),
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
        realToolReadinessAdapterMentions: countOccurrences(sources.gatewaySmoke, 'tool_readiness_worker_core_checks'),
        mockOnlyFalseAssertions: countOccurrences(sources.gatewaySmoke, 'mockOnly, false'),
        mockOnlyTrueAssertions: countOccurrences(sources.gatewaySmoke, 'mockOnly, true') + countOccurrences(sources.gatewaySmoke, 'mock-safe placeholder output'),
      },
    },
    {
      id: 'placeholder_handler_coverage_retired',
      passed: countOccurrences(sources.gatewaySchemas, '_placeholder') === 0 &&
        countOccurrences(sources.workerRouter, 'mockOnly: true') === 0,
      message: 'All production gateway and worker routes must be real-handler backed before the all-up production execution gate can pass.',
      evidence: {
        gatewayPlaceholderMentions: countOccurrences(sources.gatewaySchemas, '_placeholder'),
        routerMockOnlyTrueMentions: countOccurrences(sources.workerRouter, 'mockOnly: true'),
      },
    },
  ]

  const blockers = checks
    .filter((check) => !check.passed)
    .map((check) => `${check.id}: ${check.message}`)
  const boundedRealHandlerReady = checks
    .filter((check) => check.id !== 'placeholder_handler_coverage_retired')
    .every((check) => check.passed)
  const allProductionHandlerCoverageReady = checks.every((check) => check.passed)
  const readyForRealToolExecution = allProductionHandlerCoverageReady
  const status: HandlerReadinessStatus = readyForRealToolExecution
    ? 'ready_for_real_tool_execution'
    : boundedRealHandlerReady
      ? 'partial_real_handler_coverage'
      : 'blocked_by_placeholder_worker_handlers'
  const decision: HandlerReadinessDecision = readyForRealToolExecution
    ? 'production_real_worker_handler_readiness_ready_for_real_tool_execution_gate'
    : boundedRealHandlerReady
      ? 'production_real_worker_handler_readiness_blocked_by_partial_handler_coverage'
      : 'production_real_worker_handler_readiness_blocked_by_mock_safe_placeholder_dispatch'

  return {
    reportId: `production-real-worker-handler-readiness-${new Date().toISOString()}`,
    status,
    decision,
    readyForRealToolExecution,
    boundedRealHandlerReady,
    allProductionHandlerCoverageReady,
    backendCallsAttempted: false,
    toolExecutionAttempted: false,
    mediaProcessingAttempted: false,
    blockers,
    checks,
    nextAction: readyForRealToolExecution
      ? 'Run the final production tool execution gate against deployed evidence before enabling production dispatch.'
      : boundedRealHandlerReady
        ? 'Continue replacing placeholder gateway adapters and mock-only worker routes, or narrow the production go/no-go to the reviewed real handler coverage.'
      : 'Replace placeholder gateway adapters and mock-only production worker routes with reviewed real backend handlers, then rerun this gate.',
    warnings: [
      'This readiness report is static and no-runtime: it reads source files only.',
      'It does not call backend routes, dispatch workers, run tools, process media, call Supabase, call Stripe, or activate production.',
      'Passing billing/readiness evidence is necessary but not sufficient while production worker handler coverage remains partial.',
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
    `allProductionHandlerCoverageReady=${report.allProductionHandlerCoverageReady}`,
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
