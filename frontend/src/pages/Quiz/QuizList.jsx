import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchQuizzes } from '../../store/slices/quizSlice';
import './QuizList.css';

const DIFFICULTIES = [
    { value: '', label: 'Toutes' },
    { value: 'FACILE', label: '🟢 Facile' },
    { value: 'MOYEN', label: '🟡 Moyen' },
    { value: 'DIFFICILE', label: '🔴 Difficile' },
];

export default function QuizList() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { quizzes, total, pages, currentPage, loading } = useSelector((s) => s.quiz);
    const [difficulty, setDifficulty] = useState('');

    useEffect(() => {
        dispatch(fetchQuizzes({ page: 1, perPage: 10, difficulty: difficulty || null }));
    }, [dispatch, difficulty]);

    const handlePageChange = (page) => {
        dispatch(fetchQuizzes({ page, perPage: 10, difficulty: difficulty || null }));
    };

    const getDifficultyBadge = (diff) => {
        const map = { FACILE: 'badge-easy', MOYEN: 'badge-medium', DIFFICILE: 'badge-hard' };
        const labels = { FACILE: 'Facile', MOYEN: 'Moyen', DIFFICILE: 'Difficile' };
        return <span className={`quiz-badge ${map[diff]}`}>{labels[diff]}</span>;
    };

    return (
        <div className="quiz-list-page">
            <div className="quiz-list-header">
                <div>
                    <h1>🧠 Quiz</h1>
                    <p className="quiz-subtitle">Testez vos connaissances et défiez vos camarades !</p>
                </div>
                <div className="quiz-header-actions">
                    <button className="btn-secondary" onClick={() => navigate('/quiz/leaderboard')}>
                        🏆 Classement
                    </button>
                    <button className="btn-primary" onClick={() => navigate('/quiz/create')}>
                        + Créer un quiz
                    </button>
                </div>
            </div>

            {/* Filtres */}
            <div className="quiz-filters">
                {DIFFICULTIES.map((d) => (
                    <button
                        key={d.value}
                        className={`filter-btn ${difficulty === d.value ? 'active' : ''}`}
                        onClick={() => setDifficulty(d.value)}
                    >
                        {d.label}
                    </button>
                ))}
            </div>

            {/* Liste */}
            {loading ? (
                <div className="quiz-loading">
                    <div className="spinner" />
                    <p>Chargement des quiz...</p>
                </div>
            ) : quizzes.length === 0 ? (
                <div className="quiz-empty">
                    <span className="empty-icon">📝</span>
                    <p>Aucun quiz trouvé.</p>
                    <button className="btn-primary" onClick={() => navigate('/quiz/create')}>
                        Créer le premier quiz
                    </button>
                </div>
            ) : (
                <>
                    <div className="quiz-grid">
                        {quizzes.map((quiz) => (
                            <div key={quiz.id} className="quiz-card" onClick={() => navigate(`/quiz/${quiz.id}`)}>
                                <div className="quiz-card-header">
                                    {getDifficultyBadge(quiz.difficulty)}
                                    {quiz.time_limit && (
                                        <span className="quiz-time">⏱ {Math.floor(quiz.time_limit / 60)} min</span>
                                    )}
                                </div>
                                <h3 className="quiz-card-title">{quiz.title}</h3>
                                <p className="quiz-card-desc">{quiz.description || 'Pas de description'}</p>
                                <div className="quiz-card-footer">
                                    <span className="quiz-questions-count">📋 {quiz.questions_count} questions</span>
                                    {quiz.author && (
                                        <span className="quiz-author">
                                            par {quiz.author.prenom} {quiz.author.nom}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {pages > 1 && (
                        <div className="quiz-pagination">
                            <button
                                disabled={currentPage <= 1}
                                onClick={() => handlePageChange(currentPage - 1)}
                            >
                                ← Précédent
                            </button>
                            <span>Page {currentPage} / {pages} ({total} quiz)</span>
                            <button
                                disabled={currentPage >= pages}
                                onClick={() => handlePageChange(currentPage + 1)}
                            >
                                Suivant →
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
