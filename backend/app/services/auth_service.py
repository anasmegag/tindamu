"""
auth_service.py — Logique métier de l'authentification.

Toutes les opérations sur les utilisateurs passent par ce service,
jamais directement depuis les routes.
"""

from flask import current_app
from flask_jwt_extended import create_access_token, create_refresh_token

from app import db, bcrypt
from app.models.user import User, NiveauEnum


# ── Blacklist JWT en mémoire (set de jti révoqués) ────────────────────────
# En production, utiliser Redis ou une table SQL.
jwt_blacklist: set[str] = set()


def is_token_revoked(jwt_payload: dict) -> bool:
    """Vérifie si un token est dans la blacklist."""
    return jwt_payload["jti"] in jwt_blacklist


def revoke_token(jti: str) -> None:
    """Ajoute un jti à la blacklist."""
    jwt_blacklist.add(jti)


# ── Register ──────────────────────────────────────────────────────────────

def register_user(data: dict) -> dict:
    """
    Crée un nouvel utilisateur.
    Retourne un dict avec 'user' en cas de succès.
    Lève ValueError si une contrainte est violée.
    """
    # Vérifier doublon student_id
    if User.query.filter_by(student_id=data["student_id"]).first():
        raise ValueError("Ce numéro étudiant est déjà utilisé.")

    # Vérifier doublon email
    if User.query.filter_by(email_univ=data["email_univ"]).first():
        raise ValueError("Cet email universitaire est déjà utilisé.")

    # Valider le niveau
    try:
        niveau = NiveauEnum(data["niveau"])
    except (KeyError, ValueError):
        raise ValueError(f"Niveau invalide. Valeurs acceptées : {[e.value for e in NiveauEnum]}")

    password_hash = bcrypt.generate_password_hash(data["password"]).decode("utf-8")

    user = User(
        student_id=data["student_id"],
        email_univ=data["email_univ"],
        nom=data["nom"],
        prenom=data["prenom"],
        password_hash=password_hash,
        niveau=niveau,
        specialite=data.get("specialite"),
        bio=data.get("bio"),
    )
    db.session.add(user)
    db.session.commit()

    return {"user": user.to_dict(include_private=True)}


# ── Login ─────────────────────────────────────────────────────────────────

def login_user(student_id: str, password: str) -> dict:
    """
    Authentifie un utilisateur par son numéro étudiant + mot de passe.
    Retourne access_token, refresh_token et le profil.
    Lève ValueError si les identifiants sont invalides.
    """
    user = User.query.filter_by(student_id=student_id, is_active=True).first()

    if not user or not bcrypt.check_password_hash(user.password_hash, password):
        raise ValueError("Identifiants incorrects.")

    access_token = create_access_token(identity=user.id)
    refresh_token = create_refresh_token(identity=user.id)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": user.to_dict(include_private=True),
    }


# ── Get me ────────────────────────────────────────────────────────────────

def get_user_by_id(user_id: str) -> User:
    """Récupère un utilisateur par son ID ou lève 404."""
    user = User.query.get(user_id)
    if not user or not user.is_active:
        raise LookupError("Utilisateur introuvable.")
    return user


# ── Update me ─────────────────────────────────────────────────────────────

def update_user(user: User, data: dict) -> dict:
    """
    Met à jour le profil : bio, avatar_url, specialite.
    Retourne le profil mis à jour.
    """
    allowed_fields = ("bio", "avatar_url", "specialite")
    for field in allowed_fields:
        if field in data:
            setattr(user, field, data[field])

    db.session.commit()
    return {"user": user.to_dict(include_private=True)}
