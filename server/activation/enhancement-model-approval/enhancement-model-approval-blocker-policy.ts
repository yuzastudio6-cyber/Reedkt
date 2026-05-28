import type {
  EnhancementModelApprovalDecision,
  EnhancementModelDownloadCommandPlan,
  EnhancementModelStoragePlan,
  EnhancementModelWeightManifestRecord,
} from './enhancement-model-approval-types'

export function buildEnhancementModelApprovalBlockers(input: {
  decisions: EnhancementModelApprovalDecision[]
  approvedManifest?: EnhancementModelWeightManifestRecord
  storagePlan: EnhancementModelStoragePlan
  downloadCommandPlan: EnhancementModelDownloadCommandPlan[]
}): { blockers: string[]; warnings: string[] } {
  const blockers: string[] = []
  const warnings: string[] = []
  const approved = input.decisions.filter((decision) => decision.stagingSampleFirstEnhancementAllowed)

  if (approved.length !== 1) blockers.push(`Expected exactly one staging-approved enhancement model; found ${approved.length}.`)
  if (approved[0]?.candidateId !== 'xinntao_real_esrgan_x4plus') blockers.push('Only RealESRGAN_x4plus may be staging-approved in Phase 34A.')
  if (!input.approvedManifest || input.approvedManifest.modelWeightManifestId !== 'real_esrgan_x4plus_staging_v1') blockers.push('RealESRGAN_x4plus staging manifest is missing.')
  if (input.approvedManifest?.checksum !== 'missing_until_download' && !/^[a-f0-9]{64}$/.test(input.approvedManifest?.checksum ?? '')) {
    blockers.push('RealESRGAN_x4plus manifest checksum must be missing_until_download or a valid Phase 34B SHA-256.')
  }
  if (!input.storagePlan.privateStorageRequired || input.storagePlan.publicAccessAllowed) blockers.push('Storage plan must require private model storage.')
  if (input.storagePlan.sourceMediaBucketAllowed || input.storagePlan.stagingStoragePath.includes('source-media')) blockers.push('Storage plan must not use source-media bucket.')
  if (input.downloadCommandPlan.length === 0) blockers.push('Text-only Real-ESRGAN download command plan is missing.')
  if (input.downloadCommandPlan.some((plan) => plan.executionMode !== 'text_only' || plan.safeToRunNow !== false)) blockers.push('Download command plan must be text-only and not safe to run now.')

  for (const decision of input.decisions) {
    if (decision.realEsrganExecutionAllowed) blockers.push('Real-ESRGAN execution must remain blocked in Phase 34A.')
    if (decision.fullVideoEnhancementAllowed) blockers.push('Full-video blind enhancement must remain blocked.')
    if (decision.filmExecutionAllowed) blockers.push('FILM execution must remain blocked.')
    if (decision.filmDownloadAllowed) blockers.push('FILM download must remain blocked.')
    if (decision.slowMotionExecutionAllowed) blockers.push('Slow-motion execution must remain blocked.')
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
