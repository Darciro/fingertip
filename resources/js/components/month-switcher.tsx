import Icon, { ICONS } from '@/components/icon';
import { monthInfo } from '@/lib/fingertip';

type Props = {
    months: string[];
    value: string;
    onChange: (key: string) => void;
};

export default function MonthSwitcher({ months, value, onChange }: Props) {
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
                {m.name} {m.year}
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
