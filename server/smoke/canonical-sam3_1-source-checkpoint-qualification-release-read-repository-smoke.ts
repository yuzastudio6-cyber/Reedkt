import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import type {
  CanonicalSam31QualificationA100StatePort,
} from '../services/canonical-sam3_1-source-checkpoint-qualification-a100-phase'
import {
  CANONICAL_SAM3_1_QUALIFICATION_PACKAGE_REPOSITORY_VERSION,
  type CanonicalSam31QualificationPackageRepository,
} from '../services/canonical-sam3_1-source-checkpoint-qualification-package-repository'
import {
  CANONICAL_SAM3_1_QUALIFICATION_RELEASE_READ_REPOSITORY_VERSION,
  createCanonicalSam31QualificationReleaseReadRepository,
} from '../services/canonical-sam3_1-source-checkpoint-qualification-release-read-repository'
import { sha256AuthorityValue, stableAuthorityStringify } from
  '../services/private-edit-authority-store'
import { candidate, canonicalIngest } from
  './canonical-sam3_1-source-checkpoint-qualification-smoke'
import { attemptId, succeeded, workerRequest } from
  './canonical-sam3_1-source-checkpoint-qualification-a100-phase-smoke'
import { evidence as resultEvidence } from
  './canonical-sam3_1-source-checkpoint-qualification-result-owner-smoke'
import { clearance, release } from
  './canonical-sam3_1-source-checkpoint-qualification-release-owner-smoke'
import { terminalEvidence } from
  './canonical-sam3_1-source-checkpoint-qualification-terminal-evidence-owner-smoke'

const ROOT = 'private/sam3_1/source-checkpoint-qualification/v1'
const store = memoryObjectPort()
writeRecord('results', attemptId, resultEvidence)
writeRecord('terminals', attemptId, terminalEvidence)
writeRecord('releases', workerRequest.qualificationId, release)
const packageRepository: CanonicalSam31QualificationPackageRepository = {
  schemaVersion: CANONICAL_SAM3_1_QUALIFICATION_PACKAGE_REPOSITORY_VERSION,
  evidenceClass: 'private_create_only_exact_reread',
  async persistQualificationPackageCreateOnly() {
    throw new Error('controlled package persistence must not be reached')
  },
  async rereadExactWorkerRequest(input) {
    return sameRef(input.workerRequestRef, ref(
      workerRequest.qualificationId,
      workerRequest.requestHash,
    )) ? structuredClone(workerRequest) : null
  },
  async rereadExactSources() {
    throw new Error('controlled staging source read must not be reached')
  },
  async rereadExactIngestReceipt(input) {
    return sameRef(input.ingestReceiptRef, ref(
      canonicalIngest.ingestReceiptId,
      canonicalIngest.ingestReceiptHash,
    )) ? structuredClone(canonicalIngest) : null
  },
}
const statePort: CanonicalSam31QualificationA100StatePort = {
  async consumeAdmissionCreateOnly() { throw new Error('controlled') },
  async rereadAdmission() { return null },
  async persistSubmissionCreateOnly() { throw new Error('controlled') },
  async rereadSubmission() { return null },
  async persistTerminalObservationCreateOnly() {
    throw new Error('controlled')
  },
  async rereadTerminalObservation(input) {
    return input.attemptId === attemptId
      ? structuredClone(succeeded)
      : null
  },
}
const repository = createCanonicalSam31QualificationReleaseReadRepository({
  objectPort: store.port,
  packageRepository,
  statePort,
  authenticatedSecurityClearanceReadPort: {
    async rereadAuthenticatedSecurityComplianceClearance(input) {
      return sameRef(input.clearanceRef, ref(
        clearance.clearanceId,
        clearance.clearanceHash,
      )) ? structuredClone(clearance) : null
    },
  },
})

assert.equal(
  repository.schemaVersion,
  CANONICAL_SAM3_1_QUALIFICATION_RELEASE_READ_REPOSITORY_VERSION,
)
assert.equal(repository.evidenceClass, 'private_create_only_exact_reread')
assert.deepEqual(await repository.rereadWorkerRequest({
  ref: ref(workerRequest.qualificationId, workerRequest.requestHash),
}), workerRequest)
assert.deepEqual(await repository.rereadCandidate({
  ref: workerRequest.candidateRef,
}), candidate)
assert.deepEqual(await repository.rereadIngestReceipt({
  ref: ref(canonicalIngest.ingestReceiptId,
    canonicalIngest.ingestReceiptHash),
}), canonicalIngest)
assert.deepEqual(await repository.rereadResultEvidence({
  ref: ref(attemptId, resultEvidence.evidenceHash),
}), resultEvidence)
assert.deepEqual(await repository.rereadTerminalEvidence({
  ref: ref(attemptId, terminalEvidence.evidenceHash),
}), terminalEvidence)
assert.deepEqual(await repository.rereadTerminalJobObservation({
  ref: ref(attemptId, succeeded.observationHash),
}), succeeded)

const persistedClearance =
  await repository.importAuthenticatedSecurityComplianceClearanceCreateOnly({
    clearanceRef: ref(clearance.clearanceId, clearance.clearanceHash),
  })
assert.equal(persistedClearance.disposition, 'created')
assert.equal(persistedClearance.sourceCheckpointQualificationGranted, false)
assert.equal(persistedClearance.runtimeReleaseGranted, false)
assert.equal(persistedClearance.customerCreditsMutated, false)
assert.equal(persistedClearance.productionReady, false)
assert.deepEqual(await repository.rereadSecurityComplianceClearance({
  ref: persistedClearance.clearanceRef,
}), clearance)
const clearanceReplay =
  await repository.importAuthenticatedSecurityComplianceClearanceCreateOnly({
    clearanceRef: ref(clearance.clearanceId, clearance.clearanceHash),
  })
assert.equal(clearanceReplay.disposition, 'identical_replay')
assert.deepEqual(clearanceReplay.clearanceRef, persistedClearance.clearanceRef)

assert.deepEqual(await repository.rereadQualificationRelease({
  sourceCheckpointQualificationRef:
    release.sourceCheckpointQualificationRef,
}), release)
assert.equal(await repository.rereadResultEvidence({
  ref: ref('missing-attempt', digest('missing-result')),
}), null)
assert.equal(await repository.rereadTerminalEvidence({
  ref: ref('missing-attempt', digest('missing-terminal')),
}), null)
assert.equal(await repository.rereadSecurityComplianceClearance({
  ref: ref('missing-clearance', digest('missing-clearance')),
}), null)
assert.equal(await repository.rereadTerminalJobObservation({
  ref: ref('missing-attempt', digest('missing-terminal-job')),
}), null)

await assert.rejects(repository.rereadResultEvidence({
  ref: ref(attemptId, digest('crossed-result')),
}))
await assert.rejects(repository.rereadTerminalEvidence({
  ref: ref(attemptId, digest('crossed-terminal')),
}))
await assert.rejects(repository.rereadTerminalJobObservation({
  ref: ref(attemptId, digest('crossed-terminal-job')),
}))
await assert.rejects(repository.rereadSecurityComplianceClearance({
  ref: ref(clearance.clearanceId, digest('crossed-clearance')),
}))
await assert.rejects(repository.rereadCandidate({
  ref: {
    ...workerRequest.candidateRef,
    candidateHash: digest('crossed-candidate'),
  },
}))
await assert.rejects(repository.rereadQualificationRelease({
  sourceCheckpointQualificationRef: {
    ...release.sourceCheckpointQualificationRef,
    contentHash: `sha256:${digest('crossed-release')}`,
  },
}))
await assert.rejects(
  repository.importAuthenticatedSecurityComplianceClearanceCreateOnly({
    clearanceRef: ref(clearance.clearanceId, clearance.clearanceHash),
    injectedClearance: clearance,
  } as never),
)

const clearanceObjectPath = `${ROOT}/security-clearances/${
  sha256AuthorityValue(clearance.clearanceId)
}.json`
const canonicalClearanceBody = store.records.get(clearanceObjectPath)
assert(canonicalClearanceBody)
const tamperedClearance = structuredClone(clearance)
tamperedClearance.authority.productionReady = true as never
store.records.set(clearanceObjectPath,
  Buffer.from(stableAuthorityStringify(tamperedClearance)))
await assert.rejects(repository.rereadSecurityComplianceClearance({
  ref: persistedClearance.clearanceRef,
}))
store.records.set(clearanceObjectPath, canonicalClearanceBody)

console.log(JSON.stringify({
  smoke:
    'canonical-sam3_1-source-checkpoint-qualification-release-read-repository',
  checks: 36,
  durableWorkerRequestReread: true,
  durableCandidateReread: true,
  durableIngestReceiptReread: true,
  durableResultAndTerminalReread: true,
  durableTerminalJobReread: true,
  securityClearanceAuthorityCreatedByRepository: false,
  authenticatedSecurityClearanceImportCreateOnlyAndExactReread: true,
  qualificationReleaseExactReread: true,
  callerAuthorityAccepted: false,
  sourceCheckpointQualificationGranted: false,
  runtimeReleaseGranted: false,
  customerCreditsMutated: false,
  productionReady: false,
}, null, 2))

function writeRecord(
  kind: 'results' | 'terminals' | 'releases',
  id: string,
  value: unknown,
): void {
  const path = `${ROOT}/${kind}/${sha256AuthorityValue(id)}.json`
  store.records.set(path, Buffer.from(stableAuthorityStringify(value)))
}

function memoryObjectPort(): {
  readonly records: Map<string, Buffer>
  readonly port: CanonicalCreateOnlyJsonObjectPort
} {
  const records = new Map<string, Buffer>()
  return {
    records,
    port: {
      async createOnly(input) {
        const existing = records.get(input.objectPath)
        if (existing) {
          if (digest(existing) !== input.contentSha256) {
            throw new Error('controlled create-only collision')
          }
          return 'already_exists'
        }
        records.set(input.objectPath, Buffer.from(input.body))
        return 'created'
      },
      async readExact(objectPath) {
        const value = records.get(objectPath)
        return value ? Buffer.from(value) : null
      },
    },
  }
}

function ref(id: string, hash: string) {
  return {
    id,
    version: 1 as const,
    contentHash: `sha256:${hash}` as const,
  }
}

function sameRef(
  left: { id: string; version: number; contentHash: string },
  right: { id: string; version: number; contentHash: string },
): boolean {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}

function digest(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}
