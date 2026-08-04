import {
  motionStudioMotionDnaSchema,
  motionStudioPreparedScriptSchema,
  motionStudioStoryBibleSchema,
  storytellingStoryContinuityReviewDtoSchema,
} from '../../../src/lib/motion-studio/contracts'
import type {
  MotionStudioArtifactDto,
  MotionStudioArtifactVersionDto,
  MotionStudioProductionDto,
  MotionStudioVersionReference,
  StorytellingStoryContinuityGrammar,
  StorytellingStoryContinuityReviewDto,
} from '../../../src/types/motion-studio'
import { MOTION_STUDIO_STORYTELLING_STORY_CONTINUITY_REVIEW_VERSION } from '../../../src/types/motion-studio'
import { verifyStorytellingStoryContinuityGrammarDigest } from './story-continuity-grammar'

const notice = 'This read-only story-flow status cannot approve a plan, generate media, use credits, render, export, or deliver.'

/**
 * Projects the current Motion DNA continuity grammar into bounded product copy.
 * Artifact identities, digests, compiler detail, providers, jobs, and monetary
 * evidence are deliberately omitted from the browser result.
 */
export function projectStorytellingStoryContinuityReview(input: {
  production: MotionStudioProductionDto
  storyArtifact?: MotionStudioArtifactDto
  scriptArtifact?: MotionStudioArtifactDto
  motionDnaArtifact?: MotionStudioArtifactDto
}): StorytellingStoryContinuityReviewDto {
  const motionDnaAuthority = input.motionDnaArtifact
    ? currentArtifactAuthority(input.production, input.motionDnaArtifact, 'motion_dna')
    : undefined
  if (!motionDnaAuthority) return unprepared('not_ready')

  const motionDna = motionStudioMotionDnaSchema.parse(motionDnaAuthority.version.payload.data)
  assertProductionScope(input.production, motionDna)
  const grammar = motionDna.storyContinuityGrammar
  const storyAuthority = input.storyArtifact
    ? currentArtifactAuthority(input.production, input.storyArtifact, 'story_bible')
    : undefined
  const scriptAuthority = input.scriptArtifact
    ? currentArtifactAuthority(input.production, input.scriptArtifact, 'prepared_script')
    : undefined
  const storyBible = storyAuthority
    ? motionStudioStoryBibleSchema.parse(storyAuthority.version.payload.data)
    : undefined
  const preparedScript = scriptAuthority
    ? motionStudioPreparedScriptSchema.parse(scriptAuthority.version.payload.data)
    : undefined
  if (storyBible) assertProductionScope(input.production, storyBible)
  if (preparedScript) assertProductionScope(input.production, preparedScript)
  assertSharedWorkspaceScope(motionDna.workspaceId, storyBible?.workspaceId, preparedScript?.workspaceId)

  if (!grammar) {
    return storyAuthority && scriptAuthority &&
      isApprovedOrLocked(storyAuthority.version.state) &&
      isApprovedOrLocked(scriptAuthority.version.state)
      ? unprepared('needs_preparation')
      : unprepared('not_ready')
  }
  if (!verifyStorytellingStoryContinuityGrammarDigest(grammar)) {
    throw new Error('Story Continuity Grammar failed exact digest verification.')
  }
  assertGrammarScope(input.production, motionDna.workspaceId, grammar)

  const stale = !storyAuthority || !scriptAuthority ||
    !isApprovedOrLocked(storyAuthority.version.state) ||
    !isApprovedOrLocked(scriptAuthority.version.state) ||
    !sameVersion(grammar.storyBibleVersion, storyAuthority.reference) ||
    !sameVersion(grammar.preparedScriptVersion, scriptAuthority.reference)
  if (stale) return prepared(grammar, 'stale')

  const approvedLocked = isApprovedOrLocked(motionDnaAuthority.version.state)
  return prepared(grammar, approvedLocked ? 'approved_locked' : 'ready_for_plan_review')
}

function unprepared(
  state: Extract<StorytellingStoryContinuityReviewDto['state'], 'not_ready' | 'needs_preparation'>,
): StorytellingStoryContinuityReviewDto {
  const content = state === 'not_ready'
    ? {
        statusLabel: 'Story flow not ready',
        title: 'Finish the story and timed script first',
        summary: 'Story continuity becomes available after the exact story, timed script, and motion direction are ready.',
        nextAction: { kind: 'continue_in_chat' as const, label: 'Continue shaping the story in Chat' },
      }
    : {
        statusLabel: 'Story flow needed',
        title: 'Structure the story flow before Plan Review',
        summary: 'The story and timed script are ready, but their opening, payoff, through-line, and scene transitions are not bound yet.',
        nextAction: { kind: 'continue_in_chat' as const, label: 'Structure the story flow in Chat' },
      }
  return storytellingStoryContinuityReviewDtoSchema.parse({
    schemaVersion: MOTION_STUDIO_STORYTELLING_STORY_CONTINUITY_REVIEW_VERSION,
    state,
    ...content,
    throughLineAppearanceCount: 0,
    revealBeatCount: 0,
    transitionCount: 0,
    rhythmBeatCount: 0,
    unresolvedUncertaintyCount: 0,
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
  grammar: StorytellingStoryContinuityGrammar,
  state: Extract<StorytellingStoryContinuityReviewDto['state'], 'ready_for_plan_review' | 'approved_locked' | 'stale'>,
): StorytellingStoryContinuityReviewDto {
  const arcLabel = arcModeLabel(grammar.arc.mode)
  const throughLineLabel = grammar.throughLine.mode === 'recurring_motif'
    ? grammar.throughLine.label
    : 'No recurring motif'
  const content = state === 'ready_for_plan_review'
    ? {
        statusLabel: 'Ready for Plan Review',
        title: `${arcLabel} is prepared`,
        summary: 'The opening, payoff, story thread, and scene transitions are bound to the current story and timed script.',
        nextAction: { kind: 'review_plan' as const, label: 'Review with the current plan' },
      }
    : state === 'approved_locked'
      ? {
          statusLabel: 'Approved story flow',
          title: `${arcLabel} is locked to the approved plan`,
          summary: 'The exact story flow is preserved with the approved version. Revisions return through Chat and require a new plan.',
          nextAction: { kind: 'request_revision_in_chat' as const, label: 'Request a story-flow revision in Chat' },
        }
      : {
          statusLabel: 'New plan required',
          title: 'Story flow no longer matches the current story',
          summary: 'The earlier story flow remains preserved, but the changed story, script, or motion direction requires a fresh Plan Review.',
          nextAction: { kind: 'continue_replanning' as const, label: 'Continue replanning in Chat' },
        }

  return storytellingStoryContinuityReviewDtoSchema.parse({
    schemaVersion: MOTION_STUDIO_STORYTELLING_STORY_CONTINUITY_REVIEW_VERSION,
    state,
    ...content,
    arcMode: grammar.arc.mode,
    arcLabel,
    throughLineMode: grammar.throughLine.mode,
    throughLineLabel,
    throughLineAppearanceCount: grammar.throughLine.mode === 'recurring_motif'
      ? grammar.throughLine.appearances.length
      : 0,
    revealBeatCount: grammar.revealBeats.length,
    transitionCount: grammar.transitionContinuity.length,
    rhythmBeatCount: grammar.rhythmBeats.length,
    unresolvedUncertaintyCount: grammar.arc.unresolvedUncertainty.length,
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

function currentArtifactAuthority(
  production: MotionStudioProductionDto,
  artifact: MotionStudioArtifactDto,
  expectedKind: 'story_bible' | 'prepared_script' | 'motion_dna',
): { version: MotionStudioArtifactVersionDto; reference: MotionStudioVersionReference } {
  if (artifact.kind !== expectedKind) throw new Error(`Expected ${expectedKind} artifact authority.`)
  const version = artifact.currentDraft ?? artifact.currentApproved
  const reference = artifact.currentDraftVersion ?? artifact.currentApprovedVersion
  if (!version || !reference || artifact.productionId !== production.id ||
      version.productionId !== production.id || version.kind !== expectedKind ||
      version.artifactId !== artifact.id || reference.artifactId !== artifact.id ||
      version.id !== reference.versionId || version.versionNumber !== reference.versionNumber ||
      version.contentDigest !== reference.contentDigest) {
    throw new Error(`Current ${expectedKind} version authority is inconsistent.`)
  }
  return { version, reference }
}

function assertSharedWorkspaceScope(
  motionDnaWorkspaceId: string,
  storyWorkspaceId: string | undefined,
  scriptWorkspaceId: string | undefined,
): void {
  if ((storyWorkspaceId && storyWorkspaceId !== motionDnaWorkspaceId) ||
      (scriptWorkspaceId && scriptWorkspaceId !== motionDnaWorkspaceId)) {
    throw new Error('Story continuity changed its exact workspace identity.')
  }
}

function assertProductionScope(
  production: MotionStudioProductionDto,
  motionDna: { projectId: string; editSessionId: string; productionId: string },
): void {
  if (motionDna.projectId !== production.projectId ||
      motionDna.editSessionId !== production.editSessionId ||
      motionDna.productionId !== production.id) {
    throw new Error('Story continuity does not match this exact Storytelling production.')
  }
}

function assertGrammarScope(
  production: MotionStudioProductionDto,
  workspaceId: string,
  grammar: StorytellingStoryContinuityGrammar,
): void {
  if (grammar.workspaceId !== workspaceId || grammar.projectId !== production.projectId ||
      grammar.editSessionId !== production.editSessionId || grammar.productionId !== production.id) {
    throw new Error('Story Continuity Grammar changed its exact Storytelling identity.')
  }
}

function sameVersion(left: MotionStudioVersionReference, right: MotionStudioVersionReference): boolean {
  return left.artifactId === right.artifactId && left.versionId === right.versionId &&
    left.versionNumber === right.versionNumber && left.contentDigest === right.contentDigest
}

function isApprovedOrLocked(state: MotionStudioArtifactVersionDto['state']): boolean {
  return state === 'approved' || state === 'locked'
}

function arcModeLabel(mode: StorytellingStoryContinuityGrammar['arc']['mode']): string {
  const labels: Record<StorytellingStoryContinuityGrammar['arc']['mode'], string> = {
    question_resolution: 'Question to resolution',
    thesis_evidence: 'Thesis to evidence',
    chronology_consequence: 'Chronology to consequence',
    character_transformation: 'Character transformation',
  }
  return labels[mode]
}
