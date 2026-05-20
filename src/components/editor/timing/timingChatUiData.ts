import type { Accent } from '../../../data/mockData'
import {
  mockLakeComoStoryTimingBundle,
} from '../../../lib/mock-storytiming-records'
import { runMockLakeComoTimingQAFlow } from '../../../backend/orchestrators/mock-timing-qa-orchestrator'
import type {
  MasterTimingMapRecord,
  RenderTimingManifestRecord,
  StoryTimingAdjustmentRecommendationRecord,
  StoryTimingQACheckRecord,
  StoryTimingQAReportRecord,
  StoryTimingReadinessDecision,
  StoryTimingSegmentRecord,
  StoryTimingTrackType,
  TimingAnchorRecord,
  TimingConflictRecord,
  TimingEventRecord,
} from '../../../types/storytiming'

export type TimingEventGroupView = {
  trackType: StoryTimingTrackType
  label: string
  count: number
  events: TimingEventRecord[]
}

export type TimingReviewChatCopy = {
  mapCreated: string
  segments: string
  anchorsEvents: string
  qaResult: string
  conflicts: string
  recommendations: string
  mockOnly: string
}

export type TimingReviewChatData = {
  masterTimingMap: MasterTimingMapRecord
  segments: StoryTimingSegmentRecord[]
  topAnchors: TimingAnchorRecord[]
  allAnchors: TimingAnchorRecord[]
  eventGroups: TimingEventGroupView[]
  events: TimingEventRecord[]
  conflicts: TimingConflictRecord[]
  qaChecks: StoryTimingQACheckRecord[]
  qaReport: StoryTimingQAReportRecord
  adjustmentRecommendations: StoryTimingAdjustmentRecommendationRecord[]
  renderManifest?: RenderTimingManifestRecord
  warningCount: number
  conflictCount: number
  chatSummary: string[]
  nextStep: string
  warnings: string[]
  copy: TimingReviewChatCopy
}

export const timingTrackLabels: Record<StoryTimingTrackType, string> = {
  captions: 'Captions',
  cta: 'CTA',
  cuts: 'Cuts',
  graphic_design: 'Graphic Design',
  manual: 'Manual',
  music: 'Music',
  output_video: 'Output video',
  qa_markers: 'QA markers',
  real_motion: 'Real Motion',
  render_markers: 'Render markers',
  sfx: 'SFX',
  source_video: 'Source video',
  story_beats: 'Story beats',
  stroke_motion: 'Stroke Motion',
  transcript: 'Transcript',
  transitions: 'Transitions',
}

const importanceRank: Record<TimingAnchorRecord['importance'], number> = {
  critical: 5,
  high: 4,
  medium: 3,
  low: 2,
  decorative: 1,
}

const trackOrder: StoryTimingTrackType[] = [
  'captions',
  'cuts',
  'music',
  'sfx',
  'stroke_motion',
  'graphic_design',
  'real_motion',
  'transitions',
  'render_markers',
  'story_beats',
  'qa_markers',
  'manual',
]

export function formatTimingLabel(value?: string | number | boolean) {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'number') return String(value)
  if (!value) return 'Not set'

  return value
    .replaceAll('_', ' ')
    .replaceAll('-', ' ')
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function formatTimingSeconds(value?: number) {
  if (typeof value !== 'number') return 'Not set'
  const precision = Number.isInteger(value) ? 0 : 2
  return `${value.toFixed(precision)}s`
}

export function formatTimingRange(range?: { startSeconds: number; endSeconds: number }) {
  if (!range) return 'Not set'
  return `${formatTimingSeconds(range.startSeconds)}-${formatTimingSeconds(range.endSeconds)}`
}

export function formatEventWindow(event: TimingEventRecord) {
  if (event.hitTimeSeconds !== undefined) {
    return `${formatTimingSeconds(event.startTimeSeconds)} / hit ${formatTimingSeconds(event.hitTimeSeconds)} / ${formatTimingSeconds(event.endTimeSeconds)}`
  }

  return `${formatTimingSeconds(event.startTimeSeconds)}-${formatTimingSeconds(event.endTimeSeconds)}`
}

export function readinessLabel(decision?: StoryTimingReadinessDecision) {
  return formatTimingLabel(decision)
}

export function readinessAccent(decision?: StoryTimingReadinessDecision): Accent | 'muted' {
  if (decision === 'ready_for_preview') return 'success'
  if (decision === 'ready_with_warnings') return 'warning'
  if (decision === 'requires_user_review') return 'info'
  if (decision === 'requires_timing_adjustment') return 'warning'
  if (decision === 'blocked_for_render') return 'danger'
  return 'muted'
}

export function severityAccent(severity?: TimingConflictRecord['severity']): Accent | 'muted' {
  if (severity === 'critical') return 'danger'
  if (severity === 'high') return 'warning'
  if (severity === 'medium') return 'info'
  if (severity === 'low') return 'muted'
  return 'muted'
}

export function qaStatusAccent(status?: StoryTimingQACheckRecord['status']): Accent | 'muted' {
  if (status === 'passed') return 'success'
  if (status === 'warning' || status === 'requires_adjustment') return 'warning'
  if (status === 'requires_manual_review') return 'info'
  if (status === 'failed') return 'danger'
  return 'muted'
}

export function scoreAccent(score?: number): Accent | 'muted' {
  if (typeof score !== 'number') return 'muted'
  if (score >= 90) return 'success'
  if (score >= 80) return 'cyan'
  if (score >= 70) return 'warning'
  return 'danger'
}

export function createTimingEventGroups(events: TimingEventRecord[]): TimingEventGroupView[] {
  const grouped = events.reduce<Record<string, TimingEventRecord[]>>((acc, event) => {
    acc[event.trackType] = [...(acc[event.trackType] ?? []), event]
    return acc
  }, {})

  return Object.entries(grouped)
    .map(([trackType, groupEvents]) => ({
      trackType: trackType as StoryTimingTrackType,
      label: timingTrackLabels[trackType as StoryTimingTrackType] ?? formatTimingLabel(trackType),
      count: groupEvents.length,
      events: groupEvents.sort((a, b) => a.startTimeSeconds - b.startTimeSeconds),
    }))
    .sort((a, b) => {
      const left = trackOrder.indexOf(a.trackType)
      const right = trackOrder.indexOf(b.trackType)
      return (left === -1 ? 99 : left) - (right === -1 ? 99 : right)
    })
}

function selectTopAnchors(anchors: TimingAnchorRecord[]) {
  return [...anchors]
    .sort((a, b) => importanceRank[b.importance] - importanceRank[a.importance] || a.timeSeconds - b.timeSeconds)
    .slice(0, 8)
}

function countWarnings(conflicts: TimingConflictRecord[], checks: StoryTimingQACheckRecord[]) {
  const conflictWarnings = conflicts.filter((conflict) => conflict.severity !== 'critical').length
  const qaWarnings = checks.filter((check) =>
    check.status === 'warning' ||
    check.status === 'requires_adjustment' ||
    check.status === 'requires_manual_review',
  ).length

  return conflictWarnings + qaWarnings
}

export function createTimingReviewChatData(): TimingReviewChatData {
  const qaFlow = runMockLakeComoTimingQAFlow()
  const qaReport = mockLakeComoStoryTimingBundle.qaReports[0] ?? qaFlow.qaReport
  const conflicts = mockLakeComoStoryTimingBundle.conflicts.length
    ? mockLakeComoStoryTimingBundle.conflicts
    : qaFlow.conflicts
  const qaChecks = mockLakeComoStoryTimingBundle.qaChecks.length
    ? mockLakeComoStoryTimingBundle.qaChecks
    : qaFlow.qaChecks
  const adjustmentRecommendations = mockLakeComoStoryTimingBundle.adjustmentRecommendations.length
    ? mockLakeComoStoryTimingBundle.adjustmentRecommendations
    : qaFlow.adjustmentRecommendations

  return {
    masterTimingMap: mockLakeComoStoryTimingBundle.masterTimingMap,
    segments: mockLakeComoStoryTimingBundle.segments,
    topAnchors: selectTopAnchors(mockLakeComoStoryTimingBundle.anchors),
    allAnchors: mockLakeComoStoryTimingBundle.anchors,
    eventGroups: createTimingEventGroups(mockLakeComoStoryTimingBundle.events),
    events: mockLakeComoStoryTimingBundle.events,
    conflicts,
    qaChecks,
    qaReport,
    adjustmentRecommendations,
    renderManifest: mockLakeComoStoryTimingBundle.renderManifest,
    warningCount: countWarnings(conflicts, qaChecks),
    conflictCount: conflicts.length,
    chatSummary: qaFlow.chatSummary,
    nextStep: qaFlow.nextStep,
    warnings: qaFlow.warnings,
    copy: {
      mapCreated:
        'I created a master timing map from the edit plan, captions, music, SFX, and signature overlays.',
      segments:
        'Here are the key timing segments. I am keeping this compact so the chat stays readable.',
      anchorsEvents:
        'These are the most important anchors and event groups. ReeditPro keeps the dense frame data collapsed until you ask for it.',
      qaResult:
        'The timing QA is ready for review. It checks captions, cuts, music, SFX, signature overlays, rhythm, and render readiness together.',
      conflicts:
        conflicts.length > 0
          ? `I found ${conflicts.length} timing issue${conflicts.length === 1 ? '' : 's'} before preview.`
          : 'I did not find blocking timing conflicts in this mock review.',
      recommendations:
        adjustmentRecommendations.length > 0
          ? 'I recommend applying the suggested mock timing fixes before preview.'
          : 'No timing fixes are required for this mock review.',
      mockOnly:
        'Timing review is mock-only here. ReeditPro has not rendered the video yet.',
    },
  }
}
