import {
  assertRuntimeCanStart,
  loadRuntimeEnv,
} from '../config/env'
import {
  createGpt56TerraSourceLedChatAssistantPort,
} from '../services/gpt-5-6-terra-source-led-chat-assistant'

const env = loadRuntimeEnv()
assertRuntimeCanStart(env)
if (
  env.kimiRuntimeMode === 'disabled'
  || env.openAiRuntimeMode === 'disabled'
) {
  throw new Error(
    'The Kimi primary and GPT-5.6 Terra fallback runtimes must both be enabled.',
  )
}

const result = await createGpt56TerraSourceLedChatAssistantPort({
  env,
}).respond({
  workspaceId: 'workspace-private-terra-live-canary',
  projectId: 'project-private-terra-live-canary',
  editSessionId: 'edit-private-terra-live-canary',
  clientMessageId: `terra-live-canary-${Date.now()}`,
  message:
    'Use clean readable captions and preserve the speaker throughout the edit.',
  priorExchanges: [],
  serverDisposition: 'applied_to_next_plan',
  requiredSetupConfirmations: [],
  requestedSettings: {},
})

if (
  result.status !== 'completed'
  || !result.assistantContent
  || !result.usage
  || result.credentialVersion === null
) {
  throw new Error(
    `GPT-5.6 Terra live canary did not complete: ${result.status}.`,
  )
}

console.log(JSON.stringify({
  ok: true,
  canary: 'gpt-5.6-terra-source-led-chat-fallback-transport',
  source: result.source,
  routeId: result.routeId,
  providerModel: result.providerModel,
  credentialSource: result.credentialSource,
  credentialVersion: result.credentialVersion,
  providerCallMade: result.providerCallMade,
  modelCallMade: result.modelCallMade,
  attemptDigestSha256: result.attemptDigestSha256,
  usage: result.usage,
  assistantContentPresent: result.assistantContent.length > 0,
  assistantContentSerialized: false,
  executionStarted: false,
  planCreated: false,
  creditsChanged: false,
}))
