import type {
  ApplyMotionStudioCommandRequest,
  MotionDNA,
  MotionStudioArtifactDto,
  MotionStudioVersionReference,
  PrepareStorytellingStoryContinuityRequest,
  StorytellingStoryContinuityGrammar,
  StorytellingStoryContinuityPreparationDto,
} from '../../../src/types/motion-studio'
import {
  MOTION_STUDIO_STORYTELLING_STORY_CONTINUITY_PREPARATION_VERSION,
} from '../../../src/types/motion-studio'
import type { JSONValue } from '../../../src/types/shared'
import {
  motionStudioMotionDnaSchema,
  motionStudioPreparedScriptSchema,
  motionStudioStoryBibleSchema,
  storytellingStoryContinuityPreparationDtoSchema,
} from '../../../src/lib/motion-studio/contracts'
import { ApiError } from '../../errors/api-error'
import type { ServiceContext } from '../../types'
import { createMotionStudioCommandService, type MotionStudioCommandService } from '../commands'
import { sha256CanonicalJson } from '../commands/canonical-json'
import {
  STORYTELLING_MOTION_STYLE_PROFILES,
  getStorytellingMotionStyleProfile,
  storytellingMotionStyleProfileReference,
} from './catalog'
import {
  compileStorytellingStoryContinuityGrammar,
  verifyStorytellingStoryContinuityGrammarDigest,
} from './story-continuity-grammar'
import { storytellingStyleSourceAuditDigests } from './planning-service'

const LOCAL_WARNING =
  'Story continuity is a protected local Motion DNA draft. It cannot approve a plan, execute providers or tools, spend credits, render, export, or deliver.'

type ContinuityCommandAuthority = Pick<
  MotionStudioCommandService,
  'applyCommand' | 'getArtifact' | 'getArtifactByKind' | 'getProductionById' | 'getProductionScopeById'
>

export interface StorytellingStoryContinuityPlanningServiceDependencies {
  commandAuthority?: ContinuityCommandAuthority
}

export class StorytellingStoryContinuityPlanningService {
  private readonly commandAuthority: ContinuityCommandAuthority

  constructor(context: ServiceContext, dependencies: StorytellingStoryContinuityPlanningServiceDependencies = {}) {
    this.commandAuthority = dependencies.commandAuthority ?? createMotionStudioCommandService(context)
  }

  async prepare(
    productionId: string,
    request: PrepareStorytellingStoryContinuityRequest,
    idempotencyKey: string,
  ) {
    const production = (await this.commandAuthority.getProductionById(productionId)).data.production
    const scope = await this.commandAuthority.getProductionScopeById(productionId)
    if (production.moduleId !== 'storytelling') {
      throw new ApiError(
        'MOTION_STUDIO_APPROVAL_BLOCKED',
        'Story continuity is available only for a Storytelling production.',
        409,
      )
    }
    if (scope.workspaceId !== request.workspaceId || scope.projectId !== production.projectId ||
        scope.editSessionId !== production.editSessionId || scope.productionId !== productionId) {
      throw new ApiError(
        'MOTION_STUDIO_CONFLICT',
        'Story continuity does not match this exact Storytelling workspace, project, edit, and production.',
        409,
      )
    }

    const [storyArtifact, scriptArtifact, motionDnaArtifact] = await Promise.all([
      this.commandAuthority.getArtifactByKind(productionId, 'story_bible'),
      this.commandAuthority.getArtifactByKind(productionId, 'prepared_script'),
      this.commandAuthority.getArtifactByKind(productionId, 'motion_dna'),
    ])
    const storyApproved = requireApprovedArtifact(storyArtifact.data.artifact, 'Story Bible')
    const scriptApproved = requireApprovedArtifact(scriptArtifact.data.artifact, 'Prepared Script')
    const storyBible = motionStudioStoryBibleSchema.parse(storyApproved.payload.data)
    const preparedScript = motionStudioPreparedScriptSchema.parse(scriptApproved.payload.data)
    const currentMotionDna = requireCurrentArtifact(motionDnaArtifact.data.artifact, 'Motion DNA')
    const motionDna = motionStudioMotionDnaSchema.parse(currentMotionDna.payload.data)
    const styleProfile = resolveMotionDnaStyle(motionDna)
    const referenceContractVersions = await this.readReferenceContractVersions(
      productionId,
      motionDna.referenceContractIds,
    )
    const grammar = compileStorytellingStoryContinuityGrammar({
      storyBible,
      storyBibleVersion: requireApprovedReference(storyArtifact.data.artifact, 'Story Bible'),
      preparedScript,
      preparedScriptVersion: requireApprovedReference(scriptArtifact.data.artifact, 'Prepared Script'),
      motionDna,
      styleProfile: storytellingMotionStyleProfileReference(styleProfile),
      referenceContractVersions,
      sourceAuditDigests: storytellingStyleSourceAuditDigests(styleProfile),
      proposal: request.proposal,
    })

    if (motionDna.storyContinuityGrammar?.grammarDigest === grammar.grammarDigest &&
        verifyStorytellingStoryContinuityGrammarDigest(motionDna.storyContinuityGrammar)) {
      return {
        data: { preparation: projectPreparation(
          production.projectId,
          production.editSessionId,
          styleProfile.displayName,
          grammar,
          requireCurrentReference(motionDnaArtifact.data.artifact, 'Motion DNA'),
        ) },
        warnings: [LOCAL_WARNING],
      }
    }

    const operations: ApplyMotionStudioCommandRequest['operations'] = [{
      operationId: 'storytelling-motion-dna-set-story-continuity-grammar',
      kind: 'set_property',
      targetPath: '/data/storyContinuityGrammar',
      value: structuredClone(grammar) as unknown as JSONValue,
      ...(motionDna.storyContinuityGrammar ? {
        expectedValueDigest: sha256CanonicalJson(motionDna.storyContinuityGrammar),
      } : {}),
    }]
    const command = await this.commandAuthority.applyCommand(
      productionId,
      motionDnaArtifact.data.artifact.id,
      {
        baseVersionId: currentMotionDna.id,
        baseVersionDigest: currentMotionDna.contentDigest,
        operations,
        reason: 'Bind the exact cross-scene Storytelling continuity grammar to the existing Motion DNA draft.',
      },
      `${idempotencyKey}:story-continuity:${grammar.grammarDigest}`,
      'director',
    )
    if (command.data.result.status !== 'applied') {
      throw new ApiError(
        'MOTION_STUDIO_CONFLICT',
        'Story continuity changed while the Motion DNA draft was being updated. Reopen the current plan and try again.',
        409,
      )
    }

    const readbackArtifact = (await this.commandAuthority.getArtifactByKind(
      productionId,
      'motion_dna',
    )).data.artifact
    const readbackVersion = requireCurrentArtifact(readbackArtifact, 'Motion DNA')
    const readbackMotionDna = motionStudioMotionDnaSchema.parse(readbackVersion.payload.data)
    if (readbackMotionDna.storyContinuityGrammar?.grammarDigest !== grammar.grammarDigest ||
        !verifyStorytellingStoryContinuityGrammarDigest(readbackMotionDna.storyContinuityGrammar)) {
      throw new ApiError(
        'MOTION_STUDIO_CONFLICT',
        'The Storytelling continuity grammar failed exact Motion DNA readback.',
        409,
      )
    }

    return {
      data: { preparation: projectPreparation(
        production.projectId,
        production.editSessionId,
        styleProfile.displayName,
        grammar,
        requireCurrentReference(readbackArtifact, 'Motion DNA'),
      ) },
      warnings: [LOCAL_WARNING],
    }
  }

  private async readReferenceContractVersions(
    productionId: string,
    artifactIds: readonly string[],
  ): Promise<readonly MotionStudioVersionReference[]> {
    const artifacts = await Promise.all(artifactIds.map(async (artifactId) =>
      (await this.commandAuthority.getArtifact(productionId, artifactId)).data.artifact))
    return artifacts.map((artifact) => requireCurrentReference(artifact, 'Reference Contract'))
  }
}

export function createStorytellingStoryContinuityPlanningService(context: ServiceContext) {
  return new StorytellingStoryContinuityPlanningService(context)
}

function resolveMotionDnaStyle(motionDna: MotionDNA) {
  const profile = STORYTELLING_MOTION_STYLE_PROFILES.find((candidate) =>
    motionDna.continuityRules.includes(
      `Style authority ${candidate.id}@${candidate.version}#${candidate.contentDigest}`,
    ))
  if (!profile) {
    throw new ApiError(
      'MOTION_STUDIO_APPROVAL_BLOCKED',
      'Select one exact Storytelling motion direction before preparing story continuity.',
      409,
    )
  }
  return getStorytellingMotionStyleProfile(profile.id)
}

function requireApprovedArtifact(artifact: MotionStudioArtifactDto, label: string) {
  const version = artifact.currentApproved
  if (!version || !['approved', 'locked'].includes(version.state)) {
    throw new ApiError(
      'MOTION_STUDIO_APPROVAL_BLOCKED',
      `${label} must be approved before story continuity can enter Plan Review.`,
      409,
    )
  }
  return version
}

function requireApprovedReference(
  artifact: MotionStudioArtifactDto,
  label: string,
): MotionStudioVersionReference {
  requireApprovedArtifact(artifact, label)
  if (!artifact.currentApprovedVersion) {
    throw new ApiError('MOTION_STUDIO_CONFLICT', `${label} approved version reference is missing.`, 409)
  }
  return artifact.currentApprovedVersion
}

function requireCurrentArtifact(artifact: MotionStudioArtifactDto, label: string) {
  const version = artifact.currentDraft ?? artifact.currentApproved
  if (!version) throw new ApiError('MOTION_STUDIO_CONFLICT', `${label} has no readable current version.`, 409)
  return version
}

function requireCurrentReference(
  artifact: MotionStudioArtifactDto,
  label: string,
): MotionStudioVersionReference {
  const reference = artifact.currentDraftVersion ?? artifact.currentApprovedVersion
  if (!reference) throw new ApiError('MOTION_STUDIO_CONFLICT', `${label} has no readable current version reference.`, 409)
  return reference
}

function projectPreparation(
  projectId: string,
  editSessionId: string,
  styleDisplayName: string,
  grammar: StorytellingStoryContinuityGrammar,
  motionDnaVersion: MotionStudioVersionReference,
): StorytellingStoryContinuityPreparationDto {
  return deepFreeze(storytellingStoryContinuityPreparationDtoSchema.parse({
    schemaVersion: MOTION_STUDIO_STORYTELLING_STORY_CONTINUITY_PREPARATION_VERSION,
    productionId: grammar.productionId,
    projectId,
    editSessionId,
    state: 'ready_for_plan_review',
    styleDisplayName,
    arcMode: grammar.arc.mode,
    throughLineMode: grammar.throughLine.mode,
    throughLineAppearanceCount: grammar.throughLine.mode === 'recurring_motif'
      ? grammar.throughLine.appearances.length
      : 0,
    revealBeatCount: grammar.revealBeats.length,
    transitionCount: grammar.transitionContinuity.length,
    rhythmBeatCount: grammar.rhythmBeats.length,
    motionDnaVersion,
    planReviewIsSoleApprovalAuthority: true,
    customerPriceCalculatedHere: false,
    customerCreditsMutated: false,
    runtimeExecutionAuthorized: false,
    localCandidateOnly: true,
  }))
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child)
  }
  return value
}
