import { Badge } from '../../Badge'
import type {
  AssetAnalysisReport,
  RetakeGroup,
  SceneSegment,
  SilenceRegion,
  SourceQualityFlag,
  SourceUnderstandingMap,
  TranscriptSegment,
} from '../../../types'

type SourceUnderstandingCardProps = {
  sourceUnderstandingMap: SourceUnderstandingMap
  transcriptSegments: TranscriptSegment[]
  sceneSegments: SceneSegment[]
  silenceRegions: SilenceRegion[]
  retakeGroups: RetakeGroup[]
  sourceQualityFlags: SourceQualityFlag[]
  assetAnalysisReports: AssetAnalysisReport[]
}

function formatLabel(value: string) {
  return value.replaceAll('_', ' ')
}

function getReportSourceLabel(report: AssetAnalysisReport) {
  return report.summary?.match(/Mock analysis for (.*?);/)?.[1]?.trim() ?? report.mediaAssetId
}

function hasFlag(flags: SourceQualityFlag[], type: SourceQualityFlag['type']) {
  return flags.some((flag) => flag.type === type)
}

export function SourceUnderstandingCard({
  assetAnalysisReports,
  retakeGroups,
  sceneSegments,
  silenceRegions,
  sourceQualityFlags,
  sourceUnderstandingMap,
  transcriptSegments,
}: SourceUnderstandingCardProps) {
  const findings = [
    hasFlag(sourceQualityFlags, 'silence') && 'Found long silence',
    retakeGroups.length > 0 && 'Found repeated takes',
    sourceUnderstandingMap.hookCandidateRanges.length > 0 && 'Found possible hook',
    sourceUnderstandingMap.ctaCandidateRanges.length > 0 && 'Found CTA moment',
    sourceUnderstandingMap.bRollCandidateRanges.length > 0 && 'Found possible B-roll moments',
    hasFlag(sourceQualityFlags, 'screen_detected') && 'Found screen recording context',
    hasFlag(sourceQualityFlags, 'text_detected') && 'Found on-screen text',
    hasFlag(sourceQualityFlags, 'privacy_sensitive') && 'Found privacy-sensitive indicators',
  ].filter((finding): finding is string => Boolean(finding))

  const stats = [
    { label: 'Transcript', value: transcriptSegments.length },
    { label: 'Scenes', value: sceneSegments.length },
    { label: 'Silence', value: silenceRegions.length },
    { label: 'Retakes', value: retakeGroups.length },
    { label: 'Quality flags', value: sourceQualityFlags.length },
    { label: 'Hooks', value: sourceUnderstandingMap.hookCandidateRanges.length },
    { label: 'CTA', value: sourceUnderstandingMap.ctaCandidateRanges.length },
    { label: 'B-roll', value: sourceUnderstandingMap.bRollCandidateRanges.length },
  ]

  return (
    <section className="inline-chat-card footage-prep-source-card">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Source Understanding</span>
          <h3>What AI learned from the footage</h3>
        </div>
        <Badge accent="cyan">{assetAnalysisReports.length} assets</Badge>
      </div>

      <p className="inline-helper">{sourceUnderstandingMap.summary}</p>

      <div className="footage-prep-stat-grid">
        {stats.map((stat) => (
          <span className="footage-prep-stat" key={stat.label}>
            <strong>{stat.value}</strong>
            <small>{stat.label}</small>
          </span>
        ))}
      </div>

      <div className="footage-prep-findings">
        <strong>AI findings</strong>
        <div className="compact-summary-row">
          {findings.length > 0 ? (
            findings.map((finding) => <span className="compact-summary-chip" key={finding}>{finding}</span>)
          ) : (
            <span className="compact-summary-chip">No major issues found</span>
          )}
        </div>
      </div>

      <div className="footage-prep-asset-role-list">
        {assetAnalysisReports.slice(0, 4).map((report) => (
          <span key={report.id}>
            <strong>{getReportSourceLabel(report)}</strong>
            <small>{formatLabel(report.detectedUsageRole ?? 'unknown')} · {formatLabel(report.mediaKind)}</small>
          </span>
        ))}
      </div>
    </section>
  )
}
