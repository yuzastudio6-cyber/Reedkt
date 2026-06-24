# APT Pinning Plan

Future preferences file: `/etc/apt/preferences.d/gpac.pref`

Future pinning text only:

```text
Package: gpac
Pin: origin "dist.gpac.io"
Pin-Priority: 501
```

The pin is package-only for `gpac`; broad origin priority remains blocked. Component `main` is the only approved future component and `nightly` remains blocked. Dependencies must resolve from the base image or separately approved sources.

Future execution must inspect `apt-cache policy gpac` after source setup and before install. If the candidate is not from `https://dist.gpac.io/gpac/linux/debian` component `main`, or if pin behavior is ambiguous, the execution phase must block and request owner review.

This phase does not write `/etc/apt/preferences.d/gpac.pref`, run `apt update`, install `gpac`, or approve runtime/product use.
