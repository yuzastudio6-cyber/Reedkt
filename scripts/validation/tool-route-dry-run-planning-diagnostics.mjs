import { existsSync, readFileSync } from 'node:fs'

const requiredPaths = [
  'docs/tool-routes/tool-route-1-route-dry-run-planning.md',
  'docs/tool-routes/tool-route-1-route-family-dry-run-plan.md',
  'docs/tool-routes/tool-route-1-owner-route-plan.md',
  'docs/tool-routes/tool-route-1-artifact-contract-map.md',
  'docs/tool-routes/tool-route-1-qa-gate-map.md',
  'docs/tool-routes/tool-route-1-blocked-execution-validation.md',
  'docs/tool-routes/tool-route-1-gap-map.md',
  'docs/tool-routes/tool-route-1-next-phase-plan.md',
  'docs/activation-phase-tool-route-1-route-dry-run-planning-results.md',
  'docs/implementation-prompts/prompt-tool-route-2-generated-local-fixture-planning.md',
  'docs/activation-tool-route-dry-run-planning-reports/audit/tool-route-dry-run-source-audit.json',
  'docs/activation-tool-route-dry-run-planning-reports/studies/tool-route-owner-study-context.json',
  'docs/activation-tool-route-dry-run-planning-reports/worker/worker-dry-run-context.json',
  'docs/activation-tool-route-dry-run-planning-reports/routes/tool-route-family-dry-run-plan.json',
  'docs/activation-tool-route-dry-run-planning-reports/routes/tool-route-owner-route-plan.json',
  'docs/activation-tool-route-dry-run-planning-reports/artifacts/tool-route-artifact-contract-map.json',
  'docs/activation-tool-route-dry-run-planning-reports/qa/tool-route-qa-gate-map.json',
  'docs/activation-tool-route-dry-run-planning-reports/validation/tool-route-blocked-execution-validation.json',
  'docs/activation-tool-route-dry-run-planning-reports/gaps/tool-route-dry-run-gap-map.json',
  'docs/activation-tool-route-dry-run-planning-reports/roadmap/tool-route-dry-run-next-phase-plan.json',
  'docs/activation-tool-route-dry-run-planning-reports/qa/tool-route-dry-run-planning-qa.json',
  'docs/activation-tool-route-dry-run-planning-reports/reports/tool-route-dry-run-planning-report.json',
  'docs/activation-tool-route-dry-run-planning-reports/summary/tool-route-dry-run-planning-summary.json',
]

const ownerStudyPaths = [
  'docs/tool-studies/web-search-capture-tool-study.md',
  'docs/tool-studies/map-geospatial-tool-study.md',
  'docs/tool-studies/ai-tools-creative-graphics-tool-study.md',
  'docs/tool-studies/track-a-render-export-tool-study.md',
  'docs/tool-studies/track-b-media-processing-tool-study.md',
  'docs/tool-studies/sound-music-audio-tool-study.md',
]

const routeFamilyIds = [
  'provider_model_planning',
  'worker_runtime_job_planning',
  'web_search_capture',
  'map_geospatial',
  'ai_tools_creative_graphics',
  'track_a_render_export',
  'track_b_media_processing',
  'sound_music_audio',
  'supabase_metadata_storage',
  'observability_audit_cost',
  'compliance_security',
  'frontend_product_ux',
  'billing_stripe_credits',
  'public_artifact_signed_url_delivery_blocked',
]

const ownerIds = [
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
    'toolExecution',
    'workerExecution',
    'routeExecution',
    'providerModelCalls',
    'mediaProcessing',
    'browserMapWeb',
    'supabaseMutation',
    'sqlMigrationsSchemaRls',
    'googleCloudApiCalls',
    'secretManagerApiCalls',
    'gcsStorageTransfer',
    'publicArtifacts',
    'signedUrls',
    'rawPromptExecution',
    'production',
    'externalBeta',
    'paidProduction',
    'broadMedia',
    'stripeCredits',
    'dependencyMutation',
    'finalRenderExport',
    'audioSfxMusicGeneration',
    'ffmpegFfprobeExecution',
    'demucsRuntime',
    'qwenVlmVllmRuntime',
    'executionAuthorized',
    'runtimeReady',
    'publicArtifactAllowed',
    'signedUrlSourceOfTruthAllowed',
    'rawPromptAllowed',
    'runtimeExecutionRequired',
    'approvedForRuntime',
  ])
  const hits = []
  for (const [key, child] of Object.entries(value)) {
    if (unsafeTrueKeys.has(key) && child === true) hits.push([...path, key].join('.'))
    hits.push(...inspectFlags(child, [...path, key]))
  }
  return hits
}

if (blockers.length === 0) {
  const report = readJson('docs/activation-tool-route-dry-run-planning-reports/reports/tool-route-dry-run-planning-report.json')
  const summary = readJson('docs/activation-tool-route-dry-run-planning-reports/summary/tool-route-dry-run-planning-summary.json')
  const familyPlan = readJson('docs/activation-tool-route-dry-run-planning-reports/routes/tool-route-family-dry-run-plan.json')
  const ownerPlan = readJson('docs/activation-tool-route-dry-run-planning-reports/routes/tool-route-owner-route-plan.json')
  const artifactMap = readJson('docs/activation-tool-route-dry-run-planning-reports/artifacts/tool-route-artifact-contract-map.json')
  const qa = readJson('docs/activation-tool-route-dry-run-planning-reports/qa/tool-route-dry-run-planning-qa.json')
  const blocked = readJson('docs/activation-tool-route-dry-run-planning-reports/validation/tool-route-blocked-execution-validation.json')

  if (report.status !== 'passed') blockers.push(`report_status:${report.status}`)
  if (summary.status !== 'passed') blockers.push(`summary_status:${summary.status}`)
  if (qa.passed !== true) blockers.push('qa_not_passed')
  if (familyPlan.routeFamilyCount !== routeFamilyIds.length) blockers.push(`route_family_count:${familyPlan.routeFamilyCount}`)
  if (ownerPlan.ownerRouteCount !== ownerIds.length) blockers.push(`owner_route_count:${ownerPlan.ownerRouteCount}`)
  if (artifactMap.artifactContractCount !== 15) blockers.push(`artifact_contract_count:${artifactMap.artifactContractCount}`)
  if (blocked.allExecutionBlocked !== true) blockers.push('blocked_execution_not_confirmed')
  if (summary.toolRoute2Readiness !== 'ready_for_TOOL_ROUTE_2_generated_local_fixture_planning') {
    blockers.push(`tool_route2_readiness:${summary.toolRoute2Readiness}`)
  }
  if (summary.supabaseUpdateClassification?.milestoneSync !== 'blocked_current_branch_missing_sync_layer') {
    blockers.push('missing_supabase_sync_layer_blocker')
  }
  for (const familyId of routeFamilyIds) {
    if (!familyPlan.families?.some((family) => family.familyId === familyId)) {
      blockers.push(`missing_route_family:${familyId}`)
    }
  }
  for (const owner of ownerIds) {
    if (!ownerPlan.ownerRoutes?.some((route) => route.owner === owner)) {
      blockers.push(`missing_owner_route:${owner}`)
    }
  }
  for (const [name, document] of Object.entries({ report, summary, familyPlan, ownerPlan, artifactMap, qa, blocked })) {
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
const forbiddenPatterns = [
  ['db_url', /postgres(?:ql)?:\/\//i],
  ['jwt', /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/],
  ['bearer', /Bearer\s+[A-Za-z0-9._~+/-]{16,}/i],
  ['provider_key', /\bsk-[A-Za-z0-9_-]{20,}\b/],
  ['stripe_key', /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{16,}\b/],
  ['signed_url_material', signedUrlMaterialPattern],
  ['positive_execution_claim', /\b(?:toolExecution|workerExecution|routeExecution|providerModelCalls|supabaseMutation|production|externalBeta|finalRenderExport|executionAllowed|executionAuthorized|runtimeReady|publicArtifactAllowed|signedUrlSourceOfTruthAllowed)\s*[:=]\s*(?:true|enabled|allowed|ready)\b/i],
]
for (const path of textScanPaths) {
  const text = readFileSync(path, 'utf8')
  if (!text.includes(noScopeStatement)) {
    if (path.includes('tool-route-1') || path.includes('prompt-tool-route-2')) {
      blockers.push(`missing_no_scope_statement:${path}`)
    }
  }
  for (const [name, pattern] of forbiddenPatterns) {
    if (pattern.test(text)) blockers.push(`forbidden_pattern:${name}:${path}`)
  }
}

const result = {
  status: blockers.length === 0 ? 'passed' : 'blocked',
  checkedPaths: requiredPaths.length + ownerStudyPaths.length,
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
