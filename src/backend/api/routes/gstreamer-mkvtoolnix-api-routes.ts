import type { ApiRouteDefinition } from '../api-runtime-contracts'

export const GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_ROUTE_SOURCE_ID =
  'externalBeta.gstreamerMkvtoolnix.narrowAgent.sourceExecutionBoundaryRouteSource' as const

export const GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_ROUTE_PATH =
  '/api/external-beta/gstreamer-mkvtoolnix/narrow-agent/source-execution-boundary' as const

export const GSTREAMER_MKVTOOLNIX_API_ROUTES: ApiRouteDefinition[] = [
  {
    id: GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_ROUTE_SOURCE_ID,
    domain: 'render',
    method: 'POST',
    path: GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_ROUTE_PATH,
    description:
      'Fail-closed backend/service-role-only route metadata for the narrow external-agent GStreamer/MKVToolNix source-execution boundary.',
    securityLevel: 'backend_service_role',
    runtimeMode: 'backend_required',
    status: 'disabled',
    requiresSupabase: true,
    requiresServiceRole: true,
    requiresProviderSecret: false,
    requiresStripeSecret: false,
    futureHandlerName: 'handleGstreamerMkvtoolnixNarrowSourceExecutionBoundary',
    notes: [
      'Registered route metadata only; disabled for runtime execution until a later explicit confirmation-gated handler packet.',
      'Requires approved snapshot, approval record, no-spend/credit policy, idempotency, private/generated fixture manifest, worker envelope, QA, cleanup, and audit refs before any future runtime can be considered.',
      'The mock router returns a backend-required response for this route and does not call a handler.',
      'No route execution, worker dispatch, worker execution, GStreamer execution, MKVToolNix execution, media processing, Supabase mutation, SQL execution, signed/public artifact creation, final delivery, or beta/production unlock is enabled.',
    ],
  },
]
