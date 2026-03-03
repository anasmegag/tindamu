"""Tests — Services conversation (create_private, create_general, etc.)."""


def test_create_private_conversation(db, two_users):
    """Test création d'une conversation privée."""
    from app.services.conversation_service import create_private_conversation

    u1, u2, _, _ = two_users
    conv = create_private_conversation(u1.id, u2.id)

    assert conv is not None
    assert conv.type.value == 'PRIVEE'
    assert conv.members.count() == 2


def test_create_private_no_duplicate(db, two_users):
    """Test qu'on ne crée pas de doublon de conversation privée."""
    from app.services.conversation_service import create_private_conversation

    u1, u2, _, _ = two_users
    conv1 = create_private_conversation(u1.id, u2.id)
    conv2 = create_private_conversation(u1.id, u2.id)

    assert conv1.id == conv2.id  # Même conversation


def test_create_general_conversation(db):
    """Test création de conversations générales."""
    from app.services.conversation_service import create_general_conversation

    conv = create_general_conversation('L1')
    assert conv.type.value == 'GENERALE'
    assert conv.niveau == 'L1'
    assert conv.nom == 'Discussion générale L1'


def test_create_general_no_duplicate(db):
    """Test pas de doublon pour les générales."""
    from app.services.conversation_service import create_general_conversation

    c1 = create_general_conversation('M2')
    c2 = create_general_conversation('M2')
    assert c1.id == c2.id


def test_add_user_to_general(db, two_users):
    """Test auto-join à la conversation de niveau."""
    from app.services.conversation_service import (
        create_general_conversation,
        add_user_to_general_conversation,
        is_member,
    )

    u1, _, _, _ = two_users
    create_general_conversation('L1')
    conv = add_user_to_general_conversation(u1.id, 'L1')

    assert is_member(conv.id, u1.id) is True


def test_is_member(db, two_users):
    """Test vérification membership."""
    from app.services.conversation_service import create_private_conversation, is_member

    u1, u2, _, _ = two_users
    conv = create_private_conversation(u1.id, u2.id)

    assert is_member(conv.id, u1.id) is True
    assert is_member(conv.id, 'inexistant-id') is False


def test_is_admin(db, two_users):
    """Test vérification admin."""
    from app.services.conversation_service import create_group_conversation, is_admin, is_member

    u1, u2, _, _ = two_users
    conv = create_group_conversation(u1.id, 'Mon groupe', [u2.id])

    assert is_admin(conv.id, u1.id) is True
    assert is_admin(conv.id, u2.id) is False
    assert is_member(conv.id, u2.id) is True


def test_create_group_conversation(db, two_users):
    """Test création de groupe personnel."""
    from app.services.conversation_service import create_group_conversation

    u1, u2, _, _ = two_users
    conv = create_group_conversation(u1.id, 'Projet TinAMU', [u2.id])

    assert conv.type.value == 'GROUPE_PERSO'
    assert conv.nom == 'Projet TinAMU'
    assert conv.members.count() == 2


def test_get_user_conversations(db, two_users):
    """Test récupération des conversations d'un user."""
    from app.services.conversation_service import (
        create_private_conversation,
        create_general_conversation,
        add_user_to_general_conversation,
        get_user_conversations,
    )

    u1, u2, _, _ = two_users
    create_private_conversation(u1.id, u2.id)
    create_general_conversation('L1')
    add_user_to_general_conversation(u1.id, 'L1')

    convs = get_user_conversations(u1.id)
    assert len(convs) == 2
