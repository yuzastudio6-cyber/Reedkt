import { editIntentSchema } from '../shared-agent-tool-architecture'
import type { ToolCapabilityRecord } from '../tool-capability-registry-audit'
import type { EditIntentCandidate, MultiAgentDryRunScenario, MultiAgentIntentType } from './multi-agent-dry-run-types'

interface IntentTemplate {
  agentId: EditIntentCandidate['agentId']
  proposedToolFamily: string
  requiredCapabilities: string[]
  targetScope: string
  rationale: string
  riskLevel: EditIntentCandidate['riskLevel']
}

const intentTemplates: Record<MultiAgentIntentType, IntentTemplate> = {
  conservative_color_adjustment: {
    agentId: 'colorist',
    proposedToolFamily: 'track_a_visual_video',
    requiredCapabilities: ['opencolorio', 'openimageio', 'kornia'],
    targetScope: 'candidate visual-video color adjustment intent',
    rationale: 'Track A visual/color capabilities have internal evidence but runtime remains external-track-owned.',
    riskLevel: 'low',
  },
  caption_burnin_preview: {
    agentId: 'editor',
    proposedToolFamily: 'track_a_visual_video',
    requiredCapabilities: ['ffmpeg', 'libass'],
    targetScope: 'candidate caption burn-in preview intent',
    rationale: 'Caption burn-in is Track A-owned and must remain worker/approved-snapshot gated.',
    riskLevel: 'low',
  },
  text_behind_subject_preview: {
    agentId: 'compositor_vfx',
    proposedToolFamily: 'track_a_visual_video',
    requiredCapabilities: ['sam2', 'birefnet'],
    targetScope: 'candidate text-behind-subject preview intent',
    rationale: 'Mask/compositing candidates can be planned only after existing Track A evidence and must keep safer-layout fallback.',
    riskLevel: 'medium',
  },
  route_map_overlay: {
    agentId: 'map_location',
    proposedToolFamily: 'map_geospatial',
    requiredCapabilities: ['turf_geojson_calculations', 'maplibre_local_render', 'deckgl_local_overlay'],
    targetScope: 'candidate generated/local route map overlay intent',
    rationale: 'Map/geospatial readiness supports generated/local planning only; live tiles/geocoding/routing stay blocked.',
    riskLevel: 'low',
  },
  location_context_card: {
    agentId: 'map_location',
    proposedToolFamily: 'map_geospatial',
    requiredCapabilities: ['web_search_map_planning_e2e', 'map_geospatial_internal_readiness'],
    targetScope: 'candidate generated/local location context card intent',
    rationale: 'Location cards can use private manifests and generated/local map evidence as planning source of truth.',
    riskLevel: 'low',
  },
  motion_graphics_lower_third: {
    agentId: 'graphics_design',
    proposedToolFamily: 'ai_tools_graphics_design',
    requiredCapabilities: ['remotion_graphics', 'ai_tools_motion_design'],
    targetScope: 'AI Tools-owned lower-third handoff intent',
    rationale: 'Creative graphics execution belongs to AI Tools and cannot be executed directly by this chat.',
    riskLevel: 'medium',
  },
  noise_cleanup: {
    agentId: 'audio',
    proposedToolFamily: 'track_b_audio',
    requiredCapabilities: ['deepfilternet'],
    targetScope: 'Track B-owned voice cleanup handoff intent',
    rationale: 'DeepFilterNet capability exists but remains implemented-but-blocked in the Phase 52B registry.',
    riskLevel: 'medium',
  },
  slow_motion_segment: {
    agentId: 'motion',
    proposedToolFamily: 'track_a_visual_video',
    requiredCapabilities: ['film', 'ffprobe'],
    targetScope: 'candidate slow-motion segment planning intent',
    rationale: 'FILM/ffprobe are Track A-owned capabilities and can be planned as candidate-only from existing evidence.',
    riskLevel: 'medium',
  },
  web_research_planning_context: {
    agentId: 'search_research',
    proposedToolFamily: 'web_search_capture',
    requiredCapabilities: ['web_search_internal_beta_candidate', 'web_search_provider_router'],
    targetScope: 'candidate research context planning intent',
    rationale: 'Existing Phase 49P evidence supports internal planning without running new search/capture.',
    riskLevel: 'low',
  },
  qwen_vlm_visual_understanding_request: {
    agentId: 'cinematographer',
    proposedToolFamily: 'track_b_vlm',
    requiredCapabilities: ['qwen3_vl', 'vllm_runtime'],
    targetScope: 'blocked VLM visual-understanding request',
    rationale: 'Qwen VLM/vLLM remain excluded or runtime-blocked and cannot be used in initial internal testing.',
    riskLevel: 'high',
  },
  demucs_stem_separation_request: {
    agentId: 'audio',
    proposedToolFamily: 'track_b_audio',
    requiredCapabilities: ['demucs'],
    targetScope: 'blocked stem-separation request',
    rationale: 'Demucs remains blocked pending model provenance and cannot be planned for runtime execution.',
    riskLevel: 'high',
  },
}

export function generateEditIntentCandidates(scenarios: MultiAgentDryRunScenario[], capabilities: ToolCapabilityRecord[]): EditIntentCandidate[] {
  const intents: EditIntentCandidate[] = []
  const seen = new Set<string>()
  for (const scenario of scenarios) {
    for (const intentType of scenario.requestedIntentTypes) {
      const key = `${scenario.scenarioId}:${intentType}`
      if (seen.has(key)) continue
      seen.add(key)
      const template = intentTemplates[intentType]
      const matchingCapabilities = template.requiredCapabilities.map((toolId) => capabilities.find((item) => item.toolId === toolId)).filter(Boolean) as ToolCapabilityRecord[]
      const blockedReason = initialBlockedReason(intentType, matchingCapabilities)
      intents.push({
        intentId: `intent-${scenario.scenarioId}-${intentType}`,
        scenarioId: scenario.scenarioId,
        agentId: template.agentId,
        intentType,
        targetScope: template.targetScope,
        evidenceRefs: scenario.evidenceRefs,
        rationale: template.rationale,
        proposedToolFamily: template.proposedToolFamily,
        requiredCapabilities: template.requiredCapabilities,
        estimatedCostClass: 'none',
        riskLevel: template.riskLevel,
        privacyImpact: blockedReason ? 'blocked_sensitive_runtime' : 'private_artifacts_only',
        userApprovalRequired: true,
        blocked: Boolean(blockedReason),
        blockedReason,
        allowedInInternalTesting: !blockedReason,
        allowedInExternalBeta: false,
        allowedInProduction: false,
        candidatePlanOnly: true,
        sourceOfTruthPolicy: [
          'approved plan snapshot required before workers',
          'private gs:// manifests only',
          'screenshots/previews are QA artifacts only',
          'raw prompt execution blocked',
        ],
      })
    }
  }
  return intents
}

export function validateEditIntentSchemaCompliance(intents: EditIntentCandidate[]) {
  const blockers: string[] = []
  for (const intent of intents) {
    const record = intent as unknown as Record<string, unknown>
    for (const field of editIntentSchema.requiredFields) {
      if (!(field in record)) blockers.push(`${intent.intentId} missing required field ${field}.`)
    }
    if (intent.allowedInExternalBeta || intent.allowedInProduction) blockers.push(`${intent.intentId} attempts beta or production readiness.`)
    if (!intent.candidatePlanOnly) blockers.push(`${intent.intentId} is not candidate-plan-only.`)
  }
  const requiredIntentTypes = Object.keys(intentTemplates)
  const present = new Set(intents.map((intent) => intent.intentType))
  for (const intentType of requiredIntentTypes) {
    if (!present.has(intentType as MultiAgentIntentType)) blockers.push(`Missing required intent candidate ${intentType}.`)
  }
  return { ok: blockers.length === 0, blockers }
}

function initialBlockedReason(intentType: MultiAgentIntentType, capabilities: ToolCapabilityRecord[]): string | null {
  if (intentType === 'motion_graphics_lower_third') return 'AI Tools owns creative graphics runtime; this chat may only emit a handoff candidate.'
  if (intentType === 'qwen_vlm_visual_understanding_request') return 'Qwen VLM/vLLM remain excluded or runtime-blocked after Phase 39C evidence.'
  if (intentType === 'demucs_stem_separation_request') return 'Demucs remains blocked pending model provenance.'
  if (intentType === 'noise_cleanup') return 'DeepFilterNet is implemented but blocked pending Track B runtime/readiness handoff.'
  if (!capabilities.length) return 'Required capability evidence is missing from the Phase 52B registry.'
  const notReady = capabilities.filter((item) => !item.internalTestingReady)
  if (notReady.length) return `Required capability is not internal-testing-ready: ${notReady.map((item) => item.toolId).join(', ')}.`
  return null
}
