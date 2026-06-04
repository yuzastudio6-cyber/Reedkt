import { readLocalWorkerSidecarSummary } from '../activation/local-worker-sidecar-foundation'

console.log(JSON.stringify(readLocalWorkerSidecarSummary(), null, 2))
