import {
  forbiddenConfirmationFragments,
  requiredConfirmations,
  summarizeOpenSourceToolStackBatch1QaReview,
  writeOpenSourceToolStackBatch1QaReviewArtifacts,
} from '../activation/open-source-tool-stack-batch-1-qa-review'

const execute = process.argv.includes('--execute')
const metadataOnly = process.argv.includes('--metadata-only')
const required = requiredConfirmations()

if (!execute) {
  console.log(summarizeOpenSourceToolStackBatch1QaReview())
  process.exit(0)
}

if (!metadataOnly) {
  throw new Error('Use --metadata-only. This QA packet may not run new proof execution.')
}

const missing = required.filter((name) => process.env[name] !== 'true')
if (missing.length) throw new Error(`Missing required confirmations: ${missing.join(', ')}`)

const forbidden = Object.entries(process.env)
  .filter(([name, value]) => name.startsWith('REEDITPRO_CONFIRM_') && value === 'true' && !required.includes(name))
  .map(([name]) => name)
  .filter((name) => forbiddenConfirmationFragments().some((fragment) => name.includes(fragment)))

if (forbidden.length) throw new Error(`Forbidden confirmations set: ${forbidden.join(', ')}`)

const reports = writeOpenSourceToolStackBatch1QaReviewArtifacts()
console.log(summarizeOpenSourceToolStackBatch1QaReview(reports))
