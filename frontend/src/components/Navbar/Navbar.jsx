import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import './Navbar.css';

const Navbar = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);

    const handleLogout = async () => {
        await dispatch(logout());
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <NavLink to="/" className="navbar-logo">
                    🎓 TinAMU
                </NavLink>
            </div>

            <div className="navbar-links">
                <NavLink to="/feed" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                    🃏 Feed
                </NavLink>
                <NavLink to="/quiz" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                    🧠 Quiz
                </NavLink>
                <NavLink to="/messages" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                    💬 Messages
                </NavLink>
                <NavLink to="/resources" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                    📚 Ressources
                </NavLink>
                <NavLink to="/search" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                    🔍 Recherche
                </NavLink>
            </div>

            <div className="navbar-user">
                {user && (
                    <NavLink to="/profile" className="nav-user-info">
                        <span className="nav-avatar">{user.prenom?.[0] || '?'}</span>
                        <span className="nav-username">{user.prenom} {user.nom}</span>
                    </NavLink>
                )}
                <button onClick={handleLogout} className="btn-logout">
                    Déconnexion
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
