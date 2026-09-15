# Day 1 Research — Vinh (`aetrna300bpm`)

**14 September 2026.** All sources accessed 14 September 2026.

I have written this the way I would say it out loud, so it is short and direct.

---

## Where I think the real risk is

I want to start with the thing I believe most, because it shapes everything else I propose. I may be wrong about it, and I would rather be argued with than agreed with politely.

I do not think this product succeeds or fails on the number of features, or on how clever the engineering is. Most learning platforms already do roughly the same things. What separates the ones students open from the ones they abandon is friction — how many steps to reach what you need, and whether the app is one place or one of five places to check.

I say this partly from the outside: I am not a diligent user of learning platforms myself. So I am the kind of student this has to win over, and I know what loses me — signing in to several tabs and nothing telling me what to do next.

I am not arguing for visual polish, and I know the README rules polish out of the pilot. I am arguing for something cheaper: fewer steps, one place for course things, and a visible reason to come back. My proposal is that we build the engineering groundwork properly over these three weeks — identity, materials, grounded retrieval with citations, private notes, practice — and keep alongside it a short written specification and one standalone demo of what that base should eventually feel like. The target then exists on paper and on screen without competing with 24 September for engineering time.

---

## 1. Product understanding

**Instructor / TA.** Email plus one-time code. Upload materials, watch them process, retry failures, **approve** before students can read or query them, unpublish or remove later. Generate draft practice from approved sources, review and edit, publish. Read activity and where students struggle.

**Student.** Sign in, open assigned courses, read approved materials. Ask questions answered from those materials, with a citation you can click through, and a clear "not enough evidence" when there isn't. Keep a private study space. Do published practice, get feedback pointing back at the source. Send feedback through a separate channel.

**CECS admin.** Assign people to courses, check readiness, read aggregate engagement and feedback. Never open a private space.

**The data boundary.** Four kinds of data get discussed as one thing and are not:

| Data | Who reads it | In retrieval? | In dashboards? |
|---|---|---|---|
| Private notes and personal questions | The owner, and nobody else | No | No |
| Approved course materials | Course members, per role | Yes | Readiness counts only |
| Submitted feedback | Its stated audience | No | Yes, as submitted |
| Practice attempts and activity | Aggregated per role | No | Yes |

I want to be exact about the first row, because I nearly got it wrong myself. Private notes are not anonymised and then used for analytics. They are excluded — from dashboards, exports, shared retrieval and ordinary logs.

**One edge that is still open.** The README calls chat history "user-owned," and separately promises instructors a view of common misconceptions. The natural source for misconceptions is what students ask. If we derive them from chat, chat is analytics input and not really private — a different promise from the one the study space makes. I suggest deriving misconceptions from **practice attempts only**, where a student knows their work is being looked at, and writing that into `docs/decisions/` before a dashboard query exists.

**On feedback:** admin-only for the pilot. It exists so CECS can see how courses and staff are doing. If a student has a problem with their teaching, I would rather we encouraged them to talk to their teacher than routed it through us.

**Two success signals I would propose:**

1. **Return rate, not sign-up rate.** The share of pilot students who come back in a second and third week without being told to. Adoption is where I think the risk is, so it is what I want measured. Counting first logins would flatter us.
2. **Citations that survive checking.** Before the Week 2 demo, take questions from one course's approved material where we already know the right source location, and check two things separately: does the cited passage support the claim, and is the cited page the right one. They fail for different reasons. I would rather propose a small honest check than a large confident percentage.

**The assumption I most want to test:** that students will put *real* notes into a private space hosted by their own university. The study space rests on that trust. If they hedge — real notes elsewhere, throwaway notes in our app — the feature ships unused and no dashboard would show it. Five to eight student interviews in Week 3 would tell us.

---

## 2. Three university examples

I chose these for what they do differently from each other, and for whether their approach transfers to our situation in Vietnam — small team, tight deadline, limited budget.

| Application and source | Users and problem | What is distinctive | Evidence and limits | What transfers to us |
|---|---|---|---|---|
| **Harvard — AI tutor in Physical Sciences 2.** Kestin, Miller, Klales, Milbourne & Ponti, *Scientific Reports* 15:97652, [doi:10.1038/s41598-025-97652-6](https://www.nature.com/articles/s41598-025-97652-6), 3 Jun 2025 | 194 students in introductory physics; lectures cannot pace to each student | Not a general chat box. A scripted lesson on one topic, with expert-written prompts, revealing help on request instead of answering on demand | **Evaluated learning outcome.** Randomised crossover trial; effect size 0.63, median score 4.5 vs 3.5, higher engagement, in *less* time (49 min vs ~60). Authors limit the claim to understanding/applying/analysing, and say it depends on expert-crafted prompts | The gain came from narrow scope and careful prompt design, not breadth. Transfers well and cheaply: one bounded flow done properly beats a wide surface that mostly works |
| **Stanford — Tutor CoPilot.** Wang, Ribeiro, Robinson, Loeb & Demszky, [arXiv:2410.03017](https://arxiv.org/abs/2410.03017); [project page](https://edunlp.stanford.edu/projects/tutor-copilot) | 900 tutors, 1,800 students, under-resourced schools; the shortage is expertise, not content | The AI advises the **human** mid-session on what to ask next, rather than answering the student | **Evaluated deployment.** RCT: +4 pp more students passing, and **+9 pp** for the weakest-rated tutors. $20 per tutor per year. Authors note limited generalisability and that privacy safeguards need strengthening | Help lands hardest where expertise is thinnest. Our instructor-review gate is the feature, not the tax — and $20/tutor/year says this kind of thing is affordable for a Vietnamese university |
| **University of Sydney — Cogniti.** [Global launch, 15 Jun 2026](https://www.sydney.edu.au/news-opinion/news/2026/06/15/ai-education-platform-cogniti-goes-global-on-microsoft-marketplace.html); [AFR AI Award, 3 Jun 2025](https://www.sydney.edu.au/news-opinion/news/2025/06/03/cogniti-an-ai-stunt-double-for-teachers-wins-afr-ai-award.html) | Whole-university; built in-house rather than bought | Teachers build their own course agents from their own materials, data kept under institutional control | **Deployed at scale, no controlled evaluation published.** Hundreds of educators at Sydney, Leiden across 4 faculties and 2,000 students, trials in New Zealand. Outcomes reported are anecdotal. Educators stress it is "not a quick fix" | The closest model to what CECS is doing, and the clearest warning: a platform can reach thousands while its evidence lags years behind. If we want a story anyone can check, we have to build the checking in from the start |

**Three lessons I take from this.**

1. Bounded scope with careful design is where measured gains come from. Breadth is not evidence. This is the argument for cutting hard and early.
2. Keeping the human in the loop improves outcomes most for the least expert person in the room. Our review gate earns its cost.
3. Institution-built platforms scale much faster than their evidence. That is the trap, and avoiding it costs almost nothing if we decide now rather than in Week 3.

---

## 3. Product and stack

**Scope I would propose.** Three pilot courses on deliberately different topics, to show the system is not tuned to one syllabus. PDF only — we can convert slides ourselves rather than build PPTX extraction. **Two practice modes:** an instructor-approved bank covering the course, plus student-generated practice for the parts the bank does not reach, so students test whether they understand what is under the hood instead of memorising a fixed set. Dashboards limited to engagement and the choke points where students visibly struggle. I would **cut optional web expansion entirely** rather than keep it as a maybe — a second citation format and a new failure path, for something the README already marks optional.

**One idea of mine that needs a decision, not an assumption.** I want linkage between courses the same student has taken, so a concept they met last term can be connected to the one confusing them now. This is not in the README and it cuts against our access model, which is built on students reaching only their assigned courses. So I propose it as a `docs/decisions/` item with the rule stated up front: linkage only across courses the student is actually enrolled in, retrieval still scoped per course, and the connection shown as a suggestion rather than merged into one answer. If that is too much for the pilot, I would rather cut it deliberately than discover it as a leak.

**The flow I would want flawless on 5 October:** working out where a student is weak from their practice, then targeting help at exactly that gap. That is what would make me open the app, and it is the part a faculty audience has not already seen ten times.

**Stack.** Everyone converged independently on React/Next, FastAPI, PostgreSQL with pgvector, Gemini and Docker. I support it and would not spend the session relitigating it. Two things I would rather settle instead:

- **Who owns email delivery.** Real one-time codes to `@vinuni.edu.vn` by 24 September need a mail relay, sender authentication, and decisions on code lifetime and rate limits. Unclaimed, and invisible until it is late.
- **Where authorization lives.** Several of us wrote "row-level security." I would only claim that if every request carries the user's identity into the database session, because under a shared connection pool those policies quietly do nothing. I would take one authorization layer we can point at and test over two we only think we have.

I expect we will move fast and tidy the code later, and for three weeks I think that is right. The exception is the access and privacy boundary: we can move fast on screens, but not on who is allowed to read what, because that is the one thing the release gate will not forgive.

**On QS.** Harvard, Stanford, Sydney and several others all have a course-grounded tutor, so "we built one" is not a story in 2026. What we could have instead is a privacy boundary that is verified rather than asserted, plus evidence that students kept coming back — built cheaply, on a stack any Vietnamese university could copy. That framing asks for nothing we were not already required to do for launch.

---

## 4. Interests and contribution

**Experience.** Final-year Computer Science at Hanoi University of Science and Technology. First-author on an international conference paper, which mostly taught me how to build an evaluation set, define "correct" precisely enough that two people agree, and defend a number to someone whose job is to doubt it. Comfortable in Python, and comfortable being the person who writes things down so a decision stops being re-argued.

**Two areas I would like to own.** **Integration and shared contracts** — the IDs, material states and citation fields the pairs build against, which Day 2 says must be agreed before work splits. And **demo and release** — demo accounts and data, the three journeys, the rehearsal and support notes for 5 October. Both are unclaimed, both touch every part of the system.

**What I want out of this.** To build something people actually come back to; everything I have made until now has been a project only I ever saw. To take knowledge I only have on paper and deploy it. And to do it with other people — until now I have mostly brainstormed alone and then worked alone with AI, and I know that is a gap. I am not yet sure what part of this profession I want to follow, and the fastest way I know to find out is to work under real pressure.

**Support I would ask for.** A Claude subscription if I run past my own quota, and regular time with you for direction — I would get more out of thirty minutes a week of it than a day of guessing.

**My Day 2 contribution.** The shared contract and fixtures everyone builds against: a written specification of user, course and material IDs, the material state machine and the citation object shape, agreed before the pairs split as the brief requires — plus a seed script producing the Day 2 scenario (admin; Instructor A; Students A and B; Courses A and B; one approved and one draft material in A, a separate approved material in B). All three pairs need that data tomorrow and none has time to build it. I will also take the integration report at day's end.

---

**AI assistance.** I used Claude to read the repository and the five notes already pushed, to find and verify the three sources above, and to draft and tighten this note. I checked the figures, dates and links against the primary sources myself.

**Uncertainty.** My claim about row-level security under a connection pool is the load-bearing technical claim here — I am confident, but it deserves five minutes from whoever owns the schema. My opening argument is a judgement about students, not a finding; the Week 3 interviews are what would test it. And I have not estimated how long the contract spec and fixtures really take in a stack I have not written before, so I may need the platform pair earlier than I think.
