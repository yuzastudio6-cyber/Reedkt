import { GoogleLyria3InteractionsTransport } from '../music/lyria-live-transport'
import { LYRIA_3_PROVIDER_PROFILE, type Lyria3InteractionRequest } from '../music/lyria-provider'

function check(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const request: Lyria3InteractionRequest = {
  model: LYRIA_3_PROVIDER_PROFILE.modelId,
  input: [{ type: 'text', text: 'Original restrained instrumental cue.' }],
  store: false,
  background: false,
}
const audioBytes = Buffer.from('canonical-private-lyria-audio-fixture')
let observedAuthorization = ''
let observedBody = ''
const successTransport = new GoogleLyria3InteractionsTransport({
  getAccessToken: async () => 'fixture-token-not-a-secret',
  fetchImplementation: async (_url, init) => {
    observedAuthorization = new Headers(init?.headers).get('authorization') ?? ''
    observedBody = String(init?.body ?? '')
    return new Response(JSON.stringify({
      id: 'interaction-fixture-1', status: 'completed', outputs: [
        { type: 'text', text: 'description' },
        { type: 'audio', mime_type: 'audio/mpeg', data: audioBytes.toString('base64') },
      ], object: 'interaction', model: LYRIA_3_PROVIDER_PROFILE.modelId,
    }), { status: 200, headers: { 'content-type': 'application/json' } })
  },
})
const endpoint = LYRIA_3_PROVIDER_PROFILE.endpointTemplate.replace('{project}', 'music-canary-project')
const success = await successTransport.execute({
  endpoint, request, idempotencyKey: 'music-live-transport-fixture', timeoutMilliseconds: 5_000,
})
check(success.status === 'succeeded' && success.candidates.length === 1,
  'Lyria live transport must parse one exact official audio output.')
check(Buffer.from(success.candidates[0].bytes).equals(audioBytes), 'Lyria live transport changed returned audio bytes.')
check(observedAuthorization.startsWith('Bearer ') && !JSON.stringify(success).includes('fixture-token-not-a-secret'),
  'Lyria transport must use but never return the access token.')
check(JSON.parse(observedBody).store === false, 'Lyria live transport must enforce store=false.')

const unknownTransport = new GoogleLyria3InteractionsTransport({
  getAccessToken: async () => 'fixture-token-not-a-secret',
  fetchImplementation: async () => new Response('{}', { status: 503 }),
})
const unknown = await unknownTransport.execute({
  endpoint, request, idempotencyKey: 'music-live-transport-unknown', timeoutMilliseconds: 5_000,
})
check(unknown.status === 'unknown_outcome', 'Lyria 5xx must remain an unknown outcome requiring reconciliation.')

let rejectionSummary = ''
const rejectedTransport = new GoogleLyria3InteractionsTransport({
  getAccessToken: async () => 'fixture-token-not-a-secret',
  fetchImplementation: async () => new Response(JSON.stringify({
    error: {
      status: 'INVALID_ARGUMENT',
      message: `Rejected https://provider.invalid for owner@example.com with ` +
        `eyJsecret-token-value-that-must-not-leak.${String.fromCharCode(0)} control marker.`,
      details: [{ reason: 'MODEL_NOT_AVAILABLE' }],
    },
  }), { status: 400 }),
  onRejectedResponse: (summary) => { rejectionSummary = JSON.stringify(summary) },
})
const rejected = await rejectedTransport.execute({
  endpoint, request, idempotencyKey: 'music-live-transport-rejected', timeoutMilliseconds: 5_000,
})
check(rejected.status === 'failed' && rejected.failureCode === 'http_400_model_not_available',
  'Lyria deterministic provider rejection must preserve a safe exact failure reason.')
check(rejectionSummary.includes('MODEL_NOT_AVAILABLE') && rejectionSummary.includes('[redacted-url]') &&
  rejectionSummary.includes('[redacted-email]') && rejectionSummary.includes('[redacted-token]') &&
  !rejectionSummary.includes('provider.invalid') && !rejectionSummary.includes('owner@example.com') &&
  !rejectionSummary.includes('eyJsecret') && !rejectionSummary.includes('\\u0000'),
  'Lyria rejection diagnostics must preserve useful status without leaking sensitive values.')

let unsafeEndpointRejected = false
try {
  await successTransport.execute({
    endpoint: 'https://example.com/v1beta1/projects/music-canary-project/locations/global/interactions',
    request, idempotencyKey: 'unsafe-endpoint', timeoutMilliseconds: 5_000,
  })
} catch {
  unsafeEndpointRejected = true
}
check(unsafeEndpointRejected, 'Lyria transport must reject caller-controlled endpoints.')

console.log(JSON.stringify({
  status: 'ok',
  officialEndpointEnforced: true,
  storeFalseEnforced: true,
  tokenNotReturned: true,
  outputBytesDecoded: success.candidates[0].bytes.byteLength,
  unknownOutcomePreserved: true,
  rejectedResponseSafelyClassified: true,
}, null, 2))
