import {
  requiredPhase23ImageIds,
} from './container-readiness-expected-tools'
import type {
  ContainerImageReadinessResult,
  ContainerPhase22Readiness,
  ContainerPhase23Readiness,
  ContainerReadinessBlocker,
  ContainerReadinessImageId,
  ContainerReadinessWarning,
} from './container-readiness-types'

export interface ContainerReadinessBlockerEvaluation {
  blockers: ContainerReadinessBlocker[]
  warnings: ContainerReadinessWarning[]
  phase22Readiness: ContainerPhase22Readiness
  phase23Readiness: ContainerPhase23Readiness
}

const blockingToolStatuses = new Set([
  'missing',
  'failed',
  'blocked',
  'not_checked',
  'model_weight_missing',
  'model_weight_blocked',
])

export function evaluateContainerReadinessBlockers(input: {
  imageReadinessResults: ContainerImageReadinessResult[]
  productionReadyAllowed?: boolean
  externalBetaAllowed?: boolean
  realUserMediaTestingAllowed?: boolean
}): ContainerReadinessBlockerEvaluation {
  const blockers: ContainerReadinessBlocker[] = []
  const warnings: ContainerReadinessWarning[] = []
  const resultByImage = new Map(input.imageReadinessResults.map((result) => [result.imageId, result]))

  if (input.productionReadyAllowed) {
    blockers.push({ id: 'production-ready-allowed', summary: 'Production readiness was accidentally allowed.' })
  }
  if (input.externalBetaAllowed) {
    blockers.push({ id: 'external-beta-allowed', summary: 'External beta was accidentally allowed.' })
  }
  if (input.realUserMediaTestingAllowed) {
    blockers.push({ id: 'real-user-media-allowed', summary: 'Real user media testing was accidentally allowed.' })
  }

  for (const result of input.imageReadinessResults) {
    for (const finding of result.forbiddenFindings) {
      blockers.push({
        id: `forbidden-readiness-${result.imageId}`,
        imageId: result.imageId,
        summary: finding,
      })
    }

    if (result.imageId === 'api' && hasAny(result.expectedTools.map((tool) => tool.toolId), ['ffmpeg', 'ffprobe', 'torch-torchvision', 'model-weight-directories'])) {
      blockers.push({
        id: 'api-heavy-tool-expectation',
        imageId: 'api',
        summary: 'API readiness expectation must not include heavy media, GPU, or model-weight tools.',
      })
    }

    if (['cpu-worker', 'qa-worker', 'render-worker'].includes(result.imageId) && result.blockedTools.some((toolId) => [
      'torch-torchvision',
      'ctranslate2-faster-whisper',
      'birefnet-sam2-real-esrgan-film',
      'model-weight-directories',
    ].includes(toolId))) {
      blockers.push({
        id: `non-gpu-model-tools-${result.imageId}`,
        imageId: result.imageId,
        summary: `${result.imageId} readiness includes GPU/model package blockers.`,
      })
    }

    if (result.imageId === 'render-worker' && result.missingTools.includes('ffmpeg')) {
      blockers.push({
        id: 'render-ffmpeg-missing',
        imageId: 'render-worker',
        summary: 'Render image lacks FFmpeg readiness.',
      })
    }

    if (result.imageId === 'render-worker' && result.missingTools.includes('remotion')) {
      blockers.push({
        id: 'render-remotion-missing',
        imageId: 'render-worker',
        summary: 'Render image lacks Remotion readiness where required.',
      })
    }

    if (result.imageId === 'render-worker' && result.blockedTools.includes('libass')) {
      blockers.push({
        id: 'render-libass-failed',
        imageId: 'render-worker',
        summary: 'libass support failed; pending manual verification is warning-only, but failed support blocks readiness.',
      })
    }

    if (!result.imageDigest) {
      warnings.push({
        id: `image-digest-missing-${result.imageId}`,
        imageId: result.imageId,
        summary: `${result.imageId} readiness evidence does not include an image digest.`,
      })
    }
  }

  for (const imageId of requiredPhase23ImageIds) {
    const result = resultByImage.get(imageId)
    if (!result) {
      blockers.push({
        id: `missing-readiness-result-${imageId}`,
        imageId,
        summary: `${imageId} readiness result is missing.`,
      })
      continue
    }

    if (!['passed', 'warning'].includes(result.buildEvidenceStatus)) {
      blockers.push({
        id: `missing-build-evidence-${imageId}`,
        imageId,
        summary: `${imageId} must have human build/image evidence before Phase 23 image push readiness.`,
      })
    }

    if (!['passed', 'warning'].includes(result.readinessEvidenceStatus)) {
      blockers.push({
        id: `missing-readiness-evidence-${imageId}`,
        imageId,
        summary: `${imageId} must have passing or warning-only human readiness evidence before Phase 23.`,
      })
    }

    for (const tool of result.expectedTools) {
      const toolStatus = statusForExpectedTool(result, tool.toolId)
      if (tool.requiredForPhase23 && blockingToolStatuses.has(toolStatus)) {
        blockers.push({
          id: `required-tool-${imageId}-${tool.toolId}`,
          imageId,
          summary: `${imageId} required tool ${tool.toolId} is ${toolStatus}.`,
        })
      }
      if (toolStatus === 'pending_manual_review' || toolStatus === 'source_install_review_required') {
        warnings.push({
          id: `manual-review-${imageId}-${tool.toolId}`,
          imageId,
          summary: `${imageId} tool ${tool.toolId} is ${toolStatus}.`,
        })
      }
      if (toolStatus === 'optional_missing') {
        warnings.push({
          id: `optional-missing-${imageId}-${tool.toolId}`,
          imageId,
          summary: `${imageId} optional tool ${tool.toolId} is missing.`,
        })
      }
    }
  }

  const gpuResult = resultByImage.get('gpu-worker')
  const optionalImagesDeferred: ContainerReadinessImageId[] = gpuResult?.readinessEvidenceStatus === 'passed' ? [] : ['gpu-worker']
  if (optionalImagesDeferred.includes('gpu-worker')) {
    warnings.push({
      id: 'gpu-readiness-deferred',
      imageId: 'gpu-worker',
      summary: 'GPU readiness is deferred for non-GPU staging and remains required for later GPU/model phases.',
    })
  }

  for (const result of input.imageReadinessResults) {
    for (const tool of result.expectedTools.filter((expectedTool) => expectedTool.modelWeightRelated)) {
      warnings.push({
        id: `model-weight-blocked-${result.imageId}-${tool.toolId}`,
        imageId: result.imageId,
        summary: `${tool.toolId} remains blocked until model-weight and license approval.`,
      })
    }
  }

  const forbiddenOrLaunchBlockers = blockers
    .filter((blocker) => blocker.id.startsWith('forbidden-') || blocker.id.endsWith('-allowed'))
    .map((blocker) => blocker.summary)
  const phase22Warnings = [
    'Non-GPU image build/readiness evidence can remain pending for Phase 22 staging foundation setup.',
    ...warnings.map((warning) => warning.summary),
  ]
  const phase23Blockers = blockers.map((blocker) => blocker.summary)
  const requiredImagesReady = requiredPhase23ImageIds.filter((imageId) => {
    const result = resultByImage.get(imageId)
    return Boolean(result && ['passed', 'warning'].includes(result.buildEvidenceStatus) && ['passed', 'warning'].includes(result.readinessEvidenceStatus))
  })

  return {
    blockers,
    warnings,
    phase22Readiness: {
      readyForGcpStagingFoundationSetup: forbiddenOrLaunchBlockers.length === 0,
      gpuReadinessRequired: false,
      requiredBeforePhase22: [
        'Phase 18 activation audit exists.',
        'Phase 19 local baseline report exists.',
        'Phase 20 container build reporting exists.',
        'Phase 21 readiness reporting exists.',
        'Production, external beta, and real user media testing remain blocked.',
      ],
      blockers: forbiddenOrLaunchBlockers,
      warnings: phase22Warnings,
    },
    phase23Readiness: {
      readyForArtifactRegistryPush: phase23Blockers.length === 0,
      requiredImagesReady,
      optionalImagesDeferred,
      blockers: phase23Blockers,
      warnings: warnings.map((warning) => warning.summary),
    },
  }
}

function statusForExpectedTool(
  result: ContainerImageReadinessResult,
  toolId: ContainerImageReadinessResult['expectedTools'][number]['toolId'],
): ContainerImageReadinessResult['readinessEvidenceStatus'] {
  if (result.passedTools.includes(toolId)) return 'passed'
  if (result.missingTools.includes(toolId)) return 'missing'
  if (result.optionalMissingTools.includes(toolId)) return 'optional_missing'
  if (result.blockedTools.includes(toolId)) return 'blocked'
  if (result.manualReviewTools.includes(toolId)) return 'pending_manual_review'
  return result.readinessEvidenceStatus === 'not_checked' ? 'not_checked' : 'missing'
}

function hasAny(values: string[], candidates: string[]): boolean {
  return candidates.some((candidate) => values.includes(candidate))
}
