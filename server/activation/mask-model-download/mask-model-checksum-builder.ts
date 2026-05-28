import { createHash } from 'node:crypto'
import type {
  ApprovedMaskModelDownloadEvidence,
  MaskModelChecksumEntry,
  MaskModelTreeManifest,
} from './mask-model-download-types'

export function buildMaskModelAggregateChecksum(entries: MaskModelChecksumEntry[]): string {
  const sorted = [...entries].sort((a, b) => a.relativePath.localeCompare(b.relativePath))
  const content = sorted.map((entry) => `${entry.sha256}  ${entry.relativePath}`).join('\n')
  return createHash('sha256').update(`${content}\n`).digest('hex')
}

export function buildMaskModelTreeManifest(input: {
  repoId: 'ZhengPeng7/BiRefNet'
  resolvedRevision: string
  files: MaskModelChecksumEntry[]
}): MaskModelTreeManifest {
  const files = [...input.files].sort((a, b) => a.relativePath.localeCompare(b.relativePath))
  const readmeLicenseFiles = files.map((file) => file.relativePath).filter((path) => /(^|\/)(readme|license|notice|citation|model_card)/i.test(path))
  const configFiles = files.map((file) => file.relativePath).filter((path) => /\.(json|yaml|yml|toml|txt)$/i.test(path) && /config|preprocessor|tokenizer|generation|special_tokens|vocab/i.test(path))
  const customCodeFiles = files.map((file) => file.relativePath).filter((path) => /\.(py|sh|ipynb)$/i.test(path))
  const modelWeightFiles = files.map((file) => file.relativePath).filter((path) => /\.(safetensors|bin|pt|pth|ckpt)$/i.test(path))
  const tokenizerFiles = files.map((file) => file.relativePath).filter((path) => /tokenizer|vocab|merges|special_tokens/i.test(path))
  return {
    repoId: input.repoId,
    resolvedRevision: input.resolvedRevision,
    fileCount: files.length,
    totalSizeBytes: files.reduce((sum, file) => sum + file.sizeBytes, 0),
    aggregateSha256: buildMaskModelAggregateChecksum(files),
    readmeLicenseFiles,
    configFiles,
    customCodeFiles,
    modelWeightFiles,
    tokenizerFiles,
    hasCustomCode: customCodeFiles.length > 0,
    hasSafetensorsOrBinWeights: modelWeightFiles.some((path) => /\.(safetensors|bin)$/i.test(path)),
    files,
  }
}

export function maskDownloadEvidenceHasChecksum(evidence: ApprovedMaskModelDownloadEvidence): boolean {
  return Boolean(evidence.aggregateSha256 && /^[a-f0-9]{64}$/.test(evidence.aggregateSha256))
}
