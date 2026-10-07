<?php

namespace App\Http\Controllers;

use App\Enums\IncomeCategory;
use App\Http\Controllers\Concerns\ValidatesTransaction;
use App\Models\Income;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class IncomeController extends Controller
{
    use ValidatesTransaction;

    /**
     * Valida o formulário "Nova movimentação" (tipo receita) e grava a receita.
     */
    public function store(Request $request): RedirectResponse
    {
        Income::create($this->validateTransaction($request, IncomeCategory::class));

        return back();
    }

    /**
     * Exclui uma receita (botão de lixeira do extrato).
     */
    public function destroy(Income $income): RedirectResponse
    {
        $income->delete();

        return back();
    }
}
