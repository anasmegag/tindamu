"""
seed.py — Données de test TinAMU
Crée 10 étudiants (L1→M2) et des relations de follow.

Usage :
    cd backend
    python seed.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv()

from app import create_app, db, bcrypt
from app.models.user import User, NiveauEnum
from app.models.follow import Follow
from app.models.conversation import Conversation, ConversationMember
from app.models.message import Message
from app.services.conversation_service import (
    create_general_conversation,
    add_user_to_general_conversation,
)

app = create_app()

PASSWORD = "TinAMU2026!"

STUDENTS = [
    {
        "student_id": "22310001", "email_univ": "alice.martin@etu.univ.fr",
        "nom": "Martin", "prenom": "Alice", "niveau": "L1",
        "specialite": "Informatique générale", "bio": "L1 passionnée de Python !",
        "score_aide": 10, "score_quiz": 45,
    },
    {
        "student_id": "21310002", "email_univ": "bob.dupont@etu.univ.fr",
        "nom": "Dupont", "prenom": "Bob", "niveau": "L2",
        "specialite": "Développement web", "bio": "Je code des sites et bois du café.",
        "score_aide": 30, "score_quiz": 120,
    },
    {
        "student_id": "21310003", "email_univ": "clara.lefebvre@etu.univ.fr",
        "nom": "Lefebvre", "prenom": "Clara", "niveau": "L2",
        "specialite": "Cybersécurité", "bio": "Fan de CTF et de reverse engineering.",
        "score_aide": 55, "score_quiz": 95,
    },
    {
        "student_id": "20310004", "email_univ": "david.nguyen@etu.univ.fr",
        "nom": "Nguyen", "prenom": "David", "niveau": "L3",
        "specialite": "IA & Machine Learning", "bio": "Je lis des papers ML le WE.",
        "score_aide": 80, "score_quiz": 200,
    },
    {
        "student_id": "20310005", "email_univ": "emma.bernard@etu.univ.fr",
        "nom": "Bernard", "prenom": "Emma", "niveau": "L3",
        "specialite": "Systèmes embarqués", "bio": "Arduino et Raspberry Pi lover.",
        "score_aide": 40, "score_quiz": 150,
    },
    {
        "student_id": "19310006", "email_univ": "francois.petit@etu.univ.fr",
        "nom": "Petit", "prenom": "François", "niveau": "M1",
        "specialite": "Génie logiciel", "bio": "Clean code, TDD et revues de code.",
        "score_aide": 120, "score_quiz": 310,
    },
    {
        "student_id": "19310007", "email_univ": "giulia.romano@etu.univ.fr",
        "nom": "Romano", "prenom": "Giulia", "niveau": "M1",
        "specialite": "Cloud & DevOps", "bio": "K8s, Docker, CI/CD. La totale.",
        "score_aide": 90, "score_quiz": 275,
    },
    {
        "student_id": "18310008", "email_univ": "hugo.lambert@etu.univ.fr",
        "nom": "Lambert", "prenom": "Hugo", "niveau": "M2",
        "specialite": "Sécurité informatique", "bio": "Pentester le week-end.",
        "score_aide": 200, "score_quiz": 430,
    },
    {
        "student_id": "18310009", "email_univ": "ines.moreau@etu.univ.fr",
        "nom": "Moreau", "prenom": "Inès", "niveau": "M2",
        "specialite": "Data Science", "bio": "Thèse sur le fine-tuning de LLM.",
        "score_aide": 350, "score_quiz": 520,
    },
    {
        "student_id": "18310010", "email_univ": "julien.garcia@etu.univ.fr",
        "nom": "Garcia", "prenom": "Julien", "niveau": "M2",
        "specialite": "Ingénierie logicielle", "bio": "Bientôt en CDI — qui recrute ? 😄",
        "score_aide": 180, "score_quiz": 390,
    },
]

with app.app_context():
    print("🗑️  Nettoyage de la base de données...")
    Message.query.delete()
    ConversationMember.query.delete()
    Conversation.query.delete()
    Follow.query.delete()
    User.query.delete()
    db.session.commit()

    print("👤 Création des 10 étudiants...")
    users = []
    for s in STUDENTS:
        user = User(
            student_id=s["student_id"],
            email_univ=s["email_univ"],
            nom=s["nom"],
            prenom=s["prenom"],
            password_hash=bcrypt.generate_password_hash(PASSWORD).decode("utf-8"),
            niveau=NiveauEnum(s["niveau"]),
            specialite=s["specialite"],
            bio=s["bio"],
            score_aide=s["score_aide"],
            score_quiz=s["score_quiz"],
        )
        db.session.add(user)
        users.append(user)

    db.session.commit()
    print(f"✅ {len(users)} utilisateurs créés.")

    print("🔗 Création des relations follow...")
    pairs = [
        (0, 5), (0, 6),  # Alice suit François et Giulia (L1 → M1)
        (1, 0), (1, 3),  # Bob suit Alice et David
        (2, 7),          # Clara suit Hugo
        (3, 8),          # David suit Inès
        (4, 5),          # Emma suit François
        (5, 3), (5, 8),  # François suit David et Inès
        (6, 7),          # Giulia suit Hugo
        (8, 9),          # Inès suit Julien
    ]
    for i, j in pairs:
        db.session.add(Follow(follower_id=users[i].id, followed_id=users[j].id))

    db.session.commit()
    print(f"✅ {len(pairs)} relations follow créées.")

    print("💬 Création des conversations générales (L1→M2)...")
    for niveau in ["L1", "L2", "L3", "M1", "M2"]:
        conv = create_general_conversation(niveau)
        print(f"   ✅ {niveau} — Conversation #{conv.id}")

    print("🔗 Auto-join des étudiants dans leur conversation de niveau...")
    for user in users:
        add_user_to_general_conversation(user.id, user.niveau.value)
    print(f"   ✅ {len(users)} étudiants ajoutés à leur conversation.")

    print("\n" + "=" * 55)
    print("🎉 Seed terminé avec succès !")
    print(f"   Mot de passe commun : {PASSWORD}")
    print("\n   Comptes créés :")
    for s in STUDENTS:
        print(f"   • [{s['student_id']}] {s['prenom']} {s['nom']} ({s['niveau']})")
    print("=" * 55)

