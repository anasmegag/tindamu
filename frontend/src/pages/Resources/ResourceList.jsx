import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchResources } from '../../store/slices/resourceSlice';
import './ResourceList.css';

const FILE_TYPES = [
    { value: '', label: 'Tous', icon: '📁' },
    { value: 'PDF', label: 'PDF', icon: '📄' },
    { value: 'CODE', label: 'Code', icon: '💻' },
    { value: 'IMAGE', label: 'Image', icon: '🖼️' },
    { value: 'AUTRE', label: 'Autre', icon: '📦' },
];

const NIVEAUX = ['', 'L1', 'L2', 'L3', 'M1', 'M2'];

export default function ResourceList() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { resources, total, pages, currentPage, loading } = useSelector((s) => s.resources);

    const [filters, setFilters] = useState({ file_type: '', niveau: '', matiere: '' });

    useEffect(() => {
        const activeFilters = {};
        if (filters.file_type) activeFilters.file_type = filters.file_type;
        if (filters.niveau) activeFilters.niveau = filters.niveau;
        if (filters.matiere) activeFilters.matiere = filters.matiere;
        dispatch(fetchResources({ page: 1, perPage: 12, filters: activeFilters }));
    }, [dispatch, filters]);

    const handlePageChange = (page) => {
        const activeFilters = {};
        if (filters.file_type) activeFilters.file_type = filters.file_type;
        if (filters.niveau) activeFilters.niveau = filters.niveau;
        if (filters.matiere) activeFilters.matiere = filters.matiere;
        dispatch(fetchResources({ page, perPage: 12, filters: activeFilters }));
    };

    const getTypeIcon = (type) => {
        const map = { PDF: '📄', CODE: '💻', IMAGE: '🖼️', AUTRE: '📦' };
        return map[type] || '📁';
    };

    const renderStars = (rating) => {
        const full = Math.floor(rating);
        const stars = [];
        for (let i = 0; i < 5; i++) {
            stars.push(
                <span key={i} className={`star ${i < full ? 'filled' : ''}`}>★</span>
            );
        }
        return stars;
    };

    return (
        <div className="resource-list-page">
            <div className="resource-list-header">
                <div>
                    <h1>📚 Ressources</h1>
                    <p className="resource-subtitle">Partagez et découvrez des supports de cours</p>
                </div>
                <button className="btn-primary" onClick={() => navigate('/resources/upload')}>
                    + Partager une ressource
                </button>
            </div>

            {/* Filters */}
            <div className="resource-filters">
                <div className="filter-group">
                    <label>Type</label>
                    <div className="filter-pills">
                        {FILE_TYPES.map((t) => (
                            <button
                                key={t.value}
                                className={`filter-btn ${filters.file_type === t.value ? 'active' : ''}`}
                                onClick={() => setFilters({ ...filters, file_type: t.value })}
                            >
                                {t.icon} {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="filter-group">
                    <label>Niveau</label>
                    <div className="filter-pills">
                        {NIVEAUX.map((n) => (
                            <button
                                key={n}
                                className={`filter-btn ${filters.niveau === n ? 'active' : ''}`}
                                onClick={() => setFilters({ ...filters, niveau: n })}
                            >
                                {n || 'Tous'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Liste */}
            {loading ? (
                <div className="quiz-loading">
                    <div className="spinner" />
                    <p>Chargement des ressources...</p>
                </div>
            ) : resources.length === 0 ? (
                <div className="quiz-empty">
                    <span className="empty-icon">📚</span>
                    <p>Aucune ressource trouvée.</p>
                    <button className="btn-primary" onClick={() => navigate('/resources/upload')}>
                        Partager la première ressource
                    </button>
                </div>
            ) : (
                <>
                    <div className="resource-grid">
                        {resources.map((r) => (
                            <div key={r.id} className="resource-card" onClick={() => navigate(`/resources/${r.id}`)}>
                                <div className="resource-card-type">
                                    <span className="type-icon">{getTypeIcon(r.file_type)}</span>
                                    <span className="type-label">{r.file_type}</span>
                                </div>
                                <h3 className="resource-card-title">{r.title}</h3>
                                <p className="resource-card-desc">{r.description || 'Pas de description'}</p>
                                <div className="resource-card-meta">
                                    <span className="resource-level">{r.niveau}</span>
                                    <span className="resource-matiere">{r.matiere}</span>
                                </div>
                                <div className="resource-card-footer">
                                    <div className="resource-rating">
                                        {renderStars(r.average_rating)}
                                        <span className="rating-text">
                                            {r.average_rating > 0 ? r.average_rating : '—'} ({r.ratings_count})
                                        </span>
                                    </div>
                                    <span className="resource-downloads">⬇ {r.download_count}</span>
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
                            <span>Page {currentPage} / {pages} ({total} ressources)</span>
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
