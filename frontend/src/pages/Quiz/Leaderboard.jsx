import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchLeaderboard } from '../../store/slices/quizSlice';
import './Leaderboard.css';

export default function Leaderboard() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { leaderboard, loading } = useSelector((s) => s.quiz);

    useEffect(() => {
        dispatch(fetchLeaderboard(20));
    }, [dispatch]);

    const getMedal = (rank) => {
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return `#${rank}`;
    };

    return (
        <div className="leaderboard-page">
            <div className="leaderboard-header">
                <button className="btn-back" onClick={() => navigate('/quiz')}>
                    ← Retour
                </button>
                <div>
                    <h1>🏆 Classement Quiz</h1>
                    <p className="leaderboard-subtitle">Les meilleurs joueurs de TinAMU</p>
                </div>
            </div>

            {loading ? (
                <div className="quiz-loading">
                    <div className="spinner" />
                    <p>Chargement...</p>
                </div>
            ) : leaderboard.length === 0 ? (
                <div className="leaderboard-empty">
                    <span>📊</span>
                    <p>Aucun score pour le moment. Soyez le premier !</p>
                    <button className="btn-primary" onClick={() => navigate('/quiz')}>
                        Jouer un quiz
                    </button>
                </div>
            ) : (
                <>
                    {/* Podium */}
                    <div className="podium">
                        {leaderboard.slice(0, 3).map((entry, idx) => (
                            <div key={entry.user.id} className={`podium-item podium-${idx + 1}`}>
                                <div className="podium-medal">{getMedal(entry.rank)}</div>
                                <div className="podium-avatar">
                                    {entry.user.prenom?.[0]}
                                </div>
                                <div className="podium-name">
                                    {entry.user.prenom} {entry.user.nom}
                                </div>
                                <div className="podium-score">{entry.score_quiz} pts</div>
                                <div className="podium-level">{entry.user.niveau}</div>
                            </div>
                        ))}
                    </div>

                    {/* Table */}
                    <div className="leaderboard-table-wrapper">
                        <table className="leaderboard-table">
                            <thead>
                                <tr>
                                    <th>Rang</th>
                                    <th>Étudiant</th>
                                    <th>Niveau</th>
                                    <th>Score</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaderboard.map((entry) => (
                                    <tr key={entry.user.id} className={entry.rank <= 3 ? 'top-three' : ''}>
                                        <td className="rank-cell">{getMedal(entry.rank)}</td>
                                        <td className="user-cell">
                                            <span className="table-avatar">{entry.user.prenom?.[0]}</span>
                                            {entry.user.prenom} {entry.user.nom}
                                        </td>
                                        <td>
                                            <span className="level-badge">{entry.user.niveau}</span>
                                        </td>
                                        <td className="score-cell">{entry.score_quiz} pts</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}
