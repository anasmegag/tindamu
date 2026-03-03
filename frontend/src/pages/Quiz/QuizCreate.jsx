import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createQuiz } from '../../store/slices/quizSlice';
import './QuizCreate.css';

const emptyQuestion = () => ({
    text: '',
    options: [
        { text: '', is_correct: false },
        { text: '', is_correct: false },
        { text: '', is_correct: false },
        { text: '', is_correct: false },
    ],
});

export default function QuizCreate() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading, error } = useSelector((s) => s.quiz);

    const [form, setForm] = useState({
        title: '',
        description: '',
        difficulty: 'MOYEN',
        time_limit: '',
        is_published: true,
    });
    const [questions, setQuestions] = useState([emptyQuestion()]);
    const [formError, setFormError] = useState('');

    const updateQuestion = (qIdx, field, value) => {
        setQuestions((prev) =>
            prev.map((q, i) => (i === qIdx ? { ...q, [field]: value } : q))
        );
    };

    const updateOption = (qIdx, oIdx, field, value) => {
        setQuestions((prev) =>
            prev.map((q, i) =>
                i === qIdx
                    ? {
                        ...q,
                        options: q.options.map((o, j) =>
                            j === oIdx ? { ...o, [field]: value } : o
                        ),
                    }
                    : q
            )
        );
    };

    const setCorrectOption = (qIdx, oIdx) => {
        setQuestions((prev) =>
            prev.map((q, i) =>
                i === qIdx
                    ? {
                        ...q,
                        options: q.options.map((o, j) => ({
                            ...o,
                            is_correct: j === oIdx,
                        })),
                    }
                    : q
            )
        );
    };

    const addQuestion = () => {
        setQuestions((prev) => [...prev, emptyQuestion()]);
    };

    const removeQuestion = (qIdx) => {
        if (questions.length <= 1) return;
        setQuestions((prev) => prev.filter((_, i) => i !== qIdx));
    };

    const validate = () => {
        if (!form.title.trim()) return 'Le titre est obligatoire.';
        for (let i = 0; i < questions.length; i++) {
            if (!questions[i].text.trim()) return `La question ${i + 1} est vide.`;
            const filledOptions = questions[i].options.filter((o) => o.text.trim());
            if (filledOptions.length < 2) return `La question ${i + 1} doit avoir au moins 2 options.`;
            const hasCorrect = questions[i].options.some((o) => o.is_correct && o.text.trim());
            if (!hasCorrect) return `La question ${i + 1} n'a pas de bonne réponse.`;
        }
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const err = validate();
        if (err) {
            setFormError(err);
            return;
        }
        setFormError('');

        const payload = {
            ...form,
            time_limit: form.time_limit ? parseInt(form.time_limit) * 60 : null,
            questions: questions.map((q, i) => ({
                text: q.text,
                order: i,
                options: q.options
                    .filter((o) => o.text.trim())
                    .map((o, j) => ({ text: o.text, is_correct: o.is_correct, order: j })),
            })),
        };

        const result = await dispatch(createQuiz(payload));
        if (createQuiz.fulfilled.match(result)) {
            navigate('/quiz');
        }
    };

    return (
        <div className="quiz-create-page">
            <div className="quiz-create-header">
                <h1>📝 Créer un quiz</h1>
                <p className="quiz-create-subtitle">Partagez vos connaissances avec la communauté TinAMU</p>
            </div>

            <form onSubmit={handleSubmit} className="quiz-create-form">
                {(formError || error) && (
                    <div className="error-banner" role="alert">
                        {formError || error}
                    </div>
                )}

                {/* Infos générales */}
                <div className="form-section">
                    <h2>Informations générales</h2>
                    <div className="form-group">
                        <label htmlFor="title">Titre *</label>
                        <input
                            id="title"
                            type="text"
                            placeholder="ex: Les bases de Python"
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">Description</label>
                        <textarea
                            id="description"
                            placeholder="Décrivez le contenu du quiz..."
                            rows={3}
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="difficulty">Difficulté</label>
                            <select
                                id="difficulty"
                                value={form.difficulty}
                                onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                            >
                                <option value="FACILE">🟢 Facile</option>
                                <option value="MOYEN">🟡 Moyen</option>
                                <option value="DIFFICILE">🔴 Difficile</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="time_limit">Durée (minutes)</label>
                            <input
                                id="time_limit"
                                type="number"
                                placeholder="ex: 10"
                                min="1"
                                max="120"
                                value={form.time_limit}
                                onChange={(e) => setForm({ ...form, time_limit: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {/* Questions */}
                <div className="form-section">
                    <div className="section-header">
                        <h2>Questions ({questions.length})</h2>
                        <button type="button" className="btn-add" onClick={addQuestion}>
                            + Ajouter
                        </button>
                    </div>

                    {questions.map((q, qIdx) => (
                        <div key={qIdx} className="question-block">
                            <div className="question-header">
                                <span className="question-number">Q{qIdx + 1}</span>
                                {questions.length > 1 && (
                                    <button
                                        type="button"
                                        className="btn-remove"
                                        onClick={() => removeQuestion(qIdx)}
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>

                            <div className="form-group">
                                <input
                                    type="text"
                                    placeholder="Texte de la question..."
                                    value={q.text}
                                    onChange={(e) => updateQuestion(qIdx, 'text', e.target.value)}
                                />
                            </div>

                            <div className="options-list">
                                {q.options.map((o, oIdx) => (
                                    <div key={oIdx} className="option-row">
                                        <button
                                            type="button"
                                            className={`option-correct-btn ${o.is_correct ? 'is-correct' : ''}`}
                                            onClick={() => setCorrectOption(qIdx, oIdx)}
                                            title="Marquer comme bonne réponse"
                                        >
                                            {o.is_correct ? '✓' : String.fromCharCode(65 + oIdx)}
                                        </button>
                                        <input
                                            type="text"
                                            placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                                            value={o.text}
                                            onChange={(e) =>
                                                updateOption(qIdx, oIdx, 'text', e.target.value)
                                            }
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Submit */}
                <div className="form-actions">
                    <button type="button" className="btn-secondary" onClick={() => navigate('/quiz')}>
                        Annuler
                    </button>
                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Création…' : '✓ Publier le quiz'}
                    </button>
                </div>
            </form>
        </div>
    );
}
