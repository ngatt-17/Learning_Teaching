# CECS AI Learning Hub — Web app

One React app for students, instructors/TAs and CECS admins. It replaces the three
separate prototypes in `prototypes/` (student `vin-uni`, `teacher`, `admin`) and talks only
to the real services:

- **Platform API** (`platform/backend`, port 8000) — sign-in, courses, materials, quizzes, notes, scores, feedback
- **AI service** (`rag/`, port 8001) — grounded chat, Socratic quiz tutor, quiz generation, competency

Stack: Vite, React 19, TypeScript, Tailwind CSS v4, React Router, lucide-react (same toolchain
as the prototypes).

## Run

```bash
npm ci
npm run dev        # http://localhost:5173
```

Both services must be running (see `docs/exploration/day-03/INTEGRATION.md`). The dev server
proxies `/api/platform` → `http://localhost:8000` and `/api/ai` → `http://localhost:8001`, so no
CORS setup is needed. Override the targets with `PLATFORM_API_URL` / `AI_API_URL`, or the
browser-side bases with `VITE_PLATFORM_API_URL` / `VITE_AI_API_URL` (see `.env.example`).

```bash
npm run lint       # eslint (react-hooks, react-refresh)
npm run build      # tsc -b && vite build → dist/
npm run preview    # serve dist/ on :4173 with the same proxy
```

## Structure

```
src/
  App.tsx                 routes and role guards
  lib/                    api client, auth context, roles, types (API contracts), hooks, formatting
  components/             shell, sidebar, dialogs, badges, rich text + citation pills, state views
  features/
    auth/                 email OTP sign-in
    courses/              course list and role-aware course layout
    student/              course home, quiz list + composite quiz, private notes, feedback
    study/                3-in-1 material workspace (notes · page reader · grounded chat)
    quiz/                 exam view (target screenshot), Socratic tutor, review, competency
    instructor/           materials lifecycle, quiz manager/editor (AI drafts), results, students
    admin/                members, feedback inbox, course creation / accounts
    dashboard/ help/ account/
```

## Conventions

- Every request sends the Platform JWT (kept in `sessionStorage`); a 401 signs the user out.
  Access decisions are never made in the browser — 403 responses render the "Không có quyền
  truy cập" state.
- Visual language follows `.cursorrules`: VinUni navy `#1E3A6E` / crimson `#C8232C`, slate
  neutrals, compact bordered panels, citation pills, the "Owner-only access" badge in the
  private study space.
- AI answers render through `RichText` (bold, code, `[n]` citation pills) — model output is
  never injected as HTML. Answers produced without an LLM show "Chế độ trích dẫn — chưa bật LLM".
- Question contract: `single_choice`, `multiple_choice` (select all), `short_answer`. AI drafts
  use option indices and are mapped to option texts in `features/instructor/quizMapping.ts`.
