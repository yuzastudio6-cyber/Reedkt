import {
  parseCanonicalCaptionPostrenderVisualQaWorkItemInput,
} from '../captions-specialist/caption-postrender-visual-qa-work-binding'
import type { ServiceContext } from '../types'
import {
  readCanonicalCaptionPostrenderVisualIntelligenceOwnerResult,
} from './canonical-caption-postrender-visual-intelligence-owner-result-port'
import {
  persistCanonicalCaptionPostrenderVisualIntelligenceEvidence,
} from './canonical-caption-postrender-visual-intelligence-evidence-repository'

export const CANONICAL_CAPTION_POSTRENDER_VISUAL_QA_COORDINATOR_SERVICE_VERSION =
  'canonical-caption-postrender-visual-qa-coordinator-service-v2' as const
export const CANONICAL_CAPTION_POSTRENDER_VISUAL_QA_COORDINATOR_RUNNER_CLASS =
  'canonical_caption_postrender_visual_intelligence_coordinator_runner_v2' as const

export async function prepareCanonicalCaptionPostrenderVisualQaExecution(input: {
  context: ServiceContext
  actorUserId: string
  workspaceId: string
  projectId: string
  editSessionId: string
  approvedSnapshotId: string
  approvedWorkItemId: string
  executionInput: Record<string, unknown>
}) {
  const workInput = parseCanonicalCaptionPostrenderVisualQaWorkItemInput(
    input.executionInput)
  const ownerResult =
    await readCanonicalCaptionPostrenderVisualIntelligenceOwnerResult({
    port: input.context
      .canonicalCaptionPostrenderVisualIntelligenceOwnerResultReadPort,
    locator: {
      ownerUserId: input.actorUserId,
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      editSessionId: input.editSessionId,
      approvedSnapshotId: input.approvedSnapshotId,
      approvedWorkItemId: input.approvedWorkItemId,
      outputId: workInput.outputId,
      confirmedOutputFrameRef: workInput.confirmedOutputFrameRef,
      requireCompleteRequestedRangeCoverage: true,
    },
  })
  const reconciliation =
    await persistCanonicalCaptionPostrenderVisualIntelligenceEvidence({
      repository: input.context
        .canonicalCaptionPostrenderVisualIntelligenceEvidenceRepository,
      result: ownerResult,
    })
  return {
    workInput,
    ownerResult,
    ...reconciliation,
  }
}
