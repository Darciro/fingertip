import Segmented from '@/components/segmented';
import type { Transaction, TransactionType } from '@/lib/fingertip';
import { brl, categoriesFor, ofType, sum } from '@/lib/fingertip';

type Props = {
    items: Transaction[];
    type: TransactionType;
    onType: (type: TransactionType) => void;
    activeCat: string | null;
    onPick: (type: TransactionType, cat: string) => void;
};

export default function CategoryBreakdown({
    items,
    type,
    onType,
    activeCat,
    onPick,
}: Props) {
    const list = ofType(items, type);
    const total = sum(list);
    const cats = categoriesFor(type)
        .map((c) => ({
            ...c,
            amount: sum(list.filter((e) => e.category === c.id)),
        }))
        .filter((c) => c.amount > 0)
        .map((c) => ({ ...c, pct: (c.amount / total) * 100 }))
        .sort((a, b) => b.amount - a.amount);
    return (
        <section className="card">
            <header className="card__head card__head--center">
                <h2>Por categoria</h2>
                <Segmented
                    size="sm"
                    label="Tipo"
                    value={type}
                    onChange={onType}
                    options={[
                        { id: 'despesa', name: 'Despesas' },
                        { id: 'receita', name: 'Receitas' },
                    ]}
                />
            </header>
            <div className="stack-bar" aria-hidden="true">
                {cats.map((c) => (
                    <span
                        key={c.id}
                        style={{ width: `${c.pct}%`, background: c.color }}
                    />
                ))}
            </div>
            {cats.length === 0 && (
                <p className="muted small">Nada registrado neste mês.</p>
            )}
            <ul className="cat-list">
                {cats.map((c) => (
                    <li key={c.id}>
                        <button
                            type="button"
                            className={`cat-row ${activeCat === c.id ? 'is-on' : ''}`}
                            aria-pressed={activeCat === c.id}
                            onClick={() =>
                                onPick(type, activeCat === c.id ? 'all' : c.id)
                            }
                        >
                            <i
                                className="swatch"
                                style={{ background: c.color }}
                            />
                            <span>{c.name}</span>
                            <strong className="num">{brl(c.amount)}</strong>
                            <span className="muted num">
                                {Math.round(c.pct)}%
                            </span>
                        </button>
                    </li>
                ))}
            </ul>
        </section>
    );
}
