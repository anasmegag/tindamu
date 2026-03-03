"""
routes/feed.py — Blueprint pour /api/feed/*
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services import feed_service

feed_bp = Blueprint('feed', __name__, url_prefix='/api/feed')

@feed_bp.route('/posts', methods=['POST'])
@jwt_required()
def create_post():
    """
    Créer un nouveau post.
    """
    user_id = get_jwt_identity()
    data = request.get_json()
    
    # Validation basique
    required = ['type', 'thematique', 'titre', 'contenu']
    if not all(k in data for k in required):
        return jsonify({"message": "Champs manquants"}), 400
        
    try:
        post = feed_service.create_post(user_id, data)
        return jsonify(post.to_dict()), 201
    except Exception as e:
        return jsonify({"message": str(e)}), 500

@feed_bp.route('/posts', methods=['GET'])
@jwt_required()
def get_feed():
    """
    Récupérer les posts pour le swipe (découverte).
    """
    user_id = get_jwt_identity()
    posts = feed_service.get_feed_posts(user_id)
    return jsonify([p.to_dict() for p in posts]), 200

@feed_bp.route('/swipe', methods=['POST'])
@jwt_required()
def swipe():
    """
    Liker ou ignorer un post.
    """
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data or 'post_id' not in data or 'direction' not in data:
        return jsonify({"message": "post_id et direction (LIKE/SKIP) requis"}), 400
        
    try:
        swipe, match = feed_service.handle_swipe(user_id, data['post_id'], data['direction'])
        response = {
            "swipe": swipe.to_dict(),
            "match": match.to_dict() if match else None,
        }
        return jsonify(response), 201
    except Exception as e:
        return jsonify({"message": str(e)}), 400
