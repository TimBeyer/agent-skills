# Agent Skills

Reusable [Agent Skills](https://agentskills.io/specification) for Claude Code.

## Skills

### `readme-design`

Design engaging, visually distinctive README.md files. Guides the agent through a design thinking process — explore the project, understand the audience, choose a structural direction — before writing. Covers the full GitHub-flavored markdown toolkit (collapsible sections, callouts, tables, badges, Mermaid) with opinionated guidance on when each tool helps vs hurts.

### `terminal-recording`

Create automated terminal recordings for README demos and documentation. Uses tmux + asciinema + agg for clean, reproducible GIF recordings with no flashing artifacts. Offers two paths: manual recording for exploration, or storyboard-driven scripted automation.

### `sixt-rental`

Search Sixt car rental availability and prices across stations via their gRPC-web API. Compare offers across cities, filter by electric/family vehicles, fetch protection pricing, generate booking URLs, and apply partner campaign codes for discounted rates. TypeScript + Bun scripts with JSON-first output.

### `skill-dev`

Conventions for building Agent Skills with Bun — directory structure, script design, dependencies, testing, and repo layout.

## Install

```bash
npx skills add TimBeyer/agent-skills
npx skills add TimBeyer/agent-skills --skill sixt-rental
```

## License

MIT
