import { TOOL_ROUTE_DRY_RUN_OWNER_IDS } from './tool-route-dry-run-planning-policy'
import type {
  ToolRouteDryRunOwner,
  ToolRouteFamilyDryRunPlan,
  ToolRouteOwnerRoutePlan,
  ToolRouteOwnerRoutePlanMap,
} from './tool-route-dry-run-planning-types'

const OWNER_RESPONSIBILITIES: Record<ToolRouteDryRunOwner, string[]> = {
  WEB_SEARCH_CAPTURE: [
    'Review sanitized source/capture/extraction manifest requirements.',
    'Keep broad crawling, arbitrary capture, and raw search responses blocked.',
  ],
  MAP_GEOSPATIAL: [
    'Review GeoJSON/style/camera/timing/render manifest handoff boundaries.',
    'Keep live tiles, live geocoding, live routing, and public map delivery blocked.',
  ],
  AI_TOOLS_CREATIVE_GRAPHICS: [
    'Review chart/card/graphics manifest routing for controlled visual tools.',
    'Keep graphics rendering, rasterization, and public artifact delivery blocked.',
  ],
  TRACK_A_RENDER_EXPORT: [
    'Review render/export manifest intake from owner routes.',
    'Keep preview, final render, final export, and signed URL delivery blocked.',
  ],
  TRACK_B_MEDIA_PROCESSING: [
    'Review media analysis manifest fields and derivative-planning boundaries.',
    'Keep FFmpeg, OCR, OpenCV, PyAV, VLM, and media processing blocked.',
  ],
  SOUND_MUSIC_AUDIO: [
    'Review timing-aware cue manifest fields and audio-owner handoff boundaries.',
    'Keep audio, SFX, music generation, DeepFilterNet, and Demucs blocked.',
  ],
  WORKER_RUNTIME_JOBS: [
    'Review future worker dry-run job envelopes and idempotency/lease requirements.',
    'Keep real claim, lease, worker execution, and service-role mutation blocked.',
  ],
  PROVIDER_GATEWAY_MODELS: [
    'Review provider planning manifests and policy-only provider evidence.',
    'Keep model calls, provider chaining, and provider secrets blocked.',
  ],
  SUPABASE_RLS_STORAGE_DATABASE: [
    'Review metadata/storage placeholder needs for future phases.',
    'Keep Supabase mutation, SQL, migrations, schema/RLS changes, and GCS transfer blocked.',
  ],
  OBSERVABILITY_AUDIT_COST: [
    'Review audit event, cost placeholder, and traceability fields.',
    'Keep paid production calls, credit mutation, and telemetry sink writes blocked.',
  ],
  COMPLIANCE_SECURITY: [
    'Review privacy, source-of-truth, signed URL, and public artifact blockers.',
    'Keep raw prompts, raw provider/search responses, secrets, and public access blocked.',
  ],
  FRONTEND_PRODUCT_UX: [
    'Review future UX route status and copy boundaries.',
    'Keep runtime-ready claims and beta/production unlock claims blocked.',
  ],
  BILLING_STRIPE_CREDITS: [
    'Review future credit estimate and billing-placeholder fields.',
    'Keep credit ledger writes, Stripe checkout, webhooks, and payments blocked.',
  ],
}

function sourceContractsFor(owner: ToolRouteDryRunOwner, familyPlan: ToolRouteFamilyDryRunPlan): string[] {
  return familyPlan.families
    .filter((family) => family.owner === owner)
    .flatMap((family) => family.sourceContracts)
    .filter((value, index, list) => list.indexOf(value) === index)
}

export function buildToolRouteOwnerRoutePlan(
  familyPlan: ToolRouteFamilyDryRunPlan,
): ToolRouteOwnerRoutePlanMap {
  const ownerRoutes: ToolRouteOwnerRoutePlan[] = TOOL_ROUTE_DRY_RUN_OWNER_IDS.map((owner) => {
    const ownerFamilies = familyPlan.families.filter((family) => family.owner === owner)
    return {
      owner,
      familyIds: ownerFamilies.map((family) => family.familyId),
      sourceContracts: sourceContractsFor(owner, familyPlan),
      routeResponsibilities: OWNER_RESPONSIBILITIES[owner],
      reviewOnly: true,
      ownerApprovalRequired: true,
      runtimeReady: false,
      executionAuthorized: false,
      nextAction: 'Review TOOL-ROUTE-1 dry-run plan and carry approved fixture-only scope into TOOL-ROUTE-2.',
    }
  })

  const activeBlockers = [
    ...familyPlan.activeBlockers,
    ...ownerRoutes
      .filter((route) => route.familyIds.length === 0 && route.owner !== 'COMPLIANCE_SECURITY')
      .map((route) => `missing_owner_route_family:${route.owner}`),
    ...TOOL_ROUTE_DRY_RUN_OWNER_IDS
      .filter((owner) => !ownerRoutes.some((route) => route.owner === owner))
      .map((owner) => `missing_owner_route:${owner}`),
  ]

  return {
    phase: 'TOOL_ROUTE_1',
    status: activeBlockers.length > 0 ? 'blocked' : 'passed',
    ownerRoutes,
    ownerRouteCount: ownerRoutes.length,
    allRequiredOwnersMapped: activeBlockers.length === 0,
    activeBlockers,
  }
}
