import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { motionStudioApiClient } from '../backend/api/motion-studio-api-client'
import {
  motionStudioStoryWorkspaceDtoSchema,
  storytellingMotionStylePlanPreparationDtoSchema,
} from '../lib/motion-studio/contracts'
import type {
  StorytellingMotionStylePlanPreparationDto,
  StorytellingMotionStylePlanReviewInput,
  StorytellingStoryContinuityReviewDto,
} from '../types/motion-studio'
import type { EditLevel } from '../types/reeditpro'

export type StorytellingStylePlanReviewState =
  | 'inactive'
  | 'loading'
  | 'needs_selection'
  | 'ready'
  | 'permission_denied'
  | 'not_found'
  | 'conflict'
  | 'failure'

export type StorytellingContinuityPlanReviewState =
  | 'inactive'
  | 'loading'
  | 'ready'
  | 'unavailable'

export interface UseStorytellingStylePlanReviewResult {
  state: StorytellingStylePlanReviewState
  preparation?: StorytellingMotionStylePlanPreparationDto
  planReviewInput?: StorytellingMotionStylePlanReviewInput
  continuityState: StorytellingContinuityPlanReviewState
  storyContinuity?: StorytellingStoryContinuityReviewDto
  continuityMessage?: string
  message?: string
  warnings: readonly string[]
  approvalReady: boolean
  refresh: () => Promise<void>
}

interface UseStorytellingStylePlanReviewInput {
  active: boolean
  projectId: string
  editSessionId: string
  productionId: string
  workspaceId: string
  editLevel: EditLevel
  directionHistory: readonly string[]
}

const inactive: Omit<UseStorytellingStylePlanReviewResult, 'refresh'> = {
  state: 'inactive',
  continuityState: 'inactive',
  warnings: [],
  approvalReady: false,
}

export function useStorytellingStylePlanReview({
  active,
  projectId,
  editSessionId,
  productionId,
  workspaceId,
  editLevel,
  directionHistory,
}: UseStorytellingStylePlanReviewInput): UseStorytellingStylePlanReviewResult {
  const [view, setView] = useState(inactive)
  const epoch = useRef(0)
  const requestIdentity = useMemo(
    () => JSON.stringify({ projectId, editSessionId, productionId, workspaceId, editLevel, directionHistory }),
    [directionHistory, editLevel, editSessionId, productionId, projectId, workspaceId],
  )
  const idempotencyKey = useMemo(
    () => `storytelling-style-plan:${stableRequestKey(requestIdentity)}`,
    [requestIdentity],
  )

  const load = useCallback(async () => {
    if (!active) {
      setView(inactive)
      return
    }
    if (directionHistory.length === 0) {
      setView({
        state: 'needs_selection',
        continuityState: 'inactive',
        message: 'Choose one Storytelling motion direction in Chat before Plan Review.',
        warnings: [],
        approvalReady: false,
      })
      return
    }
    const currentEpoch = ++epoch.current
    setView({ state: 'loading', continuityState: 'inactive', warnings: [], approvalReady: false })

    const productionResponse = await motionStudioApiClient.getProduction(projectId, editSessionId)
    if (currentEpoch !== epoch.current) return
    if (!productionResponse.ok || !productionResponse.data?.production) {
      setView(failureState(productionResponse.statusCode, productionResponse.error?.message, productionResponse.warnings))
      return
    }
    const production = productionResponse.data.production
    if (production.id !== productionId || production.projectId !== projectId || production.editSessionId !== editSessionId || production.moduleId !== 'storytelling') {
      setView({
        state: 'conflict',
        continuityState: 'inactive',
        message: 'The motion direction did not match this exact Storytelling project and named edit.',
        warnings: productionResponse.warnings,
        approvalReady: false,
      })
      return
    }

    const response = await motionStudioApiClient.prepareStorytellingStylePlan(
      production.id,
      { workspaceId, directionHistory, modelTier: editLevel },
      idempotencyKey,
    )
    if (currentEpoch !== epoch.current) return
    if (!response.ok) {
      setView(failureState(response.statusCode, response.error?.message, response.warnings))
      return
    }
    const parsed = storytellingMotionStylePlanPreparationDtoSchema.safeParse(response.data?.preparation)
    if (!parsed.success || parsed.data.projectId !== projectId || parsed.data.editSessionId !== editSessionId ||
        parsed.data.productionId !== production.id ||
        (parsed.data.planReviewInput && parsed.data.planReviewInput.workspaceId !== workspaceId)) {
      setView({
        state: 'failure',
        continuityState: 'inactive',
        message: 'The motion direction response did not match this exact named edit.',
        warnings: response.warnings,
        approvalReady: false,
      })
      return
    }
    const preparation = parsed.data
    const preparedView: Omit<UseStorytellingStylePlanReviewResult, 'refresh'> = {
      state: preparation.state === 'ready_for_plan_review' ? 'ready' : 'needs_selection',
      preparation,
      ...(preparation.planReviewInput ? { planReviewInput: preparation.planReviewInput } : {}),
      ...(preparation.blockerMessage ? { message: preparation.blockerMessage } : {}),
      continuityState: preparation.state === 'ready_for_plan_review' ? 'loading' : 'inactive',
      warnings: [...productionResponse.warnings, ...response.warnings],
      approvalReady: preparation.state === 'ready_for_plan_review',
    }
    setView(preparedView)
    if (preparation.state !== 'ready_for_plan_review') return

    const storyResponse = await motionStudioApiClient.getStoryWorkspace(production.id)
    if (currentEpoch !== epoch.current) return
    if (!storyResponse.ok) {
      setView({
        ...preparedView,
        continuityState: 'unavailable',
        continuityMessage: storyResponse.error?.message ?? 'The current story flow could not be checked.',
        warnings: [...preparedView.warnings, ...storyResponse.warnings],
      })
      return
    }
    const parsedStory = motionStudioStoryWorkspaceDtoSchema.safeParse(storyResponse.data?.storyWorkspace)
    if (!parsedStory.success || parsedStory.data.productionId !== production.id ||
        parsedStory.data.projectId !== projectId || parsedStory.data.editSessionId !== editSessionId) {
      setView({
        ...preparedView,
        continuityState: 'unavailable',
        continuityMessage: 'The story flow did not match this exact named edit.',
        warnings: [...preparedView.warnings, ...storyResponse.warnings],
      })
      return
    }
    setView({
      ...preparedView,
      continuityState: 'ready',
      storyContinuity: parsedStory.data.storyContinuityReview,
      warnings: [...preparedView.warnings, ...storyResponse.warnings],
    })
  }, [active, directionHistory, editLevel, editSessionId, idempotencyKey, productionId, projectId, workspaceId])

  useEffect(() => {
    const timer = globalThis.setTimeout(() => { void load() }, 0)
    return () => {
      globalThis.clearTimeout(timer)
      epoch.current += 1
    }
  }, [load])

  return { ...view, refresh: load }
}

function failureState(
  statusCode: number,
  message: string | undefined,
  warnings: readonly string[],
): Omit<UseStorytellingStylePlanReviewResult, 'refresh'> {
  const state: StorytellingStylePlanReviewState = statusCode === 401 || statusCode === 403
    ? 'permission_denied'
    : statusCode === 404
      ? 'not_found'
      : statusCode === 409
        ? 'conflict'
        : 'failure'
  return {
    state,
    continuityState: 'inactive',
    message: message ?? 'The motion direction could not be prepared for Plan Review.',
    warnings,
    approvalReady: false,
  }
}

function stableRequestKey(value: string): string {
  let hash = 0x811c9dc5
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return `${value.length.toString(36)}:${(hash >>> 0).toString(16).padStart(8, '0')}`
}
