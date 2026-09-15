from datetime import date, timedelta
from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from auth import UserPayload, get_current_user
from middleware import require_role, require_course_access
from database import get_db

router = APIRouter(prefix="/courses/{course_id}/scores", tags=["Scores & Analytics"])

class ScoreActivityUpdate(BaseModel):
    activity_type: str  # 'quiz', 'comprehensive_quiz', 'active_learning'
    points_earned: float

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

@router.post("/activity")
def record_activity(
    course_id: str,
    data: ScoreActivityUpdate,
    current_user: UserPayload = Depends(require_course_access)
):
    """
    Update student scores and advance/reset streak based on active date.
    """
    today = date.today()
    with get_db() as cur:
        cur.execute("""
            SELECT streak_days, last_active_date, quiz_score, comprehensive_score, active_score
            FROM student_scores
            WHERE student_id = %s AND course_id = %s;
        """, (current_user.user_id, course_id))
        existing = cur.fetchone()

        if not existing:
            streak = 1
            quiz = data.points_earned if data.activity_type == 'quiz' else 0.0
            comp = data.points_earned if data.activity_type == 'comprehensive_quiz' else 0.0
            active = data.points_earned if data.activity_type == 'active_learning' else 0.0
            cur.execute("""
                INSERT INTO student_scores (student_id, course_id, streak_days, quiz_score, comprehensive_score, active_score, last_active_date)
                VALUES (%s, %s, %s, %s, %s, %s, %s);
            """, (current_user.user_id, course_id, streak, quiz, comp, active, today))
        else:
            last_date = existing["last_active_date"]
            if last_date == today:
                streak = existing["streak_days"]
            elif last_date == today - timedelta(days=1):
                streak = existing["streak_days"] + 1
            else:
                streak = 1
            
            quiz = float(existing["quiz_score"]) + (data.points_earned if data.activity_type == 'quiz' else 0.0)
            comp = float(existing["comprehensive_score"]) + (data.points_earned if data.activity_type == 'comprehensive_quiz' else 0.0)
            active = float(existing["active_score"]) + (data.points_earned if data.activity_type == 'active_learning' else 0.0)

            cur.execute("""
                UPDATE student_scores
                SET streak_days = %s, quiz_score = %s, comprehensive_score = %s, active_score = %s,
                    last_active_date = %s, updated_at = NOW()
                WHERE student_id = %s AND course_id = %s;
            """, (streak, quiz, comp, active, today, current_user.user_id, course_id))
        
        return {
            "status": "success",
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
