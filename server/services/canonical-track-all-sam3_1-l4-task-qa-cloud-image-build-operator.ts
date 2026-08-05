import { z } from 'zod'

import {
  canonicalTrackAllSam31L4TaskQaCloudImageBuildSubmissionRef,
} from './canonical-track-all-sam3_1-l4-task-qa-cloud-image-build-service'
import {
  createCanonicalTrackAllSam31L4TaskQaGcpCloudImageBuildRuntime,
} from './canonical-track-all-sam3_1-l4-task-qa-cloud-image-build-runtime'

export const CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_CLOUD_IMAGE_BUILD_OPERATOR_VERSION =
  'canonical-track-all-sam3_1-l4-task-qa-cloud-image-build-operator-v1' as const

const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const safeId = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/+-]*$/u)
  .refine((value) => !value.includes('..') && !value.includes('://'))
const refSchema = z.object({
  id: safeId,
  version: z.literal(1),
  contentHash: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
}).strict()
type Runtime = ReturnType<
  typeof createCanonicalTrackAllSam31L4TaskQaGcpCloudImageBuildRuntime
>

export async function executeCanonicalTrackAllSam31L4TaskQaCloudImageBuildOperator(
  input: {
    readonly argv: readonly string[]
    readonly environment: Readonly<Record<string, string | undefined>>
    readonly runtime?: Runtime
  },
) {
  const authorityRef = parseCommand(input.argv, input.environment)
  const runtime = input.runtime
    ?? createCanonicalTrackAllSam31L4TaskQaGcpCloudImageBuildRuntime()
  const submission = await runtime.startOneImageBuild({ authorityRef })
  return Object.freeze({
    schemaVersion:
      CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_CLOUD_IMAGE_BUILD_OPERATOR_VERSION,
    action: 'start' as const,
    disposition: submission.disposition,
    authorityRef,
    submissionRef:
      canonicalTrackAllSam31L4TaskQaCloudImageBuildSubmissionRef(submission),
    providerOutcome: submission.providerOutcome,
    imageBuildKnownStarted: submission.imageBuildKnownStarted,
    automaticRetryAllowed: false as const,
    callerImageTagPathCommandEnvironmentOrBuildArgsAccepted: false as const,
    developerMachineModelInstallAllowed: false as const,
    checkpointOrModelWeightsRead: false as const,
    imagePushKnownCompleted: false as const,
    runtimeReleaseGranted: false as const,
    gpuJobDispatched: false as const,
    customerCreditsMutated: false as const,
    productionReady: false as const,
  })
}

function parseCommand(
  argv: readonly string[],
  environment: Readonly<Record<string, string | undefined>>,
) {
  if (environment.WEEDITPRO_CONFIRM_TRACK_ALL_L4_TASK_QA_CLOUD_BUILD
    !== 'start-weeditpro-track-all-l4-task-qa-cloud-build-v1') {
    throw new Error('track_all_l4_cloud_build_confirmation_missing')
  }
  const values = new Map<string, string>()
  let executeCount = 0
  for (const argument of argv) {
    if (argument === '--execute') {
      executeCount += 1
      continue
    }
    const separator = argument.indexOf('=')
    const key = separator > 0 ? argument.slice(0, separator) : argument
    const value = separator > 0 ? argument.slice(separator + 1) : ''
    if (!['--authority-id', '--authority-sha256'].includes(key)
      || !value || values.has(key)) {
      throw new Error('track_all_l4_cloud_build_arguments_invalid')
    }
    values.set(key, value)
  }
  if (executeCount !== 1 || values.size !== 2) {
    throw new Error('track_all_l4_cloud_build_execute_flag_missing')
  }
  return refSchema.parse({
    id: values.get('--authority-id'),
    version: 1,
    contentHash: `sha256:${rawSha256.parse(
      values.get('--authority-sha256'),
    )}`,
  })
}
