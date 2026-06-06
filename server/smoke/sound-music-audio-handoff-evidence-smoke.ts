import { readFileSync } from 'node:fs'
import {
  buildSoundMusicAudioHandoffEvidenceReview,
  createMockSoundMusicAudioChatCardProps,
  SoundMusicAudioHandoffEvidenceReviewPanel,
  type SoundMusicAudioEvidenceKey,
  type SoundMusicAudioHandoffEvidenceReview,
  type SoundMusicAudioHandoffEvidenceRow,
} from '../../src/components/editor/sound'

function check(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
}

function assertNoNetworkOrCredentialValues(value: unknown, path = 'review'): void {
  if (!value || typeof value !== 'object') return

  for (const [key, nested] of Object.entries(value)) {
    const normalizedKey = key.toLowerCase()
    check(!normalizedKey.includes('apikey'), `${path}.${key} must not expose an API key field.`)
    check(!normalizedKey.includes('api_key'), `${path}.${key} must not expose an API key field.`)

    if (typeof nested === 'string') {
      const normalizedValue = nested.toLowerCase()
      check(!/^https?:\/\//i.test(nested), `${path}.${key} must not contain a public URL.`)
      check(!normalizedValue.includes('api_key'), `${path}.${key} must not contain an API key value.`)
      check(!normalizedValue.includes('service_role'), `${path}.${key} must not contain a service-role value.`)
      check(!normalizedValue.includes('sk-'), `${path}.${key} must not contain a provider credential shape.`)
    }

    assertNoNetworkOrCredentialValues(nested, `${path}.${key}`)
  }
}

function row(review: SoundMusicAudioHandoffEvidenceReview, key: SoundMusicAudioEvidenceKey): SoundMusicAudioHandoffEvidenceRow {
  const match = review.rows.find((candidate) => candidate.evidenceKey === key)
  if (!match) throw new Error(`Missing evidence row ${key}.`)
  return match
}

const requiredEvidenceKeys: SoundMusicAudioEvidenceKey[] = [
  'approved_plan_snapshot',
  'timing_aware_cue_manifest',
  'private_audio_artifact_manifest',
  'audio_qa',
  'provider_license',
  'worker_execution_contract',
  'track_a_final_composition',
  'track_b_processing',
  'supabase_rls_storage',
  'observability_audit_cost',
]

const props = createMockSoundMusicAudioChatCardProps()
const review = props.evidenceReview
check(Boolean(review), 'Mock chat props must include deterministic handoff evidence review.')
if (!review) throw new Error('Missing evidence review.')

const rebuiltReview = buildSoundMusicAudioHandoffEvidenceReview({
  plan: props.plan,
  timingManifest: props.timingManifest,
  privateArtifactManifest: props.privateArtifactManifest,
  handoffReadiness: props.handoffReadiness,
  summary: props.summary,
  providerSummaries: props.providerSummaries,
  runtimeSummaries: props.runtimeSummaries,
  executionGateResults: props.executionGateResults,
  handoffMetadata: props.handoffMetadata,
  qaNotes: props.qaNotes,
  accessSafety: props.accessSafety,
})

check(typeof SoundMusicAudioHandoffEvidenceReviewPanel === 'function', 'Evidence review panel must remain exported.')
check(review.workstreamId === 'SOUND_MUSIC_AUDIO', 'Evidence review must report SOUND_MUSIC_AUDIO ownership.')
check(review.rows.length === requiredEvidenceKeys.length, 'Evidence review must include exactly the required SOUND-1G rows.')
check(rebuiltReview.rows.length === review.rows.length, 'Evidence review builder must deterministically rebuild rows from card props.')
for (const key of requiredEvidenceKeys) {
  const evidenceRow = row(review, key)
  check(evidenceRow.realExecutionReady === false, `${key} must not be real-execution-ready.`)
  check(evidenceRow.evidenceRecordCreated === false, `${key} must not create evidence records.`)
  check(evidenceRow.currentEvidence.length > 0, `${key} must include current mock metadata.`)
  check(evidenceRow.missingFutureEvidence.length > 0, `${key} must include missing future evidence.`)
  check(evidenceRow.nextOwners.length > 0, `${key} must map to at least one next owner.`)
}

const approvedSnapshot = row(review, 'approved_plan_snapshot')
check(approvedSnapshot.status === 'not_created', 'Approved snapshot evidence must remain not-created.')
check(approvedSnapshot.blockedUses.includes('approved_snapshot_required'), 'Approved snapshot row must include approved_snapshot_required.')
check(review.approvedSnapshotCreated === false, 'Evidence review must not create approved snapshots.')
check(review.evidenceRecordsCreated === false, 'Evidence review must not create evidence records.')
check(review.creditRecordsCreated === false, 'Evidence review must not create credit records.')
check(props.draftCreditEstimate === undefined, 'SOUND-1G chat fixture must not create credit estimates.')

const timingManifest = row(review, 'timing_aware_cue_manifest')
check(timingManifest.status === 'metadata_only', 'Timing manifest evidence must be metadata-only.')
check(props.timingManifest?.metadataOnly === true, 'Timing manifest props must be metadata-only.')
check(props.timingManifest?.trackAFinalRenderReady === false, 'Timing manifest must keep Track A final render not ready.')
check(props.timingManifest?.providerExecutionReady === false, 'Timing manifest must keep provider execution blocked.')
check(props.timingManifest?.workerExecutionReady === false, 'Timing manifest must keep worker execution blocked.')

const privateManifest = row(review, 'private_audio_artifact_manifest')
check(privateManifest.status === 'metadata_only', 'Private audio manifest evidence must be metadata-only.')
check(props.privateArtifactManifest?.metadataOnly === true, 'Private artifact manifest must be metadata-only.')
check(props.privateArtifactManifest?.storageScope === 'private', 'Private artifact manifest must stay private scoped.')
check(props.privateArtifactManifest?.publicArtifactAllowed === false, 'Private artifact manifest must disallow public artifacts.')
check((props.privateArtifactManifest?.generatedAssetIds?.length ?? 0) === 0, 'Private artifact manifest must not reference generated assets.')

for (const key of [
  'audio_qa',
  'provider_license',
  'worker_execution_contract',
  'track_a_final_composition',
  'track_b_processing',
  'supabase_rls_storage',
  'observability_audit_cost',
] satisfies SoundMusicAudioEvidenceKey[]) {
  const evidenceRow = row(review, key)
  check(evidenceRow.status !== 'ready' && evidenceRow.status !== 'accepted_by_consumer', `${key} must remain blocked or handoff-required.`)
  check(evidenceRow.realExecutionReady === false, `${key} must keep realExecutionReady=false.`)
}

check(row(review, 'provider_license').nextOwners.includes('PROVIDER_GATEWAY_MODELS'), 'Provider/license evidence must map to Provider Gateway.')
check(row(review, 'worker_execution_contract').nextOwners.includes('WORKER_RUNTIME_JOBS'), 'Worker evidence must map to Worker Runtime.')
check(row(review, 'track_a_final_composition').nextOwners.includes('TRACK_A_RENDER_EXPORT'), 'Track A evidence must map to Track A.')
check(row(review, 'track_b_processing').nextOwners.includes('TRACK_B_MEDIA_PROCESSING'), 'Track B evidence must map to Track B.')
check(row(review, 'supabase_rls_storage').nextOwners.includes('SUPABASE_RLS_STORAGE_DATABASE'), 'Supabase evidence must map to Supabase/RLS/Storage.')
check(row(review, 'observability_audit_cost').nextOwners.includes('OBSERVABILITY_AUDIT_COST'), 'Observability evidence must map to Observability/Audit/Cost.')

check(review.blockedUseOwnerMap.length > 0, 'Blocked uses must map to next owners.')
for (const mapping of review.blockedUseOwnerMap) {
  check(mapping.nextOwners.length > 0, `${mapping.blockedUse} must include next owner mapping.`)
  check(mapping.explanation.includes('before real audio generation or export'), `${mapping.blockedUse} must explain why real generation/export remains blocked.`)
}

check(review.realGenerationExportBlocked === true, 'Real generation/export must remain blocked.')
check(review.realGenerationExportBlockedReasons.some((reason) => /approved plan snapshot/i.test(reason)), 'Blocked explanation must mention approved plan snapshot evidence.')
check(review.realGenerationExportBlockedReasons.some((reason) => /Provider Gateway/i.test(reason)), 'Blocked explanation must mention Provider Gateway evidence.')
check(review.realGenerationExportBlockedReasons.some((reason) => /Worker/i.test(reason)), 'Blocked explanation must mention Worker Runtime evidence.')
check(review.realGenerationExportBlockedReasons.some((reason) => /Supabase/i.test(reason)), 'Blocked explanation must mention Supabase/RLS/Storage evidence.')
check(review.realGenerationExportBlockedReasons.some((reason) => /Track A/i.test(reason)), 'Blocked explanation must mention Track A final composition/export readiness.')

check(review.mayCallProvider === false, 'Evidence review must keep mayCallProvider=false.')
check(review.mayDispatchWorker === false, 'Evidence review must keep mayDispatchWorker=false.')
check(review.mayCreateGeneratedAsset === false, 'Evidence review must keep mayCreateGeneratedAsset=false.')
check(review.publicArtifactAllowed === false, 'Evidence review must keep publicArtifactAllowed=false.')
check(review.supabaseMutationAllowed === false, 'Evidence review must keep Supabase mutation blocked.')
check(review.storageWriteAllowed === false, 'Evidence review must keep storage writes blocked.')
check(review.providerTransportAllowed === false, 'Evidence review must keep provider transport blocked.')
check(review.finalRenderExportReady === false, 'Evidence review must keep final render/export not ready.')
check(props.accessSafety?.signedUrlExposure === false, 'Evidence props must not expose signed URLs.')
check(props.accessSafety?.providerSecretExposure === false, 'Evidence props must not expose provider secrets.')
check(props.accessSafety?.serviceRoleKeyExposure === false, 'Evidence props must not expose service-role keys.')

assertNoNetworkOrCredentialValues(review)

const cardSource = readFileSync('src/components/editor/sound/SoundMusicAudioPlanCard.tsx', 'utf8')
check(cardSource.includes('SoundMusicAudioHandoffEvidenceReviewPanel'), 'Sound card must render the handoff evidence review panel.')
check(cardSource.includes('buildSoundMusicAudioHandoffEvidenceReview'), 'Sound card must compute evidence review when absent.')

console.log(JSON.stringify({
  ok: true,
  card: 'SOUND-1G',
  workstream: review.workstreamId,
  evidenceRows: review.rows.length,
  blockedUseMappings: review.blockedUseOwnerMap.length,
  realGenerationExportBlocked: review.realGenerationExportBlocked,
  mayCallProvider: review.mayCallProvider,
  mayDispatchWorker: review.mayDispatchWorker,
  mayCreateGeneratedAsset: review.mayCreateGeneratedAsset,
  publicArtifactAllowed: review.publicArtifactAllowed,
  supabaseMutationAllowed: review.supabaseMutationAllowed,
  finalRenderExportReady: review.finalRenderExportReady,
}, null, 2))
