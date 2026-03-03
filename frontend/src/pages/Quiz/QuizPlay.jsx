import { useEffect, useState, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { startQuiz, submitQuiz, clearSession } from '../../store/slices/quizSlice';
import './QuizPlay.css';

export default function QuizPlay() {
    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { session, loading, error, lastResult } = useSelector((s) => s.quiz);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const timerRef = useRef(null);
    const startTimeRef = useRef(null);

    useEffect(() => {
        dispatch(clearSession());
        dispatch(startQuiz(id));
        startTimeRef.current = Date.now();
    }, [dispatch, id]);

    // Timer
    useEffect(() => {
        if (session?.time_limit && !submitted) {
            setTimeLeft(session.time_limit);
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        handleSubmit();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timerRef.current);
    }, [session]);

    const handleSubmit = useCallback(() => {
        if (submitted) return;
        setSubmitted(true);
        clearInterval(timerRef.current);

        const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const answersList = Object.entries(answers).map(([questionId, optionId]) => ({
            question_id: questionId,
            option_id: optionId,
        }));

        dispatch(submitQuiz({ quizId: id, answers: answersList, timeSpent }));
    }, [submitted, answers, dispatch, id]);

    // Redirect to result page when we have the result
    useEffect(() => {
        if (lastResult) {
            navigate(`/quiz/${id}/result`, { replace: true });
        }
    }, [lastResult, navigate, id]);

    const selectOption = (questionId, optionId) => {
        if (submitted) return;
        setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    if (loading && !session) {
        return (
            <div className="quiz-play-page">
                <div className="quiz-loading">
                    <div className="spinner" />
                    <p>Chargement du quiz...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="quiz-play-page">
                <div className="quiz-error">
                    <span>⚠️</span>
                    <p>{error}</p>
                    <button className="btn-primary" onClick={() => navigate('/quiz')}>
                        Retour aux quiz
                    </button>
                </div>
            </div>
        );
    }

    if (!session) return null;

    const question = session.questions[currentIndex];
    const progress = ((currentIndex + 1) / session.questions_count) * 100;
    const answeredCount = Object.keys(answers).length;

    return (
        <div className="quiz-play-page">
            <div className="quiz-play-container">
                {/* Header */}
                <div className="quiz-play-header">
                    <h2>{session.title}</h2>
                    <div className="quiz-play-meta">
                        <span className="quiz-play-progress-text">
                            Question {currentIndex + 1} / {session.questions_count}
                        </span>
                        {timeLeft !== null && (
                            <span className={`quiz-timer ${timeLeft <= 30 ? 'timer-danger' : ''}`}>
                                ⏱ {formatTime(timeLeft)}
                            </span>
                        )}
                    </div>
                </div>

                {/* Progress bar */}
                <div className="quiz-progress-bar">
                    <div className="quiz-progress-fill" style={{ width: `${progress}%` }} />
                </div>

                {/* Question */}
                <div className="quiz-question-card">
                    <h3 className="quiz-question-text">{question.text}</h3>

                    <div className="quiz-options">
                        {question.options.map((option, idx) => (
                            <button
                                key={option.id}
                                className={`quiz-option ${answers[question.id] === option.id ? 'selected' : ''}`}
                                onClick={() => selectOption(question.id, option.id)}
                            >
                                <span className="option-letter">
                                    {String.fromCharCode(65 + idx)}
                                </span>
                                <span className="option-text">{option.text}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Navigation */}
                <div className="quiz-play-nav">
                    <button
                        className="btn-secondary"
                        disabled={currentIndex === 0}
                        onClick={() => setCurrentIndex((i) => i - 1)}
                    >
                        ← Précédent
                    </button>

                    {currentIndex < session.questions_count - 1 ? (
                        <button
                            className="btn-primary"
                            onClick={() => setCurrentIndex((i) => i + 1)}
                        >
                            Suivant →
                        </button>
                    ) : (
                        <button
                            className="btn-submit"
                            onClick={handleSubmit}
                            disabled={submitted || loading}
                        >
                            {loading ? 'Envoi…' : `✓ Terminer (${answeredCount}/${session.questions_count})`}
                        </button>
                    )}
                </div>

                {/* Question dots */}
                <div className="quiz-dots">
                    {session.questions.map((q, i) => (
                        <button
                            key={q.id}
                            className={`quiz-dot ${i === currentIndex ? 'current' : ''} ${answers[q.id] ? 'answered' : ''}`}
                            onClick={() => setCurrentIndex(i)}
                        >
                            {i + 1}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
