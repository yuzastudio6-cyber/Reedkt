import type { ProductionStorageBucketPurpose } from '../../../src/backend/contracts/production-tool-runtime-contracts'
import type { ProductionWorkerStorageReferenceInput } from './production-worker-types'

const storageBucketPurposes: ProductionStorageBucketPurpose[] = [
  'source_media',
  'proxy_media',
  'analysis_artifacts',
  'transcripts',
  'masks',
  'generated_assets',
  'previews',
  'final_exports',
  'worker_temp',
  'qa_artifacts',
]

const forbiddenPayloadKeys = new Set([
  'rawprompt',
  'raw_prompt',
  'prompttext',
  'prompt_text',
  'rawuserchat',
  'raw_user_chat',
  'rawchat',
  'raw_chat',
  'signedurl',
  'signed_url',
  'servicerolekey',
  'service_role_key',
  'providerapikey',
  'provider_api_key',
  'secretvalue',
  'secret_value',
])

export function isAllowedProductionStorageBucketPurpose(value: string): value is ProductionStorageBucketPurpose {
  return storageBucketPurposes.includes(value as ProductionStorageBucketPurpose)
}

export function isUrlLikeOrSignedValue(value: string): boolean {
  const normalized = value.trim().toLowerCase()
  return normalized.startsWith('http://') ||
    normalized.startsWith('https://') ||
    normalized.startsWith('signed://') ||
    normalized.includes('x-goog-signature=') ||
    normalized.includes('x-amz-signature=') ||
    normalized.includes('signature=') ||
    normalized.includes('signedurl') ||
    normalized.includes('signed_url')
}

export function isForbiddenWorkerPayloadKey(key: string): boolean {
  return forbiddenPayloadKeys.has(key.toLowerCase())
}

export function findForbiddenWorkerPayloadEntries(value: unknown): string[] {
  const findings: string[] = []

  function visit(item: unknown, path: string): void {
    if (Array.isArray(item)) {
      item.forEach((child, index) => visit(child, `${path}[${index}]`))
      return
    }

    if (!item || typeof item !== 'object') {
      if (typeof item === 'string' && isUrlLikeOrSignedValue(item)) {
        findings.push(`${path}=url_like_value`)
      }
      return
    }

    Object.entries(item as Record<string, unknown>).forEach(([key, child]) => {
      if (isForbiddenWorkerPayloadKey(key)) {
        findings.push(`${path}.${key}`)
      }
      visit(child, `${path}.${key}`)
    })
  }

  visit(value, 'payload')
  return findings
}

export function assertWorkerPayloadHasNoForbiddenFields(payload: unknown): void {
  const findings = findForbiddenWorkerPayloadEntries(payload)
  if (findings.length > 0) {
    throw new Error(`Worker payload contains forbidden raw prompt, signed URL, or secret fields: ${findings.join(', ')}`)
  }
}

export function validateProductionStorageReference(input: ProductionWorkerStorageReferenceInput): void {
  if (!isAllowedProductionStorageBucketPurpose(input.storageBucketPurpose)) {
    throw new Error(`Unsupported production storage bucket purpose: ${input.storageBucketPurpose}`)
  }

  if (!input.storageObjectPath || isUrlLikeOrSignedValue(input.storageObjectPath)) {
    throw new Error('Storage object path must be a private storage reference, not a signed URL or raw URL.')
  }

  if (!input.isPrivate || !input.sourceOfTruth) {
    throw new Error('Production worker artifacts must default to private source-of-truth storage references.')
  }
}

export function prepareFutureArtifactRecord(input: ProductionWorkerStorageReferenceInput): ProductionWorkerStorageReferenceInput {
  validateProductionStorageReference(input)
  return input
}
