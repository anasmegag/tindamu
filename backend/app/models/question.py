import uuid
from datetime import datetime, timezone

from app import db


class Question(db.Model):
    __tablename__ = "questions"

    # ── Identité ──────────────────────────────────────────────
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    quiz_id = db.Column(db.String(36), db.ForeignKey("quizzes.id"), nullable=False)
    text = db.Column(db.Text, nullable=False)
    order = db.Column(db.Integer, nullable=False, default=0)

    # ── Méta ──────────────────────────────────────────────────
    created_at = db.Column(
        db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    # ── Relations ─────────────────────────────────────────────
    options = db.relationship(
        "Option", backref="question", lazy="dynamic", cascade="all, delete-orphan"
    )

    def to_dict(self, include_options=False):
        data = {
            "id": self.id,
            "quiz_id": self.quiz_id,
            "text": self.text,
            "order": self.order,
            "options_count": self.options.count(),
            "created_at": self.created_at.isoformat(),
        }
        if include_options:
            data["options"] = [o.to_dict() for o in self.options.order_by(Option.order)]
        return data

    def __repr__(self):
        return f"<Question {self.id[:8]} | Quiz {self.quiz_id[:8]}>"


class Option(db.Model):
    __tablename__ = "options"

    # ── Identité ──────────────────────────────────────────────
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    question_id = db.Column(db.String(36), db.ForeignKey("questions.id"), nullable=False)
    text = db.Column(db.String(500), nullable=False)
    is_correct = db.Column(db.Boolean, default=False, nullable=False)
    order = db.Column(db.Integer, nullable=False, default=0)

    def to_dict(self, reveal_answer=False):
        data = {
            "id": self.id,
            "question_id": self.question_id,
            "text": self.text,
            "order": self.order,
        }
        if reveal_answer:
            data["is_correct"] = self.is_correct
        return data

    def __repr__(self):
        return f"<Option {self.text[:30]} | {'✓' if self.is_correct else '✗'}>"
