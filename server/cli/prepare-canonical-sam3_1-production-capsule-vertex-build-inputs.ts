import { execFileSync } from 'node:child_process'

import { Storage } from '@google-cloud/storage'
import { OAuth2Client } from 'google-auth-library'
import { z } from 'zod'

import {
  assertWeEditProGcpLocalOperatorContext,
} from './weeditpro-gcp-local-operator-auth'
import {
  createCanonicalSam31GcpProductionCapsuleVertexBuildInputOwner,
} from '../services/canonical-sam3_1-production-capsule-vertex-build-input-owner'

const CONFIRMATION =
  'prepare-one-sam31-production-capsule-two-vertex-build-input-v2' as const
const LOCAL_OPERATOR_AUTH =
  'active-gcloud-image-builder-impersonation-v1' as const
const IMAGE_BUILDER_SERVICE_ACCOUNT =
  'reeditpro-image-builder-sa@reeditpro.iam.gserviceaccount.com' as const
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const environment = z.object({
  WEEDITPRO_SAM31_PRODUCTION_CAPSULE_VERTEX_BUILD_INPUT_CONFIRMATION:
    z.literal(CONFIRMATION),
  WEEDITPRO_SAM31_SOURCE_CHECKPOINT_QUALIFICATION_ID: safeId,
  WEEDITPRO_SAM31_SOURCE_CHECKPOINT_QUALIFICATION_SHA256: rawSha256,
  WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH: z.literal(LOCAL_OPERATOR_AUTH),
}).strict().parse({
  WEEDITPRO_SAM31_PRODUCTION_CAPSULE_VERTEX_BUILD_INPUT_CONFIRMATION:
    process.env
      .WEEDITPRO_SAM31_PRODUCTION_CAPSULE_VERTEX_BUILD_INPUT_CONFIRMATION,
  WEEDITPRO_SAM31_SOURCE_CHECKPOINT_QUALIFICATION_ID:
    process.env.WEEDITPRO_SAM31_SOURCE_CHECKPOINT_QUALIFICATION_ID,
  WEEDITPRO_SAM31_SOURCE_CHECKPOINT_QUALIFICATION_SHA256:
    process.env.WEEDITPRO_SAM31_SOURCE_CHECKPOINT_QUALIFICATION_SHA256,
  WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH:
    process.env.WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH,
})

const authClient = new OAuth2Client()
assertWeEditProGcpLocalOperatorContext()
const ephemeralAccessToken = readEphemeralImageBuilderAccessToken()
if (ephemeralAccessToken.length < 20 || ephemeralAccessToken.length > 4_096
  || /\s/u.test(ephemeralAccessToken)) {
  throw new Error('Ephemeral image-builder authentication is malformed.')
}
authClient.setCredentials({ access_token: ephemeralAccessToken })
const storage = new Storage({
  projectId: 'reeditpro',
  authClient,
})

const result = await prepareBuildInputs()

process.stdout.write(`${JSON.stringify(result)}\n`)

async function prepareBuildInputs() {
  try {
    return await createCanonicalSam31GcpProductionCapsuleVertexBuildInputOwner({
      storage,
    }).prepare({
      sourceCheckpointQualificationRef: {
        id: environment.WEEDITPRO_SAM31_SOURCE_CHECKPOINT_QUALIFICATION_ID,
        version: 2,
        schemaVersion:
          'canonical-sam3_1-source-checkpoint-compatibility-qualification-v2',
        contentHash:
          `sha256:${environment
            .WEEDITPRO_SAM31_SOURCE_CHECKPOINT_QUALIFICATION_SHA256}`,
      },
    })
  } catch {
    throw new Error(
      'Canonical SAM 3.1 production-capsule build-input preparation failed.',
    )
  }
}

function readEphemeralImageBuilderAccessToken(): string {
  try {
    return execFileSync(
      'gcloud',
      [
        'auth',
        'print-access-token',
        `--impersonate-service-account=${IMAGE_BUILDER_SERVICE_ACCOUNT}`,
        '--project=reeditpro',
        '--quiet',
      ],
      {
        encoding: 'utf8',
        maxBuffer: 8 * 1_024,
        stdio: ['ignore', 'pipe', 'ignore'],
        timeout: 60_000,
      },
    ).trim()
  } catch {
    throw new Error('Ephemeral image-builder authentication is unavailable.')
  }
}
