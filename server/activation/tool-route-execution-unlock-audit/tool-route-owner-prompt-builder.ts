import type {
  ToolRouteBlockedUseRegister,
  ToolStudyOwnerPrompt,
  ToolStudyOwnerPromptMap,
} from './tool-route-audit-types'

type PromptSeed = Omit<ToolStudyOwnerPrompt, 'body'>

const COMMON_BLOCKED_SCOPE = [
  'tool execution',
  'worker execution',
  'route execution',
  'provider/model calls',
  'media processing',
  'browser capture',
  'map rendering',
  'web search execution',
  'Supabase mutation',
  'SQL/migrations/schema/RLS changes',
  'Google Cloud API calls',
  'Secret Manager API calls',
  'GCS upload/storage transfer',
  'public artifacts',
  'signed URLs',
  'raw prompt execution',
  'production/external beta/paid production/broad media unlock',
]

const COMMON_DOCS = [
  'docs/activation-phase-tool-route-0-execution-unlock-audit-results.md',
  'docs/activation-worker-approved-plan-dry-run-reports/dry-run/worker-job-batch-plan.json',
  'docs/activation-worker-approved-plan-dry-run-reports/evidence/plan-snapshot-evidence-context.json',
  'open-source-tool-registry.md',
  'tool-settings-catalog.md',
  'tool-strategy-planner.md',
]

const PROMPT_SEEDS: PromptSeed[] = [
  {
    owner: 'WEB_SEARCH_CAPTURE',
    path: 'docs/implementation-prompts/prompt-tool-study-0-web-search-capture.md',
    title: 'TOOL-STUDY-0 Web Search Capture Capability Routing Contract',
    ownedTools: ['SearXNG/private search policy', 'Brave fallback policy', 'Playwright capture', 'Readability extraction', 'Sharp screenshot preparation'],
    explicitlyNotOwned: ['map rendering', 'provider/model planning', 'Track A export', 'Track B media processing', 'Supabase writes', 'billing'],
    relatedWorkstreams: ['COMPLIANCE_SECURITY', 'OBSERVABILITY_AUDIT_COST', 'FRONTEND_PRODUCT_UX'],
    allowedScope: ['docs/diagnostics only', 'read committed TOOL-ROUTE-0 and WORKER-1 evidence', 'map future search/capture capabilities and blockers'],
    blockedScope: COMMON_BLOCKED_SCOPE,
    requiredDocs: [...COMMON_DOCS, 'docs/activation-phase-49h-web-search-capture-internal-readiness.md if present'],
    diagnostics: ['verify no web request execution path is introduced', 'verify browser capture remains blocked', 'verify owner handoff lists privacy/source limitations'],
    validation: ['run local report/smoke only', 'scan changed files for signed URL and raw prompt material'],
    finalResponseFormat: ['owner', 'capability routing status', 'blocked capabilities', 'required next study evidence', 'no-scope statement'],
  },
  {
    owner: 'MAP_GEOSPATIAL',
    path: 'docs/implementation-prompts/prompt-tool-study-0-map-geospatial.md',
    title: 'TOOL-STUDY-0 Map Geospatial Capability Routing Contract',
    ownedTools: ['MapLibre', 'Turf', 'deck.gl planning', 'CesiumJS planning'],
    explicitlyNotOwned: ['web search execution', 'browser capture', 'Track B media processing', 'provider/model calls', 'Supabase mutation'],
    relatedWorkstreams: ['WEB_SEARCH_CAPTURE', 'AI_TOOLS_CREATIVE_GRAPHICS', 'COMPLIANCE_SECURITY', 'FRONTEND_PRODUCT_UX'],
    allowedScope: ['docs/diagnostics only', 'map future map/geospatial route families', 'record map safety/readability prerequisites'],
    blockedScope: COMMON_BLOCKED_SCOPE,
    requiredDocs: [...COMMON_DOCS, 'map-location-animation-planning.md', 'map-animation-settings-catalog.md'],
    diagnostics: ['verify no map rendering or tile/network fetch runs', 'verify exact geography claims stay owner-reviewed'],
    validation: ['run local report/smoke only', 'scan changed files for runtime or API-call claims'],
    finalResponseFormat: ['owner', 'route families', 'tool capability contract gaps', 'map execution blockers', 'no-scope statement'],
  },
  {
    owner: 'AI_TOOLS_CREATIVE_GRAPHICS',
    path: 'docs/implementation-prompts/prompt-tool-study-0-ai-tools-creative-graphics.md',
    title: 'TOOL-STUDY-0 AI Tools Creative Graphics Capability Routing Contract',
    ownedTools: ['D3', 'ECharts', 'Vega-Lite planning', 'Sharp/libvips graphics prep', 'Remotion graphics handoff'],
    explicitlyNotOwned: ['map rendering', 'web capture', 'provider/model calls', 'Track A final render', 'Track B media processing'],
    relatedWorkstreams: ['TRACK_A_RENDER_EXPORT', 'MAP_GEOSPATIAL', 'FRONTEND_PRODUCT_UX', 'COMPLIANCE_SECURITY'],
    allowedScope: ['docs/diagnostics only', 'route chart/card/diagram capability families', 'record controlled graphics QA prerequisites'],
    blockedScope: COMMON_BLOCKED_SCOPE,
    requiredDocs: [...COMMON_DOCS, 'chart-diagram-planning.md', 'chart-diagram-settings-catalog.md'],
    diagnostics: ['verify no chart or graphics renderer runs', 'verify exact text/data claims stay controlled and source-reviewed'],
    validation: ['run local report/smoke only', 'scan changed files for execution claims'],
    finalResponseFormat: ['owner', 'graphics capability families', 'required tool studies', 'execution blockers', 'no-scope statement'],
  },
  {
    owner: 'TRACK_A_RENDER_EXPORT',
    path: 'docs/implementation-prompts/prompt-tool-study-0-track-a-render-export.md',
    title: 'TOOL-STUDY-0 Track A Render Export Capability Routing Contract',
    ownedTools: ['Remotion render/export boundary', 'FFmpeg final mux/export planning', 'OpenTimelineIO render handoff', 'libass caption burn-in planning'],
    explicitlyNotOwned: ['Track B media analysis', 'map data source validation', 'web capture', 'provider/model calls', 'billing mutation'],
    relatedWorkstreams: ['WORKER_RUNTIME_JOBS', 'AI_TOOLS_CREATIVE_GRAPHICS', 'OBSERVABILITY_AUDIT_COST', 'COMPLIANCE_SECURITY'],
    allowedScope: ['docs/diagnostics only', 'map future render/export route prerequisites', 'record approved snapshot and artifact-scope requirements'],
    blockedScope: COMMON_BLOCKED_SCOPE,
    requiredDocs: [...COMMON_DOCS, 'remotion-renderer-plan.md', 'render-strategy-planner.md'],
    diagnostics: ['verify no render/export command is introduced', 'verify final render/export remains blocked'],
    validation: ['run local report/smoke only', 'scan changed files for final export enablement'],
    finalResponseFormat: ['owner', 'render/export route status', 'required capability contracts', 'blocked runtime scope', 'no-scope statement'],
  },
  {
    owner: 'TRACK_B_MEDIA_PROCESSING',
    path: 'docs/implementation-prompts/prompt-tool-study-0-track-b-media-processing.md',
    title: 'TOOL-STUDY-0 Track B Media Processing Capability Routing Contract',
    ownedTools: ['FFmpeg/ffprobe metadata planning', 'OpenCV', 'PyAV', 'PySceneDetect', 'DeepFilterNet', 'Signalsmith Stretch', 'DuckDB/Polars metadata planning'],
    explicitlyNotOwned: ['Track A final render/export', 'map rendering', 'web search execution', 'provider/model calls', 'Supabase schema changes'],
    relatedWorkstreams: ['SOUND_MUSIC_AUDIO', 'WORKER_RUNTIME_JOBS', 'OBSERVABILITY_AUDIT_COST', 'COMPLIANCE_SECURITY'],
    allowedScope: ['docs/diagnostics only', 'map Track B route manifests to TOOL-STUDY-0 prerequisites', 'record media-runtime blockers'],
    blockedScope: COMMON_BLOCKED_SCOPE,
    requiredDocs: [...COMMON_DOCS, 'docs/track-b-tool-route-manifest.md', 'docs/track-b-tool-readiness-summary.md'],
    diagnostics: ['verify no media files are read or processed', 'verify no sidecar/tool runtime executes'],
    validation: ['run local report/smoke only', 'scan changed files for media-processing claims'],
    finalResponseFormat: ['owner', 'Track B route families', 'tool study gaps', 'runtime blockers', 'no-scope statement'],
  },
  {
    owner: 'SOUND_MUSIC_AUDIO',
    path: 'docs/implementation-prompts/prompt-tool-study-0-sound-music-audio.md',
    title: 'TOOL-STUDY-0 Sound Music Audio Capability Routing Contract',
    ownedTools: ['AudioFlux planning', 'Signalsmith Stretch planning', 'SoundSync SFX/audio route planning', 'loudness/ducking metadata planning'],
    explicitlyNotOwned: ['provider music/SFX calls', 'Track A final export', 'web capture', 'map rendering', 'Supabase writes'],
    relatedWorkstreams: ['TRACK_B_MEDIA_PROCESSING', 'BILLING_STRIPE_CREDITS', 'COMPLIANCE_SECURITY', 'OBSERVABILITY_AUDIT_COST'],
    allowedScope: ['docs/diagnostics only', 'map sound/music/audio capability prerequisites', 'record audio privacy/cost/runtime blockers'],
    blockedScope: COMMON_BLOCKED_SCOPE,
    requiredDocs: [...COMMON_DOCS, 'soundsync-audio-pipeline-planning.md', 'audio-settings-catalog.md'],
    diagnostics: ['verify no audio analysis or generation runs', 'verify no provider SFX/music call path is introduced'],
    validation: ['run local report/smoke only', 'scan changed files for audio execution claims'],
    finalResponseFormat: ['owner', 'audio capability families', 'tool study blockers', 'provider/runtime boundaries', 'no-scope statement'],
  },
]

function renderPrompt(seed: PromptSeed): string {
  return `# ${seed.title}

Owner: \`${seed.owner}\`

## Owned Tools

${seed.ownedTools.map((item) => `- ${item}`).join('\n')}

## Explicitly Not Owned

${seed.explicitlyNotOwned.map((item) => `- ${item}`).join('\n')}

## Related Workstreams

${seed.relatedWorkstreams.map((item) => `- ${item}`).join('\n')}

## Allowed Scope

${seed.allowedScope.map((item) => `- ${item}`).join('\n')}

## Blocked Scope

${seed.blockedScope.map((item) => `- ${item}`).join('\n')}

## Required Docs And Files

${seed.requiredDocs.map((item) => `- ${item}`).join('\n')}

## Diagnostics

${seed.diagnostics.map((item) => `- ${item}`).join('\n')}

## Validation

${seed.validation.map((item) => `- ${item}`).join('\n')}

## Final Response Format

${seed.finalResponseFormat.map((item) => `- ${item}`).join('\n')}
`
}

export function buildToolStudyOwnerPromptMap(
  blockedUseRegister: ToolRouteBlockedUseRegister,
): ToolStudyOwnerPromptMap {
  const activeBlockers = [...blockedUseRegister.activeBlockers]
  const prompts: ToolStudyOwnerPrompt[] = PROMPT_SEEDS.map((seed) => ({
    ...seed,
    body: renderPrompt(seed),
  }))
  if (prompts.length !== 6) activeBlockers.push(`unexpected_tool_study_prompt_count:${prompts.length}`)

  return {
    phase: 'TOOL_ROUTE_0',
    status: activeBlockers.length > 0 ? 'blocked' : 'passed',
    prompts,
    promptCount: prompts.length,
    activeBlockers,
  }
}
