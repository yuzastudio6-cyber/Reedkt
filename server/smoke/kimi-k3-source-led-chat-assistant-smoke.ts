import assert from 'node:assert/strict'

import { assertRuntimeCanStart, loadRuntimeEnv } from '../config/env'
import {
  KIMI_K3_SOURCE_LED_CHAT_ENDPOINT,
  createKimiK3SourceLedChatAssistantPort,
  kimiK3SourceLedChatAssistantRuntimeSchema,
} from '../services/kimi-k3-source-led-chat-assistant'

const env = loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  REEDITPRO_KIMI_RUNTIME_MODE: 'internal_test',
  GOOGLE_SECRET_KIMI_API_KEY_NAME:
    'projects/reeditpro/secrets/reeditpro-prod-kimi-api-key/versions/2',
})
assert.doesNotThrow(() => assertRuntimeCanStart(env))
assert.throws(
  () => assertRuntimeCanStart(loadRuntimeEnv({
    NODE_ENV: 'test',
    E2E_RUNTIME_MODE: 'local',
    API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
    REEDITPRO_KIMI_RUNTIME_MODE: 'internal_test',
    GOOGLE_SECRET_KIMI_API_KEY_NAME:
      'projects/reeditpro/secrets/reeditpro-prod-kimi-api-key/versions/latest',
  })),
  /explicitly pinned Secret Manager version/u,
)
assert.throws(
  () => assertRuntimeCanStart(loadRuntimeEnv({
    NODE_ENV: 'test',
    E2E_RUNTIME_MODE: 'local',
    API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
    REEDITPRO_KIMI_RUNTIME_MODE: 'internal_test',
    GOOGLE_SECRET_KIMI_API_KEY_NAME: 'controlled-raw-key-is-forbidden',
  })),
  /explicitly pinned Secret Manager version/u,
)

let credentialReadCount = 0
let providerCallCount = 0
const assistant = createKimiK3SourceLedChatAssistantPort({
  env,
  credentialResolver: {
    async resolve() {
      credentialReadCount += 1
      return {
        value: 'controlled-non-secret-kimi-token',
        version: 2,
      }
    },
  },
  async fetchImpl(url, init) {
    providerCallCount += 1
    assert.equal(url, KIMI_K3_SOURCE_LED_CHAT_ENDPOINT)
    assert.equal(init?.method, 'POST')
    const headers = new Headers(init?.headers)
    assert.equal(
      headers.get('authorization'),
      'Bearer controlled-non-secret-kimi-token',
    )
    const body = JSON.parse(String(init?.body)) as Record<string, unknown>
    assert.equal(body.model, 'kimi-k3')
    assert.equal(body.reasoning_effort, 'low')
    assert.equal(body.stream, false)
    assert.equal(body.max_completion_tokens, 1_024)
    assert.equal(
      JSON.stringify(body).includes('controlled-non-secret-kimi-token'),
      false,
    )
    assert.deepEqual(
      Object.keys(body).sort(),
      [
        'max_completion_tokens',
        'messages',
        'model',
        'reasoning_effort',
        'response_format',
        'stream',
      ],
    )
    const messages = body.messages as Array<Record<string, unknown>>
    assert.equal(messages.length, 2)
    assert.equal(messages[0]?.role, 'system')
    assert.equal(messages[1]?.role, 'user')
    assert.match(String(messages[1]?.content), /prior_exchanges/u)
    assert.doesNotMatch(String(messages[1]?.content), /reasoning_content/u)
    if (providerCallCount === 2) {
      assert.match(String(messages[1]?.content), /Earlier direction/u)
      assert.match(String(messages[1]?.content), /Earlier acknowledgement/u)
    }
    return jsonResponse({
      id: 'chatcmpl-controlled-kimi-k3',
      object: 'chat.completion',
      model: 'kimi-k3',
      choices: [{
        index: 0,
        finish_reason: 'stop',
        message: {
          role: 'assistant',
          content: JSON.stringify({
            assistant_reply:
              'I saved the clean-caption direction for the next plan. No editing, generation, or credits started.',
            direction_saved: true,
            execution_started: false,
            plan_created: false,
            credits_changed: false,
          }),
        },
      }],
      usage: {
        prompt_tokens: 235,
        completion_tokens: 92,
        total_tokens: 327,
      },
    })
  },
})

const completed = await assistant.respond(requestFixture('message-1'))
assert.equal(completed.status, 'completed')
assert.equal(completed.providerCallMade, true)
assert.equal(completed.modelCallMade, true)
assert.equal(completed.credentialVersion, 2)
assert.deepEqual(completed.usage, {
  promptTokens: 235,
  completionTokens: 92,
  totalTokens: 327,
})
assert.match(completed.assistantContent ?? '', /next plan/i)

const secondCompleted = await assistant.respond(requestFixture('message-2', [{
  userContent: 'Earlier direction',
  assistantContent: 'Earlier acknowledgement',
}]))
assert.equal(secondCompleted.status, 'completed')
assert.equal(credentialReadCount, 1)
assert.equal(providerCallCount, 2)

let unknownOutcomeCallCount = 0
const unknownOutcomeAssistant = createKimiK3SourceLedChatAssistantPort({
  env,
  credentialResolver: {
    async resolve() {
      return { value: 'controlled-kimi-token', version: 2 }
    },
  },
  async fetchImpl() {
    unknownOutcomeCallCount += 1
    throw new Error('controlled network uncertainty')
  },
})
const unknownOutcome = await unknownOutcomeAssistant.respond(
  requestFixture('unknown-outcome'),
)
assert.equal(unknownOutcome.status, 'outcome_unknown')
assert.equal(unknownOutcome.providerCallMade, true)
assert.equal(unknownOutcome.modelCallMade, false)
assert.equal(unknownOutcomeCallCount, 1)

let unavailableProviderCallCount = 0
const unavailableAssistant = createKimiK3SourceLedChatAssistantPort({
  env,
  credentialResolver: {
    async resolve(): Promise<never> {
      throw new Error('controlled unavailable secret')
    },
  },
  async fetchImpl() {
    unavailableProviderCallCount += 1
    return jsonResponse({})
  },
})
const unavailable = await unavailableAssistant.respond(
  requestFixture('credential-unavailable'),
)
assert.equal(unavailable.status, 'credential_unavailable')
assert.equal(unavailable.providerCallMade, false)
assert.equal(unavailable.modelCallMade, false)
assert.equal(unavailableProviderCallCount, 0)

const unsafeAssistant = createKimiK3SourceLedChatAssistantPort({
  env,
  credentialResolver: {
    async resolve() {
      return { value: 'controlled-kimi-token', version: 2 }
    },
  },
  async fetchImpl() {
    return jsonResponse({
      object: 'chat.completion',
      model: 'kimi-k3',
      choices: [{
        finish_reason: 'stop',
        message: {
          content: JSON.stringify({
            assistant_reply:
              'I have started editing and credits were deducted.',
            direction_saved: true,
            execution_started: false,
            plan_created: false,
            credits_changed: false,
          }),
        },
      }],
      usage: {
        prompt_tokens: 10,
        completion_tokens: 10,
        total_tokens: 20,
      },
    })
  },
})
const unsafe = await unsafeAssistant.respond(requestFixture('unsafe-response'))
assert.equal(unsafe.status, 'invalid_response')
assert.equal(unsafe.assistantContent, undefined)

assert.equal(
  kimiK3SourceLedChatAssistantRuntimeSchema.safeParse({
    source: 'kimi_k3',
    status: 'completed',
    routeId: 'kimi_k3_primary',
    providerModel: 'kimi-k3',
    credentialSource: 'google_secret_manager_pinned_version',
    credentialVersion: 2,
    providerCallMade: true,
    modelCallMade: false,
    attemptDigestSha256: 'a'.repeat(64),
  }).success,
  false,
)

console.log(JSON.stringify({
  smoke: 'kimi-k3-source-led-chat-assistant',
  controlledCompletedCalls: providerCallCount,
  credentialReads: credentialReadCount,
  unknownOutcomeRetries: unknownOutcomeCallCount - 1,
  secretManagerVersion: completed.credentialVersion,
  providerModel: completed.providerModel,
}))

function requestFixture(
  clientMessageId: string,
  priorExchanges: Array<{
    readonly userContent: string
    readonly assistantContent: string
  }> = [],
) {
  return {
    workspaceId: 'workspace-kimi-smoke',
    projectId: 'project-kimi-smoke',
    editSessionId: 'edit-session-kimi-smoke',
    clientMessageId,
    message:
      'Keep the speaker visible and use clean, readable captions.',
    priorExchanges,
    serverDisposition: 'applied_to_next_plan' as const,
    requiredSetupConfirmations: [],
    requestedSettings: {},
  }
}

function jsonResponse(value: unknown): Response {
  return new Response(JSON.stringify(value), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}
