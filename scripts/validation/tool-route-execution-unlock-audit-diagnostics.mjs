import { existsSync, readFileSync } from 'node:fs'

const requiredPaths = [
  'docs/tool-routes/tool-route-execution-unlock-audit.md',
  'docs/tool-routes/tool-route-family-map.md',
  'docs/tool-routes/tool-study-prerequisite-map.md',
  'docs/tool-routes/tool-route-blocked-use-register.md',
  'docs/tool-routes/tool-route-next-phase-plan.md',
  'docs/activation-phase-tool-route-0-execution-unlock-audit-results.md',
  'docs/activation-tool-route-execution-unlock-audit-reports/audit/tool-route-source-audit.json',
  'docs/activation-tool-route-execution-unlock-audit-reports/routes/worker-dry-run-route-resolution.json',
  'docs/activation-tool-route-execution-unlock-audit-reports/routes/tool-route-family-map.json',
  'docs/activation-tool-route-execution-unlock-audit-reports/prerequisites/tool-study-prerequisite-map.json',
  'docs/activation-tool-route-execution-unlock-audit-reports/blocked/tool-route-blocked-use-register.json',
  'docs/activation-tool-route-execution-unlock-audit-reports/prompts/tool-study-owner-prompt-map.json',
  'docs/activation-tool-route-execution-unlock-audit-reports/gaps/tool-route-gap-map.json',
  'docs/activation-tool-route-execution-unlock-audit-reports/roadmap/tool-route-next-phase-plan.json',
  'docs/activation-tool-route-execution-unlock-audit-reports/qa/tool-route-execution-unlock-audit-qa.json',
  'docs/activation-tool-route-execution-unlock-audit-reports/reports/tool-route-execution-unlock-audit-report.json',
]

const promptPaths = [
  'docs/implementation-prompts/prompt-tool-study-0-web-search-capture.md',
  'docs/implementation-prompts/prompt-tool-study-0-map-geospatial.md',
  'docs/implementation-prompts/prompt-tool-study-0-ai-tools-creative-graphics.md',
  'docs/implementation-prompts/prompt-tool-study-0-track-a-render-export.md',
  'docs/implementation-prompts/prompt-tool-study-0-track-b-media-processing.md',
  'docs/implementation-prompts/prompt-tool-study-0-sound-music-audio.md',
]

const blockers = []
for (const path of [...requiredPaths, ...promptPaths]) {
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
    'executionAllowed',
    'routeExecutionAllowed',
    'approvedForRuntime',
    'runtimeReady',
  ])
  const hits = []
  for (const [key, child] of Object.entries(value)) {
    if (unsafeTrueKeys.has(key) && child === true) hits.push([...path, key].join('.'))
    hits.push(...inspectFlags(child, [...path, key]))
  }
  return hits
}

if (blockers.length === 0) {
  const report = readJson('docs/activation-tool-route-execution-unlock-audit-reports/reports/tool-route-execution-unlock-audit-report.json')
  const qa = readJson('docs/activation-tool-route-execution-unlock-audit-reports/qa/tool-route-execution-unlock-audit-qa.json')
  const familyMap = readJson('docs/activation-tool-route-execution-unlock-audit-reports/routes/tool-route-family-map.json')
  const prerequisites = readJson('docs/activation-tool-route-execution-unlock-audit-reports/prerequisites/tool-study-prerequisite-map.json')
  const blocked = readJson('docs/activation-tool-route-execution-unlock-audit-reports/blocked/tool-route-blocked-use-register.json')
  if (report.status !== 'passed') blockers.push(`report_status:${report.status}`)
  if (qa.passed !== true) blockers.push('qa_not_passed')
  if (familyMap.routeFamilyCount !== 14) blockers.push(`route_family_count:${familyMap.routeFamilyCount}`)
  if (prerequisites.prerequisites?.length !== 9) blockers.push(`prerequisite_count:${prerequisites.prerequisites?.length}`)
  if (blocked.allExecutionBlocked !== true) blockers.push('blocked_register_not_all_blocked')
  for (const [name, document] of Object.entries({ report, qa, familyMap, prerequisites, blocked })) {
    for (const flagPath of inspectFlags(document)) blockers.push(`unsafe_true_flag:${name}:${flagPath}`)
  }
}

const textScanPaths = [...requiredPaths, ...promptPaths].filter((path) => existsSync(path))
const forbiddenPatterns = [
  ['secret_manager_payload', /secret payload\s*[:=]/i],
  ['db_url', /postgres(?:ql)?:\/\//i],
  ['jwt', /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/],
  ['bearer', /Bearer\s+[A-Za-z0-9._~+/-]{16,}/i],
  ['provider_key', /\bsk-[A-Za-z0-9_-]{20,}\b/],
  ['stripe_key', /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{16,}\b/],
  ['signed_url_material', /X-Goog-Signature=|X-Goog-Credential=|X-Amz-Signature=|X-Amz-Credential=/i],
]
for (const path of textScanPaths) {
  const text = readFileSync(path, 'utf8')
  for (const [name, pattern] of forbiddenPatterns) {
    if (pattern.test(text)) blockers.push(`forbidden_pattern:${name}:${path}`)
  }
}

const result = {
  status: blockers.length === 0 ? 'passed' : 'blocked',
  checkedPaths: requiredPaths.length + promptPaths.length,
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
