import type { SoundAgentPlannerInput } from '../../types/audio-music'

export interface MockSoundMusicAudioScenario {
  id: string
  label: string
  description: string
  input: SoundAgentPlannerInput
  expectedPrimaryToolId?: string
  expectedBlockedReason?: string
}

const basePreferences: SoundAgentPlannerInput['userSoundPreferences'] = {
  enableSfx: true,
  enableAmbience: true,
  enableMusic: true,
  preferSubtleSound: true,
  avoidFakeFoley: true,
  avoidLoudSfxUnderSpeech: true,
  moodKeywords: ['premium', 'warm'],
  referenceStyleNotes: ['Use reference style as category-level mood only; do not copy exact audio.'],
}

const baseTranscript: SoundAgentPlannerInput['transcriptSummary'] = {
  hasSpeech: false,
  speechDensity: 'low',
  importantSpeechRanges: [],
  silenceRanges: [{ startSeconds: 0, endSeconds: 2 }],
}

const baseAudioContext: SoundAgentPlannerInput['existingAudioContext'] = {
  hasOriginalAudio: true,
  hasMusic: false,
  musicMood: 'warm premium',
  ambienceDescription: 'quiet room tone',
  noisyDialogue: false,
  cleanupNeeded: false,
}

function baseInput(id: string): SoundAgentPlannerInput {
  return {
    workspaceId: 'mock-sound-workspace',
    projectId: `mock-sound-project-${id}`,
    editPlanId: `mock-sound-edit-plan-${id}`,
    executionMode: 'planning_only',
    requestedOutputMode: 'planning_only',
    userSoundPreferences: basePreferences,
    transcriptSummary: baseTranscript,
    editSegments: [
      {
        segmentId: `mock-sound-segment-${id}`,
        startTimeSeconds: 0,
        endTimeSeconds: 8,
        visualSummary: 'Speaker moves through a calm lifestyle scene.',
        storyPurpose: 'Support pacing without distracting from the edit.',
        motionIntensity: 'subtle',
        hasTitleCard: false,
        hasObjectMotion: false,
        hasGesture: false,
        needsEmotionalLift: false,
      },
    ],
    existingAudioContext: baseAudioContext,
    timingHints: {
      cuts: [{ hintId: `mock-cut-${id}`, timeSeconds: 0.6, relatedSegmentId: `mock-sound-segment-${id}` }],
      beats: [],
      transitions: [],
      gestures: [],
      objectMotions: [],
      titleCards: [],
    },
    sourceEvidence: {
      editPlanSource: 'mock approved edit plan metadata',
      timingSource: 'mock timing manifest metadata',
      transcriptSource: 'mock transcript summary metadata',
      userInstructionSource: 'structured sound preferences fixture',
    },
    deterministicIdSeed: `mock-sound-seed-${id}`,
  }
}

function scenario(input: MockSoundMusicAudioScenario): MockSoundMusicAudioScenario {
  return input
}

export const mockSoundMusicAudioScenarios: MockSoundMusicAudioScenario[] = [
  scenario({
    id: 'short-transition-whoosh',
    label: 'Short transition whoosh plan',
    description: 'A short transition cue routes to the action/foley SFX planning tool.',
    expectedPrimaryToolId: 'action_foley_sfx_tool',
    input: {
      ...baseInput('short-transition-whoosh'),
      editSegments: [
        {
          ...baseInput('short-transition-whoosh').editSegments[0],
          transitionType: 'soft whoosh cut',
          motionIntensity: 'medium',
          storyPurpose: 'Bridge the cut between two lifestyle beats.',
        },
      ],
      timingHints: {
        ...baseInput('short-transition-whoosh').timingHints,
        transitions: [{ hintId: 'mock-transition-whoosh-hint', timeSeconds: 2.4, relatedSegmentId: 'mock-sound-segment-short-transition-whoosh' }],
      },
    },
  }),
  scenario({
    id: 'title-card-hit',
    label: 'Title-card hit/accent plan',
    description: 'A title card creates a subtle metadata-only title accent.',
    expectedPrimaryToolId: 'action_foley_sfx_tool',
    input: {
      ...baseInput('title-card-hit'),
      editSegments: [
        {
          ...baseInput('title-card-hit').editSegments[0],
          hasTitleCard: true,
          storyPurpose: 'Punctuate a chapter title without becoming loud.',
        },
      ],
      timingHints: {
        ...baseInput('title-card-hit').timingHints,
        titleCards: [{ hintId: 'mock-title-card-hint', timeSeconds: 1.2, relatedSegmentId: 'mock-sound-segment-title-card-hit' }],
      },
    },
  }),
  scenario({
    id: 'ambient-city-cafe-bed',
    label: 'Ambient city/cafe bed plan',
    description: 'Longer ambience routes to the ambient everyday soundscape planning tool.',
    expectedPrimaryToolId: 'ambient_everyday_soundscape_tool',
    input: {
      ...baseInput('ambient-city-cafe-bed'),
      userSoundPreferences: {
        ...basePreferences,
        enableSfx: false,
        enableMusic: false,
      },
      editSegments: [
        {
          ...baseInput('ambient-city-cafe-bed').editSegments[0],
          visualSummary: 'City cafe b-roll with street movement outside the window.',
          storyPurpose: 'Preserve city/cafe ambience as a soft bed under the scene.',
        },
      ],
      existingAudioContext: {
        ...baseAudioContext,
        ambienceDescription: 'soft city cafe room tone',
      },
    },
  }),
  scenario({
    id: 'music-mood-layer',
    label: 'Music mood layer plan',
    description: 'Emotional lift routes to music cue planning metadata.',
    expectedPrimaryToolId: 'music_cue_planner',
    input: {
      ...baseInput('music-mood-layer'),
      userSoundPreferences: {
        ...basePreferences,
        enableSfx: false,
        enableAmbience: false,
        moodKeywords: ['hopeful', 'cinematic', 'restrained'],
      },
      editSegments: [
        {
          ...baseInput('music-mood-layer').editSegments[0],
          needsEmotionalLift: true,
          storyPurpose: 'Lift the emotional reveal while staying speech-safe.',
        },
      ],
    },
  }),
  scenario({
    id: 'dialogue-heavy-ducking',
    label: 'Dialogue-heavy segment requiring ducking',
    description: 'Speech-heavy timing creates ducking and QA handoff metadata.',
    expectedPrimaryToolId: 'music_cue_planner',
    input: {
      ...baseInput('dialogue-heavy-ducking'),
      transcriptSummary: {
        hasSpeech: true,
        speechDensity: 'high',
        importantSpeechRanges: [{ startSeconds: 0.5, endSeconds: 6.5 }],
        silenceRanges: [],
      },
      editSegments: [
        {
          ...baseInput('dialogue-heavy-ducking').editSegments[0],
          needsEmotionalLift: true,
          storyPurpose: 'Support important speech with a quiet music bed.',
        },
      ],
      existingAudioContext: {
        ...baseAudioContext,
        cleanupNeeded: true,
      },
      timingHints: {
        ...baseInput('dialogue-heavy-ducking').timingHints,
        beats: [{ hintId: 'mock-dialogue-beat', timeSeconds: 3, relatedSegmentId: 'mock-sound-segment-dialogue-heavy-ducking' }],
      },
    },
  }),
  scenario({
    id: 'raw-chat-rejected',
    label: 'Raw chat prompt rejected case',
    description: 'A raw prompt property blocks handoff/execution metadata.',
    expectedBlockedReason: 'raw_chat_execution_blocked',
    input: {
      ...baseInput('raw-chat-rejected'),
      rawChatPrompt: 'Make it sound awesome and execute this directly.',
    } as SoundAgentPlannerInput & { rawChatPrompt: string },
  }),
  scenario({
    id: 'approved-generation-blocked',
    label: 'Approved-generation attempt blocked case',
    description: 'Approved generation still blocks because provider generation, credits, and workers are disabled.',
    expectedBlockedReason: 'credit_reservation_required',
    input: {
      ...baseInput('approved-generation-blocked'),
      approvedPlanSnapshotId: 'mock-approved-snapshot-sound-1c',
      executionMode: 'approved_generation',
      requestedOutputMode: 'handoff_manifest_only',
      editSegments: [
        {
          ...baseInput('approved-generation-blocked').editSegments[0],
          transitionType: 'hit on cut',
          motionIntensity: 'medium',
          storyPurpose: 'Test approved generation gate blockers.',
        },
      ],
    },
  }),
]
