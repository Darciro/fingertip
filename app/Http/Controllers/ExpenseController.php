<?php

namespace App\Http\Controllers;

use App\Enums\ExpenseCategory;
use App\Http\Controllers\Concerns\ValidatesTransaction;
use App\Models\Expense;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ExpenseController extends Controller
{
    use ValidatesTransaction;

    /**
     * Valida o formulário "Nova movimentação" (tipo despesa) e grava a despesa.
     */
    public function store(Request $request): RedirectResponse
    {
        Expense::create($this->validateTransaction($request, ExpenseCategory::class));

        return back();
    }

    /**
     * Exclui uma despesa (botão de lixeira do extrato).
     */
    public function destroy(Expense $expense): RedirectResponse
    {
        $expense->delete();

        return back();
    }
}
