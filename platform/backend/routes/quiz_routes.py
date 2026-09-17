"""
Quiz engine.

Grading is entirely server-side: a student submits answers, the server compares them
against `quiz_questions.correct_answer` and writes the resulting points itself. No
score value is ever accepted from a client, and correct answers are never included in
a student-facing payload before the attempt is submitted.

Question types follow the shared AI/Platform contract (migration 003):
  single_choice   — one correct option; correct_answer is the option text
  multiple_choice — select all that apply; correct_answer is a JSON array of option texts,
                    graded all-or-nothing
  short_answer    — free text; matches correct_answer or any accepted_answers entry,
                    case- and whitespace-insensitively
"""
import json
from datetime import date, datetime, timedelta
from typing import List, Literal, Optional, Union

from psycopg2.extras import Json
from pydantic import BaseModel, Field, model_validator
from fastapi import APIRouter, Depends, HTTPException, status

from auth import UserPayload, get_current_user
from middleware import require_role, require_course_access
from database import get_db

router = APIRouter(prefix="/courses/{course_id}/quizzes", tags=["Quizzes"])

STAFF = ("instructor", "ta", "admin")
# A comprehensive quiz must span at least this many already-studied topics.
MIN_COMPREHENSIVE_TOPICS = 1

QuestionType = Literal["single_choice", "multiple_choice", "short_answer"]


# ─────────────────────────── models ───────────────────────────

class QuestionCitation(BaseModel):
    """Where the answer is supported in an approved material."""
    material_id: Optional[str] = None
    title: Optional[str] = None
    page: Optional[int] = Field(default=None, ge=1)
    snippet: Optional[str] = None


class QuestionCreate(BaseModel):
    question_type: QuestionType = "single_choice"
    prompt: str = Field(min_length=1)
    options: Optional[List[str]] = None
    correct_answer: Union[str, List[str]]
    accepted_answers: Optional[List[str]] = None
    explanation: Optional[str] = None
    topic: Optional[str] = None
    citation: Optional[QuestionCitation] = None

    @model_validator(mode="after")
    def check_shape(self):
        if self.question_type == "short_answer":
            if not isinstance(self.correct_answer, str) or not self.correct_answer.strip():
                raise ValueError("short_answer needs a non-empty text correct_answer")
            self.options = None
            return self

        options = [o.strip() for o in (self.options or []) if o and o.strip()]
        if len(options) < 2 or len(set(options)) != len(options):
            raise ValueError(f"{self.question_type} needs at least two distinct options")
        self.options = options

        if self.question_type == "single_choice":
            if not isinstance(self.correct_answer, str) or self.correct_answer.strip() not in options:
                raise ValueError("single_choice correct_answer must be one of the options")
            self.correct_answer = self.correct_answer.strip()
        else:
            answers = self.correct_answer if isinstance(self.correct_answer, list) else [self.correct_answer]
            answers = [a.strip() for a in answers]
            if not answers or any(a not in options for a in answers):
                raise ValueError("multiple_choice correct_answer must be a non-empty list of options")
            self.correct_answer = sorted(set(answers))
        return self


class QuizCreate(BaseModel):
    title: str
    description: Optional[str] = None
    week_number: Optional[int] = None
    material_id: Optional[str] = None
    quiz_type: Optional[Literal["lesson", "comprehensive"]] = None
    source: Literal["manual", "ai_draft"] = "manual"
    points_per_question: float = Field(default=1, gt=0, le=20)
    time_limit_seconds: Optional[int] = Field(default=None, gt=0, le=7200)
    due_at: Optional[datetime] = None
    questions: List[QuestionCreate] = []


class QuizStatusUpdate(BaseModel):
    status: Literal["draft", "published", "archived"]


class SubmittedAnswer(BaseModel):
    question_id: str
    # Text for single_choice / short_answer, list of option texts for multiple_choice.
    answer: Union[str, List[str]] = ""


class QuizSubmission(BaseModel):
    answers: List[SubmittedAnswer]


class ComprehensiveRequest(BaseModel):
    week_numbers: List[int]
    questions_per_topic: int = Field(default=2, ge=1, le=50)
    title: Optional[str] = None
    time_limit_seconds: Optional[int] = None
    due_at: Optional[datetime] = None
    question_count: Optional[int] = None
    question_types: Optional[List[str]] = None
    difficulty: Optional[str] = None
    bloom_remember: Optional[int] = None
    bloom_understand: Optional[int] = None
    bloom_apply: Optional[int] = None


# ─────────────────────────── helpers ───────────────────────────

def _is_staff(user: UserPayload) -> bool:
    return user.role in STAFF


def _normalize(text) -> str:
    return " ".join(str(text).split()).casefold()


def _decode_list(raw) -> List[str]:
    """Stored/submitted select-all answers are JSON arrays; tolerate a bare string."""
    if raw is None:
        return []
    if isinstance(raw, list):
        return [str(x).strip() for x in raw if str(x).strip()]
    try:
        value = json.loads(raw)
        if isinstance(value, list):
            return [str(x).strip() for x in value if str(x).strip()]
    except (TypeError, ValueError):
        pass
    return [str(raw).strip()] if str(raw).strip() else []


def _decode_answer(question_type: str, raw):
    return _decode_list(raw) if question_type == "multiple_choice" else raw


def _store_answer(answer) -> str:
    return json.dumps(sorted(set(answer)), ensure_ascii=False) if isinstance(answer, list) else answer


def _grade(question_type: str, correct: str, submitted, accepted_answers=None) -> bool:
    """Server-side marking against the stored answer key."""
    if submitted is None:
        return False
    if question_type == "short_answer":
        if isinstance(submitted, list):
            return False
        candidates = [correct, *(accepted_answers or [])]
        return bool(submitted.strip()) and _normalize(submitted) in {_normalize(c) for c in candidates if c}
    if question_type == "multiple_choice":
        chosen = set(_decode_list(submitted))
        return bool(chosen) and chosen == set(_decode_list(correct))
    if isinstance(submitted, list):
        return False
    return submitted.strip() == correct.strip()


def _iso(value):
    return value.isoformat() if value is not None else None


def _award_quiz_points(cur, student_id: str, course_id: str, column: str, points: float) -> int:
    """
    Write server-computed points into student_scores and advance the daily streak.
    `column` is chosen by the caller, never by the client.
    """
    today = date.today()
    cur.execute("""
        SELECT streak_days, last_active_date, quiz_score, comprehensive_score, active_score
        FROM student_scores WHERE student_id = %s AND course_id = %s;
    """, (student_id, course_id))
    existing = cur.fetchone()

    if not existing:
        streak = 1
        totals = {"quiz_score": 0.0, "comprehensive_score": 0.0, "active_score": 0.0}
    else:
        last_date = existing["last_active_date"]
        if last_date == today:
            streak = existing["streak_days"]
        elif last_date == today - timedelta(days=1):
            streak = existing["streak_days"] + 1
        else:
            streak = 1
        totals = {
            "quiz_score": float(existing["quiz_score"]),
            "comprehensive_score": float(existing["comprehensive_score"]),
            "active_score": float(existing["active_score"]),
        }

    totals[column] = min(totals[column] + points, 999.99)

    if not existing:
        cur.execute("""
            INSERT INTO student_scores (student_id, course_id, streak_days, quiz_score,
                                        comprehensive_score, active_score, last_active_date)
            VALUES (%s, %s, %s, %s, %s, %s, %s);
        """, (student_id, course_id, streak, totals["quiz_score"],
              totals["comprehensive_score"], totals["active_score"], today))
    else:
        cur.execute("""
            UPDATE student_scores
            SET streak_days = %s, quiz_score = %s, comprehensive_score = %s,
                active_score = %s, last_active_date = %s, updated_at = NOW()
            WHERE student_id = %s AND course_id = %s;
        """, (streak, totals["quiz_score"], totals["comprehensive_score"],
              totals["active_score"], today, student_id, course_id))
    return streak


def _load_quiz(cur, course_id: str, quiz_id: str):
    cur.execute("""
        SELECT id, course_id, material_id, week_number, title, description, quiz_type, source, status,
               points_per_question, time_limit_seconds, due_at, created_by
        FROM quizzes WHERE id = %s AND course_id = %s;
    """, (quiz_id, course_id))
    quiz = cur.fetchone()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found in this course")
    return quiz


def _check_material_in_course(cur, course_id: str, material_id: Optional[str]):
    if not material_id:
        return
    cur.execute("SELECT 1 FROM materials WHERE id = %s AND course_id = %s;", (material_id, course_id))
    if not cur.fetchone():
        raise HTTPException(status_code=400, detail="material_id does not belong to this course")


def _insert_questions(cur, quiz_id, questions: List[QuestionCreate]):
    for i, q in enumerate(questions, start=1):
        cur.execute("""
            INSERT INTO quiz_questions (quiz_id, position, question_type, prompt, options,
                                        correct_answer, accepted_answers, explanation, topic, citation)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
        """, (quiz_id, i, q.question_type, q.prompt,
              Json(q.options) if q.options else None,
              _store_answer(q.correct_answer),
              Json(q.accepted_answers) if q.accepted_answers else None,
              q.explanation, q.topic,
              Json(q.citation.model_dump(exclude_none=True)) if q.citation else None))


def _quiz_header(quiz) -> dict:
    return {
        "id": str(quiz["id"]),
        "course_id": str(quiz["course_id"]),
        "material_id": str(quiz["material_id"]) if quiz["material_id"] else None,
        "title": quiz["title"],
        "description": quiz["description"],
        "week_number": quiz["week_number"],
        "quiz_type": quiz["quiz_type"],
        "source": quiz["source"],
        "status": quiz["status"],
        "points_per_question": float(quiz["points_per_question"]),
        "time_limit_seconds": quiz["time_limit_seconds"],
        "due_at": _iso(quiz["due_at"]),
    }


# ─────────────────────── student endpoints ───────────────────────

@router.get("/")
def list_quizzes(course_id: str, current_user: UserPayload = Depends(require_course_access)):
    """
    Published quizzes for the course, with the caller's own attempt summary.
    Draft and archived quizzes are excluded for students; a generated comprehensive
    quiz is only listed for the student it was generated for.
    """
    with get_db() as cur:
        cur.execute("""
            SELECT q.id, q.week_number, q.title, q.description, q.quiz_type, q.source, q.status,
                   q.points_per_question, q.time_limit_seconds, q.due_at, q.material_id,
                   q.created_at, q.created_by,
                   COUNT(qq.id) AS question_count,
                   (SELECT COUNT(*) FROM quiz_attempts a
                     WHERE a.quiz_id = q.id AND a.student_id = %s) AS my_attempts,
                   (SELECT MAX(a.score) FROM quiz_attempts a
                     WHERE a.quiz_id = q.id AND a.student_id = %s) AS my_best_score
            FROM quizzes q
            LEFT JOIN quiz_questions qq ON qq.quiz_id = q.id
            WHERE q.course_id = %s
              AND q.status = 'published'
              AND (q.quiz_type = 'lesson' OR q.created_by = %s)
            GROUP BY q.id
            ORDER BY q.created_at DESC;
        """, (current_user.user_id, current_user.user_id, course_id, current_user.user_id))
        rows = cur.fetchall()
    return [{
        **r,
        "id": str(r["id"]),
        "material_id": str(r["material_id"]) if r["material_id"] else None,
        "created_by": str(r["created_by"]) if r["created_by"] else None,
        "created_at": _iso(r["created_at"]),
        "due_at": _iso(r["due_at"]),
        "points_per_question": float(r["points_per_question"]),
        "max_score": round(float(r["points_per_question"]) * r["question_count"], 2),
        "my_best_score": float(r["my_best_score"]) if r["my_best_score"] is not None else None,
    } for r in rows]


@router.get("/topics")
def list_topics(course_id: str, current_user: UserPayload = Depends(require_course_access)):
    """
    Topics selectable for a comprehensive quiz. A week is locked until it has an
    approved material AND a published quiz — "chủ đề chưa học thì bị khóa".
    """
    with get_db() as cur:
        cur.execute("""
            SELECT w.week_number,
                   MIN(w.lesson_title) AS lesson_title,
                   BOOL_OR(m.status = 'approved' AND m.approved_for_ai) AS has_approved_material,
                   EXISTS (SELECT 1 FROM quizzes q
                            WHERE q.course_id = w.course_id
                              AND q.week_number = w.week_number
                              AND q.quiz_type = 'lesson'
                              AND q.status = 'published') AS has_published_quiz
            FROM week_classifications w
            JOIN materials m ON m.id = w.material_id
            WHERE w.course_id = %s
            GROUP BY w.course_id, w.week_number
            ORDER BY w.week_number;
        """, (course_id,))
        rows = cur.fetchall()

    topics = []
    for r in rows:
        available = bool(r["has_approved_material"] and r["has_published_quiz"])
        topics.append({
            "week_number": r["week_number"],
            "lesson_title": r["lesson_title"],
            "available": available,
            "locked_reason": None if available else (
                "Tài liệu của tuần này chưa được duyệt" if not r["has_approved_material"]
                else "Giảng viên chưa phát hành quiz cho tuần này"
            ),
        })
    return {
        "course_id": course_id,
        "min_topics_for_comprehensive": MIN_COMPREHENSIVE_TOPICS,
        "topics": topics,
    }


@router.get("/{quiz_id}")
def get_quiz(course_id: str, quiz_id: str, current_user: UserPayload = Depends(require_course_access)):
    """
    Fetch a quiz to take it. For students the payload deliberately omits
    `correct_answer`, `accepted_answers`, `explanation` and `citation` — they are only
    revealed after submitting.
    """
    with get_db() as cur:
        quiz = _load_quiz(cur, course_id, quiz_id)

        if not _is_staff(current_user):
            if quiz["status"] != "published":
                raise HTTPException(status_code=403, detail="This quiz has not been published")
            if quiz["quiz_type"] == "comprehensive" and str(quiz["created_by"]) != current_user.user_id:
                raise HTTPException(status_code=403, detail="This comprehensive quiz belongs to another student")

        cur.execute("""
            SELECT id, position, question_type, prompt, options, topic
            FROM quiz_questions WHERE quiz_id = %s ORDER BY position;
        """, (quiz_id,))
        questions = cur.fetchall()

    return {
        **_quiz_header(quiz),
        "questions": [{
            "id": str(q["id"]),
            "position": q["position"],
            "question_type": q["question_type"],
            "prompt": q["prompt"],
            "options": q["options"],
            "topic": q["topic"],
        } for q in questions],
    }


@router.post("/{quiz_id}/submit")
def submit_quiz(
    course_id: str,
    quiz_id: str,
    submission: QuizSubmission,
    current_user: UserPayload = Depends(require_course_access)
):
    """
    Grade a submission server-side and award the resulting points.

    Only the first attempt earns points; later attempts are stored as practice with
    `points_awarded = 0`, so a quiz cannot be replayed to farm score.
    """
    with get_db() as cur:
        quiz = _load_quiz(cur, course_id, quiz_id)
        if quiz["status"] != "published":
            raise HTTPException(status_code=403, detail="This quiz has not been published")
        if quiz["quiz_type"] == "comprehensive" and str(quiz["created_by"]) != current_user.user_id:
            raise HTTPException(status_code=403, detail="This comprehensive quiz belongs to another student")

        cur.execute("""
            SELECT id, question_type, correct_answer, accepted_answers FROM quiz_questions WHERE quiz_id = %s;
        """, (quiz_id,))
        questions = {str(q["id"]): q for q in cur.fetchall()}
        if not questions:
            raise HTTPException(status_code=400, detail="This quiz has no questions")

        submitted = {a.question_id: a.answer for a in submission.answers}
        unknown = set(submitted) - set(questions)
        if unknown:
            raise HTTPException(status_code=400, detail=f"Unknown question ids: {sorted(unknown)}")

        points_per_question = float(quiz["points_per_question"])
        graded = []
        correct_count = 0
        for qid, q in questions.items():
            answer = submitted.get(qid, "")
            is_correct = _grade(q["question_type"], q["correct_answer"], answer, q["accepted_answers"])
            correct_count += int(is_correct)
            graded.append((qid, _store_answer(answer), is_correct))

        total_questions = len(questions)
        score = round(correct_count * points_per_question, 2)
        max_score = round(total_questions * points_per_question, 2)

        cur.execute("""
            SELECT COALESCE(MAX(attempt_number), 0) AS last_attempt
            FROM quiz_attempts WHERE quiz_id = %s AND student_id = %s;
        """, (quiz_id, current_user.user_id))
        attempt_number = cur.fetchone()["last_attempt"] + 1

        # Points only on the first attempt — replays are practice.
        points_awarded = score if attempt_number == 1 else 0.0

        cur.execute("""
            INSERT INTO quiz_attempts (quiz_id, student_id, course_id, attempt_number,
                                       correct_count, total_questions, score, max_score, points_awarded)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, submitted_at;
        """, (quiz_id, current_user.user_id, course_id, attempt_number,
              correct_count, total_questions, score, max_score, points_awarded))
        attempt = cur.fetchone()

        for qid, answer, is_correct in graded:
            cur.execute("""
                INSERT INTO quiz_attempt_answers (attempt_id, question_id, submitted_answer, is_correct)
                VALUES (%s, %s, %s, %s);
            """, (attempt["id"], qid, answer, is_correct))

        streak = None
        if points_awarded > 0:
            column = "comprehensive_score" if quiz["quiz_type"] == "comprehensive" else "quiz_score"
            streak = _award_quiz_points(cur, current_user.user_id, course_id, column, points_awarded)

    return {
        "attempt_id": str(attempt["id"]),
        "attempt_number": attempt_number,
        "correct_count": correct_count,
        "total_questions": total_questions,
        "score": score,
        "max_score": max_score,
        "points_awarded": points_awarded,
        "submitted_at": _iso(attempt["submitted_at"]),
        "scored_component": "comprehensive_score" if quiz["quiz_type"] == "comprehensive" else "quiz_score",
        "streak_days": streak,
        "note": None if attempt_number == 1 else "Lần làm lại chỉ để luyện tập, không cộng thêm điểm.",
    }


@router.get("/{quiz_id}/my-attempts")
def my_attempts(course_id: str, quiz_id: str, current_user: UserPayload = Depends(require_course_access)):
    """
    The caller's own attempts, with per-question marking, explanations and citations.
    Correct answers appear here only because the student has already submitted.
    """
    with get_db() as cur:
        _load_quiz(cur, course_id, quiz_id)
        cur.execute("""
            SELECT id, attempt_number, correct_count, total_questions, score, max_score,
                   points_awarded, submitted_at
            FROM quiz_attempts
            WHERE quiz_id = %s AND student_id = %s
            ORDER BY attempt_number;
        """, (quiz_id, current_user.user_id))
        attempts = cur.fetchall()

        result = []
        for a in attempts:
            cur.execute("""
                SELECT qq.id AS question_id, qq.position, qq.prompt, qq.question_type, qq.options,
                       qq.correct_answer, qq.explanation, qq.topic, qq.citation,
                       aa.submitted_answer, aa.is_correct
                FROM quiz_attempt_answers aa
                JOIN quiz_questions qq ON qq.id = aa.question_id
                WHERE aa.attempt_id = %s
                ORDER BY qq.position;
            """, (a["id"],))
            answers = []
            for r in cur.fetchall():
                answers.append({
                    **r,
                    "question_id": str(r["question_id"]),
                    "correct_answer": _decode_answer(r["question_type"], r["correct_answer"]),
                    "submitted_answer": _decode_answer(r["question_type"], r["submitted_answer"]),
                })
            result.append({
                "attempt_id": str(a["id"]),
                "attempt_number": a["attempt_number"],
                "correct_count": a["correct_count"],
                "total_questions": a["total_questions"],
                "score": float(a["score"]),
                "max_score": float(a["max_score"]),
                "points_awarded": float(a["points_awarded"]),
                "submitted_at": _iso(a["submitted_at"]),
                "answers": answers,
            })
    return result


@router.post("/comprehensive", status_code=status.HTTP_201_CREATED)
def create_comprehensive_quiz(
    course_id: str,
    data: ComprehensiveRequest,
    current_user: UserPayload = Depends(require_course_access)
):
    """
    Assemble a comprehensive quiz from at least two already-studied topics.
    Questions are copied from published lesson quizzes of the selected weeks, so the
    grading path is identical and the attempt records exactly what was asked.
    """
    weeks = sorted(set(data.week_numbers))
    if len(weeks) < MIN_COMPREHENSIVE_TOPICS:
        raise HTTPException(
            status_code=400,
            detail=f"Chọn ít nhất {MIN_COMPREHENSIVE_TOPICS} chủ đề cho quiz tổng hợp"
        )

    with get_db() as cur:
        # Same rule as GET /topics: the week must have an approved material and a
        # published lesson quiz, otherwise it counts as "chưa học" and stays locked.
        cur.execute("""
            SELECT DISTINCT q.week_number
            FROM quizzes q
            WHERE q.course_id = %s AND q.quiz_type = 'lesson' AND q.status = 'published'
              AND q.week_number = ANY(%s)
              AND EXISTS (
                  SELECT 1 FROM week_classifications w
                  JOIN materials m ON m.id = w.material_id
                  WHERE w.course_id = q.course_id AND w.week_number = q.week_number
                    AND m.status = 'approved' AND m.approved_for_ai
              );
        """, (course_id, weeks))
        unlocked = {r["week_number"] for r in cur.fetchall()}
        locked = [w for w in weeks if w not in unlocked]
        if locked:
            raise HTTPException(
                status_code=403,
                detail=f"Các tuần chưa học/chưa có quiz phát hành nên bị khóa: {locked}"
            )

        quiz_title = data.title.strip() if data.title and data.title.strip() else f"Quiz tổng hợp — tuần {', '.join(map(str, weeks))}"
        cur.execute("""
            INSERT INTO quizzes (course_id, week_number, title, quiz_type, source, status,
                                 points_per_question, time_limit_seconds, due_at, created_by)
            VALUES (%s, NULL, %s, 'comprehensive', 'manual', 'published', 1, %s, %s, %s)
            RETURNING id, title, points_per_question;
        """, (course_id, quiz_title, data.time_limit_seconds, data.due_at, current_user.user_id))
        new_quiz = cur.fetchone()

        position = 0
        total_needed = data.question_count or (len(weeks) * data.questions_per_topic)
        per_week = max(1, (total_needed + len(weeks) - 1) // len(weeks))

        for week in weeks:
            query = """
                SELECT qq.question_type, qq.prompt, qq.options, qq.correct_answer, qq.accepted_answers,
                       qq.explanation, qq.topic, qq.citation
                FROM quiz_questions qq
                JOIN quizzes q ON q.id = qq.quiz_id
                WHERE q.course_id = %s AND q.week_number = %s
                  AND q.quiz_type = 'lesson'
            """
            params = [course_id, week]
            if data.question_types and len(data.question_types) > 0:
                query += " AND qq.question_type = ANY(%s)"
                params.append(data.question_types)

            query += " ORDER BY RANDOM() LIMIT %s;"
            params.append(per_week)

            cur.execute(query, tuple(params))
            for q in cur.fetchall():
                if position >= total_needed:
                    break
                position += 1
                cur.execute("""
                    INSERT INTO quiz_questions (quiz_id, position, question_type, prompt, options,
                                                correct_answer, accepted_answers, explanation, topic, citation)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
                """, (new_quiz["id"], position, q["question_type"], q["prompt"],
                      Json(q["options"]) if q["options"] is not None else None,
                      q["correct_answer"],
                      Json(q["accepted_answers"]) if q["accepted_answers"] is not None else None,
                      q["explanation"], q["topic"],
                      Json(q["citation"]) if q["citation"] is not None else None))

        # Fallback without question_types filter if filtered query returned no questions
        if position == 0 and data.question_types and len(data.question_types) > 0:
            for week in weeks:
                cur.execute("""
                    SELECT qq.question_type, qq.prompt, qq.options, qq.correct_answer, qq.accepted_answers,
                           qq.explanation, qq.topic, qq.citation
                    FROM quiz_questions qq
                    JOIN quizzes q ON q.id = qq.quiz_id
                    WHERE q.course_id = %s AND q.week_number = %s
                      AND q.quiz_type = 'lesson'
                    ORDER BY RANDOM()
                    LIMIT %s;
                """, (course_id, week, per_week))
                for q in cur.fetchall():
                    if position >= total_needed:
                        break
                    position += 1
                    cur.execute("""
                        INSERT INTO quiz_questions (quiz_id, position, question_type, prompt, options,
                                                    correct_answer, accepted_answers, explanation, topic, citation)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
                    """, (new_quiz["id"], position, q["question_type"], q["prompt"],
                          Json(q["options"]) if q["options"] is not None else None,
                          q["correct_answer"],
                          Json(q["accepted_answers"]) if q["accepted_answers"] is not None else None,
                          q["explanation"], q["topic"],
                          Json(q["citation"]) if q["citation"] is not None else None))

        if position == 0:
            raise HTTPException(status_code=400, detail="Các tuần đã chọn chưa có câu hỏi nào")

    return {
        "quiz_id": str(new_quiz["id"]),
        "title": new_quiz["title"],
        "weeks": weeks,
        "question_count": position,
        "scored_component": "comprehensive_score",
    }


# ────────────────────── instructor endpoints ──────────────────────

@router.get("/manage/all", dependencies=[Depends(require_role(*STAFF))])
def list_quizzes_for_staff(course_id: str, current_user: UserPayload = Depends(require_course_access)):
    """Every quiz in the course, including drafts and AI-generated drafts awaiting review."""
    with get_db() as cur:
        cur.execute("""
            SELECT q.id, q.week_number, q.title, q.quiz_type, q.source, q.status,
                   q.points_per_question, q.time_limit_seconds, q.due_at, q.material_id,
                   COUNT(qq.id) AS question_count,
                   (SELECT COUNT(*) FROM quiz_attempts a WHERE a.quiz_id = q.id) AS attempt_count,
                   (SELECT COUNT(DISTINCT a.student_id) FROM quiz_attempts a WHERE a.quiz_id = q.id) AS student_count,
                   (SELECT AVG(a.score / NULLIF(a.max_score, 0)) FROM quiz_attempts a
                     WHERE a.quiz_id = q.id AND a.attempt_number = 1) AS first_attempt_avg_ratio
            FROM quizzes q
            LEFT JOIN quiz_questions qq ON qq.quiz_id = q.id
            WHERE q.course_id = %s
            GROUP BY q.id
            ORDER BY q.week_number NULLS LAST, q.created_at;
        """, (course_id,))
        rows = cur.fetchall()
    return [{
        **r,
        "id": str(r["id"]),
        "material_id": str(r["material_id"]) if r["material_id"] else None,
        "due_at": _iso(r["due_at"]),
        "points_per_question": float(r["points_per_question"]),
        "first_attempt_avg_ratio": round(float(r["first_attempt_avg_ratio"]), 3)
                                   if r["first_attempt_avg_ratio"] is not None else None,
    } for r in rows]


@router.post("/", dependencies=[Depends(require_role(*STAFF))], status_code=status.HTTP_201_CREATED)
def create_quiz(course_id: str, data: QuizCreate, current_user: UserPayload = Depends(require_course_access)):
    """
    Create a quiz. It always starts as `draft`: an AI-generated draft cannot reach
    students without an instructor publishing it.
    """
    with get_db() as cur:
        _check_material_in_course(cur, course_id, data.material_id)
        quiz_type = data.quiz_type or ('comprehensive' if data.week_number is None else 'lesson')
        cur.execute("""
            INSERT INTO quizzes (course_id, material_id, week_number, title, description, quiz_type, source,
                                 status, points_per_question, time_limit_seconds, due_at, created_by)
            VALUES (%s, %s, %s, %s, %s, %s, %s, 'draft', %s, %s, %s, %s)
            RETURNING id, title, status, source;
        """, (course_id, data.material_id, data.week_number, data.title, data.description, quiz_type, data.source,
              data.points_per_question, data.time_limit_seconds, data.due_at, current_user.user_id))
        quiz = cur.fetchone()
        _insert_questions(cur, quiz["id"], data.questions)

    return {
        "id": str(quiz["id"]),
        "title": quiz["title"],
        "status": quiz["status"],
        "source": quiz["source"],
        "question_count": len(data.questions),
    }


@router.put("/{quiz_id}", dependencies=[Depends(require_role(*STAFF))])
def update_draft_quiz(course_id: str, quiz_id: str, data: QuizCreate,
                      current_user: UserPayload = Depends(require_course_access)):
    """
    Review/edit step before publishing: replace a draft quiz's settings and questions.
    Only drafts without attempts can be edited, so a graded attempt always matches the
    questions that were actually asked. Unpublish a quiz (status → draft) to edit it.
    """
    with get_db() as cur:
        quiz = _load_quiz(cur, course_id, quiz_id)
        if quiz["status"] != "draft":
            raise HTTPException(status_code=409, detail="Only draft quizzes can be edited; unpublish it first")
        cur.execute("SELECT COUNT(*) AS n FROM quiz_attempts WHERE quiz_id = %s;", (quiz_id,))
        if cur.fetchone()["n"] > 0:
            raise HTTPException(status_code=409, detail="This quiz already has attempts and cannot be edited")
        _check_material_in_course(cur, course_id, data.material_id)

        quiz_type = data.quiz_type or quiz.get("quiz_type") or ('comprehensive' if data.week_number is None else 'lesson')
        # The source is kept: an AI draft stays labelled as AI-assisted after review.
        cur.execute("""
            UPDATE quizzes SET title = %s, description = %s, week_number = %s, material_id = %s,
                   quiz_type = %s,
                   points_per_question = %s, time_limit_seconds = %s, due_at = %s, updated_at = NOW()
            WHERE id = %s;
        """, (data.title, data.description, data.week_number, data.material_id,
              quiz_type,
              data.points_per_question, data.time_limit_seconds, data.due_at, quiz_id))
        cur.execute("DELETE FROM quiz_questions WHERE quiz_id = %s;", (quiz_id,))
        _insert_questions(cur, quiz_id, data.questions)

    return {"id": quiz_id, "status": "draft", "question_count": len(data.questions)}


@router.get("/{quiz_id}/manage", dependencies=[Depends(require_role(*STAFF))])
def get_quiz_for_staff(course_id: str, quiz_id: str, current_user: UserPayload = Depends(require_course_access)):
    """Full quiz including correct answers — for instructor review before publishing."""
    with get_db() as cur:
        quiz = _load_quiz(cur, course_id, quiz_id)
        cur.execute("""
            SELECT id, position, question_type, prompt, options, correct_answer, accepted_answers,
                   explanation, topic, citation
            FROM quiz_questions WHERE quiz_id = %s ORDER BY position;
        """, (quiz_id,))
        questions = [{
            **dict(q),
            "id": str(q["id"]),
            "correct_answer": _decode_answer(q["question_type"], q["correct_answer"]),
        } for q in cur.fetchall()]
    return {
        **_quiz_header(quiz),
        "created_by": str(quiz["created_by"]) if quiz["created_by"] else None,
        "questions": questions,
    }


@router.patch("/{quiz_id}/status", dependencies=[Depends(require_role("instructor", "admin"))])
def update_quiz_status(
    course_id: str,
    quiz_id: str,
    data: QuizStatusUpdate,
    current_user: UserPayload = Depends(require_course_access)
):
    """Instructor review gate: a quiz with no questions can never be published."""
    with get_db() as cur:
        _load_quiz(cur, course_id, quiz_id)
        if data.status == "published":
            cur.execute("SELECT COUNT(*) AS n FROM quiz_questions WHERE quiz_id = %s;", (quiz_id,))
            if cur.fetchone()["n"] == 0:
                raise HTTPException(status_code=400, detail="Cannot publish a quiz with no questions")

        cur.execute("""
            UPDATE quizzes SET status = %s, updated_at = NOW()
            WHERE id = %s AND course_id = %s
            RETURNING id, title, status;
        """, (data.status, quiz_id, course_id))
        updated = cur.fetchone()
    return {**updated, "id": str(updated["id"])}


@router.get("/{quiz_id}/attempts", dependencies=[Depends(require_role(*STAFF))])
def list_attempts_for_staff(course_id: str, quiz_id: str, current_user: UserPayload = Depends(require_course_access)):
    """Who took the quiz and how they scored. Private notes are never joined here."""
    with get_db() as cur:
        _load_quiz(cur, course_id, quiz_id)
        cur.execute("""
            SELECT u.name, u.email, a.attempt_number, a.correct_count, a.total_questions,
                   a.score, a.max_score, a.points_awarded, a.submitted_at
            FROM quiz_attempts a JOIN users u ON u.id = a.student_id
            WHERE a.quiz_id = %s
            ORDER BY a.submitted_at DESC;
        """, (quiz_id,))
        rows = cur.fetchall()
    return [{
        **r,
        "score": float(r["score"]),
        "max_score": float(r["max_score"]),
        "points_awarded": float(r["points_awarded"]),
        "submitted_at": str(r["submitted_at"]),
    } for r in rows]


@router.get("/{quiz_id}/question-stats", dependencies=[Depends(require_role(*STAFF))])
def question_stats_for_staff(course_id: str, quiz_id: str, current_user: UserPayload = Depends(require_course_access)):
    """
    Aggregate correctness per question (first attempts only) — the basis of the
    class misconception view. Counts only; no student identity and no private notes.
    """
    with get_db() as cur:
        _load_quiz(cur, course_id, quiz_id)
        cur.execute("""
            SELECT qq.id, qq.position, qq.prompt, qq.topic,
                   COUNT(fa.attempt_id) AS answered,
                   COUNT(fa.attempt_id) FILTER (WHERE fa.is_correct) AS correct
            FROM quiz_questions qq
            LEFT JOIN (
                SELECT aa.question_id, aa.attempt_id, aa.is_correct
                FROM quiz_attempt_answers aa
                JOIN quiz_attempts a ON a.id = aa.attempt_id
                WHERE a.attempt_number = 1
            ) fa ON fa.question_id = qq.id
            WHERE qq.quiz_id = %s
            GROUP BY qq.id
            ORDER BY qq.position;
        """, (quiz_id,))
        rows = cur.fetchall()
    return [{
        "question_id": str(r["id"]),
        "position": r["position"],
        "prompt": r["prompt"],
        "topic": r["topic"],
        "answered": r["answered"],
        "correct": r["correct"],
        "correct_ratio": round(r["correct"] / r["answered"], 3) if r["answered"] else None,
    } for r in rows]


@router.delete("/{quiz_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_quiz(course_id: str, quiz_id: str, current_user: UserPayload = Depends(require_course_access)):
    """
    Delete a quiz that nobody has taken yet.

    Staff may remove a lesson quiz from their own course; a student may remove a
    comprehensive quiz they generated for themselves. A quiz with attempts is kept
    (409) so submitted work and the points derived from it are never silently erased.
    """
    with get_db() as cur:
        quiz = _load_quiz(cur, course_id, quiz_id)

        if quiz["quiz_type"] == "comprehensive":
            allowed = _is_staff(current_user) or str(quiz["created_by"]) == current_user.user_id
        else:
            allowed = _is_staff(current_user)
        if not allowed:
            raise HTTPException(status_code=403, detail="Not permitted to delete this quiz")

        cur.execute("SELECT COUNT(*) AS n FROM quiz_attempts WHERE quiz_id = %s;", (quiz_id,))
        if cur.fetchone()["n"] > 0:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This quiz already has submitted attempts and cannot be deleted"
            )

        cur.execute("DELETE FROM quizzes WHERE id = %s AND course_id = %s;", (quiz_id, course_id))
    return None
