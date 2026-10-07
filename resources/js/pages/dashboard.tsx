import { Head, router } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
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
import { lastMonths, monthInfo, monthKey, ofType, sum } from '@/lib/fingertip';

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
    const months = useMemo(() => lastMonths(6), []);
    const [month, setMonth] = useState(months[months.length - 1]);
    const [show, setShow] = useState<Show>('all');
    const [cat, setCat] = useState('all');
    const [bdType, setBdType] = useState<TransactionType>('despesa');
    const [view, setView] = useState<View>('list'); // usado só no mobile
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
        if (months.includes(k)) selectMonth(k);
        if (isMobile) setView('list');
    };
    const remove = (e: Transaction) =>
        router.delete(
            e.type === 'receita'
                ? destroyIncome.url(e.id)
                : destroyExpense.url(e.id),
            { preserveScroll: true },
        );
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
                        />
                        {!isMobile && (
                            <a
                                className="btn-primary btn-primary--sm"
                                href="#nova"
                            >
                                <Icon d={ICONS.plus} size={18} width={2.4} />
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
                            <div className="row">
                                {visible('charts') && (
                                    <CashflowChart
                                        months={months}
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
                            </div>
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
