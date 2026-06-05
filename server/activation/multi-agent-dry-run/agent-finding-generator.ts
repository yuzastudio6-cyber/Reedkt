import { agentFindingSchema, agentRoleRegistry } from '../shared-agent-tool-architecture'
import type { MultiAgentDryRunScenario, MultiAgentFinding, MultiAgentId } from './multi-agent-dry-run-types'

const findingByAgent: Record<MultiAgentId, { type: string; subject: string; summary: string; recommendation: string }> = {
  director: {
    type: 'story_priority',
    subject: 'Creative direction and scope',
    summary: 'Scenario can be represented as a candidate plan from existing evidence without runtime execution.',
    recommendation: 'Keep the candidate plan narrow and require a later approved plan snapshot before worker execution.',
  },
  editor: {
    type: 'sequence_structure',
    subject: 'Timeline and pacing candidate',
    summary: 'Edit improvements are advisory because no media/timeline processing occurs in Phase 52C.',
    recommendation: 'Emit structured edit intents only and defer frame-accurate worker instructions to a later bridge.',
  },
  cinematographer: {
    type: 'framing_review',
    subject: 'Shot evidence limitation',
    summary: 'Visual-understanding and shot-framing work must use existing evidence; VLM remains excluded.',
    recommendation: 'Block VLM runtime candidates and route safe Track A review candidates as candidate-plan-only.',
  },
  colorist: {
    type: 'conservative_color_adjustment',
    subject: 'Color consistency candidate',
    summary: 'Conservative color adjustment can be represented as a Track A-owned candidate intent.',
    recommendation: 'Require Track A execution manifest and approved snapshot before any color processing.',
  },
  compositor_vfx: {
    type: 'overlay_composition',
    subject: 'Text-behind-subject candidate',
    summary: 'Text-behind-subject can be proposed as an internal candidate where SAM2/BiRefNet evidence exists.',
    recommendation: 'Keep mask/compositing work candidate-only and preserve fallback to safer layouts.',
  },
  motion: {
    type: 'interpolation_candidate',
    subject: 'Motion and lower-third candidate',
    summary: 'Slow-motion candidate planning can reference Track A evidence; graphics motion runtime is AI Tools-owned.',
    recommendation: 'Allow Track A candidate planning where ready and block direct AI Tools execution.',
  },
  audio: {
    type: 'audio_readiness',
    subject: 'Noise cleanup and stem separation readiness',
    summary: 'Audio cleanup and Demucs requests depend on Track B runtime/provenance evidence that is not cleared here.',
    recommendation: 'Block Demucs and any audio processing execution; record Track B handoff needs.',
  },
  search_research: {
    type: 'web_research_planning_context',
    subject: 'Research context candidate',
    summary: 'Web-search context can be planned from existing Phase 49P/52B evidence without a new query.',
    recommendation: 'Use source/capture/extraction manifests as the source of truth and defer live search.',
  },
  map_location: {
    type: 'map_scene_plan',
    subject: 'Location and route context candidate',
    summary: 'Generated/local map planning candidates are ready for internal evidence-only planning.',
    recommendation: 'Keep live tiles, geocoding, routing, public OSM tiles, and public artifacts blocked.',
  },
  graphics_design: {
    type: 'design_brief',
    subject: 'Lower-third design ownership',
    summary: 'Motion graphics lower-third work belongs to AI Tools and cannot be executed by this chat.',
    recommendation: 'Emit a handoff-style design intent only; do not claim direct runtime ownership.',
  },
  producer: {
    type: 'go_no_go',
    subject: 'Scope and cost gate',
    summary: 'Only internal-testing-ready candidates may pass as candidate_plan_only.',
    recommendation: 'Block production, external beta, public artifacts, raw prompts, VLM, Demucs, and direct AI Tools execution.',
  },
  qa_safety: {
    type: 'policy_rejection',
    subject: 'Safety and source-of-truth gate',
    summary: 'No runtime work occurred and all source-of-truth rules must remain manifest-based.',
    recommendation: 'Require Supabase milestone sync readback before Phase52D readiness is marked ready.',
  },
}

export function generateMultiAgentFindings(scenarios: MultiAgentDryRunScenario[], timestamp = new Date().toISOString()): MultiAgentFinding[] {
  const findings: MultiAgentFinding[] = []
  for (const scenario of scenarios) {
    for (const agentId of scenario.participatingAgents) {
      const template = findingByAgent[agentId]
      const downstream = scenario.requestedIntentTypes.filter((intentType) => isAgentLikelyToOwnIntent(agentId, intentType))
      findings.push({
        findingId: `finding-${scenario.scenarioId}-${agentId}`,
        scenarioId: scenario.scenarioId,
        agentId,
        timestamp,
        subject: template.subject,
        evidenceRefs: scenario.evidenceRefs,
        confidence: blockedAgent(agentId, scenario.scenarioId) ? 'medium' : 'high',
        severity: blockedAgent(agentId, scenario.scenarioId) ? 'blocked' : 'info',
        findingType: template.type,
        summary: template.summary,
        recommendation: template.recommendation,
        uncertainty: 'Dry-run uses existing evidence only; no source media, providers, tools, or workers were executed.',
        blocked: blockedAgent(agentId, scenario.scenarioId),
        blockedReason: blockedAgent(agentId, scenario.scenarioId) ? blockedReason(agentId, scenario.scenarioId) : null,
        downstreamIntentCandidates: downstream.length ? downstream : scenario.requestedIntentTypes.slice(0, 1),
        rawPromptExecution: false,
        directToolExecution: false,
      })
    }
  }
  return findings
}

export function validateFindingSchemaCompliance(findings: MultiAgentFinding[]) {
  const required = agentFindingSchema.requiredFields
  const blockers: string[] = []
  for (const finding of findings) {
    const record = finding as unknown as Record<string, unknown>
    for (const field of required) {
      if (!(field in record)) blockers.push(`${finding.findingId} missing required field ${field}.`)
    }
    for (const field of agentFindingSchema.forbiddenFields ?? []) {
      if (field in record) blockers.push(`${finding.findingId} includes forbidden field ${field}.`)
    }
    if (finding.rawPromptExecution || finding.directToolExecution) blockers.push(`${finding.findingId} attempts runtime execution.`)
  }
  const requiredAgents = agentRoleRegistry.map((role) => role.agentId)
  const covered = new Set(findings.map((finding) => finding.agentId))
  for (const agentId of requiredAgents) {
    if (!covered.has(agentId as MultiAgentId)) blockers.push(`Agent ${agentId} did not emit a finding.`)
  }
  return { ok: blockers.length === 0, blockers }
}

function isAgentLikelyToOwnIntent(agentId: MultiAgentId, intentType: string): boolean {
  if (agentId === 'colorist') return intentType === 'conservative_color_adjustment'
  if (agentId === 'compositor_vfx') return intentType === 'text_behind_subject_preview'
  if (agentId === 'motion') return intentType === 'slow_motion_segment' || intentType === 'motion_graphics_lower_third'
  if (agentId === 'audio') return intentType === 'noise_cleanup' || intentType === 'demucs_stem_separation_request'
  if (agentId === 'search_research') return intentType === 'web_research_planning_context'
  if (agentId === 'map_location') return intentType === 'route_map_overlay' || intentType === 'location_context_card'
  if (agentId === 'graphics_design') return intentType === 'motion_graphics_lower_third'
  if (agentId === 'cinematographer') return intentType === 'qwen_vlm_visual_understanding_request'
  if (agentId === 'editor') return intentType === 'caption_burnin_preview'
  return agentId === 'director' || agentId === 'producer' || agentId === 'qa_safety'
}

function blockedAgent(agentId: MultiAgentId, scenarioId: string): boolean {
  return (
    (agentId === 'graphics_design' && scenarioId === 'motion_graphics_lower_third_request') ||
    (agentId === 'audio' && scenarioId === 'audio_noise_cleanup_and_voice_request') ||
    (agentId === 'cinematographer' && scenarioId === 'vlm_video_understanding_request')
  )
}

function blockedReason(agentId: MultiAgentId, scenarioId: string): string {
  if (agentId === 'graphics_design' && scenarioId === 'motion_graphics_lower_third_request') return 'AI Tools owns creative graphics runtime; this chat may only emit a handoff intent.'
  if (agentId === 'audio' && scenarioId === 'audio_noise_cleanup_and_voice_request') return 'Track B audio/model provenance readiness is not cleared for runtime execution.'
  if (agentId === 'cinematographer' && scenarioId === 'vlm_video_understanding_request') return 'VLM remains excluded for initial internal testing after Phase 39C L4/vLLM CUDA OOM.'
  return 'Blocked by Phase 52C dry-run policy.'
}
