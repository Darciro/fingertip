import React, { useEffect, useMemo, useState } from 'react';
import FingertipLogo from './components/FingertipLogo.jsx';
import {
    INCOME_COLOR,
    EXPENSE_COLOR,
    categoriesFor,
    catById,
    DEFAULT_CATEGORY,
    brl,
    signedBrl,
    monthKey,
    monthInfo,
    lastMonths,
    todayISO,
    dayLabel,
    parseAmount,
    sum,
    ofType,
    sampleTransactions,
} from './data.js';
import './App.css';

const STORAGE_KEY = 'fingertip.transactions.v2';
const LEGACY_KEY = 'fingertip.expenses.v1';
const DEFAULT_BUDGET = 4500;

/* ---------- hooks ---------- */

function usePersistentTransactions() {
    const [items, setItems] = useState(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) return JSON.parse(raw);
            const legacy = localStorage.getItem(LEGACY_KEY); // versão só com despesas
            if (legacy)
                return JSON.parse(legacy).map((e) => ({
                    type: 'despesa',
                    ...e,
                }));
        } catch {}
        return sampleTransactions();
    });
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        } catch {}
    }, [items]);
    return [items, setItems];
}

function useMediaQuery(query) {
    const get = () =>
        typeof window !== 'undefined' && window.matchMedia(query).matches;
    const [matches, setMatches] = useState(get);
    useEffect(() => {
        const mq = window.matchMedia(query);
        const on = () => setMatches(mq.matches);
        mq.addEventListener('change', on);
        return () => mq.removeEventListener('change', on);
    }, [query]);
    return matches;
}

/* ---------- ícones ---------- */

const Icon = ({ d, size = 20, width = 2, color }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color ?? 'currentColor'}
        strokeWidth={width}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        <path d={d} />
    </svg>
);
const I = {
    prev: 'M15 18l-6-6 6-6',
    next: 'M9 18l6-6-6-6',
    plus: 'M12 5v14M5 12h14',
    up: 'M12 19V5M5 12l7-7 7 7',
    down: 'M12 5v14M5 12l7 7 7-7',
    trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
    list: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01',
    chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
};

/* ---------- componentes ---------- */

function Segmented({ options, value, onChange, label, size = 'md' }) {
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

function MonthSwitcher({ months, value, onChange }) {
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
                <Icon d={I.prev} />
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
                <Icon d={I.next} />
            </button>
        </div>
    );
}

function Kpis({ income, expense, incomeCount, budget }) {
    const balance = income - expense;
    const used = budget ? (expense / budget) * 100 : 0;
    return (
        <section className="kpis" aria-label="Resumo do mês">
            <div className="card kpi kpi--hero">
                <span className="kpi__label">Saldo do mês</span>
                <strong
                    className="kpi__value"
                    style={{ color: balance >= 0 ? INCOME_COLOR : '#FF8F8F' }}
                >
                    {signedBrl(balance)}
                </strong>
                <span className="muted small">Receitas − despesas</span>
            </div>
            <div className="card kpi">
                <span className="kpi__label">
                    <span
                        className="kpi__icon"
                        style={{ background: `${INCOME_COLOR}26` }}
                    >
                        <Icon
                            d={I.up}
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
                        style={{ background: `${EXPENSE_COLOR}26` }}
                    >
                        <Icon
                            d={I.down}
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

function CashflowChart({ months, totals, selected, onSelect }) {
    const max = Math.max(1, ...totals.flatMap((t) => [t.income, t.expense]));
    const cur = totals[months.indexOf(selected)] ?? { income: 0, expense: 0 };
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
                            color:
                                cur.income - cur.expense >= 0
                                    ? INCOME_COLOR
                                    : '#FF8F8F',
                        }}
                    >
                        {signedBrl(cur.income - cur.expense)}
                    </dd>
                </div>
            </dl>
        </section>
    );
}

function CategoryBreakdown({ items, type, onType, activeCat, onPick }) {
    const list = ofType(items, type);
    const total = sum(list);
    const cats = categoriesFor(type)
        .map((c) => ({ ...c, amount: sum(list.filter((e) => e.cat === c.id)) }))
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

function TransactionList({
    monthName,
    items,
    show,
    onShow,
    cat,
    onCat,
    onRemove,
    accent,
}) {
    const list = items.filter(
        (e) =>
            (show === 'all' || e.type === show) &&
            (cat === 'all' || e.cat === cat),
    );
    const groups = useMemo(() => {
        const map = new Map();
        [...list]
            .sort((a, b) => b.date.localeCompare(a.date))
            .forEach((e) => {
                if (!map.has(e.date)) map.set(e.date, []);
                map.get(e.date).push(e);
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
                                const c = catById(e.type, e.cat);
                                const isIncome = e.type === 'receita';
                                return (
                                    <li key={e.id} className="tx">
                                        <span
                                            className="tx__badge"
                                            style={{
                                                background: `${c.color}22`,
                                                color: c.color,
                                            }}
                                        >
                                            {c.name[0]}
                                        </span>
                                        <div className="tx__text">
                                            <span className="tx__desc">
                                                {e.desc}
                                            </span>
                                            <span className="muted small">
                                                {isIncome
                                                    ? 'Receita'
                                                    : 'Despesa'}{' '}
                                                · {c.name}
                                            </span>
                                        </div>
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
                                            aria-label={`Excluir ${e.desc}`}
                                            onClick={() => onRemove(e.id)}
                                        >
                                            <Icon
                                                d={I.trash}
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

function TransactionForm({ onAdd }) {
    const [type, setType] = useState('despesa');
    const [desc, setDesc] = useState('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(todayISO());
    const [cat, setCat] = useState(DEFAULT_CATEGORY.despesa);
    const [error, setError] = useState('');
    const [ok, setOk] = useState('');
    const isIncome = type === 'receita';

    const changeType = (t) => {
        setType(t);
        setCat(DEFAULT_CATEGORY[t]);
        setError('');
        setOk('');
    };
    const clear = () => {
        setError('');
        setOk('');
    };
    const submit = (ev) => {
        ev.preventDefault();
        const value = parseAmount(amount);
        if (!(value > 0)) return setError('Informe um valor maior que zero.');
        if (!desc.trim()) return setError('Informe uma descrição.');
        if (!date) return setError('Informe a data.');
        onAdd({
            id: crypto.randomUUID?.() ?? String(Date.now()),
            type,
            desc: desc.trim(),
            amount: Math.round(value * 100) / 100,
            date,
            cat,
        });
        setDesc('');
        setAmount('');
        setError('');
        setOk(
            `${isIncome ? 'Receita' : 'Despesa'} adicionada em ${monthInfo(monthKey(date)).name}.`,
        );
    };

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
                {[
                    { id: 'despesa', name: 'Despesa', color: EXPENSE_COLOR },
                    { id: 'receita', name: 'Receita', color: INCOME_COLOR },
                ].map((t) => (
                    <button
                        key={t.id}
                        type="button"
                        aria-pressed={type === t.id}
                        className={type === t.id ? 'is-on' : ''}
                        style={
                            type === t.id
                                ? {
                                      background: `${t.color}22`,
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
                    inputMode="decimal"
                    placeholder="0,00"
                    value={amount}
                    style={isIncome ? { color: INCOME_COLOR } : undefined}
                    onChange={(e) => {
                        setAmount(e.target.value);
                        clear();
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
                    value={desc}
                    onChange={(e) => {
                        setDesc(e.target.value);
                        clear();
                    }}
                />
            </label>
            <label className="field">
                <span>Data</span>
                <input
                    className="input"
                    type="date"
                    value={date}
                    onChange={(e) => {
                        setDate(e.target.value);
                        clear();
                    }}
                />
            </label>
            <fieldset className="field">
                <legend>Categoria</legend>
                <div className="cat-grid">
                    {categoriesFor(type).map((c) => (
                        <button
                            key={c.id}
                            type="button"
                            className={`cat-choice ${cat === c.id ? 'is-on' : ''}`}
                            aria-pressed={cat === c.id}
                            style={
                                cat === c.id
                                    ? {
                                          borderColor: c.color,
                                          background: `${c.color}26`,
                                      }
                                    : undefined
                            }
                            onClick={() => setCat(c.id)}
                        >
                            <i
                                className="swatch swatch--sm"
                                style={{ background: c.color }}
                            />
                            {c.name}
                        </button>
                    ))}
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
            <button type="submit" className="btn-primary">
                {isIncome ? 'Adicionar receita' : 'Adicionar despesa'}
            </button>
        </form>
    );
}

/* ---------- app ---------- */

export default function App({ budget = DEFAULT_BUDGET }) {
    const [items, setItems] = usePersistentTransactions();
    const months = useMemo(() => lastMonths(6), []);
    const [month, setMonth] = useState(months[months.length - 1]);
    const [show, setShow] = useState('all'); // all | receita | despesa
    const [cat, setCat] = useState('all');
    const [bdType, setBdType] = useState('despesa');
    const [view, setView] = useState('list'); // mobile: list | charts | new
    const isMobile = useMediaQuery('(max-width: 760px)');

    const info = monthInfo(month);
    const monthItems = useMemo(
        () => items.filter((e) => monthKey(e.date) === month),
        [items, month],
    );
    const income = sum(ofType(monthItems, 'receita'));
    const expense = sum(ofType(monthItems, 'despesa'));
    const totals = useMemo(
        () =>
            months.map((k) => {
                const l = items.filter((e) => monthKey(e.date) === k);
                return {
                    income: sum(ofType(l, 'receita')),
                    expense: sum(ofType(l, 'despesa')),
                };
            }),
        [items, months],
    );

    const selectMonth = (k) => {
        setMonth(k);
        setShow('all');
        setCat('all');
    };
    const changeShow = (s) => {
        setShow(s);
        setCat('all');
    };
    const pickCategory = (type, c) => {
        setShow(c === 'all' ? 'all' : type);
        setCat(c);
        if (isMobile) setView('list');
    };
    const add = (e) => {
        setItems((xs) => [...xs, e]);
        const k = monthKey(e.date);
        if (months.includes(k)) selectMonth(k);
        if (isMobile) setView('list');
    };
    const remove = (id) => setItems((xs) => xs.filter((x) => x.id !== id));
    const visible = (v) => !isMobile || view === v;

    return (
        <div className="app">
            <div className="container">
                <header className="topbar">
                    <FingertipLogo size={isMobile ? 30 : 38} />
                    <MonthSwitcher
                        months={months}
                        value={month}
                        onChange={selectMonth}
                    />
                    {!isMobile && (
                        <a className="btn-primary btn-primary--sm xxx" href="#nova">
                            <Icon d={I.plus} size={18} width={2.4} />
                            Adicionar
                        </a>
                    )}
                </header>

                {visible('list') && (
                    <Kpis
                        income={income}
                        expense={expense}
                        incomeCount={ofType(monthItems, 'receita').length}
                        budget={budget}
                    />
                )}

                <div className="layout">
                    <div className="layout__main">
                        {visible('charts') && (
                            <div className="row">
                                <CashflowChart
                                    months={months}
                                    totals={totals}
                                    selected={month}
                                    onSelect={selectMonth}
                                />
                                <CategoryBreakdown
                                    items={monthItems}
                                    type={bdType}
                                    onType={setBdType}
                                    activeCat={show === bdType ? cat : null}
                                    onPick={pickCategory}
                                />
                            </div>
                        )}
                        {visible('list') && (
                            <TransactionList
                                monthName={info.name}
                                items={monthItems}
                                show={show}
                                onShow={changeShow}
                                cat={cat}
                                onCat={setCat}
                                onRemove={remove}
                            />
                        )}
                    </div>
                    {visible('new') && (
                        <aside className="layout__side">
                            <TransactionForm onAdd={add} />
                        </aside>
                    )}
                </div>
            </div>

            {isMobile && (
                <nav className="tabbar" aria-label="Navegação principal">
                    <button
                        type="button"
                        className={view === 'list' ? 'is-on' : ''}
                        onClick={() => setView('list')}
                    >
                        <Icon d={I.list} size={22} />
                        Extrato
                    </button>
                    <button
                        type="button"
                        className="tabbar__fab"
                        aria-label="Nova movimentação"
                        onClick={() => setView('new')}
                    >
                        <Icon d={I.plus} size={26} width={2.4} />
                    </button>
                    <button
                        type="button"
                        className={view === 'charts' ? 'is-on' : ''}
                        onClick={() => setView('charts')}
                    >
                        <Icon d={I.chart} size={22} />
                        Gráficos
                    </button>
                </nav>
            )}
        </div>
    );
}
