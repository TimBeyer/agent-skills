# Agent Skills

Ready-to-use capabilities for your AI agent. One command to install, zero configuration — your agent discovers and uses them automatically.

```bash
npx skills add TimBeyer/agent-skills
```

Works with [Claude Code](https://claude.com/claude-code), GitHub Copilot, Cursor, and [any agent that supports the format](https://agentskills.io).

---

### [sixt-rental](skills/sixt-rental/)

Your agent searches every Sixt station in a city at once, compares prices side by side, filters by what you care about (electric, 5+ seats, SUV, price cap), and knows about partner discount codes most people never find. It handles the insurance math and generates a booking link when you're ready.

### [readme-design](skills/readme-design/)

Guides your agent through a design thinking process before writing a README — explore the project, understand the audience, choose a structural direction, find the hook. Produces distinctive, well-crafted GitHub markdown instead of generic boilerplate.

### [terminal-recording](skills/terminal-recording/)

Your agent creates clean, reproducible terminal recordings for documentation. Uses tmux + asciinema + agg for GIFs without the flashing artifacts you get from pixel-capture tools. Manual or fully scripted.

---

Install all skills, or pick just the ones you need:

```bash
npx skills add TimBeyer/agent-skills                        # all
npx skills add TimBeyer/agent-skills --skill sixt-rental    # just one
```

<details>
<summary><strong>For skill authors</strong></summary>

This repo also includes **[skill-dev](skills/skill-dev/)** — conventions for building Agent Skills with Bun. Covers directory structure, SKILL.md authoring, script design, testing, and repo layout. See [CLAUDE.md](CLAUDE.md) for development workflow.

</details>

## License

MIT
