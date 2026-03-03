import { Outlet } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import './Layout.css';

/**
 * Layout principal de l'application (Sidebar + contenu).
 * La Navbar a été supprimée — la Sidebar gère toute la navigation.
 */
const Layout = () => {
    return (
        <div className="app-layout">
            <div className="app-body">
                <Sidebar />
                <main className="app-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
