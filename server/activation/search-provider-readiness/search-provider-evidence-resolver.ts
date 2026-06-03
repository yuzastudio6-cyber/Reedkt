import { buildWebSearchCaptureApprovalReport } from '../web-search-capture-approval'
import { getApprovedSearxngSearchFixtureEvidence } from '../searxng-search-fixture/approved-searxng-search-fixture-evidence'
import { getApprovedPlaywrightSharpCaptureEvidence } from '../playwright-sharp-capture-fixture/approved-playwright-sharp-capture-evidence'
import { getApprovedReadabilityExtractionEvidence } from '../readability-extraction-fixture/approved-readability-extraction-evidence'
import { getApprovedPrivateWebE2EEvidence } from '../private-web-search-capture-e2e/approved-private-web-e2e-evidence'
import { getApprovedPrivateSearxngServiceEvidence } from '../private-searxng-service/approved-private-searxng-service-evidence'
import { getApprovedControlledLiveSearchCaptureEvidence } from '../controlled-live-search-capture-e2e/approved-controlled-live-search-capture-evidence'
import { getApprovedWebSearchCaptureReadinessEvidence } from '../web-search-capture-readiness/approved-web-search-capture-readiness-evidence'
import { getApprovedWebSearchUiApiGatingEvidence } from '../web-search-ui-api-gating/approved-web-search-ui-api-gating-evidence'
import { buildBraveSearchFallbackPolicyReport } from '../brave-search-fallback-policy'
import { searchProviderReadinessConfig } from './search-provider-readiness-policy'
import type { SearchProviderEvidenceChain, SearchProviderPhaseEvidence, SearchProviderReadinessStatus } from './search-provider-readiness-types'

export function resolveSearchProviderEvidenceChain(): SearchProviderEvidenceChain {
  const phase49A = buildWebSearchCaptureApprovalReport()
  const phase49B = getApprovedSearxngSearchFixtureEvidence()
  const phase49C = getApprovedPlaywrightSharpCaptureEvidence()
  const phase49D = getApprovedReadabilityExtractionEvidence()
  const phase49E = getApprovedPrivateWebE2EEvidence()
  const phase49F = getApprovedPrivateSearxngServiceEvidence()
  const phase49G = getApprovedControlledLiveSearchCaptureEvidence()
  const phase49H = getApprovedWebSearchCaptureReadinessEvidence()
  const phase49I = getApprovedWebSearchUiApiGatingEvidence()
  const phase49J = buildBraveSearchFallbackPolicyReport()

  const phases: SearchProviderPhaseEvidence[] = [
    {
      phase: '49A',
      status: phase49A.status === 'approval_review_complete' ? 'approval_review_complete' : 'blocked',
      summary: 'Web search/capture stack approval reviewed SearXNG, Playwright, Sharp, Readability, and disabled paid providers.',
      readiness: phase49A.phase49BReadiness,
      artifactUris: [],
      blockers: phase49A.blockers,
      warnings: phase49A.warnings,
    },
    {
      phase: '49B',
      status: normalizedStatus(phase49B.status),
      runId: phase49B.runId,
      summary: `SearXNG generated fixture normalized ${phase49B.normalizedSourceCount} source records.`,
      readiness: phase49B.phase49CReadiness,
      artifactUris: compactUris([phase49B.sourceManifestUri, phase49B.qaReportUri, phase49B.phase49bReportUri]),
      blockers: phase49B.blockers,
      warnings: phase49B.warnings,
    },
    {
      phase: '49C',
      status: normalizedStatus(phase49C.status),
      runId: phase49C.runId,
      summary: 'Playwright + Sharp generated/local capture fixture passed.',
      readiness: phase49C.phase49DReadiness,
      artifactUris: compactUris([phase49C.captureManifestUri, phase49C.qaReportUri, phase49C.phase49cReportUri]),
      blockers: phase49C.blockers,
      warnings: phase49C.warnings,
    },
    {
      phase: '49D',
      status: normalizedStatus(phase49D.status),
      runId: phase49D.runId,
      summary: 'Readability generated/local extraction fixture passed.',
      readiness: phase49D.phase49EReadiness,
      artifactUris: compactUris([phase49D.extractionManifestUri, phase49D.qaReportUri, phase49D.phase49dReportUri]),
      blockers: phase49D.blockers,
      warnings: phase49D.warnings,
    },
    {
      phase: '49E',
      status: normalizedStatus(phase49E.status),
      runId: phase49E.runId,
      summary: `Controlled private fixture E2E produced ${phase49E.sourceCount} sources, ${phase49E.captureCount} captures, and ${phase49E.extractionCount} extractions.`,
      readiness: phase49E.phase49FReadiness,
      artifactUris: compactUris([phase49E.combinedManifestUri, phase49E.qaReportUri, phase49E.phase49eReportUri]),
      blockers: phase49E.blockers,
      warnings: phase49E.warnings,
    },
    {
      phase: '49F',
      status: phase49F.status,
      runId: phase49F.runId,
      summary: `Private SearXNG service validated with ${phase49F.normalizedSourceCount ?? 0} normalized sources.`,
      readiness: phase49F.phase49GReadiness,
      artifactUris: compactUris([phase49F.sourceManifestUri, phase49F.qaReportUri, phase49F.phase49fReportUri]),
      blockers: phase49F.blockers,
      warnings: phase49F.warnings,
    },
    {
      phase: '49G',
      status: phase49G.status,
      runId: phase49G.runId,
      summary: `Controlled live search/capture E2E normalized ${phase49G.normalizedSourceCount ?? 0} sources with ${phase49G.successfulCaptureCount ?? 0} captures and ${phase49G.successfulExtractionCount ?? 0} extractions.`,
      readiness: phase49G.phase49HReadiness,
      artifactUris: compactUris([phase49G.sourceManifestUri, phase49G.combinedManifestUri, phase49G.qaReportUri, phase49G.phase49gReportUri]),
      blockers: phase49G.blockers,
      warnings: phase49G.warnings,
    },
    {
      phase: '49H',
      status: phase49H.status,
      runId: phase49H.runId,
      summary: 'Web search/capture internal readiness gate passed.',
      readiness: phase49H.phase49IReadiness,
      artifactUris: compactUris([phase49H.evidenceChainUri, phase49H.serviceAccessAuditUri, phase49H.qaReportUri, phase49H.phase49hReportUri]),
      blockers: phase49H.blockers,
      warnings: phase49H.warnings,
    },
    {
      phase: '49I',
      status: phase49I.status,
      runId: phase49I.runId,
      summary: 'Internal UI/API route gating and chat-native developer UX gate passed.',
      readiness: phase49I.phase49JReadiness,
      artifactUris: compactUris([phase49I.routeGateAuditUri, phase49I.requestValidationUri, phase49I.uxStateUri, phase49I.qaReportUri, phase49I.phase49iReportUri]),
      blockers: phase49I.blockers,
      warnings: phase49I.warnings,
    },
    {
      phase: '49J',
      status: phase49J.status,
      summary: 'Brave Search fallback policy completed with SearXNG default and Brave optional paid fallback disabled by default.',
      readiness: phase49J.phase49KReadiness,
      artifactUris: [],
      blockers: phase49J.blockers,
      warnings: phase49J.warnings,
    },
    canonicalPhase49K(),
    canonicalPhase49L(),
    canonicalPhase49M(),
  ]

  const blockers = phases.flatMap((phase) => phase.blockers.map((blocker) => `${phase.phase}: ${blocker}`))
  const warnings = phases.flatMap((phase) => phase.warnings.map((warning) => `${phase.phase}: ${warning}`))
  const mandatoryReady = phases.every((phase) => phase.blockers.length === 0 && (phase.status === 'completed' || phase.status === 'approval_review_complete'))
  return {
    generatedAt: new Date().toISOString(),
    phases,
    searchProviderStackStatus: mandatoryReady ? 'ready_for_controlled_internal_testing' : 'blocked',
    blockers,
    warnings,
  }
}

function canonicalPhase49K(): SearchProviderPhaseEvidence {
  const runId = 'phase49k-20260603T13270'
  return {
    phase: '49K',
    status: 'completed',
    runId,
    summary: 'Brave-shaped generated fixture normalizer passed with 6 generated records plus confidence/router/dedupe policy.',
    readiness: 'ready_for_brave_controlled_live_api_validation',
    artifactUris: [
      gcs(searchProviderReadinessConfig.generatedAssetsBucket, `activation-web-search/phase49k/${runId}/sources/brave-fixture-source-manifest.json`),
      gcs(searchProviderReadinessConfig.qaBucket, `activation-web-search/phase49k/${runId}/qa/brave-search-fixture-normalizer-qa.json`),
      gcs(searchProviderReadinessConfig.qaBucket, `activation-web-search/phase49k/${runId}/reports/phase49k-report.json`),
    ],
    blockers: [],
    warnings: ['Phase 49K was generated-fixture only; no live Brave API call occurred.'],
  }
}

function canonicalPhase49L(): SearchProviderPhaseEvidence {
  const runId = 'phase49l-20260603T15002'
  return {
    phase: '49L',
    status: 'completed',
    runId,
    summary: 'Brave controlled live API validation passed with one bounded call, 5 minimal normalized sources, and raw/snippet storage blocked.',
    readiness: 'ready_for_searxng_brave_hybrid_consensus_e2e',
    artifactUris: [
      gcs(searchProviderReadinessConfig.generatedAssetsBucket, `activation-web-search/phase49l/${runId}/sources/brave-live-source-manifest.json`),
      gcs(searchProviderReadinessConfig.qaBucket, `activation-web-search/phase49l/${runId}/qa/brave-live-api-validation-qa.json`),
      gcs(searchProviderReadinessConfig.qaBucket, `activation-web-search/phase49l/${runId}/reports/phase49l-report.json`),
    ],
    blockers: [],
    warnings: ['Phase 49L stored minimal normalized metadata only; raw Brave JSON, snippets, headers, and key material were not persisted.'],
  }
}

function canonicalPhase49M(): SearchProviderPhaseEvidence {
  const runId = searchProviderReadinessConfig.canonicalPhase49MRunId
  return {
    phase: '49M',
    status: 'completed',
    runId,
    summary: 'SearXNG + Brave hybrid consensus E2E passed with 5 SearXNG sources, 5 Brave sources, 7 merged sources, 2 captures, and 2 extractions.',
    readiness: 'ready_for_search_provider_readiness_gate',
    artifactUris: [
      gcs(searchProviderReadinessConfig.generatedAssetsBucket, `activation-web-search/phase49m/${runId}/manifest/hybrid-search-consensus-e2e-manifest.json`),
      gcs(searchProviderReadinessConfig.qaBucket, `activation-web-search/phase49m/${runId}/qa/hybrid-search-consensus-e2e-qa.json`),
      gcs(searchProviderReadinessConfig.qaBucket, `activation-web-search/phase49m/${runId}/reports/phase49m-report.json`),
    ],
    blockers: [],
    warnings: ['Phase 49M used Brave once as a budgeted confidence booster and kept raw Brave response/snippet storage blocked.'],
  }
}

function compactUris(values: Array<string | undefined>): string[] {
  return values.filter((value): value is string => Boolean(value))
}

function normalizedStatus(status: string): SearchProviderReadinessStatus {
  if (status === 'completed') return 'completed'
  if (status === 'approval_review_complete') return 'approval_review_complete'
  if (status === 'blocked') return 'blocked'
  return 'planned'
}

function gcs(bucket: string, object: string): string {
  return `gs://${bucket}/${object}`
}
