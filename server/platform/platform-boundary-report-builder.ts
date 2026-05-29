import {
  PLATFORM_APP_BOUNDARIES,
  WEB_LAUNCH_TRACK,
  findPlatformBoundary,
} from './platform-product-strategy'
import { NEXT_PLATFORM_PHASE } from './platform-roadmap'
import type { PlatformReadinessSummary, ProductStrategyReport } from './platform-boundary-types'

export const PLATFORM_BOUNDARY_REPORT_ID = 'activation-phase-44a-web-first-platform-boundaries'

function plannedWebReadiness(): PlatformReadinessSummary {
  return {
    status: 'planned',
    summary: 'Web is the launch track, but Phase 44A only establishes boundaries and static reporting.',
    readyFor: [
      NEXT_PLATFORM_PHASE,
      'web production shell planning',
      'browser-safe app structure work',
    ],
    notReadyFor: [
      'production launch',
      'external beta',
      'broad real media testing',
      'browser-owned workers',
      'browser-owned model weights',
      'browser-owned provider calls',
    ],
  }
}

function futureDesktopReadiness(): PlatformReadinessSummary {
  return {
    status: 'future',
    summary: 'Desktop is deferred and must remain documentation/boundary-only in Phase 44A.',
    readyFor: [
      'future desktop framework decision after web path matures',
      'future local worker planning',
    ],
    notReadyFor: [
      'active Mac/Windows runtime',
      'Tauri or Electron installation',
      'installer scripts',
      'hardware scan execution',
      'local AI execution',
    ],
  }
}

function plannedSharedPackageReadiness(): PlatformReadinessSummary {
  return {
    status: 'planned',
    summary: 'Shared packages are named and bounded, but no workspace implementation is introduced in Phase 44A.',
    readyFor: [
      'pure type extraction planning',
      'UI package planning',
      'editor-core pure logic planning',
      'future compute-routing type planning',
    ],
    notReadyFor: [
      'server secrets',
      'model weights',
      'GCP mutation logic',
      'browser-heavy coupling',
      'desktop runtime dependencies',
    ],
  }
}

export function buildPlatformBoundaryReport(options: { createdAt?: string } = {}): ProductStrategyReport {
  return {
    reportId: PLATFORM_BOUNDARY_REPORT_ID,
    createdAt: options.createdAt ?? new Date().toISOString(),
    launchTrack: WEB_LAUNCH_TRACK,
    deferredTracks: ['desktop', 'local_worker_future'],
    repoBoundaries: PLATFORM_APP_BOUNDARIES,
    webReadiness: plannedWebReadiness(),
    desktopReadiness: futureDesktopReadiness(),
    sharedPackageReadiness: plannedSharedPackageReadiness(),
    revideoReadiness: {
      status: 'blocked',
      policy: 'evaluation_only',
      coreDependencyAllowed: false,
      notes: [
        'Revideo remains evaluation-only and is not made core by Phase 44A.',
        'Web, server, and future desktop boundaries must not depend on Revideo for launch readiness.',
      ],
    },
    blockers: [
      'Production readiness remains blocked until later web, backend, QA, security, cost, privacy, and support gates pass.',
      'External beta remains blocked until a later explicit go/no-go phase.',
      'Broad real media testing remains blocked by activation readiness policy.',
      'Desktop active runtime is blocked in Phase 44A.',
      'Local worker and local AI execution are future-only.',
      'Revideo remains evaluation-only and blocked as a core dependency.',
    ],
    warnings: [
      'Phase 44A is static/report-only and must not execute Docker, gcloud, model download, provider, or media workflows.',
      'The existing backend activation stack remains authoritative for workers, private artifacts, model policy, and readiness gates.',
      'Shared packages are boundaries only; no workspace/package implementation is created in this phase.',
    ],
    nextActions: [
      NEXT_PLATFORM_PHASE,
      'Keep desktop deferred while the web launch path is implemented.',
      'Keep heavy editing cloud-backed through server-owned workers.',
    ],
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    broadRealMediaAllowed: false,
  }
}

export function summarizePlatformBoundaryReport(report: ProductStrategyReport): string {
  const desktopBoundary = findPlatformBoundary('apps/desktop')
  const sharedBoundaryCount = report.repoBoundaries.filter((boundary) => boundary.track === 'shared').length

  return [
    `platform boundary report: ${report.reportId}`,
    `launch track: ${report.launchTrack}`,
    `desktop: deferred (${desktopBoundary?.status ?? report.desktopReadiness.status})`,
    `shared packages: planned (${sharedBoundaryCount} package boundaries)`,
    `next phase: ${NEXT_PLATFORM_PHASE}`,
    'production/external beta/broad real media: blocked',
    `production ready allowed: ${report.productionReadyAllowed}`,
    `external beta allowed: ${report.externalBetaAllowed}`,
    `broad real media allowed: ${report.broadRealMediaAllowed}`,
    `revideo: ${report.revideoReadiness.policy} / ${report.revideoReadiness.status}`,
    '',
    'blockers:',
    ...report.blockers.map((blocker) => `- ${blocker}`),
    '',
    'next actions:',
    ...report.nextActions.map((action) => `- ${action}`),
  ].join('\n')
}
