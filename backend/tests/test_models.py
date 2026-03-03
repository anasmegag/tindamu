"""Tests — Modèles Messagerie (Conversation, ConversationMember, Message)."""


def test_create_conversation(db):
    """Test création d'une conversation."""
    from app.models.conversation import Conversation, ConversationType

    conv = Conversation(type=ConversationType.PRIVEE)
    db.session.add(conv)
    db.session.commit()

    assert conv.id is not None
    assert conv.type == ConversationType.PRIVEE


def test_create_general_conversation(db):
    """Test conversation générale avec niveau."""
    from app.models.conversation import Conversation, ConversationType

    conv = Conversation(type=ConversationType.GENERALE, niveau='L1', nom='Discussion L1')
    db.session.add(conv)
    db.session.commit()

    assert conv.niveau == 'L1'
    assert conv.nom == 'Discussion L1'


def test_conversation_member(db, two_users):
    """Test ajout de membres à une conversation."""
    from app.models.conversation import Conversation, ConversationMember, ConversationType, MemberRole

    u1, u2, _, _ = two_users
    conv = Conversation(type=ConversationType.PRIVEE, created_by=u1.id)
    db.session.add(conv)
    db.session.flush()

    m1 = ConversationMember(conversation_id=conv.id, user_id=u1.id, role=MemberRole.MEMBRE)
    m2 = ConversationMember(conversation_id=conv.id, user_id=u2.id, role=MemberRole.MEMBRE)
    db.session.add_all([m1, m2])
    db.session.commit()

    assert conv.members.count() == 2


def test_create_message(db, two_users):
    """Test envoi d'un message."""
    from app.models.conversation import Conversation, ConversationType, ConversationMember, MemberRole
    from app.models.message import Message, MessageType

    u1, _, _, _ = two_users
    conv = Conversation(type=ConversationType.PRIVEE)
    db.session.add(conv)
    db.session.flush()
    db.session.add(ConversationMember(conversation_id=conv.id, user_id=u1.id, role=MemberRole.MEMBRE))

    msg = Message(conversation_id=conv.id, sender_id=u1.id, contenu='Hello !', type_message=MessageType.TEXTE)
    db.session.add(msg)
    db.session.commit()

    assert msg.id is not None
    assert msg.contenu == 'Hello !'
    assert msg.sender.prenom == 'Alice'


def test_conversation_to_dict(db, two_users):
    """Test sérialisation JSON."""
    from app.models.conversation import Conversation, ConversationType

    conv = Conversation(type=ConversationType.GENERALE, niveau='M1', nom='Test')
    db.session.add(conv)
    db.session.commit()

    data = conv.to_dict()
    assert data['type'] == 'GENERALE'
    assert data['niveau'] == 'M1'
    assert 'id' in data
    assert 'created_at' in data


def test_message_to_dict(db, two_users):
    """Test sérialisation message avec sender."""
    from app.models.conversation import Conversation, ConversationType, ConversationMember, MemberRole
    from app.models.message import Message, MessageType

    u1, _, _, _ = two_users
    conv = Conversation(type=ConversationType.PRIVEE)
    db.session.add(conv)
    db.session.flush()
    db.session.add(ConversationMember(conversation_id=conv.id, user_id=u1.id, role=MemberRole.MEMBRE))

    msg = Message(conversation_id=conv.id, sender_id=u1.id, contenu='Test', type_message=MessageType.TEXTE)
    db.session.add(msg)
    db.session.commit()

    data = msg.to_dict()
    assert data['contenu'] == 'Test'
    assert data['sender']['prenom'] == 'Alice'
    assert data['type_message'] == 'TEXTE'
