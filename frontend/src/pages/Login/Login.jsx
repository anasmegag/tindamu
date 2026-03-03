import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { login, clearError } from '../../store/slices/authSlice';
import './Login.css';

export default function Login() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading, error } = useSelector((state) => state.auth);

    const [form, setForm] = useState({ student_id: '', password: '' });
    const [fieldErrors, setFieldErrors] = useState({});

    const validate = () => {
        const errors = {};
        if (!form.student_id.trim()) errors.student_id = "Le numéro étudiant est requis.";
        if (!form.password) errors.password = "Le mot de passe est requis.";
        else if (form.password.length < 6) errors.password = "Minimum 6 caractères.";
        return errors;
    };

    const handleChange = ({ target: { name, value } }) => {
        setForm((prev) => ({ ...prev, [name]: value }));
        // Effacer l'erreur du champ modifié
        if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: null }));
        if (error) dispatch(clearError());
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errors = validate();
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        const result = await dispatch(login(form));
        if (login.fulfilled.match(result)) {
            navigate('/feed', { replace: true });
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-logo">
                    <h1>TinAMU</h1>
                    <p>Réseau social universitaire</p>
                </div>

                <form className="login-form" onSubmit={handleSubmit} noValidate>
                    {error && <div className="error-banner" role="alert">{error}</div>}

                    <div className="form-group">
                        <label htmlFor="student_id">Numéro étudiant</label>
                        <input
                            id="student_id"
                            name="student_id"
                            type="text"
                            placeholder="ex: 22001234"
                            value={form.student_id}
                            onChange={handleChange}
                            className={fieldErrors.student_id ? 'input-error' : ''}
                            autoComplete="username"
                        />
                        {fieldErrors.student_id && (
                            <span className="field-error">{fieldErrors.student_id}</span>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Mot de passe</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="••••••••"
                            value={form.password}
                            onChange={handleChange}
                            className={fieldErrors.password ? 'input-error' : ''}
                            autoComplete="current-password"
                        />
                        {fieldErrors.password && (
                            <span className="field-error">{fieldErrors.password}</span>
                        )}
                    </div>

                    <button
                        id="btn-login"
                        type="submit"
                        className="btn-primary"
                        disabled={loading}
                    >
                        {loading ? 'Connexion…' : 'Se connecter'}
                    </button>
                </form>

                <div className="login-footer">
                    Pas encore de compte ?{' '}
                    <Link to="/register">S'inscrire</Link>
                </div>
            </div>
        </div>
    );
}
