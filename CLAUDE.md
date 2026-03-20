# Agent Skills

Multi-skill repository of [Agent Skills](https://agentskills.io) for Claude Code.
Skills live in `skills/`. Each is fully independent — no shared code, no workspaces.

## Structure

```
skills/
  sixt-rental/          Code skill — Sixt car rental search (TypeScript + Bun)
  readme-design/        Documentation skill — README design guidance
  terminal-recording/   Documentation skill — terminal recording automation
  skill-dev/            Documentation skill — skill structure & design conventions
```

## Skill conventions

For skill structure, script design, dependencies, testing patterns, and
adding new skills, see `skills/skill-dev/SKILL.md`.

## Development

### sixt-rental

All commands from `skills/sixt-rental/`:

    bun install               # install dev dependencies
    bun test                  # run tests (65 tests across 6 files)
    bun run typecheck         # tsc --noEmit
    bun run search -- --help  # run search script via npm script
    ./build.sh                # compile standalone binaries

Run via shell wrapper (from skill root):

    scripts/sixt-search --help

### Repo-level

    bun test          # runs tests in all skills that have them

## Workflow

### Branching

Always work on a branch — never commit directly to main. Branch names
should be descriptive:

    feat/add-station-autocomplete
    fix/currency-format-pt
    docs/update-pricing-reference

One branch per task.

### Commits

Use [conventional commits](https://www.conventionalcommits.org/):

    feat: add station autocomplete to sixt-search
    fix: correct currency format for PT country code
    docs: update campaign code table in SKILL.md
    refactor: extract date validation into shared module
    test: add filter edge cases for null range values

Commit frequently.

### Task tracking

For non-trivial work, create a task directory before starting:

    tasks/YYYY-MM-DD_hhmm_descriptive-kebab-case/TASK.md

Get the timestamp from the OS (`date +%Y-%m-%d_%H%M`) — don't guess.

A task is a concrete, completable unit of work — not an epic or a backlog.
Commit the task and plan first, before implementation code.

When coding work is done, mark TASK.md status as **Resolved**. The task
directory stays in `tasks/`. `tasks/archive/` is for periodic manual
cleanup, not part of the PR workflow.

Since we will usually clear context before implementation when using plan mode,
the plan MUST include any context needed in the TASK.md — especially user
inputs and feedback, and explicit design choices.

### TASK.md structure

Every TASK.md should have these sections:

```markdown
# <Title>

## Status: <Pending | In Progress | Resolved>

## Scope

What this task covers and — just as importantly — what it does not.

## Context

Why we're doing this. The problem, constraint, or goal that triggered it.
Relevant background: domain knowledge, prior decisions, architectural
constraints that shaped the approach. This is the "why" behind the "what".

## Plan

The chosen approach and why it was chosen. Alternatives considered and
why they were rejected. Pushback or refinements from discussion — record
what changed and why. Trade-offs acknowledged.

The plan should read as a record of the design process, not just its
output. A future reader should understand not only what we decided to do,
but what we decided not to do and why.

## Steps

- [ ] Concrete work items as checkboxes
- [ ] Updated as work progresses

## Notes

Running log of observations and decisions made during implementation.
Only things where the reasoning isn't obvious from the code itself.
Design-level reasoning belongs in Context and Plan, not here.

## Outcome

Written when marking as Resolved. What was delivered (may differ from
original plan), what was deferred, known limitations or follow-up work.
```

**Why this matters**: Task documents are the project's decision log. When
someone later asks "why did we do X?" or "why didn't we do Y?", the
answer should be findable by scanning task Context, Plan, and Notes —
not locked in someone's head or lost in a chat transcript.
