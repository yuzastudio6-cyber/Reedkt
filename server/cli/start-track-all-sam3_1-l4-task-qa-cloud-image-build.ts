import {
  executeCanonicalTrackAllSam31L4TaskQaCloudImageBuildOperator,
} from '../services/canonical-track-all-sam3_1-l4-task-qa-cloud-image-build-operator'

async function main(): Promise<void> {
  const result =
    await executeCanonicalTrackAllSam31L4TaskQaCloudImageBuildOperator({
      argv: process.argv.slice(2),
      environment: process.env,
    })
  process.stdout.write(`${JSON.stringify(result)}\n`)
}

main().catch((error: unknown) => {
  const message = error instanceof Error
    ? error.message
    : 'track_all_l4_cloud_image_build_operator_failed'
  process.stderr.write(`${message}\n`)
  process.exitCode = 1
})
