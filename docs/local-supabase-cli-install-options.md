# Local Supabase CLI Install Options

Prompt 20C does not install the Supabase CLI. This document records safe manual choices for repairing the current wrong-architecture CLI blocker.

## Current Blocker

Current host:

- host architecture: `arm64`
- current CLI path: `/usr/local/bin/supabase`
- current CLI architecture: `x86_64`
- current failure: error `-86`
- Prompt 20E Homebrew state: `/usr/local/bin/brew`, prefix `/usr/local`, no `/opt/homebrew` path detected

This path must be replaced or shadowed by an arm64-compatible CLI before local Supabase validation can proceed.

## Preferred Option: Homebrew arm64

Use an Apple Silicon Homebrew path outside the repo. The expected CLI path is usually:

```sh
/opt/homebrew/bin/supabase
```

Verify:

```sh
which supabase
file "$(which supabase)"
supabase --version
```

PATH should prefer the arm64 Homebrew path over `/usr/local/bin`.

Prompt 20E does not run Homebrew repair because the current Homebrew prefix is `/usr/local`, not `/opt/homebrew`. If Homebrew is repaired manually, verify the new path before Prompt 20B.

Prompt 20F verifies the same Homebrew/Supabase CLI blocker remains. `/usr/local/bin/supabase` is still x86_64 on this arm64 host and fails with bad CPU / error `-86`. Prompt 20F does not repair Homebrew, install a CLI, download a binary, or run `npx`.

## Standalone arm64 Binary

A standalone arm64 CLI binary may be placed outside the repository.

Rules:

- do not commit the binary;
- do not place it under this repo;
- verify architecture with `file`;
- verify version with `supabase --version`;
- ensure PATH selects this binary before `/usr/local/bin/supabase`.

## npx Supabase

Official Supabase docs allow running the CLI through `npx supabase`, but the Node path must be Node.js 20 or later.

Rules:

- verify `node --version` first;
- verify Node architecture on Apple Silicon;
- use only local-only commands;
- do not use `npx` to run SQL or start Supabase in Prompt 20C.

## Dev Dependency Option

Installing Supabase as a dev dependency is a future repo decision only.

Prompt 20C must not change `package.json` or `package-lock.json` for this.

## Unsupported Global npm Install

Do not use:

```sh
npm install -g supabase
```

Official Supabase CLI docs state global npm installation is not supported. Use Homebrew, standalone binary, or `npx` with Node.js 20 or later instead.

## Docker-Compatible CLI Route

A Docker-compatible CLI route may be considered in a later prompt only if it:

- does not mount secrets;
- does not link to staging/remote/production;
- does not execute SQL against remote databases;
- produces redacted evidence;
- is explicitly approved by the prompt.

## Architecture Checks

Use:

```sh
uname -m
which supabase
file "$(which supabase)"
supabase --version
```

Expected on this host:

- `uname -m`: `arm64`
- CLI architecture: arm64-compatible
- version command: exits `0`

## Do Not Commit

Do not commit:

- CLI binaries;
- downloaded archives;
- local Supabase volumes;
- generated local DB data;
- secrets;
- `.supabase` link state.
