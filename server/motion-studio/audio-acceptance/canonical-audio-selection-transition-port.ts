import type {
  CreateMotionStudioAudioIntegrationBindingRequestV1,
  CreateMotionStudioAudioSelectionRequestV1,
  MotionStudioAudioSelectionManifestV1,
} from '../../../src/types/motion-studio'
import type {
  CanonicalMotionStudioAudioIntegrationBindingReceipt,
  CanonicalMotionStudioAudioSelectionCommitReceipt,
  CanonicalMotionStudioAudioSelectionPreparedSource,
} from '../../validation/motion-studio-audio-acceptance-schemas'

export interface CanonicalMotionStudioAudioSelectionScope {
  workspaceId: string
  projectId: string
  editSessionId: string
  productionId: string
}

/**
 * One server-only boundary over canonical post-review audio authority.
 *
 * The implementation is responsible for re-reading released C/D evidence,
 * performing the forced tenant transaction, compare-and-swap, idempotency,
 * immutable selection persistence, and creating the two-job graph in the one
 * canonical package queue. This port is intentionally not a Motion-owned
 * database, queue, lease, candidate registry, or cost authority.
 */
export interface CanonicalMotionStudioAudioSelectionTransitionPort {
  findExplicitSelectionReplay(input: {
    scope: CanonicalMotionStudioAudioSelectionScope
    actorUserId: string
    request: CreateMotionStudioAudioSelectionRequestV1
    requestHash: string
    idempotencyKey: string
  }): Promise<CanonicalMotionStudioAudioSelectionCommitReceipt | undefined>

  prepareExplicitSelection(input: {
    scope: CanonicalMotionStudioAudioSelectionScope
    actorUserId: string
    selectedAt: string
    request: CreateMotionStudioAudioSelectionRequestV1
  }): Promise<CanonicalMotionStudioAudioSelectionPreparedSource | undefined>

  commitExplicitSelection(input: {
    scope: CanonicalMotionStudioAudioSelectionScope
    actorUserId: string
    request: CreateMotionStudioAudioSelectionRequestV1
    requestHash: string
    idempotencyKey: string
    sourceAuthorityDigest: string
    selectionManifest: MotionStudioAudioSelectionManifestV1
    selectionManifestDigest: string
  }): Promise<CanonicalMotionStudioAudioSelectionCommitReceipt>

  createOrReplayIntegrationBinding(input: {
    scope: CanonicalMotionStudioAudioSelectionScope
    actorUserId: string
    request: CreateMotionStudioAudioIntegrationBindingRequestV1
    requestHash: string
    idempotencyKey: string
  }): Promise<CanonicalMotionStudioAudioIntegrationBindingReceipt>
}
