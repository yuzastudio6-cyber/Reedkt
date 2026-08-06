import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import {
  createCanonicalSam31AuthorizedHumanTermsIntent,
} from '../model-artifacts/canonical-sam3_1-authorized-terms-finalization'
import {
  CANONICAL_SAM3_1_HUGGING_FACE_OFFICIAL_ACCESS_VERIFIER_VERSION,
  createCanonicalSam31HuggingFaceOfficialAccessVerificationPort,
} from '../services/canonical-sam3_1-hugging-face-official-access-verifier'

const TOKEN = 'hf_fixture_token_never_returned'
const REVISION = 'daa63191845a41281374e725f4c9e51c7a824460'
const CHECKPOINT_ETAG = digest('sam31-checkpoint-bytes')
const metadata = Buffer.from(JSON.stringify({
  id: 'facebook/sam3.1',
  modelId: 'facebook/sam3.1',
  sha: REVISION,
  gated: 'manual',
  disabled: false,
  siblings: [
    { rfilename: 'LICENSE' },
    { rfilename: 'sam3.1_multiplex.pt' },
  ],
}), 'utf8')
const calls: Array<{
  url: string
  method: string
  redirect: string
  authorization: string
}> = []
let secretReads = 0
const verifier = createCanonicalSam31HuggingFaceOfficialAccessVerificationPort({
  secretResourceName:
    'projects/reeditpro/secrets/HUGGINGFACE_TOKEN/versions/1',
  credentialVersionAuthorityRef: ref('sam31-hf-secret-version-1'),
  secretManagerClient: {
    async accessSecretVersion({ name }) {
      secretReads += 1
      assert.equal(name,
        'projects/reeditpro/secrets/HUGGINGFACE_TOKEN/versions/1')
      return [{ payload: { data: Buffer.from(TOKEN, 'utf8') } }]
    },
  },
  fetchImpl: async (url, init) => {
    const headers = new Headers(init?.headers)
    calls.push({
      url: String(url),
      method: String(init?.method),
      redirect: String(init?.redirect),
      authorization: headers.get('authorization') ?? '',
    })
    if (init?.method === 'GET') {
      return new Response(metadata, {
        status: 200,
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'content-length': String(metadata.byteLength),
        },
      })
    }
    return checkpointHeadResponse()
  },
  now: () => '2026-08-06T16:20:00.000Z',
})

const intent = humanIntent()
const observation = await verifier.verifyOfficialGatedRepositoryAccess({
  humanTermsIntent: intent,
})
assert.equal(
  CANONICAL_SAM3_1_HUGGING_FACE_OFFICIAL_ACCESS_VERIFIER_VERSION,
  'canonical-sam3_1-hugging-face-official-access-verifier-v1',
)
assert.equal(verifier.schemaVersion,
  'canonical-sam3_1-official-access-verification-port-v1')
assert.equal(secretReads, 1)
assert.equal(calls.length, 2)
assert.deepEqual(calls.map(({ method, redirect }) => ({ method, redirect })), [
  { method: 'GET', redirect: 'error' },
  { method: 'HEAD', redirect: 'manual' },
])
assert.equal(calls[0]?.url,
  `https://huggingface.co/api/models/facebook/sam3.1/revision/${REVISION}`)
assert.equal(calls[1]?.url,
  `https://huggingface.co/facebook/sam3.1/resolve/${REVISION}/sam3.1_multiplex.pt`)
assert.equal(calls.every((call) =>
  call.authorization === `Bearer ${TOKEN}`), true)
assert.equal(observation.repositoryGated, true)
assert.equal(observation.authenticatedAccessGranted, true)
assert.equal(observation.exactCheckpointRevisionObserved, true)
assert.equal(observation.exactCheckpointFileObserved, true)
assert.equal(observation.checkpointHeadResponseStatus, 302)
assert.equal(observation.checkpointRedirectTargetOriginAllowlisted, true)
assert.equal(observation.checkpointLinkedByteLength, 3_500_000_000)
assert.equal(observation.checkpointLinkedEtagSha256, CHECKPOINT_ETAG)
assert.equal(observation.responseBodyDigestSha256, digest(metadata))
assert.equal(observation.responseBodyPersisted, false)
assert.equal(observation.secretValuePersistedLoggedOrReturned, false)
assert.equal(observation.checkpointBytesDownloaded, false)
assert.equal(JSON.stringify(observation).includes(TOKEN), false)
assert.equal(JSON.stringify(observation).includes('projects/reeditpro/secrets'),
  false)
assert.equal(observation.authority.artifactPublicationStarted, false)
assert.equal(observation.authority.gpuRuntimeAuthorized, false)
assert.equal(observation.authority.customerCreditsMutated, false)
assert.equal(observation.authority.productionReady, false)

await assert.rejects(createVerifier({
  fetchImpl: async () => new Response('denied', { status: 401 }),
}).verifyOfficialGatedRepositoryAccess({ humanTermsIntent: intent }))

await assert.rejects(createVerifier({
  fetchImpl: sequenceFetch(
    metadataResponse(),
    checkpointHeadResponse('https://evil.example.invalid/model'),
  ),
}).verifyOfficialGatedRepositoryAccess({ humanTermsIntent: intent }))

await assert.rejects(createVerifier({
  fetchImpl: sequenceFetch(
    metadataResponse(Buffer.from(JSON.stringify({
      id: 'facebook/sam3.1',
      modelId: 'facebook/sam3.1',
      sha: '0000000000000000000000000000000000000000',
      gated: 'manual',
      disabled: false,
      siblings: [{ rfilename: 'sam3.1_multiplex.pt' }],
    }), 'utf8')),
    checkpointHeadResponse(),
  ),
}).verifyOfficialGatedRepositoryAccess({ humanTermsIntent: intent }))

await assert.rejects(createVerifier({
  fetchImpl: sequenceFetch(
    metadataResponse(),
    checkpointHeadResponse(undefined, { 'x-linked-size': '1' }),
  ),
}).verifyOfficialGatedRepositoryAccess({ humanTermsIntent: intent }))

assert.throws(() =>
  createCanonicalSam31HuggingFaceOfficialAccessVerificationPort({
    secretResourceName:
      'projects/reeditpro/secrets/HUGGINGFACE_TOKEN/versions/latest',
    credentialVersionAuthorityRef: ref('bad-secret-version'),
    secretManagerClient: { async accessSecretVersion() { return [] } },
  }))

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-hugging-face-official-access-verifier',
  checks: 34,
  exactOfficialMetadataRevisionAndFileObserved: true,
  exactPinnedSecretVersionResolved: true,
  checkpointHeadAuthorized: true,
  checkpointRedirectFollowed: false,
  checkpointBytesDownloaded: false,
  responseBodyPersisted: false,
  secretPersistedLoggedOrReturned: false,
  callerCredentialAccepted: false,
  modelInstalledOnDeveloperMachine: false,
  artifactPublicationStarted: false,
  gpuRuntimeStarted: false,
  customerCreditsMutated: false,
  productionReady: false,
}, null, 2))

function createVerifier(input: { fetchImpl: typeof fetch }) {
  return createCanonicalSam31HuggingFaceOfficialAccessVerificationPort({
    secretResourceName:
      'projects/reeditpro/secrets/MODEL_WEIGHT_ACCESS_TOKEN/versions/2',
    credentialVersionAuthorityRef: ref('sam31-hf-secret-version-2'),
    secretManagerClient: {
      async accessSecretVersion() {
        return [{ payload: { data: Buffer.from(TOKEN, 'utf8') } }]
      },
    },
    fetchImpl: input.fetchImpl,
    now: () => '2026-08-06T16:20:00.000Z',
  })
}

function sequenceFetch(...responses: Response[]): typeof fetch {
  let index = 0
  return (async () => {
    const response = responses[index]
    index += 1
    if (!response) throw new Error('unexpected fetch')
    return response
  }) as typeof fetch
}

function metadataResponse(body = metadata): Response {
  return new Response(body, {
    status: 200,
    headers: {
      'content-type': 'application/json',
      'content-length': String(body.byteLength),
    },
  })
}

function checkpointHeadResponse(
  location = 'https://cas-bridge.xethub.hf.co/signed/checkpoint',
  headers: Record<string, string> = {},
): Response {
  return new Response(null, {
    status: 302,
    headers: {
      location,
      'x-repo-commit': REVISION,
      'x-linked-size': '3500000000',
      'x-linked-etag': `"${CHECKPOINT_ETAG}"`,
      ...headers,
    },
  })
}

function humanIntent() {
  return createCanonicalSam31AuthorizedHumanTermsIntent({
    intentId: 'sam31-human-terms-verifier-smoke',
    intentVersion: 1,
    organizationAuthorityRef: ref('organization'),
    authorizedRepresentativePrincipalRef: ref('principal'),
    authenticatedSessionRef: ref('session'),
    sourceRepository: 'https://github.com/facebookresearch/sam3.git',
    checkpointRepository: 'facebook/sam3.1',
    licenseIdentity: 'SAM License',
    licenseLastUpdated: '2025-11-19',
    acceptanceSurface: 'official_hugging_face_gated_repository',
    repositoryGating: 'manual',
    acceptedAt: '2026-08-06T16:10:00.000Z',
    contactInformationSharingAcceptedByAuthorizedHuman: true,
    approvedUseCase:
      'private_commercial_video_editing_segmentation_and_tracking',
    militaryWarfareNuclearEspionageOrWeaponsUseAllowed: false,
    legalReviewRef: ref('legal'),
    privacyReviewRef: ref('privacy'),
    tradeControlsReviewRef: ref('trade'),
    officialTermsPresentationEvidenceRef: ref('terms-presentation'),
    boundary: {
      directBrowserLoginAutomated: false,
      termsAcceptedByAutomation: false,
      callerTokenPathUrlOrCredentialAccepted: false,
      thirdPartyMirrorAccepted: false,
      browserOrWorkerSecretIncluded: false,
    },
    authority: {
      authenticatedHumanAcceptanceEvidenceOnly: true,
      officialRepositoryAccessVerified: false,
      termsAcceptanceFinalized: false,
      modelOrCheckpointDownloaded: false,
      imageBuildAuthorized: false,
      gpuRuntimeAuthorized: false,
      customerCreditsMutated: false,
      qaApproved: false,
      publicDeliveryAuthorized: false,
      productionReady: false,
    },
  })
}

function ref(id: string) {
  return {
    id,
    version: 1,
    contentHash: `sha256:${digest(id)}` as const,
  }
}

function digest(value: string | Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}
