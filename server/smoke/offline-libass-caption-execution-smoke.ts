import assert from 'node:assert/strict'

import {
  activatePrivateOfflineLibassCaptionRuntime,
  openPrivateOfflineLibassCaptionRuntime,
  readPersistedOfflineLibassRuntimeAuthority,
  validateOfflineLibassCaptionRequest,
} from '../tool-execution/libass-caption-execution'

const request = {
  schemaVersion: 'offline-libass-caption-execution-v1', toolId: 'libass',
  operationId: 'tool.libass.render_approved_caption_track.v1',
  payload: {
    captionProfileId: 'approved_ass_track_render_v1', fontPackProfileId: 'reeditpro_reviewed_fonts_v1',
    collisionPolicy: 'fail_on_reserved_zone_collision', preserveSpeechTiming: true,
    width: 640, height: 360, timestampMs: 1000, fontSize: 42, marginV: 48, alignment: 2,
    caption: 'Approved frame accurate caption',
  },
} as const

for (const invalid of [
  { ...request, command: 'render anything' },
  { ...request, payload: { ...request.payload, caption: '{\\pos(1,1)}unsafe' } },
  { ...request, payload: { ...request.payload, caption: 'https://example.test/caption' } },
  { ...request, payload: { ...request.payload, caption: '../../etc/passwd' } },
  { ...request, payload: { ...request.payload, width: 4096, height: 2160 } },
  { ...request, payload: { ...request.payload, fontPackProfileId: '/tmp/fonts' } },
]) assert.throws(() => validateOfflineLibassCaptionRequest(invalid), /unsupported|outside|contains/)

const activated = await activatePrivateOfflineLibassCaptionRuntime()
const authority = await readPersistedOfflineLibassRuntimeAuthority()
assert.ok(authority)
assert.equal(authority.image.libassVersion, '0.17.5')
assert.equal(authority.image.libassSourceSha256, 'caab4b993dd7be6187c55623b789ed75dddefea6e65938af134637c732fe094a')
assert.equal(authority.readiness.canonicalDispatchMayReference, true)
assert.equal(authority.readiness.fullTrackOrVideoBurnInReady, false)
const runtime = await openPrivateOfflineLibassCaptionRuntime()
assert.equal(runtime.image.imageIdentityHash, activated.image.imageIdentityHash)
const bottom = await runtime.execute(request)
assert.equal(bottom.imageArtifact.bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
assert.equal(bottom.imageArtifact.width, 640)
assert.equal(bottom.imageArtifact.height, 360)
assert.equal(bottom.imageArtifact.hasAlpha, true)
assert.ok(bottom.imageArtifact.nonTransparentPixelCount > 100)
assert.ok(bottom.imageArtifact.alphaBoundingBox.top >= 180)
assert.equal(bottom.evidence.semanticEvidence.actualAssReadMemoryExecuted, true)
assert.equal(bottom.evidence.semanticEvidence.actualAssRenderFrameExecuted, true)
assert.equal(bottom.evidence.confinement.networkMode, 'none')
assert.equal(bottom.evidence.confinement.readOnlyRootFilesystem, true)
assert.equal(bottom.evidence.confinement.capDropAll, true)
assert.equal(bottom.evidence.confinement.user, '10001:10001')

const fourKMasterOverlay = await runtime.execute({
  ...request,
  payload: {
    ...request.payload,
    width: 3840,
    height: 2160,
    fontSize: 97,
    marginV: 119,
    caption: 'Approved 4K delivery master caption',
  },
})
assert.equal(fourKMasterOverlay.imageArtifact.width, 3840)
assert.equal(fourKMasterOverlay.imageArtifact.height, 2160)
assert.equal(fourKMasterOverlay.imageArtifact.hasAlpha, true)
assert.ok(fourKMasterOverlay.imageArtifact.nonTransparentPixelCount > 1_000)
assert.ok(fourKMasterOverlay.imageArtifact.alphaBoundingBox.top > 1_500)

const replay = await runtime.execute(request)
assert.equal(replay.imageArtifact.sha256, bottom.imageArtifact.sha256)
assert.deepEqual(replay.imageArtifact.alphaBoundingBox, bottom.imageArtifact.alphaBoundingBox)
const top = await runtime.execute({ ...request, payload: { ...request.payload, alignment: 8 } })
assert.notEqual(top.imageArtifact.sha256, bottom.imageArtifact.sha256)
assert.ok(top.imageArtifact.alphaBoundingBox.top < 180)
assert.equal(bottom.readiness.productReady, false)
assert.equal(bottom.readiness.fullTrackOrVideoBurnInReady, false)

console.log(JSON.stringify({
  smoke: 'offline_libass_caption_execution', status: 'passed',
  proofs: [
    'official_libass_0_17_5_source_sha256_locked',
    'exact_caption_operation_payload_and_reviewed_font_pack_validated',
    'caller_ass_overrides_paths_urls_commands_and_extra_fields_rejected',
    'checksum_protected_runtime_authority_persisted_and_reopened',
    'network_none_read_only_non_root_cap_drop_confinement_verified',
    'actual_ass_read_memory_and_ass_render_frame_executed',
    'transparent_rgba_png_caption_overlay_semantics_verified',
    'exact_3840x2160_delivery_master_overlay_rendered',
    'bottom_and_top_safe_zone_placement_verified',
    'exact_replay_is_pixel_deterministic',
    'full_track_video_burnin_product_beta_production_readiness_remains_false',
  ],
  artifact: {
    sha256: bottom.imageArtifact.sha256, byteLength: bottom.imageArtifact.byteLength,
    nonTransparentPixelCount: bottom.imageArtifact.nonTransparentPixelCount,
    alphaBoundingBox: bottom.imageArtifact.alphaBoundingBox,
  },
}, null, 2))
