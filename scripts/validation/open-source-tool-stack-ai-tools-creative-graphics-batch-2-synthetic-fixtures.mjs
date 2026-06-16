import { existsSync, readFileSync } from 'node:fs'

const fixturePaths = {
  satori: 'docs/open-source-tool-stack/owners/fixtures/ai-graphics-batch-2-satori-card-spec.json',
  svgjs: 'docs/open-source-tool-stack/owners/fixtures/ai-graphics-batch-2-svgjs-vector-spec.json',
  viz: 'docs/open-source-tool-stack/owners/fixtures/ai-graphics-batch-2-viz-graphviz-dot-spec.json',
  lottieWeb: 'docs/open-source-tool-stack/owners/fixtures/ai-graphics-batch-2-lottie-manifest-spec.json',
}
const requiredFalseBooleans = [
  'actualToolExecutionApprovedNow',
  'routeExecutionApprovedNow',
  'workerExecutionApprovedNow',
  'providerRuntimeApprovedNow',
  'renderExportApprovedNow',
  'mediaRuntimeApprovedNow',
  'browserRuntimeApprovedNow',
  'webglRuntimeApprovedNow',
  'supabaseMutationApprovedNow',
  'gcsUploadApprovedNow',
  'publicArtifactsApproved',
  'signedUrlsApproved',
  'rawPromptExecutionApproved',
  'internalBetaApproved',
  'externalBetaApproved',
  'productionApproved',
]
const blockedUseTokens = [
  'route_execution',
  'worker_execution',
  'provider_model_call',
  'supabase_mutation',
  'gcs_upload',
  'signed_url_creation',
  'public_artifact_creation',
  'browser_runtime',
  'webgl_runtime',
  'render_export',
  'resvg_rasterization',
  'beta_or_production_unlock',
]

const failures = []
const readFixture = (id, path) => {
  if (!existsSync(path)) {
    failures.push(`missing_fixture:${id}:${path}`)
    return null
  }
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch (error) {
    failures.push(`invalid_fixture_json:${id}:${error.message}`)
    return null
  }
}
const walkStrings = (value, strings = []) => {
  if (typeof value === 'string') strings.push(value)
  else if (Array.isArray(value)) value.forEach((item) => walkStrings(item, strings))
  else if (value && typeof value === 'object') Object.values(value).forEach((item) => walkStrings(item, strings))
  return strings
}

const fixtures = Object.fromEntries(Object.entries(fixturePaths).map(([id, path]) => [id, readFixture(id, path)]))

for (const [id, fixture] of Object.entries(fixtures)) {
  if (!fixture) continue
  if (fixture.dataClassification !== 'synthetic_only') failures.push(`fixture_not_synthetic_only:${id}`)
  if (!Array.isArray(fixture.blockedUses)) failures.push(`fixture_missing_blocked_uses:${id}`)
  for (const token of blockedUseTokens) {
    if (!fixture.blockedUses?.includes(token)) failures.push(`fixture_blocked_use_missing:${id}:${token}`)
  }
  for (const field of requiredFalseBooleans) {
    if (fixture.approvals?.[field] !== false) failures.push(`fixture_approval_not_false:${id}:${field}`)
  }
  for (const value of walkStrings(fixture)) {
    if (/https?:\/\//i.test(value) || /X-Goog-Signature=|X-Amz-Signature=/i.test(value)) {
      failures.push(`fixture_contains_url_or_signature:${id}:${value}`)
    }
    if (/\b(sk-[A-Za-z0-9_-]{16,}|Bearer\s+[A-Za-z0-9._~+/-]{16,}|postgres(?:ql)?:\/\/|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)\b/i.test(value)) {
      failures.push(`fixture_contains_secret_like_value:${id}`)
    }
  }
}

const satoriFixture = fixtures.satori
if (satoriFixture) {
  if (satoriFixture.packageName !== 'satori') failures.push('satori_package_name_wrong')
  if (satoriFixture.cardSpec?.width !== 640 || satoriFixture.cardSpec?.height !== 360) failures.push('satori_dimensions_wrong')
  if (!Array.isArray(satoriFixture.cardSpec?.textRuns) || satoriFixture.cardSpec.textRuns.length < 2) failures.push('satori_text_runs_missing')
  if (satoriFixture.cardSpec?.externalFonts?.length !== 0) failures.push('satori_external_fonts_not_empty')
  if (satoriFixture.proofScope !== 'metadata_spec_only_no_rasterization') failures.push('satori_scope_wrong')
}

const svgFixture = fixtures.svgjs
if (svgFixture) {
  if (svgFixture.packageName !== '@svgdotjs/svg.js') failures.push('svgjs_package_name_wrong')
  if (!Array.isArray(svgFixture.vectorManifest?.elements) || svgFixture.vectorManifest.elements.length < 3) failures.push('svgjs_elements_missing')
  if (svgFixture.nodeRuntimeConstructionApproved !== false) failures.push('svgjs_node_runtime_construction_not_false')
}

const vizFixture = fixtures.viz
if (vizFixture) {
  const viz = await import('@viz-js/viz')
  const instance = await viz.instance()
  const svg = instance.renderString(vizFixture.dotSpec?.source, { format: 'svg', engine: 'dot' })
  if (typeof svg !== 'string' || !svg.includes('synthetic_start') || !svg.includes('synthetic_end')) {
    failures.push('viz_in_memory_svg_validation_failed')
  }
  if (vizFixture.outputFileWritten !== false) failures.push('viz_output_file_written_not_false')
}

const lottieFixture = fixtures.lottieWeb
if (lottieFixture) {
  const manifest = lottieFixture.lottieManifest
  if (manifest?.v !== '5.7.4') failures.push(`lottie_manifest_version:${manifest?.v}`)
  if (manifest?.fr !== 30 || manifest?.ip !== 0 || manifest?.op !== 60) failures.push('lottie_timing_wrong')
  if (!Array.isArray(manifest?.layers) || manifest.layers.length !== 1) failures.push('lottie_layers_wrong')
  if (!Array.isArray(manifest?.assets) || manifest.assets.length !== 0) failures.push('lottie_assets_not_empty')
  if (lottieFixture.playerRuntimeApproved !== false) failures.push('lottie_player_runtime_not_false')
}

const result = {
  status: failures.length === 0 ? 'passed' : 'blocked',
  proofType: 'batch_2_synthetic_fixture_metadata_validation_no_runtime_output',
  fixturesReviewed: Object.keys(fixturePaths),
  vizNodeOnlyDotToSvgInMemoryUsed: true,
  browserRuntimeUsed: false,
  webglRuntimeUsed: false,
  lottiePlayerRuntimeUsed: false,
  rasterizationUsed: false,
  renderExportUsed: false,
  routeExecutionUsed: false,
  workerExecutionUsed: false,
  providerRuntimeUsed: false,
  supabaseMutationUsed: false,
  publicArtifactsCreated: false,
  failures,
}

console.log(JSON.stringify(result, null, 2))
if (failures.length > 0) process.exit(1)
