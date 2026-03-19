---
name: readme-design
description: Design engaging, visually distinctive README.md files that stand out from generic boilerplate. Use when the user asks to create, redesign, or improve a README or project documentation landing page. Produces polished GitHub-flavored markdown with intentional structure, diagrams, and visual craft.
---

This skill guides creation of distinctive, engaging README files that avoid generic boilerplate. The output is real, functional GitHub-flavored markdown that makes projects feel alive and professionally crafted.

The user provides a project to document — a library, tool, application, or service. They may include context about the audience, purpose, or specific sections needed. If working inside a project directory, explore it deeply before writing.

## Design Thinking

Before writing a single line, understand the project and commit to a clear direction:

1. **Explore the project**: Read key files, understand the architecture, run help commands, check existing docs. You cannot design a great README without understanding what you're documenting. Spend real time here — this is where generic READMEs fail. When searching for files, check `.gitignore` first and exclude ignored paths (especially `node_modules`, `dist`, `build`, vendor directories) — otherwise glob results get buried under dependency noise.

2. **Audience**: Who reads this? End users? Developers integrating the library? Contributors? An internal team? Open-source newcomers? The audience determines tone, depth, and what goes above the fold.

3. **Project character**: What's the personality? A sharp CLI tool feels different from a friendly library, which feels different from enterprise infrastructure. The README's voice should match the project's identity.

4. **Structural direction**: Choose a clear approach — these can be combined, but one should lead:
   - **Narrative**: Lead with the problem, tell the story, then reveal the solution. Good for projects solving non-obvious problems.
   - **Visual-first**: Architecture diagrams, flow charts, screenshots front and center. Good for complex systems where spatial understanding matters.
   - **Developer-direct**: Code example in the first 10 lines. Minimal preamble. Respects the reader's time. Good for libraries and utilities.
   - **Progressive disclosure**: Clean, scannable surface with rich detail in collapsible sections. Good for projects with diverse audiences.
   - **Showcase**: Demo-driven — GIFs, screenshots, before/after comparisons that sell the experience. Good for tools with visual output. For CLI/TUI tools, consider using the `terminal-recording` skill to create an automated demo GIF.

5. **Memorable hook**: What's the one thing that makes someone stop scrolling? A striking Mermaid diagram showing the architecture? A one-liner that captures the entire project? A code example so clean it speaks for itself? Identify this and put it near the top.

Generic READMEs are invisible. A great README has a point of view — it decides what matters most and leads with that. The structure itself communicates the project's values. A tool that prizes simplicity should have a simple README. A system with elegant architecture should show that architecture prominently.

## GitHub-Flavored Markdown Toolkit

Markdown has a richer design vocabulary than most people use. Push beyond headers-and-paragraphs:

### Diagrams & Visual Structure

- **Mermaid diagrams**: Can be useful for architecture overviews, data flows, state machines, sequence diagrams. But **use them sparingly and only when the visual genuinely helps the reader** — not as decoration. Mermaid gives you almost no control over layout, so complex diagrams often render as a messy jumble of boxes and arrows. Key questions before adding one:
  - **Is this a product README or an internal/architecture doc?** Product READMEs sell outcomes to users — architecture diagrams are for contributors and belong in docs, not the landing page. Unless the architecture *is* the selling point (e.g., a framework's plugin system), skip it.
  - **Is the diagram simple enough?** Mermaid works for 3-6 nodes with clear relationships. Beyond that, the auto-layout produces cluttered, hard-to-read results with no way to fix positioning. If you need precise layout, use a committed SVG/PNG instead.
  - **Does it replace text, or duplicate it?** A diagram that restates what the surrounding paragraphs already say wastes space. It should reveal structure that prose can't convey efficiently.
  ````
  ```mermaid
  graph LR
    A[Input] --> B[Process] --> C[Output]
  ```
  ````
- **Tables**: For comparisons, feature matrices, config references, command inventories. Well-designed tables are scannable in ways prose and lists aren't. Consider whether a table would serve the reader better than a list.
- **Badges**: Use sparingly and intentionally. 3-5 relevant badges (build status, version, license, downloads) add trust signals. Twenty badges is clutter, not credibility. Custom shields.io badges can reinforce project identity with project-specific colors and labels.
- **Horizontal rules** (`---`): Create visual breathing room between conceptually distinct sections. They signal "new topic" more strongly than a heading alone.

### Interactive & Structural Elements

- **Collapsible sections** (`<details>`/`<summary>`): The single most underused GFM feature. Perfect for keeping the main flow clean while offering depth. Use for: advanced configuration, full API references, troubleshooting, platform-specific instructions, verbose examples, changelogs.
  ```html
  <details>
  <summary><strong>Advanced configuration</strong></summary>

  Content here — blank line required before markdown content.

  </details>
  ```
- **Anchor-linked table of contents**: For longer READMEs, a well-structured TOC is navigation infrastructure, not decoration. Consider which sections are top-level vs nested — the TOC hierarchy itself communicates importance.
- **Linked section headers**: Cross-reference between sections to create a web of understanding rather than a linear scroll.

### Visual Polish

- **Centered content**: Use `<div align="center">` for logos, project banners, taglines, or badge groups. Centering signals "this is a hero element, not body text."
- **Dark/light mode images**: Use `<picture>` with `<source media="(prefers-color-scheme: dark)">` to serve different images for dark and light GitHub themes.
- **Syntax-highlighted code blocks**: Always specify the language. Show real, runnable examples — never pseudocode in a quickstart.
- **Blockquotes for callouts**: GitHub renders these as styled callouts with special syntax:
  ```
  > [!NOTE]
  > Useful information the reader should know.

  > [!TIP]
  > Helpful advice for doing things better.

  > [!WARNING]
  > Critical information about potential issues.
  ```
- **`<kbd>` tags**: For keyboard shortcuts or CLI key presses — `<kbd>Ctrl</kbd>+<kbd>C</kbd>` renders as visual key caps.

### Text Craft

- **Bold for scanning**: Most readers skim. Bold the key phrase in important paragraphs so skimming still conveys the message.
- **Inline code**: Use backticks generously for commands, file paths, function names, config keys, env vars. This is semantic markup, not decoration.
- **Lists over paragraphs**: When you have 3+ related points, a list is always more scannable than a paragraph. Ordered lists imply sequence; unordered imply equivalence. Choose intentionally.
- **Strategic emoji**: Use as visual markers in section headers or key list items to aid scanning. They're punctuation, not decoration. Match the project's tone — a playful CLI tool benefits from well-placed emoji; a cryptography library probably doesn't. Never scatter them randomly.

## Content Architecture

A great README answers these questions, roughly in this order. Adapt to the structural direction chosen:

1. **What is this?** — One or two crisp sentences. This is the hardest and most important line in the entire README — spend time getting it right before moving on.
2. **Why should I care?** — The problem it solves, not a feature list. Features describe "what"; motivation explains "why someone would choose this."
3. **Show me** — A code snippet, screenshot, diagram, or terminal recording. Proof it works, not a promise that it does. This should appear before the reader has to scroll much. For CLI tools and TUI apps, a GIF of the tool in action is far more compelling than describing what it does. If the `terminal-recording` skill is available, use it to guide the user through creating an automated, reproducible demo recording.
4. **How do I start?** — Fastest path from zero to working. Ideally 1-3 commands. This must be a single path — the simplest one. Alternative workflows (headless mode, config files, Docker, etc.) are not quickstart material; they belong further down or in their own doc. A quickstart with options is a quickstart that confuses. The reader should be able to copy-paste and go.
5. **How does it work?** — Architecture, key concepts, mental model. Only include this in a product README if it helps users understand what they're getting — not as an internal deep-dive. For contributor-facing architecture, link to a separate doc.
6. **What else can it do?** — Deeper features, configuration, advanced usage. Collapsible sections shine here — present the depth without overwhelming the surface.
7. **How do I participate?** — Contributing guidelines, community links, license. Keep this light in the README; link to CONTRIBUTING.md for depth.

Not every README needs all seven. A small utility might need 1-4. A platform needs all of them with depth. Match documentation weight to project weight.

## Anti-Patterns

- **Boilerplate soup**: Generic "About" / "Getting Started" / "Usage" / "Contributing" headers with placeholder-quality content underneath. If you could swap the project name and the README still makes sense, it's boilerplate.
- **Feature lists without context**: Feature summaries are fine — readers comparison-shop with them. But bare bullet points with no examples, links, or hierarchy are claims without evidence. A feature table with one-line explanations beats a raw list.
- **Wall of text**: Long prose without visual breaks, code examples, or structural variety. If a section feels dense, break it up — but use judgment, not a line count.
- **Badge avalanche**: Every badge should be intentional. Most readers assume CI runs and tests pass — a green build badge tells them nothing they didn't already expect. Badges should surface information that's genuinely useful or not obvious (version, license, downloads).
- **Premature API reference**: Full API docs in the README before the reader knows what the project does. For larger libraries, link to a dedicated API reference. For small utilities with a handful of functions, the API in the README may be exactly right.
- **Marketing speak**: "Blazingly fast", "elegant", "powerful", "simple yet flexible" — show, don't tell. A benchmark table beats "blazingly fast." A 3-line code example beats "simple."
- **Stale boilerplate**: Auto-generated sections that clearly weren't customized. Default framework READMEs left in place. Template TODO comments still present.
- **Missing quickstart**: Making users read extensively before they can try the project. The fastest path to "it works" should be near the top.
- **Identical structure every time**: Cookie-cutter READMEs that follow the exact same template regardless of project. The structure should emerge from the project's nature, not from a rigid template.

## Execution

1. **Read first, write second.** Explore the project thoroughly — source code, existing docs, CLI help, tests, config files. A README written without understanding the codebase is always generic. Watch for **auto-generated sections** — benchmarks, changelogs, contributor lists, API docs, or anything with markers like "automatically updated", "last updated", or CI/CD comments. These are managed by scripts or release pipelines and must be preserved verbatim. Restructure around them, not through them.

2. **Nail the opener.** Write the short description first. If it's not crisp and specific, keep refining before moving on. This does more work than any other line in the file.

3. **Lead with what's interesting.** Put the project's most compelling aspect above the fold — don't bury it under installation instructions.

4. **Every section earns its place.** If removing a section wouldn't hurt the reader's understanding or ability to use the project, remove it. Shorter READMEs that cover the essentials well outperform longer ones that cover everything poorly.

5. **Code examples must be real.** Verify examples against the actual API, CLI, and file structure. Runnable examples build trust; broken examples destroy it.

6. **Match tone to project.** A playful CLI tool and an enterprise SDK should not read the same way. Let the project's character come through in word choice, structure, and which details get emphasis.

7. **Design the whitespace.** Just like in visual design, what you leave out matters as much as what you include. Strategic use of horizontal rules, line breaks between sections, and collapsible sections creates rhythm and breathing room.

Remember: The README is most people's first — and often only — impression of a project. A distinctive, well-crafted README signals that the project itself is well-crafted. Don't settle for generic.
