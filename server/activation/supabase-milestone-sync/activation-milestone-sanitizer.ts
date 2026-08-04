import type { SupabaseMilestoneBundle } from '../supabase-milestone-registry'
import type { ActivationMilestoneSanitizerResult, ActivationMilestoneSyncInput } from './supabase-milestone-sync-types'

const SECRET_PATTERNS = [
  /postgres(?:ql)?:\/\/[^\s"']+/i,
  /service[_-]?role[_-]?key/i,
  /supabase_service_role_key/i,
  /supabase_db_url/i,
  /bearer\s+[a-z0-9._-]+/i,
  /x-subscription-token/i,
  /brave_search_api_key/i,
  /sk-[a-z0-9_-]{16,}/i,
  /password\s*=/i,
  /apikey\s*=/i,
]

export function enforceActivationMilestoneSyncPolicy(input: { syncInput: ActivationMilestoneSyncInput; bundle: SupabaseMilestoneBundle }): ActivationMilestoneSanitizerResult {
  const blockers: string[] = []
  const warnings: string[] = []
  const checkedPaths: string[] = []

  for (const artifact of input.bundle.artifacts) {
    checkedPaths.push(`artifact:${artifact.artifactId}`)
    if (!artifact.gcsUri.startsWith('gs://')) blockers.push(`Artifact ${artifact.artifactId} must use a private gs:// URI.`)
    if (/^https?:\/\//i.test(artifact.gcsUri) && artifact.sourceOfTruth) blockers.push(`Artifact ${artifact.artifactId} uses a public URL as source of truth.`)
    if (artifact.signedUrlSourceOfTruth) blockers.push(`Artifact ${artifact.artifactId} marks a signed URL as source of truth.`)
  }

  for (const gate of input.bundle.featureGateUpdates) {
    checkedPaths.push(`featureGate:${gate.gateKey}`)
    if (gate.enabled) blockers.push(`Feature gate ${gate.gateKey} attempts to enable a blocked capability.`)
    if (gate.productionAllowed || gate.externalBetaAllowed || gate.paidProductionAllowed || gate.broadMediaAllowed) {
      blockers.push(`Feature gate ${gate.gateKey} attempts to unlock production, beta, paid production, or broad media.`)
    }
  }

  const secretPath = findUnsafeValue(input.syncInput, '$.syncInput') ?? findUnsafeValue(input.bundle, '$.bundle')
  if (secretPath) blockers.push(`Milestone sync payload contains an unsafe value at ${secretPath}.`)

  if (!input.bundle.artifacts.length) warnings.push('Milestone sync bundle has no artifact references.')
  return { ok: blockers.length === 0, blockers, warnings, checkedPaths }
}

function findUnsafeValue(value: unknown, path: string): string | undefined {
  if (typeof value === 'string') {
    if (value.length > 12000) return path
    if (SECRET_PATTERNS.some((pattern) => pattern.test(value))) return path
    if (/X-Amz-Signature|Signature=|GoogleAccessId=/i.test(value)) return path
    return undefined
  }
  if (!value || typeof value !== 'object') return undefined
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const found = findUnsafeValue(value[index], `${path}[${index}]`)
      if (found) return found
    }
    return undefined
  }
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase()
    if (lowerKey.includes('rawproviderresponse') || lowerKey.includes('rawbraveresponse') || lowerKey === 'rawresponse') return `${path}.${key}`
    if (lowerKey.includes('bravesnippet') || lowerKey.includes('providersnippet') || lowerKey.includes('rawsnippet')) return `${path}.${key}`
    if (lowerKey.includes('requestheaders') || lowerKey.includes('responseheaders') || lowerKey.includes('blobdata') || lowerKey.includes('rawmedia')) return `${path}.${key}`
    if ((lowerKey.includes('secret') || lowerKey.includes('password') || lowerKey.includes('token') || lowerKey.includes('service_role')) && typeof nested === 'string' && nested.trim()) return `${path}.${key}`
    const found = findUnsafeValue(nested, `${path}.${key}`)
    if (found) return found
  }
  return undefined
}
