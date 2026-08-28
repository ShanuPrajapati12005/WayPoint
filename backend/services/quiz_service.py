"""WayPoint — Quiz Service (generation + grading + caching)"""

from sqlalchemy.orm import Session
from models import QuizQuestion, QuizAttempt, Roadmap
from services.groq_service import generate_quiz_questions


def get_or_generate_quiz(role_id: str, skill_level: str, quiz_type: str, db: Session) -> list:
    """Get seeded quiz questions from the database if they exist (for initial quizzes).
    If none exist or it is a final quiz, generate fresh quiz questions with Groq.
    Returns list of {q, options} WITHOUT correct answer (security)."""

    if quiz_type == "initial":
        # Check if we have questions in the database
        existing_questions = (
            db.query(QuizQuestion)
            .filter(QuizQuestion.role_id == role_id)
            .order_by(QuizQuestion.order_index)
            .all()
        )

        if existing_questions:
            print(f"[QUIZ] Serving {len(existing_questions)} seeded questions from DB for: {role_id}")
            # Return without correct answer
            return [{"q": q.q, "options": q.options} for q in existing_questions]

    # Clean existing cached questions for this role to allow fresh grading
    db.query(QuizQuestion).filter(QuizQuestion.role_id == role_id).delete()
    db.commit()

    count = 20 if quiz_type == "final" else 10

    # Generate new questions with Groq (10 or 20 questions, tailored to skill_level)
    questions = generate_quiz_questions(role_id, count=count, skill_level=skill_level, quiz_type=quiz_type)

    # Cache in DB for grading future requests
    for i, q in enumerate(questions):
        db_q = QuizQuestion(
            role_id=role_id,
            q=q["q"],
            options=q["options"],
            correct_index=q["correct"],
            order_index=i,
        )
        db.add(db_q)
    db.commit()

    # Return without correct answer
    return [{"q": q["q"], "options": q["options"]} for q in questions]


def grade_quiz(role_id: str, answers: list, quiz_type: str, user_id: str, db: Session) -> dict:
    """Grade quiz answers against the stored correct answers.
    Returns {readiness_score, correct_count, total_count}."""

    questions = (
        db.query(QuizQuestion)
        .filter(QuizQuestion.role_id == role_id)
        .order_by(QuizQuestion.order_index)
        .all()
    )

    if not questions:
        # No questions cached — fallback score
        return {"readiness_score": 50, "correct_count": 0, "total_count": 0}

    total = min(len(questions), len(answers))
    correct = 0
    results = []
    for i in range(total):
        if i < len(answers) and answers[i] == questions[i].correct_index:
            correct += 1
        
        # Build detailed result for each question
        results.append({
            "q": questions[i].q,
            "options": questions[i].options,
            "user_answer": answers[i] if i < len(answers) else -1,
            "correct_answer": questions[i].correct_index,
            "is_correct": i < len(answers) and answers[i] == questions[i].correct_index
        })

    score = round((correct / total) * 100) if total > 0 else 0

    # Save attempt
    attempt = QuizAttempt(
        user_id=user_id,
        role_id=role_id,
        answers=answers,
        readiness_score=score,
        correct_count=correct,
        total_count=total,
    )
    db.add(attempt)
    db.commit()

    if quiz_type == "final":
        roadmap = db.query(Roadmap).filter(Roadmap.user_id == user_id, Roadmap.role_id == role_id, Roadmap.status == "active").first()
        if roadmap:
            new_skill_data = []
            for skill in roadmap.skill_data:
                current = skill.get("current", 0)
                target = skill.get("target", 100)
                
                # Reality check: The final assessment score overrides the self-reported "node completed" progress.
                # If they score poorly, the gap widens. If they score perfectly, it hits the target.
                new_current = int(target * (score / 100.0))
                
                new_skill_data.append({
                    "skill": skill["skill"],
                    "current": new_current,
                    "target": target
                })
            
            # Reassign to trigger SQLAlchemy JSON update
            roadmap.skill_data = new_skill_data
            db.commit()

    return {
        "readiness_score": score,
        "correct_count": correct,
        "total_count": total,
        "results": results,
    }
