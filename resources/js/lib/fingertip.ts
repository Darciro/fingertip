// Tipos, categorias e utilitários de formatação (portado de layout/src/data.js).

export type TransactionType = "despesa" | "receita";

export type ExpenseCategoryId =
    "moradia" | "alimentacao" | "transporte" | "saude" | "lazer" | "outros";
export type IncomeCategoryId =
    "salario" | "freelance" | "investimentos" | "outras";
export type CategoryId = ExpenseCategoryId | IncomeCategoryId;

export type Category = { id: CategoryId; name: string; color: string };

/** Como os models App\Models\Expense e App\Models\Income chegam do DashboardController. */
export type TransactionRecord = {
    id: number;
    description: string;
    amount: number;
    date: string; // ISO "2026-10-06"
    category: CategoryId;
    settled: boolean; // despesa paga / receita recebida
};

/** Despesa ou receita já com o tipo, como o extrato usa. */
export type Transaction = TransactionRecord & {
    type: TransactionType;
    key: string;
};

/** As cores vêm dos tokens definidos no :root (resources/css/fingertip.css). */
export const INCOME_COLOR = "var(--income)";
export const EXPENSE_COLOR = "var(--expense)";
export const NEGATIVE_COLOR = "var(--negative)";

export const EXPENSE_CATEGORIES: Category[] = [
    { id: "moradia", name: "Moradia", color: "var(--cat-moradia)" },
    { id: "alimentacao", name: "Alimentação", color: "var(--cat-alimentacao)" },
    { id: "transporte", name: "Transporte", color: "var(--cat-transporte)" },
    { id: "saude", name: "Saúde", color: "var(--cat-saude)" },
    { id: "lazer", name: "Lazer", color: "var(--cat-lazer)" },
    { id: "outros", name: "Outros", color: "var(--cat-outros)" },
];

export const INCOME_CATEGORIES: Category[] = [
    { id: "salario", name: "Salário", color: "var(--cat-salario)" },
    { id: "freelance", name: "Freelance", color: "var(--cat-freelance)" },
    {
        id: "investimentos",
        name: "Investimentos",
        color: "var(--cat-investimentos)",
    },
    { id: "outras", name: "Outras receitas", color: "var(--cat-outras)" },
];

export const categoriesFor = (type: TransactionType) =>
    type === "receita" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

export const catById = (type: TransactionType, id: string): Category => {
    const list = categoriesFor(type);
    return list.find((c) => c.id === id) ?? list[list.length - 1];
};

/** Rótulos de `settled`: [quitada, pendente]. */
export const SETTLED_LABELS: { [T in TransactionType]: [string, string] } = {
    despesa: ["Paga", "A pagar"],
    receita: ["Recebida", "A receber"],
};

export const DEFAULT_CATEGORY: { [T in TransactionType]: CategoryId } = {
    despesa: "alimentacao",
    receita: "salario",
};

/** Versão translúcida de uma cor (equivale ao sufixo hex de alfa do layout, ex. `#6C9EFF22`). */
export const tint = (color: string, pct: number) =>
    `color-mix(in srgb, ${color} ${pct}%, transparent)`;

const MONTH_NAMES = [
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
];
const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export const brl = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
/**
 * Máscara do campo Valor: aceita só dígitos e os lê como centavos ("123456" → "1.234,56").
 * Limitado a 10 dígitos, o máximo aceito pelo servidor (99.999.999,99).
 */
export const maskAmount = (raw: string) => {
    const digits = raw.replace(/\D/g, "").replace(/^0+/, "").slice(0, 10);
    if (!digits) return "";
    return (Number(digits) / 100).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

export const shortBrl = (v: number) =>
    v >= 1000
        ? `R$ ${(v / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil`
        : `R$ ${Math.round(v)}`;

/** "2026-10" a partir de uma data ISO "2026-10-06" ou de um Date */
export const monthKey = (d: string | Date) =>
    typeof d === "string"
        ? d.slice(0, 7)
        : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

export const todayISO = () => {
    const d = new Date();
    return `${monthKey(d)}-${String(d.getDate()).padStart(2, "0")}`;
};

export const monthInfo = (key: string) => {
    const [y, m] = key.split("-").map(Number);
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

export const dayLabel = (iso: string) => {
    const [y, m, d] = iso.split("-").map(Number);
    return `${WEEKDAYS[new Date(y, m - 1, d).getDay()]}, ${String(d).padStart(2, "0")} ${MONTH_NAMES[m - 1].slice(0, 3)}`;
};

export const signedBrl = (v: number) =>
    `${v < 0 ? "− " : v > 0 ? "+ " : ""}${brl(Math.abs(v))}`;

export const sum = (list: { amount: number }[]) =>
    list.reduce((a, e) => a + e.amount, 0);
export const ofType = (list: Transaction[], type: TransactionType) =>
    list.filter((e) => e.type === type);
