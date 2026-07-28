import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { deflateSync } from 'node:zlib'

import {
  createPrivateOfflineSharpStructuredExecutionRuntime,
  openPrivateOfflineSharpStructuredExecutionRuntime,
} from '../tool-execution/node-runner-execution'

const svg = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" width="720" height="405" viewBox="0 0 720 405"><rect width="720" height="405" fill="#fff"/><path d="M40 350 L180 240 L320 280 L460 130 L680 70" fill="none" stroke="#2563eb" stroke-width="12"/><text x="40" y="55" font-size="30" fill="#111827">Approved evidence</text></svg>',
  'utf8',
)
const source = {
  sourceMimeType: 'image/svg+xml' as const,
  sourceByteLength: svg.byteLength,
  sourceSha256: createHash('sha256').update(svg).digest('hex'),
  sourceBytesBase64: svg.toString('base64'),
}
const request = {
  toolId: 'sharp' as const,
  operationId: 'tool.sharp.prepare_approved_image_asset.v1',
  payload: {
    imageRecipeId: 'approved_panel_asset_v1' as const,
    outputFormat: 'png' as const,
    outputWidth: 640,
    outputHeight: 360,
    preserveMetadata: false as const,
    allowUpscale: false as const,
    ...source,
  },
}

const runtime = await createPrivateOfflineSharpStructuredExecutionRuntime()
const result = await runtime.execute(request)
assert.equal(result.evidence.toolId, 'sharp')
assert.equal(result.evidence.packageName, 'sharp')
assert.equal(result.evidence.packageVersion, '0.35.3')
assert.equal(result.imageArtifact.mimeType, 'image/png')
assert.ok(result.imageArtifact.bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex')))
assert.equal(result.evidence.semanticEvidence.sourceBytesVerified, true)
assert.equal(result.evidence.semanticEvidence.metadataStripped, true)
assert.equal(result.evidence.semanticEvidence.upscaleForbidden, true)
assert.equal(result.evidence.semanticEvidence.outputWidth, 640)
assert.equal(result.evidence.semanticEvidence.outputHeight, 360)
assert.equal(result.evidence.semanticEvidence.actualSharpOperationCompleted, true)
assert.equal(result.evidence.confinement.networkMode, 'none')
assert.equal(result.evidence.confinement.readOnlyRootFilesystem, true)
assert.equal(result.evidence.confinement.callerMountsPresent, false)
assert.equal(result.readiness.productReady, false)

const componentWidth = 4
const componentHeight = 2
const componentSourcePixels = Buffer.from([
  255, 0, 0, 255, 0, 255, 0, 255,
  0, 0, 255, 255, 255, 255, 0, 255,
  255, 0, 255, 255, 0, 255, 255, 255,
  32, 64, 96, 255, 240, 160, 80, 255,
])
const componentMaskValues = [0, 64, 128, 255, 255, 128, 64, 0]
const componentMaskPixels = Buffer.from(componentMaskValues.flatMap((value) =>
  [value, value, value, 255]))
const componentSourcePng = createRgbaPng(
  componentWidth,
  componentHeight,
  componentSourcePixels,
)
const componentMaskPng = createRgbaPng(
  componentWidth,
  componentHeight,
  componentMaskPixels,
)
const componentRequest = {
  toolId: 'sharp' as const,
  operationId: 'tool.sharp.prepare_approved_image_asset.v1',
  payload: {
    imageRecipeId:
      'approved_living_frame_alpha_component_v1' as const,
    outputFormat: 'png' as const,
    outputWidth: componentWidth,
    outputHeight: componentHeight,
    preserveMetadata: false as const,
    allowUpscale: false as const,
    sourceMimeType: 'image/png' as const,
    sourceByteLength: componentSourcePng.byteLength,
    sourceSha256: createHash('sha256')
      .update(componentSourcePng).digest('hex'),
    sourceBytesBase64: componentSourcePng.toString('base64'),
    maskMimeType: 'image/png' as const,
    maskByteLength: componentMaskPng.byteLength,
    maskSha256: createHash('sha256')
      .update(componentMaskPng).digest('hex'),
    maskBytesBase64: componentMaskPng.toString('base64'),
  },
}
const componentResult = await runtime.execute(componentRequest)
assert.equal(componentResult.imageArtifact.mimeType, 'image/png')
assert.equal(
  componentResult.evidence.semanticEvidence.sourceMimeType,
  'image/png',
)
if (
  componentResult.evidence.semanticEvidence.sourceMimeType !==
    'image/png'
) throw new Error('Expected alpha-component semantic evidence.')
assert.equal(
  componentResult.evidence.semanticEvidence.maskBytesVerified,
  true,
)
assert.equal(
  componentResult.evidence.semanticEvidence.alphaDerivedFromMask,
  true,
)
assert.equal(
  componentResult.evidence.semanticEvidence.transparentRgbCleared,
  true,
)
assert.equal(
  componentResult.evidence.semanticEvidence.transparentPixelCount,
  2,
)
assert.equal(
  componentResult.evidence.semanticEvidence.partialAlphaPixelCount,
  4,
)
assert.equal(
  componentResult.evidence.semanticEvidence.opaquePixelCount,
  2,
)

const reopened = await openPrivateOfflineSharpStructuredExecutionRuntime()
assert.equal(reopened.image.imageIdentityHash, runtime.image.imageIdentityHash)
const replay = await reopened.execute(request)
assert.equal(replay.imageArtifact.sha256, result.imageArtifact.sha256)
const componentReplay = await reopened.execute(componentRequest)
assert.equal(
  componentReplay.imageArtifact.sha256,
  componentResult.imageArtifact.sha256,
)

await assertRejects(() => runtime.execute({
  ...request,
  payload: { ...request.payload, sourceSha256: 'f'.repeat(64) },
}))
const unsafeSvg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><image href="https://example.com/x.png"/></svg>')
await assertRejects(() => runtime.execute({
  ...request,
  payload: {
    ...request.payload,
    sourceByteLength: unsafeSvg.byteLength,
    sourceSha256: createHash('sha256').update(unsafeSvg).digest('hex'),
    sourceBytesBase64: unsafeSvg.toString('base64'),
  },
}))
await assertRejects(() => runtime.execute({
  ...request,
  payload: { ...request.payload, outputWidth: 8192 },
}))
await assertRejects(() => runtime.execute({
  ...request,
  payload: { ...request.payload, path: '/tmp/input.svg' },
}))
const coloredMaskPixels = Buffer.from(componentMaskPixels)
coloredMaskPixels[1] = 1
const coloredMaskPng = createRgbaPng(
  componentWidth,
  componentHeight,
  coloredMaskPixels,
)
await assertRejects(() => runtime.execute({
  ...componentRequest,
  payload: {
    ...componentRequest.payload,
    maskByteLength: coloredMaskPng.byteLength,
    maskSha256: createHash('sha256')
      .update(coloredMaskPng).digest('hex'),
    maskBytesBase64: coloredMaskPng.toString('base64'),
  },
}))
const opaqueMaskPng = createRgbaPng(
  componentWidth,
  componentHeight,
  Buffer.alloc(componentWidth * componentHeight * 4, 255),
)
await assertRejects(() => runtime.execute({
  ...componentRequest,
  payload: {
    ...componentRequest.payload,
    maskByteLength: opaqueMaskPng.byteLength,
    maskSha256: createHash('sha256')
      .update(opaqueMaskPng).digest('hex'),
    maskBytesBase64: opaqueMaskPng.toString('base64'),
  },
}))
await assertRejects(() => runtime.execute({
  ...componentRequest,
  payload: {
    ...componentRequest.payload,
    outputWidth: 4097,
  },
}))

console.log(JSON.stringify({
  ok: true,
  checks: [
    'sharp_0_35_3_actual_svg_to_png_execution',
    'source_checksum_size_and_mime_commitment',
    'fixed_resize_metadata_strip_and_no_upscale_recipe',
    'output_png_signature_dimensions_and_semantic_evidence',
    'networkless_readonly_nonroot_no_mount_container',
    'deterministic_restart_safe_reexecution',
    'external_svg_reference_source_tamper_path_and_oversize_rejected',
    'approved_source_png_plus_grayscale_mask_to_straight_alpha_png',
    'byte_exact_alpha_lineage_transparent_rgb_cleanup_and_replay',
    'colored_all_opaque_and_oversized_component_masks_rejected',
    'private_internal_only_without_product_beta_or_production_promotion',
  ],
}))

async function assertRejects(action: () => Promise<unknown>): Promise<void> {
  let rejected = false
  try { await action() } catch { rejected = true }
  assert.equal(rejected, true)
}

function createRgbaPng(
  width: number,
  height: number,
  rgba: Buffer,
): Buffer {
  assert.equal(rgba.byteLength, width * height * 4)
  const rows: Buffer[] = []
  for (let y = 0; y < height; y += 1) {
    rows.push(Buffer.concat([
      Buffer.from([0]),
      rgba.subarray(y * width * 4, (y + 1) * width * 4),
    ]))
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  return Buffer.concat([
    Buffer.from('89504e470d0a1a0a', 'hex'),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(Buffer.concat(rows), { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

function pngChunk(type: string, data: Buffer): Buffer {
  const typeBytes = Buffer.from(type, 'ascii')
  const chunk = Buffer.alloc(12 + data.byteLength)
  chunk.writeUInt32BE(data.byteLength, 0)
  typeBytes.copy(chunk, 4)
  data.copy(chunk, 8)
  chunk.writeUInt32BE(
    crc32(Buffer.concat([typeBytes, data])),
    8 + data.byteLength,
  )
  return chunk
}

function crc32(data: Buffer): number {
  let crc = 0xffffffff
  for (const byte of data) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^
        (0xedb88320 & -(crc & 1))
    }
  }
  return (crc ^ 0xffffffff) >>> 0
}
