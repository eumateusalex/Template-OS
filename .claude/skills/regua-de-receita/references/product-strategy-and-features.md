# Product Strategy & Feature Discipline

> Each entry is a reusable principle: the trigger that calls it, the concrete move, and the evidence when there is any.

## Nobody screenshots your average feature; they screenshot the broken detail
**Principle.** "Good" stopped being enough. The bar rose for everyone, and higher still for anything people waited for: what spreads is not the solid core but the careless detail, and a negative frame makes even a good product look bad.
**Apply when.** Deciding whether polish on empty states, modals and edge cases can wait for "after launch", or prioritizing the backlog between new features and finishing.
**The move.** Treat the details people can screenshot as part of the release, not as cleanup: the broken empty state and the modal with placeholder text or lorem ipsum circulate more than your whole changelog. The example is a game rated 78 on Metacritic, praised as a PS5 graphics showcase with ray tracing commended review after review; what went viral was chase scenes that played themselves and the low care in the details.
**In one line.** "Nobody screenshots your average feature. They screenshot the broken empty state, and that print circulates more than the whole changelog."

## Send feature requests to a parking lot and count who asked, who wanted it, and who left over it
**Principle.** Deciding what does not exist is where the value sits, because that is what touches the business's needle — the rest is execution, and execution can be partly automated. A request queue that goes straight into the roadmap makes the opposite trade: every feature raises the product's cognitive load, which in practice is the attention of someone with grease on their hands trying to close a work order.
**Apply when.** A user asks for a feature, or the backlog is filling with requests nobody has weighed against the cost of carrying them.
**The move.** A new-feature request does not enter the queue — it goes to a **parking lot**, and you record how many asked, who asked, and **who cancelled for the lack of it**. That last column is what converts an opinion into a business case. Keep the real work queue for what keeps the system standing, and let a routine prioritise it every morning from one pooled list: errors from Sentry, tickets support opened in Linear, scheduled technical-debt sweeps — with only bugs allowed to jump the queue.
**Evidence.** 90 days on a repair-shop SaaS: **167 PRs opened, 136 merged — 66 bug fixes, 19 performance, 17 structural refactor, 6 new features, 4 tests**, the rest CI and documentation. Sixty-six fixes for six features, on a system that issues invoices, controls stock, runs work orders and is multi-tenant. One bug surfaced that way: a paginated listing returning 168 distinct records out of 200.

## Collect every opinion; build on almost none of them
**Principle.** Every opinion is biased — the only question is how. Ask someone at the bathroom door whether they washed their hands and the answer is always yes. Treating each opinion as a requirement produces a product shaped by whoever spoke loudest, not by what the market will pay for.
**Apply when.** A founder is proud that users request features directly and they become issues the same day.
**The move.** Separate collecting from building, and weight by who has money at stake. In the Simpsons episode, Homer's newly discovered half-brother owns a car company, sees the average American in him, and treats every one of his opinions as a requirement: a soundproof bubble for the children with an optional gag, three horns playing *La Cucaracha*, an oversized cup holder. Features that served exactly **one user**. The car shipped at **$82,000 and broke the company.** The real founder version ends the same way — the product grew huge, complex, and churned unbearably. **A friend praises you so as not to hurt you; whoever put money on the table complains about exactly what matters, and draws your roadmap for free.**
**In one line.** "Listen to whoever pays your bills. The rest is noise."

## Feature requests from cancellations don't buy features
**Principle.** Three auto shops canceled a repair-shop SaaS over missing boleto (bank-slip) issuance — request logged in Linear with name and date, 20+ in the same queue, oldest since June. But cancellation doesn't buy a feature: the ICP profile is defined, and boleto sits in a deliberately-not-doing package. Support is semi-automated (AI triages, human on novel questions, both open Linear tickets; a scheduled AI task prioritizes them every morning). Bugs jump the queue; anything new defaults to parking lot.
**Apply when.** Cancelling customers' feature requests pressure the roadmap.
**The move.** Log each request with the customer and date, aggregate demand, then prioritize by bug severity, ICP fit, and strategy — not by the latest cancellation. Default net-new work to the parking lot. When asked for timing, communicate the real queue ("20 requests are ahead of yours") instead of making a false promise.

## Building is the comfort zone; distribution is the game
**Principle.** Founders choose to build because selling hurts — one founder spent 90% of his time perfecting a delivery product a year before iFood existed; it died beautiful. Humane raised ~US$240M, ex-Apple founders, gorgeous hardware; returns outpaced sales by summer 2024 and HP took the assets for US$116M. In survival phase you do both jobs and almost always pick building — your comfort zone — pretending the next feature will make selling easier. Exercise: how many months of runway does your next feature cost?
**Apply when.** Roadmap keeps growing while distribution is untested.
**The move.** Before every roadmap item in the survival phase, ask the question — how many months of runway does this feature cost? — and whether it actually makes selling easier or just postpones selling. If the honest answer is "it's the comfortable thing to build," spend that time on the job that hurts: selling.

## Infinite generated images did not devalue the real photo — Airbnb re-measured and it still pays
**Principle.** "Do things that don't scale" is usually quoted as a startup phase you grow out of. It can also be a permanent line item, and the way to know is to measure it again after the world changes rather than assuming the old result expired.
**Apply when.** Deciding whether hand-made, expensive inputs — photography, onboarding calls, manual setup — still earn their cost in a market flooded with generated alternatives.
**The move.** Run the arithmetic on the measured lift rather than the narrative. In 2011 Airbnb sent photographers door to door — the classic unscalable act — and monthly revenue doubled in the New York pilot. Fourteen years and an image-generation revolution later they measured again across **14,700 listings between 2024 and 2025: 19% more bookings and 21% more earnings for hosts who used professional photos.** AI that generates infinite images did not devalue the real one. So do the sum on 20%: does that difference pay for professional photography in your product? If yes, go.

## 94% of features are filler — Pendo's data and what to do about it
**Principle.** Pendo's analysis across ~2,500 companies' apps found roughly 6% feature adoption in the average product; even top-10% products reached only 15.6%. That leaves about 94% rarely or never used in the average product (84.4% even in the top decile), creating low activation, churn, a larger attack surface, and higher sustaining cost/complexity. Some features sell without being used, but that doesn't explain the gap.
**Apply when.** Auditing a bloated roadmap or justifying a feature purge.
**The move.** Classify every feature by usage correlation: A. Core (the 6% carrying the product; 15% if you're top-10%), B. Strategic (contributes to sales), C. Discard. Then shrink the product by use and/or cash generation.

## A product that stopped evolving invites the extraction that follows
**Principle.** A tool can be adequate and still be bad, when it evolves at the pace of an ocean liner while making it hard for anyone to build on top of it. What follows is predictable: the platform starts charging for what used to be free — enshittification — and the users have no alternative because nothing was allowed to grow beside it.
**Apply when.** Judging a dominant tool your product depends on, or deciding how open to be about what others build on top of yours.
**The move.** Read stagnation and closure as one posture rather than two. WhatsApp's uneven density between the chat list and the conversation is understandable and easily fixed by hiding the list to focus each conversation. The real problem is different: it evolved little while obstructing anyone trying to build even a simple CRM on top — uses it could have absorbed later — and now charges businesses for messages, including replies. **There are terminal applications with better usability than that product.** The lesson for your own platform is that what you refuse to let others build is also what you refuse to learn.

## PMF is step 8 in a 10-step sequence — founders start there too early
**Principle.** Sequence: (1) Define the ICP — does it really exist, or is it who you wish it were? (2) Surface the ICP's pains and desires — real? verified where, with how many? (3) Understand awareness level — knows the pain? the solution? yours? (4) Slice niche/sub-niche — their particularities, do they exclude each other? (5) Size TAM of niche and sub — enough market, and does enough remain after niching? (6) Actively decide who the solution serves — can you stand out there? (7) Validate the thesis — the ICP's pain solved in a way that pays; are they paying? (8) Reach PMF — does the product stick? do users recommend it unprompted? does the business sustain itself without you pushing? (9) Fix inefficiencies in acquisition, activation, retention — always leaks; measured where? (10) Scale.
**Apply when.** A founder says they "want PMF" without the groundwork.
**The move.** Work the sequence in order and require evidence at each gate: a verified ICP and pain, a viable niche/TAM, paying thesis validation, then PMF. Only after measuring and fixing acquisition, activation, and retention leaks should you scale.

## Feature creep is a business cost, not just a UX one
**Principle.** The Homer Simpson car problem: every unsatisfied user request implemented as a feature eventually makes the product hard to operate, steepens the learning curve, and worsens experience through cognitive overload and choice paradox. It's bad for the business too — you spend more on dev for features serving few users, more on maintenance, eventually whole teams for barely-needed areas. Prune by asking: who are our most strategic users, what are they using, what's unused that I can abstract, what aligns with the vision.
**Apply when.** A product keeps growing features without a subtraction ritual.
**The move.** Treat pruning like a cost line: grass grows by itself, you have to mow. Look for low-usage features serving low-paying/high-churn subniches and cut them to serve better those who pay more and stay longer.

## What kills most startups is not greed, it is feature creep
**Principle.** Enshittification names the predatory case, where a platform degrades on purpose to extract more from users already locked in. But the thing that kills nine out of ten startups is not greed, it is the bloat of a team that only ever wanted to serve more people and ends up shipping a Swiss Champ XXL, the 73-function knife that no longer fits a pocket. Each feature looked necessary on its own; the damage is that they add up.
**Apply when.** Features are being added to close a sales objection or serve a subniche, and nobody is removing anything.
**The move.** Judge the bloat on two clocks. **Learning time**: more surface in the interface stretches how long the user takes to learn the product, which stretches TTV whenever onboarding fails to point attention at what matters, and a longer TTV is churn, because the longer value takes to arrive the more people quit on the way. **Decision time**: Hick's law, more options means more time to decide and a higher chance of freezing and doing nothing, and less internal action becomes less usage, which becomes less upsell. Then treat trimming the product like trimming company cost: it is grass, it grows on its own, and it takes over unless you cut it regularly. Look for what has low usage and serves a subniche that pays little or churns heavily, and cut that to serve better the customers who pay more and stay longer.
**Evidence.** The jam experiment: a 24-flavor display against a 6-flavor one, where the smaller display sold ten times more, converting 30% against 3%.
**Visual.** Bulk Rename Utility: one desktop window carrying thirteen numbered option panels (RegEx, Replace, Remove, Add, Auto Date, Numbering, Case, Move/Copy, Append Folder Name, Extension, Selections, New Location) wrapped around a file list. The Swiss Champ XXL rendered as software — `../assets/product-strategy-and-features/bulk-rename-utility-thirteen-panels.jpg`
**In one line.** "It grows on its own, like grass, and you have to keep trimming or it takes over."

## Maturing the product means doing the same thing better, not adding power-user features
**Principle.** Technical founders keep densifying the product for heavy users, making it expensive, complex, and hard for the average user — a Boeing 747 cockpit. Maturing means doing better what the product already does: smoother flows, bug fixes, attention direction. Hidden risk: a power-user product has a smaller top of funnel, so you must charge more — you changed markets (TAM/SAM changed) and price must follow. The founder then reads "product is bad" when really ICP isn't adjusted. Adjust copy (more executive, less tool-like), visuals (show the result, less product internals), and detail care (high-paying ICP tolerates AI-slop design less).
**Apply when.** The product keeps getting denser and conversion falls.
**The move.** Stop adding depth by default; smooth the core flows, fix bugs, and direct attention first. If the product is deliberately moving upmarket, recalculate TAM/SAM and price, then align the ICP, copy, visuals, and detail quality with that smaller, higher-value market.
**Evidence.** The "five ways to build a $100M business" chart — from the elephant (few customers paying a lot) to the fly (millions paying little) — all work; the problem is becoming an elephant without noticing and still charging mouse prices.

## Run every feature through a two-layer "Swiss Knife filter" before building
**Principle.** A feature you ship stays forever and charges rent forever, so the right question isn't "is this good?" but "does it deserve the permanent cost it imposes on the product?"
**Apply when.** A roadmap item feels appealing but nobody applied a filter before committing to build.
**The move.** Layer 1 — does it deserve to exist? Pass all four: (1) cognitive load (more surface = more to learn + Hick's law decision time); (2) ICP specificity (a CRM for facial-aesthetics clinics charges 5x a generic one); (3) operational cost (maintain/support/document, not build); (4) reinforces the core claim. Layer 2 — build now? Two axes: easily rejectable (clear "no"?) and easily implementable (cost to the validating version, not the dream version). Build the no-brainers first; fail any of the four, kill it guilt-free. To rank survivors, score (New Users + New Revenue + Impact Level) / Effort.
**Visual.** Prioritization scoring table: (New Users + New Revenue + Impact Level) / Effort = Score — `../assets/product-strategy-and-features/prioritization-score-table.jpg`
**In one line.** "Every feature that gets in, stays. And it charges rent forever."

## Feature adoption is a design problem, not a communication problem
**Principle.** Shipping a feature doesn't make it discovered; users move through their habitual path and never see what they aren't looking for.
**Apply when.** Three weeks post-launch only ~9% of active users opened the feature and ~4% used it twice, despite changelog, email, and "new" badges.
**The move.** Stop treating adoption as announcement. The killers are inattentional blindness (users don't see what they aren't seeking) plus status-quo bias (re-learning cost outweighs perceived benefit even when the new way is better). Instead: contextual announcements rather than the "look at our new feature" modal on login, which is usually ignored; directional empty states that surface the feature where it'd be used; triggered onboarding fired by the behavior that signals need (CRM user hits the sales page → introduce the objection-busting AI); and a feature adoption rate metric measuring habit/appropriate frequency, not clicks (in a repair-shop SaaS a work order happens every day, so a feature that acts on the work order should be used at least once a day). Anything below an adoption threshold goes back into review: it was badly designed, sits in the wrong place, or nobody needs it yet.
**In one line.** "Launching a feature is easy; getting it used is a whole other thing."

## Compute your Swiss Knife Index to expose feature creep
**Principle.** A product's worth is measured by features actually used, not features shipped; a bloated product is expensive to sustain and hard to sell, not rich.
**Apply when.** The roadmap has become a user wishlist and every new feature feels like progress (especially with AI making building cheap).
**The move.** Swiss Knife Index (SKI) = (features used by >40% of active users in a 30-day window) ÷ (total features). Below 0.3, you own a clumsy Swiss army knife. Fix it with: quarterly audits on real usage data (not team opinion); hide, don't delete (push rarely-used features into advanced settings — reachable for the 3%, gone for the 97%); and a gate on every new feature — "which existing feature do I kill to make cognitive room?" Litmus test: which feature would you show first with 30 seconds to sell? The rest stays invisible until needed. Read with "Ground feature discipline in the academic feature-fatigue research" (the evidence) and "Past the optimal feature count, a technically bigger product becomes functionally worse" (the curve).
**Visual.** SKI curve — perceived utility rises then declines past the optimal point as complexity keeps climbing — `../assets/product-strategy-and-features/swiss-knife-index-curve.jpg`
**In one line.** "Which feature would I show first if I had 30 seconds to sell the product?"

## Design the attention hierarchy to direct behavior, not just organize info
**Principle.** A product that organizes delivers access; a product that directs delivers activation — and the visual hierarchy decides which the user gets.
**Apply when.** "My interface looks good, but people don't use the main features" — and the key feature is buried behind three clicks the user will never make.
**The move.** Recognize that attention hierarchy is the structure deciding what users see first, find with effort, or never discover. Built without intent, the product sabotages itself: users use what's most salient, which is rarely what retains. Plan the hierarchy to influence behavior — make the value-driving, retention-driving feature the most prominent thing — instead of merely arranging information neatly.
**Visual.** A typographic demo (huge headline "YOU WILL READ THIS FIRST") proving the eye follows visual weight, not reading order — `../assets/product-strategy-and-features/visual-weight-reading-order-typography.png`
**In one line.** "A well-designed attention hierarchy makes the user use what retains; a bad one makes them use what's most salient."

## Ground feature discipline in the academic feature-fatigue research
**Principle.** Past a cognitive-load threshold, the subjective evaluation of a product doesn't stay neutral — it declines into frustration, confusion, and task abandonment, directly hitting CAC and LTV.
**Apply when.** You need the evidence behind cutting features, and want to separate pre-purchase appeal from post-purchase utility.
**The move.** Apply the SKI as a decision criterion grounded in feature fatigue. More features help pre-purchase comparison via distinction bias but hurt the decision via analysis paralysis (more options = longer decisions and more no-decisions; no decision, no conversion). Each extra feature steepens the learning curve — measurable B2B productivity loss — and when value comes slowly, users silently churn before the trial ends, blaming themselves, not the product. This complements "Compute your Swiss Knife Index to expose feature creep" (the index) and "Past the optimal feature count, a technically bigger product becomes functionally worse" (the curve).
**Evidence.** Thompson, Hamilton & Rust (2005), "Feature Fatigue," JMR 42(4); distinction bias (Hsee & Zhang 2004); analysis paralysis (Iyengar & Lepper 2000).
**In one line.** "A product that grows without criteria doesn't get rich — it gets expensive to sustain and hard to sell."

## Past the optimal feature count, a technically bigger product becomes functionally worse
**Principle.** The relationship between feature count and perceived utility is non-linear: there's an optimal point, after which each added feature reduces perceived utility while raising sustaining cost and the learning curve.
**Apply when.** You hear "my interface looks good, but people don't use the main features" — a sign you've passed the optimal point.
**The move.** Read the SKI curve: utility climbs to a peak (~10 features in the example) then falls as complexity keeps rising. The fix isn't more visibility — it's reducing the product's cognitive load so the rest becomes visible again. Criterion: any feature used by under 10% of the active base must justify its existence or leave. There's no universal ideal count — only the ideal for your ICP, context, and device.
**Visual.** SKI graph: green perceived-utility curve peaks at the optimal point (10.3 features, 97), red complexity curve rises monotonically and overtakes utility in the "decline zone" — `../assets/product-strategy-and-features/swiss-knife-index-curve.jpg`
**In one line.** "A bloated product isn't a rich product — it's a product actively destroying the conversion and retention you paid dearly to win."

## Focus on your core; trying to be "all-in-one" dilutes your value proposition
**Principle.** Chasing a bigger TAM by going generic destroys retention of your heavy users without converting new ones — the same roadmap mistake in cars and in software.
**Apply when.** The product is tempted to "embrace the world" and become a do-everything tool, abandoning the specific ICP that made it loved.
**The move.** Remember who your ICP actually is and build for them, even at the expense of broad appeal. In software, when UI/UX tries to cover everything, the value proposition dilutes: you wreck heavy-user retention and fail to convert newcomers because you've gone generic. Focus relentlessly on the core.
**Evidence.** Porsche chased China's TAM with generic EVs, abandoning its ICP (visceral flat-six machines); ~€3.9B in losses to reverse the roadmap — operating profit fell from €4,000M (2022) to €40M (9M 2025), margin 18% → 0.2%. [Porsche figures as reported publicly; treat as illustrative.]
**In one line.** "Focus on your damn core."

## The customer names the problem and requests the wrong solution — ship the fear, not the feature
**Principle.** People are reliable reporters of their problem and unreliable designers of its solution. Take the request literally and you build something expensive that addresses a symptom; investigate the fear underneath it and the real fix is usually cheaper and better.
**Apply when.** A feature request arrives fully specified, especially one that is costly to build, and the team is about to put it on the roadmap as stated.
**The move.** Separate the stated request from the underlying fear before estimating anything. "I want to print my contract" looks like a printing feature — expensive and awkward on mobile. Investigated, it meant "I am afraid I have no proof of what I signed", so the team shipped security and proof of signature instead of a printer. Listening this way also shrinks the roadmap: about 80% of what you thought you needed to build already exists in the product, hidden behind design friction rather than missing.
