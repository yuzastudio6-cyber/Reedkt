# Canonical customer estimate authority

Status: private/internal server-owned estimate recalculation. No wallet,
reservation, ledger, billing, provider, worker, tool, or render side effect is
authorized.

The canonical publication service no longer treats arbitrary itemized totals
as a complete customer estimate. Before a plan is presented, the server:

1. freezes the incoming non-service estimate lines as the conservative
   billable-work cost basis;
2. replaces any legacy service-fee line with one policy-derived line;
3. adds any server-derived Living Frame tool-cost ceilings;
4. derives the exact service/edit fee from the confirmed edit level and
   MasterTiming duration; and
5. content-addresses the source estimate, normalized estimate, policy inputs,
   and optional Living Frame projection in the plan hash.

The user sees and approves the normalized estimate. Credits are not reserved
until canonical approval. Final charging still requires actual billable tool
cost plus the policy fee, and unused approved reservation must be released.
Provider variance or WeEditPro failure cannot silently charge an unapproved
overage.

The current internal names `REEDITPRO_CREDIT_POLICY_VERSION` and
`reeditpro_service_fee` are stable policy identifiers. The user-facing product
label is WeEditPro.

Edits at 60 minutes or longer fail closed for a reviewed custom estimate.
Tool owners continue to exclude the service fee from their own cost evidence.
