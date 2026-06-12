import { existsSync, readFileSync } from 'node:fs'
import {
  buildControlledInternalTestPacket,
  buildGoNoGoDecisionPacket,
  buildOwnerHandoffPromptPackets,
  evaluateWorkstreamGoNoGo,
  resolveGoNoGoEvidenceContext,
} from '../controlled-internal-test-go-no-go'
import { crossWorkstreamHandoffConfig } from './cross-workstream-handoff-policy'
import type { CrossWorkstreamEvidenceContext, CrossWorkstreamSourceAudit } from './cross-workstream-handoff-types'

export function resolveCrossWorkstreamHandoffEvidence(audit: CrossWorkstreamSourceAudit): CrossWorkstreamEvidenceContext {
  const blockers: string[] = []
  const warnings: string[] = []
  const resultDoc = 'docs/activation-phase-52g-controlled-internal-test-go-no-go-results.md'
  if (!existsSync(resultDoc)) blockers.push('Phase 52G results doc is missing.')
  else {
    const doc = readFileSync(resultDoc, 'utf8')
    for (const expected of ['Status: completed', crossWorkstreamHandoffConfig.canonicalPhase52GRunId, 'Supabase milestone sync', 'QA gates']) {
      if (!doc.includes(expected)) blockers.push(`Phase 52G results doc does not include expected evidence: ${expected}.`)
    }
  }

  const baseEvidence = resolveGoNoGoEvidenceContext({ ...audit, auditId: 'phase52g_repo_ownership_audit' })
  const workstreamDecisions = evaluateWorkstreamGoNoGo(baseEvidence)
  const decisionPacket = buildGoNoGoDecisionPacket(crossWorkstreamHandoffConfig.canonicalPhase52GRunId, workstreamDecisions)
  const controlledPacket = buildControlledInternalTestPacket(workstreamDecisions)
  const ownerPromptPackets = buildOwnerHandoffPromptPackets(workstreamDecisions, crossWorkstreamHandoffConfig.canonicalPhase52GRunId)
  if (decisionPacket.workstreamDecisions.length !== 12) blockers.push('Phase 52G decision reconstruction did not include 12 workstreams.')
  if (controlledPacket.ownerAssignments.length !== 12) blockers.push('Phase 52G controlled internal test packet reconstruction did not include 12 owner assignments.')
  if (ownerPromptPackets.length !== 12) blockers.push('Phase 52G owner prompt reconstruction did not include 12 prompt packets.')
  warnings.push(...audit.warnings, ...baseEvidence.warnings)

  return {
    evidenceId: 'phase52h_cross_workstream_handoff_evidence',
    phase52GRunId: crossWorkstreamHandoffConfig.canonicalPhase52GRunId,
    phase52GPr: 219,
    phase52GStatus: 'completed',
    phase52GQa: 'passed',
    phase52GSupabaseSync: 'completed',
    phase52HReadinessFromPhase52G: 'ready_for_cross_workstream_handoff_tracking_or_owner_response_intake',
    phase52GArtifactPrefixes: {
      generatedAssets: `gs://${crossWorkstreamHandoffConfig.generatedAssetsBucket}/activation-agents/phase52g/${crossWorkstreamHandoffConfig.canonicalPhase52GRunId}`,
      qaArtifacts: `gs://${crossWorkstreamHandoffConfig.qaBucket}/activation-agents/phase52g/${crossWorkstreamHandoffConfig.canonicalPhase52GRunId}`,
    },
    workstreamDecisions,
    ownerPromptPackets,
    blockers: Array.from(new Set([...blockers, ...baseEvidence.blockers])),
    warnings: Array.from(new Set(warnings)),
  }
}
