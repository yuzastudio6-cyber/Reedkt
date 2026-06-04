import { readDesktopBenchmarkRunnerSummary } from '../activation/desktop-benchmark-runner'

console.log(JSON.stringify(await readDesktopBenchmarkRunnerSummary(), null, 2))
