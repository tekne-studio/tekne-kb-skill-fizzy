#!/usr/bin/env bun
// Read-only summary of a kb roadmap and its Fizzy board, for the fizzy-roadmap skill.
// From the repository root: bun read.ts [since] [--wishes]
import { existsSync } from "node:fs";

type Entry = { line: number; text: string; now: boolean; cards: number[]; blockers: string[]; steps: string };
type Section = { heading: string; entries: Entry[] };
type Card = { title: string; lane: string; tags: string[] };

function run(...cmd: string[]) {
	const done = Bun.spawnSync(cmd, { stdout: "pipe", stderr: "pipe" });
	return { ok: done.exitCode === 0, out: done.stdout.toString().trim() };
}

function fizzy(...args: string[]) {
	const { ok, out } = run("fizzy", ...args, "--quiet");
	if (!ok) throw new Error(`fizzy ${args.join(" ")} failed; fizzy doctor explains why`);
	return JSON.parse(out);
}

const args = process.argv.slice(2);
const listWishes = args.includes("--wishes");
const sinceArg = args.find((arg) => !arg.startsWith("--"));

const board: string = fizzy("config", "show").board;
if (!board) {
	console.log("No Fizzy board here: run `fizzy setup` in this repository, in your own terminal.");
	process.exit(1);
}

const kb = existsSync("node_modules/.bin/kb") ? ["bun", "kb"] : ["kb"];
const road = JSON.parse(run(...kb, "roadmap", "--json").out);

const cards = new Map<number, Card>();
function addCards(list: any[], lane?: string) {
	for (const c of list) cards.set(c.number, { title: c.title, lane: lane ?? c.column?.name ?? "Maybe", tags: c.tags ?? [] });
}
addCards(fizzy("card", "list", "--all"));
addCards(fizzy("card", "list", "--indexed-by", "not_now", "--all"), "Not Now");
addCards(fizzy("card", "list", "--indexed-by", "closed", "--all"), "closed");

const clean = (text: string) =>
	text
		.replace(/<!--.*?-->/g, "")
		.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
		.replace(/\*\*/g, "")
		.trim();

// A marker belongs to the last `###` item of the now section, or to its own wish or table line elsewhere.
const sections: Section[] = [];
let section: Section | undefined;
let entry: Entry | undefined;
for (const [index, text] of (await Bun.file(road.file).text()).split("\n").entries()) {
	const line = index + 1;
	if (text.startsWith("## ")) {
		section = { heading: text.slice(3), entries: [] };
		sections.push(section);
		entry = undefined;
		continue;
	}
	if (!section) continue;
	const now = section.heading === road.now.heading;
	const marked = [...text.matchAll(/<!-- card:(\d+) -->/g)].map((m) => Number(m[1]));
	let title: string | undefined;
	if (text.startsWith("### ")) {
		entry = undefined;
		if (now) title = text.slice(4);
	} else if (!now && text.startsWith("- ")) {
		title = text.slice(2);
	} else if (!now && text.startsWith("|") && marked.length) {
		title = text.split("|")[1];
	}
	if (title !== undefined) {
		const item = road.now.entries.find((e: any) => e.line === line);
		entry = {
			line,
			text: clean(title).slice(0, 70),
			now,
			cards: [],
			blockers: item ? item.blockedBy.map((q: any) => q.owner || "?") : [],
			steps: item?.steps.total ? ` [${item.steps.done}/${item.steps.total}]` : "",
		};
		section.entries.push(entry);
	}
	entry?.cards.push(...marked);
}

const since = new Date(sinceArg ?? (run("git", "log", "-1", "--format=%cI", "--", road.file).out || 0));
const period: number = fizzy("board", "show", board).auto_postpone_period_in_days;
console.log(`${road.file} · board ${board} · activity since ${since.toISOString().slice(0, 10)} · auto-postpone ${period} days`);

function describe(e: Entry) {
	const paired = e.cards.map((n) => {
		const c = cards.get(n);
		return c ? `#${n} ${c.lane}${c.tags.length ? ` (${c.tags.join(", ")})` : ""}` : `#${n} ?`;
	});
	return [`${e.line} ${e.text}${e.steps}`, ...paired, e.blockers.length ? `waits on ${e.blockers.join(", ")}` : ""].filter(Boolean).join(" · ");
}

for (const s of sections) {
	const shown = s.entries.filter((e) => e.now || e.cards.length || listWishes);
	const hidden = s.entries.length - shown.length;
	if (!s.entries.length) continue;
	console.log(`\n## ${s.heading}${hidden ? ` (${hidden} more with no card; --wishes lists them)` : ""}`);
	for (const e of shown) console.log(describe(e));
}

const findings: string[] = [];
const marked = new Set<number>();
for (const e of sections.flatMap((s) => s.entries)) {
	for (const n of e.cards) {
		marked.add(n);
		const c = cards.get(n);
		const at = `line ${e.line}`;
		const waiting = c?.tags.filter((t) => t.startsWith("waiting:")) ?? [];
		if (!c) findings.push(`#${n} at ${at}: no such card on this board`);
		else if (c.lane === "closed") findings.push(`#${n} closed, item still at ${at}: check its done line`);
		else if (c.lane === "Not Now" && e.now) findings.push(`#${n} in Not Now, item in the now section (${at}): expired or parked, ask`);
		else if (!e.now && c.lane !== "Maybe" && c.lane !== "Not Now") findings.push(`#${n} in ${c.lane}, but ${at} is a wish`);
		else if (e.now && e.blockers.length && !waiting.length) findings.push(`#${n} has no waiting tag, item at ${at} waits on ${e.blockers.join(", ")}`);
		else if (e.now && !e.blockers.length && waiting.length) findings.push(`#${n} has ${waiting.join(", ")}, item at ${at} has no open question`);
	}
}
for (const [n, c] of cards) {
	if (marked.has(n) || c.lane === "closed") continue;
	const hadMarker = run("git", "log", "-1", "--oneline", `-G<!-- card:${n} -->`, "--", road.file).out;
	findings.push(hadMarker ? `#${n} "${c.title}": its item left the roadmap, close the card` : `#${n} ${c.lane} "${c.title}": no marker; match by meaning, or new on the board`);
}
for (const c of fizzy("card", "list", "--indexed-by", "postponing_soon", "--all")) findings.push(`#${c.number} "${c.title}" expires soon`);
if (period < 30) findings.push(`auto-postpone is ${period} days, which drops cards between meetings`);
if (existsSync(".fizzy.yaml") && !run("git", "check-ignore", ".fizzy.yaml").ok) findings.push(".fizzy.yaml holds the token and git does not ignore it: add it to .gitignore");

console.log(`\n## Findings${findings.length ? "" : ": none"}`);
for (const finding of findings) console.log(finding);

// The feed comes newest first; a comment carries its card number only in the card's URL.
const activity = new Map<string, string[]>();
for (const event of fizzy("activity", "list", "--board", board, "--all").reverse()) {
	if (new Date(event.created_at) < since) continue;
	const n = String(event.eventable.number ?? event.eventable.card?.url.split("/").pop() ?? "?");
	const what = event.action.replace(/^card_/, "").replace("comment_created", "comment");
	const actions = activity.get(n) ?? [];
	if (!actions.includes(what)) actions.push(what);
	activity.set(n, actions);
}
console.log(`\n## Activity per card${activity.size ? "" : ": none"}`);
for (const [n, actions] of activity) console.log(`#${n} ${cards.get(Number(n))?.title.slice(0, 40) ?? ""}: ${actions.join(", ")}`);
