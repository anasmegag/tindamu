import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import feedService from '../../services/feedService';
import CreatePost from '../../components/Feed/CreatePost';
import './Feed.css';

const Feed = () => {
    const navigate = useNavigate();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    const loadFeed = async () => {
        setLoading(true);
        try {
            const data = await feedService.getDiscoveryFeed();
            setPosts(data);
            setCurrentIndex(0);
        } catch (err) {
            setError("Impossible de charger le feed");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        loadFeed();
    }, []);

    const handleSwipe = async (direction) => {
        if (currentIndex >= posts.length) return;

        const currentPost = posts[currentIndex];
        try {
            const result = await feedService.swipe(currentPost.id, direction);
            if (result.match) {
                const convId = result.match.conversation_id;
                // Naviguer directement vers la conversation créée par le match
                navigate(`/messages${convId ? `?conv=${convId}` : ''}`);
                return;
            }
            setCurrentIndex(prev => prev + 1);
        } catch (err) {
            console.error("Erreur lors du swipe", err);
        }
    };

    const currentPost = posts[currentIndex];

    return (
        <div className="feed-container">
            <div className="feed-header">
                <h1>Découverte</h1>
                <p>Trouvez de l'aide ou proposez vos services</p>
            </div>

            <CreatePost onPostCreated={loadFeed} />

            <div className="discovery-area">
                {loading ? (
                    <div className="loading-spinner">Chargement des annonces...</div>
                ) : error ? (
                    <div className="error-card glass">{error}</div>
                ) : currentIndex < posts.length ? (
                    <div className="swipe-card-wrapper">
                        <div className="swipe-card glass">
                            <div className="card-badge" data-type={currentPost.type}>
                                {currentPost.type.replace('_', ' ')}
                            </div>

                            <div className="card-main">
                                <h2 className="card-title">{currentPost.titre}</h2>
                                <div className="card-author">
                                    <span className="author-avatar">
                                        {currentPost.author.prenom?.[0] || '?'}
                                    </span>
                                    <div>
                                        <div className="author-name">{currentPost.author.prenom} {currentPost.author.nom}</div>
                                        <div className="author-meta">{currentPost.author.niveau} • {currentPost.author.specialite}</div>
                                    </div>
                                </div>
                                <p className="card-content">{currentPost.contenu}</p>

                                <div className="card-tags">
                                    <span className="tag-thematique">#{currentPost.thematique}</span>
                                    {currentPost.tags?.map(tag => (
                                        <span key={tag} className="tag">#{tag}</span>
                                    ))}
                                </div>
                            </div>

                            <div className="swipe-actions">
                                <button className="btn-swipe skip" onClick={() => handleSwipe('SKIP')}>
                                    ❌ Ignorer
                                </button>
                                <button className="btn-swipe like" onClick={() => handleSwipe('LIKE')}>
                                    ❤️ Connecter
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="empty-feed glass">
                        <div className="empty-icon">🌟</div>
                        <h3>Plus d'annonces pour le moment</h3>
                        <p>Revenez plus tard ou publiez votre propre annonce !</p>
                        <button className="btn-refresh" onClick={loadFeed}>Actualiser</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Feed;
