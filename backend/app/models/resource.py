"""
models/resource.py — Modèle pour les ressources pédagogiques.
"""
import enum
import uuid
from datetime import datetime, timezone

from app import db


class FileTypeEnum(enum.Enum):
    PDF = "PDF"
    CODE = "CODE"
    IMAGE = "IMAGE"
    AUTRE = "AUTRE"


class Resource(db.Model):
    __tablename__ = "resources"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    file_type = db.Column(db.Enum(FileTypeEnum), nullable=False, default=FileTypeEnum.AUTRE)
    file_url = db.Column(db.String(500), nullable=True)
    matiere = db.Column(db.String(100), nullable=True)
    niveau = db.Column(db.String(10), nullable=True)  # L1, L2, L3, M1, M2

    # Stats
    download_count = db.Column(db.Integer, default=0, nullable=False)

    # Auteur
    created_by = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)

    created_at = db.Column(
        db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    # Relations
    author = db.relationship("User", backref=db.backref("resources", lazy="dynamic"))
    ratings = db.relationship(
        "ResourceRating", backref="resource", lazy="dynamic", cascade="all, delete-orphan"
    )

    def to_dict(self):
        ratings = list(self.ratings)
        avg = (
            round(sum(r.rating for r in ratings) / len(ratings), 1) if ratings else 0
        )
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "file_type": self.file_type.value,
            "file_url": self.file_url,
            "matiere": self.matiere,
            "niveau": self.niveau,
            "download_count": self.download_count,
            "average_rating": avg,
            "ratings_count": len(ratings),
            "created_by": self.created_by,
            "author": self.author.to_dict() if self.author else None,
            "created_at": self.created_at.isoformat(),
        }

    def __repr__(self):
        return f"<Resource {self.title}>"


class ResourceRating(db.Model):
    __tablename__ = "resource_ratings"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    resource_id = db.Column(db.String(36), db.ForeignKey("resources.id"), nullable=False)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    rating = db.Column(db.Integer, nullable=False)  # 1-5
    comment = db.Column(db.Text, nullable=True)
    created_at = db.Column(
        db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    user = db.relationship("User", backref=db.backref("resource_ratings", lazy="dynamic"))

    __table_args__ = (
        db.UniqueConstraint("resource_id", "user_id", name="uq_resource_user_rating"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "resource_id": self.resource_id,
            "user_id": self.user_id,
            "rating": self.rating,
            "comment": self.comment,
            "created_at": self.created_at.isoformat(),
        }
