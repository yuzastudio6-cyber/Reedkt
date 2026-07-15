import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'

const SHA256_HEX_PATTERN = /^[a-f0-9]{64}$/

export interface LocalMediaFileAuthority {
  sizeBytes: number
  checksumSha256: string
}

export async function inspectLocalMediaFileAuthority(
  localFilePath: string,
): Promise<LocalMediaFileAuthority> {
  const fileStat = await stat(localFilePath)
  if (!fileStat.isFile() || fileStat.size <= 0) {
    throw new Error('Media authority requires a non-empty regular file.')
  }

  const hash = createHash('sha256')
  for await (const chunk of createReadStream(localFilePath)) {
    hash.update(chunk)
  }

  return {
    sizeBytes: fileStat.size,
    checksumSha256: hash.digest('hex'),
  }
}

export async function verifyLocalMediaFileAuthority(input: {
  localFilePath: string
  expectedSizeBytes: number
  expectedChecksumSha256: string
}): Promise<LocalMediaFileAuthority> {
  if (!Number.isSafeInteger(input.expectedSizeBytes) || input.expectedSizeBytes <= 0) {
    throw new Error('Exact media source authority requires a positive safe byte size.')
  }
  if (!SHA256_HEX_PATTERN.test(input.expectedChecksumSha256)) {
    throw new Error('Exact media source authority requires a lowercase SHA-256 checksum.')
  }

  const actual = await inspectLocalMediaFileAuthority(input.localFilePath)
  if (actual.sizeBytes !== input.expectedSizeBytes) {
    throw new Error('Exact media source authority byte size does not match the local source.')
  }
  if (actual.checksumSha256 !== input.expectedChecksumSha256) {
    throw new Error('Exact media source authority checksum does not match the local source.')
  }
  return actual
}
