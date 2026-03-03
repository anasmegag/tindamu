/**
 * Page Recherche — Recherche d'utilisateurs + profil + follow.
 * Issue #42 : Page Recherche de Profils React.
 */
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    searchForUsers,
    fetchUserProfile,
    toggleFollow,
    clearProfile,
} from '../../store/slices/searchSlice';
import './SearchPage.css';

function SearchPage() {
    const dispatch = useDispatch();
    const { results, total, selectedProfile, loading } = useSelector(s => s.search);
    const [query, setQuery] = useState('');
    const [niveau, setNiveau] = useState('');

    const handleSearch = (e) => {
        e?.preventDefault();
        dispatch(searchForUsers({ q: query, niveau }));
    };

    useEffect(() => {
        dispatch(searchForUsers({}));
    }, [dispatch]);

    const handleProfileClick = (userId) => {
        dispatch(fetchUserProfile(userId));
    };

    const handleFollow = (userId, isFollowing) => {
        dispatch(toggleFollow({ userId, isFollowing }));
    };

    const niveaux = ['', 'L1', 'L2', 'L3', 'M1', 'M2'];

    return (
        <div className="search-page">
            {/* Barre de recherche */}
            <div className="search-bar-container">
                <h2>🔍 Rechercher des étudiants</h2>
                <form className="search-form" onSubmit={handleSearch}>
                    <input
                        type="text"
                        placeholder="Nom, prénom ou numéro étudiant..."
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        className="search-input"
                    />
                    <select value={niveau} onChange={e => setNiveau(e.target.value)} className="search-select">
                        {niveaux.map(n => (
                            <option key={n} value={n}>{n || 'Tous niveaux'}</option>
                        ))}
                    </select>
                    <button type="submit" className="search-btn">Rechercher</button>
                </form>
                <span className="search-count">{total} résultat(s)</span>
            </div>

            <div className="search-content">
                {/* Liste des résultats */}
                <div className="search-results">
                    {loading && <div className="search-loading">Chargement...</div>}
                    {results.length === 0 && !loading && (
                        <div className="search-empty">Aucun résultat trouvé</div>
                    )}
                    {results.map(user => (
                        <div
                            key={user.id}
                            className={`user-card ${selectedProfile?.id === user.id ? 'active' : ''}`}
                            onClick={() => handleProfileClick(user.id)}
                        >
                            <div className="user-avatar">
                                {user.avatar_url ? (
                                    <img src={user.avatar_url} alt={user.prenom} />
                                ) : (
                                    <div className="user-avatar-fallback">
                                        {user.prenom[0]}{user.nom[0]}
                                    </div>
                                )}
                            </div>
                            <div className="user-info">
                                <div className="user-name">{user.prenom} {user.nom}</div>
                                <div className="user-meta">
                                    <span className="user-niveau">{user.niveau}</span>
                                    {user.specialite && <span className="user-spec">· {user.specialite}</span>}
                                </div>
                            </div>
                            <div className="user-scores">
                                <span title="Score Quiz">🧠 {user.score_quiz}</span>
                                <span title="Score Aide">🤝 {user.score_aide}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Panneau profil */}
                {selectedProfile && (
                    <aside className="profile-panel">
                        <button className="profile-close" onClick={() => dispatch(clearProfile())}>✕</button>
                        <div className="profile-header">
                            <div className="profile-avatar">
                                {selectedProfile.avatar_url ? (
                                    <img src={selectedProfile.avatar_url} alt="" />
                                ) : (
                                    <div className="profile-avatar-fallback">
                                        {selectedProfile.prenom[0]}{selectedProfile.nom[0]}
                                    </div>
                                )}
                            </div>
                            <h3>{selectedProfile.prenom} {selectedProfile.nom}</h3>
                            <span className="profile-niveau">{selectedProfile.niveau}</span>
                        </div>

                        {selectedProfile.bio && (
                            <p className="profile-bio">{selectedProfile.bio}</p>
                        )}

                        <div className="profile-stats">
                            <div className="stat">
                                <span className="stat-value">{selectedProfile.followers_count}</span>
                                <span className="stat-label">Followers</span>
                            </div>
                            <div className="stat">
                                <span className="stat-value">{selectedProfile.following_count}</span>
                                <span className="stat-label">Suivis</span>
                            </div>
                            <div className="stat">
                                <span className="stat-value">{selectedProfile.score_quiz}</span>
                                <span className="stat-label">Quiz</span>
                            </div>
                            <div className="stat">
                                <span className="stat-value">{selectedProfile.score_aide}</span>
                                <span className="stat-label">Aide</span>
                            </div>
                        </div>

                        {selectedProfile.specialite && (
                            <div className="profile-detail">
                                <span className="detail-label">Spécialité</span>
                                <span>{selectedProfile.specialite}</span>
                            </div>
                        )}

                        <button
                            className={`follow-btn ${selectedProfile.is_following ? 'following' : ''}`}
                            onClick={() => handleFollow(selectedProfile.id, selectedProfile.is_following)}
                        >
                            {selectedProfile.is_following ? '✓ Suivi' : '+ Suivre'}
                        </button>
                    </aside>
                )}
            </div>
        </div>
    );
}

export default SearchPage;
