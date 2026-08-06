import { z } from 'zod'

import {
  canonicalSam31CloudImageBuildSubmissionRef,
  canonicalSam31CloudImageBuildTerminalObservationRef,
  createCanonicalSam31GcpCloudImageBuildRuntime,
} from './canonical-sam3_1-cloud-image-build-runtime'

export const CANONICAL_SAM3_1_CLOUD_IMAGE_BUILD_OPERATOR_VERSION =
  'canonical-sam3_1-cloud-image-build-operator-v1' as const

const id = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/-]*$/u)
  .refine((value) => !value.includes('..') && !value.includes('://'))
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const refSchema = z.object({
  id,
  version: z.literal(1),
  contentHash: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
}).strict()

type Runtime = ReturnType<typeof createCanonicalSam31GcpCloudImageBuildRuntime>

export interface CanonicalSam31CloudImageBuildOperatorResult {
  readonly schemaVersion:
    typeof CANONICAL_SAM3_1_CLOUD_IMAGE_BUILD_OPERATOR_VERSION
  readonly action: 'start' | 'observe'
  readonly disposition: string
  readonly authorityRef: z.infer<typeof refSchema>
  readonly resultRef: z.infer<typeof refSchema>
  readonly providerOutcome: 'executed' | 'not_executed' | 'unknown' | null
  readonly imageBuildKnownStarted: boolean
  readonly imageBuiltAndPushed: boolean
  readonly runtimeReleaseGranted: false
  readonly productionReady: false
  readonly automaticRetryAllowed: false
  readonly developerMachineModelInstallAllowed: false
  readonly modelOrCheckpointBytesReadLocally: false
}

/**
 * Operator bridge for a pre-persisted canonical authority. It can neither
 * accept an authority document nor choose a bucket, URL, image, Dockerfile,
 * model, checkpoint, or retry policy from the command line.
 */
export async function executeCanonicalSam31CloudImageBuildOperator(input: {
  readonly argv: readonly string[]
  readonly environment: Readonly<Record<string, string | undefined>>
  readonly runtime?: Runtime
}): Promise<CanonicalSam31CloudImageBuildOperatorResult> {
  const command = parseCommand(input.argv, input.environment)
  const runtime = input.runtime ?? createCanonicalSam31GcpCloudImageBuildRuntime()
  if (command.action === 'start') {
    const submission = await runtime.startOneImageBuild({
      authorityRef: command.authorityRef,
    })
    return Object.freeze({
      schemaVersion: CANONICAL_SAM3_1_CLOUD_IMAGE_BUILD_OPERATOR_VERSION,
      action: 'start',
      disposition: submission.disposition,
      authorityRef: command.authorityRef,
      resultRef: canonicalSam31CloudImageBuildSubmissionRef(submission),
      providerOutcome: submission.providerOutcome,
      imageBuildKnownStarted: submission.imageBuildKnownStarted,
      imageBuiltAndPushed: false,
      runtimeReleaseGranted: false,
      productionReady: false,
      automaticRetryAllowed: false,
      developerMachineModelInstallAllowed: false,
      modelOrCheckpointBytesReadLocally: false,
    })
  }
  const observation = await runtime.observeOnePersistedImageBuild({
    authorityRef: command.authorityRef,
    submissionRef: command.submissionRef,
  })
  return Object.freeze({
    schemaVersion: CANONICAL_SAM3_1_CLOUD_IMAGE_BUILD_OPERATOR_VERSION,
    action: 'observe',
    disposition: observation.disposition,
    authorityRef: command.authorityRef,
    resultRef:
      canonicalSam31CloudImageBuildTerminalObservationRef(observation),
    providerOutcome: null,
    imageBuildKnownStarted: true,
    imageBuiltAndPushed: observation.imageBuiltAndPushed,
    runtimeReleaseGranted: false,
    productionReady: false,
    automaticRetryAllowed: false,
    developerMachineModelInstallAllowed: false,
    modelOrCheckpointBytesReadLocally: false,
  })
}

function parseCommand(
  argv: readonly string[],
  environment: Readonly<Record<string, string | undefined>>,
): {
  readonly action: 'start'
  readonly authorityRef: z.infer<typeof refSchema>
} | {
  readonly action: 'observe'
  readonly authorityRef: z.infer<typeof refSchema>
  readonly submissionRef: z.infer<typeof refSchema>
} {
  if (environment.WEEDITPRO_CONFIRM_SAM31_CLOUD_BUILD !== 'true') {
    throw new Error('sam3_1_cloud_build_operator_confirmation_missing')
  }
  const allowed = new Set([
    '--execute', '--action', '--authority-id', '--authority-sha256',
    '--submission-id', '--submission-sha256',
  ])
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
    if (!allowed.has(key) || !value || values.has(key)) {
      throw new Error('sam3_1_cloud_build_operator_arguments_invalid')
    }
    values.set(key, value)
  }
  if (executeCount !== 1) {
    throw new Error('sam3_1_cloud_build_operator_execute_flag_missing')
  }
  const action = z.enum(['start', 'observe']).parse(values.get('--action'))
  const authorityRef = refSchema.parse({
    id: values.get('--authority-id'),
    version: 1,
    contentHash: `sha256:${rawSha256.parse(
      values.get('--authority-sha256'),
    )}`,
  })
  const submissionId = values.get('--submission-id')
  const submissionSha256 = values.get('--submission-sha256')
  if (action === 'start') {
    if (submissionId || submissionSha256) {
      throw new Error('sam3_1_cloud_build_start_has_submission_ref')
    }
    return { action, authorityRef }
  }
  return {
    action,
    authorityRef,
    submissionRef: refSchema.parse({
      id: submissionId,
      version: 1,
      contentHash: `sha256:${rawSha256.parse(submissionSha256)}`,
    }),
  }
}
