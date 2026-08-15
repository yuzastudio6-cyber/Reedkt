import { execFileSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'

import { type File } from '@google-cloud/storage'
import type { OAuth2Client } from 'google-auth-library'
import { z } from 'zod'

import {
  assertCanonicalSam31L4QualificationJob,
  buildCanonicalSam31L4QualificationJobImagePatch,
} from '../services/canonical-sam3_1-l4-qualification-job-service'
import {
  assertCanonicalSam31L4QualificationJobRolloutReceipt,
  createCanonicalSam31L4QualificationJobRolloutReceipt,
} from '../services/canonical-sam3_1-l4-qualification-job-rollout-service'
import {
  createCanonicalSam31GcpImageSupplyChainReleaseRepository,
} from '../services/canonical-sam3_1-cloud-image-supply-chain-release-runtime'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  createWeEditProGcpLocalOperatorAuth,
  WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH_MODE,
} from './weeditpro-gcp-local-operator-auth'

const CONFIRMATION =
  'rollout-one-qualified-sam31-image-to-l4-qualification-job-v1' as const
const JOB_RESOURCE =
  'projects/reeditpro/locations/us-central1/jobs/reeditpro-sam31-l4-fallback' as const
const RUN_ORIGIN = 'https://run.googleapis.com' as const
const CONTROL_PLANE_BUCKET =
  'reeditpro-production-reeditpro-control-plane-state' as const
const RECEIPT_PREFIX =
  'private/sam3_1/l4-qualification-job-rollouts/v1' as const

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const evidenceRefSchema = z.object({
  id: safeId,
  version: z.literal(1),
  contentHash: prefixedSha256,
}).strict()
const executionPageSchema = z.object({
  executions: z.array(z.object({
    name: z.string(),
    completionTime: z.string().datetime({ offset: true }).optional(),
  }).passthrough()).optional(),
  nextPageToken: z.string().optional(),
}).passthrough()

type AuthRequest = Pick<OAuth2Client, 'request'>

async function main() {
  if (process.env.WEEDITPRO_CONFIRM_SAM31_L4_IMAGE_ROLLOUT !==
    CONFIRMATION) {
    throw new Error('exact_sam31_l4_image_rollout_confirmation_missing')
  }
  if (process.env.WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH !==
    WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH_MODE) {
    throw new Error('exact_gcp_local_operator_auth_confirmation_missing')
  }
  const rolloutId = safeId.parse(
    process.env.WEEDITPRO_SAM31_L4_IMAGE_ROLLOUT_ID,
  )
  const currentImageDigest = `sha256:${sha256.parse(
    process.env.WEEDITPRO_SAM31_L4_CURRENT_IMMUTABLE_IMAGE_SHA256,
  )}` as const
  const immutableImageDigest = `sha256:${sha256.parse(
    process.env.WEEDITPRO_SAM31_L4_NEW_IMMUTABLE_IMAGE_SHA256,
  )}` as const
  const imageSupplyChainReleaseRef = evidenceRefSchema.parse({
    id: process.env.WEEDITPRO_SAM31_L4_IMAGE_SUPPLY_CHAIN_RELEASE_ID,
    version: 1,
    contentHash: `sha256:${sha256.parse(
      process.env.WEEDITPRO_SAM31_L4_IMAGE_SUPPLY_CHAIN_RELEASE_SHA256,
    )}`,
  })
  const currentImageUri = imageUri(currentImageDigest)
  const immutableImageUri = imageUri(immutableImageDigest)
  if (currentImageUri === immutableImageUri) {
    throw new Error('sam31_l4_image_rollout_requires_new_image')
  }

  const { authClient: auth, storage } = createWeEditProGcpLocalOperatorAuth({
    confirmation: process.env.WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH,
  })
  const release = await createCanonicalSam31GcpImageSupplyChainReleaseRepository(
    { storage },
  ).rereadQualifiedRelease({ releaseRef: imageSupplyChainReleaseRef })
  if (
    !release
    || release.immutableImageDigest !== immutableImageDigest
    || release.immutableImageUri !== immutableImageUri
    || release.immutableImageRef.contentHash !== immutableImageDigest
    || !release.authority.imageSupplyChainQualified
    || release.authority.a100RuntimeQualified
    || release.authority.l4RuntimeQualified
    || release.authority.runtimeReleaseGranted
    || release.authority.productionReady
  ) throw new Error('sam31_l4_image_supply_chain_release_changed')

  const before = assertCanonicalSam31L4QualificationJob(
    await getJson(auth, `${RUN_ORIGIN}/v2/${JOB_RESOURCE}`),
    currentImageUri,
  )
  if (await countActiveExecutions(auth) !== 0) {
    throw new Error('sam31_l4_job_not_scaled_to_zero_before_rollout')
  }
  buildCanonicalSam31L4QualificationJobImagePatch({
    current: before,
    immutableImageUri,
  })
  const updateObservation = runOfficialImageOnlyUpdate(immutableImageUri)
  const after = assertCanonicalSam31L4QualificationJob(
    await getJson(auth, `${RUN_ORIGIN}/v2/${JOB_RESOURCE}`),
    immutableImageUri,
  )
  if (await countActiveExecutions(auth) !== 0) {
    throw new Error('sam31_l4_job_not_scaled_to_zero_after_rollout')
  }
  const cloudRunPatchOperationRef = evidenceRefSchema.parse({
    id: `sam31-l4-job-image-update:generation-${after.generation}`,
    version: 1,
    contentHash: `sha256:${sha256AuthorityValue(updateObservation)}`,
  })
  const receipt = createCanonicalSam31L4QualificationJobRolloutReceipt({
    rolloutId,
    before,
    after,
    imageSupplyChainReleaseRef,
    cloudRunPatchOperationRef,
    rolledOutAt: new Date().toISOString(),
  })
  const file = storage.bucket(CONTROL_PLANE_BUCKET).file(
    `${RECEIPT_PREFIX}/${rolloutId}.${receipt.rolloutHash.slice(7)}.json`,
  )
  await persistCreateOnlyAndReread({ file, value: receipt })
  process.stdout.write(`${stableAuthorityStringify({
    status: 'qualification_image_rolled_out',
    rolloutId: receipt.rolloutId,
    rolloutHash: receipt.rolloutHash,
    receiptObject: file.name,
    jobResource: receipt.jobResource,
    jobUid: receipt.jobUid,
    beforeGeneration: receipt.beforeGeneration,
    afterGeneration: receipt.afterGeneration,
    immutableImageDigest: receipt.immutableImageDigest,
    imageSupplyChainReleaseRef: receipt.imageSupplyChainReleaseRef,
    gpuRuntimeQualified: false,
    runtimeReleaseGranted: false,
    productionReady: false,
  })}\n`)
}

async function countActiveExecutions(auth: AuthRequest) {
  let pageToken: string | undefined
  let active = 0
  for (let page = 0; page < 16; page += 1) {
    const parsed = executionPageSchema.parse(await getJson(
      auth,
      `${RUN_ORIGIN}/v2/${JOB_RESOURCE}/executions`,
      pageToken ? { pageSize: 100, pageToken } : { pageSize: 100 },
    ))
    active += (parsed.executions ?? []).filter(
      (execution) => !execution.completionTime,
    ).length
    pageToken = parsed.nextPageToken
    if (!pageToken) return active
  }
  throw new Error('sam31_l4_execution_list_exceeded_bound')
}

async function persistCreateOnlyAndReread(input: {
  readonly file: File
  readonly value: unknown
}) {
  const body = Buffer.from(stableAuthorityStringify(input.value), 'utf8')
  await input.file.save(body, {
    contentType: 'application/json',
    resumable: false,
    validation: 'crc32c',
    preconditionOpts: { ifGenerationMatch: 0 },
  })
  const [metadata] = await input.file.getMetadata()
  const generation = String(metadata.generation ?? '')
  const [reread] = await input.file.bucket.file(
    input.file.name,
    { generation },
  ).download({ validation: 'crc32c' })
  if (!/^[1-9][0-9]*$/u.test(generation) || !reread.equals(body)) {
    throw new Error('sam31_l4_job_rollout_receipt_reread_changed')
  }
  assertCanonicalSam31L4QualificationJobRolloutReceipt(
    JSON.parse(reread.toString('utf8')),
  )
}

async function getJson(
  auth: AuthRequest,
  url: string,
  params?: Readonly<Record<string, string | number>>,
) {
  return (await auth.request({
    url,
    method: 'GET',
    params,
    timeout: 30_000,
    retry: false,
    maxRedirects: 0,
  })).data
}

function imageUri(digest: string) {
  return `us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/`
    + `reeditpro-sam31-gpu@${prefixedSha256.parse(digest)}`
}

function runOfficialImageOnlyUpdate(immutableImageUri: string) {
  try {
    const value = JSON.parse(execFileSync(
      'gcloud',
      [
        'run', 'jobs', 'update', 'reeditpro-sam31-l4-fallback',
        `--image=${immutableImageUri}`,
        '--project=reeditpro',
        '--region=us-central1',
        '--format=json',
        '--quiet',
      ],
      {
        encoding: 'utf8',
        maxBuffer: 4 * 1_024 * 1_024,
        stdio: ['ignore', 'pipe', 'ignore'],
        timeout: 5 * 60 * 1_000,
      },
    )) as unknown
    const parsed = z.object({
      metadata: z.object({
        name: z.literal('reeditpro-sam31-l4-fallback'),
        generation: z.number().int().positive(),
      }).passthrough(),
      status: z.object({
        conditions: z.array(z.object({
          type: z.literal('Ready'),
          status: z.literal('True'),
        }).passthrough()).min(1),
      }).passthrough(),
    }).passthrough().parse(value)
    return Object.freeze({
      tool: 'gcloud_run_jobs_update_image_only_v1' as const,
      jobName: parsed.metadata.name,
      generation: parsed.metadata.generation,
      ready: true as const,
      executeNow: false as const,
      image: immutableImageUri,
    })
  } catch {
    throw new Error('sam31_l4_official_image_only_update_failed')
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`${stableAuthorityStringify({
    code: 'sam31_l4_qualification_job_image_rollout_failed',
    message: error instanceof Error ? error.message : 'unknown_error',
    runToken: randomUUID().replaceAll('-', '').slice(0, 12),
  })}\n`)
  process.exitCode = 1
})
