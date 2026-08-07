import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

import {
  assertCanonicalSam31OfficialArtifactPublicationReceipt,
} from '../model-artifacts/canonical-sam3_1-official-artifact-publication'
import {
  createCanonicalSam31AuthorizedTermsAcceptance,
} from '../model-artifacts/canonical-sam3_1-private-artifact-ingest'
import {
  assertCanonicalSam31PrivateArtifactStaticAnalysisReceipt,
  buildCanonicalSam31PrivateArtifactReviewBundle,
  canonicalSam31PrivateArtifactStaticAnalysisRef,
} from '../model-artifacts/canonical-sam3_1-private-artifact-static-analysis'
import {
  assertCanonicalSam31PrivateArtifactReviewBundle,
} from '../model-artifacts/canonical-sam3_1-private-artifact-review'
import {
  createCanonicalSam31SourceRuntimeCandidate,
} from '../model-artifacts/canonical-sam3_1-source-runtime-candidate'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import { receipt as syntheticPublication } from
  './canonical-sam3_1-official-artifact-publication-smoke'

const candidate = createCanonicalSam31SourceRuntimeCandidate()
const terms = createTerms()
const publication = createPublication()
const analysis = createAnalysis()
const analysisRef = canonicalSam31PrivateArtifactStaticAnalysisRef(analysis)
const review = buildCanonicalSam31PrivateArtifactReviewBundle({
  publication,
  candidate,
  termsAcceptance: terms,
  analysis,
})

assert.equal(analysis.status, 'passed_for_private_artifact_ingest')
assert.equal(analysis.sourceArchive.license.sha256,
  '4dea99bfaa016e21bc860d73f344236bd1e5c4977d1a9a8fd32f822b500ae1be')
assert.equal(analysis.sourceArchive.revisionReview.commitSignatureStatus,
  'unsigned')
assert.equal(analysis.sourceArchive.revisionReview
  .unsignedRevisionAcceptedForProduction, false)
assert.equal(analysis.checkpoint.coordinate.byteLength, 3_502_755_717)
assert.equal(analysis.checkpoint.coordinate.sha256,
  '0567debeec80ba4ac6369540c6c248025283cb3ff2b92827509e57e2b3541cb6')
assert.equal(analysis.checkpoint.checkpointBytesDeserializedDuringReview, false)
assert.equal(analysis.checkpoint.torchWeightsOnlyLoadRequired, true)
assert.equal(analysis.checkpoint.executablePickleTrustGranted, false)
assert.equal(analysis.reviewBoundary.developerMachineArtifactCopyCreated, false)
assert.equal(analysis.reviewBoundary.thirdPartyScannerUploadUsed, false)
assert.equal(analysis.authority.artifactIngestAuthorized, true)
assert.equal(analysis.authority.imageBuildAuthorized, false)
assert.equal(analysis.authority.gpuRuntimeAuthorized, false)
assert.equal(analysis.authority.productionReady, false)
assert.equal(review.sourceArchive.licenseRef.contentHash,
  analysisRef.contentHash)
assert.deepEqual(review.sourceArchive.licenseRef,
  review.sourceArchive.securityReviewRef)
assert.deepEqual(review.sourceArchive.licenseRef,
  review.checkpoint.manifestRef)
assert.equal(review.checkpoint.torchWeightsOnlyLoadRequired, true)
assert.equal(review.checkpoint.executablePickleTrustGranted, false)
assert.equal(review.authority.artifactIngestReceiptCreated, false)
assert.equal(review.authority.imageBuildAuthorized, false)
assert.equal(review.authority.gpuRuntimeAuthorized, false)
assert.equal(review.authority.productionReady, false)
assert.deepEqual(assertCanonicalSam31PrivateArtifactReviewBundle(review), review)

const tamperedHash = structuredClone(analysis)
tamperedHash.sourceArchive.archiveManifest.entrySetSha256 = hash('tampered')
assert.throws(() =>
  assertCanonicalSam31PrivateArtifactStaticAnalysisReceipt(tamperedHash))

const recomputedTamper = structuredClone(analysis)
recomputedTamper.checkpoint.manifest.dangerousGlobalReferenceCount = 1 as never
recomputeAnalysis(recomputedTamper)
assert.throws(() =>
  assertCanonicalSam31PrivateArtifactStaticAnalysisReceipt(recomputedTamper))

const deserialized = structuredClone(analysis)
deserialized.checkpoint.checkpointBytesDeserializedDuringReview = true as never
recomputeAnalysis(deserialized)
assert.throws(() =>
  assertCanonicalSam31PrivateArtifactStaticAnalysisReceipt(deserialized))

const executableTrust = structuredClone(analysis)
executableTrust.checkpoint.executablePickleTrustGranted = true as never
recomputeAnalysis(executableTrust)
assert.throws(() =>
  assertCanonicalSam31PrivateArtifactStaticAnalysisReceipt(executableTrust))

const openedProduction = structuredClone(analysis)
openedProduction.authority.productionReady = true as never
recomputeAnalysis(openedProduction)
assert.throws(() =>
  assertCanonicalSam31PrivateArtifactStaticAnalysisReceipt(openedProduction))

const crossedPublication = structuredClone(publication)
crossedPublication.publicationAttemptId = 'crossed-publication'
recomputePublication(crossedPublication)
assert.throws(() => buildCanonicalSam31PrivateArtifactReviewBundle({
  publication: crossedPublication,
  candidate,
  termsAcceptance: terms,
  analysis,
}))

let getterRead = false
const hostile = structuredClone(analysis) as Record<string, unknown>
Object.defineProperty(hostile, 'source', {
  enumerable: true,
  get() {
    getterRead = true
    return analysis.source
  },
})
assert.throws(() =>
  assertCanonicalSam31PrivateArtifactStaticAnalysisReceipt(hostile))
assert.equal(getterRead, false)

const cyclic = structuredClone(analysis) as Record<string, unknown>
cyclic.cycle = cyclic
assert.throws(() =>
  assertCanonicalSam31PrivateArtifactStaticAnalysisReceipt(cyclic))

const root = process.cwd()
const [dockerfile, reviewWorker, buildConfig, buildScript, deployScript,
  packageJson] =
  await Promise.all([
    readFile(`${root}/docker/prod/sam31-private-artifact-review/Dockerfile`,
      'utf8'),
    readFile(`${root}/docker/prod/sam31-private-artifact-review/review.py`,
      'utf8'),
    readFile(`${root}/scripts/gcp/prod/cloudbuild-sam31-private-artifact-review.yaml`,
      'utf8'),
    readFile(`${root}/scripts/gcp/prod/29-build-sam31-private-artifact-review-image.sh`,
      'utf8'),
    readFile(`${root}/scripts/gcp/prod/30-deploy-sam31-private-artifact-review-job.sh`,
      'utf8'),
    readFile(`${root}/package.json`, 'utf8'),
  ])
assert.match(dockerfile,
  /clamav\/clamav@sha256:75fb5fd95fcbe1d7e6d240c369c1572b686ee2c95949d1042b5148de8eddebb4/u)
assert.match(dockerfile, /python3=3\.12\.13-r0/u)
assert.match(dockerfile, /apk upgrade --no-cache/u)
assert.match(dockerfile, /rm -rf \/usr\/lib\/python3\.12\/ensurepip/u)
assert.match(dockerfile, /freshclam --stdout/u)
assert.match(dockerfile, /USER 100:100/u)
assert.match(dockerfile, /model\.weights\.included="false"/u)
assert.match(dockerfile, /model\.execution\.allowed="false"/u)
assert.doesNotMatch(dockerfile, /COPY .*sam3\.1_multiplex\.pt/u)
assert.match(reviewWorker, /pickletools\.genops/u)
assert.match(reviewWorker, /expected_root = "sam3"/u)
assert.match(reviewWorker, /checkpointBytesDeserializedDuringReview/u)
assert.match(reviewWorker, /torchWeightsOnlyLoadRequired/u)
assert.match(reviewWorker, /clamscan/u)
assert.match(reviewWorker, /shutil\.rmtree/u)
assert.match(reviewWorker, /upload_create_only/u)
assert.doesNotMatch(reviewWorker, /import torch|from torch|import sam3|from sam3/u)
assert.doesNotMatch(reviewWorker, /pickle\.loads|torch\.load/u)
assert.match(buildConfig, /requestedVerifyOption:\s*VERIFIED/u)
assert.match(buildConfig, /sourceProvenanceHash:\s*\n\s*- SHA256/u)
assert.match(buildScript, /git status --porcelain=v1/u)
assert.match(buildScript, /cloudJobStarted":false/u)
assert.match(deployScript,
  /BUILD_ID='bd8328d0-c724-48a8-ad21-68e9de1ab46f'/u)
assert.match(deployScript,
  /SOURCE_COMMIT='a7672b066c209dc5c905ccfa2729daecf0aac379'/u)
assert.match(deployScript,
  /IMAGE_DIGEST='sha256:c5d1b829603e6fe5062a694225afdebf1c805bb64b627872f56b25a929dd5956'/u)
assert.match(deployScript, /--cpu=4 --memory=16Gi/u)
assert.match(deployScript, /SERVICE_ACCOUNT_ID='weeditpro-sam31-review-sa'/u)
assert.match(deployScript, /retry_project_binding roles\/logging\.logWriter/u)
assert.match(deployScript,
  /retry_bucket_binding "\$\{CONTROL_BUCKET\}" roles\/storage\.objectCreator/u)
assert.match(deployScript, /--role="\$\{role\}" --condition=None/u)
assert.match(deployScript, /--max-retries=0 --task-timeout=4h/u)
assert.match(deployScript, /--network="\$\{NETWORK\}"/u)
assert.match(deployScript, /--vpc-egress=all-traffic/u)
assert.match(deployScript, /contains\(\["OS", "PYPI", "SECRET"\]\)/u)
assert.match(deployScript, /package_vulnerability_summary\.vulnerabilities/u)
assert.doesNotMatch(deployScript, /gcloud run jobs execute/u)
assert.doesNotMatch(deployScript, /--allow-unauthenticated|--set-secrets/u)
assert.match(packageJson,
  /"smoke:sam3_1-private-artifact-static-analysis"/u)
assert.match(packageJson,
  /"build:sam3_1-private-artifact-review-image"/u)
assert.match(packageJson,
  /"deploy:sam3_1-private-artifact-review-job"/u)

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-private-artifact-static-analysis',
  checks: 63,
  exactPublishedSourceAndCheckpointCoordinatesBound: true,
  officialLicenseBytesPinned: true,
  unsignedSourceAcceptedForPrivateQualificationOnly: true,
  sourceArchiveManifestAndClamAvRequired: true,
  checkpointZipPickleManifestAndClamAvRequired: true,
  checkpointDeserializedDuringReview: false,
  torchWeightsOnlyLoadRequired: true,
  developerMachineArtifactCopyCreated: false,
  imageBuildStarted: false,
  gpuRuntimeStarted: false,
  productionReady: false,
}, null, 2))

function createTerms() {
  return createCanonicalSam31AuthorizedTermsAcceptance({
    evidenceClass: 'canonical_private_reread',
    acceptanceRecordId: 'sam31-terms-static-review-001',
    acceptanceRecordVersion: 1,
    sourceRepository: 'https://github.com/facebookresearch/sam3.git',
    checkpointRepository: 'facebook/sam3.1',
    licenseIdentity: 'SAM License',
    licenseLastUpdated: '2025-11-19',
    acceptanceSurface: 'official_hugging_face_gated_repository',
    repositoryGating: 'manual',
    acceptedAt: '2026-08-06T11:00:00.000Z',
    acceptedByAuthorizedOrganizationRepresentative: true,
    authorizedRepresentativeAuthorityRereadVerified: true,
    contactInformationSharingAcceptedByAuthorizedHuman: true,
    officialRepositoryAccessGrantedAndReread: true,
    automatedAcceptanceUsed: false,
    thirdPartyMirrorUsed: false,
    approvedUseCase:
      'private_commercial_video_editing_segmentation_and_tracking',
    militaryWarfareNuclearEspionageOrWeaponsUseAllowed: false,
    legalReviewRef: ref('sam31-terms-legal'),
    privacyReviewRef: ref('sam31-terms-privacy'),
    tradeControlsReviewRef: ref('sam31-terms-trade-controls'),
    termsEvidenceRef: ref('sam31-terms-evidence'),
    browserOrWorkerSecretIncluded: false,
  })
}

function createPublication() {
  const value = structuredClone(syntheticPublication)
  value.evidenceClass = 'canonical_private_publication'
  value.status =
    'published_pending_security_license_and_compatibility_review'
  value.termsAcceptanceRef = {
    id: terms.acceptanceRecordId,
    version: terms.acceptanceRecordVersion,
    contentHash: `sha256:${terms.acceptanceRecordHash}`,
  }
  value.sourceArchive.coordinate.byteLength = 73_605_120
  value.sourceArchive.coordinate.sha256 =
    '5138f0e396de40a40ef0168c106e089aacbbf1dc7651be2f81c76f89c2f67f2a'
  value.sourceArchive.expectedByteLengthAndSha256Enforced = true
  value.checkpoint.coordinate.byteLength = 3_502_755_717
  value.checkpoint.coordinate.sha256 =
    '0567debeec80ba4ac6369540c6c248025283cb3ff2b92827509e57e2b3541cb6'
  value.checkpoint.authorizedHumanTermsAcceptanceReread = true
  value.checkpoint.accessTokenReadFromPinnedSecretVersion = true
  value.runtimeBinding.officialArtifactStreamPortVersion =
    'canonical-sam3_1-official-artifact-stream-runtime-v1'
  value.runtimeBinding.privateArtifactPublicationPortVersion =
    'canonical-sam3_1-gcs-official-artifact-publication-port-v1'
  value.publishedAt = '2026-08-06T12:00:00.000Z'
  recomputePublication(value)
  return assertCanonicalSam31OfficialArtifactPublicationReceipt(value)
}

function createAnalysis() {
  const scanner = (profile:
    | 'complete_source_archive_with_archive_recursion'
    | 'complete_checkpoint_raw_bytes_without_archive_execution') => ({
    engine: 'ClamAV' as const,
    engineVersion: '1.4.3' as const,
    signatureDatabaseVersion: '28000',
    signatureDatabasePublishedAt: '2026-08-06T00:00:00.000Z',
    scanProfile: profile,
    exactArtifactBytesScanned: true as const,
    signaturesLoaded: 8_800_000,
    infectedFiles: 0 as const,
    scanPassed: true as const,
  })
  const publicationRef = {
    id: publication.publicationAttemptId,
    version: 1 as const,
    schemaVersion: publication.schemaVersion,
    contentHash: `sha256:${publication.publicationReceiptHash}` as const,
  }
  const candidateRef = {
    id: `sam31-source-runtime-candidate-${candidate.candidateHash.slice(0, 24)}`,
    version: 1 as const,
    schemaVersion: candidate.schemaVersion,
    contentHash: `sha256:${candidate.candidateHash}` as const,
  }
  const payload = {
    schemaVersion:
      'canonical-sam3_1-private-artifact-static-analysis-v1' as const,
    source:
      'canonical_weeditpro_sam3_1_private_artifact_static_analysis_owner' as const,
    evidenceClass: 'canonical_private_exact_byte_review' as const,
    status: 'passed_for_private_artifact_ingest' as const,
    analysisId: 'sam31-static-analysis-fixture-001',
    analysisVersion: 1 as const,
    officialArtifactPublicationRef: publicationRef,
    candidateRef,
    termsAcceptanceRef: {
      ...publication.termsAcceptanceRef,
      version: 1 as const,
      schemaVersion:
        'canonical-sam3_1-authorized-terms-acceptance-v1' as const,
    },
    sourceArchive: {
      repository: 'https://github.com/facebookresearch/sam3.git' as const,
      revision: '96914d2425f90a64f45ca977c2b5165418099543' as const,
      coordinate: publication.sourceArchive.coordinate,
      artifactRef: contentRef('sam31-source',
        publication.sourceArchive.coordinate.sha256),
      archiveManifest: {
        entryCount: 2,
        regularFileCount: 1,
        directoryCount: 1,
        totalRegularFileBytes: 123,
        entrySetSha256: hash('source-entry-set'),
        canonicalRegularFilesAndDirectoriesOnly: true as const,
        pathTraversalLinksDevicesFifosSocketsAndSparseEntriesAbsent:
          true as const,
        duplicateEntriesAbsent: true as const,
        exactArchiveBytesGenerationEtagLengthAndSha256Reread: true as const,
      },
      license: {
        path: 'LICENSE' as const,
        sha256:
          '4dea99bfaa016e21bc860d73f344236bd1e5c4977d1a9a8fd32f822b500ae1be' as const,
        title: 'SAM License' as const,
        lastUpdated: '2025-11-19' as const,
        officialPinnedSourceLicenseReread: true as const,
        acceptedTermsBindOrganizationUse: true as const,
        privateCommercialUseApprovedByAuthorizedOrganizationRepresentative:
          true as const,
        publicRedistributionAuthorized: false as const,
        legalCounselApprovalClaimed: false as const,
      },
      revisionReview: {
        commitSignatureStatus: 'unsigned' as const,
        officialRepositoryAndPinnedRevisionExact: true as const,
        unsignedRevisionAcceptedForPrivateQualification: true as const,
        unsignedRevisionAcceptedForProduction: false as const,
      },
      malwareScan: scanner(
        'complete_source_archive_with_archive_recursion'),
      securityReviewPassed: true as const,
      malwareScanPassed: true as const,
    },
    checkpoint: {
      repository: 'facebook/sam3.1' as const,
      revision: 'daa63191845a41281374e725f4c9e51c7a824460' as const,
      fileName: 'sam3.1_multiplex.pt' as const,
      coordinate: publication.checkpoint.coordinate,
      artifactRef: contentRef('sam31-checkpoint',
        publication.checkpoint.coordinate.sha256),
      manifest: {
        containerFormat: 'pytorch_zip64_checkpoint' as const,
        memberCount: 4,
        totalCompressedBytes: 3_502_700_000,
        totalUncompressedBytes: 3_502_700_000,
        memberSetSha256: hash('checkpoint-members'),
        dataPicklePath: 'sam3.1_multiplex/data.pkl',
        dataPickleByteLength: 1_024,
        dataPickleSha256: hash('checkpoint-data-pickle'),
        pickleOpcodeCount: 100,
        pickleOpcodeSetSha256: hash('checkpoint-opcodes'),
        pickleGlobalReferenceSetSha256: hash('checkpoint-globals'),
        dangerousGlobalReferenceCount: 0 as const,
        encryptedMembersAbsent: true as const,
        pathTraversalLinksDevicesAndDuplicateMembersAbsent: true as const,
        exactCoordinateShaLengthGenerationAndEtagReread: true as const,
      },
      malwareScan: scanner(
        'complete_checkpoint_raw_bytes_without_archive_execution'),
      checkpointBytesDeserializedDuringReview: false as const,
      torchWeightsOnlyLoadRequired: true as const,
      executablePickleTrustGranted: false as const,
      exactWeightsOnlyLoadMustPassInA100Qualification: true as const,
      licenseApprovedForWeEditProPrivateCommercialUse: true as const,
      securityReviewPassed: true as const,
      malwareScanPassed: true as const,
    },
    reviewBoundary: {
      exactOfficialPublishedCoordinatesOnly: true as const,
      checkpointLoadedOrModelExecuted: false as const,
      sourceExtractedOrCheckpointPersistedOutsideEphemeralCloudJob:
        false as const,
      developerMachineArtifactCopyCreated: false as const,
      thirdPartyScannerUploadUsed: false as const,
      callerSecurityLicenseOrMalwareClaimsAccepted: false as const,
      sourceAndCheckpointDeletedFromEphemeralStorageAtExit: true as const,
      compatibilityQualificationStillRequired: true as const,
    },
    authority: {
      authenticatedStaticReviewEvidenceOnly: true as const,
      artifactIngestAuthorized: true as const,
      imageBuildAuthorized: false as const,
      gpuRuntimeAuthorized: false as const,
      providerOrModelExecuted: false as const,
      customerCreditsMutated: false as const,
      qaApproved: false as const,
      publicDeliveryAuthorized: false as const,
      productionReady: false as const,
    },
    reviewedAt: '2026-08-06T13:00:00.000Z',
  }
  return assertCanonicalSam31PrivateArtifactStaticAnalysisReceipt({
    ...payload,
    analysisHash: sha256AuthorityValue(payload),
  })
}

function ref(id: string) {
  return { id, version: 1, contentHash: `sha256:${hash(id)}` as const }
}

function contentRef(id: string, contentHash: string) {
  return { id, version: 1, contentHash: `sha256:${contentHash}` as const }
}

function hash(value: string): string {
  return sha256AuthorityValue(value)
}

function recomputeAnalysis(value: typeof analysis): void {
  const payload = structuredClone(value) as Record<string, unknown>
  delete payload.analysisHash
  value.analysisHash = sha256AuthorityValue(payload)
}

function recomputePublication(value: typeof syntheticPublication): void {
  const payload = structuredClone(value) as Record<string, unknown>
  delete payload.publicationReceiptHash
  value.publicationReceiptHash = sha256AuthorityValue(payload)
}
