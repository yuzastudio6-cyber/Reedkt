import { createHash } from 'node:crypto'

import {
  readPrivateFileIfExistsWithinRoot,
  writePrivateFileCreateOnlyWithinRoot,
} from '../security/private-local-persistence'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'

const MAXIMUM_PRIVATE_JSON_OBJECT_BYTES = 32 * 1024 * 1024
const SAFE_OBJECT_PATH = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,1023}$/u
const RAW_SHA256 = /^[a-f0-9]{64}$/u

/**
 * Single-host private/internal implementation of the shared create-only JSON
 * object port. It preserves the same exact-byte and collision semantics as the
 * GCS implementation without claiming distributed or production durability.
 */
export function createCanonicalPrivateLocalJsonObjectPort(input: {
  readonly localStorageRoot: string
}): CanonicalCreateOnlyJsonObjectPort {
  if (!input.localStorageRoot) {
    throw new Error('Canonical private JSON object root is unavailable.')
  }
  const port: CanonicalCreateOnlyJsonObjectPort = {
    async createOnly(value) {
      assertCreateInput(value)
      const result = await writePrivateFileCreateOnlyWithinRoot({
        rootPath: input.localStorageRoot,
        relativePath: value.objectPath,
        content: value.body,
      })
      const reread = await readPrivateFileIfExistsWithinRoot({
        rootPath: input.localStorageRoot,
        relativePath: value.objectPath,
      })
      if (!reread || !reread.equals(value.body)
        || sha256(reread) !== value.contentSha256) {
        throw new Error('Canonical private JSON object reread mismatch.')
      }
      return result.created ? 'created' as const : 'already_exists' as const
    },
    async readExact(objectPath) {
      assertObjectPath(objectPath)
      const value = await readPrivateFileIfExistsWithinRoot({
        rootPath: input.localStorageRoot,
        relativePath: objectPath,
      })
      if (!value) return null
      if (value.byteLength < 2
        || value.byteLength > MAXIMUM_PRIVATE_JSON_OBJECT_BYTES) {
        throw new Error('Canonical private JSON object bytes are invalid.')
      }
      return Buffer.from(value)
    },
  }
  return Object.freeze(port)
}

function assertCreateInput(value: {
  readonly objectPath: string
  readonly body: Buffer
  readonly contentSha256: string
}): void {
  assertObjectPath(value.objectPath)
  if (!Buffer.isBuffer(value.body)
    || value.body.byteLength < 2
    || value.body.byteLength > MAXIMUM_PRIVATE_JSON_OBJECT_BYTES
    || !RAW_SHA256.test(value.contentSha256)
    || sha256(value.body) !== value.contentSha256) {
    throw new Error('Canonical private JSON object input is invalid.')
  }
}

function assertObjectPath(value: string): void {
  if (!SAFE_OBJECT_PATH.test(value)
    || value.includes('..')
    || value.startsWith('/')
    || value.endsWith('/')
    || value.includes('//')) {
    throw new Error('Canonical private JSON object path is invalid.')
  }
}

function sha256(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}
