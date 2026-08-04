import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { REEDITPRO_REFERENCE_MEDIA_MAX_BYTES } from '../../src/types/large-media'
import { loadRuntimeEnv } from '../config/env'
import {
  createEditReferenceLongFormStudyPlan,
  createEditReferenceLongFormStudyRun,
  deriveEditReferenceLongFormStudyProgress,
} from '../edit-references/edit-reference-long-form-study-contract'
import { inspectEditReferenceLongFormSource } from '../edit-references/edit-reference-long-form-source-inspector'
import { createUploadService } from '../services/upload-service'
import type { ServiceContext } from '../types'

const execFileAsync = promisify(execFile)
const SIX_HOURS_SECONDS = 6 * 60 * 60
const TEN_MINUTES_SECONDS = 10 * 60
const EXPECTED_CHUNK_COUNT = SIX_HOURS_SECONDS / TEN_MINUTES_SECONDS
const createdAt = '2026-07-20T23:00:00.000Z'

const root = await mkdtemp(path.join(tmpdir(), 'reeditpro-edit-reference-six-hour-'))

try {
  const context = createContext(root)
  const fixturePath = path.join(root, 'six-hour-sparse-reference.mp4')
  await materializeSparseSixHourVideo({
    ffmpegBin: context.env.ffmpegBin,
    outputPath: fixturePath,
  })

  const fixtureBytes = await readFile(fixturePath)
  const fixtureChecksum = sha256(fixtureBytes)
  const uploadService = createUploadService(context)
  const upload = await uploadService.createUploadIntent({
    workspaceId: 'workspace-six-hour-edit-reference',
    editReferenceId: 'edit-reference-six-hour-source',
    uploadPurpose: 'reference_media',
    originalFileName: 'six-hour-reference.mp4',
    mimeType: 'video/mp4',
    expectedSizeBytes: fixtureBytes.byteLength,
    checksumSha256: fixtureChecksum,
  })
  await uploadService.uploadLocalObject(
    upload.uploadIntent.id,
    'workspace-six-hour-edit-reference',
    fixtureBytes,
    'video/mp4',
  )
  const finalized = await uploadService.finalizeUploadIntent({
    workspaceId: 'workspace-six-hour-edit-reference',
    uploadIntentId: upload.uploadIntent.id,
    sizeBytes: fixtureBytes.byteLength,
    checksumSha256: fixtureChecksum,
  })

  const inspection = await inspectEditReferenceLongFormSource({
    env: context.env,
    storageObject: finalized.storageObjectRecord,
  })
  assert.equal(inspection.source.durationSeconds, SIX_HOURS_SECONDS)
  assert.equal(inspection.source.hasAudio, false)
  assert.equal(inspection.source.mediaChecksumSha256, fixtureChecksum)
  assert.equal(inspection.source.sizeBytes, fixtureBytes.byteLength)
  assert.equal(inspection.privateOriginalOpened, true)
  assert.equal(inspection.originalMutated, false)
  assert.equal(inspection.rawProbePayloadPersisted, false)

  const storedBytes = await readFile(path.join(
    root,
    finalized.storageObjectRecord.bucketName,
    finalized.storageObjectRecord.objectPath,
  ))
  assert.equal(sha256(storedBytes), fixtureChecksum)

  const plan = createEditReferenceLongFormStudyPlan({
    workspaceId: 'workspace-six-hour-edit-reference',
    editReferenceId: 'edit-reference-six-hour-source',
    studySessionId: 'study-six-hour-source',
    source: inspection.source,
    includeCaptionOcr: true,
    createdAt,
  })
  assert.equal(plan.durationClass, 'extended')
  assert.equal(plan.coreChunkDurationSeconds, TEN_MINUTES_SECONDS)
  assert.equal(plan.chunks.length, EXPECTED_CHUNK_COUNT)
  assert.equal(plan.chunks[0]?.coreStartSeconds, 0)
  assert.equal(plan.chunks.at(-1)?.coreEndSeconds, SIX_HOURS_SECONDS)
  assert.equal(plan.chunks.every((chunk, index) => (
    chunk.ordinal === index + 1
    && chunk.coreStartSeconds === index * TEN_MINUTES_SECONDS
    && chunk.coreEndSeconds === (index + 1) * TEN_MINUTES_SECONDS
    && chunk.minimumVisualSampleCount === 20
    && chunk.continuousAudioCoverageRequired === false
    && (index === 0 ? chunk.overlapBeforeSeconds === 0 : chunk.overlapBeforeSeconds === 3)
    && (index === plan.chunks.length - 1 ? chunk.overlapAfterSeconds === 0 : chunk.overlapAfterSeconds === 3)
  )), true)
  assert.equal(plan.chunks.every((chunk, index) => (
    index === 0 || chunk.coreStartSeconds === plan.chunks[index - 1]?.coreEndSeconds
  )), true)
  assert.equal(plan.studyTimeStandard.wholeStudyMayRunForMinutesOrHours, true)
  assert.equal(plan.studyTimeStandard.browserSessionRequiredForCompletion, false)
  assert.equal(plan.studyTimeStandard.fixedWholeStudyWallClockTimeoutApplied, false)
  assert.equal(plan.persistencePolicy.checkpointAfterEveryWorkItem, true)
  assert.equal(plan.persistencePolicy.leaseHeartbeatRequired, true)
  assert.equal(plan.persistencePolicy.restartResumeRequired, true)
  assert.equal(plan.completionStandard.requiredTemporalCoverageRatio, 1)
  assert.equal(plan.completionStandard.partialSamplingCannotClaimFullyStudied, true)

  const largeCapacityPlan = createEditReferenceLongFormStudyPlan({
    workspaceId: 'workspace-six-hour-edit-reference',
    editReferenceId: 'edit-reference-six-hour-source',
    studySessionId: 'study-six-hour-large-capacity-source',
    source: {
      ...inspection.source,
      privateMediaArtifactId: 'artifact-six-hour-large-capacity-source',
      mediaChecksumSha256: sha256('six-hour-large-capacity-source'),
      sizeBytes: REEDITPRO_REFERENCE_MEDIA_MAX_BYTES,
    },
    includeCaptionOcr: true,
    createdAt,
  })
  assert.equal(largeCapacityPlan.ingestPolicy.uploadTransport, 'resumable_required')
  assert.equal(largeCapacityPlan.ingestPolicy.browserWholeFileBufferingAllowed, false)
  assert.equal(largeCapacityPlan.ingestPolicy.validVideoRejectedOnlyForFileSize, false)
  assert.equal(largeCapacityPlan.ingestPolicy.infrastructureCapacityCheckedSeparately, true)
  assert.equal(largeCapacityPlan.chunks.length, EXPECTED_CHUNK_COUNT)
  assert.equal(largeCapacityPlan.completionStandard.requiredTemporalCoverageRatio, 1)

  const run = createEditReferenceLongFormStudyRun({
    runId: 'run-six-hour-source',
    plan,
    createdAt,
  })
  const requiredChunkStageCount = plan.stages.filter((stage) => (
    stage.required && stage.scope === 'chunk'
  )).length
  const requiredSourceOrFinalStageCount = plan.stages.filter((stage) => (
    stage.required && stage.scope !== 'chunk'
  )).length
  assert.equal(
    run.workItems.length,
    EXPECTED_CHUNK_COUNT * requiredChunkStageCount + requiredSourceOrFinalStageCount,
  )
  assert.equal(run.distributedRuntimeDeployed, false)
  assert.equal(run.providerExecutionAllowed, false)
  assert.equal(run.customerPriceCalculated, false)
  assert.equal(run.customerCreditsMutated, false)

  const progress = deriveEditReferenceLongFormStudyProgress({ run, plan })
  assert.equal(progress.progressPercent, 0)
  assert.equal(progress.temporalCoverageRatio, 0)
  assert.equal(progress.fullyStudied, false)
  assert.equal(progress.eta.confidence, 'planning')
  assert(progress.eta.lowerRemainingSeconds >= Math.ceil(SIX_HOURS_SECONDS * 0.15))
  assert(progress.eta.upperRemainingSeconds >= Math.ceil(SIX_HOURS_SECONDS * 1.5))

  console.log(JSON.stringify({
    status: 'passed',
    smoke: 'edit-reference-multi-hour-source-admission',
    realFfprobeExecuted: true,
    actualSourceDurationSeconds: inspection.source.durationSeconds,
    sparseFixtureBytes: fixtureBytes.byteLength,
    exactWholeSourceChunkCount: plan.chunks.length,
    exactWholeSourceWorkItemCount: run.workItems.length,
    maximumReviewedReferenceBytesPlanned: REEDITPRO_REFERENCE_MEDIA_MAX_BYTES,
    validVideoRejectedOnlyForFileSize: false,
    browserWholeFileBufferingAllowed: false,
    browserRequiredForCompletion: false,
    fixedWholeStudyTimeoutApplied: false,
    originalChecksumUnchanged: true,
    providerCallMade: false,
    customerPriceCalculated: false,
    customerCreditsMutated: false,
    productionReady: false,
  }))
} finally {
  await rm(root, { recursive: true, force: true })
}

async function materializeSparseSixHourVideo(input: {
  readonly ffmpegBin: string
  readonly outputPath: string
}): Promise<void> {
  await execFileAsync(input.ffmpegBin, [
    '-hide_banner',
    '-loglevel', 'error',
    '-f', 'lavfi',
    '-i', `color=c=black:s=64x64:r=1/10:d=${SIX_HOURS_SECONDS}`,
    '-an',
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    input.outputPath,
  ], {
    timeout: 60_000,
    maxBuffer: 64 * 1024,
    windowsHide: true,
  })
}

function createContext(localStorageRoot: string): ServiceContext {
  return {
    env: loadRuntimeEnv({
      NODE_ENV: 'test',
      E2E_RUNTIME_MODE: 'local',
      API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
      API_PORT: '8787',
      STORAGE_MODE: 'local',
      LOCAL_STORAGE_ROOT: localStorageRoot,
      SIGNED_URL_TTL_SECONDS: '900',
      SUPABASE_URL: '',
      SUPABASE_SERVICE_ROLE_KEY: '',
    }),
    clients: { admin: null, public: null },
    requestId: 'edit-reference-multi-hour-source-admission-smoke',
    auth: { userId: 'user-six-hour-edit-reference', isMockUser: true },
  }
}

function sha256(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}
