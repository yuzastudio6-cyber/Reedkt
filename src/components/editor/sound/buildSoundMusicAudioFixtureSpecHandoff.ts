import type {
  SoundMusicAudioGeneratedLocalFixtureOwner,
  SoundMusicAudioGeneratedLocalFixtureSpec,
} from '../../../backend/mock/mock-sound-music-audio-generated-local-fixture-spec'
import type { SoundProviderId } from '../../../types/audio-music'

export interface SoundMusicAudioFixtureSpecGateDisplay {
  label: string
  value: false
}

export interface SoundMusicAudioFixtureSpecOwnerDisplay {
  owner: SoundMusicAudioGeneratedLocalFixtureOwner
  requiredBeforeFixtureExecution: boolean
  acceptedForSpecOnly: boolean
  mayExecute: false
}

export interface SoundMusicAudioFixtureSpecHandoffDisplay {
  workstream: 'SOUND_MUSIC_AUDIO'
  mode: 'generated_local_fixture_spec_only'
  currentUnlockStage: 'dry_run_passed'
  targetFutureUnlockStage: 'generated_local_fixture_passed'
  claimsGeneratedLocalFixturePassed: false
  handoffOnly: true
  fixtureArtifactId: string
  expectedChecksumAlgorithm: 'sha256'
  expectedChecksumValue: string
  expectedPrivatePath: string
  sourceOfTruthPath: {
    requiresSupabaseRow: true
    requiresPrivateGcsPath: true
    requiresManifest: true
    requiresChecksum: true
    requiresApprovedPlanSnapshot: true
    signedUrlsAreSourceOfTruth: false
    publicUrlsAllowed: false
  }
  approvedSnapshotRequirementId: string
  timingManifestRequirementId: string
  privateArtifactManifestRequirementId: string
  noExecutionGates: SoundMusicAudioFixtureSpecGateDisplay[]
  providerCallAllowedByProvider: Record<SoundProviderId, false>
  lyriaBoundary: {
    musicOnly: true
    allowedFamilies: string[]
    sfxAllowed: false
    foleyAllowed: false
    ambienceAllowed: false
    generationAllowed: false
    providerGatewayOwnerRequired: true
  }
  ownerAcceptanceMap: SoundMusicAudioFixtureSpecOwnerDisplay[]
  blockedUses: string[]
  nextAllowedPromptRecommendation: string
}

const noExecutionGateLabels: Array<keyof SoundMusicAudioGeneratedLocalFixtureSpec['execution']> = [
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
  'signedUrlCreationAllowed',
  'publicArtifactAllowed',
  'creditOrApprovalRecordAllowed',
]

export function buildSoundMusicAudioFixtureSpecHandoff(
  spec: SoundMusicAudioGeneratedLocalFixtureSpec,
): SoundMusicAudioFixtureSpecHandoffDisplay {
  return {
    workstream: spec.workstream,
    mode: spec.mode,
    currentUnlockStage: spec.currentUnlockStage,
    targetFutureUnlockStage: spec.targetFutureUnlockStage,
    claimsGeneratedLocalFixturePassed: spec.claimsGeneratedLocalFixturePassed,
    handoffOnly: true,
    fixtureArtifactId: spec.fixtureArtifactPlan.fixtureArtifactId,
    expectedChecksumAlgorithm: spec.fixtureArtifactPlan.expectedChecksumAlgorithm,
    expectedChecksumValue: spec.fixtureArtifactPlan.expectedChecksumValue,
    expectedPrivatePath: spec.fixtureArtifactPlan.expectedPrivatePath,
    sourceOfTruthPath: spec.sourceOfTruthPath,
    approvedSnapshotRequirementId: spec.approvedSnapshotRequirements.approvedPlanSnapshotId,
    timingManifestRequirementId: spec.timingManifestRequirements.cueManifestId,
    privateArtifactManifestRequirementId: spec.privateArtifactManifestRequirements.privateAudioArtifactManifestId,
    noExecutionGates: noExecutionGateLabels.map((gate) => ({
      label: gate,
      value: spec.execution[gate],
    })),
    providerCallAllowedByProvider: spec.providerRules.providerCallAllowedByProvider,
    lyriaBoundary: {
      musicOnly: spec.providerRules.lyriaMusicOnly,
      allowedFamilies: spec.providerRules.lyriaAllowedFamilies,
      sfxAllowed: spec.providerRules.lyriaSfxAllowed,
      foleyAllowed: spec.providerRules.lyriaFoleyAllowed,
      ambienceAllowed: spec.providerRules.lyriaAmbienceAllowed,
      generationAllowed: spec.providerRules.lyriaGenerationAllowed,
      providerGatewayOwnerRequired: spec.providerRules.providerGatewayOwnerRequired,
    },
    ownerAcceptanceMap: spec.ownerAcceptanceMap.map((owner) => ({
      owner: owner.owner,
      requiredBeforeFixtureExecution: owner.requiredBeforeFixtureExecution,
      acceptedForSpecOnly: owner.acceptedForSpecOnly,
      mayExecute: owner.mayExecute,
    })),
    blockedUses: spec.blockedUses,
    nextAllowedPromptRecommendation: spec.nextAllowedPromptRecommendation,
  }
}
