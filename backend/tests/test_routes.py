"""Tests — Routes API Messagerie (#39) et Recherche (#41)."""
import json


# ──────────────────────────────────────────────────────────────
# MESSAGERIE (#39)
# ──────────────────────────────────────────────────────────────


def test_create_group_conversation(client, two_users):
    """POST /api/conversations — créer un groupe."""
    u1, u2, t1, _ = two_users
    resp = client.post('/api/conversations',
        json={'nom': 'Groupe test', 'member_ids': [u2.id]},
        headers={'Authorization': f'Bearer {t1}'}
    )
    assert resp.status_code == 201
    data = resp.get_json()
    assert data['nom'] == 'Groupe test'
    assert data['type'] == 'GROUPE_PERSO'
    assert len(data['members']) == 2


def test_create_group_no_name(client, two_users):
    """POST /api/conversations — erreur sans nom."""
    _, _, t1, _ = two_users
    resp = client.post('/api/conversations',
        json={'member_ids': ['someone']},
        headers={'Authorization': f'Bearer {t1}'}
    )
    assert resp.status_code == 422


def test_list_conversations(client, two_users):
    """GET /api/conversations — lister mes conversations."""
    u1, u2, t1, _ = two_users
    # Créer un groupe d'abord
    client.post('/api/conversations',
        json={'nom': 'Test', 'member_ids': [u2.id]},
        headers={'Authorization': f'Bearer {t1}'}
    )
    resp = client.get('/api/conversations',
        headers={'Authorization': f'Bearer {t1}'}
    )
    assert resp.status_code == 200
    data = resp.get_json()
    assert len(data) >= 1


def test_get_conversation_detail(client, two_users):
    """GET /api/conversations/:id — détail."""
    u1, u2, t1, _ = two_users
    create_resp = client.post('/api/conversations',
        json={'nom': 'Détail test', 'member_ids': [u2.id]},
        headers={'Authorization': f'Bearer {t1}'}
    )
    conv_id = create_resp.get_json()['id']

    resp = client.get(f'/api/conversations/{conv_id}',
        headers={'Authorization': f'Bearer {t1}'}
    )
    assert resp.status_code == 200
    assert resp.get_json()['nom'] == 'Détail test'


def test_get_conversation_forbidden(client, two_users):
    """GET /api/conversations/:id — accès interdit si non-membre."""
    u1, u2, t1, t2 = two_users
    # u1 crée un groupe SANS u2 (juste u1 + un fake id)
    from app.models.user import User, NiveauEnum
    from app import bcrypt, db
    u3 = User(student_id='T003', email_univ='t3@u.fr', nom='X', prenom='Y',
              password_hash=bcrypt.generate_password_hash('t').decode(), niveau=NiveauEnum.M1)
    db.session.add(u3)
    db.session.commit()

    create_resp = client.post('/api/conversations',
        json={'nom': 'Privé', 'member_ids': [u3.id]},
        headers={'Authorization': f'Bearer {t1}'}
    )
    conv_id = create_resp.get_json()['id']

    # u2 essaie d'accéder
    resp = client.get(f'/api/conversations/{conv_id}',
        headers={'Authorization': f'Bearer {t2}'}
    )
    assert resp.status_code == 403


def test_send_and_list_messages(client, two_users):
    """POST + GET /api/conversations/:id/messages."""
    u1, u2, t1, _ = two_users

    create_resp = client.post('/api/conversations',
        json={'nom': 'Chat', 'member_ids': [u2.id]},
        headers={'Authorization': f'Bearer {t1}'}
    )
    conv_id = create_resp.get_json()['id']

    # Envoyer un message
    send_resp = client.post(f'/api/conversations/{conv_id}/messages',
        json={'contenu': 'Salut tout le monde !'},
        headers={'Authorization': f'Bearer {t1}'}
    )
    assert send_resp.status_code == 201
    assert send_resp.get_json()['contenu'] == 'Salut tout le monde !'

    # Lister les messages
    list_resp = client.get(f'/api/conversations/{conv_id}/messages',
        headers={'Authorization': f'Bearer {t1}'}
    )
    assert list_resp.status_code == 200
    data = list_resp.get_json()
    assert data['total'] == 1
    assert data['messages'][0]['contenu'] == 'Salut tout le monde !'


def test_send_message_empty(client, two_users):
    """POST /api/conversations/:id/messages — erreur contenu vide."""
    u1, u2, t1, _ = two_users
    create_resp = client.post('/api/conversations',
        json={'nom': 'Vide', 'member_ids': [u2.id]},
        headers={'Authorization': f'Bearer {t1}'}
    )
    conv_id = create_resp.get_json()['id']

    resp = client.post(f'/api/conversations/{conv_id}/messages',
        json={'contenu': ''},
        headers={'Authorization': f'Bearer {t1}'}
    )
    assert resp.status_code == 422


def test_leave_conversation(client, two_users):
    """DELETE /api/conversations/:id — quitter."""
    u1, u2, t1, t2 = two_users
    create_resp = client.post('/api/conversations',
        json={'nom': 'Leave', 'member_ids': [u2.id]},
        headers={'Authorization': f'Bearer {t1}'}
    )
    conv_id = create_resp.get_json()['id']

    resp = client.delete(f'/api/conversations/{conv_id}',
        headers={'Authorization': f'Bearer {t2}'}
    )
    assert resp.status_code == 200


# ──────────────────────────────────────────────────────────────
# RECHERCHE (#41)
# ──────────────────────────────────────────────────────────────


def test_search_users(client, two_users):
    """GET /api/users/search?q=alice."""
    _, _, t1, _ = two_users
    resp = client.get('/api/users/search?q=alice',
        headers={'Authorization': f'Bearer {t1}'}
    )
    assert resp.status_code == 200
    data = resp.get_json()
    assert data['total'] >= 1
    assert data['users'][0]['prenom'] == 'Alice'


def test_search_by_niveau(client, two_users):
    """GET /api/users/search?niveau=L2."""
    _, _, t1, _ = two_users
    resp = client.get('/api/users/search?niveau=L2',
        headers={'Authorization': f'Bearer {t1}'}
    )
    assert resp.status_code == 200
    data = resp.get_json()
    assert all(u['niveau'] == 'L2' for u in data['users'])


def test_get_user_profile(client, two_users):
    """GET /api/users/:id — profil public."""
    u1, _, t1, _ = two_users
    resp = client.get(f'/api/users/{u1.id}',
        headers={'Authorization': f'Bearer {t1}'}
    )
    assert resp.status_code == 200
    data = resp.get_json()
    assert data['nom'] == 'Dupont'
    assert 'is_following' in data


def test_follow_unfollow(client, two_users):
    """POST + DELETE /api/users/:id/follow."""
    u1, u2, t1, _ = two_users

    # Follow
    resp = client.post(f'/api/users/{u2.id}/follow',
        headers={'Authorization': f'Bearer {t1}'}
    )
    assert resp.status_code == 201

    # Double follow = erreur
    resp = client.post(f'/api/users/{u2.id}/follow',
        headers={'Authorization': f'Bearer {t1}'}
    )
    assert resp.status_code == 409

    # Unfollow
    resp = client.delete(f'/api/users/{u2.id}/follow',
        headers={'Authorization': f'Bearer {t1}'}
    )
    assert resp.status_code == 200


def test_follow_self(client, two_users):
    """POST /api/users/:id/follow — interdit de se suivre soi-même."""
    u1, _, t1, _ = two_users
    resp = client.post(f'/api/users/{u1.id}/follow',
        headers={'Authorization': f'Bearer {t1}'}
    )
    assert resp.status_code == 422


def test_followers_following(client, two_users):
    """GET /api/users/:id/followers + following."""
    u1, u2, t1, _ = two_users

    # u1 suit u2
    client.post(f'/api/users/{u2.id}/follow',
        headers={'Authorization': f'Bearer {t1}'}
    )

    # Followers de u2
    resp = client.get(f'/api/users/{u2.id}/followers',
        headers={'Authorization': f'Bearer {t1}'}
    )
    assert resp.status_code == 200
    assert len(resp.get_json()) == 1

    # Following de u1
    resp = client.get(f'/api/users/{u1.id}/following',
        headers={'Authorization': f'Bearer {t1}'}
    )
    assert resp.status_code == 200
    assert len(resp.get_json()) == 1


def test_no_auth(client):
    """Toutes les routes rejettent sans JWT."""
    resp = client.get('/api/conversations')
    assert resp.status_code == 401

    resp = client.get('/api/users/search')
    assert resp.status_code == 401
