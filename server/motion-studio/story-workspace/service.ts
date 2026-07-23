import {
  motionStudioPreparedScriptSchema,
  motionStudioStoryBibleSchema,
  motionStudioStoryWorkspaceDtoSchema,
} from '../../../src/lib/motion-studio/contracts'
import type {
  MotionStudioArtifactDto,
  MotionStudioArtifactKind,
  MotionStudioArtifactVersionDto,
  MotionStudioPreparedScriptDto,
  MotionStudioProductionDto,
  MotionStudioStoryBibleDto,
  MotionStudioStoryVersionAuthorityDto,
  MotionStudioStoryWorkspaceDto,
  PreparedScript,
  StoryBible,
  StorytellingMotionStyleDecisionDto,
  StyleCalibrationPlan,
} from '../../../src/types/motion-studio'
import { ApiError } from '../../errors/api-error'
import type { ServiceContext } from '../../types'
import { createMotionStudioCommandService, type MotionStudioCommandService } from '../commands'
import {
  createStorytellingMotionStyleReview,
  projectStorytellingStyleCalibrationReview,
  projectStorytellingMotionStyleDecision,
  projectStorytellingStoryContinuityReview,
  type StorytellingStyleCalibrationEvidenceSource,
  type StorytellingStyleCanonicalCalibrationSource,
  type StorytellingMotionStyleDecisionSource,
} from '../style-system'
import { createCanonicalStorytellingStyleReviewSource } from '../style-system/canonical-style-review-source'

const STORY_WORKSPACE_WARNING =
  'The Story workspace is a read-only projection of exact Story Bible and Prepared Script versions plus source-verified motion-style and private calibration review state. It cannot select or approve a style, approve a plan, use credits, call a provider, generate media, mutate a timeline, render, export, or deliver.'

type StoryCommandAuthority = Pick<
  MotionStudioCommandService,
  'getProductionById' | 'getArtifactByKind'
>

export interface MotionStudioStoryWorkspaceServiceDependencies {
  commandAuthority?: StoryCommandAuthority
  styleDecisionAuthority?: {
    getStyleDecisionSource(productionId: string): Promise<StorytellingMotionStyleDecisionSource | undefined>
  }
  styleCalibrationAuthority?: {
    getCalibrationEvidenceSource(productionId: string): Promise<StorytellingStyleCalibrationEvidenceSource | undefined>
  }
}

export class MotionStudioStoryWorkspaceService {
  private readonly commandAuthority: StoryCommandAuthority
  private readonly styleDecisionAuthority?: MotionStudioStoryWorkspaceServiceDependencies['styleDecisionAuthority']
  private readonly styleCalibrationAuthority?: MotionStudioStoryWorkspaceServiceDependencies['styleCalibrationAuthority']

  constructor(context: ServiceContext, dependencies: MotionStudioStoryWorkspaceServiceDependencies = {}) {
    this.commandAuthority = dependencies.commandAuthority ?? createMotionStudioCommandService(context)
    this.styleDecisionAuthority = dependencies.styleDecisionAuthority
    this.styleCalibrationAuthority = dependencies.styleCalibrationAuthority
  }

  async getWorkspace(productionId: string) {
    const production = (await this.commandAuthority.getProductionById(productionId)).data.production
    const [storyArtifact, scriptArtifact, motionDnaArtifact, styleDecisionSource, styleCalibrationEvidenceSource] = await Promise.all([
      this.readOptionalArtifact(productionId, 'story_bible'),
      this.readOptionalArtifact(productionId, 'prepared_script'),
      this.readOptionalArtifact(productionId, 'motion_dna'),
      this.styleDecisionAuthority?.getStyleDecisionSource(productionId),
      this.styleCalibrationAuthority?.getCalibrationEvidenceSource(productionId),
    ])
    const storyWorkspace = this.compileWorkspace(
      production,
      storyArtifact,
      scriptArtifact,
      motionDnaArtifact,
      styleDecisionSource,
      styleCalibrationEvidenceSource,
    )
    return { data: { storyWorkspace }, warnings: [STORY_WORKSPACE_WARNING] }
  }

  private async readOptionalArtifact(
    productionId: string,
    kind: Extract<MotionStudioArtifactKind, 'story_bible' | 'prepared_script' | 'motion_dna'>,
  ): Promise<MotionStudioArtifactDto | undefined> {
    try {
      return (await this.commandAuthority.getArtifactByKind(productionId, kind)).data.artifact
    } catch (error) {
      if (error instanceof ApiError && error.code === 'MOTION_STUDIO_NOT_FOUND') return undefined
      throw error
    }
  }

  private compileWorkspace(
    production: MotionStudioProductionDto,
    storyArtifact: MotionStudioArtifactDto | undefined,
    scriptArtifact: MotionStudioArtifactDto | undefined,
    motionDnaArtifact: MotionStudioArtifactDto | undefined,
    styleDecisionSource: StorytellingMotionStyleDecisionSource | undefined,
    styleCalibrationEvidenceSource: StorytellingStyleCalibrationEvidenceSource | undefined,
  ): MotionStudioStoryWorkspaceDto {
    if (scriptArtifact && !storyArtifact) {
      internalInvalid('Prepared Script exists without the required Story Bible authority.')
    }

    const storyBible = storyArtifact ? compileStoryBible(production, storyArtifact) : undefined
    const preparedScript = scriptArtifact ? compilePreparedScript(production, scriptArtifact) : undefined
    const state = !storyBible
      ? 'empty'
      : !preparedScript
        ? 'story_ready'
        : isApprovedOrLocked(storyBible.versionState) && isApprovedOrLocked(preparedScript.versionState)
          ? 'approved_read_only'
          : 'script_ready'

    const motionStyleReview = createStorytellingMotionStyleReview()
    const motionStyleDecision: StorytellingMotionStyleDecisionDto =
      projectStorytellingMotionStyleDecision(
        motionStyleReview,
        styleDecisionSource ?? { state: 'comparison_only' },
        {
          projectId: production.projectId,
          editSessionId: production.editSessionId,
          productionId: production.id,
        },
      )
    const styleCalibrationReview = projectStorytellingStyleCalibrationReview({
      decision: motionStyleDecision,
      identity: {
        projectId: production.projectId,
        editSessionId: production.editSessionId,
        productionId: production.id,
      },
      plan: calibrationPlanFromStyleDecisionSource(styleDecisionSource),
      canonicalSource: canonicalCalibrationSourceFromStyleDecisionSource(
        styleDecisionSource,
      ),
      evidence: styleCalibrationEvidenceSource,
    })
    const storyContinuityReview = projectStorytellingStoryContinuityReview({
      production,
      storyArtifact,
      scriptArtifact,
      motionDnaArtifact,
    })
    const workspace: MotionStudioStoryWorkspaceDto = {
      productionId: production.id,
      projectId: production.projectId,
      editSessionId: production.editSessionId,
      state,
      ...(storyBible ? { storyBible } : {}),
      ...(preparedScript ? { preparedScript } : {}),
      motionStyleReview,
      motionStyleDecision,
      storyContinuityReview,
      styleCalibrationReview,
      readOnly: true,
      notice: noticeForState(state),
      localCandidateOnly: true,
    }
    const parsed = motionStudioStoryWorkspaceDtoSchema.safeParse(workspace)
    if (!parsed.success) internalInvalid('Story workspace violated its strict browser-safe contract.')
    return parsed.data
  }
}

function calibrationPlanFromStyleDecisionSource(
  source: StorytellingMotionStyleDecisionSource | undefined,
): StyleCalibrationPlan | undefined {
  if (!source || source.state === 'comparison_only' || source.state === 'selected_for_plan') return undefined
  if (source.state === 'awaiting_plan_review') return source.planReviewInput.calibrationPlan
  if (source.state === 'approved_locked') return source.planBinding.approvedCalibrationPlan
  if (source.state === 'stale_replan_required') return source.priorPlanBinding.approvedCalibrationPlan
  return undefined
}

export function createMotionStudioStoryWorkspaceService(context: ServiceContext) {
  const canonicalStyleReviewSource = createCanonicalStorytellingStyleReviewSource(context)
  return new MotionStudioStoryWorkspaceService(context, {
    styleDecisionAuthority: canonicalStyleReviewSource,
    styleCalibrationAuthority: canonicalStyleReviewSource,
  })
}

function canonicalCalibrationSourceFromStyleDecisionSource(
  source: StorytellingMotionStyleDecisionSource | undefined,
): StorytellingStyleCanonicalCalibrationSource | undefined {
  if (source?.state === 'canonical_awaiting_plan_review') {
    return {
      state: 'awaiting_plan_review',
      authority: source.authority,
      componentDigest: source.componentDigest,
      sourceRepositoryReverified: source.sourceRepositoryReverified,
    }
  }
  if (source?.state === 'canonical_approved_locked') {
    return {
      state: 'approved_locked',
      binding: source.binding,
      sourceRepositoryReverified: source.sourceRepositoryReverified,
      ...(source.approvedCalibrationPlanDigest
        ? { approvedCalibrationPlanDigest: source.approvedCalibrationPlanDigest }
        : {}),
    }
  }
  return undefined
}

function compileStoryBible(
  production: MotionStudioProductionDto,
  artifact: MotionStudioArtifactDto,
): MotionStudioStoryBibleDto {
  const { current, authority } = currentArtifactAuthority(artifact, 'story_bible')
  const parsed = motionStudioStoryBibleSchema.safeParse(current.payload.data)
  if (!parsed.success) internalInvalid('Current Story Bible payload is invalid.')
  assertStoryOwnership(production, parsed.data)
  return {
    ...authority,
    premise: parsed.data.premise,
    narrativeAngle: parsed.data.narrativeAngle,
    narratorPerspective: parsed.data.narratorPerspective,
    chapters: parsed.data.chapters,
    people: parsed.data.people,
    locations: parsed.data.locations,
    events: parsed.data.events,
    emotionalArc: parsed.data.emotionalArc,
    approvedDecisionCount: parsed.data.approvedDecisionIds.length,
  }
}

function compilePreparedScript(
  production: MotionStudioProductionDto,
  artifact: MotionStudioArtifactDto,
): MotionStudioPreparedScriptDto {
  const { current, authority } = currentArtifactAuthority(artifact, 'prepared_script')
  const parsed = motionStudioPreparedScriptSchema.safeParse(current.payload.data)
  if (!parsed.success) internalInvalid('Current Prepared Script payload is invalid.')
  assertStoryOwnership(production, parsed.data)

  const segmentsByChapter = new Map<string, PreparedScript['narrationSegments']>()
  for (const chapter of parsed.data.chapters) segmentsByChapter.set(chapter.id, [])
  for (const segment of parsed.data.narrationSegments) segmentsByChapter.get(segment.chapterId)?.push(segment)
  const chapters = parsed.data.chapters.map((chapter) => ({
    order: chapter.order,
    title: chapter.title,
    sceneCount: chapter.sceneIds.length,
    narrationSegments: [...(segmentsByChapter.get(chapter.id) ?? [])]
      .sort((left, right) => left.order - right.order)
      .map((segment) => ({
        order: segment.order,
        startFrame: segment.startFrame,
        endFrame: segment.endFrame,
        text: segment.text,
        meaning: segment.meaning,
        visualCue: segment.visualCue,
        claimCount: segment.claimIds.length,
        sourceReferenceCount: segment.sourceReferenceIds.length,
      })),
  }))
  const flattenedOrders = chapters.flatMap((chapter) => chapter.narrationSegments.map((segment) => segment.order))
  if (flattenedOrders.some((order, index) => order !== index)) {
    internalInvalid('Prepared Script chapter grouping does not preserve narration order.')
  }

  return {
    ...authority,
    title: parsed.data.title,
    language: parsed.data.language,
    timing: {
      frameRate: parsed.data.timingAuthority.frameRate,
      width: parsed.data.timingAuthority.width,
      height: parsed.data.timingAuthority.height,
      aspectRatio: parsed.data.timingAuthority.aspectRatio,
      durationFrames: parsed.data.timingAuthority.durationFrames,
      timingAuthorityDigest: parsed.data.timingAuthority.timingAuthorityDigest,
    },
    chapters,
    narrationSegmentCount: parsed.data.narrationSegments.length,
    userLockedText: true,
  }
}

function currentArtifactAuthority(
  artifact: MotionStudioArtifactDto,
  expectedKind: Extract<MotionStudioArtifactKind, 'story_bible' | 'prepared_script'>,
): { current: MotionStudioArtifactVersionDto; authority: MotionStudioStoryVersionAuthorityDto } {
  if (artifact.kind !== expectedKind) internalInvalid(`Expected ${expectedKind} artifact authority.`)
  const current = artifact.currentDraft ?? artifact.currentApproved
  const currentVersion = artifact.currentDraftVersion ?? artifact.currentApprovedVersion
  if (!current || !currentVersion) internalInvalid(`Current ${expectedKind} version is missing.`)
  if (
    current.kind !== expectedKind ||
    current.artifactId !== artifact.id ||
    current.productionId !== artifact.productionId ||
    current.id !== currentVersion.versionId ||
    current.versionNumber !== currentVersion.versionNumber ||
    current.contentDigest !== currentVersion.contentDigest ||
    !['draft', 'in_review', 'approved', 'locked'].includes(current.state)
  ) internalInvalid(`Current ${expectedKind} version authority is inconsistent.`)
  if (artifact.currentApprovedVersion && artifact.currentApprovedVersion.artifactId !== artifact.id) {
    internalInvalid(`Approved ${expectedKind} version authority is inconsistent.`)
  }

  return {
    current,
    authority: {
      artifactId: artifact.id,
      currentVersion,
      versionState: current.state as MotionStudioStoryVersionAuthorityDto['versionState'],
      ...(artifact.currentApprovedVersion ? { currentApprovedVersion: artifact.currentApprovedVersion } : {}),
    },
  }
}

function assertStoryOwnership(
  production: MotionStudioProductionDto,
  value: StoryBible | PreparedScript,
): void {
  if (
    value.productionId !== production.id ||
    value.projectId !== production.projectId ||
    value.editSessionId !== production.editSessionId
  ) internalInvalid('Story artifact payload does not match this exact Storytelling production.')
}

function isApprovedOrLocked(state: MotionStudioStoryVersionAuthorityDto['versionState']): boolean {
  return state === 'approved' || state === 'locked'
}

function noticeForState(state: MotionStudioStoryWorkspaceDto['state']): string {
  const notices: Record<MotionStudioStoryWorkspaceDto['state'], string> = {
    empty: 'Shape the story in Chat before a Story Bible or timed script appears here.',
    story_ready: 'The current Story Bible is ready to review. Continue in Chat to shape the timed script.',
    script_ready: 'The timed script is ready for review. Request changes in Chat before approval.',
    approved_read_only: 'The approved story and timed script are locked to their exact versions. Request a revision in Chat to change them.',
  }
  return notices[state]
}

function internalInvalid(message: string): never {
  throw new ApiError('INTERNAL_ERROR', message, 500, undefined, { internal: true })
}
