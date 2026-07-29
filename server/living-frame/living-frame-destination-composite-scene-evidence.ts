import type {
  LivingFrameAlphaEdgeDecontaminationReport,
} from '../../src/types/living-frame-alpha-edge-decontamination'
import type {
  LivingFrameComponentGeometryBundle,
} from '../../src/types/living-frame-component-geometry'
import type {
  LivingFrameDestinationCompositeMeasurement,
} from '../../src/types/living-frame-destination-composite-measurement'
import type {
  LivingFrameDeterministicMotionBundle,
} from '../../src/types/living-frame-deterministic-motion'
import type {
  LivingFrameSceneComponentEvidenceInput,
} from '../../src/types/living-frame-scene-evidence-package'
import type {
  LivingFrameVisualContinuityMeasurementReport,
} from '../../src/types/living-frame-visual-continuity-measurement'
import {
  verifyLivingFrameAlphaEdgeDecontaminationReportDigest,
} from './living-frame-alpha-edge-decontamination'
import {
  verifyLivingFrameComponentGeometryBundleDigest,
} from './living-frame-component-geometry'
import {
  verifyLivingFrameDestinationCompositeMeasurement,
} from './living-frame-destination-composite-measurement'
import {
  verifyLivingFrameDeterministicMotionBundleDigest,
} from './living-frame-deterministic-motion'
import {
  verifyLivingFrameVisualContinuityMeasurementReportDigest,
} from './living-frame-visual-continuity-measurement'

export type LivingFrameDestinationCompositeContinuityInput =
  | {
      readonly expectation: 'not_applicable'
      readonly referenceArtifact: null
      readonly measurementReport: null
    }
  | {
      readonly expectation: 'required'
      readonly referenceArtifact: {
        readonly artifactId: string
        readonly artifactDigestSha256: string
      }
      readonly measurementReport:
        LivingFrameVisualContinuityMeasurementReport
    }

export interface CompileLivingFrameDestinationCompositeSceneEvidenceInput {
  readonly measurement:
    LivingFrameDestinationCompositeMeasurement
  readonly motionBundle: LivingFrameDeterministicMotionBundle
  readonly componentGeometryBundle:
    LivingFrameComponentGeometryBundle
  readonly alphaEdgeDecontaminationReport:
    LivingFrameAlphaEdgeDecontaminationReport | null
  readonly continuity:
    LivingFrameDestinationCompositeContinuityInput
}

/**
 * Converts one byte-measured, destination-tested RGBA component into the
 * existing scene-evidence input. This adapter creates no QA or render
 * authority; the returned value must still pass
 * compileLivingFrameSceneEvidencePackage and the canonical artifact/private
 * review gates.
 */
export function compileLivingFrameDestinationCompositeSceneEvidence(
  input: CompileLivingFrameDestinationCompositeSceneEvidenceInput,
): LivingFrameSceneComponentEvidenceInput {
  assertLineage(input)
  const measurement = input.measurement
  const artifact = {
    artifactId: measurement.componentArtifact.artifactId,
    artifactDigestSha256:
      measurement.componentArtifact.artifactDigestSha256,
  }
  const continuity = input.continuity
  return Object.freeze({
    componentId: measurement.sceneBinding.componentId,
    artifactKind: 'still_rgba',
    artifact,
    maskArtifact: null,
    continuityExpectation: continuity.expectation,
    continuityReferenceArtifact:
      continuity.expectation === 'required'
        ? { ...continuity.referenceArtifact }
        : null,
    alphaMeasurementReport:
      measurement.destinationAlphaMeasurementReport,
    temporalMaskMeasurementReport: null,
    alphaEdgeDecontaminationReport:
      input.alphaEdgeDecontaminationReport,
    visualContinuityMeasurementReport:
      continuity.expectation === 'required'
        ? continuity.measurementReport
        : null,
    primitiveQaExpectationRef: null,
  })
}

function assertLineage(
  input: CompileLivingFrameDestinationCompositeSceneEvidenceInput,
): void {
  if (
    !verifyLivingFrameDestinationCompositeMeasurement(
      input.measurement,
    )
    || !verifyLivingFrameDeterministicMotionBundleDigest(
      input.motionBundle,
    )
    || !verifyLivingFrameComponentGeometryBundleDigest(
      input.componentGeometryBundle,
    )
  ) {
    throw new Error(
      'Living Frame destination scene-evidence input is invalid.',
    )
  }
  const measurement = input.measurement
  const motion = input.motionBundle
  const geometry = input.componentGeometryBundle
  const component = geometry.components.find(
    (candidate) =>
      candidate.componentId
        === measurement.sceneBinding.componentId,
  )
  if (
    measurement.measurementState
      !== 'measurement_clear_pending_canonical_qa'
    || measurement.blockingFindingCodes.length !== 0
    || !component
    || component.kind !== 'visual_component'
    || component.maskExpectation
      !== 'still_alpha_artifact_required'
    || geometry.motionBinding.motionBundleDigestSha256
      !== motion.bundleDigestSha256
    || geometry.motionBinding.motionSceneId
      !== motion.timingExpectation.sceneId
    || measurement.sceneBinding.sceneId
      !== motion.timingExpectation.sceneId
    || measurement.sceneBinding.outputFrameId
      !== motion.timingExpectation.outputFrameId
    || measurement.sceneBinding.outputFrameDigestSha256
      !== motion.timingExpectation.outputFrameDigestSha256
    || measurement.sceneBinding.masterTimingPlanId
      !== motion.timingExpectation.masterTimingPlanId
    || measurement.sceneBinding.masterTimingDigestSha256
      !== motion.timingExpectation.masterTimingPlanDigestSha256
    || measurement.sceneBinding.destinationFrameIndex
      < motion.timingExpectation.sceneStartFrame
    || measurement.sceneBinding.destinationFrameIndex
      > motion.timingExpectation.sceneEndFrame
    || geometry.outputFrameExpectation.outputFrameId
      !== measurement.sceneBinding.outputFrameId
    || geometry.outputFrameExpectation.outputFrameDigestSha256
      !== measurement.sceneBinding.outputFrameDigestSha256
  ) {
    throw new Error(
      'Living Frame destination scene-evidence lineage is inconsistent.',
    )
  }
  assertDecontamination(
    input.alphaEdgeDecontaminationReport,
    measurement,
  )
  assertContinuity(input.continuity, measurement)
}

function assertDecontamination(
  report: LivingFrameAlphaEdgeDecontaminationReport | null,
  measurement: LivingFrameDestinationCompositeMeasurement,
): void {
  if (report === null) return
  if (
    !verifyLivingFrameAlphaEdgeDecontaminationReportDigest(report)
    || report.outputArtifact.measuredOutputRgbaDigestSha256
      !== measurement.componentArtifact.decodedRgbaDigestSha256
  ) {
    throw new Error(
      'Living Frame destination scene-evidence alpha decontamination lineage is invalid.',
    )
  }
}

function assertContinuity(
  continuity: LivingFrameDestinationCompositeContinuityInput,
  measurement: LivingFrameDestinationCompositeMeasurement,
): void {
  if (continuity.expectation === 'not_applicable') {
    if (
      continuity.referenceArtifact !== null
      || continuity.measurementReport !== null
    ) {
      throw new Error(
        'Living Frame destination scene-evidence continuity input is invalid.',
      )
    }
    return
  }
  const report = continuity.measurementReport
  if (
    !verifyLivingFrameVisualContinuityMeasurementReportDigest(report)
    || report.candidateArtifact.artifactId
      !== measurement.componentArtifact.artifactId
    || report.candidateArtifact.artifactDigestSha256
      !== measurement.componentArtifact.artifactDigestSha256
    || report.candidateArtifact.measuredRgbaDigestSha256
      !== measurement.componentArtifact.decodedRgbaDigestSha256
    || report.referenceArtifact.artifactId
      !== continuity.referenceArtifact.artifactId
    || report.referenceArtifact.artifactDigestSha256
      !== continuity.referenceArtifact.artifactDigestSha256
  ) {
    throw new Error(
      'Living Frame destination scene-evidence continuity lineage is invalid.',
    )
  }
}
