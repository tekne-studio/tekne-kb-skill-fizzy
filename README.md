# tekne-kb-skill-fizzy

A Claude Code skill that keeps a project's [kb](https://github.com/tekne-studio/tekne-kb) roadmap and its [Fizzy](https://fizzy.do) board aligned, applying only the differences you approve.

The roadmap holds the facts and the order. The board is a selection of it for meetings, and the inbox of those meetings. kb knows nothing about this skill: install it only if you use Fizzy.

## Install

You need kb in the project, [Bun](https://bun.sh) and the [Fizzy CLI](https://github.com/basecamp/fizzy-cli):

```bash
brew install --cask basecamp/tap/fizzy
fizzy setup claude

git clone https://github.com/tekne-studio/tekne-kb-skill-fizzy ~/Dev/tekne-kb-skill-fizzy
ln -s ~/Dev/tekne-kb-skill-fizzy ~/.claude/skills/fizzy-roadmap
ln -s ~/Dev/tekne-kb-skill-fizzy ~/.agents/skills/fizzy-roadmap
```

## Set up a project

1. Run `fizzy setup` in the repository, in your own terminal. It writes `.fizzy.yaml` with your token in plain text: add that file to `.gitignore`.
2. Add one line to the project's `AGENTS.md`, in its language:

   > The Fizzy board "NAME" is the view and inbox of meetings; the roadmap holds the facts and the order, and detail changes only there. Run the fizzy-roadmap skill before and after each meeting, and close an item's card (`<!-- card:N -->`) when the item leaves the roadmap. `.fizzy.yaml` holds the token: read it with `fizzy config show`, never print the file.

3. Run the comparison once and accept the markers it proposes.

## Use

Type `/fizzy-roadmap` or ask in your own words, at one of three moments:

| Moment | What it does |
|---|---|
| Before a meeting | Roadmap to board: closes what was delivered, updates who each item waits on, warns of cards about to expire |
| After a meeting | Board to roadmap: new cards and comments become wishes, items, questions or decisions, by your choice |
| At delivery | Closes the card of the item that left the roadmap |

Except at delivery, it reads both sides with `read.ts`, changes nothing, and lists the differences with numbers. You pick which ones to apply. It edits the roadmap first, runs `kb check` and shows the diff, then changes the board and reports each card. Roadmap changes stay uncommitted.

## How to keep it cheap

- **Mark every pair.** `<!-- card:N -->` below an item's heading, or at the end of a wish or table line, makes matching mechanical. The skill proposes the markers.
- **Keep cards thin.** Two or three sentences, the done line, and steps only for what a meeting will tick off.
- **Change detail only in the roadmap.** On the board, use titles, columns, tags and comments. Description, step and tag edits leave no trace in Fizzy's activity.
- **Keep the board a selection.** Product work and what waits on someone gets a card. A wish someone asked for in a meeting goes to Not Now. Internal engineering and other wishes stay off.
