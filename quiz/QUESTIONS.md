# Question audit

Every question, what it scores, which role it can push a result toward, and where the claim behind it comes from. The source of truth for all of it is `../research/companion-ai-research-index.html` — Oliver, *What Is an "AI Companion"? The definitional problem · research index*, working draft, August 2026, Berkman Klein Center.

Nothing in this table was invented. Where the index has no evidence for something, the table says so.

## The two axes

| | What it measures | How it is computed |
|---|---|---|
| **X — function depth** | How much of the companion feature set the person's habits switch on | Sum of `x` weights (0/1/2) over eleven items, divided by the maximum of the **answered** items, ×100. A partial run still plots honestly. |
| **Y — role depth** | How close a friendship role the use occupies | Sum of `depth` weights, divided by `config.depthMax` (12), ×100, capped at 100. |

The Y band and the **dominant category flag** together pick the result cell. Flags are compared as a share of each flag's own maximum, not as raw totals — `platonic` collects points from five questions while each specific category has one, so raw totals would let a person's general answers outvote their own explicit "yes" to romance or a family-shaped gap. Ties break in `config.flagPriority` order: romantic → professional-care → familial → platonic → professional-academic.

## The six design functions scored on X

| Function | In the index's definitional core? | Source |
|---|---|---|
| Persistent memory | Yes | Sun, Wang & McDaniel (2026), *Child Development Perspectives* — §3.3 |
| Emotional responsiveness | Yes | Sun et al. — §3.3; McStay (2026) on emulated empathy — §3.4 |
| Anthropomorphism | Yes | Sun et al. — §3.3, §6.1 |
| Constant availability | Yes | Sun et al. — §3.3, §6.1, §C.5 |
| Sycophancy | **No** — risk list, not the core four | §1.3; Cheng et al. (2025) via §1.5 |
| Proactive relational initiative | **No** — a rival definitional criterion | Bernardi (2025) — §3.2; New York Article 47 and the People-First Chatbot Act — §7.2 |

The index adopts Sun et al.'s four features as "the definitional core adopted by this paper" (§3.3). The last two are real in the index but arrive from different places, and the quiz scores them alongside the four without implying they are one taxonomy. §7.5 leaves open which functional definition is correct — Sun et al.'s four, or McStay's narrower emulated empathy. This quiz does not settle it either.

## The audit table

| Q | Question (gist) | Axis | Function | Depth | Role flag | Source | Index anchor |
|---|---|---|---|---|---|---|---|
| 1 | It brings up something from weeks ago | X | memory | — | — | Sun et al.; product copy | §3.3, §6.1, §C.2 |
| 2 | Chat history disappears | X | memory | — | — | Sun et al.; product copy | §3.3, §6.1 |
| 3 | When you open it | X | availability | +1 on **c** | platonic +1 on **c** | Sun et al.; product copy | §3.3, §6.1, §C.5 |
| 4 | Down for a week | X | availability | — | — | Sun et al.; Common Sense Media | §3.3, §2.3 |
| 5 | Typing out a bad day | X | emotional responsiveness | +1 on **c** | platonic +1 on **c** | Sun et al.; McStay | §3.3, §3.4 |
| 6 | How the reply lands | X | emotional responsiveness | — | — | McStay | §3.4 |
| 7 | Please and thanks | X | anthropomorphism | — | — | Sun et al.; product copy | §3.3, §6.1, §C.4 |
| 8 | Name, voice, personality | X | anthropomorphism | — | — | Product copy; Carlton | §6.1, §C.4 |
| 9 | What it says about a fight | X | sycophancy | +1 on **c** | platonic +1 on **c** | Cheng et al. (2025) ⚠ | §1.3, §1.5 |
| 10 | Which reply you want | X | sycophancy | — | — | Cheng et al. (2025) ⚠ | §1.5, §4.3 |
| 11 | Does it start things | X | proactive initiative | — | — | Bernardi; People-First Chatbot Act; state instruments | §3.2, §7.2 |
| 12 | What you mostly bring it | Y | — | 0 / 2 / 4 | **a** → professional-academic; **b/c** → platonic | Pew; Thorn Fig 5C p. 15 | §2.3, §6.3 |
| 13 | Who hears about it first | Y | — | 0 / 2 / 4 | platonic | Thorn Fig 5C p. 15; Common Sense Media | §2.3 |
| 14 | Flirting, roleplay, rehearsal | Y | — | 0 / 1 / 2 | romantic | Thorn Fig 5C p. 15; CDT ⚠ | §2.3 |
| 15 | The heavy stuff | Y | — | 0 / 1 / 2 | professional-care | Thorn Fig 5C p. 15 and disclosure chapter; Andoh | §2.3 |
| 16 | A parent- or sibling-shaped gap | Y | — | 0 / 1 / 2 | familial | **none — the cell is empty in the literature** | §4.2 |
| 17 | Still going in five years | Y | — | 0 / 2 / 6 | — (gates the lifelong cell) | **none — unobservable** | §4.2 |
| 18 | Does it need anything from you | **none** | — | — | — | OED via §4.3 | §4.3 |

⚠ = the index cites this source in prose but records no venue, method, or sample size for it. Those receipts are labelled as thinner on the result card itself rather than dressed up.

### Two deliberate irregularities

**Q18 is unscored.** Reciprocity is the hole the index flags in its own coverage map: "No row in this table contains evidence about whether young users perceive that asymmetry — the paper's normative claim currently rests on the dictionary, not on data." Moving a score on that answer would imply a finding that does not exist. It awards a badge instead.

**Q17 gates rather than scores a cell directly.** Gupta's fourth grade is defined by "years of shared experience and memory," so depth alone must not be able to reach the lifelong cell. Without a **c** on Q17, a maxed-out platonic result falls back to confidant.

## The result cells

Eight cells, one per row of the index's roles-vs-evidence coverage map. The evidence status is a property of the **role**, never of the person answering.

| Dominant flag | Y band | Cell | Index role | Evidence |
|---|---|---|---|---|
| platonic | 1 | The Background Buddy | Acquaintance | **Unstudied** |
| platonic | 2 | The Hangout Habit | Casual friend | **Thin** |
| platonic | 3 | The One You Tell First | Confidant, close friend | **Documented** |
| platonic | 4 + Q17=c | The Lifer | Lifelong friend | **Unstudied** |
| platonic | 4, Q17≠c | The One You Tell First | Confidant, close friend | **Documented** |
| professional-academic | any | The Homework Friend | Mentor, tutor, study partner | **Documented** |
| professional-care | any | The 3 A.M. Listener | Therapist-like support | **Documented** |
| romantic | any | The Flirt File | Romantic or sexual partner | **Documented** |
| familial | any | The Family-Shaped Gap | Familial | **Unstudied** |

Evidence statuses use the index's own thresholds, taken from the colour logic in its `vzRoles()` visual (green above 60, amber above 25, red below). Four roles come out Documented, one Thin, three Unstudied.

The index's own coding percentages are **not** shown anywhere in the quiz. The author states they are "indicative, not measured" and that "the ranking is more defensible than the values," so printing them to a teenager as a measurement would misrepresent them. Study statistics — sample sizes, figure numbers, page numbers — are reproduced exactly.

## Why the thin cell is the sharp one

The index's reading of its own map, which the result copy is built around:

- "The best-evidenced role is the least discussed" — the mentor and study-partner role is where most young people meet these systems, and it is analysed as an academic-integrity question rather than a relational one. The index calls it "the role through which most young people first form a habit of confiding."
- "The most-regulated role is mid-table" — the romantic role attracts nearly all companion-specific regulation while three roles above or beside it attract none.
- "Reciprocity is untested everywhere."
- "The lifer question is unanswerable."

So the quiz's most pointed result is the *thinnest* one: a person who brings it nothing but homework lands in the single best-documented relational role in the literature, and the least examined. That framing also keeps the quiz clear of implying that a deep result is a bad result.

## Where the role names come from

The four grades of friendship are Gupta's, published on Verywell Mind. The familial / platonic / romantic-or-sexual / professional categories are Goodson's, published on Medium. **Neither is peer-reviewed**, and the index is explicit that both are used "for vocabulary, not findings" and cannot support any empirical claim about how young people's relationships work. Every result card's receipts panel says this. It is not optional decoration — it is the difference between a quiz that reports research and a quiz that launders a listicle.

## Known gap

Eight sources are cited in the index's prose but absent from its 20-source register, so author and year are all that can be given for them: De Freitas et al. (2026), Figueroa et al. (2026), Namvarpour & Razi (2026), **Cheng et al. (2025)**, Fang et al. (2025), Wheatley Institute (2026), Shirky (2026), and the **Center for Democracy and Technology**. Two of those are load-bearing here — Cheng et al. behind both sycophancy questions, and CDT as one of only two receipts on the romantic card. Filling in their venues would strengthen those two cards more than any copy change.
