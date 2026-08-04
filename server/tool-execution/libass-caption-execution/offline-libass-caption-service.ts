import { createHash } from 'node:crypto'
import { inflateSync } from 'node:zlib'

import { ApiError } from '../../errors/api-error'
import { readPrivateTextFileIfExistsWithinRoot, writePrivateTextFileAtomicWithinRoot } from '../../security/private-local-persistence'
import { sha256AuthorityValue, stableAuthorityStringify } from '../../services/private-edit-authority-store'
import { inspectExistingOfflineLibassRuntime, runOfflineLibassContainer } from './offline-libass-caption-docker-runtime'
import { OFFLINE_LIBASS_CAPTION_OPERATION, offlineLibassCaptionRequestSha256, validateOfflineLibassCaptionRequest } from './offline-libass-caption-protocol'
import type { OfflineLibassCaptionResult, OfflineLibassImageEvidence, OfflineLibassRuntimeAuthority } from './offline-libass-caption-types'

export const OFFLINE_LIBASS_CAPTION_EXECUTION_STORAGE_ROOT =
  '/tmp/reeditpro-offline-libass-caption-execution' as const
export const OFFLINE_LIBASS_CAPTION_RUNTIME_AUTHORITY_RELATIVE_PATH =
  'runtime-authority/offline-libass-caption-runtime-v1.json' as const
const STORAGE_ROOT = OFFLINE_LIBASS_CAPTION_EXECUTION_STORAGE_ROOT
const AUTHORITY_PATH = OFFLINE_LIBASS_CAPTION_RUNTIME_AUTHORITY_RELATIVE_PATH
const SOURCE_SHA = 'caab4b993dd7be6187c55623b789ed75dddefea6e65938af134637c732fe094a'
const BLOCKERS = Object.freeze([
  'Only a bounded transparent caption overlay frame is proven; complete caption tracks, video burn-in, multi-language font packs, collision analysis, final export, and delivery remain separate gates.',
  'Runtime dependency package versions, font licensing, distributed workers, image scanning, observability, and recovery are not production-proven.',
] as const)

export async function activatePrivateOfflineLibassCaptionRuntime() {
  if (arguments.length) throw invalid('libass activation accepts no caller input.')
  const image = await inspectExistingOfflineLibassRuntime(); await persistAuthority(image)
  return Object.freeze({ image, execute: (value: unknown) => execute(image, value) })
}
export async function openPrivateOfflineLibassCaptionRuntime() {
  const authority = await readPersistedOfflineLibassRuntimeAuthority(); if (!authority) throw unavailable('Verified libass authority is unavailable.')
  const image = await inspectExistingOfflineLibassRuntime(); if (stableAuthorityStringify(image) !== stableAuthorityStringify(authority.image)) throw unavailable('libass image changed after activation.')
  return Object.freeze({ image, execute: (value: unknown) => execute(image, value) })
}
export async function readPersistedOfflineLibassRuntimeAuthority(): Promise<OfflineLibassRuntimeAuthority | undefined> {
  const content = await readPrivateTextFileIfExistsWithinRoot({ rootPath: STORAGE_ROOT, relativePath: AUTHORITY_PATH }); if (!content) return undefined
  let parsed: unknown; try { parsed = JSON.parse(content) } catch { throw unavailable('libass authority JSON is invalid.') }
  const envelope = record(parsed); const authority = record(envelope.authority)
  if (envelope.recordVersion !== 'offline-libass-caption-runtime-authority-record-v1' || envelope.checksumSha256 !== sha256AuthorityValue(authority)) throw unavailable('libass authority checksum is invalid.')
  const { authorityHash, ...withoutHash } = authority
  if (authorityHash !== sha256AuthorityValue(withoutHash) || authority.schemaVersion !== 'offline-libass-caption-runtime-authority-v1' || record(authority.readiness).privateInternalExecutionReady !== true || record(authority.readiness).productReady !== false) throw unavailable('libass authority boundary is invalid.')
  return authority as unknown as OfflineLibassRuntimeAuthority
}
async function execute(image: OfflineLibassImageEvidence, value: unknown): Promise<OfflineLibassCaptionResult> {
  const request = validateOfflineLibassCaptionRequest(value); const p = request.payload
  const args = [p.width, p.height, p.timestampMs, p.fontSize, p.marginV, p.alignment].map(String)
  const run = await runOfflineLibassContainer({ image, args, caption: p.caption })
  if (run.exitCode !== 0 || run.oomKilled || run.stderr.length) throw unavailable('Confined libass execution failed.')
  const bytes = run.stdout; const sha256 = createHash('sha256').update(bytes).digest('hex')
  if (bytes.length < 1024 || bytes.length > 8 * 1024 * 1024 || bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a' || bytes.readUInt32BE(16) !== p.width || bytes.readUInt32BE(20) !== p.height || bytes[24] !== 8 || bytes[25] !== 6) throw unavailable('libass output is not the approved RGBA PNG.')
  const decoded = decodeRgbaPng(bytes, p.width, p.height)
  let count = 0, left = decoded.width, top = decoded.height, right = -1, bottom = -1
  for (let y = 0; y < decoded.height; y++) for (let x = 0; x < decoded.width; x++) if (decoded.data[(y * decoded.width + x) * 4 + 3]! > 0) { count++; left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x); bottom = Math.max(bottom, y) }
  if (count < 100 || right < left || bottom < top || (p.alignment === 2 && top < Math.floor(decoded.height / 2)) || (p.alignment === 8 && bottom > Math.ceil(decoded.height / 2))) throw unavailable('libass caption pixels failed bounded placement QA.')
  const bbox = { left, top, width: right - left + 1, height: bottom - top + 1 }
  const completedAt = new Date().toISOString(); const requestHash = offlineLibassCaptionRequestSha256(request)
  const withoutHash = { schemaVersion: 'offline-libass-caption-execution-attestation-v1' as const, completedAt, imageIdentityHash: image.imageIdentityHash, requestEnvelopeSha256: requestHash, resultSha256: sha256, confinementHash: sha256AuthorityValue(run.confinement) }
  const attestationHash = sha256AuthorityValue(withoutHash); const recordId = sha256AuthorityValue({ attestationHash, completedAt }); const attestation = { ...withoutHash, recordId, attestationHash }
  await writePrivateTextFileAtomicWithinRoot({ rootPath: STORAGE_ROOT, relativePath: `attestations/${recordId.slice(0, 2)}/${recordId}.json`, content: `${stableAuthorityStringify({ recordVersion: 'offline-libass-caption-execution-attestation-record-v1', attestation, checksumSha256: sha256AuthorityValue(attestation) })}\n` })
  return { schemaVersion: 'offline-libass-caption-execution-result-v1', request, imageArtifact: { mimeType: 'image/png', bytes, byteLength: bytes.length, sha256, width: decoded.width, height: decoded.height, channels: 4, hasAlpha: true, nonTransparentPixelCount: count, alphaBoundingBox: bbox }, evidence: { toolId: 'libass', operationId: OFFLINE_LIBASS_CAPTION_OPERATION, binaryName: 'libass', binaryVersion: '0.17.5', sourceSha256: SOURCE_SHA, requestEnvelopeSha256: requestHash, resultSha256: sha256, semanticEvidence: { actualAssReadMemoryExecuted: true, actualAssRenderFrameExecuted: true, approvedFontPackUsed: true, transparentRgbaOverlayProduced: true, captionPlacementPolicyPassed: true, nonTransparentPixelCount: count, alphaBoundingBox: bbox }, image, confinement: run.confinement, containerExitCode: 0, oomKilled: false }, attestation, readiness: { privateInternalOnly: true, productReady: false, externalBetaReady: false, productionReady: false, fullTrackOrVideoBurnInReady: false } }
}
async function persistAuthority(image: OfflineLibassImageEvidence) { const withoutHash = { schemaVersion: 'offline-libass-caption-runtime-authority-v1' as const, source: 'private_local_offline_libass_caption_runtime_authority' as const, activatedAt: new Date().toISOString(), image, supportedOperations: [{ toolId: 'libass' as const, operationId: OFFLINE_LIBASS_CAPTION_OPERATION }] as const, readiness: { privateInternalExecutionReady: true as const, exactStructuredPayloadOnly: true as const, canonicalDispatchMayReference: true as const, productReady: false as const, externalBetaReady: false as const, productionReady: false as const, fullTrackOrVideoBurnInReady: false as const }, blockers: BLOCKERS }; const authority: OfflineLibassRuntimeAuthority = { ...withoutHash, authorityHash: sha256AuthorityValue(withoutHash) }; await writePrivateTextFileAtomicWithinRoot({ rootPath: STORAGE_ROOT, relativePath: AUTHORITY_PATH, content: `${stableAuthorityStringify({ recordVersion: 'offline-libass-caption-runtime-authority-record-v1', authority, checksumSha256: sha256AuthorityValue(authority) })}\n` }) }
function record(value: unknown): Record<string, unknown> { if (!value || typeof value !== 'object' || Array.isArray(value)) throw unavailable('libass record is invalid.'); return value as Record<string, unknown> }
function decodeRgbaPng(bytes: Buffer, expectedWidth: number, expectedHeight: number) {
  let offset = 8
  const idat: Buffer[] = []
  let width = 0, height = 0, sawIhdr = false, sawIend = false
  while (offset + 12 <= bytes.length) {
    const length = bytes.readUInt32BE(offset)
    if (length > 8 * 1024 * 1024 || offset + 12 + length > bytes.length) throw unavailable('PNG chunk is outside bounds.')
    const type = bytes.subarray(offset + 4, offset + 8).toString('ascii')
    const data = bytes.subarray(offset + 8, offset + 8 + length)
    if (type === 'IHDR') {
      if (sawIhdr || length !== 13) throw unavailable('PNG IHDR is invalid.')
      sawIhdr = true; width = data.readUInt32BE(0); height = data.readUInt32BE(4)
      if (width !== expectedWidth || height !== expectedHeight || data[8] !== 8 || data[9] !== 6 || data[10] !== 0 || data[11] !== 0 || data[12] !== 0) throw unavailable('PNG format is not the approved non-interlaced RGBA profile.')
    } else if (type === 'IDAT') idat.push(Buffer.from(data))
    else if (type === 'IEND') { if (length !== 0) throw unavailable('PNG IEND is invalid.'); sawIend = true; break }
    offset += 12 + length
  }
  if (!sawIhdr || !sawIend || !idat.length) throw unavailable('PNG required chunks are missing.')
  const stride = width * 4
  const inflated = inflateSync(Buffer.concat(idat), { maxOutputLength: (stride + 1) * height })
  if (inflated.length !== (stride + 1) * height) throw unavailable('PNG decoded byte length is invalid.')
  const output = Buffer.alloc(stride * height)
  for (let y = 0; y < height; y++) {
    const sourceOffset = y * (stride + 1); const filter = inflated[sourceOffset]!
    if (filter > 4) throw unavailable('PNG uses an unsupported filter.')
    for (let x = 0; x < stride; x++) {
      const raw = inflated[sourceOffset + 1 + x]!
      const left = x >= 4 ? output[y * stride + x - 4]! : 0
      const above = y > 0 ? output[(y - 1) * stride + x]! : 0
      const upperLeft = y > 0 && x >= 4 ? output[(y - 1) * stride + x - 4]! : 0
      const value = filter === 0 ? raw
        : filter === 1 ? raw + left
          : filter === 2 ? raw + above
            : filter === 3 ? raw + Math.floor((left + above) / 2)
              : raw + paeth(left, above, upperLeft)
      output[y * stride + x] = value & 0xff
    }
  }
  return { width, height, data: output }
}
function paeth(left: number, above: number, upperLeft: number): number {
  const prediction = left + above - upperLeft
  const leftDistance = Math.abs(prediction - left), aboveDistance = Math.abs(prediction - above), upperLeftDistance = Math.abs(prediction - upperLeft)
  return leftDistance <= aboveDistance && leftDistance <= upperLeftDistance ? left : aboveDistance <= upperLeftDistance ? above : upperLeft
}
function invalid(message: string) { return new ApiError('VALIDATION_FAILED', message, 400) }
function unavailable(message: string) { return new ApiError('TOOL_NOT_READY', message, 503) }
