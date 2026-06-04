import { existsSync, readFileSync } from 'node:fs'
import {
  buildTrackBRouteEntries,
  buildTrackBToolRouteReports,
  TRACK_B_ROUTE_STATUSES,
  TRACK_B_TOOL_ROUTE_MANIFEST_EXPECTED_REPORTS,
  TRACK_B_TOOL_ROUTE_MANIFEST_REPORT_DIR,
  TRACK_B_TOOL_ROUTE_MANIFEST_VERSION,
} from '../activation/track-b-tool-route-manifest'
import type { TrackBRouteEntry } from '../activation/track-b-tool-route-manifest/track-b-route-types'
import { TRACK_B_TOOL_IDS } from '../activation/track-b-capability-manifests/track-b-tool-registry'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function requireRoute(toolId: string) {
  const route = routes.find((item) => item.toolId === toolId)
  assert(route, `Missing route: ${toolId}`)
  return route
}

function compareSorted(a: string[], b: string[]): boolean {
  const left = [...a].sort()
  const right = [...b].sort()
  return left.length === right.length && left.every((value, index) => value === right[index])
}

const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> }

for (const script of [
  'activation:track-b-tool-route-manifest:plan',
  'activation:track-b-tool-route-manifest',
  'activation:track-b-tool-route-manifest:report',
  'activation:track-b-tool-route-manifest:summary',
  'activation:track-b-tool-route-manifest:iam-plan',
  'activation:track-b-tool-route-manifest:cost-summary',
  'smoke:activation-track-b-tool-route-manifest',
]) {
  assert(packageJson.scripts?.[script], `Missing package script: ${script}`)
}

const reports = buildTrackBToolRouteReports()
const routes = buildTrackBRouteEntries()
const ids = routes.map((route) => route.toolId)

assert(routes.length === 18, 'Track B route manifest must include exactly 18 routes.')
assert(TRACK_B_TOOL_IDS.length === 18, 'Canonical Track B tool id list must include exactly 18 tools.')
assert(TRACK_B_TOOL_IDS.every((toolId) => ids.includes(toolId)), 'Every canonical Track B tool id must have a route.')
assert(ids.every((toolId) => TRACK_B_TOOL_IDS.includes(toolId)), 'No non-canonical Track B tool id may be routed.')
assert(routes.every((route) => TRACK_B_ROUTE_STATUSES.includes(route.routeStatus)), 'Every route status must use the canonical route vocabulary.')

const requiredFields: Array<keyof TrackBRouteEntry> = [
  'routeId',
  'toolId',
  'family',
  'track',
  'capabilityIds',
  'routeStatus',
  'routeable',
  'routeableReason',
  'initialInternalTestingIncluded',
  'allowedConsumers',
  'blockedConsumers',
  'ownershipBoundary',
  'approvedInputArtifactTypes',
  'blockedInputArtifactTypes',
  'approvedOutputArtifactTypes',
  'blockedOutputArtifactTypes',
  'requiredPlanSnapshotFields',
  'requiredArtifactScopeFields',
  'requiredConfirmations',
  'runtimeAdapterStatus',
  'runtimeExecutionAllowed',
  'routeExecutionAllowed',
  'privateGcsPrefixes',
  'publicOutputAllowed',
  'providerCallsAllowed',
  'broadMediaAllowed',
  'arbitraryMediaAllowed',
  'productionAllowed',
  'externalBetaAllowed',
  'failureBehavior',
  'costCapacityClass',
  'costEstimateSource',
  'prerequisitePhases',
  'evidenceRefs',
  'testCommands',
  'blockedReasons',
  'nextRequiredPhase',
]

for (const route of routes) {
  for (const field of requiredFields) {
    assert(field in route, `Missing route field ${String(field)} for ${route.toolId}`)
  }
}

const enabledRestrictedInternal = routes
  .filter((route) => route.routeStatus === 'route_enabled_restricted_internal')
  .map((route) => route.toolId)
const expectedEnabled = [
  'deepfilternet',
  'signalsmith_stretch',
  'paddleocr',
  'opencv',
  'pyav',
  'pyscenedetect',
  'sharp_libvips',
  'duckdb',
  'polars',
]
assert(compareSorted(enabledRestrictedInternal, expectedEnabled), 'Enabled restricted-internal route set mismatch.')
assert(routes.every((route) => route.runtimeExecutionAllowed === false), 'Phase 44I must not allow runtime execution.')
assert(routes.every((route) => route.routeExecutionAllowed === false), 'Phase 44I must not allow route execution.')
assert(routes.every((route) => route.publicOutputAllowed === false), 'Public output must be blocked for every route.')
assert(routes.every((route) => route.providerCallsAllowed === false), 'Provider calls must be blocked for every route.')
assert(routes.every((route) => route.broadMediaAllowed === false), 'Broad media must be blocked for every route.')
assert(routes.every((route) => route.arbitraryMediaAllowed === false), 'Arbitrary media must be blocked for every route.')
assert(routes.every((route) => route.productionAllowed === false), 'Production must be blocked for every route.')
assert(routes.every((route) => route.externalBetaAllowed === false), 'External beta must be blocked for every route.')

for (const enabledTool of expectedEnabled) {
  const route = requireRoute(enabledTool)
  assert(route.routeable === true, `${enabledTool} should be metadata-routeable for restricted internal planning only.`)
  assert(route.runtimeAdapterStatus === 'metadata_declared_runtime_adapter_not_invoked', `${enabledTool} adapter status mismatch.`)
}

const paddlepaddle = requireRoute('paddlepaddle')
assert(paddlepaddle.routeStatus === 'route_handoff_only', 'PaddlePaddle must be handoff-only.')
assert(paddlepaddle.routeable === false, 'PaddlePaddle must not be directly routeable.')
assert(paddlepaddle.allowedConsumers.includes('paddleocr_runtime_foundation_only'), 'PaddlePaddle dependency boundary missing.')

const routeIntegration = requireRoute('tool_route_manifest_integration')
assert(routeIntegration.routeStatus === 'route_handoff_only', 'Tool route manifest integration must be handoff-only metadata.')
assert(routeIntegration.routeable === false, 'Tool route manifest integration must not be a direct user route.')

const demucs = requireRoute('demucs')
assert(demucs.routeStatus === 'route_disabled_blocked', 'Demucs must remain route-disabled blocked.')
assert(demucs.blockedReasons.includes('blocked_pending_training_data_provenance'), 'Demucs provenance blocker missing.')
assert(demucs.blockedReasons.includes('model_download_disabled'), 'Demucs model download must remain disabled.')
assert(demucs.blockedReasons.includes('source_separation_disabled'), 'Demucs source separation must remain disabled.')

assert(requireRoute('qwen3_vl').routeStatus === 'route_disabled_excluded', 'Qwen3-VL route must be excluded.')
assert(requireRoute('vllm').routeStatus === 'route_disabled_excluded', 'vLLM route must be excluded.')

for (const toolId of ['web_capability_profiler', 'desktop_capability_profiler', 'local_worker_sidecar_planning', 'cost_estimator']) {
  const route = requireRoute(toolId)
  assert(route.routeStatus === 'route_disabled_not_started', `${toolId} must be route-disabled not started.`)
  assert(route.costCapacityClass === 'pending_estimator', `${toolId} must remain pending estimator.`)
}

const sharp = requireRoute('sharp_libvips')
for (const consumer of ['web_search_capture', 'ai_tools_graphics', 'track_a_visual_pipeline', 'media_data_qa']) {
  assert(sharp.allowedConsumers.includes(consumer), `Sharp/libvips consumer boundary missing: ${consumer}`)
}
assert(sharp.ownershipBoundary.includes('Track B owns core runtime hardening'), 'Sharp/libvips Track B ownership boundary missing.')

const manifest = reports.routeManifest as { routeManifestVersion?: string; routes?: TrackBRouteEntry[] }
assert(manifest.routeManifestVersion === TRACK_B_TOOL_ROUTE_MANIFEST_VERSION, 'Route manifest version mismatch.')
assert(manifest.routes?.length === 18, 'Route manifest report must carry all 18 entries.')

const planSnapshotPolicy = reports.planSnapshotPolicy as { requiredFields?: string[]; blockedInputs?: string[]; defaultBooleans?: Record<string, unknown> }
for (const field of ['planSnapshotId', 'toolId', 'approvedCapabilityId', 'sourcePhase', 'routeManifestVersion', 'inputArtifactScopeId', 'outputArtifactScopeId', 'privateGcsPrefix', 'requesterContext', 'confirmationPhase', 'auditReportPath', 'failureBehavior']) {
  assert(planSnapshotPolicy.requiredFields?.includes(field), `Plan snapshot required field missing: ${field}`)
}
assert(planSnapshotPolicy.blockedInputs?.includes('raw_chat_text_direct_worker_invocation'), 'Raw chat execution must be blocked by plan snapshot policy.')
assert(planSnapshotPolicy.defaultBooleans?.publicOutputAllowed === false, 'Plan snapshot policy must block public output.')

const artifactScopePolicy = reports.artifactScopePolicy as {
  privateArtifactsOnly?: boolean
  signedUrlsAsSourceOfTruth?: string
  committedPrivateArtifacts?: string
  families?: Record<string, unknown>
}
assert(artifactScopePolicy.privateArtifactsOnly === true, 'Artifact scope policy must be private-only.')
assert(artifactScopePolicy.signedUrlsAsSourceOfTruth === 'blocked', 'Signed URLs as source of truth must be blocked.')
assert(artifactScopePolicy.committedPrivateArtifacts === 'blocked', 'Committed private payloads must be blocked.')
for (const family of ['audio_timing', 'ocr', 'vlm', 'media_data', 'hybrid_compute']) {
  assert(artifactScopePolicy.families?.[family], `Artifact family policy missing: ${family}`)
}

const consumerPolicy = reports.consumerPolicy as { trackBDoesNotOwn?: string[]; allowedConsumers?: string[]; sharpLibvipsConsumers?: string[] }
assert(consumerPolicy.trackBDoesNotOwn?.includes('Track A visual pipeline'), 'Track A must be consumer-only and not owned by Track B.')
assert(consumerPolicy.allowedConsumers?.includes('internal_qa_planning_services'), 'Internal QA planning consumer missing.')
assert(consumerPolicy.sharpLibvipsConsumers?.includes('track_a_visual_pipeline'), 'Sharp/libvips Track A consumer-only entry missing.')

const failurePolicy = reports.failurePolicy as { rules?: string[] }
for (const rule of [
  'route_resolution_failure_returns_blocked_reason_not_raw_execution',
  'public_output_request_fails_closed',
  'broad_media_request_fails_closed',
  'provider_call_request_fails_closed_unless_explicit_provider_phase_approves',
  'frontend_server_secret_request_fails_closed',
  'vlm_request_fails_closed',
  'demucs_request_fails_closed',
  'route_manifest_version_mismatch_fails_closed',
]) {
  assert(failurePolicy.rules?.includes(rule), `Failure policy missing rule: ${rule}`)
}

const integration = reports.integrationReport as {
  consumedCapabilityManifestBaseline?: boolean
  runtimeExecutionAllowed?: boolean
  routeExecutionAllowed?: boolean
  rawChatExecution?: string
  publicOutput?: string
  providerCalls?: string
  broadMedia?: string
  production?: string
  externalBeta?: string
  trackA?: string
}
assert(integration.consumedCapabilityManifestBaseline === true, 'PR #161 capability manifests must be consumed.')
assert(integration.runtimeExecutionAllowed === false, 'Integration report must keep runtime execution blocked.')
assert(integration.routeExecutionAllowed === false, 'Integration report must keep route execution blocked.')
assert(integration.rawChatExecution === 'blocked', 'Raw chat execution must be blocked.')
assert(integration.publicOutput === 'blocked', 'Public output must be blocked.')
assert(integration.providerCalls === 'blocked', 'Provider calls must be blocked.')
assert(integration.broadMedia === 'blocked', 'Broad media must be blocked.')
assert(integration.production === 'blocked', 'Production must be blocked.')
assert(integration.externalBeta === 'blocked', 'External beta must be blocked.')
assert(integration.trackA === 'not_touched', 'Track A must remain untouched.')

assert(!existsSync('server/workers/track-b-tool-route-manifest'), 'Phase 44I must not add a runtime worker.')
assert(TRACK_B_TOOL_ROUTE_MANIFEST_REPORT_DIR.includes('activation-track-b-tool-route-manifest-reports'), 'Report directory mismatch.')

for (const reportFile of TRACK_B_TOOL_ROUTE_MANIFEST_EXPECTED_REPORTS) {
  assert(reportFile.startsWith('track_b_'), `Unexpected report file name: ${reportFile}`)
}

console.log(JSON.stringify({
  status: 'passed',
  phase: '44I',
  routeCount: routes.length,
  routeManifestVersion: TRACK_B_TOOL_ROUTE_MANIFEST_VERSION,
  enabledRestrictedInternal,
  demucs: 'route_disabled_blocked',
  qwen3Vl: 'route_disabled_excluded',
  vllm: 'route_disabled_excluded',
  hybridProfilerCostRoutes: 'route_disabled_not_started',
  runtimeExecution: 'blocked',
  routeExecution: 'blocked',
  production: 'blocked',
  externalBeta: 'blocked',
  trackA: 'not_touched',
}, null, 2))
