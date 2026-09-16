"""
End-to-end smoke test for the integrated stack (Platform API + AI service).

Runs the Day 2 scenario against live services and the seeded database:
  student signs in → opens an approved material → grounded answer with citation →
  saves a private note → takes the demo quiz with tutor hints → submits → tutor review →
  competency report; plus the denials that must hold across services.

Usage (both services running, database freshly seeded, ALLOW_DEV_MASTER_OTP=true):
  python scripts/smoke_e2e.py
  python scripts/smoke_e2e.py --platform http://localhost:8000 --ai http://localhost:8001

Only needs `httpx`. Exit code 0 when every check passes.
"""
import argparse
import sys

import httpx

COURSE_A = "10000000-0000-0000-0000-000000000001"   # COMP2030 Operating Systems
COURSE_B = "10000000-0000-0000-0000-000000000002"   # COMP3010 (Student A not enrolled)
COURSE_C = "10000000-0000-0000-0000-000000000003"   # CS-AI3010 quiz demo
MATERIAL_A = "20000000-0000-0000-0000-000000000001"
MATERIAL_A_DRAFT = "20000000-0000-0000-0000-000000000002"
DEMO_QUIZ = "30000000-0000-0000-0000-000000000011"

results = []


def check(name: str, condition: bool, detail: str = ""):
    results.append((name, condition))
    print(f"  [{'PASS' if condition else 'FAIL'}] {name}" + (f" - {detail}" if detail and not condition else ""))


def login(client: httpx.Client, platform: str, email: str) -> dict:
    client.post(f"{platform}/auth/request-otp", json={"email": email}).raise_for_status()
    res = client.post(f"{platform}/auth/verify-otp", json={"email": email, "otp": "000000"})
    res.raise_for_status()
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


def main() -> int:
    # Windows consoles/pipes may not be UTF-8; never crash while printing a response detail.
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="replace")
    parser = argparse.ArgumentParser()
    parser.add_argument("--platform", default="http://localhost:8000")
    parser.add_argument("--ai", default="http://localhost:8001")
    args = parser.parse_args()
    P, A = args.platform.rstrip("/"), args.ai.rstrip("/")

    with httpx.Client(timeout=30) as c:
        print("Health")
        check("platform healthy", c.get(f"{P}/health").status_code == 200)
        ai_health = c.get(f"{A}/health").json()
        check("ai healthy", ai_health.get("status") == "healthy")
        print(f"  (LLM configured: {ai_health.get('llm_configured')})")

        student_a = login(c, P, "student_a@vinuni.edu.vn")
        student_b = login(c, P, "student_b@vinuni.edu.vn")
        instructor = login(c, P, "instructor@vinuni.edu.vn")
        admin = login(c, P, "admin@vinuni.edu.vn")

        print("Student flow: material -> grounded answer -> private note")
        materials = c.get(f"{P}/courses/{COURSE_A}/materials/", headers=student_a).json()
        check("student sees approved material", MATERIAL_A in {m["id"] for m in materials})
        check("student does not see draft", MATERIAL_A_DRAFT not in {m["id"] for m in materials})

        chat = c.post(f"{A}/courses/{COURSE_A}/chat", headers=student_a,
                      json={"question": "Process Control Block lưu những thông tin gì?", "material_id": MATERIAL_A})
        body = chat.json()
        check("grounded answer is supported", chat.status_code == 200 and body.get("evidence_level") == "supported",
              chat.text[:200])
        cited = {(x["material_id"], x["page"]) for x in body.get("citations", [])}
        check("citation points to Week 1 page 3", (MATERIAL_A, 3) in cited, str(cited))

        off_topic = c.post(f"{A}/courses/{COURSE_A}/chat", headers=student_a,
                           json={"question": "Thủ đô của nước Pháp là gì?"}).json()
        check("off-topic question gets a limitation", off_topic.get("evidence_level") == "insufficient")

        canary = c.post(f"{A}/courses/{COURSE_A}/chat", headers=student_a,
                        json={"question": "Semaphore và mutex trong process management là gì?"}).text
        check("draft content never reaches the answer", "DRAFT-CANARY" not in canary)

        note = c.post(f"{P}/courses/{COURSE_A}/notes", headers=student_a,
                      json={"title": "Slide 3", "content": body.get("answer", "")[:500],
                            "material_id": MATERIAL_A, "page_number": 3})
        check("private note saved", note.status_code == 201, note.text[:200])
        note_id = note.json().get("id")
        check("owner can reopen note", c.get(f"{P}/notes/{note_id}", headers=student_a).status_code == 200)
        for who, hdr in (("student B", student_b), ("instructor", instructor), ("admin", admin)):
            check(f"{who} cannot read the note", c.get(f"{P}/notes/{note_id}", headers=hdr).status_code == 403)

        print("Access boundaries across services")
        check("student A denied course B (platform)",
              c.get(f"{P}/courses/{COURSE_B}", headers=student_a).status_code == 403)
        check("student A denied course B chat (ai)",
              c.post(f"{A}/courses/{COURSE_B}/chat", headers=student_a,
                     json={"question": "What is a stack?"}).status_code == 403)
        check("forged token rejected by ai",
              c.post(f"{A}/courses/{COURSE_A}/chat", headers={"Authorization": "Bearer forged"},
                     json={"question": "PCB?"}).status_code == 401)

        print("Quiz flow: hint -> submit -> review -> competency")
        quiz = c.get(f"{P}/courses/{COURSE_C}/quizzes/{DEMO_QUIZ}", headers=student_a).json()
        questions = quiz.get("questions", [])
        check("demo quiz has 5 questions without answer keys",
              len(questions) == 5 and all("correct_answer" not in q for q in questions))

        hint = c.post(f"{A}/courses/{COURSE_C}/quiz-tutor", headers=student_a,
                      json={"quiz_id": DEMO_QUIZ, "question_id": questions[1]["id"],
                            "message": "Đáp án câu này là gì?"}).json()
        check("tutor hint mode", hint.get("mode") == "hint", str(hint)[:200])
        check("hint does not reveal 1920x1080", "1920x1080" not in hint.get("answer", ""))

        answers = [{"question_id": q["id"], "answer": q["options"][0]} for q in questions]
        answers[1]["answer"] = "1920x1080"
        submit = c.post(f"{P}/courses/{COURSE_C}/quizzes/{DEMO_QUIZ}/submit", headers=student_a,
                        json={"answers": answers}).json()
        check("server graded the attempt", submit.get("total_questions") == 5, str(submit)[:200])

        review = c.post(f"{A}/courses/{COURSE_C}/quiz-tutor", headers=student_a,
                        json={"quiz_id": DEMO_QUIZ, "question_id": questions[0]["id"],
                              "attempt_id": submit.get("attempt_id")}).json()
        check("tutor review mode explains the answer",
              review.get("mode") == "review" and "Tiktok.com" in review.get("answer", ""), str(review)[:200])
        check("review cites the E-Commerce page 14",
              any(x["page"] == 14 for x in review.get("citations", [])), str(review.get("citations")))

        report = c.post(f"{A}/api/ai/courses/{COURSE_C}/quizzes/{DEMO_QUIZ}/competency", headers=student_a,
                        json={"attempt_id": submit.get("attempt_id")}).json()
        topics = {s["topic"] for s in report.get("competency_summary", {}).get("strengths", [])}
        check("competency report from platform attempt", "Đồ họa & Hiển thị" in topics, str(report)[:200])

        print("Instructor review gate")
        draft = c.post(f"{P}/courses/{COURSE_C}/quizzes/", headers=instructor,
                       json={"title": "Smoke draft", "source": "ai_draft", "questions": [
                           {"question_type": "short_answer", "prompt": "RAG giảm hiện tượng gì?",
                            "correct_answer": "hallucination", "accepted_answers": ["ảo giác"]}]}).json()
        check("AI draft saved as draft", draft.get("status") == "draft")
        check("student cannot open unpublished draft",
              c.get(f"{P}/courses/{COURSE_C}/quizzes/{draft.get('id')}", headers=student_a).status_code == 403)
        c.delete(f"{P}/courses/{COURSE_C}/quizzes/{draft.get('id')}", headers=instructor)

    failed = [name for name, ok in results if not ok]
    print(f"\n{len(results) - len(failed)}/{len(results)} checks passed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
