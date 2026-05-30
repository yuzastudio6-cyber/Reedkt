import { createHash } from 'node:crypto'
import { existsSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { assertNoPathTraversal, assertNoSignedUrlOrRawUrl } from '../media/media-path-safety'

export const DEMUCS_RUNTIME_DOWNLOADS_BLOCKED_MESSAGE = 'Demucs runtime model downloads are blocked; use only approved company-controlled artifacts.'
export const DEMUCS_APPROVAL_REQUIRED_MESSAGE = 'Approved Demucs model artifact is missing or invalid.'

export type DemucsApprovalLicenseStatus = 'approved' | 'needs_review' | 'blocked'

export interface DemucsApprovalManifest {
  schemaVersion: number
  tool: 'demucs'
  model_id: string
  model_file: string
  model_source: string
  model_license: string
  commercial_use_approved: boolean
  redistribution_approved?: boolean
  license_status: DemucsApprovalLicenseStatus
  approved_by: string
  approved_at: string
  sha256: string
  intended_uses: string[]
  blocked_uses: string[]
}

export interface DemucsModelApprovalInput {
  enabled?: string
  modelId?: string
  modelPath?: string
  approvalPath?: string
  allowRuntimeDownloads?: string
  checksum?: string
}

export interface DemucsModelApprovalResult {
  valid: boolean
  manifest?: DemucsApprovalManifest
  modelPath?: string
  approvalPath?: string
  modelDirectory?: string
  blockers: string[]
  warnings: string[]
}

const requiredIntendedUses = [
  'Separate Vocals',
  'Remove Background Music',
  'Split Stems',
  'Create Instrumental',
  'Isolate Voice from Music',
]

const requiredBlockedUses = [
  'Clean Voice',
  'Enhance Speech',
  'Remove Background Noise',
  'Speech Denoise',
  'Voice Cleanup',
]

export function validateDemucsModelApproval(input: DemucsModelApprovalInput = {}): DemucsModelApprovalResult {
  const enabled = input.enabled ?? process.env.DEMUCS_ENABLED ?? 'false'
  const modelId = input.modelId ?? process.env.DEMUCS_MODEL_ID
  const modelPath = input.modelPath ?? process.env.DEMUCS_MODEL_PATH
  const approvalPath = input.approvalPath ?? process.env.DEMUCS_APPROVAL_PATH
  const allowRuntimeDownloads = input.allowRuntimeDownloads ?? process.env.DEMUCS_ALLOW_RUNTIME_DOWNLOADS ?? 'false'
  const blockers: string[] = []
  const warnings: string[] = []

  if (allowRuntimeDownloads !== 'false') blockers.push(DEMUCS_RUNTIME_DOWNLOADS_BLOCKED_MESSAGE)
  if (enabled !== 'true') blockers.push('DEMUCS_ENABLED=true is required for non-mock Demucs separation.')
  if (!modelId) blockers.push('DEMUCS_MODEL_ID is required.')
  if (!modelPath) blockers.push('DEMUCS_MODEL_PATH is required.')
  if (!approvalPath) blockers.push('DEMUCS_APPROVAL_PATH is required.')

  for (const [label, value] of [
    ['DEMUCS_MODEL_PATH', modelPath],
    ['DEMUCS_APPROVAL_PATH', approvalPath],
  ] as const) {
    if (!value) continue
    try {
      assertNoSignedUrlOrRawUrl(value, label)
      assertNoPathTraversal(value, label)
    } catch (error) {
      blockers.push(error instanceof Error ? error.message : `${label} is unsafe.`)
    }
  }

  if (blockers.length > 0 || !modelPath || !approvalPath || !modelId) {
    return { valid: false, modelPath, approvalPath, blockers: withGenericBlocker(blockers), warnings }
  }

  if (!existsSync(modelPath)) blockers.push(`Approved Demucs model file does not exist: ${modelPath}`)
  if (!existsSync(approvalPath)) blockers.push(`Demucs approval manifest does not exist: ${approvalPath}`)
  if (blockers.length > 0) return { valid: false, modelPath, approvalPath, blockers: withGenericBlocker(blockers), warnings }

  const manifest = parseApprovalManifest(approvalPath, blockers)
  if (!manifest) return { valid: false, modelPath, approvalPath, blockers: withGenericBlocker(blockers), warnings }

  if (manifest.tool !== 'demucs') blockers.push('Demucs approval manifest must have tool="demucs".')
  if (manifest.model_id !== modelId) blockers.push(`DEMUCS_MODEL_ID must match approval manifest model_id (${manifest.model_id}).`)
  if (manifest.commercial_use_approved !== true) blockers.push('Demucs model commercial_use_approved must be true.')
  if (manifest.license_status !== 'approved') blockers.push('Demucs model license_status must be approved.')
  if (!manifest.model_source) blockers.push('Demucs model_source is required.')
  if (!manifest.model_license) blockers.push('Demucs model_license is required.')
  if (!manifest.approved_by) blockers.push('Demucs approved_by is required.')
  if (!manifest.approved_at || Number.isNaN(Date.parse(manifest.approved_at))) blockers.push('Demucs approved_at must be a valid timestamp.')
  if (!/^[a-f0-9]{64}$/i.test(manifest.sha256)) blockers.push('Demucs sha256 must be a 64-character SHA-256 hex digest.')
  if (path.basename(modelPath) !== manifest.model_file) blockers.push('DEMUCS_MODEL_PATH file name must match approval manifest model_file.')

  for (const required of requiredIntendedUses) {
    if (!manifest.intended_uses?.includes(required)) blockers.push(`Demucs intended_uses must include "${required}".`)
  }
  for (const blocked of requiredBlockedUses) {
    if (!manifest.blocked_uses?.includes(blocked)) blockers.push(`Demucs blocked_uses must include "${blocked}".`)
  }

  if (existsSync(modelPath) && statSync(modelPath).size <= 0) blockers.push('Approved Demucs model file must be non-empty.')
  const sha256 = input.checksum ?? (existsSync(modelPath) ? sha256File(modelPath) : undefined)
  if (sha256 && manifest.sha256.toLowerCase() !== sha256.toLowerCase()) {
    blockers.push('Approved Demucs model checksum does not match approval manifest sha256.')
  }

  if (blockers.length === 0 && manifest.redistribution_approved !== true) {
    warnings.push('Demucs model redistribution is not approved; keep artifacts private and company-controlled.')
  }

  return {
    valid: blockers.length === 0,
    manifest,
    modelPath,
    approvalPath,
    modelDirectory: path.dirname(modelPath),
    blockers: withGenericBlocker(blockers),
    warnings,
  }
}

function parseApprovalManifest(approvalPath: string, blockers: string[]): DemucsApprovalManifest | undefined {
  try {
    return JSON.parse(readFileSync(approvalPath, 'utf8')) as DemucsApprovalManifest
  } catch (error) {
    blockers.push(error instanceof Error ? `Demucs approval manifest is invalid JSON: ${error.message}` : 'Demucs approval manifest is invalid JSON.')
    return undefined
  }
}

function sha256File(filePath: string): string {
  const hash = createHash('sha256')
  hash.update(readFileSync(filePath))
  return hash.digest('hex')
}

function withGenericBlocker(blockers: string[]): string[] {
  return blockers.length > 0 ? Array.from(new Set([DEMUCS_APPROVAL_REQUIRED_MESSAGE, ...blockers])) : []
}
