import type {
  SoundMusicAudioOwnerAcceptanceChecklist,
  SoundMusicAudioOwnerAcceptanceChecklistOwnerEntry,
} from '../../../backend/mock/mock-sound-music-audio-owner-acceptance-checklist'

export interface SoundMusicAudioOwnerAcceptanceGateDisplay {
  label: string
  value: false
}

export interface SoundMusicAudioOwnerAcceptanceChecklistDisplay {
  workstream: 'SOUND_MUSIC_AUDIO'
  mode: 'owner_acceptance_checklist_only'
  currentUnlockStage: 'dry_run_passed'
  targetFutureUnlockStage: 'generated_local_fixture_passed'
  claimsGeneratedLocalFixturePassed: false
  handoffOnly: true
  sourceOfTruthPath: SoundMusicAudioOwnerAcceptanceChecklist['sourceOfTruthPath']
  executionPath: SoundMusicAudioOwnerAcceptanceChecklist['executionPath']
  noExecutionGates: SoundMusicAudioOwnerAcceptanceGateDisplay[]
  owners: SoundMusicAudioOwnerAcceptanceChecklistOwnerEntry[]
  blockedUses: string[]
  recommendedImmediateNextPrompt: SoundMusicAudioOwnerAcceptanceChecklist['recommendedImmediateNextPrompt']
}

const noExecutionGateLabels: Array<keyof SoundMusicAudioOwnerAcceptanceChecklist['execution']> = [
  'artifactCreated',
  'fixtureAudioCreated',
  'generatedAssetCreated',
  'providerCallAllowed',
  'workerDispatchAllowed',
  'supabaseMutationAllowed',
  'sqlAllowed',
  'gcpMutationAllowed',
  'dockerAllowed',
  'cloudRunAllowed',
  'ffmpegAllowed',
  'modelDownloadAllowed',
  'modelInferenceAllowed',
  'signedUrlCreationAllowed',
  'publicArtifactAllowed',
  'creditOrApprovalRecordAllowed',
  'trackAFinalExportReady',
  'trackBExecutionAccepted',
]

export function buildSoundMusicAudioOwnerAcceptanceChecklist(
  checklist: SoundMusicAudioOwnerAcceptanceChecklist,
): SoundMusicAudioOwnerAcceptanceChecklistDisplay {
  return {
    workstream: checklist.workstream,
    mode: checklist.mode,
    currentUnlockStage: checklist.currentUnlockStage,
    targetFutureUnlockStage: checklist.targetFutureUnlockStage,
    claimsGeneratedLocalFixturePassed: checklist.claimsGeneratedLocalFixturePassed,
    handoffOnly: checklist.handoffOnly,
    sourceOfTruthPath: checklist.sourceOfTruthPath,
    executionPath: checklist.executionPath,
    noExecutionGates: noExecutionGateLabels.map((gate) => ({
      label: gate,
      value: checklist.execution[gate],
    })),
    owners: checklist.owners,
    blockedUses: checklist.blockedUses,
    recommendedImmediateNextPrompt: checklist.recommendedImmediateNextPrompt,
  }
}
