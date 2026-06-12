import type { ProviderDataPolicy } from './provider-model-approval-types'

export function buildProviderDataPolicy(): ProviderDataPolicy {
  const globalBlockedData = [
    'raw user video, audio, or image media',
    'signed URLs as source of truth',
    'service-role keys',
    'database URLs',
    'provider keys',
    'Stripe keys',
    'private media URLs',
    'raw Supabase rows',
    'unredacted sensitive transcripts',
    'raw provider payloads or responses',
  ]
  return {
    policyId: 'provider1_data_policy',
    qwenAllowedData: [
      'sanitized video evidence manifest',
      'shot and timeline summaries',
      'tool capability summaries',
      'safe user edit instructions',
      'professional editing standard schema',
      'non-sensitive project context',
    ],
    qwenBlockedData: [
      'raw user video, audio, or image media',
      'signed URLs',
      'service-role keys',
      'database URLs',
      'provider keys',
      'private media URLs',
      'unredacted sensitive transcripts',
      'raw Supabase rows',
    ],
    deepSeekAllowedData: [
      'sanitized coding task manifest',
      'small safe interface definitions',
      'test failure summaries with secrets redacted',
      'generated fixture data',
      'tool and specification descriptions',
    ],
    deepSeekBlockedData: [
      'private user media',
      'secrets',
      'service-role keys',
      'database URLs',
      'signed URLs',
      'raw Supabase rows',
      'provider keys',
      'Stripe keys',
      'private GCS URLs unless future policy approves them',
    ],
    globalBlockedData,
    rawProviderPayloadStorageAllowed: false,
    signedUrlSourceOfTruthAllowed: false,
  }
}
