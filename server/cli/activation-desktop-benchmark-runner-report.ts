import {
  readDesktopBenchmarkRunnerSummary,
  writeDesktopBenchmarkRunnerArtifacts,
} from '../activation/desktop-benchmark-runner'

await writeDesktopBenchmarkRunnerArtifacts()

console.log(JSON.stringify(await readDesktopBenchmarkRunnerSummary(), null, 2))
