import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  canonicalSam31GpuRuntimeQualificationComponentRef,
  type CanonicalSam31GpuRuntimeQualificationComponentEvidence,
} from '../services/canonical-sam3_1-gpu-runtime-qualification-compilation-authority'
import {
  createCanonicalSam31GpuRuntimeQualificationComponentEvidenceRepository,
} from '../services/canonical-sam3_1-gpu-runtime-qualification-component-evidence-repository'
import {
  createCanonicalSam31GpuRuntimeQualificationEvidenceRepository,
} from '../services/canonical-sam3_1-gpu-runtime-qualification-evidence-repository'
import {
  canonicalSam31CompleteIntervalReviewRef,
  canonicalSam31TemporalMeasurementSetRef,
  createCanonicalSam31GpuTemporalQualityQualificationOwner,
  createCanonicalSam31GpuTemporalQualityQualificationOwnerFromObjectPort,
  createCanonicalSam31TemporalQualitySetRepository,
  persistCanonicalSam31TemporalQualityOwnerInput,
  sealCanonicalSam31CompleteIntervalReview,
  sealCanonicalSam31TemporalMeasurementSet,
  type CanonicalSam31CompleteIntervalReview,
  type CanonicalSam31TemporalMeasurementSet,
  type CanonicalSam31TemporalQualityReadPort,
} from '../services/canonical-sam3_1-gpu-temporal-quality-qualification-owner'
import {
  assertCanonicalSam31GpuRuntimeQualificationEvidence,
  canonicalSam31GpuRuntimeQualificationEvidenceDigest,
  canonicalSam31GpuRuntimeQualificationEvidenceRef,
  type CanonicalSam31GpuRuntimeQualificationEvidence,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-qualification-evidence'
import {
  qualificationEvidence as qualificationEvidenceFixture,
} from './canonical-sam3_1-gpu-runtime-release-smoke'

type Ref = { id: string; version: 1; contentHash: `sha256:${string}` }

const exactSourceRef = ref('sam31-temporal-quality-eight-minute-source')
const objectCoverageManifestRef = ref(
  'sam31-temporal-quality-object-coverage-manifest',
)
const measurementProfileRef = ref(
  'sam31-motion-compensated-temporal-quality-profile',
)
const a100QualificationId = qualificationEvidenceFixture.qualificationId
const a100Measurement = measurement({
  id: 'sam31-a100-temporal-measurements',
  qualificationId: a100QualificationId,
  route: qualificationEvidenceFixture.route,
  immutableImageDigest: qualificationEvidenceFixture.immutableImageDigest,
  metricAdjustment: 0,
})
const a100Review = review({
  id: 'sam31-a100-complete-interval-review',
  qualificationId: a100QualificationId,
  measurement: a100Measurement,
})
const a100Port = memoryObjectPort(new Map())
const a100ComponentRepository =
  createCanonicalSam31GpuRuntimeQualificationComponentEvidenceRepository({
    objectPort: a100Port,
  })
const a100Owner = createCanonicalSam31GpuTemporalQualityQualificationOwner({
  readPort: readPort({
    measurements: [a100Measurement],
    reviews: [a100Review],
  }),
  qualitySetRepository: createCanonicalSam31TemporalQualitySetRepository({
    objectPort: a100Port,
  }),
  componentRepository: a100ComponentRepository,
  now: () => '2026-08-04T20:30:00.000Z',
})
const a100Request = {
  componentId: 'sam31-a100-independent-temporal-quality',
  qualityQualificationId: 'sam31-a100-temporal-quality-set',
  qualificationId: a100QualificationId,
  temporalMeasurementSetRef:
    canonicalSam31TemporalMeasurementSetRef(a100Measurement),
  completeIntervalReviewRef:
    canonicalSam31CompleteIntervalReviewRef(a100Review),
  qualityRole: 'approved_a100_baseline',
  approvedA100BaselineRuntimeQualificationEvidenceRef: null,
  approvedA100BaselineComponentRef: null,
} as const
const a100Component = await a100Owner
  .compileAndPersistTemporalQualityComponent(a100Request)
assert.equal(a100Component.componentKind, 'independent_temporal_quality')
if (a100Component.componentKind !== 'independent_temporal_quality') {
  throw new Error('Expected A100 temporal quality component.')
}
assert.equal(a100Component.payload.qualityRole, 'approved_a100_baseline')
assert.equal(a100Component.payload.reviewedSequenceCount, 2)
assert.equal(a100Component.payload.temporalMaskFindingCount, 0)
assert.equal(a100Component.payload.directPrivateCompleteIntervalReviewPassed,
  true)
assert.equal(a100Component.payload.approvedA100BaselineRuntimeQualificationEvidenceRef,
  null)
assert.deepEqual(a100Component.payload.approvedA100BaselineRef,
  a100Component.payload.temporalMaskQualityQualificationRef)
const a100Evidence = qualificationEvidenceWithQuality(a100Component)
const a100EvidenceRef =
  canonicalSam31GpuRuntimeQualificationEvidenceRef(a100Evidence)

const l4QualificationId = 'sam31-l4-runtime-qualification'
const l4Route = {
  routeId: 'l4_heavy_fallback',
  gpuProfileId: 'quality_l4_user_triggered_heavy_fallback_job_v1',
  runtimeRegion: 'us-central1',
  executionTarget: 'google_cloud_run_l4_job',
  machineType: 'cloud_run_nvidia_l4',
  accelerator: 'nvidia_l4',
} as const
const l4Measurement = measurement({
  id: 'sam31-l4-temporal-measurements',
  qualificationId: l4QualificationId,
  route: l4Route,
  immutableImageDigest: `sha256:${digest('sam31-l4-image')}`,
  metricAdjustment: -0.01,
})
const l4Review = review({
  id: 'sam31-l4-complete-interval-review',
  qualificationId: l4QualificationId,
  measurement: l4Measurement,
})
const l4Port = memoryObjectPort(new Map())
const l4Owner = createCanonicalSam31GpuTemporalQualityQualificationOwner({
  readPort: readPort({
    measurements: [l4Measurement, a100Measurement],
    reviews: [l4Review],
    baselineComponent: a100Component,
    baselineEvidence: a100Evidence,
  }),
  qualitySetRepository: createCanonicalSam31TemporalQualitySetRepository({
    objectPort: l4Port,
  }),
  componentRepository:
    createCanonicalSam31GpuRuntimeQualificationComponentEvidenceRepository({
      objectPort: l4Port,
    }),
  now: () => '2026-08-04T20:32:00.000Z',
})
const l4Request = {
  componentId: 'sam31-l4-independent-temporal-quality',
  qualityQualificationId: 'sam31-l4-temporal-quality-set',
  qualificationId: l4QualificationId,
  temporalMeasurementSetRef:
    canonicalSam31TemporalMeasurementSetRef(l4Measurement),
  completeIntervalReviewRef:
    canonicalSam31CompleteIntervalReviewRef(l4Review),
  qualityRole: 'l4_fallback_compared_to_approved_a100_baseline',
  approvedA100BaselineRuntimeQualificationEvidenceRef: a100EvidenceRef,
  approvedA100BaselineComponentRef:
    canonicalSam31GpuRuntimeQualificationComponentRef(a100Component),
} as const
const l4Component = await l4Owner
  .compileAndPersistTemporalQualityComponent(l4Request)
assert.equal(l4Component.componentKind, 'independent_temporal_quality')
if (l4Component.componentKind !== 'independent_temporal_quality') {
  throw new Error('Expected L4 temporal quality component.')
}
assert.equal(l4Component.payload.qualityRole,
  'l4_fallback_compared_to_approved_a100_baseline')
assert.deepEqual(
  l4Component.payload.approvedA100BaselineRuntimeQualificationEvidenceRef,
  a100EvidenceRef,
)
assert.deepEqual(l4Component.payload.approvedA100BaselineRef,
  a100Component.payload.temporalMaskQualityQualificationRef)
assert.equal(l4Component.payload.qualityEqualToOrBetterThanApprovedA100Baseline,
  true)
const replay = await l4Owner
  .compileAndPersistTemporalQualityComponent(l4Request)
assert.deepEqual(replay, l4Component)

const wiredStorage = new Map<string, Buffer>()
const wiredObjectPort = memoryObjectPort(wiredStorage)
const wiredA100Refs = await persistCanonicalSam31TemporalQualityOwnerInput({
  objectPort: wiredObjectPort,
  measurementSet: a100Measurement,
  completeIntervalReview: a100Review,
})
const wiredOwner =
  createCanonicalSam31GpuTemporalQualityQualificationOwnerFromObjectPort({
    objectPort: wiredObjectPort,
    now: () => '2026-08-04T20:33:00.000Z',
  })
const wiredA100Component = await wiredOwner
  .compileAndPersistTemporalQualityComponent({
    ...a100Request,
    componentId: 'sam31-a100-independent-temporal-quality-wired',
    qualityQualificationId: 'sam31-a100-temporal-quality-set-wired',
    ...wiredA100Refs,
  })
const wiredA100Evidence = qualificationEvidenceWithQuality(
  wiredA100Component,
)
const wiredQualificationRepository =
  createCanonicalSam31GpuRuntimeQualificationEvidenceRepository({
    objectPort: wiredObjectPort,
  })
const wiredA100EvidenceRef = await wiredQualificationRepository
  .persistQualifiedEvidenceCreateOnly({ evidence: wiredA100Evidence })
const wiredL4Refs = await persistCanonicalSam31TemporalQualityOwnerInput({
  objectPort: wiredObjectPort,
  measurementSet: l4Measurement,
  completeIntervalReview: l4Review,
})
const wiredL4Component = await wiredOwner
  .compileAndPersistTemporalQualityComponent({
    ...l4Request,
    componentId: 'sam31-l4-independent-temporal-quality-wired',
    qualityQualificationId: 'sam31-l4-temporal-quality-set-wired',
    ...wiredL4Refs,
    approvedA100BaselineRuntimeQualificationEvidenceRef:
      wiredA100EvidenceRef,
    approvedA100BaselineComponentRef:
      canonicalSam31GpuRuntimeQualificationComponentRef(wiredA100Component),
  })
assert.equal(wiredL4Component.componentKind, 'independent_temporal_quality')

const worseL4 = measurement({
  id: 'sam31-l4-worse-temporal-measurements',
  qualificationId: l4QualificationId,
  route: l4Route,
  immutableImageDigest: l4Measurement.immutableImageDigest,
  metricAdjustment: 0.01,
})
const worseReview = review({
  id: 'sam31-l4-worse-complete-interval-review',
  qualificationId: l4QualificationId,
  measurement: worseL4,
})
await assert.rejects(() => createOwner({
  measurements: [worseL4, a100Measurement],
  reviews: [worseReview],
  baselineComponent: a100Component,
  baselineEvidence: a100Evidence,
}).compileAndPersistTemporalQualityComponent({
  ...l4Request,
  temporalMeasurementSetRef:
    canonicalSam31TemporalMeasurementSetRef(worseL4),
  completeIntervalReviewRef:
    canonicalSam31CompleteIntervalReviewRef(worseReview),
}))
await assert.rejects(() => createOwner({
  measurements: [l4Measurement, a100Measurement],
  reviews: [l4Review],
  baselineComponent: null,
  baselineEvidence: a100Evidence,
}).compileAndPersistTemporalQualityComponent(l4Request))
await assert.rejects(() => l4Owner
  .compileAndPersistTemporalQualityComponent({
    ...l4Request,
    approvedA100BaselineRuntimeQualificationEvidenceRef: null,
    approvedA100BaselineComponentRef: null,
  }))
await assert.rejects(() => a100Owner
  .compileAndPersistTemporalQualityComponent({
    ...a100Request,
    approvedA100BaselineRuntimeQualificationEvidenceRef: a100EvidenceRef,
    approvedA100BaselineComponentRef:
      canonicalSam31GpuRuntimeQualificationComponentRef(a100Component),
  }))
await assert.rejects(() => l4Owner
  .compileAndPersistTemporalQualityComponent({
    ...l4Request,
    callerQualityEqualToA100: true,
  }))
const crossedSource = measurement({
  id: 'sam31-l4-crossed-source-measurements',
  qualificationId: l4QualificationId,
  route: l4Route,
  immutableImageDigest: l4Measurement.immutableImageDigest,
  metricAdjustment: -0.01,
  exactSourceRef: ref('crossed-source'),
})
const crossedReview = review({
  id: 'sam31-l4-crossed-source-review',
  qualificationId: l4QualificationId,
  measurement: crossedSource,
})
await assert.rejects(() => createOwner({
  measurements: [crossedSource, a100Measurement],
  reviews: [crossedReview],
  baselineComponent: a100Component,
  baselineEvidence: a100Evidence,
}).compileAndPersistTemporalQualityComponent({
  ...l4Request,
  temporalMeasurementSetRef:
    canonicalSam31TemporalMeasurementSetRef(crossedSource),
  completeIntervalReviewRef:
    canonicalSam31CompleteIntervalReviewRef(crossedReview),
}))
const tamperedMeasurement = structuredClone(l4Measurement)
tamperedMeasurement.sequences[0].p95MeanAbsoluteAlphaDelta = 0
assert.throws(() =>
  canonicalSam31TemporalMeasurementSetRef(tamperedMeasurement))
assert.throws(() => sealCanonicalSam31CompleteIntervalReview({
  ...withoutKey(l4Review, 'reviewHash'),
  reviewId: 'sam31-sampled-review-refused',
  sampledOrRepresentativeReviewAccepted: true,
}))
assert.throws(() => sealCanonicalSam31TemporalMeasurementSet({
  ...withoutKey(l4Measurement, 'measurementSetHash'),
  measurementSetId: 'sam31-threshold-failure',
  sequences: l4Measurement.sequences.map((sequence, index) => index === 0
    ? { ...sequence, p95BoundaryDisagreementRatio: 0.11 }
    : sequence),
}))
let getterInvoked = false
const accessor = Object.defineProperty({}, 'componentId', {
  enumerable: true,
  get() {
    getterInvoked = true
    return l4Request.componentId
  },
})
await assert.rejects(() => l4Owner
  .compileAndPersistTemporalQualityComponent(accessor))
assert.equal(getterInvoked, false)
const cyclic: Record<string, unknown> = { ...l4Request }
cyclic.self = cyclic
await assert.rejects(() => l4Owner
  .compileAndPersistTemporalQualityComponent(cyclic))

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-gpu-temporal-quality-qualification-owner',
  checks: 46,
  a100ApprovedBaselineComponentProduced: true,
  l4ComparedToExactApprovedA100RuntimeAndComponent: true,
  completeEightMinuteFrameAndObjectIntervalsMeasured: true,
  fullResolutionCompleteIntervalPlaybackReviewed: true,
  sampledReviewAccepted: false,
  temporalMaskFindingCount: 0,
  l4MetricRegressionRejected: true,
  durableCanonicalStoreFactoryWired: true,
  callerQualityClaimsAccepted: false,
  liveGpuJobStarted: false,
  providerOrModelCallMade: false,
  customerCreditsMutated: false,
  productionAuthorityGranted: false,
}, null, 2))

function measurement(input: {
  id: string
  qualificationId: string
  route: CanonicalSam31GpuRuntimeQualificationEvidence['route']
  immutableImageDigest: string
  metricAdjustment: number
  exactSourceRef?: Ref
}): CanonicalSam31TemporalMeasurementSet {
  const stitchedDigest = digest(`${input.id}-stitched-mask-set`)
  const baseMetrics = [
    { coverage: 0.2, iou: 0.9, alpha: 0.07, boundary: 0.08 },
    { coverage: 0.18, iou: 0.91, alpha: 0.06, boundary: 0.07 },
  ]
  return sealCanonicalSam31TemporalMeasurementSet({
    schemaVersion: 'canonical-sam3_1-independent-temporal-measurement-set-v1',
    source: 'canonical_independent_sam3_1_temporal_mask_measurement_owner',
    evidenceClass: 'canonical_private_independent_qa_reread',
    status: 'complete_temporal_measurements_ready',
    measurementSetId: input.id,
    measurementSetVersion: 1,
    qualificationId: input.qualificationId,
    route: input.route,
    immutableImageDigest: input.immutableImageDigest,
    exactEightMinuteSourceRef: input.exactSourceRef ?? exactSourceRef,
    sourceWidth: 2_160,
    sourceHeight: 3_840,
    sourceFrameCount: 11_520,
    firstSourceFrameIndex: 0,
    lastSourceFrameIndex: 11_519,
    stitchedMaskSequenceRef: {
      id: `${input.id}-stitched-mask-sequence`,
      version: 1,
      contentHash: `sha256:${stitchedDigest}`,
    },
    stitchedOutputMaskSetDigestSha256: stitchedDigest,
    expectedObjectCoverageManifestRef: objectCoverageManifestRef,
    measurementProfileRef,
    measurementProfileId: 'motion_compensated_contiguous_mask_quality_v1',
    expectedSequenceCount: 2,
    sequences: baseMetrics.map((metrics, index) => ({
      sequenceOrdinal: index + 1,
      sequenceId: `approved-sequence-${index + 1}`,
      expectedObjectId: `approved-object-${index + 1}`,
      firstExpectedFrameIndex: index === 0 ? 0 : 2_400,
      lastExpectedFrameIndex: index === 0 ? 11_519 : 7_199,
      expectedFrameCount: index === 0 ? 11_520 : 4_800,
      measuredFrameCount: index === 0 ? 11_520 : 4_800,
      maskArtifactSetRef: ref(`${input.id}-mask-artifacts-${index + 1}`),
      deterministicMetricReportRef:
        ref(`${input.id}-metric-report-${index + 1}`),
      maximumWeightedCoverageChangeRatio:
        metrics.coverage + input.metricAdjustment,
      p05MotionCompensatedBinaryIntersectionOverUnion:
        metrics.iou - input.metricAdjustment,
      p95MeanAbsoluteAlphaDelta: metrics.alpha + input.metricAdjustment,
      p95BoundaryDisagreementRatio:
        metrics.boundary + input.metricAdjustment,
      emptyExpectedMaskFrameCount: 0,
      unexpectedFullFrameMaskCount: 0,
      objectDropoutCount: 0,
      identitySwitchCount: 0,
      findingCodes: [],
      completeExpectedObjectIntervalMeasured: true,
    })),
    everyExpectedSourceFrameAndObjectIntervalMeasured: true,
    sampledOrRepresentativeOnlyEvidenceAccepted: false,
    sourceResolutionPreserved: true,
    reviewerIndependentFromRuntimeWorker: true,
    rawMaskBytesPathsUrlsOrCredentialsIncluded: false,
    qaApprovalGranted: false,
    assetManifestMutated: false,
    renderAuthorized: false,
    customerCreditsMutated: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
    measuredAt: '2026-08-04T20:20:00.000Z',
  })
}

function review(input: {
  id: string
  qualificationId: string
  measurement: CanonicalSam31TemporalMeasurementSet
}): CanonicalSam31CompleteIntervalReview {
  return sealCanonicalSam31CompleteIntervalReview({
    schemaVersion: 'canonical-sam3_1-complete-interval-private-review-v1',
    source: 'canonical_independent_sam3_1_complete_interval_private_reviewer',
    evidenceClass: 'canonical_private_direct_visual_review',
    status: 'complete_interval_review_accepted',
    reviewId: input.id,
    reviewVersion: 1,
    qualificationId: input.qualificationId,
    measurementSetRef:
      canonicalSam31TemporalMeasurementSetRef(input.measurement),
    exactEightMinuteSourceRef: input.measurement.exactEightMinuteSourceRef,
    stitchedMaskSequenceRef: input.measurement.stitchedMaskSequenceRef,
    stitchedOutputMaskSetDigestSha256:
      input.measurement.stitchedOutputMaskSetDigestSha256,
    expectedObjectCoverageManifestRef:
      input.measurement.expectedObjectCoverageManifestRef,
    fullResolutionReviewPlaybackRef: ref(`${input.id}-playback`),
    reviewerIdentityRef: ref(`${input.id}-reviewer`),
    reviewerRole: 'independent_private_visual_qa_reviewer',
    reviewMode: 'full_resolution_complete_interval_playback',
    reviewedWidth: input.measurement.sourceWidth,
    reviewedHeight: input.measurement.sourceHeight,
    firstReviewedFrameIndex: 0,
    lastReviewedFrameIndex: input.measurement.lastSourceFrameIndex,
    reviewedFrameCount: input.measurement.sourceFrameCount,
    reviewedSequenceCount: input.measurement.sequences.length,
    reviewedSequenceMeasurementRefs: input.measurement.sequences.map(
      (sequence) => sequence.deterministicMetricReportRef,
    ),
    findingCodes: [],
    temporalMaskFindingCount: 0,
    everyExpectedFrameAndObjectReviewed: true,
    directPrivateCompleteIntervalReviewPassed: true,
    sampledOrRepresentativeReviewAccepted: false,
    reviewerIndependentFromRuntimeWorker: true,
    rawMediaMaskBytesPathsUrlsOrCredentialsIncluded: false,
    providerOrModelCallMade: false,
    qaApprovalGranted: false,
    assetManifestMutated: false,
    renderAuthorized: false,
    customerCreditsMutated: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
    reviewedAt: '2026-08-04T20:25:00.000Z',
  })
}

function qualificationEvidenceWithQuality(
  component: CanonicalSam31GpuRuntimeQualificationComponentEvidence,
): CanonicalSam31GpuRuntimeQualificationEvidence {
  if (component.componentKind !== 'independent_temporal_quality') {
    throw new Error('Expected temporal quality component.')
  }
  const clone = structuredClone(qualificationEvidenceFixture)
  const payload = clone as Omit<
    CanonicalSam31GpuRuntimeQualificationEvidence,
    'evidenceHash'
  > & { evidenceHash?: string }
  delete payload.evidenceHash
  payload.qualityEvidence = component.payload
  payload.qualifiedAt = '2026-08-04T20:31:00.000Z'
  return assertCanonicalSam31GpuRuntimeQualificationEvidence({
    ...payload,
    evidenceHash: canonicalSam31GpuRuntimeQualificationEvidenceDigest(payload),
  })
}

function createOwner(input: {
  measurements: readonly CanonicalSam31TemporalMeasurementSet[]
  reviews: readonly CanonicalSam31CompleteIntervalReview[]
  baselineComponent?: CanonicalSam31GpuRuntimeQualificationComponentEvidence
    | null
  baselineEvidence?: CanonicalSam31GpuRuntimeQualificationEvidence | null
}) {
  const objectPort = memoryObjectPort(new Map())
  return createCanonicalSam31GpuTemporalQualityQualificationOwner({
    readPort: readPort(input),
    qualitySetRepository: createCanonicalSam31TemporalQualitySetRepository({
      objectPort,
    }),
    componentRepository:
      createCanonicalSam31GpuRuntimeQualificationComponentEvidenceRepository({
        objectPort,
      }),
    now: () => '2026-08-04T20:35:00.000Z',
  })
}

function readPort(input: {
  measurements: readonly CanonicalSam31TemporalMeasurementSet[]
  reviews: readonly CanonicalSam31CompleteIntervalReview[]
  baselineComponent?: CanonicalSam31GpuRuntimeQualificationComponentEvidence
    | null
  baselineEvidence?: CanonicalSam31GpuRuntimeQualificationEvidence | null
}): CanonicalSam31TemporalQualityReadPort {
  const measurements = new Map(input.measurements.map((value) => [
    refKey(canonicalSam31TemporalMeasurementSetRef(value)), value,
  ]))
  const reviews = new Map(input.reviews.map((value) => [
    refKey(canonicalSam31CompleteIntervalReviewRef(value)), value,
  ]))
  return {
    async rereadTemporalMeasurementSet({ measurementSetRef }) {
      const value = measurements.get(refKey(measurementSetRef))
      return value ? structuredClone(value) : null
    },
    async rereadCompleteIntervalReview({ reviewRef }) {
      const value = reviews.get(refKey(reviewRef))
      return value ? structuredClone(value) : null
    },
    async rereadApprovedA100BaselineComponent({ componentRef }) {
      const value = input.baselineComponent
      return value && refKey(
        canonicalSam31GpuRuntimeQualificationComponentRef(value),
      ) === refKey(componentRef) ? structuredClone(value) : null
    },
    async rereadApprovedA100RuntimeQualificationEvidence({
      qualificationEvidenceRef,
    }) {
      const value = input.baselineEvidence
      return value && refKey(
        canonicalSam31GpuRuntimeQualificationEvidenceRef(value),
      ) === refKey(qualificationEvidenceRef) ? structuredClone(value) : null
    },
  }
}

function ref(id: string): Ref {
  return { id, version: 1, contentHash: `sha256:${digest(id)}` }
}

function refKey(value: { id: string; version: number; contentHash: string }) {
  return `${value.id}:${value.version}:${value.contentHash}`
}

function withoutKey<T extends Record<string, unknown>, K extends keyof T>(
  value: T,
  key: K,
): Omit<T, K> {
  const clone = { ...value }
  delete clone[key]
  return clone
}

function memoryObjectPort(
  storage: Map<string, Buffer>,
): CanonicalCreateOnlyJsonObjectPort {
  return {
    async createOnly(input) {
      assert.equal(digest(input.body), input.contentSha256)
      if (storage.has(input.objectPath)) return 'already_exists'
      storage.set(input.objectPath, Buffer.from(input.body))
      return 'created'
    },
    async readExact(path) {
      const value = storage.get(path)
      return value ? Buffer.from(value) : null
    },
  }
}

function digest(value: string | Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}
