# Version And Package Metadata Plan

Future package candidate: `gpac`

PR #729 observed two `main/binary-amd64` versions:

- `2.4-rev0-g5d70253ac-HEAD`
- `26.02-rev0-g118e60a90-HEAD`

Future execution must run `apt-cache policy gpac` after the approved source/keyring/pinning setup and record the exact candidate version before any install. The install form must be `gpac=<candidate-version>`.

The future execution phase must block if the candidate is not from component `main`, if `nightly` appears as the candidate source, if the package metadata is unexpected, or if dependency resolution requires an unapproved source.

This phase does not select a runtime version, install `gpac`, run MP4Box, or approve runtime/product use.
