import './Skeleton.css';

export default function Skeleton({
    width = '100%',
    height = '1rem',
    borderRadius,
    variant = 'text',
    className = '',
}) {
    const style = {
        width,
        height: variant === 'circle' ? width : height,
        borderRadius: borderRadius || (variant === 'circle' ? '50%' : 'var(--radius-sm)'),
    };

    return <div className={`skeleton ${className}`} style={style} />;
}
