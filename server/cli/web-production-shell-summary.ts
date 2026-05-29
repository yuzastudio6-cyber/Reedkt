import {
  WEB_SHELL_ACTIVE_SOURCE_PATH,
  WEB_SHELL_CANONICAL_WEB_BOUNDARY,
  WEB_SHELL_NEXT_PHASE,
  WEB_SHELL_STRUCTURE_DECISION,
  webShellRoutes,
} from '../../src/web-shell/web-shell-routes'
import { disabledExecutionControls, webShellSafetyPolicy } from '../../src/web-shell/web-shell-policy'

const summary = {
  structureDecision: WEB_SHELL_STRUCTURE_DECISION,
  webBoundary: WEB_SHELL_CANONICAL_WEB_BOUNDARY,
  activeSourcePath: WEB_SHELL_ACTIVE_SOURCE_PATH,
  shellRoutes: webShellRoutes.map((route) => `${route.id}: ${route.path}`),
  disabledExecutionControls: disabledExecutionControls.map((control) => control.label),
  safetyState: {
    productionReadyAllowed: webShellSafetyPolicy.productionReadyAllowed,
    externalBetaAllowed: webShellSafetyPolicy.externalBetaAllowed,
    broadRealMediaAllowed: webShellSafetyPolicy.broadRealMediaAllowed,
    cloudExecutionStatus: webShellSafetyPolicy.cloudExecutionStatus,
    localComputeStatus: webShellSafetyPolicy.localComputeStatus,
    desktopLocalWorkerStatus: webShellSafetyPolicy.desktopLocalWorkerStatus,
  },
  nextPhaseSuggestion: WEB_SHELL_NEXT_PHASE,
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(summary, null, 2))
} else {
  console.log([
    'web production shell summary',
    `structure decision: ${summary.structureDecision}`,
    `web boundary: ${summary.webBoundary} canonical`,
    `active source path: root ${summary.activeSourcePath}`,
    'shell routes:',
    ...summary.shellRoutes.map((route) => `- ${route}`),
    'disabled execution controls:',
    ...summary.disabledExecutionControls.map((control) => `- ${control}`),
    'production/external beta/broad real media: blocked',
    `cloud execution: ${summary.safetyState.cloudExecutionStatus}`,
    `local compute: ${summary.safetyState.localComputeStatus}`,
    `desktop local worker: ${summary.safetyState.desktopLocalWorkerStatus}`,
    `next phase: ${summary.nextPhaseSuggestion}`,
  ].join('\n'))
}
