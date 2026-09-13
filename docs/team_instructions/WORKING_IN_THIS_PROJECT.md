# Working in CECS AI Learning Hub

Build together, show working results daily, and keep decisions and progress in GitHub. The [README](../../README.md) defines product scope and deadlines.

## 1. Access and setup

1. Use your own GitHub account and accept the repository invitation. Never share credentials.
2. Install Git and an editor. Set your Git name and email.
3. Clone outside a cloud-synchronized folder:

   ```sh
   git clone https://github.com/VinUni-CECS/CECS_AI_LearningHub.git
   cd CECS_AI_LearningHub
   git status
   ```

4. Read the README and your day's brief. Confirm GitHub and Teams access.
5. Follow the application/prototype README for dependencies and run commands once available. Do not guess setup commands at the repository root.

If access or the shared baseline is missing, report it and continue work locally. Request missing services early; record who will unblock them and when.

## 2. Where work belongs

| Place | Use |
|---|---|
| Issue | One testable outcome, owner, collaborator/reviewer, deadline, acceptance criteria, dependencies |
| PR | Proposed change, explanation, validation, and review |
| Project board | Backlog → Ready → In Progress → In Review → In Test → Done; mark Blocked when needed |
| Repository docs | Product plan, research, decisions, setup, and test evidence |
| Teams | Quick coordination, pairing, meetings, and urgent blockers |

Record decisions from Teams in the relevant issue, PR, or document. Use issue updates if the board is not ready. Keep private personnel discussions out of shared files.

## 3. Submit work through a branch and pull request

Use one short-lived branch per task. Once the shared baseline exists:

```sh
git switch main
git pull --ff-only
git switch -c research/42-your-username-day01
```

Replace the issue and username. If issue setup is pending, omit the number and describe the task in the PR. Use `docs/`, `feature/`, `fix/`, or `test/` for other work.

Stage named files and inspect the staged changes:

```sh
git status --short
git diff
git add docs/research/day-01/your-username.md
git diff --cached
git commit -m "docs(research): add project recommendations"
git push -u origin research/42-your-username-day01
```

Use your actual path and branch. Check new files in your editor: `git diff` does not show untracked contents. Never force-add ignored files, commit directly to `main`, or overwrite another person's work to fix a conflict.

Open a draft PR early. Include the task/issue, result, validation, remaining gaps, and any data/security/cost impact. Add screenshots for UI changes.

Day 1 research moves directly into joint planning; no peer-review exercise is required. The Mentor or designated reviewer accepts those submissions. Implementation PRs need a non-author review and applicable checks before merge. Resolve feedback, keep changes small, and request review promptly. Never claim unavailable tests or CI passed.

## 4. Work for the accelerated milestones

- **Day 1:** Individual research → one joint product/stack/delivery plan.
- **Day 2:** Start building, connect one working flow, test access/privacy, and assign remaining core features.
- **By 17 September:** Agree scope and stack, assign owners, establish database/access foundations, CI, staging, and the implementation backlog.
- **By 24 September:** Demonstrate every core flow with real persistence and live grounded AI.
- **By 1 October:** Complete integrated tests and representative user trials; resolve release blockers.
- **2–4 October:** Verify deployment and demo access, rehearse the three user journeys, and finalize quick-start/support notes.
- **5 October 2026:** Launch the product and showcase all working basic features to leaders and faculty. Follow the README release gate.

Choose a simple stack the team can deliver and support. Prefer reuse and established components. Record major stack, authentication, data-model, and privacy decisions before implementing them; routine changes within the agreed design do not need a new decision.

Each task has one accountable owner, a collaborator/reviewer, and a deadline. Each of us should produce a testable contribution daily, explain it, and help connect it to the product. Assess progress through working results, useful decisions, tests, and resolved blockers.

Use one main active task per person. Pair on difficult work and integrate throughout the day. For a joint document, appoint an editor while everyone contributes to the decisions. Avoid separate role branches or late integration.

At the start of each day, agree outcomes and dependencies. At day's end, show results and update issues with evidence, gaps, and next steps. Raise blockers as soon as they threaten the day's result; propose a workaround or request a decision. Cut optional scope before extending research or polishing screens.

## 5. Product, privacy, and AI rules

- Enforce roles and course membership server-side. Students access only approved materials in assigned courses.
- Ground course answers in permitted materials and derive citations from retrieved metadata. Label optional Web sources and their limits.
- Keep each student's notes private. Other students, instructors/TAs, and CECS admins must not access them through UI, APIs, exports, dashboards, shared retrieval, or ordinary logs.
- Clearly separate private notes from intentionally submitted feedback and course activity used for insights. Define analytics sources and access before implementation.
- Show a clear notes-privacy message and test that the application enforces it. Document infrastructure/operator access separately before making broader privacy claims.
- Require instructor review before publishing generated course practice. Personal study notes/questions remain in the student's private space.
- Keep keys, real environment files, confidential course content, and student data out of GitHub and Teams. Use synthetic data and approved samples.
- Use AI tools to accelerate research, coding, tests, and documentation. Verify sources, review generated changes, and understand what you submit. Disclose assistance and uncertainty briefly.
- Use approved services and budgets. Paid services and pilot deployment require agreed authorization.

## 6. Definition of done

A task is done when acceptance criteria pass, relevant tests and limitations are recorded, documentation is current, and the PR is reviewed and merged. “Submitted,” “mocked,” and “tested” are different states.

The Week 2 demo must show functioning core flows, not just screens. Week 3 checks access, notes privacy, citations, practice approval, dashboard accuracy, failures/recovery, and user experience. No unresolved critical access, privacy, or citation defect can pass the pilot release gate.

The 5 October showcase uses the deployed product and approved sample content. Assign demo and support owners, rehearse instructor/student/admin journeys, and state any known limitations. A presentation or prototype alone does not meet the launch target.
