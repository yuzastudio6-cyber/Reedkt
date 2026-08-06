import {
  createCanonicalSam31GcpPrivateArtifactIngestRuntime,
} from '../services/canonical-sam3_1-private-artifact-ingest-runtime'

const EXPECTED_JOB = 'weeditpro-sam31-private-artifact-ingest' as const
const CONFIRMATION = 'prepare-reviewed-sam31-private-artifact-ingest' as const
const RAW_SHA256 = /^[a-f0-9]{64}$/u
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u

async function main(): Promise<void> {
  assertCloudOperatorInvocation()
  const configuration = readConfiguration()
  const runtime = createCanonicalSam31GcpPrivateArtifactIngestRuntime()
  const result = await runtime.prepareReviewedPrivateArtifactIngest({
    officialArtifactPublicationRef: {
      id: configuration.publicationId,
      version: 1,
      schemaVersion:
        'canonical-sam3_1-official-artifact-publication-receipt-v1',
      contentHash: `sha256:${configuration.publicationHash}`,
    },
    privateArtifactReviewBundleRef: {
      id: configuration.reviewBundleId,
      version: 1,
      schemaVersion:
        'canonical-sam3_1-private-artifact-review-bundle-v1',
      contentHash: `sha256:${configuration.reviewBundleHash}`,
    },
  })
  process.stdout.write(`${JSON.stringify({
    operation: 'canonical_sam3_1_private_artifact_ingest',
    status: result.disposition,
    ingestReceiptRef: result.ingestReceiptRef,
    exactOfficialPublicationTermsReviewAndArtifactReread:
      result.exactOfficialPublicationTermsReviewAndArtifactReread,
    callerReviewClaimsAccepted: result.callerReviewClaimsAccepted,
    modelInstalledOnDeveloperMachine: result.modelInstalledOnDeveloperMachine,
    imageBuildStarted: result.imageBuildStarted,
    gpuRuntimeStarted: result.gpuRuntimeStarted,
    customerCreditsMutated: result.customerCreditsMutated,
    publicDeliveryAuthorized: result.publicDeliveryAuthorized,
    productionReady: result.productionReady,
  })}\n`)
}

function assertCloudOperatorInvocation(): void {
  if (
    process.argv.length !== 3
    || process.argv[2] !== '--execute'
    || process.env.CLOUD_RUN_JOB !== EXPECTED_JOB
    || !safeId(process.env.CLOUD_RUN_EXECUTION)
    || process.env.CLOUD_RUN_TASK_INDEX !== '0'
    || process.env.CLOUD_RUN_TASK_ATTEMPT !== '0'
    || process.env.WEEDITPRO_SAM31_PRIVATE_ARTIFACT_INGEST_CONFIRM !==
      CONFIRMATION
  ) throw new Error(
    'SAM 3.1 private ingest requires the exact dedicated cloud operator invocation.',
  )
}

function readConfiguration(): {
  readonly publicationId: string
  readonly publicationHash: string
  readonly reviewBundleId: string
  readonly reviewBundleHash: string
} {
  const publicationId = process.env.WEEDITPRO_SAM31_PUBLICATION_ID
  const publicationHash = process.env.WEEDITPRO_SAM31_PUBLICATION_SHA256
  const reviewBundleId = process.env.WEEDITPRO_SAM31_REVIEW_BUNDLE_ID
  const reviewBundleHash = process.env.WEEDITPRO_SAM31_REVIEW_BUNDLE_SHA256
  if (
    !safeId(publicationId)
    || !RAW_SHA256.test(publicationHash ?? '')
    || !safeId(reviewBundleId)
    || !RAW_SHA256.test(reviewBundleHash ?? '')
  ) throw new Error('SAM 3.1 private ingest reference configuration is invalid.')
  return {
    publicationId,
    publicationHash: publicationHash!,
    reviewBundleId,
    reviewBundleHash: reviewBundleHash!,
  }
}

function safeId(value: string | undefined): value is string {
  return Boolean(value && SAFE_ID.test(value) && !value.includes('..'))
}

await main()
