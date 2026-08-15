import { z } from 'zod'

import {
  createCanonicalSam31QualificationImageSupplyChainWorkspaceSuccessorAdmission,
  qualificationImageSupplyChainObservationReference,
  qualificationImageSupplyChainSubmissionReference,
} from '../services/canonical-sam3_1-qualification-image-supply-chain-build-phase'
import {
  createCanonicalSam31GcpQualificationImageSupplyChainBuildRuntime,
} from '../services/canonical-sam3_1-qualification-image-supply-chain-build-runtime'
import {
  createCanonicalSam31GcpQualificationImageBuildRuntime,
} from '../services/canonical-sam3_1-qualification-image-build-runtime'

const CONFIRMATION =
  'start-one-sam31-qualification-image-supply-chain-workspace-successor' as const
const safeId = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/+-]*$/u)
  .refine((value) => !value.includes('..') && !value.includes('://'))
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)

if (
  process.env.WEEDITPRO_SAM31_QUALIFICATION_IMAGE_SUPPLY_CHAIN_SUCCESSOR_CONFIRMATION
    !== CONFIRMATION
) throw new Error('SAM 3.1 supply-chain successor confirmation missing.')

const imageBuildRuntime = createCanonicalSam31GcpQualificationImageBuildRuntime()
const supplyRuntime =
  createCanonicalSam31GcpQualificationImageSupplyChainBuildRuntime()
const authorityRef = readRef('WEEDITPRO_SAM31_QUALIFICATION_IMAGE_AUTHORITY')
const imageSubmissionRef = readRef(
  'WEEDITPRO_SAM31_QUALIFICATION_IMAGE_SUBMISSION',
)
const imageTerminalRef = readRef('WEEDITPRO_SAM31_QUALIFICATION_IMAGE_TERMINAL')
const predecessorAdmissionRef = readRef(
  'WEEDITPRO_SAM31_QUALIFICATION_IMAGE_SUPPLY_CHAIN_PREDECESSOR_ADMISSION',
)
const predecessorSubmissionRef = readRef(
  'WEEDITPRO_SAM31_QUALIFICATION_IMAGE_SUPPLY_CHAIN_PREDECESSOR_SUBMISSION',
)
const predecessorObservationRef = readRef(
  'WEEDITPRO_SAM31_QUALIFICATION_IMAGE_SUPPLY_CHAIN_PREDECESSOR_OBSERVATION',
)

const [
  authority,
  imageSubmission,
  imageTerminal,
  predecessorAdmission,
  predecessorSubmission,
  predecessorObservation,
] = await Promise.all([
  imageBuildRuntime.repository.rereadQualificationImageBuildAuthority({
    authorityRef,
  }),
  imageBuildRuntime.repository.rereadSubmission({
    submissionRef: imageSubmissionRef,
  }),
  imageBuildRuntime.repository.rereadTerminal({
    terminalRef: imageTerminalRef,
  }),
  supplyRuntime.repository.rereadQualificationImageSupplyChainAdmission({
    admissionRef: predecessorAdmissionRef,
  }),
  supplyRuntime.repository.rereadSubmission({
    submissionRef: predecessorSubmissionRef,
  }),
  supplyRuntime.repository.rereadTerminalForSubmission({
    submissionRef: predecessorSubmissionRef,
  }),
])
if (
  !authority
  || !imageSubmission
  || !imageTerminal
  || !predecessorAdmission
  || !predecessorSubmission
  || !predecessorObservation
) throw new Error('SAM 3.1 supply-chain successor lineage is absent.')
if (
  !sameRef(
    qualificationImageSupplyChainSubmissionReference(predecessorSubmission),
    predecessorSubmissionRef,
  )
  || !sameRef(
    qualificationImageSupplyChainObservationReference(predecessorObservation),
    predecessorObservationRef,
  )
) throw new Error('SAM 3.1 supply-chain predecessor refs changed.')

const admission =
  createCanonicalSam31QualificationImageSupplyChainWorkspaceSuccessorAdmission({
    authority,
    imageBuildSubmission: imageSubmission,
    imageBuildTerminal: imageTerminal,
    predecessorAdmission,
    predecessorSubmission,
    predecessorObservation,
    admittedAt: new Date().toISOString(),
  })
const admissionRef = await supplyRuntime.persistAdmissionCreateOnly({ admission })
const submission = await supplyRuntime.startOneSupplyChainBuild({ admissionRef })

console.log(JSON.stringify({
  predecessorObservationRef,
  admissionRef,
  submission,
  submissionRef: qualificationImageSupplyChainSubmissionReference(submission),
  automaticRetryAllowed: false,
  developerMachineModelInstallOrExecution: false,
  gpuQualificationJobDispatched: false,
  customerCreditsMutated: false,
  runtimeReleaseGranted: false,
}, null, 2))

function readRef(prefix: string) {
  return {
    id: safeId.parse(process.env[`${prefix}_ID`]),
    version: 1 as const,
    contentHash: `sha256:${rawSha256.parse(
      process.env[`${prefix}_SHA256`],
    )}` as const,
  }
}

function sameRef(
  left: { readonly id: string; readonly version: number; readonly contentHash: string },
  right: { readonly id: string; readonly version: number; readonly contentHash: string },
): boolean {
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
}
