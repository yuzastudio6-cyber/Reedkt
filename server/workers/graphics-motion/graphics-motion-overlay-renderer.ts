import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { chromium, type Browser, type Page } from '@playwright/test'
import { assertOutputPathInsideRoot } from '../media/media-path-safety'
import type {
  AutonomousCaptionExecutionSpec,
  AutonomousEditPlanSegment,
  AutonomousGraphicExecutionSpec,
  AutonomousGraphicMotionExecutionSpec,
  AutonomousGraphicPlacement,
} from '../../../src/types'
import type { CaptionSegment } from '../captions'
import type {
  GraphicsMotionExecutionInput,
  GraphicsMotionExecutionResult,
  GraphicsMotionQaFinding,
  PrivateVisualOverlayAnimation,
  PrivateVisualOverlayInput,
} from './graphics-motion-types'

interface OverlayDraft extends Omit<PrivateVisualOverlayInput, 'localPath'> {
  localPath?: string
  html: string
}

export async function renderApprovedGraphicsMotionOverlays(
  input: GraphicsMotionExecutionInput,
): Promise<GraphicsMotionExecutionResult> {
  const outputRoot = path.resolve(input.outputDirectory)
  const overlayDirectory = assertOutputPathInsideRoot(path.join(outputRoot, 'approved-visual-overlays'), outputRoot)
  await mkdir(overlayDirectory, { recursive: true })
  const drafts = [
    ...buildGraphicDrafts(input),
    ...buildCaptionDrafts(input.captionSegments, input.captionSpec, input.canvas),
  ]
  const findings = validateAndResolveLayout(drafts, input.canvas)
  if (findings.some((finding) => finding.status === 'failed')) {
    return {
      status: 'blocked',
      overlays: [],
      qaFindings: findings,
      outputDirectory: overlayDirectory,
      privateArtifactsOnly: true,
      warnings: ['Approved graphics/motion layout failed deterministic bounds or collision QA before rendering.'],
    }
  }

  const browser = await chromium.launch({ headless: true })
  try {
    const overlays = await renderDrafts({ browser, drafts, overlayDirectory, outputRoot })
    return {
      status: 'completed',
      overlays,
      qaFindings: [
        ...findings,
        { code: 'approved_overlay_rendered', status: 'passed', message: `${overlays.length} approved private visual overlays rendered.` },
        { code: 'source_evidence_lineage', status: 'passed', message: 'Every rendered graphic retains source-evidence references from the approved plan.' },
      ],
      outputDirectory: overlayDirectory,
      privateArtifactsOnly: true,
      warnings: ['Visual overlays are private execution artifacts and are not public delivery assets.'],
    }
  } finally {
    await browser.close()
  }
}

function buildGraphicDrafts(input: GraphicsMotionExecutionInput): OverlayDraft[] {
  const motionOverrides = new Map<string, AutonomousGraphicMotionExecutionSpec>()
  for (const operation of input.plan.segments.flatMap((segment) => segment.operations)) {
    if (operation.executionSpec?.kind === 'graphic_motion') {
      motionOverrides.set(operation.executionSpec.targetGraphicId, operation.executionSpec)
    }
  }
  return input.plan.segments.flatMap((segment) => segment.operations.flatMap((operation) => {
    const spec = operation.executionSpec
    if (operation.operationId !== 'graphics.compose' || spec?.kind !== 'graphic') return []
    const timelineRange = resolveSegmentTimelineRange(input, segment)
    const startSeconds = timelineRange.startSeconds + spec.startOffsetSeconds
    const endSeconds = Math.min(timelineRange.endSeconds, timelineRange.startSeconds + spec.endOffsetSeconds)
    const dimensions = graphicDimensions(spec, input.canvas)
    const position = positionFor(spec.placement, dimensions, input.canvas)
    const override = motionOverrides.get(spec.graphicId)
    const animation = override
      ? {
          enter: override.enter,
          exit: override.exit,
          enterDurationSeconds: override.enterDurationSeconds,
          exitDurationSeconds: override.exitDurationSeconds,
        }
      : spec.motion
    return [{
      overlayId: `graphic-${safeId(spec.graphicId)}`,
      overlayKind: 'graphic' as const,
      startSeconds,
      endSeconds,
      ...position,
      ...dimensions,
      animation,
      sourceEvidenceRefs: [...spec.contentEvidenceRefs],
      private: true as const,
      html: buildGraphicDocument(spec, dimensions),
    }]
  }))
}

function buildCaptionDrafts(
  captions: CaptionSegment[],
  spec: AutonomousCaptionExecutionSpec | undefined,
  canvas: { width: number; height: number },
): OverlayDraft[] {
  if (!spec || captions.length === 0) return []
  const dimensions = captionDimensions(canvas)
  const position = captionPosition(spec, dimensions, canvas)
  return captions.flatMap((caption) => {
    if (spec.animation !== 'word_pop' || caption.words.length === 0) {
      return [{
        overlayId: `caption-${safeId(caption.captionId)}`,
        overlayKind: 'caption' as const,
        startSeconds: caption.startSeconds,
        endSeconds: caption.endSeconds,
        ...position,
        ...dimensions,
        animation: captionAnimation(spec),
        sourceEvidenceRefs: caption.words.map((word) => word.segmentId),
        private: true as const,
        html: buildCaptionDocument(caption, spec),
      }]
    }
    return caption.words.map((word, wordIndex) => ({
      overlayId: `caption-${safeId(caption.captionId)}-word-${wordIndex + 1}`,
      overlayKind: 'caption' as const,
      startSeconds: Math.max(caption.startSeconds, word.startSeconds),
      endSeconds: Math.min(caption.endSeconds, Math.max(word.endSeconds, word.startSeconds + 0.08)),
      ...position,
      ...dimensions,
      animation: captionAnimation(spec),
      sourceEvidenceRefs: [word.segmentId],
      private: true as const,
      html: buildCaptionDocument(caption, spec, wordIndex),
    }))
  })
}

async function renderDrafts(input: {
  browser: Browser
  drafts: OverlayDraft[]
  overlayDirectory: string
  outputRoot: string
}): Promise<PrivateVisualOverlayInput[]> {
  const pages = new Map<string, Page>()
  const overlays: PrivateVisualOverlayInput[] = []
  try {
    for (const [index, draft] of input.drafts.entries()) {
      const pageKey = `${draft.width}x${draft.height}`
      let page = pages.get(pageKey)
      if (!page) {
        page = await input.browser.newPage({ viewport: { width: draft.width, height: draft.height }, deviceScaleFactor: 1 })
        pages.set(pageKey, page)
      }
      const localPath = assertOutputPathInsideRoot(
        path.join(input.overlayDirectory, `${String(index + 1).padStart(4, '0')}-${safeId(draft.overlayId)}.png`),
        input.outputRoot,
      )
      await page.setContent(draft.html, { waitUntil: 'load' })
      await page.screenshot({ path: localPath, omitBackground: true })
      const { html: _html, ...record } = draft
      overlays.push({ ...record, localPath })
    }
    return overlays
  } finally {
    await Promise.all([...pages.values()].map((page) => page.close()))
  }
}

function validateAndResolveLayout(
  drafts: OverlayDraft[],
  canvas: { width: number; height: number },
): GraphicsMotionQaFinding[] {
  const findings: GraphicsMotionQaFinding[] = []
  for (const draft of drafts) {
    if (draft.startSeconds < 0 || draft.endSeconds <= draft.startSeconds) {
      findings.push({ code: 'overlay_time_invalid', status: 'failed', message: 'Overlay timing is invalid.', overlayId: draft.overlayId })
    }
    if (draft.x < 0 || draft.y < 0 || draft.x + draft.width > canvas.width || draft.y + draft.height > canvas.height) {
      findings.push({ code: 'overlay_out_of_bounds', status: 'failed', message: 'Overlay leaves the confirmed output frame.', overlayId: draft.overlayId })
    }
    if (draft.overlayKind === 'graphic' && draft.sourceEvidenceRefs.length === 0) {
      findings.push({ code: 'graphic_missing_evidence', status: 'failed', message: 'Graphic has no source evidence lineage.', overlayId: draft.overlayId })
    }
  }

  const graphics = drafts.filter((draft) => draft.overlayKind === 'graphic')
  const captions = drafts.filter((draft) => draft.overlayKind === 'caption')
  for (const caption of captions) {
    const conflicts = graphics.filter((graphic) => overlapsInTime(caption, graphic) && overlapsInSpace(caption, graphic))
    if (conflicts.length === 0) continue
    const candidateY = [
      Math.round(canvas.height * 0.12),
      Math.round(canvas.height * 0.43),
      Math.round(canvas.height * 0.72),
    ].filter((y) => y + caption.height <= canvas.height - Math.round(canvas.height * 0.05))
    const safeY = candidateY.find((y) => !graphics.some((graphic) =>
      overlapsInTime(caption, graphic) && overlapsInSpace({ ...caption, y }, graphic)))
    if (safeY === undefined) {
      findings.push({ code: 'caption_graphic_collision', status: 'failed', message: 'Caption and graphic collision could not be resolved.', overlayId: caption.overlayId })
    } else {
      caption.y = safeY
      findings.push({ code: 'caption_graphic_collision_resolved', status: 'passed', message: 'Caption placement was moved to a collision-free safe band.', overlayId: caption.overlayId })
    }
  }
  if (!findings.some((finding) => finding.status === 'failed')) {
    findings.push({ code: 'overlay_bounds', status: 'passed', message: 'All overlays fit inside the confirmed output frame.' })
    findings.push({ code: 'overlay_collisions', status: 'passed', message: 'Timed caption and graphic overlays are collision-free.' })
  }
  return findings
}

function resolveSegmentTimelineRange(input: GraphicsMotionExecutionInput, segment: AutonomousEditPlanSegment) {
  const clip = input.timelineManifest.clips.find((candidate) =>
    Math.abs(candidate.sourceRange.startSeconds - segment.sourceStartSeconds) < 0.05 &&
    Math.abs(candidate.sourceRange.endSeconds - segment.sourceEndSeconds) < 0.05)
  if (!clip) throw new Error(`Approved segment ${segment.id} is missing from the compiled timeline.`)
  return clip.timelineRange
}

function graphicDimensions(spec: AutonomousGraphicExecutionSpec, canvas: { width: number; height: number }) {
  const maxWidth = canvas.width - Math.round(canvas.width * 0.1)
  const widthRatio = spec.graphicType === 'label' ? 0.46 : spec.graphicType === 'lower_third' ? 0.72 : 0.58
  const bodyRows = Math.max(1, spec.bodyLines.length)
  const heightRatio = spec.graphicType === 'label'
    ? 0.1
    : spec.graphicType === 'process_steps' || spec.graphicType === 'comparison'
      ? 0.1 + bodyRows * 0.055
      : 0.13 + Math.min(3, bodyRows) * 0.035
  return {
    width: even(Math.min(maxWidth, Math.round(canvas.width * widthRatio))),
    height: even(Math.min(Math.round(canvas.height * 0.4), Math.round(canvas.height * heightRatio))),
  }
}

function captionDimensions(canvas: { width: number; height: number }) {
  return {
    width: even(Math.min(canvas.width - Math.round(canvas.width * 0.1), Math.round(canvas.width * 0.84))),
    height: even(Math.round(canvas.height * 0.18)),
  }
}

function positionFor(
  placement: AutonomousGraphicPlacement,
  dimensions: { width: number; height: number },
  canvas: { width: number; height: number },
) {
  const marginX = Math.round(canvas.width * 0.055)
  const marginY = Math.round(canvas.height * 0.08)
  const left = marginX
  const right = canvas.width - marginX - dimensions.width
  const top = marginY
  const bottom = canvas.height - marginY - dimensions.height
  const middleX = Math.round((canvas.width - dimensions.width) / 2)
  const middleY = Math.round((canvas.height - dimensions.height) / 2)
  const resolved = placement === 'auto_safe' ? 'top_right' : placement
  const map: Record<Exclude<AutonomousGraphicPlacement, 'auto_safe'>, { x: number; y: number }> = {
    top_left: { x: left, y: top }, top_right: { x: right, y: top },
    middle_left: { x: left, y: middleY }, middle_right: { x: right, y: middleY },
    bottom_left: { x: left, y: bottom }, bottom_right: { x: right, y: bottom },
    center: { x: middleX, y: middleY },
  }
  return map[resolved]
}

function captionPosition(
  spec: AutonomousCaptionExecutionSpec,
  dimensions: { width: number; height: number },
  canvas: { width: number; height: number },
) {
  const x = Math.round((canvas.width - dimensions.width) / 2)
  const yByPlacement: Record<AutonomousCaptionExecutionSpec['placement'], number> = {
    auto_face_safe: Math.round(canvas.height * 0.64),
    top_safe: Math.round(canvas.height * 0.12),
    middle_safe: Math.round(canvas.height * 0.43),
    bottom_safe: Math.round(canvas.height * 0.72),
    lower_third: Math.round(canvas.height * 0.66),
  }
  return { x, y: Math.min(yByPlacement[spec.placement], canvas.height - dimensions.height - Math.round(canvas.height * 0.05)) }
}

function captionAnimation(spec: AutonomousCaptionExecutionSpec): PrivateVisualOverlayAnimation {
  return {
    enter: spec.animation,
    exit: spec.animation === 'none' ? 'none' : 'fade',
    enterDurationSeconds: spec.animation === 'none' ? 0 : spec.animation === 'phrase_fade_up' ? 0.2 : 0.1,
    exitDurationSeconds: spec.animation === 'none' ? 0 : 0.12,
  }
}

function buildCaptionDocument(caption: CaptionSegment, spec: AutonomousCaptionExecutionSpec, activeWordIndex?: number): string {
  const words = caption.words.length > 0 ? caption.words.map((word) => word.word) : caption.text.split(/\s+/)
  const emphasisTerms = spec.emphasisTerms.map((term) => normalizeTerm(term))
  const spans = words.map((word, index) => {
    const normalized = normalizeTerm(word)
    const emphasized = activeWordIndex === index || emphasisTerms.some((term) => normalized === term || normalized.includes(term))
    return `<span class="word${emphasized ? ' emphasized' : ''}${activeWordIndex === index ? ' active' : ''}">${escapeHtml(word)}</span>`
  }).join(' ')
  const typographyClass = `type-${spec.typography}`
  const backdropClass = spec.typography === 'editorial_bold' || spec.typography === 'documentary' ? 'with-backdrop' : ''
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    *{box-sizing:border-box}html,body{width:100%;height:100%;margin:0;background:transparent;overflow:hidden}
    body{display:flex;align-items:center;justify-content:center;padding:12px 18px;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif}
    .caption{max-width:100%;text-align:center;color:#fff;font-weight:850;line-height:1.04;letter-spacing:0;text-wrap:balance;
      font-size:${captionFontSize(caption.text)}px;text-shadow:0 3px 2px rgba(0,0,0,.95),0 0 10px rgba(0,0,0,.72);${spec.textCase === 'upper' ? 'text-transform:uppercase;' : ''}}
    .caption.with-backdrop{padding:16px 22px 18px;border-radius:12px;background:rgba(6,9,15,.78);border:1px solid rgba(255,255,255,.16)}
    .type-minimal{font-weight:700;font-size:${Math.max(32, captionFontSize(caption.text) - 8)}px}.type-documentary{font-weight:680}
    .word{display:inline-block;white-space:nowrap}.word.emphasized{color:${spec.accentColor};font-weight:900}.word.active{transform:scale(1.08)}
  </style></head><body><div class="caption ${typographyClass} ${backdropClass}">${spans}</div></body></html>`
}

function buildGraphicDocument(spec: AutonomousGraphicExecutionSpec, dimensions: { width: number; height: number }): string {
  const body = spec.graphicType === 'process_steps'
    ? `<ol>${spec.bodyLines.map((line) => `<li><span>${escapeHtml(line)}</span></li>`).join('')}</ol>`
    : `<div class="body-lines">${spec.bodyLines.map((line) => `<div>${escapeHtml(line)}</div>`).join('')}</div>`
  const styleClass = `style-${spec.visualStyle}`
  const typeClass = `graphic-${spec.graphicType}`
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    *{box-sizing:border-box}html,body{width:100%;height:100%;margin:0;background:transparent;overflow:hidden}
    body{display:flex;align-items:center;justify-content:center;padding:10px;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif}
    .card{position:relative;width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;padding:${Math.max(18, Math.round(dimensions.width * .045))}px;
      color:#fff;background:rgba(7,11,19,.84);border:1px solid rgba(255,255,255,.18);border-radius:12px;box-shadow:0 12px 30px rgba(0,0,0,.28)}
    .card:before{content:"";position:absolute;left:0;top:14%;bottom:14%;width:5px;border-radius:3px;background:${spec.accentColor}}
    .style-accent_label{background:rgba(7,11,19,.72);border-color:${spec.accentColor}}
    .style-outline_card{background:rgba(5,8,14,.56);border-width:2px;border-color:${spec.accentColor}}
    .style-editorial_card{background:rgba(246,248,252,.94);color:#10141c;border-color:rgba(10,15,24,.16);box-shadow:0 10px 26px rgba(0,0,0,.24)}
    .title{font-size:${graphicTitleSize(spec)}px;font-weight:850;line-height:1.02;letter-spacing:0;text-wrap:balance}
    .body-lines,ol{margin:${Math.round(dimensions.height * .055)}px 0 0;padding:0;font-size:${Math.max(18, Math.round(dimensions.width * .047))}px;line-height:1.22;font-weight:560}
    .body-lines{display:grid;gap:7px}ol{list-style:none;counter-reset:steps;display:grid;gap:8px}li{counter-increment:steps;display:flex;gap:11px;align-items:center}
    li:before{content:counter(steps);display:grid;place-items:center;width:27px;height:27px;flex:0 0 27px;border-radius:50%;background:${spec.accentColor};color:#071019;font-weight:850;font-size:15px}
    .source{margin-top:auto;padding-top:8px;font-size:${Math.max(14, Math.round(dimensions.width * .03))}px;opacity:.68;font-weight:600}
    .graphic-label .body-lines{display:none}.graphic-label .title{font-size:${Math.max(30, Math.round(dimensions.width * .075))}px}
    .graphic-stat_card .title{font-size:${Math.max(42, Math.round(dimensions.width * .105))}px;color:${spec.accentColor}}
  </style></head><body><div class="card ${styleClass} ${typeClass}"><div class="title">${escapeHtml(spec.title)}</div>${body}${spec.sourceLabel ? `<div class="source">${escapeHtml(spec.sourceLabel)}</div>` : ''}</div></body></html>`
}

function captionFontSize(text: string): number {
  if (text.length > 70) return 42
  if (text.length > 46) return 50
  return 58
}

function graphicTitleSize(spec: AutonomousGraphicExecutionSpec): number {
  if (spec.title.length > 72) return 30
  if (spec.title.length > 42) return 36
  return 43
}

function overlapsInTime(left: Pick<OverlayDraft, 'startSeconds' | 'endSeconds'>, right: Pick<OverlayDraft, 'startSeconds' | 'endSeconds'>) {
  return Math.min(left.endSeconds, right.endSeconds) - Math.max(left.startSeconds, right.startSeconds) > 0.02
}

function overlapsInSpace(left: Pick<OverlayDraft, 'x' | 'y' | 'width' | 'height'>, right: Pick<OverlayDraft, 'x' | 'y' | 'width' | 'height'>) {
  return left.x < right.x + right.width && left.x + left.width > right.x && left.y < right.y + right.height && left.y + left.height > right.y
}

function normalizeTerm(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '')
}

function safeId(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 80) || 'overlay'
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

function even(value: number): number {
  return value % 2 === 0 ? value : value + 1
}
