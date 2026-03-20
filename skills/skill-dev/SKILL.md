---
name: skill-dev
description: Conventions for building Agent Skills with Bun — skill structure, SKILL.md authoring, script design, dependencies, testing, and repo layout. Use when creating, modifying, or maintaining skills.
compatibility: General — no runtime requirements.
---

# Skill Development Conventions

How to build [Agent Skills](https://agentskills.io) with Bun as the runtime.

For the full project spec with CI templates, compiled binaries, shared code
patterns, and worked examples, see
[references/bun-skills-spec.md](references/bun-skills-spec.md).

## What is an Agent Skill?

An Agent Skill is a directory containing a `SKILL.md` file with YAML
frontmatter and markdown instructions. It can optionally include scripts,
reference documents, and assets. The format is portable across Claude Code,
GitHub Copilot, Cursor, OpenAI Codex, Gemini CLI, and other agent products.

Skills use **progressive disclosure** — three tiers of context loading:

1. **Metadata** (~100 tokens): `name` and `description` fields are loaded at
   startup for all installed skills. This is how the agent decides which
   skills are relevant.
2. **Instructions** (< 5000 tokens recommended): The full `SKILL.md` body is
   loaded when the agent decides to activate the skill.
3. **Resources** (on demand): Files in `scripts/`, `references/`, and
   `assets/` are loaded only when the instructions reference them.

This means the `description` field is the most important piece of your skill
— it's always in context and determines whether the skill activates. The
`SKILL.md` body should be concise (under 500 lines). Heavy reference material
goes in separate files.

The most common distribution mechanism is the
[`skills` CLI](https://github.com/vercel-labs/skills), though skills can
also be copied manually or vendored directly into a project:

```bash
npx skills add owner/repo                     # all skills in the repo
npx skills add owner/repo --skill my-skill    # one specific skill
```

The CLI copies skill directories in isolation. Each skill must be fully
self-contained — no dependencies on files outside its directory.

## SKILL.md

### Frontmatter

YAML between `---` markers at the top of the file.

| Field           | Required | Description |
|-----------------|----------|-------------|
| `name`          | Yes      | 1-64 chars. Lowercase letters, numbers, hyphens. Must match directory name. Becomes `/<name>` in Claude Code. |
| `description`   | Yes      | 1-1024 chars. What the skill does AND when to use it. Include trigger keywords. |
| `compatibility` | No       | 1-500 chars. Runtime/environment requirements. |
| `license`       | No       | License name or reference to bundled LICENSE file. |
| `metadata`      | No       | Arbitrary key-value pairs. Use `version` to mirror package.json version. |
| `allowed-tools` | No       | Space-delimited pre-approved tools (experimental, support varies). |

**Name rules**: no uppercase, no consecutive hyphens, can't start or end
with a hyphen. Must match the parent directory name.

**Writing good descriptions**: Be specific about triggers. Include keywords
users would naturally say. State what the skill is NOT for.

```yaml
# Good — specific triggers, clear scope
description: Search Sixt car rental availability and prices across stations. Use when the user asks about renting a car, car rental prices, or comparing rental stations. NOT for other rental companies.

# Bad — too vague, agent can't decide when to activate
description: Helps with car stuff.
```

### Body content

The markdown body after frontmatter is what the agent follows when the skill
activates. No format restrictions, but recommended sections:

- Step-by-step instructions
- Script invocations with flags and examples
- Common edge cases and gotchas
- Pointers to reference files (loaded on demand)

Reference scripts using relative paths from the skill root:

```markdown
Run the search:
    <skill-dir>/scripts/sixt-search --pickup "2026-04-01T10:00" --return "2026-04-03T18:00"
```

In Claude Code, `${CLAUDE_SKILL_DIR}` resolves to the skill's directory path.

Keep `SKILL.md` under 500 lines. Move detailed reference material to
`references/` and tell the agent when to load each file:

```markdown
For full API details, see [references/api.md](references/api.md).
```

### Claude Code extensions

Claude Code adds frontmatter fields beyond the base spec:

| Field                      | Description |
|----------------------------|-------------|
| `disable-model-invocation` | `true` prevents Claude from auto-loading. User must invoke via `/<name>`. |
| `user-invocable`           | `false` hides from `/` menu. Claude can still load it automatically. |
| `context`                  | `fork` runs in a subagent with isolated context. |
| `agent`                    | Subagent type when `context: fork` (`Explore`, `Plan`, `general-purpose`, or custom). |
| `model`                    | Model override when skill is active. |
| `effort`                   | Effort level override (`low`, `medium`, `high`, `max`). |
| `argument-hint`            | Autocomplete hint, e.g., `[issue-number]`. |
| `hooks`                    | Hooks scoped to this skill's lifecycle. |

String substitutions: `$ARGUMENTS` (all args), `$0`/`$1`/etc. (positional),
`${CLAUDE_SESSION_ID}`, `${CLAUDE_SKILL_DIR}`.

Dynamic context injection: `` !`command` `` runs a shell command before
sending the skill content to Claude.

For full Claude Code skills documentation, see
https://code.claude.com/docs/en/skills.

## Skill directory structure

Every skill has a `package.json` — even documentation-only skills. At minimum
it provides a name and version:

### Documentation-only skill

```
my-skill/
  SKILL.md
  package.json          {"name": "my-skill", "version": "1.0.0"}
```

### Code skill

```
my-skill/
  SKILL.md
  package.json          name, version, scripts, dependencies
  bun.lock              committed — pins dependency versions
  .gitignore            node_modules/ + compiled binaries
  tsconfig.json
  build.sh              optional — for compiled binaries
  scripts/
    my-command           shell wrapper (stable public interface)
  src/
    bin/my-command.ts    entry point
    lib/                 shared modules
    test/                unit tests
  references/            on-demand documentation
  assets/                static resources
```

### Why package.json for every skill

Agents and the `skills` CLI ignore `package.json`. It exists for:

- **Versioning**: semver for the skill, mirrored in SKILL.md `metadata.version`
- **Dependencies**: declared and resolved via `bun.lock`
- **Dev tooling**: `bun test`, `tsc --noEmit`, custom scripts

## scripts/

The skill's public interface. SKILL.md references paths here and nothing
else. Agents invoke these and nothing else.

**Simple skills** — scripts are `.ts` files with a shebang:

```
scripts/
  check.ts              #!/usr/bin/env bun
```

**Complex skills** — shell wrappers that delegate to `src/`:

```bash
#!/usr/bin/env bash
exec bun "$(dirname "$0")/../src/bin/my-command.ts" "$@"
```

The wrapper decouples the skill's contract from its internal layout.
Refactoring `src/` doesn't break SKILL.md. Don't modify wrappers unless
the entry point filename changes.

## src/

Optional. For skills where multiple scripts share library code.

- `src/bin/` — TypeScript entry points (one per script)
- `src/lib/` — shared modules
- `src/test/` — unit tests

Internal imports use relative paths: `../lib/foo` from `bin/`, `./foo`
within `lib/`.

## Dependencies

**Lockfile** (preferred): declare in `package.json`, run `bun install` to
generate `bun.lock`, commit the lockfile. Consumers get pinned versions via
Bun's auto-install — when no `node_modules` is present, Bun resolves from
the lockfile into its global cache. No install step needed.

**Inline specifiers** (simple scripts): pin in the import. No `package.json`
dependencies or lockfile needed.

```ts
import { z } from "zod@3.24.0";
```

**node_modules** is gitignored. Its absence triggers auto-install for
consumers. Run `bun install` locally for IDE support and testing.

## Script design for agents

Scripts are invoked by agents in non-interactive shells. Design them so the
agent can read stdout/stderr and decide what to do next.

### Hard requirements

- **Non-interactive**: no TTY prompts, password dialogs, or confirmation
  menus. Accept all input via flags, env vars, or stdin. A script that
  blocks on interactive input will hang indefinitely.
- **`--help` / `-h`**: print usage to stderr, exit 0. This is the primary
  way an agent learns the script's interface. Include: brief description,
  available flags with defaults, and usage examples. Keep it concise — it
  enters the agent's context window.

### Output conventions

- **JSON to stdout** by default — this is what you should always consume. Parse the JSON and format results yourself based on what the user asked.
- **`--table`** flag (or similar) exists for developers running scripts by hand. Do not use it — it discards fields you may need.
- **Diagnostics to stderr** — progress, warnings, debug info. Never mix
  data and diagnostics on the same stream.
- **Predictable output size**: many agent harnesses truncate output beyond
  10-30K chars. Default to summaries or reasonable limits. Support
  `--offset`/`--limit` for pagination, or `--output <file>` for large
  results.

### Error handling

- **Non-zero exit on failure** with descriptive error message to stderr
- **Say what went wrong, what was expected, and what to try**:
  `Error: --format must be one of: json, csv, table. Received: "xml"`
- **Distinct exit codes** for different failure types (not found, invalid
  arguments, auth failure) — document them in `--help`
- **Reject ambiguous input** with a clear error rather than guessing

### Robustness

- **Idempotent** where possible — agents may retry. "Create if not exists"
  is safer than "create and fail on duplicate."
- **`--dry-run`** for destructive operations — lets the agent preview what
  will happen
- **Safe defaults** — destructive operations should require explicit
  confirmation flags (`--confirm`, `--force`)
- **All flags use `--long-name`** form (no single-letter flags except `-h`)

## Testing

- **Framework**: `bun:test` (`describe`, `test`, `expect`, `spyOn`,
  `beforeEach`)
- **Location**: `src/test/<module>.test.ts`
- **No live API calls** in unit tests — mock external dependencies
- **Test pure logic**: validators, parsers, formatters, extractors
- **process.exit testing**: spy on `process.exit` and assert it was called
  with the right code
- **Factory pattern**: `makeOffer(overrides: Partial<MyType>)` for test data

Run from the skill root:

    bun test

## Repo layout

Always put skills in a `skills/` directory, even if you only have one.

```
my-repo/
  skills/
    my-skill/
      SKILL.md
      package.json
      scripts/
      src/
    another-skill/
      SKILL.md
      package.json
  package.json          repo-level convenience scripts (not a workspace)
  CLAUDE.md             project-specific workflow and conventions
  tasks/                task tracking
  README.md
  .gitignore
```

The separation matters: the `skills` CLI copies skill directories in
isolation. Everything outside `skills/` — CLAUDE.md, tasks, CI configs —
stays out of the installed artifact. There's no `.npmignore` in the skills
ecosystem, so the directory boundary is the only exclusion mechanism.

Each skill is fully independent. No cross-skill imports. If a script needs
code from another skill, publish it as an npm package.

### Local skill discovery during development

Skills live in `skills/`, but you may expect them at a different
well-known path (e.g., `.claude/skills/` for Claude Code). When
developing skills in this repo, if the skills directory is not already
symlinked to where you resolve skills from, create a relative symlink:

```bash
# Example for Claude Code:
ln -s ../skills .claude/skills
```

Use a **relative** path so it works for every contributor.

## Adding a new skill

### Documentation-only

```
skills/new-skill/
  SKILL.md
  package.json
```

`package.json`:

```json
{
  "name": "new-skill",
  "version": "1.0.0"
}
```

`SKILL.md` frontmatter:

```yaml
---
name: new-skill
description: What this skill does and when to use it. Be specific about triggers.
---
```

### Code skill

```
skills/new-skill/
  SKILL.md
  package.json
  bun.lock                    (generated by bun install)
  .gitignore                  (node_modules/ + compiled binaries)
  tsconfig.json
  scripts/
    my-command                (shell wrapper, chmod +x)
  src/
    bin/my-command.ts
    lib/
    test/
```

Shell wrapper:

```bash
#!/usr/bin/env bash
exec bun "$(dirname "$0")/../src/bin/my-command.ts" "$@"
```

tsconfig.json:

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "types": ["bun-types"],
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true
  },
  "include": ["src/lib/**/*.ts", "src/bin/**/*.ts", "src/test/**/*.ts"]
}
```

Make the wrapper executable: `chmod +x scripts/my-command`

Add the skill to the root `README.md`.

## Don'ts

- **No workspaces** — don't create a root workspace or monorepo tooling
- **No cross-skill imports** — skills are independent; shared code goes to npm
- **No `src/` paths in SKILL.md** — reference only `scripts/<name>`
- **No stdout pollution** — scripts emit JSON or table only; diagnostics to stderr
- **No modifying wrappers** unless the entry point filename changes
- **No global tool installs** — declare requirements in `compatibility` frontmatter
- **No committing node_modules** — its absence triggers Bun auto-install
