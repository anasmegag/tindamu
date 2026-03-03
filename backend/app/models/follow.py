import uuid
from datetime import datetime, timezone

from app import db


class Follow(db.Model):
    __tablename__ = "follows"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    follower_id = db.Column(
        db.String(36), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    followed_id = db.Column(
        db.String(36), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    created_at = db.Column(
        db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    __table_args__ = (
        db.UniqueConstraint("follower_id", "followed_id", name="uq_follow_pair"),
        db.CheckConstraint("follower_id != followed_id", name="ck_no_self_follow"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "follower_id": self.follower_id,
            "followed_id": self.followed_id,
            "created_at": self.created_at.isoformat(),
        }

    def __repr__(self):
        return f"<Follow {self.follower_id} → {self.followed_id}>"
