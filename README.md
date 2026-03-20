# Agent Skills

Reusable [Agent Skills](https://agentskills.io) for Claude Code, Copilot, Cursor, and other agents.

```bash
npx skills add TimBeyer/agent-skills
```

## Skills

<table>
<tr>
<td width="25%" valign="top">

**[sixt-rental](skills/sixt-rental/)**

Find and compare Sixt rental cars across stations and cities. Filter by electric, family, SUV. Fetch insurance costs, apply campaign discounts, generate booking URLs.

`TypeScript` `Bun` `4 scripts`

</td>
<td width="25%" valign="top">

**[readme-design](skills/readme-design/)**

Design distinctive README.md files through a design thinking process — audience, structure, hook — before writing. Covers the full GitHub-flavored markdown toolkit.

</td>
<td width="25%" valign="top">

**[terminal-recording](skills/terminal-recording/)**

Create automated terminal recordings for docs. Uses tmux + asciinema + agg for clean GIFs without flashing artifacts.

</td>
<td width="25%" valign="top">

**[skill-dev](skills/skill-dev/)**

Conventions for building Agent Skills with Bun — directory structure, SKILL.md authoring, script design, testing, repo layout.

</td>
</tr>
</table>

## Install

Install all skills at once, or pick one:

```bash
npx skills add TimBeyer/agent-skills                        # all skills
npx skills add TimBeyer/agent-skills --skill sixt-rental    # just one
```

Skills follow the [Agent Skills](https://agentskills.io/specification) open format. Each is a self-contained directory with a `SKILL.md` that agents discover and load automatically. No configuration needed — install and use.

## License

MIT
