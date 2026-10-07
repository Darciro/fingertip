<?php

namespace App\Http\Controllers\Concerns;

use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Validação do formulário "Nova movimentação", comum a despesas e receitas.
 */
trait ValidatesTransaction
{
    /**
     * @param  class-string<\BackedEnum>  $categories
     * @return array{description: string, amount: string, date: string, category: string, settled: bool}
     */
    protected function validateTransaction(Request $request, string $categories): array
    {
        // O campo de valor aceita o formato brasileiro ("1.234,56").
        if (is_string($amount = $request->input('amount')) && str_contains($amount, ',')) {
            $request->merge(['amount' => str_replace(['.', ','], ['', '.'], trim($amount))]);
        }

        /** @var array{description: string, amount: string, date: string, category: string, settled: bool} */
        return $request->validate([
            'description' => ['required', 'string', 'max:120'],
            'amount' => ['required', 'numeric', 'gt:0', 'max:99999999.99', 'decimal:0,2'],
            'date' => ['required', 'date_format:Y-m-d'],
            'category' => ['required', Rule::enum($categories)],
            'settled' => ['required', 'boolean'],
        ], [
            'description.required' => 'Informe uma descrição.',
            'description.max' => 'A descrição deve ter no máximo :max caracteres.',
            'amount.required' => 'Informe um valor maior que zero.',
            'amount.numeric' => 'Informe um valor válido, ex.: 1.234,56.',
            'amount.gt' => 'Informe um valor maior que zero.',
            'amount.max' => 'O valor é alto demais.',
            'amount.decimal' => 'Use no máximo duas casas decimais.',
            'date.required' => 'Informe a data.',
            'date.date_format' => 'Informe uma data válida.',
            'category.required' => 'Escolha uma categoria.',
            'category.enum' => 'Escolha uma categoria válida.',
            'settled.required' => 'Informe se já foi paga/recebida.',
            'settled.boolean' => 'Informe se já foi paga/recebida.',
        ]);
    }
}
