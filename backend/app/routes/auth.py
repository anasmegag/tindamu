"""
routes/auth.py — Blueprint pour /api/auth/*

Endpoints :
  POST   /api/auth/register
  POST   /api/auth/login
  POST   /api/auth/refresh
  GET    /api/auth/me
  PUT    /api/auth/me
  POST   /api/auth/logout
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    jwt_required,
    get_jwt_identity,
    get_jwt,
    create_access_token,
)

from app.services.auth_service import (
    register_user,
    login_user,
    get_user_by_id,
    update_user,
    revoke_token,
)

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


# ── Helpers ───────────────────────────────────────────────────────────────

def _require_fields(data: dict, *fields):
    """Lève 422 si un champ obligatoire est absent du body JSON."""
    missing = [f for f in fields if not data.get(f)]
    if missing:
        return jsonify({"message": f"Champs manquants : {', '.join(missing)}"}), 422
    return None


# ── POST /api/auth/register ───────────────────────────────────────────────

@auth_bp.route("/register", methods=["POST"])
def register():
    """
    Inscription d'un étudiant.

    Body JSON :
        student_id   — numéro étudiant (ex: 22XXXXXX)
        email_univ   — email @etu.univ-amu.fr
        nom          — nom de famille
        prenom       — prénom
        password     — mot de passe en clair (≥6 car.)
        niveau       — L1 / L2 / L3 / M1 / M2
        specialite   — (optionnel)
        bio          — (optionnel)
    """
    data = request.get_json(silent=True) or {}

    err = _require_fields(data, "student_id", "email_univ", "nom", "prenom", "password", "niveau")
    if err:
        return err

    if len(data["password"]) < 6:
        return jsonify({"message": "Le mot de passe doit contenir au moins 6 caractères."}), 422

    try:
        result = register_user(data)
        return jsonify(result), 201
    except ValueError as e:
        return jsonify({"message": str(e)}), 409


# ── POST /api/auth/login ──────────────────────────────────────────────────

@auth_bp.route("/login", methods=["POST"])
def login():
    """
    Connexion par numéro étudiant + mot de passe.

    Body JSON :
        student_id — numéro étudiant
        password   — mot de passe

    Retourne :
        access_token  (15 min)
        refresh_token (7 jours)
        user          (profil)
    """
    data = request.get_json(silent=True) or {}

    err = _require_fields(data, "student_id", "password")
    if err:
        return err

    try:
        result = login_user(data["student_id"], data["password"])
        return jsonify(result), 200
    except ValueError as e:
        return jsonify({"message": str(e)}), 401


# ── POST /api/auth/refresh ────────────────────────────────────────────────

@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    """
    Rafraîchit l'access_token à partir d'un refresh_token valide.
    Envoyer le refresh_token dans le header Authorization: Bearer <token>.
    """
    user_id = get_jwt_identity()
    new_access_token = create_access_token(identity=user_id)
    return jsonify({"access_token": new_access_token}), 200


# ── GET /api/auth/me ──────────────────────────────────────────────────────

@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_me():
    """Retourne le profil de l'utilisateur connecté."""
    user_id = get_jwt_identity()
    try:
        user = get_user_by_id(user_id)
        return jsonify(user.to_dict(include_private=True)), 200
    except LookupError as e:
        return jsonify({"message": str(e)}), 404


# ── PUT /api/auth/me ──────────────────────────────────────────────────────

@auth_bp.route("/me", methods=["PUT"])
@jwt_required()
def update_me():
    """
    Modifie le profil de l'utilisateur connecté.

    Body JSON (tous optionnels) :
        bio        — texte libre
        avatar_url — URL de l'avatar
        specialite — spécialité universitaire
    """
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}

    try:
        user = get_user_by_id(user_id)
        result = update_user(user, data)
        return jsonify(result), 200
    except LookupError as e:
        return jsonify({"message": str(e)}), 404


# ── POST /api/auth/logout ─────────────────────────────────────────────────

@auth_bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    """
    Invalide le token courant (blacklist par jti).
    Le client doit aussi supprimer ses tokens localement.
    """
    jti = get_jwt()["jti"]
    revoke_token(jti)
    return jsonify({"message": "Déconnexion réussie."}), 200


# ── Gestionnaires d'erreurs JWT ───────────────────────────────────────────

def register_jwt_error_handlers(jwt):
    """À appeler dans create_app() avec l'instance JWTManager."""

    @jwt.expired_token_loader
    def expired_token(_header, _payload):
        return jsonify({"message": "Token expiré. Veuillez vous reconnecter."}), 401

    @jwt.invalid_token_loader
    def invalid_token(reason):
        return jsonify({"message": f"Token invalide : {reason}"}), 422

    @jwt.unauthorized_loader
    def missing_token(reason):
        return jsonify({"message": "Authentification requise."}), 401

    @jwt.revoked_token_loader
    def revoked_token(_header, _payload):
        return jsonify({"message": "Token révoqué. Veuillez vous reconnecter."}), 401
