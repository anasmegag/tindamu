"""
models/match.py — Match entre deux étudiants.

Un Match est créé automatiquement quand :
  - user1 LIKE le post de user2, ET
  - user2 LIKE le post de user1

À la création du Match, une Conversation privée est créée (via M3).
Jusqu'à ce que M3 soit prêt, conversation_id est nullable.
"""

import uuid
from datetime import datetime, timezone

from app import db


class Match(db.Model):
    __tablename__ = "matches"

    id = db.Column(
        db.String(36), primary_key=True,
        default=lambda: str(uuid.uuid4())
    )

    # ── Les deux utilisateurs matchés ─────────────────────────────────
    user1_id = db.Column(
        db.String(36),
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user2_id = db.Column(
        db.String(36),
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # ── Le post qui a déclenché le match ──────────────────────────────
    post_id = db.Column(
        db.String(36),
        db.ForeignKey("posts.id", ondelete="SET NULL"),
        nullable=True,
    )

    # ── Conversation créée par M3 (nullable tant que M3 n'est pas prêt)
    conversation_id = db.Column(
        db.String(36),
        nullable=True,   # FK vers conversations sera ajoutée par M3
    )

    # ── Méta ──────────────────────────────────────────────────────────
    created_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # ── Relations ─────────────────────────────────────────────────────
    user1 = db.relationship("User", foreign_keys=[user1_id], backref=db.backref("matches_as_user1", lazy="dynamic"))
    user2 = db.relationship("User", foreign_keys=[user2_id], backref=db.backref("matches_as_user2", lazy="dynamic"))
    post  = db.relationship("Post", backref=db.backref("matches", lazy="dynamic"))

    def to_dict(self):
        return {
            "id":              self.id,
            "user1_id":        self.user1_id,
            "user2_id":        self.user2_id,
            "post_id":         self.post_id,
            "conversation_id": self.conversation_id,
            "created_at":      self.created_at.isoformat(),
        }

    def __repr__(self):
        return f"<Match {self.user1_id} ↔ {self.user2_id} via post {self.post_id}>"
