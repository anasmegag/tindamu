"""
routes/quiz.py — Blueprint pour /api/quiz/*

Endpoints :
  GET    /api/quiz                     → liste paginée des quiz publiés
  POST   /api/quiz                     → créer un quiz (avec questions)
  GET    /api/quiz/leaderboard         → classement global
  GET    /api/quiz/me/results          → mes résultats
  GET    /api/quiz/<id>                → détail d'un quiz
  PUT    /api/quiz/<id>                → modifier un quiz
  DELETE /api/quiz/<id>                → supprimer un quiz
  POST   /api/quiz/<id>/start          → démarrer un quiz (questions sans réponses)
  POST   /api/quiz/<id>/submit         → soumettre les réponses
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import desc

from app import db
from app.models.quiz import Quiz, DifficultyEnum
from app.models.question import Question, Option
from app.models.quiz_result import QuizResult
from app.models.user import User

quiz_bp = Blueprint('quiz', __name__, url_prefix='/api/quiz')


# ── GET /api/quiz ────────────────────────────────────────────────────────────

@quiz_bp.route('', methods=['GET'])
@jwt_required()
def list_quizzes():
    """Liste paginée des quiz publiés."""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    difficulty = request.args.get('difficulty')

    query = Quiz.query.filter_by(is_published=True)
    if difficulty:
        try:
            query = query.filter_by(difficulty=DifficultyEnum(difficulty))
        except ValueError:
            return jsonify({'message': 'Difficulté invalide'}), 400

    pagination = query.order_by(desc(Quiz.created_at)).paginate(
        page=page, per_page=per_page, error_out=False
    )

    return jsonify({
        'quizzes': [q.to_dict() for q in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': pagination.page,
    }), 200


# ── POST /api/quiz ───────────────────────────────────────────────────────────

@quiz_bp.route('', methods=['POST'])
@jwt_required()
def create_quiz():
    """
    Crée un quiz avec ses questions et options.

    Body JSON :
        title       — obligatoire
        description — optionnel
        difficulty  — FACILE | MOYEN | DIFFICILE (défaut: MOYEN)
        time_limit  — en secondes (optionnel)
        is_published — bool (défaut: false)
        questions   — liste de { text, order, options: [{ text, is_correct, order }] }
    """
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}

    if not data.get('title'):
        return jsonify({'message': 'Le titre est obligatoire'}), 422

    try:
        difficulty = DifficultyEnum(data.get('difficulty', 'MOYEN'))
    except ValueError:
        return jsonify({'message': 'Difficulté invalide. Valeurs : FACILE, MOYEN, DIFFICILE'}), 422

    quiz = Quiz(
        title=data['title'],
        description=data.get('description'),
        difficulty=difficulty,
        time_limit=data.get('time_limit'),
        is_published=data.get('is_published', False),
        created_by=user_id,
    )
    db.session.add(quiz)
    db.session.flush()  # pour avoir quiz.id

    for q_data in data.get('questions', []):
        question = Question(
            quiz_id=quiz.id,
            text=q_data.get('text', ''),
            order=q_data.get('order', 0),
        )
        db.session.add(question)
        db.session.flush()

        for o_data in q_data.get('options', []):
            option = Option(
                question_id=question.id,
                text=o_data.get('text', ''),
                is_correct=o_data.get('is_correct', False),
                order=o_data.get('order', 0),
            )
            db.session.add(option)

    db.session.commit()
    return jsonify(quiz.to_dict(include_questions=True)), 201


# ── GET /api/quiz/leaderboard ────────────────────────────────────────────────

@quiz_bp.route('/leaderboard', methods=['GET'])
@jwt_required()
def leaderboard():
    """Classement global basé sur le score total cumulé."""
    limit = request.args.get('limit', 20, type=int)

    # Agréger les scores par utilisateur
    from sqlalchemy import func
    rows = (
        db.session.query(
            QuizResult.user_id,
            func.sum(QuizResult.score).label('total_score'),
            func.count(QuizResult.id).label('quizzes_done'),
        )
        .group_by(QuizResult.user_id)
        .order_by(desc('total_score'))
        .limit(limit)
        .all()
    )

    result = []
    for rank, row in enumerate(rows, start=1):
        user = User.query.get(row.user_id)
        if user:
            result.append({
                'rank': rank,
                'user': user.to_dict(),
                'total_score': row.total_score,
                'quizzes_done': row.quizzes_done,
            })

    return jsonify({'leaderboard': result}), 200


# ── GET /api/quiz/me/results ─────────────────────────────────────────────────

@quiz_bp.route('/me/results', methods=['GET'])
@jwt_required()
def my_results():
    """Historique des résultats de l'utilisateur connecté."""
    user_id = get_jwt_identity()
    results = QuizResult.query.filter_by(user_id=user_id).order_by(
        desc(QuizResult.completed_at)
    ).all()
    return jsonify({'results': [r.to_dict() for r in results]}), 200


# ── GET /api/quiz/<id> ───────────────────────────────────────────────────────

@quiz_bp.route('/<quiz_id>', methods=['GET'])
@jwt_required()
def get_quiz(quiz_id):
    """Détail d'un quiz avec ses questions et options."""
    quiz = Quiz.query.get_or_404(quiz_id)
    return jsonify(quiz.to_dict(include_questions=True)), 200


# ── PUT /api/quiz/<id> ───────────────────────────────────────────────────────

@quiz_bp.route('/<quiz_id>', methods=['PUT'])
@jwt_required()
def update_quiz(quiz_id):
    """Modifier les métadonnées d'un quiz (auteur uniquement)."""
    user_id = get_jwt_identity()
    quiz = Quiz.query.get_or_404(quiz_id)

    if quiz.created_by != user_id:
        return jsonify({'message': 'Accès interdit'}), 403

    data = request.get_json(silent=True) or {}
    for field in ('title', 'description', 'time_limit', 'is_published'):
        if field in data:
            setattr(quiz, field, data[field])

    if 'difficulty' in data:
        try:
            quiz.difficulty = DifficultyEnum(data['difficulty'])
        except ValueError:
            return jsonify({'message': 'Difficulté invalide'}), 422

    db.session.commit()
    return jsonify(quiz.to_dict()), 200


# ── DELETE /api/quiz/<id> ────────────────────────────────────────────────────

@quiz_bp.route('/<quiz_id>', methods=['DELETE'])
@jwt_required()
def delete_quiz(quiz_id):
    """Supprimer un quiz (auteur uniquement)."""
    user_id = get_jwt_identity()
    quiz = Quiz.query.get_or_404(quiz_id)

    if quiz.created_by != user_id:
        return jsonify({'message': 'Accès interdit'}), 403

    db.session.delete(quiz)
    db.session.commit()
    return jsonify({'message': 'Quiz supprimé'}), 200


# ── POST /api/quiz/<id>/start ────────────────────────────────────────────────

@quiz_bp.route('/<quiz_id>/start', methods=['POST'])
@jwt_required()
def start_quiz(quiz_id):
    """
    Démarre une session de quiz.
    Retourne les questions SANS révéler les bonnes réponses.
    """
    quiz = Quiz.query.get_or_404(quiz_id)

    questions = [
        q.to_dict(include_options=True)
        for q in quiz.questions.order_by(Question.order)
    ]

    # Masquer is_correct dans les options
    for q in questions:
        for opt in q.get('options', []):
            opt.pop('is_correct', None)

    return jsonify({
        'quiz_id': quiz.id,
        'title': quiz.title,
        'time_limit': quiz.time_limit,
        'questions': questions,
    }), 200


# ── POST /api/quiz/<id>/submit ───────────────────────────────────────────────

@quiz_bp.route('/<quiz_id>/submit', methods=['POST'])
@jwt_required()
def submit_quiz(quiz_id):
    """
    Soumettre les réponses d'un quiz.

    Body JSON :
        answers    — { question_id: option_id, ... }
        time_spent — secondes (optionnel)
    """
    user_id = get_jwt_identity()
    quiz = Quiz.query.get_or_404(quiz_id)
    data = request.get_json(silent=True) or {}
    answers = data.get('answers', {})

    score = 0
    total_questions = quiz.questions.count()

    for question in quiz.questions:
        chosen_option_id = answers.get(question.id)
        if chosen_option_id:
            option = Option.query.get(chosen_option_id)
            if option and option.question_id == question.id and option.is_correct:
                score += 1

    # Enregistrer le résultat (ou mettre à jour si déjà existant)
    result = QuizResult.query.filter_by(quiz_id=quiz_id, user_id=user_id).first()
    if result:
        result.score = score
        result.total_questions = total_questions
        result.time_spent = data.get('time_spent')
    else:
        result = QuizResult(
            quiz_id=quiz_id,
            user_id=user_id,
            score=score,
            total_questions=total_questions,
            time_spent=data.get('time_spent'),
        )
        db.session.add(result)

    # Mettre à jour le score de gamification de l'utilisateur
    user = User.query.get(user_id)
    if user:
        user.score_quiz = (user.score_quiz or 0) + score

    db.session.commit()
    return jsonify(result.to_dict()), 200
