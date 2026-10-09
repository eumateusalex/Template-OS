# Behavioral Science & Persuasion

> Each entry is a reusable principle: the trigger that calls it, the concrete move, and the evidence when there is any.

## Gruen effect: the route you make people walk decides how much they see
**Principle.** Shopping-mall architecture is deliberate and built to make you buy, partly through the Gruen effect: the layout pulls the visitor off the errand they came for and into browsing. Everything is designed for consumption.
**Apply when.** Designing the path people must take to reach the thing they came for, and deciding what they pass on the way.
**The move.** Read the mechanisms as a set. Interrupted escalators: instead of putting the up escalator next to the down one, malls separate them, forcing you to walk past more shop windows. Supermarkets put staples (rice, beans, water) at the back so you cross the whole store. Zigzag layouts and a deliberate choice of floors make you walk more: hard, polished floors in the corridors, soft carpet inside the shops so you stop in each one. The extreme is the casino floor where you cannot tell day from night.

## Delboeuf illusion: the container decides how big the portion looks
**Principle.** The Delboeuf illusion is an optical illusion that changes how the brain perceives an object's size depending on what surrounds it: the same amount looks bigger inside a small frame and smaller inside a large one. Restaurants and supermarkets use it to raise consumption and margin.
**Apply when.** The perceived size of a quantity shown inside a container matters to how much people take or buy.
**The move.** Recognize the frame as part of the message. In a per-kilo restaurant, where you pay by weight, the plate is large, so the same food looks like less and you serve more. In an all-you-can-eat buffet, where the house pays for what you eat, the plate is smaller. Supermarkets leave oversized carts waiting at the door, expecting them to be filled.
**Visual.** Two identical black dots, one inside a small ring and one inside a large ring: the dot in the small ring reads as bigger — `../assets/behavioral-science-toolkit/delboeuf-illusion-dots.jpg`

## Bad design is tiring — it drags the user into System 2, and System 2 is what people avoid
**Principle.** Bad design makes a screen expensive to scan, read and understand. Each decision takes longer and pushes the user into deeper rationalization — Daniel Kahneman's System 2, the kind of thinking that costs time and energy and that we avoid out of laziness or plain tiredness. We prefer the light and the entertaining, and an interface that demands effort is competing against that preference.
**Apply when.** A layout is defended as original or distinctive, or a team argues that obvious contrast is patronizing.
**The move.** Create obvious contrast, because that is what makes reading and deciding easy, and easy is what gets chosen. Think of a restaurant: the waiter meets you at the door, walks you to the table, presents the couvert and offers the dish of the day. You may still ask for the menu, but the dish of the day grows more appealing with every page of options you turn — **it is the path that asks nothing of you.** We are biased because thinking is hard. And nobody sees this in their own product: you already know where everything is, so to you it all reads perfectly. It can take a stranger saying in public that they avoided your product because of its landing page.
**In one line.** "The damage usually comes from trying to be different for the sake of it."

## You can't un-hear your own product
**Principle.** Once you know how your product works, that knowledge permanently rewrites your perception — what feels obvious to you is just "tap-tap-tap" to a first-time user. You'll mistake confused users for dumb users.
**Apply when.** You think onboarding is unnecessary because "the product is simple," or a question your support answers weekly seems already-answered on screen.
**The move.** This is the curse of knowledge — you can't switch the music off, so collect feedback from people who've never seen the product, without steering or naming things, and watch behavior. Run it continuously: use support/CX as an insight collector (tabulate each issue by %, impact, insight), Clarity/PostHog for heatmaps and session replays, sampled user interviews, and competitor benchmarking.
**Evidence.** Tapping-vs-listening study: tappers hear the full song in their head; listeners only get the taps. Listeners guessed 3 of 120 songs correctly (2.5%) — far below tappers' expectations.
**In one line.** "You're humming the whole song in your head; your user only hears 'tap, tap, tap.'"

## Set the default — it's the most underrated lever in conversion
**Principle.** The pre-selected option captures the overwhelming majority of choices, because deciding is expensive and the lazy brain takes the easiest path. Smart defaults beat copy persuasion.
**Apply when.** Any choice the user must make — pricing tier, billing cadence, seat count, notifications, checkout — especially before you spend hours rewriting CTAs.
**The move.** Exploit status-quo bias plus cognitive-load reduction. Pre-select the mid-tier you want to sell (the default takes 60–80% of choices); default billing to annual to lift contracted MRR without changing price; start the seat selector at your ICP's typical count (anchoring); run a reverse trial where premium is the default and free is the opt-out, so the user must actively give up what they already have. Three rules: defaults must be ethically defensible (checkbox tricks become churn and complaints), smart defaults beat copy, and a default acknowledges the user won't burn energy deciding what's trivial to you.
**Evidence.** Organ-donor study (Science, 2003): opt-out countries register ~6× more donors than opt-in. Germany (opt-in) ~12% vs Austria (opt-out) ~100% — culture/religion don't explain it; it's a pre-checked box. Applied to products: a direct-to-consumer store raised its average ticket 60% with defaults, and defaults in plan acquisition have lifted LTV up to 4×.
**Visual.** Bar chart of effective organ-donor consent by country: opt-in nations low (Denmark 4.25%, Germany 12%, UK 17.17%, Netherlands 27.5%) vs opt-out nations ~100% (Austria, France, Hungary, Portugal). — `../assets/behavioral-science-toolkit/organ-donor-opt-out-chart.png`
**In one line.** "You can spend the rest of your life optimizing copy, or you can change 5 defaults over the weekend."

## Context you can detect is context you can price — the low-battery phone is not a conspiracy
**Principle.** Products can read the user's situation and adjust what they show or charge, and the situation is often a better predictor of willingness than any stated preference. A phone at low battery signals urgency and reduced ability to shop around; Uber pioneered acting on exactly that kind of signal.
**Apply when.** Someone dismisses situational pricing or situational nudging as conspiracy theory, or your product holds context signals it never uses.
**The move.** Treat it as a real and staffed discipline rather than folklore: the comparison people pass around is the same ride quoted on an iPhone with low battery and on an Android, Uber has a literal behavioural-science and nudging team working on this, and there are more variables in play than the battery alone. Then decide deliberately which side of the line you are on, because the same capability that lets you help a user in a hurry lets you exploit one. Reading context to reduce effort is service; reading it to raise the price of desperation is the version that ends up in the press.

## Reinforce the decision the user just made
**Principle.** After committing to a choice, people actively seek information that supports it — choice-supportive bias. You can feed that need to make the decision feel right.
**Apply when.** Right after signup, purchase, or any meaningful commitment, when buyer's remorse or doubt could creep in.
**The move.** Use choice-supportive bias deliberately: send a strong welcome email with clear next steps so the new user feels embraced and validated in having chosen you. (Analogy: someone joins an EV-lovers group right after buying the car.)

## Architect for what users fear losing, not just what they gain
**Principle.** Builders obsess over features (gains), but conversion and retention are cemented by what the user fears losing — the pain of abandoning a built-up ecosystem outweighs the pain of paying a subscription.
**Apply when.** Designing trials, retention/renewal flows, and offboarding for any product where users accumulate data, history, or workflows.
**The move.** Exploit loss aversion and sunk cost. Convert with zero risk — let users import real competitor data in shadow mode so they can test without fear. Retain by designing the product to make users build workflows and accumulate history from day 1, so at renewal they weigh the headache of rebuilding from scratch, not the monthly fee. At offboarding, don't add friction — make cancellation easy but the loss tangible (e.g., "You'll instantly lose 41 active automations and 6 months of data").
**Evidence.** Sunk cost is what keeps many users on certain LLMs — fear of losing your memory/history, even when it could be exported with a copy/paste.
**Visual.** Hotel-listing UI using scarcity ("Only 2 rooms left") — illustrative example of a loss-framed cue. — `../assets/behavioral-science-toolkit/hotel-scarcity-rooms-left.jpg`

## Use precise numbers, not round ones, to signal truth
**Principle.** Exact figures read as more credible than rounded ones; round numbers signal marketing while specific numbers signal reality.
**Apply when.** Writing any claim, stat, or social-proof number — landing pages, ads, results, testimonials.
**The move.** Lean on the precise-number effect: say "526 houses," not "over 500." Nothing about the claim changes except the precision, yet trust rises.
**Evidence.** Schindler & Yalch (2006), 199 participants, fictional deodorant: claims of "47%" or "53%" longer-lasting were judged ~10% more accurate than the rounded "50%" claim — only the precision changed.
**Visual.** Real billboard: "LAST YEAR WE SOLD 526 HOMES. YOUR COUSIN SOLD 2. LIST RESPONSIBLY." — the precise number doing the persuasion. — `../assets/behavioral-science-toolkit/precise-number-billboard.jpg`
**In one line.** "'526 houses' inspires confidence; 'over 500 houses' signals marketing."

## Guide the eye — don't give every option equal weight
**Principle.** The brain uses contrast to make fast decisions (Von Restorff effect). When competing options carry identical visual weight, you create mental friction, decision time rises, and conversion falls. Guiding the user isn't manipulation — it's respect for their time.
**Apply when.** You have 3 plans, two equally-weighted buttons, or any "democratic" interface where everything looks the same (a common founder error, and a default of AI-generated UIs).
**The move.** Exploit the Von Restorff effect: make the value-generating option visually dominant and de-emphasize the rest (e.g., a ghost-styled "Cancel" beside a bold, colored primary). If you know your ICP's pains and desires, you have a duty to highlight the highest-value solution. Slow decisions accumulate into a "hard-to-use" perception that becomes churn.
**Visual.** Good/bad confirm dialog: bad = both buttons same green weight; good = a ghost-text "Cancel" beside a solid red "Delete now," so the primary action stands out. — `../assets/behavioral-science-toolkit/destructive-action-button-hierarchy.png`
**In one line.** "If everything grabs attention, NOTHING grabs attention."

## Cut cognitive load — every choice you remove can lift conversion
**Principle.** Each extra field, choice, or block of complex text spends the user's mental energy and triggers analysis paralysis. Your product can be complex; your interface doesn't have to be.
**Apply when.** Checkout, signup, and subscription screens — anywhere the user must decide or input under doubt.
**The move.** Strip the interface to the essential decision; when options can't be cut, break the flow into smaller steps (e.g., a 4-step checkout). Remember the failure is invisible: users don't complain or open tickets — they close the tab as "silent churn" and your CAC is wasted. Then dogfood your own onboarding as if you were a stranger.
**Evidence.** In one checkout, removing a single field raised conversion 10%. Reworked subscription screens have lifted LTV 200% just by simplifying the decision.
**Visual.** Mobile checkout labeled "Analysis paralysis": payment options split into smaller stages — advice to break choices into ~4 steps. — `../assets/behavioral-science-toolkit/analysis-paralysis-staged-payment.png`
**In one line.** "They don't file a support ticket. They just close the tab — and your CAC goes in the trash."

## Narrative bias: a ready-made story beats the logic that contradicts it
**Principle.** The brain is addicted to finding patterns in scattered data and will connect points that do not exist in order to build a causal line. A company that hands over a finished story hijacks that process, because story produces familiarity, familiarity produces trust, and trust adds perceived value. For founders this is competitive advantage, not fluffy marketing.
**Apply when.** Writing a pitch, a landing page or an origin section, and treating narrative as decoration on top of the real argument.
**The move.** Fill four slots: **Character** (usually your customer, not you), **Desire** (what they want badly), **Obstacle** (the problem your product removes), **Transformation** (who they become after winning). Keep it true, because storytelling amplifies truth but will not sustain a lie, and in an era of open-source intelligence and radical transparency invented fiction is a standing liability. The modern application is building in public: documenting the development turns the work itself into the hero's journey and generates the **mere exposure effect**, where the audience grows familiar with the bugs and the wins, and a familiar brand gets preference at decision time. Even against a logically similar competitor, proximity creates the impression of superiority. You do not need to invent a fable — the day-to-day of the company, your view of the world and the bugs you resolve already are the narrative.
**Evidence.** Do Bem built the story of the farms, the owners and the supply chain into the packaging in an anti-corporate tone that read like a friend talking, created real connection, and was sold to Coca-Cola. Diletto invented an Italian grandfather and Alpine snow; the product was good but the story was false, the public found the holes, CONAR intervened for false advertising and the brand had to change everything. The four slots are the practical cut; the deeper theory is the hero's journey (*The Hero with a Thousand Faces*).
**In one line.** "Stories stick. Data runs off."
