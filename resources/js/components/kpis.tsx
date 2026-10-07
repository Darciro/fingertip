import Icon, { ICONS } from '@/components/icon';
import {
    brl,
    EXPENSE_COLOR,
    INCOME_COLOR,
    NEGATIVE_COLOR,
    signedBrl,
    tint,
} from '@/lib/fingertip';

type Props = {
    income: number;
    expense: number;
    incomeCount: number;
    budget: number;
};

export default function Kpis({ income, expense, incomeCount, budget }: Props) {
    const balance = income - expense;
    const used = budget ? (expense / budget) * 100 : 0;
    return (
        <section className="kpis" aria-label="Resumo do mês">
            <div className="card kpi kpi--hero">
                <span className="kpi__label">Saldo do mês</span>
                <strong
                    className="kpi__value"
                    style={{
                        color: balance >= 0 ? INCOME_COLOR : NEGATIVE_COLOR,
                    }}
                >
                    {signedBrl(balance)}
                </strong>
                <span className="muted small">Receitas − despesas</span>
            </div>
            <div className="card kpi">
                <span className="kpi__label">
                    <span
                        className="kpi__icon"
                        style={{ background: tint(INCOME_COLOR, 15) }}
                    >
                        <Icon
                            d={ICONS.up}
                            size={14}
                            width={2.4}
                            color={INCOME_COLOR}
                        />
                    </span>
                    Receitas
                </span>
                <strong className="kpi__value">{brl(income)}</strong>
                <span className="muted small">
                    {incomeCount} {incomeCount === 1 ? 'entrada' : 'entradas'}
                </span>
            </div>
            <div className="card kpi">
                <span className="kpi__label">
                    <span
                        className="kpi__icon"
                        style={{ background: tint(EXPENSE_COLOR, 15) }}
                    >
                        <Icon
                            d={ICONS.down}
                            size={14}
                            width={2.4}
                            color={EXPENSE_COLOR}
                        />
                    </span>
                    Despesas
                </span>
                <strong className="kpi__value">{brl(expense)}</strong>
                <div
                    className="progress"
                    role="progressbar"
                    aria-label="Orçamento usado"
                    aria-valuenow={Math.round(used)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                >
                    <span
                        style={{
                            width: `${Math.min(100, used)}%`,
                            background:
                                used > 90 ? 'var(--danger)' : 'var(--accent)',
                        }}
                    />
                </div>
                <span className="muted small">
                    {Math.round(used)}% do orçamento de {brl(budget)}
                </span>
            </div>
            <div className="card kpi kpi--savings">
                <span className="kpi__label">Taxa de poupança</span>
                <strong className="kpi__value">
                    {income > 0
                        ? `${Math.round((balance / income) * 100)}%`
                        : '—'}
                </strong>
                <span className="muted small">
                    das receitas ficaram com você
                </span>
            </div>
        </section>
    );
}
