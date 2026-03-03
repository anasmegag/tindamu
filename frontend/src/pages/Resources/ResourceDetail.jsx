import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchResource, rateResource, clearCurrentResource } from '../../store/slices/resourceSlice';
import './ResourceDetail.css';

export default function ResourceDetail() {
    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { currentResource, loading, error } = useSelector((s) => s.resources);
    const { user } = useSelector((s) => s.auth);

    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [ratingSubmitted, setRatingSubmitted] = useState(false);

    useEffect(() => {
        dispatch(clearCurrentResource());
        dispatch(fetchResource(id));
    }, [dispatch, id]);

    const handleRate = async () => {
        if (rating === 0) return;
        const result = await dispatch(rateResource({ resourceId: id, rating, comment: comment || null }));
        if (rateResource.fulfilled.match(result)) {
            setRatingSubmitted(true);
        }
    };

    const getTypeIcon = (type) => {
        const map = { PDF: '📄', CODE: '💻', IMAGE: '🖼️', AUTRE: '📦' };
        return map[type] || '📁';
    };

    if (loading && !currentResource) {
        return (
            <div className="resource-detail-page">
                <div className="quiz-loading">
                    <div className="spinner" />
                    <p>Chargement...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="resource-detail-page">
                <div className="quiz-error">
                    <span>⚠️</span>
                    <p>{error}</p>
                    <button className="btn-primary" onClick={() => navigate('/resources')}>
                        Retour aux ressources
                    </button>
                </div>
            </div>
        );
    }

    if (!currentResource) return null;

    const r = currentResource;
    const isOwner = user?.id === r.uploaded_by;

    return (
        <div className="resource-detail-page">
            <button className="btn-back" onClick={() => navigate('/resources')}>
                ← Retour aux ressources
            </button>

            <div className="resource-detail-card">
                <div className="resource-detail-header">
                    <span className="detail-type-icon">{getTypeIcon(r.file_type)}</span>
                    <div>
                        <h1>{r.title}</h1>
                        <div className="resource-detail-meta">
                            <span className="resource-level">{r.niveau}</span>
                            <span className="resource-matiere">{r.matiere}</span>
                            <span className="type-label">{r.file_type}</span>
                        </div>
                    </div>
                </div>

                {r.description && (
                    <p className="resource-detail-desc">{r.description}</p>
                )}

                <div className="resource-detail-stats">
                    <div className="detail-stat">
                        <span className="stat-label">Note moyenne</span>
                        <span className="stat-value">
                            {'★'.repeat(Math.floor(r.average_rating))}
                            {'☆'.repeat(5 - Math.floor(r.average_rating))}
                            {' '}{r.average_rating > 0 ? r.average_rating : '—'}
                        </span>
                    </div>
                    <div className="detail-stat">
                        <span className="stat-label">Avis</span>
                        <span className="stat-value">{r.ratings_count}</span>
                    </div>
                    <div className="detail-stat">
                        <span className="stat-label">Vues</span>
                        <span className="stat-value">{r.download_count}</span>
                    </div>
                </div>

                {r.uploader && (
                    <div className="resource-uploader">
                        <span className="uploader-avatar">{r.uploader.prenom?.[0]}</span>
                        <div>
                            <span className="uploader-name">{r.uploader.prenom} {r.uploader.nom}</span>
                            <span className="uploader-level">{r.uploader.niveau}</span>
                        </div>
                    </div>
                )}

                <a
                    href={r.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-download"
                >
                    ⬇ Accéder à la ressource
                </a>
            </div>

            {/* Rating section */}
            {!isOwner && (
                <div className="rating-section">
                    <h2>⭐ Noter cette ressource</h2>

                    {ratingSubmitted ? (
                        <div className="rating-success">
                            <span>✅</span>
                            <p>Merci pour votre avis !</p>
                        </div>
                    ) : (
                        <>
                            <div className="star-selector">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <button
                                        key={s}
                                        className={`star-btn ${s <= (hoverRating || rating) ? 'active' : ''}`}
                                        onClick={() => setRating(s)}
                                        onMouseEnter={() => setHoverRating(s)}
                                        onMouseLeave={() => setHoverRating(0)}
                                    >
                                        ★
                                    </button>
                                ))}
                                {rating > 0 && <span className="rating-label">{rating}/5</span>}
                            </div>

                            <div className="form-group">
                                <textarea
                                    placeholder="Ajoutez un commentaire (optionnel)..."
                                    rows={2}
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                />
                            </div>

                            <button
                                className="btn-primary"
                                onClick={handleRate}
                                disabled={rating === 0}
                            >
                                Envoyer la note
                            </button>
                        </>
                    )}
                </div>
            )}

            {/* Reviews */}
            {r.ratings && r.ratings.length > 0 && (
                <div className="reviews-section">
                    <h2>💬 Avis ({r.ratings.length})</h2>
                    <div className="reviews-list">
                        {r.ratings.map((review) => (
                            <div key={review.id} className="review-card">
                                <div className="review-header">
                                    <div className="review-user">
                                        <span className="review-avatar">{review.user?.prenom?.[0]}</span>
                                        <span className="review-name">
                                            {review.user?.prenom} {review.user?.nom}
                                        </span>
                                    </div>
                                    <div className="review-rating">
                                        {'★'.repeat(review.rating)}
                                        {'☆'.repeat(5 - review.rating)}
                                    </div>
                                </div>
                                {review.comment && (
                                    <p className="review-comment">{review.comment}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
