import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';

/**
 * Guard de route : redirige vers /login si l'utilisateur n'est pas authentifié.
 * Utilise le state Redux `auth.isAuthenticated`.
 */
const ProtectedRoute = () => {
    const { isAuthenticated } = useSelector((state) => state.auth);

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
