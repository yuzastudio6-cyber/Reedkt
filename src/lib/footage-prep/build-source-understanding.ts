import type {
  RetakeGroup,
  SceneSegment,
  SilenceRegion,
  SourceQualityFlag,
  SourceUnderstandingMap,
  TranscriptSegment,
  TranscriptWord,
  WorkflowID,
  WorkflowTimeRange,
} from '../../types'
import {
  MOCK_CREATED_AT,
  getMockInputScenario,
  getPrimaryMockSourceMedia,
  type MockFootagePrepInput,
  type MockFootagePrepScenario,
} from './mock-footage-prep-data'

function range(startMs: number, endMs: number): WorkflowTimeRange {
  return { startMs, endMs }
}

function wordsForText(projectId: WorkflowID, segmentIndex: number, text: string, sourceRange: WorkflowTimeRange): TranscriptWord[] {
  const words = text.split(/\s+/)
  const duration = sourceRange.endMs - sourceRange.startMs
  const wordDuration = Math.max(120, Math.floor(duration / Math.max(words.length, 1)))

  return words.map((word, index) => ({
    id: `${projectId}-transcript-${String(segmentIndex).padStart(3, '0')}-word-${String(index + 1).padStart(3, '0')}`,
    text: word,
    startMs: sourceRange.startMs + wordDuration * index,
    endMs: index === words.length - 1 ? sourceRange.endMs : sourceRange.startMs + wordDuration * (index + 1),
    confidence: 0.9,
  }))
}

function transcriptSeeds(scenario: MockFootagePrepScenario): Array<{ sourceRange: WorkflowTimeRange; text: string; speakerLabel?: string }> {
  if (scenario === 'screen_recording') {
    return [
      { sourceRange: range(0, 16000), text: 'Let me show you where the dashboard report lives.', speakerLabel: 'Speaker 1' },
      { sourceRange: range(24000, 58000), text: 'This metric is the proof that the new workflow is working.', speakerLabel: 'Speaker 1' },
      { sourceRange: range(92000, 138000), text: 'The private customer fields should be blurred before sharing.', speakerLabel: 'Speaker 1' },
      { sourceRange: range(220000, 260000), text: 'If you want the full setup, I can walk through the next screen.', speakerLabel: 'Speaker 1' },
    ]
  }

  if (scenario === 'real_estate') {
    return [
      { sourceRange: range(0, 12000), text: 'Okay give me one second, I want to start this cleaner.', speakerLabel: 'Agent' },
      { sourceRange: range(24000, 44000), text: 'Today I want to show you why this property feels private.', speakerLabel: 'Agent' },
      { sourceRange: range(68000, 108000), text: 'This renovated kitchen is the main selling point.', speakerLabel: 'Agent' },
      { sourceRange: range(132000, 172000), text: 'The backyard and pool make the property feel private.', speakerLabel: 'Agent' },
      { sourceRange: range(250000, 282000), text: 'If you want the full tour, send me a message.', speakerLabel: 'Agent' },
    ]
  }

  return [
    { sourceRange: range(8000, 17000), text: 'Okay wait, let me start again.', speakerLabel: 'Speaker 1' },
    { sourceRange: range(42000, 58000), text: 'Today I want to show you how this works.', speakerLabel: 'Speaker 1' },
    { sourceRange: range(138000, 190000), text: 'This renovated kitchen is the main selling point.', speakerLabel: 'Speaker 1' },
    { sourceRange: range(310000, 382000), text: 'The backyard and pool make the property feel private.', speakerLabel: 'Speaker 1' },
    { sourceRange: range(580000, 656000), text: 'This detail gives the story proof without making the edit feel rushed.', speakerLabel: 'Speaker 1' },
    { sourceRange: range(704000, 736000), text: 'If you want the full tour, send me a message.', speakerLabel: 'Speaker 1' },
  ]
}

export function buildMockTranscriptSegments(input: MockFootagePrepInput): TranscriptSegment[] {
  const scenario = getMockInputScenario(input)
  const primary = getPrimaryMockSourceMedia(input)

  return transcriptSeeds(scenario).map((seed, index) => ({
    id: `${input.projectId}-transcript-${String(index + 1).padStart(3, '0')}`,
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    userId: input.userId,
    mediaAssetId: primary.mediaAssetId,
    sourceRange: seed.sourceRange,
    speakerLabel: seed.speakerLabel,
    text: seed.text,
    words: wordsForText(input.projectId, index + 1, seed.text, seed.sourceRange),
    confidence: 0.89,
    createdAt: MOCK_CREATED_AT,
    updatedAt: MOCK_CREATED_AT,
  }))
}

export function buildMockSceneSegments(input: MockFootagePrepInput): SceneSegment[] {
  const scenario = getMockInputScenario(input)
  const primary = getPrimaryMockSourceMedia(input)
  const seeds = scenario === 'screen_recording'
    ? [
        { range: range(0, 18000), label: 'Dashboard intro', summary: 'Speaker starts a screen walkthrough.', objects: ['dashboard'], text: ['report'] },
        { range: range(24000, 58000), label: 'Proof metric', summary: 'Dashboard proof area appears on screen.', objects: ['chart', 'metric card'], text: ['revenue', 'conversion'] },
        { range: range(92000, 138000), label: 'Private fields', summary: 'Private customer fields need blur treatment.', objects: ['table'], text: ['customer email'] },
        { range: range(220000, 260000), label: 'CTA walkthrough', summary: 'Speaker offers a next-step walkthrough.', objects: ['dashboard'], text: ['settings'] },
      ]
    : [
        { range: range(0, 18000), label: 'Setup/dead intro', summary: 'The raw upload begins with setup and false-start energy.', objects: ['speaker'], text: [] },
        { range: range(42000, 58000), label: 'Hook candidate', summary: 'A cleaner second take introduces the topic.', objects: ['speaker'], text: [] },
        { range: range(138000, 190000), label: 'Kitchen explanation', summary: 'Strong explanation about the renovated kitchen.', objects: ['speaker', 'kitchen'], text: [] },
        { range: range(310000, 382000), label: 'Backyard explanation', summary: 'Private backyard and pool become a clear support point.', objects: ['speaker', 'pool'], text: [] },
        { range: range(704000, 736000), label: 'CTA', summary: 'The source contains a usable closing call to action.', objects: ['speaker'], text: [] },
      ]

  return seeds.map((seed, index) => ({
    id: `${input.projectId}-scene-${String(index + 1).padStart(3, '0')}`,
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    userId: input.userId,
    mediaAssetId: primary.mediaAssetId,
    sourceRange: seed.range,
    label: seed.label,
    summary: seed.summary,
    detectedObjects: seed.objects,
    detectedText: seed.text,
    confidence: 0.84,
    createdAt: MOCK_CREATED_AT,
    updatedAt: MOCK_CREATED_AT,
  }))
}

export function buildMockSilenceRegions(input: MockFootagePrepInput): SilenceRegion[] {
  const scenario = getMockInputScenario(input)
  const primary = getPrimaryMockSourceMedia(input)
  const seeds = scenario === 'screen_recording'
    ? [
        { range: range(18000, 24000), type: 'pause' as const, action: 'tighten' as const },
        { range: range(138000, 146000), type: 'dead_air' as const, action: 'remove' as const },
      ]
    : [
        { range: range(3000, 7000), type: 'dead_air' as const, action: 'remove' as const },
        { range: range(46000, 50000), type: 'pause' as const, action: 'tighten' as const },
        { range: range(130000, 136000), type: 'dead_air' as const, action: 'remove' as const },
      ]

  return seeds.map((seed, index) => ({
    id: `${input.projectId}-silence-${String(index + 1).padStart(3, '0')}`,
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    userId: input.userId,
    mediaAssetId: primary.mediaAssetId,
    sourceRange: seed.range,
    silenceType: seed.type,
    recommendedAction: seed.action,
    confidence: 0.88,
    createdAt: MOCK_CREATED_AT,
    updatedAt: MOCK_CREATED_AT,
  }))
}

export function buildMockRetakeGroups(input: MockFootagePrepInput): RetakeGroup[] {
  const scenario = getMockInputScenario(input)
  const primary = getPrimaryMockSourceMedia(input)

  if (scenario === 'screen_recording') {
    return [
      {
        id: `${input.projectId}-retake-group-001`,
        projectId: input.projectId,
        workspaceId: input.workspaceId,
        userId: input.userId,
        mediaAssetId: primary.mediaAssetId,
        label: 'Dashboard proof phrasing',
        candidateRanges: [range(58000, 76000), range(92000, 112000)],
        selectedBestRange: range(92000, 112000),
        resolution: 'best_take_selected',
        reasoning: 'The second explanation is clearer and mentions privacy-sensitive fields.',
        confidence: 0.78,
        createdAt: MOCK_CREATED_AT,
        updatedAt: MOCK_CREATED_AT,
      },
    ]
  }

  return [
    {
      id: `${input.projectId}-retake-group-001`,
      projectId: input.projectId,
      workspaceId: input.workspaceId,
      userId: input.userId,
      mediaAssetId: primary.mediaAssetId,
      label: 'Opening take',
      candidateRanges: [range(8000, 17000), range(42000, 58000)],
      selectedBestRange: range(42000, 58000),
      resolution: 'best_take_selected',
      reasoning: 'The second take is stronger and avoids the false start.',
      confidence: 0.9,
      createdAt: MOCK_CREATED_AT,
      updatedAt: MOCK_CREATED_AT,
    },
  ]
}

type BuildMockSourceUnderstandingMapInput = MockFootagePrepInput & {
  footagePrepSessionId: WorkflowID
  transcriptSegments: TranscriptSegment[]
  sceneSegments: SceneSegment[]
  silenceRegions: SilenceRegion[]
  retakeGroups: RetakeGroup[]
  sourceQualityFlags: SourceQualityFlag[]
}

export function buildMockSourceUnderstandingMap(input: BuildMockSourceUnderstandingMapInput): SourceUnderstandingMap {
  const scenario = getMockInputScenario(input)
  const summary = scenario === 'screen_recording'
    ? 'Mock source understanding found a screen walkthrough with dashboard proof, readable on-screen text, privacy blur risk, and a clear CTA.'
    : scenario === 'real_estate'
      ? 'Mock source understanding found an agent-led property story with kitchen, exterior, and pool B-roll opportunities.'
      : 'Mock source understanding found false starts, silence, repeated takes, a strong second hook, useful body explanation, emotional story support, and a CTA.'

  return {
    id: `${input.projectId}-source-understanding-map`,
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    userId: input.userId,
    footagePrepSessionId: input.footagePrepSessionId,
    mediaAssetIds: input.sourceMedia.map((source) => source.mediaAssetId),
    transcriptSegmentIds: input.transcriptSegments.map((segment) => segment.id),
    sceneSegmentIds: input.sceneSegments.map((scene) => scene.id),
    silenceRegionIds: input.silenceRegions.map((silence) => silence.id),
    retakeGroupIds: input.retakeGroups.map((group) => group.id),
    qualityFlagIds: input.sourceQualityFlags.map((flag) => flag.id),
    hookCandidateRanges: scenario === 'screen_recording' ? [range(24000, 58000)] : [range(42000, 58000)],
    ctaCandidateRanges: scenario === 'screen_recording' ? [range(220000, 260000)] : [range(704000, 736000)],
    bRollCandidateRanges: scenario === 'screen_recording'
      ? [range(24000, 58000), range(92000, 138000)]
      : [range(138000, 190000), range(310000, 382000)],
    summary,
    createdFromModel: 'mock-footage-prep-runtime',
    confidence: 0.86,
    createdAt: MOCK_CREATED_AT,
    updatedAt: MOCK_CREATED_AT,
  }
}
