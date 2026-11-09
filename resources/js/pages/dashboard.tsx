import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { destroy as logout } from '@/actions/App/Http/Controllers/Auth/AuthenticatedSessionController';
import { destroy as destroyExpense } from '@/actions/App/Http/Controllers/ExpenseController';
import { destroy as destroyIncome } from '@/actions/App/Http/Controllers/IncomeController';
import CashflowChart from '@/components/cashflow-chart';
import CategoryBreakdown from '@/components/category-breakdown';
import FingertipLogo from '@/components/fingertip-logo';
import Icon, { ICONS } from '@/components/icon';
import Kpis from '@/components/kpis';
import MonthSwitcher from '@/components/month-switcher';
import TransactionForm from '@/components/transaction-form';
import type { Show } from '@/components/transaction-list';
import TransactionList from '@/components/transaction-list';
import type {
    Transaction,
    TransactionRecord,
    TransactionType,
} from '@/lib/fingertip';
import {
    addMonths,
    lastMonths,
    monthInfo,
    monthKey,
    monthRange,
    ofType,
    sum,
} from '@/lib/fingertip';

/** Meses exibidos no gráfico (DashboardController::MONTHS). */
const CHART_MONTHS = 6;

/* ---------- hooks ---------- */

function useMediaQuery(query: string) {
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

/* ---------- página ---------- */

type View = 'list' | 'charts' | 'new';

/** Props enviadas por DashboardController. */
type Props = {
    budget: number;
    expenses: TransactionRecord[];
    incomes: TransactionRecord[];
};

const withType = (
    list: TransactionRecord[],
    type: TransactionType,
): Transaction[] => list.map((e) => ({ ...e, type, key: `${type}-${e.id}` }));

export default function Dashboard({ budget, expenses, incomes }: Props) {
    const items = useMemo(
        () => [
            ...withType(expenses, 'despesa'),
            ...withType(incomes, 'receita'),
        ],
        [expenses, incomes],
    );
    const current = useMemo(() => monthKey(new Date()), []);
    /** Últimos meses até o atual, mais os meses futuros que já têm movimentações (parcelas). */
    const months = useMemo(() => {
        const past = lastMonths(CHART_MONTHS);
        const latest = items.reduce(
            (max, e) => (monthKey(e.date) > max ? monthKey(e.date) : max),
            current,
        );
        return monthRange(past[0], latest);
    }, [items, current]);
    const [picked, setMonth] = useState(current);
    // Se o mês escolhido deixou de existir (ex.: as parcelas futuras foram excluídas), volta ao atual.
    const month = months.includes(picked) ? picked : current;
    const [show, setShow] = useState<Show>('all');
    const [cat, setCat] = useState('all');
    const [bdType, setBdType] = useState<TransactionType>('despesa');
    const [view, setView] = useState<View>('list'); // usado só no mobile
    const isMobile = useMediaQuery('(max-width: 760px)');
    const { user } = usePage().props.auth;
    const userName = user?.name ?? 'Usuário';
    const initial = userName.trim().charAt(0).toUpperCase() || '?';

    const info = monthInfo(month);
    const monthItems = useMemo(
        () => items.filter((e) => monthKey(e.date) === month),
        [items, month],
    );
    const income = sum(ofType(monthItems, 'receita'));
    const expense = sum(ofType(monthItems, 'despesa'));
    /** O gráfico mostra 6 meses, terminando no atual ou no mês futuro escolhido. */
    const chartMonths = useMemo(() => {
        const end = month > current ? month : current;
        return monthRange(addMonths(end, 1 - CHART_MONTHS), end);
    }, [month, current]);
    const totals = useMemo(
        () =>
            chartMonths.map((k) => {
                const l = items.filter((e) => monthKey(e.date) === k);
                return {
                    income: sum(ofType(l, 'receita')),
                    expense: sum(ofType(l, 'despesa')),
                };
            }),
        [items, chartMonths],
    );

    const selectMonth = (k: string) => {
        setMonth(k);
        setShow('all');
        setCat('all');
    };
    const changeShow = (s: Show) => {
        setShow(s);
        setCat('all');
    };
    const pickCategory = (type: TransactionType, c: string) => {
        setShow(c === 'all' ? 'all' : type);
        setCat(c);
        if (isMobile) setView('list');
    };
    const added = (date: string) => {
        const k = monthKey(date);
        // Meses futuros só entram em `months` quando os novos dados chegam; basta não ser antigo demais.
        if (k >= months[0]) selectMonth(k);
        if (isMobile) setView('list');
    };
    const remove = (e: Transaction) => {
        if (
            e.installments &&
            !window.confirm(
                `"${e.description}" é parcelada: todas as ${e.installments} parcelas serão excluídas. Continuar?`,
            )
        )
            return;
        router.delete(
            e.type === 'receita'
                ? destroyIncome.url(e.id)
                : destroyExpense.url(e.id),
            { preserveScroll: true },
        );
    };
    const visible = (v: View) => !isMobile || view === v;

    return (
        <>
            <Head title="Extrato" />
            <div className="app">
                <div className="container">
                    <header className="topbar">
                        <FingertipLogo size={isMobile ? 30 : 38} />
                        <MonthSwitcher
                            months={months}
                            value={month}
                            onChange={selectMonth}
                            compact={isMobile}
                        />
                        <div className="topbar__actions">
                            {!isMobile && (
                                <a
                                    className="btn-primary btn-primary--sm"
                                    href="#nova"
                                >
                                    <Icon
                                        d={ICONS.plus}
                                        size={18}
                                        width={2.4}
                                    />
                                    Adicionar
                                </a>
                            )}
                            {isMobile ? (
                                <Link
                                    href={logout.url()}
                                    method="post"
                                    as="button"
                                    className="avatar-btn"
                                    aria-label={`Conta de ${userName}: sair`}
                                    title="Sair"
                                    onBefore={() =>
                                        window.confirm(
                                            `Sair da conta de ${userName}?`,
                                        )
                                    }
                                >
                                    {initial}
                                </Link>
                            ) : (
                                <div className="user-pill">
                                    <span
                                        className="user-pill__avatar"
                                        aria-hidden="true"
                                    >
                                        {initial}
                                    </span>
                                    <span className="user-pill__name">
                                        {userName}
                                    </span>
                                    <span
                                        className="user-pill__divider"
                                        aria-hidden="true"
                                    />
                                    <Link
                                        href={logout.url()}
                                        method="post"
                                        as="button"
                                        className="icon-btn user-pill__logout"
                                        aria-label="Sair"
                                        title="Sair"
                                    >
                                        <Icon d={ICONS.logout} size={18} />
                                    </Link>
                                </div>
                            )}
                        </div>
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
                                <CashflowChart
                                    months={chartMonths}
                                    totals={totals}
                                    selected={month}
                                    onSelect={selectMonth}
                                />
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
                            {visible('charts') && (
                                <CategoryBreakdown
                                    items={monthItems}
                                    type={bdType}
                                    onType={setBdType}
                                    activeCat={show === bdType ? cat : null}
                                    onPick={pickCategory}
                                />
                            )}
                        </div>
                        {visible('new') && (
                            <aside className="layout__side">
                                <TransactionForm onAdded={added} />
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
                            <Icon d={ICONS.list} size={22} />
                            Extrato
                        </button>
                        <button
                            type="button"
                            className="tabbar__fab"
                            aria-label="Nova movimentação"
                            onClick={() => setView('new')}
                        >
                            <Icon d={ICONS.plus} size={26} width={2.4} />
                        </button>
                        <button
                            type="button"
                            className={view === 'charts' ? 'is-on' : ''}
                            onClick={() => setView('charts')}
                        >
                            <Icon d={ICONS.chart} size={22} />
                            Gráficos
                        </button>
                    </nav>
                )}
            </div>
        </>
    );
}
