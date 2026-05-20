import type {
  StoryTimingQACategory,
  StoryTimingQACheckRecord,
  TimingConflictRecord,
} from '../../types/storytiming'
import { categoryForConflict, categoryForQACheck } from './storytiming-qa-scoring-service'

export interface StoryTimingQAIssue {
  id: string
  category: StoryTimingQACategory
  severity: TimingConflictRecord['severity']
  source: 'conflict' | 'qa_check'
  conflict?: TimingConflictRecord
  qaCheck?: StoryTimingQACheckRecord
  summary: string
  recommendedFix?: string
  blocksRender: boolean
  requiresUserReview: boolean
}

const severityRank: Record<TimingConflictRecord['severity'], number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
}

const severityFromCheck = (check: StoryTimingQACheckRecord): TimingConflictRecord['severity'] => {
  if (check.blocksRender || check.status === 'failed') return 'critical'
  if (check.status === 'requires_adjustment' || check.status === 'requires_manual_review') return 'high'
  if (check.status === 'warning') return 'medium'
  return 'low'
}

const issueFromConflict = (conflict: TimingConflictRecord): StoryTimingQAIssue => ({
  id: `conflict:${conflict.id}`,
  category: categoryForConflict(conflict),
  severity: conflict.severity,
  source: 'conflict',
  conflict,
  summary: conflict.description,
  recommendedFix: conflict.whyItMatters,
  blocksRender: conflict.blocksRender,
  requiresUserReview: conflict.requiresUserReview,
})

const issueFromQACheck = (check: StoryTimingQACheckRecord): StoryTimingQAIssue | undefined => {
  if (check.status === 'passed' || check.status === 'waived') {
    return undefined
  }

  return {
    id: `qa:${check.id}`,
    category: categoryForQACheck(check),
    severity: severityFromCheck(check),
    source: 'qa_check',
    qaCheck: check,
    summary: check.summary,
    recommendedFix: check.recommendedFix,
    blocksRender: check.blocksRender,
    requiresUserReview: check.requiresManualReview,
  }
}

const collectByCategory = (
  category: StoryTimingQACategory,
  conflicts: TimingConflictRecord[] = [],
  qaChecks: StoryTimingQACheckRecord[] = [],
): StoryTimingQAIssue[] =>
  collectTimingQAIssues(conflicts, qaChecks).filter((issue) => issue.category === category)

export function collectTimingQAIssues(
  conflicts: TimingConflictRecord[] = [],
  qaChecks: StoryTimingQACheckRecord[] = [],
): StoryTimingQAIssue[] {
  const issues = [
    ...conflicts.map(issueFromConflict),
    ...qaChecks.map(issueFromQACheck).filter((issue): issue is StoryTimingQAIssue => Boolean(issue)),
  ]
  const byKey = new Map<string, StoryTimingQAIssue>()

  issues.forEach((issue) => {
    const key = issue.conflict?.id ?? issue.qaCheck?.id ?? issue.id
    const existing = byKey.get(key)
    if (!existing || severityRank[issue.severity] > severityRank[existing.severity]) {
      byKey.set(key, issue)
    }
  })

  return rankTimingIssuesBySeverity([...byKey.values()])
}

export function collectCaptionCutIssues(
  conflicts: TimingConflictRecord[] = [],
  qaChecks: StoryTimingQACheckRecord[] = [],
): StoryTimingQAIssue[] {
  return collectByCategory('caption_cut', conflicts, qaChecks)
}

export function collectMusicSFXIssues(
  conflicts: TimingConflictRecord[] = [],
  qaChecks: StoryTimingQACheckRecord[] = [],
): StoryTimingQAIssue[] {
  return collectByCategory('music_sfx', conflicts, qaChecks)
}

export function collectSignatureIssues(
  conflicts: TimingConflictRecord[] = [],
  qaChecks: StoryTimingQACheckRecord[] = [],
): StoryTimingQAIssue[] {
  return collectByCategory('signature_animation', conflicts, qaChecks)
}

export function collectOverlaySafetyIssues(
  conflicts: TimingConflictRecord[] = [],
  qaChecks: StoryTimingQACheckRecord[] = [],
): StoryTimingQAIssue[] {
  return collectByCategory('overlay_safety', conflicts, qaChecks)
}

export function collectRenderManifestIssues(
  conflicts: TimingConflictRecord[] = [],
  qaChecks: StoryTimingQACheckRecord[] = [],
): StoryTimingQAIssue[] {
  return collectByCategory('render_manifest', conflicts, qaChecks)
}

export function rankTimingIssuesBySeverity(issues: StoryTimingQAIssue[]): StoryTimingQAIssue[] {
  return [...issues].sort(
    (a, b) =>
      severityRank[b.severity] - severityRank[a.severity] ||
      Number(b.blocksRender) - Number(a.blocksRender) ||
      Number(b.requiresUserReview) - Number(a.requiresUserReview) ||
      a.summary.localeCompare(b.summary),
  )
}

export function createTimingIssueSummary(issues: StoryTimingQAIssue[]): string {
  if (issues.length === 0) {
    return 'No timing QA issues were found.'
  }

  const blockers = issues.filter((issue) => issue.blocksRender).length
  const userReview = issues.filter((issue) => issue.requiresUserReview).length
  const topIssue = rankTimingIssuesBySeverity(issues)[0]

  return `${issues.length} timing QA issue(s) found; ${blockers} block render, ${userReview} need user review. Top issue: ${topIssue.summary}`
}
