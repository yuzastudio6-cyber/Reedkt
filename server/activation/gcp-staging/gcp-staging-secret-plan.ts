import type { GcpStagingSecretPlan } from './gcp-staging-types'

export function buildGcpStagingSecretPlan(): GcpStagingSecretPlan[] {
  return [
    requiredSecret('SUPABASE_URL', 'Backend runtime Supabase URL placeholder only.'),
    requiredSecret('SUPABASE_SERVICE_ROLE_KEY', 'Service-role placeholder only; never expose to frontend.'),
    requiredSecret('OPENAI_API_KEY', 'Provider key placeholder only; provider calls remain blocked in Phase 22.'),
    requiredSecret('PROVIDER_GATEWAY_SHARED_SECRET', 'Internal gateway auth placeholder only.'),
    requiredSecret('WORKER_WEBHOOK_SECRET', 'Worker webhook signing placeholder only.'),
    laterSecret('STRIPE_SECRET_KEY', 'Billing placeholder only if the existing app uses Stripe.'),
    laterSecret('SFX_PROVIDER_API_KEY', 'Future SFX provider placeholder only.'),
    laterSecret('MUSIC_PROVIDER_API_KEY', 'Future music provider placeholder only.'),
    laterSecret('MODEL_WEIGHT_ACCESS_TOKEN', 'Future model-weight access placeholder only.'),
    laterSecret('HUGGINGFACE_TOKEN', 'Future model download token placeholder only if later approval requires it.'),
  ]
}

function requiredSecret(name: string, note: string): GcpStagingSecretPlan {
  return {
    name,
    placeholderOnly: true,
    requiredBeforeDeploy: true,
    requiredLater: false,
    payloadCreated: false,
    notes: [
      note,
      'Phase 22 creates names only; no versions, payloads, or secret values are stored.',
    ],
  }
}

function laterSecret(name: string, note: string): GcpStagingSecretPlan {
  return {
    name,
    placeholderOnly: true,
    requiredBeforeDeploy: false,
    requiredLater: true,
    payloadCreated: false,
    notes: [
      note,
      'Grant access only to service identities that need it after later approval.',
    ],
  }
}
