# Onboarding & Activation

> Each entry is a reusable principle: the trigger that calls it, the concrete move, and the evidence when there is any.

<!-- quick-index: gerado por indexar.mjs, nao editar -->

### Quick index (37)

- Fix a weak trial in order: three KPIs, real activation, the payer-only event, and price last
- Value is a staircase whose first step is before signup: put the H1 next to the first screen
- Count the clicks to first value, and how many of them serve you instead of the user
- Shortening the trial speeds up the decision, not the understanding
- The salesperson is the onboarding you haven't designed yet
- Hope is not a design — set the expectation, disclose progressively, and time the TTV
- When the traffic is not your ICP, the onboarding you never built becomes the churn you cannot explain
- Map the whole journey to value — then fix the biggest drop, not the first step
- An onboarding video welcomes — it doesn't teach
- Rising MRR with rising churn means you lost them on day one
- Measure activation, not signups
- Put friction in the right place, not zero friction everywhere
- Never ship a blank dashboard
- Design onboarding as a behavioral trigger, not a feature tour
- Map the journey from session replays, not from your diagram
- Add declarative friction, cut administrative friction
- Trial conversion is a journey problem, not a pricing problem
- Make onboarding active, not passive
- Treat sub-30-day churn as an onboarding fix, not a feature gap
- Deliver the promised result before teaching mechanics
- Qualify by behavior, not by a long signup form
- Celebrate the activation moment, don't just confirm it
- Cut time-to-value by reorder and removal, not feature changes
- Give the trial an active goal, not passive access
- Calibrate the first step to the user's real willingness
- Treat onboarding as the bridge between CAC and LTV
- Pick onboarding patterns by awareness × flow complexity
- Welcome modal — cheapest pattern to ship, easiest one to ignore
- Product tour: dim the screen to force focus, and pay the upkeep it demands
- Contextual tooltips are passive education — the trigger is the whole design problem
- The empty state is onboarding, not a UI state — and it has no tradeoff
- Personalization buys relevance now and CRM data later, but it taxes signup
- Checklists run on the Zeigarnik effect, so every item must move toward value
- Goal-setting signs an emotional contract, and a broken goal breaks it
- Sample data sells the filled-in product before the user has filled in anything
- Show use cases when the product is expensive to run and its output is infinite
- One action per screen, even at the cost of many more screens

<!-- /quick-index -->
## Fix a weak trial in order: three KPIs, real activation, the payer-only event, and price last
**Principle.** A trial that converts poorly usually has the same defect: it was designed to show everything the product does, while the user only wants to solve ONE problem before paying. The repair has an order, and almost everyone starts at the end of it, with price.
**Apply when.** Trial-to-paid is low and the first instinct is to change price or trial length.
**The move.** Six steps, in this order (steps 2 and 3 matter most):
1. **Read three KPIs together:** trial-to-paid, D30 churn, and the share hitting the activation goal. High conversion with high month-1 churn usually means users paying to buy more testing time.
2. **Check the activation is real.** If more people hit the activation goal than pay, the "first value" is measuring a step, not the value. In a repair-shop SaaS, registering the workshop and the customer is effort; the value is creating the service order and sending it to the customer.
3. **Find the right event in the people who already pay:** take who subscribed in the last 90 days and who abandoned the trial, and isolate the action only payers took.
4. **Pick the trial format by the time to that event.** Minutes: a short no-card trial can work. Weeks: a time-boxed trial cuts the sale in half; usage limits or freemium hold better.
5. **Clean everything between signup and the event:** count the steps, ask whether each one brings the user closer to value, and move or remove the rest.
6. **Charge for what delivers value.** If the user earns per transaction, charging per seat creates friction nobody feels in the trial and everyone feels at renewal.
**In one line.** "Almost everyone starts at the end, changing the price; the steps that matter most are 2 and 3."

## Value is a staircase whose first step is before signup: put the H1 next to the first screen
**Principle.** "Aha moment" suggests one magic instant, but first value is a staircase. Step 1 happens before signup, when the visitor reads the hero and understands how it solves their problem. Step 2 is the first use that works (the first value you actually measure for TTV). Step 3 is coming back unprompted, or bringing the team. Get step 1 wrong and the product receives people who signed up without knowing what for; onboarding gets blamed, gains tooltips and a tour, and activation does not move, because the problem came in through the door.
**Apply when.** Activation is flat despite onboarding work, or churn spikes right after first value (D7) while marketing says the LP "hit its conversion".
**The move.** Lay your LP's H1 and the first screen after signup side by side: if the promise of one does not appear on the other, the user arrives looking for something that is not there. The common pattern is marketing promising speed, sales selling ease, and the product delivering configuration; aligning the promise usually costs far less than rebuilding the product. The symptom shows up in D7 activation or in churn right after first value: value was delivered, just not the value the user ordered.
**Evidence.** An image-editing tool promised a full video flow from storyboard and did not deliver it: it converted, but churned. A correct promise on the LP lowered conversion and raised LTV.
**In one line.** "It's like ordering a pepperoni pizza, waiting 50 minutes and getting cheese. You may even eat it, but you'll probably never order there again."

## Count the clicks to first value, and how many of them serve you instead of the user
**Principle.** TTV can be measured in clicks, not only in days. You need the minimum about the user to deliver value, not what it would take to finance a new car in their name: most signup fields exist to enrich a CRM nobody opens.
**Apply when.** Designing or auditing the path from signup to first value, especially the signup form and requests for device access (photos, notifications).
**The move.** Count the clicks between signup and first value, then mark which of them serve the user and which serve you. The second group is (probably) wasted TTV. Move every non-essential step to the moment it makes sense in context: ask for photo access when the user uploads a photo, not during onboarding. Treat "3 clicks or less" as a direction, not a law; the point is knowing the minimum.
**Evidence.** Submagic's team worked to the goal of delivering value in 3 clicks or less, as its founder described in a product-led-growth interview; the product went from 0 to US$1M ARR in 3 months.
**In one line.** "TTV should be measured in clicks, not days."

## Shortening the trial speeds up the decision, not the understanding
**Principle.** Urgency works on a user who has already seen value and is stalling; it does nothing for one who has not reached value yet. Cutting the trial "to create urgency" before the median user reaches first value only brings forward the day they find out they could not use the product.
**Apply when.** The team proposes a shorter trial to force decisions, or the trial length was copied from the 14-day default.
**The move.** Put the median days-to-first-value on the table before touching the length. In a client case the trial was 14 days, fewer than half the users had reached first value by day 7 and the median TTV was 9 days, so a 7-day trial would have cut most of them off before value. Then size the trial with two numbers: how long the user takes to perform the activity that solves the pain that brought them (value, not a complete profile or an imported spreadsheet), and how often they repeat it (income tax once a year vs. qualifying leads ten times a day). Short TTV with high frequency fits in 3 days; with a long TTV, 14 days is not enough. Don't benchmark your TTV against other models: Spotify's is minutes, a CRM's is hours or days.
**Evidence.** ChartMogul report: 62% of SaaS use exactly 14 days, median trial conversion is 8%, and conversion happens in the first week with a peak near day 7. A randomized experiment with 680,000 users found that shortening or lengthening the trial barely moves conversion: whoever converts, converts because they felt the value.
**In one line.** "A tight deadline can speed up the decision; it never speeds up understanding the product."

## The salesperson is the onboarding you haven't designed yet
**Principle.** When the demo converts and the self-serve login does not, the problem may be worse than onboarding: the demo was masking the product's complexity. The salesperson walks the customer to exactly what they need to see, explains each detail and answers every doubt, and then does not come in with the login.
**Apply when.** Demos close well but conversion collapses once the customer gets their own access, or you are moving a sales-led product toward self-serve.
**The move.** Diagnose it in about an hour: record a demo and note every time the salesperson explained, pointed at, or clicked for the customer. Each item on that list is a place where the product, alone, loses people. It looks like an onboarding problem, but the list shows where the product itself has to do what the salesperson was doing.
**Evidence.** The gap between conversion with a demo and self-serve conversion is the size of exactly that list.
**In one line.** "The salesperson is the onboarding you haven't designed, and he doesn't log in with the customer."

## Hope is not a design — set the expectation, disclose progressively, and time the TTV
**Principle.** The user signs up, clicks start trial, and lands on an empty dashboard. Nothing directs attention to the task that creates value; nothing reduces the noise of what makes no sense on a first visit and may still make none next week. With a salesperson in the middle a human patches the hole and you can live with that lazy design — on a self-serve trial, B2B or B2C, the churn is guaranteed. Calling it what it is helps: this is **hope design**, spending CAC and leaving the user to find their own way by luck.
**Apply when.** A self-serve trial converts poorly and the post-signup screen assumes the user already knows the product.
**The move.** Three things, in order. **(1) Set the expectation** — make the product's core and the first session explicit, through a welcome modal video, a wizard or a directing checklist depending on complexity. The video does not need to be a 50-minute course: welcome, show you are present, and point at ONE delivery of value. **(2) Cut the noise** with progressive disclosure, revealing features as the need and the learning arrive. It sounds fancy and every video game does it — first you learn to walk and attack, then you are chaining combos — and opening features as the user learns even creates the good feeling that there is more to explore, instead of everything at once. **(3) Measure your TTV**: there is an invisible stopwatch between signup and the first main task, and the longer it runs the lower the chance of converting and the higher the chance of churn.
**Evidence.** 9 of 10 dev-bubble products tested landed the user on an empty dashboard. The reason nobody sees it is obvious once stated: **whoever built the product has never entered the empty dashboard** — they know where everything is and are usually working with mocked data.
**In one line.** "Or should I call it hope design?"

## When the traffic is not your ICP, the onboarding you never built becomes the churn you cannot explain
**Principle.** A product modelled on a foreign competitor inherits that competitor's assumptions about who arrives. If your market sends a different audience through the door, the onboarding gap that never mattered abroad becomes the whole problem at home.
**Apply when.** A campaign pushes a large volume of new users at once, especially a bonus placement, and churn spikes without an obvious product defect.
**The move.** Check the ICP the product assumes against the ICP that actually walked in. In one case a tool that builds landing pages, copy, creative and checkout — a product for people who already sell — was given away as a bonus on the thank-you page of an infoproduct, sending **30,000 people in, most of whom had never sold anything in their lives.** The result was **32% churn** while the founder held that the UX was "good enough". Five minutes inside showed no onboarding, no empty state guiding use, no contrast on the tasks that create value, and **more than 20 possible decisions on the post-signup screen**. The original it was modelled on served a hardened audience in another market. Modelling a competitor is fine — copy the 80/20 that sells in your market, not the whole product.
**In one line.** "ICP of the product: marketing experts. Reality that walked in: people who had never sold anything."

## Map the whole journey to value — then fix the biggest drop, not the first step
**Principle.** Founders rush to the top of the funnel when activation falls, but the leak is usually in the middle — the step where effort is already high and the user hasn't seen proof it's worth it. Method: (1) Define what "value" is (the first moment the user gets the promised result — measurable, visible in data). (2) List every step between signup and that value (every screen, click, wait, field — always more than you remember). (3) Measure drop per step; find the steepest fall. (4) Fix the biggest drop first — that's where the money is. (5) Diagnose why: friction (cut), confusion (direct attention), ordering (deliver value before asking effort).
**Apply when.** Activation is low and you're not sure where the leak is.
**The move.** Count the steps before first value — each is a chance to quit. High activation lives in the shortest path to first result, not the most complete product before it. Almost every founder has this map in their head and never on paper; the head version always looks shorter.

## An onboarding video welcomes — it doesn't teach
**Principle.** A good onboarding video isn't a manual (nobody reads their car's or iPhone's). It welcomes, builds connection, shows the product at a glance, and points to where value comes fastest.
**Apply when.** Designing first-run onboarding or a welcome video.
**The move.** Aim it at cutting TTV, support tickets, and the lost feeling — not at educating. Length follows your ICP's urgency (someone rushing vs. someone happy to build Lego). No actor or fancy set — one founder recorded theirs in Screen Studio and it beat many big products' videos.
**Visual.** A "Your account was created!" welcome modal with an embedded intro-video thumbnail and a single "Next" CTA — `../assets/onboarding-and-activation/account-created-welcome-video-modal.jpg`
**In one line.** "Your product doesn't need a manual either — have you read your car's?"

## Rising MRR with rising churn means you lost them on day one
**Principle.** When MRR and churn climb together, the user didn't leave in month 2 — they were lost the first day, dropped into a dead empty-state dashboard with nothing guiding them to value.
**Apply when.** Churn is creeping up and you're tempted to blame the product or add features.
**The move.** It isn't a feature gap — measure **TTV** (time-to-value) and get obsessed with shrinking it. CAC, LTV and activation are *product* metrics, not marketing; with weak retention, acquiring more just fills a leaky bucket faster.
**In one line.** "It took two months to cancel, but you lost him the first day after signup."

## Measure activation, not signups
**Principle.** Technical founders track the wrong onboarding metrics; signups, session time, and tour completion all flatter you without proving the user reached value.
**Apply when.** You're judging onboarding by signups, time-in-product, or "completed the tour."
**The move.** Swap each vanity metric for its real counterpart: signups → activation rate, session time → time-to-first-useful-action (and its repetition), onboarding completion → D7 retention. Find your aha moment empirically: look at what every paying customer did in week one that churned users didn't (often a collaborative act — invite, share, comment). Anchor on TTV/time-to-value.
**Evidence.** Userpilot benchmark (547 companies): avg TTV 1d 12h 23m; top performers under 5 min. SaaS activation rate avg 30–37%, top quartile 40%+, under 20% = structural problem. D7 retention avg 10–15%, over 30% is strong.
**In one line.** "If you can't say how long your user takes from signup to aha moment, you're not measuring what matters."

## Put friction in the right place, not zero friction everywhere
**Principle.** Friction in the wrong place kills the product; friction in the right place qualifies and retains. "Less friction" is not a universal law.
**Apply when.** You're reflexively cutting clicks and fields, or your human sales team is doing qualification the product should do.
**The move.** Remove friction at trial signup (it kills acquisition), but add calibrated friction in three spots: (1) trial with card upfront filters commercial intent; (2) mandatory onboarding before the dashboard turns users into power-users faster; (3) a 6–8 field enterprise demo form (role, team size, current tool, budget, timeline) lowers lead volume but raises close rate. The mechanism is effort justification (Aronson & Mills, 1959) — same root as the endowment and IKEA effects.
**Evidence.** ChartMogul 2026: opt-in trial (no card) converts 8.9%; opt-out (with card) converts 31.4%. Superhuman requires a 30-min human call before access.
**In one line.** "How much qualification effort is your human seller doing that the product should do before they even step in?"

## Never ship a blank dashboard
**Principle.** The empty dashboard arrives at the user's peak of curiosity and answers it with a void — this is where most SaaS loses the trial. Every second spent deciding what to do is a second closer to quitting.
**Apply when.** A new user lands post-signup on a screen with no data and no direction.
**The move.** Four fixes: (1) empty state with a next-action hint — the CTA points straight to value; (2) seed sample data so they see the destination before starting; (3) one single clear action ("Import your first spreadsheet"), not eight, not a 12-step tour; (4) visible progress from the first click — start the bar at 20%, not 0%, so completion feels already underway.
**In one line.** "A blank dashboard looks neutral, even tidy — but it just makes the user stop and think about what to do."

## Design onboarding as a behavioral trigger, not a feature tour
**Principle.** Silent non-activation — users who sign up, vanish in five minutes, and never formally churn — is an activation problem, not a product one. Onboarding should fire a behavior, not narrate features.
**Apply when.** New users evaporate without complaint and you never learn their name.
**The move.** Find the single behavior that statistically separates retained from lost users, make it your activation north star, and measure every onboarding decision against it. Shift focus from explaining features to forcing that behavior fast. Exploit the Zeigarnik effect: open small loops (complete profile, invite 3 colleagues, send first message) so the user carries an unfinished task.
**Evidence.** Slack: teams exchanging 2,000 messages had 93% probability of staying. Facebook's equivalent: 7 friends in 10 days — the company's single focus, repeated at every all-hands.
**In one line.** "What's the number that separates who stays from who evaporates — and how does the user hit it in under 24h?"

## Map the journey from session replays, not from your diagram
**Principle.** The founder's 12-step journey is built top-down (what the product wants); the user runs 4 steps bottom-up (the specific problem they opened the tab to solve). The gap between them is where avoidable early-stage churn lives — and it's invisible because the founder only ever lived the creator's journey.
**Apply when.** You "know" the happy path but can't state what % of users actually execute it.
**The move.** Three steps, no Figma: (1) write your version of the user journey in numbered steps, on paper; (2) open five real session recordings from the first 7 days and note what each user actually does, in order, with timing — including what they try and abandon; (3) lay both lists side by side. The report is in the differences; each divergence is a hypothesis to confirm or kill.
**In one line.** "The user journey is what shows up in the replay; what's in Figma and Excalidraw is a hypothesis."

## Add declarative friction, cut administrative friction
**Principle.** "Good onboarding is short onboarding" is incomplete. There are two frictions: administrative (collects data the system uses later, buys the user nothing) and declarative (forces the user to state what they came to do — costs a beat, buys commitment, customization, and journey direction).
**Apply when.** Auditing onboarding steps; deciding what to cut versus expand.
**The move.** Test each step: is it collecting data or making the user declare intent? Collecting only → candidate to cut. Declaring intent → candidate to expand. A declaration ("what do you sell, what's your long-term goal?") creates a micro-commitment to the outcome before the user touches the product, and lets the journey branch (recommendations, tutorials, next actions) off that answer.
**Evidence.** Brazilian payments platform cut time-from-signup-to-first-sale from 24.2 to 2.5 days by adding a ~30-second intent step (positioned between signup and product), not by removing steps.
**In one line.** "Onboarding is also the first chance the user has to declare to themselves what they came to do."

## Trial conversion is a journey problem, not a pricing problem
**Principle.** A trial is a test of value; if the user never proves value to themselves, no price or trial length saves it. Conversion fails for three diagnosable reasons.
**Apply when.** Users sign up, do "a bunch of nothing," and never return.
**The move.** Diagnose which failure mode applies: (1) blank dashboard → make the first step obvious and immediate, drive to value or a micro-win, drop "explore our product"; (2) lost before value → install Clarity, watch where they stall, optimize that click; (3) lost to life → send a progress email ("you created 3 reports, your team accessed 12 times, you're in the top 20%"), not a generic "trial ending."
**In one line.** "The longest trial in the world doesn't save bad onboarding."

## Make onboarding active, not passive
**Principle.** Passive onboarding (tooltips, guided tour, docs — learn if you want) assumes the user will explore. They won't: they have 47 tabs open, WhatsApp pinging, and will do the bare minimum before deciding whether to return. Active onboarding designs a sequence where each action delivers value and that value triggers the next.
**Apply when.** Your onboarding opens with "Welcome, here's the documentation."
**The move.** Assume you know the shortest path to value better than the user does. Design that path, strip the friction, and make sure they arrive. Don't ask "what's the minimum the user must do?" — ask "what's the smallest action that delivers the most value in the least time?"
**Evidence.** Slack drops you into a channel and makes you send a message first — you use the product before any tutorial.
**In one line.** "Understanding by doing beats understanding by reading."

## Treat sub-30-day churn as an onboarding fix, not a feature gap
**Principle.** Most early-stage SaaS churn happens in the first 30 days — which means it's onboarding, not product. Adding features only makes it worse by adding complexity.
**Apply when.** Users leave before they ever liked what you built, and you're tempted to ship more features.
**The move.** Diagnose with three questions: (1) how long to the first real result? If "it depends" or over a day, you're bleeding users; (2) does the user know where they are? Use a progress bar/checklist — Progress effect: someone seeing 30% done is likelier to finish than someone at 0%, so starting at 0% is a design error; (3) what happens when they drop mid-flow — email, push, nothing? Use the Zeigarnik effect to remind them they started.
**In one line.** "Sub-30-day churn rarely dies to features; it dies to the right sequence of micro-interactions that deliver value before asking for effort."

## Deliver the promised result before teaching mechanics
**Principle.** Nobody wants to learn to use your product; they want the result you promised in the landing-page hero. Teaching mechanics first ("create a project → add a member → configure integrations") is boring; delivering value first converts.
**Apply when.** Your onboarding is a checklist of setup mechanics rather than a path to the outcome.
**The move.** Lead with the outcome ("In 2 minutes you'll see your first report → let's start with the data you already have → done, that's the insight competitors pay consultants for"). Reframe progress with the Progress effect by crediting effort already spent ("You've done the hard part, just 3 steps left"). Keep loops small (Zeigarnik effect — people close loops only if they look closable). Pre-select the right plan from data you collected instead of asking, then offer the upsell.
**In one line.** "The gap between 5% and 15% trial conversion is in these details — not features, not price — in the sequence of micro-decisions you designed without realizing you were designing."

## Qualify by behavior, not by a long signup form
**Principle.** Friction at the wrong moment kills conversion, and qualification by behavior is more precise than qualification by form. The "more qualified leads" argument for long forms usually loses.
**Apply when.** You're weighing an 8-field signup form against email + password.
**The move.** Default to the minimal form and let qualification happen later, inside the product, from real behavior. Deciding where to add versus remove friction is what separates a product that grows from one that spins its wheels — but it's contextual ("it depends").
**Evidence.** Same product, two founders: 8-field form (name, email, company, role, phone, segment, team size, how-did-you-hear) → 12% signup rate; email + password only → 34%.
**Visual.** Annotated onboarding step of a developer tool: an ICP/intent question flagged "Zeigarnik effect" (the step progress dots) and a B2C/B2B card selector flagged "Default effect" (the B2C card is pre-badged "Mais comum") — showing where each bias is engineered into the flow. — `../assets/onboarding-and-activation/dev-tool-onboarding-bias-annotations.jpg`

## Celebrate the activation moment, don't just confirm it
**Principle.** At the emotional peak of activation, a number is data but a rising graph is progress — and progress triggers dopamine and an emotional memory tied to the product. Most SaaS confirms where it should celebrate.
**Apply when.** A user completes a hard-won first action (first transaction, first integration) and you respond with a static success state.
**The move.** Engineer the peak moment precisely at the point of highest emotional vulnerability in activation — right after the user clears the effort. Show motion and accomplishment proportional to the effort invested. This is the peak-end rule: users judge an experience by its emotional peak and its ending, rarely by the average.
**Evidence.** Stripe shows a rising graph (not a number) the moment the first transaction processes — the founder who integrated it at 3am remembers exactly where they were.
**In one line.** "A number would have done the job. The graph created a customer."

## Cut time-to-value by reorder and removal, not feature changes
**Principle.** High TTV is almost never product complexity — it's the form and order in which things happen. Each day between signup and first result is another day of abandonment risk; abandonment = churn.
**Apply when.** Your activation flow is slow and you assume the product itself is the bottleneck.
**The move.** Three iteration cycles, no product changes: (1) reduce cognitive load by grouping and standardizing what the user must fill in; (2) work with legal/compliance to strip everything required by habit but not by actual necessity; (3) invert the sequence so the user feels value before facing the heaviest step.
**Evidence.** Major Brazilian payments platform: 24 days → 2.5 days to first sale (89.7% reduction), no product changes, no cutting of mandatory compliance steps.
**Visual.** Month-by-month TTV table: Jan 24.2d → Feb 19.6d → Mar 16.8d → Apr 9.3d → May 2.5d, alongside accounts created / approved / new sellers per month. — `../assets/onboarding-and-activation/monthly-time-to-first-sale-message.png`

## Give the trial an active goal, not passive access
**Principle.** A passive trial ("use it if you want, cancel guilt-free") builds no commitment; a trial with an active goal builds commitment before billing. Each completed day raises the psychological cost of canceling — the user starts defending a decision they already made, before paying.
**Apply when.** Your trial is open-ended access with no challenge or target.
**The move.** Set a recurring daily goal during the trial that the user opts into and completes. The named mechanism is progressive commitment. The product can be good or bad — done right, the onboarding itself is excellent.
**Evidence.** Wispr Flow challenges trial users to dictate 100+ words a day for 7 days — looks generous, is behavioral science.

## Calibrate the first step to the user's real willingness
**Principle.** Users don't rationally evaluate the first task — they evaluate perceived effort. Ask too much up front and the cognitive cost of even imagining the task is paralyzing, and they quit before starting. This is the activation-barrier effect.
**Apply when.** Your first onboarding step bundles setup, data import, team invites, and project creation — or demands a campaign-sized action.
**The move.** Two biases fix it: (1) started-progress effect — show what the user has already done before what's left; a loyalty card with the first stamp pre-filled beats a blank 9-stamp card, because the starting point changes perceived distance to the finish; (2) small-steps effect — "Create one story today" has radically lower perceived cost than "post 5×/week," even when the underlying task is identical. Sequence effort so the user hits first value before noticing how much they invested; build momentum.
**Evidence.** Instagram A/B test made "Create 5 new public reels" the first task — for someone who barely posts weekly, that's paralyzing.
**Visual.** Bad first-step example: a weekly-progress checklist at "0% completed" whose top item is "Create 5 new public reels (0/5)." — `../assets/onboarding-and-activation/instagram-five-reels-first-task.jpg`
**In one line.** "Asking for more isn't necessarily the problem; asking for all of it at once, with no progress anchor and no commitment ladder, is."

## Treat onboarding as the bridge between CAC and LTV
**Principle.** Founders obsess over CAC and landing-page conversion but are blind to activation cost. Onboarding isn't an interface tutorial — it's the bridge from CAC to LTV and the point of maximum leverage to expand revenue. Cancellation happens on day one; it's merely formalized when Stripe's billing reminder lands.
**Apply when.** Users enter the trial without intent to a result and ghost before ever paying.
**The move.** Two fixes: (1) turn support into UX — every onboarding support ticket is a design failure; map recurring setup questions and convert the answers into features or in-flow tooltips; (2) compress TTV obsessively — make the user experience the product's core promise in the least time possible. If they must configure 5 screens before any result, you've already lost.
**In one line.** "Letting a user into the trial without intent of a result isn't self-service. Design's job doesn't end at signup — that's where it starts paying you back."

## Pick onboarding patterns by awareness × flow complexity
**Principle.** There's no best onboarding in the abstract — only the one that removes friction and delivers value early for your users. Treat the nine patterns as behavior-shaping mechanisms, not UI components, and select by two axes.
**Apply when.** Choosing or combining onboarding patterns for a new flow (SaaS, PLG, B2B early stage).
**The move.** The nine patterns (pattern → ideal use / tradeoff): **1. Welcome modal** → high-awareness ICP or low-complexity products; easy to build, easy to ignore. **2. Wizard / product tour** → B2B and complex/high-cost-of-error flows (fintech, compliance); long tours cause boredom and need constant upkeep. **3. Contextual tooltips** → advanced/secondary features; slashes support tickets but users may miss them if contrast is poor. **4. Empty state** (the strongest of the nine) → dashboards, lists, data-dependent areas; if executed well it's mandatory, directs the first action and accelerates TTV. **5. Personalization** → products serving many ICPs with different journeys; great CRM data, but too long kills signup conversion. **6. Checklists** → critical flows with mandatory prerequisites (webhook, KYC); exploits the Zeigarnik effect, but a long list breeds aversion — every item must move toward value, no bureaucratic tasks. **7. Goal-setting** → habit products (finance, productivity, health); uses commitment bias, but a broken goal can break the emotional contract. **8. Sample data** → sell the dream of a full, organized product before the user inputs anything (distinct from skeleton screens). **9. Use cases / demos** → products burning expensive resources (AI tokens) with infinite outputs; show max potential without forcing creativity from scratch.
Selection rule — two axes: **awareness level** (low = needs guidance; high = needs speed) × **flow complexity** (high = needs structure). Four cases: low-awareness + high-complexity → tours + checklists + personalization; low + low → modal + empty state; high + high → checklist + tooltip + empty state; high + low → modal + empty state (then get out of the user's way). Build vs. buy is financial/operational, not aesthetic — buy (Wistia, PostHog, Sprig) when speed is critical, dev is overloaded, or you're running A/B tests; build when onboarding is strategic, you need perfect aesthetic integration, or you must avoid third-party dependence.
**In one line.** "Onboarding's job isn't to teach the user — nobody likes an instruction manual — it's to remove cognitive effort and deliver utility as fast as possible. TTV correlates directly with churn."

## Welcome modal — cheapest pattern to ship, easiest one to ignore
**Principle.** A welcome modal is a short video or carousel that states the product's core value the moment the user arrives. It earns its place only when your base already has high problem-awareness and you need to introduce the tool, not educate the market. Treat it as a behavior-shaping mechanism, not a UI component.
**Apply when.** First run of a low-complexity product, or an ICP that showed up already knowing which problem they came to solve.
**The move.** Say the core value once and get out. Accept the tradeoff instead of fighting it: it is cheap to build and easy to dismiss, so never let it be the only thing standing between signup and value. Land the user on an empty state that directs the first action, so closing the modal is not the same as facing a blank product.
**Visual.** A repair-shop SaaS's welcome modal over a dimmed dashboard: a green "Account created successfully" tick, "Congratulations Lucas! 🎉", one line of value promise, an embedded founder video (the face blurred) with its own progress bar, a hint inviting the user to take advantage of tutorials like this to get the most out of the product, carousel dots and a Next button — video and carousel in the same screen — `../assets/onboarding-and-activation/repair-shop-welcome-modal-video.jpg`
**In one line.** "Easy to implement, easy to ignore."

## Product tour: dim the screen to force focus, and pay the upkeep it demands
**Principle.** A wizard or product tour walks the user through the interface step by step, borrowing game mechanics — dimming the rest of the screen to force focus, progress bars to give a sense of completion. Modern variants use pulsing hotspots that fire a tooltip only on interaction, which keeps the product's own logic intact instead of overriding it.
**Apply when.** B2B, PLG at early stage, and any flow where a mistake is expensive — fintech, compliance — or an umbrella product bundling many tools under one roof.
**The move.** Keep it short: a long tour breeds boredom and abandonment. Budget for maintenance from day one, because the tour drifts out of sync every time the product changes, and a tour pointing at a button that moved is worse than no tour at all. Prefer hotspot-on-interaction over a forced linear sequence whenever the user can plausibly find their own way.
**Visual.** A repair-shop SaaS's tour: the whole board of work orders dimmed to near-black, a single sidebar item lit in orange, and a coachmark reading "Home — Here is where you will find a summary of your workshop!" with "Skip Tutorial" beside "Next". The dimming is the mechanism, not decoration — `../assets/onboarding-and-activation/repair-shop-product-tour-coachmark.jpg`
**In one line.** "If it's long it breeds boredom and abandonment. It demands constant upkeep as the product evolves."

## Contextual tooltips are passive education — the trigger is the whole design problem
**Principle.** Contextual tooltips deliver small, localized explanations without interrupting the workflow. They are one of the oldest and most underrated onboarding patterns: education that costs the user nothing until they ask for it, and that cuts support tickets sharply.
**Apply when.** Advanced or secondary features that do not deserve space in the primary onboarding, but that generate support load when misunderstood.
**The move.** The trigger is where this pattern lives or dies. The user has to hover or click to reveal, so the affordance needs colour or subtle animation to be noticed — while still not breaking the information hierarchy of the screen. Get the contrast wrong and users simply never discover it, which is this pattern's only real failure mode. Put a deeper path inside the tooltip for the minority who want more.
**Visual.** A repair-shop SaaS's "Smart Alerts" card with a small "?" beside the label and the cursor resting on it, revealing a panel that explains the feature, shows a live example (a named customer's car is close to needing an oil change — "what do you think about sending a message for the client to schedule an appointment?") and offers a "Watch tutorial 01:30" button — reveal-on-hover with an escape hatch to depth — `../assets/onboarding-and-activation/repair-shop-contextual-tooltip.jpg`
**In one line.** "Users may never notice it if the contrast is bad."

## The empty state is onboarding, not a UI state — and it has no tradeoff
**Principle.** Technically an empty state is just an interface state; functionally it is pure onboarding. It is the natural condition of a user who has arrived and done nothing yet, which makes it the highest-leverage screen in the product — and the one most often shipped as a blank page.
**Apply when.** Dashboards, lists, and any area whose value depends on data the user has not entered yet.
**The move.** A bad empty state is a white screen that produces a dead end. A good one captures attention and points at the single first action that will fill the void. Executed well this pattern has no downside — it is mandatory, not optional — and it moves TTV directly, which is the metric that correlates with churn. Rank the available first actions, put exactly one of them in the primary position, and leave the rest visible but quiet.
**Visual.** A repair-shop SaaS's first-run board: the greeting "Hello, Lucas! 👋 Here is the summary of your workshop today" over four cards — workshop data, mechanics, services, first work order — where only the first carries a live orange "Register now" and the other three are greyed out. The blank board is not apologising for being empty; it is issuing one instruction — `../assets/onboarding-and-activation/repair-shop-first-run-cards.jpg`
**In one line.** "Tradeoff: none — done well, it's mandatory."

## Personalization buys relevance now and CRM data later, but it taxes signup
**Principle.** Personalization collects information from the user in order to hand back a more relevant experience, and enriches your database on the same pass. Asking someone's role or objective lets the product solve their specific pain and drop the noise, while giving you a segment you did not have.
**Apply when.** A product serving a wide spread of ICPs whose journeys genuinely diverge — where one generic first-run would be wrong for most of them.
**The move.** Use card selectors, tags, or progressive forms rather than a wall of fields. Keep it short: every extra question is signup conversion you are spending, and a long personalization step kills the very registration it was meant to improve. Ask only what changes the next screen — if an answer does not alter what the user sees next, it is a survey, not onboarding, and belongs somewhere else.
**Visual.** A repair-shop SaaS asking "Qual a especialidade de sua oficina?" as a six-card grid with illustrated options (mechanical, bodywork and paint, auto center, performance shop, air conditioning, radiators), one selected in orange, a progress bar at the top, and Continue still disabled until a choice is made — card selection instead of a dropdown — `../assets/onboarding-and-activation/repair-shop-specialty-card-grid.jpg`
**In one line.** "If it's too long, it kills conversion at signup."

## Checklists run on the Zeigarnik effect, so every item must move toward value
**Principle.** A checklist creates focus and manufactures a sense of progress, exploiting the Zeigarnik effect: unfinished tasks generate cognitive discomfort, and that discomfort raises the urgency to complete. The mechanism is the incompleteness itself, not the list.
**Apply when.** B2B flows, critical paths, and products with mandatory prerequisites before value is possible — configuring a webhook, clearing KYC, connecting a data source.
**The move.** Every item has to be an action that moves the user closer to perceiving value. No bureaucratic tasks: an item that serves your database and not their outcome spends the discomfort you generated and returns nothing. Watch the length — a long list flips motivation into aversion, because the discomfort stops reading as "almost there" and starts reading as "this is a lot of work". Show one item as active and the rest as waiting, so the next action is never ambiguous.
**Visual.** A repair-shop SaaS's checklist: a welcome headline with the product's name and "Comece a revolução de sua oficina em 5 etapas", a progress bar roughly a fifth filled, step 1 marked "Concluído" with a green tick, step 2 carrying the only live button ("Cadastrar agora"), and steps 3 to 5 greyed to "Esperando" — one open loop at a time — `../assets/onboarding-and-activation/repair-shop-five-step-checklist.jpg`
**In one line.** "If the list is long it creates aversion instead of motivation."

## Goal-setting signs an emotional contract, and a broken goal breaks it
**Principle.** Goal-setting works through commitment bias: the user states what they want, and the product promises to help them get there. That exchange creates an emotional contract that drives recurring use, because returning is how the user keeps their own commitment rather than yours.
**Apply when.** Products tied to building a new habit — finance, productivity, health — and anywhere value depends on continuous engagement rather than a single transaction.
**The move.** Make the goal the user's, not the product's, and concrete enough to be measured. Then protect it: the same contract that drives retention is the thing that breaks it, because a goal missed early can snap the emotional tie to the product along with it. Pick a first goal the user can plausibly hit, and treat the early miss as a design problem to absorb — soften it, re-scope it — rather than a user failure to report.
**Visual.** A repair-shop SaaS's two goal screens: "Defina sua principal meta" offering four illustrated options (raise revenue, improve customer experience, improve workshop management, get more customers) with the first selected, then "Escolha o valor de faturamento desejado" showing R$10,321 above a slider, framed as "com base em seu valor/h de trabalho, vamos te ajudar a alcançar esse objetivo" — the product joining the user's goal rather than assigning one — `../assets/onboarding-and-activation/repair-shop-goal-selection-screens.jpg`
**In one line.** "If the goal breaks early, the emotional contract with the product can break too."

## Sample data sells the filled-in product before the user has filled in anything
**Principle.** Sample data gives the user a preview of what the product looks like once it holds real data. It is not a skeleton screen — a skeleton reduces loading anxiety, while sample data sells the dream of the organized dashboard or the finished visualization to someone who has not entered a single record.
**Apply when.** Data-dependent products where the honest first-run state is empty and unimpressive, and where the value is only legible once the screen is full.
**The move.** Populate the real layout with plausible sample values rather than mocking up a marketing screenshot, so what the user sees is what they will get. Label it unmistakably as a preview — the pattern trades on aspiration, and it turns into a broken promise the moment a user mistakes sample numbers for their own. Pair the preview with the one action that starts replacing it with real data.
**Visual.** A repair-shop SaaS's "Quadro Geral" rendered in full — revenue, smart alerts, average ticket, a revenue-composition donut, a twelve-month billing chart — every figure faded back, with a centred modal over it: a speedometer illustration, "Seu painel está sendo preparado", "Em breve você verá os dados reais de sua oficina", and a single "Ok, entendi". The dream is shown at full layout fidelity and explicitly labelled as not yet real — `../assets/onboarding-and-activation/repair-shop-empty-state-modal.jpg`

## Show use cases when the product is expensive to run and its output is infinite
**Principle.** A use-case gallery shows the product's maximum potential without forcing the user to be creative from a blank page. It matters most when the product burns expensive resources to operate — AI tokens being the obvious case — and can produce effectively infinite outputs, so a bad first attempt costs real money and teaches the user the wrong thing about the ceiling.
**Apply when.** LLM tools and any product where the interface is an open input, the output space is unbounded, and each attempt carries a real unit cost.
**The move.** Offer a small set of hand-picked starting points that represent distinct jobs rather than variations on one. The blank prompt box is the problem this pattern solves: it hands the burden of imagination to someone who does not yet know what the tool can do, and charges you for their guesses. Keep the free-form input primary and the examples secondary, so the gallery teaches the ceiling without becoming the only path.
**Visual.** A repair-shop SaaS's AI assistant: "Olá, como podemos te ajudar?" above an empty prompt box, and below it "Comece com prompts selecionados" offering three labelled cards from different domains — management ("Melhoras a gestão de pátio de minha oficina"), marketing ("Campanha de WhatsApp para atrair clientes") and finance ("Quando investir em ferramentas para a oficina?") — distinct jobs, not three phrasings of one — `../assets/onboarding-and-activation/repair-shop-ai-assistant-starter-prompts.jpg`
**In one line.** "You show the maximum potential without forcing the user to be creative from scratch."

## One action per screen, even at the cost of many more screens
**Principle.** Design for the mental model the user actually holds, not the elegant one you would prefer they held. When the gap is wide, the fix is usually to reduce each screen to a single action and accept the extra screens as the price.
**Apply when.** Your users are not fluent with digital products, or a beautifully compact flow tests badly with the people who will actually use it.
**The move.** Find the reference product your users already trust and read its mechanics as their expectation. In a bank's payroll-loan product for retirees on their first smartphone, an elderly user asked "do I have to keep swiping the screen down?" while fluently using WhatsApp minutes earlier — where scrolling is automatic and accessibility was already on. **She was not requesting a feature, she was describing how she believed the world should work.** The MVP had been aesthetically impeccable and useless. One action per screen shipped, and it worked — but the certainty of why only arrived after noticing that ten out of ten used WhatsApp and none used Facebook.
**In one line.** "Do I have to keep swiping the screen down?"
