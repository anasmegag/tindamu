import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { register, clearError } from '../../store/slices/authSlice';
import './Register.css';

const NIVEAUX = ['L1', 'L2', 'L3', 'M1', 'M2'];

export default function Register() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading, error } = useSelector((state) => state.auth);

    const [form, setForm] = useState({
        student_id: '',
        email_univ: '',
        nom: '',
        prenom: '',
        password: '',
        niveau: '',
        specialite: '',
    });
    const [fieldErrors, setFieldErrors] = useState({});
    const [success, setSuccess] = useState(false);

    const validate = () => {
        const errors = {};
        if (!form.student_id.trim()) errors.student_id = "Numéro étudiant requis.";
        if (!form.email_univ.trim()) errors.email_univ = "Email requis.";
        else if (!form.email_univ.includes('@')) errors.email_univ = "Email invalide.";
        if (!form.nom.trim()) errors.nom = "Nom requis.";
        if (!form.prenom.trim()) errors.prenom = "Prénom requis.";
        if (!form.password) errors.password = "Mot de passe requis.";
        else if (form.password.length < 6) errors.password = "Minimum 6 caractères.";
        if (!form.niveau) errors.niveau = "Niveau requis.";
        return errors;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
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

        const result = await dispatch(register(form));
        if (register.fulfilled.match(result)) {
            setSuccess(true);
            setTimeout(() => navigate('/login', { replace: true }), 2000);
        }
    };

    return (
        <div className="register-page">
            <div className="register-card">
                <div className="register-logo">
                    <h1>TinAMU</h1>
                    <p>Créer un compte étudiant</p>
                </div>

                <form className="register-form" onSubmit={handleSubmit} noValidate>
                    {error && <div className="error-banner" role="alert">{error}</div>}
                    {success && (
                        <div className="success-banner">
                            Compte créé ! Redirection vers la connexion…
                        </div>
                    )}

                    {/* Nom + Prénom */}
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="prenom">Prénom</label>
                            <input
                                id="prenom" name="prenom" type="text" placeholder="Alice"
                                value={form.prenom} onChange={handleChange}
                                className={fieldErrors.prenom ? 'input-error' : ''}
                            />
                            {fieldErrors.prenom && <span className="field-error">{fieldErrors.prenom}</span>}
                        </div>
                        <div className="form-group">
                            <label htmlFor="nom">Nom</label>
                            <input
                                id="nom" name="nom" type="text" placeholder="Martin"
                                value={form.nom} onChange={handleChange}
                                className={fieldErrors.nom ? 'input-error' : ''}
                            />
                            {fieldErrors.nom && <span className="field-error">{fieldErrors.nom}</span>}
                        </div>
                    </div>

                    {/* Numéro étudiant */}
                    <div className="form-group">
                        <label htmlFor="student_id">Numéro étudiant</label>
                        <input
                            id="student_id" name="student_id" type="text" placeholder="22001234"
                            value={form.student_id} onChange={handleChange}
                            className={fieldErrors.student_id ? 'input-error' : ''}
                            autoComplete="username"
                        />
                        {fieldErrors.student_id && <span className="field-error">{fieldErrors.student_id}</span>}
                    </div>

                    {/* Email */}
                    <div className="form-group">
                        <label htmlFor="email_univ">Email universitaire</label>
                        <input
                            id="email_univ" name="email_univ" type="email"
                            placeholder="alice.martin@etu.univ-amu.fr"
                            value={form.email_univ} onChange={handleChange}
                            className={fieldErrors.email_univ ? 'input-error' : ''}
                            autoComplete="email"
                        />
                        {fieldErrors.email_univ && <span className="field-error">{fieldErrors.email_univ}</span>}
                    </div>

                    {/* Niveau + Spécialité */}
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="niveau">Niveau</label>
                            <select
                                id="niveau" name="niveau"
                                value={form.niveau} onChange={handleChange}
                                className={fieldErrors.niveau ? 'input-error' : ''}
                            >
                                <option value="">-- Choisir --</option>
                                {NIVEAUX.map((n) => <option key={n} value={n}>{n}</option>)}
                            </select>
                            {fieldErrors.niveau && <span className="field-error">{fieldErrors.niveau}</span>}
                        </div>
                        <div className="form-group">
                            <label htmlFor="specialite">Spécialité</label>
                            <input
                                id="specialite" name="specialite" type="text"
                                placeholder="Informatique…" value={form.specialite}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Mot de passe */}
                    <div className="form-group">
                        <label htmlFor="reg-password">Mot de passe</label>
                        <input
                            id="reg-password" name="password" type="password"
                            placeholder="••••••••" value={form.password}
                            onChange={handleChange}
                            className={fieldErrors.password ? 'input-error' : ''}
                            autoComplete="new-password"
                        />
                        {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
                    </div>

                    <button
                        id="btn-register"
                        type="submit"
                        className="btn-primary"
                        disabled={loading || success}
                    >
                        {loading ? 'Création du compte…' : "S'inscrire"}
                    </button>
                </form>

                <div className="register-footer">
                    Déjà un compte ?{' '}
                    <Link to="/login">Se connecter</Link>
                </div>
            </div>
        </div>
    );
}
