# Agent Skills

Reusable [Agent Skills](https://agentskills.io/specification) for Claude Code.

## Skills

### `readme-design`

Design engaging, visually distinctive README.md files. Guides the agent through a design thinking process — explore the project, understand the audience, choose a structural direction — before writing. Covers the full GitHub-flavored markdown toolkit (collapsible sections, callouts, tables, badges, Mermaid) with opinionated guidance on when each tool helps vs hurts.

### `terminal-recording`

Create automated terminal recordings for README demos and documentation. Uses tmux + asciinema + agg for clean, reproducible GIF recordings with no flashing artifacts. Offers two paths: manual recording for exploration, or storyboard-driven scripted automation.

## Install

Clone and symlink into your Claude Code skills directory:

```bash
git clone git@github.com:TimBeyer/agent-skills.git ~/Development/agent-skills

# Symlink individual skills
ln -s ~/Development/agent-skills/readme-design ~/.claude/skills/readme-design
ln -s ~/Development/agent-skills/terminal-recording ~/.claude/skills/terminal-recording
```

Skills are discovered automatically by Claude Code on the next conversation.

## License

MIT
