import type { CrossWorkstreamEvidenceContext, OwnerPromptPacketReference } from './cross-workstream-handoff-types'

export function buildOwnerPromptPacketReferences(evidence: CrossWorkstreamEvidenceContext): OwnerPromptPacketReference[] {
  return evidence.ownerPromptPackets.map((packet) => {
    const decision = evidence.workstreamDecisions.find((item) => item.workstream === packet.workstream)
    return {
      workstream: packet.workstream,
      owner: packet.owner,
      packetId: packet.packetId,
      fileName: packet.fileName,
      gcsPath: `${evidence.phase52GArtifactPrefixes.generatedAssets}/prompts/${packet.fileName}`,
      summary: decision?.reason ?? 'Owner prompt packet reference reconstructed from Phase 52G.',
      nextRequiredResponse: 'Return one owner response packet using the Phase 52H schema; do not execute the prompt.',
      prohibitedActions: [
        'owner prompt execution',
        'tool/runtime execution',
        'worker execution',
        'provider calls',
        'model inference',
        'media processing',
        'web search',
        'browser capture',
        'map rendering',
        'migrations/schema/RLS changes',
        'public artifacts',
        'production/external beta/broad media unlock',
      ],
      responseTemplatePath: 'docs/cross-chat/owner-response-template.md',
      supabaseRefs: ['Phase 51D milestone sync contract', 'Phase 52G milestone record', 'Phase 52H milestone record after execution'],
    }
  })
}
