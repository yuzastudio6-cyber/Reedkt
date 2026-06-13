import {
  buildFirstControlledToolExecutionReports,
  summarizeFirstControlledToolExecutionDryRun,
} from '../activation/first-controlled-tool-execution-dry-run'

console.log(summarizeFirstControlledToolExecutionDryRun(buildFirstControlledToolExecutionReports()))
