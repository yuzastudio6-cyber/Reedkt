import {
  runMockLakeComoSFXLibraryFlow,
} from '../../../backend/orchestrators/mock-sfx-library-orchestrator'
import { runLakeComoProjectSFXFlow } from '../../../backend/orchestrators/edit-project-sfx-orchestrator'
import { runMockLakeComoSFXMixFlow } from '../../../backend/orchestrators/mock-sfx-mix-orchestrator'
import { runMockLakeComoSFXPlanningFlow } from '../../../backend/orchestrators/mock-sfx-planning-orchestrator'
import { runMockLakeComoSFXPromptFlow } from '../../../backend/orchestrators/mock-sfx-prompt-orchestrator'
import { runMockLakeComoSFXQAFlow } from '../../../backend/orchestrators/mock-sfx-qa-orchestrator'
import { runMockLakeComoSFXTimingFlow } from '../../../backend/orchestrators/mock-sfx-timing-orchestrator'
import {
  mockSFXEventPlans,
  mockSFXGeneratedAssets,
  mockSFXLibraryCandidates,
  mockSFXMixPlans,
  mockSFXPromptPlans,
  mockSFXProviderRoutes,
  mockSFXQAReports,
  mockSFXTimingAlignments,
  mockSFXTrimPlans,
} from '../../../lib/mock-sfx-director-records'
import type {
  SFXEventPlanRecord,
  SFXGeneratedAssetRecord,
  SFXLibraryCandidateRecord,
  SFXMixPlanRecord,
  SFXPromptPlanRecord,
  SFXProvider,
  SFXProviderRouteRecord,
  SFXQAReportRecord,
  SFXTimingAlignmentRecord,
  SFXTimingValidationResult,
  SFXTrimPlanRecord,
} from '../../../types'

export type SFXDirectorPlanView = {
  defaultPolicy: string
  sourceFootagePolicy: string
  decisionStateSummary: string
  recommendedTargetLayers: string[]
  avoidedSourceActionSFX: string[]
  volumePhilosophy: string
  providerStrategy: string
  creditApprovalRule: string
  nextStep: string
}

export type SFXCreditEstimateView = {
  eventCount: number
  librarySearchCount: number
  mmaudioDraftCount: number
  mireloProductionCount: number
  timingTrimCredits: number
  mixQACredits: number
  estimatedCredits: number
  approvalRequired: boolean
}

export type SFXChatData = {
  projectIntegration: {
    statusSummary: string[]
    providerRouteSummary: string[]
    eventCount: number
    generationRequestCount: number
    queuedJobCount: number
    qaPassedCount: number
  }
  directorPlan: SFXDirectorPlanView
  eventPlans: SFXEventPlanRecord[]
  providerRoute: SFXProviderRouteRecord
  promptPlan: SFXPromptPlanRecord
  generatedAsset: SFXGeneratedAssetRecord
  trimPlan: SFXTrimPlanRecord
  timingAlignment: SFXTimingAlignmentRecord
  timingValidation?: SFXTimingValidationResult
  mixPlan: SFXMixPlanRecord
  mixWarnings: string[]
  qaReport: SFXQAReportRecord
  warningQAReport: SFXQAReportRecord
  libraryCandidate?: SFXLibraryCandidateRecord
  creditEstimate: SFXCreditEstimateView
  progressSteps: string[]
}

export const sfxProviderLabels: Record<SFXProvider, string> = {
  mirelo_sfx_v1_5: 'Mirelo SFX V1.5 - production SFX',
  mmaudio_v2: 'MMAudio V2 - draft/basic/pro fallback',
  mmaudio_v: 'MMAudio V2 - legacy alias',
  reeditpro_internal_library: 'Internal library - reusable approved sounds',
  no_sfx: 'No SFX - valid professional choice',
  manual_upload: 'Manual upload - user-provided sound',
  unknown: 'Unknown provider',
}

export function formatSFXLabel(value?: string | number | boolean) {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'number') return String(value)
  if (!value) return 'Not set'

  return value
    .replaceAll('_', ' ')
    .replaceAll('-', ' ')
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function formatSFXSeconds(value?: number) {
  return typeof value === 'number' ? `${value.toFixed(2)}s` : 'Not set'
}

export function formatSFXMs(value?: number) {
  return typeof value === 'number' ? `${value}ms` : 'Not set'
}

function uniqueLabels(values: string[]) {
  return Array.from(new Set(values)).map(formatSFXLabel)
}

function createDirectorPlan(eventPlans: SFXEventPlanRecord[], providerRoutes: SFXProviderRouteRecord[]): SFXDirectorPlanView {
  return {
    defaultPolicy: 'Edit-layer SFX only by default',
    sourceFootagePolicy: 'Source-footage SFX avoided unless full sound design, repair, silent B-roll, or Real Motion support is explicitly justified.',
    decisionStateSummary: `${eventPlans.filter((event) => event.decisionState === 'needed').length} needed, ${eventPlans.filter((event) => event.decisionState === 'optional').length} optional, ${eventPlans.filter((event) => event.decisionState === 'avoid').length} avoided`,
    recommendedTargetLayers: uniqueLabels(eventPlans.map((event) => event.targetLayer).filter((layer) => layer !== 'none')),
    avoidedSourceActionSFX: ['Footsteps', 'Fake water everywhere', 'Doors', 'Crowd beds', 'Clothing movement'],
    volumePhilosophy: 'Premium soft / subtle polish, voice-first, never loud by default',
    providerStrategy: providerRoutes.some((route) => route.useInternalLibraryFirst)
      ? 'Internal library first, MMAudio V2 draft fallback, Mirelo production for key moments, no SFX allowed'
      : 'Provider route is planned, not executed',
    creditApprovalRule: 'SFX generation starts only after plan and credit approval. This demo spends no real credits.',
    nextStep: 'Create prompt previews, then timing, mix, QA, and project-only library decisions',
  }
}

function createCreditEstimate(eventPlans: SFXEventPlanRecord[], providerRoutes: SFXProviderRouteRecord[]): SFXCreditEstimateView {
  const eventCount = eventPlans.filter((event) => event.decisionState !== 'avoid' && event.decisionState !== 'not_needed').length
  const librarySearchCount = providerRoutes.filter((route) => route.useInternalLibraryFirst).length
  const mmaudioDraftCount = providerRoutes.filter((route) => route.useMMAudioForDraft).length
  const mireloProductionCount = providerRoutes.filter((route) => route.useMireloForProduction).length
  const timingTrimCredits = Math.max(1, eventCount)
  const mixQACredits = Math.max(2, eventCount * 2)

  return {
    eventCount,
    librarySearchCount,
    mmaudioDraftCount,
    mireloProductionCount,
    timingTrimCredits,
    mixQACredits,
    estimatedCredits: eventCount * 5 + timingTrimCredits + mixQACredits,
    approvalRequired: true,
  }
}

export function createSFXChatUiData(): SFXChatData {
  const projectFlow = runLakeComoProjectSFXFlow()
  const planningFlow = runMockLakeComoSFXPlanningFlow()
  const promptFlow = runMockLakeComoSFXPromptFlow()
  const timingFlow = runMockLakeComoSFXTimingFlow()
  const mixFlow = runMockLakeComoSFXMixFlow()
  const qaFlow = runMockLakeComoSFXQAFlow()
  const libraryFlow = runMockLakeComoSFXLibraryFlow()
  const eventPlans = (planningFlow.sfxEventPlans.length > 0 ? planningFlow.sfxEventPlans : mockSFXEventPlans).slice(0, 4)
  const providerRoutes = planningFlow.providerRoutes.length > 0 ? planningFlow.providerRoutes : mockSFXProviderRoutes
  const timingResult = timingFlow.flows[0]
  const mixResult = mixFlow.flows[0]
  const qaPassResult = qaFlow.flows.find((flow) => flow.qaReport.status === 'passed') ?? qaFlow.flows[0]
  const qaWarningResult = qaFlow.flows.find((flow) => flow.qaReport.issues.length > 0) ?? qaFlow.flows[1] ?? qaPassResult
  const libraryResult = libraryFlow.flows.find((flow) => flow.libraryCandidate) ?? libraryFlow.flows[0]

  return {
    projectIntegration: {
      statusSummary: projectFlow.statusSummary,
      providerRouteSummary: projectFlow.sfxIntegration.providerRouteSummary,
      eventCount: projectFlow.sfxIntegration.sfxEventPlans.length,
      generationRequestCount: projectFlow.sfxIntegration.generationRequests.length,
      queuedJobCount: projectFlow.sfxIntegration.jobQueueItems.filter((item) => item.queueStatus === 'queued').length,
      qaPassedCount: projectFlow.qaReports.filter((report) => report.status === 'passed' || report.approvedForProject).length,
    },
    directorPlan: createDirectorPlan(eventPlans, providerRoutes),
    eventPlans,
    providerRoute: providerRoutes[0] ?? mockSFXProviderRoutes[0],
    promptPlan: promptFlow.sfxPromptPlans[0] ?? mockSFXPromptPlans[0],
    generatedAsset: timingResult?.generatedAsset ?? mockSFXGeneratedAssets[0],
    trimPlan: timingResult?.trimPlan ?? mockSFXTrimPlans[0],
    timingAlignment: timingResult?.timingAlignment ?? mockSFXTimingAlignments[0],
    timingValidation: timingResult?.validation,
    mixPlan: mixResult?.mixPlan ?? mockSFXMixPlans[0],
    mixWarnings: mixResult?.warnings ?? [],
    qaReport: qaPassResult?.qaReport ?? mockSFXQAReports[0],
    warningQAReport: qaWarningResult?.qaReport ?? mockSFXQAReports[1] ?? mockSFXQAReports[0],
    libraryCandidate: libraryResult?.libraryCandidate ?? mockSFXLibraryCandidates[0],
    creditEstimate: createCreditEstimate(eventPlans, providerRoutes),
    progressSteps: [
      'Reading SFX event plan',
      'Checking internal library',
      'Preparing provider prompt',
      'Waiting for credit approval',
      'Mock generating SFX',
      'Analyzing waveform',
      'Trimming best region',
      'Aligning hit point',
      'Creating mix plan',
      'Running QA',
      'Storing project asset',
      'Evaluating library candidate',
    ],
  }
}
