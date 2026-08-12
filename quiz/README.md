# Is Your AI Good For You?

A static, single-page quiz that takes how a young person actually uses an AI tool and plots that usage on a companion index: which human friendship role their habits most resemble, and how much of the companion feature set those habits switch on.

The point is diagnostic, not matchmaking. Answer honestly and the quiz names the relational role you've handed to a chatbot — and then tells you whether any researcher has studied young people doing the same thing. **Three of the eight result cells are empty in the literature.** Saying so out loud, in the result card, is the feature.

Plain HTML, CSS and vanilla JavaScript. No build step, no framework, no npm, no webfonts, no network requests beyond two local JSON files.

## Contents

```
quiz/
├── index.html          the page
├── styles.css
├── quiz.js             mechanics only — no copy, no weights
├── data/
│   ├── questions.json  questions, answers, weights, role flags, citation keys
│   └── results.json    result cells, copy, badges, evidence status, receipts
├── QUESTIONS.md        audit table: question → axis → role → source
└── README.md           this file
research/
└── companion-ai-research-index.html    the source of truth
```

## Run it locally

The page reads its questions from `data/*.json`, and browsers block that over `file://`. Serve the folder instead:

```sh
cd quiz
python3 -m http.server
# then open http://localhost:8000
```

Opening `index.html` straight from disk shows a message explaining this rather than failing silently.

## Deploy to GitHub Pages

1. **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to *Deploy from a branch*.
3. Pick your branch and the **`/ (root)`** folder. Save.
4. The quiz appears at `https://<user>.github.io/<repo>/quiz/`.

Nothing needs building. There is no server side, so there is nothing to configure.

If you'd rather the quiz *be* the site root, move the four files and `data/` up one level and change the two textual references to `research/companion-ai-research-index.html` in `data/results.json` and `index.html`. Note that root also holds this repository's own `README.md`, which GitHub Pages would otherwise render as the homepage.

## Editing questions without touching code

**All copy and all scoring live in the two JSON files.** `quiz.js` contains no question text, no weights and no result prose. It reads what it finds.

### Reword a question or an answer

Edit `text` (the question) or `label` (an answer) in `data/questions.json`. Nothing else. Never change `id`, `k`, `axis` or `func` — those are how the two data files and the share codes find each other.

### Change what an answer is worth

| Field | Effect |
|---|---|
| `x` | Function-depth points, 0–2. The X-axis maximum recalculates itself, so you cannot break the scale by editing a weight. |
| `depth` | Role-depth points. |
| `flags` | Category strength, e.g. `{"romantic": 2}`. Compared as a share of that flag's own maximum across the bank, so adding a question to one category does not quietly starve the others. |
| `config.depthMax` | Raise it to make the deep cells harder to reach; lower it to make them easier. |
| `config.flagPriority` | Tie-break order when two categories come out equally strong. |

### Change a result card

Edit the entry under `roles` in `data/results.json`: `name`, `tag`, `body`, `whatToDo`. `body` accepts `*emphasis*` and nothing else.

**Do not reword `evidence`, `receipts`, `gap`, `noEvidenceNote` or anything under `sources` without checking the research index.** Those are transcribed, including the caveats. A receipt that drifts from the index is worse than no receipt.

### Add or remove a question

Add or delete an entry in the `questions` array, then **bump `meta.version`**. That deliberately invalidates old share links and saved progress, because a code written against 18 questions cannot mean the same thing against 19.

### Check your weights before you ship

Open the page with `?debug`, or press **Ctrl/Cmd + Shift + D**. A panel plots eight archetypes on the grid and shows exactly where each lands under the current numbers — X, Y, dominant flag, resolved cell, evidence status — with a link to each full result. Edit a weight, reload, look again. Every archetype's answer vector is in `results.json` under `personas`, and the console warns if one falls out of sync with the question bank.

## What the quiz will not do

This quiz argues that relational harm lives in design functions. It cannot use those functions itself. So, by design:

- **No first-person voice.** The page never speaks as an "I", never presents itself as a friend, never claims to feel anything about an answer. There is no per-answer praise layer — the reference quiz this borrows its mechanics from has one, and it was left out on purpose, because flattering the reader is the exact behaviour the sycophancy questions are about.
- **No engagement machinery.** No streaks, no notifications, no "come back tomorrow", no farewell copy engineered to make leaving feel bad.
- **No data collection.** No accounts, no analytics, no beacons, no server. Answers live in `localStorage` on one device and the start-over button erases them. The share link carries the whole result inside itself, so opening one records nothing and counts nothing.
- **No shaming and no diagnosis.** Results describe usage patterns, not people. A deep result is a description, not a verdict. Every card ends with one short outward-pointing step toward a person or an offline action.
- **Care where it's needed.** Cells involving heavy emotional reliance stay warm, mention talking to someone trusted, and carry no crisis-hotline dump and no scare tactics.

## Accessibility

- Answers are real radio inputs in a `fieldset`/`legend`, so arrow keys move between them and screen readers announce the group. Pointer taps advance to the next question; keyboard selection does not, so you can arrow through the options without being thrown forward.
- Visible focus rings on everything focusable; a skip link to the quiz.
- The grid carries an `aria-label` naming the result and both coordinates; the score meter and progress bar carry live ARIA values.
- No images at all — the newsprint grain, halftone and starburst are CSS, so there is no decorative image left uncaptioned.
- `prefers-reduced-motion` nulls every animation and transition, and the sparkle layer defaults to **off** for anyone whose OS asks for reduced motion. It also has a manual toggle in the footer.
- The bright neons are display and fill colours only. Anything at body-text size uses darkened variants that clear WCAG AA against the newsprint background. Reading level is aimed at around grade 8.
- Verified with no horizontal overflow at 320, 390, 768 and 1100 px.

## Credits

Built from **Jane Oliver**, *What Is an "AI Companion"? The definitional problem · research index* (working draft, August 2026, Berkman Klein Center). A copy is committed at `research/companion-ai-research-index.html`; every role, evidence status and citation in the quiz traces to it, and `QUESTIONS.md` records exactly where.

Format and mechanics owe a great deal to **Jack Cushman's** [AI Alignment Love Match](https://jackcushman.org/apps/triad-quiz/) — the two-axis grid with a plotted pin, normalising each axis over answered items only, bit-packed share codes in the URL, collectible badges from hidden sub-scales, and the persona debug panel are all adapted from it. Its analytics beacon and its per-answer compliments are the two things deliberately not carried over.

Visual reference: teen-magazine quiz spreads of the mid-1990s, in particular *YM*, August 1996, "what's your party personality?" (p. 54, by Amy Nebens) — mixed-weight display headline, oversized numerals, literal empty checkboxes, colour-blocked result panels. One-question-per-screen flow and the shareable result card follow the modern BuzzFeed character quiz.

## Status

The scoring model, evidence statuses, receipts and citations are reviewed and final. **All user-facing prose is placeholder.** Every draft block is marked in the data files:

```sh
grep -rn "DRAFT COPY" data/
```
