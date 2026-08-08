import type {
  CanonicalCaptionTrackAllAuthenticatedEvidenceRecord,
} from './canonical-caption-track-all-support'
import type {
  CaptionTrackAllAdmissionV2,
  CaptionTrackAllEvidencePacketV2,
  CaptionTrackAllSupportPayloadV2,
} from './caption-track-all-support'

export const CANONICAL_CAPTION_TRACK_ALL_AUTHENTICATED_EVIDENCE_RECORD_V3_VERSION =
  'canonical-caption-track-all-authenticated-evidence-record-v3' as const

/**
 * Caption-owned additive consumer surface for foreground-depth evidence. The
 * frozen backend V2 public type stays byte-identical; a canonical Track All
 * producer must later publish this exact envelope before it can count as live
 * qualification evidence.
 */
export interface CanonicalCaptionTrackAllAuthenticatedEvidenceRecordV3
  extends Omit<CanonicalCaptionTrackAllAuthenticatedEvidenceRecord,
    'schemaVersion' | 'supportPayload' | 'captionEvidencePacket'
    | 'captionAdmission'> {
  schemaVersion:
    typeof CANONICAL_CAPTION_TRACK_ALL_AUTHENTICATED_EVIDENCE_RECORD_V3_VERSION
  supportPayload: CaptionTrackAllSupportPayloadV2
  captionEvidencePacket: CaptionTrackAllEvidencePacketV2
  captionAdmission: CaptionTrackAllAdmissionV2
}

export type CanonicalCaptionTrackAllAuthenticatedEvidenceRecordAny =
  | CanonicalCaptionTrackAllAuthenticatedEvidenceRecord
  | CanonicalCaptionTrackAllAuthenticatedEvidenceRecordV3
