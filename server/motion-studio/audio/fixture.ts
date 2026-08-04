import { sha256CanonicalJson } from '../commands/canonical-json'
import type { CompileMotionStudioAudioAuthorityInput } from './types'

export const MOTION_STUDIO_AUDIO_FIXTURE_NOW = '2026-07-17T16:00:00.000Z'

export function motionStudioAudioFixtureUuid(sequence: number): string {
  return `00000000-0000-4000-8000-${sequence.toString().padStart(12, '0')}`
}

export function createMotionStudioAudioFixtureInput(): CompileMotionStudioAudioAuthorityInput {
  const uuid = motionStudioAudioFixtureUuid
  const ownership = {
    workspaceId: uuid(1),
    projectId: uuid(2),
    editSessionId: uuid(3),
  }
  const productionId = uuid(4)
  const timingAuthority = {
    masterTimingPlanVersionId: uuid(5),
    confirmedFrameId: uuid(6),
    timingAuthorityDigest: '1'.repeat(64),
    frameRate: 24,
    width: 1920,
    height: 1080,
    aspectRatio: '16:9',
    durationFrames: 192,
    timebase: '1/24',
  }
  const preparedScript = {
    ...ownership,
    id: uuid(7),
    productionId,
    scriptMode: 'prepared' as const,
    title: 'The document that changed the investigation',
    language: 'en-US',
    timingAuthority,
    chapters: [{
      id: uuid(8),
      order: 0,
      title: 'The turning point',
      sceneIds: [uuid(9), uuid(10)],
    }],
    narrationSegments: [{
      id: uuid(11),
      order: 0,
      chapterId: uuid(8),
      sceneId: uuid(9),
      startTimingAnchorId: uuid(12),
      endTimingAnchorId: uuid(13),
      startFrame: 0,
      endFrame: 96,
      text: 'Dr. Maya Ortiz placed the document on the table.',
      meaning: 'A named investigator introduces the decisive document.',
      visualCue: 'Show the investigator placing the document in the evidence area.',
      preservationPolicy: 'preserve_exact' as const,
      claimIds: [],
      sourceReferenceIds: [],
    }, {
      id: uuid(14),
      order: 1,
      chapterId: uuid(8),
      sceneId: uuid(10),
      startTimingAnchorId: uuid(13),
      endTimingAnchorId: uuid(15),
      startFrame: 96,
      endFrame: 192,
      text: 'That single record changed the investigation.',
      meaning: 'The document materially redirects the investigation.',
      visualCue: 'Move from the document to the revised evidence path.',
      preservationPolicy: 'preserve_exact' as const,
      claimIds: [],
      sourceReferenceIds: [],
    }],
    userLockedText: true as const,
  }
  const preparedScriptArtifactPayload = {
    schemaVersion: 'motion-studio.prepared-script.v1',
    references: [],
    extensions: [],
    data: preparedScript,
  }
  const asset = (sequence: number, digestCharacter: string, rightsSequence: number) => ({
    assetId: uuid(sequence),
    assetVersionId: uuid(sequence + 1),
    contentDigest: digestCharacter.repeat(64),
    provenanceRecordId: uuid(sequence + 2),
    rightsEvidenceIds: [uuid(rightsSequence)],
  })
  return {
    ownership,
    productionId,
    approvedSnapshotId: uuid(16),
    approvedSnapshotDigest: '2'.repeat(64),
    approvedTimingAuthority: timingAuthority,
    preparedScript,
    preparedScriptArtifactPayload,
    preparedScriptArtifactVersion: {
      artifactId: preparedScript.id,
      versionId: uuid(17),
      versionNumber: 1,
      contentDigest: sha256CanonicalJson(preparedScriptArtifactPayload),
    },
    authorityArtifactVersions: {
      voiceBible: {
        artifactId: uuid(18),
        versionId: uuid(19),
        versionNumber: 1,
        contentDigest: '3'.repeat(64),
      },
      musicBible: {
        artifactId: uuid(20),
        versionId: uuid(21),
        versionNumber: 1,
        contentDigest: '4'.repeat(64),
      },
      mixPlan: {
        artifactId: uuid(22),
        versionId: uuid(23),
        versionNumber: 1,
        contentDigest: '5'.repeat(64),
      },
    },
    actorUserId: uuid(24),
    createdAt: MOTION_STUDIO_AUDIO_FIXTURE_NOW,
    assets: {
      uploadedNarration: asset(30, '6', 60),
      generatedSpeechProtocol: asset(33, '7', 61),
      uploadedMusic: asset(36, '8', 62),
      synchronizedFoleyProtocol: asset(39, '9', 63),
      licensedExactSfx: asset(42, 'a', 64),
    },
    voiceDirections: [{
      preparedScriptSegmentId: uuid(11),
      spokenText: 'Doctor Maya Ortiz placed the document on the table.',
      spokenTextChangeReason: 'abbreviation_expansion',
      spokenTextChangeExplanation: 'Expand the title for unambiguous narration while preserving the exact sentence meaning.',
      pronunciationEntries: [{
        pronunciationId: uuid(50),
        writtenForm: 'Dr.',
        spokenForm: 'Doctor',
        language: 'en-US',
        reason: 'abbreviation',
        evidenceId: uuid(51),
      }],
      performance: {
        pace: 'measured',
        energy: 'restrained',
        emotionalDirection: ['controlled', 'observational'],
        emphasisTerms: ['document'],
        pauseBeforeFrames: 0,
        pauseAfterFrames: 4,
        performanceTagIds: ['calm-documentary'],
      },
    }, {
      preparedScriptSegmentId: uuid(14),
      spokenText: 'That single record changed the investigation.',
      spokenTextChangeReason: 'none',
      pronunciationEntries: [],
      performance: {
        pace: 'measured',
        energy: 'balanced',
        emotionalDirection: ['quiet consequence'],
        emphasisTerms: ['changed'],
        pauseBeforeFrames: 4,
        pauseAfterFrames: 0,
        performanceTagIds: ['restrained-emphasis'],
      },
    }],
    musicDirection: {
      mood: ['restrained tension', 'measured resolution'],
      instrumentation: ['low strings', 'soft pulse'],
      narrativePurpose: 'Support the turning point without overstating the factual evidence.',
      emotionalDirection: 'Move from quiet tension to restrained clarity.',
      speechOverlapPolicy: 'duck_below_narration',
      rightsEvidenceIds: [uuid(62)],
    },
  }
}
