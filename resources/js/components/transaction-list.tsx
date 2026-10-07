import { useMemo } from 'react';
import Icon, { ICONS } from '@/components/icon';
import Segmented from '@/components/segmented';
import type { Transaction, TransactionType } from '@/lib/fingertip';
import {
    brl,
    catById,
    categoriesFor,
    dayLabel,
    INCOME_COLOR,
    ofType,
    SETTLED_LABELS,
    signedBrl,
    sum,
    tint,
} from '@/lib/fingertip';

export type Show = 'all' | TransactionType;

type Props = {
    monthName: string;
    items: Transaction[];
    show: Show;
    onShow: (show: Show) => void;
    cat: string;
    onCat: (cat: string) => void;
    onRemove: (item: Transaction) => void;
};

export default function TransactionList({
    monthName,
    items,
    show,
    onShow,
    cat,
    onCat,
    onRemove,
}: Props) {
    const list = items.filter(
        (e) =>
            (show === 'all' || e.type === show) &&
            (cat === 'all' || e.category === cat),
    );
    const groups = useMemo(() => {
        const map = new Map<string, Transaction[]>();
        [...list]
            .sort((a, b) => b.date.localeCompare(a.date))
            .forEach((e) => {
                if (!map.has(e.date)) map.set(e.date, []);
                map.get(e.date)!.push(e);
            });
        return [...map.entries()];
    }, [list]);

    return (
        <section className="card">
            <header className="card__head card__head--center">
                <h2>Movimentações de {monthName}</h2>
                <Segmented
                    label="Mostrar"
                    value={show}
                    onChange={onShow}
                    options={[
                        { id: 'all', name: 'Tudo' },
                        { id: 'receita', name: 'Receitas' },
                        { id: 'despesa', name: 'Despesas' },
                    ]}
                />
            </header>
            {show !== 'all' && (
                <div
                    className="chips"
                    role="group"
                    aria-label="Filtrar por categoria"
                >
                    {[{ id: 'all', name: 'Todas' }, ...categoriesFor(show)].map(
                        (c) => (
                            <button
                                key={c.id}
                                type="button"
                                className={`chip ${cat === c.id ? 'is-on' : ''}`}
                                aria-pressed={cat === c.id}
                                onClick={() => onCat(c.id)}
                            >
                                {c.name}
                            </button>
                        ),
                    )}
                </div>
            )}
            {groups.length === 0 && (
                <p className="empty">
                    Nenhuma movimentação com esse filtro em {monthName}.
                </p>
            )}
            {groups.map(([date, dayItems]) => {
                const net =
                    sum(ofType(dayItems, 'receita')) -
                    sum(ofType(dayItems, 'despesa'));
                return (
                    <div key={date} className="day">
                        <div className="day__head">
                            <span>{dayLabel(date)}</span>
                            <span className="num">{signedBrl(net)}</span>
                        </div>
                        <ul>
                            {dayItems.map((e) => {
                                const c = catById(e.type, e.category);
                                const isIncome = e.type === 'receita';
                                return (
                                    <li key={e.key} className="tx">
                                        <span
                                            className="tx__badge"
                                            style={{
                                                background: tint(c.color, 13),
                                                color: c.color,
                                            }}
                                        >
                                            {c.name[0]}
                                        </span>
                                        <div className="tx__text">
                                            <span className="tx__desc">
                                                {e.description}
                                            </span>
                                            <span className="muted small">
                                                {isIncome
                                                    ? 'Receita'
                                                    : 'Despesa'}{' '}
                                                · {c.name}
                                            </span>
                                        </div>
                                        <span
                                            className={`status ${e.settled ? 'is-settled' : 'is-pending'}`}
                                        >
                                            {
                                                SETTLED_LABELS[e.type][
                                                    e.settled ? 0 : 1
                                                ]
                                            }
                                        </span>
                                        <strong
                                            className="num nowrap"
                                            style={{
                                                color: isIncome
                                                    ? INCOME_COLOR
                                                    : undefined,
                                            }}
                                        >
                                            {isIncome ? '+ ' : '− '}
                                            {brl(e.amount)}
                                        </strong>
                                        <button
                                            type="button"
                                            className="icon-btn icon-btn--ghost"
                                            aria-label={`Excluir ${e.description}`}
                                            onClick={() => onRemove(e)}
                                        >
                                            <Icon
                                                d={ICONS.trash}
                                                size={18}
                                                width={1.8}
                                            />
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                );
            })}
        </section>
    );
}
