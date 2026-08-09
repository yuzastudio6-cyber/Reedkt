import { z } from 'zod'

import {
  createCanonicalSam31GcpCloudImageBuildRuntime,
} from '../services/canonical-sam3_1-cloud-image-build-runtime'
import {
  createCanonicalSam31GcpImageSupplyChainBuildRuntime,
} from '../services/canonical-sam3_1-cloud-image-supply-chain-build-runtime'
import {
  createCanonicalSam31GcpImageSupplyChainEvidenceReadPort,
} from '../services/canonical-sam3_1-cloud-image-supply-chain-evidence-read-service'
import {
  createCanonicalSam31GcpImageSupplyChainReleaseRepository,
  prepareAndPersistCanonicalSam31CloudImageSupplyChainRelease,
} from '../services/canonical-sam3_1-cloud-image-supply-chain-release-runtime'

const CONFIRMATION =
  'publish-one-weeditpro-sam31-production-image-supply-chain-release-v1' as const
const environment = environmentSchema().parse(process.env)
const refs = readRefs(environment)
const imageRuntime = createCanonicalSam31GcpCloudImageBuildRuntime()
const supplyRuntime = createCanonicalSam31GcpImageSupplyChainBuildRuntime()
const [authority, submission, terminalObservation, supplyChainBuildAdmission,
  supplyChainBuildSubmission, supplyChainBuildObservation] = await Promise.all([
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
if (!authority || !submission || !terminalObservation
  || !supplyChainBuildAdmission || !supplyChainBuildSubmission
  || !supplyChainBuildObservation) {
  throw new Error('SAM 3.1 production supply-chain release lineage is absent.')
}
const releaseRepository =
  createCanonicalSam31GcpImageSupplyChainReleaseRepository()
const evidenceReadPort =
  createCanonicalSam31GcpImageSupplyChainEvidenceReadPort({
    imageBuildAuthority: authority,
    imageBuildSubmission: submission,
    imageBuildTerminalObservation: terminalObservation,
    supplyChainBuildAdmission,
    supplyChainBuildSubmission,
    supplyChainBuildObservation,
    securityReviewReadPort: releaseRepository,
  })
const release = await prepareAndPersistCanonicalSam31CloudImageSupplyChainRelease({
  releaseId:
    `sam31-production-image-supply-chain-release-${supplyChainBuildObservation.observationHash.slice(0, 24)}`,
  authority,
  submission,
  terminalObservation,
  evidenceReadPort,
  qualifiedAt: new Date().toISOString(),
  repository: releaseRepository,
})
process.stdout.write(`${JSON.stringify({
  release,
  releaseRef: {
    id: release.releaseId,
    version: release.releaseVersion,
    contentHash: `sha256:${release.releaseHash}`,
  },
  gpuJobDispatched: false,
  modelOrCheckpointExecuted: false,
  customerCreditsMutated: false,
  runtimeReleaseGranted: false,
  productionReady: false,
})}\n`)

function environmentSchema() {
  const safeId = z.string().trim().min(1).max(512)
    .regex(/^[A-Za-z0-9][A-Za-z0-9._:/+-]*$/u)
    .refine((value) => !value.includes('..') && !value.includes('://'))
  const sha = z.string().regex(/^[a-f0-9]{64}$/u)
  return z.object({
    WEEDITPRO_SAM31_PRODUCTION_IMAGE_SUPPLY_CHAIN_RELEASE_CONFIRMATION:
      z.literal(CONFIRMATION),
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
