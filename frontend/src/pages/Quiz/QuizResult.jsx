import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import './QuizResult.css';

export default function QuizResult() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { lastResult } = useSelector((s) => s.quiz);

    if (!lastResult) {
        return (
            <div className="quiz-result-page">
                <div className="result-empty">
                    <p>Aucun résultat à afficher.</p>
                    <button className="btn-primary" onClick={() => navigate('/quiz')}>
                        Retour aux quiz
                    </button>
                </div>
            </div>
        );
    }

    const { score, total_questions, percentage, time_spent } = lastResult;

    const getEmoji = () => {
        if (percentage >= 80) return '🎉';
        if (percentage >= 60) return '👍';
        if (percentage >= 40) return '😐';
        return '😢';
    };

    const getMessage = () => {
        if (percentage >= 80) return 'Excellent ! Tu maîtrises le sujet !';
        if (percentage >= 60) return 'Bien joué ! Tu peux encore progresser.';
        if (percentage >= 40) return 'Pas mal, mais il y a de la marge.';
        return 'Courage, la prochaine sera la bonne !';
    };

    const getScoreColor = () => {
        if (percentage >= 80) return '#22c55e';
        if (percentage >= 60) return '#f59e0b';
        return '#ef4444';
    };

    const formatTime = (seconds) => {
        if (!seconds) return '—';
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m} min ${s}s`;
    };

    return (
        <div className="quiz-result-page">
            <div className="result-card">
                <div className="result-emoji">{getEmoji()}</div>

                <h1 className="result-title">Quiz terminé !</h1>
                <p className="result-message">{getMessage()}</p>

                {/* Score circle */}
                <div className="result-score-circle" style={{ '--score-color': getScoreColor() }}>
                    <div className="score-value">{percentage}%</div>
                    <div className="score-detail">{score} / {total_questions}</div>
                </div>

                {/* Stats */}
                <div className="result-stats">
                    <div className="result-stat">
                        <span className="stat-icon">✅</span>
                        <span className="stat-value">{score}</span>
                        <span className="stat-label">Bonnes réponses</span>
                    </div>
                    <div className="result-stat">
                        <span className="stat-icon">❌</span>
                        <span className="stat-value">{total_questions - score}</span>
                        <span className="stat-label">Mauvaises réponses</span>
                    </div>
                    <div className="result-stat">
                        <span className="stat-icon">⏱</span>
                        <span className="stat-value">{formatTime(time_spent)}</span>
                        <span className="stat-label">Temps passé</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="result-actions">
                    <button className="btn-primary" onClick={() => navigate('/quiz')}>
                        ← Retour aux quiz
                    </button>
                    <button className="btn-secondary" onClick={() => navigate('/quiz/leaderboard')}>
                        🏆 Voir le classement
                    </button>
                </div>
            </div>
        </div>
    );
}
