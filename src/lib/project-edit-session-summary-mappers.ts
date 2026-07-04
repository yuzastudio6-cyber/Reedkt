import type {
  ProjectEditSessionFixtureBundle,
  ProjectEditSessionMemoryRecord,
  ProjectEditSessionPreviewRecord,
  ProjectEditSessionRecord,
  ProjectEditSessionRevisionRecord,
  ProjectEditSessionVersionRecord,
} from '../types/project-edit-session'
import {
  createProjectEditSessionBundleSummary,
  createProjectEditSessionLatestActivitySummary,
} from './project-edit-session-fixture-mappers'

export function createProjectEditSessionReadableSummary(
  session: ProjectEditSessionRecord,
): string {
  const dna = session.preferenceDNAApplicationId
    ? `${session.dnaStatusLabel ?? 'Preference DNA applied'}; ${session.dnaQAStatusLabel ?? 'QA pending'}`
    : 'No Preference DNA package attached'
  return `${session.name} is a ${session.aspectRatio} ${session.platformTarget.replace(/_/g, ' ')} Edit Chat with status ${session.status.replace(/_/g, ' ')}. ${dna}.`
}

export function createProjectEditSessionMemorySummary(
  memories: ProjectEditSessionMemoryRecord[],
): string {
  if (memories.length === 0) return 'No Edit Chat memory fixture records.'
  return memories
    .map((memory) => `${memory.layer.replace(/_/g, ' ')}: ${memory.summary}`)
    .join(' | ')
}

export function createProjectEditSessionVersionSummary(
  versions: ProjectEditSessionVersionRecord[],
): string {
  if (versions.length === 0) return 'No Edit Chat version fixture records.'
  return versions
    .map((version) => `v${version.versionNumber} ${version.status.replace(/_/g, ' ')}: ${version.summary}`)
    .join(' | ')
}

export function createProjectEditSessionPreviewSummary(
  previews: ProjectEditSessionPreviewRecord[],
): string {
  if (previews.length === 0) return 'No Edit Chat preview fixture records.'
  return previews
    .map((preview) => `${preview.status.replace(/_/g, ' ')} ${preview.aspectRatio}${preview.previewUrl ? ' with mock preview URL' : ' placeholder only'}`)
    .join(' | ')
}

export function createProjectEditSessionRevisionSummary(
  revisions: ProjectEditSessionRevisionRecord[],
): string {
  if (revisions.length === 0) return 'No revision requested for this Edit Chat.'
  return revisions
    .map((revision) => `${revision.summary} Approval reset: ${revision.resetsApproval ? 'yes' : 'no'}.`)
    .join(' | ')
}

export function createProjectEditSessionDebugSummary(
  bundle: ProjectEditSessionFixtureBundle,
): {
  readable: string[]
  latestActivity: string[]
  memoryLayers: string[]
  bundleSummary: ReturnType<typeof createProjectEditSessionBundleSummary>
  warnings: string[]
} {
  const bundleSummary = createProjectEditSessionBundleSummary(bundle)
  const warnings = [
    bundleSummary.mockOnly ? undefined : 'One or more fixture records are not mockOnly.',
    bundleSummary.sessionCount < 10 ? 'Fixture bundle has fewer than 10 sessions.' : undefined,
    bundleSummary.dnaBackedCount === 0 ? 'No DNA-backed fixture session found.' : undefined,
    bundleSummary.legacyNoDnaCount === 0 ? 'No legacy no-DNA fixture session found.' : undefined,
  ].filter((warning): warning is string => Boolean(warning))

  return {
    readable: bundle.sessions.map(createProjectEditSessionReadableSummary),
    latestActivity: bundle.sessions.map((session) =>
      createProjectEditSessionLatestActivitySummary(session, bundle.messages, bundle.events),
    ),
    memoryLayers: Array.from(new Set(bundle.memories.map((memory) => memory.layer))).sort(),
    bundleSummary,
    warnings,
  }
}
