import { z } from 'zod'

import {
  reconcileCanonicalSam31VertexQualificationFromEnvironment,
  startCanonicalSam31VertexQualificationFromEnvironment,
} from './canonical-sam3_1-source-checkpoint-qualification-vertex-operator'

const EXPECTED_JOB = 'weeditpro-sam31-vertex-operator' as const
const actionSchema = z.enum(['start_one', 'reconcile_one'])
const safeRuntimeValue = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))

async function main(): Promise<void> {
  assertCloudOperatorInvocation()
  const action = actionSchema.parse(
    process.env.WEEDITPRO_SAM31_VERTEX_OPERATOR_ACTION,
  )
  const result = action === 'start_one'
    ? await startCanonicalSam31VertexQualificationFromEnvironment(process.env)
    : await reconcileCanonicalSam31VertexQualificationFromEnvironment(
      process.env,
    )
  process.stdout.write(`${JSON.stringify(result)}\n`)
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
    'SAM 3.1 Vertex qualification is restricted to the exact cloud operator.',
  )
}

main().catch((error: unknown) => {
  const code = error instanceof Error
    ? error.message
    : 'sam3_1_vertex_qualification_cloud_operator_failed'
  process.stderr.write(`${JSON.stringify({ ok: false, code })}\n`)
  process.exitCode = 1
})
