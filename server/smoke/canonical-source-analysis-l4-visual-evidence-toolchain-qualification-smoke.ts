import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type {
  VisualIntelligenceEvidenceRef,
} from '../../src/types/visual-intelligence'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_QUALIFIED_TOOL_VERSIONS,
  assertCanonicalSourceAnalysisL4VisualEvidenceToolchainQualification,
  createCanonicalSourceAnalysisL4VisualEvidenceToolchainQualification,
  createCanonicalSourceAnalysisL4VisualEvidenceToolchainQualificationOwner,
  getCanonicalSourceAnalysisL4VisualEvidenceToolchainQualificationRef,
} from '../services/canonical-source-analysis-l4-visual-evidence-toolchain-qualification-owner'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  VISUAL_INTELLIGENCE_CANONICAL_TOOL_OPERATION_IDS,
} from '../visual-intelligence/visual-intelligence-orchestra-capability-manifest'

const sha = (value: string) => createHash('sha256').update(value).digest('hex')
const ref = (id: string): VisualIntelligenceEvidenceRef => Object.freeze({
  id,
  version: 1,
  contentHash: `sha256:${sha256AuthorityValue({ id })}`,
})

class MemoryObjectPort implements CanonicalCreateOnlyJsonObjectPort {
  readonly values = new Map<string, Buffer>()
  async createOnly(input: {
    objectPath: string
    body: Buffer
    contentSha256: string
  }): Promise<'created' | 'already_exists'> {
    assert.equal(
      createHash('sha256').update(input.body).digest('hex'),
      input.contentSha256,
    )
    if (this.values.has(input.objectPath)) return 'already_exists'
    this.values.set(input.objectPath, Buffer.from(input.body))
    return 'created'
  }
  async readExact(path: string): Promise<Buffer | null> {
    const body = this.values.get(path)
    return body ? Buffer.from(body) : null
  }
}

const imageRef = ref('l4-visual-evidence-image')
const tools = [
  ['media_probe', 'ffprobe',
    VISUAL_INTELLIGENCE_CANONICAL_TOOL_OPERATION_IDS.ffprobe],
  ['private_media_transform', 'ffmpeg',
    VISUAL_INTELLIGENCE_CANONICAL_TOOL_OPERATION_IDS.ffmpeg],
  ['scene_detection', 'pyscenedetect',
    VISUAL_INTELLIGENCE_CANONICAL_TOOL_OPERATION_IDS.pyscenedetect],
  ['pixel_measurement', 'opencv',
    VISUAL_INTELLIGENCE_CANONICAL_TOOL_OPERATION_IDS.opencv],
  ['exact_visible_text', 'ocr',
    VISUAL_INTELLIGENCE_CANONICAL_TOOL_OPERATION_IDS.paddleocr],
  ['sampling_policy', 'ffmpeg',
    VISUAL_INTELLIGENCE_CANONICAL_TOOL_OPERATION_IDS.ffmpeg],
] as const
const qualification =
  createCanonicalSourceAnalysisL4VisualEvidenceToolchainQualification({
    qualificationId: 'l4-visual-evidence-toolchain-qualification',
    projectId: 'reeditpro',
    runtimeRegion: 'us-central1',
    routeProfileId: 'quality_l4_user_triggered_standard_media_job_v1',
    acceleratorClass: 'nvidia_l4',
    configuredGpuType: 'nvidia-l4',
    runtimePlatform: 'linux_amd64',
    immutableImageRef: imageRef,
    immutableImageDigest: imageRef.contentHash,
    sourceCommitSha: '1'.repeat(40),
    sourceTreeSha: '2'.repeat(40),
    imageBuildRef: ref('image-build'),
    spdx23SbomRef: ref('spdx-sbom'),
    vulnerabilityScanRef: ref('vulnerability-scan'),
    signatureVerificationRef: ref('signature-verification'),
    slsaProvenanceRef: ref('slsa-provenance'),
    qualificationFixtureSetRef: ref('qualification-fixture-set'),
    toolReleases: tools.map(([role, tool, operationId], index) => ({
      role,
      tool,
      operationId,
      toolVersion:
        CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_QUALIFIED_TOOL_VERSIONS[
          role
        ],
      runtimeReleaseRef: ref(`tool-release-${index + 1}`),
      immutableToolArtifactSha256: sha(`tool-artifact-${index + 1}`),
      gpuExecutionEvidenceRef: ref(`gpu-execution-${index + 1}`),
    })),
    qualificationRunRefs: [ref('run-1'), ref('run-2'), ref('run-3')],
    deterministicOutputDigestSha256: sha('deterministic-output'),
    immutableImageDigestRereadVerified: true,
    spdx23SbomRereadVerified: true,
    criticalHighOrUnknownVulnerabilitiesAbsent: true,
    kmsSignatureVerified: true,
    slsaProvenanceVerified: true,
    actualNvidiaL4Observed: true,
    ffprobeMetadataOnlyVerified: true,
    ffmpegNvdecGpuDecodeVerified: true,
    ffmpegNvencGpuTransformVerified: true,
    pySceneDetectGpuMetricAdapterVerified: true,
    openCvCudaExecutionVerified: true,
    paddleOcrGpuInferenceVerified: true,
    exactSourceFrameAccountingVerified: true,
    completeTimelineSceneCoverageVerified: true,
    embeddedMediaInstructionsRemainUntrusted: true,
    substantiveCpuMediaProcessingUsed: false,
    runtimeNetworkDownloadPerformed: false,
    callerPathUrlBytesCommandOrEnvironmentAccepted: false,
    minimumIdleInstances: 0,
    userTriggeredOnly: true,
    customerCreditMutated: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
    qualifiedAt: '2026-08-04T12:00:00.000Z',
  })
const objectPort = new MemoryObjectPort()
const owner =
  createCanonicalSourceAnalysisL4VisualEvidenceToolchainQualificationOwner({
    objectPort,
  })
const first = await owner.persistCreateOnly(qualification)
assert.equal(first.disposition, 'created')
assert.equal((await owner.persistCreateOnly(qualification)).disposition,
  'identical_replay')
const qualificationRef =
  getCanonicalSourceAnalysisL4VisualEvidenceToolchainQualificationRef(
    qualification,
  )
assert.deepEqual(first.qualificationRef, qualificationRef)
const reread = await owner.readExact(qualificationRef)
assert.ok(reread)
;(reread!.toolReleases[1] as { toolVersion: string }).toolVersion = 'mutated'
assert.equal((await owner.readExact(qualificationRef))?.toolReleases[1]
  ?.toolVersion,
CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_QUALIFIED_TOOL_VERSIONS
  .private_media_transform)

const { qualificationDigestSha256: ignoredDigest, ...payload } = qualification
void ignoredDigest
assert.throws(() =>
  assertCanonicalSourceAnalysisL4VisualEvidenceToolchainQualification({
    ...payload,
    substantiveCpuMediaProcessingUsed: true,
    qualificationDigestSha256: sha256AuthorityValue({
      ...payload,
      substantiveCpuMediaProcessingUsed: true,
    }),
  }),
)
assert.throws(() =>
  assertCanonicalSourceAnalysisL4VisualEvidenceToolchainQualification({
    ...payload,
    qualificationRunRefs: [ref('run-1'), ref('run-1'), ref('run-3')],
    qualificationDigestSha256: sha256AuthorityValue({
      ...payload,
      qualificationRunRefs: [ref('run-1'), ref('run-1'), ref('run-3')],
    }),
  }),
)
const reorderedToolPayload = {
  ...payload,
  toolReleases: [
    payload.toolReleases[1]!,
    payload.toolReleases[0]!,
    ...payload.toolReleases.slice(2),
  ],
}
assert.throws(() =>
  assertCanonicalSourceAnalysisL4VisualEvidenceToolchainQualification({
    ...reorderedToolPayload,
    qualificationDigestSha256: sha256AuthorityValue(reorderedToolPayload),
  }),
)
const wrongToolVersionPayload = {
  ...payload,
  toolReleases: payload.toolReleases.map((item, index) => index === 1
    ? { ...item, toolVersion: 'caller-invented-ffmpeg-version' }
    : item),
}
assert.throws(() =>
  assertCanonicalSourceAnalysisL4VisualEvidenceToolchainQualification({
    ...wrongToolVersionPayload,
    qualificationDigestSha256: sha256AuthorityValue(
      wrongToolVersionPayload,
    ),
  }),
)

console.log(JSON.stringify({
  ok: true,
  ownerVersion: owner.ownerVersion,
  exactImageSupplyChainBound: true,
  fixedSixToolOrderBound: true,
  fixedQualifiedToolVersionsBound: true,
  actualL4QualificationRequired: true,
  threeRunDeterminismRequired: true,
  nvdecNvencOpenCvCudaAndPaddleGpuRequired: true,
  substantiveCpuMediaProcessingAllowed: false,
  runtimeDownloadAllowed: false,
  embeddedMediaInstructionsExecuted: false,
  createOnlyReplayAndDetachedRereadVerified: true,
  customerCreditMutated: false,
  publicDeliveryGranted: false,
  productionAuthorityGranted: false,
}))
