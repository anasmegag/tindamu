import enum
from datetime import datetime, timezone

from app import db


class ConversationType(enum.Enum):
    """Types de conversation."""
    PRIVEE = "PRIVEE"
    GROUPE_PERSO = "GROUPE_PERSO"
    GENERALE = "GENERALE"


class MemberRole(enum.Enum):
    """Rôles dans une conversation."""
    ADMIN = "ADMIN"
    MEMBRE = "MEMBRE"


class Conversation(db.Model):
    """Modèle Conversation — 3 types : privée, groupe, générale."""
    __tablename__ = 'conversations'

    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(
        db.Enum(ConversationType),
        nullable=False,
        default=ConversationType.PRIVEE
    )
    # Pour les conversations GENERALE uniquement (L1, L2, L3, M1, M2)
    niveau = db.Column(db.String(10), nullable=True)
    # Pour les groupes personnels
    nom = db.Column(db.String(100), nullable=True)
    # Créateur — FK vers User (UUID string)
    created_by = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relations
    members = db.relationship(
        'ConversationMember',
        backref='conversation',
        lazy='dynamic',
        cascade='all, delete-orphan'
    )
    messages = db.relationship(
        'Message',
        backref='conversation',
        lazy='dynamic',
        cascade='all, delete-orphan',
        order_by='Message.created_at.desc()'
    )

    def to_dict(self, include_members=False, include_last_message=False):
        """Sérialisation JSON."""
        data = {
            'id': self.id,
            'type': self.type.value,
            'niveau': self.niveau,
            'nom': self.nom,
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat(),
        }
        if include_members:
            data['members'] = [m.to_dict() for m in self.members.all()]
        if include_last_message:
            last_msg = self.messages.first()
            data['last_message'] = last_msg.to_dict() if last_msg else None
        return data

    def __repr__(self):
        return f'<Conversation {self.id} type={self.type.value}>'


class ConversationMember(db.Model):
    """Modèle ConversationMember — Membres d'une conversation."""
    __tablename__ = 'conversation_members'

    id = db.Column(db.Integer, primary_key=True)
    conversation_id = db.Column(
        db.Integer,
        db.ForeignKey('conversations.id', ondelete='CASCADE'),
        nullable=False
    )
    # FK vers User (UUID string)
    user_id = db.Column(
        db.String(36),
        db.ForeignKey('users.id', ondelete='CASCADE'),
        nullable=False
    )
    role = db.Column(
        db.Enum(MemberRole),
        nullable=False,
        default=MemberRole.MEMBRE
    )
    joined_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Contrainte unique : un user ne peut être qu'une fois dans une conversation
    __table_args__ = (
        db.UniqueConstraint('conversation_id', 'user_id', name='uq_conv_member'),
    )

    def to_dict(self):
        """Sérialisation JSON."""
        return {
            'id': self.id,
            'conversation_id': self.conversation_id,
            'user_id': self.user_id,
            'role': self.role.value,
            'joined_at': self.joined_at.isoformat(),
        }

    def __repr__(self):
        return f'<ConversationMember conv={self.conversation_id} user={self.user_id}>'
