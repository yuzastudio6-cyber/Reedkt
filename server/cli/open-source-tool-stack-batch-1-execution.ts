import {
  forbiddenConfirmationFragments,
  requiredConfirmations,
  summarizeOpenSourceToolStackBatch1Execution,
  writeOpenSourceToolStackBatch1ExecutionArtifacts,
} from '../activation/open-source-tool-stack-batch-1-execution'

const execute = process.argv.includes('--execute')
const noInstall = process.argv.includes('--no-install')
const noLockMutation = process.argv.includes('--no-lock-mutation')
const required = requiredConfirmations()

if (!execute) {
  console.log(summarizeOpenSourceToolStackBatch1Execution())
  process.exit(0)
}

if (!noInstall) {
  throw new Error('Use --no-install. This packet may not install dependencies or add packages.')
}

if (!noLockMutation) {
  throw new Error('Use --no-lock-mutation. This packet may not mutate package-lock.json.')
}

const missing = required.filter((name) => process.env[name] !== 'true')
if (missing.length) throw new Error(`Missing required confirmations: ${missing.join(', ')}`)

const forbidden = Object.entries(process.env)
  .filter(([name, value]) => name.startsWith('REEDITPRO_CONFIRM_') && value === 'true' && !required.includes(name))
  .map(([name]) => name)
  .filter((name) => forbiddenConfirmationFragments().some((fragment) => name.includes(fragment)))

if (forbidden.length) throw new Error(`Forbidden confirmations set: ${forbidden.join(', ')}`)

const reports = writeOpenSourceToolStackBatch1ExecutionArtifacts({ runProofs: true, runNpmCi: true })
console.log(summarizeOpenSourceToolStackBatch1Execution(reports))
