import enum
import uuid
from datetime import datetime, timezone

from app import db


class DifficultyEnum(enum.Enum):
    FACILE = "FACILE"
    MOYEN = "MOYEN"
    DIFFICILE = "DIFFICILE"


class Quiz(db.Model):
    __tablename__ = "quizzes"

    # ── Identité ──────────────────────────────────────────────
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    difficulty = db.Column(db.Enum(DifficultyEnum), nullable=False, default=DifficultyEnum.MOYEN)
    time_limit = db.Column(db.Integer, nullable=True)  # en secondes, None = pas de limite
    is_published = db.Column(db.Boolean, default=False, nullable=False)

    # ── Auteur ────────────────────────────────────────────────
    created_by = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)

    # ── Méta ──────────────────────────────────────────────────
    created_at = db.Column(
        db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # ── Relations ─────────────────────────────────────────────
    author = db.relationship("User", backref=db.backref("quizzes", lazy="dynamic"))
    questions = db.relationship(
        "Question", backref="quiz", lazy="dynamic", cascade="all, delete-orphan"
    )
    results = db.relationship(
        "QuizResult", backref="quiz", lazy="dynamic", cascade="all, delete-orphan"
    )

    def to_dict(self, include_questions=False):
        data = {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "difficulty": self.difficulty.value,
            "time_limit": self.time_limit,
            "is_published": self.is_published,
            "created_by": self.created_by,
            "author": self.author.to_dict() if self.author else None,
            "questions_count": self.questions.count(),
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
        if include_questions:
            data["questions"] = [q.to_dict(include_options=True) for q in self.questions]
        return data

    def __repr__(self):
        return f"<Quiz {self.title} | {self.difficulty.value} | by {self.created_by}>"
