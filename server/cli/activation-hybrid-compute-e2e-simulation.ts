import {
  readHybridComputeE2ESummary,
  writeHybridComputeE2EArtifacts,
} from '../activation/hybrid-compute-e2e-simulation'

await writeHybridComputeE2EArtifacts()

console.log(JSON.stringify(readHybridComputeE2ESummary(), null, 2))
