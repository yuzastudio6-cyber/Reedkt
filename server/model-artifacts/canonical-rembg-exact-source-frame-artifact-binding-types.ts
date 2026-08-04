import type {
  CanonicalLivingFrameSourceAssetBinding,
} from '../../src/types/living-frame-asset-work-input-binding'
import type {
  CanonicalWorkItemInput,
} from '../validation/edit-planning-authority-schemas'
import type {
  CanonicalPrivateDependencyArtifactReadResult,
} from '../services/canonical-private-dependency-artifact-read-service'
import type {
  CanonicalRembgSourceFrameExpectationInput,
} from './canonical-rembg-cloud-run-gpu-execution-admission-types'

export const CANONICAL_REMBG_EXACT_SOURCE_FRAME_ARTIFACT_BINDING_VERSION =
  'canonical-rembg-exact-source-frame-artifact-binding-v1' as const

export type CanonicalRembgExactSourceFrameDependencyRead =
Omit<
  CanonicalPrivateDependencyArtifactReadResult,
  'contentType' | 'providerOutputEvidence'
> & {
  readonly contentType: 'image/png'
  readonly providerOutputEvidence?: never
}

export interface CanonicalRembgExactSourceFrameArtifactBinding {
  readonly bindingVersion:
    typeof CANONICAL_REMBG_EXACT_SOURCE_FRAME_ARTIFACT_BINDING_VERSION
  readonly bindingClass:
    'server_derived_qa_reread_exact_source_frame_png_binding'
  readonly source: CanonicalRembgSourceFrameExpectationInput
  readonly verification: {
    readonly exactCanonicalExtractionWorkItemMatched: true
    readonly exactCanonicalExtractionOutputMatched: true
    readonly canonicalQaPassedDependencyReadContractMatched: true
    readonly dependencyArtifactVersionMatched: true
    readonly pngChunkChecksumsVerified: true
    readonly pngRgbaProfileVerified: true
    readonly decodedPixelDigestVerified: true
    readonly opaqueSourceAlphaVerified: true
  }
  readonly boundaries: {
    readonly serverDerived: true
    readonly dependencyBytesReread: true
    readonly dependencyBytesRetained: false
    readonly callerBytesAccepted: false
    readonly callerPathsAccepted: false
    readonly callerUrlsAccepted: false
    readonly sourceSelectionAuthority: false
    readonly workGraphAuthority: false
    readonly assetManifestAuthority: false
    readonly rembgInferenceAuthority: false
    readonly cloudDispatchAuthority: false
    readonly productionAuthority: false
  }
  readonly bindingDigestSha256: string
}

export interface CanonicalRembgExactSourceFrameArtifactBindingInput {
  readonly sourceAssetBinding:
    CanonicalLivingFrameSourceAssetBinding
  readonly extractionWorkItem: CanonicalWorkItemInput
  readonly dependencyRead:
    CanonicalRembgExactSourceFrameDependencyRead
}
