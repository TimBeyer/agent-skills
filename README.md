# Agent Skills

Ready-to-use capabilities for your AI agent. One command to install, zero configuration — your agent discovers and uses them automatically.

```bash
npx skills add TimBeyer/agent-skills
```

Works with [Claude Code](https://claude.com/claude-code), GitHub Copilot, Cursor, and [any agent that supports the format](https://agentskills.io).

## Skills

<table>
<tr>
<td width="50%" valign="top">

**[sixt-rental](skills/sixt-rental/)**

Your agent searches every Sixt station in a city at once, compares prices side by side, and knows about partner discount codes most people never find. Filters by what matters — electric, family-size, SUV, price cap — and generates a booking link when you're ready.

`TypeScript` `Bun` `4 scripts`

</td>
<td width="50%" valign="top">

**[readme-design](skills/readme-design/)**

Guides your agent through a design thinking process before writing — explore the project, understand the audience, find the hook. Produces distinctive GitHub markdown instead of generic boilerplate.

`documentation`

</td>
</tr>
<tr>
<td width="50%" valign="top">

**[terminal-recording](skills/terminal-recording/)**

Your agent creates clean, reproducible terminal recordings for docs. Uses tmux + asciinema + agg for GIFs without the flashing artifacts you get from pixel-capture tools.

`documentation`

</td>
<td width="50%" valign="top">

**[skill-dev](skills/skill-dev/)**

Conventions for building Agent Skills with Bun — directory structure, SKILL.md authoring, script design, testing, and repo layout. For skill authors.

`documentation` `meta`

</td>
</tr>
</table>

## Install

Install all skills, or pick just the ones you need:

```bash
npx skills add TimBeyer/agent-skills                        # all
npx skills add TimBeyer/agent-skills --skill sixt-rental    # just one
```

Skills follow the [Agent Skills](https://agentskills.io/specification) open format. Each is a self-contained directory your agent discovers and loads automatically. No configuration needed.

## License

MIT
