import type {
  MotionStudioArtifactVersionDto,
  MotionStudioVersionReference,
  NarrativeFunctionReference,
  ProductionMode,
  ProjectVideoRoutingProfile,
  SceneDocument,
  StorytellingMotionStyleRecipeFamily,
  StorytellingMotionStyleSelection,
  StorytellingSceneRecipeCompilation,
} from '../../../src/types/motion-studio'
import {
  MOTION_STUDIO_STORYTELLING_SCENE_RECIPE_COMPILATION_VERSION,
} from '../../../src/types/motion-studio'
import {
  MOTION_STUDIO_MOTION_LANGUAGE_DEFINITIONS,
  MOTION_STUDIO_NARRATIVE_FUNCTION_DEFINITIONS,
  motionStudioMotionDnaSchema,
  motionStudioPreparedScriptSchema,
  motionStudioProductionRouteSchema,
  motionStudioSceneDocumentSchema,
  motionStudioSceneRecipeInstantiationSchema,
  storytellingSceneRecipeCompilationSchema,
  validateApprovedSceneRecipeInstantiation,
  validateProjectVideoRoutingProfile,
  validateProductionRouteAgainstRecipeInstance,
  validateStorytellingMotionStyleSelection,
} from '../../../src/lib/motion-studio/contracts'
import { sha256CanonicalJson } from '../commands/canonical-json'
import {
  getStorytellingMotionStyleProfile,
  storytellingMotionStyleProfileReference,
} from './catalog'
import type { CanonicalApprovedStorytellingStyleBinding } from './canonical-approved-style-binding'
import { verifyCanonicalApprovedStorytellingStyleBinding } from './canonical-approved-style-binding'
import {
  resolveStorytellingSceneRecipe,
  verifyStorytellingSceneRecipeDigest,
} from './scene-recipes'
import { verifyStorytellingStyleAuthorityDigest } from './authority'
import {
  compileStorytellingSceneContinuitySlice,
  verifyStorytellingSceneContinuitySliceDigest,
  verifyStorytellingStoryContinuityGrammarDigest,
} from './story-continuity-grammar'

interface CompileStorytellingSceneRecipeBaseInput {
  workspaceId: string
  projectId: string
  editSessionId: string
  productionId: string
  recipeFamily: StorytellingMotionStyleRecipeFamily
  recipeVersion: MotionStudioVersionReference
  recipeInstantiationId: string
  productionRouteId: string
  sceneDocumentVersionId: string
  sceneId: string
  snapshotBoundMotionDnaVersion: MotionStudioArtifactVersionDto
  snapshotBoundPreparedScriptVersion: MotionStudioArtifactVersionDto
  narrativeFunction: NarrativeFunctionReference
  productionMode: ProductionMode
  inputArtifactDigests: readonly string[]
  outputBindingIds: readonly string[]
  requiredAssetIds: readonly string[]
  requiresGeneratedMedia: boolean
  projectVideoRoutingProfile?: ProjectVideoRoutingProfile
}

export interface CompileApprovedStorytellingSceneRecipeInput
  extends CompileStorytellingSceneRecipeBaseInput {
  approvedPlanSnapshotId: string
  approvedPlanSnapshotDigest: string
  styleSelection: StorytellingMotionStyleSelection
}

export interface CompileCanonicalApprovedStorytellingSceneRecipeInput
  extends CompileStorytellingSceneRecipeBaseInput {
  canonicalStyleBinding: CanonicalApprovedStorytellingStyleBinding
}

interface StorytellingSceneRecipeStyleAuthority {
  approvedPlanSnapshotId: string
  approvedPlanSnapshotDigest: string
  selectionDigest: string
  styleProfile: StorytellingMotionStyleSelection['styleProfile']
  motionLanguage: StorytellingMotionStyleSelection['motionLanguage']
  motionDnaVersion: StorytellingMotionStyleSelection['motionDnaVersion']
  referenceContractVersions: StorytellingMotionStyleSelection['referenceContractVersions']
  sourceAuditDigests: StorytellingMotionStyleSelection['sourceAuditDigests']
}

/**
 * Compiles exact approved semantic authorities into a provider-neutral route.
 * The returned route is still proposal evidence: it cannot dispatch a tool,
 * provider, worker, render, billing action, or automatic fallback.
 */
export function compileApprovedStorytellingSceneRecipe(
  input: CompileApprovedStorytellingSceneRecipeInput,
): StorytellingSceneRecipeCompilation {
  return compileStorytellingSceneRecipeWithAuthority(input, assertApprovedStyleSelection(input))
}

/**
 * Compiles a Scene Recipe from the exact style component already frozen in
 * the one canonical approved snapshot. This projection does not reconstruct
 * omitted Chat fields and does not grant runtime or provider authority.
 */
export function compileCanonicalApprovedStorytellingSceneRecipe(
  input: CompileCanonicalApprovedStorytellingSceneRecipeInput,
): StorytellingSceneRecipeCompilation {
  const { canonicalStyleBinding, ...baseInput } = input
  const styleAuthority = assertCanonicalApprovedStyleBinding({
    ...baseInput,
    canonicalStyleBinding,
  })
  return compileStorytellingSceneRecipeWithAuthority({
    ...baseInput,
    approvedPlanSnapshotId: styleAuthority.approvedPlanSnapshotId,
    approvedPlanSnapshotDigest: styleAuthority.approvedPlanSnapshotDigest,
  }, styleAuthority)
}

function compileStorytellingSceneRecipeWithAuthority(
  input: CompileStorytellingSceneRecipeBaseInput & {
    approvedPlanSnapshotId: string
    approvedPlanSnapshotDigest: string
  },
  styleAuthority: StorytellingSceneRecipeStyleAuthority,
): StorytellingSceneRecipeCompilation {
  const styleProfile = getStorytellingMotionStyleProfile(styleAuthority.styleProfile.styleProfileId)
  if (sha256CanonicalJson(styleAuthority.styleProfile) !==
      sha256CanonicalJson(storytellingMotionStyleProfileReference(styleProfile))) {
    throw new Error('Scene Recipe compilation received a stale Storytelling style profile.')
  }
  const recipe = resolveStorytellingSceneRecipe({
    styleProfile: styleAuthority.styleProfile,
    motionLanguage: styleAuthority.motionLanguage,
    narrativeFunction: input.narrativeFunction,
    productionMode: input.productionMode,
    recipeFamily: input.recipeFamily,
  })
  if (!verifyStorytellingSceneRecipeDigest(recipe)) {
    throw new Error('Scene Recipe definition digest verification failed.')
  }
  if (input.recipeVersion.artifactId !== recipe.id ||
      input.recipeVersion.contentDigest !== recipe.definitionDigest) {
    throw new Error('Scene Recipe compilation requires the exact recipe artifact and definition digest.')
  }
  assertUnique(input.inputArtifactDigests, 'Scene Recipe input artifact digests')
  assertUnique(input.outputBindingIds, 'Scene Recipe output bindings')
  assertUnique(input.requiredAssetIds, 'Production Route required assets')
  if (input.inputArtifactDigests.length === 0 || input.outputBindingIds.length === 0) {
    throw new Error('Scene Recipe compilation requires exact input artifacts and output bindings.')
  }

  const storyContinuity = resolveApprovedSceneContinuity(input, styleAuthority)
  const routingProfileDigest = verifyGeneratedMediaAuthority(input, styleAuthority)
  const recipeInputDigest = sha256CanonicalJson({
    approvedPlanSnapshotId: input.approvedPlanSnapshotId,
    approvedPlanSnapshotDigest: input.approvedPlanSnapshotDigest,
    styleSelectionDigest: styleAuthority.selectionDigest,
    recipeVersion: input.recipeVersion,
    sceneDocumentVersionId: input.sceneDocumentVersionId,
    sceneId: input.sceneId,
    storyContinuitySliceDigest: storyContinuity.sliceDigest,
    narrativeFunction: input.narrativeFunction,
    productionMode: input.productionMode,
    inputArtifactDigests: input.inputArtifactDigests,
    outputBindingIds: input.outputBindingIds,
    requiredAssetIds: input.requiredAssetIds,
    requiresGeneratedMedia: input.requiresGeneratedMedia,
    projectVideoRoutingProfileDigest: routingProfileDigest,
  })
  const instantiation = motionStudioSceneRecipeInstantiationSchema.parse({
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    id: input.recipeInstantiationId,
    productionId: input.productionId,
    sceneDocumentVersionId: input.sceneDocumentVersionId,
    sceneId: input.sceneId,
    recipeVersion: input.recipeVersion,
    recipeDefinitionVersion: recipe.definitionVersion,
    recipeDefinitionDigest: recipe.definitionDigest,
    recipeInputDigest,
    motionLanguage: styleAuthority.motionLanguage,
    narrativeFunction: input.narrativeFunction,
    productionMode: input.productionMode,
    inputArtifactDigests: [...input.inputArtifactDigests],
    outputBindingIds: [...input.outputBindingIds],
    approvalStatus: 'approved',
    immutable: true,
  })
  const instantiationValidation = validateApprovedSceneRecipeInstantiation(
    instantiation,
    recipe,
    MOTION_STUDIO_MOTION_LANGUAGE_DEFINITIONS,
    MOTION_STUDIO_NARRATIVE_FUNCTION_DEFINITIONS,
  )
  if (!instantiationValidation.ok) {
    throw new Error(`Scene Recipe instantiation is invalid: ${instantiationValidation.errors.join(' ')}`)
  }

  const productionRoute = motionStudioProductionRouteSchema.parse({
    id: input.productionRouteId,
    mode: input.productionMode,
    capabilityIds: [...recipe.toolCapabilityIds],
    requiredAssetIds: [...input.requiredAssetIds],
    deterministic: isDeterministicCompositionFamily(input.recipeFamily),
    providerNeutral: true,
    approvalRequired: true,
    costEstimateRequired: true,
    rationale: `${recipe.name} preserves the exact selected Motion Language and Narrative Function through the approved ${input.productionMode} construction.`,
    motionLanguage: styleAuthority.motionLanguage,
    narrativeFunction: input.narrativeFunction,
    sceneRecipeVersion: input.recipeVersion,
    sceneRecipeDefinitionVersion: recipe.definitionVersion,
    sceneRecipeDefinitionDigest: recipe.definitionDigest,
  })
  const routeValidation = validateProductionRouteAgainstRecipeInstance(productionRoute, instantiation)
  if (!routeValidation.ok) {
    throw new Error(`Production Route is invalid: ${routeValidation.errors.join(' ')}`)
  }

  const base = {
    schemaVersion: MOTION_STUDIO_STORYTELLING_SCENE_RECIPE_COMPILATION_VERSION,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    productionId: input.productionId,
    approvedPlanSnapshotId: input.approvedPlanSnapshotId,
    approvedPlanSnapshotDigest: input.approvedPlanSnapshotDigest,
    styleSelectionDigest: styleAuthority.selectionDigest,
    styleProfile: styleAuthority.styleProfile,
    recipeFamily: input.recipeFamily,
    recipe,
    instantiation,
    storyContinuity,
    productionRoute,
    requiresGeneratedMedia: input.requiresGeneratedMedia,
    ...(routingProfileDigest
      ? { projectVideoRoutingProfileDigest: routingProfileDigest }
      : {}),
    runtimeExecutionAuthorized: false as const,
    automaticFallbackAllowed: false as const,
    immutable: true as const,
  }
  return deepFreeze(storytellingSceneRecipeCompilationSchema.parse({
    ...base,
    compilationDigest: sha256CanonicalJson(base),
  }))
}

export function verifyStorytellingSceneRecipeCompilationDigest(
  value: StorytellingSceneRecipeCompilation,
): boolean {
  if (!verifyStorytellingSceneContinuitySliceDigest(value.storyContinuity)) return false
  const base = { ...value }
  delete (base as Partial<StorytellingSceneRecipeCompilation>).compilationDigest
  return sha256CanonicalJson(base) === value.compilationDigest
}

/**
 * Attaches the approved recipe's scene slice to the existing SceneDocument
 * payload. Persistence remains the existing versioned artifact command path.
 */
export function bindStorytellingSceneRecipeContinuityToSceneDocument(
  documentInput: SceneDocument,
  compilation: StorytellingSceneRecipeCompilation,
): SceneDocument {
  const document = motionStudioSceneDocumentSchema.parse(structuredClone(documentInput))
  if (!verifyStorytellingSceneRecipeCompilationDigest(compilation)) {
    throw new Error('SceneDocument continuity binding requires a digest-valid Scene Recipe compilation.')
  }
  for (const field of ['workspaceId', 'projectId', 'editSessionId', 'productionId'] as const) {
    if (document[field] !== compilation[field]) {
      throw new Error(`SceneDocument continuity binding changed the exact ${field} authority.`)
    }
  }
  if (document.approvedSnapshotId !== compilation.approvedPlanSnapshotId ||
      document.sceneId !== compilation.storyContinuity.sceneId ||
      !document.recipeInstantiationIds.includes(compilation.instantiation.id) ||
      !document.productionRouteIds.includes(compilation.productionRoute.id)) {
    throw new Error('SceneDocument continuity binding changed its exact snapshot, scene, recipe, or route authority.')
  }
  if (document.storyContinuity) {
    if (document.storyContinuity.sliceDigest !== compilation.storyContinuity.sliceDigest) {
      throw new Error('SceneDocument already carries a different Story Continuity slice.')
    }
    return deepFreeze(document)
  }
  return deepFreeze(motionStudioSceneDocumentSchema.parse({
    ...document,
    storyContinuity: structuredClone(compilation.storyContinuity),
    compilerFingerprint: {
      ...document.compilerFingerprint,
      inputDigest: sha256CanonicalJson({
        priorSceneDocumentCompilerInputDigest: document.compilerFingerprint.inputDigest,
        sceneRecipeCompilationDigest: compilation.compilationDigest,
        storyContinuitySliceDigest: compilation.storyContinuity.sliceDigest,
      }),
    },
  }))
}

function assertApprovedStyleSelection(
  input: CompileApprovedStorytellingSceneRecipeInput,
): StorytellingSceneRecipeStyleAuthority {
  const selection = input.styleSelection
  if (!validateStorytellingMotionStyleSelection(selection).ok ||
      !verifyStorytellingStyleAuthorityDigest(selection)) {
    throw new Error('Scene Recipe compilation style selection digest verification failed.')
  }
  if (selection.state !== 'approved_snapshot_bound' ||
      selection.approvedPlanSnapshotId !== input.approvedPlanSnapshotId ||
      selection.approvedPlanSnapshotDigest !== input.approvedPlanSnapshotDigest) {
    throw new Error('Scene Recipe compilation requires the style selection exact approved plan snapshot.')
  }
  if (selection.workspaceId !== input.workspaceId ||
      selection.projectId !== input.projectId ||
      selection.editSessionId !== input.editSessionId ||
      selection.productionId !== input.productionId) {
    throw new Error('Scene Recipe compilation must preserve the exact workspace, project, edit, and production identity.')
  }
  return {
    approvedPlanSnapshotId: input.approvedPlanSnapshotId,
    approvedPlanSnapshotDigest: input.approvedPlanSnapshotDigest,
    selectionDigest: selection.selectionDigest,
    styleProfile: selection.styleProfile,
    motionLanguage: selection.motionLanguage,
    motionDnaVersion: selection.motionDnaVersion,
    referenceContractVersions: selection.referenceContractVersions,
    sourceAuditDigests: selection.sourceAuditDigests,
  }
}

function assertCanonicalApprovedStyleBinding(
  input: CompileCanonicalApprovedStorytellingSceneRecipeInput,
): StorytellingSceneRecipeStyleAuthority {
  const binding = input.canonicalStyleBinding
  if (!verifyCanonicalApprovedStorytellingStyleBinding(binding)) {
    throw new Error('Scene Recipe compilation canonical Storytelling style binding verification failed.')
  }
  const styleAuthority = binding.canonicalStyleComponent.authority
  if (
    binding.workspaceId !== input.workspaceId ||
    binding.projectId !== input.projectId ||
    binding.editSessionId !== input.editSessionId ||
    binding.productionId !== input.productionId ||
    styleAuthority.workspaceId !== input.workspaceId ||
    styleAuthority.projectId !== input.projectId ||
    styleAuthority.editSessionId !== input.editSessionId ||
    styleAuthority.productionId !== input.productionId
  ) {
    throw new Error('Scene Recipe compilation must preserve the canonical workspace, project, edit, and production identity.')
  }
  return {
    approvedPlanSnapshotId: binding.approvedSnapshot.snapshotId,
    approvedPlanSnapshotDigest: binding.approvedSnapshot.snapshotHash,
    selectionDigest: styleAuthority.styleSelection.selectionDigest,
    styleProfile: styleAuthority.styleSelection.styleProfile,
    motionLanguage: styleAuthority.styleSelection.motionLanguage,
    motionDnaVersion: styleAuthority.styleSelection.motionDnaVersion,
    referenceContractVersions: styleAuthority.styleSelection.referenceContractVersions,
    sourceAuditDigests: styleAuthority.styleSelection.sourceAuditDigests,
  }
}

function resolveApprovedSceneContinuity(
  input: CompileStorytellingSceneRecipeBaseInput & {
    approvedPlanSnapshotId: string
    approvedPlanSnapshotDigest: string
  },
  styleAuthority: StorytellingSceneRecipeStyleAuthority,
) {
  const motionDnaVersion = input.snapshotBoundMotionDnaVersion
  const preparedScriptVersion = input.snapshotBoundPreparedScriptVersion
  assertArtifactVersionMatchesReference(
    motionDnaVersion,
    styleAuthority.motionDnaVersion,
    'Motion DNA',
  )
  if (motionDnaVersion.kind !== 'motion_dna') {
    throw new Error('Scene continuity requires the exact snapshot-bound Motion DNA artifact version.')
  }
  if (preparedScriptVersion.kind !== 'prepared_script') {
    throw new Error('Scene continuity requires the exact snapshot-bound Prepared Script artifact version.')
  }
  if (motionDnaVersion.productionId !== input.productionId ||
      preparedScriptVersion.productionId !== input.productionId) {
    throw new Error('Scene continuity artifact versions changed the exact production identity.')
  }
  if (motionDnaVersion.payload.schemaVersion !== 'motion-studio.motion-dna.v1' ||
      preparedScriptVersion.payload.schemaVersion !== 'motion-studio.prepared-script.v1') {
    throw new Error('Scene continuity artifact versions changed their exact payload contracts.')
  }
  const readableSnapshotStates = new Set(['draft', 'in_review', 'approved', 'locked', 'superseded'])
  if (!readableSnapshotStates.has(motionDnaVersion.state) ||
      !readableSnapshotStates.has(preparedScriptVersion.state)) {
    throw new Error('Scene continuity artifact versions are not readable under the approved snapshot.')
  }
  const motionDna = motionStudioMotionDnaSchema.parse(motionDnaVersion.payload.data)
  const preparedScript = motionStudioPreparedScriptSchema.parse(preparedScriptVersion.payload.data)
  const grammar = motionDna.storyContinuityGrammar
  if (!grammar || !verifyStorytellingStoryContinuityGrammarDigest(grammar)) {
    throw new Error('Scene Recipe compilation requires the exact digest-valid Story Continuity Grammar from Motion DNA.')
  }
  assertArtifactVersionMatchesReference(
    preparedScriptVersion,
    grammar.preparedScriptVersion,
    'Prepared Script',
  )
  for (const field of ['workspaceId', 'projectId', 'editSessionId', 'productionId'] as const) {
    if (motionDna[field] !== input[field] || preparedScript[field] !== input[field] || grammar[field] !== input[field]) {
      throw new Error(`Scene continuity changed the exact ${field} authority.`)
    }
  }
  if (sha256CanonicalJson(grammar.styleProfile) !== sha256CanonicalJson(styleAuthority.styleProfile)) {
    throw new Error('Scene continuity changed the exact approved Storytelling style profile.')
  }
  if (sha256CanonicalJson([...grammar.referenceContractVersions].sort(compareVersionReferences)) !==
      sha256CanonicalJson([...styleAuthority.referenceContractVersions].sort(compareVersionReferences))) {
    throw new Error('Scene continuity changed the approved Reference Contract set.')
  }
  if (sha256CanonicalJson([...grammar.sourceAuditDigests].sort()) !==
      sha256CanonicalJson([...styleAuthority.sourceAuditDigests].sort())) {
    throw new Error('Scene continuity changed the approved source-audit set.')
  }
  const requiredDigests = new Set([
    styleAuthority.motionDnaVersion.contentDigest,
    grammar.grammarDigest,
    grammar.storyBibleVersion.contentDigest,
    grammar.preparedScriptVersion.contentDigest,
    ...grammar.referenceContractVersions.map((version) => version.contentDigest),
    ...grammar.sourceAuditDigests,
  ])
  const suppliedDigests = new Set(input.inputArtifactDigests)
  if ([...requiredDigests].some((digest) => !suppliedDigests.has(digest))) {
    throw new Error('Scene Recipe input artifacts omit approved Story Continuity lineage.')
  }
  return compileStorytellingSceneContinuitySlice({
    grammar,
    preparedScript,
    sourceMotionDnaVersion: styleAuthority.motionDnaVersion,
    sceneId: input.sceneId,
  })
}

function assertArtifactVersionMatchesReference(
  version: MotionStudioArtifactVersionDto,
  reference: MotionStudioVersionReference,
  label: string,
): void {
  if (!version.immutable || version.artifactId !== reference.artifactId ||
      version.id !== reference.versionId || version.versionNumber !== reference.versionNumber ||
      version.contentDigest !== reference.contentDigest) {
    throw new Error(`Scene continuity requires the exact snapshot-bound ${label} version.`)
  }
}

function compareVersionReferences(
  left: MotionStudioVersionReference,
  right: MotionStudioVersionReference,
): number {
  return left.artifactId.localeCompare(right.artifactId) ||
    left.versionNumber - right.versionNumber || left.versionId.localeCompare(right.versionId)
}

function verifyGeneratedMediaAuthority(
  input: CompileStorytellingSceneRecipeBaseInput & {
    approvedPlanSnapshotId: string
    approvedPlanSnapshotDigest: string
  },
  styleAuthority: StorytellingSceneRecipeStyleAuthority,
): string | undefined {
  const profile = input.projectVideoRoutingProfile
  if (!input.requiresGeneratedMedia) {
    if (profile) throw new Error('Deterministic Scene Recipe compilation must not invent generated-media routing authority.')
    return undefined
  }
  if (!profile || !validateProjectVideoRoutingProfile(profile).ok ||
      !verifyStorytellingStyleAuthorityDigest(profile)) {
    throw new Error('Generated-media Scene Recipe compilation requires a digest-valid Project Video Routing Profile.')
  }
  if (profile.state !== 'approved' || !profile.allRequiredScenariosAccepted || !profile.bulkGenerationAllowed) {
    throw new Error('Generated-media Scene Recipe compilation requires an approved, fully accepted Project Video Routing Profile.')
  }
  if (profile.approvedPlanSnapshotId !== input.approvedPlanSnapshotId ||
      profile.approvedPlanSnapshotDigest !== input.approvedPlanSnapshotDigest) {
    throw new Error('Project Video Routing Profile does not bind the exact approved plan snapshot.')
  }
  if (profile.workspaceId !== input.workspaceId ||
      profile.projectId !== input.projectId ||
      profile.editSessionId !== input.editSessionId ||
      profile.productionId !== input.productionId ||
      sha256CanonicalJson(profile.styleProfile) !== sha256CanonicalJson(styleAuthority.styleProfile) ||
      sha256CanonicalJson(profile.motionDnaVersion) !== sha256CanonicalJson(styleAuthority.motionDnaVersion)) {
    throw new Error('Project Video Routing Profile does not match the exact Storytelling style authority.')
  }
  return profile.profileDigest
}

function isDeterministicCompositionFamily(
  family: StorytellingMotionStyleRecipeFamily,
): boolean {
  return family !== 'cinematic_reconstruction' && family !== 'hybrid_documentary'
}

function assertUnique(values: readonly string[], label: string): void {
  if (new Set(values).size !== values.length) throw new Error(`${label} must be unique.`)
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child)
  }
  return value
}
