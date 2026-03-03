"""Événements Socket.IO — Prototype messagerie temps réel.

Issue #28 : prototype basique send_message + new_message.
"""

from flask_jwt_extended import decode_token
from flask_socketio import emit, join_room, leave_room

from app import socketio, db
from app.models.message import Message, MessageType
from app.services.conversation_service import is_member


# Mapping socket session → user_id
connected_users = {}


@socketio.on('connect')
def handle_connect():
    """Connexion d'un client."""
    print('[Socket.IO] Client connected')


@socketio.on('authenticate')
def handle_authenticate(data):
    """Authentifier un client via JWT.

    Data: { token: "..." }
    Émet: authenticated | auth_error
    """
    token = data.get('token')
    if not token:
        emit('auth_error', {'error': 'Token requis.'})
        return
    try:
        decoded = decode_token(token)
        user_id = decoded['sub']
        from flask import request as flask_request
        connected_users[flask_request.sid] = user_id
        emit('authenticated', {'user_id': user_id})
    except Exception as e:
        emit('auth_error', {'error': f'Token invalide : {str(e)}'})


@socketio.on('join_conversation')
def handle_join(data):
    """Rejoindre une room.

    Data: { conversation_id: int }
    """
    from flask import request as flask_request
    user_id = connected_users.get(flask_request.sid)
    if not user_id:
        emit('error', {'error': 'Non authentifié.'})
        return

    conv_id = data.get('conversation_id')
    if not is_member(conv_id, user_id):
        emit('error', {'error': 'Accès interdit.'})
        return

    join_room(f'conv_{conv_id}')
    emit('joined', {'conversation_id': conv_id, 'user_id': user_id}, room=f'conv_{conv_id}')


@socketio.on('send_message')
def handle_send_message(data):
    """Envoyer un message en temps réel.

    Data: { conversation_id: int, contenu: str }
    Émet: new_message à toute la room
    """
    from flask import request as flask_request
    user_id = connected_users.get(flask_request.sid)
    if not user_id:
        emit('error', {'error': 'Non authentifié.'})
        return

    conv_id = data.get('conversation_id')
    contenu = data.get('contenu')
    if not conv_id or not contenu:
        emit('error', {'error': 'conversation_id et contenu requis.'})
        return

    if not is_member(conv_id, user_id):
        emit('error', {'error': 'Accès interdit.'})
        return

    # Sauvegarder en BDD
    msg = Message(
        conversation_id=conv_id,
        sender_id=user_id,
        contenu=contenu,
        type_message=MessageType.TEXTE,
    )
    db.session.add(msg)
    db.session.commit()

    # Broadcast à la room
    emit('new_message', msg.to_dict(), room=f'conv_{conv_id}')


@socketio.on('disconnect')
def handle_disconnect():
    """Déconnexion d'un client."""
    from flask import request as flask_request
    connected_users.pop(flask_request.sid, None)
