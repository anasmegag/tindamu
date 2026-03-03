import './Card.css';

export default function Card({
    children,
    padding = 'md',
    hoverable = false,
    className = '',
    onClick,
    ...props
}) {
    const classes = [
        'card',
        `card--pad-${padding}`,
        hoverable && 'card--hoverable',
        className,
    ].filter(Boolean).join(' ');

    return (
        <div className={classes} onClick={onClick} {...props}>
            {children}
        </div>
    );
}
