import { accessSync, constants, statSync } from 'node:fs'
import path from 'node:path'
import { firstRealVideoConfig } from './first-real-video-policy'
import type { FirstRealVideoSourceValidation } from './first-real-video-types'

const MAX_SOURCE_BYTES = 500 * 1024 * 1024
const ALLOWED_EXTENSIONS = new Set(['.mp4', '.mov', '.m4v', '.webm'])

export function validateFirstRealVideoSource(input: {
  sourceVideoPath?: string
  sourceGcsUri?: string
  repoRoot?: string
}): FirstRealVideoSourceValidation {
  if (input.sourceVideoPath) return validateLocalSource(input.sourceVideoPath, input.repoRoot)
  if (input.sourceGcsUri) return validateGcsSource(input.sourceGcsUri)
  return {
    sourceType: 'local_path',
    source: '',
    sanitizedFilename: '',
    allowed: false,
    blockers: ['Phase 28 requires an explicit approved source path or private GCS URI.'],
    warnings: [],
  }
}

function validateLocalSource(source: string, repoRoot = process.cwd()): FirstRealVideoSourceValidation {
  const blockers: string[] = []
  const warnings: string[] = []
  const sanitizedFilename = sanitizeFilename(path.basename(source))
  if (source !== firstRealVideoConfig.sourceVideoPath) blockers.push(`Local source must be exactly ${firstRealVideoConfig.sourceVideoPath}.`)
  if (/[*?[\]{}]/.test(source)) blockers.push('Source path must not contain wildcard or glob characters.')
  if (/^https?:\/\//i.test(source) || source.startsWith('gs://')) blockers.push('Local source path must not be a URL or GCS URI.')
  if (/\.ssh|id_rsa|secret|password|token|keychain/i.test(source)) blockers.push('Source path looks like a secret/system path.')
  if (path.resolve(source).startsWith(path.resolve(repoRoot))) blockers.push('Source video must not live inside the git repo.')

  let sizeBytes: number | undefined
  try {
    const stat = statSync(source)
    sizeBytes = stat.size
    if (!stat.isFile()) blockers.push('Source path must be a file.')
    if (stat.size > MAX_SOURCE_BYTES) blockers.push('Source video exceeds the Phase 28 500 MB limit.')
    accessSync(source, constants.R_OK)
  } catch (error) {
    blockers.push(`Source file is missing or unreadable: ${error instanceof Error ? error.message : String(error)}`)
  }

  const extension = path.extname(source).toLowerCase()
  if (!ALLOWED_EXTENSIONS.has(extension)) blockers.push(`Unsupported source extension: ${extension || '(none)'}.`)

  return {
    sourceType: 'local_path',
    source,
    sanitizedFilename,
    sizeBytes,
    allowed: blockers.length === 0,
    blockers,
    warnings,
  }
}

function validateGcsSource(source: string): FirstRealVideoSourceValidation {
  const blockers: string[] = []
  if (!source.startsWith('gs://')) blockers.push('GCS source must start with gs://.')
  if (/^https?:\/\//i.test(source) || /X-Goog-Signature|GoogleAccessId/i.test(source)) blockers.push('Signed URLs are not allowed as source of truth.')
  if (!source.startsWith(`gs://${firstRealVideoConfig.sourceBucket}/`)) blockers.push('GCS source must be in the private staging source bucket.')
  return {
    sourceType: 'gcs_uri',
    source,
    sanitizedFilename: sanitizeFilename(path.basename(source)),
    allowed: blockers.length === 0,
    blockers,
    warnings: [],
  }
}

export function sanitizeFilename(name: string): string {
  return name.replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 120) || 'source-video.mov'
}
