import type {
  CaptionVisualIntelligenceEvidencePacket,
  CaptionVisualIntelligenceSupportPayload,
} from './caption-visual-intelligence-support'
import type { SkillSupportRequest } from './orchestra-skill-contracts'
import type {
  VisualIntelligenceAuthenticatedReadResult,
  VisualIntelligenceSpatialEvidence,
} from './visual-intelligence'

export const CAPTION_VISUAL_INTELLIGENCE_SPATIAL_ADAPTER_VERSION =
  'caption-visual-intelligence-spatial-evidence-adapter-v1' as const

export interface CaptionVisualIntelligenceSpatialAdapterInput {
  packetId: string
  payload: CaptionVisualIntelligenceSupportPayload
  supportRequest: SkillSupportRequest
  authenticatedReadResult: VisualIntelligenceAuthenticatedReadResult
  spatialEvidence: VisualIntelligenceSpatialEvidence
}

export interface CaptionVisualIntelligenceSpatialAdapterReceipt {
  schemaVersion: typeof CAPTION_VISUAL_INTELLIGENCE_SPATIAL_ADAPTER_VERSION
  adapterId: string
  adapterDigestSha256: string
  backendSource: {
    repository: 'yuzastudio6-cyber/Reedkt'
    branch: 'codex/backend-workflow-pipeline-continuation'
    sourceCommit: string
    sourceTree: string
    visualIntelligencePublicTypeFileSha256: string
  }
  consumedReportVersion: 'visual-intelligence-report-v1'
  consumedAuthenticatedReadResultVersion:
    'visual-intelligence-authenticated-read-result-v1'
  consumedSpatialEvidenceVersion: 'visual-intelligence-spatial-evidence-v1'
  projectedCaptionPacketVersion:
    CaptionVisualIntelligenceEvidencePacket['schemaVersion']
  requiredPayloadPurpose:
    Extract<CaptionVisualIntelligenceSupportPayload['purpose'],
      'final_frame_occupancy'>
  sourcePublicTypeCopiedByteForByte: true
  backendImplementationImported: false
  exactAuthenticatedReportRereadRequired: true
  exactSpatialEvidenceDigestRereadRequired: true
  exactScopeFrameArtifactAndRangeBindingRequired: true
  semanticGeometryOnly: true
  deterministicPixelGeometryClaimed: false
  measuredContrastAvailableFromSpatialEvidenceV1: false
  renderedCaptionInspectionAdmitted: false
  directPeerDispatchAdded: false
  providerCallAuthorityGranted: false
  runtimeExecutionAuthorityGranted: false
  assetMutationAuthorityGranted: false
  costOrBillingAuthorityGranted: false
  finalQaApprovalGranted: false
  publicDeliveryGranted: false
  productionAuthorityGranted: false
}

export interface CaptionVisualIntelligenceSpatialAdapterOutput {
  packet: CaptionVisualIntelligenceEvidencePacket
  receipt: CaptionVisualIntelligenceSpatialAdapterReceipt
}
