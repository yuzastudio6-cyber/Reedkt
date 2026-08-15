import {
  CANONICAL_SAM3_1_AUTHORIZED_HUMAN_TERMS_INTENT_VERSION,
} from '../model-artifacts/canonical-sam3_1-authorized-terms-finalization'
import {
  createCanonicalSam31AuthorizedTermsFinalizationOwner,
  createCanonicalSam31GcpAuthorizedTermsFinalizationRepository,
} from '../services/canonical-sam3_1-authorized-terms-finalization-owner'
import {
  createCanonicalSam31HuggingFaceOfficialAccessVerificationPort,
} from '../services/canonical-sam3_1-hugging-face-official-access-verifier'

const EXPECTED_JOB = 'weeditpro-sam31-terms-finalization' as const
const CONFIRMATION = 'finalize-authorized-sam31-terms-once' as const
const rawSha256 = /^[a-f0-9]{64}$/u
const safeId = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,219}$/u
const secretResource =
  /^projects\/reeditpro\/secrets\/(?:HUGGINGFACE_TOKEN|MODEL_WEIGHT_ACCESS_TOKEN)\/versions\/[1-9][0-9]*$/u

async function main(): Promise<void> {
  assertCloudInvocation()
  const configuration = readConfiguration()
  const repository =
    createCanonicalSam31GcpAuthorizedTermsFinalizationRepository()
  const owner = createCanonicalSam31AuthorizedTermsFinalizationOwner({
    repository,
    officialAccessVerificationPort:
      createCanonicalSam31HuggingFaceOfficialAccessVerificationPort({
        secretResourceName: configuration.secretResourceName,
        credentialVersionAuthorityRef:
          configuration.credentialVersionAuthorityRef,
      }),
    now: () => new Date().toISOString(),
  })
  const result = await owner.finalizeAuthorizedTermsAcceptance({
    humanTermsIntentRef: configuration.humanTermsIntentRef,
  })
  process.stdout.write(`${JSON.stringify({
    operation: 'canonical_sam3_1_authorized_terms_finalization',
    disposition: result.disposition,
    officialAccessObservationRef: result.officialAccessObservationRef,
    termsFinalizationRef: result.termsFinalizationRef,
    termsAcceptanceRef: result.termsAcceptanceRef,
    officialGatedAccessVerifiedByServer:
      result.officialGatedAccessVerifiedByServer,
    browserLoginOrTermsAcceptanceAutomated:
      result.browserLoginOrTermsAcceptanceAutomated,
    modelInstalledOnDeveloperMachine:
      result.modelInstalledOnDeveloperMachine,
    checkpointBytesDownloaded: result.checkpointBytesDownloaded,
    artifactPublicationStarted: result.artifactPublicationStarted,
    gpuRuntimeStarted: result.gpuRuntimeStarted,
    customerCreditsMutated: result.customerCreditsMutated,
    publicDeliveryAuthorized: result.publicDeliveryAuthorized,
    productionReady: result.productionReady,
  })}\n`)
}

function assertCloudInvocation(): void {
  if (
    process.argv.length !== 3
    || process.argv[2] !== '--execute'
    || process.env.CLOUD_RUN_JOB !== EXPECTED_JOB
    || !validId(process.env.CLOUD_RUN_EXECUTION)
    || process.env.CLOUD_RUN_TASK_INDEX !== '0'
    || !validId(process.env.CLOUD_RUN_TASK_ATTEMPT)
    || process.env.WEEDITPRO_SAM31_AUTHORIZED_TERMS_FINALIZATION_CONFIRM
      !== CONFIRMATION
  ) throw new Error(
    'SAM 3.1 terms finalization requires its exact cloud-only invocation.',
  )
}

function readConfiguration(): {
  readonly secretResourceName: string
  readonly humanTermsIntentRef: {
    readonly id: string
    readonly version: 1
    readonly schemaVersion:
      typeof CANONICAL_SAM3_1_AUTHORIZED_HUMAN_TERMS_INTENT_VERSION
    readonly contentHash: `sha256:${string}`
  }
  readonly credentialVersionAuthorityRef: {
    readonly id: string
    readonly version: 1
    readonly contentHash: `sha256:${string}`
  }
} {
  const intentId = process.env.WEEDITPRO_SAM31_HUMAN_TERMS_INTENT_ID
  const intentHash = process.env.WEEDITPRO_SAM31_HUMAN_TERMS_INTENT_SHA256
  const secretName = process.env.WEEDITPRO_SAM31_HF_SECRET_RESOURCE_NAME
  const credentialRefId = process.env
    .WEEDITPRO_SAM31_HF_SECRET_VERSION_AUTHORITY_ID
  const credentialRefHash = process.env
    .WEEDITPRO_SAM31_HF_SECRET_VERSION_AUTHORITY_SHA256
  if (
    !validId(intentId)
    || !rawSha256.test(intentHash ?? '')
    || !secretResource.test(secretName ?? '')
    || !validId(credentialRefId)
    || !rawSha256.test(credentialRefHash ?? '')
  ) throw new Error('SAM 3.1 terms finalization configuration is invalid.')
  return Object.freeze({
    secretResourceName: secretName!,
    humanTermsIntentRef: {
      id: intentId!,
      version: 1 as const,
      schemaVersion:
        CANONICAL_SAM3_1_AUTHORIZED_HUMAN_TERMS_INTENT_VERSION,
      contentHash: `sha256:${intentHash}` as const,
    },
    credentialVersionAuthorityRef: {
      id: credentialRefId!,
      version: 1 as const,
      contentHash: `sha256:${credentialRefHash}` as const,
    },
  })
}

function validId(value: string | undefined): boolean {
  return Boolean(value && safeId.test(value) && !value.includes('..'))
}

await main()
