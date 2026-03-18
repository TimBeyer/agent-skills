---
name: terminal-recording
description: Create automated terminal recordings for README demos and documentation. Use when the user wants to record a CLI tool, TUI app, or terminal workflow as a GIF for a README or docs. Guides setup, helps storyboard, and generates recording scripts.
compatibility: Requires macOS or Linux with tmux, asciinema, and agg installed.
---

This skill creates clean, reproducible terminal recordings for project documentation. It guides the user through setup and produces either a manual recording workflow or an automated script depending on the project's needs.

## When to use this

- User wants a GIF/demo for their README
- User wants to record a CLI tool or TUI app in action
- User wants to automate demo recording so it's reproducible

## Recording stack

The recording pipeline uses three tools, each doing what it's best at:

| Tool | Role | Install |
|---|---|---|
| **tmux** | Reliable keystroke delivery + screen content detection | `brew install tmux` |
| **asciinema** | Clean terminal recording (captures escape sequences, not pixels) | `brew install asciinema` |
| **agg** | Renders asciicast → GIF (no flashing, crisp text) | `brew install agg` |

### Why this stack

**Do NOT use VHS for GIF/MP4 output of TUI apps.** VHS captures pixel screenshots of a browser-rendered terminal. TUI frameworks like Ink, Bubble Tea, and curses apps clear and redraw the screen on every render cycle. VHS captures blank frames during these redraws, producing visible flashing in the output that cannot be fixed with framerate adjustments or post-processing. This is an upstream VHS issue with no workaround.

**asciinema + agg avoids this entirely** because asciinema records the terminal escape sequence stream (not pixels), and agg renders frames from that stream — it controls the rendering, so there are no mid-redraw captures.

**tmux is the keystroke transport** for automated recordings. `tmux send-keys` delivers keystrokes reliably (including arrow keys, Escape, etc.) without the escape sequence splitting issues that plague `expect`. `tmux capture-pane -p` provides exact screen content for synchronization.

### Font support

agg renders text using bundled or system fonts. If the recording contains special characters (Unicode spinners, Braille patterns, Nerd Font glyphs, box-drawing characters) that render as `?` boxes, point agg at a font directory with coverage:

```bash
# Install a font with good Unicode coverage
brew install --cask font-fira-code
# or: brew install --cask font-jetbrains-mono

# Pass the font directory to agg
agg --font-dir ~/Library/Fonts demo.cast demo.gif
```

## Setup

Before recording, ensure all three tools are installed. Offer to check:

```bash
# Check what's installed
which tmux asciinema agg

# Install anything missing
brew install tmux asciinema agg
```

### Alt screen buffer

TUI apps that use the alternate screen buffer (`\x1b[?1049h`) can cause issues with asciinema recordings. If the app supports disabling this (e.g., via an env var like `NO_ALT_SCREEN=1`), do so for recordings. If not, it usually still works — it's VHS that has the real problem with this, not asciinema.

## Two paths

Ask the user which approach they want:

### Path 1: Manual recording

Best for: one-off recordings, exploring what looks good, apps with unpredictable timing.

Guide the user through:

```bash
# Clean shell (no zsh plugins/prompt theme)
ZDOTDIR=$(mktemp -d) asciinema rec -c zsh demo.cast

# Or skip the shell entirely — just record the command
asciinema rec --cols 120 --rows 35 -c 'my-command' demo.cast
```

Then convert:

```bash
agg demo.cast demo.gif
# or with custom font:
agg --font-dir ~/Library/Fonts demo.cast demo.gif
```

### Path 2: Automated script (storyboard-driven)

Best for: reproducible recordings, CI/CD, re-recording when UI changes.

The user provides a storyboard — a sequence of interactions they want to show. This can be screenshots, a written description, or just "show the create wizard filling in a name and selecting a provider."

Generate a bash script using this pattern:

```bash
#!/usr/bin/env bash
set -euo pipefail

CAST="path/to/output.cast"
SESSION="demo-recording"
COLS=120
ROWS=35

# --- Helpers ---

wait_for() {
    local pattern="$1"
    local max=60
    local i=0
    while ! tmux capture-pane -t "$SESSION" -p | grep -qF "$pattern"; do
        sleep 0.5
        ((i++))
        if (( i >= max )); then
            echo "Timeout waiting for: $pattern" >&2
            tmux kill-session -t "$SESSION" 2>/dev/null
            exit 1
        fi
    done
}

type_slow() {
    local text="$1"
    for (( i=0; i<${#text}; i++ )); do
        tmux send-keys -t "$SESSION" -l "${text:$i:1}"
        sleep 0.05
    done
}

down()  { tmux send-keys -t "$SESSION" Down;   sleep 0.3; }
up()    { tmux send-keys -t "$SESSION" Up;     sleep 0.3; }
enter() { tmux send-keys -t "$SESSION" Enter;  sleep 0.3; }
esc()   { tmux send-keys -t "$SESSION" Escape; sleep 0.3; }
tab()   { tmux send-keys -t "$SESSION" Tab;    sleep 0.3; }

key() { tmux send-keys -t "$SESSION" "$1"; sleep 0.3; }

# --- Setup ---

tmux kill-session -t "$SESSION" 2>/dev/null || true
tmux new-session -d -s "$SESSION" -x "$COLS" -y "$ROWS"
sleep 0.5

# Start recording — adjust the -c command for your app
tmux send-keys -t "$SESSION" \
    "asciinema rec --cols $COLS --rows $ROWS --overwrite -c 'YOUR_COMMAND' $CAST" Enter

# --- Scenes ---

# wait_for "text"     — wait for text to appear on screen
# sleep N             — pause for N seconds (visual pacing)
# type_slow "text"    — type with natural speed
# down / up / enter / esc / tab  — send keys
# key "C-c"           — send Ctrl+C (or any tmux key name)
# tmux send-keys -t "$SESSION" -l "literal text"  — send text without interpretation

# ... your scenes here ...

# --- Done ---

# Kill session — asciinema writes .cast incrementally, file is complete.
# The app's cleanup handlers run normally after the recording ends.
tmux kill-session -t "$SESSION" 2>/dev/null || true

echo ""
echo "Recording saved to $CAST"
echo "Convert:  agg $CAST output.gif"
```

## Writing the script

When generating the recording script from a storyboard:

### Keystroke reference

| Action | Code |
|---|---|
| Type text naturally | `type_slow "text"` |
| Send literal text (instant) | `tmux send-keys -t "$SESSION" -l "text"` |
| Arrow keys | `down`, `up`, or `tmux send-keys -t "$SESSION" Left/Right` |
| Enter / Escape / Tab | `enter`, `esc`, `tab` |
| Ctrl+key | `key "C-c"`, `key "C-d"`, etc. |
| Any tmux key name | `key "F1"`, `key "BSpace"`, `key "Space"`, etc. |

### Synchronization

- **`wait_for "text"`** — Wait for specific text to appear on screen before proceeding. Use this at key transition points (app loaded, menu appeared, new screen rendered). This is what makes automated recordings reliable.
- **`sleep N`** — Visual pacing. Use after `wait_for` to let the viewer read the screen.
- Every `wait_for` should have a corresponding moment in the app where that text actually appears. Read the source code to identify the right patterns.

### Timing guidelines

- **0.3s** between navigation keystrokes (arrow keys) — enough for TUI to process
- **0.5s** after Enter/Escape that triggers a state change — let the new view render
- **1-3s** visual pauses for the viewer to read important screens
- **0.05s** per character in `type_slow` — looks natural without being tedious
- **3-8s** for final "hero" screens (the main thing you want to show)

### Exploring the app

Before writing the script, explore the app to understand:

1. **Navigation model** — How does focus move? Arrow keys? Tab? What does Enter do?
2. **Focus order** — Read the source to map the exact sequence of focusable elements
3. **Screen content** — What unique text appears at each step? These become `wait_for` patterns.
4. **State transitions** — What triggers screen changes? Enter, Escape, specific keys?

### Common patterns

**TUI wizard with sections/fields:**
```bash
wait_for "Some Section"
down; down; down      # navigate to target field
enter                 # start editing
type_slow "value"
enter                 # confirm
esc                   # collapse section
```

**CLI command sequence:**
```bash
type_slow "git status"
enter
wait_for "$"          # wait for prompt to return
sleep 1
type_slow "git add ."
enter
wait_for "$"
```

**Interactive prompt (yes/no):**
```bash
wait_for "Continue?"
type_slow "y"
enter
```

### Ending the recording

- **Kill the tmux session** to end — `tmux kill-session -t "$SESSION"`. asciinema writes incrementally so the `.cast` file is complete up to this point.
- **Don't send Ctrl+C** to the app if it has cleanup handlers that produce unwanted output. Killing the session avoids this.
- The app's cleanup still runs (tmux sends SIGHUP), but it's not captured in the recording.

## Converting to GIF

```bash
# Basic conversion
agg demo.cast demo.gif

# With custom font for Unicode/Nerd Font glyphs
agg --font-dir ~/Library/Fonts demo.cast demo.gif

# Control speed and size
agg --fps-cap 30 --idle-time-limit 3 --font-size 16 demo.cast demo.gif

# Set how long the last frame lingers
agg --last-frame-duration 5 demo.cast demo.gif
```

## Embedding in README

```markdown
![demo](docs/assets/demo.gif)
```

GitHub also supports MP4 if GIF file size is too large, but agg only outputs GIF. For MP4, use ffmpeg on the GIF:

```bash
ffmpeg -i demo.gif -movflags faststart -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" demo.mp4
```

## Anti-patterns

- **Do NOT use VHS for TUI app recordings** — the pixel-capture approach produces unavoidable flashing artifacts from screen clearing. VHS tape files are great for scripting but the rendering is broken for TUI apps.
- **Do NOT use `expect` for TUI keystroke automation** — escape sequences for arrow keys (`\033[B`) get split, with `\033` interpreted as Escape before `[B` arrives. tmux's `send-keys` handles this correctly.
- **Do NOT try to post-process flash frames out of VHS output** — the flash frames have the same background color as normal frames (just with content missing), making them nearly impossible to detect programmatically.
- **Do NOT record with your normal shell config** — zsh plugins, custom prompts, and powerline themes add visual noise. Use `ZDOTDIR=$(mktemp -d)` for a clean shell, or `asciinema rec -c 'command'` to skip the shell entirely.
