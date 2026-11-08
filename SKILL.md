---
name: fizzy-roadmap
description: Compare a project's kb roadmap with its Fizzy board and apply the approved differences on both sides. Use after a meeting held on Fizzy, or when the person asks to compare, sync or update the board or the roadmap, or to bring Fizzy cards into the roadmap. For a single Fizzy action with no roadmap involved, use the fizzy skill.
---

# Fizzy and the roadmap

The roadmap holds the facts and the order. The board is a view of the roadmap and the inbox of meetings. This skill reads both, shows the differences, and changes only what the person approves.

Load the `fizzy` skill first: it has the commands, flags and field names.

## 1. Read the project

- Board: `.fizzy.yaml` in the repository. When it is missing, ask the person to run `fizzy setup` in the repository, in their own terminal. That file holds the token in plain text: confirm with `git check-ignore .fizzy.yaml` that git ignores it, add it to `.gitignore` when it does not, and print only its keys.
- Names: `kb.config.ts` → `roadmap: { file, now, later, doneWhen }`. The sections and the done line carry these names, in the project's language.
- Roadmap: read `docs/<file>` directly, because `kb roadmap --json` leaves out item bodies and the text of steps and wishes.
- Who an item waits on: `bun kb question list`.

## 2. Read the board (read only)

```bash
fizzy column list --jq '[.data[] | {id, name, kind}]'
fizzy card list --column maybe --all --jq '[.data[] | {number, title, last_active_at}]'
fizzy card list --column COLUMN_ID --all --jq '[.data[] | {number, title, last_active_at, tags: [.tags[].title]}]'
fizzy card list --indexed-by closed --all --jq '[.data[] | {number, title, last_active_at}]'
fizzy card list --indexed-by not_now --all --jq '[.data[] | {number, title}]'
```

Open a card with `fizzy card show N --jq '.data | {description, steps: (.steps // [])}'` when its match needs comparing; `steps` comes null on a card without steps. Read its comments with `fizzy comment list --card N --jq '[.data[] | select(.creator.role != "system") | {created_at, by: .creator.name, text: .body.plain_text}]'` when it was active after the last roadmap change; the filter drops the automatic "moved this to" entries.

## 3. Match items and cards

- Match by meaning. The roadmap and the board can be in different languages.
- When a match is doubtful, ask, then record it as `<!-- card:12 -->` on the line below the `###` heading, or at the end of the wish line. Keep it out of the heading, which would change the anchor.
- Renaming an item changes its anchor and breaks `--unblocks roadmap.md#item`; `kb check` reports it.

## 4. Show the differences

Group them, with the card number and the roadmap section on every line:

1. Cards only on the board
2. Items only in the roadmap
3. Pairs that differ: title, description, steps, or lane
4. Closed cards whose item is still in the roadmap
5. Open cards whose item left the roadmap
6. Comments that still have no home

To tell which side changed, compare the card's `last_active_at` with `git log -1 --format=%cI -- docs/<file>`. That is a hint: when either side could be the newer one, show both texts and let the person choose.

The order lives only in the roadmap, because the board has no card positions. Leave order out of the differences.

Columns show what is being worked on now, and the now section lists what comes next, so an item of the now section with its card in Maybe is normal. Report a lane difference only when a wish has its card in a work column.

## 5. Propose, per difference

| On the board | In the roadmap |
|---|---|
| new card in Maybe | a wish, one line under the later section |
| new card in a work column | a `###` item under the now section; ask for its place in the order and its done line (`kb check` warns until it exists) |
| title, description or steps edited | the item updated |
| step completed | `- [x]` |
| card closed | the item stays; check its done line, since an item leaves in the delivery that meets it |
| comment | the person chooses the home: a decision (`bun kb decision new`), a question (`bun kb question add`) or a step |

| In the roadmap | On the board |
|---|---|
| new item in the now section | a card in Maybe, with the body and the done line as description and the checkboxes as steps |
| new wish | a card in Maybe |
| item delivered and gone | `fizzy card close` |
| item dropped by a decision | ask: close or postpone |
| question that unblocks the item | a tag with who unblocks it, such as `waiting: Ana` |

New cards take the language the board already uses. New roadmap items take the language of the roadmap.

## 6. Apply what was approved

- Number the proposals and wait for the person to pick: some numbers, or all. Reading is free; every card created, changed or closed needs that answer.
- Roadmap first: edit the file, run `bun kb check`, show `git diff` of the roadmap. Use `kb` commands for decisions and questions, which are never edited by hand.
- Board next, and report each change with its card number.
- To retire a card, close it. Delete a card only when the person names it for deletion.
- Leave the roadmap changes in the working tree, and commit when the person asks.
