import {
  startCanonicalSam31VertexQualificationFromEnvironment,
} from './canonical-sam3_1-source-checkpoint-qualification-vertex-operator'

const result = await startCanonicalSam31VertexQualificationFromEnvironment(
  process.env,
)
process.stdout.write(`${JSON.stringify(result)}\n`)
