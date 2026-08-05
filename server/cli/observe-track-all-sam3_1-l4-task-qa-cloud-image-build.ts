import { z } from 'zod'

import {
  createCanonicalTrackAllSam31L4TaskQaGcpCloudImageBuildObservationRuntime,
} from '../services/canonical-track-all-sam3_1-l4-task-qa-cloud-image-build-observation-runtime'

const CONFIRMATION =
  'observe-weeditpro-track-all-l4-task-qa-cloud-image-build-v1'
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const safeId = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/+-]*$/u)
  .refine((value) => !value.includes('..') && !value.includes('://'))

async function main(): Promise<void> {
  if (process.env.WEEDITPRO_CONFIRM_TRACK_ALL_L4_TASK_QA_BUILD_OBSERVATION
    !== CONFIRMATION) {
    throw new Error('track_all_l4_build_observation_confirmation_missing')
  }
  const argumentsByName = parseArguments(
    process.argv.filter((value) => value !== '--' && value.startsWith('--')),
  )
  const runtime =
    createCanonicalTrackAllSam31L4TaskQaGcpCloudImageBuildObservationRuntime()
  if (argumentsByName.mode === 'reconcile') {
    const submissionId = safeId.parse(argumentsByName['submission-id'])
    const submissionHash = rawSha256.parse(
      argumentsByName['submission-sha256'],
    )
    const result = await runtime.reconcileUnknownSubmission({
      reconciliationId:
        `track-all-l4-cloud-build-reconciliation-${submissionHash.slice(0, 24)}`,
      submissionRef: {
        id: submissionId,
        version: 1,
        contentHash: `sha256:${submissionHash}`,
      },
    })
    process.stdout.write(`${JSON.stringify({
      ...result,
      automaticRetryAllowed: false,
      runtimeReleaseGranted: false,
      gpuJobDispatched: false,
      customerCreditsMutated: false,
      productionReady: false,
    })}\n`)
    return
  }
  const reconciliationId = safeId.parse(argumentsByName['reconciliation-id'])
  const reconciliationHash = rawSha256.parse(
    argumentsByName['reconciliation-sha256'],
  )
  const result = await runtime.observeTerminal({
    terminalId:
      `track-all-l4-cloud-build-terminal-${reconciliationHash.slice(0, 24)}`,
    reconciliationRef: {
      id: reconciliationId,
      version: 1,
      contentHash: `sha256:${reconciliationHash}`,
    },
  })
  process.stdout.write(`${JSON.stringify({
    ...result,
    automaticRetryAllowed: false,
    runtimeReleaseGranted: false,
    gpuJobDispatched: false,
    customerCreditsMutated: false,
    productionReady: false,
  })}\n`)
}

function parseArguments(values: readonly string[]): Record<string, string> & {
  readonly mode: 'reconcile' | 'terminal'
} {
  const parsed: Record<string, string> = {}
  for (const value of values) {
    const match = /^--([a-z-]+)=(.+)$/u.exec(value)
    if (!match || parsed[match[1]]) {
      throw new Error('track_all_l4_build_observation_arguments_invalid')
    }
    parsed[match[1]] = match[2]
  }
  const mode = z.enum(['reconcile', 'terminal']).parse(parsed.mode)
  const expected = mode === 'reconcile'
    ? ['mode', 'submission-id', 'submission-sha256']
    : ['mode', 'reconciliation-id', 'reconciliation-sha256']
  if (Object.keys(parsed).sort().join(',') !== expected.sort().join(',')) {
    throw new Error('track_all_l4_build_observation_arguments_invalid')
  }
  return { ...parsed, mode }
}

main().catch((error: unknown) => {
  const message = error instanceof Error
    ? error.message : 'track_all_l4_build_observation_failed'
  process.stderr.write(`${z.string().max(500).catch(
    'track_all_l4_build_observation_failed',
  ).parse(message)}\n`)
  process.exitCode = 1
})
