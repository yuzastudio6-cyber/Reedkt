import { execFile } from 'node:child_process'
import { fileURLToPath } from 'node:url'

import { z } from 'zod'

import {
  createCanonicalGcsSam31A100QualificationFoundationRepository,
  publishCanonicalSam31A100QualificationFoundation,
} from '../services/canonical-sam3_1-a100-qualification-foundation-repository'

const PROJECT_ID = 'reeditpro' as const
const CONTROL_PLANE_BUCKET =
  'reeditpro-production-reeditpro-control-plane-state' as const
const CONFIRMATION =
  'publish-current-sam31-a100-foundation-observation' as const
const AUDIT_SCRIPT = fileURLToPath(new URL(
  '../../scripts/gcp/prod/16-audit-visual-intelligence-live-prerequisites.sh',
  import.meta.url,
))
const MAXIMUM_AUDIT_BYTES = 4 * 1024 * 1024

async function main(): Promise<void> {
  assertOperatorInvocation()
  const audit = await runFixedLiveAudit()
  let consumed = false
  const publishedAt = new Date().toISOString()
  const receipt = await publishCanonicalSam31A100QualificationFoundation({
    liveAuditReadPort: {
      async rereadExactLivePrerequisiteAudit() {
        if (consumed) {
          throw new Error('SAM 3.1 A100 live audit was already consumed.')
        }
        consumed = true
        return structuredClone(audit)
      },
    },
    repository:
      createCanonicalGcsSam31A100QualificationFoundationRepository({
        projectId: PROJECT_ID,
        bucketName: CONTROL_PLANE_BUCKET,
      }),
    publishedAt,
  })
  process.stdout.write(`${JSON.stringify({
    operation: 'publish_sam3_1_a100_qualification_foundation',
    status: 'published',
    disposition: receipt.disposition,
    observationRef: receipt.observationRef,
    observedAt: receipt.observation.observedAt,
    resourceFoundationReady: receipt.observation.resourceFoundationReady,
    dispatchCapacityReady:
      receipt.observation.capacity.dispatchCapacityReady,
    scaleFromZeroClean: receipt.observation.scaleFromZeroClean,
    gpuJobStarted: receipt.gpuJobStarted,
    modelOrCheckpointDownloaded: receipt.modelOrCheckpointDownloaded,
    customerCreditsMutated: receipt.customerCreditsMutated,
    productionAuthorityGranted: receipt.productionAuthorityGranted,
  })}\n`)
}

function assertOperatorInvocation(): void {
  const configuration = z.object({
    GOOGLE_CLOUD_PROJECT_ID: z.literal(PROJECT_ID),
    GCS_CONTROL_PLANE_STATE_BUCKET: z.literal(CONTROL_PLANE_BUCKET),
    WEEDITPRO_SAM31_A100_FOUNDATION_OBSERVATION_CONFIRM:
      z.literal(CONFIRMATION),
  }).strict().parse({
    GOOGLE_CLOUD_PROJECT_ID: process.env.GOOGLE_CLOUD_PROJECT_ID,
    GCS_CONTROL_PLANE_STATE_BUCKET:
      process.env.GCS_CONTROL_PLANE_STATE_BUCKET,
    WEEDITPRO_SAM31_A100_FOUNDATION_OBSERVATION_CONFIRM:
      process.env.WEEDITPRO_SAM31_A100_FOUNDATION_OBSERVATION_CONFIRM,
  })
  if (
    process.argv.length !== 3
    || process.argv[2] !== '--execute'
    || configuration.GOOGLE_CLOUD_PROJECT_ID !== PROJECT_ID
  ) throw new Error('SAM 3.1 A100 foundation publication is not authorized.')
}

async function runFixedLiveAudit(): Promise<unknown> {
  const stdout = await new Promise<string>((resolve, reject) => {
    execFile('/bin/bash', [AUDIT_SCRIPT], {
      encoding: 'utf8',
      timeout: 180_000,
      maxBuffer: MAXIMUM_AUDIT_BYTES,
      windowsHide: true,
      env: process.env,
    }, (error, output) => {
      if (error) {
        reject(new Error('SAM 3.1 A100 fixed live audit failed.'))
        return
      }
      resolve(output)
    })
  })
  if (Buffer.byteLength(stdout, 'utf8') < 2
    || Buffer.byteLength(stdout, 'utf8') > MAXIMUM_AUDIT_BYTES) {
    throw new Error('SAM 3.1 A100 live audit output is invalid.')
  }
  try {
    return JSON.parse(stdout)
  } catch {
    throw new Error('SAM 3.1 A100 live audit JSON is invalid.')
  }
}

main().catch(() => {
  process.stderr.write(`${JSON.stringify({
    ok: false,
    code: 'sam3_1_a100_foundation_publication_failed',
  })}\n`)
  process.exitCode = 1
})
