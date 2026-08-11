import assert from 'node:assert/strict'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { createCaptionLibassPrivateFixtureRequest } from
  '../captions-specialist/caption-accessibility-export'
import {
  activatePrivateOfflineLibassCaptionRuntime,
  openPrivateOfflineLibassCaptionRuntime,
  readPersistedOfflineLibassRuntimeAuthority,
} from '../tool-execution/libass-caption-execution'
import {
  CAP_15_VERTICAL_ACCESSIBILITY_FIXTURE,
  CAP_15_WIDESCREEN_ACCESSIBILITY_FIXTURE,
} from './captions-specialist-cap-15-smoke'

const wideRequest = createCaptionLibassPrivateFixtureRequest(
  CAP_15_WIDESCREEN_ACCESSIBILITY_FIXTURE.plan,
)
const verticalFixtureCue = CAP_15_VERTICAL_ACCESSIBILITY_FIXTURE.plan.cues.find(
  (cue) => cue.phraseId === 'phrase.cap11.hero.behind',
)
assert.ok(verticalFixtureCue)
const verticalRequest = createCaptionLibassPrivateFixtureRequest(
  CAP_15_VERTICAL_ACCESSIBILITY_FIXTURE.plan,
  verticalFixtureCue.cueId,
)

const activated = await activatePrivateOfflineLibassCaptionRuntime()
const authority = await readPersistedOfflineLibassRuntimeAuthority()
assert.ok(authority)
assert.equal(authority.image.imageIdentityHash, activated.image.imageIdentityHash)
assert.equal(authority.image.libassVersion, '0.17.5')
assert.equal(authority.readiness.productReady, false)
assert.equal(authority.readiness.fullTrackOrVideoBurnInReady, false)

const runtime = await openPrivateOfflineLibassCaptionRuntime()
const wide = await runtime.execute(wideRequest)
const vertical = await runtime.execute(verticalRequest)

for (const result of [wide, vertical]) {
  assert.equal(result.imageArtifact.mimeType, 'image/png')
  assert.equal(result.imageArtifact.hasAlpha, true)
  assert.ok(result.imageArtifact.nonTransparentPixelCount > 100)
  assert.ok(result.imageArtifact.alphaBoundingBox.left >= 0)
  assert.ok(result.imageArtifact.alphaBoundingBox.top >= 0)
  assert.ok(result.imageArtifact.alphaBoundingBox.left
    + result.imageArtifact.alphaBoundingBox.width <= result.imageArtifact.width)
  assert.ok(result.imageArtifact.alphaBoundingBox.top
    + result.imageArtifact.alphaBoundingBox.height <= result.imageArtifact.height)
  assert.equal(result.evidence.operationId,
    'tool.libass.render_approved_caption_track.v1')
  assert.equal(result.evidence.semanticEvidence.actualAssReadMemoryExecuted, true)
  assert.equal(result.evidence.semanticEvidence.actualAssRenderFrameExecuted, true)
  assert.equal(result.evidence.confinement.networkMode, 'none')
  assert.equal(result.evidence.confinement.readOnlyRootFilesystem, true)
  assert.equal(result.evidence.confinement.capDropAll, true)
  assert.equal(result.evidence.confinement.user, '10001:10001')
  assert.equal(result.readiness.privateInternalOnly, true)
  assert.equal(result.readiness.fullTrackOrVideoBurnInReady, false)
  assert.equal(result.readiness.productReady, false)
  assert.equal(result.readiness.productionReady, false)
}
assert.equal(wide.imageArtifact.width, 640)
assert.equal(wide.imageArtifact.height, 360)
assert.equal(vertical.imageArtifact.width, 360)
assert.equal(vertical.imageArtifact.height, 640)
assert.ok(wide.imageArtifact.alphaBoundingBox.top >= 180)
assert.ok(vertical.imageArtifact.alphaBoundingBox.top >= 320)

const outputDirectory = await mkdtemp(join(tmpdir(), 'reeditpro-caption-cap15-'))
const widePath = join(outputDirectory, 'caption-cap15-wide-640x360.png')
const verticalPath = join(outputDirectory, 'caption-cap15-vertical-360x640.png')
await writeFile(widePath, wide.imageArtifact.bytes)
await writeFile(verticalPath, vertical.imageArtifact.bytes)

console.log(JSON.stringify({
  status: 'passed_awaiting_direct_raster_inspection',
  milestone: 'CAP-15',
  imageIdentityHash: authority.image.imageIdentityHash,
  libassVersion: authority.image.libassVersion,
  outputDirectory,
  artifacts: [{
    profile: 'widescreen_balanced_v1',
    path: widePath,
    sha256: wide.imageArtifact.sha256,
    width: wide.imageArtifact.width,
    height: wide.imageArtifact.height,
    nonTransparentPixelCount: wide.imageArtifact.nonTransparentPixelCount,
    alphaBoundingBox: wide.imageArtifact.alphaBoundingBox,
  }, {
    profile: 'vertical_compact_v1',
    path: verticalPath,
    sha256: vertical.imageArtifact.sha256,
    width: vertical.imageArtifact.width,
    height: vertical.imageArtifact.height,
    nonTransparentPixelCount: vertical.imageArtifact.nonTransparentPixelCount,
    alphaBoundingBox: vertical.imageArtifact.alphaBoundingBox,
  }],
  actualLibassReadAndRenderFrameExecuted: true,
  directRasterInspectionCompleted: false,
  completeTrackRuntimeExecuted: false,
  videoBurnInExecuted: false,
  finalExportExecuted: false,
  productReady: false,
  productionReady: false,
}, null, 2))
