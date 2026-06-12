import type { ControlledInternalTestPacket, InternalTestScopeClassification, WorkstreamGoNoGoDecision } from './controlled-internal-test-go-no-go-types'

export function classifyInternalTestScopes(decisions: WorkstreamGoNoGoDecision[]): InternalTestScopeClassification[] {
  return decisions.map((decision) => ({
    workstream: decision.workstream,
    classification: decision.planningAllowed
      ? decision.decision === 'go_for_controlled_internal_planning'
        ? 'controlled_internal_planning'
        : 'owner_handoff_only'
      : 'blocked_runtime',
    laneReady: decision.planningAllowed,
    executionAllowed: false,
    notes: [decision.reason, 'Phase 52G emits planning/handoff records only; runtime execution is not allowed.'],
  }))
}

export function buildControlledInternalTestPacket(decisions: WorkstreamGoNoGoDecision[]): ControlledInternalTestPacket {
  return {
    packetId: 'phase52g_controlled_internal_test_packet',
    objective: 'Dispatch controlled internal test planning and owner response prompts without executing any runtime path.',
    allowedPlanningLanes: [
      'Track A private visual-video planning handoff',
      'web search internal beta candidate planning handoff',
      'map/geospatial controlled internal planning handoff',
      'Supabase milestone sync evidence handoff',
      'agent/plan validation handoff',
    ],
    disallowedExecutionLanes: [
      'Worker Runtime execution',
      'provider/model execution',
      'Track B VLM/Demucs runtime',
      'AI Tools runtime',
      'production/external beta',
      'public artifacts',
    ],
    ownerAssignments: decisions.map((decision) => ({
      workstream: decision.workstream,
      owner: decision.requiredOwner,
      nextPrompt: decision.recommendedNextPrompt,
    })),
    requiredPrompts: decisions.map((decision) => `prompt-${decision.workstream.toLowerCase().replace(/_/g, '-')}-owner.md`),
    inputArtifactConstraints: ['existing evidence only', 'private gs:// references only', 'no raw provider responses', 'no signed URL source of truth'],
    outputArtifactConstraints: ['private JSON/Markdown only', 'owner prompt packets only', 'no media blobs', 'no screenshots', 'no public URLs'],
    supabaseMilestoneRequirements: ['write exactly one Phase 52G milestone record', 'read Phase 52G milestone record back', 'no unrelated Supabase rows'],
    qaRequirements: ['all workstreams represented', 'runtime/external beta/production go states absent', 'blocked feature gates remain disabled'],
    successCriteria: ['QA gates pass', 'private artifacts upload', 'Supabase milestone sync readback completes'],
    stopConditions: ['missing Phase 52F evidence', 'runtime go decision emitted', 'public artifact detected', 'Supabase sync writes outside milestone registry'],
    rollbackPolicy: ['revert Phase 52G branch changes and leave prior Phase 52F milestone evidence intact; no runtime rollback is required because no runtime executes'],
    prohibitedActions: ['tool execution', 'worker execution', 'model inference', 'provider calls', 'media processing', 'web search', 'map rendering', 'browser capture', 'migrations', 'production unlock'],
  }
}
