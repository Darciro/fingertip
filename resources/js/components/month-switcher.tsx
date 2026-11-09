import Icon, { ICONS } from '@/components/icon';
import { monthInfo } from '@/lib/fingertip';

type Props = {
    months: string[];
    value: string;
    onChange: (key: string) => void;
    /** Rótulo curto ("Nov 2026"), para caber no cabeçalho do mobile. */
    compact?: boolean;
};

export default function MonthSwitcher({
    months,
    value,
    onChange,
    compact = false,
}: Props) {
    const i = months.indexOf(value);
    const m = monthInfo(value);
    return (
        <div className="month-switcher">
            <button
                type="button"
                className="icon-btn"
                aria-label="Mês anterior"
                disabled={i <= 0}
                onClick={() => onChange(months[i - 1])}
            >
                <Icon d={ICONS.prev} />
            </button>
            <span className="month-switcher__label">
                {compact ? m.short : m.name} {m.year}
            </span>
            <button
                type="button"
                className="icon-btn"
                aria-label="Próximo mês"
                disabled={i >= months.length - 1}
                onClick={() => onChange(months[i + 1])}
            >
                <Icon d={ICONS.next} />
            </button>
        </div>
    );
}
