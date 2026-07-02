import type {
  CreditEstimate,
  ToolStrategyPlan,
  ToolStrategyPlanItem,
} from '../types/reeditpro'
import type {
  ToolCallIntent,
  ToolCallIntentArtifactDependency,
  ToolCallIntentCapabilityId,
  ToolCallIntentCostEstimate,
  ToolCallIntentExpectedOutput,
  ToolCallIntentFallback,
  ToolCallIntentLane,
  ToolCallIntentPlan,
  ToolCallIntentReadinessState,
} from '../types/tool-call-intents'
import {
  getUnifiedSkillToolAvailability,
  type UnifiedSkillLaneStatus,
  type UnifiedToolId,
} from './unified-skill-capability-registry'

type CreditImpact = ToolCallIntentCostEstimate['creditImpact']

interface ToolCallIntentSeed {
  capabilityId: ToolCallIntentCapabilityId
  toolId: string
  reason: string
  creditImpact: CreditImpact
  fallbackToolIds?: string[]
  strategyItem?: ToolStrategyPlanItem
}

export interface CreateToolCallIntentPlanParams {
  toolStrategyPlan?: ToolStrategyPlan
  creditEstimate?: CreditEstimate
  includeBaselineIntents?: boolean
}

const zeroReadinessCounts: Record<ToolCallIntentReadinessState, number> = {
  ready_for_backend_execution: 0,
  dry_run_only: 0,
  blocked_by_provider_lane: 0,
  blocked_by_storage_billing: 0,
  blocked_by_owner_approval: 0,
}

const capabilityLabels: Record<ToolCallIntentCapabilityId, string> = {
  audio: 'Audio / SoundSync',
  browser_capture: 'Browser capture',
  chart_dataviz: 'Charts and diagrams',
  color: 'Color and image',
  credit_gate: 'Credit gate',
  media_extraction: 'Media extraction',
  ocr: 'OCR / text regions',
  qwen_reasoning: 'Qwen reasoning',
  qwen_visual_understanding: 'Qwen visual understanding',
  render: 'Render composition',
  sound_music_audio: 'SOUND music/audio',
  storage_runtime: 'Storage runtime',
  timeline: 'Timeline interchange',
  track_a_container_tools: 'Track A native containers',
  transcript: 'Transcript',
}

const capabilityDefaultTool: Partial<Record<ToolCallIntentCapabilityId, string>> = {
  audio: 'audioflux',
  browser_capture: 'playwright',
  chart_dataviz: 'd3',
  color: 'opencolorio',
  media_extraction: 'ffmpeg',
  ocr: 'opencv',
  qwen_reasoning: 'qwen_provider_gateway',
  qwen_visual_understanding: 'qwen_provider_gateway',
  render: 'remotion',
  sound_music_audio: 'sound_cpu_lane',
  storage_runtime: 'supabase_storage',
  timeline: 'opentimelineio',
  track_a_container_tools: 'gstreamer',
  transcript: 'faster_whisper',
}

const chainCapability: Partial<Record<ToolStrategyPlanItem['chainId'], ToolCallIntentCapabilityId>> = {
  audio_pipeline_chain: 'audio',
  browser_capture_chain: 'browser_capture',
  chart_diagram_chain: 'chart_dataviz',
  color_pipeline_chain: 'color',
  map_route_chain: 'chart_dataviz',
  remotion_layout_chain: 'render',
  visual_qa_chain: 'ocr',
}

const impactCredits: Record<CreditImpact, number> = {
  none: 0,
  low: 1,
  medium: 2,
  high: 4,
  premium: 6,
}

const toolLabels: Record<string, string> = {
  audioflux: 'AudioFlux',
  d3: 'D3',
  echarts: 'ECharts',
  faster_whisper: 'faster-whisper',
  ffmpeg: 'FFmpeg',
  ffprobe: 'FFprobe',
  libass: 'libass',
  opencolorio: 'OpenColorIO',
  openimageio: 'OpenImageIO',
  opencv: 'OpenCV',
  opentimelineio: 'OpenTimelineIO',
  paddleocr: 'PaddleOCR',
  playwright: 'Playwright',
  pyav: 'PyAV',
  remotion: 'Remotion',
  sharp: 'Sharp/libvips',
  signalsmith_stretch: 'Signalsmith Stretch',
}

const baselineSeeds: ToolCallIntentSeed[] = [
  {
    capabilityId: 'media_extraction',
    toolId: 'ffmpeg',
    reason: 'Prepare approved source media for probe, trim, proxy, or audio/frame extraction work after approval.',
    creditImpact: 'low',
    fallbackToolIds: ['ffprobe', 'pyav'],
  },
  {
    capabilityId: 'ocr',
    toolId: 'opencv',
    reason: 'Plan conservative text-region and no-cover-zone checks for captions, graphics, and UI/screen footage.',
    creditImpact: 'low',
    fallbackToolIds: ['paddleocr'],
  },
  {
    capabilityId: 'audio',
    toolId: 'audioflux',
    reason: 'Plan beat/onset/audio-feature support for SoundSync timing without running audio tools before approval.',
    creditImpact: 'low',
    fallbackToolIds: ['signalsmith_stretch', 'ffmpeg'],
  },
  {
    capabilityId: 'color',
    toolId: 'opencolorio',
    reason: 'Plan color transform and shot-match support when the edit needs consistent source/generated asset color.',
    creditImpact: 'medium',
    fallbackToolIds: ['openimageio', 'opencv', 'ffmpeg'],
  },
  {
    capabilityId: 'render',
    toolId: 'remotion',
    reason: 'Plan deterministic composition from the approved render manifest, captions, panels, and prepared assets.',
    creditImpact: 'medium',
    fallbackToolIds: ['ffmpeg', 'libass'],
  },
  {
    capabilityId: 'transcript',
    toolId: 'faster_whisper',
    reason: 'Surface the transcript route and its model/privacy gate before any speech transcription can run.',
    creditImpact: 'medium',
    fallbackToolIds: ['whisper_cpp'],
  },
]

export function createToolCallIntentPlan(params: CreateToolCallIntentPlanParams = {}): ToolCallIntentPlan {
  const seeds = [
    ...(params.includeBaselineIntents === false ? [] : baselineSeeds),
    ...seedsFromToolStrategy(params.toolStrategyPlan),
  ]
  const intents = dedupeSeeds(seeds).map((seed, index) => buildIntent(seed, index + 1))
  const readinessCounts = { ...zeroReadinessCounts }
  for (const intent of intents) {
    readinessCounts[intent.readinessState] += 1
  }
  const totalEstimatedCredits = intents.reduce((sum, intent) => sum + intent.costEstimate.credits, 0)

  return {
    id: 'tool-call-intent-plan',
    summary: buildSummary(intents, params.creditEstimate),
    intents,
    readinessCounts,
    totalEstimatedCredits,
    planningOnly: true,
    approvalRequiredBeforeExecution: true,
    notes: [
      'Tool-call intents are shown before approval so the user can see which tools may be used and why.',
      'No tool, provider, worker, render, media processing, Supabase write, billing mutation, or external beta action is started by this plan.',
      'Every future tool call still needs approved plan snapshot, credit estimate, credit reservation, idempotency, and private artifact gates.',
    ],
  }
}

function seedsFromToolStrategy(toolStrategyPlan?: ToolStrategyPlan): ToolCallIntentSeed[] {
  if (!toolStrategyPlan) {
    return []
  }

  return toolStrategyPlan.items.flatMap((item) => {
    const capabilityId = chainCapability[item.chainId]
    if (!capabilityId) return []

    const toolIds = item.selectedToolIds.length > 0 ? item.selectedToolIds : [item.primaryToolId]
    return toolIds.map((toolId) => ({
      capabilityId,
      toolId,
      reason: item.reason || item.userFacingSummary,
      creditImpact: item.creditImpact,
      fallbackToolIds: item.fallbackToolIds,
      strategyItem: item,
    }))
  })
}

function dedupeSeeds(seeds: ToolCallIntentSeed[]): ToolCallIntentSeed[] {
  const byKey = new Map<string, ToolCallIntentSeed>()
  for (const seed of seeds) {
    const key = `${seed.capabilityId}:${seed.toolId}`
    const existing = byKey.get(key)
    if (!existing) {
      byKey.set(key, seed)
      continue
    }

    byKey.set(key, {
      ...existing,
      creditImpact: strongerCreditImpact(existing.creditImpact, seed.creditImpact),
      fallbackToolIds: Array.from(new Set([...(existing.fallbackToolIds ?? []), ...(seed.fallbackToolIds ?? [])])),
      reason: existing.reason.length >= seed.reason.length ? existing.reason : seed.reason,
      strategyItem: existing.strategyItem ?? seed.strategyItem,
    })
  }

  return Array.from(byKey.values())
}

function strongerCreditImpact(a: CreditImpact, b: CreditImpact): CreditImpact {
  const order: CreditImpact[] = ['none', 'low', 'medium', 'high', 'premium']
  return order.indexOf(a) >= order.indexOf(b) ? a : b
}

function buildIntent(seed: ToolCallIntentSeed, order: number): ToolCallIntent {
  const availability = getUnifiedSkillToolAvailability(seed.capabilityId)
  const toolId = seed.toolId as UnifiedToolId
  const readinessState = readinessForTool(availability, toolId)
  const lane = laneForTool(availability, toolId, readinessState)

  return {
    id: `tool-call-intent-${order}-${seed.capabilityId}-${seed.toolId}`.replace(/[^a-zA-Z0-9_-]/g, '-'),
    toolId: seed.toolId,
    toolLabel: label(seed.toolId),
    capabilityId: seed.capabilityId,
    capabilityLabel: capabilityLabels[seed.capabilityId],
    lane,
    readinessState,
    readinessExplanation: readinessExplanation(availability.answer, readinessState),
    reason: seed.reason,
    inputArtifactDependency: inputDependencyForCapability(seed.capabilityId, seed.strategyItem),
    expectedOutputArtifact: expectedOutputForCapability(seed.capabilityId, seed.strategyItem),
    costEstimate: costEstimateForSeed(seed),
    fallback: fallbackForSeed(seed, readinessState),
    approvalRequiredBeforeExecution: true,
    frontendExecutionAllowed: false,
    metadata: {
      chainId: seed.strategyItem?.chainId ?? 'baseline_backend_gate',
      planningOnly: true,
    },
  }
}

function readinessForTool(
  availability: ReturnType<typeof getUnifiedSkillToolAvailability>,
  toolId: UnifiedToolId,
): ToolCallIntentReadinessState {
  if (availability.readyToolIds.includes(toolId)) return 'ready_for_backend_execution'
  if (availability.dryRunOnlyToolIds.includes(toolId)) return 'dry_run_only'
  if (availability.blockedToolIds.includes(toolId)) {
    return availability.laneStatuses.find((lane) => lane.toolIds.includes(toolId))?.status ?? 'blocked_by_owner_approval'
  }

  if (availability.backendExecutionCandidate) return 'ready_for_backend_execution'
  return availability.laneStatuses[0]?.status ?? 'blocked_by_owner_approval'
}

function laneForTool(
  availability: ReturnType<typeof getUnifiedSkillToolAvailability>,
  toolId: UnifiedToolId,
  readinessState: ToolCallIntentReadinessState,
): ToolCallIntentLane {
  const exactLane = availability.laneStatuses.find((lane) => lane.toolIds.includes(toolId))
  if (exactLane) return exactLane.lane
  const matchingLane = availability.laneStatuses.find((lane) => lane.status === readinessState)
  return matchingLane?.lane ?? 'planner_mock'
}

function readinessExplanation(answer: string, readinessState: UnifiedSkillLaneStatus): string {
  if (readinessState === 'ready_for_backend_execution') {
    return `${answer} This is a backend-gated candidate, not live execution.`
  }

  return answer
}

function inputDependencyForCapability(
  capabilityId: ToolCallIntentCapabilityId,
  strategyItem?: ToolStrategyPlanItem,
): ToolCallIntentArtifactDependency {
  if (strategyItem?.expectedInputs.includes('url') || strategyItem?.expectedInputs.includes('html')) {
    return {
      artifactType: 'approved_url_or_html',
      description: 'Approved URL, HTML, or browser capture source with privacy/credential review.',
      readiness: 'requires_approval',
      required: true,
    }
  }

  const byCapability: Record<ToolCallIntentCapabilityId, ToolCallIntentArtifactDependency> = {
    audio: {
      artifactType: 'audio_extract',
      description: 'Approved private audio extract or source-media audio track.',
      readiness: 'requires_future_artifact',
      required: true,
    },
    browser_capture: {
      artifactType: 'approved_url_or_html',
      description: 'Approved browser/page/app source with no credentials or signed URLs as source truth.',
      readiness: 'requires_approval',
      required: true,
    },
    chart_dataviz: {
      artifactType: 'json_data',
      description: 'Approved structured data or chart specification.',
      readiness: 'available_in_plan',
      required: true,
    },
    color: {
      artifactType: 'source_media_frame_sample',
      description: 'Approved source/proxy frame sample or generated asset frame.',
      readiness: 'requires_future_artifact',
      required: true,
    },
    credit_gate: {
      artifactType: 'credit_reservation',
      description: 'Approved credit estimate and reservation before billable work.',
      readiness: 'blocked',
      required: true,
    },
    media_extraction: {
      artifactType: 'source_media',
      description: 'Approved uploaded source media stored as private artifact refs.',
      readiness: 'requires_approval',
      required: true,
    },
    ocr: {
      artifactType: 'source_media_frame_sample',
      description: 'Approved sampled frame or screenshot candidate for text/no-cover-zone checks.',
      readiness: 'requires_future_artifact',
      required: true,
    },
    qwen_reasoning: {
      artifactType: 'approved_plan_snapshot',
      description: 'Compiled intent and approved prompt context, never raw chat.',
      readiness: 'blocked',
      required: true,
    },
    qwen_visual_understanding: {
      artifactType: 'source_media',
      description: 'Approved private media reference for provider visual understanding.',
      readiness: 'blocked',
      required: true,
    },
    render: {
      artifactType: 'render_manifest',
      description: 'Approved render manifest plus reconciled private asset manifest.',
      readiness: 'requires_approval',
      required: true,
    },
    sound_music_audio: {
      artifactType: 'audio_extract',
      description: 'Approved audio extract and SoundSync cue plan.',
      readiness: 'requires_future_artifact',
      required: true,
    },
    storage_runtime: {
      artifactType: 'approved_plan_snapshot',
      description: 'Approved plan snapshot and immutable private artifact manifest.',
      readiness: 'blocked',
      required: true,
    },
    timeline: {
      artifactType: 'approved_plan_snapshot',
      description: 'Approved edit plan, source order, timing, and segment operation snapshot.',
      readiness: 'available_in_plan',
      required: true,
    },
    track_a_container_tools: {
      artifactType: 'source_media',
      description: 'Explicitly approved Track A fixture/source artifact only.',
      readiness: 'blocked',
      required: true,
    },
    transcript: {
      artifactType: 'audio_extract',
      description: 'Approved private source audio extracted for transcription.',
      readiness: 'blocked',
      required: true,
    },
  }

  return byCapability[capabilityId]
}

function expectedOutputForCapability(
  capabilityId: ToolCallIntentCapabilityId,
  strategyItem?: ToolStrategyPlanItem,
): ToolCallIntentExpectedOutput {
  if (strategyItem?.expectedOutputs.includes('chart_visual')) {
    return {
      artifactType: 'chart_visual',
      description: 'Controlled chart/diagram visual or JSON/SVG specification.',
      consumedBy: ['renderer_composition_plan', 'visual_asset_plan'],
      requiredForApproval: false,
    }
  }

  const byCapability: Record<ToolCallIntentCapabilityId, ToolCallIntentExpectedOutput> = {
    audio: {
      artifactType: 'analysis_report',
      description: 'Audio feature, onset, stretch, or SoundSync timing report.',
      consumedBy: ['audio_pipeline_plan', 'soundsync_transition_timing_plan'],
      requiredForApproval: false,
    },
    browser_capture: {
      artifactType: 'screenshot_asset',
      description: 'Private screenshot/image asset prepared for Remotion composition.',
      consumedBy: ['visual_asset_plan', 'renderer_composition_plan'],
      requiredForApproval: false,
    },
    chart_dataviz: {
      artifactType: 'chart_visual',
      description: 'Exact chart/diagram visual or renderer-ready spec.',
      consumedBy: ['data_viz_plan', 'renderer_composition_plan'],
      requiredForApproval: false,
    },
    color: {
      artifactType: 'color_qa_report',
      description: 'Color transform, shot-match, or image/frame QA report.',
      consumedBy: ['color_pipeline_plan', 'edit_qa_plan'],
      requiredForApproval: false,
    },
    credit_gate: {
      artifactType: 'tool_cost_event',
      description: 'Idempotent tool-cost estimate/event after approved reservation.',
      consumedBy: ['credit_estimate', 'billing_ledger'],
      requiredForApproval: true,
    },
    media_extraction: {
      artifactType: 'analysis_report',
      description: 'Probe, frame/audio extraction, source metadata, or scene candidate report.',
      consumedBy: ['video_understanding_report', 'source_sequence_map', 'edit_plan'],
      requiredForApproval: false,
    },
    ocr: {
      artifactType: 'ocr_report_json',
      description: 'OCR/text-region/no-cover-zone report for captions and overlays.',
      consumedBy: ['caption_visual_cue_timing_plan', 'renderer_composition_plan', 'edit_qa_plan'],
      requiredForApproval: false,
    },
    qwen_reasoning: {
      artifactType: 'json_data',
      description: 'Structured planning output from provider reasoning.',
      consumedBy: ['compiled_intent', 'edit_plan'],
      requiredForApproval: true,
    },
    qwen_visual_understanding: {
      artifactType: 'analysis_report',
      description: 'Provider visual understanding report.',
      consumedBy: ['video_understanding_report', 'adaptive_edit_strategy_plan'],
      requiredForApproval: false,
    },
    render: {
      artifactType: 'preview_video',
      description: 'Preview/render output after approved assets and render manifest are ready.',
      consumedBy: ['preview_ready_card', 'final_export_gate'],
      requiredForApproval: false,
    },
    sound_music_audio: {
      artifactType: 'analysis_report',
      description: 'SOUND-owned music/audio semantic QA and handoff report.',
      consumedBy: ['audio_pipeline_plan', 'sound_music_audio_plan'],
      requiredForApproval: false,
    },
    storage_runtime: {
      artifactType: 'none',
      description: 'Private canonical artifact references; signed URLs remain temporary only.',
      consumedBy: ['worker_runtime', 'render_runtime'],
      requiredForApproval: true,
    },
    timeline: {
      artifactType: 'timeline_manifest',
      description: 'Structured timeline/edit decision manifest.',
      consumedBy: ['render_strategy_plan', 'renderer_composition_plan'],
      requiredForApproval: true,
    },
    track_a_container_tools: {
      artifactType: 'analysis_report',
      description: 'Track A native container proof or package-source report.',
      consumedBy: ['track_a_handoff', 'edit_qa_plan'],
      requiredForApproval: false,
    },
    transcript: {
      artifactType: 'transcript',
      description: 'Transcript and timing source artifact for captions and trim decisions.',
      consumedBy: ['caption_plan', 'trim_review_plan', 'source_cleanup_plan'],
      requiredForApproval: false,
    },
  }

  return byCapability[capabilityId]
}

function costEstimateForSeed(seed: ToolCallIntentSeed): ToolCallIntentCostEstimate {
  const credits = impactCredits[seed.creditImpact]

  return {
    credits,
    creditImpact: seed.creditImpact,
    basis: seed.strategyItem
      ? `${seed.strategyItem.label}: ${seed.strategyItem.creditImpact} tool strategy impact.`
      : `${capabilityLabels[seed.capabilityId]} baseline backend gate estimate.`,
    includedInEditEstimate: true,
    notes: [
      credits === 0
        ? 'No extra credits are estimated for this planning-only or included baseline intent.'
        : 'This is a pre-approval estimate only; no credits are reserved or spent here.',
    ],
  }
}

function fallbackForSeed(
  seed: ToolCallIntentSeed,
  readinessState: ToolCallIntentReadinessState,
): ToolCallIntentFallback {
  const fallbackToolIds = Array.from(new Set(seed.fallbackToolIds ?? []))
  const blocked = readinessState !== 'ready_for_backend_execution'

  return {
    fallbackToolIds,
    strategy: blocked
      ? 'Keep the plan blocked or use a lower-risk/remotion-only/manual-review path until this gate is cleared.'
      : 'Use the listed fallback tools or simpler Remotion/manual-review path if the selected tool fails QA.',
    requiresNewApproval: blocked || seed.creditImpact === 'high' || seed.creditImpact === 'premium',
    reason: blocked
      ? 'Changing from a blocked lane to another route can alter capability, cost, privacy, or output scope.'
      : 'Material fallback changes still need approval when cost, output, or user-visible behavior changes.',
  }
}

function buildSummary(intents: ToolCallIntent[], creditEstimate?: CreditEstimate): string {
  const readyCount = intents.filter((intent) => intent.readinessState === 'ready_for_backend_execution').length
  const blockedCount = intents.length - readyCount
  const toolNames = intents.slice(0, 5).map((intent) => intent.toolLabel).join(', ')
  const creditText = creditEstimate
    ? ` The edit estimate remains ${creditEstimate.total} credits before approval.`
    : ''

  return `${intents.length} planned tool-call intent${intents.length === 1 ? '' : 's'}: ${toolNames}${intents.length > 5 ? ', and more' : ''}. ${readyCount} backend-gated candidate${readyCount === 1 ? '' : 's'}, ${blockedCount} gated/dry-run item${blockedCount === 1 ? '' : 's'}.${creditText}`
}

function label(value: string): string {
  if (toolLabels[value]) {
    return toolLabels[value]
  }

  return value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function defaultToolForCapability(capabilityId: ToolCallIntentCapabilityId): string {
  return capabilityDefaultTool[capabilityId] ?? 'custom'
}
