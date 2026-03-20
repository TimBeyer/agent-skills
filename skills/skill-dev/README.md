# skill-dev

Teach your agent how to build [Agent Skills](https://agentskills.io) properly — the directory structure, how to write a SKILL.md that triggers at the right time, how to design scripts agents can actually use, and how to handle dependencies so consumers never run an install step.

## Who this is for

You're building skills with TypeScript and Bun. Maybe you've written one before and it worked, but the description was too vague (triggered on the wrong prompts), the scripts mixed diagnostics into stdout (broke agent parsing), or the structure didn't survive `npx skills add` (files outside the skill directory got left behind).

This skill encodes the conventions that avoid those problems.

## What your agent learns

| Area | What it covers |
|---|---|
| **SKILL.md authoring** | Frontmatter schema, description writing (trigger keywords, negative scope), body structure, progressive disclosure, Claude Code extensions |
| **Script design** | JSON to stdout, diagnostics to stderr, `--help` convention, error messages that help agents self-correct, output size limits, idempotency |
| **Directory structure** | `scripts/` as public interface, `src/` for implementation, shell wrapper pattern, what goes at skill root vs inside `src/` |
| **Dependencies** | Lockfile pinning, Bun auto-install, why `node_modules` must be gitignored, inline version specifiers for simple scripts |
| **Testing** | Bun test patterns, mocking, factory functions, no live API calls |
| **Repo layout** | Why skills go in `skills/`, how the directory boundary keeps dev infrastructure out of installed artifacts |

## Install

```bash
npx skills add TimBeyer/agent-skills --skill skill-dev
```

No dependencies. Includes a [full project spec](references/bun-skills-spec.md) as a reference document for CI templates, compiled binaries, shared code patterns, and other details your agent can look up when needed.

## License

MIT
