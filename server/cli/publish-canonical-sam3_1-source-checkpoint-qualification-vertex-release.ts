import {
  publishCanonicalSam31VertexQualificationReleaseFromEnvironment,
} from './canonical-sam3_1-source-checkpoint-qualification-vertex-release-operator'

const result =
  await publishCanonicalSam31VertexQualificationReleaseFromEnvironment(
    process.env,
  )
process.stdout.write(`${JSON.stringify(result)}\n`)
