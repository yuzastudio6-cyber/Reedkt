import {
  buildQwen25PrivateInvokeAuthPreflightStaticReport,
  getQwen25PrivateInvokeAuthPreflightPlan,
  runQwen25PrivateInvokeAuthPreflight,
} from '../activation/qwen2-5-vl-cloud-run-gpu-private-invoke-auth-preflight'

const execute = process.argv.includes('--execute')
const json = process.argv.includes('--json')
const plan = process.argv.includes('--plan')
const runIdArg = process.argv.find((arg) => arg.startsWith('--run-id='))
const runId = runIdArg?.split('=')[1]

if (plan) {
  console.log(JSON.stringify(getQwen25PrivateInvokeAuthPreflightPlan(), null, 2))
} else if (!execute) {
  const report = buildQwen25PrivateInvokeAuthPreflightStaticReport()
  if (json) {
    console.log(JSON.stringify(report, null, 2))
  } else {
    console.log([
      'Qwen2.5-VL private invocation auth preflight runner.',
      'No gcloud probes were run.',
      'Pass --execute with REEDITPRO_CONFIRM_QWEN25_VL_PRIVATE_INVOKE_AUTH_PREFLIGHT=true to run read-only Cloud Run and IAM describe probes.',
      'This CLI never fetches or prints identity tokens and never invokes Cloud Run.',
    ].join('\n'))
  }
} else {
  const result = await runQwen25PrivateInvokeAuthPreflight({ execute: true, runId })
  if (json) {
    console.log(JSON.stringify(result, null, 2))
  } else {
    console.log([
      'Qwen2.5-VL private invocation auth preflight completed.',
      `Run: ${result.runId}`,
      `Status: ${result.status}`,
      `Blockers: ${result.blockers.length ? result.blockers.join('; ') : 'none'}`,
      'Identity token fetched: false',
      'Cloud Run invocation attempted: false',
    ].join('\n'))
  }
}
