import { createMockProjectEditBriefFixtureBundle } from '../../lib/mock-project-edit-briefs'
import {
  PROJECT_EDIT_BRIEF_PLAN_PRIORITY_POLICY,
  createProjectEditBriefMarkerPlanInstructions,
  createProjectEditBriefPlanApplicationResult,
  createProjectEditBriefPlanPanelModel,
  createProjectEditBriefPlanReadableSummary,
  createProjectEditBriefPlannerInputPackage,
  validateProjectEditBriefPlannerInputPackage,
} from '../../lib/project-edit-brief-plan-rules'
import type { ProjectEditBriefPlanOrchestratorResult } from '../../types/project-edit-brief-plan'
import { createProjectEditBriefPlanApplicationLog } from '../project-edit-brief-plan/project-edit-brief-plan-application-log-service'

function defaultBundle() {
  const fixtures = createMockProjectEditBriefFixtureBundle()
  return fixtures.bundles.find((bundle) => bundle.brief.editSessionId === 'edit-session-youtube-wide')
    ?? fixtures.bundles.find((bundle) => bundle.markers.length > 0)
    ?? fixtures.bundles[0]
}

export function runMockProjectEditBriefPlanFlow(): ProjectEditBriefPlanOrchestratorResult {
  const bundle = defaultBundle()
  const plannerInputPackage = createProjectEditBriefPlannerInputPackage({
    bundle,
    exportSettings: bundle.exportSettings,
  })
  const applicationLog = createProjectEditBriefPlanApplicationLog(plannerInputPackage)
  const packageWithLog = {
    ...plannerInputPackage,
    applicationLogSummary: applicationLog.summary,
  }
  const applicationResult = createProjectEditBriefPlanApplicationResult({
    package: packageWithLog,
    applicationLog,
  })
  const validation = validateProjectEditBriefPlannerInputPackage(packageWithLog)
  return {
    priorityPolicy: PROJECT_EDIT_BRIEF_PLAN_PRIORITY_POLICY,
    eligibleMarkers: packageWithLog.eligibleMarkers,
    skippedMarkers: packageWithLog.skippedMarkers,
    planInstructions: packageWithLog.planInstructions,
    plannerInputPackage: packageWithLog,
    applicationResult,
    panelModel: createProjectEditBriefPlanPanelModel(packageWithLog),
    validation,
    summary: createProjectEditBriefPlanReadableSummary(packageWithLog),
    warnings: packageWithLog.warnings,
    nextStep: 'RP-EDITBRIEF-12 — Internal Testing + Playwright Coverage',
    mockOnly: true,
    plannerExecuted: false,
    editPlanCreated: false,
    providerCallMade: false,
    supabaseWriteMade: false,
    storageWriteMade: false,
    fileBytesRead: false,
    externalUrlFetched: false,
    mediaProcessingStarted: false,
    workerJobCreated: false,
    generationRequestCreated: false,
    renderJobCreated: false,
    creditReservedOrSpent: false,
  }
}

export function runMockMarkerEligibilityFlow() {
  return createProjectEditBriefMarkerPlanInstructions({ bundle: defaultBundle() })
}

export function runMockMarkerInstructionMappingFlow() {
  return runMockProjectEditBriefPlanFlow().planInstructions
}

export function runMockPlanPackageFlow() {
  return runMockProjectEditBriefPlanFlow().plannerInputPackage
}

export function runMockPlanApplicationFlow() {
  return runMockProjectEditBriefPlanFlow().applicationResult
}

export function runMockPlanApplicationLogFlow() {
  return runMockProjectEditBriefPlanFlow().applicationResult.applicationLog
}

export function runMockPlanPanelModelFlow() {
  return runMockProjectEditBriefPlanFlow().panelModel
}

export function runMockPlanValidationFlow() {
  return runMockProjectEditBriefPlanFlow().validation
}

export function runMockPlanReadinessFlow() {
  return runMockProjectEditBriefPlanFlow().plannerInputPackage.readinessStatus
}
