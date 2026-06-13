import {
  buildControlledToolExecutionApprovalReports,
  summarizeControlledToolExecutionApproval,
} from '../activation/controlled-tool-execution-approval'

console.log(summarizeControlledToolExecutionApproval(buildControlledToolExecutionApprovalReports()))
