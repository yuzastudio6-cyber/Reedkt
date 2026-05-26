import type { SceneBoundary } from '../../../src/backend/contracts/media-analysis-report'
import type { CutRisk } from './smart-cut-worker-types'

export function evaluateSceneCutSafety(input: {
  cutTimeSeconds: number
  sceneBoundaries: SceneBoundary[]
  allowJumpCut?: boolean
}): {
  safe: boolean
  risks: CutRisk[]
  warnings: string[]
} {
  if (input.sceneBoundaries.length === 0) {
    return {
      safe: true,
      risks: ['none'],
      warnings: ['Scene data is missing; visual jump risk cannot be fully evaluated in Milestone 8.'],
    }
  }

  const nearBoundary = input.sceneBoundaries.some((boundary) => (
    Math.abs(boundary.startSeconds - input.cutTimeSeconds) <= 0.25 ||
    Math.abs(boundary.endSeconds - input.cutTimeSeconds) <= 0.25
  ))

  if (nearBoundary || input.allowJumpCut) {
    return { safe: true, risks: nearBoundary ? ['none'] : ['visual_jump'], warnings: input.allowJumpCut ? ['Jump cuts allowed for selected pacing style.'] : [] }
  }

  const insideScene = input.sceneBoundaries.some((boundary) => input.cutTimeSeconds > boundary.startSeconds && input.cutTimeSeconds < boundary.endSeconds)
  return {
    safe: !insideScene,
    risks: insideScene ? ['visual_jump', 'scene_boundary_conflict'] : ['none'],
    warnings: insideScene ? ['Cut is inside a scene range and may create a visual jump.'] : [],
  }
}
