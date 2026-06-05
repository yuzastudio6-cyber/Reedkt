# Staging Supabase Future Command Templates

These templates are documentation-only placeholders for a later human-approved prompt. Prompt 25 does not run them.

Every command block includes this exact warning:

`DO NOT RUN UNTIL HUMAN APPROVAL RECORD EXISTS.`

Prompt 25A requires future Supabase command packets to use GCP Secret Manager reference placeholders, not raw Supabase values. The examples below remain blocked templates and do not fetch Secret Manager values.

Prompt 25A follow-up allows future command packets to find references through metadata-only Secret Manager discovery after human approval and accepted evidence. Payload access remains forbidden for command templates in this packet.

## Static Validation Packet

```sh
DO NOT RUN UNTIL HUMAN APPROVAL RECORD EXISTS.
echo "Verify approved branch <APPROVED_BRANCH> and approved commit <APPROVED_COMMIT> before any staging packet moves forward."
```

## Staging Identity Review Packet

```sh
DO NOT RUN UNTIL HUMAN APPROVAL RECORD EXISTS.
echo "Review redacted staging project placeholder <REDACTED_STAGING_PROJECT_REF> without printing keys or connection strings."
```

## Migration Candidate Review Packet

```sh
DO NOT RUN UNTIL HUMAN APPROVAL RECORD EXISTS.
echo "Review approved migration candidate from <APPROVED_BRANCH> at <APPROVED_COMMIT>; no migration is deployed by Prompt 25."
```

## RLS Test Candidate Review Packet

```sh
DO NOT RUN UNTIL HUMAN APPROVAL RECORD EXISTS.
echo "Review approved SQL file <APPROVED_SQL_FILE> for a future staging RLS packet; no SQL runs in Prompt 25."
```

## Future Staging Dry-Run Placeholder

```sh
DO NOT RUN UNTIL HUMAN APPROVAL RECORD EXISTS.
echo "Future approved dry-run target is <REDACTED_STAGING_PROJECT_REF> with DB placeholder <REDACTED_LOCAL_OR_STAGING_DB_URL>."
```

```sh
DO NOT RUN UNTIL HUMAN APPROVAL RECORD EXISTS.
echo "Future approved dry-run target must resolve through <GCP_SECRET_REF_SUPABASE_STAGING_PROJECT_REF> and <GCP_SECRET_REF_SUPABASE_STAGING_DB_URL> after approval and evidence review."
```

## Future Secret Reference Presence Review Packet

This packet is for future metadata-only reference presence review. It must not access secret versions or print payloads.

```sh
DO NOT RUN UNTIL HUMAN APPROVAL RECORD EXISTS.
echo "Future metadata-only review confirms the presence of <GCP_SECRET_REF_SUPABASE_STAGING_PROJECT_REF> and <GCP_SECRET_REF_SUPABASE_STAGING_DB_URL> without reading payload values."
```

## Cleanup Command Packet

Cleanup commands must be reviewed before execution and must remove only synthetic fixtures approved for the future staging packet.

```sh
DO NOT RUN UNTIL HUMAN APPROVAL RECORD EXISTS.
echo "Future cleanup packet for <APPROVED_SQL_FILE> must remove only approved synthetic fixtures from <REDACTED_STAGING_PROJECT_REF>."
```

## Rollback Command Packet

Rollback commands must be paired with owner signoff, expected effects, and evidence that production remains untouched.

```sh
DO NOT RUN UNTIL HUMAN APPROVAL RECORD EXISTS.
echo "Future rollback packet for <APPROVED_COMMIT> must be reviewed before use and must not target production."
```

## Forbidden In Prompt 25

Prompt 25 does not run, approve, or provide real values for:

- Supabase project links;
- database pushes;
- database resets;
- SQL clients;
- deployment commands;
- migration commands;
- production commands;
- staging mutation commands;
- service-role keys;
- database passwords;
- provider keys;
- Stripe keys;
- signed URLs;
- raw connection strings.
