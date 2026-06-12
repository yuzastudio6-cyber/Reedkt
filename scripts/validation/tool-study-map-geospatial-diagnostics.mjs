import { existsSync, readFileSync } from 'node:fs'

const requiredDocs = [
  'docs/tool-studies/map-geospatial-tool-study.md',
  'docs/tool-studies/map-geospatial-capability-map.md',
  'docs/tool-studies/map-geospatial-tool-combination-map.md',
  'docs/tool-studies/map-geospatial-routing-policy.md',
  'docs/tool-studies/map-geospatial-handoff-contract.md',
  'docs/tool-studies/map-geospatial-internal-beta-gap-map.md',
  'docs/tool-studies/map-geospatial-blocked-use-register.md',
  'docs/prompt-tool-study-0-map-geospatial-validation-results.md',
  'docs/implementation-prompts/prompt-tool-study-0-map-geospatial.md',
]

const ownedToolIds = [
  'maplibre',
  'turf',
  'deck_gl',
  'cesium_js',
  'openstreetmap_open_map_data_policy',
  'generated_local_geojson_fixtures',
  'local_offline_map_scene_manifests',
  'map_style_manifest',
  'camera_manifest',
  'timing_manifest',
  'render_manifest',
  'pmtiles_tileserver_gl_martin_future',
  'nominatim_photon_pelias_future',
  'osrm_valhalla_future',
]

const requiredPhrases = [
  'MAP_GEOSPATIAL',
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
  ['route_execution_claim', /\broute execution\s*(?::|=)\s*`?(enabled|allowed|ready|executed|true)\b/i],
  ['route_execution_statement', /\broute execution\b\s+(is|was|has been)\s+(enabled|allowed|ready|executed)\b/i],
  ['browser_capture_execution_claim', /\bbrowser capture\s*(?::|=)\s*`?(enabled|allowed|ready|executed|true)\b/i],
  ['web_search_execution_claim', /\bweb search\s*(?::|=)\s*`?(enabled|allowed|ready|executed|true)\b/i],
  ['supabase_mutation_claim', /\bSupabase mutation\s*(?::|=)\s*`?(enabled|allowed|executed|applied|true)\b/i],
  ['sql_execution_claim', /\bSQL executed:\s*`?(true|yes|applied)\b/i],
  ['migration_deployed_claim', /\bMigration deployed:\s*`?(true|yes|applied)\b/i],
  ['production_unlock_claim', /\bproduction unlock\s*(?::|=)\s*`?(enabled|allowed|ready|true)\b/i],
  ['production_unlock_statement', /\bproduction unlock\b\s+(is|was|has been)\s+(enabled|allowed|ready)\b/i],
  ['external_beta_unlock_claim', /\bexternal beta unlock\s*(?::|=)\s*`?(enabled|allowed|ready|true)\b/i],
  ['internal_beta_unlock_claim', /\binternal beta unlock\s*(?::|=)\s*`?(enabled|allowed|ready|true)\b/i],
  ['live_tile_claim', /\blive tiles?\s*(?::|=)\s*`?(enabled|allowed|ready|executed|fetched|true)\b/i],
  ['public_osm_hotlinking_claim', /\bpublic OSM tile hotlinking\s*(?::|=)\s*`?(enabled|allowed|ready|true)\b/i],
  ['live_geocoding_claim', /\blive geocoding\s*(?::|=)\s*`?(enabled|allowed|ready|executed|true)\b/i],
  ['live_routing_claim', /\blive routing\s*(?::|=)\s*`?(enabled|allowed|ready|executed|true)\b/i],
  ['paid_map_provider_claim', /\bpaid map providers?\s*(?::|=)\s*`?(enabled|allowed|ready|true)\b/i],
  ['cesium_ion_claim', /\bCesium ion\s*(?::|=)\s*`?(enabled|allowed|ready|true)\b/i],
  ['live_terrain_claim', /\blive terrain\s*(?::|=)\s*`?(enabled|allowed|ready|true)\b/i],
  ['live_imagery_claim', /\blive imagery\s*(?::|=)\s*`?(enabled|allowed|ready|true)\b/i],
  ['three_d_tiles_claim', /\b3D Tiles\s*(?::|=)\s*`?(enabled|allowed|ready|true)\b/i],
  ['secret_material', /\b(sk-[A-Za-z0-9_-]{16,}|Bearer\s+[A-Za-z0-9._~+/-]{16,}|postgres(?:ql)?:\/\/|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+|X-Goog-Signature=|X-Amz-Signature=)\b/i],
]

for (const [name, pattern] of forbiddenPatterns) {
  const match = docsText.match(pattern)
  if (match) failures.push(`forbidden_pattern:${name}:${match[0]}`)
}

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))
if (packageJson.scripts?.['tool-study:map-geospatial:diagnostics'] !== 'node scripts/validation/tool-study-map-geospatial-diagnostics.mjs') {
  failures.push('missing_package_script:tool-study:map-geospatial:diagnostics')
}

const result = {
  status: failures.length === 0 ? 'passed' : 'blocked',
  checkedDocs: requiredDocs.length,
  ownedTools: ownedToolIds.length,
  noMapRendering: true,
  noLiveTiles: true,
  noGeocoding: true,
  noRouting: true,
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
