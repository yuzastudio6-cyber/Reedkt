import { z } from 'zod'

import {
  createCanonicalGcsCurrentGoogleCloudVertexA100RateAuthorityRepository,
} from '../services/canonical-current-google-cloud-vertex-a100-rate-authority-repository'
import {
  publishCanonicalCurrentGoogleCloudVertexA100RateAuthority,
} from '../services/canonical-current-google-cloud-vertex-a100-rate-authority-publisher'
import {
  createGoogleCloudAccountEffectiveVertexA100RateReadPort,
  createWeEditProVertexA100RateReaderConfiguration,
} from '../tool-cost-metering/google-cloud-account-effective-vertex-a100-rate-read-port'

const EXPECTED_JOB = 'weeditpro-vertex-a100-rate-publisher' as const
const PROJECT_ID = 'reeditpro' as const
const CONTROL_PLANE_STATE_BUCKET =
  'reeditpro-production-reeditpro-control-plane-state' as const
const safeRuntimeValue = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const billingAccountResourceName = z.string()
  .regex(/^billingAccounts\/[A-Za-z0-9-]+$/u)

async function main(): Promise<void> {
  assertCloudOperatorInvocation()
  const environment = z.object({
    WEEDITPRO_VERTEX_A100_RATE_OPERATOR_ACTION: z.literal('publish_one'),
    WEEDITPRO_GOOGLE_CLOUD_BILLING_ACCOUNT_RESOURCE_NAME:
      billingAccountResourceName,
  }).strict().parse({
    WEEDITPRO_VERTEX_A100_RATE_OPERATOR_ACTION:
      process.env.WEEDITPRO_VERTEX_A100_RATE_OPERATOR_ACTION,
    WEEDITPRO_GOOGLE_CLOUD_BILLING_ACCOUNT_RESOURCE_NAME:
      process.env.WEEDITPRO_GOOGLE_CLOUD_BILLING_ACCOUNT_RESOURCE_NAME,
  })
  const execution = safeRuntimeValue.parse(process.env.CLOUD_RUN_EXECUTION)
  const configuration = createWeEditProVertexA100RateReaderConfiguration({
    billingAccountResourceName:
      environment.WEEDITPRO_GOOGLE_CLOUD_BILLING_ACCOUNT_RESOURCE_NAME,
  })
  const receipt =
    await publishCanonicalCurrentGoogleCloudVertexA100RateAuthority({
      publicationId: `vertex-a100-us-central1-${execution}`,
      publicationVersion: 1,
      readPort: createGoogleCloudAccountEffectiveVertexA100RateReadPort({
        configuration,
      }),
      repository:
        createCanonicalGcsCurrentGoogleCloudVertexA100RateAuthorityRepository({
          projectId: PROJECT_ID,
          bucketName: CONTROL_PLANE_STATE_BUCKET,
        }),
    })
  process.stdout.write(`${JSON.stringify(receipt)}\n`)
}

function assertCloudOperatorInvocation(): void {
  if (
    process.argv.length !== 3
    || process.argv[2] !== '--execute'
    || process.env.CLOUD_RUN_JOB !== EXPECTED_JOB
    || !safeRuntimeValue.safeParse(process.env.CLOUD_RUN_EXECUTION).success
    || process.env.CLOUD_RUN_TASK_INDEX !== '0'
    || !safeRuntimeValue.safeParse(process.env.CLOUD_RUN_TASK_ATTEMPT).success
  ) throw new Error(
    'Vertex A100 rate publication is restricted to the exact cloud operator.',
  )
}

main().catch((error: unknown) => {
  const code = error instanceof Error
    ? error.message
    : 'vertex_a100_rate_cloud_operator_failed'
  process.stderr.write(`${JSON.stringify({ ok: false, code })}\n`)
  process.exitCode = 1
})
