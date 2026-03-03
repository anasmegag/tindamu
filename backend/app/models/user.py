import enum
import uuid
from datetime import datetime, timezone

from app import db


class NiveauEnum(enum.Enum):
    L1 = "L1"
    L2 = "L2"
    L3 = "L3"
    M1 = "M1"
    M2 = "M2"


class User(db.Model):
    __tablename__ = "users"

    # ── Identité ──────────────────────────────────────────────
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id = db.Column(db.String(20), unique=True, nullable=False, index=True)
    email_univ = db.Column(db.String(150), unique=True, nullable=False, index=True)
    nom = db.Column(db.String(80), nullable=False)
    prenom = db.Column(db.String(80), nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)

    # ── Infos universitaires ──────────────────────────────────
    niveau = db.Column(db.Enum(NiveauEnum), nullable=False)
    specialite = db.Column(db.String(100), nullable=True)

    # ── Profil ────────────────────────────────────────────────
    bio = db.Column(db.Text, nullable=True)
    avatar_url = db.Column(db.String(500), nullable=True)

    # ── Gamification ──────────────────────────────────────────
    score_aide = db.Column(db.Integer, default=0, nullable=False)
    score_quiz = db.Column(db.Integer, default=0, nullable=False)

    # ── Méta ──────────────────────────────────────────────────
    is_active = db.Column(db.Boolean, default=True, nullable=False)
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
    following = db.relationship(
        "Follow",
        foreign_keys="Follow.follower_id",
        backref="follower",
        lazy="dynamic",
        cascade="all, delete-orphan",
    )
    followers = db.relationship(
        "Follow",
        foreign_keys="Follow.followed_id",
        backref="followed",
        lazy="dynamic",
        cascade="all, delete-orphan",
    )

    def to_dict(self, include_private=False):
        data = {
            "id": self.id,
            "nom": self.nom,
            "prenom": self.prenom,
            "niveau": self.niveau.value,
            "specialite": self.specialite,
            "bio": self.bio,
            "avatar_url": self.avatar_url,
            "score_aide": self.score_aide,
            "score_quiz": self.score_quiz,
            "followers_count": self.followers.count(),
            "following_count": self.following.count(),
            "created_at": self.created_at.isoformat(),
        }
        if include_private:
            data["student_id"] = self.student_id
            data["email_univ"] = self.email_univ
        return data

    def __repr__(self):
        return f"<User {self.prenom} {self.nom} | {self.niveau.value} | {self.student_id}>"
