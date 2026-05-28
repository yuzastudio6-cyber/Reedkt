import type {
  MaskModelApprovalDecision,
  MaskModelDownloadCommandPlan,
  MaskModelStoragePlan,
  MaskModelWeightManifestRecord,
} from './mask-model-approval-types'

export function buildMaskModelApprovalBlockers(input: {
  decisions: MaskModelApprovalDecision[]
  approvedManifest?: MaskModelWeightManifestRecord
  storagePlan: MaskModelStoragePlan
  downloadCommandPlan: MaskModelDownloadCommandPlan[]
}): { blockers: string[]; warnings: string[] } {
  const blockers: string[] = []
  const warnings: string[] = []
  const approved = input.decisions.filter((decision) => decision.stagingSingleFrameBackgroundRemovalAllowed)

  if (approved.length !== 1) blockers.push(`Expected exactly one staging-approved mask model; found ${approved.length}.`)
  if (approved[0]?.candidateId !== 'zhengpeng7_birefnet') blockers.push('Only ZhengPeng7/BiRefNet may be staging-approved in Phase 33A.')
  if (!input.approvedManifest || input.approvedManifest.modelWeightManifestId !== 'birefnet_main_staging_v1') blockers.push('BiRefNet staging manifest is missing.')
  if (input.approvedManifest?.checksum !== 'missing_until_download') blockers.push('Phase 33A manifest checksum must remain missing_until_download.')
  if (!input.storagePlan.privateStorageRequired || input.storagePlan.publicAccessAllowed) blockers.push('Storage plan must require private model storage.')
  if (input.storagePlan.sourceMediaBucketAllowed || input.storagePlan.stagingStoragePath.includes('source-media')) blockers.push('Storage plan must not use source-media bucket.')
  if (input.downloadCommandPlan.length === 0) blockers.push('Text-only BiRefNet download command plan is missing.')
  if (input.downloadCommandPlan.some((plan) => plan.executionMode !== 'text_only' || plan.safeToRunNow !== false)) blockers.push('Download command plan must be text-only and not safe to run now.')

  for (const decision of input.decisions) {
    if (decision.candidateId === 'facebook_sam2_hiera_tiny' && decision.sam2ExecutionAllowed) blockers.push('SAM2 execution must remain blocked.')
    if (decision.textBehindSubjectExecutionAllowed) blockers.push('Text-behind-subject execution must remain blocked.')
    if (decision.productionAllowed || decision.externalBetaAllowed || decision.paidProductionAllowed || decision.broadRealUserMediaAllowed) {
      blockers.push(`${decision.modelName} incorrectly unblocks launch gates.`)
    }
    warnings.push(...decision.warnings)
  }

  return {
    blockers: Array.from(new Set(blockers)),
    warnings: Array.from(new Set(warnings)),
  }
}
