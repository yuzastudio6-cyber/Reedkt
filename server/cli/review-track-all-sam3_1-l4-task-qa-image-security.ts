import { z } from 'zod'

import {
  canonicalTrackAllSam31L4TaskQaCloudImageBuildTerminalRef,
} from '../services/canonical-track-all-sam3_1-l4-task-qa-cloud-image-build-observation'
import {
  createCanonicalTrackAllSam31L4TaskQaGcpCloudImageBuildObservationRuntime,
} from '../services/canonical-track-all-sam3_1-l4-task-qa-cloud-image-build-observation-runtime'
import {
  createCanonicalTrackAllSam31L4TaskQaGcpCloudImageBuildRuntime,
} from '../services/canonical-track-all-sam3_1-l4-task-qa-cloud-image-build-runtime'
import {
  imageSupplyChainTerminalRef,
} from '../services/canonical-track-all-sam3_1-l4-task-qa-image-supply-chain-build'
import {
  createCanonicalTrackAllSam31L4TaskQaGcpImageSupplyChainBuildRuntime,
} from '../services/canonical-track-all-sam3_1-l4-task-qa-image-supply-chain-build-runtime'
import {
  createCanonicalTrackAllSam31L4TaskQaGcpImageSecurityReviewRuntime,
  TRACK_ALL_SAM3_1_L4_TASK_QA_IMAGE_SECURITY_REVIEW_CONFIRMATION,
} from '../services/canonical-track-all-sam3_1-l4-task-qa-image-security-review-operator'

const safeId = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/+-]*$/u)
  .refine((value) => !value.includes('..') && !value.includes('://'))
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)

async function main() {
  if (process.env.WEEDITPRO_CONFIRM_TRACK_ALL_L4_TASK_QA_IMAGE_SECURITY_REVIEW
    !== TRACK_ALL_SAM3_1_L4_TASK_QA_IMAGE_SECURITY_REVIEW_CONFIRMATION) {
    throw new Error('track_all_l4_security_review_confirmation_missing')
  }
  const args = parseArguments(process.argv.slice(2))
  const imageRuntime =
    createCanonicalTrackAllSam31L4TaskQaGcpCloudImageBuildRuntime()
  const observationRuntime =
    createCanonicalTrackAllSam31L4TaskQaGcpCloudImageBuildObservationRuntime()
  const supplyRuntime =
    createCanonicalTrackAllSam31L4TaskQaGcpImageSupplyChainBuildRuntime()
  const imageAuthorityRef = ref(
    args['image-authority-id'], args['image-authority-sha256'],
  )
  const imageSubmissionRef = ref(
    args['image-submission-id'], args['image-submission-sha256'],
  )
  const imageTerminalRef = ref(
    args['image-terminal-id'], args['image-terminal-sha256'],
  )
  const supplyAdmissionRef = ref(
    args['supply-admission-id'], args['supply-admission-sha256'],
  )
  const supplySubmissionRef = ref(
    args['supply-submission-id'], args['supply-submission-sha256'],
  )
  const supplyTerminalRef = ref(
    args['supply-terminal-id'], args['supply-terminal-sha256'],
  )
  const [
    imageBuildAuthority,
    imageBuildSubmission,
    imageBuildTerminal,
    supplyChainAdmission,
    supplyChainSubmission,
    supplyChainTerminal,
  ] = await Promise.all([
    imageRuntime.repository.rereadBuildAuthority({
      authorityRef: imageAuthorityRef,
    }),
    imageRuntime.repository.rereadSubmission({
      submissionRef: imageSubmissionRef,
    }),
    observationRuntime.repository.rereadTerminal({
      terminalRef: imageTerminalRef,
    }),
    supplyRuntime.repository.rereadAdmission({
      admissionRef: supplyAdmissionRef,
    }),
    supplyRuntime.repository.rereadSubmission({
      submissionRef: supplySubmissionRef,
    }),
    supplyRuntime.repository.rereadTerminalForSubmission({
      submissionRef: supplySubmissionRef,
    }),
  ])
  if (!imageBuildAuthority
    || !imageBuildSubmission
    || !imageBuildTerminal
    || !supplyChainAdmission
    || !supplyChainSubmission
    || !supplyChainTerminal
    || !sameRef(
      imageTerminalRef,
      canonicalTrackAllSam31L4TaskQaCloudImageBuildTerminalRef(
        imageBuildTerminal,
      ),
    )
    || !sameRef(supplyTerminalRef, imageSupplyChainTerminalRef(
      supplyChainTerminal,
    ))) {
    throw new Error('track_all_l4_security_review_lineage_missing')
  }
  const runtime =
    createCanonicalTrackAllSam31L4TaskQaGcpImageSecurityReviewRuntime()
  const result = await runtime.operator.review({
    confirmation:
      TRACK_ALL_SAM3_1_L4_TASK_QA_IMAGE_SECURITY_REVIEW_CONFIRMATION,
    imageBuildAuthority,
    imageBuildSubmission,
    imageBuildTerminal,
    supplyChainAdmission,
    supplyChainSubmission,
    supplyChainTerminal,
  })
  process.stdout.write(`${JSON.stringify(result)}\n`)
}

function parseArguments(values: readonly string[]) {
  const parsed: Record<string, string> = {}
  for (const value of values.filter((item) => item !== '--')) {
    const match = /^--([a-z0-9-]+)=(.+)$/u.exec(value)
    if (!match || parsed[match[1]]) {
      throw new Error('track_all_l4_security_review_arguments_invalid')
    }
    parsed[match[1]] = match[2]
  }
  const expected = [
    'image-authority-id', 'image-authority-sha256',
    'image-submission-id', 'image-submission-sha256',
    'image-terminal-id', 'image-terminal-sha256',
    'supply-admission-id', 'supply-admission-sha256',
    'supply-submission-id', 'supply-submission-sha256',
    'supply-terminal-id', 'supply-terminal-sha256',
  ]
  if (Object.keys(parsed).sort().join(',') !== expected.sort().join(',')) {
    throw new Error('track_all_l4_security_review_arguments_invalid')
  }
  return Object.fromEntries(Object.entries(parsed).map(([key, value]) => [
    key,
    key.endsWith('-id') ? safeId.parse(value) : rawSha256.parse(value),
  ])) as Record<(typeof expected)[number], string>
}

function ref(id: string, hash: string) {
  return {
    id: safeId.parse(id),
    version: 1 as const,
    contentHash: `sha256:${rawSha256.parse(hash)}` as const,
  }
}

function sameRef(
  left: { readonly id: string; readonly version: number; readonly contentHash: string },
  right: { readonly id: string; readonly version: number; readonly contentHash: string },
) {
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error
    ? error.message : 'track_all_l4_security_review_failed'}\n`)
  process.exitCode = 1
})
