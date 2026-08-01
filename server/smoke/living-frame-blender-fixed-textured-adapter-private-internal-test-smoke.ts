import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import type {
  LivingFrameBlenderFixedAdapterMesh,
} from '../../src/types/living-frame-blender-fixed-adapter-internal-test'
import {
  LIVING_FRAME_BLENDER_FIXED_TEXTURE_RELATIVE_PATH,
  LIVING_FRAME_BLENDER_FIXED_TEXTURED_ADAPTER_ENVELOPE_VERSION,
  LIVING_FRAME_BLENDER_FIXED_TEXTURED_ADAPTER_INTERNAL_REQUEST_CLASS,
  LIVING_FRAME_BLENDER_FIXED_TEXTURED_ADAPTER_INTERNAL_REQUEST_VERSION,
} from '../../src/types/living-frame-blender-fixed-textured-adapter-internal-test'
import {
  compileLivingFrameBlenderFixedTexturedAdapterInternalRequest,
  inspectLivingFrameBlenderOutputFiles,
  runLivingFrameBlenderFixedTexturedAdapterInternal,
} from '../living-frame/living-frame-blender-fixed-adapter-internal-test'
import {
  buildLivingFrameBlenderFixedAdapterPrivateFixture,
} from '../living-frame/living-frame-blender-fixed-adapter-private-fixture'
import {
  decodeLivingFrameEnvironmentalParticleRgbaPng,
} from '../living-frame/living-frame-environmental-particle-sequence-observation'

const fixtureRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  'fixtures/assets',
)
const texturePath = resolve(
  fixtureRoot,
  'living-frame-astronomer-flat-editorial-alpha-v1.png',
)
const textureBytes = readFileSync(texturePath)
const textureSha256 = sha256(textureBytes)
const fixture =
  buildLivingFrameBlenderFixedAdapterPrivateFixture()
const mesh = createPortraitTextureMesh(fixture.mesh)
const compiled =
  compileLivingFrameBlenderFixedTexturedAdapterInternalRequest({
    candidateRequest: fixture.candidateRequest,
    actionPlan: fixture.actionPlan,
    componentId:
      fixture.candidateRequest
        .outputSelection.approvedRiggedComponentIds[0]!,
    mesh,
    material: {
      baseColorRgba: [1, 1, 1, 1],
      roughness: 0.72,
    },
    texture: {
      artifactId:
        'lf.style-depth.astronomer-flat-editorial.v1',
      pngBytes: textureBytes,
    },
    fps: 30,
    renderProfile: 'full',
  })

assert.equal(
  compiled.payload.contractVersion,
  LIVING_FRAME_BLENDER_FIXED_TEXTURED_ADAPTER_INTERNAL_REQUEST_VERSION,
)
assert.equal(
  compiled.payload.requestClass,
  LIVING_FRAME_BLENDER_FIXED_TEXTURED_ADAPTER_INTERNAL_REQUEST_CLASS,
)
assert.equal(
  compiled.envelope.envelopeVersion,
  LIVING_FRAME_BLENDER_FIXED_TEXTURED_ADAPTER_ENVELOPE_VERSION,
)
assert.equal(
  compiled.payload.material.texture.fixedRelativePath,
  LIVING_FRAME_BLENDER_FIXED_TEXTURE_RELATIVE_PATH,
)
assert.equal(
  compiled.payload.material.texture.sha256,
  textureSha256,
)
assert.equal(
  compiled.payload.material.texture.byteLength,
  textureBytes.byteLength,
)
assert.equal(
  compiled.payload.material.texture.widthPixels,
  1_024,
)
assert.equal(
  compiled.payload.material.texture.heightPixels,
  1_536,
)
assert.equal(
  compiled.envelope.payloadCanonicalJson.includes(
    textureBytes.toString('base64').slice(0, 64),
  ),
  false,
)
assert.equal(
  compiled.envelope.payloadCanonicalJson.includes(
    texturePath,
  ),
  false,
)
for (const forbidden of [
  'sourcePath',
  'sourceUrl',
  'sourceBytes',
  'command',
  'environment',
  'python',
] as const) {
  assert.equal(
    Object.hasOwn(
      compiled.payload.material.texture,
      forbidden,
    ),
    false,
  )
}

const changedCallerBytes = Buffer.from(textureBytes)
changedCallerBytes.fill(0)
assert.equal(
  compiled.payload.material.texture.sha256,
  textureSha256,
)
await assert.rejects(
  async () =>
    runLivingFrameBlenderFixedTexturedAdapterInternal({
      ...compiled,
      envelope: {
        ...compiled.envelope,
        payloadDigestSha256: '0'.repeat(64),
      },
    }),
  /compiled request integrity is invalid/,
)
await assert.rejects(
  async () =>
    runLivingFrameBlenderFixedTexturedAdapterInternal({
      payload: {
        ...compiled.payload,
        material: {
          ...compiled.payload.material,
          texture: {
            ...compiled.payload.material.texture,
            fixedRelativePath:
              'input/forged-texture.png',
          },
        },
      } as unknown as
        typeof compiled.payload,
      envelope: compiled.envelope,
    }),
  /fixedRelativePath|compiled request integrity is invalid|Invalid input/,
)

const run =
  runLivingFrameBlenderFixedTexturedAdapterInternal(
    compiled,
  )
try {
  const outputs =
    inspectLivingFrameBlenderOutputFiles(
      run.outputRoot,
    )
  assert.equal(outputs.rgbaFiles.length, 60)
  assert.equal(outputs.maskFiles.length, 60)
  assert.equal(outputs.depthFiles.length, 60)
  const first =
    decodeLivingFrameEnvironmentalParticleRgbaPng(
      readFileSync(outputs.rgbaFiles[0]!),
    )
  const middle =
    decodeLivingFrameEnvironmentalParticleRgbaPng(
      readFileSync(outputs.rgbaFiles[30]!),
    )
  const final =
    decodeLivingFrameEnvironmentalParticleRgbaPng(
      readFileSync(outputs.rgbaFiles[59]!),
    )
  assert.equal(first.width, 1_920)
  assert.equal(first.height, 1_080)
  const firstStats = rgbaStats(first.rgba)
  const finalStats = rgbaStats(final.rgba)
  assert.ok(firstStats.nonTransparentPixels > 150_000)
  assert.ok(firstStats.distinctOpaqueColorBuckets > 24)
  assert.ok(
    pixelDifferenceCount(
      first.rgba,
      middle.rgba,
      12,
    ) > 100_000,
  )
  assert.ok(
    pixelDifferenceCount(
      first.rgba,
      final.rgba,
      2,
    ) < 2_000,
  )
  assert.ok(
    Math.abs(
      firstStats.nonTransparentPixels
      - finalStats.nonTransparentPixels,
    ) < 1_000,
  )
  assert.equal(
    run.result.payloadDigestSha256,
    compiled.payload.payloadDigestBindingSha256,
  )
  assert.equal(run.result.transparentRgbaProduced, true)
  assert.equal(run.result.maskPassProduced, true)
  assert.equal(run.result.depthPassProduced, true)
  assert.equal(run.result.remotionOwnsFinalCanvas, true)
  assert.equal(run.result.runtimeDispatchAuthority, false)
  assert.equal(run.result.assetPersistenceAuthority, false)
  assert.equal(run.result.qaApprovalAuthority, false)
  assert.equal(run.result.billingAuthority, false)
  assert.equal(run.result.publicDeliveryAuthority, false)
  assert.equal(run.result.productionAuthority, false)

  console.log(JSON.stringify({
    smoke:
      'living_frame_blender_fixed_textured_adapter_private_internal_test',
    status: 'passed',
    requestVersion:
      compiled.payload.contractVersion,
    textureArtifactId:
      compiled.payload.material.texture.artifactId,
    textureSha256,
    textureByteLength: textureBytes.byteLength,
    outputFrameCount: run.result.frameCount,
    rgbaAggregateDigestSha256:
      run.result.rgbaAggregateDigestSha256,
    firstNonTransparentPixels:
      firstStats.nonTransparentPixels,
    firstDistinctOpaqueColorBuckets:
      firstStats.distinctOpaqueColorBuckets,
    middleMotionPixelDelta:
      pixelDifferenceCount(
        first.rgba,
        middle.rgba,
        12,
      ),
    finalReturnPixelDelta:
      pixelDifferenceCount(
        first.rgba,
        final.rgba,
        2,
      ),
    actualBlenderEntrypointExecuted: true,
    remotionOwnsFinalCanvas: true,
    runtimeDispatchAuthority: false,
    assetPersistenceAuthority: false,
    qaApprovalAuthority: false,
    customerBillingAuthority: false,
    publicDeliveryAuthority: false,
    productionAuthority: false,
  }))
} finally {
  run.cleanup()
}

function createPortraitTextureMesh(
  source: LivingFrameBlenderFixedAdapterMesh,
): LivingFrameBlenderFixedAdapterMesh {
  return {
    ...source,
    vertices: source.vertices.map((vertex) => ({
      ...vertex,
      position: {
        x: 0.33 + vertex.uv.x * 0.34,
        y: 0.04 + vertex.uv.y * 0.92,
        z: 0,
      },
    })),
  }
}

function rgbaStats(rgba: Uint8Array): {
  readonly nonTransparentPixels: number
  readonly distinctOpaqueColorBuckets: number
} {
  let nonTransparentPixels = 0
  const buckets = new Set<number>()
  for (let offset = 0; offset < rgba.length; offset += 4) {
    if (rgba[offset + 3]! < 8) continue
    nonTransparentPixels += 1
    buckets.add(
      (rgba[offset]! >> 4) << 8
      | (rgba[offset + 1]! >> 4) << 4
      | (rgba[offset + 2]! >> 4),
    )
  }
  return {
    nonTransparentPixels,
    distinctOpaqueColorBuckets:
      buckets.size,
  }
}

function pixelDifferenceCount(
  first: Uint8Array,
  second: Uint8Array,
  threshold: number,
): number {
  assert.equal(first.length, second.length)
  let count = 0
  for (let offset = 0; offset < first.length; offset += 4) {
    const difference =
      Math.abs(first[offset]! - second[offset]!)
      + Math.abs(first[offset + 1]! - second[offset + 1]!)
      + Math.abs(first[offset + 2]! - second[offset + 2]!)
      + Math.abs(first[offset + 3]! - second[offset + 3]!)
    if (difference > threshold) count += 1
  }
  return count
}

function sha256(bytes: Buffer): string {
  return createHash('sha256')
    .update(bytes)
    .digest('hex')
}
