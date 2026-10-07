type Props<T extends string> = {
    options: { id: T; name: string }[];
    value: T;
    onChange: (id: T) => void;
    label: string;
    size?: 'sm' | 'md';
};

export default function Segmented<T extends string>({
    options,
    value,
    onChange,
    label,
    size = 'md',
}: Props<T>) {
    return (
        <div
            className={`segmented segmented--${size}`}
            role="group"
            aria-label={label}
        >
            {options.map((o) => (
                <button
                    key={o.id}
                    type="button"
                    aria-pressed={value === o.id}
                    className={value === o.id ? 'is-on' : ''}
                    onClick={() => onChange(o.id)}
                >
                    {o.name}
                </button>
            ))}
        </div>
    );
}
