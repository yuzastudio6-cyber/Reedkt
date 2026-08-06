import {
  storytellingSceneContinuityReviewDtoSchema,
  storytellingSceneContinuitySliceSchema,
} from '../../../src/lib/motion-studio/contracts'
import type {
  MotionStudioArtifactVersionState,
  MotionStudioOwnership,
  MotionStudioVersionReference,
  SceneDocument,
  StorytellingSceneContinuityReviewDto,
  StorytellingSceneContinuitySlice,
} from '../../../src/types/motion-studio'
import { MOTION_STUDIO_STORYTELLING_SCENE_CONTINUITY_REVIEW_VERSION } from '../../../src/types/motion-studio'
import { verifyStorytellingSceneContinuitySliceDigest } from './story-continuity-grammar'

export interface StorytellingSceneContinuityCurrentAuthority extends MotionStudioOwnership {
  productionId: string
  motionDnaVersion: MotionStudioVersionReference
  preparedScriptVersion: MotionStudioVersionReference
  grammarDigest: string
}

const notice = 'This read-only scene-flow status cannot approve a plan, generate media, use credits, apply a timeline change, render, export, or deliver.'

/**
 * Reduces one exact SceneDocument continuity slice to bounded product copy.
 * The browser never receives source versions, grammar/slice digests,
 * transition targets, provider routes, job identities, or cost evidence.
 */
export function projectStorytellingSceneContinuityReview(input: {
  scope: MotionStudioOwnership & { productionId: string }
  sceneDocument: SceneDocument
  sceneDocumentState: MotionStudioArtifactVersionState
  currentAuthority?: StorytellingSceneContinuityCurrentAuthority
  currentApprovedSnapshot?: { id: string; timingAuthorityDigest: string }
}): StorytellingSceneContinuityReviewDto {
  const slice = input.sceneDocument.storyContinuity
  if (!slice) return unprepared(Boolean(input.currentAuthority))

  const continuity = storytellingSceneContinuitySliceSchema.parse(structuredClone(slice))
  if (!verifyStorytellingSceneContinuitySliceDigest(continuity)) {
    throw new Error('Scene continuity failed exact digest verification.')
  }
  assertExactScope(input.scope, input.sceneDocument, continuity)

  const stale = !input.currentAuthority || !input.currentApprovedSnapshot ||
    !sameScope(input.scope, input.currentAuthority) ||
    !sameVersion(continuity.sourceMotionDnaVersion, input.currentAuthority.motionDnaVersion) ||
    !sameVersion(continuity.sourcePreparedScriptVersion, input.currentAuthority.preparedScriptVersion) ||
    continuity.sourceGrammarDigest !== input.currentAuthority.grammarDigest ||
    input.sceneDocument.approvedSnapshotId !== input.currentApprovedSnapshot.id ||
    input.sceneDocument.timingAuthority.timingAuthorityDigest !== input.currentApprovedSnapshot.timingAuthorityDigest ||
    input.sceneDocumentState === 'superseded' || input.sceneDocumentState === 'archived'

  const state: Exclude<StorytellingSceneContinuityReviewDto['state'], 'not_ready'> = stale
    ? 'stale'
    : ['approved', 'locked'].includes(input.sceneDocumentState)
      ? 'approved_locked'
      : ['in_review', 'rejected'].includes(input.sceneDocumentState)
        ? 'needs_review'
        : 'ready_for_review'
  return prepared(continuity, state)
}

function unprepared(currentStoryFlowExists: boolean): StorytellingSceneContinuityReviewDto {
  return storytellingSceneContinuityReviewDtoSchema.parse({
    schemaVersion: MOTION_STUDIO_STORYTELLING_SCENE_CONTINUITY_REVIEW_VERSION,
    state: 'not_ready',
    statusLabel: 'Not bound',
    title: currentStoryFlowExists ? 'Bind this scene to the current story flow' : 'Prepare the story flow before this scene',
    summary: currentStoryFlowExists
      ? 'The current story flow is ready, but this scene does not yet carry its arc role, through-line, reveals, transitions, and rhythm.'
      : 'Continue in Chat until the story, timed script, and motion direction have one reviewable story flow.',
    throughLineAppearanceCount: 0,
    revealBeatCount: 0,
    transitionCount: 0,
    rhythmBeatCount: 0,
    unresolvedUncertaintyCount: 0,
    nextAction: { kind: 'continue_in_chat', label: 'Continue shaping the scene in Chat' },
    reviewRequired: false,
    planReviewIsSoleApprovalAuthority: true,
    approvedLocked: false,
    priorApprovedVersionPreserved: true,
    approvedSnapshotMutationAllowed: false,
    readOnly: true,
    runtimeExecutionAuthorized: false,
    localCandidateOnly: true,
    notice,
  })
}

function prepared(
  continuity: StorytellingSceneContinuitySlice,
  state: Exclude<StorytellingSceneContinuityReviewDto['state'], 'not_ready'>,
): StorytellingSceneContinuityReviewDto {
  const arcRoleLabel = roleLabel(continuity.arc.role)
  const throughLineLabel = continuity.throughLine.mode === 'recurring_motif'
    ? continuity.throughLine.label
    : 'No recurring motif'
  const content = state === 'ready_for_review'
    ? {
        statusLabel: 'Ready for review',
        title: `${arcRoleLabel} flow is ready to review`,
        summary: 'This scene carries the current story arc, through-line, reveal, transition, and rhythm authority.',
        nextAction: { kind: 'review_scene' as const, label: 'Review this scene flow' },
      }
    : state === 'needs_review'
      ? {
          statusLabel: 'Needs review',
          title: `${arcRoleLabel} flow needs attention`,
          summary: 'Review this scene against the current story before preparing further Timeline or preview work.',
          nextAction: { kind: 'review_scene' as const, label: 'Review this scene flow' },
        }
      : state === 'approved_locked'
        ? {
            statusLabel: 'Approved and locked',
            title: `${arcRoleLabel} flow is locked`,
            summary: 'This scene continuity is preserved with the approved plan. Revisions return through Chat and require a new plan.',
            nextAction: { kind: 'request_revision_in_chat' as const, label: 'Request a scene-flow revision in Chat' },
          }
        : {
            statusLabel: 'New plan required',
            title: 'Scene flow no longer matches the current story',
            summary: 'The prior scene flow remains preserved, but the story, script, Motion DNA, timing, or approved plan changed.',
            nextAction: { kind: 'continue_replanning' as const, label: 'Continue replanning in Chat' },
          }

  return storytellingSceneContinuityReviewDtoSchema.parse({
    schemaVersion: MOTION_STUDIO_STORYTELLING_SCENE_CONTINUITY_REVIEW_VERSION,
    state,
    ...content,
    arcRole: continuity.arc.role,
    arcRoleLabel,
    throughLineMode: continuity.throughLine.mode,
    throughLineLabel,
    throughLineAppearanceCount: continuity.throughLine.mode === 'recurring_motif'
      ? continuity.throughLine.appearances.length
      : 0,
    revealBeatCount: continuity.revealBeats.length,
    transitionCount: Number(Boolean(continuity.incomingTransition)) + Number(Boolean(continuity.outgoingTransition)),
    rhythmBeatCount: continuity.rhythmBeats.length,
    unresolvedUncertaintyCount: continuity.arc.unresolvedUncertainty.length,
    reviewRequired: state === 'ready_for_review' || state === 'needs_review',
    planReviewIsSoleApprovalAuthority: true,
    approvedLocked: state === 'approved_locked',
    priorApprovedVersionPreserved: true,
    approvedSnapshotMutationAllowed: false,
    readOnly: true,
    runtimeExecutionAuthorized: false,
    localCandidateOnly: true,
    notice,
  })
}

function assertExactScope(
  scope: MotionStudioOwnership & { productionId: string },
  document: SceneDocument,
  continuity: StorytellingSceneContinuitySlice,
): void {
  if (!sameScope(scope, document) || !sameScope(scope, continuity) ||
      document.productionId !== scope.productionId || continuity.productionId !== scope.productionId ||
      continuity.sceneId !== document.sceneId) {
    throw new Error('Scene continuity changed its exact Storytelling scene identity.')
  }
}

function sameScope(left: MotionStudioOwnership, right: MotionStudioOwnership): boolean {
  return left.workspaceId === right.workspaceId && left.projectId === right.projectId &&
    left.editSessionId === right.editSessionId
}

function sameVersion(left: MotionStudioVersionReference, right: MotionStudioVersionReference): boolean {
  return left.artifactId === right.artifactId && left.versionId === right.versionId &&
    left.versionNumber === right.versionNumber && left.contentDigest === right.contentDigest
}

function roleLabel(role: StorytellingSceneContinuitySlice['arc']['role']): string {
  const labels: Record<StorytellingSceneContinuitySlice['arc']['role'], string> = {
    opening: 'Opening',
    development: 'Development',
    resolution: 'Resolution',
    opening_and_resolution: 'Opening and resolution',
  }
  return labels[role]
}
