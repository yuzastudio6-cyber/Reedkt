import {
  TOOL_READINESS_NO_SCOPE,
  TOOL_READINESS_POLICY,
} from "./tool-readiness-policy.js";
import { listToolReadinessEntries } from "./tool-readiness-registry.js";
import { runToolReadinessDiagnostics } from "./tool-readiness-diagnostics.js";
import {
  TOOL_READINESS_STATES,
  type ToolReadinessReport,
} from "./tool-readiness-types.js";

export function buildToolReadinessReport(generatedAt = new Date().toISOString()): ToolReadinessReport {
  const tools = listToolReadinessEntries();
  const diagnostics = runToolReadinessDiagnostics(tools);

  return {
    prompt: "13",
    status: diagnostics.status === "passed" ? "ready_for_foundation_checks" : "blocked",
    generatedAt,
    policy: TOOL_READINESS_POLICY,
    readinessStates: TOOL_READINESS_STATES,
    tools,
    diagnostics,
    noScope: [...TOOL_READINESS_NO_SCOPE],
    nextPrompt: "Prompt 14 - Worker Claim And Execution Contract Hardening",
  };
}
