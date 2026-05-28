import type {
  ModelApprovalDecision,
  ModelDownloadCommandPlan,
  ModelStoragePlan,
  ModelWeightManifestRecord,
} from './model-approval-types'

export function buildModelApprovalBlockers(input: {
  decisions: ModelApprovalDecision[]
  approvedManifest?: ModelWeightManifestRecord
  storagePlan: ModelStoragePlan
  downloadCommandPlan: ModelDownloadCommandPlan[]
}): { blockers: string[]; warnings: string[] } {
  const blockers: string[] = []
  const warnings: string[] = []
  const tinyDecision = input.decisions.find((decision) => decision.candidateId === 'systran_faster_whisper_tiny')

  if (!tinyDecision?.stagingSpeechCaptionAllowed) {
    blockers.push(...(tinyDecision?.blockers.length ? tinyDecision.blockers : ['Systran/faster-whisper-tiny is not staging-approved.']))
  }
  if (!input.approvedManifest) blockers.push('Approved faster-whisper tiny manifest is missing.')
  if (input.storagePlan.publicAccessAllowed) blockers.push('Model storage plan allows public access.')
  if (input.storagePlan.sourceMediaBucketAllowed || /source-media/i.test(input.storagePlan.stagingStoragePath)) blockers.push('Model storage plan uses source-media storage.')
  if (input.storagePlan.committedToGitAllowed) blockers.push('Model storage plan allows model files in git.')
  if (input.downloadCommandPlan.some((plan) => plan.safeToRunNow)) blockers.push('Download command plan must not be safe-to-run-now in Phase 26.')
  if (input.downloadCommandPlan.some((plan) => !plan.requiresFutureExecutionFlag)) blockers.push('Download command plan must require a future execution flag.')
  if (input.downloadCommandPlan.some((plan) => /HF_TOKEN|HUGGINGFACE_TOKEN|SECRET|PASSWORD|KEY=/i.test(plan.commandString))) {
    blockers.push('Download command plan must not print or require secret values.')
  }
  if (input.approvedManifest?.checksum === 'missing_until_download') {
    warnings.push('Approved manifest checksum remains missing until actual model download/load phase.')
  }
  warnings.push(...input.storagePlan.warnings)

  return { blockers: Array.from(new Set(blockers)), warnings: Array.from(new Set(warnings)) }
}
