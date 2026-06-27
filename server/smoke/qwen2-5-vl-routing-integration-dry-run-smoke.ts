import { readFileSync } from 'node:fs'

import {
  QWEN_VL_ROUTING_DRY_RUN_CASES,
  getProductionToolProfile,
  runQwenVlRoutingDryRun,
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
const docText = readFileSync('docs/qwen2-5-vl-7b-routing-integration-dry-run.md', 'utf8')
const rankingDocText = readFileSync('docs/qwen2-5-vl-7b-tool-routing-use-case-ranking.md', 'utf8')

check(
  packageJson.scripts?.['smoke:qwen2-5-vl-routing-integration-dry-run'] ===
    'tsx server/smoke/qwen2-5-vl-routing-integration-dry-run-smoke.ts',
  'Package script must point to the Qwen routing integration dry-run smoke.',
)

const qwenProfile = getProductionToolProfile('qwen_vl')
check(Boolean(qwenProfile), 'Qwen production profile must exist.')
check(qwenProfile?.category === 'visual_analysis', 'Qwen profile must remain visual analysis.')
check(qwenProfile?.workerType === 'gpu_ai_worker', 'Qwen profile must remain GPU-worker scoped.')
check(qwenProfile?.cpuAllowed === false, 'Qwen profile must not become CPU execution-ready.')

const { evaluations, summary } = runQwenVlRoutingDryRun()

check(summary.mode === 'qwen_vl_routing_integration_dry_run_no_inference', 'Summary mode must be no-inference dry-run.')
check(summary.totalCases === QWEN_VL_ROUTING_DRY_RUN_CASES.length, 'Summary must include every synthetic case.')
check(summary.selectedPrimaryCount === 4, 'Dry-run must select four primary metadata-only Qwen cases.')
check(summary.selectedAdvisoryCount === 4, 'Dry-run must select four advisory metadata-only Qwen cases.')
check(summary.blockedCount === 5, 'Dry-run must block five unsafe Qwen use cases.')
check(summary.dryRunPassedClaimed === false, 'Dry-run pass must not be claimed.')
check(summary.inferenceRun === false, 'Inference must not run.')
check(summary.cloudRunInvoked === false, 'Cloud Run must not be invoked.')
check(summary.workersDispatched === false, 'Workers must not be dispatched.')
check(summary.generatedAssetsCreated === false, 'Generated assets must not be created.')
check(summary.publicArtifactsCreated === false, 'Public artifacts must not be created.')
check(summary.signedUrlsCreated === false, 'Signed URLs must not be created.')

for (const testCase of QWEN_VL_ROUTING_DRY_RUN_CASES) {
  const evaluation = evaluations.find((item) => item.caseId === testCase.caseId)
  check(Boolean(evaluation), `${testCase.caseId} must have an evaluation.`)
  check(evaluation?.status === testCase.expectedStatus, `${testCase.caseId} must return ${testCase.expectedStatus}.`)
}

for (const evaluation of evaluations) {
  check(evaluation.dryRunPassedClaimed === false, `${evaluation.caseId} must not claim dry-run pass.`)
  check(Object.values(evaluation.sideEffectGates).every((value) => value === false), `${evaluation.caseId} must keep side-effect gates false.`)
  check(evaluation.runtimeGates.rawPromptAllowed === false, `${evaluation.caseId} must block raw prompts.`)
  check(evaluation.runtimeGates.publicUrlAllowed === false, `${evaluation.caseId} must block public URLs.`)
  check(evaluation.runtimeGates.signedUrlAllowed === false, `${evaluation.caseId} must block signed URLs.`)
  check(evaluation.runtimeGates.providerRouteAllowed === false, `${evaluation.caseId} must block provider routes.`)
  check(evaluation.runtimeGates.frontendInvocationAllowed === false, `${evaluation.caseId} must block frontend invocation.`)

  if (evaluation.status === 'blocked_by_policy') {
    check(evaluation.selectedToolId === null, `${evaluation.caseId} must not select Qwen when blocked.`)
    check(evaluation.requiredRuntimeUseCase === null, `${evaluation.caseId} must not map to a runtime use case when blocked.`)
  } else {
    check(evaluation.selectedToolId === 'qwen_vl', `${evaluation.caseId} must select Qwen metadata when allowed.`)
    check(Boolean(evaluation.requiredRuntimeUseCase), `${evaluation.caseId} must map to a bounded runtime use case.`)
  }
}

const blockedAiVideo = evaluations.find((item) => item.caseId === 'blocked_ai_video_generation')
check(blockedAiVideo?.preferredAfter.includes('wan_video'), 'Wan must remain ahead of Qwen for generated B-roll.')
check(blockedAiVideo?.preferredAfter.includes('ltx_video'), 'LTX must remain ahead of Qwen for fast-preview video routes.')

const blockedRender = evaluations.find((item) => item.caseId === 'blocked_final_render_export')
check(blockedRender?.mustNotReplace.includes('remotion'), 'Qwen must not replace Remotion.')
check(blockedRender?.mustNotReplace.includes('ffmpeg'), 'Qwen must not replace FFmpeg.')
check(blockedRender?.mustNotReplace.includes('ffprobe'), 'Qwen must not replace ffprobe.')

const ocrCase = evaluations.find((item) => item.caseId === 'private_ocr_layout_reasoning')
check(ocrCase?.preferredAfter.includes('paddleocr'), 'PaddleOCR must precede Qwen for OCR layout reasoning.')
check(ocrCase?.mustNotReplace.includes('paddleocr'), 'Qwen must not replace PaddleOCR.')

const chartCase = evaluations.find((item) => item.caseId === 'private_chart_screen_reasoning')
check(chartCase?.mustNotReplace.includes('d3'), 'Qwen must not replace D3.')
check(chartCase?.mustNotReplace.includes('echarts'), 'Qwen must not replace ECharts.')
check(chartCase?.mustNotReplace.includes('vega_lite'), 'Qwen must not replace Vega-Lite.')

check(docText.includes('Decision: `qwen_vl_routing_integration_dry_run_no_inference`'), 'Doc must record the dry-run decision.')
check(docText.includes('This packet integrates the Qwen2.5-VL use-case ranking table'), 'Doc must explain ranking integration.')
check(docText.includes('Wan/LTX/Mochi/Hunyuan own generated B-roll routes'), 'Doc must block Qwen AI-video generation.')
check(docText.includes('dry-run pass unclaimed'), 'Doc must keep dry-run pass unclaimed.')
check(docText.includes('QWEN2_5_VL_STACK_TOOL_41-PRIVATE-INVOKE-AUTH-VERIFY-OR-ROUTER-HANDOFF'), 'Doc must name the next prompt.')
check(rankingDocText.includes('Qwen can review B-roll candidates and generated asset QA, but it must not create generated video.'), 'Ranking doc must remain aligned.')

const forbiddenFindings = [
  ...collectForbiddenStrings(QWEN_VL_ROUTING_DRY_RUN_CASES, 'QWEN_VL_ROUTING_DRY_RUN_CASES'),
  ...collectForbiddenStrings(evaluations, 'evaluations'),
  ...collectForbiddenStrings(summary, 'summary'),
  ...collectForbiddenStrings(docText, 'docText'),
]
check(forbiddenFindings.length === 0, `Forbidden concrete URL/secret/storage markers found: ${forbiddenFindings.join(', ')}`)

console.log(JSON.stringify({
  ok: true,
  mode: summary.mode,
  totalCases: summary.totalCases,
  selectedPrimaryCount: summary.selectedPrimaryCount,
  selectedAdvisoryCount: summary.selectedAdvisoryCount,
  blockedCount: summary.blockedCount,
  inferenceRun: summary.inferenceRun,
  cloudRunInvoked: summary.cloudRunInvoked,
  workersDispatched: summary.workersDispatched,
  nextPrompt: summary.nextPrompt,
}, null, 2))
