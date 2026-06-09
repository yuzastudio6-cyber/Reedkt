# Creative Graphics GD-7 QA Evidence Requirements

Status: `approved_for_gd7_controlled_local_fixture_execution`

GD-7 must collect evidence for any controlled local fixture it runs. Evidence remains local/private and must not include secrets, signed URLs, real user media, provider outputs, Supabase rows, or public artifacts.

Required evidence:

- artifact file evidence;
- artifact manifest evidence;
- checksum evidence;
- dimensions and aspect ratio evidence;
- alpha/transparency evidence when applicable;
- timing evidence for temporal artifacts when a future approved temporal group runs;
- data correctness for charts;
- diagram correctness for graph/diagram fixtures;
- Track A handoff readiness;
- blocked-use compliance;
- cleanup evidence;
- failure evidence for skipped tools or failed fixture attempts.

For Group A, the minimum evidence set is local artifact file or explicit skipped-tool failure, local artifact manifest, checksum where safe, dimensions/aspect ratio, tool-specific correctness, blocked-use compliance, cleanup, and Track A handoff readiness.

Supabase update required: `docs/status only`
Supabase update status: `docs_only`
Supabase environment touched: `none`
SQL executed: `none`
Migration deployed: `no`
