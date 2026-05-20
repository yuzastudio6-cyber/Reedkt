import type {
  EditPlanRecord,
  GeneratedAssetRecord,
  SFXMixPlanRecord,
  SFXQAReportRecord,
  SFXTimingAlignmentRecord,
} from '../../types'
import type {
  EditProjectSFXFlowResult,
  EditProjectSFXProjectAssetDecision,
} from '../contracts/sfx-director-contracts'
import type { MockDatabase } from '../mock/mock-database'
import { createMockDatabase, findMockRecord, insertMockRecord, nowIso } from '../mock/mock-database'
import {
  getDefaultMockEditProjectSFXScenario,
  getMockEditProjectSFXScenarioById,
  type MockEditProjectSFXScenario,
} from '../mock/mock-edit-project-sfx-scenarios'
import { createEditProjectSFXIntegration } from '../services/edit-project-sfx-integration-service'
import { createEditProjectSFXStatusSummary } from '../services/edit-project-sfx-status-service'
import { runSFXWorkerSkeleton } from '../workers/sfx-worker-skeleton'
import type { SFXWorkerRunResult } from '../workers/sfx-worker-contracts'
import { unwrapServiceResult } from '../service-result'

function createMockEditPlan(scenario: MockEditProjectSFXScenario): EditPlanRecord {
  const approved = scenario.input.editPlanApproved !== false

  return {
    id: scenario.input.editPlanId,
    projectId: scenario.input.projectId,
    chatSessionId: scenario.input.chatSessionId ?? `mock-chat-${scenario.id}`,
    intentAnalysisId: `mock-intent-${scenario.id}`,
    sourceClipSequenceId: `mock-source-sequence-${scenario.id}`,
    status: approved ? 'approved' : 'awaiting_approval',
    complexity: scenario.input.editComplexity,
    professionalStandardRequired: true,
    goalSummary: scenario.description,
    strategySummary: 'Project-level SFX is planned only for edit-layer cues and remains approval-gated.',
    hookPolicy: 'recommended',
    hookRecommendation: 'Use SFX only where it supports the edit plan.',
    approvalStatus: approved ? 'approved' : 'pending',
    approvedByUserId: approved ? 'mock-user-reeditpro' : undefined,
    approvedAt: approved ? nowIso() : undefined,
    approvalRequiredBeforeGeneration: true,
    version: 1,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: {
      mockOnly: true,
      projectSfxScenarioId: scenario.id,
    },
  }
}

function seedProjectContext(db: MockDatabase, scenario: MockEditProjectSFXScenario): EditPlanRecord {
  const existing = findMockRecord(db, 'editPlans', scenario.input.editPlanId)
  if (existing) return existing
  return insertMockRecord(db, 'editPlans', createMockEditPlan(scenario))
}

function payloadString(payload: Record<string, unknown> | undefined, key: string): string | undefined {
  const value = payload?.[key]
  return typeof value === 'string' ? value : undefined
}

function runProjectSFXWorkers(input: {
  db: MockDatabase
  scenario: MockEditProjectSFXScenario
  integration: EditProjectSFXFlowResult['sfxIntegration']
  editPlan: EditPlanRecord
}): SFXWorkerRunResult[] {
  if (!input.scenario.input.runMockWorker) return []

  return input.integration.generationRequests.map((generationRequest) => {
    const promptPlanId = payloadString(generationRequest.requestPayload as Record<string, unknown>, 'sfxPromptPlanId')
    const providerRouteId = payloadString(generationRequest.requestPayload as Record<string, unknown>, 'providerRouteId')
    const eventPlanId = payloadString(generationRequest.requestPayload as Record<string, unknown>, 'sfxEventPlanId')
    const promptPlan = input.integration.promptPlans.find((candidate) => candidate.id === promptPlanId)
    const providerRoute = input.integration.providerRoutes.find((candidate) => candidate.id === providerRouteId)
    const eventPlan = input.integration.sfxEventPlans.find((candidate) => candidate.id === eventPlanId)
    const job = input.integration.jobs.find((candidate) =>
      payloadString(candidate.inputPayload as Record<string, unknown>, 'generationRequestId') === generationRequest.id
    )

    if (!promptPlan || !providerRoute || !eventPlan || !job || !input.integration.creditEstimate || !input.integration.creditApproval || !input.integration.creditReservation) {
      return runSFXWorkerSkeleton({
        db: input.db,
        workerInput: {
          jobId: job?.id ?? 'missing-project-sfx-job',
          workspaceId: input.scenario.input.workspaceId ?? 'mock-workspace-reeditpro',
          projectId: input.scenario.input.projectId,
          editPlanId: input.scenario.input.editPlanId,
          sfxEventPlanId: eventPlan?.id ?? 'missing-sfx-event-plan',
          sfxProviderRouteId: providerRoute?.id ?? 'missing-sfx-provider-route',
          sfxPromptPlanId: promptPlan?.id ?? 'missing-sfx-prompt-plan',
          generationRequestId: generationRequest.id,
          creditReservationId: input.integration.creditReservation?.id ?? 'missing-credit-reservation',
          mockOnly: true,
        },
        records: {},
      })
    }

    return runSFXWorkerSkeleton({
      db: input.db,
      workerInput: {
        jobId: job.id,
        workspaceId: input.scenario.input.workspaceId ?? 'mock-workspace-reeditpro',
        projectId: input.scenario.input.projectId,
        editPlanId: input.scenario.input.editPlanId,
        sfxEventPlanId: eventPlan.id,
        sfxProviderRouteId: providerRoute.id,
        sfxPromptPlanId: promptPlan.id,
        generationRequestId: generationRequest.id,
        creditReservationId: input.integration.creditReservation.id,
        userConfirmationApproved: true,
        sourceFootageApproved: true,
        providerUnavailable: input.scenario.input.providerUnavailable,
        mockOnly: true,
      },
      records: {
        job,
        editPlan: input.editPlan,
        creditEstimate: input.integration.creditEstimate,
        creditApproval: input.integration.creditApproval,
        creditReservation: input.integration.creditReservation,
        generationRequest,
        sfxEventPlan: eventPlan,
        sfxProviderRoute: providerRoute,
        sfxPromptPlan: promptPlan,
        speechPresent: !/no speech|montage only/i.test(input.scenario.input.userInstructions?.join(' ') ?? ''),
        musicPresent: !/no music/i.test(input.scenario.input.userInstructions?.join(' ') ?? ''),
        ambienceImportant: /ambience|lifestyle|lake como|faith|serious|luxury/i.test([
          input.scenario.input.videoTone,
          ...(input.scenario.input.userInstructions ?? []),
        ].join(' ')),
        videoTone: input.scenario.input.videoTone,
        userSFXInstructions: input.scenario.input.userInstructions,
        avoidSFXInstructions: input.scenario.input.avoidInstructions,
        mockOutputSummary: input.scenario.input.simulateQAFailure
          ? 'cartoonish too loud over speech provider output low quality'
          : 'clean subtle mock SFX output',
        providerTermsKnown: Boolean(input.scenario.input.simulateMockApproval),
        commercialAllowed: Boolean(input.scenario.input.simulateMockApproval),
        adsAllowed: Boolean(input.scenario.input.simulateMockApproval),
        clientWorkAllowed: Boolean(input.scenario.input.simulateMockApproval),
        reuseAcrossUsersAllowed: Boolean(input.scenario.input.simulateMockApproval),
        simulateMockApproval: input.scenario.input.simulateMockApproval,
        simulateApprovedLibraryMatch: input.scenario.input.simulateApprovedLibraryMatch,
      },
    })
  })
}

function createProjectAssetDecisions(input: {
  scenario: MockEditProjectSFXScenario
  integration: EditProjectSFXFlowResult['sfxIntegration']
  workerOutputs: SFXWorkerRunResult[]
}): EditProjectSFXProjectAssetDecision[] {
  if (input.integration.promptPlans.length === 0) {
    return input.integration.sfxEventPlans.map((eventPlan) => ({
      sfxEventPlanId: eventPlan.id,
      status: 'skipped_no_sfx',
      reason: 'No SFX is the professional route for this project moment.',
    }))
  }

  if (input.workerOutputs.length === 0) {
    return input.integration.sfxEventPlans.map((eventPlan) => ({
      sfxEventPlanId: eventPlan.id,
      status: 'blocked',
      reason: 'Generation is blocked until edit plan approval, credit approval, and credit reservation are present.',
    }))
  }

  return input.workerOutputs.map((run) => {
    if (run.output.status === 'blocked') {
      return {
        sfxEventPlanId: run.output.sfxEventPlanId,
        status: 'blocked',
        reason: run.output.message,
      }
    }

    if (run.output.status === 'failed' || run.qaReport?.status === 'failed') {
      return {
        sfxEventPlanId: run.output.sfxEventPlanId,
        status: 'qa_failed',
        generatedAssetId: run.generatedAsset?.id,
        sfxGeneratedAssetId: run.generatedSFXAsset?.id,
        reason: 'Mock SFX QA failed and recommends adjustment or regeneration.',
      }
    }

    if (run.libraryCandidate) {
      return {
        sfxEventPlanId: run.output.sfxEventPlanId,
        status: 'library_candidate',
        generatedAssetId: run.generatedAsset?.id,
        sfxGeneratedAssetId: run.generatedSFXAsset?.id,
        libraryCandidateId: run.libraryCandidate.id,
        reason: 'Mock QA/provenance made this generated SFX a library candidate.',
      }
    }

    return {
      sfxEventPlanId: run.output.sfxEventPlanId,
      status: 'project_only',
      generatedAssetId: run.generatedAsset?.id,
      sfxGeneratedAssetId: run.generatedSFXAsset?.id,
      reason: 'Mock SFX is approved for this project only.',
    }
  })
}

export function runEditProjectSFXFlow(
  scenario: MockEditProjectSFXScenario = getDefaultMockEditProjectSFXScenario(),
  db: MockDatabase = createMockDatabase(),
): EditProjectSFXFlowResult {
  const editPlan = seedProjectContext(db, scenario)
  const sfxIntegration = unwrapServiceResult(createEditProjectSFXIntegration(db, scenario.input))
  const workerOutputs = runProjectSFXWorkers({ db, scenario, integration: sfxIntegration, editPlan })
  const generatedAssets = workerOutputs
    .map((run) => run.generatedAsset)
    .filter((asset): asset is GeneratedAssetRecord => Boolean(asset))
  const timingPlans = workerOutputs
    .map((run) => run.timingAlignment)
    .filter((plan): plan is SFXTimingAlignmentRecord => Boolean(plan))
  const mixPlans = workerOutputs
    .map((run) => run.mixPlan)
    .filter((plan): plan is SFXMixPlanRecord => Boolean(plan))
  const qaReports = workerOutputs
    .map((run) => run.qaReport)
    .filter((report): report is SFXQAReportRecord => Boolean(report))
  const libraryCandidates = workerOutputs
    .map((run) => run.libraryCandidate)
    .filter((candidate): candidate is NonNullable<SFXWorkerRunResult['libraryCandidate']> => Boolean(candidate))
  const projectAssetDecisions = createProjectAssetDecisions({ scenario, integration: sfxIntegration, workerOutputs })
  const statusSummary = createEditProjectSFXStatusSummary({
    integration: sfxIntegration,
    workerOutputs,
    generatedAssets,
    sfxGeneratedAssets: workerOutputs
      .map((run) => run.generatedSFXAsset)
      .filter((asset): asset is NonNullable<SFXWorkerRunResult['generatedSFXAsset']> => Boolean(asset)),
    timingPlans,
    mixPlans,
    qaReports,
    libraryCandidates,
  })
  const chatSummary = [
    `Project SFX flow: ${scenario.label}.`,
    ...sfxIntegration.providerRouteSummary.slice(0, 4),
    ...statusSummary.slice(0, 4),
  ]

  return {
    sfxIntegration,
    workerOutputs,
    generatedAssets,
    timingPlans,
    mixPlans,
    qaReports,
    projectAssetDecisions,
    chatSummary,
    statusSummary,
    warnings: [
      ...sfxIntegration.warnings,
      ...workerOutputs.flatMap((run) => run.output.warnings),
      'RP-FIX-14 project SFX flow is mock-only; real Mirelo/MMAudio calls remain disabled.',
    ],
  }
}

function runScenarioById(id: string): EditProjectSFXFlowResult {
  const scenario = getMockEditProjectSFXScenarioById(id)
  if (!scenario) throw new Error(`Missing project SFX scenario: ${id}`)
  return runEditProjectSFXFlow(scenario)
}

export function runBasicEditProjectSFXFlow(): EditProjectSFXFlowResult {
  return runScenarioById('basic-no-sfx-needed')
}

export function runProEditProjectSFXFlow(): EditProjectSFXFlowResult {
  return runScenarioById('pro-mirelo-important-transition')
}

export function runSignatureEditProjectSFXFlow(): EditProjectSFXFlowResult {
  return runScenarioById('signature-stroke-motion-mirelo')
}

export function runPremiumEditProjectSFXFlow(): EditProjectSFXFlowResult {
  return runScenarioById('premium-multiple-mirelo-production')
}

export function runLakeComoProjectSFXFlow(): EditProjectSFXFlowResult {
  return runScenarioById('lake-como-lifestyle-project')
}

export function runFaithProjectNoSFXFlow(): EditProjectSFXFlowResult {
  return runScenarioById('faith-teaching-no-sfx')
}
