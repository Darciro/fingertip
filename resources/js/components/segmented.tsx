type Props<T extends string> = {
    options: { id: T; name: string }[];
    value: T;
    onChange: (id: T) => void;
    label: string;
    size?: 'sm' | 'md';
    /** Ocupa a largura toda, com botões de tamanho igual (usado no formulário). */
    block?: boolean;
};

export default function Segmented<T extends string>({
    options,
    value,
    onChange,
    label,
    size = 'md',
    block = false,
}: Props<T>) {
    return (
        <div
            className={`segmented segmented--${size}${block ? ' segmented--block' : ''}`}
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
