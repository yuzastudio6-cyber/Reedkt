import { z } from 'zod'

import {
  createCanonicalSam31QualificationImageSupplyChainAdmission,
  qualificationImageSupplyChainSubmissionReference,
} from '../services/canonical-sam3_1-qualification-image-supply-chain-build-phase'
import {
  createCanonicalSam31GcpQualificationImageSupplyChainBuildRuntime,
} from '../services/canonical-sam3_1-qualification-image-supply-chain-build-runtime'
import {
  createCanonicalSam31GcpQualificationImageBuildRuntime,
} from '../services/canonical-sam3_1-qualification-image-build-runtime'

const CONFIRMATION =
  'start-one-sam31-qualification-image-supply-chain-build' as const
const safeId = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/+-]*$/u)
  .refine((value) => !value.includes('..') && !value.includes('://'))
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const kmsKeyVersion = z.string().regex(
  /^projects\/reeditpro\/locations\/us-central1\/keyRings\/weeditpro-image-signing\/cryptoKeys\/sam31-image-signing\/cryptoKeyVersions\/[1-9][0-9]*$/u,
)

if (
  process.env.WEEDITPRO_SAM31_QUALIFICATION_IMAGE_SUPPLY_CHAIN_CONFIRMATION !==
    CONFIRMATION
) throw new Error('SAM 3.1 supply-chain build confirmation missing.')

const authorityRef = readRef('AUTHORITY')
const submissionRef = readRef('SUBMISSION')
const terminalRef = readRef('TERMINAL')
const imageBuildRuntime = createCanonicalSam31GcpQualificationImageBuildRuntime()
const [authority, imageBuildSubmission, imageBuildTerminal] =
  await Promise.all([
    imageBuildRuntime.repository.rereadQualificationImageBuildAuthority({
      authorityRef,
    }),
    imageBuildRuntime.repository.rereadSubmission({ submissionRef }),
    imageBuildRuntime.repository.rereadTerminal({ terminalRef }),
  ])
if (!authority || !imageBuildSubmission || !imageBuildTerminal) {
  throw new Error('SAM 3.1 qualification image lineage is absent.')
}
const runtime =
  createCanonicalSam31GcpQualificationImageSupplyChainBuildRuntime()
const admission = createCanonicalSam31QualificationImageSupplyChainAdmission({
  admissionId:
    `sam31-qualification-image-supply-chain-${imageBuildTerminal.observationHash.slice(0, 24)}`,
  authority,
  imageBuildSubmission,
  imageBuildTerminal,
  kmsKeyVersionResource: kmsKeyVersion.parse(
    process.env.WEEDITPRO_SAM31_IMAGE_SIGNING_KMS_KEY_VERSION,
  ),
  admittedAt: new Date().toISOString(),
})
const admissionRef = await runtime.persistAdmissionCreateOnly({ admission })
const submission = await runtime.startOneSupplyChainBuild({ admissionRef })

console.log(JSON.stringify({
  admissionRef,
  submission,
  submissionRef:
    qualificationImageSupplyChainSubmissionReference(submission),
  developerMachineModelInstallOrExecution: false,
  gpuQualificationJobDispatched: false,
  customerCreditsMutated: false,
  runtimeReleaseGranted: false,
}, null, 2))

function readRef(kind: 'AUTHORITY' | 'SUBMISSION' | 'TERMINAL') {
  return {
    id: safeId.parse(
      process.env[`WEEDITPRO_SAM31_QUALIFICATION_IMAGE_${kind}_ID`],
    ),
    version: 1 as const,
    contentHash: `sha256:${rawSha256.parse(
      process.env[`WEEDITPRO_SAM31_QUALIFICATION_IMAGE_${kind}_SHA256`],
    )}` as const,
  }
}
