import {
  motionStudioAudioAuthorityBundleV2Schema,
  motionStudioPreparedScriptSchema,
} from '../../../src/lib/motion-studio/contracts'
import type {
  MotionStudioAudioAssetVersionRef,
  MotionStudioAudioAuthorityBundleV2,
  MotionStudioAudioCapabilityKind,
  MotionStudioAudioCapabilityPolicyEntryV1,
  MotionStudioAudioFrameRange,
  MotionStudioAudioStemOrigin,
  MotionStudioAudioStemRole,
  MotionStudioVersionReference,
  PreparedScript,
} from '../../../src/types/motion-studio'
import {
  MOTION_STUDIO_AUDIO_AUTHORITY_SCHEMA_VERSION,
  MOTION_STUDIO_AUDIO_CAPABILITY_POLICY_VERSION,
} from '../../../src/types/motion-studio'
import { ApiError } from '../../errors/api-error'
import { sha256CanonicalJson } from '../commands/canonical-json'
import type {
  CompileMotionStudioAudioAuthorityInput,
  CompiledMotionStudioAudioAuthority,
} from './types'

export const MOTION_STUDIO_AUDIO_AUTHORITY_COMPILER_ID =
  'motion-studio-storytelling-audio-authority-compiler' as const
export const MOTION_STUDIO_AUDIO_AUTHORITY_COMPILER_VERSION = 'ms-012a.0.0' as const

const VOICE_QA_GATES = [
  'file_integrity', 'alignment', 'pronunciation', 'voice_continuity',
  'clipping', 'loudness', 'timing', 'disclosure', 'rights',
] as const
const MIX_QA_GATES = [
  'stem_integrity', 'narration_intelligibility', 'speech_priority',
  'integrated_loudness', 'true_peak', 'clipping', 'cue_timing', 'rights',
] as const

export function compileMotionStudioAudioAuthority(
  rawInput: CompileMotionStudioAudioAuthorityInput,
): CompiledMotionStudioAudioAuthority {
  const preparedScriptResult = motionStudioPreparedScriptSchema.safeParse(rawInput.preparedScript)
  if (!preparedScriptResult.success) blocked('Prepared script is invalid.', preparedScriptResult.error.flatten())
  const preparedScript = preparedScriptResult.data
  assertInputAuthority(rawInput, preparedScript)

  const inputDigest = sha256CanonicalJson({
    compilerId: MOTION_STUDIO_AUDIO_AUTHORITY_COMPILER_ID,
    compilerVersion: MOTION_STUDIO_AUDIO_AUTHORITY_COMPILER_VERSION,
    ...rawInput,
  })
  const id = (label: string) => deterministicUuid(inputDigest, label)
  const scope = { ...rawInput.ownership, productionId: rawInput.productionId }
  const directionBySegment = new Map(rawInput.voiceDirections.map((direction) => [
    direction.preparedScriptSegmentId,
    direction,
  ]))
  if (directionBySegment.size !== rawInput.voiceDirections.length) {
    blocked('Voice directions must bind unique prepared-script segments.')
  }
  if (
    directionBySegment.size !== preparedScript.narrationSegments.length ||
    preparedScript.narrationSegments.some((segment) => !directionBySegment.has(segment.id))
  ) blocked('Every prepared-script narration segment requires one exact voice direction.')

  const capabilityPolicyEntries = capabilityEntries(id)
  const capabilityByRoute = new Map(capabilityPolicyEntries.map((entry) => [entry.routeId, entry]))
  const voiceSegments = preparedScript.narrationSegments.map((segment) => {
    const direction = directionBySegment.get(segment.id)!
    return {
      ...scope,
      schemaVersion: 'motion-studio.voice-segment-plan.v2' as const,
      voiceSegmentId: id(`voice-segment:${segment.id}`),
      preparedScriptArtifactVersion: rawInput.preparedScriptArtifactVersion,
      preparedScriptSegmentId: segment.id,
      chapterId: segment.chapterId,
      sceneId: segment.sceneId,
      order: segment.order,
      timingAuthorityDigest: preparedScript.timingAuthority.timingAuthorityDigest,
      range: segmentRange(segment),
      displayText: segment.text,
      spokenText: direction.spokenText,
      spokenTextChangeReason: direction.spokenTextChangeReason,
      ...(direction.spokenTextChangeExplanation
        ? { spokenTextChangeExplanation: direction.spokenTextChangeExplanation }
        : {}),
      preparedMeaningDigest: sha256CanonicalJson({ meaning: segment.meaning }),
      meaningPreserved: true as const,
      language: preparedScript.language,
      pronunciationEntries: direction.pronunciationEntries,
      performance: direction.performance,
      immutable: true as const,
    }
  })

  const takeCandidates = voiceSegments.flatMap((segment) => {
    const generatedTakeId = id(`take:generated:${segment.preparedScriptSegmentId}`)
    const uploadedTakeId = id(`take:uploaded:${segment.preparedScriptSegmentId}`)
    return [{
      ...scope,
      schemaVersion: 'motion-studio.voice-take-candidate.v2' as const,
      takeId: generatedTakeId,
      voiceSegmentId: segment.voiceSegmentId,
      origin: 'generated_speech_protocol_fixture' as const,
      audioAssetVersion: rawInput.assets.generatedSpeechProtocol,
      voiceProfileReference: 'provider-catalog-documentary-narrator',
      capabilityPolicyEntryId: capabilityByRoute.get('eleven_v3')!.entryId,
      consent: {
        status: 'verified_provider_voice_catalog' as const,
        evidenceId: id('consent:provider-catalog-voice'),
        cloningAuthorized: false as const,
        dubbingAuthorized: false as const,
      },
      disclosure: {
        aiGenerated: true,
        disclosureRequired: true,
        disclosureCode: 'ai_generated_voice' as const,
        disclosureReviewed: true,
      },
      cloningEnabled: false as const,
      dubbingEnabled: false as const,
      providerExecutionPerformed: false as const,
      mediaExecutionPerformed: false as const,
      reviewStatus: 'candidate' as const,
      finalAssetEligible: false as const,
      createdAt: rawInput.createdAt,
      immutable: true as const,
    }, {
      ...scope,
      schemaVersion: 'motion-studio.voice-take-candidate.v2' as const,
      takeId: uploadedTakeId,
      voiceSegmentId: segment.voiceSegmentId,
      origin: 'uploaded_narration' as const,
      audioAssetVersion: rawInput.assets.uploadedNarration,
      voiceProfileReference: 'user-provided-narration',
      capabilityPolicyEntryId: capabilityByRoute.get('verified_private_narration_upload')!.entryId,
      consent: {
        status: 'not_required_user_upload' as const,
        evidenceId: id('consent:user-upload-authority'),
        cloningAuthorized: false as const,
        dubbingAuthorized: false as const,
      },
      disclosure: {
        aiGenerated: false,
        disclosureRequired: false,
        disclosureReviewed: true,
      },
      cloningEnabled: false as const,
      dubbingEnabled: false as const,
      providerExecutionPerformed: false as const,
      mediaExecutionPerformed: false as const,
      reviewStatus: 'selected' as const,
      finalAssetEligible: false as const,
      createdAt: rawInput.createdAt,
      immutable: true as const,
    }]
  })

  const takeSelections = voiceSegments.map((segment) => {
    const generatedTakeId = id(`take:generated:${segment.preparedScriptSegmentId}`)
    const uploadedTakeId = id(`take:uploaded:${segment.preparedScriptSegmentId}`)
    return {
      ...scope,
      schemaVersion: 'motion-studio.voice-take-selection.v1' as const,
      voiceSegmentId: segment.voiceSegmentId,
      candidateTakeIds: [generatedTakeId, uploadedTakeId],
      selectedTakeId: uploadedTakeId,
      selectionMethod: 'explicit_fixture_review' as const,
      firstTakeAutoAccepted: false as const,
      selectedByActorId: rawInput.actorUserId,
      selectedAt: rawInput.createdAt,
      decisionReason: 'The verified uploaded narration preserves the approved performance and exact story timing.',
      immutable: true as const,
    }
  })

  const alignments = voiceSegments.map((segment) => ({
    ...scope,
    schemaVersion: 'motion-studio.voice-alignment.v1' as const,
    alignmentId: id(`alignment:${segment.preparedScriptSegmentId}`),
    voiceSegmentId: segment.voiceSegmentId,
    takeId: id(`take:uploaded:${segment.preparedScriptSegmentId}`),
    method: 'declared_fixture_alignment' as const,
    timingAuthorityDigest: preparedScript.timingAuthority.timingAuthorityDigest,
    tokens: [{
      tokenId: id(`alignment-token:${segment.preparedScriptSegmentId}`),
      text: segment.spokenText,
      range: segment.range,
    }],
    executionPerformed: false as const,
    reviewed: true as const,
    immutable: true as const,
  }))

  const voiceQualityReports = takeCandidates.map((take) => {
    const selected = take.reviewStatus === 'selected'
    return {
      ...scope,
      schemaVersion: 'motion-studio.voice-quality-report.v1' as const,
      qualityReportId: id(`voice-qa:${take.takeId}`),
      voiceSegmentId: take.voiceSegmentId,
      takeId: take.takeId,
      gateResults: VOICE_QA_GATES.map((gate) => ({
        gate,
        result: selected ? 'passed' as const : 'not_run' as const,
        blocking: true as const,
        ...(selected ? { evidenceId: id(`voice-qa-evidence:${take.takeId}:${gate}`) } : {}),
        note: selected
          ? `Server-owned fixture evidence records the ${gate.replaceAll('_', ' ')} review as passed.`
          : `No media or provider execution occurred; ${gate.replaceAll('_', ' ')} remains not run.`,
      })),
      selectionEligible: selected,
      finalMixEligible: false as const,
      reviewedAt: rawInput.createdAt,
      immutable: true as const,
    }
  })

  const selectedTakeIds = takeSelections.map((selection) => selection.selectedTakeId)
  const voiceBible = {
    ...scope,
    schemaVersion: 'motion-studio.voice-bible.v2' as const,
    voiceBibleId: id('voice-bible'),
    voiceBibleArtifactVersion: rawInput.authorityArtifactVersions.voiceBible,
    preparedScriptArtifactVersion: rawInput.preparedScriptArtifactVersion,
    language: preparedScript.language,
    voiceSegmentIds: voiceSegments.map((segment) => segment.voiceSegmentId),
    selectedTakeIds,
    performanceDirection: [
      'Preserve approved story meaning and scene timing.',
      'Keep narration intelligible above music, Foley, ambience, and exact sound effects.',
    ],
    cloningEnabled: false as const,
    dubbingEnabled: false as const,
    providerExecutionAllowed: false as const,
    immutable: true as const,
  }

  const stems = [
    stem(scope, id, 'narration', 'uploaded_narration', rawInput.assets.uploadedNarration,
      capabilityByRoute.get('verified_private_narration_upload')!.entryId),
    stem(scope, id, 'music', 'uploaded_music', rawInput.assets.uploadedMusic,
      capabilityByRoute.get('verified_private_music_upload')!.entryId),
    stem(scope, id, 'foley', 'synchronized_foley_protocol_fixture', rawInput.assets.synchronizedFoleyProtocol,
      capabilityByRoute.get('mmaudio')!.entryId),
    stem(scope, id, 'exact_sfx', 'licensed_sfx', rawInput.assets.licensedExactSfx,
      capabilityByRoute.get('licensed_or_uploaded_sfx')!.entryId),
  ]
  const musicStem = stems.find((candidate) => candidate.role === 'music')!
  const foleyStem = stems.find((candidate) => candidate.role === 'foley')!
  const exactSfxStem = stems.find((candidate) => candidate.role === 'exact_sfx')!
  const narrationStem = stems.find((candidate) => candidate.role === 'narration')!
  const firstSegment = voiceSegments[0]!
  const lastSegment = voiceSegments.at(-1)!

  const musicBible = {
    ...scope,
    schemaVersion: 'motion-studio.music-bible.v2' as const,
    musicBibleId: id('music-bible'),
    musicBibleArtifactVersion: rawInput.authorityArtifactVersions.musicBible,
    scoreMode: 'uploaded_music' as const,
    mood: rawInput.musicDirection.mood,
    instrumentation: rawInput.musicDirection.instrumentation,
    vocalPolicy: 'instrumental_only' as const,
    speechSafetyRules: [
      'Narration remains intelligible at all times.',
      'Music ducks during speech and never drives edit timing across important words.',
    ],
    rightsEvidenceIds: rawInput.musicDirection.rightsEvidenceIds,
    stemIds: [musicStem.stemId],
    providerExecutionAllowed: false as const,
    immutable: true as const,
  }

  const musicCues = [{
    ...scope,
    schemaVersion: 'motion-studio.music-cue.v2' as const,
    cueId: id('music-cue:main'),
    musicBibleArtifactVersion: rawInput.authorityArtifactVersions.musicBible,
    stemId: musicStem.stemId,
    sceneIds: voiceSegments.map((segment) => segment.sceneId),
    timingAuthorityDigest: preparedScript.timingAuthority.timingAuthorityDigest,
    range: {
      startTimingAnchorId: firstSegment.range.startTimingAnchorId,
      endTimingAnchorId: lastSegment.range.endTimingAnchorId,
      startFrame: firstSegment.range.startFrame,
      endFrame: lastSegment.range.endFrame,
    },
    narrativePurpose: rawInput.musicDirection.narrativePurpose,
    emotionalDirection: rawInput.musicDirection.emotionalDirection,
    speechOverlapPolicy: rawInput.musicDirection.speechOverlapPolicy,
    immutable: true as const,
  }]

  const soundEvents = [{
    ...scope,
    schemaVersion: 'motion-studio.sound-event.v1' as const,
    soundEventId: id('sound-event:visible-foley'),
    role: 'foley' as const,
    stemId: foleyStem.stemId,
    sceneId: firstSegment.sceneId,
    timingAuthorityDigest: preparedScript.timingAuthority.timingAuthorityDigest,
    range: firstSegment.range,
    reasonKind: 'visible_action' as const,
    reason: 'Support the visible document placement without covering narration.',
    sourceEventId: id('source-event:document-placement'),
    speechOverlapPolicy: 'duck_below_narration' as const,
    immutable: true as const,
  }, {
    ...scope,
    schemaVersion: 'motion-studio.sound-event.v1' as const,
    soundEventId: id('sound-event:exact-sfx'),
    role: 'exact_sfx' as const,
    stemId: exactSfxStem.stemId,
    sceneId: lastSegment.sceneId,
    timingAuthorityDigest: preparedScript.timingAuthority.timingAuthorityDigest,
    range: lastSegment.range,
    reasonKind: 'exact_named_sound' as const,
    reason: 'Use the licensed archival camera shutter sound named by the approved scene plan.',
    sourceEventId: id('source-event:camera-shutter'),
    speechOverlapPolicy: 'avoid_speech_overlap' as const,
    immutable: true as const,
  }]

  const mixPlan = {
    ...scope,
    schemaVersion: 'motion-studio.mix-plan.v1' as const,
    mixPlanId: id('mix-plan'),
    mixPlanArtifactVersion: rawInput.authorityArtifactVersions.mixPlan,
    timingAuthorityDigest: preparedScript.timingAuthority.timingAuthorityDigest,
    stemIds: stems.map((candidate) => candidate.stemId),
    narrationStemIds: [narrationStem.stemId],
    musicStemIds: [musicStem.stemId],
    foleyStemIds: [foleyStem.stemId],
    ambienceStemIds: [],
    exactSfxStemIds: [exactSfxStem.stemId],
    speechPriority: true as const,
    narrationDucking: {
      enabled: true as const,
      musicGainReductionDb: -12,
      effectsGainReductionDb: -8,
      attackFrames: 4,
      releaseFrames: 12,
    },
    targetIntegratedLufs: -16,
    targetTruePeakDbtp: -1,
    requiredQaGates: MIX_QA_GATES,
    finalMixExecutionAllowed: false as const,
    timelineMutationAllowed: false as const,
    renderAllowed: false as const,
    immutable: true as const,
  }

  const bundleCandidate = {
    ...scope,
    schemaVersion: MOTION_STUDIO_AUDIO_AUTHORITY_SCHEMA_VERSION,
    approvedSnapshotId: rawInput.approvedSnapshotId,
    approvedSnapshotDigest: rawInput.approvedSnapshotDigest,
    preparedScriptArtifactVersion: rawInput.preparedScriptArtifactVersion,
    timingAuthority: preparedScript.timingAuthority,
    voiceBible,
    voiceSegments,
    takeCandidates,
    takeSelections,
    alignments,
    voiceQualityReports,
    musicBible,
    stems,
    musicCues,
    soundEvents,
    mixPlan,
    capabilityPolicy: {
      ...scope,
      schemaVersion: MOTION_STUDIO_AUDIO_CAPABILITY_POLICY_VERSION,
      policySnapshotId: id('capability-policy'),
      entries: capabilityPolicyEntries,
      capturedAt: rawInput.createdAt,
      providerExecutionAllowed: false as const,
      immutable: true as const,
    },
    executionBoundary: {
      localFixtureOnly: true as const,
      providerCallMade: false as const,
      mediaExecutionPerformed: false as const,
      alignmentExecutionPerformed: false as const,
      mixExecutionPerformed: false as const,
      timelineMutationPerformed: false as const,
      renderPerformed: false as const,
      providerCostMicros: 0 as const,
      maximumAuthorizedProviderCostMicros: 0 as const,
      customerPricingIncluded: false as const,
      customerCreditsIncluded: false as const,
    },
    createdAt: rawInput.createdAt,
    immutable: true as const,
  }
  const result = motionStudioAudioAuthorityBundleV2Schema.safeParse(bundleCandidate)
  if (!result.success) blocked('Compiled Storytelling audio authority is invalid.', result.error.flatten())
  const bundle: MotionStudioAudioAuthorityBundleV2 = result.data
  return {
    bundle,
    inputDigest,
    outputDigest: sha256CanonicalJson(bundle),
    providerCallMade: false,
    mediaExecutionPerformed: false,
    providerCostMicros: 0,
    customerPricingIncluded: false,
    customerCreditsIncluded: false,
  }
}

function assertInputAuthority(
  input: CompileMotionStudioAudioAuthorityInput,
  preparedScript: PreparedScript,
): void {
  if (
    preparedScript.workspaceId !== input.ownership.workspaceId ||
    preparedScript.projectId !== input.ownership.projectId ||
    preparedScript.editSessionId !== input.ownership.editSessionId ||
    preparedScript.productionId !== input.productionId
  ) blocked('Prepared script and audio compiler tenant/production scope must match exactly.')
  if (
    input.preparedScriptArtifactPayload.schemaVersion !== 'motion-studio.prepared-script.v1' ||
    input.preparedScriptArtifactPayload.references.length !== 0 ||
    input.preparedScriptArtifactPayload.extensions.length !== 0 ||
    sha256CanonicalJson(input.preparedScriptArtifactPayload.data) !== sha256CanonicalJson(preparedScript)
  ) {
    blocked('Prepared script data must match the exact safe artifact payload envelope.')
  }
  if (sha256CanonicalJson(preparedScript.timingAuthority) !== sha256CanonicalJson(input.approvedTimingAuthority)) {
    blocked('Prepared script timing must match the exact approved snapshot timing authority.')
  }
  const artifactVersions = Object.values(input.authorityArtifactVersions)
  if (new Set(artifactVersions.map((reference) => reference.versionId)).size !== artifactVersions.length) {
    blocked('Audio authority artifact-version identities must be distinct.')
  }
  if (input.actorUserId.trim().length === 0) blocked('Audio fixture review actor is required.')
}

function capabilityEntries(
  id: (label: string) => string,
): readonly MotionStudioAudioCapabilityPolicyEntryV1[] {
  const entry = (
    routeId: MotionStudioAudioCapabilityPolicyEntryV1['routeId'],
    capability: MotionStudioAudioCapabilityKind,
    use: MotionStudioAudioCapabilityPolicyEntryV1['use'],
  ): MotionStudioAudioCapabilityPolicyEntryV1 => ({
    entryId: id(`capability:${routeId}`),
    capability,
    routeId,
    use,
    runtimeEnabled: false,
    externalTransportEnabled: false,
    runtimeAccessAvailable: false,
    productReady: false,
    capabilityDiscoveryMethod: 'owner_policy_snapshot',
  })
  return [
    entry('eleven_v3', 'speech_generation', 'final_candidate'),
    entry('eleven_multilingual_v2', 'speech_generation', 'stability_fallback'),
    entry('eleven_flash_v2_5', 'speech_generation', 'audition_or_temporary'),
    entry('verified_private_narration_upload', 'uploaded_narration', 'user_asset'),
    entry('verified_private_music_upload', 'uploaded_music', 'user_asset'),
    entry('lyria_3_pro', 'music_generation', 'planned_only'),
    entry('mmaudio', 'synchronized_foley', 'planned_only'),
    entry('licensed_or_uploaded_sfx', 'exact_sfx', 'user_asset'),
    entry('reeditpro_deterministic_mix', 'deterministic_mix', 'planned_only'),
  ]
}

function stem(
  scope: CompileMotionStudioAudioAuthorityInput['ownership'] & { productionId: string },
  id: (label: string) => string,
  role: MotionStudioAudioStemRole,
  origin: MotionStudioAudioStemOrigin,
  audioAssetVersion: MotionStudioAudioAssetVersionRef,
  capabilityPolicyEntryId: string,
) {
  return {
    ...scope,
    schemaVersion: 'motion-studio.audio-stem.v1' as const,
    stemId: id(`stem:${role}`),
    role,
    origin,
    audioAssetVersion,
    capabilityPolicyEntryId,
    speechBearing: role === 'narration',
    rightsReviewed: true as const,
    providerExecutionPerformed: false as const,
    mediaExecutionPerformed: false as const,
    finalAssetEligible: false as const,
    immutable: true as const,
  }
}

function segmentRange(segment: PreparedScript['narrationSegments'][number]): MotionStudioAudioFrameRange {
  return {
    startTimingAnchorId: segment.startTimingAnchorId,
    endTimingAnchorId: segment.endTimingAnchorId,
    startFrame: segment.startFrame,
    endFrame: segment.endFrame,
  }
}

function deterministicUuid(inputDigest: string, label: string): string {
  const hex = sha256CanonicalJson({ inputDigest, label }).slice(0, 32).split('')
  hex[12] = '5'
  hex[16] = ((Number.parseInt(hex[16]!, 16) & 0x3) | 0x8).toString(16)
  const value = hex.join('')
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`
}

function blocked(message: string, details?: unknown): never {
  throw new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', message, 409, details)
}

export function audioVersionReferenceEquals(
  left: MotionStudioVersionReference,
  right: MotionStudioVersionReference,
): boolean {
  return left.artifactId === right.artifactId &&
    left.versionId === right.versionId &&
    left.versionNumber === right.versionNumber &&
    left.contentDigest === right.contentDigest
}
