import { z } from 'zod'

import {
  executeCanonicalSam31CloudImageBuildOperator,
} from '../services/canonical-sam3_1-cloud-image-build-operator'

const EXPECTED_JOB = 'weeditpro-sam31-runtime-image-operator' as const
const actionSchema = z.enum(['start_one', 'observe_one'])
const safeExecutionValue = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const safeOpaqueId = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/-]*$/u)
  .refine((value) => !value.includes('..') && !value.includes('://'))
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const commandEnvironmentSchema = z.object({
  action: actionSchema,
  authorityId: safeOpaqueId,
  authoritySha256: rawSha256,
  submissionId: safeOpaqueId.optional(),
  submissionSha256: rawSha256.optional(),
}).strict().superRefine((value, context) => {
  const observes = value.action === 'observe_one'
  if (
    observes !== Boolean(value.submissionId)
    || observes !== Boolean(value.submissionSha256)
  ) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 runtime image operator lineage is incomplete.',
  })
})

async function main(): Promise<void> {
  assertCloudOperatorInvocation()
  const command = commandEnvironmentSchema.parse({
    action: process.env.WEEDITPRO_SAM31_RUNTIME_IMAGE_OPERATOR_ACTION,
    authorityId:
      process.env.WEEDITPRO_SAM31_RUNTIME_IMAGE_AUTHORITY_ID,
    authoritySha256:
      process.env.WEEDITPRO_SAM31_RUNTIME_IMAGE_AUTHORITY_SHA256,
    submissionId:
      process.env.WEEDITPRO_SAM31_RUNTIME_IMAGE_SUBMISSION_ID,
    submissionSha256:
      process.env.WEEDITPRO_SAM31_RUNTIME_IMAGE_SUBMISSION_SHA256,
  })
  const argv = [
    '--execute',
    `--action=${command.action === 'start_one' ? 'start' : 'observe'}`,
    `--authority-id=${command.authorityId}`,
    `--authority-sha256=${command.authoritySha256}`,
    ...(command.action === 'observe_one'
      ? [
          `--submission-id=${command.submissionId}`,
          `--submission-sha256=${command.submissionSha256}`,
        ]
      : []),
  ]
  const result = await executeCanonicalSam31CloudImageBuildOperator({
    argv,
    environment: {
      ...process.env,
      WEEDITPRO_CONFIRM_SAM31_CLOUD_BUILD: 'true',
    },
  })
  process.stdout.write(`${JSON.stringify(result)}\n`)
  const accepted = command.action === 'start_one'
    ? result.disposition === 'submitted'
    : result.disposition === 'pending'
      || result.disposition ===
        'image_built_pending_scan_signature_and_gpu_qualification'
      || result.disposition === 'terminal_failure'
  if (!accepted) process.exitCode = 1
}

function assertCloudOperatorInvocation(): void {
  if (
    process.argv.length !== 3
    || process.argv[2] !== '--execute'
    || process.env.CLOUD_RUN_JOB !== EXPECTED_JOB
    || !safeExecutionValue.safeParse(process.env.CLOUD_RUN_EXECUTION).success
    || process.env.CLOUD_RUN_TASK_INDEX !== '0'
    || !safeExecutionValue.safeParse(process.env.CLOUD_RUN_TASK_ATTEMPT).success
  ) throw new Error(
    'SAM 3.1 runtime image build is restricted to the exact cloud operator.',
  )
}

main().catch((error: unknown) => {
  const code = error instanceof Error
    ? error.message
    : 'sam3_1_runtime_image_cloud_operator_failed'
  process.stderr.write(`${JSON.stringify({ ok: false, code })}\n`)
  process.exitCode = 1
})
