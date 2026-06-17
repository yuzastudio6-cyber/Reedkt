import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const runId = 'ai-graphics-local-fixture-validation-local-static'
const outputDir = path.join(
  '.local-artifacts',
  'tool-route',
  'ai-graphics-metadata-local-fixture-validation',
  runId,
)

const tools = [
  {
    id: 'd3',
    proofBatch: 'Batch 1',
    proofStatus: 'ai_graphics_batch_1_qa_passed_with_warnings',
    fixtureFamily: 'chart_metadata',
    validCaseId: 'valid_ai_graphics_d3_chart_metadata',
    invalidCaseId: 'invalid_ai_graphics_d3_missing_snapshot',
    blockedCaseId: 'blocked_ai_graphics_d3_svg_output_request',
    capabilityId: 'AI_GRAPHICS.chart_scale_metadata',
  },
  {
    id: 'echarts',
    proofBatch: 'Batch 1',
    proofStatus: 'ai_graphics_batch_1_qa_passed_with_warnings',
    fixtureFamily: 'chart_option_metadata',
    validCaseId: 'valid_ai_graphics_echarts_option_metadata',
    invalidCaseId: 'invalid_ai_graphics_echarts_missing_manifest',
    blockedCaseId: 'blocked_ai_graphics_echarts_chart_init_request',
    capabilityId: 'AI_GRAPHICS.echarts_option_metadata',
  },
  {
    id: 'vega-lite',
    proofBatch: 'Batch 1',
    proofStatus: 'ai_graphics_batch_1_qa_passed_with_warnings',
    fixtureFamily: 'chart_spec_metadata',
    validCaseId: 'valid_ai_graphics_vega_lite_spec_metadata',
    invalidCaseId: 'invalid_ai_graphics_vega_lite_missing_artifact_scope',
    blockedCaseId: 'blocked_ai_graphics_vega_lite_render_request',
    capabilityId: 'AI_GRAPHICS.vega_lite_spec_metadata',
  },
  {
    id: 'vega',
    proofBatch: 'Batch 1 peer',
    proofStatus: 'ai_graphics_batch_1_qa_passed_with_warnings',
    fixtureFamily: 'chart_peer_metadata',
    validCaseId: 'valid_ai_graphics_vega_peer_metadata',
    invalidCaseId: 'invalid_ai_graphics_vega_missing_capability',
    blockedCaseId: 'blocked_ai_graphics_vega_runtime_view_request',
    capabilityId: 'AI_GRAPHICS.vega_peer_metadata',
  },
  {
    id: 'satori',
    proofBatch: 'Batch 2',
    proofStatus: 'ai_graphics_batch_2_qa_passed_with_warnings',
    fixtureFamily: 'card_metadata',
    validCaseId: 'valid_ai_graphics_satori_card_metadata',
    invalidCaseId: 'invalid_ai_graphics_satori_missing_checksum',
    blockedCaseId: 'blocked_ai_graphics_satori_svg_output_request',
    capabilityId: 'AI_GRAPHICS.satori_card_metadata',
  },
  {
    id: '@svgdotjs/svg.js',
    proofBatch: 'Batch 2',
    proofStatus: 'ai_graphics_batch_2_qa_passed_with_warnings',
    fixtureFamily: 'vector_manifest',
    validCaseId: 'valid_ai_graphics_svgjs_vector_manifest',
    invalidCaseId: 'invalid_ai_graphics_svgjs_missing_owner_ref',
    blockedCaseId: 'blocked_ai_graphics_svgjs_dom_output_request',
    capabilityId: 'AI_GRAPHICS.svgjs_vector_manifest',
  },
  {
    id: '@viz-js/viz',
    proofBatch: 'Batch 2',
    proofStatus: 'ai_graphics_batch_2_qa_passed_with_warnings',
    fixtureFamily: 'dot_metadata',
    validCaseId: 'valid_ai_graphics_viz_dot_metadata',
    invalidCaseId: 'invalid_ai_graphics_viz_missing_private_scope',
    blockedCaseId: 'blocked_ai_graphics_viz_public_svg_request',
    capabilityId: 'AI_GRAPHICS.viz_dot_metadata',
  },
  {
    id: 'lottie-web',
    proofBatch: 'Batch 2',
    proofStatus: 'ai_graphics_batch_2_qa_passed_with_warnings',
    fixtureFamily: 'animation_manifest',
    validCaseId: 'valid_ai_graphics_lottie_manifest_metadata',
    invalidCaseId: 'invalid_ai_graphics_lottie_missing_cleanup_ref',
    blockedCaseId: 'blocked_ai_graphics_lottie_player_runtime_request',
    capabilityId: 'AI_GRAPHICS.lottie_manifest_metadata',
  },
  {
    id: 'animejs',
    proofBatch: 'Batch 3',
    proofStatus: 'ai_graphics_batch_3_qa_passed_with_warnings',
    fixtureFamily: 'timing_manifest',
    validCaseId: 'valid_ai_graphics_animejs_timing_manifest',
    invalidCaseId: 'invalid_ai_graphics_animejs_missing_qa_ref',
    blockedCaseId: 'blocked_ai_graphics_animejs_motion_runtime_request',
    capabilityId: 'AI_GRAPHICS.anime_timing_manifest',
  },
  {
    id: 'three',
    proofBatch: 'Batch 3',
    proofStatus: 'ai_graphics_batch_3_qa_passed_with_warnings',
    fixtureFamily: 'scene_manifest',
    validCaseId: 'valid_ai_graphics_three_scene_manifest',
    invalidCaseId: 'invalid_ai_graphics_three_missing_plan_snapshot',
    blockedCaseId: 'blocked_ai_graphics_three_webgl_renderer_request',
    capabilityId: 'AI_GRAPHICS.three_scene_manifest',
  },
  {
    id: 'pixi.js',
    proofBatch: 'Batch 3',
    proofStatus: 'ai_graphics_batch_3_qa_passed_with_warnings',
    fixtureFamily: 'sprite_effects_manifest',
    validCaseId: 'valid_ai_graphics_pixi_sprite_effects_manifest',
    invalidCaseId: 'invalid_ai_graphics_pixi_missing_scoped_manifest',
    blockedCaseId: 'blocked_ai_graphics_pixi_renderer_request',
    capabilityId: 'AI_GRAPHICS.pixi_sprite_effects_manifest',
  },
  {
    id: 'konva',
    proofBatch: 'Batch 3',
    proofStatus: 'ai_graphics_batch_3_qa_passed_with_warnings',
    fixtureFamily: 'layer_shape_manifest',
    validCaseId: 'valid_ai_graphics_konva_layer_shape_manifest',
    invalidCaseId: 'invalid_ai_graphics_konva_missing_artifact_scope',
    blockedCaseId: 'blocked_ai_graphics_konva_stage_output_request',
    capabilityId: 'AI_GRAPHICS.konva_layer_shape_manifest',
  },
  {
    id: 'babylonjs',
    proofBatch: 'Batch 3',
    proofStatus: 'ai_graphics_batch_3_qa_passed_with_warnings',
    fixtureFamily: 'scene_manifest',
    validCaseId: 'valid_ai_graphics_babylon_scene_manifest',
    invalidCaseId: 'invalid_ai_graphics_babylon_missing_checksum',
    blockedCaseId: 'blocked_ai_graphics_babylon_engine_request',
    capabilityId: 'AI_GRAPHICS.babylon_scene_manifest',
  },
]

const templatePaths = {
  valid: 'docs/tool-route-execution/fixtures/ai-graphics-metadata-local-fixture-valid-template.json',
  invalid: 'docs/tool-route-execution/fixtures/ai-graphics-metadata-local-fixture-invalid-template.json',
  blocked: 'docs/tool-route-execution/fixtures/ai-graphics-metadata-local-fixture-blocked-template.json',
}

const docPaths = {
  approval:
    'docs/tool-route-execution/ai-graphics-metadata-local-fixture-validation-approval.md',
  validationScope:
    'docs/tool-route-execution/ai-graphics-local-fixture-validation-scope.md',
  caseInventory: 'docs/tool-route-execution/ai-graphics-local-fixture-case-inventory.md',
  scopedManifest:
    'docs/tool-route-execution/ai-graphics-local-fixture-scoped-manifest-validation-policy.md',
  privateArtifact:
    'docs/tool-route-execution/ai-graphics-local-fixture-private-artifact-validation-policy.md',
  failClosed:
    'docs/tool-route-execution/ai-graphics-local-fixture-fail-closed-assertion-policy.md',
  noExecution:
    'docs/tool-route-execution/ai-graphics-local-fixture-no-execution-proof-requirements.md',
  workerHandoff:
    'docs/tool-route-execution/ai-graphics-local-fixture-worker-handoff-validation-requirements.md',
}

const requiredBlockedUses = [
  'route_execution',
  'actual_tool_execution',
  'worker_execution',
  'provider_model_runtime',
  'supabase_mutation',
]

const requiredValidPlaceholders = [
  'planSnapshotId',
  'scopedToolCallManifestId',
  'toolId',
  'capabilityId',
  'privateArtifactRef',
  'checksumRef',
  'qaRef',
  'observabilityRef',
  'cleanupRef',
  'workerHandoffRef',
]

const unsafePatterns = [
  ['url', /https?:\/\//i],
  ['signed_url_marker', /signed[_ -]?url|X-Goog-Signature=|X-Amz-Signature=/i],
  ['public_artifact_ref', /public[_ -]?artifact/i],
  ['raw_prompt_text', /raw[_ -]?prompt|unapproved_prompt_text/i],
  ['secret_like_value', /\b(sk-[A-Za-z0-9_-]{16,}|Bearer\s+[A-Za-z0-9._~+/-]{16,}|postgres(?:ql)?:\/\/|api[_-]?key|password|credential)\b/i],
  ['provider_raw_output', /provider[_ -]?(raw[_ -]?)?output/i],
  ['real_user_data', /real[_ -]?user|user[_ -]?media/i],
]

const failures = []

function read(pathname) {
  if (!existsSync(pathname)) {
    failures.push(`missing_file:${pathname}`)
    return ''
  }
  return readFileSync(pathname, 'utf8')
}

function readJson(pathname) {
  try {
    return JSON.parse(read(pathname))
  } catch (error) {
    failures.push(`invalid_json:${pathname}:${error.message}`)
    return null
  }
}

function assert(condition, failure) {
  if (!condition) failures.push(failure)
}

function hasPlaceholder(value) {
  return typeof value === 'string' && /^<[A-Z0-9_]+>$/.test(value)
}

function scanTemplateSafety(name, text) {
  for (const [patternName, pattern] of unsafePatterns) {
    if (patternName === 'raw_prompt_text' && /unapproved_prompt_text/.test(text)) continue
    if (patternName === 'public_artifact_ref' && /public_delivery_output_creation/.test(text)) continue
    if (pattern.test(text)) failures.push(`unsafe_template_token:${name}:${patternName}`)
  }
}

for (const pathname of [...Object.values(templatePaths), ...Object.values(docPaths)]) read(pathname)

const templates = {
  valid: readJson(templatePaths.valid),
  invalid: readJson(templatePaths.invalid),
  blocked: readJson(templatePaths.blocked),
}
const scopeDoc = read(docPaths.validationScope)
const inventoryDoc = read(docPaths.caseInventory)
const policyText = Object.values(docPaths).map(read).join('\n')

for (const [name, pathname] of Object.entries(templatePaths)) {
  const text = read(pathname)
  scanTemplateSafety(name, text)
  assert(text.includes('<') && text.includes('>'), `template_missing_placeholders:${name}`)
}

for (const field of requiredValidPlaceholders) {
  assert(hasPlaceholder(templates.valid?.[field]), `valid_template_missing_placeholder:${field}`)
}
assert(templates.valid?.executionApproved === false, 'valid_template_execution_not_false')
assert(templates.valid?.allowedUse === 'metadata_manifest_only', 'valid_template_allowed_use_invalid')
for (const blockedUse of requiredBlockedUses) {
  assert(templates.valid?.blockedUses?.includes(blockedUse), `valid_template_missing_blocked_use:${blockedUse}`)
}

assert(templates.invalid?.executionApproved === false, 'invalid_template_execution_not_false')
assert(templates.invalid?.expectedResult === 'fail_closed_missing_required_placeholder', 'invalid_template_expected_result_invalid')
assert(templates.invalid?.fallbackAllowed === false, 'invalid_template_fallback_not_false')
for (const field of ['planSnapshotId', 'scopedToolCallManifestId', 'privateArtifactRef', 'checksumRef']) {
  assert(templates.invalid?.missingRequiredFields?.includes(field), `invalid_template_missing_required_field:${field}`)
}

assert(templates.blocked?.executionApproved === false, 'blocked_template_execution_not_false')
assert(templates.blocked?.expectedResult === 'blocked_unsafe_runtime_or_artifact_request', 'blocked_template_expected_result_invalid')
assert(hasPlaceholder(templates.blocked?.planSnapshotId), 'blocked_template_missing_plan_snapshot')
assert(hasPlaceholder(templates.blocked?.scopedToolCallManifestId), 'blocked_template_missing_scoped_manifest')
for (const blockedUse of [
  'route_execution',
  'actual_tool_execution',
  'worker_execution',
  'browser_runtime',
  'webgl_runtime',
  'canvas_runtime',
  'resvg_rasterization',
  'remotion_render_export',
  'supabase_mutation',
  'sql_execution',
  'gcs_upload',
]) {
  assert(templates.blocked?.blockedUses?.includes(blockedUse), `blocked_template_missing_blocked_use:${blockedUse}`)
}

const toolResults = tools.map((tool) => {
  const scopeRow = scopeDoc.split('\n').find((line) => line.includes(`| \`${tool.id}\``)) ?? ''
  const inventoryRow = inventoryDoc.split('\n').find((line) => line.includes(`| \`${tool.id}\``)) ?? ''
  const combined = `${scopeRow}\n${inventoryRow}`
  const checks = {
    proofBatch: combined.includes(tool.proofBatch),
    proofStatus: combined.includes(tool.proofStatus),
    fixtureFamily: combined.includes(tool.fixtureFamily),
    validCase: combined.includes(tool.validCaseId),
    invalidCase: combined.includes(tool.invalidCaseId),
    blockedCase: combined.includes(tool.blockedCaseId),
    allowedMetadataUse: /metadata|manifest/i.test(combined),
    blockedRuntimeUse: /blocked|runtime|execution|output|render/i.test(combined),
    planSnapshotPlaceholder: combined.includes('<APPROVED_PLAN_SNAPSHOT_FIXTURE>'),
    scopedManifestPlaceholder: /<SCOPED_TOOL_CALL_MANIFEST_(?:REF|ID)>/.test(combined),
    ownerCapabilityId: combined.includes(tool.capabilityId),
    privateArtifactScope: combined.includes('<PRIVATE_ARTIFACT_MANIFEST_REF>'),
    checksumPlaceholder: combined.includes('<CHECKSUM_PLACEHOLDER>'),
    workerHandoff: /Worker/i.test(combined),
    noExecutionAssertion: /No local fixture|not execute fixtures|metadata-only/i.test(combined),
  }
  for (const [check, passed] of Object.entries(checks)) {
    if (!passed) failures.push(`tool_check_failed:${tool.id}:${check}`)
  }
  return {
    ...tool,
    validationStatus: Object.values(checks).every(Boolean) ? 'passed' : 'failed',
    checks,
  }
})

for (const token of [
  'approved plan snapshot',
  'scoped tool-call manifest',
  'private artifact',
  'checksum',
  'fail closed',
  'Worker Runtime remains separately gated',
]) {
  assert(policyText.includes(token), `policy_token_missing:${token}`)
}

const resultBooleans = {
  localFixtureValidationExecuted: true,
  localFixtureValidationPassed: failures.length === 0,
  validCaseValidationPassed: failures.filter((failure) => failure.includes('valid')).length === 0,
  invalidCaseValidationPassed: failures.filter((failure) => failure.includes('invalid')).length === 0,
  blockedCaseValidationPassed: failures.filter((failure) => failure.includes('blocked')).length === 0,
  scopedManifestValidationPassed: failures.filter((failure) => failure.includes('scoped')).length === 0,
  privateArtifactValidationPassed: failures.filter((failure) => failure.includes('artifact')).length === 0,
  failClosedValidationPassed: failures.filter((failure) => failure.includes('fail')).length === 0,
  noExecutionProofPassed: failures.filter((failure) => failure.includes('execution_not_false') || failure.includes('noExecution')).length === 0,
  workerHandoffValidationPassed: failures.filter((failure) => failure.includes('worker')).length === 0,
  localFixtureExecutionApprovedNow: false,
  routeExecutionApprovedNow: false,
  actualToolExecutionApprovedNow: false,
  workerExecutionApprovedNow: false,
  providerRuntimeApprovedNow: false,
  browserRuntimeApprovedNow: false,
  webglRuntimeApprovedNow: false,
  canvasRuntimeApprovedNow: false,
  resvgRasterizationApprovedNow: false,
  remotionRenderExportApprovedNow: false,
  supabaseMutationApprovedNow: false,
  gcsUploadApprovedNow: false,
  publicArtifactsApproved: false,
  signedUrlsApproved: false,
  rawPromptExecutionApproved: false,
  internalBetaApproved: false,
  externalBetaApproved: false,
  productionApproved: false,
}

const decisionState = failures.length
  ? failures.some((failure) => failure.includes('unsafe_template_token'))
    ? 'blocked_pending_ai_graphics_template_safety_fixes'
    : 'blocked_pending_ai_graphics_fixture_validation_failures'
  : 'tool_route_ai_graphics_metadata_local_fixture_validation_passed_with_warnings'

mkdirSync(outputDir, { recursive: true })

const localEvidence = {
  runId,
  decisionState,
  sourcePr: '#462',
  planPr: '#458',
  validationType: 'local_static_metadata_only',
  toolsValidated: tools.map((tool) => tool.id),
  templatePaths,
  resultBooleans,
  failures,
  noScope: {
    actualLocalFixtureExecution: false,
    routeExecution: false,
    actualToolExecution: false,
    workerExecution: false,
    providerRuntime: false,
    browserRuntime: false,
    webglRuntime: false,
    canvasRuntime: false,
    resvgRasterization: false,
    remotionRenderExport: false,
    supabaseMutation: false,
    sqlExecution: false,
    gcsUpload: false,
    signedUrlCreation: false,
    publicArtifactCreation: false,
    rawPromptExecution: false,
    betaProductionUnlock: false,
  },
}

const writeJson = (filename, value) => {
  writeFileSync(path.join(outputDir, filename), `${JSON.stringify(value, null, 2)}\n`)
}

writeJson('validation-report.json', localEvidence)
writeJson('tool-validation-results.json', { runId, tools: toolResults })
writeJson('valid-case-evidence.json', { runId, status: resultBooleans.validCaseValidationPassed ? 'passed' : 'failed', template: templatePaths.valid })
writeJson('invalid-case-evidence.json', { runId, status: resultBooleans.invalidCaseValidationPassed ? 'passed' : 'failed', template: templatePaths.invalid })
writeJson('blocked-case-evidence.json', { runId, status: resultBooleans.blockedCaseValidationPassed ? 'passed' : 'failed', template: templatePaths.blocked })
writeJson('scoped-manifest-evidence.json', { runId, status: resultBooleans.scopedManifestValidationPassed ? 'passed' : 'failed' })
writeJson('private-artifact-evidence.json', { runId, status: resultBooleans.privateArtifactValidationPassed ? 'passed' : 'failed' })
writeJson('fail-closed-evidence.json', { runId, status: resultBooleans.failClosedValidationPassed ? 'passed' : 'failed' })
writeJson('no-execution-proof-evidence.json', { runId, status: resultBooleans.noExecutionProofPassed ? 'passed' : 'failed', noScope: localEvidence.noScope })
writeJson('worker-handoff-evidence.json', { runId, status: resultBooleans.workerHandoffValidationPassed ? 'passed' : 'failed' })
writeJson('cleanup-evidence.json', { runId, localArtifactPath: outputDir, committed: false })
writeJson('checksum-summary.json', {
  runId,
  sha256: createHash('sha256').update(JSON.stringify(localEvidence)).digest('hex'),
})

console.log(
  JSON.stringify(
    {
      status: failures.length ? 'blocked' : 'passed',
      decisionState,
      runId,
      toolsValidated: tools.length,
      localArtifactPath: outputDir,
      localFixtureValidationExecuted: true,
      localFixtureValidationPassed: failures.length === 0,
      localFixtureExecutionApprovedNow: false,
      routeExecutionApprovedNow: false,
      actualToolExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      providerRuntimeApprovedNow: false,
      supabaseMutationApprovedNow: false,
      failures,
    },
    null,
    2,
  ),
)

if (failures.length > 0) process.exit(1)
