# Sound/Music/Audio Open-Source Tool Synthetic Fixture Schema

This schema is metadata-only. It defines the allowed shape for future synthetic fixture validation planning and explicitly blocks real user data, media files, generated artifacts, runtime execution, Supabase mutation, signed URLs, and public artifacts.

```json sound-oss-tools-5-synthetic-fixture-schema
{
  "phase": "SOUND-OSS-TOOLS-5",
  "decision": "sound_oss_tools_5_synthetic_fixture_validation_plan_ready_with_warnings",
  "schemaName": "sound_oss_synthetic_fixture_plan_v1",
  "schemaMode": "metadata_only",
  "requiredFields": [
    "fixtureId",
    "fixtureType",
    "ownerWorkstream",
    "packageName",
    "moduleName",
    "capability",
    "inputMode",
    "inputSource",
    "realUserDataAllowed",
    "mediaFileAllowed",
    "generatedFileAllowed",
    "expectedOperation",
    "runtimeExecutionAllowed",
    "supabaseMutationAllowed",
    "artifactCreationAllowed",
    "signedUrlAllowed",
    "blockerReason",
    "ownerApprovalNeeded",
    "nextGate"
  ],
  "allowedEnums": {
    "fixtureType": [
      "metadata_only",
      "synthetic_array_plan",
      "synthetic_midi_plan",
      "synthetic_loudness_plan",
      "symbolic_music_plan",
      "blocked_exclusion_plan"
    ],
    "inputMode": [
      "metadata_only",
      "synthetic_array_plan",
      "synthetic_midi_plan",
      "synthetic_loudness_plan",
      "blocked"
    ],
    "inputSource": [
      "none",
      "generated_in_memory_later",
      "docs_only",
      "blocked"
    ],
    "expectedOperation": [
      "metadata_validation_only",
      "future_in_memory_no_file_validation",
      "blocked"
    ]
  },
  "requiredFalseFlags": {
    "realUserDataAllowed": false,
    "mediaFileAllowed": false,
    "generatedFileAllowed": false,
    "runtimeExecutionAllowed": false,
    "supabaseMutationAllowed": false,
    "artifactCreationAllowed": false,
    "signedUrlAllowed": false
  },
  "forbiddenValues": {
    "realMediaPath": "forbidden",
    "privateProjectPayload": "forbidden",
    "customerAudioVideo": "forbidden",
    "signedUrl": "forbidden",
    "publicArtifactUrl": "forbidden",
    "serviceRoleCredential": "forbidden",
    "providerSecret": "forbidden"
  },
  "nextGate": "SOUND-OSS-TOOLS-6: synthetic fixture validation, no real user data"
}
```
