import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import {
  CANONICAL_MOTION_STUDIO_STORYTELLING_PRODUCTION_AUTHORITY_READER_VERSION,
  canonicalMotionStudioStorytellingProductionAuthorityMatchesScope,
  canonicalMotionStudioStorytellingProductionAuthoritySchema,
  type CanonicalMotionStudioStorytellingProductionAuthority,
} from '../validation/canonical-motion-studio-storytelling-production-authority-schemas'
import {
  ideaFirstSourceBindingManifestCandidateSchema,
  type IdeaFirstSourceBindingManifestCandidate,
} from '../validation/source-media-authority-schemas'
import { sha256AuthorityValue, stableAuthorityStringify } from './private-edit-authority-store'

export interface CanonicalMotionStudioStorytellingProductionAuthorityReaderPort {
  readonly schemaVersion:
    typeof CANONICAL_MOTION_STUDIO_STORYTELLING_PRODUCTION_AUTHORITY_READER_VERSION
  readonly sourceAuthority: 'motion_studio_storytelling_artifact_repository'
  readonly evidenceClass: 'controlled_local_source_verified_non_promotable'
  readonly productionReady: false
  readAndVerifyAuthority(input: {
    workspaceId: string
    projectId: string
    editSessionId: string
    productionId: string
    expectedComponentProposalDigest: string
    expectedAuthorityHash: string
  }): Promise<unknown>
}

export async function revalidateCanonicalMotionStudioStorytellingProductionAuthority(input: {
  context: ServiceContext
  authority: CanonicalMotionStudioStorytellingProductionAuthority | undefined
  expectedScope: { workspaceId: string; projectId: string; editSessionId: string }
}): Promise<CanonicalMotionStudioStorytellingProductionAuthority | undefined> {
  if (!input.authority) return undefined
  const authority = canonicalMotionStudioStorytellingProductionAuthoritySchema.parse(input.authority)
  if (!canonicalMotionStudioStorytellingProductionAuthorityMatchesScope(
    authority,
    input.expectedScope,
  )) {
    throw conflict('Storytelling production authority belongs to another workspace, project, or named edit.')
  }
  const reader = input.context.canonicalMotionStudioStorytellingProductionAuthorityReaderPort
  if (
    !reader ||
    reader.schemaVersion !==
      CANONICAL_MOTION_STUDIO_STORYTELLING_PRODUCTION_AUTHORITY_READER_VERSION ||
    reader.sourceAuthority !== 'motion_studio_storytelling_artifact_repository' ||
    reader.evidenceClass !== 'controlled_local_source_verified_non_promotable' ||
    reader.productionReady !== false
  ) {
    throw blocked(
      'Canonical idea-first Storytelling planning is blocked until the server can re-read its exact approved Motion artifacts.',
    )
  }
  const reloaded = await reader.readAndVerifyAuthority({
    ...input.expectedScope,
    productionId: authority.productionId,
    expectedComponentProposalDigest:
      authority.sourceProposal.componentProposalDigest,
    expectedAuthorityHash: authority.authorityHash,
  })
  const parsed = canonicalMotionStudioStorytellingProductionAuthoritySchema.safeParse(reloaded)
  if (
    !parsed.success ||
    stableAuthorityStringify(parsed.data) !== stableAuthorityStringify(authority)
  ) {
    throw conflict(
      'Storytelling production authority changed or could not be source-verified; create a fresh plan and estimate.',
    )
  }
  return parsed.data
}

export function buildCanonicalIdeaFirstSourceBindingManifestCandidate(
  value: CanonicalMotionStudioStorytellingProductionAuthority,
): IdeaFirstSourceBindingManifestCandidate {
  const authority = canonicalMotionStudioStorytellingProductionAuthoritySchema.parse(value)
  const candidateWithoutHash = {
    schemaVersion: 'private-idea-first-source-authority-candidate-v1' as const,
    authorityStatus: 'unapproved_idea_first_storytelling_candidate' as const,
    executionAuthorized: false as const,
    approvedSnapshotMutated: false as const,
    noRuntimeSideEffects: true as const,
    workspaceId: authority.workspaceId,
    projectId: authority.projectId,
    editSessionId: authority.editSessionId,
    productionId: authority.productionId,
    sourceMode: 'idea_first_no_uploaded_media' as const,
    authorityRevision: authority.sourceVerification.sourceRepositoryRevision,
    authorityChecksumSha256: authority.sourceVerification.sourceRepositoryReadDigest,
    sourceSequenceHash: sha256AuthorityValue([]),
    productionAuthorityHash: authority.authorityHash,
    sourceProposalDigest: authority.sourceProposal.componentProposalDigest,
    sourceArtifactApprovalSnapshotId: authority.sourceArtifactApprovalSnapshotId,
    bindings: [] as [],
    requiredBindingCount: 0 as const,
    fabricatedUploadRecordCount: 0 as const,
  }
  return ideaFirstSourceBindingManifestCandidateSchema.parse({
    ...candidateWithoutHash,
    candidateHash: sha256AuthorityValue(candidateWithoutHash),
  })
}

function blocked(message: string): ApiError {
  return new ApiError('TOOL_NOT_READY', message, 503, {
    requiredGate: 'canonical_motion_studio_storytelling_production_authority_reader',
    productionReady: false,
  })
}

function conflict(message: string): ApiError {
  return new ApiError('IDEMPOTENCY_CONFLICT', message, 409, {
    requiredGate: 'exact_source_verified_idea_first_storytelling_authority',
  })
}
