<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /** Orçamento mensal de despesas exibido no dashboard. */
    private const BUDGET = 4500;

    /** Meses exibidos no gráfico do dashboard (incluindo o atual). */
    private const MONTHS = 6;

    /**
     * Dashboard com as receitas e despesas dos últimos meses do usuário logado,
     * além das movimentações futuras (como as próximas parcelas de uma compra parcelada).
     */
    public function __invoke(#[CurrentUser] User $user): Response
    {
        $since = now()->startOfMonth()->subMonths(self::MONTHS - 1)->toDateString();
        $columns = ['id', 'description', 'amount', 'date', 'category', 'settled'];

        return Inertia::render('dashboard', [
            'budget' => self::BUDGET,
            // Sem limite superior: as parcelas futuras também vão para o dashboard.
            'expenses' => $user->expenses()->where('date', '>=', $since)->orderByDesc('date')
                ->get([...$columns, 'installment_group', 'installment', 'installments']),
            'incomes' => $user->incomes()->where('date', '>=', $since)->orderByDesc('date')->get($columns),
        ]);
    }
}
