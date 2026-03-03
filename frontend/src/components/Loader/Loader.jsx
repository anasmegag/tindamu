import './Loader.css';

export default function Loader({ size = 'md', className = '' }) {
    return (
        <div className={`loader loader--${size} ${className}`}>
            <div className="loader__spinner" />
        </div>
    );
}
