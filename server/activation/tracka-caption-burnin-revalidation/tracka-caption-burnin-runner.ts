import { createHash } from 'node:crypto'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import {
  TRACKA_CAPTION_BURNIN_CORRECTED_LINES,
  TRACKA_CAPTION_BURNIN_LOCAL_ROOT,
  TRACKA_CAPTION_BURNIN_NO_SCOPE_STATEMENT,
  TRACKA_CAPTION_BURNIN_PHASE,
  TRACKA_CAPTION_BURNIN_REJECTED_TEXT,
  TRACKA_CAPTION_BURNIN_SOURCE_CHAIN,
  getTrackaCaptionBurninRunId,
  isTrackaCaptionBurninConfirmed,
} from './tracka-caption-burnin-policy'
import type {
  TrackaCaptionBurninBundle,
  TrackaCaptionBurninExecutionStatus,
  TrackaCaptionBurninQaGate,
  TrackaCaptionBurninRuntimeResolution,
  TrackaCaptionBurninSidecarArtifact,
  TrackaCaptionBurninSourceAudit,
  TrackaCaptionBurninSummary,
} from './tracka-caption-burnin-types'

function sha256Text(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function sha256File(filePath: string): string {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex')
}

function readOptional(filePath: string): string {
  return existsSync(filePath) ? readFileSync(filePath, 'utf8') : ''
}

export function buildCorrectedAssSidecar(): string {
  const dialogue = TRACKA_CAPTION_BURNIN_CORRECTED_LINES.map((line, index) => {
    const startSecond = index * 3
    const endSecond = startSecond + 2
    const start = `0:00:${String(startSecond).padStart(2, '0')}.00`
    const end = `0:00:${String(endSecond).padStart(2, '0')}.80`
    return `Dialogue: 0,${start},${end},Default,,0,0,0,,${line}`
  }).join('\n')

  const ass = `[Script Info]
Title: TRACKA-CAPTION-QUALITY-3R Corrected Controlled Test Captions
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
YCbCr Matrix: TV.709

[V4+ Styles]
Format: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding
Style: Default,Arial,48,&H00FFFFFF,&H000000FF,&H00111111,&H99000000,0,0,0,0,100,100,0,0,1,3,1,2,80,80,90,1

[Events]
Format: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text
${dialogue}
`

  if (ass.includes(TRACKA_CAPTION_BURNIN_REJECTED_TEXT)) {
    throw new Error('Corrected ASS sidecar unexpectedly contains rejected #419 caption text.')
  }
  return ass
}

function buildSourceAudit(): TrackaCaptionBurninSourceAudit {
  const approvedCaptionManifest = readOptional('docs/track-a/track-a-caption-quality-3-approved-caption-input-manifest.md')
  const executionPacket = readOptional('docs/track-a/track-a-caption-quality-3-execution-result.md')
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

  return {
    status: activeBlockers.length > 0 ? 'blocked' : 'passed',
    sourceChainMerged: true,
    sourcePrs: [...TRACKA_CAPTION_BURNIN_SOURCE_CHAIN],
    approvedCaptionSourcePath: 'docs/track-a/track-a-caption-quality-3-approved-caption-input-manifest.md',
    executionPacketPath: 'docs/track-a/track-a-caption-quality-3-execution-result.md',
    oldCaptionRejected: true,
    activeBlockers,
  }
}

function resolveRuntimePath(): TrackaCaptionBurninRuntimeResolution {
  const evidencePaths = [
    'docs/track-a/track-a-missing-visual-evidence-1-local-manifest.md',
    'docs/track-a/track-a-missing-visual-evidence-2-artifact-review-results.md',
    'docs/track-a/track-a-caption-quality-3-libass-burnin-execution-contract.md',
  ]
  return {
    approvedPrivateSourceRefFound: false,
    approvedRuntimePathFound: false,
    attemptedGcsAccess: false,
    attemptedFfmpeg: false,
    attemptedFfprobe: false,
    attemptedRemotion: false,
    blocker: 'blocked_missing_approved_private_source_ref',
    rejectedCandidateReason:
      'Merged evidence contains old-caption visual samples and private review artifacts, but no clean approved private controlled-test source ref for corrected-caption burn-in.',
    evidencePaths,
  }
}

async function maybeWriteSidecar(input: {
  execute: boolean
  confirmationProvided: boolean
  localBundlePath: string
}): Promise<TrackaCaptionBurninSidecarArtifact> {
  if (!input.execute || !input.confirmationProvided) {
    return { created: false, lineCount: TRACKA_CAPTION_BURNIN_CORRECTED_LINES.length }
  }

  const ass = buildCorrectedAssSidecar()
  await mkdir(input.localBundlePath, { recursive: true })
  const localPath = path.join(input.localBundlePath, 'tracka-caption-quality-3r-corrected-caption.ass')
  await writeFile(localPath, ass)
  const stat = statSync(localPath)
  return {
    created: true,
    localPath,
    sha256: sha256File(localPath),
    sizeBytes: stat.size,
    lineCount: TRACKA_CAPTION_BURNIN_CORRECTED_LINES.length,
  }
}

function buildQaGates(input: {
  sourceAudit: TrackaCaptionBurninSourceAudit
  sidecar: TrackaCaptionBurninSidecarArtifact
  runtimeResolution: TrackaCaptionBurninRuntimeResolution
  confirmationProvided: boolean
}): TrackaCaptionBurninQaGate[] {
  return [
    {
      gateId: 'confirmation_env_present',
      status: input.confirmationProvided ? 'passed' : 'blocked',
      evidence: 'REEDITPRO_CONFIRM_TRACKA_CAPTION_BURNIN_REVALIDATION=true required for guarded execution.',
    },
    {
      gateId: 'approved_caption_source_loaded',
      status: input.sourceAudit.status,
      evidence: input.sourceAudit.approvedCaptionSourcePath,
    },
    {
      gateId: 'transcript_accuracy_false',
      status: input.sourceAudit.activeBlockers.some((item) => item.includes('transcriptAccuracyClaim')) ? 'blocked' : 'passed',
      evidence: 'transcriptAccuracyClaim remains false.',
    },
    {
      gateId: 'old_caption_rejected',
      status: input.sourceAudit.oldCaptionRejected ? 'passed' : 'blocked',
      evidence: 'Rejected #419 caption text is not written to 3R sidecar/report artifacts.',
    },
    {
      gateId: 'corrected_sidecar_checksum',
      status: input.sidecar.created && Boolean(input.sidecar.sha256) ? 'passed' : 'blocked',
      evidence: input.sidecar.sha256 ?? 'blocked until confirmation.',
    },
    {
      gateId: 'approved_private_source_ref',
      status: input.runtimeResolution.approvedPrivateSourceRefFound ? 'passed' : 'blocked',
      evidence: input.runtimeResolution.rejectedCandidateReason,
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
      status: 'blocked',
      evidence: 'Corrected-caption visual review remains blocked until a review-safe preview exists.',
    },
  ]
}

function statusFor(input: {
  execute: boolean
  confirmationProvided: boolean
  sourceAudit: TrackaCaptionBurninSourceAudit
  runtimeResolution: TrackaCaptionBurninRuntimeResolution
}): TrackaCaptionBurninExecutionStatus {
  if (!input.execute || !input.confirmationProvided) return 'blocked_pending_caption_burnin_execution_confirmation'
  if (input.sourceAudit.status === 'blocked') return 'blocked_missing_approved_private_source_ref'
  if (!input.runtimeResolution.approvedPrivateSourceRefFound) return input.runtimeResolution.blocker
  if (!input.runtimeResolution.approvedRuntimePathFound) return 'blocked_missing_approved_caption_burnin_runtime_path'
  return 'completed_with_guarded_caption_burnin_revalidation'
}

export async function buildTrackaCaptionBurninBundle(input: {
  execute: boolean
  runId?: string
}): Promise<TrackaCaptionBurninBundle> {
  const runId = input.runId ?? getTrackaCaptionBurninRunId()
  const localBundlePath = path.join(TRACKA_CAPTION_BURNIN_LOCAL_ROOT, runId)
  const confirmationProvided = isTrackaCaptionBurninConfirmed()
  const sourceAudit = buildSourceAudit()
  const runtimeResolution = resolveRuntimePath()
  const sidecar = await maybeWriteSidecar({ execute: input.execute, confirmationProvided, localBundlePath })
  const execution = statusFor({ execute: input.execute, confirmationProvided, sourceAudit, runtimeResolution })
  const qaGates = buildQaGates({ sourceAudit, sidecar, runtimeResolution, confirmationProvided })
  const activeBlockers = [
    ...sourceAudit.activeBlockers,
    ...(confirmationProvided ? [] : ['blocked_pending_caption_burnin_execution_confirmation']),
    ...(runtimeResolution.approvedPrivateSourceRefFound ? [] : [runtimeResolution.blocker]),
    ...qaGates.filter((gate) => gate.status === 'blocked').map((gate) => `qa_gate_blocked:${gate.gateId}`),
  ].filter((value, index, list) => list.indexOf(value) === index)

  const summary: TrackaCaptionBurninSummary = {
    phase: TRACKA_CAPTION_BURNIN_PHASE,
    runId,
    execution,
    confirmationProvided,
    captionBurninRevalidationExecuted: execution === 'completed_with_guarded_caption_burnin_revalidation',
    assSidecarCreated: sidecar.created,
    libassBurninExecuted: false,
    remotionPreviewExecuted: false,
    ffmpegValidationExecuted: false,
    ffprobeValidationExecuted: false,
    privateArtifactsCreated: sidecar.created,
    privateVisualArtifactsCreated: false,
    gcsAccess: false,
    signedUrlsCreated: false,
    publicArtifactsCreated: false,
    finalDeliveryReady: false,
    internalBetaReady: false,
    productionReady: false,
    externalBetaReady: false,
    trackaCaptionQuality4Readiness: sidecar.created
      ? 'blocked_pending_review_safe_visual_artifact'
      : 'blocked_pending_execution',
    trackaPrivateE2eRevalidation1Readiness: 'blocked_pending_caption_burnin_visual_review_and_scope_decision',
    internalBetaReadiness: 'blocked_pending_caption_burnin_visual_review_and_scope_decision',
    activeBlockers,
    noScopeStatement: TRACKA_CAPTION_BURNIN_NO_SCOPE_STATEMENT,
  }

  const report = {
    ...summary,
    localBundlePath,
    sourceAudit,
    sidecar,
    sidecarSha256: sidecar.sha256 ?? sha256Text(buildCorrectedAssSidecar()),
    runtimeResolution,
    qaGates,
    correctedCaptionLines: TRACKA_CAPTION_BURNIN_CORRECTED_LINES,
  }

  return {
    runId,
    localBundlePath,
    sourceAudit,
    sidecar,
    runtimeResolution,
    qaGates,
    summary,
    report,
  }
}
