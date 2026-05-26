import type { PrivateMediaPolicy } from './privacy-retention-types'

export const privateMediaPolicy: PrivateMediaPolicy = {
  publicBucketsAllowed: false,
  persistentSignedUrlsAllowed: false,
  privateStorageRefsRequired: true,
  explicitDeliverySharePolicyRequired: true,
}

export function assertPrivateArtifactRecord(record: { isPrivate?: boolean; signedUrl?: unknown; signed_url?: unknown }): void {
  if (record.isPrivate !== true) throw new Error('Artifact records must be private by default.')
  if (record.signedUrl || record.signed_url) throw new Error('Persistent signed URLs are not allowed as artifact source of truth.')
}
