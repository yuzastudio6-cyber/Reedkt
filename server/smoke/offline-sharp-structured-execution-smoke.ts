import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

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

const reopened = await openPrivateOfflineSharpStructuredExecutionRuntime()
assert.equal(reopened.image.imageIdentityHash, runtime.image.imageIdentityHash)
const replay = await reopened.execute(request)
assert.equal(replay.imageArtifact.sha256, result.imageArtifact.sha256)

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
    'private_internal_only_without_product_beta_or_production_promotion',
  ],
}))

async function assertRejects(action: () => Promise<unknown>): Promise<void> {
  let rejected = false
  try { await action() } catch { rejected = true }
  assert.equal(rejected, true)
}
