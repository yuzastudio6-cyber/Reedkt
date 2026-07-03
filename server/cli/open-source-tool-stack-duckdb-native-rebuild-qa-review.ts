import {
  forbiddenConfirmationFragments,
  requiredConfirmations,
  summarizeOpenSourceToolStackDuckdbNativeRebuildQaReview,
  writeOpenSourceToolStackDuckdbNativeRebuildQaReviewArtifacts,
} from '../activation/open-source-tool-stack-duckdb-native-rebuild-qa-review'

const execute = process.argv.includes('--execute')
const metadataOnly = process.argv.includes('--metadata-only')
const required = requiredConfirmations()

if (!execute) {
  console.log(summarizeOpenSourceToolStackDuckdbNativeRebuildQaReview())
  process.exit(0)
}

if (!metadataOnly) {
  throw new Error('Use --metadata-only. This QA packet may not run rebuilds, imports, probes, or proof execution.')
}

const missing = required.filter((name) => process.env[name] !== 'true')
if (missing.length) throw new Error(`Missing required confirmations: ${missing.join(', ')}`)

const forbidden = Object.entries(process.env)
  .filter(([name, value]) => name.startsWith('REEDITPRO_CONFIRM_') && value === 'true' && !required.includes(name))
  .map(([name]) => name)
  .filter((name) => forbiddenConfirmationFragments().some((fragment) => name.includes(fragment)))

if (forbidden.length) throw new Error(`Forbidden confirmations set: ${forbidden.join(', ')}`)

const reports = writeOpenSourceToolStackDuckdbNativeRebuildQaReviewArtifacts()
console.log(summarizeOpenSourceToolStackDuckdbNativeRebuildQaReview(reports))
