import enum
from datetime import datetime, timezone

from app import db


class MessageType(enum.Enum):
    """Types de message."""
    TEXTE = "TEXTE"
    FICHIER = "FICHIER"
    IMAGE = "IMAGE"


class Message(db.Model):
    """Modèle Message — Messages dans une conversation."""
    __tablename__ = 'messages'

    id = db.Column(db.Integer, primary_key=True)
    conversation_id = db.Column(
        db.Integer,
        db.ForeignKey('conversations.id', ondelete='CASCADE'),
        nullable=False
    )
    # FK vers User (UUID string)
    sender_id = db.Column(
        db.String(36),
        db.ForeignKey('users.id', ondelete='CASCADE'),
        nullable=False
    )
    contenu = db.Column(db.Text, nullable=False)
    type_message = db.Column(
        db.Enum(MessageType),
        nullable=False,
        default=MessageType.TEXTE
    )
    file_url = db.Column(db.String(500), nullable=True)
    created_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True
    )
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relation vers User pour accéder au nom de l'expéditeur
    sender = db.relationship('User', backref='messages_sent', lazy='joined')

    # Index composite pour les requêtes par conversation triées par date
    __table_args__ = (
        db.Index('ix_messages_conv_date', 'conversation_id', 'created_at'),
    )

    def to_dict(self):
        """Sérialisation JSON."""
        data = {
            'id': self.id,
            'conversation_id': self.conversation_id,
            'sender_id': self.sender_id,
            'contenu': self.contenu,
            'type_message': self.type_message.value,
            'file_url': self.file_url,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
        }
        # Inclure les infos de l'expéditeur si chargé
        if self.sender:
            data['sender'] = {
                'id': self.sender.id,
                'nom': self.sender.nom,
                'prenom': self.sender.prenom,
                'avatar_url': self.sender.avatar_url,
            }
        return data

    def __repr__(self):
        return f'<Message {self.id} conv={self.conversation_id} from={self.sender_id}>'
