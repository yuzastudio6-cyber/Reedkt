import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

import {
  sealCanonicalSam31SourceCheckpointQualificationWorkerResult,
} from '../model-artifacts/canonical-sam3_1-source-checkpoint-qualification'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  assertCanonicalSam31QualificationResultEvidence,
  CANONICAL_SAM3_1_QUALIFICATION_GCS_RESULT_PORT_VERSION,
  createCanonicalSam31QualificationResultOwner,
  type CanonicalSam31QualificationPrivateResultObjectPort,
} from '../services/canonical-sam3_1-source-checkpoint-qualification-result-owner'
import { stableAuthorityStringify } from
  '../services/private-edit-authority-store'
import {
  attemptId,
  mount,
  submission,
  succeeded,
  workerRequest,
} from './canonical-sam3_1-source-checkpoint-qualification-a100-phase-smoke'

export const result = createResult()
const body = Buffer.from(stableAuthorityStringify(result), 'utf8')
const objectStore = createObjectPort()
const resultPort = createResultPort()
const owner = createCanonicalSam31QualificationResultOwner({
  resultObjectPort: resultPort,
  evidenceObjectPort: objectStore.port,
  now: () => '2026-08-04T18:10:00.000Z',
})
export const evidence = await owner.rereadAndPersist({
  attemptId,
  workerRequest,
  mountObservation: mount,
  submission,
  terminalJobObservation: succeeded,
})
assertCanonicalSam31QualificationResultEvidence(evidence)
assert.equal(evidence.workerResultRef.contentHash,
  `sha256:${result.resultHash}`)
assert.equal(evidence.resultObject.contentSha256, digest(body))
assert.equal(evidence.exactFourObjectAttemptSetReread, true)
assert.equal(evidence.batchJobSucceededBeforeResultRead, true)
assert.equal(evidence.sourceCheckpointQualificationGranted, false)
assert.equal(evidence.runtimeReleaseGranted, false)
assert.equal(evidence.customerCreditsMutated, false)
assert.equal(evidence.productionReady, false)
assert.equal(objectStore.records.size, 1)

const replay = await owner.rereadAndPersist({
  attemptId,
  workerRequest,
  mountObservation: mount,
  submission,
  terminalJobObservation: succeeded,
})
assert.deepEqual(replay, evidence)
assert.equal(objectStore.records.size, 1)

await rejects({ missing: true })
await rejects({ wrongKms: true })
await rejects({ wrongSha: true })
await rejects({ wrongLength: true })
await rejects({ extraObject: true })
await rejects({ missingInput: true })
await rejects({ reorderedObjects: true })

const failedTerminal = structuredClone(succeeded)
failedTerminal.disposition = 'job_failed'
failedTerminal.batchState = 'FAILED'
failedTerminal.observationHash = hashWithout(failedTerminal, 'observationHash')
await assert.rejects(owner.rereadAndPersist({
  attemptId,
  workerRequest,
  mountObservation: mount,
  submission,
  terminalJobObservation: failedTerminal,
}))

const tamperedResult = structuredClone(result)
tamperedResult.actualCudaModelInferenceExecuted = false as never
const tamperedBody = Buffer.from(stableAuthorityStringify(tamperedResult))
await assert.rejects(createOwner(createResultPort({ body: tamperedBody }))
  .rereadAndPersist({
    attemptId,
    workerRequest,
    mountObservation: mount,
    submission,
    terminalJobObservation: succeeded,
  }))

const sourceText = readFileSync(new URL(
  '../services/canonical-sam3_1-source-checkpoint-qualification-result-owner.ts',
  import.meta.url,
), 'utf8')
assert.match(sourceText, /generation: generationValue/u)
assert.match(sourceText, /download\(\{ validation: 'crc32c' \}\)/u)
assert.match(sourceText, /maxResults: 5/u)
assert.match(sourceText, /String\(stable\.kmsKeyName \?\? ''\) !== KMS_KEY/u)
assert.doesNotMatch(sourceText,
  /\.getSignedUrl\(|\.makePublic\(|predefinedAcl:\s*['"]publicRead/u)

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-source-checkpoint-qualification-result-owner',
  checks: 31,
  exactResultReread: true,
  exactAttemptObjectSet: true,
  createOnlyEvidenceRecords: objectStore.records.size,
  actualCudaResultStructurallyVerified: true,
  sourceCheckpointQualificationGranted: false,
  internalUsageCostLogRereadPending: true,
  customerCreditsMutated: false,
  productionReady: false,
}))

function createOwner(port: CanonicalSam31QualificationPrivateResultObjectPort) {
  return createCanonicalSam31QualificationResultOwner({
    resultObjectPort: port,
    evidenceObjectPort: createObjectPort().port,
    now: () => '2026-08-04T18:10:00.000Z',
  })
}

async function rejects(options: Parameters<typeof createResultPort>[0]) {
  await assert.rejects(createOwner(createResultPort(options))
    .rereadAndPersist({
      attemptId,
      workerRequest,
      mountObservation: mount,
      submission,
      terminalJobObservation: succeeded,
    }))
}

function createResultPort(options?: {
  missing?: boolean
  wrongKms?: boolean
  wrongSha?: boolean
  wrongLength?: boolean
  extraObject?: boolean
  missingInput?: boolean
  reorderedObjects?: boolean
  body?: Buffer
}): CanonicalSam31QualificationPrivateResultObjectPort {
  return {
    schemaVersion: CANONICAL_SAM3_1_QUALIFICATION_GCS_RESULT_PORT_VERSION,
    async rereadExactResult() {
      if (options?.missing) return null
      const selectedBody = options?.body ?? body
      const names = [
        `${mount.attemptRemoteSubdirectory}/checkpoint/sam3.1_multiplex.pt`,
        `${mount.attemptRemoteSubdirectory}/fixture/probe-person.mp4`,
        `${mount.attemptRemoteSubdirectory}/request/request.json`,
        `${mount.attemptRemoteSubdirectory}/result/result.json`,
      ]
      if (options?.extraObject) {
        names.push(`${mount.attemptRemoteSubdirectory}/unexpected.bin`)
      }
      if (options?.missingInput) names.shift()
      names.sort(utf16LexicalCompare)
      if (options?.reorderedObjects) names.reverse()
      return {
        object: {
          bucketName: 'reeditpro-production-sam31-qualification-private',
          objectName:
            `${mount.attemptRemoteSubdirectory}/result/result.json`,
          generation: '301',
          metageneration: '1',
          etag: 'result-etag',
          byteLength: options?.wrongLength
            ? selectedBody.byteLength + 1 : selectedBody.byteLength,
          contentType: 'application/octet-stream',
          kmsKeyName: (options?.wrongKms
            ? 'projects/reeditpro/locations/us-central1/keyRings/wrong/cryptoKeys/wrong'
            : 'projects/reeditpro/locations/us-central1/keyRings/weeditpro-private-artifacts/cryptoKeys/sam31-qualification') as never,
          contentSha256: options?.wrongSha
            ? digest(Buffer.from('wrong')) : digest(selectedBody),
        },
        body: Buffer.from(selectedBody),
        attemptObjectNames: names,
      }
    },
  }
}

function createResult() {
  const keySetHash = digest(Buffer.from('sam31-checkpoint-key-set'))
  const outputHash = digest(Buffer.from('sam31-deterministic-output'))
  return sealCanonicalSam31SourceCheckpointQualificationWorkerResult({
    schemaVersion:
      'canonical-sam3_1-source-checkpoint-qualification-worker-result-v1',
    source: 'fixed_sam3_1_a100_source_checkpoint_qualification_worker',
    evidenceClass: 'canonical_private_reread',
    qualificationId: workerRequest.qualificationId,
    qualificationVersion: 1,
    operationId: workerRequest.operationId,
    requestRef: {
      id: workerRequest.qualificationId,
      version: 1,
      schemaVersion: workerRequest.schemaVersion,
      contentHash: `sha256:${workerRequest.requestHash}`,
    },
    candidateRef: workerRequest.candidateRef,
    ingestReceiptRef: workerRequest.ingestReceiptRef,
    qualificationImage: {
      artifactRef: workerRequest.qualificationImage.artifactRef,
      immutableImageDigest:
        workerRequest.qualificationImage.immutableImageDigest,
      supplyChainReleaseRef:
        workerRequest.qualificationImage.supplyChainReleaseRef,
    },
    artifactVerification: {
      exactSourceArchiveReread: true,
      exactPatchedSourceArchiveReread: true,
      exactCheckpointRereadBeforeAndAfter: true,
      exactDependencyWheelAndNativeClosureReread: true,
      sourcePatchApplicationReceiptReread: true,
      deterministicProbeFixtureReread: true,
      weightsOnlyCheckpointInspectionExecuted: true,
      unsafeCheckpointGlobalCount: 0,
    },
    runtime: {
      executionTarget: 'google_cloud_batch_a2_ultra_job',
      machineType: 'a2-ultragpu-1g',
      accelerator: 'nvidia_a100_80gb',
      allocatedGpuCount: 1,
      observedGpuName: 'NVIDIA A100-SXM4-80GB',
      observedGpuTotalMemoryBytes: 85_899_345_920,
      baseImageDigest:
        'sha256:b85566342b86d13a67712e9315d40cdc2dad7f8d86df1aff3831f80835edbcca',
      pythonVersion: '3.12',
      torchVersion: '2.10.0+cu128',
      torchvisionVersion: '0.25.0',
      torchcodecVersion: '0.10.0',
      torchcodecCudaWheelVersion: '0.10.0+cu128',
      ffmpegVersion: '8.0.3',
      ffmpegNvdecAndCuvidAvailable: true,
      gpuVideoDecodeBackendStatusVerified: true,
      cpuVideoDecodeFallbackObserved: false,
      cudaVersion: '12.8',
      fixedBuilder: 'build_sam3_multiplex_video_predictor',
      networkEgressObserved: false,
      developerMachineExecutionObserved: false,
      cpuOnlyModelExecutionObserved: false,
      quantizationOrResolutionReductionUsed: false,
      providerInferenceExecuted: false,
      bfloat16AutocastExecuted: true,
    },
    strictLoad: {
      fixedBuilderImportedFromPinnedSource: true,
      fixedBuilderCalledExactlyOnce: true,
      checkpointLoadedExactlyOnce: true,
      strictCheckpointLoadRequested: true,
      missingCheckpointKeyCount: 0,
      unexpectedCheckpointKeyCount: 0,
      checkpointKeyCount: 257,
      modelStateKeyCount: 257,
      checkpointKeySetSha256: keySetHash,
      modelStateKeySetSha256: keySetHash,
      checkpointAndModelKeySetsExact: true,
    },
    deterministicRuns: [1, 2, 3].map((runOrdinal) => ({
      runOrdinal,
      sessionStarted: true,
      promptAdded: true,
      completeForwardPropagationExecuted: true,
      sessionClosed: true,
      emittedFrameCount: workerRequest.deterministicProbeFixture.frameCount,
      emittedObjectCount: 1,
      outputMaskShapeMatchedProbeFrames: true,
      outputObjectIdsMatchedProbePrompt: true,
      outputMasksWereCudaTensorsBeforeDigest: true,
      outputDigestSha256: outputHash,
      wallTimeMilliseconds: 1_000,
      cudaInferenceMilliseconds: 900,
    })) as never,
    deterministicOutputDigestSha256: outputHash,
    deterministicOutputDigestMatchedEveryRun: true,
    actualCudaModelInferenceExecuted: true,
    completedAt: '2026-08-04T18:09:00.000Z',
    authority: {
      qualificationEvidenceOnly: true,
      imageBuildStarted: false,
      productionRuntimeDispatchAuthorized: false,
      customerCreditsMutated: false,
      customerBillingAuthorityGranted: false,
      qaApproved: false,
      publicDeliveryAuthorized: false,
      productionReady: false,
    },
  })
}

function createObjectPort(): {
  port: CanonicalCreateOnlyJsonObjectPort
  records: Map<string, Buffer>
} {
  const records = new Map<string, Buffer>()
  return {
    records,
    port: {
      async createOnly(input) {
        const prior = records.get(input.objectPath)
        if (prior) {
          if (digest(prior) !== input.contentSha256) {
            throw new Error('controlled result evidence collision')
          }
          return 'already_exists'
        }
        records.set(input.objectPath, Buffer.from(input.body))
        return 'created'
      },
      async readExact(path) {
        const value = records.get(path)
        return value ? Buffer.from(value) : null
      },
    },
  }
}

function hashWithout(value: Record<string, unknown>, key: string): string {
  const clone = structuredClone(value)
  delete clone[key]
  return createHash('sha256')
    .update(stableAuthorityStringify(clone)).digest('hex')
}

function digest(value: Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}

function utf16LexicalCompare(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}
