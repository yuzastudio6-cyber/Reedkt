import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { gzipSync } from 'node:zlib'

import {
  createCanonicalSam31AuthorizedTermsAcceptance,
  prepareCanonicalSam31PrivateArtifactIngestReceipt,
} from '../model-artifacts/canonical-sam3_1-private-artifact-ingest'
import {
  assertCanonicalSam31QualificationImageBuildAuthority,
  createCanonicalSam31QualificationImageCapsuleManifest,
  prepareCanonicalSam31QualificationImageBuildAuthority,
} from '../model-artifacts/canonical-sam3_1-qualification-image-build-authority'
import {
  createCanonicalSam31SourceRuntimeCandidate,
} from '../model-artifacts/canonical-sam3_1-source-runtime-candidate'
import {
  assertCanonicalSam31QualificationImageBuildSubmission,
  assertCanonicalSam31QualificationImageBuildTerminal,
  compileCanonicalSam31QualificationImageBuildRequestBody,
  createCanonicalSam31QualificationImageBuildPhase,
  type CanonicalSam31QualificationImageBuildStatePort,
} from '../services/canonical-sam3_1-qualification-image-build-phase'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  assertCanonicalSam31QualificationImageBuildReconciliation,
  assertCanonicalSam31QualificationImageBuildReconciledTerminal,
  canonicalSam31QualificationImageBuildSubmissionRef,
  createCanonicalSam31QualificationImageBuildReconciler,
  createCanonicalSam31QualificationImageBuildReconciledTerminalObserver,
} from '../services/canonical-sam3_1-qualification-image-build-reconciliation'

const candidate = createCanonicalSam31SourceRuntimeCandidate()
const syntheticIngest = await createSyntheticIngest()
const capsuleFiles = createCapsuleFiles()
const capsuleArchiveEntries = capsuleFiles.map(([path, bytes]) => ({
  path,
  byteLength: bytes.byteLength,
  sha256: sha(bytes),
}))
const capsuleBytes = createCanonicalTarGz(capsuleFiles)
const capsuleSha = sha(capsuleBytes)
const capsuleCoordinate = {
  projectId: 'reeditpro' as const,
  bucketName: 'reeditpro-production-reeditpro-image-build-inputs' as const,
  objectName:
    `private/image-build-inputs/sam3_1/qualification/${capsuleSha}.tar.gz`,
  generation: '4101',
  etag: 'sam31-qualification-image-capsule-etag-4101',
  byteLength: capsuleBytes.byteLength,
  sha256: capsuleSha,
}
const capsuleManifest =
  createCanonicalSam31QualificationImageCapsuleManifest({
    evidenceClass: 'synthetic_contract_fixture',
    status: 'contract_only',
    manifestId: 'sam31-qualification-image-capsule-manifest-1',
    manifestVersion: 1,
    operationId: candidate.operationId,
    candidateRef: {
      schemaVersion: candidate.schemaVersion,
      candidateHash: candidate.candidateHash,
    },
    ingestReceiptRef: {
      id: syntheticIngest.ingestReceiptId,
      version: syntheticIngest.ingestReceiptVersion,
      schemaVersion: syntheticIngest.schemaVersion,
      contentHash: `sha256:${syntheticIngest.ingestReceiptHash}`,
    },
    repositorySource: {
      commitSha: '1'.repeat(40),
      treeSha: '2'.repeat(40),
      sourceBundleRef: ref('sam31-qualification-source-bundle'),
      sourcePublished: false,
      sourceClean: false,
      dockerfilePath:
        'docker/prod/gpu-worker/sam3_1/Dockerfile.qualification.candidate',
      dockerfileSha256: entrySha(
        capsuleArchiveEntries,
        'docker/prod/gpu-worker/sam3_1/Dockerfile.qualification.candidate',
      ),
      runnerSha256: entrySha(
        capsuleArchiveEntries,
        'docker/prod/gpu-worker/sam3_1/qualification_runner.py',
      ),
      entrypointSha256: entrySha(
        capsuleArchiveEntries,
        'docker/prod/gpu-worker/sam3_1/qualification_entrypoint.sh',
      ),
      sourceProvenanceLockSha256: entrySha(
        capsuleArchiveEntries,
        'docker/prod/gpu-worker/sam3_1/source-provenance.lock',
      ),
      gpuDecodePatchSha256:
        'daf5dfb59dbe6809eb2731b43e13d91b1679c271f0f4af11962236ffe83eb6ca',
    },
    privateInput: {
      directoryName: 'sam31_private_build_input',
      deterministicSourceArchiveSha256:
        '5138f0e396de40a40ef0168c106e089aacbbf1dc7651be2f81c76f89c2f67f2a',
      deterministicPatchedSourceArchiveSha256:
        'b692268f0e295673d5c5cc2fc14e7813847effc5e371e32cb18c1861b4c8adfb',
      patchApplicationReceiptSha256: entrySha(
        capsuleArchiveEntries,
        'sam31_private_build_input/source/source-patch-application-receipt.json',
      ),
      dependencyLockSha256: entrySha(
        capsuleArchiveEntries,
        'sam31_private_build_input/dependency-closure/requirements.lock.txt',
      ),
      dependencyClosureReceiptSha256: entrySha(
        capsuleArchiveEntries,
        'sam31_private_build_input/dependency-closure/dependency-closure-receipt.json',
      ),
      dependencyWheelManifestSha256: sha256AuthorityValue(
        capsuleArchiveEntries.filter((entry) => entry.path.startsWith(
          'sam31_private_build_input/dependency-closure/wheelhouse/',
        )),
      ),
      dependencyWheelCount: 2,
      cudaForwardCompatPackageSha256:
        'e980bf55b8d1f6390f07968df46644c971a52f4e4129067d33d1445fac716893',
      cudaForwardCompatIngestReceiptSha256: entrySha(
        capsuleArchiveEntries,
        'sam31_private_build_input/dependency-closure/cuda-forward-compat/cuda-forward-compat-ingest-receipt.json',
      ),
      sourceCheckpointQualificationReceiptIncluded: false,
      checkpointBytesIncluded: false,
    },
    capsule: {
      coordinate: capsuleCoordinate,
      format: 'tar_gzip',
      contentType: 'application/gzip',
      storageContentType: 'application/x-tar',
      capsuleArtifactRef: contentRef(
        'sam31-qualification-build-capsule', capsuleSha,
      ),
      archiveEntries: capsuleArchiveEntries,
      archiveEntrySetSha256: sha256AuthorityValue(capsuleArchiveEntries),
      archiveEntriesReread: true,
      exactByteLengthAndSha256Reread: true,
      generationAndEtagStableBeforeAndAfterRead: true,
      prohibitedEntryScanPassed: true,
      absoluteParentTraversalSymlinkDeviceAndSocketEntriesAbsent: true,
    },
    securityBoundary: {
      qualificationImageOnly: true,
      checkpointBytesIncluded: false,
      qualificationReceiptIncluded: false,
      repositoryOrProviderTokenIncluded: false,
      privateStorageCoordinateEmbeddedInImage: false,
      callerCommandDockerfileImageTagOrBuildArgsAccepted: false,
      networkDependencyInstallRequired: false,
      buildSecretsRequired: false,
      capsuleCreateOnlyAndPrivate: true,
      reproducibilityRef: ref('sam31-qualification-capsule-reproducibility'),
      securityReviewRef: ref('sam31-qualification-capsule-security'),
      malwareScanRef: ref('sam31-qualification-capsule-malware'),
    },
    preparedAt: '2026-08-04T13:00:00.000Z',
  })

const contractAuthority =
  await prepareCanonicalSam31QualificationImageBuildAuthority({
    authorityId: 'sam31-qualification-image-build-authority-1',
    candidate,
    ingestReceipt: syntheticIngest,
    capsuleManifest,
    privateCapsuleReadPort: capsuleReadPort(
      capsuleBytes,
      capsuleCoordinate,
    ),
    preparedAt: '2026-08-04T13:01:00.000Z',
  })
assert.equal(contractAuthority.status, 'contract_only')
assert.equal(
  contractAuthority.authority.qualificationImageBuildAuthorized,
  false,
)
assert.equal(
  contractAuthority.authority.sourceCheckpointQualificationRequiredBeforeBuild,
  false,
)

const reorderedInput = cloneCapsuleManifestInput(capsuleManifest)
reorderedInput.capsule.archiveEntries = [
  ...reorderedInput.capsule.archiveEntries,
].reverse()
reorderedInput.capsule.archiveEntrySetSha256 = sha256AuthorityValue(
  reorderedInput.capsule.archiveEntries,
)
assert.throws(() => createCanonicalSam31QualificationImageCapsuleManifest(
  reorderedInput,
))

const injectedInput = cloneCapsuleManifestInput(capsuleManifest)
injectedInput.capsule.archiveEntries = [
  ...injectedInput.capsule.archiveEntries,
  {
    path: 'sam31_private_build_input/checkpoint/sam3.1_multiplex.pt',
    byteLength: 9,
    sha256: sha(Buffer.from('checkpoint')),
  },
].sort(({ path: left }, { path: right }) =>
  left < right ? -1 : left > right ? 1 : 0)
injectedInput.capsule.archiveEntrySetSha256 = sha256AuthorityValue(
  injectedInput.capsule.archiveEntries,
)
assert.throws(() => createCanonicalSam31QualificationImageCapsuleManifest(
  injectedInput,
))

const corruptedCapsule = Buffer.from(capsuleBytes)
corruptedCapsule[Math.floor(corruptedCapsule.byteLength / 2)] ^= 0xff
await assert.rejects(() =>
  prepareCanonicalSam31QualificationImageBuildAuthority({
    authorityId: 'sam31-corrupted-qualification-capsule',
    candidate,
    ingestReceipt: syntheticIngest,
    capsuleManifest,
    privateCapsuleReadPort: capsuleReadPort(
      corruptedCapsule,
      capsuleCoordinate,
    ),
    preparedAt: '2026-08-04T13:01:30.000Z',
  }))

const authority = canonicalizeBuildAuthority(contractAuthority)
const buildBody = compileCanonicalSam31QualificationImageBuildRequestBody(
  authority,
)
const serializedBuildBody = JSON.stringify(buildBody)
assert(serializedBuildBody.includes('--network=none'))
assert(serializedBuildBody.includes(
  'Dockerfile.qualification.candidate',
))
assert(serializedBuildBody.includes('SAM31_DEPENDENCY_LOCK_SHA256='))
assert(serializedBuildBody.includes(
  'SAM31_DEPENDENCY_CLOSURE_RECEIPT_SHA256=',
))
assert(serializedBuildBody.includes(
  'SAM31_DEPENDENCY_WHEEL_MANIFEST_SHA256=',
))
assert(serializedBuildBody.includes(
  'SAM31_PATCH_APPLICATION_RECEIPT_SHA256=',
))
assert(serializedBuildBody.includes(
  'SAM31_CUDA_FORWARD_COMPAT_INGEST_RECEIPT_SHA256=',
))
assert(serializedBuildBody.includes(capsuleCoordinate.generation))
assert(!serializedBuildBody.includes('sam3.1_multiplex.pt'))
assert(!serializedBuildBody.includes('source-checkpoint-qualification-receipt'))
assert(!serializedBuildBody.includes('secretEnv'))
assert(!serializedBuildBody.includes('availableSecrets'))

let cloudCalls = 0
let capturedBody: Readonly<Record<string, unknown>> | undefined
const buildId = '44444444-4444-4444-8444-444444444444'
const state = createStatePort()
const phase = createCanonicalSam31QualificationImageBuildPhase({
  authorityReadPort: {
    async rereadQualificationImageBuildAuthority() {
      return structuredClone(authority)
    },
  },
  statePort: state.port,
  authenticatedTransport: {
    async request(request) {
      cloudCalls += 1
      if (request.method === 'POST') {
        capturedBody = request.body
        return {
          status: 200,
          json: {
            name: 'operations/sam31-qualification-image-build-1',
            metadata: { build: {
              id: buildId,
              name: `projects/390722338345/locations/us-central1/builds/${buildId}`,
              projectId: 'reeditpro',
            } },
          },
        }
      }
      assert(capturedBody)
      return { status: 200, json: successBuild(
        capturedBody,
        buildId,
        authority.imageDestination.taggedUri,
      ) }
    },
  },
  now: () => '2026-08-04T13:02:00.000Z',
})

const authorityRef = buildAuthorityRef(authority)
const submission = await phase.startOneQualificationImageBuild({
  authorityRef,
})
assertCanonicalSam31QualificationImageBuildSubmission(submission)
assert.equal(submission.disposition, 'submitted')
assert.equal(submission.providerOutcome, 'executed')
assert.equal(submission.automaticRetryAllowed, false)
assert.equal(submission.sourceCheckpointQualificationGranted, false)
assert.equal(submission.customerCreditMutationCreated, false)
assert.equal(cloudCalls, 1)
assert.deepEqual(capturedBody, buildBody)

const repeated = await phase.startOneQualificationImageBuild({ authorityRef })
assert.equal(repeated.disposition, 'rejected_before_creation')
assert.equal(repeated.providerOutcome, 'not_executed')
assert.equal(cloudCalls, 1)

const terminal = await phase.observeOneQualificationImageBuild({
  authority,
  submission,
})
assertCanonicalSam31QualificationImageBuildTerminal(terminal)
assert.equal(
  terminal.disposition,
  'qualification_image_built_pending_supply_chain_release',
)
assert.equal(terminal.imageBuiltAndPushed, true)
assert.equal(terminal.sbomReread, false)
assert.equal(terminal.imageScanPassed, false)
assert.equal(terminal.imageSignatureVerified, false)
assert.equal(terminal.provenanceVerified, false)
assert.equal(terminal.sourceCheckpointQualificationGranted, false)
assert.equal(terminal.runtimeReleaseGranted, false)
assert.equal(terminal.gpuJobDispatched, false)
assert.equal(terminal.customerCreditMutationCreated, false)
assert.equal(terminal.productionReady, false)

let contractCloudCalls = 0
const contractPhase = createCanonicalSam31QualificationImageBuildPhase({
  authorityReadPort: {
    async rereadQualificationImageBuildAuthority() {
      return structuredClone(contractAuthority)
    },
  },
  statePort: createStatePort().port,
  authenticatedTransport: {
    async request() {
      contractCloudCalls += 1
      throw new Error('must not be called')
    },
  },
})
const contractRejected =
  await contractPhase.startOneQualificationImageBuild({
    authorityRef: buildAuthorityRef(contractAuthority),
  })
assert.equal(contractRejected.disposition, 'rejected_before_creation')
assert.equal(contractCloudCalls, 0)

const unknown = await createUnknownSubmission('throw')
assert.equal(unknown.disposition, 'outcome_unknown')
assert.equal(unknown.providerOutcome, 'unknown')
assert.equal(unknown.automaticRetryAllowed, false)
const nonOk = await createUnknownSubmission('non_ok')
assert.equal(nonOk.disposition, 'outcome_unknown')
assert.equal(nonOk.providerHttpStatus, 503)
assert.equal(nonOk.automaticRetryAllowed, false)
const providerResponseSummaries: unknown[] = []
const badRequestPhase = createCanonicalSam31QualificationImageBuildPhase({
  authorityReadPort: {
    async rereadQualificationImageBuildAuthority() {
      return structuredClone(authority)
    },
  },
  statePort: createStatePort().port,
  authenticatedTransport: {
    async request() {
      return {
        status: 400,
        json: { error: {
          code: 400,
          status: 'INVALID_ARGUMENT',
          message: 'The build configuration is invalid.',
        } },
      }
    },
  },
  observeCreateResponse(summary) {
    providerResponseSummaries.push(summary)
  },
})
const currentBadRequest = await badRequestPhase
  .startOneQualificationImageBuild({ authorityRef })
assert.equal(currentBadRequest.disposition, 'rejected_before_creation')
assert.equal(currentBadRequest.providerOutcome, 'not_executed')
assert.equal(currentBadRequest.durableAuthorityConsumptionCreated, true)
assert.equal(currentBadRequest.durableSubmissionObservationCreated, true)
assert.equal(providerResponseSummaries.length, 1)
assert.equal(
  (providerResponseSummaries[0] as { providerErrorReason: string })
    .providerErrorReason,
  'invalid_build_configuration',
)

const historicalBadRequestPayload = structuredClone(unknown) as Partial<
  typeof unknown
>
delete historicalBadRequestPayload.submissionHash
const badRequest = assertCanonicalSam31QualificationImageBuildSubmission({
  ...historicalBadRequestPayload,
  providerHttpStatus: 400,
  submissionHash: sha256AuthorityValue({
    ...historicalBadRequestPayload,
    providerHttpStatus: 400,
  }),
})
const badRequestRef = canonicalSam31QualificationImageBuildSubmissionRef(
  badRequest,
)
const noBuildReconciliation =
  await createCanonicalSam31QualificationImageBuildReconciler({
    readPort: {
      async rereadQualificationImageBuildAuthority() {
        return structuredClone(authority)
      },
      async rereadSubmission() {
        return structuredClone(badRequest)
      },
    },
    transport: {
      async request(request) {
        assert(request.url.includes('projectId=reeditpro'))
        return { status: 200, json: { builds: [] } }
      },
    },
    now: () => '2026-08-04T13:03:00.000Z',
  }).reconcileUnknownSubmission({
    reconciliationId: 'sam31-qualification-reconciliation-no-build',
    submissionRef: badRequestRef,
  })
assertCanonicalSam31QualificationImageBuildReconciliation(
  noBuildReconciliation,
)
assert.equal(
  noBuildReconciliation.disposition,
  'precreation_rejection_no_build_found',
)
assert.equal(noBuildReconciliation.matchingBuildCount, 0)
assert.equal(noBuildReconciliation.predecessorProviderExecutionKnownAbsent, true)
assert.equal(noBuildReconciliation.automaticRetryAllowed, false)
assert.equal(noBuildReconciliation.distinctSuccessorAuthorityMayBeIssued, true)

const matchingBuildId = '55555555-5555-4555-8555-555555555555'
const matchingBuild = successBuild(
  buildBody,
  matchingBuildId,
  authority.imageDestination.taggedUri,
)
matchingBuild.createTime = new Date(
  Date.parse(badRequest.observedAt) + 1_000,
).toISOString()
const matchedReconciliation =
  await createCanonicalSam31QualificationImageBuildReconciler({
    readPort: {
      async rereadQualificationImageBuildAuthority() {
        return structuredClone(authority)
      },
      async rereadSubmission() {
        return structuredClone(badRequest)
      },
    },
    transport: {
      async request() {
        return { status: 200, json: { builds: [matchingBuild] } }
      },
    },
  }).reconcileUnknownSubmission({
    reconciliationId: 'sam31-qualification-reconciliation-match',
    submissionRef: badRequestRef,
  })
assert.equal(matchedReconciliation.disposition, 'matched_exact_build')
assert.equal(matchedReconciliation.matchingBuildCount, 1)
assert.equal(matchedReconciliation.distinctSuccessorAuthorityMayBeIssued, false)

const acceptedPayload = structuredClone(badRequest) as Partial<
  typeof badRequest
>
delete acceptedPayload.submissionHash
const acceptedUnknown = assertCanonicalSam31QualificationImageBuildSubmission({
  ...acceptedPayload,
  providerHttpStatus: 200,
  submissionHash: sha256AuthorityValue({
    ...acceptedPayload,
    providerHttpStatus: 200,
  }),
})
const acceptedUnknownRef = canonicalSam31QualificationImageBuildSubmissionRef(
  acceptedUnknown,
)
matchingBuild.name =
  `projects/390722338345/locations/us-central1/builds/${matchingBuildId}`
const acceptedReconciliation =
  await createCanonicalSam31QualificationImageBuildReconciler({
    readPort: {
      async rereadQualificationImageBuildAuthority() {
        return structuredClone(authority)
      },
      async rereadSubmission() {
        return structuredClone(acceptedUnknown)
      },
    },
    transport: {
      async request() {
        return { status: 200, json: { builds: [matchingBuild] } }
      },
    },
  }).reconcileUnknownSubmission({
    reconciliationId: 'sam31-qualification-reconciliation-accepted-match',
    submissionRef: acceptedUnknownRef,
  })
assert.equal(acceptedReconciliation.disposition, 'matched_exact_build')
assert.equal(acceptedReconciliation.providerHttpStatus, 200)
assert.equal(
  acceptedReconciliation.originalRegionalCreateRequestMissingRequiredProjectIdQuery,
  false,
)
const acceptedReconciliationRef = {
  id: acceptedReconciliation.reconciliationId,
  version: 1 as const,
  contentHash:
    `sha256:${acceptedReconciliation.reconciliationHash}` as const,
}
const reconciledTerminal =
  await createCanonicalSam31QualificationImageBuildReconciledTerminalObserver({
    readPort: {
      async rereadQualificationImageBuildAuthority() {
        return structuredClone(authority)
      },
      async rereadReconciliation() {
        return structuredClone(acceptedReconciliation)
      },
    },
    transport: {
      async request() {
        return { status: 200, json: structuredClone(matchingBuild) }
      },
    },
  }).observeTerminal({
    terminalId: 'sam31-qualification-reconciled-terminal-1',
    reconciliationRef: acceptedReconciliationRef,
  })
assertCanonicalSam31QualificationImageBuildReconciledTerminal(
  reconciledTerminal,
)
assert.equal(
  reconciledTerminal.disposition,
  'qualification_image_built_pending_supply_chain_release',
)
assert.equal(reconciledTerminal.providerProjectIdentityNormalized, true)
assert.equal(reconciledTerminal.runtimeReleaseGranted, false)

const mismatchedPhase = createCanonicalSam31QualificationImageBuildPhase({
  authorityReadPort: {
    async rereadQualificationImageBuildAuthority() {
      return structuredClone(authority)
    },
  },
  statePort: createStatePort().port,
  authenticatedTransport: {
    async request() {
      const wrong = successBuild(
        buildBody,
        buildId,
        authority.imageDestination.taggedUri,
      )
      const source = wrong.source as { storageSource: Record<string, unknown> }
      source.storageSource = {
        ...source.storageSource,
        generation: '9999',
      }
      return { status: 200, json: wrong }
    },
  },
})
const mismatchedTerminal =
  await mismatchedPhase.observeOneQualificationImageBuild({
    authority,
    submission,
  })
assert.equal(mismatchedTerminal.disposition, 'outcome_unknown')
assert.equal(mismatchedTerminal.immutableImageDigest, null)

const tamperedAuthority = structuredClone(authority) as Record<string, unknown>
tamperedAuthority.authorityHash = '0'.repeat(64)
const tamperedPhase = createCanonicalSam31QualificationImageBuildPhase({
  authorityReadPort: {
    async rereadQualificationImageBuildAuthority() {
      return tamperedAuthority as never
    },
  },
  statePort: createStatePort().port,
  authenticatedTransport: {
    async request() {
      throw new Error('must not be called')
    },
  },
})
const tamperedRejected = await tamperedPhase.startOneQualificationImageBuild({
  authorityRef,
})
assert.equal(tamperedRejected.disposition, 'rejected_before_creation')

console.log(JSON.stringify({
  qualification: 'canonical-sam3_1-qualification-image-build-phase-smoke-v1',
  checks: {
    qualificationCapsuleExactReread: true,
    canonicalAuthorityRequired: true,
    sameCanonicalImageOwnerPreserved: true,
    durableSingleUseBeforeCloudCall: true,
    exactOfflineCloudBuildBody: true,
    checkpointAndQualificationReceiptExcluded: true,
    noSecretOrCallerBuildInput: true,
    outcomeUnknownHasNoAutomaticRetry: true,
    synchronousProviderRejectionClassifiedNotExecuted: true,
    providerErrorSummaryCredentialSafeAndDigestBound: true,
    http400NoBuildReconciledBeforeSuccessorAuthority: true,
    exactBuildMatchBlocksSuccessorAuthority: true,
    acceptedCreateResponseReconciledWithoutDuplicateSubmission: true,
    providerNumericProjectIdentityNormalized: true,
    reconciledBuildObservedThroughExactTerminalLineage: true,
    exactTerminalEchoRequired: true,
    immutableImagePendingSupplyChainRelease: true,
    sourceCheckpointQualificationGranted: false,
    runtimeReleaseGranted: false,
    gpuJobDispatched: false,
    customerCreditsMutated: false,
    developerMachineModelInstallOrExecution: false,
    productionReady: false,
  },
}, null, 2))

async function createUnknownSubmission(mode: 'throw' | 'non_ok') {
  const localState = createStatePort()
  const unknownPhase = createCanonicalSam31QualificationImageBuildPhase({
    authorityReadPort: {
      async rereadQualificationImageBuildAuthority() {
        return structuredClone(authority)
      },
    },
    statePort: localState.port,
    authenticatedTransport: {
      async request() {
        if (mode === 'throw') throw new Error('network outcome unknown')
        return { status: 503, json: { error: 'unavailable' } }
      },
    },
  })
  return unknownPhase.startOneQualificationImageBuild({ authorityRef })
}

function successBuild(
  body: Readonly<Record<string, unknown>>,
  id: string,
  taggedImageUri: string,
): Record<string, unknown> {
  return {
    id,
    name: `projects/reeditpro/locations/us-central1/builds/${id}`,
    projectId: 'reeditpro',
    status: 'SUCCESS',
    startTime: '2026-08-04T13:02:01.000Z',
    finishTime: '2026-08-04T13:02:30.000Z',
    warnings: [],
    source: structuredClone(body.source),
    sourceProvenance: {
      resolvedStorageSource: structuredClone(
        (body.source as { storageSource: unknown }).storageSource,
      ),
    },
    steps: structuredClone(body.steps),
    images: structuredClone(body.images),
    timeout: body.timeout,
    queueTtl: body.queueTtl,
    options: structuredClone(body.options),
    serviceAccount: body.serviceAccount,
    tags: structuredClone(body.tags),
    results: { images: [{
      name: taggedImageUri,
      digest: `sha256:${sha(Buffer.from('qualification-image-digest'))}`,
      artifactRegistryPackage:
        'projects/reeditpro/locations/us-central1/repositories/reeditpro-workers/packages/reeditpro-sam31-qualification',
    }] },
  }
}

function createStatePort() {
  const consumed = new Set<string>()
  const submissions = new Set<string>()
  const terminals = new Set<string>()
  const port: CanonicalSam31QualificationImageBuildStatePort = {
    async consumeQualificationAuthorityCreateOnly(input) {
      const key = `${input.authorityRef.contentHash}:${input.buildRequestHash}`
      if (consumed.has(key)) return false
      consumed.add(key)
      return true
    },
    async persistQualificationSubmissionCreateOnly({ submission }) {
      if (submissions.has(submission.submissionHash)) return false
      submissions.add(submission.submissionHash)
      return true
    },
    async persistQualificationTerminalCreateOnly({ observation }) {
      if (terminals.has(observation.observationHash)) return false
      terminals.add(observation.observationHash)
      return true
    },
  }
  return { port, consumed, submissions, terminals }
}

async function createSyntheticIngest() {
  const sourceBytes = Buffer.from('synthetic SAM 3.1 source')
  const checkpointBytes = Buffer.from('synthetic SAM 3.1 checkpoint')
  const sourceCoordinate = {
    projectId: 'reeditpro' as const,
    bucketName: 'reeditpro-production-reeditpro-model-artifacts' as const,
    objectName: 'private/model-artifacts/sam3_1/source/source.tar',
    generation: '11',
    etag: 'source-etag',
    byteLength: sourceBytes.byteLength,
    sha256: sha(sourceBytes),
  }
  const checkpointCoordinate = {
    projectId: 'reeditpro' as const,
    bucketName: 'reeditpro-production-reeditpro-model-artifacts' as const,
    objectName:
      'private/model-artifacts/sam3_1/checkpoint/sam3.1_multiplex.pt',
    generation: '12',
    etag: 'checkpoint-etag',
    byteLength: checkpointBytes.byteLength,
    sha256: sha(checkpointBytes),
  }
  const terms = createCanonicalSam31AuthorizedTermsAcceptance({
    evidenceClass: 'synthetic_contract_fixture',
    acceptanceRecordId: 'sam31-qualification-synthetic-terms',
    acceptanceRecordVersion: 1,
    sourceRepository: 'https://github.com/facebookresearch/sam3.git',
    checkpointRepository: 'facebook/sam3.1',
    licenseIdentity: 'SAM License',
    licenseLastUpdated: '2025-11-19',
    acceptanceSurface: 'official_hugging_face_gated_repository',
    repositoryGating: 'manual',
    acceptedAt: '2026-08-04T12:00:00.000Z',
    acceptedByAuthorizedOrganizationRepresentative: true,
    authorizedRepresentativeAuthorityRereadVerified: true,
    contactInformationSharingAcceptedByAuthorizedHuman: true,
    officialRepositoryAccessGrantedAndReread: true,
    automatedAcceptanceUsed: false,
    thirdPartyMirrorUsed: false,
    approvedUseCase:
      'private_commercial_video_editing_segmentation_and_tracking',
    militaryWarfareNuclearEspionageOrWeaponsUseAllowed: false,
    legalReviewRef: ref('sam31-qualification-legal'),
    privacyReviewRef: ref('sam31-qualification-privacy'),
    tradeControlsReviewRef: ref('sam31-qualification-trade'),
    termsEvidenceRef: ref('sam31-qualification-terms'),
    browserOrWorkerSecretIncluded: false,
  })
  return prepareCanonicalSam31PrivateArtifactIngestReceipt({
    ingestReceiptId: 'sam31-qualification-synthetic-ingest',
    evidenceClass: 'synthetic_contract_fixture',
    candidate,
    termsAcceptance: terms,
    officialArtifactPublicationRef: {
      ...ref('sam31-qualification-official-publication'),
      schemaVersion:
        'canonical-sam3_1-official-artifact-publication-receipt-v1' as const,
    },
    sourceArchiveCoordinate: sourceCoordinate,
    sourceArchiveArtifactRef: contentRef('source', sourceCoordinate.sha256),
    sourceLicenseRef: ref('source-license'),
    sourceSecurityReviewRef: ref('source-security'),
    sourceMalwareScanRef: ref('source-malware'),
    sourceUnsignedRevisionAcceptanceRef: ref('source-unsigned-review'),
    checkpointCoordinate,
    checkpointArtifactRef: contentRef(
      'checkpoint', checkpointCoordinate.sha256,
    ),
    checkpointManifestRef: ref('checkpoint-manifest'),
    checkpointLicenseRef: ref('checkpoint-license'),
    checkpointSecurityReviewRef: ref('checkpoint-security'),
    checkpointMalwareScanRef: ref('checkpoint-malware'),
    privateObjectReadPort: {
      async readExact(coordinate) {
        const body = coordinate.objectName === sourceCoordinate.objectName
          ? sourceBytes
          : checkpointBytes
        return {
          generationBeforeRead: coordinate.generation,
          etagBeforeRead: coordinate.etag,
          contentType: coordinate.objectName.endsWith('.tar')
            ? 'application/x-tar'
            : 'application/octet-stream',
          body,
          generationAfterRead: coordinate.generation,
          etagAfterRead: coordinate.etag,
        }
      },
    },
    preparedAt: '2026-08-04T12:05:00.000Z',
  })
}

function canonicalizeBuildAuthority(
  value: Awaited<ReturnType<
    typeof prepareCanonicalSam31QualificationImageBuildAuthority
  >>,
) {
  const clone = structuredClone(value) as Record<string, unknown> & {
    evidenceClass: string
    status: string
    authority: {
      canonicalPrivateIngestReread: boolean
      privateCapsuleReread: boolean
      qualificationImageBuildAuthorized: boolean
    }
    authorityHash?: string
  }
  delete clone.authorityHash
  clone.evidenceClass = 'canonical_private_reread'
  clone.status = 'authorized_for_private_cloud_build'
  clone.authority.canonicalPrivateIngestReread = true
  clone.authority.privateCapsuleReread = true
  clone.authority.qualificationImageBuildAuthorized = true
  return assertCanonicalSam31QualificationImageBuildAuthority({
    ...clone,
    authorityHash: sha256AuthorityValue(clone),
  })
}

function buildAuthorityRef(
  authority: Awaited<ReturnType<
    typeof prepareCanonicalSam31QualificationImageBuildAuthority
  >>,
) {
  return {
    id: authority.authorityId,
    version: authority.authorityVersion,
    contentHash: `sha256:${authority.authorityHash}` as const,
  }
}

function createCapsuleFiles(): Array<readonly [string, Buffer]> {
  const repositoryFile = (path: string): readonly [string, Buffer] => [
    path,
    readFileSync(resolve(process.cwd(), path)),
  ]
  const files: Array<readonly [string, Buffer]> = [
    repositoryFile(
      'docker/prod/gpu-worker/sam3_1/Dockerfile.qualification.candidate',
    ),
    repositoryFile(
      'docker/prod/gpu-worker/sam3_1/qualification_entrypoint.sh',
    ),
    repositoryFile(
      'docker/prod/gpu-worker/sam3_1/qualification_runner.py',
    ),
    repositoryFile('docker/prod/gpu-worker/sam3_1/source-provenance.lock'),
    repositoryFile(
      'docker/prod/gpu-worker/sam3_1/patches/0001-reeditpro-gpu-decode.patch',
    ),
    [
      'sam31_private_build_input/dependency-closure/cuda-forward-compat/cuda-compat-12-8_570.211.01-0ubuntu1_amd64.deb',
      Buffer.from('synthetic cuda forward compatibility package'),
    ],
    [
      'sam31_private_build_input/dependency-closure/cuda-forward-compat/cuda-forward-compat-ingest-receipt.json',
      Buffer.from('{"fixture":"cuda-ingest"}'),
    ],
    [
      'sam31_private_build_input/dependency-closure/dependency-closure-receipt.json',
      Buffer.from('{"fixture":"dependency-closure"}'),
    ],
    [
      'sam31_private_build_input/dependency-closure/ffmpeg/ffmpeg-8.0.3.tar.gz',
      Buffer.from('synthetic ffmpeg source archive'),
    ],
    [
      'sam31_private_build_input/dependency-closure/ffmpeg/nv-codec-headers-n12.2.72.0.tar.gz',
      Buffer.from('synthetic nv codec headers source archive'),
    ],
    [
      'sam31_private_build_input/dependency-closure/ffmpeg/ffmpeg-closure-receipt.json',
      Buffer.from('{"fixture":"ffmpeg-closure"}'),
    ],
    [
      'sam31_private_build_input/dependency-closure/requirements.lock.txt',
      Buffer.from('fixture==1.0 --hash=sha256:fixture'),
    ],
    [
      'sam31_private_build_input/dependency-closure/wheelhouse/fixture_a-1.0-py3-none-any.whl',
      Buffer.from('synthetic wheel a'),
    ],
    [
      'sam31_private_build_input/dependency-closure/wheelhouse/fixture_b-1.0-py3-none-any.whl',
      Buffer.from('synthetic wheel b'),
    ],
    [
      'sam31_private_build_input/source/sam3-96914d2425f90a64f45ca977c2b5165418099543-reeditpro-gpu-decode.tar',
      Buffer.from('synthetic patched source archive'),
    ],
    [
      'sam31_private_build_input/source/sam3-96914d2425f90a64f45ca977c2b5165418099543.tar',
      Buffer.from('synthetic source archive'),
    ],
    [
      'sam31_private_build_input/source/source-patch-application-receipt.json',
      Buffer.from('{"fixture":"patch-application"}'),
    ],
  ]
  return files.sort(
    ([left], [right]) => left < right ? -1 : left > right ? 1 : 0,
  )
}

function createCanonicalTarGz(
  entries: readonly (readonly [string, Buffer])[],
): Buffer {
  const blocks: Buffer[] = []
  for (const [path, content] of entries) {
    const header = Buffer.alloc(512)
    const { name, prefix } = splitTarPath(path)
    writeTarText(header, 0, 100, name)
    writeTarOctal(header, 100, 8, 0o444)
    writeTarOctal(header, 108, 8, 0)
    writeTarOctal(header, 116, 8, 0)
    writeTarOctal(header, 124, 12, content.byteLength)
    writeTarOctal(header, 136, 12, 0)
    header.fill(32, 148, 156)
    header[156] = 48
    writeTarText(header, 257, 6, 'ustar')
    writeTarText(header, 263, 2, '00')
    if (prefix) writeTarText(header, 345, 155, prefix)
    let checksum = 0
    for (const byte of header) checksum += byte
    header.write(
      `${checksum.toString(8).padStart(6, '0')}\0 `,
      148,
      8,
      'ascii',
    )
    blocks.push(header, content)
    const padding = (512 - (content.byteLength % 512)) % 512
    if (padding > 0) blocks.push(Buffer.alloc(padding))
  }
  blocks.push(Buffer.alloc(1_024))
  return gzipSync(Buffer.concat(blocks), { level: 9 })
}

function cloneCapsuleManifestInput(
  value: ReturnType<
    typeof createCanonicalSam31QualificationImageCapsuleManifest
  >,
): Parameters<
  typeof createCanonicalSam31QualificationImageCapsuleManifest
>[0] {
  const clone = structuredClone(value) as Record<string, unknown>
  delete clone.schemaVersion
  delete clone.source
  delete clone.buildPurpose
  delete clone.manifestHash
  return clone as Parameters<
    typeof createCanonicalSam31QualificationImageCapsuleManifest
  >[0]
}

function capsuleReadPort(
  bytes: Buffer,
  coordinate: typeof capsuleCoordinate,
) {
  return {
    async readExact() {
      return {
        generationBeforeRead: coordinate.generation,
        etagBeforeRead: coordinate.etag,
        contentType: 'application/x-tar',
        body: chunked(bytes),
        generationAfterRead: coordinate.generation,
        etagAfterRead: coordinate.etag,
      }
    },
  }
}

function splitTarPath(path: string): { name: string; prefix: string } {
  if (Buffer.byteLength(path) <= 100) return { name: path, prefix: '' }
  for (
    let index = path.lastIndexOf('/');
    index > 0;
    index = path.lastIndexOf('/', index - 1)
  ) {
    const prefix = path.slice(0, index)
    const name = path.slice(index + 1)
    if (Buffer.byteLength(prefix) <= 155 && Buffer.byteLength(name) <= 100) {
      return { name, prefix }
    }
  }
  throw new Error(`Capsule fixture path cannot be represented: ${path}`)
}

function writeTarText(
  header: Buffer,
  offset: number,
  length: number,
  value: string,
): void {
  const bytes = Buffer.from(value, 'utf8')
  assert(bytes.byteLength <= length)
  bytes.copy(header, offset)
}

function writeTarOctal(
  header: Buffer,
  offset: number,
  length: number,
  value: number,
): void {
  header.write(
    `${value.toString(8).padStart(length - 1, '0')}\0`,
    offset,
    length,
    'ascii',
  )
}

function entrySha(
  entries: readonly { path: string; sha256: string }[],
  path: string,
): string {
  const entry = entries.find((item) => item.path === path)
  assert(entry, `Missing capsule fixture entry: ${path}`)
  return entry.sha256
}

async function* chunked(bytes: Buffer) {
  yield bytes.subarray(0, 11)
  yield bytes.subarray(11)
}

function ref(id: string) {
  return {
    id,
    version: 1 as const,
    contentHash: `sha256:${sha(Buffer.from(id))}` as const,
  }
}

function contentRef(id: string, digest: string) {
  return {
    id,
    version: 1 as const,
    contentHash: `sha256:${digest}` as const,
  }
}

function sha(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}
