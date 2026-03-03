/**
 * Page Messagerie — Liste des conversations + zone de chat.
 * Issue #40 : Page Messagerie React (Liste + Chat temps réel).
 */
import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import {
    fetchConversations,
    fetchMessages,
    sendNewMessage,
    setActiveConversation,
    addRealtimeMessage,
} from '../../store/slices/messagingSlice';
import {
    connectSocket,
    authenticateSocket,
    joinConversation,
    onNewMessage,
    offNewMessage,
    disconnectSocket,
} from '../../services/socketService';
import CreateGroupModal from './CreateGroupModal';
import './MessagesPage.css';

function MessagesPage() {
    const dispatch = useDispatch();
    const { conversations, activeConversation, messages, loading } = useSelector(s => s.messaging);
    const { user } = useSelector(s => s.auth);
    const [newMsg, setNewMsg] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const messagesEndRef = useRef(null);

    // Charger les conversations au montage
    useEffect(() => {
        dispatch(fetchConversations());
        connectSocket();
        authenticateSocket();

        return () => {
            offNewMessage();
            disconnectSocket();
        };
    }, [dispatch]);

    // Si on arrive depuis un match (?conv=<id>), ouvrir directement la conversation
    const [searchParams] = useSearchParams();
    useEffect(() => {
        const convId = searchParams.get('conv');
        if (!convId || !conversations.length) return;
        const target = conversations.find(c => c.id === convId);
        if (target) {
            dispatch(setActiveConversation(target));
            dispatch(fetchMessages(convId));
        }
    }, [searchParams, conversations, dispatch]);

    // Écouter les messages en temps réel
    useEffect(() => {
        onNewMessage((msg) => {
            dispatch(addRealtimeMessage(msg));
        });
        return () => offNewMessage();
    }, [dispatch]);

    // Charger les messages quand on sélectionne une conversation
    useEffect(() => {
        if (activeConversation) {
            dispatch(fetchMessages({ convId: activeConversation.id }));
            joinConversation(activeConversation.id);
        }
    }, [activeConversation, dispatch]);

    // Auto-scroll vers le bas
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = (e) => {
        e.preventDefault();
        if (!newMsg.trim() || !activeConversation) return;
        dispatch(sendNewMessage({ convId: activeConversation.id, contenu: newMsg.trim() }));
        setNewMsg('');
    };

    const getConversationName = (conv) => {
        if (conv.nom) return conv.nom;
        if (conv.type === 'GENERALE') return `💬 ${conv.niveau}`;
        if (conv.type === 'PRIVEE' && conv.members?.length) {
            const other = conv.members.find(m => m.user_id !== user?.id);
            return other ? `Conversation privée` : 'Privée';
        }
        return `Conversation #${conv.id}`;
    };

    const getConversationIcon = (conv) => {
        if (conv.type === 'GENERALE') return '🎓';
        if (conv.type === 'PRIVEE') return '💬';
        return '👥';
    };

    const filteredConversations = conversations.filter(c => {
        const name = getConversationName(c).toLowerCase();
        return name.includes(searchTerm.toLowerCase());
    });

    const formatTime = (iso) => {
        if (!iso) return '';
        const d = new Date(iso);
        return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="messages-page">
            {/* Sidebar conversations */}
            <aside className="conversations-panel">
                <div className="conversations-header">
                    <h2>Messages</h2>
                    <button className="btn-new-group" onClick={() => setShowCreateGroup(true)}>
                        + Groupe
                    </button>
                </div>

                <div className="conversations-search">
                    <input
                        type="text"
                        placeholder="Rechercher une conversation..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="conversations-list">
                    {loading && <div className="conv-loading">Chargement...</div>}
                    {filteredConversations.length === 0 && !loading && (
                        <div className="conv-empty">Aucune conversation</div>
                    )}
                    {filteredConversations.map(conv => (
                        <div
                            key={conv.id}
                            className={`conv-item ${activeConversation?.id === conv.id ? 'active' : ''}`}
                            onClick={() => dispatch(setActiveConversation(conv))}
                        >
                            <div className="conv-icon">{getConversationIcon(conv)}</div>
                            <div className="conv-info">
                                <div className="conv-name">{getConversationName(conv)}</div>
                                <div className="conv-preview">
                                    {conv.last_message?.contenu?.slice(0, 40) || 'Aucun message'}
                                </div>
                            </div>
                            {conv.last_message && (
                                <div className="conv-time">{formatTime(conv.last_message.created_at)}</div>
                            )}
                        </div>
                    ))}
                </div>
            </aside>

            {/* Zone de chat */}
            <main className="chat-panel">
                {!activeConversation ? (
                    <div className="chat-empty">
                        <div className="chat-empty-icon">💬</div>
                        <h3>Sélectionnez une conversation</h3>
                        <p>Choisissez une conversation pour commencer à discuter</p>
                    </div>
                ) : (
                    <>
                        <div className="chat-header">
                            <div className="chat-header-icon">{getConversationIcon(activeConversation)}</div>
                            <div>
                                <h3>{getConversationName(activeConversation)}</h3>
                                <span className="chat-header-members">
                                    {activeConversation.members?.length || 0} membre(s)
                                </span>
                            </div>
                        </div>

                        <div className="chat-messages">
                            {[...messages].reverse().map(msg => (
                                <div
                                    key={msg.id}
                                    className={`message ${msg.sender_id === user?.id ? 'sent' : 'received'}`}
                                >
                                    {msg.sender && (
                                        <div className="message-sender">{msg.sender.prenom}</div>
                                    )}
                                    <div className="message-bubble">
                                        <p>{msg.contenu}</p>
                                        <span className="message-time">{formatTime(msg.created_at)}</span>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        <form className="chat-input" onSubmit={handleSend}>
                            <input
                                type="text"
                                placeholder="Écrivez un message..."
                                value={newMsg}
                                onChange={e => setNewMsg(e.target.value)}
                                autoFocus
                            />
                            <button type="submit" disabled={!newMsg.trim()}>
                                Envoyer
                            </button>
                        </form>
                    </>
                )}
            </main>

            {showCreateGroup && (
                <CreateGroupModal onClose={() => setShowCreateGroup(false)} />
            )}
        </div>
    );
}

export default MessagesPage;
