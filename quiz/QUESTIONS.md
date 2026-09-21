# Question audit

Every question, what it scores, which role it can push a result toward, and the source behind the claim.

## The definition

The quiz is built on one definition:

> Companion AI refers to any AI tool that demonstrates the following four functions: **persistent memory, emulated empathy, anthropomorphism,** and **constant availability**.

| Function | Definition |
|---|---|
| **Persistent memory** | The capacity to retain information disclosed in prior interactions (facts, preferences, emotional history) and to draw on it so that the relationship appears to accumulate over time. |
| **Emulated empathy** | From Andrew McStay: the function of appearing to possess strong human empathy while having only weak empathy, sensing and responding to emotional states without felt experience. |
| **Anthropomorphism** | The function of presenting as human or human-like; through first-person address, a name or persona, a human-like voice, and expressed emotions, such that the user relates to the system as *someone* rather than *something*. |
| **Constant availability** | The property of being reachable at any time, without limit on duration or frequency, and without the reciprocal claims that human relationships impose. |

The full text lives in `data/results.json` under `definition` and is rendered verbatim in the result card's **what counts as companion AI** panel. Do not paraphrase it.

Two further design functions — **sycophancy** and **proactive relational initiative** — are scored on the same axis but are **not part of the definition**. They carry `inDefinition: false` and are labelled as additional functions everywhere they appear, including in the badge copy. They are never counted in the "engages N of the 4" readout.

## The two axes

| | What it measures | How it is computed |
|---|---|---|
| **X — function depth** | How much of the companion function set the person's habits switch on | Sum of `x` weights (0/1/2) over eleven items, divided by the maximum of the **answered** items, ×100. A partial run still plots honestly. |
| **Y — role depth** | How close a friendship role the use occupies | Sum of `depth` weights, divided by `config.depthMax` (12), ×100, capped at 100. |

The Y band and the **dominant category flag** together pick the result cell. Flags are compared as a share of each flag's own maximum, not as raw totals — `platonic` collects points from five questions while each specific category has one, so raw totals would let a person's general answers outvote their own explicit "yes" to romance or a family-shaped gap. Ties break in `config.flagPriority` order: romantic → professional-care → familial → platonic → professional-academic.

### Engages N of the 4

Separately from the axes, the result reports how many of the four defining functions a person's own habits actually switch on. A function counts as engaged at `engagedAt: 3` out of a possible 4 — a clear yes on one of its two questions plus a partial on the other. Half (2) was tried first and was too generous: it let someone who answered in the middle of every question read as engaging three of the four.

This is deliberately separate from companionness. A tool can ship all four functions and a person can still only use one of them.

## The companionness scale

Each role carries a fixed position on a 0–100 scale of how companion-like the pattern of use is. It is a property of the **role**, not a measurement of the person, and it is not a score out of anything.

The scale is calibrated against four reference points:

| Reference point | Value |
|---|---|
| Doesn't use AI | 0 |
| Assistant | 25 |
| Confidant | 75 |
| Partner or best friend | 100 |

These set each role's number and live here as documentation only — **the bar itself shows just its two ends and one mark at the halfway point**, with no quarter markers drawn on it.

Values sit in `data/results.json` under each role's `companionness`. The intermediate values are a first pass and are the most arguable numbers in the project — worth a look before this goes anywhere.

## The audit table

| Q | Question (gist) | Axis | Function | Depth | Role flag | Source |
|---|---|---|---|---|---|---|
| 1 | It brings up something from weeks ago | X | persistent memory | — | — | Definition, function 1 |
| 2 | Chat history disappears | X | persistent memory | — | — | Definition, function 1 |
| 3 | When you open it | X | constant availability | +1 on **c** | platonic +1 on **c** | Definition, function 4 |
| 4 | Down for a week | X | constant availability | — | — | Definition, function 4 |
| 5 | Typing out a bad day | X | emulated empathy | +1 on **c** | platonic +1 on **c** | Definition, function 2 (McStay) |
| 6 | How the reply lands | X | emulated empathy | — | — | Definition, function 2 (McStay) |
| 7 | Please and thanks | X | anthropomorphism | — | — | Definition, function 3 |
| 8 | Name, voice, personality | X | anthropomorphism | — | — | Definition, function 3 |
| 9 | What it says about a fight | X | sycophancy ⚑ | +1 on **c** | platonic +1 on **c** | Cheng et al. (2025) ⚠ |
| 10 | Which reply you want | X | sycophancy ⚑ | — | — | Cheng et al. (2025) ⚠ |
| 11 | Does it start things | X | proactive initiative ⚑ | — | — | Bernardi (2025); New York Article 47; People-First Chatbot Act |
| 12 | What you mostly bring it | Y | — | 0 / 2 / 4 | **a** → professional-academic; **b/c** → platonic | Pew (2026); Thorn (2026) Fig 5C, p. 15 |
| 13 | Who hears about it first | Y | — | 0 / 2 / 4 | platonic | Thorn Fig 5C, p. 15; Common Sense Media (2025) |
| 14 | Flirting, roleplay, rehearsal | Y | — | 0 / 1 / 2 | romantic | Thorn Fig 5C, p. 15; Center for Democracy and Technology ⚠ |
| 15 | The heavy stuff | Y | — | 0 / 1 / 2 | professional-care | Thorn Fig 5C, p. 15 and disclosure chapter; Andoh (2026) |
| 16 | A parent- or sibling-shaped gap | Y | — | 0 / 1 / 2 | familial | **none — the cell is empty in the literature** |
| 17 | Still going in five years | Y | — | 0 / 2 / 6 | — (gates the lifelong cell) | **none — unobservable** |
| 18 | Does it need anything from you | **none** | — | — | — | Oxford English Dictionary, entries for *companion* and *friend* |

⚑ = scored, but not one of the four defining functions.
⚠ = the finding is on record but its venue, method and sample size are not. Those receipts say so on the card rather than being dressed up.

### The break

One pause screen, after question 9 of 18 (`config.breakAfter`). It is deliberately flat — it states where you are and what the second half is for, with no praise and no encouragement, because a quiz about engagement design should not use engagement copy. Set `breakAfter` to `null` to remove it.

### Two deliberate irregularities

**Q18 is unscored.** Whether young people notice that nothing flows back has never been measured. Moving a score on that answer would imply a finding that does not exist, so it awards a badge instead.

**Q17 gates rather than scores a cell directly.** Gupta's fourth grade is defined by "years of shared experience and memory," so depth alone must not be able to reach the lifelong cell. Without a **c** on Q17, a maxed-out platonic result falls back to confidant.

## The result cells

| Dominant flag | Y band | Cell | Role | Companionness | Evidence |
|---|---|---|---|---|---|
| platonic | 1 | The Background Buddy | Acquaintance | 15 | **Unstudied** |
| platonic | 2 | The Hangout Habit | Casual friend | 45 | **Thin** |
| platonic | 3 | The One You Tell First | Confidant, close friend | 75 | **Documented** |
| platonic | 4 + Q17=c | The Lifer | Lifelong friend | 100 | **Unstudied** |
| platonic | 4, Q17≠c | The One You Tell First | Confidant, close friend | 75 | **Documented** |
| professional-academic | any | The Homework Friend | Mentor, tutor, study partner | 25 | **Documented** |
| professional-care | any | The 3 A.M. Listener | Therapist-like support | 70 | **Documented** |
| romantic | any | The Flirt File | Romantic or sexual partner | 100 | **Documented** |
| familial | any | The Family-Shaped Gap | Familial | 85 | **Unstudied** |

Evidence status is a property of the role, never of the person answering. No evidence-coding percentages appear anywhere in the quiz. Study statistics — sample sizes, figure numbers, page numbers — are reproduced exactly.

## Why the thin cell is the sharp one

The mentor and study-partner role is where most young people meet these systems, and it is analysed as an academic-integrity question rather than a relational one — even though it is the role through which most young people first form a habit of confiding. The romantic role, meanwhile, attracts nearly all companion-specific regulation while three roles above or beside it attract none.

So the quiz's most pointed result is the *thinnest* one: a person who brings it nothing but homework lands in the single best-documented relational role in the literature, and the least examined. That framing also keeps the quiz clear of implying that a deep result is a bad result.

## Where the role names come from

The four grades of friendship are Gupta's, published on Verywell Mind. The familial / platonic / romantic-or-sexual / professional categories are Goodson's, published on Medium. **Neither is peer-reviewed**, and both are used here for vocabulary only — they cannot support any empirical claim about how young people's relationships work. Every result card's receipts panel says this. It is the difference between a quiz that reports research and a quiz that launders a listicle.

## Known gap

Two sources carry weight here without a venue, method or sample size on record: **Cheng et al. (2025)**, behind both sycophancy questions, and the **Center for Democracy and Technology** finding, one of only two receipts on the romantic card. Their receipts currently say so out loud. Filling those in would strengthen those two cards more than any copy change.
