import type {
  GcpStagingCommandPlan,
  GcpStagingIamBindingPlan,
  GcpStagingPolicyCheck,
  GcpStagingResourceMap,
  GcpStagingSecretPlan,
} from './gcp-staging-types'
import { validateGcpStagingServiceAccountId } from './gcp-staging-config'

export const gcpStagingDoesNotDo = [
  'no deploy in Phase 22',
  'no Docker push',
  'no provider calls',
  'no model downloads',
  'no media processing',
  'no secret payloads',
]

const forbiddenCommandPatterns: Array<{ id: string; pattern: RegExp; summary: string }> = [
  { id: 'cloud-run-deploy', pattern: /\bgcloud\s+run\s+(?:deploy|jobs\s+deploy)\b/i, summary: 'Cloud Run deployment is not allowed in Phase 22.' },
  { id: 'docker-push', pattern: /\bdocker\s+push\b|\bgcloud\s+builds\s+submit\b/i, summary: 'Image push/build is not allowed in Phase 22.' },
  { id: 'provider', pattern: /\b(provider\s+call|runway\s+api\s+request|replicate\s+api\s+request|openai\s+api\s+request|gemini\s+api\s+request|stripe\s+charge)\b/i, summary: 'Provider calls are not allowed in Phase 22.' },
  { id: 'model-download', pattern: /huggingface-cli|snapshot_download|from_pretrained|download\s+model|model\s+download/i, summary: 'Model downloads are not allowed in Phase 22.' },
  { id: 'media', pattern: /\/uploads\/|user[-_\s]?media|\.mp4\b|\.mov\b|\.mkv\b|\.wav\b/i, summary: 'Media processing is not allowed in Phase 22.' },
  { id: 'secret-payload', pattern: /versions\s+add|--data-file|SECRET_VALUE|REAL_SECRET|paste secret/i, summary: 'Secret payloads are not allowed in Phase 22.' },
  { id: 'owner-editor', pattern: /roles\/(?:owner|editor)\b/i, summary: 'Owner/editor roles are forbidden.' },
  { id: 'public-principal', pattern: /allUsers|allAuthenticatedUsers/i, summary: 'Public IAM principals are forbidden.' },
  { id: 'revideo', pattern: /revideo/i, summary: 'Revideo must not appear as a staging cloud resource.' },
]

const secretValuePatterns = /\bsk-[A-Za-z0-9_-]{12,}|AIza[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9_]{20,}|xox[baprs]-|-----BEGIN|secretValue|secret_value/i

export function validateGcpStagingResourceMap(resourceMap: GcpStagingResourceMap): GcpStagingPolicyCheck {
  const blockers: string[] = []
  const warnings: string[] = []

  if (!resourceMap.artifactRegistry.repository) blockers.push('Artifact Registry repository is missing.')
  if (!resourceMap.artifactRegistry.repository.includes('staging')) blockers.push('Artifact Registry repository must include staging.')
  if (resourceMap.buckets.length !== 10) blockers.push('Staging resource map must include all 10 bucket purposes.')

  for (const bucket of resourceMap.buckets) {
    if (!bucket.bucketName.includes('staging')) blockers.push(`${bucket.bucketName} must include staging.`)
    if (/public/i.test(bucket.bucketName)) blockers.push(`${bucket.bucketName} looks public.`)
    if (!bucket.privateByDefault) blockers.push(`${bucket.bucketName} must be private by default.`)
    if (!bucket.uniformBucketLevelAccess) blockers.push(`${bucket.bucketName} must use uniform bucket-level access.`)
    if (!bucket.publicAccessPrevention) blockers.push(`${bucket.bucketName} must enforce public access prevention.`)
    if (bucket.signedUrlPersistenceAllowed) blockers.push(`${bucket.bucketName} must not allow signed URL persistence.`)
  }

  for (const serviceAccount of resourceMap.serviceAccounts) {
    blockers.push(...validateGcpStagingServiceAccountId(serviceAccount.accountId, `${serviceAccount.key} service account`))
  }

  for (const secret of resourceMap.secretPlaceholders) {
    const secretCheck = validateGcpStagingSecretPlan([secret])
    blockers.push(...secretCheck.blockers)
    warnings.push(...secretCheck.warnings)
  }

  const serialized = JSON.stringify(resourceMap)
  if (/revideo/i.test(serialized)) blockers.push('Revideo appears as a staging cloud resource.')
  if (/production/i.test(serialized)) blockers.push('Production naming appears in staging resource map.')

  return { allowed: blockers.length === 0, blockers, warnings }
}

export function validateGcpStagingIamPlan(iamPlan: GcpStagingIamBindingPlan[]): GcpStagingPolicyCheck {
  const blockers: string[] = []

  for (const binding of iamPlan) {
    if (/roles\/(?:owner|editor)\b/i.test(binding.role)) blockers.push(`${binding.serviceAccountKey} has forbidden role ${binding.role}.`)
    if (/allUsers|allAuthenticatedUsers/i.test(binding.resource)) blockers.push(`${binding.serviceAccountKey} uses a public principal/resource.`)
    if (binding.publicPrincipal) blockers.push(`${binding.serviceAccountKey} binding is public.`)
    if (binding.broadAccess) blockers.push(`${binding.serviceAccountKey} binding is broad access.`)
    if (binding.scope === 'project' && /roles\/storage\.admin/i.test(binding.role)) {
      blockers.push(`${binding.serviceAccountKey} has broad project-wide storage admin.`)
    }
  }

  return { allowed: blockers.length === 0, blockers, warnings: [] }
}

export function validateGcpStagingSecretPlan(secretPlan: GcpStagingSecretPlan[]): GcpStagingPolicyCheck {
  const blockers: string[] = []

  for (const secret of secretPlan) {
    if (!secret.placeholderOnly) blockers.push(`${secret.name} must be placeholder-only.`)
    if (secret.payloadCreated) blockers.push(`${secret.name} must not create a payload in Phase 22.`)
    if (secretValuePatterns.test(JSON.stringify(secret))) blockers.push(`${secret.name} contains secret-looking text.`)
  }

  return { allowed: blockers.length === 0, blockers, warnings: [] }
}

export function validateGcpStagingCommandPlan(commandPlans: GcpStagingCommandPlan[]): GcpStagingPolicyCheck {
  const blockers: string[] = []
  const warnings: string[] = []

  for (const plan of commandPlans) {
    const mutating = !['print_config', 'image_names', 'later_runtime'].includes(plan.phase)
    if (mutating && !plan.requiresConfirmation) {
      blockers.push(`${plan.commandId} mutating command must require confirmation.`)
    }
    if (mutating && !plan.requiredEnvVars.includes('REEDITPRO_CONFIRM_STAGING_GCP_SETUP=true')) {
      blockers.push(`${plan.commandId} must require REEDITPRO_CONFIRM_STAGING_GCP_SETUP=true.`)
    }
    for (const boundary of gcpStagingDoesNotDo) {
      if (!plan.doesNotDo.includes(boundary)) blockers.push(`${plan.commandId} missing boundary: ${boundary}.`)
    }
    for (const forbidden of forbiddenCommandPatterns) {
      if (forbidden.pattern.test(plan.commandString)) blockers.push(`${plan.commandId}:${forbidden.id}: ${forbidden.summary}`)
    }
    if (plan.phase === 'later_runtime') {
      warnings.push(`${plan.commandId} is intentionally blocked until Phase 24/27.`)
    }
  }

  return { allowed: blockers.length === 0, blockers, warnings }
}

export function validateGcpStagingEnvExampleText(text: string): GcpStagingPolicyCheck {
  const blockers: string[] = []

  if (!text.includes('REEDITPRO_ENV=staging')) blockers.push('Staging env example must set REEDITPRO_ENV=staging.')
  if (text.includes('REEDITPRO_CONFIRM_STAGING_GCP_SETUP=true')) blockers.push('Staging env example must not enable confirmation.')
  if (secretValuePatterns.test(text)) blockers.push('Staging env example contains secret-looking text.')

  return { allowed: blockers.length === 0, blockers, warnings: [] }
}
