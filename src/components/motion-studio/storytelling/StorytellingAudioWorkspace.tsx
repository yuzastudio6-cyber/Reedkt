import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Headphones,
  LoaderCircle,
  LockKeyhole,
  MessageCircle,
  Mic2,
  Music2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Volume2,
  type LucideIcon,
} from 'lucide-react'

import {
  fetchMotionStudioPrivateAudioCandidate,
  fetchMotionStudioPrivateAudioMix,
  type MotionStudioPrivatePreviewMediaResult,
} from '../../../backend/api/motion-studio-api-client'
import type { UseMotionStudioAudioWorkspaceResult } from '../../../hooks/useMotionStudioAudioWorkspace'
import type { UseMotionStudioVoiceCastingWorkspaceResult } from '../../../hooks/useMotionStudioVoiceCastingWorkspace'
import type {
  MotionStudioAudioCandidateReviewSummaryDto,
  MotionStudioAudioMixArtifactDto,
  MotionStudioAudioMixBindingDto,
  MotionStudioAudioMixStemRole,
  MotionStudioAudioReviewSummaryDto,
} from '../../../types/motion-studio'
import {
  createMotionStudioAudioReviewPresentation,
  motionStudioAudioRoleDecisionLabel,
  motionStudioAudioRoleLabel,
} from '../../../lib/motion-studio/audio-review-ui-model'
import { Button } from '../../Button'
import { StorytellingNarratorDirection } from './StorytellingNarratorDirection'
import styles from './StorytellingAudioWorkspace.module.css'

interface StorytellingAudioWorkspaceProps {
  audio: UseMotionStudioAudioWorkspaceResult
  onReturnToChat: () => void
  voiceCasting: UseMotionStudioVoiceCastingWorkspaceResult
}

export function StorytellingAudioWorkspace({
  audio,
  onReturnToChat,
  voiceCasting,
}: StorytellingAudioWorkspaceProps) {
  return (
    <div className={styles.workspace}>
      <StorytellingNarratorDirection onReturnToChat={onReturnToChat} voiceCasting={voiceCasting} />
      <AudioWorkspaceState audio={audio} onReturnToChat={onReturnToChat} />
    </div>
  )
}

function AudioWorkspaceState({
  audio,
  onReturnToChat,
}: Omit<StorytellingAudioWorkspaceProps, 'voiceCasting'>) {
  if (audio.state === 'inactive' || audio.state === 'loading') {
    return (
      <AudioState
        icon={LoaderCircle}
        iconClassName={styles.spin}
        status="Loading audio"
        testId="storytelling-audio-state-loading"
        title="Checking this story's audio"
        body="Reading the current audio plan, private mix state, and review availability."
      />
    )
  }

  if (['permission_denied', 'not_found', 'conflict', 'failure'].includes(audio.state)) {
    return <AudioUnavailable audio={audio} />
  }

  if (audio.state === 'empty' || audio.state === 'planned') {
    const currentCandidate = currentCandidateDecision(audio.candidateReviews)
    if (currentCandidate) {
      return (
        <AudioCandidateReviewState
          candidate={currentCandidate}
          candidateReviews={audio.candidateReviews}
          onRefresh={() => { void audio.refresh() }}
          onReturnToChat={onReturnToChat}
          refreshing={audio.operation === 'refreshing'}
        />
      )
    }
    return (
      <AudioPlanningState
        audio={audio}
        onReturnToChat={onReturnToChat}
      />
    )
  }

  const currentCandidate = currentCandidateDecision(audio.candidateReviews)
  if (!audio.acceptanceReview && currentCandidate) {
    return (
      <AudioCandidateReviewState
        candidate={currentCandidate}
        candidateReviews={audio.candidateReviews}
        onRefresh={() => { void audio.refresh() }}
        onReturnToChat={onReturnToChat}
        refreshing={audio.operation === 'refreshing'}
      />
    )
  }

  if (audio.acceptanceReview) {
    if (!audio.acceptanceBinding?.artifact) {
      return (
        <AudioState
          action={<Button icon={RefreshCw} onClick={() => { void audio.refresh() }} variant="primary">Try again</Button>}
          icon={AlertTriangle}
          status="Needs attention"
          title="The reviewed audio version is incomplete"
          body="ReEditPro could not match this review to its exact private mix. Nothing was approved, changed, or made available for playback."
          tone="attention"
        />
      )
    }
    return (
      <AudioAcceptanceReviewState
        artifact={audio.acceptanceBinding.artifact}
        onRefresh={() => { void audio.refresh() }}
        onReturnToChat={onReturnToChat}
        refreshing={audio.operation === 'refreshing'}
        review={audio.acceptanceReview}
      />
    )
  }

  if (!audio.currentBinding) {
    return (
      <AudioState
        action={<Button icon={RefreshCw} onClick={() => { void audio.refresh() }} variant="primary">Try again</Button>}
        icon={AlertTriangle}
        status="Needs attention"
        title="The current audio state is incomplete"
        body="ReEditPro did not receive the exact mix version needed for this story. Nothing was approved or changed."
        tone="attention"
      />
    )
  }

  if (audio.state === 'ready_for_private_review' && audio.currentBinding.artifact) {
    return (
      <AudioReadyState
        artifact={audio.currentBinding.artifact}
        binding={audio.currentBinding}
        previousBindingCount={audio.previousBindingCount}
        refreshing={audio.operation === 'refreshing'}
        onRefresh={() => { void audio.refresh() }}
      />
    )
  }

  return (
    <AudioProgressState
      audio={audio}
      binding={audio.currentBinding}
      onReturnToChat={onReturnToChat}
    />
  )
}

function AudioCandidateReviewState({
  candidate,
  candidateReviews,
  onRefresh,
  onReturnToChat,
  refreshing,
}: {
  candidate: MotionStudioAudioCandidateReviewSummaryDto
  candidateReviews: readonly MotionStudioAudioCandidateReviewSummaryDto[]
  onRefresh: () => void
  onReturnToChat: () => void
  refreshing: boolean
}) {
  const presentation = candidateReviewPresentation(candidate)
  const CandidateIcon = candidate.role === 'music' ? Music2 : Sparkles
  const action = candidate.state === 'verifying' ? (
    <Button disabled={refreshing} icon={RefreshCw} onClick={onRefresh} variant="primary">
      {refreshing ? 'Checking…' : 'Check status'}
    </Button>
  ) : candidate.state === 'ready_for_review' ? undefined : (
    <Button icon={MessageCircle} onClick={onReturnToChat} variant="primary">
      {candidate.state === 'stale' ? 'Update in Chat' : 'Continue in Chat'}
    </Button>
  )

  return (
    <div className={styles.workspace} data-testid={`storytelling-audio-candidate-${candidate.state}`}>
      <AudioState
        action={action}
        body={presentation.body}
        icon={presentation.tone === 'attention' ? AlertTriangle : CandidateIcon}
        status={presentation.status}
        title={presentation.title}
        tone={presentation.tone}
      />

      {candidate.state === 'ready_for_review' && candidate.candidate ? (
        <>
          <dl aria-label="Audio candidate summary" className={styles.facts}>
            <div><dt>Type</dt><dd>{candidateRoleLabel(candidate.role)}</dd></div>
            <div><dt>Duration</dt><dd>{formatDuration(candidate.candidateDurationMilliseconds / 1_000)}</dd></div>
            <div><dt>Review</dt><dd>{candidate.requiredReviewCheckCount} checks after complete playback</dd></div>
          </dl>
          <PrivateAudioCandidatePlayer
            key={`${candidate.candidateReference}:${candidate.candidate.sha256}`}
            candidate={candidate.candidate}
            role={candidate.role}
          />
          <p className={styles.readOnlyNotice}>
            <LockKeyhole aria-hidden="true" size={15} />
            Listening does not make a review decision or add this version to the mix.
          </p>
        </>
      ) : null}

      <ul aria-label="Current audio candidate status" className={styles.roles}>
        {candidateReviews.map((item) => (
          <li key={item.candidateReference}>
            <AudioCandidateRoleIcon role={item.role} />
            <span>{candidateRoleLabel(item.role)}</span>
            <strong>{candidateReviewStatusLabel(item.state)}</strong>
          </li>
        ))}
      </ul>

      {candidate.state === 'ready_for_review' ? (
        <div className={styles.reviewNextStep}>
          <p>Finish the complete private preview. Review becomes available only after playback and every required check are verified.</p>
          <Button icon={MessageCircle} onClick={onReturnToChat} variant="ghost">Discuss in Chat</Button>
        </div>
      ) : null}
    </div>
  )
}

function AudioCandidateRoleIcon({ role }: { role: MotionStudioAudioCandidateReviewSummaryDto['role'] }) {
  const Icon = role === 'music' ? Music2 : Sparkles
  return <Icon aria-hidden="true" size={18} />
}

function AudioAcceptanceReviewState({
  artifact,
  onRefresh,
  onReturnToChat,
  refreshing,
  review,
}: {
  artifact: MotionStudioAudioMixArtifactDto
  onRefresh: () => void
  onReturnToChat: () => void
  refreshing: boolean
  review: MotionStudioAudioReviewSummaryDto
}) {
  const presentation = createMotionStudioAudioReviewPresentation(review)
  const action = presentation.action === 'refresh' ? (
    <Button disabled={refreshing} icon={RefreshCw} onClick={onRefresh} variant="ghost">
      {refreshing ? 'Checking…' : 'Refresh'}
    </Button>
  ) : (
    <Button icon={MessageCircle} onClick={onReturnToChat} variant="primary">
      {review.state === 'ready_for_review'
        ? 'Review in Chat'
        : review.state === 'rejected'
          ? 'Choose a new direction'
          : review.state === 'stale'
            ? 'Update in Chat'
            : 'Continue in Chat'}
    </Button>
  )
  const includedOptionalRoles = review.optionalRoles.filter((role) => role.decision === 'included')
  const playbackAllowed = !['rejected', 'stale'].includes(review.state)

  return (
    <div className={styles.workspace} data-testid={`storytelling-audio-review-${review.state}`}>
      <AudioState
        action={action}
        body={presentation.body}
        icon={presentation.tone === 'success' ? CheckCircle2 : presentation.tone === 'attention' ? AlertTriangle : Headphones}
        status={presentation.status}
        title={presentation.title}
        tone={presentation.tone}
      />

      <dl aria-label="Audio review summary" className={styles.facts}>
        <div>
          <dt>Narration</dt>
          <dd>{review.selectedNarrationSegmentCount} of {review.requiredNarrationSegmentCount} selected</dd>
        </div>
        <div>
          <dt>Sound layers</dt>
          <dd>{includedOptionalRoles.length > 0 ? countLabel(includedOptionalRoles.length, 'included role') : 'Narration only'}</dd>
        </div>
        <div>
          <dt>Quality</dt>
          <dd>{review.passedBlockingCheckCount} of {review.totalBlockingCheckCount} checks passed</dd>
        </div>
      </dl>

      {playbackAllowed ? (
        <PrivateAudioMixPlayer key={`${artifact.artifactId}:${artifact.sha256}`} artifact={artifact} />
      ) : (
        <p className={styles.playbackUnavailable} role="status">
          This previous private mix is retained for traceability, but playback is unavailable after rejection or invalidation.
        </p>
      )}

      <details className={styles.details}>
        <summary>Review decision and selected audio</summary>
        <div className={styles.reviewDetails}>
          {review.review ? (
            <div className={styles.reviewNote}>
              <strong>{review.review.decision === 'accepted' ? 'Accepted review' : review.review.decision === 'rejected' ? 'Rejected review' : 'Requested changes'}</strong>
              <p>{review.review.reason}</p>
            </div>
          ) : null}
          <ul aria-label="Selected audio roles" className={styles.roles}>
            <li>
              <Mic2 aria-hidden="true" size={18} />
              <span>Narration</span>
              <strong>{countLabel(review.selectedNarrationSegmentCount, 'selected take')}</strong>
            </li>
            {review.optionalRoles.map((role) => (
              <li key={role.role}>
                <AudioRoleIcon role={role.role} />
                <span>{motionStudioAudioRoleLabel(role.role)}</span>
                <strong>{motionStudioAudioRoleDecisionLabel(role)}</strong>
              </li>
            ))}
          </ul>
        </div>
      </details>

      <p className={styles.readOnlyNotice}>
        <LockKeyhole aria-hidden="true" size={15} />
        This review is read-only here. Revisions return through Chat and the existing plan approval boundary; no timeline, render, export, or delivery action starts from this surface.
      </p>
      {review.state === 'approved_locked' && review.fineCutHandoffEligible ? (
        <p className={styles.versionNote}>The exact accepted mix is locked for a later private Fine Cut handoff.</p>
      ) : null}
    </div>
  )
}

function AudioRoleIcon({ role }: { role: MotionStudioAudioReviewSummaryDto['optionalRoles'][number]['role'] }) {
  const Icon = role === 'music' ? Music2 : role === 'exact_sfx' ? Volume2 : Sparkles
  return <Icon aria-hidden="true" size={18} />
}

function AudioPlanningState({
  audio,
  onReturnToChat,
}: Omit<StorytellingAudioWorkspaceProps, 'voiceCasting'>) {
  const authority = audio.audioWorkspace?.audioAuthority

  return (
    <div className={styles.workspace} data-testid={`storytelling-audio-state-${audio.state}`}>
      <AudioState
        action={<Button icon={MessageCircle} onClick={onReturnToChat} variant="primary">Continue in Chat</Button>}
        icon={authority ? Sparkles : Volume2}
        status={authority ? 'Direction prepared' : 'Not started'}
        title={authority ? 'Audio direction is ready for planning' : 'Audio production has not started'}
        body={authority
          ? 'Narration, music, and sound direction are organized, but no playable private mix is available yet.'
          : 'Describe the narrator, musical tone, and sound approach in Chat. No audio work starts from this screen.'}
      />

      {authority ? (
        <dl aria-label="Audio planning summary" className={styles.facts}>
          <div><dt>Narration</dt><dd>{countLabel(authority.voiceSegments.length, 'segment')}</dd></div>
          <div><dt>Music</dt><dd>{countLabel(authority.musicCues.length, 'cue')}</dd></div>
          <div><dt>Sound</dt><dd>{countLabel(authority.soundEvents.length, 'planned cue')}</dd></div>
        </dl>
      ) : null}

      <ReadOnlyNotice />
    </div>
  )
}

function AudioProgressState({
  audio,
  binding,
  onReturnToChat,
}: {
  audio: UseMotionStudioAudioWorkspaceResult
  binding: MotionStudioAudioMixBindingDto
  onReturnToChat: () => void
}) {
  const presentation = bindingPresentation(binding.state)
  const needsChat = audio.state === 'attention_required'
  const action = needsChat ? (
    <Button icon={MessageCircle} onClick={onReturnToChat} variant="primary">Review in Chat</Button>
  ) : (
    <Button
      disabled={audio.operation === 'refreshing'}
      icon={RefreshCw}
      onClick={() => { void audio.refresh() }}
      variant="primary"
    >
      {audio.operation === 'refreshing' ? 'Checking…' : 'Check status'}
    </Button>
  )

  return (
    <div className={styles.workspace} data-testid={`storytelling-audio-state-${audio.state}`}>
      <AudioState
        action={action}
        icon={presentation.icon}
        status={presentation.status}
        title={presentation.title}
        body={presentation.body}
        tone={presentation.tone}
      />
      <MixRoleSummary binding={binding} />
      {audio.previousBindingCount > 0 ? (
        <p className={styles.versionNote}>{countLabel(audio.previousBindingCount, 'earlier version')} retained for traceability.</p>
      ) : null}
      <ReadOnlyNotice />
    </div>
  )
}

function AudioReadyState({
  artifact,
  binding,
  onRefresh,
  previousBindingCount,
  refreshing,
}: {
  artifact: MotionStudioAudioMixArtifactDto
  binding: MotionStudioAudioMixBindingDto
  onRefresh: () => void
  previousBindingCount: number
  refreshing: boolean
}) {
  const seconds = artifact.durationFrames / artifact.fps

  return (
    <div className={styles.workspace} data-testid="storytelling-audio-state-ready_for_private_review">
      <AudioState
        action={
          <Button disabled={refreshing} icon={RefreshCw} onClick={onRefresh} variant="ghost">
            {refreshing ? 'Checking…' : 'Refresh'}
          </Button>
        }
        icon={CheckCircle2}
        status="Ready for review"
        title="Private Storytelling mix is ready to hear"
        body="The narration-led mix passed its required checks and is available only inside this private review."
        tone="success"
      />

      <MixRoleSummary binding={binding} />

      <dl aria-label="Private audio mix summary" className={styles.facts}>
        <div><dt>Duration</dt><dd>{formatDuration(seconds)}</dd></div>
        <div><dt>Format</dt><dd>48 kHz stereo WAV</dd></div>
        <div><dt>Quality</dt><dd>{artifact.quality.gateResults.length} checks passed</dd></div>
      </dl>

      <PrivateAudioMixPlayer key={`${artifact.artifactId}:${artifact.sha256}`} artifact={artifact} />

      <details className={styles.details}>
        <summary>Review mix details</summary>
        <dl>
          <div><dt>Integrated loudness</dt><dd>{artifact.quality.integratedLufs.toFixed(1)} LUFS</dd></div>
          <div><dt>True peak</dt><dd>{artifact.quality.truePeakDbfs.toFixed(1)} dBFS</dd></div>
          <div><dt>Speech priority</dt><dd>{artifact.quality.speechPriorityRatio.toFixed(2)}×</dd></div>
        </dl>
      </details>

      {previousBindingCount > 0 ? (
        <p className={styles.versionNote}>{countLabel(previousBindingCount, 'earlier version')} retained for traceability.</p>
      ) : null}
      <ReadOnlyNotice />
    </div>
  )
}

function PrivateAudioMixPlayer({ artifact }: { artifact: MotionStudioAudioMixArtifactDto }) {
  return (
    <PrivateAudioPlayer
      accessibleLabel="Verified private Storytelling audio mix"
      fetchMedia={() => fetchMotionStudioPrivateAudioMix(
        artifact.artifactId,
        artifact.sha256,
        artifact.byteLength,
      )}
      idleBody="ReEditPro verifies the protected WAV bytes before enabling playback."
      idleTitle="Listen to the private mix"
      loadButtonLabel="Load private mix"
      readyBody="Listening does not approve, apply, export, or publish this version."
      readyTitle="Verified private mix"
      testIdPrefix="storytelling-audio-player"
    />
  )
}

function PrivateAudioCandidatePlayer({
  candidate,
  role,
}: {
  candidate: NonNullable<MotionStudioAudioCandidateReviewSummaryDto['candidate']>
  role: MotionStudioAudioCandidateReviewSummaryDto['role']
}) {
  const label = candidateRoleLabel(role).toLowerCase()
  return (
    <PrivateAudioPlayer
      accessibleLabel={`Verified private Storytelling ${label}`}
      fetchMedia={() => fetchMotionStudioPrivateAudioCandidate(
        candidate.candidateReference,
        candidate.sha256,
        candidate.byteLength,
      )}
      idleBody="ReEditPro verifies the exact private WAV before enabling playback."
      idleTitle={`Listen to the private ${label}`}
      loadButtonLabel="Load private audio"
      readyBody="Listening alone does not approve, select, mix, export, or publish this candidate."
      readyTitle={`Verified private ${label}`}
      testIdPrefix="storytelling-audio-candidate-player"
    />
  )
}

function PrivateAudioPlayer({
  accessibleLabel,
  fetchMedia,
  idleBody,
  idleTitle,
  loadButtonLabel,
  readyBody,
  readyTitle,
  testIdPrefix,
}: {
  accessibleLabel: string
  fetchMedia: () => Promise<MotionStudioPrivatePreviewMediaResult>
  idleBody: string
  idleTitle: string
  loadButtonLabel: string
  readyBody: string
  readyTitle: string
  testIdPrefix: string
}) {
  const [playback, setPlayback] = useState<
    | { state: 'idle' }
    | { state: 'loading' }
    | { state: 'ready'; url: string }
    | { state: 'failure'; message: string }
  >({ state: 'idle' })
  const requestSequence = useRef(0)
  const objectUrl = useRef<string | undefined>(undefined)

  useEffect(() => () => {
    requestSequence.current += 1
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current)
  }, [])

  async function loadPlayback() {
    const sequence = ++requestSequence.current
    if (objectUrl.current) {
      URL.revokeObjectURL(objectUrl.current)
      objectUrl.current = undefined
    }
    setPlayback({ state: 'loading' })
    const result = await fetchMedia()
    if (sequence !== requestSequence.current) return
    if (!result.ok) {
      setPlayback({ state: 'failure', message: safePlaybackMessage(result.statusCode) })
      return
    }
    const url = URL.createObjectURL(result.blob)
    objectUrl.current = url
    setPlayback({ state: 'ready', url })
  }

  if (playback.state === 'idle') {
    return (
      <section aria-label={idleTitle} className={styles.player} data-testid={`${testIdPrefix}-idle`}>
        <Headphones aria-hidden="true" size={22} />
        <div>
          <h4>{idleTitle}</h4>
          <p>{idleBody}</p>
        </div>
        <Button icon={Headphones} onClick={() => { void loadPlayback() }} variant="primary">{loadButtonLabel}</Button>
      </section>
    )
  }

  if (playback.state === 'loading') {
    return (
      <section className={styles.player} data-testid={`${testIdPrefix}-loading`}>
        <LoaderCircle aria-hidden="true" className={styles.spin} size={22} />
        <div aria-live="polite" role="status"><h4>Verifying private audio</h4><p>Checking the exact protected bytes before playback.</p></div>
        <Button disabled variant="secondary">Verifying…</Button>
      </section>
    )
  }

  if (playback.state === 'failure') {
    return (
      <section className={`${styles.player} ${styles.playerFailure}`} data-testid={`${testIdPrefix}-failure`}>
        <AlertTriangle aria-hidden="true" size={22} />
        <div aria-live="assertive" role="alert"><h4>Private playback could not open</h4><p>{playback.message}</p></div>
        <Button icon={RefreshCw} onClick={() => { void loadPlayback() }} variant="primary">Try playback again</Button>
      </section>
    )
  }

  return (
    <section aria-label={readyTitle} className={styles.playerReady} data-testid={`${testIdPrefix}-ready`}>
      <div className={styles.playerHeading}>
        <ShieldCheck aria-hidden="true" size={20} />
        <div>
          <h4>{readyTitle}</h4>
          <p>{readyBody}</p>
        </div>
      </div>
      <audio aria-label={accessibleLabel} controls preload="metadata" src={playback.url} />
    </section>
  )
}

function AudioUnavailable({ audio }: { audio: UseMotionStudioAudioWorkspaceResult }) {
  const denied = audio.state === 'permission_denied'
  const copy = unavailableCopy(audio.state)
  return (
    <div className={styles.workspace} data-testid={`storytelling-audio-state-${audio.state}`}>
      <AudioState
        action={denied ? undefined : (
          <Button icon={RefreshCw} onClick={() => { void audio.refresh() }} variant="primary">Try again</Button>
        )}
        icon={denied ? LockKeyhole : AlertTriangle}
        status={denied ? 'Access denied' : 'Needs attention'}
        title={copy.title}
        body={copy.body}
        tone="attention"
      />
    </div>
  )
}

function AudioState({
  action,
  body,
  icon: Icon,
  iconClassName,
  status,
  testId,
  title,
  tone = 'neutral',
}: {
  action?: ReactNode
  body: string
  icon: LucideIcon
  iconClassName?: string
  status: string
  testId?: string
  title: string
  tone?: 'neutral' | 'attention' | 'success'
}) {
  return (
    <section
      className={`${styles.decision} ${styles[tone]}`}
      data-testid={testId}
    >
      <span aria-hidden="true" className={`${styles.decisionIcon} ${iconClassName ?? ''}`}><Icon size={24} /></span>
      <div
        aria-live={tone === 'attention' ? 'assertive' : 'polite'}
        className={styles.decisionCopy}
        role={tone === 'attention' ? 'alert' : 'status'}
      >
        <span className={styles.status}>{status}</span>
        <h3>{title}</h3>
        <p>{body}</p>
      </div>
      {action ? <div className={styles.action}>{action}</div> : null}
    </section>
  )
}

function MixRoleSummary({ binding }: { binding: MotionStudioAudioMixBindingDto }) {
  const roles = new Set(binding.inputs.map((input) => input.role))
  return (
    <ul aria-label="Audio mix parts" className={styles.roles}>
      {(['narration', 'music', 'foley', 'exact_sfx'] as const).map((role) => {
        const presentation = rolePresentation(role)
        const Icon = presentation.icon
        return (
          <li key={role}>
            <Icon aria-hidden="true" size={18} />
            <span>{presentation.label}</span>
            <strong>{roles.has(role) ? 'Included' : 'Unavailable'}</strong>
          </li>
        )
      })}
    </ul>
  )
}

function ReadOnlyNotice() {
  return (
    <p className={styles.readOnlyNotice}>
      <LockKeyhole aria-hidden="true" size={15} />
      Mix playback and approvals remain read-only here. Narrator planning changes only the editable Voice Bible draft.
    </p>
  )
}

function bindingPresentation(state: MotionStudioAudioMixBindingDto['state']): {
  body: string
  icon: LucideIcon
  status: string
  title: string
  tone: 'neutral' | 'attention'
} {
  if (state === 'queued') return {
    body: 'The exact approved audio work is waiting for its private preparation turn.',
    icon: Clock3,
    status: 'Waiting',
    title: 'Audio mix is queued',
    tone: 'neutral',
  }
  if (state === 'in_progress') return {
    body: 'The private narration-led mix is being prepared. Refresh to read its latest durable state.',
    icon: LoaderCircle,
    status: 'In progress',
    title: 'Audio mix is being prepared',
    tone: 'neutral',
  }
  if (state === 'resumable') return {
    body: 'A previous attempt stopped safely. The existing work remains recoverable without changing the approved story.',
    icon: RefreshCw,
    status: 'Resumable',
    title: 'Audio preparation can resume',
    tone: 'neutral',
  }
  if (state === 'reconciliation_required') return {
    body: 'ReEditPro must verify the previous result before this audio version can continue.',
    icon: ShieldCheck,
    status: 'Verification required',
    title: 'Audio result needs verification',
    tone: 'attention',
  }
  if (state === 'failed') return {
    body: 'The latest private attempt did not finish. Your story and approved decisions were not changed.',
    icon: AlertTriangle,
    status: 'Needs attention',
    title: 'Audio preparation did not finish',
    tone: 'attention',
  }
  if (state === 'cancelled') return {
    body: 'This private audio attempt was stopped. Nothing was approved, applied, exported, or published.',
    icon: AlertTriangle,
    status: 'Stopped',
    title: 'Audio preparation was cancelled',
    tone: 'attention',
  }
  return {
    body: 'A required audio input or approved decision is missing. Continue in Chat to review what needs attention.',
    icon: AlertTriangle,
    status: 'Blocked',
    title: 'Audio preparation is blocked',
    tone: 'attention',
  }
}

function rolePresentation(role: MotionStudioAudioMixStemRole): { icon: LucideIcon; label: string } {
  if (role === 'narration') return { icon: Mic2, label: 'Narration' }
  if (role === 'music') return { icon: Music2, label: 'Music' }
  if (role === 'foley') return { icon: Sparkles, label: 'Foley' }
  return { icon: Volume2, label: 'Sound effects' }
}

function currentCandidateDecision(
  reviews: readonly MotionStudioAudioCandidateReviewSummaryDto[],
): MotionStudioAudioCandidateReviewSummaryDto | undefined {
  const priorities: readonly MotionStudioAudioCandidateReviewSummaryDto['state'][] = [
    'ready_for_review',
    'reviewed_rejected',
    'stale',
    'blocked',
    'verifying',
  ]
  for (const state of priorities) {
    const match = reviews.find((review) => review.state === state)
    if (match) return match
  }
  return undefined
}

function candidateReviewPresentation(candidate: MotionStudioAudioCandidateReviewSummaryDto): {
  body: string
  status: string
  title: string
  tone: 'neutral' | 'attention'
} {
  const role = candidateRoleLabel(candidate.role).toLowerCase()
  if (candidate.state === 'ready_for_review') return {
    body: `Listen to the complete private ${role} before making any decision. Playback does not select it or add it to the mix.`,
    status: 'Review needed',
    title: `${candidateRoleLabel(candidate.role)} is ready to hear`,
    tone: 'neutral',
  }
  if (candidate.state === 'reviewed_rejected') return {
    body: `The reviewed ${role} was rejected and remains retained for traceability. Continue in Chat to choose a safer next direction.`,
    status: 'Changes needed',
    title: `${candidateRoleLabel(candidate.role)} needs a new direction`,
    tone: 'attention',
  }
  if (candidate.state === 'stale') return {
    body: `The story, timing, or picture changed after this ${role} was prepared. Replanning is required before it can be reviewed again.`,
    status: 'Out of date',
    title: `${candidateRoleLabel(candidate.role)} must be updated`,
    tone: 'attention',
  }
  if (candidate.state === 'blocked') return {
    body: `A required private-media, rights, or quality check is incomplete. No candidate was selected or added to the mix.`,
    status: 'Blocked',
    title: `${candidateRoleLabel(candidate.role)} cannot be reviewed yet`,
    tone: 'attention',
  }
  return {
    body: `ReEditPro is verifying the exact private ${role}, its current story context, and review requirements.`,
    status: 'Verifying',
    title: `Preparing ${role} review`,
    tone: 'neutral',
  }
}

function candidateRoleLabel(role: MotionStudioAudioCandidateReviewSummaryDto['role']): string {
  return role === 'music' ? 'Music direction' : 'Synchronized scene sound'
}

function candidateReviewStatusLabel(
  state: MotionStudioAudioCandidateReviewSummaryDto['state'],
): string {
  if (state === 'ready_for_review') return 'Review needed'
  if (state === 'reviewed_passed') return 'Review passed'
  if (state === 'reviewed_rejected') return 'Changes needed'
  if (state === 'stale') return 'Out of date'
  if (state === 'blocked') return 'Blocked'
  return 'Verifying'
}

function unavailableCopy(state: UseMotionStudioAudioWorkspaceResult['state']): { title: string; body: string } {
  if (state === 'permission_denied') return {
    title: "This story's audio is not available",
    body: 'Your current workspace cannot read the private audio attached to this named edit.',
  }
  if (state === 'not_found') return {
    title: 'Audio workspace could not be found',
    body: 'The exact Storytelling production is no longer available at this address. Nothing was treated as empty.',
  }
  if (state === 'conflict') return {
    title: 'Audio changed while loading',
    body: 'Refresh the current named edit before reviewing audio so an older version is not shown.',
  }
  return {
    title: 'Audio could not be loaded',
    body: 'The current audio state is temporarily unavailable. Your story and review decisions were not changed.',
  }
}

function safePlaybackMessage(statusCode: number): string {
  if (statusCode === 401 || statusCode === 403) return 'This session cannot read the protected audio. Refresh your access and try again.'
  if (statusCode === 404) return 'The private audio version is no longer available.'
  if (statusCode === 409) return 'The protected audio did not match the approved review version.'
  return 'The protected audio could not be verified. Nothing was approved or changed.'
}

function countLabel(value: number, singular: string): string {
  return `${value} ${singular}${value === 1 ? '' : 's'}`
}

function formatDuration(seconds: number): string {
  const wholeSeconds = Math.max(0, Math.round(seconds))
  const minutes = Math.floor(wholeSeconds / 60)
  const remainder = wholeSeconds % 60
  return minutes > 0 ? `${minutes}:${String(remainder).padStart(2, '0')}` : `${remainder}s`
}
