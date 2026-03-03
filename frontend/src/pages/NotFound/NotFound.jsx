import { Link } from 'react-router-dom';
import './NotFound.css';

export default function NotFound() {
    return (
        <div className="not-found-page">
            <div className="not-found-content">
                <div className="not-found-code">404</div>
                <h1>Page introuvable</h1>
                <p>La page que tu cherches n'existe pas ou a été déplacée.</p>
                <Link to="/" className="btn-home">Retour à l'accueil</Link>
            </div>
        </div>
    );
}
