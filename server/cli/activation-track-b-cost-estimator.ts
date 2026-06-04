import {
  readTrackBCostEstimatorSummary,
  writeTrackBCostEstimatorArtifacts,
} from '../activation/track-b-cost-estimator'

await writeTrackBCostEstimatorArtifacts()

console.log(JSON.stringify(readTrackBCostEstimatorSummary(), null, 2))
