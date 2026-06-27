import { readFileSync } from 'node:fs'

import {
  QWEN_VL_PLANNER_ROUTING_TASKS,
  buildQwenVlPlannerRoutingHandoffs,
  getProductionToolProfile,
} from '../tool-registry'

function check(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message)
  }
}

function collectForbiddenStrings(value: unknown, path = '$'): string[] {
  const findings: string[] = []

  if (typeof value === 'string') {
    const forbiddenPatterns = [
      /https?:\/\//i,
      /gs:\/\//i,
      /storage\.googleapis\.com/i,
      /X-Goog-/i,
      /signature=/i,
      /service[_-]?role/i,
      /BEGIN PRIVATE KEY/i,
      /AIza[0-9A-Za-z_-]{20,}/,
      /ya29\.[0-9A-Za-z_-]+/,
      /sk-[0-9A-Za-z_-]{20,}/,
    ]
    if (forbiddenPatterns.some((pattern) => pattern.test(value))) {
      findings.push(path)
    }
    return findings
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      findings.push(...collectForbiddenStrings(item, `${path}[${index}]`))
    })
    return findings
  }

  if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) {
      findings.push(...collectForbiddenStrings(item, `${path}.${key}`))
    }
  }

  return findings
}

const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
  scripts?: Record<string, string>
}
const docText = readFileSync('docs/qwen2-5-vl-7b-planner-routing-handoff.md', 'utf8')
const dryRunDocText = readFileSync('docs/qwen2-5-vl-7b-routing-integration-dry-run.md', 'utf8')

check(
  packageJson.scripts?.['smoke:qwen2-5-vl-planner-routing-handoff'] ===
    'tsx server/smoke/qwen2-5-vl-planner-routing-handoff-smoke.ts',
  'Package script must point to the Qwen planner routing handoff smoke.',
)

const qwenProfile = getProductionToolProfile('qwen_vl')
check(Boolean(qwenProfile), 'Qwen profile must exist.')
check(qwenProfile?.category === 'visual_analysis', 'Qwen must stay visual analysis.')
check(qwenProfile?.workerType === 'gpu_ai_worker', 'Qwen must stay GPU worker scoped.')
check(qwenProfile?.cpuAllowed === false, 'Qwen must not become CPU execution-ready.')

const { handoffs, summary } = buildQwenVlPlannerRoutingHandoffs()
check(handoffs.length === QWEN_VL_PLANNER_ROUTING_TASKS.length, 'Every planner task must produce a handoff.')
check(summary.mode === 'qwen_vl_planner_routing_handoff_metadata_only', 'Summary mode must be planner metadata handoff only.')
check(summary.totalPlannerTasks === 13, 'Planner handoff must cover 13 tasks.')
check(summary.primaryMetadataRoutes === 4, 'Planner handoff must include four primary Qwen routes.')
check(summary.advisoryMetadataRoutes === 4, 'Planner handoff must include four advisory Qwen routes.')
check(summary.blockedRoutes === 5, 'Planner handoff must include five blocked routes.')
check(summary.dryRunPassedClaimed === false, 'Planner handoff must not claim dry-run pass.')
check(summary.plannerDispatchAllowed === false, 'Planner handoff must not allow dispatch.')
check(summary.cloudRunInvocationAllowed === false, 'Planner handoff must not allow Cloud Run invocation.')
check(summary.inferenceAllowed === false, 'Planner handoff must not allow inference.')
check(summary.rawPromptAllowed === false, 'Planner handoff must not allow raw prompts.')
check(summary.generatedAssetCreationAllowed === false, 'Planner handoff must not allow generated asset creation.')
check(summary.renderExportAllowed === false, 'Planner handoff must not allow render/export.')

for (const handoff of handoffs) {
  check(handoff.dryRunPassedClaimed === false, `${handoff.plannerTaskId} must not claim dry-run pass.`)
  check(handoff.plannerMayDispatchWorker === false, `${handoff.plannerTaskId} must not dispatch workers.`)
  check(handoff.plannerMayInvokeCloudRun === false, `${handoff.plannerTaskId} must not invoke Cloud Run.`)
  check(handoff.plannerMayRunInference === false, `${handoff.plannerTaskId} must not run inference.`)
  check(handoff.plannerMayCreateGeneratedAsset === false, `${handoff.plannerTaskId} must not create generated assets.`)
  check(handoff.plannerMayRenderExport === false, `${handoff.plannerTaskId} must not render/export.`)
  check(handoff.plannerMayUseRawPrompt === false, `${handoff.plannerTaskId} must not use raw prompts.`)
  check(Boolean(handoff.structuredIntentId), `${handoff.plannerTaskId} must include structured intent.`)
  check(Boolean(handoff.approvedPlanSnapshotId), `${handoff.plannerTaskId} must include approved snapshot ref.`)
  check(Boolean(handoff.creditReservationId), `${handoff.plannerTaskId} must include credit reservation ref.`)
  check(Boolean(handoff.queueLeaseId), `${handoff.plannerTaskId} must include queue lease ref.`)
  check(handoff.deterministicPrerequisites.length > 0, `${handoff.plannerTaskId} must list deterministic prerequisites.`)

  if (handoff.status === 'planner_handoff_blocked_by_policy') {
    check(handoff.selectedToolId === null, `${handoff.plannerTaskId} must not select Qwen when blocked.`)
    check(handoff.runtimeUseCase === null, `${handoff.plannerTaskId} must not map to runtime when blocked.`)
  } else {
    check(handoff.selectedToolId === 'qwen_vl', `${handoff.plannerTaskId} must select Qwen metadata.`)
    check(Boolean(handoff.runtimeUseCase), `${handoff.plannerTaskId} must map to bounded runtime use case.`)
  }
}

function requireHandoff(taskId: string) {
  const found = handoffs.find((item) => item.plannerTaskId === taskId)
  check(Boolean(found), `Missing handoff ${taskId}`)
  return found!
}

check(requireHandoff('planner_broll_relevance_scoring').mustNotReplace.includes('wan_video'), 'B-roll review must not replace Wan.')
check(requireHandoff('planner_broll_relevance_scoring').mustNotReplace.includes('ltx_video'), 'B-roll review must not replace LTX.')
check(requireHandoff('planner_blocked_ai_video_generation_request').status === 'planner_handoff_blocked_by_policy', 'AI video generation request must be blocked.')
check(requireHandoff('planner_blocked_final_export_request').mustNotReplace.includes('remotion'), 'Qwen must not replace Remotion.')
check(requireHandoff('planner_blocked_final_export_request').mustNotReplace.includes('ffmpeg'), 'Qwen must not replace FFmpeg.')
check(requireHandoff('planner_ocr_layout_context_review').mustNotReplace.includes('paddleocr'), 'Qwen must not replace PaddleOCR.')
check(requireHandoff('planner_chart_screen_context_review').mustNotReplace.includes('d3'), 'Qwen must not replace D3.')
check(requireHandoff('planner_chart_screen_context_review').mustNotReplace.includes('echarts'), 'Qwen must not replace ECharts.')
check(requireHandoff('planner_chart_screen_context_review').mustNotReplace.includes('vega_lite'), 'Qwen must not replace Vega-Lite.')

check(docText.includes('Decision: `qwen_vl_planner_routing_handoff_metadata_only`'), 'Doc must record handoff decision.')
check(docText.includes('Raw chat is not a worker payload.'), 'Doc must block raw chat worker payloads.')
check(docText.includes('Wan remains primary generated B-roll.'), 'Doc must preserve Wan ownership.')
check(docText.includes('PaddleOCR remains exact OCR/text authority.'), 'Doc must preserve OCR ownership.')
check(docText.includes('QWEN2_5_VL_STACK_TOOL_42-PLANNER-UI-SURFACING'), 'Doc must record the next prompt.')
check(dryRunDocText.includes('Decision: `qwen_vl_routing_integration_dry_run_no_inference`'), 'Dry-run doc must remain present.')

const forbiddenFindings = [
  ...collectForbiddenStrings(QWEN_VL_PLANNER_ROUTING_TASKS, 'QWEN_VL_PLANNER_ROUTING_TASKS'),
  ...collectForbiddenStrings(handoffs, 'handoffs'),
  ...collectForbiddenStrings(summary, 'summary'),
  ...collectForbiddenStrings(docText, 'docText'),
]
check(forbiddenFindings.length === 0, `Forbidden concrete URL/secret/storage markers found: ${forbiddenFindings.join(', ')}`)

console.log(JSON.stringify({
  ok: true,
  mode: summary.mode,
  totalPlannerTasks: summary.totalPlannerTasks,
  primaryMetadataRoutes: summary.primaryMetadataRoutes,
  advisoryMetadataRoutes: summary.advisoryMetadataRoutes,
  blockedRoutes: summary.blockedRoutes,
  cloudRunInvocationAllowed: summary.cloudRunInvocationAllowed,
  inferenceAllowed: summary.inferenceAllowed,
  nextPrompt: summary.nextPrompt,
}, null, 2))
