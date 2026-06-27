import {
  buildQwen25PrivateInvokeSmokeStaticReport,
  runQwen25PrivateInvokeSmoke,
} from '../activation/qwen2-5-vl-cloud-run-gpu-private-invoke-smoke-execute'

const execute = process.argv.includes('--execute')
const json = process.argv.includes('--json')
const runIdArg = process.argv.find((arg) => arg.startsWith('--run-id='))
const preflightRunIdArg = process.argv.find((arg) => arg.startsWith('--preflight-run-id='))
const runId = runIdArg?.split('=')[1]
const preflightRunId = preflightRunIdArg?.split('=')[1]

if (!execute) {
  const report = buildQwen25PrivateInvokeSmokeStaticReport()
  if (json) {
    console.log(JSON.stringify(report, null, 2))
  } else {
    console.log([
      'Qwen2.5-VL private invoke smoke runner.',
      'No gcloud token fetch or Cloud Run request was run.',
      'Pass --execute with REEDITPRO_CONFIRM_QWEN25_VL_PRIVATE_INVOKE_SMOKE=true to run one bounded authenticated contract request.',
      'This CLI redacts service URL and token values and keeps inference disabled.',
    ].join('\n'))
  }
} else {
  const result = await runQwen25PrivateInvokeSmoke({ execute: true, runId, preflightRunId })
  if (json) {
    console.log(JSON.stringify(result, null, 2))
  } else {
    console.log([
      'Qwen2.5-VL private invoke smoke completed.',
      `Run: ${result.runId}`,
      `Status: ${result.status}`,
      `Blockers: ${result.blockers.length ? result.blockers.join('; ') : 'none'}`,
      `Response: ${result.smokeResponse?.classificationStatus ?? 'none'}`,
      'Token value printed: false',
      'Inference run: false',
    ].join('\n'))
  }
}
