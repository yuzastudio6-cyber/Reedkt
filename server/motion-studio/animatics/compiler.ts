import type { JSONValue } from '../../../src/types/shared'
import {
  motionStudioAnimaticPlanSchema,
  motionStudioPreparedScriptSchema,
  motionStudioSceneDocumentSchema,
  motionStudioStoryboardSchema,
  motionStudioVoiceBibleSchema,
} from '../../../src/lib/motion-studio/contracts'
import type {
  MotionStudioAnimaticPlan,
  MotionStudioArtifactPayload,
  MotionStudioStoryboard,
  MotionStudioVersionReference,
  PreparedScript,
  UploadedNarrationAuthority,
  VoiceBible,
} from '../../../src/types/motion-studio'
import { ApiError } from '../../errors/api-error'
import { sha256CanonicalJson } from '../commands/canonical-json'
import { verifyStorytellingSceneContinuitySliceDigest } from '../style-system/story-continuity-grammar'
import type { MotionStudioArtifactVersionRow, MotionStudioProductionRow } from '../commands/types'
import type { MotionStudioApprovedSnapshotRow, MotionStudioTimelineProposalRow } from '../scenes/types'
import { parseSnapshotAuthority } from '../scenes/service'
import { versionReference } from '../scenes/types'

export const MOTION_STUDIO_ANIMATIC_PROFILE_ID = 'motion_studio_prepared_script_animatic_v1' as const
export const MOTION_STUDIO_ANIMATIC_COMPILER_ID = 'motion-studio-prepared-script-animatic-compiler' as const
export const MOTION_STUDIO_ANIMATIC_COMPILER_VERSION = 'ms-008.0.0' as const

export interface MotionStudioAnimaticSceneAuthority {
  documentVersion: MotionStudioArtifactVersionRow
  proposal: MotionStudioTimelineProposalRow
}

export interface CompileMotionStudioAnimaticCandidatesInput {
  production: MotionStudioProductionRow
  snapshot: MotionStudioApprovedSnapshotRow
  preparedScriptVersion: MotionStudioArtifactVersionRow
  scenes: readonly MotionStudioAnimaticSceneAuthority[]
  narration: UploadedNarrationAuthority
}

export interface CompiledMotionStudioAnimaticCandidates {
  preparedScript: PreparedScript
  narrationAuthorityDigest: string
  voicePayload: MotionStudioArtifactPayload
  storyboardPayload: MotionStudioArtifactPayload
  animaticPayload: MotionStudioArtifactPayload
  inputDigest: string
  orderedSceneVersionIds: readonly string[]
  orderedProposalIds: readonly string[]
}

const PENDING_VOICE_REFERENCE: MotionStudioVersionReference = {
  artifactId: 'pending-voice-bible', versionId: 'pending-voice-version', versionNumber: 1,
  contentDigest: '0'.repeat(64),
}
const PENDING_STORYBOARD_REFERENCE: MotionStudioVersionReference = {
  artifactId: 'pending-storyboard', versionId: 'pending-storyboard-version', versionNumber: 1,
  contentDigest: '0'.repeat(64),
}
const PLACEHOLDER_DISCLOSURE = 'Timing-review placeholder only. Final production assets are not present and this panel cannot enter a final render.'

export function compileMotionStudioAnimaticCandidates(
  input: CompileMotionStudioAnimaticCandidatesInput,
): CompiledMotionStudioAnimaticCandidates {
  if (input.preparedScriptVersion.kind !== 'prepared_script' || !['approved', 'locked'].includes(input.preparedScriptVersion.state)) {
    blocked('Exact approved prepared-script authority is required.')
  }
  const preparedScript = parsePreparedScript(input.preparedScriptVersion)
  const snapshotAuthority = parseSnapshotAuthority(input.snapshot)
  assertSameTimingAuthority(preparedScript.timingAuthority, snapshotAuthority.timingAuthority)
  if (preparedScript.productionId !== input.production.id) blocked('Prepared script belongs to another production.')
  if (input.scenes.length < 1 || input.scenes.length > 8) blocked('Prepared animatic requires one to eight exact scenes.')
  assertNarrationDuration(input.narration, preparedScript)

  const scriptVersionReference = versionReference(input.preparedScriptVersion)
  const compiledScenes = input.scenes.map((scene) => compileSceneAuthority(
    scene,
    preparedScript,
    input.snapshot.id,
    input.production.id,
  )).sort((left, right) => left.startFrame - right.startFrame || left.sceneId.localeCompare(right.sceneId))
  assertContiguousSceneCoverage(compiledScenes, preparedScript.timingAuthority.durationFrames)
  if (new Set(compiledScenes.map((scene) => scene.sceneId)).size !== compiledScenes.length) {
    blocked('Prepared animatic scene identities must be unique.')
  }
  assertStoryContinuitySequence(compiledScenes, scriptVersionReference)

  const voiceBible: VoiceBible = motionStudioVoiceBibleSchema.parse({
    workspaceId: input.production.workspace_id,
    projectId: input.production.project_id,
    editSessionId: input.production.edit_session_id,
    id: 'pending-voice-bible',
    productionId: input.production.id,
    providerCapability: 'uploaded_narration',
    performanceDirection: ['Preserve the uploaded narration performance and timing exactly.'],
    pronunciationDictionary: {},
    sceneTakeVersionIds: [],
    aiVoiceDisclosureRequired: false,
    cloningEnabled: false,
    dubbingEnabled: false,
    uploadedNarration: input.narration,
  })
  const panels = compiledScenes.map((scene, order) => {
    const chapter = preparedScript.chapters.find((candidate) => candidate.id === scene.chapterId)
    return {
      id: `panel:${scene.sceneId}`,
      order,
      chapterId: scene.chapterId,
      sceneId: scene.sceneId,
      sceneDocument: versionReference(scene.documentVersion),
      timelineProposalId: scene.proposal.id,
      timelineProposalOutputDigest: scene.proposal.output_digest,
      narrationSegmentIds: scene.narrationSegmentIds,
      startFrame: scene.startFrame,
      endFrame: scene.endFrame,
      title: chapter?.title ?? scene.sceneId,
      visualDescription: sceneVisualDescription(scene),
      ...(scene.storyContinuity
        ? { storyContinuity: structuredClone(scene.storyContinuity) }
        : {}),
      visualTreatment: 'deterministic_placeholder' as const,
      finalAssetEligible: false as const,
    }
  })
  const storyboard: MotionStudioStoryboard = motionStudioStoryboardSchema.parse({
    workspaceId: input.production.workspace_id,
    projectId: input.production.project_id,
    editSessionId: input.production.edit_session_id,
    id: 'pending-storyboard',
    productionId: input.production.id,
    artifactType: 'storyboard',
    approvedSnapshotId: input.snapshot.id,
    preparedScriptVersion: scriptVersionReference,
    voiceBibleVersion: PENDING_VOICE_REFERENCE,
    timingAuthority: preparedScript.timingAuthority,
    panels,
    placeholderPolicy: {
      previewOnly: true,
      finalRenderAllowed: false,
      userVisibleDisclosure: PLACEHOLDER_DISCLOSURE,
    },
    status: 'review_needed',
    notes: ['Review narration timing, scene order and visual intent before higher-cost production.'],
  })
  const narrationAuthorityDigest = sha256CanonicalJson(input.narration)
  const animaticPlan: MotionStudioAnimaticPlan = motionStudioAnimaticPlanSchema.parse({
    workspaceId: input.production.workspace_id,
    projectId: input.production.project_id,
    editSessionId: input.production.edit_session_id,
    id: 'pending-animatic',
    productionId: input.production.id,
    artifactType: 'animatic',
    approvedSnapshotId: input.snapshot.id,
    preparedScriptVersion: scriptVersionReference,
    voiceBibleVersion: PENDING_VOICE_REFERENCE,
    storyboardVersion: PENDING_STORYBOARD_REFERENCE,
    timingAuthority: preparedScript.timingAuthority,
    narrationAuthorityDigest,
    registeredProfileId: MOTION_STUDIO_ANIMATIC_PROFILE_ID,
    orderedScenes: panels.map((panel) => ({
      order: panel.order,
      sceneId: panel.sceneId,
      storyboardPanelId: panel.id,
      sceneDocument: panel.sceneDocument,
      timelineProposalId: panel.timelineProposalId,
      timelineProposalOutputDigest: panel.timelineProposalOutputDigest,
      narrationSegmentIds: panel.narrationSegmentIds,
      startFrame: panel.startFrame,
      endFrame: panel.endFrame,
      ...(panel.storyContinuity
        ? { storyContinuity: structuredClone(panel.storyContinuity) }
        : {}),
    })),
    placeholderPolicy: storyboard.placeholderPolicy,
    status: 'review_needed',
    privateReviewOnly: true,
    finalAssetEligible: false,
    notes: ['Private prepared-script timing review only.'],
  })

  const voicePayload = payload('voice-bible', voiceBible)
  const storyboardPayload = payload('storyboard', storyboard)
  const animaticPayload = payload('animatic', animaticPlan)
  const inputDigest = sha256CanonicalJson({
    compilerId: MOTION_STUDIO_ANIMATIC_COMPILER_ID,
    compilerVersion: MOTION_STUDIO_ANIMATIC_COMPILER_VERSION,
    productionId: input.production.id,
    approvedSnapshotId: input.snapshot.id,
    preparedScriptVersion: scriptVersionReference,
    narrationAuthorityDigest,
    scenes: compiledScenes.map((scene) => ({
      sceneDocument: versionReference(scene.documentVersion),
      proposalId: scene.proposal.id,
      proposalOutputDigest: scene.proposal.output_digest,
      startFrame: scene.startFrame,
      endFrame: scene.endFrame,
      narrationSegmentIds: scene.narrationSegmentIds,
      storyContinuitySliceDigest: scene.storyContinuity?.sliceDigest,
    })),
  })
  return {
    preparedScript,
    narrationAuthorityDigest,
    voicePayload,
    storyboardPayload,
    animaticPayload,
    inputDigest,
    orderedSceneVersionIds: compiledScenes.map((scene) => scene.documentVersion.id),
    orderedProposalIds: compiledScenes.map((scene) => scene.proposal.id),
  }
}

function parsePreparedScript(version: MotionStudioArtifactVersionRow): PreparedScript {
  const parsed = motionStudioPreparedScriptSchema.safeParse(version.payload_json.data)
  if (!parsed.success) blocked('Prepared script payload is invalid.', parsed.error.flatten())
  return parsed.data
}

function compileSceneAuthority(
  scene: MotionStudioAnimaticSceneAuthority,
  script: PreparedScript,
  approvedSnapshotId: string,
  productionId: string,
) {
  if (scene.documentVersion.kind !== 'scene_document' || !['approved', 'locked'].includes(scene.documentVersion.state)) {
    blocked('Every animatic SceneDocument must be exactly approved or locked.')
  }
  const parsedDocument = motionStudioSceneDocumentSchema.safeParse(scene.documentVersion.payload_json.data)
  if (!parsedDocument.success) blocked('Animatic SceneDocument payload is invalid.', parsedDocument.error.flatten())
  const document = parsedDocument.data
  if (document.storyContinuity && !verifyStorytellingSceneContinuitySliceDigest(document.storyContinuity)) {
    blocked('Animatic SceneDocument Story Continuity digest is invalid.')
  }
  assertSameTimingAuthority(document.timingAuthority, script.timingAuthority)
  if (document.productionId !== productionId || document.approvedSnapshotId !== approvedSnapshotId) {
    blocked('Animatic SceneDocument ownership or snapshot authority changed.')
  }
  const proposal = scene.proposal
  if (
    proposal.production_id !== productionId || proposal.approved_snapshot_id !== approvedSnapshotId ||
    proposal.source_scene_document_artifact_id !== scene.documentVersion.artifact_id ||
    proposal.source_scene_document_version_id !== scene.documentVersion.id ||
    proposal.source_scene_document_digest !== scene.documentVersion.content_digest ||
    proposal.status !== 'proposed'
  ) blocked('Animatic timeline proposal does not bind its exact SceneDocument.')
  const ranges = proposal.operations_json.map((operation) => ({
    startFrame: operation.layer.timelineRange.startFrame,
    endFrame: operation.layer.timelineRange.endFrame,
  }))
  if (!ranges.length || ranges.some((range) => !Number.isSafeInteger(range.startFrame) || !Number.isSafeInteger(range.endFrame))) {
    blocked('Animatic timeline proposal lacks exact frame ranges.')
  }
  const startFrame = Math.min(...ranges.map((range) => range.startFrame!))
  const endFrame = Math.max(...ranges.map((range) => range.endFrame!))
  const narrationSegments = script.narrationSegments.filter((segment) => segment.sceneId === document.sceneId)
  if (!narrationSegments.length || narrationSegments[0]!.startFrame !== startFrame || narrationSegments.at(-1)!.endFrame !== endFrame) {
    blocked('Prepared narration segments do not exactly cover the SceneDocument proposal range.')
  }
  for (let index = 1; index < narrationSegments.length; index += 1) {
    if (narrationSegments[index - 1]!.endFrame !== narrationSegments[index]!.startFrame) {
      blocked('Prepared narration segments inside one scene must be contiguous.')
    }
  }
  if (document.timing.startAnchorId !== narrationSegments[0]!.startTimingAnchorId ||
      document.timing.endAnchorId !== narrationSegments.at(-1)!.endTimingAnchorId) {
    blocked('SceneDocument anchor range does not match prepared narration authority.')
  }
  return {
    documentVersion: scene.documentVersion,
    proposal,
    sceneId: document.sceneId,
    chapterId: narrationSegments[0]!.chapterId,
    semanticPurpose: document.semanticPurpose,
    narrationSegmentIds: narrationSegments.map((segment) => segment.id),
    startFrame,
    endFrame,
    ...(document.storyContinuity
      ? { storyContinuity: structuredClone(document.storyContinuity) }
      : {}),
  }
}

function assertStoryContinuitySequence(
  scenes: readonly ReturnType<typeof compileSceneAuthority>[],
  preparedScriptVersion: MotionStudioVersionReference,
): void {
  const continuityScenes = scenes.filter((scene) => scene.storyContinuity !== undefined)
  if (continuityScenes.length === 0) return
  if (continuityScenes.length !== scenes.length) {
    blocked('A continuity-bound animatic cannot mix bound and historical unbound scenes.')
  }
  const first = scenes[0]!.storyContinuity!
  if (sha256CanonicalJson(first.sourcePreparedScriptVersion) !== sha256CanonicalJson(preparedScriptVersion)) {
    blocked('Animatic Story Continuity does not bind the exact Prepared Script version.')
  }
  scenes.forEach((scene, index) => {
    const current = scene.storyContinuity!
    if (current.sceneId !== scene.sceneId || current.sourceGrammarDigest !== first.sourceGrammarDigest ||
        sha256CanonicalJson(current.sourceMotionDnaVersion) !== sha256CanonicalJson(first.sourceMotionDnaVersion) ||
        sha256CanonicalJson(current.sourcePreparedScriptVersion) !== sha256CanonicalJson(first.sourcePreparedScriptVersion)) {
      blocked('Animatic Story Continuity changed its exact scene, grammar, Motion DNA, or Prepared Script authority.')
    }
    if (index === 0) return
    const previous = scenes[index - 1]!.storyContinuity!
    if (previous.outgoingTransition?.id !== current.incomingTransition?.id) {
      blocked('Animatic adjacent Story Continuity transitions do not reconcile.')
    }
  })
}

function sceneVisualDescription(
  scene: ReturnType<typeof compileSceneAuthority>,
): string {
  const continuity = scene.storyContinuity
  if (!continuity) return scene.semanticPurpose
  const motif = continuity.throughLine.mode === 'recurring_motif' &&
    continuity.throughLine.appearances.length > 0
    ? ` Preserve ${continuity.throughLine.label} as the approved ${continuity.throughLine.appearances
      .map((appearance) => appearance.role).join('/')} beat.`
    : ''
  const reveal = continuity.revealBeats.length > 0
    ? ` Land ${continuity.revealBeats.length} approved reveal beat${continuity.revealBeats.length === 1 ? '' : 's'} at exact frames.`
    : ''
  return `${scene.semanticPurpose} This scene is the ${continuity.arc.role.replaceAll('_', ' ')} story beat.${motif}${reveal}`
}

function assertContiguousSceneCoverage(
  scenes: readonly { startFrame: number; endFrame: number }[],
  expectedEndFrame: number,
): void {
  let nextFrame = 0
  for (const scene of scenes) {
    if (scene.startFrame !== nextFrame || scene.endFrame <= scene.startFrame) {
      blocked('Animatic scene proposals must be positive, gap-free and non-overlapping.')
    }
    nextFrame = scene.endFrame
  }
  if (nextFrame !== expectedEndFrame) blocked('Animatic scene proposals must cover the exact MasterTimingPlan range.')
}

function assertNarrationDuration(narration: UploadedNarrationAuthority, script: PreparedScript): void {
  const expectedMilliseconds = script.timingAuthority.durationFrames / script.timingAuthority.frameRate * 1_000
  const oneFrameMilliseconds = 1_000 / script.timingAuthority.frameRate
  if (Math.abs(narration.durationMilliseconds - expectedMilliseconds) > oneFrameMilliseconds + 1) {
    blocked('Uploaded narration duration differs from approved timing by more than one frame.')
  }
}

function assertSameTimingAuthority(left: PreparedScript['timingAuthority'], right: PreparedScript['timingAuthority']): void {
  if (sha256CanonicalJson(left) !== sha256CanonicalJson(right)) blocked('Timing authority does not match the exact approved snapshot.')
}

function payload(schemaName: 'voice-bible' | 'storyboard' | 'animatic', data: unknown): MotionStudioArtifactPayload {
  return {
    schemaVersion: `motion-studio.${schemaName}.v1`,
    data: data as JSONValue,
    references: [],
    extensions: [],
  }
}

function blocked(message: string, details?: unknown): never {
  throw new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', message, 409, details)
}
