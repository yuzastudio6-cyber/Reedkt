import assert from 'node:assert/strict'

import { assertRuntimeCanStart, loadRuntimeEnv } from '../config/env'
import {
  GPT_5_6_TERRA_SOURCE_LED_CHAT_ENDPOINT,
  createGpt56TerraSourceLedChatAssistantPort,
} from '../services/gpt-5-6-terra-source-led-chat-assistant'
import {
  createKimiTerraSourceLedChatAssistantPort,
  sourceLedChatAssistantRuntimeSchema,
  type SourceLedChatAssistantPort,
  type SourceLedChatAssistantRequest,
  type SourceLedChatAssistantResult,
} from '../services/source-led-chat-assistant'

const env = loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  REEDITPRO_KIMI_RUNTIME_MODE: 'internal_test',
  GOOGLE_SECRET_KIMI_API_KEY_NAME:
    'projects/reeditpro/secrets/reeditpro-prod-kimi-api-key/versions/2',
  REEDITPRO_OPENAI_RUNTIME_MODE: 'internal_test',
  GOOGLE_SECRET_OPENAI_API_KEY_NAME:
    'projects/reeditpro/secrets/reeditpro-prod-openai-api-key/versions/2',
})
assert.doesNotThrow(() => assertRuntimeCanStart(env))
assert.throws(
  () => assertRuntimeCanStart(loadRuntimeEnv({
    NODE_ENV: 'test',
    E2E_RUNTIME_MODE: 'local',
    API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
    REEDITPRO_OPENAI_RUNTIME_MODE: 'internal_test',
    GOOGLE_SECRET_OPENAI_API_KEY_NAME:
      'projects/reeditpro/secrets/reeditpro-prod-openai-api-key/versions/2',
  })),
  /requires the Kimi primary runtime/u,
)
assert.throws(
  () => assertRuntimeCanStart(loadRuntimeEnv({
    NODE_ENV: 'test',
    E2E_RUNTIME_MODE: 'local',
    API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
    REEDITPRO_KIMI_RUNTIME_MODE: 'internal_test',
    GOOGLE_SECRET_KIMI_API_KEY_NAME:
      'projects/reeditpro/secrets/reeditpro-prod-kimi-api-key/versions/2',
    REEDITPRO_OPENAI_RUNTIME_MODE: 'internal_test',
    GOOGLE_SECRET_OPENAI_API_KEY_NAME:
      'projects/reeditpro/secrets/reeditpro-prod-openai-api-key/versions/latest',
  })),
  /explicitly pinned Secret Manager version/u,
)

let credentialReadCount = 0
let terraCallCount = 0
const terra = createGpt56TerraSourceLedChatAssistantPort({
  env,
  credentialResolver: {
    async resolve() {
      credentialReadCount += 1
      return {
        value: 'controlled-non-secret-openai-token',
        version: 2,
      }
    },
  },
  async fetchImpl(url, init) {
    terraCallCount += 1
    assert.equal(url, GPT_5_6_TERRA_SOURCE_LED_CHAT_ENDPOINT)
    assert.equal(init?.method, 'POST')
    const headers = new Headers(init?.headers)
    assert.equal(
      headers.get('authorization'),
      'Bearer controlled-non-secret-openai-token',
    )
    const body = JSON.parse(String(init?.body)) as Record<string, unknown>
    assert.equal(body.model, 'gpt-5.6-terra')
    assert.equal(body.store, false)
    assert.equal(body.truncation, 'disabled')
    assert.equal(body.max_output_tokens, 1_024)
    assert.deepEqual(body.reasoning, {
      effort: 'low',
      context: 'current_turn',
    })
    assert.equal(typeof body.safety_identifier, 'string')
    assert.equal(String(body.safety_identifier).length, 64)
    assert.equal(typeof body.prompt_cache_key, 'string')
    assert.equal(String(body.prompt_cache_key).length, 64)
    assert.equal(
      JSON.stringify(body).includes('controlled-non-secret-openai-token'),
      false,
    )
    const text = body.text as Record<string, unknown>
    const format = text.format as Record<string, unknown>
    assert.equal(format.type, 'json_schema')
    assert.equal(format.strict, true)
    return responseFixture(
      'I saved the clean-caption direction for the next plan. No editing, generation, or credits started.',
    )
  },
})

const completed = await terra.respond(requestFixture('terra-completed'))
assert.equal(completed.status, 'completed')
assert.equal(completed.source, 'gpt_5_6_terra')
assert.equal(completed.routeId, 'gpt_5_6_terra_fallback')
assert.equal(completed.providerModel, 'gpt-5.6-terra')
assert.equal(completed.credentialVersion, 2)
assert.deepEqual(completed.usage, {
  promptTokens: 240,
  completionTokens: 90,
  totalTokens: 330,
})
assert.equal(terraCallCount, 1)

const secondCompleted = await terra.respond(requestFixture('terra-second'))
assert.equal(secondCompleted.status, 'completed')
assert.equal(credentialReadCount, 1)
assert.equal(terraCallCount, 2)

const unsafeTerra = createGpt56TerraSourceLedChatAssistantPort({
  env,
  credentialResolver: controlledCredentialResolver(),
  async fetchImpl() {
    return responseFixture(
      'I have started rendering and credits were deducted.',
    )
  },
})
const unsafe = await unsafeTerra.respond(requestFixture('unsafe-terra'))
assert.equal(unsafe.status, 'invalid_response')
assert.equal(unsafe.assistantContent, undefined)

let fallbackCallCount = 0
const fallbackTerra: SourceLedChatAssistantPort = {
  async respond() {
    fallbackCallCount += 1
    return completedResult('gpt_5_6_terra')
  },
}
const eligibleFallback = createKimiTerraSourceLedChatAssistantPort({
  kimi: {
    async respond() {
      return kimiFailure('rate_limited', true, false)
    },
  },
  terra: fallbackTerra,
})
const fallbackResult = await eligibleFallback.respond(
  requestFixture('eligible-fallback'),
)
assert.equal(fallbackResult.source, 'gpt_5_6_terra')
assert.equal(fallbackResult.fallbackTrigger, 'provider_rate_limited')
assert.equal(fallbackResult.fallbackFrom?.status, 'rate_limited')
assert.equal(fallbackResult.fallbackFrom?.providerCallMade, true)
assert.equal(fallbackResult.providerCallMade, true)
assert.equal(fallbackResult.modelCallMade, true)
assert.equal(fallbackCallCount, 1)
assert.equal(
  sourceLedChatAssistantRuntimeSchema.safeParse(
    runtimeEvidence(fallbackResult),
  ).success,
  true,
)

const terminalCredentialFailure = createKimiTerraSourceLedChatAssistantPort({
  kimi: {
    async respond() {
      return kimiFailure('credential_rejected', true, false)
    },
  },
  terra: fallbackTerra,
})
const rejected = await terminalCredentialFailure.respond(
  requestFixture('rejected-primary-credential'),
)
assert.equal(rejected.source, 'kimi_k3')
assert.equal(rejected.status, 'credential_rejected')
assert.equal(rejected.fallbackFrom, undefined)
assert.equal(fallbackCallCount, 1)

const failedFallback = createKimiTerraSourceLedChatAssistantPort({
  kimi: {
    async respond() {
      return kimiFailure('invalid_response', true, true)
    },
  },
  terra: {
    async respond() {
      return {
        ...completedResult('gpt_5_6_terra'),
        status: 'credential_unavailable',
        credentialVersion: null,
        providerCallMade: false,
        modelCallMade: false,
        assistantContent: undefined,
        usage: undefined,
      }
    },
  },
})
const failedFallbackResult = await failedFallback.respond(
  requestFixture('failed-fallback'),
)
assert.equal(failedFallbackResult.source, 'gpt_5_6_terra')
assert.equal(failedFallbackResult.modelCallMade, false)
assert.equal(failedFallbackResult.fallbackFrom?.modelCallMade, true)
assert.equal(
  sourceLedChatAssistantRuntimeSchema.safeParse(
    runtimeEvidence(failedFallbackResult),
  ).success,
  true,
)

assert.equal(
  sourceLedChatAssistantRuntimeSchema.safeParse({
    ...runtimeEvidence(fallbackResult),
    fallbackTrigger: 'provider_timeout',
  }).success,
  false,
)
assert.equal(
  sourceLedChatAssistantRuntimeSchema.safeParse({
    ...runtimeEvidence(fallbackResult),
    source: 'kimi_k3',
    routeId: 'kimi_k3_primary',
    providerModel: 'kimi-k3',
  }).success,
  false,
)

console.log(JSON.stringify({
  smoke: 'gpt-5-6-terra-source-led-chat-assistant',
  primaryRoute: 'kimi-k3',
  fallbackRoute: completed.providerModel,
  controlledTerraCalls: terraCallCount,
  credentialReads: credentialReadCount,
  eligibleFallbacks: fallbackCallCount,
  credentialFailureFallbacks: 0,
}))

function requestFixture(clientMessageId: string): SourceLedChatAssistantRequest {
  return {
    workspaceId: 'workspace-terra-smoke',
    projectId: 'project-terra-smoke',
    editSessionId: 'edit-session-terra-smoke',
    clientMessageId,
    message:
      'Keep the speaker visible and use clean, readable captions.',
    priorExchanges: [],
    serverDisposition: 'applied_to_next_plan',
    requiredSetupConfirmations: [],
    requestedSettings: {},
  }
}

function controlledCredentialResolver() {
  return {
    async resolve() {
      return {
        value: 'controlled-non-secret-openai-token',
        version: 2,
      }
    },
  }
}

function responseFixture(assistantReply: string): Response {
  return new Response(JSON.stringify({
    id: 'resp_controlled_terra',
    object: 'response',
    status: 'completed',
    model: 'gpt-5.6-terra',
    output: [{
      id: 'msg_controlled_terra',
      type: 'message',
      role: 'assistant',
      status: 'completed',
      content: [{
        type: 'output_text',
        text: JSON.stringify({
          assistant_reply: assistantReply,
          direction_saved: true,
          execution_started: false,
          plan_created: false,
          credits_changed: false,
        }),
      }],
    }],
    usage: {
      input_tokens: 240,
      output_tokens: 90,
      total_tokens: 330,
    },
  }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}

function kimiFailure(
  status: Exclude<SourceLedChatAssistantResult['status'], 'completed'>,
  providerCallMade: boolean,
  modelCallMade: boolean,
) {
  return {
    source: 'kimi_k3' as const,
    status,
    routeId: 'kimi_k3_primary' as const,
    providerModel: 'kimi-k3' as const,
    credentialSource:
      'google_secret_manager_pinned_version' as const,
    credentialVersion: providerCallMade ? 2 : null,
    providerCallMade,
    modelCallMade,
    attemptDigestSha256: 'a'.repeat(64),
  }
}

function completedResult(
  source: 'gpt_5_6_terra',
): SourceLedChatAssistantResult {
  return {
    source,
    status: 'completed',
    routeId: 'gpt_5_6_terra_fallback',
    providerModel: 'gpt-5.6-terra',
    credentialSource: 'google_secret_manager_pinned_version',
    credentialVersion: 2,
    providerCallMade: true,
    modelCallMade: true,
    assistantContent:
      'I saved that direction for the next plan. No editing or credits started.',
    attemptDigestSha256: 'b'.repeat(64),
    usage: {
      promptTokens: 100,
      completionTokens: 20,
      totalTokens: 120,
    },
  }
}

function runtimeEvidence(
  result: SourceLedChatAssistantResult,
): Omit<SourceLedChatAssistantResult, 'assistantContent'> {
  const { assistantContent: _assistantContent, ...runtime } = result
  void _assistantContent
  return runtime
}
