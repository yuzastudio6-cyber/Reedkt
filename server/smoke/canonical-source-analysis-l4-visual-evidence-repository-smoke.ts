import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type { VisualIntelligenceEvidenceRef } from
  '../../src/types/visual-intelligence'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalSourceAnalysisL4VisualEvidenceRepository,
  createCanonicalSourceAnalysisL4VisualEvidenceResult,
} from '../services/canonical-source-analysis-l4-visual-evidence-repository'
import {
  createCanonicalSourceLedSourceFrameAuthority,
} from '../services/canonical-source-led-content-analysis-evidence'
import type {
  CanonicalSourceTranscriptOrchestraReadScope,
} from '../services/canonical-source-led-orchestra-content-analysis-reconciliation'
import { sha256AuthorityValue } from
  '../services/private-edit-authority-store'
import {
  VISUAL_INTELLIGENCE_CANONICAL_TOOL_OPERATION_IDS,
} from '../visual-intelligence/visual-intelligence-orchestra-capability-manifest'

const rawSha = (value: string | Buffer) => createHash('sha256')
  .update(value).digest('hex')
const ref = (
  id: string,
  value: unknown = { id },
): VisualIntelligenceEvidenceRef => Object.freeze({
  id,
  version: 1,
  contentHash: `sha256:${sha256AuthorityValue(value)}`,
})

class MemoryObjectPort implements CanonicalCreateOnlyJsonObjectPort {
  readonly objects = new Map<string, Buffer>()

  async createOnly(input: {
    readonly objectPath: string
    readonly body: Buffer
    readonly contentSha256: string
  }): Promise<'created' | 'already_exists'> {
    assert.equal(rawSha(input.body), input.contentSha256)
    if (this.objects.has(input.objectPath)) return 'already_exists'
    this.objects.set(input.objectPath, Buffer.from(input.body))
    return 'created'
  }

  async readExact(objectPath: string): Promise<Buffer | null> {
    const value = this.objects.get(objectPath)
    return value ? Buffer.from(value) : null
  }
}

const sourceSha256 = rawSha('canonical-source-video')
const finalizedMediaAuthorityRef = ref('finalized-media-authority')
const sourceProbeAuthorityRef = ref('source-probe-authority')
const finalizedStorageObjectAuthorityRef = ref(
  'finalized-storage-object-authority',
)
const scope: CanonicalSourceTranscriptOrchestraReadScope = Object.freeze({
  ownerUserId: 'user-1',
  workspaceId: 'workspace-1',
  projectId: 'project-1',
  editSessionId: 'edit-session-1',
  analysisRunId: 'analysis-run-1',
  sourceSequenceItemId: 'source-item-1',
  mediaAssetId: 'media-asset-1',
  uploadedOrder: 1,
  checksumSha256: sourceSha256,
  byteLength: 48_000_000,
  durationFrames: 11_520,
  sourceFrameAuthority: createCanonicalSourceLedSourceFrameAuthority({
    fpsNumerator: 24,
    fpsDenominator: 1,
    frameCount: 11_520,
    timeBaseNumerator: 1,
    timeBaseDenominator: 12_288,
  }),
  finalizedMediaAuthorityRef,
  sourceProbeAuthorityRef,
})

const exactToolEvidence = [
  item('media_probe', 'ffprobe',
    VISUAL_INTELLIGENCE_CANONICAL_TOOL_OPERATION_IDS.ffprobe, 1,
    sourceProbeAuthorityRef),
  item('private_media_transform', 'ffmpeg',
    VISUAL_INTELLIGENCE_CANONICAL_TOOL_OPERATION_IDS.ffmpeg, 2),
  item('scene_detection', 'pyscenedetect',
    VISUAL_INTELLIGENCE_CANONICAL_TOOL_OPERATION_IDS.pyscenedetect, 3),
  item('pixel_measurement', 'opencv',
    VISUAL_INTELLIGENCE_CANONICAL_TOOL_OPERATION_IDS.opencv, 4),
  item('exact_visible_text', 'ocr',
    VISUAL_INTELLIGENCE_CANONICAL_TOOL_OPERATION_IDS.paddleocr, 5),
  item('sampling_policy', 'ffmpeg',
    VISUAL_INTELLIGENCE_CANONICAL_TOOL_OPERATION_IDS.ffmpeg, 6),
]

const validInput = {
  scope,
  sourceObject: {
    storageProvider: 'google_cloud_storage' as const,
    storageBucket: 'weeditpro-private-source-media',
    storagePath: 'workspaces/workspace-1/sources/video.mp4',
    storageGeneration: '101',
    storageEtag: 'source-etag-101',
    contentType: 'video/mp4' as const,
    width: 1_920,
    height: 1_080,
    checksumSha256: sourceSha256,
    byteLength: scope.byteLength,
    finalizedMediaAuthorityRef,
    finalizedStorageObjectAuthorityRef,
    exactGenerationEtagChecksumAndLengthRereadVerified: true as const,
  },
  operationId:
    'internal.visual_intelligence.prepare_source_visual_evidence.v1' as const,
  routeProfileId: 'quality_l4_user_triggered_standard_media_job_v1' as const,
  acceleratorClass: 'nvidia_l4' as const,
  cloudRunJobName: 'reeditpro-professional-l4' as const,
  cloudRunExecutionRef: ref('cloud-run-execution'),
  attemptCostEvidenceRef: ref('account-effective-attempt-cost'),
  toolEvidence: exactToolEvidence,
  userTriggeredScaleFromZero: true as const,
  minimumIdleInstances: 0 as const,
  maximumAttempts: 1 as const,
  uncertainOutcomeRetryAllowed: false as const,
  runtimeNetworkDownloadPerformed: false as const,
  exactSourceReleaseExecutionAndCostRereadVerified: true as const,
  privateEvidencePersistedAndReread: true as const,
  browserOrCallerEvidenceAccepted: false as const,
  callerPathUrlBytesCommandOrEnvironmentAccepted: false as const,
  customerCreditMutated: false as const,
  systemFailureChargedToCustomer: false as const,
  unapprovedOverageChargedToCustomer: false as const,
  directProviderCallMade: false as const,
  directTimelineMutationPerformed: false as const,
  qaApprovalGranted: false as const,
  publicDeliveryGranted: false as const,
  productionAuthorityGranted: false as const,
}

const result = createCanonicalSourceAnalysisL4VisualEvidenceResult(validInput)
assert.equal(result.acceleratorClass, 'nvidia_l4')
assert.equal(result.minimumIdleInstances, 0)
assert.equal(result.toolEvidence.length, 6)
assert.equal(result.toolEvidence[0]?.operationId,
  VISUAL_INTELLIGENCE_CANONICAL_TOOL_OPERATION_IDS.ffprobe)
assert.equal(result.toolEvidence[5]?.operationId,
  VISUAL_INTELLIGENCE_CANONICAL_TOOL_OPERATION_IDS.ffmpeg)

const repository = createCanonicalSourceAnalysisL4VisualEvidenceRepository({
  objectPort: new MemoryObjectPort(),
})
const created = await repository.persistCreateOnly({ scope, result })
assert.equal(created.disposition, 'created')
assert.equal(created.gpuJobStarted, false)
assert.equal(created.customerCreditMutated, false)
const reread = await repository.readCompleted(scope)
assert.deepEqual(reread, result)
assert.notEqual(reread, result)
const replay = await repository.persistCreateOnly({ scope, result })
assert.equal(replay.disposition, 'identical_replay')
assert.deepEqual(replay.repositoryRecordRef, created.repositoryRecordRef)

assert.equal(await repository.readCompleted({
  ...scope,
  analysisRunId: 'different-analysis-run',
}), null)

assert.throws(() => createCanonicalSourceAnalysisL4VisualEvidenceResult({
  ...validInput,
  toolEvidence: [...exactToolEvidence].reverse(),
}), (error: unknown) => hasGate(error,
  'source_analysis_l4_visual_evidence_semantics_invalid'))

assert.throws(() => createCanonicalSourceAnalysisL4VisualEvidenceResult({
  ...validInput,
  toolEvidence: exactToolEvidence.map((value, index) => index === 0
    ? { ...value, operationId: 'tool.ffprobe.probe_private_media.v1' }
    : value),
}), (error: unknown) => hasGate(error,
  'source_analysis_l4_visual_evidence_semantics_invalid'))

assert.throws(() => createCanonicalSourceAnalysisL4VisualEvidenceResult({
  ...validInput,
  toolEvidence: exactToolEvidence.map((value, index) => index === 1
    ? { ...value, evidenceRef: exactToolEvidence[0].evidenceRef }
    : value),
}), (error: unknown) => hasGate(error,
  'source_analysis_l4_visual_evidence_semantics_invalid'))

assert.throws(() => createCanonicalSourceAnalysisL4VisualEvidenceResult({
  ...validInput,
  toolEvidence: exactToolEvidence.map((value, index) => index === 1
    ? { ...value, executionRef: exactToolEvidence[0].executionRef }
    : value),
}), (error: unknown) => hasGate(error,
  'source_analysis_l4_visual_evidence_semantics_invalid'))

assert.throws(() => createCanonicalSourceAnalysisL4VisualEvidenceResult({
  ...validInput,
  sourceObject: {
    ...validInput.sourceObject,
    checksumSha256: rawSha('different-source'),
  },
}), (error: unknown) => hasGate(error,
  'source_analysis_l4_visual_evidence_semantics_invalid'))

for (const opened of [
  { userTriggeredScaleFromZero: false },
  { minimumIdleInstances: 1 },
  { runtimeNetworkDownloadPerformed: true },
  { callerPathUrlBytesCommandOrEnvironmentAccepted: true },
  { customerCreditMutated: true },
  { productionAuthorityGranted: true },
] as const) {
  assert.throws(() => createCanonicalSourceAnalysisL4VisualEvidenceResult({
    ...validInput,
    ...opened,
  } as unknown as Parameters<
    typeof createCanonicalSourceAnalysisL4VisualEvidenceResult
  >[0]), /Invalid literal value|Invalid input/u)
}

const tampered = { ...result, resultDigestSha256: rawSha('tampered') }
await assert.rejects(repository.persistCreateOnly({ scope, result: tampered }),
  (error: unknown) => hasGate(error,
    'source_analysis_l4_visual_evidence_digest_invalid'))

const hostile = new Proxy({}, {
  ownKeys() { throw new Error('hostile-ownKeys') },
})
assert.throws(() => createCanonicalSourceAnalysisL4VisualEvidenceResult(
  hostile as Parameters<
    typeof createCanonicalSourceAnalysisL4VisualEvidenceResult
  >[0],
))

console.log(JSON.stringify({
  status: 'passed',
  checks: {
    exactSixRoleEvidence: true,
    releasedCanonicalOperationIds: true,
    l4ScaleFromZeroBoundary: true,
    createOnlyReread: true,
    identicalReplay: true,
    staleScopeRefused: true,
    orderedRolesRefused: true,
    staleOperationRefused: true,
    duplicateEvidenceRefRefused: true,
    duplicateExecutionRefRefused: true,
    sourceIdentityMismatchRefused: true,
    openedAuthorityRefused: true,
    digestTamperRefused: true,
    hostileInputRefused: true,
  },
  authority: {
    gpuJobStarted: false,
    providerCalled: false,
    customerCreditMutated: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
  },
}, null, 2))

function item(
  role: 'media_probe' | 'private_media_transform' | 'scene_detection'
    | 'pixel_measurement' | 'exact_visible_text' | 'sampling_policy',
  tool: 'ffprobe' | 'ffmpeg' | 'pyscenedetect' | 'opencv' | 'ocr',
  operationId: string,
  ordinal: number,
  evidenceRef: VisualIntelligenceEvidenceRef = ref(`tool-evidence-${ordinal}`),
) {
  return Object.freeze({
    role,
    tool,
    operationId,
    toolVersion: `qualified-tool-release-${ordinal}`,
    evidenceRef,
    runtimeReleaseRef: ref(`runtime-release-${tool}`),
    executionRef: ref(`tool-execution-${ordinal}`),
    exactSourceChecksumBound: true as const,
    exactCanonicalResultRereadVerified: true as const,
    substantiveCpuExecutionUsed: false as const,
  })
}

function hasGate(error: unknown, gate: string): boolean {
  return Boolean(
    error
    && typeof error === 'object'
    && 'details' in error
    && (error as { details?: { requiredGate?: string } }).details
      ?.requiredGate === gate,
  )
}
