import { validateSupabaseMilestoneBundle, type SupabaseMilestoneBundle } from '../supabase-milestone-registry'
import type { ActivationMilestoneSyncInput, ActivationMilestoneSyncValidation } from './supabase-milestone-sync-types'

const forbiddenTextPatterns = [
  /postgres(?:ql)?:\/\/[^\s"']+/i,
  /service[_-]?role[_-]?key/i,
  /supabase_service_role_key/i,
  /supabase_db_url/i,
  /bearer\s+[a-z0-9._-]{12,}/i,
  /api[_-]?key\s*[:=]/i,
  /x-subscription-token/i,
  /password\s*=/i,
  /signature=/i,
  /x-amz-signature/i,
]

const forbiddenKeyPatterns = [
  /secret/i,
  /service[_-]?role/i,
  /password/i,
  /token/i,
  /api[_-]?key/i,
  /rawbraveresponse/i,
  /rawproviderresponse/i,
  /snippetstored/i,
]

export function validateActivationMilestoneSyncInput(input: ActivationMilestoneSyncInput): ActivationMilestoneSyncValidation {
  const blockers: string[] = []
  const warnings: string[] = []

  for (const field of ['phaseId', 'phaseName', 'runId', 'status', 'branch', 'baseBranch', 'readinessStatus'] as const) {
    if (!input[field]) blockers.push(`Sync input missing required field ${field}.`)
  }
  if (!input.supabaseSyncPolicy) blockers.push('Sync input missing supabaseSyncPolicy.')
  if (input.supabaseSyncPolicy?.migrationsAllowed) blockers.push('Sync input attempts to allow migrations.')
  if (input.supabaseSyncPolicy?.historicalBackfillAllowed) blockers.push('Sync input attempts to allow historical backfill.')
  if (input.supabaseSyncPolicy?.productRowWritesAllowed) blockers.push('Sync input attempts to allow product row writes.')
  if (input.supabaseSyncPolicy?.publicArtifactAllowed) blockers.push('Sync input attempts to allow public artifacts.')
  if (input.supabaseSyncPolicy?.signedUrlSourceOfTruthAllowed) blockers.push('Sync input attempts to allow signed URL source of truth.')
  if (input.supabaseSyncPolicy?.rawPromptExecutionAllowed) blockers.push('Sync input attempts to allow raw prompt execution.')
  if (input.supabaseSyncPolicy?.productionReadyAllowed || input.supabaseSyncPolicy?.externalBetaAllowed || input.supabaseSyncPolicy?.paidProductionAllowed || input.supabaseSyncPolicy?.broadMediaAllowed) {
    blockers.push('Sync input attempts to unlock production, beta, paid production, or broad media.')
  }

  for (const artifact of input.artifacts) {
    if (!artifact.gcsUri.startsWith('gs://')) blockers.push(`Artifact ${artifact.artifactId} must be a private gs:// reference.`)
    if (/^https?:\/\//i.test(artifact.gcsUri)) blockers.push(`Artifact ${artifact.artifactId} uses an HTTP URL as source of truth.`)
    if (artifact.signedUrlSourceOfTruth) blockers.push(`Artifact ${artifact.artifactId} marks signed URL as source of truth.`)
  }

  for (const gate of input.featureGateUpdates) {
    if (gate.enabled || gate.productionAllowed || gate.externalBetaAllowed || gate.paidProductionAllowed || gate.broadMediaAllowed) {
      blockers.push(`Feature gate ${gate.gateKey} attempts to enable a blocked capability.`)
    }
  }

  const secretPath = findForbiddenValue(input)
  if (secretPath) blockers.push(`Sync input contains a secret-looking or raw-provider value at ${secretPath}.`)
  if (!input.artifacts.length) warnings.push('Sync input has no artifact references.')

  return { ok: blockers.length === 0, blockers, warnings }
}

export function validateActivationMilestoneSyncBundle(bundle: SupabaseMilestoneBundle): ActivationMilestoneSyncValidation {
  const registryValidation = validateSupabaseMilestoneBundle(bundle)
  const blockers = [...registryValidation.blockers]
  const warnings = [...registryValidation.warnings]
  const secretPath = findForbiddenValue(bundle)
  if (secretPath) blockers.push(`Milestone bundle contains a secret-looking or raw-provider value at ${secretPath}.`)
  return { ok: blockers.length === 0, blockers, warnings }
}

function findForbiddenValue(value: unknown, path = '$'): string | undefined {
  if (typeof value === 'string') {
    if (forbiddenTextPatterns.some((pattern) => pattern.test(value))) return path
    if (value.length > 250_000) return `${path} (oversized string)`
    return undefined
  }
  if (!value || typeof value !== 'object') return undefined
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const found = findForbiddenValue(value[index], `${path}[${index}]`)
      if (found) return found
    }
    return undefined
  }
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    const normalizedKey = key.replace(/[^a-z0-9]/gi, '').toLowerCase()
    if (forbiddenKeyPatterns.some((pattern) => pattern.test(normalizedKey)) && typeof nested === 'string' && nested.trim()) return `${path}.${key}`
    const found = findForbiddenValue(nested, `${path}.${key}`)
    if (found) return found
  }
  return undefined
}
