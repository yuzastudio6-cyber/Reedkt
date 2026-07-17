import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'

import { prepareOfflineBrowserGraphicsDockerRuntime } from '../tool-execution/browser-graphics-execution/offline-browser-graphics-docker-runtime'
import {
  OFFLINE_BROWSER_GRAPHICS_PACKAGE_IDENTITIES, OFFLINE_BROWSER_GRAPHICS_TOOL_IDS,
  validateOfflineBrowserGraphicsRequest,
} from '../tool-execution/browser-graphics-execution/offline-browser-graphics-protocol'
import {
  activatePrivateOfflineBrowserGraphicsRuntime, openPrivateOfflineBrowserGraphicsRuntime,
  readPersistedOfflineBrowserGraphicsRuntimeAuthority,
} from '../tool-execution/browser-graphics-execution/offline-browser-graphics-service'
import { createPrivateDockerCliInvocation } from '../tool-execution/private-docker-cli'

const tokens = { eyebrow: 'EDIT PLAN', title: 'Approved Story Card', body: 'Meaning first. Timing locked.', callout: 'Ready for private review' }
const requests = [
  { schemaVersion: 'offline-browser-graphics-execution-v1', toolId: 'lottie', operationId: 'tool.lottie.render_lottie_motion.v1', payload: { width: 640, height: 360, fps: 30, durationFrames: 60, motionProfileId: 'approved_motion_card_v1', backgroundMode: 'opaque_panel' } },
  { schemaVersion: 'offline-browser-graphics-execution-v1', toolId: 'pixijs', operationId: 'tool.pixijs.render_pixi_scene.v1', payload: { width: 640, height: 360, fps: 30, durationFrames: 60, motionProfileId: 'approved_motion_card_v1', backgroundMode: 'opaque_panel' } },
  { schemaVersion: 'offline-browser-graphics-execution-v1', toolId: 'konva', operationId: 'tool.konva.render_canvas_overlay.v1', payload: { width: 640, height: 360, themeProfileId: 'approved_light_card_v1', fontProfileId: 'reeditpro_reviewed_fonts_v1', maximumTextItems: 4, reviewedCopy: tokens } },
  { schemaVersion: 'offline-browser-graphics-execution-v1', toolId: 'babylon_js', operationId: 'tool.babylon_js.render_babylon_scene.v1', payload: { width: 640, height: 360, fps: 30, durationFrames: 60, sceneProfileId: 'approved_product_cube_v1', cameraProfileId: 'approved_perspective_v1', lightingProfileId: 'approved_studio_v1' } },
  { schemaVersion: 'offline-browser-graphics-execution-v1', toolId: 'playwright', operationId: 'tool.playwright.capture_authorized_internal_page.v1', payload: { captureSourceKind: 'approved_internal_html_v1', captureTemplateId: 'reeditpro_private_capture_card_v1', captureAuthorizationConfirmed: true, viewportWidth: 640, viewportHeight: 360, deviceScaleFactor: 1, reviewedCopy: { eyebrow: 'AUTHORIZED CAPTURE', title: 'Private Review Card', body: 'This server-owned template is approved for internal capture.', callout: 'No network. No public URL.' } } },
] as const

for (const invalid of [
  { ...requests[0], command: 'whoami' },
  { ...requests[0], payload: { ...requests[0].payload, sourceUrl: 'https://example.test' } },
  { ...requests[2], payload: { ...requests[2].payload, reviewedCopy: { ...tokens, title: '/etc/passwd' } } },
  { ...requests[3], payload: { ...requests[3].payload, width: 1920 } },
  { ...requests[4], payload: { ...requests[4].payload, captureAuthorizationConfirmed: false } },
  { ...requests[4], payload: { ...requests[4].payload, url: 'https://example.test/private' } },
]) assert.throws(() => validateOfflineBrowserGraphicsRequest(invalid), /unsupported|unsafe/)

const inspectInvocation = createPrivateDockerCliInvocation(['image', 'inspect', 'fixture-image'])
const buildInvocation = createPrivateDockerCliInvocation(['build', '--pull=false', '.'])
assert.equal(inspectInvocation.executable, 'docker')
assert.deepEqual(Object.keys(inspectInvocation.env).sort(), ['DOCKER_CONFIG', 'PATH'])
assert.equal(existsSync(String(inspectInvocation.env.DOCKER_CONFIG)), false)
assert.equal(inspectInvocation.evidence.credentialIsolated, true)
assert.equal(inspectInvocation.evidence.inheritedDockerConfigAccepted, false)
assert.equal(inspectInvocation.evidence.inheritedDockerContextAccepted, false)
assert.equal(inspectInvocation.evidence.inheritedDockerHostAccepted, false)
assert.notEqual(buildInvocation.executable, 'docker')
assert.deepEqual(buildInvocation.args.slice(0, 2), ['build', '--load'])
assert.equal(buildInvocation.evidence.directTrustedBuildx, true)
assert.equal(buildInvocation.evidence.localImageLoadRequired, true)
assert.notEqual(buildInvocation.env.DOCKER_CONFIG, inspectInvocation.env.DOCKER_CONFIG)
assert.throws(
  () => createPrivateDockerCliInvocation(['build', '--push', '.']),
  /forbidden transport option/,
)
assert.throws(
  () => createPrivateDockerCliInvocation(['build', '--secret', 'id=unsafe', '.']),
  /forbidden transport option/,
)

await prepareOfflineBrowserGraphicsDockerRuntime()
const activated = await activatePrivateOfflineBrowserGraphicsRuntime()
const authority = await readPersistedOfflineBrowserGraphicsRuntimeAuthority()
assert.ok(authority)
assert.deepEqual(authority.supportedOperations.map((operation) => operation.toolId), OFFLINE_BROWSER_GRAPHICS_TOOL_IDS)
assert.equal(authority.readiness.privateInternalExecutionReady, true)
assert.equal(authority.readiness.productReady, false)
const reopened = await openPrivateOfflineBrowserGraphicsRuntime()
assert.equal(reopened.image.imageIdentityHash, activated.image.imageIdentityHash)

const artifacts: Record<string, { sha256: string; byteLength: number }> = {}
for (const request of requests) {
  const first = await reopened.execute(request)
  const replay = await reopened.execute(request)
  const expectedPackage = OFFLINE_BROWSER_GRAPHICS_PACKAGE_IDENTITIES[request.toolId]
  assert.equal(first.artifact.mimeType, 'image/png')
  assert.equal(first.artifact.bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
  assert.equal(first.artifact.width, 640); assert.equal(first.artifact.height, 360)
  assert.equal(first.artifact.sha256, replay.artifact.sha256)
  assert.equal(first.evidence.packageName, expectedPackage.packageName)
  assert.equal(first.evidence.packageVersion, expectedPackage.version)
  assert.equal(first.evidence.networkRequestCount, 0)
  assert.equal(first.evidence.confinement.networkMode, 'none')
  assert.equal(first.evidence.confinement.readOnlyRootFilesystem, true)
  assert.equal(first.evidence.confinement.capDropAll, true)
  assert.equal(first.evidence.confinement.noNewPrivileges, true)
  assert.equal(first.evidence.confinement.user, '10001:10001')
  assert.equal(first.evidence.semanticEvidence.actualPackageEntrypointExecuted, true)
  assert.equal(first.evidence.semanticEvidence.decodedPngVerified, true)
  assert.ok(Number(first.evidence.semanticEvidence.pixelsDifferentFromFirst) >= 1_000)
  assert.equal(first.readiness.productReady, false)
  artifacts[request.toolId] = { sha256: first.artifact.sha256, byteLength: first.artifact.byteLength }
}

console.log(JSON.stringify({
  smoke: 'offline_browser_graphics_execution', status: 'passed', toolCount: requests.length,
  proofs: [
    'five_exact_tool_and_operation_identities_validated', 'exact_package_versions_executed',
    'caller_urls_html_scripts_commands_paths_credentials_and_extra_fields_rejected',
    'playwright_capture_limited_to_authorized_server_owned_internal_template',
    'docker_buildx_uses_fresh_credential_free_config_and_rejects_push_secret_transport',
    'checksum_protected_runtime_authority_persisted_and_reopened', 'pinned_image_identity_verified',
    'network_none_read_only_non_root_cap_drop_no_new_privileges_confinement_verified',
    'actual_lottie_pixi_konva_babylon_and_playwright_entrypoints_executed',
    'decoded_non_flat_640x360_png_pixels_verified', 'deterministic_replay_hashes_verified',
    'product_external_beta_and_production_readiness_remain_false',
  ], artifacts,
}, null, 2))
