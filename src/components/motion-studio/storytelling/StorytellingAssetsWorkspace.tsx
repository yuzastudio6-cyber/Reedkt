import type { ReactNode } from 'react'
import {
  AlertTriangle,
  Clock3,
  FileImage,
  Film,
  Layers3,
  LoaderCircle,
  LockKeyhole,
  MessageCircle,
  RefreshCw,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'

import type { UseMotionStudioGenerationWorkspaceResult } from '../../../hooks/useMotionStudioGenerationWorkspace'
import type { UseMotionStudioLayeredWorkspaceResult } from '../../../hooks/useMotionStudioLayeredWorkspace'
import type { UseMotionStudioSceneWorkspaceResult } from '../../../hooks/useMotionStudioSceneWorkspace'
import type {
  MotionStudioGenerationBindingDto,
  MotionStudioLayeredAssemblyDto,
  MotionStudioPreviewBindingDto,
  MotionStudioSceneWorkspaceDto,
  MotionStudioVersionReference,
} from '../../../types/motion-studio'
import { Button } from '../../Button'
import styles from './StorytellingAssetsWorkspace.module.css'

interface StorytellingAssetsWorkspaceProps {
  generationWorkspace: UseMotionStudioGenerationWorkspaceResult
  layeredWorkspace: UseMotionStudioLayeredWorkspaceResult
  onReturnToChat: () => void
  sceneWorkspace: UseMotionStudioSceneWorkspaceResult
}

type AssetTone = 'neutral' | 'attention' | 'success'
type AssetKind = 'preview' | 'generated' | 'layered'

const ASSET_ICONS: Readonly<Record<AssetKind, LucideIcon>> = {
  preview: Film,
  generated: FileImage,
  layered: Layers3,
}

interface AssetFact {
  label: string
  value: string
}

interface AssetRecordView {
  key: string
  kind: AssetKind
  label: string
  title: string
  status: string
  tone: AssetTone
  body: string
  facts: readonly AssetFact[]
}

interface AssetProjection {
  assets: readonly AssetRecordView[]
  previousRecordCount: number
  unscopedRecordCount: number
  integrityFailure: boolean
  hasApprovedSnapshot: boolean
}

export function StorytellingAssetsWorkspace({
  generationWorkspace,
  layeredWorkspace,
  onReturnToChat,
  sceneWorkspace,
}: StorytellingAssetsWorkspaceProps) {
  const initialLoading = sceneWorkspace.state === 'inactive' || sceneWorkspace.state === 'loading' ||
    generationWorkspace.state === 'inactive' || generationWorkspace.state === 'loading' ||
    layeredWorkspace.state === 'inactive' || layeredWorkspace.state === 'loading'

  if (initialLoading) {
    return (
      <AssetState
        body="Reading the exact visual records attached to this Storytelling edit."
        icon={LoaderCircle}
        iconClassName={styles.spin}
        status="Loading assets"
        testId="storytelling-assets-state-loading"
        title="Checking the current approved story version"
      />
    )
  }

  if (['permission_denied', 'conflict', 'failure'].includes(sceneWorkspace.state)) {
    return <AssetsUnavailable onRetry={() => { void refreshAll(sceneWorkspace, layeredWorkspace, generationWorkspace) }} sceneWorkspace={sceneWorkspace} />
  }

  const projection = projectAssets(
    sceneWorkspace.workspace,
    sceneWorkspace.previewWorkspace,
    layeredWorkspace.workspace?.assemblies ?? [],
    generationWorkspace.workspace?.bindings ?? [],
    generationWorkspace.liveWorkspace,
  )

  if (projection.integrityFailure) {
    return (
      <AssetState
        action={<Button icon={RefreshCw} onClick={() => { void refreshAll(sceneWorkspace, layeredWorkspace, generationWorkspace) }} variant="primary">Try again</Button>}
        body="A current asset record did not match its approved SceneDocument and timeline proposal. Nothing was accepted, replaced, or changed."
        icon={AlertTriangle}
        status="Needs attention"
        testId="storytelling-assets-state-failure"
        title="Current asset lineage could not be verified"
        tone="attention"
      />
    )
  }

  const partialSources = unavailableSources(sceneWorkspace, layeredWorkspace, generationWorkspace)
  if (!projection.hasApprovedSnapshot || projection.assets.length === 0) {
    return (
      <div className={styles.workspace} data-testid="storytelling-assets-state-empty">
        <AssetState
          action={<Button icon={MessageCircle} onClick={onReturnToChat} variant="primary">Continue in Chat</Button>}
          body={projection.hasApprovedSnapshot
            ? 'The approved story version has no exact preview, layered, or generated-visual record attached yet.'
            : 'Confirm the story, output frame, timing, and plan through the existing review and approval flow first.'}
          icon={projection.hasApprovedSnapshot ? FileImage : Clock3}
          status={projection.hasApprovedSnapshot ? 'No current assets' : 'Plan not approved'}
          title={projection.hasApprovedSnapshot ? 'No current production assets yet' : 'Assets wait for an approved story plan'}
        />
        <AssetHistoryNotes projection={projection} />
        {partialSources.length > 0 ? <PartialNotice sources={partialSources} /> : null}
        <ReadOnlyAssetNotice />
      </div>
    )
  }

  const attentionCount = projection.assets.filter((asset) => asset.tone === 'attention').length
  return (
    <div className={styles.workspace} data-testid="storytelling-assets-state-ready">
      <AssetState
        action={
          <div className={styles.actions}>
            <Button
              disabled={isRefreshing(sceneWorkspace, layeredWorkspace, generationWorkspace)}
              icon={RefreshCw}
              onClick={() => { void refreshAll(sceneWorkspace, layeredWorkspace, generationWorkspace) }}
              variant="ghost"
            >
              {isRefreshing(sceneWorkspace, layeredWorkspace, generationWorkspace) ? 'Checking…' : 'Refresh'}
            </Button>
            <Button icon={MessageCircle} onClick={onReturnToChat} variant="primary">Review assets in Chat</Button>
          </div>
        }
        body={attentionCount > 0
          ? `${countLabel(attentionCount, 'record')} needs review before it can be treated as ready for production.`
          : 'Every item shown is bound to the current approved story version. Review files remain separate from final delivery assets.'}
        icon={attentionCount > 0 ? AlertTriangle : ShieldCheck}
        status={attentionCount > 0 ? 'Review required' : 'Current version verified'}
        title={attentionCount > 0 ? 'Current visual records need attention' : 'Current visual records are ready to inspect'}
        tone={attentionCount > 0 ? 'attention' : 'success'}
      />

      <dl aria-label="Current Storytelling asset summary" className={styles.facts}>
        <div><dt>Current records</dt><dd>{projection.assets.length}</dd></div>
        <div><dt>Needs attention</dt><dd>{attentionCount}</dd></div>
        <div><dt>Approved story version</dt><dd>Matched</dd></div>
      </dl>

      {partialSources.length > 0 ? <PartialNotice sources={partialSources} /> : null}

      <ol aria-label="Current Storytelling assets" className={styles.assets}>
        {projection.assets.map((asset) => <AssetRow asset={asset} key={asset.key} />)}
      </ol>

      <AssetHistoryNotes projection={projection} />
      <ReadOnlyAssetNotice />
    </div>
  )
}

function AssetRow({ asset }: { asset: AssetRecordView }) {
  const Icon = ASSET_ICONS[asset.kind]
  const toneClassName = asset.tone === 'neutral' ? '' : styles[asset.tone]
  return (
    <li className={styles.asset} data-testid={`storytelling-asset-${asset.kind}`}>
      <div className={styles.assetHeader}>
        <span aria-hidden="true" className={styles.assetIcon}><Icon size={20} /></span>
        <div className={styles.assetHeading}>
          <span className={styles.assetLabel}>{asset.label}</span>
          <h4>{asset.title}</h4>
        </div>
        <span className={`${styles.assetStatus} ${toneClassName}`}>{asset.status}</span>
      </div>
      <p className={styles.assetBody}>{asset.body}</p>
      <details className={styles.details}>
        <summary>Inspect asset details</summary>
        <dl>
          {asset.facts.map((fact) => (
            <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>
          ))}
        </dl>
      </details>
    </li>
  )
}

function AssetState({
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
  tone?: AssetTone
}) {
  const toneClassName = tone === 'neutral' ? '' : styles[tone]
  return (
    <section className={`${styles.decision} ${toneClassName}`} data-testid={testId}>
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

function AssetsUnavailable({
  onRetry,
  sceneWorkspace,
}: {
  onRetry: () => void
  sceneWorkspace: UseMotionStudioSceneWorkspaceResult
}) {
  const denied = sceneWorkspace.state === 'permission_denied'
  const conflict = sceneWorkspace.state === 'conflict'
  return (
    <AssetState
      action={denied ? undefined : <Button icon={RefreshCw} onClick={onRetry} variant="primary">Try again</Button>}
      body={denied
        ? 'Your current workspace cannot read the approved visual records attached to this named edit.'
        : conflict
          ? 'Reload the exact named edit before reviewing assets so an older story version is not shown.'
          : 'The current asset authority is temporarily unavailable. Nothing was treated as empty or current.'}
      icon={denied ? LockKeyhole : AlertTriangle}
      status={denied ? 'Access denied' : 'Needs attention'}
      testId={`storytelling-assets-state-${sceneWorkspace.state}`}
      title={denied ? 'These assets are not available' : conflict ? 'Assets changed while loading' : 'Assets could not be loaded'}
      tone="attention"
    />
  )
}

function PartialNotice({ sources }: { sources: readonly string[] }) {
  return (
    <p aria-live="polite" className={styles.partialNotice} role="status">
      <AlertTriangle aria-hidden="true" size={16} />
      Current records are shown, but {formatList(sources)} could not be confirmed. Refresh before making a review decision.
    </p>
  )
}

function AssetHistoryNotes({ projection }: { projection: AssetProjection }) {
  if (projection.previousRecordCount === 0 && projection.unscopedRecordCount === 0) return null
  return (
    <div className={styles.historyNotes}>
      {projection.previousRecordCount > 0 ? (
        <p>{countLabel(projection.previousRecordCount, 'earlier asset record')} retained outside the current approved story version.</p>
      ) : null}
      {projection.unscopedRecordCount > 0 ? (
        <p>{countLabel(projection.unscopedRecordCount, 'retained media record')} omitted because its approved story version is not included in the browser-safe record.</p>
      ) : null}
    </div>
  )
}

function ReadOnlyAssetNotice() {
  return (
    <p className={styles.readOnlyNotice}>
      <LockKeyhole aria-hidden="true" size={15} />
      Assets are read-only here. This view cannot generate, replace, approve, apply, render, export, or deliver media.
    </p>
  )
}

function projectAssets(
  sceneWorkspace: MotionStudioSceneWorkspaceDto | undefined,
  previewWorkspace: UseMotionStudioSceneWorkspaceResult['previewWorkspace'],
  assemblies: readonly MotionStudioLayeredAssemblyDto[],
  generationBindings: readonly MotionStudioGenerationBindingDto[],
  liveWorkspace: UseMotionStudioGenerationWorkspaceResult['liveWorkspace'],
): AssetProjection {
  const unscopedRecordCount = (liveWorkspace?.operations.filter((operation) => Boolean(operation.candidate)).length ?? 0) +
    (liveWorkspace?.deterministicReplacement ? 1 : 0)
  const snapshot = sceneWorkspace?.latestApprovedSnapshot
  if (!sceneWorkspace || !snapshot) {
    return {
      assets: [],
      previousRecordCount: (previewWorkspace?.bindings.length ?? 0) + assemblies.length + generationBindings.length,
      unscopedRecordCount,
      integrityFailure: false,
      hasApprovedSnapshot: false,
    }
  }

  const assets: AssetRecordView[] = []
  const seen = new Set<string>()
  let previousRecordCount = 0

  for (const binding of previewWorkspace?.bindings ?? []) {
    if (binding.approvedSnapshotId !== snapshot.id) {
      previousRecordCount += 1
      continue
    }
    if (!validLineage(sceneWorkspace, binding.sceneDocument, binding.timelineProposalId, binding.timelineProposalOutputDigest) || seen.has(`preview:${binding.id}`)) {
      return failedProjection(previousRecordCount, unscopedRecordCount)
    }
    seen.add(`preview:${binding.id}`)
    assets.push(previewAsset(binding))
  }

  for (const assembly of assemblies) {
    if (assembly.approvedSnapshotId !== snapshot.id) {
      previousRecordCount += 1
      continue
    }
    if (
      !validLineage(sceneWorkspace, assembly.sceneDocument, assembly.timelineProposalId, assembly.timelineProposalOutputDigest) ||
      assembly.renderBinding.approvedSnapshotId !== snapshot.id ||
      !sameVersion(assembly.renderBinding.sceneDocument, assembly.sceneDocument) ||
      assembly.renderBinding.timelineProposalId !== assembly.timelineProposalId ||
      assembly.renderBinding.timelineProposalOutputDigest !== assembly.timelineProposalOutputDigest ||
      seen.has(`layered:${assembly.id}`)
    ) return failedProjection(previousRecordCount, unscopedRecordCount)
    seen.add(`layered:${assembly.id}`)
    assets.push(layeredAsset(assembly))
  }

  for (const binding of generationBindings) {
    if (binding.approvedSnapshotId !== snapshot.id) {
      previousRecordCount += 1
      continue
    }
    if (!validLineage(sceneWorkspace, binding.sceneDocument, binding.timelineProposalId, binding.timelineProposalOutputDigest) || seen.has(`generated:${binding.id}`)) {
      return failedProjection(previousRecordCount, unscopedRecordCount)
    }
    seen.add(`generated:${binding.id}`)
    assets.push(generatedAsset(binding))
  }

  return {
    assets,
    previousRecordCount,
    unscopedRecordCount,
    integrityFailure: false,
    hasApprovedSnapshot: true,
  }
}

function validLineage(
  workspace: MotionStudioSceneWorkspaceDto,
  sceneDocument: MotionStudioVersionReference,
  proposalId: string,
  proposalOutputDigest: string,
): boolean {
  const snapshot = workspace.latestApprovedSnapshot
  if (!snapshot) return false
  const document = workspace.artifacts.find((artifact) =>
    artifact.kind === 'scene_document' &&
    ['approved', 'locked'].includes(artifact.state) &&
    sameVersion(artifact.version, sceneDocument))
  if (!document) return false
  return workspace.proposals.some((proposal) =>
    proposal.id === proposalId &&
    proposal.approvedSnapshotId === snapshot.id &&
    proposal.targetTimelineManifestId === snapshot.targetTimelineManifestId &&
    proposal.outputDigest === proposalOutputDigest &&
    sameVersion(proposal.sourceSceneDocument, sceneDocument))
}

function previewAsset(binding: MotionStudioPreviewBindingDto): AssetRecordView {
  const status = previewStatus(binding.status, Boolean(binding.artifact))
  return {
    key: `preview:${binding.id}`,
    kind: 'preview',
    label: 'Scene preview',
    title: `Private scene preview · plan version ${binding.sceneDocument.versionNumber}`,
    status: status.label,
    tone: status.tone,
    body: binding.artifact
      ? 'A technically verified private review file is available. It is not an approved final delivery asset.'
      : status.body,
    facts: [
      { label: 'Format', value: `MP4 · ${formatDimensions(binding.width, binding.height)}` },
      { label: 'Timing', value: `${formatNumber(binding.durationFrames)} frames at ${formatNumber(binding.fpsNumerator)} fps` },
      { label: 'Use', value: binding.artifact ? 'Private review only' : 'Preparation record' },
      { label: 'Final delivery', value: 'Not approved here' },
    ],
  }
}

function layeredAsset(assembly: MotionStudioLayeredAssemblyDto): AssetRecordView {
  const renderReady = assembly.renderBinding.status === 'ready' && Boolean(assembly.renderBinding.artifact)
  const cutoutReady = assembly.cutoutStatus === 'succeeded' && Boolean(assembly.cutout)
  const failed = ['failed', 'reconciliation_required', 'cancelled'].includes(assembly.cutoutStatus) ||
    ['failed', 'reconciliation_required', 'cancelled'].includes(assembly.renderStatus)
  const status = failed
    ? layeredFailureStatus(assembly)
    : cutoutReady
      ? { label: 'License review required', tone: 'attention' as const }
      : { label: 'Preparing layers', tone: 'neutral' as const }
  return {
    key: `layered:${assembly.id}`,
    kind: 'layered',
    label: 'Layered visual',
    title: `Editable layered scene · plan version ${assembly.sceneDocument.versionNumber}`,
    status: status.label,
    tone: status.tone,
    body: cutoutReady
      ? 'The subject layer is prepared, but its production license must be reviewed before final use.'
      : failed
        ? 'One part of this layered scene needs recovery. No alternate treatment was applied automatically.'
        : 'The editable subject and scene preview are still being prepared under the approved story version.',
    facts: [
      { label: 'Subject layer', value: cutoutReady ? 'Prepared' : jobLabel(assembly.cutoutStatus) },
      { label: 'Scene preview', value: renderReady ? 'Verified review file' : jobLabel(assembly.renderStatus) },
      { label: 'Format', value: `Layered scene · ${formatDimensions(assembly.renderBinding.width, assembly.renderBinding.height)}` },
      { label: 'Rights', value: 'Production license review required' },
    ],
  }
}

function generatedAsset(binding: MotionStudioGenerationBindingDto): AssetRecordView {
  const candidate = binding.candidate
  const isStill = binding.mediaKind === 'still_image'
  if (candidate) {
    return {
      key: `generated:${binding.id}`,
      kind: 'generated',
      label: isStill ? 'Generated still test' : 'Generated motion test',
      title: `${isStill ? 'Local visual fixture' : 'Local motion fixture'} · version ${candidate.media.versionNumber}`,
      status: 'Test evidence only',
      tone: 'attention',
      body: 'This local protocol fixture cannot enter final delivery. Visual quality and reference adherence were not measured.',
      facts: [
        { label: 'Format', value: `${isStill ? 'PNG' : 'MP4'} · ${formatDimensions(candidate.media.width, candidate.media.height)}` },
        { label: 'Technical check', value: 'Passed' },
        { label: 'Human review', value: candidate.reviewStatus === 'rejected' ? 'Rejected' : 'Needed' },
        { label: 'Final delivery', value: 'Not eligible' },
      ],
    }
  }

  const status = generationStatus(binding)
  return {
    key: `generated:${binding.id}`,
    kind: 'generated',
    label: isStill ? 'Planned still' : 'Planned motion clip',
    title: `${isStill ? 'Visual asset' : 'Motion asset'} preparation · plan version ${binding.sceneDocument.versionNumber}`,
    status: status.label,
    tone: status.tone,
    body: status.body,
    facts: [
      { label: 'Media', value: isStill ? 'Still image' : 'Motion clip' },
      { label: 'Preparation', value: jobLabel(binding.jobStatus) },
      { label: 'Review asset', value: 'Not available yet' },
      { label: 'Final delivery', value: 'Not eligible' },
    ],
  }
}

function previewStatus(status: MotionStudioPreviewBindingDto['status'], hasArtifact: boolean): { label: string; tone: AssetTone; body: string } {
  if (status === 'ready' && hasArtifact) return { label: 'Verified review file', tone: 'success', body: 'A private review file is available.' }
  if (status === 'failed') return { label: 'Needs retry', tone: 'attention', body: 'Preview preparation failed. No empty or ready asset was assumed.' }
  if (status === 'reconciliation_required') return { label: 'Recovery needed', tone: 'attention', body: 'Preview outcome needs recovery before this record can be trusted.' }
  if (status === 'cancelled') return { label: 'Cancelled', tone: 'attention', body: 'Preview preparation was cancelled and did not produce a review asset.' }
  return { label: status === 'rendering' ? 'Preparing preview' : 'Queued', tone: 'neutral', body: 'The private scene preview is still being prepared.' }
}

function generationStatus(binding: MotionStudioGenerationBindingDto): { label: string; tone: AssetTone; body: string } {
  if (binding.jobStatus === 'failed') return { label: 'Needs retry', tone: 'attention', body: 'Visual preparation failed. No replacement or fallback was started automatically.' }
  if (binding.jobStatus === 'reconciliation_required') return { label: 'Recovery needed', tone: 'attention', body: 'The preparation outcome must be reconciled before it can be trusted.' }
  if (binding.jobStatus === 'cancelled') return { label: 'Cancelled', tone: 'attention', body: 'Visual preparation was cancelled and produced no current asset.' }
  if (binding.jobStatus === 'blocked') return { label: 'Blocked', tone: 'attention', body: 'A required approved dependency is blocking this visual record.' }
  return { label: 'Preparing', tone: 'neutral', body: 'A bounded review record is being prepared. No final media is available yet.' }
}

function layeredFailureStatus(assembly: MotionStudioLayeredAssemblyDto): { label: string; tone: AssetTone } {
  if (assembly.cutoutStatus === 'reconciliation_required' || assembly.renderStatus === 'reconciliation_required') {
    return { label: 'Recovery needed', tone: 'attention' }
  }
  if (assembly.cutoutStatus === 'cancelled' || assembly.renderStatus === 'cancelled') {
    return { label: 'Cancelled', tone: 'attention' }
  }
  return { label: 'Needs retry', tone: 'attention' }
}

function failedProjection(previousRecordCount: number, unscopedRecordCount: number): AssetProjection {
  return { assets: [], previousRecordCount, unscopedRecordCount, integrityFailure: true, hasApprovedSnapshot: true }
}

function unavailableSources(
  sceneWorkspace: UseMotionStudioSceneWorkspaceResult,
  layeredWorkspace: UseMotionStudioLayeredWorkspaceResult,
  generationWorkspace: UseMotionStudioGenerationWorkspaceResult,
): string[] {
  const sources: string[] = []
  if (sceneWorkspace.previewMessage && !sceneWorkspace.previewWorkspace) sources.push('private previews')
  if (['failure', 'permission_denied', 'conflict'].includes(layeredWorkspace.state)) sources.push('layered visuals')
  if (['failure', 'permission_denied', 'conflict'].includes(generationWorkspace.state)) sources.push('generated visuals')
  if (['failure', 'permission_denied', 'conflict'].includes(generationWorkspace.liveState)) sources.push('retained media history')
  return sources
}

async function refreshAll(
  sceneWorkspace: UseMotionStudioSceneWorkspaceResult,
  layeredWorkspace: UseMotionStudioLayeredWorkspaceResult,
  generationWorkspace: UseMotionStudioGenerationWorkspaceResult,
): Promise<void> {
  await Promise.all([sceneWorkspace.refresh(), layeredWorkspace.refresh(), generationWorkspace.refresh()])
}

function isRefreshing(
  sceneWorkspace: UseMotionStudioSceneWorkspaceResult,
  layeredWorkspace: UseMotionStudioLayeredWorkspaceResult,
  generationWorkspace: UseMotionStudioGenerationWorkspaceResult,
): boolean {
  return sceneWorkspace.operation === 'refreshing' || layeredWorkspace.operation === 'refreshing' ||
    generationWorkspace.operation === 'refreshing' || generationWorkspace.liveOperation === 'refreshing'
}

function sameVersion(left: MotionStudioVersionReference, right: MotionStudioVersionReference): boolean {
  return left.artifactId === right.artifactId && left.versionId === right.versionId &&
    left.versionNumber === right.versionNumber && left.contentDigest === right.contentDigest
}

function jobLabel(status: MotionStudioGenerationBindingDto['jobStatus']): string {
  const labels: Record<MotionStudioGenerationBindingDto['jobStatus'], string> = {
    waiting: 'Waiting',
    queued: 'Queued',
    claimed: 'Starting',
    running: 'In progress',
    cancel_requested: 'Stopping',
    reconciliation_required: 'Recovery needed',
    blocked: 'Blocked',
    succeeded: 'Complete',
    failed: 'Needs retry',
    cancelled: 'Cancelled',
  }
  return labels[status]
}

function formatDimensions(width: number, height: number): string {
  return `${formatNumber(width)}×${formatNumber(height)}`
}

function countLabel(value: number, singular: string): string {
  return `${formatNumber(value)} ${singular}${value === 1 ? '' : 's'}`
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

function formatList(values: readonly string[]): string {
  return new Intl.ListFormat('en-US', { style: 'long', type: 'conjunction' }).format(values)
}
