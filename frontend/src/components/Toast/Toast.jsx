import { useState, useEffect } from 'react';
import './Toast.css';

export default function Toast({ message, type = 'info', duration = 3000, onClose }) {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(false);
            setTimeout(() => onClose?.(), 300); // wait for fade-out animation
        }, duration);
        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const icons = {
        success: '✓',
        danger: '✕',
        warning: '⚠',
        info: 'ℹ',
    };

    return (
        <div className={`toast toast--${type} ${visible ? 'toast--enter' : 'toast--exit'}`}>
            <span className="toast__icon">{icons[type]}</span>
            <span className="toast__message">{message}</span>
            <button className="toast__close" onClick={() => { setVisible(false); onClose?.(); }}>✕</button>
        </div>
    );
}
