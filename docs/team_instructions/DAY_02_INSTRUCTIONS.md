# Day 2 — Start building and integrate one working flow

**Goal:** Validate the proposed stack and demonstrate the first connected flow. Move from planning to implementation within Week 1.

Read the team's `docs/research/day-01/TEAM_SYNTHESIS.md` and the [product requirements](../../README.md). Target **all core flows by 24 September**, **pilot testing by 1 October**, and **product launch/showcase to leaders and faculty on 5 October 2026**.

## 1. Start with one shared scenario

Use synthetic accounts and materials:

- A CECS admin assigns Instructor A and Student A to Course A, and Student B to Course B.
- Course A has one approved material and one draft. Course B has a separate approved material.
- Instructor A manages Course A materials and prepares practice.
- Student A views an approved material, asks a supported question, inspects its citation, and saves a private note.
- Student A completes published practice and submits explicit platform/course feedback.
- Instructor and admin dashboards show permitted activity and feedback, never private notes.

Cover all flows in the implementation plan. The **minimum Day 2 integrated demo** is: assigned student → approved material → supported answer/citation → saved private note. Show denial for another course and for another user reading the note.

## 2. Three pairs, shared implementation

Agree responsibilities using Day 1 interests and project needs. Each person owns a concrete contribution. Use the reviewed stack; agree shared IDs, material states, and interface/citation fields before splitting work.

| Pair | Build today | Evidence |
|---|---|---|
| Experience and workflows | Connect the student material/chat/citation/note screens to available endpoints; outline instructor material/practice and admin assignment/insight screens | Walk through the integrated student flow, save/reopen a note, and show loading, failure, and denied states |
| Platform and access | Create the runnable foundation, minimal database/fixtures, memberships, material status, and private-note storage with server-side checks | Allowed course access works; other-course access fails; Student B, Instructor A, and the CECS admin cannot read Student A's notes |
| AI and quality | Connect approved-source retrieval and answer/citation handling; prepare practice-generation examples and a shared test checklist | Supported/unsupported answers, valid source locations, excluded unapproved/removed sources, and recorded test results |

Each pair also records its next tasks for practice, feedback, dashboards, deployment, and monitoring. Assign CI/build and staging setup to a named contributor; these remain Week 1 deliverables.

Reuse the demo where it helps and is available. If it is unavailable, start the agreed application foundation. If stack/access approval is pending, produce an isolated runnable experiment, fixtures, and interface examples; state the blocker and request the decision that day. Wireframes alone do not meet the build goal.

A local fake user or stubbed AI response can unblock integration today, but label it clearly. By the Week 2 demo, email verification, persistence, retrieval, AI responses, and the core flows must be real.

## 3. Schedule

Six focused hours, plus breaks.

| Activity | Time | Output |
|---|---:|---|
| Confirm decisions, pairs, and shared interfaces | 30 min | Tasks, owners, dependencies, and access requests |
| First build session | 120 min | Runnable components; first connection between pairs |
| Integration checkpoint | 30 min | Run the shared path and resolve interface mismatches |
| Build, connect, and test | 120 min | Integrated flow and critical checks |
| Combined demo | 20 min | Working path, failures, gaps, and next steps |
| Submit and plan the next day | 40 min | PRs, evidence, and dated tasks |

Work together throughout the day. Switch driver/reviewer during paired work and integrate before the final demo. If a dependency blocks progress, notify its owner immediately and use a clearly labelled temporary interface where useful.

## 4. Checks to run or record as outstanding

- Assigned student can access approved Course A material; Course B access is denied.
- Draft, unpublished, and removed materials are excluded from student retrieval.
- Citations point to the permitted source; unsupported questions receive an appropriate limitation.
- Source text cannot override course access or system instructions.
- A student can create, reopen, edit, and delete their own note.
- Other students, instructors/TAs, and CECS admins are denied access to that note through direct API requests as well as the UI.
- Private notes are absent from dashboard responses, shared retrieval, feedback exports, and ordinary logs.
- Generated instructor practice cannot be published without instructor review.
- Dashboard fixtures reconcile with stored activity; submitted feedback is separate from private notes.
- Optional web results, if used, carry Web labels, citations, and a clear notice that they extend beyond course materials.

Run the checks supported by today's build. Mark the rest as outstanding with an owner and date; proposed tests are not passes.

## 5. Submit evidence and continue delivery

Put runnable implementation in the agreed source/test folders. Use `docs/exploration/day-02/INTEGRATION.md` for a short report:

- Run instructions and PR links.
- What each person built and checked.
- The connected flow, test outcomes, and screenshots where useful.
- Real versus mocked behavior and remaining gaps.
- Next tasks for **every core feature**, with owners, dependencies, and dates.
- Owners for deployment and showcase preparation: demo accounts/data, all three user journeys, and support notes.
- Decisions or access still needed, including their effect on the deadline.

One editor assembles the report; all six confirm their contributions and tasks. Each person explains their own work. A disconnected set of screens or diagrams is incomplete integration.

Finish onboarding within **11–17 September** and continue the Week 1 foundation immediately. Week 2 delivers all core flows; Week 3 tests them with users and resolves release blockers. Use **2–4 October** to verify deployment and rehearse the showcase, ready for launch on **5 October**. Follow the [README milestones](../../README.md#delivery-milestones).
