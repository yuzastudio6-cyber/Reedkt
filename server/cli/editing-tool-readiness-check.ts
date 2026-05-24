import {
  isEditingToolId,
  type EditingToolId,
} from '../tools/editing-tool-contracts'
import { runEditingToolReadiness } from '../tools/editing-tool-readiness'

const strict = process.argv.includes('--strict')
const toolId = parseOptionalTool(readArg('--tool'))
const requiredToolIds = parseToolList(readArgs('--require-tool'))

if (readArg('--tool') && !toolId) {
  console.error(`Unknown tool id: ${readArg('--tool')}`)
  process.exit(1)
}

const readiness = await runEditingToolReadiness({
  strict,
  toolId,
  requiredToolIds: requiredToolIds.length > 0 ? requiredToolIds : undefined,
})

console.log(JSON.stringify(readiness, null, 2))

if (strict && !readiness.ok) {
  process.exitCode = 1
}

function readArg(name: string): string | undefined {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : undefined
}

function readArgs(name: string): string[] {
  const values: string[] = []
  for (let index = 0; index < process.argv.length; index += 1) {
    if (process.argv[index] === name && process.argv[index + 1]) {
      values.push(process.argv[index + 1])
    }
  }
  return values
}

function parseOptionalTool(value: string | undefined): EditingToolId | undefined {
  return value && isEditingToolId(value) ? value : undefined
}

function parseToolList(values: string[]): EditingToolId[] {
  const parsed: EditingToolId[] = []
  for (const value of values) {
    if (!isEditingToolId(value)) {
      console.error(`Unknown required tool id: ${value}`)
      process.exit(1)
    }
    parsed.push(value)
  }
  return parsed
}
