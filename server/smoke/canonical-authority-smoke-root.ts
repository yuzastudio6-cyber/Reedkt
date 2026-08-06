/**
 * Canonical authority smokes import one another and must share a root inside a
 * process, while concurrent npm/agent processes must never delete each
 * other's fixtures. The process ID supplies that isolation without accepting
 * a caller-controlled filesystem path.
 */
export const canonicalAuthoritySmokeRoot =
  `/tmp/reeditpro-edit-planning-authority-smoke-${process.pid}` as const
