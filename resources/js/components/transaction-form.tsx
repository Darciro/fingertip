import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import Segmented from '@/components/segmented';
import { store as storeExpense } from '@/actions/App/Http/Controllers/ExpenseController';
import { store as storeIncome } from '@/actions/App/Http/Controllers/IncomeController';
import type { CategoryId, TransactionType } from '@/lib/fingertip';
import {
    addMonths,
    brl,
    categoriesFor,
    DEFAULT_CATEGORY,
    EXPENSE_COLOR,
    INCOME_COLOR,
    maskAmount,
    MAX_INSTALLMENTS,
    monthInfo,
    monthKey,
    parseAmount,
    SETTLED_LABELS,
    splitAmount,
    tint,
    todayISO,
} from '@/lib/fingertip';

const TYPES = [
    { id: 'despesa', name: 'Despesa', color: EXPENSE_COLOR },
    { id: 'receita', name: 'Receita', color: INCOME_COLOR },
] as const;

type Props = { onAdded: (date: string) => void };

type InstallmentValue = 'total' | 'installment';

/** Resumo do parcelamento exibido abaixo dos campos, ex.: "10× de R$ 123,45". */
function installmentSummary(
    amount: string,
    count: number,
    value: InstallmentValue,
    date: string,
) {
    const total = parseAmount(amount);
    if (!total || count < 2 || count > MAX_INSTALLMENTS) return null;
    const parts = splitAmount(total, count, value === 'installment');
    if (parts[parts.length - 1] <= 0) return null;
    const last = monthInfo(addMonths(monthKey(date || todayISO()), count - 1));
    const sumAll = parts.reduce((a, v) => a + v, 0);
    const head =
        parts[0] === parts[1]
            ? `${count}× de ${brl(parts[1])}`
            : `1× de ${brl(parts[0])} + ${count - 1}× de ${brl(parts[1])}`;
    return {
        head,
        detail: `Total de ${brl(sumAll)} · última parcela em ${last.short.toLowerCase()} ${last.year}`,
    };
}

/**
 * A validação é feita no servidor (ExpenseController::store / IncomeController::store);
 * os erros voltam em `form.errors`.
 */
export default function TransactionForm({ onAdded }: Props) {
    const [type, setType] = useState<TransactionType>('despesa');
    const form = useForm({
        amount: '',
        description: '',
        date: todayISO(),
        category: DEFAULT_CATEGORY.despesa as CategoryId,
        settled: true,
        installments: '2',
        installment_value: 'total' as InstallmentValue,
    });
    const [ok, setOk] = useState('');
    const [split, setSplit] = useState(false); // despesa parcelada?
    const isIncome = type === 'receita';
    const isSplit = !isIncome && split;
    const count = Number(form.data.installments) || 0;
    const summary = isSplit
        ? installmentSummary(
              form.data.amount,
              count,
              form.data.installment_value,
              form.data.date,
          )
        : null;

    /** Limpa os avisos assim que o usuário volta a editar o formulário. */
    const touch = () => {
        form.clearErrors();
        setOk('');
    };
    const changeType = (t: TransactionType) => {
        setType(t);
        form.setData('category', DEFAULT_CATEGORY[t]);
        touch();
    };
    const submit = (ev: FormEvent<HTMLFormElement>) => {
        ev.preventDefault();
        const { date } = form.data;
        const parcels = isSplit ? count : 1;
        form.transform((d) => ({ ...d, installments: String(parcels) }));
        form.post(isIncome ? storeIncome.url() : storeExpense.url(), {
            preserveScroll: true,
            onSuccess: () => {
                form.reset('amount', 'description');
                const month = monthInfo(monthKey(date)).name;
                setOk(
                    parcels > 1
                        ? `Despesa parcelada em ${parcels}x a partir de ${month}.`
                        : `${isIncome ? 'Receita' : 'Despesa'} adicionada em ${month}.`,
                );
                setSplit(false);
                onAdded(date);
            },
        });
    };
    const error = Object.values(form.errors)[0];

    return (
        <form id="nova" className="card form" onSubmit={submit} noValidate>
            <h2>Nova movimentação</h2>
            <p className="muted small">
                Registre um gasto ou um dinheiro que entrou.
            </p>
            <div
                className="type-toggle"
                role="group"
                aria-label="Tipo de movimentação"
            >
                {TYPES.map((t) => (
                    <button
                        key={t.id}
                        type="button"
                        aria-pressed={type === t.id}
                        className={type === t.id ? 'is-on' : ''}
                        style={
                            type === t.id
                                ? {
                                      background: tint(t.color, 13),
                                      borderColor: t.color,
                                  }
                                : undefined
                        }
                        onClick={() => changeType(t.id)}
                    >
                        <i className="dot" style={{ background: t.color }} />
                        {t.name}
                    </button>
                ))}
            </div>
            <label className="field">
                <span>Valor (R$)</span>
                <input
                    className="input input--amount num"
                    inputMode="numeric"
                    placeholder="0,00"
                    value={form.data.amount}
                    aria-invalid={!!form.errors.amount}
                    style={isIncome ? { color: INCOME_COLOR } : undefined}
                    onChange={(e) => {
                        form.setData('amount', maskAmount(e.target.value));
                        touch();
                    }}
                />
            </label>
            <label className="field">
                <span>Descrição</span>
                <input
                    className="input"
                    placeholder={
                        isIncome ? 'Ex.: Salário' : 'Ex.: Supermercado'
                    }
                    maxLength={120}
                    value={form.data.description}
                    aria-invalid={!!form.errors.description}
                    onChange={(e) => {
                        form.setData('description', e.target.value);
                        touch();
                    }}
                />
            </label>
            <label className="field">
                <span>Data</span>
                <input
                    className="input"
                    type="date"
                    value={form.data.date}
                    aria-invalid={!!form.errors.date}
                    onChange={(e) => {
                        form.setData('date', e.target.value);
                        touch();
                    }}
                />
            </label>
            <div className="field">
                <span>{isSplit ? 'Situação da 1ª parcela' : 'Situação'}</span>
                <Segmented
                    block
                    label={isIncome ? 'Receita recebida?' : 'Despesa paga?'}
                    value={form.data.settled ? 'yes' : 'no'}
                    onChange={(v) => {
                        form.setData('settled', v === 'yes');
                        touch();
                    }}
                    options={[
                        { id: 'yes', name: SETTLED_LABELS[type][0] },
                        { id: 'no', name: SETTLED_LABELS[type][1] },
                    ]}
                />
            </div>
            {!isIncome && (
                <div className="field">
                    <span>Pagamento</span>
                    <Segmented
                        block
                        label="Forma de pagamento"
                        value={split ? 'split' : 'single'}
                        onChange={(v) => {
                            setSplit(v === 'split');
                            touch();
                        }}
                        options={[
                            { id: 'single', name: 'À vista' },
                            { id: 'split', name: 'Parcelado' },
                        ]}
                    />
                </div>
            )}
            {isSplit && (
                <div className="installments">
                    <div className="installments__count">
                        <span id="parcelas-label">Parcelas</span>
                        <div
                            className="stepper"
                            role="group"
                            aria-labelledby="parcelas-label"
                        >
                            <button
                                type="button"
                                className="icon-btn"
                                aria-label="Menos parcelas"
                                disabled={count <= 2}
                                onClick={() => {
                                    form.setData(
                                        'installments',
                                        String(Math.max(2, count - 1)),
                                    );
                                    touch();
                                }}
                            >
                                −
                            </button>
                            <input
                                className="num"
                                inputMode="numeric"
                                aria-label="Número de parcelas"
                                value={form.data.installments}
                                aria-invalid={!!form.errors.installments}
                                onChange={(e) => {
                                    form.setData(
                                        'installments',
                                        e.target.value
                                            .replace(/\D/g, '')
                                            .slice(0, 3),
                                    );
                                    touch();
                                }}
                                onBlur={() =>
                                    form.setData(
                                        'installments',
                                        String(
                                            Math.min(
                                                MAX_INSTALLMENTS,
                                                Math.max(2, count),
                                            ),
                                        ),
                                    )
                                }
                            />
                            <button
                                type="button"
                                className="icon-btn"
                                aria-label="Mais parcelas"
                                disabled={count >= MAX_INSTALLMENTS}
                                onClick={() => {
                                    form.setData(
                                        'installments',
                                        String(
                                            Math.min(
                                                MAX_INSTALLMENTS,
                                                count + 1,
                                            ),
                                        ),
                                    );
                                    touch();
                                }}
                            >
                                +
                            </button>
                        </div>
                    </div>
                    <div className="field">
                        <span>O valor informado é</span>
                        <Segmented
                            block
                            label="O valor informado é"
                            value={form.data.installment_value}
                            onChange={(v) => {
                                form.setData('installment_value', v);
                                touch();
                            }}
                            options={[
                                { id: 'total', name: 'Total' },
                                { id: 'installment', name: 'Da parcela' },
                            ]}
                        />
                    </div>
                    <p className="installments__summary" aria-live="polite">
                        <strong className="num">
                            {summary
                                ? summary.head
                                : 'Informe o valor para ver as parcelas'}
                        </strong>
                        <span className="muted small">
                            {summary
                                ? summary.detail
                                : 'Uma parcela por mês, a partir da data escolhida.'}
                        </span>
                    </p>
                </div>
            )}
            <fieldset className="field">
                <legend>Categoria</legend>
                <div className="cat-grid">
                    {categoriesFor(type).map((c) => {
                        const on = form.data.category === c.id;
                        return (
                            <button
                                key={c.id}
                                type="button"
                                className={`cat-choice ${on ? 'is-on' : ''}`}
                                aria-pressed={on}
                                style={
                                    on
                                        ? {
                                              borderColor: c.color,
                                              background: tint(c.color, 15),
                                          }
                                        : undefined
                                }
                                onClick={() => {
                                    form.setData('category', c.id);
                                    touch();
                                }}
                            >
                                <i
                                    className="swatch swatch--sm"
                                    style={{ background: c.color }}
                                />
                                {c.name}
                            </button>
                        );
                    })}
                </div>
            </fieldset>
            {error && (
                <div role="alert" className="notice notice--error">
                    {error}
                </div>
            )}
            {ok && (
                <div role="status" className="notice notice--ok">
                    {ok}
                </div>
            )}
            <button
                type="submit"
                className="btn-primary"
                disabled={form.processing}
            >
                {form.processing
                    ? 'Salvando…'
                    : isIncome
                      ? 'Adicionar receita'
                      : 'Adicionar despesa'}
            </button>
        </form>
    );
}
