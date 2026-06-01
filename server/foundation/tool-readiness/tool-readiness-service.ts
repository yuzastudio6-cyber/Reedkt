import { TOOL_READINESS_POLICY } from "./tool-readiness-policy.js";
import {
  getToolReadinessEntry,
  listToolReadinessEntries,
} from "./tool-readiness-registry.js";
import { runToolReadinessDiagnostics } from "./tool-readiness-diagnostics.js";

export function listToolReadiness() {
  const tools = listToolReadinessEntries();
  const diagnostics = runToolReadinessDiagnostics(tools);

  return {
    policy: TOOL_READINESS_POLICY,
    tools,
    diagnostics,
  };
}

export function getToolReadiness(toolId: string) {
  const tool = getToolReadinessEntry(toolId);

  if (tool) {
    return {
      found: true,
      policy: TOOL_READINESS_POLICY,
      tool,
    };
  }

  return {
    found: false,
    policy: TOOL_READINESS_POLICY,
    tool: {
      toolId,
      readinessState: TOOL_READINESS_POLICY.defaultState,
      allowedInRuntime: false,
      blockedReason:
        "Tool is not registered in the Prompt 13 readiness registry and therefore fails closed.",
    },
  };
}

export function getToolReadinessDiagnosticsSummary() {
  return {
    policy: TOOL_READINESS_POLICY,
    diagnostics: runToolReadinessDiagnostics(),
  };
}
