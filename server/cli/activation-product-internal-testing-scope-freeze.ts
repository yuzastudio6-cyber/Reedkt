import {
  PRODUCT_INTERNAL_TESTING_SCOPE_FREEZE_REQUIRED_CONFIRMATIONS,
  executeProductInternalTestingScopeFreeze,
  readProductInternalTestingScopeFreezeSummary,
} from '../activation/product-internal-testing-scope-freeze'

if (!process.argv.includes('--execute')) {
  console.log(JSON.stringify({
    status: 'skipped',
    reason: 'execution_requires_explicit_execute_flag_and_metadata_confirmations',
    requiredConfirmations: PRODUCT_INTERNAL_TESTING_SCOPE_FREEZE_REQUIRED_CONFIRMATIONS,
  }, null, 2))
  process.exit(0)
}

const result = await executeProductInternalTestingScopeFreeze({
  execute: true,
  metadataOnly: process.argv.includes('--metadata-only'),
  keepTemp: process.argv.includes('--keep-temp'),
})

console.log(JSON.stringify(readProductInternalTestingScopeFreezeSummary(), null, 2))
process.exit(result.exitCode)
