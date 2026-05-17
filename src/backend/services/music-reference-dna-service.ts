import type { ReferenceMusicDNARecord } from '../../types'
import type { MockDatabase } from '../mock/mock-database'
import { createMockId, insertMockRecord, nowIso } from '../mock/mock-database'
import { ok, type ServiceResult } from '../service-result'

export interface ReferenceMusicDNAInput {
  projectId: string
  referenceAssetId?: string
  referenceUrl?: string
  summary: string
  createdByAgent?: string
}

export function createReferenceMusicDNAFromSummary(
  db: MockDatabase,
  input: ReferenceMusicDNAInput,
): ServiceResult<ReferenceMusicDNARecord> {
  const cuePatterns = extractReferenceCuePatterns(input.summary)
  const referenceMusicDNA: ReferenceMusicDNARecord = {
    id: createMockId('reference-music-dna'),
    projectId: input.projectId,
    referenceAssetId: input.referenceAssetId,
    referenceUrl: input.referenceUrl,
    summary: input.summary,
    cueBoundaryNotes: cuePatterns,
    musicCueCount: cuePatterns.length,
    genreMoodPerCue: cuePatterns.map((pattern) => `${pattern}: adapt mood and energy only.`),
    lyricsMoments: ['Lyrics or vocal texture may be studied only as timing/style behavior, never copied.'],
    instrumentalMoments: ['Dialogue and narration sections should remain instrumental or ambience-first.'],
    dialogueDuckingBehavior: 'Study whether music ducks under speech and leaves voice clarity intact.',
    introMusicBehavior: 'Study intro energy and whether it drops into dialogue or scene ambience.',
    montageMusicBehavior: 'Study montage energy, pacing support, and cue change behavior.',
    chapterTitleAudioBehavior: 'Study light title hits and transition audio without copying exact sounds.',
    outroResolveBehavior: 'Study whether the outro resolves softly, loops, or ends with a clean tail.',
    sfxBehavior: 'Study broad SFX placement and restraint, not exact copyrighted sounds.',
    ambienceBehavior: 'Study where natural ambience is preserved and where music takes focus.',
    adaptationRules: createReferenceAdaptationRules(),
    doNotCopyRules: createReferenceDoNotCopyRules(),
    confidence: 84,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: {
      mockOnly: true,
      createdByAgent: input.createdByAgent ?? 'mock_music_reference_dna_service',
    },
  }

  return ok(insertMockRecord(db, 'musicReferenceDna', referenceMusicDNA))
}

export function createLakeComoReferenceMusicDNA(
  db: MockDatabase,
  projectId: string,
  referenceAssetId?: string,
): ServiceResult<ReferenceMusicDNARecord> {
  const referenceMusicDNA: ReferenceMusicDNARecord = {
    id: createMockId('reference-music-dna'),
    projectId,
    referenceAssetId,
    referenceUrl: 'reference-only://lake-como-lifestyle-vacation-style',
    summary:
      'Luxury lifestyle/vacation vlog style DNA: coming-up teaser, scenic arrival, dialogue bed, boat movement montage, food/social warmth, outro resolve, natural ambience, chapter/title audio, premium but casual feel.',
    cueBoundaryNotes: [
      'Coming-up teaser can use higher energy before the edit settles.',
      'Scenic arrival should breathe and establish place.',
      'Dialogue sections need instrumental music or very light ambience.',
      'Boat/movement montage can carry medium energy and premium travel rhythm.',
      'Food/social moments should stay warm and let real ambience remain.',
      'Outro should resolve softly.',
    ],
    musicCueCount: 6,
    genreMoodPerCue: [
      'Teaser: stylish, premium, medium-high energy.',
      'Arrival: cinematic travel, warm, medium-low energy.',
      'Dialogue: instrumental premium bed, low energy.',
      'Boat movement: European luxury travel, medium energy.',
      'Food/social: warm acoustic, jazz, or lounge support.',
      'Outro: reflective, warm, low energy.',
    ],
    lyricsMoments: ['Vocal texture can work in no-speech teaser, montage, or outro only.'],
    instrumentalMoments: ['Dialogue bed and narration sections should be instrumental only.'],
    dialogueDuckingBehavior: 'Dialogue sections are voice-first and duck music cleanly under speech.',
    introMusicBehavior: 'Teaser may start stronger, then drop into scenic ambience or dialogue-safe bed.',
    montageMusicBehavior: 'Montage can use premium travel energy without copying reference music.',
    chapterTitleAudioBehavior: 'Chapter/title cards can use light hits or soft whooshes when no important speech is present.',
    outroResolveBehavior: 'Outro resolves with a soft musical tail, not an abrupt loop cutoff.',
    sfxBehavior: 'Use subtle transition SFX, title hits, and ambient bridges only where they improve the edit.',
    ambienceBehavior: 'Preserve water, boat, villa, restaurant, and group ambience when it adds place and personality.',
    adaptationRules: createReferenceAdaptationRules(),
    doNotCopyRules: createReferenceDoNotCopyRules(),
    confidence: 90,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: {
      mockOnly: true,
      pattern: 'lake_como_lifestyle_vacation',
      styleDnaOnly: true,
    },
  }

  return ok(insertMockRecord(db, 'musicReferenceDna', referenceMusicDNA))
}

export function extractReferenceCuePatterns(summary: string): string[] {
  const text = summary.toLowerCase()
  const patterns: string[] = []

  if (text.includes('teaser') || text.includes('hook') || text.includes('coming')) {
    patterns.push('coming-up teaser')
  }

  if (text.includes('arrival') || text.includes('intro') || text.includes('scenic')) {
    patterns.push('scenic arrival')
  }

  if (text.includes('dialogue') || text.includes('speech') || text.includes('talking')) {
    patterns.push('dialogue bed')
  }

  if (text.includes('boat') || text.includes('movement') || text.includes('montage') || text.includes('travel')) {
    patterns.push('movement montage')
  }

  if (text.includes('food') || text.includes('social') || text.includes('friends')) {
    patterns.push('food/social warmth')
  }

  if (text.includes('outro') || text.includes('ending') || text.includes('resolve')) {
    patterns.push('outro resolve')
  }

  return patterns.length ? patterns : ['intro behavior', 'dialogue behavior', 'montage behavior', 'outro behavior']
}

export function createReferenceAdaptationRules(): string[] {
  return [
    'Use style DNA only.',
    'Use multiple cues only where the new video structure supports it.',
    'Let dialogue sections breathe and remain voice-first.',
    'Use lyrics or vocal texture only in montage or non-speaking sections.',
    'Preserve natural ambience when it supports place, realism, or story.',
    'Use title/chapter hits lightly and only when they improve timing.',
  ]
}

export function createReferenceDoNotCopyRules(): string[] {
  return [
    'Do not copy tracks, melodies, lyrics, chord signatures, hooks, or copyrighted arrangements.',
    'Do not imitate a reference song or artist.',
    'Do not force cultural instruments or stereotypes from location alone.',
    'Do not use lyrics under important speech unless the user explicitly approves it.',
    'Do not replace meaningful ambience with generic background music.',
  ]
}
