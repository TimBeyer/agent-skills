# terminal-recording

Your agent creates polished terminal recordings for your README — clean GIFs with no flashing, no blank frames, no artifacts.

```
You:   "Record a demo of our CLI wizard for the README"

Agent:  Storyboards the interaction, generates a recording script,
        runs it, and hands you a GIF ready to embed.
```

## Why this skill

Most terminal recording tools capture pixels — they screenshot a rendered terminal at fixed intervals. TUI apps (Ink, Bubble Tea, curses) clear and redraw the screen on every render cycle. Pixel capture catches blank frames mid-redraw, producing visible flashing that can't be fixed in post.

This skill uses a different approach: **asciinema** records the raw terminal stream (escape sequences, not pixels), and **agg** renders the GIF from that stream. No mid-redraw captures. No flashing. Crisp text at any size.

**tmux** handles the automation — reliable keystroke delivery for scripted recordings, with screen content detection for synchronization. Your agent can storyboard an interaction and produce a reproducible recording script.

## Two modes

| Mode | Best for |
|---|---|
| **Manual** | One-off recordings, exploring what looks good, apps with unpredictable timing |
| **Scripted** | Reproducible recordings, CI/CD, re-recording after UI changes |

In scripted mode, the agent writes a bash script that drives your app through tmux — typing commands at natural speed, waiting for the right screen to appear before proceeding, pausing on key moments for the viewer to read. The recording is reproducible: run it again after a UI change and get an updated GIF.

## What your agent handles

- Checks and installs the recording stack (tmux, asciinema, agg)
- Explores your app's navigation model and focus order
- Writes the storyboard script with proper timing and synchronization
- Deals with font issues (Unicode, Nerd Font glyphs, box-drawing characters)
- Converts to GIF with the right settings
- Handles the alternate screen buffer edge case that breaks other tools

## Install

```bash
npx skills add TimBeyer/agent-skills --skill terminal-recording
```

Requires macOS or Linux with tmux, asciinema, and agg (the agent will help install these).

## License

MIT
