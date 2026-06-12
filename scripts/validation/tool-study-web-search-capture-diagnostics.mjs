import { existsSync, readFileSync } from 'node:fs'

const requiredDocs = [
  'docs/tool-studies/web-search-capture-tool-study.md',
  'docs/tool-studies/web-search-capture-capability-map.md',
  'docs/tool-studies/web-search-capture-tool-combination-map.md',
  'docs/tool-studies/web-search-capture-routing-policy.md',
  'docs/tool-studies/web-search-capture-handoff-contract.md',
  'docs/tool-studies/web-search-capture-internal-beta-gap-map.md',
  'docs/tool-studies/web-search-capture-blocked-use-register.md',
  'docs/prompt-tool-study-0-web-search-capture-validation-results.md',
  'docs/implementation-prompts/prompt-tool-study-0-web-search-capture.md',
]

const ownedToolIds = [
  'private_searxng',
  'brave_search_fallback',
  'provider_routing_confidence_scoring',
  'playwright_controlled_capture',
  'mozilla_readability_extraction',
  'web_capture_screenshot_processing',
  'source_manifest',
  'capture_manifest',
  'extraction_manifest',
  'search_capture_qa_report',
]

const requiredPhrases = [
  'WEB_SEARCH_CAPTURE',
  'ready_for_TOOL_ROUTE_1_route_dry_run_planning_after_owner_review',
  'blocked_current_branch_missing_sync_layer',
  'No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.',
]

const failures = []
for (const path of requiredDocs) {
  if (!existsSync(path)) failures.push(`missing_doc:${path}`)
}

const docsText = requiredDocs
  .filter((path) => existsSync(path))
  .map((path) => `\n--- ${path} ---\n${readFileSync(path, 'utf8')}`)
  .join('\n')

for (const toolId of ownedToolIds) {
  if (!docsText.includes(toolId)) failures.push(`missing_owned_tool:${toolId}`)
}

for (const phrase of requiredPhrases) {
  if (!docsText.includes(phrase)) failures.push(`missing_required_phrase:${phrase.slice(0, 80)}`)
}

const forbiddenPatterns = [
  ['public_artifact_enabled', /\bpublic artifacts?\s*(?::|=)\s*`?(enabled|created|allowed|ready|true)\b/i],
  ['public_artifact_enabled_statement', /\bpublic artifacts?\b\s+(is|are|was|were)\s+(enabled|created|allowed|ready|source-of-truth)\b/i],
  ['signed_url_source_truth', /\bsigned URLs?\s*(?::|=)\s*`?(source-of-truth|source of truth|enabled|created|allowed|true)\b/i],
  ['signed_url_source_truth_statement', /\bsigned URLs?\b\s+(is|are|was|were)\s+(source-of-truth|source of truth|enabled|created|allowed)\b/i],
  ['raw_prompt_execution_claim', /\braw prompt execution\s*(?::|=)\s*`?(enabled|allowed|ready|executed|true)\b/i],
  ['raw_prompt_execution_statement', /\braw prompt execution\b\s+(is|was|has been)\s+(enabled|allowed|ready|executed)\b/i],
  ['worker_execution_claim', /\bworker execution\s*(?::|=)\s*`?(enabled|allowed|ready|executed|true)\b/i],
  ['worker_execution_statement', /\bworker execution\b\s+(is|was|has been)\s+(enabled|allowed|ready|executed)\b/i],
  ['provider_execution_claim', /\b(provider|model) calls?\s*(?::|=)\s*`?(enabled|allowed|ready|executed|true)\b/i],
  ['provider_execution_statement', /\b(provider|model) calls?\b\s+(is|are|was|were|has been|have been)\s+(enabled|allowed|ready|executed)\b/i],
  ['tool_execution_claim', /\btool execution\s*(?::|=)\s*`?(enabled|allowed|ready|executed|true)\b/i],
  ['tool_execution_statement', /\btool execution\b\s+(is|was|has been)\s+(enabled|allowed|ready|executed)\b/i],
  ['browser_capture_execution_claim', /\bbrowser capture\s*(?::|=)\s*`?(enabled|allowed|ready|executed|true)\b/i],
  ['browser_capture_execution_statement', /\bbrowser capture\b\s+(is|was|has been)\s+(enabled|allowed|ready|executed)\b/i],
  ['web_search_execution_claim', /\bweb search\s*(?::|=)\s*`?(enabled|allowed|ready|executed|true)\b/i],
  ['web_search_execution_statement', /\bweb search\b\s+(is|was|has been)\s+(enabled|allowed|ready|executed)\b/i],
  ['supabase_mutation_claim', /\bSupabase mutation\s*(?::|=)\s*`?(enabled|allowed|executed|applied|true)\b/i],
  ['supabase_mutation_statement', /\bSupabase mutation\b\s+(is|was|has been)\s+(enabled|allowed|executed|applied)\b/i],
  ['sql_execution_claim', /\bSQL executed:\s*`?(true|yes|applied)\b/i],
  ['migration_deployed_claim', /\bMigration deployed:\s*`?(true|yes|applied)\b/i],
  ['production_unlock_claim', /\bproduction unlock\b.{0,40}\b(enabled|allowed|ready)\b/i],
  ['external_beta_unlock_claim', /\bexternal beta unlock\b.{0,40}\b(enabled|allowed|ready)\b/i],
  ['secret_material', /\b(sk-[A-Za-z0-9_-]{16,}|Bearer\s+[A-Za-z0-9._~+/-]{16,}|postgres(?:ql)?:\/\/|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+|X-Goog-Signature=|X-Amz-Signature=)\b/i],
]

for (const [name, pattern] of forbiddenPatterns) {
  const match = docsText.match(pattern)
  if (match) failures.push(`forbidden_pattern:${name}:${match[0]}`)
}

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))
if (packageJson.scripts?.['tool-study:web-search-capture:diagnostics'] !== 'node scripts/validation/tool-study-web-search-capture-diagnostics.mjs') {
  failures.push('missing_package_script:tool-study:web-search-capture:diagnostics')
}

const result = {
  status: failures.length === 0 ? 'passed' : 'blocked',
  checkedDocs: requiredDocs.length,
  ownedTools: ownedToolIds.length,
  noWebSearchExecution: true,
  noBrowserCapture: true,
  noProviderCalls: true,
  noToolExecution: true,
  noWorkerExecution: true,
  noRouteExecution: true,
  noSupabaseMutation: true,
  noPublicArtifacts: true,
  noSignedUrls: true,
  noBetaProductionUnlock: true,
  failures,
}

console.log(JSON.stringify(result, null, 2))
if (failures.length > 0) process.exit(1)
