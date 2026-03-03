import { useState } from 'react';
import feedService from '../../services/feedService';
import './CreatePost.css';

const postTypes = [
    { value: 'AIDE_OFFERTE', label: '🤝 Offrir de l\'aide' },
    { value: 'AIDE_DEMANDEE', label: '❓ Demander de l\'aide' },
    { value: 'PARTAGE', label: '📢 Partager une ressource' },
];

const thematiques = [
    { value: 'COURS', label: '📚 Cours' },
    { value: 'PROJET', label: '💻 Projet' },
    { value: 'STAGE', label: '💼 Stage' },
    { value: 'ALTERNANCE', label: '🏢 Alternance' },
    { value: 'AUTRE', label: '✨ Autre' },
];

const CreatePost = ({ onPostCreated }) => {
    const [formData, setFormData] = useState({
        type: 'AIDE_OFFERTE',
        thematique: 'COURS',
        titre: '',
        contenu: '',
        tags: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isOpen, setIsOpen] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const tagsArray = formData.tags
                ? formData.tags.split(',').map(t => t.trim()).filter(t => t !== '')
                : [];

            await feedService.createPost({
                ...formData,
                tags: tagsArray
            });

            setFormData({
                type: 'AIDE_OFFERTE',
                thematique: 'COURS',
                titre: '',
                contenu: '',
                tags: ''
            });
            setIsOpen(false);
            if (onPostCreated) onPostCreated();
        } catch (err) {
            setError(err.response?.data?.message || "Erreur lors de la création du post");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <button className="btn-open-create" onClick={() => setIsOpen(true)}>
                <span>➕</span> Publier une annonce
            </button>
        );
    }

    return (
        <div className="create-post-card glass">
            <div className="create-post-header">
                <h3>Nouvelle annonce</h3>
                <button className="btn-close" onClick={() => setIsOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className="create-post-form">
                <div className="form-row">
                    <div className="form-group">
                        <label>Type</label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        >
                            {postTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Thématique</label>
                        <select
                            value={formData.thematique}
                            onChange={(e) => setFormData({ ...formData, thematique: e.target.value })}
                        >
                            {thematiques.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                    </div>
                </div>

                <div className="form-group">
                    <label>Titre</label>
                    <input
                        type="text"
                        placeholder="Ex: Aide pour projet React"
                        value={formData.titre}
                        onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Description</label>
                    <textarea
                        placeholder="Détaillez votre proposition ou votre besoin..."
                        value={formData.contenu}
                        onChange={(e) => setFormData({ ...formData, contenu: e.target.value })}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Tags (séparés par des virgules)</label>
                    <input
                        type="text"
                        placeholder="Ex: python, db, m1"
                        value={formData.tags}
                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    />
                </div>

                {error && <div className="error-msg">{error}</div>}

                <div className="create-post-actions">
                    <button type="button" className="btn-cancel" onClick={() => setIsOpen(false)}>Annuler</button>
                    <button type="submit" className="btn-submit" disabled={loading}>
                        {loading ? 'Publication...' : 'Publier'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreatePost;
