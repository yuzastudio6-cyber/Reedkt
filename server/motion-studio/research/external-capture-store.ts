import { createHash } from 'node:crypto'

import { writePrivateFileCreateOnlyWithinRoot } from '../../security/private-local-persistence'
import {
  MS011B_EXT001_RUN_IDENTITY,
  type Ms011bExternalAuthorizationId,
  type Ms011bExternalRunIdentity,
} from './external-run-identity'

export interface Ms011bPrivateCaptureReceipt {
  captureId: string
  authorizationId: Ms011bExternalAuthorizationId
  runId: string
  requestOrdinal: 1 | 2 | 3
  objectId: string
  contentType: string
  byteLength: number
  checksumSha256: string
  created: boolean
  privateLocalOnly: true
  browserReadable: false
  finalAssetEligible: false
}

export async function persistMs011bPrivateCapture(input: {
  rootPath: string
  runId: string
  requestOrdinal: 1 | 2 | 3
  contentType: string
  bytes: Buffer
  identity?: Ms011bExternalRunIdentity
}): Promise<Ms011bPrivateCaptureReceipt> {
  const identity = input.identity ?? MS011B_EXT001_RUN_IDENTITY
  if (!/^[a-z0-9][a-z0-9-]{7,119}$/.test(input.runId)) {
    throw new Error('MS-011B private capture run identity is invalid.')
  }
  if (!Number.isSafeInteger(input.bytes.byteLength) || input.bytes.byteLength <= 0) {
    throw new Error('MS-011B private capture is empty or too large to meter safely.')
  }
  const checksumSha256 = createHash('sha256').update(input.bytes).digest('hex')
  const captureId = `${identity.captureIdPrefix}${input.requestOrdinal}-${checksumSha256.slice(0, 24)}`
  const objectId = `private-${captureId}`
  const extension = input.contentType === 'application/json' ? 'json'
    : input.contentType === 'image/jpeg' ? 'jpg'
      : input.contentType === 'image/png' ? 'png'
        : input.contentType === 'image/webp' ? 'webp' : 'bin'
  const relativePath = [
    'research-evidence',
    input.runId,
    `request-${input.requestOrdinal}`,
    checksumSha256.slice(0, 2),
    `${captureId}.${extension}`,
  ].join('/')
  const write = await writePrivateFileCreateOnlyWithinRoot({
    rootPath: input.rootPath,
    relativePath,
    content: input.bytes,
  })
  return {
    captureId,
    authorizationId: identity.authorizationId,
    runId: input.runId,
    requestOrdinal: input.requestOrdinal,
    objectId,
    contentType: input.contentType,
    byteLength: input.bytes.byteLength,
    checksumSha256,
    created: write.created,
    privateLocalOnly: true,
    browserReadable: false,
    finalAssetEligible: false,
  }
}
