import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'

import {
  prepareOfflineRemotionDockerRuntime,
} from '../tool-execution/remotion-render-execution/offline-remotion-render-docker-runtime'
import {
  activatePrivateOfflineRemotionRenderRuntime,
} from '../tool-execution/remotion-render-execution/offline-remotion-render-execution-service'
import type {
  OfflineRemotionRenderResult,
} from '../tool-execution/remotion-render-execution/offline-remotion-render-execution-types'
import {
  buildCap18RealSourceMultiOutputFixture,
} from './captions-specialist-cap-18-real-source-multi-output-smoke'

const ORIGINAL_SOURCE_SHA256 =
  'a1640b8a2da4bf076c6ecfbd57d6cf51c1c2beea3536085c1b932c04c3dbf1f0'
const originalSourcePath = resolve(
  process.env.REEDITPRO_CAPTION_REAL_SOURCE_ORIGINAL_PATH?.trim()
    || join(homedir(), 'Documents/test video/internal testing.MP4'),
)
const sourceProxyPath = resolve(
  process.env.REEDITPRO_CAPTION_REAL_SOURCE_PROXY_PATH?.trim()
    || join(
      homedir(),
      '.codex/private_caption_evidence/real-source-design-2026-08-05-v1',
      'source-proxy-8.080-12.300-360x640-30.mp4',
    ),
)
const requestedOutputRoot =
  process.env.REEDITPRO_CAPTION_REAL_SOURCE_MULTI_OUTPUT_ROOT?.trim() || null
const outputBase = join(
  homedir(),
  '.codex/private_caption_evidence/real-source-design-2026-08-05-v1',
  'remotion-real-source-multi-output-v3',
)

async function writeCreateOnlyOrExactReplay(
  path: string,
  bytes: Buffer,
): Promise<void> {
  try {
    await writeFile(path, bytes, { mode: 0o600, flag: 'wx' })
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error
    assert.deepEqual(
      await readFile(path),
      bytes,
      `Private Caption evidence at ${path} cannot be replaced.`,
    )
  }
}

const originalSourceBytes = await readFile(originalSourcePath)
assert.equal(
  createHash('sha256').update(originalSourceBytes).digest('hex'),
  ORIGINAL_SOURCE_SHA256,
  'Multi-output proof must use the exact reviewed uploaded source.',
)
const sourceProxyBytes = await readFile(sourceProxyPath)
const fixture = buildCap18RealSourceMultiOutputFixture(sourceProxyBytes)
const outputRoot = resolve(requestedOutputRoot || join(
  outputBase,
  `accepted-${fixture.widescreen.fullSpec.reviewSpecDigestSha256.slice(0, 12)}-${
    fixture.square.fullSpec.reviewSpecDigestSha256.slice(0, 12)}`,
))

const prepared = await prepareOfflineRemotionDockerRuntime()
const runtime = await activatePrivateOfflineRemotionRenderRuntime()
assert.equal(runtime.image.imageId, prepared.imageId)
assert.equal(runtime.image.sourceTreeSha256, prepared.sourceTreeSha256)

const executions = [
  {
    label: 'widescreen-full',
    spec: fixture.widescreen.fullSpec,
    request: fixture.widescreen.fullRequest,
  },
  {
    label: 'widescreen-reduced',
    spec: fixture.widescreen.reducedSpec,
    request: fixture.widescreen.reducedRequest,
  },
  {
    label: 'square-full',
    spec: fixture.square.fullSpec,
    request: fixture.square.fullRequest,
  },
  {
    label: 'square-reduced',
    spec: fixture.square.reducedSpec,
    request: fixture.square.reducedRequest,
  },
] as const

const completed: Array<{
  label: string
  spec: typeof executions[number]['spec']
  result: OfflineRemotionRenderResult
}> = []
for (const execution of executions) {
  const result = await runtime.execute(execution.request)
  assert.equal(result.artifact.mimeType, 'video/mp4')
  assert.equal(result.artifact.width, execution.spec.privateReviewFrame.width)
  assert.equal(result.artifact.height, execution.spec.privateReviewFrame.height)
  assert.equal(result.artifact.fps, 30)
  assert.equal(result.artifact.durationFrames, 127)
  assert.deepEqual(
    result.frameArtifacts.map((artifact) => artifact.frame),
    execution.spec.inspectionFrameNumbers,
  )
  assert.equal(
    result.evidence.semanticEvidence
      .captionRealSourceSceneGroupCompositionExecuted,
    true,
  )
  assert.equal(
    result.evidence.semanticEvidence
      .realSourceEditorialSplitCompositionApplied,
    true,
  )
  assert.equal(
    result.evidence.semanticEvidence
      .editorialSidecarFaceAndGestureAvoidanceApplied,
    true,
  )
  assert.equal(
    result.evidence.semanticEvidence
      .realSourcePixelsRequiredForProfessionalAppearancePreserved,
    true,
  )
  assert.equal(
    result.evidence.semanticEvidence
      .syntheticEngineeringFixtureProfessionalAppearanceRejected,
    true,
  )
  assert.equal(
    result.evidence.semanticEvidence.sourceAudioPreservationRequested,
    true,
  )
  assert.equal(
    result.evidence.semanticEvidence.trackAllRuntimeEvidenceNotClaimed,
    true,
  )
  assert.equal(result.readiness.privateInternalOnly, true)
  assert.equal(result.readiness.productReady, false)
  assert.equal(result.readiness.productionReady, false)
  assert.ok(
    result.evidence.resourceObservation.finish.cpuUsageNanoseconds
      > result.evidence.resourceObservation.start.cpuUsageNanoseconds,
    `${execution.label} must contain measured CPU execution evidence.`,
  )
  completed.push({ label: execution.label, spec: execution.spec, result })
}

await mkdir(outputRoot, { recursive: true, mode: 0o700 })
for (const execution of completed) {
  await writeCreateOnlyOrExactReplay(
    join(outputRoot, `${execution.label}.mp4`),
    execution.result.artifact.bytes,
  )
  await writeCreateOnlyOrExactReplay(
    join(outputRoot, `${execution.label}-spec.json`),
    Buffer.from(`${JSON.stringify(execution.spec, null, 2)}\n`),
  )
  for (const artifact of execution.result.frameArtifacts) {
    await writeCreateOnlyOrExactReplay(
      join(outputRoot,
        `${execution.label}-frame-${String(artifact.frame).padStart(3, '0')}.png`),
      artifact.bytes,
    )
  }
}

console.log(JSON.stringify({
  status:
    'actual_private_real_source_multi_output_render_completed_pending_direct_raster_inspection',
  milestone: 'CAP-18 real-source multi-output',
  outputRoot,
  sourceProxyPath,
  originalSourceSha256: ORIGINAL_SOURCE_SHA256,
  imageId: prepared.imageId,
  sourceTreeSha256: prepared.sourceTreeSha256,
  outputs: completed.map(({ label, spec, result }) => ({
    label,
    outputFormat: spec.outputFormat,
    confirmedOutputFrame: {
      width: spec.confirmedOutputFrame.width,
      height: spec.confirmedOutputFrame.height,
    },
    reviewFrame: {
      width: result.artifact.width,
      height: result.artifact.height,
    },
    artifactSha256: result.artifact.sha256,
    byteLength: result.artifact.byteLength,
    frameArtifacts: result.frameArtifacts.map(({ frame, sha256 }) => ({
      frame,
      sha256,
    })),
  })),
  realSourcePixelsRendered: true,
  syntheticEngineeringFixtureAcceptedAsProfessionalAppearance: false,
  directRasterInspectionCompleted: false,
  canonicalTranscriptQualificationClaimed: false,
  trackAllRuntimeEvidenceClaimed: false,
  finalCustomerCanvasClaimed: false,
  productionAuthorityPromoted: false,
}, null, 2))
