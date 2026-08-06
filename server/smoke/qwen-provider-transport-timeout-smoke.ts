import assert from 'node:assert/strict'

import { sendQwenProviderTransportRequest } from
  '../../src/backend/qwen-runtime/qwen-provider-transport'
import type { QwenProviderTransportRequest } from
  '../../src/types/qwen-runtime-adapter'

const request: QwenProviderTransportRequest = {
  profile: 'openai_chat_completions',
  baseUrl: 'https://qwen.example.invalid',
  requestPath: '/v1/chat/completions',
  modelId: 'qwen-fixture-model',
  systemPrompt: 'Return a bounded fixture result.',
  userPrompt: 'Inspect the approved fixture sample only.',
  outputSchemaName: 'FixtureVisualResult',
  timeoutMs: 40,
  maxRetries: 2,
}

let bodyStallCalls = 0
const bodyStallFetch = (async (
  _input: Parameters<typeof fetch>[0],
  init?: Parameters<typeof fetch>[1],
) => {
  bodyStallCalls += 1
  const signal = init?.signal
  return {
    ok: true,
    status: 200,
    async text() {
      return new Promise<string>((_resolve, reject) => {
        const abort = () => reject(new DOMException('Aborted', 'AbortError'))
        if (signal?.aborted) return abort()
        signal?.addEventListener('abort', abort, { once: true })
      })
    },
  } as Response
}) as typeof fetch

const startedAt = Date.now()
const stalled = await sendQwenProviderTransportRequest({
  request,
  apiKey: 'fixture-secret-never-logged',
  fetchImpl: bodyStallFetch,
})
const elapsedMs = Date.now() - startedAt
assert.equal(stalled.status, 'outcome_unknown')
assert.equal(stalled.providerCallMade, true)
assert.equal(stalled.modelCallMade, true)
assert.equal(stalled.qwenCallMade, true)
assert.equal(bodyStallCalls, 1)
assert.ok(elapsedMs >= 30 && elapsedMs < 1_000)
assert.match(stalled.warnings.join(' '), /not automatically resubmitted/i)
assert.doesNotMatch(JSON.stringify(stalled), /fixture-secret-never-logged/u)

let completedCalls = 0
const completedFetch = (async () => {
  completedCalls += 1
  return {
    ok: true,
    status: 200,
    async text() {
      return JSON.stringify({
        choices: [{
          message: {
            content: JSON.stringify({ accepted: true }),
          },
        }],
      })
    },
  } as Response
}) as typeof fetch
const completed = await sendQwenProviderTransportRequest({
  request,
  apiKey: 'fixture-secret-never-logged',
  fetchImpl: completedFetch,
})
assert.equal(completed.status, 'completed')
assert.equal(completedCalls, 1)
assert.deepEqual(completed.parsedJson, { accepted: true })

console.log(JSON.stringify({
  smoke: 'qwen-provider-transport-timeout',
  responseBodyTimeoutStatus: stalled.status,
  automaticResubmissions: bodyStallCalls - 1,
  elapsedMs,
  completedStatus: completed.status,
}))
