import type {
  ApplyMotionStudioCommandRequest,
  CreateMotionStudioArtifactVersionRequest,
  MotionDNA,
  MotionStudioArtifactDto,
  MotionStudioVersionReference,
  PrepareStorytellingMotionStylePlanRequest,
  StorytellingMotionStylePlanPreparationDto,
  StorytellingMotionStyleProfile,
  StorytellingMotionStyleRecipeFamily,
  StorytellingStyleSourceAudit,
  StyleCalibrationScenario,
} from '../../../src/types/motion-studio'
import { MOTION_STUDIO_STORYTELLING_STYLE_PLAN_PREPARATION_VERSION } from '../../../src/types/motion-studio'
import type { JSONValue } from '../../../src/types/shared'
import {
  MOTION_STUDIO_NARRATIVE_FUNCTION_DEFINITIONS,
  motionStudioMotionDnaSchema,
  narrativeFunctionReference,
  storytellingMotionStylePlanPreparationDtoSchema,
} from '../../../src/lib/motion-studio/contracts'
import { ApiError } from '../../errors/api-error'
import type { ServiceContext } from '../../types'
import { createMotionStudioCommandService, type MotionStudioCommandService } from '../commands'
import { sha256CanonicalJson } from '../commands/canonical-json'
import { buildMotionStudioGenerationRoutePolicy } from '../generation/compiler'
import { createStorytellingMotionStylePlanReviewInput } from './plan-binding'
import { createStorytellingMotionStyleReview } from './review'
import {
  createStorytellingMotionStyleSelection,
  createStorytellingStyleSourceAudit,
  createStyleCalibrationPlan,
} from './authority'
import {
  findReferencedStorytellingMotionStyleProfiles,
  matchExplicitStorytellingMotionStyleProfiles,
  storytellingMotionStyleProfileReference,
} from './catalog'
import { projectStorytellingMotionStyleDecision } from './decision-projection'
import {
  createStorytellingStylePlanSourceStore,
  type StorytellingStylePlanSourceStore,
} from './style-plan-source-store'

const PLAN_WARNING =
  'The Storytelling style preparation is planning-only. It cannot approve a plan, call a provider, spend credits, generate media, render, export, or deliver.'

const SUPPLIED_STYLE_SOURCE_AUDIT: StorytellingStyleSourceAudit = createStorytellingStyleSourceAudit({
  sourceId: 'owner-supplied-vox-motion-graphics-skill-2026-07-21',
  sourceKind: 'uploaded_skill_archive',
  sourceContentDigest: '765c946d78bf114907e96da8be4ac749e36ef8009fa273eb65f2133b9ca83053',
  sourceLabel: 'Owner-supplied editorial motion-graphics reference',
  licenseEvidenceStatus: 'missing',
  commercialReuseAuthorizationStatus: 'unknown',
  extractedTechniqueFamilies: [
    'editorial cutout and paper-layer grammar',
    'motivated maps, data, and evidence reveals',
    'tactile paper-diorama depth and lighting',
    'one primary visual idea per story beat',
    'cross-scene recurring motif, reveal, and payoff continuity',
  ],
  rejectedDirectiveFamilies: [
    'publisher imitation',
    'automatic paid generation',
    'provider presets and job identities',
    'generated essential typography',
    'flattened video as project authority',
  ],
})

type StyleCommandAuthority = Pick<
  MotionStudioCommandService,
  'applyCommand' | 'createInitialArtifactVersion' | 'getArtifactByKind' | 'getProductionById' | 'getProductionScopeById'
>

export interface StorytellingStylePlanningServiceDependencies {
  commandAuthority?: StyleCommandAuthority
  stylePlanSourceStore?: Pick<StorytellingStylePlanSourceStore, 'persist'>
}

export class StorytellingStylePlanningService {
  private readonly commandAuthority: StyleCommandAuthority
  private readonly stylePlanSourceStore: Pick<
    StorytellingStylePlanSourceStore,
    'persist'
  >

  constructor(context: ServiceContext, dependencies: StorytellingStylePlanningServiceDependencies = {}) {
    this.commandAuthority = dependencies.commandAuthority ?? createMotionStudioCommandService(context)
    this.stylePlanSourceStore = dependencies.stylePlanSourceStore ??
      createStorytellingStylePlanSourceStore({
        localStorageRoot: context.env.localStorageRoot,
      })
  }

  async prepare(
    productionId: string,
    request: PrepareStorytellingMotionStylePlanRequest,
    idempotencyKey: string,
  ) {
    const production = (await this.commandAuthority.getProductionById(productionId)).data.production
    const ownedScope = await this.commandAuthority.getProductionScopeById(productionId)
    if (production.moduleId !== 'storytelling') {
      throw new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', 'Motion direction is available only for a Storytelling production.', 409)
    }
    if (ownedScope.workspaceId !== request.workspaceId || ownedScope.projectId !== production.projectId ||
        ownedScope.editSessionId !== production.editSessionId || ownedScope.productionId !== productionId) {
      throw new ApiError(
        'MOTION_STUDIO_CONFLICT',
        'The requested motion direction does not match this exact Storytelling workspace, project, edit, and production.',
        409,
      )
    }

    const review = createStorytellingMotionStyleReview()
    const explicitDirection = latestExplicitDirection(request.directionHistory)
    const matches = explicitDirection?.matches ?? []
    if (matches.length !== 1) {
      const blockerMessage = matches.length > 1
        ? 'More than one motion direction was named. Choose one direction in Chat before Plan Review.'
        : 'Choose one Storytelling motion direction in Chat before Plan Review.'
      return {
        data: {
          preparation: parsePreparation({
            schemaVersion: MOTION_STUDIO_STORYTELLING_STYLE_PLAN_PREPARATION_VERSION,
            productionId,
            projectId: production.projectId,
            editSessionId: production.editSessionId,
            state: 'needs_selection',
            decision: projectStorytellingMotionStyleDecision(review, { state: 'comparison_only' }, {
              projectId: production.projectId,
              editSessionId: production.editSessionId,
              productionId,
            }),
            blockerMessage,
            planReviewIsSoleApprovalAuthority: true,
            customerPriceCalculatedHere: false,
            customerCreditsMutated: false,
            runtimeExecutionAuthorized: false,
            localCandidateOnly: true,
          }),
        },
        warnings: [PLAN_WARNING],
      }
    }

    const profile = matches[0]!
    const referenceContractVersions = await this.readReferenceContractVersions(productionId)
    const motionDnaArtifact = await this.ensureMotionDna(
      productionId,
      ownedScope.workspaceId,
      production.projectId,
      production.editSessionId,
      profile,
      referenceContractVersions,
      idempotencyKey,
    )
    const motionDnaVersion = currentVersion(motionDnaArtifact)
    const currentMotionDna = readCurrentMotionDna(
      motionDnaArtifact,
      productionId,
      production.projectId,
      production.editSessionId,
      ownedScope.workspaceId,
    )
    const identity = {
      workspaceId: currentMotionDna.workspaceId,
      projectId: production.projectId,
      editSessionId: production.editSessionId,
    }
    const selectionSeed = sha256CanonicalJson({
      ...identity,
      productionId,
      directionText: normalize(explicitDirection!.message),
      styleProfile: storytellingMotionStyleProfileReference(profile),
      motionDnaVersion,
      referenceContractVersions,
    })
    const selection = createStorytellingMotionStyleSelection({
      ...identity,
      id: `storytelling-style-selection-${selectionSeed.slice(0, 32)}`,
      productionId,
      styleProfile: storytellingMotionStyleProfileReference(profile),
      motionLanguage: profile.motionLanguage,
      motionDnaVersion,
      referenceContractVersions,
      sourceAuditDigests: storytellingStyleSourceAuditDigests(profile),
      selectionOrigin: 'user_selected',
      matchedInputAliases: matchedAliases(profile, explicitDirection!.message),
      customizationNotes: ['The exact current Chat direction remains the governing user instruction.'],
      state: 'selected_for_plan',
    })
    const calibrationPlan = createStyleCalibrationPlan({
      ...identity,
      id: `storytelling-style-calibration-${selection.selectionDigest.slice(0, 32)}`,
      productionId,
      styleSelectionDigest: selection.selectionDigest,
      styleProfile: selection.styleProfile,
      motionLanguage: selection.motionLanguage,
      motionDnaVersion,
      routePolicy: buildMotionStudioGenerationRoutePolicy('video_clip', request.modelTier),
      scenarios: calibrationScenarios(profile, referenceContractVersions),
      estimatedInternalCostRangeMicros: calibrationCostRange(profile),
      approvalAuthority: {
        state: 'planning_only',
        customerPriceIncluded: false,
        customerCreditsMutated: false,
      },
    }, selection)
    const planReviewInput = createStorytellingMotionStylePlanReviewInput({
      styleSelection: selection,
      calibrationPlan,
    })
    await this.stylePlanSourceStore.persist(planReviewInput)
    const decision = projectStorytellingMotionStyleDecision(review, {
      state: 'awaiting_plan_review',
      planReviewInput,
    }, {
      projectId: production.projectId,
      editSessionId: production.editSessionId,
      productionId,
    })

    return {
      data: {
        preparation: parsePreparation({
          schemaVersion: MOTION_STUDIO_STORYTELLING_STYLE_PLAN_PREPARATION_VERSION,
          productionId,
          projectId: production.projectId,
          editSessionId: production.editSessionId,
          state: 'ready_for_plan_review',
          decision,
          planReviewInput,
          planReviewIsSoleApprovalAuthority: true,
          customerPriceCalculatedHere: false,
          customerCreditsMutated: false,
          runtimeExecutionAuthorized: false,
          localCandidateOnly: true,
        }),
      },
      warnings: [PLAN_WARNING],
    }
  }

  private async ensureMotionDna(
    productionId: string,
    workspaceId: string,
    projectId: string,
    editSessionId: string,
    profile: StorytellingMotionStyleProfile,
    referenceContractVersions: readonly MotionStudioVersionReference[],
    idempotencyKey: string,
  ): Promise<MotionStudioArtifactDto> {
    const expected = motionDna(
      workspaceId,
      projectId,
      editSessionId,
      productionId,
      profile,
      referenceContractVersions,
    )
    const existing = await this.readOptionalArtifact(productionId, 'motion_dna')
    if (existing) {
      const current = existing.currentDraft ?? existing.currentApproved
      const parsed = motionStudioMotionDnaSchema.safeParse(current?.payload.data)
      if (!parsed.success || !current || existing.productionId !== productionId ||
          parsed.data.productionId !== productionId || parsed.data.workspaceId !== workspaceId ||
          parsed.data.projectId !== projectId || parsed.data.editSessionId !== editSessionId) {
        throw new ApiError(
          'MOTION_STUDIO_CONFLICT',
          'The current Motion DNA does not match this exact Storytelling workspace, project, edit, and production.',
          409,
        )
      }
      const alreadyCurrent = styleAuthorityMarker(parsed.data) === styleAuthorityMarker(expected) &&
        sha256CanonicalJson(parsed.data.referenceContractIds) === sha256CanonicalJson(expected.referenceContractIds)
      if (alreadyCurrent) return existing
      return this.createMotionDnaRevision(
        productionId,
        existing,
        current.id,
        current.contentDigest,
        expected,
        profile,
        parsed.data.storyContinuityGrammar !== undefined,
        idempotencyKey,
      )
    }

    const request: CreateMotionStudioArtifactVersionRequest = {
      kind: 'motion_dna',
      state: 'in_review',
      payload: {
        schemaVersion: 'motion-studio.motion-dna.v1',
        data: expected as unknown as JSONValue,
        references: [],
        extensions: [],
      },
      provenance: {
        sourceArtifactVersionIds: [],
        sourceAssetIds: [],
        skillRunIds: [],
        toolRunIds: [],
        providerAttemptIds: [],
      },
      dependencies: [],
    }
    const created = await this.commandAuthority.createInitialArtifactVersion(
      productionId,
      request,
      `${idempotencyKey}:motion-dna:${profile.id}`,
    )
    return created.data.artifact
  }

  private async createMotionDnaRevision(
    productionId: string,
    artifact: MotionStudioArtifactDto,
    baseVersionId: string,
    baseVersionDigest: string,
    expected: MotionDNA,
    profile: StorytellingMotionStyleProfile,
    clearStaleStoryContinuityGrammar: boolean,
    idempotencyKey: string,
  ): Promise<MotionStudioArtifactDto> {
    const fields = [
      'visualIdentity',
      'compositionGrammar',
      'motionGrammar',
      'cameraGrammar',
      'audioGrammar',
      'continuityRules',
      'prohibitedCharacteristics',
      'referenceContractIds',
    ] as const satisfies readonly (keyof MotionDNA)[]
    const operations: ApplyMotionStudioCommandRequest['operations'] = [
      ...fields.map((field) => ({
        operationId: `storytelling-motion-dna-set-${field}`,
        kind: 'set_property' as const,
        targetPath: `/data/${field}`,
        value: structuredClone(expected[field]) as unknown as JSONValue,
      })),
      ...(clearStaleStoryContinuityGrammar ? [{
        operationId: 'storytelling-motion-dna-clear-stale-story-continuity-grammar',
        kind: 'remove_item' as const,
        targetPath: '/data/storyContinuityGrammar',
      }] : []),
    ]
    const request: ApplyMotionStudioCommandRequest = {
      baseVersionId,
      baseVersionDigest,
      operations,
      reason: `Create a new planning-only Motion DNA version for ${profile.displayName}.`,
    }
    const applied = await this.commandAuthority.applyCommand(
      productionId,
      artifact.id,
      request,
      `${idempotencyKey}:motion-dna-revision:${profile.id}`,
      'director',
    )
    if (applied.data.result.status !== 'applied') {
      throw new ApiError(
        'MOTION_STUDIO_CONFLICT',
        'The Storytelling motion direction changed while the plan was being prepared. Create a fresh plan and try again.',
        409,
      )
    }
    const revised = (await this.commandAuthority.getArtifactByKind(productionId, 'motion_dna')).data.artifact
    const revisedCurrent = revised.currentDraft ?? revised.currentApproved
    const parsed = motionStudioMotionDnaSchema.safeParse(revisedCurrent?.payload.data)
    if (!parsed.success || styleAuthorityMarker(parsed.data) !== styleAuthorityMarker(expected) ||
        sha256CanonicalJson(parsed.data.referenceContractIds) !== sha256CanonicalJson(expected.referenceContractIds)) {
      throw new ApiError('MOTION_STUDIO_CONFLICT', 'The revised Storytelling motion direction failed exact readback.', 409)
    }
    return revised
  }

  private async readReferenceContractVersions(productionId: string): Promise<readonly MotionStudioVersionReference[]> {
    const artifact = await this.readOptionalArtifact(productionId, 'reference_contract')
    if (!artifact) return []
    return [currentVersion(artifact)]
  }

  private async readOptionalArtifact(
    productionId: string,
    kind: 'motion_dna' | 'reference_contract',
  ): Promise<MotionStudioArtifactDto | undefined> {
    try {
      return (await this.commandAuthority.getArtifactByKind(productionId, kind)).data.artifact
    } catch (error) {
      if (error instanceof ApiError && error.code === 'MOTION_STUDIO_NOT_FOUND') return undefined
      throw error
    }
  }
}

export function createStorytellingStylePlanningService(context: ServiceContext) {
  return new StorytellingStylePlanningService(context)
}

function parsePreparation(value: StorytellingMotionStylePlanPreparationDto): StorytellingMotionStylePlanPreparationDto {
  return deepFreeze(storytellingMotionStylePlanPreparationDtoSchema.parse(value))
}

function currentVersion(artifact: MotionStudioArtifactDto): MotionStudioVersionReference {
  const version = artifact.currentDraftVersion ?? artifact.currentApprovedVersion
  if (!version) throw new ApiError('MOTION_STUDIO_CONFLICT', 'The current style artifact has no readable version.', 409)
  return version
}

export function storytellingStyleSourceAuditDigests(
  profile: StorytellingMotionStyleProfile,
): readonly string[] {
  return profile.id === 'storytelling_style.editorial_collage' ||
    profile.id === 'storytelling_style.paper_diorama_documentary'
    ? [SUPPLIED_STYLE_SOURCE_AUDIT.auditDigest]
    : []
}

function matchedAliases(profile: StorytellingMotionStyleProfile, directionText: string): readonly string[] {
  const direction = normalize(directionText)
  const values = [profile.displayName, ...profile.inputAliases]
    .filter((value) => direction.includes(normalize(value)))
  return [...new Set(values.map(normalize))]
}

function latestExplicitDirection(directionHistory: readonly string[]) {
  for (let index = directionHistory.length - 1; index >= 0; index -= 1) {
    const message = directionHistory[index]!
    const references = findReferencedStorytellingMotionStyleProfiles(message)
    if (references.length === 0) continue
    const matches = matchExplicitStorytellingMotionStyleProfiles(message)
    return { message, matches }
  }
  return undefined
}

function readCurrentMotionDna(
  artifact: MotionStudioArtifactDto,
  productionId: string,
  projectId: string,
  editSessionId: string,
  requestedWorkspaceId: string,
): MotionDNA {
  const current = artifact.currentDraft ?? artifact.currentApproved
  const parsed = motionStudioMotionDnaSchema.safeParse(current?.payload.data)
  if (!current || !parsed.success || artifact.productionId !== productionId ||
      parsed.data.productionId !== productionId || parsed.data.projectId !== projectId ||
      parsed.data.editSessionId !== editSessionId || parsed.data.workspaceId !== requestedWorkspaceId) {
    throw new ApiError(
      'MOTION_STUDIO_CONFLICT',
      'The selected motion direction did not match this exact Storytelling workspace, project, edit, and production.',
      409,
    )
  }
  return parsed.data
}

function calibrationCostRange(
  profile: StorytellingMotionStyleProfile,
): StyleCalibrationPlanCostRange {
  const ranges: Record<StorytellingMotionStyleProfile['relativeCostTendency'], StyleCalibrationPlanCostRange> = {
    lower: { minimum: 1_500_000, maximum: 12_500_000 },
    moderate: { minimum: 2_500_000, maximum: 20_000_000 },
    higher: { minimum: 4_000_000, maximum: 30_000_000 },
  }
  return ranges[profile.relativeCostTendency]
}

type StyleCalibrationPlanCostRange = {
  minimum: number
  maximum: number
}

function calibrationScenarios(
  profile: StorytellingMotionStyleProfile,
  referenceContractVersions: readonly MotionStudioVersionReference[],
): readonly StyleCalibrationScenario[] {
  const narrativeIds: Record<StyleCalibrationScenario['kind'], string> = {
    style_led_motion: 'narrative_function.explain_cause_and_effect',
    character_continuity: 'narrative_function.introduce_person',
    strict_first_last_frame: 'narrative_function.transition_chapter',
    reference_heavy: 'narrative_function.reveal_evidence',
    exact_text_data: 'narrative_function.quantify',
  }
  const narrativeFor = (kind: StyleCalibrationScenario['kind']) => {
    const definition = MOTION_STUDIO_NARRATIVE_FUNCTION_DEFINITIONS.find(
      (candidate) => candidate.id === narrativeIds[kind],
    )
    if (!definition) throw new Error(`Missing narrative function for ${kind}.`)
    return narrativeFunctionReference(definition)
  }
  const recipe = (preferred: StorytellingMotionStyleRecipeFamily, fallback: StorytellingMotionStyleRecipeFamily) =>
    profile.recipeFamilies.includes(preferred) ? preferred : fallback
  const generatedMode = profile.supportedProductionModes.includes('generative_first')
    ? 'generative_first' as const
    : 'hybrid_directed' as const
  const scenario = (
    kind: StyleCalibrationScenario['kind'],
    productionMode: StyleCalibrationScenario['productionMode'],
    recipeFamily: StorytellingMotionStyleRecipeFamily,
    requiresGeneratedMedia: boolean,
    deterministicTextDataRequired: boolean,
  ): StyleCalibrationScenario => ({
    id: `storytelling-style-calibration-${kind}`,
    kind,
    narrativeFunction: narrativeFor(kind),
    motionLanguage: profile.motionLanguage,
    productionMode,
    recipeFamily,
    requiresGeneratedMedia,
    deterministicTextDataRequired,
    referenceContractVersions,
    acceptanceCriteria: [
      'Preserve approved meaning, evidence, disclosures, style continuity, timing, and editability.',
    ],
  })
  return [
    scenario('style_led_motion', profile.defaultProductionMode, profile.recipeFamilies[0]!, true, false),
    scenario('character_continuity', generatedMode, recipe('cinematic_reconstruction', 'hybrid_documentary'), true, false),
    scenario('strict_first_last_frame', generatedMode, recipe('cinematic_reconstruction', 'hybrid_documentary'), true, false),
    scenario('reference_heavy', 'hybrid_directed', recipe('editorial_archive_reveal', 'hybrid_documentary'), true, false),
    scenario('exact_text_data', 'native_graphics_first', 'native_evidence_graphic', false, true),
  ]
}

function motionDna(
  workspaceId: string,
  projectId: string,
  editSessionId: string,
  productionId: string,
  profile: StorytellingMotionStyleProfile,
  referenceContractVersions: readonly MotionStudioVersionReference[],
): MotionDNA {
  const grammar = motionDnaGrammar(profile.id)
  return motionStudioMotionDnaSchema.parse({
    workspaceId,
    projectId,
    editSessionId,
    id: `motion-dna-${productionId}`,
    productionId,
    visualIdentity: grammar.visualIdentity,
    compositionGrammar: {
      hierarchyRules: ['One primary visual idea per story beat.', 'Evidence and exact labels remain legible.'],
      depthRules: grammar.depthRules,
      safeZoneRuleIds: ['safe-zone.standard', 'safe-zone.caption-and-evidence'],
    },
    motionGrammar: grammar.motionGrammar,
    cameraGrammar: grammar.cameraGrammar,
    audioGrammar: {
      speechPriority: true,
      cueFamilies: grammar.cueFamilies,
      prohibitedAudioCharacteristics: ['speech masking', 'unmotivated impact stacking'],
    },
    continuityRules: [
      styleAuthority(profile),
      'Preserve approved character, location, object, chronology, and disclosure authority.',
      'Keep typography, maps, charts, captions, and data deterministic and editable.',
    ],
    prohibitedCharacteristics: [
      'publisher imitation',
      'unlicensed asset copying',
      'generated essential typography',
      'flattened video as project authority',
      'unmotivated motion',
    ],
    referenceContractIds: referenceContractVersions.map((version) => version.artifactId),
  })
}

function motionDnaGrammar(profileId: StorytellingMotionStyleProfile['id']) {
  const shared = {
    motionGrammar: {
      entranceFamilies: ['motivated reveal'],
      exitFamilies: ['clean dissolve', 'motivated occlusion'],
      emphasisFamilies: ['single focal accent'],
      easingTokenIds: ['ease.documentary.standard'],
    },
  }
  switch (profileId) {
    case 'storytelling_style.editorial_collage':
      return {
        ...shared,
        visualIdentity: {
          paletteTokenIds: ['storytelling.ink', 'storytelling.paper', 'storytelling.cyan-accent'],
          typographyTokenIds: ['type.documentary.heading', 'type.documentary.annotation'],
          materialDescriptors: ['matte editorial paper', 'archival cutout'],
          textureDescriptors: ['restrained print grain'],
        },
        depthRules: ['Use shallow paper depth and readable foreground evidence.'],
        cameraGrammar: { allowedMoves: ['measured push', 'motivated pan'], prohibitedMoves: ['unmotivated orbit'], parallaxPolicy: 'restrained layered parallax' },
        cueFamilies: ['paper movement', 'evidence reveal'],
      }
    case 'storytelling_style.cinematic_realist_documentary':
      return {
        ...shared,
        visualIdentity: {
          paletteTokenIds: ['storytelling.natural-shadow', 'storytelling.practical-light', 'storytelling.cyan-accent'],
          typographyTokenIds: ['type.documentary.heading', 'type.documentary.evidence'],
          materialDescriptors: ['photographic evidence', 'restrained cinematic reconstruction'],
          textureDescriptors: ['natural grain', 'source-matched texture'],
        },
        depthRules: ['Use photographic depth while preserving evidence and reconstruction disclosure.'],
        cameraGrammar: { allowedMoves: ['motivated dolly', 'measured handheld', 'slow push'], prohibitedMoves: ['impossible evidence camera'], parallaxPolicy: 'source-matched depth only' },
        cueFamilies: ['environmental ambience', 'restrained cinematic transition'],
      }
    case 'storytelling_style.paper_diorama_documentary':
      return {
        ...shared,
        visualIdentity: {
          paletteTokenIds: ['storytelling.warm-paper', 'storytelling.ink', 'storytelling.cyan-accent'],
          typographyTokenIds: ['type.documentary.heading', 'type.documentary.annotation'],
          materialDescriptors: ['layered paper miniature', 'cut paper evidence'],
          textureDescriptors: ['tactile fiber', 'restrained print grain'],
        },
        depthRules: ['Use measured miniature depth with exact foreground labels.'],
        cameraGrammar: { allowedMoves: ['slow miniature push', 'measured lateral reveal'], prohibitedMoves: ['fast unmotivated orbit'], parallaxPolicy: 'measured paper-layer parallax' },
        cueFamilies: ['paper movement', 'miniature environment'],
      }
    case 'storytelling_style.technical_blueprint':
      return {
        ...shared,
        visualIdentity: {
          paletteTokenIds: ['storytelling.blueprint-base', 'storytelling.precision-line', 'storytelling.cyan-accent'],
          typographyTokenIds: ['type.documentary.heading', 'type.data.label'],
          materialDescriptors: ['precise vector linework', 'measured diagram'],
          textureDescriptors: ['minimal technical grid'],
        },
        depthRules: ['Keep measurements, routes, and labels on explicit readable planes.'],
        cameraGrammar: { allowedMoves: ['orthographic push', 'route-follow pan'], prohibitedMoves: ['decorative orbit'], parallaxPolicy: 'minimal and measurement-safe' },
        cueFamilies: ['diagram reveal', 'measurement tick'],
      }
  }
}

function styleAuthority(profile: StorytellingMotionStyleProfile): string {
  return `Style authority ${profile.id}@${profile.version}#${profile.contentDigest}`
}

function styleAuthorityMarker(value: MotionDNA): string | undefined {
  return value.continuityRules.find((rule) => rule.startsWith('Style authority '))
}

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child)
  }
  return value
}
