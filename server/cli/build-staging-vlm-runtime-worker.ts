import {
  buildAndPushVlmRuntimeStagingImage,
  phase39CVlmRuntimeImageRef,
} from '../activation/vlm-runtime'

const execute = process.argv.includes('--execute')
const runIdArg = process.argv.find((arg) => arg.startsWith('--run-id='))
const runId = runIdArg?.split('=')[1] ?? `phase39c-${new Date().toISOString().replace(/[^0-9A-Za-z]/g, '').slice(0, 15)}`

if (!execute) {
  console.log([
    'Phase 39C staging VLM runtime worker image build helper.',
    'No Docker build or push performed.',
    `Planned image: ${phase39CVlmRuntimeImageRef(runId)}`,
    'Pass --execute with REEDITPRO_CONFIRM_VLM_RUNTIME_DOCKER_BUILD=true and REEDITPRO_CONFIRM_VLM_RUNTIME_DOCKER_PUSH=true to build and push.',
  ].join('\n'))
} else if (
  process.env.REEDITPRO_CONFIRM_VLM_RUNTIME_DOCKER_BUILD !== 'true'
  || process.env.REEDITPRO_CONFIRM_VLM_RUNTIME_DOCKER_PUSH !== 'true'
) {
  throw new Error('Both REEDITPRO_CONFIRM_VLM_RUNTIME_DOCKER_BUILD=true and REEDITPRO_CONFIRM_VLM_RUNTIME_DOCKER_PUSH=true are required.')
} else {
  const result = await buildAndPushVlmRuntimeStagingImage(runId)
  console.log(JSON.stringify(result, null, 2))
  if (result.blockers.length) process.exitCode = 1
}
