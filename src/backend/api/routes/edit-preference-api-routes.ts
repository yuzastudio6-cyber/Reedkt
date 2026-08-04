import type { ApiRouteDefinition } from '../api-runtime-contracts'

export const EDIT_PREFERENCE_API_ROUTES: ApiRouteDefinition[] = [
  {
    id: 'editPreferences.getCurrent',
    domain: 'auth',
    method: 'GET',
    path: '/v1/workspaces/:workspaceId/edit-preferences/current',
    description: 'Read the authenticated user edit defaults for one verified workspace.',
    securityLevel: 'workspace_member',
    runtimeMode: 'frontend_safe',
    status: 'frontend_safe_ready',
    requiresSupabase: true,
    requiresServiceRole: false,
    requiresProviderSecret: false,
    requiresStripeSecret: false,
    futureHandlerName: 'getCurrentEditPreferences',
    notes: [
      'The current handler verifies a real bearer identity and server-side workspace membership, then reads private single-host internal-test storage only.',
      'It does not claim Supabase preference persistence, RLS validation, cross-device sync, staging, external beta, or production readiness.',
    ],
  },
  {
    id: 'editPreferences.upsertCurrent',
    domain: 'auth',
    method: 'PUT',
    path: '/v1/workspaces/:workspaceId/edit-preferences/current',
    description: 'Save the authenticated user edit defaults for one verified workspace.',
    securityLevel: 'workspace_editor',
    runtimeMode: 'frontend_safe',
    status: 'frontend_safe_ready',
    requiresSupabase: true,
    requiresServiceRole: false,
    requiresProviderSecret: false,
    requiresStripeSecret: false,
    futureHandlerName: 'upsertCurrentEditPreferences',
    notes: [
      'The current handler requires idempotency, optimistic snapshot matching, a real bearer identity, and server-side workspace editor membership.',
      'The saved record remains mock-only private single-host internal-test persistence; no Supabase preference row or production account mutation occurs.',
    ],
  },
]
