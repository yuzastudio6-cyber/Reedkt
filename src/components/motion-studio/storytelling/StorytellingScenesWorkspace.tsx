import type { FormEvent, ReactNode } from 'react'
import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FilePlus2,
  Film,
  GitBranch,
  Layers3,
  LoaderCircle,
  LockKeyhole,
  MessageCircle,
  RefreshCw,
  type LucideIcon,
} from 'lucide-react'

import type { UseMotionStudioSceneWorkspaceResult } from '../../../hooks/useMotionStudioSceneWorkspace'
import type {
  MotionStudioSceneArtifactSummaryDto,
  MotionStudioSceneLayerType,
  MotionStudioTimelineProposalDto,
  ProductionMode,
} from '../../../types/motion-studio'
import { safeMotionStudioResourceMessage } from '../../../lib/motion-studio/user-facing-resource-message'
import { Button } from '../../Button'
import styles from './StorytellingScenesWorkspace.module.css'

const PRODUCTION_MODES: readonly { value: ProductionMode; label: string }[] = [
  { value: 'hybrid_directed', label: "Director's Hybrid" },
  { value: 'layered_first', label: 'Layered motion' },
  { value: 'native_graphics_first', label: 'Native graphics' },
  { value: 'footage_first', label: 'Existing footage' },
  { value: 'generative_first', label: 'Generated motion' },
]

const LAYER_TYPES: readonly { value: MotionStudioSceneLayerType; label: string }[] = [
  { value: 'image', label: 'Image' },
  { value: 'source_footage', label: 'Source footage' },
  { value: 'generated_video', label: 'Generated video' },
  { value: 'text', label: 'Exact text' },
  { value: 'caption', label: 'Caption' },
  { value: 'map', label: 'Map' },
  { value: 'chart', label: 'Chart' },
  { value: 'mask', label: 'Mask' },
  { value: 'audio', label: 'Audio cue' },
  { value: 'effect', label: 'Visual effect' },
]

interface StorytellingScenesWorkspaceProps {
  defaultProductionMode: ProductionMode
  onReturnToChat: () => void
  scenes: UseMotionStudioSceneWorkspaceResult
}

export function StorytellingScenesWorkspace({
  defaultProductionMode,
  onReturnToChat,
  scenes,
}: StorytellingScenesWorkspaceProps) {
  const [composerRequested, setComposerRequested] = useState(false)
  const [title, setTitle] = useState('')
  const [semanticPurpose, setSemanticPurpose] = useState('')
  const [productionMode, setProductionMode] = useState<ProductionMode>(defaultProductionMode)
  const [layerType, setLayerType] = useState<MotionStudioSceneLayerType>('image')
  const [zIndex, setZIndex] = useState(10)
  const [startAnchorId, setStartAnchorId] = useState('')
  const [endAnchorId, setEndAnchorId] = useState('')
  const [motionLanguageVersionId, setMotionLanguageVersionId] = useState('')
  const [narrativeFunctionVersionId, setNarrativeFunctionVersionId] = useState('')
  const [lastAction, setLastAction] = useState<string>()

  const workspace = scenes.workspace
  const sceneDocuments = useMemo(
    () => workspace?.artifacts.filter((artifact) => artifact.kind === 'scene_document') ?? [],
    [workspace],
  )
  const motionLanguages = useMemo(
    () => workspace?.artifacts.filter((artifact) => artifact.kind === 'motion_language') ?? [],
    [workspace],
  )
  const narrativeFunctions = useMemo(
    () => workspace?.artifacts.filter((artifact) => artifact.kind === 'narrative_function') ?? [],
    [workspace],
  )
  const anchors = workspace?.latestApprovedSnapshot?.timingAnchors ?? []
  const selectedMotionLanguageVersionId = selectCurrent(
    motionLanguages.map((artifact) => artifact.version.versionId),
    motionLanguageVersionId,
  )
  const selectedNarrativeFunctionVersionId = selectCurrent(
    narrativeFunctions.map((artifact) => artifact.version.versionId),
    narrativeFunctionVersionId,
  )
  const selectedStartAnchorId = selectCurrent(anchors.map((anchor) => anchor.id), startAnchorId)
  const selectedEndAnchorId = anchors.some((anchor) => anchor.id === endAnchorId)
    ? endAnchorId
    : anchors.length > 1 ? anchors.at(-1)?.id ?? '' : ''

  if (scenes.state === 'inactive') return null
  if (!workspace || ['loading', 'failure', 'permission_denied', 'conflict'].includes(scenes.state)) {
    return <SceneResourceState onRetry={() => { void scenes.refresh() }} scenes={scenes} />
  }

  const busy = scenes.operation !== 'idle'
  const snapshot = workspace.latestApprovedSnapshot
  const distinctAnchors = Boolean(
    selectedStartAnchorId && selectedEndAnchorId && selectedStartAnchorId !== selectedEndAnchorId,
  )
  const canCreate = Boolean(
    workspace.readiness.canAuthor && snapshot && title.trim() && semanticPurpose.trim() &&
    selectedMotionLanguageVersionId && selectedNarrativeFunctionVersionId && distinctAnchors && !busy,
  )
  const showComposer = sceneDocuments.length === 0 || composerRequested

  const createScene = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!snapshot || !canCreate) return
    setLastAction(undefined)
    const sceneTitle = title.trim()
    const created = await scenes.createScene({
      approvedSnapshotId: snapshot.id,
      title: sceneTitle,
      semanticPurpose: semanticPurpose.trim(),
      productionMode,
      startAnchorId: selectedStartAnchorId,
      endAnchorId: selectedEndAnchorId,
      layerType,
      assetIds: [],
      zIndex,
      motionLanguageVersionId: selectedMotionLanguageVersionId,
      narrativeFunctionVersionId: selectedNarrativeFunctionVersionId,
    })
    if (!created) return
    setTitle('')
    setSemanticPurpose('')
    setComposerRequested(false)
    setLastAction(`“${sceneTitle}” is now on the Scene Board as a new draft.`)
  }

  const compileScene = async (document: MotionStudioSceneArtifactSummaryDto) => {
    setLastAction(undefined)
    const compiled = await scenes.compileSceneDocument(
      document.artifactId,
      document.version.versionId,
      document.version.contentDigest,
    )
    if (compiled) setLastAction(`“${sceneTitle(document)}” now has a reviewable Timeline update. Nothing was applied.`)
  }

  return (
    <div className={styles.workspace} data-testid="storytelling-scenes-workspace">
      <SceneDecision
        action={sceneDocuments.length > 0 && workspace.readiness.canAuthor && !showComposer
          ? <Button icon={FilePlus2} onClick={() => setComposerRequested(true)} variant="primary">Add scene</Button>
          : undefined}
        body={sceneDocuments.length > 0
          ? 'Review each scene as a clear story beat. Construction and preview evidence stay folded until you need them.'
          : workspace.readiness.canAuthor
            ? 'Define one story beat. ReEditPro will preserve it as an exact scene draft under the approved plan.'
            : 'Scene work starts only after the story direction, timing, and current plan are ready.'}
        icon={sceneDocuments.length > 0 ? Film : Layers3}
        status={sceneDocuments.length > 0 ? `${countLabel(sceneDocuments.length, 'scene')} on this board` : 'Scene planning'}
        title={sceneDocuments.length > 0 ? 'Your Scene Board' : workspace.readiness.canAuthor ? 'Build the first scene' : 'Scenes are not ready yet'}
        tone={workspace.readiness.canAuthor ? 'neutral' : 'attention'}
      />

      {lastAction || scenes.operation !== 'idle' ? (
        <p aria-live="polite" className={styles.operation} role="status">
          {lastAction ?? operationLabel(scenes.operation)}
        </p>
      ) : null}

      {!workspace.readiness.canAuthor ? (
        <section className={styles.blocked} role="note">
          <div>
            <span className={styles.eyebrow}>What is needed</span>
            <ul>{workspace.readiness.blockers.map((blocker) => <li key={blocker}>{safeBlocker(blocker)}</li>)}</ul>
          </div>
          <Button icon={MessageCircle} onClick={onReturnToChat} variant="primary">Continue in Chat</Button>
        </section>
      ) : null}

      {showComposer && workspace.readiness.canAuthor ? (
        <SceneComposer
          anchors={anchors}
          busy={busy}
          canCreate={canCreate}
          endAnchorId={selectedEndAnchorId}
          frameRate={snapshot?.frameRate}
          layerType={layerType}
          motionLanguageVersionId={selectedMotionLanguageVersionId}
          motionLanguages={motionLanguages}
          narrativeFunctionVersionId={selectedNarrativeFunctionVersionId}
          narrativeFunctions={narrativeFunctions}
          onCancel={sceneDocuments.length > 0 ? () => setComposerRequested(false) : undefined}
          onEndAnchorChange={setEndAnchorId}
          onLayerTypeChange={setLayerType}
          onMotionLanguageChange={setMotionLanguageVersionId}
          onNarrativeFunctionChange={setNarrativeFunctionVersionId}
          onProductionModeChange={setProductionMode}
          onPurposeChange={setSemanticPurpose}
          onStartAnchorChange={setStartAnchorId}
          onSubmit={createScene}
          onTitleChange={setTitle}
          onZIndexChange={setZIndex}
          productionMode={productionMode}
          purpose={semanticPurpose}
          startAnchorId={selectedStartAnchorId}
          title={title}
          zIndex={zIndex}
        />
      ) : null}

      {sceneDocuments.length > 0 ? (
        <section aria-label="Current scene versions" className={styles.board}>
          <ol className={styles.sceneList}>
            {sceneDocuments.map((document, index) => {
              const proposal = currentProposal(document, workspace.proposals)
              const preview = scenes.previewWorkspace?.bindings.find((binding) =>
                binding.sceneDocument.versionId === document.version.versionId &&
                binding.sceneDocument.contentDigest === document.version.contentDigest)
              return (
                <SceneCard
                  canCompile={workspace.readiness.canCompile && !busy}
                  document={document}
                  frameRate={snapshot?.frameRate}
                  index={index}
                  key={document.version.versionId}
                  onCompile={() => { void compileScene(document) }}
                  previewState={preview?.status}
                  proposal={proposal}
                  timingAnchors={anchors}
                />
              )
            })}
          </ol>
        </section>
      ) : null}

      {scenes.warnings.length > 0 ? (
        <details className={styles.notices}>
          <summary>{countLabel(scenes.warnings.length, 'workspace note')}</summary>
          <ul>{scenes.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
        </details>
      ) : null}

      <p className={styles.boundary}>
        <LockKeyhole aria-hidden="true" size={15} />
        Scenes saves exact drafts and prepares reviewable Timeline updates only. It does not generate media, spend credits, render, or apply timeline changes.
      </p>
    </div>
  )
}

function SceneComposer({
  anchors,
  busy,
  canCreate,
  endAnchorId,
  frameRate,
  layerType,
  motionLanguageVersionId,
  motionLanguages,
  narrativeFunctionVersionId,
  narrativeFunctions,
  onCancel,
  onEndAnchorChange,
  onLayerTypeChange,
  onMotionLanguageChange,
  onNarrativeFunctionChange,
  onProductionModeChange,
  onPurposeChange,
  onStartAnchorChange,
  onSubmit,
  onTitleChange,
  onZIndexChange,
  productionMode,
  purpose,
  startAnchorId,
  title,
  zIndex,
}: {
  anchors: readonly { id: string; frame: number }[]
  busy: boolean
  canCreate: boolean
  endAnchorId: string
  frameRate?: number
  layerType: MotionStudioSceneLayerType
  motionLanguageVersionId: string
  motionLanguages: readonly MotionStudioSceneArtifactSummaryDto[]
  narrativeFunctionVersionId: string
  narrativeFunctions: readonly MotionStudioSceneArtifactSummaryDto[]
  onCancel?: () => void
  onEndAnchorChange: (value: string) => void
  onLayerTypeChange: (value: MotionStudioSceneLayerType) => void
  onMotionLanguageChange: (value: string) => void
  onNarrativeFunctionChange: (value: string) => void
  onProductionModeChange: (value: ProductionMode) => void
  onPurposeChange: (value: string) => void
  onStartAnchorChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onTitleChange: (value: string) => void
  onZIndexChange: (value: number) => void
  productionMode: ProductionMode
  purpose: string
  startAnchorId: string
  title: string
  zIndex: number
}) {
  return (
    <form aria-labelledby="storytelling-scene-composer-heading" className={styles.composer} onSubmit={onSubmit}>
      <div className={styles.sectionHeading}>
        <div>
          <span className={styles.eyebrow}>New scene</span>
          <h3 id="storytelling-scene-composer-heading">Define the story beat</h3>
        </div>
        {onCancel ? <Button onClick={onCancel} size="sm" variant="ghost">Cancel</Button> : null}
      </div>

      <label className={styles.field}>
        <span>Scene title</span>
        <input
          autoComplete="off"
          data-testid="storytelling-scene-title"
          disabled={busy}
          maxLength={200}
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder="Example: The evidence changes the timeline"
          required
          value={title}
        />
      </label>
      <label className={styles.field}>
        <span>What should the viewer understand or feel?</span>
        <textarea
          data-testid="storytelling-scene-purpose"
          disabled={busy}
          maxLength={2_000}
          onChange={(event) => onPurposeChange(event.target.value)}
          placeholder="Describe the purpose of this scene in the story."
          required
          rows={3}
          value={purpose}
        />
      </label>

      <details className={styles.advanced}>
        <summary>Timing and construction</summary>
        <div className={styles.advancedGrid}>
          <label className={styles.field}>
            <span>Starts at</span>
            <select data-testid="storytelling-scene-start" disabled={busy || anchors.length < 2} onChange={(event) => onStartAnchorChange(event.target.value)} value={startAnchorId}>
              {anchors.map((anchor) => <option key={anchor.id} value={anchor.id}>{anchorLabel(anchor, frameRate)}</option>)}
            </select>
          </label>
          <label className={styles.field}>
            <span>Ends at</span>
            <select data-testid="storytelling-scene-end" disabled={busy || anchors.length < 2} onChange={(event) => onEndAnchorChange(event.target.value)} value={endAnchorId}>
              {anchors.map((anchor) => <option key={anchor.id} value={anchor.id}>{anchorLabel(anchor, frameRate)}</option>)}
            </select>
          </label>
          <label className={styles.field}>
            <span>Build method</span>
            <select disabled={busy} onChange={(event) => onProductionModeChange(event.target.value as ProductionMode)} value={productionMode}>
              {PRODUCTION_MODES.map((mode) => <option key={mode.value} value={mode.value}>{mode.label}</option>)}
            </select>
          </label>
          <label className={styles.field}>
            <span>First visual layer</span>
            <select disabled={busy} onChange={(event) => onLayerTypeChange(event.target.value as MotionStudioSceneLayerType)} value={layerType}>
              {LAYER_TYPES.map((layer) => <option key={layer.value} value={layer.value}>{layer.label}</option>)}
            </select>
          </label>
          <label className={styles.field}>
            <span>Motion direction</span>
            <select disabled={busy || motionLanguages.length === 0} onChange={(event) => onMotionLanguageChange(event.target.value)} value={motionLanguageVersionId}>
              {motionLanguages.map((artifact) => <option key={artifact.version.versionId} value={artifact.version.versionId}>{artifact.label} · v{artifact.version.versionNumber}</option>)}
            </select>
          </label>
          <label className={styles.field}>
            <span>Story function</span>
            <select disabled={busy || narrativeFunctions.length === 0} onChange={(event) => onNarrativeFunctionChange(event.target.value)} value={narrativeFunctionVersionId}>
              {narrativeFunctions.map((artifact) => <option key={artifact.version.versionId} value={artifact.version.versionId}>{artifact.label} · v{artifact.version.versionNumber}</option>)}
            </select>
          </label>
          <label className={styles.field}>
            <span>Visual stacking order</span>
            <input disabled={busy} max={10_000} min={-10_000} onChange={(event) => onZIndexChange(Number(event.target.value))} step={1} type="number" value={zIndex} />
          </label>
        </div>
      </details>

      {startAnchorId && endAnchorId && startAnchorId === endAnchorId ? (
        <p className={styles.validation} role="alert">Choose different start and end points.</p>
      ) : null}

      <div className={styles.formActions}>
        <Button data-testid="storytelling-create-scene" disabled={!canCreate} icon={FilePlus2} type="submit" variant="primary">
          {busy ? 'Saving scene…' : 'Add to Scene Board'}
        </Button>
        <p>The current plan, timing, and creative direction are bound automatically.</p>
      </div>
    </form>
  )
}

function SceneCard({
  canCompile,
  document,
  frameRate,
  index,
  onCompile,
  previewState,
  proposal,
  timingAnchors,
}: {
  canCompile: boolean
  document: MotionStudioSceneArtifactSummaryDto
  frameRate?: number
  index: number
  onCompile: () => void
  previewState?: string
  proposal?: MotionStudioTimelineProposalDto
  timingAnchors: readonly { id: string; frame: number }[]
}) {
  const timing = sceneTiming(document, timingAnchors, frameRate)
  const continuity = document.storyContinuityReview
  const continuityAllowsCompile = !continuity ||
    ['ready_for_review', 'approved_locked'].includes(continuity.state)
  const currentProposal = continuityAllowsCompile ? proposal : undefined
  const status = currentProposal ? 'Timeline update ready' : versionStatus(document.state)
  return (
    <li>
      <article className={styles.sceneCard} data-testid="storytelling-scene-card">
        <div className={styles.sceneNumber} aria-hidden="true">{String(index + 1).padStart(2, '0')}</div>
        <div className={styles.sceneMain}>
          <div className={styles.sceneHeading}>
            <div>
              <span className={styles.sceneStatus}>{status}</span>
              <h4>{sceneTitle(document)}</h4>
              {document.semanticPurpose && document.semanticPurpose !== sceneTitle(document) ? <p>{document.semanticPurpose}</p> : null}
            </div>
            {currentProposal ? <CheckCircle2 aria-label="Timeline update ready" className={styles.readyIcon} size={20} /> : null}
          </div>

          {continuity ? <SceneContinuityReview continuity={continuity} /> : null}

          <dl className={styles.sceneFacts}>
            <div><dt>Timing</dt><dd><Clock3 aria-hidden="true" size={14} />{timing}</dd></div>
            <div><dt>Method</dt><dd>{document.productionMode ? productionModeLabel(document.productionMode) : 'Bound to current direction'}</dd></div>
            <div><dt>Build</dt><dd>{document.layerTypes?.length ? document.layerTypes.map(layerLabel).join(', ') : 'Awaiting layer detail'}</dd></div>
            <div><dt>Preview</dt><dd>{scenePreviewStatusLabel(previewState, continuity?.state)}</dd></div>
          </dl>

          <details className={styles.sceneDetails}>
            <summary>Scene details</summary>
            {continuity ? <p className={styles.continuitySummary}>{continuity.summary}</p> : null}
            <dl>
              <div><dt>Version</dt><dd>Version {document.version.versionNumber} · {versionStatus(document.state)}</dd></div>
              <div><dt>Shots</dt><dd>{countLabel(document.shotCount ?? 0, 'shot')}</dd></div>
              <div><dt>Layers</dt><dd>{countLabel(document.layerCount ?? 0, 'layer')}</dd></div>
              <div><dt>Assets</dt><dd>{countLabel(document.assetCount ?? 0, 'linked asset')}</dd></div>
              <div><dt>Keyframes</dt><dd>{countLabel(document.keyframeCount ?? 0, 'keyframe')}</dd></div>
              <div><dt>Precision</dt><dd>{precisionLabel(document)}</dd></div>
              {continuity?.arcRoleLabel ? <div><dt>Arc role</dt><dd>{continuity.arcRoleLabel}</dd></div> : null}
              {continuity?.throughLineLabel ? <div><dt>Through-line</dt><dd>{continuity.throughLineLabel}</dd></div> : null}
              {continuity?.arcRoleLabel ? <div><dt>Reveals</dt><dd>{countLabel(continuity.revealBeatCount, 'reveal beat')}</dd></div> : null}
              {continuity?.arcRoleLabel ? <div><dt>Transitions</dt><dd>{countLabel(continuity.transitionCount, 'story transition')}</dd></div> : null}
              {continuity?.arcRoleLabel ? <div><dt>Rhythm</dt><dd>{countLabel(continuity.rhythmBeatCount, 'rhythm beat')}</dd></div> : null}
              {continuity?.arcRoleLabel ? <div><dt>Open questions</dt><dd>{countLabel(continuity.unresolvedUncertaintyCount, 'open question')}</dd></div> : null}
            </dl>
          </details>

          <div className={styles.sceneFooter}>
            {currentProposal ? (
              <span><CheckCircle2 aria-hidden="true" size={15} />Ready for Timeline review; nothing has been applied.</span>
            ) : (
              <Button disabled={!canCompile || !continuityAllowsCompile} icon={ChevronRight} onClick={onCompile} size="sm" variant="secondary">
                Prepare for Timeline
              </Button>
            )}
          </div>
        </div>
      </article>
    </li>
  )
}

function SceneContinuityReview({
  continuity,
}: {
  continuity: NonNullable<MotionStudioSceneArtifactSummaryDto['storyContinuityReview']>
}) {
  const Icon = continuity.state === 'approved_locked'
    ? LockKeyhole
    : continuity.state === 'ready_for_review'
      ? GitBranch
      : continuity.state === 'not_ready'
        ? MessageCircle
        : AlertTriangle
  return (
    <section
      aria-label={`Story flow: ${continuity.statusLabel}`}
      className={`${styles.continuityReview} ${styles[continuityTone(continuity.state)]}`}
      data-state={continuity.state}
      data-testid="storytelling-scene-continuity-review"
    >
      <span aria-hidden="true" className={styles.continuityIcon}><Icon size={18} /></span>
      <div>
        <span className={styles.continuityStatus}>Story flow · {continuity.statusLabel}</span>
        <strong>{continuity.title}</strong>
        <span className={styles.continuityNext}>{continuity.nextAction.label}</span>
      </div>
    </section>
  )
}

function SceneResourceState({
  onRetry,
  scenes,
}: {
  onRetry: () => void
  scenes: UseMotionStudioSceneWorkspaceResult
}) {
  const loading = scenes.state === 'loading' || scenes.state === 'inactive'
  const denied = scenes.state === 'permission_denied'
  const conflict = scenes.state === 'conflict'
  return (
    <SceneDecision
      action={!loading && !denied ? <Button icon={RefreshCw} onClick={onRetry} variant="primary">Try again</Button> : undefined}
      body={loading
        ? 'Reading the exact current scene drafts, timing, Timeline readiness, and preview state for this named edit.'
        : denied
          ? 'Your current workspace cannot read the scenes attached to this named edit.'
          : conflict
            ? 'The scene plan changed while it was loading. Reload the current version before continuing.'
            : safeMotionStudioResourceMessage(
              scenes.message,
              'The Scene Board is temporarily unavailable. Your scene work is still preserved. Try again.',
            )}
      icon={loading ? LoaderCircle : denied ? LockKeyhole : AlertTriangle}
      iconClassName={loading ? styles.spin : undefined}
      status={loading ? 'Loading scenes' : denied ? 'Access denied' : 'Needs attention'}
      testId={`storytelling-scenes-state-${scenes.state.replaceAll('_', '-')}`}
      title={loading ? 'Checking the Scene Board' : denied ? 'Scenes are not available' : conflict ? 'Scene versions changed' : 'Scenes could not be loaded'}
      tone={loading ? 'neutral' : 'attention'}
    />
  )
}

function SceneDecision({
  action,
  body,
  icon: Icon,
  iconClassName,
  status,
  testId,
  title,
  tone,
}: {
  action?: ReactNode
  body: string
  icon: LucideIcon
  iconClassName?: string
  status: string
  testId?: string
  title: string
  tone: 'neutral' | 'attention'
}) {
  return (
    <section className={`${styles.decision} ${styles[tone]}`} data-testid={testId}>
      <span aria-hidden="true" className={`${styles.decisionIcon} ${iconClassName ?? ''}`}><Icon size={24} /></span>
      <div aria-live={tone === 'attention' ? 'assertive' : 'polite'} className={styles.decisionCopy} role={tone === 'attention' ? 'alert' : 'status'}>
        <span className={styles.status}>{status}</span>
        <h3>{title}</h3>
        <p>{body}</p>
      </div>
      {action ? <div className={styles.decisionAction}>{action}</div> : null}
    </section>
  )
}

function currentProposal(
  document: MotionStudioSceneArtifactSummaryDto,
  proposals: readonly MotionStudioTimelineProposalDto[],
): MotionStudioTimelineProposalDto | undefined {
  return proposals.find((proposal) =>
    proposal.sourceSceneDocument.versionId === document.version.versionId &&
    proposal.sourceSceneDocument.contentDigest === document.version.contentDigest)
}

function sceneTitle(document: MotionStudioSceneArtifactSummaryDto): string {
  return document.sceneTitle?.trim() || document.label
}

function sceneTiming(
  document: MotionStudioSceneArtifactSummaryDto,
  anchors: readonly { id: string; frame: number }[],
  frameRate?: number,
): string {
  if (!document.timing || !frameRate) return 'Bound to approved timing'
  const start = anchors.find((anchor) => anchor.id === document.timing?.startAnchorId)
  const end = anchors.find((anchor) => anchor.id === document.timing?.endAnchorId)
  if (!start || !end || end.frame <= start.frame) return 'Timing needs review'
  return `${formatTimestamp(start.frame / frameRate)}–${formatTimestamp(end.frame / frameRate)}`
}

function anchorLabel(anchor: { id: string; frame: number }, frameRate?: number): string {
  const humanName = anchor.id.replaceAll(/[-_.]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
  return frameRate ? `${humanName} · ${formatTimestamp(anchor.frame / frameRate)}` : humanName
}

function selectCurrent(values: readonly string[], requested: string): string {
  return values.includes(requested) ? requested : values[0] ?? ''
}

function safeBlocker(blocker: string): string {
  const lower = blocker.toLowerCase()
  if (lower.includes('approved plan snapshot')) return 'Approve the current plan before creating scenes.'
  if (lower.includes('motion language')) return 'Finish and approve the motion direction.'
  if (lower.includes('narrative function')) return 'Finish the story purpose for the scene.'
  if (lower.includes('scenedocument')) return 'Create a scene before preparing it for Timeline.'
  return 'The current plan is not ready for this scene action.'
}

function precisionLabel(document: MotionStudioSceneArtifactSummaryDto): string {
  if (document.exactDataRequired) return 'Exact text and data required'
  if (document.exactTextRequired) return 'Exact text required'
  return 'Visual interpretation allowed'
}

function productionModeLabel(mode: ProductionMode): string {
  return PRODUCTION_MODES.find((candidate) => candidate.value === mode)?.label ?? mode
}

function layerLabel(layer: MotionStudioSceneLayerType): string {
  return LAYER_TYPES.find((candidate) => candidate.value === layer)?.label ?? layer.replaceAll('_', ' ')
}

function versionStatus(state: MotionStudioSceneArtifactSummaryDto['state']): string {
  const labels: Partial<Record<MotionStudioSceneArtifactSummaryDto['state'], string>> = {
    draft: 'Draft',
    in_review: 'Needs review',
    approved: 'Approved',
    locked: 'Locked',
    rejected: 'Changes required',
    superseded: 'Superseded',
    archived: 'Archived',
  }
  return labels[state] ?? 'Current version'
}

function previewStatusLabel(state?: string): string {
  const labels: Record<string, string> = {
    queued: 'Queued',
    rendering: 'Preparing',
    failed: 'Needs retry',
    reconciliation_required: 'Needs review',
    cancelled: 'Cancelled',
    ready: 'Ready in Preview',
  }
  return state ? labels[state] ?? 'In progress' : 'Not prepared'
}

function scenePreviewStatusLabel(
  state: string | undefined,
  continuityState: NonNullable<MotionStudioSceneArtifactSummaryDto['storyContinuityReview']>['state'] | undefined,
): string {
  if (state === 'ready' && continuityState === 'stale') return 'Prior preview preserved'
  return previewStatusLabel(state)
}

function continuityTone(
  state: NonNullable<MotionStudioSceneArtifactSummaryDto['storyContinuityReview']>['state'],
): 'continuityCurrent' | 'continuityAttention' | 'continuityApproved' {
  if (state === 'approved_locked') return 'continuityApproved'
  if (state === 'ready_for_review') return 'continuityCurrent'
  return 'continuityAttention'
}

function operationLabel(operation: UseMotionStudioSceneWorkspaceResult['operation']): string {
  const labels: Record<UseMotionStudioSceneWorkspaceResult['operation'], string> = {
    idle: '',
    loading: 'Loading the Scene Board…',
    refreshing: 'Refreshing exact scene versions…',
    creating: 'Saving the new scene draft…',
    compiling: 'Preparing the Timeline update…',
    binding_preview: 'Preparing private preview authority…',
  }
  return labels[operation]
}

function formatTimestamp(seconds: number): string {
  const rounded = Math.max(0, Math.round(seconds))
  const minutes = Math.floor(rounded / 60)
  return `${String(minutes).padStart(2, '0')}:${String(rounded % 60).padStart(2, '0')}`
}

function countLabel(count: number, noun: string): string {
  return `${new Intl.NumberFormat('en-US').format(count)} ${noun}${count === 1 ? '' : 's'}`
}
