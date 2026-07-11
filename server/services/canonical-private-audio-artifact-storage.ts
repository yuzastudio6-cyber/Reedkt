import { createHash } from 'node:crypto'

import { ApiError } from '../errors/api-error'
import { readPrivateFileIfExistsWithinRoot, writePrivateFileCreateOnlyWithinRoot } from '../security/private-local-persistence'

const SHA = /^[a-f0-9]{64}$/
const MAXIMUM_BYTES = 8 * 1024 * 1024

export async function persistCanonicalPrivateAudioArtifact(input: {
  localStorageRoot: string
  privateObjectIdentityHash: string
  bytes: Buffer
  expectedSha256: string
}): Promise<void> {
  if (
    !SHA.test(input.privateObjectIdentityHash) || !SHA.test(input.expectedSha256) ||
    input.bytes.byteLength < 44 || input.bytes.byteLength > MAXIMUM_BYTES ||
    sha256(input.bytes) !== input.expectedSha256 || !isPcmWave(input.bytes)
  ) throw invalid('Private audio failed its fixed PCM WAV commitment.')
  await writePrivateFileCreateOnlyWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: relativePath(input.privateObjectIdentityHash),
    content: input.bytes,
  })
  const stored = await readCanonicalPrivateAudioArtifact(input)
  if (!stored || !stored.bytes.equals(input.bytes) || stored.sha256 !== input.expectedSha256) {
    throw invalid('Private audio changed during create-only persistence.')
  }
}

export async function readCanonicalPrivateAudioArtifact(input: {
  localStorageRoot: string
  privateObjectIdentityHash: string
}) {
  if (!SHA.test(input.privateObjectIdentityHash)) throw invalid('Private audio identity is invalid.')
  const bytes = await readPrivateFileIfExistsWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: relativePath(input.privateObjectIdentityHash),
  })
  if (!bytes) return undefined
  if (bytes.byteLength < 44 || bytes.byteLength > MAXIMUM_BYTES || !isPcmWave(bytes)) {
    throw invalid('Stored private audio is invalid.')
  }
  return { bytes, byteLength: bytes.byteLength, sha256: sha256(bytes), contentType: 'audio/wav' as const }
}

function relativePath(identity: string): string {
  return `canonical-audio-tool-results/private-v1/${identity.slice(0, 2)}/${identity}.wav`
}
function isPcmWave(bytes: Buffer): boolean {
  if (bytes.subarray(0, 4).toString('ascii') !== 'RIFF' || bytes.subarray(8, 12).toString('ascii') !== 'WAVE') return false
  const formatOffset = bytes.indexOf(Buffer.from('fmt '))
  const dataOffset = bytes.indexOf(Buffer.from('data'))
  if (formatOffset < 12 || dataOffset < formatOffset + 12 || formatOffset + 10 > bytes.byteLength) return false
  return bytes.readUInt16LE(formatOffset + 8) === 1
}
function sha256(bytes: Buffer): string { return createHash('sha256').update(bytes).digest('hex') }
function invalid(message: string): ApiError {
  return new ApiError('JOB_DEPENDENCY_NOT_READY', message, 409, {
    requiredGate: 'canonical_private_audio_artifact_integrity',
  })
}
