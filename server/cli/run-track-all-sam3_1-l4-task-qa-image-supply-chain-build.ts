import { z } from 'zod'

import {
  createCanonicalTrackAllSam31L4TaskQaGcpCloudImageBuildRuntime,
} from '../services/canonical-track-all-sam3_1-l4-task-qa-cloud-image-build-runtime'
import {
  createCanonicalTrackAllSam31L4TaskQaGcpCloudImageBuildObservationRuntime,
} from '../services/canonical-track-all-sam3_1-l4-task-qa-cloud-image-build-observation-runtime'
import {
  createCanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildAdmission,
} from '../services/canonical-track-all-sam3_1-l4-task-qa-image-supply-chain-build'
import {
  createCanonicalTrackAllSam31L4TaskQaGcpImageSupplyChainBuildRuntime,
} from '../services/canonical-track-all-sam3_1-l4-task-qa-image-supply-chain-build-runtime'

const CONFIRMATION =
  'run-weeditpro-track-all-l4-task-qa-image-supply-chain-build-v1'
const safeId = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/+-]*$/u)
  .refine((value) => !value.includes('..') && !value.includes('://'))
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)

async function main(): Promise<void> {
  if (process.env.WEEDITPRO_CONFIRM_TRACK_ALL_L4_TASK_QA_SUPPLY_CHAIN_BUILD
    !== CONFIRMATION) {
    throw new Error('track_all_l4_supply_chain_confirmation_missing')
  }
  const args = parseArguments(process.argv.slice(2))
  const supplyRuntime =
    createCanonicalTrackAllSam31L4TaskQaGcpImageSupplyChainBuildRuntime()
  if (args.phase === 'observe') {
    const terminal = await supplyRuntime.observe({
      submissionRef: ref(
        safeId.parse(args['submission-id']),
        rawSha256.parse(args['submission-sha256']),
      ),
    })
    process.stdout.write(`${JSON.stringify({
      terminal,
      runtimeReleaseGranted: false,
      gpuJobDispatched: false,
      customerCreditsMutated: false,
      productionReady: false,
    })}\n`)
    return
  }

  const imageRuntime =
    createCanonicalTrackAllSam31L4TaskQaGcpCloudImageBuildRuntime()
  const observationRuntime =
    createCanonicalTrackAllSam31L4TaskQaGcpCloudImageBuildObservationRuntime()
  const authorityRef = ref(
    safeId.parse(args['image-authority-id']),
    rawSha256.parse(args['image-authority-sha256']),
  )
  const imageSubmissionRef = ref(
    safeId.parse(args['image-submission-id']),
    rawSha256.parse(args['image-submission-sha256']),
  )
  const imageTerminalRef = ref(
    safeId.parse(args['image-terminal-id']),
    rawSha256.parse(args['image-terminal-sha256']),
  )
  const [authority, imageBuildSubmission, imageBuildTerminal] =
    await Promise.all([
      imageRuntime.repository.rereadBuildAuthority({ authorityRef }),
      imageRuntime.repository.rereadSubmission({
        submissionRef: imageSubmissionRef,
      }),
      observationRuntime.repository.rereadTerminal({
        terminalRef: imageTerminalRef,
      }),
    ])
  if (!authority || !imageBuildSubmission || !imageBuildTerminal) {
    throw new Error('track_all_l4_supply_chain_image_lineage_missing')
  }
  const admission =
    createCanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildAdmission({
      admissionId:
        `track-all-l4-image-supply-chain-${imageBuildTerminal.terminalHash.slice(0, 24)}`,
      authority,
      imageBuildSubmission,
      imageBuildTerminal,
      admittedAt: new Date().toISOString(),
    })
  const admissionRef = await supplyRuntime.persistAdmissionCreateOnly({
    admission,
  })
  const submission = await supplyRuntime.start({ admissionRef })
  process.stdout.write(`${JSON.stringify({
    admissionRef,
    submission,
    automaticRetryAllowed: false,
    runtimeReleaseGranted: false,
    gpuJobDispatched: false,
    customerCreditsMutated: false,
    productionReady: false,
  })}\n`)
}

function parseArguments(values: readonly string[]):
  Record<string, string> & { readonly phase: 'start' | 'observe' } {
  const parsed: Record<string, string> = {}
  for (const value of values.filter((item) => item !== '--')) {
    const match = /^--([a-z0-9-]+)=(.+)$/u.exec(value)
    if (!match || parsed[match[1]]) {
      throw new Error('track_all_l4_supply_chain_arguments_invalid')
    }
    parsed[match[1]] = match[2]
  }
  const phase = z.enum(['start', 'observe']).parse(parsed.phase)
  const expected = phase === 'start'
    ? [
      'phase', 'image-authority-id', 'image-authority-sha256',
      'image-submission-id', 'image-submission-sha256',
      'image-terminal-id', 'image-terminal-sha256',
    ]
    : ['phase', 'submission-id', 'submission-sha256']
  if (Object.keys(parsed).sort().join(',') !== expected.sort().join(',')) {
    throw new Error('track_all_l4_supply_chain_arguments_invalid')
  }
  return Object.assign(parsed, { phase })
}

function ref(id: string, hash: string) {
  return {
    id,
    version: 1 as const,
    contentHash: `sha256:${hash}` as const,
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error
    ? error.message : 'track_all_l4_supply_chain_failed'}\n`)
  process.exitCode = 1
})
