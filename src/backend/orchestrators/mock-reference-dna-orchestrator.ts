import type {
  ReferenceMusicDNARecord,
  ReferenceVideoObservationRecord,
} from '../../types/audio-music'
import { createMockId } from '../mock/mock-database'
import {
  getLakeComoReferenceScenario,
  type MockReferenceVideoScenario,
} from '../mock/mock-reference-video-scenarios'
import { createLyriaPromptPlan } from '../services/lyria-prompt-service'
import { createReferenceGuidedCueSheet } from '../services/music-cue-sheet-service'
import { createMusicDirectorGuidance } from '../services/music-director-service'
import { detectReferenceAudioBehaviors } from '../services/reference-audio-behavior-service'
import { detectReferenceCueBoundaries } from '../services/reference-music-cue-boundary-service'
import { createSafeStyleAdaptationPlan } from '../services/reference-style-adaptation-service'
import {
  createReferenceVideoDNA,
  createReferenceVideoObservation,
} from '../services/reference-video-dna-service'

function observationFromScenario(
  scenario: MockReferenceVideoScenario,
): ReferenceVideoObservationRecord {
  return createReferenceVideoObservation({
    projectId: 'mock-reference-project',
    referenceAssetId: `mock-reference-asset-${scenario.id}`,
    referenceUrl: `mock://reference-video/${scenario.id}`,
    category: scenario.category,
    title: scenario.label,
    summary: scenario.summary,
    durationSeconds: scenario.durationSeconds,
    visualObservations: scenario.visualStyleNotes,
    audioObservations: [
      ...scenario.likelyMusicBehavior,
      ...scenario.likelySfxBehavior,
      ...scenario.ambienceBehavior,
      ...scenario.lyricsInstrumentalBehavior,
    ],
    visualStyleNotes: scenario.visualStyleNotes,
    pacingNotes: scenario.pacingNotes,
    chapterStructureNotes: scenario.likelyAudioSections,
    ambienceNotes: scenario.ambienceBehavior,
    dialogueNotes: scenario.lyricsInstrumentalBehavior,
    montageNotes: scenario.likelyMusicBehavior,
  })
}

export function runMockReferenceVideoDNAFlow(
  scenario: MockReferenceVideoScenario = getLakeComoReferenceScenario(),
) {
  const observation = observationFromScenario(scenario)
  const referenceDnaId = createMockId('reference-music-dna')
  const audioSections = detectReferenceCueBoundaries({
    referenceDnaId,
    observation,
    sectionSummaries: scenario.likelyAudioSections,
  })
  const audioBehaviors = detectReferenceAudioBehaviors({
    referenceDnaId,
    observation,
    sections: audioSections,
  })
  const adaptationPlan = createSafeStyleAdaptationPlan({
    referenceDnaId,
    observation,
    sections: audioSections,
    behaviors: audioBehaviors,
  })
  const referenceMusicDNA = createReferenceVideoDNA({
    observation,
    audioSections,
    audioBehaviors,
    adaptationPlan,
  })
  const warnings = [
    'Mock/local analysis only; no reference video is downloaded or scraped.',
    'Reference timing is approximate style observation, not a copied edit map.',
    ...adaptationPlan.doNotCopyRules.map((rule) => `Do-not-copy: ${rule}`),
  ]

  return {
    observation,
    referenceMusicDNA,
    audioSections,
    audioBehaviors,
    adaptationPlan,
    warnings,
    nextStep: 'use_reference_dna_in_music_director' as const,
  }
}

export function runMockLakeComoReferenceDNAFlow() {
  return runMockReferenceVideoDNAFlow(getLakeComoReferenceScenario())
}

export function runMockReferenceToMusicCueFlow(
  referenceMusicDNA?: ReferenceMusicDNARecord,
) {
  const baseFlow = runMockLakeComoReferenceDNAFlow()
  const dna = referenceMusicDNA ?? baseFlow.referenceMusicDNA
  const adaptationPlan = referenceMusicDNA ? undefined : baseFlow.adaptationPlan
  const musicDirectorGuidance = createMusicDirectorGuidance({
    projectId: dna.projectId,
    referenceMusicDNA: dna,
    adaptationPlan,
    audioSections: dna.audioSections,
  })
  const cueSheet = createReferenceGuidedCueSheet({
    projectId: dna.projectId,
    guidance: musicDirectorGuidance,
    referenceMusicDNA: dna,
  })
  const lyriaPromptPlans = createLyriaPromptPlan({
    cueSheet,
    referenceMusicDNA: dna,
    adaptationPlan,
  })

  return {
    referenceMusicDNA: dna,
    musicDirectorGuidance,
    cueSheet,
    lyriaPromptPlans,
    warnings: [
      'Music Director uses reference DNA as guidance only.',
      'Cue sheet items are mock/local and do not reserve credits or render audio.',
      'Lyria prompt plans are constraints only; no Lyria API is called.',
    ],
    nextStep: 'use_cue_sheet_in_lyria_prompt_builder' as const,
  }
}
