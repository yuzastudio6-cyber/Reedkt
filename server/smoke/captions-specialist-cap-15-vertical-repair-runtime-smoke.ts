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
import { CAP_15_VERTICAL_ACCESSIBILITY_FIXTURE } from
  './captions-specialist-cap-15-smoke'

const cue = CAP_15_VERTICAL_ACCESSIBILITY_FIXTURE.plan.cues.find(
  (candidate) => candidate.phraseId === 'phrase.cap11.hero.behind',
)
assert.ok(cue)
const request = createCaptionLibassPrivateFixtureRequest(
  CAP_15_VERTICAL_ACCESSIBILITY_FIXTURE.plan, cue.cueId,
)
assert.equal(request.payload.caption, 'MOVE')
assert.equal(request.payload.width, 360)
assert.equal(request.payload.height, 640)

await activatePrivateOfflineLibassCaptionRuntime()
const authority = await readPersistedOfflineLibassRuntimeAuthority()
assert.ok(authority)
const runtime = await openPrivateOfflineLibassCaptionRuntime()
const result = await runtime.execute(request)
assert.equal(result.imageArtifact.width, 360)
assert.equal(result.imageArtifact.height, 640)
assert.equal(result.imageArtifact.hasAlpha, true)
assert.ok(result.imageArtifact.nonTransparentPixelCount > 100)
assert.ok(result.imageArtifact.alphaBoundingBox.left > 0)
assert.ok(result.imageArtifact.alphaBoundingBox.left
  + result.imageArtifact.alphaBoundingBox.width < result.imageArtifact.width)
assert.ok(result.imageArtifact.alphaBoundingBox.top >= 320)
assert.ok(result.imageArtifact.alphaBoundingBox.top
  + result.imageArtifact.alphaBoundingBox.height < result.imageArtifact.height)
assert.equal(result.evidence.semanticEvidence.actualAssReadMemoryExecuted, true)
assert.equal(result.evidence.semanticEvidence.actualAssRenderFrameExecuted, true)
assert.equal(result.evidence.confinement.networkMode, 'none')
assert.equal(result.evidence.confinement.readOnlyRootFilesystem, true)
assert.equal(result.readiness.fullTrackOrVideoBurnInReady, false)
assert.equal(result.readiness.productionReady, false)

const outputDirectory = await mkdtemp(join(tmpdir(), 'reeditpro-caption-cap15-repair-'))
const path = join(outputDirectory, 'caption-cap15-vertical-repair-360x640.png')
await writeFile(path, result.imageArtifact.bytes)

console.log(JSON.stringify({
  status: 'passed_awaiting_direct_raster_inspection',
  milestone: 'CAP-15-vertical-repair',
  imageIdentityHash: authority.image.imageIdentityHash,
  libassVersion: authority.image.libassVersion,
  outputDirectory,
  artifact: {
    profile: 'vertical_compact_v1',
    cueId: cue.cueId,
    caption: request.payload.caption,
    path,
    sha256: result.imageArtifact.sha256,
    width: result.imageArtifact.width,
    height: result.imageArtifact.height,
    nonTransparentPixelCount: result.imageArtifact.nonTransparentPixelCount,
    alphaBoundingBox: result.imageArtifact.alphaBoundingBox,
  },
  actualLibassReadAndRenderFrameExecuted: true,
  directRasterInspectionCompleted: false,
  completeTrackRuntimeExecuted: false,
  videoBurnInExecuted: false,
  finalExportExecuted: false,
  productionReady: false,
}, null, 2))
