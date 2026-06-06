import type { OwnerHandoffPromptPacket, WorkstreamGoNoGoDecision, WorkstreamId } from './controlled-internal-test-go-no-go-types'

const promptFileNames: Record<WorkstreamId, string> = {
  AI_TOOLS_CREATIVE_GRAPHICS: 'prompt-ai-tools-creative-graphics-owner.md',
  TRACK_A_RENDER_EXPORT: 'prompt-track-a-render-export-owner.md',
  TRACK_B_MEDIA_PROCESSING: 'prompt-track-b-media-processing-owner.md',
  MAP_GEOSPATIAL: 'prompt-map-geospatial-owner.md',
  SOUND_MUSIC_AUDIO: 'prompt-sound-music-audio-owner.md',
  SUPABASE_RLS_STORAGE_DATABASE: 'prompt-supabase-rls-storage-database-owner.md',
  PROVIDER_GATEWAY_MODELS: 'prompt-provider-gateway-models-owner.md',
  WORKER_RUNTIME_JOBS: 'prompt-worker-runtime-jobs-owner.md',
  COMPLIANCE_SECURITY: 'prompt-compliance-security-owner.md',
  OBSERVABILITY_AUDIT_COST: 'prompt-observability-audit-cost-owner.md',
  FRONTEND_PRODUCT_UX: 'prompt-frontend-product-ux-owner.md',
  BILLING_STRIPE_CREDITS: 'prompt-billing-stripe-credits-owner.md',
}

export function buildOwnerHandoffPromptPackets(decisions: WorkstreamGoNoGoDecision[], runId: string): OwnerHandoffPromptPacket[] {
  return decisions.map((decision) => {
    const fileName = promptFileNames[decision.workstream]
    return {
      packetId: fileName.replace(/\.md$/, ''),
      fileName,
      workstream: decision.workstream,
      owner: decision.requiredOwner,
      content: renderPrompt(decision, runId),
    }
  })
}

function renderPrompt(decision: WorkstreamGoNoGoDecision, runId: string): string {
  return `# ${decision.workstream} Owner Handoff Prompt

Phase: 52G
Run ID: ${runId}
Workstream owner: ${decision.requiredOwner}
Decision: ${decision.decision}
Runtime execution: ${decision.runtimeDecision}

## Current Evidence
${decision.evidence.map((item) => `- ${item}`).join('\n')}

## What To Do Next
- Review the Phase 52G go/no-go packet and this owner-specific handoff.
- Confirm whether your workstream can accept the planning handoff, needs a follow-up evidence phase, or remains blocked.
- Return a response packet with ownership, readiness, blockers, validation expectations, and Supabase milestone sync classification.

## What Not To Do
- Do not execute tools, workers, models, providers, media processing, web search, browser capture, map rendering, migrations, Docker, Cloud Run, production, external beta, or broad media.
- Do not create public artifacts or use signed URLs as source of truth.
- Do not use raw prompt execution or bypass approved snapshot policy.

## Cross-Chat Ownership Check
- Confirm ownership boundaries before proposing implementation.
- Identify related workstreams and duplicate-work risks.
- Preserve this chat as the coordination layer only.

## Supabase Update Classification
- Supabase update required: milestone/status only unless your owner scope explicitly says otherwise.
- Supabase environment touched: staging metadata only.
- SQL executed: none for this Phase 52G handoff.
- Migration deployed: no.

## Expected Handoff Output
- owner readiness decision
- blocker list
- required evidence or contracts
- validation commands/results
- blocked feature confirmation

## Blocked Features
${decision.blockedScope.map((item) => `- ${item}`).join('\n')}
`
}
