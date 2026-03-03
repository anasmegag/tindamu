import './Input.css';

export default function Input({
    label,
    error,
    icon,
    className = '',
    ...props
}) {
    return (
        <div className={`input-group ${error ? 'input-group--error' : ''} ${className}`}>
            {label && <label className="input-group__label">{label}</label>}
            <div className="input-group__wrapper">
                {icon && <span className="input-group__icon">{icon}</span>}
                <input
                    className={`input-group__field ${icon ? 'input-group__field--with-icon' : ''}`}
                    {...props}
                />
            </div>
            {error && <span className="input-group__error">{error}</span>}
        </div>
    );
}
