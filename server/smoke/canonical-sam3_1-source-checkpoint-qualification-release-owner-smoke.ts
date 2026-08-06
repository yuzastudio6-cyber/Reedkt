import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  assertCanonicalSam31QualificationRelease,
  createCanonicalSam31QualificationReleaseObjectReadPort,
  createCanonicalSam31QualificationReleaseOwner,
  sealCanonicalSam31QualificationSecurityClearance,
  type CanonicalSam31QualificationReleaseReadPort,
  type CanonicalSam31QualificationSecurityClearance,
} from '../services/canonical-sam3_1-source-checkpoint-qualification-release-owner'
import {
  candidate,
  canonicalIngest,
} from './canonical-sam3_1-source-checkpoint-qualification-smoke'
import {
  attemptId,
  succeeded,
  workerRequest,
} from './canonical-sam3_1-source-checkpoint-qualification-a100-phase-smoke'
import { evidence as resultEvidence } from
  './canonical-sam3_1-source-checkpoint-qualification-result-owner-smoke'
import { terminalEvidence } from
  './canonical-sam3_1-source-checkpoint-qualification-terminal-evidence-owner-smoke'

const workerRequestRef = ref(
  workerRequest.qualificationId,
  workerRequest.requestHash,
)
const resultEvidenceRef = ref(attemptId, resultEvidence.evidenceHash)
const terminalEvidenceRef = ref(attemptId, terminalEvidence.evidenceHash)
export const clearance = createClearance()
const clearanceRef = ref(clearance.clearanceId, clearance.clearanceHash)
const store = createObjectPort()
const owner = createOwner({}, store.port)

export const release = await owner.compileAndPersist({
  qualificationId: workerRequest.qualificationId,
  workerRequestRef,
  resultEvidenceRef,
  terminalEvidenceRef,
  securityComplianceClearanceRef: clearanceRef,
})
assertCanonicalSam31QualificationRelease(release)
assert.equal(release.status, 'qualified_for_private_image_build')
assert.equal(release.sourceCheckpointQualificationGranted, true)
assert.equal(release.privateImageBuildReviewEligible, true)
assert.equal(release.qualification.status, 'qualified_for_private_image_build')
assert.equal(
  release.qualification.controlledObservation.compatibilityProbe
    .actualCudaModelInferenceExecuted,
  true,
)
assert.equal(release.terminalScaleToZeroVerified, true)
assert.equal(release.imageBuildStarted, false)
assert.equal(release.runtimeReleaseGranted, false)
assert.equal(release.customerMediaProcessed, false)
assert.equal(release.customerCreditsMutated, false)
assert.equal(release.customerBillingAuthorityGranted, false)
assert.equal(release.qaApproved, false)
assert.equal(release.publicDeliveryAuthorized, false)
assert.equal(release.productionReady, false)
assert.equal(store.records.size, 1)

const releaseReadPort = createCanonicalSam31QualificationReleaseObjectReadPort({
  objectPort: store.port,
})
assert.deepEqual(
  await releaseReadPort.rereadQualificationRelease({
    sourceCheckpointQualificationRef:
      release.sourceCheckpointQualificationRef,
  }),
  release,
)
assert.equal(
  await releaseReadPort.rereadQualificationRelease({
    sourceCheckpointQualificationRef: {
      ...release.sourceCheckpointQualificationRef,
      id: 'missing-sam31-source-checkpoint-qualification',
    },
  }),
  null,
)
await assert.rejects(releaseReadPort.rereadQualificationRelease({
  sourceCheckpointQualificationRef: {
    ...release.sourceCheckpointQualificationRef,
    contentHash: `sha256:${'0'.repeat(64)}`,
  },
}))

const replay = await owner.compileAndPersist({
  qualificationId: workerRequest.qualificationId,
  workerRequestRef,
  resultEvidenceRef,
  terminalEvidenceRef,
  securityComplianceClearanceRef: clearanceRef,
})
assert.deepEqual(replay, release)
assert.equal(store.records.size, 1)

const expired = createClearance({
  validUntil: '2026-08-04T18:21:30.000Z',
})
await refuses({ clearance: expired })

const crossedRequestClearance = createClearance({
  workerRequestRef: ref('crossed-worker-request', digest('crossed')),
})
await refuses({ clearance: crossedRequestClearance })

const falseDecision = structuredClone(clearance)
falseDecision.decisions.sourceMalwareScanPassed = false as never
await refuses({ clearance: falseDecision })

const wrongHash = structuredClone(clearance)
wrongHash.clearanceHash = digest('wrong-clearance-hash')
await refuses({ clearance: wrongHash })

const activeGpu = structuredClone(terminalEvidence)
activeGpu.activeGpuResourcesAfterTerminalObservation = 1 as never
await refuses({ terminal: activeGpu })

const crossedJob = structuredClone(succeeded)
crossedJob.attemptId = 'crossed-attempt'
await refuses({ job: crossedJob })

const crossedCandidate = structuredClone(candidate)
crossedCandidate.candidateHash = digest('crossed-candidate')
await refuses({ candidate: crossedCandidate })

await assert.rejects(owner.compileAndPersist({
  qualificationId: workerRequest.qualificationId,
  workerRequestRef: ref('wrong-request', digest('wrong-request')),
  resultEvidenceRef,
  terminalEvidenceRef,
  securityComplianceClearanceRef: clearanceRef,
}))

await assert.rejects(createOwner({ missing: 'result' })
  .compileAndPersist({
    qualificationId: workerRequest.qualificationId,
    workerRequestRef,
    resultEvidenceRef,
    terminalEvidenceRef,
    securityComplianceClearanceRef: clearanceRef,
  }))

await assert.rejects(owner.compileAndPersist({
  qualificationId: workerRequest.qualificationId,
  workerRequestRef,
  resultEvidenceRef,
  terminalEvidenceRef,
  securityComplianceClearanceRef: clearanceRef,
  callerApproved: true,
} as never))

const cyclic: Record<string, unknown> = {
  qualificationId: workerRequest.qualificationId,
  workerRequestRef,
  resultEvidenceRef,
  terminalEvidenceRef,
  securityComplianceClearanceRef: clearanceRef,
}
cyclic.self = cyclic
await assert.rejects(owner.compileAndPersist(cyclic as never))

let getterInvoked = false
const accessorRequest = {
  qualificationId: workerRequest.qualificationId,
  workerRequestRef,
  resultEvidenceRef,
  terminalEvidenceRef,
  securityComplianceClearanceRef: clearanceRef,
}
Object.defineProperty(accessorRequest, 'hidden', {
  enumerable: true,
  get() {
    getterInvoked = true
    return true
  },
})
await assert.rejects(owner.compileAndPersist(accessorRequest))
assert.equal(getterInvoked, false)

const sourceText = readFileSync(new URL(
  '../services/canonical-sam3_1-source-checkpoint-qualification-release-owner.ts',
  import.meta.url,
), 'utf8')
assert.match(sourceText, /rereadSecurityComplianceClearance/u)
assert.match(sourceText, /activeGpuResourcesAfterTerminalObservation !== 0/u)
assert.match(sourceText, /configuredAutomaticRetryCount !== 0/u)
assert.match(sourceText, /unsafeCheckpointGlobalCount !== 0/u)
assert.match(sourceText, /runtimeReleaseGranted: false/u)
assert.match(sourceText, /customerCreditsMutated: false/u)
assert.doesNotMatch(sourceText, /fetch\(|GoogleAuth|new Storage/u)

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-source-checkpoint-qualification-release-owner',
  checks: 42,
  exactCanonicalRereads: true,
  exactQualificationReleaseReread: true,
  authenticatedSecurityComplianceClearanceRequired: true,
  deterministicA100CompatibilityProbeVerified: true,
  terminalScaleToZeroVerified: true,
  privateImageBuildReviewEligible: true,
  imageBuildStarted: false,
  runtimeReleaseGranted: false,
  customerCreditsMutated: false,
  productionReady: false,
}))

async function refuses(overrides: ReadOverrides) {
  await assert.rejects(createOwner(overrides).compileAndPersist({
    qualificationId: workerRequest.qualificationId,
    workerRequestRef,
    resultEvidenceRef,
    terminalEvidenceRef,
    securityComplianceClearanceRef: ref(
      (overrides.clearance ?? clearance).clearanceId,
      (overrides.clearance ?? clearance).clearanceHash,
    ),
  }))
}

type ReadOverrides = {
  candidate?: unknown
  ingest?: unknown
  request?: unknown
  result?: unknown
  terminal?: unknown
  job?: unknown
  clearance?: CanonicalSam31QualificationSecurityClearance
  missing?: 'candidate' | 'ingest' | 'request' | 'result' | 'terminal'
    | 'job' | 'clearance'
}

function createOwner(
  overrides: ReadOverrides = {},
  objectPort = createObjectPort().port,
) {
  const missing = (kind: ReadOverrides['missing'], value: unknown) =>
    overrides.missing === kind ? null : structuredClone(value)
  const readPort: CanonicalSam31QualificationReleaseReadPort = {
    async rereadWorkerRequest() {
      return missing('request', overrides.request ?? workerRequest)
    },
    async rereadCandidate() {
      return missing('candidate', overrides.candidate ?? candidate)
    },
    async rereadIngestReceipt() {
      return missing('ingest', overrides.ingest ?? canonicalIngest)
    },
    async rereadResultEvidence() {
      return missing('result', overrides.result ?? resultEvidence)
    },
    async rereadTerminalEvidence() {
      return missing('terminal', overrides.terminal ?? terminalEvidence)
    },
    async rereadTerminalJobObservation() {
      return missing('job', overrides.job ?? succeeded)
    },
    async rereadSecurityComplianceClearance() {
      return missing('clearance', overrides.clearance ?? clearance)
    },
  }
  return createCanonicalSam31QualificationReleaseOwner({
    readPort,
    releaseObjectPort: objectPort,
    now: () => '2026-08-04T18:22:00.000Z',
  })
}

function createClearance(overrides?: {
  validUntil?: string
  workerRequestRef?: ReturnType<typeof ref>
}) {
  return sealCanonicalSam31QualificationSecurityClearance({
    schemaVersion:
      'canonical-sam3_1-source-checkpoint-security-compliance-clearance-v1',
    source: 'canonical_sam3_1_security_legal_privacy_compliance_owner',
    evidenceClass: 'canonical_private_reread',
    clearanceId: 'sam31-source-checkpoint-security-clearance-1',
    clearanceVersion: 1,
    qualificationId: workerRequest.qualificationId,
    candidateRef: workerRequest.candidateRef,
    ingestReceiptRef: ref(
      canonicalIngest.ingestReceiptId,
      canonicalIngest.ingestReceiptHash,
    ),
    workerRequestRef: overrides?.workerRequestRef ?? workerRequestRef,
    termsAcceptanceRef: canonicalIngest.termsAcceptanceRef,
    reviewedEvidenceRefs: {
      legalReviewRef: ref('sam31-legal-review', digest('legal')),
      privacyReviewRef: ref('sam31-privacy-review', digest('privacy')),
      tradeControlsReviewRef: ref('sam31-trade-review', digest('trade')),
      sourceLicenseReviewRef: canonicalIngest.sourceArchive.licenseRef,
      checkpointLicenseReviewRef: canonicalIngest.checkpoint.licenseRef,
      sourceMalwareScanRef: canonicalIngest.sourceArchive.malwareScanRef,
      checkpointMalwareScanRef: canonicalIngest.checkpoint.malwareScanRef,
      sourceIngestSecurityReviewRef:
        canonicalIngest.sourceArchive.securityReviewRef,
      checkpointIngestSecurityReviewRef:
        canonicalIngest.checkpoint.securityReviewRef,
      sourceCodeStaticSecurityReviewRef:
        workerRequest.sourceCodeSecurityReviewRef,
      unsignedSourceRevisionAcceptanceRef:
        canonicalIngest.sourceArchive.unsignedSourceRevisionAcceptanceRef,
      checkpointWeightsOnlyInspectionRef:
        workerRequest.checkpoint.weightsOnlyInspectionRef,
    },
    decisions: {
      sourceLicenseReviewedForApprovedUse: true,
      checkpointLicenseReviewedForApprovedUse: true,
      privacyReviewApprovedForPrivateQualification: true,
      tradeControlsReviewApprovedForPrivateQualification: true,
      sourceMalwareScanPassed: true,
      checkpointMalwareScanPassed: true,
      sourceStaticSecurityReviewPassed: true,
      checkpointStaticSecurityReviewPassed: true,
      unsignedSourceRevisionAccepted: true,
      noOpenHighOrCriticalSecurityFinding: true,
      checkpointWeightsOnlyResultMustBeCorroboratedByWorker: true,
      checkpointTensorAllowlistMustBeCorroboratedByWorker: true,
      executablePickleTrustGranted: false,
      checkpointRedistributionAuthorized: false,
    },
    authority: {
      authenticatedReviewOwnersReread: true,
      privateSourceCheckpointQualificationOnly: true,
      customerMediaProcessingAuthorized: false,
      runtimeImageReleaseAuthorized: false,
      customerCreditsMutated: false,
      customerBillingAuthorityGranted: false,
      qaApproved: false,
      publicDeliveryAuthorized: false,
      productionReady: false,
    },
    approvedAt: '2026-08-04T18:21:00.000Z',
    validUntil: overrides?.validUntil ?? '2026-09-04T18:21:00.000Z',
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
            throw new Error('controlled qualification release collision')
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

function ref(id: string, hash: string) {
  return {
    id,
    version: 1 as const,
    contentHash: `sha256:${hash}` as const,
  }
}

function digest(value: string | Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}
