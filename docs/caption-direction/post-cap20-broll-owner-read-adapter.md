# Post-CAP-20 B-roll Owner-Read Adapter

Milestone: `POST-CAP-20-BROLL-OWNER-READ-ADAPTER`

Status: `public_adapter_frozen_authenticated_result_not_mounted`

Caption adapter digest:
`61756b22bb38e113fa1f27805a7e7713385529917d3dc0e3ba42949ba79774b2`.

## Outcome

Caption now has a closed, Caption-owned adapter for the published B-roll public
owner-read request and result. The adapter does not import B-roll server code.
It recreates only the frozen public wire shape and validates the exact source
contract receipt before projecting an authenticated result into the existing
`caption-broll-owner-read-binding-v1` Caption contract.

This closes the Caption-side public-adapter gap recorded after CAP-20. It does
not close the backend persistence, authenticated reread, or runtime-injection
gap.

## Frozen B-roll source

- repository: `yuzastudio6-cyber/Reedkt`;
- branch: `codex/reeditpro-b-roll-skill-end-to-end`;
- public-contract commit: `86b624a5a61cd45dfefaf4ae680be455859cc0e6`;
- qualification-evidence commit:
  `59acac49dd41b78d9f274635fa1b5cfdd9de5b25`;
- request: `b_roll_caption_owner_read_request_v1`, contract digest
  `41a8ff19a61ccba5ea99c6c0839939b237388285f7672b1ec2279cd28d835788`;
- result: `b_roll_caption_owner_read_result_v1`, contract digest
  `5821d74644e3e7284696bc5db4bac4597c49c64de48680cb166c041249443a32`;
- public receipt: `b_roll_caption_public_contract_receipt_v1`, digest
  `255f13e74429107954ea4d1b75d42fbe4002d2f5e7d3b40ab0f5e14ce4287038`;
- owner manifest digest:
  `40219ecc4319bc5639de87f16695ba9f87119ec7efce60acbd95fc60b1d4dec0`.

## Exact behavior

The outbound builder creates the exact B-roll-owned V1 request with:

- Caption as requester and B-roll as owner;
- HQ-mediated owner read;
- exact owner user, workspace, project, edit session, plan version, approved
  snapshot, output, confirmed output-frame, scene, authorized frame range,
  FPS, and MasterTiming lineage;
- the existing Caption planning-constraint reference;
- all four requested opaque reference roles; and
- no media bytes, locator, raw chat, credentials, selection, crop/timing,
  runtime, asset, QA, billing, delivery, or production authority.

The inbound adapter accepts a result only when:

- the full request and result are closed plain serialized trees;
- both digests recompute exactly;
- the B-roll manifest and every source-role version match the frozen receipt;
- the owner request reference and complete canonical scope match exactly;
- the Caption-side approved snapshot, confirmed output frame, scene, frame
  range, FPS, MasterTiming, and planning constraint are reread and match; and
- the B-roll result carries the required authenticated-owner evidence and
  exact-reread flags with every authority field false.

The projected Caption binding contains only opaque references for selected
media, layout occupancy, crop/timing, and visible-text evidence. Caption does
not reconstruct or reinterpret any B-roll-owned source contract.

## Integration routing

The additive post-CAP-20 manifest now identifies
`b_roll_caption_owner_read_request_v1` as the exact typed request required for
the B-roll support lane. The support request carries the public receipt and
Caption adapter refs, not an invented partial request. The canonical mediator
must construct the full request only after all exact authority refs are
available, persist/reread the owner result, then inject the resulting
`caption_broll_owner_read_binding` through the existing resume protocol.

The earlier frozen `caption-shared-owner-integration-handoff-v1` is not
rewritten. This adapter is an additive completion delta after that handoff.

## Verification

The focused smoke passes 26 checks covering the positive
request/result/projection path and
rejects stale digests, cross-workspace results, crossed request refs, wrong
source-role versions, unsafe URLs/paths, authority overclaims, FPS/frame/
snapshot/MasterTiming/planning-constraint drift, inherited fields, and cycles.

No media, Docker, Python, Remotion, FFmpeg, provider, model, billing, public,
or production action is performed by this milestone.

## Remaining gate

`authenticatedOwnerResultIntegrated` remains `false`. Canonical backend work
must still persist and reread an actual owner result under the exact approved
scope before Caption can receive an `authenticated_owner_ready` binding in an
end-to-end internal workflow.
