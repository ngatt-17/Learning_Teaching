# Day 1 — Individual research and a joint product plan

**Goal:** Understand the product, learn from existing applications, and agree on a practical build plan.

Read the [product flows and milestones](../../README.md) and [working guide](WORKING_IN_THIS_PROJECT.md). Plan for **all core flows by 24 September**, **pilot testing by 1 October**, and **product launch/showcase to leaders and faculty on 5 October 2026**.

## 1. Schedule

Six focused hours, plus breaks. Finish individual research, then go directly into the joint assignment.

| Activity | Time | Output |
|---|---:|---|
| Read the brief and kickoff | 20 min | Product goals and questions |
| Access and Git setup | 40 min | Personal branch and draft PR |
| Individual research | 120 min | One note per person |
| Joint product planning | 120 min | One agreed team plan |
| Team readout | 20 min | 10-minute presentation and 10-minute discussion |
| Finalize submissions | 40 min | Updated plan, individual notes, owners, and next steps |

Two of us present the joint plan. If the Mentor is unavailable, submit a five-bullet summary and decisions needed for asynchronous review. There is no separate individual presentation or peer-review assignment on Day 1.

## 2. Individual assignment — same brief for all six members

Create `docs/research/day-01/<github-username>.md`. Use short paragraphs and tables; aim for **700–1,000 words plus source links**. Work independently first and bring your recommendations to the team session.

### 2.1. Product understanding

- Describe the instructor, student, and CECS admin journeys.
- Explain how private student notes differ from course materials, submitted feedback, and dashboard data.
- Suggest two measurable signs of pilot success and one assumption to check with users.

### 2.2. Three university examples

Research **three current AI learning applications at leading universities**. Use university pages or original research papers.

| Application and source | Users and learning problem | Key features | Evidence and limitations | What CECS could adopt |
|---|---|---|---|---|

Start with [PyTutor from MIT, GSU, and QCC](https://raise.mit.edu/research/research-projects/pytutor/) if useful. Its tutor uses course materials, current student work, and earlier interactions as context. Investigate what that approach could teach us without copying features into the pilot automatically.

For each example, distinguish an announcement, deployed service, and evaluated learning outcome. Include source dates where available and your access date. State when impact evidence is missing.

### 2.3. Proposed CECS product and stack ideas

- Sketch the three user flows, including course-grounded answers, private notes, reviewed practice, and course insights.
- Recommend the simplest useful pilot version. Put extra product ideas in a short “later” list.
- Suggest initial technologies for the interface, backend/data, and AI/retrieval. Explain your reasoning and uncertainties briefly; detailed architecture is not required.
- Add a short note on how learning-impact evidence and possible [QS Reimagine Education Awards](https://www.qs.com/conferences/reimagine/apply) participation could support VinUni's QS-100 ambition. Verify relevant award criteria; keep award preparation outside the pilot build.

### 2.4. Interests and contribution

State your relevant experience, two preferred work areas, one learning goal, support needed, and a concrete Day 2 contribution. You should be able to explain your recommendations and own the work you propose.

List sources you read and briefly disclose AI assistance and what you verified. Discuss personal circumstances privately with the Mentor.

## 3. Joint assignment — draft the product delivery plan

Create `docs/research/day-01/TEAM_SYNTHESIS.md`. Keep the main plan to **2–3 pages**, using tables and links to individual notes.

Use the two-hour session to make decisions together:

| Step | Time | Team action |
|---|---:|---|
| Share individual recommendations | 20 min | Each person brings one useful finding, one product idea, and one risk |
| Agree product flows and pilot scope | 35 min | Resolve differences and choose the simplest useful version of every core flow |
| Draft the stack direction | 25 min | Compare realistic choices and record a preferred direction |
| Build the delivery plan | 40 min | Assign owners, dependencies, dates, and Day 2 outputs |

Choose a facilitator and an editor. Everyone contributes to scope, trade-offs, and task planning; the editor assembles the agreed result. Record unresolved disagreements with a recommendation for the Mentor.

The plan must include:

1. **Product:** A short vision, the three user flows, and the boundary around private notes.
2. **Scope:** What will work in the core demo, what can wait, and three useful lessons from the research.
3. **Stack proposal:** One preferred direction and a fallback where needed. Cover frontend, backend, database/private storage, email-code authentication, AI/retrieval, and hosting. Note team familiarity, reuse of the demo, setup effort, cost, and privacy. Use names and short reasons; no detailed schemas or API specifications.
4. **Delivery:** A feature table with one owner, collaborator/reviewer, expected demo, dependencies, and due date. Cover every core flow by 24 September, testing/fixes by 1 October, and showcase preparation on 2–4 October. Assign owners for deployment, demo accounts/data, the three-user walkthrough, and support notes for the 5 October launch.
5. **Day 2:** Three proposed pairs, an individual contribution for each person, and one integrated result to demonstrate.
6. **Decisions:** The few choices or access requests that need Mentor input, with a preferred option and latest decision time.
7. **Contributions:** Links to all six individual notes and what each person contributed to the joint plan.

Every core feature needs a named owner and date. Avoid six disconnected mini-projects. Stack choices remain proposals until reviewed; prepare reversible exploration while decisions are pending.

## 4. Completion

Each member submits their note and contributes to the joint plan. The team submits one plan and one readout or written summary.

- [ ] Six individual notes, each with three sourced examples, product/stack ideas, and a proposed contribution.
- [ ] One joint plan covering all user flows, privacy, stack direction, owners, dates, and dependencies.
- [ ] Clear Day 2 assignments and decisions needed.
- [ ] Draft PRs with blockers and outstanding work stated.

Follow the [submission workflow](WORKING_IN_THIS_PROJECT.md#3-submit-work-through-a-branch-and-pull-request). The Mentor or designated reviewer handles Day 1 acceptance; you can move straight from your research to joint planning. If GitHub access is blocked, finish locally and report the blocker. Do not wait for the prototype to complete this assignment.
