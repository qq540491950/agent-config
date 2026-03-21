# Workflow Control Plane Design

## Background

This repository already has a working workflow runtime, persisted run state, event logs, and limited node-level parallel delegation for team review and verification. The current problem is not the absence of workflow support; it is that the operator surface is too coarse.

Today, users can see the active node and the next node, but they cannot reliably answer:

- What happened in the previous phase?
- Which delegate is currently running?
- Which delegate failed or was skipped?
- Which verification items passed or failed?
- Why is the workflow paused right now?

The repository also already supports limited parallel review and limited parallel verification. However, the orchestration model does not yet expose a readable control plane, and the parallel boundary is narrower than what the team needs for practical throughput.

## Goals

- Preserve the existing workflow runtime and file layout as the source of truth.
- Add a readable control plane snapshot for current workflow state.
- Make delegate execution visible at runtime.
- Make verification progress and outcomes visible at runtime.
- Extend controlled node-level parallelism to planning nodes.
- Keep the main session as the only final writer for production code changes.

## Non-Goals

- No external tmux orchestration.
- No git worktree swarm execution.
- No multi-writer implementation model.
- No web dashboard in this iteration.
- No parallel clarify stage.

## Upstream-Inspired Patterns

This design borrows the strongest relevant ideas from `everything-claude-code` without copying its broader command surface:

- Control-plane style status snapshots instead of only raw event logs.
- Explicit handoff-oriented orchestration summaries.
- Clear fan-out/fan-in rules for parallel work.

It intentionally does not import tmux/worktree worker orchestration because this repository targets a simpler, Windows-friendly model first.

## Design

### 1. Facts vs. Control Plane

Keep the existing runtime files as the factual layer:

- `.claude/workflows/runs/<runId>.json`
- `.claude/workflows/events/<runId>.ndjson`

Add a control-plane layer for operator visibility:

- `.claude/workflows/control/<runId>.json`
- `.claude/workflows/control/latest.json`

The factual layer records canonical workflow state and append-only event history. The control-plane layer is a derived, human-readable snapshot optimized for `/ucc-flow-status`, pause diagnosis, and recovery.

### 2. Control Plane Schema

Each control-plane snapshot should include:

- `run`
  - run identity and current workflow position
- `phase`
  - current phase timing, latest summary, latest signals, latest artifacts
- `delegates`
  - current node delegate list with per-delegate status, summary, and timestamps
- `verification`
  - current verification item list with status and summary
- `blocking`
  - most recent pause/block/failure reason and relevant signals
- `history`
  - recent node summaries for quick operator recovery

The snapshot should favor decision-making value over complete history duplication.

### 3. Runtime API Extensions

Extend the workflow runtime with explicit control-plane update APIs:

- write control-plane snapshots whenever the run changes
- update delegate status independently of node advancement
- update verification status independently of node advancement
- read the current control plane for status rendering

This preserves the current start/advance/continue/abort model while allowing richer visibility inside a node.

### 4. Status Command Behavior

`/ucc-flow-status` should prefer the control-plane snapshot when available and fall back to run data for compatibility.

The output should be expanded into four operator-focused sections:

- run basics
- recent phase summary
- delegate status
- verification status

The command should still include all existing required fields such as run ID, trigger chain, current node, next node, execution mode, pause policy, and continue command.

### 5. Parallel Boundary

The workflow remains serial at the root level.

Parallelism is extended only inside declared nodes:

- `team.standard.plan`
- `team.strict.detailed-plan`
- existing review nodes
- existing verify/full-verify nodes

Planning nodes should support controlled fan-out/fan-in for planning and architecture advice. Implementation remains single-writer, but later orchestration may record advisory delegates for testing, docs, and risk analysis without allowing multiple writers.

### 6. Fan-Out / Fan-In Rules

Every parallel node must follow the same runtime contract:

- register delegates before work starts
- mark delegates as running when dispatched
- update delegates as completed, blocked, failed, or skipped
- aggregate delegate results before advancing
- respect `joinPolicy` before leaving the node

This gives the repository one orchestration model instead of separate custom rules per node type.

### 7. Testing Strategy

Add regression tests for:

- control-plane snapshot creation on start, advance, continue, and abort
- delegate status updates
- verification status updates
- status output rendering with control-plane details
- metadata for newly parallelized planning nodes

Update full-suite wiring and repository validation if new tests are added.

## Rollout Notes

This iteration is intentionally a control-plane and orchestration visibility upgrade. It should materially improve transparency and throughput without raising the operational complexity to external worker orchestration.
