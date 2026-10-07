// Tipos, categorias, utilitários de formatação e dados de exemplo.

export const INCOME_COLOR = '#5EE1B0';
export const EXPENSE_COLOR = '#FF8A5B';

export const EXPENSE_CATEGORIES = [
    { id: 'moradia', name: 'Moradia', color: '#6C9EFF' },
    { id: 'alimentacao', name: 'Alimentação', color: '#FF8A5B' },
    { id: 'transporte', name: 'Transporte', color: '#B48CFF' },
    { id: 'saude', name: 'Saúde', color: '#FF6B9A' },
    { id: 'lazer', name: 'Lazer', color: '#FFD166' },
    { id: 'outros', name: 'Outros', color: '#A3ADBB' },
];

export const INCOME_CATEGORIES = [
    { id: 'salario', name: 'Salário', color: '#5EE1B0' },
    { id: 'freelance', name: 'Freelance', color: '#7FD4F5' },
    { id: 'investimentos', name: 'Investimentos', color: '#C3E88D' },
    { id: 'outras', name: 'Outras receitas', color: '#A3ADBB' },
];

/** type: "despesa" | "receita" */
export const categoriesFor = (type) =>
    type === 'receita' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
export const catById = (type, id) => {
    const list = categoriesFor(type);
    return list.find((c) => c.id === id) ?? list[list.length - 1];
};
export const DEFAULT_CATEGORY = { despesa: 'alimentacao', receita: 'salario' };

const MONTH_NAMES = [
    'janeiro',
    'fevereiro',
    'março',
    'abril',
    'maio',
    'junho',
    'julho',
    'agosto',
    'setembro',
    'outubro',
    'novembro',
    'dezembro',
];
const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const brl = (v) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export const signedBrl = (v) =>
    `${v < 0 ? '− ' : v > 0 ? '+ ' : ''}${brl(Math.abs(v))}`;

/** "2026-10" a partir de uma data ISO "2026-10-06" ou de um Date */
export const monthKey = (d) =>
    typeof d === 'string'
        ? d.slice(0, 7)
        : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

export const todayISO = () => {
    const d = new Date();
    return `${monthKey(d)}-${String(d.getDate()).padStart(2, '0')}`;
};

export const monthInfo = (key) => {
    const [y, m] = key.split('-').map(Number);
    const name = MONTH_NAMES[m - 1];
    return {
        key,
        year: y,
        name,
        short: name.slice(0, 3).replace(/^./, (c) => c.toUpperCase()),
        days: new Date(y, m, 0).getDate(),
    };
};

/** Últimos `n` meses terminando no mês atual, do mais antigo ao mais recente. */
export const lastMonths = (n = 6) => {
    const now = new Date();
    return Array.from({ length: n }, (_, i) =>
        monthKey(new Date(now.getFullYear(), now.getMonth() - (n - 1 - i), 1)),
    );
};

export const dayLabel = (iso) => {
    const [y, m, d] = iso.split('-').map(Number);
    return `${WEEKDAYS[new Date(y, m - 1, d).getDay()]}, ${String(d).padStart(2, '0')} ${MONTH_NAMES[m - 1].slice(0, 3)}`;
};

/** Aceita "1.234,56", "1234,56" ou "1234.56". */
export const parseAmount = (s) => {
    let v = String(s ?? '').trim();
    if (v.includes(',')) v = v.replace(/\./g, '').replace(',', '.');
    return parseFloat(v);
};

export const sum = (list) => list.reduce((a, e) => a + e.amount, 0);
export const ofType = (list, type) => list.filter((e) => e.type === type);

// ---- Dados de exemplo (remova `sampleTransactions()` do App quando conectar sua API) ----
const EXPENSES = [
    [1, 'Aluguel', 'moradia', 1850, true],
    [3, 'Supermercado', 'alimentacao', 412.4],
    [5, 'Conta de luz', 'moradia', 186.9],
    [6, 'Combustível', 'transporte', 230],
    [8, 'Farmácia', 'saude', 74.5],
    [10, 'Restaurante', 'alimentacao', 128],
    [12, 'Internet', 'moradia', 119.9, true],
    [14, 'Cinema', 'lazer', 62],
    [15, 'Aplicativo de transporte', 'transporte', 48.7],
    [18, 'Feira', 'alimentacao', 96.3],
    [20, 'Academia', 'saude', 109.9, true],
    [22, 'Streaming', 'lazer', 55.9, true],
    [25, 'Presente', 'outros', 150],
    [27, 'Padaria', 'alimentacao', 38.6],
];
const INCOMES = [
    [5, 'Salário', 'salario', 6200],
    [15, 'Projeto freelance', 'freelance', 1200],
    [20, 'Rendimento da poupança', 'investimentos', 96],
];

export function sampleTransactions() {
    const months = lastMonths(6);
    const today = new Date().getDate();
    const factors = [0.94, 1.06, 0.97, 1.12, 0.9, 1];
    const freela = [0.6, 1.3, 0, 1.8, 0.9, 1];
    const isPast = (mi, day) => mi < months.length - 1 || day <= today;
    return months.flatMap((key, mi) => [
        ...EXPENSES.filter(([day]) => isPast(mi, day)).map(
            ([day, desc, cat, amount, fixed], i) => ({
                id: `${key}-d${i}`,
                type: 'despesa',
                date: `${key}-${String(day).padStart(2, '0')}`,
                desc,
                cat,
                amount:
                    Math.round(
                        amount *
                            (fixed
                                ? 1
                                : factors[mi] *
                                  (0.9 + ((i * 37 + mi * 11) % 20) / 100)) *
                            100,
                    ) / 100,
            }),
        ),
        ...INCOMES.filter(([day]) => isPast(mi, day))
            .map(([day, desc, cat, amount], i) => ({
                id: `${key}-r${i}`,
                type: 'receita',
                date: `${key}-${String(day).padStart(2, '0')}`,
                desc,
                cat,
                amount:
                    Math.round(
                        amount *
                            (i === 0
                                ? 1
                                : i === 1
                                  ? freela[mi]
                                  : 0.9 + mi * 0.05) *
                            100,
                    ) / 100,
            }))
            .filter((e) => e.amount > 0),
    ]);
}
