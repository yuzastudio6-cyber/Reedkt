import {
  PRODUCT_INTERNAL_TESTING_SESSION_0_REQUIRED_CONFIRMATIONS,
  executeProductInternalTestingSession0,
  readProductInternalTestingSession0Summary,
} from '../activation/product-internal-testing-session-0'

if (!process.argv.includes('--execute')) {
  console.log(JSON.stringify({
    status: 'skipped',
    reason: 'execution_requires_explicit_execute_flag_and_metadata_confirmations',
    requiredConfirmations: PRODUCT_INTERNAL_TESTING_SESSION_0_REQUIRED_CONFIRMATIONS,
  }, null, 2))
  process.exit(0)
}

const result = await executeProductInternalTestingSession0({
  execute: true,
  metadataOnly: process.argv.includes('--metadata-only'),
  keepTemp: process.argv.includes('--keep-temp'),
})

console.log(JSON.stringify(readProductInternalTestingSession0Summary(), null, 2))
process.exit(result.exitCode)
