import type { ProjectEditBriefQAOrchestratorResult } from '../../types/project-edit-brief-qa'
import { createMockProjectEditBriefFixtureBundle } from '../../lib/mock-project-edit-briefs'
import {
  PROJECT_EDIT_BRIEF_QA_SAFETY_FLAGS,
  createProjectEditBriefQAPackage,
  createProjectEditBriefQADebugSummary,
  runProjectEditBriefMarkerQA,
} from '../../lib/project-edit-brief-qa-rules'
import {
  validateNoProjectEditBriefQASideEffects,
  validateProjectEditBriefQAPackage,
} from '../project-edit-brief-qa/project-edit-brief-qa-validation-service'

function baseResult(partial: Partial<ProjectEditBriefQAOrchestratorResult>): ProjectEditBriefQAOrchestratorResult {
  return {
    findings: partial.findings ?? [],
    conflicts: partial.conflicts ?? [],
    validation: partial.validation ?? validateNoProjectEditBriefQASideEffects({ ...PROJECT_EDIT_BRIEF_QA_SAFETY_FLAGS }),
    summary: partial.summary ?? 'Mock Project Edit Brief QA flow completed.',
    warnings: partial.warnings ?? ['No planner application, media processing, render, provider, worker, credit, or Supabase action occurred.'],
    nextStep: 'RP-EDITBRIEF-11 — Apply Brief Markers to Edit Plan',
    mockOnly: true,
    ...PROJECT_EDIT_BRIEF_QA_SAFETY_FLAGS,
    ...partial,
  }
}

function fixtureBundle() {
  return createMockProjectEditBriefFixtureBundle().bundles.find((bundle) => bundle.markers.length > 0)
    ?? createMockProjectEditBriefFixtureBundle().bundles[0]
}

export function runMockProjectEditBriefQAFlow(): ProjectEditBriefQAOrchestratorResult {
  const bundle = fixtureBundle()
  const qaPackage = createProjectEditBriefQAPackage({ bundle })
  return baseResult({
    qaPackage,
    findings: qaPackage.findings,
    conflicts: qaPackage.markerPackages.flatMap((markerPackage) => markerPackage.conflictRecords),
    validation: validateProjectEditBriefQAPackage(qaPackage),
    summary: createProjectEditBriefQADebugSummary(qaPackage),
  })
}

export function runMockMarkerQAPassedFlow(): ProjectEditBriefQAOrchestratorResult {
  const bundle = fixtureBundle()
  const marker = bundle.markers.find((candidate) => candidate.qaStatus === 'passed') ?? bundle.markers[0]
  const markerPackage = runProjectEditBriefMarkerQA({
    marker,
    allMarkers: [marker],
    attachments: bundle.attachments,
    intent: bundle.intents.find((intent) => intent.markerId === marker.id),
    exportSettings: bundle.exportSettings,
  })
  return baseResult({
    markerPackage,
    findings: markerPackage.findings,
    conflicts: markerPackage.conflictRecords,
    summary: markerPackage.recommendedNextAction,
  })
}

export function runMockMissingAssetQAFlow(): ProjectEditBriefQAOrchestratorResult {
  const bundle = fixtureBundle()
  const marker = {
    ...bundle.markers[0],
    id: 'mock-missing-broll-marker',
    markerType: 'broll' as const,
    title: 'Missing B-roll',
    userNote: 'Add B-roll here',
  }
  const markerPackage = runProjectEditBriefMarkerQA({
    marker,
    allMarkers: [marker],
    attachments: [],
    intent: undefined,
    exportSettings: bundle.exportSettings,
  })
  return baseResult({ markerPackage, findings: markerPackage.findings, conflicts: markerPackage.conflictRecords })
}

export function runMockOverlapConflictQAFlow(): ProjectEditBriefQAOrchestratorResult {
  const bundle = fixtureBundle()
  const base = bundle.markers[0]
  const cut = { ...base, id: 'mock-cut-conflict', markerType: 'cut_remove' as const, title: 'Cut this range', startTimeSeconds: 10, endTimeSeconds: 20, timeMode: 'range' as const }
  const broll = { ...base, id: 'mock-broll-conflict', markerType: 'broll' as const, title: 'Add B-roll here', startTimeSeconds: 12, endTimeSeconds: 18, timeMode: 'range' as const }
  const markerPackage = runProjectEditBriefMarkerQA({
    marker: cut,
    allMarkers: [cut, broll],
    attachments: [],
    intent: undefined,
    exportSettings: bundle.exportSettings,
  })
  return baseResult({ markerPackage, findings: markerPackage.findings, conflicts: markerPackage.conflictRecords })
}

export function runMockAudioConflictQAFlow(): ProjectEditBriefQAOrchestratorResult {
  const bundle = fixtureBundle()
  const base = bundle.markers[0]
  const noMusic = { ...base, id: 'mock-no-music-marker', markerType: 'general_note' as const, title: 'No music', userNote: 'No music in this section', startTimeSeconds: 10, endTimeSeconds: 20, timeMode: 'range' as const }
  const music = { ...base, id: 'mock-music-marker', markerType: 'music_soundtrack' as const, title: 'Add music', userNote: 'Add music here', startTimeSeconds: 12, endTimeSeconds: 18, timeMode: 'range' as const }
  const markerPackage = runProjectEditBriefMarkerQA({
    marker: noMusic,
    allMarkers: [noMusic, music],
    attachments: [],
    intent: undefined,
    exportSettings: bundle.exportSettings,
  })
  return baseResult({ markerPackage, findings: markerPackage.findings, conflicts: markerPackage.conflictRecords })
}

export function runMockCopyRiskQAFlow(): ProjectEditBriefQAOrchestratorResult {
  const bundle = fixtureBundle()
  const marker = {
    ...bundle.markers[0],
    id: 'mock-copy-risk-marker',
    title: 'Copy exact reference',
    userNote: 'Copy this exact reference shot for shot.',
  }
  const markerPackage = runProjectEditBriefMarkerQA({
    marker,
    allMarkers: [marker],
    attachments: [],
    intent: undefined,
    exportSettings: bundle.exportSettings,
  })
  return baseResult({ markerPackage, findings: markerPackage.findings, conflicts: markerPackage.conflictRecords })
}

export function runMockExportWarningQAFlow(): ProjectEditBriefQAOrchestratorResult {
  const bundle = fixtureBundle()
  const marker = {
    ...bundle.markers[0],
    id: 'mock-caption-warning-marker',
    markerType: 'caption_text' as const,
    title: 'Add captions',
    userNote: 'Add caption-heavy text here.',
  }
  const exportSettings = bundle.exportSettings ? { ...bundle.exportSettings, captionSafeArea: false } : undefined
  const markerPackage = runProjectEditBriefMarkerQA({
    marker,
    allMarkers: [marker],
    attachments: [],
    intent: undefined,
    exportSettings,
  })
  return baseResult({ markerPackage, findings: markerPackage.findings, conflicts: markerPackage.conflictRecords })
}

export function runMockBriefQAPackageFlow(): ProjectEditBriefQAOrchestratorResult {
  return runMockProjectEditBriefQAFlow()
}

export function runMockQAValidationFlow(): ProjectEditBriefQAOrchestratorResult {
  const validation = validateNoProjectEditBriefQASideEffects({ ...PROJECT_EDIT_BRIEF_QA_SAFETY_FLAGS })
  return baseResult({ validation, summary: 'QA validation flow passed with all side-effect flags false.' })
}

export function runMockQAReadinessFlow(): ProjectEditBriefQAOrchestratorResult {
  const result = runMockProjectEditBriefQAFlow()
  return baseResult({
    ...result,
    summary: result.qaPackage?.readableSummary ?? result.summary,
  })
}
