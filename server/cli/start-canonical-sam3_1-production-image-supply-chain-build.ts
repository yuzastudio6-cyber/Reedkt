import { z } from 'zod'

import {
  createCanonicalSam31ImageSupplyChainBuildAdmission,
  imageSupplyChainBuildSubmissionReference,
} from '../services/canonical-sam3_1-cloud-image-supply-chain-build-service'
import {
  createCanonicalSam31GcpImageSupplyChainBuildRuntime,
} from '../services/canonical-sam3_1-cloud-image-supply-chain-build-runtime'
import {
  createCanonicalSam31GcpCloudImageBuildRuntime,
} from '../services/canonical-sam3_1-cloud-image-build-runtime'

const CONFIRMATION =
  'start-one-weeditpro-sam31-production-image-supply-chain-build-v1' as const
const environment = createEnvironmentSchema().parse(process.env)
const imageRuntime = createCanonicalSam31GcpCloudImageBuildRuntime()
const authorityRef = ref(
  environment.WEEDITPRO_SAM31_PRODUCTION_IMAGE_AUTHORITY_ID,
  environment.WEEDITPRO_SAM31_PRODUCTION_IMAGE_AUTHORITY_SHA256,
)
const imageSubmissionRef = ref(
  environment.WEEDITPRO_SAM31_PRODUCTION_IMAGE_SUBMISSION_ID,
  environment.WEEDITPRO_SAM31_PRODUCTION_IMAGE_SUBMISSION_SHA256,
)
const imageTerminalRef = ref(
  environment.WEEDITPRO_SAM31_PRODUCTION_IMAGE_TERMINAL_ID,
  environment.WEEDITPRO_SAM31_PRODUCTION_IMAGE_TERMINAL_SHA256,
)
const [authority, imageBuildSubmission, imageBuildTerminalObservation] =
  await Promise.all([
    imageRuntime.repository.rereadBuildAuthority({ authorityRef }),
    imageRuntime.repository.rereadSubmission({
      submissionRef: imageSubmissionRef,
    }),
    imageRuntime.repository.rereadTerminalObservation({
      observationRef: imageTerminalRef,
    }),
  ])
if (!authority || !imageBuildSubmission || !imageBuildTerminalObservation) {
  throw new Error('SAM 3.1 production image build lineage is absent.')
}
const runtime = createCanonicalSam31GcpImageSupplyChainBuildRuntime()
const admission = createCanonicalSam31ImageSupplyChainBuildAdmission({
  admissionId:
    `sam31-production-image-supply-chain-${imageBuildTerminalObservation.observationHash.slice(0, 24)}`,
  authority,
  imageBuildSubmission,
  imageBuildTerminalObservation,
  kmsKeyVersionResource:
    environment.WEEDITPRO_SAM31_IMAGE_SIGNING_KMS_KEY_VERSION,
  admittedAt: new Date().toISOString(),
})
const admissionRef = await runtime.persistAdmissionCreateOnly({ admission })
const submission = await runtime.startOneSupplyChainBuild({ admissionRef })

process.stdout.write(`${JSON.stringify({
  schemaVersion:
    'weeditpro-sam3_1-production-image-supply-chain-start-v1',
  admissionRef,
  submission,
  submissionRef: imageSupplyChainBuildSubmissionReference(submission),
  imageBuildExactReread: true,
  gpuJobDispatched: false,
  modelOrCheckpointExecuted: false,
  customerCreditsMutated: false,
  runtimeReleaseGranted: false,
  productionReady: false,
})}\n`)

function createEnvironmentSchema() {
  const safeId = z.string().trim().min(1).max(512)
    .regex(/^[A-Za-z0-9][A-Za-z0-9._:/+-]*$/u)
    .refine((value) => !value.includes('..') && !value.includes('://'))
  const sha = z.string().regex(/^[a-f0-9]{64}$/u)
  return z.object({
    WEEDITPRO_SAM31_PRODUCTION_IMAGE_SUPPLY_CHAIN_CONFIRMATION:
      z.literal(CONFIRMATION),
    WEEDITPRO_SAM31_PRODUCTION_IMAGE_AUTHORITY_ID: safeId,
    WEEDITPRO_SAM31_PRODUCTION_IMAGE_AUTHORITY_SHA256: sha,
    WEEDITPRO_SAM31_PRODUCTION_IMAGE_SUBMISSION_ID: safeId,
    WEEDITPRO_SAM31_PRODUCTION_IMAGE_SUBMISSION_SHA256: sha,
    WEEDITPRO_SAM31_PRODUCTION_IMAGE_TERMINAL_ID: safeId,
    WEEDITPRO_SAM31_PRODUCTION_IMAGE_TERMINAL_SHA256: sha,
    WEEDITPRO_SAM31_IMAGE_SIGNING_KMS_KEY_VERSION: z.string().regex(
      /^projects\/reeditpro\/locations\/us-central1\/keyRings\/weeditpro-image-signing\/cryptoKeys\/sam31-image-signing\/cryptoKeyVersions\/[1-9][0-9]*$/u,
    ),
  }).passthrough()
}

function ref(id: string, sha256: string) {
  return {
    id,
    version: 1 as const,
    contentHash: `sha256:${sha256}` as const,
  }
}
