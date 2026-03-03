# API Documentation — TinAMU Backend

Base URL : `http://localhost:5000/api`

> **Convention** : Toutes les routes retournent du JSON. Les routes protégées nécessitent `Authorization: Bearer <access_token>`.

---

## 🔐 Auth — `/api/auth` *(M1 — Sprint 1 Sem 2)*

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| `POST` | `/auth/register` | Inscription (identifiant universitaire) | ❌ |
| `POST` | `/auth/login` | Connexion → `access_token` 15min + `refresh_token` 7j | ❌ |
| `POST` | `/auth/refresh` | Rafraîchir l'access_token | ✅ refresh |
| `GET` | `/auth/me` | Profil de l'utilisateur connecté | ✅ |
| `PUT` | `/auth/me` | Modifier bio, avatar, spécialité | ✅ |
| `POST` | `/auth/logout` | Révoquer le token (blacklist) | ✅ |

---

## 🃏 Feed Tinder — `/api/feed` *(M1 — Sprint 2)*

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| `GET` | `/feed` | Liste d'étudiants à swiper | ✅ |
| `POST` | `/feed/swipe` | Swipe gauche/droite sur un étudiant | ✅ |
| `GET` | `/feed/matches` | Mes matches | ✅ |
| `POST` | `/posts` | Créer un post | ✅ |
| `GET` | `/posts` | Liste des posts du feed | ✅ |
| `DELETE` | `/posts/<id>` | Supprimer un post | ✅ |

---

## 🧠 Quiz — `/api/quiz` *(M2 — Sprint 2)*

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| `GET` | `/quiz` | Liste des quiz disponibles | ✅ |
| `POST` | `/quiz` | Créer un quiz | ✅ |
| `GET` | `/quiz/<id>` | Détail d'un quiz (questions) | ✅ |
| `POST` | `/quiz/<id>/start` | Démarrer une session | ✅ |
| `POST` | `/quiz/<id>/submit` | Soumettre les réponses | ✅ |
| `GET` | `/quiz/leaderboard` | Classement global | ✅ |

---

## 📚 Ressources — `/api/resources` *(M2 — Sprint 3)*

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| `GET` | `/resources` | Liste des ressources (filtrable) | ✅ |
| `POST` | `/resources` | Uploader une ressource | ✅ |
| `GET` | `/resources/<id>` | Détail / téléchargement | ✅ |
| `POST` | `/resources/<id>/rate` | Noter une ressource | ✅ |
| `DELETE` | `/resources/<id>` | Supprimer | ✅ |

---

## 💬 Messagerie — `/api/conversations` *(M3 — Sprint 2)*

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| `GET` | `/conversations` | Mes conversations | ✅ |
| `POST` | `/conversations` | Créer une conversation | ✅ |
| `GET` | `/conversations/<id>/messages` | Messages (paginés) | ✅ |
| `POST` | `/conversations/<id>/messages` | Envoyer un message (REST) | ✅ |

**Socket.IO events** (M3) : `join_room`, `send_message`, `typing`, `message_received`

---

## 🔍 Recherche — `/api/search` *(M4 — Sprint 2)*

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| `GET` | `/search/users` | Rechercher des étudiants | ✅ |

---

## 👤 Profil — `/api/profile` *(M4 — Sprint 2)*

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| `GET` | `/profile/<user_id>` | Profil public d'un étudiant | ✅ |
| `GET` | `/profile/<user_id>/stats` | Stats agrégées | ✅ |
| `POST` | `/profile/<user_id>/follow` | Suivre un étudiant | ✅ |
| `DELETE` | `/profile/<user_id>/follow` | Ne plus suivre | ✅ |

---

## ⚠️ Codes d'erreur

| Code HTTP | Description |
|-----------|-------------|
| `400` | Requête invalide |
| `401` | Non authentifié / token expiré |
| `403` | Accès refusé |
| `404` | Ressource introuvable |
| `409` | Conflit (doublon) |
| `422` | Données invalides |
| `500` | Erreur serveur |
