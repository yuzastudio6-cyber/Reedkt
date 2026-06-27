import { readFileSync } from 'node:fs'

import {
  QWEN_VL_USE_CASE_ROUTING_DECISIONS,
  getProductionToolProfile,
  getQwenVlUseCaseRoutingDecision,
  rankQwenVlForUseCase,
} from '../tool-registry'
import type {
  ProductionToolId,
  QwenVlRuntimeUseCase,
  QwenVlUseCaseRoutingDecision,
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

function decision(useCaseId: QwenVlUseCaseRoutingDecision['useCaseId']): QwenVlUseCaseRoutingDecision {
  return getQwenVlUseCaseRoutingDecision(useCaseId)
}

function includesEvery<T>(values: T[], expected: T[], label: string): void {
  for (const item of expected) {
    check(values.includes(item), `${label} must include ${String(item)}`)
  }
}

const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
  scripts?: Record<string, string>
}
const docText = readFileSync('docs/qwen2-5-vl-7b-tool-routing-use-case-ranking.md', 'utf8')

check(
  packageJson.scripts?.['smoke:qwen2-5-vl-tool-routing-use-case-ranking'] ===
    'tsx server/smoke/qwen2-5-vl-tool-routing-use-case-ranking-smoke.ts',
  'Package script must point to the Qwen use-case routing smoke.',
)

const qwenProfile = getProductionToolProfile('qwen_vl')
check(Boolean(qwenProfile), 'Qwen production tool profile must exist.')
const qwen = qwenProfile!
check(qwen.category === 'visual_analysis', 'Qwen must remain visual analysis.')
check(qwen.workerType === 'gpu_ai_worker', 'Qwen must remain GPU worker scoped.')
check(qwen.gpuRequired === true, 'Qwen must require GPU.')
check(qwen.cpuAllowed === false, 'Qwen must not be CPU execution-ready.')
check(qwen.notBestFor.includes('AI video generation'), 'Qwen profile must reject AI video generation.')
check(qwen.notBestFor.includes('Final render/export'), 'Qwen profile must reject final render/export.')

check(QWEN_VL_USE_CASE_ROUTING_DECISIONS.length >= 13, 'Qwen routing decisions must cover allowed and blocked use cases.')

const useCaseIds = QWEN_VL_USE_CASE_ROUTING_DECISIONS.map((item) => item.useCaseId)
includesEvery(useCaseIds, [
  'source_frame_understanding',
  'product_demo_step_understanding',
  'broll_candidate_review',
  'generated_asset_visual_qa',
  'caption_visual_consistency_qa',
  'ocr_layout_reasoning',
  'chart_screen_reasoning',
  'safe_zone_planning_signal',
  'ai_video_generation',
  'final_render_export',
  'raw_chat_worker_execution',
  'direct_frontend_invocation',
  'unbounded_long_video_analysis',
], 'Qwen routing use cases')

const runtimeUseCases = Array.from(new Set(
  QWEN_VL_USE_CASE_ROUTING_DECISIONS
    .map((item) => item.requiredRuntimeUseCase)
    .filter((item): item is QwenVlRuntimeUseCase => Boolean(item)),
))
includesEvery(runtimeUseCases, [
  'visual_understanding',
  'broll_candidate_review',
  'frame_asset_qa',
  'caption_visual_consistency_qa',
], 'Qwen runtime use cases')

for (const item of QWEN_VL_USE_CASE_ROUTING_DECISIONS) {
  check(item.toolId === 'qwen_vl', `${item.useCaseId} must route to qwen_vl metadata.`)
  check(item.workerType === 'gpu_ai_worker', `${item.useCaseId} must stay GPU worker scoped.`)
  check(Object.values(item.sideEffectGates).every((value) => value === false), `${item.useCaseId} must keep side-effect gates false.`)
  check(item.runtimeGates.approvedSnapshotRequired, `${item.useCaseId} must require approved snapshots.`)
  check(item.runtimeGates.creditReservationRequired, `${item.useCaseId} must require credit reservation.`)
  check(item.runtimeGates.queueLeaseRequired, `${item.useCaseId} must require queue lease.`)
  check(item.runtimeGates.privateSourceRefsRequired, `${item.useCaseId} must require private source refs.`)
  check(item.runtimeGates.rawPromptAllowed === false, `${item.useCaseId} must block raw prompts.`)
  check(item.runtimeGates.publicUrlAllowed === false, `${item.useCaseId} must block public URLs.`)
  check(item.runtimeGates.signedUrlAllowed === false, `${item.useCaseId} must block signed URLs.`)
  check(item.runtimeGates.providerRouteAllowed === false, `${item.useCaseId} must block provider routing.`)
  check(item.runtimeGates.frontendInvocationAllowed === false, `${item.useCaseId} must block frontend invocation.`)
}

check(rankQwenVlForUseCase('source_frame_understanding') === 'primary_vlm', 'Source-frame understanding must rank Qwen as primary VLM.')
check(rankQwenVlForUseCase('product_demo_step_understanding') === 'primary_vlm', 'Product-demo understanding must rank Qwen as primary VLM.')
check(rankQwenVlForUseCase('broll_candidate_review') === 'primary_vlm', 'B-roll candidate review must rank Qwen as primary VLM.')
check(rankQwenVlForUseCase('generated_asset_visual_qa') === 'primary_vlm', 'Generated asset QA must rank Qwen as primary VLM.')
check(rankQwenVlForUseCase('caption_visual_consistency_qa') === 'secondary_advisory', 'Caption consistency QA must be advisory.')
check(rankQwenVlForUseCase('ocr_layout_reasoning') === 'secondary_advisory', 'OCR layout reasoning must be advisory.')
check(rankQwenVlForUseCase('chart_screen_reasoning') === 'secondary_advisory', 'Chart/screen reasoning must be advisory.')
check(rankQwenVlForUseCase('safe_zone_planning_signal') === 'secondary_advisory', 'Safe-zone planning must be advisory.')
check(rankQwenVlForUseCase('ai_video_generation') === 'blocked', 'AI video generation must block Qwen.')
check(rankQwenVlForUseCase('final_render_export') === 'blocked', 'Final render/export must block Qwen.')
check(rankQwenVlForUseCase('raw_chat_worker_execution') === 'blocked', 'Raw chat worker execution must block Qwen.')
check(rankQwenVlForUseCase('direct_frontend_invocation') === 'blocked', 'Frontend invocation must block Qwen.')

const aiVideo = decision('ai_video_generation')
check(aiVideo.preferredAfter.includes('wan_video'), 'Wan must remain ahead of Qwen for AI video generation.')
check(aiVideo.preferredAfter.includes('ltx_video'), 'LTX must remain ahead of Qwen for AI video preview routes.')
check(aiVideo.mustNotReplace.includes('wan_video'), 'Qwen must not replace Wan.')
check(aiVideo.requiredRuntimeUseCase === null, 'AI video generation must not map to a Qwen runtime use case.')

const ocr = decision('ocr_layout_reasoning')
check(ocr.preferredAfter.includes('paddleocr'), 'PaddleOCR must precede Qwen for exact OCR.')
check(ocr.mustNotReplace.includes('paddleocr'), 'Qwen must not replace deterministic OCR.')

const chart = decision('chart_screen_reasoning')
includesEvery(chart.preferredAfter, ['d3', 'echarts', 'paddleocr'] as ProductionToolId[], 'Chart reasoning precedence')
includesEvery(chart.mustNotReplace, ['d3', 'echarts', 'vega_lite', 'paddleocr'] as ProductionToolId[], 'Chart exact tool boundary')

const render = decision('final_render_export')
includesEvery(render.mustNotReplace, ['remotion', 'ffmpeg', 'ffprobe'] as ProductionToolId[], 'Render/export ownership')

check(docText.includes('Qwen2.5-VL 7B Instruct is a visual understanding and visual QA tool.'), 'Doc must define Qwen visual-analysis scope.')
check(docText.includes('Wan remains the primary open-source generated B-roll route.'), 'Doc must preserve Wan as generated B-roll primary.')
check(docText.includes('LTX remains the secondary fast-preview/image-to-video route.'), 'Doc must preserve LTX secondary route.')
check(docText.includes('Qwen can review B-roll candidates and generated asset QA, but it must not create generated video.'), 'Doc must block Qwen generation.')
check(docText.includes('minInstances=0'), 'Doc must record scale-to-zero GPU policy.')
check(docText.includes('QWEN2_5_VL_STACK_TOOL_40-ROUTING-INTEGRATION-DRY-RUN'), 'Doc must recommend the next routing dry-run prompt.')

const forbiddenFindings = [
  ...collectForbiddenStrings(QWEN_VL_USE_CASE_ROUTING_DECISIONS, 'QWEN_VL_USE_CASE_ROUTING_DECISIONS'),
  ...collectForbiddenStrings(docText, 'docText'),
]
check(forbiddenFindings.length === 0, `Forbidden concrete URLs/secrets/storage markers found: ${forbiddenFindings.join(', ')}`)

console.log(JSON.stringify({
  ok: true,
  qwenUseCaseCount: QWEN_VL_USE_CASE_ROUTING_DECISIONS.length,
  runtimeUseCases,
  primaryUseCases: QWEN_VL_USE_CASE_ROUTING_DECISIONS
    .filter((item) => item.rank === 'primary_vlm')
    .map((item) => item.useCaseId),
  blockedUseCases: QWEN_VL_USE_CASE_ROUTING_DECISIONS
    .filter((item) => item.rank === 'blocked')
    .map((item) => item.useCaseId),
  nextPrompt: 'QWEN2_5_VL_STACK_TOOL_40-ROUTING-INTEGRATION-DRY-RUN',
}, null, 2))
