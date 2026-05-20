// Backend-only placeholder. Do not implement service-role access in Vite or any
// browser bundle. A real admin client belongs in a secure server/worker runtime.
export function assertBackendRuntimeOnly(): never {
  throw new Error(
    'Supabase admin access is unavailable in the Vite app. Service-role access must run only in a secure backend/server/worker runtime.',
  )
}

export function getSupabaseAdminClientUnavailable(): never {
  return assertBackendRuntimeOnly()
}

export function getSupabaseAdminClientPlaceholder(): never {
  return assertBackendRuntimeOnly()
}

export const SUPABASE_ADMIN_RUNTIME_RULES = [
  'Service role keys must never be bundled into frontend code.',
  'Vite/browser modules may read only VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
  'Future backend workers should use the reeditpro Supabase project only.',
  'Provider keys belong in Secret Manager or secure runtime configuration, not source control.',
] as const
