import { createHash } from 'node:crypto'

import { z } from 'zod'
import { GoogleAuth } from 'google-auth-library'

import {
  assertCanonicalSam31AuthorizedHumanTermsIntent,
  createCanonicalSam31OfficialAccessObservation,
} from '../model-artifacts/canonical-sam3_1-authorized-terms-finalization'
import {
  type CanonicalSam31OfficialAccessVerificationPort,
} from './canonical-sam3_1-authorized-terms-finalization-owner'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'

export const CANONICAL_SAM3_1_HUGGING_FACE_OFFICIAL_ACCESS_VERIFIER_VERSION =
  'canonical-sam3_1-hugging-face-official-access-verifier-v1' as const

const MODEL_ID = 'facebook/sam3.1' as const
const REVISION = 'daa63191845a41281374e725f4c9e51c7a824460' as const
const CHECKPOINT_FILE = 'sam3.1_multiplex.pt' as const
const METADATA_URL =
  `https://huggingface.co/api/models/${MODEL_ID}/revision/${REVISION}` as const
const CHECKPOINT_HEAD_URL =
  `https://huggingface.co/${MODEL_ID}/resolve/${REVISION}/${CHECKPOINT_FILE}` as const
const MAXIMUM_METADATA_BYTES = 2 * 1024 * 1024
const REQUEST_TIMEOUT_MS = 30_000
const SECRET_RESOURCE =
  /^projects\/reeditpro\/secrets\/(?:HUGGINGFACE_TOKEN|MODEL_WEIGHT_ACCESS_TOKEN)\/versions\/[1-9][0-9]*$/u
const ALLOWED_REDIRECT_HOSTS = new Set([
  'cas-bridge.xethub.hf.co',
  'cdn-lfs.hf.co',
  'huggingface.co',
])
const evidenceRefSchema = z.object({
  id: z.string().trim().min(1).max(220)
    .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
    .refine((value) => !value.includes('..')),
  version: z.number().int().positive().safe(),
  contentHash: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
}).strict()

type SecretManagerClientLike = {
  accessSecretVersion(input: { name: string }): Promise<unknown[]>
}

export function createCanonicalSam31HuggingFaceOfficialAccessVerificationPort(
  input: {
    readonly secretResourceName: string
    readonly credentialVersionAuthorityRef: z.infer<typeof evidenceRefSchema>
    readonly secretManagerClient?: SecretManagerClientLike
    readonly fetchImpl?: typeof fetch
    readonly now?: () => string
  },
): CanonicalSam31OfficialAccessVerificationPort {
  assertPlainSerializedData({
    secretResourceName: input.secretResourceName,
    credentialVersionAuthorityRef: input.credentialVersionAuthorityRef,
  }, 'sam31_hugging_face_access_verifier_configuration')
  if (!SECRET_RESOURCE.test(input.secretResourceName)) {
    throw new Error('SAM 3.1 pinned access credential is invalid.')
  }
  const credentialVersionAuthorityRef = evidenceRefSchema.parse(
    input.credentialVersionAuthorityRef,
  )
  const fetchImpl = input.fetchImpl ?? fetch
  if (typeof fetchImpl !== 'function') {
    throw new Error('SAM 3.1 official access fetch port is invalid.')
  }
  const now = input.now ?? (() => new Date().toISOString())
  if (typeof now !== 'function') {
    throw new Error('SAM 3.1 official access clock is invalid.')
  }

  const port: CanonicalSam31OfficialAccessVerificationPort = {
    schemaVersion:
      'canonical-sam3_1-official-access-verification-port-v1' as const,
    async verifyOfficialGatedRepositoryAccess(untrusted) {
      assertPlainSerializedData(untrusted, 'sam31_official_access_request')
      const intent = assertCanonicalSam31AuthorizedHumanTermsIntent(
        z.object({ humanTermsIntent: z.unknown() }).strict().parse(untrusted)
          .humanTermsIntent,
      )
      const client = input.secretManagerClient ?? await createSecretManagerClient()
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
      try {
        const token = await resolvePinnedToken({
          client,
          secretResourceName: input.secretResourceName,
        })
        const headers = Object.freeze({
          accept: 'application/json',
          authorization: `Bearer ${token}`,
          'user-agent':
            'WeEditPro-SAM3.1-Official-Access-Verifier/1.0',
        })
        const metadataResponse = await fetchImpl(METADATA_URL, {
          method: 'GET',
          headers,
          redirect: 'error',
          signal: controller.signal,
        })
        if (
          metadataResponse.status !== 200
          || !contentTypeIsJson(metadataResponse.headers.get('content-type'))
        ) throw new Error('SAM 3.1 official metadata access was not granted.')
        const metadataBody = await readBoundedBody(metadataResponse)
        parseOfficialMetadata(metadataBody)

        const checkpointResponse = await fetchImpl(CHECKPOINT_HEAD_URL, {
          method: 'HEAD',
          headers: {
            authorization: `Bearer ${token}`,
            'user-agent':
              'WeEditPro-SAM3.1-Official-Access-Verifier/1.0',
          },
          redirect: 'manual',
          signal: controller.signal,
        })
        const checkpointStatus = z.union([z.literal(302), z.literal(307)])
          .parse(checkpointResponse.status)
        const redirectLocation = checkpointResponse.headers.get('location')
        if (!redirectLocation) {
          throw new Error('SAM 3.1 checkpoint access returned no redirect.')
        }
        let redirect: URL
        try {
          redirect = new URL(redirectLocation, CHECKPOINT_HEAD_URL)
        } catch {
          throw new Error('SAM 3.1 checkpoint redirect is invalid.')
        }
        if (
          redirect.protocol !== 'https:'
          || !ALLOWED_REDIRECT_HOSTS.has(redirect.hostname)
          || redirect.username
          || redirect.password
        ) throw new Error('SAM 3.1 checkpoint redirect origin is not allowed.')
        const linkedByteLength = Number(
          checkpointResponse.headers.get('x-linked-size'),
        )
        const linkedEtag = normalizeLinkedEtag(
          checkpointResponse.headers.get('x-linked-etag'),
        )
        if (
          !Number.isSafeInteger(linkedByteLength)
          || linkedByteLength < 3_000_000_000
          || linkedByteLength > 5_000_000_000
          || checkpointResponse.headers.get('x-repo-commit') !== REVISION
        ) throw new Error('SAM 3.1 checkpoint metadata is not exact.')

        return createCanonicalSam31OfficialAccessObservation({
          observationId: `sam31-access-${intent.intentId}`,
          observationVersion: 1,
          humanTermsIntentRef: {
            id: intent.intentId,
            version: 1,
            schemaVersion: intent.schemaVersion,
            contentHash: `sha256:${intent.intentHash}`,
          },
          checkpointRepository: MODEL_ID,
          checkpointRevision: REVISION,
          checkpointFileName: CHECKPOINT_FILE,
          credentialVersionAuthorityRef,
          exactPinnedCredentialVersionUsed: true,
          officialOriginPinned: true,
          redirectFollowed: false,
          repositoryMetadataResponseStatus: 200,
          repositoryGated: true,
          authenticatedAccessGranted: true,
          exactCheckpointRevisionObserved: true,
          exactCheckpointFileObserved: true,
          checkpointHeadResponseStatus: checkpointStatus,
          checkpointRedirectTargetOriginAllowlisted: true,
          checkpointLinkedByteLength: linkedByteLength,
          checkpointLinkedEtagSha256: linkedEtag,
          responseBodyDigestSha256: sha256(metadataBody),
          responseBodyPersisted: false,
          secretValuePersistedLoggedOrReturned: false,
          checkpointBytesDownloaded: false,
          verifiedAt: z.string().datetime({ offset: true }).parse(now()),
          authority: {
            accessObservationOnly: true,
            humanTermsAcceptanceCreated: false,
            artifactPublicationStarted: false,
            imageBuildAuthorized: false,
            gpuRuntimeAuthorized: false,
            customerCreditsMutated: false,
            qaApproved: false,
            publicDeliveryAuthorized: false,
            productionReady: false,
          },
        })
      } catch {
        throw new Error('SAM 3.1 official gated access verification failed.')
      } finally {
        clearTimeout(timeout)
      }
    },
  }
  return Object.freeze(port)
}

async function createSecretManagerClient(): Promise<SecretManagerClientLike> {
  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  })
  const client = await auth.getClient()
  return Object.freeze({
    async accessSecretVersion(input: { readonly name: string }) {
      if (!SECRET_RESOURCE.test(input.name)) {
        throw new Error('SAM 3.1 pinned access credential is invalid.')
      }
      const response = await client.request({
        url: `https://secretmanager.googleapis.com/v1/${input.name}:access`,
        method: 'POST',
        responseType: 'json',
      })
      return [response.data]
    },
  })
}

async function resolvePinnedToken(input: {
  readonly client: SecretManagerClientLike
  readonly secretResourceName: string
}): Promise<string> {
  let response: unknown[]
  try {
    response = await input.client.accessSecretVersion({
      name: input.secretResourceName,
    })
  } catch {
    throw new Error('SAM 3.1 official access credential resolution failed.')
  }
  const version = response[0]
  const payload = version && typeof version === 'object'
    ? Reflect.get(version, 'payload')
    : undefined
  const data = payload && typeof payload === 'object'
    ? Reflect.get(payload, 'data')
    : undefined
  const bytes = typeof data === 'string'
    ? Buffer.from(data, 'base64')
    : Buffer.from(data instanceof Uint8Array ? data : new Uint8Array())
  const token = bytes.toString('utf8')
  bytes.fill(0)
  if (
    token.length < 8
    || token.length > 4_096
    || containsUnsafeCredentialCharacter(token)
  ) throw new Error('SAM 3.1 official access credential is empty or malformed.')
  return token
}

function containsUnsafeCredentialCharacter(value: string): boolean {
  return Array.from(value).some((character) => {
    const codePoint = character.codePointAt(0) ?? -1
    return codePoint <= 31 || codePoint === 127 || /\s/u.test(character)
  })
}

async function readBoundedBody(response: Response): Promise<Buffer> {
  const contentLength = response.headers.get('content-length')
  if (
    contentLength
    && (!/^[0-9]{1,10}$/u.test(contentLength)
      || Number(contentLength) > MAXIMUM_METADATA_BYTES)
  ) throw new Error('SAM 3.1 official metadata response is oversized.')
  if (!response.body) {
    throw new Error('SAM 3.1 official metadata response body is missing.')
  }
  const reader = response.body.getReader()
  const chunks: Buffer[] = []
  let total = 0
  while (true) {
    const item = await reader.read()
    if (item.done) break
    total += item.value.byteLength
    if (total > MAXIMUM_METADATA_BYTES) {
      await reader.cancel()
      throw new Error('SAM 3.1 official metadata response is oversized.')
    }
    chunks.push(Buffer.from(item.value))
  }
  if (total < 2) {
    throw new Error('SAM 3.1 official metadata response is empty.')
  }
  return Buffer.concat(chunks, total)
}

function parseOfficialMetadata(body: Buffer): {
  readonly gated: 'manual'
  readonly sha: typeof REVISION
  readonly checkpointObserved: true
} {
  let value: unknown
  try {
    value = JSON.parse(body.toString('utf8'))
  } catch {
    throw new Error('SAM 3.1 official metadata response is invalid JSON.')
  }
  const parsed = z.object({
    id: z.literal(MODEL_ID),
    modelId: z.literal(MODEL_ID),
    sha: z.literal(REVISION),
    gated: z.literal('manual'),
    disabled: z.literal(false),
    siblings: z.array(z.object({
      rfilename: z.string().min(1).max(1_024),
    }).passthrough()).min(1).max(10_000),
  }).passthrough().parse(value)
  if (
    parsed.siblings.filter((item) =>
      item.rfilename === CHECKPOINT_FILE).length !== 1
  ) throw new Error('SAM 3.1 exact checkpoint file is absent.')
  return Object.freeze({
    gated: parsed.gated,
    sha: parsed.sha,
    checkpointObserved: true as const,
  })
}

function normalizeLinkedEtag(value: string | null): string {
  const normalized = value?.trim().replace(/^W\//u, '')
    .replace(/^"|"$/gu, '').replace(/^sha256:/u, '')
  if (!normalized || !/^[a-f0-9]{64}$/u.test(normalized)) {
    throw new Error('SAM 3.1 checkpoint linked ETag is invalid.')
  }
  return normalized
}

function contentTypeIsJson(value: string | null): boolean {
  return value?.split(';', 1)[0]?.trim().toLowerCase() === 'application/json'
}

function sha256(value: Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}
