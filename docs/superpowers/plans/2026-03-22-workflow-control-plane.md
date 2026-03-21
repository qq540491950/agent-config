# Workflow Control Plane Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a readable workflow control plane, expose delegate and verification status in `/ucc-flow-status`, and extend controlled node-level parallelism to team planning nodes.

**Architecture:** Preserve `runs/*.json` and `events/*.ndjson` as the factual runtime layer, then derive human-readable control snapshots under `workflows/control/`. Extend the runtime with explicit delegate and verification update APIs, teach status rendering to read the new snapshot, and update team workflow metadata and orchestrator guidance to use the richer model.

**Tech Stack:** Node.js CommonJS scripts, markdown command/agent docs, JSON workflow definitions, repository regression tests.

---

### Task 1: Add Control-Plane Snapshot Support To Runtime

**Files:**
- Modify: `scripts/lib/workflow-runtime.js`
- Test: `tests/workflow-runtime.test.js`

- [ ] **Step 1: Write failing tests for control snapshot creation**

Add assertions that starting and advancing a run creates `.claude/workflows/control/<runId>.json` and `.claude/workflows/control/latest.json` with current node, next node, and latest phase summary fields.

- [ ] **Step 2: Run the workflow runtime test to verify it fails**

Run: `node tests/workflow-runtime.test.js`
Expected: FAIL because control-plane files or fields do not exist yet.

- [ ] **Step 3: Implement minimal control-plane persistence**

Update the runtime to:
- create the `control/` directory
- write per-run and latest control snapshots after start, advance, continue, and abort
- keep the snapshot derived from the canonical run state

- [ ] **Step 4: Re-run the workflow runtime test**

Run: `node tests/workflow-runtime.test.js`
Expected: PASS

### Task 2: Add Delegate And Verification Status APIs

**Files:**
- Modify: `scripts/lib/workflow-runtime.js`
- Modify: `scripts/workflow/runner.js`
- Test: `tests/workflow-runtime.test.js`

- [ ] **Step 1: Write failing tests for delegate and verification updates**

Add tests that call new runtime APIs or CLI paths to record:
- delegate registration and status transitions
- verification item status transitions

Assert that the control-plane snapshot reflects those updates.

- [ ] **Step 2: Run the workflow runtime test to verify it fails**

Run: `node tests/workflow-runtime.test.js`
Expected: FAIL because delegate and verification update APIs do not exist yet.

- [ ] **Step 3: Implement minimal update APIs and runner commands**

Add runtime methods and CLI support for:
- updating delegate status
- updating verification status
- preserving summaries, timestamps, and signals

- [ ] **Step 4: Re-run the workflow runtime test**

Run: `node tests/workflow-runtime.test.js`
Expected: PASS

### Task 3: Expand Status Rendering And Team Parallel Metadata

**Files:**
- Modify: `scripts/lib/workflow-runtime.js`
- Modify: `commands/ucc-flow-status.md`
- Modify: `agents/team-orchestrator.md`
- Modify: `agents/workflow-orchestrator.md`
- Modify: `workflows/definitions.json`
- Modify: `tests/workflow-command-metadata.test.js`
- Test: `tests/workflow-runtime.test.js`
- Test: `tests/workflow-command-metadata.test.js`

- [ ] **Step 1: Write failing tests for richer status output and plan-node parallel metadata**

Add assertions that:
- formatted workflow status includes delegate and verification sections when present
- `team.standard.plan` and `team.strict.detailed-plan` declare controlled parallel delegation metadata

- [ ] **Step 2: Run the targeted tests to verify they fail**

Run: `node tests/workflow-runtime.test.js`
Run: `node tests/workflow-command-metadata.test.js`
Expected: FAIL because the richer status output and planning parallel metadata are not implemented yet.

- [ ] **Step 3: Implement the minimal metadata and rendering changes**

Update:
- status formatting to show delegate and verification details
- planning nodes to declare `parallel-delegate`
- orchestrator docs to describe planning fan-out/fan-in and control-plane updates

- [ ] **Step 4: Re-run the targeted tests**

Run: `node tests/workflow-runtime.test.js`
Run: `node tests/workflow-command-metadata.test.js`
Expected: PASS

### Task 4: Sync Documentation And Full Regression Coverage

**Files:**
- Modify: `README.md`
- Modify: `CLAUDE.md`
- Modify: `docs/使用说明.md`
- Modify: `docs/配置定制指南.md`
- Modify: `workflows/README.md`
- Modify: `scripts/validate-config.js` (only if new tests/files must be required explicitly)
- Modify: `tests/run-all.js` (only if a new test file is added)

- [ ] **Step 1: Document the new control plane and expanded status surface**

Describe:
- the new `workflows/control/` snapshot files
- the richer `/ucc-flow-status` behavior
- the extended planning parallelization boundary

- [ ] **Step 2: Run repository validation**

Run: `node scripts/validate-config.js`
Expected: PASS

- [ ] **Step 3: Run full regression tests**

Run: `node tests/run-all.js`
Expected: PASS

- [ ] **Step 4: Review changed files before handoff**

Run: `git status --short`
Expected: only intended plan, runtime, workflow, doc, and test changes appear.
