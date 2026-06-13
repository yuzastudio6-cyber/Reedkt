import { existsSync, readFileSync } from 'node:fs'

const requiredPaths = [
  'docs/tool-routes/tool-route-2-generated-local-fixture-planning.md',
  'docs/tool-routes/tool-route-2-fixture-catalog.md',
  'docs/tool-routes/tool-route-2-fixture-input-output-contract-map.md',
  'docs/tool-routes/tool-route-2-owner-fixture-handoff-map.md',
  'docs/tool-routes/tool-route-2-fixture-qa-gate-map.md',
  'docs/tool-routes/tool-route-2-blocked-execution-validation.md',
  'docs/tool-routes/tool-route-2-gap-map.md',
  'docs/tool-routes/tool-route-2-next-phase-plan.md',
  'docs/activation-phase-tool-route-2-generated-local-fixture-planning-results.md',
  'docs/implementation-prompts/prompt-tool-route-3-generated-local-fixture-contract-tests.md',
  'docs/activation-tool-route-generated-local-fixture-planning-reports/audit/tool-route-fixture-source-audit.json',
  'docs/activation-tool-route-generated-local-fixture-planning-reports/evidence/tool-route-1-evidence-context.json',
  'docs/activation-tool-route-generated-local-fixture-planning-reports/studies/tool-study-fixture-evidence-context.json',
  'docs/activation-tool-route-generated-local-fixture-planning-reports/fixtures/generated-local-fixture-catalog.json',
  'docs/activation-tool-route-generated-local-fixture-planning-reports/contracts/fixture-input-output-contract-map.json',
  'docs/activation-tool-route-generated-local-fixture-planning-reports/handoff/owner-fixture-handoff-map.json',
  'docs/activation-tool-route-generated-local-fixture-planning-reports/qa/fixture-qa-gate-map.json',
  'docs/activation-tool-route-generated-local-fixture-planning-reports/validation/fixture-blocked-execution-validation.json',
  'docs/activation-tool-route-generated-local-fixture-planning-reports/gaps/tool-route-fixture-gap-map.json',
  'docs/activation-tool-route-generated-local-fixture-planning-reports/roadmap/tool-route-fixture-next-phase-plan.json',
  'docs/activation-tool-route-generated-local-fixture-planning-reports/qa/tool-route-generated-local-fixture-planning-qa.json',
  'docs/activation-tool-route-generated-local-fixture-planning-reports/reports/tool-route-generated-local-fixture-planning-report.json',
  'docs/activation-tool-route-generated-local-fixture-planning-reports/summary/tool-route-generated-local-fixture-planning-summary.json',
]

const ownerStudyPaths = [
  'docs/tool-studies/web-search-capture-tool-study.md',
  'docs/tool-studies/map-geospatial-tool-study.md',
  'docs/tool-studies/ai-tools-creative-graphics-tool-study.md',
  'docs/tool-studies/track-a-render-export-tool-study.md',
  'docs/tool-studies/track-b-media-processing-tool-study.md',
  'docs/tool-studies/sound-music-audio-tool-study.md',
]

const fixtureIds = [
  'provider_model_planning_fixture',
  'worker_runtime_job_planning_fixture',
  'web_search_capture_fixture',
  'map_geospatial_fixture',
  'ai_tools_creative_graphics_fixture',
  'track_a_render_export_fixture',
  'track_b_media_processing_fixture',
  'sound_music_audio_fixture',
  'supabase_metadata_storage_fixture',
  'observability_audit_cost_fixture',
  'compliance_security_fixture',
  'frontend_product_ux_fixture',
  'billing_stripe_credits_fixture',
  'public_artifact_signed_url_delivery_blocked_fixture',
]

const owners = [
  'WEB_SEARCH_CAPTURE',
  'MAP_GEOSPATIAL',
  'AI_TOOLS_CREATIVE_GRAPHICS',
  'TRACK_A_RENDER_EXPORT',
  'TRACK_B_MEDIA_PROCESSING',
  'SOUND_MUSIC_AUDIO',
  'WORKER_RUNTIME_JOBS',
  'PROVIDER_GATEWAY_MODELS',
  'SUPABASE_RLS_STORAGE_DATABASE',
  'OBSERVABILITY_AUDIT_COST',
  'COMPLIANCE_SECURITY',
  'FRONTEND_PRODUCT_UX',
  'BILLING_STRIPE_CREDITS',
]

const noScopeStatement = 'No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.'

const blockers = []
for (const path of [...requiredPaths, ...ownerStudyPaths]) {
  if (!existsSync(path)) blockers.push(`missing_path:${path}`)
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function inspectFlags(value, path = []) {
  if (Array.isArray(value)) return value.flatMap((item, index) => inspectFlags(item, [...path, String(index)]))
  if (!value || typeof value !== 'object') return []
  const unsafeTrueKeys = new Set([
    'executionAllowed',
    'workerExecutionAllowed',
    'toolExecutionAllowed',
    'providerCallsAllowed',
    'modelCallsAllowed',
    'routeExecutionAllowed',
    'mediaProcessingAllowed',
    'browserCaptureAllowed',
    'mapRenderingAllowed',
    'audioGenerationAllowed',
    'renderExportAllowed',
    'publicArtifactsAllowed',
    'signedUrlSourceOfTruthAllowed',
    'rawPromptExecutionAllowed',
    'supabaseMutationAllowed',
    'sqlExecutionAllowed',
    'migrationDeploymentAllowed',
    'googleCloudApiCallsAllowed',
    'secretManagerApiCallsAllowed',
    'gcsStorageTransferAllowed',
    'creditMutationAllowed',
    'stripeProcessingAllowed',
    'internalBetaUnlockAllowed',
    'externalBetaUnlockAllowed',
    'productionUnlockAllowed',
    'dependencyMutationAllowed',
    'finalRenderExportAllowed',
    'broadServiceRoleHandlerAllowed',
    'publicArtifactAllowed',
    'rawPromptAllowed',
    'executionAuthorized',
  ])
  const hits = []
  for (const [key, child] of Object.entries(value)) {
    if (unsafeTrueKeys.has(key) && child === true) hits.push([...path, key].join('.'))
    hits.push(...inspectFlags(child, [...path, key]))
  }
  return hits
}

if (blockers.length === 0) {
  const report = readJson('docs/activation-tool-route-generated-local-fixture-planning-reports/reports/tool-route-generated-local-fixture-planning-report.json')
  const summary = readJson('docs/activation-tool-route-generated-local-fixture-planning-reports/summary/tool-route-generated-local-fixture-planning-summary.json')
  const catalog = readJson('docs/activation-tool-route-generated-local-fixture-planning-reports/fixtures/generated-local-fixture-catalog.json')
  const contracts = readJson('docs/activation-tool-route-generated-local-fixture-planning-reports/contracts/fixture-input-output-contract-map.json')
  const handoffs = readJson('docs/activation-tool-route-generated-local-fixture-planning-reports/handoff/owner-fixture-handoff-map.json')
  const qa = readJson('docs/activation-tool-route-generated-local-fixture-planning-reports/qa/tool-route-generated-local-fixture-planning-qa.json')
  const blocked = readJson('docs/activation-tool-route-generated-local-fixture-planning-reports/validation/fixture-blocked-execution-validation.json')
  const toolRoute1 = readJson('docs/activation-tool-route-generated-local-fixture-planning-reports/evidence/tool-route-1-evidence-context.json')

  if (report.status !== 'passed') blockers.push(`report_status:${report.status}`)
  if (summary.status !== 'passed') blockers.push(`summary_status:${summary.status}`)
  if (qa.passed !== true) blockers.push('qa_not_passed')
  if (catalog.fixtureCount !== fixtureIds.length) blockers.push(`fixture_count:${catalog.fixtureCount}`)
  if (contracts.contractCount !== fixtureIds.length) blockers.push(`contract_count:${contracts.contractCount}`)
  if (handoffs.ownerCount !== owners.length) blockers.push(`owner_count:${handoffs.ownerCount}`)
  if (blocked.allExecutionBlocked !== true) blockers.push('blocked_execution_not_confirmed')
  if (toolRoute1.runId !== 'toolroute1-20260613T141131') blockers.push(`tool_route_1_run:${toolRoute1.runId}`)
  if (summary.toolRoute3Readiness !== 'ready_for_TOOL_ROUTE_3_generated_local_fixture_contract_tests') {
    blockers.push(`tool_route3_readiness:${summary.toolRoute3Readiness}`)
  }
  if (summary.supabaseUpdateClassification?.milestoneSync !== 'blocked_current_branch_missing_sync_layer') {
    blockers.push('missing_supabase_sync_layer_blocker')
  }
  for (const fixtureId of fixtureIds) {
    if (!catalog.fixtures?.some((fixture) => fixture.fixtureId === fixtureId)) {
      blockers.push(`missing_fixture:${fixtureId}`)
    }
    if (!contracts.contracts?.some((contract) => contract.fixtureId === fixtureId)) {
      blockers.push(`missing_fixture_contract:${fixtureId}`)
    }
  }
  for (const owner of owners) {
    if (!handoffs.handoffs?.some((handoff) => handoff.owner === owner)) {
      blockers.push(`missing_owner_handoff:${owner}`)
    }
  }
  for (const [name, document] of Object.entries({ report, summary, catalog, contracts, handoffs, qa, blocked, toolRoute1 })) {
    for (const flagPath of inspectFlags(document)) blockers.push(`unsafe_true_flag:${name}:${flagPath}`)
  }
}

const textScanPaths = [...requiredPaths, ...ownerStudyPaths].filter((path) => existsSync(path))
const signedUrlMaterialPattern = new RegExp(
  [
    'X-Goog-' + 'Signature=',
    'X-Goog-' + 'Credential=',
    'X-Amz-' + 'Signature=',
    'X-Amz-' + 'Credential=',
  ].join('|'),
  'i',
)
const positiveExecutionClaimPattern = new RegExp(
  `\\b(?:${[
    'executionAllowed',
    'workerExecutionAllowed',
    'toolExecutionAllowed',
    'providerCallsAllowed',
    'routeExecutionAllowed',
    'supabaseMutationAllowed',
    'productionUnlockAllowed',
    'externalBetaUnlockAllowed',
    'publicArtifactsAllowed',
    'signedUrlSourceOfTruthAllowed',
  ].join('|')})\\s*[:=]\\s*(?:${['true', 'enabled', 'allowed', 'ready'].join('|')})\\b`,
  'i',
)
const forbiddenPatterns = [
  ['db_url', /postgres(?:ql)?:\/\//i],
  ['jwt', /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/],
  ['bearer', /Bearer\s+[A-Za-z0-9._~+/-]{16,}/i],
  ['provider_key', /\bsk-[A-Za-z0-9_-]{20,}\b/],
  ['stripe_key', /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{16,}\b/],
  ['signed_url_material', signedUrlMaterialPattern],
  ['positive_execution_claim', positiveExecutionClaimPattern],
]
for (const path of textScanPaths) {
  const text = readFileSync(path, 'utf8')
  const noScopeRequired = path.endsWith('.md') ||
    path.includes('/reports/') ||
    path.includes('/summary/') ||
    path.includes('/validation/')
  if (noScopeRequired && !text.includes(noScopeStatement)) blockers.push(`missing_no_scope_statement:${path}`)
  for (const [name, pattern] of forbiddenPatterns) {
    if (pattern.test(text)) blockers.push(`forbidden_pattern:${name}:${path}`)
  }
}

const result = {
  status: blockers.length === 0 ? 'passed' : 'blocked',
  checkedPaths: requiredPaths.length + ownerStudyPaths.length,
  fixtureCount: fixtureIds.length,
  ownerCount: owners.length,
  blockers,
  noToolExecution: true,
  noWorkerExecution: true,
  noRouteExecution: true,
  noProviderModelCalls: true,
  noSupabaseMutation: true,
  noGoogleCloudApiCalls: true,
  noGcsStorageTransfer: true,
  noProductionUnlock: true,
}

console.log(JSON.stringify(result, null, 2))
if (blockers.length > 0) process.exit(1)
