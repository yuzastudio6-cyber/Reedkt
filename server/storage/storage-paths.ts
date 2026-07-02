import path from 'node:path'
import type { CanonicalObjectPathInput, UploadPurpose } from './storage-types'

const PURPOSE_SEGMENTS: Record<UploadPurpose, string> = {
  source_media: 'source-media',
  reference_media: 'reference-media',
  generated_asset: 'generated-assets',
  processed_media: 'processed-media',
  preview: 'previews',
  export: 'exports',
  thumbnail: 'thumbnails',
  qa_artifact: 'qa-artifacts',
  worker_temp: 'worker-temp',
}

export function sanitizeFileName(input: string | undefined): string {
  const baseName = path.basename(input ?? '')
  const cleaned = baseName
    .replace(/[\\/]/g, '')
    .split('')
    .filter((char) => {
      const code = char.charCodeAt(0)
      return code > 31 && code !== 127
    })
    .join('')
    .replace(/\.\.+/g, '.')
    .replace(/[^a-zA-Z0-9._ -]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '')
    .trim()

  if (!cleaned || cleaned === '.' || cleaned === '..') return 'upload.bin'
  return cleaned.slice(0, 180)
}

export function normalizeStoragePath(input: string): string {
  const normalized = input.replace(/\\/g, '/').split('/').filter(Boolean)
  if (normalized.some((segment) => segment === '..' || segment === '.')) {
    throw new Error('Storage path cannot contain traversal segments.')
  }
  return normalized.join('/')
}

export function buildCanonicalObjectPath(input: CanonicalObjectPathInput): string {
  const safeFileName = sanitizeFileName(input.fileName)
  const purposeSegment = PURPOSE_SEGMENTS[input.purpose]
  return normalizeStoragePath(
    `workspaces/${input.workspaceId}/projects/${input.projectId}/${purposeSegment}/${input.ownerId}/${safeFileName}`,
  )
}

export function bucketNameForPurpose(purpose: UploadPurpose, buckets: Partial<Record<UploadPurpose, string>>): string {
  return buckets[purpose] ?? PURPOSE_SEGMENTS[purpose]
}

export function purposeSegmentForPurpose(purpose: UploadPurpose): string {
  return PURPOSE_SEGMENTS[purpose]
}
