import { buildContainerBuildCommandPlans } from './container-build-command-plan'
import { evaluateContainerBuildBlockers } from './container-build-blocker-policy'
import { containerImageBuildPlans } from './container-image-plan'
import type {
  BuildContainerBuildReportInput,
  ContainerBuildNextAction,
  ContainerBuildReport,
  ContainerBuildResult,
  ParsedContainerBuildLog,
} from './container-build-types'

export const CONTAINER_BUILD_REPORT_ID = 'activation-phase-20-container-build-report'

export function buildContainerBuildReport(input: BuildContainerBuildReportInput = {}): ContainerBuildReport {
  const mode = input.mode ?? 'static_plan'
  const commandPlans = input.imageTag ? buildContainerBuildCommandPlans(input.imageTag) : []
  const buildResults = input.buildResults ?? containerImageBuildPlans.map((plan) => plannedBuildResult(plan.imageId, input.imageTag))
  const evaluation = evaluateContainerBuildBlockers({
    imageTag: input.imageTag,
    buildResults,
    packageLockChanged: input.packageLockChanged,
  })

  return {
    reportId: CONTAINER_BUILD_REPORT_ID,
    createdAt: input.createdAt ?? new Date().toISOString(),
    mode,
    imageTag: input.imageTag,
    imagePlans: containerImageBuildPlans,
    commandPlans,
    buildResults,
    blockers: evaluation.blockers,
    warnings: evaluation.warnings,
    phase21Readiness: evaluation.phase21Readiness,
    nextActions: buildNextActions(evaluation.phase21Readiness.readyForNonGpuContainerReadinessValidation),
    dockerBuildExecuted: false,
    dockerPushExecuted: false,
    gcloudExecuted: false,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    realUserMediaTestingAllowed: false,
  }
}

export function buildContainerBuildResultFromParsedLog(input: {
  parsedLog: ParsedContainerBuildLog
  logPath?: string
  imageTag?: string
}): ContainerBuildResult {
  const status = statusFromParsedLog(input.parsedLog)
  return {
    imageId: input.parsedLog.imageId ?? 'unknown',
    status,
    imageTag: input.imageTag,
    logPath: input.logPath,
    parsedLog: input.parsedLog,
    detectedImageId: input.parsedLog.detectedImageId,
    detectedDigest: input.parsedLog.detectedDigest,
    warnings: input.parsedLog.warnings,
    errors: [...input.parsedLog.errors, ...input.parsedLog.forbiddenFindings],
  }
}

function plannedBuildResult(imageId: ContainerBuildResult['imageId'], imageTag?: string): ContainerBuildResult {
  return {
    imageId,
    status: 'planned',
    imageTag,
    warnings: [],
    errors: [],
  }
}

function statusFromParsedLog(parsedLog: ParsedContainerBuildLog): ContainerBuildResult['status'] {
  if (parsedLog.parsedStatus === 'passed') return 'passed'
  if (parsedLog.parsedStatus === 'failed') return 'failed'
  if (parsedLog.parsedStatus === 'blocked') return 'blocked'
  if (parsedLog.parsedStatus === 'warning') return 'warning'
  return 'blocked'
}

function buildNextActions(nonGpuReady: boolean): ContainerBuildNextAction[] {
  return [
    {
      id: 'review-command-plan',
      title: 'Review build command plan',
      summary: 'Confirm image names, explicit tag, Dockerfile paths, and human-run ownership before any build.',
    },
    {
      id: 'collect-build-logs',
      title: 'Collect human build logs',
      summary: 'Use activation:container-build:report with local log files after humans run Docker builds.',
    },
    {
      id: 'phase21-readiness',
      title: nonGpuReady ? 'Prepare Phase 21 non-GPU readiness' : 'Resolve build evidence blockers',
      summary: nonGpuReady
        ? 'Non-GPU images have build evidence; GPU may remain deferred until GPU activation.'
        : 'Phase 21 remains blocked until required non-GPU image build evidence passes.',
    },
  ]
}
