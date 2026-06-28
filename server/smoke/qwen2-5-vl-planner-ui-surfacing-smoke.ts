import { existsSync, readFileSync } from 'node:fs'

import { getQwenVlPlannerRoutingUiData } from '../../src/lib/qwen-vl-planner-routing-ui'

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
      /raw[_-]?worker[_-]?prompt/i,
      /raw[_-]?provider[_-]?prompt/i,
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
const docText = readFileSync('docs/qwen2-5-vl-7b-planner-ui-surfacing.md', 'utf8')
const componentText = readFileSync('src/components/editor/InlineQwenPlannerRoutingCard.tsx', 'utf8')
const editorText = readFileSync('src/components/editor/ChatNativeEditor.tsx', 'utf8')
const chatPlanningFlowText = readFileSync('src/lib/chat-planning-flow.ts', 'utf8')
const uiDataText = readFileSync('src/lib/qwen-vl-planner-routing-ui.ts', 'utf8')

check(
  packageJson.scripts?.['smoke:qwen2-5-vl-planner-ui-surfacing'] ===
    'tsx server/smoke/qwen2-5-vl-planner-ui-surfacing-smoke.ts',
  'Package script must point to the Qwen planner UI surfacing smoke.',
)

check(existsSync('src/components/editor/InlineQwenPlannerRoutingCard.tsx'), 'Qwen planner routing card must exist.')
check(existsSync('src/lib/qwen-vl-planner-routing-ui.ts'), 'Qwen planner routing UI adapter must exist.')

const data = getQwenVlPlannerRoutingUiData()
const primary = data.handoffs.filter((handoff) => handoff.status === 'primary_metadata')
const advisory = data.handoffs.filter((handoff) => handoff.status === 'advisory_metadata')
const blocked = data.handoffs.filter((handoff) => handoff.status === 'blocked_policy')

check(data.mode === 'qwen_vl_planner_routing_ui_mock_only', 'UI data must be mock-only.')
check(data.summary.totalPlannerTasks === 13, 'UI data must cover 13 planner tasks.')
check(primary.length === 4, 'UI data must include four primary metadata routes.')
check(advisory.length === 4, 'UI data must include four advisory metadata routes.')
check(blocked.length === 5, 'UI data must include five blocked routes.')
check(data.summary.dryRunPassedClaimed === false, 'UI data must not claim dry-run pass.')
check(Object.values(data.executionGates).every((value) => value === false), 'Every UI execution gate must remain false.')
check(
  data.privateInvokeClient.routeId === 'jobs.qwen2_5_vl.privateInvoke.dryRun',
  'UI data must include the private invoke dry-run route id.',
)
check(
  data.privateInvokeClient.routePath === '/api/jobs/qwen2-5-vl/private-invoke/dry-run/mock',
  'UI data must include the mock private invoke route path.',
)
check(
  data.privateInvokeClient.clientHelper === 'callQwen25VlPrivateInvokeDryRun',
  'UI data must name the typed private invoke frontend client.',
)
check(
  data.privateInvokeClient.currentStatus === 'backend_runtime_persistence_local_harness_validation_retry_required',
  'Private invoke client status must record the backend runtime persistence local harness validation-retry blocker.',
)
check(
  Object.values(data.privateInvokeClient.runtimeFlags).every((value) => value === false || value === true) &&
    data.privateInvokeClient.runtimeFlags.usesCentralApiClient === true,
  'Private invoke client must use the central API client.',
)
check(
  Object.entries(data.privateInvokeClient.runtimeFlags)
    .filter(([key]) => key !== 'usesCentralApiClient')
    .every(([, value]) => value === false),
  'Every private invoke runtime side-effect gate must remain false.',
)

check(
  primary.some((handoff) => handoff.id === 'planner_broll_relevance_scoring'),
  'B-roll relevance scoring must be a primary metadata route.',
)
check(
  blocked.some((handoff) => handoff.id === 'planner_blocked_ai_video_generation_request'),
  'AI video generation must be blocked for Qwen.',
)
check(
  blocked.some((handoff) => handoff.id === 'planner_blocked_final_export_request'),
  'Final render/export must be blocked for Qwen.',
)
check(
  data.ownerBoundaries.some((boundary) => boundary.includes('Wan/LTX/Mochi/Hunyuan own generated B-roll routes')),
  'Generated B-roll ownership must remain outside Qwen.',
)
check(
  data.ownerBoundaries.some((boundary) => boundary.includes('PaddleOCR and OpenCV own deterministic OCR')),
  'Deterministic OCR and region ownership must remain outside Qwen.',
)
check(
  data.ownerBoundaries.some((boundary) => boundary.includes('Remotion, FFmpeg, and ffprobe own composition')),
  'Composition and export ownership must remain outside Qwen.',
)

check(editorText.includes("import { InlineQwenPlannerRoutingCard } from './InlineQwenPlannerRoutingCard'"), 'Editor must import the Qwen card.')
check(editorText.includes("showCard('qwen_vl_planner_routing')"), 'Editor must gate the Qwen card with its descriptor id.')
check(editorText.includes('<InlineQwenPlannerRoutingCard descriptor={cardById.qwen_vl_planner_routing} />'), 'Editor must render the Qwen card descriptor.')

check(chatPlanningFlowText.includes("id: 'qwen_vl_planner_routing'"), 'Chat planning flow must define the Qwen descriptor.')
check(chatPlanningFlowText.includes("label: 'Qwen VLM routing'"), 'Qwen descriptor label must be present.')
check(chatPlanningFlowText.includes('summary: qwenPlannerRoutingSummary()'), 'Qwen descriptor must use the deterministic summary.')
check(chatPlanningFlowText.includes('hiddenInCompactMode: true'), 'Qwen descriptor must stay hidden in compact mode.')

check(componentText.includes('No Cloud Run invocation'), 'Component must display Cloud Run invocation blocked state.')
check(componentText.includes('No inference'), 'Component must display inference blocked state.')
check(componentText.includes('No worker dispatch'), 'Component must display worker dispatch blocked state.')
check(componentText.includes('No generated assets'), 'Component must display generated asset blocked state.')
check(componentText.includes('Private invoke client'), 'Component must display private invoke client readiness.')
check(componentText.includes('Mock route readiness'), 'Component must display mock route readiness.')
check(componentText.includes('No service URL'), 'Component must display service URL blocked state.')
check(componentText.includes('No auth header'), 'Component must display auth header blocked state.')
check(componentText.includes('No identity token'), 'Component must display identity token blocked state.')
check(componentText.includes('Raw prompts rejected'), 'Component must display raw prompt rejection.')
check(!componentText.includes('<button'), 'Qwen card must not add execution buttons.')
check(!componentText.includes('onClick='), 'Qwen card must not add click actions.')
check(!componentText.includes('Call provider'), 'Qwen card must not expose provider actions.')
check(!componentText.includes('Start worker'), 'Qwen card must not expose worker actions.')
check(!componentText.includes('Download model'), 'Qwen card must not expose model download actions.')

check(docText.includes('Decision: `qwen_vl_planner_ui_surfacing_mock_only`'), 'Doc must record the UI surfacing decision.')
check(docText.includes('4 primary Qwen metadata routes'), 'Doc must record primary route count.')
check(docText.includes('4 advisory Qwen metadata routes'), 'Doc must record advisory route count.')
check(docText.includes('5 blocked routes'), 'Doc must record blocked route count.')
check(docText.includes('private-invoke dry-run route'), 'Doc must record private invoke route surfacing.')
check(
  docText.includes('approved_worker_integration_review_required') ||
    docText.includes('backend_runtime_dispatch_implementation_required') ||
    docText.includes('fail_closed_backend_runtime_dispatch_coordinator_required') ||
    docText.includes('controlled_backend_dispatch_dry_run_required') ||
    docText.includes('backend_runtime_persistence_plan_required') ||
    docText.includes('backend_runtime_persistence_schema_draft_required') ||
    docText.includes('backend_runtime_persistence_local_harness_validation_retry_required') ||
    data.privateInvokeClient.currentStatus === 'backend_runtime_persistence_local_harness_validation_retry_required',
  'Doc/data must record backend runtime persistence local harness validation-retry blocker status.',
)
check(docText.includes('`parsedJson=false`'), 'Doc must record the non-JSON fixture output metadata.')
check(docText.includes('`schemaKeys=[]`'), 'Doc must record the empty schema-key metadata.')
check(docText.includes('`qwen_fixture_visual_metadata_v1`'), 'Doc must record the structured fixture schema.')
check(docText.includes('`schemaValid=true`'), 'Doc must record the schema-valid structured retry evidence.')
check(docText.includes('`objectCount=3`'), 'Doc must record structured object-row evidence.')
check(docText.includes('`textLikeRegionCount=1`'), 'Doc must record structured text-like-row evidence.')
check(
  docText.includes('structured-output result review accepted the schema keys'),
  'Doc must record structured output result review acceptance.',
)
check(
  docText.includes('Private runtime review accepted the controlled L4 runtime evidence'),
  'Doc must record private runtime review acceptance.',
)
check(
  docText.includes('Approved worker integration review accepted the local queue contract'),
  'Doc must record approved worker integration review acceptance.',
)
check(
  docText.includes('Backend runtime dispatch implementation plan is recorded'),
  'Doc must record backend runtime dispatch implementation planning.',
)
check(
  docText.includes('Fail-closed backend runtime dispatch coordinator is implemented'),
  'Doc must record fail-closed backend runtime dispatch coordinator implementation.',
)
check(
  docText.includes('Controlled backend dispatch dry-run review covers all eight coordinator outcomes'),
  'Doc must record controlled backend dispatch dry-run review coverage.',
)
check(
  docText.includes('Backend runtime persistence plan maps Qwen dispatch to existing approved snapshot'),
  'Doc must record backend runtime persistence plan coverage.',
)
check(
  docText.includes('Backend runtime persistence schema draft review confirms Qwen should reuse those existing surfaces'),
  'Doc must record backend runtime persistence schema review acceptance.',
)
check(
  docText.includes('Backend runtime persistence migration draft and local SQL tests are recorded'),
  'Doc must record migration draft evidence as recorded.',
)
check(
  docText.includes('Backend runtime persistence local validation result is recorded as blocked'),
  'Doc must record blocked local validation result evidence.',
)
check(
  docText.includes('Backend runtime persistence local harness plan is recorded'),
  'Doc must record local harness plan evidence.',
)
check(
  docText.includes('User-facing readiness remains blocked until the approved local validation retry passes'),
  'Doc must record local harness validation retry as the remaining blocker.',
)
check(
  docText.includes('Backend runtime persistence local harness validation was attempted and stopped before SQL because port `54322` is already allocated'),
  'Doc must record the port-conflict validation result.',
)
check(
  docText.includes('The Qwen local harness config now uses non-conflicting ports `55430`, `55431`, `55432`, `55433`, and `55434`'),
  'Doc must record the non-conflicting Qwen local harness port set.',
)
check(
  docText.includes('contractSatisfiedForFutureRuntime=true') ||
    docText.includes('qwen_inference_disabled_after_contract_check'),
  'Doc must record the private invoke CPU-only caller contract smoke result.',
)
check(docText.includes('The card provides no execution buttons'), 'Doc must forbid execution buttons.')
check(docText.includes(data.nextPrompt), 'Doc must record the next prompt.')

const forbiddenFindings = [
  ...collectForbiddenStrings(data, 'data'),
  ...collectForbiddenStrings(docText, 'docText'),
  ...collectForbiddenStrings(componentText, 'componentText'),
  ...collectForbiddenStrings(uiDataText, 'uiDataText'),
]
check(forbiddenFindings.length === 0, `Forbidden concrete URL/secret/storage/raw-prompt markers found: ${forbiddenFindings.join(', ')}`)

console.log(JSON.stringify({
  ok: true,
  mode: data.mode,
  totalPlannerTasks: data.summary.totalPlannerTasks,
  primaryMetadataRoutes: data.summary.primaryMetadataRoutes,
  advisoryMetadataRoutes: data.summary.advisoryMetadataRoutes,
  blockedRoutes: data.summary.blockedRoutes,
  plannerMayDispatchWorker: data.executionGates.plannerMayDispatchWorker,
  plannerMayInvokeCloudRun: data.executionGates.plannerMayInvokeCloudRun,
  plannerMayRunInference: data.executionGates.plannerMayRunInference,
  plannerMayCreateGeneratedAsset: data.executionGates.plannerMayCreateGeneratedAsset,
  privateInvokeRouteId: data.privateInvokeClient.routeId,
  privateInvokeStatus: data.privateInvokeClient.currentStatus,
  nextPrompt: data.nextPrompt,
}, null, 2))
