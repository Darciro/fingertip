<?php

namespace App\Http\Controllers;

use App\Enums\IncomeCategory;
use App\Http\Controllers\Concerns\ValidatesTransaction;
use App\Models\Income;
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class IncomeController extends Controller
{
    use ValidatesTransaction;

    /**
     * Valida o formulário "Nova movimentação" (tipo receita) e grava a receita do usuário logado.
     */
    public function store(Request $request, #[CurrentUser] User $user): RedirectResponse
    {
        $user->incomes()->create($this->validateTransaction($request, IncomeCategory::class));

        return back();
    }

    /**
     * Exclui uma receita (botão de lixeira do extrato); só o dono pode excluir.
     */
    public function destroy(Income $income): RedirectResponse
    {
        Gate::authorize('delete', $income);

        $income->delete();

        return back();
    }
}
