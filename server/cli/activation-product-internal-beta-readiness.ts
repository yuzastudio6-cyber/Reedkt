import {
  PRODUCT_INTERNAL_BETA_READINESS_REQUIRED_CONFIRMATIONS,
  executeProductInternalBetaReadiness,
  readProductInternalBetaReadinessSummary,
} from '../activation/product-internal-beta-readiness'

if (!process.argv.includes('--execute')) {
  console.log(JSON.stringify({
    status: 'skipped',
    reason: 'execution_requires_explicit_execute_flag_and_metadata_confirmations',
    requiredConfirmations: PRODUCT_INTERNAL_BETA_READINESS_REQUIRED_CONFIRMATIONS,
  }, null, 2))
  process.exit(0)
}

const result = await executeProductInternalBetaReadiness({
  execute: true,
  metadataOnly: process.argv.includes('--metadata-only'),
  keepTemp: process.argv.includes('--keep-temp'),
})

console.log(JSON.stringify(readProductInternalBetaReadinessSummary(), null, 2))
process.exit(result.exitCode)
