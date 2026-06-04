import { existsSync, readFileSync } from 'node:fs'
import {
  buildTrackBCapabilityReports,
  TRACK_B_CAPABILITY_MANIFEST_EXPECTED_REPORTS,
  TRACK_B_CAPABILITY_MANIFEST_REPORT_DIR,
} from '../activation/track-b-capability-manifests'
import {
  TRACK_B_CAPABILITY_MANIFESTS,
  TRACK_B_CAPABILITY_STATUSES,
  TRACK_B_TOOL_IDS,
} from '../activation/track-b-capability-manifests/track-b-tool-registry'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function requireManifest(toolId: string) {
  const manifest = manifests.find((item) => item.toolId === toolId)
  assert(manifest, `Missing manifest: ${toolId}`)
  return manifest
}

const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> }

for (const script of [
  'activation:track-b-capability-manifests:plan',
  'activation:track-b-capability-manifests',
  'activation:track-b-capability-manifests:report',
  'activation:track-b-capability-manifests:summary',
  'activation:track-b-capability-manifests:iam-plan',
  'activation:track-b-capability-manifests:cost-summary',
  'smoke:activation-track-b-capability-manifests',
]) {
  assert(packageJson.scripts?.[script], `Missing package script: ${script}`)
}

const reports = buildTrackBCapabilityReports()
const manifests = TRACK_B_CAPABILITY_MANIFESTS
const ids = manifests.map((manifest) => manifest.toolId)

assert(manifests.length === 18, 'Track B manifest must include exactly 18 tools.')
assert(TRACK_B_TOOL_IDS.length === 18, 'Canonical Track B tool id list must include exactly 18 tools.')
assert(TRACK_B_TOOL_IDS.every((toolId) => ids.includes(toolId)), 'Every canonical Track B tool id must have a manifest.')
assert(ids.every((toolId) => TRACK_B_TOOL_IDS.includes(toolId)), 'No non-canonical Track B tool id may be present.')
assert(manifests.every((manifest) => TRACK_B_CAPABILITY_STATUSES.includes(manifest.status)), 'Every status must use the canonical Track B status vocabulary.')

const included = manifests.filter((manifest) => manifest.initialInternalTestingGroup === 'included').map((manifest) => manifest.toolId).sort()
assert(JSON.stringify(included) === JSON.stringify([
  'deepfilternet',
  'duckdb',
  'opencv',
  'paddleocr',
  'paddlepaddle',
  'polars',
  'pyav',
  'pyscenedetect',
  'sharp_libvips',
  'signalsmith_stretch',
].sort()), 'Included restricted internal testing set mismatch.')

for (const blockedTool of ['demucs', 'qwen3_vl', 'vllm']) {
  const manifest = requireManifest(blockedTool)
  assert(manifest.initialInternalTestingGroup === 'excluded', `${blockedTool} must be excluded from initial internal testing.`)
  assert(manifest.restrictedInternalTestingEligible === false, `${blockedTool} must not be restricted-internal eligible.`)
}

assert(requireManifest('demucs').status === 'blocked_pending_training_data_provenance', 'Demucs must remain blocked pending training-data provenance.')
assert(requireManifest('qwen3_vl').status === 'excluded_for_initial_internal_testing', 'Qwen3-VL must be excluded.')
assert(requireManifest('vllm').status === 'excluded_for_initial_internal_testing', 'vLLM must be excluded.')

for (const notStarted of ['web_capability_profiler', 'desktop_capability_profiler', 'local_worker_sidecar_planning', 'cost_estimator', 'tool_route_manifest_integration']) {
  assert(requireManifest(notStarted).status === 'not_started', `${notStarted} must be not_started.`)
}

const initialManifest = reports.initialInternalTestingManifest as {
  compositeExclusions?: Array<{ id?: string; tools?: string[] }>
}
assert(initialManifest.compositeExclusions?.some((entry) => entry.id === 'qwen_vlm_vllm'
  && entry.tools?.includes('qwen3_vl')
  && entry.tools.includes('vllm')), 'Composite qwen_vlm_vllm exclusion must be present.')

const sharp = requireManifest('sharp_libvips')
assert(sharp.ownerBoundary.includes('Track B owns core runtime hardening'), 'Sharp/libvips ownership boundary missing.')
assert(sharp.consumerBoundaries.some((boundary) => boundary.includes('Track A visual pipeline')), 'Sharp/libvips Track A consumer-only boundary missing.')

const routeHandoff = reports.routeHandoff as {
  routeIntegrationStatus?: string
  rawChatExecution?: string
  approvedPlanSnapshotsRequired?: boolean
  artifactScopeRequired?: boolean
}
assert(routeHandoff.routeIntegrationStatus === 'phase_44i_required', 'Actual route integration must remain pending.')
assert(routeHandoff.rawChatExecution === 'blocked', 'Raw chat execution must remain blocked.')
assert(routeHandoff.approvedPlanSnapshotsRequired === true, 'Approved plan snapshots must be required.')
assert(routeHandoff.artifactScopeRequired === true, 'Artifact scopes must be required.')

const blocked = reports.blockedCapabilities as {
  globallyBlockedScopes?: string[]
  demucsRuntimeDisabled?: boolean
  vlmRuntimeRetriesBlocked?: boolean
  productionBetaBroadMediaBlocked?: boolean
}
for (const scope of ['production', 'external beta', 'broad media', 'public artifacts', 'provider calls', 'Track A runtime/visual/render stack']) {
  assert(blocked.globallyBlockedScopes?.includes(scope), `Global blocked scope missing: ${scope}`)
}
assert(blocked.demucsRuntimeDisabled === true, 'Demucs runtime-disabled policy missing.')
assert(blocked.vlmRuntimeRetriesBlocked === true, 'VLM runtime retries must be blocked.')
assert(blocked.productionBetaBroadMediaBlocked === true, 'Production/beta/broad-media block missing.')

const boundaries = reports.consumerBoundaries as { frontendServiceRoleSecrets?: string; heavyNativeFrontendImports?: string }
assert(boundaries.frontendServiceRoleSecrets === 'blocked', 'Frontend service-role secrets must be blocked.')
assert(boundaries.heavyNativeFrontendImports === 'blocked', 'Heavy native frontend imports must be blocked.')
assert(!existsSync('server/workers/track-b-capability-manifests'), 'Track B manifest baseline must not add a runtime worker.')
assert(TRACK_B_CAPABILITY_MANIFEST_REPORT_DIR.includes('activation-track-b-capability-manifests-reports'), 'Report directory mismatch.')

for (const reportFile of TRACK_B_CAPABILITY_MANIFEST_EXPECTED_REPORTS) {
  assert(reportFile.startsWith('track_b_'), `Unexpected report file name: ${reportFile}`)
}

console.log(JSON.stringify({
  status: 'passed',
  phase: '44I-A',
  toolCount: manifests.length,
  includedRestrictedInternalReady: included,
  demucs: 'blocked_pending_training_data_provenance',
  qwenVlmVllm: 'excluded_for_initial_internal_testing',
  routeIntegration: 'pending_phase_44i',
  production: 'blocked',
  externalBeta: 'blocked',
  trackA: 'not_touched',
}, null, 2))
