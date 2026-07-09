import { existsSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { basename, extname, join, resolve } from 'node:path'
import {
  reviewInternalTestingInternalTesterReviewPanel,
} from './internal-testing-internal-tester-review-panel'
import type {
  InternalTestingWorkerPayloadDryRunInput,
} from './internal-testing-worker-payload-dry-run'

export const INTERNAL_TESTING_REAL_VIDEO_ACCEPTANCE_PREFLIGHT_DECISION =
  'internal_testing_real_video_acceptance_preflight_passed_ready_for_backend_local_upload_acceptance'

export const INTERNAL_TESTING_REAL_VIDEO_FIXTURE_DISPLAY_PATH =
  'Documents/test video/internal testing.MP4'

export type InternalTestingRealVideoAcceptancePreflightStatus =
  | 'passed_ready_for_backend_local_upload_acceptance'
  | 'blocked_by_internal_tester_review_panel_gate'
  | 'blocked_by_missing_real_video_fixture'
  | 'blocked_by_real_video_fixture_safety'

export interface InternalTestingRealVideoAcceptancePreflightInput extends InternalTestingWorkerPayloadDryRunInput {
  fixturePath?: string
}

export interface InternalTestingRealVideoAcceptancePreflightResult {
  decision: typeof INTERNAL_TESTING_REAL_VIDEO_ACCEPTANCE_PREFLIGHT_DECISION
  status: InternalTestingRealVideoAcceptancePreflightStatus
  source: 'internal_tester_review_panel_and_local_fixture_stat'
  workspaceId: string
  projectId: string
  editSessionId: string
  fixture: {
    displayPath: typeof INTERNAL_TESTING_REAL_VIDEO_FIXTURE_DISPLAY_PATH
    exists: boolean
    isFile: boolean
    basename: 'internal testing.MP4' | string
    extension: '.MP4' | string
    sizeBytes: number
    readableForPreflight: boolean
    fileBytesRead: false
    mediaDecoded: false
    uploaded: false
  }
  nextAction: 'run_backend_local_upload_acceptance' | 'resolve_real_video_preflight_blockers'
  blockers: readonly string[]
  checklist: readonly {
    id: 'fixture_exists' | 'fixture_is_mp4' | 'fixture_non_empty' | 'no_media_processing' | 'backend_local_upload_next'
    label: string
    status: 'passed' | 'blocked'
    summary: string
  }[]
  productReady: false
  blockedScope: {
    frontendToolExecution: false
    rawPromptExecution: false
    publicOrSignedUrlArtifacts: false
    serviceRoleBrowserAccess: false
    providerOrModelCalls: false
    workerDispatch: false
    realWorkerExecution: false
    toolExecution: false
    mediaProcessing: false
    renderOrExport: false
    generatedMediaArtifacts: false
    creditSpend: false
    ledgerWrites: false
    supabaseWrites: false
    uploadStarted: false
    fileBytesRead: false
    externalBeta: false
    paidProduction: false
    productReady: false
  }
}

export function getDefaultInternalTestingRealVideoFixturePath(): string {
  return resolve(process.env.REEDITPRO_INTERNAL_TESTING_REAL_VIDEO_PATH?.trim() || join(homedir(), INTERNAL_TESTING_REAL_VIDEO_FIXTURE_DISPLAY_PATH))
}

export function reviewInternalTestingRealVideoAcceptancePreflight(
  input: InternalTestingRealVideoAcceptancePreflightInput,
): InternalTestingRealVideoAcceptancePreflightResult {
  const panel = reviewInternalTestingInternalTesterReviewPanel(input)
  if (panel.status !== 'passed_ready_for_real_video_acceptance_preflight') {
    return buildResult(input, fixtureReview(input.fixturePath), 'blocked_by_internal_tester_review_panel_gate', panel.blockers)
  }

  const fixture = fixtureReview(input.fixturePath)
  const blockers = fixtureBlockers(fixture)
  return buildResult(
    input,
    fixture,
    blockers.length === 0 ? 'passed_ready_for_backend_local_upload_acceptance' : fixture.exists ? 'blocked_by_real_video_fixture_safety' : 'blocked_by_missing_real_video_fixture',
    blockers,
  )
}

function fixtureReview(pathOverride?: string): InternalTestingRealVideoAcceptancePreflightResult['fixture'] {
  const fixturePath = pathOverride?.trim() ? resolve(pathOverride) : getDefaultInternalTestingRealVideoFixturePath()
  const name = basename(fixturePath)
  const extension = extname(fixturePath)

  if (!existsSync(fixturePath)) {
    return {
      displayPath: INTERNAL_TESTING_REAL_VIDEO_FIXTURE_DISPLAY_PATH,
      exists: false,
      isFile: false,
      basename: name,
      extension,
      sizeBytes: 0,
      readableForPreflight: false,
      fileBytesRead: false,
      mediaDecoded: false,
      uploaded: false,
    }
  }

  const stats = statSync(fixturePath)
  return {
    displayPath: INTERNAL_TESTING_REAL_VIDEO_FIXTURE_DISPLAY_PATH,
    exists: true,
    isFile: stats.isFile(),
    basename: name,
    extension,
    sizeBytes: stats.size,
    readableForPreflight: stats.isFile() && stats.size > 0,
    fileBytesRead: false,
    mediaDecoded: false,
    uploaded: false,
  }
}

function fixtureBlockers(fixture: InternalTestingRealVideoAcceptancePreflightResult['fixture']): string[] {
  const blockers: string[] = []
  if (!fixture.exists) blockers.push('real_video_fixture_missing')
  if (!fixture.isFile) blockers.push('real_video_fixture_not_file')
  if (fixture.basename !== 'internal testing.MP4') blockers.push('real_video_fixture_unexpected_name')
  if (fixture.extension.toLowerCase() !== '.mp4') blockers.push('real_video_fixture_not_mp4')
  if (fixture.sizeBytes <= 0) blockers.push('real_video_fixture_empty')
  if (!fixture.readableForPreflight) blockers.push('real_video_fixture_not_readable_for_preflight')
  return blockers
}

function buildResult(
  input: InternalTestingRealVideoAcceptancePreflightInput,
  fixture: InternalTestingRealVideoAcceptancePreflightResult['fixture'],
  status: InternalTestingRealVideoAcceptancePreflightStatus,
  blockers: readonly string[],
): InternalTestingRealVideoAcceptancePreflightResult {
  const passed = status === 'passed_ready_for_backend_local_upload_acceptance'
  return {
    decision: INTERNAL_TESTING_REAL_VIDEO_ACCEPTANCE_PREFLIGHT_DECISION,
    status,
    source: 'internal_tester_review_panel_and_local_fixture_stat',
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    fixture,
    nextAction: passed ? 'run_backend_local_upload_acceptance' : 'resolve_real_video_preflight_blockers',
    blockers,
    checklist: [
      {
        id: 'fixture_exists',
        label: 'Fixture exists',
        status: fixture.exists && fixture.isFile ? 'passed' : 'blocked',
        summary: 'The requested internal testing video is present as a local file.',
      },
      {
        id: 'fixture_is_mp4',
        label: 'Fixture is MP4',
        status: fixture.extension.toLowerCase() === '.mp4' && fixture.basename === 'internal testing.MP4' ? 'passed' : 'blocked',
        summary: 'The fixture matches the expected internal testing MP4 filename.',
      },
      {
        id: 'fixture_non_empty',
        label: 'Fixture is non-empty',
        status: fixture.sizeBytes > 0 && fixture.readableForPreflight ? 'passed' : 'blocked',
        summary: 'The fixture has a non-zero size and can move to backend-local upload acceptance.',
      },
      {
        id: 'no_media_processing',
        label: 'No media processing',
        status: fixture.fileBytesRead === false && fixture.mediaDecoded === false && fixture.uploaded === false ? 'passed' : 'blocked',
        summary: 'This preflight uses filesystem metadata only; it does not upload, decode, probe, render, or edit the file.',
      },
      {
        id: 'backend_local_upload_next',
        label: 'Backend-local upload next',
        status: passed ? 'passed' : 'blocked',
        summary: 'The next gate may run the existing backend-local upload acceptance flow with the fixture.',
      },
    ],
    productReady: false,
    blockedScope: blockedScope(),
  }
}

function blockedScope(): InternalTestingRealVideoAcceptancePreflightResult['blockedScope'] {
  return {
    frontendToolExecution: false,
    rawPromptExecution: false,
    publicOrSignedUrlArtifacts: false,
    serviceRoleBrowserAccess: false,
    providerOrModelCalls: false,
    workerDispatch: false,
    realWorkerExecution: false,
    toolExecution: false,
    mediaProcessing: false,
    renderOrExport: false,
    generatedMediaArtifacts: false,
    creditSpend: false,
    ledgerWrites: false,
    supabaseWrites: false,
    uploadStarted: false,
    fileBytesRead: false,
    externalBeta: false,
    paidProduction: false,
    productReady: false,
  }
}
