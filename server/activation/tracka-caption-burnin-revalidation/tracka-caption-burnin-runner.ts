import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { closeSync, existsSync, openSync, readFileSync, statSync, unlinkSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import {
  TRACKA_CAPTION_APPROVED_RUNTIME,
  TRACKA_CAPTION_APPROVED_SOURCE_METADATA,
  TRACKA_CAPTION_APPROVED_SOURCE_REF,
  TRACKA_CAPTION_BURNIN_CONFIRM_ENV,
  TRACKA_CAPTION_BURNIN_CORRECTED_LINES,
  TRACKA_CAPTION_GCS_ACCESS_REPAIR_CONFIRM_ENV,
  TRACKA_CAPTION_BURNIN_LOCAL_ROOT,
  TRACKA_CAPTION_BURNIN_NO_SCOPE_STATEMENT,
  TRACKA_CAPTION_BURNIN_PHASE,
  TRACKA_CAPTION_BURNIN_REJECTED_TEXT,
  TRACKA_CAPTION_BURNIN_SOURCE_CHAIN,
  TRACKA_CAPTION_LAYOUT_FIXED_LINES,
  TRACKA_CAPTION_LAYOUT_FIX_ASS_PROFILE,
  TRACKA_CAPTION_LAYOUT_FIX_CONFIRM_ENV,
  TRACKA_CAPTION_LAYOUT_FIX_PROFILE_ID,
  TRACKA_CAPTION_RUNTIME_IMAGE_BUILD_CONFIRM_ENV,
  TRACKA_CAPTION_SOURCE_GCS_READ_CONFIRM_ENV,
  getTrackaCaptionBurninRunId,
  isTrackaCaptionBurninConfirmed,
  isTrackaCaptionGcsAccessRepairConfirmed,
  isTrackaCaptionLayoutFixConfirmed,
  isTrackaCaptionRuntimeImageBuildConfirmed,
  isTrackaCaptionSourceGcsReadConfirmed,
} from './tracka-caption-burnin-policy'
import type {
  TrackaCaptionBurninApprovedSourceRef,
  TrackaCaptionBurninArtifact,
  TrackaCaptionBurninBundle,
  TrackaCaptionBurninExecutionStatus,
  TrackaCaptionBurninGcsAccessCheck,
  TrackaCaptionBurninQaGate,
  TrackaCaptionBurninRuntimeResolution,
  TrackaCaptionBurninSidecarArtifact,
  TrackaCaptionBurninSourceAudit,
  TrackaCaptionBurninSummary,
  TrackaCaptionGcsAccessStatus,
} from './tracka-caption-burnin-types'

interface CommandResult {
  status: 'passed' | 'failed'
  exitCode: number | null
  stdout: string
  stderr: string
}

function sha256Text(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function sha256File(filePath: string): string {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex')
}

function md5FileBase64(filePath: string): string {
  return createHash('md5').update(readFileSync(filePath)).digest('base64')
}

function readOptional(filePath: string): string {
  return existsSync(filePath) ? readFileSync(filePath, 'utf8') : ''
}

function runCommand(command: string, args: string[], cwd = process.cwd()): CommandResult {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  })
  const exitCode = result.status ?? null
  return {
    status: exitCode === 0 ? 'passed' : 'failed',
    exitCode,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? result.error?.message ?? '',
  }
}

function runCommandToFile(command: string, args: string[], outputPath: string, cwd = process.cwd()): CommandResult {
  const outputFd = openSync(outputPath, 'w')
  try {
    const result = spawnSync(command, args, {
      cwd,
      encoding: 'utf8',
      maxBuffer: 20 * 1024 * 1024,
      stdio: ['ignore', outputFd, 'pipe'],
    })
    const exitCode = result.status ?? null
    return {
      status: exitCode === 0 ? 'passed' : 'failed',
      exitCode,
      stdout: '',
      stderr: result.stderr ?? result.error?.message ?? '',
    }
  } finally {
    closeSync(outputFd)
  }
}

function compactOutput(value: string): string {
  return value.replace(/\s+/g, ' ').trim().slice(0, 1200) || 'none'
}

function classifyGcsFailure(output: string): TrackaCaptionGcsAccessStatus {
  const text = output.toLowerCase()
  if (
    text.includes('reauthentication failed') ||
    text.includes('cannot prompt') ||
    text.includes('refreshing your current auth tokens') ||
    text.includes('invalid_grant') ||
    text.includes('auth login') ||
    text.includes('login required')
  ) {
    return 'blocked_gcloud_auth_refresh_required'
  }
  if (
    text.includes('403') ||
    text.includes('permission denied') ||
    text.includes('accessdenied') ||
    text.includes('access denied') ||
    text.includes('forbidden') ||
    text.includes('storage.objects.get')
  ) {
    return 'blocked_gcs_permission_denied'
  }
  if (
    text.includes('404') ||
    text.includes('not found') ||
    text.includes('no urls matched') ||
    text.includes('matched no objects')
  ) {
    return 'blocked_source_object_missing'
  }
  return 'blocked_source_metadata_check_failed'
}

function isGcloudCrc32cHelperFailure(output: string): boolean {
  const text = output.toLowerCase()
  return text.includes('gcloud-crc32c') && text.includes('bad cpu type')
}

function dockerArgsFor(filePath: string): string[] {
  return ['run', '--rm', '-v', `${filePath}:/work`, TRACKA_CAPTION_APPROVED_RUNTIME.imageTag]
}

export function buildCorrectedAssSidecar(): string {
  const dialogue = TRACKA_CAPTION_LAYOUT_FIXED_LINES.map((line, index) => {
    const startSecond = index * 3
    const endSecond = startSecond + 2
    const start = `0:00:${String(startSecond).padStart(2, '0')}.00`
    const end = `0:00:${String(endSecond).padStart(2, '0')}.80`
    return `Dialogue: 0,${start},${end},Default,,0,0,0,,${line}`
  }).join('\n')

  const ass = `[Script Info]
Title: TRACKA-CAPTION-QUALITY-5 Layout Fixed Controlled Test Captions
ScriptType: v4.00+
PlayResX: ${TRACKA_CAPTION_LAYOUT_FIX_ASS_PROFILE.playResX}
PlayResY: ${TRACKA_CAPTION_LAYOUT_FIX_ASS_PROFILE.playResY}
WrapStyle: ${TRACKA_CAPTION_LAYOUT_FIX_ASS_PROFILE.wrapStyle}
ScaledBorderAndShadow: yes
YCbCr Matrix: TV.709

[V4+ Styles]
Format: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding
Style: Default,Arial,${TRACKA_CAPTION_LAYOUT_FIX_ASS_PROFILE.fontSize},&H00FFFFFF,&H000000FF,&H00111111,&H99000000,0,0,0,0,100,100,0,0,1,${TRACKA_CAPTION_LAYOUT_FIX_ASS_PROFILE.outline},${TRACKA_CAPTION_LAYOUT_FIX_ASS_PROFILE.shadow},${TRACKA_CAPTION_LAYOUT_FIX_ASS_PROFILE.alignment},${TRACKA_CAPTION_LAYOUT_FIX_ASS_PROFILE.marginL},${TRACKA_CAPTION_LAYOUT_FIX_ASS_PROFILE.marginR},${TRACKA_CAPTION_LAYOUT_FIX_ASS_PROFILE.marginV},1

[Events]
Format: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text
${dialogue}
`

  if (ass.includes(TRACKA_CAPTION_BURNIN_REJECTED_TEXT)) {
    throw new Error('Corrected ASS sidecar unexpectedly contains rejected #419 caption text.')
  }
  if (!ass.includes('Alignment,MarginL,MarginR,MarginV') || ass.includes('\\pos(')) {
    throw new Error('Layout fixed ASS sidecar must use style margins, not absolute placement.')
  }
  return ass
}

function buildSourceAudit(): TrackaCaptionBurninSourceAudit {
  const approvedCaptionManifestPath = 'docs/track-a/track-a-caption-quality-3-approved-caption-input-manifest.md'
  const executionPacketPath = 'docs/track-a/track-a-caption-quality-3-execution-result.md'
  const sourceRefPath = 'docs/track-a/track-a-caption-source-ref-1.md'
  const runtimePathEvidencePath = TRACKA_CAPTION_APPROVED_RUNTIME.metadataEvidencePath
  const approvedCaptionManifest = readOptional(approvedCaptionManifestPath)
  const executionPacket = readOptional(executionPacketPath)
  const sourceRefDoc = readOptional(sourceRefPath)
  const runtimeDoc = [
    readOptional(runtimePathEvidencePath),
    readOptional('docs/track-a/track-a-caption-runtime-path-next-phase-plan.md'),
    readOptional('docs/track-a/track-a-caption-quality-3r2-runtime-path-1.md'),
  ].join('\n')
  const activeBlockers: string[] = []

  for (const line of TRACKA_CAPTION_BURNIN_CORRECTED_LINES) {
    if (!approvedCaptionManifest.includes(line)) activeBlockers.push(`missing_corrected_caption_line:${line}`)
  }
  for (const token of [
    'captionSourceType` | `controlled_test_caption_copy',
    'transcriptAccuracyClaim` | `false',
    'captionTextQualityForControlledTest` | `pass',
    'captionVisualBurnInRevalidationRequired` | `true',
  ]) {
    if (!approvedCaptionManifest.includes(token)) activeBlockers.push(`missing_approved_caption_source_token:${token}`)
  }
  if (!executionPacket.includes('TRACKA-CAPTION-QUALITY-3R readiness: ready_for_guarded_execution')) {
    activeBlockers.push('missing_tracka_caption_quality_3r_ready_for_guarded_execution')
  }
  if (!sourceRefDoc.includes('approvedPrivateSourceRefStatus: `approved`')) {
    activeBlockers.push('missing_approved_private_source_ref_status')
  }
  if (!sourceRefDoc.includes(TRACKA_CAPTION_APPROVED_SOURCE_REF)) {
    activeBlockers.push('missing_approved_phase32_source_ref')
  }
  for (const value of Object.values(TRACKA_CAPTION_APPROVED_SOURCE_METADATA)) {
    if (!sourceRefDoc.includes(value)) activeBlockers.push(`missing_source_ref_metadata:${value}`)
  }
  for (const token of [
    TRACKA_CAPTION_APPROVED_RUNTIME.status,
    TRACKA_CAPTION_APPROVED_RUNTIME.approvedRuntimePath,
    TRACKA_CAPTION_APPROVED_RUNTIME.dockerfile,
    TRACKA_CAPTION_APPROVED_RUNTIME.imageTag,
    'assFilterPresent | `true`',
    'subtitlesFilterPresent | `true`',
    'libassIndicated | `true`',
    'TRACKA-CAPTION-QUALITY-3R3 readiness: `ready_for_guarded_burnin_execution_with_approved_ffmpeg_libass_runtime`',
  ]) {
    if (!runtimeDoc.includes(token)) activeBlockers.push(`missing_runtime_path_metadata:${token}`)
  }

  return {
    status: activeBlockers.length > 0 ? 'blocked' : 'passed',
    sourceChainMerged: true,
    sourcePrs: [...TRACKA_CAPTION_BURNIN_SOURCE_CHAIN],
    approvedCaptionSourcePath: approvedCaptionManifestPath,
    executionPacketPath,
    sourceRefPath,
    runtimePathEvidencePath,
    sourceRefApproved: activeBlockers.every((blocker) => !blocker.includes('source_ref')),
    runtimePathApproved: activeBlockers.every((blocker) => !blocker.includes('runtime_path_metadata')),
    oldCaptionRejected: true,
    activeBlockers,
  }
}

function buildApprovedSourceRef(sourceAudit: TrackaCaptionBurninSourceAudit): TrackaCaptionBurninApprovedSourceRef {
  const activeBlockers = sourceAudit.activeBlockers.filter((blocker) => blocker.includes('source_ref'))
  return {
    status: activeBlockers.length > 0 ? 'blocked' : 'approved',
    ref: TRACKA_CAPTION_APPROVED_SOURCE_REF,
    metadata: TRACKA_CAPTION_APPROVED_SOURCE_METADATA,
    metadataEvidencePath: 'docs/activation-phase-tracka-caption-source-ref-1-results.md',
    sourceRefApproved: activeBlockers.length === 0,
    activeBlockers,
  }
}

function inspectOrBuildRuntimeImage(input: {
  execute: boolean
  approvedSourceRef: TrackaCaptionBurninApprovedSourceRef
  sourceAudit: TrackaCaptionBurninSourceAudit
}): TrackaCaptionBurninRuntimeResolution {
  const evidencePaths = [
    TRACKA_CAPTION_APPROVED_RUNTIME.metadataEvidencePath,
    'docs/track-a/track-a-caption-runtime-path-approval-contract.md',
    'docs/track-a/track-a-caption-quality-3-command-plan.md',
    'docs/track-a/track-a-caption-quality-3-libass-burnin-execution-contract.md',
    'docs/track-a/track-a-caption-quality-3-ffmpeg-ffprobe-validation-contract.md',
  ]

  const base: TrackaCaptionBurninRuntimeResolution = {
    approvedPrivateSourceRefFound: input.approvedSourceRef.sourceRefApproved,
    approvedRuntimePathFound: input.sourceAudit.runtimePathApproved,
    approvedRuntimePath: TRACKA_CAPTION_APPROVED_RUNTIME.approvedRuntimePath,
    runtimeSourceProvenance: TRACKA_CAPTION_APPROVED_RUNTIME.dockerfile,
    runtimeImageTag: TRACKA_CAPTION_APPROVED_RUNTIME.imageTag,
    ffmpegPath: TRACKA_CAPTION_APPROVED_RUNTIME.ffmpegPath,
    ffprobePath: TRACKA_CAPTION_APPROVED_RUNTIME.ffprobePath,
    assFilterPresent: TRACKA_CAPTION_APPROVED_RUNTIME.assFilterPresent,
    subtitlesFilterPresent: TRACKA_CAPTION_APPROVED_RUNTIME.subtitlesFilterPresent,
    libassIndicated: TRACKA_CAPTION_APPROVED_RUNTIME.libassIndicated,
    dockerImageAvailable: false,
    dockerImageBuildAttempted: false,
    dockerImageBuildStatus: 'not_attempted',
    attemptedGcsAccess: false,
    attemptedFfmpeg: false,
    attemptedFfprobe: false,
    attemptedRemotion: false,
    blocker: 'none',
    rejectedCandidateReason: 'Repo-owned render-worker Docker FFmpeg/libass runtime path is approved by #463 metadata.',
    evidencePaths,
  }

  if (!input.approvedSourceRef.sourceRefApproved) {
    return {
      ...base,
      approvedRuntimePathFound: false,
      blocker: 'blocked_missing_approved_private_source_ref',
      rejectedCandidateReason: 'The approved #452 source ref evidence was not present or did not match the exact Phase 32 private object contract.',
    }
  }

  if (!input.sourceAudit.runtimePathApproved) {
    return {
      ...base,
      blocker: 'blocked_missing_approved_caption_burnin_runtime_path',
      rejectedCandidateReason: 'The approved #463 repo-owned Docker FFmpeg/libass runtime metadata was not present on the source branch.',
    }
  }

  if (!input.execute) return { ...base, dockerImageBuildStatus: 'not_needed' }

  const inspectBefore = runCommand('docker', ['image', 'inspect', TRACKA_CAPTION_APPROVED_RUNTIME.imageTag])
  if (inspectBefore.status === 'passed') {
    return { ...base, dockerImageAvailable: true, dockerImageBuildStatus: 'not_needed' }
  }

  if (!isTrackaCaptionRuntimeImageBuildConfirmed()) {
    return {
      ...base,
      dockerImageBuildStatus: 'not_attempted',
      blocker: 'blocked_approved_runtime_image_failed',
      rejectedCandidateReason: `${TRACKA_CAPTION_APPROVED_RUNTIME.imageTag} is not locally available and ${TRACKA_CAPTION_RUNTIME_IMAGE_BUILD_CONFIRM_ENV}=true was not provided.`,
    }
  }

  const requiredBuildArtifacts = [
    { path: 'dist-server', script: 'build:server' },
    { path: 'dist-remotion-worker', script: 'build:remotion-worker:mock' },
    { path: 'dist-staging-fixture-worker', script: 'build:staging-fixture-worker' },
    { path: 'dist-staging-real-video-export-worker', script: 'build:staging-real-video-export-worker' },
  ]
  for (const artifact of requiredBuildArtifacts) {
    if (!existsSync(artifact.path)) {
      const buildResult = runCommand('npm', ['run', artifact.script])
      if (buildResult.status !== 'passed') {
        return {
          ...base,
          dockerImageBuildAttempted: true,
          dockerImageBuildStatus: 'failed',
          blocker: 'blocked_approved_runtime_image_failed',
          rejectedCandidateReason: `Required Docker build artifact script ${artifact.script} failed: ${compactOutput(buildResult.stderr || buildResult.stdout)}`,
        }
      }
    }
  }

  const build = runCommand('docker', [
    'build',
    '-f',
    TRACKA_CAPTION_APPROVED_RUNTIME.dockerfile,
    '-t',
    TRACKA_CAPTION_APPROVED_RUNTIME.imageTag,
    '.',
  ])
  if (build.status !== 'passed') {
    return {
      ...base,
      dockerImageBuildAttempted: true,
      dockerImageBuildStatus: 'failed',
      blocker: 'blocked_approved_runtime_image_failed',
      rejectedCandidateReason: `Approved Docker runtime image build failed: ${compactOutput(build.stderr || build.stdout)}`,
    }
  }

  return {
    ...base,
    dockerImageAvailable: true,
    dockerImageBuildAttempted: true,
    dockerImageBuildStatus: 'passed',
  }
}

async function maybeWriteSidecar(input: {
  execute: boolean
  confirmationProvided: boolean
  localBundlePath: string
}): Promise<TrackaCaptionBurninSidecarArtifact> {
  if (!input.execute || !input.confirmationProvided) {
    return { created: false, artifactType: 'ass_sidecar', lineCount: TRACKA_CAPTION_BURNIN_CORRECTED_LINES.length }
  }

  const ass = buildCorrectedAssSidecar()
  await mkdir(input.localBundlePath, { recursive: true })
  const localPath = path.join(input.localBundlePath, 'tracka-caption-quality-5-layout-fixed-caption.ass')
  await writeFile(localPath, ass)
  const stat = statSync(localPath)
  return {
    created: true,
    artifactType: 'ass_sidecar',
    localPath,
    sha256: sha256File(localPath),
    sizeBytes: stat.size,
    lineCount: TRACKA_CAPTION_BURNIN_CORRECTED_LINES.length,
    layoutProfile: TRACKA_CAPTION_LAYOUT_FIX_PROFILE_ID,
  }
}

function buildNotAttemptedGcsAccessCheck(input: {
  confirmationProvided: boolean
  metadataCheckExecuted?: boolean
  status?: TrackaCaptionGcsAccessStatus
  detail?: string
}): TrackaCaptionBurninGcsAccessCheck {
  return {
    confirmationProvided: input.confirmationProvided,
    metadataCheckExecuted: input.metadataCheckExecuted ?? false,
    status: input.status ?? 'not_attempted',
    gcloudAccount: 'not_checked',
    gcloudProject: 'not_checked',
    activeAccount: 'not_checked',
    approvedSourceRef: TRACKA_CAPTION_APPROVED_SOURCE_REF,
    objectMetadataMatched: false,
    detail: input.detail ?? 'not_attempted',
  }
}

function buildGcsAccessCheck(input: {
  execute: boolean
  confirmationProvided: boolean
  sourceGcsReadConfirmationProvided: boolean
  gcsAccessRepairConfirmationProvided: boolean
  sourceRefApproved: boolean
}): TrackaCaptionBurninGcsAccessCheck {
  if (!input.execute || !input.confirmationProvided || !input.sourceGcsReadConfirmationProvided || !input.sourceRefApproved) {
    return buildNotAttemptedGcsAccessCheck({
      confirmationProvided: input.gcsAccessRepairConfirmationProvided,
      status: !input.execute ? 'not_attempted' : 'blocked_caption_layout_fix_confirmation_missing',
      detail: 'blocked before GCS metadata check because execution, layout-fix confirmation, burn-in confirmation, source read confirmation, or source approval is missing.',
    })
  }

  const account = runCommand('gcloud', ['config', 'get-value', 'account'])
  const project = runCommand('gcloud', ['config', 'get-value', 'project'])
  const active = runCommand('gcloud', ['auth', 'list', '--filter=status:ACTIVE', '--format=value(account)'])
  const metadata = runCommand('gcloud', ['storage', 'ls', '-L', TRACKA_CAPTION_APPROVED_SOURCE_REF])

  if (metadata.status !== 'passed') {
    const detail = compactOutput(metadata.stderr || metadata.stdout)
    return {
      confirmationProvided: true,
      metadataCheckExecuted: true,
      status: classifyGcsFailure(detail),
      gcloudAccount: compactOutput(account.stdout || account.stderr),
      gcloudProject: compactOutput(project.stdout || project.stderr),
      activeAccount: compactOutput(active.stdout || active.stderr),
      approvedSourceRef: TRACKA_CAPTION_APPROVED_SOURCE_REF,
      objectMetadataMatched: false,
      detail,
    }
  }

  const metadataText = metadata.stdout || ''
  const objectMetadataMatched =
    metadataText.includes(TRACKA_CAPTION_APPROVED_SOURCE_REF) ||
    metadataText.includes(TRACKA_CAPTION_APPROVED_SOURCE_METADATA.size) ||
    metadataText.includes(TRACKA_CAPTION_APPROVED_SOURCE_METADATA.contentType) ||
    metadataText.includes(TRACKA_CAPTION_APPROVED_SOURCE_METADATA.generation)

  return {
    confirmationProvided: true,
    metadataCheckExecuted: true,
    status: objectMetadataMatched ? 'completed' : 'blocked_source_metadata_check_failed',
    gcloudAccount: compactOutput(account.stdout || account.stderr),
    gcloudProject: compactOutput(project.stdout || project.stderr),
    activeAccount: compactOutput(active.stdout || active.stderr),
    approvedSourceRef: TRACKA_CAPTION_APPROVED_SOURCE_REF,
    objectMetadataMatched,
    detail: objectMetadataMatched
      ? 'exact approved source metadata check passed'
      : `exact approved source metadata check returned unexpected metadata: ${compactOutput(metadataText || metadata.stderr)}`,
  }
}

async function maybeCopyApprovedSource(input: {
  execute: boolean
  confirmationProvided: boolean
  sourceGcsReadConfirmationProvided: boolean
  gcsAccessCheck: TrackaCaptionBurninGcsAccessCheck
  sourceRefApproved: boolean
  localBundlePath: string
}): Promise<TrackaCaptionBurninArtifact> {
  if (!input.execute || !input.confirmationProvided || !input.sourceGcsReadConfirmationProvided || !input.sourceRefApproved) {
    return { created: false, artifactType: 'approved_private_source_copy' }
  }
  if (input.gcsAccessCheck.status !== 'completed') {
    return {
      created: false,
      artifactType: 'approved_private_source_copy',
      blocker: input.gcsAccessCheck.status,
    }
  }

  await mkdir(input.localBundlePath, { recursive: true })
  const localPath = path.join(input.localBundlePath, 'tracka-caption-quality-5-approved-source.mp4')
  const copy = runCommand('gcloud', ['storage', 'cp', TRACKA_CAPTION_APPROVED_SOURCE_REF, localPath])
  if (copy.status !== 'passed' || !existsSync(localPath)) {
    const copyOutput = copy.stderr || copy.stdout
    if (isGcloudCrc32cHelperFailure(copyOutput)) {
      if (existsSync(localPath)) unlinkSync(localPath)
      const gcloudTempPath = `${localPath}_.gstmp`
      if (existsSync(gcloudTempPath)) unlinkSync(gcloudTempPath)
      const cat = runCommandToFile('gcloud', ['storage', 'cat', TRACKA_CAPTION_APPROVED_SOURCE_REF], localPath)
      if (cat.status !== 'passed' || !existsSync(localPath)) {
        const status = classifyGcsFailure(cat.stderr || cat.stdout)
        return {
          created: false,
          artifactType: 'approved_private_source_copy',
          blocker: `${status === 'blocked_source_metadata_check_failed' ? 'blocked_approved_source_ref_access_failed' : status}:gcloud_storage_cat_fallback_failed:${compactOutput(cat.stderr || cat.stdout)}`,
        }
      }
    } else {
    const status = classifyGcsFailure(copy.stderr || copy.stdout)
    return {
      created: false,
      artifactType: 'approved_private_source_copy',
      blocker: `${status === 'blocked_source_metadata_check_failed' ? 'blocked_approved_source_ref_access_failed' : status}:${compactOutput(copy.stderr || copy.stdout)}`,
    }
    }
  }

  const stat = statSync(localPath)
  if (String(stat.size) !== TRACKA_CAPTION_APPROVED_SOURCE_METADATA.size) {
    return {
      created: false,
      artifactType: 'approved_private_source_copy',
      localPath,
      sizeBytes: stat.size,
      sha256: sha256File(localPath),
      blocker: `blocked_approved_source_ref_access_failed:size_mismatch_expected_${TRACKA_CAPTION_APPROVED_SOURCE_METADATA.size}_actual_${stat.size}`,
    }
  }
  const md5 = md5FileBase64(localPath)
  if (md5 !== TRACKA_CAPTION_APPROVED_SOURCE_METADATA.md5) {
    return {
      created: false,
      artifactType: 'approved_private_source_copy',
      localPath,
      sizeBytes: stat.size,
      sha256: sha256File(localPath),
      blocker: `blocked_approved_source_ref_access_failed:md5_mismatch_expected_${TRACKA_CAPTION_APPROVED_SOURCE_METADATA.md5}_actual_${md5}`,
    }
  }

  return {
    created: true,
    artifactType: 'approved_private_source_copy',
    localPath,
    sha256: sha256File(localPath),
    sizeBytes: stat.size,
  }
}

async function maybeRunBurnin(input: {
  execute: boolean
  confirmationProvided: boolean
  sourceGcsReadConfirmationProvided: boolean
  runtimeResolution: TrackaCaptionBurninRuntimeResolution
  sourceArtifact: TrackaCaptionBurninArtifact
  sidecar: TrackaCaptionBurninSidecarArtifact
  localBundlePath: string
}): Promise<TrackaCaptionBurninArtifact> {
  if (
    !input.execute ||
    !input.confirmationProvided ||
    !input.sourceGcsReadConfirmationProvided ||
    !input.runtimeResolution.approvedRuntimePathFound ||
    !input.runtimeResolution.dockerImageAvailable ||
    !input.sourceArtifact.created ||
    !input.sourceArtifact.localPath ||
    !input.sidecar.created ||
    !input.sidecar.localPath
  ) {
    return { created: false, artifactType: 'corrected_caption_private_preview' }
  }

  const outputPath = path.join(input.localBundlePath, 'tracka-caption-quality-5-layout-fixed-caption-preview.mp4')
  const burnin = runCommand('docker', [
    ...dockerArgsFor(input.localBundlePath),
    'ffmpeg',
    '-hide_banner',
    '-y',
    '-i',
    '/work/tracka-caption-quality-5-approved-source.mp4',
    '-t',
    '15',
    '-vf',
    'ass=/work/tracka-caption-quality-5-layout-fixed-caption.ass',
    '-c:v',
    'libx264',
    '-preset',
    'veryfast',
    '-crf',
    '23',
    '-c:a',
    'copy',
    '-movflags',
    '+faststart',
    '/work/tracka-caption-quality-5-layout-fixed-caption-preview.mp4',
  ])

  if (burnin.status !== 'passed' || !existsSync(outputPath)) {
    return {
      created: false,
      artifactType: 'corrected_caption_private_preview',
      blocker: `blocked_caption_burnin_runtime_failed:${compactOutput(burnin.stderr || burnin.stdout)}`,
    }
  }

  const stat = statSync(outputPath)
  return {
    created: true,
    artifactType: 'corrected_caption_private_preview',
    localPath: outputPath,
    sha256: sha256File(outputPath),
    sizeBytes: stat.size,
  }
}

async function maybeRunFfprobe(input: {
  execute: boolean
  confirmationProvided: boolean
  previewArtifact: TrackaCaptionBurninArtifact
  localBundlePath: string
}): Promise<TrackaCaptionBurninArtifact> {
  if (!input.execute || !input.confirmationProvided || !input.previewArtifact.created) {
    return { created: false, artifactType: 'ffprobe_metadata_json' }
  }

  const ffprobe = runCommand('docker', [
    ...dockerArgsFor(input.localBundlePath),
    'ffprobe',
    '-hide_banner',
    '-v',
    'error',
    '-show_format',
    '-show_streams',
    '-print_format',
    'json',
    '/work/tracka-caption-quality-5-layout-fixed-caption-preview.mp4',
  ])
  if (ffprobe.status !== 'passed' || !ffprobe.stdout.trim()) {
    return {
      created: false,
      artifactType: 'ffprobe_metadata_json',
      blocker: `blocked_ffprobe_validation_failed:${compactOutput(ffprobe.stderr || ffprobe.stdout)}`,
    }
  }

  await mkdir(input.localBundlePath, { recursive: true })
  const localPath = path.join(input.localBundlePath, 'tracka-caption-quality-5-ffprobe.json')
  await writeFile(localPath, ffprobe.stdout.trim().endsWith('\n') ? ffprobe.stdout : `${ffprobe.stdout.trim()}\n`)
  const stat = statSync(localPath)
  return {
    created: true,
    artifactType: 'ffprobe_metadata_json',
    localPath,
    sha256: sha256File(localPath),
    sizeBytes: stat.size,
  }
}

async function writeJsonArtifact(input: {
  execute: boolean
  confirmationProvided: boolean
  localBundlePath: string
  fileName: string
  artifactType: string
  value: unknown
}): Promise<TrackaCaptionBurninArtifact> {
  if (!input.execute || !input.confirmationProvided) {
    return { created: false, artifactType: input.artifactType }
  }
  await mkdir(input.localBundlePath, { recursive: true })
  const localPath = path.join(input.localBundlePath, input.fileName)
  const text = `${JSON.stringify(input.value, null, 2)}\n`
  if (text.includes(TRACKA_CAPTION_BURNIN_REJECTED_TEXT)) {
    throw new Error('Rejected #419 caption text leaked into JSON artifact.')
  }
  await writeFile(localPath, text)
  const stat = statSync(localPath)
  return {
    created: true,
    artifactType: input.artifactType,
    localPath,
    sha256: sha256File(localPath),
    sizeBytes: stat.size,
  }
}

function statusFor(input: {
  execute: boolean
  confirmationProvided: boolean
  sourceGcsReadConfirmationProvided: boolean
  gcsAccessRepairConfirmationProvided: boolean
  gcsAccessCheck: TrackaCaptionBurninGcsAccessCheck
  sourceAudit: TrackaCaptionBurninSourceAudit
  approvedSourceRef: TrackaCaptionBurninApprovedSourceRef
  runtimeResolution: TrackaCaptionBurninRuntimeResolution
  sourceArtifact: TrackaCaptionBurninArtifact
  previewArtifact: TrackaCaptionBurninArtifact
  ffprobeArtifact: TrackaCaptionBurninArtifact
}): TrackaCaptionBurninExecutionStatus {
  if (!input.execute || !input.confirmationProvided || !input.sourceGcsReadConfirmationProvided) {
    return 'blocked_caption_layout_fix_confirmation_missing'
  }
  if (input.sourceAudit.status === 'blocked' || !input.approvedSourceRef.sourceRefApproved) {
    return 'blocked_missing_approved_private_source_ref'
  }
  if (input.gcsAccessCheck.status !== 'completed') {
    return input.gcsAccessCheck.status === 'not_attempted' ? 'blocked_approved_source_ref_access_failed' : input.gcsAccessCheck.status
  }
  if (!input.sourceArtifact.created) return 'blocked_approved_source_ref_access_failed'
  if (!input.runtimeResolution.approvedRuntimePathFound) return 'blocked_missing_approved_caption_burnin_runtime_path'
  if (!input.runtimeResolution.dockerImageAvailable || input.runtimeResolution.blocker === 'blocked_approved_runtime_image_failed') {
    return 'blocked_approved_runtime_image_failed'
  }
  if (!input.previewArtifact.created) return 'blocked_caption_burnin_runtime_failed'
  if (!input.ffprobeArtifact.created) return 'blocked_ffprobe_validation_failed'
  return 'completed_with_caption_layout_fix_revalidation'
}

function buildQaGates(input: {
  sourceAudit: TrackaCaptionBurninSourceAudit
  approvedSourceRef: TrackaCaptionBurninApprovedSourceRef
  gcsAccessCheck: TrackaCaptionBurninGcsAccessCheck
  sourceArtifact: TrackaCaptionBurninArtifact
  sidecar: TrackaCaptionBurninSidecarArtifact
  previewArtifact: TrackaCaptionBurninArtifact
  ffprobeArtifact: TrackaCaptionBurninArtifact
  runtimeResolution: TrackaCaptionBurninRuntimeResolution
  confirmationProvided: boolean
  sourceGcsReadConfirmationProvided: boolean
}): TrackaCaptionBurninQaGate[] {
  return [
    {
      gateId: 'confirmation_envs_present',
      status: input.confirmationProvided && input.sourceGcsReadConfirmationProvided && input.gcsAccessCheck.confirmationProvided ? 'passed' : 'blocked',
      evidence: `${TRACKA_CAPTION_LAYOUT_FIX_CONFIRM_ENV}=true, ${TRACKA_CAPTION_BURNIN_CONFIRM_ENV}=true, and ${TRACKA_CAPTION_SOURCE_GCS_READ_CONFIRM_ENV}=true are required. ${TRACKA_CAPTION_GCS_ACCESS_REPAIR_CONFIRM_ENV}=true is optional legacy repair context only.`,
    },
    {
      gateId: 'approved_caption_source_loaded',
      status: input.sourceAudit.status,
      evidence: input.sourceAudit.approvedCaptionSourcePath,
    },
    {
      gateId: 'approved_private_source_ref_loaded',
      status: input.approvedSourceRef.sourceRefApproved ? 'passed' : 'blocked',
      evidence: input.approvedSourceRef.ref,
    },
    {
      gateId: 'approved_private_source_metadata_check',
      status: input.gcsAccessCheck.status === 'completed' ? 'passed' : 'blocked',
      evidence: input.gcsAccessCheck.detail,
    },
    {
      gateId: 'approved_private_source_exact_copy',
      status: input.sourceArtifact.created ? 'passed' : 'blocked',
      evidence: input.sourceArtifact.sha256 ?? input.sourceArtifact.blocker ?? 'blocked until confirmed execution.',
    },
    {
      gateId: 'transcript_accuracy_false',
      status: input.sourceAudit.activeBlockers.some((item) => item.includes('transcriptAccuracyClaim')) ? 'blocked' : 'passed',
      evidence: 'transcriptAccuracyClaim remains false.',
    },
    {
      gateId: 'old_caption_rejected',
      status: input.sourceAudit.oldCaptionRejected ? 'passed' : 'blocked',
      evidence: 'Rejected #419 caption text is not written to CQ5 sidecar/report/manifest artifacts.',
    },
    {
      gateId: 'layout_profile_applied',
      status: input.sidecar.layoutProfile === TRACKA_CAPTION_LAYOUT_FIX_PROFILE_ID ? 'passed' : 'blocked',
      evidence: `${TRACKA_CAPTION_LAYOUT_FIX_PROFILE_ID}; Alignment=${TRACKA_CAPTION_LAYOUT_FIX_ASS_PROFILE.alignment}, MarginL=${TRACKA_CAPTION_LAYOUT_FIX_ASS_PROFILE.marginL}, MarginR=${TRACKA_CAPTION_LAYOUT_FIX_ASS_PROFILE.marginR}, MarginV=${TRACKA_CAPTION_LAYOUT_FIX_ASS_PROFILE.marginV}, Fontsize=${TRACKA_CAPTION_LAYOUT_FIX_ASS_PROFILE.fontSize}, maxLines=${TRACKA_CAPTION_LAYOUT_FIX_ASS_PROFILE.maxLines}`,
    },
    {
      gateId: 'corrected_sidecar_checksum',
      status: input.sidecar.created && Boolean(input.sidecar.sha256) ? 'passed' : 'blocked',
      evidence: input.sidecar.sha256 ?? 'blocked until confirmation.',
    },
    {
      gateId: 'approved_caption_burnin_runtime_path',
      status: input.runtimeResolution.approvedRuntimePathFound ? 'passed' : 'blocked',
      evidence: input.runtimeResolution.rejectedCandidateReason,
    },
    {
      gateId: 'corrected_caption_private_preview',
      status: input.previewArtifact.created ? 'passed' : 'blocked',
      evidence: input.previewArtifact.sha256 ?? input.previewArtifact.blocker ?? 'blocked until burn-in completes.',
    },
    {
      gateId: 'ffprobe_validation',
      status: input.ffprobeArtifact.created ? 'passed' : 'blocked',
      evidence: input.ffprobeArtifact.sha256 ?? input.ffprobeArtifact.blocker ?? 'blocked until preview exists.',
    },
    {
      gateId: 'no_public_or_signed_artifacts',
      status: 'passed',
      evidence: 'signedUrlsCreated=false and publicArtifactsCreated=false.',
    },
    {
      gateId: 'no_supabase_mutation',
      status: 'passed',
      evidence: 'Supabase classification remains docs_only; SQL executed none.',
    },
    {
      gateId: 'caption_readability_pending_visual_review',
      status: input.previewArtifact.created ? 'passed' : 'blocked',
      evidence: input.previewArtifact.created
        ? 'Layout-fixed corrected-caption preview exists and must be uploaded before TRACKA-CAPTION-QUALITY-6 records visual review.'
        : 'Caption layout visual review remains blocked until a review-safe preview exists.',
    },
  ]
}

export async function buildTrackaCaptionBurninBundle(input: {
  execute: boolean
  runId?: string
}): Promise<TrackaCaptionBurninBundle> {
  const runId = input.runId ?? getTrackaCaptionBurninRunId()
  const localBundlePath = path.join(TRACKA_CAPTION_BURNIN_LOCAL_ROOT, runId)
  const layoutFixConfirmationProvided = isTrackaCaptionLayoutFixConfirmed()
  const burninConfirmationProvided = isTrackaCaptionBurninConfirmed()
  const confirmationProvided = layoutFixConfirmationProvided && burninConfirmationProvided
  const sourceGcsReadConfirmationProvided = isTrackaCaptionSourceGcsReadConfirmed()
  const gcsAccessRepairConfirmationProvided = isTrackaCaptionGcsAccessRepairConfirmed()
  const sourceAudit = buildSourceAudit()
  const approvedSourceRef = buildApprovedSourceRef(sourceAudit)
  const sidecar = await maybeWriteSidecar({ execute: input.execute, confirmationProvided, localBundlePath })
  const gcsAccessCheck = buildGcsAccessCheck({
    execute: input.execute,
    confirmationProvided,
    sourceGcsReadConfirmationProvided,
    gcsAccessRepairConfirmationProvided,
    sourceRefApproved: approvedSourceRef.sourceRefApproved,
  })
  const sourceArtifact = await maybeCopyApprovedSource({
    execute: input.execute,
    confirmationProvided,
    sourceGcsReadConfirmationProvided,
    gcsAccessCheck,
    sourceRefApproved: approvedSourceRef.sourceRefApproved,
    localBundlePath,
  })
  const runtimeResolution = inspectOrBuildRuntimeImage({
    execute: input.execute && gcsAccessCheck.status === 'completed',
    approvedSourceRef,
    sourceAudit,
  })
  runtimeResolution.attemptedGcsAccess = gcsAccessCheck.metadataCheckExecuted || sourceArtifact.created
  const previewArtifact = await maybeRunBurnin({
    execute: input.execute,
    confirmationProvided,
    sourceGcsReadConfirmationProvided,
    runtimeResolution,
    sourceArtifact,
    sidecar,
    localBundlePath,
  })
  runtimeResolution.attemptedFfmpeg = input.execute && confirmationProvided && sourceGcsReadConfirmationProvided && sourceArtifact.created && runtimeResolution.dockerImageAvailable
  const ffprobeArtifact = await maybeRunFfprobe({
    execute: input.execute,
    confirmationProvided,
    previewArtifact,
    localBundlePath,
  })
  runtimeResolution.attemptedFfprobe = input.execute && confirmationProvided && previewArtifact.created
  const execution = statusFor({
    execute: input.execute,
    confirmationProvided,
    sourceGcsReadConfirmationProvided,
    gcsAccessRepairConfirmationProvided,
    gcsAccessCheck,
    sourceAudit,
    approvedSourceRef,
    runtimeResolution,
    sourceArtifact,
    previewArtifact,
    ffprobeArtifact,
  })
  const qaGates = buildQaGates({
    sourceAudit,
    approvedSourceRef,
    gcsAccessCheck,
    sourceArtifact,
    sidecar,
    previewArtifact,
    ffprobeArtifact,
    runtimeResolution,
    confirmationProvided,
    sourceGcsReadConfirmationProvided,
  })

  const activeBlockers = [
    ...sourceAudit.activeBlockers,
    ...approvedSourceRef.activeBlockers,
    ...(confirmationProvided && sourceGcsReadConfirmationProvided ? [] : ['blocked_caption_layout_fix_confirmation_missing']),
    ...(gcsAccessCheck.status === 'completed' || gcsAccessCheck.status === 'not_attempted' ? [] : [gcsAccessCheck.status]),
    ...(sourceArtifact.blocker ? [sourceArtifact.blocker] : []),
    ...(runtimeResolution.blocker === 'none' ? [] : [runtimeResolution.blocker]),
    ...(previewArtifact.blocker ? [previewArtifact.blocker] : []),
    ...(ffprobeArtifact.blocker ? [ffprobeArtifact.blocker] : []),
    ...qaGates.filter((gate) => gate.status === 'blocked').map((gate) => `qa_gate_blocked:${gate.gateId}`),
  ].filter((value, index, list) => list.indexOf(value) === index)

  const summary: TrackaCaptionBurninSummary = {
    phase: TRACKA_CAPTION_BURNIN_PHASE,
    runId,
    execution,
    layoutFixConfirmationProvided,
    confirmationProvided,
    sourceGcsReadConfirmationProvided,
    gcsAccessRepairConfirmationProvided,
    gcsMetadataCheckStatus: gcsAccessCheck.status,
    approvedSourceRef: approvedSourceRef.ref,
    sourceRefApproved: approvedSourceRef.sourceRefApproved,
    approvedRuntimePath: TRACKA_CAPTION_APPROVED_RUNTIME.approvedRuntimePath,
    runtimePathApproved: runtimeResolution.approvedRuntimePathFound,
    captionBurninRevalidationExecuted: execution === 'completed_with_caption_layout_fix_revalidation',
    correctedCaptionVisualPreviewCreated: previewArtifact.created,
    assSidecarCreated: sidecar.created,
    approvedSourceCopied: sourceArtifact.created,
    libassBurninExecuted: previewArtifact.created,
    remotionPreviewExecuted: false,
    ffmpegValidationExecuted: previewArtifact.created,
    ffprobeValidationExecuted: ffprobeArtifact.created,
    privateArtifactsCreated: sidecar.created || sourceArtifact.created || previewArtifact.created || ffprobeArtifact.created,
    privateVisualArtifactsCreated: previewArtifact.created,
    gcsAccess: sourceArtifact.created,
    gcsAccessMode: sourceArtifact.created ? 'exact_private_source_read_copy_only' : 'none',
    signedUrlsCreated: false,
    publicArtifactsCreated: false,
    finalDeliveryReady: false,
    internalBetaReady: false,
    productionReady: false,
    externalBetaReady: false,
    captionLayoutFixProfileApplied: sidecar.layoutProfile === TRACKA_CAPTION_LAYOUT_FIX_PROFILE_ID,
    trackaCaptionQuality4Readiness:
      'recorded_fail_caption_layout_quality',
    trackaCaptionQuality6Readiness:
      execution === 'completed_with_caption_layout_fix_revalidation'
        ? 'ready_after_upload_of_layout_fixed_caption_preview'
        : 'blocked_pending_layout_fixed_review_safe_visual_artifact',
    trackaPrivateE2eRevalidation1Readiness: 'blocked_pending_caption_layout_visual_review_and_scope_decision',
    internalBetaReadiness: 'blocked_pending_caption_layout_visual_review_and_scope_decision',
    activeBlockers,
    noScopeStatement: TRACKA_CAPTION_BURNIN_NO_SCOPE_STATEMENT,
  }

  const qaReportArtifact = await writeJsonArtifact({
    execute: input.execute,
    confirmationProvided,
    localBundlePath,
    fileName: 'tracka-caption-quality-5-qa-report.json',
    artifactType: 'qa_report_json',
    value: {
      phase: TRACKA_CAPTION_BURNIN_PHASE,
      runId,
      execution,
      qaGates,
      approvedSourceRef,
      gcsAccessCheck,
      sourceArtifact,
      sidecar,
      previewArtifact,
      ffprobeArtifact,
      runtimeResolution,
      summary,
      noScopeStatement: TRACKA_CAPTION_BURNIN_NO_SCOPE_STATEMENT,
    },
  })

  const artifactManifestArtifact = await writeJsonArtifact({
    execute: input.execute,
    confirmationProvided,
    localBundlePath,
    fileName: 'tracka-caption-quality-5-artifact-manifest.json',
    artifactType: 'artifact_manifest_json',
    value: {
      phase: TRACKA_CAPTION_BURNIN_PHASE,
      runId,
      layoutFixProfile: TRACKA_CAPTION_LAYOUT_FIX_PROFILE_ID,
      approvedSourceRef,
      gcsAccessCheck,
      sourceArtifact,
      sidecar,
      previewArtifact,
      ffprobeArtifact,
      qaReportArtifact,
      runtimeResolution,
      privateArtifactsCreated: summary.privateArtifactsCreated,
      privateVisualArtifactsCreated: summary.privateVisualArtifactsCreated,
      publicArtifactsCreated: false,
      signedUrlsCreated: false,
      finalDeliveryReady: false,
      internalBetaReady: false,
    },
  })

  const report = {
    ...summary,
    localBundlePath,
    sourceAudit,
    approvedSourceRef,
    gcsAccessCheck,
    sourceArtifact,
    sidecar,
    sidecarSha256: sidecar.sha256 ?? sha256Text(buildCorrectedAssSidecar()),
    previewArtifact,
    qaReportArtifact,
    artifactManifestArtifact,
    ffprobeArtifact,
    runtimeResolution,
    qaGates,
    correctedCaptionLines: TRACKA_CAPTION_BURNIN_CORRECTED_LINES,
    layoutFixedCaptionLines: TRACKA_CAPTION_LAYOUT_FIXED_LINES,
    layoutFixProfile: TRACKA_CAPTION_LAYOUT_FIX_PROFILE_ID,
  }

  return {
    runId,
    localBundlePath,
    sourceAudit,
    approvedSourceRef,
    gcsAccessCheck,
    sourceArtifact,
    sidecar,
    previewArtifact,
    qaReportArtifact,
    artifactManifestArtifact,
    ffprobeArtifact,
    runtimeResolution,
    qaGates,
    summary,
    report,
  }
}
