import type { ApiRouteDefinition } from '../api-runtime-contracts'
import { GPAC_MP4BOX_GUARDED_SERVICE_ROLE_ROUTE_ID, GPAC_MP4BOX_GUARDED_SERVICE_ROLE_ROUTE_PATH } from '../../contracts/gpac-mp4box-guarded-service-role-route-mock-contracts'

export const GPAC_MP4BOX_API_ROUTES: ApiRouteDefinition[] = [
  {
    id: GPAC_MP4BOX_GUARDED_SERVICE_ROLE_ROUTE_ID,
    domain: 'render',
    method: 'POST',
    path: GPAC_MP4BOX_GUARDED_SERVICE_ROLE_ROUTE_PATH,
    description: 'Guarded backend/service-role-only GPAC/MP4Box package validation route mock interface.',
    securityLevel: 'backend_service_role',
    runtimeMode: 'backend_required',
    status: 'disabled',
    requiresSupabase: true,
    requiresServiceRole: true,
    requiresProviderSecret: false,
    requiresStripeSecret: false,
    futureHandlerName: 'createGpacMp4boxPackageValidationJob',
    notes: [
      'Registered route metadata only; disabled for runtime execution until a later explicit confirmation-gated packet.',
      'Requires approved snapshot, approval record, credit reservation, job, worker lease, private manifests, checksum, QA, cleanup, audit, idempotency, and command-template refs.',
      'No worker execution, GPAC/MP4Box execution, media processing, storage transfer, Supabase mutation, SQL execution, signed/public artifact creation, or beta/production unlock is enabled.',
    ],
  },
]
