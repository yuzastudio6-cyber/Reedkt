import type { ProviderStoragePolicy } from './provider-model-approval-types'

export function buildProviderStoragePolicy(): ProviderStoragePolicy {
  return {
    policyId: 'provider1_storage_policy',
    supabaseAllowed: [
      'provider call summary in future live phases',
      'model id',
      'purpose',
      'cost estimate',
      'sanitized normalized response summary',
      'QA status',
      'milestone refs',
    ],
    gcsAllowed: ['private provider validation artifacts if a later phase needs them', 'PROVIDER-1 private policy JSON artifacts'],
    blockedStorage: [
      'raw secrets',
      'raw provider payloads when policy disallows them',
      'raw Brave responses',
      'signed URLs as source of truth',
      'private media blobs',
      'sensitive user data',
      'public artifacts',
    ],
    privateGcsOnly: true,
    publicArtifactsAllowed: false,
    signedUrlsAsSourceOfTruthAllowed: false,
  }
}
