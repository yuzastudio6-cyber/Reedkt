import { existsSync, readFileSync } from 'node:fs'

const fixturePaths = {
  animejs: 'docs/open-source-tool-stack/owners/fixtures/ai-graphics-batch-3-anime-timing-manifest.json',
  three: 'docs/open-source-tool-stack/owners/fixtures/ai-graphics-batch-3-three-scene-manifest.json',
  pixiJs: 'docs/open-source-tool-stack/owners/fixtures/ai-graphics-batch-3-pixi-sprite-manifest.json',
  konva: 'docs/open-source-tool-stack/owners/fixtures/ai-graphics-batch-3-konva-layer-manifest.json',
  babylonjs: 'docs/open-source-tool-stack/owners/fixtures/ai-graphics-batch-3-babylon-scene-manifest.json',
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
  'canvasRuntimeApprovedNow',
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
  'browser_runtime',
  'webgl_runtime',
  'canvas_runtime',
  'route_execution',
  'worker_execution',
  'provider_model_call',
  'supabase_mutation',
  'gcs_upload',
  'signed_url_creation',
  'public_artifact_creation',
  'render_export',
  'media_processing',
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

const animeFixture = fixtures.animejs
if (animeFixture) {
  if (animeFixture.packageName !== 'animejs') failures.push('animejs_package_name_wrong')
  if (animeFixture.proofScope !== 'timing_manifest_only_no_motion_runtime') failures.push('animejs_scope_wrong')
  if (!Array.isArray(animeFixture.timingManifest?.cues) || animeFixture.timingManifest.cues.length !== 3) failures.push('animejs_cues_wrong')
  if (animeFixture.timingManifest?.durationFrames !== 120) failures.push('animejs_duration_wrong')
  if (animeFixture.motionRuntimeApproved !== false) failures.push('animejs_motion_runtime_not_false')
}

const threeFixture = fixtures.three
if (threeFixture) {
  if (threeFixture.packageName !== 'three') failures.push('three_package_name_wrong')
  if (threeFixture.proofScope !== 'scene_manifest_only_no_webgl_context') failures.push('three_scope_wrong')
  if (!Array.isArray(threeFixture.sceneManifest?.objects) || threeFixture.sceneManifest.objects.length !== 3) failures.push('three_objects_wrong')
  if (threeFixture.sceneManifest?.renderer?.webglContextRequired !== false) failures.push('three_webgl_context_not_false')
}

const pixiFixture = fixtures.pixiJs
if (pixiFixture) {
  if (pixiFixture.packageName !== 'pixi.js') failures.push('pixi_package_name_wrong')
  if (pixiFixture.proofScope !== 'sprite_effect_manifest_only_no_renderer_canvas') failures.push('pixi_scope_wrong')
  if (!Array.isArray(pixiFixture.spriteEffectManifest?.sprites) || pixiFixture.spriteEffectManifest.sprites.length !== 2) failures.push('pixi_sprites_wrong')
  if (pixiFixture.spriteEffectManifest?.renderer?.canvasRequired !== false) failures.push('pixi_canvas_not_false')
}

const konvaFixture = fixtures.konva
if (konvaFixture) {
  if (konvaFixture.packageName !== 'konva') failures.push('konva_package_name_wrong')
  if (konvaFixture.proofScope !== 'layer_shape_manifest_only_no_browser_canvas') failures.push('konva_scope_wrong')
  if (!Array.isArray(konvaFixture.layerShapeManifest?.layers) || konvaFixture.layerShapeManifest.layers.length !== 2) failures.push('konva_layers_wrong')
  if (konvaFixture.layerShapeManifest?.stage?.browserCanvasRequired !== false) failures.push('konva_browser_canvas_not_false')
}

const babylonFixture = fixtures.babylonjs
if (babylonFixture) {
  if (babylonFixture.packageName !== 'babylonjs') failures.push('babylon_package_name_wrong')
  if (babylonFixture.proofScope !== 'scene_manifest_only_no_engine_webgl_runtime') failures.push('babylon_scope_wrong')
  if (!Array.isArray(babylonFixture.sceneManifest?.nodes) || babylonFixture.sceneManifest.nodes.length !== 3) failures.push('babylon_nodes_wrong')
  if (babylonFixture.sceneManifest?.engine?.webglContextRequired !== false) failures.push('babylon_webgl_context_not_false')
}

const result = {
  status: failures.length === 0 ? 'passed' : 'blocked',
  proofType: 'batch_3_synthetic_manifest_validation_no_browser_webgl_canvas_output',
  fixturesReviewed: Object.keys(fixturePaths),
  browserRuntimeExecuted: false,
  webglRuntimeExecuted: false,
  canvasRuntimeExecuted: false,
  routeExecutionUsed: false,
  workerExecutionUsed: false,
  providerRuntimeUsed: false,
  renderExportUsed: false,
  mediaRuntimeUsed: false,
  supabaseMutationUsed: false,
  publicArtifactsCreated: false,
  failures,
}

console.log(JSON.stringify(result, null, 2))
if (failures.length > 0) process.exit(1)
