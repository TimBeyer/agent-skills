# readme-design

Stop getting generic READMEs from your AI agent.

This skill teaches your agent to *design* a README — not just fill in a template. Before writing anything, the agent explores your project, identifies the audience, chooses a structural direction, and finds the hook that makes people stop scrolling.

## What changes

**Without this skill**, your agent produces the same About / Getting Started / Usage / Contributing skeleton regardless of the project. Swap the project name and the README still reads the same.

**With this skill**, your agent:

- **Reads your code first** — explores source files, CLI help, tests, and existing docs before writing a line
- **Chooses a structure that fits** — narrative for projects solving non-obvious problems, code-first for libraries, visual-first for complex systems, progressive disclosure for diverse audiences
- **Uses the full markdown toolkit** — collapsible sections, Mermaid diagrams (only when they help), callout blocks, diff-formatted code, HTML column layouts, dark/light mode images
- **Knows what to cut** — every section earns its place or gets removed. Shorter READMEs that cover the essentials beat longer ones that cover everything poorly
- **Matches the project's voice** — a playful CLI tool and an enterprise SDK shouldn't read the same way

## Good for

| Situation | Why it helps |
|---|---|
| New project needs a README | Explores the codebase and produces a README with real, verified examples |
| Existing README feels generic | Redesigns around the project's actual strengths instead of a template |
| Open source launch | Nails the opener, leads with what's interesting, gets install-to-working in 3 lines |
| Internal tool documentation | Adjusts depth and tone for the actual audience |

## Install

```bash
npx skills add TimBeyer/agent-skills --skill readme-design
```

No dependencies. Works with any agent that supports the [Agent Skills](https://agentskills.io) format.

## License

MIT
