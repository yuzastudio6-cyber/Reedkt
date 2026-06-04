import {
  readDesktopBenchmarkRunnerSummary,
  writeDesktopBenchmarkRunnerArtifacts,
} from '../activation/desktop-benchmark-runner'

const includeLocalBenchmark = process.argv.includes('--local-benchmark') && process.argv.includes('--execute')

await writeDesktopBenchmarkRunnerArtifacts(undefined, { includeLocalBenchmark })

console.log(JSON.stringify(await readDesktopBenchmarkRunnerSummary(), null, 2))
