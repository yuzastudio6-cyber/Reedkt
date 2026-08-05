import {
  parseCanonicalCaptionPostrenderVisualQaWorkItemInput,
} from '../captions-specialist/caption-postrender-visual-qa-work-binding'
import type { ServiceContext } from '../types'
import {
  readCanonicalCaptionPostrenderVisualQaOwnerResult,
} from './canonical-caption-postrender-visual-qa-owner-result-port'
import {
  reconcileCanonicalCaptionPostrenderVisualQaOwnerResult,
} from './canonical-caption-postrender-visual-qa-reconciliation-service'

export const CANONICAL_CAPTION_POSTRENDER_VISUAL_QA_COORDINATOR_SERVICE_VERSION =
  'canonical-caption-postrender-visual-qa-coordinator-service-v1' as const
export const CANONICAL_CAPTION_POSTRENDER_VISUAL_QA_COORDINATOR_RUNNER_CLASS =
  'canonical_caption_postrender_visual_qa_coordinator_runner_v1' as const

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
  const ownerResult = await readCanonicalCaptionPostrenderVisualQaOwnerResult({
    port: input.context.canonicalCaptionPostrenderVisualQaOwnerResultReadPort,
    locator: {
      ownerUserId: input.actorUserId,
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      editSessionId: input.editSessionId,
      approvedSnapshotId: input.approvedSnapshotId,
      approvedWorkItemId: input.approvedWorkItemId,
      outputId: workInput.outputId,
      confirmedOutputFrameRef: workInput.confirmedOutputFrameRef,
      requireCompleteTimeCoverage: true,
    },
  })
  const reconciliation =
    await reconcileCanonicalCaptionPostrenderVisualQaOwnerResult({
      repository:
        input.context.canonicalCaptionPostrenderVisualQaEvidenceRepository,
      ownerUserId: input.actorUserId,
      ownerResult,
    })
  return {
    workInput,
    ownerResult,
    ...reconciliation,
  }
}
