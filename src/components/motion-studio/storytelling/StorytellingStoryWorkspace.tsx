import type { ReactNode } from 'react'
import {
  AlertTriangle,
  BookOpenText,
  CheckCircle2,
  Clock3,
  FileText,
  LoaderCircle,
  LockKeyhole,
  MessageCircle,
  RefreshCw,
  type LucideIcon,
} from 'lucide-react'

import type { UseMotionStudioStoryWorkspaceResult } from '../../../hooks/useMotionStudioStoryWorkspace'
import type {
  MotionStudioPreparedScriptDto,
  MotionStudioStoryBibleDto,
  MotionStudioStoryScriptSegmentDto,
  MotionStudioStoryVersionAuthorityDto,
} from '../../../types/motion-studio'
import { Button } from '../../Button'
import { StorytellingMotionStyleDirection } from './StorytellingMotionStyleDirection'
import { StorytellingStoryContinuityReview } from './StorytellingStoryContinuityReview'
import { StorytellingStyleCalibrationReview } from './StorytellingStyleCalibrationReview'
import styles from './StorytellingStoryWorkspace.module.css'

interface StorytellingStoryWorkspaceProps {
  onDiscussStyle: (displayName: string) => void
  onReturnToChat: () => void
  story: UseMotionStudioStoryWorkspaceResult
}

export function StorytellingStoryWorkspace({ onDiscussStyle, onReturnToChat, story }: StorytellingStoryWorkspaceProps) {
  if (story.state === 'inactive' || story.state === 'loading') {
    return (
      <StoryState
        body="Reading the exact Story Bible and timed script attached to this named edit."
        icon={LoaderCircle}
        iconClassName={styles.spin}
        status="Loading story"
        testId="storytelling-story-state-loading"
        title="Checking the current story"
      />
    )
  }

  if (['permission_denied', 'not_found', 'conflict', 'failure'].includes(story.state)) {
    return <StoryUnavailable story={story} />
  }

  const workspace = story.workspace
  if (!workspace) {
    return (
      <StoryState
        action={<Button icon={RefreshCw} onClick={() => { void story.refresh() }} variant="primary">Try again</Button>}
        body="The Story response was incomplete, so no story or script was shown."
        icon={AlertTriangle}
        status="Needs attention"
        testId="storytelling-story-state-failure"
        title="Story could not be verified"
        tone="attention"
      />
    )
  }

  if (workspace.state === 'empty') {
    return (
      <div className={styles.workspace} data-testid="storytelling-story-state-empty">
        <StoryState
          action={<Button icon={MessageCircle} onClick={onReturnToChat} variant="primary">Shape story in Chat</Button>}
          body={workspace.notice}
          icon={BookOpenText}
          status="Not started"
          title="Your story starts in Chat"
        />
        <ReadOnlyNotice />
      </div>
    )
  }

  if (!workspace.storyBible) {
    return (
      <StoryState
        action={<Button icon={RefreshCw} onClick={() => { void story.refresh() }} variant="primary">Try again</Button>}
        body="The current Story Bible version was missing, so no partial story was displayed."
        icon={AlertTriangle}
        status="Needs attention"
        testId="storytelling-story-state-failure"
        title="Story authority is incomplete"
        tone="attention"
      />
    )
  }

  return (
    <div className={styles.workspace} data-testid={`storytelling-story-state-${workspace.state.replaceAll('_', '-')}`}>
      <CurrentStoryDecision
        onReturnToChat={onReturnToChat}
        preparedScript={workspace.preparedScript}
        storyBible={workspace.storyBible}
        notice={workspace.notice}
      />

      <StorytellingMotionStyleDirection
        decision={workspace.motionStyleDecision}
        key={`${workspace.motionStyleReview.catalogDigest}:${workspace.motionStyleDecision.state}:${workspace.motionStyleDecision.selectedStyleProfileId ?? 'none'}`}
        onDiscussStyle={onDiscussStyle}
        onReturnToChat={onReturnToChat}
        review={workspace.motionStyleReview}
      />

      <StorytellingStoryContinuityReview review={workspace.storyContinuityReview} />

      <StorytellingStyleCalibrationReview
        onReturnToChat={onReturnToChat}
        review={workspace.styleCalibrationReview}
      />

      {workspace.preparedScript ? (
        <>
          <ScriptFacts preparedScript={workspace.preparedScript} />
          <PreparedScriptView preparedScript={workspace.preparedScript} />
          <details className={styles.storyDisclosure}>
            <summary>Story Bible</summary>
            <StoryBibleContent storyBible={workspace.storyBible} />
          </details>
        </>
      ) : (
        <StoryBibleContent storyBible={workspace.storyBible} />
      )}

      <ReadOnlyNotice />
    </div>
  )
}

function CurrentStoryDecision({
  notice,
  onReturnToChat,
  preparedScript,
  storyBible,
}: {
  notice: string
  onReturnToChat: () => void
  preparedScript?: MotionStudioPreparedScriptDto
  storyBible: MotionStudioStoryBibleDto
}) {
  const current = preparedScript ?? storyBible
  const locked = isApprovedOrLocked(storyBible) && (!preparedScript || isApprovedOrLocked(preparedScript))
  const inReview = current.versionState === 'in_review'
  const status = locked ? 'Approved version' : inReview ? 'Needs review' : 'Current draft'
  const title = preparedScript
    ? locked ? 'Story and timed script are approved' : 'Timed script is ready to review'
    : locked ? 'Story understanding is approved' : 'Story understanding is ready'

  return (
    <StoryState
      action={<Button icon={MessageCircle} onClick={onReturnToChat} variant="primary">{locked ? 'Request revision in Chat' : 'Review in Chat'}</Button>}
      body={notice}
      icon={locked ? CheckCircle2 : preparedScript ? FileText : BookOpenText}
      status={status}
      title={title}
      tone={locked ? 'success' : inReview ? 'attention' : 'neutral'}
    />
  )
}

function ScriptFacts({ preparedScript }: { preparedScript: MotionStudioPreparedScriptDto }) {
  const durationSeconds = preparedScript.timing.durationFrames / preparedScript.timing.frameRate
  return (
    <dl aria-label="Current timed script summary" className={styles.facts}>
      <div><dt>Duration</dt><dd>{formatDuration(durationSeconds)}</dd></div>
      <div><dt>Chapters</dt><dd>{preparedScript.chapters.length}</dd></div>
      <div><dt>Narration</dt><dd>{countLabel(preparedScript.narrationSegmentCount, 'segment')}</dd></div>
      <div><dt>Frame</dt><dd>{preparedScript.timing.aspectRatio} · {formatNumber(preparedScript.timing.frameRate)} fps</dd></div>
    </dl>
  )
}

function PreparedScriptView({ preparedScript }: { preparedScript: MotionStudioPreparedScriptDto }) {
  return (
    <section aria-labelledby="storytelling-prepared-script-heading" className={styles.script}>
      <div className={styles.sectionHeader}>
        <div>
          <span className={styles.eyebrow}>Prepared script</span>
          <h3 id="storytelling-prepared-script-heading">{preparedScript.title}</h3>
          <p>{preparedScript.language} · Version {preparedScript.currentVersion.versionNumber} · {versionLabel(preparedScript.versionState)}</p>
        </div>
        <span className={styles.lockLabel}><LockKeyhole aria-hidden="true" size={15} />Exact text preserved</span>
      </div>

      <div className={styles.chapters}>
        {preparedScript.chapters.map((chapter) => (
          <details className={styles.chapter} key={`${chapter.order}:${chapter.title}`} open={chapter.order === 0}>
            <summary>
              <span><strong>{chapter.title}</strong><small>Chapter {chapter.order + 1}</small></span>
              <span>{countLabel(chapter.narrationSegments.length, 'narration segment')}</span>
            </summary>
            {chapter.narrationSegments.length > 0 ? (
              <ol aria-label={`${chapter.title} narration`} className={styles.segments}>
                {chapter.narrationSegments.map((segment) => (
                  <ScriptSegment
                    frameRate={preparedScript.timing.frameRate}
                    key={segment.order}
                    segment={segment}
                  />
                ))}
              </ol>
            ) : (
              <p className={styles.emptyChapter}>No narration is assigned to this chapter yet.</p>
            )}
          </details>
        ))}
      </div>
    </section>
  )
}

function ScriptSegment({
  frameRate,
  segment,
}: {
  frameRate: number
  segment: MotionStudioStoryScriptSegmentDto
}) {
  const start = segment.startFrame / frameRate
  const end = segment.endFrame / frameRate
  const evidenceCount = segment.claimCount + segment.sourceReferenceCount

  return (
    <li className={styles.segment}>
      <span className={styles.timecode}><Clock3 aria-hidden="true" size={14} />{formatTimestamp(start)}–{formatTimestamp(end)}</span>
      <blockquote>{segment.text}</blockquote>
      <details className={styles.segmentDetails}>
        <summary>Meaning and visual direction</summary>
        <dl>
          <div><dt>Meaning</dt><dd>{segment.meaning}</dd></div>
          <div><dt>Visual cue</dt><dd>{segment.visualCue}</dd></div>
          <div><dt>Evidence links</dt><dd>{evidenceCount > 0 ? countLabel(evidenceCount, 'reference') : 'No linked references'}</dd></div>
        </dl>
      </details>
    </li>
  )
}

function StoryBibleContent({ storyBible }: { storyBible: MotionStudioStoryBibleDto }) {
  return (
    <section aria-label="Current Story Bible" className={styles.storyBible}>
      <div className={styles.premise}>
        <span className={styles.eyebrow}>Premise</span>
        <p>{storyBible.premise}</p>
      </div>

      <dl className={styles.direction}>
        <div><dt>Narrative angle</dt><dd>{storyBible.narrativeAngle}</dd></div>
        <div><dt>Narrator</dt><dd>{storyBible.narratorPerspective}</dd></div>
      </dl>

      <div className={styles.storySections}>
        <StoryList label="Outline" values={storyBible.chapters} ordered />
        <StoryList label="Emotional arc" values={storyBible.emotionalArc} />
        {storyBible.events.length > 0 ? <StoryList label="Key events" values={storyBible.events} /> : null}
        {storyBible.people.length > 0 ? <StoryList label="People" values={storyBible.people} /> : null}
        {storyBible.locations.length > 0 ? <StoryList label="Locations" values={storyBible.locations} /> : null}
      </div>

      <p className={styles.versionNote}>
        Story Bible version {storyBible.currentVersion.versionNumber} · {versionLabel(storyBible.versionState)}
        {storyBible.approvedDecisionCount > 0 ? ` · ${countLabel(storyBible.approvedDecisionCount, 'approved decision')}` : ''}
      </p>
    </section>
  )
}

function StoryList({ label, ordered = false, values }: { label: string; ordered?: boolean; values: readonly string[] }) {
  const List = ordered ? 'ol' : 'ul'
  return (
    <section className={styles.storyList}>
      <h4>{label}</h4>
      <List>
        {values.map((value, index) => <li key={`${index}:${value}`}>{value}</li>)}
      </List>
    </section>
  )
}

function StoryUnavailable({ story }: { story: UseMotionStudioStoryWorkspaceResult }) {
  const denied = story.state === 'permission_denied'
  const notFound = story.state === 'not_found'
  const conflict = story.state === 'conflict'
  return (
    <StoryState
      action={denied ? undefined : <Button icon={RefreshCw} onClick={() => { void story.refresh() }} variant="primary">Try again</Button>}
      body={denied
        ? 'Your current workspace cannot read the Story Bible or script attached to this named edit.'
        : notFound
          ? 'The exact Storytelling production could not be found. Return to Chat before trying again.'
          : conflict
            ? 'The story changed while it was loading. Reload the exact current version before reviewing it.'
            : story.message ?? 'The Story workspace is temporarily unavailable. Nothing was treated as empty.'}
      icon={denied ? LockKeyhole : AlertTriangle}
      status={denied ? 'Access denied' : 'Needs attention'}
      testId={`storytelling-story-state-${story.state.replaceAll('_', '-')}`}
      title={denied ? 'This story is not available' : conflict ? 'Story version changed' : 'Story could not be loaded'}
      tone="attention"
    />
  )
}

function StoryState({
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
    <section className={`${styles.decision} ${styles[tone]}`} data-testid={testId}>
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

function ReadOnlyNotice() {
  return (
    <p className={styles.readOnlyNotice}>
      <LockKeyhole aria-hidden="true" size={15} />
      Story is read-only here. Revisions return through Chat and create new versions; approved versions are never overwritten.
    </p>
  )
}

function isApprovedOrLocked(authority: MotionStudioStoryVersionAuthorityDto): boolean {
  return authority.versionState === 'approved' || authority.versionState === 'locked'
}

function versionLabel(state: MotionStudioStoryVersionAuthorityDto['versionState']): string {
  const labels: Record<MotionStudioStoryVersionAuthorityDto['versionState'], string> = {
    draft: 'Draft',
    in_review: 'Needs review',
    approved: 'Approved',
    locked: 'Locked',
  }
  return labels[state]
}

function countLabel(count: number, noun: string): string {
  return `${formatNumber(count)} ${noun}${count === 1 ? '' : 's'}`
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value)
}

function formatDuration(seconds: number): string {
  const rounded = Math.max(0, Math.round(seconds))
  const minutes = Math.floor(rounded / 60)
  const remainder = rounded % 60
  return minutes > 0 ? `${minutes}m ${remainder}s` : `${remainder}s`
}

function formatTimestamp(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds))
  const minutes = Math.floor(whole / 60)
  const remainder = whole % 60
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
}
