import type {
  MotionDNA,
  MotionStudioVersionReference,
  PreparedScript,
  StoryBible,
  StorytellingMotionStyleProfileReference,
  StorytellingSceneContinuitySlice,
  StorytellingStoryContinuityGrammar,
  StorytellingStoryContinuityGrammarProposal,
} from '../../../src/types/motion-studio'
import {
  MOTION_STUDIO_STORYTELLING_SCENE_CONTINUITY_SLICE_VERSION,
  MOTION_STUDIO_STORYTELLING_STORY_CONTINUITY_GRAMMAR_VERSION,
} from '../../../src/types/motion-studio'
import {
  MOTION_STUDIO_MOTION_LANGUAGE_DEFINITIONS,
  motionStudioMotionDnaSchema,
  motionStudioPreparedScriptSchema,
  motionStudioStoryBibleSchema,
  storytellingSceneContinuitySliceSchema,
  storytellingStoryContinuityGrammarProposalSchema,
  storytellingStoryContinuityGrammarSchema,
} from '../../../src/lib/motion-studio/contracts'
import { sha256CanonicalJson } from '../commands/canonical-json'
import {
  getStorytellingMotionStyleProfile,
  storytellingMotionStyleProfileReference,
} from './catalog'

export interface CompileStorytellingStoryContinuityGrammarInput {
  storyBible: StoryBible
  storyBibleVersion: MotionStudioVersionReference
  preparedScript: PreparedScript
  preparedScriptVersion: MotionStudioVersionReference
  motionDna: MotionDNA
  styleProfile: StorytellingMotionStyleProfileReference
  referenceContractVersions: readonly MotionStudioVersionReference[]
  sourceAuditDigests: readonly string[]
  proposal: StorytellingStoryContinuityGrammarProposal
}

/**
 * Compiles a Director-authored cross-scene proposal against exact story,
 * script, style, reference, and timing authority. The result is still draft
 * Plan Review input and cannot execute or mutate an approved snapshot.
 */
export function compileStorytellingStoryContinuityGrammar(
  input: CompileStorytellingStoryContinuityGrammarInput,
): StorytellingStoryContinuityGrammar {
  const storyBible = motionStudioStoryBibleSchema.parse(structuredClone(input.storyBible))
  const preparedScript = motionStudioPreparedScriptSchema.parse(structuredClone(input.preparedScript))
  const motionDna = motionStudioMotionDnaSchema.parse(structuredClone(input.motionDna))
  const proposal = storytellingStoryContinuityGrammarProposalSchema.parse(structuredClone(input.proposal))

  assertSameScope(storyBible, preparedScript, motionDna)
  assertExactArtifactVersion(storyBible.id, input.storyBibleVersion, 'Story Bible')
  assertExactArtifactVersion(preparedScript.id, input.preparedScriptVersion, 'Prepared Script')
  assertStyleAuthority(input.styleProfile, motionDna)
  assertReferenceContracts(input.referenceContractVersions, motionDna)
  assertUnique(input.sourceAuditDigests, 'Story continuity source-audit digests')
  if (['storytelling_style.editorial_collage', 'storytelling_style.paper_diorama_documentary']
    .includes(input.styleProfile.styleProfileId) && input.sourceAuditDigests.length === 0) {
    fail('This reference-derived Storytelling direction requires its exact source-audit digest.')
  }

  const segmentById = new Map(preparedScript.narrationSegments.map((segment) => [segment.id, segment]))
  const sceneOrder = preparedScript.chapters.flatMap((chapter) => chapter.sceneIds)
  const sceneIndex = new Map(sceneOrder.map((sceneId, index) => [sceneId, index]))
  assertStoryArc(proposal, segmentById)
  assertThroughLine(proposal, segmentById)
  assertRevealBeats(proposal, segmentById)
  assertTransitions(proposal, segmentById, sceneIndex, input.styleProfile)
  assertRhythm(proposal, segmentById)

  const referenceContractVersions = [...input.referenceContractVersions]
    .sort(compareVersionReferences)
  const sourceAuditDigests = [...input.sourceAuditDigests].sort()
  const base = {
    schemaVersion: MOTION_STUDIO_STORYTELLING_STORY_CONTINUITY_GRAMMAR_VERSION,
    workspaceId: storyBible.workspaceId,
    projectId: storyBible.projectId,
    editSessionId: storyBible.editSessionId,
    productionId: storyBible.productionId,
    storyBibleVersion: structuredClone(input.storyBibleVersion),
    preparedScriptVersion: structuredClone(input.preparedScriptVersion),
    styleProfile: structuredClone(input.styleProfile),
    referenceContractVersions,
    sourceAuditDigests,
    ...structuredClone(proposal),
    precisionCompositionPolicy: {
      essentialTextAuthority: 'reeditpro_deterministic_layers' as const,
      mapChartDataAuthority: 'reeditpro_deterministic_layers' as const,
      finalCompositionAuthority: 'remotion' as const,
      fixedStoryBlockDurationAllowed: false as const,
      forcedContinuousOnerAllowed: false as const,
      providerIdentityAllowed: false as const,
      publisherImitationAllowed: false as const,
    },
    status: 'draft_for_plan_review' as const,
    immutable: true as const,
    planReviewIsSoleApprovalAuthority: true as const,
    approvedSnapshotMutationAllowed: false as const,
    runtimeExecutionAuthorized: false as const,
  }
  const grammar = storytellingStoryContinuityGrammarSchema.parse({
    ...base,
    grammarDigest: sha256CanonicalJson(base),
  })
  return deepFreeze(grammar)
}

export function verifyStorytellingStoryContinuityGrammarDigest(
  grammar: StorytellingStoryContinuityGrammar,
): boolean {
  const parsed = storytellingStoryContinuityGrammarSchema.safeParse(grammar)
  if (!parsed.success) return false
  const { grammarDigest, ...base } = parsed.data
  return sha256CanonicalJson(base) === grammarDigest
}

export interface CompileStorytellingSceneContinuitySliceInput {
  grammar: StorytellingStoryContinuityGrammar
  preparedScript: PreparedScript
  sourceMotionDnaVersion: MotionStudioVersionReference
  sceneId: string
}

/**
 * Projects one scene's approved continuity instructions without creating a
 * second story, scene, plan, or execution authority.
 */
export function compileStorytellingSceneContinuitySlice(
  input: CompileStorytellingSceneContinuitySliceInput,
): StorytellingSceneContinuitySlice {
  const grammar = storytellingStoryContinuityGrammarSchema.parse(structuredClone(input.grammar))
  const preparedScript = motionStudioPreparedScriptSchema.parse(structuredClone(input.preparedScript))
  if (!verifyStorytellingStoryContinuityGrammarDigest(grammar)) {
    fail('Scene continuity requires a digest-valid Story Continuity Grammar.')
  }
  for (const field of ['workspaceId', 'projectId', 'editSessionId', 'productionId'] as const) {
    if (grammar[field] !== preparedScript[field]) {
      fail(`Scene continuity ${field} does not match the exact Prepared Script.`)
    }
  }
  assertExactArtifactVersion(preparedScript.id, grammar.preparedScriptVersion, 'Prepared Script')
  const sceneOrder = preparedScript.chapters.flatMap((chapter) => chapter.sceneIds)
  if (!sceneOrder.includes(input.sceneId)) {
    fail('Scene continuity references a scene outside the exact Prepared Script.')
  }
  const segmentById = new Map(preparedScript.narrationSegments.map((segment) => [segment.id, segment]))
  const openingSceneId = requiredSegment(
    segmentById,
    grammar.arc.openingSegmentId,
    'Story arc opening',
  ).sceneId
  const resolutionSceneId = requiredSegment(
    segmentById,
    grammar.arc.resolutionSegmentId,
    'Story arc resolution',
  ).sceneId
  const isOpening = input.sceneId === openingSceneId
  const isResolution = input.sceneId === resolutionSceneId
  const arcRole = isOpening && isResolution
    ? 'opening_and_resolution' as const
    : isOpening
      ? 'opening' as const
      : isResolution
        ? 'resolution' as const
        : 'development' as const
  const throughLine = grammar.throughLine.mode === 'none_selected'
    ? structuredClone(grammar.throughLine)
    : {
        mode: 'recurring_motif' as const,
        motifId: grammar.throughLine.motifId,
        label: grammar.throughLine.label,
        semanticRole: grammar.throughLine.semanticRole,
        origin: grammar.throughLine.origin,
        rightsEvidenceIds: [...grammar.throughLine.rightsEvidenceIds],
        continuityRules: [...grammar.throughLine.continuityRules],
        appearances: grammar.throughLine.appearances
          .filter((appearance) => appearance.sceneId === input.sceneId)
          .map((appearance) => structuredClone(appearance)),
      }
  const base = {
    schemaVersion: MOTION_STUDIO_STORYTELLING_SCENE_CONTINUITY_SLICE_VERSION,
    workspaceId: grammar.workspaceId,
    projectId: grammar.projectId,
    editSessionId: grammar.editSessionId,
    productionId: grammar.productionId,
    sceneId: input.sceneId,
    sourceMotionDnaVersion: structuredClone(input.sourceMotionDnaVersion),
    sourcePreparedScriptVersion: structuredClone(grammar.preparedScriptVersion),
    sourceGrammarDigest: grammar.grammarDigest,
    arc: {
      mode: grammar.arc.mode,
      role: arcRole,
      ...(isOpening ? { openingPrompt: grammar.arc.openingPrompt } : {}),
      ...(isResolution ? {
        resolutionSummary: grammar.arc.resolutionSummary,
        resolutionMode: grammar.arc.resolutionMode,
        unresolvedUncertainty: [...grammar.arc.unresolvedUncertainty],
      } : { unresolvedUncertainty: [] }),
    },
    throughLine,
    revealBeats: grammar.revealBeats
      .filter((beat) => beat.sceneId === input.sceneId)
      .map((beat) => structuredClone(beat)),
    ...(grammar.transitionContinuity.find((transition) => transition.toSceneId === input.sceneId)
      ? { incomingTransition: structuredClone(grammar.transitionContinuity.find(
          (transition) => transition.toSceneId === input.sceneId,
        )!) }
      : {}),
    ...(grammar.transitionContinuity.find((transition) => transition.fromSceneId === input.sceneId)
      ? { outgoingTransition: structuredClone(grammar.transitionContinuity.find(
          (transition) => transition.fromSceneId === input.sceneId,
        )!) }
      : {}),
    rhythmBeats: grammar.rhythmBeats
      .filter((beat) => beat.sceneId === input.sceneId)
      .map((beat) => structuredClone(beat)),
    precisionCompositionPolicy: structuredClone(grammar.precisionCompositionPolicy),
    approvedSnapshotProjection: true as const,
    runtimeExecutionAuthorized: false as const,
    immutable: true as const,
  }
  return deepFreeze(storytellingSceneContinuitySliceSchema.parse({
    ...base,
    sliceDigest: sha256CanonicalJson(base),
  }))
}

export function verifyStorytellingSceneContinuitySliceDigest(
  value: StorytellingSceneContinuitySlice,
): boolean {
  const parsed = storytellingSceneContinuitySliceSchema.safeParse(value)
  if (!parsed.success) return false
  const { sliceDigest, ...base } = parsed.data
  return sha256CanonicalJson(base) === sliceDigest
}

/** Adds the draft grammar to the existing Motion DNA payload in memory. */
export function attachStorytellingStoryContinuityGrammar(
  motionDnaInput: MotionDNA,
  grammarInput: StorytellingStoryContinuityGrammar,
): MotionDNA {
  const motionDna = motionStudioMotionDnaSchema.parse(structuredClone(motionDnaInput))
  const grammar = storytellingStoryContinuityGrammarSchema.parse(structuredClone(grammarInput))
  if (!verifyStorytellingStoryContinuityGrammarDigest(grammar)) {
    fail('Story continuity grammar digest verification failed.')
  }
  const attached = motionStudioMotionDnaSchema.parse({
    ...motionDna,
    storyContinuityGrammar: grammar,
  })
  return deepFreeze(attached)
}

/** Clears stale style-bound grammar while preserving the rest of Motion DNA. */
export function clearStorytellingStoryContinuityGrammar(motionDnaInput: MotionDNA): MotionDNA {
  const motionDna = motionStudioMotionDnaSchema.parse(structuredClone(motionDnaInput))
  const withoutGrammar = { ...motionDna }
  delete withoutGrammar.storyContinuityGrammar
  return deepFreeze(motionStudioMotionDnaSchema.parse(withoutGrammar))
}

function assertStoryArc(
  proposal: StorytellingStoryContinuityGrammarProposal,
  segmentById: ReadonlyMap<string, PreparedScript['narrationSegments'][number]>,
): void {
  const opening = requiredSegment(segmentById, proposal.arc.openingSegmentId, 'Story arc opening')
  const resolution = requiredSegment(segmentById, proposal.arc.resolutionSegmentId, 'Story arc resolution')
  if (opening.order >= resolution.order) {
    fail('Story arc resolution must occur after the opening segment.')
  }
}

function assertThroughLine(
  proposal: StorytellingStoryContinuityGrammarProposal,
  segmentById: ReadonlyMap<string, PreparedScript['narrationSegments'][number]>,
): void {
  if (proposal.throughLine.mode === 'none_selected') return
  let priorSegmentOrder = -1
  for (const appearance of proposal.throughLine.appearances) {
    const segment = requiredSegment(segmentById, appearance.segmentId, 'Through-line appearance')
    assertScene(segment.sceneId, appearance.sceneId, 'Through-line appearance')
    if (segment.order <= priorSegmentOrder) {
      fail('Through-line appearances must move forward through the Prepared Script.')
    }
    priorSegmentOrder = segment.order
    assertSubset(appearance.claimIds, segment.claimIds, 'Through-line claim')
    assertSubset(appearance.sourceReferenceIds, segment.sourceReferenceIds, 'Through-line source reference')
  }
  if (proposal.throughLine.origin === 'source_derived_noncopying' &&
      proposal.throughLine.appearances.every((appearance) => appearance.sourceReferenceIds.length === 0)) {
    fail('A source-derived through-line requires an exact source reference.')
  }
}

function assertRevealBeats(
  proposal: StorytellingStoryContinuityGrammarProposal,
  segmentById: ReadonlyMap<string, PreparedScript['narrationSegments'][number]>,
): void {
  for (const reveal of proposal.revealBeats) {
    const segment = requiredSegment(segmentById, reveal.segmentId, 'Reveal beat')
    assertScene(segment.sceneId, reveal.sceneId, 'Reveal beat')
    assertTriggerFrame(reveal.triggerFrame, segment.startFrame, segment.endFrame, 'Reveal beat')
    assertSubset(reveal.claimIds, segment.claimIds, 'Reveal claim')
    assertSubset(reveal.sourceReferenceIds, segment.sourceReferenceIds, 'Reveal source reference')
    if (reveal.kind === 'motif_payoff') {
      if (proposal.throughLine.mode !== 'recurring_motif') {
        fail('A motif-payoff reveal requires an approved recurring motif proposal.')
      }
      const payoff = proposal.throughLine.appearances.at(-1)!
      if (payoff.sceneId !== reveal.sceneId || payoff.segmentId !== reveal.segmentId) {
        fail('A motif-payoff reveal must match the through-line payoff appearance.')
      }
    }
  }
}

function assertTransitions(
  proposal: StorytellingStoryContinuityGrammarProposal,
  segmentById: ReadonlyMap<string, PreparedScript['narrationSegments'][number]>,
  sceneIndex: ReadonlyMap<string, number>,
  styleProfile: StorytellingMotionStyleProfileReference,
): void {
  const profile = getStorytellingMotionStyleProfile(styleProfile.styleProfileId)
  const language = MOTION_STUDIO_MOTION_LANGUAGE_DEFINITIONS.find((candidate) =>
    candidate.id === profile.motionLanguage.motionLanguageId &&
    candidate.version === profile.motionLanguage.motionLanguageVersion &&
    candidate.contentDigest === profile.motionLanguage.motionLanguageDigest)
  if (!language) fail('Story continuity grammar could not resolve its exact Motion Language.')
  for (const transition of proposal.transitionContinuity) {
    const from = requiredSegment(segmentById, transition.fromSegmentId, 'Transition source')
    const to = requiredSegment(segmentById, transition.toSegmentId, 'Transition destination')
    assertScene(from.sceneId, transition.fromSceneId, 'Transition source')
    assertScene(to.sceneId, transition.toSceneId, 'Transition destination')
    const fromIndex = sceneIndex.get(transition.fromSceneId)
    const toIndex = sceneIndex.get(transition.toSceneId)
    if (fromIndex === undefined || toIndex !== fromIndex + 1) {
      fail('Transition continuity may connect only adjacent Prepared Script scenes.')
    }
    if (from.order >= to.order) fail('Transition continuity must move forward through the Prepared Script.')
    if (!language.transitionGrammar.families.includes(transition.transitionFamily)) {
      fail(`Transition family ${transition.transitionFamily} is outside the exact Motion Language.`)
    }
    if (transition.anchorKind === 'motif') {
      if (proposal.throughLine.mode !== 'recurring_motif' ||
          transition.anchorId !== proposal.throughLine.motifId) {
        fail('A motif transition must bind the exact recurring motif.')
      }
    }
  }
}

function assertRhythm(
  proposal: StorytellingStoryContinuityGrammarProposal,
  segmentById: ReadonlyMap<string, PreparedScript['narrationSegments'][number]>,
): void {
  for (const beat of proposal.rhythmBeats) {
    const segment = requiredSegment(segmentById, beat.segmentId, 'Rhythm beat')
    assertScene(segment.sceneId, beat.sceneId, 'Rhythm beat')
    assertTriggerFrame(beat.triggerFrame, segment.startFrame, segment.endFrame, 'Rhythm beat')
  }
}

function assertSameScope(storyBible: StoryBible, preparedScript: PreparedScript, motionDna: MotionDNA): void {
  for (const field of ['workspaceId', 'projectId', 'editSessionId', 'productionId'] as const) {
    if (storyBible[field] !== preparedScript[field] || storyBible[field] !== motionDna[field]) {
      fail(`Story continuity ${field} does not match the exact Storytelling authority.`)
    }
  }
}

function assertExactArtifactVersion(
  artifactId: string,
  version: MotionStudioVersionReference,
  label: string,
): void {
  if (version.artifactId !== artifactId) fail(`${label} version belongs to another artifact.`)
}

function assertStyleAuthority(style: StorytellingMotionStyleProfileReference, motionDna: MotionDNA): void {
  const profile = getStorytellingMotionStyleProfile(style.styleProfileId)
  if (sha256CanonicalJson(style) !== sha256CanonicalJson(storytellingMotionStyleProfileReference(profile))) {
    fail('Story continuity grammar received a stale or tampered style profile.')
  }
  const marker = `Style authority ${style.styleProfileId}@${style.styleProfileVersion}#${style.styleProfileDigest}`
  if (!motionDna.continuityRules.includes(marker)) {
    fail('Story continuity grammar requires the exact Motion DNA style authority.')
  }
}

function assertReferenceContracts(
  versions: readonly MotionStudioVersionReference[],
  motionDna: MotionDNA,
): void {
  assertUnique(versions.map((version) => version.artifactId), 'Story continuity Reference Contracts')
  const expected = [...new Set(motionDna.referenceContractIds)].sort()
  const actual = [...new Set(versions.map((version) => version.artifactId))].sort()
  if (sha256CanonicalJson(expected) !== sha256CanonicalJson(actual)) {
    fail('Story continuity grammar requires the exact Motion DNA Reference Contract set.')
  }
}

function requiredSegment(
  segmentById: ReadonlyMap<string, PreparedScript['narrationSegments'][number]>,
  segmentId: string,
  label: string,
): PreparedScript['narrationSegments'][number] {
  const segment = segmentById.get(segmentId)
  if (!segment) fail(`${label} references an unknown Prepared Script segment.`)
  return segment
}

function assertScene(actual: string, expected: string, label: string): void {
  if (actual !== expected) fail(`${label} scene does not match its Prepared Script segment.`)
}

function assertTriggerFrame(triggerFrame: number, startFrame: number, endFrame: number, label: string): void {
  if (triggerFrame < startFrame || triggerFrame >= endFrame) {
    fail(`${label} trigger frame is outside its exact Prepared Script segment.`)
  }
}

function assertSubset(values: readonly string[], authority: readonly string[], label: string): void {
  assertUnique(values, `${label} IDs`)
  const allowed = new Set(authority)
  if (values.some((value) => !allowed.has(value))) {
    fail(`${label} is not present on the exact Prepared Script segment.`)
  }
}

function assertUnique(values: readonly string[], label: string): void {
  if (new Set(values).size !== values.length) fail(`${label} must be unique.`)
}

function compareVersionReferences(left: MotionStudioVersionReference, right: MotionStudioVersionReference): number {
  return left.artifactId.localeCompare(right.artifactId) ||
    left.versionNumber - right.versionNumber ||
    left.versionId.localeCompare(right.versionId)
}

function fail(message: string): never {
  throw new Error(message)
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child)
  }
  return value
}
