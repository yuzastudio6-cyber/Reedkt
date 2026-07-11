import { activateOfflineNodeRunners } from '../tool-execution/node-runner-activation/offline-node-runner-activation-service'

if (process.argv.length !== 2) {
  process.stderr.write('Offline Node runner activation does not accept caller arguments.\n')
  process.exitCode = 2
} else {
  activateOfflineNodeRunners()
    .then((attestation) => {
      process.stdout.write(`${JSON.stringify({
        schemaVersion: attestation.schemaVersion,
        attestationHash: attestation.attestationHash,
        imageManifestSha256: attestation.build.imageManifestSha256,
        runnerBundleSha256: attestation.runnerBundle.sha256,
        summary: attestation.summary,
        readiness: attestation.readiness,
        blockerCount: attestation.blockers.length,
      })}\n`)
    })
    .catch(() => {
      process.stderr.write('Offline Node runner private activation failed closed.\n')
      process.exitCode = 1
    })
}
