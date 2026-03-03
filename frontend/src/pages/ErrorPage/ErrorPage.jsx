import { Link, useRouteError } from 'react-router-dom';
import '../NotFound/NotFound.css';

export default function ErrorPage() {
    const error = useRouteError();

    return (
        <div className="error-page">
            <div className="error-content">
                <div className="error-code">⚠️</div>
                <h1>Une erreur est survenue</h1>
                <p>Quelque chose s'est mal passé. Réessaie ou retourne à l'accueil.</p>
                {error && error.message && (
                    <div className="error-detail">{error.message}</div>
                )}
                <Link to="/" className="btn-home">Retour à l'accueil</Link>
            </div>
        </div>
    );
}
