import { readFileSync } from 'node:fs'

type HandlerReadinessStatus = 'ready_for_real_tool_execution' | 'blocked_by_placeholder_worker_handlers'
type HandlerReadinessDecision =
  | 'production_real_worker_handler_readiness_ready_for_real_tool_execution_gate'
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
      passed: countOccurrences(sources.workerRouter, 'mockOnly: true') === 0 && countOccurrences(sources.workerRouter, 'mockOnly: false') > 0,
      message: 'Production worker router must expose non-mock handler outputs for paid production.',
      evidence: {
        file: sourceFiles.workerRouter,
        mockOnlyTrueOccurrences: countOccurrences(sources.workerRouter, 'mockOnly: true'),
        mockOnlyFalseOccurrences: countOccurrences(sources.workerRouter, 'mockOnly: false'),
        futureHandlerOccurrences: countOccurrences(sources.workerRouter, 'futureHandler'),
      },
    },
    {
      id: 'dispatcher_messages_are_not_placeholder',
      passed: !/placeholder route|placeholder step|placeholder job|mock-safe dispatcher/i.test(sources.workerDispatcher),
      message: 'Production worker dispatcher must not describe accepted production jobs as placeholder/mock-safe execution.',
      evidence: {
        file: sourceFiles.workerDispatcher,
        placeholderMentions: countCaseInsensitive(sources.workerDispatcher, 'placeholder'),
        mockSafeMentions: countCaseInsensitive(sources.workerDispatcher, 'mock-safe'),
      },
    },
    {
      id: 'gateway_adapters_are_real_not_placeholder',
      passed: !sources.gatewaySchemas.includes('_placeholder'),
      message: 'Production gateway adapter IDs must point at real backend handler adapters, not placeholder adapters.',
      evidence: {
        file: sourceFiles.gatewaySchemas,
        placeholderAdapterMentions: countOccurrences(sources.gatewaySchemas, '_placeholder'),
      },
    },
    {
      id: 'gateway_smoke_no_longer_expects_mock_only_production_ready',
      passed: !/production_ready[\s\S]{0,1600}mock-safe placeholder output|production_ready[\s\S]{0,1600}output\?\.mockOnly[\s\S]{0,240}true/i.test(sources.gatewaySmoke),
      message: 'Production gateway smoke coverage must stop accepting mock-only output for production_ready dispatch.',
      evidence: {
        file: sourceFiles.gatewaySmoke,
        productionReadyMentions: countOccurrences(sources.gatewaySmoke, 'production_ready'),
        mockOnlyTrueAssertions: countOccurrences(sources.gatewaySmoke, 'mockOnly') + countOccurrences(sources.gatewaySmoke, 'mock-safe placeholder output'),
      },
    },
  ]

  const blockers = checks
    .filter((check) => !check.passed)
    .map((check) => `${check.id}: ${check.message}`)
  const readyForRealToolExecution = blockers.length === 0

  return {
    reportId: `production-real-worker-handler-readiness-${new Date().toISOString()}`,
    status: readyForRealToolExecution ? 'ready_for_real_tool_execution' : 'blocked_by_placeholder_worker_handlers',
    decision: readyForRealToolExecution
      ? 'production_real_worker_handler_readiness_ready_for_real_tool_execution_gate'
      : 'production_real_worker_handler_readiness_blocked_by_mock_safe_placeholder_dispatch',
    readyForRealToolExecution,
    backendCallsAttempted: false,
    toolExecutionAttempted: false,
    mediaProcessingAttempted: false,
    blockers,
    checks,
    nextAction: readyForRealToolExecution
      ? 'Run the final production tool execution gate against deployed evidence before enabling production dispatch.'
      : 'Replace placeholder gateway adapters and mock-only production worker routes with reviewed real backend handlers, then rerun this gate.',
    warnings: [
      'This readiness report is static and no-runtime: it reads source files only.',
      'It does not call backend routes, dispatch workers, run tools, process media, call Supabase, call Stripe, or activate production.',
      'Passing billing/readiness evidence is necessary but not sufficient while production worker handlers remain mock-only.',
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
