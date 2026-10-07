import { useForm } from "@inertiajs/react";
import type { FormEvent } from "react";
import { useState } from "react";
import Segmented from "@/components/segmented";
import { store as storeExpense } from "@/actions/App/Http/Controllers/ExpenseController";
import { store as storeIncome } from "@/actions/App/Http/Controllers/IncomeController";
import type { CategoryId, TransactionType } from "@/lib/fingertip";
import {
    categoriesFor,
    DEFAULT_CATEGORY,
    EXPENSE_COLOR,
    INCOME_COLOR,
    maskAmount,
    monthInfo,
    monthKey,
    SETTLED_LABELS,
    tint,
    todayISO,
} from "@/lib/fingertip";

const TYPES = [
    { id: "despesa", name: "Despesa", color: EXPENSE_COLOR },
    { id: "receita", name: "Receita", color: INCOME_COLOR },
] as const;

type Props = { onAdded: (date: string) => void };

/**
 * A validação é feita no servidor (ExpenseController::store / IncomeController::store);
 * os erros voltam em `form.errors`.
 */
export default function TransactionForm({ onAdded }: Props) {
    const [type, setType] = useState<TransactionType>("despesa");
    const form = useForm({
        amount: "",
        description: "",
        date: todayISO(),
        category: DEFAULT_CATEGORY.despesa as CategoryId,
        settled: true,
    });
    const [ok, setOk] = useState("");
    const isIncome = type === "receita";

    /** Limpa os avisos assim que o usuário volta a editar o formulário. */
    const touch = () => {
        form.clearErrors();
        setOk("");
    };
    const changeType = (t: TransactionType) => {
        setType(t);
        form.setData("category", DEFAULT_CATEGORY[t]);
        touch();
    };
    const submit = (ev: FormEvent<HTMLFormElement>) => {
        ev.preventDefault();
        const { date } = form.data;
        form.post(isIncome ? storeIncome.url() : storeExpense.url(), {
            preserveScroll: true,
            onSuccess: () => {
                form.reset("amount", "description");
                setOk(
                    `${isIncome ? "Receita" : "Despesa"} adicionada em ${monthInfo(monthKey(date)).name}.`,
                );
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
                        className={type === t.id ? "is-on" : ""}
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
                        form.setData("amount", maskAmount(e.target.value));
                        touch();
                    }}
                />
            </label>
            <label className="field">
                <span>Descrição</span>
                <input
                    className="input"
                    placeholder={
                        isIncome ? "Ex.: Salário" : "Ex.: Supermercado"
                    }
                    maxLength={120}
                    value={form.data.description}
                    aria-invalid={!!form.errors.description}
                    onChange={(e) => {
                        form.setData("description", e.target.value);
                        touch();
                    }}
                />
            </label>
            <div className="field-row">
                <label className="field">
                    <span>Data</span>
                    <input
                        className="input"
                        type="date"
                        value={form.data.date}
                        aria-invalid={!!form.errors.date}
                        onChange={(e) => {
                            form.setData("date", e.target.value);
                            touch();
                        }}
                    />
                </label>
                <div className="field">
                    <span>Situação</span>
                    <Segmented
                        label={isIncome ? "Receita recebida?" : "Despesa paga?"}
                        value={form.data.settled ? "yes" : "no"}
                        onChange={(v) => {
                            form.setData("settled", v === "yes");
                            touch();
                        }}
                        options={[
                            { id: "yes", name: SETTLED_LABELS[type][0] },
                            { id: "no", name: SETTLED_LABELS[type][1] },
                        ]}
                    />
                </div>
            </div>
            <fieldset className="field">
                <legend>Categoria</legend>
                <div className="cat-grid">
                    {categoriesFor(type).map((c) => {
                        const on = form.data.category === c.id;
                        return (
                            <button
                                key={c.id}
                                type="button"
                                className={`cat-choice ${on ? "is-on" : ""}`}
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
                                    form.setData("category", c.id);
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
                    ? "Salvando…"
                    : isIncome
                      ? "Adicionar receita"
                      : "Adicionar despesa"}
            </button>
        </form>
    );
}
