import type {
  ToolCapabilityRecord,
  ToolCapabilityRegistryStatus,
  ToolCapabilityRegistrySummary,
  ToolCapabilityTrack,
  ToolCapabilityEvidenceRef,
} from './tool-capability-registry-types'

type CapabilityDraft = Omit<
  ToolCapabilityRecord,
  | 'manifestVersion'
  | 'productionReady'
  | 'runtimeExecutionAllowed'
  | 'frontendExecutionAllowed'
  | 'providerCallAllowed'
  | 'publicArtifactAllowed'
  | 'signedUrlSourceOfTruthAllowed'
  | 'rawPromptExecutionAllowed'
  | 'artifactPolicy'
  | 'privacyConstraints'
  | 'costConstraints'
  | 'failureModes'
  | 'blockedUses'
  | 'allowedConsumers'
  | 'testCommands'
  | 'supabaseMilestoneRefs'
  | 'notes'
> & Partial<Pick<
  ToolCapabilityRecord,
  'artifactPolicy' | 'privacyConstraints' | 'costConstraints' | 'failureModes' | 'blockedUses' | 'allowedConsumers' | 'testCommands' | 'supabaseMilestoneRefs' | 'notes'
>>

const commonBlockedUses = [
  'production execution',
  'external beta execution',
  'paid production execution',
  'broad media execution',
  'raw prompt execution',
  'public artifacts as source of truth',
  'signed URLs as source of truth',
]

function evidence(phaseId: string, runId: string, reference: string, evidenceType: ToolCapabilityEvidenceRef['evidenceType'] = 'committed_doc'): ToolCapabilityEvidenceRef {
  return { phaseId, runId, reference, evidenceType }
}

function record(input: CapabilityDraft): ToolCapabilityRecord {
  return {
    manifestVersion: 'phase52b_tool_capability_registry_v1',
    productionReady: false,
    runtimeExecutionAllowed: false,
    frontendExecutionAllowed: false,
    providerCallAllowed: false,
    publicArtifactAllowed: false,
    signedUrlSourceOfTruthAllowed: false,
    rawPromptExecutionAllowed: false,
    artifactPolicy: input.artifactPolicy ?? {
      privateGcsOnly: true,
      sourceOfTruth: ['structured manifest metadata', 'private gs:// artifact references'],
      reviewArtifactsOnly: ['screenshots', 'previews', 'local QA captures'],
      publicArtifactsAllowed: false,
      signedUrlsAsSourceOfTruthAllowed: false,
    },
    privacyConstraints: input.privacyConstraints ?? ['private artifacts only', 'no frontend secret exposure', 'no public URL source of truth'],
    costConstraints: input.costConstraints ?? ['no production spend enabled by Phase 52B', 'execution remains behind future approved phases'],
    failureModes: input.failureModes ?? ['missing evidence blocks readiness', 'runtime unavailable blocks execution', 'artifact upload failure fails closed'],
    blockedUses: input.blockedUses ?? commonBlockedUses,
    allowedConsumers: input.allowedConsumers ?? ['Director', 'Producer', 'QA/Safety', 'future worker planning from approved snapshots only'],
    testCommands: input.testCommands ?? ['npm run activation:tool-capability-registry-audit:report'],
    supabaseMilestoneRefs: input.supabaseMilestoneRefs ?? input.readinessEvidence.map((item) => `${item.phaseId}:${item.runId}`),
    notes: input.notes ?? ['Phase 52B registry metadata only; runtime remains blocked until later approved phases.'],
    ...input,
  }
}

const phase45F = evidence('45F', 'phase45f-20260601T01103', 'Track A visual/video readiness closure evidence', 'external_track_placeholder')
const phase49P = evidence('49P', 'phase49p-20260603T21361', 'docs/activation-phase-49p-web-search-internal-beta-candidate-results.md')
const phase49N = evidence('49N', 'phase49n-20260603T18331', 'docs/activation-phase-49n-search-provider-readiness-results.md')
const phase50G = evidence('50G', 'phase50g-20260604T153331', 'docs/activation-phase-50g-map-geospatial-readiness-results.md')
const phase51A = evidence('51A', 'phase51a-20260604T204225', 'docs/activation-phase-51a-supabase-data-plane-audit-results.md')
const phase51B = evidence('51B', 'phase51b-20260605T013720', 'docs/activation-phase-51b-supabase-milestone-registry-results.md')
const phase51C = evidence('51C', 'phase51c-20260605T022737', 'docs/activation-phase-51c-supabase-historical-backfill-results.md')
const phase51D = evidence('51D', 'phase51d-20260605T032516', 'docs/activation-phase-51d-supabase-milestone-sync-results.md')
const phase52A = evidence('52A', 'phase52a-20260605T111515', 'docs/activation-phase-52a-shared-agent-tool-architecture-results.md')

const trackATools = [
  'ffmpeg', 'ffprobe', 'libass', 'remotion_render_validation', 'opentimelineio', 'opencolorio', 'openimageio', 'kornia', 'birefnet', 'sam2', 'real_esrgan', 'film', 'track_a_visual_readiness_closure',
] as const

const webSearchTools = [
  ['searxng_private_search', 'Private SearXNG search service'],
  ['brave_search_optional_fallback', 'Brave Search optional fallback'],
  ['playwright_controlled_capture', 'Playwright allowlisted capture'],
  ['sharp_search_screenshot_processing', 'Sharp search screenshot processing'],
  ['mozilla_readability_extraction', 'Mozilla Readability extraction'],
  ['web_search_provider_router', 'Web search provider router'],
  ['web_search_capture_e2e', 'Controlled web search/capture E2E'],
  ['web_search_internal_beta_candidate', 'Web search internal beta candidate gate'],
] as const

const mapTools = [
  ['turf_geojson_calculations', 'Turf GeoJSON calculations'],
  ['maplibre_local_render', 'MapLibre local render'],
  ['deckgl_local_overlay', 'deck.gl local overlay'],
  ['cesiumjs_local_3d_planning', 'CesiumJS local 3D planning'],
  ['osm_open_data_policy', 'OSM/open data policy'],
  ['web_search_map_planning_e2e', 'Web search + map planning E2E'],
  ['map_geospatial_internal_readiness', 'Map/geospatial internal readiness gate'],
  ['pmtiles_future_tiles', 'PMTiles future tile packaging'],
  ['tileserver_gl_future_hosting', 'TileServer GL future hosting'],
  ['martin_future_vector_tiles', 'Martin future vector tiles'],
  ['nominatim_photon_pelias_future_geocoding', 'Nominatim/Photon/Pelias future geocoding'],
  ['osrm_valhalla_future_routing', 'OSRM/Valhalla future routing'],
] as const

const supabaseTools = [
  ['supabase_data_plane_audit', 'Supabase data plane audit', phase51A],
  ['supabase_milestone_registry', 'Supabase activation milestone registry', phase51B],
  ['supabase_historical_backfill', 'Supabase historical evidence backfill', phase51C],
  ['supabase_milestone_sync', 'Automatic Supabase milestone sync', phase51D],
] as const

const aiTools = [
  'd3_dataviz',
  'threejs_creative_3d',
  'remotion_graphics',
  'svg_generation',
  'lottie_web',
  'echarts',
  'vega_vega_lite',
  'vizjs_graphviz',
  'satori_html_to_svg',
  'resvg_rasterization',
  'ai_tools_motion_design',
  'ai_tools_creative_graphics_readiness',
] as const

const trackBTools = [
  ['sharp_libvips_general', 'Sharp/libvips general image processing', 'restricted_internal_ready'],
  ['deepfilternet', 'DeepFilterNet speech enhancement', 'implemented_but_blocked'],
  ['paddleocr', 'PaddleOCR text extraction', 'implemented_but_blocked'],
  ['pyav', 'PyAV media container access', 'restricted_internal_ready'],
  ['opencv', 'OpenCV computer vision', 'restricted_internal_ready'],
  ['pyscenedetect', 'PySceneDetect scene detection', 'restricted_internal_ready'],
  ['duckdb', 'DuckDB local analytics', 'restricted_internal_ready'],
  ['polars', 'Polars dataframe processing', 'restricted_internal_ready'],
  ['audioflux', 'AudioFlux audio analysis candidate', 'future_scoped'],
  ['signalsmith_stretch', 'Signalsmith Stretch time/pitch candidate', 'implemented_but_blocked'],
  ['whisper_cpp', 'whisper.cpp transcript candidate', 'future_scoped'],
  ['demucs', 'Demucs source separation', 'blocked_pending_model_provenance'],
  ['qwen3_vl', 'Qwen3-VL visual-language model', 'excluded_for_initial_internal_testing'],
  ['vllm_runtime', 'vLLM serving runtime', 'blocked_pending_runtime_resolution'],
  ['vlm_track_b_route', 'Track B VLM route', 'excluded_for_initial_internal_testing'],
  ['ocr_audio_data_readiness', 'OCR/audio/data readiness', 'external_track_owned_pending_manifest'],
  ['compute_routing_policy', 'Track B compute routing policy', 'external_track_owned_pending_manifest'],
  ['track_b_runtime_manifest', 'Track B runtime manifest', 'external_track_owned_pending_manifest'],
] as const satisfies ReadonlyArray<readonly [string, string, ToolCapabilityRegistryStatus]>

export const toolCapabilityRecords: ToolCapabilityRecord[] = [
  ...trackATools.map((toolId) => record({
    track: 'track_a_visual_video',
    subsystem: 'visual_video',
    toolId,
    displayName: humanize(toolId),
    owner: 'track_a',
    owningTrack: 'Track A visual-video core',
    owningChat: 'track_a',
    status: 'external_track_owned_pending_manifest',
    internalTestingReady: true,
    internalBetaCandidateReady: false,
    capabilities: ['visual/video core planning', 'approved snapshot worker readiness evidence', 'private artifact manifest integration'],
    inputs: ['approved plan snapshots', 'media/source manifests', 'worker-safe tool settings'],
    outputs: ['visual-video processing evidence', 'private artifact manifests', 'QA records'],
    runtimeRequirements: ['Track A worker runtime', 'approved plan snapshot', 'future explicit execution phase'],
    dependencyRequirements: ['Track A dependency manifest'],
    secretsRequired: [],
    modelArtifactsRequired: [],
    readinessEvidence: [phase45F],
    lastValidatedPhase: '45F',
    lastValidatedRunId: phase45F.runId,
    blockerReason: 'Owned by Track A; Phase 52B records the capability contract without taking runtime ownership.',
    futureRequiredAction: 'Track A must publish/update detailed capability manifests before production activation.',
  })),
  ...webSearchTools.map(([toolId, displayName], index) => record({
    track: 'web_search',
    subsystem: 'web_search_capture',
    toolId,
    displayName,
    owner: 'this_chat',
    owningTrack: 'This chat web search/capture stack',
    owningChat: 'this_chat',
    status: index === 7 ? 'ready_for_internal_beta_candidate' : 'ready_for_internal_testing',
    internalTestingReady: true,
    internalBetaCandidateReady: index === 7,
    capabilities: ['source discovery/capture planning', 'allowlisted private evidence handling', 'private artifact manifest production'],
    inputs: ['approved web search/capture plans', 'allowlisted source records', 'private SearXNG/Brave policy evidence'],
    outputs: ['source manifests', 'capture/extraction manifests', 'QA reports'],
    runtimeRequirements: ['backend-only execution', 'approved plan snapshot', 'private artifacts'],
    dependencyRequirements: ['SearXNG service evidence', 'Playwright/Sharp/Readability dependencies where already proven'],
    secretsRequired: toolId === 'brave_search_optional_fallback' ? ['backend-only Brave Search credential when explicitly enabled'] : [],
    modelArtifactsRequired: [],
    readinessEvidence: [index === 7 ? phase49P : phase49N],
    testCommands: ['npm run activation:web-search-internal-beta-candidate:report', 'npm run activation:search-provider-readiness:report'],
    lastValidatedPhase: index === 7 ? '49P' : '49N',
    lastValidatedRunId: index === 7 ? phase49P.runId : phase49N.runId,
  })),
  ...mapTools.map(([toolId, displayName], index) => record({
    track: 'map_geospatial',
    subsystem: 'map_geospatial',
    toolId,
    displayName,
    owner: 'this_chat',
    owningTrack: 'This chat map/geospatial stack',
    owningChat: 'this_chat',
    status: index <= 6 ? 'ready_for_internal_testing' : 'future_scoped',
    internalTestingReady: index <= 6,
    internalBetaCandidateReady: false,
    capabilities: ['generated/local geospatial planning', 'private artifact manifest production', 'network-guarded map QA'],
    inputs: ['generated GeoJSON', 'Turf calculations', 'local/offline style or scene manifests'],
    outputs: ['map planning manifests', 'private QA reports', 'generated/local render evidence'],
    runtimeRequirements: ['local/offline fixture runtime only until later phases'],
    dependencyRequirements: index <= 6 ? ['Phase 50A-50G approved dependency evidence'] : ['future phase evidence required'],
    secretsRequired: [],
    modelArtifactsRequired: [],
    readinessEvidence: [phase50G],
    testCommands: ['npm run activation:map-geospatial-readiness:report'],
    lastValidatedPhase: '50G',
    lastValidatedRunId: phase50G.runId,
    blockerReason: index <= 6 ? undefined : 'Future-scoped map provider/data runtime is not approved in Phase 52B.',
    futureRequiredAction: index <= 6 ? undefined : 'Add explicit evidence/runtime phase before enabling this capability.',
  })),
  ...supabaseTools.map(([toolId, displayName, evidenceRef]) => record({
    track: 'supabase',
    subsystem: 'activation_milestone_registry',
    toolId,
    displayName,
    owner: 'this_chat',
    owningTrack: 'This chat Supabase milestone/readiness coordination',
    owningChat: 'this_chat',
    status: 'ready_for_internal_testing',
    internalTestingReady: true,
    internalBetaCandidateReady: false,
    capabilities: ['structured readiness ledger metadata', 'private gs:// reference storage', 'QA/readiness/tool capability sync'],
    inputs: ['sanitized activation reports', 'private artifact references', 'QA gate summaries'],
    outputs: ['milestone registry rows', 'readiness snapshots', 'tool capability metadata'],
    runtimeRequirements: ['backend-only Supabase service client', 'Phase 51B registry schema'],
    dependencyRequirements: ['Phase 51B registry tables', 'Phase 51D sync contract'],
    secretsRequired: ['backend-only Supabase milestone credentials'],
    modelArtifactsRequired: [],
    readinessEvidence: [evidenceRef],
    testCommands: ['npm run activation:supabase-milestone-sync:report'],
    lastValidatedPhase: evidenceRef.phaseId,
    lastValidatedRunId: evidenceRef.runId,
  })),
  ...aiTools.map((toolId) => record({
    track: 'ai_tools',
    subsystem: 'creative_graphics_motion_design',
    toolId,
    displayName: humanize(toolId),
    owner: 'ai_tools',
    owningTrack: 'AI Tools creative graphics/motion design',
    owningChat: 'ai_tools',
    status: 'external_track_owned_pending_manifest',
    internalTestingReady: false,
    internalBetaCandidateReady: false,
    capabilities: ['creative graphics/motion design placeholder', 'future manifest handoff'],
    inputs: ['future AI Tools approved plan snapshots'],
    outputs: ['future graphics/motion manifests'],
    runtimeRequirements: ['AI Tools-owned runtime approval'],
    dependencyRequirements: ['AI Tools manifest required'],
    secretsRequired: [],
    modelArtifactsRequired: [],
    readinessEvidence: [phase52A],
    lastValidatedPhase: '52A',
    lastValidatedRunId: phase52A.runId,
    blockerReason: 'Externally owned by AI Tools; Phase 52B records placeholder metadata only.',
    futureRequiredAction: 'AI Tools must publish capability manifests before this chat can consume runtime outputs.',
  })),
  ...trackBTools.map(([toolId, displayName, status]) => record({
    track: 'track_b',
    subsystem: 'audio_ocr_data_vlm_compute',
    toolId,
    displayName,
    owner: 'track_b',
    owningTrack: 'Track B audio/OCR/data/VLM/compute routing',
    owningChat: 'track_b',
    status,
    internalTestingReady: status === 'restricted_internal_ready',
    internalBetaCandidateReady: false,
    capabilities: ['Track B-owned capability placeholder', 'future worker manifest handoff'],
    inputs: ['future Track B approved plan snapshots'],
    outputs: ['future Track B private artifacts or readiness manifests'],
    runtimeRequirements: ['Track B runtime approval', 'backend worker boundary'],
    dependencyRequirements: ['Track B detailed capability manifest'],
    secretsRequired: [],
    modelArtifactsRequired: toolId.includes('vlm') || toolId === 'qwen3_vl' ? ['future VLM model/runtime evidence'] : [],
    readinessEvidence: [phase52A],
    lastValidatedPhase: '52A',
    lastValidatedRunId: phase52A.runId,
    blockerReason: trackBBlocker(toolId, status),
    futureRequiredAction: 'Track B must provide updated runtime and provenance evidence before production activation.',
  })),
]

export function buildToolCapabilityRegistrySummary(records: ToolCapabilityRecord[] = toolCapabilityRecords): ToolCapabilityRegistrySummary {
  const byTrack = initCounts(['track_a_visual_video', 'web_search', 'map_geospatial', 'supabase', 'ai_tools', 'track_b'] as const)
  const byStatus = initCounts([
    'ready_for_internal_testing',
    'ready_for_internal_beta_candidate',
    'restricted_internal_ready',
    'implemented_but_blocked',
    'blocked_pending_model_provenance',
    'blocked_pending_runtime_resolution',
    'excluded_for_initial_internal_testing',
    'future_scoped',
    'external_track_owned_pending_manifest',
    'evidence_missing',
  ] as const)
  const seen = new Set<string>()
  const duplicates = new Set<string>()
  for (const item of records) {
    byTrack[item.track] += 1
    byStatus[item.status] += 1
    const key = `${item.track}:${item.toolId}`
    if (seen.has(key)) duplicates.add(key)
    seen.add(key)
  }
  return {
    totalRecords: records.length,
    byTrack,
    byStatus,
    internalTestingReadyCount: records.filter((item) => item.internalTestingReady).length,
    internalBetaCandidateReadyCount: records.filter((item) => item.internalBetaCandidateReady).length,
    productionReadyCount: 0,
    duplicateKeys: [...duplicates],
  }
}

export function recordsByTrack(track: ToolCapabilityTrack): ToolCapabilityRecord[] {
  return toolCapabilityRecords.filter((record) => record.track === track)
}

function initCounts<const T extends readonly string[]>(keys: T): Record<T[number], number> {
  return Object.fromEntries(keys.map((key) => [key, 0])) as Record<T[number], number>
}

function humanize(value: string): string {
  return value.split('_').map((part) => part ? `${part[0].toUpperCase()}${part.slice(1)}` : part).join(' ')
}

function trackBBlocker(toolId: string, status: ToolCapabilityRegistryStatus): string | undefined {
  if (toolId === 'demucs') return 'Demucs remains blocked pending model provenance review.'
  if (toolId === 'qwen3_vl' || toolId === 'vlm_track_b_route') return 'VLM remains excluded for initial internal testing due Phase 39C L4/vLLM CUDA OOM evidence.'
  if (toolId === 'vllm_runtime') return 'vLLM runtime remains blocked pending runtime resolution after Phase 39C CUDA OOM evidence.'
  if (status !== 'restricted_internal_ready') return 'Track B runtime manifest is pending or blocked outside Phase 52B ownership.'
  return undefined
}
