---
name: fizzy-roadmap
description: Keep a project's kb roadmap and its Fizzy board aligned before a meeting, after one, or when an item is delivered. Use when the person asks to compare, sync or update the board or the roadmap, or to bring Fizzy cards into the roadmap. For a single Fizzy action with no roadmap involved, use the fizzy skill.
---

# Fizzy and the roadmap

The roadmap owns the work, its done line and the order. The board is a selection of it for meetings and the inbox of those meetings; its columns own what is in progress. A kb question owns who an item waits on, mirrored in a `waiting: Name` tag. Decisions live only in kb. Reading is free; a change on either side waits for the person's answer. This file has the commands it needs: load the `fizzy` skill only for one it lacks.

**At delivery**, read the item's `<!-- card:N -->` before it leaves the page and run `fizzy card close N`. When the project's AGENTS.md says to close it, report the number and ask nothing. That is the whole task.

`.fizzy.yaml` holds the token: read settings with `fizzy config show`, and pass `--exclude=.fizzy.yaml` to any `grep -r`. With no board yet, follow Set up a project in the README next to this file.

## 1. Read

From the repository root, run `bun <this skill's folder>/read.ts [since] [--wishes]`. It changes nothing and prints each item with its card, lane, tags and blockers, then the findings and the activity per card. `since` defaults to the roadmap's last commit; pass the last meeting's date when you know it. `--wishes` also lists the wishes with no card.

The pair is `<!-- card:N -->`: on the line below the `###` heading, or at the end of the wish or table line, outside the heading so the anchor holds. Match unmarked cards by meaning, across languages, and propose a marker with each match.

Open an item's body, a card or its comments only for what you are about to propose. After a meeting, also open cards whose item has checkboxes: step, tag and description edits leave no trace in the activity.

## 2. Propose

Number the proposals, with the card and the roadmap section on each, in lettered groups when there are many. Before a meeting use the roadmap rows, after one the board rows, and both when asked to compare. Order exists only in the roadmap, and detail changes only there: leave both out.

| Found | Propose |
|---|---|
| **Board:** new card in Maybe | a wish, one line under the later section |
| new card in a work column | a `###` item under the now section; ask for its place and done line |
| card renamed with a new meaning | the item renamed; `kb check` reports any `--unblocks` link to the old anchor |
| step completed | `- [x]` |
| card closed | the item stays until its done line is met |
| comment | the person chooses: `kb decision new`, `kb question add`, a step, or nothing |
| **Roadmap:** item delivered and gone | close the card |
| item dropped by a decision | ask: close or postpone |
| question with `--unblocks` added or resolved | add or remove the `waiting:` tag; ask who when the owner is blank |
| new item or wish that passes the selection | a thin card |

**Selection.** A card exists for what the people in the meeting need to see or act on. Product work and work waiting on someone go to Maybe. A wish someone asked for in a meeting goes to Not Now, where it does not expire. Internal engineering and other wishes stay off, reported as a count.

**A thin card** is two or three sentences on what it is and why it matters to those people, the done line, and the item's name. Steps are only what a meeting will tick off. New cards take the board's language, new items the roadmap's.

## 3. Apply what was approved

- Show the exact text of every card you will write. For more than five, draft in a temporary file and create each card from it.
- Roadmap first: edit, `kb check`, show `git diff`. Decisions and questions go through `kb` commands only. Commit when the person asks.
- Board next, then run `read.ts` again and report each change with its card number.
- To retire a card, close it. Delete one only when the person names it for deletion.

```bash
fizzy card create --board B --title T --description_file F --jq '.data.number'   # lands in Maybe; markdown works
fizzy card update N --title T --description_file F
fizzy card show N --jq '.data | {description, tags, steps: [(.steps // [])[] | {id, content, completed}]}'
fizzy comment list --card N --jq '[.data[] | select(.creator.role != "system") | {created_at, by: .creator.name, text: .body.plain_text}]'
fizzy card tag N --tag "waiting: Ana"   # toggles, so read the tags first
fizzy step create --card N --content T
fizzy step update STEP_ID --card N --completed
fizzy column list --jq '[.data[] | select(.pseudo | not) | {id, name}]'
fizzy card column N --column COLUMN_ID
fizzy card postpone N
fizzy card close N
fizzy board entropy B --auto_postpone_period_in_days 30   # 3, 7, 11, 30, 90 or 365
```
