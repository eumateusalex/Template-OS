# Writing spec — how to turn new material into a skill principle

You are turning one piece of material from a source the skill follows (a post, an article, a
newsletter issue, a chapter, a case written up by a practitioner) into ONE reusable principle for
this conversion-and-revenue skill. The skill is in **ENGLISH**; when the material is in another
language, translate faithfully into clear, natural English.

## Output format (use EXACTLY this shape)

```
## <short imperative principle title, English>
**Principle.** <1–3 sentences: the core reusable heuristic, generalized, in English.>
**Apply when.** <the trigger/situation where it matters.>
**The move.** <the concrete action/how-to; include framework steps, key numbers, and any NAMED bias/model/framework — KEEP the names (e.g., decoy effect, Zeigarnik effect, Swiss Knife Index, GBB, the 5 levels of market awareness, loss aversion, peak-end rule, Hick's law).>
**Evidence.** <ONLY if the material cites a study, stat or named public case — one tight line, with the study or case named so it can be checked. Else omit this line.>
**Visual.** <one line: what an informational image shows> — `../assets/<theme>/<what-it-shows>.<ext>` <ONLY if the material has an image that carries information (chart, diagram, framework, good/bad UI); for decorative/analogy-only images (e.g. a car photo), omit.>
**In one line.** "<one memorable sentence that carries the point, translated>" <ONLY if the material has a punchy line; else omit.>
```

The block ends on a labelled line. **The principle stands on its own**: whatever the reader needs
to apply it — the case, the number, the steps, the condition — is written into the block itself.
The captured text stays in the capture folder (outside the skill) and is never cited: no path to a
capture, **never a post URL** (the verifier rejects any X or LinkedIn post link anywhere in the
skill text), and no name, handle or profile of whoever published the material. A case from that
person's own product or clients is told neutrally ("a SaaS for auto repair shops", "one founder",
"a bank's support operation").

## Rules

- **Principle-only.** Do NOT include a full translation of the material — condense the reusable idea.
- **Length: aim for ~110–250 words; hard ceiling 550** (the median entry runs about 160
  words). A short post gets a short entry; a long-form article can justify more, and a framework may
  be rendered as a compact bulleted list — never a wall of text. A list sits between labels, never
  after the last one.
- **A long-form article does not always mean one entry.** Split it when the parts have their own
  trigger AND their own example, number or screenshot that a single combined entry cannot carry. An
  onboarding article that names nine patterns, each with a tradeoff, an ideal use and its own
  screen, becomes nine entries plus the original as a spine that answers "which one do I pick?". A
  pricing-page article fully covered by one entry stays one entry, because splitting it would only
  duplicate its neighbours. Splitting is separating a mechanism that does not exist yet — not
  slicing text.
- Preserve the **named mechanism** (the cognitive bias / framework / law) — that naming is the value.
  Name a person only when the name IS the mechanism (Zeigarnik effect, Hick's law, Sean Ellis test)
  or identifies the study that is the evidence (authors, year, journal); never as credit for the idea.
- Be concrete and evidence-led: if the material cites a study, stat, or case, keep the citation attached.
- Quote posts and replies: condense the point of the material you are following; use the quoted or
  replied-to text only as context.
- Images live in `assets/<theme>/`, named for what they show; step 5b of `../atualizar.md` puts them
  there (`captura/guarda-imagens.mjs`). Reference one as `../assets/<theme>/<what-it-shows>.<ext>`
  (the path from inside `references/`).

## Theme routing

Assign the finished entry to exactly ONE theme and save it as
`_local/entradas/<next number>-<slug>.md`; `sincronizar.sh` appends it to the end of
`references/<slug>.md`.

**Precedence: surface beats framing.** If the material names a concrete surface — a dashboard, a
checkout, a pricing page, an onboarding screen, a form — route it to that surface's theme even
when the framing is philosophical. `design-philosophy-and-method` is reserved for material that
names NO single surface: method, process, the designer's role, the value-and-revenue principles
themselves. Without this rule that theme becomes the drain for anything that sounds reflective,
and a "data graveyard" dashboard article ends up filed away from `dashboards-and-data-viz`.

**Precedence: a lever applied to a new surface is a NEW entry in the surface's theme**, not a
rewrite of the general lever. The general lever lives once in `behavioral-science-toolkit`; its
concrete application at checkout lives in `checkout-and-forms`. Same rule the other way: a single
article can legitimately feed several themes — a support-classification article keeps its spine
in churn, but its research-method mechanism belongs to metrics, its "the customer asks for the
wrong solution" mechanism to product strategy, and its "one action per screen" to onboarding.

| slug | covers |
|---|---|
| conversion-and-landing-pages | hero/copy, CTAs, social proof, awareness levels, CRO |
| checkout-and-forms | checkout, cart abandonment, signup/lead forms, field count & friction, validation & error states, guest checkout, coupon fields, billing-cadence toggle, seat/quantity selectors, payment-method choice, card capture, trust & fraud microcopy |
| onboarding-and-activation | empty states, aha moment, TTV, activation, trials |
| design-philosophy-and-method | design philosophy, the value-and-revenue principles, process & method |
| pricing-and-monetization | decoy/anchoring, GBB, trial-with-card, upgrades |
| churn-and-retention | cancellation UX, expectation debt, NRR, jobs-to-be-done |
| dashboards-and-data-viz | dashboards, KPI selection, data visualization, actionable panels, insight vs raw data, F/Z scan order, grouping by business context, rounding & noise, empty states in data screens, role/persona context, visual hierarchy on data |
| behavioral-science-toolkit | the cross-cutting cognitive biases & persuasion levers |
| product-strategy-and-features | Swiss Knife Index, feature adoption, attention hierarchy |
| positioning-icp-and-gtm | ICP, niche, TAM/SAM/SOM, PLG, Bullseye, first customers, distribution |
| ai-era-differentiation | moats, commoditization, vibe-coding pitfalls |
| metrics-and-experimentation | A/B rigor & power, vanity metrics, churn→LTV math, funnel arithmetic, signal quality, event/instrumentation design, cohort analysis, north-star & guardrail metrics, session recording & heatmap reading, research method & incentives |

## Enriching an existing principle

When new material adds to a principle that already exists (a second case, a missing number), write
an enrichment entry instead of a new one: `_local/entradas/<next number>-<slug>.md` opening with
`<!-- alvo: <exact title of the existing principle> | tema: <slug> -->` on the first line, followed
by the labelled lines to add or replace. A label the block does not have yet is inserted in its
canonical position; a label it already has is **replaced** — so to extend it without losing
anything, the entry carries the existing line plus the addition.

## Worked example (the bar to hit)

```
## Design owns the flow, not the final coat of paint
**Principle.** What decides whether a user converts or churns — information order, when you ask for the card, what appears at moments of doubt, when value is first felt — is set and coded long before a "finished" product reaches design.
**Apply when.** Design is scoped as "make it pretty before launch"; product/eng/requirements own the flow (common in big orgs or eng-led teams).
**The move.** Bring design forward so it owns the flow. To win the argument, show it: in a large company where a requirements analyst defined every flow in a Word document, a designer built the same app twice (requirements-led vs UX-led), showed both to the area manager, and was handed the project's leadership the next day.
**In one line.** "If I got a buck every time I heard 'design comes in when the product's almost ready,' I'd buy a GT3 RS."
```
