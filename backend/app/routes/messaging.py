"""Routes REST pour la messagerie — Issue #39.

Endpoints:
  GET    /api/conversations              — Lister mes conversations
  POST   /api/conversations              — Créer un groupe personnel
  GET    /api/conversations/:id          — Détail d'une conversation
  PUT    /api/conversations/:id          — Modifier un groupe (admin)
  DELETE /api/conversations/:id          — Quitter une conversation
  GET    /api/conversations/:id/messages — Historique (paginé)
  POST   /api/conversations/:id/messages — Envoyer un message
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from app import db
from app.models.conversation import Conversation, ConversationMember, ConversationType, MemberRole
from app.models.message import Message, MessageType
from app.services.conversation_service import (
    create_group_conversation,
    get_user_conversations,
    is_admin,
    is_member,
)

messaging_bp = Blueprint('messaging', __name__)


# ─── CONVERSATIONS ───────────────────────────────────────────


@messaging_bp.route('/conversations', methods=['GET'])
@jwt_required()
def list_conversations():
    """Lister toutes les conversations de l'utilisateur connecté."""
    user_id = get_jwt_identity()
    conversations = get_user_conversations(user_id)
    return jsonify(conversations), 200


@messaging_bp.route('/conversations', methods=['POST'])
@jwt_required()
def create_conversation():
    """Créer un groupe personnel.

    Body: { nom: str, member_ids: [str] }
    """
    user_id = get_jwt_identity()
    data = request.get_json()

    nom = data.get('nom')
    member_ids = data.get('member_ids', [])

    if not nom:
        return jsonify({'error': 'Le nom du groupe est requis.'}), 422
    if not member_ids:
        return jsonify({'error': 'Ajoutez au moins un membre.'}), 422

    conv = create_group_conversation(user_id, nom, member_ids)
    return jsonify(conv.to_dict(include_members=True)), 201


@messaging_bp.route('/conversations/<int:conv_id>', methods=['GET'])
@jwt_required()
def get_conversation(conv_id):
    """Détail d'une conversation."""
    user_id = get_jwt_identity()

    if not is_member(conv_id, user_id):
        return jsonify({'error': 'Accès interdit.'}), 403

    conv = Conversation.query.get_or_404(conv_id)
    return jsonify(conv.to_dict(include_members=True, include_last_message=True)), 200


@messaging_bp.route('/conversations/<int:conv_id>', methods=['PUT'])
@jwt_required()
def update_conversation(conv_id):
    """Modifier un groupe (nom, membres). Admin only.

    Body: { nom?: str, add_members?: [str], remove_members?: [str] }
    """
    user_id = get_jwt_identity()

    if not is_admin(conv_id, user_id):
        return jsonify({'error': 'Seul un admin peut modifier le groupe.'}), 403

    conv = Conversation.query.get_or_404(conv_id)
    data = request.get_json()

    if 'nom' in data:
        conv.nom = data['nom']

    for uid in data.get('add_members', []):
        existing = ConversationMember.query.filter_by(
            conversation_id=conv_id, user_id=uid
        ).first()
        if not existing:
            db.session.add(ConversationMember(
                conversation_id=conv_id, user_id=uid, role=MemberRole.MEMBRE
            ))

    for uid in data.get('remove_members', []):
        member = ConversationMember.query.filter_by(
            conversation_id=conv_id, user_id=uid
        ).first()
        if member and member.role != MemberRole.ADMIN:
            db.session.delete(member)

    db.session.commit()
    return jsonify(conv.to_dict(include_members=True)), 200


@messaging_bp.route('/conversations/<int:conv_id>', methods=['DELETE'])
@jwt_required()
def leave_conversation(conv_id):
    """Quitter une conversation."""
    user_id = get_jwt_identity()

    member = ConversationMember.query.filter_by(
        conversation_id=conv_id, user_id=user_id
    ).first()

    if not member:
        return jsonify({'error': "Vous n'êtes pas membre."}), 404

    db.session.delete(member)
    db.session.commit()
    return jsonify({'message': 'Vous avez quitté la conversation.'}), 200


# ─── MESSAGES ────────────────────────────────────────────────


@messaging_bp.route('/conversations/<int:conv_id>/messages', methods=['GET'])
@jwt_required()
def list_messages(conv_id):
    """Historique des messages (paginé, 50/page).

    Query: ?page=1
    """
    user_id = get_jwt_identity()
    page = request.args.get('page', 1, type=int)

    if not is_member(conv_id, user_id):
        return jsonify({'error': 'Accès interdit.'}), 403

    pagination = Message.query.filter_by(
        conversation_id=conv_id
    ).order_by(
        Message.created_at.desc()
    ).paginate(page=page, per_page=50, error_out=False)

    return jsonify({
        'messages': [m.to_dict() for m in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page,
        'has_next': pagination.has_next,
        'has_prev': pagination.has_prev,
    }), 200


@messaging_bp.route('/conversations/<int:conv_id>/messages', methods=['POST'])
@jwt_required()
def create_message(conv_id):
    """Envoyer un message.

    Body: { contenu: str, type_message?: "TEXTE"|"FICHIER"|"IMAGE", file_url?: str }
    """
    user_id = get_jwt_identity()
    data = request.get_json()

    contenu = data.get('contenu')
    if not contenu:
        return jsonify({'error': 'Le contenu est requis.'}), 422

    if not is_member(conv_id, user_id):
        return jsonify({'error': 'Accès interdit.'}), 403

    msg = Message(
        conversation_id=conv_id,
        sender_id=user_id,
        contenu=contenu,
        type_message=MessageType(data.get('type_message', 'TEXTE')),
        file_url=data.get('file_url')
    )
    db.session.add(msg)
    db.session.commit()

    return jsonify(msg.to_dict()), 201
