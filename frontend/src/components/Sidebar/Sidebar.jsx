import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import './Sidebar.css';

const menuItems = [
    { path: '/feed', icon: '🃏', label: 'Feed' },
    { path: '/quiz', icon: '🧠', label: 'Quiz' },
    { path: '/messages', icon: '💬', label: 'Messages' },
    { path: '/resources', icon: '📚', label: 'Ressources' },
    { path: '/search', icon: '🔍', label: 'Recherche' },
    { path: '/profile', icon: '👤', label: 'Profil' },
];

const Sidebar = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);

    const handleLogout = async () => {
        await dispatch(logout());
        navigate('/login');
    };

    return (
        <aside className="sidebar">
            {/* Logo */}
            <NavLink to="/" className="sidebar-brand">
                🎓 <span>TinAMU</span>
            </NavLink>

            {/* Navigation */}
            <ul className="sidebar-menu">
                {menuItems.map((item) => (
                    <li key={item.path}>
                        <NavLink
                            to={item.path}
                            className={({ isActive }) =>
                                isActive ? 'sidebar-link active' : 'sidebar-link'
                            }
                        >
                            <span className="sidebar-icon">{item.icon}</span>
                            <span className="sidebar-label">{item.label}</span>
                        </NavLink>
                    </li>
                ))}
            </ul>

            {/* Utilisateur + Déconnexion */}
            <div className="sidebar-footer">
                {user && (
                    <NavLink to="/profile" className="sidebar-user">
                        <span className="sidebar-avatar">{user.prenom?.[0] || '?'}</span>
                        <span className="sidebar-username">{user.prenom} {user.nom}</span>
                    </NavLink>
                )}
                <button id="btn-logout" onClick={handleLogout} className="sidebar-logout">
                    Déconnexion
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
