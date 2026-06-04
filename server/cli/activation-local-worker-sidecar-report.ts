import {
  readLocalWorkerSidecarSummary,
  writeLocalWorkerSidecarArtifacts,
} from '../activation/local-worker-sidecar-foundation'

await writeLocalWorkerSidecarArtifacts()

console.log(JSON.stringify(readLocalWorkerSidecarSummary(), null, 2))
