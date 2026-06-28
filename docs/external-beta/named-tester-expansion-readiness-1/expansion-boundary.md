# Named Tester Expansion Boundary

Packet: `RP-EXTERNAL-BETA-NAMED-TESTER-EXPANSION-READINESS-1`

## Allowed Current Lane

- Tester: `aiediting@reeditpro.com`
- Access class: `controlled_single_tester_only`
- Support posture: `manual_owner_observed_single_tester_support`
- Rollback posture: `disable_or_pause_single_tester_access_if_blocker_appears`

## Required Before Adding Testers

Any future tester expansion packet must name every additional identity exactly and must preserve:

- the owner-managed Google Group boundary `external-beta-testers@reeditpro.com`;
- authenticated-only Cloud Run access;
- no `allUsers` invoker grant;
- no `allAuthenticatedUsers` invoker grant;
- no domain-wide grant;
- no production service access;
- no service-role secret exposure;
- no provider/model calls from frontend;
- no worker execution from raw chat;
- no generation before approved plan and credit estimate;
- no signed/public artifacts;
- no paid billing;
- no final delivery/export.

If no explicit additional named tester list exists, the only safe decision is:

`blocked_no_additional_named_tester_list`
