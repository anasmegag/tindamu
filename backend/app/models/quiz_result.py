import uuid
from datetime import datetime, timezone

from app import db


class QuizResult(db.Model):
    __tablename__ = "quiz_results"

    # ── Identité ──────────────────────────────────────────────
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    quiz_id = db.Column(db.String(36), db.ForeignKey("quizzes.id"), nullable=False)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)

    # ── Résultats ─────────────────────────────────────────────
    score = db.Column(db.Integer, nullable=False, default=0)
    total_questions = db.Column(db.Integer, nullable=False, default=0)
    time_spent = db.Column(db.Integer, nullable=True)  # en secondes

    # ── Méta ──────────────────────────────────────────────────
    completed_at = db.Column(
        db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    # ── Relations ─────────────────────────────────────────────
    user = db.relationship("User", backref=db.backref("quiz_results", lazy="dynamic"))

    # ── Contrainte : un user ne peut faire un quiz qu'une fois ──
    __table_args__ = (
        db.UniqueConstraint("quiz_id", "user_id", name="uq_quiz_user"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "quiz_id": self.quiz_id,
            "user_id": self.user_id,
            "user": self.user.to_dict() if self.user else None,
            "score": self.score,
            "total_questions": self.total_questions,
            "percentage": round((self.score / self.total_questions) * 100) if self.total_questions > 0 else 0,
            "time_spent": self.time_spent,
            "completed_at": self.completed_at.isoformat(),
        }

    def __repr__(self):
        return f"<QuizResult {self.user_id[:8]} | Quiz {self.quiz_id[:8]} | {self.score}/{self.total_questions}>"
