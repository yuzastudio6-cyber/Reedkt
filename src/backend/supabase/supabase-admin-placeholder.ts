export function getSupabaseAdminClientPlaceholder(): never {
  throw new Error(
    'Supabase admin access is backend-only. Never expose SUPABASE_SERVICE_ROLE_KEY to the Vite frontend; configure it later in Cloud Run or another secure server runtime.',
  )
}

export const SUPABASE_ADMIN_RUNTIME_RULES = [
  'Service role keys must never be bundled into frontend code.',
  'Future backend workers should use the reeditpro Supabase project only.',
  'Provider keys belong in Secret Manager or secure runtime configuration, not source control.',
] as const
