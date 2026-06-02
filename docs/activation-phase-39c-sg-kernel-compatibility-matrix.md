# Phase 39C-SG-KERNEL Compatibility Matrix

The bounded matrix is:

- K0 `current-pr104-baseline`: reproduce PR #104 image/package state.
- K1 `latest-compatible-sglang-stable`: reinstall current stable SGLang package set.
- K2 `issue-compatible-pinned-pair`: test `sglang[all]==0.4.9.post3` plus `sgl-kernel==0.2.6.post1`.
- K3 `no-sgl-kernel-or-disable-kernel-path`: blocked unless official SGLang supports it.
- K4 `source-build-sgl-kernel`: blocked unless separately human-approved.
- K5 `official-sglang-runtime-image-overlay`: blocked until an exact official image tag is verified.

Only K0-K2 are buildable in this bounded prompt. K3-K5 are recorded as explicit next paths, not guessed.
