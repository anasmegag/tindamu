"""Routes REST pour la recherche d'utilisateurs — Issue #41.

Endpoints:
  GET    /api/users/search       — Recherche (nom, prénom, student_id, niveau, spécialité)
  GET    /api/users/:id          — Profil public d'un utilisateur
  POST   /api/users/:id/follow   — Suivre un utilisateur
  DELETE /api/users/:id/follow   — Ne plus suivre
  GET    /api/users/:id/followers — Liste des followers
  GET    /api/users/:id/following — Liste des suivis
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from app import db
from app.models.user import User, NiveauEnum
from app.models.follow import Follow

search_bp = Blueprint('search', __name__)


@search_bp.route('/users/search', methods=['GET'])
@jwt_required()
def search_users():
    """Recherche combinable par nom/prénom, numéro étudiant, niveau, spécialité.

    Query: ?q=alice&niveau=L1&specialite=web
    """
    q = request.args.get('q', '').strip()
    niveau = request.args.get('niveau', '').strip()
    specialite = request.args.get('specialite', '').strip()
    page = request.args.get('page', 1, type=int)

    query = User.query

    # Recherche par nom, prénom ou numéro étudiant
    if q:
        search_term = f'%{q}%'
        query = query.filter(
            db.or_(
                User.nom.ilike(search_term),
                User.prenom.ilike(search_term),
                User.student_id.ilike(search_term),
            )
        )

    # Filtre par niveau
    if niveau:
        try:
            query = query.filter(User.niveau == NiveauEnum(niveau))
        except ValueError:
            pass

    # Filtre par spécialité
    if specialite:
        query = query.filter(User.specialite.ilike(f'%{specialite}%'))

    pagination = query.order_by(User.nom).paginate(
        page=page, per_page=20, error_out=False
    )

    return jsonify({
        'users': [u.to_dict() for u in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page,
        'has_next': pagination.has_next,
    }), 200


@search_bp.route('/users/<string:user_id>', methods=['GET'])
@jwt_required()
def get_user_profile(user_id):
    """Profil public d'un utilisateur (avec stats)."""
    user = User.query.get_or_404(user_id)
    data = user.to_dict()

    # Vérifier si le user connecté suit ce profil
    current_user_id = get_jwt_identity()
    data['is_following'] = Follow.query.filter_by(
        follower_id=current_user_id, followed_id=user_id
    ).first() is not None

    return jsonify(data), 200


@search_bp.route('/users/<string:user_id>/follow', methods=['POST'])
@jwt_required()
def follow_user(user_id):
    """Suivre un utilisateur."""
    current_user_id = get_jwt_identity()

    if current_user_id == user_id:
        return jsonify({'error': 'Vous ne pouvez pas vous suivre vous-même.'}), 422

    # Vérifier que l'utilisateur cible existe
    User.query.get_or_404(user_id)

    existing = Follow.query.filter_by(
        follower_id=current_user_id, followed_id=user_id
    ).first()

    if existing:
        return jsonify({'error': 'Vous suivez déjà cet utilisateur.'}), 409

    follow = Follow(follower_id=current_user_id, followed_id=user_id)
    db.session.add(follow)
    db.session.commit()

    return jsonify({'message': 'Utilisateur suivi.'}), 201


@search_bp.route('/users/<string:user_id>/follow', methods=['DELETE'])
@jwt_required()
def unfollow_user(user_id):
    """Ne plus suivre un utilisateur."""
    current_user_id = get_jwt_identity()

    follow = Follow.query.filter_by(
        follower_id=current_user_id, followed_id=user_id
    ).first()

    if not follow:
        return jsonify({'error': "Vous ne suivez pas cet utilisateur."}), 404

    db.session.delete(follow)
    db.session.commit()

    return jsonify({'message': 'Utilisateur non suivi.'}), 200


@search_bp.route('/users/<string:user_id>/followers', methods=['GET'])
@jwt_required()
def get_followers(user_id):
    """Liste des followers d'un utilisateur."""
    User.query.get_or_404(user_id)

    followers = Follow.query.filter_by(followed_id=user_id).all()
    user_ids = [f.follower_id for f in followers]
    users = User.query.filter(User.id.in_(user_ids)).all()

    return jsonify([u.to_dict() for u in users]), 200


@search_bp.route('/users/<string:user_id>/following', methods=['GET'])
@jwt_required()
def get_following(user_id):
    """Liste des utilisateurs suivis."""
    User.query.get_or_404(user_id)

    following = Follow.query.filter_by(follower_id=user_id).all()
    user_ids = [f.followed_id for f in following]
    users = User.query.filter(User.id.in_(user_ids)).all()

    return jsonify([u.to_dict() for u in users]), 200
