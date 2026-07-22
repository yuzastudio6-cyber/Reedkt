import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Readable } from 'node:stream'
import { promisify } from 'node:util'

import { ApiError } from '../errors/api-error'
import {
  activatePrivateOfflineMediaBinaryRuntime,
  buildOfflineMediaBinaryVisualCalibrationObjectiveQaRequest,
  type OfflineMediaBinaryServerInjectedInput,
} from '../tool-execution/media-binary-execution'

const run = promisify(execFile)
const root = await mkdtemp(join(tmpdir(), 'reeditpro-visual-calibration-qa-'))

try {
  const moving = await mediaFixture('moving',
    'testsrc2=size=320x180:rate=24:duration=4')
  const frozen = await mediaFixture('frozen',
    'color=c=red:size=320x180:rate=24:duration=4')
  const runtime = await activatePrivateOfflineMediaBinaryRuntime()
  const movingRequest = requestFor('moving', moving)

  assert.throws(
    () => buildOfflineMediaBinaryVisualCalibrationObjectiveQaRequest({
      ...requestInput('invalid', moving),
      scenarioKind: 'not-a-scenario' as 'style_led_motion',
    }),
    (error: unknown) => error instanceof ApiError &&
      error.code === 'VALIDATION_FAILED',
  )

  const movingResult = await runtime
    .executeVisualCalibrationObjectiveQaServerInjected(
      movingRequest,
      inputsFor(moving),
    )
  const movingDocument = movingResult.resultJson.document as {
    passed: boolean
    frameCount: number
    blackFrameRatioMillionths: number
    frozenFrameRatioMillionths: number
    motionSignalRatioMillionths: number
    firstFrameSimilarityMillionths: number
    lastFrameSimilarityMillionths: number
    providerCostIncluded: boolean
    customerCreditsIncluded: boolean
    serviceFeeIncluded: boolean
  }
  assert.equal(movingDocument.passed, true)
  assert.equal(movingDocument.frameCount, 96)
  assert.ok(movingDocument.blackFrameRatioMillionths <= 20_000)
  assert.ok(movingDocument.frozenFrameRatioMillionths <= 500_000)
  assert.ok(movingDocument.motionSignalRatioMillionths >= 50_000)
  assert.ok(movingDocument.firstFrameSimilarityMillionths >= 900_000)
  assert.ok(movingDocument.lastFrameSimilarityMillionths >= 900_000)
  assert.equal(movingDocument.providerCostIncluded, false)
  assert.equal(movingDocument.customerCreditsIncluded, false)
  assert.equal(movingDocument.serviceFeeIncluded, false)
  assert.equal(movingResult.evidence.resourceObservation.observerKind,
    'media_container_cgroup_v2_v1')
  assert.equal(movingResult.evidence.confinement.networkMode, 'none')
  assert.equal(movingResult.evidence.confinement.readOnlyRootFilesystem, true)
  assert.equal(movingResult.readiness.productionReady, false)

  const frozenResult = await runtime
    .executeVisualCalibrationObjectiveQaServerInjected(
      requestFor('frozen', frozen),
      inputsFor(frozen),
    )
  const frozenDocument = frozenResult.resultJson.document as {
    passed: boolean
    maximumFrozenRunFrames: number
    motionSignalRatioMillionths: number
  }
  assert.equal(frozenDocument.passed, false)
  assert.ok(frozenDocument.maximumFrozenRunFrames > 47)
  assert.equal(frozenDocument.motionSignalRatioMillionths, 0)

  await assert.rejects(
    runtime.executeVisualCalibrationObjectiveQaServerInjected(
      movingRequest,
      {
        ...inputsFor(moving),
        candidate: injected(Buffer.concat([moving.candidate, Buffer.from([0])])),
      },
    ),
    (error: unknown) => error instanceof ApiError &&
      error.code === 'VALIDATION_FAILED',
  )

  console.log(JSON.stringify({
    smoke: 'offline-media-binary-visual-calibration-objective-qa',
    recipeProfileId: movingRequest.recipeProfileId,
    runnerProfileId: movingRequest.runnerProfileId,
    movingOutcome: movingDocument.passed ? 'passed' : 'failed',
    frozenOutcome: frozenDocument.passed ? 'passed' : 'failed',
    frameCount: movingDocument.frameCount,
    firstFrameSimilarityMillionths:
      movingDocument.firstFrameSimilarityMillionths,
    lastFrameSimilarityMillionths:
      movingDocument.lastFrameSimilarityMillionths,
    resourceObservationHash:
      movingResult.evidence.resourceObservation.observationHash,
    attestationHash: movingResult.attestation.attestationHash,
    providerCallMade: false,
    customerPriceIncluded: false,
    customerCreditsIncluded: false,
    serviceFeeIncluded: false,
    productionReady: false,
  }, null, 2))
} finally {
  await rm(root, { recursive: true, force: true })
}

interface MediaFixture {
  candidate: Buffer
  firstFrame: Buffer
  lastFrame: Buffer
}

async function mediaFixture(label: string, source: string): Promise<MediaFixture> {
  const candidatePath = join(root, `${label}.mp4`)
  const firstFramePath = join(root, `${label}-first.png`)
  const lastFramePath = join(root, `${label}-last.png`)
  await run('/opt/homebrew/bin/ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-f', 'lavfi', '-i', source,
    '-frames:v', '96', '-an', '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
    '-r', '24', '-g', '24', '-movflags', '+faststart', '-y', candidatePath,
  ])
  await run('/opt/homebrew/bin/ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-i', candidatePath,
    '-vf', 'select=eq(n\\,0)', '-frames:v', '1', '-y', firstFramePath,
  ])
  await run('/opt/homebrew/bin/ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-i', candidatePath,
    '-vf', 'select=eq(n\\,95)', '-frames:v', '1', '-y', lastFramePath,
  ])
  return {
    candidate: await readFile(candidatePath),
    firstFrame: await readFile(firstFramePath),
    lastFrame: await readFile(lastFramePath),
  }
}

function requestFor(label: string, fixture: MediaFixture) {
  return buildOfflineMediaBinaryVisualCalibrationObjectiveQaRequest(
    requestInput(label, fixture),
  )
}

function requestInput(label: string, fixture: MediaFixture) {
  return {
    sourceProviderOperationId:
      'provider.google.generate_visual_calibration_candidate.v1' as const,
    sourceProviderOutputRole:
      'provider_visual_calibration_video_mp4' as const,
    visualCalibrationContextDigest: digest(`visual-context:${label}`),
    scenarioKind: 'strict_first_last_frame' as const,
    candidate: commitment(fixture.candidate),
    firstFrame: {
      assetId: `first-frame-${label}`,
      assetVersionId: `first-frame-version-${label}`,
      ...commitment(fixture.firstFrame),
    },
    lastFrame: {
      assetId: `last-frame-${label}`,
      assetVersionId: `last-frame-version-${label}`,
      ...commitment(fixture.lastFrame),
    },
  }
}

function inputsFor(fixture: MediaFixture) {
  return {
    candidate: injected(fixture.candidate),
    firstFrame: injected(fixture.firstFrame),
    lastFrame: injected(fixture.lastFrame),
  }
}

function commitment(bytes: Buffer) {
  const sha256 = sha(bytes)
  return {
    byteLength: bytes.byteLength,
    sha256,
    privateObjectIdentityHash: digest(`private-object:${sha256}`),
  }
}

function injected(bytes: Buffer): OfflineMediaBinaryServerInjectedInput {
  return Object.freeze({
    inputMode: 'private_verified_stream_v1' as const,
    byteLength: bytes.byteLength,
    sha256: sha(bytes),
    async openStream() { return Readable.from(bytes) },
  })
}

function sha(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex')
}

function digest(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}
