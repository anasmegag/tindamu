"""
models/post.py — Post publié par un étudiant dans le Feed.

Un Post représente :
  - Une offre d'aide       (AIDE_OFFERTE)
  - Une demande d'aide     (AIDE_DEMANDEE)
  - Un partage de ressource (PARTAGE)

Les autres étudiants swipent sur ces posts pour se connecter
avec l'auteur — jamais directement sur la personne.
"""

import enum
import uuid
from datetime import datetime, timezone

from app import db


class PostTypeEnum(enum.Enum):
    AIDE_OFFERTE  = "AIDE_OFFERTE"
    AIDE_DEMANDEE = "AIDE_DEMANDEE"
    PARTAGE       = "PARTAGE"


class ThematiqueEnum(enum.Enum):
    STAGE       = "STAGE"
    ALTERNANCE  = "ALTERNANCE"
    COURS       = "COURS"
    PROJET      = "PROJET"
    AUTRE       = "AUTRE"


class PostStatusEnum(enum.Enum):
    ACTIF   = "ACTIF"
    EXPIRE  = "EXPIRE"
    RESOLU  = "RESOLU"


class Post(db.Model):
    __tablename__ = "posts"

    id = db.Column(
        db.String(36), primary_key=True,
        default=lambda: str(uuid.uuid4())
    )

    # ── Auteur ────────────────────────────────────────────────────────
    author_id = db.Column(
        db.String(36),
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # ── Catégorisation ────────────────────────────────────────────────
    type       = db.Column(db.Enum(PostTypeEnum),    nullable=False)
    thematique = db.Column(db.Enum(ThematiqueEnum),  nullable=False)
    status     = db.Column(
        db.Enum(PostStatusEnum),
        nullable=False,
        default=PostStatusEnum.ACTIF,
    )

    # ── Contenu ───────────────────────────────────────────────────────
    titre   = db.Column(db.String(200), nullable=False)
    contenu = db.Column(db.Text,        nullable=False)

    # tags stockés en JSON : ex. ["Python", "ML", "stage"]
    tags = db.Column(db.JSON, nullable=True, default=list)

    # ── Engagement ────────────────────────────────────────────────────
    likes_count = db.Column(db.Integer, default=0, nullable=False)

    # ── Méta ──────────────────────────────────────────────────────────
    created_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # ── Relations ─────────────────────────────────────────────────────
    author = db.relationship("User", backref=db.backref("posts", lazy="dynamic"))
    swipes = db.relationship(
        "Swipe", backref="post",
        lazy="dynamic",
        cascade="all, delete-orphan",
        foreign_keys="Swipe.post_id",
    )

    def to_dict(self):
        return {
            "id":          self.id,
            "author":      self.author.to_dict() if self.author else None,
            "type":        self.type.value,
            "thematique":  self.thematique.value,
            "status":      self.status.value,
            "titre":       self.titre,
            "contenu":     self.contenu,
            "tags":        self.tags or [],
            "likes_count": self.likes_count,
            "created_at":  self.created_at.isoformat(),
        }

    def __repr__(self):
        return f"<Post [{self.type.value}] {self.titre[:40]}>"
