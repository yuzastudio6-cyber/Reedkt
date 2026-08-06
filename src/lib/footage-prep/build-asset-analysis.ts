import type {
  AssetAnalysisReport,
  AssetUsageRole,
  SourceQualityFlag,
  WorkflowTimeRange,
} from '../../types'
import {
  MOCK_CREATED_AT,
  getMockInputScenario,
  type MockFootagePrepInput,
  type MockFootagePrepSourceMedia,
} from './mock-footage-prep-data'

function range(startMs: number, endMs: number): WorkflowTimeRange {
  return { startMs, endMs }
}

function usageRoleForSource(source: MockFootagePrepSourceMedia): AssetUsageRole {
  const label = source.label.toLowerCase()

  if (source.mediaKind === 'logo' || label.includes('logo')) return 'logo'
  if (source.mediaKind === 'screenshot') return 'screenshot'
  if (source.mediaKind === 'audio' && label.includes('sfx')) return 'sfx'
  if (source.mediaKind === 'audio' || source.mediaKind === 'music') return 'music'
  if (/kitchen|pool|exterior|b-roll|broll|backyard/.test(label)) return 'b_roll'
  if (source.mediaKind === 'screen_recording') return 'main_footage'
  if (/talking|raw|main|intro|walkthrough/.test(label)) return 'main_footage'
  return 'unknown'
}

function qualityFlag(params: {
  id: string
  type: SourceQualityFlag['type']
  sourceRange?: WorkflowTimeRange
  severity?: SourceQualityFlag['severity']
  message: string
  recommendedAction?: string
  confidence?: number
}): SourceQualityFlag {
  return {
    id: params.id,
    type: params.type,
    sourceRange: params.sourceRange,
    severity: params.severity ?? 'info',
    message: params.message,
    recommendedAction: params.recommendedAction,
    confidence: params.confidence ?? 0.88,
  }
}

function qualityFlagsForSource(input: MockFootagePrepInput, source: MockFootagePrepSourceMedia, index: number): SourceQualityFlag[] {
  const scenario = getMockInputScenario(input)
  const idBase = `${input.projectId}-${source.mediaAssetId}-quality`
  const label = source.label.toLowerCase()
  const flags: SourceQualityFlag[] = []

  if (scenario === 'messy_talking_head' || source.mockScenario === 'messy_talking_head') {
    flags.push(
      qualityFlag({
        id: `${idBase}-silence`,
        type: 'silence',
        sourceRange: range(3000, 7000),
        severity: 'medium',
        message: 'Long dead air appears near the beginning of the raw upload.',
        recommendedAction: 'Remove from Clean Assembly.',
      }),
      qualityFlag({
        id: `${idBase}-retake`,
        type: 'bad_take',
        sourceRange: range(8000, 17000),
        severity: 'medium',
        message: 'The opening attempt sounds like a false start.',
        recommendedAction: 'Use the stronger second take instead.',
      }),
      qualityFlag({
        id: `${idBase}-hook`,
        type: 'possible_hook',
        sourceRange: range(42000, 58000),
        severity: 'info',
        message: 'A stronger hook candidate appears after the false start.',
      }),
      qualityFlag({
        id: `${idBase}-strong-take`,
        type: 'strong_take',
        sourceRange: range(138000, 190000),
        severity: 'info',
        message: 'This explanation is clear enough to preserve.',
      }),
      qualityFlag({
        id: `${idBase}-cta`,
        type: 'possible_cta',
        sourceRange: range(704000, 736000),
        severity: 'info',
        message: 'The ending reads like a clear CTA.',
      }),
    )
  }

  if (/screen|dashboard/.test(label) || source.mediaKind === 'screen_recording' || source.mediaKind === 'screenshot') {
    flags.push(
      qualityFlag({
        id: `${idBase}-screen`,
        type: 'screen_detected',
        sourceRange: source.durationMs > 0 ? range(0, Math.min(source.durationMs, 90000)) : undefined,
        severity: 'info',
        message: 'Screen or dashboard content is present in the mock source.',
      }),
      qualityFlag({
        id: `${idBase}-text`,
        type: 'text_detected',
        sourceRange: source.durationMs > 0 ? range(0, Math.min(source.durationMs, 90000)) : undefined,
        severity: 'info',
        message: 'On-screen text should be protected for readability.',
      }),
    )
  }

  if (source.mediaKind === 'screenshot' || label.includes('proof')) {
    flags.push(
      qualityFlag({
        id: `${idBase}-privacy`,
        type: 'privacy_sensitive',
        severity: 'high',
        message: 'Dashboard proof may include private information.',
        recommendedAction: 'Plan privacy blur before using as an overlay.',
        confidence: 0.74,
      }),
    )
  }

  if (/kitchen|pool|exterior|backyard/.test(label)) {
    flags.push(
      qualityFlag({
        id: `${idBase}-broll-${index + 1}`,
        type: 'possible_b_roll',
        sourceRange: range(0, Math.min(source.durationMs, 12000)),
        severity: 'info',
        message: 'This source can support a spoken point as meaning-matched B-roll.',
      }),
    )
  }

  if (flags.length === 0) {
    flags.push(
      qualityFlag({
        id: `${idBase}-strong-source`,
        type: 'strong_take',
        sourceRange: source.durationMs > 0 ? range(0, Math.min(source.durationMs, 15000)) : undefined,
        severity: 'info',
        message: 'No blocking mock quality issue was detected.',
      }),
    )
  }

  return flags
}

export function buildMockAssetAnalysisReports(input: MockFootagePrepInput): AssetAnalysisReport[] {
  return input.sourceMedia.map((source, index) => {
    const qualityFlags = qualityFlagsForSource(input, source, index)

    return {
      id: `${input.projectId}-asset-analysis-${String(index + 1).padStart(3, '0')}`,
      projectId: input.projectId,
      workspaceId: input.workspaceId,
      userId: input.userId,
      mediaAssetId: source.mediaAssetId,
      mediaKind: source.mediaKind,
      durationMs: source.durationMs,
      width: source.width,
      height: source.height,
      frameRate: source.frameRate,
      hasAudio: source.hasAudio,
      hasSpeech: source.hasAudio && usageRoleForSource(source) === 'main_footage',
      hasFaces: source.mediaKind === 'video' && usageRoleForSource(source) === 'main_footage',
      hasOnScreenText: source.mediaKind === 'screen_recording' || source.mediaKind === 'screenshot',
      detectedUsageRole: usageRoleForSource(source),
      qualityFlags,
      summary: `Mock analysis for ${source.label}; no real media inspection was executed.`,
      confidence: 0.86,
      createdAt: MOCK_CREATED_AT,
      updatedAt: MOCK_CREATED_AT,
    }
  })
}
