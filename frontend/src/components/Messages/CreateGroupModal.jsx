/**
 * Composant CreateGroupModal — Créer un groupe personnel.
 * Issue #43 : Groupes personnels.
 */
import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { createGroup } from '../../store/slices/messagingSlice';
import { searchUsers } from '../../services/searchService';
import './GroupModal.css';

function CreateGroupModal({ onClose }) {
    const dispatch = useDispatch();
    const [groupName, setGroupName] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (searchTerm.length < 2) {
            const t = setTimeout(() => setSearchResults([]), 0);
            return () => clearTimeout(t);
        }
        const timer = setTimeout(async () => {
            try {
                const data = await searchUsers({ q: searchTerm });
                setSearchResults(data.users.filter(
                    u => !selectedMembers.find(m => m.id === u.id)
                ));
            } catch { /* ignore */ }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, selectedMembers]);

    const addMember = (user) => {
        setSelectedMembers(prev => [...prev, user]);
        setSearchTerm('');
        setSearchResults([]);
    };

    const removeMember = (userId) => {
        setSelectedMembers(prev => prev.filter(m => m.id !== userId));
    };

    const handleCreate = async () => {
        if (!groupName.trim() || selectedMembers.length === 0) return;
        setLoading(true);
        try {
            await dispatch(createGroup({
                nom: groupName.trim(),
                memberIds: selectedMembers.map(m => m.id),
            })).unwrap();
            onClose();
        } catch {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>👥 Créer un groupe</h3>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>

                <div className="modal-body">
                    <label className="modal-label">Nom du groupe</label>
                    <input
                        type="text"
                        placeholder="Ex: Projet TinAMU, Révisions L2..."
                        value={groupName}
                        onChange={e => setGroupName(e.target.value)}
                        className="modal-input"
                        autoFocus
                    />

                    <label className="modal-label">Ajouter des membres</label>
                    <input
                        type="text"
                        placeholder="Rechercher par nom ou prénom..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="modal-input"
                    />

                    {searchResults.length > 0 && (
                        <div className="search-dropdown">
                            {searchResults.map(user => (
                                <div key={user.id} className="dropdown-item" onClick={() => addMember(user)}>
                                    <div className="dropdown-avatar">
                                        {user.prenom[0]}{user.nom[0]}
                                    </div>
                                    <span>{user.prenom} {user.nom}</span>
                                    <span className="dropdown-niveau">{user.niveau}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {selectedMembers.length > 0 && (
                        <div className="selected-members">
                            {selectedMembers.map(m => (
                                <div key={m.id} className="member-chip">
                                    <span>{m.prenom} {m.nom}</span>
                                    <button onClick={() => removeMember(m.id)}>✕</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button className="btn-cancel" onClick={onClose}>Annuler</button>
                    <button
                        className="btn-create"
                        onClick={handleCreate}
                        disabled={!groupName.trim() || selectedMembers.length === 0 || loading}
                    >
                        {loading ? 'Création...' : `Créer (${selectedMembers.length} membre${selectedMembers.length > 1 ? 's' : ''})`}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CreateGroupModal;
