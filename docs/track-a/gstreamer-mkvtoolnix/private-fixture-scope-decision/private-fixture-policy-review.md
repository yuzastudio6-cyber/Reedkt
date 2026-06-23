# Private Fixture Policy Review

Review status: `ready_for_private_fixture_approval`

Future private fixture status: `eligible_for_approval_planning_only`

Preferred future source type: `generated_synthetic_but_private_fixture`

## Allowed Future Source Type

A future approval packet may define a generated synthetic-but-private fixture if it includes exact source, privacy classification, checksum, temp-only storage, sanitized logging, and cleanup rules.

## Blocked Without Separate Approval

- User media: `blocked`
- Real media: `blocked`
- Preapproved private artifact: `blocked_pending_exact_artifact_privacy_review`
- GCS artifact: `blocked`
- Public artifact: `blocked`
- Signed URL artifact: `blocked`

## Future Approval Requirements

- Fixture source definition
- Privacy classification
- Checksum manifest
- Temp-only storage
- Sanitized logs
- Cleanup verification
- No public delivery
- No render/export
- No product runtime

This review does not authorize private fixture execution.
