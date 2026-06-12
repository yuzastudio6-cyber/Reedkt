import {
  PRODUCT_INTERNAL_TESTING_LAUNCH_REHEARSAL_REQUIRED_CONFIRMATIONS,
  executeProductInternalTestingLaunchRehearsal,
  readProductInternalTestingLaunchRehearsalSummary,
} from '../activation/product-internal-testing-launch-rehearsal'

if (!process.argv.includes('--execute')) {
  console.log(JSON.stringify({
    status: 'skipped',
    reason: 'execution_requires_explicit_execute_flag_and_metadata_confirmations',
    requiredConfirmations: PRODUCT_INTERNAL_TESTING_LAUNCH_REHEARSAL_REQUIRED_CONFIRMATIONS,
  }, null, 2))
  process.exit(0)
}

const result = await executeProductInternalTestingLaunchRehearsal({
  execute: true,
  metadataOnly: process.argv.includes('--metadata-only'),
  keepTemp: process.argv.includes('--keep-temp'),
})

console.log(JSON.stringify(readProductInternalTestingLaunchRehearsalSummary(), null, 2))
process.exit(result.exitCode)
