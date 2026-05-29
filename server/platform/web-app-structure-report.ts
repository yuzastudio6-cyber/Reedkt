import { buildPlatformBoundaryReport } from './platform-boundary-report-builder'
import {
  CURRENT_PUBLIC_ASSETS_PATH,
  CURRENT_VITE_ENTRY_PATH,
  CURRENT_WEB_SOURCE_PATH,
  NEXT_WEB_APP_PHASE,
  WEB_APP_COMPAT_SCRIPTS,
  WEB_APP_PATH,
  WEB_APP_REQUIRED_ROOT_SCRIPTS,
  WEB_APP_STRUCTURE_MODE,
  WEB_APP_STRUCTURE_REPORT_ID,
  WEB_APP_STRUCTURE_SCRIPTS,
  getDesktopStructureStatus,
} from './web-app-structure-policy'
import type { WebAppStructureReport } from './platform-boundary-types'

export function buildWebAppStructureReport(options: { createdAt?: string } = {}): WebAppStructureReport {
  const platformReport = buildPlatformBoundaryReport({ createdAt: options.createdAt })

  return {
    reportId: WEB_APP_STRUCTURE_REPORT_ID,
    createdAt: options.createdAt ?? new Date().toISOString(),
    structureMode: WEB_APP_STRUCTURE_MODE,
    webAppPath: WEB_APP_PATH,
    currentSourcePath: CURRENT_WEB_SOURCE_PATH,
    viteEntryPath: CURRENT_VITE_ENTRY_PATH,
    publicAssetsPath: CURRENT_PUBLIC_ASSETS_PATH,
    rootScriptsPreserved: WEB_APP_REQUIRED_ROOT_SCRIPTS,
    webScriptsAdded: [
      ...WEB_APP_STRUCTURE_SCRIPTS,
      ...WEB_APP_COMPAT_SCRIPTS,
    ],
    desktopStatus: getDesktopStructureStatus(),
    forbiddenFindings: [],
    blockers: [
      'Full source move is deferred until root UI and src/backend contracts can be separated safely.',
      'Production readiness remains blocked until later web, backend, QA, security, cost, privacy, and support gates pass.',
      'External beta remains blocked until a later explicit go/no-go phase.',
      'Broad real media testing remains blocked by activation readiness policy.',
    ],
    warnings: [
      'Phase 44B preserves root Vite source, public assets, and scripts as the active web build path.',
      'apps/web is canonical by boundary and docs, not by physical source relocation yet.',
      'No workspace, desktop runtime, dependency install, or package-lock change is introduced.',
    ],
    nextActions: [
      NEXT_WEB_APP_PHASE,
      'Separate browser UI from src/backend contracts before any future physical source move.',
      'Keep server-owned workers, secrets, model policy, and heavy execution outside apps/web.',
    ],
    revideoReadiness: platformReport.revideoReadiness,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    broadRealMediaAllowed: false,
  }
}

export function summarizeWebAppStructureReport(report: WebAppStructureReport): string {
  return [
    `web app structure report: ${report.reportId}`,
    `structure mode: ${report.structureMode}`,
    `apps/web path: ${report.webAppPath}`,
    `current source path: ${report.currentSourcePath}`,
    `vite entry path: ${report.viteEntryPath}`,
    `public assets path: ${report.publicAssetsPath}`,
    `root scripts preserved: ${report.rootScriptsPreserved.join(', ')}`,
    `web scripts available: ${report.webScriptsAdded.join(', ')}`,
    `desktop: deferred (${report.desktopStatus})`,
    `next phase: ${NEXT_WEB_APP_PHASE}`,
    'production/external beta/broad real media: blocked',
    `production ready allowed: ${report.productionReadyAllowed}`,
    `external beta allowed: ${report.externalBetaAllowed}`,
    `broad real media allowed: ${report.broadRealMediaAllowed}`,
    `revideo: ${report.revideoReadiness.policy} / ${report.revideoReadiness.status}`,
    '',
    'blockers:',
    ...(report.blockers.length ? report.blockers.map((blocker) => `- ${blocker}`) : ['- none']),
    '',
    'warnings:',
    ...(report.warnings.length ? report.warnings.map((warning) => `- ${warning}`) : ['- none']),
    '',
    'next actions:',
    ...report.nextActions.map((action) => `- ${action}`),
  ].join('\n')
}
