import {
    brl,
    EXPENSE_COLOR,
    INCOME_COLOR,
    monthInfo,
    NEGATIVE_COLOR,
    signedBrl,
} from '@/lib/fingertip';

export type MonthTotals = { income: number; expense: number };

type Props = {
    months: string[];
    totals: MonthTotals[];
    selected: string;
    onSelect: (key: string) => void;
};

export default function CashflowChart({
    months,
    totals,
    selected,
    onSelect,
}: Props) {
    const max = Math.max(1, ...totals.flatMap((t) => [t.income, t.expense]));
    const cur = totals[months.indexOf(selected)] ?? { income: 0, expense: 0 };
    const balance = cur.income - cur.expense;
    return (
        <section className="card">
            <header className="card__head">
                <h2>Receitas × despesas</h2>
                <div className="legend">
                    <span>
                        <i
                            className="swatch swatch--sm"
                            style={{ background: INCOME_COLOR }}
                        />
                        Receitas
                    </span>
                    <span>
                        <i
                            className="swatch swatch--sm"
                            style={{ background: EXPENSE_COLOR }}
                        />
                        Despesas
                    </span>
                </div>
            </header>
            <div className="bars">
                {months.map((key, i) => {
                    const m = monthInfo(key);
                    const on = key === selected;
                    return (
                        <button
                            key={key}
                            type="button"
                            className={`bar ${on ? 'is-on' : ''}`}
                            aria-pressed={on}
                            onClick={() => onSelect(key)}
                            aria-label={`${m.name}: receitas ${brl(totals[i].income)}, despesas ${brl(totals[i].expense)}`}
                        >
                            <span className="bar__pair">
                                <span
                                    style={{
                                        height: `${Math.max(2, (totals[i].income / max) * 100)}%`,
                                        background: INCOME_COLOR,
                                    }}
                                />
                                <span
                                    style={{
                                        height: `${Math.max(2, (totals[i].expense / max) * 100)}%`,
                                        background: EXPENSE_COLOR,
                                    }}
                                />
                            </span>
                            <span className="bar__label">{m.short}</span>
                        </button>
                    );
                })}
            </div>
            <dl className="totals">
                <div>
                    <dt>Receitas</dt>
                    <dd className="num">{brl(cur.income)}</dd>
                </div>
                <div>
                    <dt>Despesas</dt>
                    <dd className="num">{brl(cur.expense)}</dd>
                </div>
                <div>
                    <dt>Saldo</dt>
                    <dd
                        className="num"
                        style={{
                            color: balance >= 0 ? INCOME_COLOR : NEGATIVE_COLOR,
                        }}
                    >
                        {signedBrl(balance)}
                    </dd>
                </div>
            </dl>
        </section>
    );
}
