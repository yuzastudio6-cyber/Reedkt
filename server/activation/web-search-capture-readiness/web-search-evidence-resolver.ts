import { buildWebSearchCaptureApprovalReport } from '../web-search-capture-approval'
import { getApprovedSearxngSearchFixtureEvidence } from '../searxng-search-fixture/approved-searxng-search-fixture-evidence'
import { getApprovedPlaywrightSharpCaptureEvidence } from '../playwright-sharp-capture-fixture/approved-playwright-sharp-capture-evidence'
import { getApprovedReadabilityExtractionEvidence } from '../readability-extraction-fixture/approved-readability-extraction-evidence'
import { getApprovedPrivateWebE2EEvidence } from '../private-web-search-capture-e2e/approved-private-web-e2e-evidence'
import { getApprovedPrivateSearxngServiceEvidence } from '../private-searxng-service/approved-private-searxng-service-evidence'
import { getApprovedControlledLiveSearchCaptureEvidence } from '../controlled-live-search-capture-e2e/approved-controlled-live-search-capture-evidence'
import type { WebSearchEvidenceChain, WebSearchPhaseEvidence } from './web-search-capture-readiness-types'

export function resolveWebSearchCaptureEvidenceChain(): WebSearchEvidenceChain {
  const phase49A = buildWebSearchCaptureApprovalReport()
  const phase49B = getApprovedSearxngSearchFixtureEvidence()
  const phase49C = getApprovedPlaywrightSharpCaptureEvidence()
  const phase49D = getApprovedReadabilityExtractionEvidence()
  const phase49E = getApprovedPrivateWebE2EEvidence()
  const phase49F = getApprovedPrivateSearxngServiceEvidence()
  const phase49G = getApprovedControlledLiveSearchCaptureEvidence()

  const phases: WebSearchPhaseEvidence[] = [
    {
      phase: '49A',
      status: phase49A.status === 'approval_review_complete' ? 'approval_review_complete' : 'blocked',
      summary: 'Free/open-source web search/capture stack approval reviewed SearXNG, Playwright, Sharp, and Mozilla Readability.',
      readiness: phase49A.phase49BReadiness,
      artifactUris: [],
      blockers: phase49A.blockers,
      warnings: phase49A.warnings,
    },
    {
      phase: '49B',
      status: normalizedPhaseStatus(phase49B.status),
      runId: phase49B.runId,
      summary: `Generated SearXNG fixture normalized ${phase49B.normalizedSourceCount} source records.`,
      readiness: phase49B.phase49CReadiness,
      artifactUris: compactUris([
        phase49B.planSnapshotUri,
        phase49B.sourceManifestUri,
        phase49B.qaReportUri,
        phase49B.phase49bReportUri,
      ]),
      blockers: phase49B.blockers,
      warnings: phase49B.warnings,
    },
    {
      phase: '49C',
      status: normalizedPhaseStatus(phase49C.status),
      runId: phase49C.runId,
      summary: 'Generated local Playwright capture and Sharp screenshot processing fixture passed.',
      readiness: phase49C.phase49DReadiness,
      artifactUris: compactUris([
        phase49C.captureManifestUri,
        phase49C.qaReportUri,
        phase49C.phase49cReportUri,
      ]),
      blockers: phase49C.blockers,
      warnings: phase49C.warnings,
    },
    {
      phase: '49D',
      status: normalizedPhaseStatus(phase49D.status),
      runId: phase49D.runId,
      summary: 'Generated local Mozilla Readability extraction and sanitization fixture passed.',
      readiness: phase49D.phase49EReadiness,
      artifactUris: compactUris([
        phase49D.extractionManifestUri,
        phase49D.qaReportUri,
        phase49D.phase49dReportUri,
      ]),
      blockers: phase49D.blockers,
      warnings: phase49D.warnings,
    },
    {
      phase: '49E',
      status: normalizedPhaseStatus(phase49E.status),
      runId: phase49E.runId,
      summary: `Controlled private fixture E2E produced ${phase49E.sourceCount} sources, ${phase49E.captureCount} captures, and ${phase49E.extractionCount} extractions.`,
      readiness: phase49E.phase49FReadiness,
      artifactUris: compactUris([
        phase49E.combinedManifestUri,
        phase49E.qaReportUri,
        phase49E.phase49eReportUri,
      ]),
      blockers: phase49E.blockers,
      warnings: phase49E.warnings,
    },
    {
      phase: '49F',
      status: phase49F.status,
      runId: phase49F.runId,
      summary: `Private authenticated SearXNG service validated with ${phase49F.normalizedSourceCount ?? 0} normalized sources.`,
      readiness: phase49F.phase49GReadiness,
      artifactUris: compactUris([
        phase49F.sourceManifestUri,
        phase49F.qaReportUri,
        phase49F.phase49fReportUri,
      ]),
      blockers: phase49F.blockers,
      warnings: phase49F.warnings,
    },
    {
      phase: '49G',
      status: phase49G.status,
      runId: phase49G.runId,
      summary: `Controlled private live search/capture E2E normalized ${phase49G.normalizedSourceCount ?? 0} sources with ${phase49G.successfulCaptureCount ?? 0} captures and ${phase49G.successfulExtractionCount ?? 0} extractions.`,
      readiness: phase49G.phase49HReadiness,
      artifactUris: compactUris([
        phase49G.sourceManifestUri,
        phase49G.combinedManifestUri,
        phase49G.qaReportUri,
        phase49G.phase49gReportUri,
      ]),
      blockers: phase49G.blockers,
      warnings: phase49G.warnings,
    },
  ]
  const blockers = phases.flatMap((phase) => phase.blockers.map((blocker) => `${phase.phase}: ${blocker}`))
  const warnings = phases.flatMap((phase) => phase.warnings.map((warning) => `${phase.phase}: ${warning}`))
  const mandatoryReady = phases.every((phase) => phase.blockers.length === 0 && (phase.status === 'completed' || phase.status === 'approval_review_complete'))
  return {
    generatedAt: new Date().toISOString(),
    phases,
    trackStatus: mandatoryReady ? 'ready_for_internal_testing' : 'blocked',
    blockers,
    warnings,
  }
}

function compactUris(values: Array<string | undefined>): string[] {
  return values.filter((value): value is string => Boolean(value))
}

function normalizedPhaseStatus(status: string): 'completed' | 'blocked' | 'planned' {
  if (status === 'completed') return 'completed'
  if (status === 'blocked') return 'blocked'
  return 'planned'
}
