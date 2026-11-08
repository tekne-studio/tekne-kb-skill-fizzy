# tekne-kb-skill-fizzy

A Claude Code skill that compares a project's [kb](https://npm.tekne.studio) roadmap with its [Fizzy](https://fizzy.do) board and applies the differences you approve, on both sides.

The roadmap holds the facts and the order. The board is a view of it and the inbox of meetings. kb knows nothing about this skill: install it only if you use Fizzy.

## Install

You need kb in the project and the [Fizzy CLI](https://github.com/basecamp/fizzy-cli):

```bash
brew install --cask basecamp/tap/fizzy
fizzy setup claude

git clone https://github.com/tekne-studio/tekne-kb-skill-fizzy ~/Dev/tekne-kb-skill-fizzy
ln -s ~/Dev/tekne-kb-skill-fizzy ~/.claude/skills/fizzy-roadmap
ln -s ~/Dev/tekne-kb-skill-fizzy ~/.agents/skills/fizzy-roadmap
```

In each project, run `fizzy setup` once. It writes `.fizzy.yaml` with your token in plain text, so add that file to `.gitignore`.

## Use

After a meeting, or whenever you want to check, type `/fizzy-roadmap` or ask for it in your own words.

1. It reads the roadmap and the board, changes nothing, and lists the differences with numbers.
2. You answer which ones to apply: some numbers, or all.
3. It edits the roadmap first, runs `kb check` and shows the diff. Then it changes the board and reports each card.

It leaves the roadmap changes uncommitted. A card closed on the board keeps its item in the roadmap until its done line is checked, and each comment becomes a decision, a question or a step by your choice.
