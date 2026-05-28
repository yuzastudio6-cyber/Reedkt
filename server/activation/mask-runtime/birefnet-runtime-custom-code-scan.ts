import { getApprovedMaskModelDownloadEvidence } from '../mask-model-download'
import type { BiRefNetCustomCodeScanSummary } from './birefnet-runtime-types'

export function buildBiRefNetCustomCodeScanSummary(): BiRefNetCustomCodeScanSummary {
  const evidence = getApprovedMaskModelDownloadEvidence()
  const customCodeFiles = evidence.customCodeFiles
  const executedAllowlist = ['BiRefNet_config.py', 'birefnet.py']
  const neverImportedFiles = customCodeFiles.filter((file) => !executedAllowlist.includes(file))
  const blockers: string[] = []
  const warnings: string[] = []

  for (const file of executedAllowlist) {
    if (!customCodeFiles.includes(file)) blockers.push(`Required BiRefNet local loader file is missing from custom-code evidence: ${file}.`)
  }
  if (neverImportedFiles.includes('handler.py')) {
    warnings.push('handler.py includes Hugging Face endpoint/network helper behavior and must not be imported or executed in Phase 33C.')
  }

  return {
    customCodeFiles,
    executedAllowlist,
    neverImportedFiles,
    blockedPatterns: ['requests/network imports in executed files', 'subprocess/shell execution in executed files', 'unsafe writes outside runtime temp paths'],
    warnings,
    blockers,
  }
}
