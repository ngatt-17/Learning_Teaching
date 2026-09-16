from datetime import date, timedelta
from typing import Literal, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status
from auth import UserPayload, get_current_user
from middleware import require_role, require_course_access
from database import get_db

router = APIRouter(prefix="/courses/{course_id}/scores", tags=["Scores & Analytics"])

# Hard ceiling per award. The score columns are NUMERIC(5,2), so an unbounded
# value overflows the column and surfaces as a 500 instead of a validation error.
MAX_POINTS_PER_AWARD = 100.0
MAX_COMPONENT_TOTAL = 999.99


class ScoreAward(BaseModel):
    """
    Staff-issued score award.

    Points are never accepted from the student being scored: this endpoint is the
    instructor/TA grading channel. The automated path (a student submitting a quiz
    and the server grading it against stored answers) will call the same write with
    server-computed points once the quiz feature lands.
    """
    student_id: str
    activity_type: Literal["quiz", "comprehensive_quiz", "active_learning"]
    points_earned: float = Field(gt=0, le=MAX_POINTS_PER_AWARD)

@router.get("/my-score")
def get_my_score(course_id: str, current_user: UserPayload = Depends(require_course_access)):
    """
    Get student's own score breakdown and streak.
    Score = Streak bonus + Quiz tài liệu + Quiz tổng hợp + Active learning
    """
    with get_db() as cur:
        cur.execute("""
            SELECT student_id, course_id, streak_days, quiz_score,
                   comprehensive_score, active_score, last_active_date, updated_at
            FROM student_scores
            WHERE student_id = %s AND course_id = %s;
        """, (current_user.user_id, course_id))
        score = cur.fetchone()
        if not score:
            # Return empty baseline
            return {
                "streak_days": 0,
                "quiz_score": 0.0,
                "comprehensive_score": 0.0,
                "active_score": 0.0,
                "total_score": 0.0
            }
        
        quiz = float(score["quiz_score"])
        comp = float(score["comprehensive_score"])
        active = float(score["active_score"])
        streak = score["streak_days"]
        # Formula: streak bonus (e.g. 2 pts per day) + components
        total = (streak * 2.0) + quiz + comp + active

        return {
            "streak_days": streak,
            "quiz_score": quiz,
            "comprehensive_score": comp,
            "active_score": active,
            "total_score": round(total, 2),
            "last_active_date": str(score["last_active_date"]) if score["last_active_date"] else None
        }

@router.post("/activity", dependencies=[Depends(require_role("instructor", "ta", "admin"))])
def award_activity_points(
    course_id: str,
    data: ScoreAward,
    current_user: UserPayload = Depends(require_course_access)
):
    """
    Award score to a student and advance/reset their streak.

    Restricted to instructors, TAs and admins: a student must never be able to write
    their own score. Anything a student does that earns points (quiz, comprehensive
    quiz, active learning game) has to be graded server-side from stored answers
    before it reaches this write.
    """
    with get_db() as cur:
        cur.execute(
            "SELECT 1 FROM enrollments WHERE user_id = %s AND course_id = %s AND role = 'student';",
            (data.student_id, course_id)
        )
        if not cur.fetchone():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="That user is not enrolled as a student in this course"
            )

        today = date.today()
        cur.execute("""
            SELECT streak_days, last_active_date, quiz_score, comprehensive_score, active_score
            FROM student_scores
            WHERE student_id = %s AND course_id = %s;
        """, (data.student_id, course_id))
        existing = cur.fetchone()

        if not existing:
            streak = 1
            quiz = comp = active = 0.0
        else:
            last_date = existing["last_active_date"]
            if last_date == today:
                streak = existing["streak_days"]
            elif last_date == today - timedelta(days=1):
                streak = existing["streak_days"] + 1
            else:
                streak = 1
            quiz = float(existing["quiz_score"])
            comp = float(existing["comprehensive_score"])
            active = float(existing["active_score"])

        if data.activity_type == "quiz":
            quiz += data.points_earned
            new_component = quiz
        elif data.activity_type == "comprehensive_quiz":
            comp += data.points_earned
            new_component = comp
        else:
            active += data.points_earned
            new_component = active

        if new_component > MAX_COMPONENT_TOTAL:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Component total would exceed the maximum storable score ({MAX_COMPONENT_TOTAL})"
            )

        if not existing:
            cur.execute("""
                INSERT INTO student_scores (student_id, course_id, streak_days, quiz_score,
                                            comprehensive_score, active_score, last_active_date)
                VALUES (%s, %s, %s, %s, %s, %s, %s);
            """, (data.student_id, course_id, streak, quiz, comp, active, today))
        else:
            cur.execute("""
                UPDATE student_scores
                SET streak_days = %s, quiz_score = %s, comprehensive_score = %s, active_score = %s,
                    last_active_date = %s, updated_at = NOW()
                WHERE student_id = %s AND course_id = %s;
            """, (streak, quiz, comp, active, today, data.student_id, course_id))

    return {
        "status": "success",
        "student_id": data.student_id,
        "awarded_by": current_user.user_id,
        "streak_days": streak,
        "activity_added": data.activity_type,
        "points_added": data.points_earned
    }


@router.get("/class-summary", dependencies=[Depends(require_role("instructor", "ta", "admin"))])
def get_class_summary(course_id: str, current_user: UserPayload = Depends(require_course_access)):
    """
    Instructor/Admin dashboard metrics:
    Aggregates quiz scores and active learning without ever exposing private notes.
    """
    with get_db() as cur:
        cur.execute("""
            SELECT COUNT(*) as total_students,
                   COALESCE(AVG(quiz_score), 0) as avg_quiz,
                   COALESCE(AVG(comprehensive_score), 0) as avg_comprehensive,
                   COALESCE(AVG(streak_days), 0) as avg_streak
            FROM student_scores
            WHERE course_id = %s;
        """, (course_id,))
        summary = cur.fetchone()
        return {
            "course_id": course_id,
            "total_active_students": summary["total_students"],
            "average_quiz_score": round(float(summary["avg_quiz"]), 2),
            "average_comprehensive_score": round(float(summary["avg_comprehensive"]), 2),
            "average_streak_days": round(float(summary["avg_streak"]), 1),
            "privacy_guarantee": "Private notes and private workspace queries are excluded from this dashboard"
        }


@router.get("/students", dependencies=[Depends(require_role("instructor", "ta", "admin"))])
def list_student_scores(course_id: str, current_user: UserPayload = Depends(require_course_access)):
    """
    Instructor dashboard roster with per-student score breakdown
    ("Student A — 95đ | Xem chi tiết").

    Students enrolled but with no recorded activity are returned with zeros so the
    dashboard reconciles with the enrolment list. Private notes are never joined here.
    """
    with get_db() as cur:
        cur.execute("""
            SELECT u.id, u.name, u.email,
                   COALESCE(s.streak_days, 0)          AS streak_days,
                   COALESCE(s.quiz_score, 0)           AS quiz_score,
                   COALESCE(s.comprehensive_score, 0)  AS comprehensive_score,
                   COALESCE(s.active_score, 0)         AS active_score,
                   s.last_active_date
            FROM enrollments e
            JOIN users u ON u.id = e.user_id
            LEFT JOIN student_scores s ON s.student_id = u.id AND s.course_id = e.course_id
            WHERE e.course_id = %s AND e.role = 'student'
            ORDER BY u.name;
        """, (course_id,))
        rows = cur.fetchall()

    students = []
    for r in rows:
        quiz = float(r["quiz_score"])
        comp = float(r["comprehensive_score"])
        active = float(r["active_score"])
        streak = r["streak_days"]
        students.append({
            "student_id": str(r["id"]),
            "name": r["name"],
            "email": r["email"],
            "streak_days": streak,
            "quiz_score": quiz,
            "comprehensive_score": comp,
            "active_score": active,
            "total_score": round(streak * 2.0 + quiz + comp + active, 2),
            "last_active_date": str(r["last_active_date"]) if r["last_active_date"] else None,
        })

    students.sort(key=lambda s: s["total_score"], reverse=True)
    return {
        "course_id": course_id,
        "total_students": len(students),
        "students": students,
        "privacy_guarantee": "Private notes and private workspace queries are excluded from this dashboard"
    }
