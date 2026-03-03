"""
routes/resources.py — Blueprint pour /api/resources/*

Endpoints :
  GET    /api/resources           → liste paginée avec filtres
  POST   /api/resources           → créer une ressource
  GET    /api/resources/<id>      → détail
  DELETE /api/resources/<id>      → supprimer (auteur uniquement)
  POST   /api/resources/<id>/rate → noter une ressource
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import desc

from app import db
from app.models.resource import Resource, ResourceRating, FileTypeEnum

resources_bp = Blueprint('resources', __name__, url_prefix='/api/resources')


# ── GET /api/resources ───────────────────────────────────────────────────────

@resources_bp.route('', methods=['GET'])
@jwt_required()
def list_resources():
    """Liste paginée des ressources avec filtres optionnels."""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 12, type=int)
    file_type = request.args.get('file_type')
    niveau = request.args.get('niveau')
    matiere = request.args.get('matiere')

    query = Resource.query
    if file_type:
        try:
            query = query.filter_by(file_type=FileTypeEnum(file_type))
        except ValueError:
            return jsonify({'message': 'Type de fichier invalide'}), 400
    if niveau:
        query = query.filter_by(niveau=niveau)
    if matiere:
        query = query.filter(Resource.matiere.ilike(f'%{matiere}%'))

    pagination = query.order_by(desc(Resource.created_at)).paginate(
        page=page, per_page=per_page, error_out=False
    )

    return jsonify({
        'resources': [r.to_dict() for r in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': pagination.page,
    }), 200


# ── POST /api/resources ──────────────────────────────────────────────────────

@resources_bp.route('', methods=['POST'])
@jwt_required()
def create_resource():
    """
    Créer une nouvelle ressource.

    Body JSON :
        title     — obligatoire
        file_type — PDF | CODE | IMAGE | AUTRE
        description, matiere, niveau, file_url — optionnels
    """
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}

    if not data.get('title'):
        return jsonify({'message': 'Le titre est obligatoire'}), 422

    try:
        file_type = FileTypeEnum(data.get('file_type', 'AUTRE'))
    except ValueError:
        return jsonify({'message': 'Type invalide. Valeurs : PDF, CODE, IMAGE, AUTRE'}), 422

    resource = Resource(
        title=data['title'],
        description=data.get('description'),
        file_type=file_type,
        file_url=data.get('file_url'),
        matiere=data.get('matiere'),
        niveau=data.get('niveau'),
        created_by=user_id,
    )
    db.session.add(resource)
    db.session.commit()
    return jsonify(resource.to_dict()), 201


# ── GET /api/resources/<id> ──────────────────────────────────────────────────

@resources_bp.route('/<resource_id>', methods=['GET'])
@jwt_required()
def get_resource(resource_id):
    """Détail d'une ressource + incrémente le compteur de téléchargements."""
    resource = Resource.query.get_or_404(resource_id)
    resource.download_count += 1
    db.session.commit()
    return jsonify(resource.to_dict()), 200


# ── DELETE /api/resources/<id> ───────────────────────────────────────────────

@resources_bp.route('/<resource_id>', methods=['DELETE'])
@jwt_required()
def delete_resource(resource_id):
    """Supprimer une ressource (auteur uniquement)."""
    user_id = get_jwt_identity()
    resource = Resource.query.get_or_404(resource_id)

    if resource.created_by != user_id:
        return jsonify({'message': 'Accès interdit'}), 403

    db.session.delete(resource)
    db.session.commit()
    return jsonify({'message': 'Ressource supprimée'}), 200


# ── POST /api/resources/<id>/rate ────────────────────────────────────────────

@resources_bp.route('/<resource_id>/rate', methods=['POST'])
@jwt_required()
def rate_resource(resource_id):
    """
    Noter une ressource (1 à 5 étoiles).

    Body JSON :
        rating  — entier 1-5 (obligatoire)
        comment — texte (optionnel)
    """
    user_id = get_jwt_identity()
    resource = Resource.query.get_or_404(resource_id)
    data = request.get_json(silent=True) or {}

    rating_value = data.get('rating')
    if not rating_value or not (1 <= int(rating_value) <= 5):
        return jsonify({'message': 'La note doit être un entier entre 1 et 5'}), 422

    existing = ResourceRating.query.filter_by(
        resource_id=resource_id, user_id=user_id
    ).first()

    if existing:
        existing.rating = int(rating_value)
        existing.comment = data.get('comment')
    else:
        rating = ResourceRating(
            resource_id=resource_id,
            user_id=user_id,
            rating=int(rating_value),
            comment=data.get('comment'),
        )
        db.session.add(rating)

    db.session.commit()
    return jsonify(resource.to_dict()), 200
