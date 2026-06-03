import { buildBraveSearchFixtureNormalizerReport, summarizeBraveSearchFixtureNormalizerReport } from '../activation/brave-search-fixture-normalizer'

const json = process.argv.includes('--json')
const report = buildBraveSearchFixtureNormalizerReport()

if (json) {
  console.log(JSON.stringify(report, null, 2))
} else {
  console.log(summarizeBraveSearchFixtureNormalizerReport(report))
}
