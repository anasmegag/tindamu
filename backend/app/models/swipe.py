"""
models/swipe.py — Swipe d'un étudiant sur un Post.

On swipe sur un POST, pas sur une personne.
  LIKE  → intérêt pour le post / envie de se connecter avec l'auteur
  SKIP  → pas intéressé

Si swiper_id aime post A (auteur B) ET que B aime post C (auteur swiper_id)
→ Match automatique → conversation créée.

Contrainte unique : un étudiant ne peut swiper qu'une fois par post.
"""

import enum
import uuid
from datetime import datetime, timezone

from app import db


class SwipeDirectionEnum(enum.Enum):
    LIKE = "LIKE"
    SKIP = "SKIP"


class Swipe(db.Model):
    __tablename__ = "swipes"
    __table_args__ = (
        # Un étudiant ne peut swiper qu'une fois sur un post donné
        db.UniqueConstraint("swiper_id", "post_id", name="uq_swipe_user_post"),
    )

    id = db.Column(
        db.String(36), primary_key=True,
        default=lambda: str(uuid.uuid4())
    )

    # ── Qui swipe ─────────────────────────────────────────────────────
    swiper_id = db.Column(
        db.String(36),
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # ── Sur quel post ─────────────────────────────────────────────────
    post_id = db.Column(
        db.String(36),
        db.ForeignKey("posts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # ── Auteur du post (dénormalisé pour éviter une jointure) ─────────
    post_author_id = db.Column(
        db.String(36),
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    # ── Décision ──────────────────────────────────────────────────────
    direction = db.Column(db.Enum(SwipeDirectionEnum), nullable=False)

    # ── Méta ──────────────────────────────────────────────────────────
    created_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # ── Relations ─────────────────────────────────────────────────────
    swiper      = db.relationship("User", foreign_keys=[swiper_id],      backref=db.backref("swipes_done",     lazy="dynamic"))
    post_author = db.relationship("User", foreign_keys=[post_author_id], backref=db.backref("swipes_received", lazy="dynamic"))

    def to_dict(self):
        return {
            "id":            self.id,
            "swiper_id":     self.swiper_id,
            "post_id":       self.post_id,
            "post_author_id": self.post_author_id,
            "direction":     self.direction.value,
            "created_at":    self.created_at.isoformat(),
        }

    def __repr__(self):
        return f"<Swipe {self.swiper_id} → {self.direction.value} on post {self.post_id}>"
