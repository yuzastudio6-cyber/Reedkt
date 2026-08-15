import { z } from 'zod'

import {
  createCanonicalSam31GcpCloudImageBuildRuntime,
} from '../services/canonical-sam3_1-cloud-image-build-runtime'
import {
  createCanonicalSam31GcpImageSupplyChainBuildRuntime,
} from '../services/canonical-sam3_1-cloud-image-supply-chain-build-runtime'
import {
  createCanonicalSam31GcpProductionImageSecurityReviewRuntime,
  SAM3_1_PRODUCTION_IMAGE_SECURITY_REVIEW_CONFIRMATION,
} from '../services/canonical-sam3_1-production-image-security-review-operator'
import {
  createCanonicalSam31ImageSupplyChainGoogleReadTransport,
} from '../services/canonical-sam3_1-cloud-image-supply-chain-evidence-read-service'
import {
  createWeEditProGcpLocalOperatorAuth,
  WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH_MODE,
} from './weeditpro-gcp-local-operator-auth'

const environment = environmentSchema().parse(process.env)
const { authClient, storage } = createWeEditProGcpLocalOperatorAuth({
  confirmation: environment.WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH,
})
const refs = readRefs(environment)
const imageRuntime = createCanonicalSam31GcpCloudImageBuildRuntime({
  storage,
  auth: authClient,
})
const supplyRuntime = createCanonicalSam31GcpImageSupplyChainBuildRuntime({
  storage,
  auth: authClient,
})
const [imageBuildAuthority, imageBuildSubmission, imageBuildTerminal,
  supplyChainAdmission, supplyChainSubmission, supplyChainObservation] =
  await Promise.all([
    imageRuntime.repository.rereadBuildAuthority({
      authorityRef: refs.imageAuthorityRef,
    }),
    imageRuntime.repository.rereadSubmission({
      submissionRef: refs.imageSubmissionRef,
    }),
    imageRuntime.repository.rereadTerminalObservation({
      observationRef: refs.imageTerminalRef,
    }),
    supplyRuntime.repository.rereadAdmission({
      admissionRef: refs.supplyAdmissionRef,
    }),
    supplyRuntime.repository.rereadSubmission({
      submissionRef: refs.supplySubmissionRef,
    }),
    supplyRuntime.repository.rereadTerminalObservationForSubmission({
      submissionRef: refs.supplySubmissionRef,
    }),
  ])
if (!imageBuildAuthority || !imageBuildSubmission || !imageBuildTerminal
  || !supplyChainAdmission || !supplyChainSubmission
  || !supplyChainObservation) {
  throw new Error('SAM 3.1 production security review lineage is absent.')
}
const result = await createCanonicalSam31GcpProductionImageSecurityReviewRuntime({
  storage,
  googleReadTransport:
    createCanonicalSam31ImageSupplyChainGoogleReadTransport({
      auth: authClient,
    }),
})
  .operator.review({
    confirmation: SAM3_1_PRODUCTION_IMAGE_SECURITY_REVIEW_CONFIRMATION,
    imageBuildAuthority,
    imageBuildSubmission,
    imageBuildTerminal,
    supplyChainAdmission,
    supplyChainSubmission,
    supplyChainObservation,
  })
process.stdout.write(`${JSON.stringify(result)}\n`)

function environmentSchema() {
  const safeId = z.string().trim().min(1).max(512)
    .regex(/^[A-Za-z0-9][A-Za-z0-9._:/+-]*$/u)
    .refine((value) => !value.includes('..') && !value.includes('://'))
  const sha = z.string().regex(/^[a-f0-9]{64}$/u)
  return z.object({
    WEEDITPRO_SAM31_PRODUCTION_IMAGE_SECURITY_REVIEW_CONFIRMATION: z.literal(
      SAM3_1_PRODUCTION_IMAGE_SECURITY_REVIEW_CONFIRMATION,
    ),
    WEEDITPRO_SAM31_PRODUCTION_IMAGE_AUTHORITY_ID: safeId,
    WEEDITPRO_SAM31_PRODUCTION_IMAGE_AUTHORITY_SHA256: sha,
    WEEDITPRO_SAM31_PRODUCTION_IMAGE_SUBMISSION_ID: safeId,
    WEEDITPRO_SAM31_PRODUCTION_IMAGE_SUBMISSION_SHA256: sha,
    WEEDITPRO_SAM31_PRODUCTION_IMAGE_TERMINAL_ID: safeId,
    WEEDITPRO_SAM31_PRODUCTION_IMAGE_TERMINAL_SHA256: sha,
    WEEDITPRO_SAM31_PRODUCTION_IMAGE_SUPPLY_CHAIN_ADMISSION_ID: safeId,
    WEEDITPRO_SAM31_PRODUCTION_IMAGE_SUPPLY_CHAIN_ADMISSION_SHA256: sha,
    WEEDITPRO_SAM31_PRODUCTION_IMAGE_SUPPLY_CHAIN_SUBMISSION_ID: safeId,
    WEEDITPRO_SAM31_PRODUCTION_IMAGE_SUPPLY_CHAIN_SUBMISSION_SHA256: sha,
    WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH: z.literal(
      WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH_MODE,
    ),
  }).passthrough()
}

function readRefs(value: Record<string, unknown>) {
  const get = (name: string) => z.string().parse(value[name])
  return {
    imageAuthorityRef: ref(get(
      'WEEDITPRO_SAM31_PRODUCTION_IMAGE_AUTHORITY_ID'), get(
      'WEEDITPRO_SAM31_PRODUCTION_IMAGE_AUTHORITY_SHA256')),
    imageSubmissionRef: ref(get(
      'WEEDITPRO_SAM31_PRODUCTION_IMAGE_SUBMISSION_ID'), get(
      'WEEDITPRO_SAM31_PRODUCTION_IMAGE_SUBMISSION_SHA256')),
    imageTerminalRef: ref(get(
      'WEEDITPRO_SAM31_PRODUCTION_IMAGE_TERMINAL_ID'), get(
      'WEEDITPRO_SAM31_PRODUCTION_IMAGE_TERMINAL_SHA256')),
    supplyAdmissionRef: ref(get(
      'WEEDITPRO_SAM31_PRODUCTION_IMAGE_SUPPLY_CHAIN_ADMISSION_ID'), get(
      'WEEDITPRO_SAM31_PRODUCTION_IMAGE_SUPPLY_CHAIN_ADMISSION_SHA256')),
    supplySubmissionRef: ref(get(
      'WEEDITPRO_SAM31_PRODUCTION_IMAGE_SUPPLY_CHAIN_SUBMISSION_ID'), get(
      'WEEDITPRO_SAM31_PRODUCTION_IMAGE_SUPPLY_CHAIN_SUBMISSION_SHA256')),
  }
}

function ref(id: string, sha256: string) {
  return { id, version: 1 as const, contentHash: `sha256:${sha256}` as const }
}
