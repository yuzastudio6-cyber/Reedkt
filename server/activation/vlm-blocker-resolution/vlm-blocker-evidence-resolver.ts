import { getApprovedTrackIntegrationAuditEvidence } from '../track-integration-audit'
import { getApprovedVlmRuntimeEvidence } from '../vlm-runtime'
import { vlmRuntimeConfig } from '../vlm-runtime/vlm-runtime-policy'
import { vlmBlockerResolutionConfig } from './vlm-blocker-resolution-policy'
import type { VlmBlockerEvidence } from './vlm-blocker-resolution-types'

export function resolvePhase47AEvidence() {
  const evidence = getApprovedTrackIntegrationAuditEvidence()
  const blockers: string[] = []
  if (evidence.status !== 'completed') blockers.push('Phase 47A approved evidence is not completed.')
  if (evidence.trackAReadiness.status !== 'ready') blockers.push('Phase 47A does not record Track A as ready.')
  if (evidence.trackBReadiness.status !== 'partial') blockers.push('Phase 47A does not record Track B as partial.')
  if (evidence.integrationReadiness.status !== 'blocked') blockers.push('Phase 47A integration readiness is not blocked as expected.')
  if (!evidence.qaReportUri?.startsWith('gs://reeditpro-staging-reeditpro-qa-artifacts/activation-track-integration/phase47a/')) {
    blockers.push('Phase 47A private QA report URI is missing or outside the approved private prefix.')
  }
  return { evidence, blockers }
}

export function resolveVlmBlockerEvidence(): VlmBlockerEvidence {
  const evidence = getApprovedVlmRuntimeEvidence()
  const combinedText = [...evidence.blockers, ...evidence.warnings].join('\n')
  const qaReportUri = evidence.qaReportUri ?? vlmBlockerResolutionConfig.phase39cReportGcsUri
  return {
    phase39cRunId: evidence.runId,
    modelId: evidence.modelId,
    revision: evidence.revision,
    modelGcsPath: evidence.modelGcsPath,
    aggregateSha256: evidence.aggregateSha256,
    runtime: 'vllm',
    vllmVersion: vlmRuntimeConfig.requiredVllmVersion,
    gpuType: 'L4',
    cloudRunJobName: vlmRuntimeConfig.stagingCloudRunJobName,
    cloudRunExecutionId: 'reeditpro-stg-vlm-runtime-phase39c-xcz4t',
    runtimeImage: 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/vlm-runtime-phase39c:phase39c-20260531t214216',
    oomStage: 'vllm_engine_initialization_before_generated_fixture_inference',
    exactBlocker:
      'Approved Qwen/Qwen3-VL-8B-Instruct Phase 39C generated-fixture runtime copied and checksum-verified private model assets, then failed during vLLM engine initialization on L4 with CUDA OOM before generated fixture inference.',
    qaArtifactsProduced: Boolean(qaReportUri),
    qaReportUri,
    blockers: [
      ...evidence.blockers,
      ...(combinedText.includes('CUDA out of memory') || combinedText.includes('Engine core initialization failed')
        ? []
        : ['Phase 39C evidence does not include the expected CUDA OOM / engine initialization blocker text.']),
    ],
    warnings: evidence.warnings,
  }
}
