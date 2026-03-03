import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createResource } from '../../store/slices/resourceSlice';
import './ResourceUpload.css';

export default function ResourceUpload() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading, error } = useSelector((s) => s.resources);

    const [form, setForm] = useState({
        title: '',
        description: '',
        file_url: '',
        file_type: 'PDF',
        matiere: '',
        niveau: 'L1',
    });
    const [formError, setFormError] = useState('');

    const validate = () => {
        if (!form.title.trim()) return 'Le titre est obligatoire.';
        if (!form.file_url.trim()) return "L'URL du fichier est obligatoire.";
        if (!form.matiere.trim()) return 'La matière est obligatoire.';
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const err = validate();
        if (err) {
            setFormError(err);
            return;
        }
        setFormError('');

        const result = await dispatch(createResource(form));
        if (createResource.fulfilled.match(result)) {
            navigate('/resources');
        }
    };

    return (
        <div className="resource-upload-page">
            <div className="resource-upload-header">
                <h1>📤 Partager une ressource</h1>
                <p>Aidez la communauté TinAMU en partageant vos supports de cours</p>
            </div>

            <form onSubmit={handleSubmit} className="resource-upload-form">
                {(formError || error) && (
                    <div className="error-banner" role="alert">
                        {formError || error}
                    </div>
                )}

                <div className="form-section">
                    <div className="form-group">
                        <label htmlFor="title">Titre *</label>
                        <input
                            id="title"
                            type="text"
                            placeholder="ex: Cours d'introduction à Python"
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">Description</label>
                        <textarea
                            id="description"
                            placeholder="Décrivez le contenu de la ressource..."
                            rows={3}
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="file_url">URL du fichier *</label>
                        <input
                            id="file_url"
                            type="url"
                            placeholder="https://example.com/mon-fichier.pdf"
                            value={form.file_url}
                            onChange={(e) => setForm({ ...form, file_url: e.target.value })}
                        />
                        <span className="form-hint">Lien vers Google Drive, GitHub, Dropbox, etc.</span>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="file_type">Type de fichier</label>
                            <select
                                id="file_type"
                                value={form.file_type}
                                onChange={(e) => setForm({ ...form, file_type: e.target.value })}
                            >
                                <option value="PDF">📄 PDF</option>
                                <option value="CODE">💻 Code</option>
                                <option value="IMAGE">🖼️ Image</option>
                                <option value="AUTRE">📦 Autre</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="niveau">Niveau</label>
                            <select
                                id="niveau"
                                value={form.niveau}
                                onChange={(e) => setForm({ ...form, niveau: e.target.value })}
                            >
                                <option value="L1">L1</option>
                                <option value="L2">L2</option>
                                <option value="L3">L3</option>
                                <option value="M1">M1</option>
                                <option value="M2">M2</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="matiere">Matière *</label>
                        <input
                            id="matiere"
                            type="text"
                            placeholder="ex: Programmation Python, Bases de données, etc."
                            value={form.matiere}
                            onChange={(e) => setForm({ ...form, matiere: e.target.value })}
                        />
                    </div>
                </div>

                <div className="form-actions">
                    <button type="button" className="btn-secondary" onClick={() => navigate('/resources')}>
                        Annuler
                    </button>
                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Envoi…' : '✓ Partager'}
                    </button>
                </div>
            </form>
        </div>
    );
}
