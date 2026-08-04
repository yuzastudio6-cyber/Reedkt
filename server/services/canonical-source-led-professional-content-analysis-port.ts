import type { VisualIntelligenceEvidenceRef } from '../../src/types/visual-intelligence'

import type {
  CanonicalSourceLedContentAnalysisEvidence,
  CanonicalSourceLedContentAnalysisSourceInput,
} from './canonical-source-led-content-analysis-evidence'
import type {
  CanonicalSourceLedContentReasoningResult,
} from './canonical-source-led-content-analysis-reasoner'

export type CanonicalSourceLedManagedAudioProbe =
  | Readonly<{
      disposition: 'verified_no_audio_stream'
    }>
  | Readonly<{
      disposition: 'verified_audio_stream'
      videoStreamIndex: number
      videoStartTimeBaseUnits: number
      videoTimeBaseNumerator: number
      videoTimeBaseDenominator: number
      audioStreamIndex: number
      audioStartTimeBaseUnits: number
      audioDurationTimeBaseUnits: number
      audioTimeBaseNumerator: number
      audioTimeBaseDenominator: number
      audioSampleRateHertz: number
      audioChannelCount: number
    }>

export interface CanonicalSourceLedProfessionalContentAnalysisSource {
  readonly sourceSequenceItemId: string
  readonly mediaAssetId: string
  readonly uploadedOrder: number
  readonly storageProvider: 'local_private' | 'google_cloud_storage'
  readonly storageBucket: string
  readonly storagePath: string
  readonly checksumSha256: string
  readonly byteLength: number
  readonly durationFrames: number
  /**
   * Fresh analysis must be bound to this exact server-owned authority. The
   * provider receives neither storage identity nor caller paths. Optionality
   * exists only so immutable historical inputs remain decodable; the active
   * Visual Intelligence owner rejects a missing authority.
   */
  readonly managedApiAuthority?: {
    readonly ownerUserId: string
    readonly storageBucket: string
    readonly storagePath: string
    readonly contentType: 'video/mp4'
    readonly storageGeneration: string
    readonly storageEtag: string
    readonly width: number
    readonly height: number
    readonly hasAudio: boolean
    readonly audioProbe: CanonicalSourceLedManagedAudioProbe
    readonly fpsNumerator: number
    readonly fpsDenominator: number
    readonly frameCount: number
    readonly sourceTimeBaseNumerator?: number
    readonly sourceTimeBaseDenominator?: number
    readonly finalizedMediaAuthorityRef: VisualIntelligenceEvidenceRef
    readonly finalizedStorageObjectAuthorityRef:
      VisualIntelligenceEvidenceRef
    readonly sourceBindingManifestCandidateRef:
      VisualIntelligenceEvidenceRef
    readonly sourceProbeAuthorityRef: VisualIntelligenceEvidenceRef
    readonly providerMediaReadAuthorityRef: VisualIntelligenceEvidenceRef
    readonly sourceAnalysisConsentRef: VisualIntelligenceEvidenceRef
    readonly platformAnalysisCostCapRef: VisualIntelligenceEvidenceRef
  }
}

export interface CanonicalSourceLedProfessionalContentAnalysisInput {
  readonly workspaceId: string
  readonly projectId: string
  readonly editSessionId: string
  readonly planningDirection: string
  readonly planningDirectionDigestSha256: string
  /** Exact digest of the authenticated saved-chat revision and active set. */
  readonly userInstructionDigestSha256: string
  readonly fps: 30
  readonly sources:
    readonly CanonicalSourceLedProfessionalContentAnalysisSource[]
}

/**
 * Fresh execution has one provider-neutral route. Old Qwen route identities
 * are deliberately absent: they are historical evidence labels, not ports a
 * planner or worker can select.
 */
export interface CanonicalSourceLedProfessionalContentAnalysisPort {
  readonly route: 'visual_intelligence_gemini_pro_high_v1'
  analyze(
    input: CanonicalSourceLedProfessionalContentAnalysisInput,
  ): Promise<CanonicalSourceLedContentAnalysisEvidence>
}

export interface CanonicalSourceLedProfessionalContentAnalysisReasoner {
  reason(input: {
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
    readonly analysisRunId: string
    readonly planningDirection: string
    readonly planningDirectionDigestSha256: string
    readonly userInstructionDigestSha256: string
    readonly fps: 30
    readonly sources:
      readonly CanonicalSourceLedContentAnalysisSourceInput[]
  }): Promise<CanonicalSourceLedContentReasoningResult>
}
