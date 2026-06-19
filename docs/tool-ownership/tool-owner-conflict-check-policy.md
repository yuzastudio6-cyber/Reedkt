# Tool Owner Conflict Check Policy

Status: `required_before_tool_implementation`

## Policy

Before Atlas Track A installs, modifies, executes, or expands any claimed tool, it must:

1. read central tool owner registry
2. run duplicate ownership scan
3. check whether another owner has claimed the tool
4. record conflict or no-conflict result
5. update owner tool inventory
6. only then create tool-specific install/implementation packet

## Required Next Prompt

TOOL-OWNER-CONFLICT-SCAN-1 -- Cross-owner tool claim scan before Track A tool implementation

## Later Prompt

TRACKA-OPEN-SOURCE-TOOL-INVENTORY-1 -- Installed/planned/blocked status for Atlas Track A tools

## Blocked Until Conflict Scan

Tool installation, tool execution, media processing, browser capture, provider/model calls, worker execution, route execution, Supabase mutation, SQL execution, dependency mutation, package-lock mutation, final render/export, internal beta unlock, external beta unlock, and production unlock remain blocked.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, tool installation, or broad service-role handler was enabled.
