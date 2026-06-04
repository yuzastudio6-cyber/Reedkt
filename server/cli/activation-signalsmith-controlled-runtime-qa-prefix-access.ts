import {
  applySignalsmithControlledQaPrefixAccessFix,
  getSignalsmithControlledQaPrefixAccessPlan,
  writeSignalsmithControlledQaPrefixAccessReport,
} from '../activation/signalsmith-stretch-runtime/qa-prefix-access'

const execute = process.argv.includes('--execute')
const plan = process.argv.includes('--plan')

if (plan) {
  console.log(JSON.stringify(getSignalsmithControlledQaPrefixAccessPlan(), null, 2))
} else if (execute) {
  console.log(JSON.stringify(await applySignalsmithControlledQaPrefixAccessFix(), null, 2))
} else {
  console.log(JSON.stringify(await writeSignalsmithControlledQaPrefixAccessReport(), null, 2))
}
