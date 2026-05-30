import { buildFilmRuntimeIamPlan } from '../activation/film-runtime'

const plan = buildFilmRuntimeIamPlan()
if (process.argv.includes('--json')) console.log(JSON.stringify(plan, null, 2))
else console.log([
  'Phase 38C FILM runtime IAM plan',
  'Apply only missing conditional prefix-scoped bindings.',
  '',
  ...plan.map((binding) => `${binding.bindingId}: ${binding.commandString}`),
].join('\n'))
