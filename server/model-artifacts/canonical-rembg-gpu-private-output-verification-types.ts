import type {
  CanonicalRembgGpuRuntimeResultCandidateAssertionInput,
} from './canonical-rembg-gpu-runtime-result-types'
import type {
  CanonicalRembgGpuRuntimeRunnerRequest,
} from './canonical-rembg-gpu-runtime-request-types'
import type {
  CanonicalRembgGpuRuntimeSuccessWireResponse,
} from './canonical-rembg-gpu-runtime-result-types'

export const CANONICAL_REMBG_GPU_PRIVATE_OUTPUT_READER_VERSION =
  'canonical-rembg-gpu-private-output-reader-v1' as const
export const CANONICAL_REMBG_GPU_VERIFIED_OUTPUT_CONSUMER_VERSION =
  'canonical-rembg-gpu-verified-output-consumer-v1' as const
export const CANONICAL_REMBG_GPU_PRIVATE_OUTPUT_VERIFICATION_VERSION =
  'canonical-rembg-gpu-private-output-verification-v1' as const

export type CanonicalRembgGpuPrivateOutputEvidenceClass =
  | 'controlled_source_fixture'
  | 'fixed_gpu_subprocess_unqualified'

export interface CanonicalRembgGpuPrivateOutputFiles {
  readonly maskPng: Buffer
  readonly maskAnalysisJson: Buffer
  readonly maskQaMeasurementJson: Buffer
}

export interface CanonicalRembgGpuPrivateOutputReader {
  readonly readerVersion:
    typeof CANONICAL_REMBG_GPU_PRIVATE_OUTPUT_READER_VERSION
  readonly readerClass:
    'process_bound_server_owned_rembg_private_output_reader'
  readonly evidenceClass:
    CanonicalRembgGpuPrivateOutputEvidenceClass
  readonly binding: {
    readonly admissionDigestSha256: string
    readonly requestBindingSha256: string
    readonly dispatchIntentId: string
    readonly responseDigestSha256: string
    readonly maskSha256: string
    readonly maskAnalysisSha256: string
    readonly maskQaMeasurementSha256: string
    readonly readerBindingDigestSha256: string
  }
  readonly fileNames: readonly [
    'mask.png',
    'mask-analysis.json',
    'mask-qa-measurement.json',
  ]
  readonly callerBytesAccepted: false
  readonly callerPathAccepted: false
  readonly callerUrlAccepted: false
  readonly credentialsIncluded: false
  readonly productionReady: false
  readServerOwnedOutputs():
    Promise<CanonicalRembgGpuPrivateOutputFiles>
}

export interface CanonicalRembgGpuVerifiedOutputPayload {
  readonly maskPng: Buffer
  readonly maskAnalysisJson: Buffer
  readonly maskQaMeasurementJson: Buffer
  readonly verification: {
    readonly resultCandidateDigestSha256: string
    readonly responseDigestSha256: string
    readonly requestBindingSha256: string
    readonly dispatchIntentId: string
    readonly maskSha256: string
    readonly decodedMaskSha256: string
    readonly maskAnalysisSha256: string
    readonly maskQaMeasurementSha256: string
    readonly width: number
    readonly height: number
    readonly foregroundPixelCountAtThreshold: number
  }
}

export interface CanonicalRembgGpuVerifiedOutputConsumer {
  readonly consumerVersion:
    typeof CANONICAL_REMBG_GPU_VERIFIED_OUTPUT_CONSUMER_VERSION
  readonly consumerClass:
    'process_bound_server_owned_verified_rembg_output_consumer'
  readonly acceptsOnlyVerifiedOutput: true
  readonly browserShareable: false
  readonly productionReady: false
  consume(
    payload: CanonicalRembgGpuVerifiedOutputPayload,
  ): Promise<void>
}

export interface CanonicalRembgGpuPrivateOutputVerification {
  readonly verificationVersion:
    typeof CANONICAL_REMBG_GPU_PRIVATE_OUTPUT_VERIFICATION_VERSION
  readonly verificationClass:
    'private_bytes_reread_and_recomputed_non_authoritative_output_verification'
  readonly identity: {
    readonly resultCandidateDigestSha256: string
    readonly runtimeRequestCandidateDigestSha256: string
    readonly admissionDigestSha256: string
    readonly requestBindingSha256: string
    readonly dispatchIntentId: string
    readonly responseDigestSha256: string
    readonly sourceFrameArtifactBindingDigestSha256: string
  }
  readonly outputReader: {
    readonly evidenceClass:
      CanonicalRembgGpuPrivateOutputEvidenceClass
    readonly readerBindingDigestSha256: string
    readonly oneShotReaderConsumed: true
    readonly oneShotConsumerConsumed: true
    readonly verifiedBytesDeliveredOutOfBand: true
  }
  readonly verifiedFiles: readonly [
    {
      readonly canonicalOrder: 0
      readonly fileName: 'mask.png'
      readonly fileKind: 'mask_image'
      readonly byteLength: number
      readonly contentSha256: string
    },
    {
      readonly canonicalOrder: 1
      readonly fileName: 'mask-analysis.json'
      readonly fileKind: 'mask_analysis_receipt'
      readonly byteLength: number
      readonly contentSha256: string
    },
    {
      readonly canonicalOrder: 2
      readonly fileName: 'mask-qa-measurement.json'
      readonly fileKind: 'mask_qa_measurement_receipt'
      readonly byteLength: number
      readonly contentSha256: string
    },
  ]
  readonly maskVerification: {
    readonly encodingProfile: 'gray8_mask_png_v1'
    readonly width: number
    readonly height: number
    readonly decodedMaskSha256: string
    readonly minimumMaskValue: number
    readonly maximumMaskValue: number
    readonly uniqueMaskValueCount: number
    readonly transparentPixelCount: number
    readonly partialPixelCount: number
    readonly opaquePixelCount: number
    readonly thresholdMaskValue: 128
    readonly foregroundPixelCountAtThreshold: number
    readonly maskVariationObserved: true
    readonly pngChunkCrcsVerified: true
    readonly pngInflateAndFiltersVerified: true
  }
  readonly processEvidenceVerification: {
    readonly analysisSchemaVersion:
      'rembg-u2netp-mask-analysis-v1'
    readonly qaMeasurementSchemaVersion:
      'rembg-mask-qa-measurement-v1'
    readonly stableJsonByteEncodingVerified: true
    readonly exactSourceArtifactLineageMatched: true
    readonly exactMaskLineageMatched: true
    readonly requiredQaGates: readonly [
      'mask_edge_quality',
      'mask_subject_coverage',
    ]
    readonly findingCodes: readonly []
    readonly measurementOnly: true
    readonly qaPassAuthority: false
  }
  readonly summary: {
    readonly exactRuntimeResultCandidateReread: true
    readonly exactPrivateOutputFileSetReread: true
    readonly exactOutputReceiptDigestsMatched: true
    readonly exactMaskPixelsRecomputed: true
    readonly exactMaskMetricsMatched: true
    readonly exactProcessEvidenceBytesRecomputed: true
    readonly sourceDimensionsPreserved: true
    readonly outputBytesSerialized: false
    readonly outputPathsSerialized: false
    readonly callerUrlsIncluded: false
    readonly credentialsIncluded: false
  }
  readonly blockers: readonly string[]
  readonly boundaries: {
    readonly candidateOnly: true
    readonly privateOutputRereadOnly: true
    readonly controlledFixtureOnly: boolean
    readonly outputBytesRereadVerified: true
    readonly maskPngIntegrityVerified: true
    readonly processEvidenceBytesRereadVerified: true
    readonly canonicalWorkerReceiptVerified: false
    readonly canonicalCompletionReceiptVerified: false
    readonly actualCloudRunExecutionVerified: false
    readonly runtimeImageIdentityVerified: false
    readonly liveServiceIdentityAndIamVerified: false
    readonly outputArtifactCommitAuthority: false
    readonly maskEdgeQualityQaAuthority: false
    readonly maskSubjectCoverageQaAuthority: false
    readonly qaPassAuthority: false
    readonly attemptInternalCostEvidenceVerified: false
    readonly cloudDispatchAuthority: false
    readonly workGraphAuthority: false
    readonly queueMutationAuthority: false
    readonly assetManifestAuthority: false
    readonly approvalAuthority: false
    readonly snapshotAuthority: false
    readonly renderAuthority: false
    readonly runtimeAuthority: false
    readonly productionReady: false
  }
  readonly verificationDigestSha256: string
}

export interface CanonicalRembgGpuPrivateOutputReaderInput {
  readonly evidenceClass:
    CanonicalRembgGpuPrivateOutputEvidenceClass
  readonly runtimeRequest:
    CanonicalRembgGpuRuntimeRunnerRequest
  readonly runtimeWireResponse:
    CanonicalRembgGpuRuntimeSuccessWireResponse
  readonly readServerOwnedOutputs:
    () => Promise<CanonicalRembgGpuPrivateOutputFiles>
}

export interface CanonicalRembgGpuPrivateOutputVerificationInput
  extends CanonicalRembgGpuRuntimeResultCandidateAssertionInput {
  readonly outputReader:
    CanonicalRembgGpuPrivateOutputReader
  readonly outputConsumer:
    CanonicalRembgGpuVerifiedOutputConsumer
}
