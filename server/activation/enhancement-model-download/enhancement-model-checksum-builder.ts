import { createHash } from 'node:crypto'
import {
  APPROVED_ENHANCEMENT_MODEL_FILE,
  APPROVED_ENHANCEMENT_MODEL_RELEASE_VERSION,
  APPROVED_ENHANCEMENT_MODEL_SOURCE_URL,
} from './enhancement-model-download-policy'
import type {
  ApprovedEnhancementModelDownloadEvidence,
  EnhancementModelChecksumEntry,
  EnhancementModelTreeManifest,
} from './enhancement-model-download-types'

export function buildEnhancementModelAggregateChecksum(entries: EnhancementModelChecksumEntry[]): string {
  const sorted = [...entries].sort((a, b) => a.relativePath.localeCompare(b.relativePath))
  const content = sorted.map((entry) => `${entry.sha256}  ${entry.relativePath}`).join('\n')
  return createHash('sha256').update(`${content}\n`).digest('hex')
}

export function buildEnhancementModelTreeManifest(input: {
  files: EnhancementModelChecksumEntry[]
}): EnhancementModelTreeManifest {
  const files = [...input.files].sort((a, b) => a.relativePath.localeCompare(b.relativePath))
  const readmeLicenseFiles = files.map((file) => file.relativePath).filter((path) => /(^|\/)(readme|license|notice|citation|model_card)/i.test(path))
  const configFiles = files.map((file) => file.relativePath).filter((path) => /\.(json|yaml|yml|toml|txt)$/i.test(path) && /config|license|notice|readme/i.test(path))
  const modelWeightFiles = files.map((file) => file.relativePath).filter((path) => /\.(pth)$/i.test(path))
  const fileSha256 = files.find((file) => file.relativePath === APPROVED_ENHANCEMENT_MODEL_FILE)?.sha256 ?? ''
  return {
    modelName: 'RealESRGAN_x4plus',
    sourceUrl: APPROVED_ENHANCEMENT_MODEL_SOURCE_URL,
    releaseVersion: APPROVED_ENHANCEMENT_MODEL_RELEASE_VERSION,
    fileCount: files.length,
    totalSizeBytes: files.reduce((sum, file) => sum + file.sizeBytes, 0),
    fileSha256,
    aggregateSha256: buildEnhancementModelAggregateChecksum(files),
    readmeLicenseFiles,
    configFiles,
    modelWeightFiles,
    hasPthWeight: modelWeightFiles.includes(APPROVED_ENHANCEMENT_MODEL_FILE),
    files,
  }
}

export function enhancementDownloadEvidenceHasChecksum(evidence: ApprovedEnhancementModelDownloadEvidence): boolean {
  return Boolean(
    evidence.fileSha256 &&
    /^[a-f0-9]{64}$/.test(evidence.fileSha256) &&
    evidence.aggregateSha256 &&
    /^[a-f0-9]{64}$/.test(evidence.aggregateSha256),
  )
}
