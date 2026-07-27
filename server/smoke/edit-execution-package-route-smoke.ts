/**
 * Compatibility entry point for the execution-package route smoke.
 *
 * The former harness constructed a caller-authored snapshot, reservation, tool
 * list, and readiness hints, then exercised legacy execution endpoints that
 * are intentionally disabled. Keeping that harness runnable would test a
 * second, obsolete execution authority.
 *
 * The canonical authority smoke owns the current HTTP proof. It creates the
 * plan, estimate, approval, reservation, immutable snapshot, jobs, and package
 * from server-owned state; exercises the browser-safe package request and
 * private/internal package routes; proves replay and tenant isolation; rejects
 * caller-authored legacy fields; and confirms that disabled legacy routes stay
 * fail-closed.
 */
await import('./edit-planning-authority-smoke')

console.log(JSON.stringify({
  ok: true,
  disposition: 'canonical_edit_planning_authority_route_smoke',
  obsoleteAuthorityRemoved: true,
  checks: [
    'server_owned_execution_package_request',
    'browser_safe_bounded_receipt',
    'exact_replay_and_tenant_isolation',
    'caller_authored_snapshot_reservation_tool_and_readiness_fields_rejected',
    'legacy_execution_routes_fail_closed',
  ],
}))
