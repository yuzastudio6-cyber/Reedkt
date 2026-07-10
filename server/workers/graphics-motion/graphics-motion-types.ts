import type { TimelineManifest } from '../../../src/backend/contracts/timeline-manifest-contracts'
import type {
  AutonomousCaptionExecutionSpec,
  AutonomousEditPlanDraft,
  AutonomousGraphicExecutionSpec,
} from '../../../src/types'
import type { CaptionSegment } from '../captions'

export interface PrivateVisualOverlayAnimation {
  enter: AutonomousGraphicExecutionSpec['motion']['enter'] | 'phrase_fade_up' | 'keyword_pop' | 'word_pop'
  exit: AutonomousGraphicExecutionSpec['motion']['exit']
  enterDurationSeconds: number
  exitDurationSeconds: number
}

export interface PrivateVisualOverlayInput {
  overlayId: string
  overlayKind: 'caption' | 'graphic'
  localPath: string
  startSeconds: number
  endSeconds: number
  x: number
  y: number
  width: number
  height: number
  animation: PrivateVisualOverlayAnimation
  sourceEvidenceRefs: string[]
  private: true
}

export interface GraphicsMotionQaFinding {
  code: string
  status: 'passed' | 'failed'
  message: string
  overlayId?: string
}

export interface GraphicsMotionExecutionResult {
  status: 'completed' | 'blocked'
  overlays: PrivateVisualOverlayInput[]
  qaFindings: GraphicsMotionQaFinding[]
  outputDirectory: string
  privateArtifactsOnly: true
  warnings: string[]
}

export interface GraphicsMotionExecutionInput {
  plan: AutonomousEditPlanDraft
  timelineManifest: TimelineManifest
  captionSegments: CaptionSegment[]
  outputDirectory: string
  canvas: { width: number; height: number }
  captionSpec?: AutonomousCaptionExecutionSpec
}
