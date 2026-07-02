import type { ProjectEditBriefQAFinding } from '../../types/project-edit-brief-qa'
import {
  createProjectEditBriefQAFinding,
  createProjectEditBriefMarkerQAReadableSummary,
  runProjectEditBriefMarkerQA,
} from '../../lib/project-edit-brief-qa-rules'

export {
  createProjectEditBriefQAFinding as createProjectEditBriefMarkerQAFinding,
  runProjectEditBriefMarkerQA,
}

export function runProjectEditBriefMarkersQA(
  inputs: Parameters<typeof runProjectEditBriefMarkerQA>[0][],
) {
  return inputs.map((input) => runProjectEditBriefMarkerQA(input))
}

export function createProjectEditBriefMarkerQASummary(input: {
  markerTitle: string
  findings: ProjectEditBriefQAFinding[]
  qaStatus: string
}): string {
  return createProjectEditBriefMarkerQAReadableSummary({
    markerId: 'summary-marker',
    markerTitle: input.markerTitle,
    qaStatus: input.qaStatus as never,
    readinessStatus: 'needs_user_review',
    findings: input.findings,
    conflictRecords: [],
    recommendedNextAction: 'Review marker QA findings.',
    mockOnly: true,
    warnings: [],
    providerCallMade: false,
    modelCallMade: false,
    qwenCallMade: false,
    deepSeekCallMade: false,
    embeddingsUsed: false,
    vectorDbUsed: false,
    soundRuntimeStarted: false,
    dockerCommandRun: false,
    supabaseReadMade: false,
    supabaseWriteMade: false,
    storageReadMade: false,
    storageWriteMade: false,
    signedUrlCreated: false,
    fileBytesRead: false,
    externalUrlFetched: false,
    mediaProcessingStarted: false,
    workerJobCreated: false,
    generationRequestCreated: false,
    renderJobCreated: false,
    exportJobCreated: false,
    progressStarted: false,
    creditReservedOrSpent: false,
  })
}
