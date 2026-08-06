import type {
  MotionStudioAudioAssetVersionRef,
  MotionStudioAudioAuthorityBundleV2,
  MotionStudioAudioWorkspaceDto,
  MotionStudioArtifactPayload,
  MotionStudioOwnership,
  MotionStudioPronunciationEntryV1,
  MotionStudioSpokenTextChangeReason,
  MotionStudioTimingAuthority,
  MotionStudioVersionReference,
  MotionStudioVoicePerformancePlanV1,
  PreparedScript,
} from '../../../src/types/motion-studio'

export interface MotionStudioAudioFixtureAssets {
  uploadedNarration: MotionStudioAudioAssetVersionRef
  generatedSpeechProtocol: MotionStudioAudioAssetVersionRef
  uploadedMusic: MotionStudioAudioAssetVersionRef
  synchronizedFoleyProtocol: MotionStudioAudioAssetVersionRef
  licensedExactSfx: MotionStudioAudioAssetVersionRef
}

export interface MotionStudioAudioVoiceDirectionInput {
  preparedScriptSegmentId: string
  spokenText: string
  spokenTextChangeReason: MotionStudioSpokenTextChangeReason
  spokenTextChangeExplanation?: string
  pronunciationEntries: readonly MotionStudioPronunciationEntryV1[]
  performance: MotionStudioVoicePerformancePlanV1
}

export interface CompileMotionStudioAudioAuthorityInput {
  ownership: MotionStudioOwnership
  productionId: string
  approvedSnapshotId: string
  approvedSnapshotDigest: string
  approvedTimingAuthority: MotionStudioTimingAuthority
  preparedScript: PreparedScript
  preparedScriptArtifactPayload: Omit<MotionStudioArtifactPayload, 'data'> & {
    data: PreparedScript
  }
  preparedScriptArtifactVersion: MotionStudioVersionReference
  authorityArtifactVersions: {
    voiceBible: MotionStudioVersionReference
    musicBible: MotionStudioVersionReference
    mixPlan: MotionStudioVersionReference
  }
  actorUserId: string
  createdAt: string
  assets: MotionStudioAudioFixtureAssets
  voiceDirections: readonly MotionStudioAudioVoiceDirectionInput[]
  musicDirection: {
    mood: readonly string[]
    instrumentation: readonly string[]
    narrativePurpose: string
    emotionalDirection: string
    speechOverlapPolicy: 'duck_below_narration' | 'no_speech_overlap'
    rightsEvidenceIds: readonly string[]
  }
}

export interface CompiledMotionStudioAudioAuthority {
  bundle: MotionStudioAudioAuthorityBundleV2
  inputDigest: string
  outputDigest: string
  providerCallMade: false
  mediaExecutionPerformed: false
  providerCostMicros: 0
  customerPricingIncluded: false
  customerCreditsIncluded: false
}

export interface MotionStudioAudioPersistenceReceipt {
  audioAuthorityId: string
  productionId: string
  approvedSnapshotId: string
  preparedScriptVersionId: string
  voiceBibleVersionId: string
  musicBibleVersionId: string
  mixPlanVersionId: string
  voiceSegmentCount: 2
  takeCandidateCount: 4
  selectedTakeCount: 2
  stemCount: 4
  cueCount: 3
  capabilityEntryCount: 9
  inputDigest: string
  outputDigest: string
  localFixtureOnly: true
  providerCallMade: false
  mediaExecutionPerformed: false
  providerCostMicros: 0
  customerPricingIncluded: false
  customerCreditsIncluded: false
}

export interface MotionStudioAudioRepository {
  getWorkspace(input: {
    productionId: string
    actorUserId: string
  }): Promise<MotionStudioAudioWorkspaceDto>
  persistAuthority(input: CompiledMotionStudioAudioAuthority & {
    actorUserId: string
    idempotencyKey: string
    requestHash: string
  }): Promise<MotionStudioAudioPersistenceReceipt>
}
