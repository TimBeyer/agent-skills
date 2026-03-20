# Agent Skills with Bun

## Background

### Agent Skills

[Agent Skills](https://agentskills.io) is an open format for giving AI agents reusable capabilities. A skill is a directory containing a `SKILL.md` file with YAML frontmatter and markdown instructions, optionally bundled with scripts, reference documents, and assets. The format is portable across agent products including Claude Code, GitHub Copilot, Cursor, OpenAI Codex, Gemini CLI, and many others.

Skills use progressive disclosure: at startup, agents load only each skill's name and description (~100 tokens). When a task matches, the agent reads the full instructions. Scripts and reference files are loaded only when needed. This keeps context windows small while making a large library of capabilities discoverable.

The [Agent Skills specification](https://agentskills.io/specification) defines the directory structure, SKILL.md format, and conventions for scripts, references, and assets. The [agentskills.io](https://agentskills.io/skill-creation/quickstart) site covers skill creation, best practices, and evaluation.

### The skills CLI

The [`skills` CLI](https://github.com/vercel-labs/skills) (`npx skills add owner/repo`) is the package manager for the Agent Skills ecosystem. It clones a repo, discovers `SKILL.md` files in standard locations (primarily `skills/` at the repo root), and copies them into the agent's skill directory (`.agents/skills/`, `.claude/skills/`, `.cursor/skills/`, etc.). It supports GitHub repos, GitLab, local paths, and direct URLs.

Key limitation: the CLI copies individual skill directories in isolation. There is no dependency resolution between skills, no version constraints, and no install lockfile. Each skill must be fully self-contained.

### Skills in Claude Code

[Claude Code](https://docs.claude.com/en/docs/claude-code/skills) extends the Agent Skills standard with additional features: invocation control via frontmatter, subagent execution, slash-command integration, and dynamic context injection. Skills can be scoped to personal (`~/.claude/skills/`), project (`.claude/skills/`), or enterprise levels.

Skills are also available via the [Claude API](https://docs.claude.com/en/docs/build-with-claude/skills-guide) and the [Claude Agent SDK](https://docs.claude.com/en/docs/agent-sdk/skills), where they execute in a code execution container with filesystem access and bash commands.

### Bun

[Anthropic acquired Bun](https://www.anthropic.com/news/anthropic-acquires-bun-as-claude-code-reaches-usd1b-milestone) in December 2025. Bun is now the runtime powering Claude Code and future AI coding products. It runs TypeScript natively, includes a bundler, test runner, and package manager, and — critically — [auto-installs](https://bun.com/docs/runtime/auto-install) npm dependencies on first execution when no `node_modules` is present, using `bun.lock` for exact version pinning.

This combination — Agent Skills as the portable format, Bun as the runtime, and the `skills` CLI as the distribution mechanism — is the foundation this spec builds on.

## What this spec adds

The Agent Skills specification defines the output format. This document defines a convention for **skills that contain real code**: TypeScript projects with dependencies, shared libraries, tests, and a proper development workflow. It answers:

- How to structure a skill with compiled scripts and shared code
- How to handle dependencies so consumers don't need an install step
- How to version skills and manage a multi-skill repository
- How to test and validate skills in CI

The guiding principle: **no build step for the common case**. Bun handles TypeScript execution and dependency resolution at runtime. The skill directory is both the source and the distribution.

## Skill structure

A skill is a self-contained directory. Everything the agent and consumer need is inside it. Nothing outside the directory is required at runtime.

```
sixt-rental/
├── package.json
├── bun.lock
├── .gitignore
├── SKILL.md
├── scripts/
│   ├── sixt-search
│   ├── sixt-booking-url
│   └── sixt-stations
├── src/                    ← optional: implementation behind the scripts
│   ├── bin/
│   ├── lib/
│   └── test/
├── references/
│   ├── api.md
│   └── pricing.md
└── assets/
```

### package.json

Every skill has a `package.json`, even if it's pure markdown with no scripts or dependencies. At minimum it provides a name and version:

```json
{
  "name": "git-conventions",
  "version": "1.0.0"
}
```

For skills with code, it expands to include scripts and dependencies:

```json
{
  "name": "sixt-rental",
  "version": "2.1.0",
  "scripts": {
    "test": "bun test",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "protobufjs": "^7.4.0"
  },
  "devDependencies": {
    "@types/bun": "latest"
  }
}
```

Agents and the `skills` CLI ignore this file. It's there for versioning, dependency management, and dev tooling.

### bun.lock

Committed to the repo. Pins exact dependency versions. When a consumer installs the skill, there is no `node_modules` present, so Bun's auto-install kicks in and resolves dependencies from this lockfile into its global cache. No install step required.

### .gitignore

At minimum:

```
node_modules/
```

The absence of `node_modules` is what triggers Bun's auto-install for consumers. During development you run `bun install` locally to get `node_modules` for IDE support and testing, but it never ships.

### scripts/

The `scripts/` directory is the skill's public interface. SKILL.md references paths here and nothing else. The agent invokes these and nothing else.

**Simple skills** — scripts are `.ts` files directly:

```
scripts/
└── check.ts              ← #!/usr/bin/env bun
```

**Complex skills** — scripts are shell wrappers that delegate to the implementation in `src/`:

```
scripts/
├── sixt-search           ← shell wrappers
├── sixt-booking-url
└── sixt-stations
```

Each wrapper is minimal:

```bash
#!/usr/bin/env bash
exec bun "$(dirname "$0")/../src/bin/sixt-search.ts" "$@"
```

The wrapper pattern decouples the skill's contract from its internal layout. Refactoring `src/` doesn't break SKILL.md.

### src/

Optional. For skills where multiple scripts share library code, `src/` contains the TypeScript project: entry points in `src/bin/`, shared modules in `src/lib/`, tests in `src/test/`. Simple skills with self-contained scripts don't need it.

### references/ and assets/

Optional directories for additional documentation and static resources. Agents load these on demand per the Agent Skills spec's progressive disclosure model.

## Dependencies

Pin versions. Two approaches, both valid:

**Lockfile (preferred for projects with dependencies).** Declare dependencies in `package.json`, run `bun install` during development to generate `bun.lock`, commit the lockfile. Consumers get pinned versions via auto-install.

**Inline version specifiers (fine for simple, single-file scripts).** Pin directly in the import. No `package.json` dependencies or lockfile needed.

```ts
import { z } from "zod@3.24.0";
```

## SKILL.md

Written directly following the [Agent Skills specification](https://agentskills.io/specification). Always references `scripts/<n>`, never anything inside `src/`.

```markdown
---
name: sixt-rental
description: Search Sixt car rental availability and prices across stations. Use when the user asks about renting a car, car rental prices, or comparing rental stations.
compatibility: Requires Bun runtime (bun.sh).
metadata:
  version: "2.1.0"
---

# Sixt Rental Search

Search Sixt car rental availability via their unauthenticated gRPC-web API.
Scripts output JSON to stdout by default and support `--table` for
human-readable output.

## Search offers

    <skill-dir>/scripts/sixt-search \
      --pickup "2026-04-01T10:00" \
      --return "2026-04-03T18:00" \
      --city Berlin
```

### Version in SKILL.md

Mirror the `package.json` version in the `metadata.version` frontmatter field. This is the version the agent sees. Two places to maintain, but you change it rarely.

## Script conventions

Follow the [agentic design guidelines](https://agentskills.io/skill-creation/using-scripts#designing-scripts-for-agentic-use) from the Agent Skills spec:

- `--help` for usage information
- JSON to stdout, diagnostics to stderr
- `--table` (or similar) for human-readable output
- Non-interactive — no TTY prompts
- Non-zero exit on failure with descriptive error messages
- Idempotent where possible — agents may retry

## Repo layout

Always put skills in a `skills/` directory, even if you only have one.

```
my-repo/
├── skills/
│   └── sixt-rental/
│       ├── package.json
│       ├── bun.lock
│       ├── SKILL.md
│       ├── scripts/
│       ├── src/
│       └── references/
├── package.json            ← repo-level convenience scripts
├── CLAUDE.md               ← dev workflow, coding conventions
├── tasks/                  ← task tracking (if you use it)
├── .github/
│   └── workflows/
└── README.md
```

This separation matters because the `skills` CLI copies skill directories in isolation. Everything outside `skills/` — your CLAUDE.md, task logs, CI configs, dev documentation — stays out of the installed artifact. There's no `.npmignore` or equivalent in the skills ecosystem, so the directory boundary is the only way to keep development infrastructure out of the consumer's install.

It also means going from one skill to two is just adding a directory, not restructuring the repo.

```bash
npx skills add owner/my-repo --skill sixt-rental
```

### Multiple skills

Same structure, more directories:

```
my-skills/
├── skills/
│   ├── sixt-rental/                  ← code skill with shared src/
│   │   ├── package.json
│   │   ├── bun.lock
│   │   ├── .gitignore
│   │   ├── SKILL.md
│   │   ├── scripts/
│   │   │   ├── sixt-search           ← shell wrappers → src/bin/
│   │   │   ├── sixt-booking-url
│   │   │   └── sixt-stations
│   │   ├── src/
│   │   │   ├── bin/                   ← entry points
│   │   │   ├── lib/                   ← shared modules
│   │   │   └── test/
│   │   └── references/
│   │       ├── api.md
│   │       └── pricing.md
│   ├── terminal-recording/            ← simple code skill
│   │   ├── package.json
│   │   ├── SKILL.md
│   │   └── scripts/
│   │       └── record.ts              ← self-contained .ts script
│   ├── readme-writer/                 ← non-code skill
│   │   ├── package.json
│   │   └── SKILL.md
│   └── git-conventions/               ← non-code skill
│       ├── package.json
│       └── SKILL.md
├── package.json                       ← repo-level convenience scripts
├── CLAUDE.md
├── .github/
│   └── workflows/
└── README.md
```

### Root package.json

The root `package.json` holds repo-level convenience scripts. It is not a workspace root and is not part of any skill.

```json
{
  "private": true,
  "scripts": {
    "test": "for d in skills/*/; do (cd \"$d\" && bun install && bun test); done",
    "validate": "bunx skills-ref validate skills/*/"
  }
}
```

These scripts are for local convenience. CI uses a [matrix strategy](#ci) so each skill tests in parallel.

Each skill is fully independent. `npx skills add owner/repo --skill sixt-rental` copies that one directory out of the tree and it must work in complete isolation.

### Skill-to-skill dependencies

There is no formal dependency mechanism between skills today. If your `readme-writer` skill works better when `terminal-recording` is also installed, document it in SKILL.md:

```markdown
## Optional companion skills

This skill can use `terminal-recording` for generating CLI demos.
Install it alongside: `npx skills add owner/repo --skill terminal-recording`
```

If a script actually needs code from another package, that package should be a regular npm dependency in `package.json` — published to npm or a private registry — not a sibling skill. The dependency resolution is real, the versioning is real, and it works regardless of whether the consumer installed one skill or ten.

## Shared code across skills

For the common case: don't share. Keep scripts self-contained. Inline shared functions.

If you genuinely have a lot of reusable code:

**Publish it as an npm package.** Each skill declares it as a dependency. Bun auto-installs it. Clean separation, real versioning, works when skills are installed individually. This is the recommended approach.

**Use a monorepo with a build step.** Put shared code in a `lib/` directory at the root, use workspaces internally, and add a CI step that bundles each skill's scripts into self-contained output. This requires a GitHub Action and more machinery. Only worth it for large collections with heavy code reuse.

## CI

### Multi-skill repos

Use a matrix strategy so each skill tests in parallel with isolated reporting:

```yaml
name: CI
on: [push, pull_request]

jobs:
  discover:
    runs-on: ubuntu-latest
    outputs:
      skills: ${{ steps.find.outputs.skills }}
    steps:
      - uses: actions/checkout@v4
      - id: find
        run: |
          skills=$(ls -d skills/*/SKILL.md 2>/dev/null | xargs -I{} dirname {} | xargs -I{} basename {} | jq -R -s -c 'split("\n") | map(select(. != ""))')
          echo "skills=$skills" >> "$GITHUB_OUTPUT"

  test:
    needs: discover
    if: ${{ needs.discover.outputs.skills != '[]' }}
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        skill: ${{ fromJson(needs.discover.outputs.skills) }}
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: cd skills/${{ matrix.skill }} && bun install && bun test

  validate:
    needs: discover
    if: ${{ needs.discover.outputs.skills != '[]' }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bunx skills-ref validate skills/*/
```

Each skill gets its own test run. Failures are reported per-skill. `fail-fast: false` ensures one broken skill doesn't block feedback on the others.

### Single-skill repos

```yaml
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: cd skills/* && bun install && bun test
      - run: bunx skills-ref validate skills/*/
```

No build artifacts, no committing generated files, no release branches.

## Compiled binaries

If you need standalone executables — for air-gapped environments, Docker images without Bun, or just preference — run `bun build --compile` per script. This is a per-skill decision, typically handled by a `build.sh`:

```bash
#!/bin/bash
for f in src/bin/*.ts; do
  name=$(basename "$f" .ts)
  bun build --compile "$f" --outfile "scripts/$name"
done
```

The shell wrappers in `scripts/` can detect and prefer compiled binaries, falling back to `bun run` when they don't exist. This keeps the skill functional in both modes.

## What this spec does not do

**Invent a package manager.** Skills are distributed via `npx skills add`, which copies directories. There's no dependency resolution between skills, no version constraints, no install lockfile. This spec works within that reality.

**Require CI.** The common case — self-contained skills with Bun scripts — needs no build step and no GitHub Action.

**Prescribe monorepo tooling.** No Turborepo, no Nx, no workspaces. Skills are independent directories that happen to share a git repo.

## Further reading

- [Agent Skills specification](https://agentskills.io/specification) — the format this spec builds on
- [Skill creation quickstart](https://agentskills.io/skill-creation/quickstart) — creating your first skill
- [Using scripts in skills](https://agentskills.io/skill-creation/using-scripts) — agentic script design guidelines
- [Skills in Claude Code](https://docs.claude.com/en/docs/claude-code/skills) — Claude Code's extensions to the format
- [Skills via the Claude API](https://docs.claude.com/en/docs/build-with-claude/skills-guide) — using skills through the API
- [Skill authoring best practices](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/best-practices) — writing effective skills
- [The `skills` CLI](https://github.com/vercel-labs/skills) — installing and managing skills
- [Bun auto-install](https://bun.com/docs/runtime/auto-install) — how dependency resolution works without `node_modules`
- [Anthropic's example skills](https://github.com/anthropics/skills) — reference implementations

## Summary

A skill is:

1. A `SKILL.md` with frontmatter and instructions.
2. A `scripts/` directory as the public interface.
3. A `package.json` for versioning and dependency declaration.
4. A `bun.lock` for pinned dependency resolution (when dependencies exist).
5. Optionally, `src/` for implementation, `references/` for docs, `assets/` for static files.

Put it in a repo. Push. `npx skills add owner/repo` works. Everything else is optional.
