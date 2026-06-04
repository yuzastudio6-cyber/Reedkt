import type { WebCapabilityProfile } from './webCapabilityProfileTypes'

export const WEB_CAPABILITY_ROUTE_HINTS = [
  'prefer_server_worker',
  'browser_preview_metadata_possible',
  'browser_image_metadata_possible',
  'webgpu_present_but_unapproved',
  'webcodecs_present_but_media_processing_blocked',
  'low_storage_avoid_browser_processing',
  'cross_origin_isolation_required_for_threads',
  'unknown_capability_fail_closed',
  'browser_can_assist_preview_metadata',
  'web_media_preview_possible',
  'gpu_compute_unavailable',
  'server_worker_preferred',
  'avoid_browser_heavy_processing',
] as const

export function buildWebCapabilityRouteHandoff(profile: WebCapabilityProfile) {
  return {
    profileSchemaVersion: profile.schemaVersion,
    routeManifestVersion: profile.capabilityBuckets.policy.routeManifestVersion,
    routePlanningHints: profile.routePlanningHints,
    routeExecutionAllowed: false,
    workerExecutionAllowed: false,
    costEstimatorComplete: false,
    desktopProfilerComplete: false,
    browserProfilingCanOverrideBlockedRoutes: false,
    vlm: 'excluded',
    demucs: 'blocked',
    broadMedia: 'blocked',
    publicArtifacts: 'blocked',
    providerCalls: 'blocked',
  }
}
