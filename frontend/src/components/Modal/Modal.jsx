import { useEffect } from 'react';
import './Modal.css';

export default function Modal({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    className = '',
}) {
    // Close on Escape key
    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === 'Escape') onClose?.();
        };
        if (isOpen) document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [isOpen, onClose]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className={`modal modal--${size} ${className}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal__header">
                    <h2 className="modal__title">{title}</h2>
                    <button className="modal__close" onClick={onClose}>✕</button>
                </div>
                <div className="modal__body">
                    {children}
                </div>
            </div>
        </div>
    );
}
