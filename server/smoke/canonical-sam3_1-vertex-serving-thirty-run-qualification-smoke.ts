import assert from 'node:assert/strict'

import {
  assertCanonicalSam31VertexServingThirtyRunQualification,
} from '../services/canonical-sam3_1-vertex-serving-thirty-run-qualification-service'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'

const deterministicQualificationId = 'sam31-a100-deterministic-smoke'
const latencyReplacementQualificationId = 'sam31-a100-latency-smoke'
const semanticDigest = '1'.repeat(64)
interface DeterministicRun {
  readonly runOrdinal: number
  readonly invocationId: string
  readonly qualificationResultRef: ReturnType<typeof ref>
  readonly qualificationOutputRef: ReturnType<typeof ref>
  readonly taskRef: ReturnType<typeof ref>
  readonly runtimeResponseRef: ReturnType<typeof ref>
  readonly manifestRef: ReturnType<typeof ref>
  readonly privateOutputRereadEvidenceRef: ReturnType<typeof ref>
  readonly semanticMaskSetDigestSha256: string
  readonly providerRoundTripDurationMilliseconds: number | null
  readonly terminalEvidenceMode:
    | 'provider_prediction_and_private_response'
    | 'private_response_reconciliation'
}
const deterministicRuns: DeterministicRun[] = Array.from(
  { length: 30 }, (_, index) => {
  const runOrdinal = index + 1
  const invocationId = invocation(deterministicQualificationId, runOrdinal)
  return {
    runOrdinal,
    invocationId,
    qualificationResultRef: ref(`result:${invocationId}`, digit(index + 1)),
    qualificationOutputRef: ref(`output:${invocationId}`, digit(index + 31)),
    taskRef: ref(`task:${invocationId}`, digit(index + 61)),
    runtimeResponseRef: ref(`response:${invocationId}`, digit(index + 91)),
    manifestRef: ref(`manifest:${invocationId}`, digit(index + 121)),
    privateOutputRereadEvidenceRef:
      ref(`output-evidence:${invocationId}`, digit(index + 151)),
    semanticMaskSetDigestSha256: semanticDigest,
    providerRoundTripDurationMilliseconds:
      runOrdinal === 1 ? null : 90_000 + runOrdinal,
    terminalEvidenceMode: runOrdinal === 1
      ? 'private_response_reconciliation' as const
      : 'provider_prediction_and_private_response' as const,
  }
  },
)
const replacementInvocation = invocation(latencyReplacementQualificationId, 1)
const performanceRuns = [
  {
    measurementOrdinal: 1,
    sourceRunOrdinal: 1,
    replacementForRecoveredRun: true,
    invocationId: replacementInvocation,
    qualificationResultRef:
      ref(`result:${replacementInvocation}`, digit(201)),
    qualificationOutputRef:
      ref(`output:${replacementInvocation}`, digit(202)),
    durationMilliseconds: 93_106,
  },
  ...deterministicRuns.slice(1).map((run, index) => ({
    measurementOrdinal: index + 2,
    sourceRunOrdinal: index + 2,
    replacementForRecoveredRun: false,
    invocationId: run.invocationId,
    qualificationResultRef: run.qualificationResultRef,
    qualificationOutputRef: run.qualificationOutputRef,
    durationMilliseconds: run.providerRoundTripDurationMilliseconds!,
  })),
]
const payload: Record<string, unknown> = {
  schemaVersion:
    'canonical-sam3_1-vertex-serving-thirty-run-qualification-v1' as const,
  source: (
    'canonical_server_sam3_1_vertex_serving_thirty_run_qualification_owner'
  ) as const,
  evidenceClass: 'canonical_private_exact_reread' as const,
  status: 'qualified_for_l4_quality_and_performance_comparison' as const,
  qualificationSetId: 'sam31-a100-serving-thirty-run-smoke',
  deterministicQualificationId,
  latencyReplacementQualificationId,
  routeId: 'a100_80gb_heavy_primary' as const,
  accelerator: 'nvidia_a100_80gb' as const,
  immutableImageDigest: `sha256:${'a'.repeat(64)}` as const,
  deterministicRuns,
  performanceRuns,
  semanticMaskSetDigestSha256: semanticDigest,
  deterministicOutputRunCount: 30 as const,
  measuredPerformanceRunCount: 30 as const,
  recoveredOutputRunCount: 1 as const,
  propagatedFrameCountPerRun: 200 as const,
  maskFileCountPerRun: 400 as const,
  exactMaskFileCountRereadAcrossDeterministicRuns: 12_000 as const,
  nearestRankP95Milliseconds: 90_030,
  minimumMeasuredMilliseconds: 90_002,
  maximumMeasuredMilliseconds: 93_106,
  maximumAllowedP95Milliseconds: 480_000 as const,
  allThirtyDeterministicOutputsSemanticallyIdentical: true as const,
  allThirtyPerformanceMeasurementsUseExactPredictionReceipts: true as const,
  recoveredRunExcludedFromLatencyAndReplacedExplicitly: true as const,
  exactTaskResponseOutputManifestAndMaskEvidenceReread: true as const,
  customerInvocationAuthorized: false as const,
  customerCreditsMutated: false as const,
  qaApproved: false as const,
  l4FallbackQualified: false as const,
  runtimeReleaseGranted: false as const,
  publicDeliveryAuthorized: false as const,
  productionAuthorityGranted: false as const,
  compiledAt: '2026-08-12T10:00:00.000Z',
}
const receipt: Record<string, unknown> = {
  ...payload,
  receiptHash: sha256AuthorityValue(payload),
}
assert.deepEqual(
  assertCanonicalSam31VertexServingThirtyRunQualification(receipt),
  receipt,
)

for (const tampered of [
  rehash({ ...receipt, nearestRankP95Milliseconds: 90_029 }),
  rehash({
    ...receipt,
    deterministicRuns: deterministicRuns.map((run, index) =>
      index === 7
        ? { ...run, semanticMaskSetDigestSha256: '2'.repeat(64) }
        : run),
  }),
  rehash({
    ...receipt,
    performanceRuns: performanceRuns.map((run, index) =>
      index === 3 ? { ...run, sourceRunOrdinal: 9 } : run),
  }),
  rehash({
    ...receipt,
    deterministicRuns: deterministicRuns.map((run, index) =>
      index === 0
        ? { ...run, providerRoundTripDurationMilliseconds: 840_000 }
        : run),
  }),
]) {
  assert.throws(() =>
    assertCanonicalSam31VertexServingThirtyRunQualification(tampered))
}

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-vertex-serving-thirty-run-qualification',
  status: 'passed',
  checks: 20,
  deterministicOutputRuns: 30,
  exactMaskFilesReread: 12_000,
  recoveredRunExcludedFromLatency: true,
  replacementPredictionRequired: true,
  nearestRankP95Recomputed: true,
  semanticSubstitutionRejected: true,
  l4FallbackQualified: false,
  customerCreditsMutated: false,
  qaApproved: false,
  productionAuthorityGranted: false,
}, null, 2))

function invocation(qualificationId: string, runOrdinal: number) {
  return `sam31-a100-qualification:${qualificationId}`
    + `.run-${String(runOrdinal).padStart(2, '0')}.execution`
}

function ref(id: string, hash: string) {
  return { id, version: 1, contentHash: `sha256:${hash}` }
}

function digit(value: number): string {
  return value.toString(16).padStart(64, '0').slice(-64)
}

function rehash(value: Record<string, unknown>): Record<string, unknown> {
  const body = { ...value }
  delete (body as { receiptHash?: string }).receiptHash
  return { ...body, receiptHash: sha256AuthorityValue(body) }
}
