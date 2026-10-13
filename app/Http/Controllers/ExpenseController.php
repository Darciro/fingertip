<?php

namespace App\Http\Controllers;

use App\Enums\ExpenseCategory;
use App\Http\Controllers\Concerns\ValidatesTransaction;
use App\Models\Expense;
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class ExpenseController extends Controller
{
    use ValidatesTransaction;

    /**
     * Valida o formulário "Nova movimentação" (tipo despesa) e grava a despesa do usuário logado.
     */
    public function store(Request $request, #[CurrentUser] User $user): RedirectResponse
    {
        $user->expenses()->create($this->validateTransaction($request, ExpenseCategory::class));

        return back();
    }

    /**
     * Exclui uma despesa (botão de lixeira do extrato); só o dono pode excluir.
     */
    public function destroy(Expense $expense): RedirectResponse
    {
        Gate::authorize('delete', $expense);

        $expense->delete();

        return back();
    }
}
