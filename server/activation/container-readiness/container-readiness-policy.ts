import type { ContainerReadinessCommandPlan } from './container-readiness-types'

export interface ContainerReadinessPolicyCheck {
  allowed: boolean
  blockers: string[]
  warnings: string[]
}

export const containerReadinessDoesNotDo = [
  'no media processing',
  'no model downloads',
  'no provider calls',
  'no gcloud',
  'no deployment',
  'no secrets',
]

const forbiddenCommandPlanPatterns: Array<{ id: string; pattern: RegExp; summary: string }> = [
  { id: 'docker-build', pattern: /\bdocker\s+build\b/i, summary: 'Phase 21 readiness plans must not build images.' },
  { id: 'docker-push', pattern: /\bdocker\s+push\b/i, summary: 'Phase 21 readiness plans must not push images.' },
  { id: 'docker-compose', pattern: /\bdocker\s+compose\b|\bdocker-compose\b/i, summary: 'Phase 21 readiness plans must not run compose stacks.' },
  { id: 'gcloud', pattern: /\bgcloud\b/i, summary: 'Phase 21 readiness plans must not run gcloud.' },
  { id: 'deploy', pattern: /\bcloud\s+run\b|\bdeploy\b/i, summary: 'Phase 21 readiness plans must not deploy.' },
  { id: 'provider', pattern: /\b(provider\s+call|stripe|runway|replicate|openai|gemini)\b/i, summary: 'Phase 21 readiness plans must not call providers.' },
  { id: 'model-download', pattern: /huggingface-cli|snapshot_download|from_pretrained|download\s+model|model\s+download/i, summary: 'Phase 21 readiness plans must not download model weights.' },
  { id: 'secret', pattern: /\bsk-[A-Za-z0-9_-]{12,}|AIza[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9_]{20,}|service[_-]?role|secret\s+value|-----BEGIN/i, summary: 'Phase 21 readiness plans must not include secrets.' },
  { id: 'media-mount', pattern: /\/uploads\/|user[-_\s]?media|\.mp4\b|\.mov\b|\.mkv\b|\.wav\b/i, summary: 'Phase 21 readiness plans must not mount or process user media.' },
]

export const forbiddenReadinessLogPatterns: Array<{ id: string; pattern: RegExp; summary: string }> = [
  { id: 'signed-url', pattern: /signedUrl|signed_url|X-Goog-Signature|X-Amz-Signature/i, summary: 'Signed URL text detected in readiness evidence.' },
  { id: 'raw-prompt', pattern: /rawPrompt|raw_prompt/i, summary: 'Raw prompt text detected in readiness evidence.' },
  { id: 'provider-api-key', pattern: /providerApiKey|provider_api_key/i, summary: 'Provider API key field detected in readiness evidence.' },
  { id: 'service-role-key', pattern: /serviceRoleKey|service_role_key|service[_-]?role/i, summary: 'Service-role key text detected in readiness evidence.' },
  { id: 'secret-value', pattern: /secretValue|secret_value|\bsk-[A-Za-z0-9_-]{12,}|AIza[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9_]{20,}|-----BEGIN/i, summary: 'Secret-like value detected in readiness evidence.' },
  { id: 'model-download', pattern: /model download|Downloading model|huggingface-cli|snapshot_download|from_pretrained/i, summary: 'Model download signal detected in readiness evidence.' },
  { id: 'gcloud-deploy', pattern: /gcloud run deploy|\bgcloud\b|\bcloud\s+run\b|\bdeploy\b/i, summary: 'gcloud/deploy signal detected in readiness evidence.' },
  { id: 'docker-push', pattern: /\bdocker\s+push\b/i, summary: 'Docker push signal detected in readiness evidence.' },
  { id: 'revideo-production', pattern: /Revideo production|revideo.*production/i, summary: 'Revideo production path detected in readiness evidence.' },
  { id: 'public-bucket', pattern: /public bucket|public-read|allUsers/i, summary: 'Public bucket signal detected in readiness evidence.' },
  { id: 'user-media-mounted', pattern: /user media mounted|\/uploads\/|\/source-media\/|\.mp4\b|\.mov\b|\.mkv\b|\.wav\b/i, summary: 'User media mount or processing signal detected in readiness evidence.' },
  { id: 'provider-call', pattern: /\b(provider\s+call|stripe|runway|replicate|openai|gemini)\b/i, summary: 'Provider call signal detected in readiness evidence.' },
]

export function validateContainerReadinessCommandPlan(
  plan: ContainerReadinessCommandPlan,
): ContainerReadinessPolicyCheck {
  const blockers: string[] = []
  const warnings: string[] = []

  if (!plan.safeToRunManually) blockers.push(`${plan.commandId} must be marked manual-run safe.`)
  if (!plan.requiresHumanConfirmation) blockers.push(`${plan.commandId} must require human confirmation.`)
  if (plan.confirmationEnvVar !== 'REEDITPRO_CONFIRM_CONTAINER_READINESS') {
    blockers.push(`${plan.commandId} must use REEDITPRO_CONFIRM_CONTAINER_READINESS.`)
  }
  if (!plan.requiredEnvVars.includes('REEDITPRO_CONFIRM_CONTAINER_READINESS=true')) {
    blockers.push(`${plan.commandId} must require REEDITPRO_CONFIRM_CONTAINER_READINESS=true.`)
  }

  for (const expectedBoundary of containerReadinessDoesNotDo) {
    if (!plan.doesNotDo.includes(expectedBoundary)) {
      blockers.push(`${plan.commandId} must declare boundary: ${expectedBoundary}.`)
    }
  }

  for (const forbidden of forbiddenCommandPlanPatterns) {
    if (forbidden.pattern.test(plan.commandString)) {
      blockers.push(`${forbidden.id}: ${forbidden.summary}`)
    }
  }

  if (/\bdocker\s+run\b/i.test(plan.commandString)) {
    warnings.push(`${plan.commandId} is human-run Docker readiness text only; Codex must not execute it.`)
  }

  return { allowed: blockers.length === 0, blockers, warnings }
}

export function validateContainerReadinessLogText(logText: string): ContainerReadinessPolicyCheck {
  const blockers = forbiddenReadinessLogPatterns
    .filter((forbidden) => forbidden.pattern.test(logText))
    .map((forbidden) => `${forbidden.id}: ${forbidden.summary}`)

  return { allowed: blockers.length === 0, blockers, warnings: [] }
}

export function assertContainerReadinessLaunchFlagsBlocked(input: {
  productionReadyAllowed: boolean
  externalBetaAllowed: boolean
  realUserMediaTestingAllowed: boolean
}): ContainerReadinessPolicyCheck {
  const blockers: string[] = []

  if (input.productionReadyAllowed) blockers.push('Production readiness must remain blocked in Phase 21.')
  if (input.externalBetaAllowed) blockers.push('External beta must remain blocked in Phase 21.')
  if (input.realUserMediaTestingAllowed) blockers.push('Real user media testing must remain blocked in Phase 21.')

  return { allowed: blockers.length === 0, blockers, warnings: [] }
}
