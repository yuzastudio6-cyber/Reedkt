import type { ProviderSecretPolicy } from './provider-model-approval-types'

export function buildProviderSecretPolicy(): ProviderSecretPolicy {
  return {
    policyId: 'provider1_secret_policy',
    deepSeekSecretReferenceEnv: 'GOOGLE_SECRET_DEEPSEEK_API_KEY_NAME',
    deepSeekProviderKeySemantics: 'DEEPSEEK_API_KEY',
    qwenSecretReferenceEnv: 'GOOGLE_SECRET_QWEN_DASHSCOPE_API_KEY_NAME',
    qwenProviderKeySemantics: 'DASHSCOPE_API_KEY',
    alternateQwenEnvNameRecorded: 'QWEN_API_KEY',
    allowedStorage: [
      'Google Secret Manager secret reference names',
      'backend-only Provider Gateway configuration metadata',
      'private milestone metadata recording reference-name presence only',
    ],
    blockedStorage: [
      'raw API key values in git',
      'raw API key values in docs',
      'raw API key values in Supabase rows',
      'raw API key values in GCS artifacts',
      'frontend variables',
      'logs, screenshots, PR text, or command output',
    ],
    secretManagerOnly: true,
    backendProviderGatewayOnly: true,
    frontendExposureAllowed: false,
    secretValuesResolvedInProvider1: false,
    secretManagerMetadataCheckedInProvider1: false,
  }
}
