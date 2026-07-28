import type {
  TargetVideoUnderstandingPackage,
  TargetVideoUnderstandingSchedule,
} from '../types/edit-reference-target-video-understanding'

export type EditReferenceTargetStudyUiState =
  | 'checking'
  | 'not_started'
  | 'starting'
  | 'studying'
  | 'waiting'
  | 'review_required'
  | 'ready'
  | 'cancelled'
  | 'error'

export type EditReferenceTargetStudyUiTone = 'neutral' | 'progress' | 'warning' | 'error' | 'success'

export type EditReferenceTargetStudyLifecycle =
  | { kind: 'checking' }
  | { kind: 'not_started' }
  | { kind: 'starting' }
  | {
      kind: 'package'
      package: TargetVideoUnderstandingPackage
      schedule: TargetVideoUnderstandingSchedule
    }
  | { kind: 'error'; message: string }

export interface EditReferenceTargetStudyUiView {
  state: EditReferenceTargetStudyUiState
  tone: EditReferenceTargetStudyUiTone
  statusLabel: string
  title: string
  description: string
  progressPercent?: number
  progressLabel?: string
  coverageLabel?: string
  etaLabel?: string
  sourceLabel?: string
  sectionLabel?: string
  recoveryLabel?: string
  safetyLabel?: string
  announcementRole: 'status' | 'alert'
  announcementAriaLive: 'polite' | 'assertive'
  readyForPreferenceApplication: boolean
  primaryAction: 'start' | 'retry' | null
}

export function createEditReferenceTargetStudyUiView(
  lifecycle: EditReferenceTargetStudyLifecycle,
): EditReferenceTargetStudyUiView {
  if (lifecycle.kind === 'checking') {
    return {
      state: 'checking',
      tone: 'neutral',
      statusLabel: 'Checking saved study',
      title: 'Understanding this video',
      description: 'ReEditPro is checking for verified work already saved for this exact source and Edit Brief.',
      announcementRole: 'status',
      announcementAriaLive: 'polite',
      readyForPreferenceApplication: false,
      primaryAction: null,
    }
  }

  if (lifecycle.kind === 'not_started') {
    return {
      state: 'not_started',
      tone: 'neutral',
      statusLabel: 'Ready to study',
      title: 'Understand this video before adapting the reference',
      description: 'ReEditPro will study the complete target video and use its real story, visuals, speech, audio, captions, color, and graphics needs when adapting the selected Edit Reference.',
      recoveryLabel: 'Long videos are studied in checkpointed sections. You can leave and return without losing completed work.',
      safetyLabel: 'The original stays unchanged. A smaller analysis copy is used when needed; file size does not reduce planned coverage.',
      announcementRole: 'status',
      announcementAriaLive: 'polite',
      readyForPreferenceApplication: false,
      primaryAction: 'start',
    }
  }

  if (lifecycle.kind === 'starting') {
    return {
      state: 'starting',
      tone: 'progress',
      statusLabel: 'Preparing study',
      title: 'Understanding this video',
      description: 'ReEditPro is verifying the saved source and preparing recoverable study sections.',
      recoveryLabel: 'This can continue for minutes or hours without keeping this page open.',
      safetyLabel: 'No reference guidance is applied until the complete target study is verified.',
      announcementRole: 'status',
      announcementAriaLive: 'polite',
      readyForPreferenceApplication: false,
      primaryAction: null,
    }
  }

  if (lifecycle.kind === 'error') {
    return {
      state: 'error',
      tone: 'error',
      statusLabel: 'Needs attention',
      title: 'Study could not be refreshed',
      description: lifecycle.message,
      recoveryLabel: 'Any completed checkpoints remain saved. Retrying does not restart verified work.',
      announcementRole: 'alert',
      announcementAriaLive: 'assertive',
      readyForPreferenceApplication: false,
      primaryAction: 'retry',
    }
  }

  return viewFromPackage(lifecycle.package, lifecycle.schedule)
}

export function isTargetVideoUnderstandingReadyForUi(
  packageRecord: TargetVideoUnderstandingPackage,
): boolean {
  return packageRecord.status === 'ready'
    && packageRecord.study.state === 'completed'
    && packageRecord.study.progressPercent === 100
    && packageRecord.study.temporalCoverageRatio === 1
    && packageRecord.study.continuousAudioCoverageRatio === 1
    && packageRecord.readyForPreferenceApplication === true
    && packageRecord.runtimeProvenance.everyRequiredOutputVerified === true
    && packageRecord.runtimeProvenance.everySemanticRuntimeAuthoritative === true
    && packageRecord.runtimeProvenance.everyRequiredOutputCostAuthoritySatisfied === true
    && packageRecord.runtimeProvenance.coverageQaPassed === true
    && Boolean(packageRecord.runtimeProvenance.completionAttestationDigestSha256)
    && !packageRecord.limitations.some((limitation) => limitation.blocking)
    && !packageRecord.missingEvidence.some((evidence) => evidence.blocking)
}

export function shouldPollTargetVideoUnderstandingForUi(
  packageRecord: TargetVideoUnderstandingPackage,
  schedule: TargetVideoUnderstandingSchedule,
): boolean {
  if (isTargetVideoUnderstandingReadyForUi(packageRecord)) return false
  if (schedule.waitingForSpecialistRuntime) return false
  if (!schedule.scheduled && !schedule.alreadyActive) return false
  if (packageRecord.status !== 'collecting') return false
  return ['queued', 'running', 'paused'].includes(packageRecord.study.state)
}

export function safeTargetVideoStudyError(message: string): string {
  const normalized = message.trim().replace(/\s+/g, ' ')
  if (/brief|digest|version|frame|platform|edit level|different target|different source/i.test(normalized)) {
    return 'The source, Edit Brief, or edit settings changed. Refresh this edit before starting the study again.'
  }
  if (/not finalized|integrity|private target video|source media/i.test(normalized)) {
    return 'Finish the private source upload and save the Edit Brief before starting the study.'
  }
  if (/access|auth|workspace|owner|permission/i.test(normalized)) {
    return 'This video study is not available in the current workspace. Reopen the edit from the workspace that owns it.'
  }
  return 'ReEditPro could not refresh the video study right now. Completed work remains safe; try again.'
}

function viewFromPackage(
  packageRecord: TargetVideoUnderstandingPackage,
  schedule: TargetVideoUnderstandingSchedule,
): EditReferenceTargetStudyUiView {
  const ready = isTargetVideoUnderstandingReadyForUi(packageRecord)
  const progressPercent = clampPercent(packageRecord.study.progressPercent)
  const common = {
    progressPercent,
    progressLabel: `${progressPercent}% · ${packageRecord.study.completedWorkItemCount} of ${packageRecord.study.totalWorkItemCount} study steps complete`,
    coverageLabel: `${formatPercent(packageRecord.study.temporalCoverageRatio * 100)} timeline coverage`,
    etaLabel: ready
      ? 'Complete study verified'
      : schedule.waitingForSpecialistRuntime
        ? undefined
        : `Estimated time remaining: ${formatStudyEtaRange(
          packageRecord.study.etaLowerRemainingSeconds,
          packageRecord.study.etaUpperRemainingSeconds,
        )}`,
    sourceLabel: `${formatStudyDuration(packageRecord.source.durationSeconds)} source · ${formatStudyBytes(packageRecord.source.sizeBytes)} original`,
    sectionLabel: `${packageRecord.study.chunkCount} checkpointed section${packageRecord.study.chunkCount === 1 ? '' : 's'}`,
    recoveryLabel: 'Completed sections are saved after every verified step. Leaving or reloading does not discard them.',
    safetyLabel: 'The original stays unchanged. ReEditPro studies a smaller analysis copy in bounded sections and reconciles them as one story.',
    announcementRole: 'status' as const,
    announcementAriaLive: 'polite' as const,
  }

  if (ready) {
    return {
      ...common,
      state: 'ready',
      tone: 'success',
      statusLabel: 'Study verified',
      title: 'This video is understood',
      description: 'The complete target study passed coverage and quality checks. The selected Edit Reference can now be adapted to this video without copying its source content.',
      readyForPreferenceApplication: true,
      primaryAction: null,
    }
  }

  if (
    packageRecord.status === 'needs_operator_review'
    || packageRecord.status === 'review_required'
    || packageRecord.study.state === 'needs_operator_review'
  ) {
    return {
      ...common,
      state: 'review_required',
      tone: 'warning',
      statusLabel: 'Recovery review needed',
      title: 'Completed study work is safe',
      description: 'A recovery review is required before the remaining sections can continue. Return to Chat to review what needs attention; ReEditPro will not discard the source or silently start over.',
      readyForPreferenceApplication: false,
      primaryAction: null,
    }
  }

  if (packageRecord.status === 'cancelled' || packageRecord.study.state === 'cancelled') {
    return {
      ...common,
      state: 'cancelled',
      tone: 'warning',
      statusLabel: 'Study stopped',
      title: 'Completed study work is retained',
      description: 'This study is not complete, so no Edit Reference guidance can be adapted yet. Return to Chat to confirm the source and request a new study.',
      readyForPreferenceApplication: false,
      primaryAction: null,
    }
  }

  if (packageRecord.study.state === 'completed') {
    return {
      ...common,
      state: 'review_required',
      tone: 'warning',
      statusLabel: 'Study review needed',
      title: 'The study finished but is not verified',
      description: 'The planned study steps finished, but required evidence or whole-story coverage did not pass final checks. Return to Chat to review what is missing before adaptation.',
      readyForPreferenceApplication: false,
      primaryAction: null,
    }
  }

  if (schedule.waitingForSpecialistRuntime) {
    return {
      ...common,
      state: 'waiting',
      tone: 'warning',
      statusLabel: 'Specialist runtime needed',
      title: 'Technical study saved; specialist analysis is not connected',
      description: 'ReEditPro completed the available private technical stages. Speech transcription, visible-text analysis, semantic synthesis, whole-story reconciliation, and coverage QA will continue only after the approved specialist GPU and model runtime is connected.',
      recoveryLabel: 'All completed technical checkpoints are saved. Connecting the specialist runtime continues this exact study instead of starting over.',
      safetyLabel: 'No Edit Reference adaptation, generation, rendering, or credit use starts from this partial study.',
      readyForPreferenceApplication: false,
      primaryAction: null,
    }
  }

  if (packageRecord.study.state === 'queued' || packageRecord.study.state === 'paused') {
    return {
      ...common,
      state: 'waiting',
      tone: 'progress',
      statusLabel: packageRecord.study.state === 'queued' ? 'Queued safely' : 'Checkpoint saved',
      title: packageRecord.study.state === 'queued' ? 'Target study is queued' : 'Target study is safely waiting',
      description: packageRecord.study.state === 'queued'
        ? 'The exact source and Edit Brief are bound. Study begins when the next analysis section is available.'
        : 'No study step is running right now. ReEditPro will continue from completed work instead of starting over.',
      readyForPreferenceApplication: false,
      primaryAction: null,
    }
  }

  return {
    ...common,
    state: 'studying',
    tone: 'progress',
    statusLabel: 'Studying complete video',
    title: 'Understanding this video',
    description: packageRecord.study.durationClass === 'extended'
      ? 'ReEditPro is studying this multi-hour video section by section, then reconciling the complete story before adaptation.'
      : 'ReEditPro is studying the full timeline, not only a sample, and saving each verified section as it completes.',
    readyForPreferenceApplication: false,
    primaryAction: null,
  }
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(100, Math.max(0, Math.round(value)))
}

function formatPercent(value: number): string {
  return `${clampPercent(value)}%`
}

function formatStudyDuration(seconds: number): string {
  const totalMinutes = Math.max(1, Math.round(seconds / 60))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) return `${totalMinutes} min`
  return minutes === 0 ? `${hours} hr` : `${hours} hr ${minutes} min`
}

function formatStudyBytes(bytes: number): string {
  const gib = bytes / (1024 ** 3)
  if (gib >= 1) return `${gib >= 10 ? Math.round(gib) : gib.toFixed(1)} GB`
  const mib = bytes / (1024 ** 2)
  return `${mib >= 10 ? Math.round(mib) : mib.toFixed(1)} MB`
}

function formatStudyEtaRange(lowerSeconds: number, upperSeconds: number): string {
  if (upperSeconds <= 0) return 'final verification'
  const lower = formatEtaValue(Math.max(0, lowerSeconds))
  const upper = formatEtaValue(Math.max(lowerSeconds, upperSeconds))
  return lower === upper ? lower : `${lower}–${upper}`
}

function formatEtaValue(seconds: number): string {
  if (seconds < 60) return 'under 1 min'
  const minutes = Math.ceil(seconds / 60)
  if (minutes < 60) return `${minutes} min`
  const hours = Math.ceil(minutes / 60)
  return `${hours} hr`
}
